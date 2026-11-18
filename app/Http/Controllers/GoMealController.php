<?php

namespace App\Http\Controllers;

use App\Models\Meja;
use App\Models\Pelanggan;
use App\Models\Produk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GoMealController extends Controller
{
    private const DEFAULT_WALLET_BALANCE = 250000.0;

    private const DELIVERY_FEE = 10000.0;

    /**
     * Map dish name to visual attributes (Unsplash image, cooking time, ratings).
     *
     * @return array{image: string, time: string, rating: float, reviews: string}
     */
    private function getDishMeta(string $name): array
    {
        $meta = [
            'Fish Burger' => [
                'image' => 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
                'time' => '25 min',
                'rating' => 4.8,
                'reviews' => '1k+',
            ],
            'Beef Burger' => [
                'image' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
                'time' => '30 min',
                'rating' => 4.9,
                'reviews' => '2k+',
            ],
            'Cheese Burger' => [
                'image' => 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=400&q=80',
                'time' => '20 min',
                'rating' => 4.7,
                'reviews' => '1k+',
            ],
            'Margherita Pizza' => [
                'image' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
                'time' => '25 min',
                'rating' => 4.9,
                'reviews' => '3k+',
            ],
            'Spicy Ramen' => [
                'image' => 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
                'time' => '20 min',
                'rating' => 4.8,
                'reviews' => '1.5k+',
            ],
            'Garden Bowl' => [
                'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
                'time' => '15 min',
                'rating' => 4.6,
                'reviews' => '800+',
            ],
            'Pepperoni Pizza' => [
                'image' => 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80',
                'time' => '25 min',
                'rating' => 4.9,
                'reviews' => '2.4k+',
            ],
            'Crispy Chicken' => [
                'image' => 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80',
                'time' => '20 min',
                'rating' => 4.8,
                'reviews' => '1.8k+',
            ],
            'Croissant Butter' => [
                'image' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
                'time' => '10 min',
                'rating' => 4.7,
                'reviews' => '950+',
            ],
            'Iced Lemon Tea' => [
                'image' => 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
                'time' => '5 min',
                'rating' => 4.9,
                'reviews' => '3k+',
            ],
            'Grilled Salmon' => [
                'image' => 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
                'time' => '35 min',
                'rating' => 4.9,
                'reviews' => '1.2k+',
            ],
            'Shrimp Basket' => [
                'image' => 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=400&q=80',
                'time' => '25 min',
                'rating' => 4.7,
                'reviews' => '900+',
            ],
        ];

        return $meta[$name] ?? [
            'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
            'time' => '20 min',
            'rating' => 4.8,
            'reviews' => '1k+',
        ];
    }

    /**
     * Resolve logged-in customer profile, membership tier, wallet balance, and delivery address.
     *
     * @return array{
     *     model: Pelanggan,
     *     customer: array{id_pelanggan: int, nama_pelanggan: string, kota: string|null, tier: string, progress: int, total_belanja: float, total_transaksi: int},
     *     walletBalance: float,
     *     address: array{street: string, detail: string, city: string}
     * }
     */
    private function getCustomerContext(Request $request): array
    {
        $customer = Pelanggan::find($request->session()->get('pelanggan_id'))
            ?? Pelanggan::firstOrFail();

        $tierInfo = DB::selectOne('
            SELECT
                total_transaksi,
                total_belanja,
                KategoriBelanja(total_belanja) AS tier,
                HitungProgresTier(total_belanja) AS progress
            FROM view_total_belanja
            WHERE id_pelanggan = ?
        ', [$customer->id_pelanggan]) ?? (object) [
            'total_transaksi' => 0,
            'total_belanja' => 0,
            'tier' => 'Bronze member',
            'progress' => 25,
        ];

        $walletBalance = (float) $request->session()->get('gomeal_balance', self::DEFAULT_WALLET_BALANCE);

        $address = $request->session()->get('gomeal_address', [
            'street' => 'Jl. Raya Darmo No. 23',
            'detail' => 'Dekat taman kota, pagar hitam — hubungi saat tiba.',
            'city' => $customer->kota ?? 'Surabaya',
        ]);

        return [
            'model' => $customer,
            'customer' => [
                'id_pelanggan' => (int) $customer->id_pelanggan,
                'nama_pelanggan' => $customer->nama_pelanggan,
                'kota' => $customer->kota,
                'tier' => $tierInfo->tier ?? 'Bronze member',
                'progress' => (int) ($tierInfo->progress ?? 25),
                'total_belanja' => (float) ($tierInfo->total_belanja ?? 0),
                'total_transaksi' => (int) ($tierInfo->total_transaksi ?? 0),
            ],
            'walletBalance' => $walletBalance,
            'address' => $address,
        ];
    }

    /**
     * Fetch product catalog and categories with visual metadata.
     *
     * @return array{categories: Collection, products: array<int, array<string, mixed>>}
     */
    private function getCatalog(): array
    {
        $categories = DB::table('tbl_kategori')->orderBy('id_kategori')->get();

        $productsRaw = DB::select('SELECT * FROM view_katalog_produk ORDER BY id_produk ASC');
        $products = array_map(function ($p) {
            $meta = $this->getDishMeta($p->nama_produk);

            return [
                'id_produk' => (int) $p->id_produk,
                'id_kategori' => (int) $p->id_kategori,
                'nama_kategori' => $p->nama_kategori,
                'nama_produk' => $p->nama_produk,
                'harga' => (float) $p->harga,
                'stok' => (int) $p->stok,
                'image' => ! empty($p->image) ? $p->image : $meta['image'],
                'time' => $meta['time'],
                'rating' => $meta['rating'],
                'reviews' => $meta['reviews'],
            ];
        }, $productsRaw);

        return [
            'categories' => $categories,
            'products' => $products,
        ];
    }

    /**
     * Fetch customer's order history with status and itemized breakdown.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getCustomerOrders(int $customerId, int $limit = 30): array
    {
        $ordersRaw = DB::table('tbl_transaksi as t')
            ->join('tbl_pelanggan as p', 't.id_pelanggan', '=', 'p.id_pelanggan')
            ->where('t.id_pelanggan', $customerId)
            ->whereIn('t.tipe_pesanan', ['delivery', 'dine_in'])
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
            ->orderByDesc('t.tanggal')
            ->orderByDesc('t.id_transaksi')
            ->limit($limit)
            ->get();

        $txIds = $ordersRaw->pluck('id_transaksi')->all();
        $detailsByTx = [];

        if (! empty($txIds)) {
            $details = DB::table('tbl_detail_transaksi as dt')
                ->leftJoin('tbl_produk as p', 'dt.nama_produk', '=', 'p.nama_produk')
                ->whereIn('dt.id_transaksi', $txIds)
                ->select([
                    'dt.id_transaksi',
                    'dt.nama_produk',
                    'dt.jumlah',
                    'dt.harga',
                    'p.image',
                ])
                ->get();

            foreach ($details as $d) {
                $meta = $this->getDishMeta($d->nama_produk);
                $detailsByTx[$d->id_transaksi][] = [
                    'nama_produk' => $d->nama_produk,
                    'jumlah' => (int) $d->jumlah,
                    'harga' => (float) $d->harga,
                    'subtotal' => (float) $d->harga * (int) $d->jumlah,
                    'image' => ! empty($d->image) ? $d->image : $meta['image'],
                ];
            }
        }

        return $ordersRaw->map(function ($order) use ($detailsByTx) {
            $items = $detailsByTx[$order->id_transaksi] ?? [];
            $itemSummary = implode(', ', array_map(
                fn ($i) => "{$i['nama_produk']} ({$i['jumlah']}x)",
                $items
            ));

            return [
                'id_transaksi' => (int) $order->id_transaksi,
                'tanggal' => $order->tanggal,
                'total_belanja' => (float) $order->total_belanja,
                'status_pesanan' => $order->status_pesanan ?? 'selesai',
                'tipe_pesanan' => $order->tipe_pesanan ?? 'delivery',
                'metode_pembayaran' => $order->metode_pembayaran ?? 'tunai',
                'catatan' => $order->catatan,
                'nama_pelanggan' => $order->nama_pelanggan,
                'kota' => $order->kota,
                'items' => $items,
                'item_names' => $itemSummary,
                'total_items' => array_sum(array_column($items, 'jumlah')),
            ];
        })->all();
    }

    /**
     * 1. Dashboard Pelanggan.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if ($request->filled('meja')) {
            return redirect()->route('pelanggan.dine-in', ['meja' => $request->query('meja')]);
        }

        $ctx = $this->getCustomerContext($request);
        $customerId = $ctx['customer']['id_pelanggan'];
        $catalog = $this->getCatalog();

        // Popular Dishes via Subquery (> AVG)
        $popularRaw = DB::select('
            SELECT
                p.id_produk,
                p.nama_produk,
                p.harga,
                p.stok,
                p.image,
                k.nama_kategori,
                COALESCE(SUM(dt.jumlah), 0) AS total_terjual
            FROM tbl_produk p
            JOIN tbl_kategori k ON p.id_kategori = k.id_kategori
            LEFT JOIN tbl_detail_transaksi dt ON p.nama_produk = dt.nama_produk
            GROUP BY p.id_produk, p.nama_produk, p.harga, p.stok, p.image, k.nama_kategori
            HAVING COALESCE(SUM(dt.jumlah), 0) > (
                SELECT AVG(total_qty)
                FROM (
                    SELECT SUM(jumlah) as total_qty
                    FROM tbl_detail_transaksi
                    GROUP BY nama_produk
                ) as avg_sales
            )
            ORDER BY total_terjual DESC
            LIMIT 6
        ');

        if (empty($popularRaw)) {
            $popularDishes = array_slice($catalog['products'], 0, 4);
        } else {
            $popularDishes = array_map(function ($p) {
                $meta = $this->getDishMeta($p->nama_produk);

                return [
                    'id_produk' => (int) $p->id_produk,
                    'nama_produk' => $p->nama_produk,
                    'nama_kategori' => $p->nama_kategori,
                    'harga' => (float) $p->harga,
                    'stok' => (int) $p->stok,
                    'image' => ! empty($p->image) ? $p->image : $meta['image'],
                    'time' => $meta['time'],
                    'rating' => $meta['rating'],
                    'reviews' => $meta['reviews'],
                ];
            }, $popularRaw);
        }

        // Recommendations via Subquery (NOT EXISTS)
        $unboughtRaw = DB::select('
            SELECT p.id_produk, p.nama_produk, p.harga, p.stok, p.image, k.nama_kategori
            FROM tbl_produk p
            JOIN tbl_kategori k ON p.id_kategori = k.id_kategori
            WHERE NOT EXISTS (
                SELECT 1
                FROM tbl_detail_transaksi dt
                JOIN tbl_transaksi t ON dt.id_transaksi = t.id_transaksi
                WHERE t.id_pelanggan = ? AND dt.nama_produk = p.nama_produk
            )
            LIMIT 4
        ', [$customerId]);

        $recommendations = array_map(function ($p) {
            $meta = $this->getDishMeta($p->nama_produk);

            return [
                'id_produk' => (int) $p->id_produk,
                'nama_produk' => $p->nama_produk,
                'nama_kategori' => $p->nama_kategori,
                'harga' => (float) $p->harga,
                'stok' => (int) $p->stok,
                'image' => ! empty($p->image) ? $p->image : $meta['image'],
            ];
        }, $unboughtRaw);

        // Recent Orders via view_recent_order
        $recentRaw = DB::select('
            SELECT *
            FROM view_recent_order
            WHERE id_pelanggan = ?
            ORDER BY last_order_date DESC, reorder_count DESC
            LIMIT 6
        ', [$customerId]);

        $recentOrders = array_map(function ($r) {
            $meta = $this->getDishMeta($r->nama_produk);

            return [
                'nama_produk' => $r->nama_produk,
                'reorder_count' => (int) $r->reorder_count,
                'harga' => (float) $r->harga,
                'image' => $meta['image'],
            ];
        }, $recentRaw);

        // Order History / Bills
        $orderHistory = DB::select("
            SELECT
                t.id_transaksi,
                t.tanggal,
                t.total_belanja,
                p.nama_pelanggan,
                p.kota,
                GROUP_CONCAT(CONCAT(dt.nama_produk, ' (', dt.jumlah, 'x)') SEPARATOR ', ') AS item_names,
                SUM(dt.jumlah) AS total_items
            FROM tbl_transaksi t
            JOIN tbl_pelanggan p ON t.id_pelanggan = p.id_pelanggan
            LEFT JOIN tbl_detail_transaksi dt ON t.id_transaksi = dt.id_transaksi
            WHERE p.id_pelanggan = ?
            GROUP BY t.id_transaksi, t.tanggal, t.total_belanja, p.nama_pelanggan, p.kota
            ORDER BY t.tanggal DESC, t.id_transaksi DESC
            LIMIT 15
        ", [$customerId]);

        $citiesRaw = DB::select('
            SELECT DISTINCT kota FROM tbl_pelanggan WHERE kota IS NOT NULL
            UNION
            SELECT DISTINCT kota FROM tbl_cabang WHERE kota IS NOT NULL
        ');
        $serviceCities = array_map(fn ($c) => $c->kota, $citiesRaw);

        $logs = DB::table('tbl_log')->orderByDesc('id_log')->limit(8)->get();

        return Inertia::render('Dashboard', [
            'customer' => $ctx['customer'],
            'activeMeja' => null,
            'walletBalance' => $ctx['walletBalance'],
            'address' => $ctx['address'],
            'categories' => $catalog['categories'],
            'products' => $catalog['products'],
            'popularDishes' => $popularDishes,
            'recentOrders' => $recentOrders,
            'recommendations' => $recommendations,
            'orderHistory' => $orderHistory,
            'serviceCities' => $serviceCities,
            'auditLogs' => $logs,
        ]);
    }

    /**
     * 2. Food Order Delivery.
     */
    public function delivery(Request $request): Response
    {
        $ctx = $this->getCustomerContext($request);
        $catalog = $this->getCatalog();

        $citiesRaw = DB::select('
            SELECT DISTINCT kota FROM tbl_pelanggan WHERE kota IS NOT NULL
            UNION
            SELECT DISTINCT kota FROM tbl_cabang WHERE kota IS NOT NULL
        ');
        $serviceCities = array_map(fn ($c) => $c->kota, $citiesRaw);

        return Inertia::render('Pelanggan/FoodOrderDelivery', [
            'customer' => $ctx['customer'],
            'walletBalance' => $ctx['walletBalance'],
            'address' => $ctx['address'],
            'categories' => $catalog['categories'],
            'products' => $catalog['products'],
            'serviceCities' => $serviceCities,
            'deliveryFee' => self::DELIVERY_FEE,
        ]);
    }

    /**
     * 3. Food Order Dine In.
     */
    public function dineIn(Request $request): Response
    {
        $ctx = $this->getCustomerContext($request);
        $catalog = $this->getCatalog();

        $tables = Meja::orderBy('nomor_meja')
            ->get()
            ->map(fn (Meja $m) => [
                'id_meja' => $m->id_meja,
                'nomor_meja' => $m->nomor_meja,
                'kode_qr' => $m->kode_qr,
                'kapasitas' => $m->kapasitas,
                'status' => $m->status,
                'catatan' => $m->catatan,
            ])
            ->all();

        $activeMeja = null;
        if ($request->filled('meja')) {
            $mejaFound = Meja::where('kode_qr', $request->query('meja'))->first();
            if ($mejaFound) {
                $activeMeja = [
                    'id_meja' => $mejaFound->id_meja,
                    'nomor_meja' => $mejaFound->nomor_meja,
                    'kode_qr' => $mejaFound->kode_qr,
                    'kapasitas' => $mejaFound->kapasitas,
                    'status' => $mejaFound->status,
                    'catatan' => $mejaFound->catatan,
                ];
            }
        }

        return Inertia::render('Pelanggan/FoodOrderDineIn', [
            'customer' => $ctx['customer'],
            'walletBalance' => $ctx['walletBalance'],
            'categories' => $catalog['categories'],
            'products' => $catalog['products'],
            'tables' => $tables,
            'activeMeja' => $activeMeja,
        ]);
    }

    /**
     * 4. Order History.
     */
    public function history(Request $request): Response
    {
        $ctx = $this->getCustomerContext($request);
        $orders = $this->getCustomerOrders($ctx['customer']['id_pelanggan'], 50);

        return Inertia::render('Pelanggan/OrderHistory', [
            'customer' => $ctx['customer'],
            'walletBalance' => $ctx['walletBalance'],
            'orderHistory' => $orders,
        ]);
    }

    /**
     * 4b. Detail Pesanan Pelanggan.
     */
    public function orderDetail(Request $request, int $id): Response
    {
        $ctx = $this->getCustomerContext($request);
        $customerId = $ctx['customer']['id_pelanggan'];

        $order = DB::table('tbl_transaksi as t')
            ->join('tbl_pelanggan as p', 't.id_pelanggan', '=', 'p.id_pelanggan')
            ->where('t.id_transaksi', $id)
            ->where('t.id_pelanggan', $customerId)
            ->whereIn('t.tipe_pesanan', ['delivery', 'dine_in'])
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
            ->first();

        abort_if(! $order, 404);

        $details = DB::table('tbl_detail_transaksi as dt')
            ->leftJoin('tbl_produk as p', 'dt.nama_produk', '=', 'p.nama_produk')
            ->where('dt.id_transaksi', $order->id_transaksi)
            ->select([
                'dt.nama_produk',
                'dt.jumlah',
                'dt.harga',
                'p.image',
            ])
            ->get();

        $items = $details->map(function ($d) {
            $meta = $this->getDishMeta($d->nama_produk);

            return [
                'nama_produk' => $d->nama_produk,
                'jumlah' => (int) $d->jumlah,
                'harga' => (float) $d->harga,
                'subtotal' => (float) $d->harga * (int) $d->jumlah,
                'image' => ! empty($d->image) ? $d->image : $meta['image'],
            ];
        })->all();

        return Inertia::render('Pelanggan/OrderDetail', [
            'customer' => $ctx['customer'],
            'walletBalance' => $ctx['walletBalance'],
            'address' => $ctx['address'],
            'order' => [
                'id_transaksi' => (int) $order->id_transaksi,
                'tanggal' => $order->tanggal,
                'total_belanja' => (float) $order->total_belanja,
                'status_pesanan' => $order->status_pesanan ?? 'selesai',
                'tipe_pesanan' => $order->tipe_pesanan ?? 'delivery',
                'metode_pembayaran' => $order->metode_pembayaran ?? 'tunai',
                'catatan' => $order->catatan,
                'nama_pelanggan' => $order->nama_pelanggan,
                'kota' => $order->kota,
                'items' => $items,
                'total_items' => array_sum(array_column($items, 'jumlah')),
            ],
        ]);
    }

    /**
     * 5. Pembayaran & GoMeal Pay.
     */
    public function pembayaran(Request $request): Response
    {
        $ctx = $this->getCustomerContext($request);
        $orders = $this->getCustomerOrders($ctx['customer']['id_pelanggan'], 20);

        $walletLogs = DB::table('tbl_log')
            ->where(function ($q) {
                $q->where('aktivitas', 'like', '%Top Up%')
                    ->orWhere('aktivitas', 'like', '%Pesanan%');
            })
            ->orderByDesc('id_log')
            ->limit(15)
            ->get();

        return Inertia::render('Pelanggan/Pembayaran', [
            'customer' => $ctx['customer'],
            'walletBalance' => $ctx['walletBalance'],
            'orderHistory' => $orders,
            'walletLogs' => $walletLogs,
        ]);
    }

    /**
     * Atomic Checkout execution using TCL (START TRANSACTION, COMMIT, ROLLBACK).
     */
    public function checkout(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.nama_produk' => 'required|string',
            'items.*.qty' => 'required|integer|min:1',
            'order_type' => 'nullable|in:delivery,dine_in',
            'id_meja' => 'nullable|integer|exists:tbl_meja,id_meja',
            'payment_method' => 'nullable|in:gomeal_pay,qris,tunai',
            'coupon_discount' => 'nullable|numeric|min:0|max:100',
            'no_cutlery' => 'nullable|boolean',
            'notes' => 'nullable|string|max:255',
        ]);

        $customer = Pelanggan::find($request->session()->get('pelanggan_id'))
            ?? Pelanggan::firstOrFail();

        $orderType = $validated['order_type'] ?? 'delivery';
        $paymentMethod = $validated['payment_method'] ?? 'gomeal_pay';
        $discountPercent = (float) ($validated['coupon_discount'] ?? 0);
        $serviceFee = $orderType === 'delivery' ? self::DELIVERY_FEE : 0.0;
        $items = $validated['items'];

        $meja = null;
        if ($orderType === 'dine_in' && ! empty($validated['id_meja'])) {
            $meja = Meja::find($validated['id_meja']);
        }

        // Begin Atomic Transaction (TCL)
        DB::beginTransaction();

        try {
            $totalSubtotal = 0;
            $itemsToInsert = [];

            foreach ($items as $item) {
                $product = Produk::where('nama_produk', $item['nama_produk'])
                    ->lockForUpdate()
                    ->first();

                if (! $product) {
                    throw new \Exception("Produk '{$item['nama_produk']}' tidak ditemukan di sistem.");
                }

                if ($product->stok < $item['qty']) {
                    throw new \Exception("Stok untuk '{$item['nama_produk']}' tidak mencukupi (Tersisa {$product->stok}).");
                }

                $calcTotal = DB::selectOne('SELECT HitungTotal(?, ?) as subtotal', [$product->harga, $item['qty']]);
                $subtotal = (float) ($calcTotal->subtotal ?? ($product->harga * $item['qty']));

                $totalSubtotal += $subtotal;
                $itemsToInsert[] = [
                    'nama_produk' => $product->nama_produk,
                    'jumlah' => $item['qty'],
                    'harga' => $product->harga,
                ];
            }

            $calcDiscount = DB::selectOne('SELECT HitungDiskon(?, ?) as potongan', [$totalSubtotal, $discountPercent]);
            $potongan = (float) ($calcDiscount->potongan ?? 0);

            $totalBelanja = round($totalSubtotal - $potongan + $serviceFee, 2);

            if ($totalBelanja < 0) {
                throw new \Exception('Total transaksi tidak valid (negatif).');
            }

            // Validate GoMeal Pay balance when paying with wallet
            $currentBalance = (float) $request->session()->get('gomeal_balance', self::DEFAULT_WALLET_BALANCE);
            if ($paymentMethod === 'gomeal_pay' && $currentBalance < $totalBelanja) {
                throw new \Exception('Saldo GoMeal Pay tidak mencukupi. Silakan Top Up di menu Pembayaran atau pilih metode lain.');
            }

            // Insert into tbl_transaksi (triggers before_insert_transaksi)
            $transaksiId = DB::table('tbl_transaksi')->insertGetId([
                'tanggal' => now()->toDateString(),
                'id_pelanggan' => $customer->id_pelanggan,
                'total_belanja' => $totalBelanja,
                'status_pesanan' => 'menunggu_kasir',
                'tipe_pesanan' => $orderType,
                'metode_pembayaran' => $paymentMethod,
                'catatan' => $validated['notes'] ?? null,
            ]);

            // Insert details into tbl_detail_transaksi
            foreach ($itemsToInsert as $ins) {
                DB::table('tbl_detail_transaksi')->insert([
                    'id_transaksi' => $transaksiId,
                    'nama_produk' => $ins['nama_produk'],
                    'jumlah' => $ins['jumlah'],
                    'harga' => $ins['harga'],
                ]);
            }

            if ($paymentMethod === 'gomeal_pay') {
                $newBalance = round($currentBalance - $totalBelanja, 2);
                $request->session()->put('gomeal_balance', $newBalance);
            }

            $typeLabel = $orderType === 'dine_in'
                ? 'Dine In'.($meja ? " ({$meja->nomor_meja})" : '')
                : 'Delivery';
            $methodLabel = match ($paymentMethod) {
                'gomeal_pay' => 'GoMeal Pay',
                'qris' => 'QRIS',
                default => 'Tunai',
            };

            DB::table('tbl_log')->insert([
                'aktivitas' => "Pesanan {$typeLabel} #{$transaksiId} oleh {$customer->nama_pelanggan} via {$methodLabel} (Rp ".number_format($totalBelanja, 0, ',', '.').')',
                'waktu' => now(),
            ]);

            DB::commit();

            return redirect()->back()->with('success', "Pesanan {$typeLabel} #{$transaksiId} berhasil dibayar dan dikirim ke kasir untuk verifikasi!");
        } catch (\Throwable $e) {
            DB::rollBack();

            return redirect()->back()->with('error', 'Gagal memproses pesanan: '.$e->getMessage());
        }
    }

    /**
     * Top Up GoMeal Pay wallet balance.
     */
    public function topUp(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:10000|max:10000000',
            'method' => 'nullable|string|max:50',
        ]);

        $currentBalance = (float) $request->session()->get('gomeal_balance', self::DEFAULT_WALLET_BALANCE);
        $newBalance = round($currentBalance + $validated['amount'], 2);
        $request->session()->put('gomeal_balance', $newBalance);

        $formattedAmount = 'Rp '.number_format($validated['amount'], 0, ',', '.');
        $formattedBalance = 'Rp '.number_format($newBalance, 0, ',', '.');
        $method = $validated['method'] ?? 'Transfer Bank';

        DB::table('tbl_log')->insert([
            'aktivitas' => "Top Up GoMeal Pay sebesar {$formattedAmount} via {$method}",
            'waktu' => now(),
        ]);

        return redirect()->back()->with('success', "Top Up {$formattedAmount} berhasil! Saldo baru: {$formattedBalance}");
    }

    /**
     * Update delivery address.
     */
    public function changeAddress(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'street' => 'required|string|max:100',
            'detail' => 'nullable|string|max:255',
            'city' => 'required|string|max:50',
        ]);

        $request->session()->put('gomeal_address', $validated);

        Pelanggan::where('id_pelanggan', $request->session()->get('pelanggan_id'))->update([
            'kota' => $validated['city'],
        ]);

        return redirect()->back()->with('success', 'Alamat pengiriman berhasil diperbarui!');
    }

    /**
     * Fast search endpoint with EXPLAIN verification.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q', '');

        $products = DB::select('
            SELECT * FROM view_katalog_produk
            WHERE nama_produk LIKE ? OR nama_kategori LIKE ?
            ORDER BY nama_produk ASC
            LIMIT 10
        ', ["%{$query}%", "%{$query}%"]);

        $explain = DB::select('
            EXPLAIN SELECT * FROM tbl_produk WHERE nama_produk = ?
        ', [$query]);

        return response()->json([
            'results' => $products,
            'explain' => $explain,
        ]);
    }
}
