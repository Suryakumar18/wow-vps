import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import Container from "./ui/Container";
import { BrandMark } from "./ui/BrandLogo";
import PaymentBadge, { type PaymentMethod } from "./ui/PaymentBadge";
import { brand, footer as defaultFooter } from "./data/home-content";

type FooterContent = {
  readonly about: string;
  readonly columns: readonly {
    readonly title: string;
    readonly links: readonly { readonly label: string; readonly href: string }[];
  }[];
  readonly follow: {
    readonly title: string;
    readonly description: string;
    readonly socials: readonly {
      readonly name: string;
      readonly href: string;
      readonly icon: string;
      readonly className: string;
    }[];
  };
  readonly payments: { readonly title: string; readonly methods: readonly string[] };
  readonly legal: string;
  readonly meta: readonly [string, string];
};
import { cn } from "./lib/cn";

function WhatsappIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.57-.34M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26C2.16 6.46 6.6 2.02 12.05 2.02c2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.89-9.88 9.89m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  facebook: <Facebook size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" />,
  instagram: <Instagram size={13} aria-hidden="true" />,
  youtube: <Youtube size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" />,
  whatsapp: <WhatsappIcon />,
} as const;

// `inline-block py-1.5` gives the link a real box on touch screens instead of a
// 12px-tall line of text; from `lg` the pointer-sized default returns.
const linkClass =
  "inline-block py-1.5 text-micro text-white/60 transition-colors hover:text-gold-400 lg:py-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400";

/** Five-column site footer plus the legal bar. */
export default function SiteFooter({ content }: { content?: FooterContent }) {
  const footer = content ?? defaultFooter;
  return (
    <footer className="mt-section bg-navy-900">
      <Container>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-[clamp(1.575rem,2.7vw,3.15rem)] md:grid-cols-4 lg:grid-cols-12 lg:gap-x-[clamp(1.35rem,2.25vw,2.7rem)]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-control-md w-control-md shrink-0" />
              <span className="flex flex-col leading-none">
                <span className="text-lead font-bold leading-none text-white">{brand.name}</span>
                <span className="mt-[2.7px] text-[8.55px] font-medium leading-none tracking-[0.24em] text-white/55">
                  {brand.location}
                </span>
                <span className="mt-[3.6px] font-script text-nano italic leading-none text-gold-400">
                  {brand.tagline}
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-[15.75rem] text-micro leading-relaxed text-white/55">
              {footer.about}
            </p>
          </div>

          {/* Link columns */}
          {footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="lg:col-span-2">
              <h2 className="mb-3 text-micro font-semibold text-white">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Social */}
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-micro font-semibold text-white">{footer.follow.title}</h2>
            <p className="text-micro leading-relaxed text-white/55">{footer.follow.description}</p>
            <ul className="mt-3.5 flex items-center gap-2.5">
              {footer.follow.socials.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className={cn(
                      "grid h-control-xs w-control-xs place-items-center rounded-full text-white transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400",
                      social.className,
                    )}
                  >
                    {SOCIAL_ICONS[social.icon as keyof typeof SOCIAL_ICONS]}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Payments */}
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-micro font-semibold text-white">{footer.payments.title}</h2>
            <ul className="flex flex-wrap gap-2">
              {footer.payments.methods.map((method) => (
                <PaymentBadge key={method} method={method as PaymentMethod} />
              ))}
            </ul>
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10 bg-navy-950">
        <Container>
          <div className="flex flex-col items-center justify-between gap-2 py-3.5 text-nano text-white/45 sm:flex-row">
            <p>{footer.legal}</p>
            <p className="flex items-center gap-2.5">
              {footer.meta.map((entry, i) => (
                <span key={entry} className="flex items-center gap-2.5">
                  {i > 0 && <span aria-hidden="true" className="h-3 w-px bg-white/15" />}
                  {entry}
                </span>
              ))}
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
