
export enum FamilyRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export enum TaskStatus {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE'
}

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED'
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface Family {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface FamilyMembership {
  familyId: string;
  userId: string;
  role: FamilyRole;
  joinedAt: string;
  family?: Family; // Populated when fetching memberships
}

export interface Task {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  assignedTo?: string; // userId
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  familyId: string;
  title: string;
  notes?: string;
  startAt: string;
  endAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface ShoppingList {
  id: string;
  familyId: string;
  name: string;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  title: string;
  isDone: boolean;
  createdAt: string;
}

export interface FamilyInvite {
  id: string;
  familyId: string;
  email: string;
  inviteCode: string;
  role: FamilyRole;
  status: InviteStatus;
  inviterId: string;
  createdAt: string;
}
