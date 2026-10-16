
import { User, UserRole, Client, Project, ProjectStatus, Task, TaskStatus, TaskPriority, Reminder } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Admin', email: 'admin@company.com', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=alice' },
  { id: 'u2', name: 'Bob Member', email: 'bob@company.com', role: UserRole.TEAM_MEMBER, avatar: 'https://i.pravatar.cc/150?u=bob' },
  { id: 'u3', name: 'Charlie Dev', email: 'charlie@company.com', role: UserRole.TEAM_MEMBER, avatar: 'https://i.pravatar.cc/150?u=charlie' },
];

export const MOCK_CLIENTS: Client[] = [
  { id: 'c1', name: 'John Doe', company: 'Acme Corp', email: 'john@acme.com', phone: '555-0199', notes: 'Prefers minimalist designs.' },
  { id: 'c2', name: 'Sarah Smith', company: 'TechFlow', email: 'sarah@techflow.io', phone: '555-0122', notes: 'Quarterly web maintenance needed.' },
  { id: 'c3', name: 'David Miller', company: 'Global Solutions', email: 'david@globalsol.com', phone: '555-0344', notes: 'New infrastructure project.' },
];

export const MOCK_PROJECTS: Project[] = [
  { 
    id: 'p1', 
    name: 'Website Redesign', 
    clientId: 'c1', 
    status: ProjectStatus.IN_PROGRESS, 
    deadline: '2024-06-15', 
    assignedMemberId: 'u2',
    links: { 
      figma: 'https://figma.com', 
      live: 'https://acme.com',
      googleDoc: 'https://docs.google.com/document/d/1sample',
      googleSheet: 'https://docs.google.com/spreadsheets/d/1sample'
    }
  },
  { 
    id: 'p2', 
    name: 'Cloud Infrastructure', 
    clientId: 'c2', 
    status: ProjectStatus.NEW, 
    deadline: '2024-07-01', 
    assignedMemberId: 'u3',
    links: { 
      github: 'https://github.com',
      googleDoc: 'https://docs.google.com/document/d/2sample'
    }
  },
  { 
    id: 'p3', 
    name: 'Mobile App V2', 
    clientId: 'c3', 
    status: ProjectStatus.IN_PROGRESS, 
    deadline: '2024-08-20', 
    assignedMemberId: 'u2',
    links: {
      googleSheet: 'https://docs.google.com/spreadsheets/d/3sample'
    }
  },
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Audit Current Database', projectId: 'p2', status: TaskStatus.DOING, priority: TaskPriority.HIGH },
  { id: 't2', title: 'Draft API Documentation', projectId: 'p1', status: TaskStatus.TO_DO, priority: TaskPriority.MEDIUM },
  { id: 't3', title: 'Client Feedback Session', projectId: 'p1', status: TaskStatus.TO_DO, priority: TaskPriority.URGENT },
  { id: 't4', title: 'Finalize UI Components', projectId: 'p1', status: TaskStatus.DONE, priority: TaskPriority.LOW },
  { id: 't5', title: 'Security Patching', projectId: 'p2', status: TaskStatus.DOING, priority: TaskPriority.URGENT },
];

export const MOCK_REMINDERS: Reminder[] = [
  { id: 'r1', title: 'Acme Redesign Deadline', date: '2024-06-15', type: 'deadline', read: false },
  { id: 'r2', title: 'Weekly Sprint Review', date: '2024-06-12', type: 'meeting', read: false },
  { id: 'r3', title: 'Review Security Patches', date: '2024-06-10', type: 'task', read: true },
];
