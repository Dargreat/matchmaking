document.addEventListener('DOMContentLoaded', async () => {
    const postsContainer = document.getElementById('postsContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Check authentication status
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
        redirectToLogin();
        return;
    }
    
    // Fetch posts with payment status
    try {
        const response = await fetch('/api/posts/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            // Token is invalid or expired
            redirectToLogin();
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        
        const { posts } = await response.json();
        
        if (posts.length === 0) {
            postsContainer.innerHTML = '<p>No posts available.</p>';
            return;
        }
        
        renderPosts(posts);
    } catch (error) {
        console.error('Dashboard error:', error);
        postsContainer.innerHTML = `<p class="error">Error loading posts: ${error.message}</p>`;
    }
    
    // Logout handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        redirectToLogin();
    });
    
    function renderPosts(posts) { 
        console.log(posts);
               
        postsContainer.innerHTML = `
            <div class="posts-grid">
                ${posts.map(post => `
                    <div class="post-card">
                        <div class="post-image" style="background-image: url('${post.imageUrl || '/images/default-post.jpg'}')"></div>
                        <div class="post-content">
                            <h3 class="post-title">${post.name}</h3>
                            <div class="post-price">Price: ₦${post.price}</div>
                            <p>${post.phoneNumber}</p>
                            <div class="post-meta">
                                <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    function redirectToLogin() {
        window.location.href = '/login.html?redirect=dashboard';
    }
});