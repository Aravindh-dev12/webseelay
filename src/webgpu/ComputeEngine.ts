/// <reference types="@webgpu/types" />

/**
 * WebGPU Compute Engine
 * =====================
 * GPU-driven particle simulation with compute shaders.
 * Falls back to CPU if WebGPU is unavailable.
 */

export interface ParticleSystemConfig {
  count: number;
  bounds: [number, number, number]; // x, y, z half-extents
  gravity: number;
  wind: [number, number, number];
  turbulence: number;
}

export type ParticleType = "rain" | "ember" | "datastream" | "dust";

const DEFAULT_CONFIG: Record<ParticleType, ParticleSystemConfig> = {
  rain: {
    count: 50000,
    bounds: [60, 40, 120],
    gravity: -28,
    wind: [2, 0, 0],
    turbulence: 0.3,
  },
  ember: {
    count: 15000,
    bounds: [50, 30, 100],
    gravity: -0.8,
    wind: [0.5, 1.5, 0.3],
    turbulence: 1.2,
  },
  datastream: {
    count: 8000,
    bounds: [40, 50, 80],
    gravity: -2,
    wind: [0, -4, 0],
    turbulence: 0.5,
  },
  dust: {
    count: 20000,
    bounds: [80, 25, 140],
    gravity: -0.1,
    wind: [0.2, 0, 0.1],
    turbulence: 0.8,
  },
};

// WGSL compute shader for particle physics
const COMPUTE_WGSL = /* wgsl */ `
struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  life: f32,
  maxLife: f32,
  seed: f32,
  size: f32,
  padding: f32,
};

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> uTime: f32;
@group(0) @binding(2) var<uniform> uDelta: f32;
@group(0) @binding(3) var<uniform> uConfig: vec4<f32>; // gravity, turbulence, boundX, boundY
@group(0) @binding(4) var<uniform> uWind: vec3<f32>;

fn hash1(p: f32) -> f32 {
  return fract(sin(p * 127.1) * 43758.5453);
}

fn hash3(p: f32) -> vec3<f32> {
  return vec3<f32>(
    fract(sin(p * 127.1) * 43758.5453),
    fract(sin(p * 269.5) * 43758.5453),
    fract(sin(p * 311.7) * 43758.5453)
  );
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let idx = id.x;
  let count = arrayLength(&particles);
  if (idx >= count) { return; }

  var p = particles[idx];
  let dt = uDelta;
  let gravity = uConfig.x;
  let turbulence = uConfig.y;
  let boundX = uConfig.z;
  let boundY = uConfig.w;

  p.life -= dt;

  if (p.life <= 0.0) {
    // Respawn
    let h = hash3(p.seed + uTime * 0.1);
    p.position = vec3<f32>(
      (h.x - 0.5) * boundX * 2.0,
      boundY + hash1(p.seed + 1.0) * 5.0,
      (h.z - 0.5) * boundX * 2.0
    );
    p.velocity = uWind + hash3(p.seed + 2.0) * turbulence;
    p.life = p.maxLife;
  } else {
    // Turbulent noise
    let noise = hash3(p.seed + uTime * 3.0 + p.position.y) - 0.5;
    p.velocity += vec3<f32>(noise.x * turbulence, gravity, noise.z * turbulence) * dt;
    p.position += p.velocity * dt;
  }

  particles[idx] = p;
}
`;

// Vertex shader for rendering particles as points
const VERTEX_WGSL = /* wgsl */ `
struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  life: f32,
  maxLife: f32,
  seed: f32,
  size: f32,
  padding: f32,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) lifeRatio: f32,
  @location(1) seed: f32,
  @location(2) size: f32,
};

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<uniform> uMVP: mat4x4<f32>;

@vertex
fn main(@builtin(vertex_index) vIdx: u32) -> VertexOutput {
  let p = particles[vIdx];
  var out: VertexOutput;
  out.position = uMVP * vec4<f32>(p.position, 1.0);
  out.lifeRatio = p.life / p.maxLife;
  out.seed = p.seed;
  out.size = p.size;
  return out;
}
`;

