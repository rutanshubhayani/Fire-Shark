import axios from 'axios';
import { useAuthStore, getAuthToken, removeAuthToken } from '../store/authStore';

// Easily change the API base URL here:
export const API_BASE_URL = 'https://fireshark-server.vercel.app/api';
// export const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from both store and localStorage for redundancy
    const storeToken = useAuthStore.getState().token;
    const localStorageToken = getAuthToken();
    const token = storeToken || localStorageToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data from both store and localStorage
      useAuthStore.getState().logout();
      removeAuthToken();
      
      // Redirect to login if not already on auth pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { identifier: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: { first_name: string; last_name: string; username: string; email: string; password: string }) =>
    api.post('/auth/register', userData),
  verifyEmail: (token: string) =>
    api.get('/auth/verify-email', { params: { token } }),
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { newPassword }, { params: { token } }),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
  changeEmail: (currentPassword: string, newEmail: string) =>
    api.post('/auth/change-email', { currentPassword, newEmail }),
  guestSignup: (userData: { first_name: string; last_name: string }) =>
    api.post('/auth/guest-signup', userData),
};

// Questions API
export const questionsAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; sort?: string; tag?: string }) =>
    api.get('/questions', { params }),
  getById: (id: string) =>
    api.get(`/questions/${id}`),
  create: (questionData: { title: string; description: string; tags: string[] }) =>
    api.post('/questions', questionData),
  update: (id: string, questionData: { title: string; description: string; tags: string[] }) =>
    api.put(`/questions/${id}`, questionData),
  delete: (id: string) =>
    api.delete(`/questions/${id}`),
  vote: (id: string, voteType: 'upvote' | 'downvote') =>
    api.post(`/questions/${id}/vote`, { voteType }),
  getVote: (id: string) =>
    api.get(`/questions/${id}/vote`),
  search: (query: string) =>
    api.get('/questions/search', { params: { q: query } }),
};

// Answers API
export const answersAPI = {
  getByQuestion: (questionId: string) =>
    api.get(`/answers/question/${questionId}`),
  create: (questionId: string, answerData: { body: string }) =>
    api.post(`/answers`, { questionId, ...answerData }),
  update: (id: string, answerData: { body: string }) =>
    api.put(`/answers/${id}`, answerData),
  delete: (id: string) =>
    api.delete(`/answers/${id}`),
  vote: (id: string, voteType: 'upvote' | 'downvote') =>
    api.post(`/answers/${id}/vote`, { voteType }),
  accept: (id: string) =>
    api.post(`/answers/${id}/accept`),
};

// Tags API
export const tagsAPI = {
  getAll: (params?: { limit?: number; search?: string; sort?: string }) =>
    api.get('/tags', { params }),
  getByName: (name: string) =>
    api.get(`/tags/${name}`),
  create: (tagData: { name: string; description?: string }) =>
    api.post('/tags', tagData),
  update: (id: string, tagData: { name: string; description?: string }) =>
    api.put(`/tags/${id}`, tagData),
  delete: (id: string) =>
    api.delete(`/tags/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: () =>
    api.get('/notifications'),
  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.put('/notifications/mark-all-read'),
  delete: (id: string) =>
    api.delete(`/notifications/${id}`),
};

// User API
export const userAPI = {
  uploadAvatar: (formData: FormData) =>
    api.post('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  removeAvatar: () =>
    api.delete('/users/remove-avatar'),
  getStats: (userId: string) =>
    api.get(`/users/${userId}/stats`),
  getQuestions: (userId: string) =>
    api.get(`/users/${userId}/questions`),
  getAnswers: (userId: string) =>
    api.get(`/users/${userId}/answers`),
};

// Stats API
export const statsAPI = {
  getAll: () =>
    api.get('/stats'),
};

export default api; 