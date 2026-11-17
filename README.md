# Edu_AI

Edu_AI is a demo learning platform for the Uzbek market with a public landing page, role-based dashboards, and a Gemini-backed AI tutor.

## Setup

1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env` and add your values.
3. Start the app:
   npm run dev

## Demo accounts

- Student: `aziza` / `Student123!`
- Mentor: `alisher` / `Mentor123!`
- Admin: `admin` / `Admin123!`

## Scripts

- `npm run dev` — runs the Vite UI and Express server together
- `npm run build` — production build
- `npm run lint` — lints the source
- `npm run typecheck` — TypeScript validation
- `npm run test` — Vitest tests

## Architecture

- Frontend: React + Vite + Tailwind + React Router
- State: Zustand with persistence
- Server: Express with REST routes and AI endpoints
- AI: Gemini model on the server only

## Deployment

This project can be deployed as:

- Static frontend + Node API backend in separate services
- A single Node process serving `dist` and API routes together
