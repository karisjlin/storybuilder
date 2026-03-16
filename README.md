# StoryForge

A creative writing tool for authors to organize stories, chapters, characters, and world-building notes in one workspace.

Built as a full stack portfolio project demonstrating clean UI/UX design, complex backend logic, and full stack depth.

![Status](https://img.shields.io/badge/status-in%20development-orange)

---

## Features

- **Rich Text Editing** — TipTap-powered chapter editor with auto word count
- **Drag-and-Drop Reordering** — Reorder chapters via dnd-kit
- **Character Management** — Character profiles with custom traits and relationship mapping
- **World-Building Notes** — Categorized entries for locations, lore, items, factions, and more
- **Tagging System** — Create tags and assign them to chapters, characters, or world entries
- **JWT Authentication** — Secure register/login flow

---

## Tech Stack

| Layer       | Technology                                        |
| ----------- | ------------------------------------------------- |
| Frontend    | React + TypeScript + Tailwind CSS + Vite          |
| Backend     | Node.js + Express + TypeScript                    |
| Database    | PostgreSQL + Sequelize (sequelize-typescript)     |
| Auth        | JWT (JSON Web Tokens)                             |
| Rich Text   | TipTap                                            |
| Drag & Drop | dnd-kit                                           |
| Testing     | Jest + ts-jest + React Testing Library + Supertest|

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL

### Setup

1. **Clone the repo**
   ```bash
   git clone git@github.com:karisjlin/storybuilder.git
   cd storybuilder
   ```

2. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3. **Configure environment variables**

   `server/.env`:
   ```
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/storyforge
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

   `client/.env`:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Run database migrations**
   ```bash
   cd server && npm run db:migrate
   ```

5. **Start development servers**
   ```bash
   # In one terminal
   cd server && npm run dev

   # In another terminal
   cd client && npm run dev
   ```

   Frontend: `http://localhost:5173`
   Backend: `http://localhost:5000`

---

## Project Structure

```
storyforge/
├── client/          # React frontend (Vite + Tailwind)
└── server/          # Express backend (TypeScript)
```

---

## Design

- **Theme:** Dark-first with accent colors (orange `#FF6B35`, red `#E63946`)
- **Typography:** Playfair Display · DM Sans · JetBrains Mono

---

## License

MIT
