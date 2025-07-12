import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import RichTextEditor from '../components/RichTextEditor';
import LoginSignupModal from '../components/LoginSignupModal';
import { questionsAPI, answersAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  Clock, 
  Tag,
  CheckCircle,
  Edit,
  Trash2,
  User,
  Plus
} from 'lucide-react';

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Fetch question details
  const { data: question, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => questionsAPI.getById(id!).then(res => res.data),
    enabled: !!id,
  });

  // Fetch answers
  const { data: answersData } = useQuery({
    queryKey: ['answers', id],
    queryFn: () => answersAPI.getByQuestion(id!).then(res => res.data),
    enabled: !!id,
  });
  const answers = Array.isArray(answersData?.answers) ? answersData.answers : [];

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

  // Vote mutations
  const voteQuestionMutation = useMutation({
    mutationFn: ({ voteType }: { voteType: 'upvote' | 'downvote' }) =>
      questionsAPI.vote(id!, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question', id] });
      toast.success('Vote recorded!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to record vote';
      toast.error(message);
    },
  });

  const voteAnswerMutation = useMutation({
    mutationFn: ({ answerId, voteType }: { answerId: string; voteType: 'upvote' | 'downvote' }) =>
      answersAPI.vote(answerId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', id] });
      toast.success('Vote recorded!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to record vote';
      toast.error(message);
    },
  });

  // Answer mutations
  const createAnswerMutation = useMutation({
    mutationFn: (body: string) =>
      answersAPI.create(id!, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', id] });
      setAnswerContent('');
      setShowAnswerForm(false);
      toast.success('Answer posted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to post answer';
      toast.error(message);
    },
  });

  const acceptAnswerMutation = useMutation({
    mutationFn: (answerId: string) => answersAPI.accept(answerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', id] });
      toast.success('Answer accepted!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to accept answer';
      toast.error(message);
    },
  });

  const handleVoteQuestion = (voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }
    if (user?.role === 'guest') {
      setShowLoginModal(true);
      return;
    }
    voteQuestionMutation.mutate({ voteType });
  };

  const handleVoteAnswer = (answerId: string, voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }
    if (user?.role === 'guest') {
      setShowLoginModal(true);
      return;
    }
    voteAnswerMutation.mutate({ answerId, voteType });
  };

  const handleSubmitAnswer = () => {
    if (!answerContent.trim()) {
      toast.error('Please enter an answer');
      return;
    }
    if (user?.role === 'guest') {
      setShowLoginModal(true);
      return;
    }
    createAnswerMutation.mutate(answerContent);
  };

  const handleLoginSuccess = () => {
    // Close modal and refresh the component state
    setShowLoginModal(false);
    // Refetch question and answers data
    window.location.reload();
  };

  const handleAcceptAnswer = (answerId: string) => {
    if (!isAuthenticated || question?.author?._id !== user?._id) {
      toast.error('Only the question owner can accept answers');
      return;
    }
    acceptAnswerMutation.mutate(answerId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday'; now
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading question...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">Question not found</h2>
        <p className="text-gray-600 mt-2">The question you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/questions')} className="mt-4">
          Browse Questions
        </Button>
      </div>
    );
  }

  const questionVoteCount = getVoteCount(question.upvotes, question.downvotes);

  return (
    <>
      <LoginSignupModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

      {/* Question */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Reddit-style Vote Controls */}
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVoteQuestion('upvote')}
                className={`p-1 rounded-full ${hasUserVoted(question.upvotes, question.downvotes, 'upvote') ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                disabled={voteQuestionMutation.isPending}
                aria-label="Upvote"
              >
                <ArrowUp className="h-6 w-6" />
              </Button>
              <span className="text-xl font-bold text-gray-900 my-1 select-none">
                {questionVoteCount}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVoteQuestion('downvote')}
                className={`p-1 rounded-full ${hasUserVoted(question.upvotes, question.downvotes, 'downvote') ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`}
                disabled={voteQuestionMutation.isPending}
                aria-label="Downvote"
              >
                <ArrowDown className="h-6 w-6" />
              </Button>
            </div>

            {/* Question Content */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{question.title}</h1>
              
              <div 
                className="prose prose-sm max-w-none mb-6"
                dangerouslySetInnerHTML={{ __html: question.description }}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(question.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {question.author?.username || 'Anonymous'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Answers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {answers.length} Answer{answers.length !== 1 ? 's' : ''}
          </h2>
          {isAuthenticated && (
            <Button
              onClick={() => setShowAnswerForm(!showAnswerForm)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {showAnswerForm ? 'Cancel' : 'Add Answer'}
            </Button>
          )}
        </div>

        {/* Answer Form */}
        {showAnswerForm && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Your Answer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                value={answerContent}
                onChange={setAnswerContent}
                placeholder="Write your answer here..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAnswerForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={createAnswerMutation.isPending}
                >
                  {createAnswerMutation.isPending ? 'Posting...' : 'Post Answer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answers List */}
        {answers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No answers yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first to answer this question!
              </p>
              {isAuthenticated && (
                <Button onClick={() => setShowAnswerForm(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Answer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          answers.map((answer: any) => {
            const answerVoteCount = getVoteCount(answer.upvotes, answer.downvotes);
            
            return (
              <Card key={answer._id} className={`border ${answer.isAccepted ? 'border-green-500 bg-green-50' : 'border-gray-200'} shadow-sm`}> 
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Reddit-style Vote Controls for Answers */}
                    <div className="flex flex-col items-center gap-1 min-w-[60px]">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVoteAnswer(answer._id, 'upvote')}
                        className={`p-1 rounded-full ${hasUserVoted(answer.upvotes, answer.downvotes, 'upvote') ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        disabled={voteAnswerMutation.isPending}
                        aria-label="Upvote"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                      <span className="text-lg font-semibold my-1 select-none">{answerVoteCount}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVoteAnswer(answer._id, 'downvote')}
                        className={`p-1 rounded-full ${hasUserVoted(answer.upvotes, answer.downvotes, 'downvote') ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        disabled={voteAnswerMutation.isPending}
                        aria-label="Downvote"
                      >
                        <ArrowDown className="h-5 w-5" />
                      </Button>
                      {answer.isAccepted && (
                        <CheckCircle className="h-6 w-6 text-green-600 mt-2" />
                      )}
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1">
                      <div 
                        className="prose prose-sm max-w-none mb-4"
                        dangerouslySetInnerHTML={{ __html: answer.body }}
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(answer.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {answer.author?.username || 'Anonymous'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {question.author?._id === user?._id && !answer.isAccepted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcceptAnswer(answer._id)}
                              disabled={acceptAnswerMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                          )}
                          {answer.author?._id === user?._id && (
                            <>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
    </>
  );
};

export default QuestionDetail; 