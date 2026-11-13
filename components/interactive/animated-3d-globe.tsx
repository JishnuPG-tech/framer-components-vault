// DotOrb — an animated point-cloud sphere for Framer.
// Thousands of dots sit on a sphere and slide across its surface, driven by
// 3D noise, while additive blending makes the edges glow.
//
// Requires: three (Framer resolves the bare "three" import from npm).

import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as THREE from "three"

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

const DEFAULTS = {
    colors: {
        dark: "#00331C",
        mid: "#00A85A",
        bright: "#00FF88",
        bands: 1,
        shiftSpeed: 0,
        intensity: 0.85,
    },
    background: "rgba(0, 0, 0, 0)",
    halo: { color: "#00FF88", opacity: 0.08, size: 60 },
    dots: {
        density: 40,
        mobileDensity: 26,
        size: 2.6,
        sizeVariation: 0.3,
        softness: 0.6,
        depthFade: 0,
        shape: "circle" as "circle" | "square",
    },
    shape: { scale: 0.9, tilt: 0, blend: "additive" as "additive" | "normal" },
    motion: {
        rotationSpeed: 0.2,
        flowStrength: 0.4,
        flowScale: 1,
        flowSpeed: 1,
        animateInEditor: true,
        respectReducedMotion: true,
    },
    interaction: { followPointer: true, tiltAmount: 15, smoothing: 0.06 },
    performance: { maxPixelRatio: 2, pauseOffscreen: true },
}

type Props = {
    colors?: Partial<typeof DEFAULTS.colors>
    background?: string
    halo?: Partial<typeof DEFAULTS.halo>
    dots?: Partial<typeof DEFAULTS.dots>
    shape?: Partial<typeof DEFAULTS.shape>
    motion?: Partial<typeof DEFAULTS.motion>
    interaction?: Partial<typeof DEFAULTS.interaction>
    performance?: Partial<typeof DEFAULTS.performance>
    style?: React.CSSProperties
}

function resolveProps(p: Props) {
    return {
        colors: { ...DEFAULTS.colors, ...p.colors },
        background: p.background ?? DEFAULTS.background,
        halo: { ...DEFAULTS.halo, ...p.halo },
        dots: { ...DEFAULTS.dots, ...p.dots },
        shape: { ...DEFAULTS.shape, ...p.shape },
        motion: { ...DEFAULTS.motion, ...p.motion },
        interaction: { ...DEFAULTS.interaction, ...p.interaction },
        performance: { ...DEFAULTS.performance, ...p.performance },
    }
}

/* ------------------------------------------------------------------ */
/* Color parsing — handles hex, rgb(a), hsl and Framer color tokens    */
/* ------------------------------------------------------------------ */

let colorCtx: CanvasRenderingContext2D | null = null

function toRGB(input: string | undefined): [number, number, number] {
    let str = input || "#000000"
    // Framer tokens look like: var(--token-xxxx, rgb(0, 255, 136))
    const token = str.match(/^var\([^,]+,\s*(.+)\)\s*$/)
    if (token) str = token[1]
    if (!colorCtx) colorCtx = document.createElement("canvas").getContext("2d")
    if (!colorCtx) return [0, 0, 0]
    colorCtx.fillStyle = "#000000"
    colorCtx.fillStyle = str
    const v = String(colorCtx.fillStyle)
    if (v.startsWith("#")) {
        const n = parseInt(v.slice(1, 7), 16)
        return [
            ((n >> 16) & 255) / 255,
            ((n >> 8) & 255) / 255,
            (n & 255) / 255,
        ]
    }
    const nums = v.match(/[\d.]+/g) || ["0", "0", "0"]
    return [Number(nums[0]) / 255, Number(nums[1]) / 255, Number(nums[2]) / 255]
}

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

// 3D simplex noise by Ashima Arts / Stefan Gustavson (MIT license).
const SIMPLEX_NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uFlowStrength;
uniform float uFlowScale;
uniform float uRadius;
uniform float uSize;
uniform float uSizeVariation;
uniform float uPixelRatio;
uniform float uCamDist;
uniform float uBands;
uniform float uShift;
uniform vec3 uDark;
uniform vec3 uMid;
uniform vec3 uBright;

