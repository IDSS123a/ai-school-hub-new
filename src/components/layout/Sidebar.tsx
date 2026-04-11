import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, MapPin, Calendar,
  FileText, ClipboardList, Users, FolderOpen,
  UsersRound, ShieldCheck, Sliders, BarChart3,
  GraduationCap, ChevronLeft, ChevronRight,
  Sparkles, Network, Calculator, BookMarked,
  PenLine, UserCheck, Library, Scale,
} from 'lucide-react';
import { cn, getRoleLabel, initials } from '../../lib/utils';
import { NAV_ITEMS, NAV_SECTIONS } from '../../lib/constants';
import { useAuthStore } from '../../features/auth/authStore';
import { useT } from '../../features/language/languageStore';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '../ui/tooltip';
import type { UserRole } from '../../types';

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, BookOpen, MapPin, Calendar,
  FileText, ClipboardList, Users, FolderOpen,
  UsersRound, ShieldCheck, Sliders, BarChart3,
  Network,       // interdisciplinaryPlanner
  Calculator,    // mathPlannerIBMYP
  BookMarked,    // eltMentorScrivener
  PenLine,       // writingAssistant
  UserCheck,     // expertConsultant
  Library,       // materialAdvisor
  Scale,         // businessDocumentAssistant
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const t = useT();

  if (!user) return null;

  const userRole = user.role as UserRole;

  const visibleItems = NAV_ITEMS.filter((item) =>
    (item.roles as readonly string[]).includes(userRole)
  );

  const sections = (Object.entries(NAV_SECTIONS) as Array<
    [string, { label: string | null; roles: readonly string[] }]
  >)
    .filter(([, section]) =>
      (section.roles as readonly string[]).includes(userRole)
    )
    .map(([key, section]) => ({
      key,
      label: section.label,
      items: visibleItems.filter((item) => item.section === key),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full bg-slate-900 border-r border-slate-800',
          'transition-all duration-300 ease-in-out shrink-0 relative',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* ─── Logo ──────────────────────────────── */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-slate-800 shrink-0',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center
                          justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-none truncate">
                AI School Hub
              </p>
              <p className="text-slate-500 text-xs mt-0.5 truncate">v2.0</p>
            </div>
          )}
        </div>

        {/* ─── Navigation ────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
          {sections.map(({ key, label, items }) => (
            <div key={key} className="mb-6">
              {label && !collapsed && (
                <p className="text-slate-500 text-xs font-semibold uppercase
                               tracking-widest px-3 mb-2">
                  {t(`nav.section.${key}`, label)}
                </p>
              )}
              {label && collapsed && (
                <div className="border-t border-slate-800 my-2 mx-2" />
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = ICONS[item.icon];
                  const isActive =
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path + '/');

                  const navItem = (
                    <NavLink
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                        'text-sm font-medium transition-all duration-150 group relative',
                        isActive
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      )}
                    >
                      {Icon && (
                        <Icon className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-white'
                            : 'text-slate-500 group-hover:text-slate-300'
                        )} />
                      )}
                      {!collapsed && (
                        <span className="truncate">{t(`nav.${item.id}`, item.label)}</span>
                      )}
                    </NavLink>
                  );

                  return (
                    <li key={item.id}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            {t(`nav.${item.id}`, item.label)}
                          </TooltipContent>
                        </Tooltip>
                      ) : navItem}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ─── AI Status Indicator ───────────────── */}
        {!collapsed && (
          <div className="mx-2 mb-2 px-3 py-2 rounded-lg bg-slate-800
                          border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400
                              animate-pulse shrink-0" />
              <span className="text-xs text-slate-400 truncate">
                {t('ai.active')}
              </span>
              <Sparkles className="w-3 h-3 text-violet-400 ml-auto shrink-0" />
            </div>
          </div>
        )}

        {/* ─── User Profile ───────────────────────── */}
        <div className="border-t border-slate-800 p-2 shrink-0">
          <div className={cn(
            'flex items-center rounded-lg px-2 py-2',
            'hover:bg-slate-800 transition-colors cursor-pointer gap-3',
            collapsed && 'justify-center px-0'
          )}>
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center
                            justify-center text-white text-xs font-bold shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials(user.full_name)
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-white text-xs font-semibold truncate leading-none">
                  {user.full_name}
                </p>
                <p className="text-slate-500 text-xs mt-0.5 truncate">
                  {getRoleLabel(user.role, user.staff_sub_role)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Collapse Toggle ────────────────────── */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full
                     bg-slate-700 border border-slate-600 text-slate-300
                     hover:bg-slate-600 hover:text-white transition-all
                     flex items-center justify-center shadow-md z-10"
          aria-label={collapsed ? 'Proširi sidebar' : 'Skupi sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft className="w-3 h-3" />
          }
        </button>
      </aside>
    </TooltipProvider>
  );
}
