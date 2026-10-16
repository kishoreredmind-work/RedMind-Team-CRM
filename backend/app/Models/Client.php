<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'company',
        'email',
        'phone',
        'notes',
        'created_by',
    ];

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
