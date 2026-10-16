<?php

namespace App\Http\Controllers\Api;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends ApiController
{
    public function index()
    {
        $logs = ActivityLog::with('user')
            ->orderBy('created_at', 'DESC')
            ->get();

        $mapped = $logs->map(function($l) {
            return [
                'id' => $l->id,
                'userId' => $l->user_id,
                'userName' => $l->user ? $l->user->name : 'System',
                'action' => $l->action,
                'details' => $l->details,
                'createdAt' => $l->created_at->toIso8601String()
            ];
        });

        return $this->respond(true, $mapped);
    }
}
