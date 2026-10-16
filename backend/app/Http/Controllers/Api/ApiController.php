<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ActivityLog;
use Illuminate\Support\Str;

class ApiController extends Controller
{
    /**
     * Standard success/fail JSON response helper.
     */
    protected function respond($success, $data = null, $error = null, $message = null, $status = 200)
    {
        return response()->json([
            'success' => $success,
            'data' => $data,
            'error' => $error,
            'message' => $message
        ], $status);
    }

    /**
     * Get the authenticated user payload.
     */
    protected function authenticatedUser(Request $request)
    {
        return $request->get('authenticated_user');
    }

    /**
     * Helper to log activity to database.
     */
    protected function logActivity($userId, $action, $details = null)
    {
        ActivityLog::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'action' => $action,
            'details' => $details
        ]);
    }
}
