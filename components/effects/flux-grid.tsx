/**
 * FluxGrid â€” Interactive 3D rod grid background for Framer
 * =============================================================
 *
 * PERFORMANCE STRATEGY (read me before modifying)
 * -----------------------------------------------
 * This component renders thousands of rods at 60fps on high-DPI
 * displays. That is only possible because of these choices:
 *
 * 1. InstancedMesh â€” the entire grid is exactly TWO draw calls
 *    (one for rods, one for cap tips), regardless of grid density.
 *
 * 2. Zero React state in the animation loop â€” pointer position,
 *    spring velocities and displacements live in refs and
 *    pre-allocated Float32Arrays. Nothing in useFrame re-renders.
 *
 * 3. Unlit custom shaders â€” no lights, no specular, no Fresnel.
 *    Cheap per-fragment and immune to grazing-angle highlight
 *    artifacts on thin vertical geometry.
 *
 * 4. Frustum-fitted grid â€” the field is sized from the camera's
 *    actual ground footprint at the current aspect ratio and angle,
 *    so rods always fill the frame with no wasted off-screen
 *    instances, and a distance fade hides the far boundary at
 *    tilted angles instead of rendering rods "to infinity".
 *
 * The loop also early-exits when the component is off-screen or the
 * tab is hidden (IntersectionObserver + visibilitychange).
 */

import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Standard npm imports, pinned to the versions this component was
// built against. React itself stays external so the component shares
// Framer's own React instance.
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Public props â€” mirrored 1:1 by the Framer property controls below. */
export interface FluxGridProps {
    canvasBG: string
    tipCapColor: string
    tipCapGlow: number
    tipCapSize: number
    density: number
    rodHeight: number
    rodWidth: number
    hoverRadius: number
    repulsionForce: number
    waveIntensity: number
    mouseSnap: number
    dampingRatio: number
    fadeStrength: number
    cameraAngle: number
    vignetteEffect: boolean
    vignetteStart: number
    vignetteEnd: number
    vignetteColor: string
    showHUD: boolean
    rodColor1: string
    rodColor2: string
    rodColor3: string
    rodColor4: string
    style?: React.CSSProperties
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Distance from the camera to the center of the field. */
const CAMERA_DISTANCE = 11.2

/**
 * Fixed screen scale: how many pixels one world unit occupies.
 * Because the FOV is derived from the component's pixel height using
 * this constant, rods keep the exact same on-screen size at any
 * component/viewport size â€” a bigger component simply reveals more
 * field instead of scaling the scene up.
 */
const PIXELS_PER_UNIT = 52.3

/** Vertical FOV (degrees) that shows `heightPx / PIXELS_PER_UNIT` world units. */
function fovForHeight(heightPx: number): number {
    const worldH = Math.max(heightPx, 50) / PIXELS_PER_UNIT
    const fov =
        2 * THREE.MathUtils.radToDeg(Math.atan(worldH / (2 * CAMERA_DISTANCE)))
    return THREE.MathUtils.clamp(fov, 5, 110)
}

/** Hard cap on ground-hit distance for near-horizontal frustum rays. */
const MAX_RAY_DISTANCE = 30

/** Safety cap on instance count â€” gap widens if a layout exceeds it. */
const MAX_INSTANCES = 14000

/** Fraction of the rod (from the bottom) that fades to transparency. */
const FADE_HEIGHT = 0.55

/* ------------------------------------------------------------------ */
/*  Camera pose helper                                                 */
/* ------------------------------------------------------------------ */

/**
 * Camera position/target for a given elevation angle.
 * 90Â° = perpendicular top-down. A tiny horizontal offset is kept at
 * 90Â° so lookAt() never degenerates (view direction âˆ¥ up vector).
 */
function cameraPose(angleDeg: number) {
    const rad = THREE.MathUtils.degToRad(angleDeg)
    const y = CAMERA_DISTANCE * Math.sin(rad)
    const z = Math.max(CAMERA_DISTANCE * Math.cos(rad), 0.02)
    const lookZ = angleDeg >= 85 ? 0 : -0.8 * (1 - angleDeg / 90)
    return {
        position: new THREE.Vector3(0, y, z),
        target: new THREE.Vector3(0, 0, lookZ),
    }
}

/** Applies the pose to the live scene camera. */
function CameraRig({
    angleDeg,
    fallbackH,
}: {
    angleDeg: number
    fallbackH: number
}) {
    const { camera, size } = useThree()
    React.useEffect(() => {
        const pose = cameraPose(angleDeg)
        camera.position.copy(pose.position)
        camera.lookAt(pose.target)
        // Constant scale: FOV follows component height so the scene
        // never zooms when the layer or viewport is resized. On the
        // first frames of Framer's canvas editor `size.height` can
        // report 0/near-0 â€” fall back to the wrapper's measured
        // height; the size dep re-runs this the moment real
        // dimensions land.
        const h = size.height >= 4 ? size.height : fallbackH || 450
        ;(camera as any).fov = fovForHeight(h)
        camera.updateProjectionMatrix()
    }, [camera, angleDeg, size.height, fallbackH])
    return null
}

/* ------------------------------------------------------------------ */
/*  Shaders (unlit â€” see performance note in the header)               */
/* ------------------------------------------------------------------ */

const rodVertexShader = /* glsl */ `
    varying float vLocalY;
    varying vec3 vColor;
    varying float vFadeDepth;

    void main() {
        // Unit cylinder is 1 unit tall, centered on the origin:
        // remap local Y to 0 (bottom) .. 1 (tip).
        vLocalY = position.y + 0.5;

        #ifdef USE_INSTANCING_COLOR
            vColor = instanceColor;
        #else
            vColor = vec3(1.0);
        #endif

        vec4 localPos = vec4(position, 1.0);
        #ifdef USE_INSTANCING
            localPos = instanceMatrix * localPos;
        #endif
        // Fade depth is world -Z (how far INTO the scene a rod sits),
        // not radial camera distance: radial distance also grows
        // toward the left/right edges of wide frames, which made the
        // fade swallow the sides instead of just the far distance.
        vec4 worldPos = modelMatrix * localPos;
        vFadeDepth = -worldPos.z;
        vec4 mvPosition = viewMatrix * worldPos;
        gl_Position = projectionMatrix * mvPosition;
    }
`

const rodFragmentShader = /* glsl */ `
    uniform vec3 uBgColor;
    uniform float uFadeStart;   // distance fade: begins at this depth...
    uniform float uFadeEnd;     // ...fully background by this depth
    uniform float uDistFadeOn;  // fade strength, 0..1 (ramps with angle)
    varying float vLocalY;
    varying vec3 vColor;
    varying float vFadeDepth;

    void main() {
        // Every rod renders its full palette color at all times â€” no
        // hover-driven dimming or reveal. Shaft sides become visible
        // purely GEOMETRICALLY, when a rod physically pivots away
        // from the cursor and exposes its flank to the camera.

        // Alpha gradient toward the base so rods appear to float;
        // color also blends to the background, keeping the fade
        // artifact-free where semi-transparent rods overlap.
        float baseFade = smoothstep(0.0, ${FADE_HEIGHT}, vLocalY);
        vec3 col = mix(uBgColor, vColor, baseFade);
        col *= 0.82 + 0.18 * vLocalY;

        // Distance fade: far rods dissolve into the background so
        // the field never shows a hard far edge at grazing angles.
        // The band runs parallel to the horizon (world depth), so it
        // only ever eats the distance â€” never the frame's sides.
        float distKeep = 1.0 - uDistFadeOn *
            smoothstep(uFadeStart, uFadeEnd, vFadeDepth);
        col = mix(uBgColor, col, distKeep);

        float alpha = baseFade * distKeep;
        // alphaTest-style hard cutoff: fragments this faint must not
        // blend NOR write depth. Without the discard, the invisible
        // faded bases of near rods fill the depth buffer and clip
        // the rods behind them â€” which reads as background shafts
        // "slicing through" foreground geometry.
        if (alpha < 0.12) discard;
        gl_FragColor = vec4(col, alpha);
    }
`

/**
 * Tips are camera-facing 2D circles (billboards). The instance matrix
 * carries only the tip's world position; the quad is expanded in view
 * space so it always faces the camera as a perfect circle. Size comes
 * exclusively from uQuadScale â€” fully independent of rod width.
 */
const tipVertexShader = /* glsl */ `
    uniform float uQuadScale;
    uniform float uZNudge;
    varying vec2 vUv;
    varying float vFadeDepth;

    void main() {
        vUv = uv;
        vec4 origin = vec4(0.0, 0.0, 0.0, 1.0);
        #ifdef USE_INSTANCING
            origin = instanceMatrix * origin;
        #endif
        // World depth for the distance fade â€” must match the rods'
        // metric exactly or tips would outlive their fading rods.
        vec4 worldOrigin = modelMatrix * origin;
        vFadeDepth = -worldOrigin.z;
        vec4 mvPosition = viewMatrix * worldOrigin;
        // Pull the billboard toward the camera by slightly more than
        // the rod radius. Without this the quad is exactly coplanar
        // with the rod's top cap at 90Â° (z-fighting flicker) and, at
        // tilted angles, passes through the rod's axis so the rod's
        // front surface depth-clips a bite out of the circle.
        //
        // CRITICAL: the pull must happen ALONG THE EYE RAY (scaling
        // the view-space position toward the camera origin), not as
        // a plain z translation. Points on a ray through the camera
        // all project to the same pixel, so scaling keeps the tip
        // glued to its rod's axis; translating z alone changes the
        // perspective magnification and slides tips radially off
        // their rods â€” worse the farther they sit from screen center.
        mvPosition.xyz *= 1.0 - uZNudge / max(-mvPosition.z, 0.001);
        mvPosition.xy += position.xy * uQuadScale; // view-space billboard
        gl_Position = projectionMatrix * mvPosition;
    }
`

const tipFragmentShader = /* glsl */ `
    uniform vec3 uTipColor;
    uniform float uGlow;
    uniform float uCoreFrac;    // solid-disc radius as fraction of quad
    uniform float uFadeStart;
    uniform float uFadeEnd;
    uniform float uDistFadeOn;
    varying vec2 vUv;
    varying float vFadeDepth;

    void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);

        // Solid circle with an anti-aliased rim...
        float core = 1.0 - smoothstep(uCoreFrac * 0.86, uCoreFrac, r);
        // ...plus a standard soft glow halo around it.
        float halo = uGlow * pow(
            clamp((1.0 - r) / max(1.0 - uCoreFrac, 0.001), 0.0, 1.0),
            2.0
        );

        float distKeep = 1.0 - uDistFadeOn *
            smoothstep(uFadeStart, uFadeEnd, vFadeDepth);
        float alpha = clamp(core + halo * 0.85, 0.0, 1.0) * distKeep;
        // alphaTest-style cutoff â€” the tips write depth now (see the
        // material), so faint halo fragments must be discarded or
        // they would occlude tips/rods behind them.
        if (alpha < 0.12) discard;

        vec3 col = uTipColor * (1.0 + uGlow * 0.55);
        gl_FragColor = vec4(col, alpha);
    }
`

/* ------------------------------------------------------------------ */
/*  Error boundary + static fallback                                   */
/* ------------------------------------------------------------------ */

/** Static gradient shown when WebGL is unavailable or the canvas crashes. */
function GradientFallback({ color }: { color: string }) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(120% 90% at 50% 15%, ${color} 0%, #05050c 100%)`,
            }}
        />
    )
}

