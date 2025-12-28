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
    
    // Extract title - SMART approach (avoid navigation text)
    let foundTitle = null;
    const excludeWords = ['home', 'stream', 'classwork', 'people', 'grades', 'calendar'];
    
    // Method 1: Get ALL h1 elements and filter out navigation
    const allH1s = document.querySelectorAll('h1');
    console.log('🔍 Found h1 elements:', allH1s.length);
    
    for (const h1 of allH1s) {
      const text = h1.textContent.trim();
      console.log('  → h1 text:', text);
      
      // Skip if it's a navigation word or too short
      if (text && text.length > 3 && text.length < 200) {
        const lowerText = text.toLowerCase();
        const isNavigation = excludeWords.some(word => lowerText === word || lowerText.includes(word));
        
        if (!isNavigation) {
          foundTitle = text;
          console.log(`✅ Title found (filtered):`, foundTitle);
          break;
        } else {
          console.log(`  ❌ Skipped navigation text:`, text);
        }
      }
    }
    
    // Method 2: Try specific assignment title selectors
    if (!foundTitle) {
      const titleSelectors = [
        'div[role="main"] h1:not(:first-child)', // Not the first h1 (likely navigation)
        '[data-item-id] h1',
        '.YVvGBb',
        '.tLDEHd'
      ];
      
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          foundTitle = element.textContent.trim();
          console.log(`✅ Title found via ${selector}:`, foundTitle);
          break;
        }
      }
    }
    
    // Method 3: Use page title as last resort
    if (!foundTitle && document.title && !document.title.includes('Google Classroom')) {
      foundTitle = document.title.split(' - ')[0].trim();
      console.log('✅ Title found from page title:', foundTitle);
    }
    
    assignmentInfo.title = foundTitle || 'Untitled Assignment';
    
    // Extract description/instructions - NUCLEAR approach
    let fullDescription = '';
    let foundMethod = 'none';
    
    // Method 1: Try guidedHelpId attribute
    const instructionsElement = document.querySelector('[guidedHelpId="assignmentInstructionsGH"]');
    if (instructionsElement) {
      const text = instructionsElement.textContent.trim();
      if (text.length > 100) {
        fullDescription = text;
        foundMethod = 'guidedHelpId';
        console.log(`✅ Description found via guidedHelpId: ${text.length} chars`);
      }
    }
    
    // Method 2: Try role="main" for main content
    if (!fullDescription) {
      const mainElement = document.querySelector('div[role="main"]');
      if (mainElement) {
        const clonedMain = mainElement.cloneNode(true);
        // Remove navigation, headers, and sidebars
        const removeSelectors = 'nav, header, aside, [role="navigation"], [role="banner"], [role="complementary"]';
        const elementsToRemove = clonedMain.querySelectorAll(removeSelectors);
        elementsToRemove.forEach(el => el.remove());
        
        const text = clonedMain.textContent.trim();
        if (text.length > 100) {
          fullDescription = text;
          foundMethod = 'role=main';
          console.log(`✅ Description found via role="main": ${text.length} chars`);
        }
      }
    }
    
    // Method 3: Try all possible class selectors
    const descriptionSelectors = [
      '[guidedHelpId*="instruction"]',
      '[data-description]',
      'div[role="article"]',
      '.aVnDHd', '.ULPnae', '.IqJTee', '.yJb0De',
      '.Qwp0Ld', '.VBEdtc', '.JYIJMc', '.NHBuMc',
      '.description', '.assignment-description', '.instructions'
    ];
    
    if (!fullDescription) {
      for (const selector of descriptionSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          if (text.length > fullDescription.length && text.length > 100) {
            fullDescription = text;
            foundMethod = selector;
            console.log(`✅ Description found via ${selector}: ${text.length} chars`);
          }
        }
      }
    }
    
    // Method 4: NUCLEAR - Get ALL text from body, then clean it
    if (!fullDescription || fullDescription.length < 200) {
      console.log('🚨 Using NUCLEAR option - extracting all body text');
      const bodyClone = document.body.cloneNode(true);
      
      // Remove scripts, styles, and navigation
      const removeSelectors = 'script, style, nav, header[role="banner"], aside, [role="navigation"], .sidebar, [class*="nav"], [class*="menu"], [class*="header"]';
      const elementsToRemove = bodyClone.querySelectorAll(removeSelectors);
      elementsToRemove.forEach(el => el.remove());
      
      const allText = bodyClone.textContent.trim();
      // Clean up extra whitespace
      const cleanedText = allText.replace(/\s+/g, ' ').trim();
      
      if (cleanedText.length > fullDescription.length) {
        fullDescription = cleanedText;
        foundMethod = 'NUCLEAR';
        console.log(`✅ Description found via NUCLEAR option: ${cleanedText.length} chars`);
      }
    }
    
    if (fullDescription) {
      assignmentInfo.description = fullDescription;
      assignmentInfo.instructions = fullDescription;
      console.log(`📝 Final description method: ${foundMethod}, length: ${fullDescription.length}`);
    } else {
      console.log('❌ NO DESCRIPTION FOUND AT ALL');
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
    
    // Extract attachments - IMPROVED to find more attachment types
    const attachmentSelectors = [
      'a[href*="drive.google.com"]',
      'a[href*="docs.google.com"]',
      'a[href*=".pdf"]',
      '.qjTEB a',
      '.attachment a',
      '[data-attachment] a',
      '[role="link"][href*="drive"]',
      '[role="link"][href*="docs"]'
    ];
    
    const attachmentLinks = new Set();
    
    attachmentSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const href = element.href;
        const text = element.textContent.trim();
        
        // Only add if it looks like a document/file
        if (href && text && (
          href.includes('drive.google.com') ||
          href.includes('docs.google.com') ||
          href.includes('.pdf') ||
          text.toLowerCase().includes('pdf') ||
          text.toLowerCase().includes('doc')
        )) {
          attachmentLinks.add(JSON.stringify({
            name: text || 'Attachment',
            url: href
          }));
        }
      });
    });
    
    assignmentInfo.attachments = Array.from(attachmentLinks).map(str => JSON.parse(str));
    
    console.log(`📎 Found ${assignmentInfo.attachments.length} attachment(s)`);
    assignmentInfo.attachments.forEach(att => {
      console.log(`  → ${att.name}: ${att.url}`);
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
      // Wait for page to fully load, then try multiple times
      const maxAttempts = 3;
      let attempt = 0;
      
      const tryExtract = async () => {
        attempt++;
        console.log(`🔍 Detection attempt ${attempt}/${maxAttempts}...`);
        
        try {
          const assignmentInfo = extractAssignmentInfo();
          console.log('📍 URL:', window.location.href);
          console.log('📚 Title found:', assignmentInfo?.title || 'NO TITLE');
          console.log('📄 Description length:', assignmentInfo?.description?.length || 0);
          console.log('📝 Description preview:', assignmentInfo?.description?.substring(0, 200) || 'NO DESCRIPTION');
          
          // Check if we got good data (not just "Home" and empty description)
          const hasValidTitle = assignmentInfo?.title && 
                                assignmentInfo.title !== 'Untitled Assignment' &&
                                !['home', 'stream', 'classwork'].includes(assignmentInfo.title.toLowerCase());
          const hasValidDescription = assignmentInfo?.description && assignmentInfo.description.length > 50;
          
          if (assignmentInfo && hasValidTitle && hasValidDescription) {
            console.log('✅ Assignment detected:', assignmentInfo.title);
            console.log('📝 Full assignment info:', assignmentInfo);
            
            if (chrome && chrome.storage && chrome.storage.local) {
              await chrome.storage.local.set({ currentAssignment: assignmentInfo });
              console.log('💾 Assignment saved to storage');
            }
          } else if (attempt < maxAttempts) {
            console.log(`⏳ Incomplete data, retrying in 2 seconds... (attempt ${attempt}/${maxAttempts})`);
            setTimeout(tryExtract, 2000);
          } else {
            console.log('⚠️ Max attempts reached. Data might be incomplete.');
            console.log('🔍 Available h1 elements:', Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()));
            
            // Save even if incomplete (better than nothing)
            if (assignmentInfo && chrome && chrome.storage && chrome.storage.local) {
              await chrome.storage.local.set({ currentAssignment: assignmentInfo });
              console.log('💾 Partial data saved to storage');
            }
          }
        } catch (error) {
          if (!error.message.includes('Extension context invalidated')) {
            console.error('❌ Error saving assignment:', error);
          }
        }
      };
      
      // Start first attempt after initial delay
      setTimeout(tryExtract, 2000);
    }
  }
}