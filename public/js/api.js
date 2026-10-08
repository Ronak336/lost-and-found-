// ===================== API HELPER =====================
const BASE = '/api';

function getToken() { return localStorage.getItem('lf_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('lf_user')); } catch { return null; }
}
function setAuth(token, user) {
  localStorage.setItem('lf_token', token);
  localStorage.setItem('lf_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('lf_token');
  localStorage.removeItem('lf_user');
}
function isLoggedIn() { return !!getToken(); }

async function api(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + endpoint, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

// ===================== TOAST =====================
function toast(title, msg = '', type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
  `;
  container.appendChild(t);
  setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 400); }, 3500);
}

// ===================== MODAL =====================
function showModal({ title, body, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, danger = false }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3 class="modal-title">${title}</h3>
      <p class="modal-body">${body}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modal-cancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">${confirmText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#modal-confirm').onclick = () => { overlay.remove(); onConfirm && onConfirm(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ===================== UTILS =====================
function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
}

const CATEGORIES = ['Electronics','Books','ID Cards','Keys','Clothing','Bags','Accessories','Sports','Stationery','Documents','Wallet','Other'];
const CATEGORY_ICONS = { Electronics:'💻', Books:'📚', 'ID Cards':'🪪', Keys:'🔑', Clothing:'👕', Bags:'🎒', Accessories:'⌚', Sports:'⚽', Stationery:'✏️', Documents:'📄', Wallet:'👛', Other:'📦' };
const TYPE_COLORS = { lost: 'tag-lost', found: 'tag-found', resolved: 'tag-resolved' };

function getCategoryIcon(cat) { return CATEGORY_ICONS[cat] || '📦'; }

function buildItemCard(item) {
  const icon = getCategoryIcon(item.category);
  const imgHtml = item.image_url
    ? `<img class="item-card-img" src="${item.image_url}" alt="${item.title}" loading="lazy">`
    : `<div class="item-card-img-placeholder">${icon}</div>`;
  return `
    <div class="card item-card" onclick="location.href='/item.html?id=${item.id}'" id="item-${item.id}">
      ${imgHtml}
      <div class="item-card-body">
        <div class="item-card-tags">
          <span class="tag ${TYPE_COLORS[item.type]}">${item.type === 'lost' ? '🔴 Lost' : '🟢 Found'}</span>
          <span class="tag tag-category">${icon} ${item.category}</span>
          ${item.status === 'resolved' ? '<span class="tag tag-resolved">✅ Resolved</span>' : ''}
        </div>
        <h3 class="item-card-title">${item.title}</h3>
        <p class="item-card-desc">${item.description || 'No description provided.'}</p>
        <div class="item-card-meta">
          <span>📍 ${item.location}</span>
          <span>🕐 ${timeAgo(item.created_at)}</span>
          ${item.user_name ? `<span>👤 ${item.user_name}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ===================== NAVBAR =====================
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile hamburger
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Auth state
  updateNavAuth();

  // Notifications
  const notifBtn = document.getElementById('notif-btn');
  if (notifBtn && isLoggedIn()) {
    loadNotifications();
    notifBtn.addEventListener('click', toggleNotifDropdown);
  }
}

function updateNavAuth() {
  const authBtns = document.getElementById('nav-auth-btns');
  const authUser = document.getElementById('nav-auth-user');
  const notifBtn = document.getElementById('notif-btn');
  const user = getUser();

  if (isLoggedIn() && user) {
    if (authBtns) authBtns.classList.add('hidden');
    if (authUser) {
      authUser.classList.remove('hidden');
      const avatar = authUser.querySelector('.nav-avatar');
      if (avatar) avatar.textContent = user.name?.charAt(0)?.toUpperCase() || 'U';
    }
    if (notifBtn) notifBtn.classList.remove('hidden');
  } else {
    if (authBtns) authBtns.classList.remove('hidden');
    if (authUser) authUser.classList.add('hidden');
    if (notifBtn) notifBtn.classList.add('hidden');
  }
}

async function loadNotifications() {
  try {
    const notifs = await api('/users/me/notifications');
    const unread = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
    window._notifications = notifs;
  } catch (e) {}
}

function toggleNotifDropdown() {
  let dropdown = document.getElementById('notif-dropdown');
  if (dropdown) { dropdown.remove(); return; }

  const notifs = window._notifications || [];
  const notifBtn = document.getElementById('notif-btn');
  const container = notifBtn.parentElement;
  container.style.position = 'relative';

  dropdown = document.createElement('div');
  dropdown.className = 'notif-dropdown';
  dropdown.id = 'notif-dropdown';
  dropdown.innerHTML = `
    <div class="notif-header">
      <h4>🔔 Notifications</h4>
      <button class="btn btn-sm btn-ghost" onclick="markNotifsRead()">Mark all read</button>
    </div>
    <div class="notif-list">
      ${notifs.length ? notifs.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}">
          <p>${n.message}</p>
          <div class="notif-time">${timeAgo(n.created_at)}</div>
        </div>
      `).join('') : '<div style="padding:1.5rem;text-align:center;color:var(--text-muted)">No notifications</div>'}
    </div>
  `;
  container.appendChild(dropdown);

  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!dropdown.contains(e.target) && e.target !== notifBtn) {
        dropdown.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 100);
}

async function markNotifsRead() {
  try {
    await api('/users/me/notifications/read', { method: 'PATCH' });
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = 'none';
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) dropdown.remove();
  } catch (e) {}
}

function logout() {
  clearAuth();
  toast('Logged out', 'See you soon!', 'info');
  setTimeout(() => location.href = '/', 800);
}

// Init on load
document.addEventListener('DOMContentLoaded', initNavbar);
