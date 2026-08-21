<?php
/**
 * Plugin Name: AGFAS Site Content
 * Description: Edit the storefront's text from WordPress. Independent of the commerce bridge, so a problem in one never takes out the other.
 * Version:     1.0.0
 * Author:      AGFAS
 *
 * INSTALL
 *   Upload to:  wp-content/mu-plugins/agfas-content.php
 *
 * Adds an "AGFAS Content" menu in the WordPress admin, and serves that text to
 * the storefront at GET /wp-json/agfas/v1/content.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const AGFAS_OPTION = 'agfas_site_content';

/**
 * Every editable field on the storefront.
 *
 * Add a field here and it appears in the admin screen, is saved, and is served
 * over REST — no other changes needed.
 *
 * type: text | textarea | url | email
 */
function agfas_schema() {
	return array(
		'hero'      => array(
			'label'  => 'Home — hero',
			'fields' => array(
				'hero_eyebrow'        => array( 'Eyebrow label', 'text', 'Gas detection · Malaysia' ),
				'hero_line1'          => array( 'Headline line 1', 'text', 'You cannot smell' ),
				'hero_line2'          => array( 'Headline line 2', 'text', 'a leak in time.' ),
				'hero_accent'         => array( 'Headline line 3 (orange)', 'text', 'A detector can.' ),
				'hero_intro'          => array( 'Intro paragraph', 'textarea', 'AGFAS builds gas leak detectors and fire safety equipment for Malaysian kitchens, homes and worksites — sized for LPG cylinders and piped natural gas alike.' ),
				'hero_cta1_label'     => array( 'Primary button label', 'text', 'Browse detectors' ),
				'hero_cta1_href'      => array( 'Primary button link', 'text', '/products' ),
				'hero_cta2_label'     => array( 'Secondary button label', 'text', 'Ask about a site survey' ),
				'hero_cta2_href'      => array( 'Secondary button link', 'text', '/contact' ),
			),
		),
		'specs'     => array(
			'label'  => 'Home — spec strip',
			'fields' => array(
				'spec1_value' => array( 'Spec 1 value', 'text', '20' ),
				'spec1_unit'  => array( 'Spec 1 unit', 'text', '%LEL' ),
				'spec1_label' => array( 'Spec 1 label', 'text', 'Alarm threshold' ),
				'spec2_value' => array( 'Spec 2 value', 'text', '85' ),
				'spec2_unit'  => array( 'Spec 2 unit', 'text', 'dB' ),
				'spec2_label' => array( 'Spec 2 label', 'text', 'Siren at 1 metre' ),
				'spec3_value' => array( 'Spec 3 value', 'text', '24/7' ),
				'spec3_unit'  => array( 'Spec 3 unit', 'text', '' ),
				'spec3_label' => array( 'Spec 3 label', 'text', 'Continuous sampling' ),
				'spec4_value' => array( 'Spec 4 value', 'text', '5' ),
				'spec4_unit'  => array( 'Spec 4 unit', 'text', 'yr' ),
				'spec4_label' => array( 'Spec 4 label', 'text', 'Sensor life' ),
			),
		),
		'nav'       => array(
			'label'  => 'Navigation menu',
			'fields' => array(
				'nav_products' => array( 'Menu item 1 (catalogue)', 'text', 'Products' ),
				'nav_about'    => array( 'Menu item 2 (about)', 'text', 'Why AGFAS' ),
				'nav_blog'     => array( 'Menu item 3 (blog)', 'text', 'Safety notes' ),
				'nav_contact'  => array( 'Menu item 4 (contact)', 'text', 'Contact' ),
			),
		),
		'shop'      => array(
			'label'  => 'Catalogue page',
			'fields' => array(
				'shop_title' => array( 'Page heading', 'text', 'Detectors and safety equipment' ),
				'shop_lead'  => array( 'Page intro', 'textarea', 'Gas leak detectors, alarms and fire safety equipment, held in stock in Malaysia.' ),
			),
		),
		'catalogue' => array(
			'label'  => 'Home — catalogue section',
			'fields' => array(
				'cat_eyebrow' => array( 'Eyebrow label', 'text', 'Catalogue' ),
				'cat_title'   => array( 'Section heading', 'text', 'Detectors and safety equipment' ),
				'cat_lead'    => array( 'Section intro', 'textarea', 'Every unit we stock is chosen for one thing: it has to alarm early enough that someone can act.' ),
			),
		),
		'install'   => array(
			'label'  => 'Home — installation steps',
			'fields' => array(
				'install_eyebrow' => array( 'Eyebrow label', 'text', 'Installation' ),
				'install_title'   => array( 'Section heading', 'text', 'Three steps, then it looks after itself' ),
				'install_lead'    => array( 'Section intro', 'textarea', 'A detector only works where the gas actually goes. Placement matters more than price.' ),
				'step1_title'     => array( 'Step 1 heading', 'text', 'Mount it where gas collects' ),
				'step1_body'      => array( 'Step 1 text', 'textarea', 'LPG is heavier than air and pools at floor level; natural gas rises. We tell you which wall and what height for your gas type.' ),
				'step2_title'     => array( 'Step 2 heading', 'text', 'Power it and let it warm up' ),
				'step2_body'      => array( 'Step 2 text', 'textarea', 'The sensor calibrates against clean room air for the first three minutes, then holds that baseline.' ),
				'step3_title'     => array( 'Step 3 heading', 'text', 'Test it every month' ),
				'step3_body'      => array( 'Step 3 text', 'textarea', 'Press and hold to sound the siren. Thirty seconds a month is the whole maintenance routine.' ),
			),
		),
		'cta'       => array(
			'label'  => 'Home — closing call to action',
			'fields' => array(
				'cta_title' => array( 'Heading', 'text', 'Fitting out a kitchen, a factory or a whole building?' ),
				'cta_body'  => array( 'Text', 'textarea', 'Tell us the gas type, the floor area and how many points you need covered. We will come back with a specification and a quote.' ),
				'cta_label' => array( 'Button label', 'text', 'Request a quote' ),
				'cta_href'  => array( 'Button link', 'text', '/quote' ),
			),
		),
		'contact'   => array(
			'label'  => 'Contact details',
			'fields' => array(
				'contact_email'    => array( 'Sales email (shown on the site)', 'email', 'sales@agfasgas.com' ),
				'quote_email'      => array( 'Where quotation requests are sent', 'email', 'sales@agfasgas.com' ),
				'contact_phone'    => array( 'Phone number', 'text', '' ),
				'contact_whatsapp' => array( 'WhatsApp link', 'url', '' ),
				'contact_instagram' => array( 'Instagram link', 'url', '' ),
				'contact_youtube'   => array( 'YouTube link', 'url', '' ),
				'contact_facebook'  => array( 'Facebook link', 'url', '' ),
				'contact_tiktok'    => array( 'TikTok link', 'url', '' ),
				'footer_tagline'   => array( 'Footer tagline', 'textarea', 'Gas leak detection and fire safety equipment for Malaysian homes, kitchens and worksites.' ),
			),
		),
	);
}

