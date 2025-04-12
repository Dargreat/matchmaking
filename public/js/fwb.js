document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Load profiles based on page type
    const pageType = window.location.pathname.includes('hookup') ? 'HOOKUP' : 
                    window.location.pathname.includes('fwb') ? 'FWB' : 'RELATIONSHIP';
    
    fetchProfiles(pageType);
    
    // Set up connect buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('connect-button')) {
            const profileCard = e.target.closest('.profile-card');
            const profileId = profileCard.dataset.id;
            initiateConnection(profileId, pageType);
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

function fetchProfiles(category) {
    fetch(`/api/matches?category=${category}`)
    .then(response => response.json())
    .then(data => {
        if (data.success && data.matches) {
            const profileGrid = document.querySelector('.profile-grid');
            if (profileGrid) {
                profileGrid.innerHTML = ''; // Clear existing
                data.matches.forEach(match => {
                    createProfileCard(match, profileGrid);
                });
            }
        }
    })
    .catch(error => console.error('Error fetching profiles:', error));
}

function createProfileCard(match, container) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.dataset.id = match._id;

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

    const button = document.createElement('button');
    button.className = 'connect-button';
    button.textContent = match.category === 'HOOKUP' ? 'Connect Now' : 
                        match.category === 'FWB' ? 'Discuss Terms' : 'Connect now';

    details.appendChild(name);
    details.appendChild(info);
    details.appendChild(button);

    card.appendChild(img);
    card.appendChild(details);

    container.appendChild(card);
}

function initiateConnection(profileId, category) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            profileId,
            category,
            amount: 5000, // ₦5,000 in kobo
            callbackUrl: `${window.location.origin}/payment-callback.html`
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.authorizationUrl) {
            window.location.href = data.authorizationUrl;
        } else {
            alert(data.message || 'Payment initiation failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Connection failed. Please try again.');
    });
}