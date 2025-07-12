import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import RichTextEditor from '../components/RichTextEditor';
import { questionsAPI, tagsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Tag, X } from 'lucide-react';
import LoginSignupModal from '../components/LoginSignupModal';

const askQuestionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  tags: z.array(z.string()).min(1, 'At least one tag is required').max(5, 'Cannot exceed 5 tags'),
});

type AskQuestionFormData = z.infer<typeof askQuestionSchema>;

const AskQuestion: React.FC = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [description, setDescription] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Show login modal for guest users or redirect for non-authenticated users
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (user?.role === 'guest') {
    setShowLoginModal(true);
    return null;
  }

  // Fetch available tags
  const { data: availableTagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsAPI.getAll().then(res => res.data),
  });

  // @ts-ignore
  const availableTags = Array.isArray(availableTagsData?.tags) ? availableTagsData.tags : [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AskQuestionFormData>({
    resolver: zodResolver(askQuestionSchema),
    defaultValues: {
      tags: [],
    },
  });

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setValue('description', value);
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 5) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  const onSubmit = async (data: AskQuestionFormData) => {
    // Validate that description has content
    if (!description || description.trim().length < 20) {
      toast.error('Please provide a detailed description (at least 20 characters)');
      return;
    }

    // Validate that tags are selected
    if (selectedTags.length === 0) {
      toast.error('Please select at least one tag');
      return;
    }

    setIsLoading(true);
    try {
      // @ts-ignore
      const response = await questionsAPI.create({
        title: data.title,
        description: description, // Use the HTML content from rich text editor
        tags: selectedTags,
      });
      
      toast.success('Question posted successfully!');
      navigate('/questions'); // Redirect to questions list
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to post question. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    // Close modal and refresh the form state
    setShowLoginModal(false);
    // Reset form state
    setSelectedTags([]);
    setTagInput('');
    setDescription('');
    setValue('title', '');
    setValue('description', '');
  };

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ask a Question</h1>
            <p className="text-gray-600 mt-1">
              Share your knowledge and help others learn
            </p>
          </div>
        </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <Card>
          <CardHeader>
            <CardTitle>Question Title</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Be specific and imagine you're asking another person
              </label>
              <Input
                id="title"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
                placeholder="e.g., How do I implement authentication in React with JWT?"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Include all the information someone would need to answer your question
              </label>
              <RichTextEditor
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Describe your question in detail... Include code examples, error messages, and any relevant context. Use the formatting tools above to make your question clear and readable."
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Use the formatting tools above to add bold, italic, lists, links, and images to make your question clear and readable.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add up to 5 tags to describe what your question is about
              </label>
              <Input
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Type a tag and press Enter or comma..."
                className="mb-2"
              />
              <p className="text-xs text-gray-500">
                Press Enter or comma to add a tag
              </p>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Available Tags */}
            {/* Removed Popular Tags section to avoid duplicate display. Users can still add tags by typing. */}

            {errors.tags && (
              <p className="text-sm text-red-600">{errors.tags.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Posting Question...' : 'Post Question'}
          </Button>
        </div>
      </form>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Writing a good question</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">•</span>
              <span>Be specific about what you're trying to accomplish</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">•</span>
              <span>Describe what you've tried and what didn't work</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">•</span>
              <span>Include relevant code snippets and error messages</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">•</span>
              <span>Use clear, descriptive language</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">•</span>
              <span>Use the formatting tools to make your question readable</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default AskQuestion; 