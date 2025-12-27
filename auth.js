// Authentication functionality for COGNIX AI Chrome Extension

// Initialize authentication state
let currentUser = null;
let userStatus = null; // 'teacher' or 'student'

// Fallback storage for testing outside Chrome extension
const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage;
const storage = {
  async get(keys) {
    if (isChromeExtension) {
      return chrome.storage.local.get(keys);
    } else {
      // Use localStorage as fallback
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
  },
  async set(items) {
    if (isChromeExtension) {
      return chrome.storage.local.set(items);
    } else {
      // Use localStorage as fallback
      Object.keys(items).forEach(key => {
        localStorage.setItem(key, JSON.stringify(items[key]));
      });
      return Promise.resolve();
    }
  },
  async remove(keys) {
    if (isChromeExtension) {
      return chrome.storage.local.remove(keys);
    } else {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => {
        localStorage.removeItem(key);
      });
      return Promise.resolve();
    }
  }
};

// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = await checkAuthStatus();
  
  // Auto-redirect to dashboard if already logged in
  const currentPage = window.location.pathname.split('/').pop();
  if (isLoggedIn && (currentPage === 'auth.html' || currentPage === 'signin.html' || currentPage === 'signup.html' || currentPage === 'popup.html')) {
    // Redirect to appropriate dashboard
    if (userStatus === 'teacher') {
      window.location.href = 'teacher-dashboard.html';
    } else if (userStatus === 'student') {
      window.location.href = 'student-dashboard.html';
    }
    return; // Stop further initialization
  }
  
  initializeAuthUI();
});

// Check authentication status from Chrome storage
async function checkAuthStatus() {
  try {
    const result = await storage.get(['cognixUser', 'cognixStatus']);
    if (result.cognixUser) {
      currentUser = result.cognixUser;
      userStatus = result.cognixStatus;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
}

// Initialize UI based on current page
function initializeAuthUI() {
  // Get Started button on auth.html
  const getStartedBtn = document.getElementById('getStartedBtn');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      window.location.href = 'signup.html';
    });
  }

  // Sign Up form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    initializeSignUpForm();
  }

  // Sign In form
  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    initializeSignInForm();
  }
  
  // Initialize navigation components
  initializeNavigation();
}

// Initialize navigation menu, back button, and profile menu
function initializeNavigation() {
  // Back button functionality
  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.history.back();
    });
  }
  
  // Hamburger menu toggle
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const navMenu = document.getElementById('navMenu');
  if (hamburgerMenu && navMenu) {
    hamburgerMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('active');
      // Close profile menu if open
      const profileDropdown = document.getElementById('profileDropdown');
      if (profileDropdown) {
        profileDropdown.classList.remove('active');
      }
    });
  }
  
  // Profile menu toggle
  const profileMenu = document.getElementById('profileMenu');
  const profileDropdown = document.getElementById('profileDropdown');
  if (profileMenu && profileDropdown) {
    profileMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('active');
      // Close nav menu if open
      if (navMenu) {
        navMenu.classList.remove('active');
      }
    });
    
    // Load user info for profile
    loadUserProfile();
  }
  
  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (navMenu && !navMenu.contains(e.target) && e.target !== hamburgerMenu) {
      navMenu.classList.remove('active');
    }
    if (profileDropdown && !profileDropdown.contains(e.target) && e.target !== profileMenu) {
      profileDropdown.classList.remove('active');
    }
  });
  
  // Logout functionality
  const logoutLink = document.getElementById('logoutLink');
  const profileLogoutLink = document.getElementById('profileLogoutLink');
  
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      signOut();
    });
  }
  
  if (profileLogoutLink) {
    profileLogoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      signOut();
    });
  }
  
  // About and Help links (placeholder functionality)
  const aboutLink = document.getElementById('aboutLink');
  const helpLink = document.getElementById('helpLink');
  const profileSettingsLink = document.getElementById('profileSettingsLink');
  
  if (aboutLink) {
    aboutLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('COGNIX AI - Your intelligent learning companion.\\nVersion 1.0');
    });
  }
  
  if (helpLink) {
    helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('For help and support, please visit our documentation or contact support@cognix.com');
    });
  }
  
  if (profileSettingsLink) {
    profileSettingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Settings feature coming soon!');
    });
  }
}

