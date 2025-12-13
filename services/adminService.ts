
import { UserProfile, UserRole, UserStatus, UserAuditLog } from '../types';

const ADMIN_STORAGE_KEY = 'admin_users_db';

// Mock Data Generator
const generateMockUsers = (): UserProfile[] => {
  const mockNames = [
    { name: "Adnan Mehmedović", email: "adnan.m@school.ba", role: "admin", status: "active" },
    { name: "Sarah Johnson", email: "sarah.j@school.ba", role: "teacher", status: "active" },
    { name: "Marko Petrović", email: "marko.p@school.ba", role: "teacher", status: "pending" },
    { name: "Emma Wilson", email: "emma.w@school.ba", role: "editor", status: "active" },
    { name: "John Doe", email: "john.d@school.ba", role: "teacher", status: "suspended" },
    { name: "Amina Babić", email: "amina.b@school.ba", role: "counselor", status: "active" },
  ];

  return mockNames.map((u, index) => {
    const joined = Date.now() - Math.random() * 10000000000;
    const loginCount = Math.floor(Math.random() * 150) + 1;
    
    // Generate some fake audit logs
    const logs: UserAuditLog[] = [];
    if (Math.random() > 0.7) logs.push({ action: "Password Changed", timestamp: Date.now() - Math.random() * 500000000 });
    if (Math.random() > 0.8) logs.push({ action: "Username Changed", timestamp: Date.now() - Math.random() * 800000000 });
    logs.push({ action: "Account Created", timestamp: joined });

    return {
      id: `user_${index}_${Date.now()}`,
      name: u.name,
      email: u.email,
      picture: `https://ui-avatars.com/api/?name=${u.name.replace(' ', '+')}&background=random`,
      memberSince: joined,
      role: u.role as UserRole,
      status: u.status as UserStatus,
      stats: {
        loginCount: loginCount,
        lastLogin: Date.now() - Math.random() * 604800000, // Within last week
        totalSessionMinutes: loginCount * (Math.floor(Math.random() * 45) + 15),
        averageSessionMinutes: Math.floor(Math.random() * 45) + 15
      },
      auditLogs: logs.sort((a, b) => b.timestamp - a.timestamp)
    };
  });
};

// Initialize DB
const initAdminDB = () => {
  const existing = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!existing) {
    const seed = generateMockUsers();
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(existing);
};

// --- API METHODS ---

export const getAdminUsers = async (): Promise<UserProfile[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600)); 
  return initAdminDB();
};

export const updateUserRole = async (email: string, newRole: UserRole) => {
  const users: UserProfile[] = initAdminDB();
  const index = users.findIndex(u => u.email === email);
  if (index !== -1) {
    users[index].role = newRole;
    users[index].auditLogs?.unshift({
      action: "Role Updated",
      details: `Role changed to ${newRole}`,
      timestamp: Date.now()
    });
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(users));
    return true;
  }
  return false;
};

export const updateUserStatus = async (email: string, newStatus: UserStatus) => {
  const users: UserProfile[] = initAdminDB();
  const index = users.findIndex(u => u.email === email);
  if (index !== -1) {
    users[index].status = newStatus;
    users[index].auditLogs?.unshift({
      action: "Status Updated",
      details: `Status changed to ${newStatus}`,
      timestamp: Date.now()
    });
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(users));
    return true;
  }
  return false;
};

export const deleteUser = async (email: string) => {
  let users: UserProfile[] = initAdminDB();
  const initialLength = users.length;
  users = users.filter(u => u.email !== email);
  if (users.length !== initialLength) {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(users));
    return true;
  }
  return false;
};

export const addUser = async (user: Omit<UserProfile, 'id' | 'memberSince' | 'stats' | 'auditLogs'>) => {
  const users = initAdminDB();
  // Check if email exists
  if (users.find((u: UserProfile) => u.email === user.email)) {
    return { success: false, message: 'User with this email already exists' };
  }

  const newUser: UserProfile = {
    ...user,
    id: `user_${Date.now()}`,
    memberSince: Date.now(),
    stats: {
        loginCount: 0,
        totalSessionMinutes: 0,
        lastLogin: Date.now(),
        averageSessionMinutes: 0
    },
    auditLogs: [{ action: 'Account Created', timestamp: Date.now(), details: 'Created by Admin' }]
  };
  
  users.unshift(newUser);
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(users));
  return { success: true, user: newUser };
};

export const getUserDetails = async (email: string) => {
  const users = initAdminDB();
  return users.find((u: UserProfile) => u.email === email) || null;
};
