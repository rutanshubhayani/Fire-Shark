import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Mail, Home, User } from 'lucide-react';

const EmailAlreadyVerified: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Email Already Verified
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Your email address has already been verified successfully. You have full access to all features.
          </p>
        </div>

        <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-green-700">
              <Mail className="h-5 w-5" />
              Verification Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  ✅ All Set!
                </h3>
                <p className="text-green-700 text-sm">
                  Your account is fully verified and ready to use. You can now:
                </p>
                <ul className="text-left text-green-700 text-sm mt-3 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Ask questions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Answer questions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Vote on content
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Access all features
                  </li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/" className="flex-1">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Home
                  </Button>
                </Link>
                <Link to="/profile" className="flex-1">
                  <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <Link to="/contact" className="text-green-600 hover:text-green-700 font-medium">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailAlreadyVerified; 