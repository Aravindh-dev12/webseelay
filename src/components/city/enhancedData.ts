/**
 * Enhanced World Data
 * ===================
 * Expanded city with sectors, NPCs, quests, and world state.
 */

export type Section = {
  id: string;
  kind: "about" | "project" | "skills" | "contact" | "landmark" | "shop" | "terminal";
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  position: [number, number];
  height: number;
  width: number;
  depth: number;
  accent: "red" | "magenta" | "cyan" | "yellow" | "green" | "blue" | "orange";
  videoUrl: string;
  sector: number;
  faction?: string;
};

export type NPC = {
  id: string;
  name: string;
  role: string;
  faction: string;
  position: [number, number, number];
  color: string;
  dialogue: string[];
  questId?: string;
  patrolRoute?: [number, number, number][];
  speed: number;
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  reward: string;
  giverId: string;
  completed: boolean;
  active: boolean;
};

export type QuestObjective = {
  id: string;
  text: string;
  targetType: "visit" | "interact" | "collect";
  targetId: string;
  completed: boolean;
};

export type WeatherState = {
  type: "clear" | "rain" | "fog" | "storm" | "emberfall";
  intensity: number;
  windSpeed: [number, number, number];
  timeOfDay: number;
};

export type WorldState = {
  weather: WeatherState;
  playerLevel: number;
  reputation: Record<string, number>;
  completedQuests: string[];
  discoveredSectors: number[];
  visitedBuildings: string[];
  collectedItems: string[];
  activeQuestId: string | null;
  day: number;
  time: string;
};

const REELS = {
  neonCity:   "https://assets.mixkit.co/videos/4787/4787-720.mp4",
  dataStream: "https://assets.mixkit.co/videos/4831/4831-720.mp4",
  abstractAI: "https://assets.mixkit.co/videos/39767/39767-720.mp4",
  hologram:   "https://assets.mixkit.co/videos/50760/50760-720.mp4",
  serverRoom: "https://assets.mixkit.co/videos/4828/4828-720.mp4",
  particles:  "https://assets.mixkit.co/videos/4787/4787-720.mp4",
  matrix:     "https://assets.mixkit.co/videos/4831/4831-720.mp4",
  cyberpunk:  "https://assets.mixkit.co/videos/50760/50760-720.mp4",
};

export const ACCENTS: Record<string, string> = {
  red:     "#ff1a3c",
  magenta: "#ff00e5",
  cyan:    "#00f0ff",
  yellow:  "#ffe600",
  green:   "#00ff88",
  blue:    "#3366ff",
  orange:  "#ff6600",
};

export const BRAND_RED = "#ff1a3c";

export const SECTOR_NAMES: Record<number, string> = {
  0: "NEURAL CORE",
  1: "PROJECT DISTRICT",
  2: "INDUSTRIAL ZONE",
  3: "COMMERCIAL ROW",
  4: "VOID DISTRICT",
  5: "SKYLINE HUB",
  6: "UNDERGROUND",
  7: "OUTER RIM",
};

export const FACTIONS: Record<string, { color: string; reputation: number }> = {
  "Neural Syndicate": { color: "#ff1a3c", reputation: 0 },
  "Agent Collective": { color: "#ff00e5", reputation: 0 },
  "Render Guild":     { color: "#ffe600", reputation: 0 },
  "Data Cartel":      { color: "#00f0ff", reputation: 0 },
  "Void Walkers":     { color: "#ff6600", reputation: 0 },
  "Quantum Front":    { color: "#3366ff", reputation: 0 },
  "Sensory Net":      { color: "#00ff88", reputation: 0 },
};

