"use client";

import * as React from "react";
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ── Simulation Constants ───────────────────────────────────────────────
const MAX_PARTICLES = 7000;
const TRAIL_LENGTH = 19;
const DT = 1 / 60;
const MAX_PUFFS = 32;
const TWO_PI = Math.PI * 2;
const NUM_SUBTRAILS = 6;
const SUBTRAIL_STEP = 3;

// Default Palettes
const DEFAULT_CALM = [34, 230, 255]; // #22e6ff
const DEFAULT_MID = [138, 92, 255]; // #8a5cff
const DEFAULT_HOT = [255, 61, 154]; // #ff3d9a
const DEFAULT_CORE = [234, 252, 255]; // #eafcff

const ALPHA_WEIGHTS = [0.2, 0.32, 0.48];
const LINE_WIDTH_FACTORS = [0.7, 0.9, 1.2];
const ALPHA_BOOST = 1.3;
const CORE_LINE_WIDTH = 1.4;

// Physical decay rates
const VELOCITY_DRAG = 1 - Math.exp(-DT / 0.12);
const SPEED_RATIO_LERP = 1 - Math.exp(-DT * 8);
const OBSTACLE_POS_LERP = 1 - Math.exp(-DT * 18);
const OBSTACLE_VEL_LERP = 1 - Math.exp(-DT * 10);
const OBSTACLE_ACTIVE_RISE = 1 - Math.exp(-DT / 0.06);
const OBSTACLE_ACTIVE_FALL = 1 - Math.exp(-DT / 0.2);
const FLASH_PROBABILITY_PER_FRAME = 0.03 * DT;
const FLASH_DECAY = Math.exp(-DT / 0.45);
const PUFF_VORTEX_DECAY = Math.exp(-DT / 1.1);

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 1831565813) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseColor(colorStr?: string, defaultRgb: number[] = [255, 255, 255]): number[] {
  if (!colorStr) return defaultRgb;
  const trimmed = colorStr.trim();
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }
  let clean = trimmed.replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return defaultRgb;
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

interface WaveConfig {
  kx: number;
  ky: number;
  om: number;
  ph: number;
  au: number;
  av: number;
}

function makeWave(
  wavelength: number,
  angle: number,
  angularFreq: number,
  phase: number,
  amplitude: number
): WaveConfig {
  const k = TWO_PI / wavelength;
  return {
    kx: k * Math.cos(angle),
    ky: k * Math.sin(angle),
    om: angularFreq,
    ph: phase,
    au: amplitude * Math.sin(angle),
    av: -amplitude * Math.cos(angle),
  };
}

const WAVE_1 = makeWave(380, 0.35, 0.18, 0.7, 16);
const WAVE_2 = makeWave(620, 1.9, 0.27, 2.1, 13);
const WAVE_3 = makeWave(900, 3.4, 0.35, 4.2, 10);

