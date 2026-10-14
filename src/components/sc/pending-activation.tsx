import Link from "next/link";

type PendingActivationProps = {
  title: string;
  description: string;
  flow?: string[];
  backHref?: string;
  /** Optional primary action (e.g. link to the demo flow). */
  action?: { href: string; label: string };
};

// Shown when the Seguros Caracas integration is not active yet. It must never
// render internal data (env values, credentials, IP addresses).
export function PendingActivation({
  title,
  description,
  flow,
  backHref = "/",
  action,
}: PendingActivationProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60dvh",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-display, Georgia, serif)",
            fontSize: 24,
            fontWeight: 700,
            color: "#3A1335",
            marginBottom: 12,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 14, color: "#7a6d74", lineHeight: 1.6 }}>{description}</p>
        {flow && flow.length > 0 && (
          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              color: "#4A464A",
              lineHeight: 1.6,
              backgroundColor: "#ffffff",
              border: "1px solid #d2c2cb",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            {flow.join(" → ")}
          </p>
        )}
        {action && (
          <Link
            href={action.href}
            style={{
              display: "inline-block",
              marginTop: 24,
              marginRight: 12,
              padding: "10px 24px",
              borderRadius: 4,
              backgroundColor: "#C2A378",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {action.label}
          </Link>
        )}
        <Link
          href={backHref}
          style={{
            display: "inline-block",
            marginTop: 24,
            padding: "10px 24px",
            borderRadius: 4,
            backgroundColor: "#3A1335",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
