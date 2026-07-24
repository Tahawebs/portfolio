// Renders the project cards on the homepage from the Store (projects-data.js
// defaults, overridden by any admin edits saved in this browser).
(function () {
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function slugify(str) {
    return (str || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'project';
  }

  function uniqueId(base, projects) {
    let id = base, n = 2;
    while (projects.some((p) => p.id === id)) { id = `${base}-${n}`; n++; }
    return id;
  }

  function renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    const projects = Store.getProjects();

    grid.innerHTML = projects.map((p, i) => `
      <article class="project-card reveal in" style="transition-delay:${i * 60}ms">
        <button class="project-card-link" type="button" data-href="project.html?id=${encodeURIComponent(p.id)}" aria-label="View project ${escapeHtml(p.title)}"></button>
        <div class="project-icon" style="background:${p.color}">
          ${icon(p.icon)}
        </div>
        <h3>${p.title}</h3>
        <p>${p.tagline}</p>
        ${p.link ? `<a class="project-link-pill" href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer">${icon('arrowRight')} Open project</a>` : ''}
        <div class="project-tags">
          ${p.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
        </div>
        <span class="project-open">View project ${icon('arrowRight')}</span>
      </article>
    `).join('');

    grid.querySelectorAll('.project-card-link').forEach((button) => {
      button.addEventListener('click', () => {
        const href = button.getAttribute('data-href');
        if (href) {
          window.location.href = href;
        }
      });
    });

    if (AdminUI.isEditMode()) {
      grid.querySelectorAll('.project-card').forEach((cardEl, i) => {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'admin-remove-btn admin-only-visible';
        removeBtn.setAttribute('aria-label', 'Delete project');
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm(`Delete "${projects[i].title}"? This can't be undone (unless you re-add it).`)) {
            const next = Store.getProjects().slice();
            next.splice(i, 1);
            Store.setProjects(next);
          }
        });
        cardEl.style.position = 'relative';
        cardEl.appendChild(removeBtn);
      });

      const addCard = document.createElement('button');
      addCard.type = 'button';
      addCard.className = 'project-card project-card-add admin-only-visible';
      addCard.innerHTML = `<span style="font-size:28px;line-height:1;">+</span><h3 style="margin-top:10px;">Add project</h3><p>Create a new project, then open it to fill in sections & media.</p>`;
      addCard.addEventListener('click', () => {
        const title = prompt('Project title:');
        if (!title) return;
        const projectsNow = Store.getProjects().slice();
        const id = uniqueId(slugify(title), projectsNow);
        projectsNow.push({
          id, title,
          tagline: 'Short one-line summary of this project.',
          icon: 'code',
          color: '#4338CA',
          link: '',
          tags: [],
          role: '',
          timeline: '',
          client: '',
          stack: [],
          sections: [{
            heading: 'Overview',
            subheading: '',
            description: ['Describe this project — click into the project page to edit everything.'],
            media: [{ type: 'image', src: '', label: 'Add media' }]
          }]
        });
        Store.setProjects(projectsNow);
        location.href = `project.html?id=${encodeURIComponent(id)}`;
      });
      grid.appendChild(addCard);
    }

    // re-observe newly added reveal elements
    const revealEls = grid.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('in'));
    }
  }

  window.addEventListener('DOMContentLoaded', renderProjects);
  window.addEventListener(Store.EVENT, renderProjects);
  window.addEventListener('mt:editmodechange', renderProjects);
  window.addEventListener(Auth.EVENT, renderProjects);
})();
