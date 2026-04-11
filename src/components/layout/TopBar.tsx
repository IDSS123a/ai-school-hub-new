import { useLanguageStore, type AppLanguage } from '../../features/language/languageStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';

export function TopBar() {
  const { language, setLanguage } = useLanguageStore();
  const { user } = useAuth();

  const LANG_OPTIONS: { code: AppLanguage; label: string; flag: string }[] = [
    { code: 'bs', label: 'Bosanski', flag: '🇧🇦' },
    { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
    { code: 'en', label: 'English',  flag: '🇬🇧' },
  ];

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pretraži..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* ─── Language selector ───────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                         hover:bg-slate-100 transition-colors text-sm
                         font-medium text-slate-600 border border-slate-200"
              aria-label="Select language"
            >
              <span className="text-base leading-none">
                {LANG_OPTIONS.find(l => l.code === language)?.flag}
              </span>
              <span className="hidden sm:inline text-xs font-semibold
                               text-slate-700 uppercase">
                {language.toUpperCase()}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs text-slate-500">
              Jezik / Sprache / Language
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LANG_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.code}
                onClick={() => setLanguage(opt.code)}
                className={cn(
                  'gap-2.5 cursor-pointer',
                  language === opt.code && 'bg-primary-50 text-primary-700 font-semibold'
                )}
              >
                <span className="text-base">{opt.flag}</span>
                <span className="text-sm">{opt.label}</span>
                {language === opt.code && (
                  <span className="ml-auto text-primary-600 text-xs">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        <div className="flex items-center gap-3 pl-1">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-none">{user?.full_name}</p>
            <p className="text-xs text-slate-500 mt-1 capitalize">{user?.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
