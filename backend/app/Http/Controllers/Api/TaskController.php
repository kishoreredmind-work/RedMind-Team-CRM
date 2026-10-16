<?php

namespace App\Http\Controllers\Api;

use App\Models\Task;
use App\Models\User;
use App\Models\Notification;
use App\Services\MailService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class TaskController extends ApiController
{
    public function index(Request $request)
    {
        $auth = $this->authenticatedUser($request);
        if ($auth['role'] === 'LEAD') {
            $tasks = Task::orderBy('created_at', 'DESC')->get();
        } else {
            $tasks = Task::where(function($query) use ($auth) {
                $query->where('assigned_to', $auth['user_id'])
                      ->orWhereIn('project_id', function($sub) use ($auth) {
                          $sub->select('project_id')
                              ->from('project_members')
                              ->where('member_id', $auth['user_id']);
                      });
            })->orderBy('created_at', 'DESC')->get();
        }

        // Map to exact client schema
        $mapped = $tasks->map(function($t) {
            $tArray = $t->toArray();
            $tArray['projectId'] = $t->project_id;
            $tArray['assignedTo'] = $t->assigned_to;
            return $tArray;
        });

        return $this->respond(true, $mapped);
    }

    public function getByProject(Request $request, $projectId)
    {
        $auth = $this->authenticatedUser($request);
        
        // Members access validation
        if ($auth['role'] !== 'LEAD') {
            $hasAccess = DB::table('project_members')
                ->where('project_id', $projectId)
                ->where('member_id', $auth['user_id'])
                ->exists();
            if (!$hasAccess) {
                return $this->respond(false, null, 'Forbidden: You do not have access to this project', null, 403);
            }
        }

        $tasks = Task::where('project_id', $projectId)->orderBy('created_at', 'DESC')->get();
        
        $mapped = $tasks->map(function($t) {
            $tArray = $t->toArray();
            $tArray['projectId'] = $t->project_id;
            $tArray['assignedTo'] = $t->assigned_to;
            return $tArray;
        });

        return $this->respond(true, $mapped);
    }

    public function show(Request $request, $id)
    {
        $auth = $this->authenticatedUser($request);
        $task = Task::find($id);

        if (!$task) {
            return $this->respond(false, null, 'Task not found');
        }

        // Access check
        if ($auth['role'] !== 'LEAD' && $task->assigned_to !== $auth['user_id']) {
            $hasAccess = DB::table('project_members')
                ->where('project_id', $task->project_id)
                ->where('member_id', $auth['user_id'])
                ->exists();
            if (!$hasAccess) {
                return $this->respond(false, null, 'Forbidden: Access denied to this task', null, 403);
            }
        }

        $tArray = $task->toArray();
        $tArray['projectId'] = $task->project_id;
        $tArray['assignedTo'] = $task->assigned_to;

        return $this->respond(true, $tArray);
    }

    public function store(Request $request)
    {
        $title = $request->input('title');
        $projectId = $request->input('projectId');

        if (!$title || !$projectId) {
            return $this->respond(false, null, 'Title and projectId are required');
        }

        $auth = $this->authenticatedUser($request);
        $taskId = (string) Str::uuid();
        $assignedTo = $request->input('assignedTo');

        $task = Task::create([
            'id' => $taskId,
            'title' => $title,
            'project_id' => $projectId,
            'assigned_to' => $assignedTo,
            'status' => $request->input('status', 'To Do'),
            'priority' => $request->input('priority', 'Medium'),
            'notes' => $request->input('notes')
        ]);

        if ($assignedTo) {
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $assignedTo,
                'message' => "You have been assigned to task: " . $title,
                'link' => 'tasks'
            ]);

            $user = User::find($assignedTo);
            if ($user && $user->email) {
                $body = MailService::renderTemplate('task_assignment', [
                    'name' => $user->name,
                    'taskTitle' => $title,
                    'loginUrl' => env('VITE_API_URL') ?: 'http://localhost:3000'
                ]);
                MailService::sendHtmlMail($user->email, "New Task Assignment: " . $title, $body);
            }
        }

        $this->logActivity($auth['user_id'], 'CREATE_TASK', "Allocated task segment: " . $title);
        return $this->respond(true, ['id' => $taskId], null, 'Task created successfully');
    }

    public function update(Request $request, $id)
    {
        $task = Task::find($id);
        if (!$task) {
            return $this->respond(false, null, 'Task not found');
        }

        $auth = $this->authenticatedUser($request);

        if ($auth['role'] === 'LEAD') {
            $title = $request->input('title') ?: $task->title;
            $assignedTo = $request->input('assignedTo') ?: $task->assigned_to;
            $status = $request->input('status') ?: $task->status;
            $priority = $request->input('priority') ?: $task->priority;
            $notes = $request->input('notes') !== null ? $request->input('notes') : $task->notes;
            $projectId = $request->input('projectId') ?: $task->project_id;

            $assignedToChanged = ($assignedTo && $assignedTo !== $task->assigned_to);

            $task->update([
                'title' => $title,
                'project_id' => $projectId,
                'assigned_to' => $assignedTo,
                'status' => $status,
                'priority' => $priority,
                'notes' => $notes
            ]);

            if ($assignedToChanged) {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $assignedTo,
                    'message' => "You have been assigned to task: " . $title,
                    'link' => 'tasks'
                ]);

                $user = User::find($assignedTo);
                if ($user && $user->email) {
                    $body = MailService::renderTemplate('task_assignment', [
                        'name' => $user->name,
                        'taskTitle' => $title,
                        'loginUrl' => env('VITE_API_URL') ?: 'http://localhost:3000'
                    ]);
                    MailService::sendHtmlMail($user->email, "New Task Assignment: " . $title, $body);
                }
            }

            $this->logActivity($auth['user_id'], 'UPDATE_TASK', "Updated task: " . $title);
            return $this->respond(true, null, null, 'Task updated successfully');
        } else {
            // Team member updates
            if ($task->assigned_to !== $auth['user_id']) {
                $hasAccess = DB::table('project_members')
                    ->where('project_id', $task->project_id)
                    ->where('member_id', $auth['user_id'])
                    ->exists();
                if (!$hasAccess) {
                    return $this->respond(false, null, 'Forbidden: You are not assigned to this task', null, 403);
                }
            }

            $status = $request->input('status') ?: $task->status;
            $notes = $request->input('notes') !== null ? $request->input('notes') : $task->notes;

            $statusChanged = ($status && $status !== $task->status);

            $task->update([
                'status' => $status,
                'notes' => $notes
            ]);

            if ($statusChanged) {
                $leads = User::where('role', 'LEAD')->get();
                $memName = User::where('id', $auth['user_id'])->value('name') ?: 'Team Member';

                foreach ($leads as $lead) {
                    $msg = $memName . " updated task status to '" . $status . "': " . $task->title;
                    Notification::create([
                        'id' => (string) Str::uuid(),
                        'user_id' => $lead->id,
                        'message' => $msg,
                        'link' => 'tasks'
                    ]);

                    if ($lead->email) {
                        $body = MailService::renderTemplate('task_status_update', [
                            'leadName' => $lead->name,
                            'taskTitle' => $task->title,
                            'memberName' => $memName,
                            'status' => $status,
                            'loginUrl' => env('VITE_API_URL') ?: 'http://localhost:3000'
                        ]);
                        MailService::sendHtmlMail($lead->email, "Task Update Alert: " . $task->title, $body);
                    }
                }
            }

            $this->logActivity($auth['user_id'], 'UPDATE_TASK_STATUS', "Updated status to '" . $status . "' for task: " . $task->title);
            return $this->respond(true, null, null, 'Task updated successfully');
        }
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::find($id);
        if (!$task) {
            return $this->respond(false, null, 'Task not found');
        }

        $auth = $this->authenticatedUser($request);
        $title = $task->title;

        $task->delete();

        $this->logActivity($auth['user_id'], 'DELETE_TASK', "Deleted task: " . $title);
        return $this->respond(true, null, null, 'Task deleted successfully');
    }
}
