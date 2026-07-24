/* =========================================================
   GITHUB PUBLISH
   ---------------------------------------------------------
   Lets the admin push the current live data straight into
   js/site-data.js and js/projects-data.js in their GitHub
   repo, using GitHub's Contents API. A normal push to the
   branch GitHub Pages / Vercel is watching is all either of
   those platforms need to redeploy — so this button IS the
   deploy step, no terminal or git commands required.

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
  const CONFIG_KEY = 'mt-github-config'; // { owner, repo, branch, sitePath, projectsPath }
  const TOKEN_KEY = 'mt-github-token';

  function getConfig() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || null; }
    catch { return null; }
  }
  function saveConfig(cfg) { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); }
  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function saveToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function forgetToken() { localStorage.removeItem(TOKEN_KEY); }

  function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
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

  async function publish() {
    const cfg = getConfig();
    const token = getToken();
    if (!cfg || !token) throw new Error('GitHub isn\'t configured yet.');

    const siteFile = buildSiteDataFile();
    const projectsFile = buildProjectsDataFile();
    const stamp = new Date().toLocaleString();

    await putFile(cfg, token, cfg.sitePath, siteFile, `Admin panel: update site content (${stamp})`);
    await putFile(cfg, token, cfg.projectsPath, projectsFile, `Admin panel: update projects (${stamp})`);

    return `https://github.com/${cfg.owner}/${cfg.repo}/commits/${cfg.branch}`;
  }

  return { getConfig, saveConfig, getToken, saveToken, forgetToken, publish };
})();
