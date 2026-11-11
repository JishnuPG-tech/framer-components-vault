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

import { motion, useAnimationControls } from "framer-motion"

// @framerSupportedLayoutWidth: any-prefer-fixed
// @framerSupportedLayoutHeight: any-prefer-fixed
// @framerIntrinsicWidth: 500
// @framerIntrinsicHeight: 500

type MaskStyle =
    | "wipe"
    | "circle"
    | "diamond"
    | "split"
    | "organic"
    | "liquid"
    | "wave"
    | "mosaic"
    | "blinds"
    | "grid"
    | "zoom"

type WipeDirection = "top" | "bottom" | "left" | "right"

type CircleOrigin =
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"

type EdgePoint = "top" | "center" | "bottom"

interface Props {
    hoverSwap: boolean
    mobileSwap: boolean
    imageA?: string | { src: string }
    imageB?: string | { src: string }
    link?: string
    linkNewTab?: boolean
    backgroundColor: string
    radius: number
    circle: boolean
    borderWidth: number
    borderColor: string
    fit: "cover" | "contain"
    maskStyle: MaskStyle
    wipeDirection: WipeDirection
    duration: number
    segments: number
    blindsOrientation: "horizontal" | "vertical"
    splitOrientation: "horizontal" | "vertical"
    circleOrigin: CircleOrigin
    randomness: number
    liquidEdge: number
    liquidNoiseScale: number
    liquidFlowSpeed: number
    waveAmplitude: number
    waveFrequency: number
    waveSpeed: number
    mosaicCells: number
    mosaicStagger: number
    appearTrigger: "onAppear" | "layerInView" | "sectionInView"
    viewportTrigger: EdgePoint
    trackPoint: EdgePoint
    sectionTrackPoint: EdgePoint
    sectionSelector: string
    sectionDelay: number
    reverse: boolean
    zoomScale: number
}

const EASE = [0.16, 1, 0.3, 1] as const

interface MaskClips {
    hidden: string
    visible: string
}

const CIRCLE_ORIGIN_POS: Record<CircleOrigin, { x: number; y: number }> = {
    center: { x: 50, y: 50 },
    top: { x: 50, y: 0 },
    bottom: { x: 50, y: 100 },
    left: { x: 0, y: 50 },
    right: { x: 100, y: 50 },
    "top-left": { x: 0, y: 0 },
    "top-right": { x: 100, y: 0 },
    "bottom-left": { x: 0, y: 100 },
    "bottom-right": { x: 100, y: 100 },
}

const ORGANIC_N = 24
const ORGANIC_BASE_ANGLES = Array.from(
    { length: ORGANIC_N },
    (_, i) => (360 / ORGANIC_N) * i
)

const ORGANIC_TENSION = 10

