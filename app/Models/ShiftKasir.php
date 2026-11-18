<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftKasir extends Model
{
    protected $table = 'tbl_shift_kasir';

    protected $primaryKey = 'id_shift';

    protected $fillable = [
        'id_user',
        'nama_shift',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'saldo_awal',
        'saldo_akhir',
        'status',
        'catatan',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
        'saldo_awal' => 'decimal:2',
        'saldo_akhir' => 'decimal:2',
    ];

    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
