# AI Classroom - Ethical AI Guidance Extension

![AI Classroom Logo](images/icon128.png)

## 🎓 Overview

**AI Classroom** is a Chrome extension that integrates seamlessly into Google Classroom to promote ethical AI use in education. It's a **guidance platform, not a generative tool** — designed to help students think critically while receiving scaffolded support, and to give teachers complete transparency into AI-assisted learning.

### Core Philosophy

- **Think First, Then Ask** - Students must provide reasoning before receiving AI guidance
- **Guidance, Not Answers** - AI provides hints, questions, and scaffolding, never complete solutions
- **Transparency Above All** - Full visibility into AI interactions for both students and teachers
- **Privacy by Design** - Minimal data collection, no surveillance, student autonomy preserved

## ✨ Features

### For Students

#### 🤖 Guided AI Panel
- **Context-Aware Activation** - Appears only when viewing assignments in Google Classroom
- **Collapsible Interface** - Slides in from the side without obstructing original content
- **Reasoning-First Approach** - Requires 50+ character explanation before AI assistance
- **Adaptive Support Levels**:
  - **Low** - Verification and encouragement
  - **Medium** - Hints and clarifying questions
  - **High** - Scaffolded step-by-step guidance

#### 📊 Visual Usage Tracking
- Real-time dots showing interaction history
- Color-coded by guidance level (green/yellow/red)
- Helps students self-monitor AI dependency

#### 🔍 Transparency Summary
- Automatic generation upon submission
- Detailed breakdown of AI assistance level
- Required student reflection on learning impact
- Embedded with submission for teacher review

### For Teachers

#### 📈 Teacher Dashboard
Based on the Figma design with **COGNIX** branding, featuring:

- **Grade With AI** section showing:
  - Student names with AI usage indicators (colored dots)
  - Quick visual assessment of assistance levels
  - Click-through to detailed insights

- **Student Insight View**:
  - AI Assistance Level (None/Low/Medium/High)
  - Reasoning Quality Assessment
  - Independence Indicator (percentage-based)
  - Flagged Areas requiring attention
  - Student reflection quotes
  - AI-drafted feedback suggestions

#### 🎯 Assignment Feedback
- Aggregated classroom insights
- Common misconceptions identification
- AI usage trends across students
- Suggested instructional adjustments

#### ⚙️ Teacher Control
- Full ability to edit/approve/discard AI suggestions
- No punitive detection algorithms
- Human judgment remains central to assessment

## 🏗️ Technical Architecture

### File Structure

