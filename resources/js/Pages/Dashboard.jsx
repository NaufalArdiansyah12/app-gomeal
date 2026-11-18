import { useState, useCallback, useEffect, useRef } from 'react';
import {
    LayoutDashboard, UtensilsCrossed, Heart, MessageSquare, History, Receipt,
    Settings, ChevronsUpDown, Sun, Moon, Search, Download, Bell, Share2,
    ArrowRight, Bike, ChevronRight, Star, Plus, Minus, ShoppingBag,
    ShoppingBasket, Wallet, MapPin, Leaf, Ticket, Check, X, Sparkles,
    Send, Menu, TrendingUp, Croissant, Sandwich, CupSoda, Drumstick, Pizza, Fish,
    LogOut,
} from 'lucide-react';
import { router, usePage, Link } from '@inertiajs/react';
import { PelangganBottomNav } from './Pelanggan/PelangganLayout';

const CATEGORY_ICONS = {
    Bakery: Croissant, Burger: Sandwich, Beverage: CupSoda,
    Chicken: Drumstick, Pizza: Pizza, Seafood: Fish,
};

const money = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

function Toast({ message, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 2200);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-60 -translate-x-1/2 xl:bottom-8 animate-[toastIn_0.24s_ease-out]">
            <div className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
                <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
                <span>{message}</span>
            </div>
        </div>
    );
}

