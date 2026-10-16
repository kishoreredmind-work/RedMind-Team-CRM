<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('project_members')) {
            Schema::table('project_members', function (Blueprint $table) {
                if (!Schema::hasColumn('project_members', 'id')) {
                    // We add id as a nullable/default string column to prevent key constraint issues on existing data
                    $table->uuid('id')->nullable()->first();
                }
                if (!Schema::hasColumn('project_members', 'created_at')) {
                    $table->timestamps();
                }
            });
            
            // Populate missing UUIDs for existing rows
            $rows = DB::table('project_members')->whereNull('id')->get();
            foreach ($rows as $row) {
                DB::table('project_members')
                    ->where('project_id', $row->project_id)
                    ->where('member_id', $row->member_id)
                    ->update(['id' => (string) Illuminate\Support\Str::uuid()]);
            }
            
            // Set it to not null after populating
            try {
                Schema::table('project_members', function (Blueprint $table) {
                    $table->uuid('id')->change();
                });
            } catch (\Exception $e) {
                // Ignore if driver doesn't support changing type inline without doctrine/dbal
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('project_members')) {
            Schema::table('project_members', function (Blueprint $table) {
                $table->dropColumn(['id', 'created_at', 'updated_at']);
            });
        }
    }
};
