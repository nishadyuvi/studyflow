# StudyFlow

A minimalist study management web app with three sections: Academic Planner, Day Planner, and Habit Tracker.

## Stack

- **React 19** + **TypeScript**
- **Vite** — dev server and build
- **React Router** — client-side navigation

## Folder structure

```
planner/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, icons
│   ├── components/
│   │   ├── layout/         # Navbar, AppLayout, ThemeToggle
│   │   └── ui/             # Shared UI (buttons, cards) — future
│   ├── context/            # React context (theme, etc.)
│   ├── hooks/              # Custom hooks — future
│   ├── pages/              # Route-level views
│   │   ├── AcademicPlanner.tsx
│   │   ├── DayPlanner.tsx
│   │   └── HabitTracker.tsx
│   ├── styles/             # Global CSS, tokens, background
│   ├── types/              # TypeScript types — future
│   ├── utils/              # Helpers, storage — future
│   ├── App.tsx             # Routes
│   ├── main.tsx
│   └── index.css
└── package.json
```

## Routes

| Path | Section |
|------|---------|
| `/` | Academic Planner (home) |
| `/day-planner` | Day Planner |
| `/habit-tracker` | Habit Tracker |

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Build order (planned)

1. Layout, navigation, theme — done
2. Academic Planner — tasks, due dates, reminders
3. Day Planner — Focus Mode, Pomodoro timer, quotes
4. Habit Tracker — activities grid, charts, detail views
