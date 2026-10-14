import { SC_DEMO, SC_DEMO_BANNER_TEXT } from "@/lib/sc-ambiente";

// Shown only in demo mode, under the environment banner.
export function DemoBanner() {
  if (!SC_DEMO) return null;
  return (
    <div
      role="status"
      style={{
        background: "#1E3A8A",
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: 600,
        textAlign: "center",
        padding: "8px 16px",
        lineHeight: 1.4,
      }}
    >
      {SC_DEMO_BANNER_TEXT}
    </div>
  );
}
