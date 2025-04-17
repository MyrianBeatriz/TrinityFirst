import React, { useState, useEffect } from "react";

import { auth, firestore } from "../firebase"; // Removed storage import
import { useNavigate } from "react-router-dom";

const MentorshipSignup = () => {
  const navigate = useNavigate();
  const [mentorshipRole, setMentorshipRole] = useState("");

  // Common fields for both roles
  const [expectations, setExpectations] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [challenges, setChallenges] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [major, setMajor] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Duplicate signup prevention states
  const [hasExistingSignup, setHasExistingSignup] = useState(false);
  const [existingRole, setExistingRole] = useState(null);
  const [signupError, setSignupError] = useState(null);
  
  // Mentor specific fields
  const [academicInterests, setAcademicInterests] = useState("");
  const [extracurriculars, setExtracurriculars] = useState("");
  const [mentorMotivation, setMentorMotivation] = useState("");
  const [firstGenChallenges, setFirstGenChallenges] = useState("");
  const [mentorStrengths, setMentorStrengths] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [desiredSupport, setDesiredSupport] = useState("");
  const [mentorTopics, setMentorTopics] = useState({
    collegeLife: false,
    studySkills: false,
    campusResources: false,
    careerExploration: false,
    financialAid: false,
    buildingConfidence: false
  });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [processingContent, setProcessingContent] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  // Function to check if a user has an existing signup
  const checkExistingSignup = async (userId) => {
    try {
      // Get API URL from environment with fallback to localhost
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      
      const response = await fetch(`${apiUrl}/check-signup-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ userId }),
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return {
        exists: data.exists || false,
        role: data.role || null,
        error: data.error || null
      };
    } catch (error) {
      console.error("Error checking signup status:", error);
      return {
        exists: false,
        role: null,
        error: error.message
      };
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const user = auth.currentUser;
        if (!user) {
          console.log("No authenticated user found, redirecting to login");
          navigate("/login");
          return;
        }
        
        console.log("Checking mentorship signup status for user:", user.uid);
        
        // Check URL parameters for context
        const urlParams = new URLSearchParams(window.location.search);
        const fromRejected = urlParams.get("fromRejected") === "true";
        
        if (fromRejected) {
          console.log("User is coming from a rejected match, allowing new signup");
          setHasExistingSignup(false);
          setExistingRole(null);
        } else {
          // Normal flow - check if user already has a signup
          const { exists, role, error } = await checkExistingSignup(user.uid);
          
          if (error) {
            console.error("Error checking signup status:", error);
            // Just log the error but don't show it to the user
            // Default to allowing signup in case of errors
            setHasExistingSignup(false);
          } else if (exists) {
            console.log(`User has already signed up as a ${role || "participant"}`);
            setHasExistingSignup(true);
            setExistingRole(role);
          } else {
            console.log("User has not signed up for mentorship program yet");
            setHasExistingSignup(false);
          }
        }
  
        // Fetch user profile data from Firestore
        try {
          const userRef = firestore.collection("users").doc(user.uid);
          const userSnap = await userRef.get();
    
          if (userSnap.exists) {
            setMajor(userSnap.data().major || "");
            console.log("Loaded user data from Firestore");
          } else {
            console.log("No user profile found in Firestore");
          }
        } catch (profileError) {
          console.error("Error fetching user profile:", profileError);
          // Continue anyway to allow signup even without profile data
        }
  
        setLoading(false);
      } catch (error) {
        console.error("Error in fetchUserData:", error);
        setLoading(false);
        // Error handling is now silent to the user - just log to console
      }
    };
  
    fetchUserData();
  }, [navigate]);

  const handleTopicChange = (topic) => {
    setMentorTopics(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  // New file handling approach - direct file processing without Firebase Storage
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setResumeFile(file);
    
    // Ask user if they want to generate content
    if (window.confirm("Would you like to use AI to generate application responses based on your resume?")) {
      await processFileWithAI(file);
    }
  };

  // Process file directly without Firebase Storage
  const processFileWithAI = async (file) => {
    setProcessingContent(true);
    
    try {
      // Validate file type before processing
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: PDF, DOCX, DOC, TXT`);
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size: 5MB`);
      }

      // Create a FormData object to send the file directly
      const formData = new FormData();
      formData.append('file', file);
      
      // Sanitize userId before sending
      const userId = auth.currentUser?.uid || 'anonymous';
      if (userId !== 'anonymous' && !/^[a-zA-Z0-9_-]+$/.test(userId)) {
        throw new Error('Invalid user ID format');
      }
      formData.append('userId', userId);
      
      // Add mentorship role to request
      if (!mentorshipRole) {
        throw new Error('Please select a mentorship role first');
      }
      formData.append('role', mentorshipRole);
      
      console.log("Sending file for AI processing...");
      
      // Use API_URL from environment variables
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      const response = await fetch(`${apiUrl}/process-file`, {
        method: "POST",
        body: formData,
        credentials: 'same-origin' // For cookies if using session-based auth
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Validate the response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      console.log("AI generated content received");
      setAiSuggestions(result);
      
      // Ask user if they want to use the suggestions
      const useAiContent = window.confirm(
        "AI has generated content based on your resume. Would you like to use these suggestions?"
      );
      
      if (useAiContent) {
        applyAllSuggestions(result);
      }
    } catch (error) {
      console.error("Error processing file with AI:", error);
      alert(`Error: ${error.message || "Unknown error"}`);
    }
    
    setProcessingContent(false);
  };

  // Process LinkedIn profile
  const processLinkedInProfile = async () => {
    if (!linkedinProfile || !linkedinProfile.includes("linkedin.com")) {
      alert("Please enter a valid LinkedIn profile URL");
      return;
    }
    
    if (!mentorshipRole) {
      alert("Please select a mentorship role first");
      return;
    }
    
    setProcessingContent(true);
    
    try {
      // Use API URL from environment variables
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      
      const response = await fetch(`${apiUrl}/extract-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "linkedin",
          contentUrl: linkedinProfile,
          userId: auth.currentUser?.uid || "anonymous",
          role: mentorshipRole
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      setAiSuggestions(result);
      
      const useAiContent = window.confirm(
        "AI has generated content based on your LinkedIn profile. Would you like to use these suggestions?"
      );
      
      if (useAiContent) {
        applyAllSuggestions(result);
      }
    } catch (error) {
      console.error("LinkedIn processing failed:", error);
      alert("Could not analyze LinkedIn profile. Please fill the form manually.");
    }
    
    setProcessingContent(false);
  };

  // Apply all AI suggestions at once
  const applyAllSuggestions = (suggestions) => {
    if (!suggestions) return;
    
    // Apply common fields
    if (suggestions.expectations) setExpectations(suggestions.expectations);
    if (suggestions.additionalInfo) setAdditionalInfo(suggestions.additionalInfo);
    
    if (mentorshipRole === "Mentor") {
      // Apply mentor-specific fields
      if (suggestions.academicInterests) setAcademicInterests(suggestions.academicInterests);
      if (suggestions.mentorMotivation) setMentorMotivation(suggestions.mentorMotivation);
      if (suggestions.firstGenChallenges) setFirstGenChallenges(suggestions.firstGenChallenges);
      if (suggestions.mentorStrengths) setMentorStrengths(suggestions.mentorStrengths);
      if (suggestions.communicationStyle) setCommunicationStyle(suggestions.communicationStyle);
      if (suggestions.extracurriculars) setExtracurriculars(suggestions.extracurriculars);
      if (suggestions.desiredSupport) setDesiredSupport(suggestions.desiredSupport);
    } else {
      // Apply mentee fields
      if (suggestions.careerGoals) setCareerGoals(suggestions.careerGoals);
      if (suggestions.experienceSummary) setExperienceSummary(suggestions.experienceSummary);
      if (suggestions.challenges) setChallenges(suggestions.challenges);
    }
  };

  // Handle form submission
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      alert("You must be logged in to sign up for mentorship. Redirecting to login...");
      navigate("/login");
      return;
    }

    // Add special handling for submission with existing signup
    if (hasExistingSignup) {
      console.log(`User already signed up as: ${existingRole}`);
      
      // If application was rejected, we'll still allow a new submission
      // Check for rejection in URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const fromRejected = urlParams.get("fromRejected") === "true";
      
      if (fromRejected) {
        console.log("User is reapplying after rejection, allowing submission");
        // Continue with submission...
      } else {
        alert(`You have already signed up as a ${existingRole || "participant"} in the mentorship program.`);
        return; // Exit the function early, preventing submission
      }
    }
    
    // Validate required fields based on role
    if (!mentorshipRole) {
      alert("Please select a role (Mentor or Mentee)");
      return;
    }
    
    console.log(`Validating fields for role: ${mentorshipRole}`);
    
    // Collect missing fields for better error messages
    let missingFields = [];
    
    // Common fields
    if (!major) missingFields.push("Major");
    
    if (mentorshipRole === "Mentor") {
      if (!academicInterests) missingFields.push("Academic interests");
      if (!mentorMotivation) missingFields.push("Motivation for being a mentor");
      if (!firstGenChallenges) missingFields.push("First-generation challenges");
      if (!mentorStrengths) missingFields.push("Mentor strengths");
      if (!communicationStyle) missingFields.push("Communication style");
      if (!desiredSupport) missingFields.push("Desired support");
      
      // Check if at least one topic is selected
      const hasSelectedTopic = Object.values(mentorTopics).some(value => value === true);
      if (!hasSelectedTopic) {
        missingFields.push("At least one mentoring topic");
      }
    } else {
      // Mentee validation
      if (!expectations) missingFields.push("Expectations");
      if (!careerGoals) missingFields.push("Career goals");
      if (!challenges) missingFields.push("Challenges");
      if (!experienceSummary) missingFields.push("Experience summary");
    }
    
    // If validation fails, show detailed error message
    if (missingFields.length > 0) {
      console.warn("Form validation failed. Missing fields:", missingFields);
      alert(`Please fill in the following required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }
    
    console.log("Form validation passed. Proceeding with submission.");
    
    console.log("Proceeding with mentorship signup submission");

    // Base mentorship data
    const mentorshipData = {
      userId: user.uid,
      mentorshipRole,
      expectations,
      linkedinProfile,
      major,
      hasResume: resumeFile !== null,
      additionalInfo,
      submittedAt: new Date().toISOString()
    };

    // Add role-specific data
    if (mentorshipRole === "Mentor") {
      Object.assign(mentorshipData, {
        academicInterests,
        extracurriculars,
        mentorMotivation,
        firstGenChallenges,
        mentorStrengths,
        communicationStyle,
        desiredSupport,
        mentorTopics
      });
    } else {
      Object.assign(mentorshipData, {
        careerGoals,
        challenges,
        experienceSummary
      });
    }

    try {
      setLoading(true);
      
      console.log("Saving mentorship signup to Firestore...");
      
      // Save to Firestore first
      try {
        await firestore.collection("mentorship_signups").doc(user.uid).set(mentorshipData);
        console.log("Successfully saved to Firestore");
      } catch (firestoreError) {
        console.error("Error saving to Firestore:", firestoreError);
        throw new Error(`Database error: ${firestoreError.message}`);
      }

      // Send file separately if exists
      if (resumeFile) {
        console.log("Uploading resume file...");
        const formData = new FormData();
        formData.append('file', resumeFile);
        formData.append('userId', user.uid);
        
        // Use API URL from environment variables
        const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
        
        try {
          const fileResponse = await fetch(`${apiUrl}/save-resume`, {
            method: "POST",
            body: formData,
          });
          
          if (!fileResponse.ok) {
            console.warn(`Resume upload status: ${fileResponse.status}`);
            console.warn("Resume upload failed, but continuing with signup");
          } else {
            console.log("Resume uploaded successfully");
          }
        } catch (fileError) {
          console.warn("Error uploading resume:", fileError);
          // Continue anyway - file upload is optional
        }
      }

      // Get CSRF token if needed (could be implemented server-side)
      const csrfToken = localStorage.getItem('csrfToken');
      
      // Add CSRF token to request data if available
      if (csrfToken) {
        mentorshipData.csrfToken = csrfToken;
      }
      
      // Use API URL from environment variables
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      
      console.log(`Sending data to matching API at ${apiUrl}/match`);
      
      // Send data to the AI Matching API
      try {
        const response = await fetch(`${apiUrl}/match`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest" // Helps prevent CSRF
          },
          credentials: 'same-origin', // For cookies if using session-based auth
          body: JSON.stringify(mentorshipData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error: ${response.status} - ${errorText}`);
          throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("API match result:", result);

        // Success! Show message and navigate to dashboard
        setLoading(false);
        
        // Show a more informative success message
        const successMessage = result.matchResult || "Your application has been received.";
        alert(`Mentorship signup successful! ${successMessage}\n\nYou'll be redirected to your dashboard.`);
        
        // Add a small delay before redirecting for better user experience
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } catch (apiError) {
        console.error("Error calling matching API:", apiError);
        
        // Even if API fails, the data is already in Firestore
        setLoading(false);
        alert("Your application has been saved, but there was an error with the matching service. Your application will be processed manually.");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error in signup process:", error);
      setLoading(false);
      alert(`There was an error submitting your application: ${error.message}. Please try again.`);
    }
  };

  if (loading) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      minHeight: '300px',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '1.2rem',
        color: '#1a365d',
        marginBottom: '1rem'
      }}>
        Processing your mentorship application...
      </div>
      <div style={{
        width: '50px',
        height: '50px',
        border: '5px solid #e2e8f0',
        borderTopColor: '#1a365d',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}></div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Join the Mentorship Program</h1>
      <p style={styles.description}>Sign up as a mentor or mentee and share your thoughts to find the best match.</p>

      {/* Error Message - removed as requested */}
    {/* Existing Signup Alert */}
    {hasExistingSignup && (
      <div style={styles.alertBox}>
        <p style={styles.alertText}>
          You have already signed up as a {existingRole || "participant"} in the mentorship program. 
          You cannot submit another application.
        </p>
        <button 
          style={styles.dashboardButton} 
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    )}

      <form 
        onSubmit={handleSignup} 
        style={{
          ...styles.form,
          opacity: hasExistingSignup ? 0.7 : 1,
          pointerEvents: hasExistingSignup ? "none" : "auto"
        }}
      >

      
        {/* Mentorship Role */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Are you signing up as a mentor or mentee?</label>
          <select 
            value={mentorshipRole} 
            onChange={(e) => setMentorshipRole(e.target.value)} 
            required 
            style={styles.input}
          >
            <option value="">Select Role</option>
            <option value="Mentee">Mentee</option>
            <option value="Mentor">Mentor</option>
          </select>
        </div>


        {mentorshipRole && !hasExistingSignup && (
          <>
            {/* AI Content Sources Section */}
            <div style={styles.aiSourcesContainer}>
              <h3 style={styles.sourceTitle}>Generate Application Content with AI</h3>
              <p style={styles.helperText}>Choose one of these options to let AI help you fill out the application</p>
              
              {/* Resume Upload Option - Direct File Processing */}
              <div style={styles.aiSourceOption}>
                <h4 style={styles.optionTitle}>Option 1: Resume Upload</h4>
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt" 
                  onChange={handleFileSelect} 
                  style={styles.fileInput} 
                />
                {resumeFile && <p style={styles.successText}>File selected: {resumeFile.name}</p>}
              </div>
              
              {/* LinkedIn Option */}
              <div style={styles.aiSourceOption}>
                <h4 style={styles.optionTitle}>Option 2: LinkedIn Profile</h4>
                <div style={styles.inputGroup}>
                  <input 
                    type="url" 
                    value={linkedinProfile} 
                    onChange={(e) => setLinkedinProfile(e.target.value)} 
                    placeholder="https://linkedin.com/in/your-profile" 
                    style={styles.input} 
                  />
                  <button 
                    type="button" 
                    onClick={processLinkedInProfile} 
                    disabled={!linkedinProfile || processingContent}
                    style={styles.actionButton}
                  >
                    Analyze
                  </button>
                </div>
              </div>
              
              {processingContent && <p style={styles.statusText}>Analyzing your information with AI...</p>}
              {aiSuggestions && (
                <div style={styles.suggestionControls}>
                  <p style={styles.successText}>AI content generated! Content is ready to use.</p>
                </div>
              )}
            </div>

            {/* Render different form fields based on role */}
            {mentorshipRole === "Mentor" ? (
              // MENTOR SPECIFIC FIELDS
              <>
                {/* Academic Interests and Career Goals */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    What are your academic interests and career goals?
                  </label>
                  <textarea 
                    value={academicInterests} 
                    onChange={(e) => setAcademicInterests(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* Extracurricular Activities */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    What extracurricular activities, clubs, or organizations are you involved in?
                  </label>
                  <textarea 
                    value={extracurriculars} 
                    onChange={(e) => setExtracurriculars(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* Mentor Motivation */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Why do you want to be a mentor in this program?
                  </label>
                  <textarea 
                    value={mentorMotivation} 
                    onChange={(e) => setMentorMotivation(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* First-Gen Challenges */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    What challenges did you face as a first-generation student that you want to help others navigate?
                  </label>
                  <textarea 
                    value={firstGenChallenges} 
                    onChange={(e) => setFirstGenChallenges(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* Mentor Strengths */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    What strengths do you bring as a mentor?
                  </label>
                  <textarea 
                    value={mentorStrengths} 
                    onChange={(e) => setMentorStrengths(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* Communication Style */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    How would you describe your communication and leadership style?
                  </label>
                  <textarea 
                    value={communicationStyle} 
                    onChange={(e) => setCommunicationStyle(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* Desired Support */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    What kind of support do you wish you had when you started college?
                  </label>
                  <textarea 
                    value={desiredSupport} 
                    onChange={(e) => setDesiredSupport(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* Mentoring Topics */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    What topics do you feel most comfortable guiding a mentee on? (Check all that apply)
                  </label>
                  <div style={styles.checkboxGroup}>
                    <div style={styles.checkboxItem}>
                      <input 
                        type="checkbox"
                        id="collegeLife"
                        checked={mentorTopics.collegeLife}
                        onChange={() => handleTopicChange('collegeLife')}
                      />
                      <label htmlFor="collegeLife">Navigating college life</label>
                    </div>
                    <div style={styles.checkboxItem}>
                      <input 
                        type="checkbox"
                        id="studySkills"
                        checked={mentorTopics.studySkills}
                        onChange={() => handleTopicChange('studySkills')}
                      />
                      <label htmlFor="studySkills">Study skills & time management</label>
                    </div>
                    <div style={styles.checkboxItem}>
                      <input 
                        type="checkbox"
                        id="campusResources"
                        checked={mentorTopics.campusResources}
                        onChange={() => handleTopicChange('campusResources')}
                      />
                      <label htmlFor="campusResources">Finding campus resources</label>
                    </div>
                    <div style={styles.checkboxItem}>
                      <input 
                        type="checkbox"
                        id="careerExploration"
                        checked={mentorTopics.careerExploration}
                        onChange={() => handleTopicChange('careerExploration')}
                      />
                      <label htmlFor="careerExploration">Career exploration & internships</label>
                    </div>
                    <div style={styles.checkboxItem}>
                      <input 
                        type="checkbox"
                        id="financialAid"
                        checked={mentorTopics.financialAid}
                        onChange={() => handleTopicChange('financialAid')}
                      />
                      <label htmlFor="financialAid">Financial aid & budgeting</label>
                    </div>
                    <div style={styles.checkboxItem}>
                      <input 
                        type="checkbox"
                        id="buildingConfidence"
                        checked={mentorTopics.buildingConfidence}
                        onChange={() => handleTopicChange('buildingConfidence')}
                      />
                      <label htmlFor="buildingConfidence">Building confidence as a first-gen student</label>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // MENTEE SPECIFIC FIELDS
              <>
                {/* Expectations - for mentees */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    What are your expectations from this mentorship?
                  </label>
                  <textarea 
                    value={expectations} 
                    onChange={(e) => setExpectations(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* Career Goals */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    What are your short-term and long-term career goals?
                  </label>
                  <textarea 
                    value={careerGoals} 
                    onChange={(e) => setCareerGoals(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* Challenges */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    What challenges have you faced in your academic or career journey?
                  </label>
                  <textarea 
                    value={challenges} 
                    onChange={(e) => setChallenges(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>

                {/* Experience Summary */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Describe your academic and professional experience so far.
                  </label>
                  <textarea 
                    value={experienceSummary} 
                    onChange={(e) => setExperienceSummary(e.target.value)} 
                    style={styles.textarea}
                    required
                  />
                </div>
              </>
            )}

            {/* Additional Information - for both roles */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Is there anything else you'd like us to know about your mentorship goals or expectations?
              </label>
              <textarea 
                value={additionalInfo} 
                onChange={(e) => setAdditionalInfo(e.target.value)} 
                style={styles.textarea} 
              />
            </div>

            {/* Submit Button */}
            <button type="submit" style={styles.button}>Sign Up Now</button>
          </>
        )}
      </form>
    </div>
  );
};

/** 🔹 Styles for Enhanced UI */
const styles = {
  container: { maxWidth: "700px", margin: "2rem auto", padding: "2rem", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", textAlign: "center" },
  title: { fontSize: "1.8rem", color: "#1a365d", marginBottom: "0.5rem" },
  description: { fontSize: "1rem", color: "#555", marginBottom: "1.5rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  formGroup: { textAlign: "left" },
  errorBox: { backgroundColor: "#FED7D7", borderRadius: "6px", padding: "1rem", marginBottom: "1rem", color: "#822727" },
  alertBox: { backgroundColor: "#FFF5F5", borderRadius: "6px", padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid #FC8181" },
  alertText: { color: "#C53030", marginBottom: "1rem" },
  dashboardButton: { backgroundColor: "#2D3748", color: "white", padding: "0.75rem 1.25rem", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600" },
  labelContainer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  label: { fontSize: "1rem", fontWeight: "600", color: "#1a365d" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "1rem", backgroundColor: "white" },
  textarea: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "1rem", backgroundColor: "white", minHeight: "100px" },
  button: { backgroundColor: "#1a365d", color: "white", padding: "12px", border: "none", borderRadius: "6px", fontSize: "1rem", cursor: "pointer", transition: "background-color 0.3s", fontWeight: "600" },
  statusText: { color: "#805ad5", fontStyle: "italic", marginTop: "4px" },
  successText: { color: "#38a169", fontWeight: "500", marginTop: "4px" },
  helperText: { fontSize: "0.85rem", color: "#718096", marginBottom: "12px", fontStyle: "italic" },
  aiButton: { 
    backgroundColor: "#805ad5", 
    color: "white", 
    border: "none", 
    borderRadius: "4px", 
    padding: "4px 8px", 
    fontSize: "0.75rem", 
    cursor: "pointer"
  },
  aiSourcesContainer: {
    backgroundColor: "#f7fafc",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    border: "1px solid #e2e8f0"
  },
  sourceTitle: {
    fontSize: "1.2rem", 
    color: "#1a365d", 
    marginBottom: "0.5rem",
    textAlign: "center"
  },
  aiSourceOption: {
    marginBottom: "1rem",
    padding: "0.75rem",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #e2e8f0"
  },
  optionTitle: {
    fontSize: "1rem",
    color: "#2d3748",
    marginBottom: "0.5rem",
    fontWeight: "500"
  },
  fileInput: {
    width: "100%",
    padding: "5px 0"
  },
  inputGroup: {
    display: "flex",
    gap: "10px"
  },
  actionButton: {
    backgroundColor: "#4a5568",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "0.875rem",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  suggestionControls: {
    marginTop: "10px",
    padding: "8px",
    backgroundColor: "#ebf8ff",
    borderRadius: "6px"
  },
  applyAllButton: {
    backgroundColor: "#4299e1",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "0.875rem",
    cursor: "pointer",
    marginTop: "5px"
  },
  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "10px",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #cbd5e0"
  },
  checkboxItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  }
};

export default MentorshipSignup;

