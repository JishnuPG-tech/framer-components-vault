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


// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type BlackHoleTheme =
  | "Monochrome (Hero / 21st.dev)"
  | "Gargantua (Gold)"
  | "Cygnus X-1 (Accretion Blue)"
  | "Crimson Abyss (Infrared)"
  | "Cosmic Violet (Nebula)";

export interface OptimizedBlackHoleProps {
  theme?: BlackHoleTheme;
  centerX?: number;
  centerY?: number;
  cameraPitch?: number;
  cameraRoll?: number;
  diskRadius?: number;
  diskBrightness?: number;
  diskSpeed?: number;
  turbulence?: number;
  dopplerStrength?: number;
  coronaGlow?: number;
  photonRing?: boolean;
  starDensity?: number;
  vignette?: number;
  interactive?: boolean;
  mouseSensitivity?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  responsiveOffset?: boolean;
  quality?: "High" | "Balanced" | "Performance";
  pauseOffscreen?: boolean;
  borderRadius?: number;
  style?: React.CSSProperties;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Color Themes & Spectral Signatures
// ─────────────────────────────────────────────────────────────────────────────

interface ThemePalette {
  core: [number, number, number];
  inner: [number, number, number];
  outer: [number, number, number];
  saturation: number;
}

const THEMES: Record<BlackHoleTheme, ThemePalette> = {
  "Monochrome (Hero / 21st.dev)": {
    core: [1.15, 1.18, 1.22],
    inner: [0.88, 0.90, 0.94],
    outer: [0.55, 0.56, 0.58],
    saturation: 0.0,
  },
  "Gargantua (Gold)": {
    core: [1.15, 1.05, 0.92],
    inner: [1.0, 0.65, 0.22],
    outer: [0.58, 0.16, 0.04],
    saturation: 1.0,
  },
  "Cygnus X-1 (Accretion Blue)": {
    core: [0.95, 1.02, 1.15],
    inner: [0.25, 0.75, 1.0],
    outer: [0.05, 0.22, 0.65],
    saturation: 1.0,
  },
  "Crimson Abyss (Infrared)": {
    core: [1.15, 0.95, 0.88],
    inner: [1.0, 0.28, 0.14],
    outer: [0.55, 0.04, 0.08],
    saturation: 1.0,
  },
  "Cosmic Violet (Nebula)": {
    core: [1.05, 0.95, 1.15],
    inner: [0.78, 0.35, 1.0],
    outer: [0.38, 0.06, 0.65],
    saturation: 1.0,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Relativistic Geodesic Raymarching GLSL Shaders (WebGL 2.0 / GLSL 3.00 ES)
// ─────────────────────────────────────────────────────────────────────────────

const VERTEX_SHADER = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_centerX;
uniform float u_centerY;
uniform float u_cameraPitch;
uniform float u_cameraRoll;
uniform float u_distance;
uniform float u_fov;
uniform float u_diskRadius;
uniform float u_diskSpeed;
uniform float u_diskBrightness;
uniform float u_turbulence;
uniform float u_doppler;
uniform float u_coronaGlow;
uniform float u_starDensity;
uniform float u_vignette;
uniform float u_saturation;
uniform float u_photonRing;
uniform vec3 u_coreColor;
uniform vec3 u_innerColor;
uniform vec3 u_outerColor;
uniform int u_maxSteps;

#define HORIZON 1.0
#define ISCO 3.0
#define B_CRIT 2.59807621
#define TWO_PI 6.283185307

// Fast 3D Hash
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

// 3D Simplex-Style Value Noise
float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}

// Multi-octave Streak FBM along streamline coords
float streakFbm(float angle, float radius, float angScale, float radScale, int octaves, float seed) {
  float val = 0.0;
  float total = 0.0;
  float amp = 0.5;
  float a = angScale;
  float r = radScale;
  float offset = seed;

  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    float n = noise3D(vec3(cos(angle) * a, sin(angle) * a, radius * r + offset));
    val += amp * n;
    total += amp;
    a *= 1.72;
    r *= 1.86;
    offset += 23.7;
    amp *= 0.55;
  }
  return val / max(total, 0.001);
}

// Multi-octave Ridge FBM for sharp swirling ripples & filaments
float ridgeFbm(float angle, float radius, float angScale, float radScale, int octaves, float seed) {
  float val = 0.0;
  float total = 0.0;
  float amp = 0.5;
  float a = angScale;
  float r = radScale;
  float offset = seed;

  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    float n = noise3D(vec3(cos(angle) * a, sin(angle) * a, radius * r + offset));
    float crest = pow(1.0 - abs(n * 2.0 - 1.0), 1.35);
    val += amp * crest;
    total += amp;
    a *= 1.26;
    r *= 2.05;
    offset += 41.9;
    amp *= 0.62;
  }
  return val / max(total, 0.001);
}

