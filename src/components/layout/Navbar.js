import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";  //


const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/"); // Redirect to home after logout
  };

  return (
    <nav style={styles.navbar}>
      <ul style={styles.navList}>
        {!user ? (
          // Show these links when the user is NOT logged in
          <>
            <li><Link to="/" style={styles.link}>Home</Link></li>
            <li><Link to="/about" style={styles.link}>About</Link></li>
            <li><Link to="/stories" style={styles.link}>Stories</Link></li>
            <li><Link to="/register" style={styles.link}>Register</Link></li>
            <li><Link to="/login" style={styles.link}>Log In</Link></li>
          </>
        ) : (
          // Show these links when the user IS logged in
          <>
            <li><Link to="/dashboard" style={styles.link}>Dashboard</Link></li>
            <li><Link to="/events" style={styles.link}>Events</Link></li>
            <li><Link to="/stories" style={styles.link}>Stories</Link></li>
            <li><Link to="/resources" style={styles.link}>Resources</Link></li>
            <li><Link to={`/profile/${auth.currentUser.uid}`} style={styles.link}>Profile</Link></li>
            <li>
              <button onClick={handleLogout} style={styles.logoutButton}>Log Out</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: "#1a365d",
    padding: "1rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  navList: {
    listStyle: "none",
    display: "flex",
    gap: "1rem",
    margin: 0,
    padding: 0,
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
    padding: "0.5rem 1rem",
  },
  logoutButton: {
    backgroundColor: "#FED102",
    color: "#1a365d",
    border: "none",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontWeight: "bold",
    borderRadius: "5px",
  },
};

export default Navbar;
