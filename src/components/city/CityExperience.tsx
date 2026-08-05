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
    const timer = window.setTimeout(() => setBooting(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) return <BootScreen />;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#020104" }}>
      <CityScene
        activeId={activeId}
        onSelect={(section: Section | null) => setActiveId(section?.id ?? null)}
      />
      <HUD
        activeId={activeId}
        onSelect={(section) => setActiveId(section?.id ?? null)}
      />
      {booting && <BootScreen />}
    </div>
  );
}

function BootScreen() {
  return (
    <div className="cy-boot">
      <div className="cy-boot__eyebrow">OPZBLUE // GEN-02 WORLD</div>
      <div className="cy-boot__brand cy-flicker">OPZBLUE® 26&apos;</div>
      <div className="cy-boot__copy">CONNECTING · COMPILING SHADERS · ENTERING WORLD</div>
      <div className="cy-boot__track">
        <div className="cy-boot__bar" />
      </div>
    </div>
  );
}
