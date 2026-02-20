import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "KOVARI - Connect with Travelers";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb", // dev-theme background
          color: "#1c1c1e", // dev-theme foreground
          fontFamily: "Inter, sans-serif",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "40px 60px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.1em", color: "#1c1c1e" }}>
            KOVARI
          </span>
          <div
            style={{
              backgroundColor: "#007aff",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "50px",
              fontSize: 20,
              fontWeight: 500,
            }}
          >
            Early Access
          </div>
        </div>

        {/* Top Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 24px",
            border: "1px solid #e5e7eb", // dev-theme border
            borderRadius: "40px",
            marginBottom: "40px",
            backgroundColor: "#ffffff", // white background for badge
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <span style={{ fontSize: 20, color: "#4b5563", fontWeight: 500, letterSpacing: "0.01em" }}>
            Plan Trips. Find People. Travel Together.
          </span>
        </div>

        {/* Hero Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 84,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              margin: 0,
              lineHeight: 1.15,
              color: "#1c1c1e",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span>Connect & Travel</span>
            <span style={{ display: "flex", alignItems: "center" }}>
              With the Right People
            </span>
          </h1>
          
          {/* Hero Subtitle */}
          <p
            style={{
              fontSize: 30,
              color: "#4b5563", // dev-theme muted-foreground
              marginTop: "30px",
              marginBottom: "50px",
              textAlign: "center",
              maxWidth: "880px",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            KOVARI helps solo travelers, friends, and small groups match, plan trips together, and explore destinations safely — without chaos or guesswork.
          </p>

          {/* CTA Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#007aff", // dev-theme primary
              color: "#ffffff",
              padding: "20px 48px",
              borderRadius: "50px",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            Get Early Access
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