function buildOrganicPath(
    cx: number,
    cy: number,
    r: number,
    angles: number[],
    factors: number[]
): string {
    const pts = angles.map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const rr = r * factors[i]
        return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)]
    })
    const n = pts.length
    const at = (i: number) => pts[((i % n) + n) % n]

    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `
    for (let i = 0; i < n; i++) {
        const p0 = at(i - 1)
        const p1 = at(i)
        const p2 = at(i + 1)
        const p3 = at(i + 2)
        const c1x = p1[0] + (p2[0] - p0[0]) / ORGANIC_TENSION
        const c1y = p1[1] + (p2[1] - p0[1]) / ORGANIC_TENSION
        const c2x = p2[0] - (p3[0] - p1[0]) / ORGANIC_TENSION
        const c2y = p2[1] - (p3[1] - p1[1]) / ORGANIC_TENSION
        d += `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(
            1
        )} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `
    }
    return d + "Z"
}

const ORGANIC_MARGIN = 1.5
const ORGANIC_DURATION_SCALE = 3

function safeOrganicRadius(
    cx: number,
    cy: number,
    w: number,
    h: number
): number {
    const maxCorner = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(w - cx, cy),
        Math.hypot(cx, h - cy),
        Math.hypot(w - cx, h - cy)
    )
    return maxCorner * ORGANIC_MARGIN
}

function smoothFactorsOnce(factors: number[]): number[] {
    return factors.map((v, i) => {
        const prev = factors[(i - 1 + factors.length) % factors.length]
        const next = factors[(i + 1) % factors.length]
        return prev * 0.25 + v * 0.5 + next * 0.25
    })
}

interface OrganicShape {
    angles: number[]
    factors: number[]
}

function randomOrganicShape(randomness: number): OrganicShape {
    const t = Math.min(1, Math.max(0, randomness / 100))
    const angles = ORGANIC_BASE_ANGLES.map(
        (a) => a + (Math.random() - 0.5) * 10 * t
    )
    const bulge = 0.15 + 1.0 * t
    const rawFactors = ORGANIC_BASE_ANGLES.map(() => 1 + Math.random() * bulge)

    let factors = smoothFactorsOnce(rawFactors)
    factors = smoothFactorsOnce(factors)

    const rawPeak = Math.max(...rawFactors.map((v) => v - 1))
    const smoothPeak = Math.max(...factors.map((v) => v - 1))
    const rescale = smoothPeak > 0.0001 ? rawPeak / smoothPeak : 1
    factors = factors.map((v) => 1 + (v - 1) * rescale)

    factors = factors.map((v) => Math.max(1, v))

    return { angles, factors }
}

function organicPathFromShape(
    cx: number,
    cy: number,
    r: number,
    shape: OrganicShape
): string {
    return buildOrganicPath(cx, cy, r, shape.angles, shape.factors)
}

function hiddenOrganicPath(cx: number, cy: number): string {
    return buildOrganicPath(
        cx,
        cy,
        1,
        ORGANIC_BASE_ANGLES,
        ORGANIC_BASE_ANGLES.map(() => 1)
    )
}

function circleCoveragePercent(
    originXPct: number,
    originYPct: number,
    w: number,
    h: number
): number {
    if (!w || !h) return 150
    const ox = (originXPct / 100) * w
    const oy = (originYPct / 100) * h
    const corners = [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
    ]
    const maxDist = Math.max(
        ...corners.map(([cx, cy]) => Math.hypot(cx - ox, cy - oy))
    )
    const basis = Math.hypot(w, h) / Math.SQRT2
    return (maxDist / basis) * 100 * 1.05
}

const WIPE_HIDDEN: Record<WipeDirection, string> = {
    top: "inset(0% 0% 100% 0%)",
    bottom: "inset(100% 0% 0% 0%)",
    left: "inset(0% 100% 0% 0%)",
    right: "inset(0% 0% 0% 100%)",
}

function getMaskClips(
    style: "wipe" | "circle" | "diamond",
    circleOrigin: CircleOrigin,
    wipeDirection: WipeDirection,
    size: { w: number; h: number }
): MaskClips {
    switch (style) {
        case "circle": {
            const { x, y } = CIRCLE_ORIGIN_POS[circleOrigin]
            const pct = circleCoveragePercent(x, y, size.w, size.h)
            return {
                hidden: `circle(0% at ${x}% ${y}%)`,
                visible: `circle(${pct.toFixed(1)}% at ${x}% ${y}%)`,
            }
        }
        case "diamond":
            return {
                hidden: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)",
                visible: "polygon(50% -60%, 160% 50%, 50% 160%, -60% 50%)",
            }
        case "wipe":
        default:
            return {
                hidden: WIPE_HIDDEN[wipeDirection],
                visible: "inset(0% 0% 0% 0%)",
            }
    }
}

const DEFAULT_IMAGE_A =
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
const DEFAULT_IMAGE_B =
    "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg"

function getImageSrc(image?: string | { src: string }): string | undefined {
    if (!image) return undefined
    return typeof image === "string" ? image : image.src
}

const APPEAR_HOVER_GUARD_MS = 150
function getAppearMs(maskStyle: MaskStyle, duration: number): number {
    return APPEAR_HOVER_GUARD_MS
}

const TRANSITION_BUFFER_MS = 80
function getTransitionMs(maskStyle: MaskStyle, duration: number): number {
    if (maskStyle === "organic") {
        return duration * ORGANIC_DURATION_SCALE * 1000 + TRANSITION_BUFFER_MS
    }
    if (maskStyle === "grid" || maskStyle === "blinds") {
        return duration * 1.1 * 1000 + TRANSITION_BUFFER_MS
    }
    return duration * 1000 + TRANSITION_BUFFER_MS
}

function computeGrid(segments: number, w: number, h: number) {
    const cols = Math.max(2, Math.min(30, segments || 8))
    let rows = Math.max(1, Math.round(cols * ((h || 1) / (w || 1))))
    rows = Math.min(rows, 30)
    return { cols, rows }
}

function buildCells(cols: number, rows: number) {
    const cells: { r: number; c: number }[] = []
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) cells.push({ r, c })
    }
    return cells
}

function cellDelayFactor(r: number, c: number, rows: number, cols: number) {
    const cx = (cols - 1) / 2
    const cy = (rows - 1) / 2
    const maxDist = Math.sqrt(cx * cx + cy * cy) || 1
    const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2)
    return dist / maxDist
}

function pointToViewportY(point: EdgePoint): number {
    if (point === "top") return 0
    if (point === "bottom") return window.innerHeight
    return window.innerHeight / 2
}

function pointToElementY(rect: DOMRect, point: EdgePoint): number {
    if (point === "top") return rect.top
    if (point === "bottom") return rect.bottom
    return rect.top + rect.height / 2
}

function useEdgeInView(
    getEl: () => HTMLElement | null,
    viewportTrigger: EdgePoint,
    trackPoint: EdgePoint,
    once: boolean
): boolean {
    const [inView, setInView] = React.useState(false)
    const firedRef = React.useRef(false)

    React.useEffect(() => {
        let io: IntersectionObserver | null = null
        let mo: MutationObserver | null = null
        let scheduled = false

        const check = () => {
            scheduled = false
            const el = getEl()
            if (!el) return
            const rect = el.getBoundingClientRect()
            const elementY = pointToElementY(rect, trackPoint)
            const viewportY = pointToViewportY(viewportTrigger)
            const crossed = elementY <= viewportY
            if (crossed && !firedRef.current) {
                firedRef.current = true
                setInView(true)
                if (once) teardown()
            } else if (!crossed && !once && firedRef.current) {
                firedRef.current = false
                setInView(false)
            }
        }

        // Throttle scroll/resize follow-up checks to at most once per
        // frame instead of running a continuous requestAnimationFrame
        // loop every frame regardless of whether anything changed.
        const scheduleCheck = () => {
            if (scheduled) return
            scheduled = true
            requestAnimationFrame(check)
        }

        const detachTracking = () => {
            window.removeEventListener("scroll", scheduleCheck)
            window.removeEventListener("resize", scheduleCheck)
        }

        const teardown = () => {
            io?.disconnect()
            mo?.disconnect()
            detachTracking()
        }

        // Wake up (event-driven) once the element is anywhere near the
        // viewport, verify the exact trigger point, and keep it in sync
        // via scroll/resize — no per-frame polling while offscreen.
        const attachObserver = (el: HTMLElement) => {
            io = new IntersectionObserver(
                (entries) => {
                    if (entries[0]?.isIntersecting) {
                        check()
                        window.addEventListener("scroll", scheduleCheck, {
                            passive: true,
                        })
                        window.addEventListener("resize", scheduleCheck)
                    } else {
                        detachTracking()
                    }
                },
                { rootMargin: "50% 0px 50% 0px" }
            )
            io.observe(el)
            check()
        }

        const el = getEl()
        if (el) {
            attachObserver(el)
        } else {
            // Target element isn't mounted yet (e.g. a section that
            // renders later) — wait for it via DOM mutations instead of
            // polling every frame.
            mo = new MutationObserver(() => {
                const found = getEl()
                if (found) {
                    mo?.disconnect()
                    mo = null
                    attachObserver(found)
                }
            })
            mo.observe(document.body, { childList: true, subtree: true })
        }

        return () => teardown()
    }, [getEl, viewportTrigger, trackPoint, once])

    return inView
}

function ClipGrowLayer({
    mountKey,
    hiddenClip,
    visibleClip,
    duration,
    src,
    isStatic,
    fit,
    reverse,
}: {
    mountKey: string
    hiddenClip: string
    visibleClip: string
    duration: number
    src?: string
    isStatic: boolean
    fit: "cover" | "contain"
    reverse?: boolean
}) {
    const initialClip = isStatic
        ? visibleClip
        : reverse
          ? visibleClip
          : hiddenClip
    const animateClip = reverse ? hiddenClip : visibleClip
    return (
        <motion.div
            key={mountKey}
            style={{
                ...imageLayer,
                zIndex: 2,
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
            }}
            initial={{ clipPath: initialClip }}
            animate={{ clipPath: animateClip }}
            transition={{ duration, ease: EASE }}
        >
            {src && <img src={src} alt="" style={getImgStyle(fit)} />}
        </motion.div>
    )
}

function OrganicGrowLayer({
    mountKey,
    cx,
    cy,
    path,
    duration,
    src,
    isStatic,
    fit,
}: {
    mountKey: string
    cx: number
    cy: number
    path: string
    duration: number
    src?: string
    isStatic: boolean
    fit: "cover" | "contain"
}) {
    const hiddenPath = React.useMemo(() => hiddenOrganicPath(cx, cy), [cx, cy])
    const visibleClip = `path('${path}')`
    return (
        <motion.div
            key={mountKey}
            style={{
                ...imageLayer,
                zIndex: 2,
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
            }}
            initial={{
                clipPath: isStatic ? visibleClip : `path('${hiddenPath}')`,
            }}
            animate={{ clipPath: visibleClip }}
            transition={{
                duration: duration * ORGANIC_DURATION_SCALE,
                ease: EASE,
            }}
        >
            {src && <img src={src} alt="" style={getImgStyle(fit)} />}
        </motion.div>
    )
}

function SplitGrowLayer({
    transitionId,
    orientation,
    duration,
    src,
    isStatic,
    fit,
    reverse,
}: {
    transitionId: string
    orientation: "horizontal" | "vertical"
    duration: number
    src?: string
    isStatic: boolean
    fit: "cover" | "contain"
    reverse?: boolean
}) {
    const isHorizontal = orientation === "horizontal"
    const overlap = 0.6

    const hiddenA = isHorizontal
        ? "inset(0% 0% 100% 0%)"
        : "inset(0% 100% 0% 0%)"
    const visibleA = isHorizontal
        ? `inset(0% 0% ${50 - overlap}% 0%)`
        : `inset(0% ${50 - overlap}% 0% 0%)`
    const hiddenB = isHorizontal
        ? "inset(100% 0% 0% 0%)"
        : "inset(0% 0% 0% 100%)"
    const visibleB = isHorizontal
        ? `inset(${50 - overlap}% 0% 0% 0%)`
        : `inset(0% 0% 0% ${50 - overlap}%)`

    const halfLayerStyle: React.CSSProperties = {
        ...imageLayer,
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
    }

    const controlsA = useAnimationControls()
    const controlsB = useAnimationControls()

    // Drive the clip-path imperatively instead of remounting on every
    // hover toggle. Remounting would tear down the <img> each time, which
    // on fast enter/leave spam could leave a frame with nothing on
    // screen. set() snaps back to the start clip so every toggle replays
    // the grow motion from scratch, then start() animates to the target.
    React.useEffect(() => {
        if (isStatic) {
            controlsA.set({ clipPath: visibleA })
            controlsB.set({ clipPath: visibleB })
            return
        }
        const startA = reverse ? visibleA : hiddenA
        const endA = reverse ? hiddenA : visibleA
        const startB = reverse ? visibleB : hiddenB
        const endB = reverse ? hiddenB : visibleB

        controlsA.set({ clipPath: startA })
        controlsB.set({ clipPath: startB })
        controlsA.start({
            clipPath: endA,
            transition: { duration, ease: EASE },
        })
        controlsB.start({
            clipPath: endB,
            transition: { duration, ease: EASE },
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transitionId, isStatic])

    return (
        <div style={{ ...imageLayer, zIndex: 2 }}>
            <motion.div
                style={halfLayerStyle}
                initial={false}
                animate={controlsA}
            >
                {src && <img src={src} alt="" style={getImgStyle(fit)} />}
            </motion.div>
            <motion.div
                style={{ ...halfLayerStyle, zIndex: 1 }}
                initial={false}
                animate={controlsB}
            >
                {src && <img src={src} alt="" style={getImgStyle(fit)} />}
            </motion.div>
        </div>
    )
}

function BlindsGrowLayer({
    mountKey,
    segments,
    orientation,
    size,
    duration,
    src,
    isStatic,
    fit,
    reverse,
}: {
    mountKey: string
    segments: number
    orientation: "horizontal" | "vertical"
    size: { w: number; h: number }
    duration: number
    src?: string
    isStatic: boolean
    fit: "cover" | "contain"
    reverse?: boolean
}) {
    const isVertical = orientation === "vertical"
    const stripSize = isVertical ? size.w / segments : size.h / segments

    return (
        <div key={mountKey} style={{ ...imageLayer, zIndex: 2 }}>
            {Array.from({ length: segments }).map((_, i) => {
                const order = reverse ? segments - 1 - i : i
                const delay =
                    (order / Math.max(segments - 1, 1)) * duration * 0.35
                const initialScale = isStatic ? 1 : reverse ? 1 : 0
                const animateScale = reverse ? 0 : 1
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: isVertical ? i * stripSize : 0,
                            top: isVertical ? 0 : i * stripSize,
                            width: isVertical ? stripSize + 0.75 : "100%",
                            height: isVertical ? "100%" : stripSize + 0.75,
                            overflow: "hidden",
                        }}
                    >
                        <motion.div
                            style={{
                                position: "absolute",
                                left: isVertical ? -i * stripSize : 0,
                                top: isVertical ? 0 : -i * stripSize,
                                width: isVertical ? size.w : "100%",
                                height: isVertical ? "100%" : size.h,
                                transformOrigin: "50% 50%",
                            }}
                            initial={
                                isVertical
                                    ? { scaleY: initialScale }
                                    : { scaleX: initialScale }
                            }
                            animate={
                                isVertical
                                    ? { scaleY: animateScale }
                                    : { scaleX: animateScale }
                            }
                            transition={{
                                duration: duration * 0.65,
                                delay,
                                ease: EASE,
                            }}
                        >
                            {src && (
                                <img
                                    src={src}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: fit,
                                        display: "block",
                                    }}
                                />
                            )}
                        </motion.div>
                    </div>
                )
            })}
        </div>
    )
}

function GridGrowLayer({
    mountKey,
    cols,
    rows,
    size,
    duration,
    src,
    isStatic,
    fit,
    reverse,
}: {
    mountKey: string
    cols: number
    rows: number
    size: { w: number; h: number }
    duration: number
    src?: string
    isStatic: boolean
    fit: "cover" | "contain"
    reverse?: boolean
}) {
    const cellW = size.w / cols
    const cellH = size.h / rows
    const cells = React.useMemo(() => buildCells(cols, rows), [cols, rows])

    return (
        <div key={mountKey} style={{ ...imageLayer, zIndex: 2 }}>
            {cells.map(({ r, c }) => {
                const t = cellDelayFactor(r, c, rows, cols)
                const delayT = reverse ? 1 - t : t
                const delay = delayT * duration * 0.5
                const cellDuration = duration * 0.55
                const initialOpacity = isStatic ? 1 : reverse ? 1 : 0
                const initialScale = isStatic ? 1 : reverse ? 1 : 0.4
                const animateOpacity = reverse ? 0 : 1
                const animateScale = reverse ? 0.4 : 1
                return (
                    <motion.div
                        key={`${r}-${c}`}
                        style={{
                            position: "absolute",
                            left: c * cellW,
                            top: r * cellH,
                            width: cellW + 0.75,
                            height: cellH + 0.75,
                            overflow: "hidden",
                            transformOrigin: "50% 50%",
                        }}
                        initial={{
                            opacity: initialOpacity,
                            scale: initialScale,
                        }}
                        animate={{
                            opacity: animateOpacity,
                            scale: animateScale,
                        }}
                        transition={{
                            duration: cellDuration,
                            delay,
                            ease: EASE,
                        }}
                    >
                        {src && (
                            <img
                                src={src}
                                alt=""
                                style={{
                                    position: "absolute",
                                    left: -c * cellW,
                                    top: -r * cellH,
                                    width: size.w,
                                    height: size.h,
                                    objectFit: fit,
                                    maxWidth: "none",
                                }}
                            />
                        )}
                    </motion.div>
                )
            })}
        </div>
    )
}

function ZoomGrowLayer({
    mountKey,
    duration,
    src,
    isStatic,
    fit,
    scale,
}: {
    mountKey: string
    duration: number
    src?: string
    isStatic: boolean
    fit: "cover" | "contain"
    scale: number
}) {
    return (
        <motion.div
            key={mountKey}
            style={{ ...imageLayer, zIndex: 2 }}
            initial={{ opacity: isStatic ? 1 : 0, scale: isStatic ? 1 : scale }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration, ease: EASE }}
        >
            {src && <img src={src} alt="" style={getImgStyle(fit)} />}
        </motion.div>
    )
}

const LIQUID_VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const LIQUID_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_from;
uniform sampler2D u_to;
uniform float u_progress;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_fromSize;
uniform vec2 u_toSize;
uniform float u_edge;
uniform float u_noiseScale;
uniform float u_flowSpeed;
uniform float u_fit;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(
        0.211324865405187, 0.366025403784439,
        -0.577350269189626, 0.024390243902439
    );
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(
        permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
    );
    vec3 m = max(
        0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
        0.0
    );
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

const mat2 FBM_ROTATION = mat2(0.8, -0.6, 0.6, 0.8);

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
        value += amplitude * snoise(p);
        p = FBM_ROTATION * p * 2.02;
        amplitude *= 0.5;
    }
    return value;
}

vec2 fitUV(vec2 uv, vec2 texSize) {
    float texAspect = texSize.x / texSize.y;
    float boxAspect = u_resolution.x / u_resolution.y;
    bool texWider = texAspect > boxAspect;
    // Cover shrinks the axis the texture overflows on (crops it); contain
    // is the mirror — it shrinks the OTHER axis instead (letterboxes).
    bool shrinkX = u_fit > 0.5 ? !texWider : texWider;
    vec2 scale = vec2(1.0);
    if (shrinkX) {
        scale.x = boxAspect / texAspect;
    } else {
        scale.y = texAspect / boxAspect;
    }
    return (uv - 0.5) * scale + 0.5;
}

vec4 sampleFit(sampler2D tex, vec2 uv) {
    if (u_fit > 0.5 && (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)) {
        return vec4(0.0);
    }
    return texture2D(tex, clamp(uv, 0.0, 1.0));
}

void main() {
    vec2 uv = v_uv;
    vec2 p = uv * u_noiseScale + vec2(u_time * u_flowSpeed, -u_time * u_flowSpeed * 0.75);

    float rawN = fbm(p);
    float n = rawN * 0.5 + 0.5;
    float threshold = mix(-u_edge, 1.0 + u_edge, u_progress);
    float mask = smoothstep(threshold - u_edge, threshold + u_edge, n);

    // Forward difference reusing rawN instead of a full central difference
    // (which would need 4 extra fbm calls instead of 2) — a bit less
    // precise, but visually indistinguishable here since it's just driving
    // a small flow displacement, not something that needs to be exact.
    float e = 0.01;
    float nx = fbm(p + vec2(e, 0.0));
    float ny = fbm(p + vec2(0.0, e));
    vec2 flow = vec2(nx - rawN, ny - rawN);

    vec2 uvFrom = fitUV(uv + flow * (1.0 - mask), u_fromSize);
    vec2 uvTo = fitUV(uv - flow * mask, u_toSize);

    vec4 colFrom = sampleFit(u_from, uvFrom);
    vec4 colTo = sampleFit(u_to, uvTo);

    gl_FragColor = mix(colTo, colFrom, mask);
}
`

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
    }
    return shader
}

