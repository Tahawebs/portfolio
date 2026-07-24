/* =========================================================
   ADMIN AUTH
   ---------------------------------------------------------
   There is no visible "login" link anywhere on the site.
   To open the login box, type  admin  anywhere on the page
   (no need to click into a field first) — or press
   Ctrl+Alt+L. Default sign-in is username "ataha", password
   "0126". Change both from the admin panel after your first
   login (Admin bar → "Change username/password").

   HOW THIS WORKS
   -------------------------------------------------------
   - The password is never stored or compared in plain text —
     only a SHA-256 hash of "username:password" is kept in
     localStorage, and the hash is what gets compared.
   - A logged-in session lasts 12 hours, stored in this
     browser's localStorage, then expires automatically.
   - Please read this honestly: this is a *static* site with
     no server, so this login is "hidden + hashed", not
     bulletproof — anyone who really digs into the page's
     source code could find this file. It's built to stop
     casual visitors from finding or guessing your way into
     edit mode, not a determined attacker. Don't reuse a
     password here that matters anywhere else.
   ========================================================= */

const Auth = (function () {
  const CRED_KEY = 'mt-admin-cred';       // sha256("user:pass")
  const SESSION_KEY = 'mt-admin-session'; // { exp: timestamp }
  const ATTEMPTS_KEY = 'mt-admin-attempts';
  const EVENT = 'mt:authchange';
  const SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours
  const LOCKOUT_MS = 60 * 1000;
  const MAX_ATTEMPTS = 5;
  const DEFAULT_HASH = '47cdef21f20d3fa467ba59396b03a901384cd41ad6589e429d7d79a4e9e40d91'; // sha256("ataha:0126")

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function getCredHash() {
    return localStorage.getItem(CRED_KEY) || DEFAULT_HASH;
  }

  function getAttempts() {
    try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY)) || { count: 0, lockUntil: 0 }; }
    catch { return { count: 0, lockUntil: 0 }; }
  }
  function setAttempts(a) { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(a)); }

  function isLoggedIn() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      return !!(s && s.exp && s.exp > Date.now());
    } catch { return false; }
  }

  function startSession() {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ exp: Date.now() + SESSION_MS }));
    setAttempts({ count: 0, lockUntil: 0 });
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { loggedIn: true } }));
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { loggedIn: false } }));
  }

  async function attemptLogin(username, password) {
    const a = getAttempts();
    if (a.lockUntil && a.lockUntil > Date.now()) {
      const secs = Math.ceil((a.lockUntil - Date.now()) / 1000);
      return { ok: false, message: `Too many attempts. Try again in ${secs}s.` };
    }
    const hash = await sha256(`${username.trim()}:${password}`);
    if (hash === getCredHash()) {
      startSession();
      return { ok: true };
    }
    const count = (a.count || 0) + 1;
    const lockUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
    setAttempts({ count: lockUntil ? 0 : count, lockUntil });
    return {
      ok: false,
      message: lockUntil ? 'Too many attempts. Locked for 60s.' : 'Incorrect username or password.'
    };
  }

  async function changeCredentials(username, password) {
    if (!username.trim() || password.length < 4) {
      throw new Error('Username required and password must be at least 4 characters.');
    }
    const hash = await sha256(`${username.trim()}:${password}`);
    localStorage.setItem(CRED_KEY, hash);
  }

  // ---- Hidden triggers: type "admin" anywhere, or Ctrl+Alt+L ----
  let buffer = '';
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l') {
      window.dispatchEvent(new CustomEvent('mt:openlogin'));
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length !== 1) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-5);
    if (buffer === 'admin') {
      buffer = '';
      window.dispatchEvent(new CustomEvent('mt:openlogin'));
    }
  });

  return { EVENT, isLoggedIn, attemptLogin, changeCredentials, logout };
})();
