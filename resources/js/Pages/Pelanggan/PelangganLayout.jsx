import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Bike, QrCode, History, Wallet,
    LogOut, CheckCircle, AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export const money = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

export function PelangganBottomNav({ activePage }) {
    const navItems = [
        { key: 'dashboard', label: 'Home', icon: LayoutDashboard, href: '/pelanggan/dashboard' },
        { key: 'delivery', label: 'Delivery', icon: Bike, href: '/pelanggan/delivery' },
        { key: 'dine-in', label: 'Dine In', icon: QrCode, href: '/pelanggan/dine-in' },
        { key: 'history', label: 'Riwayat', icon: History, href: '/pelanggan/history' },
        { key: 'pembayaran', label: 'Bayar', icon: Wallet, href: '/pelanggan/pembayaran' },
    ];

    return (
        <div className="pointer-events-none fixed bottom-3.5 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-3 pb-[env(safe-area-inset-bottom)] print:hidden">
            <nav
                aria-label="Navigasi Pelanggan"
                className="pointer-events-auto relative overflow-hidden rounded-[28px] border border-white/65 bg-white/55 p-1.5 shadow-[0_12px_36px_rgba(18,18,18,0.16),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(255,255,255,0.35)] backdrop-blur-2xl backdrop-saturate-200"
            >
                {/* Specular liquid glass top sheen */}
                <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                <div className="relative grid grid-cols-5 gap-1">
                    {navItems.map(({ key, label, icon: Icon, href }) => {
                        const isActive = activePage === key;
                        return (
                            <Link
                                key={key}
                                href={href}
                                className={`flex flex-col items-center justify-center gap-1 rounded-[22px] py-2 transition-all duration-200 active:scale-95 ${
                                    isActive
                                        ? 'bg-gradient-to-b from-primary/95 to-primary-hover/90 font-bold text-ink shadow-[0_4px_14px_rgba(245,166,35,0.38),inset_0_1px_1px_rgba(255,255,255,0.7)] ring-1 ring-white/55'
                                        : 'font-medium text-ink/70 hover:bg-white/45 hover:text-ink'
                                }`}
                            >
                                <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] leading-none tracking-tight">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

export default function PelangganLayout({
    activePage,
    title,
    subtitle,
    customer,
    walletBalance = 0,
    rightAction = null,
    children,
}) {
    const { flash } = usePage().props;
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (flash?.success) {
            setToast({ type: 'success', text: flash.success });
        } else if (flash?.error) {
            setToast({ type: 'error', text: flash.error });
        }
    }, [flash]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(timer);
    }, [toast]);

    return (
        <div className="min-h-screen w-full bg-[#EFECE4] font-body text-ink antialiased">
            {/* Toast Notification */}
            {toast && (
                <div className="pointer-events-none fixed left-1/2 top-4 z-60 w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2">
                    <div
                        className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-[12px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)] ${
                            toast.type === 'success' ? 'bg-ink' : 'bg-red-600'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                        ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 text-white" strokeWidth={2.5} />
                        )}
                        <span className="leading-snug">{toast.text}</span>
                    </div>
                </div>
            )}

            {/* Mobile App Shell */}
            <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-cream shadow-[0_0_40px_rgba(0,0,0,0.08)]">
                {/* Mobile Top App Bar */}
                <header className="sticky top-0 z-30 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur print:hidden">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-display text-[17px] font-bold tracking-tight text-ink">
                                    GoMeal<span className="text-primary">.</span>
                                </span>
                                <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-deep">
                                    {title}
                                </span>
                            </div>
                            {subtitle && (
                                <p className="mt-0.5 truncate text-[11px] text-ink-soft">{subtitle}</p>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            {rightAction}
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
                    </div>
                </header>

                {/* Main Mobile Content */}
                <main className="flex-1 px-4 pb-28 pt-4">
                    {children}
                </main>

                {/* Bottom Navigation Bar */}
                <PelangganBottomNav activePage={activePage} />
            </div>
        </div>
    );
}
