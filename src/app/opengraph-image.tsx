import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = "IIE HackLab CodeCraft participant dashboard";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#020617",
          color: "#e0f7ff",
          padding: "76px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            color: "#00f5ff",
            fontSize: "28px",
            letterSpacing: "4px",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              background: "#00f5ff",
              borderRadius: "50%",
              boxShadow: "0 0 30px #00f5ff",
            }}
          />
          IIE HackLab
        </div>
        <div
          style={{
            marginTop: "34px",
            maxWidth: "900px",
            fontSize: "78px",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          CodeCraft Participant Dashboard
        </div>
        <div
          style={{
            marginTop: "30px",
            maxWidth: "820px",
            fontSize: "30px",
            lineHeight: 1.35,
            color: "rgba(224,247,255,0.72)",
          }}
        >
          {siteConfig.description}
        </div>
      </div>
    ),
    size,
  );
}
