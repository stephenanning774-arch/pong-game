// Theme Management
const THEME_KEY = 'charity_theme';

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.documentElement.style.colorScheme = 'dark';
        updateThemeIcon('sun');
    } else {
        document.body.classList.remove('dark-mode');
        document.documentElement.style.colorScheme = 'light';
        updateThemeIcon('moon');
    }
    localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem(THEME_KEY) || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

function updateThemeIcon(icon) {
    const btn = document.getElementById('themeToggle');
    if (btn) {
        if (icon === 'sun') {
            btn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            btn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
}

// Initialize theme on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}