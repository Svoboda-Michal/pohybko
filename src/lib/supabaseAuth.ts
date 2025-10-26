import { supabase } from './supabase';
import { User, School } from '@/types';

export const supabaseAuth = {
  // Login with email and password
  login: async (email: string, password: string): Promise<{ user?: User; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Login failed' };
      }

      // Get user data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        return { error: 'User data not found' };
      }

      // Convert to our User type
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        schoolId: userData.school_id,
        totalPoints: userData.total_points,
        totalCo2SavedG: userData.total_co2_saved_g,
        distanceToSchoolKm: userData.distance_to_school_km,
        role: userData.role,
      };

      return { user };
    } catch (error) {
      return { error: 'Login failed' };
    }
  },

  // Signup new user
  signup: async (name: string, email: string, password: string, role: 'student' | 'admin'): Promise<{ user?: User; error?: string }> => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Signup failed' };
      }

      // Get demo school ID (in real app, you'd select school)
      const { data: schoolData } = await supabase
        .from('schools')
        .select('id')
        .eq('email', 'admin@school.com')
        .single();

      const schoolId = schoolData?.id || '550e8400-e29b-41d4-a716-446655440000';

      // Create user in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name,
          email,
          school_id: schoolId,
          total_points: 0,
          total_co2_saved_g: 0,
          distance_to_school_km: 2.0,
          role,
        })
        .select()
        .single();

      if (userError) {
        return { error: userError.message };
      }

      // Convert to our User type
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        schoolId: userData.school_id,
        totalPoints: userData.total_points,
        totalCo2SavedG: userData.total_co2_saved_g,
        distanceToSchoolKm: userData.distance_to_school_km,
        role: userData.role,
      };

      return { user };
    } catch (error) {
      return { error: 'Signup failed' };
    }
  },

  // Logout
  logout: async () => {
    await supabase.auth.signOut();
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        return null;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !userData) {
        return null;
      }

      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        schoolId: userData.school_id,
        totalPoints: userData.total_points,
        totalCo2SavedG: userData.total_co2_saved_g,
        distanceToSchoolKm: userData.distance_to_school_km,
        role: userData.role,
      };
    } catch (error) {
      return null;
    }
  },

  // Update user points using RPC for atomic increment
  updateUserPoints: async (userId: string, points: number) => {
    const { error } = await supabase.rpc('increment_user_totals', {
      user_uuid: userId,
      points_increment: points,
      co2_increment: 0,
    });

    if (error) {
      console.error('Error updating user points:', error);
    }
  },

  // Update user CO₂ saved using RPC for atomic increment
  updateUserCo2Saved: async (userId: string, co2Grams: number) => {
    const { error } = await supabase.rpc('increment_user_totals', {
      user_uuid: userId,
      points_increment: 0,
      co2_increment: co2Grams,
    });

    if (error) {
      console.error('Error updating user CO₂ saved:', error);
    }
  },

  // Sign in with Google OAuth
  signInWithGoogle: async (): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`, // vráti sa na login stránku
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Google login failed' };
    }
  },

  // Handle OAuth callback and ensure user exists in database
  handleOAuthCallback: async (): Promise<{ user?: User; error?: string }> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        return { error: 'No authenticated user' };
      }

      // Check if user exists in our users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // If user exists, return it
      if (existingUser && !checkError) {
        const user: User = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          schoolId: existingUser.school_id,
          totalPoints: existingUser.total_points,
          totalCo2SavedG: existingUser.total_co2_saved_g,
          distanceToSchoolKm: existingUser.distance_to_school_km,
          role: existingUser.role,
        };
        return { user };
      }

      // User doesn't exist, create new user from OAuth data
      const userName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
      const userEmail = authUser.email || '';

      // Get demo school ID (in real app, you'd select school)
      const { data: schoolData } = await supabase
        .from('schools')
        .select('id')
        .eq('email', 'admin@school.com')
        .single();

      const schoolId = schoolData?.id || '550e8400-e29b-41d4-a716-446655440000';

      // Create user in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          name: userName,
          email: userEmail,
          school_id: schoolId,
          total_points: 0,
          total_co2_saved_g: 0,
          distance_to_school_km: 2.0,
          role: 'student', // default role for OAuth users
        })
        .select()
        .single();

      if (userError) {
        return { error: userError.message };
      }

      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        schoolId: userData.school_id,
        totalPoints: userData.total_points,
        totalCo2SavedG: userData.total_co2_saved_g,
        distanceToSchoolKm: userData.distance_to_school_km,
        role: userData.role,
      };

      return { user };
    } catch (error) {
      return { error: 'OAuth callback failed' };
    }
  },
};
