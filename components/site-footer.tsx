import Link from "next/link";
import { Logo } from "./logo";
import { getSiteContent } from "@/lib/content";
import { profileHref, whatsappHref } from "@/lib/social";
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "./contact-icons";

const COLUMNS = [
  {
    heading: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/quote", label: "Request a quotation" },
      { href: "/cart", label: "Cart" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "Why AGFAS" },
      { href: "/blog", label: "Safety notes" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export async function SiteFooter() {
  const t = await getSiteContent();

  /**
   * Only channels that have been filled in appear. The label carries the real
   * value — the address, the number — so an icon is never a dead end for
   * screen readers or for anyone hovering to check where it goes.
   */
  const channels = [
    t.contact_email && {
      href: `mailto:${t.contact_email}`,
      label: `Email ${t.contact_email}`,
      icon: <MailIcon />,
    },
    t.contact_phone && {
      href: `tel:${t.contact_phone.replace(/\s+/g, "")}`,
      label: `Call ${t.contact_phone}`,
      icon: <PhoneIcon />,
    },
    whatsappHref(t.contact_whatsapp) && {
      href: whatsappHref(t.contact_whatsapp)!,
      label: "Message us on WhatsApp",
      icon: <WhatsAppIcon />,
    },
    profileHref("instagram", t.contact_instagram) && {
      href: profileHref("instagram", t.contact_instagram)!,
      label: "AGFAS on Instagram",
      icon: <InstagramIcon />,
    },
    profileHref("youtube", t.contact_youtube) && {
      href: profileHref("youtube", t.contact_youtube)!,
      label: "AGFAS on YouTube",
      icon: <YouTubeIcon />,
    },
    profileHref("facebook", t.contact_facebook) && {
      href: profileHref("facebook", t.contact_facebook)!,
      label: "AGFAS on Facebook",
      icon: <FacebookIcon />,
    },
    profileHref("tiktok", t.contact_tiktok) && {
      href: profileHref("tiktok", t.contact_tiktok)!,
      label: "AGFAS on TikTok",
      icon: <TikTokIcon />,
    },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: React.ReactNode }>;

  return (
    <footer className="mt-24 border-t border-line bg-mist">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-steel">{t.footer_tagline}</p>

            {channels.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {channels.map((channel) => (
                  <li key={channel.href}>
                    <a
                      href={channel.href}
                      aria-label={channel.label}
                      title={channel.label}
                      {...(channel.href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper text-steel transition-colors hover:border-flame hover:bg-flame-soft hover:text-flame-deep"
                    >
                      {channel.icon}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/80 transition-colors hover:text-flame-deep"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline mt-12 flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-steel">
            © {new Date().getFullYear()} AGFAS. All rights reserved.
          </p>
          <p className="font-mono text-xs text-steel">Prices in MYR (RM)</p>
        </div>
      </div>
    </footer>
  );
}
