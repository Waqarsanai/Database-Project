# IIMS Frontend (SaaS-grade)

Modern, production-ready **Intelligent Inventory Management System (IIMS)** frontend.

## Tech stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui-style primitives (Radix)
- React Router v6 (role-based routing)
- Zustand (global state) + TanStack Query (server state)
- Axios service layer with interceptors + normalized errors
- Recharts (analytics dashboards)
- React Hook Form + Zod (forms + validation)
- MSW (mock backend) — toggle with `VITE_USE_MOCK=true`

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment variables

See `.env.example`.

- `VITE_API_BASE_URL`: REST API base URL (used by Axios)
- `VITE_USE_MOCK`: when `true`, MSW intercepts API calls and serves realistic mock data

## Auth flows (mock)

Login route: `/login`

- **Admin**: `admin1 / AdminPass123!`
- **Customer**: `customer1 / Password123!`

## Routes

- **Public**: `/`, `/login`, `/register`
- **Admin module**: `/admin/*`
- **Customer module**: `/app/*`

## Project structure (enforced)

```
src/
├── api/                  # Typed service layer (Axios)
├── components/           # UI primitives, layouts, charts, shared components
├── hooks/                # Custom hooks
├── mocks/                # MSW handlers + seeded data (when backend absent)
├── pages/                # Route-level pages (lazy-loaded)
├── routes/               # Router + guards
├── store/                # Zustand stores
├── types/                # TS types mirroring ER diagram
└── utils/                # formatters/constants/helpers
```

## Backend integration guide

- **All HTTP calls live in `src/api/*.api.ts`**.
- List endpoints use `PaginatedResponse<T>` from `src/types/pagination.ts`.
- When your backend is ready:
  - Set `VITE_USE_MOCK=false`
  - Point `VITE_API_BASE_URL` to your API
  - Keep endpoint paths identical to the service layer.

