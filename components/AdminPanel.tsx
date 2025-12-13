import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Search, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Activity,
  Trash2,
  Lock,
  UserCheck,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { UserProfile, UserRole, UserStatus } from '../types';
import { getAdminUsers, updateUserRole, updateUserStatus, deleteUser } from '../services/adminService';
import { useToast } from '../context/ToastContext';

// Helper for formatting duration
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const AdminPanel = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, totalHours: 0 });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Calculate stats
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const pending = users.filter(u => u.status === 'pending').length;
    const totalHours = Math.floor(users.reduce((acc, curr) => acc + (curr.stats?.totalSessionMinutes || 0), 0) / 60);
    setStats({ total, active, pending, totalHours });
  }, [users]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (e) {
      addToast("Failed to load user data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (email: string, newStatus: UserStatus) => {
    const success = await updateUserStatus(email, newStatus);
    if (success) {
      addToast(`User status updated to ${newStatus}`, "success");
      setUsers(users.map(u => u.email === email ? { ...u, status: newStatus } : u));
      if (selectedUser?.email === email) setSelectedUser(prev => prev ? {...prev, status: newStatus} : null);
    } else {
      addToast("Failed to update status", "error");
    }
  };

  const handleRoleChange = async (email: string, newRole: UserRole) => {
    const success = await updateUserRole(email, newRole);
    if (success) {
      addToast(`User role updated to ${newRole}`, "success");
      setUsers(users.map(u => u.email === email ? { ...u, role: newRole } : u));
    } else {
      addToast("Failed to update role", "error");
    }
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    const success = await deleteUser(email);
    if (success) {
      addToast("User deleted successfully", "success");
      setUsers(users.filter(u => u.email !== email));
      setIsDetailsModalOpen(false);
    } else {
      addToast("Failed to delete user", "error");
    }
  };

  const openUserDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-primary" /> Admin Portal
          </h1>
          <p className="text-slate-500 mt-1">Manage user access, roles, and view usage analytics.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={loadData} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium">
             Refresh Data
           </button>
           <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-2">
             <Download size={16} /> Export Report
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Users</p>
                 <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-primary rounded-lg">
                 <Users size={24} />
              </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active</p>
                 <h3 className="text-3xl font-bold text-green-600 mt-2">{stats.active}</h3>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                 <CheckCircle size={24} />
              </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending</p>
                 <h3 className="text-3xl font-bold text-amber-500 mt-2">{stats.pending}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-500 rounded-lg">
                 <Clock size={24} />
              </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Usage</p>
                 <h3 className="text-3xl font-bold text-purple-600 mt-2">{stats.totalHours}h</h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                 <Activity size={24} />
              </div>
           </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
           <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                 <Filter size={18} />
              </button>
           </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Login</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usage Stats</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {isLoading ? (
                 <tr>
                   <td colSpan={6} className="p-12 text-center text-slate-500">Loading user data...</td>
                 </tr>
               ) : filteredUsers.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">No users found matching your search.</td>
                 </tr>
               ) : (
                 filteredUsers.map((user) => (
                   <tr key={user.email} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                           <div>
                              <div className="font-medium text-slate-900">{user.name}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                           </div>
                        </div>
                     </td>
                     <td className="p-4">
                       <select 
                         value={user.role}
                         onChange={(e) => handleRoleChange(user.email, e.target.value as UserRole)}
                         className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer hover:bg-slate-100 p-1 rounded"
                       >
                          <option value="admin">Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="editor">Editor</option>
                       </select>
                     </td>
                     <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${user.status === 'active' ? 'bg-green-100 text-green-800' : 
                            user.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          {user.status}
                        </span>
                     </td>
                     <td className="p-4 text-sm text-slate-600">
                        {user.stats?.lastLogin ? new Date(user.stats.lastLogin).toLocaleDateString() : 'Never'}
                        <div className="text-xs text-slate-400">
                           {user.stats?.lastLogin ? new Date(user.stats.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </div>
                     </td>
                     <td className="p-4 text-sm text-slate-600">
                        <div className="flex flex-col gap-1">
                           <span className="flex items-center gap-1.5"><Activity size={12} className="text-slate-400"/> {user.stats?.loginCount || 0} logins</span>
                           <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400"/> {formatDuration(user.stats?.totalSessionMinutes || 0)} total</span>
                        </div>
                     </td>
                     <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => openUserDetails(user)}
                             className="p-1.5 text-slate-500 hover:text-primary hover:bg-blue-50 rounded transition-colors"
                             title="View Analytics"
                           >
                              <Eye size={18} />
                           </button>
                           {user.status === 'pending' && (
                              <button 
                                onClick={() => handleStatusChange(user.email, 'active')}
                                className="p-1.5 text-green-500 hover:bg-green-50 rounded transition-colors"
                                title="Approve User"
                              >
                                 <CheckCircle size={18} />
                              </button>
                           )}
                           <button 
                              onClick={() => handleDelete(user.email)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete User"
                           >
                              <Trash2 size={18} />
                           </button>
                        </div>
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                 <div className="flex items-center gap-4">
                    <img src={selectedUser.picture} alt="" className="w-16 h-16 rounded-full border-2 border-white shadow-sm" />
                    <div>
                       <h2 className="text-xl font-bold text-slate-900">{selectedUser.name}</h2>
                       <p className="text-slate-500">{selectedUser.email}</p>
                       <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">{selectedUser.role}</span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded uppercase">{selectedUser.status}</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <XCircle size={24} />
                 </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8">
                 {/* Quick Actions */}
                 <div className="flex gap-3">
                    {selectedUser.status !== 'active' && (
                        <button 
                            onClick={() => handleStatusChange(selectedUser.email, 'active')}
                            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                        >
                            Approve / Activate
                        </button>
                    )}
                    {selectedUser.status === 'active' && (
                        <button 
                            onClick={() => handleStatusChange(selectedUser.email, 'suspended')}
                            className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm"
                        >
                            Suspend Access
                        </button>
                    )}
                    <button className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">
                        Reset Password
                    </button>
                 </div>

                 {/* Detailed Stats */}
                 <div>
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity size={18}/> Usage Analytics</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-center">
                            <div className="text-2xl font-bold text-slate-900">{selectedUser.stats?.loginCount}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Total Logins</div>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-center">
                            <div className="text-2xl font-bold text-slate-900">{formatDuration(selectedUser.stats?.totalSessionMinutes || 0)}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Total Time Online</div>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-center">
                            <div className="text-2xl font-bold text-slate-900">{selectedUser.stats?.averageSessionMinutes}m</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Avg Session</div>
                        </div>
                    </div>
                 </div>

                 {/* Audit Logs */}
                 <div>
                     <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Lock size={18}/> Security Audit Log</h3>
                     <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-500">Action</th>
                                    <th className="p-3 font-semibold text-slate-500">Details</th>
                                    <th className="p-3 font-semibold text-slate-500 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedUser.auditLogs?.map((log, i) => (
                                    <tr key={i}>
                                        <td className="p-3 font-medium text-slate-700">{log.action}</td>
                                        <td className="p-3 text-slate-500">{log.details || '-'}</td>
                                        <td className="p-3 text-slate-400 text-right">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                            <span className="block text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </td>
                                    </tr>
                                ))}
                                {(!selectedUser.auditLogs || selectedUser.auditLogs.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="p-4 text-center text-slate-400">No logs found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                     </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;