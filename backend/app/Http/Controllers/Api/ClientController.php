<?php

namespace App\Http\Controllers\Api;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClientController extends ApiController
{
    public function index()
    {
        $clients = Client::orderBy('created_at', 'DESC')->get();
        return $this->respond(true, $clients);
    }

    public function show($id)
    {
        $client = Client::find($id);
        if (!$client) {
            return $this->respond(false, null, 'Client not found');
        }
        return $this->respond(true, $client);
    }

    public function store(Request $request)
    {
        $name = $request->input('name');
        if (!$name) {
            return $this->respond(false, null, 'Client name is required');
        }

        $auth = $this->authenticatedUser($request);
        $clientId = (string) Str::uuid();

        $client = Client::create([
            'id' => $clientId,
            'name' => $name,
            'company' => $request->input('company'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'notes' => $request->input('notes'),
            'created_by' => $auth['user_id']
        ]);

        return $this->respond(true, ['id' => $clientId], null, 'Client created successfully');
    }

    public function update(Request $request, $id)
    {
        $client = Client::find($id);
        if (!$client) {
            return $this->respond(false, null, 'Client not found');
        }

        $client->update($request->only(['name', 'company', 'email', 'phone', 'notes']));
        return $this->respond(true, null, null, 'Client updated successfully');
    }

    public function destroy($id)
    {
        $client = Client::find($id);
        if (!$client) {
            return $this->respond(false, null, 'Client not found');
        }

        $client->delete();
        return $this->respond(true, null, null, 'Client deleted successfully');
    }
}
