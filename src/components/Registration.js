import React, { useState } from 'react';
import { auth, firestore } from '../firebase';

const Registration = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Create the user in Firebase Authentication
      const { user } = await auth.createUserWithEmailAndPassword(email, password);

      // Add the user's name to Firestore
      await firestore.collection('users').doc(user.uid).set({
        name,
        email
      });

      // Reset the form fields
      setEmail('');
      setPassword('');
      setName('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Register</h1>
      {error && <div className="bg-red-500 text-white p-4 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        {/* Registration form fields */}
      </form>
    </div>
  );
};

export default Registration;
