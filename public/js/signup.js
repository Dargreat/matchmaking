document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const successMessage = document.getElementById('successMessage');
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Basic client-side validation
        let isValid = true;
        
        if (!name) {
            document.getElementById('nameError').textContent = 'Name is required';
            document.getElementById('nameError').style.display = 'block';
            isValid = false;
        }
        
        if (!email) {
            document.getElementById('emailError').textContent = 'Email is required';
            document.getElementById('emailError').style.display = 'block';
            isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            document.getElementById('emailError').textContent = 'Please enter a valid email';
            document.getElementById('emailError').style.display = 'block';
            isValid = false;
        }
        
        if (!password) {
            document.getElementById('passwordError').textContent = 'Password is required';
            document.getElementById('passwordError').style.display = 'block';
            isValid = false;
        } else if (password.length < 6) {
            document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
            document.getElementById('passwordError').style.display = 'block';
            isValid = false;
        }
        
        if (!isValid) return;
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Handle errors from server
                if (data.message === 'User already exists') {
                    document.getElementById('emailError').textContent = data.message;
                    document.getElementById('emailError').style.display = 'block';
                } else {
                    throw new Error(data.message || 'Registration failed');
                }
                return;
            }
            
            // Registration successful
            signupForm.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Save token to localStorage and redirect
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            document.getElementById('emailError').textContent = error.message;
            document.getElementById('emailError').style.display = 'block';
        }
    });
});