import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** A green candle under a red line, on black. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "#000000",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", position: "absolute", top: 14, left: 6, width: 52, height: 3, background: "#ff3b3b" }} />
        <div style={{ display: "flex", position: "absolute", top: 10, left: 30, width: 4, height: 48, background: "#00d26a" }} />
        <div style={{ display: "flex", position: "absolute", top: 22, left: 22, width: 20, height: 28, background: "#00d26a" }} />
      </div>
    ),
    { ...size },
  );
}
