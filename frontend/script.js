const API_URL = window.location.origin + '/api';
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
postButton.addEventListener('click', createPost);
document.addEventListener('DOMContentLoaded', loadPosts);