/**
 * Faithful static still for static render contexts (canvas, export,
 * thumbnails). Re-runs the live scene's exact camera and lattice math
 * (cameraPose, fovForHeight, frustum ground footprint, hashed
 * jitter/colors, distance-fade band) and projects the resting rod
 * field to SVG. The rod bottom fade and tip core/halo reproduce the
 * fragment shaders' exact curves via two shared object-space gradient
 * masks; rods are perspective-tapered quads. No WebGL, no animation,
 * no assets. Only deliberate deviation: the instance cap is lower
 * than the live scene's 14000 (these are DOM nodes, not GPU
 * instances), so extreme densities render slightly sparser stills.
 */
function StaticRodPreview(props: FluxGridProps) {
    const {
        canvasBG,
        density,
        rodHeight,
        rodWidth,
        cameraAngle,
        fadeStrength,
        tipCapColor,
        tipCapSize,
        tipCapGlow,
        rodColor1,
        rodColor2,
        rodColor3,
        rodColor4,
    } = props
    const W = 800
    const H = 450
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "f")

    const scene = React.useMemo(() => {
        const clamp01 = (x: number) => THREE.MathUtils.clamp(x, 0, 1)
        const smooth = (a: number, b: number, x: number) => {
            const t = clamp01((x - a) / (b - a))
            return t * t * (3 - 2 * t)
        }
        const effectiveAngle = THREE.MathUtils.clamp(cameraAngle, 40, 90)
        const pose = cameraPose(effectiveAngle)
        const cam = new THREE.PerspectiveCamera(
            fovForHeight(H),
            W / H,
            0.1,
            100
        )
        cam.position.copy(pose.position)
        cam.lookAt(pose.target)
        cam.updateMatrixWorld()

        // Frustum ground footprint - identical to the live grid memo.
        let minX = Infinity
        let maxX = -Infinity
        let minZ = Infinity
        let maxZ = -Infinity
        const v = new THREE.Vector3()
        const corners: Array<[number, number]> = [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
        ]
        for (const [cx, cy] of corners) {
            v.set(cx, cy, 0.5).unproject(cam).sub(cam.position).normalize()
            let t = MAX_RAY_DISTANCE
            if (v.y < -0.02)
                t = Math.min(-cam.position.y / v.y, MAX_RAY_DISTANCE)
            minX = Math.min(minX, cam.position.x + v.x * t)
            maxX = Math.max(maxX, cam.position.x + v.x * t)
            minZ = Math.min(minZ, cam.position.z + v.z * t)
            maxZ = Math.max(maxZ, cam.position.z + v.z * t)
        }
        const margin = 1.5
        minX -= margin
        maxX += margin
        minZ -= margin
        maxZ += margin

        const MAX_SVG_RODS = 8000
        let gap = Math.max(0.18, density)
        let startXi = Math.floor(minX / gap)
        let startZi = Math.floor(minZ / gap)
        let cols = Math.floor(maxX / gap) - startXi + 1
        let rows = Math.floor(maxZ / gap) - startZi + 1
        while (cols * rows > MAX_SVG_RODS) {
            gap *= 1.12
            startXi = Math.floor(minX / gap)
            startZi = Math.floor(minZ / gap)
            cols = Math.floor(maxX / gap) - startXi + 1
            rows = Math.floor(maxZ / gap) - startZi + 1
        }

        // Same lattice hash as the live grid - colors and height
        // jitter land on the same rods the real scene gives them.
        const hash01 = (gx: number, gz: number, seed: number) => {
            const s =
                Math.sin(gx * 12.9898 + gz * 78.233 + seed * 37.719) *
                43758.5453
            return s - Math.floor(s)
        }

        const farDepth = -(minZ + margin)
        const fadeRamp = 1 - THREE.MathUtils.smoothstep(effectiveAngle, 48, 75)
        const fadeEnd = Math.max(farDepth * (1.0 - 0.05 * fadeRamp), 0.1)
        const fadeStart = Math.min(
            farDepth * (0.95 - 0.45 * fadeRamp),
            fadeEnd - 0.25
        )
        const fadeOn = fadeRamp * fadeStrength

        // Rod mask: alpha = smoothstep(0, FADE_HEIGHT, localY) with the
        // shader's alpha < 0.12 discard as a hard cut. Sampled along
        // s = distance from the tip as a fraction of rod length.
        const rodStops: Array<[number, number]> = [
            [0, 1],
            [1 - FADE_HEIGHT, 1],
        ]
        for (let k = 1; k <= 8; k++) {
            const s = 1 - FADE_HEIGHT + (FADE_HEIGHT * k) / 8
            const a = smooth(0, FADE_HEIGHT, 1 - s)
            rodStops.push([s, a < 0.12 ? 0 : a])
        }

        // Tip mask: solid core with AA rim (coreFrac*0.86 -> coreFrac)
        // plus the quadratic glow halo - the tip shader's exact curves.
        const quadFactor = 1 + tipCapGlow * 1.8
        const coreFrac = 1 / quadFactor
        const tipStops: Array<[number, number]> = []
        for (let k = 0; k <= 12; k++) {
            const r = k / 12
            const core = 1 - smooth(coreFrac * 0.86, coreFrac, r)
            const halo =
                tipCapGlow *
                Math.pow(clamp01((1 - r) / Math.max(1 - coreFrac, 0.001)), 2)
            const a = Math.min(core + halo * 0.85, 1)
            tipStops.push([r, a < 0.12 ? 0 : a])
        }

        const bg = new THREE.Color(canvasBG)
        const palette = [rodColor1, rodColor2, rodColor3, rodColor4].map(
            (c) => new THREE.Color(c)
        )
        // Live tips render brighter with glow: uTipColor * (1 + glow*0.55)
        const tipBase = new THREE.Color(tipCapColor).multiplyScalar(
            1 + tipCapGlow * 0.55
        )
        const tipRadius = tipCapSize * 0.24
        const quadR = tipRadius * quadFactor
        const w = Math.max(rodWidth, 0.0001)
        const px = (n: number) => Math.round(n * 100) / 100

        const project = (x: number, y: number, z: number) => {
            const p = new THREE.Vector3(x, y, z).project(cam)
            return {
                x: (p.x * 0.5 + 0.5) * W,
                y: (1 - (p.y * 0.5 + 0.5)) * H,
                ndcZ: p.z,
            }
        }
        const spanPx = (x: number, y: number, z: number, worldW: number) => {
            const a = project(x - worldW / 2, y, z)
            const b = project(x + worldW / 2, y, z)
            return Math.hypot(b.x - a.x, b.y - a.y)
        }
        // Projected span along the DEPTH axis - the foreshortened
        // minor axis of a cylinder's circular end cap.
        const spanZPx = (x: number, y: number, z: number, worldW: number) => {
            const a = project(x, y, z - worldW / 2)
            const b = project(x, y, z + worldW / 2)
            return Math.hypot(b.x - a.x, b.y - a.y)
        }

        const nodes: React.ReactNode[] = []
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const gx = startXi + c
                const gz = startZi + r
                const x = gx * gap
                const z = gz * gap
                const top = project(x, 0, z)
                if (
                    top.ndcZ > 1 ||
                    top.x < -40 ||
                    top.x > W + 40 ||
                    top.y < -40 ||
                    top.y > H + 40
                )
                    continue

                const fade = smooth(fadeStart, fadeEnd, -z) * fadeOn
                if (fade >= 0.98) continue
                const distKeep = 1 - fade

                const h =
                    Math.max(rodHeight, 0.0001) *
                    (0.85 + hash01(gx, gz, 2) * 0.3)
                const colorIdx = Math.min(3, Math.floor(hash01(gx, gz, 3) * 4))

                if (rodWidth > 0 && rodHeight > 0) {
                    const end = project(x, -h, z)
                    const len = Math.hypot(end.x - top.x, end.y - top.y)
                    if (len > 0.5) {
                        const angle =
                            (Math.atan2(end.y - top.y, end.x - top.x) * 180) /
                                Math.PI -
                            90
                        const wTip = Math.max(spanPx(x, 0, z, w), 0.4)
                        const wEnd = Math.max(spanPx(x, -h, z, w), 0.3)
                        const capTip = spanZPx(x, 0, z, w) / 2
                        const capEnd = spanZPx(x, -h, z, w) / 2
                        const d =
                            "M " +
                            px(-wTip / 2) +
                            " 0 A " +
                            px(wTip / 2) +
                            " " +
                            px(capTip) +
                            " 0 0 1 " +
                            px(wTip / 2) +
                            " 0 L " +
                            px(wEnd / 2) +
                            " " +
                            px(len) +
                            " A " +
                            px(wEnd / 2) +
                            " " +
                            px(capEnd) +
                            " 0 0 1 " +
                            px(-wEnd / 2) +
                            " " +
                            px(len) +
                            " Z"
                        nodes.push(
                            <path
                                key={"a" + gx + "_" + gz}
                                transform={
                                    "translate(" +
                                    px(top.x) +
                                    " " +
                                    px(top.y) +
                                    ") rotate(" +
                                    px(angle) +
                                    ")"
                                }
                                d={d}
                                fill={palette[colorIdx]
                                    .clone()
                                    .lerp(bg, fade)
                                    .getStyle()}
                                mask={"url(#rodMask" + uid + ")"}
                                opacity={distKeep}
                            />
                        )
                    }
                }
                if (tipCapSize > 0) {
                    nodes.push(
                        <circle
                            key={"t" + gx + "_" + gz}
                            cx={px(top.x)}
                            cy={px(top.y)}
                            r={Math.max(spanPx(x, 0, z, quadR * 2) / 2, 0.3)}
                            fill={tipBase.clone().lerp(bg, fade).getStyle()}
                            mask={"url(#tipMask" + uid + ")"}
                            opacity={distKeep}
                        />
                    )
                }
            }
        }
        return { nodes, rodStops, tipStops }
    }, [
        canvasBG,
        density,
        rodHeight,
        rodWidth,
        cameraAngle,
        fadeStrength,
        tipCapColor,
        tipCapSize,
        tipCapGlow,
        rodColor1,
        rodColor2,
        rodColor3,
        rodColor4,
        uid,
    ])

    return (
        <svg
            viewBox={"0 0 " + W + " " + H}
            preserveAspectRatio="xMidYMid slice"
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                background: canvasBG,
                display: "block",
            }}
        >
            <defs>
                <linearGradient
                    id={"rodGrad" + uid}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    {scene.rodStops.map(([o, a], i) => (
                        <stop
                            key={i}
                            offset={o}
                            stopColor="#fff"
                            stopOpacity={a}
                        />
                    ))}
                </linearGradient>
                <mask id={"rodMask" + uid} maskContentUnits="objectBoundingBox">
                    <rect
                        width="1"
                        height="1"
                        fill={"url(#rodGrad" + uid + ")"}
                    />
                </mask>
                <radialGradient id={"tipGrad" + uid}>
                    {scene.tipStops.map(([o, a], i) => (
                        <stop
                            key={i}
                            offset={o}
                            stopColor="#fff"
                            stopOpacity={a}
                        />
                    ))}
                </radialGradient>
                <mask id={"tipMask" + uid} maskContentUnits="objectBoundingBox">
                    <rect
                        width="1"
                        height="1"
                        fill={"url(#tipGrad" + uid + ")"}
                    />
                </mask>
            </defs>
            {scene.nodes}
        </svg>
    )
}

