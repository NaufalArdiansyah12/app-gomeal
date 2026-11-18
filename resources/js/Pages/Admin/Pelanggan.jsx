import AdminLayout from './AdminLayout';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Users, Plus, Edit2, Search, MapPin, Sparkles,
    Shield, X, Check, Eye,
} from 'lucide-react';

export default function PelangganPage({ pelangganList, cities, isReadOnly = false }) {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);

    // Form state
    const [nama, setNama] = useState('');
    const [kota, setKota] = useState(cities[0] || 'Surabaya');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const openCreate = () => {
        setEditData(null);
        setNama('');
        setKota(cities[0] || 'Surabaya');
        setUsername('');
        setPassword('');
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditData(p);
        setNama(p.nama_pelanggan);
        setKota(p.kota);
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        if (editData) {
            router.put(`/admin/pelanggan/${editData.id_pelanggan}`, {
                nama_pelanggan: nama,
                kota,
            }, {
                onFinish: () => {
                    setLoading(false);
                    setShowModal(false);
                },
            });
        } else {
            router.post('/admin/pelanggan', {
                nama_pelanggan: nama,
                kota,
                username,
                password,
            }, {
                onFinish: () => {
                    setLoading(false);
                    setShowModal(false);
                },
            });
        }
    };

    const filtered = pelangganList.filter(p =>
        p.nama_pelanggan.toLowerCase().includes(search.toLowerCase()) ||
        p.kota.toLowerCase().includes(search.toLowerCase()) ||
        (p.username && p.username.toLowerCase().includes(search.toLowerCase()))
    );

    const money = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    return (
        <AdminLayout
            activePage="pelanggan"
            title={isReadOnly ? 'Data Pelanggan' : 'Kelola Data Pelanggan'}
            subtitle={isReadOnly
                ? 'Daftar master pelanggan dan status membership (Mode Lihat Saja untuk Kasir)'
                : 'Manajemen master pelanggan, jangkauan kota pengiriman, status tier, dan akun login'}
        >
            <div className="space-y-4">
                {/* Actions & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="relative flex-1 max-w-md">
                        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/40">
                            <Search className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Cari pelanggan, kota, atau username..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-transparent text-[12.5px] text-ink placeholder-ink-soft outline-none"
                            />
                        </div>
                    </div>

                    {isReadOnly ? (
                        <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-2 text-[11.5px] font-semibold text-amber-800">
                            <Eye className="h-3.5 w-3.5" strokeWidth={2.5} />
                            <span>Mode Lihat Saja (Kasir)</span>
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-semibold text-ink hover:bg-primary-hover active:scale-95 transition shadow-sm"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            <span>Tambah Pelanggan</span>
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                            <thead>
                                <tr className="border-b border-line bg-muted/40 text-ink-soft">
                                    <th className="py-3 px-4 font-semibold">ID</th>
                                    <th className="py-3 px-4 font-semibold">Pelanggan</th>
                                    <th className="py-3 px-4 font-semibold">Kota Domisili</th>
                                    <th className="py-3 px-4 font-semibold">Username Login</th>
                                    <th className="py-3 px-4 font-semibold">Membership Tier</th>
                                    <th className="py-3 px-4 font-semibold text-right">Total Belanja</th>
                                    {!isReadOnly && <th className="py-3 px-4 font-semibold text-center">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={isReadOnly ? '6' : '7'} className="py-8 text-center text-ink-soft">
                                            Tidak ada pelanggan yang cocok
                                        </td>
                                    </tr>
                                ) : filtered.map(p => (
                                    <tr key={p.id_pelanggan} className="border-b border-line/60 hover:bg-primary-subtle/30 transition">
                                        <td className="py-3 px-4 font-semibold text-ink">#{p.id_pelanggan}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <img
                                                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(p.nama_pelanggan)}`}
                                                    alt=""
                                                    className="h-8 w-8 rounded-full bg-muted object-cover"
                                                />
                                                <span className="font-semibold text-ink">{p.nama_pelanggan}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-ink-soft">
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-primary" /> {p.kota}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {p.username ? (
                                                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-ink font-semibold">
                                                    @{p.username}
                                                </span>
                                            ) : (
                                                <span className="text-ink-soft text-[11px] italic">Belum ada akun</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                                                p.tier === 'Gold member'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : p.tier === 'Pelanggan Silver'
                                                    ? 'bg-slate-200 text-slate-800'
                                                    : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                                <Sparkles className="h-3 w-3" />
                                                {p.tier || 'Pelanggan Reguler'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold tabular-nums text-ink">
                                            {money(p.total_belanja)}
                                            <span className="block text-[10px] text-ink-soft font-normal">{p.total_transaksi || 0}x order</span>
                                        </td>
                                        {!isReadOnly && (
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(p)}
                                                    className="inline-grid h-7 w-7 place-items-center rounded-lg border border-line text-ink-soft hover:border-primary hover:text-ink transition active:scale-95"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Create / Edit */}
            {!isReadOnly && showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-line">
                        <div className="flex items-center justify-between pb-3 border-b border-line">
                            <h3 className="font-display text-[16px] font-bold text-ink">
                                {editData ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Nama Pelanggan</label>
                                <input
                                    type="text"
                                    required
                                    value={nama}
                                    onChange={e => setNama(e.target.value)}
                                    placeholder="Contoh: Patricia A."
                                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Kota Jangkauan (UNION Cabang)</label>
                                <select
                                    value={kota}
                                    onChange={e => setKota(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary bg-white"
                                >
                                    {cities.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {!editData && (
                                <>
                                    <div className="pt-2 border-t border-line">
                                        <p className="text-[11.5px] font-semibold text-primary">Buat Akun Login (Opsional)</p>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Username</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            placeholder="Kosongkan jika tanpa akun"
                                            className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Minimal 4 karakter (default: password)"
                                            className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="mt-5 flex gap-2 pt-2 border-t border-line">
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
                                    {loading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
