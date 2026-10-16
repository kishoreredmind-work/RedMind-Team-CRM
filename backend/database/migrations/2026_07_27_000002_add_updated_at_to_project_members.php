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
                if (!Schema::hasColumn('project_members', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('project_members')) {
            Schema::table('project_members', function (Blueprint $table) {
                $table->dropColumn('updated_at');
            });
        }
    }
};
