// Renders a single project's detail page from the Store (projects-data.js
// defaults + any admin edits), powers the per-section image/video carousels,
// and — when signed in as admin with edit mode on — turns the page into a
// full CRUD editor for that project (fields, sections, media).
(function () {
  const KNOWN_ICONS = ['calendar', 'code', 'cart', 'book', 'layout', 'briefcase', 'database', 'server'];

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // Detects a YouTube/Vimeo share link and returns an embeddable player URL.
  // Pasting a normal "watch" link (not a direct .mp4) is the #1 reason a
  // pasted video URL used to just show a broken video box — this makes
  // those links play inline instead of failing silently.
  function videoEmbedInfo(url) {
    if (!url || typeof url !== 'string' || /^idb:/.test(url)) return null;
    let m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/i);
    if (m) return { provider: 'youtube', embedUrl: `https://www.youtube-nocookie.com/embed/${m[1]}` };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (m) return { provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${m[1]}` };
    return null;
  }

  function isIdbRef(src) { return typeof src === 'string' && src.startsWith('idb:'); }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function placeholderDataUri(label, color) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${color}" stop-opacity="0.22"/>
            <stop offset="1" stop-color="${color}" stop-opacity="0.06"/>
          </linearGradient>
          <pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="${color}" stroke-opacity="0.14" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="960" height="540" fill="url(#g)"/>
        <rect width="960" height="540" fill="url(#p)"/>
        <rect x="1" y="1" width="958" height="538" fill="none" stroke="${color}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="10 8"/>
        <g transform="translate(480,250)" text-anchor="middle" font-family="JetBrains Mono, monospace">
          <circle r="26" fill="none" stroke="${color}" stroke-opacity="0.6" stroke-width="2"/>
          <path d="M-9 0h18M0 -9v18" stroke="${color}" stroke-opacity="0.6" stroke-width="2"/>
        </g>
        <text x="480" y="322" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="18" fill="${color}" fill-opacity="0.75">${escapeHtml(label || 'Add media')}</text>
        <text x="480" y="348" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="${color}" fill-opacity="0.45">${AdminUI.isEditMode() ? 'click to upload' : 'set "src" in projects-data.js'}</text>
      </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function mediaSlideHtml(item, project, sIdx, mIdx) {
    const label = item.label || '';
    const attrs = `data-s="${sIdx}" data-m="${mIdx}"`;

    // A YouTube/Vimeo link, whatever the stored "type" flag says — always
    // wins, since it can only ever be played as an embed.
    const embed = item.src ? videoEmbedInfo(item.src) : null;
    if (embed) {
      return `
        <div class="carousel-slide" ${attrs} data-label="${escapeHtml(label)}" data-embed="1">
          <div class="video-embed-wrap">
            <iframe src="${embed.embedUrl}" title="${escapeHtml(label || project.title)}" loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
          </div>
        </div>`;
    }

    if (item.type === 'video') {
      if (isIdbRef(item.src)) {
        const refId = item.src.slice(4);
        return `
          <div class="carousel-slide" ${attrs} data-label="${escapeHtml(label)}">
            <video playsinline preload="metadata" data-idb-ref="${escapeHtml(refId)}" ${item.poster ? `poster="${item.poster}"` : ''}>
              Your browser doesn't support embedded video.
            </video>
            <span class="carousel-play-badge">${icon('play')}</span>
          </div>`;
      }
      if (item.src) {
        return `
          <div class="carousel-slide" ${attrs} data-label="${escapeHtml(label)}">
            <video playsinline preload="metadata" ${item.poster ? `poster="${item.poster}"` : ''}>
              <source src="${item.src}">
              Your browser doesn't support embedded video. <a href="${item.src}">Download it here.</a>
            </video>
            <span class="carousel-play-badge">${icon('play')}</span>
          </div>`;
      }
      return `
        <div class="carousel-slide" ${attrs} data-empty="1">
          <img src="${placeholderDataUri(label || 'Video placeholder', project.color)}" alt="${escapeHtml(label)}">
        </div>`;
    }
    const src = item.src || placeholderDataUri(label || 'Image placeholder', project.color);
    return `
      <div class="carousel-slide" ${attrs} ${item.src ? `data-label="${escapeHtml(label)}"` : 'data-empty="1"'}>
        <img src="${src}" alt="${escapeHtml(label || project.title)}" loading="lazy">
      </div>`;
  }

  // Locally-uploaded videos are stored as Blobs in IndexedDB (see
  // media-store.js) and only referenced by id in the page data, so after
  // the HTML above is inserted we still need to fetch each blob and wire
  // it up as a playable <source>. Runs once per render, before carousels
  // and the lightbox are initialized so both see the real, playable src.
  async function resolveIdbMedia(root) {
    const videos = Array.from(root.querySelectorAll('video[data-idb-ref]'));
    if (!videos.length) return;
    await Promise.all(videos.map(async (video) => {
      const id = video.dataset.idbRef;
      try {
        if (!MediaStore || !MediaStore.isSupported()) throw new Error('IndexedDB unsupported');
        const url = await MediaStore.resolveUrl(id);
        if (!url) throw new Error('Video not found in storage');
        const source = document.createElement('source');
        source.src = url;
        video.insertBefore(source, video.firstChild);
        video.load();
      } catch (e) {
        const slide = video.closest('.carousel-slide');
        if (slide) slide.classList.add('media-missing');
      }
    }));
  }

  function carouselHtml(sectionIdx, media, project) {
    if (!media || !media.length) return '';
    const multi = media.length > 1;
    return `
      <div class="carousel" data-carousel data-index="0">
        <div class="carousel-track-wrap">
          <div class="carousel-track">
            ${media.map((m, i) => mediaSlideHtml(m, project, sectionIdx, i)).join('')}
          </div>
          ${multi ? `
            <button class="carousel-arrow carousel-prev" type="button" aria-label="Previous media">${icon('chevronLeft')}</button>
            <button class="carousel-arrow carousel-next" type="button" aria-label="Next media">${icon('chevronRight')}</button>
            <span class="carousel-counter" data-counter>1 / ${media.length}</span>
          ` : ''}
        </div>
        ${multi ? `
          <div class="carousel-dots">
            ${media.map((_, i) => `<button class="carousel-dot ${i === 0 ? 'active' : ''}" type="button" aria-label="Go to slide ${i + 1}"></button>`).join('')}
          </div>
        ` : ''}
      </div>`;
  }

  function sectionHtml(section, idx, project) {
    return `
      <section class="pd-section reveal in" data-section="${idx}">
        <div class="container">
          <div class="pd-section-head">
            <span class="pd-section-num">// section ${String(idx + 1).padStart(2, '0')}</span>
            <h2 class="pd-section-heading" data-field="heading">${escapeHtml(section.heading || '')}</h2>
            <div class="pd-section-sub" data-field="subheading">${escapeHtml(section.subheading || '')}</div>
            <div class="pd-section-desc" data-field="description">
              ${(section.description || []).map((p, pi) => `<p data-p="${pi}">${escapeHtml(p)}</p>`).join('')}
            </div>
          </div>
          ${carouselHtml(idx, section.media, project)}
          <div class="admin-media-add-wrap"></div>
        </div>
      </section>`;
  }

  function initCarousels(root) {
    root.querySelectorAll('[data-carousel]').forEach((carousel) => {
      const track = carousel.querySelector('.carousel-track');
      const slides = carousel.querySelectorAll('.carousel-slide');
      const dots = carousel.querySelectorAll('.carousel-dot');
      const counter = carousel.querySelector('[data-counter]');
      const prevBtn = carousel.querySelector('.carousel-prev');
      const nextBtn = carousel.querySelector('.carousel-next');
      let index = 0;

      function go(to) {
        index = (to + slides.length) % slides.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
        if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
        slides.forEach((s, i) => {
          const v = s.querySelector('video');
          if (v && i !== index) v.pause();
        });
      }

      prevBtn && prevBtn.addEventListener('click', () => go(index - 1));
      nextBtn && nextBtn.addEventListener('click', () => go(index + 1));
      dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));

      carousel.setAttribute('tabindex', '0');
      carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') go(index - 1);
        if (e.key === 'ArrowRight') go(index + 1);
      });

      let startX = null;
      const wrap = carousel.querySelector('.carousel-track-wrap');
      wrap.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
      wrap.addEventListener('touchend', (e) => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) go(dx > 0 ? index - 1 : index + 1);
        startX = null;
      });

      // ----- lightbox: click any real (non-placeholder, non-embed) slide to open it big -----
      // Embeds (YouTube/Vimeo) keep their own inline controls instead —
      // wrapping them in a click-to-open handler would just get in the way.
      const viewableSlides = Array.from(slides).filter((s) => s.dataset.empty !== '1' && s.dataset.embed !== '1');
      const lightboxItems = viewableSlides.map((s) => {
        const videoEl = s.querySelector('video');
        if (videoEl) {
          const source = videoEl.querySelector('source');
          return {
            type: 'video',
            src: (source && source.getAttribute('src')) || '',
            poster: videoEl.getAttribute('poster') || '',
            label: s.dataset.label || ''
          };
        }
        const imgEl = s.querySelector('img');
        return { type: 'image', src: (imgEl && imgEl.getAttribute('src')) || '', label: s.dataset.label || '' };
      });
      viewableSlides.forEach((slideEl, i) => {
        slideEl.classList.add('carousel-slide-clickable');
        slideEl.addEventListener('click', () => Lightbox.open(lightboxItems, i));
      });
    });
  }

  /* ---------------- Admin wiring ---------------- */
  function wireAdmin(project, projects, app) {
    if (!AdminUI.isEditMode()) return;

    // ----- hero fields -----
    AdminUI.bindEditable(app.querySelector('.pd-hero h1'), (v) => { project.title = v; Store.save(); });
    AdminUI.bindEditable(app.querySelector('.pd-hero .role'), (v) => { project.role = v; Store.save(); });
    AdminUI.bindEditable(app.querySelector('.pd-hero p.lede'), (v) => { project.tagline = v; Store.save(); }, { multiline: true });

    const iconBox = app.querySelector('.pd-icon');
    if (iconBox) {
      iconBox.style.cursor = 'pointer';
      iconBox.title = 'Click to change icon / color';
      iconBox.addEventListener('click', () => {
        const newIcon = prompt(`Icon key (one of: ${KNOWN_ICONS.join(', ')}):`, project.icon);
        if (newIcon && KNOWN_ICONS.includes(newIcon.trim())) project.icon = newIcon.trim();
        const newColor = prompt('Accent color (hex, e.g. #4338CA):', project.color);
        if (newColor) project.color = newColor.trim();
        Store.save();
      });
    }

    // ----- tags (pills) -----
    const tagsWrap = app.querySelector('.pd-tags');
    if (tagsWrap) {
      tagsWrap.querySelectorAll('.tag').forEach((tagEl, i) => {
        tagEl.style.position = 'relative';
        AdminUI.decorateRemovable(tagEl, () => { project.tags.splice(i, 1); Store.save(); }, 'tag');
      });
      tagsWrap.appendChild(AdminUI.makeAddButton('Add tag', () => {
        const v = prompt('New tag:');
        if (v) { project.tags.push(v.trim()); Store.save(); }
      }));
    }

    // ----- project link -----
    const linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.className = 'admin-bar-btn admin-only-visible';
    linkBtn.style.marginTop = '18px';
    linkBtn.textContent = project.link ? 'Edit project link' : 'Add project link';
    linkBtn.addEventListener('click', () => {
      const value = prompt('Project URL (optional):', project.link || '');
      if (value !== null) {
        project.link = value.trim();
        Store.save();
      }
    });
    app.querySelector('.pd-hero .container').appendChild(linkBtn);

    // ----- meta (timeline / client / stack) — edited via a small prompt-driven button
    // rather than inline contentEditable, since these fields are conditionally
    // rendered (only shown when non-empty) and unreliable to index into the DOM.
    const metaEditBtn = document.createElement('button');
    metaEditBtn.type = 'button';
    metaEditBtn.className = 'admin-bar-btn admin-only-visible';
    metaEditBtn.style.marginTop = '18px';
    metaEditBtn.textContent = 'Edit timeline / client / stack';
    metaEditBtn.addEventListener('click', () => {
      const t = prompt('Timeline (e.g. "2025 — 2026"):', project.timeline || '');
      if (t !== null) project.timeline = t;
      const c = prompt('Client / context:', project.client || '');
      if (c !== null) project.client = c;
      const s = prompt('Core stack (comma-separated):', (project.stack || []).join(', '));
      if (s !== null) project.stack = s.split(',').map((x) => x.trim()).filter(Boolean);
      Store.save();
    });
    app.querySelector('.pd-hero .container').appendChild(metaEditBtn);

    // ----- delete project -----
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'admin-bar-btn danger admin-only-visible';
    delBtn.style.marginTop = '18px';
    delBtn.style.marginLeft = '10px';
    delBtn.textContent = 'Delete this project';
    delBtn.addEventListener('click', () => {
      if (confirm(`Delete "${project.title}"? This can't be undone.`)) {
        const next = projects.filter((p) => p.id !== project.id);
        Store.setProjects(next);
        location.href = 'index.html';
      }
    });
    app.querySelector('.pd-hero .container').appendChild(delBtn);

    // ----- sections -----
    app.querySelectorAll('.pd-section').forEach((secEl) => {
      const sIdx = Number(secEl.dataset.section);
      const section = project.sections[sIdx];

      AdminUI.bindEditable(secEl.querySelector('[data-field="heading"]'), (v) => { section.heading = v; Store.save(); });
      AdminUI.bindEditable(secEl.querySelector('[data-field="subheading"]'), (v) => { section.subheading = v; Store.save(); });

      const descWrap = secEl.querySelector('[data-field="description"]');
      descWrap.querySelectorAll('p').forEach((pEl) => {
        const pIdx = Number(pEl.dataset.p);
        pEl.style.position = 'relative';
        AdminUI.bindEditable(pEl, (v) => { section.description[pIdx] = v; Store.save(); }, { multiline: true });
        AdminUI.decorateRemovable(pEl, () => { section.description.splice(pIdx, 1); Store.save(); }, 'paragraph');
      });
      descWrap.appendChild(AdminUI.makeAddButton('Add paragraph', () => {
        (section.description = section.description || []).push('New paragraph.');
        Store.save();
      }));

      // media slides: upload / URL / type-toggle / remove
      secEl.querySelectorAll('.carousel-slide').forEach((slideEl) => {
        const mIdx = Number(slideEl.dataset.m);
        const mediaItem = section.media[mIdx];
        slideEl.style.position = 'relative';

        const toolbar = document.createElement('div');
        toolbar.className = 'admin-media-toolbar admin-only-visible';

        const uploadBtn = document.createElement('button');
        uploadBtn.type = 'button';
        uploadBtn.textContent = mediaItem.type === 'video' ? 'Upload video' : 'Upload image';
        uploadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (mediaItem.type === 'video') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*';
            input.addEventListener('change', async () => {
              const file = input.files[0];
              if (!file) return;
              if (file.size > 100 * 1024 * 1024) {
                AdminUI.toast('That video is over 100MB — pick a smaller file, or paste a hosted URL (YouTube, Vimeo, or a direct video link) instead.', true);
                return;
              }
              if (!MediaStore || !MediaStore.isSupported()) {
                AdminUI.toast("This browser doesn't support the storage videos need here — paste a hosted video URL instead.", true);
                return;
              }
              const previousSrc = mediaItem.src;
              const id = MediaStore.newId();
              AdminUI.toast('Uploading video…');
              try {
                await MediaStore.put(id, file);
                mediaItem.src = 'idb:' + id;
                Store.save();
                if (isIdbRef(previousSrc)) MediaStore.remove(previousSrc.slice(4));
                AdminUI.toast('Video uploaded.');
              } catch (err) {
                AdminUI.toast("Couldn't store that video in this browser (it may be low on disk space) — try a smaller file or paste a hosted URL instead.", true);
              }
            });
            input.click();
          } else {
            AdminUI.pickImage((dataUrl) => { mediaItem.src = dataUrl; Store.save(); });
          }
        });

        const urlBtn = document.createElement('button');
        urlBtn.type = 'button';
        urlBtn.textContent = 'Paste URL';
        urlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          AdminUI.promptMediaUrl((url) => {
            if (isIdbRef(mediaItem.src)) MediaStore.remove(mediaItem.src.slice(4));
            mediaItem.src = url;
            if (videoEmbedInfo(url) || /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url)) mediaItem.type = 'video';
            Store.save();
          });
        });

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.textContent = mediaItem.type === 'video' ? 'Mark as image' : 'Mark as video';
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          mediaItem.type = mediaItem.type === 'video' ? 'image' : 'video';
          Store.save();
        });

        const labelBtn = document.createElement('button');
        labelBtn.type = 'button';
        labelBtn.textContent = 'Caption';
        labelBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const v = prompt('Caption for this media:', mediaItem.label || '');
          if (v !== null) { mediaItem.label = v; Store.save(); }
        });

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'danger';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Remove this media item?')) {
            if (isIdbRef(mediaItem.src)) MediaStore.remove(mediaItem.src.slice(4));
            section.media.splice(mIdx, 1);
            Store.save();
          }
        });

        toolbar.append(uploadBtn, urlBtn, toggleBtn, labelBtn, removeBtn);
        slideEl.appendChild(toolbar);

        if (slideEl.dataset.empty === '1') {
          slideEl.style.cursor = 'pointer';
          slideEl.addEventListener('click', () => uploadBtn.click());
        }
      });

      const addMediaBtn = AdminUI.makeAddButton('Add media', () => {
        section.media = section.media || [];
        section.media.push({ type: 'image', src: '', label: '' });
        Store.save();
      });
      secEl.querySelector('.admin-media-add-wrap').appendChild(addMediaBtn);

      const delSectionBtn = document.createElement('button');
      delSectionBtn.type = 'button';
      delSectionBtn.className = 'admin-bar-btn danger admin-only-visible';
      delSectionBtn.style.marginLeft = '10px';
      delSectionBtn.textContent = 'Delete section';
      delSectionBtn.addEventListener('click', () => {
        if (confirm('Delete this whole section?')) {
          project.sections.splice(sIdx, 1);
          Store.save();
        }
      });
      secEl.querySelector('.admin-media-add-wrap').appendChild(delSectionBtn);
    });

    // ----- add section -----
    const addSectionWrap = document.createElement('div');
    addSectionWrap.className = 'container';
    addSectionWrap.style.padding = '30px 0';
    const addSectionBtn = AdminUI.makeAddButton('Add section', () => {
      project.sections.push({
        heading: 'New section',
        subheading: '',
        description: ['New section description.'],
        media: [{ type: 'image', src: '', label: '' }]
      });
      Store.save();
    });
    addSectionWrap.appendChild(addSectionBtn);
    const pdNav = app.querySelector('.pd-nav');
    if (pdNav) pdNav.parentElement.insertBefore(addSectionWrap, pdNav);
    else app.appendChild(addSectionWrap);
  }

  async function render() {
    const id = getParam('id');
    const projects = Store.getProjects();
    const project = projects.find((p) => p.id === id);
    const app = document.getElementById('project-app');

    if (!project) {
      app.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <h1>Project not found</h1>
            <p>The project you're looking for doesn't exist or may have been moved.</p>
            <div style="margin-top:28px;">
              <a class="btn btn-primary" href="index.html">${icon('arrowRight', 'rot-180')} Back to projects</a>
            </div>
          </div>
        </div>`;
      document.title = 'Project not found — Muhammad Taha';
      return;
    }

    document.title = `${project.title} — Muhammad Taha`;

    const currentPos = projects.findIndex((p) => p.id === id);
    const prevProject = projects[(currentPos - 1 + projects.length) % projects.length];
    const nextProject = projects[(currentPos + 1) % projects.length];

    app.innerHTML = `
      <header class="pd-hero">
        <div class="grid-backdrop"></div>
        <div class="container">
          <div class="breadcrumb">
            <a href="index.html">Home</a> <span>/</span> <a href="index.html#projects">Projects</a> <span>/</span> <span>${escapeHtml(project.title)}</span>
          </div>
          <div class="pd-icon" style="background:${project.color}">${icon(project.icon)}</div>
          <h1>${escapeHtml(project.title)}</h1>
          <div class="role">${escapeHtml(project.role || '')}</div>
          <p class="lede">${escapeHtml(project.tagline)}</p>
          ${project.link ? `<a class="project-link-pill" href="${escapeHtml(project.link)}" target="_blank" rel="noopener noreferrer">${icon('arrowRight')} Open project</a>` : ''}
          <div class="pd-tags">${project.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
          <div class="pd-meta">
            ${project.timeline ? `<div><span>Timeline</span><b>${escapeHtml(project.timeline)}</b></div>` : ''}
            ${project.client ? `<div><span>Client / context</span><b>${escapeHtml(project.client)}</b></div>` : ''}
            ${project.stack && project.stack.length ? `<div><span>Core stack</span><b>${escapeHtml(project.stack.join(', '))}</b></div>` : ''}
          </div>
        </div>
      </header>

      ${project.sections.map((s, i) => sectionHtml(s, i, project)).join('')}

      <div class="container">
        <div class="pd-nav">
          <a class="pd-nav-link prev" href="project.html?id=${encodeURIComponent(prevProject.id)}">
            <span class="label">${icon('chevronLeft')} Previous project</span>
            <span class="title">${escapeHtml(prevProject.title)}</span>
          </a>
          <a class="pd-nav-link next" href="project.html?id=${encodeURIComponent(nextProject.id)}">
            <span class="label">Next project ${icon('chevronRight')}</span>
            <span class="title">${escapeHtml(nextProject.title)}</span>
          </a>
        </div>
      </div>
    `;

    await resolveIdbMedia(app);
    initCarousels(app);
    wireAdmin(project, projects, app);

    const revealEls = app.querySelectorAll('.reveal');
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

  window.addEventListener('DOMContentLoaded', render);
  window.addEventListener(Store.EVENT, render);
  window.addEventListener('mt:editmodechange', render);
  window.addEventListener(Auth.EVENT, render);
})();
