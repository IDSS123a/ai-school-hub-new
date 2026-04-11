import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: 'admin' | 'teacher' | 'staff';
          staff_sub_role: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_seen_at: string | null;
          preferences: Record<string, unknown>;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          title: string;
          prompt_id: string;
          protocol: string;
          active_module_id: string;
          owner_id: string;
          status: string;
          form_data: Record<string, unknown>;
          output_content: string;
          is_collaborative: boolean;
          share_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      document_collaborators: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          permission: 'view' | 'edit' | 'admin';
          cursor_color: string;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['document_collaborators']['Row'], 'joined_at'>;
        Update: Partial<Database['public']['Tables']['document_collaborators']['Insert']>;
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
};
