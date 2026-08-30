#!/usr/bin/env node
/**
 * Runtime security scan for the Cabal Corretaje web app.
 *
 * Black-box probes against a running instance: security headers, CSP strength,
 * API auth enforcement, method/segment allowlisting, input validation, SSRF /
 * path-traversal resistance, rate limiting, and error-message hygiene.
 *
 * Usage:
 *   node scripts/security-scan.mjs [baseUrl]
 *   BASE_URL=https://staging.example.com npm run security:scan
 *
 * Exit code 0 = no CRITICAL findings. Non-zero = at least one CRITICAL.
 */

const BASE = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const results = [];

const C = { reset: "\x1b[0m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", dim: "\x1b[2m" };

function record(severity, name, pass, detail = "") {
  results.push({ severity, name, pass, detail });
  const tag = pass ? `${C.green}PASS${C.reset}` : `${C[severity === "CRITICAL" ? "red" : "yellow"]}${pass ? "PASS" : severity}${C.reset}`;
  console.log(`  [${tag}] ${name}${detail ? `  ${C.dim}${detail}${C.reset}` : ""}`);
}

async function req(path, init = {}) {
  // Default to a same-origin browser-like request; individual checks override
  // headers (e.g. the cross-origin test sets Origin to an attacker domain).
  const headers = { origin: BASE, ...(init.headers || {}) };
  const res = await fetch(`${BASE}${path}`, { redirect: "manual", ...init, headers });
  const text = await res.text().catch(() => "");
  return { res, text, status: res.status, headers: res.headers };
}

function bodyLeaks(text) {
  return /\b(at\s+\/|node_modules|\/app\/src\/|ECONNREFUSED|stacktrace|seguroscaracas\.com|AbortError|TypeError:|Error:\s)/i.test(
    text
  );
}

// ─── 1. Security headers on an HTML route ─────────────────────────────────
async function checkHeaders() {
  console.log("\n▶ Security headers (GET /)");
  const { headers } = await req("/");
  const want = {
    "strict-transport-security": /max-age=\d{7,}/,
    "x-frame-options": /DENY|SAMEORIGIN/i,
    "x-content-type-options": /nosniff/i,
    "referrer-policy": /.+/,
    "permissions-policy": /.+/,
    "content-security-policy": /.+/,
  };
  for (const [h, re] of Object.entries(want)) {
    const v = headers.get(h);
    record(h === "content-security-policy" || h === "strict-transport-security" ? "CRITICAL" : "HIGH",
      `header ${h}`, !!v && re.test(v), v || "missing");
  }
  record("MEDIUM", "no x-powered-by", !headers.get("x-powered-by"), headers.get("x-powered-by") || "absent");

  const csp = headers.get("content-security-policy") || "";
  record("CRITICAL", "CSP script-src has nonce", /script-src[^;]*'nonce-/.test(csp), csp.slice(0, 80));
  record("HIGH", "CSP script-src no 'unsafe-inline'", !/script-src[^;]*'unsafe-inline'/.test(csp));
  record("HIGH", "CSP frame-ancestors 'none'", /frame-ancestors\s+'none'/.test(csp));
  record("MEDIUM", "CSP object-src 'none'", /object-src\s+'none'/.test(csp));
  record("MEDIUM", "CSP base-uri 'self'", /base-uri\s+'self'/.test(csp));
}

// ─── 2. Health endpoint ──────────────────────────────────────────────────
async function checkHealth() {
  console.log("\n▶ Health endpoint");
  const { status, text, headers } = await req("/api/health");
  record("HIGH", "/api/health 200", status === 200, `status ${status}`);
  record("MEDIUM", "/api/health no-store", /no-store/.test(headers.get("cache-control") || ""));
  let json = {};
  try { json = JSON.parse(text); } catch { /* */ }
  record("MEDIUM", "/api/health minimal body", Object.keys(json).length <= 2 && !("version" in json) && !("env" in json));
}

// ─── 3. Proxy: method + segment allowlist ─────────────────────────────────
async function checkRouting() {
  console.log("\n▶ Proxy routing & methods");
  const unknown = await req("/api/seguros-caracas/does-not-exist");
  record("HIGH", "unknown segment -> 404", unknown.status === 404, `status ${unknown.status}`);

  const noSeg = await req("/api/seguros-caracas/");
  record("HIGH", "empty segment -> not 500", noSeg.status !== 500, `status ${noSeg.status}`);

  const getSuscribir = await req("/api/seguros-caracas/suscribir");
  record("HIGH", "GET /suscribir -> 404/405", [404, 405].includes(getSuscribir.status), `status ${getSuscribir.status}`);

  for (const m of ["PUT", "DELETE", "PATCH"]) {
    const r = await req("/api/seguros-caracas/listas", { method: m });
    record("MEDIUM", `${m} /listas -> 405`, r.status === 405, `status ${r.status}`);
  }

  const traversal = await req("/api/seguros-caracas/listas%2F..%2F..%2Fetc%2Fpasswd");
  record("CRITICAL", "path traversal in segment -> 404", traversal.status === 404, `status ${traversal.status}`);
}

// ─── 4. Proxy: auth enforcement on sensitive ops ─────────────────────────
async function checkAuth() {
  console.log("\n▶ Sensitive-op authorization");
  // cliente exposes PII; suscribir writes. Neither may ever return 200 without a token.
  const cliente = await req("/api/seguros-caracas/cliente?nacionalidad=V&cedulaRif=12345678");
  record("CRITICAL", "GET /cliente without token not authorized",
    [401, 403, 503].includes(cliente.status), `status ${cliente.status}`);
  record("CRITICAL", "GET /cliente returns no client data",
    !/\"cliente\"\s*:/.test(cliente.text), cliente.text.slice(0, 60));

  const suscribir = await req("/api/seguros-caracas/suscribir", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pedido: {} }),
  });
  record("CRITICAL", "POST /suscribir without token not authorized",
    [401, 403, 415, 503].includes(suscribir.status), `status ${suscribir.status}`);
  record("CRITICAL", "POST /suscribir never 200 unauthenticated", suscribir.status !== 200);

  // Wrong bearer token must not pass.
  const badToken = await req("/api/seguros-caracas/cliente?nacionalidad=V&cedulaRif=12345678", {
    headers: { authorization: "Bearer not-the-real-token" },
  });
  record("CRITICAL", "GET /cliente rejects wrong token",
    [401, 403, 503].includes(badToken.status), `status ${badToken.status}`);
}

