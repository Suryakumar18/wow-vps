import { PhoneCall } from "lucide-react";
import Container from "./ui/Container";
import { cn } from "./lib/cn";
import Icon, { type IconName } from "./ui/Icon";
import { announcement as defaultAnnouncement } from "./data/home-content";

type AnnouncementContent = {
  readonly left: readonly { readonly icon: string; readonly label: string }[];
  readonly center: readonly { readonly icon: string; readonly label: string }[];
  readonly help: { readonly label: string; readonly phone: string; readonly href: string };
};

/**
 * Thin navy strip above the header. Three groups: brand promises (left),
 * service promises (centre), and the help number (right).
 *
 * Below `lg` the centre group collapses to keep the bar a single line.
 */
export default function AnnouncementBar({
  className,
  content = defaultAnnouncement,
}: {
  className?: string;
  content?: AnnouncementContent;
}) {
  const announcement = content;
  return (
    <div className={cn("bg-navy-900 text-white/85", className)}>
      <Container>
        <div className="flex h-bar items-center justify-between gap-u-4 text-nav-nano font-medium sm:h-bar-lg">
          <ul className="flex shrink-0 items-center gap-u-4 sm:gap-u-6">
            {announcement.left.map((item) => (
              <li key={item.label} className="flex items-center gap-u-1.5 whitespace-nowrap">
                <Icon name={item.icon as IconName} size={11} className="text-gold-400" />
                <span className="hidden sm:inline">{item.label}</span>
              </li>
            ))}
          </ul>

          <ul className="hidden items-center gap-u-3 lg:flex xl:gap-u-5">
            {announcement.center.map((item, i) => (
              <li key={item.label} className="flex items-center gap-u-3 xl:gap-u-5">
                {i > 0 && <span aria-hidden="true" className="h-u-3 w-px bg-white/20" />}
                <span className="flex items-center gap-u-1.5 whitespace-nowrap">
                  <Icon name={item.icon as IconName} size={11} className="text-gold-400" />
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-u-2 whitespace-nowrap">
            <PhoneCall size={11} className="text-gold-400" aria-hidden="true" />
            <span className="hidden sm:inline">{announcement.help.label}</span>
            <span aria-hidden="true" className="hidden h-u-3 w-px bg-white/20 sm:inline-block" />
            <a
              href={announcement.help.href}
              className="font-semibold text-white transition-colors hover:text-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
            >
              {announcement.help.phone}
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