```
ai-classroom-extension/
├── manifest.json           # Extension configuration
├── background.js          # Service worker for data handling
├── content.js            # Main content script for Google Classroom
├── styles.css            # All extension styling
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── images/               # Extension icons and assets
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Key Components

#### Background Service Worker (`background.js`)
- Message passing coordinator
- Privacy-preserving interaction storage
- AI guidance generation logic
- Transparency summary generation
- Teacher insights calculation

#### Content Script (`content.js`)
- Context detection (student vs teacher view)
- Dynamic UI injection
- Session management
- Submission interception
- Real-time interaction tracking

#### Styles (`styles.css`)
- Figma design implementation
- Responsive layout
- Smooth animations
- Accessibility considerations

## 🚀 Installation

### For Development

1. **Clone or download this repository**

2. **Open Chrome and navigate to:**
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode** (toggle in top right)

4. **Click "Load unpacked"**

5. **Select the extension directory**

6. **Navigate to Google Classroom** to see it in action!

### For Production

1. Package the extension:
   ```bash
   zip -r ai-classroom-extension.zip * -x "*.git*" "README.md"
   ```

2. Upload to Chrome Web Store Developer Dashboard

3. Follow Chrome Web Store publishing guidelines

## 🎨 Design Implementation

The extension implements the Figma design specifications:

- **COGNIX branding** with custom typography
- **Teacher Dashboard** with student AI usage table
- **Color-coded indicators**:
  - 🟢 Green - Low AI usage (independent work)
  - 🟡 Yellow - Medium AI usage (balanced support)
  - 🔴 Red - High AI usage (significant guidance)
- **Clean, professional interface** matching Google Classroom aesthetics
- **Smooth animations** for panel transitions

## 🔒 Privacy & Ethics

### Data Collection
- **Minimal**: Only interaction metadata (type, level, stage, timestamp)
- **No Full Conversations**: Student inputs and AI responses not stored long-term
- **Hashed Identifiers**: Student IDs anonymized for storage
- **Local First**: Data stored locally in browser, not transmitted to external servers

### Ethical Principles
1. **Student Autonomy** - Students choose when to engage
2. **No Surveillance** - Extension only active in assignment contexts
3. **Transparency** - Clear communication about what data is tracked
4. **Non-Punitive** - Designed to support learning, not catch cheating
5. **Human-Centered** - Teachers maintain final decision-making authority

## 🛠️ Customization

### Adjusting Guidance Levels

Edit the `generateGuidedPrompt()` function in `background.js`:

```javascript
async function generateGuidedPrompt(context, reasoning) {
  // Customize prompts based on your educational context
  // Adjust thresholds for reasoning quality
  // Add subject-specific guidance
}
```

### Styling Modifications

Edit `styles.css` to match your institution's branding:

```css
:root {
  --primary-color: #141313;
  --secondary-color: #f5f2f2;
  /* Customize colors here */
}
```

### Integration with AI Services

For production deployment, replace the local guidance generation with API calls:

```javascript
async function generateGuidedPrompt(context, reasoning) {
  const response = await fetch('YOUR_API_ENDPOINT', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, reasoning })
  });
  return response.json();
}
```

## 🧪 Testing

### Manual Testing Checklist

**Student View:**
- [ ] Panel appears on assignment pages
- [ ] Panel collapsible/expandable
- [ ] Reasoning input requires 50+ characters
- [ ] Guidance prompts display correctly
- [ ] Usage dots update in real-time
- [ ] Transparency modal shows before submission
- [ ] Reflection required before submission

**Teacher View:**
- [ ] Dashboard appears on grading pages
- [ ] Student list shows AI usage indicators
- [ ] Clicking student shows detailed insights
- [ ] Insights modal displays correctly
- [ ] Color coding matches usage levels

### Browser Compatibility
- Chrome 88+
- Edge 88+
- Brave (Chromium-based)

## 📊 Usage Analytics (Optional)

For institutional deployment, consider integrating with learning analytics platforms:

```javascript
// Example: Send anonymized data to learning analytics
chrome.runtime.sendMessage({
  action: 'logAnalytics',
  event: 'guidance_requested',
  metadata: { subject, level, stage }
});
```

## 🤝 Contributing

We welcome contributions! Areas for enhancement:

- **Subject-specific guidance** (math, science, humanities)
- **Multi-language support**
- **Accessibility improvements**
- **Integration with other LMS platforms** (Canvas, Moodle)
- **Advanced NLP** for reasoning quality assessment
- **Visualization improvements** for teacher dashboards

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Design inspired by modern educational technology principles
- Built with feedback from educators and students
- Figma design system for visual consistency

## 📧 Support

For issues, questions, or feedback:
- GitHub Issues: [Create an issue](https://github.com/yourusername/ai-classroom-extension/issues)
- Email: support@aiclassroom.edu
- Documentation: [Full docs](https://docs.aiclassroom.edu)

## 🔮 Future Roadmap

- [ ] Integration with popular AI APIs (OpenAI, Anthropic)
- [ ] Offline mode with cached guidance patterns
- [ ] Mobile support for Google Classroom app
- [ ] Integration with plagiarism detection tools
- [ ] Real-time collaboration features
- [ ] Parent/guardian insight dashboard
- [ ] Multilingual interface and guidance
- [ ] Advanced analytics and reporting
- [ ] Gamification elements for student engagement
- [ ] Professional development resources for teachers

---

**Built with ❤️ for ethical AI education**

*Empowering students to think critically while leveraging AI as a learning partner*
