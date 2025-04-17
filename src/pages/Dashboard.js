import React, { useState, useEffect } from "react";

import { useNavigate, Link } from "react-router-dom";
import { auth, firestore } from "../firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

const MenteeDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mentee, setMentee] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [mentorMatch, setMentorMatch] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [goals, setGoals] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [mentorshipSignupsEnabled, setMentorshipSignupsEnabled] = useState(false);  
  const [hasSubmittedApplication, setHasSubmittedApplication] = useState(false);
  // State for goal management
  const [filterCategory, setFilterCategory] = useState("All");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    category: "Academic",
    dueDate: "",
    description: "",
    completed: false
  });
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        // Fetch user data
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setMentee(userSnap.data());
        } else {
          console.error("No user data found");
        }
        
        // Check if user has submitted application - use a try/catch for robustness
        try {
          console.log("Checking if user has submitted a mentorship application");
          const signupRef = doc(firestore, "mentorship_signups", user.uid);
          const signupSnap = await getDoc(signupRef);
        
          if (signupSnap.exists()) {
            console.log("User has submitted a mentorship application");
            setHasSubmittedApplication(true);
          } else {
            console.log("No mentorship application found for user");
            setHasSubmittedApplication(false);
          }
        } catch (error) {
          console.error("Error checking mentorship application status:", error);
          // Default to false if there's an error, so user can still apply
          setHasSubmittedApplication(false);
        }
        
        // Check if mentorship signups are enabled
        try {
          console.log("Checking if mentorship signups are enabled");
          const mentorshipRef = doc(firestore, "mentorship", "programId");
          const mentorshipSnap = await getDoc(mentorshipRef);
          
          if (mentorshipSnap.exists()) {
            const mentorshipData = mentorshipSnap.data();
            // Set signup status based on "open" or "closed" status
            const isEnabled = mentorshipData.status === "open";
            console.log(`Mentorship signups are ${isEnabled ? 'enabled' : 'disabled'}`);
            setMentorshipSignupsEnabled(isEnabled);
          } else {
            console.log("No mentorship program settings found, defaulting to enabled");
            // Default to true for development/testing if no settings found
            setMentorshipSignupsEnabled(true);
          }
        } catch (error) {
          console.error("Error checking mentorship status:", error);
          // Default to true for development/testing if there's an error
          console.log("Error occurred, defaulting mentorship signups to enabled");
          setMentorshipSignupsEnabled(true);
        }

        // FIRST TRY API ENDPOINT (preferred method)
        try {
          const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
          const response = await fetch(`${apiUrl}/get-user-matches`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest"
            },
            body: JSON.stringify({ userId: user.uid }),
            credentials: "same-origin"
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("API returned matches:", data);
            
            // Process mentee matches
            if (data.menteeMatches && data.menteeMatches.length > 0) {
              // Sort by status priority
              const statusPriority = {
                "confirmed": 1,
                "approved": 2,
                "pending": 3,
                "rejected": 4
              };
              
              const menteeMatches = [...data.menteeMatches];
              menteeMatches.sort((a, b) => 
                (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99)
              );
              
              // Use the highest priority match
              const matchData = menteeMatches[0];
              setMentorMatch(matchData);
              
              // Fetch mentor data for this match
              if (matchData.mentorId) {
                const mentorRef = doc(firestore, "users", matchData.mentorId);
                const mentorSnap = await getDoc(mentorRef);
                
                if (mentorSnap.exists()) {
                  setMentor({
                    id: matchData.mentorId,
                    ...mentorSnap.data()
                  });
                }
              }
            }
            
            // Now we have both mentor and mentee matches available if needed
            return; // Skip the Firestore query below if API call was successful
          }
        } catch (error) {
          console.error("Error using API to fetch matches:", error);
          // Continue with direct Firestore query as fallback
        }

        // FALLBACK: Use Firestore directly if the API fails
        console.log("Falling back to direct Firestore query for matches");
        const matchesRef = collection(firestore, "mentorship_matches");
        
        // Get matches where user is a mentee (any status)
        const menteeMatchesQuery = query(
          matchesRef,
          where("menteeId", "==", user.uid)
        );
        
        const menteeMatchesSnap = await getDocs(menteeMatchesQuery);
        if (!menteeMatchesSnap.empty) {
          // Find the most relevant match to display based on status priority
          // Priority: confirmed > approved > pending > rejected
          const matches = menteeMatchesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort by status priority
          const statusPriority = {
            "confirmed": 1,
            "approved": 2,
            "pending": 3,
            "rejected": 4
          };
          
          matches.sort((a, b) => 
            (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99)
          );
          
          // Use the highest priority match
          const matchData = matches[0];
          if (!matchData.id) {
            matchData.id = menteeMatchesSnap.docs[0].id; // Ensure ID is included
          }
          setMentorMatch(matchData);
          
          // Fetch mentor data for this match
          if (matchData.mentorId) {
            const mentorRef = doc(firestore, "users", matchData.mentorId);
            const mentorSnap = await getDoc(mentorRef);
            
            if (mentorSnap.exists()) {
              setMentor({
                id: matchData.mentorId,
                ...mentorSnap.data()
              });
            }
          }
        }
        
        // Also get matches where user is a mentor
        const mentorMatchesQuery = query(
          matchesRef,
          where("mentorId", "==", user.uid)
        );
        
        const mentorMatchesSnap = await getDocs(mentorMatchesQuery);
        if (!mentorMatchesSnap.empty) {
          console.log("User is also a mentor for", mentorMatchesSnap.docs.length, "mentees");
          // Could do something with mentor matches if needed
        }

        // Debug information about matches
        if (mentorMatch) {
          console.log("Active mentorship match:", {
            id: mentorMatch.id || "No ID",
            status: mentorMatch.status || "No status",
            mentorId: mentorMatch.mentorId || "No mentor ID",
            menteeId: mentorMatch.menteeId || "No mentee ID",
            createdAt: mentorMatch.createdAt || "No creation date",
            hasId: !!mentorMatch.id,
            reason: mentorMatch.matchReason || mentorMatch.reason || "No reason provided",
            score: mentorMatch.compatibilityScore || mentorMatch.score || "No score available"
          });
          
          // Set an attribute to help with debugging
          window.latestMentorMatch = {
            ...mentorMatch,
            retrievedAt: new Date().toISOString()
          };
          
          // Verify that the match has all required fields
          const requiredFields = ["id", "mentorId", "menteeId", "status"];
          const missingFields = requiredFields.filter(field => !mentorMatch[field]);
          
          if (missingFields.length > 0) {
            console.warn(`⚠️ Match is missing required fields: ${missingFields.join(", ")}`);
          }
        } else {
          console.log("No active mentorship match found");
          
          // Clear the window attribute if no match is found
          if (window.latestMentorMatch) {
            window.latestMentorMatch = null;
          }
        }
        
        // Fetch upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        const eventsRef = collection(firestore, "events");
        const eventsQuery = query(
          eventsRef,
          where("date", ">=", todayStr),
          orderBy("date", "asc"),
          limit(3)
        );
        
        const eventsSnap = await getDocs(eventsQuery);
        const eventsData = eventsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUpcomingEvents(eventsData);
    
        // Fetch success stories - Commented out until stories functionality is implemented
        // const storiesRef = collection(firestore, "success_stories");
        // const storiesQuery = query(
        //   storiesRef,
        //   orderBy("createdAt", "desc"),
        //   limit(2)
        // );
        // const storiesSnap = await getDocs(storiesQuery);
        

        // Fetch goals from Firebase
        const goalsRef = collection(firestore, "goals");
        const goalsQuery = query(
          goalsRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        
        const goalsSnap = await getDocs(goalsQuery);
        const goalsData = goalsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setGoals(goalsData);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, mentorMatch]);
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Goal management functions
  const handleGoalToggle = async (goalId) => {
    try {
      const goalToUpdate = goals.find(goal => goal.id === goalId);
      if (!goalToUpdate) return;
      
      const newStatus = !goalToUpdate.completed;
      
      // Update in Firebase
      const goalRef = doc(firestore, "goals", goalId);
      await updateDoc(goalRef, {
        completed: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId 
            ? { ...goal, completed: newStatus } 
            : goal
        )
      );
    } catch (error) {
      console.error("Error updating goal status:", error);
      alert("Failed to update goal status. Please try again.");
    }
  };

  const handleAddGoal = async () => {
    try {
      if (!newGoal.title.trim()) {
        alert("Goal title is required!");
        return;
      }
      
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }
      
      const goalData = {
        ...newGoal,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add to Firebase
      const goalsRef = collection(firestore, "goals");
      const docRef = await addDoc(goalsRef, goalData);
      
      // Update local state
      setGoals(prevGoals => [
        {
          id: docRef.id,
          ...goalData,
          createdAt: new Date(), // Temporary for UI until refresh
          updatedAt: new Date()  // Temporary for UI until refresh
        },
        ...prevGoals
      ]);
      
      // Reset form and close modal
      setNewGoal({
        title: "",
        category: "Academic",
        dueDate: "",
        description: "",
        completed: false
      });
      setShowGoalModal(false);
    } catch (error) {
      console.error("Error adding goal:", error);
      alert("Failed to add goal. Please try again.");
    }
  };
  const confirmMatch = async () => {
    if (!mentorMatch || !mentorMatch.id) {
      console.error("No match ID available");
      return;
    }
    
    try {
      // Get current user ID
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }
      
      // Use the API service to update the match status
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      const response = await fetch(`${apiUrl}/update-match-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({
          matchId: mentorMatch.id,
          status: "confirmed",
          userId: user.uid,
          timestamp: new Date().toISOString()
        }),
        credentials: "same-origin"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server error");
      }
      
      // Also update Firestore directly as a fallback
      const matchRef = doc(firestore, "mentorship_matches", mentorMatch.id);
      await updateDoc(matchRef, {
        status: "confirmed",
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      });
      
      // Update local state
      setMentorMatch({
        ...mentorMatch,
        status: "confirmed"
      });
      
      alert("You've successfully confirmed this mentorship match!");
    } catch (error) {
      console.error("Error confirming match:", error);
      alert("Error confirming match. Please try again.");
    }
  };
  
  const rejectMatch = async () => {
    if (!mentorMatch || !mentorMatch.id) {
      console.error("No match ID available");
      return;
    }
    
    if (!window.confirm("Are you sure you want to reject this mentorship match?")) {
      return;
    }
    
    try {
      // Get current user ID
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }
      
      // Use the API service to update the match status
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      const response = await fetch(`${apiUrl}/update-match-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({
          matchId: mentorMatch.id,
          status: "rejected",
          userId: user.uid,
          timestamp: new Date().toISOString()
        }),
        credentials: "same-origin"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server error");
      }
      
      // Also update Firestore directly as a fallback
      const matchRef = doc(firestore, "mentorship_matches", mentorMatch.id);
      await updateDoc(matchRef, {
        status: "rejected",
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      });
      
      // Update local state
      setMentorMatch({
        ...mentorMatch,
        status: "rejected"
      });
      
      // Clear mentor data
      setMentor(null);
      
      alert("You've rejected this mentorship match. You can sign up again for a new match if you wish.");
    } catch (error) {
      console.error("Error rejecting match:", error);
      alert("Error rejecting match. Please try again.");
    }
  };

  const handleUpdateGoal = async () => {
    try {
      if (!editingGoal || !editingGoal.id) return;
      if (!editingGoal.title.trim()) {
        alert("Goal title is required!");
        return;
      }
      
      // Update in Firebase
      const goalRef = doc(firestore, "goals", editingGoal.id);
      await updateDoc(goalRef, {
        title: editingGoal.title,
        category: editingGoal.category,
        dueDate: editingGoal.dueDate,
        description: editingGoal.description,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === editingGoal.id 
            ? { ...goal, ...editingGoal, updatedAt: new Date() } 
            : goal
        )
      );
      
      // Reset form and close modal
      setEditingGoal(null);
      setShowGoalModal(false);
    } catch (error) {
      console.error("Error updating goal:", error);
      alert("Failed to update goal. Please try again.");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this goal?")) return;
      
      // Delete from Firebase
      const goalRef = doc(firestore, "goals", goalId);
      await deleteDoc(goalRef);
      
      // Update local state
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("Failed to delete goal. Please try again.");
    }
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setShowGoalModal(true);
  };

  // Get filtered goals based on category
  const getFilteredGoals = () => {
    if (filterCategory === "All") return goals;
    return goals.filter(goal => goal.category === filterCategory);
  };

  // Calculate goal statistics
  const getGoalStats = () => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.completed).length;
    const percentCompleted = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const remainingGoals = totalGoals - completedGoals;
    
    return {
      totalGoals,
      completedGoals,
      percentCompleted,
      remainingGoals
    };
  };
  if (loading) {
    return <div style={styles.loadingContainer}>Loading your dashboard...</div>;
  }
  return (
    <div style={styles.container}>
      {/* Welcome Header */}
      <div style={styles.welcomeSection}>
        <div style={styles.welcomeContent}>
          <h1 style={styles.welcomeTitle}>
            Welcome, {mentee?.firstName || "Student"}!
          </h1>
          <p style={styles.welcomeMessage}>
            Track your mentorship journey, set goals, and access resources to help you succeed.
          </p>
        </div>

        <div style={styles.quickActions}>
          {/* Set New Goal button removed from here */}
          {mentor && (
            <button style={styles.secondaryAction}>
              Message Mentor
            </button>
          )}
        </div>
      </div>



      {/* Dashboard Tabs */}
      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab("overview")} 
          style={activeTab === "overview" ? styles.activeTab : styles.tab}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab("goals")} 
          style={activeTab === "goals" ? styles.activeTab : styles.tab}
        >
          Goals & Progress
        </button>
      </div>

      {/* Dashboard Content */}
      <div style={styles.dashboardContent}>
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div style={styles.overviewContent}>
            {/* Mentor Connection */}
            <div style={styles.mentorSection}>
  <h2 style={styles.sectionTitle}>Your Mentorship Connection</h2>
  
  {mentor && mentorMatch?.status === "confirmed" ? (
    // Confirmed match - display full mentor profile
    <div style={styles.mentorCard}>
      <div style={styles.mentorProfile}>
        <div style={styles.mentorImageContainer}>
          {mentor.profileImage ? (
            <img 
              src={mentor.profileImage} 
              alt={`${mentor.firstName}'s profile`} 
              style={styles.mentorImage}
            />
          ) : (
            <div style={styles.mentorImagePlaceholder}>
              {mentor.firstName?.charAt(0)}{mentor.lastName?.charAt(0)}
            </div>
          )}
        </div>
        
        <div style={styles.mentorInfo}>
          <h3 style={styles.mentorName}>
            {mentor.firstName} {mentor.lastName}
          </h3>
          {mentor.major && (
            <span style={styles.mentorMajor}>{mentor.major}</span>
          )}
          <p style={styles.mentorBio}>
            {mentor.bio || "Your mentor hasn't added a bio yet."}
          </p>
          <div style={styles.mentorActions}>
            <Link 
              to={`/profile/${mentorMatch?.mentorId}`} 
              style={styles.viewProfileButton}
            >
              View Full Profile
            </Link>
          </div>
        </div>
      </div>
      
      <div style={styles.connectionStats}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Connected Since</span>
          <span style={styles.statValue}>
            {mentorMatch?.createdAt ? formatDate(mentorMatch.createdAt) : "Recently"}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Next Meeting</span>
          <span style={styles.statValue}>Not scheduled</span>
        </div>
      </div>
    </div>
  ) : mentor && mentorMatch?.status === "approved" ? (
    // Approved match - needs confirmation
    <div style={styles.pendingMentorCard}>
      <div style={styles.pendingHeader}>
        <h3 style={styles.pendingTitle}>New Mentor Assigned!</h3>
        <span style={styles.statusBadge}>Ready for Your Confirmation</span>
      </div>
      
      <div style={styles.mentorProfile}>
        <div style={styles.mentorImageContainer}>
          {mentor.profileImage ? (
            <img 
              src={mentor.profileImage} 
              alt={`${mentor.firstName}'s profile`} 
              style={styles.mentorImage}
            />
          ) : (
            <div style={styles.mentorImagePlaceholder}>
              {mentor.firstName?.charAt(0)}{mentor.lastName?.charAt(0)}
            </div>
          )}
        </div>
        
        <div style={styles.mentorInfo}>
          <h3 style={styles.mentorName}>
            {mentor.firstName} {mentor.lastName}
          </h3>
          {mentor.major && (
            <span style={styles.mentorMajor}>{mentor.major}</span>
          )}
          
          <p style={styles.mentorBio}>
            {mentor.bio || "This mentor hasn't added a bio yet."}
          </p>
          
          <div style={styles.matchDetails}>
            <h4 style={styles.matchDetailsTitle}>Why You Were Matched:</h4>
            <p style={styles.matchReason}>
              {mentorMatch?.matchReason || "You've been matched based on your academic interests and goals."}
            </p>
          </div>
          
          <div style={styles.viewProfileAction}>
            <Link 
              to={`/profile/${mentorMatch.mentorId}`} 
              style={styles.viewProfileButton}
            >
              View Full Profile
            </Link>
          </div>
          
          <div style={styles.confirmationActions}>
            <button 
              onClick={confirmMatch}
              style={styles.confirmButton}
            >
              Confirm Match
            </button>
            <button 
              onClick={rejectMatch}
              style={styles.rejectButton}
            >
              Decline Match
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : mentorMatch?.status === "pending" ? (
    // Pending match - waiting for admin approval
    <div style={styles.pendingMentorCard}>
      <div style={styles.pendingHeader}>
        <h3 style={styles.pendingTitle}>Mentor Match Pending</h3>
        <span style={styles.statusBadge}>Awaiting Admin Approval</span>
      </div>
      
      <div style={styles.pendingMessage}>
        <p>Your mentorship match is being reviewed by an administrator. You'll be notified when it's ready for your confirmation.</p>
      </div>
    </div>
  ) : (
    // No match or rejected match
    <div style={styles.noMentorCard}>
      <p style={styles.noMentorMessage}>
        {hasSubmittedApplication ? (
          "Thank you for your application! Your mentorship application has been received and is being processed. We're working on finding the perfect match for you."
        ) : (
          <>
            {!mentorMatch && mentorshipSignupsEnabled ? (
              <>
                <span>Mentorship program is currently open! </span>
                <Link 
                  to="/mentorship-signup" 
                  style={styles.signupLink}
                  onClick={() => {
                    console.log("Mentorship signup link clicked within Your Mentorship Connection");
                    console.log("Current state:", { 
                      hasSubmittedApplication, 
                      hasMentorMatch: !!mentorMatch, 
                      mentorshipSignupsEnabled 
                    });
                  }}
                >
                  Sign up as a mentor or mentee
                </Link>
                <span> to participate in our mentorship program.</span>
              </>
            ) : !mentorMatch ? (
              <span>Mentorship signups are currently closed. Please check back later for the next enrollment period.</span>
            ) : null}
          </>
        )}
      </p>
      {mentorMatch && mentorMatch.status === "rejected" && (
        <>
          <p style={styles.rejectedMessage}>
            Your previous match was declined. You can sign up again when you're ready.
          </p>
          {mentorshipSignupsEnabled && (
            <div style={styles.rejoinButtonContainer}>
              <Link 
                to="/mentorship-signup?fromRejected=true" 
                style={styles.rejoinButton}
                onClick={() => {
                  console.log("Apply for a new match clicked");
                  console.log("Current state:", { 
                    hasSubmittedApplication, 
                    mentorMatch: mentorMatch ? mentorMatch.status : null,
                    mentorshipSignupsEnabled 
                  });
                }}
              >
                Apply for a new match
              </Link>
            </div>
          )}
        </>
      )}
      
      {/* Removed the redundant signup button as requested */}
    </div>
  )}
</div>

            {/* Upcoming Events */}
            <div style={styles.eventsSection}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Upcoming Events</h2>
                <Link to="/events" style={styles.viewAllLink}>
                  View All
                </Link>
              </div>
              
              {upcomingEvents.length > 0 ? (
                <div style={styles.eventsList}>
                  {upcomingEvents.map((event) => (
                    <div key={event.id} style={styles.eventCard}>
                      <div style={styles.eventDate}>
                        <span style={styles.eventMonth}>
                          {new Date(event.date).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span style={styles.eventDay}>
                          {new Date(event.date).getDate()}
                        </span>
                      </div>
                      <div style={styles.eventDetails}>
                        <h3 style={styles.eventTitle}>{event.title}</h3>
                        <p style={styles.eventLocation}>
                          {event.location || "Location TBD"}
                        </p>
                        <p style={styles.eventDescription}>
                          {event.description?.substring(0, 100)}
                          {event.description?.length > 100 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noEventsMessage}>
                  No upcoming events at this time. Check back soon!
                </p>
              )}
            </div>

            {/* Goal Progress */}
            <div style={styles.goalsSection}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Goal Progress</h2>
                <button 
                  onClick={() => setActiveTab("goals")}
                  style={styles.viewAllLink}
                >
                  Manage Goals
                </button>
              </div>
              
              {goals.length > 0 ? (
                <div style={styles.goalsList}>
                  {goals.slice(0, 3).map((goal) => (
                    <div key={goal.id} style={styles.goalItem}>
                      <div style={styles.goalCheckbox}>
                        <input 
                          type="checkbox" 
                          checked={goal.completed} 
                          onChange={() => handleGoalToggle(goal.id)} 
                          style={styles.checkbox}
                        />
                      </div>
                      <div style={styles.goalDetails}>
                        <h3 style={{
                          ...styles.goalTitle,
                          textDecoration: goal.completed ? "line-through" : "none",
                          color: goal.completed ? "#A0AEC0" : "#2D3748"
                        }}>
                          {goal.title}
                        </h3>
                        <div style={styles.goalMeta}>
                          <span style={styles.goalCategory}>{goal.category}</span>
                          <span style={styles.goalDue}>Due: {formatDate(goal.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noGoalsMessage}>
                  No goals set yet. Go to "Goals & Progress" tab to set your first goal!
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Goals & Progress Tab */}
        {activeTab === "goals" && (
          <div style={styles.goalsDashboard}>
            <div style={styles.goalsHeader}>
              <h2 style={styles.sectionTitle}>Your Goals</h2>
              <button 
                onClick={openAddModal} 
                style={styles.addGoalButton}
              >
                + Add New Goal
              </button>
            </div>
            
            {/* Goals Categories */}
            <div style={styles.goalCategories}>
              <button 
                onClick={() => setFilterCategory("All")}
                style={{...styles.categoryButton, backgroundColor: filterCategory === "All" ? "#1a365d" : "#f7fafc", color: filterCategory === "All" ? "white" : "#4a5568"}}
              >
                All
              </button>
              <button 
                onClick={() => setFilterCategory("Academic")}
                style={{...styles.categoryButton, backgroundColor: "#EBF8FF", color: "#2B6CB0", borderWidth: filterCategory === "Academic" ? "2px" : "1px", borderColor: filterCategory === "Academic" ? "#2B6CB0" : "#e2e8f0"}}
              >
                Academic
              </button>
              <button 
                onClick={() => setFilterCategory("Career")}
                style={{...styles.categoryButton, backgroundColor: "#FAF5FF", color: "#6B46C1", borderWidth: filterCategory === "Career" ? "2px" : "1px", borderColor: filterCategory === "Career" ? "#6B46C1" : "#e2e8f0"}}
              >
                Career
              </button>
              <button 
                onClick={() => setFilterCategory("Personal")}
                style={{...styles.categoryButton, backgroundColor: "#F0FFF4", color: "#2F855A", borderWidth: filterCategory === "Personal" ? "2px" : "1px", borderColor: filterCategory === "Personal" ? "#2F855A" : "#e2e8f0"}}
              >
                Personal
              </button>
              <button 
                onClick={() => setFilterCategory("Financial")}
                style={{...styles.categoryButton, backgroundColor: "#FFFAF0", color: "#C05621", borderWidth: filterCategory === "Financial" ? "2px" : "1px", borderColor: filterCategory === "Financial" ? "#C05621" : "#e2e8f0"}}
              >
                Financial
              </button>
              <button 
                onClick={() => setFilterCategory("Leadership")}
                style={{...styles.categoryButton, backgroundColor: "#FFF5F5", color: "#C53030", borderWidth: filterCategory === "Leadership" ? "2px" : "1px", borderColor: filterCategory === "Leadership" ? "#C53030" : "#e2e8f0"}}
              >
                Leadership
              </button>
            </div>
            
            {/* All Goals List */}
            <div style={styles.allGoalsList}>
              <h3 style={styles.subSectionTitle}>
                {filterCategory === "All" ? "All Goals" : `${filterCategory} Goals`}
                <span style={styles.goalCount}>
                  ({getFilteredGoals().length} goals)
                </span>
              </h3>
              
              {getFilteredGoals().length > 0 ? (
                getFilteredGoals().map((goal) => (
                  <div key={goal.id} style={styles.goalCard}>
                    <div style={styles.goalCardHeader}>
                      <div style={styles.goalCheckboxLarge}>
                        <input 
                          type="checkbox" 
                          checked={goal.completed} 
                          onChange={() => handleGoalToggle(goal.id)} 
                          style={styles.checkboxLarge}
                        />
                      </div>
                      <h3 style={{
                        ...styles.goalTitleLarge,
                        textDecoration: goal.completed ? "line-through" : "none",
                        color: goal.completed ? "#A0AEC0" : "#2D3748"
                      }}>
                        {goal.title}
                      </h3>
                    </div>
                    
                    <div style={styles.goalCardDetails}>
                      <div style={styles.goalMetaLarge}>
                        <span style={{
                          ...styles.goalCategoryBadge,
                          backgroundColor: goal.category === "Academic" ? "#EBF8FF" : 
                                            goal.category === "Career" ? "#FAF5FF" : 
                                            goal.category === "Personal" ? "#F0FFF4" : 
                                            goal.category === "Financial" ? "#FFFAF0" : "#FFF5F5"
                        }}>
                          {goal.category}
                        </span>
                        <span style={styles.goalDueLarge}>
                          Due: {formatDate(goal.dueDate)}
                        </span>
                      </div>
                      
                      <div style={styles.goalActions}>
                        <button 
                          onClick={() => openEditModal(goal)} 
                          style={styles.goalEditButton}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteGoal(goal.id)} 
                          style={styles.goalDeleteButton}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {goal.description && (
                      <div style={styles.goalDescription}>
                        <p>{goal.description}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={styles.noGoalsMessage}>
                  No goals found in this category. Click "Add New Goal" to create one!
                </p>
              )}
            </div>
            
            {/* Progress Section */}
            <div style={styles.progressSection}>
              <h3 style={styles.subSectionTitle}>Your Progress</h3>
              
              <div style={styles.progressStats}>
                <div style={styles.progressCard}>
                  <div style={{
                    ...styles.progressCircle,
                    background: `conic-gradient(#1a365d ${getGoalStats().percentCompleted * 3.6}deg, #e2e8f0 0)`
                  }}>
                    <div style={styles.progressInnerCircle}>
                      <div style={styles.progressNumber}>
                        {getGoalStats().percentCompleted}%
                      </div>
                    </div>
                  </div>
                  <div style={styles.progressLabel}>Goals Completed</div>
                </div>
                
                <div style={styles.progressCard}>
                  <div style={styles.progressNumber}>
                    {getGoalStats().remainingGoals}
                  </div>
                  <div style={styles.progressLabel}>Goals Remaining</div>
                </div>
                
                <div style={styles.progressCard}>
                  <div style={styles.progressNumber}>
                    {getGoalStats().totalGoals}
                  </div>
                  <div style={styles.progressLabel}>Total Goals</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Goal Modal */}
      {showGoalModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingGoal ? "Update Goal" : "Add New Goal"}
              </h2>
              <button 
                onClick={() => setShowGoalModal(false)} 
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Title</label>
                <input 
                  type="text" 
                  value={editingGoal ? editingGoal.title : newGoal.title} 
                  onChange={(e) => {
                    if (editingGoal) {
                      setEditingGoal({...editingGoal, title: e.target.value});
                    } else {
                      setNewGoal({...newGoal, title: e.target.value});
                    }
                  }} 
                  style={styles.formInput}
                  placeholder="Enter goal title"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Category</label>
                <select 
                  value={editingGoal ? editingGoal.category : newGoal.category} 
                  onChange={(e) => {
                    if (editingGoal) {
                      setEditingGoal({...editingGoal, category: e.target.value});
                    } else {
                      setNewGoal({...newGoal, category: e.target.value});
                    }
                  }} 
                  style={styles.formSelect}
                >
                  <option value="Academic">Academic</option>
                  <option value="Career">Career</option>
                  <option value="Personal">Personal</option>
                  <option value="Financial">Financial</option>
                  <option value="Leadership">Leadership</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Due Date</label>
                <input 
                  type="date" 
                  value={editingGoal ? editingGoal.dueDate : newGoal.dueDate} 
                  onChange={(e) => {
                    if (editingGoal) {
                      setEditingGoal({...editingGoal, dueDate: e.target.value});
                    } else {
                      setNewGoal({...newGoal, dueDate: e.target.value});
                    }
                  }} 
                  style={styles.formInput}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description (Optional)</label>
                <textarea 
                  value={editingGoal ? editingGoal.description : newGoal.description} 
                  onChange={(e) => {
                    if (editingGoal) {
                      setEditingGoal({...editingGoal, description: e.target.value});
                    } else {
                      setNewGoal({...newGoal, description: e.target.value});
                    }
                  }} 
                  style={styles.formTextarea}
                  placeholder="Provide any additional details about this goal"
                  rows={4}
                />
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                onClick={() => setShowGoalModal(false)} 
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={editingGoal ? handleUpdateGoal : handleAddGoal} 
                style={styles.saveButton}
              >
                {editingGoal ? "Update Goal" : "Add Goal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem 1.5rem"
  },
  rejoinButtonContainer: {
    marginTop: "1rem",
    textAlign: "center"
  },
  rejoinButton: {
    display: "inline-block",
    backgroundColor: "#3182ce",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "600"
  },
  signupButtonContainer: {
    marginTop: "1.5rem",
    textAlign: "center",
    padding: "1.5rem",
    backgroundColor: "#ebf8ff",
    borderRadius: "8px",
    border: "2px solid #3182ce"
  },
  primarySignupButton: {
    display: "inline-block",
    backgroundColor: "#1a365d",
    color: "white", 
    padding: "1rem 2rem",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "1.1rem",
    marginBottom: "0.75rem"
  },
  signupDescription: {
    color: "#4a5568",
    fontSize: "0.95rem"
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    fontSize: "1.2rem",
    color: "#718096"
  },
  welcomeSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem"
  },
  welcomeContent: {
    flex: "1"
  },
  welcomeTitle: {
    fontSize: "2.25rem",
    color: "#1a365d",
    marginBottom: "0.5rem"
  },
  welcomeMessage: {
    fontSize: "1.1rem",
    color: "#4a5568",
    maxWidth: "600px"
  },
  quickActions: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap"
  },
  primaryAction: {
    backgroundColor: "#1a365d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer"
  },
  secondaryAction: {
    backgroundColor: "#e2e8f0",
    color: "#1a365d",
    border: "none",
    borderRadius: "6px",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer"
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
    marginBottom: "2rem",
    overflowX: "auto",
    gap: "0.5rem"
  },
  tab: {
    padding: "1rem 1.5rem",
    color: "#4a5568",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer"
  },
  activeTab: {
    padding: "1rem 1.5rem",
    color: "#1a365d",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid #1a365d",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer"
  },
  dashboardContent: {
    marginBottom: "3rem"
  },
  overviewContent: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "2rem"
  },
  sectionTitle: {
    fontSize: "1.5rem",
    color: "#1a365d",
    marginBottom: "1.25rem",
    fontWeight: "600"
  },
  subSectionTitle: {
    fontSize: "1.25rem",
    color: "#1a365d",
    marginBottom: "1rem",
    fontWeight: "600"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem"
  },
  viewAllLink: {
    color: "#3182ce",
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: "500"
  },
  // Mentor Section
  mentorSection: {
    gridColumn: "span 2",
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
  },
  mentorCard: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  mentorProfile: {
    display: "flex",
    gap: "1.5rem"
  },
  mentorImageContainer: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0
  },
  mentorImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  mentorImagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d",
    color: "white",
    fontSize: "2.5rem",
    fontWeight: "bold"
  },
  mentorInfo: {
    flex: "1"
  },
  mentorName: {
    fontSize: "1.5rem",
    color: "#1a365d",
    marginBottom: "0.5rem",
    fontWeight: "600"
  },
  mentorMajor: {
    backgroundColor: "#ebf8ff",
    color: "#2b6cb0",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "inline-block",
    marginBottom: "1rem"
  },
  mentorBio: {
    fontSize: "1rem",
    color: "#4a5568",
    lineHeight: "1.6",
    marginBottom: "1rem"
  },
  mentorActions: {
    display: "flex",
    justifyContent: "flex-start"
  },
  viewProfileButton: {
    backgroundColor: "#e2e8f0",
    color: "#1a365d",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: "500"
  },
  connectionStats: {
    display: "flex",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "1.5rem",
    justifyContent: "space-around"
  },
  statItem: {
    textAlign: "center"
  },
  statLabel: {
    fontSize: "0.875rem",
    color: "#718096",
    display: "block",
    marginBottom: "0.5rem"
  },
  statValue: {
    fontSize: "1.1rem",
    color: "#1a365d",
    fontWeight: "600",
    display: "block"
  },
  noMentorCard: {
    backgroundColor: "#f7fafc",
    padding: "1.5rem",
    borderRadius: "8px",
    textAlign: "center"
  },
  noMentorMessage: {
    fontSize: "1.1rem",
    color: "#4a5568"
  },
  signupLink: {
    color: "#3182ce",
    textDecoration: "none",
    fontWeight: "600",
    margin: "0 0.3rem"
  },
  pendingMessage: {
    fontSize: "0.95rem",
    color: "#d69e2e",
    marginTop: "1rem",
    fontStyle: "italic"
  },
  // Events Section
  eventsSection: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
  },
  eventsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  eventCard: {
    display: "flex",
    backgroundColor: "#f7fafc",
    borderRadius: "8px",
    overflow: "hidden"
  },
  eventDate: {
    width: "70px",
    backgroundColor: "#1a365d",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "0.75rem"
  },
  eventMonth: {
    fontSize: "0.875rem",
    fontWeight: "500",
    textTransform: "uppercase"
  },
  eventDay: {
    fontSize: "1.5rem",
    fontWeight: "700",
    lineHeight: "1"
  },
  eventDetails: {
    padding: "1rem",
    flex: "1"
  },
  eventTitle: {
    fontSize: "1.1rem",
    color: "#1a365d",
    marginBottom: "0.5rem",
    fontWeight: "600"
  },
  eventLocation: {
    fontSize: "0.875rem",
    color: "#718096",
    marginBottom: "0.5rem"
  },
  eventDescription: {
    fontSize: "0.95rem",
    color: "#4a5568"
  },
  noEventsMessage: {
    textAlign: "center",
    padding: "1.5rem",
    color: "#718096",
    fontStyle: "italic"
  },
  
  // Goals Section
  goalsSection: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
  },
  goalsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  goalItem: {
    display: "flex",
    alignItems: "flex-start",
    padding: "0.75rem",
    backgroundColor: "#f7fafc",
    borderRadius: "8px"
  },
  goalCheckbox: {
    marginRight: "1rem",
    marginTop: "0.25rem"
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer"
  },
  goalDetails: {
    flex: "1"
  },
  goalTitle: {
    fontSize: "1.1rem",
    marginBottom: "0.5rem",
    fontWeight: "500"
  },
  goalMeta: {
    display: "flex",
    gap: "1rem"
  },
  goalCategory: {
    fontSize: "0.875rem",
    color: "#2b6cb0",
    fontWeight: "500"
  },
  goalDue: {
    fontSize: "0.875rem",
    color: "#718096"
  },
  noGoalsMessage: {
    textAlign: "center",
    padding: "1.5rem",
    color: "#718096",
    fontStyle: "italic"
  },
  // Goals Dashboard Tab
  goalsDashboard: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
  },
  goalsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem"
  },
  addGoalButton: {
    backgroundColor: "#1a365d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "0.6rem 1.2rem",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer"
  },
  goalCategories: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    marginBottom: "2rem"
  },
  categoryButton: {
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer"
  },
  allGoalsList: {
    marginBottom: "2.5rem"
  },
  goalCard: {
    backgroundColor: "#f7fafc",
    padding: "1.25rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    border: "1px solid #e2e8f0"
  },
  goalCardHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1rem"
  },
  goalCheckboxLarge: {
    marginRight: "1rem"
  },
  checkboxLarge: {
    width: "20px",
    height: "20px",
    cursor: "pointer"
  },
  goalTitleLarge: {
    fontSize: "1.2rem",
    fontWeight: "600"
  },
  goalCardDetails: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  goalMetaLarge: {
    display: "flex",
    gap: "1rem",
    alignItems: "center"
  },
  goalCategoryBadge: {
    padding: "0.35rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: "500"
  },
  goalDueLarge: {
    fontSize: "0.95rem",
    color: "#718096"
  },
  goalActions: {
    display: "flex",
    gap: "0.75rem"
  },
  goalEditButton: {
    backgroundColor: "#e2e8f0",
    color: "#4a5568",
    border: "none",
    borderRadius: "6px",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    cursor: "pointer"
  },
  goalDeleteButton: {
    backgroundColor: "#fff5f5",
    color: "#c53030",
    border: "none",
    borderRadius: "6px",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    cursor: "pointer"
  },
  goalDescription: {
    marginTop: "1rem",
    padding: "0.75rem",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  progressSection: {
    marginTop: "2rem"
  },
  progressStats: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1.5rem"
  },
  progressCard: {
    flex: "1",
    minWidth: "180px",
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
  },
  progressCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "conic-gradient(#1a365d 70%, #e2e8f0 0)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1rem"
  },
  progressInnerCircle: {
    width: "90%",
    height: "90%",
    backgroundColor: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  progressNumber: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#1a365d",
    marginBottom: "0.5rem"
  },
  progressLabel: {
    fontSize: "1rem",
    color: "#4a5568"
  },
  goalCount: {
    fontSize: "0.9rem",
    color: "#718096",
    fontWeight: "normal",
    marginLeft: "0.5rem"
  },
  // Modal styles  
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "10px",
    width: "90%",
    maxWidth: "550px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: "1.5rem",
    color: "#1a365d",
    fontWeight: "600",
    margin: 0,
  },
  closeButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#718096",
    fontSize: "1.25rem",
    cursor: "pointer",
    padding: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
  },
  modalBody: {
    padding: "1.5rem",
    flex: "1",
    backgroundColor: "#f8fafc",
  },
  modalFooter: {
    padding: "1.25rem 1.5rem",
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "white",
  },
  
  // Form styles
  formGroup: {
    marginBottom: "1.5rem",
  },
  formLabel: {
    display: "block",
    fontSize: "0.95rem",
    color: "#4a5568",
    fontWeight: "500",
    marginBottom: "0.5rem",
  },
  formInput: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "1rem",
    color: "#2d3748",
    backgroundColor: "white",
    transition: "border-color 0.2s ease",
  },
  formSelect: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "1rem",
    color: "#2d3748",
    backgroundColor: "white",
    transition: "border-color 0.2s ease",
    appearance: "none",
    backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,<svg width=\"14\" height=\"8\" viewBox=\"0 0 14 8\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1 1L7 7L13 1\" stroke=\"%234A5568\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 1rem center",
    paddingRight: "2.5rem",
  },
  formTextarea: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "1rem",
    color: "#2d3748",
    backgroundColor: "white",
    resize: "vertical",
    minHeight: "100px",
    transition: "border-color 0.2s ease",
  },
  
  // Button styles
  cancelButton: {
    backgroundColor: "#e2e8f0",
    color: "#4a5568",
    border: "none",
    borderRadius: "6px",
    padding: "0.75rem 1.25rem",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  saveButton: {
    backgroundColor: "#1a365d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "0.75rem 1.25rem",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  }
};

export default MenteeDashboard;

