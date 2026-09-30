import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
 * A terminal panel: candles climbing to a red line. Drawn with boxes,
 * because the OG renderer has no canvas.
 */
const heights = [40, 52, 48, 70, 66, 90, 84, 120, 110, 150, 146, 190, 180, 240, 236, 300, 290, 360, 400];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000000",
          color: "#e8e8e8",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            height: 48,
            padding: "0 24px",
            borderBottom: "1px solid #1f1f1f",
            fontSize: 18,
          }}
        >
          <div style={{ display: "flex", background: "#ffb000", color: "#000", padding: "2px 8px", fontWeight: 700 }}>$RUG</div>
          <div style={{ display: "flex", color: "#8c8c8c" }}>MARKET CAP · USD</div>
          <div style={{ display: "flex", marginLeft: "auto", color: "#8c8c8c" }}>ROBINHOOD CHAIN · SIM</div>
        </div>

        <div style={{ display: "flex", flex: 1, position: "relative" }}>
          {/* Candles. */}
          <div style={{ display: "flex", position: "absolute", left: 40, right: 160, bottom: 50, alignItems: "flex-end", gap: 22 }}>
            {heights.map((h, i) => (
              <div key={i} style={{ display: "flex", width: 22, height: h, background: i === heights.length - 1 ? "#ff3b3b" : "#00d26a" }} />
            ))}
          </div>
          {/* The line. */}
          <div style={{ display: "flex", position: "absolute", left: 0, right: 160, top: 122, height: 2, background: "#ff3b3b" }} />
          <div style={{ display: "flex", position: "absolute", right: 0, top: 108, width: 160, height: 30, background: "#ff3b3b", color: "#000", fontSize: 18, fontWeight: 700, alignItems: "center", paddingLeft: 12 }}>
            RUG 100,000
          </div>
          {/* Legend. */}
          <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 32, top: 28, padding: 28, border: "1px solid #1f1f1f", background: "rgba(0,0,0,0.9)" }}>
            <div style={{ display: "flex", color: "#ffb000", fontSize: 18, letterSpacing: 2 }}>RUGPULL · ROBINHOOD CHAIN</div>
            <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1, marginTop: 14 }}>RUGGED AT</div>
            <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1 }}>$100,000.</div>
            <div style={{ display: "flex", fontSize: 30, color: "#8c8c8c", marginTop: 12 }}>Not a dollar before. Below that, nothing happens.</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
