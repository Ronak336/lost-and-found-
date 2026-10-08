// POST & EDIT ITEM PAGE
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');

  const form = document.getElementById('post-form');
  const catSelect = document.getElementById('item-category');
  const typeToggle = document.querySelectorAll('.type-toggle-btn');
  let selectedType = 'lost';

  // Build category options
  if (catSelect) {
    CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = `${getCategoryIcon(cat)} ${cat}`;
      catSelect.appendChild(opt);
    });
  }

  // Type selection
  function setType(type) {
    selectedType = type === 'found' ? 'found' : 'lost';
    typeToggle.forEach(b => {
      b.classList.remove('active-lost','active-found','active');
      if (b.dataset.type === selectedType) {
        b.classList.add(selectedType === 'lost' ? 'active-lost' : 'active-found');
      }
    });
    const indicator = document.getElementById('type-indicator');
    if (indicator) {
      indicator.textContent = selectedType === 'lost' ? '🔴 Reporting a Lost Item' : '🟢 Reporting a Found Item';
      indicator.style.color = selectedType === 'lost' ? 'var(--accent-lost)' : 'var(--accent-found)';
    }
  }

  typeToggle.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setType(btn.dataset.type);
    });
  });

  // Pre-fill today's date automatically
  const dateInput = document.getElementById('item-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.max = today;
    if (!dateInput.value) dateInput.value = today;
  }

  // Image preview & Drag-drop
  const imageInput = document.getElementById('item-image');
  const uploadArea = document.getElementById('upload-area');
  const preview = document.getElementById('image-preview');
  const previewImg = document.getElementById('preview-img');

  if (imageInput) {
    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          if (previewImg) previewImg.src = e.target.result;
          if (preview) preview.style.display = 'block';
          const uploadContent = uploadArea?.querySelector('.upload-content');
          if (uploadContent) uploadContent.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });

    uploadArea?.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea?.addEventListener('drop', e => {
      e.preventDefault(); uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files[0]) {
        imageInput.files = e.dataTransfer.files;
        imageInput.dispatchEvent(new Event('change'));
      }
    });
  }

  // Prefill default user contact details
  const me = getUser();
  if (me) {
    const emailField = document.getElementById('item-contact-email');
    const phoneField = document.getElementById('item-contact-phone');
    if (emailField && !emailField.value && !editId) emailField.value = me.email || '';
    if (phoneField && !phoneField.value && !editId) phoneField.value = me.phone || '';
  }

  // IF EDIT MODE: Prefill existing item data
  if (editId) {
    const pageTitle = document.querySelector('.post-header h1, h1');
    const submitBtn = form?.querySelector('button[type=submit]');
    if (pageTitle) pageTitle.textContent = '✏️ Edit Item Listing';
    if (submitBtn) submitBtn.textContent = '💾 Save Changes';

    try {
      const item = await api(`/items/${editId}`);
      if (item) {
        setType(item.type || 'lost');
        if (document.getElementById('item-title')) document.getElementById('item-title').value = item.title || '';
        if (document.getElementById('item-desc')) document.getElementById('item-desc').value = item.description || '';
        if (document.getElementById('item-category')) document.getElementById('item-category').value = item.category || 'Other';
        if (document.getElementById('item-location')) document.getElementById('item-location').value = item.location || '';
        if (document.getElementById('item-date')) document.getElementById('item-date').value = item.date_lost_found || '';
        if (document.getElementById('item-contact-email')) document.getElementById('item-contact-email').value = item.contact_email || '';
        if (document.getElementById('item-contact-phone')) document.getElementById('item-contact-phone').value = item.contact_phone || '';

        if (item.image_url && preview && previewImg) {
          previewImg.src = item.image_url;
          preview.style.display = 'block';
          const uploadContent = uploadArea?.querySelector('.upload-content');
          if (uploadContent) uploadContent.style.display = 'none';
        }
      }
    } catch (err) {
      toast('Error', 'Failed to load item for editing.', 'error');
    }
  }

  // Submit Handler (Create or Update)
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = editId ? '<span class="loader"></span> Saving...' : '<span class="loader"></span> Posting...';
    }

    const titleVal = document.getElementById('item-title')?.value.trim() || '';
    if (!titleVal) {
      toast('Title Required', 'Please enter a title for the item.', 'warning');
      if (btn) { btn.disabled = false; btn.innerHTML = editId ? '💾 Save Changes' : '🚀 Post Item'; }
      return;
    }

    const catVal = document.getElementById('item-category')?.value || 'Other';
    const locVal = document.getElementById('item-location')?.value.trim() || 'College Campus';
    const dateVal = document.getElementById('item-date')?.value || new Date().toISOString().split('T')[0];
    const descVal = document.getElementById('item-desc')?.value.trim() || '';
    const emailVal = document.getElementById('item-contact-email')?.value.trim() || (me ? me.email : 'student@college.edu');
    const phoneVal = document.getElementById('item-contact-phone')?.value.trim() || '';

    const formData = new FormData();
    formData.append('type', selectedType);
    formData.append('title', titleVal);
    formData.append('description', descVal);
    formData.append('category', catVal);
    formData.append('location', locVal);
    formData.append('date_lost_found', dateVal);
    formData.append('contact_email', emailVal);
    formData.append('contact_phone', phoneVal);

    const imgFile = document.getElementById('item-image')?.files[0];
    if (imgFile) formData.append('image', imgFile);

    try {
      if (editId) {
        const item = await api(`/items/${editId}`, { method: 'PUT', body: formData });
        toast('Updated! 🎉', 'Your item listing has been updated.', 'success');
        setTimeout(() => location.href = `/item.html?id=${item.id}`, 800);
      } else {
        const item = await api('/items', { method: 'POST', body: formData });
        toast('Item Posted! 🎉', 'Your item has been successfully reported!', 'success');
        setTimeout(() => location.href = `/item.html?id=${item.id}`, 800);
      }
    } catch (err) {
      toast('Failed to Post', err.message || 'Something went wrong while posting.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = editId ? '💾 Save Changes' : '🚀 Post Item';
      }
    }
  });
});