export const SECTIONS: Section[] = [
  {
    id: "about", kind: "about", title: "NEURAL CORE",
    subtitle: "ABOUT // OPZBLUE",
    description: "AI engineer building autonomous agents, real-time inference, and generative systems. Neural infrastructure for the next decade.",
    tags: ["AI ENGINEER", "RESEARCH", "REAL-TIME"],
    position: [-12, -30], height: 26, width: 9, depth: 9,
    accent: "red", videoUrl: REELS.abstractAI, sector: 0, faction: "Neural Syndicate",
  },
  {
    id: "core-terminal", kind: "terminal", title: "ROOT ACCESS",
    subtitle: "SYSTEM TERMINAL 01",
    description: "Direct access to the city's core systems. Override protocols available.",
    tags: ["ADMIN", "SYSTEM", "CORE"],
    position: [8, -25], height: 18, width: 7, depth: 7,
    accent: "cyan", videoUrl: REELS.serverRoom, sector: 0, faction: "Neural Syndicate",
  },
  {
    id: "proj-neurolink", kind: "project", title: "NEUROLINK//OS",
    subtitle: "DISTRIBUTED AGENT RUNTIME",
    description: "Production multi-agent orchestration. Sub-50ms tool routing across 12 LLM backends.",
    tags: ["LLM", "ORCHESTRATION", "EDGE"],
    position: [13, -10], height: 42, width: 11, depth: 11,
    accent: "magenta", videoUrl: REELS.neonCity, sector: 1, faction: "Agent Collective",
  },
  {
    id: "proj-synthwave", kind: "project", title: "SYNTHWAVE.GEN",
    subtitle: "REALTIME DIFFUSION ENGINE",
    description: "WebGPU-accelerated diffusion. 1024px frames in 380ms on consumer GPUs.",
    tags: ["DIFFUSION", "WEBGPU", "SHADERS"],
    position: [-14, 10], height: 34, width: 10, depth: 10,
    accent: "yellow", videoUrl: REELS.hologram, sector: 1, faction: "Render Guild",
  },
  {
    id: "proj-oracle", kind: "project", title: "ORACLE.NET",
    subtitle: "PREDICTIVE MARKET MESH",
    description: "Streaming time-series transformer serving 4M predictions/min.",
    tags: ["TRANSFORMER", "STREAMING", "FINANCE"],
    position: [14, 28], height: 38, width: 10, depth: 10,
    accent: "cyan", videoUrl: REELS.dataStream, sector: 1, faction: "Data Cartel",
  },
  {
    id: "proj-ghostnet", kind: "project", title: "GHOSTNET",
    subtitle: "ADVERSARIAL ROBUSTNESS",
    description: "Red-team toolkit fuzzing prompts and embeddings. 847 vulnerabilities discovered.",
    tags: ["SECURITY", "ADVERSARIAL", "RESEARCH"],
    position: [-15, 46], height: 30, width: 9, depth: 9,
    accent: "red", videoUrl: REELS.serverRoom, sector: 1, faction: "Void Walkers",
  },
  {
    id: "proj-quantum", kind: "project", title: "QUANTUM.SEED",
    subtitle: "HYBRID CLASSICAL-QUANTUM",
    description: "Variational quantum circuits for molecular simulation. 40-qubit simulations.",
    tags: ["QUANTUM", "SIMULATION", "CHEMISTRY"],
    position: [18, 5], height: 36, width: 10, depth: 10,
    accent: "blue", videoUrl: REELS.cyberpunk, sector: 1, faction: "Quantum Front",
  },
  {
    id: "proj-omni", kind: "project", title: "OMNI.SENSE",
    subtitle: "MULTI-MODAL PERCEPTION",
    description: "Unified vision-language-audio model. Real-time scene understanding. 94.7% accuracy.",
    tags: ["MULTIMODAL", "VISION", "AUDIO"],
    position: [-20, -5], height: 32, width: 9, depth: 9,
    accent: "green", videoUrl: REELS.matrix, sector: 1, faction: "Sensory Net",
  },
  {
    id: "skills", kind: "skills", title: "COMMAND CENTER",
    subtitle: "STACK // CAPABILITIES",
    description: "PyTorch JAX CUDA WebGPU TypeScript Rust Triton Ray vLLM K8s Postgres Redis Kafka WASM",
    tags: ["DEEP LEARNING", "SYSTEMS", "REALTIME"],
    position: [16, 60], height: 22, width: 13, depth: 9,
    accent: "yellow", videoUrl: REELS.dataStream, sector: 2, faction: "Neural Syndicate",
  },
  {
    id: "skills-lab", kind: "landmark", title: "RESEARCH LAB 7B",
    subtitle: "EXPERIMENTAL SYSTEMS",
    description: "Cutting-edge research facility. Unauthorized access triggers neural dampening field.",
    tags: ["RESEARCH", "EXPERIMENTAL", "RESTRICTED"],
    position: [-10, 65], height: 28, width: 11, depth: 11,
    accent: "orange", videoUrl: REELS.particles, sector: 2, faction: "Neural Syndicate",
  },
  {
    id: "contact", kind: "contact", title: "COMM HUB",
    subtitle: "OPEN A CHANNEL",
    description: "Available for principal AI roles, research collaborations, and advisory work. Encryption: AES-4096.",
    tags: ["EMAIL", "X / TWITTER", "GITHUB"],
    position: [-12, 78], height: 28, width: 10, depth: 10,
    accent: "magenta", videoUrl: REELS.particles, sector: 3,
  },
  {
    id: "market-holo", kind: "shop", title: "HOLO-MARKET",
    subtitle: "DIGITAL GOODS EXCHANGE",
    description: "Trade neural weights, shader packs, and model checkpoints. No refunds on corrupted data.",
    tags: ["TRADE", "DIGITAL", "MARKET"],
    position: [10, 85], height: 20, width: 8, depth: 8,
    accent: "green", videoUrl: REELS.hologram, sector: 3, faction: "Data Cartel",
  },
  {
    id: "void-gate", kind: "landmark", title: "VOID GATE",
    subtitle: "SECTOR 4 ENTRANCE",
    description: "The boundary between known city and the void district. Proceed at your own risk.",
    tags: ["DANGER", "VOID", "RESTRICTED"],
    position: [-20, 95], height: 45, width: 14, depth: 14,
    accent: "orange", videoUrl: REELS.serverRoom, sector: 4, faction: "Void Walkers",
  },
  {
    id: "sky-tower", kind: "landmark", title: "SKYLINE OBSERVATORY",
    subtitle: "SECTOR 5 OVERWATCH",
    description: "Highest point in the metropolis. Surveillance arrays track all sectors simultaneously.",
    tags: ["SURVEILLANCE", "OVERWATCH", "ELITE"],
    position: [22, 105], height: 52, width: 12, depth: 12,
    accent: "cyan", videoUrl: REELS.cyberpunk, sector: 5, faction: "Neural Syndicate",
  },
  {
    id: "deep-net", kind: "terminal", title: "DEEP NET ACCESS",
    subtitle: "UNDERGROUND TERMINAL",
    description: "Connection to the city's subterranean data networks. Temperature: -40C. Humidity: 99%.",
    tags: ["DEEP NET", "UNDERGROUND", "COLD"],
    position: [-8, 115], height: 16, width: 7, depth: 7,
    accent: "blue", videoUrl: REELS.matrix, sector: 6, faction: "Data Cartel",
  },
  {
    id: "outer-ring", kind: "landmark", title: "OUTER RING",
    subtitle: "CITY PERIMETER",
    description: "The edge of the metropolis. Beyond lies the uncharted digital wasteland.",
    tags: ["PERIMETER", "WASTELAND", "UNKNOWN"],
    position: [14, 125], height: 24, width: 9, depth: 9,
    accent: "yellow", videoUrl: REELS.neonCity, sector: 7,
  },
];

