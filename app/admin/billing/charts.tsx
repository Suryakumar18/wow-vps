'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const inr = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${Math.round(n)}`;

/* ── Area/line trend chart ── */
export function TrendChart({ series }: { series: { date: string; sales: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!series.length) return null;

  const W = 760, H = 240, px = 46, py = 18, cH = H - py * 2 - 16, cW = W - px * 2;
  const max = Math.max(...series.map(s => s.sales), 100) * 1.15;
  const pts = series.map((s, i) => ({
    x: px + (i / Math.max(series.length - 1, 1)) * cW,
    y: py + cH - (s.sales / max) * cH,
    ...s,
  }));

  let line = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], cx = a.x + (b.x - a.x) / 2;
    line += ` C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x} ${b.y}`;
  }
  const area = `${line} L ${pts[pts.length - 1].x} ${py + cH} L ${pts[0].x} ${py + cH} Z`;
  const labelEvery = Math.ceil(series.length / 8);

  return (
    <div className="relative w-full" style={{ minHeight: 250 }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="bTrend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            <line x1={px} y1={py + (cH / 3) * i} x2={W - px} y2={py + (cH / 3) * i} stroke="#eef0f3" />
            <text x={px - 8} y={py + (cH / 3) * i + 3} textAnchor="end" fontSize="10" fill="#9ca3af">{inr(max - (max / 3) * i)}</text>
          </g>
        ))}
        {hover !== null && <rect x={pts[hover].x - 14} y={py} width={28} height={cH} rx={7} fill="#4f46e5" fillOpacity={0.08} />}
        <motion.path d={area} fill="url(#bTrend)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d={line} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: 'easeInOut' }} />
        {pts.map((p, i) => (
          <g key={i}>
            <rect x={p.x - cW / Math.max(series.length - 1, 1) / 2} y={0} width={cW / Math.max(series.length - 1, 1)} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            {(i % labelEvery === 0 || i === pts.length - 1) && (
              <text x={p.x} y={H - 2} textAnchor="middle" fontSize="9.5" fill={hover === i ? '#111827' : '#9ca3af'}>
                {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </text>
            )}
            {hover === i && <circle cx={p.x} cy={p.y} r={5} fill="#fff" stroke="#4f46e5" strokeWidth={2.5} />}
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="absolute pointer-events-none z-10 rounded-xl px-3 py-2 shadow-xl" style={{ background: '#111827', left: `calc(${(pts[hover].x / W) * 100}% - 46px)`, top: `calc(${(pts[hover].y / H) * 100}% - 62px)` }}>
          <p className="text-[10px] text-gray-400 mb-0.5">{new Date(pts[hover].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p className="text-[13px] font-bold text-white">{inr(pts[hover].sales)}</p>
        </div>
      )}
    </div>
  );
}

/* ── Donut chart ── */
const DONUT_COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];
export function DonutChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const R = 60, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg viewBox="0 0 160 160" className="w-[150px] h-[150px] flex-shrink-0 -rotate-90">
        <circle cx={80} cy={80} r={R} fill="none" stroke="#f1f2f4" strokeWidth={20} />
        {data.map((d, i) => {
          const frac = d.value / total, len = frac * C;
          const el = (
            <motion.circle key={i} cx={80} cy={80} r={R} fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={20}
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} />
          );
          acc += len;
          return el;
        })}
      </svg>
      <div className="flex flex-col gap-2 flex-1 min-w-[120px]">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-600 capitalize">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />{d.label}
            </span>
            <span className="font-bold text-gray-900">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Horizontal bar list ── */
export function BarList({ data }: { data: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex flex-col gap-3.5">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-700 font-medium truncate pr-2">{d.label}</span>
            <span className="font-bold text-gray-900 whitespace-nowrap">{d.sub || inr(d.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              initial={{ width: 0 }} animate={{ width: `${(d.value / max) * 100}%` }} transition={{ duration: 0.8, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }} />
          </div>
        </div>
      ))}
    </div>
  );
}
