import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, firestore } from "./firebase";
<<<<<<< HEAD
import { doc, getDoc, onAuthStateChanged } from "firebase/firestore"; // Modern Firebase imports
=======
import { doc, getDoc } from "firebase/firestore";  // ✅ Ensure correct Firestore imports
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17

import Home from "./pages/Home";
import About from "./pages/About";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
<<<<<<< HEAD
import Stories from "./pages/Stories";
import AdminDashboard from "./pages/AdminDashboard";
import MentorshipSignup from "./pages/MentorshipSignup";
import MentorshipSettings from "./pages/MentorshipSettings";
import Resources from "./pages/Resources";
import Navbar from "./components/layout/Navbar"; 
=======
import AdminDashboard from "./pages/AdminDashboard";
import MentorshipSignup from "./pages/MentorshipSignup";
import MentorshipSettings from "./pages/MentorshipSettings";
import Navbar from "./components/layout/Navbar"; // ✅ Ensures Navbar is always available
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          const userRef = doc(firestore, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {  // ✅ Corrected `exists()` usage
            setRole(userSnap.data().role);
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Navbar /> {/* ✅ Ensures navigation is always visible */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
<<<<<<< HEAD
        <Route path="/stories" element={<Stories />} /> {/* Public route, accessible to all users */}
        <Route path="/resources" element={<Resources />} />
=======
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profile/:id" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/events" element={user ? <Events /> : <Navigate to="/login" />} />

        {/* Secure Admin Dashboard */}
        {role === "admin" && <Route path="/admin" element={<AdminDashboard />} />}

        {/* Mentorship Program Routes */}
        <Route path="/mentorship-signup" element={user ? <MentorshipSignup /> : <Navigate to="/login" />} />
        <Route path="/mentorship-settings" element={user ? <MentorshipSettings /> : <Navigate to="/login" />} />

        {/* Redirect all unknown routes to Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
