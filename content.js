/**
 * Content Script for AI Classroom Extension
 * Detects Google Classroom context and injects appropriate UI components
 */

// Session state
let currentSession = {
  id: generateSessionId(),
  assignmentId: null,
  interactions: [],
  role: null // 'student' or 'teacher'
};

let isAuthenticated = false;
let currentUser = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  console.log('AI Classroom Extension initialized');
  
  // Check authentication first
  const authResult = await checkAuthentication();
  if (!authResult) {
    // Show auth required banner
    showAuthBanner();
    return;
  }
  
  // Detect and extract assignment information
  if (isGoogleClassroomAssignment()) {
    await detectAndStoreAssignment();
  }
  
  detectContext();
  observePageChanges();
  observeAssignmentChanges();
}

/**
 * Detect and store assignment information
 */
async function detectAndStoreAssignment() {
  try {
    // Load the classroom detector functions
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('classroom-detector.js');
    document.head.appendChild(script);
    
    // Wait for script to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Extract assignment info
    if (typeof extractAssignmentInfo === 'function') {
      const assignmentInfo = extractAssignmentInfo();
      if (assignmentInfo && assignmentInfo.title) {
        await chrome.storage.local.set({ currentAssignment: assignmentInfo });
        console.log('Assignment detected:', assignmentInfo.title);
      }
    }
  } catch (error) {
    console.error('Error detecting assignment:', error);
  }
}

/**
 * Observe for assignment page changes
 */
function observeAssignmentChanges() {
  const observer = new MutationObserver(async () => {
    if (isGoogleClassroomAssignment()) {
      await detectAndStoreAssignment();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Check if user is authenticated
 */
async function checkAuthentication() {
  try {
    const result = await chrome.storage.local.get(['cognixUser', 'cognixStatus']);
    if (result.cognixUser) {
      isAuthenticated = true;
      currentUser = result.cognixUser;
      currentSession.role = result.cognixStatus; // 'teacher' or 'student'
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Show authentication required banner
 */
function showAuthBanner() {
  // Check if banner already exists
  if (document.getElementById('cognix-auth-banner')) return;
  
  const banner = document.createElement('div');
  banner.id = 'cognix-auth-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px;
    text-align: center;
    z-index: 999999;
    font-family: 'Bricolage Grotesque', sans-serif;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  `;
  
  banner.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto;">
      <strong style="font-size: 16px;">COGNIX AI</strong>
      <p style="margin: 8px 0; font-size: 14px;">Sign in to access ethical AI guidance for Google Classroom</p>
      <button id="cognix-signin-btn" style="
        background: white;
        color: #667eea;
        border: none;
        padding: 10px 24px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        margin-right: 8px;
        transition: transform 0.2s;
      ">Sign In</button>
      <button id="cognix-signup-btn" style="
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid white;
        padding: 10px 24px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        transition: transform 0.2s;
      ">Sign Up</button>
    </div>
  `;
  
  document.body.insertBefore(banner, document.body.firstChild);
  
  // Add event listeners
  document.getElementById('cognix-signin-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openAuthPage', page: 'signin' });
  });
  
  document.getElementById('cognix-signup-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openAuthPage', page: 'signup' });
  });
}

/**
 * Detect whether user is student or teacher and page context
 */
function detectContext() {
  const url = window.location.href;
  
  // Use authenticated role from storage
  if (currentSession.role === 'teacher') {
    // Only show dashboard on grading pages
    if (url.includes('/u/') && url.includes('/grading/')) {
      injectTeacherDashboard();
    }
  } else if (currentSession.role === 'student') {
    // Only show panel on assignment pages
    if (url.includes('/c/') && (url.includes('/a/') || url.includes('/sa/'))) {
      extractAssignmentId();
      injectStudentPanel();
    }
  }
}

/**
 * Observe page changes for SPA navigation
 */
function observePageChanges() {
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      detectContext();
    }
  }).observe(document.body, { subtree: true, childList: true });
}

/**
 * Extract assignment ID from URL
 */
function extractAssignmentId() {
  const match = window.location.href.match(/\/a\/([^\/]+)/);
  if (match) {
    currentSession.assignmentId = match[1];
  }
}

/**
 * Inject student-side guided AI panel
 */
