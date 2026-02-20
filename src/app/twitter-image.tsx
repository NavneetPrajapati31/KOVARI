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
          backgroundColor: "#000000",
          backgroundImage: "radial-gradient(circle at 50% -20%, #2a2a2a 0%, #000000 80%)",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Top Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 24px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "40px",
            marginBottom: "50px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          }}
        >
          <span style={{ fontSize: 22, color: "#a1a1aa", fontWeight: 500, letterSpacing: "0.02em" }}>
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
              fontWeight: 700,
              letterSpacing: "-0.04em",
              margin: 0,
              lineHeight: 1.1,
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span>Connect & Travel</span>
            <span style={{ display: "flex", alignItems: "center" }}>
              With the <span style={{ color: "#d4d4d8", paddingLeft: "20px", paddingRight: "20px" }}>Right</span> People
            </span>
          </h1>
          
          {/* Hero Subtitle */}
          <p
            style={{
              fontSize: 32,
              color: "#a1a1aa",
              marginTop: "40px",
              marginBottom: "60px",
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
              backgroundColor: "#ffffff",
              color: "#000000",
              padding: "24px 48px",
              borderRadius: "50px",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.01em",
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
