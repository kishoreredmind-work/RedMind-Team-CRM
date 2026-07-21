
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, Reminder } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string, id?: string) => void;
  onCreateClick: () => void;
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: { clients: any[], projects: any[], tasks: any[] };
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  onCreateClick, 
  reminders, 
  setReminders,
  searchQuery,
  setSearchQuery,
  searchResults
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = reminders.filter(r => !r.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLead = currentUser.role === UserRole.LEAD;

  const navItems = [
    { id: 'dashboard', label: isLead ? 'Lead View' : 'My Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', show: true },
    { id: 'hub', label: 'Team Hub', icon: 'M12 4.354l1.102 1.102a5 5 0 007.072 0l1.102-1.102M8 8H4.022c-1.735 0-3.137 1.41-3.137 3.146a11.96 11.96 0 005.111 9.854L12 21l6.004-3.146a11.96 11.96 0 005.111-9.854c0-1.737-1.402-3.146-3.137-3.146H16', show: true },
    { id: 'clients', label: 'Clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', show: isLead },
    { id: 'projects', label: 'Projects', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', show: true },
    { id: 'tasks', label: 'My Task', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', show: true },
    { id: 'documents', label: 'Knowledge', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', show: true },
  ].filter(item => item.show);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="p-8 pb-12 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-black/10">R</div>
        <h1 className="text-2xl font-black tracking-tighter text-slate-900">RedMind Team</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-4 px-6 py-4 text-sm font-bold rounded-2xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-black text-white shadow-xl shadow-black/10' 
                : 'text-slate-400 hover:text-black hover:bg-slate-50'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto border-t border-slate-50 space-y-4">
        <div 
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/80 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <img 
            src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}`} 
            className="w-11 h-11 rounded-2xl border-2 border-white shadow-sm object-cover"
            alt="avatar" 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black truncate text-slate-900">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{currentUser.role === UserRole.LEAD ? 'Strategic Lead' : 'Team Member'}</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-red-600 text-white py-4 rounded-2xl transition-all duration-300 font-bold text-sm shadow-xl shadow-slate-900/10 active:scale-95 group"
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F5F6F8] overflow-hidden p-0 m-0 relative">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      <aside className="w-72 bg-white flex flex-col hidden lg:flex border-r border-slate-100 shrink-0">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F6F8]">
        <header className="h-20 md:h-24 flex items-center justify-between px-4 md:px-10 shrink-0 border-b border-slate-100 lg:border-none bg-white lg:bg-transparent">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Hi, {currentUser.name.split(' ')[0]}!
              </h2>
              <p className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{currentUser.role === UserRole.LEAD ? 'Command Center' : 'Operational Node'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative" ref={searchRef}>
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-3 md:p-3.5 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-all border border-slate-100/50"
              >
                <svg className="w-5 md:w-6 h-5 md:h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </button>
              
              {isSearchOpen && (
                <div className="absolute top-full right-0 mt-4 w-72 md:w-96 bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 z-50">
                  <input 
                    autoFocus
                    placeholder="Search anything..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-black font-bold text-sm"
                  />
                  {searchQuery && (
                    <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                      {searchResults.projects.length > 0 && <p className="text-[10px] font-black uppercase text-slate-400">Projects</p>}
                      {searchResults.projects.map(p => (
                        <div key={p.id} onClick={() => {setActiveTab('projects', p.id); setIsSearchOpen(false)}} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer text-sm font-bold">{p.name}</div>
                      ))}
                      {searchResults.clients.length > 0 && <p className="text-[10px] font-black uppercase text-slate-400">Clients</p>}
                      {searchResults.clients.map(c => (
                        <div key={c.id} onClick={() => {setActiveTab('clients'); setIsSearchOpen(false)}} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer text-sm font-bold">{c.company}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-3 md:p-3.5 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-all border border-slate-100/50 relative"
              >
                <svg className="w-5 md:w-6 h-5 md:h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                {unreadCount > 0 && <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
              </button>

              {isNotificationsOpen && (
                <div className="absolute top-full right-0 mt-4 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                  <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                    <h4 className="text-sm font-black text-slate-900">Reminders</h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {reminders.map(r => (
                      <div key={r.id} className={`p-5 hover:bg-slate-50 border-b border-slate-50 flex items-start gap-4 transition-colors ${!r.read ? 'bg-blue-50/20' : ''}`}>
                         <div className={`w-2 h-2 rounded-full mt-1.5 ${r.type === 'deadline' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                         <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{r.title}</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{r.date}</p>
                         </div>
                      </div>
                    ))}
                    {reminders.length === 0 && <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No reminders</div>}
                  </div>
                  <div className="p-4 text-center">
                     <button className="text-[10px] font-black text-slate-400 hover:text-black uppercase tracking-[0.2em]" onClick={() => setReminders(reminders.map(r => ({...r, read: true})))}>Mark all as read</button>
                  </div>
                </div>
              )}
            </div>

            {isLead && (
              <button 
                onClick={onCreateClick}
                className="bg-black text-white px-4 md:px-8 py-2 md:py-3.5 rounded-full text-xs md:text-sm font-black flex items-center gap-2 hover:scale-105 shadow-xl"
              >
                <span className="text-lg leading-none">+</span> <span className="hidden xs:inline">Create</span>
              </button>
            )}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:pb-10 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
