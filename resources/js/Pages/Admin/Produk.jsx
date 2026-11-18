import AdminLayout from './AdminLayout';
import { useState, useRef } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import {
    UtensilsCrossed, Plus, Minus, Edit2, Search, AlertCircle,
    CheckCircle, X, Barcode, Sparkles, Copy, Check, Printer,
    Image as ImageIcon, Upload, Link as LinkIcon, Trash2,
    Tags, ArrowRight,
} from 'lucide-react';

// Code 39 Barcode Generator Patterns (5 bars, 4 spaces; 0 = narrow, 1 = wide)
const CODE39_PATTERNS = {
    '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
    '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
    '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
    'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
    'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
    'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
    'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
    'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
    'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
    '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
    '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100',
};

function buildCode39(value) {
    if (!value) return null;
    const cleanValue = String(value).toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '');
    if (!cleanValue) return null;

    const fullStr = `*${cleanValue}*`;
    const narrow = 1.5;
    const wide = 3.5;
    const quietZone = 8;

    const bars = [];
    let currentX = quietZone;

    for (let i = 0; i < fullStr.length; i++) {
        const pattern = CODE39_PATTERNS[fullStr[i]] || CODE39_PATTERNS['*'];
        for (let j = 0; j < 9; j++) {
            const width = pattern[j] === '1' ? wide : narrow;
            if (j % 2 === 0) {
                bars.push({ x: currentX, width });
            }
            currentX += width;
        }
        currentX += narrow;
    }

    return { cleanValue, bars, totalWidth: currentX + quietZone };
}