export const NPCS: NPC[] = [
  {
    id: "npc-ghost", name: "GHOST", role: "Infiltrator", faction: "Void Walkers",
    position: [-18, 1.5, 95], color: "#ff6600",
    dialogue: [
      "You shouldn't be here, visitor.",
      "The Void District holds... anomalies.",
      "I've mapped 847 backdoors in the city grid. Want to see one?",
      "Complete my test and I'll show you a secret path.",
    ],
    questId: "quest-ghost",
    patrolRoute: [[-18, 1.5, 95], [-15, 1.5, 98], [-20, 1.5, 100], [-18, 1.5, 95]],
    speed: 1.2,
  },
  {
    id: "npc-aria", name: "ARIA-7", role: "SysAdmin", faction: "Neural Syndicate",
    position: [-10, 1.5, -30], color: "#ff1a3c",
    dialogue: [
      "Welcome to the Neural Core, operative.",
      "System integrity at 97.3%. Minor fluctuations in Sector 4.",
      "I need someone to verify the data streams in the Project District.",
      "Return with confirmation and I'll upgrade your access level.",
    ],
    questId: "quest-aria",
    patrolRoute: [[-10, 1.5, -30], [-8, 1.5, -28], [-12, 1.5, -32], [-10, 1.5, -30]],
    speed: 0.8,
  },
  {
    id: "npc-glitch", name: "GL1TCH", role: "Data Broker", faction: "Data Cartel",
    position: [12, 1.5, 85], color: "#00f0ff",
    dialogue: [
      "Information is currency. What do you bring?",
      "The Holo-Market has everything. Even things that shouldn't exist.",
      "I've got a lead on a lost cache in the Deep Net. Interested?",
      "Find it and we split the profits. 60/40. My way.",
    ],
    questId: "quest-glitch",
    patrolRoute: [[12, 1.5, 85], [15, 1.5, 87], [10, 1.5, 88], [12, 1.5, 85]],
    speed: 1.0,
  },
  {
    id: "npc-renderer", name: "PIXEL", role: "Shader Artist", faction: "Render Guild",
    position: [-14, 1.5, 12], color: "#ffe600",
    dialogue: [
      "Beautiful, isn't it? Every building is a shader masterpiece.",
      "I'm working on a new volumetric effect. Needs testing.",
      "Walk through all 8 sectors and tell me which has the best lighting.",
      "Your feedback will earn you a custom shader badge.",
    ],
    questId: "quest-pixel",
    patrolRoute: [[-14, 1.5, 12], [-16, 1.5, 15], [-12, 1.5, 14], [-14, 1.5, 12]],
    speed: 0.6,
  },
  {
    id: "npc-quantum", name: "Q-BIT", role: "Quantum Theorist", faction: "Quantum Front",
    position: [16, 1.5, 8], color: "#3366ff",
    dialogue: [
      "Classical logic cannot comprehend what we build.",
      "Superposition isn't just physics. It's a way of life.",
      "I've detected quantum interference in the Outer Rim.",
      "Investigate it. The readings are... impossible.",
    ],
    questId: "quest-quantum",
    patrolRoute: [[16, 1.5, 8], [18, 1.5, 10], [15, 1.5, 6], [16, 1.5, 8]],
    speed: 0.9,
  },
  {
    id: "npc-sensor", name: "ECHO", role: "Perception Analyst", faction: "Sensory Net",
    position: [-18, 1.5, -3], color: "#00ff88",
    dialogue: [
      "The city speaks if you listen. Every signal, every pulse.",
      "I've mapped 12,847 unique audio signatures in Sector 1 alone.",
      "Something new is echoing from the Skyline Observatory.",
      "Go there. Record what you hear. Bring it back to me.",
    ],
    questId: "quest-echo",
    patrolRoute: [[-18, 1.5, -3], [-20, 1.5, -1], [-16, 1.5, -5], [-18, 1.5, -3]],
    speed: 1.1,
  },
];

