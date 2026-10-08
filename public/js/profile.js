// PROFILE PAGE
document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) { location.href = '/login.html'; return; }

  await loadProfile();
  await loadMyItems();

  // Tab switching
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active-all'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      tab.classList.add('active-all');
      document.getElementById(tab.dataset.panel).classList.remove('hidden');
    });
  });

  // Edit profile form
  document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.innerHTML = '<span class="loader"></span> Saving...';
    try {
      const updated = await api('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: document.getElementById('edit-name').value.trim(),
          phone: document.getElementById('edit-phone').value.trim(),
          college_id: document.getElementById('edit-colid').value.trim(),
          department: document.getElementById('edit-dept').value,
          year: document.getElementById('edit-year').value
        })
      });
      setAuth(getToken(), updated);
      toast('Profile Updated!', 'Your profile has been saved.', 'success');
      await loadProfile();
    } catch (err) { toast('Error', err.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '💾 Save Changes'; }
  });

  // Change password form
  document.getElementById('change-pass-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const np = document.getElementById('new-pass').value;
    const cp = document.getElementById('confirm-new-pass').value;
    if (np !== cp) { toast('Mismatch', 'New passwords do not match.', 'error'); return; }
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.innerHTML = '<span class="loader"></span> Updating...';
    try {
      await api('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: document.getElementById('cur-pass').value, new_password: np })
      });
      toast('Password Changed!', 'Your password has been updated.', 'success');
      e.target.reset();
    } catch (err) { toast('Error', err.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '🔐 Change Password'; }
  });
});

async function loadProfile() {
  try {
    const user = await api('/users/me');
    const initials = user.name?.split(' ').map(w=>w[0]).join('').toUpperCase() || 'U';
    document.getElementById('profile-avatar').textContent = initials;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
    const badges = document.getElementById('profile-badges');
    if (badges) badges.innerHTML = `
      ${user.department ? `<span class="profile-badge">🏛️ ${user.department}</span>` : ''}
      ${user.year ? `<span class="profile-badge">📅 Year ${user.year}</span>` : ''}
      ${user.college_id ? `<span class="profile-badge">🎓 ${user.college_id}</span>` : ''}
      <span class="profile-badge">📅 Joined ${new Date(user.created_at).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</span>
    `;
    // Prefill edit form
    if (document.getElementById('edit-name')) {
      document.getElementById('edit-name').value = user.name || '';
      document.getElementById('edit-phone').value = user.phone || '';
      document.getElementById('edit-colid').value = user.college_id || '';
      document.getElementById('edit-dept').value = user.department || '';
      document.getElementById('edit-year').value = user.year || '';
    }
  } catch (e) {}
}

async function loadMyItems() {
  try {
    const items = await api('/users/me/items');
    const lost = items.filter(i => i.type === 'lost');
    const found = items.filter(i => i.type === 'found');
    const resolved = items.filter(i => i.status === 'resolved');

    // Stats
    document.getElementById('stat-total').textContent = items.length;
    document.getElementById('stat-lost').textContent = lost.length;
    document.getElementById('stat-found').textContent = found.length;
    document.getElementById('stat-resolved').textContent = resolved.length;

    const allGrid = document.getElementById('my-items-grid');
    if (allGrid) {
      allGrid.innerHTML = items.length
        ? items.map(item => buildMyItemRow(item)).join('')
        : '<div class="empty-state"><div class="empty-icon">📭</div><h3>No items yet</h3><p>Post your first lost or found item!</p><a href="/post.html" class="btn btn-primary">+ Post Item</a></div>';
    }
  } catch (e) {}
}

function buildMyItemRow(item) {
  const icon = getCategoryIcon(item.category);
  return `
    <div class="card" style="padding:1rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap" id="my-item-${item.id}">
      <div style="font-size:1.8rem;width:48px;text-align:center">${icon}</div>
      <div style="flex:1;min-width:160px">
        <div class="item-card-tags mb-1">
          <span class="tag ${item.type==='lost'?'tag-lost':'tag-found'}">${item.type==='lost'?'🔴 Lost':'🟢 Found'}</span>
          ${item.status==='resolved'?'<span class="tag tag-resolved">✅ Resolved</span>':''}
        </div>
        <div style="font-weight:700;font-size:0.95rem">${item.title}</div>
        <div style="font-size:0.78rem;color:var(--text-muted)">${item.location} • ${timeAgo(item.created_at)}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a href="/item.html?id=${item.id}" class="btn btn-ghost btn-sm">👁️ View</a>
        ${item.status==='active'
          ? `<button type="button" class="btn btn-found btn-sm" onclick="quickResolve('${item.id}', 'resolved')">✅ Resolve</button>`
          : `<button type="button" class="btn btn-ghost btn-sm" onclick="quickResolve('${item.id}', 'active')">↩️ Re-open</button>`}
        <button type="button" class="btn btn-danger btn-sm" onclick="quickDelete('${item.id}')">🗑️</button>
      </div>
    </div>
  `;
}

// Explicitly attach to window
window.quickResolve = async function(id, targetStatus) {
  const isResolving = targetStatus !== 'active';
  showModal({
    title: isResolving ? 'Mark as Resolved?' : 'Re-open Listing?',
    body: isResolving ? 'Item will be marked as returned/claimed.' : 'Item will be marked active in listings again.',
    confirmText: isResolving ? 'Resolve!' : 'Re-open',
    onConfirm: async () => {
      try {
        await api(`/items/${id}/resolve`, {
          method: 'PATCH',
          body: JSON.stringify({ status: targetStatus || (isResolving ? 'resolved' : 'active') })
        });
        toast(isResolving ? 'Resolved! 🎉' : 'Re-opened! 🔄', '', 'success');
        await loadMyItems();
      } catch(e) {
        toast('Error', e.message, 'error');
      }
    }
  });
};

window.quickDelete = async function(id) {
  showModal({
    title: 'Delete Item?',
    body: 'This will permanently delete the item.',
    danger: true,
    confirmText: 'Delete',
    onConfirm: async () => {
      try {
        await api(`/items/${id}`, { method: 'DELETE' });
        document.getElementById(`my-item-${id}`)?.remove();
        toast('Deleted', 'Item removed successfully.', 'info');
        await loadMyItems();
      } catch(e) {
        toast('Error', e.message, 'error');
      }
    }
  });
};
