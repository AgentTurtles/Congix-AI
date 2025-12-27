/**
 * Google Classroom Assignment Detector
 * Detects and extracts assignment information from Google Classroom pages
 */

/**
 * Detect if current page is a Google Classroom assignment
 */
function isGoogleClassroomAssignment() {
  const url = window.location.href;
  // Assignment URLs typically: https://classroom.google.com/c/*/a/*/details
  return url.includes('classroom.google.com') && 
         (url.includes('/a/') || url.includes('/sa/')) &&
         (url.includes('/details') || url.includes('/submissions'));
}

/**
 * Extract assignment information from the page
 */
function extractAssignmentInfo() {
  try {
    const assignmentInfo = {
      title: null,
      description: null,
      instructions: null,
      dueDate: null,
      points: null,
      attachments: [],
      questions: [],
      url: window.location.href,
      courseId: null,
      assignmentId: null,
      extracted: new Date().toISOString()
    };
    
    // Extract URL parameters
    const urlParams = extractUrlParams();
    assignmentInfo.courseId = urlParams.courseId;
    assignmentInfo.assignmentId = urlParams.assignmentId;
    
    // Extract title
    const titleElement = document.querySelector('[data-item-id] h1, .YVvGBb, .tLDEHd, h1.tLDEHd, .zyiB1c');
    if (titleElement) {
      assignmentInfo.title = titleElement.textContent.trim();
    }
    
    // Extract description/instructions - try multiple approaches
    const descriptionSelectors = [
      '.aVnDHd', // Main content area
      '.ULPnae', // Instructions
      '.IqJTee', // Question content
      '.yJb0De', // Assignment body
      '[data-description]',
      '.description',
      '.assignment-description',
      'div[role="article"]',
      '.Qwp0Ld' // Material content
    ];
    
    let fullDescription = '';
    
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const text = element.textContent.trim();
        if (text.length > fullDescription.length) {
          fullDescription = text;
        }
      }
    }
    
    // Also try to get all text content from the main assignment area
    const mainContent = document.querySelector('.VBEdtc, .JYIJMc, .NHBuMc');
    if (mainContent) {
      const allText = mainContent.textContent.trim();
      if (allText.length > fullDescription.length) {
        fullDescription = allText;
      }
    }
    
    if (fullDescription) {
      assignmentInfo.description = fullDescription;
      assignmentInfo.instructions = fullDescription;
    }
    
    // Extract due date
    const dueDateSelectors = [
      '.cmADL', // Due date
      '.asQXV', // Date info
      '[data-due-date]',
      '.due-date'
    ];
    
    for (const selector of dueDateSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        assignmentInfo.dueDate = element.textContent.trim();
        break;
      }
    }
    
    // Extract points
    const pointsElement = document.querySelector('.QdXhfe, [data-points], .points');
    if (pointsElement) {
      const pointsText = pointsElement.textContent;
      const pointsMatch = pointsText.match(/(\d+)\s*points?/i);
      if (pointsMatch) {
        assignmentInfo.points = parseInt(pointsMatch[1]);
      }
    }
    
    // Extract attachments
    const attachmentElements = document.querySelectorAll('.qjTEB, .attachment, [data-attachment]');
    attachmentElements.forEach(element => {
      const link = element.querySelector('a');
      if (link) {
        assignmentInfo.attachments.push({
          name: element.textContent.trim(),
          url: link.href
        });
      }
    });
    
    // Extract questions (for quiz-type assignments)
    const questionElements = document.querySelectorAll('.question, [data-question], .Qnxdre');
    questionElements.forEach((element, index) => {
      assignmentInfo.questions.push({
        number: index + 1,
        text: element.textContent.trim()
      });
    });
    
    // Additional metadata
    assignmentInfo.hasSubmission = !!document.querySelector('.submittedTag, [data-submitted], .turned-in');
    assignmentInfo.isGraded = !!document.querySelector('.grade, [data-grade], .graded');
    
    return assignmentInfo;
  } catch (error) {
    console.error('Error extracting assignment info:', error);
    return null;
  }
}

/**
 * Extract parameters from Google Classroom URL
 */
