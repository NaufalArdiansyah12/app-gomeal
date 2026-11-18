<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogActivity extends Model
{
    protected $table = 'tbl_log';

    protected $primaryKey = 'id_log';

    public $timestamps = false;

    protected $fillable = [
        'aktivitas',
        'waktu',
    ];

    protected $casts = [
        'waktu' => 'datetime',
    ];
}
