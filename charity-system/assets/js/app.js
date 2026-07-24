// Utility Functions
function currency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toastId = 'toast_' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${type}">
                <i class="fas fa-check-circle me-2"></i>
                <strong class="me-auto">Notification</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    setTimeout(() => {
        toastElement.classList.remove('show');
        setTimeout(() => toastElement.remove(), 300);
    }, 3000);
}

function logout() {
    clearCurrentUser();
    window.location.href = 'index.html';
}

function updateUserNav() {
    const user = getCurrentUser();
    const userMenu = document.getElementById('userMenu');
    const userNav = document.getElementById('userNav');

    if (user && userMenu) {
        userMenu.textContent = `${user.name}`;
        if (userNav) {
            userNav.style.display = 'block';
        }
    }
}

function requireLogin() {
    if (!isLoggedIn()) {
        showToast('Please login first', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return false;
    }
    return true;
}

function requireAdmin() {
    const adminToken = sessionStorage.getItem('admin_token');
    if (!adminToken) {
        showToast('Admin access required', 'danger');
        setTimeout(() => {
            window.location.href = 'admin/admin-login.html';
        }, 1000);
        return false;
    }
    return true;
}

// Initialize on every page load
document.addEventListener('DOMContentLoaded', function() {
    updateUserNav();
    initTheme();
});