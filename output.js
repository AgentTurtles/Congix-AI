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
  
  // Format the guidance text
  const formatted = guidance
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  outputDiv.innerHTML = `<p>${formatted}</p>`;
}
