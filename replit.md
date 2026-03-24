# ListaPro Workspace

## Overview

**ListaPro** — Luxury real estate listing SaaS for Mexican real estate agents. pnpm monorepo with TypeScript, React+Vite frontend, Express API, PostgreSQL+Drizzle ORM, OpenAPI-first with Orval codegen.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Replit Auth (OIDC/PKCE) — sessions in `sessions` table, users in `users` table
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS (Glasshaven dark monochromatic design), Space Grotesk font, wouter routing, Recharts, Leaflet maps

## Design System

- **Palette**: Glasshaven — #0B0B0B bg, #111 cards, white text/buttons. NO gold/yellow.
- **Font**: Space Grotesk (sans), Cormorant Garamond (serif)
- **Dark/Light toggle**: ThemeContext reads/writes localStorage key `listapro-theme`, applies `.dark` / `.light` class to `<html>`
- **CSS variables**: Dark in `.dark` block, Light in `.light` block (index.css)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (auth + listings routes)
│   └── listapro/           # React+Vite frontend (ListaPro app)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── replit-auth-web/    # useAuth() hook for browser auth state
├── scripts/
└── ...
```

## Key Files

- `lib/api-spec/openapi.yaml` — API contract (add endpoints here, then run codegen)
- `lib/db/src/schema/listings.ts` — listings table (+ userId, attractivenessScore, priceLevel)
- `lib/db/src/schema/auth.ts` — sessions + users tables (Replit Auth)
- `artifacts/api-server/src/app.ts` — Express app (cors, cookieParser, authMiddleware)
- `artifacts/api-server/src/routes/auth.ts` — auth endpoints (/login, /callback, /logout, /auth/user)
- `artifacts/api-server/src/routes/listings.ts` — CRUD + AI content generation + scoring
- `artifacts/api-server/src/lib/auth.ts` — session/OIDC helpers
- `artifacts/api-server/src/middlewares/authMiddleware.ts` — sets req.user from session
- `artifacts/listapro/src/App.tsx` — wouter router with ThemeProvider + DemoBanner
- `artifacts/listapro/src/contexts/ThemeContext.tsx` — ThemeProvider + useTheme()
- `artifacts/listapro/src/components/Navbar.tsx` — auth user display, theme toggle, login/logout
- `artifacts/listapro/src/components/DemoBanner.tsx` — dismissible banner when not logged in
- `artifacts/listapro/src/components/PropertyMap.tsx` — Leaflet map with Nominatim geocoding
- `artifacts/listapro/src/pages/Dashboard.tsx` — stats + Recharts bar chart + activity feed
- `artifacts/listapro/src/pages/ListingDetail.tsx` — property detail + AI Studio + scoring + map
- `artifacts/listapro/src/pages/Settings.tsx` — profile, dark/light toggle, branding

## Auth Flow

- Browser: `/api/login` → Replit OIDC → `/api/callback` → session cookie → redirect
- Frontend: `useAuth()` from `@workspace/replit-auth-web` (NO AuthProvider needed — hook is standalone)
- Sessions stored in PostgreSQL `sessions` table, users in `users` table
- Demo mode: app fully works without login, banner shown to non-authenticated users

## Seeded Data

3 demo listings: Penthouse Los Cabos, Villa Mérida, Departamento CDMX

## Routes

| Route | Page |
|-------|------|
| `/` | Landing |
| `/listados` | Dashboard (grid + chart + activity) |
| `/listados/:id` | Listing Detail (AI Studio + scoring + map) |
| `/nuevo-listado` | New Listing form |
| `/configuracion` | Settings |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| GET | `/api/auth/user` | Current auth user |
| GET | `/api/login` | Start OIDC login |
| GET | `/api/callback` | OIDC callback |
| GET | `/api/logout` | Logout |
| GET | `/api/listings` | All listings |
| POST | `/api/listings` | Create listing |
| GET | `/api/listings/:id` | Get listing |
| DELETE | `/api/listings/:id` | Delete listing |
| POST | `/api/listings/:id/generate` | Generate AI content |

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Always typecheck from root. Run codegen after OpenAPI changes: `pnpm --filter @workspace/api-spec run codegen`. Push DB schema: `pnpm --filter @workspace/db run push-force`.
