export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string | null;
          target_per_week: number;
          difficulty_level: number;
          color: string | null;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string | null;
          target_per_week?: number;
          difficulty_level?: number;
          color?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string | null;
          target_per_week?: number;
          difficulty_level?: number;
          color?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
      };
      check_ins: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          date: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          habit_id?: string;
          user_id?: string;
          date?: string;
          note?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Habit = Database["public"]["Tables"]["habits"]["Row"];
export type HabitInsert = Database["public"]["Tables"]["habits"]["Insert"];
export type HabitUpdate = Database["public"]["Tables"]["habits"]["Update"];
export type CheckIn = Database["public"]["Tables"]["check_ins"]["Row"];
export type CheckInInsert = Database["public"]["Tables"]["check_ins"]["Insert"];
