import { useEffect, useRef, useState } from "react";
import { SECTIONS, ACCENTS, BRAND_RED, type Section } from "./data";

export function HUD({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (s: Section | null) => void;
}) {
  const active = SECTIONS.find((s) => s.id === activeId) ?? null;
  const fps = useFps();
  const connected = Math.min(7, 2 + Math.floor((fps % 30) / 10));

  return (
    <>
      {/* ============ TOP LEFT — BRAND ============ */}
      <div
        style={{
          position: "fixed",
          top: 18,
          left: 22,
          zIndex: 30,
          color: BRAND_RED,
          lineHeight: 1,
          letterSpacing: 1,
        }}
      >
        <div
          className="cy-flicker"
          style={{
            fontSize: 52,
            fontWeight: 900,
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
            textShadow: `0 0 14px ${BRAND_RED}88`,
          }}
        >
          OPZBLUE
          <sup style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}>©</sup>
          <span style={{ fontSize: 28, marginLeft: 4, marginTop: 4 }}>26&apos;</span>
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 10,
            letterSpacing: 3,
            color: "#ff6478",
            opacity: 0.85,
          }}
        >
          ニューラル・エンジニア
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            letterSpacing: 1.5,
            color: BRAND_RED,
            fontWeight: 700,
          }}
        >
          AI ENGINEER
          <br />
          &amp; NEURAL SYSTEMS DESIGNER
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            letterSpacing: 2,
            color: BRAND_RED,
            opacity: 0.7,
          }}
        >
          RAISED ON &apos;90S CYBERPUNK
        </div>
      </div>

      {/* ============ TOP CENTER — PILL NAV ============ */}
      <nav
        style={{
          position: "fixed",
          top: 22,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 18,
          alignItems: "center",
          zIndex: 30,
        }}
      >
        <PillButton
          label="EXPLORE"
          filled
          onClick={() => onSelect(null)}
          active={!active}
        />
        <PillButton
          label="WORKS"
          onClick={() => onSelect(SECTIONS.find((s) => s.kind === "project") ?? null)}
        />
        <PillButton
          label="ABOUT"
          onClick={() => onSelect(SECTIONS.find((s) => s.kind === "about") ?? null)}
        />
      </nav>

      {/* ============ TOP RIGHT — TELEMETRY ============ */}
      <div
        style={{
          position: "fixed",
          top: 18,
          right: 22,
          zIndex: 30,
          color: BRAND_RED,
          fontSize: 11,
          letterSpacing: 2,
          textAlign: "right",
          textShadow: `0 0 6px ${BRAND_RED}88`,
        }}
        className="cy-flicker"
      >
          Connected: {connected}, Engine: WebGPU, Frame: {(1000 / Math.max(1, fps)).toFixed(1)} ms, {fps} FPS
      </div>

      {/* ============ BOTTOM LEFT — CONTROL PAD ============ */}
      <div
        style={{
          position: "fixed",
          left: 22,
          bottom: 70,
          zIndex: 30,
          color: BRAND_RED,
          fontSize: 10,
          letterSpacing: 2,
        }}
      >
        <DPad />
        <div style={{ marginLeft: 38, marginTop: 6, fontWeight: 700 }}>CONTROL</div>
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <button
            style={{
              ...pillStyle(true, false),
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            SPACE
          </button>
          <span style={{ color: BRAND_RED, fontWeight: 700 }}>JUMP</span>
        </div>
      </div>

      {/* ============ BOTTOM RIGHT — ROUND BUTTON ============ */}
      <button
        title="Open communication channel"
        onClick={() => onSelect(SECTIONS.find((s) => s.kind === "contact") ?? null)}
        style={{
          position: "fixed",
          right: 22,
          bottom: 70,
          width: 52,
          height: 52,
          borderRadius: 999,
          background: BRAND_RED,
          color: "#fff",
          border: "none",
          cursor: "pointer",
          zIndex: 30,
          boxShadow: `0 0 24px ${BRAND_RED}99`,
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: 2,
          fontFamily: "inherit",
        }}
      >
        ●●●
      </button>

      {/* ============ LEFT FLOATING LIST (project quick-nav, subtle) ============ */}
      <div
        style={{
          position: "fixed",
          left: 22,
          top: 280,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          zIndex: 28,
          fontSize: 10,
          letterSpacing: 2,
        }}
      >
        {SECTIONS.map((s) => {
          const c = ACCENTS[s.accent];
          const isActive = activeId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(isActive ? null : s)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: isActive ? c : "#ff6478",
                fontFamily: "inherit",
                padding: "2px 0",
                textAlign: "left",
                opacity: isActive ? 1 : 0.7,
                textShadow: isActive ? `0 0 8px ${c}` : "none",
              }}
            >
              &gt; {s.title}
            </button>
          );
        })}
      </div>

      {/* ============ CENTER HERO (overview only) ============ */}
      {!active && (
        <div
          style={{
            position: "fixed",
            bottom: 140,
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 25,
            pointerEvents: "none",
          }}
        >
          <div
            className="cy-flicker"
            style={{
              fontSize: 10,
              letterSpacing: 8,
              color: BRAND_RED,
              marginBottom: 10,
            }}
          >
            ▼ STEP INTO THE GRID ▼
          </div>
        </div>
      )}

      {/* ============ DETAIL DOSSIER ============ */}
      {active && <Dossier section={active} onClose={() => onSelect(null)} />}

      {/* ============ BOTTOM MARQUEE ============ */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 28,
          background:
            "linear-gradient(180deg, transparent, rgba(0,0,0,0.85))",
          borderTop: `1px solid ${BRAND_RED}55`,
          overflow: "hidden",
          zIndex: 28,
          pointerEvents: "none",
        }}
      >
        <div
          className="cy-marquee"
          style={{
            whiteSpace: "nowrap",
            color: BRAND_RED,
            fontSize: 10,
            letterSpacing: 4,
            lineHeight: "28px",
            display: "inline-block",
          }}
        >
          {Array.from({ length: 2 })
            .map(
              () =>
                "▲ SECTOR 07 ONLINE   ◆ 4M PREDICTIONS/MIN   ▲ GPU CLUSTER NOMINAL   ◆ NEW PROJECT: SYNTHWAVE.GEN   ▲ AGENT MESH UPLINK STABLE   ◆ AVAILABLE FOR PRINCIPAL ROLES   ",
            )
            .join("")}
        </div>
      </div>

      {/* film-grade scanlines */}
      <div
        className="cy-scanlines"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "overlay",
          opacity: 0.35,
          zIndex: 10,
        }}
      />
    </>
  );
}

