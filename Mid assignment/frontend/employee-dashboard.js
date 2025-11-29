// API Configuration
const API_BASE_URL = 'http://localhost:8080';
let user = null;
let token = null;
let currentAttendance = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAttendanceStatus();
    loadLeaves();
    loadAttendanceHistory();
    setupLeaveForm();
    
    // Set minimum date for leave to today
    document.getElementById('leave_date').min = new Date().toISOString().split('T')[0];
});

// Check authentication
async function checkAuth() {
    token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const employeeId = localStorage.getItem('employeeId');
    
    if (!token || !userRole) {
        window.location.href = 'login.html';
        return;
    }
    
    user = {
        role: userRole,
        username: userName,
        employee_id: employeeId
    };
    
    if (userRole !== 'employee') {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('user-name').textContent = userName || 'Employee';
    
    // Verify token
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Invalid token');
        }
    } catch (error) {
        console.error('Auth error:', error);
        logout();
    }
}

// Logout
function logout() {
    fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).finally(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
}

// Show alert
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alert-container');
    const alertId = `alert-${Date.now()}`;
    
    const alertColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const alert = document.createElement('div');
    alert.id = alertId;
    alert.className = `${alertColors[type]} text-white px-6 py-4 rounded-lg shadow-lg mb-4 flex items-center justify-between min-w-[300px] animate-slide-in`;
    alert.innerHTML = `
        <span>${message}</span>
        <button onclick="closeAlert('${alertId}')" class="ml-4 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    alertContainer.appendChild(alert);
    setTimeout(() => closeAlert(alertId), 5000);
}

function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.classList.add('animate-slide-out');
        setTimeout(() => alert.remove(), 300);
    }
}

// Load attendance status
async function loadAttendanceStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentAttendance = data.data;
            displayAttendanceStatus(currentAttendance);
            updateTodaySummary(currentAttendance);
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
        document.getElementById('attendance-status').innerHTML = '<p class="text-red-500">Error loading attendance</p>';
    }
}

// Display attendance status
function displayAttendanceStatus(attendance) {
    const statusDiv = document.getElementById('attendance-status');
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (!attendance || attendance.check_out) {
        // Can check in
        statusDiv.innerHTML = `
            <div>
                <div class="mb-4">
                    <i class="fas fa-clock text-gray-400 text-5xl mb-3"></i>
                    <p class="text-gray-600 text-lg">Not checked in today</p>
                </div>
                <button onclick="checkIn()" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg transition text-lg">
                    <i class="fas fa-sign-in-alt mr-2"></i>Check In
                </button>
            </div>
        `;
    } else if (attendance && !attendance.check_out) {
        // Can check out
        const checkInTime = new Date(attendance.check_in);
        const duration = calculateDuration(checkInTime, now);
        
        statusDiv.innerHTML = `
            <div>
                <div class="mb-4">
                    <div class="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold mb-3">
                        <i class="fas fa-check-circle mr-2"></i>Checked In
                    </div>
                    <p class="text-gray-600 text-sm mb-2">Check-in Time</p>
                    <p class="text-2xl font-bold text-gray-800 mb-4">${formatTime(checkInTime)}</p>
                    <p class="text-gray-500 text-sm">Duration: ${duration}</p>
                </div>
                <button onclick="checkOut()" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition text-lg">
                    <i class="fas fa-sign-out-alt mr-2"></i>Check Out
                </button>
            </div>
        `;
    }
}

// Update today's summary
function updateTodaySummary(attendance) {
    const summaryDiv = document.getElementById('today-summary');
    const now = new Date();
    
    if (!attendance) {
        summaryDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-gray-600">Status:</span>
                <span class="text-red-600 font-semibold">Not Checked In</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-gray-600">Date:</span>
                <span class="font-semibold">${formatDate(now)}</span>
            </div>
        `;
    } else if (attendance.check_out) {
        const duration = Math.floor(attendance.work_duration / 60);
        const minutes = attendance.work_duration % 60;
        
        summaryDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-gray-600">Status:</span>
                <span class="text-blue-600 font-semibold">Completed</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-gray-600">Date:</span>
                <span class="font-semibold">${formatDate(new Date(attendance.date))}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-gray-600">Check In:</span>
                <span class="font-semibold">${formatTime(new Date(attendance.check_in))}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-gray-600">Check Out:</span>
                <span class="font-semibold">${formatTime(new Date(attendance.check_out))}</span>
            </div>
            <div class="flex items-center justify-between border-t pt-2 mt-2">
                <span class="text-gray-600">Total Duration:</span>
                <span class="font-bold text-green-600">${duration}h ${minutes}m</span>
            </div>
        `;
    } else {
        const checkInTime = new Date(attendance.check_in);
        const duration = calculateDuration(checkInTime, now);
        
        summaryDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-gray-600">Status:</span>
                <span class="text-green-600 font-semibold">Checked In</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-gray-600">Date:</span>
                <span class="font-semibold">${formatDate(new Date(attendance.date))}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-gray-600">Check In:</span>
                <span class="font-semibold">${formatTime(checkInTime)}</span>
            </div>
            <div class="flex items-center justify-between border-t pt-2 mt-2">
                <span class="text-gray-600">Current Duration:</span>
                <span class="font-bold text-blue-600">${duration}</span>
            </div>
        `;
        
        // Update duration every minute
        setInterval(() => {
            if (currentAttendance && !currentAttendance.check_out) {
                const newDuration = calculateDuration(new Date(currentAttendance.check_in), new Date());
                const durationElement = summaryDiv.querySelector('.text-blue-600');
                if (durationElement) {
                    durationElement.textContent = newDuration;
                }
            }
        }, 60000);
    }
}

