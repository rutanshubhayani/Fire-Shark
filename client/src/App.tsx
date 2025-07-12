import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Questions from './pages/Questions';
import QuestionDetail from './pages/QuestionDetail';
import AskQuestion from './pages/AskQuestion';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import ChangePassword from './pages/ChangePassword';
import ChangeEmail from './pages/ChangeEmail';
import Settings from './pages/Settings';
import EmailAlreadyVerified from './pages/EmailAlreadyVerified';
import EmailVerificationFailed from './pages/EmailVerificationFailed';
import { AuthProvider } from './contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-stackit-50">
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/questions" element={<Questions />} />
                  <Route path="/questions/:id" element={<QuestionDetail />} />
                  <Route path="/ask" element={<AskQuestion />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/resend-verification" element={<ResendVerification />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/change-email" element={<ChangeEmail />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/email-already-verified" element={<EmailAlreadyVerified />} />
                  <Route path="/email-verification-failed" element={<EmailVerificationFailed />} />
                </Routes>
              </Layout>
              <Toaster position="top-right" />
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
