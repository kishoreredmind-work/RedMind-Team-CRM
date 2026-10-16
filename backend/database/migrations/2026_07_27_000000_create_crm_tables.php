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
        // 1. Update/Create users table columns
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'role')) {
                    $table->string('role')->default('MEMBER');
                }
                if (!Schema::hasColumn('users', 'status')) {
                    $table->string('status')->default('PENDING');
                }
                // Change ID to string if it is standard auto-increment
                // But wait, the existing DB has UUID string as ID!
                // To avoid breaking existing DB, we won't alter the primary key unless it's a fresh run
            });
        }

        // 2. Clients Table
        if (!Schema::hasTable('clients')) {
            Schema::create('clients', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('company')->nullable();
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->text('notes')->nullable();
                $table->uuid('created_by')->nullable();
                $table->timestamps();
            });
        }

        // 3. Projects Table
        if (!Schema::hasTable('projects')) {
            Schema::create('projects', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->text('description')->nullable();
                $table->uuid('client_id')->nullable();
                $table->string('status')->default('New');
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable(); // Matches deadline
                $table->integer('working_days')->default(0);
                $table->json('links')->nullable();
                $table->uuid('created_by')->nullable();
                $table->timestamps();
            });
        }

        // 4. Project Members Map Table
        if (!Schema::hasTable('project_members')) {
            Schema::create('project_members', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('project_id');
                $table->uuid('member_id');
                $table->timestamps();
                
                $table->index(['project_id', 'member_id']);
            });
        }

        // 5. Tasks Table
        if (!Schema::hasTable('tasks')) {
            Schema::create('tasks', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('title');
                $table->uuid('project_id');
                $table->uuid('assigned_to')->nullable();
                $table->string('status')->default('To Do');
                $table->string('priority')->default('Medium');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 6. Work Logs Table
        if (!Schema::hasTable('work_logs')) {
            Schema::create('work_logs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id');
                $table->uuid('task_id');
                $table->date('date');
                $table->decimal('hours', 5, 2);
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // 7. Comments Table
        if (!Schema::hasTable('comments')) {
            Schema::create('comments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('task_id');
                $table->uuid('user_id');
                $table->text('content');
                $table->timestamps();
            });
        }

        // 8. Notifications Table
        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id');
                $table->text('message');
                $table->string('link')->nullable();
                $table->boolean('read_status')->default(false);
                $table->timestamps();
            });
        }

        // 9. Activity Logs Table
        if (!Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id');
                $table->string('action');
                $table->text('details')->nullable();
                $table->timestamps();
            });
        }

        // 10. Login Attempts Table
        if (!Schema::hasTable('login_attempts')) {
            Schema::create('login_attempts', function (Blueprint $table) {
                $table->id();
                $table->string('ip', 45);
                $table->string('email');
                $table->timestamp('attempted_at')->useCurrent();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('login_attempts');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('work_logs');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('project_members');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('clients');
    }
};
