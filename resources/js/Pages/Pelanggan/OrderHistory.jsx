import { Head, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    History, Search, ClipboardCheck, ChefHat, Flame, BellRing, CheckCircle2,
    QrCode, UtensilsCrossed, ChevronRight, Bike, Calendar,
} from 'lucide-react';
import PelangganLayout, { money } from './PelangganLayout';

const STATUS_META = {
    menunggu_kasir: { label: 'Konfirmasi Kasir', step: 1, cls: 'bg-orange-100 text-orange-800 border-orange-200', icon: ClipboardCheck },
    menunggu_chef: { label: 'Menunggu Dapur', step: 2, cls: 'bg-amber-100 text-amber-800 border-amber-200', icon: ChefHat },
    dimasak: { label: 'Sedang Dimasak', step: 3, cls: 'bg-blue-100 text-blue-800 border-blue-200', icon: Flame },
    siap_kasir: { label: 'Siap Disajikan', step: 4, cls: 'bg-purple-100 text-purple-800 border-purple-200', icon: BellRing },
    selesai: { label: 'Selesai', step: 5, cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
};

const ONGOING_STATUSES = ['menunggu_kasir', 'menunggu_chef', 'dimasak', 'siap_kasir'];

export default function OrderHistory({ customer, walletBalance, orderHistory = [] }) {
    const [tab, setTab] = useState('semua');
    const [search, setSearch] = useState('');

    const filteredOrders = useMemo(() => {
        return orderHistory.filter((o) => {
            const isOngoing = ONGOING_STATUSES.includes(o.status_pesanan);
            if (tab === 'berlangsung' && !isOngoing) return false;
            if (tab === 'selesai' && o.status_pesanan !== 'selesai') return false;

            const q = search.trim().toLowerCase();
            if (!q) return true;
            return (
                String(o.id_transaksi).includes(q)
                || (o.item_names || '').toLowerCase().includes(q)
                || (o.tanggal || '').toLowerCase().includes(q)
            );
        });
    }, [orderHistory, tab, search]);

    const ongoingCount = orderHistory.filter((o) =>
        ONGOING_STATUSES.includes(o.status_pesanan)
    ).length;

    return (
        <PelangganLayout
            activePage="history"
            title="Riwayat"
            subtitle="Pantau status pesanan aktif & riwayat transaksi"
            customer={customer}
            walletBalance={walletBalance}
        >
            <Head title="Riwayat Pesanan" />

            <div className="space-y-4 animate-page-enter">
                {/* Filter & Search */}
                <section className="space-y-2.5 rounded-[22px] border border-line bg-white p-3.5 shadow-2xs">
                    <div className="grid grid-cols-3 gap-1.5">
                        {[
                            { key: 'semua', label: `Semua (${orderHistory.length})` },
                            { key: 'berlangsung', label: `Aktif (${ongoingCount})` },
                            { key: 'selesai', label: `Selesai (${orderHistory.length - ongoingCount})` },
                        ].map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={`rounded-xl py-1.5 text-[11px] font-bold transition active:scale-95 ${
                                    tab === t.key
                                        ? 'bg-ink text-white shadow-xs'
                                        : 'bg-muted text-ink-soft hover:bg-cream'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari #ID atau nama menu..."
                            className="w-full rounded-xl border border-line bg-cream/60 py-2 pl-8 pr-3 text-[12px] outline-none focus:border-primary"
                        />
                    </div>
                </section>

                {/* Orders Card List */}
                {filteredOrders.length === 0 ? (
                    <section className="rounded-[24px] border border-line bg-white p-8 text-center shadow-2xs">
                        <History className="mx-auto h-9 w-9 text-ink-soft/40" />
                        <h3 className="mt-2 font-display text-[15px] font-bold text-ink">Belum Ada Pesanan</h3>
                        <p className="mt-1 text-[12px] text-ink-soft">
                            Pesan makanan Delivery atau Dine In untuk memantau status pesanan di sini.
                        </p>
                        <div className="mt-4 flex justify-center gap-2">
                            <Link
                                href="/pelanggan/delivery"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[11.5px] font-bold text-ink transition active:scale-95"
                            >
                                <Bike className="h-3.5 w-3.5" />
                                Pesan Delivery
                            </Link>
                            <Link
                                href="/pelanggan/dine-in"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-[11.5px] font-bold text-white transition active:scale-95"
                            >
                                <QrCode className="h-3.5 w-3.5 text-primary" />
                                Scan Dine In
                            </Link>
                        </div>
                    </section>
                ) : (
                    <section className="space-y-3 pb-8">
                        {filteredOrders.map((order) => {
                            const meta = STATUS_META[order.status_pesanan] || STATUS_META.selesai;
                            const StatusIcon = meta.icon;
                            const isDelivery = order.tipe_pesanan === 'delivery';

                            return (
                                <Link
                                    key={order.id_transaksi}
                                    href={`/pelanggan/history/${order.id_transaksi}`}
                                    className="group block overflow-hidden rounded-[24px] border border-line bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md active:scale-[0.99]"
                                >
                                    {/* Card Header: Order ID, Type badge, & Status */}
                                    <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-cream text-ink-soft">
                                                {isDelivery ? (
                                                    <Bike className="h-4 w-4 text-primary-deep" />
                                                ) : (
                                                    <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
                                                )}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-display text-[13.5px] font-bold text-ink">
                                                        #{order.id_transaksi}
                                                    </span>
                                                    <span className="rounded-full bg-cream px-2 py-0.5 text-[9.5px] font-bold uppercase text-ink-soft">
                                                        {order.tipe_pesanan}
                                                    </span>
                                                </div>
                                                <p className="flex items-center gap-1 text-[10.5px] text-ink-soft">
                                                    <Calendar className="h-3 w-3" />
                                                    {order.tanggal}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${meta.cls}`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {meta.label}
                                        </span>
                                    </div>

                                    {/* Card Body: Ordered menu item previews */}
                                    <div className="my-3 space-y-2">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2.5 rounded-xl bg-cream/50 p-2">
                                                {item.image && (
                                                    <img
                                                        src={item.image}
                                                        alt={item.nama_produk}
                                                        className="h-10 w-10 shrink-0 rounded-lg object-cover bg-muted"
                                                    />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[12px] font-bold text-ink">
                                                        {item.nama_produk}
                                                    </p>
                                                    <p className="text-[10.5px] text-ink-soft">
                                                        {item.jumlah} porsi x {money(item.harga)}
                                                    </p>
                                                </div>
                                                <span className="font-display text-[11.5px] font-bold text-ink">
                                                    {money(item.subtotal)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Card Footer: Total price & Click to view detail */}
                                    <div className="flex items-center justify-between border-t border-dashed border-line pt-2.5 text-[11.5px]">
                                        <div>
                                            <p className="text-[10px] text-ink-soft">Total Pembayaran ({order.total_items} item)</p>
                                            <p className="font-display text-[14px] font-bold text-primary-deep">
                                                {money(order.total_belanja)}
                                            </p>
                                        </div>

                                        <div className="inline-flex items-center gap-1 text-[11.5px] font-bold text-primary-deep transition group-hover:translate-x-0.5">
                                            <span>Lihat Status & Detail</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </section>
                )}
            </div>
        </PelangganLayout>
    );
}