// ── Component Props ────────────────────────────────────────────────────
export interface DataRainProps {
  fullscreen?: boolean;
  count?: number;
  flowSpeed?: number;
  obstacleRadius?: number;
  autopilot?: boolean;
  themePreset?: "cyberpunk" | "matrix" | "solar" | "arctic" | "custom";
  calmColor?: string;
  midColor?: string;
  hotColor?: string;
  coreColor?: string;
  bgDark?: string;
  bgMid?: string;
  bgHighlight?: string;
  vignetteOpacity?: number;
  grainOpacity?: number;
  bloomBlur?: number;
  bloomOpacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function DataRain({
  fullscreen = false,
  count,
  flowSpeed = 1,
  obstacleRadius = 64,
  autopilot = true,
  themePreset = "cyberpunk",
  calmColor = "#22e6ff",
  midColor = "#8a5cff",
  hotColor = "#ff3d9a",
  coreColor = "#eafcff",
  bgDark = "#020308",
  bgMid = "#05070d",
  bgHighlight = "#0a1020",
  vignetteOpacity = 0.62,
  grainOpacity = 0.05,
  bloomBlur = 10,
  bloomOpacity = 0.7,
  className = "",
  style,
}: DataRainProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mainCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const bloomCanvasRef = React.useRef<HTMLCanvasElement>(null);

  // Compute active colors based on theme preset
  const resolvedColors = React.useMemo(() => {
    const key = (themePreset || "cyberpunk").toLowerCase();
    switch (key) {
      case "matrix":
        return {
          calm: "#00ff66",
          mid: "#00cc44",
          hot: "#33ff88",
          core: "#e6ffee",
          bgDark: "#010803",
          bgMid: "#021207",
          bgHighlight: "#052210",
        };
      case "solar":
        return {
          calm: "#ffb703",
          mid: "#fb8500",
          hot: "#ff006e",
          core: "#fff8e7",
          bgDark: "#080302",
          bgMid: "#120604",
          bgHighlight: "#220e06",
        };
      case "arctic":
        return {
          calm: "#70d6ff",
          mid: "#a0c4ff",
          hot: "#e7c6ff",
          core: "#f4faff",
          bgDark: "#020508",
          bgMid: "#060f18",
          bgHighlight: "#0b1a2c",
        };
      case "custom":
        return {
          calm: calmColor,
          mid: midColor,
          hot: hotColor,
          core: coreColor,
          bgDark,
          bgMid,
          bgHighlight,
        };
      case "cyberpunk":
      default:
        return {
          calm: calmColor || "#22e6ff",
          mid: midColor || "#8a5cff",
          hot: hotColor || "#ff3d9a",
          core: coreColor || "#eafcff",
          bgDark: bgDark || "#020308",
          bgMid: bgMid || "#05070d",
          bgHighlight: bgHighlight || "#0a1020",
        };
    }
  }, [
    themePreset,
    calmColor,
    midColor,
    hotColor,
    coreColor,
    bgDark,
    bgMid,
    bgHighlight,
  ]);

  const propsRef = React.useRef({
    count,
    flowSpeed,
    obstacleRadius,
    autopilot,
    palette: resolvedColors,
  });

  propsRef.current = {
    count,
    flowSpeed,
    obstacleRadius,
    autopilot,
    palette: resolvedColors,
  };

  const simulationRef = React.useRef<{ refresh: () => void } | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    const mainCanvas = mainCanvasRef.current;
    const bloomCanvas = bloomCanvasRef.current;
    if (!container || !mainCanvas || !bloomCanvas) return;

    const mainCtx = mainCanvas.getContext("2d");
    const bloomCtx = bloomCanvas.getContext("2d");
    if (!mainCtx || !bloomCtx) return;

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const random = mulberry32(7);

    let isDisposed = false;
    let isReady = false;
    let isVisible = false;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let bloomWidth = 1;
    let bloomHeight = 1;

    // Simulation particle buffers
    const posX = new Float32Array(MAX_PARTICLES);
    const posY = new Float32Array(MAX_PARTICLES);
    const velX = new Float32Array(MAX_PARTICLES);
    const velY = new Float32Array(MAX_PARTICLES);
    const weight = new Float32Array(MAX_PARTICLES);
    const baseSpeed = new Float32Array(MAX_PARTICLES);
    const speedRatio = new Float32Array(MAX_PARTICLES);
    const flash = new Float32Array(MAX_PARTICLES);
    const trailSegments = new Uint8Array(MAX_PARTICLES);
    const trailHistoryX = new Float32Array(MAX_PARTICLES * TRAIL_LENGTH);
    const trailHistoryY = new Float32Array(MAX_PARTICLES * TRAIL_LENGTH);

    let historyHead = 0;

    // Buckets for batched rendering
    const buckets: Int32Array[] = [];
    for (let i = 0; i < 6; i++) buckets.push(new Int32Array(MAX_PARTICLES));
    const bucketCounts = new Int32Array(6);

    const strokeStyles: string[] = new Array(6 * NUM_SUBTRAILS).fill("");
    const lineWidths = new Float32Array(6 * NUM_SUBTRAILS);
    const coreStyles = ["", ""];
    let obstacleRadialGradient: CanvasGradient | null = null;

    // Vortices / Puffs
    const puffX = new Float32Array(MAX_PUFFS);
    const puffY = new Float32Array(MAX_PUFFS);
    const puffVortex = new Float32Array(MAX_PUFFS);
    const puffAge = new Float32Array(MAX_PUFFS);
    const puffAlive = new Uint8Array(MAX_PUFFS);

    const activePuffX = new Float32Array(MAX_PUFFS);
    const activePuffY = new Float32Array(MAX_PUFFS);
    const activePuffStrength = new Float32Array(MAX_PUFFS);
    const activePuffCoreRadius = new Float32Array(MAX_PUFFS);
    const activePuffOuterRadiusSq = new Float32Array(MAX_PUFFS);

    let numActivePuffs = 0;
    let puffIndex = 0;
    let puffSign = 1;
    let pointerAccumDist = 0;

    let simTime = 0;
    let runningTime = 0;
    let activeParticles = 0;
    let targetParticleCount = 0;
    let performanceThrottling = 1;
    let isPointerActive = false;

    let cursorX = 0;
    let cursorY = 0;
    let lastPointerUpTime = 0;
    let autopilotGraceDelay = 1.2;

    let targetObsX = 0;
    let targetObsY = 0;
    let currentObsX = 0;
    let currentObsY = 0;
    let prevObsX = 0;
    let prevObsY = 0;
    let obsVelX = 0;
    let obsVelY = 0;
    let obstacleActivity = 0;
    let effectiveObstacleRadius = 64;

    let animFrameId = 0;
    let lastFrameTimestamp = 0;
    let accumulatorTime = 0;
    let avgDeltaTime = 16.7;
    let avgSimDuration = 4;
    let frameSlowCount = 0;
    let frameFastCount = 0;
    let prevObsMode = 0;

    const buildStyles = () => {
      const palette = propsRef.current.palette;
      const calmRgb = parseColor(palette.calm, DEFAULT_CALM);
      const midRgb = parseColor(palette.mid, DEFAULT_MID);
      const hotRgb = parseColor(palette.hot, DEFAULT_HOT);
      const coreRgb = parseColor(palette.core, DEFAULT_CORE);
      const colorTier = [calmRgb, midRgb, hotRgb];

      for (let b = 0; b < 6; b++) {
        const isForeground = b >= 3 ? 1 : 0;
        const tier = b % 3;
        const rgb = colorTier[tier];
        for (let s = 0; s < NUM_SUBTRAILS; s++) {
          const depthRatio = Math.pow(1 - (s + 0.5) / NUM_SUBTRAILS, 1.5);
          const alpha = Math.min(
            0.95,
            ALPHA_WEIGHTS[tier] *
              (isForeground === 0 ? 0.55 : 1) *
              depthRatio *
              ALPHA_BOOST
          );
          strokeStyles[b * NUM_SUBTRAILS + s] = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;
          const lw =
            LINE_WIDTH_FACTORS[tier] *
            (isForeground === 0 ? 0.75 : 1) *
            (1 - (0.45 * s) / NUM_SUBTRAILS);
          lineWidths[b * NUM_SUBTRAILS + s] = clamp(lw, 0.6, 1.3);
        }
      }

      coreStyles[0] = `rgba(${coreRgb[0]},${coreRgb[1]},${coreRgb[2]},0.5)`;
      coreStyles[1] = `rgba(${coreRgb[0]},${coreRgb[1]},${coreRgb[2]},0.85)`;

      const grad = mainCtx.createRadialGradient(0, 0, 0, 0, 0, 1);
      grad.addColorStop(0, `rgba(${hotRgb[0]},${hotRgb[1]},${hotRgb[2]},1)`);
      grad.addColorStop(0.45, `rgba(${hotRgb[0]},${hotRgb[1]},${hotRgb[2]},0.32)`);
      grad.addColorStop(1, `rgba(${hotRgb[0]},${hotRgb[1]},${hotRgb[2]},0)`);
      obstacleRadialGradient = grad;
    };

    const seedParticle = (i: number, initial: boolean) => {
      let x: number, y: number;
      if (initial) {
        x = random() * width;
        y = random() * height;
      } else {
        x = -40 + random() * (width + 80);
        y = -40 - random() * 80;
      }
      const w = 0.35 + 0.65 * random();
      const spd = 70 + 90 * w * w;
      const speedMult = clamp(propsRef.current.flowSpeed ?? 1, 0.05, 5);

      weight[i] = w;
      baseSpeed[i] = spd;
      trailSegments[i] = 9 + Math.floor(random() * 11);
      posX[i] = x;
      posY[i] = y;
      velX[i] = 0;
      velY[i] = spd * speedMult;
      speedRatio[i] = 1;
      flash[i] = 0;

      const offset = i * TRAIL_LENGTH;
      for (let s = 0; s < TRAIL_LENGTH; s++) {
        trailHistoryX[offset + s] = x;
        trailHistoryY[offset + s] = y;
      }
    };

    const seedAll = () => {
      for (let i = 0; i < MAX_PARTICLES; i++) seedParticle(i, true);
    };

    const setActiveCount = (total: number, initial: boolean) => {
      const clamped = clamp(Math.round(total), 1, MAX_PARTICLES);
      for (let i = activeParticles; i < clamped; i++) seedParticle(i, initial);
      activeParticles = clamped;
    };

    const applyCount = (initial: boolean) => {
      const autoCount = clamp(Math.round((width * height) / 520), 1200, 5200);
      const userCount = propsRef.current.count;
      targetParticleCount = clamp(
        Math.round(userCount !== undefined ? userCount : autoCount),
        1,
        MAX_PARTICLES
      );
      setActiveCount(targetParticleCount * performanceThrottling, initial);
    };

    const spawnPuff = (effRadius: number, velMagnitude: number) => {
      const normVx = obsVelX / velMagnitude;
      const normVy = obsVelY / velMagnitude;
      const sign = puffSign;
      puffSign = -puffSign;
      const idx = puffIndex;
      puffIndex = (puffIndex + 1) % MAX_PUFFS;

      puffX[idx] = currentObsX - normVx * 0.6 * effRadius - normVy * sign * 0.7 * effRadius;
      puffY[idx] = currentObsY - normVy * 0.6 * effRadius + normVx * sign * 0.7 * effRadius;
      puffVortex[idx] = clamp(
        sign * Math.min(velMagnitude, 1200) * effRadius * 1.5,
        -105000,
        105000
      );
      puffAge[idx] = 0;
      puffAlive[idx] = 1;
    };

    const simulate = () => {
      const p = propsRef.current;
      const speedMult = clamp(p.flowSpeed ?? 1, 0.05, 5);
      const baseRadius = p.obstacleRadius ?? 64;
      const isAutopilot = p.autopilot ?? true;

      historyHead = (historyHead + 1) % TRAIL_LENGTH;
      simTime += DT;
      if (isVisible) runningTime += DT;

      const autopilotActive =
        !prefersReducedMotion &&
        isAutopilot &&
        !isPointerActive &&
        isVisible &&
        runningTime - lastPointerUpTime >= autopilotGraceDelay;

      const mode = isPointerActive ? 2 : autopilotActive ? 1 : 0;
      if (mode === 1) {
        targetObsX = width * (0.5 + 0.32 * Math.sin(0.37 * runningTime));
        targetObsY = height * (0.5 + 0.28 * Math.sin(0.53 * runningTime + 1.2));
      } else if (mode === 2) {
        targetObsX = cursorX;
        targetObsY = cursorY;
      }

      const justActivated = mode !== 0 && prevObsMode === 0 && obstacleActivity < 0.05;
      prevObsMode = mode;

      if (justActivated) {
        currentObsX = targetObsX;
        currentObsY = targetObsY;
        prevObsX = currentObsX;
        prevObsY = currentObsY;
        obsVelX = 0;
        obsVelY = 0;
      } else {
        prevObsX = currentObsX;
        prevObsY = currentObsY;
        currentObsX += (targetObsX - currentObsX) * OBSTACLE_POS_LERP;
        currentObsY += (targetObsY - currentObsY) * OBSTACLE_POS_LERP;
        obsVelX += ((currentObsX - prevObsX) / DT - obsVelX) * OBSTACLE_VEL_LERP;
        obsVelY += ((currentObsY - prevObsY) / DT - obsVelY) * OBSTACLE_VEL_LERP;
      }

      obstacleActivity +=
        ((mode !== 0 ? 1 : 0) - obstacleActivity) *
        (mode !== 0 ? OBSTACLE_ACTIVE_RISE : OBSTACLE_ACTIVE_FALL);

      const activeRatio = obstacleActivity;
      const obsSpeed = Math.sqrt(obsVelX * obsVelX + obsVelY * obsVelY);
      const effRadius = baseRadius + Math.min(obsSpeed * 0.025, 36);
      effectiveObstacleRadius = effRadius;

      if (activeRatio > 0.3 && obsSpeed > 60) {
        const dx = currentObsX - prevObsX;
        const dy = currentObsY - prevObsY;
        pointerAccumDist += Math.sqrt(dx * dx + dy * dy);
        let spawned = 0;
        while (pointerAccumDist >= 28 && spawned < 4) {
          pointerAccumDist -= 28;
          spawned++;
          spawnPuff(effRadius, obsSpeed);
        }
        if (pointerAccumDist >= 28) pointerAccumDist = 0;
      } else {
        pointerAccumDist = 0;
      }

      // Update puffs
      numActivePuffs = 0;
      const puffDrift = 0.5 * 115 * speedMult * DT;
      for (let i = 0; i < MAX_PUFFS; i++) {
        if (puffAlive[i] === 0) continue;
        const age = puffAge[i] + DT;
        if (age > 2.4) {
          puffAlive[i] = 0;
          continue;
        }
        puffAge[i] = age;
        puffVortex[i] *= PUFF_VORTEX_DECAY;
        puffY[i] += puffDrift;
        const coreRad = 676 + 90 * age;
        activePuffX[numActivePuffs] = puffX[i];
        activePuffY[numActivePuffs] = puffY[i];
        activePuffStrength[numActivePuffs] = puffVortex[i] / TWO_PI;
        activePuffCoreRadius[numActivePuffs] = coreRad;
        activePuffOuterRadiusSq[numActivePuffs] = 36 * coreRad;
        numActivePuffs++;
      }

      // Atmospheric harmonic wave angles
      const wavePhase1 = WAVE_1.om * simTime + WAVE_1.ph;
      const wavePhase2 = WAVE_2.om * simTime + WAVE_2.ph;
      const wavePhase3 = WAVE_3.om * simTime + WAVE_3.ph;
      const hasWeakDeflection = activeRatio > 0.002;
      const hasHardBoundary = activeRatio > 0.05;
      const boundaryScale = Math.min(1, activeRatio * 1.5);
      const bottomLimit = height + 40;
      const rightLimit = width + 120;

      for (let i = 0; i < activeParticles; i++) {
        const px = posX[i];
        const py = posY[i];
        const pw = weight[i];
        const targetDownSpd = baseSpeed[i] * speedMult;

        const cosW1 = Math.cos(WAVE_1.kx * px + WAVE_1.ky * py + wavePhase1);
        const cosW2 = Math.cos(WAVE_2.kx * px + WAVE_2.ky * py + wavePhase2);
        const cosW3 = Math.cos(WAVE_3.kx * px + WAVE_3.ky * py + wavePhase3);

        let targetVx = (WAVE_1.au * cosW1 + WAVE_2.au * cosW2 + WAVE_3.au * cosW3) * pw;
        let targetVy = targetDownSpd + (WAVE_1.av * cosW1 + WAVE_2.av * cosW2 + WAVE_3.av * cosW3) * pw;

        const weightFactor = 0.55 + 0.45 * pw;
        const partRadius = effRadius * weightFactor;
        const dx = px - currentObsX;
        const dy = py - currentObsY;

        let deflectVx = 0;
        let deflectVy = 0;
        let wakeBrake = 0;

        if (hasWeakDeflection) {
          const distSq = dx * dx + dy * dy;
          let relVx = -obsVelX;
          let relVy = targetDownSpd - obsVelY;
          let relSpeed = Math.sqrt(relVx * relVx + relVy * relVy);

          if (relSpeed > 0.001) {
            if (relSpeed > 900) {
              const scale = 900 / relSpeed;
              relVx *= scale;
              relVy *= scale;
              relSpeed = 900;
            }
            const unitVx = relVx / relSpeed;
            const unitVy = relVy / relSpeed;
            const longitudinalDist = dx * unitVx + dy * unitVy;
            const lateralDist = -dx * unitVy + dy * unitVx;

            if (longitudinalDist > 0 && longitudinalDist < 12 * partRadius) {
              const wakeWidth = 0.9 * partRadius + 0.2 * longitudinalDist;
              const wakeNorm = lateralDist / wakeWidth;
              wakeBrake =
                0.55 *
                Math.exp(-longitudinalDist / (3 * partRadius)) *
                Math.exp(-wakeNorm * wakeNorm);
            }

            const influenceLimit = 9 * partRadius;
            if (distSq < influenceLimit * influenceLimit) {
              const safeDistSq = Math.max(
                longitudinalDist * longitudinalDist + lateralDist * lateralDist,
                partRadius * partRadius * 0.64
              );
              const invSq = (partRadius * partRadius) / (safeDistSq * safeDistSq);
              const potVx =
                -relSpeed * invSq * (longitudinalDist * longitudinalDist - lateralDist * lateralDist);
              const potVy = -relSpeed * invSq * 2 * longitudinalDist * lateralDist;

              let falloff = 1;
              const innerRange = 5 * partRadius;
              if (distSq > innerRange * innerRange) {
                const normDist = (Math.sqrt(distSq) - innerRange) / (4 * partRadius);
                falloff = 1 - normDist * normDist * (3 - 2 * normDist);
              }
              deflectVx = (potVx * unitVx - potVy * unitVy) * falloff;
              deflectVy = (potVx * unitVy + potVy * unitVx) * falloff;
            }
          }
        }

        // Swirl puffs
        let swirlVx = 0;
        let swirlVy = 0;
        for (let pIdx = 0; pIdx < numActivePuffs; pIdx++) {
          const pdx = px - activePuffX[pIdx];
          const pdy = py - activePuffY[pIdx];
          const pDistSq = pdx * pdx + pdy * pdy + 0.001;
          const outerR2 = activePuffOuterRadiusSq[pIdx];
          if (pDistSq < outerR2) {
            const mag =
              (activePuffStrength[pIdx] * (1 - Math.exp(-pDistSq / activePuffCoreRadius[pIdx]))) /
              pDistSq;
            const ramp = 1 - pDistSq / outerR2;
            const factor = mag * ramp * ramp * weightFactor;
            swirlVx += -pdy * factor;
            swirlVy += pdx * factor;
          }
        }

        const flowRetention = 1 - wakeBrake * activeRatio;
        targetVx = targetVx * flowRetention + deflectVx * activeRatio + swirlVx;
        targetVy = targetVy * flowRetention + deflectVy * activeRatio + swirlVy;

        let curVx = velX[i] + (targetVx - velX[i]) * VELOCITY_DRAG;
        let curVy = velY[i] + (targetVy - velY[i]) * VELOCITY_DRAG;

        const currentSpeedSq = curVx * curVx + curVy * curVy;
        if (currentSpeedSq > 810000) {
          const scale = 900 / Math.sqrt(currentSpeedSq);
          curVx *= scale;
          curVy *= scale;
        }

        let nextX = px + curVx * DT;
        let nextY = py + curVy * DT;

        // Hard boundary push
        if (hasHardBoundary) {
          const boundR = partRadius * boundaryScale;
          const bdx = nextX - currentObsX;
          const bdy = nextY - currentObsY;
          const bDistSq = bdx * bdx + bdy * bdy;
          const minSafeDist = 0.98 * boundR;

          if (bDistSq < minSafeDist * minSafeDist) {
            const bDist = Math.sqrt(bDistSq);
            const normX = bDist < 0.001 ? 0 : bdx / bDist;
            const normY = bDist < 0.001 ? 1 : bdy / bDist;
            nextX = currentObsX + normX * boundR;
            nextY = currentObsY + normY * boundR;

            const dotRel = (curVx - obsVelX) * normX + (curVy - obsVelY) * normY;
            if (dotRel < 0) {
              curVx -= dotRel * normX;
              curVy -= dotRel * normY;
            }
          }
        }

        velX[i] = curVx;
        velY[i] = curVy;
        posX[i] = nextX;
        posY[i] = nextY;

        // Respawn if out of viewport
        if (nextY > bottomLimit || nextX < -120 || nextX > rightLimit || nextY < -600) {
          seedParticle(i, false);
          continue;
        }

        const speedRatioTarget = Math.sqrt(curVx * curVx + curVy * curVy) / targetDownSpd;
        speedRatio[i] += (speedRatioTarget - speedRatio[i]) * SPEED_RATIO_LERP;

        if (random() < FLASH_PROBABILITY_PER_FRAME) {
          flash[i] = 1;
        } else {
          const decayed = flash[i] * FLASH_DECAY;
          flash[i] = decayed < 0.01 ? 0 : decayed;
        }

        const histOffset = i * TRAIL_LENGTH + historyHead;
        trailHistoryX[histOffset] = nextX;
        trailHistoryY[histOffset] = nextY;
      }
    };

    const render = () => {
      mainCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      mainCtx.clearRect(0, 0, width, height);
      mainCtx.globalCompositeOperation = "lighter";
      mainCtx.lineCap = "round";
      mainCtx.lineJoin = "round";

      // Obstacle glow
      if (obstacleActivity > 0.02 && obstacleRadialGradient) {
        const obsSpeed = Math.sqrt(obsVelX * obsVelX + obsVelY * obsVelY);
        const radiusScale = 1.5 * effectiveObstacleRadius;
        mainCtx.globalAlpha = Math.min(
          1,
          (0.05 + Math.min(obsSpeed / 4000, 0.07)) * obstacleActivity
        );
        mainCtx.setTransform(
          pixelRatio * radiusScale,
          0,
          0,
          pixelRatio * radiusScale,
          pixelRatio * currentObsX,
          pixelRatio * currentObsY
        );
        mainCtx.fillStyle = obstacleRadialGradient;
        mainCtx.fillRect(-1, -1, 2, 2);
        mainCtx.globalAlpha = 1;
        mainCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }

      bucketCounts.fill(0);
      for (let i = 0; i < activeParticles; i++) {
        const ratio = speedRatio[i];
        let tier = ratio < 1.25 ? 0 : ratio < 1.85 ? 1 : 2;
        if (flash[i] > 0.35 && tier < 2) tier++;
        const bucket = (weight[i] < 0.62 ? 0 : 3) + tier;
        buckets[bucket][bucketCounts[bucket]++] = i;
      }

      // Draw particle trails
      for (let b = 0; b < 6; b++) {
        const count = bucketCounts[b];
        if (count === 0) continue;
        const bucketParticles = buckets[b];

        for (let s = 0; s < NUM_SUBTRAILS; s++) {
          const segStart = s * SUBTRAIL_STEP;
          const segEnd = segStart + SUBTRAIL_STEP;
          mainCtx.strokeStyle = strokeStyles[b * NUM_SUBTRAILS + s];
          mainCtx.lineWidth = lineWidths[b * NUM_SUBTRAILS + s];
          mainCtx.beginPath();

          for (let pIdx = 0; pIdx < count; pIdx++) {
            const p = bucketParticles[pIdx];
            const maxSegs = trailSegments[p] - 1;
            if (segStart >= maxSegs) continue;

            const baseHistIdx = p * TRAIL_LENGTH;
            const limit = Math.min(segEnd, maxSegs);
            let histIdx = (historyHead - segStart + TRAIL_LENGTH) % TRAIL_LENGTH;

            mainCtx.moveTo(
              trailHistoryX[baseHistIdx + histIdx],
              trailHistoryY[baseHistIdx + histIdx]
            );
            for (let seg = segStart; seg < limit; seg++) {
              histIdx = histIdx === 0 ? TRAIL_LENGTH - 1 : histIdx - 1;
              mainCtx.lineTo(
                trailHistoryX[baseHistIdx + histIdx],
                trailHistoryY[baseHistIdx + histIdx]
              );
            }
          }
          mainCtx.stroke();
        }
      }

      // Draw bright leading core sparks
      const prevHead = historyHead === 0 ? TRAIL_LENGTH - 1 : historyHead - 1;
      mainCtx.lineWidth = CORE_LINE_WIDTH;

      for (let isFg = 0; isFg < 2; isFg++) {
        mainCtx.strokeStyle = coreStyles[isFg];
        mainCtx.beginPath();
        for (let tier = 1; tier < 3; tier++) {
          const b = isFg * 3 + tier;
          const count = bucketCounts[b];
          const bucketParticles = buckets[b];
          for (let pIdx = 0; pIdx < count; pIdx++) {
            const p = bucketParticles[pIdx];
            if (tier === 1 && flash[p] <= 0.5) continue;
            const baseHistIdx = p * TRAIL_LENGTH;
            mainCtx.moveTo(
              trailHistoryX[baseHistIdx + historyHead],
              trailHistoryY[baseHistIdx + historyHead]
            );
            mainCtx.lineTo(
              trailHistoryX[baseHistIdx + prevHead],
              trailHistoryY[baseHistIdx + prevHead]
            );
          }
        }
        mainCtx.stroke();
      }

      // Downsample to bloom canvas
      bloomCtx.clearRect(0, 0, bloomWidth, bloomHeight);
      bloomCtx.drawImage(mainCanvas, 0, 0, bloomWidth, bloomHeight);
    };

    const presimulate = (seconds: number) => {
      const steps = Math.round(seconds / DT);
      for (let s = 0; s < steps; s++) simulate();
    };

    const rebuildStatic = () => {
      seedAll();
      activeParticles = 0;
      applyCount(true);
      isPointerActive = true;
      cursorX = width * 0.4;
      cursorY = height * 0.45;
      targetObsX = cursorX;
      targetObsY = cursorY;
      currentObsX = cursorX;
      prevObsX = cursorX;
      currentObsY = cursorY;
      prevObsY = cursorY;
      obsVelX = 0;
      obsVelY = 0;
      obstacleActivity = 1;
      prevObsMode = 2;
      numActivePuffs = 0;
      puffAlive.fill(0);
      presimulate(3);
      render();
    };

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const newW = Math.max(1, rect.width || window.innerWidth);
      const newH = Math.max(1, rect.height || window.innerHeight);
      let newDpr = Math.min(window.devicePixelRatio || 1, 2);

      if (newW * newH * newDpr * newDpr > 4500000) {
        newDpr = Math.sqrt(4500000 / (newW * newH));
      }

      if (newW === width && newH === height && newDpr === pixelRatio) return;

      width = newW;
      height = newH;
      pixelRatio = newDpr;

      mainCanvas.width = Math.max(1, Math.round(width * pixelRatio));
      mainCanvas.height = Math.max(1, Math.round(height * pixelRatio));

      bloomWidth = Math.max(1, Math.ceil(width / 4));
      bloomHeight = Math.max(1, Math.ceil(height / 4));
      bloomCanvas.width = bloomWidth;
      bloomCanvas.height = bloomHeight;
      bloomCtx.imageSmoothingEnabled = true;
      bloomCtx.imageSmoothingQuality = "medium";

      if (!isReady) return;

      if (prefersReducedMotion) {
        rebuildStatic();
        return;
      }

      for (let i = 0; i < activeParticles; i++) {
        if (posX[i] < -120 || posX[i] > width + 120 || posY[i] > height + 40) {
          seedParticle(i, false);
        }
      }
      applyCount(true);
      render();
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      cursorX = e.clientX - rect.left;
      cursorY = e.clientY - rect.top;
      isPointerActive = true;
    };

