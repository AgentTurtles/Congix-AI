/**
 * Google Gemini API Integration for COGNIX AI
 * Calls backend server which securely handles the Gemini API
 */

// Backend server URL - update this with your deployed server URL
const BACKEND_URL = 'http://localhost:3000';

/**
 * Storage helper for backend URL configuration
 */
const backendConfig = {
  async get() {
    try {
      const result = await chrome.storage.local.get('backendUrl');
      return result.backendUrl || BACKEND_URL;
    } catch (error) {
      console.error('Error getting backend URL:', error);
      return BACKEND_URL;
    }
  },
  
  async set(url) {
    try {
      await chrome.storage.local.set({ backendUrl: url });
      return true;
    } catch (error) {
      console.error('Error setting backend URL:', error);
      return false;
    }
  }
};

/**
 * Call backend API endpoint
 */
async function callBackendAPI(endpoint, data) {
  const backendUrl = await backendConfig.get();
  
  try {
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Backend request failed');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Backend API Error:', error);
    
    // Provide helpful error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend server. Make sure the server is running at ' + backendUrl);
    }
    
    throw error;
  }
}

/**
 * Generate ethical AI guidance based on student's thinking and assignment context
 */
async function generateEthicalGuidance(assignmentContext, studentThinking) {
  const prompt = `You are COGNIX AI, an ethical educational assistant. A student is working on an assignment and needs guidance.

ASSIGNMENT CONTEXT:
${assignmentContext}

STUDENT'S THINKING SO FAR:
${studentThinking}

ETHICAL GUIDANCE PRINCIPLES:
1. Guide, don't solve - provide hints and questions, not direct answers
2. Build on student's existing reasoning
3. Encourage critical thinking and problem-solving
4. Point out gaps in understanding without filling them directly
5. Suggest resources or approaches, not solutions

Provide ethical, Socratic guidance that helps the student learn and think deeper. Format your response as:

OBSERVATIONS: [What the student understood well]
QUESTIONS TO CONSIDER: [2-3 probing questions to guide their thinking]
SUGGESTIONS: [Approaches or resources to explore]
NEXT STEPS: [What they should try thinking about next]`;

  return await callGeminiAPI(prompt);
}

/**
 * Generate transparency summary for teachers
 */
async function generateTransparencySummary(studentThinking, aiGuidance, finalWork) {
  const result = await callBackendAPI('/api/transparency-summary', {
    studentThinking: studentThinking,
    aiGuidance: aiGuidance,
    finalWork: finalWork || ''
  });
  
  return result.summary;
}

/**
 * Check if backend server is available
 */
async function checkBackendHealth() {
  try {
    const backendUrl = await backendConfig.get();
    const response = await fetch(`${backendUrl}/health`);
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}