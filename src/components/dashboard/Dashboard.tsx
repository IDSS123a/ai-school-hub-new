// ═══════════════════════════════════════════════════════
// Dashboard — Main landing page
// Reads ALL prompts from Supabase prompt_definitions
// ═══════════════════════════════════════════════════════

import { useNavigate } from 'react-router-dom';
import {
  FileText, Sparkles, Clock, TrendingUp,
  Plus, ArrowRight, Users, Loader2,
  BookOpen, MapPin, Calendar, Network,
  Calculator, BookMarked, PenLine,
  UserCheck, Library, Scale, FolderOpen,
} from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { usePrompts } from '../../features/prompts/usePrompts';
import { useT } from '../../features/language/languageStore';
import { StatsCard } from '../shared/StatsCard';
import { EmptyState } from '../shared/EmptyState';
import { cn, getRoleLabel, formatDate } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

// ─── Icon resolver (matches XLSX icon names) ──────────────
const PROMPT_ICONS: Record<string, React.ElementType> = {
  BookOpen, MapPin, Calendar, FileText,
  Network, Calculator, BookMarked, PenLine,
  UserCheck, Library, Scale, Users, Sparkles,
};

// ─── UI Group labels ──────────────────────────────────────
const GROUP_LABELS: Record<string, string> = {
  planning:       'Planiranje nastave',
  organization:   'Organizacija',
  communication:  'Komunikacija',
  resources:      'Resursi',
  administration: 'Administracija',
};

const GROUP_COLORS: Record<string, string> = {
  planning:       'bg-blue-50 border-blue-200 hover:border-blue-400',
  organization:   'bg-green-50 border-green-200 hover:border-green-400',
  communication:  'bg-violet-50 border-violet-200 hover:border-violet-400',
  resources:      'bg-amber-50 border-amber-200 hover:border-amber-400',
  administration: 'bg-slate-50 border-slate-200 hover:border-slate-400',
};

const GROUP_ICON_COLORS: Record<string, string> = {
  planning:       'bg-blue-100 text-blue-600',
  organization:   'bg-green-100 text-green-600',
  communication:  'bg-violet-100 text-violet-600',
  resources:      'bg-amber-100 text-amber-600',
  administration: 'bg-slate-100 text-slate-600',
};

// ─── Mock stats (replaced with real data in Step 1.5) ────
const ROLE_STATS = {
  admin: [
    { label: 'Ukupno korisnika',    value: 24,   icon: Users,     color: 'blue'   as const },
    { label: 'Dokumenti danas',     value: 12,   icon: FileText,  color: 'violet' as const },
    { label: 'AI generacija danas', value: 47,   icon: Sparkles,  color: 'green'  as const },
    { label: 'Aktivni promptovi',   value: 10,   icon: TrendingUp, color: 'amber' as const },
  ],
  teacher: [
    { label: 'Moji dokumenti',   value: 8,  icon: FileText,  color: 'blue'   as const },
    { label: 'AI generacija',    value: 23, icon: Sparkles,  color: 'violet' as const },
    { label: 'Dostupni alati',   value: 8,  icon: TrendingUp, color: 'green' as const },
    { label: 'Saradnje',         value: 2,  icon: Users,     color: 'amber'  as const },
  ],
  staff: [
    { label: 'Moji dokumenti',   value: 6,  icon: FileText,  color: 'blue'   as const },
    { label: 'AI generacija',    value: 11, icon: Sparkles,  color: 'violet' as const },
    { label: 'Dostupni alati',   value: 5,  icon: TrendingUp, color: 'green' as const },
    { label: 'Saradnje',         value: 1,  icon: Users,     color: 'amber'  as const },
  ],
};

