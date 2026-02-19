
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if we have profile data in metadata
    // Or fetch from profiles table (better for consistency)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url
      };
    }

    // Fallback if profile doesn't exist yet (e.g. just signed up and trigger hasn't run or using metadata)
    return {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Manually create profile if trigger is not set up
    // Ideally user should run the SQL properly, but this helps
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName
          }
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw here, auth was successful
      }
    }

    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
  }
};
