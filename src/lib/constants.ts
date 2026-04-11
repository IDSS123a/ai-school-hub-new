export const APP_NAME = 'AI School Hub';
export const APP_VERSION = '2.0.0';
export const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';
export const USE_V6_ORCHESTRATOR = true;

export const COLORS = {
  primary:   '#2563EB',
  secondary: '#7C3AED',
  success:   '#059669',
  warning:   '#D97706',
  error:     '#DC2626',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN:   'ash_auth_token',
  USER_PROFILE: 'ash_user_profile',
  THEME:        'ash_theme',
};

export const NAV_ITEMS = [
  // ── Main (all roles) ──
  {
    id: 'dashboard',
    label: 'Početna',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    roles: ['admin', 'teacher', 'staff'] as const,
    section: 'main',
  },
  // ── Planning (teacher + admin) ──
  {
    id: 'lessonPlanner',
    label: 'Planer nastavnog časa',
    icon: 'BookOpen',
    path: '/editor/lessonPlanner',
    roles: ['admin', 'teacher'] as const,
    section: 'planning',
  },
  {
    id: 'interdisciplinaryPlanner',
    label: 'Interdisciplinarni projekt',
    icon: 'Network',
    path: '/editor/interdisciplinaryPlanner',
    roles: ['admin', 'teacher'] as const,
    section: 'planning',
  },
  {
    id: 'mathPlannerIBMYP',
    label: 'Matematika IBMYP',
    icon: 'Calculator',
    path: '/editor/mathPlannerIBMYP',
    roles: ['admin', 'teacher'] as const,
    section: 'planning',
  },
  {
    id: 'eltMentorScrivener',
    label: 'ELT Mentor (Scrivener)',
    icon: 'BookMarked',
    path: '/editor/eltMentorScrivener',
    roles: ['admin', 'teacher'] as const,
    section: 'planning',
  },
  {
    id: 'fieldTripPlanner',
    label: 'Planer izleta',
    icon: 'MapPin',
    path: '/editor/fieldTripPlanner',
    roles: ['admin', 'teacher'] as const,
    section: 'planning',
  },
  // ── Organization (teacher + staff + admin) ──
  {
    id: 'eventPlanner',
    label: 'Planer događaja',
    icon: 'Calendar',
    path: '/editor/eventPlanner',
    roles: ['admin', 'teacher', 'staff'] as const,
    section: 'organization',
  },
  // ── Communication (all roles) ──
  {
    id: 'writingAssistant',
    label: 'Asistent za pisanje',
    icon: 'PenLine',
    path: '/editor/writingAssistant',
    roles: ['admin', 'teacher', 'staff'] as const,
    section: 'communication',
  },
  {
    id: 'expertConsultant',
    label: 'Stručni konsultant',
    icon: 'UserCheck',
    path: '/editor/expertConsultant',
    roles: ['admin', 'teacher', 'staff'] as const,
    section: 'communication',
  },
  // ── Resources (all roles) ──
  {
    id: 'materialAdvisor',
    label: 'Savjetnik za materijale',
    icon: 'Library',
    path: '/editor/materialAdvisor',
    roles: ['admin', 'teacher', 'staff'] as const,
    section: 'resources',
  },
  // ── Administration (admin + staff) ──
  {
    id: 'businessDocumentAssistant',
    label: 'Poslovni dokumenti',
    icon: 'Scale',
    path: '/editor/businessDocumentAssistant',
    roles: ['admin', 'staff'] as const,
    section: 'administration',
  },
  // ── My work (all roles) ──
  {
    id: 'my-documents',
    label: 'Moji dokumenti',
    icon: 'FolderOpen',
    path: '/documents',
    roles: ['admin', 'teacher', 'staff'] as const,
    section: 'work',
  },
  {
    id: 'collaborations',
    label: 'Saradnja',
    icon: 'UsersRound',
    path: '/collaborations',
    roles: ['admin', 'teacher', 'staff'] as const,
    section: 'work',
  },
  // ── Admin only ──
  {
    id: 'admin-users',
    label: 'Korisnici',
    icon: 'ShieldCheck',
    path: '/admin/users',
    roles: ['admin'] as const,
    section: 'admin',
  },
  {
    id: 'admin-prompts',
    label: 'Upravljanje promptovima',
    icon: 'Sliders',
    path: '/admin/prompts',
    roles: ['admin'] as const,
    section: 'admin',
  },
  {
    id: 'admin-analytics',
    label: 'Analitika',
    icon: 'BarChart3',
    path: '/admin/analytics',
    roles: ['admin'] as const,
    section: 'admin',
  },
] as const;

export const NAV_SECTIONS = {
  main:           { label: null,                    roles: ['admin', 'teacher', 'staff'] as const },
  planning:       { label: 'Planiranje nastave',    roles: ['admin', 'teacher']          as const },
  organization:   { label: 'Organizacija',          roles: ['admin', 'teacher', 'staff'] as const },
  communication:  { label: 'Komunikacija',          roles: ['admin', 'teacher', 'staff'] as const },
  resources:      { label: 'Resursi',               roles: ['admin', 'teacher', 'staff'] as const },
  administration: { label: 'Administracija',        roles: ['admin', 'staff']            as const },
  work:           { label: 'Moj rad',               roles: ['admin', 'teacher', 'staff'] as const },
  admin:          { label: 'Sistemska administracija', roles: ['admin']                  as const },
} as const;

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  draft:       'Nacrt',
  in_progress: 'U izradi',
  complete:    'Završeno',
  archived:    'Arhivirano',
};

export const DOCUMENT_STATUS_COLORS: Record<string, string> = {
  draft:       'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  complete:    'bg-green-100 text-green-700',
  archived:    'bg-amber-100 text-amber-700',
};
