
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, UserStatus, Client, Project, Task, Reminder } from './types';
import { database } from './services/database';
import { api } from './services/api';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MemberDashboard from './components/MemberDashboard';
import ClientManager from './components/ClientManager';
import ProjectManager from './components/ProjectManager';
import TaskManager from './components/TaskManager';
import TeamHub from './components/TeamHub';
import DocumentManager from './components/DocumentManager';
import Settings from './components/Settings';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CalendarView from './components/CalendarView';
import AuditLogs from './components/AuditLogs';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('redmin_active_tab') || 'dashboard';
  });
  const [creationTrigger, setCreationTrigger] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUserKey = 'redmin_current_user';

  const handleLogin = (user: User) => {
    localStorage.setItem(currentUserKey, JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleNavigate = (tab: string, id?: string) => {
    setActiveTab(tab);
    localStorage.setItem('redmin_active_tab', tab);
    if (id) {
      setSelectedId(id);
      // Clear after a delay to allow the target component to catch it
      setTimeout(() => setSelectedId(null), 3000);
    }
  };

  const handleCreateTrigger = () => {
    // Determine what to create based on active tab
    let trigger: string | null = null;
    if (activeTab === 'dashboard' || activeTab === 'projects') {
      setActiveTab('projects');
      trigger = 'project';
    } else if (activeTab === 'clients') {
      trigger = 'client';
    } else if (activeTab === 'tasks') {
      trigger = 'task';
    } else if (activeTab === 'hub') {
      setActiveTab('projects');
      trigger = 'project';
    }

    if (trigger) {
      setCreationTrigger(trigger);
      // Reset trigger after a short delay so the component can see it change
      setTimeout(() => setCreationTrigger(null), 100);
    }
  };

  // Restore local session on mount
  useEffect(() => {
    setIsLoading(true);
    setAuthError(null);

    const bootstrap = async () => {
      const rawUser = localStorage.getItem(currentUserKey);
      if (!rawUser) {
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const storedUser = JSON.parse(rawUser) as User;
        setCurrentUser(storedUser);
      } catch (error) {
        console.error('Stored user parse failed', error);
        localStorage.removeItem(currentUserKey);
        setCurrentUser(null);
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Fetch Data when User logs in
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser]);

  // Lightweight Background Polling connection for reliability
  useEffect(() => {
    if (!currentUser || currentUser.status !== UserStatus.APPROVED) return;

    // Initial silent data sync
    fetchAllData();

    // Check for notifications and update state in the background every 12 seconds
    const interval = setInterval(() => {
      api.notifications.list().then(r => {
        const mappedNotifications = Array.isArray(r) 
          ? r.map((n: any) => ({
              id: n.id,
              title: n.message,
              date: new Date(n.createdAt).toLocaleString(),
              type: 'task' as const,
              read: n.isRead,
              userId: n.userId
            }))
          : [];
        setReminders(mappedNotifications);
      }).catch(err => {
        console.warn("Background sync warning:", err);
      });
    }, 12000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUser]);

  const fetchAllData = async () => {
    // Only show full-page loading spinner if we don't have any cached data
    if (clients.length === 0 && projects.length === 0 && tasks.length === 0) {
      setIsLoading(true);
    }
    try {
      const results = await Promise.allSettled([
        api.clients.list(),
        api.projects.list(),
        api.tasks.list(),
        api.notifications.list(),
        api.team.list()
      ]);

      const [clientsRes, projectsRes, tasksRes, notificationsRes, teamRes] = results;

      if (clientsRes.status === 'fulfilled') {
        setClients(clientsRes.value);
      }
      if (projectsRes.status === 'fulfilled') {
        setProjects(projectsRes.value);
      }
      if (tasksRes.status === 'fulfilled') {
        setTasks(tasksRes.value);
      }
      
      if (notificationsRes.status === 'fulfilled') {
        const r = notificationsRes.value;
        const mappedNotifications = Array.isArray(r) 
          ? r.map((n: any) => ({
              id: n.id,
              title: n.message,
              date: new Date(n.createdAt).toLocaleString(),
              type: 'task' as const,
              read: n.isRead,
              userId: n.userId
            }))
          : [];
        setReminders(mappedNotifications);
      }

      if (teamRes.status === 'fulfilled') {
        setTeamMembers(teamRes.value);
      }

      // Log or toast errors for failed parts
      const failures = results
        .map((r, i) => r.status === 'rejected' ? ['Clients', 'Projects', 'Tasks', 'Notifications', 'Team'][i] : null)
        .filter(Boolean);

      if (failures.length > 0) {
        console.warn("CRM Sync warning: Failed to load: " + failures.join(', '));
      }
    } catch (error: any) {
      console.error("API Load Failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem(currentUserKey);
    localStorage.removeItem('redmin_active_tab');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const isLead = currentUser?.role === UserRole.LEAD;

  const searchResults = useMemo(() => {
    if (!searchQuery) return { clients: [], projects: [], tasks: [] };
    const query = searchQuery.toLowerCase();
    return {
      clients: clients.filter(c => c.name.toLowerCase().includes(query) || c.company.toLowerCase().includes(query)),
      projects: projects.filter(p => p.name.toLowerCase().includes(query)),
      tasks: tasks.filter(t => t.title.toLowerCase().includes(query))
    };
  }, [searchQuery, clients, projects, tasks]);

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E9EBED]">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
          <div className="w-16 h-16 bg-black rounded-2xl shadow-xl animate-pulse"></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase mb-2">Authenticating...</p>
            {authError && <p className="text-xs font-bold text-red-400">{authError}</p>}
          </div>
          
          {/* Recovery Button after delay or error */}
          {(authError || isLoading) && (
            <button 
              onClick={handleLogout}
              className="mt-4 px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
            >
              Sign Out & Restart
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Handle Unauthorized Statuses
  if (currentUser.status !== UserStatus.APPROVED) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E9EBED] p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-white w-full max-w-lg text-center animate-in fade-in zoom-in duration-500">
          <div className="inline-flex p-5 bg-orange-100 rounded-[1.5rem] text-orange-600 mb-8">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m0 0v2m0-2h2m-2 0H10m1-11a4 4 0 11-8 0 4 4 0 018 0zM2 17l.621-4.671a10.12 10.12 0 014.022-6.906 10.13 10.13 0 0110.714 0 10.12 10.12 0 014.022 6.906L22 17H2z" /></svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            {currentUser.status === UserStatus.PENDING ? 'Access Pending' : 'Access Restricted'}
          </h2>
          <p className="text-slate-500 text-sm font-bold leading-relaxed mb-8">
            {currentUser.status === UserStatus.PENDING 
              ? "Your account was created successfully, but an administrator (Lead) needs to approve your access before you can enter the dashboard."
              : "Your account access has been restricted. Please contact your system administrator if you believe this is an error."}
          </p>
          <button 
            onClick={handleLogout}
            className="w-full bg-black text-white font-extrabold py-5 px-4 rounded-full transition-all hover:scale-105 shadow-xl text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={handleNavigate}
      onCreateClick={handleCreateTrigger}
      reminders={reminders}
      setReminders={setReminders}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchResults={searchResults}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
           <div className="w-12 h-12 bg-black rounded-xl"></div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing CRM Data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            isLead 
              ? <Dashboard clients={clients} projects={projects} tasks={tasks} onNavigate={handleNavigate} teamMembers={teamMembers} refreshAll={fetchAllData} />
              : <MemberDashboard currentUser={currentUser} clients={clients} projects={projects} tasks={tasks} onNavigate={handleNavigate} refreshTasks={fetchAllData} />
          )}
          {activeTab === 'clients' && <ClientManager clients={clients} setClients={setClients} isAdmin={isLead} creationTrigger={creationTrigger === 'client'} />}
          {activeTab === 'projects' && <ProjectManager projects={projects} setProjects={setProjects} clients={clients} teamMembers={teamMembers} isAdmin={isLead} currentUserId={currentUser.id} creationTrigger={creationTrigger === 'project'} selectedId={selectedId} />}
          {activeTab === 'tasks' && <TaskManager tasks={tasks} setTasks={setTasks} projects={projects} teamMembers={teamMembers} isAdmin={isLead} currentUserId={currentUser.id} creationTrigger={creationTrigger === 'task'} selectedId={selectedId} />}
          {activeTab === 'hub' && <TeamHub members={teamMembers} tasks={tasks} isAdmin={isLead} refreshMembers={fetchAllData} onNavigate={handleNavigate} />}
          {activeTab === 'analytics' && <AnalyticsDashboard projects={projects} tasks={tasks} teamMembers={teamMembers} />}
          {activeTab === 'calendar' && <CalendarView projects={projects} tasks={tasks} />}
          {activeTab === 'audit-logs' && <AuditLogs />}
          {activeTab === 'documents' && <DocumentManager projects={projects} tasks={tasks} />}
          {activeTab === 'settings' && <Settings user={currentUser} onUpdateUser={fetchAllData} />}
        </>
      )}
    </Layout>
  );
};

export default App;