// Fragment shader
const FRAGMENT_WGSL = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) lifeRatio: f32,
  @location(1) seed: f32,
  @location(2) size: f32,
};

@fragment
fn main(in: VertexOutput) -> @location(0) vec4<f32> {
  let typeColor = fract(in.seed * 3.7);
  var col: vec3<f32>;
  if (typeColor < 0.33) {
    col = vec3<f32>(0.0, 0.94, 1.0); // cyan
  } else if (typeColor < 0.66) {
    col = vec3<f32>(1.0, 0.0, 0.9); // magenta
  } else {
    col = vec3<f32>(1.0, 0.1, 0.23); // red
  }
  let alpha = in.lifeRatio * 0.8;
  return vec4<f32>(col * alpha, alpha);
}
`;

interface ParticleData {
  positions: Float32Array;
  velocities: Float32Array;
  lives: Float32Array;
  maxLives: Float32Array;
  seeds: Float32Array;
  sizes: Float32Array;
}

export class ComputeEngine {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private pipeline: GPUComputePipeline | null = null;
  private renderPipeline: GPURenderPipeline | null = null;
  private bindGroup: GPUBindGroup | null = null;
  private renderBindGroup: GPUBindGroup | null = null;
  private particleBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private mvpBuffer: GPUBuffer | null = null;
  private config: ParticleSystemConfig;
  private type: ParticleType;
  private canvas: HTMLCanvasElement;
  private animFrame = 0;
  private startTime = 0;
  private running = false;
  private fallbackParticles: ParticleData | null = null;
  private useFallback = false;

  constructor(type: ParticleType, canvas: HTMLCanvasElement) {
    this.type = type;
    this.canvas = canvas;
    this.config = DEFAULT_CONFIG[type];
    this.startTime = performance.now();
  }

  async init(): Promise<boolean> {
    if (!navigator.gpu) {
      console.warn("WebGPU not available, using CPU fallback for particles");
      this.useFallback = true;
      this.initFallback();
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: "high-performance",
      });
      if (!adapter) throw new Error("No GPU adapter");

      this.device = await adapter.requestDevice();
      this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;
      if (!this.context) throw new Error("No WebGPU context");

      const format = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format,
        alphaMode: "premultiplied",
      });

      await this.createBuffers();
      await this.createPipelines(format);
      this.running = true;
      this.loop();
      return true;
    } catch (e) {
      console.warn("WebGPU init failed:", e);
      this.useFallback = true;
      this.initFallback();
      return false;
    }
  }

  private initFallback() {
    const c = this.config;
    const count = c.count;
    this.fallbackParticles = {
      positions: new Float32Array(count * 3),
      velocities: new Float32Array(count * 3),
      lives: new Float32Array(count),
      maxLives: new Float32Array(count),
      seeds: new Float32Array(count),
      sizes: new Float32Array(count),
    };
    const rng = (s: number) => {
      const x = Math.sin(s * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < count; i++) {
      const seed = Math.random() * 10000;
      this.fallbackParticles.positions[i * 3] = (rng(seed) - 0.5) * c.bounds[0] * 2;
      this.fallbackParticles.positions[i * 3 + 1] = rng(seed + 1) * c.bounds[1];
      this.fallbackParticles.positions[i * 3 + 2] = (rng(seed + 2) - 0.5) * c.bounds[2] * 2;
      this.fallbackParticles.velocities[i * 3] = c.wind[0] + (rng(seed + 3) - 0.5) * c.turbulence;
      this.fallbackParticles.velocities[i * 3 + 1] = c.wind[1] + (rng(seed + 4) - 0.5) * c.turbulence;
      this.fallbackParticles.velocities[i * 3 + 2] = c.wind[2] + (rng(seed + 5) - 0.5) * c.turbulence;
      this.fallbackParticles.lives[i] = rng(seed + 6) * 8 + 2;
      this.fallbackParticles.maxLives[i] = this.fallbackParticles.lives[i];
      this.fallbackParticles.seeds[i] = seed;
      this.fallbackParticles.sizes[i] = 1.0 + rng(seed + 7) * 2.0;
    }
  }

  private async createBuffers() {
    if (!this.device) return;
    const count = this.config.count;
    const stride = 32; // 8 floats per particle
    this.particleBuffer = this.device.createBuffer({
      size: count * stride,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
    });

    // Initialize particle data
    const initData = new Float32Array(count * 8);
    const rng = (s: number) => {
      const x = Math.sin(s * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < count; i++) {
      const seed = Math.random() * 10000;
      initData[i * 8 + 0] = (rng(seed) - 0.5) * this.config.bounds[0] * 2;
      initData[i * 8 + 1] = rng(seed + 1) * this.config.bounds[1];
      initData[i * 8 + 2] = (rng(seed + 2) - 0.5) * this.config.bounds[2] * 2;
      initData[i * 8 + 3] = this.config.wind[0] + (rng(seed + 3) - 0.5) * this.config.turbulence;
      initData[i * 8 + 4] = this.config.wind[1] + (rng(seed + 4) - 0.5) * this.config.turbulence;
      initData[i * 8 + 5] = this.config.wind[2] + (rng(seed + 5) - 0.5) * this.config.turbulence;
      initData[i * 8 + 6] = rng(seed + 6) * 8 + 2; // life
      initData[i * 8 + 7] = initData[i * 8 + 6]; // maxLife
    }
    this.device.queue.writeBuffer(this.particleBuffer, 0, initData);

    this.uniformBuffer = this.device.createBuffer({
      size: 16 + 12, // vec4 + vec3 padded to vec4
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.mvpBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private async createPipelines(format: GPUTextureFormat) {
    if (!this.device || !this.particleBuffer || !this.uniformBuffer || !this.mvpBuffer) return;

    const computeModule = this.device.createShaderModule({ code: COMPUTE_WGSL });
    this.pipeline = this.device.createComputePipeline({
      layout: "auto",
      compute: { module: computeModule, entryPoint: "main" },
    });

    const vertexModule = this.device.createShaderModule({ code: VERTEX_WGSL });
    const fragmentModule = this.device.createShaderModule({ code: FRAGMENT_WGSL });

    this.renderPipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: vertexModule,
        entryPoint: "main",
        buffers: [],
      },
      fragment: {
        module: fragmentModule,
        entryPoint: "main",
        targets: [{ format }],
      },
      primitive: { topology: "point-list" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: false,
        depthCompare: "less",
      },
    });

    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.uniformBuffer } },
        { binding: 2, resource: { buffer: this.uniformBuffer } },
        { binding: 3, resource: { buffer: this.uniformBuffer } },
        { binding: 4, resource: { buffer: this.uniformBuffer } },
      ],
    });

    this.renderBindGroup = this.device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.mvpBuffer } },
      ],
    });
  }

  private loop = () => {
    if (!this.running) return;
    this.animFrame = requestAnimationFrame(this.loop);
    this.render();
  };

  private render() {
    if (!this.device || !this.context || !this.pipeline || !this.renderPipeline) return;

    const now = performance.now();
    const t = (now - this.startTime) / 1000;
    const dt = 0.016;

    // Update uniforms
    const config = new Float32Array([
      this.config.gravity,
      this.config.turbulence,
      this.config.bounds[0],
      this.config.bounds[1],
    ]);
    const wind = new Float32Array([
      this.config.wind[0],
      this.config.wind[1],
      this.config.wind[2],
      0,
    ]);
    const timeData = new Float32Array([t, dt, 0, 0]);

    this.device.queue.writeBuffer(this.uniformBuffer!, 0, timeData);
    this.device.queue.writeBuffer(this.uniformBuffer!, 16, config);
    this.device.queue.writeBuffer(this.uniformBuffer!, 32, wind);

    // Simple orthographic MVP for overlay
    const mvp = new Float32Array(16);
    // Identity-ish for now - in real use this would match camera
    mvp[0] = 1; mvp[5] = 1; mvp[10] = 1; mvp[15] = 1;
    this.device.queue.writeBuffer(this.mvpBuffer!, 0, mvp);

    const commandEncoder = this.device.createCommandEncoder();

    // Compute pass
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.pipeline);
    computePass.setBindGroup(0, this.bindGroup);
    computePass.dispatchWorkgroups(Math.ceil(this.config.count / 256));
    computePass.end();

    // Render pass
    const textureView = this.context.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    renderPass.setPipeline(this.renderPipeline);
    renderPass.setBindGroup(0, this.renderBindGroup);
    renderPass.draw(this.config.count);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  // CPU fallback tick
  tickFallback(dt: number, _cameraPos: [number, number, number]) {
    if (!this.useFallback || !this.fallbackParticles) return;
    const fp = this.fallbackParticles;
    const c = this.config;
    const rng = (s: number) => {
      const x = Math.sin(s * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < c.count; i++) {
      fp.lives[i] -= dt;
      if (fp.lives[i] <= 0) {
        const seed = fp.seeds[i];
        fp.positions[i * 3] = (rng(seed) - 0.5) * c.bounds[0] * 2;
        fp.positions[i * 3 + 1] = c.bounds[1] + rng(seed + 1) * 5;
        fp.positions[i * 3 + 2] = (rng(seed + 2) - 0.5) * c.bounds[2] * 2;
        fp.velocities[i * 3] = c.wind[0] + (rng(seed + 3) - 0.5) * c.turbulence;
        fp.velocities[i * 3 + 1] = c.wind[1] + (rng(seed + 4) - 0.5) * c.turbulence;
        fp.velocities[i * 3 + 2] = c.wind[2] + (rng(seed + 5) - 0.5) * c.turbulence;
        fp.lives[i] = fp.maxLives[i];
      } else {
        const noiseX = (rng(fp.seeds[i] + performance.now() * 0.003 + fp.positions[i * 3 + 1]) - 0.5) * c.turbulence;
        const noiseZ = (rng(fp.seeds[i] + performance.now() * 0.003 + 1000) - 0.5) * c.turbulence;
        fp.velocities[i * 3] += noiseX * dt;
        fp.velocities[i * 3 + 1] += c.gravity * dt;
        fp.velocities[i * 3 + 2] += noiseZ * dt;
        fp.positions[i * 3] += fp.velocities[i * 3] * dt;
        fp.positions[i * 3 + 1] += fp.velocities[i * 3 + 1] * dt;
        fp.positions[i * 3 + 2] += fp.velocities[i * 3 + 2] * dt;
      }
    }
  }

  getFallbackPositions(): Float32Array | null {
    return this.useFallback ? this.fallbackParticles?.positions ?? null : null;
  }

  getFallbackColors(): Float32Array | null {
    if (!this.useFallback || !this.fallbackParticles) return null;
    const colors = new Float32Array(this.config.count * 3);
    for (let i = 0; i < this.config.count; i++) {
      const t = this.fallbackParticles.seeds[i] * 3.7;
      const ft = t - Math.floor(t);
      if (ft < 0.33) {
        colors[i * 3] = 0.0; colors[i * 3 + 1] = 0.94; colors[i * 3 + 2] = 1.0;
      } else if (ft < 0.66) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.0; colors[i * 3 + 2] = 0.9;
      } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.1; colors[i * 3 + 2] = 0.23;
      }
    }
    return colors;
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
    this.device?.destroy();
    this.device = null;
  }
}
