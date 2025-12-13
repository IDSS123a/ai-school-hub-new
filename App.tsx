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
import NewPromptModal from './components/NewPromptModal'; // New Import
import { ToastProvider, useToast } from './context/ToastContext';
import { PromptDefinition, UserProfile, SavedTemplate, UserRole } from './types';
import { PROMPT_DEFINITIONS, getPromptById } from './services/mockDatabase';
// Import auth and mock functions from local service
import { auth, signInAnonymously, signOut } from './services/firebase';
import { getTemplates } from './services/contentService';

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
      ${active ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-slate-600 hover:bg-slate-100'}`}
  >
    <Icon size={18} className={`mt-0.5 flex-shrink-0 ${active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
         <span className="truncate font-semibold">{label}</span>
      </div>
      {description && (
        <p className={`text-[10px] leading-tight mt-0.5 line-clamp-2 ${active ? 'text-primary/70' : 'text-slate-400'}`}>
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
  const [showNewPromptModal, setShowNewPromptModal] = useState(false); // State for new modal
  const [darkMode, setDarkMode] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Check local storage for auth persistence simulation
  useEffect(() => {
    try {
        const storedAuth = localStorage.getItem('isAuth');
        const storedUser = localStorage.getItem('userProfile');
        if (storedAuth === 'true') {
          setIsAuthenticated(true);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
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
      // Limit width between 200px and 480px
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
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
    handleResize();
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

  // Listener for template updates (triggered from EditorLayout)
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
    // Attempt to authenticate with (Mock) Firebase to allow writes
    signInAnonymously(auth)
    .then(() => console.log("Authenticated with Firebase (Anonymous Session)"))
    .catch((err: any) => {
        console.error("Auth Error:", err);
    });

    setIsAuthenticated(true);
    localStorage.setItem('isAuth', 'true');
    
    if (userProfile) {
      // Ensure we have a role for the logic to work
      const completeProfile: UserProfile = {
          role: 'teacher', // Default
          status: 'active',
          ...userProfile
      };
      
      setUser(completeProfile);
      localStorage.setItem('userProfile', JSON.stringify(completeProfile));
    } else {
      // Default Fallback
      const defaultUser: UserProfile = {
        name: 'Jane Doe',
        email: 'teacher@idss.ba',
        picture: 'https://ui-avatars.com/api/?name=Jane+Doe&background=2563eb&color=fff',
        memberSince: Date.now(),
        role: 'teacher',
        status: 'active'
      };
      setUser(defaultUser);
      localStorage.setItem('userProfile', JSON.stringify(defaultUser));
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
  };

  const handleSelectTemplate = (template: SavedTemplate) => {
      const prompt = getPromptById(template.promptId);
      if (prompt) {
          setCurrentPrompt(prompt);
          setActiveTemplate(template);
          setActiveTab('editor');
          setShowProfileMenu(false);
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

  // Helper to format date
  const formatMemberDate = (timestamp?: number) => {
      if (!timestamp) return 'Sep 2023'; // Fallback
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Helper to extract example usage
  const getExampleUsage = (desc: string) => {
    const parts = desc.split('Example Usage:');
    if (parts.length > 1) {
        return parts[1].trim();
    }
    return desc;
  };

  // If not authenticated, show Login screen
  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <Login onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className={`flex h-screen bg-slate-50 overflow-hidden font-sans transition-colors duration-200 ${darkMode ? 'dark:bg-slate-900' : ''}`}>
        
        {/* Settings Modal */}
        <SettingsModal 
            isOpen={showSettingsModal} 
            onClose={() => setShowSettingsModal(false)}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            user={user}
        />

        {/* New Prompt Request Modal */}
        <NewPromptModal 
            isOpen={showNewPromptModal}
            onClose={() => setShowNewPromptModal(false)}
            user={user}
        />

        {/* Mobile Sidebar Overlay */}
        {!sidebarOpen && (
          <div className="lg:hidden fixed top-4 left-4 z-50">
            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white shadow-md rounded-md">
              <Menu size={20} className="text-slate-600" />
            </button>
          </div>
        )}

        {/* Sidebar */}
        <aside 
          style={{ width: `${sidebarWidth}px` }}
          className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
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

          {/* Scrollable Navigation Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <nav className="flex flex-col gap-1 pb-4 pt-4">
              <SidebarItem 
                icon={Layout} 
                label="Dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => { setActiveTab('dashboard'); setCurrentPrompt(null); setActiveTemplate(null); }} 
              />

              {/* ADMIN PANEL LINK - Only Visible to Admins */}
              {user?.role === 'admin' && (
                <SidebarItem 
                  icon={Shield} 
                  label="Admin Panel" 
                  active={activeTab === 'admin'} 
                  onClick={() => { setActiveTab('admin'); setCurrentPrompt(null); setActiveTemplate(null); }}
                  badge="NEW"
                />
              )}
              
              <div className="px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4">Tools</div>
              {PROMPT_DEFINITIONS.map(def => {
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

          {/* User Footer (Pinned) */}
          <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0 relative" ref={profileMenuRef}>
            
            {/* Expanded Profile Menu (Popover) */}
            {showProfileMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-2 z-50 w-72 -ml-4 flex flex-col max-h-[80vh]">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
                   <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={user?.picture || "https://ui-avatars.com/api/?name=User&background=cbd5e1&color=fff"} 
                        alt="User" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                      />
                      <div className="min-w-0">
                         <div className="flex items-center gap-1">
                            <h4 className="font-bold text-slate-900 truncate">{user?.name}</h4>
                            {user?.role === 'admin' && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>}
                         </div>
                         <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                   </div>
                   <div className="flex gap-4 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                         <Calendar size={10} />
                         <span>Member: {formatMemberDate(user?.memberSince)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                         <Clock size={10} />
                         <span>Login: Just now</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                   <div className="space-y-1 mb-2">
                       {/* RENAMED AND REPURPOSED BUTTON */}
                       <button 
                         onClick={handleNewPromptRequest}
                         className="w-full flex items-center gap-3 px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium"
                       >
                          <Sparkles size={18} />
                          New Prompt
                       </button>

                       <button 
                         onClick={handleSettings}
                         className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                       >
                          <Settings size={18} />
                          System Settings
                       </button>
                       
                       <button 
                         onClick={toggleDarkMode}
                         className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
                   
                   {/* Saved Templates Section within Popover */}
                   {savedTemplates.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Bookmark size={12} /> Saved Templates
                        </div>
                        <div className="space-y-1">
                            {savedTemplates.map(tpl => (
                                <button 
                                    key={tpl.id}
                                    onClick={() => handleSelectTemplate(tpl)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left
                                      ${activeTemplate?.id === tpl.id ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <FileText size={14} className="flex-shrink-0" />
                                    <span className="truncate">{tpl.name}</span>
                                </button>
                            ))}
                        </div>
                      </div>
                   )}
                </div>

                <div className="border-t border-slate-100 p-2 bg-slate-50/50 flex-shrink-0">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
              </div>
            )}

            {/* User Toggle Button */}
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="relative">
                <img 
                  src={user?.picture || "https://ui-avatars.com/api/?name=User&background=cbd5e1&color=fff"} 
                  alt="User" 
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 group-hover:border-primary transition-colors" 
                />
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${user?.status === 'pending' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
                </div>
                <p className="text-xs text-slate-500 truncate">{user?.email || 'Educator'}</p>
              </div>
              <ChevronUp size={16} className={`text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Resize Handle */}
          <div 
             onMouseDown={startResizingSidebar}
             className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/20 z-50 transition-colors opacity-0 hover:opacity-100 active:opacity-100 active:bg-blue-500/50"
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50/50">
          <ErrorBoundary>
            {activeTab === 'dashboard' && (
              <Dashboard onSelectPrompt={handleSelectPrompt} />
            )}
            {activeTab === 'admin' && user?.role === 'admin' && (
              <AdminPanel />
            )}
            {activeTab === 'editor' && currentPrompt && (
              <EditorLayout 
                key={activeTemplate ? activeTemplate.id : currentPrompt.id} // Force remount to reset state properly
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