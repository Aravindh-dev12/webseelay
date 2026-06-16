import { useEffect, useState } from "react";
import type { Section } from "./data";
import { CityScene } from "./CityScene";
import { HUD } from "./HUD";

export function CityExperience() {
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setBooting(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return <BootScreen />;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#02030a" }}>
      <CityScene
        activeId={activeId}
        onSelect={(s: Section | null) => setActiveId(s?.id ?? null)}
      />
      <HUD activeId={activeId} onSelect={(s) => setActiveId(s?.id ?? null)} />
      {booting && <BootScreen />}
    </div>
  );
}

function BootScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#02030a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        fontFamily: "ui-monospace, monospace",
      }}
    >
      <div
        className="cy-grad cy-flicker"
        style={{
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: -1,
        }}
      >
        OPZBLUE//OS
      </div>
      <div style={{ fontSize: 11, letterSpacing: 4, color: "#9ef3ff" }}>
        BOOTING NEO_METROPOLIS · LOADING SHADERS · STREAMING REELS
      </div>
      <div
        style={{
          width: 240,
          height: 2,
          background: "rgba(0,240,255,0.15)",
          overflow: "hidden",
          marginTop: 8,
        }}
      >
        <div
          style={{
            width: "40%",
            height: "100%",
            background: "linear-gradient(90deg, #00f0ff, #ff00e5)",
            animation: "cy-marquee 1.4s linear infinite",
          }}
        />
      </div>
    </div>
  );
}
