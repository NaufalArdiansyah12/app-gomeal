import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft, ClipboardCheck, ChefHat, Flame, BellRing, CheckCircle2,
    Calendar, Receipt, Wallet, Bike, UtensilsCrossed,
    MapPin, StickyNote,
} from 'lucide-react';
import PelangganLayout, { money } from './PelangganLayout';

const TIMELINE_STEPS = [
    {
        key: 'menunggu_kasir',
        title: 'Menunggu Konfirmasi Kasir',
        desc: 'Pesanan masuk, menunggu kasir verifikasi pembayaran & teruskan ke dapur.',
        icon: ClipboardCheck,
    },
    {
        key: 'menunggu_chef',
        title: 'Antrean Dapur',
        desc: 'Pesanan telah dikonfirmasi kasir dan masuk ke antrean chef.',
        icon: ChefHat,
    },
    {
        key: 'dimasak',
        title: 'Sedang Dimasak',
        desc: 'Chef sedang menyiapkan & memasak menu pesanan Anda.',
        icon: Flame,
    },
    {
        key: 'siap_kasir',
        title: 'Siap Disajikan / Diantar',
        desc: 'Makanan telah matang, siap disajikan ke meja atau dijemput kurir.',
        icon: BellRing,
    },
    {
        key: 'selesai',
        title: 'Pesanan Selesai',
        desc: 'Makanan telah diserahkan & dinikmati pelanggan.',
        icon: CheckCircle2,
    },
];

const STEP_INDEX = {
    menunggu_kasir: 0,
    menunggu_chef: 1,
    dimasak: 2,
    siap_kasir: 3,
    selesai: 4,
};

