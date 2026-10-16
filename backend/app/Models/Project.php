<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'description',
        'client_id',
        'status',
        'start_date',
        'end_date',
        'working_days',
        'links',
        'created_by',
    ];

    protected $casts = [
        'links' => 'array',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'project_members', 'project_id', 'member_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
