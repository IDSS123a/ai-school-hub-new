
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  Trash2,
  Lock,
  UserPlus,
  Save,
  X,
  Filter,
  Eye
} from 'lucide-react';
import { UserProfile, UserRole, UserStatus } from '../types';
import { getAdminUsers, updateUserRole, updateUserStatus, deleteUser, addUser } from '../services/adminService';
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'teacher' as UserRole
  });

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

  const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.name || !newUser.email) return;

      const result = await addUser({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: 'active',
          picture: `https://ui-avatars.com/api/?name=${newUser.name.replace(' ', '+')}&background=random`
      });

      if (result.success && result.user) {
          addToast("User added successfully", "success");
          setUsers([result.user, ...users]);
          setIsAddModalOpen(false);
          setNewUser({ name: '', email: '', role: 'teacher' });
      } else {
          addToast(result.message || "Failed to add user", "error");
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-primary" aria-hidden="true" /> Admin Portal
          </h1>
          <p className="text-slate-500 mt-1">Manage user access, roles, and view usage analytics.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-2 focus:ring-4 focus:ring-primary/30">
             <UserPlus size={16} /> Add User
           </button>
           <button onClick={loadData} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium focus:ring-4 focus:ring-slate-200">
             Refresh Data
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" aria-label="System Statistics">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Users</p>
                 <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-primary rounded-lg">
                 <Users size={24} aria-hidden="true" />
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
                 <CheckCircle size={24} aria-hidden="true" />
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
                 <Clock size={24} aria-hidden="true" />
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
                 <Activity size={24} aria-hidden="true" />
              </div>
           </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
           <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search users"
              />
           </div>
           <div className="flex items-center gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200" aria-label="Filter users">
                 <Filter size={18} />
              </button>
           </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto" role="region" aria-label="User Management Table">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th scope="col" className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Login</th>
                <th scope="col" className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usage Stats</th>
                <th scope="col" className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
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
                           <img src={user.picture} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" aria-hidden="true" />
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
                         className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer hover:bg-slate-100 p-1 rounded focus:ring-2 focus:ring-primary/20"
                         aria-label={`Change role for ${user.name}`}
                       >
                          <option value="admin">Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="director">Director</option>
                          <option value="secretary">Secretary</option>
                          <option value="counselor">Counselor</option>
                          <option value="student">Student</option>
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
                           <span className="flex items-center gap-1.5"><Activity size={12} className="text-slate-400" aria-hidden="true"/> {user.stats?.loginCount || 0} logins</span>
                           <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" aria-hidden="true"/> {formatDuration(user.stats?.totalSessionMinutes || 0)} total</span>
                        </div>
                     </td>
                     <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                           <button 
                             onClick={() => openUserDetails(user)}
                             className="p-1.5 text-slate-500 hover:text-primary hover:bg-blue-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                             title="View Analytics"
                             aria-label={`View analytics for ${user.name}`}
                           >
                              <Eye size={18} />
                           </button>
                           {user.status === 'pending' && (
                              <button 
                                onClick={() => handleStatusChange(user.email, 'active')}
                                className="p-1.5 text-green-500 hover:bg-green-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                title="Approve User"
                                aria-label={`Approve ${user.name}`}
                              >
                                 <CheckCircle size={18} />
                              </button>
                           )}
                           <button 
                              onClick={() => handleDelete(user.email)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                              title="Delete User"
                              aria-label={`Delete ${user.name}`}
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

      {/* Add User Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="add-user-title">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h2 id="add-user-title" className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <UserPlus size={20} className="text-primary" aria-hidden="true"/> Add New User
                      </h2>
                      <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-full p-1" aria-label="Close modal">
                          <X size={24} />
                      </button>
                  </div>
                  <form onSubmit={handleAddUser} className="p-6 space-y-4">
                      <div>
                          <label htmlFor="newUser-name" className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                          <input 
                             id="newUser-name"
                             required
                             type="text" 
                             value={newUser.name}
                             onChange={e => setNewUser({...newUser, name: e.target.value})}
                             className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
                             placeholder="e.g. John Smith"
                          />
                      </div>
                      <div>
                          <label htmlFor="newUser-email" className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                          <input 
                             id="newUser-email"
                             required
                             type="email" 
                             value={newUser.email}
                             onChange={e => setNewUser({...newUser, email: e.target.value})}
                             className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
                             placeholder="e.g. john@school.ba"
                          />
                      </div>
                      <div>
                          <label htmlFor="newUser-role" className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                          <select 
                             id="newUser-role"
                             value={newUser.role}
                             onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                             className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                          >
                              <option value="admin">Administrator</option>
                              <option value="director">Director</option>
                              <option value="secretary">Secretary</option>
                              <option value="teacher">Teacher</option>
                              <option value="counselor">Counselor</option>
                              <option value="student">Student</option>
                              <option value="editor">Editor</option>
                          </select>
                      </div>
                      <div className="pt-4 flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => setIsAddModalOpen(false)}
                            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium focus:ring-2 focus:ring-slate-300"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-400"
                          >
                              <Save size={18} aria-hidden="true" /> Create User
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="user-details-title">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                 <div className="flex items-center gap-4">
                    <img src={selectedUser.picture} alt="" className="w-16 h-16 rounded-full border-2 border-white shadow-sm" aria-hidden="true" />
                    <div>
                       <h2 id="user-details-title" className="text-xl font-bold text-slate-900">{selectedUser.name}</h2>
                       <p className="text-slate-500">{selectedUser.email}</p>
                       <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">{selectedUser.role}</span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded uppercase">{selectedUser.status}</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-full p-1" aria-label="Close details">
                    <XCircle size={24} />
                 </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8">
                 {/* Quick Actions */}
                 <div className="flex gap-3">
                    {selectedUser.status !== 'active' && (
                        <button 
                            onClick={() => handleStatusChange(selectedUser.email, 'active')}
                            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm focus:ring-2 focus:ring-green-500"
                        >
                            Approve / Activate
                        </button>
                    )}
                    {selectedUser.status === 'active' && (
                        <button 
                            onClick={() => handleStatusChange(selectedUser.email, 'suspended')}
                            className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm focus:ring-2 focus:ring-amber-500"
                        >
                            Suspend Access
                        </button>
                    )}
                    <button className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm focus:ring-2 focus:ring-slate-300">
                        Reset Password
                    </button>
                 </div>

                 {/* Detailed Stats */}
                 <div>
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity size={18} aria-hidden="true"/> Usage Analytics</h3>
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
                     <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Lock size={18} aria-hidden="true"/> Security Audit Log</h3>
                     <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="p-3 font-semibold text-slate-500">Action</th>
                                    <th scope="col" className="p-3 font-semibold text-slate-500">Details</th>
                                    <th scope="col" className="p-3 font-semibold text-slate-500 text-right">Time</th>
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
