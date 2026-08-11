import Icon, { type IconName } from "./ui/Icon";

/** One promise tile in the "More Joy. More Discovery." strip. */
export default function FeatureCard({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
}) {
  return (
    // Mobile: bare icon above a centred label, four across, as in the approved
    // mobile design. From `lg`: the approved desktop tile with its mist panel.
    <div className="flex h-full flex-col items-center gap-1.5 text-center lg:flex-row lg:gap-3 lg:rounded-lg lg:bg-mist lg:px-3.5 lg:py-3 lg:text-left lg:transition-colors lg:duration-200 lg:hover:bg-gold-50">
      <span className="grid h-control-sm w-control-sm shrink-0 place-items-center rounded-full border border-gold-200 bg-white text-gold-600">
        <Icon name={icon} size={14} strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="block text-nano font-semibold leading-tight text-ink lg:text-micro">
          {title}
        </span>
        <span className="mt-0.5 hidden text-nano leading-tight text-slate-500 lg:block">
          {subtitle}
        </span>
      </span>
    </div>
  );
}
