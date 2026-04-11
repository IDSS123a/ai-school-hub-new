
import React, { useState, useEffect } from 'react';
import { PromptDefinition, UserProfile, Announcement } from '../types';
import { PROMPT_DEFINITIONS, SYSTEM_ANNOUNCEMENTS } from '../services/mockDatabase';
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
  FileText,
  Bell,
  Activity,
  Megaphone
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('userProfile');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        setAnnouncements(SYSTEM_ANNOUNCEMENTS);
    } catch (e) {
        console.error("Local storage error", e);
    }
  }, []);

  // Filter tools based on role
  const getVisibleTools = () => {
    if (!user) return PROMPT_DEFINITIONS; 
    return PROMPT_DEFINITIONS.filter(def => {
        if (!def.allowedRoles || def.allowedRoles.length === 0) return true;
        return def.allowedRoles.includes(user.role || 'teacher');
    });
  };

  const visibleTools = getVisibleTools();

  // Semantic mappings for announcements (Alert -> Red/Accent, Success -> Green/Secondary)
  const getAnnouncementStyle = (type: string) => {
    switch(type) {
      case 'alert': return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900 text-red-800 dark:text-red-200';
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900 text-green-800 dark:text-green-200';
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900 text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">
                Welcome back, <span className="font-semibold text-primary dark:text-primary">{user?.name?.split(' ')[0] || 'Educator'}</span>. 
                You have access to <span className="font-semibold">{visibleTools.length}</span> enterprise tools.
            </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <Clock size={16} />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Announcements & Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Announcements & Tools (2/3 width on large) */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Announcements Widget */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Megaphone size={18} className="text-primary" /> System Announcements
                    </h3>
                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">{announcements.length} New</span>
                </div>
                <div className="p-4 space-y-3">
                    {announcements.map(ann => (
                        <div key={ann.id} className={`p-4 rounded-lg border flex items-start gap-3 ${getAnnouncementStyle(ann.type)}`}>
                            <Bell size={18} className="mt-0.5 shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm">{ann.title}</h4>
                                <p className="text-sm opacity-90 mt-1">{ann.message}</p>
                                <p className="text-[10px] mt-2 opacity-75">{new Date(ann.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

             {/* All Tools Grid */}
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Layers size={20} className="text-slate-400" /> Available Tools
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="list">
                    {visibleTools.map((def, index) => {
                    const Icon = icons[def.icon] || BookOpen;
                    return (
                        <button 
                        key={def.id}
                        onClick={() => onSelectPrompt(def)}
                        className="group bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-32 text-left"
                        role="listitem"
                        >
                            <div className="flex justify-between items-start">
                                <Icon size={20} className="text-slate-400 group-hover:text-primary transition-colors"/>
                                <ArrowRight size={16} className="text-transparent group-hover:text-slate-300 -translate-x-2 group-hover:translate-x-0 transition-all"/>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">{def.title}</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{def.description}</p>
                            </div>
                        </button>
                    );
                    })}
                </div>
            </div>

        </div>

        {/* Right Column: Activity Feed & Status (1/3 width) */}
        <div className="space-y-8">
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <img src={user?.picture} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{user?.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role} • Active</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary dark:text-primary">12</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Docs Created</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-accent dark:text-blue-300">4</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hours Saved</div>
                    </div>
                 </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                 <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity size={18} className="text-slate-400" /> Recent Activity
                    </h3>
                    <button className="text-xs text-primary hover:underline">View All</button>
                 </div>
                 <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {[
                        { title: 'Calculus Unit 3 Review', type: 'Lesson Plan', time: '2h ago', icon: FileText },
                        { title: 'Science Fair Logistics', type: 'Event Plan', time: '5h ago', icon: CalendarCheck },
                        { title: 'Grant Proposal Draft', type: 'Writing Assistant', time: '1d ago', icon: Feather },
                        { title: 'Student Behavior Plan', type: 'Expert Consultant', time: '2d ago', icon: GraduationCap },
                    ].map((item, i) => (
                        <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-1.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-white transition-colors">
                                    <item.icon size={14} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-blue-300 transition-colors">{item.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.type} • {item.time}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
