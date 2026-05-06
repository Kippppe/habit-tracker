import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { ACHIEVEMENT_META } from "@/lib/types/achievements";
import type { AchievementKind } from "@/lib/types/achievements";

export const runtime = "edge";

const W = 1080;
const H = 1920;

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const kind = (searchParams.get("kind") ?? "day_complete") as AchievementKind;
  const habitName = searchParams.get("habit") ?? "";

  const meta = ACHIEVEMENT_META[kind] ?? ACHIEVEMENT_META.day_complete;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: "#1a1814",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Background texture grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(139,40,32,0.15) 0%, transparent 60%)",
          }}
        />

        {/* Hanko stamp (SVG-like box) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 320,
            height: 320,
            background: "#8b2820",
            borderRadius: 16,
            marginBottom: 64,
            boxShadow: "0 0 120px rgba(139,40,32,0.6)",
            position: "relative",
          }}
        >
          {/* Inner border */}
          <div
            style={{
              position: "absolute",
              inset: 14,
              border: "3px solid rgba(244,237,225,0.6)",
              borderRadius: 8,
            }}
          />
          <span
            style={{
              fontSize: 200,
              color: "#f4ede1",
              lineHeight: 1,
            }}
          >
            {meta.kanji}
          </span>
        </div>

        {/* Achievement text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            marginBottom: 80,
          }}
        >
          <span
            style={{
              fontSize: 72,
              color: "#f4ede1",
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            {meta.title}
          </span>
          <span style={{ fontSize: 40, color: "rgba(244,237,225,0.55)" }}>
            {meta.subtitle}
          </span>
          {habitName && (
            <span
              style={{
                fontSize: 36,
                color: "#b8463a",
                marginTop: 8,
              }}
            >
              {habitName}
            </span>
          )}
        </div>

        {/* Logo + domain */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            position: "absolute",
            bottom: 120,
          }}
        >
          <span
            style={{
              fontSize: 48,
              color: "rgba(244,237,225,0.35)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            kipwork
          </span>
          <span style={{ fontSize: 28, color: "rgba(244,237,225,0.2)" }}>
            habit tracker
          </span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
    }
  );
  } catch (err) {
    console.error("[og/achievement]", err);
    return new Response("Failed to generate image", { status: 500 });
  }
}