// Check in
async function checkIn() {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/check-in`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Checked in successfully!', 'success');
            loadAttendanceStatus();
            loadAttendanceHistory();
        } else {
            showAlert(data.error || 'Check-in failed', 'error');
        }
    } catch (error) {
        console.error('Check-in error:', error);
        showAlert('Error connecting to server', 'error');
    }
}

// Check out
async function checkOut() {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/check-out`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Checked out successfully!', 'success');
            loadAttendanceStatus();
            loadAttendanceHistory();
        } else {
            showAlert(data.error || 'Check-out failed', 'error');
        }
    } catch (error) {
        console.error('Check-out error:', error);
        showAlert('Error connecting to server', 'error');
    }
}

// Load leaves
async function loadLeaves() {
    const status = document.getElementById('leave-filter').value;
    const url = `${API_BASE_URL}/leaves${status ? '?status=' + status : ''}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayLeaves(data.data);
        }
    } catch (error) {
        console.error('Error loading leaves:', error);
        document.getElementById('leaves-table-body').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-red-500">Error loading leaves</td>
            </tr>
        `;
    }
}

// Display leaves
function displayLeaves(leaves) {
    const tbody = document.getElementById('leaves-table-body');
    
    if (leaves.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">No leave requests found</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = leaves.map(leave => {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(new Date(leave.leave_date))}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${leave.leave_type}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${escapeHtml(leave.reason)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColors[leave.status]}">
                        ${leave.status.toUpperCase()}
                    </span>
                    ${leave.admin_notes ? `<p class="text-xs text-gray-500 mt-1">${escapeHtml(leave.admin_notes)}</p>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    ${leave.status === 'pending' ? `
                        <button onclick="deleteLeave(${leave.id})" class="text-red-600 hover:text-red-900" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

// Load attendance history
async function loadAttendanceHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/history?limit=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayAttendanceHistory(data.data);
        }
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('history-table-body').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-red-500">Error loading history</td>
            </tr>
        `;
    }
}

// Display attendance history
function displayAttendanceHistory(history) {
    const tbody = document.getElementById('history-table-body');
    
    if (history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">No attendance records found</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = history.map(record => {
        const duration = record.work_duration 
            ? `${Math.floor(record.work_duration / 60)}h ${record.work_duration % 60}m`
            : '-';
        
        const statusColors = {
            'checked_in': 'bg-green-100 text-green-800',
            'checked_out': 'bg-blue-100 text-blue-800',
            'present': 'bg-gray-100 text-gray-800'
        };
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${formatDate(new Date(record.date))}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatTime(new Date(record.check_in))}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${record.check_out ? formatTime(new Date(record.check_out)) : '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${duration}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColors[record.status]}">
                        ${record.status.replace('_', ' ').toUpperCase()}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Leave modal functions
function openLeaveModal() {
    document.getElementById('leave-modal').classList.remove('hidden');
}

function closeLeaveModal() {
    document.getElementById('leave-modal').classList.add('hidden');
    document.getElementById('leave-form').reset();
}

// Setup leave form
function setupLeaveForm() {
    document.getElementById('leave-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const leaveData = {
            leave_date: document.getElementById('leave_date').value,
            leave_type: document.getElementById('leave_type').value,
            reason: document.getElementById('reason').value
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/leaves`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(leaveData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('Leave request submitted successfully', 'success');
                closeLeaveModal();
                loadLeaves();
            } else {
                showAlert(data.error || 'Failed to submit leave request', 'error');
            }
        } catch (error) {
            console.error('Leave request error:', error);
            showAlert('Error connecting to server', 'error');
        }
    });
}

// Delete leave
async function deleteLeave(id) {
    if (!confirm('Are you sure you want to delete this leave request?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/leaves/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Leave request deleted', 'success');
            loadLeaves();
        } else {
            showAlert(data.error || 'Failed to delete leave', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('Error connecting to server', 'error');
    }
}

// Utility functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function calculateDuration(start, end) {
    const diff = end - start;
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    return `${hours}h ${minutes}m`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slide-out {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }
    
    .animate-slide-out {
        animation: slide-out 0.3s ease-in;
    }
`;
document.head.appendChild(style);
