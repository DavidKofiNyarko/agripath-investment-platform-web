# AgriPath — Smart Agricultural Investment Platform

AgriPath is a web platform that connects investors with verified agricultural projects in Ghana. Investors can browse farming projects (crops, livestock, poultry, and aquaculture), fund them through a secure wallet, track growth stages in real time, and earn returns at harvest.

- **Live app:** [https://agripath.co](https://agripath.co)
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (Auth + Postgres + Storage + Realtime), Paystack payments

## Features

### Investor experience
- **Authentication** — email/password, magic links, email verification, and OAuth (Google, GitHub, Apple)
- **Onboarding** — profile setup flow and KYC verification before investing
- **Project discovery** — browse projects by type (crop, livestock, poultry, aquaculture) with live availability
- **Investing** — fund projects via AgriPath wallet, card, or mobile money (MTN, Vodafone, AirtelTigo) through Paystack
- **Wallet** — top up, withdraw, and audit transaction history
- **Portfolio & transactions** — track investments, units, ROI, and payouts
- **Security** — 4-digit transaction PIN (bcrypt-hashed), password strength rules, leaked-password protection, global/others/local sign-out scopes
- **Notifications** — real-time in-app notifications with category and channel preferences
- **Support** — in-app support tickets and legal pages (terms, privacy, refund policy)

### Operations experience
- **Admin dashboard** — project, approval, payout, and notification management
- **Approval workflows** — structured requests with audit logging
- **Realtime** — live project availability, wallet balances, and transaction updates via Supabase Realtime

## Project structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes (PIN reset, OTP verification)
│   ├── dashboard/          # Investor dashboard
│   ├── investments/        # Project discovery & investing
│   ├── kyc-verification/   # KYC submission
│   ├── wallet/             # Wallet top-up & withdrawal
│   └── ...                 # auth, portfolio, settings, support, legal
├── components/             # Reusable UI components (shadcn/ui in components/ui)
├── contexts/               # React providers (User, Wallet, Projects, Notifications, ...)
├── hooks/                  # Custom React hooks
├── lib/                    # Business logic (payments, auth, PIN security, CSV export)
├── utils/supabase/         # Supabase server/middleware client factories
├── app/utils/supabase/     # Supabase browser/server client factories
├── supabase/migrations/    # Database schema (single comprehensive migration)
├── migrations/             # Additional table migrations (payment accounts)
├── email-templates/        # Branded Supabase email templates (HTML)
└── docs/                   # Setup, security, and feature documentation
```

## Getting started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier works)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key (any one of the three supported key variables) |

Optional variables (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_PAYMENT_API_URL`, `NEXT_PUBLIC_SUPABASE_STORAGE_HOST`) allow overriding the production API and storage endpoints — see `.env.example`.

### 3. Set up the database

Run the schema migration in the Supabase SQL editor:

```bash
supabase/migrations/20251122000000_complete_schema.sql   # core schema
migrations/create_payment_accounts_table.sql               # payment accounts
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Locally, the app automatically targets the development API (`dev.infra.agripath.co`); deployed environments use production endpoints.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Deployment

The app is a standard Next.js application and deploys to any Node host (Vercel, Netlify, Node server). Set the environment variables from `.env.example` in your hosting dashboard, then run `npm run build && npm run start`.

## Documentation

- [Environment setup & Supabase configuration](docs/setup.md)
- [Security model & hardening checklist](docs/security.md)
- [Real-time updates](docs/realtime.md)
- [Notification system](docs/notifications.md)
- [Email templates & OAuth providers](docs/email-templates.md)

## Security

- All secrets are injected via environment variables — no credentials are stored in the repository
- Row Level Security (RLS) is enabled on all database tables with per-user policies
- Transaction PINs are bcrypt-hashed (12 rounds) and never stored in plain text
- See [docs/security.md](docs/security.md) for the full hardening checklist

## License

Proprietary — AgriPath. All rights reserved.
