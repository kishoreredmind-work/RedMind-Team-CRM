<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'message',
        'link',
        'read_status',
    ];

    protected $casts = [
        'read_status' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
