/* =========================================================
   PROJECTS DATA
   ---------------------------------------------------------
   This is the only file you need to touch to manage your
   portfolio's projects. Add as many projects as you like —
   the homepage grid and every project's detail page are
   generated automatically from this array.

   HOW TO ADD A NEW PROJECT
   -------------------------------------------------------
   1. Copy one of the objects below and paste it into the
      PROJECTS array.
   2. Give it a unique `id` (used in the URL, e.g.
      project.html?id=your-id — lowercase, hyphenated).
   3. Fill in title / tagline / tags / meta info.
   4. Add one or more objects to `sections`. Each section
      can have its own heading, subheading, description
      (an array of paragraphs) and its own media gallery.

   HOW TO ADD IMAGES / VIDEOS TO A SECTION
   -------------------------------------------------------
   Each item inside a section's `media` array looks like:

     { type: 'image', src: 'assets/projects/my-shot.jpg', label: 'Dashboard overview' }
     { type: 'video', src: 'assets/projects/demo.mp4', poster: 'assets/projects/demo-poster.jpg', label: 'Walkthrough' }

   - `type` is 'image' or 'video'.
   - `src` is the path to your file. Put your real files in
     assets/projects/ and point to them here — any common
     image (jpg, png, webp, gif, avif, svg) or video
     (mp4, webm, ogg, mov) format works.
   - `poster` (video only, optional) is a thumbnail shown
     before the video plays.
   - `label` is optional caption text.
   - If you leave `src` empty (''), a placeholder graphic is
     shown automatically so you can wire up the layout before
     you have real screenshots — just fill `src` in later.

   That's it — nothing else in the codebase needs to change.
   ========================================================= */

