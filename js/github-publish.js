/* =========================================================
   GITHUB PUBLISH
   ---------------------------------------------------------
   Lets the admin push the current live data straight into
   js/site-data.js and js/projects-data.js in their GitHub
   repo, using GitHub's Contents API. A normal push to the
   branch GitHub Pages / Vercel is watching is all either of
   those platforms need to redeploy — so this button IS the
   deploy step, no terminal or git commands required.

   VERSIONING: every publish also bumps a version number
   (1.0 → 1.1 → … → 1.10 → 2.0) and rewrites index.html /
   project.html so the version shows in the footer and every
   css/js asset link gets a fresh "?v=" query string. That
   query string is what actually matters for visitors: it's
   how a browser is told "this isn't the file you cached
   before, fetch it again." The site's URL never changes —
   the SAME link always serves the newest published version,
   which is what makes this different from (and better than)
   publishing each version at its own separate URL.

   REQUIRES a GitHub Personal Access Token, entered once and
   kept in this browser's localStorage. Please read this:
   - Create a **fine-grained** token (github.com/settings/tokens)
     scoped to *only* this one repository, with
     "Contents: Read and write" permission — nothing else.
   - Anyone with access to this browser/device could read that
     token out of localStorage. Treat it like a password: don't
     use a broad/classic all-repo token, and revoke it from
     GitHub any time via "Forget token" below or from GitHub's
     token settings page.
   ========================================================= */

const GitHubPublish = (function () {
  const CONFIG_KEY = 'mt-github-config'; // { owner, repo, branch, sitePath, projectsPath, indexPath, projectPath }
  const TOKEN_KEY = 'mt-github-token';
  const VERSION_KEY = 'mt-site-version'; // { major, minor }

  function getConfig() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || null; }
    catch { return null; }
  }
  function saveConfig(cfg) { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); }
  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function saveToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function forgetToken() { localStorage.removeItem(TOKEN_KEY); }

  // Version shown in the footer (e.g. "v1.3") and used to cache-bust
  // index.html / project.html's asset links on every publish, so a visitor
  // loading your *same* link always gets the newest CSS/JS instead of a
  // stale cached copy. Goes 1.0 → 1.1 … → 1.10, then rolls to 2.0.
  function getVersion() {
    try {
      const v = JSON.parse(localStorage.getItem(VERSION_KEY));
      if (v && typeof v.major === 'number' && typeof v.minor === 'number') return v;
    } catch (e) { /* fall through */ }
    return { major: 1, minor: 0 };
  }
  function formatVersion(v) { return `${v.major}.${v.minor}`; }
  function peekNextVersion() {
    const v = getVersion();
    let { major, minor } = v;
    minor += 1;
    if (minor > 10) { minor = 0; major += 1; }
    return { major, minor };
  }
  function bumpVersion() {
    const next = peekNextVersion();
    localStorage.setItem(VERSION_KEY, JSON.stringify(next));
    return next;
  }

  function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
  }
  function b64DecodeUnicode(b64) {
    return decodeURIComponent(atob(b64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
  }

  function jsHeader(title, lines) {
    return `/* =========================================================\n   ${title}\n   ---------------------------------------------------------\n${lines.map((l) => '   ' + l).join('\n')}\n   ========================================================= */\n\n`;
  }

  function buildSiteDataFile() {
    const header = jsHeader('SITE DATA (defaults)', [
      'Profile + skills content, rendered via js/site-render.js.',
      '',
      `Last published from the admin panel: ${new Date().toISOString()}`,
      'Edit through the admin panel (type "admin" on the live site) and',
      'use "Publish to GitHub" to update this file automatically.'
    ]);
    const body = { profile: Store.getProfile(), skills: Store.getSkills() };
    return `${header}const SITE_DATA_DEFAULT = ${JSON.stringify(body, null, 2)};\n`;
  }

  function buildProjectsDataFile() {
    const header = jsHeader('PROJECTS DATA', [
      'The homepage grid and every project detail page are generated',
      'from this array.',
      '',
      `Last published from the admin panel: ${new Date().toISOString()}`,
      'Edit through the admin panel (type "admin" on the live site) and',
      'use "Publish to GitHub" to update this file automatically.'
    ]);
    return `${header}const PROJECTS = ${JSON.stringify(Store.getProjects(), null, 2)};\n`;
  }

  async function ghFetch(url, token, opts) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(opts && opts.headers)
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data && data.message ? data.message : `GitHub API error (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  async function putFile(cfg, token, path, content, message) {
    const base = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
    let sha;
    try {
      const existing = await ghFetch(`${base}?ref=${encodeURIComponent(cfg.branch)}`, token);
      sha = existing.sha;
    } catch (e) {
      sha = undefined; // file may not exist yet — will be created
    }
    return ghFetch(base, token, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: b64EncodeUnicode(content),
        branch: cfg.branch,
        ...(sha ? { sha } : {})
      })
    });
  }

  // Rewrites an HTML file's <meta name="app-version"> and every css/js
  // asset link's "?v=" query string to the new version, straight in the
  // repo — this is what makes a *returning* visitor on the exact same URL
  // actually get the new files instead of a cached old copy.
  async function bumpCacheVersion(cfg, token, path, versionStr, message) {
    const base = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
    let existing;
    try {
      existing = await ghFetch(`${base}?ref=${encodeURIComponent(cfg.branch)}`, token);
    } catch (e) {
      return; // file doesn't exist at this path — nothing to version-bump
    }
    let html = b64DecodeUnicode(existing.content);
    html = html.replace(
      /(<meta\s+name="app-version"\s+content=")[^"]*(")/i,
      `$1${versionStr}$2`
    );
    html = html.replace(
      /(href|src)="((?:css|js)\/[^"?]+)(?:\?v=[^"]*)?"/g,
      (_, attr, file) => `${attr}="${file}?v=${versionStr}"`
    );
    return ghFetch(base, token, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: b64EncodeUnicode(html),
        branch: cfg.branch,
        sha: existing.sha
      })
    });
  }

  async function publish() {
    const cfg = getConfig();
    const token = getToken();
    if (!cfg || !token) throw new Error('GitHub isn\'t configured yet.');

    const siteFile = buildSiteDataFile();
    const projectsFile = buildProjectsDataFile();
    const stamp = new Date().toLocaleString();

    await putFile(cfg, token, cfg.sitePath, siteFile, `Admin panel: update site content (${stamp})`);
    await putFile(cfg, token, cfg.projectsPath, projectsFile, `Admin panel: update projects (${stamp})`);

    const nextVersion = formatVersion(bumpVersion());
    const versionMsg = `Admin panel: bump to v${nextVersion} (${stamp})`;
    await bumpCacheVersion(cfg, token, cfg.indexPath || 'index.html', nextVersion, versionMsg);
    await bumpCacheVersion(cfg, token, cfg.projectPath || 'project.html', nextVersion, versionMsg);

    return {
      url: `https://github.com/${cfg.owner}/${cfg.repo}/commits/${cfg.branch}`,
      version: nextVersion
    };
  }

  return {
    getConfig, saveConfig, getToken, saveToken, forgetToken, publish,
    getVersion, formatVersion, peekNextVersion
  };
})();
