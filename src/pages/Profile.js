import React, { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";
import { auth, firestore, storage } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Profile = () => {
  const { id } = useParams(); // Get user ID from URL
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mentorshipStatus, setMentorshipStatus] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    major: "",
    classYear: "",
    bio: "",
    interests: ""
  });

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if current user is logged in
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate("/login");
          return;
        }

        // Determine if viewing own profile or someone else's
        setIsCurrentUser(currentUser.uid === id);

        // Get user document from Firestore
        const userRef = doc(firestore, "users", id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUser(userData);
          
          // Initialize form data with user data
          setFormData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
            major: userData.major || "",
            classYear: userData.classYear || "",
            bio: userData.bio || "",
            interests: userData.interests || ""
          });
          
          // Check for mentorship enrollment
          const mentorshipRef = doc(firestore, "mentorship_signups", id);
          const mentorshipSnap = await getDoc(mentorshipRef);
          
          if (mentorshipSnap.exists()) {
            setMentorshipStatus(mentorshipSnap.data());
          }
        } else {
          console.error("No user found with this ID");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };


    fetchUserData();
  }, [id, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      
      // Create storage reference
      const storageRef = ref(storage, `profile_images/${id}`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update user document
      const userRef = doc(firestore, "users", id);
      await updateDoc(userRef, {
        profileImage: downloadURL
      });
      
      // Update local state
      setUser((prev) => ({
        ...prev,
        profileImage: downloadURL
      }));
      
      alert("Profile image updated successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Save profile changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const userRef = doc(firestore, "users", id);
      
      await updateDoc(userRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        major: formData.major,
        classYear: formData.classYear,
        bio: formData.bio,
        interests: formData.interests,
        updatedAt: new Date().toISOString()
      });
      
      setUser((prev) => ({
        ...prev,
        ...formData
      }));
      
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Loading profile...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.profileCard}>
        {/* Profile Header */}
        <div style={styles.profileHeader}>
          <div style={styles.profileImageContainer}>
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={`${user.firstName}'s profile`} 
                style={styles.profileImage}
              />
            ) : (
              <div style={styles.profileImagePlaceholder}>
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
            )}
            
            {isCurrentUser && (
              <div style={styles.imageUploadOverlay}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={styles.imageUploadInput} 
                  id="profile-image-upload"
                  disabled={uploadingImage}
                />
                <label 
                  htmlFor="profile-image-upload" 
                  style={styles.imageUploadLabel}
                >
                  {uploadingImage ? "Uploading..." : "Change Photo"}
                </label>
              </div>
            )}
          </div>
          
          <div style={styles.profileInfo}>
            <h1 style={styles.profileName}>
              {user.firstName} {user.lastName}
            </h1>
            <p style={styles.profileMeta}>
              {user.major && <span style={styles.majorBadge}>{user.major}</span>}
              {user.classYear && <span style={styles.yearBadge}>Class of {user.classYear}</span>}
            </p>
            
            {isCurrentUser && !editing && (
              <button 
                onClick={() => setEditing(true)} 
                style={styles.editButton}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
        
        {/* Profile Body */}
        {!editing ? (
          <div style={styles.profileBody}>
            <div style={styles.profileSection}>
              <h2 style={styles.sectionTitle}>About</h2>
              <p style={styles.bioText}>{user.bio || "No bio provided yet."}</p>
            </div>
            
            {user.interests && (
              <div style={styles.profileSection}>
                <h2 style={styles.sectionTitle}>Interests</h2>
                <p style={styles.interestsText}>{user.interests}</p>
              </div>
            )}
            
            {/* Mentorship Status */}
            {mentorshipStatus && (
              <div style={styles.profileSection}>
                <h2 style={styles.sectionTitle}>Mentorship Program</h2>
                <div style={styles.mentorshipStatusCard}>
                  <div style={styles.mentorshipHeader}>
                    <span style={styles.roleBadge}>
                      {mentorshipStatus.mentorshipRole}
                    </span>
                  </div>
                  
                  <p style={styles.mentorshipInfo}>
                    <strong>Joined:</strong> {new Date(mentorshipStatus.submittedAt).toLocaleDateString()}
                  </p>
                  
                  {isCurrentUser && (
                    <button 
                      onClick={() => navigate("/mentorship-settings")} 
                      style={styles.mentorshipButton}
                    >
                      Manage Mentorship
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Contact Info */}
            <div style={styles.profileSection}>
              <h2 style={styles.sectionTitle}>Contact</h2>
              <p style={styles.contactText}>{user.email}</p>
            </div>
          </div>
        ) : (
          /* Edit Profile Form */
          <form onSubmit={handleSubmit} style={styles.editForm}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleChange} 
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleChange} 
                  style={styles.input}
                  required
                />
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Major</label>
                <input 
                  type="text" 
                  name="major" 
                  value={formData.major} 
                  onChange={handleChange} 
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Class Year</label>
                <input 
                  type="text" 
                  name="classYear" 
                  value={formData.classYear} 
                  onChange={handleChange} 
                  style={styles.input}
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea 
                name="bio" 
                value={formData.bio} 
                onChange={handleChange} 
                style={styles.textarea}
                placeholder="Tell us about yourself..."
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Interests</label>
              <textarea 
                name="interests" 
                value={formData.interests} 
                onChange={handleChange} 
                style={styles.textarea}
                placeholder="What are your academic and personal interests?"
              />
            </div>
            
            <div style={styles.formActions}>
              <button 
                type="button" 
                onClick={() => setEditing(false)} 
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={styles.saveButton}
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {

    maxWidth: "900px",
    margin: "2rem auto",
    padding: "0 1.5rem"
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    fontSize: "1.2rem",
    color: "#718096"
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    overflow: "hidden"
  },
  profileHeader: {
    display: "flex",
    padding: "2rem",
    backgroundColor: "#f7fafc",
    borderBottom: "1px solid #e2e8f0"
  },
  profileImageContainer: {
    position: "relative",
    width: "150px",
    height: "150px",
    marginRight: "2rem",
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "#e2e8f0"
  },
  profileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  profileImagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d",
    color: "white",
    fontSize: "3rem",
    fontWeight: "bold"
  },
  imageUploadOverlay: {
    position: "absolute",
    bottom: "0",
    left: "0",
    right: "0",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: "0.5rem",
    textAlign: "center"
  },
  imageUploadInput: {
    display: "none"
  },
  imageUploadLabel: {
    color: "white",
    fontSize: "0.875rem",
    cursor: "pointer"
  },
  profileInfo: {
    flex: "1"
  },
  profileName: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: "0.5rem"
  },
  profileMeta: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "1.5rem"
  },
  majorBadge: {
    backgroundColor: "#ebf8ff",
    color: "#2b6cb0",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.875rem",
    fontWeight: "500"
  },
  yearBadge: {
    backgroundColor: "#e9d8fd",
    color: "#553c9a",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.875rem",
    fontWeight: "500"
  },
  editButton: {
    backgroundColor: "#1a365d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer"
  },
  profileBody: {
    padding: "2rem"
  },
  profileSection: {
    marginBottom: "2rem"
  },
  sectionTitle: {
    fontSize: "1.25rem",
    color: "#1a365d",
    fontWeight: "600",
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid #e2e8f0"
  },
  bioText: {
    fontSize: "1rem",
    lineHeight: "1.7",
    color: "#4a5568"
  },
  interestsText: {
    fontSize: "1rem",
    lineHeight: "1.7",
    color: "#4a5568"
  },
  contactText: {
    fontSize: "1rem",
    color: "#4a5568"
  },
  mentorshipStatusCard: {
    backgroundColor: "#f7fafc",
    padding: "1.5rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0"
  },
  mentorshipHeader: {
    marginBottom: "1rem"
  },
  roleBadge: {
    backgroundColor: "#fed7d7",
    color: "#9b2c2c",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.875rem",
    fontWeight: "600"
  },
  mentorshipInfo: {
    fontSize: "1rem",
    color: "#4a5568",
    marginBottom: "1rem"
  },
  mentorshipButton: {
    backgroundColor: "#FED102",
    color: "#1a365d",
    border: "none",
    borderRadius: "6px",
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    display: "block",
    marginLeft: "auto"
  },
  editForm: {
    padding: "2rem"
  },
  formRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem"
  },
  formGroup: {
    flex: "1",
    marginBottom: "1.5rem"
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#4a5568"
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "1rem"
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "1rem",
    minHeight: "120px",
    fontFamily: "inherit"
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "1rem"
  },
  cancelButton: {
    backgroundColor: "#e2e8f0",
    color: "#4a5568",
    border: "none",
    borderRadius: "6px",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer"
  },
  saveButton: {
    backgroundColor: "#1a365d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer"
  }
};

export default Profile;

