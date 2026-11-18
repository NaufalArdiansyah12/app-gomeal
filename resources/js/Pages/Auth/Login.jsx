import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    ArrowRight, Eye, EyeOff, LogOut, Check,
    User, Lock, MapPin, Sparkles, Shield, ShoppingCart, ChefHat,
} from 'lucide-react';

export default function Login({ currentSession }) {
    const { flash, errors = {} } = usePage().props;
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [nama, setNama] = useState('');
    const [kota, setKota] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e) => {
        e?.preventDefault?.();
        if (!username || !password) return;
        setLoading(true);
        router.post('/login', { username, password }, {
            onFinish: () => setLoading(false),
        });
    };

    const directLogin = (u, p) => {
        setUsername(u);
        setPassword(p);
        setLoading(true);
        router.post('/login', { username: u, password: p }, {
            onFinish: () => setLoading(false),
        });
    };

    const handleRegister = (e) => {
        e.preventDefault();
        if (!username || !password || !nama || !kota) return;
        setLoading(true);
        router.post('/register', {
            username,
            password,
            nama_pelanggan: nama,
            kota,
        }, {
            onFinish: () => setLoading(false),
        });
    };

    return (
        <div className="flex min-h-screen flex-col font-body text-ink antialiased lg:flex-row">
            {/* ================= SISI KIRI: BRANDING & STORY (50%) ================= */}
            <div className="relative flex flex-col justify-between overflow-hidden bg-ink px-8 py-10 text-white sm:px-12 sm:py-14 lg:w-1/2 lg:p-16 xl:p-20">
                {/* Background Atmosphere */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#FFC94A]/10 blur-3xl" />

                {/* Brand Header */}
                <div className="relative flex items-center justify-between">
                    <span className="font-display text-[26px] font-bold tracking-tight text-white">
                        GoMeal<span className="text-primary">.</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        v3.0 Production
                    </span>
                </div>

                {/* Main Copy */}
                <div className="relative my-10 max-w-lg lg:my-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11.5px] font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        Platform POS & Dine-In Modern
                    </div>

                    <h1 className="mt-5 font-display text-[34px] font-bold leading-[1.16] tracking-tight text-white sm:text-[42px] xl:text-[46px]">
                        Pemesanan cerdas, operasional ringkas.
                    </h1>

                    <p className="mt-4 text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
                        Scan QR unik di setiap meja restoran, transaksi kasir instan, serta pemantauan stok dan omset harian dalam satu layar terpadu.
                    </p>

                    {/* Minimalist Feature Cards */}
                    <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-xs">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">01 · Scan Meja</p>
                            <p className="mt-1 text-[12.5px] font-bold text-white">QR Unik Resto</p>
                            <p className="mt-0.5 text-[11px] text-white/50">Pelanggan langsung pesan</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-xs">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">02 · Kasir POS</p>
                            <p className="mt-1 text-[12.5px] font-bold text-white">Transaksi Kilat</p>
                            <p className="mt-0.5 text-[11px] text-white/50">Hitung otomatis & struk</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-xs">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">03 · Omset Realtime</p>
                            <p className="mt-1 text-[12.5px] font-bold text-white">Export Laporan</p>
                            <p className="mt-0.5 text-[11px] text-white/50">Unduh PDF & Excel</p>
                        </div>
                    </div>
                </div>

                {/* Quick Access Footer */}
                <div className="relative border-t border-white/10 pt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">1-Klik Akun Demo</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => directLogin('admin', 'admin123')}
                            className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:border-primary/50 hover:bg-white/10 active:scale-95"
                        >
                            <Shield className="h-3.5 w-3.5 text-red-400" />
                            <span>Masuk Admin</span>
                            <ArrowRight className="h-3 w-3 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                        </button>
                        <button
                            type="button"
                            onClick={() => directLogin('kasir', 'kasir123')}
                            className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:border-primary/50 hover:bg-white/10 active:scale-95"
                        >
                            <ShoppingCart className="h-3.5 w-3.5 text-amber-400" />
                            <span>Masuk Kasir</span>
                            <ArrowRight className="h-3 w-3 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                        </button>
                        <button
                            type="button"
                            onClick={() => directLogin('chef', 'chef123')}
                            className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:border-primary/50 hover:bg-white/10 active:scale-95"
                        >
                            <ChefHat className="h-3.5 w-3.5 text-orange-400" />
                            <span>Masuk Chef</span>
                            <ArrowRight className="h-3 w-3 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                        </button>
                        <button
                            type="button"
                            onClick={() => directLogin('patriciaa', 'password')}
                            className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:border-primary/50 hover:bg-white/10 active:scale-95"
                        >
                            <User className="h-3.5 w-3.5 text-primary" />
                            <span>Masuk Pelanggan</span>
                            <ArrowRight className="h-3 w-3 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= SISI KANAN: FORM LOGIN & REGISTER (50%) ================= */}
            <div className="relative flex flex-1 items-center justify-center bg-cream px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16 xl:px-24">
                {/* Subtle soft backdrop accent */}
                <div className="pointer-events-none absolute left-1/2 top-12 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative w-full max-w-[430px]">
                    {/* Active Session Warning / Switcher */}
                    {currentSession?.id && (
                        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-subtle/70 px-4 py-3 text-[12px] shadow-2xs">
                            <div className="min-w-0">
                                <p className="text-[10.5px] font-medium text-primary-deep">Sedang masuk sebagai</p>
                                <p className="truncate font-bold text-ink">
                                    @{currentSession.username}
                                    <span className="ml-1.5 font-normal text-ink-soft">
                                        ({currentSession.role === 'admin'
                                            ? 'Administrator'
                                            : currentSession.role === 'kasir'
                                            ? 'Kasir'
                                            : currentSession.role === 'chef'
                                            ? 'Chef'
                                            : 'Pelanggan'})
                                    </span>
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <a
                                    href={currentSession.role === 'admin'
                                        ? '/admin/dashboard'
                                        : currentSession.role === 'kasir'
                                        ? '/admin/transaksi'
                                        : currentSession.role === 'chef'
                                        ? '/chef/dashboard'
                                        : '/'}
                                    className="rounded-lg bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-white transition hover:opacity-90 active:scale-95"
                                >
                                    Buka Panel
                                </a>
                                <button
                                    type="button"
                                    onClick={() => router.post('/logout')}
                                    title="Logout"
                                    className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink-soft transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Elevated Card */}
                    <div className="rounded-[28px] border border-line bg-white p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] sm:p-9">
                        {/* Segmented Control */}
                        <div className="relative grid grid-cols-2 rounded-2xl border border-line/90 bg-muted/70 p-1">
                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className={`relative z-10 rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                                    mode === 'login'
                                        ? 'bg-white text-ink shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                                        : 'text-ink-soft hover:text-ink'
                                }`}
                            >
                                Masuk
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('register')}
                                className={`relative z-10 rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                                    mode === 'register'
                                        ? 'bg-white text-ink shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                                        : 'text-ink-soft hover:text-ink'
                                }`}
                            >
                                Daftar Akun
                            </button>
                        </div>

                        {/* Heading */}
                        <div className="mt-6">
                            <h2 className="font-display text-[23px] font-bold tracking-tight text-ink sm:text-[25px]">
                                {mode === 'login' ? 'Selamat Datang Kembali' : 'Mulai Pengalaman Anda'}
                            </h2>
                            <p className="mt-1 text-[13px] text-ink-soft">
                                {mode === 'login'
                                    ? 'Akses akun kasir, admin, atau pelanggan Anda'
                                    : 'Daftar sebagai pelanggan untuk memesan langsung'}
                            </p>
                        </div>

                        {/* Flash Messages */}
                        {flash?.error && (
                            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200/90 bg-red-50/90 p-3 text-[12.5px] text-red-700">
                                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white">!</span>
                                <span>{flash.error}</span>
                            </div>
                        )}
                        {flash?.success && (
                            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200/90 bg-emerald-50/90 p-3 text-[12.5px] text-emerald-700">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                <span>{flash.success}</span>
                            </div>
                        )}

                        {/* Form Area */}
                        {mode === 'login' ? (
                            <form onSubmit={handleLogin} className="mt-6 space-y-4">
                                {/* Username Field */}
                                <div>
                                    <label htmlFor="login-username" className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Username
                                    </label>
                                    <div className="relative mt-1.5 flex items-center rounded-2xl border border-line bg-muted/40 transition-all duration-200 focus-within:border-ink focus-within:bg-white focus-within:ring-4 focus-within:ring-ink/5">
                                        <div className="grid h-11 w-11 shrink-0 place-items-center text-ink-soft">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <input
                                            id="login-username"
                                            type="text"
                                            autoComplete="username"
                                            placeholder="Masukkan username Anda"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            className="h-11 w-full bg-transparent pr-4 text-[13.5px] text-ink placeholder:text-ink-soft/60 focus:outline-none"
                                        />
                                    </div>
                                    {errors.username && <p className="mt-1 text-[11.5px] text-red-600">{errors.username}</p>}
                                </div>

                                {/* Password Field */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="login-password" className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">
                                            Password
                                        </label>
                                    </div>
                                    <div className="relative mt-1.5 flex items-center rounded-2xl border border-line bg-muted/40 transition-all duration-200 focus-within:border-ink focus-within:bg-white focus-within:ring-4 focus-within:ring-ink/5">
                                        <div className="grid h-11 w-11 shrink-0 place-items-center text-ink-soft">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <input
                                            id="login-password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-11 w-full bg-transparent pr-10 text-[13.5px] text-ink placeholder:text-ink-soft/60 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                            className="absolute right-3 grid h-7 w-7 place-items-center rounded-lg text-ink-soft transition hover:text-ink"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1 text-[11.5px] text-red-600">{errors.password}</p>}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={!username || !password || loading}
                                    className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[13.5px] font-semibold text-white shadow-xs transition-all duration-200 hover:bg-ink/90 hover:shadow-md active:scale-[0.99] disabled:opacity-40"
                                >
                                    <span>{loading ? 'Memproses Masuk...' : 'Masuk Sekarang'}</span>
                                    {!loading && (
                                        <ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-0.5" strokeWidth={2.4} />
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="mt-6 space-y-3.5">
                                {/* Nama Lengkap */}
                                <div>
                                    <label htmlFor="reg-nama" className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Nama Lengkap
                                    </label>
                                    <div className="relative mt-1.5 flex items-center rounded-2xl border border-line bg-muted/40 transition-all duration-200 focus-within:border-ink focus-within:bg-white focus-within:ring-4 focus-within:ring-ink/5">
                                        <div className="grid h-11 w-11 shrink-0 place-items-center text-ink-soft">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <input
                                            id="reg-nama"
                                            type="text"
                                            placeholder="Contoh: Patricia Amanda"
                                            value={nama}
                                            onChange={(e) => setNama(e.target.value)}
                                            required
                                            className="h-11 w-full bg-transparent pr-4 text-[13.5px] text-ink placeholder:text-ink-soft/60 focus:outline-none"
                                        />
                                    </div>
                                    {errors.nama_pelanggan && <p className="mt-1 text-[11.5px] text-red-600">{errors.nama_pelanggan}</p>}
                                </div>

                                {/* 2 Col: Username & Kota */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="reg-username" className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">
                                            Username
                                        </label>
                                        <div className="relative mt-1.5 flex items-center rounded-2xl border border-line bg-muted/40 transition-all duration-200 focus-within:border-ink focus-within:bg-white focus-within:ring-4 focus-within:ring-ink/5">
                                            <input
                                                id="reg-username"
                                                type="text"
                                                placeholder="patriciaa"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                                className="h-11 w-full bg-transparent px-3.5 text-[13.5px] text-ink placeholder:text-ink-soft/60 focus:outline-none"
                                            />
                                        </div>
                                        {errors.username && <p className="mt-1 text-[11.5px] text-red-600">{errors.username}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="reg-kota" className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">
                                            Kota
                                        </label>
                                        <div className="relative mt-1.5 flex items-center rounded-2xl border border-line bg-muted/40 transition-all duration-200 focus-within:border-ink focus-within:bg-white focus-within:ring-4 focus-within:ring-ink/5">
                                            <div className="grid h-11 w-9 shrink-0 place-items-center text-ink-soft">
                                                <MapPin className="h-3.5 w-3.5" />
                                            </div>
                                            <input
                                                id="reg-kota"
                                                type="text"
                                                placeholder="Surabaya"
                                                value={kota}
                                                onChange={(e) => setKota(e.target.value)}
                                                required
                                                className="h-11 w-full bg-transparent pr-3 text-[13.5px] text-ink placeholder:text-ink-soft/60 focus:outline-none"
                                            />
                                        </div>
                                        {errors.kota && <p className="mt-1 text-[11.5px] text-red-600">{errors.kota}</p>}
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="reg-password" className="block text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Password
                                    </label>
                                    <div className="relative mt-1.5 flex items-center rounded-2xl border border-line bg-muted/40 transition-all duration-200 focus-within:border-ink focus-within:bg-white focus-within:ring-4 focus-within:ring-ink/5">
                                        <div className="grid h-11 w-11 shrink-0 place-items-center text-ink-soft">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <input
                                            id="reg-password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Minimal 4 karakter"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-11 w-full bg-transparent pr-10 text-[13.5px] text-ink placeholder:text-ink-soft/60 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                            className="absolute right-3 grid h-7 w-7 place-items-center rounded-lg text-ink-soft transition hover:text-ink"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1 text-[11.5px] text-red-600">{errors.password}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!username || !password || !nama || !kota || loading}
                                    className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[13.5px] font-semibold text-white shadow-xs transition-all duration-200 hover:bg-ink/90 hover:shadow-md active:scale-[0.99] disabled:opacity-40"
                                >
                                    <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar & Masuk'}</span>
                                    {!loading && (
                                        <ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-0.5" strokeWidth={2.4} />
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Footer Note */}
                        <div className="mt-6 border-t border-line/80 pt-5 text-center text-[12px] text-ink-soft">
                            <span>Sistem terhubung aman ke database GoMeal</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
