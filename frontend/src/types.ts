export type Role = 'user' | 'admin' | 'technician';
export interface User {
  id: number; name: string; email: string; role: Role; status: string; createdAt?: string;
  serviceSkills?: Pick<Service, 'id' | 'name' | 'icon'>[];
}
export interface Service { id: number; name: string; description: string; icon: string; status: string }
export interface RequestItem {
  id: number; title: string; description: string; priority: string; status: string;
  attachment: string | null; createdAt: string;
  service: { id: number; name: string; icon: string };
  user: { id: number; name: string; email: string };
  technician: { id: number; name: string; email: string } | null;
}
export interface Stats {
  total: number; Pending: number; 'In Progress': number;
  'Awaiting Admin Approval': number; Completed: number; Rejected: number;
}
export const STATUSES = ['Pending', 'In Progress', 'Awaiting Admin Approval', 'Completed', 'Rejected'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
