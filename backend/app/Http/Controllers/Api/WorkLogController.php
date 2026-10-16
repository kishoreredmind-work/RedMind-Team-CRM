<?php

namespace App\Http\Controllers\Api;

use App\Models\WorkLog;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class WorkLogController extends ApiController
{
    public function index(Request $request)
    {
        $auth = $this->authenticatedUser($request);
        if ($auth['role'] === 'LEAD') {
            $logs = WorkLog::orderBy('date', 'DESC')->get();
        } else {
            $logs = WorkLog::where('user_id', $auth['user_id'])->orderBy('date', 'DESC')->get();
        }

        $mapped = $logs->map(function($l) {
            $lArray = $l->toArray();
            $lArray['userId'] = $l->user_id;
            $lArray['taskId'] = $l->task_id;
            return $lArray;
        });

        return $this->respond(true, $mapped);
    }

    public function getByUser(Request $request, $userId)
    {
        $auth = $this->authenticatedUser($request);
        if ($auth['role'] !== 'LEAD' && $userId !== $auth['user_id']) {
            return $this->respond(false, null, 'Forbidden: Access denied to these logs', null, 403);
        }

        $logs = WorkLog::where('user_id', $userId)->orderBy('date', 'DESC')->get();
        
        $mapped = $logs->map(function($l) {
            $lArray = $l->toArray();
            $lArray['userId'] = $l->user_id;
            $lArray['taskId'] = $l->task_id;
            return $lArray;
        });

        return $this->respond(true, $mapped);
    }

    public function show(Request $request, $id)
    {
        $auth = $this->authenticatedUser($request);
        $log = WorkLog::find($id);

        if (!$log) {
            return $this->respond(false, null, 'Work log not found');
        }

        if ($auth['role'] !== 'LEAD' && $log->user_id !== $auth['user_id']) {
            return $this->respond(false, null, 'Forbidden: Access denied to this log', null, 403);
        }

        $lArray = $log->toArray();
        $lArray['userId'] = $log->user_id;
        $lArray['taskId'] = $log->task_id;

        return $this->respond(true, $lArray);
    }

    public function store(Request $request)
    {
        $userId = $request->input('userId');
        $taskId = $request->input('taskId');
        $date = $request->input('date');
        $hours = $request->input('hours');
        $description = $request->input('description');

        if (!$userId || !$taskId || !$date || !$hours) {
            return $this->respond(false, null, 'Missing required fields');
        }

        $auth = $this->authenticatedUser($request);
        if ($auth['role'] !== 'LEAD' && $userId !== $auth['user_id']) {
            return $this->respond(false, null, 'Forbidden: Cannot log work for another user', null, 403);
        }

        // Verify task / project membership
        $task = Task::find($taskId);
        if (!$task) {
            return $this->respond(false, null, 'Task not found');
        }

        if ($auth['role'] !== 'LEAD' && $task->assigned_to !== $auth['user_id']) {
            $hasAccess = DB::table('project_members')
                ->where('project_id', $task->project_id)
                ->where('member_id', $auth['user_id'])
                ->exists();
            if (!$hasAccess) {
                return $this->respond(false, null, 'Forbidden: You do not have access to this task', null, 403);
            }
        }

        $logId = (string) Str::uuid();
        $log = WorkLog::create([
            'id' => $logId,
            'user_id' => $userId,
            'task_id' => $taskId,
            'date' => $date,
            'hours' => (float)$hours,
            'description' => $description
        ]);

        return $this->respond(true, ['id' => $logId], null, 'Work log created successfully');
    }

    public function update(Request $request, $id)
    {
        $log = WorkLog::find($id);
        if (!$log) {
            return $this->respond(false, null, 'Work log not found');
        }

        $auth = $this->authenticatedUser($request);
        if ($auth['role'] !== 'LEAD' && $log->user_id !== $auth['user_id']) {
            return $this->respond(false, null, 'Forbidden: Access denied', null, 403);
        }

        $userId = $request->input('userId') ?: $log->user_id;
        if ($auth['role'] !== 'LEAD' && $userId !== $auth['user_id']) {
            return $this->respond(false, null, 'Forbidden: Cannot change user assigned to log', null, 403);
        }

        $log->update([
            'user_id' => $userId,
            'task_id' => $request->input('taskId') ?: $log->task_id,
            'date' => $request->input('date') ?: $log->date,
            'hours' => $request->input('hours') !== null ? (float)$request->input('hours') : $log->hours,
            'description' => $request->input('description') !== null ? $request->input('description') : $log->description,
        ]);

        return $this->respond(true, null, null, 'Work log updated successfully');
    }

    public function destroy(Request $request, $id)
    {
        $log = WorkLog::find($id);
        if (!$log) {
            return $this->respond(false, null, 'Work log not found');
        }

        $auth = $this->authenticatedUser($request);
        if ($auth['role'] !== 'LEAD' && $log->user_id !== $auth['user_id']) {
            return $this->respond(false, null, 'Forbidden: Access denied', null, 403);
        }

        $log->delete();
        return $this->respond(true, null, null, 'Work log deleted successfully');
    }
}
