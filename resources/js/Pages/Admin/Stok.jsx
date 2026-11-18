import AdminLayout from './AdminLayout';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Boxes, Plus, Minus, Search, AlertTriangle, CheckCircle,
    X, ArrowUpRight, ArrowDownRight, RefreshCw, Barcode,
    Package, Filter, Layers, Clock, ShieldAlert,
} from 'lucide-react';

export default function StokPage({ products = [], categories = [], stockLogs = [] }) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out', 'safe'

    // Modal state
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [adjustType, setAdjustType] = useState('masuk'); // 'masuk', 'keluar', 'opname'
    const [jumlahInput, setJumlahInput] = useState('');
    const [catatan, setCatatan] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const openAdjust = (prod, defaultType = 'masuk') => {
        setSelectedProduct(prod);
        setAdjustType(defaultType);
        setJumlahInput(defaultType === 'opname' ? String(prod.stok) : '');
        setCatatan('');
        setShowAdjustModal(true);
    };

    const handleAdjustSubmit = (e) => {
        e.preventDefault();
        if (!selectedProduct) return;
        const val = parseInt(jumlahInput, 10);
        if (isNaN(val) || val < 0) return;

        setSubmitting(true);
        router.post('/admin/stok/adjust', {
            id_produk: selectedProduct.id_produk,
            tipe: adjustType,
            jumlah: val,
            catatan,
        }, {
            onFinish: () => {
                setSubmitting(false);
                setShowAdjustModal(false);
                setSelectedProduct(null);
            },
        });
    };

    // Calculate metrics
    const totalCount = products.length;
    const outCount = products.filter(p => Number(p.stok) <= 0).length;
    const lowCount = products.filter(p => Number(p.stok) > 0 && Number(p.stok) <= 10).length;
    const safeCount = products.filter(p => Number(p.stok) > 10).length;

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchSearch =
            p.nama_produk.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase())) ||
            p.nama_kategori.toLowerCase().includes(search.toLowerCase());

        const matchCat = selectedCategory === 'all' || String(p.id_kategori) === String(selectedCategory);

        let matchStock = true;
        const s = Number(p.stok);
        if (stockFilter === 'low') matchStock = s > 0 && s <= 10;
        else if (stockFilter === 'out') matchStock = s <= 0;
        else if (stockFilter === 'safe') matchStock = s > 10;
        else if (stockFilter === 'critical') matchStock = s <= 10;

        return matchSearch && matchCat && matchStock;
    });

    // Compute preview of new stock
    const currentStock = selectedProduct ? Number(selectedProduct.stok) : 0;
    const inputVal = parseInt(jumlahInput || 0, 10);
    let previewStock = currentStock;
    if (adjustType === 'masuk') previewStock = currentStock + (isNaN(inputVal) ? 0 : inputVal);
    else if (adjustType === 'keluar') previewStock = Math.max(0, currentStock - (isNaN(inputVal) ? 0 : inputVal));
    else if (adjustType === 'opname') previewStock = isNaN(inputVal) ? 0 : inputVal;

    return (
        <AdminLayout
            activePage="stok"
            title="Stok & Inventori"
            subtitle="Pemantauan persediaan stok, restock barang masuk, penyesuaian fisik (opname), dan log pergerakan"
        >
            <div className="space-y-5">
                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Total Produk</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-muted text-ink">
                                <Package className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{totalCount}</p>
                        <p className="mt-1 text-[11px] text-ink-soft">Katalog produk aktif</p>
                    </div>

                    <div
                        onClick={() => setStockFilter(stockFilter === 'safe' ? 'all' : 'safe')}
                        className={`rounded-[22px] border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer transition ${
                            stockFilter === 'safe' ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-200' : 'bg-white border-line hover:border-emerald-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Stok Aman (&gt;10)</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                                <CheckCircle className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700">{safeCount}</p>
                        <p className="mt-1 text-[11px] text-emerald-600 font-medium">Persediaan cukup</p>
                    </div>

                    <div
                        onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
                        className={`rounded-[22px] border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer transition ${
                            stockFilter === 'low' ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-200' : 'bg-white border-line hover:border-amber-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Stok Menipis (1-10)</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
                                <AlertTriangle className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-amber-700">{lowCount}</p>
                        <p className="mt-1 text-[11px] text-amber-600 font-medium">Perlu restock segera</p>
                    </div>

                    <div
                        onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
                        className={`rounded-[22px] border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer transition ${
                            stockFilter === 'out' ? 'bg-red-50/60 border-red-300 ring-2 ring-red-200' : 'bg-white border-line hover:border-red-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">Stok Habis (0)</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-red-100 text-red-700">
                                <ShieldAlert className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-red-700">{outCount}</p>
                        <p className="mt-1 text-[11px] text-red-600 font-medium">Tidak dapat dijual</p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Filter Buttons */}
                        <div className="flex items-center gap-1 p-1 bg-muted rounded-full">
                            {[
                                { key: 'all', label: 'Semua Stok' },
                                { key: 'critical', label: 'Perlu Perhatian (<=10)' },
                                { key: 'out', label: 'Habis (0)' },
                            ].map(btn => (
                                <button
                                    key={btn.key}
                                    type="button"
                                    onClick={() => setStockFilter(btn.key)}
                                    className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition ${
                                        stockFilter === btn.key
                                            ? 'bg-ink text-white shadow-sm'
                                            : 'text-ink-soft hover:text-ink'
                                    }`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        {/* Category Dropdown */}
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="rounded-full bg-muted px-3.5 py-1.5 text-[12px] font-semibold text-ink border-0 outline-none cursor-pointer"
                        >
                            <option value="all">Semua Kategori</option>
                            {categories.map(c => (
                                <option key={c.id_kategori} value={c.id_kategori}>
                                    {c.nama_kategori}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-sm">
                        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/40">
                            <Search className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Cari nama produk atau barcode..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-transparent text-[12.5px] text-ink placeholder-ink-soft outline-none"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="text-ink-soft hover:text-ink"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stock Table */}
                <div className="bg-white rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                            <thead>
                                <tr className="border-b border-line bg-muted/40 text-ink-soft">
                                    <th className="py-3.5 px-4 font-semibold">SKU / Barcode</th>
                                    <th className="py-3.5 px-4 font-semibold">Nama Produk</th>
                                    <th className="py-3.5 px-4 font-semibold">Kategori</th>
                                    <th className="py-3.5 px-4 font-semibold text-center">Status Stok</th>
                                    <th className="py-3.5 px-4 font-semibold text-right">Stok Fisik</th>
                                    <th className="py-3.5 px-4 font-semibold text-right">Total Terjual</th>
                                    <th className="py-3.5 px-4 font-semibold text-center">Aksi Cepat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-ink-soft">
                                            <Package className="mx-auto h-8 w-8 text-ink-soft/40 mb-2" />
                                            <p className="font-semibold text-ink">Tidak ada produk ditemukan</p>
                                            <p className="text-[11.5px] mt-0.5">Coba sesuaikan kata kunci pencarian atau filter kategori</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((p) => {
                                        const s = Number(p.stok);
                                        const isOut = s <= 0;
                                        const isLow = s > 0 && s <= 10;

                                        return (
                                            <tr key={p.id_produk} className="hover:bg-muted/30 transition group">
                                                <td className="py-3.5 px-4 font-mono text-[11.5px] text-ink-soft whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-bold text-ink">
                                                        <Barcode className="h-3 w-3 text-ink-soft" />
                                                        {p.barcode || 'BRC-' + String(p.id_produk).padStart(4, '0')}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {p.image ? (
                                                            <img
                                                                src={p.image}
                                                                alt={p.nama_produk}
                                                                className="h-9 w-9 rounded-xl object-cover border border-line"
                                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-ink-soft">
                                                                <Package className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-ink">{p.nama_produk}</p>
                                                            <p className="text-[11px] text-ink-soft font-mono">Rp {Number(p.harga).toLocaleString('id-ID')}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-ink-soft whitespace-nowrap">
                                                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-ink">
                                                        {p.nama_kategori}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                    {isOut ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10.5px] font-bold text-red-700">
                                                            <ShieldAlert className="h-3 w-3" />
                                                            Habis
                                                        </span>
                                                    ) : isLow ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-800">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            Menipis
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Aman
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <span className={`font-mono text-sm font-bold ${
                                                        isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-ink'
                                                    }`}>
                                                        {s} unit
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-ink-soft">
                                                    {Number(p.terjual || 0)} unit
                                                </td>
                                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openAdjust(p, 'masuk')}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                                                            title="Restock / Tambah Stok"
                                                        >
                                                            <Plus className="h-3 w-3" strokeWidth={3} />
                                                            <span>Restock</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openAdjust(p, 'opname')}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-[11.5px] font-semibold text-ink hover:bg-muted/80 transition"
                                                            title="Penyesuaian Fisik (Opname)"
                                                        >
                                                            <RefreshCw className="h-3 w-3 text-ink-soft" />
                                                            <span>Opname</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Stock Movement Log Card (Riwayat Mutasi Stok) */}
                <div className="rounded-[22px] border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between border-b border-line pb-3.5">
                        <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-muted text-ink">
                                <Clock className="h-4 w-4" />
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-ink">Log Mutasi & Aktivitas Stok</h3>
                                <p className="text-[11px] text-ink-soft">Pencatatan real-time otomatis via database trigger & opname</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3.5 divide-y divide-line max-h-72 overflow-y-auto">
                        {stockLogs.length === 0 ? (
                            <p className="py-6 text-center text-xs text-ink-soft">Belum ada riwayat aktivitas stok</p>
                        ) : (
                            stockLogs.map((log) => (
                                <div key={log.id_log} className="py-2.5 flex items-start justify-between gap-3 text-[12px]">
                                    <div className="flex items-start gap-2">
                                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                        <p className="text-ink font-medium leading-relaxed">{log.aktivitas}</p>
                                    </div>
                                    <span className="font-mono text-[10.5px] text-ink-soft shrink-0">
                                        {log.waktu}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Adjust Stok */}
            {showAdjustModal && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-[fadeIn_0.15s_ease-out]">
                    <div className="w-full max-w-md rounded-[26px] bg-white p-6 shadow-2xl border border-line">
                        <div className="flex items-center justify-between border-b border-line pb-4">
                            <div>
                                <h3 className="text-base font-bold text-ink">Kelola Stok Produk</h3>
                                <p className="text-[11.5px] text-ink-soft font-semibold text-primary">
                                    {selectedProduct.nama_produk}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAdjustModal(false)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-ink-soft hover:bg-muted/80"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Adjust Type Selector */}
                        <div className="mt-4 grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setAdjustType('masuk')}
                                className={`py-2 text-[11.5px] font-bold rounded-xl transition ${
                                    adjustType === 'masuk'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-ink-soft hover:text-ink'
                                }`}
                            >
                                + Stok Masuk
                            </button>
                            <button
                                type="button"
                                onClick={() => setAdjustType('keluar')}
                                className={`py-2 text-[11.5px] font-bold rounded-xl transition ${
                                    adjustType === 'keluar'
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'text-ink-soft hover:text-ink'
                                }`}
                            >
                                - Stok Keluar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAdjustType('opname');
                                    setJumlahInput(String(selectedProduct.stok));
                                }}
                                className={`py-2 text-[11.5px] font-bold rounded-xl transition ${
                                    adjustType === 'opname'
                                        ? 'bg-ink text-white shadow-sm'
                                        : 'text-ink-soft hover:text-ink'
                                }`}
                            >
                                Stock Opname
                            </button>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4">
                            {/* Stock preview indicator */}
                            <div className="rounded-2xl bg-muted/60 p-3.5 flex items-center justify-between text-[12px]">
                                <div>
                                    <span className="text-ink-soft">Stok Saat Ini:</span>
                                    <p className="font-mono font-bold text-ink text-sm">{currentStock} unit</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-ink-soft">Stok Baru (Estimasi):</span>
                                    <p className={`font-mono font-bold text-sm ${
                                        previewStock <= 0 ? 'text-red-600' : 'text-emerald-600'
                                    }`}>
                                        {previewStock} unit
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11.5px] font-semibold text-ink-soft mb-1">
                                    {adjustType === 'masuk' && 'Jumlah Barang Masuk (+)'}
                                    {adjustType === 'keluar' && 'Jumlah Barang Keluar (-)'}
                                    {adjustType === 'opname' && 'Jumlah Fisik Hasil Opname'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={jumlahInput}
                                    onChange={e => setJumlahInput(e.target.value)}
                                    placeholder="Masukkan jumlah unit..."
                                    className="w-full rounded-xl border border-line bg-muted/30 px-3.5 py-2.5 text-[13px] font-mono font-bold text-ink outline-none focus:border-primary focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[11.5px] font-semibold text-ink-soft mb-1">
                                    Catatan / Keterangan (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={catatan}
                                    onChange={e => setCatatan(e.target.value)}
                                    placeholder={
                                        adjustType === 'masuk'
                                            ? 'Contoh: Kiriman Supplier, Restock Pagi'
                                            : adjustType === 'keluar'
                                            ? 'Contoh: Barang Rusak, Kedaluwarsa'
                                            : 'Contoh: Penyesuaian hitung fisik gudang'
                                    }
                                    className="w-full rounded-xl border border-line bg-muted/30 px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary focus:bg-white"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(false)}
                                    className="rounded-full bg-muted px-4 py-2 text-[12px] font-semibold text-ink hover:bg-muted/80 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-full bg-primary px-5 py-2 text-[12px] font-semibold text-ink hover:bg-primary-hover active:scale-95 transition shadow-sm disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