function generateBarcodeSvgMarkup(value, height = 44, showText = true) {
    const data = buildCode39(value);
    if (!data) return '';

    const rects = data.bars
        .map(b => `<rect x="${b.x}" y="0" width="${b.width}" height="${height}" fill="#1A1A1A" />`)
        .join('');

    return `
        <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
            <svg viewBox="0 0 ${data.totalWidth} ${height}" style="width:100%; max-width:180px; height:38px;" preserveAspectRatio="xMidYMid meet">
                ${rects}
            </svg>
            ${showText ? `<div style="font-family:monospace; font-size:10.5px; font-weight:700; letter-spacing:1.5px; margin-top:2px; color:#1A1A1A;">${data.cleanValue}</div>` : ''}
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function BarcodeSvg({ value, height = 44, showText = true, className = '' }) {
    const data = buildCode39(value);
    if (!data) return null;

    return (
        <div className={`inline-flex flex-col items-center bg-white p-2.5 rounded-xl border border-line ${className}`}>
            <svg
                viewBox={`0 0 ${data.totalWidth} ${height}`}
                className="w-full max-w-[240px] h-auto max-h-[50px]"
                preserveAspectRatio="xMidYMid meet"
            >
                {data.bars.map((bar, idx) => (
                    <rect
                        key={idx}
                        x={bar.x}
                        y={0}
                        width={bar.width}
                        height={height}
                        fill="#1A1A1A"
                    />
                ))}
            </svg>
            {showText && (
                <span className="font-mono text-[11px] font-bold tracking-widest text-ink mt-1">
                    {data.cleanValue}
                </span>
            )}
        </div>
    );
}

export default function ProdukPage({ products, categories }) {
    const { errors } = usePage().props;
    // Products Search & Filter
    const [search, setSearch] = useState('');
    const [selectedKategori, setSelectedKategori] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [barcodeModalProduct, setBarcodeModalProduct] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [printQuantity, setPrintQuantity] = useState(4);

    // Product Form State
    const [idKategori, setIdKategori] = useState(categories[0]?.id_kategori || 1);
    const [namaProduk, setNamaProduk] = useState('');
    const [barcode, setBarcode] = useState('');
    const [harga, setHarga] = useState('');
    const [stok, setStok] = useState('');
    const [imageType, setImageType] = useState('file'); // 'file' | 'url'
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const generateRandomBarcode = () => {
        const num = Math.floor(1000 + Math.random() * 9000);
        return `PRD-${num}`;
    };

    const openCreate = () => {
        setEditData(null);
        setIdKategori(categories[0]?.id_kategori || 1);
        setNamaProduk('');
        setBarcode(generateRandomBarcode());
        setHarga('');
        setStok('');
        setImageType('file');
        setImageUrl('');
        setImageFile(null);
        setImagePreview('');
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditData(p);
        setIdKategori(p.id_kategori);
        setNamaProduk(p.nama_produk);
        setBarcode(p.barcode || '');
        setHarga(p.harga);
        setStok(p.stok);
        setImageType(p.image && p.image.startsWith('http') ? 'url' : 'file');
        setImageUrl(p.image || '');
        setImageFile(null);
        setImagePreview(p.image || '');
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImageUrl('');
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            id_kategori: idKategori,
            nama_produk: namaProduk,
            barcode: barcode.trim() || null,
            image: imageUrl.trim() || null,
            harga: parseFloat(harga),
            stok: parseInt(stok, 10),
        };
        if (imageFile) {
            payload.image_file = imageFile;
        }

        if (editData) {
            router.post(`/admin/produk/${editData.id_produk}`, {
                ...payload,
                _method: 'PUT',
            }, {
                forceFormData: true,
                onSuccess: () => setShowModal(false),
                onFinish: () => setLoading(false),
            });
        } else {
            router.post('/admin/produk', payload, {
                forceFormData: true,
                onSuccess: () => setShowModal(false),
                onFinish: () => setLoading(false),
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/admin/produk/${deleteTarget.id_produk}`, {
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const handleCopy = (code) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filtered = products.filter(p => {
        const matchesCategory = selectedKategori === 'ALL' || p.nama_kategori === selectedKategori;
        const q = search.toLowerCase();
        const matchesSearch = p.nama_produk.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.toLowerCase().includes(q));
        return matchesCategory && matchesSearch;
    });

    const money = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    const openBarcodeModal = (p, defaultQty = 4) => {
        setBarcodeModalProduct(p);
        setPrintQuantity(defaultQty);
    };

    // ponytail: capped at 200 labels per client-side print job; move to server-side PDF if bulk sheets > 200 are needed
    const handlePrintBarcode = (product, qty = 1) => {
        if (!product || !product.barcode) return;
        const count = Math.max(1, Math.min(200, parseInt(qty, 10) || 1));
        const barcodeSvgHtml = generateBarcodeSvgMarkup(product.barcode, 44, true);

        const labelsHtml = Array.from({ length: count }).map(() => `
            <div class="barcode-card">
                <div class="store-name">GOMEAL &bull; RESTO</div>
                <div class="product-name">${escapeHtml(product.nama_produk)}</div>
                <div class="product-price">${money(product.harga)}</div>
                <div class="barcode-wrapper">${barcodeSvgHtml}</div>
                <div class="card-footer">#${product.id_produk} &bull; ${escapeHtml(product.nama_kategori || 'Menu')}</div>
            </div>
        `).join('');

        const printHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Cetak Barcode - ${escapeHtml(product.nama_produk)} (${count}x)</title>
                <style>
                    @page { size: auto; margin: 6mm; }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        background: #fff;
                        color: #1A1A1A;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        padding: 6px;
                    }
                    .barcode-grid {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 5mm;
                        align-items: start;
                    }
                    .barcode-card {
                        width: 58mm;
                        border: 1px dashed #a0a0a0;
                        border-radius: 6px;
                        padding: 3.5mm 3mm;
                        text-align: center;
                        background: #fff;
                        break-inside: avoid;
                        page-break-inside: avoid;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    .store-name {
                        font-size: 8px;
                        font-weight: 800;
                        letter-spacing: 0.8px;
                        color: #666;
                        text-transform: uppercase;
                        margin-bottom: 2px;
                    }
                    .product-name {
                        font-size: 11px;
                        font-weight: 800;
                        color: #111;
                        line-height: 1.25;
                        max-width: 52mm;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        margin-bottom: 2px;
                    }
                    .product-price {
                        font-size: 11px;
                        font-weight: 800;
                        color: #059669;
                        margin-bottom: 3px;
                    }
                    .barcode-wrapper {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 100%;
                    }
                    .card-footer {
                        font-size: 8px;
                        color: #888;
                        margin-top: 3px;
                    }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="barcode-grid">${labelsHtml}</div>
            </body>
            </html>
        `;

        const oldIframe = document.getElementById('barcode-print-frame');
        if (oldIframe) oldIframe.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'barcode-print-frame';
        Object.assign(iframe.style, {
            position: 'fixed', left: '-9999px', top: '0', width: '210mm', height: '297mm',
            border: '0', zIndex: '-9999',
        });
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(printHtml);
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

    return (
        <AdminLayout
            activePage="produk"
            title="Katalog Produk"
            subtitle="Kelola menu hidangan, barcode scanner, foto makanan, harga Rupiah, dan stok"
        >
            <div className="space-y-4">
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-1 items-center gap-2 max-w-lg">
                        <div className="relative flex-1">
                            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/40">
                                <Search className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                                <input
                                    type="text"
                                    placeholder="Cari nama produk atau kode barcode..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-transparent text-[12.5px] text-ink placeholder-ink-soft outline-none"
                                />
                            </div>
                        </div>

                        <select
                            value={selectedKategori}
                            onChange={e => setSelectedKategori(e.target.value)}
                            className="rounded-full border border-line bg-muted/60 px-3.5 py-2 text-[12px] text-ink outline-none focus:border-primary focus:bg-white"
                        >
                            <option value="ALL">Semua Kategori</option>
                            {categories.map(c => (
                                <option key={c.id_kategori} value={c.nama_kategori}>{c.nama_kategori}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/kategori"
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[12px] font-semibold text-ink-soft hover:border-primary hover:text-ink transition"
                        >
                            <Tags className="h-3.5 w-3.5" />
                            <span>Kelola Kategori</span>
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-semibold text-ink hover:bg-primary-hover active:scale-95 transition shadow-sm"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            <span>Tambah Produk Baru</span>
                        </button>
                    </div>
                </div>

                        {/* Table Produk */}
                        <div className="bg-white rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[12.5px]">
                                    <thead>
                                        <tr className="border-b border-line bg-muted/40 text-ink-soft">
                                            <th className="py-3 px-4 font-semibold">Produk</th>
                                            <th className="py-3 px-4 font-semibold">Barcode</th>
                                            <th className="py-3 px-4 font-semibold">Kategori</th>
                                            <th className="py-3 px-4 font-semibold">Harga Satuan</th>
                                            <th className="py-3 px-4 font-semibold">Sisa Stok</th>
                                            <th className="py-3 px-4 font-semibold">Total Terjual</th>
                                            <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-ink-soft">
                                                    Tidak ada produk yang cocok
                                                </td>
                                            </tr>
                                        ) : filtered.map(p => (
                                            <tr key={p.id_produk} className="border-b border-line/60 hover:bg-primary-subtle/30 transition">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {p.image ? (
                                                            <img
                                                                src={p.image}
                                                                alt={p.nama_produk}
                                                                className="h-11 w-11 rounded-xl object-cover border border-line shrink-0 shadow-xs"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="h-11 w-11 rounded-xl bg-muted border border-line flex items-center justify-center shrink-0 text-ink-soft">
                                                                <UtensilsCrossed className="h-5 w-5 text-primary/60" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="font-bold text-ink block leading-tight">{p.nama_produk}</span>
                                                            <span className="text-[11px] text-ink-soft font-mono">ID #{p.id_produk}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {p.barcode ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => openBarcodeModal(p, 4)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-muted/70 px-2.5 py-1 font-mono text-[11px] font-bold text-ink hover:border-primary hover:bg-white transition group"
                                                            title="Lihat & cetak barcode"
                                                        >
                                                            <Barcode className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition" />
                                                            <span>{p.barcode}</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-ink-soft italic">Belum disetel</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10.5px] font-semibold text-ink-soft">
                                                        {p.nama_kategori}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-bold tabular-nums text-ink">
                                                    {money(p.harga)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 font-bold ${
                                                        p.stok < 10 ? 'text-red-600' : 'text-emerald-700'
                                                    }`}>
                                                        {p.stok < 10 && <AlertCircle className="h-3 w-3" />}
                                                        {p.stok} porsi
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-ink">
                                                    {p.terjual} porsi
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="inline-flex items-center justify-center gap-1.5">
                                                        {p.barcode && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openBarcodeModal(p, 4)}
                                                                className="inline-grid h-7 w-7 place-items-center rounded-full border border-line text-ink-soft hover:border-primary hover:text-ink transition active:scale-95"
                                                                title="Cetak Barcode"
                                                            >
                                                                <Printer className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(p)}
                                                            className="inline-grid h-7 w-7 place-items-center rounded-full border border-line text-ink-soft hover:border-primary hover:text-ink transition active:scale-95"
                                                            title="Edit Produk"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteTarget(p)}
                                                            className="inline-grid h-7 w-7 place-items-center rounded-full border border-line text-ink-soft hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition active:scale-95"
                                                            title="Hapus Produk"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
            </div>

            {/* Modal Create / Edit Produk */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-xl border border-line max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-line sticky top-0 bg-white z-10">
                            <h3 className="font-display text-[16px] font-bold text-ink flex items-center gap-2">
                                <UtensilsCrossed className="h-5 w-5 text-primary" />
                                {editData ? 'Edit Produk Hidangan' : 'Tambah Produk Baru'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-ink-soft hover:text-ink transition"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            {errors && Object.keys(errors).length > 0 && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[11.5px] text-red-700 space-y-0.5">
                                    {Object.values(errors).map((msg, idx) => (
                                        <p key={idx} className="flex items-center gap-1.5">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            <span>{msg}</span>
                                        </p>
                                    ))}
                                </div>
                            )}
                            {/* Product Image Section */}
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft block mb-1">
                                    Gambar / Foto Produk
                                </label>
                                
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setImageType('file')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-[11.5px] font-semibold transition border ${
                                            imageType === 'file'
                                                ? 'bg-primary/10 border-primary text-ink'
                                                : 'bg-muted/60 border-line text-ink-soft hover:bg-white'
                                        }`}
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                        <span>Upload File</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageType('url')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-[11.5px] font-semibold transition border ${
                                            imageType === 'url'
                                                ? 'bg-primary/10 border-primary text-ink'
                                                : 'bg-muted/60 border-line text-ink-soft hover:bg-white'
                                        }`}
                                    >
                                        <LinkIcon className="h-3.5 w-3.5" />
                                        <span>Tautan URL</span>
                                    </button>
                                </div>

                                {imageType === 'file' ? (
                                    <div className="space-y-2">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-line rounded-2xl p-4 text-center cursor-pointer hover:border-primary/60 hover:bg-primary-subtle/20 transition flex flex-col items-center justify-center gap-2"
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-primary">
                                                <ImageIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-semibold text-ink">
                                                    {imageFile ? imageFile.name : 'Pilih file foto produk'}
                                                </p>
                                                <p className="text-[10.5px] text-ink-soft">PNG, JPG, WEBP hingga 2MB</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-soft">
                                            <LinkIcon className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="url"
                                            value={imageUrl}
                                            onChange={e => {
                                                setImageUrl(e.target.value);
                                                setImagePreview(e.target.value);
                                            }}
                                            placeholder="https://images.unsplash.com/..."
                                            className="w-full rounded-xl border border-line bg-muted/40 pl-9 pr-3.5 py-2 text-[12px] text-ink outline-none focus:border-primary focus:bg-white"
                                        />
                                    </div>
                                )}

                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="mt-2.5 flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-line">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-16 w-16 rounded-xl object-cover border border-line shadow-xs"
                                            onError={() => setImagePreview('')}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[11px] font-bold text-ink block truncate">Preview Gambar</span>
                                            <span className="text-[10px] text-ink-soft block">Foto akan ditampilkan di katalog & POS</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="p-1.5 rounded-lg border border-line bg-white text-red-500 hover:bg-red-50 transition"
                                            title="Hapus Gambar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Kategori Menu */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Kategori Menu</label>
                                    <Link
                                        href="/admin/kategori"
                                        className="text-[11px] font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 active:scale-95 transition"
                                    >
                                        <Plus className="h-3 w-3" />
                                        <span>Kategori Baru</span>
                                    </Link>
                                </div>
                                <select
                                    value={idKategori}
                                    onChange={e => setIdKategori(parseInt(e.target.value, 10))}
                                    className="mt-1 w-full rounded-xl border border-line bg-muted/40 px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary focus:bg-white"
                                >
                                    {categories.map(c => (
                                        <option key={c.id_kategori} value={c.id_kategori}>{c.nama_kategori}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Nama Produk */}
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Nama Produk</label>
                                <input
                                    type="text"
                                    required
                                    value={namaProduk}
                                    onChange={e => setNamaProduk(e.target.value)}
                                    placeholder="Contoh: Double Cheeseburger"
                                    className="mt-1 w-full rounded-xl border border-line bg-muted/40 px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary focus:bg-white"
                                />
                            </div>

                            {/* Barcode Form Field */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Kode Barcode (Untuk Scan Transaksi)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setBarcode(generateRandomBarcode())}
                                        className="text-[11px] font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 active:scale-95 transition"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        Generate Acak
                                    </button>
                                </div>
                                <div className="relative mt-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-soft">
                                        <Barcode className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={barcode}
                                        onChange={e => setBarcode(e.target.value.toUpperCase())}
                                        placeholder="Contoh: PRD-0001 atau 899123456"
                                        className="w-full rounded-xl border border-line bg-muted/40 pl-9 pr-3.5 py-2 text-[12.5px] font-mono font-bold text-ink outline-none focus:border-primary focus:bg-white uppercase tracking-wider"
                                    />
                                </div>

                                {/* Live Barcode Preview */}
                                {barcode.trim() && (
                                    <div className="mt-2.5 flex flex-col items-center justify-center p-3 rounded-xl bg-muted/30 border border-line/70">
                                        <span className="text-[10px] font-semibold text-ink-soft mb-1 uppercase tracking-wider">Preview Barcode</span>
                                        <BarcodeSvg value={barcode.trim()} height={38} />
                                    </div>
                                )}
                            </div>

                            {/* Harga Satuan (Rupiah) & Stok */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Harga Satuan (Rp)</label>
                                    <input
                                        type="number"
                                        step="100"
                                        min="100"
                                        required
                                        value={harga}
                                        onChange={e => setHarga(e.target.value)}
                                        placeholder="35000"
                                        className="mt-1 w-full rounded-xl border border-line bg-muted/40 px-3.5 py-2 text-[12.5px] font-semibold text-ink outline-none focus:border-primary focus:bg-white"
                                    />
                                    {harga && (
                                        <span className="text-[11px] text-ink-soft mt-1 block">
                                            {money(harga)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Jumlah Stok</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={stok}
                                        onChange={e => setStok(e.target.value)}
                                        placeholder="50"
                                        className="mt-1 w-full rounded-xl border border-line bg-muted/40 px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 flex gap-2 pt-2 border-t border-line">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 rounded-full border border-line py-2 text-[12px] font-semibold text-ink-soft hover:bg-muted transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 rounded-full bg-primary py-2 text-[12px] font-semibold text-ink hover:bg-primary-hover active:scale-95 transition disabled:opacity-50"
                                >
                                    {loading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detail & Cetak Barcode Produk */}
            {barcodeModalProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-xl border border-line text-center animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-line">
                            <h3 className="font-display text-[15px] font-bold text-ink flex items-center gap-2">
                                <Barcode className="h-4 w-4 text-primary" />
                                <span>Barcode & Cetak Label</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setBarcodeModalProduct(null)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-ink-soft hover:text-ink transition"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="py-4 space-y-3">
                            {barcodeModalProduct.image && (
                                <img
                                    src={barcodeModalProduct.image}
                                    alt={barcodeModalProduct.nama_produk}
                                    className="h-16 w-16 rounded-2xl object-cover mx-auto border border-line shadow-sm"
                                />
                            )}
                            <div>
                                <h4 className="font-bold text-[15px] text-ink">{barcodeModalProduct.nama_produk}</h4>
                                <p className="text-[12px] text-ink-soft mt-0.5">{barcodeModalProduct.nama_kategori} &bull; {money(barcodeModalProduct.harga)}</p>
                            </div>

                            <div className="p-3 bg-muted/20 rounded-2xl border border-line inline-block shadow-sm">
                                <BarcodeSvg value={barcodeModalProduct.barcode} height={48} />
                            </div>

                            <div className="flex items-center justify-center gap-2 pt-0.5">
                                <button
                                    type="button"
                                    onClick={() => handleCopy(barcodeModalProduct.barcode)}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold text-ink hover:border-primary transition active:scale-95 shadow-xs"
                                >
                                    {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-ink-soft" />}
                                    <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Jumlah Cetak Barcode */}
                        <div className="pt-3 border-t border-line space-y-3 text-left">
                            <div className="bg-muted/40 rounded-2xl p-3 border border-line">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="print-barcode-qty" className="text-[11px] font-bold text-ink">
                                        Jumlah Barcode Dicetak
                                    </label>
                                    <span className="text-[10px] font-bold text-primary font-mono">
                                        {printQuantity || 1} Label
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPrintQuantity(q => Math.max(1, (Number(q) || 1) - 1))}
                                        className="h-9 w-9 rounded-xl border border-line bg-white flex items-center justify-center text-ink hover:bg-muted active:scale-95 transition font-bold shrink-0 shadow-xs"
                                        aria-label="Kurangi jumlah barcode"
                                    >
                                        <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <input
                                        id="print-barcode-qty"
                                        type="number"
                                        min="1"
                                        max="200"
                                        value={printQuantity}
                                        onChange={e => {
                                            const raw = e.target.value;
                                            if (raw === '') {
                                                setPrintQuantity('');
                                                return;
                                            }
                                            const val = parseInt(raw, 10);
                                            if (!isNaN(val)) {
                                                setPrintQuantity(Math.max(1, Math.min(200, val)));
                                            }
                                        }}
                                        onBlur={() => {
                                            if (!printQuantity || printQuantity < 1) setPrintQuantity(1);
                                        }}
                                        className="w-16 text-center rounded-xl border border-line bg-white py-1.5 text-[14px] font-bold text-ink outline-none focus:border-primary shadow-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPrintQuantity(q => Math.min(200, (Number(q) || 0) + 1))}
                                        className="h-9 w-9 rounded-xl border border-line bg-white flex items-center justify-center text-ink hover:bg-muted active:scale-95 transition font-bold shrink-0 shadow-xs"
                                        aria-label="Tambah jumlah barcode"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                    <div className="flex items-center gap-1 ml-auto">
                                        {[1, 4, 8, 12].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setPrintQuantity(n)}
                                                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition border ${
                                                    printQuantity === n
                                                        ? 'bg-primary border-primary text-ink shadow-xs'
                                                        : 'bg-white border-line text-ink-soft hover:text-ink'
                                                }`}
                                            >
                                                {n}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setBarcodeModalProduct(null)}
                                    className="flex-1 rounded-full border border-line py-2 text-[12px] font-semibold text-ink-soft hover:bg-muted transition"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePrintBarcode(barcodeModalProduct, printQuantity || 1)}
                                    className="flex-1 rounded-full bg-primary py-2 text-[12px] font-bold text-ink hover:bg-primary-hover active:scale-95 transition shadow-sm inline-flex items-center justify-center gap-1.5"
                                >
                                    <Printer className="h-4 w-4" />
                                    <span>Cetak ({printQuantity || 1})</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Warning Hapus Produk */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-xl border border-line animate-in fade-in duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600 border border-red-100 mb-3">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <h3 className="font-display text-[16px] font-bold text-ink">
                                Hapus Produk Ini?
                            </h3>
                            <p className="mt-1.5 text-[12.5px] text-ink-soft leading-relaxed">
                                Apakah Anda yakin ingin menghapus produk{' '}
                                <span className="font-bold text-ink">"{deleteTarget.nama_produk}"</span>?
                                Data produk akan dihapus permanen dan tidak dapat dikembalikan.
                            </p>
                        </div>

                        <div className="mt-5 flex gap-2 pt-3 border-t border-line">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 rounded-full border border-line py-2 text-[12px] font-semibold text-ink-soft hover:bg-muted transition disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="flex-1 rounded-full bg-red-600 py-2 text-[12px] font-semibold text-white hover:bg-red-700 active:scale-95 transition disabled:opacity-50"
                            >
                                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
