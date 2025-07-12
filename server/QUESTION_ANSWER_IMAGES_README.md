# Question & Answer Image Upload System

This document describes the image upload functionality for questions and answers in the StackIt Q&A platform.

## Overview

Users can now upload images when creating questions and answers, making it easier to share code screenshots, diagrams, error messages, and other visual content.

## Features

- ✅ Upload up to 5 images per question/answer
- ✅ Image captions for better context
- ✅ Automatic image optimization (WebP format)
- ✅ 10MB file size limit per image
- ✅ Organized Cloudinary folder structure
- ✅ JWT authentication required
- ✅ Comprehensive error handling
- ✅ Images included in all question/answer responses

## Database Schema Updates

### Question Schema

```javascript
{
  // ... existing fields
  images: [
    {
      url: String, // Cloudinary secure URL
      publicId: String, // Cloudinary public ID
      caption: String, // Optional caption
    },
  ];
}
```

### Answer Schema

```javascript
{
  // ... existing fields
  images: [
    {
      url: String, // Cloudinary secure URL
      publicId: String, // Cloudinary public ID
      caption: String, // Optional caption
    },
  ];
}
```

## API Endpoints

### 1. Create Question with Images

- **URL**: `POST /api/questions/create-with-images`
- **Authentication**: Bearer token required
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `title` (string): Question title (10-200 chars)
  - `description` (string): Question description (min 20 chars)
  - `tags` (string): Comma-separated tags
  - `images` (files): Optional image files (max 5)
  - `imageCaptions` (string): Comma-separated captions

**Example Request**:

```bash
curl -X POST http://localhost:3000/api/questions/create-with-images \
  -H "Authorization: Bearer your_jwt_token" \
  -F "title=How to fix this React error?" \
  -F "description=I'm getting this error when trying to render my component..." \
  -F "tags=react,error,debugging" \
  -F "images=@screenshot1.png" \
  -F "images=@screenshot2.png" \
  -F "imageCaptions=Error screenshot,Code snippet"
```

**Response**:

```json
{
  "success": true,
  "message": "Question created successfully!",
  "question": {
    "_id": "question_id",
    "title": "How to fix this React error?",
    "description": "I'm getting this error when trying to render my component...",
    "images": [
      {
        "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/fire-shark/question/question_id/question_img_1234567890.webp",
        "publicId": "fire-shark/question/question_id/question_img_1234567890",
        "caption": "Error screenshot"
      },
      {
        "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/fire-shark/question/question_id/question_img_1234567891.webp",
        "publicId": "fire-shark/question/question_id/question_img_1234567891",
        "caption": "Code snippet"
      }
    ],
    "tags": ["react", "error", "debugging"],
    "author": {
      "_id": "user_id",
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "avatar": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/fire-shark/avatar/user_id/avatar_1234567890.webp"
    },
    "answers": [],
    "acceptedAnswer": null,
    "upvotes": [],
    "downvotes": [],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 2. Create Answer with Images

- **URL**: `POST /api/answers/create-with-images`
- **Authentication**: Bearer token required
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `body` (string): Answer content (min 10 chars)
  - `questionId` (string): Question ID
  - `images` (files): Optional image files (max 5)
  - `imageCaptions` (string): Comma-separated captions

**Example Request**:

```bash
curl -X POST http://localhost:3000/api/answers/create-with-images \
  -H "Authorization: Bearer your_jwt_token" \
  -F "body=Here's how to fix this issue..." \
  -F "questionId=question_id" \
  -F "images=@solution.png" \
  -F "imageCaptions=Working solution"
