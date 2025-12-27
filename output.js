/**
 * Output Page Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await chrome.storage.local.get(['cognixUser', 'cognixStatus', 'lastInteraction']);
    
    if (!result.cognixUser || result.cognixStatus !== 'student') {
      window.location.href = 'auth.html';
      return;
    }
    
    // Load and display guidance
    if (result.lastInteraction && result.lastInteraction.guidance) {
      displayGuidance(result.lastInteraction.guidance);
    } else {
      document.getElementById('guidanceOutput').innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No guidance available.</p>';
    }
    
  } catch (error) {
    console.error('Error loading output:', error);
  }
  
  // Back button
  document.getElementById('backToDashboard').addEventListener('click', () => {
    window.location.href = 'student-dashboard.html';
  });
});

function displayGuidance(guidance) {
  const outputDiv = document.getElementById('guidanceOutput');
  
  // Clear previous content
  outputDiv.innerHTML = '';
  
  // Create container for typewriter effect
  const textContainer = document.createElement('div');
  textContainer.style.cssText = 'line-height: 1.8; font-size: 16px; color: #333; white-space: pre-wrap;';
  outputDiv.appendChild(textContainer);
  
  // The guidance text
  const fullText = guidance || '';
  
  // Typewriter effect
  let charIndex = 0;
  const typingSpeed = 15; // milliseconds per character
  
  function typeNextChar() {
    if (charIndex < fullText.length) {
      textContainer.textContent += fullText.charAt(charIndex);
      charIndex++;
      
      // Auto-scroll to show new content
      textContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      
      setTimeout(typeNextChar, typingSpeed);
    }
  }
  
  // Start typing animation
  typeNextChar();
}
