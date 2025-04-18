# Trinity FIRST - Student Mentorship Platform

A web application designed to connect and support first-generation college students through mentorship, resources, and community building.

## Features

- User authentication and profiles
- AI-powered mentorship matching program
- Resource hub for first-generation students
- Event calendar and notifications
- Community forum/stories section
- Admin dashboard for program management
- Mentor/mentee dashboards with match tracking

## Technology Stack

- **Frontend**: React, Material UI
- **Backend**: Flask (Python)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **AI**: Google Gemini 1.5 Pro for mentorship matching

## Security Improvements

The following security improvements have been implemented to address security concerns before sharing first demo:

### Frontend Security

1. **Environment Variables**
   - Removed hardcoded Firebase credentials from `firebase.js`
   - Added centralized API URL configuration in `.env.example`

2. **Input Validation**
   - Added client-side validation for file uploads (type, size)
   - Added sanitization for user IDs and other inputs
   - Added response validation to prevent XSS

3. **User Authentication**
   - Enhanced user profile creation with data sanitization
   - Added security logging for user actions 
   - Implemented safer data handling practices

### Backend Security

1. **API Protection**
   - Added rate limiting to prevent abuse
   - Implemented CSRF protection
   - Added request validation and sanitization
   - Enhanced error logging and handling

2. **File Handling**
   - Added support for file encryption
   - Improved file upload validation
   - Implemented secure file storage practices
   - Added path traversal protection

3. **AI Integration**
   - Added validation for AI-generated content
   - Implemented HTML/script tag sanitization
   - Added input and output validation for AI requests

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- Firebase account with Firestore and Authentication enabled
- Google AI API key (for Gemini access)

### Environment Setup

1. Clone the repository
2. Set up Firebase service account:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Generate a new private key (JSON file)
   - Save this file securely OUTSIDE of the project directory
   - Never commit this file to version control

3. Copy `.env.example` to `.env` and fill in your configuration values:
   ```
   # Firebase Configuration - from Firebase Console > Project Settings > Web Apps
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
   REACT_APP_API_URL=http://localhost:5002

   # Backend Configuration
   GEMINI_API_KEY=your-gemini-api-key
   # Point to the Firebase service account key file OUTSIDE the repository
   FIREBASE_CREDENTIALS_PATH=/secure/path/outside/repo/your-service-account.json
   GEMINI_MODEL=gemini-1.5-pro-latest
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

   # Security Configuration
   ENABLE_CSRF_PROTECTION=true
   ENABLE_RATE_LIMITING=true
   SESSION_SECRET=use-a-strong-random-string-at-least-32-chars
   ```
   
4. Ensure that `.env` is in your `.gitignore` file (it should be by default)

5. Install frontend dependencies:
   ```
   npm install
   ```

6. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the React frontend:
   ```
   npm start
   ```

2. Start the Flask backend (in a separate terminal):
   ```
   cd backend
   python server01.py
   ```

3. Access the application at http://localhost:3000


## License

[MIT License](LICENSE)
