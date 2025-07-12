import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../lib/api';
import { 
  User, 
  Mail, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  Settings,
  Edit,
  Plus,
  Eye,
  Tag,
  Clock
} from 'lucide-react';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  // @ts-ignore
  const { user, isAuthenticated, logout } = useAuth();

  // Fetch user's questions (only for non-guest users)
  const { data: userQuestionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['user-questions', user?._id],
    queryFn: () => userAPI.getQuestions(user!._id).then(res => res.data),
    enabled: !!user?._id && user?.role !== 'guest',
  });

  // Fetch user's answers (only for non-guest users)
  const { data: userAnswersData, isLoading: answersLoading } = useQuery({
    queryKey: ['user-answers', user?._id],
    queryFn: () => userAPI.getAnswers(user!._id).then(res => res.data),
    enabled: !!user?._id && user?.role !== 'guest',
  });

  // Fetch user's stats (only for non-guest users)
  const { data: userStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?._id],
    queryFn: () => userAPI.getStats(user!._id).then(res => res.data),
    enabled: !!user?._id && user?.role !== 'guest',
  });

  // Ensure data is always an array/object
  const userQuestions = Array.isArray(userQuestionsData?.questions) ? userQuestionsData.questions : [];
  const userAnswers = Array.isArray(userAnswersData?.answers) ? userAnswersData.answers : [];
  const userStats = userStatsData || {};

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">Please log in to view your profile</h2>
      </div>
    );
  }

  // Redirect guest users to home page
  React.useEffect(() => {
    if (user && user.role === 'guest') {
      navigate('/');
    }
  }, [user, navigate]);

  if (user && user.role === 'guest') {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account and view your activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-24 h-24 rounded-full border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Username:</span>
                  <span className="font-medium">{user?.username}</span>
                </div>
                {user?.role === 'guest' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="font-medium">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Role:</span>
                      <span className="font-medium capitalize">{user?.role}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Questions Asked</span>
                  <span className="font-semibold">
                    {questionsLoading ? '...' : userQuestions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Comments Given</span>
                  <span className="font-semibold">
                    {answersLoading ? '...' : userAnswers.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Votes</span>
                  <span className="font-semibold">
                    {statsLoading ? '...' : (userStats.totalVotes || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                  Your Questions ({userQuestions.length})
              </CardTitle>
                <Button onClick={() => navigate('/ask')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ask Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your questions...</p>
                </div>
              ) : userQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start asking questions to help others and build your reputation!
                  </p>
                  <Button onClick={() => navigate('/ask')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ask Your First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userQuestions.map((question: any) => (
                    <div key={question._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                            <Link to={`/questions/${question._id}`}>
                        {question.title}
                            </Link>
                      </h3>
                          
                          {/* Tags */}
                          {question.tags && question.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {question.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                              {question.answers?.length || 0} comments
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                              {(question.upvotes?.length || 0) - (question.downvotes?.length || 0)} votes
                        </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(question.createdAt)}
                        </span>
                          </div>
                        </div>
                        
                        {/* View Button */}
                        <Link to={`/questions/${question._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link to="/change-email" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Change Email
                </Button>
                </Link>
                <Link to="/change-password" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Upload Avatar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile; 