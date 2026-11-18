<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Penjualan - GoMeal TokoKita</title>
    <style>
        @page {
            margin: 28px 32px 35px 32px;
            size: a4 landscape;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
        }

        body {
            font-size: 10px;
            line-height: 1.35;
            background-color: #ffffff;
        }

        /* Header Area */
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 14px;
        }

        .header-table td {
            vertical-align: middle;
            border: none;
            padding: 0;
        }

        .brand-name {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
        }

        .brand-name span {
            color: #f97316;
        }

        .brand-sub {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
            font-weight: 500;
        }

        .meta-box {
            text-align: right;
            font-size: 9.5px;
            color: #475569;
            line-height: 1.45;
        }

        .meta-box strong {
            color: #0f172a;
        }

        .badge-tag {
            display: inline-block;
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: bold;
            color: #334155;
            margin-bottom: 4px;
        }

        /* KPI Cards Grid (Table Layout for DomPDF) */
        .kpi-table {
            width: 100%;
            margin-bottom: 14px;
            border-spacing: 8px 0;
            margin-left: -8px;
            margin-right: -8px;
        }

        .kpi-table td {
            width: 25%;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            vertical-align: top;
        }

        .kpi-label {
            font-size: 8px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.6px;
            color: #64748b;
            margin-bottom: 3px;
        }

        .kpi-value {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
        }

        .kpi-value small {
            font-size: 9px;
            font-weight: 500;
            color: #64748b;
        }

        .kpi-sub {
            font-size: 8px;
            color: #10b981;
            margin-top: 2px;
            font-weight: 600;
        }

        /* Top 5 Section */
        .top-products-table {
            width: 100%;
            margin-bottom: 14px;
            border-collapse: collapse;
            font-size: 9px;
            background-color: #fafaf9;
            border: 1px solid #e7e5e4;
            border-radius: 6px;
        }

        .top-products-table th, .top-products-table td {
            padding: 5px 8px;
            border: 1px solid #e7e5e4;
        }

        .top-products-table th {
            background-color: #f5f5f4;
            text-align: left;
            font-weight: 700;
            color: #44403c;
        }

        /* Main Data Table */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-top: 4px;
        }

        .data-table thead {
            display: table-header-group;
        }

        .data-table tr {
            page-break-inside: avoid;
        }

        .data-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #0f172a;
            letter-spacing: 0.2px;
        }

        .data-table td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
            color: #334155;
        }

        .data-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .font-bold {
            font-weight: 700;
        }

        .total-row td {
            background-color: #f1f5f9;
            border-top: 2px solid #0f172a;
            border-bottom: 2px solid #0f172a;
            font-weight: 800;
            color: #0f172a;
            padding: 7px 8px;
            font-size: 9.5px;
        }

        /* Signatures Section */
        .sign-table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
            page-break-inside: avoid;
        }

        .sign-table td {
            border: none;
            vertical-align: top;
            padding: 0;
        }

        .sign-box {
            width: 200px;
            text-align: center;
            font-size: 9.5px;
        }

        .sign-space {
            height: 48px;
        }

        .sign-name {
            font-weight: bold;
            color: #0f172a;
            border-bottom: 1px solid #64748b;
            padding-bottom: 2px;
            display: inline-block;
            min-width: 150px;
        }

        .footer-note {
            margin-top: 15px;
            font-size: 8px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px dashed #cbd5e1;
            padding-top: 6px;
        }
    </style>
