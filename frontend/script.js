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
  
  const time = new Date(post.created_at).toLocaleString();
  
  let mediaHTML = '';
  if (post.media_urls && post.media_urls.length > 0) {
    let gridClass = '';
    if (post.media_urls.length === 1) gridClass = 'single-media';
    else if (post.media_urls.length === 2) gridClass = 'two-media';
    else if (post.media_urls.length === 3) gridClass = 'three-media';
    else gridClass = 'four-media';
    
    mediaHTML = `<div class="post-media media-grid ${gridClass}">`;
    
    post.media_urls.forEach((url, index) => {
      const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
      mediaHTML += `
        <div class="media-item">
          ${isVideo 
            ? `<video controls><source src="${API_URL}/posts${url}" type="video/mp4"></video>`
            : `<img src="${API_URL}/posts${url}" alt="Post image ${index + 1}">`
          }
        </div>
      `;
    });
    
    mediaHTML += '</div>';
  }
  
  postElement.innerHTML = `
    <div class="post-header">
      <span class="username">@${post.username}</span>
      <span class="post-time">${time}</span>
    </div>
    ${post.content ? `<div class="post-content">${post.content}</div>` : ''}
    ${mediaHTML}
  `;
  
  postsList.prepend(postElement);
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


// Auto-refresh posts every 30 seconds
setInterval(loadPosts, 30000);