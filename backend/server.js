/**
 * COGNIX AI Backend Server
 * Securely handles Gemini API calls for the Chrome extension
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Gemini API endpoint - using gemini-2.5-flash (free tier)
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'COGNIX AI Backend'
  });
});

/**
 * POST /api/guidance
 * Generate ethical AI guidance for student
 */
app.post('/api/guidance', async (req, res) => {
  try {
    const { assignmentContext, studentThinking } = req.body;

    // Validation
    if (!studentThinking || studentThinking.trim().length < 20) {
      return res.status(400).json({ 
        error: 'Student thinking must be at least 20 characters' 
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured on server' 
      });
    }

    // Build prompt
    const prompt = buildGuidancePrompt(assignmentContext, studentThinking);

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();

    // Extract text from response
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const guidance = candidate.content.parts[0].text;
        
        return res.json({ 
          success: true,
          guidance: guidance,
          timestamp: new Date().toISOString()
        });
      }
    }

    throw new Error('No response generated');

  } catch (error) {
    console.error('Error generating guidance:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate guidance' 
    });
  }
});

/**
 * POST /api/transparency-summary
 * Generate transparency summary for teachers
 */
app.post('/api/transparency-summary', async (req, res) => {
  try {
    const { studentThinking, aiGuidance, finalWork } = req.body;

    if (!studentThinking || !aiGuidance) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured on server' 
      });
    }

    const prompt = buildTransparencySummaryPrompt(studentThinking, aiGuidance, finalWork);

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const summary = candidate.content.parts[0].text;
        
        return res.json({ 
          success: true,
          summary: summary,
          timestamp: new Date().toISOString()
        });
      }
    }

    throw new Error('No response generated');

  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate summary' 
    });
  }
});

/**
 * Build guidance prompt
 */
function buildGuidancePrompt(assignmentContext, studentThinking) {
  return `You are COGNIX AI, an ethical educational assistant. A student is working on an assignment and needs guidance.

ASSIGNMENT CONTEXT:
${assignmentContext || 'General assignment'}

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
}

/**
 * Build transparency summary prompt
 */
function buildTransparencySummaryPrompt(studentThinking, aiGuidance, finalWork) {
  return `Generate a transparency summary showing how AI was used in this assignment.

STUDENT'S INITIAL THINKING:
${studentThinking}

AI GUIDANCE PROVIDED:
${aiGuidance}

FINAL WORK SUBMITTED:
${finalWork || 'Not yet submitted'}

Create a brief summary for the teacher that shows:
1. What the student thought through independently
2. What guidance AI provided (without giving direct answers)
3. How the student applied the guidance
4. Overall assessment of independent learning vs. AI assistance

Keep it concise (3-4 sentences).`;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found' 
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  console.log(`🚀 COGNIX AI Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 API Key configured: ${GEMINI_API_KEY ? '✓ Yes' : '✗ No'}`);
  console.log('Server is listening and ready to accept connections');
}).on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please close other applications using this port.`);
  }
  process.exit(1);
});

// Keep alive - prevent process from exiting
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Log unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