function createProgram(
    gl: WebGLRenderingContext,
    vertSource: string,
    fragSource: string
): WebGLProgram {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vertSource)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSource)
    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
    }
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return program
}

interface GLTexture {
    texture: WebGLTexture
    width: number
    height: number
}

function loadTexture(
    gl: WebGLRenderingContext,
    url: string
): Promise<GLTexture> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            const texture = gl.createTexture()!
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            )
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            resolve({
                texture,
                width: img.naturalWidth,
                height: img.naturalHeight,
            })
        }
        img.onerror = reject
        img.src = url
    })
}

function makePlaceholderTexture(gl: WebGLRenderingContext): GLTexture {
    const texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 0])
    )
    return { texture, width: 1, height: 1 }
}

function LiquidCanvasLayer({
    srcA,
    srcB,
    active,
    duration,
    edge,
    noiseScale,
    flowSpeed,
    fit,
    size,
    isStatic,
}: {
    srcA?: string
    srcB?: string
    active: boolean
    duration: number
    edge: number
    noiseScale: number
    flowSpeed: number
    fit: "cover" | "contain"
    size: { w: number; h: number }
    isStatic: boolean
}) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const glRef = React.useRef<WebGLRenderingContext | null>(null)
    const programRef = React.useRef<WebGLProgram | null>(null)
    const texARef = React.useRef<GLTexture | null>(null)
    const texBRef = React.useRef<GLTexture | null>(null)
    const blankTexRef = React.useRef<GLTexture | null>(null)

    const phaseRef = React.useRef<"appear" | "swap">("appear")
    const appearStartRef = React.useRef(0)
    const swapProgressRef = React.useRef(0)
    const activeRef = React.useRef(active)
    const durationRef = React.useRef(duration)
    const edgeRef = React.useRef(edge)
    const noiseScaleRef = React.useRef(noiseScale)
    const flowSpeedRef = React.useRef(flowSpeed)
    const fitRef = React.useRef(fit)

    const wakeLoopRef = React.useRef<(() => void) | null>(null)

    React.useEffect(() => {
        // Never spin up WebGL or an animation loop on the Framer canvas or
        // during static export — every other effect in this component
        // checks glRef.current before doing anything, so bailing here
        // keeps the whole layer inert.
        if (isStatic) return
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", {
            premultipliedAlpha: false,
            alpha: true,
        }) as WebGLRenderingContext | null
        if (!gl) return
        glRef.current = gl

        const program = createProgram(gl, LIQUID_VERT, LIQUID_FRAG)
        programRef.current = program
        gl.useProgram(program)

        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )
        const posLoc = gl.getAttribLocation(program, "a_position")
        gl.enableVertexAttribArray(posLoc)
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

        texARef.current = makePlaceholderTexture(gl)
        texBRef.current = makePlaceholderTexture(gl)
        blankTexRef.current = makePlaceholderTexture(gl)

        appearStartRef.current = performance.now()

        return () => {
            gl.deleteProgram(program)
            gl.deleteBuffer(buffer)
            if (texARef.current) gl.deleteTexture(texARef.current.texture)
            if (texBRef.current) gl.deleteTexture(texBRef.current.texture)
            if (blankTexRef.current)
                gl.deleteTexture(blankTexRef.current.texture)
        }
    }, [isStatic])

    React.useEffect(() => {
        const gl = glRef.current
        if (!gl || !srcA) return
        let cancelled = false
        loadTexture(gl, srcA).then((t) => {
            if (cancelled) {
                gl.deleteTexture(t.texture)
                return
            }
            const old = texARef.current
            texARef.current = t
            if (old) gl.deleteTexture(old.texture)
        })
        return () => {
            cancelled = true
        }
    }, [srcA])

    React.useEffect(() => {
        const gl = glRef.current
        if (!gl || !srcB) return
        let cancelled = false
        loadTexture(gl, srcB).then((t) => {
            if (cancelled) {
                gl.deleteTexture(t.texture)
                return
            }
            const old = texBRef.current
            texBRef.current = t
            if (old) gl.deleteTexture(old.texture)
        })
        return () => {
            cancelled = true
        }
    }, [srcB])

    React.useEffect(() => {
        const canvas = canvasRef.current
        const gl = glRef.current
        if (!canvas || !gl) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.max(1, Math.round(size.w * dpr))
        canvas.height = Math.max(1, Math.round(size.h * dpr))
        gl.viewport(0, 0, canvas.width, canvas.height)
    }, [size.w, size.h])

    React.useEffect(() => {
        activeRef.current = active
        durationRef.current = duration
        wakeLoopRef.current?.()
    }, [active, duration])

    React.useEffect(() => {
        edgeRef.current = edge
        noiseScaleRef.current = noiseScale
        flowSpeedRef.current = flowSpeed
        fitRef.current = fit
    }, [edge, noiseScale, flowSpeed, fit])

    React.useEffect(() => {
        const gl = glRef.current
        const program = programRef.current
        const canvas = canvasRef.current
        if (!gl || !program || !canvas) return

        const uFrom = gl.getUniformLocation(program, "u_from")
        const uTo = gl.getUniformLocation(program, "u_to")
        const uProgress = gl.getUniformLocation(program, "u_progress")
        const uTime = gl.getUniformLocation(program, "u_time")
        const uResolution = gl.getUniformLocation(program, "u_resolution")
        const uFromSize = gl.getUniformLocation(program, "u_fromSize")
        const uToSize = gl.getUniformLocation(program, "u_toSize")
        const uEdge = gl.getUniformLocation(program, "u_edge")
        const uNoiseScale = gl.getUniformLocation(program, "u_noiseScale")
        const uFlowSpeed = gl.getUniformLocation(program, "u_flowSpeed")
        const uFit = gl.getUniformLocation(program, "u_fit")

        let raf = 0
        let running = false
        let lastT = performance.now()
        let frozenTime = 0

        const draw = (
            fromTex: GLTexture,
            toTex: GLTexture,
            p: number,
            moving: boolean,
            now: number
        ) => {
            if (moving) frozenTime = (now / 1000) % 1000

            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.useProgram(program)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, fromTex.texture)
            gl.uniform1i(uFrom, 0)
            gl.uniform2f(uFromSize, fromTex.width, fromTex.height)

            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, toTex.texture)
            gl.uniform1i(uTo, 1)
            gl.uniform2f(uToSize, toTex.width, toTex.height)

            gl.uniform1f(uProgress, p)
            gl.uniform1f(uTime, frozenTime)
            gl.uniform2f(uResolution, canvas.width, canvas.height)
            gl.uniform1f(uEdge, edgeRef.current)
            gl.uniform1f(uNoiseScale, noiseScaleRef.current)
            gl.uniform1f(uFlowSpeed, flowSpeedRef.current)
            gl.uniform1f(uFit, fitRef.current === "contain" ? 1 : 0)

            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        const tick = (t: number): boolean => {
            const dt = Math.max(0, (t - lastT) / 1000)
            lastT = t
            const dur = Math.max(0.001, durationRef.current)

            if (phaseRef.current === "appear") {
                const elapsed = (t - appearStartRef.current) / 1000
                const p = Math.min(1, elapsed / dur)
                const toTex = texARef.current
                if (blankTexRef.current && toTex) {
                    draw(blankTexRef.current, toTex, p, p < 1, t)
                }
                if (p >= 1) {
                    phaseRef.current = "swap"
                    swapProgressRef.current = 0
                    return true
                }
                return true
            }

            const targetP = activeRef.current ? 1 : 0
            const step = dt / dur
            const prev = swapProgressRef.current
            if (prev < targetP) {
                swapProgressRef.current = Math.min(targetP, prev + step)
            } else if (prev > targetP) {
                swapProgressRef.current = Math.max(targetP, prev - step)
            }
            const p = swapProgressRef.current
            const moving = p !== targetP || p !== prev
            if (texARef.current && texBRef.current) {
                draw(texARef.current, texBRef.current, p, moving, t)
            }
            return moving
        }

        const loop = (t: number) => {
            const keepGoing = tick(t)
            if (keepGoing) {
                raf = requestAnimationFrame(loop)
            } else {
                running = false
            }
        }

        const startLoop = () => {
            if (running) return
            running = true
            lastT = performance.now()
            raf = requestAnimationFrame(loop)
        }

        wakeLoopRef.current = startLoop
        startLoop()

        return () => {
            wakeLoopRef.current = null
            cancelAnimationFrame(raf)
        }
    }, [])

    if (isStatic) {
        const staticSrc = active ? srcB : srcA
        return staticSrc ? (
            <img src={staticSrc} alt="" style={getImgStyle(fit)} />
        ) : null
    }

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                display: "block",
                pointerEvents: "none",
            }}
        />
    )
}

