// Real-Time Virtual Attendance Management System
class RealTimeAttendanceSystem {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'login';
        this.students = JSON.parse(localStorage.getItem('rtas_students')) || [];
        this.faculty = JSON.parse(localStorage.getItem('rtas_faculty')) || [];
        this.attendance = JSON.parse(localStorage.getItem('rtas_attendance')) || [];
        this.classes = JSON.parse(localStorage.getItem('rtas_classes')) || [];
        this.settings = JSON.parse(localStorage.getItem('rtas_settings')) || this.getDefaultSettings();
        this.liveFeed = [];
        this.cameraStream = null;
        this.recognitionActive = false;
        this.autoRefresh = true;
        this.soundEnabled = true;
        this.sessionStartTime = null;

        this.initializeSystem();
    }

    getDefaultSettings() {
        return {
            attendanceThreshold: 75,
            lateThreshold: 15,
            autoMarkAbsent: 0,
            recognitionModel: 'advanced',
            confidenceThreshold: 85,
            multipleFaces: false,
            emailNotifications: true,
            soundNotifications: true,
            lowAttendanceAlerts: false,
            backupFrequency: 'weekly'
        };
    }

    initializeSystem() {
        this.setupEventListeners();
        this.startRealTimeUpdates();
        this.showPage('login');
    }

    setupEventListeners() {
        // Login
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Mobile menu
        document.querySelector('.nav-toggle').addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.toggle('active');
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Student Management
        document.getElementById('add-student-btn').addEventListener('click', () => this.openModal('student-modal'));
        document.getElementById('student-form').addEventListener('submit', (e) => this.handleAddStudent(e));
        document.getElementById('student-filter').addEventListener('input', () => this.filterStudents());
        document.getElementById('department-filter').addEventListener('change', () => this.filterStudents());
        document.getElementById('class-filter').addEventListener('change', () => this.filterStudents());
        
        // Photo upload
        document.getElementById('student-photo').addEventListener('change', (e) => this.handlePhotoUpload(e));
        document.getElementById('capture-photo-btn').addEventListener('click', () => this.capturePhoto());

        // Faculty Management
        document.getElementById('add-faculty-btn').addEventListener('click', () => this.openModal('faculty-modal'));
        document.getElementById('faculty-form').addEventListener('submit', (e) => this.handleAddFaculty(e));

        // Camera and Attendance
        document.getElementById('start-camera-btn').addEventListener('click', () => this.startCamera());
        document.getElementById('stop-camera-btn').addEventListener('click', () => this.stopCamera());
        document.getElementById('capture-attendance-btn').addEventListener('click', () => this.captureAttendance());
        document.getElementById('create-class-btn').addEventListener('click', () => this.createNewClass());
        document.getElementById('mark-manual-btn').addEventListener('click', () => this.openManualAttendance());

        // Live Feed Controls
        document.getElementById('auto-refresh-toggle').addEventListener('click', (e) => this.toggleAutoRefresh(e));
        document.getElementById('sound-toggle').addEventListener('click', (e) => this.toggleSound(e));
        document.getElementById('clear-feed-btn').addEventListener('click', () => this.clearLiveFeed());
        document.getElementById('pause-feed-btn').addEventListener('click', (e) => this.toggleFeedPause(e));

        // Reports
        document.getElementById('apply-filters-btn').addEventListener('click', () => this.applyReportFilters());
        document.getElementById('clear-filters-btn').addEventListener('click', () => this.clearReportFilters());
        document.getElementById('download-csv-btn').addEventListener('click', () => this.downloadCSV());
        document.getElementById('download-pdf-btn').addEventListener('click', () => this.downloadPDF());

        // Search
        document.getElementById('search-btn').addEventListener('click', () => this.searchStudents());
        document.getElementById('student-search').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.searchStudents();
        });
        document.getElementById('search-department').addEventListener('change', () => this.searchStudents());
        document.getElementById('search-class').addEventListener('change', () => this.searchStudents());
        document.getElementById('search-attendance-status').addEventListener('change', () => this.searchStudents());

        // Settings
        document.getElementById('confidence-threshold').addEventListener('input', (e) => {
            document.getElementById('confidence-display').textContent = e.target.value + '%';
        });
        document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-settings-btn').addEventListener('click', () => this.resetSettings());
        document.getElementById('backup-now-btn').addEventListener('click', () => this.backupData());
        document.getElementById('restore-backup-btn').addEventListener('click', () => this.restoreData());
        document.getElementById('clear-all-data-btn').addEventListener('click', () => this.clearAllData());

        // Modal handlers
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // View toggle buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleView(e));
        });
    }

    startRealTimeUpdates() {
        // Update current time every second
        setInterval(() => {
            const now = new Date();
            const timeElement = document.getElementById('current-time');
            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString();
            }
            
            const dateElements = document.querySelectorAll('#attendance-date');
            dateElements.forEach(el => {
                el.textContent = now.toLocaleDateString();
            });
            
            const timeElements = document.querySelectorAll('#attendance-time');
            timeElements.forEach(el => {
                el.textContent = now.toLocaleTimeString();
            });
        }, 1000);

        // Update live feed every 5 seconds if auto-refresh is enabled
        setInterval(() => {
            if (this.autoRefresh && this.currentPage === 'live-attendance') {
                this.updateLiveFeed();
            }
        }, 5000);

        // Update dashboard stats every 30 seconds
        setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.updateDashboardStats();
            }
        }, 30000);
    }

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        // Enhanced authentication simulation
        const validCredentials = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'faculty', password: 'faculty123', role: 'faculty' }
        ];

        const user = validCredentials.find(cred => 
            cred.username === username && 
            cred.password === password && 
            cred.role === role
        );

        if (user) {
            this.currentUser = { username, role };
            this.sessionStartTime = new Date();
            this.showMessage('✅ Login successful! Welcome to Real-Time Attendance System', 'success');
            
            // Add to live feed
            this.addToLiveFeed(`👤 User ${username} (${role}) logged in`, 'system');
            
            setTimeout(() => {
                this.showPage('dashboard');
                this.updateNavigation();
                this.updateDashboard();
            }, 1000);
        } else {
            this.showMessage('❌ Invalid credentials. Please check username, password and role.', 'error');
        }
    }

    handleLogout() {
        const username = this.currentUser?.username;
        this.addToLiveFeed(`👤 User ${username} logged out`, 'system');
        this.currentUser = null;
        this.sessionStartTime = null;
        this.stopCamera();
        this.showPage('login');
        document.getElementById('navbar').classList.add('hidden');
        document.getElementById('login-form').reset();
        this.showMessage('👋 Successfully logged out', 'info');
    }

    handleNavigation(e) {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        if (page) {
            this.showPage(page);
            this.updateActiveNavLink(e.target);
            
            // Close mobile menu
            document.querySelector('.nav-menu').classList.remove('active');
        }
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
            this.loadPageData(pageId);
        }
    }

    loadPageData(pageId) {
        switch (pageId) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'student-registration':
                this.loadStudents();
                this.updateFilters();
                break;
            case 'faculty-management':
                this.loadFaculty();
                break;
            case 'take-attendance':
                this.loadAttendancePage();
                break;
            case 'live-attendance':
                this.loadLiveAttendancePage();
                break;
            case 'attendance-report':
                this.loadAttendanceReport();
                break;
            case 'search-student':
                this.loadSearchPage();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    updateNavigation() {
        const navbar = document.getElementById('navbar');
        navbar.classList.remove('hidden');
        
        // Hide admin-only features for faculty
        if (this.currentUser.role === 'faculty') {
            document.querySelectorAll('.admin-only').forEach(element => {
                element.style.display = 'none';
            });
        }
    }

    updateActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    // Dashboard Methods
    updateDashboard() {
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome back, ${this.currentUser.username}! System running in real-time.`;
        }
        
        this.updateDashboardStats();
        this.updateLiveFeed();
        this.updateQuickStats();
    }

    updateDashboardStats() {
        // Total students
        document.getElementById('total-students').textContent = this.students.length;
        document.getElementById('students-change').textContent = this.students.length === 0 ? 
            'Add your first student' : `${this.students.length} registered`;

        // Today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = this.attendance.filter(record => record.date === today);
        document.getElementById('today-attendance').textContent = todayAttendance.length;
        document.getElementById('attendance-change').textContent = todayAttendance.length === 0 ?
            'No attendance yet today' : `${todayAttendance.length} marked today`;

        // Faculty count
        document.getElementById('total-faculty').textContent = this.faculty.length;
        document.getElementById('faculty-change').textContent = this.faculty.length === 0 ?
            'Add faculty members' : `${this.faculty.length} faculty members`;

        // Attendance rate
        const rate = this.students.length > 0 ? 
            Math.round((todayAttendance.length / this.students.length) * 100) : 0;
        document.getElementById('attendance-rate').textContent = `${rate}%`;
        document.getElementById('rate-change').textContent = this.students.length === 0 ?
            'Data will appear' : `${rate}% attendance today`;
    }

    updateQuickStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = this.attendance.filter(record => record.date === today);
        
        const presentCount = todayAttendance.filter(record => record.status === 'Present').length;
        const lateCount = todayAttendance.filter(record => record.status === 'Late').length;
        const absentCount = this.students.length - presentCount - lateCount;

        document.getElementById('present-count').textContent = presentCount;
        document.getElementById('absent-count').textContent = Math.max(0, absentCount);
        document.getElementById('late-count').textContent = lateCount;
    }

    updateLiveFeed() {
        const liveFeedElement = document.getElementById('live-feed');
        const realtimeFeedElement = document.getElementById('realtime-feed');
        
        if (this.liveFeed.length === 0) {
            const noDataMessage = `
                <div class="no-data">
                    <p>📱 No live attendance data yet</p>
                    <p>Start taking attendance to see real-time updates here</p>
                </div>
            `;
            if (liveFeedElement) liveFeedElement.innerHTML = noDataMessage;
            return;
        }

        const feedHTML = this.liveFeed.slice(-10).reverse().map(item => `
            <div class="feed-item ${item.type}">
                <span class="timestamp">${item.time}</span>
                <span class="message">${item.message}</span>
            </div>
        `).join('');

        if (liveFeedElement) liveFeedElement.innerHTML = feedHTML;
        if (realtimeFeedElement) realtimeFeedElement.innerHTML = feedHTML;

        // Update feed refresh indicator
        const feedRefresh = document.getElementById('feed-refresh');
        if (feedRefresh) {
            feedRefresh.textContent = 'Updated just now';
        }
    }

    addToLiveFeed(message, type = 'info') {
        const feedItem = {
            id: Date.now(),
            message,
            type,
            time: new Date().toLocaleTimeString(),
            timestamp: new Date()
        };

        this.liveFeed.push(feedItem);
        
        // Keep only last 100 items
        if (this.liveFeed.length > 100) {
            this.liveFeed.shift();
        }

        this.updateLiveFeed();

        // Play sound if enabled
        if (this.soundEnabled && type === 'attendance-marked') {
            this.playNotificationSound();
        }

        // Update last activity time
        const lastActivityElement = document.getElementById('last-activity-time');
        if (lastActivityElement) {
            lastActivityElement.textContent = new Date().toLocaleTimeString();
        }
    }

    // Student Management Methods
    handleAddStudent(e) {
        e.preventDefault();
        
        const rollNumber = document.getElementById('student-roll').value;
        
        // Check for duplicate roll number
        if (this.students.some(student => student.rollNumber === rollNumber)) {
            this.showMessage('❌ Roll number already exists! Please use a unique roll number.', 'error');
            return;
        }

        const student = {
            id: Date.now(),
            name: document.getElementById('student-name').value,
            rollNumber: rollNumber,
            department: document.getElementById('student-department').value,
            class: document.getElementById('student-class').value,
            email: document.getElementById('student-email').value || null,
            phone: document.getElementById('student-phone').value || null,
            photo: this.currentPhotoData || null,
            registrationDate: new Date().toISOString(),
            attendanceCount: 0
        };

        this.students.push(student);
        this.saveData();
        this.loadStudents();
        this.updateFilters();
        this.closeModal('student-modal');
        this.showMessage(`✅ Student "${student.name}" added successfully!`, 'success');
        this.addToLiveFeed(`🧑‍🎓 New student registered: ${student.name} (${student.rollNumber})`, 'system');
        
        document.getElementById('student-form').reset();
        this.currentPhotoData = null;
        this.hidePhotoPreview();
    }

    loadStudents() {
        this.displayStudents(this.students);
        document.getElementById('student-count').textContent = this.students.length;
    }

    displayStudents(students) {
        const studentsGrid = document.getElementById('students-grid');
        
        if (students.length === 0) {
            studentsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🧑‍🎓</div>
                    <h3>No Students Found</h3>
                    <p>Add students to get started with attendance tracking</p>
                    <button class="btn btn-primary" onclick="document.getElementById('add-student-btn').click()">
                        ➕ Add First Student
                    </button>
                </div>
            `;
            return;
        }

        studentsGrid.innerHTML = students.map(student => `
            <div class="student-card" data-student-id="${student.id}">
                <div class="student-header">
                    <div class="student-avatar">
                        ${student.photo ? 
                            `<img src="${student.photo}" alt="${student.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
                            student.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="student-info">
                        <h3>${student.name}</h3>
                        <p><strong>Roll:</strong> ${student.rollNumber}</p>
                        <p><strong>Dept:</strong> ${student.department}</p>
                        <p><strong>Class:</strong> ${student.class}</p>
                        ${student.email ? `<p><strong>Email:</strong> ${student.email}</p>` : ''}
                        ${student.phone ? `<p><strong>Phone:</strong> ${student.phone}</p>` : ''}
                    </div>
                </div>
                <div class="student-actions">
                    <button class="btn btn-small btn-primary" onclick="attendanceSystem.viewStudent(${student.id})">
                        👁️ View Profile
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="attendanceSystem.editStudent(${student.id})">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-small btn-danger" onclick="attendanceSystem.deleteStudent(${student.id})">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterStudents() {
        const nameFilter = document.getElementById('student-filter').value.toLowerCase();
        const deptFilter = document.getElementById('department-filter').value;
        const classFilter = document.getElementById('class-filter').value;

        let filtered = this.students.filter(student => {
            const matchesName = student.name.toLowerCase().includes(nameFilter) ||
                               student.rollNumber.toLowerCase().includes(nameFilter) ||
                               (student.email && student.email.toLowerCase().includes(nameFilter));
            const matchesDept = !deptFilter || student.department === deptFilter;
            const matchesClass = !classFilter || student.class === classFilter;
            
            return matchesName && matchesDept && matchesClass;
        });

        this.displayStudents(filtered);
        document.getElementById('student-count').textContent = filtered.length;
    }

    updateFilters() {
        // Update department filter
        const departments = [...new Set(this.students.map(s => s.department))];
        const deptFilter = document.getElementById('department-filter');
        const searchDeptFilter = document.getElementById('search-department');
        
        [deptFilter, searchDeptFilter].forEach(filter => {
            if (filter) {
                filter.innerHTML = '<option value="">All Departments</option>' + 
                    departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
            }
        });

        // Update class filter
        const classes = [...new Set(this.students.map(s => s.class))];
        const classFilter = document.getElementById('class-filter');
        const searchClassFilter = document.getElementById('search-class');
        const reportClassFilter = document.getElementById('report-class');
        const attendanceClassSelect = document.getElementById('attendance-class');
        
        [classFilter, searchClassFilter, reportClassFilter, attendanceClassSelect].forEach(filter => {
            if (filter) {
                const currentValue = filter.value;
                filter.innerHTML = '<option value="">All Classes</option>' + 
                    classes.map(cls => `<option value="${cls}">${cls}</option>`).join('');
                filter.value = currentValue;
            }
        });
    }

    viewStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const studentAttendance = this.attendance.filter(record => record.studentId === studentId);
        const attendanceRate = studentAttendance.length > 0 ? 
            Math.round((studentAttendance.filter(r => r.status === 'Present').length / studentAttendance.length) * 100) : 0;

        const profileContent = document.getElementById('student-profile-content');
        profileContent.innerHTML = `
            <div class="profile-section">
                <div class="profile-photo">
                    ${student.photo ? 
                        `<img src="${student.photo}" alt="${student.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
                        student.name.charAt(0).toUpperCase()
                    }
                </div>
                <div class="profile-details">
                    <h2>${student.name}</h2>
                    <div class="profile-info">
                        <div class="info-item">
                            <span class="info-label">Roll Number</span>
                            <span class="info-value">${student.rollNumber}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Department</span>
                            <span class="info-value">${student.department}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Class</span>
                            <span class="info-value">${student.class}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email</span>
                            <span class="info-value">${student.email || 'Not provided'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Phone</span>
                            <span class="info-value">${student.phone || 'Not provided'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Registration Date</span>
                            <span class="info-value">${new Date(student.registrationDate).toLocaleDateString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Attendance Rate</span>
                            <span class="info-value ${attendanceRate >= 75 ? 'text-success' : attendanceRate >= 60 ? 'text-warning' : 'text-danger'}">${attendanceRate}%</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="attendance-history">
                <h3>📊 Attendance History</h3>
                ${studentAttendance.length > 0 ? `
                    <div class="attendance-stats">
                        <div class="stat-item">
                            <span class="stat-label">Present</span>
                            <span class="stat-value">${studentAttendance.filter(r => r.status === 'Present').length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Late</span>
                            <span class="stat-value">${studentAttendance.filter(r => r.status === 'Late').length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Absent</span>
                            <span class="stat-value">${studentAttendance.filter(r => r.status === 'Absent').length}</span>
                        </div>
                    </div>
                    <div class="attendance-items">
                        ${studentAttendance.slice(-10).reverse().map(record => `
                            <div class="attendance-item ${record.status.toLowerCase()}">
                                <div class="attendance-info">
                                    <span class="attendance-date">${new Date(record.date).toLocaleDateString()}</span>
                                    <span class="attendance-class">${record.class}</span>
                                    <span class="attendance-time">${record.time}</span>
                                </div>
                                <span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="no-data">
                        <p>No attendance records found for this student</p>
                        <p>Attendance will appear here once you start taking attendance</p>
                    </div>
                `}
            </div>
        `;
        
        this.openModal('student-profile-modal');
    }

    deleteStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        if (confirm(`Are you sure you want to delete ${student.name}?\n\nThis will also remove all their attendance records and cannot be undone.`)) {
            this.students = this.students.filter(s => s.id !== studentId);
            this.attendance = this.attendance.filter(a => a.studentId !== studentId);
            this.saveData();
            this.loadStudents();
            this.updateFilters();
            this.showMessage(`🗑️ Student "${student.name}" and all related data has been deleted`, 'info');
            this.addToLiveFeed(`🗑️ Student deleted: ${student.name} (${student.rollNumber})`, 'system');
        }
    }

    // Faculty Management Methods
    handleAddFaculty(e) {
        e.preventDefault();
        
        const facultyId = document.getElementById('faculty-id').value;
        
        // Check for duplicate faculty ID
        if (this.faculty.some(faculty => faculty.facultyId === facultyId)) {
            this.showMessage('❌ Faculty ID already exists! Please use a unique ID.', 'error');
            return;
        }

        const subjects = document.getElementById('faculty-subjects').value
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        const faculty = {
            id: Date.now(),
            name: document.getElementById('faculty-name').value,
            facultyId: facultyId,
            department: document.getElementById('faculty-department').value,
            email: document.getElementById('faculty-email').value || null,
            subjects: subjects,
            addedDate: new Date().toISOString()
        };

        this.faculty.push(faculty);
        this.saveData();
        this.loadFaculty();
        this.closeModal('faculty-modal');
        this.showMessage(`✅ Faculty "${faculty.name}" added successfully!`, 'success');
        this.addToLiveFeed(`🧑‍🏫 New faculty added: ${faculty.name} (${faculty.facultyId})`, 'system');
        
        document.getElementById('faculty-form').reset();
    }

    loadFaculty() {
        const facultyGrid = document.getElementById('faculty-grid');
        
        if (this.faculty.length === 0) {
            facultyGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🧑‍🏫</div>
                    <h3>No Faculty Members Added</h3>
                    <p>Add faculty members to manage classes and subjects</p>
                    <button class="btn btn-primary" onclick="document.getElementById('add-faculty-btn').click()">
                        ➕ Add First Faculty
                    </button>
                </div>
            `;
            return;
        }

        facultyGrid.innerHTML = this.faculty.map(faculty => `
            <div class="faculty-card">
                <div class="faculty-header">
                    <div class="faculty-avatar">
                        ${faculty.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="faculty-info">
                        <h3>${faculty.name}</h3>
                        <p><strong>ID:</strong> ${faculty.facultyId}</p>
                        <p><strong>Department:</strong> ${faculty.department}</p>
                        ${faculty.email ? `<p><strong>Email:</strong> ${faculty.email}</p>` : ''}
                        <p><strong>Subjects:</strong> ${faculty.subjects.join(', ') || 'None assigned'}</p>
                    </div>
                </div>
                <div class="faculty-actions">
                    <button class="btn btn-small btn-secondary" onclick="attendanceSystem.editFaculty(${faculty.id})">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-small btn-danger" onclick="attendanceSystem.deleteFaculty(${faculty.id})">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    deleteFaculty(facultyId) {
        const faculty = this.faculty.find(f => f.id === facultyId);
        if (!faculty) return;

        if (confirm(`Are you sure you want to delete ${faculty.name}?\n\nThis action cannot be undone.`)) {
            this.faculty = this.faculty.filter(f => f.id !== facultyId);
            this.saveData();
            this.loadFaculty();
            this.showMessage(`🗑️ Faculty "${faculty.name}" has been deleted`, 'info');
            this.addToLiveFeed(`🗑️ Faculty deleted: ${faculty.name} (${faculty.facultyId})`, 'system');
        }
    }

    // Camera and Attendance Methods
    loadAttendancePage() {
        this.updateAttendanceClassOptions();
        this.loadTodaysAttendance();
    }

    updateAttendanceClassOptions() {
        const classSelect = document.getElementById('attendance-class');
        const classes = [...new Set(this.students.map(s => s.class))];
        
        classSelect.innerHTML = '<option value="">Choose Class</option>' + 
            classes.map(cls => `<option value="${cls}">${cls}</option>`).join('');
    }

    async startCamera() {
        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                } 
            });
            
            const video = document.getElementById('camera-feed');
            const placeholder = document.getElementById('camera-placeholder');
            const overlay = document.getElementById('face-detection-overlay');
            
            video.srcObject = this.cameraStream;
            video.style.display = 'block';
            placeholder.style.display = 'none';
            overlay.classList.remove('hidden');
            
            document.getElementById('start-camera-btn').classList.add('hidden');
            document.getElementById('stop-camera-btn').classList.remove('hidden');
            document.getElementById('capture-attendance-btn').classList.remove('hidden');
            
            this.recognitionActive = true;
            this.simulateFaceDetection();
            this.addToLiveFeed('📷 Camera started for attendance', 'system');
            this.showMessage('📷 Camera started successfully!', 'success');
            
        } catch (error) {
            console.error('Camera access error:', error);
            this.showMessage('❌ Camera access denied or not available. Please check permissions.', 'error');
        }
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        const video = document.getElementById('camera-feed');
        const placeholder = document.getElementById('camera-placeholder');
        const overlay = document.getElementById('face-detection-overlay');
        
        video.style.display = 'none';
        placeholder.style.display = 'flex';
        overlay.classList.add('hidden');
        
        document.getElementById('start-camera-btn').classList.remove('hidden');
        document.getElementById('stop-camera-btn').classList.add('hidden');
        document.getElementById('capture-attendance-btn').classList.add('hidden');
        
        this.recognitionActive = false;
        this.updateRecognitionStatus('Camera stopped', 'info');
        this.addToLiveFeed('📷 Camera stopped', 'system');
    }

    simulateFaceDetection() {
        if (!this.recognitionActive) return;

        const detectionInterval = setInterval(() => {
            if (!this.recognitionActive) {
                clearInterval(detectionInterval);
                return;
            }

            if (this.students.length === 0) {
                this.updateRecognitionStatus('No students registered for recognition', 'warning');
                return;
            }

            // Simulate random face detection
            if (Math.random() > 0.7) { // 30% chance of detection
                const randomStudent = this.students[Math.floor(Math.random() * this.students.length)];
                const confidence = Math.floor(Math.random() * 40) + 60; // 60-100%
                
                if (confidence >= this.settings.confidenceThreshold) {
                    this.updateRecognitionStatus(
                        `Face detected: ${randomStudent.name}`,
                        'success',
                        confidence,
                        randomStudent
                    );
                } else {
                    this.updateRecognitionStatus(
                        `Face detected but confidence too low: ${confidence}%`,
                        'warning',
                        confidence
                    );
                }
            } else {
                this.updateRecognitionStatus('Scanning for faces...', 'info');
            }
        }, 2000);
    }

    updateRecognitionStatus(message, type, confidence = 0, student = null) {
        const recognitionResult = document.getElementById('recognition-result');
        const confidenceBar = recognitionResult.querySelector('.confidence-bar');
        const confidenceText = recognitionResult.querySelector('.confidence-text');
        const confidenceFill = recognitionResult.querySelector('.confidence-fill');
        
        let statusIcon = '⭕';
        switch (type) {
            case 'success': statusIcon = '✅'; break;
            case 'warning': statusIcon = '⚠️'; break;
            case 'error': statusIcon = '❌'; break;
            case 'info': default: statusIcon = '🔍'; break;
        }
        
        recognitionResult.className = `recognition-result ${type}`;
        recognitionResult.innerHTML = `
            <div class="status-indicator">${statusIcon}</div>
            <p><strong>${message}</strong></p>
            ${student ? `<p>Roll: ${student.rollNumber} | Dept: ${student.department}</p>` : ''}
            <div class="confidence-bar ${confidence > 0 ? '' : 'hidden'}">
                <div class="confidence-fill" style="width: ${confidence}%"></div>
                <span class="confidence-text">${confidence}%</span>
            </div>
        `;
        
        if (student && confidence >= this.settings.confidenceThreshold) {
            // Enable capture button
            document.getElementById('capture-attendance-btn').disabled = false;
            document.getElementById('capture-attendance-btn').setAttribute('data-student-id', student.id);
        } else {
            document.getElementById('capture-attendance-btn').disabled = true;
            document.getElementById('capture-attendance-btn').removeAttribute('data-student-id');
        }
    }

    captureAttendance() {
        const selectedClass = document.getElementById('attendance-class').value;
        const captureBtn = document.getElementById('capture-attendance-btn');
        const studentId = captureBtn.getAttribute('data-student-id');
        
        if (!selectedClass) {
            this.showMessage('⚠️ Please select a class first', 'warning');
            return;
        }
        
        if (!studentId) {
            this.showMessage('⚠️ No student detected. Please wait for face recognition.', 'warning');
            return;
        }

        const student = this.students.find(s => s.id == studentId);
        if (!student) {
            this.showMessage('❌ Student not found', 'error');
            return;
        }

        // Check if already marked today
        const today = new Date().toISOString().split('T')[0];
        const existingRecord = this.attendance.find(record => 
            record.studentId == studentId && 
            record.date === today && 
            record.class === selectedClass
        );

        if (existingRecord) {
            this.showMessage(`⚠️ ${student.name} already marked ${existingRecord.status} for ${selectedClass} today`, 'warning');
            return;
        }

        const currentTime = new Date();
        const timeString = currentTime.toTimeString().split(' ')[0];
        
        // Determine status (Present/Late based on current time)
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        const isLate = (currentHour > 9) || (currentHour === 9 && currentMinute > this.settings.lateThreshold);
        
        const attendanceRecord = {
            id: Date.now(),
            studentId: parseInt(studentId),
            studentName: student.name,
            rollNumber: student.rollNumber,
            class: selectedClass,
            department: student.department,
            date: today,
            time: timeString,
            status: isLate ? 'Late' : 'Present',
            method: 'Face Recognition',
            confidence: document.querySelector('.confidence-text')?.textContent || '85%'
        };

        this.attendance.push(attendanceRecord);
        this.saveData();
        this.loadTodaysAttendance();
        this.updateDashboardStats();
        
        const statusEmoji = isLate ? '⏰' : '✅';
        this.showMessage(`${statusEmoji} Attendance marked: ${student.name} - ${attendanceRecord.status}`, 'success');
        this.addToLiveFeed(`${statusEmoji} Attendance marked: ${student.name} (${student.rollNumber}) - ${attendanceRecord.status} in ${selectedClass}`, 'attendance-marked');
        
        // Update live stats
        document.getElementById('live-detected-count').textContent = parseInt(document.getElementById('live-detected-count').textContent) + 1;
        document.getElementById('live-present-count').textContent = this.attendance.filter(r => r.date === today && r.status !== 'Absent').length;
        
        // Play sound notification
        this.playNotificationSound();
        
        // Reset recognition status
        this.updateRecognitionStatus('Attendance marked! Continue scanning...', 'info');
    }

    loadTodaysAttendance() {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = this.attendance.filter(record => record.date === today);
        
        const attendanceContainer = document.getElementById('todays-attendance');
        const attendanceCounter = document.getElementById('attendance-counter');
        
        if (attendanceCounter) {
            attendanceCounter.textContent = todayAttendance.length;
        }

        if (todayAttendance.length === 0) {
            attendanceContainer.innerHTML = `
                <div class="no-attendance">
                    <p>📋 No attendance marked yet today</p>
                    <p>Start the camera and detect faces to mark attendance</p>
                </div>
            `;
            return;
        }

        attendanceContainer.innerHTML = todayAttendance
            .sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`))
            .reverse()
            .map(record => `
                <div class="attendance-item ${record.status.toLowerCase()}">
                    <div class="attendance-info">
                        <strong>${record.studentName}</strong>
                        <span>${record.class}</span>
                        <span>${record.time}</span>
                    </div>
                    <div class="attendance-meta">
                        <span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span>
                        <small>${record.method}</small>
                    </div>
                </div>
            `).join('');
    }

    createNewClass() {
        const className = prompt('Enter new class name (e.g., "CS-101", "Math-A"):');
        if (className && className.trim()) {
            const classSelect = document.getElementById('attendance-class');
            const option = document.createElement('option');
            option.value = className.trim();
            option.textContent = className.trim();
            classSelect.appendChild(option);
            classSelect.value = className.trim();
            
            this.showMessage(`✅ New class "${className.trim()}" created and selected`, 'success');
            this.addToLiveFeed(`📚 New class created: ${className.trim()}`, 'system');
        }
    }

    // Live Attendance Methods
    loadLiveAttendancePage() {
        document.getElementById('session-start-time').textContent = 
            this.sessionStartTime ? this.sessionStartTime.toLocaleTimeString() : '--:--';
        
        this.updateLiveStats();
        this.updateLiveFeed();
    }

    updateLiveStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = this.attendance.filter(record => record.date === today);
        
        document.getElementById('live-detected-count').textContent = todayAttendance.length;
        document.getElementById('live-present-count').textContent = 
            todayAttendance.filter(r => r.status !== 'Absent').length;
        
        if (todayAttendance.length > 0) {
            const lastRecord = todayAttendance[todayAttendance.length - 1];
            document.getElementById('last-activity-time').textContent = lastRecord.time;
        }
    }

    toggleAutoRefresh(e) {
        this.autoRefresh = !this.autoRefresh;
        const btn = e.target;
        
        if (this.autoRefresh) {
            btn.classList.add('active');
            btn.innerHTML = '🔄 Auto Refresh';
            this.showMessage('🔄 Auto refresh enabled', 'info');
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '⏸️ Auto Refresh';
            this.showMessage('⏸️ Auto refresh disabled', 'info');
        }
    }

    toggleSound(e) {
        this.soundEnabled = !this.soundEnabled;
        const btn = e.target;
        
        if (this.soundEnabled) {
            btn.innerHTML = '🔊 Sound Alerts';
            this.showMessage('🔊 Sound alerts enabled', 'info');
        } else {
            btn.innerHTML = '🔇 Sound Alerts';
            this.showMessage('🔇 Sound alerts disabled', 'info');
        }
    }

    clearLiveFeed() {
        if (confirm('Clear the live feed? This will remove all current feed items.')) {
            this.liveFeed = [];
            this.updateLiveFeed();
            this.addToLiveFeed('🧹 Live feed cleared', 'system');
        }
    }

    toggleFeedPause(e) {
        const btn = e.target;
        if (btn.textContent.includes('Pause')) {
            btn.innerHTML = '▶️ Resume';
            this.autoRefresh = false;
            this.showMessage('⏸️ Live feed paused', 'info');
        } else {
            btn.innerHTML = '⏸️ Pause';
            this.autoRefresh = true;
            this.showMessage('▶️ Live feed resumed', 'info');
        }
    }

    playNotificationSound() {
        if (!this.soundEnabled) return;
        
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // Photo Upload Methods
    handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.currentPhotoData = e.target.result;
                    this.showPhotoPreview(e.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                this.showMessage('❌ Please select a valid image file', 'error');
            }
        }
    }

    showPhotoPreview(imageSrc) {
        const preview = document.getElementById('photo-preview');
        const previewImage = document.getElementById('preview-image');
        
        previewImage.src = imageSrc;
        preview.classList.remove('hidden');
        
        // Add remove photo functionality
        const removeBtn = preview.querySelector('.remove-photo');
        removeBtn.onclick = () => this.hidePhotoPreview();
    }

    hidePhotoPreview() {
        const preview = document.getElementById('photo-preview');
        preview.classList.add('hidden');
        this.currentPhotoData = null;
        document.getElementById('student-photo').value = '';
    }

    capturePhoto() {
        // Simulate photo capture from webcam
        this.showMessage('📷 Photo capture feature would integrate with camera API in production', 'info');
    }

    // Reports Methods
    loadAttendanceReport() {
        this.updateReportFilters();
        this.applyReportFilters();
    }

    updateReportFilters() {
        // Set default date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        document.getElementById('report-date-from').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('report-date-to').value = today.toISOString().split('T')[0];
        
        this.updateFilters(); // Updates class filters
    }

    applyReportFilters() {
        const dateFrom = document.getElementById('report-date-from').value;
        const dateTo = document.getElementById('report-date-to').value;
        const classFilter = document.getElementById('report-class').value;
        const studentFilter = document.getElementById('report-student').value.toLowerCase();
        const statusFilter = document.getElementById('report-status').value;

        let filteredAttendance = [...this.attendance];

        if (dateFrom) {
            filteredAttendance = filteredAttendance.filter(record => record.date >= dateFrom);
        }

        if (dateTo) {
            filteredAttendance = filteredAttendance.filter(record => record.date <= dateTo);
        }

        if (classFilter) {
            filteredAttendance = filteredAttendance.filter(record => record.class === classFilter);
        }

        if (studentFilter) {
            filteredAttendance = filteredAttendance.filter(record => 
                record.studentName.toLowerCase().includes(studentFilter) ||
                record.rollNumber.toLowerCase().includes(studentFilter)
            );
        }

        if (statusFilter) {
            filteredAttendance = filteredAttendance.filter(record => record.status === statusFilter);
        }

        this.displayAttendanceTable(filteredAttendance);
        document.getElementById('results-count').textContent = `${filteredAttendance.length} records found`;
    }

    displayAttendanceTable(attendanceData) {
        const tableBody = document.getElementById('attendance-table-body');
        
        if (attendanceData.length === 0) {
            tableBody.innerHTML = `
                <tr class="no-data-row">
                    <td colspan="8">
                        <div class="no-data">
                            <p>📊 No attendance records match your filters</p>
                            <p>Try adjusting the date range or removing some filters</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = attendanceData
            .sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`))
            .map(record => `
                <tr>
                    <td>${new Date(record.date).toLocaleDateString()}</td>
                    <td>${record.time}</td>
                    <td>${record.studentName}</td>
                    <td>${record.rollNumber}</td>
                    <td>${record.class}</td>
                    <td><span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span></td>
                    <td>${record.method || 'Manual'}</td>
                    <td>
                        <button class="btn btn-small btn-danger" onclick="attendanceSystem.deleteAttendanceRecord(${record.id})">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `).join('');
    }

    clearReportFilters() {
        document.getElementById('report-date-from').value = '';
        document.getElementById('report-date-to').value = '';
        document.getElementById('report-class').value = '';
        document.getElementById('report-student').value = '';
        document.getElementById('report-status').value = '';
        this.applyReportFilters();
    }

    deleteAttendanceRecord(recordId) {
        if (confirm('Are you sure you want to delete this attendance record?')) {
            this.attendance = this.attendance.filter(record => record.id !== recordId);
            this.saveData();
            this.applyReportFilters();
            this.loadTodaysAttendance();
            this.updateDashboardStats();
            this.showMessage('🗑️ Attendance record deleted', 'info');
        }
    }

    downloadCSV() {
        const data = this.attendance.map(record => ({
            Date: record.date,
            Time: record.time,
            'Student Name': record.studentName,
            'Roll Number': record.rollNumber,
            Class: record.class,
            Department: record.department,
            Status: record.status,
            Method: record.method || 'Manual',
            Confidence: record.confidence || 'N/A'
        }));

        this.downloadFile(data, 'attendance_report.csv', 'csv');
        this.showMessage('📄 CSV report downloaded successfully!', 'success');
        this.addToLiveFeed('📄 Attendance report exported to CSV', 'system');
    }

    downloadPDF() {
        // Simulate PDF generation
        this.showMessage('📑 PDF report generation feature would integrate with a PDF library in production', 'info');
        this.addToLiveFeed('📑 PDF report generated', 'system');
    }

    // Search Methods
    loadSearchPage() {
        document.getElementById('search-results-count').textContent = `${this.students.length} students in database`;
        this.updateFilters();
        this.displaySearchResults([]);
    }

    searchStudents() {
        const query = document.getElementById('student-search').value.toLowerCase();
        const deptFilter = document.getElementById('search-department').value;
        const classFilter = document.getElementById('search-class').value;
        const attendanceFilter = document.getElementById('search-attendance-status').value;

        let results = this.students;

        if (query) {
            results = results.filter(student => 
                student.name.toLowerCase().includes(query) ||
                student.rollNumber.toLowerCase().includes(query) ||
                student.department.toLowerCase().includes(query) ||
                (student.email && student.email.toLowerCase().includes(query))
            );
        }

        if (deptFilter) {
            results = results.filter(student => student.department === deptFilter);
        }

        if (classFilter) {
            results = results.filter(student => student.class === classFilter);
        }

        if (attendanceFilter) {
            results = results.filter(student => {
                const studentAttendance = this.attendance.filter(r => r.studentId === student.id);
                if (studentAttendance.length === 0) return attendanceFilter === 'low';
                
                const rate = (studentAttendance.filter(r => r.status === 'Present').length / studentAttendance.length) * 100;
                
                switch (attendanceFilter) {
                    case 'high': return rate >= 80;
                    case 'medium': return rate >= 60 && rate < 80;
                    case 'low': return rate < 60;
                    default: return true;
                }
            });
        }

        this.displaySearchResults(results);
    }

    displaySearchResults(students) {
        const resultsContainer = document.getElementById('search-results');
        
        if (students.length === 0) {
            if (document.getElementById('student-search').value || 
                document.getElementById('search-department').value ||
                document.getElementById('search-class').value ||
                document.getElementById('search-attendance-status').value) {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No Students Found</h3>
                        <p>No students match your search criteria</p>
                        <p>Try adjusting your search terms or filters</p>
                    </div>
                `;
            } else {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>Search Your Students</h3>
                        <p>Use the search bar above to find students by name, roll number, or other criteria</p>
                    </div>
                `;
            }
            return;
        }

        resultsContainer.innerHTML = students.map(student => {
            const attendanceCount = this.attendance.filter(r => r.studentId === student.id).length;
            const presentCount = this.attendance.filter(r => r.studentId === student.id && r.status === 'Present').length;
            const attendanceRate = attendanceCount > 0 ? Math.round((presentCount / attendanceCount) * 100) : 0;
            
            return `
                <div class="student-card">
                    <div class="student-header">
                        <div class="student-avatar">
                            ${student.photo ? 
                                `<img src="${student.photo}" alt="${student.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
                                student.name.charAt(0).toUpperCase()
                            }
                        </div>
                        <div class="student-info">
                            <h3>${student.name}</h3>
                            <p><strong>Roll:</strong> ${student.rollNumber}</p>
                            <p><strong>Dept:</strong> ${student.department}</p>
                            <p><strong>Class:</strong> ${student.class}</p>
                            <p><strong>Attendance:</strong> <span class="${attendanceRate >= 75 ? 'text-success' : attendanceRate >= 60 ? 'text-warning' : 'text-danger'}">${attendanceRate}%</span></p>
                        </div>
                    </div>
                    <div class="student-actions">
                        <button class="btn btn-small btn-primary" onclick="attendanceSystem.viewStudent(${student.id})">
                            👁️ View Profile
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Settings Methods
    loadSettings() {
        document.getElementById('attendance-threshold').value = this.settings.attendanceThreshold;
        document.getElementById('late-threshold').value = this.settings.lateThreshold;
        document.getElementById('auto-mark-absent').value = this.settings.autoMarkAbsent;
        document.getElementById('recognition-model').value = this.settings.recognitionModel;
        document.getElementById('confidence-threshold').value = this.settings.confidenceThreshold;
        document.getElementById('confidence-display').textContent = this.settings.confidenceThreshold + '%';
        document.getElementById('multiple-faces').checked = this.settings.multipleFaces;
        document.getElementById('email-notifications').checked = this.settings.emailNotifications;
        document.getElementById('sound-notifications').checked = this.settings.soundNotifications;
        document.getElementById('low-attendance-alerts').checked = this.settings.lowAttendanceAlerts;
        document.getElementById('backup-frequency').value = this.settings.backupFrequency;
    }

    saveSettings() {
        this.settings = {
            attendanceThreshold: parseInt(document.getElementById('attendance-threshold').value),
            lateThreshold: parseInt(document.getElementById('late-threshold').value),
            autoMarkAbsent: parseInt(document.getElementById('auto-mark-absent').value),
            recognitionModel: document.getElementById('recognition-model').value,
            confidenceThreshold: parseInt(document.getElementById('confidence-threshold').value),
            multipleFaces: document.getElementById('multiple-faces').checked,
            emailNotifications: document.getElementById('email-notifications').checked,
            soundNotifications: document.getElementById('sound-notifications').checked,
            lowAttendanceAlerts: document.getElementById('low-attendance-alerts').checked,
            backupFrequency: document.getElementById('backup-frequency').value
        };

        this.soundEnabled = this.settings.soundNotifications;
        this.saveData();
        this.showMessage('✅ Settings saved successfully!', 'success');
        this.addToLiveFeed('⚙️ System settings updated', 'system');
    }

    resetSettings() {
        if (confirm('Reset all settings to default values?')) {
            this.settings = this.getDefaultSettings();
            this.loadSettings();
            this.saveData();
            this.showMessage('🔄 Settings reset to default values', 'info');
            this.addToLiveFeed('🔄 Settings reset to defaults', 'system');
        }
    }

    // Data Management Methods
    saveData() {
        localStorage.setItem('rtas_students', JSON.stringify(this.students));
        localStorage.setItem('rtas_faculty', JSON.stringify(this.faculty));
        localStorage.setItem('rtas_attendance', JSON.stringify(this.attendance));
        localStorage.setItem('rtas_classes', JSON.stringify(this.classes));
        localStorage.setItem('rtas_settings', JSON.stringify(this.settings));
    }

    backupData() {
        const backup = {
            students: this.students,
            faculty: this.faculty,
            attendance: this.attendance,
            classes: this.classes,
            settings: this.settings,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        this.downloadFile(backup, `attendance_backup_${new Date().toISOString().split('T')[0]}.json`, 'json');
        this.showMessage('💾 Complete backup created successfully!', 'success');
        this.addToLiveFeed('💾 Data backup created', 'system');
    }

    restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const backup = JSON.parse(e.target.result);
                        
                        if (backup.students && backup.faculty && backup.attendance) {
                            if (confirm('This will replace all current data. Are you sure you want to continue?')) {
                                this.students = backup.students || [];
                                this.faculty = backup.faculty || [];
                                this.attendance = backup.attendance || [];
                                this.classes = backup.classes || [];
                                this.settings = backup.settings || this.getDefaultSettings();
                                
                                this.saveData();
                                this.showMessage('📥 Data restored successfully!', 'success');
                                this.addToLiveFeed('📥 Data restored from backup', 'system');
                                this.loadPageData(this.currentPage);
                                this.updateFilters();
                            }
                        } else {
                            this.showMessage('❌ Invalid backup file format', 'error');
                        }
                    } catch (error) {
                        this.showMessage('❌ Error reading backup file', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    clearAllData() {
        const confirmMessage = `⚠️ WARNING: This will permanently delete ALL data including:

• ${this.students.length} students
• ${this.faculty.length} faculty members  
• ${this.attendance.length} attendance records
• All settings

This action CANNOT be undone. Are you absolutely sure?`;

        if (confirm(confirmMessage)) {
            const secondConfirm = prompt('Type "DELETE ALL DATA" to confirm:');
            if (secondConfirm === 'DELETE ALL DATA') {
                this.students = [];
                this.faculty = [];
                this.attendance = [];
                this.classes = [];
                this.settings = this.getDefaultSettings();
                this.liveFeed = [];
                
                this.saveData();
                this.showMessage('🗑️ All data has been permanently deleted', 'warning');
                this.addToLiveFeed('🗑️ All system data cleared', 'system');
                this.loadPageData(this.currentPage);
                this.updateFilters();
            } else {
                this.showMessage('❌ Data deletion cancelled', 'info');
            }
        }
    }

    // Utility Methods
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        document.querySelectorAll('.message').forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert at the top of the current page
        const currentPageElement = document.querySelector('.page.active .container');
        if (currentPageElement) {
            currentPageElement.insertBefore(messageDiv, currentPageElement.firstChild);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    downloadFile(data, filename, type) {
        let content;
        let mimeType;

        if (type === 'csv') {
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => 
                Object.values(row).map(value => 
                    typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                ).join(',')
            );
            content = [headers, ...rows].join('\n');
            mimeType = 'text/csv';
        } else if (type === 'json') {
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toggleView(e) {
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const view = e.target.getAttribute('data-view');
        // View toggle functionality can be extended here
        this.showMessage(`📋 Switched to ${view} view`, 'info');
    }
}

// Global functions for onclick handlers
window.closeModal = function(modalId) {
    attendanceSystem.closeModal(modalId);
};

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.attendanceSystem = new RealTimeAttendanceSystem();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.attendanceSystem) {
        window.attendanceSystem.updateDashboardStats();
        window.attendanceSystem.updateLiveFeed();
    }
});

// Handle before unload
window.addEventListener('beforeunload', () => {
    if (window.attendanceSystem && window.attendanceSystem.cameraStream) {
        window.attendanceSystem.stopCamera();
    }
});
