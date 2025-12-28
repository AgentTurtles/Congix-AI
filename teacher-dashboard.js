// Teacher Dashboard JavaScript

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
  },
  async set(items) {
    if (isChromeExtension) {
      return chrome.storage.local.set(items);
    } else {
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
    }
  }
};

// ===== Toast Notification System =====
function showToast(message, type = 'info', title = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const titles = {
    success: title || 'Success',
    error: title || 'Error',
    warning: title || 'Warning',
    info: title || 'Info'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-content">
      <div class="toast-title">${titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">×</button>
  `;
  
  container.appendChild(toast);
  
  // Close button handler
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

// ===== Confirmation Dialog System =====
function showConfirm(message, title = 'Confirm Action', type = 'danger') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const actionBtn = document.getElementById('confirmActionBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    actionBtn.className = `confirm-action-btn ${type === 'primary' ? 'primary' : ''}`;
    
    modal.style.display = 'flex';
    
    const handleAction = (confirmed) => {
      modal.style.display = 'none';
      actionBtn.replaceWith(actionBtn.cloneNode(true));
      cancelBtn.replaceWith(cancelBtn.cloneNode(true));
      resolve(confirmed);
    };
    
    document.getElementById('confirmActionBtn').addEventListener('click', () => handleAction(true));
    document.getElementById('confirmCancelBtn').addEventListener('click', () => handleAction(false));
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) handleAction(false);
    });
  });
}

// ===== Form Validation =====
function validateAssignmentForm() {
  const title = document.getElementById('assignmentTitle');
  const description = document.getElementById('assignmentDescription');
  const dueDate = document.getElementById('assignmentDueDate');
  
  let isValid = true;
  
  // Clear previous errors
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  
  if (!title.value.trim()) {
    showFieldError(title, 'Title is required');
    isValid = false;
  }
  
  if (!description.value.trim()) {
    showFieldError(description, 'Description is required');
    isValid = false;
  }
  
  if (!dueDate.value) {
    showFieldError(dueDate, 'Due date is required');
    isValid = false;
  } else {
    const selectedDate = new Date(dueDate.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      showFieldError(dueDate, 'Due date cannot be in the past');
      isValid = false;
    }
  }
  
  return isValid;
}

function showFieldError(field, message) {
  field.classList.add('error');
  let errorEl = field.parentElement.querySelector('.form-error');
  
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    field.parentElement.appendChild(errorEl);
  }
  
  errorEl.textContent = message;
  errorEl.classList.add('show');
}

// ===== Loading State =====
function setButtonLoading(button, loading) {
  if (loading) {
    button.classList.add('btn-loading');
    button.dataset.originalContent = button.innerHTML;
    button.innerHTML = `<span class="loading-spinner"></span>`;
  } else {
    button.classList.remove('btn-loading');
    if (button.dataset.originalContent) {
      button.innerHTML = button.dataset.originalContent;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await storage.get(['cognixUser', 'cognixStatus']);
    
    if (!result.cognixUser || result.cognixStatus !== 'teacher') {
      window.location.href = 'auth.html';
      return;
    }
    
    // Initialize dashboard
    initializeDashboard();
    
  } catch (error) {
    console.error('Error loading teacher dashboard:', error);
  }
});

// Initialize dashboard with data
function initializeDashboard() {
  loadStudents();
  updateStats();
  loadAlerts();
  analyzePatterns(); // Run pattern recognition on load
  
  // Navigation handlers
  document.getElementById('assignmentsLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAssignmentManagement();
  });
  
  document.getElementById('reportsLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    openReportsModal();
  });
  
  document.getElementById('alertsLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAlertsModal();
  });
  
  document.getElementById('settingsLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Configure alert thresholds, customize dashboard, and manage preferences', 'info', 'Settings Coming Soon');
  });
  
  // Modal handlers
  document.getElementById('profileBackBtn')?.addEventListener('click', closeStudentProfile);
  document.getElementById('alertsCloseBtn')?.addEventListener('click', closeAlertsModal);
  document.getElementById('saveNotesBtn')?.addEventListener('click', saveStudentNotes);
  document.getElementById('gradeWithAiBtn')?.addEventListener('click', analyzeAssignment);
  
  // Button handlers
  document.getElementById('seeMoreBtn')?.addEventListener('click', () => {
    showToast('View all students with detailed analytics and AI usage patterns', 'info', 'Full Student List Coming Soon');
  });
  
  // Hamburger menu handler
  document.querySelector('.figma-hamburger-btn')?.addEventListener('click', () => {
    const menu = document.querySelector('.figma-nav-menu');
    if (menu) {
      menu.classList.toggle('open');
    }
  });
  
  // Close menu when clicking navigation links
  document.querySelectorAll('.figma-nav-menu .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const menu = document.querySelector('.figma-nav-menu');
      if (menu) {
        menu.classList.remove('open');
      }
    });
  });
  
  // Tab switching handlers
  document.getElementById('studentsTab')?.addEventListener('click', () => switchTab('students'));
  document.getElementById('insightsTab')?.addEventListener('click', () => switchTab('insights'));
  
  // Recommendation dismiss and action handlers using event delegation
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('rec-dismiss')) {
      dismissRecommendation(e.target);
    }
    
    if (e.target.classList.contains('rec-action')) {
      const studentName = e.target.dataset.student;
      const action = e.target.dataset.action;
      
      if (studentName) {
        viewStudentDetails(studentName);
      } else if (action === 'analyze') {
        showToast('This will show a detailed breakdown of AI usage across all students for the English Essay assignment', 'info', 'Assignment Analytics Coming Soon');
      }
    }
    
    // Insight action button handlers
    if (e.target.classList.contains('insight-action-btn') || e.target.closest('.insight-action-btn')) {
      const btn = e.target.classList.contains('insight-action-btn') ? e.target : e.target.closest('.insight-action-btn');
      const studentName = btn.dataset.student;
      const action = btn.dataset.action;
      
      if (studentName || action === 'meeting') {
        viewStudentDetails(studentName || 'Sarah Davis');
      } else if (action === 'guidelines') {
        showToast('Create guidelines document, share with students, and track acknowledgment', 'info', 'AI Usage Guidelines Coming Soon');
      } else if (action === 'alerts') {
        openAlertsModal();
      }
    }
    
    // Student row click handler using event delegation
    if (e.target.classList.contains('teacher-student-row') || e.target.closest('.teacher-student-row')) {
      const row = e.target.classList.contains('teacher-student-row') ? e.target : e.target.closest('.teacher-student-row');
      const nameElement = row.querySelector('.teacher-student-name');
      if (nameElement) {
        // Extract just the name without any emoji flags
        const fullText = nameElement.textContent.trim();
        // Remove plagiarism flags (emoji and spaces)
        const studentName = fullText.replace(/[⚠️🚩]/g, '').trim();
        viewStudentDetails(studentName);
      }
    }
    
    // Alert dismiss button handler
    if (e.target.classList.contains('alert-dismiss')) {
      dismissAlert(e.target);
    }
    
    // Assignment action button handlers
    const editBtn = e.target.closest('.assignment-action-btn.edit');
    if (editBtn) {
      const assignmentId = parseInt(editBtn.dataset.assignmentId);
      if (assignmentId) {
        editAssignment(assignmentId);
      }
    }
    
    const deleteBtn = e.target.closest('.assignment-action-btn.delete');
    if (deleteBtn) {
      const assignmentId = parseInt(deleteBtn.dataset.assignmentId);
      if (assignmentId) {
        deleteAssignment(assignmentId);
      }
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Esc to close modals
    if (e.key === 'Escape') {
      const openModals = [
        { id: 'studentProfileModal', close: closeStudentProfile },
        { id: 'alertsModal', close: closeAlertsModal },
        { id: 'reportsModal', close: closeReportsModal },
        { id: 'assignmentModal', close: closeAssignmentForm },
        { id: 'confirmModal', close: () => document.getElementById('confirmModal').style.display = 'none' }
      ];
      
      for (const modal of openModals) {
        const modalEl = document.getElementById(modal.id);
        if (modalEl && modalEl.style.display === 'flex') {
          modal.close();
          break;
        }
      }
    }
    
    // Enter to submit forms (when focused on input)
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      const form = e.target.closest('.teacher-assignment-form');
      if (form && document.getElementById('assignmentModal').style.display === 'flex') {
        e.preventDefault();
        document.getElementById('saveAssignmentBtn').click();
      }
    }
  });
}

// Load students into the list
function loadStudents() {
  const studentList = document.getElementById('teacherStudentList');
  
  // Comprehensive test student data
  const students = [
    { name: 'Sarah Davis', usage: 'high', assignments: 5, gpa: 3.8, plagiarismRisk: 'none' },
    { name: 'Marcus Thompson', usage: 'high', assignments: 4, gpa: 3.2, plagiarismRisk: 'moderate' },
    { name: 'Emma Wilson', usage: 'medium', assignments: 4, gpa: 3.9, plagiarismRisk: 'none' },
    { name: 'James Johnson', usage: 'medium', assignments: 3, gpa: 3.5, plagiarismRisk: 'none' },
    { name: 'Sophia Chen', usage: 'medium', assignments: 5, gpa: 3.7, plagiarismRisk: 'none' },
    { name: 'John Smith', usage: 'low', assignments: 3, gpa: 3.6, plagiarismRisk: 'none' },
    { name: 'Michael Brown', usage: 'low', assignments: 2, gpa: 3.4, plagiarismRisk: 'none' },
    { name: 'Olivia Martinez', usage: 'low', assignments: 4, gpa: 4.0, plagiarismRisk: 'none' },
    { name: 'Aiden Park', usage: 'low', assignments: 3, gpa: 3.8, plagiarismRisk: 'none' },
    { name: 'Isabella Garcia', usage: 'medium', assignments: 4, gpa: 3.6, plagiarismRisk: 'none' },
    { name: 'Ethan Rodriguez', usage: 'high', assignments: 6, gpa: 3.1, plagiarismRisk: 'high' },
    { name: 'Mia Anderson', usage: 'low', assignments: 2, gpa: 3.9, plagiarismRisk: 'none' },
    { name: 'Noah Williams', usage: 'medium', assignments: 5, gpa: 3.3, plagiarismRisk: 'none' },
    { name: 'Ava Taylor', usage: 'low', assignments: 3, gpa: 3.7, plagiarismRisk: 'none' },
    { name: 'Liam O\'Connor', usage: 'high', assignments: 4, gpa: 3.0, plagiarismRisk: 'high' }
  ];
  
  // Store globally for other functions
  window.testStudents = students;
  
  // Update to Figma structure
  studentList.innerHTML = students.map((student, index) => `
    <div class="figma-table-row">
      <span class="figma-student-name">
        ${student.name}
        ${student.plagiarismRisk === 'moderate' ? '<span class="plagiarism-flag moderate" title="Moderate plagiarism risk (65%)">⚠️</span>' : ''}
        ${student.plagiarismRisk === 'high' ? '<span class="plagiarism-flag high" title="High plagiarism risk (85%)">🚩</span>' : ''}
      </span>
      <div class="figma-usage-indicator ${student.usage}" title="${getUsageText(student.usage)}"></div>
    </div>
  `).join('');
}

// Get usage text for tooltip
function getUsageText(level) {
  const texts = {
    low: 'Low AI Usage (Safe)',
    medium: 'Moderate AI Usage (Monitor)',
    high: 'High AI Usage (Review)'
  };
  return texts[level] || 'Unknown';
}

// Update stats in both Students and Insights views
function updateStats() {
  // Students view stats
  document.getElementById('totalStudents').textContent = '15';
  document.getElementById('activeToday').textContent = '11';
  document.getElementById('avgUsage').textContent = '41%';
  
  // Insights view stats (duplicate elements)
  document.getElementById('totalStudentsInsights').textContent = '15';
  document.getElementById('activeTodayInsights').textContent = '11';
  document.getElementById('avgUsageInsights').textContent = '41%';
}

// View student details
function viewStudentDetails(studentName) {
  openStudentProfile(studentName);
}

// Open student profile modal
function openStudentProfile(studentName) {
  const modal = document.getElementById('studentProfileModal');
  const nameEl = document.getElementById('profileStudentName');
  const avatarEl = document.getElementById('profileAvatar');
  const badgeEl = document.getElementById('profileUsageBadge');
  const notesEl = document.getElementById('profileNotes');
  
  // Set student info
  nameEl.textContent = studentName;
  avatarEl.textContent = studentName.charAt(0);
  
  // Get student data from global test data
  const student = window.testStudents?.find(s => s.name === studentName) || { name: studentName, usage: 'green', assignments: 3, gpa: 3.5 };
  
  const usageTexts = {
    green: 'Low Usage',
    yellow: 'Moderate Usage',
    red: 'High Usage'
  };
  
  badgeEl.textContent = usageTexts[student.usage] || 'Low Usage';
  badgeEl.className = 'profile-usage-badge ' + student.usage;
  
  // Draw usage chart
  drawUsageChart(student.usage, studentName);
  
  // Load assignments
  loadStudentAssignments(student);
  
  // Load notes from storage
  chrome.storage.local.get([`notes_${studentName}`], (result) => {
    notesEl.value = result[`notes_${studentName}`] || '';
  });
  
  modal.style.display = 'flex';
}

// Close student profile
function closeStudentProfile() {
  document.getElementById('studentProfileModal').style.display = 'none';
}

// Draw simple usage chart
function drawUsageChart(usageLevel, studentName) {
  const svg = document.getElementById('usageChart');
  
  // Generate varied patterns for each student
  const patterns = {
    'Sarah Davis': [65, 70, 68, 75, 80, 78, 82],
    'Marcus Thompson': [55, 60, 72, 75, 70, 68, 74],
    'Emma Wilson': [35, 40, 42, 38, 45, 48, 50],
    'James Johnson': [30, 35, 45, 40, 42, 38, 44],
    'Sophia Chen': [40, 42, 38, 45, 43, 47, 49],
    'Isabella Garcia': [32, 38, 40, 42, 45, 43, 46],
    'Noah Williams': [38, 42, 45, 40, 48, 46, 50],
    'Ethan Rodriguez': [70, 75, 78, 72, 80, 82, 85],
    'Liam O\'Connor': [60, 65, 70, 68, 72, 75, 78],
    'John Smith': [15, 18, 20, 22, 18, 20, 16],
    'Michael Brown': [12, 15, 18, 16, 14, 12, 10],
    'Olivia Martinez': [8, 10, 12, 15, 10, 8, 12],
    'Aiden Park': [20, 18, 22, 20, 18, 16, 18],
    'Mia Anderson': [10, 12, 15, 12, 10, 8, 10],
    'Ava Taylor': [18, 20, 22, 20, 18, 20, 22]
  };
  
  const data = patterns[studentName] || (
    usageLevel === 'green' ? [20, 15, 18, 12, 10, 15, 8] :
    usageLevel === 'yellow' ? [35, 40, 38, 45, 42, 48, 45] :
    [70, 75, 72, 78, 80, 75, 78]
  );
  
  const color = usageLevel === 'green' ? '#00d084' :
                usageLevel === 'yellow' ? '#ffd600' : '#ff4444';
  
  const points = data.map((val, i) => 
    `${i * 40},${80 - val}`
  ).join(' ');
  
  svg.innerHTML = `
    <polyline points="${points}" 
              fill="none" 
              stroke="${color}" 
              stroke-width="2"/>
    ${data.map((val, i) => 
      `<circle cx="${i * 40}" cy="${80 - val}" r="3" fill="${color}"/>`
    ).join('')}
  `;
}

// Load student assignments
function loadStudentAssignments(student) {
  const container = document.getElementById('profileAssignments');
  if (student.assignments === 0) {
    container.innerHTML = '<p class="profile-empty">No assignments yet</p>';
    return;
  }
  
  // Varied assignment pool
  const allAssignments = [
    { title: 'Math Homework Ch. 5', score: 85, aiUsage: student.usage },
    { title: 'English Essay: Shakespeare', score: 90, aiUsage: student.usage },
    { title: 'Science Lab: Chemical Reactions', score: 78, aiUsage: student.usage === 'green' ? 'green' : student.usage },
    { title: 'History Research Paper', score: 88, aiUsage: student.usage === 'red' ? 'red' : 'yellow' },
    { title: 'Math Quiz: Algebra', score: 92, aiUsage: 'green' },
    { title: 'Programming Project', score: 95, aiUsage: student.usage },
    { title: 'Biology Worksheet', score: 82, aiUsage: student.usage === 'green' ? 'green' : 'yellow' },
    { title: 'Physics Problem Set', score: 76, aiUsage: student.usage }
  ];
  
  const assignments = allAssignments.slice(0, student.assignments);
  
  container.innerHTML = assignments.map(a => `
    <div class="assignment-item">
      <div class="assignment-info">
        <span class="assignment-title">${a.title}</span>
        <span class="assignment-score">Score: ${a.score}%</span>
      </div>
      <div class="teacher-usage-indicator ${a.aiUsage}"></div>
    </div>
  `).join('');
}

// Save student notes
function saveStudentNotes() {
  const studentName = document.getElementById('profileStudentName').textContent;
  const notes = document.getElementById('profileNotes').value;
  
  chrome.storage.local.set({ [`notes_${studentName}`]: notes }, () => {
    showToast('Your notes have been saved', 'success', 'Notes Saved');
  });
}

// Load alerts
function loadAlerts() {
  // Comprehensive test alerts
  const alerts = [
    { type: 'urgent', message: 'Sarah Davis - 85% AI usage spike detected on recent essay', time: '2 hours ago' },
    { type: 'urgent', message: 'Ethan Rodriguez - Consistent high AI usage across 5 assignments', time: '4 hours ago' },
    { type: 'warning', message: 'English Essay Assignment - 73% of class used high AI assistance', time: '5 hours ago' },
    { type: 'warning', message: 'Marcus Thompson - AI usage increased 45% this week', time: '8 hours ago' },
    { type: 'urgent', message: 'Liam O\'Connor - Possible plagiarism detected on History Paper', time: '12 hours ago' },
    { type: 'info', message: 'Olivia Martinez - AI usage decreased by 35% this month', time: '1 day ago' },
    { type: 'info', message: 'Mia Anderson - Excellent progress with balanced AI use', time: '1 day ago' },
    { type: 'warning', message: 'Math Homework Ch. 5 - Assignment due in 2 days, 40% incomplete', time: '2 days ago' }
  ];
  
  const badgeEl = document.getElementById('alertBadge');
  const menuCountEl = document.getElementById('menuAlertCount');
  
  if (alerts.length > 0) {
    badgeEl.textContent = alerts.length;
    badgeEl.style.display = 'flex';
    menuCountEl.textContent = alerts.length;
    menuCountEl.style.display = 'inline-block';
  }
  
  // Store for modal
  window.currentAlerts = alerts;
}

// Open alerts modal
function openAlertsModal() {
  const modal = document.getElementById('alertsModal');
  const body = document.getElementById('alertsBody');
  
  if (!window.currentAlerts || window.currentAlerts.length === 0) {
    body.innerHTML = '<p class="alerts-empty">No alerts at this time</p>';
  } else {
    body.innerHTML = window.currentAlerts.map(alert => `
      <div class="alert-item ${alert.type}">
        <div class="alert-icon">
          ${alert.type === 'urgent' ? '🔴' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        <div class="alert-content">
          <p class="alert-message">${alert.message}</p>
          <span class="alert-time">${alert.time}</span>
        </div>
        <button class="alert-dismiss">✕</button>
      </div>
    `).join('');
  }
  
  modal.style.display = 'flex';
}

// Close alerts modal
function closeAlertsModal() {
  document.getElementById('alertsModal').style.display = 'none';
}

// Dismiss individual alert
function dismissAlert(btn) {
  btn.closest('.alert-item').remove();
  const remaining = document.querySelectorAll('.alert-item').length;
  
  if (remaining === 0) {
    document.getElementById('alertsBody').innerHTML = '<p class="alerts-empty">No alerts at this time</p>';
    document.getElementById('alertBadge').style.display = 'none';
    document.getElementById('menuAlertCount').style.display = 'none';
  } else {
    document.getElementById('alertBadge').textContent = remaining;
    document.getElementById('menuAlertCount').textContent = remaining;
  }
}

// Analyze assignment with AI
function analyzeAssignment() {
  const btn = document.getElementById('gradeWithAiBtn');
  const originalText = btn.innerHTML;
  
  // Show loading state
  setButtonLoading(btn, true);
  
  // Simulate AI analysis
  setTimeout(() => {
    showToast('Suggested Grade: B+ (87%) | Confidence: 92% | Moderate AI assistance detected (45%)', 'success', 'AI Analysis Complete');
    
    setButtonLoading(btn, false);
  }, 2000);
}

// Dismiss recommendation card
function dismissRecommendation(btn) {
  const card = btn.closest('.recommendation-card');
  card.style.animation = 'slideOut 0.3s ease';
  
  setTimeout(() => {
    card.remove();
    
    // Check if panel is empty
    const remaining = document.querySelectorAll('.recommendation-card').length;
    if (remaining === 0) {
      document.getElementById('recommendationsPanel').style.display = 'none';
    }
  }, 300);
}

// Switch between Students and Insights tabs
function switchTab(tab) {
  const studentsTab = document.getElementById('studentsTab');
  const insightsTab = document.getElementById('insightsTab');
  const studentsView = document.getElementById('studentsView');
  const insightsView = document.getElementById('insightsView');
  
  if (tab === 'students') {
    // Update tab buttons
    studentsTab.classList.add('active');
    insightsTab.classList.remove('active');
    
    // Show/hide views
    studentsView.classList.add('active');
    studentsView.style.display = 'block';
    insightsView.classList.remove('active');
    insightsView.style.display = 'none';
  } else if (tab === 'insights') {
    // Update tab buttons
    insightsTab.classList.add('active');
    studentsTab.classList.remove('active');
    
    // Show/hide views
    insightsView.classList.add('active');
    insightsView.style.display = 'block';
    studentsView.classList.remove('active');
    studentsView.style.display = 'none';
  }
}

// Feedback Templates Management
function openTemplatesModal() {
  const modal = document.getElementById('feedbackTemplatesModal');
  modal.style.display = 'flex';
  loadTemplates();
}

function closeTemplatesModal() {
  const modal = document.getElementById('feedbackTemplatesModal');
  modal.style.display = 'none';
}

async function loadTemplates() {
  try {
    const result = await storage.get(['template_low', 'template_medium', 'template_high']);
    
    // Set default templates if not found
    if (result.template_low) {
      document.getElementById('lowTemplate').value = result.template_low;
    }
    if (result.template_medium) {
      document.getElementById('mediumTemplate').value = result.template_medium;
    }
    if (result.template_high) {
      document.getElementById('highTemplate').value = result.template_high;
    }
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

async function saveTemplate(type) {
  let templateId, storageKey;
  
  switch(type) {
    case 'low':
      templateId = 'lowTemplate';
      storageKey = 'template_low';
      break;
    case 'medium':
      templateId = 'mediumTemplate';
      storageKey = 'template_medium';
      break;
    case 'high':
      templateId = 'highTemplate';
      storageKey = 'template_high';
      break;
  }
  
  const template = document.getElementById(templateId).value;
  
  try {
    await storage.set({ [storageKey]: template });
    
    // Show success feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Saved!';
    btn.style.background = '#00d084';
    btn.style.color = 'white';
    btn.style.borderColor = '#00d084';
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  } catch (error) {
    console.error('Error saving template:', error);
    showToast('Failed to save template. Please try again.', 'error', 'Save Failed');
  }
}

function useTemplate(type) {
  const templateId = type + 'Template';
  const template = document.getElementById(templateId).value;
  
  const currentStudent = document.querySelector('.teacher-student-card')?.dataset.name || 'Student Name';
  const currentUsage = document.querySelector('.teacher-student-card')?.dataset.usage || '0%';
  
  let filledTemplate = template
    .replace(/{student_name}/g, currentStudent)
    .replace(/{usage_level}/g, currentUsage);
  
  // Copy to clipboard
  navigator.clipboard.writeText(filledTemplate).then(() => {
    // Show success feedback
    const btn = event.target;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copied!
    `;
    
    setTimeout(() => {
      btn.innerHTML = originalHTML;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    showToast('Failed to copy template. Please try again.', 'error', 'Copy Failed');
  });
}

// ===== PATTERN RECOGNITION ALGORITHM =====

async function analyzePatterns() {
  try {
    const students = window.testStudents || [];
    const patterns = {
      timestamp: new Date().toISOString(),
      spikes: [],
      consistentHigh: [],
      assignmentPatterns: [],
      timePatterns: [],
      recommendations: []
    };
    
    // Generate 7-day historical data for each student
    const historicalData = generateHistoricalData(students);
    
    // 1. Detect AI Usage Spikes (>40% increase day-over-day)
    patterns.spikes = detectUsageSpikes(historicalData);
    
    // 2. Detect Consistent High Usage (3+ days above 70%)
    patterns.consistentHigh = detectConsistentHighUsage(historicalData);
    
    // 3. Detect Assignment Patterns (which assignments have high AI usage)
    patterns.assignmentPatterns = detectAssignmentPatterns(students);
    
    // 4. Detect Time-Based Patterns (days of week trends)
    patterns.timePatterns = detectTimePatterns(historicalData);
    
    // 5. Generate Dynamic Recommendations
    patterns.recommendations = generateRecommendations(patterns);
    
    // Store patterns in chrome.storage
    await storage.set({ 
      cognixPatterns: patterns,
      historicalUsageData: historicalData
    });
    
    // Update UI with detected patterns
    updatePatternIndicators(patterns);
    
    return patterns;
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    return null;
  }
}

// Generate 7-day historical usage data for students
function generateHistoricalData(students) {
  const data = {};
  const today = new Date();
  
  students.forEach(student => {
    const baseUsage = {
      'red': 75,
      'yellow': 45,
      'green': 20
    }[student.usage] || 20;
    
    data[student.name] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic variance
      let usage = baseUsage;
      
      // Create spikes for certain students
      if (student.name === 'Sarah Davis' && i === 0) {
        usage = 85; // Recent spike
      } else if (student.name === 'Sarah Davis' && i === 1) {
        usage = 45; // Previous day lower
      }
      
      // Add natural variance (±10%)
      usage += Math.floor(Math.random() * 20) - 10;
      usage = Math.max(0, Math.min(100, usage));
      
      data[student.name].push({
        date: date.toISOString().split('T')[0],
        usage: usage,
        dayOfWeek: date.getDay()
      });
    }
  });
  
  return data;
}

// Detect sudden usage spikes (>40% increase)
function detectUsageSpikes(historicalData) {
  const spikes = [];
  
  Object.keys(historicalData).forEach(studentName => {
    const data = historicalData[studentName];
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i].usage;
      const previous = data[i - 1].usage;
      const increase = current - previous;
      const percentIncrease = (increase / previous) * 100;
      
      if (percentIncrease > 40 && current > 60) {
        spikes.push({
          student: studentName,
          date: data[i].date,
          previousUsage: previous,
          currentUsage: current,
          increase: Math.round(percentIncrease),
          severity: current > 80 ? 'high' : 'medium'
        });
      }
    }
  });
  
  return spikes;
}

