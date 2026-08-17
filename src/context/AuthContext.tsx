import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role } from '../types';

interface AuthContextType {
  role: Role;
  isAuthenticated: boolean;
  login: (role: Role) => void;
  logout: () => void;
  setRole: (role: Role) => void;
  userTitle: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(() => {
    const savedRole = localStorage.getItem('gw_hris_current_role');
    return (savedRole as Role) || 'ADMIN'; // Default to ADMIN for easy evaluation
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = sessionStorage.getItem('gw_hris_is_authenticated');
    return savedAuth === 'true';
  });

  useEffect(() => {
    localStorage.setItem('gw_hris_current_role', role);
  }, [role]);

  useEffect(() => {
    sessionStorage.setItem('gw_hris_is_authenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  const login = (selectedRole: Role) => {
    setRoleState(selectedRole);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
  };

  const userTitle = role === 'ADMIN' ? 'District HR Administrator' : 'District HR View-Only Personnel';

  return (
    <AuthContext.Provider value={{ role, isAuthenticated, login, logout, setRole, userTitle }}>
      {children}
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
