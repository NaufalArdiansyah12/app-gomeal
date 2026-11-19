<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChefController;
use App\Http\Controllers\DuitkuController;
use App\Http\Controllers\GoMealController;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureAdminOrKasir;
use App\Http\Middleware\EnsureChef;
use App\Http\Middleware\EnsurePelangganLoggedIn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Duitku Payment Gateway Routes
Route::post('/api/duitku/callback', [DuitkuController::class, 'callback'])->name('duitku.api.callback');
Route::post('/duitku/callback', [DuitkuController::class, 'callback'])->name('duitku.callback');
Route::get('/duitku/return', [DuitkuController::class, 'returnPage'])->name('duitku.return');

// Pelanggan Routes (Pelanggan Panel: Dashboard, Delivery, Dine In, Order History, Pembayaran)
Route::middleware(EnsurePelangganLoggedIn::class)->group(function () {
    Route::get('/', [GoMealController::class, 'index'])->name('home');
    Route::get('/pelanggan/dashboard', [GoMealController::class, 'index'])->name('pelanggan.dashboard');
    Route::get('/pelanggan/delivery', [GoMealController::class, 'delivery'])->name('pelanggan.delivery');
    Route::get('/pelanggan/dine-in', [GoMealController::class, 'dineIn'])->name('pelanggan.dine-in');
    Route::get('/pelanggan/history', [GoMealController::class, 'history'])->name('pelanggan.history');
    Route::get('/pelanggan/history/{id}', [GoMealController::class, 'orderDetail'])->name('pelanggan.order-detail');
    Route::get('/pelanggan/pembayaran', [GoMealController::class, 'pembayaran'])->name('pelanggan.pembayaran');
    Route::post('/checkout', [GoMealController::class, 'checkout'])->name('checkout');
    Route::post('/top-up', [GoMealController::class, 'topUp'])->name('top-up');
    Route::post('/change-address', [GoMealController::class, 'changeAddress'])->name('change-address');
    Route::get('/search', [GoMealController::class, 'search'])->name('search');
});

// Admin & Staff Entry Redirect
Route::get('/admin', function (Request $request) {
    $role = $request->session()->get('user_role');

    if ($role === 'kasir') {
        return redirect()->route('admin.transaksi');
    }

    if ($role === 'chef') {
        return redirect()->route('chef.dashboard');
    }

    return redirect()->route('admin.dashboard');
});

// Chef Routes (Kitchen Display System)
Route::redirect('/chef', '/chef/dashboard');
Route::middleware(EnsureChef::class)->prefix('chef')->group(function () {
    Route::get('/dashboard', [ChefController::class, 'dashboard'])->name('chef.dashboard');
    Route::post('/orders/{id}/status', [ChefController::class, 'updateOrderStatus'])->name('chef.orders.status');
});

// Routes accessible by both Admin and Kasir (Menu POS, Riwayat Transaksi Kasir, Data Pelanggan view-only)
Route::middleware(EnsureAdminOrKasir::class)->prefix('admin')->group(function () {
    // 1. Kasir (POS)
    Route::get('/transaksi', [AdminController::class, 'transaksi'])->name('admin.transaksi');
    Route::post('/transaksi', [AdminController::class, 'storeTransaksi'])->name('admin.transaksi.store');

    // 2. Order Makanan (Pesanan masuk dari pelanggan)
    Route::get('/order-makanan', [AdminController::class, 'orderMakanan'])->name('admin.order-makanan');
    Route::post('/order-makanan/{id}/status', [AdminController::class, 'updateOrderStatus'])->name('admin.order-makanan.status');

    // 3. Riwayat Transaksi (Kasir sees their own transactions, Admin sees all)
    Route::get('/riwayat', [AdminController::class, 'riwayat'])->name('admin.riwayat');
    Route::post('/riwayat/{id}/void', [AdminController::class, 'voidTransaksi'])->name('admin.riwayat.void');

    // 3. Data Pelanggan (Kasir is read-only, Admin can manage)
    Route::get('/pelanggan', [AdminController::class, 'pelanggan'])->name('admin.pelanggan');
});

// Routes strictly restricted to Admin only (Dashboard, Produk, Stok, Laporan, Meja, CRUD Pelanggan)
Route::middleware(EnsureAdmin::class)->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');

    // Produk
    Route::get('/produk', [AdminController::class, 'produk'])->name('admin.produk');
    Route::post('/produk', [AdminController::class, 'storeProduk'])->name('admin.produk.store');
    Route::match(['put', 'post'], '/produk/{id}', [AdminController::class, 'updateProduk'])->name('admin.produk.update');
    Route::delete('/produk/{id}', [AdminController::class, 'destroyProduk'])->name('admin.produk.destroy');

    // Kategori Menu (Halaman Khusus)
    Route::get('/kategori', [AdminController::class, 'kategori'])->name('admin.kategori');
    Route::post('/kategori', [AdminController::class, 'storeKategori'])->name('admin.kategori.store');
    Route::put('/kategori/{id}', [AdminController::class, 'updateKategori'])->name('admin.kategori.update');
    Route::delete('/kategori/{id}', [AdminController::class, 'destroyKategori'])->name('admin.kategori.destroy');

    // Atur Shift Kasir (Pengganti menu POS di Admin Panel)
    Route::get('/shift', [AdminController::class, 'shift'])->name('admin.shift');
    Route::post('/shift', [AdminController::class, 'storeShift'])->name('admin.shift.store');
    Route::post('/shift/kasir-user', [AdminController::class, 'storeKasirUser'])->name('admin.shift.kasir_user');
    Route::put('/shift/{id}', [AdminController::class, 'updateShift'])->name('admin.shift.update');
    Route::post('/shift/{id}/close', [AdminController::class, 'closeShift'])->name('admin.shift.close');
    Route::delete('/shift/{id}', [AdminController::class, 'destroyShift'])->name('admin.shift.destroy');

    // Pelanggan Write Operations (Admin only)
    Route::post('/pelanggan', [AdminController::class, 'storePelanggan'])->name('admin.pelanggan.store');
    Route::put('/pelanggan/{id}', [AdminController::class, 'updatePelanggan'])->name('admin.pelanggan.update');

    // Stok & Inventori
    Route::get('/stok', [AdminController::class, 'stok'])->name('admin.stok');
    Route::post('/stok/adjust', [AdminController::class, 'adjustStok'])->name('admin.stok.adjust');

    // Laporan
    Route::get('/laporan', [AdminController::class, 'laporan'])->name('admin.laporan');
    Route::get('/laporan/export-excel', [AdminController::class, 'exportLaporanExcel'])->name('admin.laporan.export-excel');
    Route::get('/laporan/export-pdf', [AdminController::class, 'exportLaporanPdf'])->name('admin.laporan.export-pdf');

    // Meja & QR Code
    Route::get('/meja', [AdminController::class, 'meja'])->name('admin.meja');
    Route::post('/meja', [AdminController::class, 'storeMeja'])->name('admin.meja.store');
    Route::put('/meja/{id}', [AdminController::class, 'updateMeja'])->name('admin.meja.update');
    Route::post('/meja/{id}/regenerate-qr', [AdminController::class, 'regenerateQrMeja'])->name('admin.meja.regenerate');
    Route::delete('/meja/{id}', [AdminController::class, 'destroyMeja'])->name('admin.meja.destroy');
});
