// src/utils/api.js or src/services/api.js

export const checkExistingSignup = async (userId) => {
  try {
    const response = await fetch('/api/check-signup-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking signup status:', error);
    return false;
  }
};

// You can add other API utility functions here as well
