# COGNIX

### AI-Powered Learning Assistant for Google Classroom

![COGNIX Dashboard](images/Screenshot%202025-12-27%20220748.png)

---

##  Overview

**COGNIX** is a Chrome extension that seamlessly integrates with Google Classroom to provide intelligent, AI-powered assistance for students and comprehensive insights for teachers. Powered by Google's Gemini API, COGNIX transforms the traditional classroom experience into an interactive, personalized learning environment.

## Key Features

### For Students
-  **AI-Powered Guidance** - Get contextual help and hints on assignments in real-time
-  **Smart Assignment Detection** - Automatically identifies and extracts assignment context
-  **Personalized Learning** - Tailored assistance based on your specific questions and needs
-  **Privacy First** - Your data stays secure with server-side API management

### For Teachers
-  **Teacher Dashboard** - Monitor student progress and AI usage patterns
-  **Student Insights** - View detailed analytics on how students engage with AI assistance
-  **Assignment Analytics** - Track classroom-wide trends and learning outcomes
-  **Transparency Reports** - Complete visibility into AI assistance provided to students

##  Architecture

### Technical Stack
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Node.js with Express
- **AI Engine:** Google Gemini API
- **Chrome APIs:** Storage, Messaging, Tabs

### Project Structure
```
├── manifest.json              # Extension configuration
├── background.js             # Service worker & message handling
├── content.js               # Google Classroom integration
├── popup.html/js            # Extension popup interface
├── student-dashboard.html/js # Student dashboard
├── teacher-dashboard.html    # Teacher analytics dashboard
├── auth.html/js             # Authentication system
├── gemini-api.js            # AI integration layer
├── classroom-detector.js    # Assignment context extraction
├── styles.css               # Global styling
├── backend/
│   ├── server.js           # Express API server
│   └── package.json        # Backend dependencies
└── images/                 # Extension icons & assets
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Chrome browser
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/cognix.git
cd cognix
```

2. **Set up the backend**
```bash
cd backend
npm install
```

3. **Configure environment variables**
```bash
# Create .env file in backend folder
echo "GEMINI_API_KEY=your_api_key_here" > .env
echo "PORT=3000" >> .env
echo "ALLOWED_ORIGINS=*" >> .env
```

4. **Start the backend server**
```bash
npm start
```

5. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

6. **Configure the extension**
   - Click the COGNIX icon in Chrome
   - Go to Settings
   - Verify backend URL is `http://localhost:3000`
   - Click "Test Connection"

##  Usage

### Students
1. Sign in to the extension
2. Navigate to any Google Classroom assignment
3. Click "Think With AI" to get personalized guidance
4. Review your AI usage history in the student dashboard

### Teachers
1. Access the teacher dashboard from the extension popup
2. View student AI usage patterns and insights
3. Monitor learning progress and identify students who need help
4. Generate transparency reports for assignments

##  Security & Privacy

- ✅ API keys stored securely on the server (never in browser)
- ✅ Rate limiting and request validation
- ✅ CORS protection
- ✅ User authentication and session management
- ✅ Minimal data collection, maximum privacy

##  Development

### Backend Development
```bash
cd backend
npm run dev  # Start with auto-reload
```

### Testing
- Test the extension on Google Classroom assignments
- Verify API connectivity through Settings
- Check browser console for any errors

## Contributing

Contributions are welcome! Please follow these guidelines:
- Fork the repository
- Create a feature branch
- Write clear commit messages
- Test thoroughly before submitting PR
- Update documentation as needed

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- Google Gemini API for AI capabilities
- Google Classroom for the learning platform
- All educators and students who provided feedback

##  Support

For questions, issues, or feedback:
- Create an issue on GitHub
- Email: shayanejaz2018@gmail.com

---

**Made with ❤️ for better learning experiences**
