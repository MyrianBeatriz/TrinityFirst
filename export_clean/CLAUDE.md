# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands
- Frontend: `npm start` - Run React development server
- Frontend: `npm test` - Run React tests (add `-- --testNamePattern="<pattern>"` for single test)
- Frontend: `npm build` - Build production React app
- Backend: `cd backend && python server01.py` - Run Flask backend server
- Linting: React app uses default create-react-app ESLint config

## Code Style Guidelines
- **React Components**: Use functional components with hooks
- **Imports**: Order - React/libraries, local components, styles
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Firebase**: Use auth, firestore, storage from firebase.js
- **Styling**: Use inline styles objects or CSS files
- **Error Handling**: Use try/catch with console.error
- **Backend**: Follow PEP 8 for Python, use appropriate error responses
- **Security**: Never expose Firebase credentials in frontend code