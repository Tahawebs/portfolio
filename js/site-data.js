/* =========================================================
   SITE DATA (defaults)
   ---------------------------------------------------------
   Profile + skills content that used to be hardcoded in
   index.html. It now renders from here (via js/site-render.js)
   so it can be edited from the admin panel.

   These are just the DEFAULTS shipped with the site. When you
   log in as admin and save changes, your edits are stored in
   this browser's localStorage and layered on top of these
   defaults (see js/store.js). To make edits permanent for every
   visitor, use "Export data" in the admin panel and send the
   exported file back to update this file for deployment.
   ========================================================= */

const SITE_DATA_DEFAULT = {
  profile: {
    name: 'Muhammad Taha',
    avatar: '',
    kicker: 'Available for backend / .NET opportunities',
    heroTitlePre: 'Building reliable backend ',
    heroTitleAccent: 'systems',
    heroTitlePost: ' in C# and .NET.',
    heroRole: '// Software Engineering student · Backend Developer',
    heroDesc: "I'm Muhammad Taha, a software engineering student in Karachi who builds production-grade backend systems — from database schema to deployed application — with C#, ASP.NET Core and SQL Server.",
    stats: [
      { value: '3.2 / 4.0', label: 'Cumulative GPA' },
      { value: '6+', label: 'Client review cycles shipped' },
      { value: '2027', label: 'Expected graduation' }
    ],
    aboutTitle: 'A developer who ships, not just studies.',
    aboutParagraphs: [
      "I'm currently pursuing a B.S. in Software Engineering at Bahria University, Karachi, with a focus on backend development, cybersecurity and database optimization.",
      "Outside coursework, I've built a full HR attendance system for a real client from the ground up, and spent two months inside a pharmaceutical company's IT department building internal .NET tooling — experience that taught me as much about production workflows and stakeholder feedback as it did about code."
    ],
    timeline: [
      { date: '2025 — 2026', title: 'Freelance Software Developer', org: 'Pakistan Maritime Museum, HR Department', desc: 'Built a complete HR Attendance System from scratch to production across 6+ requirement cycles.' },
      { date: 'Jul — Aug 2025', title: '.NET Intern', org: 'Sami Pharmaceuticals (Pvt.) Ltd., IT Department', desc: 'Developed internal .NET tools supporting debugging & database tasks in an enterprise environment.' },
      { date: 'Sep 2023 — Jun 2027', title: 'B.S. Software Engineering', org: 'Bahria University, Karachi', desc: 'Cumulative GPA: 3.2 / 4.00.' },
      { date: 'May 2021 — May 2023', title: 'F.Sc. Computer Science', org: 'Bahria College Karsaz', desc: 'Obtained 78%.' }
    ],
    contact: {
      title: "Let's build something reliable together.",
      desc: 'Open to backend / .NET internship and junior developer roles, and freelance work. I usually reply within a day.',
      email: 'atahaabid35@gmail.com',
      phone: '+923218251867',
      linkedin: 'https://www.linkedin.com/in/muhammad-taha-abid-53656a356/'
    }
  },
  skills: {
    subtitle: 'Core expertise in C# and the .NET ecosystem, backed by solid database and front-end fundamentals.',
    categories: [
      {
        title: 'Backend & Languages',
        rows: [
          { name: 'C#', value: 90 },
          { name: '.NET Core / .NET Framework', value: 85 },
          { name: 'ASP.NET Core MVC', value: 80 }
        ]
      },
      {
        title: 'Data & Databases',
        rows: [
          { name: 'SQL Server', value: 85 },
          { name: 'Entity Framework Core', value: 75 },
          { name: 'Dapper', value: 78 }
        ]
      },
      {
        title: 'Frontend & Web',
        rows: [
          { name: 'HTML5 & CSS3', value: 75 },
          { name: 'JavaScript', value: 65 },
          { name: 'Bootstrap & Razor Views', value: 70 }
        ]
      }
    ],
    pills: ['REST APIs', 'OOP', 'ADO.NET', 'MySQL', 'Git & GitHub', 'Visual Studio', 'VS Code', 'Azure', 'SSMS']
  }
};
