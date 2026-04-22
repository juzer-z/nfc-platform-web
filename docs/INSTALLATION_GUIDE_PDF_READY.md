# 1card.fyi
## Installation and Deployment Manual

### Document Purpose

This document explains how to install, configure, and publish the `1card.fyi` application on a production cloud server.

The application is a branded NFC digital business card system with:

- secure admin login
- employee profile management
- public profile pages
- downloadable contact cards
- profile view analytics
- local image uploads

### Production Requirements

The target server should provide:

- Linux operating system, preferably Ubuntu or Debian
- Node.js 22.x
- npm
- PostgreSQL
- Nginx or Apache reverse proxy
- SSL support
- writable disk space for image uploads
- persistent process management using PM2 or systemd

Recommended minimum resources:

- 1 vCPU
- 1 GB RAM
- 10 GB free disk

Recommended for safer headroom when other applications are on the same server:

- 2 vCPU
- 2 GB RAM

### Application Configuration

The application requires a `.env` file containing:

```env
DATABASE_URL="postgresql://db_user:db_password@127.0.0.1:5432/nfccards?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="replace-with-a-strong-password"
```

### Installation Workflow

#### Step 1: Upload the Application

Upload the project files to the server using one of the following methods:

- Git clone
- SFTP
- ZIP upload and extraction

The `web` directory is the application root.

#### Step 2: Confirm Node.js

Run:

```bash
node -v
npm -v
```

The recommended Node.js version is `22.x`.

#### Step 3: Create PostgreSQL Database

Create:

- one database
- one dedicated user
- one secure password

Typical example:

- database: `nfccards`
- user: `nfccards_user`

#### Step 4: Create the Environment File

Inside the application root, create `.env` and insert the production values.

#### Step 5: Install Dependencies

Run:

```bash
npm install
```

#### Step 6: Apply Database Migrations

Run:

```bash
npx prisma migrate deploy
```

#### Step 7: Seed the First Admin Account

Run:

```bash
npm run prisma:seed
```

#### Step 8: Build the Application

Run:

```bash
npm run build
```

#### Step 9: Start the Production Server

Run:

```bash
npm run start
```

### Process Management

The application must run as a persistent background service.

Recommended methods:

- PM2
- systemd

Example PM2 command:

```bash
pm2 start npm --name 1card-app -- start
pm2 save
```

### Reverse Proxy

The public domain should point to Nginx or Apache, which should proxy requests to the internal Node.js app port, typically `3000`.

### SSL

Install SSL using Let's Encrypt and certbot.

Example:

```bash
sudo certbot --nginx -d app.example.com
```

### Upload Storage

This application stores uploaded files locally in:

```text
public/uploads
```

Current production upload limits:

- user photo: 400 KB
- company logo: 200 KB

This folder must:

- remain writable by the app
- be included in backups

### Post-Install Checks

After setup, verify:

1. Admin login page opens
2. Admin login works
3. New profile creation works
4. Photo upload works
5. Logo upload works
6. Public profile page opens correctly
7. Contact download works
8. Analytics increase after page visits
9. Logout works
10. HTTPS is active

### Ongoing Maintenance

Recommended backup targets:

- PostgreSQL database
- `public/uploads`

Recommended update process:

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart 1card-app
```

### Troubleshooting Summary

If the application does not run, check:

- Node.js version
- environment variables
- PostgreSQL connectivity
- build completion
- Nginx reverse proxy
- file permissions

### Final Note

This application is suitable for production deployment on a standard Linux cloud server with Node.js and PostgreSQL support. For future growth, uploads and database backups should be treated as part of the standard operations process.