attribute float aSeed;

varying vec3 vColor;
varying float vFacing;

${SIMPLEX_NOISE}

// Cycles dark -> mid -> bright -> mid -> dark so the bands loop seamlessly.
vec3 palette(float t) {
  t = fract(t) * 4.0;
  if (t < 1.0) return mix(uDark, uMid, t);
  if (t < 2.0) return mix(uMid, uBright, t - 1.0);
  if (t < 3.0) return mix(uBright, uMid, t - 2.0);
  return mix(uMid, uDark, t - 3.0);
}

void main() {
  vec3 p = position;

  // Push each dot by a smoothly changing noise value...
  float n = snoise(vec3(p.x * 0.6, p.y * 0.4, p.z * 0.2) * uFlowScale
                 + vec3(0.2, 0.3, 0.2) * uTime);
  p += n * uFlowStrength;
  // ...then snap it back onto the sphere, so dots slide across the surface.
  p = p / max(length(p), 0.0001) * uRadius;

  float band = (p.x + p.y + p.z) / max(uRadius, 0.0001) * 0.5 * uBands + 0.5 + uShift;
  vColor = palette(band);

  vec3 viewNormal = normalize(normalMatrix * p);
  vFacing = viewNormal.z * 0.5 + 0.5; // 1 = facing camera, 0 = far side

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float variation = (aSeed * 2.0 - 1.0) * 0.5 + n * 0.5;
  float size = uSize * (1.0 + variation * uSizeVariation);
  gl_PointSize = max(size, 0.5) * uPixelRatio * (uCamDist / -mvPosition.z);
}
`

const FRAGMENT_SHADER = /* glsl */ `
uniform float uOpacity;
uniform float uSoftness;
uniform float uDepthFade;
uniform float uSquare;

varying vec3 vColor;
varying float vFacing;

void main() {
  vec2 q = abs(gl_PointCoord - 0.5) * 2.0;
  float d = mix(length(q), max(q.x, q.y), uSquare);
  if (d > 1.0) discard;
  float alpha = 1.0 - smoothstep(1.0 - uSoftness, 1.0, d);
  alpha *= 1.0 - uDepthFade * (1.0 - vFacing);
  gl_FragColor = vec4(vColor, alpha * uOpacity);
}
`

/* ------------------------------------------------------------------ */
/* Geometry — unique points on a subdivided icosphere                  */
/* ------------------------------------------------------------------ */

function buildGeometry(detail: number): THREE.BufferGeometry {
    const ico = new THREE.IcosahedronGeometry(
        1,
        Math.max(1, Math.round(detail))
    )
    const src = ico.attributes.position.array as ArrayLike<number>
    const seen = new Set<string>()
    const positions: number[] = []
    for (let i = 0; i < src.length; i += 3) {
        const x = src[i],
            y = src[i + 1],
            z = src[i + 2]
        const key = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`
        if (seen.has(key)) continue
        seen.add(key)
        positions.push(x, y, z)
    }
    ico.dispose()

    const count = positions.length / 3
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) seeds[i] = Math.random()

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
    )
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))
    return geometry
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const FOV = 45
const DEG = Math.PI / 180

/* ------------------------------------------------------------------ */
/* Static fallback (no WebGL): used for exports, thumbnails and SSR     */
/* ------------------------------------------------------------------ */

