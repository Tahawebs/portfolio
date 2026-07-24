/* =========================================================
   ADMIN UI — shared across index.html and project.html
   ---------------------------------------------------------
   Builds the login modal + admin toolbar, tracks edit-mode
   state, and exposes small helpers (editable text binding,
   add/remove list rendering, image upload) used by
   site-render.js, main.js and project-detail.js.
   ========================================================= */

const AdminUI = (function () {
  const EDIT_MODE_KEY = 'mt-edit-mode';
  let toastTimer = null;

  function toast(msg, isError) {
    let el = document.getElementById('mt-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mt-toast';
      el.className = 'admin-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function isEditMode() {
    return Auth.isLoggedIn() && localStorage.getItem(EDIT_MODE_KEY) === '1';
  }
  function setEditMode(on) {
    localStorage.setItem(EDIT_MODE_KEY, on ? '1' : '0');
    document.body.classList.toggle('admin-editing', on && Auth.isLoggedIn());
    window.dispatchEvent(new CustomEvent('mt:editmodechange', { detail: { on } }));
  }

  /* ---------------- Login modal ---------------- */
  function buildLoginModal() {
    if (document.getElementById('mt-login-overlay')) return;
    const wrap = document.createElement('div');
    wrap.id = 'mt-login-overlay';
    wrap.className = 'admin-modal-overlay';
    wrap.innerHTML = `
      <div class="admin-modal" role="dialog" aria-label="Admin sign in">
        <button type="button" class="admin-modal-close" data-close aria-label="Close">×</button>
        <div class="admin-modal-title">Admin sign in</div>
        <p class="admin-modal-sub">This area is for the site owner only.</p>
        <form id="mt-login-form">
          <label class="admin-field">
            <span>Username</span>
            <input type="text" name="username" autocomplete="username" required>
          </label>
          <label class="admin-field">
            <span>Password</span>
            <input type="password" name="password" autocomplete="current-password" required>
          </label>
          <div class="admin-modal-error" id="mt-login-error"></div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:6px;">Sign in</button>
        </form>
      </div>`;
    document.body.appendChild(wrap);

    wrap.addEventListener('click', (e) => { if (e.target === wrap) closeLogin(); });
    wrap.querySelector('[data-close]').addEventListener('click', closeLogin);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLogin(); });

    wrap.querySelector('#mt-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const errEl = document.getElementById('mt-login-error');
      errEl.textContent = '';
      const res = await Auth.attemptLogin(fd.get('username') || '', fd.get('password') || '');
      if (res.ok) {
        closeLogin();
        e.target.reset();
        toast('Signed in. Admin bar is bottom-right.');
      } else {
        errEl.textContent = res.message;
      }
    });
  }
  function openLogin() {
    if (Auth.isLoggedIn()) { toast('Already signed in.'); return; }
    buildLoginModal();
    document.getElementById('mt-login-overlay').classList.add('open');
    setTimeout(() => document.querySelector('#mt-login-form input[name="username"]')?.focus(), 50);
  }
  function closeLogin() {
    document.getElementById('mt-login-overlay')?.classList.remove('open');
  }
  window.addEventListener('mt:openlogin', openLogin);

  /* ---------------- Admin toolbar ---------------- */
  function buildToolbar() {
    if (document.getElementById('mt-admin-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'mt-admin-bar';
    bar.className = 'admin-bar';
    bar.innerHTML = `
      <div class="admin-bar-row">
        <span class="admin-bar-label">Admin</span>
        <label class="admin-switch">
          <input type="checkbox" id="mt-edit-toggle">
          <span>Edit mode</span>
        </label>
      </div>
      <div class="admin-bar-row admin-bar-actions">
        <button type="button" class="admin-bar-btn primary" data-action="publish">Publish to GitHub</button>
        <button type="button" class="admin-bar-btn" data-action="export">Export data</button>
        <button type="button" class="admin-bar-btn" data-action="import">Import data</button>
        <button type="button" class="admin-bar-btn" data-action="creds">Change login</button>
        <button type="button" class="admin-bar-btn" data-action="reset">Reset edits</button>
        <button type="button" class="admin-bar-btn danger" data-action="logout">Log out</button>
      </div>
      <input type="file" id="mt-import-input" accept="application/json" hidden>
    `;
    document.body.appendChild(bar);

    const toggle = bar.querySelector('#mt-edit-toggle');
    toggle.checked = isEditMode();
    toggle.addEventListener('change', () => setEditMode(toggle.checked));

    bar.querySelector('[data-action="export"]').addEventListener('click', () => {
      Store.exportJSON();
      toast('Downloaded portfolio-data.json');
    });
    bar.querySelector('[data-action="import"]').addEventListener('click', () => {
      bar.querySelector('#mt-import-input').click();
    });
    bar.querySelector('#mt-import-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        Store.importJSON(JSON.parse(text));
        toast('Data imported. Reloading…');
        setTimeout(() => location.reload(), 700);
      } catch (err) {
        toast(err.message || 'Import failed.', true);
      }
      e.target.value = '';
    });
    bar.querySelector('[data-action="reset"]').addEventListener('click', () => {
      if (confirm('Reset all admin edits in this browser back to the shipped defaults?')) {
        Store.resetToDefaults();
        toast('Reset to defaults. Reloading…');
        setTimeout(() => location.reload(), 700);
      }
    });
    bar.querySelector('[data-action="logout"]').addEventListener('click', () => {
      Auth.logout();
      toast('Signed out.');
    });
    bar.querySelector('[data-action="creds"]').addEventListener('click', openCredsModal);
    bar.querySelector('[data-action="publish"]').addEventListener('click', openPublishModal);
  }

  /* ---------------- GitHub publish modal ---------------- */
  function openPublishModal() {
    if (document.getElementById('mt-publish-overlay')) {
      document.getElementById('mt-publish-overlay').classList.add('open');
      return;
    }
    const cfg = GitHubPublish.getConfig() || {};
    const hasToken = !!GitHubPublish.getToken();
    const wrap = document.createElement('div');
    wrap.id = 'mt-publish-overlay';
    wrap.className = 'admin-modal-overlay open';
    wrap.innerHTML = `
      <div class="admin-modal" role="dialog" aria-label="Publish to GitHub">
        <button type="button" class="admin-modal-close" data-close>×</button>
        <div class="admin-modal-title">Publish to GitHub</div>
        <p class="admin-modal-sub">Commits your current edits straight to <code>site-data.js</code> and <code>projects-data.js</code> in your repo. GitHub Pages / Vercel then redeploy on their own — no git commands needed.</p>
        <form id="mt-publish-form">
          <label class="admin-field"><span>GitHub username / org</span><input type="text" name="owner" value="${cfg.owner || ''}" placeholder="e.g. muhammad-taha" required></label>
          <label class="admin-field"><span>Repository name</span><input type="text" name="repo" value="${cfg.repo || ''}" placeholder="e.g. portfolio" required></label>
          <label class="admin-field"><span>Branch</span><input type="text" name="branch" value="${cfg.branch || 'main'}" required></label>
          <label class="admin-field"><span>Path to site-data.js</span><input type="text" name="sitePath" value="${cfg.sitePath || 'js/site-data.js'}" required></label>
          <label class="admin-field"><span>Path to projects-data.js</span><input type="text" name="projectsPath" value="${cfg.projectsPath || 'js/projects-data.js'}" required></label>
          <label class="admin-field">
            <span>Personal access token ${hasToken ? '(saved — leave blank to keep it)' : ''}</span>
            <input type="password" name="token" placeholder="${hasToken ? '••••••••••••' : 'github_pat_…'}" autocomplete="off">
          </label>
          <p class="admin-modal-hint">Use a <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">fine-grained token</a> scoped to just this repo, with Contents: Read and write. It's stored only in this browser.</p>
          <div class="admin-modal-error" id="mt-publish-error"></div>
          <div class="admin-modal-actions">
            <button type="button" class="admin-bar-btn" id="mt-forget-token">Forget token</button>
            <button type="submit" class="btn btn-primary" id="mt-publish-submit">Save & publish now</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.classList.remove('open'); });
    wrap.querySelector('[data-close]').addEventListener('click', () => wrap.classList.remove('open'));
    wrap.querySelector('#mt-forget-token').addEventListener('click', () => {
      GitHubPublish.forgetToken();
      toast('Token removed from this browser.');
    });
    wrap.querySelector('#mt-publish-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const newCfg = {
        owner: fd.get('owner').trim(),
        repo: fd.get('repo').trim(),
        branch: fd.get('branch').trim() || 'main',
        sitePath: fd.get('sitePath').trim(),
        projectsPath: fd.get('projectsPath').trim()
      };
      const tokenInput = fd.get('token').trim();
      GitHubPublish.saveConfig(newCfg);
      if (tokenInput) GitHubPublish.saveToken(tokenInput);

      const errEl = document.getElementById('mt-publish-error');
      const submitBtn = document.getElementById('mt-publish-submit');
      errEl.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Publishing…';
      try {
        const url = await GitHubPublish.publish();
        wrap.classList.remove('open');
        toast('Published! Your host should redeploy within a minute or two.');
        console.log('View the commit:', url);
      } catch (err) {
        errEl.textContent = err.message || 'Publish failed.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save & publish now';
      }
    });
  }

  function openCredsModal() {
    if (document.getElementById('mt-creds-overlay')) {
      document.getElementById('mt-creds-overlay').classList.add('open');
      return;
    }
    const wrap = document.createElement('div');
    wrap.id = 'mt-creds-overlay';
    wrap.className = 'admin-modal-overlay open';
    wrap.innerHTML = `
      <div class="admin-modal" role="dialog" aria-label="Change login">
        <button type="button" class="admin-modal-close" data-close>×</button>
        <div class="admin-modal-title">Change username & password</div>
        <p class="admin-modal-sub">This replaces the default sign-in for this deployment.</p>
        <form id="mt-creds-form">
          <label class="admin-field"><span>New username</span><input type="text" name="username" required></label>
          <label class="admin-field"><span>New password (min 4 chars)</span><input type="password" name="password" minlength="4" required></label>
          <div class="admin-modal-error" id="mt-creds-error"></div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:6px;">Save</button>
        </form>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.classList.remove('open'); });
    wrap.querySelector('[data-close]').addEventListener('click', () => wrap.classList.remove('open'));
    wrap.querySelector('#mt-creds-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await Auth.changeCredentials(fd.get('username'), fd.get('password'));
        wrap.classList.remove('open');
        toast('Login updated. Use it next time you sign in.');
        e.target.reset();
      } catch (err) {
        document.getElementById('mt-creds-error').textContent = err.message;
      }
    });
  }

  /* ---------------- Profile popup (click name/logo) ---------------- */
  function initialsOf(name) {
    return (name || 'MT').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function syncBrand() {
    const profile = Store.getProfile();
    document.querySelectorAll('#brand-mark').forEach((mark) => {
      mark.innerHTML = profile.avatar
        ? `<img src="${profile.avatar}" alt="${profile.name || 'Profile photo'}">`
        : initialsOf(profile.name);
    });
    document.querySelectorAll('#brand-name').forEach((n) => { n.textContent = profile.name || 'Muhammad Taha'; });
  }

  function openProfileModal() {
    if (document.getElementById('mt-profile-overlay')) {
      document.getElementById('mt-profile-overlay').classList.add('open');
      renderProfileModalContent();
      return;
    }
    const wrap = document.createElement('div');
    wrap.id = 'mt-profile-overlay';
    wrap.className = 'admin-modal-overlay open';
    wrap.innerHTML = `<div class="admin-modal profile-modal" role="dialog" aria-label="Profile"><button type="button" class="admin-modal-close" data-close>×</button><div id="mt-profile-body"></div></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.classList.remove('open'); });
    wrap.querySelector('[data-close]').addEventListener('click', () => wrap.classList.remove('open'));
    renderProfileModalContent();
  }

  function renderProfileModalContent() {
    const body = document.getElementById('mt-profile-body');
    if (!body) return;
    const profile = Store.getProfile();
    body.innerHTML = `
      <div class="profile-modal-avatar" id="profile-modal-avatar">
        ${profile.avatar ? `<img src="${profile.avatar}" alt="${profile.name || ''}">` : initialsOf(profile.name)}
      </div>
      <div class="profile-modal-name">${profile.name || ''}</div>
      <div class="profile-modal-role">${profile.heroRole || ''}</div>
      <p class="profile-modal-bio">${profile.heroDesc || ''}</p>
      <div class="profile-modal-links">
        <a class="btn btn-ghost" href="mailto:${profile.contact.email}">Email</a>
        <a class="btn btn-ghost" href="${profile.contact.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
      </div>
      <button type="button" class="profile-modal-avatar-btn admin-only-visible" id="profile-avatar-upload">Change profile photo</button>
    `;
    const btn = document.getElementById('profile-avatar-upload');
    if (btn) {
      btn.addEventListener('click', () => {
        pickImage((dataUrl) => {
          profile.avatar = dataUrl;
          Store.save();
        });
      });
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    syncBrand();
    document.querySelectorAll('#brand-btn').forEach((btn) => btn.addEventListener('click', openProfileModal));
  });
  window.addEventListener(Store.EVENT, () => { syncBrand(); renderProfileModalContent(); });

  function refreshChrome() {
    const loggedIn = Auth.isLoggedIn();
    document.body.classList.toggle('admin-logged-in', loggedIn);
    document.body.classList.toggle('admin-editing', loggedIn && isEditMode());
    if (loggedIn) {
      buildToolbar();
      const t = document.getElementById('mt-edit-toggle');
      if (t) t.checked = isEditMode();
    } else {
      document.getElementById('mt-admin-bar')?.remove();
      setEditMode(false);
    }
  }

  window.addEventListener(Auth.EVENT, refreshChrome);
  window.addEventListener('DOMContentLoaded', () => {
    buildLoginModal();
    refreshChrome();
    // periodic session-expiry check so the bar disappears if the session times out
    setInterval(refreshChrome, 30000);
  });

  /* ---------------- Editable text binder ---------------- */
  // el: DOM element to make editable. onSave(newText) persists to the Store.
  function bindEditable(el, onSave, opts) {
    if (!el) return;
    el.classList.add('admin-editable-target');
    const multiline = opts && opts.multiline;
    // Keep the save callback fresh even on re-binds (element may be reused
    // across re-renders with a new closure over updated data references).
    el._mtOnSave = onSave;
    function apply() {
      const active = isEditMode();
      el.contentEditable = active ? 'true' : 'false';
      el.classList.toggle('admin-editable', active);
    }
    apply();
    // Only attach the actual DOM/window listeners once per element — avoids
    // stacking duplicate listeners on elements that get reused every render.
    if (el.dataset.mtBound === '1') return;
    el.dataset.mtBound = '1';
    window.addEventListener('mt:editmodechange', apply);
    window.addEventListener(Auth.EVENT, apply);
    el.addEventListener('blur', () => {
      if (!isEditMode()) return;
      const text = multiline ? el.innerText.trim() : el.textContent.trim();
      el._mtOnSave(text);
    });
    el.addEventListener('keydown', (e) => {
      if (!multiline && e.key === 'Enter') { e.preventDefault(); el.blur(); }
    });
  }

  /* ---------------- Add / remove list helper ---------------- */
  // Adds a floating "×" remove button to an item, and appends an "+ Add" button after the list.
  function decorateRemovable(itemEl, onRemove, label) {
    itemEl.classList.add('admin-list-item');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-remove-btn admin-only-visible';
    btn.setAttribute('aria-label', `Remove ${label || 'item'}`);
    btn.textContent = '×';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(`Remove this ${label || 'item'}?`)) onRemove();
    });
    itemEl.appendChild(btn);
  }
  function makeAddButton(text, onAdd) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-add-btn admin-only-visible';
    btn.textContent = `+ ${text}`;
    btn.addEventListener('click', (e) => { e.preventDefault(); onAdd(); });
    return btn;
  }

  /* ---------------- Image upload (resized to a data URL) ---------------- */
  function pickImage(onResult) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const maxW = 1600;
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (dataUrl.length > 1_800_000) {
            toast('That image is large — it was compressed, but consider a smaller file for best performance.', true);
          }
          onResult(dataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    input.click();
  }

  function promptMediaUrl(onResult) {
    const url = prompt('Paste an image or video URL (or a path like assets/projects/your-file.jpg):');
    if (url) onResult(url.trim());
  }

  return {
    isEditMode, setEditMode, toast,
    bindEditable, decorateRemovable, makeAddButton,
    pickImage, promptMediaUrl,
    openLogin, refreshChrome
  };
})();
