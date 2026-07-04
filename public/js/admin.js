document.addEventListener('DOMContentLoaded', () => {
  // Authentication Check
  const token = localStorage.getItem('aura_admin_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const uploadForm = document.getElementById('uploadForm');
  const submitBtn = document.getElementById('submitBtn');
  const adminArtworkList = document.getElementById('adminArtworkList');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const logoutBtn = document.getElementById('logoutBtn');

  // Label Modal Elements
  const labelModal = document.getElementById('labelModal');
  const closeLabelBtn = document.getElementById('closeLabelBtn');
  const lblTitle = document.getElementById('lblTitle');
  const lblArtist = document.getElementById('lblArtist');
  const lblQr = document.getElementById('lblQr');
  const lblCode = document.getElementById('lblCode');

  // Edit Modal Elements
  const editModal = document.getElementById('editModal');
  const closeEditBtn = document.getElementById('closeEditBtn');
  const editForm = document.getElementById('editForm');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editSubmitBtn = document.getElementById('editSubmitBtn');
  const editArtworkId = document.getElementById('editArtworkId');
  const editTitle = document.getElementById('editTitle');
  const editArtist = document.getElementById('editArtist');
  const editDescription = document.getElementById('editDescription');
  
  const editImageInput = document.getElementById('editImageInput');
  const editImageFileName = document.getElementById('editImageFileName');
  const editTargetInput = document.getElementById('editTargetInput');
  const editTargetFileName = document.getElementById('editTargetFileName');
  const editVideoInput = document.getElementById('editVideoInput');
  const editVideoFileName = document.getElementById('editVideoFileName');

  const currentImageInfo = document.getElementById('currentImageInfo');
  const currentTargetInfo = document.getElementById('currentTargetInfo');
  const currentVideoInfo = document.getElementById('currentVideoInfo');

  // File inputs and their display elements
  const imageInput = document.getElementById('imageInput');
  const imageFileName = document.getElementById('imageFileName');
  const targetInput = document.getElementById('targetInput');
  const targetFileName = document.getElementById('targetFileName');
  const videoInput = document.getElementById('videoInput');
  const videoFileName = document.getElementById('videoFileName');

  let artworks = [];

  // Logout Handler
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('aura_admin_token');
    window.location.href = '/login.html';
  });

  // Update file name displays on change
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    imageFileName.textContent = file ? file.name : '';
  });

  targetInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    targetFileName.textContent = file ? file.name : '';
  });

  videoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    videoFileName.textContent = file ? file.name : '';
  });

  // Edit file inputs change displays
  editImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    editImageFileName.textContent = file ? file.name : '';
  });

  editTargetInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    editTargetFileName.textContent = file ? file.name : '';
  });

  editVideoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    editVideoFileName.textContent = file ? file.name : '';
  });

  // Fetch and display artworks
  async function fetchArtworks() {
    try {
      const response = await fetch('/api/artworks');
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch artworks');
      }
      artworks = await response.json();
      renderArtworkList();
    } catch (error) {
      console.error('Error fetching artworks:', error);
      showToast('Error loading artworks.', true);
    }
  }

  // Handle unauthorized access
  function handleUnauthorized() {
    localStorage.removeItem('aura_admin_token');
    showToast('Session expired. Please log in again.', true);
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1500);
  }

  // Render artwork items for admin
  function renderArtworkList() {
    adminArtworkList.innerHTML = '';

    if (artworks.length === 0) {
      adminArtworkList.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <p>No artworks uploaded yet.</p>
        </div>
      `;
      return;
    }

    artworks.forEach(art => {
      const item = document.createElement('div');
      item.className = 'admin-artwork-item';

      const isSample = art.id === 'sample-artwork';
      const deleteBtnHtml = isSample 
        ? `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; margin-left: auto; padding-right: 0.5rem;">Sample</span>`
        : `<button class="admin-btn delete" data-id="${art.id}" title="Delete Artwork">
            <svg viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>`;

      item.innerHTML = `
        <img src="${art.imageUrl}" alt="${art.title}" class="admin-artwork-thumb">
        <div class="admin-artwork-info">
          <div class="admin-artwork-title">${art.title}</div>
          <div class="admin-artwork-artist">By ${art.artist} <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem;">Code: <strong>${art.code}</strong></span></div>
        </div>
        <div class="admin-actions">
          <button class="admin-btn qr-btn" data-id="${art.id}" title="View QR Label" style="border-color: rgba(0, 245, 212, 0.2); color: var(--accent-cyan); margin-right: 0.5rem;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button class="admin-btn edit-btn" data-id="${art.id}" title="Edit Artwork" style="border-color: rgba(157, 78, 221, 0.2); color: var(--accent-purple); margin-right: 0.5rem;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          ${deleteBtnHtml}
        </div>
      `;

      adminArtworkList.appendChild(item);
    });

    // Add delete event listeners
    document.querySelectorAll('.admin-btn.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteArtwork(id);
      });
    });

    // Add QR code label event listeners
    document.querySelectorAll('.admin-btn.qr-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openLabelModal(id);
      });
    });

    // Add Edit artwork event listeners
    document.querySelectorAll('.admin-btn.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openEditModal(id);
      });
    });
  }

  // Open Label Modal and generate QR Code
  function openLabelModal(id) {
    const art = artworks.find(item => item.id === id);
    if (!art) return;

    lblTitle.textContent = art.title;
    lblArtist.textContent = `By ${art.artist}`;
    lblCode.textContent = art.code;
    
    // Clear previous QR code
    lblQr.innerHTML = '';

    // Generate new QR code
    const scanUrl = `${window.location.origin}/scan.html?id=${art.id}`;
    new QRCode(lblQr, {
      text: scanUrl,
      width: 160,
      height: 160,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    labelModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // Close Label Modal
  function closeLabelModal() {
    labelModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  closeLabelBtn.addEventListener('click', closeLabelModal);
  labelModal.addEventListener('click', (e) => {
    if (e.target === labelModal) {
      closeLabelModal();
    }
  });

  let currentEditingArtwork = null;

  // Open Edit Modal and load details
  function openEditModal(id) {
    const art = artworks.find(item => item.id === id);
    if (!art) return;

    currentEditingArtwork = art;

    editArtworkId.value = art.id;
    editTitle.value = art.title;
    editArtist.value = art.artist;
    editDescription.value = art.description;

    // Reset file inputs and displays
    editImageInput.value = '';
    editImageFileName.textContent = '';
    editTargetInput.value = '';
    editTargetFileName.textContent = '';
    editVideoInput.value = '';
    editVideoFileName.textContent = '';

    // Show current file info (extract just the filename for display)
    const getFilename = (url) => url ? url.split('/').pop() : 'None';
    currentImageInfo.innerHTML = `Current Image: <a href="${art.imageUrl}" target="_blank" style="color: var(--accent-cyan); text-decoration: underline;">${getFilename(art.imageUrl)}</a>`;
    currentTargetInfo.innerHTML = `Current Target: <a href="${art.targetUrl}" target="_blank" style="color: var(--accent-cyan); text-decoration: underline;">${getFilename(art.targetUrl)}</a>`;
    currentVideoInfo.innerHTML = `Current Video: <a href="${art.videoUrl}" target="_blank" style="color: var(--accent-cyan); text-decoration: underline;">${getFilename(art.videoUrl)}</a>`;

    // Disable save changes button initially
    editSubmitBtn.disabled = true;

    editModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // Close Edit Modal
  function closeEditModal() {
    editModal.style.display = 'none';
    document.body.style.overflow = '';
    currentEditingArtwork = null;
  }

  closeEditBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  // Track if form actually changed from original values
  function checkFormChanges() {
    if (!currentEditingArtwork) {
      editSubmitBtn.disabled = true;
      return;
    }

    const titleChanged = editTitle.value.trim() !== currentEditingArtwork.title;
    const artistChanged = editArtist.value.trim() !== currentEditingArtwork.artist;
    const descChanged = editDescription.value.trim() !== currentEditingArtwork.description;
    
    const imageChanged = editImageInput.files.length > 0;
    const targetChanged = editTargetInput.files.length > 0;
    const videoChanged = editVideoInput.files.length > 0;

    if (titleChanged || artistChanged || descChanged || imageChanged || targetChanged || videoChanged) {
      editSubmitBtn.disabled = false;
    } else {
      editSubmitBtn.disabled = true;
    }
  }

  // Listeners for checking changes
  editTitle.addEventListener('input', checkFormChanges);
  editArtist.addEventListener('input', checkFormChanges);
  editDescription.addEventListener('input', checkFormChanges);
  editImageInput.addEventListener('change', checkFormChanges);
  editTargetInput.addEventListener('change', checkFormChanges);
  editVideoInput.addEventListener('change', checkFormChanges);

  // Submit Edit Form
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = editArtworkId.value;
    const art = artworks.find(item => item.id === id);
    if (!art) return;

    const titleVal = editTitle.value.trim();
    const artistVal = editArtist.value.trim();
    const descVal = editDescription.value.trim();

    const imgFile = editImageInput.files[0];
    const targetFile = editTargetInput.files[0];
    const vidFile = editVideoInput.files[0];

    editSubmitBtn.disabled = true;

    try {
      let imageUrl = art.imageUrl;
      let targetUrl = art.targetUrl;
      let videoUrl = art.videoUrl;

      // Count files to upload
      let step = 1;
      let totalSteps = 1; // 1 step for metadata save
      if (imgFile) totalSteps++;
      if (targetFile) totalSteps++;
      if (vidFile) totalSteps++;

      // 1. Upload Target Image if changed
      if (imgFile) {
        editSubmitBtn.textContent = `${step++}/${totalSteps}: Uploading new target image...`;
        imageUrl = await smartUploadFile(imgFile, 'images');
      }

      // 2. Upload Target .mind File if changed
      if (targetFile) {
        editSubmitBtn.textContent = `${step++}/${totalSteps}: Uploading new target .mind file...`;
        targetUrl = await smartUploadFile(targetFile, 'targets');
      }

      // 3. Upload Video if changed
      if (vidFile) {
        editSubmitBtn.textContent = `${step++}/${totalSteps}: Uploading new video overlay...`;
        videoUrl = await smartUploadFile(vidFile, 'videos');
      }

      // 4. Update Artwork Metadata
      editSubmitBtn.textContent = `${step}/${totalSteps}: Saving changes...`;
      const response = await fetch(`/api/artworks/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: titleVal,
          artist: artistVal,
          description: descVal,
          imageUrl,
          targetUrl,
          videoUrl
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update artwork');
      }

      const updatedArtwork = await response.json();
      showToast(`"${updatedArtwork.title}" updated successfully!`);
      closeEditModal();
      fetchArtworks();
    } catch (error) {
      console.error('Error updating artwork:', error);
      if (error.message !== 'Unauthorized') {
        showToast(error.message || 'Error updating artwork.', true);
      }
    } finally {
      editSubmitBtn.disabled = false;
      editSubmitBtn.textContent = 'Save Changes';
    }
  });

  // Delete artwork
  async function deleteArtwork(id) {
    const art = artworks.find(item => item.id === id);
    if (!art) return;

    if (!confirm(`Are you sure you want to delete "${art.title}"? This will delete all associated files.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/artworks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      const result = await response.json();
      if (result.success) {
        showToast('Artwork deleted successfully.');
        fetchArtworks();
      } else {
        throw new Error(result.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
      showToast(error.message || 'Error deleting artwork.', true);
    }
  }

  // Helper to compress images client-side before uploading (resizes & uses JPEG quality compression)
  async function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    if (!file.type.startsWith('image/')) return file;
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale dimensions if larger than limits
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Return compressed JPEG File object
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: "image/jpeg",
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file); // fallback to original on error
              }
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  }

  // Smart upload function that attempts direct Vercel Blob client upload and falls back to local server upload
  async function smartUploadFile(file, type) {
    // 1. If it's an image, compress it first to save bandwidth and load AR faster!
    if (type === 'images') {
      try {
        file = await compressImage(file);
      } catch (err) {
        console.warn('Image compression failed, using original file:', err);
      }
    }

    // 2. Try Vercel Blob direct client upload first (essential for bypassing Vercel 4.5MB limit on videos)
    try {
      const { upload } = await import("https://esm.sh/@vercel/blob@2.5.0/client");
      
      const folderName = type === 'images' ? 'images' : type === 'targets' ? 'targets' : 'videos';
      // Format pathname to uploads/{folderName}/{timestamp}-{filename}
      const pathname = `uploads/${folderName}/${Date.now()}-${file.name}`;
      
      const blob = await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/upload/blob-token',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (blob && blob.url) {
        console.log(`Directly uploaded ${type} to Vercel Blob:`, blob.url);
        return blob.url;
      }
    } catch (err) {
      console.log(`Direct client-side Vercel Blob upload failed/not active, falling back to server upload:`, err);
    }

    // 3. Fallback to standard server-side upload via Express /api/upload
    return await uploadSingleFile(file, type);
  }

  // Helper to upload a single file
  async function uploadSingleFile(file, type) {
    const fileData = new FormData();
    fileData.append('file', file);

    const response = await fetch(`/api/upload?type=${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: fileData
    });

    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `Failed to upload ${type}`);
    }

    const data = await response.json();
    return data.url;
  }

  // Submit form
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titleVal = document.getElementById('title').value.trim();
    const artistVal = document.getElementById('artist').value.trim();
    const descVal = document.getElementById('description').value.trim();

    const imgFile = imageInput.files[0];
    const targetFile = targetInput.files[0];
    const vidFile = videoInput.files[0];

    if (!imgFile || !targetFile || !vidFile) {
      showToast('Please select all required files.', true);
      return;
    }

    // Show loading state
    submitBtn.disabled = true;

    try {
      // 1. Upload Target Image
      submitBtn.textContent = '1/4: Uploading target image...';
      const imageUrl = await smartUploadFile(imgFile, 'images');

      // 2. Upload Target .mind File
      submitBtn.textContent = '2/4: Uploading target .mind file...';
      const targetUrl = await smartUploadFile(targetFile, 'targets');

      // 3. Upload Video
      submitBtn.textContent = '3/4: Uploading overlay video (this may take a moment)...';
      const videoUrl = await smartUploadFile(vidFile, 'videos');

      // 4. Save Artwork Metadata
      submitBtn.textContent = '4/4: Creating AR experience...';
      const response = await fetch('/api/artworks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: titleVal,
          artist: artistVal,
          description: descVal,
          imageUrl,
          targetUrl,
          videoUrl
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create artwork');
      }

      const newArtwork = await response.json();
      showToast(`"${newArtwork.title}" created successfully!`);
      
      // Reset form & file name indicators
      uploadForm.reset();
      imageFileName.textContent = '';
      targetFileName.textContent = '';
      videoFileName.textContent = '';

      // Refresh list
      fetchArtworks();
    } catch (error) {
      console.error('Error creating artwork:', error);
      if (error.message !== 'Unauthorized') {
        showToast(error.message || 'Error creating artwork.', true);
      }
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create AR Experience';
    }
  });

  // Helper to show Toast notifications
  function showToast(message, isError = false) {
    toastMessage.textContent = message;
    if (isError) {
      toast.classList.add('error');
    } else {
      toast.classList.remove('error');
    }
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  // Initial Fetch
  fetchArtworks();
});
