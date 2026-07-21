# PHP Backend Setup for WAMP

## What I Created
Your PHP backend API is now in the `/api` folder with all endpoints ready to handle requests from the frontend.

## Setup Instructions

### 1. Configure WAMP
Since you're using WAMP, you need to point it to your project's `/api` folder:

**Option A: Use WAMP's DocumentRoot (Recommended)**
- Open `C:\wamp\bin\apache\apache2.4.x\conf\httpd.conf` (or your Apache version)
- Find `DocumentRoot` and change it to:
  ```
  DocumentRoot "d:/Redmin Team CRM/api"
  ```
- Find `<Directory "C:/wamp/www">` and change the path to your api folder
- Restart Apache

**Option B: Create Virtual Host**
- Add to `C:\wamp\bin\apache\apache2.4.x\conf\httpd.conf`:
  ```apache
  <VirtualHost *:3001>
      DocumentRoot "d:/Redmin Team CRM/api"
      ServerName localhost:3001
      <Directory "d:/Redmin Team CRM/api">
          AllowOverride All
          Allow from all
      </Directory>
  </VirtualHost>
  ```
- Add to `C:\Windows\System32\drivers\etc\hosts`:
  ```
  127.0.0.1   localhost:3001
  ```
- Listen on port 3001 in httpd.conf:
  ```
  Listen 3001
  ```

### 2. Enable URL Rewriting
The API uses URL routing. Make sure `.htaccess` support is enabled:

Create `.htaccess` in `/api` folder:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Skip actual files and directories
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Route everything to index.php
    RewriteRule ^(.*)$ /index.php?route=$1 [L,QSA]
</IfModule>
```

### 3. Create Simple .htaccess
Create `api/.htaccess` with this simpler routing:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    RewriteRule ^([a-z0-9\-]+)(/.*)?$ index.php [L]
</IfModule>
```

## API Endpoints

### Base URL: `http://localhost:3001` or `http://localhost/api`

#### Authentication
- `POST /auth/signup` - Register
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/profile/:userId` - Get profile
- `PUT /auth/profile/:userId` - Update profile

#### Clients
- `GET /clients` - All clients
- `GET /clients/:id` - Single client
- `POST /clients` - Create
- `PUT /clients/:id` - Update
- `DELETE /clients/:id` - Delete

#### Projects
- `GET /projects` - All projects
- `GET /projects/:id` - Single project
- `POST /projects` - Create
- `PUT /projects/:id` - Update
- `DELETE /projects/:id` - Delete

#### Tasks
- `GET /tasks` - All tasks
- `GET /tasks/project/:projectId` - Tasks by project
- `GET /tasks/:id` - Single task
- `POST /tasks` - Create
- `PUT /tasks/:id` - Update
- `DELETE /tasks/:id` - Delete

#### Work Logs
- `GET /work-logs` - All work logs
- `GET /work-logs/user/:userId` - User's work logs
- `POST /work-logs` - Create
- `PUT /work-logs/:id` - Update
- `DELETE /work-logs/:id` - Delete

#### Comments
- `GET /comments/task/:taskId` - Comments by task
- `POST /comments` - Create
- `DELETE /comments/:id` - Delete

#### Members
- `GET /members` - All members
- `GET /members/:id` - Single member
- `POST /members` - Create
- `PUT /members/:id` - Update
- `DELETE /members/:id` - Delete

## Testing the API

Use Postman or curl to test:

```bash
# Test connection
curl http://localhost:3001/

# Create a client
curl -X POST http://localhost:3001/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Client","company":"Test Co","created_by":"user-id"}'

# Get all clients
curl http://localhost:3001/clients
```

## Frontend Integration

The frontend is already configured to use this API via `/services/database.ts`. It will automatically:
- Call `http://localhost:3001` for all API requests
- Handle all CRUD operations
- Return properly formatted responses

## File Structure

```
api/
├── config.php          # Database configuration & helpers
├── index.php           # Main router
└── routes/
    ├── auth.php        # Authentication endpoints
    ├── clients.php     # Client CRUD
    ├── projects.php    # Project CRUD
    ├── tasks.php       # Task CRUD
    ├── work-logs.php   # Work log CRUD
    ├── comments.php    # Comments CRUD
    └── members.php     # Team member CRUD
```

## Troubleshooting

**404 Not Found errors:**
- Check `.htaccess` is in `/api` folder
- Ensure `mod_rewrite` is enabled in Apache
- Restart WAMP after changes

**Database Connection Failed:**
- Verify MySQL is running in WAMP
- Check credentials in `config.php` match your WAMP setup
- Ensure `redmin_crm` database exists with tables

**CORS errors:**
- CORS headers are enabled in `config.php`
- Should work from `http://localhost:5173` (React dev server)

## Next Steps

1. Restart WAMP Apache
2. Test API endpoints with Postman or curl
3. Start React dev server: `npm run dev`
4. Components can now use the `database` service to CRUD data
