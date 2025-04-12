// Authentication functions
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('token', data.token);
            window.location.href = data.redirectUrl || '/';
        } else {
            alert(data.message || 'Login failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Login failed. Please try again.');
    });
}

function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());
    
    fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Registration successful! Please login.');
            window.location.href = '/login.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Registration failed. Please try again.');
    });
}

function logout() {
    localStorage.removeItem('token');
    fetch('/api/auth/logout', {
        method: 'POST',
    })
    .then(() => {
        window.location.href = '/';
    })
    .catch(error => {
        console.error('Error:', error);
    });
}