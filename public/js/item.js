// ITEM DETAIL PAGE
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) { location.href = '/dashboard.html'; return; }

  const content = document.getElementById('item-content');

  try {
    const item = await api(`/items/${id}`);
    const me = getUser();
    const icon = getCategoryIcon(item.category);
    const initials = item.user_name?.split(' ').map(w => w[0]).join('').toUpperCase() || 'U';

    document.title = `${item.title} | Smart Campus Lost & Found`;

    const imgHtml = item.image_url
      ? `<img src="${item.image_url}" alt="${item.title}" class="detail-image">`
      : `<div class="detail-image-placeholder">${icon}</div>`;

    const contactHtml = `
      <div class="contact-details">
        <div class="contact-item">📧 <span>${item.contact_email || 'student@college.edu'}</span></div>
        ${item.contact_phone ? `<div class="contact-item">📞 <span>${item.contact_phone}</span></div>` : ''}
        ${item.user_dept ? `<div class="contact-item">🏛️ <span>${item.user_dept}</span></div>` : ''}
      </div>
    `;

    // ACTION BUTTONS: ALWAYS PROMINENTLY VISIBLE
    const actionControls = `
      <div class="divider"></div>
      <div style="margin-bottom:0.75rem;font-size:0.82rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.06em">
        ⚙️ Manage Listing
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${item.status === 'active'
          ? `<button type="button" class="btn btn-found btn-full" onclick="resolveItem('${item.id}', 'resolved')" style="font-size:0.95rem;padding:0.75rem">
              ✅ Mark as Resolved (Problem Solved)
            </button>`
          : `<button type="button" class="btn btn-ghost btn-full" onclick="resolveItem('${item.id}', 'active')" style="font-size:0.95rem;padding:0.75rem">
              ↩️ Re-open Listing (Active)
            </button>`}
        <a href="/post.html?edit=${item.id}" class="btn btn-ghost btn-full">
          ✏️ Edit Listing Details
        </a>
        <button type="button" class="btn btn-danger btn-full" onclick="deleteItem('${item.id}')">
          🗑️ Remove / Delete Item
        </button>
        <button type="button" class="btn btn-ghost btn-full" onclick="shareItemLink()" style="font-size:0.85rem">
          🔗 Copy Share Link
        </button>
      </div>
    `;

    content.innerHTML = `
      <div class="detail-grid">
        <div>
          ${imgHtml}
          <div class="item-card-tags mt-2">
            <span class="tag ${item.type === 'lost' ? 'tag-lost' : 'tag-found'}">${item.type === 'lost' ? '🔴 Lost' : '🟢 Found'}</span>
            <span class="tag tag-category">${icon} ${item.category}</span>
            ${item.status === 'resolved' ? '<span class="tag tag-resolved">✅ Resolved</span>' : ''}
          </div>
          <h1 class="detail-title">${item.title}</h1>
          <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.7">${item.description || 'No detailed description provided.'}</p>
          <div class="detail-meta-list mt-2">
            <div class="detail-meta-item"><span class="meta-icon">📍</span><div><strong>Location</strong><br>${item.location}</div></div>
            <div class="detail-meta-item"><span class="meta-icon">📅</span><div><strong>Date ${item.type === 'lost' ? 'Lost' : 'Found'}</strong><br>${formatDate(item.date_lost_found)}</div></div>
            <div class="detail-meta-item"><span class="meta-icon">🕐</span><div><strong>Posted</strong><br>${timeAgo(item.created_at)}</div></div>
            <div class="detail-meta-item"><span class="meta-icon">👁️</span><div><strong>Views</strong><br>${item.views || 0} students viewed</div></div>
          </div>
        </div>
        <div>
          <div class="contact-card">
            <h3>👤 Posted By</h3>
            <div class="poster-avatar">${initials}</div>
            <div class="poster-name">${item.user_name || 'Campus Student'}</div>
            <div class="poster-dept">${item.user_dept || 'Student'}</div>
            <div class="divider"></div>
            <h3>📞 Contact Details</h3>
            ${contactHtml}
            ${actionControls}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `
      <div class="empty-state" style="padding:6rem 2rem">
        <div class="empty-icon">😕</div>
        <h3>Item not found</h3>
        <p>${err.message}</p>
        <a href="/dashboard.html" class="btn btn-primary">← Back to Dashboard</a>
      </div>
    `;
  }
});

// Explicitly bind to window so onclick handlers are always available
window.resolveItem = async function(id, targetStatus) {
  const isResolving = targetStatus !== 'active';
  showModal({
    title: isResolving ? '✅ Mark as Resolved?' : '↩️ Re-open Listing?',
    body: isResolving
      ? 'This will mark the item as returned or claimed, indicating the problem is solved!'
      : 'This will re-open the item and display it in active listings again.',
    confirmText: isResolving ? 'Yes, Mark Resolved!' : 'Re-open Listing',
    onConfirm: async () => {
      try {
        await api(`/items/${id}/resolve`, {
          method: 'PATCH',
          body: JSON.stringify({ status: targetStatus || (isResolving ? 'resolved' : 'active') })
        });
        toast(isResolving ? 'Problem Resolved! 🎉' : 'Listing Re-opened! 🔄', isResolving ? 'Item has been marked as resolved!' : 'Item is active again!', 'success');
        setTimeout(() => location.reload(), 700);
      } catch (err) {
        toast('Error', err.message, 'error');
      }
    }
  });
};

window.deleteItem = async function(id) {
  showModal({
    title: '🗑️ Remove / Delete Item?',
    body: 'Are you sure you want to remove this item listing? It will be permanently deleted from the portal.',
    confirmText: 'Yes, Remove It',
    danger: true,
    onConfirm: async () => {
      try {
        await api(`/items/${id}`, { method: 'DELETE' });
        toast('Item Removed! 🗑️', 'The item listing has been deleted.', 'info');
        setTimeout(() => location.href = '/dashboard.html', 800);
      } catch (err) {
        toast('Error', err.message, 'error');
      }
    }
  });
};

window.shareItemLink = function() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(location.href);
    toast('Link Copied! 📋', 'Item URL copied to clipboard.', 'success');
  } else {
    toast('Share URL', location.href, 'info');
  }
};
