<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Meja extends Model
{
    protected $table = 'tbl_meja';

    protected $primaryKey = 'id_meja';

    protected $fillable = [
        'nomor_meja',
        'kode_qr',
        'kapasitas',
        'status',
        'catatan',
    ];

    protected $casts = [
        'kapasitas' => 'integer',
    ];

    public static function generateUniqueCode(): string
    {
        do {
            $code = 'TBL-'.strtoupper(Str::random(12));
        } while (self::where('kode_qr', $code)->exists());

        return $code;
    }
}
