import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { questionsAPI, statsAPI, tagsAPI, answersAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  Clock,
  Tag,
  X,
  Eye
} from 'lucide-react';
import { formatDate } from '../lib/utils';

type Answer = {
  _id: string;
  body: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt?: string;
  upvotes?: string[];
  downvotes?: string[];
  images?: Array<{
    url: string;
    caption?: string;
  }>;
};

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [viewingQuestion, setViewingQuestion] = useState<any>(null);
  const [viewingAnswers, setViewingAnswers] = useState<Answer[]>([]);

  // Get first letter of username for avatar fallback
  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  // Get avatar color based on username
  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Fetch recent questions
  const { data: recentQuestionsData, error: questionsError, isLoading: questionsLoading } = useQuery({
    queryKey: ['recent-questions'],
    queryFn: () => questionsAPI.getAll({ limit: 5 }).then(res => res.data?.questions || []),
    retry: 1,
  });

  const recentQuestions = recentQuestionsData || [];

  // Fetch answers for all questions in view
  const answersQueries = useQueries({
    queries: recentQuestions.map((q: any) => ({
      queryKey: ['answers', q._id],
      queryFn: () => answersAPI.getByQuestion(q._id).then(res => res.data?.answers || []),
      enabled: !!q._id,
    })),
  });

  const handleViewAnswers = (question: any) => {
    const rawAnswers = answersQueries[recentQuestions.findIndex((q: any) => q._id === question._id)]?.data;
    const answers: Answer[] = Array.isArray(rawAnswers) ? rawAnswers : [];
    setViewingQuestion(question);
    setViewingAnswers(answers);
    setShowAnswersModal(true);
  };

  const handleCloseAnswersModal = () => {
    setShowAnswersModal(false);
    setViewingQuestion(null);
    setViewingAnswers([]);
  };

  // Fetch popular tags
  const { data: popularTagsData, error: tagsError, isLoading: tagsLoading } = useQuery({
    queryKey: ['popular-tags'],
    queryFn: () => tagsAPI.getAll({ limit: 10 }).then(res => res.data?.tags || []),
    retry: 1,
  });

  const tags = Array.isArray(popularTagsData) ? popularTagsData : [];

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsAPI.getAll().then(res => res.data?.stats || {}),
    retry: 1,
  });

  const stats = [
    {
      title: 'Questions Asked',
      value: statsLoading ? '...' : statsData?.totalQuestions?.toLocaleString() || '0',
      icon: MessageSquare,
      color: 'text-stackit-600',
      bgColor: 'bg-stackit-100',
    },
    {
      title: 'Active Users',
      value: statsLoading ? '...' : statsData?.totalUsers?.toLocaleString() || '0',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Answers Given',
      value: statsLoading ? '...' : statsData?.totalAnswers?.toLocaleString() || '0',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Daily Visitors',
      value: statsLoading ? '...' : statsData?.dailyUsers?.toLocaleString() || '0',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center py-16 hero-gradient text-white rounded-2xl shadow-stackit">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Welcome to StackIt
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-stackit-100 animate-fade-in">
            The minimal question-and-answer platform for collaborative learning
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            {isAuthenticated ? (
              <Link to="/ask">
                <Button size="lg" className="bg-white text-stackit-600 hover:bg-gray-100 shadow-stackit hover:shadow-stackit-hover transform hover:scale-105 transition-all duration-200">
                  Ask a Question
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="bg-white text-stackit-600 hover:bg-gray-100 shadow-stackit hover:shadow-stackit-hover transform hover:scale-105 transition-all duration-200">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-stackit-600 shadow-stackit hover:shadow-stackit-hover transform hover:scale-105 transition-all duration-200">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="card-stackit animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="pt-6">
              <div className={`inline-flex p-3 rounded-full mb-4 ${stat.bgColor} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">{stat.value}</h3>
              <p className="text-gray-600">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Questions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Questions</h2>
            <Link to="/questions">
              <Button variant="ghost" className="flex items-center gap-2 nav-link">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {questionsLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Loading questions...</p>
              </div>
            ) : questionsError ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Unable to load questions. Please try again later.</p>
              </div>
            ) : recentQuestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No questions available yet.</p>
              </div>
            ) : (
              recentQuestions.map((question: any, index: number) => (
                <Card key={question._id} className="card-stackit animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link 
                          to={`/questions/${question._id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-stackit-600 transition-colors duration-200"
                        >
                          {question.title}
                        </Link>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(question.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {question.answers?.length || 0} answers
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {question.votes || 0} votes
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {question.tags?.map((tag: string) => (
                            <span
                              key={tag}
                              className="tag-stackit"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {/* Answers Preview */}
                        <div className="mt-4">
                          {(() => {
                            const rawAnswers = answersQueries[recentQuestions.findIndex((q: any) => q._id === question._id)]?.data;
                            const answers: Answer[] = Array.isArray(rawAnswers) ? rawAnswers : [];
                            if (answers.length === 0) return null;
                            return (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <MessageSquare className="h-4 w-4" />
                                    {answers.length} Answer{answers.length !== 1 ? 's' : ''}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1 text-xs"
                                    onClick={() => handleViewAnswers(question)}
                                  >
                                    <Eye className="h-3 w-3" />
                                    View All
                                  </Button>
                                </div>
                                {answers.slice(0, 1).map((answer: Answer) => (
                                  <div key={answer._id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    {/* Avatar with fallback to initials */}
                                    {answer.author?.avatar ? (
                                      <img
                                        src={answer.author.avatar}
                                        alt={answer.author.username || 'User'}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                      />
                                    ) : (
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${getAvatarColor(answer.author?.username || 'Anonymous')}`}>
                                        {getInitials(answer.author?.username || 'A')}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-gray-900">
                                          {answer.author?.username || 'Anonymous'}
                                        </span>
                                        {answer.createdAt && (
                                          <span className="text-xs text-gray-500">
                                            {formatDate(answer.createdAt)}
                                          </span>
                                        )}
                                      </div>
                                      {/* Show images if present */}
                                      {Array.isArray(answer.images) && answer.images.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {answer.images.slice(0, 2).map((img, idx) => (
                                            <div key={img.url || idx} className="max-w-[100px] max-h-[100px] overflow-hidden rounded border">
                                              <img
                                                src={img.url}
                                                alt={img.caption || `Answer image ${idx + 1}`}
                                                className="object-contain w-full h-full"
                                              />
                                              {img.caption && (
                                                <div className="text-[10px] text-gray-500 text-center px-1 truncate">{img.caption}</div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: answer.body }} />
                                    </div>
                                  </div>
                                ))}
                                {answers.length > 1 && (
                                  <div className="text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-800"
                                      onClick={() => handleViewAnswers(question)}
                                    >
                                      View All Answers
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Tags */}
          <Card className="card-stackit animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-stackit-600" />
                Popular Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tagsLoading ? (
                  <div className="text-sm text-gray-500">Loading tags...</div>
                ) : tagsError ? (
                  <div className="text-sm text-gray-500">Unable to load tags</div>
                ) : tags.length === 0 ? (
                  <div className="text-sm text-gray-500">No tags available</div>
                ) : (
                  tags.slice(0, 10).map((tag: any) => (
                    <Link
                      key={tag._id}
                      to={`/questions?tag=${tag.name}`}
                      className="tag-stackit hover:tag-stackit-selected"
                    >
                      {tag.name}
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-stackit animate-fade-in">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAuthenticated ? (
                <>
                  <Link to="/ask" className="block">
                    <Button className="w-full justify-start btn-stackit">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ask a Question
                    </Button>
                  </Link>
                  <Link to="/questions" className="block">
                    <Button variant="outline" className="w-full justify-start btn-stackit-outline">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Browse Questions
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="block">
                    <Button className="w-full justify-start btn-stackit">
                      <Users className="h-4 w-4 mr-2" />
                      Join StackIt
                    </Button>
                  </Link>
                  <Link to="/login" className="block">
                    <Button variant="outline" className="w-full justify-start btn-stackit-outline">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="card-stackit animate-fade-in">
            <CardHeader>
              <CardTitle>Why StackIt?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Rich Text Editor</h4>
                  <p className="text-sm text-gray-600">Format your questions and answers with our powerful editor</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-stackit-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Community Driven</h4>
                  <p className="text-sm text-gray-600">Learn from and help others in the community</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Voting System</h4>
                  <p className="text-sm text-gray-600">Vote on questions and answers to highlight the best content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Answers Modal */}
      {showAnswersModal && viewingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Answers</h2>
                <p className="text-sm text-gray-600 mt-1">"{viewingQuestion.title}"</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCloseAnswersModal}
                className="hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {viewingAnswers.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No answers yet</h3>
                  <p className="text-gray-600 mb-4">Be the first to answer this question!</p>
                  {isAuthenticated && (
                    <Link to={`/questions/${viewingQuestion._id}`}>
                      <Button>Answer This Question</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {viewingAnswers.map((answer: Answer) => (
                    <div key={answer._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                      {/* Answer Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar with fallback to initials */}
                          {answer.author?.avatar ? (
                            <img
                              src={answer.author.avatar}
                              alt={answer.author.username || 'User'}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-base shadow-sm ${getAvatarColor(answer.author?.username || 'Anonymous')}`}>
                              {getInitials(answer.author?.username || 'A')}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {answer.author?.username || 'Anonymous'}
                            </div>
                            {answer.createdAt && (
                              <div className="text-sm text-gray-500">
                                {formatDate(answer.createdAt)}
                              </div>
                            )}
                          </div>
                        </div>                        
                      </div>
                      
                      {/* Answer Content */}
                      <div className="prose prose-sm max-w-none text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: answer.body }} />
                      
                      {/* Images if present */}
                      {Array.isArray(answer.images) && answer.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          {answer.images.map((img, idx) => (
                            <div key={img.url || idx} className="aspect-square overflow-hidden rounded-lg border">
                              <img
                                src={img.url}
                                alt={img.caption || `Answer image ${idx + 1}`}
                                className="object-cover w-full h-full"
                              />
                              {img.caption && (
                                <div className="text-xs text-gray-500 text-center px-2 py-1 bg-white bg-opacity-90 absolute bottom-0 left-0 right-0">
                                  {img.caption}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 