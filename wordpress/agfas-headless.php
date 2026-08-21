<?php
/**
 * Plugin Name: AGFAS Headless Bridge
 * Description: Connects the Next.js storefront to WooCommerce — payment methods, quotation requests, and the enquiry inbox.
 * Version:     6.0.0
 * Author:      AGFAS
 *
 * INSTALL
 *   Upload to:  wp-content/mu-plugins/agfas-headless.php
 *
 * WHAT IT ADDS
 *   - REST: GET  /wp-json/agfas/v1/payment-methods  enabled gateways for checkout
 *   - REST: POST /wp-json/agfas/v1/quote            quotation requests
 *   - "AGFAS Enquiries" admin screen: every quotation and enquiry, kept in WordPress
 *   - Sends shoppers back to the storefront after paying, not to WordPress
 *
 * Site text lives in a separate plugin, agfas-content.php, so an issue in one
 * never takes down the other. This file works without it; the quotation
 * destination then falls back to the WordPress admin email.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The Next.js storefront origin. No trailing slash. */
if ( ! defined( 'AGFAS_STOREFRONT_ORIGIN' ) ) {
	define( 'AGFAS_STOREFRONT_ORIGIN', 'https://agfasgas.com' );
}

/**
 * Where quotation requests are emailed.
 *
 * Reads the address from the content plugin when it is installed, and falls
 * back to the WordPress admin email so enquiries are never sent nowhere.
 */
function agfas_quote_recipient() {
	if ( function_exists( 'agfas_content' ) ) {
		$content = agfas_content();
		if ( ! empty( $content['quote_email'] ) && is_email( $content['quote_email'] ) ) {
			return $content['quote_email'];
		}
	}
	return get_option( 'admin_email' );
}

/* -------------------------------------------------------------------------
 * REST
 * ---------------------------------------------------------------------- */

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'agfas/v1',
			'/payment-methods',
			array(
				'methods'             => 'GET',
				'permission_callback' => '__return_true',
				'callback'            => 'agfas_payment_methods',
			)
		);

		register_rest_route(
			'agfas/v1',
			'/quote',
			array(
				'methods'             => 'POST',
				'permission_callback' => '__return_true',
				'callback'            => 'agfas_handle_quote',
			)
		);
	}
);

function agfas_payment_methods() {
	if ( ! function_exists( 'WC' ) ) {
		return rest_ensure_response( array() );
	}

	$available = WC()->payment_gateways()->get_available_payment_gateways();
	$out       = array();

	foreach ( $available as $gateway ) {
		$out[] = array(
			'id'          => $gateway->id,
			'title'       => wp_strip_all_tags( $gateway->get_title() ),
			'description' => wp_kses_post( $gateway->get_description() ),
			// Offline gateways finish on our own site; others may hand off to
			// the payment provider.
			'offline'     => in_array( $gateway->id, array( 'bacs', 'cheque', 'cod' ), true ),
		);
	}

	return rest_ensure_response( $out );
}

/**
 * Quotation request → email to the sales address.
 *
 * Only ever mails the address configured in the admin screen, so it cannot be
 * used as an open relay. A honeypot field and a short per-IP throttle keep
 * casual spam down.
 */
