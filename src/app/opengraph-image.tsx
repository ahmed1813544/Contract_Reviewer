import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Contract.Review — Free AI Contract Analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Subtle grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top label */}
        <div
          style={{
            color: "#f59e0b",
            fontSize: 18,
            letterSpacing: "0.2em",
            marginBottom: 32,
            textTransform: "uppercase",
          }}
        >
          CONTRACT.REVIEW
        </div>

        {/* Headline */}
        <div
          style={{
            color: "#e8e6e1",
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.1,
            marginBottom: 24,
            maxWidth: 800,
          }}
        >
          Review any contract.
          <br />
          <span style={{ color: "#f59e0b" }}>Understand the risk.</span>
        </div>

        {/* Subline */}
        <div style={{ color: "rgba(232,230,225,0.5)", fontSize: 24, marginBottom: 48 }}>
          Free · Local AI · No account · No data leaks
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {["Risk Scoring", "Clause Detection", "Key Dates", "Recommendations"].map((f) => (
            <div
              key={f}
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#f59e0b",
                padding: "8px 16px",
                fontSize: 16,
                borderRadius: 2,
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* Bottom right: powered by */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 80,
            color: "rgba(232,230,225,0.2)",
            fontSize: 16,
          }}
        >
          Powered by Ollama + Llama 3.2
        </div>
      </div>
    ),
    { ...size }
  );
}
