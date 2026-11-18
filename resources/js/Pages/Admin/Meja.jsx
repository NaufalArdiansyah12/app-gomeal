import { useState, useMemo } from 'react';
import { router, useForm } from '@inertiajs/react';
import AdminLayout from './AdminLayout';
import { qrToSvgDataUrl } from '../../utils/qrcode';
import {
    QrCode, Plus, Search, Users, Edit3, Trash2, RefreshCw,
    Download, Printer, Copy, Check, X, ExternalLink, Sparkles,
} from 'lucide-react';

const STATUS_META = {
    tersedia: { label: 'Tersedia', badge: 'bg-emerald-500/10 text-emerald-700', dot: 'bg-emerald-500' },
    terisi: { label: 'Terisi', badge: 'bg-amber-500/15 text-amber-700', dot: 'bg-amber-500' },
    nonaktif: { label: 'Nonaktif', badge: 'bg-neutral-200 text-ink-soft', dot: 'bg-neutral-400' },
};

export default function MejaPage({ tables = [], stats = {}, baseUrl = '' }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
    const [formModal, setFormModal] = useState(null); // null | { mode: 'create' | 'edit', table? }
    const [qrModal, setQrModal] = useState(null); // null | table
    const [copiedId, setCopiedId] = useState(null);
    const [regenerating, setRegenerating] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nomor_meja: '',
        kapasitas: 4,
        status: 'tersedia',
        catatan: '',
    });

    const getScanUrl = (kodeQr) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : baseUrl;
        return `${origin.replace(/\/$/, '')}/?meja=${encodeURIComponent(kodeQr)}`;
    };

    const filteredTables = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tables.filter((t) => {
            if (statusFilter !== 'semua' && t.status !== statusFilter) return false;
            if (!q) return true;
            return (
                (t.nomor_meja || '').toLowerCase().includes(q) ||
                (t.kode_qr || '').toLowerCase().includes(q) ||
                (t.catatan || '').toLowerCase().includes(q)
            );
        });
    }, [tables, search, statusFilter]);

    // Sync qrModal with latest table data after regenerate
    const activeQrTable = useMemo(() => {
        if (!qrModal) return null;
        return tables.find((t) => t.id_meja === qrModal.id_meja) || qrModal;
    }, [qrModal, tables]);

    const openCreate = () => {
        clearErrors();
        reset();
        setData({ nomor_meja: '', kapasitas: 4, status: 'tersedia', catatan: '' });
        setFormModal({ mode: 'create' });
    };

    const openEdit = (table) => {
        clearErrors();
        setData({
            nomor_meja: table.nomor_meja || '',
            kapasitas: table.kapasitas || 4,
            status: table.status || 'tersedia',
            catatan: table.catatan || '',
        });
        setFormModal({ mode: 'edit', table });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formModal?.mode === 'edit') {
            put(`/admin/meja/${formModal.table.id_meja}`, {
                preserveScroll: true,
                onSuccess: () => setFormModal(null),
            });
        } else {
            post('/admin/meja', {
                preserveScroll: true,
                onSuccess: () => setFormModal(null),
            });
        }
    };

    const handleDelete = (table) => {
        if (!confirm(`Hapus ${table.nomor_meja}? QR code lama tidak akan berlaku lagi.`)) return;
        router.delete(`/admin/meja/${table.id_meja}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (qrModal?.id_meja === table.id_meja) setQrModal(null);
            },
        });
    };

    const handleRegenerateQr = (table) => {
        if (!confirm(`Buat ulang QR code unik untuk ${table.nomor_meja}? QR code sebelumnya tidak akan berfungsi.`)) return;
        setRegenerating(true);
        router.post(`/admin/meja/${table.id_meja}/regenerate-qr`, {}, {
            preserveScroll: true,
            onFinish: () => setRegenerating(false),
        });
    };

    const handleCopyLink = async (table) => {
        const url = getScanUrl(table.kode_qr);
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(table.id_meja);
            setTimeout(() => setCopiedId(null), 1800);
        } catch {
            window.prompt('Salin tautan meja:', url);
        }
    };

    const handleDownloadPng = (table) => {
        const url = getScanUrl(table.kode_qr);
        const svgUrl = qrToSvgDataUrl(url, { fg: '#111111', bg: '#FFFFFF', margin: 2 });
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 820;
            const ctx = canvas.getContext('2d');

            // Background card
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Top accent bar
            ctx.fillStyle = '#F5A623';
            ctx.fillRect(0, 0, canvas.width, 16);

            // Brand
            ctx.fillStyle = '#18181B';
            ctx.font = 'bold 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GoMeal.', canvas.width / 2, 74);

            // Table name
            ctx.font = 'bold 42px sans-serif';
            ctx.fillText(table.nomor_meja, canvas.width / 2, 130);

            // Subtitle
            ctx.fillStyle = '#71717A';
            ctx.font = '20px sans-serif';
            ctx.fillText('Scan QR untuk melihat menu & memesan', canvas.width / 2, 166);

            // QR image
            const qrSize = 460;
            const qrX = (canvas.width - qrSize) / 2;
            const qrY = 196;
            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

            // Code footer
            ctx.fillStyle = '#18181B';
            ctx.font = 'bold 22px monospace';
            ctx.fillText(table.kode_qr, canvas.width / 2, 706);

            if (table.catatan) {
                ctx.fillStyle = '#71717A';
                ctx.font = '18px sans-serif';
                ctx.fillText(`${table.catatan} • Kapasitas ${table.kapasitas} orang`, canvas.width / 2, 742);
            }

            const link = document.createElement('a');
            link.download = `qr-${table.nomor_meja.toLowerCase().replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = svgUrl;
    };

    const kpis = [
        { label: 'Total Meja', value: stats.total ?? tables.length, note: 'Seluruh meja terdaftar', hero: true },
        { label: 'Tersedia', value: stats.tersedia ?? 0, note: 'Siap digunakan pelanggan' },
        { label: 'Terisi', value: stats.terisi ?? 0, note: 'Sedang ditempati' },
        { label: 'Nonaktif', value: stats.nonaktif ?? 0, note: 'Sementara tidak dipakai' },
    ];

    return (
        <AdminLayout
            activePage="meja"
            title="Meja & QR Code"
            subtitle="Kelola daftar meja restoran dan generate QR code unik untuk pemesanan pelanggan"
        >
            <div className="space-y-4">
                {/* KPI Strip */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:hidden">
                    {kpis.map(({ label, value, note, hero }) => (
                        <div
                            key={label}
                            className={`rounded-2xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                                hero ? 'border-primary/30 bg-primary-subtle' : 'border-line bg-white'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <p className={`text-[12px] font-semibold ${hero ? 'text-primary-deep' : 'text-ink-soft'}`}>{label}</p>
                                <span className={`grid h-8 w-8 place-items-center rounded-xl ${hero ? 'bg-primary text-white' : 'bg-muted text-ink-soft'}`}>
                                    <QrCode className="h-4 w-4" strokeWidth={2.4} />
                                </span>
                            </div>
                            <p className="mt-2 font-display text-[24px] font-bold leading-none text-ink">{value}</p>
                            <p className={`mt-2 text-[11.5px] ${hero ? 'text-primary-deep/80' : 'text-ink-soft'}`}>{note}</p>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] flex-1 max-w-xs">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nomor meja, kode QR..."
                                className="w-full rounded-xl border border-line bg-muted/40 py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-soft focus:border-primary focus:bg-white focus:outline-none"
                            />
                        </div>

                        <div className="inline-flex rounded-xl bg-muted p-1 text-[12px]">
                            {[
                                { key: 'semua', label: 'Semua' },
                                { key: 'tersedia', label: 'Tersedia' },
                                { key: 'terisi', label: 'Terisi' },
                                { key: 'nonaktif', label: 'Nonaktif' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                                        statusFilter === tab.key ? 'bg-white text-ink shadow-xs' : 'text-ink-soft hover:text-ink'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-ink shadow-xs transition hover:brightness-95 active:scale-95"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        <span>Tambah Meja</span>
                    </button>
                </div>

                {/* Table Cards Grid */}
                {filteredTables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white py-14 text-center">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-muted">
                            <QrCode className="h-6 w-6 text-ink-soft" />
                        </span>
                        <p className="mt-3 text-[14px] font-bold text-ink">Belum ada meja ditemukan</p>
                        <p className="mt-1 text-[12px] text-ink-soft">Tambahkan meja baru untuk menghasilkan QR code unik secara otomatis.</p>
                        <button
                            type="button"
                            onClick={openCreate}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:brightness-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Tambah Meja Pertama</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
                        {filteredTables.map((table) => {
                            const meta = STATUS_META[table.status] || STATUS_META.tersedia;
                            const scanUrl = getScanUrl(table.kode_qr);
                            const qrSrc = qrToSvgDataUrl(scanUrl, { fg: '#18181B', bg: '#FFFFFF', margin: 2 });

                            return (
                                <div
                                    key={table.id_meja}
                                    className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-primary/50"
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="truncate font-display text-[16px] font-bold text-ink">{table.nomor_meja}</h3>
                                            <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-ink-soft">
                                                <span className="inline-flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {table.kapasitas} kursi
                                                </span>
                                                {table.catatan && (
                                                    <span className="truncate">• {table.catatan}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${meta.badge}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                            {meta.label}
                                        </span>
                                    </div>

                                    {/* QR Preview */}
                                    <button
                                        type="button"
                                        onClick={() => setQrModal(table)}
                                        className="group relative my-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-cream/60 p-4 transition hover:border-primary hover:bg-primary-subtle/30"
                                    >
                                        <img
                                            src={qrSrc}
                                            alt={`QR Code ${table.nomor_meja}`}
                                            className="h-36 w-36 rounded-xl border border-line bg-white p-2 shadow-xs transition group-hover:scale-[1.03]"
                                        />
                                        <span className="mt-2.5 rounded-md bg-white px-2 py-0.5 font-mono text-[10.5px] font-semibold text-ink-soft ring-1 ring-line">
                                            {table.kode_qr}
                                        </span>
                                        <span className="mt-1 text-[10.5px] font-semibold text-primary-deep opacity-0 transition group-hover:opacity-100">
                                            Klik untuk perbesar / cetak
                                        </span>
                                    </button>

                                    {/* Card Actions */}
                                    <div className="mt-auto flex items-center gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setQrModal(table)}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-[12px] font-semibold text-white transition hover:opacity-90 active:scale-95"
                                        >
                                            <QrCode className="h-3.5 w-3.5 text-primary" />
                                            <span>QR & Cetak</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyLink(table)}
                                            title="Salin tautan scan"
                                            className="grid h-9 w-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-primary hover:text-ink active:scale-95"
                                        >
                                            {copiedId === table.id_meja ? (
                                                <Check className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openEdit(table)}
                                            title="Edit meja"
                                            className="grid h-9 w-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-primary hover:text-ink active:scale-95"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(table)}
                                            title="Hapus meja"
                                            className="grid h-9 w-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Tambah / Edit Meja */}
            {formModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-line pb-3">
                            <div>
                                <h2 className="font-display text-[17px] font-bold text-ink">
                                    {formModal.mode === 'edit' ? `Edit ${formModal.table.nomor_meja}` : 'Tambah Meja Baru'}
                                </h2>
                                <p className="text-[11.5px] text-ink-soft">
                                    {formModal.mode === 'edit'
                                        ? 'Perbarui informasi dan status meja.'
                                        : 'QR code unik akan dibuat otomatis untuk meja ini.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormModal(null)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-ink-soft hover:text-ink"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                    Nomor / Nama Meja
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.nomor_meja}
                                    onChange={(e) => setData('nomor_meja', e.target.value)}
                                    placeholder="Contoh: Meja 07 atau VIP 01"
                                    className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-[13px] text-ink focus:border-primary focus:outline-none"
                                />
                                {errors.nomor_meja && <p className="mt-1 text-[11px] text-red-600">{errors.nomor_meja}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Kapasitas (Orang)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        required
                                        value={data.kapasitas}
                                        onChange={(e) => setData('kapasitas', Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-[13px] text-ink focus:border-primary focus:outline-none"
                                    />
                                    {errors.kapasitas && <p className="mt-1 text-[11px] text-red-600">{errors.kapasitas}</p>}
                                </div>

                                {formModal.mode === 'edit' && (
                                    <div>
                                        <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                            Status Meja
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink focus:border-primary focus:outline-none"
                                        >
                                            <option value="tersedia">Tersedia</option>
                                            <option value="terisi">Terisi</option>
                                            <option value="nonaktif">Nonaktif</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                    Catatan / Lokasi (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    placeholder="Contoh: Lantai 1, Outdoor, Dekat jendela"
                                    className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-[13px] text-ink focus:border-primary focus:outline-none"
                                />
                                {errors.catatan && <p className="mt-1 text-[11px] text-red-600">{errors.catatan}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setFormModal(null)}
                                    className="rounded-xl border border-line px-4 py-2 text-[12.5px] font-semibold text-ink-soft hover:bg-muted"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-primary px-4 py-2 text-[12.5px] font-semibold text-ink shadow-xs transition hover:brightness-95 disabled:opacity-60"
                                >
                                    {processing ? 'Menyimpan...' : formModal.mode === 'edit' ? 'Simpan Perubahan' : 'Buat Meja & QR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Preview & Cetak QR Code */}
            {activeQrTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:static print:bg-white print:p-0">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl print:max-w-sm print:shadow-none print:border print:border-line">
                        {/* Modal Top Bar (hidden on print) */}
                        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 print:hidden">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="font-display text-[15px] font-bold text-ink">QR Code {activeQrTable.nomor_meja}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setQrModal(null)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-ink-soft hover:text-ink"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Printable Card Area */}
                        <div className="flex flex-col items-center px-6 py-6 text-center">
                            <span className="font-display text-[20px] font-bold tracking-tight text-ink">
                                GoMeal<span className="text-primary">.</span>
                            </span>
                            <h3 className="mt-1 font-display text-[26px] font-bold leading-tight text-ink">
                                {activeQrTable.nomor_meja}
                            </h3>
                            <p className="mt-0.5 text-[12px] text-ink-soft">
                                Scan QR code ini untuk melihat menu & memesan langsung
                            </p>

                            <div className="my-5 rounded-2xl border-2 border-primary/40 bg-white p-3.5 shadow-sm">
                                <img
                                    src={qrToSvgDataUrl(getScanUrl(activeQrTable.kode_qr), { fg: '#111111', bg: '#FFFFFF', margin: 2 })}
                                    alt={`QR ${activeQrTable.nomor_meja}`}
                                    className="h-56 w-56"
                                />
                            </div>

                            <div className="rounded-xl bg-muted px-3 py-1.5 font-mono text-[12px] font-bold tracking-wider text-ink">
                                {activeQrTable.kode_qr}
                            </div>

                            <p className="mt-2 max-w-full truncate text-[11px] text-ink-soft print:hidden">
                                {getScanUrl(activeQrTable.kode_qr)}
                            </p>

                            {activeQrTable.catatan && (
                                <p className="mt-1 text-[11.5px] text-ink-soft">
                                    {activeQrTable.catatan} • Kapasitas {activeQrTable.kapasitas} orang
                                </p>
                            )}
                        </div>

                        {/* Action Buttons (hidden on print) */}
                        <div className="space-y-2 border-t border-line bg-muted/40 px-5 py-4 print:hidden">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDownloadPng(activeQrTable)}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-[12.5px] font-semibold text-ink shadow-xs transition hover:brightness-95 active:scale-95"
                                >
                                    <Download className="h-4 w-4" />
                                    <span>Unduh PNG</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2.5 text-[12.5px] font-semibold text-white transition hover:opacity-90 active:scale-95"
                                >
                                    <Printer className="h-4 w-4 text-primary" />
                                    <span>Cetak QR</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleCopyLink(activeQrTable)}
                                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-line bg-white px-2.5 py-2 text-[11.5px] font-semibold text-ink transition hover:border-primary"
                                >
                                    {copiedId === activeQrTable.id_meja ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Tersalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            <span>Salin Link</span>
                                        </>
                                    )}
                                </button>
                                <a
                                    href={getScanUrl(activeQrTable.kode_qr)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-line bg-white px-2.5 py-2 text-[11.5px] font-semibold text-ink transition hover:border-primary"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>Test Link</span>
                                </a>
                                <button
                                    type="button"
                                    disabled={regenerating}
                                    onClick={() => handleRegenerateQr(activeQrTable)}
                                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-line bg-white px-2.5 py-2 text-[11.5px] font-semibold text-amber-700 transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                                    <span>Reset QR</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
