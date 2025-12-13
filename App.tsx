
import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Table, 
  Layout, 
  Settings, 
  Menu, 
  X, 
  PlusCircle,
  CalendarRange, 
  ClipboardList, 
  Lightbulb, 
  PenTool, 
  UserCog, 
  Mail, 
  Users, 
  Brain,
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
  Bookmark,
  ChevronUp,
  LogOut,
  Moon,
  Sun,
  Calendar,
  Clock,
  FileText,
  Shield,
  Sparkles
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import EditorLayout from './components/EditorLayout';
import AdminPanel from './components/AdminPanel'; 
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import SettingsModal from './components/SettingsModal';
import NewPromptModal from './components/NewPromptModal'; 
import { ToastProvider, useToast } from './context/ToastContext';
import { PromptDefinition, UserProfile, SavedTemplate, UserRole } from './types';
import { PROMPT_DEFINITIONS, getPromptById } from './services/mockDatabase';
import { auth, signInAnonymously, signOut } from './services/firebase';
import { getTemplates } from './services/contentService';
import { initAdminDB } from './services/adminService';

interface SidebarItemProps {
  icon: any;
  label: string;
  description?: string;
  active?: boolean;
  onClick: () => void;
  badge?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, description, active, onClick, badge }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-start gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 relative text-left group
      ${active ? 'bg-primary/10 text-primary border-r-4 border-primary dark:bg-primary/20 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
  >
    <Icon size={18} className={`mt-0.5 flex-shrink-0 ${active ? 'text-primary dark:text-blue-300' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
         <span className="truncate font-semibold">{label}</span>
      </div>
      {description && (
        <p className={`text-[10px] leading-tight mt-0.5 line-clamp-2 ${active ? 'text-primary/70 dark:text-blue-300/70' : 'text-slate-400'}`}>
          {description}
        </p>
      )}
    </div>
    {badge && (
      <span className="absolute right-4 top-3 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
        {badge}
      </span>
    )}
  </button>
);

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
  'Table': Table,
  'Lightbulb': Lightbulb,
  'Mail': Mail,
  'CalendarRange': CalendarRange,
  'ClipboardList': ClipboardList,
  'PenTool': PenTool,
  'UserCog': UserCog,
  'Users': Users,
  'Brain': Brain
};

const App = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentPrompt, setCurrentPrompt] = useState<PromptDefinition | null>(null);
  
  // New State for Templates
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<SavedTemplate | null>(null);

  // Sidebar Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  // Profile Menu & Settings State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewPromptModal, setShowNewPromptModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Initialize DB on App Load
  useEffect(() => {
    initAdminDB();
  }, []);

  // Check local storage for auth and dark mode
  useEffect(() => {
    try {
        const storedAuth = localStorage.getItem('isAuth');
        const storedUser = localStorage.getItem('userProfile');
        const storedTheme = localStorage.getItem('theme');
        
        if (storedAuth === 'true') {
          setIsAuthenticated(true);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }

        if (storedTheme === 'dark') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    } catch (e) {
        console.error("Local storage error", e);
    }
  }, []);

  // Handle outside click for profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Sidebar Resizing
  const startResizingSidebar = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  }, []);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(e.clientX, 480));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  // Handle Dark Mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Templates when user is authenticated
  useEffect(() => {
      if (user) {
          getTemplates(user.email)
            .then(templates => setSavedTemplates(templates || []))
            .catch(err => {
                console.error("Failed to load templates", err);
                setSavedTemplates([]);
            });
      }
  }, [user]);

  // Listener for template updates
  useEffect(() => {
      const handleTemplateUpdate = () => {
          if (user) {
             getTemplates(user.email)
                .then(setSavedTemplates)
                .catch(console.error);
          }
      };
      window.addEventListener('templateSaved', handleTemplateUpdate);
      return () => window.removeEventListener('templateSaved', handleTemplateUpdate);
  }, [user]);

  const handleLogin = (userProfile?: UserProfile) => {
    signInAnonymously(auth)
    .then(() => console.log("Authenticated with Firebase (Anonymous Session)"))
    .catch((err: any) => console.error("Auth Error:", err));

    setIsAuthenticated(true);
    localStorage.setItem('isAuth', 'true');
    
    if (userProfile) {
      setUser(userProfile);
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuth');
    localStorage.removeItem('userProfile');
    setActiveTab('dashboard');
    setCurrentPrompt(null);
    setActiveTemplate(null);
    setShowProfileMenu(false);
    signOut(auth).catch(console.error);
  };

  const handleSelectPrompt = (prompt: PromptDefinition) => {
    setCurrentPrompt(prompt);
    setActiveTemplate(null);
    setActiveTab('editor');
    // Close sidebar on mobile when selection made
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleSelectTemplate = (template: SavedTemplate) => {
      const prompt = getPromptById(template.promptId);
      if (prompt) {
          setCurrentPrompt(prompt);
          setActiveTemplate(template);
          setActiveTab('editor');
          setShowProfileMenu(false);
          if (window.innerWidth < 1024) setSidebarOpen(false);
      }
  };

  const handleNewPromptRequest = () => {
      setShowNewPromptModal(true);
      setShowProfileMenu(false);
  };

  const handleSettings = () => {
      setShowSettingsModal(true);
      setShowProfileMenu(false);
  };

  const formatMemberDate = (timestamp?: number) => {
      if (!timestamp) return 'N/A';
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getExampleUsage = (desc: string) => {
    const parts = desc.split('Example Usage:');
    if (parts.length > 1) {
        return parts[1].trim();
    }
    return desc;
  };

  const getVisibleTools = () => {
    if (!user) return [];
    return PROMPT_DEFINITIONS.filter(def => {
        if (!def.allowedRoles || def.allowedRoles.length === 0) return true;
        return def.allowedRoles.includes(user.role || 'teacher');
    });
  };

  const visibleTools = getVisibleTools();

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <Login onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className={`flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans transition-colors duration-200`}>
        
        <SettingsModal 
            isOpen={showSettingsModal} 
            onClose={() => setShowSettingsModal(false)}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            user={user}
        />

        <NewPromptModal 
            isOpen={showNewPromptModal}
            onClose={() => setShowNewPromptModal(false)}
            user={user}
        />

        {/* Mobile Sidebar Overlay */}
        {!sidebarOpen && (
          <div className="lg:hidden fixed top-4 left-4 z-50">
            <button 
                onClick={() => setSidebarOpen(true)} 
                className="p-2 bg-white dark:bg-slate-800 shadow-md rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              <Menu size={20} />
            </button>
          </div>
        )}
        
        {/* Mobile Backdrop */}
        {sidebarOpen && (
            <div 
                className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setSidebarOpen(false)}
            />
        )}

        {/* Sidebar */}
        <aside 
          style={{ width: window.innerWidth >= 1024 ? `${sidebarWidth}px` : '80%' }}
          className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-white">
              <img 
                src="https://i.postimg.cc/B61fmVMV/IDSS_Logo_D1.png" 
                alt="IDSS Logo" 
                className="w-8 h-8 object-contain" 
              />
              <span className="truncate">AI School Hub</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900">
            <nav className="flex flex-col gap-1 pb-4 pt-4">
              <SidebarItem 
                icon={Layout} 
                label="Dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => { setActiveTab('dashboard'); setCurrentPrompt(null); setActiveTemplate(null); if(window.innerWidth < 1024) setSidebarOpen(false); }} 
              />

              {user?.role === 'admin' && (
                <SidebarItem 
                  icon={Shield} 
                  label="Admin Panel" 
                  active={activeTab === 'admin'} 
                  onClick={() => { setActiveTab('admin'); setCurrentPrompt(null); setActiveTemplate(null); if(window.innerWidth < 1024) setSidebarOpen(false); }}
                  badge="NEW"
                />
              )}
              
              <div className="px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4">
                  Tools for {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Teacher'}
              </div>
              
              {visibleTools.map(def => {
                const Icon = icons[def.icon] || BookOpen;
                return (
                  <SidebarItem 
                    key={def.id}
                    icon={Icon} 
                    label={def.title} 
                    description={getExampleUsage(def.description)}
                    active={currentPrompt?.id === def.id && !activeTemplate}
                    onClick={() => handleSelectPrompt(def)}
                  />
                );
              })}
            </nav>
          </div>

          {/* User Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 relative" ref={profileMenuRef}>
            
            {showProfileMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-2 z-50 w-72 -ml-4 flex flex-col max-h-[80vh]">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                   <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={user?.picture || "https://ui-avatars.com/api/?name=User&background=cbd5e1&color=fff"} 
                        alt="User" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm" 
                      />
                      <div className="min-w-0">
                         <div className="flex items-center gap-1">
                            <h4 className="font-bold text-slate-900 dark:text-white truncate">{user?.name}</h4>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase truncate">{user?.role}</span>
                         </div>
                         <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                      </div>
                   </div>
                   <div className="flex gap-4 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                         <Calendar size={10} />
                         <span>Since: {formatMemberDate(user?.memberSince)}</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                   <div className="space-y-1 mb-2">
                       <button 
                         onClick={handleNewPromptRequest}
                         className="w-full flex items-center gap-3 px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium"
                       >
                          <Sparkles size={18} />
                          New Prompt
                       </button>

                       <button 
                         onClick={handleSettings}
                         className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                       >
                          <Settings size={18} />
                          System Settings
                       </button>
                       
                       <button 
                         onClick={toggleDarkMode}
                         className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                       >
                          <div className="flex items-center gap-3">
                             {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                             {darkMode ? 'Dark Mode' : 'Light Mode'}
                          </div>
                          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${darkMode ? 'bg-primary' : 'bg-slate-300'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </div>
                       </button>
                   </div>
                   
                   {savedTemplates.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Bookmark size={12} /> Saved Templates
                        </div>
                        <div className="space-y-1">
                            {savedTemplates.map(tpl => (
                                <button 
                                    key={tpl.id}
                                    onClick={() => handleSelectTemplate(tpl)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left
                                      ${activeTemplate?.id === tpl.id ? 'bg-primary/10 text-primary dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    <FileText size={14} className="flex-shrink-0" />
                                    <span className="truncate">{tpl.name}</span>
                                </button>
                            ))}
                        </div>
                      </div>
                   )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 p-2 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
              </div>
            )}

            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
            >
              <div className="relative">
                <img 
                  src={user?.picture || "https://ui-avatars.com/api/?name=User&background=cbd5e1&color=fff"} 
                  alt="User" 
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:border-primary transition-colors" 
                />
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full ${user?.status === 'pending' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{user?.role || 'Educator'}</p>
              </div>
              <ChevronUp size={16} className={`text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Resize Handle (Desktop Only) */}
          <div 
             onMouseDown={startResizingSidebar}
             className="hidden lg:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/20 z-50 transition-colors opacity-0 hover:opacity-100 active:opacity-100 active:bg-blue-500/50"
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-800/50 transition-colors duration-200">
          <ErrorBoundary>
            {activeTab === 'dashboard' && (
              <Dashboard onSelectPrompt={handleSelectPrompt} />
            )}
            {activeTab === 'admin' && user?.role === 'admin' && (
              <AdminPanel />
            )}
            {activeTab === 'editor' && currentPrompt && (
              <EditorLayout 
                key={activeTemplate ? activeTemplate.id : currentPrompt.id} 
                prompt={currentPrompt} 
                user={user} 
                initialFormData={activeTemplate?.formData}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </ToastProvider>
  );
};

export default App;
