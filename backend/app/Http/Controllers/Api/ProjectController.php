<?php

namespace App\Http\Controllers\Api;

use App\Models\Project;
use App\Models\User;
use App\Models\Notification;
use App\Services\MailService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ProjectController extends ApiController
{
    public function index(Request $request)
    {
        $auth = $this->authenticatedUser($request);
        if ($auth['role'] === 'LEAD') {
            $projects = Project::with('members')->get();
        } else {
            $projects = Project::whereHas('members', function($query) use ($auth) {
                $query->where('member_id', $auth['user_id']);
            })->with('members')->get();
        }

        // Map assignedMemberIds to structure it exactly like custom PHP API
        $mapped = $projects->map(function($p) {
            $pArray = $p->toArray();
            $pArray['assignedMemberIds'] = $p->members->pluck('id')->toArray();
            $pArray['clientId'] = $p->client_id;
            $pArray['startDate'] = $p->start_date;
            $pArray['deadline'] = $p->end_date;
            $pArray['workingDays'] = $p->working_days;
            $pArray['createdBy'] = $p->created_by;
            unset($pArray['members']);
            return $pArray;
        });

        return $this->respond(true, $mapped);
    }

    public function show(Request $request, $id)
    {
        $auth = $this->authenticatedUser($request);
        $project = Project::with('members')->find($id);

        if (!$project) {
            return $this->respond(false, null, 'Project not found');
        }

        // Check Access
        if ($auth['role'] !== 'LEAD' && !$project->members->contains($auth['user_id'])) {
            return $this->respond(false, null, 'Forbidden: Access denied to this project', null, 403);
        }

        $pArray = $project->toArray();
        $pArray['assignedMemberIds'] = $project->members->pluck('id')->toArray();
        $pArray['clientId'] = $project->client_id;
        $pArray['startDate'] = $project->start_date;
        $pArray['deadline'] = $project->end_date;
        $pArray['workingDays'] = $project->working_days;
        $pArray['createdBy'] = $project->created_by;
        unset($pArray['members']);

        return $this->respond(true, $pArray);
    }

    public function store(Request $request)
    {
        $name = $request->input('name');
        $clientId = $request->input('clientId');
        
        if (!$name) {
            return $this->respond(false, null, 'Project name is required');
        }

        $auth = $this->authenticatedUser($request);
        $projectId = (string) Str::uuid();

        $project = Project::create([
            'id' => $projectId,
            'name' => $name,
            'description' => $request->input('description'),
            'client_id' => $clientId,
            'status' => $request->input('status', 'New'),
            'start_date' => $request->input('startDate'),
            'end_date' => $request->input('deadline'),
            'working_days' => (int)$request->input('workingDays', 0),
            'links' => $request->input('links'),
            'created_by' => $auth['user_id']
        ]);

        $assignedMemberIds = $request->input('assignedMemberIds', []);
        if (is_array($assignedMemberIds) && !empty($assignedMemberIds)) {
            foreach ($assignedMemberIds as $memberId) {
                DB::table('project_members')->insert([
                    'id' => (string) Str::uuid(),
                    'project_id' => $projectId,
                    'member_id' => $memberId,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // Create notification
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $memberId,
                    'message' => "You have been assigned to project: " . $name,
                    'link' => 'projects'
                ]);

                // Email notification
                $user = User::find($memberId);
                if ($user && $user->email) {
                    $body = MailService::renderTemplate('project_assignment', [
                        'name' => $user->name,
                        'projectName' => $name,
                        'loginUrl' => env('VITE_API_URL') ?: 'http://localhost:3000'
                    ]);
                    MailService::sendHtmlMail($user->email, "Assigned to Project: " . $name, $body);
                }
            }
        }

        $this->logActivity($auth['user_id'], 'CREATE_PROJECT', "Initiated project: " . $name);
        return $this->respond(true, ['id' => $projectId], null, 'Project created successfully');
    }

    public function update(Request $request, $id)
    {
        $project = Project::find($id);
        if (!$project) {
            return $this->respond(false, null, 'Project not found');
        }

        $auth = $this->authenticatedUser($request);
        $name = $request->input('name') ?: $project->name;

        $project->update([
            'name' => $name,
            'description' => $request->input('description') ?: $project->description,
            'client_id' => $request->input('clientId') ?: $project->client_id,
            'status' => $request->input('status') ?: $project->status,
            'start_date' => $request->input('startDate') ?: $project->start_date,
            'end_date' => $request->input('deadline') ?: $project->end_date,
            'working_days' => $request->input('workingDays') !== null ? (int)$request->input('workingDays') : $project->working_days,
            'links' => $request->input('links') !== null ? $request->input('links') : $project->links,
        ]);

        $assignedMemberIds = $request->input('assignedMemberIds');
        if (is_array($assignedMemberIds)) {
            $currentMembers = DB::table('project_members')->where('project_id', $id)->pluck('member_id')->toArray();
            
            // Delete removed
            $toDelete = array_diff($currentMembers, $assignedMemberIds);
            if (!empty($toDelete)) {
                DB::table('project_members')->where('project_id', $id)->whereIn('member_id', $toDelete)->delete();
            }

            // Add new
            $toAdd = array_diff($assignedMemberIds, $currentMembers);
            if (!empty($toAdd)) {
                foreach ($toAdd as $memberId) {
                    DB::table('project_members')->insert([
                        'id' => (string) Str::uuid(),
                        'project_id' => $id,
                        'member_id' => $memberId,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    Notification::create([
                        'id' => (string) Str::uuid(),
                        'user_id' => $memberId,
                        'message' => "You have been assigned to project: " . $name,
                        'link' => 'projects'
                    ]);

                    $user = User::find($memberId);
                    if ($user && $user->email) {
                        $body = MailService::renderTemplate('project_assignment', [
                            'name' => $user->name,
                            'projectName' => $name,
                            'loginUrl' => env('VITE_API_URL') ?: 'http://localhost:3000'
                        ]);
                        MailService::sendHtmlMail($user->email, "Assigned to Project: " . $name, $body);
                    }
                }
            }
        }

        $this->logActivity($auth['user_id'], 'UPDATE_PROJECT', "Modified project settings or member roster: " . $name);
        return $this->respond(true, null, null, 'Project updated successfully');
    }

    public function destroy(Request $request, $id)
    {
        $project = Project::find($id);
        if (!$project) {
            return $this->respond(false, null, 'Project not found');
        }

        $auth = $this->authenticatedUser($request);
        $name = $project->name;

        DB::table('project_members')->where('project_id', $id)->delete();
        $project->delete();

        $this->logActivity($auth['user_id'], 'DELETE_PROJECT', "Deleted project stream: " . $name);
        return $this->respond(true, null, null, 'Project deleted successfully');
    }
}
