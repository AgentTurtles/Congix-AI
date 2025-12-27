/**
 * Student Dashboard Script
 */

let currentAssignment = null;

// Load student information and assignment context
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await chrome.storage.local.get(['cognixUser', 'cognixStatus', 'currentAssignment']);
    
    if (!result.cognixUser || result.cognixStatus !== 'student') {
      window.location.href = 'auth.html';
      return;
    }
    
    // Load current assignment if available
    if (result.currentAssignment) {
      currentAssignment = result.currentAssignment;
      console.log('✅ Loaded assignment:', currentAssignment.title);
      console.log('Assignment details:', currentAssignment);
    } else {
      console.log('⚠️ No assignment detected. Make sure you opened this from a Google Classroom assignment page.');
    }
    
    // Update status UI
    updateAssignmentStatus();
    
  } catch (error) {
    console.error('Error loading student screen:', error);
  }
  
  const textarea = document.getElementById('studentThinking');
  const thinkBtn = document.getElementById('thinkWithAiBtn');
  
  // Refresh assignment function
  window.refreshAssignment = async function() {
    console.log('🔄 Manually refreshing assignment...');
    
    // Ask the active tab to re-extract assignment
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url && tab.url.includes('classroom.google.com')) {
        // Inject and execute extraction
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (typeof extractAssignmentInfo === 'function') {
              const info = extractAssignmentInfo();
              chrome.storage.local.set({ currentAssignment: info });
              console.log('🔄 Re-extracted assignment:', info);
            }
          }
        });
        
        // Wait a bit then reload
        setTimeout(async () => {
          const result = await chrome.storage.local.get('currentAssignment');
          if (result.currentAssignment) {
            currentAssignment = result.currentAssignment;
            updateAssignmentStatus();
          }
        }, 500);
      } else {
        alert('Please open this from a Google Classroom assignment page');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      
      // Fallback: just reload from storage
      const result = await chrome.storage.local.get('currentAssignment');
      if (result.currentAssignment) {
        currentAssignment = result.currentAssignment;
        updateAssignmentStatus();
      }
    }
  };
  
  // Update assignment status UI
  function updateAssignmentStatus() {
    const statusDiv = document.getElementById('assignmentStatus');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    
    if (!statusDiv) return;
    
    statusDiv.style.display = 'block';
    
    if (currentAssignment && currentAssignment.title) {
      console.log('✅ Showing assignment:', currentAssignment.title);
      statusIcon.textContent = '✅';
      statusText.textContent = `${currentAssignment.title}`;
      statusDiv.style.background = 'rgba(34, 197, 94, 0.1)';
      statusDiv.style.borderColor = 'rgba(34, 197, 94, 0.3)';
      statusDiv.style.color = '#22c55e';
    } else {
      console.log('⚠️ No assignment');
      statusIcon.textContent = '⚠️';
      statusText.textContent = 'No assignment detected';
      statusDiv.style.background = 'rgba(234, 179, 8, 0.1)';
      statusDiv.style.borderColor = 'rgba(234, 179, 8, 0.3)';
      statusDiv.style.color = '#eab308';
    }
  }
  
  // Think With AI functionality
  thinkBtn.addEventListener('click', async () => {
    console.log('Think With AI button clicked');
    
    const thinking = textarea.value.trim();
    
    if (!thinking) {
      alert('Please enter your thinking first!');
      return;
    }
    
    if (thinking.length < 20) {
      alert('Please provide more detail about your thinking (at least 20 characters).');
      return;
    }
    
    // Disable button during processing
    thinkBtn.disabled = true;
    thinkBtn.innerHTML = '<span>Thinking...</span>';
    
    try {
      console.log('Calling backend API via background script...');
      
      // Prepare assignment context
      let assignmentContext = 'General assignment';
      
      if (currentAssignment) {
        console.log('📋 Using assignment from storage:', currentAssignment);
        
        // Build context manually to ensure it's passed
        assignmentContext = `Assignment: ${currentAssignment.title || 'Untitled'}`;
        
        if (currentAssignment.description) {
          assignmentContext += `\n\nDescription:\n${currentAssignment.description}`;
        }
        
        if (currentAssignment.instructions) {
          assignmentContext += `\n\nInstructions:\n${currentAssignment.instructions}`;
        }
        
        if (currentAssignment.questions && currentAssignment.questions.length > 0) {
          assignmentContext += `\n\nQuestions:`;
          currentAssignment.questions.forEach((q, i) => {
            assignmentContext += `\n${i + 1}. ${q.text || q}`;
          });
        }
        
        if (currentAssignment.dueDate) {
          assignmentContext += `\n\nDue: ${currentAssignment.dueDate}`;
        }
      } else {
        console.log('⚠️ No assignment context available - using general context');
      }
      
      console.log('📤 Sending assignment context:', assignmentContext);
      console.log('💭 Student thinking:', thinking);
      
      // Call backend API via background script
      const response = await chrome.runtime.sendMessage({
        action: 'callBackendAPI',
        endpoint: '/api/guidance',
        method: 'POST',
        data: {
          assignmentContext: assignmentContext,
          studentThinking: thinking
        }
      });
      
      if (!response) {
        throw new Error('Backend server is not responding. Make sure the backend is running:\n1. cd backend\n2. npm start');
      }
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get guidance');
      }
      
      const guidance = response.data.guidance;
      
      console.log('Received guidance:', guidance);
      
      // Store interaction
      await chrome.storage.local.set({
        lastInteraction: {
          thinking: thinking,
          guidance: guidance,
          timestamp: new Date().toISOString(),
          assignment: currentAssignment
        }
      });
      
      console.log('Navigating to output page...');
      
      // Navigate to output page
      window.location.href = 'output.html';
      
    } catch (error) {
      console.error('Error getting AI guidance:', error);
      alert('Error: ' + error.message);
    } finally {
      thinkBtn.disabled = false;
      thinkBtn.innerHTML = '<span>Think With AI</span>';
    }
  });
});
