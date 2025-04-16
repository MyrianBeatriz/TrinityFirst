import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import { auth, firestore } from "../firebase"; // Removed storage import
import { useNavigate } from "react-router-dom";
import { checkExistingSignup } from "../services/api"; // Import the utility function
=======
import { auth, firestore, storage } from "../firebase"; // Ensure Firebase Storage is enabled
import { useNavigate } from "react-router-dom";
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17

const MentorshipSignup = () => {
  const navigate = useNavigate();
  const [mentorshipRole, setMentorshipRole] = useState("");
<<<<<<< HEAD
  
  // Common fields for both roles
=======
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
  const [expectations, setExpectations] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [challenges, setChallenges] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
<<<<<<< HEAD
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
=======
  const [resumeUrl, setResumeUrl] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [major, setMajor] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/login");
<<<<<<< HEAD
  
      try {
        setLoading(true);
        
        // Check if user already has a signup
        const { exists, role, error } = await checkExistingSignup(user.uid);
        
        if (error) {
          console.error("Error checking signup status:", error);
          setSignupError("Unable to verify your signup status. Please try again later.");
        } else if (exists) {
          setHasExistingSignup(true);
          setExistingRole(role);
          console.log(`User has already signed up as a ${role || "participant"}`);
        }
  
        // Existing code for fetching user data...
        const userRef = firestore.collection("users").doc(user.uid);
        const userSnap = await userRef.get();
  
        if (userSnap.exists) {
          setMajor(userSnap.data().major || "");
        }
  
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        setSignupError("Error loading your information. Please try again later.");
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
      // Create a FormData object to send the file directly
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', auth.currentUser?.uid || 'anonymous');
      formData.append('role', mentorshipRole);
      
      console.log("Sending file for AI processing...");
      
      // Send the file directly to your server
      const response = await fetch("http://127.0.0.1:5001/process-file", {
        method: "POST",
        body: formData, // No need to set Content-Type, it will be set automatically with boundary
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("AI generated content:", result);
      
      setAiSuggestions(result);
      
      // Ask user if they want to use the suggestions
      const useAiContent = window.confirm(
        "AI has generated content based on your resume. Would you like to use these suggestions?"
      );
      
      if (useAiContent) {
        if (mentorshipRole === "Mentor") {
          // Apply mentor-specific content
          if (result.academicInterests) setAcademicInterests(result.academicInterests);
          if (result.mentorMotivation) setMentorMotivation(result.mentorMotivation);
          if (result.firstGenChallenges) setFirstGenChallenges(result.firstGenChallenges);
          if (result.mentorStrengths) setMentorStrengths(result.mentorStrengths);
          if (result.communicationStyle) setCommunicationStyle(result.communicationStyle);
          if (result.extracurriculars) setExtracurriculars(result.extracurriculars);
        } else {
          // Apply mentee content
          if (result.careerGoals) setCareerGoals(result.careerGoals);
          if (result.experienceSummary) setExperienceSummary(result.experienceSummary);
          if (result.challenges) setChallenges(result.challenges);
        }
        if (result.expectations) setExpectations(result.expectations);
        if (result.additionalInfo) setAdditionalInfo(result.additionalInfo);
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
    
    setProcessingContent(true);
    
    try {
      const response = await fetch("http://127.0.0.1:5001/extract-content", {
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
        applyAllSuggestions();
      }
    } catch (error) {
      console.error("LinkedIn processing failed:", error);
      alert("Could not analyze LinkedIn profile. Please fill the form manually.");
    }
    
    setProcessingContent(false);
  };

  // Apply all AI suggestions at once
  const applyAllSuggestions = () => {
    if (!aiSuggestions) return;
    
    // Apply common fields
    if (aiSuggestions.expectations) setExpectations(aiSuggestions.expectations);
    if (aiSuggestions.additionalInfo) setAdditionalInfo(aiSuggestions.additionalInfo);
    
    if (mentorshipRole === "Mentor") {
      // Apply mentor-specific fields
      if (aiSuggestions.academicInterests) setAcademicInterests(aiSuggestions.academicInterests);
      if (aiSuggestions.mentorMotivation) setMentorMotivation(aiSuggestions.mentorMotivation);
      if (aiSuggestions.firstGenChallenges) setFirstGenChallenges(aiSuggestions.firstGenChallenges);
      if (aiSuggestions.mentorStrengths) setMentorStrengths(aiSuggestions.mentorStrengths);
      if (aiSuggestions.communicationStyle) setCommunicationStyle(aiSuggestions.communicationStyle);
      if (aiSuggestions.extracurriculars) setExtracurriculars(aiSuggestions.extracurriculars);
    } else {
      // Apply mentee fields
      if (aiSuggestions.careerGoals) setCareerGoals(aiSuggestions.careerGoals);
      if (aiSuggestions.experienceSummary) setExperienceSummary(aiSuggestions.experienceSummary);
      if (aiSuggestions.challenges) setChallenges(aiSuggestions.challenges);
    }
  };

  // Apply individual AI suggestion
  const applyAiSuggestion = (field) => {
    if (!aiSuggestions || !aiSuggestions[field]) return;
    
    // Use a switch statement to handle all possible fields
    switch(field) {
      // Common fields
      case 'expectations':
        setExpectations(aiSuggestions.expectations);
        break;
      case 'additionalInfo':
        setAdditionalInfo(aiSuggestions.additionalInfo);
        break;
      
      // Mentee fields  
      case 'careerGoals':
        setCareerGoals(aiSuggestions.careerGoals);
        break;
      case 'experienceSummary':
        setExperienceSummary(aiSuggestions.experienceSummary);
        break;
      case 'challenges':
        setChallenges(aiSuggestions.challenges);
        break;
      
      // Mentor fields
      case 'academicInterests':
        setAcademicInterests(aiSuggestions.academicInterests);
        break;
      case 'extracurriculars':
        setExtracurriculars(aiSuggestions.extracurriculars);
        break;
      case 'mentorMotivation':
        setMentorMotivation(aiSuggestions.mentorMotivation);
        break;
      case 'firstGenChallenges':
        setFirstGenChallenges(aiSuggestions.firstGenChallenges);
        break;
      case 'mentorStrengths':
        setMentorStrengths(aiSuggestions.mentorStrengths);
        break;
      case 'communicationStyle':
        setCommunicationStyle(aiSuggestions.communicationStyle);
        break;
      default:
        break;
    }
  };

  // Handle form submission
  const handleSignup = async (e) => {
    e.preventDefault();

    if (hasExistingSignup) {
      alert(`You have already signed up as a ${existingRole || "participant"} in the mentorship program.`);
      return; // This will exit the function early, preventing submission
    }
    
    const user = auth.currentUser;
    if (!user) return navigate("/login");

    // Base mentorship data
=======

      const userRef = firestore.collection("users").doc(user.uid);
      const userSnap = await userRef.get();

      if (userSnap.exists) {
        setMajor(userSnap.data().major || "");
      }

      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  // 🔹 Handle Resume Upload to Firebase Storage
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`resumes/${auth.currentUser.uid}_${file.name}`);

    try {
      await fileRef.put(file);
      const fileURL = await fileRef.getDownloadURL();
      setResumeUrl(fileURL);
    } catch (error) {
      console.error("File upload failed:", error);
    }
    setUploading(false);
  };

  // 🔹 Handle Mentorship Signup Submission
  const handleSignup = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return navigate("/login");

>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
    const mentorshipData = {
      userId: user.uid,
      mentorshipRole,
      expectations,
<<<<<<< HEAD
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
      // Save to Firestore
      await firestore.collection("mentorship_signups").doc(user.uid).set(mentorshipData);

      // Send file separately if exists
      if (resumeFile) {
        const formData = new FormData();
        formData.append('file', resumeFile);
        formData.append('userId', user.uid);
        
        await fetch("http://127.0.0.1:5001/save-resume", {
          method: "POST",
          body: formData,
        });
      }

      // Send data to the AI Matching API
      const response = await fetch("http://127.0.0.1:5001/match", {
=======
      careerGoals,
      challenges,
      experienceSummary,
      resumeFile: resumeUrl,
      linkedinProfile,
      major,
    };

    try {
      await firestore.collection("mentorship_signups").doc(user.uid).set(mentorshipData);

      // 🔹 Send data to the AI Matching API
      const response = await fetch("http://127.0.0.1:5000/match", {
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mentorshipData),
      });

      const result = await response.json();
<<<<<<< HEAD
      alert("Mentorship signup successful! " + (result.matchResult || "Your application has been received."));
      navigate("/dashboard");
    } catch (error) {
      console.error("Error signing up:", error);
      alert("There was an error submitting your application. Please try again.");
=======
      alert("Mentorship signup successful! AI match results: " + result.matchResult);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error signing up:", error);
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
    }
  };

  if (loading) return <p>Loading...</p>;

<<<<<<< HEAD
  // This function was removed as requested

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Join the Mentorship Program</h1>
      <p style={styles.description}>Sign up as a mentor or mentee and share your thoughts to find the best match.</p>

      {/* Error Message */}
    {signupError && (
      <div style={styles.errorBox}>
        <p>{signupError}</p>
      </div>
    )}
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
=======
  return (
    <div style={styles.container}>
      <h1 style={styles.title}> Join the Mentorship Program</h1>
      <p style={styles.description}>Sign up as a mentor or mentee and share your thoughts to find the best match.</p>

      <form onSubmit={handleSignup} style={styles.form}>
        {/* Mentorship Role */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Are you signing up as a mentor or mentee?</label>
          <select value={mentorshipRole} onChange={(e) => setMentorshipRole(e.target.value)} required style={styles.input}>
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
            <option value="">Select Role</option>
            <option value="Mentee">Mentee</option>
            <option value="Mentor">Mentor</option>
          </select>
        </div>

<<<<<<< HEAD
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
=======
        {/* Expectations */}
        <div style={styles.formGroup}>
          <label style={styles.label}>What are your expectations from this mentorship?</label>
          <textarea value={expectations} onChange={(e) => setExpectations(e.target.value)} placeholder="Write freely about what you're hoping to gain." style={styles.textarea} />
        </div>

        {/* Career Goals */}
        <div style={styles.formGroup}>
          <label style={styles.label}>What are your short-term and long-term career goals?</label>
          <textarea value={careerGoals} onChange={(e) => setCareerGoals(e.target.value)} placeholder="Describe your aspirations and career vision." style={styles.textarea} />
        </div>

        {/* Challenges */}
        <div style={styles.formGroup}>
          <label style={styles.label}>What challenges have you faced in your academic or career journey?</label>
          <textarea value={challenges} onChange={(e) => setChallenges(e.target.value)} placeholder="Be open about any struggles you’ve encountered." style={styles.textarea} />
        </div>

        {/* Experience Summary */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Describe your academic and professional experience so far.</label>
          <textarea value={experienceSummary} onChange={(e) => setExperienceSummary(e.target.value)} placeholder="Give an overview of your experiences, internships, or projects." style={styles.textarea} />
        </div>

        {/* LinkedIn Profile */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Do you have a LinkedIn profile? Share the link.</label>
          <input type="url" value={linkedinProfile} onChange={(e) => setLinkedinProfile(e.target.value)} placeholder="https://linkedin.com/in/your-profile" style={styles.input} />
        </div>

        {/* Resume Upload */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Upload Your Resume (Optional but Recommended)</label>
          <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} />
          {uploading && <p>Uploading...</p>}
          {resumeUrl && <p>Resume Uploaded Successfully!</p>}
        </div>

        {/* Submit Button */}
        <button type="submit" style={styles.button}> Sign Up Now</button>
>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
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
<<<<<<< HEAD
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
=======
  label: { fontSize: "1rem", fontWeight: "600", color: "#1a365d", display: "block", marginBottom: "0.5rem" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "1rem", backgroundColor: "white" },
  textarea: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "1rem", backgroundColor: "white", minHeight: "100px" },
  button: { backgroundColor: "#1a365d", color: "white", padding: "12px", border: "none", borderRadius: "6px", fontSize: "1rem", cursor: "pointer", transition: "background-color 0.3s" },
};

export default MentorshipSignup;

>>>>>>> 09f0806cc5ae6a4638843c88a8638f22489dfb17
