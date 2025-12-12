
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

export interface PromptDefinition {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  fields: PromptField[];
  systemInstruction: string;
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
}

export interface UserState {
  recentDocs: GeneratedContent[];
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
  given_name?: string;
  memberSince?: number; // Timestamp for when user joined
}

export interface SavedTemplate {
  id: string;
  userId: string;
  name: string;
  promptId: string;
  formData: Record<string, string>;
  createdAt: number;
}
