import React, { useState } from 'react';
import { auth, firestore } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    classYear: '',
    major: '',
    bio: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const styles = {
    container: {
      maxWidth: '600px',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
    },
    title: {
      color: '#1a365d',
      fontSize: '2rem',
      marginBottom: '1rem',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    label: {
      color: '#1a365d',
      fontWeight: '500',
    },
    input: {
      padding: '0.75rem',
      borderRadius: '6px',
      border: '1px solid #cbd5e0',
      fontSize: '1rem',
    },
    button: {
      backgroundColor: '#1a365d',
      color: 'white',
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '6px',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    },
    error: {
      color: 'red',
      textAlign: 'center',
      marginBottom: '1rem',
      padding: '0.75rem',
      backgroundColor: '#FEE2E2',
      borderRadius: '6px',
      fontSize: '0.9rem',
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    console.log("Starting registration process...");
    console.log("Firebase Auth initialized:", auth !== undefined);

    try {
      console.log("Attempting to create user with email:", formData.email);
      // Create user in Firebase Authentication
      const { user } = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
      console.log("User created successfully in Authentication:", user.uid);

      // Prepare user data for Firestore
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        classYear: formData.classYear,
        major: formData.major,
        bio: formData.bio,
        role: "user", // ✅ Default user role
        createdAt: new Date().toISOString()
      };
      
      console.log("Saving user data to Firestore:", userData);
      
      // Save user details in Firestore
      await firestore.collection("users").doc(user.uid).set(userData);
      console.log("User data saved successfully to Firestore");

      alert("Registration successful! Redirecting to login page...");
      navigate("/login");
    } catch (err) {
      console.error("Error during registration:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      
      // Show a more specific error message based on the error code
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please use a different email or try logging in.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please use a stronger password.");
      } else if (err.code === 'auth/invalid-api-key') {
        setError("Authentication error: Invalid API key. Please contact support.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(`Registration failed: ${err.message}`);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Join Trinity First</h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>First Name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Last Name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Class Year</label>
          <input
            type="text"
            value={formData.classYear}
            onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Major (or Intended)</label>
          <input
            type="text"
            value={formData.major}
            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>

          <label style={styles.label}>Trinity Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Confirm Password</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            style={styles.input}
            required
          />
        </div>
        <button type="submit" style={styles.button}>
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;