function StaticOrb(props: {
    dark: string
    mid: string
    bright: string
    scale: number
    intensity: number
    dotSize: number
}) {
    const { dark, mid, bright, scale, intensity, dotSize } = props
    const size = `calc(min(100cqw, 100cqh) * ${scale})`
    const grid = Math.max(6, Math.round(dotSize * 3.2))
    const dot = Math.max(0.8, dotSize * 0.4)
    const wrapper = {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        containerType: "size",
        pointerEvents: "none",
    } as React.CSSProperties
    const fill = { position: "absolute", inset: 0 } as const
    return (
        <div style={wrapper}>
            <div
                style={{
                    position: "relative",
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    overflow: "hidden",
                    opacity: intensity,
                }}
            >
                {/* soft depth in the middle */}
                <div
                    style={{
                        ...fill,
                        opacity: 0.3,
                        backgroundImage: `radial-gradient(circle at 50% 50%, ${dark} 0%, transparent 70%)`,
                    }}
                />
                {/* bright rim, like the live orb's glowing edge */}
                <div
                    style={{
                        ...fill,
                        opacity: 0.7,
                        backgroundImage: `radial-gradient(circle at 50% 50%, transparent 62%, ${bright} 100%)`,
                    }}
                />
                {/* dot grid, fading toward the middle */}
                <div
                    style={{
                        ...fill,
                        backgroundImage: `radial-gradient(circle at center, ${mid} 0, ${mid} ${dot}px, transparent ${dot + 0.5}px)`,
                        backgroundSize: `${grid}px ${grid}px`,
                        WebkitMaskImage:
                            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,1) 85%)",
                        maskImage:
                            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,1) 85%)",
                    }}
                />
            </div>
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 * @framerDisableUnlink
 */
