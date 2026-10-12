import { SC_AMBIENTE, SC_AMBIENTE_BANNER_TEXT } from "@/lib/sc-ambiente";

// Visible only in the test environment ("pruebas"); renders nothing in production.
export function EnvBanner() {
  if (SC_AMBIENTE !== "pruebas") return null;
  return (
    <div
      role="status"
      style={{
        background: "#B45309",
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: 600,
        textAlign: "center",
        padding: "8px 16px",
        lineHeight: 1.4,
      }}
    >
      {SC_AMBIENTE_BANNER_TEXT}
    </div>
  );
}
