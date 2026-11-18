import { router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { Search, RefreshCw, Send, Check, Flame } from 'lucide-react';

const money = (n) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const PAYMENT_LABEL = {
    gomeal_pay: 'GoMeal Pay',
    qris: 'QRIS',
    tunai: 'Tunai',
};

const COLUMNS = [
    {
        key: 'menunggu_kasir',
        title: 'Order masuk',
        rail: 'border-t-2 border-t-[#C88400]',
        countCls: 'bg-[#FEF3E2] text-[#9A6000]',
        actionable: true,
    },
    {
        key: 'menunggu_chef',
        title: 'Antre dapur',
        rail: 'border-t-2 border-t-[#D97706]',
        countCls: 'bg-[#FFF3E0] text-[#9A4B00]',
        actionable: false,
    },
    {
        key: 'dimasak',
        title: 'Sedang dimasak',
        rail: 'border-t-2 border-t-[#EA580C]',
        countCls: 'bg-[#FFEDE5] text-[#B83B08]',
        actionable: false,
    },
    {
        key: 'siap_kasir',
        title: 'Siap serah',
        rail: 'border-t-2 border-t-[#2563EB]',
        countCls: 'bg-[#E8F0FE] text-[#1D4ED8]',
        actionable: true,
    },
    {
        key: 'selesai',
        title: 'Selesai',
        rail: 'border-t-2 border-t-[#15803D]',
        countCls: 'bg-[#E7F6EC] text-[#166534]',
        actionable: false,
    },
];

export default function OrderMakananPage({ orders = [] }) {
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState(null);

    const groupedOrders = useMemo(() => {
        const q = search.trim().toLowerCase();
        const buckets = {
            menunggu_kasir: [],
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
            `/admin/order-makanan/${orderId}/status`,
            { status_pesanan: nextStatus },
            {
                preserveScroll: true,
                onFinish: () => setBusyId(null),
            }
        );
    };

    const activeCount = orders.filter((o) => o.status_pesanan !== 'selesai').length;
    const needsKasirCount =
        (groupedOrders.menunggu_kasir?.length || 0) + (groupedOrders.siap_kasir?.length || 0);

    return (
        <AdminLayout
            activePage="order-makanan"
            title="Order Makanan"
            subtitle="Tiket pesanan delivery dari verifikasi sampai penyerahan."
        >
            {/* Compact Utility Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex items-center gap-4 text-[12.5px]">
                    <span className="text-ink-soft">
                        Aktif <strong className="ml-1 font-display text-ink">{activeCount}</strong>
                    </span>
                    <span className="h-3.5 w-px bg-line" />
                    <span className="text-ink-soft">
                        Butuh tindakan kasir{' '}
                        <strong className={`ml-1 font-display ${needsKasirCount > 0 ? 'text-primary-deep' : 'text-ink'}`}>
                            {needsKasirCount}
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

            {/* 5-Column Kitchen-Ticket Board (No Scrollbar) */}
            <section className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                                <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${col.countCls}`}>
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
                                                    isCompletedCol ? 'opacity-80' : 'shadow-[0_1px_2px_rgba(26,26,26,0.04)]'
                                                }`}
                                            >
                                                {/* Ticket Header */}
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <span className="text-[11px] font-semibold tabular-nums text-ink-soft">
                                                        #{order.id_transaksi}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-ink-soft">
                                                        {PAYMENT_LABEL[order.metode_pembayaran] || order.metode_pembayaran}
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

                                                {/* Ticket Footer: Total + Action */}
                                                <div className="mt-2.5 flex items-center justify-between border-t border-line/80 pt-2">
                                                    <span className="text-[11px] text-ink-soft">Total</span>
                                                    <span className="font-display text-[12.5px] font-bold tabular-nums text-ink">
                                                        {money(order.total_belanja)}
                                                    </span>
                                                </div>

                                                {order.status_pesanan === 'menunggu_kasir' && (
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => handleUpdateStatus(order.id_transaksi, 'menunggu_chef')}
                                                        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink px-2.5 py-2 text-[11.5px] font-semibold text-white transition hover:bg-ink/90 active:scale-[0.99] disabled:opacity-50"
                                                    >
                                                        <Send className="h-3.5 w-3.5 text-primary" />
                                                        {isBusy ? 'Mengirim...' : 'Teruskan ke dapur'}
                                                    </button>
                                                )}

                                                {order.status_pesanan === 'siap_kasir' && (
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => handleUpdateStatus(order.id_transaksi, 'selesai')}
                                                        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#15803D] px-2.5 py-2 text-[11.5px] font-semibold text-white transition hover:bg-[#166534] active:scale-[0.99] disabled:opacity-50"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                        {isBusy ? 'Menyimpan...' : 'Serahkan pesanan'}
                                                    </button>
                                                )}

                                                {order.status_pesanan === 'dimasak' && (
                                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#B83B08]">
                                                        <Flame className="h-3.5 w-3.5 shrink-0" />
                                                        <span>Diproses chef</span>
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
        </AdminLayout>
    );
}
