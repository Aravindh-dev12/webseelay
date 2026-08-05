import { useEffect, useRef, useState } from "react";
import { SECTIONS, BRAND_RED, type Section } from "./data";

type ControlCode = "KeyW" | "KeyA" | "KeyS" | "KeyD" | "Space";

function sendControl(code: ControlCode, down: boolean) {
  window.dispatchEvent(new CustomEvent("city-control", { detail: { code, down } }));
}

const uiFont = '"Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif';

export function HUD({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (section: Section | null) => void;
}) {
  const active = SECTIONS.find((section) => section.id === activeId) ?? null;
  const fps = useFps();
  const project = SECTIONS.find((section) => section.kind === "project") ?? null;
  const about = SECTIONS.find((section) => section.kind === "about") ?? null;

  return (
    <>
      <header style={brandStyle}>
        <div style={brandLineStyle}>
          <span style={brandMainStyle}>OPZBLUE</span>
          <sup style={brandRegStyle}>®</sup>
          <span style={brandYearStyle}>26&apos;</span>
        </div>
        <div style={brandJpStyle}>クリエイティブ・デベロップメント</div>
        <div style={brandRoleStyle}>CREATIVE DEVELOPMENT<br />&amp; EXPERIENCE DESIGNER</div>
        <div style={brandRaisedStyle}>RAISED ON &apos;90S CLASSICS</div>
      </header>

      <nav style={navStyle} aria-label="Portfolio navigation">
        <NavButton label="EXPLORE" active={!active} filled onClick={() => onSelect(null)} />
        <NavButton label="WORKS" active={active?.kind === "project"} onClick={() => onSelect(project)} />
        <NavButton label="ABOUT" active={active?.kind === "about"} onClick={() => onSelect(about)} />
      </nav>

      <div style={telemetryStyle} aria-hidden="true">
        <div>CONNECTED: {Math.max(1, Math.round(fps / 18))}</div>
        <div>ENGINE: WEBGL</div>
        <div>FRAME: {(1000 / Math.max(1, fps)).toFixed(1)} MS · {fps} FPS</div>
      </div>

      <div style={controlWrapStyle}>
        <div style={controlGridStyle}>
          <span />
          <HoldButton label="▲" code="KeyW" />
          <span />
          <HoldButton label="◀" code="KeyA" />
          <HoldButton label="▼" code="KeyS" />
          <HoldButton label="▶" code="KeyD" />
        </div>
        <span style={controlLabelStyle}>CONTROL</span>
        <div style={jumpStyle}>
          <HoldButton label="SPACE" code="Space" wide />
          <span>JUMP</span>
        </div>
      </div>

      <button
        aria-label="Open contact"
        onClick={() => onSelect(SECTIONS.find((section) => section.kind === "contact") ?? null)}
        style={contactStyle}
      >
        <span style={{ transform: "translateY(-2px)", display: "block" }}>•••</span>
      </button>

      {active && (
        <div style={activeRibbonStyle}>
          <div style={activeKickerStyle}>// {active.kind.toUpperCase()} NODE</div>
          <div style={activeTitleStyle}>{active.title}</div>
          <div style={activeSubtitleStyle}>{active.subtitle}</div>
          <button onClick={() => onSelect(null)} style={activeCloseStyle}>CLOSE ×</button>
        </div>
      )}

      <div style={scanlineStyle} aria-hidden="true" />
      <div style={edgeVignetteStyle} aria-hidden="true" />
    </>
  );
}

function NavButton({
  label,
  active,
  filled = false,
  onClick,
}: {
  label: string;
  active: boolean;
  filled?: boolean;
  onClick: () => void;
}) {
  const isFilled = filled && active;
  return (
    <button
      onClick={onClick}
      style={{
        ...navButtonStyle,
        background: isFilled ? BRAND_RED : "transparent",
        color: isFilled ? "#140006" : BRAND_RED,
        opacity: active || filled ? 1 : 0.9,
        textShadow: isFilled ? "none" : `0 0 12px ${BRAND_RED}44`,
        boxShadow: isFilled ? `0 0 24px ${BRAND_RED}55` : "none",
      }}
    >
      {label}
    </button>
  );
}

