
import React, { useState } from 'react';
import { X, Copy, Mail, Check, UserPlus, Globe, Lock } from 'lucide-react';
import { UserProfile } from '../types';
import { useToast } from '../context/ToastContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  user: UserProfile | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, user }) => {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [isCopied, setIsCopied] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState([
    { name: user?.name || 'You', email: user?.email || '', role: 'Owner', picture: user?.picture },
  ]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    // Simulate copying a unique session link
    const dummyLink = `https://school-hub.app/collab/${Math.random().toString(36).substring(7)}`;
    navigator.clipboard.writeText(dummyLink);
    setIsCopied(true);
    addToast("Link copied to clipboard!", "success");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simulate inviting a user
    const newUser = {
      name: email.split('@')[0],
      email: email,
      role: role === 'editor' ? 'Editor' : 'Viewer',
      picture: `https://ui-avatars.com/api/?name=${email}&background=random`
    };

    setInvitedUsers([...invitedUsers, newUser]);
    setEmail('');
    addToast(`Invitation sent to ${email}`, "success");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserPlus size={20} className="text-primary" /> Share & Collaborate
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    "{title}"
                </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
            >
                <X size={24} />
            </button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Invite Section */}
            <form onSubmit={handleInvite} className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Invite Colleagues</label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="email" 
                            placeholder="Add people by email..." 
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <select 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                    </select>
                    <button 
                        type="submit"
                        disabled={!email}
                        className="bg-primary text-white px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Send
                    </button>
                </div>
            </form>

            {/* Link Sharing */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Get Link</label>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-400 rounded-full">
                            <Globe size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Anyone with the link</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Can view and edit</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 text-primary dark:text-blue-400 font-medium hover:underline text-sm"
                    >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                        {isCopied ? 'Copied' : 'Copy Link'}
                    </button>
                </div>
            </div>

            {/* Who has access */}
            <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Who has access</label>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {invitedUsers.map((u, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={u.picture} alt={u.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {u.name} {i === 0 && '(You)'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{u.role}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                Done
            </button>
        </div>

      </div>
    </div>
  );
};

export default ShareModal;
