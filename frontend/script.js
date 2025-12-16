// frontend/script.js - Update at the top
const API_URL = 'http://localhost:3002/api';

// const API_URL = window.location.origin + '/api';
const postButton = document.getElementById('postButton');
const usernameInput = document.getElementById('username');
const postContentInput = document.getElementById('postContent');
const postsList = document.getElementById('postsList');

// Simple post function
async function createPost() {
  const username = usernameInput.value.trim() || 'anonymous';
  const content = postContentInput.value.trim();
  
  if (!content) {
    alert('Please enter some content');
    return;
  }
  
  console.log('Sending post:', { username, content });
  
  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, content })
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const newPost = await response.json();
      console.log('Post created:', newPost);
      
      // Add to DOM
      const postElement = document.createElement('div');
      postElement.className = 'post';
      postElement.innerHTML = `
        <div class="post-header">
          <span class="username">@${newPost.username}</span>
          <span class="post-time">${new Date(newPost.created_at).toLocaleString()}</span>
        </div>
        <div class="post-content">${newPost.content}</div>
      `;
      postsList.prepend(postElement);
      
      postContentInput.value = '';
      alert('Post created successfully!');
    } else {
      const error = await response.text();
      console.error('Server error:', error);
      alert('Failed to create post: ' + error);
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('Network error: ' + error.message);
  }
}

// Load posts
async function loadPosts() {
  try {
    const response = await fetch(`${API_URL}/posts`);
    const posts = await response.json();
    
    postsList.innerHTML = '';
    posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.className = 'post';
      postElement.innerHTML = `
        <div class="post-header">
          <span class="username">@${post.username}</span>
          <span class="post-time">${new Date(post.created_at).toLocaleString()}</span>
        </div>
        <div class="post-content">${post.content}</div>
      `;
      postsList.appendChild(postElement);
    });
  } catch (error) {
    postsList.innerHTML = '<p>Error loading posts</p>';
  }
}

// Event listeners
// In your postButton event listener:
postButton.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const content = postContentInput.value.trim();
  
  // Check if we have media files
  const hasMedia = window.mediaUploader && window.mediaUploader.mediaFiles.length > 0;
  
  if (!content && !hasMedia) {
    alert('Please enter content or add media');
    return;
  }
  
  try {
    if (hasMedia) {
      // Use FormData for media upload
      const formData = new FormData();
      formData.append('username', username || 'anonymous');
      formData.append('content', content);
      
      // Add each media file
      window.mediaUploader.mediaFiles.forEach(media => {
        formData.append('media', media.file);
      });
      
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        body: formData  // Let browser set Content-Type with boundary
      });
      
      if (response.ok) {
        const newPost = await response.json();
        addPostToDOM(newPost);
        postContentInput.value = '';
        window.mediaUploader.clear();
      }
    } else {
      // Simple JSON for text-only posts
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || 'anonymous',
          content: content
        })
      });
      
      if (response.ok) {
        const newPost = await response.json();
        addPostToDOM(newPost);
        postContentInput.value = '';
      }
    }
  } catch (error) {
    console.error('Error creating post:', error);
    alert('Error: ' + error.message);
  }
});

document.addEventListener('DOMContentLoaded', loadPosts);