/* ---------- helpers ---------- */

function pillStyle(filled: boolean, active: boolean): React.CSSProperties {
  return {
    background: filled ? BRAND_RED : "transparent",
    color: filled ? "#fff" : BRAND_RED,
    border: filled ? "none" : `1px solid ${BRAND_RED}88`,
    padding: "10px 26px",
    borderRadius: 999,
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 3,
    cursor: "pointer",
    boxShadow: filled
      ? `0 0 18px ${BRAND_RED}77`
      : active
        ? `0 0 14px ${BRAND_RED}66`
        : "none",
    transition: "all .2s ease",
  };
}

function PillButton({
  label,
  filled = false,
  active = false,
  onClick,
}: {
  label: string;
  filled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={pillStyle(filled, active)}>
      {label}
    </button>
  );
}

function DPad() {
  const arrow: React.CSSProperties = {
    width: 30,
    height: 30,
    background: BRAND_RED,
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: 10,
    fontWeight: 900,
    fontFamily: "inherit",
    boxShadow: `0 0 12px ${BRAND_RED}88`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 30px)", gap: 4 }}>
      <span />
      <button style={arrow}>▲</button>
      <span />
      <button style={arrow}>◀</button>
      <button style={arrow}>▼</button>
      <button style={arrow}>▶</button>
    </div>
  );
}

function useFps() {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const last = useRef(performance.now());
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      frames.current++;
      const now = performance.now();
      if (now - last.current >= 500) {
        setFps(Math.round((frames.current * 1000) / (now - last.current)));
        frames.current = 0;
        last.current = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

function Dossier({ section, onClose }: { section: Section; onClose: () => void }) {
  const accent = ACCENTS[section.accent];
  return (
    <aside
      className="cy-panel"
      style={{
        position: "fixed",
        right: 22,
        top: "50%",
        transform: "translateY(-50%)",
        width: "min(420px, 88vw)",
        padding: 22,
        zIndex: 35,
        borderColor: `${accent}99`,
        boxShadow: `0 0 30px ${accent}55, inset 0 0 20px ${accent}22`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          letterSpacing: 3,
          color: accent,
          marginBottom: 8,
        }}
      >
        <span>// DOSSIER · {section.kind.toUpperCase()}</span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "1px solid currentColor",
            color: accent,
            cursor: "pointer",
            padding: "2px 8px",
            fontFamily: "inherit",
            fontSize: 10,
            letterSpacing: 2,
          }}
        >
          CLOSE ✕
        </button>
      </div>
      <h2
        style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 900,
          color: accent,
          letterSpacing: -0.5,
          textShadow: `0 0 16px ${accent}88`,
        }}
      >
        {section.title}
      </h2>
      <div style={{ marginTop: 4, color: "#ffd6dd", fontSize: 12, opacity: 0.85 }}>
        {section.subtitle}
      </div>
      <p style={{ marginTop: 16, lineHeight: 1.55, fontSize: 13, color: "#ffe6ea" }}>
        {section.description}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
        {section.tags.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10,
              letterSpacing: 2,
              padding: "4px 8px",
              border: `1px solid ${accent}66`,
              color: accent,
              background: `${accent}11`,
            }}
          >
            {t}
          </span>
        ))}
      </div>
      {section.kind === "contact" && (
        <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
          {[
            ["EMAIL", "opzblue@protonmail.com"],
            ["X / TWITTER", "@opzblue"],
            ["GITHUB", "github.com/opzblue"],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 10px",
                border: `1px solid ${accent}44`,
                fontSize: 12,
              }}
            >
              <span style={{ opacity: 0.6, letterSpacing: 2, fontSize: 10 }}>{k}</span>
              <span style={{ color: accent }}>{v}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 18, fontSize: 10, letterSpacing: 2, opacity: 0.5 }}>
        ◆ SIGNAL LOCK ACQUIRED · TRANSMIT INSTANT
      </div>
    </aside>
  );
}
