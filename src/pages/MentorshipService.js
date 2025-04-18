import { firestore } from "../firebase";
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";

export class MentorshipService {
  // Fetch all mentorship signups with user data
  static async fetchSignups() {
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

    return signupsData;
  }

  // Fetch all mentorship matches with resolved names
  static async fetchMatches() {
    const matchesRef = collection(firestore, "mentorship_matches");
    const matchesSnap = await getDocs(matchesRef);
    const matchesData = matchesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Convert IDs to names
    return await Promise.all(matchesData.map(async (match) => {
      const menteeRef = doc(firestore, "users", match.mentee);
      const mentorRef = doc(firestore, "users", match.mentor);

      const menteeSnap = await getDoc(menteeRef);
      const mentorSnap = await getDoc(mentorRef);

      return {
        ...match,
        mentee: menteeSnap.exists() ? `${menteeSnap.data().firstName} ${menteeSnap.data().lastName}` : match.mentee,
        mentor: mentorSnap.exists() ? `${mentorSnap.data().firstName} ${mentorSnap.data().lastName}` : match.mentor,
      };
    }));
  }

  // Generate new AI matches
  static async generateMatches() {
    try {
      // Use API URL from environment with fallback to localhost
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";
      const response = await fetch(`${apiUrl}/generate-matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      return await response.json();
    } catch (error) {
      console.error("Error generating matches:", error);
      throw error;
    }
  }

  // Update a match status
  static async updateMatchStatus(matchId, status) {
    const matchRef = doc(firestore, "mentorship_matches", matchId);
    await updateDoc(matchRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  }

  // Delete a match
  static async deleteMatch(matchId) {
    const matchRef = doc(firestore, "mentorship_matches", matchId);
    await deleteDoc(matchRef);
    return { success: true };
  }

  // Send notification to users about match
  static async notifyUsers(matchId) {
    const matchRef = doc(firestore, "mentorship_matches", matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) {
      throw new Error("Match not found");
    }
    
    const matchData = matchSnap.data();
    
    // Create notifications in Firestore
    const notificationsRef = collection(firestore, "notifications");
    
    // Notification for mentor
    await addDoc(notificationsRef, {
      userId: matchData.mentor,
      type: "mentorship_match",
      title: "New Mentorship Match",
      message: "You have been matched with a mentee in the mentorship program",
      matchId: matchId,
      read: false,
      createdAt: serverTimestamp()
    });
    
    // Notification for mentee
    await addDoc(notificationsRef, {
      userId: matchData.mentee,
      type: "mentorship_match",
      title: "New Mentorship Match",
      message: "You have been matched with a mentor in the mentorship program",
      matchId: matchId,
      read: false,
      createdAt: serverTimestamp()
    });
    
    return { success: true };
  }
  
  // Get mentorship statistics
  static async getStatistics() {
    const signups = await this.fetchSignups();
    const matches = await this.fetchMatches();
    
    const mentorCount = signups.filter(s => s.mentorshipRole === "mentor").length;
    const menteeCount = signups.filter(s => s.mentorshipRole === "mentee").length;
    const pendingMatches = matches.filter(m => !m.status || m.status === "pending").length;
    const approvedMatches = matches.filter(m => m.status === "approved").length;
    const rejectedMatches = matches.filter(m => m.status === "rejected").length;
    
    // Breakdown by major
    const mentorsByMajor = signups
      .filter(s => s.mentorshipRole === "mentor" && s.major)
      .reduce((acc, mentor) => {
        acc[mentor.major] = (acc[mentor.major] || 0) + 1;
        return acc;
      }, {});
      
    const menteesByMajor = signups
      .filter(s => s.mentorshipRole === "mentee" && s.major)
      .reduce((acc, mentee) => {
        acc[mentee.major] = (acc[mentee.major] || 0) + 1;
        return acc;
      }, {});
    
    return {
      mentorCount,
      menteeCount,
      totalSignups: signups.length,
      pendingMatches,
      approvedMatches,
      rejectedMatches,
      totalMatches: matches.length,
      mentorsByMajor,
      menteesByMajor,
      matchQuality: {
        excellent: matches.filter(m => m.compatibilityScore >= 80).length,
        good: matches.filter(m => m.compatibilityScore >= 60 && m.compatibilityScore < 80).length,
        average: matches.filter(m => m.compatibilityScore < 60).length
      }
    };
  }
}
