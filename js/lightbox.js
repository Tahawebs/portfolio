// Fullscreen media viewer for project galleries. Click any image or video
// inside a project's carousel to open it large, with prev/next navigation
// between the other media in that same gallery, native video controls
// (play/pause, scrub bar, volume), and a true fullscreen toggle.
(function () {
  let overlay, stage, counterEl, captionEl, prevBtn, nextBtn;
  let items = [];
  let index = 0;
  let built = false;
  let lastFocused = null;

  function build() {
    if (built) return;
    built = true;

    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Media viewer');
    overlay.innerHTML = `
      <button type="button" class="lightbox-icon-btn lightbox-close" aria-label="Close">${icon('close')}</button>
      <button type="button" class="lightbox-icon-btn lightbox-fullscreen" aria-label="Toggle full screen">${icon('expand')}</button>
      <button type="button" class="lightbox-icon-btn lightbox-arrow lightbox-prev" aria-label="Previous media">${icon('chevronLeft')}</button>
      <button type="button" class="lightbox-icon-btn lightbox-arrow lightbox-next" aria-label="Next media">${icon('chevronRight')}</button>
      <div class="lightbox-stage"></div>
      <div class="lightbox-footer">
        <span class="lightbox-caption"></span>
        <span class="lightbox-counter"></span>
      </div>
    `;
    document.body.appendChild(overlay);

    stage = overlay.querySelector('.lightbox-stage');
    counterEl = overlay.querySelector('.lightbox-counter');
    captionEl = overlay.querySelector('.lightbox-caption');
    prevBtn = overlay.querySelector('.lightbox-prev');
    nextBtn = overlay.querySelector('.lightbox-next');
    const closeBtn = overlay.querySelector('.lightbox-close');
    const fsBtn = overlay.querySelector('.lightbox-fullscreen');

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(index - 1));
    nextBtn.addEventListener('click', () => show(index + 1));
    fsBtn.addEventListener('click', toggleFullscreen);

    // click on the dimmed backdrop (not the media itself) closes it
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === stage) close();
    });

    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });

    let startX = null;
    stage.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(dx > 0 ? index - 1 : index + 1);
      startX = null;
    });
  }

  function toggleFullscreen() {
    const requestFs = overlay.requestFullscreen || overlay.webkitRequestFullscreen;
    const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      exitFs && exitFs.call(document);
    } else if (requestFs) {
      requestFs.call(overlay);
    }
  }

  function show(to) {
    if (!items.length) return;
    index = (to + items.length) % items.length;
    const item = items[index];

    stage.innerHTML = '';
    if (item.type === 'video') {
      const v = document.createElement('video');
      v.controls = true;
      v.playsInline = true;
      v.setAttribute('controlsList', 'nodownload');
      if (item.poster) v.poster = item.poster;
      v.src = item.src;
      stage.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.label || '';
      stage.appendChild(img);
    }

    const multi = items.length > 1;
    prevBtn.style.display = multi ? '' : 'none';
    nextBtn.style.display = multi ? '' : 'none';
    counterEl.textContent = multi ? `${index + 1} / ${items.length}` : '';
    captionEl.textContent = item.label || '';
  }

  function open(mediaItems, startIndex) {
    build();
    items = (mediaItems || []).filter((m) => m && m.src);
    if (!items.length) return;
    lastFocused = document.activeElement;
    document.body.classList.add('lightbox-locked');
    overlay.classList.add('open');
    show(startIndex || 0);
    overlay.querySelector('.lightbox-close').focus();
  }

  function close() {
    if (!overlay || !overlay.classList.contains('open')) return;
    const v = stage.querySelector('video');
    if (v) v.pause();
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
      exitFs && exitFs.call(document);
    }
    overlay.classList.remove('open');
    document.body.classList.remove('lightbox-locked');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  window.Lightbox = { open, close };
})();