function injectStudentPanel() {
  // Prevent duplicate injection
  if (document.getElementById('ai-classroom-panel')) return;
  
  // Wait for the main content area to load
  const checkInterval = setInterval(() => {
    const mainContent = document.querySelector('[role="main"]');
    if (mainContent) {
      clearInterval(checkInterval);
      createStudentPanel(mainContent);
    }
  }, 500);
  
  setTimeout(() => clearInterval(checkInterval), 10000); // Timeout after 10 seconds
}

/**
 * Create the student guidance panel
 */
function createStudentPanel(parentElement) {
  const panel = document.createElement('div');
  panel.id = 'ai-classroom-panel';
  panel.className = 'ai-classroom-panel collapsed';
  
  panel.innerHTML = `
    <div class="ai-panel-header">
      <div class="ai-panel-title">
        <span class="ai-icon">🤖</span>
        <span>Guided AI</span>
      </div>
      <button class="ai-panel-toggle" id="ai-panel-toggle">
        <span class="toggle-icon">▼</span>
      </button>
    </div>
    
    <div class="ai-panel-content" id="ai-panel-content">
      <div class="ai-panel-section">
        <div class="ai-notice">
          <strong>Think First, Then Ask</strong>
          <p>Before the AI can help, share your thinking process below.</p>
        </div>
        
        <div class="reasoning-input-container">
          <label for="student-reasoning">Your Reasoning & Attempt:</label>
          <textarea 
            id="student-reasoning" 
            class="reasoning-textarea"
            placeholder="Describe your thought process, what you've tried, or where you're stuck..."
            rows="4"
          ></textarea>
          <div class="character-count">
            <span id="char-count">0</span> / 50 minimum
          </div>
        </div>
        
        <button 
          id="request-guidance-btn" 
          class="guidance-btn" 
          disabled
        >
          Request Guidance
        </button>
      </div>
      
      <div class="ai-response-section" id="ai-response-section" style="display: none;">
        <div class="ai-response-header">
          <strong>🎯 Guided Prompts</strong>
          <span class="guidance-level" id="guidance-level"></span>
        </div>
        <div class="ai-prompts" id="ai-prompts"></div>
        <button id="continue-thinking-btn" class="secondary-btn">
          Continue Thinking
        </button>
      </div>
      
      <div class="ai-usage-indicator">
        <div class="usage-dots">
          <span class="usage-label">Session AI Usage:</span>
          <div class="dots-container" id="interaction-dots"></div>
        </div>
      </div>
    </div>
  `;
  
  parentElement.appendChild(panel);
  
  // Attach event listeners
  attachStudentPanelListeners();
  
  // Attach submission interceptor
  interceptSubmission();
}

/**
 * Attach event listeners to student panel
 */
function attachStudentPanelListeners() {
  // Toggle panel
  const toggleBtn = document.getElementById('ai-panel-toggle');
  const panelContent = document.getElementById('ai-panel-content');
  const panel = document.getElementById('ai-classroom-panel');
  
  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    toggleBtn.querySelector('.toggle-icon').textContent = 
      panel.classList.contains('collapsed') ? '▼' : '▲';
  });
  
  // Monitor reasoning input
  const reasoningTextarea = document.getElementById('student-reasoning');
  const charCount = document.getElementById('char-count');
  const requestBtn = document.getElementById('request-guidance-btn');
  
  reasoningTextarea.addEventListener('input', (e) => {
    const length = e.target.value.length;
    charCount.textContent = length;
    requestBtn.disabled = length < 50;
  });
  
  // Request guidance
  requestBtn.addEventListener('click', handleGuidanceRequest);
  
  // Continue thinking button
  const continueBtn = document.getElementById('continue-thinking-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      document.getElementById('ai-response-section').style.display = 'none';
      reasoningTextarea.value = '';
      charCount.textContent = '0';
      requestBtn.disabled = true;
    });
  }
}

/**
 * Handle guidance request
 */