const WAVE_MAX_SOFTNESS = 0.4
const WAVE_FREQ_MIN = 4
const WAVE_FREQ_MAX = 24
const WAVE_AMPLITUDE_SCALE = 0.3

const WAVE_VERT = LIQUID_VERT

const WAVE_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_from;
uniform sampler2D u_to;
uniform float u_progress;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_fromSize;
uniform vec2 u_toSize;
uniform float u_edge;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_speed;
uniform float u_fit;

vec2 fitUV(vec2 uv, vec2 texSize) {
    float texAspect = texSize.x / texSize.y;
    float boxAspect = u_resolution.x / u_resolution.y;
    bool texWider = texAspect > boxAspect;
    bool shrinkX = u_fit > 0.5 ? !texWider : texWider;
    vec2 scale = vec2(1.0);
    if (shrinkX) {
        scale.x = boxAspect / texAspect;
    } else {
        scale.y = texAspect / boxAspect;
    }
    return (uv - 0.5) * scale + 0.5;
}

vec4 sampleFit(sampler2D tex, vec2 uv) {
    if (u_fit > 0.5 && (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)) {
        return vec4(0.0);
    }
    return texture2D(tex, clamp(uv, 0.0, 1.0));
}

// Several summed sine waves at different frequencies/speeds — no noise
// function needed, this alone reads as water-like ripple. Returned
// un-normalized (roughly -2.5..2.5) since it doubles as both the mask
// field (after normalizing below) and the raw displacement driver.
float waveField(vec2 uv, float t) {
    return sin(uv.y * u_frequency + t * 5.0)
        + sin(uv.y * u_frequency * 2.0 + t * 8.0) * 0.5
        + sin(uv.y * u_frequency * 0.5 + t * 2.0) * 0.8
        + sin(uv.x * u_frequency * 0.75 + t * 3.0) * 0.2;
}

