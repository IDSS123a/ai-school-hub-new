// ═══════════════════════════════════════════
// AI SCHOOL HUB v2.0 — CORE TYPE DEFINITIONS
// ═══════════════════════════════════════════

// ─── USER & AUTH TYPES ───────────────────────

export type UserRole = 'admin' | 'teacher' | 'staff';

export type StaffSubRole =
  | 'secretary'
  | 'pedagogue'
  | 'psychologist'
  | 'board_member'
  | 'director';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  staff_sub_role?: StaffSubRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'bs' | 'en';
  notifications_enabled: boolean;
  sidebar_collapsed: boolean;
}

// ─── ROLE ACCESS MAPPING ─────────────────────

export const ROLE_ACCESS: Record<UserRole, PromptCategory[]> = {
  admin:   ['teacher', 'staff', 'admin', 'shared'],
  teacher: ['teacher', 'shared'],
  staff:   ['staff', 'shared'],
};

// ─── PROMPT SYSTEM TYPES ─────────────────────

export type PromptCategory = 'teacher' | 'staff' | 'admin' | 'shared';

export type PromptProtocol = 'standard' | 'advanced' | 'collaborative';

export interface PromptModule {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  system_prompt_template: string;
  output_format: 'rich_text' | 'structured' | 'list' | 'table';
}

export interface PromptDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: PromptCategory;
  tags: string[];
  is_active: boolean;
  is_collaborative: boolean;
  order_index: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  protocols: {
    standard:      PromptProtocol_Config;
    advanced:      PromptProtocol_Config;
    collaborative: PromptProtocol_Config;
  };
  modules: PromptModule[];
}

export interface PromptProtocol_Config {
  id: PromptProtocol;
  label: string;
  description: string;
  enabled: boolean;
  modules: string[];  // module IDs available in this protocol
  ai_config: AIConfig;
}

export interface AIConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt_prefix: string;
  streaming: boolean;
}

// ─── FORM FIELD TYPES ────────────────────────

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'number'
  | 'date'
  | 'daterange'
  | 'radio'
  | 'checkbox'
  | 'toggle'
  | 'rich_text';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FieldOption[];
  validation?: FieldValidation;
  depends_on?: {
    field_id: string;
    value: string;
  };
  help_text?: string;
}

export interface FieldValidation {
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

// ─── DOCUMENT / SESSION TYPES ────────────────

export type DocumentStatus = 'draft' | 'in_progress' | 'complete' | 'archived';

export interface DocumentSession {
  id: string;
  title: string;
  prompt_id: string;
  protocol: PromptProtocol;
  active_module_id: string;
  owner_id: string;
  collaborators: Collaborator[];
  status: DocumentStatus;
  form_data: Record<string, unknown>;
  output_content: string;
  output_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  is_collaborative: boolean;
  share_token?: string;
}

export interface Collaborator {
  user_id: string;
  user: Pick<UserProfile, 'id' | 'full_name' | 'avatar_url' | 'role'>;
  joined_at: string;
  cursor_color: string;
  is_online: boolean;
  last_seen: string;
  permission: 'view' | 'edit' | 'admin';
}

// ─── COLLABORATION TYPES ─────────────────────

export interface PresenceState {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  cursor_color: string;
  current_field?: string;
  last_seen: string;
}

export interface CollaborationEvent {
  type: 'join' | 'leave' | 'update' | 'cursor_move' | 'field_lock' | 'field_unlock';
  user_id: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

// ─── AI / GEMINI TYPES ───────────────────────

export interface GeminiKeyConfig {
  key: string;
  daily_limit: number;
  used_today: number;
  is_active: boolean;
  last_used?: string;
  error_count: number;
}

export interface AIGenerationRequest {
  prompt_id: string;
  module_id: string;
  protocol: PromptProtocol;
  form_data: Record<string, unknown>;
  session_id: string;
  user_id: string;
  streaming: boolean;
  prompt_text?: string;
}

export interface AIGenerationResult {
  content: string;
  tokens_used: number;
  key_index: number;
  duration_ms: number;
  model: string;
}

// ─── ACTIVITY LOG TYPES ──────────────────────

export interface ActivityLog {
  id: string;
  user_id: string;
  user: Pick<UserProfile, 'full_name' | 'avatar_url'>;
  action: ActivityAction;
  entity_type: 'document' | 'prompt' | 'user' | 'system';
  entity_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'share'
  | 'export'
  | 'login'
  | 'logout'
  | 'ai_generate'
  | 'collaborate_join'
  | 'collaborate_leave';

// ─── UI STATE TYPES ──────────────────────────

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string | number;
  roles: UserRole[];
  children?: SidebarItem[];
}