interface BoundaryState {
    hasError: boolean
}

/** Catches renderer/driver crashes and swaps in the static fallback. */
class WebGLErrorBoundary extends React.Component<
    React.PropsWithChildren<{ fallbackColor: string }>,
    BoundaryState
> {
    state: BoundaryState = { hasError: false }

    static getDerivedStateFromError(): BoundaryState {
        return { hasError: true }
    }

    render() {
        if (this.state.hasError) {
            return <GradientFallback color={this.props.fallbackColor} />
        }
        return this.props.children
    }
}

/** Cheap one-time capability check so we never mount a doomed Canvas. */
function useWebGLSupport(): boolean {
    return React.useMemo(() => {
        if (typeof document === "undefined") return false
        try {
            const canvas = document.createElement("canvas")
            return !!(
                window.WebGLRenderingContext &&
                (canvas.getContext("webgl2") || canvas.getContext("webgl"))
            )
        } catch {
            return false
        }
    }, [])
}

/* ------------------------------------------------------------------ */
/*  Rod field scene                                                    */
/* ------------------------------------------------------------------ */

interface FieldProps extends FluxGridProps {
    /** Ref flipped by IntersectionObserver / visibilitychange. */
    activeRef: React.MutableRefObject<boolean>
    /** Effective camera elevation, clamped to [40, 90]. */
    effectiveAngle: number
    /** Wrapper's real pixel size (ResizeObserver, transform-immune) â€”
     *  the fallback when the R3F size reports 0 at design time. */
    fallbackSize: { width: number; height: number }
}

/**
 * The instanced rod grid. All per-frame work happens here, directly
 * against the InstancedMesh instance matrices.
 */