// Load user profile information
async function loadUserProfile() {
  try {
    const result = await storage.get(['cognixUser', 'cognixStatus']);
    if (result.cognixUser) {
      const users = await getAllUsers();
      const user = users[result.cognixUser];
      
      if (user) {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileName) {
          profileName.textContent = `${user.firstName} ${user.lastName}`;
        }
        if (profileEmail) {
          profileEmail.textContent = user.email;
        }
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Initialize Sign Up form
function initializeSignUpForm() {
  const teacherBtn = document.getElementById('teacherBtn');
  const studentBtn = document.getElementById('studentBtn');
  const signupForm = document.getElementById('signupForm');
  
  let selectedStatus = null;

  // Status selection
  teacherBtn.addEventListener('click', () => {
    selectedStatus = 'teacher';
    teacherBtn.classList.add('selected');
    studentBtn.classList.remove('selected');
  });

  studentBtn.addEventListener('click', () => {
    selectedStatus = 'student';
    studentBtn.classList.add('selected');
    teacherBtn.classList.remove('selected');
  });

  // Form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!selectedStatus) {
      alert('Please select your status (Teacher or Student)');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    // Check if username already exists
    const existingUsers = await getAllUsers();
    if (existingUsers[username]) {
      alert('Username already exists. Please choose another.');
      return;
    }

    // Create user object
    const user = {
      firstName,
      lastName,
      username,
      email,
      status: selectedStatus,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString()
    };

    // Save user to storage
    existingUsers[username] = user;
    await storage.set({ cognixUsers: existingUsers });

    // Set current user and remember login (always remember by default)
    await storage.set({
      cognixUser: username,
      cognixStatus: selectedStatus,
      rememberMe: true,
      lastLogin: new Date().toISOString()
    });
    
    // Redirect to appropriate dashboard based on status
    if (selectedStatus === 'teacher') {
      window.location.href = 'teacher-dashboard.html';
    } else if (selectedStatus === 'student') {
      window.location.href = 'student-dashboard.html';
    } else {
      window.location.href = 'auth.html';
    }
  });
}

// Initialize Sign In form
function initializeSignInForm() {
  const signinForm = document.getElementById('signinForm');

  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('signinUsername').value.trim();
    const password = document.getElementById('signinPassword').value;

    // Get all users
    const users = await getAllUsers();
    const user = users[username];

    if (!user) {
      alert('User not found');
      return;
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      alert('Incorrect password');
      return;
    }

    // Set current user and remember login (always remember by default)
    await storage.set({
      cognixUser: username,
      cognixStatus: user.status,
      rememberMe: true,
      lastLogin: new Date().toISOString()
    });

    // Redirect to appropriate dashboard based on status
    if (user.status === 'teacher') {
      window.location.href = 'teacher-dashboard.html';
    } else if (user.status === 'student') {
      window.location.href = 'student-dashboard.html';
    } else {
      window.location.href = 'auth.html';
    }
  });
}

// Get all users from storage
async function getAllUsers() {
  try {
    const result = await storage.get('cognixUsers');
    return result.cognixUsers || {};
  } catch (error) {
    console.error('Error getting users:', error);
    return {};
  }
}

// Simple password hashing (in production, use proper encryption)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password against hash
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Sign out function (can be called from other pages)
async function signOut() {
  await storage.remove(['cognixUser', 'cognixStatus']);
  currentUser = null;
  userStatus = null;
  window.location.href = 'auth.html';
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkAuthStatus,
    signOut,
    getAllUsers
  };
}
