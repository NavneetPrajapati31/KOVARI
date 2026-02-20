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
          backgroundImage: "radial-gradient(circle at center, #1a1a1a 0%, #000 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            borderRadius: "40px",
            background: "rgba(25, 25, 25, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h1
              style={{
                fontSize: 100,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                margin: 0,
                backgroundImage: "linear-gradient(to bottom right, #ffffff, #a3a3a3)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              KOVARI
            </h1>
          </div>
          
          <p
            style={{
              fontSize: 42,
              fontWeight: 500,
              color: "#a3a3a3",
              marginTop: 30,
              marginBottom: 0,
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            We're making travel more human.
          </p>
          <p
            style={{
              fontSize: 32,
              color: "#737373",
              marginTop: 20,
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            Connect, plan, and travel with like-minded individuals.
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
