<<<<<<< HEAD
# Trinity FIRST - Student Mentorship Platform

A web application designed to connect and support first-generation college students through mentorship, resources, and community building.

## Features

- User authentication and profiles
- Mentorship matching program
- Resource hub for first-generation students
- Event calendar and notifications
- Community forum/stories section
- Admin dashboard for program management

## Technology Stack

- **Frontend**: React, Material UI
- **Backend**: Flask (Python)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **AI**: Google Gemini 1.5 Pro for mentorship matching

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- Firebase account with Firestore and Authentication enabled
- Google AI API key (for Gemini access)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your configuration values:
   ```
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id

   # Backend Configuration
   GEMINI_API_KEY=your-gemini-api-key
   FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
   GEMINI_MODEL=gemini-1.5-pro-latest
   ALLOWED_ORIGINS=http://localhost:3000,https://your-app.com
   ```

3. Install frontend dependencies:
   ```
   npm install
   ```

4. Install backend dependencies:
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

## Security Considerations

- Never commit `.env` files or any files containing API keys or credentials
- Use environment variables for all sensitive configuration
- Validate all user inputs on both client and server sides
- Implement proper CORS restrictions in production
- Set up Firebase security rules to restrict data access

## Contributing

Please follow these guidelines when contributing to the codebase:

1. Use functional components with hooks in React
2. Follow consistent error handling patterns
3. Validate all user inputs
4. Document new API endpoints
5. Write tests for critical functionality

## License

[MIT License](LICENSE)
=======
# TrinityFirst
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
