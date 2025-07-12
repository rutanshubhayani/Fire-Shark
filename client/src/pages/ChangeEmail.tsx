import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { authAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';

const changeEmailSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newEmail: z.string().email('Please enter a valid email address'),
  confirmEmail: z.string(),
}).refine((data) => data.newEmail === data.confirmEmail, {
  message: "Email addresses don't match",
  path: ["confirmEmail"],
});

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

const ChangeEmail: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
  });

  const onSubmit = async (data: ChangeEmailFormData) => {
    setIsLoading(true);
    try {
      await authAPI.changeEmail(data.currentPassword, data.newEmail);
      setEmailChangeRequested(true);
      reset();
      toast.success('Email change request submitted! Please check your new email for verification.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change email. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Please log in to change your email.</p>
          <Link to="/login" className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/settings" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Link>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Change Email Address
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Update your email address to keep your account secure.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Update Email</CardTitle>
          </CardHeader>
          <CardContent>
            {emailChangeRequested ? (
              <div className="text-center space-y-4">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900">Email Change Requested!</h3>
                <p className="text-sm text-gray-600">
                  We've sent a verification email to your new email address. Please check your inbox and click the verification link to complete the email change.
                </p>
                <div className="pt-4">
                  <Link
                    to="/settings"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Back to Settings
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="currentEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="currentEmail"
                      type="email"
                      value={user.email}
                      disabled
                      className="pl-10 bg-gray-100"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">This is your current email address</p>
                </div>

                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      {...register('currentPassword')}
                      className={`pl-10 pr-10 ${errors.currentPassword ? 'border-red-500' : ''}`}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    New Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="newEmail"
                      type="email"
                      {...register('newEmail')}
                      className={`pl-10 ${errors.newEmail ? 'border-red-500' : ''}`}
                      placeholder="Enter your new email address"
                    />
                  </div>
                  {errors.newEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.newEmail.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="confirmEmail"
                      type="email"
                      {...register('confirmEmail')}
                      className={`pl-10 ${errors.confirmEmail ? 'border-red-500' : ''}`}
                      placeholder="Confirm your new email address"
                    />
                  </div>
                  {errors.confirmEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmEmail.message}</p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Important Information</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• You'll receive a verification email at your new address</li>
                    <li>• Your email will only change after verification</li>
                    <li>• You can continue using your current email until verified</li>
                    <li>• The verification link expires in 24 hours</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Email Address'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            <Link to="/settings" className="font-medium text-blue-600 hover:text-blue-500">
              Back to Settings
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangeEmail; 