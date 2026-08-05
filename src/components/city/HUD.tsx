import { useEffect, useRef, useState } from "react";
import { SECTIONS, ACCENTS, BRAND_RED, type Section } from "./data";

type ControlCode = "KeyW" | "KeyA" | "KeyS" | "KeyD" | "Space";

function sendControl(code: ControlCode, down: boolean) {
  window.dispatchEvent(
    new CustomEvent("city-control", {
      detail: { code, down },
    }),
  );
}

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
      <header className="cy-brand">
        <div className="cy-brand__title cy-flicker">
          OPZBLUE<sup>®</sup><span>26&apos;</span>
        </div>
        <div className="cy-brand__jp">ニューラル・エンジニア</div>
        <div className="cy-brand__role">
          AI ENGINEER
          <br />
          &amp; NEURAL SYSTEMS DESIGNER
        </div>
        <div className="cy-brand__sub">RAISED ON &apos;90S CYBERPUNK</div>
      </header>

      <nav className="cy-nav" aria-label="Portfolio navigation">
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

      <div className="cy-telemetry cy-flicker">
        CONNECTED {connected} · WEBGL<br />
        {(1000 / Math.max(1, fps)).toFixed(1)} MS · {fps} FPS
      </div>

      <div className="cy-controls" aria-label="Movement controls">
        <DPad />
        <div className="cy-controls__caption">CONTROL</div>
        <div className="cy-jump-row">
          <HoldButton
            label="SPACE"
            onDown={() => sendControl("Space", true)}
            onUp={() => sendControl("Space", false)}
            className="cy-space-button"
          />
          <span>JUMP</span>
        </div>
      </div>

      <button
        className="cy-contact"
        title="Open communication channel"
        aria-label="Open contact"
        onClick={() => onSelect(SECTIONS.find((s) => s.kind === "contact") ?? null)}
      >
        <span>•••</span>
      </button>

      <div className="cy-sector-nav" aria-label="Project quick navigation">
        <span className="cy-sector-nav__label">CITY NODES</span>
        {SECTIONS.filter((s) => s.kind === "project").map((s, index) => {
          const c = ACCENTS[s.accent];
          const isActive = activeId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(isActive ? null : s)}
              style={{ "--node-color": c } as React.CSSProperties}
              className={isActive ? "is-active" : ""}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {s.title}
            </button>
          );
        })}
      </div>

      {!active && (
        <div className="cy-world-prompt">
          <span>▼</span> WALK FORWARD TO THE MAIN BILLBOARD <span>▼</span>
        </div>
      )}

      {active && <Dossier section={active} onClose={() => onSelect(null)} />}

      <div className="cy-marquee-shell" aria-hidden="true">
        <div className="cy-marquee">
          {Array.from({ length: 2 })
            .map(
              () =>
                "▲ SECTOR 07 ONLINE   ◆ 4M PREDICTIONS/MIN   ▲ GPU CLUSTER NOMINAL   ◆ MAIN BILLBOARD LIVE   ▲ AGENT MESH UPLINK STABLE   ◆ OPEN TO COLLABORATION   ",
            )
            .join("")}
        </div>
      </div>

      <div className="cy-scanlines" aria-hidden="true" />
      <div className="cy-vignette" aria-hidden="true" />
    </>
  );
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
    <button
      onClick={onClick}
      className={`cy-pill ${filled ? "cy-pill--filled" : ""} ${active ? "is-active" : ""}`}
    >
      {label}
    </button>
  );
}

function HoldButton({
  label,
  onDown,
  onUp,
  className = "",
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
  className?: string;
}) {
  return (
    <button
      className={className}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={(e) => {
        if (e.buttons) onUp();
      }}
    >
      {label}
    </button>
  );
}

function DPad() {
  return (
    <div className="cy-dpad">
      <span />
      <HoldButton
        label="▲"
        onDown={() => sendControl("KeyW", true)}
        onUp={() => sendControl("KeyW", false)}
      />
      <span />
      <HoldButton
        label="◀"
        onDown={() => sendControl("KeyA", true)}
        onUp={() => sendControl("KeyA", false)}
      />
      <HoldButton
        label="▼"
        onDown={() => sendControl("KeyS", true)}
        onUp={() => sendControl("KeyS", false)}
      />
      <HoldButton
        label="▶"
        onDown={() => sendControl("KeyD", true)}
        onUp={() => sendControl("KeyD", false)}
      />
    </div>
  );
}

function useFps() {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    last.current = performance.now();
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
      className="cy-dossier"
      style={{ "--dossier-accent": accent } as React.CSSProperties}
    >
      <div className="cy-dossier__topline">
        <span>// NODE · {section.kind.toUpperCase()}</span>
        <button onClick={onClose}>CLOSE ×</button>
      </div>
      <h2>{section.title}</h2>
      <div className="cy-dossier__subtitle">{section.subtitle}</div>
      <p>{section.description}</p>
      <div className="cy-dossier__tags">
        {section.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      {section.kind === "contact" && (
        <div className="cy-dossier__links">
          {[
            ["EMAIL", "opzblue@protonmail.com"],
            ["X / TWITTER", "@opzblue"],
            ["GITHUB", "github.com/opzblue"],
          ].map(([key, value]) => (
            <div key={key}>
              <span>{key}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      )}
      <div className="cy-dossier__status">◆ SIGNAL LOCK ACQUIRED · CHANNEL STABLE</div>
    </aside>
  );
}