</head>
<body>

    <!-- Header Area -->
    <table class="header-table">
        <tr>
            <td style="width: 55%;">
                <div class="brand-name">GoMeal<span>.</span> TokoKita</div>
                <div class="brand-sub">Sistem Informasi Point of Sale &amp; Manajemen Transaksi Terpadu</div>
            </td>
            <td style="width: 45%;">
                <div class="meta-box">
                    <span class="badge-tag">DOKUMEN RESMI PENJUALAN</span><br>
                    <strong>Periode:</strong> {{ $startDate ? date('d/m/Y', strtotime($startDate)) : 'Awal Data' }} s/d {{ $endDate ? date('d/m/Y', strtotime($endDate)) : date('d/m/Y') }}<br>
                    <strong>Waktu Cetak:</strong> {{ date('d F Y, H:i') }} WIB &bull; <strong>Total:</strong> {{ count($transactions) }} Struk
                </div>
            </td>
        </tr>
    </table>

    <!-- 4 KPI Summary Cards -->
    <table class="kpi-table">
        <tr>
            <td>
                <div class="kpi-label">Total Omzet Penjualan</div>
                <div class="kpi-value">Rp {{ number_format($summary['total_omzet'], 0, ',', '.') }}</div>
                <div class="kpi-sub">&bull; Pendapatan kotor tercatat</div>
            </td>
            <td>
                <div class="kpi-label">Volume Transaksi</div>
                <div class="kpi-value">{{ number_format($summary['total_transaksi']) }} <small>struk</small></div>
                <div class="kpi-sub" style="color: #64748b;">&bull; Total transaksi sukses</div>
            </td>
            <td>
                <div class="kpi-label">Produk Terjual</div>
                <div class="kpi-value">{{ number_format($summary['total_item']) }} <small>porsi/item</small></div>
                <div class="kpi-sub" style="color: #f59e0b;">&bull; Akumulasi item keluar</div>
            </td>
            <td>
                <div class="kpi-label">Rata-Rata per Transaksi</div>
                <div class="kpi-value">Rp {{ number_format($summary['avg_transaksi'], 0, ',', '.') }}</div>
                <div class="kpi-sub" style="color: #3b82f6;">&bull; Nilai keranjang rata-rata</div>
            </td>
        </tr>
    </table>

    <!-- Top 5 Produk Singkat (Jika Ada) -->
    @if(count($topProducts) > 0)
    <table class="top-products-table">
        <thead>
            <tr>
                <th colspan="3" style="font-size: 8.5px; text-transform: uppercase; background-color: #f5f5f4;">
                    Top 5 Menu Terlaris Pada Periode Terpilih
                </th>
            </tr>
            <tr style="background-color: #fafaf9; font-size: 8px;">
                <th style="width: 30px;">Rank</th>
                <th>Nama Menu / Produk</th>
                <th class="text-right" style="width: 120px;">Total Terjual (Porsi)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($topProducts as $idx => $p)
            <tr>
                <td class="text-center font-bold">#{{ $idx + 1 }}</td>
                <td class="font-bold">{{ $p->nama_produk }}</td>
                <td class="text-right font-bold">{{ number_format($p->total_qty) }} porsi (Rp {{ number_format($p->total_omzet, 0, ',', '.') }})</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Data Table -->
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 65px;">No. Struk</th>
                <th style="width: 75px;">Tanggal</th>
                <th style="width: 140px;">Pelanggan</th>
                <th>Rincian Pesanan (Item Menu)</th>
                <th class="text-center" style="width: 60px;">Qty Item</th>
                <th class="text-right" style="width: 105px;">Total Belanja</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $t)
            <tr>
                <td class="font-bold text-center">#{{ $t->id_transaksi }}</td>
                <td style="white-space: nowrap;">{{ date('d/m/Y', strtotime($t->tanggal)) }}</td>
                <td>
                    <strong>{{ $t->nama_pelanggan ?: 'Umum / Walk-in' }}</strong>
                    @if($t->kota)
                        <span style="color: #64748b; font-size: 8px;">({{ $t->kota }})</span>
                    @endif
                </td>
                <td>{{ $t->rincian ?: '-' }}</td>
                <td class="text-center font-bold">{{ $t->total_items }}</td>
                <td class="text-right font-bold" style="white-space: nowrap;">
                    Rp {{ number_format($t->total_belanja, 0, ',', '.') }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" class="text-center" style="padding: 15px; color: #94a3b8;">
                    Tidak ada transaksi tercatat pada rentang filter ini.
                </td>
            </tr>
            @endforelse
        </tbody>
        @if(count($transactions) > 0)
        <tfoot>
            <tr class="total-row">
                <td colspan="4" class="text-right font-bold">
                    TOTAL KESELURUHAN ({{ count($transactions) }} Struk):
                </td>
                <td class="text-center font-bold">{{ number_format($summary['total_item']) }}</td>
                <td class="text-right font-bold" style="color: #0f172a; white-space: nowrap;">
                    Rp {{ number_format($summary['total_omzet'], 0, ',', '.') }}
                </td>
            </tr>
        </tfoot>
        @endif
    </table>

    <!-- Signatures -->
    <table class="sign-table">
        <tr>
            <td style="width: 65%;"></td>
            <td style="width: 35%;">
                <div class="sign-box">
                    <p style="color: #64748b; font-size: 8.5px; margin-bottom: 4px;">
                        Dicetak di Ponorogo, {{ date('d F Y') }}
                    </p>
                    <p style="font-weight: 600; color: #334155;">Petugas / Penanggung Jawab</p>
                    <div class="sign-space"></div>
                    <div class="sign-name">( Administrator Kasir )</div>
                    <p style="font-size: 8px; color: #94a3b8; margin-top: 2px;">GoMeal TokoKita POS System</p>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer-note">
        Dokumen ini dibuat otomatis oleh Sistem Komputer TokoKita GoMeal POS &bull; Waktu cetak: {{ date('Y-m-d H:i:s') }}
    </div>

</body>
</html>