export function Dashboard() {
  const { user } = useAuth();
  const { data: prompts, isLoading, error } = usePrompts();
  const navigate = useNavigate();
  const t = useT();

  if (!user) return null;

  const today = formatDate(new Date());
  const stats = ROLE_STATS[user.role] ?? ROLE_STATS.teacher;

  // Greeting logic with translations
  const hour = new Date().getHours();
  let greetingKey = 'greeting.morning';
  if (hour >= 12 && hour < 18) greetingKey = 'greeting.afternoon';
  if (hour >= 18 || hour < 5) greetingKey = 'greeting.evening';
  const greeting = t(greetingKey);

  // Group prompts by ui_group
  const promptsByGroup = (prompts ?? []).reduce<
    Record<string, typeof prompts>
  >((acc, prompt) => {
    const group = prompt!.config?.ui_group ?? 'other';
    if (!acc[group]) acc[group] = [];
    acc[group]!.push(prompt);
    return acc;
  }, {});

  // Ordered group keys
  const groupOrder = [
    'planning', 'organization', 'communication',
    'resources', 'administration'
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ─── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {user.full_name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {today} · {getRoleLabel(user.role, user.staff_sub_role)}
          </p>
        </div>
        <Button
          onClick={() => navigate('/documents')}
          className="bg-primary-600 hover:bg-primary-700 text-white
                     gap-2 shrink-0 hidden sm:flex"
        >
          <Plus className="w-4 h-4" />
          {t('dashboard.newDoc')}
        </Button>
      </div>

      {/* ─── Stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* ─── Prompts from XLSX Constitution ───────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {t('dashboard.aiTools')}
          </h2>
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Učitavanje alata...
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm
                          text-red-700">
            Greška pri učitavanju alata. Provjerite konekciju.
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && (prompts ?? []).length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="Nema dostupnih alata"
            description="Nema AI alata dodijeljenih vašoj ulozi."
          />
        )}

        {/* Prompts grouped by category */}
        {!isLoading && !error && groupOrder.map((groupKey) => {
          const groupPrompts = promptsByGroup[groupKey];
          if (!groupPrompts || groupPrompts.length === 0) return null;

          return (
            <div key={groupKey} className="space-y-2">
              {/* Group label */}
              <p className="text-xs font-semibold text-slate-500
                             uppercase tracking-wide">
                {t(`group.${groupKey}`, GROUP_LABELS[groupKey] ?? groupKey)}
              </p>

              {/* Prompt cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2
                              lg:grid-cols-3 gap-3">
                {groupPrompts.map((prompt) => {
                  if (!prompt) return null;
                  const Icon =
                    PROMPT_ICONS[prompt.icon] ?? Sparkles;
                  const colorClass =
                    GROUP_COLORS[groupKey] ?? GROUP_COLORS.planning;
                  const iconClass =
                    GROUP_ICON_COLORS[groupKey] ??
                    GROUP_ICON_COLORS.planning;

                  return (
                    <button
                      key={prompt.slug}
                      onClick={() =>
                        navigate(`/editor/${prompt.slug}`)
                      }
                      className={cn(
                        'group flex items-start gap-3 p-4 rounded-xl',
                        'border text-left transition-all duration-200',
                        'hover:shadow-md',
                        colorClass
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center',
                        'justify-center shrink-0',
                        iconClass
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold
                                      text-slate-900 truncate leading-tight">
                          {prompt.name}
                        </p>
                        <p className="text-xs text-slate-500
                                      mt-0.5 line-clamp-2 leading-snug">
                          {prompt.description}
                        </p>
                        {/* Badges */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {prompt.is_collaborative && (
                            <span className="text-2xs font-medium
                                             text-blue-600 bg-blue-50
                                             px-1.5 py-0.5 rounded-full">
                              Kolaborativno
                            </span>
                          )}
                          <span className="text-2xs text-slate-400">
                            {prompt.config?.protocols ?? 3} protokola
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-300
                                             group-hover:text-slate-500
                                             shrink-0 mt-1 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Recent activity placeholder ──────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">
            {t('dashboard.activity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Clock}
            title={t('dashboard.noActivity')}
            description={t('dashboard.noActivityDesc', 'Vaši dokumenti i AI generacije će se pojaviti ovdje.')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
