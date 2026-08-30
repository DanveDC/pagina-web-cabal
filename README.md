# Cabal Corretaje de Seguros — web

Next.js 16 (App Router) marketing site + `/cotizar` quote flow that brokers
requests to the Seguros Caracas HOGAR web service through a hardened server-side
proxy.

## Stack

- Next.js 16 · React 19 · TypeScript (strict)
- framer-motion, Tailwind v4 (design tokens in `globals.css`)
- Zod for request validation

## Local development

```bash
cp env.example .env.local     # fill in values as needed
npm install
npm run dev                   # http://localhost:3000
```

With no Seguros Caracas credentials the quote flow runs in **standby**
(`NEXT_PUBLIC_SC_ENABLED=false`, `SC_PROXY_ENABLED` defaults to on in dev so the
proxy routes still return validation errors rather than 503).

## Scripts

| Command | What |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve (standalone) |
| `npm run lint` | ESLint |
| `npm run audit:ci` | `npm audit`, fails on high/critical |
| `npm run security:scan [url]` | Black-box security probes against a running instance |

## Layout

```
src/
  app/
    page.tsx                     Landing
    cotizar/page.tsx             Quote flow (client component)
    api/health/route.ts          Liveness probe
    api/seguros-caracas/[...path]/route.ts   Hardened SC proxy
  lib/
    api/seguros-caracas.ts       Browser client (typed Result<T>)
    api/seguros-caracas.schema.ts Zod request schemas
    security/{env,origin,rate-limit}.ts
  proxy.ts                       Per-request CSP + nonce (Next 16 "proxy" convention)
  types/seguros-caracas.ts
```

## Security & deployment

See [`SECURITY.md`](./SECURITY.md) and [`DEPLOYMENT.md`](./DEPLOYMENT.md).
