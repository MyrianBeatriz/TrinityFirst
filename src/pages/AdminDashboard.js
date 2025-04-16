import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
<<<<<<< HEAD
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  addDoc
} from "firebase/firestore";

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";



const AdminDashboard = () => {
  // Main state
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  
  // Mentorship state
  const [signups, setSignups] = useState([]);
  const [mentorshipMatches, setMentorshipMatches] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [maxMenteesPerMentor, setMaxMenteesPerMentor] = useState(3);
  const [mentorshipSettings, setMentorshipSettings] = useState({});
  const [activeTab, setActiveTab] = useState("signups"); 
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  
  // Manual matching state
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [matchReason, setMatchReason] = useState("");
  const [compatibilityScore, setCompatibilityScore] = useState(75);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [filteredRole, setFilteredRole] = useState("all");
  const [menteeFilterText, setMenteeFilterText] = useState("");
  const [mentorFilterText, setMentorFilterText] = useState("");
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState(null); // 'mentor' or 'mentee'

  // User management state
  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  
  // Stories state
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyFormData, setStoryFormData] = useState({
    title: "",
    author: "",
    content: "",
    publishDate: "",
    featured: false
  });
  
  // Events state
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventFormData, setEventFormData] = useState({
    title: "",
    date: "",
    location: "",
    description: "",
    registrationLink: ""
  });

  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceFormData, setResourceFormData] = useState({
    title: "",
    description: "",
    link: "",
    category: "scholarship",
    createdBy: "",
    featured: false,
    publishDate: new Date().toISOString().substring(0, 10) // Today's date
  });
  const [uploadingResource, setUploadingResource] = useState(false);
  const [resourceCategories] = useState([
  { value: "scholarship", label: "Scholarship" },
  { value: "internship", label: "Internship" },
  { value: "job", label: "Job Opportunity" },
  { value: "academic", label: "Academic Resource" },
  { value: "financial", label: "Financial Aid" },
  { value: "campus", label: "Campus Resource" },
  { value: "community", label: "Community Resource" },
  { value: "other", label: "Other" }
]);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch mentorship settings first
        await fetchMentorshipSettings();
        
        // Fetch mentorship signups
        await fetchMentorshipData();
        
        // Fetch users
        await fetchUsers();
        
        // Fetch stories
        await fetchStories();
        
        // Fetch events
        await fetchEvents();

        await fetchResources();
        
