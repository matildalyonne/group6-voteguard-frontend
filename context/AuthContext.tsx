import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';






interface AuthContextType {
  user: User | null;
  login: (role: UserRole, name?: string, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: UserRole, name: string = 'User', token?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setUser({ id, name, role, token });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};