/**
 * Authentication Context
 * 
 * TODO: Implement proper authentication context
 * - Store authentication state
 * - Provide login/logout methods
 * - Handle JWT token management
 * - Integrate with backend auth API
 * 
 * Related Flaw: Module 1 - No Real Authentication System (CRITICAL)
 * @see docs/FLAWS_AND_ISSUES.md
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'participant' | 'admin';
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Check for existing session on mount
    // Load user from localStorage/sessionStorage
    // Validate token with backend
    setIsLoading(false);
  }, []);

  const login = async (_email: string, _password: string) => {
    // TODO: Implement actual authentication
    // Call backend API
    // Store JWT token
    // Set user state
    throw new Error('Not implemented');
  };

  const logout = () => {
    // TODO: Clear session
    // Remove token from storage
    // Call backend logout endpoint
    setUser(null);
  };

  const register = async (_email: string, _password: string, _name: string) => {
    // TODO: Implement registration
    throw new Error('Not implemented');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
