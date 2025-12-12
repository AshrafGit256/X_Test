// frontend/interactions.js
class PostInteractions {
  constructor() {
    this.currentUser = document.getElementById('username').value.trim() || 'anonymous';
  }
  
  attachListeners(postElement) {
    const postId = postElement.dataset.id;
    
    // Like button
    const likeBtn = postElement.querySelector('.like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', () => this.toggleLike(postId, likeBtn));
    }
    
    // Retweet button
    const retweetBtn = postElement.querySelector('.retweet-btn');
    if (retweetBtn) {
      retweetBtn.addEventListener('click', () => this.toggleRetweet(postId, retweetBtn));
    }
    
    // Reply button
    const replyBtn = postElement.querySelector('.reply-btn');
    const replyForm = postElement.querySelector('.reply-form');
    const cancelReply = postElement.querySelector('.cancel-reply');
    const submitReply = postElement.querySelector('.submit-reply');
    
    if (replyBtn && replyForm) {
      replyBtn.addEventListener('click', () => {
        replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
      });
    }
    
    if (cancelReply && replyForm) {
      cancelReply.addEventListener('click', () => {
        replyForm.style.display = 'none';
        replyForm.querySelector('.reply-text').value = '';
      });
    }
    
    if (submitReply) {
      submitReply.addEventListener('click', () => this.submitReply(postId, postElement));
    }
  }
  
  async toggleLike(postId, button) {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.currentUser })
      });
      
      const data = await response.json();
      const countElement = button.querySelector('.count');
      const icon = button.querySelector('i');
      
      if (data.liked) {
        // Liked
        button.classList.add('active');
        icon.classList.remove('far');
        icon.classList.add('fas');
        countElement.textContent = parseInt(countElement.textContent) + 1;
      } else {
        // Unliked
        button.classList.remove('active');
        icon.classList.remove('fas');
        icon.classList.add('far');
        countElement.textContent = parseInt(countElement.textContent) - 1;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }
  
  async toggleRetweet(postId, button) {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/retweet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.currentUser })
      });
      
      const data = await response.json();
      const countElement = button.querySelector('.count');
      
      if (data.retweeted) {
        // Retweeted
        button.classList.add('active');
        countElement.textContent = parseInt(countElement.textContent) + 1;
        alert('Post retweeted!');
      } else {
        // Undo retweet
        button.classList.remove('active');
        countElement.textContent = parseInt(countElement.textContent) - 1;
        alert('Retweet removed');
      }
    } catch (error) {
      console.error('Error toggling retweet:', error);
    }
  }
  
  async submitReply(postId, postElement) {
    const textarea = postElement.querySelector('.reply-text');
    const content = textarea.value.trim();
    
    if (!content) {
      alert('Please enter a reply');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: this.currentUser, 
          content: content 
        })
      });
      
      if (response.ok) {
        const reply = await response.json();
        textarea.value = '';
        postElement.querySelector('.reply-form').style.display = 'none';
        
        // Update reply count
        const replyCount = postElement.querySelector('.reply-btn .count');
        replyCount.textContent = parseInt(replyCount.textContent) + 1;
        
        alert('Reply posted successfully!');
      } else {
        throw new Error('Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Error posting reply');
    }
  }
}

// Initialize interactions
const postInteractions = new PostInteractions();

// Helper function to attach listeners
function attachInteractionListeners(postElement) {
  postInteractions.attachListeners(postElement);
}