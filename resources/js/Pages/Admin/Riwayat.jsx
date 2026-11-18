import AdminLayout from './AdminLayout';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    History, Search, Printer, AlertTriangle, Eye, X,
    Calendar, ArrowDownRight, TrendingUp, CheckCircle,
    Receipt, User, MapPin, Package, AlertCircle, RotateCcw,
} from 'lucide-react';

export default function RiwayatPage({ transaksiList = [], filters = {}, summary = {}, isKasir = false }) {
    const [search, setSearch] = useState(filters.q || '');
    const [selectedTx, setSelectedTx] = useState(null);
    const [voidTx, setVoidTx] = useState(null);
    const [voidLoading, setVoidLoading] = useState(false);

    const money = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleRangeChange = (range) => {
        router.get('/admin/riwayat', {
            range,
            q: search || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get('/admin/riwayat', {
            range: filters.range || 'all',
            q: search || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleConfirmVoid = () => {
        if (!voidTx) return;
        setVoidLoading(true);
        router.post(`/admin/riwayat/${voidTx.id_transaksi}/void`, {}, {
            onFinish: () => {
                setVoidLoading(false);
                setVoidTx(null);
                if (selectedTx?.id_transaksi === voidTx.id_transaksi) {
                    setSelectedTx(null);
                }
            },
        });
    };

    const handlePrintReceipt = (tx) => {
        if (!tx) return;
        const totalVal = Number(tx.total_belanja || 0);
        const dpp = Math.round(totalVal / 1.11);
        const ppn = totalVal - dpp;

        const itemsHtml = (tx.items || []).map(item => `
            <div style="margin-bottom: 5px;">
                <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; word-break: break-word;">${item.nama_produk}</div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10.5px; padding-left: 6px; gap: 8px;">
                    <span>${item.jumlah} x ${money(item.harga)}</span>
                    <span class="nowrap" style="font-weight: bold; font-family: monospace;">${money(item.subtotal)}</span>
                </div>
            </div>
        `).join('');

        const receiptHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Struk #${tx.id_transaksi}</title>
                <style>
                    @page { size: auto; margin: 0; }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    html, body {
                        width: 100%; margin: 0; padding: 0; background: #fff; color: #000;
                        font-family: 'Courier New', Courier, monospace;
                        -webkit-print-color-adjust: exact; print-color-adjust: exact;
                    }
                    .receipt-box { width: 100%; max-width: 76mm; padding: 3mm 4mm; margin: 0 auto; }
                    .text-center { text-align: center; }
                    .double-line { border-bottom: 2px solid #000; margin: 5px 0; }
                    .dash-line { border-bottom: 1px dashed #000; margin: 4px 0; }
                    .row { display: flex; justify-content: space-between; align-items: baseline; gap: 4px; font-size: 10px; line-height: 1.35; }
                    .total-row { font-size: 11px; font-weight: bold; margin-top: 4px; padding-top: 4px; border-top: 1px solid #000; }
                    .nowrap { white-space: nowrap; flex-shrink: 0; text-align: right; }
                </style>
            </head>
            <body>
                <div class="receipt-box">
                    <div class="text-center" style="margin-bottom: 4px;">
                        <h2 style="font-size: 15px; font-weight: 900; letter-spacing: 1px;">GOMEAL POS</h2>
                        <p style="font-size: 10px; font-weight: bold;">RESTO & FOOD COURT</p>
                        <p style="font-size: 9px; margin-top: 2px;">Jl. Kertajaya Indah No. 42, Surabaya</p>
                        <p style="font-size: 9px;">Telp: (031) 592-8899</p>
                    </div>

                    <div class="double-line"></div>

                    <div class="row"><span>NO NOTA: #${tx.id_transaksi}</span><span class="nowrap">${formatDate(tx.tanggal)}</span></div>
                    <div class="row"><span>PELANGGAN: ${tx.nama_pelanggan || 'Umum'}</span><span class="nowrap">${tx.kota || '-'}</span></div>

                    <div class="dash-line"></div>
                    <div style="margin: 4px 0;">${itemsHtml}</div>
                    <div class="dash-line"></div>

                    <div class="row total-row">
                        <span>TOTAL BAYAR</span>
                        <span class="nowrap">${money(totalVal)}</span>
                    </div>

                    <div class="double-line" style="margin-top: 6px;"></div>
                    <div class="text-center" style="margin-top: 5px; font-size: 9px; line-height: 1.35;">
                        <p style="font-weight: bold;">-- STRUK RESMI GOMEAL --</p>
                        <p style="margin-top: 2px;">Terima kasih atas kunjungan Anda!</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const oldIframe = document.getElementById('receipt-print-frame');
        if (oldIframe) oldIframe.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'receipt-print-frame';
        Object.assign(iframe.style, {
            position: 'fixed', left: '-9999px', top: '0', width: '80mm', height: '100%',
            border: '0', zIndex: '-9999',
        });
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(receiptHtml);
        doc.close();

        iframe.contentWindow.onafterprint = () => {
            setTimeout(() => {
                if (document.body.contains(iframe)) document.body.removeChild(iframe);
            }, 1000);
        };

        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }, 250);
    };

    const currentRange = filters.range || 'all';

    return (
        <AdminLayout
            activePage="riwayat"
            title={isKasir ? "Riwayat Transaksi Saya" : "Riwayat Transaksi"}
            subtitle={isKasir
                ? "Daftar riwayat transaksi yang Anda proses sebagai kasir, detail nota belanja, cetak ulang struk, dan pembatalan (void)"
                : "Daftar seluruh transaksi kasir, detail nota belanja, cetak ulang struk, dan pembatalan (void)"}
        >
            <div className="space-y-5">
                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Total Transaksi</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-ink">
                                <Receipt className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                            {Number(summary.total_transaksi || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-soft">{isKasir ? 'Riwayat transaksi Anda' : 'Semua riwayat kasir'}</p>
                    </div>

                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Total Omset</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                                <TrendingUp className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-ink">
                            {money(summary.total_omset)}
                        </p>
                        <p className="mt-1 text-[11px] text-emerald-600 font-medium">Akumulasi pendapatan</p>
                    </div>

                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Transaksi Hari Ini</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
                                <Calendar className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                            {Number(summary.transaksi_hari_ini || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-soft">Pesanan masuk hari ini</p>
                    </div>

                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Omset Hari Ini</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-50 text-sky-600">
                                <ArrowDownRight className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-ink">
                            {money(summary.omset_hari_ini)}
                        </p>
                        <p className="mt-1 text-[11px] text-sky-600 font-medium">Penjualan shift aktif</p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    {/* Period Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-muted rounded-full overflow-x-auto no-scrollbar">
                        {[
                            { key: 'all', label: 'Semua' },
                            { key: 'today', label: 'Hari Ini' },
                            { key: 'week', label: '7 Hari' },
                            { key: 'month', label: '30 Hari' },
                        ].map(t => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => handleRangeChange(t.key)}
                                className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition ${
                                    currentRange === t.key
                                        ? 'bg-ink text-white shadow-sm'
                                        : 'text-ink-soft hover:text-ink'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
                        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/40">
                            <Search className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Cari No Nota (#ID) atau nama..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-transparent text-[12.5px] text-ink placeholder-ink-soft outline-none"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        router.get('/admin/riwayat', { range: currentRange }, { preserveState: true });
                                    }}
                                    className="text-ink-soft hover:text-ink"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                            <thead>
                                <tr className="border-b border-line bg-muted/40 text-ink-soft">
                                    <th className="py-3.5 px-4 font-semibold">No Nota</th>
                                    <th className="py-3.5 px-4 font-semibold">Tanggal</th>
                                    <th className="py-3.5 px-4 font-semibold">Pelanggan</th>
                                    <th className="py-3.5 px-4 font-semibold">Rincian Item</th>
                                    <th className="py-3.5 px-4 font-semibold text-right">Total Belanja</th>
                                    <th className="py-3.5 px-4 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {transaksiList.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-ink-soft">
                                            <Receipt className="mx-auto h-8 w-8 text-ink-soft/40 mb-2" />
                                            <p className="font-semibold text-ink">Tidak ada data transaksi</p>
                                            <p className="text-[11.5px] mt-0.5">Coba ubah filter rentang tanggal atau kata kunci pencarian</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transaksiList.map((tx) => (
                                        <tr key={tx.id_transaksi} className="hover:bg-muted/30 transition group">
                                            <td className="py-3.5 px-4 font-mono font-bold text-ink">
                                                #{tx.id_transaksi}
                                            </td>
                                            <td className="py-3.5 px-4 text-ink-soft whitespace-nowrap">
                                                {formatDate(tx.tanggal)}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-ink">{tx.nama_pelanggan}</div>
                                                <div className="text-[11px] text-ink-soft flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{tx.kota || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-ink">
                                                        <Package className="h-3 w-3 text-primary" />
                                                        {tx.total_items} item
                                                    </span>
                                                    <span className="text-[11.5px] text-ink-soft truncate max-w-[200px]" title={tx.items.map(i => `${i.nama_produk} (${i.jumlah}x)`).join(', ')}>
                                                        {tx.items.map(i => `${i.nama_produk} (${i.jumlah}x)`).join(', ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono font-bold text-ink">
                                                {money(tx.total_belanja)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTx(tx)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-[11.5px] font-semibold text-ink hover:bg-muted/80 transition"
                                                        title="Lihat Detail & Struk"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 text-ink-soft" />
                                                        <span>Detail</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrintReceipt(tx)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-primary/20 px-2.5 py-1.5 text-[11.5px] font-semibold text-ink hover:bg-primary transition"
                                                        title="Cetak Struk Thermal"
                                                    >
                                                        <Printer className="h-3.5 w-3.5 text-ink" />
                                                        <span>Struk</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setVoidTx(tx)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-red-600 hover:bg-red-100 transition"
                                                        title="Batalkan (Void Transaksi)"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        <span>Void</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Detail Transaksi */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-[fadeIn_0.15s_ease-out]">
                    <div className="w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl border border-line">
                        <div className="flex items-center justify-between border-b border-line pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-ink">Detail Transaksi #{selectedTx.id_transaksi}</h3>
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 uppercase">Sukses</span>
                                </div>
                                <p className="text-[11.5px] text-ink-soft mt-0.5">
                                    {formatDate(selectedTx.tanggal)} • Pelanggan: <strong className="text-ink">{selectedTx.nama_pelanggan}</strong> ({selectedTx.kota})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTx(null)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-ink-soft hover:bg-muted/80"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 max-h-[300px] overflow-y-auto divide-y divide-line">
                            {selectedTx.items.map((item, idx) => (
                                <div key={idx} className="py-2.5 flex items-center justify-between text-[12.5px]">
                                    <div>
                                        <p className="font-semibold text-ink">{item.nama_produk}</p>
                                        <p className="text-[11px] text-ink-soft">
                                            {item.jumlah} x {money(item.harga)}
                                        </p>
                                    </div>
                                    <span className="font-mono font-bold text-ink">
                                        {money(item.subtotal)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                            <span className="text-[13px] font-bold text-ink">Total Pembayaran</span>
                            <span className="text-lg font-mono font-extrabold text-ink">
                                {money(selectedTx.total_belanja)}
                            </span>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setVoidTx(selectedTx);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-100 transition"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Void Transaksi</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePrintReceipt(selectedTx)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-[12px] font-semibold text-ink hover:bg-primary-hover active:scale-95 transition shadow-sm"
                            >
                                <Printer className="h-4 w-4" />
                                <span>Cetak Ulang Struk</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Void */}
            {voidTx && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-[fadeIn_0.15s_ease-out]">
                    <div className="w-full max-w-md rounded-[26px] bg-white p-6 shadow-2xl border border-line">
                        <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="text-base font-bold text-ink">Batalkan (Void) Transaksi?</h3>
                                <p className="text-[11.5px] text-ink-soft">No Nota #{voidTx.id_transaksi}</p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-red-50/70 p-3.5 border border-red-100 text-[12px] text-red-700 leading-relaxed">
                            <p className="font-semibold">Perhatian:</p>
                            <p className="mt-0.5">
                                Tindakan ini akan <strong>menghapus data transaksi</strong> dan secara otomatis <strong>mengembalikan stok {voidTx.total_items} produk</strong> ke inventori. Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>

                        <div className="mt-4 rounded-xl bg-muted p-3 text-[12px]">
                            <div className="flex justify-between">
                                <span className="text-ink-soft">Pelanggan:</span>
                                <span className="font-semibold text-ink">{voidTx.nama_pelanggan}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-ink-soft">Total Nilai:</span>
                                <span className="font-mono font-bold text-ink">{money(voidTx.total_belanja)}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setVoidTx(null)}
                                disabled={voidLoading}
                                className="rounded-full bg-muted px-4 py-2 text-[12px] font-semibold text-ink hover:bg-muted/80 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmVoid}
                                disabled={voidLoading}
                                className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2 text-[12px] font-semibold text-white hover:bg-red-700 active:scale-95 transition shadow-sm disabled:opacity-50"
                            >
                                {voidLoading ? 'Memproses...' : 'Ya, Batalkan Transaksi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
