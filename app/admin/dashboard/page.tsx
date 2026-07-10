'use client';

import React, { useState, useEffect, useRef } from 'react';
import Layout from '../layout/layout';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  IndianRupee,
  Package,
  Users,
  ShoppingBag,
  ArrowUpRight,
  RefreshCw,
  Circle,
  TrendingUp,
} from 'lucide-react';
import axios from 'axios';

// ─── Axios instance with auth header ──────────────────────────────────────────
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('token');
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Order {
  _id: string;
  orderNumber?: string;
  userId?: { fullname?: string } | null;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  items?: { name?: string }[];
}

// ─── Palette (light / Nexadash) ────────────────────────────────────────────────
const INK      = '#111827';
const GREEN    = '#16a34a';
const STATUS_META = [
  { label: 'Delivered',  key: 'delivered',  color: '#16a34a' },
  { label: 'Processing', key: 'processing', color: '#d97706' },
  { label: 'Shipped',    key: 'shipped',    color: '#2563eb' },
  { label: 'Pending',    key: 'pending',    color: '#9ca3af' },
  { label: 'Cancelled',  key: 'cancelled',  color: '#dc2626' },
];

// ─── Animated count-up number ──────────────────────────────────────────────────
const CountUp = ({ value, format }: { value: number; format?: (n: number) => string }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const dur = 900;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, inView]);

  return <span ref={ref}>{format ? format(display) : Math.round(display).toLocaleString('en-IN')}</span>;
};

