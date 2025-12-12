// frontend/upload.js
class MediaUploader {
  constructor() {
    this.mediaFiles = [];
    this.maxFiles = 4;
    this.maxSizeMB = 50;
    this.previewContainer = document.getElementById('mediaPreview');
    this.uploadInput = document.getElementById('mediaUpload');
    
    this.init();
  }
  
  init() {
    // File input change event
    this.uploadInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
      e.target.value = ''; // Reset input
    });
  }
  
  handleFiles(files) {
    const remainingSlots = this.maxFiles - this.mediaFiles.length;
    
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      
      // Validate file size
      if (file.size > this.maxSizeMB * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size: ${this.maxSizeMB}MB`);
        continue;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.mediaFiles.push({
          file: file,
          preview: e.target.result,
          type: file.type.startsWith('image') ? 'image' : 'video'
        });
        this.renderPreviews();
      };
      reader.readAsDataURL(file);
    }
  }
  
  renderPreviews() {
    if (this.mediaFiles.length === 0) {
      this.previewContainer.innerHTML = '';
      return;
    }
    
    let gridClass = '';
    if (this.mediaFiles.length === 1) gridClass = 'single-media';
    else if (this.mediaFiles.length === 2) gridClass = 'two-media';
    else if (this.mediaFiles.length === 3) gridClass = 'three-media';
    else gridClass = 'four-media';
    
    let html = `<div class="media-grid ${gridClass}">`;
    
    this.mediaFiles.forEach((media, index) => {
      html += `
        <div class="media-item">
          ${media.type === 'image' 
            ? `<img src="${media.preview}" alt="Preview ${index + 1}">`
            : `<video controls><source src="${media.preview}" type="${media.file.type}"></video>`
          }
          <button class="remove-media" data-index="${index}">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    });
    
    html += `</div>`;
    this.previewContainer.innerHTML = html;
    
    // Add remove event listeners
    document.querySelectorAll('.remove-media').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.closest('.remove-media').dataset.index);
        this.removeMedia(index);
      });
    });
  }
  
  removeMedia(index) {
    this.mediaFiles.splice(index, 1);
    this.renderPreviews();
  }
  
  getFormData() {
    const formData = new FormData();
    
    this.mediaFiles.forEach(media => {
      formData.append('media', media.file);
    });
    
    return formData;
  }
  
  clear() {
    this.mediaFiles = [];
    this.renderPreviews();
  }
}