export default function OrderDetail({ customer, walletBalance, address, order }) {
    const currentIndex = STEP_INDEX[order.status_pesanan] ?? 0;
    const isDelivery = order.tipe_pesanan === 'delivery';

    const deliveryAddressText = typeof address === 'string'
        ? address
        : [address?.street, address?.city].filter(Boolean).join(', ');

    return (
        <PelangganLayout
            activePage="history"
            title="Detail Pesanan"
            subtitle={`Transaksi #${order.id_transaksi}`}
            customer={customer}
            walletBalance={walletBalance}
        >
            <Head title={`Detail Pesanan #${order.id_transaksi}`} />

            <div className="space-y-4 animate-page-enter">
                {/* Back button & quick badge */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/pelanggan/history"
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[11.5px] font-bold text-ink shadow-2xs transition active:scale-95"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Kembali</span>
                    </Link>

                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2.5 py-1 text-[11px] font-bold text-primary-deep">
                        {isDelivery ? <Bike className="h-3.5 w-3.5" /> : <UtensilsCrossed className="h-3.5 w-3.5" />}
                        <span className="capitalize">{order.tipe_pesanan}</span>
                    </span>
                </div>

                {/* TIMELINE STATUS PESANAN */}
                <section className="overflow-hidden rounded-[26px] border border-white/60 bg-gradient-to-b from-white to-cream/60 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-line/70 pb-3">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                                Status Pesanan
                            </span>
                            <h3 className="font-display text-[16px] font-bold text-ink">
                                {TIMELINE_STEPS[currentIndex]?.title}
                            </h3>
                        </div>
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-ink shadow-sm">
                            {(() => {
                                const Icon = TIMELINE_STEPS[currentIndex]?.icon || CheckCircle2;
                                return <Icon className="h-5 w-5" strokeWidth={2.4} />;
                            })()}
                        </span>
                    </div>

                    {/* Timeline Vertical Track */}
                    <div className="relative mt-4 space-y-5 pl-2">
                        {TIMELINE_STEPS.map((step, idx) => {
                            const isDone = idx < currentIndex;
                            const isCurrent = idx === currentIndex;
                            const isPending = idx > currentIndex;
                            const Icon = step.icon;
                            const isLast = idx === TIMELINE_STEPS.length - 1;

                            return (
                                <div key={step.key} className="relative flex items-start gap-3.5">
                                    {/* Connecting vertical line */}
                                    {!isLast && (
                                        <div
                                            className={`absolute left-[13px] top-7 -bottom-6 w-0.5 transition-colors duration-300 ${
                                                idx < currentIndex ? 'bg-primary' : 'bg-line'
                                            }`}
                                        />
                                    )}

                                    {/* Node Dot / Icon */}
                                    <div
                                        className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all duration-300 ${
                                            isDone
                                                ? 'bg-primary text-ink shadow-[0_2px_8px_rgba(245,166,35,0.4)]'
                                                : isCurrent
                                                    ? 'bg-ink text-primary ring-4 ring-primary/25 shadow-md animate-pulse'
                                                    : 'border-2 border-line bg-white text-ink-soft/40'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                                    </div>

                                    {/* Label & Description */}
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <div className="flex items-center gap-2">
                                            <p
                                                className={`text-[12.5px] font-bold ${
                                                    isCurrent
                                                        ? 'text-ink'
                                                        : isDone
                                                            ? 'text-ink/80'
                                                            : 'text-ink-soft/60'
                                                }`}
                                            >
                                                {step.title}
                                            </p>
                                            {isCurrent && (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                                                    Sedang Berjalan
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className={`mt-0.5 text-[11px] leading-snug ${
                                                isCurrent
                                                    ? 'text-ink-soft'
                                                    : isDone
                                                        ? 'text-ink-soft/80'
                                                        : 'text-ink-soft/50'
                                            }`}
                                        >
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* DAFTAR MENU YANG DIPESAN */}
                <section className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-line pb-3">
                        <div className="flex items-center gap-2">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-subtle text-primary-deep">
                                <Receipt className="h-4 w-4" />
                            </span>
                            <h4 className="font-display text-[13.5px] font-bold text-ink">
                                Menu Pesanan ({order.total_items} item)
                            </h4>
                        </div>
                    </div>

                    <div className="mt-3 divide-y divide-line/70">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-2.5">
                                <img
                                    src={item.image}
                                    alt={item.nama_produk}
                                    className="h-12 w-12 shrink-0 rounded-xl object-cover bg-muted"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[12.5px] font-bold text-ink">
                                        {item.nama_produk}
                                    </p>
                                    <p className="text-[11px] text-ink-soft">
                                        {item.jumlah} x {money(item.harga)}
                                    </p>
                                </div>
                                <p className="font-display text-[12.5px] font-bold text-primary-deep">
                                    {money(item.subtotal)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* INFO PENGANTARAN / CATATAN */}
                <section className="space-y-2.5 rounded-[24px] border border-line bg-white p-4 shadow-sm text-[12px]">
                    <h4 className="font-display text-[13.5px] font-bold text-ink">Informasi Pesanan</h4>

                    <div className="space-y-2 pt-1">
                        <div className="flex items-start gap-2.5">
                            <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                            <div>
                                <p className="text-[10px] text-ink-soft">Waktu Pemesanan</p>
                                <p className="font-semibold text-ink">{order.tanggal}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                            <div>
                                <p className="text-[10px] text-ink-soft">Metode Pembayaran</p>
                                <p className="font-semibold text-ink uppercase">{order.metode_pembayaran.replace('_', ' ')}</p>
                            </div>
                        </div>

                        {isDelivery && (
                            <div className="flex items-start gap-2.5">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-deep" />
                                <div>
                                    <p className="text-[10px] text-ink-soft">Alamat Tujuan</p>
                                    <p className="font-semibold text-ink">{deliveryAddressText}</p>
                                </div>
                            </div>
                        )}

                        {order.catatan && (
                            <div className="flex items-start gap-2.5 rounded-xl bg-cream/70 p-2.5">
                                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-deep" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Catatan Pelanggan</p>
                                    <p className="text-[11.5px] italic text-ink">{order.catatan}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ringkasan Total */}
                    <div className="border-t border-dashed border-line pt-3">
                        <div className="flex items-center justify-between text-ink-soft">
                            <span>Subtotal Menu</span>
                            <span>{money(order.total_belanja)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between font-display text-[15px] font-bold text-ink">
                            <span>Total Tagihan</span>
                            <span className="text-primary-deep">{money(order.total_belanja)}</span>
                        </div>
                    </div>
                </section>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1 pb-6">
                    <Link
                        href="/pelanggan/delivery"
                        className="flex flex-1 items-center justify-center rounded-2xl bg-primary py-3 text-[12.5px] font-bold text-ink shadow-md transition active:scale-95"
                    >
                        Pesan Menu Lain
                    </Link>
                    <Link
                        href="/pelanggan/history"
                        className="flex items-center justify-center rounded-2xl border border-line bg-white px-4 py-3 text-[12.5px] font-bold text-ink-soft shadow-2xs transition active:scale-95"
                    >
                        Riwayat
                    </Link>
                </div>
            </div>
        </PelangganLayout>
    );
}
