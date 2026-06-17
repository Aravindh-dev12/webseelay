export type Section = {
  id: string;
  kind: "about" | "project" | "skills" | "contact";
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  position: [number, number]; // [x, z]
  height: number;
  width: number;
  depth: number;
  accent: "red" | "magenta" | "cyan" | "yellow" | "green";
  videoUrl: string;
};

const REELS = {
  neonCity:   "https://assets.mixkit.co/videos/4787/4787-720.mp4",
  dataStream: "https://assets.mixkit.co/videos/4831/4831-720.mp4",
  abstractAI: "https://assets.mixkit.co/videos/39767/39767-720.mp4",
  hologram:   "https://assets.mixkit.co/videos/50760/50760-720.mp4",
  serverRoom: "https://assets.mixkit.co/videos/4828/4828-720.mp4",
  particles:  "https://assets.mixkit.co/videos/4787/4787-720.mp4",
};

// Buildings arranged along a Z-axis "street" — left/right sides, like Shibuya.
// Camera flies down the street so they whoosh by either side.
export const SECTIONS: Section[] = [
  {
    id: "about",
    kind: "about",
    title: "RESEARCH LAB",
    subtitle: "ABOUT // OPZBLUE",
    description:
      "AI engineer building autonomous agents, real-time inference, and generative systems. Neural infrastructure for the next decade.",
    tags: ["AI ENGINEER", "RESEARCH", "REAL-TIME"],
    position: [-12, -30],
    height: 26, width: 9, depth: 9,
    accent: "red",
    videoUrl: REELS.abstractAI,
  },
  {
    id: "proj-neurolink",
    kind: "project",
    title: "NEUROLINK//OS",
    subtitle: "DISTRIBUTED AGENT RUNTIME",
    description:
      "Production multi-agent orchestration. Sub-50ms tool routing across 12 LLM backends.",
    tags: ["LLM", "ORCHESTRATION", "EDGE"],
    position: [13, -10],
    height: 42, width: 11, depth: 11,
    accent: "magenta",
    videoUrl: REELS.neonCity,
  },
  {
    id: "proj-synthwave",
    kind: "project",
    title: "SYNTHWAVE.GEN",
    subtitle: "REALTIME DIFFUSION ENGINE",
    description:
      "WebGPU-accelerated diffusion. 1024px frames in 380ms on consumer GPUs.",
    tags: ["DIFFUSION", "WEBGPU", "SHADERS"],
    position: [-14, 10],
    height: 34, width: 10, depth: 10,
    accent: "yellow",
    videoUrl: REELS.hologram,
  },
  {
    id: "proj-oracle",
    kind: "project",
    title: "ORACLE.NET",
    subtitle: "PREDICTIVE MARKET MESH",
    description:
      "Streaming time-series transformer serving 4M predictions/min across a global edge mesh.",
    tags: ["TRANSFORMER", "STREAMING", "FINANCE"],
    position: [14, 28],
    height: 38, width: 10, depth: 10,
    accent: "cyan",
    videoUrl: REELS.dataStream,
  },
  {
    id: "proj-ghostnet",
    kind: "project",
    title: "GHOSTNET",
    subtitle: "ADVERSARIAL ROBUSTNESS",
    description:
      "Red-team toolkit fuzzing prompts and embeddings to map model failure manifolds.",
    tags: ["SECURITY", "ADVERSARIAL", "RESEARCH"],
    position: [-15, 46],
    height: 30, width: 9, depth: 9,
    accent: "red",
    videoUrl: REELS.serverRoom,
  },
  {
    id: "skills",
    kind: "skills",
    title: "COMMAND CENTER",
    subtitle: "STACK // CAPABILITIES",
    description:
      "PyTorch · JAX · CUDA · WebGPU · TypeScript · Rust · Triton · Ray · vLLM · K8s · Postgres · Redis",
    tags: ["DEEP LEARNING", "SYSTEMS", "REALTIME"],
    position: [16, 60],
    height: 22, width: 13, depth: 9,
    accent: "yellow",
    videoUrl: REELS.dataStream,
  },
  {
    id: "contact",
    kind: "contact",
    title: "COMM HUB",
    subtitle: "OPEN A CHANNEL",
    description:
      "Available for principal AI roles, research collaborations, and high-signal advisory work.",
    tags: ["EMAIL", "X / TWITTER", "GITHUB"],
    position: [-12, 78],
    height: 28, width: 10, depth: 10,
    accent: "magenta",
    videoUrl: REELS.particles,
  },
];

export const ACCENTS: Record<Section["accent"], string> = {
  red:     "#ff1a3c",
  magenta: "#ff00e5",
  cyan:    "#00f0ff",
  yellow:  "#ffe600",
  green:   "#00ff88",
};

// Brand red used in HUD + UI chrome.
export const BRAND_RED = "#ff1a3c";
