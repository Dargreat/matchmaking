let uploadedImagesContainer;
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    uploadedImagesContainer = document.getElementById('uploadedImages');
    const logoutButton = document.querySelector('.logout-button');

    // Check admin authentication
    checkAdminAuth();

    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }

    if (logoutButton) {
        // logoutButton.addEventListener('click', logout);
    }

    // Load existing uploads
    fetchUploads();
});

function checkAdminAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/admin-login.html';
        return;
    }

    fetch('/api/auth/verify', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.user.role != 'admin') {
                window.location.href = '/admin-login.html';
            }
        })
        .catch(() => {
            window.location.href = '/admin-login.html';
        });
}

function fetchUploads() {
    fetch('/api/posts', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);

            if (data.success && data.posts) {
                data.posts.forEach(post => {
                    createImageCard(post.imageUrl, post.category, post._id, post.phoneNumber);
                });
            }
        })
        .catch(error => console.error('Error fetching uploads:', error));
}

function handleUpload(e) {
    e.preventDefault();

    // Get form values
    const fileInput = document.getElementById('imageInput');
    const name = document.getElementById('nameInput').value;
    const phoneNumber = document.getElementById('phoneInput').value;
    const price = document.getElementById('price').value;
    const category = document.querySelector('input[name="category"]:checked').value;

    // Create FormData object
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('name', name);
    formData.append('phoneNumber', phoneNumber);
    formData.append('category', category);
    formData.append('price', price);

    console.log("Making request");

    fetch('/api/posts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                createImageCard(data.imageUrl, category, data.id, data.phoneNumber);
                uploadForm.reset();
            } else {
                alert(data.message || 'Upload failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Upload failed. Please try again.');
        });
}

function createImageCard(imageUrl, category, id, phoneNumber) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.dataset.id = id;

    const img = document.createElement('img');
    img.src = imageUrl;

    const details = document.createElement('div');
    details.className = 'image-details';

    const categoryLabel = document.createElement('div');
    categoryLabel.className = 'image-category';
    categoryLabel.textContent = `Category: ${category}`;
    const phoneNumberLabel = document.createElement('div');
    phoneNumberLabel.className = 'image-phoneNumber';
    phoneNumberLabel.textContent = `Phone number: ${phoneNumber}`;

    const actions = document.createElement('div');
    actions.className = 'image-actions';

    const editButton = document.createElement('button');
    editButton.className = 'action-button edit';
    editButton.textContent = 'Edit';
    editButton.onclick = () => editImage(id, category);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'action-button delete';
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => deleteImage(id, card);

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    details.appendChild(phoneNumberLabel);
    details.appendChild(categoryLabel);
    details.appendChild(actions);

    card.appendChild(img);
    card.appendChild(details);

    uploadedImagesContainer.appendChild(card);
}

function editImage(id, currentCategory) {
    const newCategory = prompt('Enter new category (FWB, HOOKUP, RELATIONSHIP):', currentCategory);
    if (newCategory && ['FWB', 'HOOKUP', 'RELATIONSHIP'].includes(newCategory.toUpperCase())) {
        fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ category: newCategory.toUpperCase() }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const card = document.querySelector(`.image-card[data-id="${id}"]`);
                    if (card) {
                        card.querySelector('.image-category').textContent = `Category: ${newCategory.toUpperCase()}`;
                    }
                }
            })
            .catch(error => console.error('Error:', error));
    }
}

function deleteImage(id, cardElement) {
    if (confirm('Are you sure you want to delete this image?')) {
        fetch(`/api/posts/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    cardElement.remove();
                }
            })
            .catch(error => console.error('Error:', error));
    }
}