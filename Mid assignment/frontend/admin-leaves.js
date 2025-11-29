// API Configuration
const API_BASE_URL = 'http://localhost:8080';

// State
let currentFilter = 'pending';
let currentLeaveId = null;
let currentAction = null;
let allLeaves = [];

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
        loadLeaves();
        
        // Auto-refresh every 30 seconds
        setInterval(loadLeaves, 30000);
    }
});

// Load leave requests
async function loadLeaves() {
    const token = localStorage.getItem('authToken');
    
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const container = document.getElementById('leaves-container');
    
    // Show loading
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    container.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/leaves`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load leaves');
        }
        
        const data = await response.json();
        allLeaves = data.data || [];
        
        loadingState.classList.add('hidden');
        
        if (allLeaves.length === 0) {
            emptyState.classList.remove('hidden');
            updateStats(0, 0, 0, 0);
            return;
        }
        
        displayLeaves();
        
    } catch (error) {
        console.error('Error loading leaves:', error);
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }
}

// Display leave requests
function displayLeaves() {
    const container = document.getElementById('leaves-container');
    container.innerHTML = '';
    
    // Filter leaves based on current filter
    let filteredLeaves = allLeaves;
    if (currentFilter !== 'all') {
        filteredLeaves = allLeaves.filter(leave => leave.status === currentFilter);
    }
    
    if (filteredLeaves.length === 0) {
        document.getElementById('empty-state').classList.remove('hidden');
    } else {
        document.getElementById('empty-state').classList.add('hidden');
    }
    
    filteredLeaves.forEach(leave => {
        const card = createLeaveCard(leave);
        container.appendChild(card);
    });
    
    // Update statistics
    const pending = allLeaves.filter(l => l.status === 'pending').length;
    const approved = allLeaves.filter(l => l.status === 'approved').length;
    const rejected = allLeaves.filter(l => l.status === 'rejected').length;
    updateStats(allLeaves.length, pending, approved, rejected);
}

// Create leave card
function createLeaveCard(leave) {
    const card = document.createElement('div');
    card.className = 'px-6 py-4 hover:bg-gray-50 transition';
    
    const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
    };
    
    const typeIcons = {
        'sick': 'fa-thermometer',
        'casual': 'fa-coffee',
        'annual': 'fa-umbrella-beach',
        'other': 'fa-question-circle'
    };
    
    const actionButtons = leave.status === 'pending' ? `
        <button onclick="openApprovalModal(${leave.id}, 'approve')" 
            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center">
            <i class="fas fa-check mr-2"></i>Approve
        </button>
        <button onclick="openApprovalModal(${leave.id}, 'reject')" 
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center">
            <i class="fas fa-times mr-2"></i>Reject
        </button>
    ` : '';
    
    const approvalInfo = leave.status !== 'pending' && leave.approved_by ? `
        <div class="mt-3 pt-3 border-t border-gray-200">
            <p class="text-sm text-gray-600">
                <strong>Reviewed by:</strong> ${escapeHtml(leave.approved_by)} on ${formatDate(leave.reviewed_at)}
            </p>
            ${leave.admin_notes ? `<p class="text-sm text-gray-600 mt-1"><strong>Notes:</strong> ${escapeHtml(leave.admin_notes)}</p>` : ''}
        </div>
    ` : '';
    
    card.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                    <div class="h-12 w-12 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-600 font-semibold text-lg">${getInitials(leave.employee_name)}</span>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">${escapeHtml(leave.employee_name)}</h4>
                        <p class="text-sm text-gray-500">${escapeHtml(leave.employee_position)}</p>
                    </div>
                </div>
                
                <div class="ml-15 space-y-2">
                    <div class="flex items-center space-x-6">
                        <div class="flex items-center">
                            <i class="fas ${typeIcons[leave.type]} text-gray-500 mr-2"></i>
                            <span class="text-sm font-semibold text-gray-700 capitalize">${leave.type} Leave</span>
                        </div>
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[leave.status]}">
                            ${leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                    </div>
                    
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-calendar text-gray-500 mr-2"></i>
                        <span><strong>From:</strong> ${formatDate(leave.start_date)} <strong class="ml-4">To:</strong> ${formatDate(leave.end_date)}</span>
                    </div>
                    
                    ${leave.reason ? `
                        <div class="flex items-start text-sm text-gray-600">
                            <i class="fas fa-comment text-gray-500 mr-2 mt-1"></i>
                            <span><strong>Reason:</strong> ${escapeHtml(leave.reason)}</span>
                        </div>
                    ` : ''}
                    
                    <div class="text-xs text-gray-500">
                        <i class="fas fa-clock mr-1"></i>Requested on ${formatDate(leave.created_at)}
                    </div>
                    
                    ${approvalInfo}
                </div>
            </div>
            
            ${actionButtons ? `
                <div class="flex space-x-2 ml-4">
                    ${actionButtons}
                </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Filter leaves
function filterLeaves(status) {
    currentFilter = status;
    
    // Update tab styling
    ['pending', 'approved', 'rejected', 'all'].forEach(tab => {
        const button = document.getElementById(`tab-${tab}`);
        if (tab === status) {
            button.className = 'px-6 py-2 rounded-lg font-semibold transition bg-yellow-500 text-white';
            if (status === 'approved') button.className = 'px-6 py-2 rounded-lg font-semibold transition bg-green-500 text-white';
            if (status === 'rejected') button.className = 'px-6 py-2 rounded-lg font-semibold transition bg-red-500 text-white';
            if (status === 'all') button.className = 'px-6 py-2 rounded-lg font-semibold transition bg-blue-500 text-white';
        } else {
            button.className = 'px-6 py-2 rounded-lg font-semibold transition bg-gray-200 text-gray-700 hover:bg-gray-300';
        }
    });
    
    displayLeaves();
}

// Open approval modal
function openApprovalModal(leaveId, action) {
    currentLeaveId = leaveId;
    currentAction = action;
    
    const modal = document.getElementById('approval-modal');
    const modalTitle = document.getElementById('modal-title');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const notesField = document.getElementById('admin-notes');
    
    notesField.value = '';
    
    if (action === 'approve') {
        modalTitle.textContent = 'Approve Leave Request';
        confirmBtn.textContent = 'Approve';
        confirmBtn.className = 'px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition';
    } else {
        modalTitle.textContent = 'Reject Leave Request';
        confirmBtn.textContent = 'Reject';
        confirmBtn.className = 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition';
    }
    
    modal.classList.remove('hidden');
}

// Close approval modal
function closeApprovalModal() {
    document.getElementById('approval-modal').classList.add('hidden');
    currentLeaveId = null;
    currentAction = null;
}

// Confirm action
async function confirmAction() {
    if (!currentLeaveId || !currentAction) return;
    
    const token = localStorage.getItem('authToken');
    const adminNotes = document.getElementById('admin-notes').value.trim();
    
    try {
        const response = await fetch(`${API_BASE_URL}/leaves/${currentAction}/${currentLeaveId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                admin_notes: adminNotes || null
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to ${currentAction} leave`);
        }
        
        closeApprovalModal();
        showAlert(`Leave request ${currentAction}d successfully`, 'success');
        loadLeaves();
        
    } catch (error) {
        console.error(`Error ${currentAction}ing leave:`, error);
        showAlert(`Failed to ${currentAction} leave request`, 'error');
    }
}

// Update statistics
function updateStats(total, pending, approved, rejected) {
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-approved').textContent = approved;
    document.getElementById('stat-rejected').textContent = rejected;
}

// Show alert
function showAlert(message, type = 'success') {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'fixed top-4 right-4 z-50';
    
    const alertColors = {
        success: 'bg-green-500',
        error: 'bg-red-500'
    };
    
    alertContainer.innerHTML = `
        <div class="${alertColors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-xl"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(alertContainer);
    
    setTimeout(() => {
        alertContainer.remove();
    }, 3000);
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    });
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
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