export default function DotOrb(props: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const hostRef = useRef<HTMLDivElement>(null)
    const propsRef = useRef(resolveProps(props))
    propsRef.current = resolveProps(props)
    const apiRef = useRef<{ refresh: () => void } | null>(null)

    const isEditor = RenderTarget.current() === RenderTarget.canvas
    const p = propsRef.current
    const isStatic = useIsStaticRenderer()

    // Pointer tracking is scoped to this component's own element.
    const pointerRef = useRef<{
        x: number
        y: number
        timer: ReturnType<typeof setTimeout> | null
    }>({ x: 0, y: 0, timer: null })
    const followPointer = p.interaction.followPointer && !isStatic

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === "touch") return
        const el = containerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const state = pointerRef.current
        const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
        const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
        state.x = Math.max(-1, Math.min(1, nx))
        state.y = Math.max(-1, Math.min(1, ny))
        if (state.timer) {
            clearTimeout(state.timer)
            state.timer = null
        }
    }

    // Ease back to neutral a moment after the pointer leaves the component.
    const onPointerLeave = () => {
        const state = pointerRef.current
        if (state.timer) clearTimeout(state.timer)
        state.timer = setTimeout(() => {
            state.x = 0
            state.y = 0
            state.timer = null
        }, 1500)
    }

    useEffect(() => {
        return () => {
            const state = pointerRef.current
            if (state.timer) clearTimeout(state.timer)
        }
    }, [])

    useEffect(() => {
        if (isStatic) return
        const container = containerRef.current
        const host = hostRef.current
        if (!container || !host) return

        let renderer: THREE.WebGLRenderer
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        } catch {
            return // WebGL unavailable: the halo and background still show
        }
        renderer.setClearColor(0x000000, 0)
        renderer.domElement.style.display = "block"
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        host.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
        const tiltGroup = new THREE.Group()
        scene.add(tiltGroup)

        const uniforms = {
            uTime: { value: 0 },
            uFlowStrength: { value: 0.4 },
            uFlowScale: { value: 1 },
            uRadius: { value: 0.9 },
            uSize: { value: 2 },
            uSizeVariation: { value: 0.3 },
            uPixelRatio: { value: 1 },
            uCamDist: { value: 3 },
            uBands: { value: 1 },
            uShift: { value: 0 },
            uDark: { value: new THREE.Vector3() },
            uMid: { value: new THREE.Vector3() },
            uBright: { value: new THREE.Vector3() },
            uOpacity: { value: 0.5 },
            uSoftness: { value: 0.6 },
            uDepthFade: { value: 0 },
            uSquare: { value: 0 },
        }

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })

        let currentDetail = -1
        let geometry: THREE.BufferGeometry | null = null
        const points = new THREE.Points(new THREE.BufferGeometry(), material)
        points.frustumCulled = false
        tiltGroup.add(points)

        // Animation state, accumulated so speed changes never cause jumps.
        let time = 0
        let shift = 0
        let spin = 0
        let tiltX = 0
        let tiltY = 0
        let width = 1
        let height = 1
        let visible = true
        let rafId = 0
        let lastFrame = 0

        const reducedMotionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )

        const resize = () => {
            const rect = container.getBoundingClientRect()
            width = Math.max(1, rect.width)
            height = Math.max(1, rect.height)
            const pr = Math.min(
                window.devicePixelRatio || 1,
                propsRef.current.performance.maxPixelRatio
            )
            renderer.setPixelRatio(pr)
            renderer.setSize(width, height, false)
            camera.aspect = width / height
            // Distance at which a sphere of radius 1 exactly fits the frame.
            const fit = 1 / Math.sin((FOV / 2) * DEG)
            camera.position.z = camera.aspect < 1 ? fit / camera.aspect : fit
            camera.updateProjectionMatrix()
            uniforms.uPixelRatio.value = pr
            uniforms.uCamDist.value = camera.position.z
        }

        const draw = (dt: number) => {
            const o = propsRef.current

            // Rebuild geometry when density changes (lighter on small frames).
            const detail = width < 600 ? o.dots.mobileDensity : o.dots.density
            if (Math.round(detail) !== currentDetail) {
                currentDetail = Math.round(detail)
                geometry?.dispose()
                geometry = buildGeometry(currentDetail)
                points.geometry = geometry
            }

            time += dt * o.motion.flowSpeed
            shift += dt * o.colors.shiftSpeed
            spin += dt * o.motion.rotationSpeed
            points.rotation.y = spin

            const tiltMax = o.interaction.followPointer
                ? o.interaction.tiltAmount * DEG
                : 0
            const ease =
                dt > 0 ? 1 - Math.pow(1 - o.interaction.smoothing, dt * 60) : 1
            tiltX += (pointerRef.current.y * tiltMax - tiltX) * ease
            tiltY += (pointerRef.current.x * tiltMax - tiltY) * ease
            tiltGroup.rotation.set(tiltX, tiltY, o.shape.tilt * DEG)

            const [dr, dg, db] = toRGB(o.colors.dark)
            const [mr, mg, mb] = toRGB(o.colors.mid)
            const [br, bg, bb] = toRGB(o.colors.bright)
            uniforms.uDark.value.set(dr, dg, db)
            uniforms.uMid.value.set(mr, mg, mb)
            uniforms.uBright.value.set(br, bg, bb)

            uniforms.uTime.value = time
            uniforms.uShift.value = shift
            uniforms.uBands.value = o.colors.bands
            uniforms.uOpacity.value = o.colors.intensity
            uniforms.uFlowStrength.value = o.motion.flowStrength
            uniforms.uFlowScale.value = o.motion.flowScale
            uniforms.uRadius.value = o.shape.scale
            uniforms.uSize.value = o.dots.size
            uniforms.uSizeVariation.value = o.dots.sizeVariation
            uniforms.uSoftness.value = Math.max(0.02, o.dots.softness)
            uniforms.uDepthFade.value = o.dots.depthFade
            uniforms.uSquare.value = o.dots.shape === "square" ? 1 : 0

            const blending =
                o.shape.blend === "normal"
                    ? THREE.NormalBlending
                    : THREE.AdditiveBlending
            if (material.blending !== blending) {
                material.blending = blending
                material.needsUpdate = true
            }

            renderer.render(scene, camera)
        }

        const shouldAnimate = () => {
            const o = propsRef.current
            if (isEditor && !o.motion.animateInEditor) return false
            if (o.motion.respectReducedMotion && reducedMotionQuery.matches)
                return false
            if (o.performance.pauseOffscreen && !visible) return false
            return true
        }

        const loop = (now: number) => {
            const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0
            lastFrame = now
            draw(dt)
            rafId = requestAnimationFrame(loop)
        }

        const refresh = () => {
            if (shouldAnimate()) {
                if (!rafId) {
                    lastFrame = 0
                    rafId = requestAnimationFrame(loop)
                }
            } else {
                if (rafId) cancelAnimationFrame(rafId)
                rafId = 0
                draw(0) // still show an up-to-date static frame
            }
        }
        apiRef.current = { refresh }

        const resizeObserver = new ResizeObserver(() => {
            resize()
            if (!rafId) draw(0)
        })
        resizeObserver.observe(container)

        const intersectionObserver = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting
            refresh()
        })
        intersectionObserver.observe(container)

        reducedMotionQuery.addEventListener("change", refresh)

        resize()
        refresh()

        return () => {
            if (rafId) cancelAnimationFrame(rafId)
            apiRef.current = null
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            reducedMotionQuery.removeEventListener("change", refresh)
            geometry?.dispose()
            material.dispose()
            renderer.dispose()
            renderer.domElement.remove()
        }
    }, [isStatic])

    // Re-render a static frame or restart the loop whenever a prop changes.
    useEffect(() => {
        apiRef.current?.refresh()
    })

    return (
        <div
            ref={containerRef}
            aria-hidden
            onPointerMove={followPointer ? onPointerMove : undefined}
            onPointerLeave={followPointer ? onPointerLeave : undefined}
            style={{
                ...props.style,
                position: "relative",
                overflow: "hidden",
                background: p.background,
                pointerEvents: followPointer ? "auto" : "none",
            }}
        >
            {p.halo.opacity > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: p.halo.opacity,
                        background: `radial-gradient(circle at center, ${p.halo.color} 0%, transparent ${p.halo.size}%)`,
                    }}
                />
            )}
            {isStatic && (
                <StaticOrb
                    dark={p.colors.dark}
                    mid={p.colors.mid}
                    bright={p.colors.bright}
                    scale={p.shape.scale}
                    intensity={p.colors.intensity}
                    dotSize={p.dots.size}
                />
            )}
            <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
        </div>
    )
}

