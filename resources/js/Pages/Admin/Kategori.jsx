import AdminLayout from './AdminLayout';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Tags, Plus, Edit2, Trash2, Search, X, Check,
    UtensilsCrossed, AlertCircle, Sparkles, FolderTree,
} from 'lucide-react';

export default function KategoriPage({ categories = [], totalProduk = 0 }) {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [namaKategori, setNamaKategori] = useState('');
    const [loading, setLoading] = useState(false);

    const openCreate = () => {
        setEditData(null);
        setNamaKategori('');
        setShowModal(true);
    };

    const openEdit = (cat) => {
        setEditData(cat);
        setNamaKategori(cat.nama_kategori);
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!namaKategori.trim()) return;

        setLoading(true);

        if (editData) {
            router.put(`/admin/kategori/${editData.id_kategori}`, {
                nama_kategori: namaKategori.trim(),
            }, {
                onFinish: () => {
                    setLoading(false);
                    setShowModal(false);
                },
            });
        } else {
            router.post('/admin/kategori', {
                nama_kategori: namaKategori.trim(),
            }, {
                onFinish: () => {
                    setLoading(false);
                    setShowModal(false);
                },
            });
        }
    };

    const handleDelete = (cat) => {
        if (cat.total_produk > 0) {
            alert(`Kategori "${cat.nama_kategori}" tidak dapat dihapus karena masih digunakan oleh ${cat.total_produk} menu produk.`);
            return;
        }

        if (confirm(`Yakin ingin menghapus kategori "${cat.nama_kategori}"?`)) {
            router.delete(`/admin/kategori/${cat.id_kategori}`);
        }
    };

    const filtered = categories.filter((c) =>
        c.nama_kategori.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout
            activePage="kategori"
            title="Kelola Master Kategori Menu"
            subtitle="Halaman khusus pengaturan kategori hidangan kuliner, penamaan grup, dan klasifikasi produk"
        >
            <div className="space-y-5">
                {/* 3 Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Total Kategori</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-ink">
                                <Tags className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                            {categories.length}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-soft">Grup klasifikasi kuliner aktif</p>
                    </div>

                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Total Produk</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                                <UtensilsCrossed className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                            {totalProduk}
                        </p>
                        <p className="mt-1 text-[11px] text-emerald-600 font-medium">Menu terdaftar di katalog</p>
                    </div>

                    <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Rata-Rata Item</span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
                                <FolderTree className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                            {categories.length > 0 ? (totalProduk / categories.length).toFixed(1) : 0}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-soft">Menu per kategori</p>
                    </div>
                </div>

                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="relative flex-1 max-w-md">
                        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/40">
                            <Search className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Cari nama kategori..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-transparent text-[12.5px] text-ink placeholder-ink-soft outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-semibold text-ink hover:bg-primary-hover active:scale-95 transition shadow-sm"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        <span>Tambah Kategori Baru</span>
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[22px] border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                            <thead>
                                <tr className="border-b border-line bg-muted/40 text-ink-soft">
                                    <th className="py-3 px-4 font-semibold">ID</th>
                                    <th className="py-3 px-4 font-semibold">Nama Kategori</th>
                                    <th className="py-3 px-4 font-semibold">Jumlah Produk</th>
                                    <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-10 text-center text-ink-soft">
                                            Tidak ada kategori yang cocok dengan pencarian
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((cat) => (
                                        <tr key={cat.id_kategori} className="border-b border-line/60 hover:bg-primary-subtle/30 transition">
                                            <td className="py-3.5 px-4 font-mono font-semibold text-ink">
                                                #{cat.id_kategori}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/20 text-ink">
                                                        <Tags className="h-3.5 w-3.5" />
                                                    </span>
                                                    <span className="font-bold text-ink text-[13px]">{cat.nama_kategori}</span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                                    cat.total_produk > 0
                                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                        : 'bg-muted text-ink-soft'
                                                }`}>
                                                    <UtensilsCrossed className="h-3 w-3" />
                                                    {cat.total_produk} Menu Produk
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(cat)}
                                                        className="inline-grid h-7 w-7 place-items-center rounded-lg border border-line text-ink-soft hover:border-primary hover:text-ink transition active:scale-95"
                                                        title="Edit Kategori"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(cat)}
                                                        className="inline-grid h-7 w-7 place-items-center rounded-lg border border-line text-ink-soft hover:border-red-300 hover:text-red-600 transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                                                        title={cat.total_produk > 0 ? 'Kategori masih terpakai oleh produk' : 'Hapus Kategori'}
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

            {/* Modal Tambah / Edit Kategori */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-line animate-[modalIn_0.2s_ease-out]">
                        <div className="flex items-center justify-between pb-3 border-b border-line">
                            <h3 className="font-display text-[16px] font-bold text-ink">
                                {editData ? 'Edit Kategori Menu' : 'Tambah Kategori Baru'}
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
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                    Nama Kategori
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Ramen, Dimsum, Minuman..."
                                    value={namaKategori}
                                    onChange={(e) => setNamaKategori(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2 text-[12.5px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                                    {loading ? 'Menyimpan...' : 'Simpan Kategori'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