// Detect consistent high usage (3+ consecutive days above 70%)
function detectConsistentHighUsage(historicalData) {
  const consistent = [];
  
  Object.keys(historicalData).forEach(studentName => {
    const data = historicalData[studentName];
    let consecutiveDays = 0;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i].usage > 70) {
        consecutiveDays++;
        if (consecutiveDays >= 3) {
          // Check if not already added
          if (!consistent.find(c => c.student === studentName)) {
            const avgUsage = data.slice(-7).reduce((sum, d) => sum + d.usage, 0) / 7;
            consistent.push({
              student: studentName,
              consecutiveDays: consecutiveDays,
              averageUsage: Math.round(avgUsage),
              latestUsage: data[data.length - 1].usage,
              trend: data[data.length - 1].usage > data[data.length - 2].usage ? 'increasing' : 'stable'
            });
          }
        }
      } else {
        consecutiveDays = 0;
      }
    }
  });
  
  return consistent;
}

// Detect assignment-specific patterns
function detectAssignmentPatterns(students) {
  const assignmentTypes = [
    'Essay Writing',
    'Research Paper',
    'Lab Report',
    'Code Review',
    'Math Problem Set',
    'Creative Writing',
    'Data Analysis',
    'Reading Comprehension'
  ];
  
  const patterns = assignmentTypes.map(type => {
    // Simulate assignment-specific AI usage patterns
    let avgUsage, riskLevel;
    
    if (['Essay Writing', 'Research Paper', 'Creative Writing'].includes(type)) {
      avgUsage = 65 + Math.floor(Math.random() * 20);
      riskLevel = 'high';
    } else if (['Code Review', 'Data Analysis'].includes(type)) {
      avgUsage = 45 + Math.floor(Math.random() * 15);
      riskLevel = 'medium';
    } else {
      avgUsage = 25 + Math.floor(Math.random() * 15);
      riskLevel = 'low';
    }
    
    return {
      assignmentType: type,
      averageAIUsage: avgUsage,
      riskLevel: riskLevel,
      studentsAffected: Math.floor(students.length * (avgUsage / 100))
    };
  }).sort((a, b) => b.averageAIUsage - a.averageAIUsage);
  
  return patterns.slice(0, 5); // Top 5 patterns
}

