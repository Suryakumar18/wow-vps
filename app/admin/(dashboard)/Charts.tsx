import { cn } from "@/app/components-home/lib/cn";

/**
 * Charts drawn as plain SVG.
 *
 * No charting dependency: these are simple shapes, and a library would ship
 * far more JavaScript than the marks are worth while making it harder to keep
 * the design tokens consistent. Everything here renders on the server.
 */

const GOLD = "#C6A15B";
const NAVY = "#13293F";

export interface Point {
  label: string;
  value: number;
}

/** Area + line chart for a value over time. */
export function TrendChart({
  points,
  formatValue,
  height = 180,
}: {
  points: Point[];
  formatValue: (value: number) => string;
  height?: number;
}) {
  if (points.length === 0) {
    return (
      <p className="grid h-[11rem] place-items-center text-micro text-slate-400">
        Nothing to chart yet.
      </p>
    );
  }

  const width = 720;
  const padY = 16;
  const max = Math.max(...points.map((p) => p.value), 1);
  const step = points.length > 1 ? width / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: points.length === 1 ? width / 2 : i * step,
    y: height - padY - (p.value / max) * (height - padY * 2),
  }));

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${height} L${coords[0].x.toFixed(1)},${height} Z`;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Trend from ${points[0].label} to ${points[points.length - 1].label}, peaking at ${formatValue(max)}`}
        className="h-[11rem] w-full"
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.28" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Baselines at 0 / 50 / 100% of the peak. */}
        {[0, 0.5, 1].map((ratio) => {
          const y = height - padY - ratio * (height - padY * 2);
          return (
            <line
              key={ratio}
              x1="0"
              x2={width}
              y1={y}
              y2={y}
              stroke="#E6E9EE"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        <path d={area} fill="url(#trend-fill)" />
        <path
          d={line}
          fill="none"
          stroke={GOLD}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="2.5" fill={GOLD} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>

      <figcaption className="mt-2 flex justify-between text-nano text-slate-400">
        <span>{points[0].label}</span>
        <span className="font-semibold text-slate-500">Peak {formatValue(max)}</span>
        <span>{points[points.length - 1].label}</span>
      </figcaption>
    </figure>
  );
}

/** Horizontal bars — good for comparing a handful of named things. */
export function BarList({
  points,
  formatValue,
  emptyNote = "Nothing to show yet.",
}: {
  points: Point[];
  formatValue: (value: number) => string;
  emptyNote?: string;
}) {
  if (points.length === 0) {
    return <p className="py-8 text-center text-micro text-slate-400">{emptyNote}</p>;
  }

  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {points.map((point) => (
        <li key={point.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-micro text-ink">{point.label}</span>
            <span className="shrink-0 text-micro font-semibold tabular-nums text-slate-600">
              {formatValue(point.value)}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-gold-500"
              style={{ width: `${Math.max(2, (point.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Donut for a small set of parts making up a whole (order statuses). */
export function DonutChart({
  segments,
  total,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
}) {
  const size = 140;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0">
        <svg width={size} height={size} role="img" aria-label={`${centerLabel}: ${total} in total`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#EEF1F5"
              strokeWidth={stroke}
            />
            {total > 0 &&
              segments.map((segment) => {
                const length = (segment.value / total) * circumference;
                const dash = `${length} ${circumference - length}`;
                const el = (
                  <circle
                    key={segment.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={stroke}
                    strokeDasharray={dash}
                    strokeDashoffset={-offset}
                  />
                );
                offset += length;
                return el;
              })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="text-section font-bold tabular-nums leading-none text-ink">{total}</p>
          <p className="mt-1 text-nano text-slate-500">{centerLabel}</p>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="min-w-0 flex-1 truncate text-micro capitalize text-slate-600">
              {segment.label.toLowerCase()}
            </span>
            <span className="shrink-0 text-micro font-semibold tabular-nums text-ink">
              {segment.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A headline figure with an optional period-over-period delta. */
export function StatCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
}) {
  const hasDelta = delta !== undefined && Number.isFinite(delta);

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-nano font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-section font-bold tabular-nums text-ink">{value}</p>
      {hasDelta ? (
        <p
          className={cn(
            "mt-1 text-nano font-semibold tabular-nums",
            delta > 0 ? "text-[#0F7B3F]" : delta < 0 ? "text-[#B91C1C]" : "text-slate-400",
          )}
        >
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {Math.abs(delta)}% vs previous 30 days
        </p>
      ) : (
        hint && <p className="mt-1 text-nano text-slate-400">{hint}</p>
      )}
    </div>
  );
}

export const CHART_COLORS = { gold: GOLD, navy: NAVY };
