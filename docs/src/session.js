console.log('storage?', typeof window !== 'undefined' && window.localStorage);

//avoid variable shadowing so the storage variable doesnt crash
const STORAGE =
  (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;

const KEY = 'lastActivityAt';
const MAX_IDLE_MS = 15 * 60 * 1000; // 15 minutes

export function markActivity() {
  if (!STORAGE) return;                      // guard: no storage available
  STORAGE.setItem(KEY, String(Date.now()));
}

export function isSessionExpired() {
  if (!STORAGE) return true;                 // if no storage, treat as expired
  const last = Number(STORAGE.getItem(KEY) || 0);
  return !last || (Date.now() - last) > MAX_IDLE_MS;
}

export function enforceSession() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const isLoginPage = path.endsWith('login.html') || path.endsWith('index.html') || path.endsWith('/') || path.endsWith('/docs');
  if (isSessionExpired()) {
    if (STORAGE) {
      STORAGE.removeItem('token');
      STORAGE.removeItem(KEY);
    }
    // Don't redirect or alert if already on the login page
    if (!isLoginPage) {
      alert('Session expired. Please sign in again.');
      window.location.href = 'index.html';
    }
    return;
  }
  markActivity(); // refresh timer on load
}

// keep-alive while user is active
['click','keydown','mousemove','scroll','touchstart'].forEach(evt => {
  window.addEventListener(evt, markActivity, { passive: true });
});