```

**Response**:

```json
{
  "success": true,
  "message": "Answer created successfully!",
  "answer": {
    "_id": "answer_id",
    "body": "Here's how to fix this issue...",
    "images": [
      {
        "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/fire-shark/answer/answer_id/answer_img_1234567890.webp",
        "publicId": "fire-shark/answer/answer_id/answer_img_1234567890",
        "caption": "Working solution"
      }
    ],
    "author": {
      "_id": "user_id",
      "first_name": "Jane",
      "last_name": "Smith",
      "username": "janesmith",
      "avatar": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/fire-shark/avatar/user_id/avatar_1234567890.webp"
    },
    "question": "question_id",
    "upvotes": [],
    "downvotes": [],
    "isAccepted": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

## File Structure in Cloudinary

```
fire-shark/
├── avatar/
│   └── {userId}/
│       └── avatar_1234567890.webp
├── question/
│   └── {questionId}/
│       ├── question_img_1234567890.webp
│       └── question_img_1234567891.webp
└── answer/
    └── {answerId}/
        ├── answer_img_1234567890.webp
        └── answer_img_1234567891.webp
```

## Image Processing

### Transformations Applied

1. **Format**: Convert to WebP for better compression
2. **Quality**: Auto-optimized
3. **No resizing**: Maintains original dimensions for better detail

### Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## Updated Response Formats

### Questions with Images

All question endpoints now include the `images` field:

```json
{
  "_id": "question_id",
  "title": "Question title",
  "description": "Question description",
  "images": [
    {
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/fire-shark/question/question_id/question_img_1234567890.webp",
      "publicId": "fire-shark/question/question_id/question_img_1234567890",
      "caption": "Image caption"
    }
  ],
  "tags": ["tag1", "tag2"],
  "author": {
    /* author object */
  },
  "answers": [],
  "acceptedAnswer": null,
  "upvotes": [],
  "downvotes": [],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Answers with Images

All answer endpoints now include the `images` field:

```json
{
  "_id": "answer_id",
  "body": "Answer content",
  "images": [
    {
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/fire-shark/answer/answer_id/answer_img_1234567890.webp",
      "publicId": "fire-shark/answer/answer_id/answer_img_1234567890",
      "caption": "Image caption"
    }
  ],
  "author": {
    /* author object */
  },
  "question": "question_id",
  "upvotes": [],
  "downvotes": [],
  "isAccepted": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

## Frontend Integration

### Example with Fetch API

```javascript
// Create question with images
const createQuestionWithImages = async (
  questionData,
  images,
  captions,
  token
) => {
  const formData = new FormData();
  formData.append('title', questionData.title);
  formData.append('description', questionData.description);
  formData.append('tags', questionData.tags.join(','));

  if (images.length > 0) {
    images.forEach((image, index) => {
      formData.append('images', image);
    });
  }

  if (captions.length > 0) {
    formData.append('imageCaptions', captions.join(','));
  }

  const response = await fetch('/api/questions/create-with-images', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};

// Create answer with images
const createAnswerWithImages = async (answerData, images, captions, token) => {
  const formData = new FormData();
  formData.append('body', answerData.body);
  formData.append('questionId', answerData.questionId);

  if (images.length > 0) {
    images.forEach((image, index) => {
      formData.append('images', image);
    });
  }

  if (captions.length > 0) {
    formData.append('imageCaptions', captions.join(','));
  }

  const response = await fetch('/api/answers/create-with-images', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};
```

### Example with Axios

```javascript
// Create question with images
const createQuestionWithImages = async (
  questionData,
  images,
  captions,
  token
) => {
  const formData = new FormData();
  formData.append('title', questionData.title);
  formData.append('description', questionData.description);
  formData.append('tags', questionData.tags.join(','));

  if (images.length > 0) {
    images.forEach((image, index) => {
      formData.append('images', image);
    });
  }

  if (captions.length > 0) {
    formData.append('imageCaptions', captions.join(','));
  }

  const response = await axios.post(
    '/api/questions/create-with-images',
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

// Create answer with images
const createAnswerWithImages = async (answerData, images, captions, token) => {
  const formData = new FormData();
  formData.append('body', answerData.body);
  formData.append('questionId', answerData.questionId);

  if (images.length > 0) {
    images.forEach((image, index) => {
      formData.append('images', image);
    });
  }

  if (captions.length > 0) {
    formData.append('imageCaptions', captions.join(','));
  }

  const response = await axios.post(
    '/api/answers/create-with-images',
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};
```

## Error Handling

### Common Error Responses

**Invalid File Type**:

```json
{
  "success": false,
  "message": "Only image files are allowed"
}
```

**File Too Large**:

```json
{
  "success": false,
  "message": "File too large. Maximum size is 10MB"
}
```

**Too Many Images**:

```json
{
  "success": false,
  "message": "Too many files. Maximum 5 images allowed"
}
```

**Validation Error**:

```json
{
  "success": false,
  "message": "Title must be at least 10 characters long",
  "field": "title"
}
```

## Security Considerations

1. **Authentication**: All image upload operations require valid JWT tokens
2. **File Validation**: Only image files are accepted
3. **File Size Limit**: 10MB maximum per image
4. **User Isolation**: Users can only upload images to their own content
5. **Cloudinary Security**: Uses secure URLs and proper folder structure

## Testing

### Test with Postman

1. **Create Question with Images**:

   - Method: `POST`
   - URL: `http://localhost:3000/api/questions/create-with-images`
   - Headers: `Authorization: Bearer your_jwt_token`
   - Body: `form-data`
   - Fields:
     - `title`: "Test question with images"
     - `description`: "This is a test question with images"
     - `tags`: "test,images"
     - `images`: Select image files
     - `imageCaptions`: "Screenshot 1,Screenshot 2"

2. **Create Answer with Images**:
   - Method: `POST`
   - URL: `http://localhost:3000/api/answers/create-with-images`
   - Headers: `Authorization: Bearer your_jwt_token`
   - Body: `form-data`
   - Fields:
     - `body`: "This is a test answer with images"
     - `questionId`: "your_question_id"
     - `images`: Select image files
     - `imageCaptions`: "Solution screenshot"

## Files Modified/Created

- `models/question/question-schema.js` - Added images field
- `models/answer/answer-schema.js` - Added images field
- `lib/cloudinary.js` - Added question and answer image upload functions
- `lib/index.js` - Export new image functions
- `routes/questions/create-with-images.js` - New route for questions with images
- `routes/answers/create-with-images.js` - New route for answers with images
- `routes/questions/index.js` - Added new route
- `routes/answers/index.js` - Added new route
- `routes/questions/get-all.js` - Updated to include images
- `routes/questions/get-by-id.js` - Updated to include images
- `routes/answers/get-by-question.js` - Updated to include images
- `QUESTION_ANSWER_IMAGES_README.md` - This documentation

## Next Steps

1. **Configure Cloudinary**: Ensure your Cloudinary credentials are set in environment variables
2. **Test Upload**: Use Postman or similar tool to test image uploads
3. **Frontend Integration**: Implement image upload in your frontend application
4. **Image Preview**: Add image preview before upload
5. **Image Gallery**: Create a gallery view for multiple images
6. **Image Deletion**: Add functionality to delete individual images
7. **Image Editing**: Add image editing capabilities (crop, resize, etc.)

The question and answer image upload system is now ready to use! 🎉
