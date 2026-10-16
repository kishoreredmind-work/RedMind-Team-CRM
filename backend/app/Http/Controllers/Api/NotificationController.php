<?php

namespace App\Http\Controllers\Api;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends ApiController
{
    public function index(Request $request)
    {
        $auth = $this->authenticatedUser($request);
        $notifications = Notification::where('user_id', $auth['user_id'])
            ->orderBy('created_at', 'DESC')
            ->get();

        $mapped = $notifications->map(function($n) {
            return [
                'id' => $n->id,
                'userId' => $n->user_id,
                'message' => $n->message,
                'link' => $n->link,
                'readStatus' => $n->read_status,
                'createdAt' => $n->created_at->toIso8601String()
            ];
        });

        return $this->respond(true, $mapped);
    }

    public function update(Request $request, $id)
    {
        $auth = $this->authenticatedUser($request);
        $notification = Notification::where('user_id', $auth['user_id'])->find($id);

        if (!$notification) {
            return $this->respond(false, null, 'Notification not found');
        }

        $notification->read_status = true;
        $notification->save();

        return $this->respond(true, null, null, 'Notification marked as read');
    }

    public function readAll(Request $request)
    {
        $auth = $this->authenticatedUser($request);
        Notification::where('user_id', $auth['user_id'])->update(['read_status' => true]);
        return $this->respond(true, null, null, 'All notifications marked as read');
    }

    public function destroy(Request $request, $id)
    {
        $auth = $this->authenticatedUser($request);
        $notification = Notification::where('user_id', $auth['user_id'])->find($id);

        if (!$notification) {
            return $this->respond(false, null, 'Notification not found');
        }

        $notification->delete();
        return $this->respond(true, null, null, 'Notification deleted');
    }
}
