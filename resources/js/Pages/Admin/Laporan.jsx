import AdminLayout from './AdminLayout';
import { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    TrendingUp, Receipt, ShoppingBag, Sparkles, Printer,
    Calendar, Search, Filter, RotateCcw, ArrowUpRight,
    Award, BarChart3, ChevronLeft, ChevronRight,
    FileSpreadsheet, FileDown,
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function LaporanPage({
    summary = {},
    dailyTrend = [],
    topProducts = [],
    transactions = [],
    filters = {},
}) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const money = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    const formatDateIndo = (str) => {
        if (!str) return '-';
        const d = new Date(str);
        if (isNaN(d.getTime())) return str;
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleApplyFilter = (e) => {
        e?.preventDefault();
        setCurrentPage(1);
        router.get('/admin/laporan', {
            start_date: startDate || undefined,
            end_date: endDate || undefined,
        }, { preserveState: true });
    };

    const handleResetFilter = () => {
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
        router.get('/admin/laporan', {}, { preserveState: true });
    };

    const setPreset = (preset) => {
        const today = new Date();
        const toYMD = (d) => d.toISOString().split('T')[0];

        let start = '';
        let end = toYMD(today);

        if (preset === 'today') {
            start = end;
        } else if (preset === '7days') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            start = toYMD(d);
        } else if (preset === 'this_month') {
            const d = new Date(today.getFullYear(), today.getMonth(), 1);
            start = toYMD(d);
        } else if (preset === 'all') {
            handleResetFilter();
            return;
        }

        setStartDate(start);
        setEndDate(end);
        setCurrentPage(1);
        router.get('/admin/laporan', { start_date: start, end_date: end }, { preserveState: true });
    };

    const excelUrl = useMemo(() => {
        const params = new URLSearchParams();
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        const q = params.toString();
        return `/admin/laporan/export-excel${q ? '?' + q : ''}`;
    }, [startDate, endDate]);

    const pdfUrl = useMemo(() => {
        const params = new URLSearchParams();
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        const q = params.toString();
        return `/admin/laporan/export-pdf${q ? '?' + q : ''}`;
    }, [startDate, endDate]);

    // Client-side search for table
    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        const q = searchQuery.toLowerCase();
        return transactions.filter(t =>
            String(t.id_transaksi).includes(q) ||
            (t.nama_pelanggan && t.nama_pelanggan.toLowerCase().includes(q)) ||
            (t.kota && t.kota.toLowerCase().includes(q)) ||
            (t.rincian && t.rincian.toLowerCase().includes(q))
        );
    }, [transactions, searchQuery]);

    // Reset pagination to page 1 on query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, transactions]);

    // Pagination calculations (20 per page)
    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Max omzet for daily trend chart scaling
    const maxDailyOmzet = useMemo(() => {
        if (!dailyTrend.length) return 1;
        return Math.max(...dailyTrend.map(d => Number(d.total_omzet || 0)), 1);
    }, [dailyTrend]);

    // Max qty for top products scaling
    const maxProductQty = useMemo(() => {
        if (!topProducts.length) return 1;
        return Math.max(...topProducts.map(p => Number(p.total_qty || 0)), 1);
    }, [topProducts]);

    return (
        <AdminLayout
            activePage="laporan"
            title="Laporan Penjualan"
            subtitle="Ringkasan performa finansial, tren penjualan, dan transaksi toko"
        >
            {/* Print Header (Only visible on print) */}
            <div className="hidden print:block mb-6 border-b border-gray-300 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-black">GoMeal / TokoKita</h1>
                        <p className="text-sm text-gray-600">Laporan Penjualan &amp; Rekapitulasi POS</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                        <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
                        <p>Periode: {startDate ? formatDateIndo(startDate) : 'Awal'} s/d {endDate ? formatDateIndo(endDate) : 'Sekarang'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                {/* 1. Header Filter & Export Bar */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)] print:hidden space-y-3.5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[12px] font-semibold text-ink-soft mr-1 flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-primary" /> Periode:
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreset('all')}
                                className={`rounded-full px-3 py-1 text-[11.5px] font-medium transition ${
                                    !startDate && !endDate
                                        ? 'bg-ink text-white shadow-sm'
                                        : 'bg-muted text-ink-soft hover:text-ink'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreset('today')}
                                className="rounded-full bg-muted px-3 py-1 text-[11.5px] font-medium text-ink-soft hover:text-ink transition"
                            >
                                Hari Ini
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreset('7days')}
                                className="rounded-full bg-muted px-3 py-1 text-[11.5px] font-medium text-ink-soft hover:text-ink transition"
                            >
                                7 Hari Terakhir
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreset('this_month')}
                                className="rounded-full bg-muted px-3 py-1 text-[11.5px] font-medium text-ink-soft hover:text-ink transition"
                            >
                                Bulan Ini
                            </button>
                        </div>

                        {/* Export Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={excelUrl}
                                download
                                className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-[12px] font-bold text-emerald-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:bg-emerald-100 active:scale-95"
                                title="Download spreadsheet Excel (.csv UTF-8)"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                                Export Excel
                            </a>
                            <a
                                href={pdfUrl}
                                download
                                className="flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3.5 py-1.5 text-[12px] font-bold text-rose-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:bg-rose-100 active:scale-95"
                                title="Download file dokumen PDF langsung"
                            >
                                <FileDown className="h-3.5 w-3.5 text-rose-600" />
                                Export PDF
                            </a>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:bg-muted active:scale-95"
                                title="Cetak halaman langsung"
                            >
                                <Printer className="h-3.5 w-3.5 text-primary" />
                                Cetak
                            </button>
                        </div>
                    </div>

                    {/* Date Pickers Form */}
                    <div className="pt-3 border-t border-line/60 flex flex-wrap items-center justify-between gap-3">
                        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-full border border-line">
                                <span className="text-[11px] text-ink-soft">Mulai:</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-[11.5px] text-ink outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-full border border-line">
                                <span className="text-[11px] text-ink-soft">Sampai:</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent text-[11.5px] text-ink outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12px] font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                            >
                                <Filter className="h-3.5 w-3.5" />
                                Terapkan Filter
                            </button>
                            {(startDate || endDate) && (
                                <button
                                    type="button"
                                    onClick={handleResetFilter}
                                    className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:bg-muted transition"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    Reset
                                </button>
                            )}
                        </form>

                        <span className="text-[11.5px] text-ink-soft">
                            Rentang aktif: <strong className="text-ink">{startDate ? formatDateIndo(startDate) : 'Awal data'}</strong> s/d <strong className="text-ink">{endDate ? formatDateIndo(endDate) : 'Hari ini'}</strong>
                        </span>
                    </div>
                </div>

                {/* 2. Key Metrics (4 KPI Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Total Omzet */}
                    <div className="bg-white p-4.5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-ink-soft">Total Omzet</span>
                            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="font-display text-[22px] font-bold text-ink tracking-tight">
                                {money(summary.total_omzet)}
                            </div>
                            <p className="mt-0.5 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" /> Pendapatan kotor
                            </p>
                        </div>
                    </div>

                    {/* Total Transaksi */}
                    <div className="bg-white p-4.5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-ink-soft">Total Transaksi</span>
                            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary-subtle text-primary-deep">
                                <Receipt className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="font-display text-[22px] font-bold text-ink tracking-tight">
                                {summary.total_transaksi} <span className="text-[13px] font-normal text-ink-soft">struk</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-ink-soft">Volume struk tercatat</p>
                        </div>
                    </div>

                    {/* Total Produk Terjual */}
                    <div className="bg-white p-4.5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-ink-soft">Produk Terjual</span>
                            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
                                <ShoppingBag className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="font-display text-[22px] font-bold text-ink tracking-tight">
                                {summary.total_item} <span className="text-[13px] font-normal text-ink-soft">item</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-ink-soft">Akumulasi kuantitas menu</p>
                        </div>
                    </div>

                    {/* Rata-Rata Transaksi (AOV) */}
                    <div className="bg-white p-4.5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-ink-soft">Rata-Rata Nilai Struk</span>
                            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                <Sparkles className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="font-display text-[22px] font-bold text-ink tracking-tight">
                                {money(summary.avg_transaksi)}
                            </div>
                            <p className="mt-0.5 text-[11px] text-ink-soft">Rata-rata belanja per struk</p>
                        </div>
                    </div>
                </div>

                {/* 3. Visual Tren Omzet Harian & Top Produk Terlaris */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Tren Penjualan Harian */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-3 border-b border-line">
                                <div className="flex items-center gap-2">
                                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary-subtle text-primary-deep">
                                        <BarChart3 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="font-display text-[15px] font-bold text-ink">Tren Penjualan Harian</h2>
                                        <p className="text-[11px] text-ink-soft">Distribusi nilai omzet per tanggal transaksi</p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                                    {dailyTrend.length} Tanggal Aktif
                                </span>
                            </div>

                            {/* Bar Chart Container */}
                            <div className="mt-5 space-y-3">
                                {dailyTrend.length === 0 ? (
                                    <div className="py-10 text-center text-[12px] text-ink-soft italic">
                                        Tidak ada catatan transaksi pada periode yang dipilih.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                                        {dailyTrend.map((d) => {
                                            const pct = Math.max(8, Math.round((Number(d.total_omzet) / maxDailyOmzet) * 100));
                                            return (
                                                <div key={d.tanggal} className="group">
                                                    <div className="flex items-center justify-between text-[11.5px] mb-1">
                                                        <span className="font-medium text-ink">
                                                            {formatDateIndo(d.tanggal)}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[11px] text-ink-soft">
                                                                {d.total_transaksi} transaksi
                                                            </span>
                                                            <span className="font-bold text-ink tabular-nums">
                                                                {money(d.total_omzet)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all duration-500 group-hover:bg-primary-deep"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11px] text-ink-soft">
                            <span>*Grafik batang menyesuaikan proporsi omzet harian tertinggi</span>
                            <span className="font-semibold text-ink">Puncak: {money(maxDailyOmzet)}</span>
                        </div>
                    </div>

                    {/* Top 5 Produk Terlaris */}
                    <div className="bg-white p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-3 border-b border-line">
                                <div className="flex items-center gap-2">
                                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                                        <Award className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="font-display text-[15px] font-bold text-ink">Top 5 Produk Terlaris</h2>
                                        <p className="text-[11px] text-ink-soft">Paling banyak dipesan pelanggan</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {topProducts.length === 0 ? (
                                    <div className="py-8 text-center text-[12px] text-ink-soft italic">
                                        Belum ada riwayat penjualan produk.
                                    </div>
                                ) : (
                                    topProducts.map((p, idx) => {
                                        const pct = Math.round((Number(p.total_qty) / maxProductQty) * 100);
                                        return (
                                            <div key={idx} className="p-3 rounded-xl border border-line/70 bg-muted/20">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                                                            idx === 0
                                                                ? 'bg-amber-400 text-amber-950'
                                                                : idx === 1
                                                                ? 'bg-slate-200 text-slate-800'
                                                                : idx === 2
                                                                ? 'bg-orange-200 text-orange-900'
                                                                : 'bg-muted text-ink-soft'
                                                        }`}>
                                                            {idx + 1}
                                                        </span>
                                                        <span className="font-display text-[12.5px] font-bold text-ink truncate">
                                                            {p.nama_produk}
                                                        </span>
                                                    </div>
                                                    <span className="text-[12px] font-bold text-primary-deep whitespace-nowrap">
                                                        {p.total_qty} <span className="text-[10px] font-normal text-ink-soft">terjual</span>
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between text-[11px] text-ink-soft">
                                                    <span>Omzet: {money(p.total_omzet)}</span>
                                                    <span>{pct}% benchmark</span>
                                                </div>
                                                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-amber-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-line text-right">
                            <span className="text-[11px] text-ink-soft">
                                Total {topProducts.reduce((acc, curr) => acc + Number(curr.total_qty || 0), 0)} porsi dari 5 menu teratas
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. Tabel Rincian Transaksi dengan Pagination 20 Data */}
                <div className="bg-white p-5 rounded-2xl border border-line shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                        <div>
                            <h2 className="font-display text-[16px] font-bold text-ink">
                                Rincian Struk &amp; Riwayat Transaksi
                            </h2>
                            <p className="text-[11.5px] text-ink-soft">
                                Menampilkan {filteredTransactions.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredTransactions.length)} dari {filteredTransactions.length} transaksi (20 data per halaman)
                            </p>
                        </div>

                        <div className="relative print:hidden">
                            <div className="flex items-center gap-2 rounded-full bg-muted/80 px-3.5 py-1.5 border border-line transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/40">
                                <Search className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                                <input
                                    type="text"
                                    placeholder="Cari ID, pelanggan, atau menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent text-[12px] text-ink placeholder-ink-soft outline-none w-48 sm:w-60"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12px]">
                            <thead>
                                <tr className="border-b border-line bg-muted/40 text-ink-soft">
                                    <th className="py-2.5 px-3 font-semibold">No. Struk</th>
                                    <th className="py-2.5 px-3 font-semibold">Tanggal</th>
                                    <th className="py-2.5 px-3 font-semibold">Pelanggan</th>
                                    <th className="py-2.5 px-3 font-semibold">Rincian Menu</th>
                                    <th className="py-2.5 px-3 font-semibold text-center">Jml Item</th>
                                    <th className="py-2.5 px-3 font-semibold text-right">Total Belanja</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-ink-soft">
                                            Tidak ada transaksi yang cocok dengan kriteria pencarian / filter.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTransactions.map((t) => (
                                        <tr key={t.id_transaksi} className="border-b border-line/60 hover:bg-muted/30 transition">
                                            <td className="py-2.5 px-3 font-semibold text-ink">
                                                #{t.id_transaksi}
                                            </td>
                                            <td className="py-2.5 px-3 text-ink-soft whitespace-nowrap">
                                                {formatDateIndo(t.tanggal)}
                                            </td>
                                            <td className="py-2.5 px-3 font-semibold text-ink">
                                                {t.nama_pelanggan || 'Umum'}{' '}
                                                {t.kota && (
                                                    <span className="text-[11px] font-normal text-ink-soft">
                                                        ({t.kota})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-ink max-w-md truncate" title={t.rincian}>
                                                {t.rincian || '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-center tabular-nums text-ink-soft font-medium">
                                                {t.total_items}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold tabular-nums text-ink whitespace-nowrap">
                                                {money(t.total_belanja)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {filteredTransactions.length > 0 && (
                                <tfoot>
                                    <tr className="border-t-2 border-line bg-muted/50 font-bold text-ink">
                                        <td colSpan="4" className="py-3 px-3 text-right">
                                            Total Keseluruhan Filter ({filteredTransactions.length} transaksi):
                                        </td>
                                        <td className="py-3 px-3 text-center tabular-nums">
                                            {filteredTransactions.reduce((acc, curr) => acc + Number(curr.total_items || 0), 0)}
                                        </td>
                                        <td className="py-3 px-3 text-right tabular-nums text-primary-deep text-[13px]">
                                            {money(filteredTransactions.reduce((acc, curr) => acc + Number(curr.total_belanja || 0), 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Pagination Controls (20 data per page) */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-line/60 print:hidden">
                            <span className="text-[11.5px] text-ink-soft">
                                Halaman <strong className="text-ink">{currentPage}</strong> dari <strong className="text-ink">{totalPages}</strong>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-[11.5px] font-semibold text-ink transition hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Sebelumnya
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => setCurrentPage(page)}
                                            className={`grid h-8 w-8 place-items-center rounded-xl text-[11.5px] font-bold transition ${
                                                currentPage === page
                                                    ? 'bg-ink text-white shadow-sm'
                                                    : 'border border-line bg-white text-ink hover:bg-muted'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-[11.5px] font-semibold text-ink transition hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Berikutnya
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
