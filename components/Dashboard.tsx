
import React, { useState, useEffect } from 'react';
import { PromptDefinition, UserProfile } from '../types';
import { PROMPT_DEFINITIONS } from '../services/mockDatabase';
import { 
  BookOpen, 
  ArrowRight,
  Clock,
  NotebookPen,
  Layers,
  LibraryBig,
  CalendarCheck,
  Bus,
  Feather,
  GraduationCap,
  Sigma,
  Languages,
  Briefcase,
  FileText
} from 'lucide-react';

const icons: Record<string, any> = {
  'BookOpen': BookOpen,
  'NotebookPen': NotebookPen,
  'Layers': Layers,
  'LibraryBig': LibraryBig,
  'CalendarCheck': CalendarCheck,
  'Bus': Bus,
  'Feather': Feather,
  'GraduationCap': GraduationCap,
  'Sigma': Sigma,
  'Languages': Languages,
  'Briefcase': Briefcase,
  'FileText': FileText
};

interface DashboardProps {
  onSelectPrompt: (prompt: PromptDefinition) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectPrompt }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('userProfile');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
    } catch (e) {
        console.error("Local storage error", e);
    }
  }, []);

  const getVisibleTools = () => {
    if (!user) return PROMPT_DEFINITIONS; // Show all if loading or error (safe fallback)
    return PROMPT_DEFINITIONS.filter(def => {
        if (!def.allowedRoles || def.allowedRoles.length === 0) return true;
        return def.allowedRoles.includes(user.role || 'teacher');
    });
  };

  const visibleTools = getVisibleTools();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0] || 'Educator'}</h1>
        <p className="text-slate-500">
            You are logged in as <strong className="capitalize text-primary">{user?.role}</strong>. 
            Select a tool below to start creating content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
        {visibleTools.length > 0 ? visibleTools.map((def, index) => {
          const Icon = icons[def.icon] || BookOpen;
          return (
            <button 
              key={def.id}
              onClick={() => onSelectPrompt(def)}
              className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 text-left outline-none focus:ring-4 focus:ring-primary/10 hover:scale-[1.02] active:scale-[0.98] animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
              aria-label={`Open ${def.title} tool. ${def.description}`}
              role="listitem"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <Icon size={20} className="group-hover:scale-110 transition-transform duration-300"/>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-primary transition-colors">{def.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{def.description}</p>
              </div>
              <div className="flex items-center text-primary text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" aria-hidden="true">
                Start Creating <ArrowRight size={16} className="ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </button>
          );
        }) : (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">No tools available for your current role ({user?.role}).</p>
                <p className="text-xs text-slate-400 mt-2">Contact your administrator for access.</p>
            </div>
        )}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <button className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-md px-2 py-1">View All</button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer" tabIndex={0} role="button">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 group-hover:text-primary transition-colors">Calculus Unit 3 Review</h4>
                    <p className="text-xs text-slate-500">Lesson Plan • 10th Grade</p>
                  </div>
                </div>
                <div className="flex items-center text-slate-400 text-sm gap-4">
                  <span className="flex items-center gap-1"><Clock size={14}/> {i * 2 + 1} hours ago</span>
                  <div className="p-2 text-slate-300 group-hover:text-primary transition-colors"><ArrowRight size={16}/></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
