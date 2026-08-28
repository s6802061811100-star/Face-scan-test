// API Configuration and Shared Helpers for Face Recognition, GPS Attendance & Smart Meeting AI
const DEFAULT_API_URL = '/api';
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwkFTKnfM-DjUDg3uMjUl6JEyiCMk2fRofZzhJQlG19hDTXce4q9tQ-o_-rGjGBWu_h/exec';

function getApiUrl() {
  // IMPORTANT: Browser pages always call the Node/Express proxy.
  // The Google Apps Script URL is stored separately and used by the server.
  return DEFAULT_API_URL;
}

function getGasUrl() {
  const local = localStorage.getItem('gasApiUrl');
  if (local && local.trim()) return local.trim();
  return DEFAULT_GAS_URL;
}

const GAS_API_URL = DEFAULT_GAS_URL;

async function apiFetch(action, params = {}, method = 'GET') {
  const baseUrl = getApiUrl();
  try {
    if (method === 'GET') {
      const url = new URL(baseUrl, window.location.origin);
      url.searchParams.set('action', action);
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null) {
          url.searchParams.set(k, params[k]);
        }
      });
      const res = await fetch(url.toString());
      if (!res.ok) {
        let errJson;
        try { errJson = await res.json(); } catch {}
        if (errJson) return errJson;
        throw new Error(`HTTP error ${res.status}`);
      }
      return await res.json();
    } else {
      const payload = { action, ...params };
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        let errJson;
        try { errJson = await res.json(); } catch {}
        if (errJson) return errJson;
        throw new Error(`HTTP error ${res.status}`);
      }
      return await res.json();
    }
  } catch (err) {
    console.error(`[API Error] ${action}:`, err);
    throw err;
  }
}

// Global notification toast helper
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1';
  toast.style.cssText = `background:${bg};color:#fff;padding:12px 20px;border-radius:12px;font-family:'Sarabun',sans-serif;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,0.3);backdrop-filter:blur(8px);pointer-events:auto;animation:fadeInDown 0.3s ease;display:flex;align-items:center;gap:10px;`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span style="font-weight:bold;font-size:16px;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
