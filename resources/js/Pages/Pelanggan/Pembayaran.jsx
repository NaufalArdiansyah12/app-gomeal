import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Wallet, PlusCircle, QrCode, Landmark, Banknote, ShieldCheck,
    Receipt, ArrowUpRight, Clock,
} from 'lucide-react';
import PelangganLayout, { money } from './PelangganLayout';

const PRESETS = [25000, 50000, 100000, 250000];

const TOPUP_METHODS = [
    { key: 'Transfer Bank VA', label: 'Bank VA', icon: Landmark },
    { key: 'QRIS Instant', label: 'QRIS', icon: QrCode },
    { key: 'Tunai di Kasir', label: 'Kasir', icon: Banknote },
];

export default function Pembayaran({
    customer,
    walletBalance = 0,
    orderHistory = [],
    walletLogs = [],
}) {
    const [amount, setAmount] = useState(100000);
    const [method, setMethod] = useState('Transfer Bank VA');
    const [processing, setProcessing] = useState(false);

    const handleTopUp = (e) => {
        e.preventDefault();
        if (!amount || Number(amount) < 10000 || processing) return;
        setProcessing(true);
        router.post(
            '/top-up',
            { amount: Number(amount), method },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <PelangganLayout
            activePage="pembayaran"
            title="Pembayaran"
            subtitle="GoMeal Pay, Top Up saldo & riwayat tagihan"
            customer={customer}
            walletBalance={walletBalance}
        >
            <Head title="Pembayaran" />

            <div className="space-y-4">
                {/* GoMeal Pay Card */}
                <section className="rounded-[24px] bg-gradient-to-br from-ink via-[#262626] to-[#111111] p-5 text-white shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-ink">
                                <Wallet className="h-4.5 w-4.5" strokeWidth={2.4} />
                            </span>
                            <div>
                                <p className="font-display text-[13.5px] font-bold">GoMeal Pay</p>
                                <p className="text-[10px] text-white/55">Dompet Digital</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            <ShieldCheck className="h-3 w-3" />
                            Aktif
                        </span>
                    </div>

                    <div className="my-5">
                        <p className="text-[10.5px] uppercase tracking-wider text-white/50">Saldo Tersedia</p>
                        <p className="mt-0.5 font-display text-2xl font-bold tracking-tight text-primary">
                            {money(walletBalance)}
                        </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px]">
                        <div>
                            <p className="text-white/50">Pemilik</p>
                            <p className="font-semibold text-white">{customer.nama_pelanggan}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/50">Membership</p>
                            <p className="font-semibold text-primary">{customer.tier}</p>
                        </div>
                    </div>
                </section>

                {/* Top Up Form */}
                <section className="rounded-[22px] border border-line bg-white p-4">
                    <div className="flex items-center gap-2">
                        <PlusCircle className="h-4.5 w-4.5 text-primary-deep" />
                        <h3 className="font-display text-[14.5px] font-bold text-ink">Top Up Saldo</h3>
                    </div>

                    <form onSubmit={handleTopUp} className="mt-3 space-y-3.5">
                        <div className="grid grid-cols-2 gap-2">
                            {PRESETS.map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setAmount(val)}
                                    className={`rounded-xl border py-2 text-[12px] font-bold transition active:scale-95 ${
                                        Number(amount) === val
                                            ? 'border-primary bg-primary-subtle text-ink'
                                            : 'border-line bg-cream/50 text-ink-soft'
                                    }`}
                                >
                                    {money(val)}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-ink">Nominal Custom (Rp)</label>
                            <input
                                type="number"
                                min={10000}
                                max={10000000}
                                step={5000}
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-line bg-cream/40 px-3 py-2 text-[13px] font-bold text-ink outline-none focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-ink">Metode Top Up</label>
                            <div className="mt-1.5 grid grid-cols-3 gap-2">
                                {TOPUP_METHODS.map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setMethod(key)}
                                        className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10.5px] font-bold transition ${
                                            method === key
                                                ? 'border-primary bg-primary-subtle text-ink'
                                                : 'border-line bg-white text-ink-soft'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing || Number(amount) < 10000}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12.5px] font-bold text-ink transition active:scale-95 disabled:opacity-50"
                        >
                            <ArrowUpRight className="h-4 w-4" />
                            <span>{processing ? 'Memproses...' : `Top Up · ${money(amount)}`}</span>
                        </button>
                    </form>
                </section>

                {/* Riwayat Tagihan */}
                <section className="rounded-[22px] border border-line bg-white p-4">
                    <div className="flex items-center gap-2 border-b border-line pb-2.5">
                        <Receipt className="h-4 w-4 text-primary-deep" />
                        <h3 className="font-display text-[14px] font-bold text-ink">Riwayat Pembayaran</h3>
                    </div>

                    {orderHistory.length === 0 ? (
                        <p className="py-6 text-center text-[12px] text-ink-soft">Belum ada transaksi.</p>
                    ) : (
                        <div className="mt-2 divide-y divide-line">
                            {orderHistory.slice(0, 8).map((bill) => (
                                <div key={bill.id_transaksi} className="flex items-center justify-between py-2.5">
                                    <div className="min-w-0 pr-3">
                                        <p className="text-[12px] font-bold text-ink">Tagihan #{bill.id_transaksi}</p>
                                        <p className="truncate text-[10.5px] text-ink-soft">
                                            {bill.item_names || `${bill.total_items} item`}
                                        </p>
                                        <p className="text-[10px] text-ink-soft">{bill.tanggal}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-[12.5px] font-bold text-ink">{money(bill.total_belanja)}</p>
                                        <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                            Lunas
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Aktivitas Dompet */}
                <section className="rounded-[22px] border border-line bg-white p-4">
                    <div className="flex items-center gap-2 border-b border-line pb-2.5">
                        <Clock className="h-4 w-4 text-primary-deep" />
                        <h3 className="font-display text-[14px] font-bold text-ink">Aktivitas Dompet</h3>
                    </div>

                    {walletLogs.length === 0 ? (
                        <p className="py-6 text-center text-[12px] text-ink-soft">Belum ada aktivitas.</p>
                    ) : (
                        <div className="mt-2.5 space-y-2">
                            {walletLogs.slice(0, 8).map((log) => (
                                <div key={log.id_log} className="rounded-xl bg-muted/60 p-2.5 text-[11.5px]">
                                    <p className="font-medium text-ink">{log.aktivitas}</p>
                                    <p className="mt-0.5 text-[10px] text-ink-soft">{log.waktu}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </PelangganLayout>
    );
}