function agfas_handle_quote( WP_REST_Request $request ) {
	$params = $request->get_json_params();

	// Bots fill hidden fields; humans never see this one.
	if ( ! empty( $params['website'] ) ) {
		return new WP_REST_Response( array( 'ok' => true ), 200 );
	}

	$name    = sanitize_text_field( $params['name'] ?? '' );
	$email   = sanitize_email( $params['email'] ?? '' );
	$phone   = sanitize_text_field( $params['phone'] ?? '' );
	$company = sanitize_text_field( $params['company'] ?? '' );
	$message = sanitize_textarea_field( $params['message'] ?? '' );
	$gas     = sanitize_text_field( $params['gas'] ?? '' );
	$kind    = ( 'contact' === ( $params['kind'] ?? '' ) ) ? 'contact' : 'quote';
	$items   = is_array( $params['items'] ?? null ) ? $params['items'] : array();

	if ( '' === $name || ! is_email( $email ) ) {
		return new WP_Error( 'agfas_invalid', 'Please give a name and a valid email address.', array( 'status' => 400 ) );
	}

	$ip    = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
	$key   = 'agfas_quote_' . md5( $ip );
	if ( get_transient( $key ) ) {
		return new WP_Error( 'agfas_throttled', 'Please wait a moment before sending another request.', array( 'status' => 429 ) );
	}
	set_transient( $key, 1, 60 );

	$to = agfas_quote_recipient();

	$heading = ( 'contact' === $kind )
		? 'Enquiry from the AGFAS website'
		: 'Quotation request from the AGFAS website';

	$lines = array(
		$heading,
		'',
		'Name:     ' . $name,
		'Email:    ' . $email,
		'Phone:    ' . ( '' !== $phone ? $phone : '—' ),
		'Company:  ' . ( '' !== $company ? $company : '—' ),
		'Gas type: ' . ( '' !== $gas ? $gas : '—' ),
		'',
		'Requirements:',
		'' !== $message ? $message : '(none given)',
	);

	$lines_items = array();
	if ( ! empty( $items ) ) {
		$lines[] = '';
		$lines[] = 'Products of interest:';
		foreach ( $items as $item ) {
			$item_name = sanitize_text_field( $item['name'] ?? '' );
			$qty       = absint( $item['quantity'] ?? 1 );
			if ( '' !== $item_name ) {
				$lines[]       = sprintf( '  - %s x %d', $item_name, $qty );
				$lines_items[] = array( 'name' => $item_name, 'quantity' => $qty );
			}
		}
	}

	// Recorded before the email goes out, so a mail failure cannot lose a lead.
	$post_id = agfas_store_enquiry(
		array(
			'kind'    => $kind,
			'name'    => $name,
			'email'   => $email,
			'phone'   => $phone,
			'company' => $company,
			'gas'     => $gas,
			'message' => $message,
			'items'   => $lines_items,
			'body'    => implode( "
", $lines ),
		)
	);

	$sent = wp_mail(
		$to,
		sprintf( '%s — %s', ( 'contact' === $kind ) ? 'Website enquiry' : 'Quotation request', $name ),
		implode( "\n", $lines ),
		array(
			'Content-Type: text/plain; charset=UTF-8',
			'Reply-To: ' . $name . ' <' . $email . '>',
		)
	);

	if ( $post_id ) {
		update_post_meta( $post_id, '_agfas_emailed', $sent ? 'yes' : 'no' );
	}

	// The enquiry is stored either way, so the customer is never asked to send
	// it twice. A failed email is flagged in the admin list instead.
	if ( ! $sent && ! $post_id ) {
		return new WP_Error(
			'agfas_mail_failed',
			'The request could not be sent. Please email us directly.',
			array( 'status' => 502 )
		);
	}

	return new WP_REST_Response( array( 'ok' => true ), 200 );
}

/* -------------------------------------------------------------------------
 * Enquiry inbox
 *
 * Every quotation and contact enquiry is stored as a post so it can be read in
 * wp-admin, independently of whether the notification email was delivered —
 * shared hosts drop mail often enough that email alone is not a safe record of
 * a sales lead.
 * ---------------------------------------------------------------------- */
const AGFAS_ENQUIRY_CPT = 'agfas_enquiry';

/**
 * Enquiries are created by the REST endpoint, never by hand, so the editor is
 * read-only: no "Add New", no block editor, just the list and a detail view.
 */
add_action(
	'init',
	static function () {
		register_post_type(
			AGFAS_ENQUIRY_CPT,
			array(
				'labels'          => array(
					'name'               => 'Enquiries',
					'singular_name'      => 'Enquiry',
					'menu_name'          => 'AGFAS Enquiries',
					'all_items'          => 'All enquiries',
					'search_items'       => 'Search enquiries',
					'not_found'          => 'No enquiries yet.',
					'not_found_in_trash' => 'No enquiries in the bin.',
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => true,
				'menu_icon'       => 'dashicons-email-alt',
				'menu_position'   => 31,
				'supports'        => array( 'title' ),
				'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
				'map_meta_cap'    => true,
				'has_archive'     => false,
				'rewrite'         => false,
				'query_var'       => false,
			)
		);
	}
);

/**
 * Store one enquiry.
 *
 * @param array $data Sanitised enquiry fields.
 * @return int|false Post ID, or false if it could not be saved.
 */
function agfas_store_enquiry( array $data ) {
	$is_quote = ( 'quote' === ( $data['kind'] ?? 'quote' ) );

	$post_id = wp_insert_post(
		array(
			'post_type'   => AGFAS_ENQUIRY_CPT,
			'post_status' => 'publish',
			'post_title'  => sprintf(
				'%s — %s',
				$is_quote ? 'Quotation' : 'Enquiry',
				$data['name'] ?? 'Unknown'
			),
			'post_content' => $data['body'] ?? '',
		),
		true
	);

	if ( is_wp_error( $post_id ) || ! $post_id ) {
		return false;
	}

	foreach ( array( 'kind', 'name', 'email', 'phone', 'company', 'gas', 'message' ) as $field ) {
		update_post_meta( $post_id, '_agfas_' . $field, $data[ $field ] ?? '' );
	}
	update_post_meta( $post_id, '_agfas_items', $data['items'] ?? array() );

	return $post_id;
}

/* ------------------------------- list table ------------------------------ */

add_filter(
	'manage_' . AGFAS_ENQUIRY_CPT . '_posts_columns',
	static function () {
		return array(
			'cb'            => '<input type="checkbox" />',
			'agfas_type'    => 'Type',
			'agfas_name'    => 'From',
			'agfas_contact' => 'Contact',
			'agfas_summary' => 'Wants',
			'agfas_mail'    => 'Emailed',
			'date'          => 'Received',
		);
	}
);

add_action(
	'manage_' . AGFAS_ENQUIRY_CPT . '_posts_custom_column',
	static function ( $column, $post_id ) {
		switch ( $column ) {
			case 'agfas_type':
				$kind = get_post_meta( $post_id, '_agfas_kind', true );
				echo ( 'contact' === $kind )
					? '<span style="color:#646970">Enquiry</span>'
					: '<strong style="color:#c2410c">Quotation</strong>';
				break;

			case 'agfas_name':
				$name    = get_post_meta( $post_id, '_agfas_name', true );
				$company = get_post_meta( $post_id, '_agfas_company', true );
				echo '<a href="' . esc_url( get_edit_post_link( $post_id ) ) . '"><strong>' . esc_html( $name ) . '</strong></a>';
				if ( $company ) {
					echo '<br><span style="color:#646970">' . esc_html( $company ) . '</span>';
				}
				break;

			case 'agfas_contact':
				$email = get_post_meta( $post_id, '_agfas_email', true );
				$phone = get_post_meta( $post_id, '_agfas_phone', true );
				if ( $email ) {
					echo '<a href="mailto:' . esc_attr( $email ) . '">' . esc_html( $email ) . '</a>';
				}
				if ( $phone ) {
					echo '<br><a href="tel:' . esc_attr( $phone ) . '">' . esc_html( $phone ) . '</a>';
				}
				break;

			case 'agfas_summary':
				$items = get_post_meta( $post_id, '_agfas_items', true );
				$gas   = get_post_meta( $post_id, '_agfas_gas', true );
				if ( is_array( $items ) && $items ) {
					$names = array();
					foreach ( $items as $item ) {
						$names[] = esc_html( $item['name'] ) . ' &times;' . absint( $item['quantity'] );
					}
					echo wp_kses_post( implode( '<br>', $names ) );
				} else {
					echo '<span style="color:#646970">—</span>';
				}
				if ( $gas ) {
					echo '<br><span style="color:#646970">Gas: ' . esc_html( $gas ) . '</span>';
				}
				break;

			case 'agfas_mail':
				$emailed = get_post_meta( $post_id, '_agfas_emailed', true );
				if ( 'no' === $emailed ) {
					echo '<span style="color:#b32d2e" title="The notification email did not send. The enquiry is still recorded here.">Failed</span>';
				} elseif ( 'yes' === $emailed ) {
					echo '<span style="color:#007017">Sent</span>';
				} else {
					echo '<span style="color:#646970">—</span>';
				}
				break;
		}
	},
	10,
	2
);

/** Newest first is the only ordering that makes sense for an inbox. */
add_action(
	'pre_get_posts',
	static function ( $query ) {
		if ( ! is_admin() || ! $query->is_main_query() ) {
			return;
		}
		if ( AGFAS_ENQUIRY_CPT !== $query->get( 'post_type' ) ) {
			return;
		}
		if ( ! $query->get( 'orderby' ) ) {
			$query->set( 'orderby', 'date' );
			$query->set( 'order', 'DESC' );
		}
	}
);

/* ------------------------------ detail view ------------------------------ */

add_action(
	'add_meta_boxes',
	static function () {
		add_meta_box(
			'agfas_enquiry_detail',
			'Enquiry',
			'agfas_render_enquiry_detail',
			AGFAS_ENQUIRY_CPT,
			'normal',
			'high'
		);
	}
);

/**
 * Read-only detail panel.
 *
 * @param WP_Post $post Current enquiry.
 */
function agfas_render_enquiry_detail( $post ) {
	$get = static function ( $k ) use ( $post ) {
		return get_post_meta( $post->ID, '_agfas_' . $k, true );
	};
	$email = $get( 'email' );
	$phone = $get( 'phone' );
	$items = $get( 'items' );

	$rows = array(
		'Name'    => esc_html( $get( 'name' ) ),
		'Company' => $get( 'company' ) ? esc_html( $get( 'company' ) ) : '—',
		'Email'   => $email ? '<a href="mailto:' . esc_attr( $email ) . '">' . esc_html( $email ) . '</a>' : '—',
		'Phone'   => $phone ? '<a href="tel:' . esc_attr( $phone ) . '">' . esc_html( $phone ) . '</a>' : '—',
		'Gas type' => $get( 'gas' ) ? esc_html( $get( 'gas' ) ) : '—',
	);
	?>
	<table class="form-table" role="presentation">
		<tbody>
		<?php foreach ( $rows as $label => $value ) : ?>
			<tr>
				<th scope="row" style="width:140px"><?php echo esc_html( $label ); ?></th>
				<td><?php echo wp_kses_post( $value ); ?></td>
			</tr>
		<?php endforeach; ?>

		<?php if ( is_array( $items ) && $items ) : ?>
			<tr>
				<th scope="row">Products</th>
				<td>
					<ul style="margin:0">
						<?php foreach ( $items as $item ) : ?>
							<li><?php echo esc_html( $item['name'] ); ?> &times; <?php echo absint( $item['quantity'] ); ?></li>
						<?php endforeach; ?>
					</ul>
				</td>
			</tr>
		<?php endif; ?>

			<tr>
				<th scope="row">Requirements</th>
				<td>
					<?php
					$message = $get( 'message' );
					echo $message
						? nl2br( esc_html( $message ) )
						: '<span style="color:#646970">(none given)</span>';
					?>
				</td>
			</tr>
		</tbody>
	</table>

	<?php if ( 'no' === get_post_meta( $post->ID, '_agfas_emailed', true ) ) : ?>
		<div class="notice notice-warning inline" style="margin:12px 0 0">
			<p>
				The notification email for this enquiry failed to send. The enquiry
				itself is safe — but check your mail configuration, because order
				confirmations use the same route.
			</p>
		</div>
	<?php endif; ?>

	<p style="margin-top:12px">
		<?php if ( $email ) : ?>
			<a class="button button-primary" href="mailto:<?php echo esc_attr( $email ); ?>?subject=<?php echo rawurlencode( 'Re: your AGFAS enquiry' ); ?>">
				Reply by email
			</a>
		<?php endif; ?>
	</p>
	<?php
}

/** Nothing here is editable, so hide the block editor's publishing controls. */
add_action(
	'admin_head',
	static function () {
		global $post_type;
		if ( AGFAS_ENQUIRY_CPT === $post_type ) {
			echo '<style>#minor-publishing-actions,#misc-publishing-actions .misc-pub-post-status,#misc-publishing-actions .misc-pub-visibility{display:none}</style>';
		}
	}
);

/**
 * Send shoppers back to the storefront after paying.
 *
 * Redirect gateways such as toyyibPay hand the customer to their own site and
 * then return them to WooCommerce's order-received page. That page lives on
 * WordPress, which customers are never meant to see — and while the site is in
 * "Coming soon" mode they would land on the placeholder instead of a receipt.
 *
 * Pointing the return URL at the storefront's own confirmation keeps the whole
 * purchase on one domain.
 */
add_filter(
	'woocommerce_get_return_url',
	static function ( $url, $order ) {
		if ( ! $order instanceof WC_Order ) {
			return $url;
		}

		return add_query_arg(
			array( 'key' => $order->get_order_key() ),
			AGFAS_STOREFRONT_ORIGIN . '/order/' . $order->get_id()
		);
	},
	10,
	2
);

/* -------------------------------------------------------------------------
 * CORS + checkout handoff
 * ---------------------------------------------------------------------- */

add_filter(
	'allowed_http_origins',
	static function ( $origins ) {
		$origins[] = AGFAS_STOREFRONT_ORIGIN;
		$origins[] = 'http://localhost:3000';
		return $origins;
	}
);

/**
 * The storefront keeps its cart in a Store API session the shopper's own
 * browser has never held. On checkout it sends them here with the line items,
 * and this rebuilds the cart under their WooCommerce session so payment
 * gateways, tax, shipping and order emails all behave normally.
 *
 * Only product IDs and quantities are accepted, and they only ever affect the
 * visitor's own cart, so no shared secret is required.
 */
add_action(
	'template_redirect',
	static function () {
		if ( empty( $_GET['agfas-handoff'] ) || ! function_exists( 'WC' ) ) {
			return;
		}

		$items = isset( $_GET['items'] ) ? sanitize_text_field( wp_unslash( $_GET['items'] ) ) : '';
		if ( '' === $items ) {
			wp_safe_redirect( wc_get_cart_url() );
			exit;
		}

		if ( null === WC()->cart ) {
			wc_load_cart();
		}

		// Replace rather than append, so going back and forth does not double up.
		WC()->cart->empty_cart();

		$added = 0;
		foreach ( explode( ',', $items ) as $pair ) {
			$parts      = explode( ':', $pair );
			$product_id = isset( $parts[0] ) ? absint( $parts[0] ) : 0;
			$quantity   = isset( $parts[1] ) ? absint( $parts[1] ) : 1;

			if ( $product_id <= 0 || $quantity <= 0 ) {
				continue;
			}

			$product = wc_get_product( $product_id );
			if ( ! $product || ! $product->is_purchasable() || ! $product->is_in_stock() ) {
				continue;
			}

			if ( WC()->cart->add_to_cart( $product_id, $quantity ) ) {
				++$added;
			}
		}

		if ( 0 === $added ) {
			wc_add_notice( __( 'Those items are no longer available. Please try again.', 'agfas' ), 'error' );
			wp_safe_redirect( wc_get_cart_url() );
			exit;
		}

		wp_safe_redirect( wc_get_checkout_url() );
		exit;
	}
);
