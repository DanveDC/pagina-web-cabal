# Deployment — DigitalOcean

The app ships as a **standalone Next.js server** in a hardened container
(`Dockerfile`). Two supported paths on DigitalOcean:

## Option A — App Platform (recommended)

1. Push this repo to GitHub (`DanveDC/cabal-web`, branch `main`).
2. Create the app from the spec:
   ```bash
   doctl apps create --spec .do/app.yaml
   ```
   App Platform builds the `Dockerfile`, runs `node server.js`, and health-checks
   `GET /api/health`.
3. In **Settings → App-Level Environment Variables**, set the real values
   (mark the `SC_*` ones as **encrypted / secret**):

   | Key | Example | Notes |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SC_ENABLED` | `false` → `true` when live | build-time, public |
   | `SC_PROXY_ENABLED` | `false` → `true` when live | run-time kill-switch |
   | `SC_BASE_URL` | `https://sasweb-test.seguroscaracas.com` | test vs prod host |
   | `SC_PRODUCTOR` | *(from Seguros Caracas)* | secret |
   | `SC_CONVENIO` | *(from Seguros Caracas)* | secret |
   | `SC_PROXY_TOKEN` | `openssl rand -hex 32` | secret; required for `suscribir`/`cliente` |
   | `ALLOWED_ORIGINS` | `https://cabalasesores.com,https://www.cabalasesores.com` | **required in prod** |
   | `RL_CATALOG_MAX` / `RL_SENSITIVE_MAX` / `RL_WINDOW_MS` | defaults `60` / `10` / `60000` | optional |

4. Add the custom domain in App Platform; it provisions TLS automatically.
5. Redeploy. App Platform sits behind its own proxy that sets
   `X-Forwarded-For` — the rate limiter and origin check use it.

`NEXT_PUBLIC_SC_ENABLED` is compiled into the client bundle, so changing it
requires a **rebuild** (redeploy), not just a restart.

## Option B — Droplet + Docker

```bash
# on the droplet
git clone https://github.com/DanveDC/cabal-web && cd cabal-web
cp env.example .env.production        # fill in real values
docker build -t cabal-web --build-arg NEXT_PUBLIC_SC_ENABLED=false .
docker run -d --name cabal-web --restart unless-stopped \
  -p 127.0.0.1:3000:3000 --env-file .env.production cabal-web
```

Put Nginx/Caddy in front for TLS and forward `X-Forwarded-For`. Example Caddy:

```
cabalasesores.com {
    reverse_proxy 127.0.0.1:3000
}
```

## Going live with Seguros Caracas

1. Confirm our production egress IP is on the SC allowlist (App Platform: use a
   dedicated egress / static IP add-on, or a NAT gateway; a Droplet has a stable
   IP already).
2. Set `SC_BASE_URL` to the production host, fill `SC_PRODUCTOR` / `SC_CONVENIO`.
3. Generate `SC_PROXY_TOKEN` and hand it only to the trusted caller of
   `suscribir` / `cliente`.
4. Set `SC_PROXY_ENABLED=true` and `NEXT_PUBLIC_SC_ENABLED=true`, redeploy.
5. Run the scan against the deployed URL:
   ```bash
   node scripts/security-scan.mjs https://cabalasesores.com
   ```

## Pre-deploy checklist

- [ ] `npm run build` green
- [ ] `npm run lint` — 0 errors
- [ ] `npm run audit:ci` — 0 high/critical
- [ ] `npm run security:scan` against a local `npm start` — 0 CRITICAL
- [ ] `ALLOWED_ORIGINS` set to the real domain(s)
- [ ] `SC_PROXY_TOKEN` is a fresh 32-byte random value, stored as a secret
- [ ] `SC_PROXY_ENABLED` / `NEXT_PUBLIC_SC_ENABLED` reflect real readiness
