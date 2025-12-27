/**
 * Background Service Worker for AI Classroom Extension
 * Handles message passing, data persistence, and coordination between components
 */

// Backend configuration
const BACKEND_URL = 'http://localhost:3000';

/**
 * Helper function to call backend API
 */
async function callBackendAPI(endpoint, data) {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
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
    
    return await response.json();
  } catch (error) {
    console.error('Backend API Error:', error);
    throw error;
  }
}

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Classroom Extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.set({
    interactions: [],
    classroomData: {},
    settings: {
      guidanceLevel: 'adaptive',
      privacyMode: true
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'openAuthPage':
      const page = request.page || 'auth';
      chrome.tabs.create({ url: `${page}.html` });
      sendResponse({ success: true });
      return true;
    
    case 'callBackendAPI':
      // Proxy API calls to backend from extension pages
      const backendUrl = 'http://localhost:3000';
      fetch(`${backendUrl}${request.endpoint}`, {
        method: request.method || 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request.data)
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => {
              throw new Error(err.error || 'API request failed');
            });
          }
          return response.json();
        })
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'saveInteraction':
      saveInteraction(request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'getInteractions':
      getInteractions(request.assignmentId)
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'generateGuidance':
      generateGuidedPrompt(request.context, request.reasoning)
        .then(guidance => sendResponse({ success: true, guidance }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'generateSummary':
      generateTransparencySummary(request.interactions)
        .then(summary => sendResponse({ success: true, summary }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'generateTeacherInsights':
      generateTeacherInsights(request.submissionId)
        .then(insights => sendResponse({ success: true, insights }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
  }
});

/**
 * Save AI interaction with privacy preservation
 */
async function saveInteraction(interactionData) {
  const { interactions = [] } = await chrome.storage.local.get('interactions');
  
  // Privacy-preserving storage: only metadata, no full conversations
  const privacyPreservedData = {
    timestamp: Date.now(),
    assignmentId: interactionData.assignmentId,
    studentId: hashIdentifier(interactionData.studentId), // Hashed for privacy
    interactionType: interactionData.type, // 'hint', 'clarification', 'scaffold'
    guidanceLevel: interactionData.level, // 'low', 'medium', 'high'
    stage: interactionData.stage, // 'beginning', 'middle', 'completion'
    reasoningPresent: interactionData.hasReasoning,
    sessionId: interactionData.sessionId
  };
  
  interactions.push(privacyPreservedData);
  
  // Keep only last 1000 interactions to prevent excessive storage
  if (interactions.length > 1000) {
    interactions.shift();
  }
  
  await chrome.storage.local.set({ interactions });
}

/**
 * Retrieve interactions for a specific assignment
 */
async function getInteractions(assignmentId) {
  const { interactions = [] } = await chrome.storage.local.get('interactions');
  return interactions.filter(i => i.assignmentId === assignmentId);
}

/**
 * Generate guided prompts based on student reasoning
 * This is a local implementation - in production, this would call an API
 */
async function generateGuidedPrompt(context, reasoning) {
  const { assignmentType, subject, studentInput, currentStage } = context;
  
  // Get the actual assignment context from storage
  const { currentAssignment } = await chrome.storage.local.get('currentAssignment');
  
  let assignmentContext = '';
  if (currentAssignment) {
    assignmentContext = `
ASSIGNMENT: ${currentAssignment.title || 'Untitled'}

INSTRUCTIONS:
${currentAssignment.description || currentAssignment.instructions || 'No specific instructions available'}

${currentAssignment.dueDate ? `DUE DATE: ${currentAssignment.dueDate}` : ''}
${currentAssignment.points ? `POINTS: ${currentAssignment.points}` : ''}
`;
    console.log('📚 Using assignment context:', currentAssignment.title);
    console.log('📄 Description length:', currentAssignment.description?.length || 0);
  } else {
    console.warn('⚠️ No assignment context found in storage');
    assignmentContext = 'ASSIGNMENT: Unable to detect assignment details. Provide general guidance.';
  }
  
  // Analyze the reasoning provided
  const reasoningQuality = analyzeReasoning(studentInput);
  
  // Call Gemini API with the actual assignment context
  try {
    console.log('🤖 Calling AI with assignment context...');
    console.log('📚 Assignment title:', currentAssignment?.title || 'None');
    console.log('📝 Description length:', currentAssignment?.description?.length || 0);
    
    const prompt = `You are COGNIX AI, an ethical educational assistant. A student is working on an assignment and needs guidance.

${assignmentContext}

STUDENT'S THINKING SO FAR:
${studentInput || reasoning}

ETHICAL GUIDANCE PRINCIPLES:
1. Guide, don't solve - provide hints and questions, not direct answers
2. Build on student's existing reasoning
3. Encourage critical thinking and problem-solving
4. Point out gaps in understanding without filling them directly
5. Suggest resources or approaches, not solutions
6. Reference the actual assignment content when giving guidance

Provide detailed, ethical Socratic guidance that helps the student learn and think deeper about THIS SPECIFIC ASSIGNMENT.

Structure your response as follows:

OBSERVATIONS:
[What the student understood well and what they're working towards]

QUESTIONS TO CONSIDER:
[3-4 probing questions that guide their thinking about the specific assignment]

SUGGESTIONS:
[Specific approaches or concepts they should explore related to the assignment]

NEXT STEPS:
[What they should try thinking about or researching next]

Be specific to the assignment content. Help them think deeper without giving away answers.`;

    // Use the backend API to call Gemini
    console.log('📡 Sending request to backend...');
    const result = await callBackendAPI('/api/guidance', { 
      assignmentContext: assignmentContext,
      studentThinking: studentInput || reasoning,
      prompt: prompt 
    });
    console.log('✅ Received response from backend:', result);
    
    if (result && (result.guidance || result.response)) {
      const responseText = result.guidance || result.response;
      console.log('📝 Full AI response:', responseText);
      console.log('📏 Response length:', responseText.length);
      
      // Return the FULL response as a single prompt for typewriter effect
      return {
        type: reasoningQuality === 'strong' ? 'scaffold' : 'hint',
        level: reasoningQuality === 'insufficient' ? 'low' : 'medium',
        prompts: [responseText] // Single item with full text
      };
    } else {
      console.error('❌ No response from backend');
    }
  } catch (error) {
    console.error('❌ Error calling Gemini API:', error);
    console.error('Error details:', error.message);
  }
  
  // Fallback to generic prompts if API fails
  if (reasoningQuality === 'insufficient') {
    return {
      type: 'clarification',
      level: 'low',
      prompts: [
        "Can you explain your thinking process a bit more?",
        "What approach did you consider first?",
        "What makes this problem challenging for you?"
      ]
    };
  } else if (reasoningQuality === 'partial') {
    return {
      type: 'hint',
      level: 'medium',
      prompts: [
        "You're on the right track. What might happen if you tried...?",
        "Consider breaking this down into smaller steps. What would step 1 be?",
        "What connection can you make between this and what you already know?"
      ]
    };
  } else {
    return {
      type: 'scaffold',
      level: 'low',
      prompts: [
        "Excellent reasoning! How could you verify this approach?",
        "What would be a good next step to build on this?",
        "Can you think of a way to check if your answer makes sense?"
      ]
    };
  }
}

/**
 * Analyze the quality of student reasoning
 */
function analyzeReasoning(text) {
  if (!text || text.length < 20) return 'insufficient';
  if (text.length < 100) return 'partial';
  
  // Simple heuristics - in production, this would use NLP
  const thoughtMarkers = ['because', 'therefore', 'if', 'then', 'considering', 'since'];
  const markerCount = thoughtMarkers.filter(marker => 
    text.toLowerCase().includes(marker)
  ).length;
  
  return markerCount >= 2 ? 'strong' : 'partial';
}

/**
 * Generate transparency summary for submission
 */
async function generateTransparencySummary(interactions) {
  if (!interactions || interactions.length === 0) {
    return {
      aiUsage: 'none',
      level: 'No AI assistance used',
      details: 'This work was completed independently without AI guidance.'
    };
  }
  
  const totalInteractions = interactions.length;
  const highGuidance = interactions.filter(i => i.guidanceLevel === 'high').length;
  const mediumGuidance = interactions.filter(i => i.guidanceLevel === 'medium').length;
  
  let level, details;
  
  if (highGuidance > totalInteractions * 0.5) {
    level = 'High';
    details = `Received ${totalInteractions} guidance prompts, primarily scaffolded support. AI helped structure thinking throughout the assignment.`;
  } else if (mediumGuidance > totalInteractions * 0.4) {
    level = 'Medium';
    details = `Received ${totalInteractions} guidance prompts, mostly hints and clarifications. AI provided targeted assistance at key points.`;
  } else {
    level = 'Low';
    details = `Received ${totalInteractions} guidance prompts, primarily verification and light hints. Work is predominantly independent.`;
  }
  
  return {
    aiUsage: level.toLowerCase(),
    level: `${level} AI Assistance`,
    details,
    interactionCount: totalInteractions,
    timestamp: Date.now()
  };
}

/**
 * Generate insights for teachers
 */
async function generateTeacherInsights(submissionId) {
  const { interactions = [] } = await chrome.storage.local.get('interactions');
  const submissionInteractions = interactions.filter(i => i.sessionId === submissionId);
  
  return {
    aiUsageLevel: calculateUsageLevel(submissionInteractions),
    reasoningQuality: calculateReasoningQuality(submissionInteractions),
    independenceIndicator: calculateIndependence(submissionInteractions),
    flaggedAreas: identifyFlaggedAreas(submissionInteractions),
    suggestedFeedback: generateFeedbackSuggestions(submissionInteractions)
  };
}

/**
 * Calculate AI usage level with color indicator
 */
function calculateUsageLevel(interactions) {
  if (!interactions || interactions.length === 0) {
    return { level: 'none', color: 'gray', indicator: '○' };
  }
  
  const avgGuidanceLevel = interactions.reduce((sum, i) => {
    return sum + (i.guidanceLevel === 'high' ? 3 : i.guidanceLevel === 'medium' ? 2 : 1);
  }, 0) / interactions.length;
  
  if (avgGuidanceLevel > 2.5) {
    return { level: 'high', color: 'red', indicator: '●' };
  } else if (avgGuidanceLevel > 1.5) {
    return { level: 'medium', color: 'yellow', indicator: '●' };
  } else {
    return { level: 'low', color: 'green', indicator: '●' };
  }
}

/**
 * Calculate reasoning quality
 */
function calculateReasoningQuality(interactions) {
  const reasoningPresent = interactions.filter(i => i.reasoningPresent).length;
  const total = interactions.length;
  
  if (total === 0) return 'unknown';
  
  const ratio = reasoningPresent / total;
  if (ratio > 0.8) return 'strong';
  if (ratio > 0.5) return 'moderate';
  return 'weak';
}

/**
 * Calculate independence indicator
 */
function calculateIndependence(interactions) {
  if (interactions.length === 0) return 1.0;
  
  const earlyStage = interactions.filter(i => i.stage === 'beginning').length;
  const total = interactions.length;
  
  // More interactions at beginning suggest good independent work
  return earlyStage / total;
}

/**
 * Identify areas that might need attention
 */
function identifyFlaggedAreas(interactions) {
  const flags = [];
  
  const highGuidanceCount = interactions.filter(i => i.guidanceLevel === 'high').length;
  if (highGuidanceCount > 5) {
    flags.push('High dependency on AI guidance');
  }
  
  const reasoningGaps = interactions.filter(i => !i.reasoningPresent).length;
  if (reasoningGaps > 3) {
    flags.push('Multiple instances of insufficient reasoning before AI request');
  }
  
  return flags;
}

/**
 * Generate feedback suggestions for teachers
 */
function generateFeedbackSuggestions(interactions) {
  if (interactions.length === 0) {
    return ['Great independent work! Consider sharing your problem-solving approach with the class.'];
  }
  
  const suggestions = [];
  const reasoningQuality = calculateReasoningQuality(interactions);
  
  if (reasoningQuality === 'weak') {
    suggestions.push('Encourage deeper initial reasoning before seeking AI guidance');
  } else if (reasoningQuality === 'strong') {
    suggestions.push('Excellent critical thinking demonstrated throughout');
  }
  
  if (interactions.length > 8) {
    suggestions.push('Consider breaking down complex problems into smaller, manageable parts');
  }
  
  return suggestions;
}

/**
 * Simple hash function for privacy
 */
function hashIdentifier(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
