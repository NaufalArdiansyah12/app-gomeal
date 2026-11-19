import AdminLayout from './AdminLayout';
import { useState, useEffect, useMemo, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Plus, Minus, Trash2, Search, Printer, CheckCircle2,
    CreditCard, Banknote, QrCode, ArrowRight, X, Check, Landmark,
    ShoppingCart, Receipt, UserRound, BadgePercent, UtensilsCrossed,
} from 'lucide-react';

const escapeHtml = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default function TransaksiPage({ products = [], pelangganList = [], recentOrders = [] }) {
    const { flash } = usePage().props;

    // Pelanggan
    const [selectedPelangganId, setSelectedPelangganId] = useState(pelangganList[0]?.id_pelanggan || '');
    const [pelangganQuery, setPelangganQuery] = useState('');
    const [isSearchingPelanggan, setIsSearchingPelanggan] = useState(false);
    const searchDropdownRef = useRef(null);

    // Keranjang & menu
    const [cart, setCart] = useState([]);
    const [diskon, setDiskon] = useState(0);
    const [searchMenu, setSearchMenu] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [loading, setLoading] = useState(false);
    const [scanFeedback, setScanFeedback] = useState(null);
    const cartRef = useRef(cart);
    const scanToastTimerRef = useRef(null);

    // Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [metodePembayaran, setMetodePembayaran] = useState('Tunai');
    const [nominalBayar, setNominalBayar] = useState('');
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    const money = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    const activePelanggan = useMemo(
        () => pelangganList.find((p) => String(p.id_pelanggan) === String(selectedPelangganId)) || null,
        [pelangganList, selectedPelangganId]
    );

    const filteredPelanggan = useMemo(() => {
        if (!pelangganQuery.trim()) return pelangganList.slice(0, 8);
        const q = pelangganQuery.toLowerCase();
        return pelangganList
            .filter((p) => p.nama_pelanggan.toLowerCase().includes(q) || (p.kota && p.kota.toLowerCase().includes(q)))
            .slice(0, 10);
    }, [pelangganList, pelangganQuery]);

    const categories = useMemo(() => {
        const names = [...new Set(products.map((p) => p.nama_kategori).filter(Boolean))];
        return ['Semua', ...names];
    }, [products]);

    // Tutup dropdown pelanggan saat klik di luar
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
                setIsSearchingPelanggan(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Struk dari backend
    useEffect(() => {
        if (flash?.receipt) {
            setReceiptData(flash.receipt);
            setShowPaymentModal(false);
            setShowReceiptModal(true);
            setCart([]);
            setDiskon(0);
        }
    }, [flash]);

    // Esc menutup modal
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            if (showPaymentModal && !loading) setShowPaymentModal(false);
            else if (showReceiptModal) setShowReceiptModal(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [showPaymentModal, showReceiptModal, loading]);

    // Operasi keranjang
    useEffect(() => {
        cartRef.current = cart;
    }, [cart]);

    const playBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (_) {}
    };

    const triggerScanFeedback = (msg, type = 'success') => {
        if (scanToastTimerRef.current) clearTimeout(scanToastTimerRef.current);
        setScanFeedback({ text: msg, type });
        scanToastTimerRef.current = setTimeout(() => {
            setScanFeedback(null);
        }, 2500);
    };

    const addToCart = (product) => {
        if (!product || product.stok <= 0) return;
        setCart((prev) => {
            const exists = prev.find((i) => i.nama_produk === product.nama_produk);
            if (exists) {
                if (exists.qty >= product.stok) return prev;
                return prev.map((i) => (i.nama_produk === product.nama_produk ? { ...i, qty: i.qty + 1 } : i));
            }
            return [...prev, {
                nama_produk: product.nama_produk,
                harga: Number(product.harga),
                qty: 1,
                maxStok: product.stok,
                kategori: product.nama_kategori,
            }];
        });
    };

    const handleBarcodeAdd = (product) => {
        if (!product) return false;
        if (Number(product.stok) <= 0) {
            triggerScanFeedback(`Stok ${product.nama_produk} habis!`, 'error');
            return false;
        }
        const currentItem = cartRef.current.find((i) => i.nama_produk === product.nama_produk);
        if (currentItem && currentItem.qty >= product.stok) {
            triggerScanFeedback(`Maksimal stok tercapai (${product.stok} porsi)`, 'error');
            return false;
        }

        addToCart(product);
        playBeep();
        triggerScanFeedback(`+1 ${product.nama_produk} ditambahkan`);
        return true;
    };

    // Deteksi barcode scanner global (USB/Bluetooth HID)
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e) => {
            if (e.defaultPrevented || showPaymentModal || showReceiptModal) return;

            const tag = e.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) {
                return;
            }

            const now = Date.now();
            const diff = now - lastKeyTime;
            lastKeyTime = now;

            // ponytail: 150ms tolerates slow Bluetooth scanners; tighten to 50ms if global hotkeys are added
            if (diff > 150) {
                buffer = '';
            }

            if (e.key === 'Enter') {
                const scanned = buffer.trim();
                buffer = '';

                if (scanned.length >= 2) {
                    const match = products.find((p) => p.barcode && p.barcode.trim().toLowerCase() === scanned.toLowerCase())
                        || products.find((p) => `BRC-${String(p.id_produk).padStart(4, '0')}`.toLowerCase() === scanned.toLowerCase());

                    if (match) {
                        e.preventDefault();
                        handleBarcodeAdd(match);
                    } else if (scanned.length >= 3) {
                        e.preventDefault();
                        triggerScanFeedback(`Barcode "${scanned}" tidak terdaftar`, 'error');
                    }
                }
                return;
            }

            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [products, showPaymentModal, showReceiptModal]);

    const updateQty = (nama, delta) => {
        setCart((prev) =>
            prev
                .map((i) => {
                    if (i.nama_produk !== nama) return i;
                    const next = i.qty + delta;
                    if (next <= 0) return null;
                    if (next > i.maxStok) return i;
                    return { ...i, qty: next };
                })
                .filter(Boolean)
        );
    };

    const removeItem = (nama) => setCart((prev) => prev.filter((i) => i.nama_produk !== nama));

    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    const subtotal = cart.reduce((s, i) => s + i.harga * i.qty, 0);
    const potongan = (subtotal * diskon) / 100;
    const totalAkhir = Math.max(0, subtotal - potongan);

    const handleProceedToPayment = (e) => {
        e.preventDefault();
        if (cart.length === 0 || !selectedPelangganId) return;
        setMetodePembayaran('Tunai');
        setNominalBayar(String(Math.round(totalAkhir)));
        setShowPaymentModal(true);
    };

    const bayarValue = parseFloat(nominalBayar) || 0;
    const kembalian = Math.max(0, bayarValue - totalAkhir);
    const isUnderpaid = metodePembayaran === 'Tunai' && bayarValue < totalAkhir;

    const cashPresets = useMemo(() => {
        if (totalAkhir <= 0) return [];
        const rounded = Math.round(totalAkhir);
        const presets = [rounded];
        [5000, 10000, 20000, 50000, 100000].forEach((step) => {
            const v = Math.ceil(rounded / step) * step;
            if (v >= rounded && !presets.includes(v)) presets.push(v);
        });
        return presets.slice(0, 4);
    }, [totalAkhir]);

    const handleConfirmPayment = () => {
        if (isUnderpaid || loading) return;
        setLoading(true);
        router.post('/admin/transaksi', {
            id_pelanggan: selectedPelangganId,
            items: cart.map((i) => ({ nama_produk: i.nama_produk, qty: i.qty })),
            diskon_persen: diskon,
            metode_pembayaran: metodePembayaran,
            nominal_bayar: metodePembayaran === 'Tunai' ? bayarValue : totalAkhir,
        }, {
            onError: () => setLoading(false),
            onFinish: () => setLoading(false),
        });
    };

    // Cetak struk
    const handlePrintReceipt = () => {
        if (!receiptData) return;

        const itemsHtml = (receiptData.items || []).map((item) => `
            <div style="margin-bottom: 5px;">
                <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; word-break: break-word;">${escapeHtml(item.nama_produk)}</div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10.5px; padding-left: 6px; gap: 8px;">
                    <span>${escapeHtml(item.jumlah)} x ${money(item.harga)}</span>
                    <span class="nowrap" style="font-weight: bold; font-family: monospace;">${money(item.subtotal)}</span>
                </div>
            </div>
        `).join('');

        const diskonHtml = Number(receiptData.diskon_persen) > 0 ? `
            <div class="row" style="margin-top: 2px;">
                <span>DISKON (${escapeHtml(receiptData.diskon_persen)}%)</span>
                <span class="nowrap">-${money(receiptData.potongan)}</span>
            </div>
        ` : '';

        const receiptHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Struk #${escapeHtml(receiptData.id_transaksi)}</title>
                <style>
                    @page { size: auto; margin: 0; }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    html, body {
                        width: 100%; margin: 0; padding: 0; background: #fff; color: #000;
                        font-family: 'Courier New', Courier, monospace;
                        -webkit-print-color-adjust: exact; print-color-adjust: exact;
                    }
                    .receipt-box {
                        width: 100%; max-width: 76mm; padding: 3mm 4mm; margin: 0 auto;
                        page-break-inside: avoid; break-inside: avoid;
                    }
                    .text-center { text-align: center; }
                    .double-line { border-bottom: 2px solid #000; margin: 5px 0; }
                    .dash-line { border-bottom: 1px dashed #000; margin: 4px 0; }
                    .row { display: flex; justify-content: space-between; align-items: baseline; gap: 4px; font-size: 10px; line-height: 1.35; }
                    .total-row { display: flex; justify-content: space-between; align-items: baseline; gap: 4px; font-size: 11px; font-weight: bold; line-height: 1.35; }
                    .nowrap { white-space: nowrap; flex-shrink: 0; text-align: right; }
                </style>
            </head>
            <body>
                <div class="receipt-box">
                    <div class="text-center">
                        <div style="font-size: 15px; font-weight: bold; letter-spacing: 1px;">GOMEAL RESTO</div>
                        <div style="font-size: 9.5px; margin-top: 1px;">PT. GOMEAL INDONESIA MAKMUR</div>
                        <div style="font-size: 9px; margin-top: 2px;">JL. RAYA UTAMA NO. 88, KOTA</div>
                    </div>
                    <div class="double-line"></div>
                    <div class="row"><span>TRX ID : #${escapeHtml(receiptData.id_transaksi)}</span><span class="nowrap">${escapeHtml(receiptData.tanggal)}</span></div>
                    <div class="row"><span>KASIR  : ${escapeHtml(receiptData.kasir)}</span><span class="nowrap">PEL: ${escapeHtml(receiptData.pelanggan?.nama_pelanggan || 'Umum')}</span></div>
                    <div class="dash-line"></div>
                    <div>${itemsHtml}</div>
                    <div class="dash-line"></div>
                    <div class="row"><span>SUBTOTAL</span><span class="nowrap">${money(receiptData.subtotal)}</span></div>
                    ${diskonHtml}
                    <div class="double-line"></div>
                    <div class="total-row"><span>TOTAL AKHIR</span><span class="nowrap">${money(receiptData.total)}</span></div>
                    <div class="row"><span>BAYAR (${escapeHtml(receiptData.metode_pembayaran)})</span><span class="nowrap">${money(receiptData.nominal_bayar)}</span></div>
                    <div class="row"><span>KEMBALIAN</span><span class="nowrap">${money(receiptData.kembalian)}</span></div>
                    <div class="dash-line"></div>
                    <div class="text-center" style="font-size: 8.5px; line-height: 1.35; margin-top: 4px;">
                        <div style="font-weight: 900; font-size: 9.5px;">TERIMA KASIH TELAH BERBELANJA</div>
                        <div>NIKMATI SETIAP RASA... YA DI GOMEAL!</div>
                        <div class="double-line"></div>
                        <div style="font-size: 8.5px; letter-spacing: 2px;">* ${escapeHtml(receiptData.id_transaksi)}-GOMEAL-POS *</div>
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

    const filteredMenu = products.filter((p) => {
        const q = searchMenu.toLowerCase().trim();
        if (!q) {
            return activeCategory === 'Semua' || p.nama_kategori === activeCategory;
        }
        const matchQuery =
            p.nama_produk.toLowerCase().includes(q) ||
            p.nama_kategori.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.toLowerCase().includes(q));
        const matchCat = activeCategory === 'Semua' || p.nama_kategori === activeCategory;
        return matchQuery && matchCat;
    });

    const canCheckout = cart.length > 0 && !!selectedPelangganId;

    return (
        <AdminLayout
            activePage="transaksi"
            title="Kasir & Transaksi POS"
            subtitle="Catat pesanan langsung di tempat dengan cepat dan akurat"
        >
            <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-12">
                {/* ================= KIRI: KATALOG ================= */}
                <div className="space-y-4 lg:col-span-7 xl:col-span-8">
                    {/* Pencarian + kategori */}
                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-2.5 rounded-full bg-muted px-4 py-2.5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/40">
                            <Search className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Cari hidangan, kategori, atau barcode..."
                                value={searchMenu}
                                onChange={(e) => setSearchMenu(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const q = searchMenu.trim();
                                        if (!q) return;
                                        const match = products.find((p) => p.barcode && p.barcode.toLowerCase() === q.toLowerCase())
                                            || (filteredMenu.length === 1 ? filteredMenu[0] : null)
                                            || products.find((p) => p.nama_produk.toLowerCase() === q.toLowerCase());
                                        if (match) {
                                            e.preventDefault();
                                            handleBarcodeAdd(match);
                                            setSearchMenu('');
                                        }
                                    }
                                }}
                                className="w-full bg-transparent text-[13.5px] text-ink placeholder-ink-soft outline-none"
                                aria-label="Cari menu"
                            />
                            {searchMenu && (
                                <button type="button" onClick={() => setSearchMenu('')} className="text-ink-soft hover:text-ink" aria-label="Hapus pencarian">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                        activeCategory === cat
                                            ? 'bg-ink text-white'
                                            : 'border border-line bg-white text-ink-soft hover:border-primary/50 hover:text-ink'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid menu */}
                    {filteredMenu.length === 0 ? (
                        <div className="rounded-[22px] border border-dashed border-line bg-white py-14 text-center">
                            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-muted">
                                <UtensilsCrossed className="h-5 w-5 text-ink-soft" />
                            </span>
                            <p className="mt-3 text-[14px] font-semibold text-ink">Menu tidak ditemukan</p>
                            <p className="mt-0.5 text-[12.5px] text-ink-soft">Coba kata kunci lain atau pilih kategori Semua.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
                            {filteredMenu.map((p) => {
                                const inCartQty = cart.find((i) => i.nama_produk === p.nama_produk)?.qty || 0;
                                const stok = Number(p.stok);
                                const isOutOfStock = stok <= 0;
                                const isMaxInCart = inCartQty >= stok;
                                const isDisabled = isOutOfStock || isMaxInCart;
                                const lowStock = !isOutOfStock && stok < 10;

                                return (
                                    <button
                                        key={p.id_produk}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => addToCart(p)}
                                        className={`group relative flex min-h-[230px] select-none flex-col justify-between overflow-hidden rounded-[20px] border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                            inCartQty > 0
                                                ? 'border-primary bg-primary-subtle/50'
                                                : 'border-line bg-white'
                                        } ${
                                            isDisabled
                                                ? 'cursor-not-allowed opacity-60'
                                                : 'hover:border-primary/60 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] active:scale-[0.98]'
                                        }`}
                                    >
                                        {inCartQty > 0 && (
                                            <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-[24px] place-items-center rounded-full bg-primary px-1.5 text-[11.5px] font-bold text-ink shadow-sm ring-2 ring-white">
                                                {inCartQty}
                                            </span>
                                        )}

                                        <div className="mb-3 aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-muted">
                                            {p.image ? (
                                                <img src={p.image} alt={p.nama_produk} loading="lazy" className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]" onError={(event) => { event.currentTarget.hidden = true; }} />
                                            ) : (
                                                <div className="grid h-full place-items-center text-ink-soft"><UtensilsCrossed className="h-8 w-8" /></div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between gap-1.5">
                                                <span className="truncate rounded-full bg-primary-subtle px-2.5 py-0.5 text-[11px] font-semibold text-primary-deep">
                                                    {p.nama_kategori}
                                                </span>
                                                {isOutOfStock && (
                                                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10.5px] font-bold text-red-600">Habis</span>
                                                )}
                                                {!isOutOfStock && isMaxInCart && (
                                                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-700">Maks</span>
                                                )}
                                            </div>
                                            <p className="mt-2.5 line-clamp-2 font-display text-[14px] font-bold leading-snug text-ink">
                                                {p.nama_produk}
                                            </p>
                                        </div>

                                        <div className="mt-3 flex items-end justify-between gap-2">
                                            <div>
                                                <p className="font-display text-[15px] font-bold tabular-nums text-ink">{money(p.harga)}</p>
                                                <p className={`text-[11.5px] ${isOutOfStock ? 'font-bold text-red-500' : lowStock ? 'font-semibold text-amber-600' : 'text-ink-soft'}`}>
                                                    Stok {stok}
                                                </p>
                                            </div>
                                            <span
                                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
                                                    isDisabled
                                                        ? 'bg-muted text-ink-soft'
                                                        : 'bg-primary text-ink group-hover:bg-primary-hover'
                                                }`}
                                            >
                                                {inCartQty > 0 && isDisabled ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" strokeWidth={3} />}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Riwayat transaksi */}
                    <div className="rounded-[22px] border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-subtle">
                                    <Receipt className="h-4 w-4 text-primary-deep" strokeWidth={2.4} />
                                </span>
                                <div>
                                    <h3 className="font-display text-[15px] font-bold leading-tight text-ink">Riwayat Transaksi Terakhir</h3>
                                    <p className="text-[11.5px] text-ink-soft">5 pesanan terbaru dari kasir</p>
                                </div>
                            </div>
                        </div>

                        {recentOrders.length === 0 ? (
                            <p className="py-8 text-center text-[12.5px] text-ink-soft">Belum ada transaksi.</p>
                        ) : (
                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-left text-[12.5px]">
                                    <thead>
                                        <tr className="border-b border-line text-[11.5px] text-ink-soft">
                                            <th className="pb-2 font-semibold">ID</th>
                                            <th className="pb-2 font-semibold">Pelanggan</th>
                                            <th className="pb-2 font-semibold">Pesanan</th>
                                            <th className="pb-2 text-right font-semibold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.slice(0, 5).map((o) => (
                                            <tr key={o.id_transaksi} className="border-b border-line/50 transition last:border-0 hover:bg-muted/40">
                                                <td className="py-3 pr-3 font-semibold text-ink">#{o.id_transaksi}</td>
                                                <td className="py-3 pr-3 text-ink">
                                                    {o.nama_pelanggan} <span className="text-ink-soft">({o.kota})</span>
                                                </td>
                                                <td className="max-w-[16rem] truncate py-3 pr-3 text-ink-soft">{o.items}</td>
                                                <td className="py-3 text-right font-bold tabular-nums text-ink">{money(o.total_belanja)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ================= KANAN: KERANJANG ================= */}
                <div className="lg:col-span-5 xl:col-span-4">
                    <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-line px-5 py-4">
                            <div className="flex items-center gap-2.5">
                                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary">
                                    <ShoppingCart className="h-4.5 w-4.5 text-ink" strokeWidth={2.4} />
                                </span>
                                <div>
                                    <h3 className="font-display text-[15px] font-bold leading-tight text-ink">Pesanan Saat Ini</h3>
                                    <p className="text-[11.5px] text-ink-soft">{totalQty} porsi dari {cart.length} menu</p>
                                </div>
                            </div>
                            {cart.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setCart([])}
                                    className="rounded-lg px-2 py-1 text-[12px] font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                    Kosongkan
                                </button>
                            )}
                        </div>

                        {/* Pelanggan */}
                        <div className="relative border-b border-line px-5 py-3.5" ref={searchDropdownRef}>
                            <p className="mb-1.5 text-[12px] font-semibold text-ink-soft">Pelanggan</p>

                            {activePelanggan && !isSearchingPelanggan ? (
                                <div className="flex items-center justify-between rounded-xl border border-line bg-muted/30 p-2.5 transition hover:border-primary/50">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-[13px] font-bold text-primary-deep">
                                            {activePelanggan.nama_pelanggan.charAt(0).toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-[13.5px] font-semibold leading-tight text-ink">{activePelanggan.nama_pelanggan}</p>
                                            <p className="truncate text-[11.5px] text-ink-soft">{activePelanggan.kota || '-'}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setIsSearchingPelanggan(true); setPelangganQuery(''); }}
                                        className="rounded-lg px-2.5 py-1 text-[12px] font-semibold text-primary-deep transition hover:bg-white"
                                    >
                                        Ganti
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2 rounded-xl border border-primary bg-white px-3 py-2.5 shadow-sm">
                                        <Search className="h-4 w-4 shrink-0 text-primary" />
                                        <input
                                            type="text"
                                            autoFocus={isSearchingPelanggan}
                                            placeholder="Cari nama atau kota pelanggan..."
                                            value={pelangganQuery}
                                            onChange={(e) => { setPelangganQuery(e.target.value); setIsSearchingPelanggan(true); }}
                                            onFocus={() => setIsSearchingPelanggan(true)}
                                            className="w-full bg-transparent text-[13px] text-ink placeholder-ink-soft outline-none"
                                        />
                                        {pelangganQuery && (
                                            <button type="button" onClick={() => setPelangganQuery('')} className="text-ink-soft hover:text-ink" aria-label="Hapus">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {isSearchingPelanggan && (
                                        <div className="absolute left-5 right-5 z-30 mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-lg">
                                            {filteredPelanggan.length === 0 ? (
                                                <div className="p-3 text-center text-[12px] text-ink-soft">Pelanggan tidak ditemukan</div>
                                            ) : (
                                                filteredPelanggan.map((p) => {
                                                    const selected = String(selectedPelangganId) === String(p.id_pelanggan);
                                                    return (
                                                        <button
                                                            key={p.id_pelanggan}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedPelangganId(p.id_pelanggan);
                                                                setIsSearchingPelanggan(false);
                                                                setPelangganQuery('');
                                                            }}
                                                            className={`flex w-full items-center justify-between rounded-lg p-2.5 text-left text-[13px] transition ${
                                                                selected ? 'bg-primary-subtle font-semibold text-primary-deep' : 'text-ink hover:bg-muted'
                                                            }`}
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate">{p.nama_pelanggan}</p>
                                                                <p className="text-[11.5px] font-normal text-ink-soft">{p.kota}</p>
                                                            </div>
                                                            {selected && <Check className="h-4 w-4 shrink-0 text-primary-deep" />}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Daftar item */}
                        <div className="min-h-[120px] flex-1 overflow-y-auto px-3 py-2">
                            {cart.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                                    <span className="grid h-12 w-12 place-items-center rounded-full bg-muted">
                                        <ShoppingCart className="h-5 w-5 text-ink-soft" />
                                    </span>
                                    <p className="mt-3 text-[13.5px] font-semibold text-ink">Keranjang masih kosong</p>
                                    <p className="mt-0.5 text-[12px] text-ink-soft">Pilih menu di sebelah kiri untuk memulai pesanan.</p>
                                </div>
                            ) : (
                                <ul className="space-y-1">
                                    {cart.map((i) => (
                                        <li key={i.nama_produk} className="rounded-xl p-2.5 transition hover:bg-primary-subtle/50">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-semibold text-ink">{i.nama_produk}</p>
                                                    <p className="text-[11.5px] text-ink-soft">{money(i.harga)} / porsi</p>
                                                </div>
                                                <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">{money(i.harga * i.qty)}</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="inline-flex items-center rounded-full border border-line bg-white">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(i.nama_produk, -1)}
                                                        className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition hover:bg-muted hover:text-ink active:scale-90"
                                                        aria-label={`Kurangi ${i.nama_produk}`}
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="min-w-[28px] text-center text-[13px] font-bold tabular-nums text-ink">{i.qty}</span>
                                                    <button
                                                        type="button"
                                                        disabled={i.qty >= i.maxStok}
                                                        onClick={() => updateQty(i.nama_produk, 1)}
                                                        className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition hover:bg-muted hover:text-ink active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                                                        title={i.qty >= i.maxStok ? 'Stok produk mencapai batas' : 'Tambah 1'}
                                                        aria-label={`Tambah ${i.nama_produk}`}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(i.nama_produk)}
                                                    className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                                                    aria-label={`Hapus ${i.nama_produk}`}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Footer: diskon + total + CTA */}
                        <div className="space-y-3.5 border-t border-line bg-muted/20 px-5 py-4">
                            <div>
                                <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
                                    <BadgePercent className="h-3.5 w-3.5" /> Diskon
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {[0, 10, 15, 20].map((pct) => (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => setDiskon(pct)}
                                            className={`rounded-full py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                                diskon === pct ? 'bg-ink text-white' : 'border border-line bg-white text-ink-soft hover:border-primary/50 hover:text-ink'
                                            }`}
                                        >
                                            {pct === 0 ? 'Normal' : `${pct}%`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5 text-[13px]">
                                <div className="flex justify-between text-ink-soft">
                                    <span>Subtotal</span>
                                    <span className="font-semibold tabular-nums text-ink">{money(subtotal)}</span>
                                </div>
                                {diskon > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Potongan ({diskon}%)</span>
                                        <span className="font-semibold tabular-nums">-{money(potongan)}</span>
                                    </div>
                                )}
                                <div className="flex items-baseline justify-between border-t border-dashed border-line pt-2.5">
                                    <span className="text-[13px] font-semibold text-ink">Total tagihan</span>
                                    <span className="font-display text-[24px] font-bold leading-none tabular-nums tracking-tight text-ink">
                                        {money(totalAkhir)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleProceedToPayment}
                                disabled={!canCheckout}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-bold text-ink shadow-sm transition hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span>Lanjut ke Pembayaran</span>
                                <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
                            </button>
                            {!canCheckout && (
                                <p className="text-center text-[11.5px] text-ink-soft">
                                    {cart.length === 0 ? 'Tambahkan minimal satu menu.' : 'Pilih pelanggan terlebih dahulu.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MODAL PEMBAYARAN ================= */}
            {showPaymentModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
                    onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) setShowPaymentModal(false); }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Konfirmasi pembayaran"
                >
                    <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[26px] border border-line bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-display text-[18px] font-bold text-ink">Pembayaran</h3>
                                <p className="mt-0.5 text-[12.5px] text-ink-soft">
                                    Pelanggan: <span className="font-semibold text-ink">{activePelanggan?.nama_pelanggan}</span>
                                    {activePelanggan?.kota && ` · ${activePelanggan.kota}`}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-ink-soft transition hover:text-ink"
                                aria-label="Tutup"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {/* Total */}
                            <div className="rounded-2xl border border-primary/30 bg-primary-subtle p-4 text-center">
                                <p className="text-[12px] font-semibold text-primary-deep">Total tagihan</p>
                                <p className="mt-1 font-display text-[32px] font-bold leading-none tabular-nums tracking-tight text-ink">
                                    {money(totalAkhir)}
                                </p>
                                <p className="mt-2 text-[12px] text-primary-deep/80">
                                    {cart.length} menu · {totalQty} porsi{diskon > 0 && ` · diskon ${diskon}%`}
                                </p>
                            </div>

                            {/* Metode */}
                            <div>
                                <p className="mb-1.5 text-[12px] font-semibold text-ink-soft">Metode pembayaran</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'Tunai', label: 'Tunai (Cash)', icon: Banknote },
                                        { id: 'QRIS', label: 'QRIS', icon: QrCode },
                                        { id: 'BCA', label: 'VA BCA', icon: Landmark },
                                        { id: 'BRI', label: 'VA BRI', icon: Landmark },
                                    ].map(({ id, label, icon: Icon }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setMetodePembayaran(id)}
                                            aria-pressed={metodePembayaran === id}
                                            className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                                metodePembayaran === id
                                                    ? 'border-primary bg-primary-subtle font-bold text-primary-deep'
                                                    : 'border-line bg-white text-ink hover:bg-muted'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="text-[12.5px]">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {metodePembayaran === 'Tunai' ? (
                                <div className="space-y-2.5">
                                    <label htmlFor="nominal-bayar" className="block text-[12px] font-semibold text-ink-soft">
                                        Uang diterima
                                    </label>
                                    <div className="flex items-center rounded-xl border border-line bg-muted/40 px-3.5 transition focus-within:border-primary focus-within:bg-white">
                                        <span className="text-[14px] font-semibold text-ink-soft">Rp</span>
                                        <input
                                            id="nominal-bayar"
                                            type="text"
                                            inputMode="numeric"
                                            value={nominalBayar ? Number(nominalBayar).toLocaleString('id-ID') : ''}
                                            onChange={(e) => setNominalBayar(e.target.value.replace(/\D/g, ''))}
                                            placeholder="0"
                                            className="w-full bg-transparent py-3 text-right font-display text-[20px] font-bold tabular-nums text-ink outline-none"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {cashPresets.map((preset, idx) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setNominalBayar(String(preset))}
                                                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold tabular-nums transition ${
                                                    Number(nominalBayar) === preset
                                                        ? 'bg-ink text-white'
                                                        : 'border border-line bg-white text-ink hover:border-primary/50'
                                                }`}
                                            >
                                                {idx === 0 ? 'Uang pas' : preset.toLocaleString('id-ID')}
                                            </button>
                                        ))}
                                    </div>

                                    <div
                                        className={`flex items-center justify-between rounded-xl border p-3.5 ${
                                            isUnderpaid
                                                ? 'border-red-200 bg-red-50 text-red-700'
                                                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        }`}
                                    >
                                        <span className="text-[13px] font-semibold">{isUnderpaid ? 'Masih kurang' : 'Kembalian'}</span>
                                        <span className="font-display text-[18px] font-bold tabular-nums">
                                            {money(isUnderpaid ? totalAkhir - bayarValue : kembalian)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-primary/20 bg-primary-subtle/50 p-4 text-[12.5px] text-ink-soft">
                                    <p className="font-semibold text-primary-deep">Redirect ke Duitku Payment Gateway</p>
                                    <p className="mt-1 text-ink-soft">
                                        Anda akan diarahkan ke halaman Duitku untuk membayar dengan {metodePembayaran === 'BCA' ? 'Virtual Account BCA' : metodePembayaran === 'BRI' ? 'Virtual Account BRI' : 'QRIS'}.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    disabled={loading}
                                    className="flex-1 rounded-full border border-line py-3 text-[13px] font-semibold text-ink-soft transition hover:bg-muted disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    disabled={isUnderpaid || loading}
                                    onClick={handleConfirmPayment}
                                    className="flex-[1.4] rounded-full bg-primary py-3 text-[13px] font-bold text-ink transition hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading
                                        ? 'Memproses...'
                                        : metodePembayaran !== 'Tunai'
                                          ? 'Bayar via Duitku'
                                          : 'Selesaikan Transaksi'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL STRUK ================= */}
            {showReceiptModal && receiptData && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
                    onMouseDown={(e) => { if (e.target === e.currentTarget) setShowReceiptModal(false); }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Transaksi berhasil"
                >
                    <div className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-[26px] border border-line bg-white p-6 text-center shadow-2xl">
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="h-7 w-7" strokeWidth={2.4} />
                        </span>
                        <h3 className="mt-3 font-display text-[18px] font-bold text-ink">Transaksi berhasil</h3>
                        <p className="mt-0.5 text-[12.5px] text-ink-soft">
                            #{receiptData.id_transaksi} · {receiptData.pelanggan?.nama_pelanggan}
                        </p>

                        {/* Ringkasan struk */}
                        <div className="my-4 rounded-2xl border border-line bg-muted/30 p-4 text-left text-[13px]">
                            {(receiptData.items || []).length > 0 && (
                                <ul className="mb-3 space-y-1.5 border-b border-dashed border-line pb-3">
                                    {receiptData.items.map((it, idx) => (
                                        <li key={idx} className="flex justify-between gap-3">
                                            <span className="min-w-0 truncate text-ink">
                                                {it.jumlah}× {it.nama_produk}
                                            </span>
                                            <span className="shrink-0 font-semibold tabular-nums text-ink">{money(it.subtotal)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-ink-soft">Total tagihan</span>
                                    <span className="font-bold tabular-nums text-ink">{money(receiptData.total)}</span>
                                </div>
                                <div className="flex justify-between text-ink-soft">
                                    <span>Metode</span>
                                    <span className="text-ink">{receiptData.metode_pembayaran}</span>
                                </div>
                                <div className="flex justify-between text-ink-soft">
                                    <span>Dibayar</span>
                                    <span className="tabular-nums text-ink">{money(receiptData.nominal_bayar)}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed border-line pt-2 font-bold text-emerald-700">
                                    <span>Kembalian</span>
                                    <span className="tabular-nums">{money(receiptData.kembalian)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => setShowReceiptModal(false)}
                                className="flex-1 rounded-full border border-line py-3 text-[13px] font-semibold text-ink-soft transition hover:bg-muted"
                            >
                                Selesai
                            </button>
                            <button
                                type="button"
                                onClick={handlePrintReceipt}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-3 text-[13px] font-bold text-ink transition hover:bg-primary-hover active:scale-[0.98]"
                            >
                                <Printer className="h-4 w-4" />
                                <span>Cetak Struk</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Notifikasi feedback barcode scan */}
            {scanFeedback && (
                <div className="pointer-events-none fixed bottom-8 left-1/2 z-60 -translate-x-1/2 animate-[toastIn_0.24s_ease-out]">
                    <div className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)] ${
                        scanFeedback.type === 'success' ? 'bg-ink' : 'bg-red-600'
                    }`}>
                        {scanFeedback.type === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={2.5} />
                        ) : (
                            <X className="h-4 w-4 text-white" strokeWidth={2.5} />
                        )}
                        <span>{scanFeedback.text}</span>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
