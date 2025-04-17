import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Firebase configuration for Trinity First project
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only once
let firebaseApp;
if (!firebase.apps.length) {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} else {
  firebaseApp = firebase.app();
}

// Export Firebase services - only after initialization
const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();

// Export the initialized services
export { auth, firestore, storage };

// Add some helper functions with improved security
export const createUserProfile = async (userAuth, additionalData) => {
  if (!userAuth) return;

  const userRef = firestore.doc(`users/${userAuth.uid}`);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    // Sanitize data before storing
    const sanitizedData = {};
    
    // Only extract safe fields from additionalData
    const allowedFields = ['displayName', 'firstName', 'lastName', 'major', 'year', 'bio', 'photoURL'];
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        if (allowedFields.includes(key)) {
          // Sanitize string values to prevent XSS
          if (typeof additionalData[key] === 'string') {
            // Simple HTML tag removal
            sanitizedData[key] = additionalData[key].replace(/<[^>]*>/g, '');
          } else {
            sanitizedData[key] = additionalData[key];
          }
        }
      });
    }
    
    // Extract safe fields from userAuth
    const { email } = userAuth;
    const createdAt = new Date();
    
    try {
      // Store minimal user data
      await userRef.set({
        email,
        createdAt,
        lastLogin: firestore.FieldValue.serverTimestamp(),
        ...sanitizedData
      });
      
      // Add audit log in separate collection for security tracking
      await firestore.collection('security_logs').add({
        event: 'user_created',
        userId: userAuth.uid,
        timestamp: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating user', error.message);
    }
  } else {
    // Update last login time
    await userRef.update({
      lastLogin: firestore.FieldValue.serverTimestamp()
    });
  }

  return userRef;
};

export default firebase;