
import {
  Family, FamilyMembership, FamilyRole, UserProfile,
  Task, CalendarEvent, ShoppingList, ShoppingItem,
  FamilyInvite, InviteStatus, TaskStatus
} from '../types';

/**
 * MOCK DATABASE SERVICE
 * This mimics the API-first backend behavior.
 * All functions enforce multi-tenancy by requiring familyId where appropriate.
 */

const STORAGE_KEYS = {
  USERS: 'famify_users',
  FAMILIES: 'famify_families',
  MEMBERSHIPS: 'famify_memberships',
  TASKS: 'famify_tasks',
  EVENTS: 'famify_events',
  SHOPPING_LISTS: 'famify_shopping_lists',
  SHOPPING_ITEMS: 'famify_shopping_items',
  INVITES: 'famify_invites',
};

const get = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const save = <T,>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockDb = {
  // Profiles
  getProfile: (userId: string) => get<UserProfile>(STORAGE_KEYS.USERS).find(u => u.id === userId),
  saveProfile: (profile: UserProfile) => {
    const users = get<UserProfile>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === profile.id);
    if (index > -1) users[index] = profile;
    else users.push(profile);
    save(STORAGE_KEYS.USERS, users);
  },

  // Families & Memberships
  getFamiliesForUser: (userId: string): FamilyMembership[] => {
    const memberships = get<FamilyMembership>(STORAGE_KEYS.MEMBERSHIPS).filter(m => m.userId === userId);
    const families = get<Family>(STORAGE_KEYS.FAMILIES);
    return memberships.map(m => ({
      ...m,
      family: families.find(f => f.id === m.familyId)
    }));
  },

  createFamily: (name: string, userId: string): Family => {
    const newFamily: Family = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      createdAt: new Date().toISOString()
    };
    const families = get<Family>(STORAGE_KEYS.FAMILIES);
    families.push(newFamily);
    save(STORAGE_KEYS.FAMILIES, families);

    const membership: FamilyMembership = {
      familyId: newFamily.id,
      userId,
      role: FamilyRole.OWNER,
      joinedAt: new Date().toISOString()
    };
    const memberships = get<FamilyMembership>(STORAGE_KEYS.MEMBERSHIPS);
    memberships.push(membership);
    save(STORAGE_KEYS.MEMBERSHIPS, memberships);

    return newFamily;
  },

  getFamilyMembers: (familyId: string) => {
    const memberships = get<FamilyMembership>(STORAGE_KEYS.MEMBERSHIPS).filter(m => m.familyId === familyId);
    const users = get<UserProfile>(STORAGE_KEYS.USERS);
    return memberships.map(m => ({
      ...m,
      profile: users.find(u => u.id === m.userId)
    }));
  },

  // Invites
  createInvite: (familyId: string, email: string, role: FamilyRole, inviterId: string) => {
    const invite: FamilyInvite = {
      id: Math.random().toString(36).substr(2, 9),
      familyId,
      email,
      role,
      inviteCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: InviteStatus.PENDING,
      inviterId,
      createdAt: new Date().toISOString()
    };
    const invites = get<FamilyInvite>(STORAGE_KEYS.INVITES);
    invites.push(invite);
    save(STORAGE_KEYS.INVITES, invites);
    return invite;
  },

  acceptInvite: (code: string, userId: string) => {
    const invites = get<FamilyInvite>(STORAGE_KEYS.INVITES);
    const invite = invites.find(i => i.inviteCode === code && i.status === InviteStatus.PENDING);
    if (!invite) throw new Error("Invalid or expired invite code");

    invite.status = InviteStatus.ACCEPTED;
    save(STORAGE_KEYS.INVITES, invites);

    const membership: FamilyMembership = {
      familyId: invite.familyId,
      userId,
      role: invite.role,
      joinedAt: new Date().toISOString()
    };
    const memberships = get<FamilyMembership>(STORAGE_KEYS.MEMBERSHIPS);
    memberships.push(membership);
    save(STORAGE_KEYS.MEMBERSHIPS, memberships);

    return invite;
  },

  // Tasks
  getTasks: (familyId: string) => get<Task>(STORAGE_KEYS.TASKS).filter(t => t.familyId === familyId),
  upsertTask: (task: Partial<Task> & { familyId: string, createdBy: string }) => {
    const tasks = get<Task>(STORAGE_KEYS.TASKS);
    const id = task.id || Math.random().toString(36).substr(2, 9);
    const newTask = {
      id,
      status: TaskStatus.TODO,
      createdAt: new Date().toISOString(),
      ...task
    } as Task;

    const idx = tasks.findIndex(t => t.id === id);
    if (idx > -1) tasks[idx] = newTask;
    else tasks.push(newTask);
    save(STORAGE_KEYS.TASKS, tasks);
    return newTask;
  },
  deleteTask: (id: string, familyId: string) => {
    const tasks = get<Task>(STORAGE_KEYS.TASKS);
    const updatedTasks = tasks.filter(t => t.id !== id || t.familyId !== familyId);
    save(STORAGE_KEYS.TASKS, updatedTasks);
  },

  // Events
  getEvents: (familyId: string) => get<CalendarEvent>(STORAGE_KEYS.EVENTS).filter(e => e.familyId === familyId),
  upsertEvent: (event: Partial<CalendarEvent> & { familyId: string, createdBy: string }) => {
    const events = get<CalendarEvent>(STORAGE_KEYS.EVENTS);
    const id = event.id || Math.random().toString(36).substr(2, 9);
    const newEvent = {
      id,
      createdAt: new Date().toISOString(),
      ...event
    } as CalendarEvent;

    const idx = events.findIndex(e => e.id === id);
    if (idx > -1) events[idx] = newEvent;
    else events.push(newEvent);
    save(STORAGE_KEYS.EVENTS, events);
    return newEvent;
  },

  // Shopping
  getShoppingLists: (familyId: string) => get<ShoppingList>(STORAGE_KEYS.SHOPPING_LISTS).filter(l => l.familyId === familyId),
  createShoppingList: (familyId: string, name: string) => {
    const list: ShoppingList = {
      id: Math.random().toString(36).substr(2, 9),
      familyId,
      name,
      createdAt: new Date().toISOString()
    };
    const lists = get<ShoppingList>(STORAGE_KEYS.SHOPPING_LISTS);
    lists.push(list);
    save(STORAGE_KEYS.SHOPPING_LISTS, lists);
    return list;
  },
  getShoppingItems: (listId: string) => get<ShoppingItem>(STORAGE_KEYS.SHOPPING_ITEMS).filter(i => i.listId === listId),
  upsertShoppingItem: (item: Partial<ShoppingItem> & { listId: string }) => {
    const items = get<ShoppingItem>(STORAGE_KEYS.SHOPPING_ITEMS);
    const id = item.id || Math.random().toString(36).substr(2, 9);
    const newItem = {
      id,
      isDone: false,
      createdAt: new Date().toISOString(),
      ...item
    } as ShoppingItem;

    const idx = items.findIndex(i => i.id === id);
    if (idx > -1) items[idx] = newItem;
    else items.push(newItem);
    save(STORAGE_KEYS.SHOPPING_ITEMS, items);
    return newItem;
  }
};