function RodField(props: FieldProps) {
    const {
        density,
        rodHeight,
        rodWidth,
        hoverRadius,
        repulsionForce,
        waveIntensity,
        mouseSnap,
        dampingRatio,
        fadeStrength,
        canvasBG,
        tipCapColor,
        tipCapGlow,
        tipCapSize,
        effectiveAngle,
        rodColor1,
        rodColor2,
        rodColor3,
        rodColor4,
        activeRef,
        fallbackSize,
    } = props

    const rodsRef = React.useRef<THREE.InstancedMesh>(null!)
    const tipsRef = React.useRef<THREE.InstancedMesh>(null!)
    const { size } = useThree()

    // Effective canvas dimensions, fully reactive: `size` re-renders
    // this component on every canvas resize (R3F subscription), and
    // the guards handle the 0/near-0 sizes Framer's canvas editor
    // reports on its first design-time frames â€” fall back to the
    // wrapper's ResizeObserver measurement (or the 800Ã—450 intrinsic
    // size), then rebuild automatically the moment real dimensions
    // arrive, since everything below keys off these two values.
    const effW = size.width >= 4 ? size.width : fallbackSize.width || 800
    const effH = size.height >= 4 ? size.height : fallbackSize.height || 450

    /**
     * Pointer state â€” never touches React state.
     * `current` eases toward `target` every frame while hovering;
     * on entry, `current` snaps to the entry point so the effect
     * starts exactly under the cursor instead of sweeping in from
     * off-field.
     */
    const pointer = React.useRef({
        target: new THREE.Vector3(),
        current: new THREE.Vector3(),
        active: false,
    })

    /**
     * Frustum-fitted grid layout, rebuilt when density, camera angle
     * or component aspect changes. The camera's four frustum-corner
     * rays are intersected with the ground plane; the resulting
     * footprint (plus margin) is what gets filled with rods â€” so the
     * field always covers the whole component, and nothing more.
     */
    const grid = React.useMemo(() => {
        const aspect = Math.max(effW / Math.max(effH, 1), 0.1)
        const pose = cameraPose(effectiveAngle)
        const cam = new THREE.PerspectiveCamera(
            fovForHeight(effH),
            aspect,
            0.1,
            100
        )
        cam.position.copy(pose.position)
        cam.lookAt(pose.target)
        cam.updateMatrixWorld()

        let minX = Infinity
        let maxX = -Infinity
        let minZ = Infinity
        let maxZ = -Infinity
        const corners: Array<[number, number]> = [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
        ]
        const v = new THREE.Vector3()
        for (const [cx, cy] of corners) {
            v.set(cx, cy, 0.5).unproject(cam).sub(cam.position).normalize()
            // Intersect with the ground plane (y = 0); near-horizontal
            // rays are clamped so shallow angles can't explode the box.
            let t = MAX_RAY_DISTANCE
            if (v.y < -0.02) {
                const hit = -cam.position.y / v.y
                t = Math.min(hit, MAX_RAY_DISTANCE)
            }
            const px = cam.position.x + v.x * t
            const pz = cam.position.z + v.z * t
            minX = Math.min(minX, px)
            maxX = Math.max(maxX, px)
            minZ = Math.min(minZ, pz)
            maxZ = Math.max(maxZ, pz)
        }
        const margin = 1.5
        minX -= margin
        maxX += margin
        minZ -= margin
        maxZ += margin

        // Widen the gap if this footprint would exceed the safety cap.
        // The lattice is anchored to integer multiples of the gap in
        // WORLD space (not to the footprint corner): when the camera
        // angle or component size refits the footprint, a rod keeps
        // the exact same world position â€” and therefore the same
        // hashed color / phase / jitter below â€” instead of the whole
        // field rerolling on every angle change.
        let gap = Math.max(0.18, density)
        let startXi = Math.floor(minX / gap)
        let startZi = Math.floor(minZ / gap)
        let cols = Math.floor(maxX / gap) - startXi + 1
        let rows = Math.floor(maxZ / gap) - startZi + 1
        while (cols * rows > MAX_INSTANCES) {
            gap *= 1.12
            startXi = Math.floor(minX / gap)
            startZi = Math.floor(minZ / gap)
            cols = Math.floor(maxX / gap) - startXi + 1
            rows = Math.floor(maxZ / gap) - startZi + 1
        }
        const count = cols * rows

        const baseX = new Float32Array(count)
        const baseZ = new Float32Array(count)
        const phase = new Float32Array(count)
        const heightJitter = new Float32Array(count)
        const colorIndex = new Uint8Array(count)

        // Deterministic hash on integer lattice coordinates â€” looks
        // random, but a given cell always gets the same values, so
        // grid rebuilds are visually seamless.
        const hash01 = (gx: number, gz: number, seed: number) => {
            const s =
                Math.sin(gx * 12.9898 + gz * 78.233 + seed * 37.719) *
                43758.5453
            return s - Math.floor(s)
        }

        let i = 0
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const gx = startXi + c
                const gz = startZi + r
                baseX[i] = gx * gap
                baseZ[i] = gz * gap
                phase[i] = hash01(gx, gz, 1) * Math.PI * 2
                heightJitter[i] = 0.85 + hash01(gx, gz, 2) * 0.3
                colorIndex[i] = Math.min(3, Math.floor(hash01(gx, gz, 3) * 4))
                i++
            }
        }

        // Distance-fade band in world DEPTH (-Z): a straight band
        // parallel to the far boundary that completes just before the
        // pre-margin footprint edge, so no half-faded stragglers
        // outlive the grid. Depth â€” not radial camera distance â€” is
        // the right metric: radial distance also grows toward the
        // left/right edges of wide frames, which made the fade
        // swallow the sides of the frame instead of just the far
        // distance.
        const farDepth = -(minZ + margin) // pre-margin far edge depth

        // Fade ramp driven DIRECTLY by the camera angle â€” a single
        // smoothstep over a 27Â° span, no geometric trigger, no
        // binary threshold anywhere:
        //   â‰¥ 75Â°  â†’ 0 (no fade; the whole footprint is on screen)
        //   75â€“48Â° â†’ eases in continuously, scaling both the fade
        //            STRENGTH (uDistFadeOn) and the band DEPTH below
        //   â‰¤ 48Â°  â†’ 1 (full fade hides the clamped far boundary)
        // Lowering the angle therefore stretches the fadeout in
        // gradually; raising it dissolves the fadeout just as
        // gradually â€” it never pops in or out at any angle.
        const fadeRamp = 1 - THREE.MathUtils.smoothstep(effectiveAngle, 48, 75)

        // The band eases in with the ramp too: it starts as a thin
        // strip hugging the far edge (barely visible softening) and
        // deepens toward the [0.5, 0.95] Ã— farDepth band used at
        // grazing angles â€” so lowering the camera angle grows the
        // gradient smoothly instead of dropping a half-field band in
        // at full depth on the first clamped frame.
        const fadeEnd = Math.max(farDepth * (1.0 - 0.05 * fadeRamp), 0.1)
        const fadeStart = Math.min(
            farDepth * (0.95 - 0.45 * fadeRamp),
            fadeEnd - 0.25
        )

        return {
            count,
            gap,
            baseX,
            baseZ,
            phase,
            heightJitter,
            colorIndex,
            fadeRamp,
            fadeStart,
            fadeEnd,
            // Spring state (with velocities): dispX/dispZ hold the
            // TIP's horizontal offset â€” bases never translate; the
            // offset is realized as a pivot at matrix-write time.
            // dispY is the vertical bulge lift.
            dispX: new Float32Array(count),
            dispY: new Float32Array(count),
            dispZ: new Float32Array(count),
            velX: new Float32Array(count),
            velY: new Float32Array(count),
            velZ: new Float32Array(count),
        }
    }, [density, effectiveAngle, effW, effH])

    /** Per-instance rod colors (4-way randomized palette). */
    React.useLayoutEffect(() => {
        if (!rodsRef.current) return
        const palette = [rodColor1, rodColor2, rodColor3, rodColor4].map(
            (c) => new THREE.Color(c)
        )
        for (let i = 0; i < grid.count; i++) {
            rodsRef.current.setColorAt(i, palette[grid.colorIndex[i]])
        }
        if (rodsRef.current.instanceColor) {
            rodsRef.current.instanceColor.needsUpdate = true
        }
    }, [grid, rodColor1, rodColor2, rodColor3, rodColor4])

    /** Shared uniforms (mutated in place â€” no material rebuilds). */
    const rodUniforms = React.useMemo(
        () => ({
            uBgColor: { value: new THREE.Color(canvasBG) },
            uFadeStart: { value: 12 },
            uFadeEnd: { value: 24 },
            uDistFadeOn: { value: 0 },
        }),
        []
    )
    const tipUniforms = React.useMemo(
        () => ({
            uTipColor: { value: new THREE.Color(tipCapColor) },
            uGlow: { value: tipCapGlow },
            uQuadScale: { value: 0.1 },
            uCoreFrac: { value: 0.5 },
            uZNudge: { value: 0.08 },
            uFadeStart: { value: 12 },
            uFadeEnd: { value: 24 },
            uDistFadeOn: { value: 0 },
        }),
        []
    )

    React.useEffect(() => {
        rodUniforms.uBgColor.value.set(canvasBG)
        tipUniforms.uTipColor.value.set(tipCapColor)
        tipUniforms.uGlow.value = tipCapGlow

        // Tip geometry: size driven ONLY by tipCapSize. The billboard
        // quad grows with glow so the halo has room to breathe, and
        // uCoreFrac keeps the solid circle at its intended radius.
        const tipRadius = tipCapSize * 0.24
        const quadScale = tipRadius * (1 + tipCapGlow * 1.8)
        tipUniforms.uQuadScale.value = quadScale
        tipUniforms.uCoreFrac.value =
            quadScale > 0 ? tipRadius / quadScale : 0.5

        // Depth nudge must clear the rod's front surface (one radius
        // toward the camera), plus a little slack for AA.
        tipUniforms.uZNudge.value = Math.max(rodWidth, 0) + 0.03

        // Continuous fade strength [0, 1]: the angle-driven ramp from
        // the grid memo (zero at steep angles, easing in smoothly as
        // the camera tilts down) scaled by the Distance Fade control.
        rodUniforms.uDistFadeOn.value = grid.fadeRamp * fadeStrength
        tipUniforms.uDistFadeOn.value = grid.fadeRamp * fadeStrength
        rodUniforms.uFadeStart.value = grid.fadeStart
        rodUniforms.uFadeEnd.value = grid.fadeEnd
        tipUniforms.uFadeStart.value = grid.fadeStart
        tipUniforms.uFadeEnd.value = grid.fadeEnd
    }, [
        canvasBG,
        tipCapColor,
        tipCapGlow,
        tipCapSize,
        rodWidth,
        fadeStrength,
        grid,
        rodUniforms,
        tipUniforms,
    ])

    const dummy = React.useMemo(() => new THREE.Object3D(), [])
    // Scratch vectors for the per-rod tilt â€” allocated once, reused
    // every instance every frame (zero GC pressure in the loop).
    const tiltAxis = React.useMemo(() => new THREE.Vector3(), [])
    const tipVec = React.useMemo(() => new THREE.Vector3(), [])

    /**
     * Re-initialize the instanced base matrices whenever the grid
     * layout rebuilds (canvas resize, density or angle change). The
     * animation loop rewrites matrices every frame anyway, but it
     * early-exits while off-screen/paused â€” without this pass, a
     * resize in Framer's canvas editor could leave stale matrices
     * (the old tiny/clumped layout) on screen until the next tick.
     * This snaps the field to the new bounds immediately.
     */
    React.useLayoutEffect(() => {
        const rods = rodsRef.current
        const tips = tipsRef.current
        if (!rods || !tips) return
        const w = Math.max(rodWidth, 0.0001)
        for (let i = 0; i < grid.count; i++) {
            const h = Math.max(rodHeight, 0.0001) * grid.heightJitter[i]
            dummy.quaternion.set(0, 0, 0, 1)
            dummy.position.set(grid.baseX[i], -h / 2, grid.baseZ[i])
            dummy.scale.set(w, h, w)
            dummy.updateMatrix()
            rods.setMatrixAt(i, dummy.matrix)
            dummy.position.set(grid.baseX[i], 0, grid.baseZ[i])
            dummy.scale.set(1, 1, 1)
            dummy.updateMatrix()
            tips.setMatrixAt(i, dummy.matrix)
        }
        rods.instanceMatrix.needsUpdate = true
        tips.instanceMatrix.needsUpdate = true
    }, [grid, rodHeight, rodWidth, dummy])

    /* -------------------------- animation ------------------------- */

    useFrame((state, delta) => {
        // Skip all work while off-screen / tab hidden.
        if (!activeRef.current) return

        const rods = rodsRef.current
        const tips = tipsRef.current
        if (!rods || !tips) return

        const t = state.clock.elapsedTime
        const p = pointer.current

        // Track the cursor near-1:1 (â‰ˆ0.63/frame at 60fps): just
        // enough smoothing to round off raw pointer-event jitter,
        // never enough to read as lag. The deformation is sampled
        // ONLY at the pointer's current position â€” no swept segment,
        // no ripple trail chasing the cursor; rods it has passed
        // simply spring home on their own. On re-entry `current` was
        // snapped to the entry point, so there is no sweep-in from a
        // stale position either.
        if (p.active) {
            p.current.lerp(p.target, 1 - Math.exp(-60 * Math.min(delta, 0.05)))
        }

        // Loose underdamped harmonic oscillator, unit mass, per-frame
        // units. Very low stiffness + retaining 1 âˆ’ 2Î¶Ï‰ of the
        // velocity each frame holds the damping ratio at exactly
        // Î¶ = dampingRatio (a live prop / HUD control) for ANY
        // stiffness â€” MouseSnap only changes how FAST the wobble
        // runs, the damping ratio decides how bouncy it is.
        const stiffness = 0.012 + mouseSnap * 0.03
        const dampRetain =
            1 - 2 * Math.max(dampingRatio, 0.01) * Math.sqrt(stiffness)
        const radiusSq = hoverRadius * hoverRadius

        // Deformation amplitudes (constant per frame):
        //   pushAmp â€” how far a tip is tilted outward at the cursor.
        //   liftAmp â€” peak height of the vertical bulge dome.
        const pushAmp = repulsionForce
        const liftAmp = repulsionForce * 0.45
        // Spread (Ïƒ) of the Gaussian elevation dome â€” the bell has
        // effectively reached zero right at the hover radius.
        const liftSigma = Math.max(hoverRadius * 0.45, 0.001)

        // Physical clearance clamp for the tilt (applied at matrix
        // time): the farthest a tip may lean sideways, derived from
        // the CURRENT grid gap and rod width. A tip can therefore
        // never touch or cross a neighbor's base coordinate â€” 90% of
        // the gap minus one rod diameter of slack â€” no matter how
        // hard the springs overshoot under maximum hover force.
        const maxTipReach = Math.max(
            grid.gap * 0.9 - rodWidth * 2,
            grid.gap * 0.35
        )

        const {
            count,
            baseX,
            baseZ,
            phase,
            heightJitter,
            dispX,
            dispY,
            dispZ,
            velX,
            velY,
            velZ,
        } = grid

        for (let i = 0; i < count; i++) {
            const x = baseX[i]
            const z = baseZ[i]

            // --- Wave field (two crossed sines, per-rod phase) ------
            const wave =
                Math.sin(x * 0.55 + t * 1.35 + phase[i] * 0.25) *
                Math.cos(z * 0.48 + t * 1.05) *
                waveIntensity

            // --- Mouse deformation target ---------------------------
            // IMPORTANT: tx/tz is the target horizontal offset of the
            // rod's TIP, not a translation â€” bases stay pinned to the
            // grid and the offset is realized as a base pivot at
            // matrix-write time. ty is the vertical bulge lift.
            //
            // Both use one smooth cubic decay, (1 âˆ’ d/R)Â³: zero force
            // exactly at the hover radius, growing gradually and
            // continuously as the cursor gets closer â€” never a
            // binary on/off step anywhere in the field.
            let tx = 0
            let ty = 0
            let tz = 0
            if (p.active) {
                const dx = x - p.current.x
                const dz = z - p.current.z
                const dSq = dx * dx + dz * dz
                if (dSq < radiusSq) {
                    const d = Math.sqrt(dSq) || 0.0001
                    const n = d / hoverRadius
                    // Cubic power decay â€” smooth and continuous:
                    // exactly zero at the hover radius, growing
                    // gradually and steepening as the cursor nears.
                    const fall = (1 - n) * (1 - n) * (1 - n)
                    const push = pushAmp * fall
                    tx = (dx / d) * push
                    tz = (dz / d) * push
                    // Vertical elevation: a true Gaussian bell,
                    //   elevation = maxElevation Â· e^âˆ’(d/Ïƒ)Â²
                    // Its slope is exactly ZERO at the center, so the
                    // dome crowns with a rounded, gently flat top and
                    // curves down gradually toward the edges â€” unlike
                    // linear or high-power falloffs, whose nonzero
                    // center slope reads as a sharp spike/crest.
                    const g = d / liftSigma
                    ty = liftAmp * Math.exp(-g * g)
                }
            }

            // --- Spring integration (underdamped oscillator) --------
            velX[i] = (velX[i] + (tx - dispX[i]) * stiffness) * dampRetain
            velY[i] = (velY[i] + (ty - dispY[i]) * stiffness) * dampRetain
            velZ[i] = (velZ[i] + (tz - dispZ[i]) * stiffness) * dampRetain
            dispX[i] += velX[i]
            dispY[i] += velY[i]
            dispZ[i] += velZ[i]

            // --- Write matrices (FIXED-BASE PIVOT, strict TÂ·RÂ·S) ----
            // The base of every rod stays LOCKED to its grid cell â€”
            // rods never slide across the floor. The whole repulsion
            // is realized as a rotation about the anchored base: the
            // spring's horizontal displacement is interpreted as the
            // TIP's outward offset, converted to a pivot angle
            // (sin Î¸ = offset / height). The rest tip plane sits at
            // y = 0 (+ wave + bulge lift); height grows DOWNWARD, so
            // increasing Rod Height never fake-zooms the field.
            //
            // MATRIX ORDER: updateMatrix() is Matrix4.compose(
            // position, quaternion, scale) â€” Translation Â· Rotation Â·
            // Scale, exactly. The non-uniform (w, h, w) scale is
            // applied FIRST in the rod's local frame and the rotation
            // then rigidly reorients the already-shaped cylinder, so
            // a tilted rod stays a perfectly straight cylinder â€”
            // shearing is impossible in this order. Never reverse it
            // (world-axis scaling after rotation is what shears).
            const h = Math.max(rodHeight, 0.0001) * heightJitter[i]
            const dxz = Math.sqrt(dispX[i] * dispX[i] + dispZ[i] * dispZ[i])
            // Base point: fixed grid XZ; the bulge lifts vertically.
            const baseY = wave + dispY[i] - h

            const tilted = dxz > 0.001
            if (tilted) {
                // Pivot away from the cursor: axis âŠ¥ to the tip
                // offset in the ground plane, angle chosen so the
                // tip lands exactly `reach` outward (asin). Clamped
                // twice: by maxTipReach so the tip keeps a physical
                // clearance gap from every neighbor's base (see the
                // gap-derived formula above), and by 0.9 so extreme
                // spring overshoots can't fold a rod flat.
                const reach = dxz > maxTipReach ? maxTipReach : dxz
                const ratio = Math.min(reach / h, 0.9)
                const tilt = Math.asin(ratio)
                tiltAxis.set(dispZ[i] / dxz, 0, -dispX[i] / dxz)
                dummy.quaternion.setFromAxisAngle(tiltAxis, tilt)
                // Rod center = base + rotate(0, h/2, 0).
                tipVec.set(0, h / 2, 0).applyQuaternion(dummy.quaternion)
                dummy.position.set(x + tipVec.x, baseY + tipVec.y, z + tipVec.z)
            } else {
                dummy.quaternion.set(0, 0, 0, 1)
                dummy.position.set(x, baseY + h / 2, z)
            }
            dummy.scale.set(
                Math.max(rodWidth, 0.0001),
                h,
                Math.max(rodWidth, 0.0001)
            )
            dummy.updateMatrix() // = compose(T, R, S)
            rods.setMatrixAt(i, dummy.matrix)

            // Tips ride the pivoted rod's top face so they can never
            // detach: tip = base + rotate(0, h, 0) = center + the
            // same half-height offset again. Position only â€” the
            // billboard shader sizes them.
            if (tilted) {
                dummy.position.set(
                    x + tipVec.x * 2,
                    baseY + tipVec.y * 2,
                    z + tipVec.z * 2
                )
                dummy.quaternion.set(0, 0, 0, 1)
            } else {
                dummy.position.set(x, baseY + h, z)
            }
            dummy.scale.set(1, 1, 1)
            dummy.updateMatrix()
            tips.setMatrixAt(i, dummy.matrix)
        }

        rods.instanceMatrix.needsUpdate = true
        tips.instanceMatrix.needsUpdate = true
    })

    /* ----------------------- pointer plane ------------------------ */

    const setPointer = (e: { point: THREE.Vector3 }, snap: boolean) => {
        const p = pointer.current
        p.target.set(e.point.x, 0, e.point.z)
        if (snap || !p.active) {
            // First contact: start exactly under the cursor.
            p.current.copy(p.target)
        }
        p.active = true
    }

    const rodsVisible = rodWidth > 0 && rodHeight > 0
    const tipsVisible = tipCapSize > 0

    return (
        <group>
            {/* Invisible plane at the tip plane captures pointer moves. */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                visible={false}
                onPointerEnter={(e: any) => setPointer(e, true)}
                onPointerMove={(e: any) => setPointer(e, false)}
                onPointerLeave={() => {
                    // Keep the last position; just deactivate. Rods
                    // spring home on their own â€” no sweep-out artifact.
                    pointer.current.active = false
                }}
            >
                <planeGeometry args={[400, 400]} />
            </mesh>

            {/* Rods â€” one draw call. Hidden entirely at zero size. */}
            <instancedMesh
                key={`rods-${grid.count}`}
                ref={rodsRef}
                args={[undefined, undefined, grid.count]}
                frustumCulled={false}
                visible={rodsVisible}
                renderOrder={1}
            >
                {/* Unit cylinder: radius 1, height 1, 16 radial
                    segments (visually round), CLOSED ends â€” the top
                    cap is always present, even with Tip Size at 0.
                    The bottom cap sits in the fully-faded zone. */}
                <cylinderGeometry args={[1, 1, 1, 16, 1, false]} />
                {/* depthWrite + depthTest explicitly ON: instanced
                    rods draw in instance order, not depth order â€”
                    the depth buffer (plus the shader's alpha-cutoff
                    discard) is the only thing keeping far rods from
                    blending over near ones. */}
                <shaderMaterial
                    vertexShader={rodVertexShader}
                    fragmentShader={rodFragmentShader}
                    uniforms={rodUniforms}
                    transparent
                    depthWrite={true}
                    depthTest={true}
                />
            </instancedMesh>

            {/* Tips â€” one draw call of camera-facing circles.
                Hidden entirely when Tip Size is zero. */}
            <instancedMesh
                key={`tips-${grid.count}`}
                ref={tipsRef}
                args={[undefined, undefined, grid.count]}
                frustumCulled={false}
                visible={tipsVisible}
                renderOrder={2}
            >
                <planeGeometry args={[2, 2]} />
                {/* depthWrite ON (was off): without it, tips do not
                    record their depth, so a BACKGROUND tip drawn
                    later in instance order blends straight over a
                    FOREGROUND one â€” the classic transparent-sorting
                    glitch. With depth writes + the alpha-cutoff
                    discard in the shader, near caps always win. */}
                <shaderMaterial
                    vertexShader={tipVertexShader}
                    fragmentShader={tipFragmentShader}
                    uniforms={tipUniforms}
                    transparent
                    depthWrite={true}
                    depthTest={true}
                />
            </instancedMesh>
        </group>
    )
}