// Detect time-based patterns (day of week trends)
function detectTimePatterns(historicalData) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayUsage = new Array(7).fill(0);
  const dayCounts = new Array(7).fill(0);
  
  Object.keys(historicalData).forEach(studentName => {
    historicalData[studentName].forEach(day => {
      dayUsage[day.dayOfWeek] += day.usage;
      dayCounts[day.dayOfWeek]++;
    });
  });
  
  const patterns = dayNames.map((name, index) => ({
    day: name,
    averageUsage: dayCounts[index] > 0 ? Math.round(dayUsage[index] / dayCounts[index]) : 0
  })).sort((a, b) => b.averageUsage - a.averageUsage);
  
  // Return top 3 days with highest usage
  return patterns.slice(0, 3).map(p => ({
    ...p,
    trend: p.averageUsage > 60 ? 'concerning' : 'normal'
  }));
}

// Generate dynamic recommendations based on detected patterns
function generateRecommendations(patterns) {
  const recommendations = [];
  
  // Spike-based recommendations
  if (patterns.spikes.length > 0) {
    const highSeveritySpikes = patterns.spikes.filter(s => s.severity === 'high');
    if (highSeveritySpikes.length > 0) {
      recommendations.push({
        type: 'urgent',
        title: 'Immediate Attention Required',
        message: `${highSeveritySpikes.length} student${highSeveritySpikes.length > 1 ? 's have' : ' has'} experienced sudden AI usage spikes (>40% increase). Review: ${highSeveritySpikes.map(s => s.student).join(', ')}`,
        action: 'Review Students',
        priority: 1
      });
    }
  }
  
  // Consistent high usage recommendations
  if (patterns.consistentHigh.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Sustained High AI Usage',
      message: `${patterns.consistentHigh.length} student${patterns.consistentHigh.length > 1 ? 's show' : ' shows'} consistent high AI usage (3+ days above 70%). Consider intervention meetings.`,
      action: 'Schedule Meetings',
      priority: 2
    });
  }
  
  // Assignment pattern recommendations
  const highRiskAssignments = patterns.assignmentPatterns.filter(p => p.riskLevel === 'high');
  if (highRiskAssignments.length > 0) {
    recommendations.push({
      type: 'info',
      title: 'High-Risk Assignment Types',
      message: `${highRiskAssignments[0].assignmentType} shows highest AI usage (${highRiskAssignments[0].averageAIUsage}%). Consider adding AI detection measures for these assignments.`,
      action: 'View Patterns',
      priority: 3
    });
  }
  
  // Time-based pattern recommendations
  if (patterns.timePatterns.length > 0 && patterns.timePatterns[0].trend === 'concerning') {
    recommendations.push({
      type: 'info',
      title: 'Peak AI Usage Day Detected',
      message: `${patterns.timePatterns[0].day}s show the highest AI usage (${patterns.timePatterns[0].averageUsage}% avg). Consider adjusting assignment deadlines.`,
      action: 'Adjust Schedule',
      priority: 4
    });
  }
  
  return recommendations.sort((a, b) => a.priority - b.priority);
}

