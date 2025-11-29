// API Configuration
const API_BASE_URL = 'http://localhost:8080';

// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'admin') {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.clear();
            window.location.href = 'login.html';
            return false;
        }
        
        const data = await response.json();
        if (data.user) {
            document.getElementById('admin-name').textContent = `Welcome, ${data.user.username}`;
        }
        
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.clear();
        window.location.href = 'login.html';
        return false;
    }
}

// Logout function
function logout() {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(error => console.error('Logout error:', error));
    }
    
    localStorage.clear();
    window.location.href = 'login.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (await checkAuth()) {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('filterDate').value = today;
        
        loadAttendance();
        
        // Auto-refresh every 30 seconds
        setInterval(loadAttendance, 30000);
    }
});

// Load attendance data
async function loadAttendance() {
    const token = localStorage.getItem('authToken');
    const filterDate = document.getElementById('filterDate').value;
    
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const tableBody = document.getElementById('attendance-table-body');
    
    // Show loading
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    tableBody.innerHTML = '';
    
    try {
        const url = filterDate 
            ? `${API_BASE_URL}/attendance/today?date=${filterDate}`
            : `${API_BASE_URL}/attendance/today`;
            
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load attendance');
        }
        
        const data = await response.json();
        loadingState.classList.add('hidden');
        
        if (!data.data || data.data.length === 0) {
            emptyState.classList.remove('hidden');
            updateStats(0, 0, 0, 0);
            return;
        }
        
        displayAttendance(data.data);
        
    } catch (error) {
        console.error('Error loading attendance:', error);
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }
}

// Display attendance records
function displayAttendance(records) {
    const tableBody = document.getElementById('attendance-table-body');
    tableBody.innerHTML = '';
    
    let checkedInCount = 0;
    let checkedOutCount = 0;
    let absentCount = 0;
    
    records.forEach(record => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition';
        
        let status = 'Checked In';
        let statusClass = 'status-checked-in';
        let checkIn = formatTime(record.check_in);
        let checkOut = '-';
        let duration = '-';
        
        if (record.check_out) {
            checkOut = formatTime(record.check_out);
            duration = formatDuration(record.work_duration);
            status = 'Checked Out';
            statusClass = 'status-checked-out';
            checkedOutCount++;
        } else {
            status = 'Checked In';
            statusClass = 'status-checked-in';
            checkedInCount++;
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-600 font-semibold">${getInitials(record.employee_name)}</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${escapeHtml(record.employee_name)}</div>
                        <div class="text-sm text-gray-500">${escapeHtml(record.position)}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${checkIn}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${checkOut}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                ${duration}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${status}
                </span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    updateStats(records.length, checkedInCount, checkedOutCount, absentCount);
}

// Update statistics
function updateStats(total, checkedIn, checkedOut, absent) {
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-checked-in').textContent = checkedIn;
    document.getElementById('stat-checked-out').textContent = checkedOut;
    document.getElementById('stat-absent').textContent = absent;
}

// Filter by date
function filterByDate() {
    const dateInput = document.getElementById('filterDate');
    if (!dateInput.value) {
        alert('Please select a date');
        return;
    }
    loadAttendance();
}

// Reset filter
function resetFilter() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterDate').value = today;
    loadAttendance();
}

// Utility functions
function formatTime(timeString) {
    if (!timeString) return '-';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

function formatDuration(minutes) {
    if (!minutes || minutes === 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
