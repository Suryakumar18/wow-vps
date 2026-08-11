# Deploying to the Hostinger VPS from GitHub

Repo: `https://github.com/Suryakumar18/wow-vps.git` (branch `main`).

Current VPS layout (200.97.164.140 — `wowlifestyle.online`):

| App | Path | pm2 name | Port | Role |
| --- | --- | --- | --- | --- |
| Old store (MongoDB) | `/var/www/ecommerce` | `ecommerce` | 3000 | serves the whole site today |
| **This app** | `/var/www/wowlifestyle` | `wowlifestyle` | 3001 | gets only `/api/whatsapp/*` via nginx |

`.env` lives at `/var/www/wowlifestyle/.env` on the server and is **never in
git** — the repo only carries `.env.example`.

## One-time: turn /var/www/wowlifestyle into a git checkout

The folder already exists on the VPS (first deploy went up as an archive).
Connect it to the repo without touching `.env`:

```bash
cd /var/www/wowlifestyle
git init -b main
git remote add origin https://github.com/Suryakumar18/wow-vps.git
git fetch origin
git reset --hard origin/main
```

`git reset --hard` replaces tracked files with the repo's state; untracked
files (`.env`, `node_modules`, `.next`) stay where they are.

## Every deploy after a push

```bash
cd /var/www/wowlifestyle
git pull
npm ci
npm run build
pm2 restart wowlifestyle
```

If `prisma/schema.prisma` changed, push the schema before restarting:

```bash
npx prisma db push
```

Check it's healthy:

```bash
curl -s http://127.0.0.1:3001/api/health
pm2 logs wowlifestyle --lines 20
```

## When the time comes to make this app THE site

Today nginx (`/etc/nginx/sites-available/default`) sends only
`location ^~ /api/whatsapp/` to :3001; everything else goes to the old app on
:3000. To cut the whole domain over, change both `location /` blocks (HTTP
and HTTPS server) from `proxy_pass http://127.0.0.1:3000;` to
`http://127.0.0.1:3001;`, then:

```bash
nginx -t && systemctl reload nginx
```

Instant rollback: point them back at :3000 and reload again. Before cutting
over, remember (from DEPLOY.md): the database still holds generated test
products (`npm run products:remove-generated`), and account↔session linking
is an open gap.