// Update UI with pattern indicators
function updatePatternIndicators(patterns) {
  // Update alerts badge if urgent patterns detected
  const urgentCount = patterns.spikes.filter(s => s.severity === 'high').length + 
                      patterns.consistentHigh.filter(c => c.trend === 'increasing').length;
  
  if (urgentCount > 0) {
    const alertsLink = document.getElementById('alertsLink');
    if (alertsLink) {
      const existingBadge = alertsLink.querySelector('.alerts-badge');
      if (existingBadge) {
        const currentCount = parseInt(existingBadge.textContent) || 0;
        existingBadge.textContent = currentCount + urgentCount;
      }
    }
  }
}

// ===== PROGRESS REPORTS GENERATOR =====

function openReportsModal() {
  const modal = document.getElementById('progressReportsModal');
  modal.style.display = 'flex';
  
  // Set default date range (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  document.getElementById('reportEndDate').valueAsDate = today;
  document.getElementById('reportStartDate').valueAsDate = thirtyDaysAgo;
}

function closeReportsModal() {
  const modal = document.getElementById('progressReportsModal');
  modal.style.display = 'none';
}

function setQuickDate(days) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);
  
  document.getElementById('reportEndDate').valueAsDate = today;
  document.getElementById('reportStartDate').valueAsDate = startDate;
}

