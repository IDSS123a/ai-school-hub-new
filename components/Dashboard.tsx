import React from 'react';
import { PromptDefinition } from '../types';
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
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, Jane</h1>
        <p className="text-slate-500 mt-2">Select a tool to start creating content for your class.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PROMPT_DEFINITIONS.map((def) => {
          const Icon = icons[def.icon] || BookOpen;
          return (
            <div 
              key={def.id}
              onClick={() => onSelectPrompt(def)}
              className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-48"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{def.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{def.description}</p>
              </div>
              <div className="flex items-center text-primary text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                Start Creating <ArrowRight size={16} className="ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <button className="text-sm text-primary hover:underline">View All</button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Calculus Unit 3 Review</h4>
                    <p className="text-xs text-slate-500">Lesson Plan • 10th Grade</p>
                  </div>
                </div>
                <div className="flex items-center text-slate-400 text-sm gap-4">
                  <span className="flex items-center gap-1"><Clock size={14}/> {i * 2 + 1} hours ago</span>
                  <button className="p-2 hover:text-primary"><ArrowRight size={16}/></button>
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
