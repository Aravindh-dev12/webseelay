import { useEffect, useRef, useState } from "react";
import { SECTIONS, BRAND_RED, type Section } from "./data";

type ControlCode = "KeyW" | "KeyA" | "KeyS" | "KeyD" | "Space";

function sendControl(code: ControlCode, down: boolean) {
  window.dispatchEvent(new CustomEvent("city-control", { detail: { code, down } }));
}

const uiFont = '"Arial Narrow", "Roboto Condensed", ui-monospace, monospace';

export function HUD({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (s: Section | null) => void;
}) {
  const active = SECTIONS.find((s) => s.id === activeId) ?? null;
  const fps = useFps();

  return (
    <>
      <div style={brandStyle}>
        <div style={brandMainStyle}>OPZBLUE®</div>
        <div style={brandYearStyle}>26&apos;</div>
        <div style={brandSubStyle}>INTERACTIVE DIGITAL WORLD</div>
      </div>

      <nav style={navStyle} aria-label="World navigation">
        <HudNav label="HOME" active={!active} onClick={() => onSelect(null)} />
        <HudNav
          label="WORK"
          active={active?.kind === "project"}
          onClick={() => onSelect(SECTIONS.find((s) => s.kind === "project") ?? null)}
        />
        <HudNav
          label="ABOUT"
          active={active?.kind === "about"}
          onClick={() => onSelect(SECTIONS.find((s) => s.kind === "about") ?? null)}
        />
      </nav>

      <div style={telemetryStyle}>
        <div>CONNECTED · {Math.max(1, Math.round(fps / 20))}</div>
        <div>{fps} FPS</div>
      </div>

      <div style={controlsStyle}>
        <div style={controlGridStyle}>
          <span />
          <HoldButton label="↑" code="KeyW" />
          <span />
          <HoldButton label="←" code="KeyA" />
          <HoldButton label="↓" code="KeyS" />
          <HoldButton label="→" code="KeyD" />
        </div>
        <div style={controlCaptionStyle}>CONTROL</div>
        <div style={jumpRowStyle}>
          <HoldButton label="SPACE" code="Space" wide />
          <span>JUMP</span>
        </div>
      </div>

      <button
        aria-label="Contact"
        onClick={() => onSelect(SECTIONS.find((s) => s.kind === "contact") ?? null)}
        style={contactStyle}
      >
        •••
      </button>

      {!active && (
        <div style={hintStyle}>
          <span style={{ opacity: 0.6 }}>▼</span> WALK TO THE SCREEN <span style={{ opacity: 0.6 }}>▼</span>
        </div>
      )}

      {active && (
        <aside style={panelStyle}>
          <button onClick={() => onSelect(null)} style={panelCloseStyle}>×</button>
          <div style={panelKickerStyle}>// {active.kind.toUpperCase()}</div>
          <h2 style={panelTitleStyle}>{active.title}</h2>
          <div style={panelSubtitleStyle}>{active.subtitle}</div>
          <p style={panelCopyStyle}>{active.description}</p>
          <div style={tagWrapStyle}>
            {active.tags.map((tag) => (
              <span key={tag} style={tagStyle}>{tag}</span>
            ))}
          </div>
        </aside>
      )}

      <div style={scanlineStyle} aria-hidden="true" />
    </>
  );
}

function HudNav({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...navButtonStyle,
        background: active ? BRAND_RED : "transparent",
        color: active ? "#120006" : BRAND_RED,
        boxShadow: active ? `0 0 22px ${BRAND_RED}55` : "none",
      }}
    >
      {label}
    </button>
  );
}

