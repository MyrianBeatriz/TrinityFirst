// src/services/api.js
import { auth } from '../firebase';

// Get API URL from environment variable with fallback
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";

/**
 * Checks if a user has already signed up for the mentorship program
 * @param {string} userId - The user's Firebase UID
 * @returns {Promise<Object>} - Object containing exists, role, and error values
 */
export const checkExistingSignup = async (userId) => {
  console.log(`Checking signup status for user: ${userId}`);
  
  try {
    if (!userId) {
      console.error("No user ID provided to checkExistingSignup");
      throw new Error("User ID is required");
    }

    // Validate userId format
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
      console.error(`Invalid user ID format: ${userId}`);
      throw new Error("Invalid user ID format");
    }

    console.log(`Making request to ${API_URL}/check-signup-status`);
    const response = await fetch(`${API_URL}/check-signup-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Helps prevent CSRF
      },
      body: JSON.stringify({ userId }),
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server error response: ${response.status} - ${errorText}`);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Signup check result:`, data);
    
    // Fall back to checking Firestore directly if the API returns an error
    // This ensures we have multiple ways to check signup status
    if (data.error) {
      console.warn(`API returned error, will attempt fallback check: ${data.error}`);
      // The fallback check happens in Dashboard.js componentDidMount
    }
    
    return {
      exists: data.exists || false,
      role: data.role || null,
      error: data.error || null
    };
  } catch (error) {
    console.error('Error checking signup status:', error);
    // Return a specific error object that the UI can handle appropriately
    return { 
      exists: false, 
      role: null, 
      error: error.message,
      isConnectionError: error.message.includes('fetch') || error.message.includes('network')
    };
  }
};

/**
 * Get user's mentorship matches (as mentor or mentee)
 * @param {string} userId - The user's Firebase UID
 * @returns {Promise<Object>} - Object containing mentorMatches and menteeMatches arrays
 */
export const getUserMatches = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Validate userId format
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
      throw new Error("Invalid user ID format");
    }

    const response = await fetch(`${API_URL}/get-user-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ userId }),
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return {
      mentorMatches: data.mentorMatches || [],
      menteeMatches: data.menteeMatches || [],
      error: null
    };
  } catch (error) {
    console.error('Error fetching user matches:', error);
    return { 
      mentorMatches: [], 
      menteeMatches: [], 
      error: error.message 
    };
  }
};

/**
 * Updates the status of a mentorship match (confirm, reject, etc.)
 * @param {string} matchId - The ID of the match to update
 * @param {string} status - The new status (confirmed, rejected, etc.)
 * @param {string} userId - The user's Firebase UID
 * @returns {Promise<Object>} - Server response
 */
export const updateMatchStatus = async (matchId, status, userId) => {
  try {
    if (!matchId || !status) {
      throw new Error("Match ID and status are required");
    }
    
    if (!userId) {
      // Try to get current user ID if not provided
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User must be authenticated");
      }
      userId = user.uid;
    }

    // Validate inputs
    if (!/^[a-zA-Z0-9_-]+$/.test(matchId) || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
      throw new Error("Invalid ID format");
    }
    
    // Validate status
    const validStatuses = ['pending', 'approved', 'confirmed', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const response = await fetch(`${API_URL}/update-match-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ 
        matchId, 
        status, 
        userId,
        timestamp: new Date().toISOString()
      }),
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return {
      success: data.success || false,
      message: data.message || "",
      error: null
    };
  } catch (error) {
    console.error('Error updating match status:', error);
    return { 
      success: false, 
      message: "", 
      error: error.message 
    };
  }
};

/**
 * Get all mentorship matches (admin only)
 * @returns {Promise<Object>} - Object containing matches array
 */
export const getAllMatches = async () => {
  try {
    // Verify user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated to access matches");
    }

    const response = await fetch(`${API_URL}/get-all-matches`, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization': `Bearer ${await user.getIdToken()}`
      },
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return {
      matches: data.matches || [],
      error: null
    };
  } catch (error) {
    console.error('Error fetching all matches:', error);
    return { 
      matches: [], 
      error: error.message 
    };
  }
};

// Export the API as a default object
export default {
  checkExistingSignup,
  getUserMatches,
  updateMatchStatus,
  getAllMatches
};