=======
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const AdminDashboard = () => {
  const [signups, setSignups] = useState([]);
  const [mentorshipMatches, setMentorshipMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all mentorship signups
        const signupsRef = collection(firestore, "mentorship_signups");
        const signupsSnap = await getDocs(signupsRef);
        const signupsData = signupsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSignups(signupsData);

        // Fetch AI-generated mentorship matches
        const matchesRef = collection(firestore, "mentorship_matches");
        const matchesSnap = await getDocs(matchesRef);
        const matchesData = matchesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMentorshipMatches(matchesData);

>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

<<<<<<< HEAD
    fetchAllData();
  }, []);

  // Fetch mentorship settings
  const fetchMentorshipSettings = async () => {
    try {
      const settingsRef = doc(firestore, "settings", "mentorship");
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const settingsData = settingsSnap.data();
        setMentorshipSettings(settingsData);
        setMaxMenteesPerMentor(settingsData.maxMenteesPerMentor || 3);
        setSignupsEnabled(settingsData.signupsEnabled !== false); // Default to true if not set
        console.log("Mentorship settings fetched:", settingsData);
      } else {
        // Initialize settings if they don't exist
        const defaultSettings = {
          maxMenteesPerMentor: 3,
          autoMatchEnabled: false,
          signupsEnabled: true,
          lastUpdated: new Date().toISOString()
        };
        
        await setDoc(settingsRef, defaultSettings);
        setMentorshipSettings(defaultSettings);
        setSignupsEnabled(true);
        console.log("Initialized default mentorship settings");
      }
    } catch (error) {
      console.error("Error fetching mentorship settings:", error);
    }
  };

  // Fetch mentorship data
  const fetchMentorshipData = async () => {
    try {
      console.log("Fetching mentorship signups...");
      const signupsRef = collection(firestore, "mentorship_signups");
      const signupsSnap = await getDocs(signupsRef);
      let signupsData = [];

      for (let signupDoc of signupsSnap.docs) {
        let signupData = signupDoc.data();
        const userRef = doc(firestore, "users", signupDoc.id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          signupData.name = `${userData.firstName} ${userData.lastName}`;
          signupData.email = userData.email;
        } else {
          signupData.name = "Unknown User";
          signupData.email = "No Email";
        }

        signupsData.push({ id: signupDoc.id, ...signupData });
      }

      console.log("Mentorship signups fetched with user profiles:", signupsData);
      setSignups(signupsData);

      // Fetch AI-generated mentorship matches
      console.log("Fetching AI-generated mentorship matches...");
      const matchesRef = collection(firestore, "mentorship_matches");
      const matchesSnap = await getDocs(matchesRef);
      const matchesData = matchesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Convert IDs to names
      const updatedMatches = await Promise.all(matchesData.map(async (match) => {
        let menteeId = match.mentee || match.menteeId;
        let mentorId = match.mentor || match.mentorId;

        const menteeRef = doc(firestore, "users", menteeId);
        const mentorRef = doc(firestore, "users", mentorId);

        const menteeSnap = await getDoc(menteeRef);
        const mentorSnap = await getDoc(mentorRef);

        return {
          ...match,
          mentee: menteeSnap.exists() ? `${menteeSnap.data().firstName} ${menteeSnap.data().lastName}` : menteeId,
          mentor: mentorSnap.exists() ? `${mentorSnap.data().firstName} ${mentorSnap.data().lastName}` : mentorId,
          matchReason: match.matchReason || match.reason,
          compatibilityScore: match.compatibilityScore || match.score
        };
      }));

      console.log("Updated Matches with Names:", updatedMatches);
      setMentorshipMatches(updatedMatches);
    } catch (error) {
      console.error("Error fetching mentorship data:", error);
    }
  };

  const generateMatches = async () => {
    setGenerating(true);
    try {
      // Prepare data for AI matching API
      const mentors = signups.filter(signup => signup.mentorshipRole === "Mentor");
      const mentees = signups.filter(signup => signup.mentorshipRole === "Mentee");
      
      if (mentors.length === 0 || mentees.length === 0) {
        alert("Not enough mentors or mentees to generate matches.");
        setGenerating(false);
        return;
      }
      
      // Format data for the API
      const matchingData = {
        mentors: mentors.map(mentor => ({
          id: mentor.id,
          name: mentor.name,
          academicInterests: mentor.academicInterests || "",
          mentorStrengths: mentor.mentorStrengths || "",
          mentorTopics: mentor.mentorTopics || {},
          major: mentor.major || ""
        })),
        mentees: mentees.map(mentee => ({
          id: mentee.id,
          name: mentee.name,
          careerGoals: mentee.careerGoals || "",
          challenges: mentee.challenges || "",
          expectations: mentee.expectations || "",
          major: mentee.major || ""
        })),
        saveToFirestore: true,
        maxMenteesPerMentor: mentorshipSettings.maxMenteesPerMentor || maxMenteesPerMentor
      };
      
      console.log("Sending request to /generate-matches with settings:", {
        maxMenteesPerMentor: matchingData.maxMenteesPerMentor
      });
      
      const response = await fetch("http://127.0.0.1:5001/generate-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchingData)
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log("AI Matching Response:", result);
      
      if (result.matches && result.matches.length > 0) {
        // Update local settings if they changed on the server
        if (result.settings && result.settings.maxMenteesPerMentor) {
          setMaxMenteesPerMentor(result.settings.maxMenteesPerMentor);
          setMentorshipSettings({
            ...mentorshipSettings,
            maxMenteesPerMentor: result.settings.maxMenteesPerMentor
          });
        }
        
        alert(`Successfully generated ${result.matches.length} matches!`);
        
        // Refresh mentorship data
        await fetchMentorshipData();
      } else {
        alert("No matches were generated. Please try again later.");
      }
    } catch (error) {
      console.error("Error generating matches:", error);
      alert(`Error generating matches: ${error.message}`);
=======
    fetchData();
  }, []);

  const generateMatches = async () => {
    setGenerating(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/generate-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error("Error generating matches:", error);
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
    }
    setGenerating(false);
  };

<<<<<<< HEAD
  const createManualMatch = async () => {
    if (!selectedMentee || !selectedMentor) {
      alert("Please select both a mentee and a mentor.");
      return;
    }

    try {
      setIsCreatingMatch(true);

      // Check if this mentee is already matched
      const existingMenteeMatch = mentorshipMatches.find(
        match => match.menteeId === selectedMentee.id && match.status !== "rejected"
      );

      if (existingMenteeMatch) {
        if (!window.confirm(
          `This mentee is already matched with ${existingMenteeMatch.mentor}. Would you like to create a new match anyway?`
        )) {
          setIsCreatingMatch(false);
          return;
        }
      }

      // Check if mentor has reached their maximum mentees
      const mentorMatches = mentorshipMatches.filter(
        match => match.mentorId === selectedMentor.id && match.status === "approved"
      );

      if (mentorMatches.length >= maxMenteesPerMentor) {
        if (!window.confirm(
          `This mentor already has ${mentorMatches.length} mentees, which is the current maximum. Would you like to match anyway?`
        )) {
          setIsCreatingMatch(false);
          return;
        }
      }

      // Create the match object
      const matchData = {
        mentorId: selectedMentor.id,
        menteeId: selectedMentee.id,
        mentor: selectedMentor.name,
        mentee: selectedMentee.name,
        matchReason: matchReason || `Manual match created by administrator on ${new Date().toLocaleDateString()}`,
        compatibilityScore: compatibilityScore,
        status: "approved", // Manual matches are auto-approved
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        manuallyCreated: true
      };

      // Add to Firestore
      const matchesRef = collection(firestore, "mentorship_matches");
      await addDoc(matchesRef, matchData);

      alert("Match created successfully!");
      
      // Reset form and refresh data
      setSelectedMentee(null);
      setSelectedMentor(null);
      setMatchReason("");
      setCompatibilityScore(75);
      await fetchMentorshipData();
      
    } catch (error) {
      console.error("Error creating manual match:", error);
      alert(`Error creating match: ${error.message}`);
    }
    
    setIsCreatingMatch(false);
  };

  // Update match status (approve or reject)
  const updateMatchStatus = async (matchId, newStatus) => {
    try {
      if (newStatus === "rejected") {
        // For rejected matches, delete the document instead of updating it
        const matchRef = doc(firestore, "mentorship_matches", matchId);
        await deleteDoc(matchRef);
        
        // Update local state to remove the match
        setMentorshipMatches(prevMatches => 
          prevMatches.filter(match => match.id !== matchId)
        );
        
        alert("Match rejected and removed successfully!");
      } else {
        // For other statuses (like approved), update as before
        const matchRef = doc(firestore, "mentorship_matches", matchId);
        
        await updateDoc(matchRef, {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
        
        // Update local state to reflect the change
        setMentorshipMatches(prevMatches => 
          prevMatches.map(match => 
            match.id === matchId 
              ? { ...match, status: newStatus } 
              : match
          )
        );
        
        alert(`Match ${newStatus === 'approved' ? 'approved' : 'updated'} successfully!`);
      }
    } catch (error) {
      console.error(`Error updating match status to ${newStatus}:`, error);
      alert(`Error updating match status: ${error.message}`);
    }
  };
  
  // Toggle signup status
  const toggleSignupStatus = async () => {
    try {
      const newStatus = !signupsEnabled;
      
      // Use the correct path - the mentorship collection
      const mentorshipRef = doc(firestore, "mentorship", "programId");
      
      // Use "open" or "closed" as the status value
      const statusValue = newStatus ? "open" : "closed";
      
      await setDoc(mentorshipRef, {
        status: statusValue,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      // Update local state
      setSignupsEnabled(newStatus);
      setMentorshipSettings({
        ...mentorshipSettings,
        signupsEnabled: newStatus,
        status: statusValue
      });
      
      alert(`Mentorship signups are now ${newStatus ? "enabled" : "disabled"}.`);
    } catch (error) {
      console.error("Error toggling signup status:", error);
      alert(`Error updating settings: ${error.message}`);
    }
  };

  // Update mentorship settings
  const updateMentorshipSettings = async () => {
    try {
      const updatedSettings = {
        ...mentorshipSettings,
        maxMenteesPerMentor: maxMenteesPerMentor,
        signupsEnabled: signupsEnabled,
        lastUpdated: new Date().toISOString()
      };
      
      const settingsRef = doc(firestore, "settings", "mentorship");
      await setDoc(settingsRef, updatedSettings, { merge: true });
      
      setMentorshipSettings(updatedSettings);
      alert("Settings updated successfully!");
      console.log("Mentorship settings updated:", updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Error updating settings. Please try again.");
    }
  };

  // Open user details modal
  const openUserDetailsModal = (user, userType) => {
    setSelectedUserDetails(user);
    setSelectedUserType(userType);
    setShowUserDetailsModal(true);
  };
  
  // Close user details modal
  const closeUserDetailsModal = () => {
    setShowUserDetailsModal(false);
    setSelectedUserDetails(null);
    setSelectedUserType(null);
  };

  // --- USER MANAGEMENT FUNCTIONS ---
  const fetchUsers = async () => {
    try {
      const usersRef = collection(firestore, "users");
      const usersSnap = await getDocs(usersRef);
      
      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
      setUserCount(usersData.length);
      console.log("Users fetched successfully:", usersData.length);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // --- STORIES FUNCTIONS ---
  const fetchStories = async () => {
    try {
      const storiesRef = collection(firestore, "stories");
      const storiesQuery = query(storiesRef, orderBy("publishDate", "desc"));
      const storiesSnap = await getDocs(storiesQuery);
      
      const storiesData = storiesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStories(storiesData);
      console.log("Stories fetched successfully:", storiesData);
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  const handleStoryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStoryFormData({
      ...storyFormData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const selectStoryForEdit = (story) => {
    console.log("Selecting story for edit:", story);
    setSelectedStory(story);
    setStoryFormData({
      title: story.title || "",
      author: story.author || "",
      content: story.content || "",
      publishDate: story.publishDate ? story.publishDate.substring(0, 10) : "",
      featured: story.featured || false
    });
  };

  const resetStoryForm = () => {
    setSelectedStory(null);
    setStoryFormData({
      title: "",
      author: "",
      content: "",
      publishDate: new Date().toISOString().substring(0, 10), // Set today as default
      featured: false
    });
  };

  const saveStory = async (e) => {
    e.preventDefault();
    try {
      const storyData = {
        ...storyFormData,
        lastUpdated: new Date().toISOString()
      };
      
      if (selectedStory) {
        // Update existing story
        console.log("Updating story:", selectedStory.id, storyData);
        const storyRef = doc(firestore, "stories", selectedStory.id);
        await updateDoc(storyRef, storyData);
        alert("Story updated successfully!");
      } else {
        // Create new story
        console.log("Creating new story:", storyData);
        const storiesRef = collection(firestore, "stories");
        await setDoc(doc(storiesRef), storyData);
        alert("Story created successfully!");
      }
      
      resetStoryForm();
      await fetchStories();
    } catch (error) {
      console.error("Error saving story:", error);
      alert("Error saving story. Please try again.");
    }
  };

  const deleteStory = async (storyId) => {
    if (window.confirm("Are you sure you want to delete this story?")) {
      try {
        console.log("Deleting story:", storyId);
        const storyRef = doc(firestore, "stories", storyId);
        await deleteDoc(storyRef);
        alert("Story deleted successfully!");
        
        if (selectedStory && selectedStory.id === storyId) {
          resetStoryForm();
        }
        
        await fetchStories();
      } catch (error) {
        console.error("Error deleting story:", error);
        alert("Error deleting story. Please try again.");
      }
    }
  };

  const toggleStoryFeature = async (story) => {
    try {
      const storyRef = doc(firestore, "stories", story.id);
      await updateDoc(storyRef, {
        featured: !story.featured,
        lastUpdated: new Date().toISOString()
      });
      
      if (selectedStory && selectedStory.id === story.id) {
        setStoryFormData({
          ...storyFormData,
          featured: !story.featured
        });
        setSelectedStory({
          ...selectedStory,
          featured: !story.featured
        });
      }
      
      await fetchStories();
      alert(`Story ${!story.featured ? "featured" : "unfeatured"} successfully!`);
    } catch (error) {
      console.error("Error toggling story feature status:", error);
      alert("Error updating story. Please try again.");
    }
  };

  // --- EVENTS FUNCTIONS ---
  const fetchEvents = async () => {
    try {
      const eventsRef = collection(firestore, "events");
      const eventsQuery = query(eventsRef, orderBy("date", "desc"));
      const eventsSnap = await getDocs(eventsQuery);
      
      const eventsData = eventsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEvents(eventsData);
      console.log("Events fetched successfully:", eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleEventInputChange = (e) => {
    const { name, value } = e.target;
    setEventFormData({
      ...eventFormData,
      [name]: value
    });
  };

  const selectEventForEdit = (event) => {
    console.log("Selecting event for edit:", event);
    setSelectedEvent(event);
    setEventFormData({
      title: event.title || "",
      date: event.date || "",
      location: event.location || "",
      description: event.description || "",
      registrationLink: event.registrationLink || ""
    });
  };

  const resetEventForm = () => {
    setSelectedEvent(null);
    setEventFormData({
      title: "",
      date: "",
      location: "",
      description: "",
      registrationLink: ""
    });
  };

  const saveEvent = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...eventFormData,
        lastUpdated: new Date().toISOString()
      };
      
      if (selectedEvent) {
        // Update existing event
        console.log("Updating event:", selectedEvent.id, eventData);
        const eventRef = doc(firestore, "events", selectedEvent.id);
        await updateDoc(eventRef, eventData);
        alert("Event updated successfully!");
      } else {
        // Create new event
        console.log("Creating new event:", eventData);
        const eventsRef = collection(firestore, "events");
        await setDoc(doc(eventsRef), eventData);
        alert("Event created successfully!");
      }
      
      resetEventForm();
      await fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event. Please try again.");
    }
  };

  const deleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        console.log("Deleting event:", eventId);
        const eventRef = doc(firestore, "events", eventId);
        await deleteDoc(eventRef);
        alert("Event deleted successfully!");
        
        if (selectedEvent && selectedEvent.id === eventId) {
          resetEventForm();
        }
        
        await fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Error deleting event. Please try again.");
      }
    }
  };

  const fetchResources = async () => {
    try {
      const resourcesRef = collection(firestore, "resources");
      const resourcesQuery = query(resourcesRef, orderBy("publishDate", "desc"));
      const resourcesSnap = await getDocs(resourcesQuery);
      
      const resourcesData = resourcesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setResources(resourcesData);
      console.log("Resources fetched successfully:", resourcesData);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const handleResourceInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setResourceFormData({
      ...resourceFormData,
      [name]: type === "checkbox" ? checked : value
    });
  };
  
  
  const selectResourceForEdit = (resource) => {
    console.log("Selecting resource for edit:", resource);
    setSelectedResource(resource);
    setResourceFormData({
      title: resource.title || "",
      description: resource.description || "",
      link: resource.link || "",
      category: resource.category || "other",
      createdBy: resource.createdBy || "",
      featured: resource.featured || false,
      publishDate: resource.publishDate ? resource.publishDate.substring(0, 10) : ""
    });
  };
  
  const resetResourceForm = () => {
    setSelectedResource(null);
    setResourceFormData({
      title: "",
      description: "",
      link: "",
      category: "scholarship",
      createdBy: "",
      featured: false,
      publishDate: new Date().toISOString().substring(0, 10) // Set today as default
    });
  };
  
  const saveResource = async (e) => {
    e.preventDefault();
    setUploadingResource(true);
    
    try {
      const resourceData = {
        ...resourceFormData,
        lastUpdated: new Date().toISOString()
      };
      
      let fileUrl = "";
      
      
      if (selectedResource) {
        // Update existing resource
        console.log("Updating resource:", selectedResource.id, resourceData);
        const resourceRef = doc(firestore, "resources", selectedResource.id);
        await updateDoc(resourceRef, resourceData);
        alert("Resource updated successfully!");
      } else {
        // Create new resource
        console.log("Creating new resource:", resourceData);
        const resourcesRef = collection(firestore, "resources");
        await addDoc(resourcesRef, resourceData);
        alert("Resource created successfully!");
      }
      
      resetResourceForm();
      await fetchResources();
    } catch (error) {
      console.error("Error saving resource:", error);
      alert("Error saving resource. Please try again.");
    } finally {
      setUploadingResource(false);
    }
  };
  
  const deleteResource = async (resourceId) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        console.log("Deleting resource:", resourceId);
        const resourceRef = doc(firestore, "resources", resourceId);
        
        // Delete the resource document
        await deleteDoc(resourceRef);
        alert("Resource deleted successfully!");
        
        if (selectedResource && selectedResource.id === resourceId) {
          resetResourceForm();
        }
        
        await fetchResources();
      } catch (error) {
        console.error("Error deleting resource:", error);
        alert("Error deleting resource. Please try again.");
      }
    }
  };
  
  const toggleResourceFeature = async (resource) => {
    try {
      const resourceRef = doc(firestore, "resources", resource.id);
      await updateDoc(resourceRef, {
        featured: !resource.featured,
        lastUpdated: new Date().toISOString()
      });
      
      if (selectedResource && selectedResource.id === resource.id) {
        setResourceFormData({
          ...resourceFormData,
          featured: !resource.featured
        });
        setSelectedResource({
          ...selectedResource,
          featured: !resource.featured
        });
      }
      
      await fetchResources();
      alert(`Resource ${!resource.featured ? "featured" : "unfeatured"} successfully!`);
    } catch (error) {
      console.error("Error toggling resource feature status:", error);
      alert("Error updating resource. Please try again.");
    }
  };

  const getFilteredSignups = (role, searchText) => {
    return signups.filter(signup => {
      const matchesRole = role === "all" || 
        (role === "mentor" && signup.mentorshipRole?.toLowerCase() === "mentor") ||
        (role === "mentee" && signup.mentorshipRole?.toLowerCase() === "mentee");
        
      const matchesSearch = !searchText || 
        signup.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        signup.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        signup.major?.toLowerCase().includes(searchText.toLowerCase());
        
      return matchesRole && matchesSearch;
    });
  };
  // Stats calculations for dashboard
  const getMentorCount = () => signups.filter(s => s.mentorshipRole?.toLowerCase() === "mentor").length;
  const getMenteeCount = () => signups.filter(s => s.mentorshipRole?.toLowerCase() === "mentee").length;
  const getMatchedCount = () => {
    const uniqueMentees = new Set(mentorshipMatches.map(m => m.menteeId || m.mentee));
    return uniqueMentees.size;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>Admin Dashboard</h1>

      {/* Main Navigation */}
      <div style={styles.mainNav}>
        <button 
          style={activeSection === "overview" ? {...styles.mainNavButton, ...styles.activeNavButton} : styles.mainNavButton}
          onClick={() => setActiveSection("overview")}
        >
          Overview
        </button>
        <button 
          style={activeSection === "mentorship" ? {...styles.mainNavButton, ...styles.activeNavButton} : styles.mainNavButton}
          onClick={() => setActiveSection("mentorship")}
        >
          Mentorship
        </button>
        <button 
          style={activeSection === "users" ? {...styles.mainNavButton, ...styles.activeNavButton} : styles.mainNavButton}
          onClick={() => setActiveSection("users")}
        >
          Users
        </button>
        <button 
          style={activeSection === "stories" ? {...styles.mainNavButton, ...styles.activeNavButton} : styles.mainNavButton}
          onClick={() => setActiveSection("stories")}
        >
          Stories
        </button>
        <button 
          style={activeSection === "events" ? {...styles.mainNavButton, ...styles.activeNavButton} : styles.mainNavButton}
          onClick={() => setActiveSection("events")}
        >
          Events
        </button>
        <button 
          style={activeSection === "resources" ? {...styles.mainNavButton, ...styles.activeNavButton} : styles.mainNavButton}
          onClick={() => setActiveSection("resources")}
        >
          Resources
        </button>
      </div>

      {/* OVERVIEW SECTION */}
      {activeSection === "overview" && (
        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>Platform Overview</h2>
          
          <div style={styles.dashboardGrid}>
            <div style={styles.overviewCard}>
              <h3 style={styles.overviewCardTitle}>User Stats</h3>
              <div style={styles.overviewCardContent}>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{userCount}</span>
                  <span style={styles.statLabel}>Total Users</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{getMentorCount()}</span>
                  <span style={styles.statLabel}>Mentors</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{getMenteeCount()}</span>
                  <span style={styles.statLabel}>Mentees</span>
                </div>
              </div>
            </div>
            
            <div style={styles.overviewCard}>
              <h3 style={styles.overviewCardTitle}>Content Stats</h3>
              <div style={styles.overviewCardContent}>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{stories.length}</span>
                  <span style={styles.statLabel}>Stories</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{events.length}</span>
                  <span style={styles.statLabel}>Events</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{stories.filter(s => s.featured).length}</span>
                  <span style={styles.statLabel}>Featured</span>
                </div>
              </div>
            </div>
            
            <div style={styles.overviewCard}>
              <h3 style={styles.overviewCardTitle}>Mentorship Stats</h3>
              <div style={styles.overviewCardContent}>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{mentorshipMatches.length}</span>
                  <span style={styles.statLabel}>Matches</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{getMatchedCount()}</span>
                  <span style={styles.statLabel}>Matched Mentees</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{getMenteeCount() - getMatchedCount()}</span>
                  <span style={styles.statLabel}>Unmatched</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MENTORSHIP SECTION */}
      {activeSection === "mentorship" && (
        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>Mentorship Management</h2>
          
          {/* Mentorship Stats */}
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{getMentorCount()}</span>
              <span style={styles.statLabel}>Mentors</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{getMenteeCount()}</span>
              <span style={styles.statLabel}>Mentees</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{getMatchedCount()}</span>
              <span style={styles.statLabel}>Matched</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{getMenteeCount() - getMatchedCount()}</span>
              <span style={styles.statLabel}>Unmatched</span>
            </div>
          </div>

          {/* Settings Panel */}
          <div style={styles.settingsPanel}>
            <h3 style={styles.settingsTitle}>Mentorship Settings</h3>
            <div style={styles.settingsInfo}>
              <p>
                Last updated: {mentorshipSettings.lastUpdated 
                  ? new Date(mentorshipSettings.lastUpdated).toLocaleString() 
                  : "Never"}
              </p>
            </div>

            <div style={styles.settingRow}>
              <label style={styles.settingLabel}>
                Max Mentees Per Mentor:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxMenteesPerMentor}
                  onChange={(e) => setMaxMenteesPerMentor(parseInt(e.target.value))}
                  style={styles.settingInput}
                />
              </label>
            </div>

            {/* Mentorship Signup Toggle */}
            <div style={styles.settingRow}>
              <label style={styles.settingLabel}>
                <span style={styles.toggleLabel}>Mentorship Signups:</span>
                <div 
                  style={styles.toggleContainer}
                  onClick={toggleSignupStatus}
                >
                  <div 
                    style={{
                      ...styles.toggleSwitch,
                      ...(signupsEnabled ? styles.toggleSwitchActive : {})
                    }}
                  ></div>
                </div>
                <span style={styles.statusText}>
                  {signupsEnabled ? "Enabled" : "Disabled"}
                </span>
              </label>
              <div style={styles.settingDescription}>
                {signupsEnabled ? 
                  "Users can currently sign up for the mentorship program." : 
                  "Mentorship signups are currently closed."
                }
              </div>
            </div>

            <div style={styles.settingActionRow}>
              <button 
                onClick={updateMentorshipSettings}
                style={styles.secondaryButton}
              >
                Save Settings
              </button>
              <button 
                onClick={generateMatches} 
                style={styles.primaryButton} 
                disabled={generating}
              >
                {generating ? "Generating Matches..." : "Generate AI Matches"}
              </button>
            </div>
          </div>

          {/* Mentorship Tabs */}
          <div style={styles.tabsContainer}>
            <div style={styles.tabContainer}>
              <button 
                style={activeTab === "signups" ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
                onClick={() => setActiveTab("signups")}
              >
                Mentorship Signups
              </button>
              <button 
                style={activeTab === "matches" ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
                onClick={() => setActiveTab("matches")}
              >
                AI-Generated Matches
              </button>
              <button 
                style={activeTab === "manual" ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
                onClick={() => setActiveTab("manual")}
              >
                Manual Matching
              </button>
            </div>

            {/* Signups Tab Content */}
            {activeTab === "signups" && (
              <div>
                <div style={styles.filterBar}>
                  <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    style={styles.searchInput}
                  />
                  <select 
                    style={styles.filterDropdown}
                    value={filteredRole}
                    onChange={(e) => setFilteredRole(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="mentor">Mentors Only</option>
                    <option value="mentee">Mentees Only</option>
                  </select>
                </div>
                
                <div style={styles.list}>
                  {signups.length > 0 ? (
                    signups.map((signup) => (
                      <div key={signup.id} style={styles.card}>
                        <div style={styles.cardHeader}>
                          <h3 style={styles.cardTitle}>{signup.name || "Unknown User"}</h3>
                          <span style={{
                            ...styles.roleBadge, 
                            backgroundColor: signup.mentorshipRole?.toLowerCase() === "mentor" ? "#4299e1" : "#ed8936"
                          }}>
                            {signup.mentorshipRole ? signup.mentorshipRole.toUpperCase() : "UNKNOWN"}
                          </span>
                        </div>
                        <div style={styles.cardBody}>
                          <p><strong>Email:</strong> {signup.email || "No Email"}</p>
                          <p><strong>Major:</strong> {signup.major || "Not Provided"}</p>
                          <p><strong>Expectations:</strong> {signup.expectations || "No expectations provided"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyState}>
                      <p>No users have signed up for mentorship yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Matches Tab Content */}
            {activeTab === "matches" && (
              <div>
                <div style={styles.matchesHeader}>
                  <h3 style={styles.matchesTitle}>AI-Generated Matches ({mentorshipMatches.filter(m => !m.manuallyCreated).length})</h3>
                  <p style={styles.matchesSubtitle}>
                    Current setting: Maximum of <strong>{maxMenteesPerMentor}</strong> mentees per mentor
                  </p>
                </div>
                
                <div style={styles.list}>
                  {mentorshipMatches.filter(m => !m.manuallyCreated).length > 0 ? (
                    mentorshipMatches.filter(m => !m.manuallyCreated).map((match, index) => (
                      <div key={index} style={{
                        ...styles.matchCard,
                        ...(match.status === "approved" ? styles.approvedMatch : {}),
                        ...(match.status === "rejected" ? styles.rejectedMatch : {})
                      }}>
                        <div style={styles.matchPair}>
                          <div style={styles.matchPerson}>
                            <span style={styles.matchLabel}>Mentee</span>
                            <h3 style={styles.matchName}>{match.mentee || "No Name Found"}</h3>
                          </div>
                          <div style={styles.matchArrow}>→</div>
                          <div style={styles.matchPerson}>
                            <span style={styles.matchLabel}>Mentor</span>
                            <h3 style={styles.matchName}>{match.mentor || "No Name Found"}</h3>
                          </div>
                          {match.status && (
                            <div style={styles.matchStatusBadge}>
                              {match.status.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div style={styles.matchDetails}>
                          <p><strong>Match Reason:</strong> {match.matchReason || "No details available"}</p>
                          <div style={styles.compatibilityScore}>
                            <span>Compatibility:</span>
                            <div style={styles.scoreBar}>
                              <div 
                                style={{
                                  ...styles.scoreBarFill,
                                  width: `${match.compatibilityScore || 0}%`,
                                  backgroundColor: match.compatibilityScore > 70 ? '#48bb78' : 
                                                 match.compatibilityScore > 40 ? '#ecc94b' : '#f56565'
                                }}
                              ></div>
                            </div>
                            <span>{match.compatibilityScore || 0}%</span>
                          </div>
                          {match.isMockData && (
                            <p style={{ color: "orange", fontStyle: "italic", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                              Note: This is a mock match generated when AI matching was unavailable.
                            </p>
                          )}
                          
                          {/* Approval/Rejection Controls */}
                          {match.status === "pending" && (
                            <div style={styles.approvalControls}>
                              <button 
                                onClick={() => updateMatchStatus(match.id, "approved")}
                                style={styles.approveButton}
                              >
                                Approve Match
                              </button>
                              <button 
                                onClick={() => updateMatchStatus(match.id, "rejected")}
                                style={styles.rejectButton}
                              >
                                Reject Match
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyState}>
                      <p>No AI-generated mentorship matches found.</p>
                      <button 
                        onClick={generateMatches} 
                        style={{...styles.secondaryButton, marginTop: "10px"}}
                        disabled={generating}
                      >
                        Generate Matches Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manual Matching Tab Content */}
            {activeTab === "manual" && (
              <div>
                <div style={styles.manualMatchingContainer}>
                  <h3 style={styles.subsectionTitle}>Create Manual Match</h3>
                  
                  <div style={styles.twoColumnLayout}>
                    {/* Mentee Selection */}
                    <div style={styles.selectionColumn}>
                      <h4 style={styles.selectionTitle}>Select Mentee</h4>
                      <input 
                        type="text" 
                        placeholder="Search mentees..." 
                        style={styles.searchInput}
                        value={menteeFilterText}
                        onChange={(e) => setMenteeFilterText(e.target.value)}
                      />
                      
                      <div style={styles.selectionList}>
                        {getFilteredSignups("mentee", menteeFilterText).length > 0 ? (
                          getFilteredSignups("mentee", menteeFilterText).map((mentee) => (
                            <div 
                              key={mentee.id}
                              style={{
                                ...styles.selectionItem,
                                ...(selectedMentee && selectedMentee.id === mentee.id ? styles.selectedItem : {})
                              }}
                              onClick={() => setSelectedMentee(mentee)}
                            >
                              <h4 
                                style={styles.selectionItemTitle}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent selecting the mentee when clicking the name
                                  openUserDetailsModal(mentee, "mentee");
                                }}
                              >
                                <span style={styles.clickableName}>{mentee.name}</span>
                              </h4>
                              <p style={styles.selectionItemDetail}>{mentee.email}</p>
                              <p style={styles.selectionItemDetail}>Major: {mentee.major || "Not specified"}</p>
                            </div>
                          ))
                        ) : (
                          <p style={styles.emptySelectionMessage}>No mentees found</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Mentor Selection */}
                    <div style={styles.selectionColumn}>
                      <h4 style={styles.selectionTitle}>Select Mentor</h4>
                      <input 
                        type="text" 
                        placeholder="Search mentors..." 
                        style={styles.searchInput}
                        value={mentorFilterText}
                        onChange={(e) => setMentorFilterText(e.target.value)}
                      />
                      
                      <div style={styles.selectionList}>
                        {getFilteredSignups("mentor", mentorFilterText).length > 0 ? (
                          getFilteredSignups("mentor", mentorFilterText).map((mentor) => (
                            <div 
                              key={mentor.id}
                              style={{
                                ...styles.selectionItem,
                                ...(selectedMentor && selectedMentor.id === mentor.id ? styles.selectedItem : {})
                              }}
                              onClick={() => setSelectedMentor(mentor)}
                            >
                              <h4 
                                style={styles.selectionItemTitle}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent selecting the mentor when clicking the name
                                  openUserDetailsModal(mentor, "mentor");
                                }}
                              >
                                <span style={styles.clickableName}>{mentor.name}</span>
                              </h4>
                              <p style={styles.selectionItemDetail}>{mentor.email}</p>
                            </div>
                          ))
                        ) : (
                          <p style={styles.emptySelectionMessage}>No mentors found</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Match Creation Form */}
                  <div style={styles.matchCreationForm}>
                    <h4 style={styles.formSectionTitle}>Match Details</h4>
                    
                    <div style={styles.matchPreview}>
                      <div style={styles.matchPersonPreview}>
                        <span style={styles.matchLabel}>Mentee</span>
                        <h3 style={styles.matchName}>
                          {selectedMentee ? selectedMentee.name : "No mentee selected"}
                        </h3>
                      </div>
                      <div style={styles.matchArrow}>→</div>
                      <div style={styles.matchPersonPreview}>
                        <span style={styles.matchLabel}>Mentor</span>
                        <h3 style={styles.matchName}>
                          {selectedMentor ? selectedMentor.name : "No mentor selected"}
                        </h3>
                      </div>
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Match Reason (Optional)</label>
                      <textarea
                        style={styles.formTextarea}
                        placeholder="Explain reason for matching"
                        value={matchReason}
                        onChange={(e) => setMatchReason(e.target.value)}
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        Compatibility Score: {compatibilityScore}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={compatibilityScore}
                        onChange={(e) => setCompatibilityScore(parseInt(e.target.value))}
                        style={styles.scoreSlider}
                      />
                    </div>
                    
                    <button
                      style={styles.primaryButton}
                      onClick={createManualMatch}
                      disabled={!selectedMentee || !selectedMentor || isCreatingMatch}
                    >
                      {isCreatingMatch ? "Creating Match..." : "Create Match"}
                    </button>
                  </div>
                  
                  {/* Manual Matches List */}
                  <div style={styles.manualMatchesList}>
                    <h4 style={styles.subsectionTitle}>Manual Matches</h4>
                    
                    <div style={styles.list}>
                      {mentorshipMatches.filter(m => m.manuallyCreated).length > 0 ? (
                        mentorshipMatches.filter(m => m.manuallyCreated).map((match, index) => (
                          <div key={index} style={styles.matchCard}>
                            <div style={styles.matchPair}>
                              <div style={styles.matchPerson}>
                                <span style={styles.matchLabel}>Mentee</span>
                                <h3 style={styles.matchName}>{match.mentee}</h3>
                              </div>
                              <div style={styles.matchArrow}>→</div>
                              <div style={styles.matchPerson}>
                                <span style={styles.matchLabel}>Mentor</span>
                                <h3 style={styles.matchName}>{match.mentor}</h3>
                              </div>
                            </div>
                            <div style={styles.matchDetails}>
                              <p><strong>Reason:</strong> {match.matchReason}</p>
                              <div style={styles.compatibilityScore}>
                                <span>Compatibility:</span>
                                <div style={styles.scoreBar}>
                                  <div 
                                    style={{
                                      ...styles.scoreBarFill,
                                      width: `${match.compatibilityScore}%`,
                                      backgroundColor: match.compatibilityScore > 70 ? '#48bb78' : 
                                                     match.compatibilityScore > 40 ? '#ecc94b' : '#f56565'
                                    }}
                                  ></div>
                                </div>
                                <span>{match.compatibilityScore}%</span>
                              </div>
                              <p style={{ color: "#4299e1", fontStyle: "italic", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                                Manually created match
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={styles.emptyState}>
                          <p>No manual matches created yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* USERS SECTION */}
      {activeSection === "users" && (
        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>User Management</h2>
          
          <div style={styles.filterBar}>
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              style={styles.searchInput}
            />
            <select style={styles.filterDropdown}>
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
              <option value="inactive">Inactive Users</option>
            </select>
          </div>
          
          <div style={styles.usersTable}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Name</th>
                  <th style={styles.tableHeader}>Email</th>
                  <th style={styles.tableHeader}>Role</th>
                  <th style={styles.tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{user.firstName} {user.lastName}</td>
                      <td style={styles.tableCell}>{user.email}</td>
                      <td style={styles.tableCell}>{user.role || "Regular"}</td>
                      <td style={styles.tableCell}>
                        <button style={styles.actionButton}>View</button>
                        <button style={styles.actionButton}>Edit</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={styles.emptyTableMessage}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STORIES SECTION */}
      {activeSection === "stories" && (
        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>Stories Management</h2>
          
          <div style={styles.twoColumnLayout}>
            <div style={styles.leftColumn}>
              <div style={styles.storiesList}>
                <h3 style={styles.subsectionTitle}>Published Stories</h3>
                <div style={styles.filterBar}>
                  <input 
                    type="text" 
                    placeholder="Search stories..." 
                    style={styles.searchInput}
                  />
                </div>
                
                {stories.length > 0 ? (
                  stories.map((story) => (
                    <div 
                      key={story.id} 
                      style={{
                        ...styles.storyItem,
                        ...(selectedStory && selectedStory.id === story.id ? styles.selectedItem : {})
                      }}
                      onClick={() => selectStoryForEdit(story)}
                    >
                      <div style={styles.storyItemHeader}>
                        <h4 style={styles.storyItemTitle}>{story.title}</h4>
                        {story.featured && <span style={styles.featuredBadge}>Featured</span>}
                      </div>
                      <p style={styles.storyItemMeta}>By {story.author} on {new Date(story.publishDate).toLocaleDateString()}</p>
                      <p style={styles.storyItemPreview}>
                        {story.content && story.content.length > 100 
                          ? `${story.content.substring(0, 100)}...` 
                          : story.content || "No content provided"}
                      </p>
                      <div style={styles.storyItemActions}>
                        <button 
                          style={{
                            ...styles.actionButton, 
                            backgroundColor: story.featured ? "#fed7e2" : "#e6fffa",
                            color: story.featured ? "#d53f8c" : "#319795"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStoryFeature(story);
                          }}
                        >
                          {story.featured ? "Unfeature" : "Feature"}
                        </button>
                        <button 
                          style={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectStoryForEdit(story);
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          style={{...styles.actionButton, color: "#f56565"}}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteStory(story.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <p>No stories published yet.</p>
                  </div>
                )}
              </div>
            </div>
            <div style={styles.rightColumn}>
              <h3 style={styles.subsectionTitle}>
                {selectedStory ? "Edit Story" : "Create New Story"}
              </h3>
              <button 
                style={styles.resetFormButton}
                onClick={resetStoryForm}
              >
                + New Story
              </button>
              
              <form style={styles.form} onSubmit={saveStory}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={storyFormData.title}
                    onChange={handleStoryInputChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Author</label>
                  <input
                    type="text"
                    name="author"
                    value={storyFormData.author}
                    onChange={handleStoryInputChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Publish Date</label>
                  <input
                    type="date"
                    name="publishDate"
                    value={storyFormData.publishDate}
                    onChange={handleStoryInputChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Content</label>
                  <textarea
                    name="content"
                    value={storyFormData.content}
                    onChange={handleStoryInputChange}
                    style={styles.formTextarea}
                    rows="10"
                    required
                  ></textarea>
                </div>
                
                <div style={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={storyFormData.featured}
                    onChange={handleStoryInputChange}
                    id="featured"
                  />
                  <label htmlFor="featured" style={styles.checkboxLabel}>
                    Feature this story
                  </label>
                </div>
                
                <div style={styles.formActions}>
                  <button 
                    type="button" 
                    style={styles.secondaryButton}
                    onClick={resetStoryForm}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.primaryButton}>
                    {selectedStory ? "Update Story" : "Publish Story"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EVENTS SECTION */}
      {activeSection === "events" && (
        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>Events Management</h2>
          
          <div style={styles.twoColumnLayout}>
            <div style={styles.leftColumn}>
              <div style={styles.eventsList}>
                <h3 style={styles.subsectionTitle}>Upcoming & Past Events</h3>
                <div style={styles.filterBar}>
                  <input 
                    type="text" 
                    placeholder="Search events..." 
                    style={styles.searchInput}
                  />
                </div>
                
                {events.length > 0 ? (
                  events.map((event) => (
                    <div 
                      key={event.id} 
                      style={{
                        ...styles.eventItem,
                        ...(selectedEvent && selectedEvent.id === event.id ? styles.selectedItem : {})
                      }}
                      onClick={() => selectEventForEdit(event)}
                    >
                      <div style={styles.eventItemHeader}>
                        <h4 style={styles.eventItemTitle}>{event.title}</h4>
                        <span style={styles.eventDate}>
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={styles.eventLocation}>{event.location}</p>
                      <p style={styles.eventItemPreview}>
                        {event.description && event.description.length > 100 
                          ? `${event.description.substring(0, 100)}...` 
                          : event.description || "No description provided"}
                      </p>
                      <div style={styles.eventItemActions}>
                        <button 
                          style={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectEventForEdit(event);
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          style={{...styles.actionButton, color: "#f56565"}}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEvent(event.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <p>No events scheduled yet.</p>
                  </div>
                )}
              </div>
            </div>
            <div style={styles.rightColumn}>
              <h3 style={styles.subsectionTitle}>
                {selectedEvent ? "Edit Event" : "Create New Event"}
              </h3>
              <button 
                style={styles.resetFormButton}
                onClick={resetEventForm}
              >
                + New Event
              </button>
              
              <form style={styles.form} onSubmit={saveEvent}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Event Title</label>
                  <input
                    type="text"
                    name="title"
                    value={eventFormData.title}
                    onChange={handleEventInputChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={eventFormData.date}
                    onChange={handleEventInputChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={eventFormData.location}
                    onChange={handleEventInputChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Description</label>
                  <textarea
                    name="description"
                    value={eventFormData.description}
                    onChange={handleEventInputChange}
                    style={styles.formTextarea}
                    rows="6"
                    required
                  ></textarea>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Registration Link (Optional)</label>
                  <input
                    type="url"
                    name="registrationLink"
                    value={eventFormData.registrationLink}
                    onChange={handleEventInputChange}
                    style={styles.formInput}
                    placeholder="https://..."
                  />
                </div>
                
                <div style={styles.formActions}>
                  <button 
                    type="button" 
                    style={styles.secondaryButton}
                    onClick={resetEventForm}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.primaryButton}>
                    {selectedEvent ? "Update Event" : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

{activeSection === "resources" && (
  <div style={styles.sectionContainer}>
    <h2 style={styles.sectionTitle}>Resources Management</h2>
    
    <div style={styles.twoColumnLayout}>
      <div style={styles.leftColumn}>
        <div style={styles.resourcesList}>
          <h3 style={styles.subsectionTitle}>Published Resources</h3>
          <div style={styles.filterBar}>
            <input 
              type="text" 
              placeholder="Search resources..." 
              style={styles.searchInput}
            />
            <select style={styles.filterDropdown}>
              <option value="all">All Categories</option>
              {resourceCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          {resources.length > 0 ? (
            resources.map((resource) => (
              <div 
                key={resource.id} 
                style={{
                  ...styles.resourceItem,
                  ...(selectedResource && selectedResource.id === resource.id ? styles.selectedItem : {})
                }}
                onClick={() => selectResourceForEdit(resource)}
              >
                <div style={styles.resourceItemHeader}>
                  <h4 style={styles.resourceItemTitle}>{resource.title}</h4>
                  {resource.featured && <span style={styles.featuredBadge}>Featured</span>}
                </div>
                
                <div style={styles.resourceItemMeta}>
                  <span style={{
                    ...styles.categoryBadge,
                    backgroundColor: 
                      resource.category === 'scholarship' ? '#ebf8ff' :
                      resource.category === 'internship' ? '#e6fffa' :
                      resource.category === 'job' ? '#faf5ff' :
                      resource.category === 'academic' ? '#f0fff4' :
                      resource.category === 'financial' ? '#fffaf0' :
                      resource.category === 'campus' ? '#fff5f7' :
                      resource.category === 'community' ? '#f7fafc' : '#f7fafc',
                    color:
                      resource.category === 'scholarship' ? '#2b6cb0' :
                      resource.category === 'internship' ? '#2c7a7b' :
                      resource.category === 'job' ? '#6b46c1' :
                      resource.category === 'academic' ? '#2f855a' :
                      resource.category === 'financial' ? '#c05621' :
                      resource.category === 'campus' ? '#b83280' :
                      resource.category === 'community' ? '#4a5568' : '#4a5568'
                  }}>
                    {resourceCategories.find(cat => cat.value === resource.category)?.label || "Other"}
                  </span>
                  
                  <span style={styles.resourceDate}>
                    Added: {new Date(resource.publishDate).toLocaleDateString()}
                  </span>
                </div>
                
                {resource.createdBy && (
                  <p style={styles.createdByText}>
                    Created by: {resource.createdBy}
                  </p>
                )}
                
                <p style={styles.resourceItemPreview}>
                  {resource.description && resource.description.length > 100 
                    ? `${resource.description.substring(0, 100)}...` 
                    : resource.description || "No description provided"}
                </p>
                
                
                <div style={styles.resourceItemActions}>
                  <button 
                    style={{
                      ...styles.actionButton, 
                      backgroundColor: resource.featured ? "#fed7e2" : "#e6fffa",
                      color: resource.featured ? "#d53f8c" : "#319795"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleResourceFeature(resource);
                    }}
                  >
                    {resource.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button 
                    style={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectResourceForEdit(resource);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    style={{...styles.actionButton, color: "#f56565"}}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteResource(resource.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <p>No resources published yet.</p>
            </div>
          )}
        </div>
      </div>
      
      <div style={styles.rightColumn}>
        <h3 style={styles.subsectionTitle}>
          {selectedResource ? "Edit Resource" : "Add New Resource"}
        </h3>
        <button 
          style={styles.resetFormButton}
          onClick={resetResourceForm}
        >
          + New Resource
        </button>
        
        <form style={styles.form} onSubmit={saveResource}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Title</label>
            <input
              type="text"
              name="title"
              value={resourceFormData.title}
              onChange={handleResourceInputChange}
              style={styles.formInput}
              required
              placeholder="Resource title"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Category</label>
            <select
              name="category"
              value={resourceFormData.category}
              onChange={handleResourceInputChange}
              style={styles.formInput}
              required
            >
              {resourceCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Created By (First-Gen Student)</label>
            <input
              type="text"
              name="createdBy"
              value={resourceFormData.createdBy}
              onChange={handleResourceInputChange}
              style={styles.formInput}
              placeholder="Student name or 'Anonymous'"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Description</label>
            <textarea
              name="description"
              value={resourceFormData.description}
              onChange={handleResourceInputChange}
              style={styles.formTextarea}
              rows="5"
              required
              placeholder="Describe this resource"
            ></textarea>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>URL Link (Optional)</label>
            <input
              type="url"
              name="link"
              value={resourceFormData.link}
              onChange={handleResourceInputChange}
              style={styles.formInput}
              placeholder="https://..."
            />
            <span style={styles.formHelperText}>
              External link to resource website or application
            </span>
          </div>
          
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Publish Date</label>
            <input
              type="date"
              name="publishDate"
              value={resourceFormData.publishDate}
              onChange={handleResourceInputChange}
              style={styles.formInput}
              required
            />
          </div>
          
          <div style={styles.formCheckbox}>
            <input
              type="checkbox"
              name="featured"
              checked={resourceFormData.featured}
              onChange={handleResourceInputChange}
              id="resource-featured"
            />
            <label htmlFor="resource-featured" style={styles.checkboxLabel}>
              Feature this resource
            </label>
          </div>
          
          <div style={styles.formActions}>
            <button 
              type="button" 
              style={styles.secondaryButton}
              onClick={resetResourceForm}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={styles.primaryButton}
              disabled={uploadingResource}
            >
              {uploadingResource ? "Saving..." : (selectedResource ? "Update Resource" : "Publish Resource")}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
      {/* User Details Modal */}
      {showUserDetailsModal && selectedUserDetails && (
        <div style={styles.modalOverlay}>
          <div style={styles.userDetailsModal}>
            <div style={styles.userDetailsModalHeader}>
              <h2 style={styles.userDetailsModalTitle}>
                {selectedUserType === "mentor" ? "Mentor Details" : "Mentee Details"}
              </h2>
              <button 
                onClick={closeUserDetailsModal} 
                style={styles.closeModalButton}
              >
                ✕
              </button>
            </div>
            
            <div style={styles.userDetailsModalBody}>
              <div style={styles.userBasicInfo}>
                <h3 style={styles.userName}>{selectedUserDetails.name}</h3>
                <p style={styles.userEmail}>{selectedUserDetails.email}</p>
                <div style={styles.userBadges}>
                  {selectedUserDetails.major && (
                    <span style={styles.majorBadge}>{selectedUserDetails.major}</span>
                  )}
                  <span style={{
                    ...styles.roleBadge, 
                    backgroundColor: selectedUserType === "mentor" ? "#4299e1" : "#ed8936"
                  }}>
                    {selectedUserType === "mentor" ? "MENTOR" : "MENTEE"}
                  </span>
                </div>
              </div>
              
              <div style={styles.userResponsesSection}>
                <h3 style={styles.responsesTitle}>Application Responses</h3>
                
                {selectedUserType === "mentor" ? (
                  // Mentor-specific responses
                  <div style={styles.responsesGrid}>
                    <div style={styles.responseItem}>
                      <h4 style={styles.responseLabel}>Academic Interests</h4>
                      <p style={styles.responseText}>{selectedUserDetails.academicInterests || "Not provided"}</p>
                    </div>
                    
                    <div style={styles.responseItem}>
                      <h4 style={styles.responseLabel}>Extracurricular Activities</h4>
                      <p style={styles.responseText}>{selectedUserDetails.extracurriculars || "Not provided"}</p>
                    </div>
                    
                    <div style={styles.responseItem}>
                      <h4 style={styles.responseLabel}>Mentor Motivation</h4>
                      <p style={styles.responseText}>{selectedUserDetails.mentorMotivation || "Not provided"}</p>
                    </div>
                    
                    <div style={styles.responseItem}>
                      <h4 style={styles.responseLabel}>First-Gen Challenges</h4>
                      <p style={styles.responseText}>{selectedUserDetails.firstGenChallenges || "Not provided"}</p>
                    </div>
                    
                    <div style={styles.responseItem}>
                      <h4 style={styles.responseLabel}>Mentor Strengths</h4>
                      <p style={styles.responseText}>{selectedUserDetails.mentorStrengths || "Not provided"}</p>
                    </div>
                    
                    <div style={styles.responseItem}>
                      <h4 style={styles.responseLabel}>Communication Style</h4>
                      <p style={styles.responseText}>{selectedUserDetails.communicationStyle || "Not provided"}</p>
                    </div>
                    
                    <div style={styles.responseItem}>
                      <h4 style={styles.responseLabel}>Desired Support</h4>
                      <p style={styles.responseText}>{selectedUserDetails.desiredSupport || "Not provided"}</p>
                    </div>
                  </div>
                ) : (
                  // Mentee-specific responses
                  <div style={styles.responsesGrid}>
                    <div style={styles.responseItem}>
                      <h4 style={styles.responseLabel}>Career Goals</h4>
                      <p style={styles.responseText}>{selectedUserDetails.careerGoals || "Not provided"}</p>
                    </div>
                    
                    <div style={styles.responseItem}>
                      <h4 style={styles.responseLabel}>Experience Summary</h4>
                      <p style={styles.responseText}>{selectedUserDetails.experienceSummary || "Not provided"}</p>
                    </div>
                    
                    <div style={styles.responseItem}>
                      <h4 style={styles.responseLabel}>Challenges</h4>
                      <p style={styles.responseText}>{selectedUserDetails.challenges || "Not provided"}</p>
                    </div>
                  </div>
                )}
                
                {/* Common fields for both roles */}
                <div style={styles.responseItem}>
                  <h4 style={styles.responseLabel}>Expectations</h4>
                  <p style={styles.responseText}>{selectedUserDetails.expectations || "Not provided"}</p>
                </div>
                
                <div style={styles.responseItem}>
                  <h4 style={styles.responseLabel}>Additional Information</h4>
                  <p style={styles.responseText}>{selectedUserDetails.additionalInfo || "Not provided"}</p>
                </div>
              </div>
              
              <div style={styles.modalActions}>
                <button 
                  onClick={() => {
                    if (selectedUserType === "mentor") {
                      setSelectedMentor(selectedUserDetails);
                    } else {
                      setSelectedMentee(selectedUserDetails);
                    }
                    closeUserDetailsModal();
                  }}
                  style={styles.selectUserButton}
                >
                  Select as {selectedUserType === "mentor" ? "Mentor" : "Mentee"}
                </button>
                <button onClick={closeUserDetailsModal} style={styles.closeButton}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
=======
  const overrideMatch = async (userId) => {
    const newMatch = prompt(`Enter a new mentor/mentee match for user ${userId}:`);
    if (!newMatch) return;

    try {
      await updateDoc(doc(firestore, "mentorship_matches", userId), { matchResult: newMatch });
      alert("Mentorship match updated successfully!");
      setMentorshipMatches((prevMatches) =>
        prevMatches.map((match) =>
          match.id === userId ? { ...match, matchResult: newMatch } : match
        )
      );
    } catch (error) {
      console.error("Error updating match:", error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Mentorship Admin Dashboard</h1>

      {/* Generate Matches Button */}
      <button onClick={generateMatches} style={styles.generateButton} disabled={generating}>
        {generating ? "Generating Matches..." : "Generate AI Matches"}
      </button>

      {/* Section: Mentorship Signups */}
      <h2 style={styles.sectionTitle}>📋 Mentorship Signups</h2>
      <div style={styles.list}>
        {signups.length > 0 ? (
          signups.map((signup) => (
            <div key={signup.id} style={styles.card}>
              <h3>{signup.name || "Unknown User"}</h3>
              <p><strong>Email:</strong> {signup.email || "No Email"}</p>
              <p><strong>Role:</strong> {signup.mentorshipRole ? signup.mentorshipRole.toUpperCase() : "Not Provided"}</p>
              <p><strong>Major:</strong> {signup.major || "Not Provided"}</p>
              <p><strong>Expectations:</strong> {signup.expectations || "No expectations provided"}</p>
              <p><strong>Areas of Interest:</strong> {Array.isArray(signup.mentorshipAreas) ? signup.mentorshipAreas.join(", ") : "No areas specified"}</p>
            </div>
          ))
        ) : (
          <p>No mentorship signups yet.</p>
        )}
      </div>

      {/* Section: AI-Generated Mentorship Matches */}
      <h2 style={styles.sectionTitle}>🤖 AI-Generated Mentorship Matches</h2>
      <div style={styles.list}>
        {mentorshipMatches.length > 0 ? (
          mentorshipMatches.map((match) => (
            <div key={match.id} style={styles.card}>
              <h3><strong>Mentee:</strong> {match.mentee}</h3>
              <p><strong>Mentor:</strong> {match.mentor}</p>
              <p><strong>Match Details:</strong> {match.matchResult || "No details available"}</p>
              <button onClick={() => overrideMatch(match.id)} style={styles.overrideButton}>Override Match</button>
            </div>
          ))
        ) : (
          <p>No AI-generated mentorship matches yet.</p>
        )}
      </div>
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
    </div>
  );
};

<<<<<<< HEAD
// Combined styles including additional styles for user details modal
const styles = {
  // Main container and layout
  container: {
    maxWidth: "1200px",
    margin: "2rem auto",
    padding: "2rem",
    backgroundColor: "#f7fafc",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  mainTitle: {
    fontSize: "2.5rem",
    color: "#2d3748",
    marginBottom: "1.5rem",
    textAlign: "center",
    fontWeight: "700",
  },
  sectionContainer: {
    marginTop: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.8rem",
    color: "#2d3748",
    marginBottom: "1.5rem",
    fontWeight: "600",
  },
  subsectionTitle: {
    fontSize: "1.4rem",
    color: "#2d3748",
    marginBottom: "1rem",
    fontWeight: "600",
  },
  twoColumnLayout: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
  },
  leftColumn: {
    flex: "1",
    minWidth: "300px",
  },
  rightColumn: {
    flex: "1",
    minWidth: "300px",
  },
  categoryBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  
  // Main Navigation
  mainNav: {
    display: "flex",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    marginBottom: "2rem",
    overflow: "hidden",
  },
  mainNavButton: {
    flex: "1",
    padding: "1rem",
    backgroundColor: "transparent",
    border: "none",
    borderRight: "1px solid #e2e8f0",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "1rem",
    color: "#4a5568",
    transition: "all 0.2s",
  },
  activeNavButton: {
    backgroundColor: "#ebf8ff",
    color: "#2b6cb0",
    fontWeight: "600",
  },
  
  // Dashboard Overview
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
    marginTop: "1.5rem",
  },
  overviewCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  overviewCardTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#2d3748",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    margin: "0",
  },
  overviewCardContent: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  statItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Stats & Cards
  statsContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  statCard: {
    flex: "1",
    minWidth: "150px",
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    fontSize: "2.2rem",
    fontWeight: "bold",
    color: "#2b6cb0",
    marginBottom: "0.5rem",
  },
  statLabel: {
    fontSize: "1rem",
    color: "#4a5568",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "1rem 1.5rem",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    margin: "0",
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#2d3748",
  },
  cardBody: {
    padding: "1.5rem",
  },
  roleBadge: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "white",
  },
  
  // Mentorship Settings
  settingsPanel: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    marginBottom: "2rem",
  },
  settingsTitle: {
    fontSize: "1.3rem",
    color: "#2d3748",
    marginBottom: "1rem",
    fontWeight: "600",
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1rem",
    flexWrap: "wrap",
    gap: "15px",
  },
  settingLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "1rem",
    color: "#4a5568",
    marginRight: "1rem",
    flexWrap: "wrap",
    gap: "10px",
  },
  settingInput: {
    width: "80px",
    padding: "0.5rem",
    marginLeft: "10px",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
  },
  
  // Tabs
  tabsContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  tabContainer: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
  },
  tabButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "1rem",
    color: "#4a5568",
    transition: "all 0.2s",
  },
  activeTab: {
    color: "#2b6cb0",
    borderBottom: "3px solid #2b6cb0",
    fontWeight: "600",
  },
  
  // Filter & Search
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1rem",
    gap: "10px",
  },
  searchInput: {
    flex: "1",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "1rem",
  },
  filterDropdown: {
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    backgroundColor: "white",
    fontSize: "1rem",
    minWidth: "150px",
  },
  
  // Matches
  matchesHeader: {
    margin: "1.5rem",
  },
  matchesTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 0.5rem 0",
  },
  matchesSubtitle: {
    fontSize: "0.9rem",
    color: "#718096",
    margin: "0",
  },
  matchCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    padding: "1.5rem",
  },
  matchPair: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    flexWrap: "wrap",
    gap: "10px",
  },
  matchPerson: {
    flex: "1",
    minWidth: "200px",
  },
  matchLabel: {
    display: "block",
    fontSize: "0.875rem",
    color: "#718096",
    marginBottom: "0.25rem",
  },
  matchName: {
    margin: "0",
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#2d3748",
  },
  matchArrow: {
    fontSize: "1.5rem",
    color: "#718096",
    margin: "0 1rem",
  },
  matchDetails: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: "1rem",
  },
  compatibilityScore: {
    display: "flex",
    alignItems: "center",
    marginTop: "0.75rem",
    gap: "10px",
  },
  scoreBar: {
    flex: "1",
    height: "8px",
    backgroundColor: "#edf2f7",
    borderRadius: "9999px",
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
  },
  
  // Users Table
  usersTable: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    overflow: "hidden",
    marginTop: "1rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    textAlign: "left",
    padding: "1rem",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    color: "#4a5568",
    fontWeight: "600",
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
  },
  tableCell: {
    padding: "1rem",
  },
  statusBadge: {
    display: "inline-block",
    padding: "0.25rem 0.5rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "white",
  },
  emptyTableMessage: {
    padding: "2rem",
    textAlign: "center",
    color: "#a0aec0",
  },
  
  // Stories & Events List
  storiesList: {
    marginBottom: "2rem",
  },
  storyItem: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    padding: "1rem",
    marginBottom: "1rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  storyItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  storyItemTitle: {
    margin: "0",
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#2d3748",
  },
  storyItemMeta: {
    fontSize: "0.875rem",
    color: "#718096",
    margin: "0 0 0.5rem 0",
  },
  storyItemPreview: {
    margin: "0 0 1rem 0",
    color: "#4a5568",
    fontSize: "0.9rem",
  },
  storyItemActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
  },
  featuredBadge: {
    backgroundColor: "#9f7aea",
    color: "white",
    padding: "0.25rem 0.5rem",
    borderRadius: "9999px",
    fontSize: "0.7rem",
    fontWeight: "600",
  },
  eventsList: {
    marginBottom: "2rem",
  },
  eventItem: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    padding: "1rem",
    marginBottom: "1rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  eventItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  eventItemTitle: {
    margin: "0",
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#2d3748",
  },
  eventDate: {
    backgroundColor: "#4299e1",
    color: "white",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  eventLocation: {
    fontSize: "0.875rem",
    color: "#718096",
    margin: "0 0 0.5rem 0",
  },
  eventItemPreview: {
    margin: "0 0 1rem 0",
    color: "#4a5568",
    fontSize: "0.9rem",
  },
  eventItemActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
  },
  selectedItem: {
    border: "2px solid #4299e1",
    boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.5)",
  },
  
  // Forms
  form: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    padding: "1.5rem",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  formLabel: {
    display: "block",
    marginBottom: "0.5rem",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#4a5568",
  },
  formInput: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "1rem",
  },
  formTextarea: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "1rem",
    resize: "vertical",
  },
  formCheckbox: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  checkboxLabel: {
    marginLeft: "0.5rem",
    fontSize: "0.9rem",
    color: "#4a5568",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
  },
  resetFormButton: {
    marginBottom: "1rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#ebf8ff",
    color: "#2b6cb0",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "0.9rem",
    display: "inline-block",
  },
  
  // Manual matching specific styles
  manualMatchingContainer: {
    padding: "1.5rem",
  },
  selectionColumn: {
    flex: "1",
    minWidth: "300px",
  },
  selectionTitle: {
    fontSize: "1.1rem",
    color: "#2d3748",
    marginBottom: "1rem",
    fontWeight: "500",
  },
  selectionList: {
    marginTop: "1rem",
    maxHeight: "400px",
    overflowY: "auto",
    backgroundColor: "#f7fafc",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  selectionItem: {
    padding: "1rem",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  selectionItemTitle: {
    fontSize: "1.1rem",
    color: "#2d3748",
    margin: "0 0 0.5rem 0",
    fontWeight: "500",
  },
  selectionItemDetail: {
    fontSize: "0.875rem",
    color: "#718096",
    margin: "0 0 0.25rem 0",
  },
  emptySelectionMessage: {
    padding: "1.5rem",
    textAlign: "center",
    color: "#a0aec0",
  },
  matchCreationForm: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    padding: "1.5rem",
    marginTop: "2rem",
  },
  formSectionTitle: {
    fontSize: "1.2rem",
    color: "#2d3748",
    marginBottom: "1rem",
    fontWeight: "600",
  },
  matchPreview: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderRadius: "6px",
    padding: "1rem",
    marginBottom: "1.5rem",
  },
  matchPersonPreview: {
    flex: "1",
  },
  scoreSlider: {
    width: "100%",
    margin: "0.5rem 0",
  },
  manualMatchesList: {
    marginTop: "2rem",
  },
  
  // Buttons
  primaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#2b6cb0",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "1rem",
    transition: "background-color 0.2s",
  },
  secondaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#4a5568",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "0.9rem",
    transition: "background-color 0.2s",
  },
  actionButton: {
    padding: "0.4rem 0.75rem",
    backgroundColor: "#edf2f7",
    color: "#4a5568",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "0.8rem",
  },
  approveButton: {
    backgroundColor: "#48bb78",
    color: "white",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "6px",
    fontWeight: "500",
    fontSize: "0.9rem",
    cursor: "pointer",
    marginRight: "0.5rem",
  },
  rejectButton: {
    backgroundColor: "#f56565",
    color: "white",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "6px",
    fontWeight: "500",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  
  // Empty State
  emptyState: {
    textAlign: "center",
    padding: "3rem 0",
    color: "#718096",
  },
  
  // Loading
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "300px",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#2b6cb0",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
  
  // Toggle styles
  toggleLabel: {
    marginRight: "10px",
  },
  toggleContainer: {
    width: "50px",
    height: "24px",
    backgroundColor: "#e2e8f0",
    borderRadius: "12px",
    position: "relative",
    cursor: "pointer",
    display: "inline-block",
    verticalAlign: "middle",
    margin: "0 10px",
  },
  toggleSwitch: {
    width: "20px",
    height: "20px",
    backgroundColor: "#a0aec0",
    borderRadius: "50%",
    position: "absolute",
    top: "2px",
    left: "2px",
    transition: "all 0.2s",
  },
  toggleSwitchActive: {
    backgroundColor: "#4299e1",
    left: "28px",
  },
  statusText: {
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: "0.9rem",
    color: "#718096",
    marginTop: "5px",
    marginLeft: "10px",
  },
  settingActionRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
  },
  
  // New styles for user details modal
  clickableName: {
    textDecoration: "underline",
    cursor: "pointer",
    color: "#2b6cb0"
  },
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
    zIndex: 1000
  },
  userDetailsModal: {
    backgroundColor: "white",
    borderRadius: "10px",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
  },
  userDetailsModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    borderBottom: "1px solid #e2e8f0"
  },
  userDetailsModalTitle: {
    fontSize: "1.5rem",
    color: "#1a365d",
    fontWeight: "600",
    margin: 0
  },
  closeModalButton: {
    backgroundColor: "transparent",border: "none",
    color: "#718096",
    fontSize: "1.25rem",
    cursor: "pointer",
    padding: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    width: "32px",
    height: "32px"
  },
  userDetailsModalBody: {
    padding: "1.5rem"
  },
  userBasicInfo: {
    marginBottom: "2rem",
    padding: "1rem",
    backgroundColor: "#f7fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0"
  },
  userName: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 0.5rem 0"
  },
  userEmail: {
    fontSize: "1rem",
    color: "#4a5568",
    margin: "0 0 1rem 0"
  },
  userBadges: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap"
  },
  majorBadge: {
    backgroundColor: "#ebf8ff",
    color: "#2b6cb0",
    padding: "0.35rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.875rem",
    fontWeight: "500"
  },
  userResponsesSection: {
    marginBottom: "1.5rem"
  },
  responsesTitle: {
    fontSize: "1.25rem",
    color: "#1a365d",
    fontWeight: "600",
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid #e2e8f0"
  },
  responsesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
    marginBottom: "1.5rem"
  },
  responseItem: {
    marginBottom: "1.5rem",
    backgroundColor: "white",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0"
  },
  responseLabel: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "0.5rem"
  },
  responseText: {
    fontSize: "0.95rem",
    color: "#4a5568",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap"
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "1rem"
  },
  selectUserButton: {
    backgroundColor: "#2b6cb0",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    border: "none",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer"
  },
  
  closeButton: {
    backgroundColor: "#e2e8f0",
    color: "#4a5568",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    border: "none",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer"
  }
  
};

export default AdminDashboard;
=======
/** 🔹 Styles */
const styles = {
  container: { maxWidth: "900px", margin: "2rem auto", padding: "2rem", textAlign: "center" },
  title: { fontSize: "1.8rem", color: "#1a365d", marginBottom: "1rem" },
  generateButton: {
    backgroundColor: "#FED102", color: "#1a365d", padding: "10px", borderRadius: "6px", fontSize: "1rem",
    fontWeight: "bold", cursor: "pointer", marginBottom: "1rem", border: "none"
  },
  sectionTitle: { fontSize: "1.5rem", margin: "1rem 0", color: "#1a365d" },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  card: { padding: "15px", borderRadius: "6px", backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", textAlign: "left" },
  overrideButton: {
    marginTop: "10px", padding: "8px", backgroundColor: "#e63946", color: "white", border: "none",
    borderRadius: "6px", cursor: "pointer"
  }
};

export default AdminDashboard;

>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
