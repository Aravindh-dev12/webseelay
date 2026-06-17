import { useQuestEngine } from "./QuestEngine";
import { SECTIONS, SECTOR_NAMES, NPCS } from "./enhancedData";

export function Minimap({
  playerPos,
  activeId,
}: {
  playerPos?: { x: number; z: number };
  activeId: string | null;
}) {
  const { world, activeQuest } = useQuestEngine();
  const discovered = world.discoveredSectors;
  const scale = 0.35;
  const mapW = 220;
  const mapH = 220;
  const centerX = mapW / 2;
  const centerY = mapH / 2;
  const px = centerX + (playerPos?.x ?? 0) * scale;
  const py = centerY + (playerPos?.z ?? -55) * scale;

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 22,
        width: mapW,
        height: mapH,
        zIndex: 30,
        background: "linear-gradient(180deg, rgba(8,12,28,0.85), rgba(8,12,28,0.6))",
        border: "1px solid rgba(0,240,255,0.35)",
        borderRadius: 4,
        boxShadow: "0 0 24px rgba(0,240,255,0.15)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 6,
          fontSize: 9,
          letterSpacing: 2,
          color: "#00f0ff",
          opacity: 0.8,
        }}
      >
        SECTOR RADAR
      </div>
      <svg width={mapW} height={mapH} style={{ position: "absolute", inset: 0 }}>
        {/* Grid */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * (mapW / 8)}
            y1={0}
            x2={i * (mapW / 8)}
            y2={mapH}
            stroke="rgba(0,240,255,0.06)"
            strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * (mapH / 8)}
            x2={mapW}
            y2={i * (mapH / 8)}
            stroke="rgba(0,240,255,0.06)"
            strokeWidth={0.5}
          />
        ))}
        {/* Buildings */}
        {SECTIONS.map((s) => {
          const bx = centerX + s.position[0] * scale;
          const by = centerY + s.position[1] * scale;
          const isDiscovered = discovered.includes(s.sector);
          const isActive = activeId === s.id;
          const isQuestTarget = activeQuest?.objectives.some(
            (o) => !o.completed && o.targetId === s.id
          );
          if (!isDiscovered && s.sector !== 0) return null;
          return (
            <g key={s.id}>
              <rect
                x={bx - 3}
                y={by - 3}
                width={6}
                height={6}
                fill={isActive ? "#ffe600" : isQuestTarget ? "#00ff88" : "#ff1a3c"}
                opacity={isActive ? 1 : 0.6}
              />
              {isQuestTarget && (
                <circle cx={bx} cy={by} r={6} fill="none" stroke="#00ff88" strokeWidth={1}>
                  <animate attributeName="r" values="6;9;6" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
        {/* NPCs */}
        {NPCS.map((npc) => (
          <circle
            key={npc.id}
            cx={centerX + npc.position[0] * scale}
            cy={centerY + npc.position[2] * scale}
            r={3}
            fill={npc.color}
            opacity={0.8}
          />
        ))}
        {/* Player */}
        <circle cx={px} cy={py} r={5} fill="#00f0ff" opacity={0.9} />
        <circle cx={px} cy={py} r={8} fill="none" stroke="#00f0ff" strokeWidth={1} opacity={0.5}>
          <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      {/* Sector label */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          left: 6,
          fontSize: 9,
          letterSpacing: 1,
          color: "#ff1a3c",
        }}
      >
        {SECTOR_NAMES[world.discoveredSectors[world.discoveredSectors.length - 1] ?? 0]}
      </div>
    </div>
  );
}