async function generateProgressReport() {
  const btn = document.getElementById('generatePdfBtn');
  const originalHTML = btn.innerHTML;
  
  // Show loading state
  setButtonLoading(btn, true);
  
  try {
    // Get date range
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    // Get selected content options
    const includeUsage = document.getElementById('includeUsage').checked;
    const includePatterns = document.getElementById('includePatterns').checked;
    const includeAlerts = document.getElementById('includeAlerts').checked;
    const includeStudents = document.getElementById('includeStudents').checked;
    const includeRecommendations = document.getElementById('includeRecommendations').checked;
    
    // Get stored data
    const result = await storage.get(['cognixPatterns', 'historicalUsageData', 'cognixAlerts']);
    const patterns = result.cognixPatterns || {};
    const historicalData = result.historicalUsageData || {};
    const alerts = result.cognixAlerts || [];
    
    // Build report data
    const reportData = {
      title: 'COGNIX AI Usage Progress Report',
      dateRange: { start: startDate, end: endDate },
      generatedAt: new Date().toLocaleString(),
      sections: []
    };
    
    // Add sections based on selections
    if (includeUsage) {
      reportData.sections.push({
        title: 'AI Usage Statistics',
        data: {
          totalStudents: window.testStudents?.length || 15,
          averageUsage: '42%',
          highUsageCount: window.testStudents?.filter(s => s.usage === 'red').length || 4,
          moderateUsageCount: window.testStudents?.filter(s => s.usage === 'yellow').length || 5,
          lowUsageCount: window.testStudents?.filter(s => s.usage === 'green').length || 6
        }
      });
    }
    
    if (includePatterns && patterns.spikes) {
      reportData.sections.push({
        title: 'Pattern Analysis',
        data: {
          spikesDetected: patterns.spikes.length,
          consistentHighUsers: patterns.consistentHigh?.length || 0,
          topRiskyAssignment: patterns.assignmentPatterns?.[0]?.assignmentType || 'N/A',
          peakUsageDay: patterns.timePatterns?.[0]?.day || 'N/A'
        }
      });
    }
    
    if (includeAlerts) {
      reportData.sections.push({
        title: 'Alert History',
        data: {
          totalAlerts: alerts.length,
          urgentAlerts: alerts.filter(a => a.type === 'urgent').length,
          warningAlerts: alerts.filter(a => a.type === 'warning').length,
          infoAlerts: alerts.filter(a => a.type === 'info').length
        }
      });
    }
    
    if (includeStudents && window.testStudents) {
      reportData.sections.push({
        title: 'Individual Student Reports',
        data: window.testStudents.map(s => ({
          name: s.name,
          usage: s.usage,
          assignments: s.assignments,
          gpa: s.gpa,
          plagiarismRisk: s.plagiarismRisk
        }))
      });
    }
    
    if (includeRecommendations && patterns.recommendations) {
      reportData.sections.push({
        title: 'Recommendations',
        data: patterns.recommendations
      });
    }
    
    // Save report to storage
    await storage.set({ lastGeneratedReport: reportData });
    
    // Show success
    setTimeout(() => {
      setButtonLoading(btn, false);
      closeReportsModal();
      
      // Show download notification
      showToast(`Date Range: ${startDate} to ${endDate} | ${reportData.sections.length} sections included`, 'success', 'Progress Report Generated');
    }, 2000);
    
  } catch (error) {
    console.error('Error generating report:', error);
    setButtonLoading(btn, false);
    showToast('Failed to generate report. Please try again.', 'error', 'Report Generation Failed');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Feedback templates modal
  document.getElementById('feedbackTemplatesBtn')?.addEventListener('click', openTemplatesModal);
  document.getElementById('templatesCloseBtn')?.addEventListener('click', closeTemplatesModal);
  
  // Close modal when clicking outside
  document.getElementById('feedbackTemplatesModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'feedbackTemplatesModal') {
      closeTemplatesModal();
    }
  });
  
  // Progress reports modal
  document.getElementById('generateReportBtn')?.addEventListener('click', openReportsModal);
  document.getElementById('reportsCloseBtn')?.addEventListener('click', closeReportsModal);
  document.getElementById('generatePdfBtn')?.addEventListener('click', generateProgressReport);
  
  // Close reports modal when clicking outside
  document.getElementById('progressReportsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'progressReportsModal') {
      closeReportsModal();
    }
  });
  
  // Assignment management modal
  document.getElementById('assignmentCloseBtn')?.addEventListener('click', closeAssignmentManagement);
  document.getElementById('createAssignmentBtn')?.addEventListener('click', openAssignmentForm);
  document.getElementById('assignmentFormCloseBtn')?.addEventListener('click', closeAssignmentForm);
  document.getElementById('saveAssignmentBtn')?.addEventListener('click', saveAssignment);
  document.getElementById('assignmentSearchInput')?.addEventListener('input', searchAssignments);
  
  // Close assignment modals when clicking outside
  document.getElementById('assignmentManagementModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'assignmentManagementModal') {
      closeAssignmentManagement();
    }
  });
  
  document.getElementById('assignmentFormModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'assignmentFormModal') {
      closeAssignmentForm();
    }
  });
});

