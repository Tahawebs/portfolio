# Muhammad Taha — Portfolio

A minimalist, responsive portfolio site with light/dark themes and a
data-driven project system: every project gets its own page with
multiple content sections and an image/video carousel, and the whole
thing is generated from one plain data file — no code changes needed
to add more projects.

## File structure

```
portfolio/
├── index.html              Homepage (hero, about, skills, projects grid, contact)
├── project.html             Template used for every project's detail page
├── css/
│   └── styles.css           All styling — light & dark theme variables at the top
├── js/
│   ├── theme.js              Theme toggle, mobile nav, scroll-reveal, skill bar animation
│   ├── icons.js               Small inline icon set
│   ├── projects-data.js      ⭐ EDIT THIS to change the *default* projects
│   ├── site-data.js          ⭐ EDIT THIS to change the *default* profile/skills text
│   ├── store.js               Merges admin edits (localStorage) on top of the defaults
│   ├── auth.js                 Hidden admin login (see "Admin / owner mode" below)
│   ├── admin.js                Login modal, admin toolbar, inline-editing helpers
│   ├── site-render.js         Renders hero/about/skills/contact from the store
│   ├── main.js                Renders the homepage project grid from the store
│   └── project-detail.js     Renders a project page + powers the carousels + admin CRUD
└── assets/
    └── projects/             Put your real screenshots & videos here
```

Once signed in, an admin bar appears bottom-right. Flip on **Edit mode** and
you can click straight into almost any text on the site (hero copy, about
paragraphs, timeline, skills, tool pills, contact links) and it saves when
you click away. On a project page you additionally get:

- Add / edit / delete **sections**, paragraphs, tags, and the timeline /
  client / stack details
- Click any media slot (including the empty "+ add media" placeholders) to
  **upload an image, upload a small video, or paste a URL** — plus remove,
  re-caption, or flip a slot between image/video
- **Delete this project**, or **+ Add project** from the homepage grid

**Please read this important limitation:** this is a static site with no
backend/server or database. Admin edits are saved to `localStorage`, which
means:

1. They only appear in **the browser you edited them in** — not for other
   visitors to your live site, and not on your other devices.
2. It is a *hidden + hashed* login, not a bulletproof one — there's no
   server to enforce it, so treat it as a deterrent for casual visitors
   rather than a serious security boundary. Don't reuse this password
   anywhere important.

To make your edits permanent for everyone, use **Export data** in the admin
bar — it downloads a `portfolio-data.json` file with everything you changed.
Hand that back to whoever maintains the codebase (or re-paste it into your
own dev environment / send it to Claude) to bake the changes into
`projects-data.js` / `site-data.js` for the next deploy. **Import data**
loads an exported file back in (handy for moving edits to another browser),
and **Reset edits** wipes local admin changes back to the shipped defaults.

## Adding a new project

Open `js/projects-data.js` and add a new object to the `PROJECTS`
array (instructions are also written at the top of that file):

```js
{
  id: 'my-new-project',              // used in the URL: project.html?id=my-new-project
  title: 'My New Project',
  tagline: 'One sentence describing it.',
  icon: 'code',                       // see js/icons.js for available icon keys
  color: '#4338CA',                   // badge color for this project
  tags: ['C#', 'ASP.NET Core'],
  role: 'Personal Project',
  timeline: '2026',
  client: 'Self-directed',
  stack: ['C#', 'SQL Server'],
  sections: [
    {
      heading: 'What I built',
      subheading: 'Overview',
      description: [
        'First paragraph.',
        'Second paragraph, if you want more than one.'
      ],
      media: [
        { type: 'image', src: 'assets/projects/my-new-project/1.jpg', label: 'Home screen' },
        { type: 'video', src: 'assets/projects/my-new-project/demo.mp4', label: 'Demo walkthrough' }
      ]
    }
    // add as many sections as you want
  ]
}
```

That's it — it automatically appears in the homepage grid and gets
its own page at `project.html?id=my-new-project`, complete with a
"previous / next project" footer link.

### Adding media

- Any image format works (jpg, png, webp, gif, avif, svg) and any
  video format your browser supports (mp4, webm, ogg, mov).
- Put your files in `assets/projects/` (create subfolders per
  project if that's easier to manage) and reference them by path in
  `src`.
- Leave `src: ''` on any item and a labelled placeholder graphic is
  shown automatically, so you can lay out a project before you have
  final screenshots.
- The carousel (dots below, arrows on hover/tap, swipe on mobile,
  arrow-key support) appears automatically whenever a section has
  more than one media item.

## Running locally

No build step — it's plain HTML/CSS/JS. Just serve the folder, e.g.:

```
python3 -m http.server 8000
```

then open `http://localhost:8000`.

## Deploying

Upload the whole `portfolio/` folder as-is to any static host
(GitHub Pages, Netlify, Vercel, etc.) — no build step required.

## Customizing

- Colors, fonts and spacing all come from CSS variables at the top
  of `css/styles.css` (`:root` for light theme, `[data-theme="dark"]`
  for dark theme).
- The homepage's hero text, "About" timeline, "Skills" bars/pills and
  contact email/phone/LinkedIn now render from `js/site-data.js` (not
  hardcoded in `index.html` anymore) — edit the defaults there, or use
  Admin mode (see above) to change them from the live page.