// Relativistic Geodesic Acceleration: a = -1.5 * h^2 * pos / r^5
vec3 geodesicAcceleration(vec3 pos, vec3 vel) {
  float r2 = max(dot(pos, pos), 0.0001);
  vec3 h = cross(pos, vel);
  float h2 = dot(h, h);
  return -1.5 * h2 * pos / (r2 * r2 * sqrt(r2));
}

// Multi-Scale Starfield
vec3 renderStars(vec3 dir) {
  if (u_starDensity <= 0.0) return vec3(0.0);
  vec3 d = normalize(dir);
  vec3 col = vec3(0.0);

  // Layer 1: Bright anchor stars
  vec3 p1 = d * 55.0;
  vec3 ip1 = floor(p1);
  vec3 rnd1 = hash33(ip1);
  if (rnd1.x > 0.93 - u_starDensity * 0.03) {
    vec3 center = ip1 + 0.5 + (rnd1 - 0.5) * 0.75;
    float dist = length(p1 - center);
    float b = pow(clamp(1.0 - dist * 4.0, 0.0, 1.0), 4.0) * (1.6 + 2.4 * rnd1.y);
    col += vec3(b);
  }

  // Layer 2: Medium field stars
  vec3 p2 = d * 135.0;
  vec3 ip2 = floor(p2);
  vec3 rnd2 = hash33(ip2 + 51.3);
  if (rnd2.x > 0.88 - u_starDensity * 0.03) {
    vec3 center = ip2 + 0.5 + (rnd2 - 0.5) * 0.75;
    float dist = length(p2 - center);
    float b = pow(clamp(1.0 - dist * 5.0, 0.0, 1.0), 3.5) * (0.8 + 1.2 * rnd2.y);
    col += vec3(b);
  }

  // Layer 3: Dense faint star dust
  vec3 p3 = d * 260.0;
  vec3 ip3 = floor(p3);
  vec3 rnd3 = hash33(ip3 + 119.7);
  if (rnd3.x > 0.81 - u_starDensity * 0.04) {
    vec3 center = ip3 + 0.5 + (rnd3 - 0.5) * 0.7;
    float dist = length(p3 - center);
    float b = pow(clamp(1.0 - dist * 6.5, 0.0, 1.0), 3.0) * (0.4 + 0.6 * rnd3.y);
    col += vec3(b);
  }

  // Layer 4: Micro cosmic dust
  vec3 p4 = d * 420.0;
  vec3 ip4 = floor(p4);
  vec3 rnd4 = hash33(ip4 + 233.1);
  if (rnd4.x > 0.78 - u_starDensity * 0.04) {
    vec3 center = ip4 + 0.5 + (rnd4 - 0.5) * 0.6;
    float dist = length(p4 - center);
    float b = pow(clamp(1.0 - dist * 8.0, 0.0, 1.0), 2.5) * 0.35;
    col += vec3(b);
  }

  return col;
}

