import { database } from './database';
import { Client, Project, Task, Reminder, User, UserRole, UserStatus, ProjectStatus, TaskStatus, TaskPriority, WorkLog, Comment } from '../types';

const CURRENT_USER_KEY = 'redmin_current_user';

const readCurrentUser = (): User | null => {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const writeCurrentUser = (user: User) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

const mapClient = (c: any): Client => ({
  id: c.id,
  name: c.name,
  company: c.company || '',
  email: c.email || '',
  phone: c.phone || '',
  notes: c.notes || '',
  created_by: c.created_by
});

const mapProject = (p: any): Project => ({
  id: p.id,
  name: p.name,
  description: p.description || '',
  clientId: p.clientId ?? p.client_id ?? '',
  status: (p.status as ProjectStatus) || ProjectStatus.NEW,
  startDate: p.startDate ?? p.start_date ?? '',
  deadline: p.deadline ?? p.end_date ?? '',
  workingDays: Number(p.workingDays ?? p.working_days ?? 0),
  assignedMemberIds: p.assignedMemberIds || p.assigned_member_ids || [],
  links: p.links || undefined,
  created_by: p.created_by
});

const mapTask = (t: any): Task => ({
  id: t.id,
  title: t.title,
  projectId: t.projectId ?? t.project_id ?? '',
  assignedTo: t.assignedTo ?? t.assigned_to,
  status: (t.status as TaskStatus) || TaskStatus.TO_DO,
  priority: (t.priority as TaskPriority) || TaskPriority.MEDIUM,
  notes: t.notes || ''
});

export const api = {
  auth: {
    getMe: async (): Promise<User> => {
      const user = readCurrentUser();
      if (!user) throw new Error('Unauthorized');
      return user;
    },
    signUp: async (data: { email: string; password: string; name: string }): Promise<void> => {
      await database.auth.signup(data.email, data.password, data.name);
    },
    updateProfile: async (data: Partial<User>): Promise<void> => {
      const currentUser = readCurrentUser();
      if (!currentUser) throw new Error('Unauthorized');

      await database.auth.updateProfile(currentUser.id, {
        name: data.name,
        avatar: data.avatar
      });

      writeCurrentUser({
        ...currentUser,
        name: data.name ?? currentUser.name,
        avatar: data.avatar ?? currentUser.avatar
      });
    }
  },

  storage: {
    uploadAvatar: async (file: File): Promise<string> => {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(file);
      });
    }
  },

  clients: {
    list: async (): Promise<Client[]> => {
      const data = await database.clients.getAll();
      return Array.isArray(data) ? data.map(mapClient) : [];
    },
    save: async (data: Partial<Client>): Promise<Client> => {
      if (data.id) {
        await database.clients.update(data.id, data);
        return mapClient({ ...data, id: data.id });
      }

      const result = await database.clients.create(data);
      return mapClient({ ...data, ...result });
    },
    delete: async (id: string): Promise<void> => {
      await database.clients.delete(id);
    }
  },

  projects: {
    list: async (): Promise<Project[]> => {
      const data = await database.projects.getAll();
      return Array.isArray(data) ? data.map(mapProject) : [];
    },
    save: async (data: Partial<Project>, memberIds?: string[]): Promise<Project> => {
      const payload = {
        ...data,
        assignedMemberIds: memberIds ?? data.assignedMemberIds ?? []
      };

      if (data.id) {
        await database.projects.update(data.id, payload);
        return mapProject({ ...payload, id: data.id });
      }

      const result = await database.projects.create(payload);
      return mapProject({ ...payload, ...result });
    },
    delete: async (id: string): Promise<void> => {
      await database.projects.delete(id);
    }
  },

  tasks: {
    list: async (projectId?: string): Promise<Task[]> => {
      const data = projectId ? await database.tasks.getByProject(projectId) : await database.tasks.getAll();
      return Array.isArray(data) ? data.map(mapTask) : [];
    },
    save: async (data: Partial<Task>): Promise<Task> => {
      if (data.id) {
        await database.tasks.update(data.id, data);
        return mapTask({ ...data, id: data.id });
      }

      const result = await database.tasks.create(data);
      return mapTask({ ...data, ...result });
    }
  },

  workLogs: {
    list: async (taskId?: string): Promise<WorkLog[]> => {
      const data = await database.workLogs.getAll();
      return Array.isArray(data)
        ? data
            .filter((item: any) => !taskId || item.taskId === taskId || item.task_id === taskId)
            .map((l: any) => ({
              id: l.id,
              taskId: l.taskId ?? l.task_id,
              memberId: l.memberId ?? l.userId ?? l.member_id ?? l.user_id,
              logDate: l.logDate ?? l.date ?? l.log_date,
              hours: Number(l.hours),
              description: l.description || ''
            }))
        : [];
    },
    save: async (data: Partial<WorkLog>): Promise<WorkLog> => {
      const result = await database.workLogs.create({
        taskId: data.taskId,
        userId: data.memberId,
        date: data.logDate,
        hours: data.hours,
        description: data.description
      });

      return {
        id: result?.id || crypto.randomUUID(),
        taskId: data.taskId || '',
        memberId: data.memberId || '',
        logDate: data.logDate || '',
        hours: data.hours || 0,
        description: data.description || ''
      };
    }
  },

  comments: {
    list: async (taskId: string): Promise<Comment[]> => {
      const data = await database.comments.getByTask(taskId);
      return Array.isArray(data)
        ? data.map((c: any) => ({
            id: c.id,
            taskId: c.taskId ?? c.task_id,
            authorId: c.authorId ?? c.user_id ?? c.userId,
            body: c.body ?? c.content ?? '',
            createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString(),
            userName: c.userName ?? c.user_name ?? 'Specialist'
          }))
        : [];
    },
    save: async (data: Partial<Comment>): Promise<Comment> => {
      const result = await database.comments.create({
        taskId: data.taskId,
        userId: data.authorId,
        content: data.body
      });

      return {
        id: result?.id || crypto.randomUUID(),
        taskId: data.taskId || '',
        authorId: data.authorId || '',
        body: data.body || '',
        createdAt: new Date().toISOString()
      };
    }
  },

  activityLogs: {
    list: async (): Promise<any[]> => {
      const data = await database.activityLogs.getAll();
      return Array.isArray(data) ? data : [];
    }
  },

  reminders: {
    list: async (): Promise<Reminder[]> => {
      return [];
    }
  },

  team: {
    list: async (): Promise<User[]> => {
      const data = await database.members.getAll();
      return Array.isArray(data)
        ? data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email || '',
            role: (p.role as UserRole) || UserRole.TEAM_MEMBER,
            status: (p.status as UserStatus) || UserStatus.PENDING,
            avatar: p.avatar || p.avatar_url
          }))
        : [];
    },
    updateStatus: async (userId: string, status: UserStatus): Promise<void> => {
      await database.members.update(userId, { status });
    },
    create: async (data: any): Promise<User> => {
      const result = await database.members.create(data);
      return {
        id: result?.id || crypto.randomUUID(),
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status || 'APPROVED'
      };
    },
    delete: async (id: string): Promise<void> => {
      await database.members.delete(id);
    }
  },

  notifications: {
    list: async (): Promise<any[]> => {
      return await database.notifications.getAll();
    },
    markAsRead: async (id?: string): Promise<void> => {
      await database.notifications.markAsRead(id);
    }
  }
};
