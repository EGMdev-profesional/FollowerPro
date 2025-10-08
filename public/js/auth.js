// Estado de autenticación
let authState = {
    isLoading: false,
    currentForm: null
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Detectar qué formulario estamos usando
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        authState.currentForm = 'login';
        setupLoginForm();
    }
    
    if (registerForm) {
        authState.currentForm = 'register';
        setupRegisterForm();
    }
    
    // Verificar si ya está logueado
    checkAuthStatus();
}

// Configurar formulario de login
function setupLoginForm() {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    form.addEventListener('submit', handleLogin);
    
    // Auto-completar credenciales de demo si se hace clic
    const demoCredentials = document.querySelector('.demo-item');
    if (demoCredentials) {
        demoCredentials.addEventListener('click', () => {
            emailInput.value = 'admin@panelsmm.com';
            passwordInput.value = 'Admin123!';
            showToast('Credenciales de demo cargadas', 'info');
        });
    }
}

// Configurar formulario de registro
function setupRegisterForm() {
    const form = document.getElementById('register-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    form.addEventListener('submit', handleRegister);
    
    // Validación de contraseña en tiempo real
    passwordInput.addEventListener('input', checkPasswordStrength);
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
}

// Manejar login
async function handleLogin(event) {
    event.preventDefault();
    
    if (authState.isLoading) return;
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember');
    
    // Validaciones básicas
    if (!email || !password) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast('Por favor ingresa un email válido', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, remember: !!remember })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('¡Bienvenido a FollowerPro!', 'success');
            
            // Redirigir al dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
            
        } else {
            showToast(data.message || 'Error al iniciar sesión', 'error');
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showToast('Error de conexión. Inténtalo de nuevo.', 'error');
    } finally {
        setLoading(false);
    }
}

// Manejar registro
async function handleRegister(event) {
    event.preventDefault();
    
    if (authState.isLoading) return;
    
    const formData = new FormData(event.target);
    const userData = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirm-password'),
        telefono: formData.get('telefono'),
        pais: formData.get('pais'),
        terms: formData.get('terms')
    };
    
    // Validaciones
    const validation = validateRegistration(userData);
    if (!validation.isValid) {
        showToast(validation.message, 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('¡Cuenta creada exitosamente!', 'success');
            
            // Redirigir al login después de un momento
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            
        } else {
            showToast(data.message || 'Error al crear la cuenta', 'error');
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        showToast('Error de conexión. Inténtalo de nuevo.', 'error');
    } finally {
        setLoading(false);
    }
}

// Validar datos de registro
function validateRegistration(data) {
    if (!data.nombre || data.nombre.length < 2) {
        return { isValid: false, message: 'El nombre debe tener al menos 2 caracteres' };
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        return { isValid: false, message: 'Por favor ingresa un email válido' };
    }
    
    if (!data.password || data.password.length < 6) {
        return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
    }
    
    if (data.password !== data.confirmPassword) {
        return { isValid: false, message: 'Las contraseñas no coinciden' };
    }
    
    if (!data.terms) {
        return { isValid: false, message: 'Debes aceptar los términos y condiciones' };
    }
    
    return { isValid: true };
}

// Verificar fuerza de contraseña
function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthIndicator = document.getElementById('password-strength');
    
    if (!strengthIndicator) return;
    
    let strength = 0;
    let strengthText = '';
    
    // Criterios de fuerza
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    // Aplicar clases según la fuerza
    strengthIndicator.className = 'password-strength';
    
    if (password.length === 0) {
        strengthIndicator.className += '';
    } else if (strength <= 2) {
        strengthIndicator.className += ' weak';
    } else if (strength <= 3) {
        strengthIndicator.className += ' medium';
    } else {
        strengthIndicator.className += ' strong';
    }
}

// Verificar coincidencia de contraseñas
function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const confirmInput = document.getElementById('confirm-password');
    
    if (confirmPassword.length > 0) {
        if (password === confirmPassword) {
            confirmInput.style.borderColor = 'var(--success-color)';
        } else {
            confirmInput.style.borderColor = 'var(--error-color)';
        }
    } else {
        confirmInput.style.borderColor = 'var(--border-color)';
    }
}

// Toggle password visibility
function togglePassword(inputId = 'password') {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Verificar estado de autenticación
async function checkAuthStatus() {
    // El servidor ya maneja las redirecciones con sesiones
    // No necesitamos verificar JWT aquí
    // Si el usuario ya está logueado, el servidor lo redirigirá automáticamente
}

// Utilidades
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function setLoading(loading) {
    authState.isLoading = loading;
    const overlay = document.getElementById('loading-overlay');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (loading) {
        overlay.classList.add('show');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }
    } else {
        overlay.classList.remove('show');
        if (submitBtn) {
            submitBtn.disabled = false;
            if (authState.currentForm === 'login') {
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            } else {
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Crear Cuenta';
            }
        }
    }
}

// Sistema de notificaciones toast
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Mostrar toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Ocultar y remover toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    return icons[type] || icons.info;
}
