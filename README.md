# FareSplit

FareSplit is a trip and outing expense-splitting application focused on simple group settlements.

## What it does

- Sign in with Google.
- Create and join trips.
- Add and track shared expenses.
- Compute balances and suggest settlements.
- Generate UPI payment links for quick settlement actions.

## Tech stack

- Frontend: React + Vite + TailwindCSS
- Data/Auth: Firebase (Auth, Firestore, Storage)
- Backend: Node.js + Express (AI helper endpoints)

## Project structure

- `src/`: frontend application (pages, components, context, Firebase services)
- `backend/`: Express API for AI/OCR/voice parsing helpers

## Getting started

### Frontend

1. Install dependencies:
   - `npm install`
2. Start development server:
   - `npm run dev`
3. Build for production:
   - `npm run build`
4. Preview production build:
   - `npm run preview`

### Backend

1. Move into backend:
   - `cd backend`
2. Install dependencies:
   - `npm install`
3. Start in development mode:
   - `npm run dev`
4. Start in production mode:
   - `npm start`

## Environment variables

Copy `.env.example` to `.env` in the project root and fill Firebase values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Backend uses:

- `PORT` (default: `8080`)
- `CORS_ORIGIN` (comma-separated allowed origins)