// ─── Revenue chart (light, dark tooltip like the reference) ───────────────────
const CHART_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RevenueChart = ({ orders }: { orders: Order[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const buckets = Array(7).fill(0);
  orders.forEach((o) => {
    if (o.status === 'delivered' && o.createdAt) {
      const day = new Date(o.createdAt).getDay(); // 0=Sun
      const idx = day === 0 ? 6 : day - 1;        // Mon=0 … Sun=6
      buckets[idx] += o.totalAmount || 0;
    }
  });

  const maxVal = Math.max(...buckets, 1000) * 1.2;

  const W = 720, H = 220, px = 46, py = 20;
  const cW = W - px * 2, cH = H - py * 2 - 18;

  const pts = buckets.map((v, i) => ({
    x: px + (i / (CHART_DAYS.length - 1)) * cW,
    y: py + cH - (v / maxVal) * cH,
    v,
    label: CHART_DAYS[i],
  }));

  let lineD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const cx = a.x + (b.x - a.x) / 2;
    lineD += ` C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x} ${b.y}`;
  }
  const areaD = `${lineD} L ${pts[pts.length - 1].x} ${py + cH} L ${pts[0].x} ${py + cH} Z`;

  const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${Math.round(n)}`;

  // Y axis labels
  const yTicks = [0, 1, 2, 3].map((i) => ({
    y: py + (cH / 3) * i,
    v: maxVal - (maxVal / 3) * i,
  }));

  return (
    <div className="relative w-full" style={{ minHeight: 240 }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="areaGradLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid + Y labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={px} y1={t.y} x2={W - px} y2={t.y} stroke="#eef0f3" strokeWidth="1" />
            <text x={px - 10} y={t.y + 3.5} textAnchor="end" fontSize="10" fill="#9ca3af">
              {fmt(t.v)}
            </text>
          </g>
        ))}

        {/* Hover column highlight (like the reference) */}
        <AnimatePresence>
          {hovered !== null && (
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              x={pts[hovered].x - 16}
              y={py}
              width={32}
              height={cH}
              rx={8}
              fill="#3b82f6"
              fillOpacity="0.10"
            />
          )}
        </AnimatePresence>

        {/* Area fill */}
        <motion.path
          d={areaD}
          fill="url(#areaGradLight)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Line */}
        <motion.path
          d={lineD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />

        {/* Points */}
        {pts.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - cW / (pts.length - 1) / 2} y={0}
              width={cW / (pts.length - 1)} height={H}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            />
            <motion.circle
              cx={p.x} cy={p.y}
              r={hovered === i ? 5.5 : 4}
              fill="#fff"
              stroke="#3b82f6"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + i * 0.07, type: 'spring', stiffness: 300, damping: 18 }}
              className="pointer-events-none"
              style={{ filter: hovered === i ? 'drop-shadow(0 2px 6px rgba(59,130,246,.45))' : 'none' }}
            />
            <text
              x={p.x} y={H - 2}
              textAnchor="middle" fontSize="11"
              fill={hovered === i ? INK : '#9ca3af'}
              fontWeight={hovered === i ? 700 : 400}
              className="pointer-events-none"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Dark tooltip (like the reference) */}
      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute pointer-events-none z-10 rounded-xl px-3.5 py-2.5 shadow-xl"
            style={{
              background: '#111827',
              left: `calc(${(pts[hovered].x / W) * 100}% - 48px)`,
              top: `calc(${(pts[hovered].y / H) * 100}% - 74px)`,
            }}
          >
            <p className="text-[10px] font-semibold text-gray-400 mb-1">{pts[hovered].label} · this week</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />
              <span className="text-[11px] text-gray-300">Revenue</span>
              <span className="text-[12px] font-bold text-white ml-2">{fmt(pts[hovered].v)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Segmented gauge (like the "Channel Performance" dial) ────────────────────
const OrdersGauge = ({ statusCounts, total }: { statusCounts: Record<string, number>; total: number }) => {
  const SEGMENTS = 26;
  const R = 74, CX = 100, CY = 96, SEG_L = 24;

  // Assign each segment a colour proportional to the status share
  const segColors: string[] = [];
  if (total > 0) {
    let acc = 0;
    const shares = STATUS_META.map((s) => ({ color: s.color, n: statusCounts[s.key] || 0 }));
    for (const s of shares) {
      const count = Math.round((s.n / total) * SEGMENTS);
      for (let i = 0; i < count && acc < SEGMENTS; i++, acc++) segColors.push(s.color);
    }
    while (segColors.length < SEGMENTS) segColors.push('#e5e7eb');
  } else {
    for (let i = 0; i < SEGMENTS; i++) segColors.push('#e5e7eb');
  }

  return (
    <div className="relative flex justify-center">
      <svg viewBox="0 0 200 110" className="w-full max-w-[240px]">
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const angle = 180 + (i / (SEGMENTS - 1)) * 180; // 180° sweep
          const rad = (angle * Math.PI) / 180;
          const x1 = CX + Math.cos(rad) * R;
          const y1 = CY + Math.sin(rad) * R;
          const x2 = CX + Math.cos(rad) * (R - SEG_L);
          const y2 = CY + Math.sin(rad) * (R - SEG_L);
          return (
            <motion.line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={segColors[i]}
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.028, duration: 0.3 }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-2xl font-black" style={{ color: INK }}>
          <CountUp value={total} />
        </div>
        <div className="text-[11px] text-gray-400 font-medium">Total Orders</div>
      </div>
    </div>
  );
};

// ─── Status badge (soft light pills) ───────────────────────────────────────────
const StatusBadge = ({ status }: { status?: string }) => {
  const s = (status || '').toLowerCase();
  const styles: Record<string, string> = {
    delivered:  'bg-green-50 text-green-700 border-green-200',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',
    shipped:    'bg-blue-50 text-blue-700 border-blue-200',
    cancelled:  'bg-red-50 text-red-600 border-red-200',
    pending:    'bg-gray-100 text-gray-500 border-gray-200',
  };
  const cls = styles[s] || styles.pending;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${cls}`}>
      {status || 'pending'}
    </span>
  );
};

