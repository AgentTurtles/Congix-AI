// Figma Teacher Dashboard JavaScript - Full Features
// Comprehensive JS with all 12 features integrated

// Storage utility
const storage = {
    get: (key) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            return new Promise((resolve) => {
                chrome.storage.local.get([key], (result) => resolve(result[key]));
            });
        }
        const value = localStorage.getItem(key);
        try {
            return Promise.resolve(JSON.parse(value));
        } catch {
            return Promise.resolve(value);
        }
    },
    set: (key, value) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            return chrome.storage.local.set({ [key]: value });
        }
        localStorage.setItem(key, JSON.stringify(value));
        return Promise.resolve();
    }
};

// ===== Toast Notification System with Smooth Animations =====
function showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#ff4444' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        margin-bottom: 10px;
    `;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <div style="display: flex; align-items: start; gap: 10px;">
            <span style="font-size: 20px;">${icons[type] || icons.info}</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${title || type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div style="font-size: 14px; opacity: 0.95;">${message}</div>
            </div>
            <button style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; opacity: 0.8; padding: 0; margin-left: 10px; transition: opacity 0.2s;">×</button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Trigger slide in animation
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    });
    
    // Close button with hover effect
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.8');
    closeBtn.addEventListener('click', () => {
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    });
    
    // Auto remove with slide out animation
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }
    }, 4000);
}

// Student data with comprehensive info
const studentData = {
    'Sarah Davis': { usage: 'high', rate: '87%', color: '#ff4444', gpa: 3.8, assignments: 5, trend: [65, 70, 68, 75, 80, 78, 87] },
    'Marcus Thompson': { usage: 'medium', rate: '52%', color: '#ffaa00', gpa: 3.2, assignments: 4, trend: [55, 60, 72, 75, 70, 68, 52] },
    'Britney Spears': { usage: 'low', rate: '23%', color: '#44ff44', gpa: 3.9, assignments: 4, trend: [20, 22, 25, 23, 21, 24, 23] },
    'Hailey Williams': { usage: 'medium', rate: '48%', color: '#ffaa00', gpa: 3.5, assignments: 3, trend: [40, 42, 45, 48, 46, 47, 48] },
    'Jojo': { usage: 'high', rate: '91%', color: '#ff4444', gpa: 3.0, assignments: 6, trend: [70, 75, 78, 85, 88, 90, 91] }
};

// Test alerts data
const testAlerts = [
    { type: 'urgent', message: 'Sarah Davis - 87% AI usage spike detected on recent essay', time: '2 hours ago' },
    { type: 'urgent', message: 'Jojo - Consistent high AI usage across 6 assignments', time: '4 hours ago' },
    { type: 'warning', message: 'English Essay Assignment - 73% of class used high AI assistance', time: '5 hours ago' },
    { type: 'warning', message: 'Marcus Thompson - AI usage fluctuating between medium-high', time: '8 hours ago' },
    { type: 'info', message: 'Britney Spears - Excellent progress with balanced AI use', time: '1 day ago' }
];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const user = await storage.get('cognixUser');
    const status = await storage.get('cognixStatus');
    
    if (!user || status !== 'teacher') {
        window.location.href = 'auth.html';
        return;
    }

    // Initialize all features
    initializeTabFunctionality();
    initializeMenuFunctionality();
    initializeStudentRows();
    initializeModals();
    initializeKeyboardShortcuts();
    loadAlerts();
});

// Feature 1: Tab Switching
function initializeTabFunctionality() {
    const studentsTab = document.querySelector('.tab.students');
    const insightsTab = document.querySelector('.tab.insights');
    const studentsContent = document.querySelector('.students-report');
    const insightsContent = document.getElementById('insights-tab');
    const statsCard = document.querySelector('.stats-card');
    const infoFooter = document.querySelector('.info-footer');

    if (studentsTab && insightsTab) {
        studentsTab.addEventListener('click', function() {
            studentsTab.style.background = 'white';
            insightsTab.style.background = 'white';
            if (studentsContent) studentsContent.style.display = 'block';
            if (statsCard) statsCard.style.display = 'block';
            if (infoFooter) infoFooter.style.display = 'block';
            if (insightsContent) insightsContent.style.display = 'none';
        });

        insightsTab.addEventListener('click', function() {
            insightsTab.style.background = '#e8e8e8';
            studentsTab.style.background = 'white';
            if (studentsContent) studentsContent.style.display = 'none';
            if (statsCard) statsCard.style.display = 'none';
            if (infoFooter) infoFooter.style.display = 'none';
            if (insightsContent) insightsContent.style.display = 'block';
        });
    }
}

// Feature 2: Hamburger Menu & Navigation
function initializeMenuFunctionality() {
    const menuIcon = document.querySelector('.menu-icon');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (menuIcon && dropdownMenu) {
        menuIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', function(e) {
            if (!menuIcon.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }

    // Menu item hover effects
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = '#f5f5f5';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
        });
    });

    // Menu item actions
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    const reportsLink = document.getElementById('reportsLink');
    const helpLink = document.getElementById('helpLink');
    const logoutLink = document.getElementById('logoutLink');

    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
        });
    }

    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
        });
    }

    if (reportsLink) {
        reportsLink.addEventListener('click', function(e) {
            e.preventDefault();
            openReportsModal();
        });
    }

    if (helpLink) {
        helpLink.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('For assistance, email: support@cognix-ai.com', 'info', 'Help & Support');
        });
    }

    if (logoutLink) {
        logoutLink.addEventListener('click', async function(e) {
            e.preventDefault();
            await storage.set('cognixUser', null);
            await storage.set('cognixStatus', null);
            window.location.href = 'auth.html';
        });
    }
}

// Feature 3: Student Row Interactions & Modal
function initializeStudentRows() {
    const studentRows = document.querySelectorAll('.report-row');
    const modal = document.getElementById('student-modal');
    const closeModal = document.getElementById('close-modal');

    studentRows.forEach(row => {
        row.style.cursor = 'pointer';
        row.style.transition = 'background 0.2s';
        
        row.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(0,0,0,0.02)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
        });
        
        row.addEventListener('click', function() {
            const studentName = this.querySelector('span').textContent;
            const data = studentData[studentName];
            
            if (data && modal) {
                const modalStudentName = document.getElementById('modal-student-name');
                const modalUsageStatus = document.getElementById('modal-usage-status');
                const modalAiRate = document.getElementById('modal-ai-rate');
                
                if (modalStudentName) modalStudentName.textContent = studentName;
                if (modalUsageStatus) {
                    modalUsageStatus.textContent = data.usage.toUpperCase();
                    modalUsageStatus.style.color = data.color;
                }
                if (modalAiRate) modalAiRate.textContent = data.rate;
                modal.style.display = 'block';
            }
        });
    });

    // Close modal
    if (closeModal && modal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // View details button - opens full profile
    const viewDetailsBtn = document.getElementById('view-details');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', function() {
            const studentName = document.getElementById('modal-student-name').textContent;
            if (modal) modal.style.display = 'none';
            openStudentProfile(studentName);
        });
    }

    // See More button
    const seeMoreBtn = document.querySelector('.see-more-btn');
    if (seeMoreBtn) {
        seeMoreBtn.addEventListener('click', function() {
            // Coming soon - silent
        });
    }
}

// Feature 4: Student Profile with Charts & Analytics
function openStudentProfile(studentName) {
    const modal = document.getElementById('studentProfileModal');
    const nameEl = document.getElementById('profileStudentName');
    const avatarEl = document.getElementById('profileAvatar');
    const badgeEl = document.getElementById('profileUsageBadge');
    const notesEl = document.getElementById('profileNotes');

    if (!modal || !nameEl || !avatarEl || !badgeEl) return;

    // Set student info
    nameEl.textContent = studentName;
    avatarEl.textContent = studentName.charAt(0);

    const student = studentData[studentName];
    if (!student) return;

    // Set usage badge
    badgeEl.textContent = `${student.usage.charAt(0).toUpperCase() + student.usage.slice(1)} Usage (${student.rate})`;
    badgeEl.style.background = student.usage === 'high' ? '#ffe5e5' : student.usage === 'medium' ? '#fff3cd' : '#e5ffe5';
    badgeEl.style.color = student.color;

    // Draw usage chart
    drawUsageChart(student.trend, student.color);

    // Load assignments
    loadStudentAssignments(student);

    // Load notes
    storage.get(`notes_${studentName}`).then(notes => {
        if (notesEl) notesEl.value = notes || '';
    });

    modal.style.display = 'flex';
}

// Feature 5: Usage Trend Chart (7-day graph)
function drawUsageChart(trendData, color) {
    const svg = document.getElementById('usageChart');
    if (!svg) return;

    const points = trendData.map((val, i) => 
        `${i * 40},${100 - val}`
    ).join(' ');

    svg.innerHTML = `
        <polyline points="${points}" 
                  fill="none" 
                  stroke="${color}" 
                  stroke-width="2.5"/>
        ${trendData.map((val, i) => 
            `<circle cx="${i * 40}" cy="${100 - val}" r="4" fill="${color}"/>`
        ).join('')}
        <text x="0" y="95" fill="#666" font-size="10">7d ago</text>
        <text x="240" y="95" fill="#666" font-size="10">Today</text>
    `;
}

// Feature 6: Student Assignments List
function loadStudentAssignments(student) {
    const container = document.getElementById('profileAssignments');
    if (!container) return;

    if (student.assignments === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">No assignments yet</p>';
        return;
    }

    const assignments = [
        { title: 'English Essay: Shakespeare Analysis', score: 87, aiUsage: student.usage },
        { title: 'Math Problem Set Chapter 5', score: 92, aiUsage: 'low' },
        { title: 'Science Lab Report: Chemical Reactions', score: 78, aiUsage: student.usage },
        { title: 'History Research Paper', score: 85, aiUsage: student.usage === 'high' ? 'high' : 'medium' },
        { title: 'Programming Project: Data Structures', score: 95, aiUsage: student.usage },
        { title: 'Biology Worksheet: Cell Division', score: 88, aiUsage: 'low' }
    ].slice(0, student.assignments);

    container.innerHTML = assignments.map(a => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9f9f9; border-radius: 6px; margin-bottom: 8px;">
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${a.title}</div>
                <div style="font-size: 14px; color: #666;">Score: ${a.score}%</div>
            </div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${a.aiUsage === 'high' ? '#ff4444' : a.aiUsage === 'medium' ? '#ffaa00' : '#44ff44'};"></div>
        </div>
    `).join('');
}