function extractUrlParams() {
  const url = window.location.href;
  const params = {
    courseId: null,
    assignmentId: null
  };
  
  // Extract course ID from URL pattern: /c/COURSE_ID/
  const courseMatch = url.match(/\/c\/([^\/]+)/);
  if (courseMatch) {
    params.courseId = courseMatch[1];
  }
  
  // Extract assignment ID from URL pattern: /a/ASSIGNMENT_ID/
  const assignmentMatch = url.match(/\/a\/([^\/]+)/);
  if (assignmentMatch) {
    params.assignmentId = assignmentMatch[1];
  }
  
  return params;
}

/**
 * Format assignment info for AI context
 */
function formatAssignmentForAI(assignmentInfo) {
  if (!assignmentInfo) return 'No assignment information available.';
  
  let context = '';
  
  if (assignmentInfo.title) {
    context += `Assignment: ${assignmentInfo.title}\n\n`;
  }
  
  if (assignmentInfo.description) {
    context += `Instructions:\n${assignmentInfo.description}\n\n`;
  }
  
  if (assignmentInfo.dueDate) {
    context += `Due Date: ${assignmentInfo.dueDate}\n`;
  }
  
  if (assignmentInfo.points) {
    context += `Points: ${assignmentInfo.points}\n`;
  }
  
  if (assignmentInfo.questions && assignmentInfo.questions.length > 0) {
    context += `\nQuestions:\n`;
    assignmentInfo.questions.forEach(q => {
      context += `${q.number}. ${q.text}\n`;
    });
  }
  
  if (assignmentInfo.attachments && assignmentInfo.attachments.length > 0) {
    context += `\nAttachments:\n`;
    assignmentInfo.attachments.forEach(a => {
      context += `- ${a.name}\n`;
    });
  }
  
  return context.trim();
}

/**
 * Monitor page changes to detect when assignment is loaded
 */
function observeAssignmentLoad(callback) {
  const observer = new MutationObserver((mutations) => {
    if (isGoogleClassroomAssignment()) {
      const assignmentInfo = extractAssignmentInfo();
      if (assignmentInfo && assignmentInfo.title) {
        callback(assignmentInfo);
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
}

/**
 * Get current assignment context for AI
 */
async function getCurrentAssignmentContext() {
  if (!isGoogleClassroomAssignment()) {
    return null;
  }
  
  const assignmentInfo = extractAssignmentInfo();
  if (!assignmentInfo) {
    return null;
  }
  
  // Store assignment info for later use
  await chrome.storage.local.set({
    currentAssignment: assignmentInfo
  });
  
  return {
    info: assignmentInfo,
    formatted: formatAssignmentForAI(assignmentInfo)
  };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isGoogleClassroomAssignment,
    extractAssignmentInfo,
    formatAssignmentForAI,
    observeAssignmentLoad,
    getCurrentAssignmentContext
  };
}

// Auto-detect and save assignment info when on Google Classroom
if (typeof chrome !== 'undefined' && chrome.storage) {
  // Run detection when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectAndSave);
  } else {
    detectAndSave();
  }
  
  // Re-detect when URL changes (SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      detectAndSave();
    }
  }).observe(document, { subtree: true, childList: true });
  
  async function detectAndSave() {
    if (isGoogleClassroomAssignment()) {
      // Wait a bit for page to fully load
      setTimeout(async () => {
        try {
          const assignmentInfo = extractAssignmentInfo();
          if (assignmentInfo && assignmentInfo.title) {
            // Debug logging
            console.log('📚 Assignment detected:', assignmentInfo.title);
            console.log('📄 Description length:', assignmentInfo.description?.length || 0);
            console.log('📝 Full assignment info:', assignmentInfo);
            
            // Check if chrome.storage is available
            if (chrome && chrome.storage && chrome.storage.local) {
              await chrome.storage.local.set({ currentAssignment: assignmentInfo });
              console.log('✅ Assignment saved to storage');
            }
          } else {
            console.log('⚠️ Assignment info extraction failed - no title found');
          }
        } catch (error) {
          // Silently ignore extension context errors (happens on reload)
          if (!error.message.includes('Extension context invalidated')) {
            console.error('Error saving assignment:', error);
          }
        }
      }, 2000); // Increased wait time to 2 seconds
    }
  }
}