void main() {
    vec2 uv = v_uv;
    float t = u_time * u_speed;

    float raw = waveField(uv, t);
    float n = clamp(raw / 5.0 + 0.5, 0.0, 1.0);

    // Same remapped-threshold trick as Liquid: guarantees mask is exactly
    // 1.0 at progress=0 and exactly 0.0 at progress=1.
    float threshold = mix(-u_edge, 1.0 + u_edge, u_progress);
    float mask = smoothstep(threshold - u_edge, threshold + u_edge, n);

    float displacement = raw * u_amplitude;
    vec2 uvFrom = fitUV(uv + vec2(displacement, 0.0) * (1.0 - mask), u_fromSize);
    vec2 uvTo = fitUV(uv - vec2(displacement, 0.0) * mask, u_toSize);

    vec4 colFrom = sampleFit(u_from, uvFrom);
    vec4 colTo = sampleFit(u_to, uvTo);

    gl_FragColor = mix(colTo, colFrom, mask);
}
`

function WaveCanvasLayer({
    srcA,
    srcB,
    active,
    duration,
    edge,
    amplitude,
    frequency,
    speed,
    fit,
    size,
    isStatic,
}: {
    srcA?: string
    srcB?: string
    active: boolean
    duration: number
    edge: number
    amplitude: number
    frequency: number
    speed: number
    fit: "cover" | "contain"
    size: { w: number; h: number }
    isStatic: boolean
}) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const glRef = React.useRef<WebGLRenderingContext | null>(null)
    const programRef = React.useRef<WebGLProgram | null>(null)
    const texARef = React.useRef<GLTexture | null>(null)
    const texBRef = React.useRef<GLTexture | null>(null)
    const blankTexRef = React.useRef<GLTexture | null>(null)

    const phaseRef = React.useRef<"appear" | "swap">("appear")
    const appearStartRef = React.useRef(0)
    const swapProgressRef = React.useRef(0)
    const activeRef = React.useRef(active)
    const durationRef = React.useRef(duration)
    const edgeRef = React.useRef(edge)
    const amplitudeRef = React.useRef(amplitude)
    const frequencyRef = React.useRef(frequency)
    const speedRef = React.useRef(speed)
    const fitRef = React.useRef(fit)

    const wakeLoopRef = React.useRef<(() => void) | null>(null)

    React.useEffect(() => {
        if (isStatic) return
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", {
            premultipliedAlpha: false,
            alpha: true,
        }) as WebGLRenderingContext | null
        if (!gl) return
        glRef.current = gl

        const program = createProgram(gl, WAVE_VERT, WAVE_FRAG)
        programRef.current = program
        gl.useProgram(program)

        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )
        const posLoc = gl.getAttribLocation(program, "a_position")
        gl.enableVertexAttribArray(posLoc)
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

        texARef.current = makePlaceholderTexture(gl)
        texBRef.current = makePlaceholderTexture(gl)
        blankTexRef.current = makePlaceholderTexture(gl)

        appearStartRef.current = performance.now()

        return () => {
            gl.deleteProgram(program)
            gl.deleteBuffer(buffer)
            if (texARef.current) gl.deleteTexture(texARef.current.texture)
            if (texBRef.current) gl.deleteTexture(texBRef.current.texture)
            if (blankTexRef.current)
                gl.deleteTexture(blankTexRef.current.texture)
        }
    }, [isStatic])

    React.useEffect(() => {
        const gl = glRef.current
        if (!gl || !srcA) return
        let cancelled = false
        loadTexture(gl, srcA).then((t) => {
            if (cancelled) {
                gl.deleteTexture(t.texture)
                return
            }
            const old = texARef.current
            texARef.current = t
            if (old) gl.deleteTexture(old.texture)
        })
        return () => {
            cancelled = true
        }
    }, [srcA])

    React.useEffect(() => {
        const gl = glRef.current
        if (!gl || !srcB) return
        let cancelled = false
        loadTexture(gl, srcB).then((t) => {
            if (cancelled) {
                gl.deleteTexture(t.texture)
                return
            }
            const old = texBRef.current
            texBRef.current = t
            if (old) gl.deleteTexture(old.texture)
        })
        return () => {
            cancelled = true
        }
    }, [srcB])

    React.useEffect(() => {
        const canvas = canvasRef.current
        const gl = glRef.current
        if (!canvas || !gl) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.max(1, Math.round(size.w * dpr))
        canvas.height = Math.max(1, Math.round(size.h * dpr))
        gl.viewport(0, 0, canvas.width, canvas.height)
    }, [size.w, size.h])

    React.useEffect(() => {
        activeRef.current = active
        durationRef.current = duration
        wakeLoopRef.current?.()
    }, [active, duration])

    React.useEffect(() => {
        edgeRef.current = edge
        amplitudeRef.current = amplitude
        frequencyRef.current = frequency
        speedRef.current = speed
        fitRef.current = fit
    }, [edge, amplitude, frequency, speed, fit])

    React.useEffect(() => {
        const gl = glRef.current
        const program = programRef.current
        const canvas = canvasRef.current
        if (!gl || !program || !canvas) return

        const uFrom = gl.getUniformLocation(program, "u_from")
        const uTo = gl.getUniformLocation(program, "u_to")
        const uProgress = gl.getUniformLocation(program, "u_progress")
        const uTime = gl.getUniformLocation(program, "u_time")
        const uResolution = gl.getUniformLocation(program, "u_resolution")
        const uFromSize = gl.getUniformLocation(program, "u_fromSize")
        const uToSize = gl.getUniformLocation(program, "u_toSize")
        const uEdge = gl.getUniformLocation(program, "u_edge")
        const uAmplitude = gl.getUniformLocation(program, "u_amplitude")
        const uFrequency = gl.getUniformLocation(program, "u_frequency")
        const uSpeed = gl.getUniformLocation(program, "u_speed")
        const uFit = gl.getUniformLocation(program, "u_fit")

        let raf = 0
        let running = false
        let lastT = performance.now()
        let frozenTime = 0

        const draw = (
            fromTex: GLTexture,
            toTex: GLTexture,
            p: number,
            moving: boolean,
            now: number
        ) => {
            if (moving) frozenTime = (now / 1000) % 1000

            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.useProgram(program)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, fromTex.texture)
            gl.uniform1i(uFrom, 0)
            gl.uniform2f(uFromSize, fromTex.width, fromTex.height)

            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, toTex.texture)
            gl.uniform1i(uTo, 1)
            gl.uniform2f(uToSize, toTex.width, toTex.height)

            gl.uniform1f(uProgress, p)
            gl.uniform1f(uTime, frozenTime)
            gl.uniform2f(uResolution, canvas.width, canvas.height)
            gl.uniform1f(uEdge, edgeRef.current)
            gl.uniform1f(uAmplitude, amplitudeRef.current)
            gl.uniform1f(uFrequency, frequencyRef.current)
            gl.uniform1f(uSpeed, speedRef.current)
            gl.uniform1f(uFit, fitRef.current === "contain" ? 1 : 0)

            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        const tick = (t: number): boolean => {
            const dt = Math.max(0, (t - lastT) / 1000)
            lastT = t
            const dur = Math.max(0.001, durationRef.current)

            if (phaseRef.current === "appear") {
                const elapsed = (t - appearStartRef.current) / 1000
                const p = Math.min(1, elapsed / dur)
                const toTex = texARef.current
                if (blankTexRef.current && toTex) {
                    draw(blankTexRef.current, toTex, p, p < 1, t)
                }
                if (p >= 1) {
                    phaseRef.current = "swap"
                    swapProgressRef.current = 0
                    return true
                }
                return true
            }

            const targetP = activeRef.current ? 1 : 0
            const step = dt / dur
            const prev = swapProgressRef.current
            if (prev < targetP) {
                swapProgressRef.current = Math.min(targetP, prev + step)
            } else if (prev > targetP) {
                swapProgressRef.current = Math.max(targetP, prev - step)
            }
            const p = swapProgressRef.current
            const moving = p !== targetP || p !== prev
            if (texARef.current && texBRef.current) {
                draw(texARef.current, texBRef.current, p, moving, t)
            }
            return moving
        }

        const loop = (t: number) => {
            const keepGoing = tick(t)
            if (keepGoing) {
                raf = requestAnimationFrame(loop)
            } else {
                running = false
            }
        }

        const startLoop = () => {
            if (running) return
            running = true
            lastT = performance.now()
            raf = requestAnimationFrame(loop)
        }

        wakeLoopRef.current = startLoop
        startLoop()

        return () => {
            wakeLoopRef.current = null
            cancelAnimationFrame(raf)
        }
    }, [])

    if (isStatic) {
        const staticSrc = active ? srcB : srcA
        return staticSrc ? (
            <img src={staticSrc} alt="" style={getImgStyle(fit)} />
        ) : null
    }

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                display: "block",
                pointerEvents: "none",
            }}
        />
    )
}

const MOSAIC_VERT = LIQUID_VERT

const MOSAIC_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_from;
uniform sampler2D u_to;
uniform float u_progress;
uniform vec2 u_resolution;
uniform vec2 u_fromSize;
uniform vec2 u_toSize;
uniform float u_edge;
uniform float u_cells;
uniform float u_fit;

vec2 fitUV(vec2 uv, vec2 texSize) {
    float texAspect = texSize.x / texSize.y;
    float boxAspect = u_resolution.x / u_resolution.y;
    bool texWider = texAspect > boxAspect;
    bool shrinkX = u_fit > 0.5 ? !texWider : texWider;
    vec2 scale = vec2(1.0);
    if (shrinkX) {
        scale.x = boxAspect / texAspect;
    } else {
        scale.y = texAspect / boxAspect;
    }
    return (uv - 0.5) * scale + 0.5;
}

vec4 sampleFit(sampler2D tex, vec2 uv) {
    if (u_fit > 0.5 && (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)) {
        return vec4(0.0);
    }
    return texture2D(tex, clamp(uv, 0.0, 1.0));
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
    vec2 uv = v_uv;

    // The grid follows the panel's own aspect so cells stay square instead
    // of stretching into rectangles on non-square panels.
    float boxAspect = u_resolution.x / u_resolution.y;
    vec2 grid = uv * vec2(u_cells * max(boxAspect, 1.0), u_cells * max(1.0 / boxAspect, 1.0));
    vec2 cellId = floor(grid);
    float rnd = hash(cellId);

    // Same remapped-threshold trick as Liquid/Wave: guarantees mask is
    // exactly 1.0 at progress=0 and exactly 0.0 at progress=1, for every
    // cell regardless of edge/stagger amount.
    float threshold = mix(-u_edge, 1.0 + u_edge, u_progress);
    float mask = smoothstep(threshold - u_edge, threshold + u_edge, rnd);

    vec2 uvFrom = fitUV(uv, u_fromSize);
    vec2 uvTo = fitUV(uv, u_toSize);

    vec4 colFrom = sampleFit(u_from, uvFrom);
    vec4 colTo = sampleFit(u_to, uvTo);

    gl_FragColor = mix(colTo, colFrom, mask);
}
`

