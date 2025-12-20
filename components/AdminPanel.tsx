
import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Search, CheckCircle, XCircle, Clock, Activity, Trash2, Lock, UserPlus, Save, X, Filter, Eye 
} from 'lucide-react';
import { UserProfile, UserRole, UserStatus } from '../types';
import { getAdminUsers, updateUserRole, updateUserStatus, deleteUser, addUser } from '../services/adminService';
import { useToast } from '../context/ToastContext';

const AdminPanel = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'teacher' as UserRole });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (e) {
      addToast("Failed to load users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (email: string, newStatus: UserStatus) => {
    if (await updateUserStatus(email, newStatus)) {
      addToast(`Status: ${newStatus}`, "success");
      setUsers(users.map(u => u.email === email ? { ...u, status: newStatus } : u));
    }
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm("Delete this user?")) return;
    if (await deleteUser(email)) {
      addToast("User removed", "success");
      setUsers(users.filter(u => u.email !== email));
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-primary" /> Admin Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage platform access and permissions.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-primary text-slate-900 rounded-lg font-bold flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95 transition-all">
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
           <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Responsive Layout: Table on Desktop, Cards on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="p-4 text-xs font-bold uppercase text-slate-500">User</th>
                <th className="p-4 text-xs font-bold uppercase text-slate-500">Role</th>
                <th className="p-4 text-xs font-bold uppercase text-slate-500">Status</th>
                <th className="p-4 text-xs font-bold uppercase text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map((user) => (
                <tr key={user.email} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img src={user.picture} className="w-10 h-10 rounded-full" alt="" />
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-300 capitalize">{user.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleStatusChange(user.email, user.status === 'active' ? 'suspended' : 'active')} className="p-1.5 text-slate-400 hover:text-primary transition-colors"><Lock size={16} /></button>
                      <button onClick={() => handleDelete(user.email)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid */}
        <div className="md:hidden grid grid-cols-1 gap-4 p-4">
           {filteredUsers.map((user) => (
             <div key={user.email} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-3">
                  <img src={user.picture} className="w-12 h-12 rounded-full" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">{user.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 uppercase font-bold text-[10px] tracking-widest">{user.role}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.status}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                   <button onClick={() => handleStatusChange(user.email, user.status === 'active' ? 'suspended' : 'active')} className="flex-1 py-2 bg-white dark:bg-slate-800 rounded-lg border text-xs font-bold flex items-center justify-center gap-2">
                      <Lock size={14} /> {user.status === 'active' ? 'Suspend' : 'Activate'}
                   </button>
                   <button onClick={() => handleDelete(user.email)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg border border-red-100 text-xs font-bold flex items-center justify-center gap-2">
                      <Trash2 size={14} /> Delete
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
