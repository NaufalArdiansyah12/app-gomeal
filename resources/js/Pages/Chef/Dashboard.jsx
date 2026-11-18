import { router, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import {
    ChefHat,
    Search,
    RefreshCw,
    Flame,
    Check,
    Package,
    LogOut,
    CheckCircle,
    AlertCircle,
    Menu,
    X,
    UtensilsCrossed,
} from 'lucide-react';

const money = (n) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const ORDER_TYPE_LABEL = {
    dine_in: 'Dine In',
    delivery: 'Delivery',
};

const COLUMNS = [
    {
        key: 'menunggu_chef',
        title: 'Antre dapur',
        rail: 'border-t-2 border-t-[#D97706]',
        countCls: 'bg-[#FFF3E0] text-[#9A4B00]',
    },
    {
        key: 'dimasak',
        title: 'Sedang dimasak',
        rail: 'border-t-2 border-t-[#EA580C]',
        countCls: 'bg-[#FFEDE5] text-[#B83B08]',
    },
    {
        key: 'siap_kasir',
        title: 'Siap serah',
        rail: 'border-t-2 border-t-[#2563EB]',
        countCls: 'bg-[#E8F0FE] text-[#1D4ED8]',
    },
    {
        key: 'selesai',
        title: 'Selesai',
        rail: 'border-t-2 border-t-[#15803D]',
        countCls: 'bg-[#E7F6EC] text-[#166534]',
    },
];

export default function ChefDashboard({ username, orders = [] }) {
    const { flash } = usePage().props;
    const [toast, setToast] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        if (flash?.success) setToast({ type: 'success', text: flash.success });
        if (flash?.error) setToast({ type: 'error', text: flash.error });
    }, [flash]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const groupedOrders = useMemo(() => {
        const q = search.trim().toLowerCase();
        const buckets = {
            menunggu_chef: [],
            dimasak: [],
            siap_kasir: [],
            selesai: [],
        };

        for (const order of orders) {
            if (q) {
                const match =
                    String(order.id_transaksi).includes(q)
                    || (order.nama_pelanggan || '').toLowerCase().includes(q)
                    || order.items.some((i) => i.nama_produk.toLowerCase().includes(q));
                if (!match) continue;
            }
            if (buckets[order.status_pesanan]) {
                buckets[order.status_pesanan].push(order);
            }
        }

        return buckets;
    }, [orders, search]);

    const handleUpdateStatus = (orderId, nextStatus) => {
        setBusyId(orderId);
        router.post(
            `/chef/orders/${orderId}/status`,
            { status_pesanan: nextStatus },
            {
                preserveScroll: true,
                onFinish: () => setBusyId(null),
            }
        );
    };

    const activeCount = orders.filter((o) => o.status_pesanan !== 'selesai').length;
    const needsChefCount =
        (groupedOrders.menunggu_chef?.length || 0) + (groupedOrders.dimasak?.length || 0);
    const displayName = username || 'Chef';

    return (
        <div className="flex min-h-screen w-full bg-cream font-body text-ink antialiased">
            {/* Toast Notification */}
            {toast && (
                <div className="pointer-events-none fixed bottom-8 left-1/2 z-60 -translate-x-1/2 animate-[toastIn_0.24s_ease-out]">
                    <div
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)] ${
                            toast.type === 'success' ? 'bg-ink' : 'bg-red-600'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-primary" strokeWidth={2.5} />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-white" strokeWidth={2.5} />
                        )}
                        <span>{toast.text}</span>
                    </div>
                </div>
            )}

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[270px] transform flex-col justify-between overflow-y-auto bg-ink p-5 text-white transition-transform duration-300 ease-in-out lg:hidden ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-1.5">
                            <span className="font-display text-xl font-bold tracking-tight text-white">
                                GoMeal<span className="text-primary">.</span>
                            </span>
                            <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[8.5px] font-bold uppercase text-orange-300">
                                Chef
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                        >
                            <X className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                    </div>

                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                        Menu Dapur
                    </p>
                    <nav className="mt-2.5 space-y-1">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="flex w-full items-center gap-3 rounded-xl bg-primary px-3.5 py-2.5 text-[13px] font-semibold text-ink shadow-sm"
                        >
                            <UtensilsCrossed style={{ width: 18, height: 18 }} strokeWidth={2.5} />
                            <span>Order Makanan</span>
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ink" />
                        </button>
                    </nav>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <div>
                        <p className="text-[12px] font-semibold text-white">{displayName}</p>
                        <p className="text-[9.5px] text-white/40">Kepala Dapur</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        title="Logout"
                        className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/50 hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </aside>

            {/* Desktop Sidebar (Matches AdminLayout) */}
            <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col justify-between overflow-y-auto border-r border-white/5 bg-ink p-5 text-white no-scrollbar lg:flex xl:w-[260px]">
                <div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <span className="font-display text-[21px] font-bold tracking-tight text-white">
                            GoMeal<span className="text-primary">.</span>
                        </span>
                        <span className="grid h-6 place-items-center rounded-full bg-orange-500/20 px-2 text-[9px] font-bold uppercase tracking-wider text-orange-300">
                            Chef
                        </span>
                    </div>

                    <p className="mt-6 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-white/35">
                        Menu Dapur
                    </p>
                    <nav className="mt-2.5 space-y-1">
                        <div className="flex w-full items-center gap-3 rounded-xl bg-primary px-3.5 py-2.5 text-[13px] font-semibold text-ink shadow-sm">
                            <UtensilsCrossed style={{ width: 18, height: 18 }} strokeWidth={2.5} />
                            <span>Order Makanan</span>
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ink" />
                        </div>
                    </nav>
                </div>

                <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-2.5">
                        <img
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`}
                            alt={displayName}
                            className="h-8 w-8 rounded-full bg-white/10 object-cover"
                        />
                        <div className="min-w-0">
                            <p className="truncate text-[11.5px] font-semibold text-white">{displayName}</p>
                            <p className="truncate text-[9.5px] text-white/45">Kepala Dapur</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.post('/logout')}
                            title="Logout"
                            className="ml-auto grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/40 transition hover:bg-white/20 hover:text-white active:scale-95"
                        >
                            <LogOut className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                {/* Mobile Top Bar */}
                <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Toggle Menu"
                        className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white transition hover:opacity-90 active:scale-95"
                    >
                        <Menu className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-1.5">
                        <span className="font-display text-xl font-bold tracking-tight text-ink">
                            GoMeal<span className="text-primary">.</span>
                        </span>
                        <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[8.5px] font-bold uppercase text-orange-700">
                            Chef
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        title="Logout"
                        className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-sm transition active:scale-95"
                    >
                        <LogOut className="h-4 w-4 text-ink-soft" strokeWidth={2.5} />
                    </button>
                </header>

                <main className="w-full flex-1 space-y-5 p-4 sm:p-5 lg:p-6 xl:p-8">
                    {/* Top Header Card (Matches AdminLayout) */}
                    <section className="rounded-[22px] border border-line bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <ChefHat className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                                        Portal Dapur
                                    </p>
                                </div>
                                <h1 className="mt-0.5 font-display text-[22px] font-bold leading-tight tracking-tight text-ink sm:text-[24px]">
                                    Order Makanan
                                </h1>
                                <p className="mt-0.5 text-[11.5px] text-ink-soft">
                                    Tiket pesanan dapur dari antrean masak sampai siap diserahkan ke kasir.
                                </p>
                            </div>

                            <div className="relative">
                                <img
                                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`}
                                    alt={displayName}
                                    className="h-9 w-9 rounded-full bg-primary-subtle object-cover"
                                />
                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-white" />
                            </div>
                        </div>
                    </section>

                    {/* Compact Utility Strip (Matches OrderMakanan.jsx) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                        <div className="flex items-center gap-4 text-[12.5px]">
                            <span className="text-ink-soft">
                                Aktif <strong className="ml-1 font-display text-ink">{activeCount}</strong>
                            </span>
                            <span className="h-3.5 w-px bg-line" />
                            <span className="text-ink-soft">
                                Butuh tindakan chef{' '}
                                <strong
                                    className={`ml-1 font-display ${
                                        needsChefCount > 0 ? 'text-primary-deep' : 'text-ink'
                                    }`}
                                >
                                    {needsChefCount}
                                </strong>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative w-56 sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nomor, nama, menu..."
                                    className="w-full rounded-lg border border-line bg-white py-1.5 pl-8 pr-3 text-[12px] text-ink placeholder:text-ink-soft/70 outline-none transition focus:border-ink"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => router.reload({ only: ['stats', 'orders'] })}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[12px] font-medium text-ink transition hover:border-ink"
                                title="Muat ulang papan"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Muat ulang</span>
                            </button>
                        </div>
                    </div>

                    {/* 4-Column Kitchen-Ticket Board (Matches OrderMakanan.jsx) */}
                    <section className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {COLUMNS.map((col) => {
                            const colOrders = groupedOrders[col.key] || [];
                            const isCompletedCol = col.key === 'selesai';

                            return (
                                <div
                                    key={col.key}
                                    className={`flex min-w-0 flex-col rounded-xl border border-line bg-[#F6F4EF] ${col.rail}`}
                                >
                                    {/* Lane Header */}
                                    <div className="flex items-center justify-between px-3 py-2.5">
                                        <h2 className="truncate font-display text-[13px] font-semibold text-ink">
                                            {col.title}
                                        </h2>
                                        <span
                                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${col.countCls}`}
                                        >
                                            {colOrders.length}
                                        </span>
                                    </div>

                                    {/* Ticket Stack */}
                                    <div className="flex flex-col gap-2 px-2 pb-2.5">
                                        {colOrders.length === 0 ? (
                                            <div className="rounded-lg border border-dashed border-[#DFDCD4] px-3 py-7 text-center text-[11.5px] text-ink-soft">
                                                Tidak ada pesanan
                                            </div>
                                        ) : (
                                            colOrders.map((order) => {
                                                const isBusy = busyId === order.id_transaksi;

                                                return (
                                                    <article
                                                        key={order.id_transaksi}
                                                        className={`rounded-lg border border-[#E6E3DB] bg-white p-3 transition ${
                                                            isCompletedCol
                                                                ? 'opacity-80'
                                                                : 'shadow-[0_1px_2px_rgba(26,26,26,0.04)]'
                                                        }`}
                                                    >
                                                        {/* Ticket Header */}
                                                        <div className="flex items-baseline justify-between gap-2">
                                                            <span className="text-[11px] font-semibold tabular-nums text-ink-soft">
                                                                #{order.id_transaksi}
                                                            </span>
                                                            <span className="text-[11px] font-medium text-ink-soft">
                                                                {ORDER_TYPE_LABEL[order.tipe_pesanan] || order.tipe_pesanan}
                                                            </span>
                                                        </div>

                                                        <p className="mt-0.5 truncate font-display text-[13.5px] font-semibold text-ink">
                                                            {order.nama_pelanggan}
                                                        </p>

                                                        {/* Ordered Items */}
                                                        <ul className="mt-2 space-y-1 border-t border-dashed border-[#E6E3DB] pt-2 text-[12px] leading-snug text-ink">
                                                            {order.items.map((item, idx) => (
                                                                <li
                                                                    key={`${order.id_transaksi}-${idx}`}
                                                                    className="flex items-baseline justify-between gap-2"
                                                                >
                                                                    <span className="truncate">{item.nama_produk}</span>
                                                                    <span className="shrink-0 font-semibold tabular-nums text-ink-soft">
                                                                        ×{item.jumlah}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>

                                                        {/* Customer Note */}
                                                        {order.catatan && (
                                                            <p className="mt-2 rounded-md bg-[#FAF6EC] px-2 py-1 text-[11px] leading-snug text-[#7C5200]">
                                                                {order.catatan}
                                                            </p>
                                                        )}

                                                        {/* Ticket Footer: Total */}
                                                        <div className="mt-2.5 flex items-center justify-between border-t border-line/80 pt-2">
                                                            <span className="text-[11px] text-ink-soft">Total</span>
                                                            <span className="font-display text-[12.5px] font-bold tabular-nums text-ink">
                                                                {money(order.total_belanja)}
                                                            </span>
                                                        </div>

                                                        {order.status_pesanan === 'menunggu_chef' && (
                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={() =>
                                                                    handleUpdateStatus(order.id_transaksi, 'dimasak')
                                                                }
                                                                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink px-2.5 py-2 text-[11.5px] font-semibold text-white transition hover:bg-ink/90 active:scale-[0.99] disabled:opacity-50"
                                                            >
                                                                <Flame className="h-3.5 w-3.5 text-primary" />
                                                                {isBusy ? 'Memproses...' : 'Mulai masak'}
                                                            </button>
                                                        )}

                                                        {order.status_pesanan === 'dimasak' && (
                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={() =>
                                                                    handleUpdateStatus(order.id_transaksi, 'siap_kasir')
                                                                }
                                                                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#15803D] px-2.5 py-2 text-[11.5px] font-semibold text-white transition hover:bg-[#166534] active:scale-[0.99] disabled:opacity-50"
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                                {isBusy ? 'Menyimpan...' : 'Selesai masak'}
                                                            </button>
                                                        )}

                                                        {order.status_pesanan === 'siap_kasir' && (
                                                            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#1D4ED8]">
                                                                <Package className="h-3.5 w-3.5 shrink-0" />
                                                                <span>Menunggu serah kasir</span>
                                                            </div>
                                                        )}
                                                    </article>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                </main>
            </div>
        </div>
    );
}
