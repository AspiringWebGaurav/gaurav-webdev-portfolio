import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: "linear-gradient(135deg, #09090b 0%, #131127 55%, #09090b 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #7c3aed, #10b981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 900,
              }}
            >
              ↓
            </div>
            <span style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "-0.02em" }}>
              downex
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#34d399",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginLeft: "8px",
              }}
            >
              DOWNLOAD MANAGER
            </span>
          </div>

          <div
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(52, 211, 153, 0.45)",
              background: "rgba(16, 185, 129, 0.14)",
              color: "#6ee7b7",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            Free &amp; Open Source • Windows 10 &amp; 11
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "960px" }}>
          <div
            style={{
              fontSize: "58px",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
            }}
          >
            Simple, Fast Windows Download Manager &amp; Free IDM Alternative.
          </div>
          <div style={{ fontSize: "24px", color: "#a1a1aa", lineHeight: 1.4 }}>
            Up to 32 parallel HTTP/1.1 streams, 1-by-1 sequential queue, Chromium auto link catch,
            crash-safe resume, and automatic 4 GB Low-RAM Eco mode.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "22px",
            fontSize: "18px",
            color: "#d4d4d8",
          }}
        >
          <span>downex.apps.gauravpatil.site</span>
          <span style={{ color: "#a78bfa", fontWeight: 700 }}>
            Rust + Tauri v2 • Zero Ads • Zero Telemetry
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
