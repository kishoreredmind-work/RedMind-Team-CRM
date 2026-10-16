<?php

namespace App\Http\Controllers\Api;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CommentController extends ApiController
{
    public function getByTask(Request $request, $taskId)
    {
        $comments = Comment::where('task_id', $taskId)
            ->with('user')
            ->orderBy('created_at', 'ASC')
            ->get();

        $mapped = $comments->map(function($c) {
            return [
                'id' => $c->id,
                'taskId' => $c->task_id,
                'userId' => $c->user_id,
                'userName' => $c->user ? $c->user->name : 'Unknown User',
                'content' => $c->content,
                'createdAt' => $c->created_at->toIso8601String()
            ];
        });

        return $this->respond(true, $mapped);
    }

    public function store(Request $request)
    {
        $taskId = $request->input('taskId');
        $content = $request->input('content');

        if (!$taskId || !$content) {
            return $this->respond(false, null, 'taskId and content are required');
        }

        $auth = $this->authenticatedUser($request);
        $commentId = (string) Str::uuid();

        $comment = Comment::create([
            'id' => $commentId,
            'task_id' => $taskId,
            'user_id' => $auth['user_id'],
            'content' => $content
        ]);

        return $this->respond(true, ['id' => $commentId], null, 'Comment added successfully');
    }

    public function destroy(Request $request, $id)
    {
        $comment = Comment::find($id);
        if (!$comment) {
            return $this->respond(false, null, 'Comment not found');
        }

        $auth = $this->authenticatedUser($request);
        if ($auth['role'] !== 'LEAD' && $comment->user_id !== $auth['user_id']) {
            return $this->respond(false, null, 'Forbidden: Access denied', null, 403);
        }

        $comment->delete();
        return $this->respond(true, null, null, 'Comment deleted successfully');
    }
}