async function handleGuidanceRequest() {
  const reasoning = document.getElementById('student-reasoning').value;
  const requestBtn = document.getElementById('request-guidance-btn');
  
  requestBtn.disabled = true;
  requestBtn.textContent = 'Generating guidance...';
  
  try {
    // Get assignment context
    const context = {
      assignmentId: currentSession.assignmentId,
      assignmentType: detectAssignmentType(),
      subject: 'General',
      studentInput: reasoning,
      currentStage: determineStage()
    };
    
    // Request guidance from background script
    const response = await chrome.runtime.sendMessage({
      action: 'generateGuidance',
      context,
      reasoning
    });
    
    if (response.success) {
      displayGuidance(response.guidance);
      
      // Save interaction
      currentSession.interactions.push({
        timestamp: Date.now(),
        type: response.guidance.type,
        level: response.guidance.level,
        hasReasoning: true
      });
      
      await chrome.runtime.sendMessage({
        action: 'saveInteraction',
        data: {
          assignmentId: currentSession.assignmentId,
          studentId: 'current-user', // Would get from Google Classroom in production
          type: response.guidance.type,
          level: response.guidance.level,
          stage: determineStage(),
          hasReasoning: true,
          sessionId: currentSession.id
        }
      });
      
      updateUsageIndicator();
    }
  } catch (error) {
    console.error('Error requesting guidance:', error);
    alert('Failed to generate guidance. Please try again.');
  } finally {
    requestBtn.disabled = false;
    requestBtn.textContent = 'Request Guidance';
  }
}

/**
 * Display AI guidance prompts
 */
function displayGuidance(guidance) {
  const responseSection = document.getElementById('ai-response-section');
  const promptsContainer = document.getElementById('ai-prompts');
  const levelIndicator = document.getElementById('guidance-level');
  
  // Set guidance level indicator
  levelIndicator.textContent = `${guidance.level} support`;
  levelIndicator.className = `guidance-level level-${guidance.level}`;
  
  // Display prompts
  promptsContainer.innerHTML = guidance.prompts.map((prompt, index) => `
    <div class="prompt-item">
      <span class="prompt-number">${index + 1}</span>
      <p>${prompt}</p>
    </div>
  `).join('');
  
  responseSection.style.display = 'block';
}

/**
 * Update usage indicator dots
 */
function updateUsageIndicator() {
  const dotsContainer = document.getElementById('interaction-dots');
  const interactions = currentSession.interactions;
  
  dotsContainer.innerHTML = interactions.map(interaction => {
    const colorClass = interaction.level === 'high' ? 'high' : 
                       interaction.level === 'medium' ? 'medium' : 'low';
    return `<span class="usage-dot ${colorClass}" title="${interaction.type}"></span>`;
  }).join('');
}

/**
 * Detect assignment type from page
 */
function detectAssignmentType() {
  // Simple detection - would be more sophisticated in production
  const title = document.querySelector('h1')?.textContent || '';
  if (title.includes('Essay') || title.includes('Write')) return 'essay';
  if (title.includes('Math') || title.includes('Problem')) return 'problem-solving';
  return 'general';
}

/**
 * Determine current stage of work
 */
function determineStage() {
  const interactionCount = currentSession.interactions.length;
  if (interactionCount === 0) return 'beginning';
  if (interactionCount < 5) return 'middle';
  return 'completion';
}

/**
 * Intercept submission to add transparency summary
 */
