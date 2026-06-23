import { ImageResponse } from "next/og";

export const alt = "Kawan2 — ชุมชนชายแดนใต้";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f1b2e 0%, #14532d 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color: "#fbbf24", letterSpacing: 4 }}>
          KAWAN2
        </div>
        <div style={{ fontSize: 76, fontWeight: 900, marginTop: 24, lineHeight: 1.1 }}>
          ชุมชนชายแดนใต้
        </div>
        <div style={{ fontSize: 36, marginTop: 24, color: "rgba(255,255,255,0.8)" }}>
          ข่าวสาร · กระดานสนทนา · ปัตตานี นราธิวาส ยะลา
        </div>
      </div>
    ),
    { ...size },
  );
}