function HoldButton({ label, code, wide = false }: { label: string; code: ControlCode; wide?: boolean }) {
  const release = () => sendControl(code, false);
  return (
    <button
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        sendControl(code, true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={(e) => e.buttons && release()}
      style={{ ...controlButtonStyle, width: wide ? 58 : 27 }}
    >
      {label}
    </button>
  );
}

function useFps() {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const last = useRef(0);
  useEffect(() => {
    last.current = performance.now();
    let raf = 0;
    const tick = () => {
      frames.current += 1;
      const now = performance.now();
      if (now - last.current > 500) {
        setFps(Math.round((frames.current * 1000) / (now - last.current)));
        frames.current = 0;
        last.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

const brandStyle: React.CSSProperties = { position: "fixed", left: 22, top: 18, zIndex: 40, color: BRAND_RED, fontFamily: uiFont, pointerEvents: "none" };
const brandMainStyle: React.CSSProperties = { fontSize: "clamp(32px,4.5vw,60px)", lineHeight: 0.86, letterSpacing: -3, fontWeight: 950, textShadow: `0 0 20px ${BRAND_RED}44` };
const brandYearStyle: React.CSSProperties = { position: "absolute", left: "100%", top: 1, marginLeft: 8, fontSize: 20, fontWeight: 900 };
const brandSubStyle: React.CSSProperties = { marginTop: 12, fontSize: 8, letterSpacing: 2.6, fontWeight: 800, opacity: 0.75 };
const navStyle: React.CSSProperties = { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 42, display: "flex", gap: 24, alignItems: "center", fontFamily: uiFont };
const navButtonStyle: React.CSSProperties = { border: 0, borderRadius: 999, padding: "10px 18px", fontSize: 10, fontWeight: 950, letterSpacing: 1.2, cursor: "pointer", fontFamily: uiFont };
const telemetryStyle: React.CSSProperties = { position: "fixed", top: 20, right: 22, zIndex: 40, color: BRAND_RED, fontFamily: uiFont, fontSize: 8, letterSpacing: 1.6, lineHeight: 1.55, textAlign: "right", opacity: 0.8, pointerEvents: "none" };
const controlsStyle: React.CSSProperties = { position: "fixed", left: 22, bottom: 48, zIndex: 43, color: BRAND_RED, fontFamily: uiFont, userSelect: "none", touchAction: "none" };
const controlGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3,27px)", gap: 4 };
const controlButtonStyle: React.CSSProperties = { height: 27, border: 0, background: BRAND_RED, color: "#120006", fontWeight: 950, fontSize: 9, cursor: "pointer", boxShadow: `0 0 16px ${BRAND_RED}44`, touchAction: "none" };
const controlCaptionStyle: React.CSSProperties = { margin: "7px 0 0 27px", fontSize: 8, fontWeight: 950, letterSpacing: 1.8 };
const jumpRowStyle: React.CSSProperties = { marginTop: 13, display: "flex", alignItems: "center", gap: 9, fontSize: 8, fontWeight: 950, letterSpacing: 1.2 };
const contactStyle: React.CSSProperties = { position: "fixed", right: 22, bottom: 48, zIndex: 43, width: 48, height: 48, borderRadius: "50%", border: 0, background: BRAND_RED, color: "#120006", fontWeight: 950, fontSize: 16, letterSpacing: 2, boxShadow: `0 0 28px ${BRAND_RED}55`, cursor: "pointer" };
const hintStyle: React.CSSProperties = { position: "fixed", left: "50%", bottom: 52, transform: "translateX(-50%)", zIndex: 38, color: BRAND_RED, fontFamily: uiFont, fontSize: 8, letterSpacing: 3.2, fontWeight: 900, pointerEvents: "none", textShadow: `0 0 12px ${BRAND_RED}55` };
const panelStyle: React.CSSProperties = { position: "fixed", right: 22, top: "50%", transform: "translateY(-50%)", zIndex: 44, width: "min(330px,78vw)", padding: 20, background: "rgba(8,2,6,.72)", border: `1px solid ${BRAND_RED}66`, backdropFilter: "blur(14px)", boxShadow: `0 0 34px ${BRAND_RED}22`, color: "#ffe8ec", fontFamily: uiFont };
const panelCloseStyle: React.CSSProperties = { position: "absolute", right: 12, top: 10, border: 0, background: "transparent", color: BRAND_RED, fontSize: 22, cursor: "pointer" };
const panelKickerStyle: React.CSSProperties = { fontSize: 8, letterSpacing: 2.5, color: BRAND_RED, opacity: 0.7 };
const panelTitleStyle: React.CSSProperties = { margin: "10px 0 0", fontSize: 25, lineHeight: 1, color: BRAND_RED, letterSpacing: -1 };
const panelSubtitleStyle: React.CSSProperties = { marginTop: 7, fontSize: 9, letterSpacing: 1.8, opacity: 0.75 };
const panelCopyStyle: React.CSSProperties = { marginTop: 14, fontSize: 12, lineHeight: 1.55, opacity: 0.86 };
const tagWrapStyle: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 };
const tagStyle: React.CSSProperties = { border: `1px solid ${BRAND_RED}44`, padding: "4px 7px", fontSize: 8, letterSpacing: 1.3, color: BRAND_RED };
const scanlineStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 15, pointerEvents: "none", opacity: 0.12, backgroundImage: "repeating-linear-gradient(0deg,rgba(255,20,65,.08) 0,rgba(255,20,65,.08) 1px,transparent 1px,transparent 4px)" };
