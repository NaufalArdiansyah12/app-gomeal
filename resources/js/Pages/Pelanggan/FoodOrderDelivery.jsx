import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    Bike, Search, Star, Plus, Minus, ShoppingBag,
    Trash2, MapPin, Tag, Utensils, Landmark, QrCode, ArrowRight,
} from 'lucide-react';
import PelangganLayout, { money } from './PelangganLayout';

export default function FoodOrderDelivery({
    customer,
    walletBalance,
    address,
    categories = [],
    products = [],
    serviceCities = [],
    deliveryFee = 10000,
}) {
    const [activeCategory, setActiveCategory] = useState(null);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [coupon, setCoupon] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponMsg, setCouponMsg] = useState(null);
    const [noCutlery, setNoCutlery] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('qris');
    const [notes, setNotes] = useState('');
    const initialAddress = typeof address === 'string'
        ? address
        : [address?.street, address?.city].filter(Boolean).join(', ');
    const [deliveryAddress, setDeliveryAddress] = useState(initialAddress);
    const [processing, setProcessing] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [justAddedId, setJustAddedId] = useState(null);
    const [cartPulseKey, setCartPulseKey] = useState(0);

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
        setJustAddedId(product.id_produk);
        setCartPulseKey((k) => k + 1);
        setTimeout(() => setJustAddedId((id) => (id === product.id_produk ? null : id)), 320);

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
        if (delta > 0) setCartPulseKey((k) => k + 1);
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

    const applyCoupon = () => {
        const code = coupon.trim().toUpperCase();
        if (code === 'DISKON50') {
            setDiscount(50);
            setCouponMsg({ type: 'success', text: 'Diskon 50% berhasil dipasang!' });
        } else if (code === 'HEMAT20') {
            setDiscount(20);
            setCouponMsg({ type: 'success', text: 'Diskon 20% berhasil dipasang!' });
        } else {
            setDiscount(0);
            setCouponMsg({ type: 'error', text: 'Kupon tidak valid.' });
        }
    };

    const subtotal = cart.reduce((sum, i) => sum + i.harga * i.qty, 0);
    const discountAmount = Math.round((subtotal * discount) / 100);
    const total = Math.max(0, subtotal - discountAmount + (cart.length > 0 ? deliveryFee : 0));
    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);

    const handleCheckout = () => {
        if (cart.length === 0 || processing) return;
        setProcessing(true);
        router.post(
            '/checkout',
            {
                order_type: 'delivery',
                delivery_address: deliveryAddress,
                coupon: discount > 0 ? coupon : null,
                no_cutlery: noCutlery,
                notes,
                payment_method: paymentMethod,
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
            activePage="delivery"
            title="Delivery"
            subtitle="Pesan makanan antar langsung ke alamat Anda"
            customer={customer}
            walletBalance={walletBalance}
        >
            <Head title="Food Order Delivery" />

            <div className="space-y-4 animate-page-enter">
                {/* Alamat Pengantaran */}
                <section className="rounded-[22px] border border-line bg-white p-3.5">
                    <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-subtle text-primary-deep">
                            <MapPin className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-soft">
                                Alamat Pengantaran
                            </p>
                            <input
                                type="text"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                placeholder="Masukkan alamat lengkap pengantaran..."
                                className="mt-0.5 w-full truncate text-[12.5px] font-bold text-ink outline-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Search & Categories */}
                <div className="space-y-2.5">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari burger, pizza, jus..."
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
                <section className="grid grid-cols-2 gap-3">
                    {filteredProducts.map((product, idx) => {
                        const qty = getQty(product.nama_produk);
                        const outOfStock = product.stok <= 0;
                        const isJustAdded = justAddedId === product.id_produk;
                        return (
                            <div
                                key={product.id_produk}
                                style={{ animationDelay: `${Math.min(idx, 7) * 40}ms` }}
                                className={`animate-page-enter group flex flex-col justify-between overflow-hidden rounded-[20px] border bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md ${
                                    isJustAdded
                                        ? 'scale-[0.97] border-primary ring-2 ring-primary/40 shadow-md'
                                        : 'border-line'
                                }`}
                            >
                                <div className="relative h-28 w-full overflow-hidden bg-muted">
                                    <img
                                        src={product.image}
                                        alt={product.nama_produk}
                                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                    />
                                    <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9.5px] font-bold text-ink backdrop-blur-xs">
                                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                        {product.rating}
                                    </span>
                                    {qty > 0 && (
                                        <span
                                            key={`${product.id_produk}-${qty}`}
                                            className="animate-pop-badge absolute right-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-ink shadow-sm"
                                        >
                                            {qty}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col justify-between p-2.5">
                                    <div>
                                        <h4 className="truncate font-display text-[12.5px] font-bold text-ink">
                                            {product.nama_produk}
                                        </h4>
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
                                                className="flex w-full items-center justify-center gap-1 rounded-xl bg-primary py-1.5 text-[11px] font-bold text-ink transition-all duration-200 hover:bg-primary-hover active:scale-95 disabled:opacity-40"
                                            >
                                                <Plus className="h-3 w-3" strokeWidth={3} />
                                                <span>Tambah</span>
                                            </button>
                                        ) : (
                                            <div className="animate-pop-badge flex items-center justify-between rounded-xl bg-ink p-1 text-white">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(product.nama_produk, -1)}
                                                    className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20 active:scale-90"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span key={qty} className="animate-pop-badge text-[11.5px] font-bold">
                                                    {qty}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(product.nama_produk, 1)}
                                                    className="grid h-6 w-6 place-items-center rounded-lg bg-primary text-ink transition hover:bg-primary-hover active:scale-90"
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
                </section>
            </div>

            {/* Floating Mobile Cart Bar */}
            {cart.length > 0 && (
                <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 print:hidden">
                    <button
                        type="button"
                        onClick={() => setCartOpen(true)}
                        className="animate-float-bar pointer-events-auto flex w-full items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white shadow-xl transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-2.5">
                            <span
                                key={cartPulseKey}
                                className="animate-pop-badge grid h-8 w-8 place-items-center rounded-xl bg-primary font-bold text-ink"
                            >
                                {totalItems}
                            </span>
                            <div className="text-left">
                                <p className="text-[10.5px] text-white/60">Delivery Order</p>
                                <p className="font-display text-[14px] font-bold text-primary">
                                    {money(total)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[12px] font-bold">
                            <span>Checkout</span>
                            <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                    </button>
                </div>
            )}

            {/* Mobile Cart Drawer */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-[2px] transition-opacity duration-200">
                    <div className="flex-1" onClick={() => setCartOpen(false)} />
                    <div className="animate-drawer-up mx-auto w-full max-w-[480px] rounded-t-[28px] bg-white p-5 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-line pb-3">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-primary-deep" />
                                <h3 className="font-display text-[15px] font-bold text-ink">
                                    Keranjang Delivery
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
                        <div className="my-3 max-h-[190px] space-y-2 overflow-y-auto pr-1">
                            {cart.map((item) => (
                                <div key={item.nama_produk} className="flex items-center gap-2 rounded-xl bg-cream p-2">
                                    <img src={item.image} alt={item.nama_produk} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[12px] font-bold text-ink">{item.nama_produk}</p>
                                        <p className="text-[11px] font-semibold text-primary-deep">{money(item.harga * item.qty)}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button type="button" onClick={() => updateQty(item.nama_produk, -1)} className="grid h-6 w-6 place-items-center rounded-md border border-line bg-white">
                                            {item.qty === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                                        </button>
                                        <span className="w-4 text-center text-[11px] font-bold">{item.qty}</span>
                                        <button type="button" onClick={() => updateQty(item.nama_produk, 1)} className="grid h-6 w-6 place-items-center rounded-md bg-ink text-white">
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Coupon */}
                        <div className="mb-2.5">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={coupon}
                                    onChange={(e) => setCoupon(e.target.value)}
                                    placeholder="Kode kupon: DISKON50 / HEMAT20"
                                    className="flex-1 rounded-xl border border-line bg-cream/50 px-3 py-1.5 text-[11.5px] uppercase outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={applyCoupon}
                                    className="rounded-xl bg-ink px-3 py-1.5 text-[11px] font-bold text-white"
                                >
                                    Pasang
                                </button>
                            </div>
                            {couponMsg && (
                                <p className={`mt-1 text-[10.5px] ${couponMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {couponMsg.text}
                                </p>
                            )}
                        </div>

                        {/* Cutlery checkbox */}
                        <label className="mb-3 flex items-center gap-2 text-[11px] text-ink">
                            <input
                                type="checkbox"
                                checked={noCutlery}
                                onChange={(e) => setNoCutlery(e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-line text-primary focus:ring-0"
                            />
                            <span>Tanpa alat makan (ramah lingkungan)</span>
                        </label>

                        {/* Summary breakdown */}
                        <div className="mb-3 space-y-1 border-t border-line pt-2 text-[11.5px]">
                            <div className="flex justify-between text-ink-soft">
                                <span>Subtotal</span>
                                <span>{money(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Diskon ({discount}%)</span>
                                    <span>-{money(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-ink-soft">
                                <span>Ongkos Kirim</span>
                                <span>{money(deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between font-display text-[13.5px] font-bold text-ink">
                                <span>Total</span>
                                <span className="text-primary-deep">{money(total)}</span>
                            </div>
                        </div>

                        {/* Payment method */}
                        <div className="mb-3 grid grid-cols-3 gap-1.5">
                            {[
                                { key: 'qris', label: 'QRIS', icon: QrCode },
                                { key: 'bca', label: 'VA BCA', icon: Landmark },
                                { key: 'bri', label: 'VA BRI', icon: Landmark },
                            ].map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setPaymentMethod(key)}
                                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-bold ${
                                        paymentMethod === key
                                            ? 'border-primary bg-primary-subtle text-ink'
                                            : 'border-line bg-white text-ink-soft'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            disabled={cart.length === 0 || processing}
                            onClick={handleCheckout}
                            className="w-full rounded-xl bg-primary py-3 text-[13px] font-bold text-ink active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Memproses Pesanan...' : `Pesan Antar Sekarang · ${money(total)}`}
                        </button>
                    </div>
                </div>
            )}
        </PelangganLayout>
    );
}