// ─── 5. Proxy: cross-origin & anonymous abuse ────────────────────────────
async function checkOrigin() {
  console.log("\n▶ Origin enforcement");
  const evil = await req("/api/seguros-caracas/listas", { headers: { origin: "https://evil.example" } });
  record("HIGH", "cross-origin call blocked/disabled",
    [403, 503].includes(evil.status), `status ${evil.status}`);

  // No Origin and no Referer (curl / script / scanner) must not reach catalog data.
  const anon = await fetch(`${BASE}/api/seguros-caracas/propuestas`, { redirect: "manual" });
  record("HIGH", "anonymous (no Origin/Referer) catalog call blocked/disabled",
    [403, 503].includes(anon.status), `status ${anon.status}`);
}

// ─── 6. Proxy: input validation ─────────────────────────────────────────
async function checkValidation() {
  console.log("\n▶ Input validation");
  const cases = [
    ["/api/seguros-caracas/ciudades", "missing required param"],
    ["/api/seguros-caracas/ciudades?cdEstado=" + encodeURIComponent("../../../etc"), "traversal-ish param"],
    ["/api/seguros-caracas/ciudades?cdEstado=" + "A".repeat(500), "overlong param"],
    ["/api/seguros-caracas/ciudades?cdEstado=01&injected=1", "unexpected extra param"],
    // cliente is token-gated: auth is checked before validation (correct order),
    // so 401 is also an acceptable rejection here.
    ["/api/seguros-caracas/cliente?nacionalidad=Z&cedulaRif=abc", "bad enum + non-numeric id", [400, 401, 403, 503]],
  ];
  for (const [path, label, ok = [400, 403, 503]] of cases) {
    const r = await req(path);
    record("HIGH", `rejects: ${label}`, ok.includes(r.status), `status ${r.status}`);
  }
}

// ─── 7. Error hygiene ──────────────────────────────────────────────────
async function checkErrorHygiene() {
  console.log("\n▶ Error-message hygiene");
  const probes = [
    "/api/seguros-caracas/does-not-exist",
    "/api/seguros-caracas/ciudades",
    "/api/seguros-caracas/suscribir",
  ];
  for (const p of probes) {
    const r = await req(p, p.endsWith("suscribir") ? { method: "POST", headers: { "content-type": "application/json" }, body: "{" } : {});
    record("HIGH", `no internals leaked: ${p}`, !bodyLeaks(r.text), r.text.slice(0, 80));
  }
}

// ─── 8. Rate limiting ─────────────────────────────────────────────────
async function checkRateLimit() {
  console.log("\n▶ Rate limiting (best effort)");
  const burst = 80;
  let sawLimit = false;
  let saw503 = false;
  for (let i = 0; i < burst; i++) {
    const r = await req("/api/seguros-caracas/listas");
    if (r.status === 429) sawLimit = true;
    if (r.status === 503) saw503 = true;
  }
  if (saw503 && !sawLimit) {
    record("LOW", "rate limit (proxy disabled, skipped)", true, "all 503");
  } else {
    record("HIGH", "catalog endpoint rate-limited under burst", sawLimit, sawLimit ? "429 seen" : "no 429 in 80 reqs");
  }
}

// ─── run ─────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n🔒 Security scan → ${BASE}`);
  try {
    await checkHeaders();
    await checkHealth();
    await checkRouting();
    await checkAuth();
    await checkOrigin();
    await checkValidation();
    await checkErrorHygiene();
    await checkRateLimit();
  } catch (err) {
    console.error(`\n${C.red}Scan aborted:${C.reset} ${err.message}`);
    console.error(`Is the server running at ${BASE}?`);
    process.exit(2);
  }

  const crit = results.filter((r) => !r.pass && r.severity === "CRITICAL");
  const high = results.filter((r) => !r.pass && r.severity === "HIGH");
  const med = results.filter((r) => !r.pass && r.severity === "MEDIUM");
  const passed = results.filter((r) => r.pass).length;

  console.log(`\n─────────────────────────────────────────`);
  console.log(`  ${passed}/${results.length} checks passed`);
  console.log(`  ${C.red}CRITICAL: ${crit.length}${C.reset}   ${C.yellow}HIGH: ${high.length}${C.reset}   MEDIUM: ${med.length}`);
  console.log(`─────────────────────────────────────────`);

  const report = {
    base: BASE,
    ranAt: new Date().toISOString(),
    summary: { passed, total: results.length, critical: crit.length, high: high.length, medium: med.length },
    findings: results.filter((r) => !r.pass),
    all: results,
  };
  const { writeFileSync } = await import("node:fs");
  writeFileSync("security-report.json", JSON.stringify(report, null, 2));
  console.log(`  report → security-report.json\n`);

  process.exit(crit.length > 0 ? 1 : 0);
})();