// ===== ASSIGNMENT MANAGEMENT SYSTEM =====

// Sample assignments data structure
const sampleAssignments = [
  { id: 1, title: 'Research Paper: AI Ethics', type: 'Research Paper', description: 'Write a 5-page research paper on ethical considerations in AI development', dueDate: '2025-01-15', points: 100, status: 'Active', submissions: 12, avgGrade: 85 },
  { id: 2, title: 'Lab Report: Physics Experiment', type: 'Lab Report', description: 'Document findings from the pendulum experiment', dueDate: '2025-01-10', points: 50, status: 'Active', submissions: 15, avgGrade: 92 },
  { id: 3, title: 'Essay: Climate Change', type: 'Essay Writing', description: 'Argumentative essay on climate policy', dueDate: '2025-01-20', points: 75, status: 'Draft', submissions: 0, avgGrade: 0 },
  { id: 4, title: 'Code Review: Sorting Algorithms', type: 'Code Review', description: 'Implement and analyze three sorting algorithms', dueDate: '2025-01-08', points: 100, status: 'Completed', submissions: 15, avgGrade: 88 },
  { id: 5, title: 'Math Problem Set #3', type: 'Math Problem Set', description: 'Calculus problems covering derivatives and integrals', dueDate: '2025-01-12', points: 60, status: 'Active', submissions: 13, avgGrade: 78 }
];