function interceptSubmission() {
  // Observe for submission button clicks
  const observer = new MutationObserver(() => {
    const submitButtons = document.querySelectorAll('button[jsname], button[aria-label*="Turn in"], button[aria-label*="Submit"]');
    
    submitButtons.forEach(button => {
      if (!button.hasAttribute('data-ai-intercepted')) {
        button.setAttribute('data-ai-intercepted', 'true');
        
        button.addEventListener('click', async (e) => {
          if (currentSession.interactions.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            
            await showTransparencySummary(button);
          }
        }, true);
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Show transparency summary before submission
 */
async function showTransparencySummary(originalButton) {
  // Generate summary
  const response = await chrome.runtime.sendMessage({
    action: 'generateSummary',
    interactions: currentSession.interactions
  });
  
  if (!response.success) {
    originalButton.click();
    return;
  }
  
  const summary = response.summary;
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'ai-transparency-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>🔍 AI Transparency Summary</h2>
      <div class="summary-section">
        <div class="summary-level">
          <strong>AI Assistance Level:</strong> 
          <span class="level-badge ${summary.aiUsage}">${summary.level}</span>
        </div>
        <p class="summary-details">${summary.details}</p>
      </div>
      
      <div class="reflection-section">
        <label for="student-reflection">
          <strong>Reflect on your learning (required):</strong>
          <p>How did AI guidance influence your understanding?</p>
        </label>
        <textarea 
          id="student-reflection" 
          rows="3"
          placeholder="Example: The AI helped me realize I needed to break the problem into smaller parts..."
        ></textarea>
      </div>
      
      <div class="modal-actions">
        <button class="cancel-btn" id="cancel-submit">Review Work</button>
        <button class="submit-btn" id="confirm-submit" disabled>Submit Assignment</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Monitor reflection input
  const reflectionTextarea = modal.querySelector('#student-reflection');
  const confirmBtn = modal.querySelector('#confirm-submit');
  
  reflectionTextarea.addEventListener('input', (e) => {
    confirmBtn.disabled = e.target.value.length < 30;
  });
  
  // Handle cancel
  modal.querySelector('#cancel-submit').addEventListener('click', () => {
    modal.remove();
  });
  
  // Handle confirm
  confirmBtn.addEventListener('click', async () => {
    const reflection = reflectionTextarea.value;
    
    // Store summary and reflection
    await chrome.storage.local.set({
      [`submission_${currentSession.assignmentId}`]: {
        summary,
        reflection,
        interactions: currentSession.interactions,
        timestamp: Date.now()
      }
    });
    
    modal.remove();
    
    // Proceed with original submission
    originalButton.click();
  });
}

/**
 * Inject teacher dashboard components
 */
function injectTeacherDashboard() {
  // Prevent duplicate injection
  if (document.getElementById('ai-teacher-dashboard')) return;
  
  const checkInterval = setInterval(() => {
    const mainContent = document.querySelector('[role="main"]');
    if (mainContent) {
      clearInterval(checkInterval);
      createTeacherDashboard(mainContent);
    }
  }, 500);
  
  setTimeout(() => clearInterval(checkInterval), 10000);
}

/**
 * Create teacher dashboard interface - Using Figma Design
 */
function createTeacherDashboard(parentElement) {
  const dashboard = document.createElement('div');
  dashboard.id = 'ai-teacher-dashboard';
  dashboard.className = 'ai-teacher-dashboard';
  
  // Figma design implementation with actual layout from design
  dashboard.innerHTML = `
    <div class="figma-teacher-screen">
      <!-- Background with overlay from Figma -->
      <div class="background-overlay"></div>
      
      <!-- Header with COGNIX branding (Figma design) -->
      <div class="teacher-header">
        <div class="profile-circle">
          <div class="profile-image"></div>
        </div>
        <p class="cognix-title">COGNIX</p>
        <div class="menu-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <p class="dashboard-title">Teacher's Dashboard</p>
      
      <!-- Grade With AI Section (from Figma) -->
      <div class="grade-with-ai-card">
        <div class="card-inner">
          <h3 class="card-title">Grade With AI</h3>
          
          <div class="student-table">
            <div class="table-header">
              <span class="header-names">Names:</span>
              <span class="header-usage">AI usage</span>
            </div>
            
            <div class="table-divider"></div>
            
            <div class="student-rows" id="student-rows">
              <!-- Will be populated with actual data -->
            </div>
            
            <button class="see-more-button">See More.....</button>
          </div>
        </div>
      </div>
      
      <!-- Assignment Feedback Section (from Figma) -->
      <p class="feedback-title">Assignment Feedback</p>
      <div class="feedback-card">
        <div class="feedback-content" id="insights-container">
          <p class="placeholder-text">idk what to add here rn</p>
        </div>
      </div>
    </div>
  `;
  
  // Insert at top of main content
  if (parentElement.firstChild) {
    parentElement.insertBefore(dashboard, parentElement.firstChild);
  } else {
    parentElement.appendChild(dashboard);
  }
  
  // Load student data
  loadStudentAIUsage();
  
  // Enhance submission rows with AI indicators
  enhanceSubmissionRows();
}

/**
 * Load and display student AI usage
 */
async function loadStudentAIUsage() {
  const studentRowsContainer = document.getElementById('student-rows');
  if (!studentRowsContainer) return;
  
  // Get stored interactions
  const { interactions = [] } = await chrome.storage.local.get('interactions');
  
  // Group by student (in production, would get from Google Classroom API)
  const mockStudents = [
    { name: 'Bredon Urie', id: 'student1', aiLevel: 'low' },
    { name: 'Ryan Ross', id: 'student2', aiLevel: 'high' },
    { name: 'Gerard Way', id: 'student3', aiLevel: 'medium' },
    { name: 'Patrick Stump', id: 'student4', aiLevel: 'low' }
  ];
  
  studentRowsContainer.innerHTML = mockStudents.map((student, index) => {
    const colorClass = student.aiLevel === 'high' ? 'red' : 
                       student.aiLevel === 'medium' ? 'yellow' : 'green';
    
    return `
      <div class="student-row" data-student-id="${student.id}">
        <span class="student-name">${student.name}</span>
        <div class="ai-usage-dot ${colorClass}" title="${student.aiLevel} AI usage"></div>
      </div>
      ${index < mockStudents.length - 1 ? '<div class="row-divider"></div>' : ''}
    `;
  }).join('');
  
  // Add click handlers for detailed view
  document.querySelectorAll('.student-row').forEach(row => {
    row.addEventListener('click', () => {
      const studentId = row.dataset.studentId;
      showStudentDetailedView(studentId);
    });
  });
}

/**
 * Show detailed view for a specific student
 */
function showStudentDetailedView(studentId) {
  const modal = document.createElement('div');
  modal.className = 'ai-transparency-modal';
  modal.innerHTML = `
    <div class="modal-content teacher-insight-modal">
      <h2>Student AI Usage Insights</h2>
      <div class="insight-sections">
        <div class="insight-section">
          <h3>AI Assistance Level</h3>
          <div class="level-indicator medium">Medium Support</div>
          <p>Student requested 7 guidance prompts throughout the assignment.</p>
        </div>
        
        <div class="insight-section">
          <h3>Reasoning Quality</h3>
          <div class="quality-indicator good">Strong</div>
          <p>Student consistently provided thoughtful reasoning before requesting AI help.</p>
        </div>
        
        <div class="insight-section">
          <h3>Independence Indicator</h3>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 75%"></div>
          </div>
          <p>75% - Good balance of independent work and guided support</p>
        </div>
        
        <div class="insight-section">
          <h3>Suggested Feedback</h3>
          <ul class="feedback-suggestions">
            <li>✓ Excellent critical thinking demonstrated throughout</li>
            <li>✓ Good use of AI as a thinking partner, not answer source</li>
            <li>→ Consider applying this problem-solving approach to future assignments</li>
          </ul>
        </div>
        
        <div class="insight-section">
          <h3>Student Reflection</h3>
          <blockquote>
            "The AI helped me realize I needed to break the problem into smaller parts. 
            Instead of giving me the answer, it asked questions that made me think deeper 
            about my approach."
          </blockquote>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="secondary-btn" id="close-insights">Close</button>
        <button class="primary-btn" id="provide-feedback">Provide Feedback</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#close-insights').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.querySelector('#provide-feedback').addEventListener('click', () => {
    // In production, would open Google Classroom feedback interface
    alert('This would open the feedback interface in Google Classroom');
    modal.remove();
  });
}

/**
 * Enhance existing submission rows with AI indicators
 */
function enhanceSubmissionRows() {
  const observer = new MutationObserver(() => {
    // Find submission rows in Google Classroom
    const submissionRows = document.querySelectorAll('[data-student-id], .student-submission-row');
    
    submissionRows.forEach(row => {
      if (!row.hasAttribute('data-ai-enhanced')) {
        row.setAttribute('data-ai-enhanced', 'true');
        
        // Add AI indicator
        const indicator = document.createElement('span');
        indicator.className = 'ai-usage-indicator-inline';
        indicator.innerHTML = '🤖';
        indicator.title = 'View AI usage details';
        
        row.appendChild(indicator);
        
        indicator.addEventListener('click', (e) => {
          e.stopPropagation();
          const studentId = row.dataset.studentId;
          showStudentDetailedView(studentId);
        });
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectContext,
    generateSessionId,
    calculateUsageLevel
  };
}