/* ------------------------------------------------------------------ */
/*  Debug HUD â€” live tuning overlay (rendered only when showHUD)       */
/* ------------------------------------------------------------------ */

/* Design tokens lifted 1:1 from the "rod-field-debug-panel-expanded"
   mockup frame in the Framer project. */
const HUD_ACCENT = "rgb(27, 122, 232)"
const HUD_TRACK = "rgba(42, 42, 53, 1)"
const HUD_LABEL = "rgb(160, 160, 171)"
const HUD_BG = "rgba(10, 10, 15, 0.88)"
const HUD_BORDER = "1px solid rgba(32, 32, 40, 1)"
const HUD_SHADOW = "0px 16px 32px 0px rgba(0, 0, 0, 0.75)"
const HUD_FONT =
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const HUD_EASE = "cubic-bezier(0.4, 0, 0.2, 1)"

interface HudItem {
    key: keyof FluxGridProps
    label: string
    min?: number
    max?: number
    step?: number
    /** Render as a checkbox instead of a slider. */
    bool?: boolean
    /** Render as a color swatch picker. */
    color?: boolean
    /** Color picker with an extra alpha slider (kept in rgba). */
    alpha?: boolean
}

/**
 * Every entry binds to a REAL prop of the component â€” the exact same
 * values the grid memo, useFrame loop and shader uniforms read â€” so
 * a HUD tweak is indistinguishable from changing the Framer panel.
 */