// ─── Card entrance animation preset ───────────────────────────────────────────
const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [orders, setOrders]              = useState<Order[]>([]);
  const [productCount, setProductCount]  = useState<number | null>(null);
  const [userCount, setUserCount]        = useState<number | null>(null);
  const [loading, setLoading]            = useState(true);
  const [refreshing, setRefreshing]      = useState(false);

  const fetchAll = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const [ordRes, prodRes, userRes] = await Promise.all([
        api.get('/admin/orders').catch(() => ({ data: { data: [] } })),
        api.get('/admin/products').catch(() => ({ data: { count: 0 } })),
        api.get('/admin/users').catch(() => ({ data: { data: [] } })),
      ]);
      setOrders(ordRes.data?.data ?? []);
      setProductCount(prodRes.data?.count ?? (prodRes.data?.data?.length ?? 0));
      setUserCount(userRes.data?.data?.length ?? 0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const totalRevenue = deliveredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  const fmtRevenue = (n: number) =>
    n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr`
    : n >= 100000  ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000    ? `₹${(n / 1000).toFixed(1)}K`
    : `₹${Math.round(n)}`;

  const recentOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 8);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    const s = (o.status || 'pending').toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  // ── Metric cards config ──────────────────────────────────────────────────────
  const metrics = [
    {
      label: 'Total Sales',
      raw: totalRevenue,
      format: fmtRevenue,
      icon: IndianRupee,
      badge: `${deliveredOrders.length} delivered`,
      badgeTone: 'green' as const,
      sub: 'from delivered orders',
    },
    {
      label: 'Total Orders',
      raw: orders.length,
      format: undefined,
      icon: ShoppingBag,
      badge: `${statusCounts['processing'] || 0} processing`,
      badgeTone: 'amber' as const,
      sub: 'all order statuses',
    },
    {
      label: 'Total Customers',
      raw: userCount ?? 0,
      format: undefined,
      icon: Users,
      badge: 'accounts',
      badgeTone: 'gray' as const,
      sub: 'registered users',
    },
    {
      label: 'Products',
      raw: productCount ?? 0,
      format: undefined,
      icon: Package,
      badge: 'in catalog',
      badgeTone: 'gray' as const,
      sub: 'live on store',
    },
  ];

  const badgeCls = {
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    gray:  'bg-gray-100 text-gray-500 border-gray-200',
  };

  const fmtDate = (d?: string) => {
    if (!d) return '—';
    const dt = new Date(d);
    const now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 60000)  return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <Layout>
      <div className="min-h-full bg-[#f3f4f6] text-gray-900 p-4 md:p-7" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <motion.div {...cardAnim(0)} className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Welcome back 👋</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Here&apos;s what&apos;s happening with your store today.</p>
          </div>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[12.5px] font-semibold text-gray-600 shadow-sm hover:border-gray-300 hover:-translate-y-px hover:shadow transition-all disabled:opacity-40"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </motion.div>

        {/* ── Metric cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              {...cardAnim(0.05 + i * 0.07)}
              whileHover={{ y: -3, boxShadow: '0 12px 28px -8px rgba(16,24,40,.14)' }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm cursor-default"
            >
              {/* Card header strip */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                    <m.icon size={15} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">{m.label}</span>
                </div>
                <div className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-colors">
                  <ArrowUpRight size={13} />
                </div>
              </div>

              {/* Value */}
              <div className="text-[26px] leading-none font-black tracking-tight mb-3">
                {loading ? (
                  <span className="inline-block w-24 h-7 rounded-lg bg-gray-100 animate-pulse" />
                ) : (
                  <CountUp value={m.raw} format={m.format} />
                )}
              </div>

              {/* Badge + sub */}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${badgeCls[m.badgeTone]}`}>
                  {loading ? '…' : m.badge}
                </span>
                <span className="text-[11px] text-gray-400">{m.sub}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Chart + Order status ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

          {/* Revenue chart */}
          <motion.div
            {...cardAnim(0.32)}
            className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                    <TrendingUp size={15} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">Revenue Overview</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[26px] font-black tracking-tight">
                    {loading ? '—' : <CountUp value={totalRevenue} format={fmtRevenue} />}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold border bg-green-50 text-green-700 border-green-200">
                    ● Live
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Delivered orders · current week</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} /> Revenue
                </span>
              </div>
            </div>
            <RevenueChart orders={orders} />
          </motion.div>

          {/* Order status breakdown */}
          <motion.div
            {...cardAnim(0.38)}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                <ShoppingBag size={15} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">Order Status</span>
            </div>

            <OrdersGauge statusCounts={statusCounts} total={orders.length} />

            <div className="flex-1 space-y-3.5 mt-6">
              {STATUS_META.map(({ label, key, color }, i) => {
                const count = statusCounts[key] || 0;
                const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Circle size={6} fill={color} stroke="none" />
                        <span className="text-gray-500 font-medium">{label}</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {loading ? '—' : `${count} · ${pct}%`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, delay: 0.55 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Recent orders table ─────────────────────────────────────────────── */}
        <motion.div
          {...cardAnim(0.45)}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                <ShoppingBag size={15} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">Recent Orders</span>
            </div>
            <span className="text-[11px] font-medium text-gray-400">Latest {recentOrders.length} of {orders.length}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-7 w-7 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <ShoppingBag size={32} className="mb-3" />
              <p className="text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Order ID', 'Customer', 'Product', 'Amount', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {recentOrders.map((o, i) => (
                    <motion.tr
                      key={o._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-900">
                        #{o.orderNumber || o._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {(o.userId?.fullname || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                          <span className="text-gray-700 text-xs font-medium">{o.userId?.fullname || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[180px] truncate">
                        {o.items?.[0]?.name || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900 text-xs">
                        ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {fmtDate(o.createdAt)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

      </div>
    </Layout>
  );
}
