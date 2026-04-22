# 1card.fyi Installation Guide

## Purpose

This guide explains how to install and run the `1card.fyi` application on a production cloud server.

The application is a Next.js web app with:

- Admin login
- Employee profile management
- Public NFC business card pages
- Local image uploads
- PostgreSQL database
- Prisma migrations

## Recommended Production Stack

- Ubuntu 22.04 or Debian 12
- Node.js 22.x
- npm 11.x or newer
- PostgreSQL 14 or newer
- Nginx reverse proxy
- SSL via Let's Encrypt
- PM2 or systemd for process management

## Server Requirements

Minimum recommended resources:

- 1 vCPU
- 1 GB RAM
- 10 GB free disk space

Preferred if other software is already running on the same server:

- 2 vCPU
- 2 GB RAM

Required capabilities:

- SSH access
- sudo or root access
- PostgreSQL database creation
- ability to run a persistent Node.js process
- writable storage for uploaded images
- ports 80 and 443 open

## Application Requirements

This app requires the following services and settings:

- Node.js runtime
- PostgreSQL database
- environment variables
- local writable upload folder
- reverse proxy to a local Node process

## Required Environment Variables

Create a `.env` file with values like the following:

```env
DATABASE_URL="postgresql://db_user:db_password@127.0.0.1:5432/nfccards?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="replace-with-a-strong-password"
```

Notes:

- `DATABASE_URL` must point to a PostgreSQL database.
- `JWT_SECRET` should be long and random.
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are used for first admin creation.

## Recommended Folder Structure

Example:

```text
/var/www/1card-app
```

Inside that folder:

```text
/var/www/1card-app/web
```

You may also place the app directly in `/var/www/1card-app` if preferred.

## Installation Steps

### 1. Upload the Application Files

Copy the application source to the server.

Recommended methods:

- Git clone
- SFTP upload
- ZIP upload and extract

The `web` folder is the actual app root.

### 2. Install Node.js

Confirm installation:

```bash
node -v
npm -v
```

Recommended target:

- Node.js 22.x

### 3. Create PostgreSQL Database

Create:

- one database
- one dedicated database user
- one password for that user

Example names:

- database: `nfccards`
- user: `nfccards_user`

Example SQL:

```sql
CREATE DATABASE nfccards;
CREATE USER nfccards_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE nfccards TO nfccards_user;
```

### 4. Configure Environment Variables

Inside the app root, create the `.env` file:

```bash
nano .env
```

Paste in the real values.

### 5. Install Dependencies

Run inside the `web` folder:

```bash
npm install
```

### 6. Run Database Migrations

```bash
npx prisma migrate deploy
```

### 7. Seed the First Admin User

```bash
npm run prisma:seed
```

### 8. Build the App

```bash
npm run build
```

### 9. Start the App

Test locally first:

```bash
npm run start
```

By default, Next.js production runs on port 3000 unless configured otherwise.

## Process Management

### Option A: PM2

Install PM2 globally:

```bash
npm install -g pm2
```

Start the app:

```bash
pm2 start npm --name 1card-app -- start
```

Save the process list:

```bash
pm2 save
```

Enable startup:

```bash
pm2 startup
```

### Option B: systemd

Create a service file:

```ini
[Unit]
Description=1card.fyi Next.js App
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/1card-app/web
ExecStart=/usr/bin/npm run start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable 1card-app
sudo systemctl start 1card-app
```

## Nginx Reverse Proxy

Example config:

```nginx
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Setup

Install certbot if needed, then run:

```bash
sudo certbot --nginx -d app.example.com
```

Use your actual domain or subdomain in place of `app.example.com`.

## File Uploads

This app stores uploads locally in:

```text
public/uploads
```

Requirements:

- the app user must have write access
- uploaded files must be included in backups

Current production upload limits:

- User photo: 400 KB
- Company logo: 200 KB

## Default URLs

After deployment:

- Admin login: `/admin/login`
- Public profile: `/u/<slug>`

## Initial Verification Checklist

After deployment, verify all of the following:

1. Home page loads
2. Admin login page loads
3. Login works with seeded admin credentials
4. New profile creation works
5. Image uploads work
6. Public profile page opens
7. Save Contact downloads correctly
8. Profile analytics increase after page views
9. Logout works
10. Nginx and SSL are working correctly

## Routine Maintenance

Useful commands:

```bash
pm2 status
pm2 logs 1card-app
pm2 restart 1card-app
```

Or if using systemd:

```bash
sudo systemctl status 1card-app
sudo systemctl restart 1card-app
journalctl -u 1card-app -n 100
```

## Updating the App

Typical update flow:

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart 1card-app
```

If using systemd, replace the PM2 restart with:

```bash
sudo systemctl restart 1card-app
```

## Backups

Back up both:

- PostgreSQL database
- `public/uploads` folder

If either one is missing, the app will not be fully restorable.

## Troubleshooting

### App does not start

Check:

- `.env` exists
- `JWT_SECRET` exists
- `DATABASE_URL` is correct
- PostgreSQL is running
- app was built successfully

### Database connection fails

Check:

- database user/password
- database host and port
- PostgreSQL service status
- firewall rules

### Uploads fail

Check:

- write permission on app folder
- write permission on `public/uploads`
- image file size
- image MIME type

### Login fails

Check:

- admin seed was run
- seeded email/password are correct
- `JWT_SECRET` is present

## Handover Notes

This app is currently configured for:

- PostgreSQL
- local file uploads
- production Next.js runtime
- persistent server deployment

For higher scale later, consider:

- object storage for uploads
- CDN
- managed PostgreSQL
- process monitoring