const PROJECTS = [
  {
    id: 'hr-attendance-system',
    title: 'HR Attendance Management System',
    tagline: 'A production attendance & HR platform built end-to-end for a real client, from raw requirements to a deployed desktop and web system.',
    icon: 'calendar',
    color: '#4338CA',
    tags: ['C#', 'ASP.NET Core MVC', 'Dapper', 'SQL Server'],
    role: 'Freelance Software Developer',
    timeline: '2025 — 2026',
    client: 'Pakistan Maritime Museum · HR Department',
    stack: ['C#', 'ADO.NET', 'ASP.NET Core MVC', 'Dapper', 'SQL Server'],
    sections: [
      {
        heading: 'Starting from a paper process',
        subheading: 'Discovery & schema design',
        description: [
          'The HR department was tracking attendance by hand, with no reliable way to audit hours or generate reports. The brief was to replace that process with a single system the team could trust.',
          'I designed the SQL schema from scratch — tables, stored procedures, views and triggers — so attendance calculations, edge cases (late check-ins, missed check-outs, overtime) and reporting could all be handled at the database layer, keeping the application logic clean.'
        ],
        media: [
          { type: 'image', src: '', label: 'Database schema diagram' },
          { type: 'image', src: '', label: 'Stored procedure logic' }
        ]
      },
      {
        heading: 'From a desktop tool to a full web app',
        subheading: 'ADO.NET → ASP.NET Core MVC + Dapper',
        description: [
          'The first version shipped as a desktop application built on ADO.NET, so the HR team could start using it immediately. As requirements grew across more than six review cycles with the client, I rebuilt the system as an ASP.NET Core MVC web application using Dapper for fast, predictable data access.',
          'Both versions were kept in sync with the same underlying schema, so the client could run whichever fit a given workstation without duplicating logic.'
        ],
        media: [
          { type: 'image', src: '', label: 'Desktop attendance dashboard' },
          { type: 'image', src: '', label: 'Web dashboard — ASP.NET Core MVC' },
          { type: 'image', src: '', label: 'Employee attendance record view' }
        ]
      },
      {
        heading: 'Shipping on real feedback',
        subheading: 'Iteration & deployment',
        description: [
          'Requirements shifted repeatedly as the HR team saw the system in use — new report formats, permission levels and validation rules were added across six-plus cycles. Query performance was tuned as the dataset grew, and both the desktop and web versions were deployed to production.',
          'The result is a system still in active use, with strong feedback from the stakeholders who requested it.'
        ],
        media: [
          { type: 'image', src: '', label: 'Reporting & export view' },
          { type: 'image', src: '', label: 'Admin permissions panel' }
        ]
      }
    ]
  },
  {
    id: 'dotnet-internship',
    title: '.NET Development Internship',
    tagline: 'Two months inside a pharmaceutical IT department, building internal .NET tooling for debugging and database workflows.',
    icon: 'server',
    color: '#0EA5A0',
    tags: ['.NET', 'C#', 'Enterprise', 'Debugging'],
    role: '.NET Intern',
    timeline: 'Jul 2025 — Aug 2025',
    client: 'Sami Pharmaceuticals (Pvt.) Ltd. · IT Department',
    stack: ['C#', '.NET Framework', 'SQL Server', 'Git'],
    sections: [
      {
        heading: 'Inside an enterprise IT team',
        subheading: 'Onboarding & environment',
        description: [
          'Joining Sami Pharmaceuticals\' IT department gave me my first exposure to production software running inside a regulated, enterprise environment — with real change-control, version history and review expectations.',
          'I spent the first stretch of the internship getting comfortable with the existing .NET codebase, internal tooling conventions, and the team\'s Git workflow.'
        ],
        media: [
          { type: 'image', src: '', label: 'Internal tooling architecture' }
        ]
      },
      {
        heading: 'Building internal .NET tools',
        subheading: 'Debugging & database utilities',
        description: [
          'I developed internal .NET utilities that supported the team\'s day-to-day debugging and database tasks, cutting down repetitive manual work and giving developers a faster way to trace issues.',
          'Working alongside senior engineers on production workflows sharpened how I think about maintainability, logging and safe database changes in a live enterprise system.'
        ],
        media: [
          { type: 'image', src: '', label: 'Debug utility interface' },
          { type: 'image', src: '', label: 'Database task runner' }
        ]
      }
    ]
  },
  {
    id: 'library-management-system',
    title: 'C# Library Management System',
    tagline: 'A data-structures-first library catalogue — linked lists, trees and custom sorting built by hand rather than a framework.',
    icon: 'book',
    color: '#7C3AED',
    tags: ['C#', 'Data Structures', 'Sorting', 'DSA'],
    role: 'Personal Project',
    timeline: '2024',
    client: 'Coursework / self-directed',
    stack: ['C#', 'Linked Lists', 'Trees', 'Sorting Algorithms'],
    sections: [
      {
        heading: 'Modelling a catalogue without a database',
        subheading: 'Core data structures',
        description: [
          'This project was built to get comfortable with data structures at a low level rather than leaning on a database or ORM. Book records live in a custom linked-list structure, and lookups by category are backed by a tree for faster traversal.'
        ],
        media: [
          { type: 'image', src: '', label: 'Linked list catalogue structure' }
        ]
      },
      {
        heading: 'Sorting & search from scratch',
        subheading: 'Algorithms',
        description: [
          'Search and sort operations — by title, author and availability — are implemented as hand-written algorithms rather than built-in library calls, which made trade-offs between time and space complexity concrete rather than theoretical.'
        ],
        media: [
          { type: 'image', src: '', label: 'Sort/search console output' },
          { type: 'image', src: '', label: 'Tree traversal for category lookup' }
        ]
      }
    ]
  },
  {
    id: 'java-shopping-mart',
    title: 'Java Shopping Mart System',
    tagline: 'A point-of-sale style inventory and billing system built in Java with a MySQL backend.',
    icon: 'cart',
    color: '#B45309',
    tags: ['Java', 'MySQL', 'NetBeans'],
    role: 'Personal Project',
    timeline: '2024',
    client: 'Coursework / self-directed',
    stack: ['Java', 'MySQL', 'NetBeans'],
    sections: [
      {
        heading: 'Inventory, billing and stock in one place',
        subheading: 'System design',
        description: [
          'Built in NetBeans with a MySQL backend, this project simulates a small retail mart — tracking inventory levels, generating bills at checkout, and keeping stock counts in sync as sales happen.'
        ],
        media: [
          { type: 'image', src: '', label: 'Billing screen' },
          { type: 'image', src: '', label: 'Inventory management view' }
        ]
      }
    ]
  },
  {
    id: 'ecommerce-prototype',
    title: 'Responsive E-Commerce Prototype',
    tagline: 'A front-end storefront prototype focused on clean, responsive layout across devices.',
    icon: 'layout',
    color: '#0891B2',
    tags: ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap'],
    role: 'Personal Project',
    timeline: '2024',
    client: 'Coursework / self-directed',
    stack: ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap'],
    sections: [
      {
        heading: 'A storefront that adapts to any screen',
        subheading: 'Responsive layout',
        description: [
          'This prototype explores a product-grid storefront built with Bootstrap\'s grid system and custom CSS, tuned to hold up cleanly from a small phone screen up to a wide desktop layout.'
        ],
        media: [
          { type: 'image', src: '', label: 'Storefront — desktop layout' },
          { type: 'image', src: '', label: 'Storefront — mobile layout' }
        ]
      }
    ]
  }
];
