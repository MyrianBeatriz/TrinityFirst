import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC5xYdgv_429ez87XjUDSJEBSJPtd-UYwE",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "trinity-first-13999.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "trinity-first-13999",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "trinity-first-13999.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "924160147196",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:924160147196:web:fe6d4012838ff62831e179",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-4X8Y84411E"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage();

// Add some helper functions
export const createUserProfile = async (userAuth, additionalData) => {
  if (!userAuth) return;

  const userRef = firestore.doc(`users/${userAuth.uid}`);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const { email } = userAuth;
    const createdAt = new Date();

    try {
      await userRef.set({
        email,
        createdAt,
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user', error.message);
    }
  }

  return userRef;
};

export default firebase;
