import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { questionsAPI, tagsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import LoginSignupModal from '../components/LoginSignupModal';
import { 
  Search, 
  MessageSquare, 
  Clock, 
  Tag, 
  TrendingUp, 
  CheckCircle,
  Plus,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import RichTextEditor from '../components/RichTextEditor';
import { answersAPI } from '../lib/api';
import toast from 'react-hot-toast';

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

const Questions: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [votingQuestionId, setVotingQuestionId] = useState<string | null>(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [viewingQuestion, setViewingQuestion] = useState<any>(null);
  const [viewingAnswers, setViewingAnswers] = useState<Answer[]>([]);

  // Calculate vote counts
  const getVoteCount = (upvotes: string[] = [], downvotes: string[] = []) => {
    return upvotes.length - downvotes.length;
  };

  // Check if user has voted
  const hasUserVoted = (upvotes: string[] = [], downvotes: string[] = [], voteType: 'upvote' | 'downvote') => {
    if (!user?._id) return false;
    const voteArray = voteType === 'upvote' ? upvotes : downvotes;
    return voteArray.includes(user._id);
  };

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

  // Fetch questions
  const { data: questionsData, isLoading, error } = useQuery({
    queryKey: ['questions', { searchQuery, selectedTag, sortBy, currentPage }],
    queryFn: () => questionsAPI.getAll({
      page: currentPage,
      limit: 10,
      search: searchQuery,
      sort: sortBy,
      tag: selectedTag || undefined,
    }).then(res => res.data),
  });

  const questions = questionsData?.questions || [];
  const totalPages = questionsData?.pagination?.totalPages || 1;

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsAPI.getAll({ sort: 'count', limit: 15 }).then(res => res.data),
  });
  const tags = tagsData?.tags || [];

  // Fetch answers for all questions in view
  const answersQueries = useQueries({
    queries: questions.map((q: any) => ({
      queryKey: ['answers', q._id],
      queryFn: () => answersAPI.getByQuestion(q._id).then(res => res.data?.answers || []),
      enabled: !!q._id,
    })),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? '' : tag);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  // Voting mutation
  const voteQuestionMutation = useMutation({
    mutationFn: ({ questionId, voteType }: { questionId: string; voteType: 'upvote' | 'downvote' }) =>
      questionsAPI.vote(questionId, voteType),
    onMutate: async ({ questionId, voteType }) => {
      await queryClient.cancelQueries({ queryKey: ['questions'] });
      const previousData = queryClient.getQueryData(['questions', { searchQuery, selectedTag, sortBy, currentPage }]);
      queryClient.setQueryData(['questions', { searchQuery, selectedTag, sortBy, currentPage }], (old: any) => {
        if (!old || !user || !user._id) return old;
        return {
          ...old,
          questions: old.questions.map((q: any) => {
            if (q._id !== questionId) return q;
            // Optimistically update votes
            let upvotes = Array.isArray(q.upvotes) ? [...q.upvotes] : [];
            let downvotes = Array.isArray(q.downvotes) ? [...q.downvotes] : [];
            if (voteType === 'upvote') {
              if (upvotes.includes(user._id)) {
                upvotes = upvotes.filter((id: string) => id !== user._id);
              } else {
                upvotes.push(user._id);
                downvotes = downvotes.filter((id: string) => id !== user._id);
              }
            } else {
              if (downvotes.includes(user._id)) {
                downvotes = downvotes.filter((id: string) => id !== user._id);
              } else {
                downvotes.push(user._id);
                upvotes = upvotes.filter((id: string) => id !== user._id);
              }
            }
            return { ...q, upvotes, downvotes };
          })
        };
      });
      return { previousData };
    },
    onError: (
      // @ts-ignore
      err, variables, context
    ) => {
      if (context?.previousData) {
        queryClient.setQueryData(['questions', { searchQuery, selectedTag, sortBy, currentPage }], context.previousData);
      }
      setVotingQuestionId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setVotingQuestionId(null);
      
    },
  });

  const handleVoteQuestion = (question: any, voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (user?.role === 'guest') {
      setShowLoginModal(true);
      return;
    }
    setVotingQuestionId(question._id);
    voteQuestionMutation.mutate({ questionId: question._id, voteType });
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    queryClient.invalidateQueries({ queryKey: ['questions'] });
  };

  const handleOpenAnswerModal = (questionId: string) => {
    setAnsweringQuestionId(questionId);
    setShowAnswerModal(true);
    setAnswerContent('');
  };

  const handleCloseAnswerModal = () => {
    setShowAnswerModal(false);
    setAnsweringQuestionId(null);
    setAnswerContent('');
  };

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) {
      toast.error('Please write your answer.');
      return;
    }
    setIsSubmittingAnswer(true);
    try {
      await answersAPI.create(answeringQuestionId!, { body: answerContent });
      toast.success('Answer posted!');
      handleCloseAnswerModal();
      // Optionally, refresh questions or answers list here
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post answer.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleViewAnswers = (question: any) => {
    const rawAnswers = answersQueries[questions.findIndex((q: any) => q._id === question._id)]?.data;
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <LoginSignupModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600 mt-2">Find answers to your questions or help others</p>
        </div>
        {isAuthenticated && (
          <Link to="/ask">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ask Question
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit">Search</Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="most_voted">Most Votes</option>
                  <option value="most_answered">Most Answers</option>
                </select>
              </div>

              {/* Tag Filter */}
              {selectedTag && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTag('')}
                  className="flex items-center gap-1"
                >
                  <Tag className="h-3 w-3" />
                  {selectedTag}
                  <span className="ml-1">×</span>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Popular Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(tags) && tags.slice(0, 15).map((tag: any) => (
              <button
                key={tag._id}
                onClick={() => handleTagClick(tag.name)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag.name
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Tag Filter */}
      {selectedTag && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-2">
            <Tag className="h-3 w-3 mr-1" />
            {selectedTag}
            <button
              type="button"
              onClick={() => setSelectedTag('')}
              className="ml-2 text-blue-600 hover:text-blue-800"
              aria-label="Clear tag filter"
            >
              ×
            </button>
          </span>
          <span className="text-gray-500">Showing results for this tag</span>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading questions...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading questions</h3>
              <p className="text-gray-600 mb-4">
                {error?.message || 'Failed to load questions. Please try again.'}
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedTag 
                  ? 'Try adjusting your search criteria or browse all questions.'
                  : 'Be the first to ask a question!'
                }
              </p>
              {isAuthenticated && (
                <Link to="/ask">
                  <Button>Ask a Question</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          questions.map((question: any) => {
            const voteCount = getVoteCount(question.upvotes, question.downvotes);
            return (
              <Card key={question._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Reddit-style Vote Controls */}
                    <div className="flex flex-col items-center gap-1 min-w-[60px]">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`p-1 rounded-full ${hasUserVoted(question.upvotes, question.downvotes, 'upvote') ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        aria-label="Upvote"
                        disabled={votingQuestionId === question._id}
                        onClick={() => handleVoteQuestion(question, 'upvote')}
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                      <span className="text-lg font-semibold my-1 select-none">{voteCount}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`p-1 rounded-full ${hasUserVoted(question.upvotes, question.downvotes, 'downvote') ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        aria-label="Downvote"
                        disabled={
                          votingQuestionId === question._id ||
                          question.author?._id === user?._id ||
                          (voteCount <= 0 && !hasUserVoted(question.upvotes, question.downvotes, 'downvote'))
                        }
                        onClick={() => handleVoteQuestion(question, 'downvote')}
                      >
                        <ArrowDown className="h-5 w-5" />
                      </Button>
                      {question.acceptedAnswer && (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-2" />
                      )}
                    </div>

                    {/* Question Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Link 
                          to={`/questions/${question._id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {question.title}
                        </Link>
                        {isAuthenticated && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-4"
                            onClick={() => handleOpenAnswerModal(question._id)}
                          >
                            Answer
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 text-gray-600 line-clamp-2">
                        {question.description.replace(/<[^>]*>/g, '').substring(0, 200)}
                        {question.description.length > 200 && '...'}
                      </div>
                      <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {/* Use live answer count from answersQueries if available */}
                          {(() => {
                            const idx = questions.findIndex((qq: any) => qq._id === question._id);
                            const liveAnswers = answersQueries[idx]?.data;
                            return Array.isArray(liveAnswers) ? liveAnswers.length : (question.answers?.length || 0);
                          })()} answers
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(question.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {voteCount} votes
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {question.tags?.map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Answers Preview - now in its own div below the question content */}
                  <div className="mt-4">
                    {(() => {
                      const rawAnswers = answersQueries[questions.findIndex((qq: any) => qq._id === question._id)]?.data;
                      const answers: Answer[] = Array.isArray(rawAnswers) ? rawAnswers : [];
                      if (answers.length === 0) return null;
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {answers.length} Answer{answers.length !== 1 ? 's' : ''}
                            </span>
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
                                <div className="flex items-center gap-2 mb-1">
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
                            <div className="text-center mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 font-semibold"
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
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {showAnswerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Write Your Answer</h2>
              <Button variant="ghost" size="sm" onClick={handleCloseAnswerModal}>×</Button>
            </div>
            <div className="p-4 space-y-4">
              <RichTextEditor
                value={answerContent}
                onChange={setAnswerContent}
                placeholder="Write your answer here..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseAnswerModal}>Cancel</Button>
                <Button onClick={handleSubmitAnswer} disabled={isSubmittingAnswer}>
                  {isSubmittingAnswer ? 'Posting...' : 'Post Answer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                     <Button onClick={() => {
                       handleCloseAnswersModal();
                       handleOpenAnswerModal(viewingQuestion._id);
                     }}>
                       Answer This Question
                     </Button>
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
                         
                         {/* Vote count if available */}
                         {answer.upvotes && answer.downvotes && (
                           <div className="flex items-center gap-1 text-sm text-gray-500">
                             <TrendingUp className="h-4 w-4" />
                             {getVoteCount(answer.upvotes, answer.downvotes)} votes
                           </div>
                         )}
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

export default Questions; 