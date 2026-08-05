import { useEffect, useState } from "react";
import type { Section } from "./data";
import { CityScene } from "./CityScene";
import { HUD } from "./HUD";

export function CityExperience() {
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setBooting(false), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted || booting) return;
    const seen = window.sessionStorage.getItem("opzblue:tutorial-seen");
    if (seen === "1") setTutorialOpen(false);
  }, [mounted, booting]);

  const closeTutorial = () => {
    setTutorialOpen(false);
    window.sessionStorage.setItem("opzblue:tutorial-seen", "1");
  };

  if (!mounted) return <BootScreen />;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#020104" }}>
      <CityScene
        activeId={activeId}
        onSelect={(s: Section | null) => setActiveId(s?.id ?? null)}
      />
      <HUD
        activeId={activeId}
        onSelect={(s) => setActiveId(s?.id ?? null)}
      />
      {!booting && tutorialOpen && <TutorialOverlay onEnter={closeTutorial} />}
      {booting && <BootScreen />}
    </div>
  );
}

function BootScreen() {
  return (
    <div className="cy-boot">
      <div className="cy-boot__eyebrow">NEURAL CITY INTERFACE // GEN-02</div>
      <div className="cy-boot__brand cy-flicker">OPZBLUE® 26&apos;</div>
      <div className="cy-boot__copy">
        STREAMING CITY · LINKING SHADERS · CALIBRATING REFLECTIONS
      </div>
      <div className="cy-boot__track">
        <div className="cy-boot__bar" />
      </div>
    </div>
  );
}

function TutorialOverlay({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="cy-tutorial" role="dialog" aria-modal="true" aria-label="World controls">
      <div className="cy-tutorial__noise" />
      <div className="cy-tutorial__panel">
        <div className="cy-tutorial__kicker">// QUICK START</div>
        <h1>ENTER THE GRID</h1>
        <p>
          Walk through the city to discover work, systems, and contact nodes. Project
          billboards are interactive.
        </p>

        <div className="cy-tutorial__controls">
          <div>
            <span className="cy-tutorial__label">MOVE</span>
            <div className="cy-key-grid" aria-label="WASD movement keys">
              <span />
              <kbd>W</kbd>
              <span />
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </div>
          </div>
          <div>
            <span className="cy-tutorial__label">JUMP / BOOST</span>
            <kbd className="cy-key-space">SPACE</kbd>
            <small>Hold SHIFT while moving to sprint.</small>
          </div>
        </div>

        <button className="cy-enter" onClick={onEnter}>
          <span>ENTER WORLD</span>
          <b>↘</b>
        </button>

        <div className="cy-tutorial__foot">
          MOBILE: USE THE RED CONTROL PAD · TAP BILLBOARDS TO OPEN PROJECTS
        </div>
      </div>
    </div>
  );
}