function HoldButton({
  label,
  code,
  wide = false,
}: {
  label: string;
  code: ControlCode;
  wide?: boolean;
}) {
  const release = () => sendControl(code, false);
  return (
    <button
      style={{ ...controlButtonStyle, width: wide ? 58 : 25 }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        sendControl(code, true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={(event) => event.buttons && release()}
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
      if (now - last.current >= 500) {
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

const brandStyle: React.CSSProperties = {
  position: "fixed",
  left: 28,
  top: 30,
  zIndex: 50,
  color: BRAND_RED,
  fontFamily: uiFont,
  pointerEvents: "none",
  textTransform: "uppercase",
};
const brandLineStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", lineHeight: 0.86 };
const brandMainStyle: React.CSSProperties = { fontSize: "clamp(34px,4.2vw,58px)", fontWeight: 950, letterSpacing: -3.4 };
const brandRegStyle: React.CSSProperties = { fontSize: 9, marginLeft: 3, marginTop: 0 };
const brandYearStyle: React.CSSProperties = { fontSize: "clamp(18px,2vw,28px)", fontWeight: 950, marginLeft: 7, marginTop: -1, letterSpacing: -1.5 };
const brandJpStyle: React.CSSProperties = { marginTop: 11, fontSize: 7, letterSpacing: 1.7, opacity: 0.82 };
const brandRoleStyle: React.CSSProperties = { marginTop: 6, fontSize: 8, letterSpacing: 0.2, lineHeight: 1.13, fontWeight: 900 };
const brandRaisedStyle: React.CSSProperties = { marginTop: 3, fontSize: 7, letterSpacing: 0.3, fontWeight: 900 };
const navStyle: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  top: 34,
  transform: "translateX(-50%)",
  display: "flex",
  gap: "clamp(24px,5vw,72px)",
  alignItems: "center",
  zIndex: 51,
  fontFamily: uiFont,
};
const navButtonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 999,
  padding: "9px 19px",
  background: "transparent",
  cursor: "pointer",
  fontFamily: uiFont,
  fontSize: 9,
  fontWeight: 950,
  letterSpacing: 0.15,
};
const telemetryStyle: React.CSSProperties = {
  position: "fixed",
  right: 25,
  top: 31,
  zIndex: 50,
  color: BRAND_RED,
  fontFamily: uiFont,
  fontSize: 7,
  lineHeight: 1.5,
  textAlign: "right",
  letterSpacing: 0.7,
  opacity: 0.85,
  pointerEvents: "none",
};
const controlWrapStyle: React.CSSProperties = {
  position: "fixed",
  left: 28,
  top: 170,
  zIndex: 52,
  color: BRAND_RED,
  fontFamily: uiFont,
  userSelect: "none",
  touchAction: "none",
};
const controlGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3,25px)", gap: 3 };
const controlButtonStyle: React.CSSProperties = {
  height: 25,
  padding: 0,
  border: 0,
  background: BRAND_RED,
  color: "#120006",
  fontFamily: uiFont,
  fontWeight: 950,
  fontSize: 8,
  cursor: "pointer",
  boxShadow: `0 0 15px ${BRAND_RED}33`,
  touchAction: "none",
};
const controlLabelStyle: React.CSSProperties = { position: "absolute", left: 88, top: 34, fontSize: 7, letterSpacing: 0.8, fontWeight: 950 };
const jumpStyle: React.CSSProperties = { marginTop: 24, display: "flex", alignItems: "center", gap: 15, fontSize: 7, fontWeight: 950, letterSpacing: 0.7 };
const contactStyle: React.CSSProperties = {
  position: "fixed",
  right: 23,
  bottom: 24,
  zIndex: 52,
  width: 42,
  height: 42,
  borderRadius: "50%",
  border: 0,
  background: BRAND_RED,
  color: "#120006",
  boxShadow: `0 0 28px ${BRAND_RED}55`,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 950,
};
const activeRibbonStyle: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 18,
  transform: "translateX(-50%)",
  zIndex: 53,
  minWidth: "min(540px,72vw)",
  padding: "10px 42px 10px 14px",
  border: `1px solid ${BRAND_RED}55`,
  background: "rgba(5,1,5,.68)",
  backdropFilter: "blur(10px)",
  color: BRAND_RED,
  fontFamily: uiFont,
  boxShadow: `0 0 28px ${BRAND_RED}1f`,
};
const activeKickerStyle: React.CSSProperties = { fontSize: 7, letterSpacing: 1.4, opacity: 0.65 };
const activeTitleStyle: React.CSSProperties = { marginTop: 3, fontSize: 15, fontWeight: 950, letterSpacing: -0.3 };
const activeSubtitleStyle: React.CSSProperties = { marginTop: 1, fontSize: 7, letterSpacing: 0.9, opacity: 0.75 };
const activeCloseStyle: React.CSSProperties = { position: "absolute", right: 10, top: 10, border: 0, background: "transparent", color: BRAND_RED, cursor: "pointer", fontFamily: uiFont, fontSize: 7, fontWeight: 900 };
const scanlineStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 14, pointerEvents: "none", opacity: 0.14, mixBlendMode: "screen", backgroundImage: "repeating-linear-gradient(0deg,rgba(255,20,65,.07) 0,rgba(255,20,65,.07) 1px,transparent 1px,transparent 4px)" };
const edgeVignetteStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 13, pointerEvents: "none", background: "radial-gradient(circle at 52% 47%, transparent 48%, rgba(0,0,0,.18) 72%, rgba(0,0,0,.64) 115%)" };
