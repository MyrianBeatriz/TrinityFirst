// src/services/api.js

// Get API URL from environment variable with fallback
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";

// Check if user has already signed up for mentorship
export const checkExistingSignup = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/check-signup-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
      credentials: 'same-origin'
    });
    
    const data = await response.json();
    return {
      exists: data.exists || false,
      role: data.role || null,
      error: data.error || null
    };
  } catch (error) {
    console.error('Error checking signup status:', error);
    return { exists: false, role: null, error: error.message };
  }
};

// Get mentorship matches for a user (both mentor and mentee)
export const getUserMatches = async (userId) => {
  try {
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
      throw new Error(`Server error: ${response.status}`);
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

// Update match status (confirm, reject, etc.)
export const updateMatchStatus = async (matchId, status, userId) => {
  try {
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
      throw new Error(`Server error: ${response.status}`);
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

// Get all mentorship matches (admin only)
export const getAllMatches = async () => {
  try {
    const response = await fetch(`${API_URL}/get-all-matches`, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
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
