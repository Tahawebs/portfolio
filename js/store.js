/* =========================================================
   DATA STORE
   ---------------------------------------------------------
   Single source of truth used by every page. Holds:
     - profile  (hero / about / contact text)
     - skills   (skill categories + tool pills)
     - projects (the projects array — same shape as PROJECTS)

   On first load it's a clone of the shipped defaults
   (site-data.js + projects-data.js). Once the admin edits
   anything, the whole object is written to localStorage
   under STORAGE_KEY and used from then on, in this browser,
   until "Reset to defaults" is used.

   IMPORTANT — this is a static site with no server, so admin
   edits only live in the browser they were made in. Use
   "Export data" in the admin panel to download a JSON file of
   your changes; that file can be handed back to whoever
   maintains the codebase to bake the edits into the deployed
   site permanently.
   ========================================================= */

const Store = (function () {
  const STORAGE_KEY = 'mt-admin-data';
  const EVENT = 'mt:datachange';

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizeProject(project) {
    const base = project && typeof project === 'object' ? project : {};
    return {
      ...base,
      id: base.id || `project-${Math.random().toString(36).slice(2, 10)}`,
      title: base.title || 'Untitled project',
      tagline: base.tagline || '',
      icon: base.icon || 'code',
      color: base.color || '#4338CA',
      link: typeof base.link === 'string' ? base.link : '',
      role: base.role || '',
      timeline: base.timeline || '',
      client: base.client || '',
      stack: Array.isArray(base.stack) ? base.stack : [],
      tags: Array.isArray(base.tags) ? base.tags : [],
      sections: Array.isArray(base.sections) ? base.sections.map((section) => ({
        heading: section?.heading || '',
        subheading: section?.subheading || '',
        description: Array.isArray(section?.description) ? section.description : [],
        media: Array.isArray(section?.media) ? section.media : []
      })) : [{ heading: 'Overview', subheading: '', description: ['Describe this project.'], media: [] }]
    };
  }

  function normalizeData(data) {
    const fallback = defaults();
    const profile = data?.profile || fallback.profile;
    const skills = data?.skills || fallback.skills;
    const projects = Array.isArray(data?.projects) ? data.projects.map(normalizeProject) : fallback.projects;
    return {
      profile: clone(profile),
      skills: clone(skills),
      projects: clone(projects)
    };
  }

  function defaults() {
    return {
      profile: clone(SITE_DATA_DEFAULT.profile),
      skills: clone(SITE_DATA_DEFAULT.skills),
      projects: clone(PROJECTS).map(normalizeProject)
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      // shallow-guard against corrupt/partial data
      if (!parsed || !parsed.profile || !parsed.skills || !parsed.projects) return defaults();
      return normalizeData(parsed);
    } catch (e) {
      console.warn('Store: falling back to defaults —', e);
      return defaults();
    }
  }

  let data = load();

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: data }));
  }

  return {
    EVENT,
    getData() { return data; },
    getProfile() { return data.profile; },
    getSkills() { return data.skills; },
    getProjects() { return data.projects; },

    // Call after mutating the object returned by getData()/getProfile()/etc.
    save() { persist(); },

    setProjects(next) { data.projects = next; persist(); },
    setProfile(next) { data.profile = next; persist(); },
    setSkills(next) { data.skills = next; persist(); },

    resetToDefaults() {
      data = defaults();
      persist();
    },

    exportJSON() {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },

    importJSON(obj) {
      if (!obj || !obj.profile || !obj.skills || !obj.projects) {
        throw new Error('That file doesn\'t look like a portfolio-data.json export.');
      }
      data = normalizeData(obj);
      persist();
    }
  };
})();