function Sidebar({ customer, activeNav, setActiveNav }) {
    const navItems = [
        { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', href: '/' },
        { key: 'delivery', icon: Bike, label: 'Food Delivery', href: '/pelanggan/delivery' },
        { key: 'dine-in', icon: UtensilsCrossed, label: 'Food Dine In', href: '/pelanggan/dine-in' },
        { key: 'history', icon: History, label: 'Order History', href: '/pelanggan/history' },
        { key: 'bills', icon: Receipt, label: 'Pembayaran', href: '/pelanggan/pembayaran' },
    ];

    const circumference = 2 * Math.PI * 16;
    const offset = circumference - (customer.progress / 100) * circumference;

    return (
        <aside className="sticky top-0 hidden h-screen w-[240px] xl:w-[260px] shrink-0 flex-col justify-between overflow-y-auto bg-ink p-5 text-white lg:flex no-scrollbar border-r border-white/5">
            <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="font-display text-[21px] font-bold tracking-tight text-white">GoMeal<span className="text-primary">.</span></span>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[9px] font-bold text-white">v3</span>
                </div>

                <p className="mt-6 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-white/35">Menu</p>
                <nav className="mt-2.5 space-y-1">
                    {navItems.map(({ key, icon: Icon, label, badge, href }) => {
                        const isActive = activeNav === key;
                        const btnClass = `flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] transition active:scale-95 ${
                            isActive ? 'bg-primary font-semibold text-ink' : 'font-medium text-white/60 hover:bg-white/5 hover:text-white'
                        }`;
                        if (href && key !== 'dashboard') {
                            return (
                                <Link key={key} href={href} className={btnClass}>
                                    <Icon style={{ width: 18, height: 18 }} strokeWidth={2.5} />
                                    <span>{label}</span>
                                    {badge && <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white">{badge}</span>}
                                </Link>
                            );
                        }
                        return (
                            <button key={key} type="button"
                                onClick={() => setActiveNav(key)}
                                className={btnClass}
                            >
                                <Icon style={{ width: 18, height: 18 }} strokeWidth={2.5} />
                                <span>{label}</span>
                                {badge && <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white">{badge}</span>}
                                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ink" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-7 rounded-2xl bg-gradient-to-br from-primary to-[#FFC94A] p-3.5">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] font-semibold leading-snug text-ink">Upgrade your Account to Get Free Voucher</p>
                        <div className="relative shrink-0">
                            <svg width="40" height="40" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="4.5" />
                                <circle cx="20" cy="20" r="16" fill="none" stroke="#1A1A1A" strokeWidth="4.5"
                                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                                    transform="rotate(-90 20 20)" />
                            </svg>
                            <span className="absolute inset-0 grid place-items-center text-[9px] font-bold text-ink">{customer.progress}%</span>
                        </div>
                    </div>
                    <button type="button" className="mt-2.5 w-full rounded-full bg-ink py-1.5 text-[10.5px] font-semibold text-white transition hover:opacity-90 active:scale-95">Upgrade</button>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-2.5">
                    <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(customer.nama_pelanggan)}`} alt={customer.nama_pelanggan} className="h-8 w-8 rounded-full bg-white/10 object-cover" />
                    <div className="min-w-0">
                        <p className="truncate text-[11.5px] font-semibold text-white">{customer.nama_pelanggan}</p>
                        <p className="truncate text-[9.5px] text-white/45">{customer.tier}</p>
                    </div>
                    <button type="button" onClick={() => router.post('/logout')} title="Logout"
                        className="ml-auto grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/40 transition hover:bg-white/20 hover:text-white active:scale-95">
                        <LogOut className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <a href="/login" className="text-[10.5px] font-medium text-white/60 hover:text-primary transition inline-flex items-center gap-1">
                        <span>Ganti Akun / Login Admin</span> &rarr;
                    </a>
                </div>
            </div>
        </aside>
    );
}

function MobileSidebar({ open, onClose, customer, activeNav, setActiveNav }) {
    const navItems = [
        { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', href: '/' },
        { key: 'delivery', icon: Bike, label: 'Food Delivery', href: '/pelanggan/delivery' },
        { key: 'dine-in', icon: UtensilsCrossed, label: 'Food Dine In', href: '/pelanggan/dine-in' },
        { key: 'history', icon: History, label: 'Order History', href: '/pelanggan/history' },
        { key: 'bills', icon: Receipt, label: 'Pembayaran', href: '/pelanggan/pembayaran' },
    ];

    return (
        <>
            <div className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <aside className={`fixed inset-y-0 left-0 z-50 w-[264px] transform overflow-y-auto rounded-r-[24px] bg-ink p-5 text-white transition-transform duration-300 ease-in-out lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between">
                    <span className="font-display text-xl font-bold tracking-tight text-white">GoMeal<span className="text-primary">.</span></span>
                    <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95">
                        <X className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                </div>
                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Menu</p>
                <nav className="mt-2 space-y-1">
                    {navItems.map(({ key, icon: Icon, label, badge, href }) => {
                        const isActive = activeNav === key;
                        const btnClass = `flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] transition active:scale-95 ${
                            isActive ? 'bg-primary font-semibold text-ink' : 'font-medium text-white/60 hover:bg-white/5 hover:text-white'
                        }`;
                        if (href && key !== 'dashboard') {
                            return (
                                <Link key={key} href={href} onClick={onClose} className={btnClass}>
                                    <Icon style={{ width: 18, height: 18 }} strokeWidth={2.5} />
                                    <span>{label}</span>
                                    {badge && <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white">{badge}</span>}
                                </Link>
                            );
                        }
                        return (
                            <button key={key} type="button" onClick={() => { setActiveNav(key); onClose(); }}
                                className={btnClass}
                            >
                                <Icon style={{ width: 18, height: 18 }} strokeWidth={2.5} />
                                <span>{label}</span>
                                {badge && <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white">{badge}</span>}
                            </button>
                        );
                    })}
                </nav>
                <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#FFC94A] p-4">
                    <p className="text-[12.5px] font-semibold leading-snug text-ink">Upgrade your Account to Get Free Voucher</p>
                    <button type="button" className="mt-3 w-full rounded-full bg-ink py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90 active:scale-95">Upgrade</button>
                </div>
            </aside>
        </>
    );
}

function DishCard({ dish, onAdd, favorites, onToggleFav }) {
    const isFav = favorites.has(dish.nama_produk);
    return (
        <article className="group flex gap-3 rounded-[20px] border border-line bg-white p-3 transition hover:border-primary/60 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="relative shrink-0">
                <img src={dish.image} alt={dish.nama_produk} className="h-[92px] w-[92px] rounded-[16px] object-cover" loading="lazy" />
                <span className="absolute -left-1.5 -top-1.5 rounded-full bg-[#EF4444] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-[0_1px_2px_rgba(0,0,0,0.18)]">15%</span>
                <button type="button" onClick={() => onToggleFav(dish.nama_produk)}
                    className={`absolute -bottom-2 -right-2 grid h-7 w-7 place-items-center rounded-full border border-line bg-white transition hover:scale-105 active:scale-90 ${isFav ? 'text-[#EF4444]' : 'text-ink-soft'}`}
                >
                    <Heart className="h-3.5 w-3.5" strokeWidth={2.5} fill={isFav ? '#EF4444' : 'none'} />
                </button>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                <div>
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="truncate text-[13.5px] font-semibold text-ink">{dish.nama_produk}</h4>
                        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-ink-soft">{dish.time}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                        <Star className="h-3 w-3" strokeWidth={2.5} style={{ color: '#F5A623', fill: '#F5A623' }} />
                        <span className="text-[10.5px] font-semibold text-ink">{dish.rating}</span>
                        <span className="text-[10.5px] text-ink-soft">({dish.reviews})</span>
                    </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                    <p className="text-[15px] font-bold tabular-nums text-ink">{money(dish.harga)}</p>
                    <button type="button" onClick={() => onAdd(dish)}
                        disabled={dish.stok <= 0}
                        className="grid h-8 w-8 place-items-center rounded-full bg-primary text-ink transition hover:bg-primary-hover active:scale-90 disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </article>
    );
}

function RightPanel({ cart, setCart, walletBalance, address, customer, toast, coupon, setCoupon, noCutlery, setNoCutlery, onCheckout }) {
    const SERVICE_FEE = 1.00;
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const subtotal = cart.reduce((s, i) => s + i.harga * i.qty, 0);
    const total = subtotal > 0 ? subtotal + SERVICE_FEE : 0;

    const updateQty = (name, delta) => {
        setCart(prev => {
            const next = prev.map(i => i.nama_produk === name ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0);
            return next;
        });
    };

    return (
        <aside className="sticky top-0 hidden h-screen w-[320px] xl:w-[360px] shrink-0 flex-col overflow-y-auto border-l border-line bg-white p-5 shadow-sm no-scrollbar xl:flex">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Your Cart</p>
                    <p className="font-display text-[15px] font-semibold tracking-tight text-ink">Order Summary</p>
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-ink transition hover:bg-primary-subtle active:scale-95">
                        <Wallet className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                    <button type="button" className="relative grid h-8 w-8 place-items-center rounded-full text-ink transition hover:bg-primary-subtle active:scale-95">
                        <Bell className="h-4 w-4" strokeWidth={2.5} />
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
                    </button>
                    <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(customer.nama_pelanggan)}`} alt={customer.nama_pelanggan} className="ml-1 h-8 w-8 rounded-full bg-primary-subtle object-cover" />
                </div>
            </div>

            {/* Balance */}
            <h3 className="mt-4 font-display text-[13.5px] font-semibold tracking-tight text-ink">Your Balance</h3>
            <div className="relative mt-2 overflow-hidden rounded-[18px] bg-ink p-3.5 text-white">
                <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-primary/30 blur-2xl" />
                <div className="relative flex items-end justify-between">
                    <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/45">Available</p>
                        <p className="mt-0.5 font-display text-[20px] font-bold tabular-nums text-white">{money(walletBalance)}</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white">
                        <Sparkles className="h-3 w-3 text-primary" strokeWidth={2.5} /> Gold
                    </span>
                </div>
                <div className="relative mt-3 grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={() => router.post('/top-up', { amount: 20 })}
                        className="flex items-center justify-center gap-1 rounded-full bg-primary py-1.5 text-[10.5px] font-semibold text-ink transition hover:bg-primary-hover active:scale-95">
                        <Plus className="h-3 w-3" strokeWidth={2.5} /> Top Up
                    </button>
                    <button type="button"
                        className="flex items-center justify-center gap-1 rounded-full bg-white/10 py-1.5 text-[10.5px] font-semibold text-white transition hover:bg-white/20 active:scale-95">
                        <Send className="h-3 w-3" strokeWidth={2.5} /> Transfer
                    </button>
                </div>
            </div>

            {/* Address */}
            <div className="mt-4 flex items-center justify-between">
                <h3 className="font-display text-[13.5px] font-semibold tracking-tight text-ink">Your Address</h3>
                <button type="button" className="rounded-full bg-primary-subtle px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-primary-deep transition hover:opacity-80 active:scale-95">Change</button>
            </div>
            <div className="mt-2 flex items-start gap-2.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-subtle">
                    <MapPin className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                </span>
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink">{address.street}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-ink-soft">{address.detail}</p>
                    <div className="mt-2 flex gap-1.5">
                        <button type="button" className="rounded-[10px] border border-line px-2.5 py-1 text-[10px] font-medium text-ink transition hover:border-primary hover:text-primary-deep active:scale-95">Add Details</button>
                        <button type="button" className="rounded-[10px] border border-line px-2.5 py-1 text-[10px] font-medium text-ink transition hover:border-primary hover:text-primary-deep active:scale-95">Add Note</button>
                    </div>
                </div>
            </div>

            <div className="mt-4 h-px receipt-dash" />

            {/* Order Menu */}
            <div className="mt-3 flex items-center justify-between">
                <h3 className="font-display text-[13.5px] font-semibold tracking-tight text-ink">Order Menu</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[9.5px] font-semibold text-ink-soft">{count} {count === 1 ? 'item' : 'items'}</span>
            </div>
            <div className="mt-2 space-y-1.5">
                {cart.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-line px-3 py-6 text-center">
                        <ShoppingBasket className="mx-auto h-5 w-5 text-ink-soft" strokeWidth={2.5} />
                        <p className="mt-1.5 text-[11.5px] font-semibold text-ink-soft">Your cart is empty</p>
                        <p className="mt-0.5 text-[10px] text-ink-soft">Pick a dish to get started</p>
                    </div>
                ) : cart.map(item => (
                    <div key={item.nama_produk} className="flex items-center gap-2.5 rounded-xl px-1 py-1 transition hover:bg-primary-subtle/60">
                        <img src={item.image} alt={item.nama_produk} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[11.5px] font-semibold text-ink">{item.nama_produk}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <button type="button" onClick={() => updateQty(item.nama_produk, -1)}
                                    className="grid h-5 w-5 place-items-center rounded-full border border-line text-[11px] leading-none text-ink-soft transition hover:border-primary hover:text-ink active:scale-90">&minus;</button>
                                <span className="min-w-[10px] text-center text-[10px] font-semibold tabular-nums text-ink-soft">{item.qty}</span>
                                <button type="button" onClick={() => updateQty(item.nama_produk, 1)}
                                    className="grid h-5 w-5 place-items-center rounded-full border border-line text-[11px] leading-none text-ink-soft transition hover:border-primary hover:text-ink active:scale-90">+</button>
                            </div>
                        </div>
                        <span className="shrink-0 text-[11.5px] font-bold tabular-nums text-ink">{money(item.harga * item.qty)}</span>
                    </div>
                ))}
            </div>

            <div className="mt-3 h-px receipt-dash" />

            {/* Totals */}
            <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-ink-soft">Service</span>
                    <span className="font-semibold tabular-nums text-ink">+{money(SERVICE_FEE)}</span>
                </div>
                <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-ink-soft">Delivery</span>
                    <span className="font-semibold text-[#10B981]">Free</span>
                </div>
            </div>

            <div className="mt-2.5 h-px receipt-dash" />

            <div className="mt-2.5 flex items-end justify-between">
                <div>
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Total</p>
                    <p className="font-display text-[20px] font-bold tabular-nums leading-tight text-ink">{money(total)}</p>
                </div>
                <span className="mb-1 rounded-full bg-primary-subtle px-2 py-0.5 text-[9px] font-bold text-primary-deep">Incl. tax</span>
            </div>

            {/* Toggle */}
            <div className="mt-3 flex items-center justify-between rounded-[14px] border border-line px-3 py-2.5">
                <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" strokeWidth={2.5} />
                    <div>
                        <p className="text-[11.5px] font-semibold text-ink">No cutlery</p>
                        <p className="text-[9.5px] text-ink-soft">Save 1 plastic set</p>
                    </div>
                </div>
                <button type="button" role="switch" aria-checked={noCutlery}
                    onClick={() => { setNoCutlery(!noCutlery); toast(noCutlery ? 'Cutlery will be included' : 'No cutlery — thanks for saving plastic'); }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 active:scale-95 ${noCutlery ? 'bg-primary' : 'bg-[#DCDCDC]'}`}
                >
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ${noCutlery ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Coupon */}
            <div className="relative mt-2.5">
                <Ticket className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" strokeWidth={2.5} />
                <input type="text" placeholder="Have a coupon code?" value={coupon} onChange={e => setCoupon(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { toast(coupon ? `Coupon "${coupon.toUpperCase()}" applied` : 'Enter a coupon code first'); setCoupon(''); } }}
                    className="w-full rounded-full border border-line bg-muted/60 py-2.5 pl-10 pr-16 text-[11px] text-ink placeholder-ink-soft outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/40" />
                <button type="button"
                    onClick={() => { toast(coupon ? `Coupon "${coupon.toUpperCase()}" applied` : 'Enter a coupon code first'); setCoupon(''); }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-ink px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wide text-white transition hover:opacity-90 active:scale-95">Apply</button>
            </div>

            <button type="button" onClick={onCheckout}
                className="mt-2.5 w-full rounded-[12px] bg-primary py-3 text-[12.5px] font-semibold text-ink transition hover:bg-primary-hover active:scale-95">
                Checkout
            </button>
            <p className="mt-2 text-center text-[9.5px] text-ink-soft">Secure payment · GoMeal Pay protected</p>
        </aside>
    );
}

export default function Dashboard({
    customer, activeMeja, walletBalance, address, categories, products, popularDishes,
    recentOrders, recommendations, orderHistory, serviceCities, auditLogs,
}) {
    const { flash } = usePage().props;
    const [activeNav, setActiveNav] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [favorites, setFavorites] = useState(new Set());
    const [toastMsg, setToastMsg] = useState(null);
    const [coupon, setCoupon] = useState('');
    const [noCutlery, setNoCutlery] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const searchTimeout = useRef(null);

    useEffect(() => {
        if (flash?.success) { setToastMsg(flash.success); }
        if (flash?.error) { setToastMsg(flash.error); }
    }, [flash]);

    const showToast = useCallback((msg) => setToastMsg(msg), []);

    const addToCart = useCallback((dish) => {
        setCart(prev => {
            const exists = prev.find(i => i.nama_produk === dish.nama_produk);
            if (exists) {
                return prev.map(i => i.nama_produk === dish.nama_produk ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { nama_produk: dish.nama_produk, harga: Number(dish.harga), qty: 1, image: dish.image }];
        });
        showToast(`${dish.nama_produk} added to cart`);
    }, [showToast]);

    const toggleFav = useCallback((name) => {
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(name)) { next.delete(name); } else { next.add(name); }
            return next;
        });
    }, []);

    const handleCheckout = useCallback(() => {
        if (cart.length === 0) { showToast('Your cart is empty'); return; }
        router.post('/checkout', {
            items: cart.map(i => ({ nama_produk: i.nama_produk, qty: i.qty })),
            coupon_discount: 0,
            no_cutlery: noCutlery,
        }, {
            preserveScroll: true,
            onSuccess: () => setCart([]),
        });
    }, [cart, noCutlery, showToast]);

    const handleSearch = useCallback((value) => {
        setSearchQuery(value);
        if (searchTimeout.current) { clearTimeout(searchTimeout.current); }
        if (!value.trim()) { setSearchResults(null); return; }
        searchTimeout.current = setTimeout(() => {
            fetch(`/search?q=${encodeURIComponent(value)}`)
                .then(r => r.json())
                .then(data => setSearchResults(data.results));
        }, 300);
    }, []);

    const filteredProducts = activeCategory
        ? products.filter(p => p.id_kategori === activeCategory)
        : products;

    const displayDishes = popularDishes.length > 0 ? popularDishes : products.slice(0, 3);

    const cartCount = cart.reduce((s, i) => s + i.qty, 0);
    const cartTotal = cart.reduce((s, i) => s + i.harga * i.qty, 0) + (cart.length > 0 ? 1 : 0);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) { return { text: 'Good morning', Icon: Sun }; }
        if (hour < 18) { return { text: 'Good afternoon', Icon: Sun }; }
        return { text: 'Good evening', Icon: Moon };
    };
    const greeting = getGreeting();

    return (
        <div className="min-h-screen w-full bg-[#EFECE4] font-body text-ink antialiased">
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* Mobile App Shell */}
            <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-cream shadow-[0_0_40px_rgba(0,0,0,0.08)]">
                {/* Mobile Top Bar */}
                <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur">
                    <span className="font-display text-xl font-bold tracking-tight text-ink">
                        GoMeal<span className="text-primary">.</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Link
                            href="/pelanggan/pembayaran"
                            className="flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink shadow-2xs transition active:scale-95"
                        >
                            <Wallet className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                            <span>{money(walletBalance)}</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => router.post('/logout')}
                            title="Logout"
                            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-ink-soft transition hover:text-ink active:scale-95"
                        >
                            <LogOut className="h-3.5 w-3.5" strokeWidth={2.4} />
                        </button>
                    </div>
                </header>

                {/* Main Mobile Content Area */}
                <main className="min-w-0 flex-1 space-y-5 px-4 pt-4 pb-36">
                    {/* Greeting */}
                    <section className="rounded-[22px] border border-line bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <greeting.Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">{greeting.text}</p>
                                </div>
                                <h1 className="mt-0.5 font-display text-[21px] font-bold leading-tight tracking-tight text-ink">Hello, {customer.nama_pelanggan.split(' ')[0]}</h1>
                            </div>

                            <div className="ml-auto flex items-center gap-1">
                                <div className="relative">
                                    <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(customer.nama_pelanggan)}`} alt={customer.nama_pelanggan} className="h-9 w-9 rounded-full bg-primary-subtle object-cover" />
                                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-white" />
                                </div>
                            </div>

                            <div className="relative w-full">
                                <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2.5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/40">
                                    <Search className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                                    <input type="text" placeholder="What do you want eat today..." value={searchQuery} onChange={e => handleSearch(e.target.value)}
                                        className="w-full bg-transparent text-[13px] text-ink placeholder-ink-soft outline-none" />
                                </div>
                                {searchResults && searchResults.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-xl">
                                        {searchResults.map(r => (
                                            <button key={r.id_produk} type="button"
                                                onClick={() => { addToCart({ nama_produk: r.nama_produk, harga: r.harga, image: '' }); setSearchResults(null); setSearchQuery(''); }}
                                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-primary-subtle">
                                                <span className="text-[12px] font-medium text-ink">{r.nama_produk} <span className="text-ink-soft">({r.nama_kategori})</span></span>
                                                <span className="text-[12px] font-bold text-ink">{money(r.harga)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {activeMeja && (
                        <section className="flex items-center justify-between gap-3 rounded-[18px] border border-primary/40 bg-primary-subtle px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-ink font-display text-[13px] font-bold">
                                    QR
                                </span>
                                <div>
                                    <p className="text-[12.5px] font-bold text-ink">
                                        Memesan dari {activeMeja.nomor_meja}
                                    </p>
                                    <p className="text-[11px] text-ink-soft">
                                        Kode Meja: <span className="font-mono font-semibold text-ink">{activeMeja.kode_qr}</span>
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[10.5px] font-bold text-primary-deep">
                                Dine-In
                            </span>
                        </section>
                    )}

                    {/* Hero Banner */}
                    <div className="relative">
                        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-primary to-[#FFC94A] px-5 py-6 sm:px-7">
                            <div className="pointer-events-none absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'radial-gradient(#1A1A1A 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                            <div className="pointer-events-none absolute -right-16 -bottom-20 h-56 w-56 rounded-full bg-white/30 blur-2xl" />
                            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="max-w-sm">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white">Voucher</span>
                                        <span className="rounded-full bg-white/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-ink">Ends in 2 days</span>
                                    </div>
                                    <h2 className="mt-2.5 font-display text-[24px] font-bold leading-[1.12] tracking-tight text-ink sm:text-[30px]">
                                        Get Discount Voucher<br className="hidden sm:block" /> Up To 20%
                                    </h2>
                                    <p className="mt-2 max-w-[290px] text-[12px] leading-relaxed text-ink/70">
                                        Dengan gratis ongkir ke seluruh alamat untuk pesanan di atas Rp 50.000.
                                    </p>
                                    <div className="mt-3.5 flex items-center gap-2">
                                        <button type="button" onClick={() => showToast('Voucher claimed!')} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[11.5px] font-semibold text-white transition hover:opacity-90 active:scale-95">
                                            Claim now <ArrowRight className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                                        </button>
                                        <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-[11.5px] font-semibold text-ink transition hover:bg-white active:scale-95">
                                            See terms
                                        </button>
                                    </div>
                                </div>
                                <div className="relative shrink-0 self-end sm:self-auto">
                                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80" alt="Happy GoMeal customer" className="h-32 w-32 rounded-[26px] object-cover ring-4 ring-white/70 sm:h-40 sm:w-40" />
                                    <span className="absolute -left-4 -top-3 grid h-12 w-12 place-items-center rounded-full bg-white text-center text-[11px] font-bold leading-none text-ink shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
                                        20%<br /><span className="text-[8px] font-semibold text-primary">OFF</span>
                                    </span>
                                    <span className="absolute -bottom-3 -left-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-ink shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
                                        <Bike className="h-3 w-3 text-primary" strokeWidth={2.5} /> Free delivery
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Category */}
                    <section className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="font-display text-[17px] font-semibold tracking-tight text-ink">Category</h3>
                                <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-[9.5px] font-bold text-primary-deep">{categories.length} types</span>
                            </div>
                            <button type="button" onClick={() => setActiveCategory(null)} className="flex items-center gap-1 text-[11.5px] font-semibold text-ink transition hover:text-primary-deep active:scale-95">
                                View all <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {categories.map(cat => {
                                const isActive = activeCategory === cat.id_kategori;
                                const CatIcon = CATEGORY_ICONS[cat.nama_kategori] || Croissant;
                                return (
                                    <button key={cat.id_kategori} type="button"
                                        onClick={() => { setActiveCategory(isActive ? null : cat.id_kategori); showToast(isActive ? 'Showing all' : `${cat.nama_kategori} selected`); }}
                                        className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] transition active:scale-95 ${
                                            isActive ? 'bg-primary font-semibold text-ink' : 'border border-line font-medium text-ink-soft hover:border-primary hover:bg-primary-subtle hover:text-ink'
                                        }`}
                                    >
                                        <CatIcon className="h-4 w-4" strokeWidth={2.5} /> {cat.nama_kategori}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Popular Dishes */}
                    <section>
                        <div className="flex items-center justify-between px-0.5">
                            <div className="flex items-center gap-2">
                                <h3 className="font-display text-[17px] font-semibold tracking-tight text-ink">Popular Dishes</h3>
                                <span className="flex items-center gap-1 rounded-full bg-primary-subtle px-2 py-0.5 text-[9.5px] font-bold text-primary-deep">
                                    <TrendingUp className="h-3 w-3" strokeWidth={2.5} /> Trending
                                </span>
                            </div>
                            <button type="button" className="flex items-center gap-1 text-[11.5px] font-semibold text-ink transition hover:text-primary-deep active:scale-95">
                                View all <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            {(activeCategory ? filteredProducts.slice(0, 8) : displayDishes).map(dish => (
                                <DishCard key={dish.id_produk || dish.nama_produk} dish={dish} onAdd={addToCart} favorites={favorites} onToggleFav={toggleFav} />
                            ))}
                        </div>
                    </section>

                    {/* All Menu (when Food Order nav or category filtered) */}
                    {(activeNav === 'food' || activeCategory) && (
                        <section>
                            <div className="flex items-center justify-between px-0.5">
                                <h3 className="font-display text-[17px] font-semibold tracking-tight text-ink">All Menu</h3>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                {filteredProducts.map(dish => (
                                    <DishCard key={dish.id_produk} dish={dish} onAdd={addToCart} favorites={favorites} onToggleFav={toggleFav} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Recent Order */}
                    {recentOrders.length > 0 && (
                        <section className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
                            <div className="flex items-center justify-between">
                                <h3 className="font-display text-[17px] font-semibold tracking-tight text-ink">Recent Order</h3>
                                <button type="button" className="flex items-center gap-1 text-[11.5px] font-semibold text-ink transition hover:text-primary-deep active:scale-95">
                                    View all <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                                </button>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2.5">
                                {recentOrders.slice(0, 6).map(order => (
                                    <div key={order.nama_produk} className="group relative overflow-hidden rounded-[16px] bg-muted">
                                        <img src={order.image} alt={order.nama_produk} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                                        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink">Reordered {order.reorder_count}x</span>
                                        <button type="button" onClick={() => toggleFav(order.nama_produk)}
                                            className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 transition hover:scale-105 active:scale-90 ${favorites.has(order.nama_produk) ? 'text-[#EF4444]' : 'text-ink-soft'}`}
                                        >
                                            <Heart className="h-3.5 w-3.5" strokeWidth={2.5} fill={favorites.has(order.nama_produk) ? '#EF4444' : 'none'} />
                                        </button>
                                        <div className="p-2.5">
                                            <p className="truncate text-[11.5px] font-semibold text-ink">{order.nama_produk}</p>
                                            <p className="mt-0.5 text-[10px] font-bold tabular-nums text-primary-deep">{money(order.harga)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Order History (shown on history/bills nav) */}
                    {(activeNav === 'history' || activeNav === 'bills') && orderHistory.length > 0 && (
                        <section className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
                            <h3 className="font-display text-[17px] font-semibold tracking-tight text-ink">
                                {activeNav === 'history' ? 'Order History' : 'Bills'}
                            </h3>
                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-left text-[12px]">
                                    <thead>
                                        <tr className="border-b border-line text-ink-soft">
                                            <th className="pb-2 pr-4 font-semibold">ID</th>
                                            <th className="pb-2 pr-4 font-semibold">Date</th>
                                            <th className="pb-2 pr-4 font-semibold">Items</th>
                                            <th className="pb-2 font-semibold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderHistory.map(o => (
                                            <tr key={o.id_transaksi} className="border-b border-line/50">
                                                <td className="py-2.5 pr-4 tabular-nums font-semibold text-ink">#{o.id_transaksi}</td>
                                                <td className="py-2.5 pr-4 text-ink-soft">{o.tanggal}</td>
                                                <td className="py-2.5 pr-4 text-ink-soft">{o.item_names || '-'}</td>
                                                <td className="py-2.5 text-right font-bold tabular-nums text-ink">{money(o.total_belanja)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </main>
            </div>

            {/* Mobile Sticky Cart Bar (Above Bottom Nav) */}
            {cartCount > 0 && (
                <div className="fixed bottom-24 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-3 print:hidden">
                    <div className="flex items-center justify-between gap-3 rounded-[18px] bg-ink px-4 py-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
                        <div className="flex items-center gap-2.5">
                            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/10">
                                <ShoppingBag className="h-4 w-4 text-primary" strokeWidth={2.5} />
                                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[8.5px] font-bold text-ink">{cartCount}</span>
                            </span>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">Total</p>
                                <p className="font-display text-[15px] font-bold tabular-nums text-white">{money(cartTotal)}</p>
                            </div>
                        </div>
                        <button type="button" onClick={handleCheckout}
                            className="rounded-[12px] bg-primary px-5 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-primary-hover active:scale-95">
                            Checkout
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar */}
            <PelangganBottomNav activePage="dashboard" />
        </div>
    );
}
