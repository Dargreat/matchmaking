document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Load profiles based on page type
    const pageType = window.location.pathname.includes('hookup') ? 'HOOKUP' : 
                    window.location.pathname.includes('fwb') ? 'FWB' : 'RELATIONSHIP';
    
    fetchProfiles(pageType);
    
    // Set up modal
    const modal = document.getElementById('paymentModal');
    const closeModal = document.querySelector('.close-modal');
    let currentPostId = null;
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Set up payment buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('unlock-button')) {
            const profileCard = e.target.closest('.profile-card');
            currentPostId = profileCard.dataset.id;
            modal.style.display = 'block';
        }
        
        if (e.target.id === 'payWithCard') {
            initiatePayment(currentPostId, 'card');
        }
        
        if (e.target.id === 'payWithBank') {
            initiatePayment(currentPostId, 'bank');
        }
    });
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
}

async function fetchProfiles(category) {
    try {
        const response = await fetch(`/api/posts?category=${category}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        console.log(data);
        
        if (data.success && data.posts) {
            const profileGrid = document.querySelector('.profile-grid');
            if (profileGrid) {
                profileGrid.innerHTML = ''; // Clear existing
                data.posts.forEach(post => {
                    createProfileCard(post, profileGrid);
                });
            }
        }
    } catch (error) {
        console.error('Error fetching profiles:', error);
    }
}

function createProfileCard(match, container) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.dataset.id = match._id;
    card.dataset.hasAccess = match.hasAccess || false;

    const img = document.createElement('img');
    img.src = match.imageUrl;
    img.className = 'profile-image';
    img.alt = `${match.name}'s profile`;

    const details = document.createElement('div');
    details.className = 'profile-details';

    const name = document.createElement('h3');
    name.className = 'profile-name';
    name.textContent = `${match.name}, ${match.age}`;

    const info = document.createElement('p');
    info.className = 'profile-info';
    info.textContent = `📍 ${match.location} · ${match.category === 'HOOKUP' ? '💖' : match.category === 'FWB' ? '🤝' : '💕'} ${match.category}`;

    // Add payment button or show phone number if already paid
    if (match.hasAccess) {
        const phoneDiv = document.createElement('div');
        phoneDiv.className = 'phone-number';
        phoneDiv.textContent = `📞 ${match.phoneNumber}`;
        details.appendChild(phoneDiv);
        
        const paidBadge = document.createElement('span');
        paidBadge.className = 'paid-badge';
        paidBadge.textContent = 'Already Paid';
        details.appendChild(paidBadge);
    } else {
        const unlockButton = document.createElement('button');
        unlockButton.className = 'unlock-button';
        unlockButton.textContent = `Unlock Contact (₦${match.price})`;
        details.appendChild(unlockButton);
    }

    card.appendChild(img);
    card.appendChild(details);
    container.appendChild(card);
}

async function initiatePayment(postId, method) {
    const paymentStatus = document.getElementById('paymentStatus');
    paymentStatus.innerHTML = '<p>Processing payment...</p>';
    
    try {
        const response = await fetch('/api/payments/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                postId,
                method
            }),
        });
        
        const data = await response.json();
        
        if (data.success && data.authorizationUrl) {
            // For demo, we'll simulate payment verification after 2 seconds
            window.location.href = data.authorizationUrl;
            
            // In a real implementation, you would redirect to the payment gateway
            // window.location.href = data.authorizationUrl;
        } else {
            paymentStatus.innerHTML = `<p style="color: red;">${data.message || 'Payment initiation failed'}</p>`;
        }
    } catch (error) {
        console.error('Payment error:', error);
        paymentStatus.innerHTML = '<p style="color: red;">Payment failed. Please try again.</p>';
    }
}

async function verifyPayment(reference, postId) {
    const paymentStatus = document.getElementById('paymentStatus');
    
    try {
        const response = await fetch(`/api/payments/verify/${reference}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            paymentStatus.innerHTML = '<p style="color: green;">Payment successful!</p>';
            
            // Close modal after 1.5 seconds
            setTimeout(() => {
                document.getElementById('paymentModal').style.display = 'none';
                // Refresh the profile to show the phone number
                const pageType = window.location.pathname.includes('hookup') ? 'HOOKUP' : 
                               window.location.pathname.includes('fwb') ? 'FWB' : 'RELATIONSHIP';
                fetchProfiles(pageType);
            }, 1500);
        } else {
            paymentStatus.innerHTML = `<p style="color: red;">${data.message || 'Payment verification failed'}</p>`;
        }
    } catch (error) {
        console.error('Verification error:', error);
        paymentStatus.innerHTML = '<p style="color: red;">Error verifying payment</p>';
    }
}