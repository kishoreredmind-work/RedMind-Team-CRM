<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'title',
        'project_id',
        'assigned_to',
        'status',
        'priority',
        'notes',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function workLogs()
    {
        return $this->hasMany(WorkLog::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
