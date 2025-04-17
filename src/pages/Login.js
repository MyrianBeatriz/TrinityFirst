import React, { useState } from 'react';
import { auth, firestore } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const styles = {
    container: {
      maxWidth: '400px',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    heading: {
      fontSize: '2rem',
      color: '#1a365d',
      marginBottom: '1rem',
      textAlign: 'center',
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
    registerLink: {
      marginTop: '1rem',
      textAlign: 'center',
    },
    link: {
      color: '#1a365d',
      textDecoration: 'none',
      fontWeight: '500',
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log("Attempting login with email:", email);
    console.log("Firebase Auth initialized:", auth !== undefined);

    try {
      // Authenticate user
      console.log("Calling signInWithEmailAndPassword...");
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      console.log("Login successful, got user credential:", userCredential?.user?.uid);
      const user = userCredential.user;

      // Fetch user role from Firestore
      console.log("Fetching user data from Firestore...");
      const userRef = firestore.collection("users").doc(user.uid);
      const userSnap = await userRef.get();

      if (userSnap.exists) {
        const userData = userSnap.data();
        console.log("User data retrieved:", userData);
        console.log("Logged in user role:", userData.role);

        // Redirect based on role
        if (userData.role === "admin") {
          console.log("Redirecting to admin dashboard");
          navigate("/admin");  // ✅ Redirect to Admin Dashboard
        } else {
          console.log("Redirecting to user dashboard");
          navigate("/dashboard");  // ✅ Redirect to User Dashboard
        }
      } else {
        console.error("User document not found in Firestore.");
        setError("Error fetching user data. Please contact support.");
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      
      // Show a more specific error message based on the error code
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Login failed. Please check your email and password.");
      } else if (err.code === 'auth/invalid-api-key') {
        setError("Authentication error: Invalid API key. Please contact support.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(`Login failed: ${err.message}`);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Login</h1>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleLogin} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.button}>
          Login
        </button>
      </form>
      <div style={styles.registerLink}>
        Don't have an account?{' '}
        <a href="/register" style={styles.link}>
          Register
        </a>
      </div>
    </div>
  );
};

export default Login;