const HUD_SECTIONS: Array<{ title: string; items: HudItem[] }> = [
    {
        title: "Geometry Field",
        items: [
            {
                key: "density",
                label: "Density",
                min: 0.2,
                max: 1.2,
                step: 0.02,
            },
            {
                key: "rodHeight",
                label: "Rod Height",
                min: 0,
                max: 4,
                step: 0.05,
            },
            {
                key: "rodWidth",
                label: "Rod Width",
                min: 0,
                max: 0.2,
                step: 0.005,
            },
            {
                key: "tipCapGlow",
                label: "Tip Glow",
                min: 0,
                max: 1,
                step: 0.01,
            },
            {
                key: "tipCapSize",
                label: "Tip Size",
                min: 0,
                max: 1,
                step: 0.01,
            },
        ],
    },
    {
        title: "Colors",
        items: [
            { key: "canvasBG", label: "Canvas BG", color: true },
            { key: "rodColor1", label: "Rod Color 1", color: true },
            { key: "rodColor2", label: "Rod Color 2", color: true },
            { key: "rodColor3", label: "Rod Color 3", color: true },
            { key: "rodColor4", label: "Rod Color 4", color: true },
            { key: "tipCapColor", label: "Tip Color", color: true },
            {
                key: "vignetteColor",
                label: "Vignette Color",
                color: true,
                alpha: true,
            },
        ],
    },
    {
        title: "Camera & Fade",
        items: [
            { key: "vignetteEffect", label: "Vignette", bool: true },
            {
                key: "vignetteStart",
                label: "Vignette Start",
                min: 0,
                max: 0.95,
                step: 0.01,
            },
            {
                key: "vignetteEnd",
                label: "Vignette End",
                min: 0.05,
                max: 1,
                step: 0.01,
            },
            {
                key: "cameraAngle",
                label: "Camera Angle",
                min: 40,
                max: 90,
                step: 1,
            },
            {
                key: "fadeStrength",
                label: "Distance Fade",
                min: 0,
                max: 1,
                step: 0.01,
            },
        ],
    },
    {
        title: "Kinetics & Physics",
        items: [
            {
                key: "waveIntensity",
                label: "Wave Intensity",
                min: 0,
                max: 1.5,
                step: 0.01,
            },
            {
                key: "mouseSnap",
                label: "Mouse Snap",
                min: 0.05,
                max: 1,
                step: 0.01,
            },
            {
                key: "dampingRatio",
                label: "Damping",
                min: 0.02,
                max: 1,
                step: 0.01,
            },
        ],
    },
    {
        title: "Hover Field",
        items: [
            {
                key: "hoverRadius",
                label: "Hover Radius",
                min: 0.5,
                max: 6,
                step: 0.1,
            },
            {
                key: "repulsionForce",
                label: "Repulsion",
                min: 0,
                max: 4,
                step: 0.05,
            },
        ],
    },
]

/* ---- color helpers (HUD only) ------------------------------------ */

/** Any CSS color (#rgb/#rrggbb/#rrggbbaa/rgb()/rgba()) â†’ "#rrggbb". */
function colorToHex(c: string): string {
    const s = (c || "").trim()
    if (s.startsWith("#")) {
        if (s.length === 4) return "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]
        return s.slice(0, 7)
    }
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1].split(",").map((v) => parseFloat(v))
        const h = (v: number) =>
            Math.max(0, Math.min(255, Math.round(v || 0)))
                .toString(16)
                .padStart(2, "0")
        return "#" + h(p[0]) + h(p[1]) + h(p[2])
    }
    return "#000000"
}

/** Alpha channel of a CSS color, 1 when opaque/unparseable. */
function colorAlpha(c: string): number {
    const s = (c || "").trim()
    if (s.startsWith("#") && s.length === 9)
        return parseInt(s.slice(7, 9), 16) / 255
    const m = s.match(/rgba\(([^)]+)\)/)
    if (m) {
        const a = parseFloat(m[1].split(",")[3])
        return isNaN(a) ? 1 : a
    }
    return 1
}

