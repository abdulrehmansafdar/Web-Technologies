// API Configuration
const API_BASE_URL = 'http://localhost:8080';

// State
let currentPage = 1;
let totalPages = 1;
let deleteEmployeeId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
    setupFormHandler();
});

// Show alert message
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
    
    // Auto remove after 5 seconds
    setTimeout(() => closeAlert(alertId), 5000);
}

function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.classList.add('animate-slide-out');
        setTimeout(() => alert.remove(), 300);
    }
}

// Show/hide loading spinner
function setLoading(isLoading) {
    const loading = document.getElementById('loading');
    const tableBody = document.getElementById('employee-table-body');
    
    if (isLoading) {
        loading.classList.remove('hidden');
        tableBody.innerHTML = '';
    } else {
        loading.classList.add('hidden');
    }
}

// Load employees
async function loadEmployees(page = 1) {
    setLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}?page=${page}&limit=10`);
        const data = await response.json();
        
        if (data.success) {
            displayEmployees(data.data);
            updatePagination(data.pagination);
            updateStatistics(data.data);
        } else {
            showAlert('Failed to load employees', 'error');
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        showAlert('Error connecting to server', 'error');
    } finally {
        setLoading(false);
    }
}

// Display employees in table
function displayEmployees(employees) {
    const tableBody = document.getElementById('employee-table-body');
    
    if (employees.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>No employees found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = employees.map(employee => `
        <tr class="hover:bg-gray-50 transition duration-150">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${employee.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-600 font-semibold">${employee.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${escapeHtml(employee.name)}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(employee.email)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${escapeHtml(employee.position)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">$${parseFloat(employee.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="openEditModal(${employee.id})" class="text-blue-600 hover:text-blue-900 mr-3" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="openDeleteModal(${employee.id})" class="text-red-600 hover:text-red-900" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Update statistics
function updateStatistics(employees) {
    const totalEmployees = employees.length;
    document.getElementById('total-employees').textContent = totalEmployees;
    
    if (totalEmployees > 0) {
        const avgSalary = employees.reduce((sum, emp) => sum + parseFloat(emp.salary), 0) / totalEmployees;
        document.getElementById('avg-salary').textContent = `$${avgSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        const uniquePositions = new Set(employees.map(emp => emp.position));
        document.getElementById('total-positions').textContent = uniquePositions.size;
    }
}

// Update pagination
function updatePagination(pagination) {
    currentPage = pagination.page;
    totalPages = pagination.pages;
    
    document.getElementById('showing-from').textContent = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    document.getElementById('showing-to').textContent = Math.min(pagination.page * pagination.limit, pagination.total);
    document.getElementById('showing-total').textContent = pagination.total;
    
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.className = `px-3 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`;
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadEmployees(currentPage - 1);
    paginationContainer.appendChild(prevBtn);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = `px-4 py-2 rounded-lg ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`;
            pageBtn.onclick = () => loadEmployees(i);
            paginationContainer.appendChild(pageBtn);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'px-2 py-2 text-gray-500';
            paginationContainer.appendChild(dots);
        }
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.className = `px-3 py-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => loadEmployees(currentPage + 1);
    paginationContainer.appendChild(nextBtn);
}

// Open add modal
function openAddModal() {
    document.getElementById('modal-title').textContent = 'Add Employee';
    document.getElementById('submit-btn-text').textContent = 'Add Employee';
    document.getElementById('employee-form').reset();
    document.getElementById('employee-id').value = '';
    document.getElementById('employee-modal').classList.remove('hidden');
}

// Open edit modal
async function openEditModal(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const employee = data.data;
            document.getElementById('modal-title').textContent = 'Edit Employee';
            document.getElementById('submit-btn-text').textContent = 'Update Employee';
            document.getElementById('employee-id').value = employee.id;
            document.getElementById('name').value = employee.name;
            document.getElementById('email').value = employee.email;
            document.getElementById('position').value = employee.position;
            document.getElementById('salary').value = employee.salary;
            document.getElementById('employee-modal').classList.remove('hidden');
        } else {
            showAlert('Failed to load employee details', 'error');
        }
    } catch (error) {
        console.error('Error loading employee:', error);
        showAlert('Error connecting to server', 'error');
    }
}

// Close modal
function closeModal() {
    document.getElementById('employee-modal').classList.add('hidden');
    document.getElementById('employee-form').reset();
}

// Setup form handler
function setupFormHandler() {
    document.getElementById('employee-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('employee-id').value;
        const employeeData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            position: document.getElementById('position').value,
            salary: parseFloat(document.getElementById('salary').value)
        };
        
        try {
            let response;
            if (id) {
                // Update existing employee
                response = await fetch(`${API_BASE_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(employeeData)
                });
            } else {
                // Create new employee
                response = await fetch(`${API_BASE_URL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(employeeData)
                });
            }
            
            const data = await response.json();
            
            if (data.success) {
                showAlert(data.message, 'success');
                closeModal();
                loadEmployees(currentPage);
            } else {
                showAlert(data.error || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            showAlert('Error connecting to server', 'error');
        }
    });
}

// Open delete modal
function openDeleteModal(id) {
    deleteEmployeeId = id;
    document.getElementById('delete-modal').classList.remove('hidden');
    
    // Setup delete confirmation
    document.getElementById('confirm-delete-btn').onclick = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/${deleteEmployeeId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert(data.message, 'success');
                closeDeleteModal();
                loadEmployees(currentPage);
            } else {
                showAlert(data.error || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            showAlert('Error connecting to server', 'error');
        }
    };
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    deleteEmployeeId = null;
}

// Escape HTML to prevent XSS
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

// Add custom animations
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
