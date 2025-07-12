import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore, getAuthToken } from '../store/authStore';

interface User {
  _id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  role: 'guest' | 'user' | 'admin';
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout, 
    updateUser, 
    clearAuth,
    validateToken
  } = useAuthStore();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const tokenFromStorage = getAuthToken();
      if (tokenFromStorage && !isAuthenticated) {
        // Token exists in localStorage but not in store
        // Validate the token
        const isValid = await validateToken();
        if (!isValid) {
          // Token is invalid, clear it
          clearAuth();
        }
      }
    };

    initializeAuth();
  }, [isAuthenticated, validateToken, clearAuth]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    clearAuth,
    validateToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 