DotOrb.displayName = "Dot Orb"

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(DotOrb, {
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            dark: {
                type: ControlType.Color,
                title: "Dark",
                defaultValue: DEFAULTS.colors.dark,
            },
            mid: {
                type: ControlType.Color,
                title: "Mid",
                defaultValue: DEFAULTS.colors.mid,
            },
            bright: {
                type: ControlType.Color,
                title: "Bright",
                defaultValue: DEFAULTS.colors.bright,
            },
            bands: {
                type: ControlType.Number,
                title: "Bands",
                min: 0,
                max: 4,
                step: 0.05,
                defaultValue: DEFAULTS.colors.bands,
                description:
                    "How many color stripes wrap the sphere. 0 = one solid color.",
            },
            shiftSpeed: {
                type: ControlType.Number,
                title: "Color Flow",
                min: -1,
                max: 1,
                step: 0.01,
                defaultValue: DEFAULTS.colors.shiftSpeed,
                description: "Moves the color stripes over time.",
            },
            intensity: {
                type: ControlType.Number,
                title: "Brightness",
                min: 0.01,
                max: 1,
                step: 0.01,
                defaultValue: DEFAULTS.colors.intensity,
            },
        },
    },
    halo: {
        type: ControlType.Object,
        title: "Halo",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: DEFAULTS.halo.color,
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: DEFAULTS.halo.opacity,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: DEFAULTS.halo.size,
            },
        },
    },
    dots: {
        type: ControlType.Object,
        title: "Dots",
        controls: {
            density: {
                type: ControlType.Number,
                title: "Density",
                min: 8,
                max: 80,
                step: 1,
                defaultValue: DEFAULTS.dots.density,
                description:
                    "40 ≈ 17k dots. Higher looks finer but costs more.",
            },
            mobileDensity: {
                type: ControlType.Number,
                title: "Small Density",
                min: 8,
                max: 80,
                step: 1,
                defaultValue: DEFAULTS.dots.mobileDensity,
                description: "Used when the orb is narrower than 600px.",
            },
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["circle", "square"],
                optionTitles: ["Circle", "Square"],
                displaySegmentedControl: true,
                defaultValue: DEFAULTS.dots.shape,
                description: "Square dots give a crisp, pixel-like look.",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 0.5,
                max: 10,
                step: 0.1,
                unit: "px",
                defaultValue: DEFAULTS.dots.size,
            },
            sizeVariation: {
                type: ControlType.Number,
                title: "Variation",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: DEFAULTS.dots.sizeVariation,
            },
            softness: {
                type: ControlType.Number,
                title: "Softness",
                min: 0.02,
                max: 1,
                step: 0.01,
                defaultValue: DEFAULTS.dots.softness,
                description: "Low = crisp dots, high = soft glowing dots.",
            },
            depthFade: {
                type: ControlType.Number,
                title: "Back Fade",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: DEFAULTS.dots.depthFade,
                description: "Dims dots on the far side for more depth.",
            },
        },
    },
    shape: {
        type: ControlType.Object,
        title: "Shape",
        controls: {
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0.1,
                max: 1.6,
                step: 0.01,
                defaultValue: DEFAULTS.shape.scale,
                description: "1 = sphere touches the frame edges.",
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: -90,
                max: 90,
                step: 1,
                unit: "°",
                defaultValue: DEFAULTS.shape.tilt,
            },
            blend: {
                type: ControlType.Enum,
                title: "Blend",
                options: ["additive", "normal"],
                optionTitles: ["Glow", "Normal"],
                displaySegmentedControl: true,
                defaultValue: DEFAULTS.shape.blend,
                description:
                    "Glow for dark backgrounds, Normal for light ones.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            rotationSpeed: {
                type: ControlType.Number,
                title: "Spin",
                min: -2,
                max: 2,
                step: 0.01,
                defaultValue: DEFAULTS.motion.rotationSpeed,
            },
            flowStrength: {
                type: ControlType.Number,
                title: "Flow",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: DEFAULTS.motion.flowStrength,
                description: "How far dots drift across the surface.",
            },
            flowScale: {
                type: ControlType.Number,
                title: "Flow Detail",
                min: 0.1,
                max: 5,
                step: 0.05,
                defaultValue: DEFAULTS.motion.flowScale,
                description: "Higher = smaller, busier swirls.",
            },
            flowSpeed: {
                type: ControlType.Number,
                title: "Flow Speed",
                min: 0,
                max: 3,
                step: 0.01,
                defaultValue: DEFAULTS.motion.flowSpeed,
            },
            animateInEditor: {
                type: ControlType.Boolean,
                title: "In Editor",
                enabledTitle: "Animate",
                disabledTitle: "Still",
                defaultValue: DEFAULTS.motion.animateInEditor,
            },
            respectReducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced Motion",
                enabledTitle: "Respect",
                disabledTitle: "Ignore",
                defaultValue: DEFAULTS.motion.respectReducedMotion,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Pointer",
        controls: {
            followPointer: {
                type: ControlType.Boolean,
                title: "Follow",
                defaultValue: DEFAULTS.interaction.followPointer,
            },
            tiltAmount: {
                type: ControlType.Number,
                title: "Amount",
                min: 0,
                max: 60,
                step: 1,
                unit: "°",
                defaultValue: DEFAULTS.interaction.tiltAmount,
                hidden: (o: any) => !o.followPointer,
            },
            smoothing: {
                type: ControlType.Number,
                title: "Response",
                min: 0.01,
                max: 0.3,
                step: 0.01,
                defaultValue: DEFAULTS.interaction.smoothing,
                description: "Low = slow and floaty, high = snappy.",
                hidden: (o: any) => !o.followPointer,
            },
        },
    },
    performance: {
        type: ControlType.Object,
        title: "Performance",
        controls: {
            maxPixelRatio: {
                type: ControlType.Number,
                title: "Max DPR",
                min: 1,
                max: 3,
                step: 0.5,
                defaultValue: DEFAULTS.performance.maxPixelRatio,
            },
            pauseOffscreen: {
                type: ControlType.Boolean,
                title: "Offscreen",
                enabledTitle: "Pause",
                disabledTitle: "Run",
                defaultValue: DEFAULTS.performance.pauseOffscreen,
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: DEFAULTS.background,
        description: "[More Components](https://framer.link/OwYNKli)",
    },
})
