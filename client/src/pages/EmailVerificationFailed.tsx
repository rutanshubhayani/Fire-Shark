import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { XCircle, RefreshCw, AlertTriangle, Home, LogIn } from 'lucide-react';

const EmailVerificationFailed: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mb-6">
            <XCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Verification Failed
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            We couldn't verify your email address. The link may be invalid or expired.
          </p>
        </div>

        <Card className="border-red-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Verification Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  ⚠️ What happened?
                </h3>
                <p className="text-red-700 text-sm mb-3">
                  The verification link you clicked is no longer valid. This could be because:
                </p>
                <ul className="text-left text-red-700 text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    The link has expired
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    The link was already used
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    The link was modified
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-medium text-blue-800 mb-2">
                  🔧 How to fix this
                </h3>
                <p className="text-blue-700 text-sm">
                  You can request a new verification email or try logging in if your email is already verified.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/resend-verification" className="flex-1">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Verification
                  </Button>
                </Link>
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50">
                    <LogIn className="h-4 w-4 mr-2" />
                    Try Login
                  </Button>
                </Link>
              </div>
              
              <div className="pt-2">
                <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  <Home className="h-4 w-4 inline mr-1" />
                  Back to Home
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Still having trouble?{' '}
            <Link to="/contact" className="text-red-600 hover:text-red-700 font-medium">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationFailed; 