export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum UserRole {
  LEAD = 'LEAD',
  TEAM_MEMBER = 'TEAM_MEMBER'
}

export enum ProjectStatus {
  NEW = 'New',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  COMPLETED = 'Completed'
}

export enum TaskStatus {
  TO_DO = 'To Do',
  DOING = 'Doing',
  DONE = 'Done'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  created_by?: string;
}

export interface ProjectLinks {
  figma?: string;
  github?: string;
  live?: string;
  googleDoc?: string;
  googleSheet?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  workingDays: number;
  assignedMemberIds: string[]; // Many-to-many relationship
  links?: ProjectLinks;
  created_by?: string;
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  assignedTo?: string;
  status: TaskStatus;
  priority: TaskPriority;
  notes?: string;
}

export interface WorkLog {
  id: string;
  taskId: string;
  memberId: string;
  logDate: string;
  hours: number;
  description: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  userName?: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  type: 'deadline' | 'meeting' | 'task';
  read: boolean;
  userId: string;
}
