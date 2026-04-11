
export enum ContentType {
  LESSON_PLAN = 'Lesson Planner',
  PROJECT_PLAN = 'Interdisciplinary Project Planner',
  MATERIAL_ADVISOR = 'Educational Material Advisor',
  EVENT_PLANNER = 'Event Planner',
  FIELD_TRIP = 'Field Trip Planner',
  WRITING_ASSISTANT = 'Writing Assistant',
  EXPERT_CONSULTANT = 'Expert Consultant',
  MATH_IBMYP = 'Math Planner (IBMYP)',
  ELT_MENTOR = 'ELT Mentor (Scrivener)',
  BUSINESS_DOC = 'Business Document Assistant'
}

export interface PromptField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
}

export type UserRole = 'admin' | 'teacher' | 'student' | 'director' | 'secretary' | 'counselor' | 'editor';

export interface PromptDefinition {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  fields: PromptField[];
  systemInstruction: string;
  allowedRoles?: UserRole[]; 
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
  groundingSupports?: any[];
  webSearchQueries?: string[];
}

export interface GeneratedContent {
  id: string;
  type: ContentType;
  title: string;
  content: string; // HTML or Markdown
  createdAt: number;
  metadata?: Record<string, any>;
  narrative?: NarrativeData;
  evaluation?: EvaluationData;
  groundingMetadata?: GroundingMetadata;
}

export interface NarrativeData {
  summary: string;
  imageUrl?: string;
  keyTakeaways: string[];
}

export interface EvaluationData {
  scores: {
    clarity: number;
    relevance: number;
    engagement: number;
    inclusivity: number;
  };
  feedback: string;
  suggestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingMetadata?: GroundingMetadata;
}

export interface UserState {
  recentDocs: GeneratedContent[];
}

// --- USER MANAGEMENT & ADMIN TYPES ---

export type UserStatus = 'active' | 'pending' | 'suspended';

export interface UserAuditLog {
  action: string;
  timestamp: number;
  details?: string;
}

export interface UserUsageStats {
  loginCount: number;
  totalSessionMinutes: number;
  lastLogin: number;
  averageSessionMinutes: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  picture: string;
  given_name?: string;
  memberSince?: number;
  
  // Admin & Analytics Fields
  role?: UserRole;
  status?: UserStatus;
  stats?: UserUsageStats;
  auditLogs?: UserAuditLog[];
}

export interface SavedTemplate {
  id: string;
  userId: string;
  name: string;
  promptId: string;
  formData: Record<string, string>;
  createdAt: number;
}

// --- NEW PROMPT REQUEST TYPES ---

export interface PromptRequestForm {
  timestamp: string;
  email: string;
  fullName: string;
  company: string;
  projectTitle: string;
  primaryGoal: string;
  specificTask: string;
  users: string;
  targetAudience: string;
  platform: string;
  outputStructure: string;
  userInputs: string;
  toneStyle: string;
  lengthDetail: string;
  branding: string;
  outputFormat: string;
  keywords: string;
  avoidTopics: string;
  rolePersona: string;
  examples: string;
  prdRequest: boolean;
  deadline: string;
  callRequest: boolean;
  additionalContext: string;
}

// --- DASHBOARD & COLLABORATION TYPES ---

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  date: string;
}

export interface Collaborator {
  userId: string;
  name: string;
  picture: string;
  color: string;
  isTyping?: boolean;
}

export interface CollaborationEvent {
  type: 'content_update' | 'presence_update' | 'typing_start' | 'typing_end' | 'client_leave';
  promptId: string;
  payload: any;
  senderId: string;
}