// 21st.dev Accretion Disk Shader
vec4 shadeDisk(vec3 hitPos, vec3 viewDir, float side) {
  float slant = max(abs(viewDir.y), 0.022);
  float grazing = min(1.0 / slant, 34.0);
  float radius = length(hitPos.xz);
  float azimuth = atan(hitPos.z, hitPos.x);
  float radiusNorm = clamp((radius - ISCO) / (u_diskRadius - ISCO), 0.0, 1.0);

  // Keplerian Differential Rotation
  float omega = u_diskSpeed * 0.55 / pow(radius, 1.5);
  float omegaRef = u_diskSpeed * 0.55 / pow(6.5, 1.5);
  float rigid = fract(u_time * omegaRef / TWO_PI) * TWO_PI;
  float swirl = 0.85;
  float flowBase = azimuth - rigid + swirl * log(radius / ISCO);

  float outward = smoothstep(0.0, 0.92, radiusNorm);
  float chaos = u_turbulence * (0.08 + 2.10 * outward * outward);

  float angBase = 5.75 * 0.45 * (0.80 + 1.45 * outward);
  float radBase = 3.44 * 2.35;
  float flowRad = 3.44 * 0.105;

  // Domain Warping for Fluid Smoke Streaks
  float warpA = streakFbm(flowBase, radius, angBase * 0.55, flowRad * 1.6, 2, 3.7) - 0.5;
  float warpB = streakFbm(flowBase + 2.4, radius * 1.13, angBase * 2.8, radBase * 0.45, 3, 61.3) - 0.5;

  float radiusW = radius + (warpA * 1.9 + warpB * 1.25 * outward) * chaos * 0.25;
  float angleW = flowBase + (warpB * 0.9 - warpA * 0.35) * chaos * 0.45 / max(radius * 0.22, 0.35);

  // Flow and Threads
  float flow = streakFbm(angleW, radiusW, angBase, flowRad, 3, 131.7);
  float grazingFilter = clamp(1.0 - (grazing - 2.0) * 0.06, 0.08, 1.0);
  float threads = ridgeFbm(angleW, radiusW, angBase * 0.85, radBase * grazingFilter, 4, 0.0);
  float field = mix(flow, flow * 0.32 + threads * 0.92, 0.62);

  // Cloud Modulation
  float cloudRaw = streakFbm(flowBase * 0.4, radius, 2.0, 0.7, 2, 211.7);
  float cloud = smoothstep(0.28, 0.72, cloudRaw);
  field *= mix(0.8, 1.2, cloud);

  // Radial Envelopes
  float innerEdge = smoothstep(0.0, 0.045, radiusNorm);
  float outerEdge = 1.0 - smoothstep(0.62 + warpB * 0.28, 1.0, radiusNorm);
  float envelope = innerEdge * outerEdge * mix(1.0, 0.62, outward);

  float smoke = clamp(pow(smoothstep(0.34, 0.74, field), 1.8) * envelope, 0.0, 1.0);
  float emissivity = (mix(0.05, 1.0, pow(smoke, 1.35)) + 2.4 * pow(smoke, 4.5)) * envelope;

  // Optical Thickness
  float opticalDepth = smoke * mix(0.32, 0.85, radiusNorm) * pow(grazing, 0.62) * 1.42;
  float alpha = 1.0 - exp(-opticalDepth);

  // Relativistic Doppler Beaming
  vec3 tangent = normalize(vec3(-hitPos.z, 0.0, hitPos.x));
  float orbitalSpeed = min(0.64, 0.94 / sqrt(max(radius - HORIZON, 0.25)));
  float towardObserver = dot(tangent, -viewDir);
  float beaming = pow(clamp(1.0 / (1.0 - orbitalSpeed * towardObserver), 0.72, 1.55), 1.5 * u_doppler);
  float redshift = sqrt(max(1.0 - HORIZON / radius, 0.025));

  float core = 1.0 + 2.6 * pow(1.0 - radiusNorm, 5.0);
  float flux = pow(clamp(ISCO / radius, 0.0, 1.0), 1.7);
  float edgeGlow = 1.0 + 0.55 * smoothstep(6.0, 26.0, grazing);

  // Thermal Gradient
  float heat = pow(1.0 - radiusNorm, 1.25);
  vec3 thermal = mix(u_outerColor, u_innerColor, smoothstep(0.03, 0.5, heat));
  thermal = mix(thermal, u_coreColor, pow(heat, 2.2));

  vec3 emission = thermal * beaming * redshift * flux * core * emissivity * edgeGlow * u_diskBrightness * 1.35;
  return vec4(emission, alpha);
}

