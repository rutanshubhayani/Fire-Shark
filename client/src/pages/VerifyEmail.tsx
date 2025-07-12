import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, Home, User, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'failed' | 'loading'>('loading');

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'success') {
      setVerificationStatus('success');
    } else if (verified === 'failed') {
      setVerificationStatus('failed');
    }
  }, [searchParams]);

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Verifying your email...</h3>
          <p className="text-gray-600">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Email Verification
          </h2>
        </div>

        {verificationStatus === 'success' ? (
          <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Verification Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-lg font-medium text-green-800 mb-2">
                    🎉 Welcome to StackIt!
                  </h3>
                  <p className="text-green-700 text-sm">
                    Your email has been verified successfully. You now have full access to all features.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/" className="flex-1">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Home className="h-4 w-4 mr-2" />
                      Go to Home
                    </Button>
                  </Link>
                  <Link to="/profile" className="flex-1">
                    <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                Verification Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    ⚠️ Verification Error
                  </h3>
                  <p className="text-red-700 text-sm">
                    The verification link is invalid or has expired. Please request a new verification email.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/resend-verification" className="flex-1">
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Verification
                    </Button>
                  </Link>
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50">
                      <Mail className="h-4 w-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 