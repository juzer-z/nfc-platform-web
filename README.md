# NFC Platform Web

This app is a Next.js admin panel and public profile site for NFC-enabled digital business cards.

## What It Does

- Admin login with a JWT cookie
- Create, edit, publish, and delete employee profiles
- Upload a user photo and company logo
- Public profile pages at `/u/<slug>`
- Download a contact as a `.vcf` file for phones and address books

## Tech Stack

- Next.js 16
- React 19
- Prisma 7
- PostgreSQL
- Tailwind CSS 4

## Prerequisites

- Node.js 22 or newer
- npm 11 or newer
- PostgreSQL running locally

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Update the values for your local machine.

Example:

```env
DATABASE_URL="postgresql://postgres:your_password@127.0.0.1:5432/nfccards?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="replace-with-a-strong-password"
```

## Install Dependencies

```bash
npm install
```

## Set Up The Database

Create the `nfccards` database in PostgreSQL, then run:

```bash
npx prisma migrate deploy
```

For local development, this also works:

```bash
npx prisma migrate dev
```

## Seed The Admin User

```bash
npm run prisma:seed
```

Use `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`.
In production, the seed script requires both values and will refuse to use defaults.
The seed command now uses `tsx` rather than `ts-node`.

## Start The App

```bash
npm run dev
```

Open these URLs:

- Admin login: `http://localhost:3000/admin/login`
- Public profiles: `http://localhost:3000/u/<slug>`

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
```

## Notes

- Uploaded images are stored locally in `public/uploads` unless Cloudinary env vars are set.
- Upload limits are intentionally kept small for production quality and page weight:
  - User photo: `400 KB`
  - Company logo: `200 KB`
- If `next build` fails on Windows with an `EPERM` error inside `.next`, stop any running `next dev` process and try again.
- If admin login fails, make sure `JWT_SECRET` is set in `.env`.
- For internet-facing trial deployment, see `docs/DEPLOYMENT_TRIAL_GUIDE.md`.
