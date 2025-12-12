// frontend/script.js
const API_URL = window.location.origin + '/api';
const mediaUploader = new MediaUploader();

// DOM Elements
const postButton = document.getElementById('postButton');
const usernameInput = document.getElementById('username');
const postContentInput = document.getElementById('postContent');
const postsList = document.getElementById('postsList');

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadPosts);

// Update postButton event listener
postButton.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const content = postContentInput.value.trim();
  
  if (!content && mediaUploader.mediaFiles.length === 0) {
    alert('Please enter content or add media');
    return;
  }
  
  try {
    const formData = mediaUploader.getFormData();
    formData.append('username', username || 'anonymous');
    formData.append('content', content);
    
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      body: formData
      // No Content-Type header - let browser set it with boundary
    });
    
    if (response.ok) {
      const newPost = await response.json();
      addPostToDOM(newPost);
      postContentInput.value = '';
      mediaUploader.clear();
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
// Update addPostToDOM function
function addPostToDOM(post) {
  const postElement = document.createElement('div');
  postElement.className = 'post';
  postElement.dataset.id = post.id;
  
  const time = new Date(post.created_at).toLocaleString();
  const currentUser = usernameInput.value.trim() || 'anonymous';
  
  // Media HTML (from previous implementation)
  let mediaHTML = '';
  if (post.media_urls && post.media_urls.length > 0) {
    // ... (keep your existing media HTML code)
  }
  
  // Check if it's a retweet
  let retweetHeader = '';
  if (post.is_retweet && post.original_username) {
    retweetHeader = `
      <div class="retweet-header">
        <i class="fas fa-retweet"></i> ${post.username} retweeted
      </div>
    `;
  }
  
  postElement.innerHTML = `
    ${retweetHeader}
    <div class="post-header">
      <span class="username">@${post.is_retweet ? post.original_username : post.username}</span>
      <span class="post-time">${time}</span>
    </div>
    ${post.content ? `<div class="post-content">${post.content}</div>` : ''}
    ${mediaHTML}
    
    <!-- Interaction Bar -->
    <div class="interaction-bar">
      <!-- Reply Button -->
      <button class="interaction-btn reply-btn" data-id="${post.id}">
        <i class="far fa-comment"></i>
        <span class="count">${post.replies_count || 0}</span>
      </button>
      
      <!-- Retweet Button -->
      <button class="interaction-btn retweet-btn ${post.user_retweeted ? 'active' : ''}" data-id="${post.id}">
        <i class="fas fa-retweet"></i>
        <span class="count">${post.retweets_count || 0}</span>
      </button>
      
      <!-- Like Button -->
      <button class="interaction-btn like-btn ${post.user_liked ? 'active' : ''}" data-id="${post.id}">
        <i class="${post.user_liked ? 'fas' : 'far'} fa-heart"></i>
        <span class="count">${post.likes_count || 0}</span>
      </button>
      
      <!-- Share Button -->
      <button class="interaction-btn share-btn">
        <i class="far fa-share-square"></i>
      </button>
    </div>
    
    <!-- Reply Form (hidden by default) -->
    <div class="reply-form" style="display: none;">
      <textarea class="reply-text" placeholder="Post your reply" rows="2"></textarea>
      <button class="btn-primary submit-reply" data-id="${post.id}">Reply</button>
      <button class="btn-secondary cancel-reply">Cancel</button>
    </div>
  `;
  
  postsList.prepend(postElement);
  attachInteractionListeners(postElement);
}

// Add to script.js
postContentInput.addEventListener('input', function() {
  const count = this.value.length;
  const counter = document.getElementById('charCounter') || 
    (() => {
      const div = document.createElement('div');
      div.id = 'charCounter';
      div.className = 'character-count';
      this.parentNode.appendChild(div);
      return div;
    })();
  
  counter.textContent = `${count}/280`;
  
  if (count > 250) counter.classList.add('warning');
  else counter.classList.remove('warning');
  
  if (count > 280) counter.classList.add('error');
  else counter.classList.remove('error');
});

// Add this function to script.js (if not already there)
function attachInteractionListeners(postElement) {
  // This function is now defined in interactions.js
  // It will be called automatically
}

// Update loadPosts function to include username parameter
async function loadPosts() {
  try {
    const currentUser = usernameInput.value.trim() || 'anonymous';
    const response = await fetch(`${API_URL}/posts?username=${currentUser}`);
    const posts = await response.json();
    
    postsList.innerHTML = '';
    posts.forEach(post => addPostToDOM(post));
  } catch (error) {
    console.error('Error loading posts:', error);
    postsList.innerHTML = '<p>Error loading posts. Please refresh the page.</p>';
  }
}

// Auto-refresh posts every 30 seconds
setInterval(loadPosts, 30000);