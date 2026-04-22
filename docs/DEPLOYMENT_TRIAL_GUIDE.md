# Trial Deployment Guide

This project can be deployed on a free stack for trial use with:

- Vercel Hobby for the Next.js app
- Neon free Postgres for the database
- Cloudinary free plan for uploaded profile images

That combination supports public URLs such as `https://1card.fyi/u/juzer-zulfikar-ali`.

## Why this stack

- Vercel is the simplest free host for a Next.js app.
- Neon gives you a hosted PostgreSQL database that works with Prisma.
- Cloudinary solves the main production issue in this app: local files on free hosts are not durable.

## Required Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="replace-with-a-long-random-secret"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="replace-with-a-strong-password"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_UPLOAD_FOLDER="1card-fyi"
```

## Deployment Steps

1. Create a Neon project and copy its pooled PostgreSQL connection string into `DATABASE_URL`.
2. In Cloudinary, create a free account and copy the cloud name, API key, and API secret.
3. Push this `web/` folder to GitHub.
4. Import the GitHub repo into Vercel.
5. Set the project root to `web` if your repo root is higher than that.
6. Add all environment variables listed above.
7. Set the Vercel build command to:

```bash
npx prisma migrate deploy && npm run build
```

8. After the first deployment succeeds, run the seed once against production:

```bash
npm run prisma:seed
```

Use the same environment values while running the seed locally, or run it from a Vercel-connected environment.

## Custom Domain Setup For `1card.fyi`

After the Vercel project is created:

1. Add `1card.fyi` to the Vercel project domains.
2. Add `www.1card.fyi` too if you want it to redirect.
3. Update DNS where `1card.fyi` is managed.

Typical DNS records:

- Apex/root domain `1card.fyi`: `A` record to `76.76.21.21`
- `www` subdomain: `CNAME` to `cname.vercel-dns.com`

Vercel will show the exact records required for your project. Once DNS propagates, public profile URLs will work like:

```text
https://1card.fyi/u/juzer-zulfikar-ali
```

## Important Notes

- If Cloudinary variables are not set, uploads fall back to local disk, which is fine for local development but not reliable on free hosting.
- If you want the admin panel at a branded URL, it will be available under `https://1card.fyi/admin/login`.
- For a short trial, Vercel + Neon + Cloudinary should stay within free limits unless traffic or media usage grows.
