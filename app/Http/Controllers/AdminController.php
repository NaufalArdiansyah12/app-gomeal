<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\Meja;
use App\Models\Pelanggan;
use App\Models\Produk;
use App\Models\ShiftKasir;
use App\Models\User;
use App\Services\DuitkuService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    /**
     * 1. Dashboard (Overview)
     */
    public function dashboard(Request $request): Response
    {
        $totalPelanggan = DB::table('tbl_pelanggan')->count();
        $totalProduk = DB::table('tbl_produk')->count();
        $totalTransaksi = DB::table('tbl_transaksi')->count();
        $totalRevenue = DB::table('tbl_transaksi')->sum('total_belanja');
        $totalUsers = DB::table('tbl_users')->count();

        $recentTransactions = DB::select("
            SELECT
                t.id_transaksi,
                t.tanggal,
                p.nama_pelanggan,
                t.total_belanja,
                GROUP_CONCAT(CONCAT(dt.nama_produk, ' (', dt.jumlah, 'x)') SEPARATOR ', ') AS items
            FROM tbl_transaksi t
            JOIN tbl_pelanggan p ON t.id_pelanggan = p.id_pelanggan
            LEFT JOIN tbl_detail_transaksi dt ON t.id_transaksi = dt.id_transaksi
            GROUP BY t.id_transaksi, t.tanggal, p.nama_pelanggan, t.total_belanja
            ORDER BY t.tanggal DESC, t.id_transaksi DESC
            LIMIT 10
        ");

        $topProducts = DB::select('
            SELECT dt.nama_produk, SUM(dt.jumlah) AS total_terjual, SUM(dt.jumlah * dt.harga) AS total_revenue
            FROM tbl_detail_transaksi dt
            GROUP BY dt.nama_produk
            ORDER BY total_terjual DESC
            LIMIT 5
        ');

        $customerTiers = DB::select('
            SELECT KategoriBelanja(total_belanja) AS tier, COUNT(*) AS jumlah
            FROM view_total_belanja
            GROUP BY tier
        ');

        $auditLogs = DB::table('tbl_log')->orderByDesc('id_log')->limit(12)->get();

        $lowStockProducts = DB::select('
            SELECT p.nama_produk, p.stok, k.nama_kategori
            FROM tbl_produk p
            JOIN tbl_kategori k ON p.id_kategori = k.id_kategori
            WHERE p.stok < 10
            ORDER BY p.stok ASC
        ');

        $transactionTrend = DB::table('tbl_transaksi')
            ->selectRaw('DATE(tanggal) as date, COUNT(*) as count, CAST(SUM(total_belanja) AS DECIMAL(12,2)) as total')
            ->groupBy(DB::raw('DATE(tanggal)'))
            ->orderByDesc('date')
            ->limit(14)
            ->get()
            ->reverse()
            ->values();

        $categorySales = DB::select('
            SELECT k.nama_kategori, COUNT(dt.id_detail) as total_item_terjual, COALESCE(SUM(dt.jumlah * dt.harga), 0) as total_omset
            FROM tbl_kategori k
            LEFT JOIN tbl_produk p ON k.id_kategori = p.id_kategori
            LEFT JOIN tbl_detail_transaksi dt ON p.nama_produk = dt.nama_produk
            GROUP BY k.id_kategori, k.nama_kategori
            ORDER BY total_omset DESC
        ');

        $topCustomers = DB::select('
            SELECT p.nama_pelanggan, p.kota, v.total_transaksi, v.total_belanja, KategoriBelanja(v.total_belanja) as tier
            FROM view_total_belanja v
            JOIN tbl_pelanggan p ON v.id_pelanggan = p.id_pelanggan
            ORDER BY v.total_belanja DESC
            LIMIT 5
        ');

        return Inertia::render('Admin/Dashboard', [
            'username' => $request->session()->get('user_username', 'Admin'),
            'activePage' => 'dashboard',
            'stats' => [
                'pelanggan' => $totalPelanggan,
                'produk' => $totalProduk,
                'transaksi' => $totalTransaksi,
                'revenue' => (float) $totalRevenue,
                'users' => $totalUsers,
            ],
            'transactionTrend' => $transactionTrend,
            'recentTransactions' => $recentTransactions,
            'topProducts' => $topProducts,
            'customerTiers' => $customerTiers,
            'auditLogs' => $auditLogs,
            'lowStockProducts' => $lowStockProducts,
            'categorySales' => $categorySales,
            'topCustomers' => $topCustomers,
        ]);
    }

    /**
     * Stok & Inventori (List produk, status stok, opname & restock, log pergerakan stok)
     */
    public function stok(Request $request): Response
    {
        $products = DB::select('
            SELECT 
                p.id_produk,
                p.id_kategori,
                k.nama_kategori,
                p.nama_produk,
                p.barcode,
                p.image,
                p.harga,
                p.stok,
                COALESCE((SELECT SUM(jumlah) FROM tbl_detail_transaksi WHERE nama_produk = p.nama_produk), 0) AS terjual
            FROM tbl_produk p
            JOIN tbl_kategori k ON p.id_kategori = k.id_kategori
            ORDER BY p.stok ASC, p.nama_produk ASC
        ');

        $categories = DB::table('tbl_kategori')->orderBy('id_kategori')->get();

        $stockLogs = DB::table('tbl_log')
            ->where(function ($q) {
                $q->where('aktivitas', 'LIKE', '%stok%')
                    ->orWhere('aktivitas', 'LIKE', '%Stok%')
                    ->orWhere('aktivitas', 'LIKE', '%Produk%')
                    ->orWhere('aktivitas', 'LIKE', '%Opname%')
                    ->orWhere('aktivitas', 'LIKE', '%Restock%')
                    ->orWhere('aktivitas', 'LIKE', '%Void%');
            })
            ->orderByDesc('id_log')
            ->limit(25)
            ->get();

        return Inertia::render('Admin/Stok', [
            'username' => $request->session()->get('user_username', 'Admin'),
            'activePage' => 'stok',
            'products' => $products,
            'categories' => $categories,
            'stockLogs' => $stockLogs,
        ]);
    }

    public function adjustStok(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id_produk' => 'required|integer|exists:tbl_produk,id_produk',
            'tipe' => 'required|in:masuk,keluar,opname',
            'jumlah' => 'required|integer|min:0',
            'catatan' => 'nullable|string|max:255',
        ]);

        $produk = Produk::findOrFail($validated['id_produk']);
        $stokAwal = (int) $produk->stok;
        $jumlah = (int) $validated['jumlah'];
        $tipe = $validated['tipe'];
        $catatan = trim($validated['catatan'] ?? '');
        $catatanStr = ! empty($catatan) ? " [Ket: {$catatan}]" : '';

        if ($tipe === 'masuk') {
            $stokBaru = $stokAwal + $jumlah;
            $aktivitas = "Restock (+{$jumlah}): {$produk->nama_produk} (Stok {$stokAwal} -> {$stokBaru}){$catatanStr}";
        } elseif ($tipe === 'keluar') {
            if ($stokAwal < $jumlah) {
                return redirect()->back()->with('error', "Stok tidak mencukupi untuk pengurangan {$jumlah} unit (Sisa saat ini: {$stokAwal}).");
            }
            $stokBaru = $stokAwal - $jumlah;
            $aktivitas = "Stok Keluar (-{$jumlah}): {$produk->nama_produk} (Stok {$stokAwal} -> {$stokBaru}){$catatanStr}";
        } else { // opname
            $stokBaru = $jumlah;
            $diff = $stokBaru - $stokAwal;
            $diffStr = ($diff >= 0 ? "+{$diff}" : "{$diff}");
            $aktivitas = "Stock Opname Fisik ({$diffStr}): {$produk->nama_produk} (Stok {$stokAwal} -> {$stokBaru}){$catatanStr}";
        }

        $produk->update(['stok' => $stokBaru]);

        DB::table('tbl_log')->insert([
            'aktivitas' => $aktivitas,
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Stok {$produk->nama_produk} berhasil diperbarui (Kini: {$stokBaru} unit).");
    }

    /**
     * Riwayat Transaksi (Daftar semua transaksi untuk Admin, atau khusus milik Kasir jika role = kasir)
     */
    public function riwayat(Request $request): Response
    {
        $role = $request->session()->get('user_role');
        $userId = $request->session()->get('user_id');
        $isKasir = ($role === 'kasir');

        $range = $request->query('range', 'all');
        $search = trim($request->query('q', ''));

        $query = DB::table('tbl_transaksi as t')
            ->join('tbl_pelanggan as p', 't.id_pelanggan', '=', 'p.id_pelanggan')
            ->leftJoin('tbl_users as u', 't.id_user', '=', 'u.id_user')
            ->select([
                't.id_transaksi',
                't.tanggal',
                't.total_belanja',
                't.id_user',
                'u.username as nama_kasir',
                'p.id_pelanggan',
                'p.nama_pelanggan',
                'p.kota',
            ]);

        if ($isKasir) {
            $query->where('t.id_user', $userId);
        }

        if ($range === 'today') {
            $query->whereDate('t.tanggal', now()->toDateString());
        } elseif ($range === 'week') {
            $query->where('t.tanggal', '>=', now()->subDays(7)->toDateString());
        } elseif ($range === 'month') {
            $query->where('t.tanggal', '>=', now()->subDays(30)->toDateString());
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('t.id_transaksi', 'LIKE', "%{$search}%")
                    ->orWhere('p.nama_pelanggan', 'LIKE', "%{$search}%")
                    ->orWhere('p.kota', 'LIKE', "%{$search}%");
            });
        }

        $transaksiList = $query->orderByDesc('t.tanggal')
            ->orderByDesc('t.id_transaksi')
            ->limit(100)
            ->get();

        $txIds = $transaksiList->pluck('id_transaksi')->toArray();
        $details = [];
        if (! empty($txIds)) {
            $rawDetails = DB::table('tbl_detail_transaksi')
                ->whereIn('id_transaksi', $txIds)
                ->get();
            foreach ($rawDetails as $d) {
                $details[$d->id_transaksi][] = [
                    'nama_produk' => $d->nama_produk,
                    'jumlah' => (int) $d->jumlah,
                    'harga' => (float) $d->harga,
                    'subtotal' => (float) ($d->jumlah * $d->harga),
                ];
            }
        }

        $formattedList = $transaksiList->map(function ($t) use ($details) {
            $items = $details[$t->id_transaksi] ?? [];
            $totalItems = array_sum(array_column($items, 'jumlah'));

            return [
                'id_transaksi' => $t->id_transaksi,
                'tanggal' => $t->tanggal,
                'id_pelanggan' => $t->id_pelanggan,
                'id_user' => $t->id_user,
                'nama_kasir' => $t->nama_kasir,
                'nama_pelanggan' => $t->nama_pelanggan,
                'kota' => $t->kota,
                'total_belanja' => (float) $t->total_belanja,
                'items' => $items,
                'total_items' => $totalItems,
            ];
        });

        $summaryBase = DB::table('tbl_transaksi');
        if ($isKasir) {
            $summaryBase->where('id_user', $userId);
        }

        $summary = [
            'total_transaksi' => (clone $summaryBase)->count(),
            'total_omset' => (float) (clone $summaryBase)->sum('total_belanja'),
            'transaksi_hari_ini' => (clone $summaryBase)->whereDate('tanggal', now()->toDateString())->count(),
            'omset_hari_ini' => (float) (clone $summaryBase)->whereDate('tanggal', now()->toDateString())->sum('total_belanja'),
        ];

        return Inertia::render('Admin/Riwayat', [
            'username' => $request->session()->get('user_username', $isKasir ? 'Kasir' : 'Admin'),
            'activePage' => 'riwayat',
            'transaksiList' => $formattedList,
            'filters' => [
                'range' => $range,
                'q' => $search,
            ],
            'summary' => $summary,
            'isKasir' => $isKasir,
        ]);
    }

    public function voidTransaksi(Request $request, int $id): RedirectResponse
    {
        $role = $request->session()->get('user_role');
        $userId = $request->session()->get('user_id');

        DB::beginTransaction();
        try {
            $transaksi = DB::table('tbl_transaksi')->where('id_transaksi', $id)->first();
            if (! $transaksi) {
                throw new \Exception("Transaksi #{$id} tidak ditemukan.");
            }

            if ($role === 'kasir' && (int) $transaksi->id_user !== (int) $userId) {
                throw new \Exception('Anda hanya dapat membatalkan transaksi yang diproses oleh akun Anda sendiri.');
            }

            $items = DB::table('tbl_detail_transaksi')->where('id_transaksi', $id)->get();

            // Kembalikan stok masing-masing produk
            foreach ($items as $item) {
                DB::table('tbl_produk')
                    ->where('nama_produk', $item->nama_produk)
                    ->increment('stok', $item->jumlah);

                DB::table('tbl_log')->insert([
                    'aktivitas' => "Void Transaksi #{$id}: Pengembalian stok {$item->nama_produk} (+{$item->jumlah})",
                    'waktu' => now(),
                ]);
            }

            // Hapus detail dan transaksi
            DB::table('tbl_detail_transaksi')->where('id_transaksi', $id)->delete();
            DB::table('tbl_transaksi')->where('id_transaksi', $id)->delete();

            DB::table('tbl_log')->insert([
                'aktivitas' => 'Transaksi #'.$id.' senilai Rp '.number_format($transaksi->total_belanja, 0, ',', '.').' berhasil di-VOID (dibatalkan).',
                'waktu' => now(),
            ]);

            DB::commit();

            return redirect()->back()->with('success', "Transaksi #{$id} berhasil di-VOID (dibatalkan) dan stok barang telah dikembalikan.");
        } catch (\Throwable $e) {
            DB::rollBack();

            return redirect()->back()->with('error', 'Gagal membatalkan transaksi: '.$e->getMessage());
        }
    }

    /**
     * 2. Pelanggan Management (View view_total_belanja, Stored Procedure TambahPelanggan, edit kota, trigger after_update_pelanggan)
     * For role kasir: Read-only access!
     */
    public function pelanggan(Request $request): Response
    {
        $role = $request->session()->get('user_role');
        $isReadOnly = ($role === 'kasir');

        $pelangganList = DB::select('
            SELECT 
                p.id_pelanggan,
                p.nama_pelanggan,
                p.kota,
                u.username,
                v.total_transaksi,
                v.total_belanja,
                KategoriBelanja(v.total_belanja) AS tier,
                HitungProgresTier(v.total_belanja) AS progress
            FROM tbl_pelanggan p
            LEFT JOIN tbl_users u ON p.id_pelanggan = u.id_pelanggan
            LEFT JOIN view_total_belanja v ON p.id_pelanggan = v.id_pelanggan
            ORDER BY p.id_pelanggan DESC
        ');

        // Service cities from UNION query
        $cities = DB::select('
            SELECT DISTINCT kota FROM tbl_pelanggan WHERE kota IS NOT NULL
            UNION
            SELECT DISTINCT kota FROM tbl_cabang WHERE kota IS NOT NULL
            ORDER BY kota ASC
        ');

        $cityNames = array_values(array_filter(array_map(fn ($c) => $c->kota, $cities)));

        return Inertia::render('Admin/Pelanggan', [
            'username' => $request->session()->get('user_username', $isReadOnly ? 'Kasir' : 'Admin'),
            'userRole' => $role,
            'isReadOnly' => $isReadOnly,
            'activePage' => 'pelanggan',
            'pelangganList' => $pelangganList,
            'cities' => $cityNames,
        ]);
    }

    public function storePelanggan(Request $request): RedirectResponse
    {
        if ($request->session()->get('user_role') !== 'admin') {
            return redirect()->back()->with('error', 'Akses ditolak: Hanya Admin yang dapat menambah data pelanggan.');
        }

        $validated = $request->validate([
            'nama_pelanggan' => 'required|string|max:100',
            'kota' => 'required|string|max:50',
            'username' => 'nullable|string|max:50|unique:tbl_users,username',
            'password' => 'nullable|string|min:6',
        ]);

        DB::beginTransaction();
        try {
            // Call Stored Procedure TambahPelanggan (fires after_insert_pelanggan trigger)
            DB::statement('CALL TambahPelanggan(?, ?)', [
                $validated['nama_pelanggan'],
                $validated['kota'],
            ]);

            $pelanggan = Pelanggan::where('nama_pelanggan', $validated['nama_pelanggan'])
                ->orderByDesc('id_pelanggan')
                ->first();

            if (! empty($validated['username']) && ! empty($validated['password'])) {
                User::create([
                    'id_pelanggan' => $pelanggan->id_pelanggan,
                    'username' => $validated['username'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'pelanggan',
                ]);
            }

            DB::commit();

            return redirect()->back()->with('success', "Pelanggan '{$pelanggan->nama_pelanggan}' berhasil ditambahkan.");
        } catch (\Throwable $e) {
            DB::rollBack();

            return redirect()->back()->with('error', 'Gagal menambahkan pelanggan: '.$e->getMessage());
        }
    }

    public function updatePelanggan(Request $request, int $id): RedirectResponse
    {
        if ($request->session()->get('user_role') !== 'admin') {
            return redirect()->back()->with('error', 'Akses ditolak: Hanya Admin yang dapat memperbarui data pelanggan.');
        }

        $validated = $request->validate([
            'nama_pelanggan' => 'required|string|max:100',
            'kota' => 'required|string|max:50',
        ]);

        $pelanggan = Pelanggan::findOrFail($id);
        $pelanggan->update($validated); // Fires after_update_pelanggan trigger

        return redirect()->back()->with('success', "Data pelanggan '{$pelanggan->nama_pelanggan}' berhasil diperbarui.");
    }

    /**
     * 3. Transaksi / POS (Admin & Kasir checkout on behalf of customer, direct cash/order, Stored Functions & TCL)
     */
    public function transaksi(Request $request): Response
    {
        $role = $request->session()->get('user_role');
        $userId = $request->session()->get('user_id');
        $isKasir = ($role === 'kasir');

        $productsRaw = DB::select('SELECT * FROM view_katalog_produk ORDER BY nama_produk ASC');
        $pelanggan = Pelanggan::orderBy('nama_pelanggan')->get(['id_pelanggan', 'nama_pelanggan', 'kota']);

        // Recent cashier orders (if role kasir, only show this cashier's orders)
        $queryRecent = DB::table('tbl_transaksi as t')
            ->join('tbl_pelanggan as p', 't.id_pelanggan', '=', 'p.id_pelanggan')
            ->leftJoin('tbl_detail_transaksi as dt', 't.id_transaksi', '=', 'dt.id_transaksi')
            ->selectRaw("
                t.id_transaksi,
                t.tanggal,
                p.nama_pelanggan,
                p.kota,
                t.total_belanja,
                GROUP_CONCAT(CONCAT(dt.nama_produk, ' (', dt.jumlah, 'x)') SEPARATOR ', ') AS items,
                SUM(dt.jumlah) as total_qty
            ")
            ->groupBy('t.id_transaksi', 't.tanggal', 'p.nama_pelanggan', 'p.kota', 't.total_belanja')
            ->orderByDesc('t.tanggal')
            ->orderByDesc('t.id_transaksi')
            ->limit(15);

        if ($isKasir) {
            $queryRecent->where('t.id_user', $userId);
        }

        $recentOrders = $queryRecent->get();

        return Inertia::render('Admin/Transaksi', [
            'username' => $request->session()->get('user_username', $isKasir ? 'Kasir' : 'Admin'),
            'userRole' => $role,
            'activePage' => 'transaksi',
            'products' => $productsRaw,
            'pelangganList' => $pelanggan,
            'recentOrders' => $recentOrders,
        ]);
    }

    /**
     * Order Makanan (Halaman kasir untuk menerima pesanan delivery dari pelanggan)
     */
    public function orderMakanan(Request $request): Response
    {
        $role = $request->session()->get('user_role');
        $isKasir = ($role === 'kasir');
        $testCustomerNames = ['Pelanggan Duitku Test', 'Pelanggan Duitku Checkout'];

        $stats = [
            'menunggu_kasir' => DB::table('tbl_transaksi')
                ->whereIn('tipe_pesanan', ['delivery', 'dine_in'])
                ->whereNotIn('id_pelanggan', DB::table('tbl_pelanggan')->select('id_pelanggan')->whereIn('nama_pelanggan', $testCustomerNames))
                ->where('status_pesanan', 'menunggu_kasir')
                ->count(),
            'diproses_dapur' => DB::table('tbl_transaksi')
                ->whereIn('tipe_pesanan', ['delivery', 'dine_in'])
                ->whereNotIn('id_pelanggan', DB::table('tbl_pelanggan')->select('id_pelanggan')->whereIn('nama_pelanggan', $testCustomerNames))
                ->whereIn('status_pesanan', ['menunggu_chef', 'dimasak'])
                ->count(),
            'siap_kasir' => DB::table('tbl_transaksi')
                ->whereIn('tipe_pesanan', ['delivery', 'dine_in'])
                ->whereNotIn('id_pelanggan', DB::table('tbl_pelanggan')->select('id_pelanggan')->whereIn('nama_pelanggan', $testCustomerNames))
                ->where('status_pesanan', 'siap_kasir')
                ->count(),
            'selesai_hari_ini' => DB::table('tbl_transaksi')
                ->whereIn('tipe_pesanan', ['delivery', 'dine_in'])
                ->whereNotIn('id_pelanggan', DB::table('tbl_pelanggan')->select('id_pelanggan')->whereIn('nama_pelanggan', $testCustomerNames))
                ->whereDate('tanggal', now()->toDateString())
                ->where('status_pesanan', 'selesai')
                ->count(),
        ];

        $rawOrders = DB::table('tbl_transaksi as t')
            ->join('tbl_pelanggan as p', 't.id_pelanggan', '=', 'p.id_pelanggan')
            ->whereIn('t.tipe_pesanan', ['delivery', 'dine_in'])
            ->whereNotIn('t.id_pelanggan', DB::table('tbl_pelanggan')->select('id_pelanggan')->whereIn('nama_pelanggan', $testCustomerNames))
            ->select([
                't.id_transaksi',
                't.tanggal',
                't.total_belanja',
                't.status_pesanan',
                't.tipe_pesanan',
                't.metode_pembayaran',
                't.catatan',
                'p.nama_pelanggan',
                'p.kota',
            ])
            ->orderByRaw("FIELD(t.status_pesanan, 'menunggu_kasir', 'siap_kasir', 'menunggu_chef', 'dimasak', 'selesai')")
            ->orderByDesc('t.tanggal')
            ->orderByDesc('t.id_transaksi')
            ->limit(40)
            ->get();

        $txIds = $rawOrders->pluck('id_transaksi')->all();
        $details = [];

        if (! empty($txIds)) {
            $rawDetails = DB::table('tbl_detail_transaksi')
                ->whereIn('id_transaksi', $txIds)
                ->get();

            foreach ($rawDetails as $d) {
                $details[$d->id_transaksi][] = [
                    'nama_produk' => $d->nama_produk,
                    'jumlah' => (int) $d->jumlah,
                    'harga' => (float) $d->harga,
                ];
            }
        }

        $orders = $rawOrders->map(function ($order) use ($details) {
            $items = $details[$order->id_transaksi] ?? [];

            return [
                'id_transaksi' => (int) $order->id_transaksi,
                'tanggal' => $order->tanggal,
                'nama_pelanggan' => $order->nama_pelanggan,
                'kota' => $order->kota,
                'status_pesanan' => $order->status_pesanan,
                'tipe_pesanan' => $order->tipe_pesanan,
                'metode_pembayaran' => $order->metode_pembayaran,
                'catatan' => $order->catatan,
                'total_belanja' => (float) $order->total_belanja,
                'items' => $items,
                'total_items' => array_sum(array_column($items, 'jumlah')),
            ];
        })->all();

        return Inertia::render('Admin/OrderMakanan', [
            'username' => $request->session()->get('user_username', $isKasir ? 'Kasir' : 'Admin'),
            'userRole' => $role,
            'activePage' => 'order-makanan',
            'stats' => $stats,
            'orders' => $orders,
        ]);
    }

    /**
     * Update status pesanan delivery oleh Kasir (menunggu_kasir -> menunggu_chef, siap_kasir -> selesai)
     */
    public function updateOrderStatus(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'status_pesanan' => 'required|in:menunggu_chef,selesai',
        ]);

        $order = DB::table('tbl_transaksi')->where('id_transaksi', $id)->first();
        if (! $order) {
            return redirect()->back()->with('error', "Pesanan #{$id} tidak ditemukan.");
        }

        $nextStatus = $validated['status_pesanan'];
        $allowed = [
            'menunggu_kasir' => 'menunggu_chef',
            'siap_kasir' => 'selesai',
        ];

        if (($allowed[$order->status_pesanan] ?? null) !== $nextStatus) {
            return redirect()->back()->with('error', "Transisi status pesanan #{$id} tidak valid.");
        }

        $kasirName = $request->session()->get('user_username', 'Kasir');
        $kasirId = $request->session()->get('user_id');

        DB::table('tbl_transaksi')
            ->where('id_transaksi', $id)
            ->update([
                'status_pesanan' => $nextStatus,
                'id_user' => $order->id_user ?? $kasirId,
            ]);

        $logText = $nextStatus === 'menunggu_chef'
            ? "Kasir ({$kasirName}) konfirmasi pembayaran & meneruskan Pesanan #{$id} ke Chef"
            : "Kasir ({$kasirName}) menyerahkan Pesanan #{$id} ke pelanggan (Selesai)";

        DB::table('tbl_log')->insert([
            'aktivitas' => $logText,
            'waktu' => now(),
        ]);

        $msg = $nextStatus === 'menunggu_chef'
            ? "Pesanan #{$id} berhasil dikonfirmasi dan diteruskan ke dapur (Chef)!"
            : "Pesanan #{$id} telah diserahkan ke pelanggan dan selesai!";

        return redirect()->back()->with('success', $msg);
    }

    public function storeTransaksi(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $validated = $request->validate([
            'id_pelanggan' => 'required|integer|exists:tbl_pelanggan,id_pelanggan',
            'items' => 'required|array|min:1',
            'items.*.nama_produk' => 'required|string',
            'items.*.qty' => 'required|integer|min:1',
            'diskon_persen' => 'nullable|numeric|min:0|max:100',
            'metode_pembayaran' => 'required|in:Tunai,QRIS,BCA,BRI',
            'nominal_bayar' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction(); // TCL START
        try {
            $totalSubtotal = 0;
            $itemsToInsert = [];
            $discountPercent = (float) ($validated['diskon_persen'] ?? 0);

            foreach ($validated['items'] as $item) {
                // Lock row for update to prevent race condition on stock
                $prod = DB::table('tbl_produk')
                    ->where('nama_produk', $item['nama_produk'])
                    ->lockForUpdate()
                    ->first();

                if (! $prod) {
                    throw new \Exception("Produk '{$item['nama_produk']}' tidak ditemukan.");
                }

                if ($prod->stok < $item['qty']) {
                    throw new \Exception("Stok {$prod->nama_produk} tidak mencukupi (Tersisa {$prod->stok}).");
                }

                // Stored Function HitungTotal(harga, jumlah)
                $calcTotal = DB::selectOne('SELECT HitungTotal(?, ?) AS line_total', [$prod->harga, $item['qty']]);
                $lineTotal = (float) ($calcTotal->line_total ?? ($prod->harga * $item['qty']));
                $totalSubtotal += $lineTotal;

                $itemsToInsert[] = [
                    'nama_produk' => $prod->nama_produk,
                    'jumlah' => $item['qty'],
                    'harga' => $prod->harga,
                ];
            }

            // Stored Function HitungDiskon
            $calcDiscount = DB::selectOne('SELECT HitungDiskon(?, ?) AS potongan', [$totalSubtotal, $discountPercent]);
            $potongan = (float) ($calcDiscount->potongan ?? 0);
            $totalAkhir = round($totalSubtotal - $potongan, 2);

            $metodePembayaran = $validated['metode_pembayaran'];
            $isDuitku = $metodePembayaran !== 'Tunai';
            $duitkuPaymentMethod = match ($metodePembayaran) {
                'QRIS' => 'SP',
                'BCA' => 'BC',
                'BRI' => 'BR',
                default => null,
            };

            // Insert tbl_transaksi (fires before_insert_transaksi trigger)
            $transaksiId = DB::table('tbl_transaksi')->insertGetId([
                'tanggal' => now()->toDateString(),
                'id_pelanggan' => $validated['id_pelanggan'],
                'id_user' => $request->session()->get('user_id'),
                'total_belanja' => $totalAkhir,
                'status_pesanan' => $isDuitku ? 'menunggu_chef' : 'selesai',
                'tipe_pesanan' => 'kasir_pos',
                'metode_pembayaran' => $isDuitku ? 'duitku' : 'tunai',
                'payment_status' => $isDuitku ? 'pending' : 'paid',
                'catatan' => 'Transaksi Langsung Kasir (POS)',
            ]);

            // Insert tbl_detail_transaksi (fires after_insert_detail trigger: reduce stock & tbl_log)
            foreach ($itemsToInsert as $ins) {
                DB::table('tbl_detail_transaksi')->insert([
                    'id_transaksi' => $transaksiId,
                    'nama_produk' => $ins['nama_produk'],
                    'jumlah' => $ins['jumlah'],
                    'harga' => $ins['harga'],
                ]);
            }

            if ($isDuitku) {
                $duitkuService = app(DuitkuService::class);
                $orderId = 'GM-'.$transaksiId.'-'.time();
                $pelanggan = Pelanggan::find($validated['id_pelanggan']);

                $duitkuRes = $duitkuService->createInvoice([
                    'order_id' => $orderId,
                    'amount' => $totalAkhir,
                    'product_details' => "Transaksi POS Kasir #{$transaksiId}",
                    'customer_name' => $pelanggan?->nama_pelanggan ?? 'Pelanggan POS',
                    'payment_method' => $duitkuPaymentMethod,
                    'return_url' => $request->getSchemeAndHttpHost().route('duitku.return', [], false),
                ]);

                if ($duitkuRes['success'] && ! empty($duitkuRes['payment_url'])) {
                    DB::table('tbl_transaksi')
                        ->where('id_transaksi', $transaksiId)
                        ->update([
                            'payment_reference' => $duitkuRes['reference'] ?? null,
                            'payment_url' => $duitkuRes['payment_url'],
                        ]);

                    DB::commit();

                    return Inertia::location($duitkuRes['payment_url']);
                }

                throw new \Exception('Duitku Gateway: '.($duitkuRes['message'] ?? 'Gagal membuat tagihan Duitku. Silakan periksa kredensial Duitku.'));
            }

            DB::commit();

            $nominalBayar = (float) ($validated['nominal_bayar'] ?? $totalAkhir);
            $kembalian = max(0, round($nominalBayar - $totalAkhir, 2));

            $pelanggan = Pelanggan::find($validated['id_pelanggan']);

            $receipt = [
                'id_transaksi' => $transaksiId,
                'tanggal' => now()->format('d/m/Y H:i'),
                'kasir' => $request->session()->get('user_username', 'Admin'),
                'pelanggan' => [
                    'id_pelanggan' => $pelanggan?->id_pelanggan ?? $validated['id_pelanggan'],
                    'nama_pelanggan' => $pelanggan?->nama_pelanggan ?? 'Pelanggan',
                    'kota' => $pelanggan?->kota ?? '-',
                ],
                'items' => array_map(fn ($ins) => [
                    'nama_produk' => $ins['nama_produk'],
                    'jumlah' => $ins['jumlah'],
                    'harga' => (float) $ins['harga'],
                    'subtotal' => round((float) $ins['harga'] * $ins['jumlah'], 2),
                ], $itemsToInsert),
                'subtotal' => round($totalSubtotal, 2),
                'diskon_persen' => $discountPercent,
                'potongan' => round($potongan, 2),
                'total' => $totalAkhir,
                'metode_pembayaran' => $metodePembayaran,
                'nominal_bayar' => $nominalBayar,
                'kembalian' => $kembalian,
            ];

            return redirect()->back()
                ->with('success', "Transaksi POS #{$transaksiId} berhasil diproses. Total: Rp ".number_format($totalAkhir, 0, ',', '.'))
                ->with('receipt', $receipt);
        } catch (\Throwable $e) {
            DB::rollBack();

            return redirect()->back()->with('error', 'Gagal memproses transaksi: '.$e->getMessage());
        }
    }

    /**
     * 4. Produk Management (View view_katalog_produk, add product, update stock/price, index EXPLAIN)
     */
    public function produk(Request $request): Response
    {
        $products = DB::select('
            SELECT 
                p.id_produk,
                p.id_kategori,
                k.nama_kategori,
                p.nama_produk,
                p.barcode,
                p.image,
                p.harga,
                p.stok,
                COALESCE((SELECT SUM(jumlah) FROM tbl_detail_transaksi WHERE nama_produk = p.nama_produk), 0) AS terjual
            FROM tbl_produk p
            JOIN tbl_kategori k ON p.id_kategori = k.id_kategori
            ORDER BY p.id_produk DESC
        ');

        $categories = DB::table('tbl_kategori as k')
            ->select('k.id_kategori', 'k.nama_kategori', DB::raw('(SELECT COUNT(*) FROM tbl_produk WHERE id_kategori = k.id_kategori) as total_produk'))
            ->orderBy('k.id_kategori')
            ->get();

        return Inertia::render('Admin/Produk', [
            'username' => $request->session()->get('user_username', 'Admin'),
            'activePage' => 'produk',
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    public function storeProduk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id_kategori' => 'required|integer|exists:tbl_kategori,id_kategori',
            'nama_produk' => 'required|string|max:100|unique:tbl_produk,nama_produk',
            'barcode' => 'nullable|string|max:50|unique:tbl_produk,barcode',
            'image' => 'nullable|string|max:500',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
            'harga' => 'required|numeric|min:0.01',
            'stok' => 'required|integer|min:0',
        ]);

        $imagePath = $request->input('image');
        if ($request->hasFile('image_file')) {
            $storedPath = $request->file('image_file')->store('products', 'public');
            $imagePath = '/storage/'.$storedPath;
        }

        $validated['image'] = $imagePath;
        unset($validated['image_file']);

        Produk::create($validated);

        DB::table('tbl_log')->insert([
            'aktivitas' => "Produk baru ditambahkan: {$validated['nama_produk']} (Barcode: ".($validated['barcode'] ?? '-').", Stok: {$validated['stok']})",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Produk '{$validated['nama_produk']}' berhasil ditambahkan.");
    }

    public function updateProduk(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'id_kategori' => 'required|integer|exists:tbl_kategori,id_kategori',
            'nama_produk' => 'required|string|max:100|unique:tbl_produk,nama_produk,'.$id.',id_produk',
            'barcode' => 'nullable|string|max:50|unique:tbl_produk,barcode,'.$id.',id_produk',
            'image' => 'nullable|string|max:500',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
            'harga' => 'required|numeric|min:0.01',
            'stok' => 'required|integer|min:0',
        ]);

        $prod = Produk::findOrFail($id);

        $imagePath = $request->input('image', $prod->image);
        if ($request->hasFile('image_file')) {
            $storedPath = $request->file('image_file')->store('products', 'public');
            $imagePath = '/storage/'.$storedPath;
        }

        $validated['image'] = $imagePath;
        unset($validated['image_file']);

        $prod->update($validated);

        DB::table('tbl_log')->insert([
            'aktivitas' => "Produk diperbarui: {$validated['nama_produk']} (Barcode: ".($validated['barcode'] ?? '-').", Harga: {$validated['harga']}, Stok: {$validated['stok']})",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Produk '{$prod->nama_produk}' berhasil diperbarui.");
    }

    public function destroyProduk(int $id): RedirectResponse
    {
        $prod = Produk::findOrFail($id);
        $nama = $prod->nama_produk;

        if ($prod->image && str_starts_with($prod->image, '/storage/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $prod->image));
        }

        $prod->delete();

        DB::table('tbl_log')->insert([
            'aktivitas' => "Produk dihapus: {$nama} (ID: {$id})",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Produk '{$nama}' berhasil dihapus.");
    }

    /**
     * Halaman Khusus Manajemen Kategori Produk
     */
    public function kategori(Request $request): Response
    {
        $categories = DB::select('
            SELECT k.id_kategori, k.nama_kategori, COUNT(p.id_produk) as total_produk
            FROM tbl_kategori k
            LEFT JOIN tbl_produk p ON k.id_kategori = p.id_kategori
            GROUP BY k.id_kategori, k.nama_kategori
            ORDER BY k.id_kategori ASC
        ');

        $totalProduk = DB::table('tbl_produk')->count();

        return Inertia::render('Admin/Kategori', [
            'username' => $request->session()->get('user_username', 'Admin'),
            'activePage' => 'kategori',
            'categories' => $categories,
            'totalProduk' => $totalProduk,
        ]);
    }

    public function storeKategori(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_kategori' => 'required|string|max:50|unique:tbl_kategori,nama_kategori',
        ]);

        $kat = Kategori::create($validated);

        DB::table('tbl_log')->insert([
            'aktivitas' => "Kategori baru ditambahkan: {$kat->nama_kategori}",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Kategori '{$kat->nama_kategori}' berhasil ditambahkan.");
    }

    public function updateKategori(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'nama_kategori' => 'required|string|max:50|unique:tbl_kategori,nama_kategori,'.$id.',id_kategori',
        ]);

        $kat = Kategori::findOrFail($id);
        $oldName = $kat->nama_kategori;
        $kat->update($validated);

        DB::table('tbl_log')->insert([
            'aktivitas' => "Kategori diperbarui: {$oldName} -> {$kat->nama_kategori}",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Kategori '{$kat->nama_kategori}' berhasil diperbarui.");
    }

    public function destroyKategori(int $id): RedirectResponse
    {
        $kat = Kategori::findOrFail($id);
        $totalProduk = DB::table('tbl_produk')->where('id_kategori', $id)->count();

        if ($totalProduk > 0) {
            return redirect()->back()->with('error', "Kategori '{$kat->nama_kategori}' tidak dapat dihapus karena masih digunakan oleh {$totalProduk} produk.");
        }

        $nama = $kat->nama_kategori;
        $kat->delete();

        DB::table('tbl_log')->insert([
            'aktivitas' => "Kategori dihapus: {$nama}",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Kategori '{$nama}' berhasil dihapus.");
    }

    /**
     * Halaman Atur Shift Kasir (Pengganti POS di Panel Admin)
     */
    public function shift(Request $request): Response
    {
        $shifts = DB::table('tbl_shift_kasir as s')
            ->join('tbl_users as u', 's.id_user', '=', 'u.id_user')
            ->select([
                's.id_shift',
                's.id_user',
                'u.username as nama_kasir',
                's.nama_shift',
                's.tanggal',
                's.jam_mulai',
                's.jam_selesai',
                's.saldo_awal',
                's.saldo_akhir',
                's.status',
                's.catatan',
                's.created_at',
            ])
            ->orderByDesc('s.tanggal')
            ->orderByDesc('s.id_shift')
            ->get();

        $kasirUsers = DB::table('tbl_users')
            ->where('role', 'kasir')
            ->select('id_user', 'username', 'created_at')
            ->orderBy('username')
            ->get();

        $stats = [
            'shift_aktif' => DB::table('tbl_shift_kasir')->where('status', 'aktif')->count(),
            'shift_terjadwal' => DB::table('tbl_shift_kasir')->where('status', 'terjadwal')->count(),
            'shift_selesai' => DB::table('tbl_shift_kasir')->where('status', 'selesai')->count(),
            'total_kasir' => $kasirUsers->count(),
        ];

        return Inertia::render('Admin/ShiftKasir', [
            'username' => $request->session()->get('user_username', 'Admin'),
            'activePage' => 'shift',
            'shifts' => $shifts,
            'kasirUsers' => $kasirUsers,
            'stats' => $stats,
        ]);
    }

    public function storeShift(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id_user' => ['required', 'integer', Rule::exists('tbl_users', 'id_user')->where('role', 'kasir')],
            'nama_shift' => 'required|string|max:50',
            'tanggal' => 'required|date',
            'jam_mulai' => 'required',
            'jam_selesai' => 'required',
            'saldo_awal' => 'required|numeric|min:0',
            'status' => 'required|in:terjadwal,aktif,selesai',
            'catatan' => 'nullable|string|max:500',
        ]);

        ShiftKasir::create($validated);
        $kasir = User::find($validated['id_user']);

        DB::table('tbl_log')->insert([
            'aktivitas' => "Jadwal shift kasir {$kasir?->username} ({$validated['nama_shift']}) pada {$validated['tanggal']} ditambahkan.",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Shift untuk kasir '{$kasir?->username}' berhasil dijadwalkan.");
    }

    public function storeKasirUser(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|min:3|max:50|alpha_dash|unique:tbl_users,username',
            'password' => 'required|string|min:4|max:100',
        ]);

        $user = User::create([
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'role' => 'kasir',
        ]);

        DB::table('tbl_log')->insert([
            'aktivitas' => "Akun kasir baru ditambahkan: {$user->username}",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Akun kasir '@{$user->username}' berhasil dibuat.");
    }

    public function updateShift(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'id_user' => ['required', 'integer', Rule::exists('tbl_users', 'id_user')->where('role', 'kasir')],
            'nama_shift' => 'required|string|max:50',
            'tanggal' => 'required|date',
            'jam_mulai' => 'required',
            'jam_selesai' => 'required',
            'saldo_awal' => 'required|numeric|min:0',
            'saldo_akhir' => 'nullable|numeric|min:0',
            'status' => 'required|in:terjadwal,aktif,selesai',
            'catatan' => 'nullable|string|max:500',
        ]);

        $shift = ShiftKasir::findOrFail($id);
        $shift->update($validated);

        DB::table('tbl_log')->insert([
            'aktivitas' => "Shift #{$id} ({$shift->nama_shift}) diperbarui: Status {$shift->status}.",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Data shift #{$id} berhasil diperbarui.");
    }

    public function closeShift(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'saldo_akhir' => 'required|numeric|min:0',
            'catatan' => 'nullable|string|max:500',
        ]);

        $shift = ShiftKasir::findOrFail($id);
        $shift->update([
            'saldo_akhir' => $validated['saldo_akhir'],
            'status' => 'selesai',
            'catatan' => $validated['catatan'] ?? $shift->catatan,
        ]);

        DB::table('tbl_log')->insert([
            'aktivitas' => "Shift #{$id} ({$shift->nama_shift}) diselesaikan dengan saldo akhir Rp ".number_format($validated['saldo_akhir'], 0, ',', '.').'.',
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Shift #{$id} berhasil ditutup dan diselesaikan.");
    }

    public function destroyShift(int $id): RedirectResponse
    {
        $shift = ShiftKasir::findOrFail($id);
        $nama = $shift->nama_shift;
        $shift->delete();

        DB::table('tbl_log')->insert([
            'aktivitas' => "Shift #{$id} ({$nama}) dihapus.",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', 'Jadwal shift berhasil dihapus.');
    }

    /**
     * 5. Laporan Penjualan Bisnis POS
     */
    public function laporan(Request $request): Response
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $trxQuery = DB::table('tbl_transaksi as t');
        if ($startDate) {
            $trxQuery->whereDate('t.tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $trxQuery->whereDate('t.tanggal', '<=', $endDate);
        }

        $summary = (clone $trxQuery)
            ->selectRaw('
                COUNT(t.id_transaksi) as total_transaksi,
                COALESCE(SUM(t.total_belanja), 0) as total_omzet,
                COALESCE(AVG(t.total_belanja), 0) as avg_transaksi
            ')
            ->first();

        $detailQuery = DB::table('tbl_detail_transaksi as d')
            ->join('tbl_transaksi as t', 'd.id_transaksi', '=', 't.id_transaksi');
        if ($startDate) {
            $detailQuery->whereDate('t.tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $detailQuery->whereDate('t.tanggal', '<=', $endDate);
        }

        $totalItemTerjual = (int) (clone $detailQuery)->sum('d.jumlah');

        $topProducts = (clone $detailQuery)
            ->select('d.nama_produk')
            ->selectRaw('SUM(d.jumlah) as total_qty, SUM(d.jumlah * d.harga) as total_omzet')
            ->groupBy('d.nama_produk')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        $dailyTrend = (clone $trxQuery)
            ->select('t.tanggal')
            ->selectRaw('COUNT(t.id_transaksi) as total_transaksi, SUM(t.total_belanja) as total_omzet')
            ->groupBy('t.tanggal')
            ->orderBy('t.tanggal', 'asc')
            ->get();

        $transactionsQuery = DB::table('tbl_transaksi as t')
            ->leftJoin('tbl_pelanggan as p', 't.id_pelanggan', '=', 'p.id_pelanggan')
            ->leftJoin('tbl_detail_transaksi as d', 't.id_transaksi', '=', 'd.id_transaksi');

        if ($startDate) {
            $transactionsQuery->whereDate('t.tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $transactionsQuery->whereDate('t.tanggal', '<=', $endDate);
        }

        $transactions = $transactionsQuery
            ->select(
                't.id_transaksi',
                't.tanggal',
                'p.nama_pelanggan',
                'p.kota',
                't.total_belanja'
            )
            ->selectRaw("GROUP_CONCAT(CONCAT(d.nama_produk, ' (', d.jumlah, ')') SEPARATOR ', ') as rincian")
            ->selectRaw('COALESCE(SUM(d.jumlah), 0) as total_items')
            ->groupBy('t.id_transaksi', 't.tanggal', 'p.nama_pelanggan', 'p.kota', 't.total_belanja')
            ->orderByDesc('t.tanggal')
            ->orderByDesc('t.id_transaksi')
            ->get();

        return Inertia::render('Admin/Laporan', [
            'username' => $request->session()->get('user_username', 'Admin'),
            'activePage' => 'laporan',
            'summary' => [
                'total_omzet' => (float) ($summary->total_omzet ?? 0),
                'total_transaksi' => (int) ($summary->total_transaksi ?? 0),
                'total_item' => $totalItemTerjual,
                'avg_transaksi' => (float) ($summary->avg_transaksi ?? 0),
            ],
            'dailyTrend' => $dailyTrend,
            'topProducts' => $topProducts,
            'transactions' => $transactions,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate ?? '',
            ],
        ]);
    }

    /**
     * Export Laporan Penjualan ke Excel (CSV UTF-8 Spreadsheet)
     */
    public function exportLaporanExcel(Request $request): StreamedResponse
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = DB::table('tbl_transaksi as t')
            ->leftJoin('tbl_pelanggan as p', 't.id_pelanggan', '=', 'p.id_pelanggan')
            ->leftJoin('tbl_detail_transaksi as d', 't.id_transaksi', '=', 'd.id_transaksi');

        if ($startDate) {
            $query->whereDate('t.tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('t.tanggal', '<=', $endDate);
        }

        $transactions = $query
            ->select(
                't.id_transaksi',
                't.tanggal',
                'p.nama_pelanggan',
                'p.kota',
                't.total_belanja'
            )
            ->selectRaw("GROUP_CONCAT(CONCAT(d.nama_produk, ' (', d.jumlah, ')') SEPARATOR ', ') as rincian")
            ->selectRaw('COALESCE(SUM(d.jumlah), 0) as total_items')
            ->groupBy('t.id_transaksi', 't.tanggal', 'p.nama_pelanggan', 'p.kota', 't.total_belanja')
            ->orderByDesc('t.tanggal')
            ->orderByDesc('t.id_transaksi')
            ->get();

        $filename = 'laporan-penjualan-'.($startDate ?: 'awal').'-sd-'.($endDate ?: date('Y-m-d')).'.csv';

        return response()->streamDownload(function () use ($transactions) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['No. Struk', 'Tanggal', 'Nama Pelanggan', 'Kota', 'Rincian Menu', 'Jumlah Item', 'Total Belanja']);

            $totalQty = 0;
            $totalOmzet = 0;

            foreach ($transactions as $t) {
                $totalQty += (int) $t->total_items;
                $totalOmzet += (float) $t->total_belanja;

                fputcsv($handle, [
                    '#'.$t->id_transaksi,
                    $t->tanggal,
                    $t->nama_pelanggan ?: 'Umum',
                    $t->kota ?: '-',
                    $t->rincian ?: '-',
                    $t->total_items,
                    $t->total_belanja,
                ]);
            }

            fputcsv($handle, []);
            fputcsv($handle, ['Total', '', '', '', 'Total Keseluruhan', $totalQty, $totalOmzet]);

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Export Laporan Penjualan ke Download File .PDF Asli
     */
    public function exportLaporanPdf(Request $request): HttpResponse
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $trxQuery = DB::table('tbl_transaksi as t');
        if ($startDate) {
            $trxQuery->whereDate('t.tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $trxQuery->whereDate('t.tanggal', '<=', $endDate);
        }

        $summary = (clone $trxQuery)
            ->selectRaw('
                COUNT(t.id_transaksi) as total_transaksi,
                COALESCE(SUM(t.total_belanja), 0) as total_omzet,
                COALESCE(AVG(t.total_belanja), 0) as avg_transaksi
            ')
            ->first();

        $detailQuery = DB::table('tbl_detail_transaksi as d')
            ->join('tbl_transaksi as t', 'd.id_transaksi', '=', 't.id_transaksi');
        if ($startDate) {
            $detailQuery->whereDate('t.tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $detailQuery->whereDate('t.tanggal', '<=', $endDate);
        }

        $totalItemTerjual = (int) (clone $detailQuery)->sum('d.jumlah');

        $topProducts = (clone $detailQuery)
            ->select('d.nama_produk')
            ->selectRaw('SUM(d.jumlah) as total_qty, SUM(d.jumlah * d.harga) as total_omzet')
            ->groupBy('d.nama_produk')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        $transactionsQuery = DB::table('tbl_transaksi as t')
            ->leftJoin('tbl_pelanggan as p', 't.id_pelanggan', '=', 'p.id_pelanggan')
            ->leftJoin('tbl_detail_transaksi as d', 't.id_transaksi', '=', 'd.id_transaksi');

        if ($startDate) {
            $transactionsQuery->whereDate('t.tanggal', '>=', $startDate);
        }
        if ($endDate) {
            $transactionsQuery->whereDate('t.tanggal', '<=', $endDate);
        }

        $transactions = $transactionsQuery
            ->select(
                't.id_transaksi',
                't.tanggal',
                'p.nama_pelanggan',
                'p.kota',
                't.total_belanja'
            )
            ->selectRaw("GROUP_CONCAT(CONCAT(d.nama_produk, ' (', d.jumlah, ')') SEPARATOR ', ') as rincian")
            ->selectRaw('COALESCE(SUM(d.jumlah), 0) as total_items')
            ->groupBy('t.id_transaksi', 't.tanggal', 'p.nama_pelanggan', 'p.kota', 't.total_belanja')
            ->orderByDesc('t.tanggal')
            ->orderByDesc('t.id_transaksi')
            ->get();

        $filename = 'laporan-penjualan-'.($startDate ?: 'awal').'-sd-'.($endDate ?: date('Y-m-d')).'.pdf';

        $pdf = Pdf::loadView('laporan_pdf', [
            'summary' => [
                'total_omzet' => (float) ($summary->total_omzet ?? 0),
                'total_transaksi' => (int) ($summary->total_transaksi ?? 0),
                'total_item' => $totalItemTerjual,
                'avg_transaksi' => (float) ($summary->avg_transaksi ?? 0),
            ],
            'topProducts' => $topProducts,
            'transactions' => $transactions,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ])->setPaper('a4', 'landscape');

        return $pdf->download($filename);
    }

    /**
     * 7. Meja & QR Code
     */
    public function meja(Request $request): Response
    {
        $tables = Meja::orderBy('nomor_meja')->get();

        $stats = [
            'total' => $tables->count(),
            'tersedia' => $tables->where('status', 'tersedia')->count(),
            'terisi' => $tables->where('status', 'terisi')->count(),
            'nonaktif' => $tables->where('status', 'nonaktif')->count(),
        ];

        return Inertia::render('Admin/Meja', [
            'username' => $request->session()->get('user_username', 'Admin'),
            'activePage' => 'meja',
            'tables' => $tables,
            'stats' => $stats,
            'baseUrl' => url('/'),
        ]);
    }

    public function storeMeja(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nomor_meja' => 'required|string|max:50|unique:tbl_meja,nomor_meja',
            'kapasitas' => 'required|integer|min:1|max:50',
            'catatan' => 'nullable|string|max:120',
        ]);

        $validated['kode_qr'] = Meja::generateUniqueCode();
        $validated['status'] = 'tersedia';

        $meja = Meja::create($validated);

        DB::table('tbl_log')->insert([
            'aktivitas' => "Meja baru ditambahkan: {$meja->nomor_meja} (Kapasitas: {$meja->kapasitas}, Kode: {$meja->kode_qr})",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Meja '{$meja->nomor_meja}' berhasil dibuat.");
    }

    public function updateMeja(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'nomor_meja' => 'required|string|max:50|unique:tbl_meja,nomor_meja,'.$id.',id_meja',
            'kapasitas' => 'required|integer|min:1|max:50',
            'status' => 'required|in:tersedia,terisi,nonaktif',
            'catatan' => 'nullable|string|max:120',
        ]);

        $meja = Meja::findOrFail($id);
        $meja->update($validated);

        DB::table('tbl_log')->insert([
            'aktivitas' => "Meja diperbarui: {$meja->nomor_meja} (Status: {$meja->status}, Kapasitas: {$meja->kapasitas})",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Meja '{$meja->nomor_meja}' berhasil diperbarui.");
    }

    public function regenerateQrMeja(Request $request, int $id): RedirectResponse
    {
        $meja = Meja::findOrFail($id);
        $oldCode = $meja->kode_qr;
        $meja->kode_qr = Meja::generateUniqueCode();
        $meja->save();

        DB::table('tbl_log')->insert([
            'aktivitas' => "QR Code meja di-generate ulang: {$meja->nomor_meja} ({$oldCode} -> {$meja->kode_qr})",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "QR Code baru untuk '{$meja->nomor_meja}' berhasil dibuat.");
    }

    public function destroyMeja(int $id): RedirectResponse
    {
        $meja = Meja::findOrFail($id);
        $nomor = $meja->nomor_meja;
        $meja->delete();

        DB::table('tbl_log')->insert([
            'aktivitas' => "Meja dihapus: {$nomor}",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Meja '{$nomor}' berhasil dihapus.");
    }
}
