import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
  validateToken: () => Promise<boolean>;
}

// Helper function to save token to localStorage
const saveTokenToLocalStorage = (token: string) => {
  localStorage.setItem('auth_token', token);
};

// Helper function to get token from localStorage
const getTokenFromLocalStorage = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to remove token from localStorage
const removeTokenFromLocalStorage = () => {
  localStorage.removeItem('auth_token');
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user: User, token: string) => {
        // Save token to localStorage
        saveTokenToLocalStorage(token);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      logout: () => {
        // Remove token from localStorage
        removeTokenFromLocalStorage();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      setLoading: (loading: boolean) =>
        set({ isLoading: loading }),
      updateUser: (user: User) =>
        set({ user }),
      clearAuth: () => {
        removeTokenFromLocalStorage();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      validateToken: async () => {
        const token = get().token || getTokenFromLocalStorage();
        if (!token) {
          return false;
        }

        try {
          // You can add a token validation API call here if needed
          // For now, we'll just check if token exists
          return !!token;
        } catch (error) {
          console.error('Token validation failed:', error);
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Initialize token from localStorage on store creation
      onRehydrateStorage: () => (state) => {
        if (state) {
          const tokenFromStorage = getTokenFromLocalStorage();
          if (tokenFromStorage && !state.token) {
            state.token = tokenFromStorage;
          }
        }
      },
    }
  )
);

// Export helper functions for external use
export const getAuthToken = (): string | null => {
  return getTokenFromLocalStorage();
};

export const setAuthToken = (token: string): void => {
  saveTokenToLocalStorage(token);
};

export const removeAuthToken = (): void => {
  removeTokenFromLocalStorage();
};

// Utility function to check if user is authenticated
export const isUserAuthenticated = (): boolean => {
  const store = useAuthStore.getState();
  return store.isAuthenticated && !!store.token;
};

// Utility function to get current user
export const getCurrentUser = (): User | null => {
  return useAuthStore.getState().user;
}; 