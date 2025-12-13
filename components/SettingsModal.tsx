
import React, { useState } from 'react';
import { X, Moon, Sun, Globe, Bell, Shield, Key } from 'lucide-react';
import { UserProfile } from '../types';
import { useToast } from '../context/ToastContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  user: UserProfile | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, darkMode, toggleDarkMode, user }) => {
  const { addToast } = useToast();
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('general');

  // Helper date formatter
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
  };

  const handleChangePassword = () => {
      addToast("Password change functionality is simulated in this demo.", "info");
  };

  const handleDeleteAccount = () => {
      if(window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
          addToast("Account deletion request submitted to administrator.", "warning");
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Settings</h2>
            <button 
              onClick={onClose} 
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
                <X size={24} />
            </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-1">
                <button 
                  onClick={() => setActiveTab('general')} 
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    General
                </button>
                <button 
                  onClick={() => setActiveTab('account')} 
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    Account Profile
                </button>
                <button 
                  onClick={() => setActiveTab('notifications')} 
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    Notifications
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto dark:text-slate-200 bg-white dark:bg-slate-800">
                {activeTab === 'general' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Globe size={18}/> Language & Region
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Interface Language</label>
                                    <select className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                                        <option>English (US)</option>
                                        <option>Bosnian / Croatian / Serbian</option>
                                        <option>German</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Date Format</label>
                                    <select className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                                        <option>MM/DD/YYYY</option>
                                        <option>DD.MM.YYYY</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Moon size={18}/> Appearance
                            </h3>
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div>
                                    <span className="text-sm font-medium block">Dark Mode</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Reduce eye strain</span>
                                </div>
                                <button 
                                  onClick={toggleDarkMode} 
                                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${darkMode ? 'bg-primary' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'account' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                            <img 
                                src={user?.picture || "https://ui-avatars.com/api/?name=User"} 
                                alt="Profile" 
                                className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 dark:border-slate-600"
                            />
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{user?.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Educator Account</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email Address</label>
                                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                    <Shield size={16} />
                                    <span className="text-sm">{user?.email}</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Member Since</label>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm">
                                    {formatDate(user?.memberSince)}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-700 pt-6 mt-6">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                                <Key size={16} /> Security
                            </h3>
                            <button onClick={handleChangePassword} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto">
                                Change Password
                            </button>
                        </div>
                        
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                            <h3 className="font-semibold text-red-600 mb-4 text-sm">Danger Zone</h3>
                            <button onClick={handleDeleteAccount} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm w-full sm:w-auto">
                                Delete Account
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Bell size={18}/> Email Notifications
                            </h3>
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                                    <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary" />
                                    <div>
                                        <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Weekly Digest</span>
                                        <span className="block text-xs text-slate-500 dark:text-slate-400">Get a summary of your generated content every Monday.</span>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                                    <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary" />
                                    <div>
                                        <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">New Feature Announcements</span>
                                        <span className="block text-xs text-slate-500 dark:text-slate-400">Be the first to know about new AI tools and templates.</span>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                                    <input type="checkbox" className="mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary" />
                                    <div>
                                        <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Tips & Tutorials</span>
                                        <span className="block text-xs text-slate-500 dark:text-slate-400">Receive helpful guides on using the prompt editor effectively.</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-slate-50 dark:bg-slate-800">
            <button 
                onClick={onClose} 
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 shadow-sm transition-colors"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
