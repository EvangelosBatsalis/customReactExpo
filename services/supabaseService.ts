
import { supabase } from '../supabaseClient';
import {
    Family, FamilyMembership, Task, CalendarEvent,
    ShoppingList, ShoppingItem, Expense,
    UserProfile
} from '../types';

export const supabaseService = {
    // Families
    async createFamily(name: string, userId: string) {
        const { data: family, error: fError } = await supabase
            .from('families')
            .insert([{ name }])
            .select()
            .single();

        if (fError) throw fError;

        const { error: mError } = await supabase
            .from('family_members')
            .insert([{ family_id: family.id, user_id: userId, role: 'OWNER' }]);

        if (mError) throw mError;
        return family;
    },

    async getFamiliesForUser(userId: string) {
        const { data, error } = await supabase
            .from('family_members')
            .select('*, family:families(*)')
            .eq('user_id', userId);

        if (error) throw error;
        // Map Supabase response to FamilyMembership type structure if needed
        // The query returns nested family object which matches our type (mostly)
        return data.map((d: any) => ({
            familyId: d.family_id,
            userId: d.user_id,
            role: d.role,
            joinedAt: d.joined_at,
            family: {
                id: d.family.id,
                name: d.family.name,
                avatarUrl: d.family.avatar_url,
                createdAt: d.family.created_at
            }
        })) as FamilyMembership[];
    },

    // Shopping Lists
    async getShoppingLists(familyId: string) {
        const { data, error } = await supabase
            .from('shopping_lists')
            .select('*')
            .eq('family_id', familyId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        // Remap snake_case to camelCase
        return data.map((d: any) => ({
            id: d.id,
            familyId: d.family_id,
            name: d.name,
            createdAt: d.created_at
        })) as ShoppingList[];
    },

    async createShoppingList(familyId: string, name: string) {
        const { data, error } = await supabase
            .from('shopping_lists')
            .insert([{ family_id: familyId, name }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            familyId: data.family_id,
            name: data.name,
            createdAt: data.created_at
        } as ShoppingList;
    },

    async deleteShoppingList(listId: string) {
        const { error } = await supabase
            .from('shopping_lists')
            .delete()
            .eq('id', listId);
        if (error) throw error;
    },

    // Shopping Items
    async getShoppingItems(listId: string) {
        const { data, error } = await supabase
            .from('shopping_items')
            .select('*')
            .eq('list_id', listId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data.map((d: any) => ({
            id: d.id,
            listId: d.list_id,
            title: d.title,
            isDone: d.is_done,
            createdAt: d.created_at
        })) as ShoppingItem[];
    },

    async addShoppingItem(listId: string, title: string) {
        const { data, error } = await supabase
            .from('shopping_items')
            .insert([{ list_id: listId, title }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            listId: data.list_id,
            title: data.title,
            isDone: data.is_done,
            createdAt: data.created_at
        } as ShoppingItem;
    },

    async toggleShoppingItem(itemId: string, isDone: boolean) {
        const { data, error } = await supabase
            .from('shopping_items')
            .update({ is_done: isDone })
            .eq('id', itemId)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            listId: data.list_id,
            title: data.title,
            isDone: data.is_done,
            createdAt: data.created_at
        } as ShoppingItem;
    },

    async deleteShoppingItem(itemId: string) {
        const { error } = await supabase
            .from('shopping_items')
            .delete()
            .eq('id', itemId);
        if (error) throw error;
    },

    // Events
    async getEvents(familyId: string) {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('family_id', familyId)
            .order('start_at', { ascending: true });

        if (error) throw error;
        return data.map((d: any) => ({
            id: d.id,
            familyId: d.family_id,
            title: d.title,
            notes: d.notes,
            startAt: d.start_at,
            endAt: d.end_at,
            createdBy: d.created_by,
            createdAt: d.created_at
        })) as CalendarEvent[];
    },

    async createEvent(familyId: string, event: Partial<CalendarEvent>) {
        const { data, error } = await supabase
            .from('events')
            .insert([{
                family_id: familyId,
                title: event.title,
                notes: event.notes,
                start_at: event.startAt,
                end_at: event.endAt,
                created_by: event.createdBy
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            familyId: data.family_id,
            title: data.title,
            notes: data.notes,
            startAt: data.start_at,
            endAt: data.end_at,
            createdBy: data.created_by,
            createdAt: data.created_at
        } as CalendarEvent;
    },

    async deleteEvent(eventId: string) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);
        if (error) throw error;
    },

    // Finance / Expenses
    async getExpenses(familyId: string) {
        // Note: This requires the expenses table to exist (as per finance_schema.sql)
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('family_id', familyId)
            .order('date', { ascending: false });

        if (error) throw error;
        return data.map((d: any) => ({
            id: d.id,
            familyId: d.family_id,
            amount: d.amount,
            category: d.category,
            description: d.description,
            date: d.date,
            paidBy: d.paid_by,
            createdAt: d.created_at
        })) as Expense[];
    },

    async createExpense(familyId: string, expense: Partial<Expense>) {
        const { data, error } = await supabase
            .from('expenses')
            .insert([{
                family_id: familyId,
                amount: expense.amount,
                category: expense.category,
                description: expense.description,
                date: expense.date,
                paid_by: expense.paidBy
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            familyId: data.family_id,
            amount: data.amount,
            category: data.category,
            description: data.description,
            date: data.date,
            paidBy: data.paid_by,
            createdAt: data.created_at
        } as Expense;
    },

    async deleteExpense(expenseId: string) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenseId);
        if (error) throw error;
    }
};