/** "#rrggbb" + alpha â†’ "rgba(r, g, b, a)". */
function hexWithAlpha(hex: string, a: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`
}

/** Range/checkbox/color skins â€” pseudo-elements need a stylesheet. */
const HUD_CSS = `
.rfh-hud input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 10px;
    border-radius: 5px;
    background: ${HUD_TRACK};
    outline: none;
    margin: 0;
    display: block;
    cursor: pointer;
}
.rfh-hud input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid ${HUD_ACCENT};
    box-sizing: border-box;
    cursor: pointer;
}
.rfh-hud input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid ${HUD_ACCENT};
    box-sizing: border-box;
    cursor: pointer;
}
.rfh-hud input[type="checkbox"] {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 5px;
    border: 1.5px solid rgba(92, 92, 102, 1);
    background: transparent;
    cursor: pointer;
    margin: 0;
    display: grid;
    place-content: center;
    transition: background 0.15s ease, border-color 0.15s ease;
}
.rfh-hud input[type="checkbox"]:checked {
    background: ${HUD_ACCENT};
    border-color: ${HUD_ACCENT};
}
.rfh-hud input[type="checkbox"]:checked::after {
    content: "";
    width: 9px;
    height: 5px;
    border-left: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: rotate(-45deg) translate(0px, -1px);
}
.rfh-hud input[type="color"] {
    -webkit-appearance: none;
    appearance: none;
    width: 34px;
    height: 20px;
    border: 1px solid rgba(92, 92, 102, 1);
    border-radius: 5px;
    padding: 0;
    background: transparent;
    cursor: pointer;
}
.rfh-hud input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
}
.rfh-hud input[type="color"]::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
}
.rfh-hud input[type="color"]::-moz-color-swatch {
    border: none;
    border-radius: 4px;
}
.rfh-hud *::-webkit-scrollbar {
    width: 6px;
}
.rfh-hud *::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 3px;
}
.rfh-hud button:hover svg {
    color: #ffffff;
}
`

/** The mockup's toggle icon: rounded-square outline + right chevron
 *  ("arrows-sharp-outline-square-arrow-left-01-sharp"). Points right
 *  when expanded (hide â†’), flips 180Â° when collapsed (â† expand). */
function HudToggleIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect
                x="3.2"
                y="3.2"
                width="17.6"
                height="17.6"
                rx="4.5"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="M10.2 7.9 L14.5 12 L10.2 16.1"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function DebugHUD({
    values,
    onChange,
}: {
    values: FluxGridProps
    onChange: (
        key: keyof FluxGridProps,
        value: number | boolean | string
    ) => void
}) {
    const [collapsed, setCollapsed] = React.useState(false)

    const sectionTitle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 0 4px",
    }
    const bullet: React.CSSProperties = {
        width: 5,
        height: 5,
        borderRadius: "100%",
        background: HUD_LABEL,
        flex: "0 0 auto",
    }
    const sectionText: React.CSSProperties = {
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: "#ffffff",
    }
    const labelStyle: React.CSSProperties = {
        fontWeight: 500,
        fontSize: 13,
        color: HUD_LABEL,
    }
    const valueStyle: React.CSSProperties = {
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: 0.5,
        color: HUD_ACCENT,
    }
    const rowHead: React.CSSProperties = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    }

    return (
        <div
            className="rfh-hud"
            onClick={collapsed ? () => setCollapsed(false) : undefined}
            style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: collapsed ? 44 : 340,
                maxHeight: "calc(100% - 32px)",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                padding: collapsed ? "10px" : "24px",
                borderRadius: 16,
                background: HUD_BG,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: HUD_BORDER,
                boxShadow: HUD_SHADOW,
                overflow: "hidden",
                transition: `width 0.4s ${HUD_EASE}, padding 0.4s ${HUD_EASE}`,
                // The panel itself catches clicks/drags; everything
                // outside it stays untouched, so canvas hover keeps
                // working right up to the panel's edge.
                pointerEvents: "auto",
                zIndex: 10,
                fontFamily: HUD_FONT,
                color: "#e8e6e3",
                userSelect: "none",
                cursor: collapsed ? "pointer" : "default",
            }}
        >
            <style>{HUD_CSS}</style>

            {/* Title bar â€” the icon button drives collapse/expand. */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: collapsed ? 0 : 12,
                    flex: "0 0 auto",
                }}
            >
                <div
                    style={{
                        fontWeight: 800,
                        fontSize: 14,
                        letterSpacing: 2.5,
                        textTransform: "uppercase",
                        color: HUD_ACCENT,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        width: collapsed ? 0 : "auto",
                        opacity: collapsed ? 0 : 1,
                        transition: `opacity 0.25s ${HUD_EASE}`,
                    }}
                >
                    Flux Grid Console
                </div>
                <button
                    aria-label={
                        collapsed
                            ? "Expand debug panel"
                            : "Collapse debug panel"
                    }
                    onClick={(e) => {
                        e.stopPropagation()
                        setCollapsed((c) => !c)
                    }}
                    style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        width: 24,
                        height: 24,
                        flex: "0 0 auto",
                        color: "#6e6e78",
                        cursor: "pointer",
                        transform: collapsed
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        transition: `transform 0.4s ${HUD_EASE}`,
                    }}
                >
                    <HudToggleIcon />
                </button>
            </div>

            {/* Collapsible body: 1fr â‡„ 0fr grid rows animate the auto
                height smoothly; opacity fades the content in sync. */}
            <div
                style={{
                    display: "grid",
                    gridTemplateRows: collapsed ? "0fr" : "1fr",
                    transition: `grid-template-rows 0.4s ${HUD_EASE}`,
                    flex: "0 1 auto",
                    minHeight: 0,
                }}
            >
                <div
                    style={{
                        minHeight: 0,
                        overflowY: collapsed ? "hidden" : "auto",
                        opacity: collapsed ? 0 : 1,
                        transition: `opacity 0.3s ${HUD_EASE}`,
                        paddingRight: 2,
                    }}
                >
                    {HUD_SECTIONS.map((section) => (
                        <div key={section.title} style={{ marginTop: 6 }}>
                            <div style={sectionTitle}>
                                <span style={bullet} />
                                <span style={sectionText}>{section.title}</span>
                            </div>
                            {section.items.map((item) => {
                                const raw = values[item.key]

                                if (item.bool) {
                                    return (
                                        <label
                                            key={item.key}
                                            style={{
                                                ...rowHead,
                                                marginBottom: 14,
                                                cursor: "pointer",
                                            }}
                                        >
                                            <span style={labelStyle}>
                                                {item.label}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={!!raw}
                                                onChange={(e) =>
                                                    onChange(
                                                        item.key,
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                        </label>
                                    )
                                }

                                if (item.color) {
                                    const str =
                                        typeof raw === "string" ? raw : ""
                                    const hex = colorToHex(str)
                                    const alpha = colorAlpha(str)
                                    return (
                                        <div
                                            key={item.key}
                                            style={{
                                                ...rowHead,
                                                marginBottom: 14,
                                            }}
                                        >
                                            <span style={labelStyle}>
                                                {item.label}
                                            </span>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                {item.alpha && (
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={1}
                                                        step={0.01}
                                                        value={alpha}
                                                        style={{
                                                            width: 64,
                                                            background: `linear-gradient(to right, ${HUD_ACCENT} 0%, ${HUD_ACCENT} ${alpha * 100}%, ${HUD_TRACK} ${alpha * 100}%, ${HUD_TRACK} 100%)`,
                                                        }}
                                                        onChange={(e) =>
                                                            onChange(
                                                                item.key,
                                                                hexWithAlpha(
                                                                    hex,
                                                                    parseFloat(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                )
                                                            )
                                                        }
                                                    />
                                                )}
                                                <span
                                                    style={{
                                                        ...valueStyle,
                                                        fontSize: 11,
                                                    }}
                                                >
                                                    {hex.toUpperCase()}
                                                </span>
                                                <input
                                                    type="color"
                                                    value={hex}
                                                    onChange={(e) =>
                                                        onChange(
                                                            item.key,
                                                            item.alpha
                                                                ? hexWithAlpha(
                                                                      e.target
                                                                          .value,
                                                                      alpha
                                                                  )
                                                                : e.target.value
                                                        )
                                                    }
                                                />
                                            </span>
                                        </div>
                                    )
                                }

                                const num = typeof raw === "number" ? raw : 0
                                const step = item.step ?? 0.01
                                const min = item.min ?? 0
                                const max = item.max ?? 1
                                const pct = Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        ((num - min) / (max - min)) * 100
                                    )
                                )
                                return (
                                    <div
                                        key={item.key}
                                        style={{ marginBottom: 14 }}
                                    >
                                        <div style={rowHead}>
                                            <span style={labelStyle}>
                                                {item.label}
                                            </span>
                                            <span style={valueStyle}>
                                                {step >= 1
                                                    ? num.toFixed(0)
                                                    : num.toFixed(2)}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={min}
                                            max={max}
                                            step={step}
                                            value={num}
                                            style={{
                                                background: `linear-gradient(to right, ${HUD_ACCENT} 0%, ${HUD_ACCENT} ${pct}%, ${HUD_TRACK} ${pct}%, ${HUD_TRACK} 100%)`,
                                            }}
                                            onChange={(e) =>
                                                onChange(
                                                    item.key,
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

/**
 * FluxGrid â€” drop-in animated hero background.
 * Defaults to 800Ã—450 and stretches to whatever size the layer is
 * given in Framer (wrapper is 100% Ã— 100%).
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 450
 */
export default function FluxGrid(props: FluxGridProps) {
    /**
     * Live overrides from the debug HUD, merged over the Framer
     * panel props. Dragging a HUD slider writes here, React
     * re-renders, and the Canvas / useFrame loop / shader uniforms
     * pick the new value up on the very next frame â€” real-time
     * tuning without touching the Framer document.
     */
    const [live, setLive] = React.useState<Partial<FluxGridProps>>({})
    const merged = { ...props, ...live } as FluxGridProps

    const {
        canvasBG,
        vignetteEffect,
        vignetteStart,
        vignetteEnd,
        vignetteColor,
        cameraAngle,
        showHUD,
        style,
    } = merged

    // Framer's automated marketplace/thumbnail renderer executes the
    // component in a static (non-interactive) context to generate
    // preview images â€” WebGL canvases, rAF loops and pointer
    // listeners either fail or hang that pass. Called unconditionally
    // alongside the other hooks (Rules of Hooks); the actual bailout
    // happens after every hook has run, right before the JSX return.
    const isStatic = useIsStaticRenderer()
    const supported = useWebGLSupport()
    const wrapperRef = React.useRef<HTMLDivElement>(null)

    /** Camera elevation straight from the slider (90Â° = top-down). */
    const effectiveAngle = THREE.MathUtils.clamp(cameraAngle, 40, 90)

    /**
     * Real-time wrapper size via ResizeObserver, read from
     * offsetWidth/offsetHeight â€” layout-space pixels, immune to the
     * scale transform Framer's canvas editor applies when zoomed
     * (getBoundingClientRect is NOT, which is what collapsed the
     * grid into a tiny corner square at design time). Every resize
     * of the component handle updates this state, re-rendering the
     * scene so the grid bounds recompute against live dimensions.
     */
    const [measured, setMeasured] = React.useState({ width: 0, height: 0 })
    React.useEffect(() => {
        // No Canvas is mounted in the static branch, so there is
        // nothing here to keep in sync â€” skip attaching the observer
        // entirely rather than merely ignoring its callbacks.
        if (isStatic) return
        const el = wrapperRef.current
        if (!el) return
        const update = () => {
            const width = el.offsetWidth
            const height = el.offsetHeight
            setMeasured((prev) =>
                prev.width === width && prev.height === height
                    ? prev
                    : { width, height }
            )
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic])

    /**
     * Visibility gate: the render loop early-exits whenever the
     * component is scrolled out of view or the tab is backgrounded,
     * so a hidden hero costs ~zero CPU/GPU.
     */
    const activeRef = React.useRef(true)
    React.useEffect(() => {
        // Same reasoning as the resize observer above: nothing to
        // gate visibility for when there's no Canvas mounted.
        if (isStatic) return
        const el = wrapperRef.current
        if (!el) return

        let inView = true
        let tabVisible = document.visibilityState === "visible"
        const update = () => {
            activeRef.current = inView && tabVisible
        }

        const io = new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting
            update()
        })
        io.observe(el)

        const onVis = () => {
            tabVisible = document.visibilityState === "visible"
            update()
        }
        document.addEventListener("visibilitychange", onVis)

        return () => {
            io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
        }
    }, [isStatic])

    // Vignette geometry from the start/end props (0â€“1 â†’ % of radius).
    // The color (including its alpha) comes straight from the Framer
    // color picker; `transparent` interpolates premultiplied in
    // modern browsers, so there is no gray fringe.
    const vStart = Math.min(vignetteStart, vignetteEnd - 0.01)
    const vignetteGradient = `radial-gradient(115% 90% at 50% 45%, transparent ${
        vStart * 100
    }%, ${vignetteColor} ${vignetteEnd * 100}%)`

    // Framer's Canvas/Export render is static â€” no rAF loop, no
    // pointer input, nothing to animate. Rather than mounting the
    // Three.js scene and merely pausing/bailing inside it, this
    // branch skips <Canvas> (and therefore WebGL, the physics loop,
    // and all pointer listeners) entirely, rendering a plain styled
    // element instead â€” a real static fallback, not a paused
    // animation.
    if (isStatic) {
        return (
            <div
                ref={wrapperRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background: canvasBG,
                    ...style,
                }}
            >
                <StaticRodPreview {...merged} />
                {vignetteEffect && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            background: vignetteGradient,
                        }}
                    />
                )}
            </div>
        )
    }

    return (
        <div
            ref={wrapperRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: canvasBG,
                ...style,
            }}
        >
            {supported ? (
                <WebGLErrorBoundary fallbackColor={canvasBG}>
                    <Canvas
                        dpr={[1, 2]}
                        camera={{
                            position: [0, CAMERA_DISTANCE, 0.02],
                            fov: 42,
                        }}
                        gl={{ antialias: true, alpha: false }}
                        // offsetSize: measure via offsetWidth/Height
                        // (layout px) instead of the bounding rect,
                        // which Framer's canvas-editor zoom transform
                        // scales down â€” the cause of the tiny
                        // top-left clump at design time. Zero
                        // debounce so resizes apply immediately
                        // while dragging the component handle.
                        resize={{
                            offsetSize: true,
                            scroll: false,
                            debounce: { scroll: 0, resize: 0 },
                        }}
                        style={{ width: "100%", height: "100%" }}
                    >
                        <color attach="background" args={[canvasBG]} />
                        <CameraRig
                            angleDeg={effectiveAngle}
                            fallbackH={measured.height}
                        />
                        <RodField
                            {...merged}
                            activeRef={activeRef}
                            effectiveAngle={effectiveAngle}
                            fallbackSize={measured}
                        />
                    </Canvas>
                </WebGLErrorBoundary>
            ) : (
                <GradientFallback color={canvasBG} />
            )}

            {/* Vignette â€” CSS overlay, zero GPU cost vs. a shader pass. */}
            {vignetteEffect && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: vignetteGradient,
                    }}
                />
            )}

            {/* Debug HUD â€” live parameter tuning, dev-only overlay. */}
            {!isStatic && showHUD && (
                <DebugHUD
                    values={merged}
                    onChange={(key, value) =>
                        setLive((prev) => ({ ...prev, [key]: value }))
                    }
                />
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Defaults â€” looks right the moment it lands on the canvas           */
/* ------------------------------------------------------------------ */

FluxGrid.defaultProps = {
    showHUD: false,
    density: 0.56,
    canvasBG: "#000000",
    rodHeight: 2.45,
    rodWidth: 0.025,
    rodColor1: "#A1D0FF",
    rodColor2: "#362BFF",
    rodColor3: "#87CDFF",
    rodColor4: "#9CF0FF",
    tipCapGlow: 0,
    tipCapSize: 0.13,
    tipCapColor: "#D4E3FF",
    vignetteEffect: true,
    vignetteStart: 0.52,
    vignetteEnd: 0.65,
    vignetteColor: "rgba(0, 0, 0, 0.77)",
    waveIntensity: 0.28,
    hoverRadius: 2.4,
    repulsionForce: 1.1,
    cameraAngle: 75,
    mouseSnap: 0.35,
    dampingRatio: 0.12,
    fadeStrength: 1,
}

/* ------------------------------------------------------------------ */
/*  Framer property controls (grouped: Visuals / Animation / Behavior) */
/* ------------------------------------------------------------------ */

addPropertyControls(FluxGrid, {
    showHUD: {
        type: ControlType.Boolean,
        title: "HUD",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
    },
    density: {
        type: ControlType.Number,
        title: "Density",
        description:
            "Gap between rods. Smaller gap = more rods (heavier on GPU).",
        min: 0.2,
        max: 1.2,
        step: 0.02,
        defaultValue: 0.56,
    },
    canvasBG: {
        type: ControlType.Color,
        title: "Canvas BG",
        defaultValue: "#000000",
    },
    rodHeight: {
        type: ControlType.Number,
        title: "Rod Height",
        description: "0 hides the rods completely.",
        min: 0,
        max: 4,
        step: 0.05,
        defaultValue: 2.45,
    },
    rodWidth: {
        type: ControlType.Number,
        title: "Rod Width",
        description: "0 hides the rods completely.",
        min: 0,
        max: 0.2,
        step: 0.005,
        defaultValue: 0.025,
    },
    rodColor1: {
        type: ControlType.Color,
        title: "Rod Color 1",
        defaultValue: "#A1D0FF",
    },
    rodColor2: {
        type: ControlType.Color,
        title: "Rod Color 2",
        defaultValue: "#362BFF",
    },
    rodColor3: {
        type: ControlType.Color,
        title: "Rod Color 3",
        defaultValue: "#87CDFF",
    },
    rodColor4: {
        type: ControlType.Color,
        title: "Rod Color 4",
        defaultValue: "#9CF0FF",
    },
    tipCapGlow: {
        type: ControlType.Number,
        title: "Tip Glow",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0,
    },
    tipCapSize: {
        type: ControlType.Number,
        title: "Tip Size",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.13,
    },
    tipCapColor: {
        type: ControlType.Color,
        title: "Tip Color",
        defaultValue: "#D4E3FF",
    },
    vignetteEffect: {
        type: ControlType.Boolean,
        title: "Vignette",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
    },
    vignetteStart: {
        type: ControlType.Number,
        title: "Vignette Start",
        min: 0,
        max: 0.95,
        step: 0.01,
        defaultValue: 0.52,
        hidden: (p: any) => !p.vignetteEffect,
    },
    vignetteEnd: {
        type: ControlType.Number,
        title: "Vignette End",
        min: 0.05,
        max: 1,
        step: 0.01,
        defaultValue: 0.65,
        hidden: (p: any) => !p.vignetteEffect,
    },
    vignetteColor: {
        type: ControlType.Color,
        title: "Vignette Color",
        defaultValue: "rgba(0, 0, 0, 0.77)",
        hidden: (p: any) => !p.vignetteEffect,
    },
    waveIntensity: {
        type: ControlType.Number,
        title: "Wave Intensity",
        min: 0,
        max: 1.5,
        step: 0.01,
        defaultValue: 0.28,
    },
    hoverRadius: {
        type: ControlType.Number,
        title: "Hover Radius",
        min: 0.5,
        max: 6,
        step: 0.1,
        defaultValue: 2.4,
    },
    repulsionForce: {
        type: ControlType.Number,
        title: "Repulsion",
        description:
            "Strength of the cursor deformation â€” rods pivot away from their fixed bases and lift into a dome around the cursor.",
        min: 0,
        max: 4,
        step: 0.05,
        defaultValue: 1.1,
    },
    cameraAngle: {
        type: ControlType.Number,
        title: "Camera Angle",
        min: 40,
        max: 90,
        step: 1,
        unit: "Â°",
        defaultValue: 75,
    },
    mouseSnap: {
        type: ControlType.Number,
        title: "Mouse Snap",
        description:
            "Spring speed â€” higher values react and settle faster; lower values move lazier.",
        min: 0.05,
        max: 1,
        step: 0.01,
        defaultValue: 0.35,
    },
    dampingRatio: {
        type: ControlType.Number,
        title: "Damping",
        description:
            "Damping ratio (Î¶) of the rod springs. Low = bouncy jelly with 2â€“3 overshoot wobbles; 1 = settles with no bounce at all.",
        min: 0.02,
        max: 1,
        step: 0.01,
        defaultValue: 0.12,
    },
    fadeStrength: {
        type: ControlType.Number,
        title: "Distance Fade",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
    },
})
