import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import {
    QrCode, Camera, CheckCircle2, RefreshCw, Search, Star,
    Plus, Minus, ShoppingBag, Trash2, StickyNote, Wallet, Banknote,
    Users, AlertCircle, ArrowRight,
} from 'lucide-react';
import PelangganLayout, { money } from './PelangganLayout';

export default function FoodOrderDineIn({
    customer,
    walletBalance,
    categories = [],
    products = [],
    tables = [],
    activeMeja = null,
}) {
    const [scannedTable, setScannedTable] = useState(activeMeja || null);
    const [manualCode, setManualCode] = useState('');
    const [scanError, setScanError] = useState('');
    const [simulatingScan, setSimulatingScan] = useState(false);

    // Menu & Cart state (revealed after scan)
    const [activeCategory, setActiveCategory] = useState(null);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('gomeal_pay');
    const [processing, setProcessing] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);

    // Auto-select if URL has activeMeja
    useEffect(() => {
        if (activeMeja && !scannedTable) {
            setScannedTable(activeMeja);
        }
    }, [activeMeja]);

    const handleVerifyCode = (codeToVerify) => {
        setScanError('');
        const trimmed = (codeToVerify || manualCode).trim();
        if (!trimmed) {
            setScanError('Masukkan atau scan kode QR meja.');
            return;
        }

        const found = tables.find(
            (t) => t.kode_qr.toUpperCase() === trimmed.toUpperCase()
                || t.nomor_meja.toLowerCase() === trimmed.toLowerCase()
        );

        if (found) {
            setScannedTable(found);
            setScanError('');
        } else {
            setScanError('Kode QR meja tidak valid atau meja tidak terdaftar.');
        }
    };

    const handleSimulateCameraScan = (table) => {
        setSimulatingScan(true);
        setScanError('');
        setTimeout(() => {
            setSimulatingScan(false);
            setScannedTable(table);
        }, 800);
    };

    const resetScan = () => {
        setScannedTable(null);
        setCart([]);
        setManualCode('');
        setScanError('');
    };

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchCat = !activeCategory || p.id_kategori === activeCategory;
            const q = search.trim().toLowerCase();
            const matchSearch = !q
                || p.nama_produk.toLowerCase().includes(q)
                || p.nama_kategori.toLowerCase().includes(q);
            return matchCat && matchSearch;
        });
    }, [products, activeCategory, search]);

    const getQty = (nama) => cart.find((i) => i.nama_produk === nama)?.qty || 0;

    const addToCart = (product) => {
        if (product.stok <= 0) return;
        setCart((prev) => {
            const found = prev.find((i) => i.nama_produk === product.nama_produk);
            if (found) {
                if (found.qty >= product.stok) return prev;
                return prev.map((i) =>
                    i.nama_produk === product.nama_produk ? { ...i, qty: i.qty + 1 } : i
                );
            }
            return [
                ...prev,
                {
                    nama_produk: product.nama_produk,
                    harga: Number(product.harga),
                    qty: 1,
                    stok: product.stok,
                    image: product.image,
                },
            ];
        });
    };

    const updateQty = (nama, delta) => {
        setCart((prev) =>
            prev
                .map((i) => {
                    if (i.nama_produk !== nama) return i;
                    const nextQty = i.qty + delta;
                    if (nextQty > i.stok) return i;
                    return { ...i, qty: nextQty };
                })
                .filter((i) => i.qty > 0)
        );
    };

    const subtotal = cart.reduce((sum, i) => sum + i.harga * i.qty, 0);
    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);

    const handleCheckout = () => {
        if (cart.length === 0 || !scannedTable || processing) return;
        setProcessing(true);
        router.post(
            '/checkout',
            {
                order_type: 'dine_in',
                id_meja: scannedTable.id_meja,
                payment_method: paymentMethod,
                notes,
                items: cart.map((i) => ({ nama_produk: i.nama_produk, qty: i.qty })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCart([]);
                    setNotes('');
                    setCartOpen(false);
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <PelangganLayout
            activePage="dine-in"
            title="Dine In"
            subtitle={scannedTable ? `Menu Aktif di ${scannedTable.nomor_meja}` : 'Scan QR di meja untuk membuka menu'}
            customer={customer}
            walletBalance={walletBalance}
        >
            <Head title="Food Order Dine In - Scan Meja" />

            <div className="space-y-4">
                {/* STEP 1: SCANNER VIEW (Sebelum QR meja di-scan) */}
                {!scannedTable ? (
                    <div className="space-y-4">
                        {/* Scanner Viewfinder Card */}
                        <div className="relative overflow-hidden rounded-[26px] bg-ink p-6 text-white shadow-lg">
                            <div className="text-center">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-[11px] font-bold text-primary">
                                    <Camera className="h-3.5 w-3.5" />
                                    Scan QR Meja Dine In
                                </span>
                                <h2 className="mt-3 font-display text-xl font-bold tracking-tight">
                                    Arahkan Kamera ke QR di Meja
                                </h2>
                                <p className="mt-1 text-[12px] text-white/70">
                                    Setelah QR Code meja terverifikasi, daftar menu restoran akan terbuka otomatis.
                                </p>
                            </div>

                            {/* Viewfinder Graphic */}
                            <div className="relative mx-auto my-6 flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-dashed border-primary/60 bg-white/5">
                                {/* Corners */}
                                <div className="absolute left-2 top-2 h-5 w-5 border-l-3 border-t-3 border-primary" />
                                <div className="absolute right-2 top-2 h-5 w-5 border-r-3 border-t-3 border-primary" />
                                <div className="absolute bottom-2 left-2 h-5 w-5 border-b-3 border-l-3 border-primary" />
                                <div className="absolute bottom-2 right-2 h-5 w-5 border-b-3 border-r-3 border-primary" />

                                {simulatingScan ? (
                                    <div className="flex flex-col items-center gap-2 text-primary">
                                        <RefreshCw className="h-9 w-9 animate-spin" />
                                        <span className="text-[12px] font-bold">Memindai QR...</span>
                                    </div>
                                ) : (
                                    <QrCode className="h-24 w-24 text-white/30" strokeWidth={1.5} />
                                )}

                                {/* Animated Laser Line */}
                                <div className="pointer-events-none absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_#F5A623]" />
                            </div>

                            {scanError && (
                                <div className="mb-3 flex items-center justify-center gap-1.5 rounded-xl bg-red-500/20 p-2.5 text-[11.5px] font-semibold text-red-200">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{scanError}</span>
                                </div>
                            )}

                            {/* Quick Tap Table Options (Simulasi scan dari meja) */}
                            <div>
                                <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-white/50">
                                    Atau pilih meja tempat Anda duduk:
                                </p>
                                <div className="mt-2.5 grid grid-cols-3 gap-2">
                                    {tables.map((table) => (
                                        <button
                                            key={table.id_meja}
                                            type="button"
                                            onClick={() => handleSimulateCameraScan(table)}
                                            className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-2 transition hover:border-primary hover:bg-white/10 active:scale-95"
                                        >
                                            <span className="font-display text-[12px] font-bold text-white">
                                                {table.nomor_meja}
                                            </span>
                                            <span className="text-[9.5px] text-white/50">
                                                {table.kapasitas} kursi
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Manual QR Input Fallback */}
                        <div className="rounded-[22px] border border-line bg-white p-4">
                            <label className="text-[11.5px] font-semibold text-ink">
                                Input Manual Kode QR / Nomor Meja
                            </label>
                            <div className="mt-1.5 flex gap-2">
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Contoh: Meja 01 atau TBL-..."
                                    className="flex-1 rounded-xl border border-line bg-cream/50 px-3 py-2 text-[12.5px] outline-none focus:border-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleVerifyCode(manualCode)}
                                    className="rounded-xl bg-primary px-4 py-2 text-[12px] font-bold text-ink hover:bg-primary-hover active:scale-95"
                                >
                                    Verifikasi
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* STEP 2: SCANNED SUCCESS & MENU REVEALED */
                    <div className="space-y-4">
                        {/* Verified Table Banner */}
                        <div className="flex items-center justify-between rounded-[22px] bg-emerald-500 p-4 text-white shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
                                    <CheckCircle2 className="h-6 w-6" />
                                </span>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-display text-[15px] font-bold">
                                            {scannedTable.nomor_meja}
                                        </span>
                                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9.5px] font-bold">
                                            Terverifikasi
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-white/80">
                                        Kapasitas {scannedTable.kapasitas} orang{scannedTable.catatan ? ` · ${scannedTable.catatan}` : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={resetScan}
                                className="inline-flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/30 active:scale-95"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Ganti</span>
                            </button>
                        </div>

                        {/* Search & Categories */}
                        <div className="space-y-2.5">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari menu dine in..."
                                    className="w-full rounded-2xl border border-line bg-white py-2 pl-9 pr-3 text-[12.5px] text-ink outline-none focus:border-primary"
                                />
                            </div>

                            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveCategory(null)}
                                    className={`shrink-0 rounded-full px-3.5 py-1 text-[11.5px] font-semibold transition ${
                                        activeCategory === null
                                            ? 'bg-ink text-white'
                                            : 'border border-line bg-white text-ink-soft'
                                    }`}
                                >
                                    Semua
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id_kategori}
                                        type="button"
                                        onClick={() => setActiveCategory(cat.id_kategori)}
                                        className={`shrink-0 rounded-full px-3.5 py-1 text-[11.5px] font-semibold transition ${
                                            activeCategory === cat.id_kategori
                                                ? 'bg-primary font-bold text-ink'
                                                : 'border border-line bg-white text-ink-soft'
                                        }`}
                                    >
                                        {cat.nama_kategori}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2-Column Mobile Product Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {filteredProducts.map((product) => {
                                const qty = getQty(product.nama_produk);
                                const outOfStock = product.stok <= 0;
                                return (
                                    <div
                                        key={product.id_produk}
                                        className="flex flex-col justify-between overflow-hidden rounded-[20px] border border-line bg-white transition hover:border-primary"
                                    >
                                        <div className="relative h-28 w-full overflow-hidden bg-muted">
                                            <img
                                                src={product.image}
                                                alt={product.nama_produk}
                                                className="h-full w-full object-cover"
                                            />
                                            <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9.5px] font-bold text-ink">
                                                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                                {product.rating}
                                            </span>
                                        </div>

                                        <div className="flex flex-1 flex-col justify-between p-2.5">
                                            <div>
                                                <p className="truncate font-display text-[12.5px] font-bold text-ink">
                                                    {product.nama_produk}
                                                </p>
                                                <p className="mt-0.5 text-[12px] font-bold text-primary-deep">
                                                    {money(product.harga)}
                                                </p>
                                            </div>

                                            <div className="mt-2.5">
                                                {qty === 0 ? (
                                                    <button
                                                        type="button"
                                                        disabled={outOfStock}
                                                        onClick={() => addToCart(product)}
                                                        className="flex w-full items-center justify-center gap-1 rounded-xl bg-primary py-1.5 text-[11px] font-bold text-ink hover:bg-primary-hover active:scale-95 disabled:opacity-40"
                                                    >
                                                        <Plus className="h-3 w-3" strokeWidth={3} />
                                                        <span>Tambah</span>
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-between rounded-xl bg-ink p-1 text-white">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQty(product.nama_produk, -1)}
                                                            className="grid h-6 w-6 place-items-center rounded-lg bg-white/10"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="text-[11.5px] font-bold">{qty}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQty(product.nama_produk, 1)}
                                                            className="grid h-6 w-6 place-items-center rounded-lg bg-primary text-ink"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* FLOATING CART BAR FOR MOBILE (When table scanned & cart has items) */}
            {scannedTable && cart.length > 0 && (
                <div className="fixed bottom-24 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 print:hidden">
                    <button
                        type="button"
                        onClick={() => setCartOpen(true)}
                        className="flex w-full items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white shadow-xl transition active:scale-95"
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary font-bold text-ink">
                                {totalItems}
                            </span>
                            <div className="text-left">
                                <p className="text-[11px] text-white/60">Pesanan di {scannedTable.nomor_meja}</p>
                                <p className="font-display text-[14px] font-bold text-primary">
                                    {money(subtotal)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[12px] font-bold text-white">
                            <span>Lihat Keranjang</span>
                            <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                    </button>
                </div>
            )}

            {/* MOBILE CART BOTTOM DRAWER */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60">
                    <div
                        className="flex-1"
                        onClick={() => setCartOpen(false)}
                    />
                    <div className="mx-auto w-full max-w-[480px] rounded-t-[28px] bg-white p-5 shadow-2xl animate-[slideUp_0.2s_ease-out]">
                        <div className="flex items-center justify-between border-b border-line pb-3">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-primary-deep" />
                                <h3 className="font-display text-[15px] font-bold text-ink">
                                    Keranjang {scannedTable?.nomor_meja}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCartOpen(false)}
                                className="text-[12px] font-semibold text-ink-soft"
                            >
                                Tutup
                            </button>
                        </div>

                        {/* Items list */}
                        <div className="my-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
                            {cart.map((item) => (
                                <div key={item.nama_produk} className="flex items-center gap-2 rounded-xl bg-cream p-2">
                                    <img
                                        src={item.image}
                                        alt={item.nama_produk}
                                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[12px] font-bold text-ink">{item.nama_produk}</p>
                                        <p className="text-[11px] font-semibold text-primary-deep">
                                            {money(item.harga * item.qty)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => updateQty(item.nama_produk, -1)}
                                            className="grid h-6 w-6 place-items-center rounded-md bg-white border border-line"
                                        >
                                            {item.qty === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                                        </button>
                                        <span className="w-4 text-center text-[11px] font-bold">{item.qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => updateQty(item.nama_produk, 1)}
                                            className="grid h-6 w-6 place-items-center rounded-md bg-ink text-white"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Notes */}
                        <div className="mb-3">
                            <label className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-soft">
                                <StickyNote className="h-3 w-3" /> Catatan untuk Dapur
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Misal: tidak pedas, es dipisah..."
                                className="mt-1 w-full rounded-xl border border-line bg-cream/50 px-3 py-1.5 text-[11.5px] outline-none"
                            />
                        </div>

                        {/* Payment method */}
                        <div className="mb-3">
                            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-soft">
                                Pembayaran
                            </p>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('gomeal_pay')}
                                    className={`rounded-xl border p-2 text-center text-[11px] font-bold ${
                                        paymentMethod === 'gomeal_pay'
                                            ? 'border-primary bg-primary-subtle text-ink'
                                            : 'border-line bg-white text-ink-soft'
                                    }`}
                                >
                                    GoMeal Pay ({money(walletBalance)})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('tunai')}
                                    className={`rounded-xl border p-2 text-center text-[11px] font-bold ${
                                        paymentMethod === 'tunai'
                                            ? 'border-primary bg-primary-subtle text-ink'
                                            : 'border-line bg-white text-ink-soft'
                                    }`}
                                >
                                    Bayar di Kasir
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            disabled={cart.length === 0 || processing}
                            onClick={handleCheckout}
                            className="w-full rounded-xl bg-primary py-3 text-[13px] font-bold text-ink transition hover:bg-primary-hover active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Mengirim ke Dapur...' : `Kirim Pesanan ke Dapur · ${money(subtotal)}`}
                        </button>
                    </div>
                </div>
            )}
        </PelangganLayout>
    );
}
