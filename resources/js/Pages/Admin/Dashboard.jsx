import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from './AdminLayout';
import {
    Users, UtensilsCrossed, Receipt,
    TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight,
    ShoppingBag, PackageCheck, Flame, Layers, Crown, Wallet,
} from 'lucide-react';

/* ---------- Helpers ---------- */
const money = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

const moneyCompact = (n) => {
    const v = Number(n || 0);
    if (v >= 1_000_000_000) return 'Rp ' + (v / 1_000_000_000).toFixed(1) + 'M';
    if (v >= 1_000_000) return 'Rp ' + (v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1) + 'jt';
    if (v >= 1000) return 'Rp ' + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'rb';
    return 'Rp ' + Math.round(v);
};

const formatDateShort = (str) => {
    if (!str) return '';
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

/* Kurva halus (cubic bezier) dari deretan titik */
const smoothPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    return pts.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }, '');
};

/* ---------- Building blocks ---------- */
function Card({ className = '', children }) {
    return (
        <section
            className={`flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}
        >
            {children}
        </section>
    );
}

function CardHeader({ icon: Icon, tone = 'bg-primary-subtle', iconColor = 'text-primary-deep', title, subtitle, action }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2.4} />
                </span>
                <div>
                    <h2 className="font-display text-[15px] font-bold leading-tight text-ink">{title}</h2>
                    {subtitle && <p className="mt-0.5 text-[11.5px] text-ink-soft">{subtitle}</p>}
                </div>
            </div>
            {action}
        </div>
    );
}

function SeeAll({ href, children }) {
    return (
        <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-[12px] font-semibold text-primary-deep transition hover:bg-primary-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            {children} <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
    );
}

function EmptyState({ icon: Icon, title, hint }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-muted">
                <Icon className="h-5 w-5 text-ink-soft" />
            </span>
            <p className="mt-2 text-[13px] font-semibold text-ink">{title}</p>
            {hint && <p className="mt-0.5 text-[11.5px] text-ink-soft">{hint}</p>}
        </div>
    );
}

/* ---------- Page ---------- */
export default function AdminDashboard({
    stats = {},
    transactionTrend = [],
    recentTransactions = [],
    topProducts = [],
    lowStockProducts = [],
    categorySales = [],
    topCustomers = [],
    customerTiers = [],
}) {
    const [chartMetric, setChartMetric] = useState('total'); // 'total' | 'count'
    const [hoverIdx, setHoverIdx] = useState(null);

    /* ----- KPI ----- */
    const revenue = Number(stats.revenue || 0);
    const orders = Number(stats.transaksi || 0);
    const avgOrder = orders > 0 ? Math.round(revenue / orders) : 0;

    /* ----- Chart ----- */
    const chartData = Array.isArray(transactionTrend) ? transactionTrend : [];
    const getVal = (d) => (chartMetric === 'total' ? Number(d.total || 0) : Number(d.count || 0));
    const values = chartData.map(getVal);
    const maxVal = Math.max(1, ...values);
    const sumVal = values.reduce((a, b) => a + b, 0);

    // Perubahan hari terakhir vs sebelumnya
    const last = values[values.length - 1] ?? 0;
    const prev = values[values.length - 2];
    const delta = prev !== undefined && prev > 0 ? ((last - prev) / prev) * 100 : null;

    const chartW = 640;
    const chartH = 190;
    const padL = 62;
    const padR = 16;
    const padT = 14;
    const padB = 28;
    const innerW = chartW - padL - padR;
    const innerH = chartH - padT - padB;

    // Dasar grafik dimulai dari 0 agar proporsi tidak menyesatkan
    const points = chartData.map((d, i) => {
        const val = getVal(d);
        const x = padL + (chartData.length > 1 ? (i / (chartData.length - 1)) * innerW : innerW / 2);
        const y = padT + innerH - (val / maxVal) * innerH;
        return { x, y, val, raw: d };
    });

    const linePath = smoothPath(points);
    const baseY = padT + innerH;
    const areaPath = points.length > 1
        ? `${linePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`
        : '';

    const yTicks = [0, 0.5, 1].map((pct) => ({
        y: padT + innerH * (1 - pct),
        label: chartMetric === 'total' ? moneyCompact(maxVal * pct) : String(Math.round(maxVal * pct)),
    }));

    const xLabelIdx = chartData.length <= 4
        ? chartData.map((_, i) => i)
        : [0, Math.floor((chartData.length - 1) / 2), chartData.length - 1];

    const hovered = hoverIdx !== null ? points[hoverIdx] : null;

    /* ----- Lists ----- */
    const maxTerjual = Math.max(1, ...topProducts.map((p) => Number(p.total_terjual || 0)));
    const maxCatRevenue = Math.max(1, ...categorySales.map((c) => Number(c.total_omset || 0)));
    const totalCatRevenue = categorySales.reduce((a, c) => a + Number(c.total_omset || 0), 0);

    const tierName = (t) => t.tier ?? t.nama_tier ?? t.nama ?? '-';
    const tierCount = (t) => Number(t.jumlah ?? t.total ?? t.count ?? 0);

    const kpis = [
        { label: 'Total Omset', value: money(revenue), icon: Wallet, hero: true, note: 'Seluruh transaksi' },
        { label: 'Total Transaksi', value: `${orders}`, unit: 'order', icon: Receipt, note: `Rata-rata ${money(avgOrder)}` },
        { label: 'Total Produk', value: `${stats.produk || 0}`, unit: 'item', icon: UtensilsCrossed, note: `${lowStockProducts.length} stok menipis` },
        { label: 'Pelanggan', value: `${stats.pelanggan || 0}`, unit: 'user', icon: Users, note: 'Member terdaftar' },
    ];

    return (
        <AdminLayout
            activePage="dashboard"
            title="Dashboard Overview"
            subtitle="Ringkasan eksekutif seluruh data toko dalam satu layar ringkas"
        >
            <div className="space-y-4">
                {/* ============ KPI ============ */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {kpis.map(({ label, value, unit, icon: Icon, hero, note }) => (
                        <div
                            key={label}
                            className={`relative overflow-hidden rounded-2xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                                hero ? 'border-primary/30 bg-primary-subtle' : 'border-line bg-white'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <p className={`text-[12px] font-semibold ${hero ? 'text-primary-deep' : 'text-ink-soft'}`}>{label}</p>
                                <span className={`grid h-8 w-8 place-items-center rounded-xl ${hero ? 'bg-primary' : 'bg-muted'}`}>
                                    <Icon className={`h-4 w-4 ${hero ? 'text-white' : 'text-ink-soft'}`} strokeWidth={2.4} />
                                </span>
                            </div>
                            <p className="mt-2 font-display text-[24px] font-bold leading-none tracking-tight text-ink">
                                {value}
                                {unit && <span className="ml-1 text-[12px] font-semibold text-ink-soft">{unit}</span>}
                            </p>
                            <p className={`mt-2 text-[11.5px] ${hero ? 'text-primary-deep/80' : 'text-ink-soft'}`}>{note}</p>
                        </div>
                    ))}
                </div>

                {/* ============ ROW 1: Tren + Terlaris ============ */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <Card className="lg:col-span-8">
                        <CardHeader
                            icon={TrendingUp}
                            title="Tren Transaksi"
                            subtitle="Volume dan omset penjualan toko"
                            action={
                                <div className="inline-flex rounded-xl bg-muted p-1 text-[12px]" role="tablist" aria-label="Metrik grafik">
                                    {[
                                        { key: 'total', label: 'Nominal (Rp)' },
                                        { key: 'count', label: 'Volume' },
                                    ].map((t) => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            role="tab"
                                            aria-selected={chartMetric === t.key}
                                            onClick={() => setChartMetric(t.key)}
                                            className={`rounded-lg px-3 py-1 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                                chartMetric === t.key ? 'bg-white text-ink shadow-xs' : 'text-ink-soft hover:text-ink'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            }
                        />

                        {/* Ringkasan angka di atas grafik */}
                        <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-1">
                            <div>
                                <p className="font-display text-[26px] font-bold leading-none tracking-tight text-ink">
                                    {chartMetric === 'total' ? money(sumVal) : `${sumVal} order`}
                                </p>
                                <p className="mt-1 text-[11.5px] text-ink-soft">Total selama {chartData.length} hari rekaman</p>
                            </div>
                            {delta !== null && (
                                <span
                                    className={`mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold ${
                                        delta >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                                    }`}
                                >
                                    {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {delta >= 0 ? '+' : ''}{delta.toFixed(0)}% vs hari sebelumnya
                                </span>
                            )}
                        </div>

                        {chartData.length === 0 ? (
                            <EmptyState icon={TrendingUp} title="Belum ada transaksi" hint="Grafik akan muncul setelah ada penjualan pertama." />
                        ) : (
                            <div className="relative mt-3 w-full">
                                {/* Tooltip */}
                                {hovered && (
                                    <div
                                        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-1.5 text-[11.5px] text-white shadow-lg"
                                        style={{
                                            left: `${(hovered.x / chartW) * 100}%`,
                                            top: `${(hovered.y / chartH) * 100}%`,
                                            marginTop: -10,
                                        }}
                                    >
                                        <p className="whitespace-nowrap text-[10.5px] text-neutral-300">{formatDateShort(hovered.raw.date)}</p>
                                        <p className="whitespace-nowrap font-bold text-primary">{money(hovered.raw.total)}</p>
                                        <p className="whitespace-nowrap text-[10.5px] text-neutral-300">{hovered.raw.count} transaksi</p>
                                    </div>
                                )}

                                <svg
                                    viewBox={`0 0 ${chartW} ${chartH}`}
                                    className="h-48 w-full overflow-visible"
                                    role="img"
                                    aria-label="Grafik tren transaksi"
                                >
                                    <defs>
                                        <linearGradient id="dashTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#F5A623" stopOpacity="0.28" />
                                            <stop offset="95%" stopColor="#F5A623" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>

                                    {yTicks.map((t, i) => (
                                        <g key={i}>
                                            <line
                                                x1={padL}
                                                y1={t.y}
                                                x2={chartW - padR}
                                                y2={t.y}
                                                stroke="#EDEDED"
                                                strokeDasharray={i === 0 ? '0' : '3 4'}
                                                strokeWidth="1"
                                            />
                                            <text x={padL - 8} y={t.y + 3.5} fontSize="10.5" fill="#8C8C8C" textAnchor="end">
                                                {t.label}
                                            </text>
                                        </g>
                                    ))}

                                    {hovered && (
                                        <line
                                            x1={hovered.x}
                                            y1={padT}
                                            x2={hovered.x}
                                            y2={baseY}
                                            stroke="#F5A623"
                                            strokeOpacity="0.45"
                                            strokeDasharray="3 3"
                                        />
                                    )}

                                    {areaPath && <path d={areaPath} fill="url(#dashTrendGrad)" />}
                                    {linePath && (
                                        <path
                                            d={linePath}
                                            fill="none"
                                            stroke="#F5A623"
                                            strokeWidth="2.75"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}

                                    {points.map((p, i) => (
                                        <g
                                            key={i}
                                            tabIndex={0}
                                            onMouseEnter={() => setHoverIdx(i)}
                                            onMouseLeave={() => setHoverIdx(null)}
                                            onFocus={() => setHoverIdx(i)}
                                            onBlur={() => setHoverIdx(null)}
                                            className="cursor-pointer outline-none"
                                        >
                                            <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
                                            <circle
                                                cx={p.x}
                                                cy={p.y}
                                                r={hoverIdx === i ? 6 : 3.5}
                                                fill="#FFFFFF"
                                                stroke="#F5A623"
                                                strokeWidth="2.5"
                                                style={{ transition: 'r 120ms ease' }}
                                            />
                                        </g>
                                    ))}

                                    {xLabelIdx.map((i) => (
                                        <text
                                            key={i}
                                            x={points[i].x}
                                            y={chartH - 6}
                                            fontSize="10.5"
                                            fill="#8C8C8C"
                                            textAnchor={i === 0 && chartData.length > 1 ? 'start' : i === chartData.length - 1 && chartData.length > 1 ? 'end' : 'middle'}
                                        >
                                            {formatDateShort(points[i].raw.date)}
                                        </text>
                                    ))}
                                </svg>
                            </div>
                        )}
                    </Card>

                    <Card className="lg:col-span-4">
                        <CardHeader
                            icon={Flame}
                            tone="bg-amber-50"
                            iconColor="text-amber-500"
                            title="Produk Terlaris"
                            subtitle="Menu paling diminati"
                            action={<SeeAll href="/admin/produk">Semua</SeeAll>}
                        />

                        {topProducts.length === 0 ? (
                            <EmptyState icon={Flame} title="Belum ada penjualan" hint="Menu terlaris tampil di sini." />
                        ) : (
                            <ol className="mt-4 flex-1 space-y-1">
                                {topProducts.slice(0, 5).map((p, idx) => {
                                    const percent = Math.round((Number(p.total_terjual || 0) / maxTerjual) * 100);
                                    return (
                                        <li key={p.nama_produk} className="group rounded-xl p-2 transition hover:bg-muted/60">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                                                        idx === 0 ? 'bg-primary text-white' : 'bg-muted text-ink-soft'
                                                    }`}
                                                >
                                                    {idx + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-baseline justify-between gap-2">
                                                        <span className="truncate text-[13px] font-semibold text-ink">{p.nama_produk}</span>
                                                        <span className="shrink-0 text-[13px] font-bold text-ink">{p.total_terjual}x</span>
                                                    </div>
                                                    <div className="mt-1.5 flex items-center gap-2">
                                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                                                            <div
                                                                className="h-full rounded-full bg-primary transition-all duration-500"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                        <span className="shrink-0 text-[11px] font-medium text-ink-soft">{money(p.total_revenue)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </Card>
                </div>

                {/* ============ ROW 2: Transaksi + Stok ============ */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <Card className="lg:col-span-7">
                        <CardHeader
                            icon={ShoppingBag}
                            tone="bg-emerald-50"
                            iconColor="text-emerald-600"
                            title="Transaksi Terbaru"
                            subtitle="Pesanan masuk dari kasir/POS"
                            action={<SeeAll href="/admin/laporan">Laporan</SeeAll>}
                        />

                        {recentTransactions.length === 0 ? (
                            <EmptyState icon={ShoppingBag} title="Belum ada pesanan" hint="Pesanan baru akan muncul otomatis." />
                        ) : (
                            <ul className="mt-3 divide-y divide-line/70">
                                {recentTransactions.slice(0, 5).map((t) => (
                                    <li
                                        key={t.id_transaksi}
                                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-muted/50"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-[12px] font-bold text-ink-soft">
                                                {(t.nama_pelanggan || '?').charAt(0).toUpperCase()}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-semibold text-ink">
                                                    {t.nama_pelanggan}
                                                    <span className="ml-1.5 font-medium text-ink-soft">#{t.id_transaksi}</span>
                                                </p>
                                                <p className="truncate text-[11.5px] text-ink-soft">{t.items || 'Pesanan POS'}</p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[13px] font-bold text-ink">{money(t.total_belanja)}</p>
                                            <p className="text-[11px] text-ink-soft">{t.tanggal}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card className="lg:col-span-5">
                        <CardHeader
                            icon={AlertTriangle}
                            tone="bg-red-50"
                            iconColor="text-red-500"
                            title="Stok Menipis"
                            subtitle="Batas aman: 10 unit"
                            action={
                                <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                        lowStockProducts.length > 0 ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'
                                    }`}
                                >
                                    {lowStockProducts.length > 0 ? `${lowStockProducts.length} kritis` : 'Aman'}
                                </span>
                            }
                        />

                        {lowStockProducts.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                                <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50">
                                    <PackageCheck className="h-5 w-5 text-emerald-500" />
                                </span>
                                <p className="mt-2 text-[13px] font-semibold text-emerald-700">Semua stok aman</p>
                                <p className="mt-0.5 text-[11.5px] text-ink-soft">Tidak ada item di bawah 10 unit.</p>
                            </div>
                        ) : (
                            <>
                                <ul className="mt-3 flex-1 space-y-2">
                                    {lowStockProducts.slice(0, 5).map((p) => {
                                        const critical = p.stok <= 3;
                                        return (
                                            <li
                                                key={p.nama_produk}
                                                className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/50 px-3 py-2"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-semibold text-ink">{p.nama_produk}</p>
                                                    <p className="text-[11px] text-ink-soft">{p.nama_kategori}</p>
                                                </div>
                                                <span
                                                    className={`shrink-0 rounded-lg px-2 py-1 text-[11.5px] font-bold text-white ${
                                                        critical ? 'bg-red-600' : 'bg-amber-500'
                                                    }`}
                                                >
                                                    Sisa {p.stok}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3 text-[11.5px] text-ink-soft">
                                    <span>
                                        {lowStockProducts.length > 5 && `+${lowStockProducts.length - 5} item lainnya`}
                                    </span>
                                    <SeeAll href="/admin/produk">Restock</SeeAll>
                                </div>
                            </>
                        )}
                    </Card>
                </div>

                {/* ============ ROW 3: Kategori + Member ============ */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <Card className="lg:col-span-6">
                        <CardHeader
                            icon={Layers}
                            title="Omset per Kategori"
                            subtitle="Distribusi pendapatan menu"
                        />

                        {categorySales.length === 0 ? (
                            <EmptyState icon={Layers} title="Belum ada data kategori" />
                        ) : (
                            <ul className="mt-4 space-y-3">
                                {categorySales.slice(0, 5).map((c, idx) => {
                                    const barPct = Math.round((Number(c.total_omset || 0) / maxCatRevenue) * 100);
                                    const share = totalCatRevenue > 0 ? Math.round((Number(c.total_omset || 0) / totalCatRevenue) * 100) : 0;
                                    return (
                                        <li key={c.nama_kategori}>
                                            <div className="flex items-baseline justify-between text-[13px]">
                                                <span className="font-semibold text-ink">{c.nama_kategori}</span>
                                                <span>
                                                    <span className="font-bold text-ink">{money(c.total_omset)}</span>
                                                    <span className="ml-1.5 text-[11.5px] text-ink-soft">{share}%</span>
                                                </span>
                                            </div>
                                            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all duration-500"
                                                    style={{ width: `${barPct}%`, opacity: Math.max(0.4, 1 - idx * 0.15) }}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Card>

                    <Card className="lg:col-span-6">
                        <CardHeader
                            icon={Crown}
                            tone="bg-purple-50"
                            iconColor="text-purple-600"
                            title="Top Member"
                            subtitle="Pelanggan dengan belanja tertinggi"
                        />

                        {customerTiers.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {customerTiers.map((t) => (
                                    <span
                                        key={tierName(t)}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-semibold text-ink"
                                    >
                                        {tierName(t)}
                                        <span className="rounded-full bg-white px-1.5 text-[10.5px] font-bold text-ink-soft">{tierCount(t)}</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {topCustomers.length === 0 ? (
                            <EmptyState icon={Crown} title="Belum ada member aktif" />
                        ) : (
                            <ul className="mt-3 divide-y divide-line/70">
                                {topCustomers.slice(0, 4).map((cust, idx) => (
                                    <li key={cust.nama_pelanggan} className="flex items-center justify-between gap-3 px-1 py-2.5">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span
                                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                                                    idx === 0 ? 'bg-primary text-white' : 'bg-purple-100 text-purple-700'
                                                }`}
                                            >
                                                {idx + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-semibold text-ink">{cust.nama_pelanggan}</p>
                                                <p className="truncate text-[11.5px] text-ink-soft">{cust.kota}</p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[13px] font-bold text-ink">{money(cust.total_belanja)}</p>
                                            <span className="inline-block rounded-md bg-amber-50 px-1.5 text-[10.5px] font-bold text-amber-600">
                                                {cust.tier}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}