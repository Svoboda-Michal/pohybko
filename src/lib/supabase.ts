import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          school_id: string;
          total_points: number;
          total_co2_saved_g: number;
          distance_to_school_km: number;
          role: 'student' | 'admin';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          school_id: string;
          total_points?: number;
          total_co2_saved_g?: number;
          distance_to_school_km?: number;
          role: 'student' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          school_id?: string;
          total_points?: number;
          total_co2_saved_g?: number;
          distance_to_school_km?: number;
          role?: 'student' | 'admin';
          created_at?: string;
        };
      };
      stations: {
        Row: {
          id: string;
          name: string;
          school_id: string;
          points_value: number;
          total_scans: number;
          total_co2_saved_g: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          school_id: string;
          points_value?: number;
          total_scans?: number;
          total_co2_saved_g?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          school_id?: string;
          points_value?: number;
          total_scans?: number;
          total_co2_saved_g?: number;
          created_at?: string;
        };
      };
      scans: {
        Row: {
          id: string;
          user_id: string;
          station_id: string;
          transport_mode: 'walk' | 'bike' | 'bus' | 'car';
          co2_saved_g: number;
          points: number;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          station_id: string;
          transport_mode: 'walk' | 'bike' | 'bus' | 'car';
          co2_saved_g: number;
          points: number;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          station_id?: string;
          transport_mode?: 'walk' | 'bike' | 'bus' | 'car';
          co2_saved_g?: number;
          points?: number;
          timestamp?: string;
        };
      };
      last_scans: {
        Row: {
          id: string;
          user_id: string;
          station_id: string;
          last_scan: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          station_id: string;
          last_scan: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          station_id?: string;
          last_scan?: string;
        };
      };
    };
  };
}
