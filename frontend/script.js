// frontend/script.js
const API_URL = window.location.origin + '/api';

// DOM Elements
const postButton = document.getElementById('postButton');
const usernameInput = document.getElementById('username');
const postContentInput = document.getElementById('postContent');
const postsList = document.getElementById('postsList');

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadPosts);

// Post button event listener
postButton.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const content = postContentInput.value.trim();

    if (!content) {
        alert('Please enter some content for your post');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username || 'anonymous',
                content: content
            })
        });

        if (response.ok) {
            const newPost = await response.json();
            addPostToDOM(newPost);
            postContentInput.value = '';
        } else {
            throw new Error('Failed to create post');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Error creating post. Please try again.');
    }
});

// Load all posts
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        const posts = await response.json();
        
        postsList.innerHTML = '';
        posts.forEach(post => addPostToDOM(post));
    } catch (error) {
        console.error('Error loading posts:', error);
        postsList.innerHTML = '<p>Error loading posts. Please refresh the page.</p>';
    }
}

// Add post to DOM
function addPostToDOM(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    
    const time = new Date(post.created_at).toLocaleString();
    
    postElement.innerHTML = `
        <div class="post-header">
            <span class="username">@${post.username}</span>
            <span class="post-time">${time}</span>
        </div>
        <div class="post-content">${post.content}</div>
    `;
    
    postsList.prepend(postElement);
}

// Auto-refresh posts every 30 seconds
setInterval(loadPosts, 30000);