export const QUESTS: Quest[] = [
  {
    id: "quest-ghost", title: "VOID WALKER'S TRIAL",
    description: "GHOST wants to test your skills. Visit the Void Gate and return.",
    giverId: "npc-ghost",
    completed: false, active: false,
    reward: "Void Access Badge + 50 Rep",
    objectives: [
      { id: "obj-ghost-1", text: "Reach the Void Gate (Sector 4)", targetType: "visit", targetId: "void-gate", completed: false },
      { id: "obj-ghost-2", text: "Interact with the terminal", targetType: "interact", targetId: "void-gate", completed: false },
      { id: "obj-ghost-3", text: "Return to GHOST", targetType: "interact", targetId: "npc-ghost", completed: false },
    ],
  },
  {
    id: "quest-aria", title: "SYSTEM INTEGRITY CHECK",
    description: "ARIA-7 needs you to verify data streams across the Project District.",
    giverId: "npc-aria",
    completed: false, active: false,
    reward: "Level 2 Access + Neural Badge",
    objectives: [
      { id: "obj-aria-1", text: "Visit NEUROLINK//OS", targetType: "visit", targetId: "proj-neurolink", completed: false },
      { id: "obj-aria-2", text: "Visit SYNTHWAVE.GEN", targetType: "visit", targetId: "proj-synthwave", completed: false },
      { id: "obj-aria-3", text: "Visit ORACLE.NET", targetType: "visit", targetId: "proj-oracle", completed: false },
      { id: "obj-aria-4", text: "Report back to ARIA-7", targetType: "interact", targetId: "npc-aria", completed: false },
    ],
  },
  {
    id: "quest-glitch", title: "DEEP NET CACHE",
    description: "GL1TCH has intel on a lost data cache in the underground.",
    giverId: "npc-glitch",
    completed: false, active: false,
    reward: "Encrypted Data Shard + 100 Credits",
    objectives: [
      { id: "obj-glitch-1", text: "Find Deep Net Access terminal", targetType: "visit", targetId: "deep-net", completed: false },
      { id: "obj-glitch-2", text: "Extract the cache", targetType: "interact", targetId: "deep-net", completed: false },
      { id: "obj-glitch-3", text: "Return to GL1TCH", targetType: "interact", targetId: "npc-glitch", completed: false },
    ],
  },
  {
    id: "quest-pixel", title: "LIGHT AUDIT",
    description: "PIXEL wants you to survey all 8 sectors and rate the lighting.",
    giverId: "npc-renderer",
    completed: false, active: false,
    reward: "Custom Shader Profile",
    objectives: [
      { id: "obj-pixel-1", text: "Visit all 8 sectors", targetType: "visit", targetId: "all-sectors", completed: false },
      { id: "obj-pixel-2", text: "Return findings to PIXEL", targetType: "interact", targetId: "npc-renderer", completed: false },
    ],
  },
  {
    id: "quest-quantum", title: "IMPOSSIBLE READINGS",
    description: "Q-BIT detected quantum interference at the Outer Rim.",
    giverId: "npc-quantum",
    completed: false, active: false,
    reward: "Quantum Resonator",
    objectives: [
      { id: "obj-quantum-1", text: "Reach the Outer Ring", targetType: "visit", targetId: "outer-ring", completed: false },
      { id: "obj-quantum-2", text: "Scan for anomalies", targetType: "interact", targetId: "outer-ring", completed: false },
      { id: "obj-quantum-3", text: "Report to Q-BIT", targetType: "interact", targetId: "npc-quantum", completed: false },
    ],
  },
  {
    id: "quest-echo", title: "THE SKYLINE SIGNAL",
    description: "ECHO detected a unique audio signature from the Skyline Observatory.",
    giverId: "npc-sensor",
    completed: false, active: false,
    reward: "Sensory Enhancement Module",
    objectives: [
      { id: "obj-echo-1", text: "Climb to Skyline Observatory", targetType: "visit", targetId: "sky-tower", completed: false },
      { id: "obj-echo-2", text: "Record the signal", targetType: "interact", targetId: "sky-tower", completed: false },
      { id: "obj-echo-3", text: "Deliver recording to ECHO", targetType: "interact", targetId: "npc-sensor", completed: false },
    ],
  },
];

export function createDefaultWorldState(): WorldState {
  return {
    weather: {
      type: "clear",
      intensity: 0.3,
      windSpeed: [0.5, 0, 0.2],
      timeOfDay: 20,
    },
    playerLevel: 1,
    reputation: Object.fromEntries(Object.keys(FACTIONS).map((f) => [f, 0])),
    completedQuests: [],
    discoveredSectors: [0],
    visitedBuildings: [],
    collectedItems: [],
    activeQuestId: null,
    day: 1,
    time: "20:00",
  };
}