    const onPointerLeave = () => {
      if (isPointerActive) {
        isPointerActive = false;
        lastPointerUpTime = runningTime;
        autopilotGraceDelay = 4;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") onPointerLeave();
    };

    const onFrame = (now: number) => {
      if (isDisposed) return;

      const deltaMs = Math.max(0, now - lastFrameTimestamp);
      lastFrameTimestamp = now;
      accumulatorTime += Math.min(0.05, deltaMs / 1000);

      const simStart = performance.now();
      let steps = 0;
      while (accumulatorTime >= DT && steps < 3) {
        simulate();
        accumulatorTime -= DT;
        steps++;
      }
      if (steps === 3) accumulatorTime = 0;
      if (steps > 0) render();

      const simDuration = performance.now() - simStart;
      if (deltaMs > 0 && deltaMs < 100) {
        avgDeltaTime += (deltaMs - avgDeltaTime) * 0.05;
        avgSimDuration += (simDuration - avgSimDuration) * 0.05;
      }

      if (avgDeltaTime > 20) {
        frameSlowCount++;
        frameFastCount = 0;
      } else if (avgDeltaTime < 18.5 && avgSimDuration < 12) {
        frameFastCount++;
        frameSlowCount = 0;
      } else {
        frameSlowCount = 0;
        frameFastCount = 0;
      }

      if (frameSlowCount >= 60 && performanceThrottling > 0.4) {
        performanceThrottling = Math.max(0.4, performanceThrottling - 0.1);
        frameSlowCount = 0;
        applyCount(false);
      } else if (frameFastCount >= 180 && performanceThrottling < 1) {
        performanceThrottling = Math.min(1, performanceThrottling + 0.05);
        frameFastCount = 0;
        applyCount(false);
      }

      animFrameId = requestAnimationFrame(onFrame);
    };

    const startLoop = () => {
      cancelAnimationFrame(animFrameId);
      lastFrameTimestamp = performance.now();
      accumulatorTime = 0;
      animFrameId = requestAnimationFrame(onFrame);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animFrameId);
        animFrameId = 0;
      } else if (isVisible && !isDisposed) {
        startLoop();
      }
    };

    handleResize();
    buildStyles();
    seedAll();
    applyCount(true);

    currentObsX = targetObsX = prevObsX = width * 0.5;
    currentObsY = targetObsY = prevObsY = height * 0.5;

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    simulationRef.current = {
      refresh: () => {
        if (isDisposed || !isReady) return;
        buildStyles();
        if (prefersReducedMotion) {
          rebuildStatic();
        } else {
          applyCount(false);
        }
      },
    };

    if (prefersReducedMotion) {
      isReady = true;
      rebuildStatic();
    } else {
      presimulate(2.5);
      render();
      isReady = true;
      isVisible = true;

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { passive: true });
      window.addEventListener("pointercancel", onPointerLeave, { passive: true });
      window.addEventListener("blur", onPointerLeave);
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
      document.addEventListener("visibilitychange", onVisibilityChange);

      startLoop();
    }

    return () => {
      isDisposed = true;
      isVisible = false;
      cancelAnimationFrame(animFrameId);
      animFrameId = 0;

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      resizeObserver.disconnect();
      simulationRef.current = null;
      obstacleRadialGradient = null;
    };
  }, []);

  // Update styles if colors or counts change
  React.useEffect(() => {
    simulationRef.current?.refresh();
  }, [
    count,
    resolvedColors.calm,
    resolvedColors.mid,
    resolvedColors.hot,
    resolvedColors.core,
  ]);

  const rootStyle: React.CSSProperties = {
    position: fullscreen ? "fixed" : "relative",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    pointerEvents: "none",
    isolation: "isolate",
    background: `radial-gradient(120% 90% at 50% 38%, ${resolvedColors.bgHighlight} 0%, ${resolvedColors.bgMid} 55%, ${resolvedColors.bgDark} 100%)`,
    ...style,
  };

  const canvasStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "block",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  };

  const bloomStyle: React.CSSProperties = {
    ...canvasStyle,
    filter: `blur(${bloomBlur}px) saturate(1.4)`,
    mixBlendMode: "screen",
    opacity: bloomOpacity,
    transform: "scale(1.03)",
  };

  const vignetteStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    background: `radial-gradient(ellipse 85% 80% at 50% 46%, transparent 40%, rgba(0, 0, 0, ${vignetteOpacity}) 100%)`,
  };

  const grainStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    opacity: grainOpacity,
    mixBlendMode: "overlay",
    backgroundSize: "180px 180px",
    backgroundImage: `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  };

  return (
    <div
      ref={containerRef}
      className={`dr-root ${className}`.trim()}
      style={rootStyle}
      aria-hidden="true"
    >
      <canvas ref={bloomCanvasRef} style={bloomStyle} />
      <canvas ref={mainCanvasRef} style={canvasStyle} />
      <div style={vignetteStyle} />
      <div style={grainStyle} />
    </div>
  );
}

// ── Framer Property Controls ───────────────────────────────────────────
addPropertyControls(DataRain, {
  fullscreen: {
    type: ControlType.Boolean,
    title: "Fullscreen",
    defaultValue: false,
    description: "Fixed viewport overlay vs filling the container frame",
  },
  themePreset: {
    type: ControlType.Enum,
    title: "Theme Preset",
    options: ["cyberpunk", "matrix", "solar", "arctic", "custom"],
    optionTitles: ["Default (Cyberpunk)", "Matrix", "Solar Flame", "Arctic Ice", "Custom Colors"],
    defaultValue: "cyberpunk",
  },
  flowSpeed: {
    type: ControlType.Number,
    title: "Flow Speed",
    min: 0.1,
    max: 4.0,
    step: 0.1,
    defaultValue: 1.0,
    displayStepper: true,
  },
  count: {
    type: ControlType.Number,
    title: "Particles",
    min: 200,
    max: 6000,
    step: 100,
    defaultValue: 2600,
    displayStepper: true,
  },
  obstacleRadius: {
    type: ControlType.Number,
    title: "Deflector Size",
    min: 20,
    max: 200,
    step: 4,
    defaultValue: 64,
    displayStepper: true,
  },
  autopilot: {
    type: ControlType.Boolean,
    title: "Autopilot",
    defaultValue: true,
    description: "Drift deflection figure-8 pattern when cursor is idle",
  },
  bloomBlur: {
    type: ControlType.Number,
    title: "Bloom Blur",
    min: 0,
    max: 30,
    step: 1,
    defaultValue: 10,
    displayStepper: true,
  },
  bloomOpacity: {
    type: ControlType.Number,
    title: "Bloom Opacity",
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.7,
  },
  vignetteOpacity: {
    type: ControlType.Number,
    title: "Vignette",
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.62,
  },
  grainOpacity: {
    type: ControlType.Number,
    title: "Film Grain",
    min: 0,
    max: 0.2,
    step: 0.01,
    defaultValue: 0.05,
  },
  // Custom Color Controls (revealed when themePreset === "custom")
  calmColor: {
    type: ControlType.Color,
    title: "Calm Stream",
    defaultValue: "#22e6ff",
    hidden: (props: Partial<DataRainProps>) => props.themePreset !== "custom",
  },
  midColor: {
    type: ControlType.Color,
    title: "Mid Velocity",
    defaultValue: "#8a5cff",
    hidden: (props: Partial<DataRainProps>) => props.themePreset !== "custom",
  },
  hotColor: {
    type: ControlType.Color,
    title: "Hot Core",
    defaultValue: "#ff3d9a",
    hidden: (props: Partial<DataRainProps>) => props.themePreset !== "custom",
  },
  coreColor: {
    type: ControlType.Color,
    title: "Spark Light",
    defaultValue: "#eafcff",
    hidden: (props: Partial<DataRainProps>) => props.themePreset !== "custom",
  },
  bgDark: {
    type: ControlType.Color,
    title: "BG Base",
    defaultValue: "#020308",
    hidden: (props: Partial<DataRainProps>) => props.themePreset !== "custom",
  },
  bgMid: {
    type: ControlType.Color,
    title: "BG Middle",
    defaultValue: "#05070d",
    hidden: (props: Partial<DataRainProps>) => props.themePreset !== "custom",
  },
  bgHighlight: {
    type: ControlType.Color,
    title: "BG Center",
    defaultValue: "#0a1020",
    hidden: (props: Partial<DataRainProps>) => props.themePreset !== "custom",
  },
});
