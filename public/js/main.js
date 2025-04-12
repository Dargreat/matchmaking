// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile menu
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuButton && navLinks) {
        mobileMenuButton.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuButton.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }

    // Initialize FAQ accordion
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const answer = question.nextElementSibling;
            const icon = question.querySelector('i');

            // Toggle active class
            faqItem.classList.toggle('active');

            // Close other FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                if(item !== faqItem) {
                    item.classList.remove('active');
                    item.querySelector('.faq-answer').style.maxHeight = '0';
                    item.querySelector('i').style.transform = 'rotate(0deg)';
                }
            });

            // Toggle answer
            if(faqItem.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                icon.style.transform = 'rotate(180deg)';
            } else {
                answer.style.maxHeight = '0';
                icon.style.transform = 'rotate(0deg)';
            }
        });
    });

    // Initialize floating hearts animation
    createFloatingHearts();
});

function createFloatingHearts() {
    const container = document.getElementById('floatingElements');
    if (!container) return;
    
    const heartCount = 15;
    
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerHTML = '<i class="fas fa-heart"></i>';
        
        // Random position
        heart.style.left = Math.random() * 100 + '%';
        heart.style.top = Math.random() * 100 + '%';
        
        // Random delay
        heart.style.animationDelay = Math.random() * 5 + 's';
        
        // Random size
        const size = Math.random() * 1 + 0.5;
        heart.style.transform = `scale(${size})`;
        
        container.appendChild(heart);
    }
}

// Stats counter animation
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (!statNumbers.length) return;
    
    const targets = [10500, 95, 24];
    const durations = [2000, 1500, 1000];
    
    statNumbers.forEach((stat, index) => {
        const target = targets[index];
        const duration = durations[index];
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                current = target;
            }
            stat.textContent = index === 2 ? 
                Math.floor(current) + '/7' : 
                Math.floor(current) + (index === 0 ? '+' : '%');
        }, 16);
    });
}

// Initialize animations when page loads
window.addEventListener('load', () => {
    animateStats();
});

// Handle newsletter subscription
document.querySelector('.newsletter-button')?.addEventListener('click', function(e) {
    e.preventDefault();
    const email = document.querySelector('.newsletter-input').value;
    if(email) {
        fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            document.querySelector('.newsletter-input').value = '';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Subscription failed. Please try again.');
        });
    } else {
        alert('Please enter your email address');
    }
});