import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { User, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface GuestProfileProps {
  onSwitchToMainLogin: () => void;
}

const GuestProfile: React.FC<GuestProfileProps> = ({ onSwitchToMainLogin }) => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Guest Profile</h1>
        <p className="text-gray-600 mt-1">You're currently logged in as a guest user</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-orange-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Username:</span>
                  <span className="font-medium">{user?.username}</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Guest</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">First Name:</span>
                  <span className="font-medium">{user?.first_name || 'Guest'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Last Name:</span>
                  <span className="font-medium">{user?.last_name || 'User'}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  className="w-full" 
                  onClick={onSwitchToMainLogin}
                  variant="default"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Switch to Main Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Guest Limitations */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Guest Limitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span>Limited access to platform features</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span>Cannot create questions or answers</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span>Cannot vote on content</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span>Profile data is temporary</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits of Main Account */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Benefits of Main Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Full Access</h3>
                    <p className="text-sm text-gray-600">
                      Ask questions, provide answers, and participate in discussions
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Voting Rights</h3>
                    <p className="text-sm text-gray-600">
                      Upvote and downvote questions and answers
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Profile Management</h3>
                    <p className="text-sm text-gray-600">
                      Customize your profile with avatar and personal information
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Notifications</h3>
                    <p className="text-sm text-gray-600">
                      Receive notifications for your activity and mentions
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    className="w-full" 
                    onClick={onSwitchToMainLogin}
                    size="lg"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Create Main Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GuestProfile; 