import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Job Details";
  const company = searchParams.get("company") || "Qelsa";
  const location = searchParams.get("location") || "";
  const workType = searchParams.get("workType") || "";
  const workplaceType = searchParams.get("workplaceType") || "";
  const logo = searchParams.get("logo") || "";

  const initial = company.trim().charAt(0).toUpperCase() || "Q";
  const tags = [location, workType, workplaceType].filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#06060f",
          backgroundImage:
            "radial-gradient(circle at 90% 12%, rgba(0, 212, 255, 0.18) 0%, transparent 45%), radial-gradient(circle at 8% 88%, rgba(168, 85, 247, 0.16) 0%, transparent 45%)",
          padding: "56px 72px",
          fontFamily: "sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #00d4ff 0%, #7c2ff3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 26,
                color: "#ffffff",
              }}
            >
              Q
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: "#ffffff" }}>
              qelsa
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              borderRadius: 9999,
              backgroundColor: "rgba(0, 212, 255, 0.1)",
              border: "1px solid rgba(0, 212, 255, 0.35)",
              color: "#00d4ff",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            Hiring on Qelsa
          </div>
        </div>

        {/* Center: Company Logo + Title + Tags */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Company Row */}
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {logo ? (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 22,
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  padding: 10,
                }}
              >
                <img
                  src={logo}
                  width="76"
                  height="76"
                  style={{
                    objectFit: "contain",
                    borderRadius: 14,
                  }}
                  alt={company}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 22,
                  background: "linear-gradient(135deg, #7c2ff3 0%, #00d4ff 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                {initial}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 34, fontWeight: 700, color: "#ffffff" }}>
                  {company}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  ✓
                </div>
              </div>

              {tags.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {tags.map((tag, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "5px 14px",
                        borderRadius: 8,
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "rgba(255, 255, 255, 0.75)",
                        fontSize: 16,
                        fontWeight: 500,
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Job Title */}
          <div
            style={{
              fontSize: title.length > 40 ? 46 : 56,
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#ffffff",
              letterSpacing: -1,
              maxWidth: 1050,
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: 22,
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: 18,
            color: "rgba(255, 255, 255, 0.55)",
            fontWeight: 500,
          }}
        >
          <span>Find your next role with AI-powered skill matching</span>
          <span style={{ color: "#00d4ff", fontWeight: 700 }}>qelsa.com</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    }
  );
}