/** Flat map of key => default value. */
function agfas_defaults() {
	$defaults = array();
	foreach ( agfas_schema() as $section ) {
		foreach ( $section['fields'] as $key => $field ) {
			$defaults[ $key ] = $field[2];
		}
	}
	return $defaults;
}

/** Saved values merged over the defaults, so a blank field falls back. */
function agfas_content() {
	$saved    = get_option( AGFAS_OPTION, array() );
	$defaults = agfas_defaults();
	$out      = array();

	foreach ( $defaults as $key => $default ) {
		$value        = isset( $saved[ $key ] ) ? $saved[ $key ] : '';
		$out[ $key ]  = ( '' === $value ) ? $default : $value;
	}
	return $out;
}

/* -------------------------------------------------------------------------
 * Admin screen
 * ---------------------------------------------------------------------- */

add_action(
	'admin_menu',
	static function () {
		add_menu_page(
			'AGFAS Content',
			'AGFAS Content',
			'manage_options',
			'agfas-content',
			'agfas_render_admin_page',
			'dashicons-edit-large',
			30
		);
	}
);

function agfas_render_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$saved_notice = false;

	if ( isset( $_POST['agfas_save'] ) && check_admin_referer( 'agfas_save_content' ) ) {
		$values = array();
		foreach ( agfas_schema() as $section ) {
			foreach ( $section['fields'] as $key => $field ) {
				$raw = isset( $_POST[ $key ] ) ? wp_unslash( $_POST[ $key ] ) : '';
				switch ( $field[1] ) {
					case 'textarea':
						$values[ $key ] = sanitize_textarea_field( $raw );
						break;
					case 'email':
						$values[ $key ] = sanitize_email( $raw );
						break;
					case 'url':
						$values[ $key ] = esc_url_raw( $raw );
						break;
					default:
						$values[ $key ] = sanitize_text_field( $raw );
				}
			}
		}
		update_option( AGFAS_OPTION, $values );
		$saved_notice = true;
	}

	$content = agfas_content();
	?>
	<div class="wrap">
		<h1>AGFAS Content</h1>
		<p style="max-width:46em">
			Edit the text on the storefront. Leave a field blank to use the original
			wording. Changes appear on the site within about a minute.
		</p>

		<?php if ( $saved_notice ) : ?>
			<div class="notice notice-success is-dismissible"><p>Content saved.</p></div>
		<?php endif; ?>

		<form method="post">
			<?php wp_nonce_field( 'agfas_save_content' ); ?>

			<?php foreach ( agfas_schema() as $section ) : ?>
				<h2 style="margin-top:2em"><?php echo esc_html( $section['label'] ); ?></h2>
				<table class="form-table" role="presentation">
					<tbody>
					<?php foreach ( $section['fields'] as $key => $field ) : ?>
						<tr>
							<th scope="row">
								<label for="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $field[0] ); ?></label>
							</th>
							<td>
								<?php if ( 'textarea' === $field[1] ) : ?>
									<textarea id="<?php echo esc_attr( $key ); ?>"
										name="<?php echo esc_attr( $key ); ?>"
										rows="3" class="large-text"><?php echo esc_textarea( $content[ $key ] ); ?></textarea>
								<?php else : ?>
									<input id="<?php echo esc_attr( $key ); ?>"
										name="<?php echo esc_attr( $key ); ?>"
										type="text" class="regular-text"
										value="<?php echo esc_attr( $content[ $key ] ); ?>" />
								<?php endif; ?>
							</td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
			<?php endforeach; ?>

			<?php submit_button( 'Save changes', 'primary', 'agfas_save' ); ?>
		</form>
	</div>
	<?php
}

/* -------------------------------------------------------------------------
 * REST — the storefront reads the text from here
 * ---------------------------------------------------------------------- */

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'agfas/v1',
			'/content',
			array(
				'methods'             => 'GET',
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return rest_ensure_response( agfas_content() );
				},
			)
		);
	}
);
