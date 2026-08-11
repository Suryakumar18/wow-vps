import Image from "next/image";
import { Check } from "lucide-react";
import Icon, { type IconName } from "../ui/Icon";
import { authAside } from "../data/home-content";

/**
 * The dark promise panel beside the login form.
 *
 * Hidden below `lg`: on a phone the approved design gives the whole screen to
 * the form, so this becomes a desktop-only reassurance column rather than
 * something the mobile layout has to scroll past.
 */
export default function AuthAside() {
  return (
    <aside className="relative isolate hidden overflow-hidden bg-navy-900 lg:block">
      <Image
        src={authAside.src}
        alt={authAside.alt}
        fill
        priority
        sizes="45vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/80 to-navy-950/35"
      />

      <div className="relative flex h-full flex-col justify-end gap-6 p-panel pb-[clamp(2rem,4vw,3.5rem)]">
        <h2 className="text-section font-bold text-white">
          {authAside.headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>

        <ul className="flex flex-col gap-3">
          {authAside.points.map((point) => (
            <li key={point.label} className="flex items-center gap-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-500 text-navy-900">
                <Check size={12} strokeWidth={3} aria-hidden="true" />
              </span>
              <span className="text-micro font-medium text-white/90">{point.label}</span>
              <Icon name={point.icon as IconName} size={13} className="text-gold-400" />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
