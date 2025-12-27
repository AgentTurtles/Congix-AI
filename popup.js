/**
 * Popup Script for COGNIX AI Extension
 */

// Fallback storage for testing outside Chrome extension
const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage;
const storage = {
  async get(keys) {
    if (isChromeExtension) {
      return chrome.storage.local.get(keys);
    } else {
      const result = {};
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        }
      });
      return result;
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is already logged in
  const result = await storage.get(['cognixUser', 'cognixStatus']);
  if (result.cognixUser && result.cognixStatus) {
    // Auto-redirect to appropriate dashboard
    if (result.cognixStatus === 'teacher') {
      window.location.href = 'teacher-dashboard.html';
    } else if (result.cognixStatus === 'student') {
      window.location.href = 'student-dashboard.html';
    }
    return;
  }
  
  // If not logged in, show normal popup
  attachEventListeners();
});

/**
 * Attach event listeners
 */
function attachEventListeners() {
  const getStartedBtn = document.getElementById('getStartedBtn');
  const signinLink = document.getElementById('signinLink');
  
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      window.location.href = 'signup.html';
    });
  }
  
  if (signinLink) {
    signinLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'signin.html';
    });
  }
}
