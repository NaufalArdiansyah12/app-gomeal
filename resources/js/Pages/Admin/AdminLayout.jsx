import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, ShoppingCart, UtensilsCrossed, FileText,
    Boxes, History, LogOut, CheckCircle, AlertCircle, X, Menu,
    ShieldCheck, Bell, ExternalLink, ArrowRight, Sparkles, Database,
    QrCode, Users, Tags, CalendarClock,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AdminLayout({ activePage, title, subtitle, children }) {
    const { username, userRole, flash } = usePage().props;
    const isKasir = userRole === 'kasir';
    const [toast, setToast] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) setToast({ type: 'success', text: flash.success });
        if (flash?.error) setToast({ type: 'error', text: flash.error });
    }, [flash]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const navItems = isKasir
        ? [
            { key: 'transaksi', label: 'Kasir (POS)', icon: ShoppingCart, href: '/admin/transaksi' },
            { key: 'order-makanan', label: 'Order Makanan', icon: UtensilsCrossed, href: '/admin/order-makanan' },
            { key: 'riwayat', label: 'Riwayat Transaksi', icon: History, href: '/admin/riwayat' },
            { key: 'pelanggan', label: 'Data Pelanggan', icon: Users, href: '/admin/pelanggan' },
        ]
        : [
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
            { key: 'produk', label: 'Produk', icon: UtensilsCrossed, href: '/admin/produk' },
            { key: 'kategori', label: 'Kategori', icon: Tags, href: '/admin/kategori' },
            { key: 'shift', label: 'Atur Shift Kasir', icon: CalendarClock, href: '/admin/shift' },
            { key: 'meja', label: 'Meja & QR', icon: QrCode, href: '/admin/meja' },
            { key: 'stok', label: 'Stok & Inventori', icon: Boxes, href: '/admin/stok' },
            { key: 'riwayat', label: 'Riwayat Transaksi', icon: History, href: '/admin/riwayat' },
            { key: 'pelanggan', label: 'Data Pelanggan', icon: Users, href: '/admin/pelanggan' },
            { key: 'laporan', label: 'Laporan', icon: FileText, href: '/admin/laporan' },
        ];

    return (
        <div className="flex min-h-screen w-full bg-cream font-body text-ink antialiased">
            {/* Toast Notification */}
            {toast && (
                <div className="pointer-events-none fixed bottom-8 left-1/2 z-60 -translate-x-1/2 animate-[toastIn_0.24s_ease-out]">
                    <div className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)] ${
                        toast.type === 'success' ? 'bg-ink' : 'bg-red-600'
                    }`}>
                        {toast.type === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-primary" strokeWidth={2.5} />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-white" strokeWidth={2.5} />
                        )}
                        <span>{toast.text}</span>
                    </div>
                </div>
            )}

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
            <aside className={`fixed inset-y-0 left-0 z-50 w-[270px] transform overflow-y-auto bg-ink p-5 text-white transition-transform duration-300 ease-in-out lg:hidden ${
                mobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-1.5">
                        <span className="font-display text-xl font-bold tracking-tight text-white">GoMeal<span className="text-primary">.</span></span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase ${isKasir ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                            {isKasir ? 'Kasir' : 'Admin'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                    >
                        <X className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                </div>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    {isKasir ? 'Menu Kasir' : 'Menu Admin'}
                </p>
                <nav className="mt-2.5 space-y-1">
                    {navItems.map(({ key, label, icon: Icon, href }) => {
                        const isActive = activePage === key;
                        return (
                            <Link
                                key={key}
                                href={href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] transition active:scale-95 ${
                                    isActive
                                        ? 'bg-primary font-semibold text-ink shadow-sm'
                                        : 'font-medium text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Icon style={{ width: 18, height: 18 }} strokeWidth={2.5} />
                                <span>{label}</span>
                                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ink" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-[#FFC94A] p-4 text-ink">
                    <p className="text-[12px] font-semibold leading-snug">Database: db_tokokita</p>
                    <p className="mt-0.5 text-[10px] text-ink/75">MariaDB Advanced SQL</p>
                    <Link
                        href="/"
                        className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-ink py-1.5 text-[10.5px] font-semibold text-white transition hover:opacity-90 active:scale-95"
                    >
                        <span>Lihat POS Pelanggan</span>
                        <ArrowRight className="h-3 w-3 text-primary" />
                    </Link>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-[12px] font-semibold text-white">{username || (isKasir ? 'Kasir' : 'Admin')}</p>
                        <p className="text-[9.5px] text-white/40">{isKasir ? 'Kasir' : 'Administrator'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/50 hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </aside>

            {/* Desktop Full-Height Edge-to-Edge Sidebar */}
            <aside className="sticky top-0 hidden h-screen w-[240px] xl:w-[260px] shrink-0 flex-col justify-between overflow-y-auto bg-ink p-5 text-white lg:flex no-scrollbar border-r border-white/5 print:hidden">
                <div>
                    {/* Brand Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <span className="font-display text-[21px] font-bold tracking-tight text-white">
                            GoMeal<span className="text-primary">.</span>
                        </span>
                        <span className={`grid h-6 place-items-center rounded-full px-2 text-[9px] font-bold uppercase tracking-wider ${isKasir ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                            {isKasir ? 'Kasir' : 'Admin'}
                        </span>
                    </div>

                    <p className="mt-6 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-white/35">
                        {isKasir ? 'Menu Kasir' : 'Menu Admin'}
                    </p>

                    {/* 5 Menus */}
                    <nav className="mt-2.5 space-y-1">
                        {navItems.map(({ key, label, icon: Icon, href }) => {
                            const isActive = activePage === key;
                            return (
                                <Link
                                    key={key}
                                    href={href}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] transition active:scale-95 ${
                                        isActive
                                            ? 'bg-primary font-semibold text-ink shadow-sm'
                                            : 'font-medium text-white/60 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <Icon style={{ width: 18, height: 18 }} strokeWidth={2.5} />
                                    <span>{label}</span>
                                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ink" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Database Engine Info Box */}
                </div>

                {/* Profile Card at Bottom */}
                <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2.5 rounded-2xl bg-white/5 p-2.5">
                        <img
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(username || 'Admin')}`}
                            alt="Admin"
                            className="h-8 w-8 rounded-full bg-white/10 object-cover"
                        />
                        <div className="min-w-0">
                            <p className="truncate text-[11.5px] font-semibold text-white">{username || (isKasir ? 'Kasir' : 'Admin')}</p>
                            <p className="truncate text-[9.5px] text-white/45">{isKasir ? 'Kasir' : 'Administrator'}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.post('/logout')}
                            title="Logout"
                            className="ml-auto grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/40 transition hover:bg-white/20 hover:text-white active:scale-95"
                        >
                            <LogOut className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area (Full Width & Responsive Screen Fit) */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen">
                {/* Mobile Top Bar */}
                <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Toggle Menu"
                        className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white transition hover:opacity-90 active:scale-95"
                    >
                        <Menu className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-1.5">
                        <span className="font-display text-xl font-bold tracking-tight text-ink">GoMeal<span className="text-primary">.</span></span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase ${isKasir ? 'bg-amber-500/15 text-amber-700' : 'bg-red-500/10 text-red-600'}`}>
                            {isKasir ? 'Kasir' : 'Admin'}
                        </span>
                    </div>
                    <Link
                        href="/"
                        title="Buka Menu Pelanggan"
                        className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink transition active:scale-95 shadow-sm"
                    >
                        <ExternalLink className="h-4 w-4 text-primary" strokeWidth={2.5} />
                    </Link>
                </header>

                {/* Main Viewport Content */}
                <main className="flex-1 w-full p-4 sm:p-5 lg:p-6 xl:p-8 space-y-5">
                    {/* Top Greeting & Header Bar */}
                    <section className="rounded-[22px] border border-line bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] print:hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">{isKasir ? 'Portal Kasir' : 'Admin Portal'}</p>
                                </div>
                                <h1 className="mt-0.5 font-display text-[22px] font-bold leading-tight tracking-tight text-ink sm:text-[24px]">
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="mt-0.5 text-[11.5px] text-ink-soft">{subtitle}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href="/"
                                    className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-line bg-muted/60 px-3.5 py-1.5 text-[11px] font-semibold text-ink transition hover:border-primary hover:bg-white active:scale-95"
                                >
                                    <ExternalLink className="h-3.5 w-3.5 text-primary" />
                                    <span>Tampilan Pelanggan</span>
                                </Link>

                                <div className="relative">
                                    <img
                                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(username || 'Admin')}`}
                                        alt="Admin"
                                        className="h-9 w-9 rounded-full bg-primary-subtle object-cover"
                                    />
                                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-white" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Page Content */}
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