vec3 aces(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 ndc = uv * 2.0 - 1.0;

  // Camera Screen Plane Offset
  vec2 screenPlane = (ndc - vec2(u_centerX, u_centerY)) * vec2(aspect, 1.0);
  float cr = cos(u_cameraRoll);
  float sr = sin(u_cameraRoll);
  vec2 screen = vec2(
    screenPlane.x * cr - screenPlane.y * sr,
    screenPlane.x * sr + screenPlane.y * cr
  );

  float clampedPitch = clamp(u_cameraPitch + u_mouse.y * 0.15, -1.319, 1.319);
  float yaw = u_mouse.x * 0.25;
  vec3 camPos = vec3(
    sin(yaw) * cos(clampedPitch) * u_distance,
    sin(clampedPitch) * u_distance,
    cos(yaw) * cos(clampedPitch) * u_distance
  );
  vec3 forward = normalize(-camPos);
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);

  vec3 rayDir = normalize(forward * u_fov + right * screen.x + up * screen.y);

  // Critical Photon Ring
  float impactParam = length(cross(camPos, rayDir));
  float ringDist = abs(impactParam - B_CRIT);
  float ringIntensity = exp(-ringDist * ringDist / 0.00028) * 2.6 * u_photonRing;

  // Numerical Geodesic Integration
  vec3 pos = camPos;
  vec3 vel = rayDir;
  float escapeRadius = max(120.0, u_distance + 8.0);

  vec3 hit1Pos = vec3(0.0);
  vec3 hit1Vel = vec3(0.0);
  bool hasHit1 = false;

  vec3 hit2Pos = vec3(0.0);
  vec3 hit2Vel = vec3(0.0);
  bool hasHit2 = false;

  bool swallowed = false;
  bool escaped = false;

  int maxSteps = u_maxSteps;
  for (int step = 0; step < 260; step++) {
    if (step >= maxSteps) break;

    float r = length(pos);
    if (r < HORIZON * 1.004) {
      swallowed = true;
      break;
    }
    if (r > escapeRadius && dot(pos, vel) > 0.0) {
      escaped = true;
      break;
    }

    float stepSize = clamp((r - HORIZON) * 0.052, 0.010, 0.15 * max(1.0, r / 5.0));

    vec3 prevPos = pos;
    vec3 prevVel = vel;

    vec3 a0 = geodesicAcceleration(pos, vel);
    vel += a0 * (0.5 * stepSize);
    pos += vel * stepSize;
    vec3 a1 = geodesicAcceleration(pos, vel);
    vel += a1 * (0.5 * stepSize);
    vel = normalize(vel);

    if (prevPos.y * pos.y < 0.0) {
      float t = clamp(prevPos.y / (prevPos.y - pos.y), 0.0, 1.0);
      vec3 crossing = mix(prevPos, pos, t);
      float planeRadius = length(crossing.xz);
      if (planeRadius >= ISCO && planeRadius <= u_diskRadius) {
        vec3 crossingVel = normalize(mix(prevVel, vel, t));
        if (!hasHit1) {
          hit1Pos = crossing;
          hit1Vel = crossingVel;
          hasHit1 = true;
        } else if (!hasHit2) {
          hit2Pos = crossing;
          hit2Vel = crossingVel;
          hasHit2 = true;
        }
      }
    }
  }

  vec3 finalColor = vec3(0.0);
  if (!swallowed && escaped) {
    finalColor = renderStars(vel);
  }

  // Composite back disk first (gravitationally lensed upper arc)
  if (hasHit2) {
    vec4 d2 = shadeDisk(hit2Pos, hit2Vel, 1.0);
    finalColor = d2.rgb * d2.a * 1.35 + finalColor * (1.0 - d2.a);
  }

  // Composite front disk second
  if (hasHit1) {
    vec4 d1 = shadeDisk(hit1Pos, hit1Vel, -1.0);
    finalColor = d1.rgb * d1.a * 1.35 + finalColor * (1.0 - d1.a);
  }

  // Add razor-sharp photon ring & soft corona
  if (!swallowed || ringDist < 0.02) {
    finalColor += vec3(ringIntensity);
  }
  float bNorm = abs(impactParam - B_CRIT);
  float corona = exp(-bNorm * 3.5) * 0.18 * u_coronaGlow;
  finalColor += vec3(corona);

  // ACES Filmic Tone Mapping
  vec3 color = aces(finalColor * 1.15);

  // Vignette
  vec2 centered = uv - 0.5;
  float vig = 1.0 - smoothstep(0.55, 1.15, length(centered) * 1.6);
  color *= mix(1.0 - u_vignette * 0.65, 1.0, vig);

  // Gamma Correction
  color = pow(color, vec3(1.0 / 2.2));

  // Saturation / Monochrome Conversion
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, u_saturation);

  fragColor = vec4(color, 1.0);
}`;

// ─────────────────────────────────────────────────────────────────────────────
// React Component Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth both
 * @framerSupportedLayoutHeight both
 */
export default function OptimizedBlackHole({
  theme = "Monochrome (Hero / 21st.dev)",
  centerX = 0.88,
  centerY = 0.35,
  cameraPitch = 9.2,
  cameraRoll = -15.5,
  diskRadius = 11.5,
  diskBrightness = 0.75,
  diskSpeed = 0.75,
  turbulence = 4.46,
  dopplerStrength = 1.21,
  coronaGlow = 1.0,
  photonRing = true,
  starDensity = 1.0,
  vignette = 0.45,
  interactive = true,
  mouseSensitivity = 1.0,
  autoRotate = false,
  autoRotateSpeed = 0.25,
  responsiveOffset = true,
  quality = "High",
  pauseOffscreen = true,
  borderRadius = 0,
  style,
  className,
}: OptimizedBlackHoleProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafIdRef = React.useRef<number | null>(null);

  const mouseTargetRef = React.useRef({ x: 0, y: 0 });
  const mouseCurrentRef = React.useRef({ x: 0, y: 0 });
  const isIntersectingRef = React.useRef(true);
  const [isMobile, setIsMobile] = React.useState(false);

  const palette = THEMES[theme] || THEMES["Monochrome (Hero / 21st.dev)"];

  // Quality settings
  const dprCap = quality === "High" ? 2.0 : quality === "Balanced" ? 1.5 : 1.0;
  const maxSteps = quality === "High" ? 260 : quality === "Balanced" ? 180 : 120;

  // Responsive layout detection (Desktop hero offset vs centered mobile)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const effectiveCenterX = responsiveOffset && isMobile ? 0.0 : centerX;
  const effectiveCenterY = responsiveOffset && isMobile ? 0.0 : centerY;
  const effectiveRoll = responsiveOffset && isMobile ? 0.0 : (cameraRoll * Math.PI) / 180;
  const effectivePitch = (cameraPitch * Math.PI) / 180;

  // Mouse / Pointer Parallax Handler
  React.useEffect(() => {
    if (!interactive) return;

    const handlePointerMove = (e: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      mouseTargetRef.current = {
        x: nx * 0.45 * mouseSensitivity,
        y: -ny * 0.35 * mouseSensitivity,
      };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [interactive, mouseSensitivity]);

  // WebGL 2.0 Renderer Loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });

    // Graceful 2D Fallback for environments lacking WebGL 2.0
    if (!gl) {
      console.warn("OptimizedBlackHole: WebGL 2.0 is not supported, rendering 2D fallback.");
      const ctx2d = canvas.getContext("2d");
      if (ctx2d) {
        const w = (canvas.width = Math.max(containerRef.current?.clientWidth || 1200, 300));
        const h = (canvas.height = Math.max(containerRef.current?.clientHeight || 800, 300));
        const cx = effectiveCenterX !== 0 ? w * 0.72 : w * 0.5;
        const cy = effectiveCenterY !== 0 ? h * 0.38 : h * 0.5;
        const r = Math.min(w, h) * 0.22;

        ctx2d.fillStyle = "#000000";
        ctx2d.fillRect(0, 0, w, h);

        const glow = ctx2d.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.8);
        glow.addColorStop(0, "rgba(240, 245, 255, 0.85)");
        glow.addColorStop(0.35, "rgba(180, 190, 205, 0.45)");
        glow.addColorStop(0.7, "rgba(80, 85, 95, 0.15)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx2d.fillStyle = glow;
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, r * 2.8, 0, Math.PI * 2);
        ctx2d.fill();

        ctx2d.save();
        ctx2d.translate(cx, cy);
        ctx2d.rotate(effectiveRoll);
        ctx2d.scale(1.0, 0.28);
        const diskGlow = ctx2d.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 3.2);
        diskGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        diskGlow.addColorStop(0.2, "rgba(220, 225, 235, 0.8)");
        diskGlow.addColorStop(0.6, "rgba(140, 145, 155, 0.4)");
        diskGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx2d.fillStyle = diskGlow;
        ctx2d.beginPath();
        ctx2d.arc(0, 0, r * 3.2, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.restore();

        // Event Horizon
        ctx2d.fillStyle = "#000000";
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
        ctx2d.fill();

        // Photon Ring
        ctx2d.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, r * 0.96, 0, Math.PI * 2);
        ctx2d.stroke();
      }
      return;
    }

    // Compile Shaders
    function createShader(type: number, source: string): WebGLShader | null {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader Compile Error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program Link Error:", gl.getProgramInfoLog(program));
      return;
    }

    // Full-screen Quad Buffer
    const quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const posAttrLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posAttrLoc);
    gl.vertexAttribPointer(posAttrLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform Locations
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uCenterX = gl.getUniformLocation(program, "u_centerX");
    const uCenterY = gl.getUniformLocation(program, "u_centerY");
    const uCameraPitch = gl.getUniformLocation(program, "u_cameraPitch");
    const uCameraRoll = gl.getUniformLocation(program, "u_cameraRoll");
    const uDistance = gl.getUniformLocation(program, "u_distance");
    const uFov = gl.getUniformLocation(program, "u_fov");
    const uDiskRadius = gl.getUniformLocation(program, "u_diskRadius");
    const uDiskSpeed = gl.getUniformLocation(program, "u_diskSpeed");
    const uDiskBrightness = gl.getUniformLocation(program, "u_diskBrightness");
    const uTurbulence = gl.getUniformLocation(program, "u_turbulence");
    const uDoppler = gl.getUniformLocation(program, "u_doppler");
    const uCoronaGlow = gl.getUniformLocation(program, "u_coronaGlow");
    const uStarDensity = gl.getUniformLocation(program, "u_starDensity");
    const uVignette = gl.getUniformLocation(program, "u_vignette");
    const uSaturation = gl.getUniformLocation(program, "u_saturation");
    const uPhotonRing = gl.getUniformLocation(program, "u_photonRing");
    const uCoreCol = gl.getUniformLocation(program, "u_coreColor");
    const uInnerCol = gl.getUniformLocation(program, "u_innerColor");
    const uOuterCol = gl.getUniformLocation(program, "u_outerColor");
    const uMaxSteps = gl.getUniformLocation(program, "u_maxSteps");

    // Dynamic DPR / Canvas Resize
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = Math.max(Math.floor((rect.width || canvas.clientWidth || 1200) * dpr), 64);
      const h = Math.max(Math.floor((rect.height || canvas.clientHeight || 800) * dpr), 64);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        width = w;
        height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Pause offscreen execution
    let intersectionObserver: IntersectionObserver | null = null;
    if (pauseOffscreen && typeof IntersectionObserver !== "undefined") {
      intersectionObserver = new IntersectionObserver((entries) => {
        isIntersectingRef.current = entries[0]?.isIntersecting ?? true;
      });
      intersectionObserver.observe(canvas);
    }

    const drawScene = (timeSec: number, mouseX: number, mouseY: number) => {
      if (!gl || width <= 0 || height <= 0) return;
      gl.useProgram(program);
      gl.bindVertexArray(quadVao);

      gl.uniform2f(uRes, width, height);
      gl.uniform1f(uTime, timeSec);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.uniform1f(uCenterX, effectiveCenterX);
      gl.uniform1f(uCenterY, effectiveCenterY);
      gl.uniform1f(uCameraPitch, effectivePitch);
      gl.uniform1f(uCameraRoll, effectiveRoll);
      gl.uniform1f(uDistance, 13.5);
      gl.uniform1f(uFov, 3.0);
      gl.uniform1f(uDiskRadius, diskRadius);
      gl.uniform1f(uDiskSpeed, diskSpeed);
      gl.uniform1f(uDiskBrightness, diskBrightness);
      gl.uniform1f(uTurbulence, turbulence);
      gl.uniform1f(uDoppler, dopplerStrength);
      gl.uniform1f(uCoronaGlow, coronaGlow);
      gl.uniform1f(uStarDensity, starDensity);
      gl.uniform1f(uVignette, vignette);
      gl.uniform1f(uSaturation, palette.saturation);
      gl.uniform1f(uPhotonRing, photonRing ? 1.0 : 0.0);
      gl.uniform3fv(uCoreCol, palette.core);
      gl.uniform3fv(uInnerCol, palette.inner);
      gl.uniform3fv(uOuterCol, palette.outer);
      gl.uniform1i(uMaxSteps, maxSteps);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    // Synchronous immediate first frame render
    drawScene(0.5, 0.0, 0.0);

    // Animation Loop
    let lastTime = performance.now();
    let accumulatedTime = 0.5;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isIntersectingRef.current) {
        accumulatedTime += dt;

        // Smooth mouse lerping
        mouseCurrentRef.current.x +=
          (mouseTargetRef.current.x - mouseCurrentRef.current.x) * 0.06;
        mouseCurrentRef.current.y +=
          (mouseTargetRef.current.y - mouseCurrentRef.current.y) * 0.06;

        let curYaw = mouseCurrentRef.current.x;
        if (autoRotate) {
          curYaw += Math.sin(accumulatedTime * autoRotateSpeed) * 0.25;
        }

        drawScene(accumulatedTime, curYaw, mouseCurrentRef.current.y);
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
      gl.deleteVertexArray(quadVao);
    };
  }, [
    palette,
    effectiveCenterX,
    effectiveCenterY,
    effectivePitch,
    effectiveRoll,
    diskRadius,
    diskBrightness,
    diskSpeed,
    turbulence,
    dopplerStrength,
    coronaGlow,
    photonRing,
    starDensity,
    vignette,
    autoRotate,
    autoRotateSpeed,
    dprCap,
    maxSteps,
    pauseOffscreen,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 320,
        minHeight: 320,
        backgroundColor: "#000000",
        overflow: "hidden",
        borderRadius: `${borderRadius}px`,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          outline: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Framer Property Controls
// ─────────────────────────────────────────────────────────────────────────────

addPropertyControls(OptimizedBlackHole, {
  theme: {
    type: ControlType.Enum,
    title: "Theme",
    defaultValue: "Monochrome (Hero / 21st.dev)",
    options: [
      "Monochrome (Hero / 21st.dev)",
      "Gargantua (Gold)",
      "Cygnus X-1 (Accretion Blue)",
      "Crimson Abyss (Infrared)",
      "Cosmic Violet (Nebula)",
    ],
    displaySegmentedControl: false,
  },
  centerX: {
    type: ControlType.Number,
    title: "Center X",
    defaultValue: 0.88,
    min: -1.5,
    max: 1.5,
    step: 0.02,
    description: "Desktop horizontal offset (0 = center, 0.88 = right side hero)",
  },
  centerY: {
    type: ControlType.Number,
    title: "Center Y",
    defaultValue: 0.35,
    min: -1.5,
    max: 1.5,
    step: 0.02,
    description: "Desktop vertical offset",
  },
  responsiveOffset: {
    type: ControlType.Boolean,
    title: "Auto-Center Mobile",
    defaultValue: true,
    description: "Automatically centers the black hole on mobile viewports (< 768px)",
  },
  cameraPitch: {
    type: ControlType.Number,
    title: "Pitch (deg)",
    defaultValue: 9.2,
    min: -60,
    max: 60,
    step: 0.5,
  },
  cameraRoll: {
    type: ControlType.Number,
    title: "Roll (deg)",
    defaultValue: -15.5,
    min: -180,
    max: 180,
    step: 0.5,
  },
  diskRadius: {
    type: ControlType.Number,
    title: "Disk Radius",
    defaultValue: 11.5,
    min: 4.0,
    max: 20.0,
    step: 0.5,
  },
  diskBrightness: {
    type: ControlType.Number,
    title: "Brightness",
    defaultValue: 0.75,
    min: 0.1,
    max: 2.5,
    step: 0.05,
  },
  diskSpeed: {
    type: ControlType.Number,
    title: "Disk Speed",
    defaultValue: 0.75,
    min: 0.0,
    max: 3.0,
    step: 0.05,
  },
  turbulence: {
    type: ControlType.Number,
    title: "Turbulence",
    defaultValue: 4.46,
    min: 0.5,
    max: 8.0,
    step: 0.1,
  },
  dopplerStrength: {
    type: ControlType.Number,
    title: "Doppler Beaming",
    defaultValue: 1.21,
    min: 0.0,
    max: 3.0,
    step: 0.05,
  },
  coronaGlow: {
    type: ControlType.Number,
    title: "Corona Glow",
    defaultValue: 1.0,
    min: 0.0,
    max: 3.0,
    step: 0.1,
  },
  photonRing: {
    type: ControlType.Boolean,
    title: "Photon Ring",
    defaultValue: true,
    description: "Razor-sharp Einstein circular photon ring (b ≈ 2.598)",
  },
  starDensity: {
    type: ControlType.Number,
    title: "Stars Density",
    defaultValue: 1.0,
    min: 0.0,
    max: 2.0,
    step: 0.1,
  },
  vignette: {
    type: ControlType.Number,
    title: "Vignette",
    defaultValue: 0.45,
    min: 0.0,
    max: 1.0,
    step: 0.05,
  },
  interactive: {
    type: ControlType.Boolean,
    title: "Mouse Parallax",
    defaultValue: true,
  },
  autoRotate: {
    type: ControlType.Boolean,
    title: "Auto Orbit",
    defaultValue: false,
  },
  quality: {
    type: ControlType.Enum,
    title: "Quality Preset",
    defaultValue: "High",
    options: ["High", "Balanced", "Performance"],
  },
  borderRadius: {
    type: ControlType.Number,
    title: "Corner Radius",
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
  },
});
