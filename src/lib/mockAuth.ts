import { User, School } from '@/types';

const STORAGE_KEYS = {
  CURRENT_USER: 'active_mobility_current_user',
  USERS: 'active_mobility_users',
  SCHOOLS: 'active_mobility_schools',
};

// Initialize with demo data
const initializeDemoData = () => {
  const existingSchools = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
  if (!existingSchools) {
    const demoSchool: School = {
      id: 'school-1',
      name: 'Bratislava Primary School',
      email: 'admin@school.com',
    };
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify([demoSchool]));
  }

  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!existingUsers) {
    const demoUsers: User[] = [
      {
        id: 'admin-1',
        name: 'School Admin',
        email: 'admin@school.com',
        schoolId: 'school-1',
        totalPoints: 0,
        totalCo2SavedG: 0,
        distanceToSchoolKm: 0,
        role: 'admin',
      },
      {
        id: 'student-1',
        name: 'Tomáš Novák',
        email: 'tomas@student.com',
        schoolId: 'school-1',
        totalPoints: 120,
        totalCo2SavedG: 6000, // Demo data - 6kg CO₂ saved
        distanceToSchoolKm: 2.5,
        role: 'student',
      },
      {
        id: 'student-2',
        name: 'Eva Horváthová',
        email: 'eva@student.com',
        schoolId: 'school-1',
        totalPoints: 95,
        totalCo2SavedG: 4750, // Demo data - 4.75kg CO₂ saved
        distanceToSchoolKm: 1.8,
        role: 'student',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(demoUsers));
  }
};

initializeDemoData();

export const mockAuth = {
  login: async (email: string, password: string): Promise<{ user?: User; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const usersJson = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!usersJson) {
      return { error: 'No users found' };
    }

    const users: User[] = JSON.parse(usersJson);
    const user = users.find(u => u.email === email);

    if (!user) {
      return { error: 'Invalid email or password' };
    }

    // In a real app, we'd verify the password hash
    // For demo: admin@school.com / password123 or tomas@student.com / password123
    if (password !== 'password123') {
      return { error: 'Invalid email or password' };
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { user };
  },

  signup: async (name: string, email: string, password: string, role: 'student' | 'admin'): Promise<{ user?: User; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const usersJson = localStorage.getItem(STORAGE_KEYS.USERS) || '[]';
    const users: User[] = JSON.parse(usersJson);

    if (users.find(u => u.email === email)) {
      return { error: 'Email already exists' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      schoolId: 'school-1', // For demo, everyone joins the demo school
      totalPoints: 0,
      totalCo2SavedG: 0,
      distanceToSchoolKm: 2.0, // Default distance for new users
      role,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));

    return { user: newUser };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
  },

  updateUserPoints: (userId: string, points: number) => {
    const usersJson = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!usersJson) return;

    const users: User[] = JSON.parse(usersJson);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].totalPoints += points;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // Update current user if it's the same
      const currentUser = mockAuth.getCurrentUser();
      if (currentUser?.id === userId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(users[userIndex]));
      }
    }
  },
};
