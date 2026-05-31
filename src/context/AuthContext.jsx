import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRESET_USERS } from '../services/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user session exists in localStorage
    const savedUser = localStorage.getItem('spotflow_user');
    const savedRole = localStorage.getItem('spotflow_role');
    
    if (savedUser && savedRole) {
      setUser(JSON.parse(savedUser));
      setRole(savedRole);
    } else {
      setUser(null);
      setRole(null);
    }
    setLoading(false);
  }, []);

  // Standard Login Mock
  const login = (username) => {
    const matchedUser = PRESET_USERS[username.toLowerCase()];
    if (matchedUser) {
      setUser(matchedUser);
      setRole(matchedUser.role);
      localStorage.setItem('spotflow_user', JSON.stringify(matchedUser));
      localStorage.setItem('spotflow_role', matchedUser.role);
      return { success: true, user: matchedUser };
    }
    return { success: false, message: 'Invalid credentials. Use admin, staff, or driver.' };
  };

  // Logout Mock
  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('spotflow_user');
    localStorage.removeItem('spotflow_role');
  };

  // Role switcher for demonstration and presentation purposes
  const switchRole = (newRole) => {
    const matchedUser = PRESET_USERS[newRole];
    if (matchedUser) {
      setUser(matchedUser);
      setRole(matchedUser.role);
      localStorage.setItem('spotflow_user', JSON.stringify(matchedUser));
      localStorage.setItem('spotflow_role', matchedUser.role);
      // Dispatch a storage event so if there are other tabs/listeners they update
      window.dispatchEvent(new Event('storage'));
      return true;
    }
    return false;
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem('spotflow_user', JSON.stringify(newUser));
      return newUser;
    });
  };

  const value = {
    user,
    role,
    loading,
    login,
    logout,
    switchRole,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
