import React, { useEffect, useState } from "react";
import { auth, firestore } from "../firebase";
import { useNavigate } from "react-router-dom";

import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

const MentorshipSettings = () => {
  const navigate = useNavigate();
  const [mentorshipRole, setMentorshipRole] = useState("");
  const [mentorshipAreas, setMentorshipAreas] = useState([]);

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Common fields for both roles
  const [expectations, setExpectations] = useState("");
  const [major, setMajor] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Mentee specific fields
  const [careerGoals, setCareerGoals] = useState("");
  const [challenges, setChallenges] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");

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

  const mentorshipAreasOptions = [
    "Academic Advice",
    "Campus Life",
    "Study Tips",
    "Time Management",
    "Internship Advice",
    "Resources Sharing",
    "Adjusting to College Life"
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/login");


      try {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setMajor(userData.major || "");
        }

        const signupRef = doc(firestore, "mentorship_signups", user.uid);
        const signupSnap = await getDoc(signupRef);

        if (signupSnap.exists()) {
          const signupData = signupSnap.data();
          setIsEnrolled(true);
          setMentorshipRole(signupData.mentorshipRole || "");
          setMentorshipAreas(signupData.mentorshipAreas || []);
          setExpectations(signupData.expectations || "");
          setAdditionalInfo(signupData.additionalInfo || "");
          
          // Set role-specific fields
          if (signupData.mentorshipRole === "Mentee") {
            setCareerGoals(signupData.careerGoals || "");
            setChallenges(signupData.challenges || "");
            setExperienceSummary(signupData.experienceSummary || "");
          } else if (signupData.mentorshipRole === "Mentor") {
            setAcademicInterests(signupData.academicInterests || "");
            setExtracurriculars(signupData.extracurriculars || "");
            setMentorMotivation(signupData.mentorMotivation || "");
            setFirstGenChallenges(signupData.firstGenChallenges || "");
            setMentorStrengths(signupData.mentorStrengths || "");
            setCommunicationStyle(signupData.communicationStyle || "");
            setDesiredSupport(signupData.desiredSupport || "");
            
            // Set mentor topics if they exist
            if (signupData.mentorTopics) {
              setMentorTopics({
                collegeLife: signupData.mentorTopics.collegeLife || false,
                studySkills: signupData.mentorTopics.studySkills || false,
                campusResources: signupData.mentorTopics.campusResources || false,
                careerExploration: signupData.mentorTopics.careerExploration || false,
                financialAid: signupData.mentorTopics.financialAid || false,
                buildingConfidence: signupData.mentorTopics.buildingConfidence || false
              });
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching mentorship data:", error);
        setLoading(false);
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return navigate("/login");

    try {

      setSaving(true);
      const signupRef = doc(firestore, "mentorship_signups", user.uid);

      // Base mentorship data for all roles
      const mentorshipData = {
        mentorshipRole,
        mentorshipAreas,
        expectations,
        additionalInfo,
        major,
        updatedAt: new Date().toISOString()
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

      await updateDoc(signupRef, mentorshipData);
      alert("Your mentorship information has been updated successfully!");
      setSaving(false);
    } catch (error) {
      console.error("Error updating mentorship details:", error);
      alert("There was an error updating your information. Please try again.");
      setSaving(false);
    }
  };

  const handleOptOut = async () => {

    if (!window.confirm("Are you sure you want to opt out of the mentorship program? This will delete your application and cannot be undone.")) {
      return;
    }
    
    const user = auth.currentUser;
    if (!user) return navigate("/login");

    try {

      await deleteDoc(doc(firestore, "mentorship_signups", user.uid));
      
      // Check if there are any active matches and handle them appropriately
      // For simplicity in this implementation, we're not handling the match deletion here
      
      setIsEnrolled(false);
      setMentorshipRole("");
      setMentorshipAreas([]);
      setExpectations("");
      setAdditionalInfo("");
      setCareerGoals("");
      setChallenges("");
      setExperienceSummary("");
      setAcademicInterests("");
      setExtracurriculars("");
      setMentorMotivation("");
      setFirstGenChallenges("");
      setMentorStrengths("");
      setCommunicationStyle("");
      setDesiredSupport("");
      setMentorTopics({
        collegeLife: false,
        studySkills: false,
        campusResources: false,
        careerExploration: false,
        financialAid: false,
        buildingConfidence: false
      });

      alert("You have successfully opted out of the mentorship program.");
    } catch (error) {
      console.error("Error opting out of mentorship:", error);

      alert("There was an error opting out of the program. Please try again.");
    }
  };

  if (loading) return <div style={styles.loadingContainer}>Loading your mentorship details...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Manage Your Mentorship Application</h1>
      <p style={styles.description}>
        Update your mentorship information or opt out of the program if needed.
      </p>

      {!isEnrolled ? (
        <div style={styles.notEnrolledContainer}>
          <p style={styles.notEnrolled}>You are not currently enrolled in the mentorship program.</p>
          <button 
            onClick={() => navigate("/mentorship-signup")} 
            style={styles.enrollButton}
          >
            Sign Up for Mentorship
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdate} style={styles.form}>
          {/* Mentorship Role (Read-only since changing roles requires a new application) */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Your Role:</label>
            <div style={styles.readOnlyField}>
              <span style={styles.roleBadge}>
                {mentorshipRole || "Not specified"}
              </span>
              <span style={styles.helperText}>
                To change your role, please opt out and submit a new application.
              </span>
            </div>
          </div>

          {/* Mentorship Areas */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Areas of Interest:</label>
            <div style={styles.checkboxGroup}>
              {mentorshipAreasOptions.map((area) => (
                <label key={area} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={mentorshipAreas.includes(area)}
                    onChange={(e) => {
                      const updatedAreas = e.target.checked
                        ? [...mentorshipAreas, area]
                        : mentorshipAreas.filter((a) => a !== area);
                      setMentorshipAreas(updatedAreas);
                    }}
                    style={styles.checkbox}
                  />
                  {area}
                </label>
              ))}
            </div>
          </div>


          {/* Common Fields */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Your Expectations:</label>
            <textarea
              value={expectations}
              onChange={(e) => setExpectations(e.target.value)}
              placeholder="What do you hope to gain from this mentorship experience?"
              style={styles.textarea}
            />
          </div>


          {/* Render different form fields based on role */}
          {mentorshipRole === "Mentor" ? (
            // Mentor Specific Fields
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Academic Interests and Career Goals:</label>
                <textarea 
                  value={academicInterests} 
                  onChange={(e) => setAcademicInterests(e.target.value)} 
                  style={styles.textarea}
                  placeholder="Describe your academic interests and career goals"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Extracurricular Activities:</label>
                <textarea 
                  value={extracurriculars} 
                  onChange={(e) => setExtracurriculars(e.target.value)} 
                  style={styles.textarea}
                  placeholder="What extracurricular activities, clubs, or organizations are you involved in?"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Mentor Motivation:</label>
                <textarea 
                  value={mentorMotivation} 
                  onChange={(e) => setMentorMotivation(e.target.value)} 
                  style={styles.textarea}
                  placeholder="Why do you want to be a mentor in this program?"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>First-Gen Challenges:</label>
                <textarea 
                  value={firstGenChallenges} 
                  onChange={(e) => setFirstGenChallenges(e.target.value)} 
                  style={styles.textarea}
                  placeholder="What challenges did you face as a first-generation student that you want to help others navigate?"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Mentor Strengths:</label>
                <textarea 
                  value={mentorStrengths} 
                  onChange={(e) => setMentorStrengths(e.target.value)} 
                  style={styles.textarea}
                  placeholder="What strengths do you bring as a mentor?"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Communication Style:</label>
                <textarea 
                  value={communicationStyle} 
                  onChange={(e) => setCommunicationStyle(e.target.value)} 
                  style={styles.textarea}
                  placeholder="How would you describe your communication and leadership style?"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Desired Support:</label>
                <textarea 
                  value={desiredSupport} 
                  onChange={(e) => setDesiredSupport(e.target.value)} 
                  style={styles.textarea}
                  placeholder="What kind of support do you wish you had when you started college?"
                />
              </div>

              {/* Mentoring Topics */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  What topics do you feel most comfortable guiding a mentee on? (Check all that apply)
                </label>
                <div style={styles.checkboxGrid}>
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
            // Mentee Specific Fields
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Career Goals:</label>
                <textarea 
                  value={careerGoals} 
                  onChange={(e) => setCareerGoals(e.target.value)} 
                  style={styles.textarea}
                  placeholder="What are your short-term and long-term career goals?"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Challenges:</label>
                <textarea 
                  value={challenges} 
                  onChange={(e) => setChallenges(e.target.value)} 
                  style={styles.textarea}
                  placeholder="What challenges have you faced in your academic or career journey?"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Experience Summary:</label>
                <textarea 
                  value={experienceSummary} 
                  onChange={(e) => setExperienceSummary(e.target.value)} 
                  style={styles.textarea}
                  placeholder="Describe your academic and professional experience so far."
                />
              </div>
            </>
          )}

          {/* Additional Information - for both roles */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Additional Information:</label>
            <textarea 
              value={additionalInfo} 
              onChange={(e) => setAdditionalInfo(e.target.value)} 
              style={styles.textarea}
              placeholder="Is there anything else you'd like us to know about your mentorship goals or expectations?"
            />
          </div>

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            <button 
              type="submit" 
              style={styles.saveButton}
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
            
            <button 
              type="button" 
              onClick={handleOptOut} 
              style={styles.optOutButton}
            >
              Opt Out of Mentorship
            </button>
          </div>
        </form>
      )}
    </div>
  );
};


const styles = {
  container: {
    maxWidth: "800px",
    margin: "2rem auto",
    padding: "2rem",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "300px",
    fontSize: "1.2rem",
    color: "#718096",
  },
  title: {
    fontSize: "1.8rem",
    color: "#1a365d",
    marginBottom: "0.5rem",

    textAlign: "center",
  },
  description: {
    fontSize: "1rem",
    color: "#555",
    marginBottom: "1.5rem",

    textAlign: "center",
  },
  notEnrolledContainer: {
    textAlign: "center",
    padding: "2rem",
    backgroundColor: "#f7fafc",
    borderRadius: "8px",
    marginBottom: "1.5rem",
  },
  notEnrolled: {
    fontSize: "1.1rem",
    color: "#4a5568",
    marginBottom: "1.5rem",
  },
  enrollButton: {
    backgroundColor: "#1a365d",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "500",
    border: "none",
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  formGroup: {
    textAlign: "left",
  },
  label: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#1a365d",
    display: "block",
    marginBottom: "0.5rem",
  },

  readOnlyField: {
    padding: "0.75rem",
    backgroundColor: "#f7fafc",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  roleBadge: {
    backgroundColor: "#ebf8ff",
    color: "#2b6cb0",
    padding: "0.4rem 0.8rem",
    borderRadius: "6px",
    fontWeight: "500",
    display: "inline-block",
  },
  helperText: {
    display: "block",
    fontSize: "0.875rem",
    color: "#718096",
    marginTop: "0.5rem",
    fontStyle: "italic",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e0",
    fontSize: "1rem",
    backgroundColor: "white",

    minHeight: "120px",
    resize: "vertical",
  },
  checkboxGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",

    backgroundColor: "#f7fafc",
    padding: "1rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1rem",
    backgroundColor: "#f7fafc",
    padding: "1rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",

    fontSize: "0.95rem",
    color: "#1a365d",
    padding: "0.5rem",
    borderRadius: "4px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    flex: "1 0 calc(50% - 10px)",
    minWidth: "180px",
  },
  checkboxItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0.5rem",
    backgroundColor: "white",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
  },
  checkbox: {
    marginRight: "8px",
  },

  actionButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "1rem",
  },
  saveButton: {
    backgroundColor: "#1a365d",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "500",
    border: "none",
    cursor: "pointer",
    flex: "1",
    marginRight: "1rem",
  },
  optOutButton: {
    backgroundColor: "#FFF5F5",
    color: "#E53E3E",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "500",
    border: "1px solid #E53E3E",
    cursor: "pointer",
  },
};

export default MentorshipSettings;


