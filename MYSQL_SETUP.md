# MySQL Backend Setup Guide for Redmin CRM

## Changes Made:
✅ Updated `.env` with MySQL configuration  
✅ Created `services/database.ts` - New MySQL API client for frontend

## Frontend Configuration (DONE)

Your `.env` now has:
```
VITE_API_URL=http://localhost:3001
VITE_DB_HOST=localhost
VITE_DB_PORT=3306
VITE_DB_USER=root
VITE_DB_PASSWORD=
VITE_DB_NAME=redmin_crm
```

## Backend Setup (TODO)

You need to create a backend API (Node.js + Express or PHP with WAMP). Here are the required endpoints:

### Authentication Endpoints
- `POST /auth/signup` - Register user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout
- `GET /auth/profile/:userId` - Get user profile
- `PUT /auth/profile/:userId` - Update profile

### Clients Endpoints
- `GET /clients` - Get all clients
- `GET /clients/:id` - Get single client
- `POST /clients` - Create client
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

### Projects Endpoints
- `GET /projects` - Get all projects
- `GET /projects/:id` - Get single project
- `POST /projects` - Create project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Tasks Endpoints
- `GET /tasks` - Get all tasks
- `GET /tasks/project/:projectId` - Get tasks by project
- `GET /tasks/:id` - Get single task
- `POST /tasks` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Work Logs Endpoints
- `GET /work-logs` - Get all work logs
- `GET /work-logs/user/:userId` - Get user's work logs
- `POST /work-logs` - Create work log
- `PUT /work-logs/:id` - Update work log
- `DELETE /work-logs/:id` - Delete work log

### Comments Endpoints
- `GET /comments/task/:taskId` - Get comments for task
- `POST /comments` - Create comment
- `DELETE /comments/:id` - Delete comment

### Team Members Endpoints
- `GET /members` - Get all members
- `GET /members/:id` - Get single member
- `POST /members` - Create member
- `PUT /members/:id` - Update member
- `DELETE /members/:id` - Delete member

## Response Format

All API responses should follow this format:
```json
{
  "success": true,
  "data": { /* your data */ },
  "message": "optional message"
}

// On error:
{
  "success": false,
  "error": "Error message"
}
```

## Database Tables to Create in MySQL

You can now proceed with creating these tables in WAMP:

```sql
CREATE DATABASE redmin_crm;
USE redmin_crm;

-- Create users table
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'TEAM_MEMBER',
  status VARCHAR(50) DEFAULT 'PENDING',
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE clients (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  notes TEXT,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create projects table
CREATE TABLE projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id VARCHAR(36),
  status VARCHAR(50) DEFAULT 'PENDING',
  start_date DATE,
  end_date DATE,
  working_days INT,
  links JSON,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create project_members table
CREATE TABLE project_members (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36),
  member_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (member_id) REFERENCES users(id),
  UNIQUE KEY unique_project_member (project_id, member_id)
);

-- Create tasks table
CREATE TABLE tasks (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  project_id VARCHAR(36),
  assigned_to VARCHAR(36),
  status VARCHAR(50) DEFAULT 'TODO',
  priority VARCHAR(50) DEFAULT 'MEDIUM',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Create work_logs table
CREATE TABLE work_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  task_id VARCHAR(36),
  date DATE,
  hours DECIMAL(5,2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Create comments table
CREATE TABLE comments (
  id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36),
  user_id VARCHAR(36),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Next Steps

1. Create the MySQL database and tables (above SQL provided)
2. Set up a backend API server (Node.js/Express or PHP) running on `localhost:3001`
3. Implement the endpoints listed above to connect to your MySQL database
4. Update the frontend imports from `supabase` to `database` in your components
5. Test the API connections

Let me know when your backend is ready!
