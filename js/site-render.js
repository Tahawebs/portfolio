/* =========================================================
   SITE RENDER — homepage hero / about / skills / contact
   ---------------------------------------------------------
   Renders from Store.getProfile() / Store.getSkills() and
   wires up admin inline-editing (text edits save on blur;
   add/remove buttons only show while an admin is signed in
   and edit mode is on).
   ========================================================= */
(function () {
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function editableEl(tag, cls, text, onSave, opts) {
    const e = el(tag, cls, text);
    AdminUI.bindEditable(e, onSave, opts);
    return e;
  }

  function renderHero(profile) {
    editableInto('hero-kicker', profile.kicker, (v) => { profile.kicker = v; Store.save(); });
    editableInto('hero-title-pre', profile.heroTitlePre, (v) => { profile.heroTitlePre = v; Store.save(); });
    editableInto('hero-title-accent', profile.heroTitleAccent, (v) => { profile.heroTitleAccent = v; Store.save(); });
    editableInto('hero-title-post', profile.heroTitlePost, (v) => { profile.heroTitlePost = v; Store.save(); });
    editableInto('hero-role', profile.heroRole, (v) => { profile.heroRole = v; Store.save(); });
    editableInto('hero-desc', profile.heroDesc, (v) => { profile.heroDesc = v; Store.save(); }, { multiline: true });

    const wrap = document.getElementById('hero-stats');
    wrap.innerHTML = '';
    profile.stats.forEach((s, i) => {
      const item = el('div', 'hero-stat');
      item.appendChild(editableEl('b', '', s.value, (v) => { profile.stats[i].value = v; Store.save(); }));
      item.appendChild(editableEl('span', '', s.label, (v) => { profile.stats[i].label = v; Store.save(); }));
      AdminUI.decorateRemovable(item, () => { profile.stats.splice(i, 1); Store.save(); }, 'stat');
      wrap.appendChild(item);
    });
    wrap.appendChild(AdminUI.makeAddButton('Add stat', () => {
      profile.stats.push({ value: 'New', label: 'Label' }); Store.save();
    }));
  }

  function editableInto(id, text, onSave, opts) {
    const e = document.getElementById(id);
    if (!e) return;
    e.textContent = text || '';
    AdminUI.bindEditable(e, onSave, opts);
  }

  function renderAbout(profile) {
    editableInto('about-title', profile.aboutTitle, (v) => { profile.aboutTitle = v; Store.save(); });

    const copy = document.getElementById('about-copy');
    copy.innerHTML = '';
    profile.aboutParagraphs.forEach((p, i) => {
      const wrap = el('div', 'about-para-wrap');
      wrap.style.position = 'relative';
      const para = editableEl('p', '', p, (v) => { profile.aboutParagraphs[i] = v; Store.save(); }, { multiline: true });
      wrap.appendChild(para);
      AdminUI.decorateRemovable(wrap, () => { profile.aboutParagraphs.splice(i, 1); Store.save(); }, 'paragraph');
      copy.appendChild(wrap);
    });
    copy.appendChild(AdminUI.makeAddButton('Add paragraph', () => {
      profile.aboutParagraphs.push('New paragraph — click to edit.'); Store.save();
    }));

    const tl = document.getElementById('about-timeline');
    tl.innerHTML = '';
    profile.timeline.forEach((t, i) => {
      const item = el('div', 'timeline-item');
      item.appendChild(editableEl('div', 'timeline-date', t.date, (v) => { profile.timeline[i].date = v; Store.save(); }));
      item.appendChild(editableEl('div', 'timeline-title', t.title, (v) => { profile.timeline[i].title = v; Store.save(); }));
      item.appendChild(editableEl('div', 'timeline-org', t.org, (v) => { profile.timeline[i].org = v; Store.save(); }));
      item.appendChild(editableEl('div', 'timeline-desc', t.desc, (v) => { profile.timeline[i].desc = v; Store.save(); }, { multiline: true }));
      AdminUI.decorateRemovable(item, () => { profile.timeline.splice(i, 1); Store.save(); }, 'timeline entry');
      tl.appendChild(item);
    });
    tl.appendChild(AdminUI.makeAddButton('Add timeline entry', () => {
      profile.timeline.push({ date: 'Year', title: 'New role / degree', org: 'Organization', desc: 'Description.' });
      Store.save();
    }));
  }

  function renderSkills(skills) {
    editableInto('skills-subtitle', skills.subtitle, (v) => { skills.subtitle = v; Store.save(); });

    const grid = document.getElementById('skills-grid');
    grid.innerHTML = '';
    skills.categories.forEach((cat, ci) => {
      const card = el('div', 'skill-card reveal in');
      card.style.position = 'relative';
      card.appendChild(editableEl('h3', '', cat.title, (v) => { skills.categories[ci].title = v; Store.save(); }));

      cat.rows.forEach((row, ri) => {
        const rowWrap = el('div', 'skill-row');
        rowWrap.style.position = 'relative';
        const top = el('div', 'skill-row-top');
        top.appendChild(editableEl('span', '', row.name, (v) => { skills.categories[ci].rows[ri].name = v; Store.save(); }));
        const valSpan = editableEl('span', '', row.value + '%', (v) => {
          const num = Math.max(0, Math.min(100, parseInt(v, 10) || 0));
          skills.categories[ci].rows[ri].value = num;
          Store.save();
        });
        top.appendChild(valSpan);
        rowWrap.appendChild(top);
        const bar = el('div', 'skill-bar');
        const fill = el('div', 'skill-bar-fill');
        fill.style.width = row.value + '%';
        bar.appendChild(fill);
        rowWrap.appendChild(bar);
        AdminUI.decorateRemovable(rowWrap, () => { skills.categories[ci].rows.splice(ri, 1); Store.save(); }, 'skill');
        card.appendChild(rowWrap);
      });

      card.appendChild(AdminUI.makeAddButton('Add skill', () => {
        skills.categories[ci].rows.push({ name: 'New skill', value: 50 }); Store.save();
      }));
      AdminUI.decorateRemovable(card, () => { skills.categories.splice(ci, 1); Store.save(); }, 'category');
      grid.appendChild(card);
    });

    const addCardBtn = AdminUI.makeAddButton('Add category', () => {
      skills.categories.push({ title: 'New category', rows: [{ name: 'New skill', value: 50 }] });
      Store.save();
    });
    grid.appendChild(addCardBtn);

    const pillsWrap = document.getElementById('skills-pills');
    pillsWrap.innerHTML = '';
    skills.pills.forEach((pill, i) => {
      const span = el('span', 'tool-pill');
      span.style.position = 'relative';
      const inner = editableEl('span', '', pill, (v) => { skills.pills[i] = v; Store.save(); });
      span.appendChild(inner);
      AdminUI.decorateRemovable(span, () => { skills.pills.splice(i, 1); Store.save(); }, 'pill');
      pillsWrap.appendChild(span);
    });
    pillsWrap.appendChild(AdminUI.makeAddButton('Add pill', () => {
      skills.pills.push('New tool'); Store.save();
    }));
  }

  function renderContact(profile) {
    editableInto('contact-title', profile.contact.title, (v) => { profile.contact.title = v; Store.save(); });
    editableInto('contact-desc', profile.contact.desc, (v) => { profile.contact.desc = v; Store.save(); }, { multiline: true });

    const emailA = document.getElementById('contact-email');
    emailA.href = `mailto:${profile.contact.email}`;
    const phoneA = document.getElementById('contact-phone');
    phoneA.href = `tel:${profile.contact.phone}`;
    const liA = document.getElementById('contact-linkedin');
    liA.href = profile.contact.linkedin;

    // email/phone/linkedin text stays static ("Email me" / "Call" / "LinkedIn"),
    // but the underlying address is editable via the admin bar's Export/Import
    // and Change-login flows plus these three fields:
    if (AdminUI.isEditMode()) {
      emailA.title = `Editing: ${profile.contact.email}`;
      emailA.onclick = (e) => {
        if (!AdminUI.isEditMode()) return;
        e.preventDefault();
        const v = prompt('Email address:', profile.contact.email);
        if (v) { profile.contact.email = v; Store.save(); }
      };
      phoneA.onclick = (e) => {
        if (!AdminUI.isEditMode()) return;
        e.preventDefault();
        const v = prompt('Phone number (e.g. +923218251867):', profile.contact.phone);
        if (v) { profile.contact.phone = v; Store.save(); }
      };
      liA.onclick = (e) => {
        if (!AdminUI.isEditMode()) return;
        e.preventDefault();
        const v = prompt('LinkedIn URL:', profile.contact.linkedin);
        if (v) { profile.contact.linkedin = v; Store.save(); }
      };
    } else {
      emailA.onclick = null; phoneA.onclick = null; liA.onclick = null;
    }
  }

  function renderAll() {
    const profile = Store.getProfile();
    const skills = Store.getSkills();
    renderHero(profile);
    renderAbout(profile);
    renderSkills(skills);
    renderContact(profile);
  }

  window.addEventListener('DOMContentLoaded', renderAll);
  window.addEventListener(Store.EVENT, renderAll);
  window.addEventListener('mt:editmodechange', renderAll);
  window.addEventListener(Auth.EVENT, renderAll);
})();
