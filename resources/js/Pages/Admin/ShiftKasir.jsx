import AdminLayout from './AdminLayout';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    CalendarClock, Plus, Edit2, Trash2, Search, X, Check,
    Clock, DollarSign, UserCheck, CheckCircle2, AlertCircle,
    Calendar, ArrowRight, User, ShieldCheck, UserPlus, KeyRound, Eye, EyeOff,
} from 'lucide-react';

export default function ShiftKasirPage({ shifts = [], kasirUsers = [], stats = {} }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Create / Edit modal state
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [idUser, setIdUser] = useState(kasirUsers[0]?.id_user || '');
    const [namaShift, setNamaShift] = useState('Shift Pagi');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [jamMulai, setJamMulai] = useState('08:00');
    const [jamSelesai, setJamSelesai] = useState('16:00');
    const [saldoAwal, setSaldoAwal] = useState('500000');
    const [saldoAkhir, setSaldoAkhir] = useState('');
    const [status, setStatus] = useState('terjadwal');
    const [catatan, setCatatan] = useState('');
    const [loading, setLoading] = useState(false);

    // Close shift modal state
    const [closeModalData, setCloseModalData] = useState(null);
    const [closeSaldoAkhir, setCloseSaldoAkhir] = useState('');
    const [closeCatatan, setCloseCatatan] = useState('');
    const [closeLoading, setCloseLoading] = useState(false);

    // Create Kasir Account modal state
    const [showKasirModal, setShowKasirModal] = useState(false);
    const [newKasirUsername, setNewKasirUsername] = useState('');
    const [newKasirPassword, setNewKasirPassword] = useState('');
    const [showKasirPassword, setShowKasirPassword] = useState(false);
    const [kasirLoading, setKasirLoading] = useState(false);
    const [kasirErrors, setKasirErrors] = useState({});

    const openCreateKasir = () => {
        setNewKasirUsername('');
        setNewKasirPassword('');
        setShowKasirPassword(false);
        setKasirErrors({});
        setShowKasirModal(true);
    };

    const handleSubmitKasir = (e) => {
        e.preventDefault();
        setKasirLoading(true);
        setKasirErrors({});

        router.post('/admin/shift/kasir-user', {
            username: newKasirUsername.trim(),
            password: newKasirPassword,
        }, {
            onSuccess: () => {
                setShowKasirModal(false);
                setNewKasirUsername('');
                setNewKasirPassword('');
            },
            onError: (errors) => {
                setKasirErrors(errors || {});
            },
            onFinish: () => {
                setKasirLoading(false);
            },
        });
    };

    const openCreate = () => {
        setEditData(null);
        setIdUser(kasirUsers[0]?.id_user || '');
        setNamaShift('Shift Pagi');
        setTanggal(new Date().toISOString().split('T')[0]);
        setJamMulai('08:00');
        setJamSelesai('16:00');
        setSaldoAwal('500000');
        setSaldoAkhir('');
        setStatus('terjadwal');
        setCatatan('');
        setShowModal(true);
    };

    const openEdit = (s) => {
        setEditData(s);
        setIdUser(s.id_user);
        setNamaShift(s.nama_shift);
        setTanggal(s.tanggal);
        setJamMulai(s.jam_mulai?.substring(0, 5) || '08:00');
        setJamSelesai(s.jam_selesai?.substring(0, 5) || '16:00');
        setSaldoAwal(String(s.saldo_awal || 0));
        setSaldoAkhir(s.saldo_akhir ? String(s.saldo_akhir) : '');
        setStatus(s.status);
        setCatatan(s.catatan || '');
        setShowModal(true);
    };

    const openCloseModal = (s) => {
        setCloseModalData(s);
        setCloseSaldoAkhir(s.saldo_akhir ? String(s.saldo_akhir) : '');
        setCloseCatatan(s.catatan || '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            id_user: idUser,
            nama_shift: namaShift,
            tanggal,
            jam_mulai: jamMulai,
            jam_selesai: jamSelesai,
            saldo_awal: saldoAwal,
            status,
            catatan,
        };

        if (editData) {
            if (saldoAkhir) payload.saldo_akhir = saldoAkhir;
            router.put(`/admin/shift/${editData.id_shift}`, payload, {
                onFinish: () => {
                    setLoading(false);
                    setShowModal(false);
                },
            });
        } else {
            router.post('/admin/shift', payload, {
                onFinish: () => {
                    setLoading(false);
                    setShowModal(false);
                },
            });
        }
    };

    const handleCloseShift = (e) => {
        e.preventDefault();
        if (!closeModalData || !closeSaldoAkhir) return;

        setCloseLoading(true);
        router.post(`/admin/shift/${closeModalData.id_shift}/close`, {
            saldo_akhir: closeSaldoAkhir,
            catatan: closeCatatan,
        }, {
            onFinish: () => {
                setCloseLoading(false);
                setCloseModalData(null);
            },
        });
    };

    const handleDelete = (s) => {
        if (confirm(`Hapus jadwal shift "${s.nama_shift}" untuk kasir ${s.nama_kasir}?`)) {
            router.delete(`/admin/shift/${s.id_shift}`);
        }
    };

    const filtered = shifts.filter((s) => {
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        const matchesSearch =
            s.nama_shift.toLowerCase().includes(search.toLowerCase()) ||
            s.nama_kasir.toLowerCase().includes(search.toLowerCase()) ||
            (s.catatan && s.catatan.toLowerCase().includes(search.toLowerCase()));

        return matchesStatus && matchesSearch;
    });

    const money = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    const getStatusPill = (st) => {
        switch (st) {
            case 'aktif':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Shift Aktif
                    </span>
                );
            case 'selesai':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-line px-2.5 py-0.5 text-[11px] font-bold text-ink-soft">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Selesai
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        <Clock className="h-3 w-3 text-amber-600" />
                        Terjadwal
                    </span>
                );
        }
    };

    return (
        <AdminLayout
            activePage="shift"
            title="Atur Shift & Kas Laci Kasir"
            subtitle="Jadwalkan jam kerja kasir, kelola uang modal laci kasir (saldo awal), dan pembukuan setoran akhir shift"
        >
            <div className="space-y-5">
                {/* 4 Overview Metric Cards */}
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Shift Aktif</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Clock className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                            {Number(stats.shift_aktif || 0)}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-soft">Kasir sedang bertugas</p>
                    </div>

                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Terjadwal</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
                                <Calendar className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600">
                            {Number(stats.shift_terjadwal || 0)}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-soft">Menunggu jam mulai</p>
                    </div>

                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Shift Selesai</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-50 text-sky-600">
                                <CheckCircle2 className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-sky-600">
                            {Number(stats.shift_selesai || 0)}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-soft">Laci kasir telah ditutup</p>
                    </div>

                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Total Kasir</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-ink">
                                <UserCheck className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                            {Number(stats.total_kasir || 0)}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-soft">User staf kasir terdaftar</p>
                    </div>
                </div>

                {/* Filter and Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="relative flex-1 max-w-md">
                        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/40">
                            <Search className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Cari nama kasir atau shift..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-transparent text-[12.5px] text-ink placeholder-ink-soft outline-none"
                            />
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {[
                            { key: 'all', label: 'Semua Shift' },
                            { key: 'aktif', label: 'Aktif' },
                            { key: 'terjadwal', label: 'Terjadwal' },
                            { key: 'selesai', label: 'Selesai' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setStatusFilter(key)}
                                className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition active:scale-95 ${
                                    statusFilter === key
                                        ? 'bg-ink text-white shadow-xs'
                                        : 'bg-muted/70 text-ink-soft hover:bg-muted hover:text-ink'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={openCreateKasir}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[12px] font-semibold text-ink hover:border-primary hover:bg-muted/30 active:scale-95 transition shadow-xs"
                        >
                            <UserPlus className="h-4 w-4 text-primary" strokeWidth={2.5} />
                            <span>Tambah Akun Kasir</span>
                        </button>

                        <button
                            type="button"
                            onClick={openCreate}
                            disabled={kasirUsers.length === 0}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-semibold text-ink hover:bg-primary-hover active:scale-95 transition shadow-sm disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            <span>Jadwalkan Shift Kasir</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                            <thead>
                                <tr className="border-b border-line bg-muted/40 text-ink-soft">
                                    <th className="py-3 px-4 font-semibold">Kasir Bertugas</th>
                                    <th className="py-3 px-4 font-semibold">Nama Shift</th>
                                    <th className="py-3 px-4 font-semibold">Tanggal & Jam</th>
                                    <th className="py-3 px-4 font-semibold text-right">Modal Awal</th>
                                    <th className="py-3 px-4 font-semibold text-right">Setoran Akhir</th>
                                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                                    <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-10 text-center text-ink-soft">
                                            Tidak ada jadwal shift yang cocok
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((s) => (
                                        <tr key={s.id_shift} className="border-b border-line/60 hover:bg-primary-subtle/30 transition">
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <img
                                                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(s.nama_kasir)}`}
                                                        alt=""
                                                        className="h-8 w-8 rounded-full bg-muted object-cover"
                                                    />
                                                    <div>
                                                        <span className="font-bold text-ink">@{s.nama_kasir}</span>
                                                        <span className="block text-[10.5px] text-ink-soft">Staf Kasir</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-ink">
                                                {s.nama_shift}
                                                {s.catatan && (
                                                    <span className="block text-[10.5px] text-ink-soft font-normal truncate max-w-xs" title={s.catatan}>
                                                        {s.catatan}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-ink-soft whitespace-nowrap">
                                                <span className="font-medium text-ink block">{s.tanggal}</span>
                                                <span className="text-[11px] font-mono">
                                                    {s.jam_mulai?.substring(0, 5)} - {s.jam_selesai?.substring(0, 5)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono font-bold text-ink">
                                                {money(s.saldo_awal)}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono font-bold">
                                                {s.saldo_akhir !== null ? (
                                                    <span className="text-emerald-700">{money(s.saldo_akhir)}</span>
                                                ) : (
                                                    <span className="text-ink-soft text-[11px] italic font-normal">Belum ditutup</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {getStatusPill(s.status)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5">
                                                    {s.status !== 'selesai' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openCloseModal(s)}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition active:scale-95"
                                                            title="Tutup & Selesaikan Shift"
                                                        >
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            <span>Tutup Shift</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(s)}
                                                        className="inline-grid h-7 w-7 place-items-center rounded-lg border border-line text-ink-soft hover:border-primary hover:text-ink transition active:scale-95"
                                                        title="Edit Shift"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(s)}
                                                        className="inline-grid h-7 w-7 place-items-center rounded-lg border border-line text-ink-soft hover:border-red-300 hover:text-red-600 transition active:scale-95"
                                                        title="Hapus Shift"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Tambah / Edit Shift */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-line animate-[modalIn_0.2s_ease-out]">
                        <div className="flex items-center justify-between pb-3 border-b border-line">
                            <h3 className="font-display text-[16px] font-bold text-ink">
                                {editData ? 'Edit Jadwal Shift Kasir' : 'Jadwalkan Shift Kasir Baru'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Pilih Kasir
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            openCreateKasir();
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-deep hover:underline"
                                    >
                                        <UserPlus className="h-3 w-3" />
                                        <span>+ Buat Akun Kasir</span>
                                    </button>
                                </div>
                                <select
                                    required
                                    value={idUser}
                                    onChange={(e) => setIdUser(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                >
                                    {kasirUsers.length === 0 ? (
                                        <option value="" disabled>Belum ada akun kasir di database</option>
                                    ) : (
                                        kasirUsers.map((u) => (
                                            <option key={u.id_user} value={u.id_user}>
                                                @{u.username} (Kasir)
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Nama Shift
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Shift Pagi"
                                        value={namaShift}
                                        onChange={(e) => setNamaShift(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={tanggal}
                                        onChange={(e) => setTanggal(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Jam Mulai
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={jamMulai}
                                        onChange={(e) => setJamMulai(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Jam Selesai
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={jamSelesai}
                                        onChange={(e) => setJamSelesai(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Saldo Awal Laci (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="1000"
                                        placeholder="500000"
                                        value={saldoAwal}
                                        onChange={(e) => setSaldoAwal(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                    >
                                        <option value="terjadwal">Terjadwal</option>
                                        <option value="aktif">Aktif</option>
                                        <option value="selesai">Selesai</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                    Catatan Tambahan
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Contoh: Modal pecahan kecil, hand over laci kasir..."
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                />
                            </div>

                            <div className="pt-2 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 rounded-xl border border-line py-2 text-[12px] font-semibold text-ink-soft hover:bg-muted"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 rounded-xl bg-primary py-2 text-[12px] font-semibold text-ink hover:bg-primary-hover active:scale-95 transition disabled:opacity-50"
                                >
                                    {loading ? 'Menyimpan...' : 'Simpan Shift'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Selesaikan / Tutup Shift */}
            {closeModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-line animate-[modalIn_0.2s_ease-out]">
                        <div className="flex items-center justify-between pb-3 border-b border-line">
                            <div>
                                <h3 className="font-display text-[16px] font-bold text-ink">
                                    Tutup Shift Kasir
                                </h3>
                                <p className="text-[11px] text-ink-soft">
                                    @{closeModalData.nama_kasir} &bull; {closeModalData.nama_shift}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCloseModalData(null)}
                                className="grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCloseShift} className="mt-4 space-y-3">
                            <div className="rounded-xl bg-muted/50 p-3 text-[12px] text-ink-soft">
                                <div className="flex justify-between">
                                    <span>Modal Saldo Awal:</span>
                                    <strong className="text-ink">{money(closeModalData.saldo_awal)}</strong>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                    Saldo Akhir / Setoran Laci Kasir (Rp)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1000"
                                    placeholder="Contoh: 1850000"
                                    value={closeSaldoAkhir}
                                    onChange={(e) => setCloseSaldoAkhir(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                    Catatan Serah Terima (Opsional)
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Contoh: Uang fisik pas sesuai pembukuan POS..."
                                    value={closeCatatan}
                                    onChange={(e) => setCloseCatatan(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                />
                            </div>

                            <div className="pt-2 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCloseModalData(null)}
                                    className="flex-1 rounded-xl border border-line py-2 text-[12px] font-semibold text-ink-soft hover:bg-muted"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={closeLoading || !closeSaldoAkhir}
                                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-[12px] font-semibold text-white hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                                >
                                    {closeLoading ? 'Menyelesaikan...' : 'Tutup Shift'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah Akun Kasir */}
            {showKasirModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-line animate-[modalIn_0.2s_ease-out]">
                        <div className="flex items-center justify-between pb-3 border-b border-line">
                            <div className="flex items-center gap-2">
                                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-ink">
                                    <UserPlus className="h-4 w-4" />
                                </span>
                                <div>
                                    <h3 className="font-display text-[15px] font-bold text-ink">
                                        Buat Akun Kasir Baru
                                    </h3>
                                    <p className="text-[11px] text-ink-soft">
                                        Role otomatis: <span className="font-semibold text-ink">kasir</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowKasirModal(false)}
                                className="grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitKasir} className="mt-4 space-y-3.5">
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                    Username Login Kasir
                                </label>
                                <div className="relative mt-1">
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                                    <input
                                        type="text"
                                        required
                                        minLength={3}
                                        maxLength={50}
                                        placeholder="Contoh: kasir_sore"
                                        value={newKasirUsername}
                                        onChange={(e) => setNewKasirUsername(e.target.value)}
                                        className="w-full rounded-xl border border-line pl-9 pr-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                {kasirErrors.username && (
                                    <p className="mt-1 text-[11px] font-medium text-red-600">{kasirErrors.username}</p>
                                )}
                                <p className="mt-1 text-[10.5px] text-ink-soft">
                                    Hanya huruf, angka, strip (-), atau underscore (_).
                                </p>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                    Password
                                </label>
                                <div className="relative mt-1">
                                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                                    <input
                                        type={showKasirPassword ? 'text' : 'password'}
                                        required
                                        minLength={4}
                                        maxLength={100}
                                        placeholder="Minimal 4 karakter"
                                        value={newKasirPassword}
                                        onChange={(e) => setNewKasirPassword(e.target.value)}
                                        className="w-full rounded-xl border border-line pl-9 pr-10 py-2 text-[12.5px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKasirPassword((v) => !v)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                                        tabIndex={-1}
                                    >
                                        {showKasirPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {kasirErrors.password && (
                                    <p className="mt-1 text-[11px] font-medium text-red-600">{kasirErrors.password}</p>
                                )}
                            </div>

                            <div className="pt-2 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowKasirModal(false)}
                                    className="flex-1 rounded-xl border border-line py-2 text-[12px] font-semibold text-ink-soft hover:bg-muted"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={kasirLoading}
                                    className="flex-1 rounded-xl bg-primary py-2 text-[12px] font-semibold text-ink hover:bg-primary-hover active:scale-95 transition disabled:opacity-50"
                                >
                                    {kasirLoading ? 'Membuat...' : 'Simpan Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