function MosaicCanvasLayer({
    srcA,
    srcB,
    active,
    duration,
    edge,
    cells,
    fit,
    size,
    isStatic,
}: {
    srcA?: string
    srcB?: string
    active: boolean
    duration: number
    edge: number
    cells: number
    fit: "cover" | "contain"
    size: { w: number; h: number }
    isStatic: boolean
}) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const glRef = React.useRef<WebGLRenderingContext | null>(null)
    const programRef = React.useRef<WebGLProgram | null>(null)
    const texARef = React.useRef<GLTexture | null>(null)
    const texBRef = React.useRef<GLTexture | null>(null)
    const blankTexRef = React.useRef<GLTexture | null>(null)

    const phaseRef = React.useRef<"appear" | "swap">("appear")
    const appearStartRef = React.useRef(0)
    const swapProgressRef = React.useRef(0)
    const activeRef = React.useRef(active)
    const durationRef = React.useRef(duration)
    const edgeRef = React.useRef(edge)
    const cellsRef = React.useRef(cells)
    const fitRef = React.useRef(fit)

    const wakeLoopRef = React.useRef<(() => void) | null>(null)

    React.useEffect(() => {
        if (isStatic) return
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", {
            premultipliedAlpha: false,
            alpha: true,
        }) as WebGLRenderingContext | null
        if (!gl) return
        glRef.current = gl

        const program = createProgram(gl, MOSAIC_VERT, MOSAIC_FRAG)
        programRef.current = program
        gl.useProgram(program)

        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )
        const posLoc = gl.getAttribLocation(program, "a_position")
        gl.enableVertexAttribArray(posLoc)
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

        texARef.current = makePlaceholderTexture(gl)
        texBRef.current = makePlaceholderTexture(gl)
        blankTexRef.current = makePlaceholderTexture(gl)

        appearStartRef.current = performance.now()

        return () => {
            gl.deleteProgram(program)
            gl.deleteBuffer(buffer)
            if (texARef.current) gl.deleteTexture(texARef.current.texture)
            if (texBRef.current) gl.deleteTexture(texBRef.current.texture)
            if (blankTexRef.current)
                gl.deleteTexture(blankTexRef.current.texture)
        }
    }, [isStatic])

    React.useEffect(() => {
        const gl = glRef.current
        if (!gl || !srcA) return
        let cancelled = false
        loadTexture(gl, srcA).then((t) => {
            if (cancelled) {
                gl.deleteTexture(t.texture)
                return
            }
            const old = texARef.current
            texARef.current = t
            if (old) gl.deleteTexture(old.texture)
        })
        return () => {
            cancelled = true
        }
    }, [srcA])

    React.useEffect(() => {
        const gl = glRef.current
        if (!gl || !srcB) return
        let cancelled = false
        loadTexture(gl, srcB).then((t) => {
            if (cancelled) {
                gl.deleteTexture(t.texture)
                return
            }
            const old = texBRef.current
            texBRef.current = t
            if (old) gl.deleteTexture(old.texture)
        })
        return () => {
            cancelled = true
        }
    }, [srcB])

    React.useEffect(() => {
        const canvas = canvasRef.current
        const gl = glRef.current
        if (!canvas || !gl) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.max(1, Math.round(size.w * dpr))
        canvas.height = Math.max(1, Math.round(size.h * dpr))
        gl.viewport(0, 0, canvas.width, canvas.height)
    }, [size.w, size.h])

    React.useEffect(() => {
        activeRef.current = active
        durationRef.current = duration
        wakeLoopRef.current?.()
    }, [active, duration])

    React.useEffect(() => {
        edgeRef.current = edge
        cellsRef.current = cells
        fitRef.current = fit
    }, [edge, cells, fit])

    React.useEffect(() => {
        const gl = glRef.current
        const program = programRef.current
        const canvas = canvasRef.current
        if (!gl || !program || !canvas) return

        const uFrom = gl.getUniformLocation(program, "u_from")
        const uTo = gl.getUniformLocation(program, "u_to")
        const uProgress = gl.getUniformLocation(program, "u_progress")
        const uResolution = gl.getUniformLocation(program, "u_resolution")
        const uFromSize = gl.getUniformLocation(program, "u_fromSize")
        const uToSize = gl.getUniformLocation(program, "u_toSize")
        const uEdge = gl.getUniformLocation(program, "u_edge")
        const uCells = gl.getUniformLocation(program, "u_cells")
        const uFit = gl.getUniformLocation(program, "u_fit")

        let raf = 0
        let running = false
        let lastT = performance.now()

        const draw = (fromTex: GLTexture, toTex: GLTexture, p: number) => {
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.useProgram(program)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, fromTex.texture)
            gl.uniform1i(uFrom, 0)
            gl.uniform2f(uFromSize, fromTex.width, fromTex.height)

            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, toTex.texture)
            gl.uniform1i(uTo, 1)
            gl.uniform2f(uToSize, toTex.width, toTex.height)

            gl.uniform1f(uProgress, p)
            gl.uniform2f(uResolution, canvas.width, canvas.height)
            gl.uniform1f(uEdge, edgeRef.current)
            gl.uniform1f(uCells, cellsRef.current)
            gl.uniform1f(uFit, fitRef.current === "contain" ? 1 : 0)

            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        const tick = (t: number): boolean => {
            const dt = Math.max(0, (t - lastT) / 1000)
            lastT = t
            const dur = Math.max(0.001, durationRef.current)

            if (phaseRef.current === "appear") {
                const elapsed = (t - appearStartRef.current) / 1000
                const p = Math.min(1, elapsed / dur)
                const toTex = texARef.current
                if (blankTexRef.current && toTex) {
                    draw(blankTexRef.current, toTex, p)
                }
                if (p >= 1) {
                    phaseRef.current = "swap"
                    swapProgressRef.current = 0
                    return true
                }
                return true
            }

            const targetP = activeRef.current ? 1 : 0
            const step = dt / dur
            const prev = swapProgressRef.current
            if (prev < targetP) {
                swapProgressRef.current = Math.min(targetP, prev + step)
            } else if (prev > targetP) {
                swapProgressRef.current = Math.max(targetP, prev - step)
            }
            const p = swapProgressRef.current
            const moving = p !== targetP || p !== prev
            if (texARef.current && texBRef.current) {
                draw(texARef.current, texBRef.current, p)
            }
            return moving
        }

        const loop = (t: number) => {
            const keepGoing = tick(t)
            if (keepGoing) {
                raf = requestAnimationFrame(loop)
            } else {
                running = false
            }
        }

        const startLoop = () => {
            if (running) return
            running = true
            lastT = performance.now()
            raf = requestAnimationFrame(loop)
        }

        wakeLoopRef.current = startLoop
        startLoop()

        return () => {
            wakeLoopRef.current = null
            cancelAnimationFrame(raf)
        }
    }, [])

    if (isStatic) {
        const staticSrc = active ? srcB : srcA
        return staticSrc ? (
            <img src={staticSrc} alt="" style={getImgStyle(fit)} />
        ) : null
    }

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                display: "block",
                pointerEvents: "none",
            }}
        />
    )
}

