// MySQL Database Service
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    
    if (!result.success && result.error) {
      throw new Error(result.error);
    }

    return result.data as T;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

export const database = {
  // Authentication
  auth: {
    signup: async (email: string, password: string, name: string) => {
      return apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
    },
    
    login: async (email: string, password: string) => {
      return apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    
    logout: async () => {
      return apiCall('/auth/logout', { method: 'POST' });
    },
    
    getProfile: async (userId: string) => {
      return apiCall(`/auth/profile/${userId}`);
    },
    
    updateProfile: async (userId: string, data: any) => {
      return apiCall(`/auth/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  // Clients
  clients: {
    getAll: async () => apiCall('/clients'),
    getById: async (id: string) => apiCall(`/clients/${id}`),
    create: async (data: any) => apiCall('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: async (id: string, data: any) => apiCall(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: async (id: string) => apiCall(`/clients/${id}`, { method: 'DELETE' }),
  },

  // Projects
  projects: {
    getAll: async () => apiCall('/projects'),
    getById: async (id: string) => apiCall(`/projects/${id}`),
    create: async (data: any) => apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: async (id: string, data: any) => apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: async (id: string) => apiCall(`/projects/${id}`, { method: 'DELETE' }),
  },

  // Tasks
  tasks: {
    getAll: async () => apiCall('/tasks'),
    getByProject: async (projectId: string) => apiCall(`/tasks/project/${projectId}`),
    getById: async (id: string) => apiCall(`/tasks/${id}`),
    create: async (data: any) => apiCall('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: async (id: string, data: any) => apiCall(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: async (id: string) => apiCall(`/tasks/${id}`, { method: 'DELETE' }),
  },

  // Work Logs
  workLogs: {
    getAll: async () => apiCall('/work-logs'),
    getByUser: async (userId: string) => apiCall(`/work-logs/user/${userId}`),
    create: async (data: any) => apiCall('/work-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: async (id: string, data: any) => apiCall(`/work-logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: async (id: string) => apiCall(`/work-logs/${id}`, { method: 'DELETE' }),
  },

  // Comments
  comments: {
    getByTask: async (taskId: string) => apiCall(`/comments/task/${taskId}`),
    create: async (data: any) => apiCall('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    delete: async (id: string) => apiCall(`/comments/${id}`, { method: 'DELETE' }),
  },

  // Team Members
  members: {
    getAll: async () => apiCall('/members'),
    getById: async (id: string) => apiCall(`/members/${id}`),
    create: async (data: any) => apiCall('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: async (id: string, data: any) => apiCall(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: async (id: string) => apiCall(`/members/${id}`, { method: 'DELETE' }),
  },
};

export default database;