// Feature 7-12: Modal Handlers
function initializeModals() {
    // Student Profile Modal
    const profileBackBtn = document.getElementById('profileBackBtn');
    const studentProfileModal = document.getElementById('studentProfileModal');
    
    if (profileBackBtn && studentProfileModal) {
        profileBackBtn.addEventListener('click', () => {
            studentProfileModal.style.display = 'none';
        });
    }

    // Save Notes Button
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', async () => {
            const studentName = document.getElementById('profileStudentName').textContent;
            const notes = document.getElementById('profileNotes').value;
            await storage.set(`notes_${studentName}`, notes);
            showToast('Your notes have been saved', 'success', 'Notes Saved');
        });
    }

    // AI Grading Assistant
    const gradeWithAiBtn = document.getElementById('gradeWithAiBtn');
    if (gradeWithAiBtn) {
        gradeWithAiBtn.addEventListener('click', () => {
            gradeWithAiBtn.disabled = true;
            gradeWithAiBtn.textContent = 'Analyzing...';
            
            setTimeout(() => {
                showToast('Suggested Grade: B+ (87%) | Confidence: 92% | AI Usage: 45%', 'success', 'AI Analysis Complete');
                gradeWithAiBtn.disabled = false;
                gradeWithAiBtn.textContent = 'Analyze with AI';
            }, 2000);
        });
    }

    // Alerts Modal
    const alertsCloseBtn = document.getElementById('alertsCloseBtn');
    const alertsModal = document.getElementById('alertsModal');
    
    if (alertsCloseBtn && alertsModal) {
        alertsCloseBtn.addEventListener('click', () => {
            alertsModal.style.display = 'none';
        });
    }

    // Reports Modal
    const reportsCloseBtn = document.getElementById('reportsCloseBtn');
    const reportsModal = document.getElementById('reportsModal');
    
    if (reportsCloseBtn && reportsModal) {
        reportsCloseBtn.addEventListener('click', () => {
            reportsModal.style.display = 'none';
        });
    }

    // Report buttons
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            btn.disabled = true;
            btn.style.opacity = '0.6';
            const originalText = btn.textContent;
            btn.textContent = `Generating ${type.toUpperCase()}...`;
            
            setTimeout(() => {
                showToast(`Your ${type.toUpperCase()} report has been generated`, 'success', 'Export Complete');
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.textContent = originalText;
                if (document.getElementById('reportsModal')) {
                    document.getElementById('reportsModal').style.display = 'none';
                }
            }, 1500);
        });
    });
}