export default function ImageSwapReveal(props: Props) {
    const {
        hoverSwap,
        mobileSwap,
        imageA,
        imageB,
        link,
        linkNewTab,
        backgroundColor,
        radius,
        circle,
        borderWidth,
        borderColor,
        fit,
        maskStyle,
        wipeDirection,
        duration,
        segments,
        blindsOrientation,
        splitOrientation,
        circleOrigin,
        randomness,
        liquidEdge,
        liquidNoiseScale,
        liquidFlowSpeed,
        waveAmplitude,
        waveFrequency,
        waveSpeed,
        mosaicCells,
        mosaicStagger,
        appearTrigger,
        viewportTrigger,
        trackPoint,
        sectionTrackPoint,
        sectionSelector,
        sectionDelay,
        reverse,
        zoomScale,
    } = props

    const isStatic = useIsStaticRenderer()
    let isCanvas = false
    try {
        isCanvas = RenderTarget.current() === RenderTarget.canvas
    } catch {
        isCanvas = false
    }
    const forceRevealed = isStatic || isCanvas

    const panelRef = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ w: 420, h: 420 })
    const [sizeReady, setSizeReady] = React.useState(false)

    React.useEffect(() => {
        const el = panelRef.current
        if (!el) return
        const update = () => {
            setSize({ w: el.offsetWidth, h: el.offsetHeight })
            setSizeReady(true)
        }
        update()
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const effectiveRadius = circle ? "50%" : radius
    const effectiveAspectRatio = circle ? "1" : undefined
    const effectiveBorder =
        borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined

    const cx = size.w / 2
    const cy = size.h / 2
    const organicR = React.useMemo(
        () => safeOrganicRadius(cx, cy, size.w, size.h),
        [cx, cy, size.w, size.h]
    )

    const gridInfo = React.useMemo(
        () => computeGrid(segments, size.w, size.h),
        [segments, size.w, size.h, maskStyle]
    )

    const getPanelEl = React.useCallback(() => panelRef.current, [])
    const layerInView = useEdgeInView(
        getPanelEl,
        viewportTrigger,
        trackPoint,
        true
    )

    const sectionElRef = React.useRef<HTMLElement | null>(null)
    React.useEffect(() => {
        const trimmed = sectionSelector.trim()
        if (appearTrigger !== "sectionInView" || !trimmed) {
            sectionElRef.current = null
            return
        }
        const selector = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
        sectionElRef.current = document.querySelector<HTMLElement>(selector)
    }, [appearTrigger, sectionSelector])
    const getSectionEl = React.useCallback(() => sectionElRef.current, [])
    const sectionInView = useEdgeInView(
        getSectionEl,
        viewportTrigger,
        sectionTrackPoint,
        true
    )

    const [revealed, setRevealed] = React.useState(false)
    const [hoverLocked, setHoverLocked] = React.useState(false)

    React.useEffect(() => {
        if (!revealed) return
        setHoverLocked(true)
        const ms = getAppearMs(maskStyle, duration)
        const id = window.setTimeout(() => setHoverLocked(false), ms)
        return () => window.clearTimeout(id)
    }, [revealed])

    React.useEffect(() => {
        if (!sizeReady) return
        if (forceRevealed || appearTrigger === "onAppear") {
            setRevealed(true)
            return
        }
        const triggered =
            (appearTrigger === "layerInView" && layerInView) ||
            (appearTrigger === "sectionInView" && sectionInView)
        if (!triggered) return

        const delayMs = Math.max(0, sectionDelay) * 1000
        if (delayMs === 0) {
            setRevealed(true)
            return
        }
        const timeoutId = window.setTimeout(() => {
            setRevealed(true)
        }, delayMs)
        return () => window.clearTimeout(timeoutId)
    }, [
        sizeReady,
        forceRevealed,
        appearTrigger,
        layerInView,
        sectionInView,
        sectionDelay,
    ])

    const [active, setActive] = React.useState(false)
    const [hasSwapped, setHasSwapped] = React.useState(false)
    const [swapCount, setSwapCount] = React.useState(0)
    const [manualOrganicShape, setManualOrganicShape] =
        React.useState<OrganicShape | null>(null)
    const autoOrganicShape = React.useMemo(
        () => randomOrganicShape(randomness),
        [randomness]
    )
    const organicShape = manualOrganicShape ?? autoOrganicShape
    const organicPath = React.useMemo(
        () => organicPathFromShape(cx, cy, organicR, organicShape),
        [cx, cy, organicR, organicShape]
    )

    const [transitioning, setTransitioning] = React.useState(false)
    const transitionTimeoutRef = React.useRef<number | null>(null)

    React.useEffect(() => {
        return () => {
            if (transitionTimeoutRef.current) {
                window.clearTimeout(transitionTimeoutRef.current)
            }
        }
    }, [])

    const beginTransition = () => {
        setTransitioning(true)
        if (transitionTimeoutRef.current) {
            window.clearTimeout(transitionTimeoutRef.current)
        }
        const ms = getTransitionMs(maskStyle, duration)
        transitionTimeoutRef.current = window.setTimeout(() => {
            setTransitioning(false)
        }, ms)
    }

    const handleEnter = () => {
        if (hoverLocked) return
        setHasSwapped(true)
        setActive(true)
        setSwapCount((n) => n + 1)
        setManualOrganicShape(randomOrganicShape(randomness))
        beginTransition()
    }
    const handleLeave = () => {
        if (hoverLocked) return
        setActive(false)
        setSwapCount((n) => n + 1)
        beginTransition()
    }

    const [isTouchDevice, setIsTouchDevice] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(hover: none) and (pointer: coarse)")
        const update = () => setIsTouchDevice(mq.matches)
        update()
        mq.addEventListener
            ? mq.addEventListener("change", update)
            : mq.addListener(update)
        return () => {
            mq.removeEventListener
                ? mq.removeEventListener("change", update)
                : mq.removeListener(update)
        }
    }, [])

    const handleTap = (e: React.MouseEvent) => {
        if (!hoverSwap || !isTouchDevice || !mobileSwap) return
        e.preventDefault()
        if (hoverLocked) return
        if (active) {
            handleLeave()
        } else {
            handleEnter()
        }
    }

    // On touch devices, mouseenter/mouseleave are unreliable (some browsers
    // still fire them on tap), so when swapping is disabled for mobile we
    // also stop wiring up the hover handlers, not just the tap handler.
    const swapEnabled = hoverSwap && (!isTouchDevice || mobileSwap)

    const isReverseTransition = reverse && hasSwapped && !active
    const targetSrc = active
        ? (getImageSrc(imageB) ?? DEFAULT_IMAGE_B)
        : (getImageSrc(imageA) ?? DEFAULT_IMAGE_A)
    const sourceSrc = hasSwapped
        ? active
            ? (getImageSrc(imageA) ?? DEFAULT_IMAGE_A)
            : (getImageSrc(imageB) ?? DEFAULT_IMAGE_B)
        : undefined

    const frontSrc = isReverseTransition ? sourceSrc : targetSrc
    const backSrc = isReverseTransition ? targetSrc : sourceSrc
    const mountKey = `${active ? "B" : "A"}-${swapCount}`

    const href = link?.trim() || undefined

    if (forceRevealed) {
        const panel =
            circle || radius > 0 ? (
                <div
                    ref={panelRef}
                    style={{
                        ...panelStyle,
                        aspectRatio: effectiveAspectRatio,
                        borderRadius: effectiveRadius,
                        background: backgroundColor,
                        border: effectiveBorder,
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            transform: "scale(1.003)",
                            transformOrigin: "center",
                        }}
                    >
                        <img
                            src={getImageSrc(imageA) ?? DEFAULT_IMAGE_A}
                            alt=""
                            style={getImgStyle(fit)}
                        />
                    </div>
                </div>
            ) : (
                <div
                    ref={panelRef}
                    style={{
                        ...panelStyle,
                        aspectRatio: effectiveAspectRatio,
                        borderRadius: effectiveRadius,
                        background: backgroundColor,
                        border: effectiveBorder,
                    }}
                >
                    <img
                        src={getImageSrc(imageA) ?? DEFAULT_IMAGE_A}
                        alt=""
                        style={getImgStyle(fit)}
                    />
                </div>
            )
        return href ? (
            <a
                href={href}
                target={linkNewTab ? "_blank" : undefined}
                rel={linkNewTab ? "noopener noreferrer" : undefined}
                style={linkStyle}
            >
                {panel}
            </a>
        ) : (
            panel
        )
    }

    let frontLayer: React.ReactNode = null

    if (
        maskStyle === "liquid" ||
        maskStyle === "wave" ||
        maskStyle === "mosaic"
    ) {
    } else if (maskStyle === "organic") {
        frontLayer = (
            <OrganicGrowLayer
                mountKey={mountKey}
                cx={cx}
                cy={cy}
                path={organicPath}
                duration={duration}
                src={frontSrc}
                isStatic={forceRevealed}
                fit={fit}
            />
        )
    } else if (maskStyle === "zoom") {
        frontLayer = (
            <ZoomGrowLayer
                mountKey={mountKey}
                duration={duration}
                src={frontSrc}
                isStatic={forceRevealed}
                fit={fit}
                scale={zoomScale}
            />
        )
    } else if (maskStyle === "split") {
        frontLayer = (
            <SplitGrowLayer
                transitionId={mountKey}
                orientation={splitOrientation}
                duration={duration}
                src={frontSrc}
                isStatic={forceRevealed}
                fit={fit}
                reverse={isReverseTransition}
            />
        )
    } else if (maskStyle === "blinds") {
        frontLayer = (
            <BlindsGrowLayer
                mountKey={mountKey}
                segments={segments}
                orientation={blindsOrientation}
                size={size}
                duration={duration}
                src={frontSrc}
                isStatic={forceRevealed}
                fit={fit}
                reverse={isReverseTransition}
            />
        )
    } else if (maskStyle === "grid") {
        frontLayer = (
            <GridGrowLayer
                mountKey={mountKey}
                cols={gridInfo.cols}
                rows={gridInfo.rows}
                size={size}
                duration={duration}
                src={frontSrc}
                isStatic={forceRevealed}
                fit={fit}
                reverse={isReverseTransition}
            />
        )
    } else {
        const clips = getMaskClips(maskStyle, circleOrigin, wipeDirection, size)
        frontLayer = (
            <ClipGrowLayer
                mountKey={mountKey}
                hiddenClip={clips.hidden}
                visibleClip={clips.visible}
                duration={duration}
                src={frontSrc}
                isStatic={forceRevealed}
                fit={fit}
                reverse={isReverseTransition}
            />
        )
    }

    const panelContent = (
        <>
            <img
                src={getImageSrc(imageA) ?? DEFAULT_IMAGE_A}
                alt=""
                aria-hidden="true"
                style={sizingProbeStyle}
            />

            {revealed &&
                (maskStyle === "liquid" ? (
                    <LiquidCanvasLayer
                        srcA={getImageSrc(imageA) ?? DEFAULT_IMAGE_A}
                        srcB={getImageSrc(imageB) ?? DEFAULT_IMAGE_B}
                        active={active}
                        duration={duration}
                        edge={liquidEdge}
                        noiseScale={liquidNoiseScale}
                        flowSpeed={liquidFlowSpeed}
                        fit={fit}
                        size={size}
                        isStatic={forceRevealed}
                    />
                ) : maskStyle === "wave" ? (
                    <WaveCanvasLayer
                        srcA={getImageSrc(imageA) ?? DEFAULT_IMAGE_A}
                        srcB={getImageSrc(imageB) ?? DEFAULT_IMAGE_B}
                        active={active}
                        duration={duration}
                        edge={WAVE_MAX_SOFTNESS}
                        amplitude={waveAmplitude * WAVE_AMPLITUDE_SCALE}
                        frequency={
                            WAVE_FREQ_MIN +
                            ((waveFrequency - 1) / 19) *
                                (WAVE_FREQ_MAX - WAVE_FREQ_MIN)
                        }
                        speed={waveSpeed}
                        fit={fit}
                        size={size}
                        isStatic={forceRevealed}
                    />
                ) : maskStyle === "mosaic" ? (
                    <MosaicCanvasLayer
                        srcA={getImageSrc(imageA) ?? DEFAULT_IMAGE_A}
                        srcB={getImageSrc(imageB) ?? DEFAULT_IMAGE_B}
                        active={active}
                        duration={duration}
                        edge={mosaicStagger}
                        cells={mosaicCells}
                        fit={fit}
                        size={size}
                        isStatic={forceRevealed}
                    />
                ) : (
                    <>
                        {backSrc && (
                            <div style={backLayerStyle}>
                                <img
                                    src={backSrc}
                                    alt=""
                                    style={getImgStyle(fit)}
                                />
                            </div>
                        )}
                        {frontLayer}
                    </>
                ))}
        </>
    )

    const panel =
        circle || radius > 0 ? (
            <div
                ref={panelRef}
                onMouseEnter={swapEnabled ? handleEnter : undefined}
                onMouseLeave={swapEnabled ? handleLeave : undefined}
                onClick={swapEnabled ? handleTap : undefined}
                style={{
                    ...panelStyle,
                    aspectRatio: effectiveAspectRatio,
                    borderRadius: effectiveRadius,
                    background: backgroundColor,
                    border: effectiveBorder,
                }}
            >
                {" "}
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        transform: "scale(1.003)",
                        transformOrigin: "center",
                    }}
                >
                    {panelContent}
                </div>
            </div>
        ) : (
            <div
                ref={panelRef}
                onMouseEnter={swapEnabled ? handleEnter : undefined}
                onMouseLeave={swapEnabled ? handleLeave : undefined}
                onClick={swapEnabled ? handleTap : undefined}
                style={{
                    ...panelStyle,
                    aspectRatio: effectiveAspectRatio,
                    background: backgroundColor,
                    border: effectiveBorder,
                }}
            >
                {panelContent}
            </div>
        )

    return href ? (
        <a
            href={href}
            target={linkNewTab ? "_blank" : undefined}
            rel={linkNewTab ? "noopener noreferrer" : undefined}
            style={linkStyle}
        >
            {panel}
        </a>
    ) : (
        panel
    )
}

const panelStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    boxSizing: "border-box",
    isolation: "isolate",
}

const linkStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    color: "inherit",
    textDecoration: "none",
}

const imageLayer: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
}

const backLayerStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
}

function getImgStyle(fit: "cover" | "contain"): React.CSSProperties {
    return {
        width: "100%",
        height: "100%",
        objectFit: fit,
        display: "block",
    }
}

const sizingProbeStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    height: "auto",
    opacity: 0,
    pointerEvents: "none",
}

addPropertyControls(ImageSwapReveal, {
    imageA: {
        type: ControlType.Image,
        title: "Image A",
        defaultValue: DEFAULT_IMAGE_A,
    },
    imageB: {
        type: ControlType.Image,
        title: "Image B",
        defaultValue: DEFAULT_IMAGE_B,
        hidden: ({ hoverSwap }) => !hoverSwap,
    },
    hoverSwap: {
        type: ControlType.Boolean,
        title: "Swap",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    mobileSwap: {
        type: ControlType.Boolean,
        title: "Tap Swap",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ hoverSwap }) => !hoverSwap,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0, 0, 0, 0)",
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
    },
    circle: {
        type: ControlType.Boolean,
        title: "Circle",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 120,
        hidden: ({ circle }) => circle,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(0, 0, 0, 1)",
        hidden: ({ borderWidth }) => !borderWidth,
    },
    maskStyle: {
        type: ControlType.Enum,
        title: "Transition",
        options: [
            "wipe",
            "circle",
            "diamond",
            "split",
            "blinds",
            "grid",
            "organic",
            "liquid",
            "wave",
            "mosaic",
            "zoom",
        ],
        optionTitles: [
            "Slide",
            "Circle",
            "Diamond",
            "Split",
            "Blinds",
            "Grid",
            "Blob",
            "Liquid",
            "Wave",
            "Mosaic",
            "Zoom",
        ],
        defaultValue: "wipe",
    },
    wipeDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["top", "bottom", "left", "right"],
        optionTitles: [
            "Top → Bottom",
            "Bottom → Top",
            "Left → Right",
            "Right → Left",
        ],
        defaultValue: "top",
        hidden: ({ maskStyle }) => maskStyle !== "wipe",
    },
    blindsOrientation: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        hidden: ({ maskStyle }) => maskStyle !== "blinds",
    },
    splitOrientation: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        hidden: ({ maskStyle }) => maskStyle !== "split",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.8,
        min: 0.6,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    segments: {
        type: ControlType.Number,
        title: "Cells",
        defaultValue: 8,
        min: 2,
        max: 20,
        step: 1,
        hidden: ({ maskStyle }) => !["blinds", "grid"].includes(maskStyle),
    },
    circleOrigin: {
        type: ControlType.Enum,
        title: "Start Point",
        options: [
            "center",
            "top",
            "bottom",
            "left",
            "right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
        ],
        optionTitles: [
            "Center",
            "Top",
            "Bottom",
            "Left",
            "Right",
            "Top Left",
            "Top Right",
            "Bottom Left",
            "Bottom Right",
        ],
        defaultValue: "center",
        hidden: ({ maskStyle }) => maskStyle !== "circle",
    },
    randomness: {
        type: ControlType.Number,
        title: "Distort",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        description: "0 is a smooth circle, 100 is highly distorted.",
        hidden: ({ maskStyle }) => maskStyle !== "organic",
    },
    liquidEdge: {
        type: ControlType.Number,
        title: "Softness",
        defaultValue: 0.12,
        min: 0.02,
        max: 0.4,
        step: 0.01,
        hidden: ({ maskStyle }) => maskStyle !== "liquid",
    },
    liquidNoiseScale: {
        type: ControlType.Number,
        title: "Noise",
        defaultValue: 2.5,
        min: 1,
        max: 8,
        step: 0.5,
        hidden: ({ maskStyle }) => maskStyle !== "liquid",
    },
    liquidFlowSpeed: {
        type: ControlType.Number,
        title: "Flow Speed",
        defaultValue: 0.08,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ maskStyle }) => maskStyle !== "liquid",
    },
    waveAmplitude: {
        type: ControlType.Number,
        title: "Amplitude",
        defaultValue: 0.27,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ maskStyle }) => maskStyle !== "wave",
    },
    waveFrequency: {
        type: ControlType.Number,
        title: "Frequency",
        defaultValue: 10,
        min: 1,
        max: 20,
        step: 1,
        hidden: ({ maskStyle }) => maskStyle !== "wave",
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
        hidden: ({ maskStyle }) => maskStyle !== "wave",
    },
    mosaicCells: {
        type: ControlType.Number,
        title: "Cells",
        defaultValue: 8,
        min: 2,
        max: 24,
        step: 1,
        hidden: ({ maskStyle }) => maskStyle !== "mosaic",
    },
    mosaicStagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.2,
        min: 0.02,
        max: 0.5,
        step: 0.01,
        description: "Delay between blocks.",
        hidden: ({ maskStyle }) => maskStyle !== "mosaic",
    },
    zoomScale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 1.08,
        min: 1,
        max: 2,
        step: 0.01,
        hidden: ({ maskStyle }) => maskStyle !== "zoom",
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Reverse the animation on hover out.",
        hidden: ({ maskStyle }) =>
            !["wipe", "circle", "diamond", "split", "blinds", "grid"].includes(
                maskStyle
            ),
    },
    appearTrigger: {
        type: ControlType.Enum,
        title: "Reveal Trigger",
        options: ["onAppear", "layerInView", "sectionInView"],
        optionTitles: ["On Load", "Image in View", "Section in View"],
        defaultValue: "onAppear",
    },
    sectionSelector: {
        type: ControlType.String,
        title: "Section ID",
        defaultValue: "",
        placeholder: "diamond",
        description: "ID of the section that triggers the reveal.",
        hidden: ({ appearTrigger }) => appearTrigger !== "sectionInView",
    },
    viewportTrigger: {
        type: ControlType.Enum,
        title: "Viewport",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        hidden: ({ appearTrigger }) =>
            !["layerInView", "sectionInView"].includes(appearTrigger),
    },
    trackPoint: {
        type: ControlType.Enum,
        title: "Track Point",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top of Image", "Center of Image", "Bottom of Image"],
        defaultValue: "center",
        hidden: ({ appearTrigger }) => appearTrigger !== "layerInView",
    },
    sectionTrackPoint: {
        type: ControlType.Enum,
        title: "Track Point",
        options: ["top", "center", "bottom"],
        optionTitles: [
            "Top of Section",
            "Center of Section",
            "Bottom of Section",
        ],
        defaultValue: "center",
        hidden: ({ appearTrigger }) => appearTrigger !== "sectionInView",
    },
    sectionDelay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
        hidden: ({ appearTrigger }) =>
            !["layerInView", "sectionInView"].includes(appearTrigger),
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    linkNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ link }) => !link,
    },
} as any)
