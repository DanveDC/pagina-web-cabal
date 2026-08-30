# Security overview — Cabal Corretaje web

## Threat model

Public marketing site plus a `/cotizar` quote flow that, when enabled, brokers
requests to the **Seguros Caracas HOGAR web service**. Seguros Caracas authorises
callers by **server-IP allowlist**, so every upstream call must originate from
this server. The browser never talks to Seguros Caracas directly and never
receives the broker credentials.

Assets to protect:

| Asset | Risk |
| --- | --- |
| Broker credentials (`SC_PRODUCTOR`, `SC_CONVENIO`) | Impersonation of the broker; fraudulent policy issuance |
| `POST /suscribir` | **Writes** — issues a real policy |
| `GET /cliente` | Returns PII (name, DOB, sex, civil status) by national ID |
| Server IP reputation | Abuse of our allowlisted IP as an open relay to SC |

## Controls in place

### Network / transport
- HSTS (`max-age=63072000; includeSubDomains; preload`)
- `upgrade-insecure-requests` in the CSP (production)
- TLS terminated by DigitalOcean; app binds `0.0.0.0:3000` inside the container only

### HTTP response headers (`next.config.ts` + `src/proxy.ts`)
- **Content-Security-Policy** — per-request script **nonce** + `strict-dynamic`;
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
  `frame-ancestors 'none'`. `style-src` keeps `'unsafe-inline'` — the UI is built
  almost entirely with inline `style={{}}` and framer-motion runtime styles, which
  a nonce cannot cover. Scripts do **not** allow `unsafe-inline`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` denies camera/mic/geo/payment/usb
- `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`
- `X-Powered-By` removed

### API proxy (`src/app/api/seguros-caracas/[...path]/route.ts`)
Defense in depth, in order:
1. **Kill-switch** — `SC_PROXY_ENABLED=false` **or** `SC_BASE_URL` unset → every
   route returns `503` (fails loud; never silently hits a default host).
2. **Allowed-origin check** — the request `Origin`/`Referer` must match
   `ALLOWED_ORIGINS` (or same-origin when unset). **Catalog routes reject
   requests with no `Origin`/`Referer`** (curl/scripts) — no anonymous scraping
   of proposal pricing. Sensitive routes allow a missing origin because the
   bearer token is the real gate there.
3. **Bearer-token gate** — `suscribir` and `cliente` require
   `Authorization: Bearer <SC_PROXY_TOKEN>`. Both sides are SHA-256'd to a fixed
   length and compared with `timingSafeEqual` (no length/content timing leak).
4. **Rate limiting** — per client IP, fixed window. Catalog `60/min`, sensitive
   `10/min` (tunable). Buckets are **namespaced by auth state**
   (`auth` / `anon` / `pub`) so an unauthenticated flood cannot exhaust a
   legitimate caller's quota. Client IP is taken from `IP_HEADER`
   (`do-connecting-ip`) or the **rightmost** `X-Forwarded-For` entry — a
   client-supplied left-most XFF is ignored. The bucket map is swept every 15s
   and hard-capped at 50k keys. Returns `429` + `Retry-After`.
5. **Method + segment allowlist** — only mapped segments (case-sensitive,
   prototype-safe `hasOwnProperty`); `GET` for catalog, `POST` only for
   `suscribir`; everything else `404`/`405`. Extra path segments are ignored —
   the upstream path always comes from the fixed `ROUTE_MAP`.
6. **Schema validation** — every client-controlled value is parsed with Zod
   (`*.schema.ts`); unexpected keys are rejected (`.strict()`);
   `documentos[].urlDocumento` must be an `https:` URL.
7. **Server-side credential injection** — `cdProductor` / `cdConvenio` /
   `cdUsuario` are set from env *after* the spread of client data; the client
   cannot supply or override them.
8. **Upstream hardening** — fixed base URL (no SSRF surface), fully
   percent-encoded query, `redirect: "error"`, `AbortController` timeout, JSON
   content-type check, response-size cap.
9. **Error hygiene** — upstream errors are logged server-side with a request id;
   responses carry only a short machine code (`{ "error": "upstream_timeout" }`).

### Supply chain
- `npm audit --omit=dev --audit-level=high` is clean; wired as `npm run audit:ci`.
- Pinned Next.js; Docker base image `node:22-alpine`.

### Container
- Multi-stage build, `output: "standalone"`, runs as non-root `nextjs` user,
  no dev dependencies in the runtime image, `HEALTHCHECK` on `/api/health`.

## Known limitations / follow-ups

- **Rate limiter is in-memory** — correct for a single instance. Scaling past one
  instance needs a shared store (Redis/Upstash); the `rateLimit()` interface is
  drop-in compatible. It also assumes a trusted proxy sets `IP_HEADER` /
  `X-Forwarded-For`; if the container is ever exposed with **no** proxy in front,
  set `IP_HEADER=""` (all clients then share one bucket — fail safe).
- **`style-src 'unsafe-inline'`** is a deliberate tradeoff for the inline
  `style={{}}` + framer-motion UI. Tech debt: migrate to CSS modules / hashed
  styles to remove it. `script-src` is nonce-locked with no `unsafe-inline`.
- **No end-user authentication.** The quote flow is intentionally public. The
  sensitive SC operations are gated by the shared `SC_PROXY_TOKEN`, meant for a
  trusted backend/agent caller — not for direct browser use. If the browser must
  call `suscribir`/`cliente` directly, add real user auth + per-user
  authorisation first.
- **CAPTCHA / bot mitigation** not included. Add Turnstile/hCaptcha on the public
  quote submission if abuse appears.
- The public contact/quote forms on the landing page are currently inert
  (front-end only) — no backend, no data stored.

## Reporting

Email `central@cabalasesores.com` with `[SECURITY]` in the subject.