// Load Alerts
function loadAlerts() {
    window.currentAlerts = testAlerts;
}

// Open Alerts Modal
function openAlertsModal() {
    const modal = document.getElementById('alertsModal');
    const body = document.getElementById('alertsBody');
    
    if (!modal || !body) return;

    if (!window.currentAlerts || window.currentAlerts.length === 0) {
        body.innerHTML = '<p style="text-align: center; color: #999;">No alerts at this time</p>';
    } else {
        body.innerHTML = window.currentAlerts.map(alert => `
            <div style="display: flex; gap: 15px; padding: 15px; background: ${alert.type === 'urgent' ? '#ffe5e5' : alert.type === 'warning' ? '#fff3cd' : '#e3f2fd'}; border-radius: 8px; margin-bottom: 10px;">
                <div style="font-size: 24px;">
                    ${alert.type === 'urgent' ? '🔴' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div style="flex: 1;">
                    <p style="margin: 0 0 5px 0; font-weight: 600;">${alert.message}</p>
                    <span style="font-size: 12px; color: #666;">${alert.time}</span>
                </div>
            </div>
        `).join('');
    }

    modal.style.display = 'flex';
}

// Open Reports Modal
function openReportsModal() {
    const modal = document.getElementById('reportsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Keyboard Shortcuts
function initializeKeyboardShortcuts() {
    const modal = document.getElementById('student-modal');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const studentProfileModal = document.getElementById('studentProfileModal');
    const alertsModal = document.getElementById('alertsModal');
    const reportsModal = document.getElementById('reportsModal');

    document.addEventListener('keydown', function(e) {
        // ESC to close any modal
        if (e.key === 'Escape') {
            if (modal && modal.style.display === 'block') modal.style.display = 'none';
            if (dropdownMenu && dropdownMenu.style.display === 'block') dropdownMenu.style.display = 'none';
            if (studentProfileModal && studentProfileModal.style.display === 'flex') studentProfileModal.style.display = 'none';
            if (alertsModal && alertsModal.style.display === 'flex') alertsModal.style.display = 'none';
            if (reportsModal && reportsModal.style.display === 'flex') reportsModal.style.display = 'none';
        }
    });
}
