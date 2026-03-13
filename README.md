# Jeonghyun Lee — Portfolio

Personal portfolio website built with React + Vite.
Live at **[leejh0820.github.io](https://leejh0820.github.io)**

---

## Tech Stack

- **React + Vite** — component-based SPA
- **CSS Custom Properties** — dark theme design system
- **GitHub Pages** — static hosting

---

## Project Structure

```
portfolio/
├── public/
│   └── projects/          # Project images & GIFs
├── src/
│   └── components/
│       ├── Navbar.jsx      # Top navigation
│       ├── Hero.jsx        # Landing section (name, title, links)
│       ├── About.jsx       # Bio, education, coursework
│       ├── Skills.jsx      # Skill bars by category
│       ├── Projects.jsx    # Project cards with filter
│       └── Contact.jsx     # Contact section
├── index.html
└── vite.config.js
```

---

## Editing Content

| What you want to change | File to edit |
|---|---|
| Name, title, tagline, social links | `src/components/Hero.jsx` |
| Bio, education, coursework | `src/components/About.jsx` |
| Skills & proficiency bars | `src/components/Skills.jsx` |
| Projects (add/remove/edit) | `src/components/Projects.jsx` |
| Navbar links | `src/components/Navbar.jsx` |
| Contact info / email | `src/components/Contact.jsx` |
| Project images | `public/projects/` folder |
| Global colors / fonts | `src/index.css` |

### Adding a New Project

Open `src/components/Projects.jsx` and add an entry to the `ALL_PROJECTS` array:

```js
{
  id: 'my-project',
  title: 'My Project',
  description: 'Short description of what you built.',
  tags: ['Python', 'React'],
  filter: 'fullstack',          // one of: robotics, aiml, data, fullstack, python, java
  media: '/projects/my-image.png',
  github: 'https://github.com/leejh0820/my-project',
  demo: null,                   // or live URL
},
```

Then drop the image into `public/projects/`.

---

## Local Development

```bash
cd portfolio
npm install
npm run dev       # starts dev server at localhost:5173
```

## Deploy

```bash
npm run build     # builds to dist/
```

Then copy `dist/` contents to the [leejh0820.github.io](https://github.com/leejh0820/leejh0820.github.io) repo and push:

```bash
git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push origin main
```
