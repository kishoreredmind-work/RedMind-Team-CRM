<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireLead
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->get('authenticated_user');
        if (!$user || $user['role'] !== 'LEAD') {
            return response()->json([
                'success' => false,
                'error' => 'Forbidden: Lead privileges required'
            ], 403);
        }
        return $next($request);
    }
}