async function openAssignmentManagement() {
  const modal = document.getElementById('assignmentManagementModal');
  modal.style.display = 'flex';
  await loadAssignments();
}

function closeAssignmentManagement() {
  const modal = document.getElementById('assignmentManagementModal');
  modal.style.display = 'none';
}

async function loadAssignments(searchTerm = '') {
  try {
    const result = await storage.get(['cognixAssignments']);
    let assignments = result.cognixAssignments || sampleAssignments;
    
    // Filter by search term
    if (searchTerm) {
      assignments = assignments.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    const listEl = document.getElementById('assignmentsList');
    
    if (assignments.length === 0) {
      listEl.innerHTML = `
        <div class="assignments-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="empty-text">${searchTerm ? 'No assignments found' : 'No assignments yet'}</span>
          <span class="empty-subtext">${searchTerm ? 'Try a different search term' : 'Click "Create Assignment" to get started'}</span>
        </div>
      `;
      return;
    }
    
    listEl.innerHTML = assignments.map(assignment => `
      <div class="assignment-item" data-id="${assignment.id}">
        <div class="assignment-item-header">
          <div class="assignment-item-title-row">
            <span class="assignment-item-title">${assignment.title}</span>
            <span class="assignment-status-badge ${assignment.status.toLowerCase()}">${assignment.status}</span>
          </div>
          <div class="assignment-item-actions">
            <button class="assignment-action-btn edit" data-assignment-id="${assignment.id}" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="assignment-action-btn delete" data-assignment-id="${assignment.id}" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="assignment-item-meta">
          <span class="assignment-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 7h10M7 12h10M7 17h10M5 3v18m14-18v18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${assignment.type}
          </span>
          <span class="assignment-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Due: ${formatDate(assignment.dueDate)}
          </span>
          <span class="assignment-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${assignment.points} pts
          </span>
        </div>
        <div class="assignment-item-stats">
          <div class="assignment-stat">
            <span class="stat-value">${assignment.submissions}/15</span>
            <span class="stat-label-small">Submissions</span>
          </div>
          <div class="assignment-stat">
            <span class="stat-value">${assignment.avgGrade}%</span>
            <span class="stat-label-small">Avg Grade</span>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading assignments:', error);
  }
}

function searchAssignments(event) {
  const searchTerm = event.target.value;
  loadAssignments(searchTerm);
}

function openAssignmentForm(assignmentId = null) {
  const modal = document.getElementById('assignmentFormModal');
  const title = document.getElementById('assignmentFormTitle');
  const form = document.getElementById('assignmentForm');
  
  if (assignmentId) {
    title.textContent = 'Edit Assignment';
    loadAssignmentData(assignmentId);
  } else {
    title.textContent = 'Create Assignment';
    form.reset();
    document.getElementById('assignmentId').value = '';
  }
  
  modal.style.display = 'flex';
}

function closeAssignmentForm() {
  const modal = document.getElementById('assignmentFormModal');
  modal.style.display = 'none';
}

async function loadAssignmentData(assignmentId) {
  try {
    const result = await storage.get(['cognixAssignments']);
    const assignments = result.cognixAssignments || sampleAssignments;
    const assignment = assignments.find(a => a.id === assignmentId);
    
    if (assignment) {
      document.getElementById('assignmentId').value = assignment.id;
      document.getElementById('assignmentTitle').value = assignment.title;
      document.getElementById('assignmentDescription').value = assignment.description;
      document.getElementById('assignmentType').value = assignment.type;
      document.getElementById('assignmentDueDate').value = assignment.dueDate;
      document.getElementById('assignmentPoints').value = assignment.points;
      document.getElementById('assignmentStatus').value = assignment.status;
    }
  } catch (error) {
    console.error('Error loading assignment data:', error);
  }
}

async function saveAssignment() {
  // Validate form first
  if (!validateAssignmentForm()) {
    showToast('Please fix the errors before saving', 'error', 'Validation Error');
    return;
  }
  
  const btn = document.getElementById('saveAssignmentBtn');
  const originalHTML = btn.innerHTML;
  
  // Validate form
  const form = document.getElementById('assignmentForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  // Show loading
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
    </svg>
    Saving...
  `;
  btn.disabled = true;
  
  try {
    const assignmentId = document.getElementById('assignmentId').value;
    const assignmentData = {
      title: document.getElementById('assignmentTitle').value,
      description: document.getElementById('assignmentDescription').value,
      type: document.getElementById('assignmentType').value,
      dueDate: document.getElementById('assignmentDueDate').value,
      points: parseInt(document.getElementById('assignmentPoints').value),
      status: document.getElementById('assignmentStatus').value,
      submissions: 0,
      avgGrade: 0
    };
    
    const result = await storage.get(['cognixAssignments']);
    let assignments = result.cognixAssignments || sampleAssignments;
    
    if (assignmentId) {
      // Update existing
      const index = assignments.findIndex(a => a.id === parseInt(assignmentId));
      if (index !== -1) {
        assignments[index] = { ...assignments[index], ...assignmentData };
      }
    } else {
      // Create new
      const newId = Math.max(...assignments.map(a => a.id), 0) + 1;
      assignments.push({ id: newId, ...assignmentData });
    }
    
    await storage.set({ cognixAssignments: assignments });
    
    // Show success
    showToast('Assignment saved successfully', 'success', 'Saved');
    
    setTimeout(() => {
      setButtonLoading(btn, false);
      closeAssignmentForm();
      loadAssignments();
    }, 1000);
    
  } catch (error) {
    console.error('Error saving assignment:', error);
    setButtonLoading(btn, false);
    showToast('Failed to save assignment. Please try again.', 'error', 'Save Failed');
  }
}

async function editAssignment(assignmentId) {
  openAssignmentForm(assignmentId);
}

async function deleteAssignment(assignmentId) {
  const confirmed = await showConfirm(
    'This action cannot be undone. All student data for this assignment will be permanently deleted.',
    'Delete Assignment?',
    'danger'
  );
  
  if (!confirmed) {
    return;
  }
  
  try {
    const result = await storage.get(['cognixAssignments']);
    let assignments = result.cognixAssignments || sampleAssignments;
    
    assignments = assignments.filter(a => a.id !== assignmentId);
    
    await storage.set({ cognixAssignments: assignments });
    await loadAssignments();
    
    showToast('Assignment deleted successfully', 'success', 'Deleted');
    
  } catch (error) {
    console.error('Error deleting assignment:', error);
    showToast('Failed to delete assignment. Please try again.', 'error', 'Delete Failed');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}
