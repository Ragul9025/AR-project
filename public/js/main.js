document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get('code');

  if (codeParam) {
    const manualCodeSection = document.getElementById('manualCodeSection');
    const directScanSection = document.getElementById('directScanSection');
    const directLoading = document.getElementById('directLoading');
    const directContent = document.getElementById('directContent');
    const directArtworkTitle = document.getElementById('directArtworkTitle');
    const directArtist = document.getElementById('directArtist');
    const directScanBtn = document.getElementById('directScanBtn');
    const directHeader = document.getElementById('directHeader');

    if (manualCodeSection && directScanSection) {
      manualCodeSection.style.display = 'none';
      directScanSection.style.display = 'block';

      const code = codeParam.trim().toUpperCase();

      fetch(`/api/artworks/code/${code}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Artwork not found');
          }
          return response.json();
        })
        .then(artwork => {
          if (directLoading) directLoading.style.display = 'none';
          if (directArtworkTitle) {
            directArtworkTitle.textContent = artwork.title;
            directArtworkTitle.style.color = 'var(--accent-cyan)';
          }
          if (directArtist) directArtist.textContent = `by ${artwork.artist}`;
          if (directContent) directContent.style.display = 'block';
          if (directScanBtn) {
            directScanBtn.style.display = 'block';
            directScanBtn.addEventListener('click', () => {
              directScanBtn.disabled = true;
              directScanBtn.textContent = 'Launching Scanner...';
              window.location.href = `/scan.html?id=${artwork.id}`;
            });
          }
        })
        .catch(err => {
          if (directLoading) directLoading.style.display = 'none';
          if (directHeader) directHeader.textContent = 'Error';
          if (directArtworkTitle) {
            directArtworkTitle.textContent = 'Artwork Not Found';
            directArtworkTitle.style.color = 'var(--accent-pink)';
          }
          if (directArtist) directArtist.textContent = 'The code in this link is invalid or the artwork was deleted.';
          if (directContent) directContent.style.display = 'block';
        });
      return;
    }
  }

  const codeForm = document.getElementById('codeForm');
  const charInputs = document.querySelectorAll('.code-char-input');
  const startBtn = document.getElementById('startBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Handle focus movement between inputs
  charInputs.forEach((input, index) => {
    // Move to next input on character entry
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length === 1 && index < charInputs.length - 1) {
        charInputs[index + 1].focus();
      }
    });

    // Move to previous input on backspace
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
        charInputs[index - 1].focus();
      }
    });

    // Support paste of entire 4-digit code
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text');
      const cleanData = pasteData.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
      
      if (cleanData.length > 0) {
        for (let i = 0; i < cleanData.length; i++) {
          if (charInputs[i]) {
            charInputs[i].value = cleanData[i];
          }
        }
        // Focus the last filled input or submit
        const focusIndex = Math.min(cleanData.length, charInputs.length - 1);
        charInputs[focusIndex].focus();
      }
    });
  });

  // Handle form submission
  codeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect full code
    let code = '';
    charInputs.forEach(input => {
      code += input.value;
    });
    code = code.trim().toUpperCase();

    if (code.length !== 4) {
      showToast('Please enter a valid 4-character code.', true);
      return;
    }

    startBtn.disabled = true;
    startBtn.textContent = 'Verifying Code...';

    try {
      const response = await fetch(`/api/artworks/code/${code}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invalid code. Artwork not found.');
        }
        throw new Error('Error verifying code. Please try again.');
      }

      const artwork = await response.json();
      showToast('Code verified! Launching AR Scanner...');
      
      // Redirect to scanner
      setTimeout(() => {
        window.location.href = `/scan.html?id=${artwork.id}`;
      }, 1000);

    } catch (error) {
      console.error('Error verifying code:', error);
      showToast(error.message || 'Verification failed.', true);
      
      // Reset inputs and focus first
      charInputs.forEach(input => {
        input.value = '';
      });
      charInputs[0].focus();
    } finally {
      startBtn.disabled = false;
      startBtn.textContent = 'Start AR Scanner';
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
});
