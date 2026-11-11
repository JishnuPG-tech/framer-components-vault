import * as React from "react"
import {
    motion,
    animate,
    useMotionValue,
    useSpring,
    useTransform,
    useReducedMotion,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface StickerConfig {
    image?: ResponsiveImageValue
    label?: string
    width?: number
    initialX?: number
    initialY?: number
    rotation?: number
    alt?: string
}

interface AppearanceSettings {
    backgroundColor: string
    overflow: "hidden" | "visible"
    outlineEnabled: boolean
    outlineColor: string
    outlineWidth: number
    globalScale: number
}

type PeelDirection = "topLeft" | "topRight" | "bottomLeft" | "bottomRight"

interface LiftSettings {
    liftScale: number
    shadowX: number
    shadowY: number
    shadowColor: string
    shadowBlur: number
    peelDirection: PeelDirection
    peelFlap: number
    peelAmount: number
    peelTilt: number
    gloss: number
    maxRotation: number
    tiltSensitivity: number
}

interface MotionSettings {
    pickupStiffness: number
    pickupDamping: number
    landingStiffness: number
    landingDamping: number
    dragEnabled: boolean
    respectReducedMotion: boolean
}

interface BoundsSettings {
    padding: number
    constrain: boolean
    resetKey: string
}

interface StickerBoardProps {
    stickers: StickerConfig[]
    appearance: Partial<AppearanceSettings>
    liftEffect: Partial<LiftSettings>
    motionSettings: Partial<MotionSettings>
    bounds: Partial<BoundsSettings>
    style?: React.CSSProperties
}

// ---------------------------------------------------------------------------
// Defaults & placeholders
// ---------------------------------------------------------------------------

const svgDataUri = (body: string): string =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${body}</svg>`
    )}`

const PLACEHOLDERS: string[] = [
    svgDataUri(
        `<polygon points="100,8 124,70 192,72 140,114 160,184 100,144 40,184 60,114 8,72 76,70" fill="#FFC531"/>`
    ),
    svgDataUri(
        `<path d="M100 180 C 40 132 10 96 10 60 C 10 30 34 12 60 12 C 78 12 92 22 100 36 C 108 22 122 12 140 12 C 166 12 190 30 190 60 C 190 96 160 132 100 180 Z" fill="#FF5A5F"/>`
    ),
    svgDataUri(
        `<path d="M116 6 L38 112 L88 112 L68 194 L162 76 L108 76 Z" fill="#3B82F6"/>`
    ),
]

const DEFAULT_APPEARANCE: AppearanceSettings = {
    backgroundColor: "#F4F4F5",
    overflow: "hidden",
    outlineEnabled: true,
    outlineColor: "#FFFFFF",
    outlineWidth: 4,
    globalScale: 1,
}

const DEFAULT_LIFT: LiftSettings = {
    liftScale: 1.02,
    shadowX: 8,
    shadowY: 10,
    shadowColor: "rgba(0, 0, 0, 0.15)",
    shadowBlur: 0.5,
    peelDirection: "topLeft",
    peelFlap: 12,
    peelAmount: 9,
    peelTilt: 8,
    gloss: 0.35,
    maxRotation: 2,
    tiltSensitivity: 0.004,
}

const DEFAULT_MOTION: MotionSettings = {
    pickupStiffness: 150,
    pickupDamping: 38,
    landingStiffness: 120,
    landingDamping: 28,
    dragEnabled: true,
    respectReducedMotion: true,
}

const DEFAULT_BOUNDS: BoundsSettings = {
    padding: 0,
    constrain: true,
    resetKey: "",
}

const DEFAULT_STICKERS: StickerConfig[] = [
    {
        label: "Star",
        width: 150,
        initialX: 30,
        initialY: 30,
        rotation: -8,
        alt: "Star sticker",
    },
    {
        label: "Heart",
        width: 130,
        initialX: 68,
        initialY: 42,
        rotation: 7,
        alt: "Heart sticker",
    },
    {
        label: "Bolt",
        width: 120,
        initialX: 48,
        initialY: 70,
        rotation: 0,
        alt: "Lightning bolt sticker",
    },
]

/** Falloff of the traveling peel bulge, in sticker-width units. */
const PEEL_SIGMA = 0.3
/** Degrees of peel tilt per px/s of drag velocity, before clamping. */
const PEEL_TILT_RESPONSE = 0.012

/**
 * Per-direction peel geometry: rotate3d axis that lifts the named corner,
 * the opposite corner as pivot, the gradient angle pointing away from the
 * lifted corner, and the shimmer band's sweep (as % offsets of a 3x-sized
 * gradient layer, start -> end).
 */
const PEEL_DIRS: Record<
    PeelDirection,
    {
        ax: number
        ay: number
        origin: string
        angle: number
        sweep: { x0: number; y0: number; x1: number; y1: number }
        /** Path of the traveling wave bulge, in sticker uv units. */
        wave: { x0: number; y0: number; x1: number; y1: number }
    }
> = {
    topLeft: {
        ax: -1,
        ay: 1,
        origin: "100% 100%",
        angle: 135,
        sweep: { x0: -66.6, y0: -66.6, x1: 0, y1: 0 },
        wave: { x0: -0.25, y0: -0.25, x1: 1.25, y1: 1.25 },
    },
    topRight: {
        ax: -1,
        ay: -1,
        origin: "0% 100%",
        angle: 225,
        sweep: { x0: 0, y0: -66.6, x1: -66.6, y1: 0 },
        wave: { x0: 1.25, y0: -0.25, x1: -0.25, y1: 1.25 },
    },
    bottomLeft: {
        ax: 1,
        ay: 1,
        origin: "100% 0%",
        angle: 45,
        sweep: { x0: -66.6, y0: 0, x1: 0, y1: -66.6 },
        wave: { x0: -0.25, y0: 1.25, x1: 1.25, y1: -0.25 },
    },
    bottomRight: {
        ax: 1,
        ay: -1,
        origin: "0% 0%",
        angle: 315,
        sweep: { x0: 0, y0: 0, x1: -66.6, y1: -66.6 },
        wave: { x0: 1.25, y0: 1.25, x1: -0.25, y1: -0.25 },
    },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clamp a top/left position so the sticker box stays inside the container.
 * When the sticker is larger than the available space the bounds would
 * invert, so the sticker is centered instead of producing NaN/jitter.
 */
function clampAxis(
    value: number,
    size: number,
    container: number,
    pad: number,
    constrain: boolean
): number {
    if (!Number.isFinite(value)) return 0
    if (!constrain || container <= 0) return value
    const lo = pad
    const hi = container - size - pad
    if (hi < lo) return (container - size) / 2
    return Math.min(Math.max(value, lo), hi)
}

const clamp = (v: number, lo: number, hi: number) =>
    Math.min(Math.max(v, lo), hi)

/** 0 at rest and while held, peaking mid-transition — the peel transient. */
const peelTransient = (v: number) => Math.sin(Math.PI * clamp(v, 0, 1))

/**
 * Multi-direction zero-blur drop-shadow outline. Only used for the static
 * canvas/export render, where the live SVG underlay is unnecessary.
 */
function chainedOutlineFilter(width: number, color: string): string {
    if (width <= 0) return "none"
    const d = Math.max(0.5, width)
    const g = +(d * 0.7071).toFixed(2)
    const dirs: Array<[number, number]> = [
        [d, 0],
        [-d, 0],
        [0, d],
        [0, -d],
        [g, g],
        [g, -g],
        [-g, g],
        [-g, -g],
    ]
    return dirs
        .map(([dx, dy]) => `drop-shadow(${dx}px ${dy}px 0 ${color})`)
        .join(" ")
}

function stickerSrc(sticker: StickerConfig, index: number): string {
    return sticker.image?.src || PLACEHOLDERS[index % PLACEHOLDERS.length]
}

/**
 * Displacement map for the traveling peel bulge: a radial bump centered
 * in the map. Red shifts X, green shifts Y; 128 is neutral. Vectors point
 * toward the bump center so feDisplacementMap samples inward, magnifying
 * the area under the wavefront like lifted vinyl. The bump is positioned
 * per frame by moving the feImage along the peel diagonal, which makes
 * the bend roll across the sticker instead of inflating in place.
 * Generated once and shared by every sticker.
 */
let bumpMapCache: string | null = null
function getBumpMap(): string | null {
    if (bumpMapCache) return bumpMapCache
    if (typeof document === "undefined") return null
    const size = 160
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    const img = ctx.createImageData(size, size)
    for (let j = 0; j < size; j++) {
        for (let i = 0; i < size; i++) {
            const u = -0.5 + 2 * (i / (size - 1))
            const v = -0.5 + 2 * (j / (size - 1))
            const du = u - 0.5
            const dv = v - 0.5
            const r = Math.hypot(du, dv)
            const rn = r / PEEL_SIGMA
            const profile = Math.min(rn, 1) * Math.exp(-rn * rn)
            const nx = r === 0 ? 0 : -du / r
            const ny = r === 0 ? 0 : -dv / r
            const idx = 4 * (j * size + i)
            img.data[idx] = Math.round(128 + 127 * nx * profile)
            img.data[idx + 1] = Math.round(128 + 127 * ny * profile)
            img.data[idx + 2] = 128
            img.data[idx + 3] = 255
        }
    }
    ctx.putImageData(img, 0, 0)
    bumpMapCache = canvas.toDataURL()
    return bumpMapCache
}

// ---------------------------------------------------------------------------
// Static sticker (canvas / export rendering — no hooks, no interaction)
// ---------------------------------------------------------------------------

function StaticSticker(props: {
    sticker: StickerConfig
    index: number
    appearance: AppearanceSettings
}) {
    const { sticker, index, appearance } = props
    const src = stickerSrc(sticker, index)
    const width = Math.max(8, (sticker.width ?? 140) * appearance.globalScale)
    return (
        <div
            style={{
                position: "absolute",
                left: `${sticker.initialX ?? 50}%`,
                top: `${sticker.initialY ?? 50}%`,
                width,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation ?? 0}deg)`,
                pointerEvents: "none",
            }}
        >
            <img
                src={src}
                srcSet={sticker.image?.srcSet}
                alt={sticker.alt || sticker.label || ""}
                draggable={false}
                style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    filter: appearance.outlineEnabled
                        ? chainedOutlineFilter(
                              appearance.outlineWidth,
                              appearance.outlineColor
                          )
                        : "none",
                }}
            />
        </div>
    )
}

// ---------------------------------------------------------------------------
// Interactive sticker
// ---------------------------------------------------------------------------

interface StickerItemProps {
    sticker: StickerConfig
    index: number
    cw: number
    ch: number
    appearance: AppearanceSettings
    lift: LiftSettings
    motionCfg: MotionSettings
    bounds: BoundsSettings
    reduced: boolean
    boardRef: React.RefObject<HTMLDivElement>
    acquireZ: () => number
}

function StickerItem(props: StickerItemProps) {
    const {
        sticker,
        index,
        cw,
        ch,
        appearance,
        lift: liftCfg,
        motionCfg,
        bounds,
        reduced,
        boardRef,
        acquireZ,
    } = props

    const src = stickerSrc(sticker, index)
    const baseRotation = sticker.rotation ?? 0
    const wPx = Math.max(8, (sticker.width ?? 140) * appearance.globalScale)
    const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const shadowFilterId = `sb-shadow-${uid}`
    const outlineFilterId = `sb-outline-${uid}`
    const warpFilterId = `sb-warp-${uid}`
    const dir = PEEL_DIRS[liftCfg.peelDirection] ?? PEEL_DIRS.topLeft

    // Intrinsic aspect ratio, measured from the image itself
    const [aspect, setAspect] = React.useState(1)
    React.useEffect(() => {
        let alive = true
        const probe = new Image()
        probe.onload = () => {
            if (alive && probe.naturalWidth > 0 && probe.naturalHeight > 0) {
                setAspect(probe.naturalWidth / probe.naturalHeight)
            }
        }
        probe.src = src
        return () => {
            alive = false
        }
    }, [src])
    const hPx = wPx / aspect

    // Position: normalized center is the source of truth, pixels are derived
    const centerRef = React.useRef({
        cx: (sticker.initialX ?? 50) / 100,
        cy: (sticker.initialY ?? 50) / 100,
    })
    const movedRef = React.useRef(false)
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const prevResetRef = React.useRef(bounds.resetKey)
    React.useLayoutEffect(() => {
        if (prevResetRef.current !== bounds.resetKey) {
            prevResetRef.current = bounds.resetKey
            movedRef.current = false
        }
        if (!movedRef.current) {
            centerRef.current = {
                cx: (sticker.initialX ?? 50) / 100,
                cy: (sticker.initialY ?? 50) / 100,
            }
        }
        x.set(
            clampAxis(
                centerRef.current.cx * cw - wPx / 2,
                wPx,
                cw,
                bounds.padding,
                bounds.constrain
            )
        )
        y.set(
            clampAxis(
                centerRef.current.cy * ch - hPx / 2,
                hPx,
                ch,
                bounds.padding,
                bounds.constrain
            )
        )
    }, [
        cw,
        ch,
        wPx,
        hPx,
        bounds.padding,
        bounds.constrain,
        bounds.resetKey,
        sticker.initialX,
        sticker.initialY,
    ])

    // Lift progress drives scale, shadow, peel, and shimmer together
    const lift = useMotionValue(0)
    const scale = useTransform(lift, [0, 1], [1, liftCfg.liftScale])
    const shadowDX = useTransform(lift, [0, 1], [0, liftCfg.shadowX])
    const shadowDY = useTransform(lift, [0, 1], [0, liftCfg.shadowY])
    // Shadow strength lives in the color's alpha; lift only fades it in
    const shadowOpacity = useTransform(lift, [0, 1], [0, 1])

    // Directional shadow reveal: sweeps in from the lifted corner
    const shadowMask = useTransform(lift, (v) => {
        if (reduced) return "none"
        const p = -20 + clamp(v, 0, 1) * 150
        return `linear-gradient(${dir.angle}deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${p}%, rgba(0,0,0,0) ${p + 25}%)`
    })

    // Directional corner flap: peels up mid-transition, level when held
    const flapTransform = useTransform(lift, (v) => {
        const a = reduced ? 0 : peelTransient(v) * liftCfg.peelFlap
        return `rotate3d(${dir.ax}, ${dir.ay}, 0, ${a.toFixed(3)}deg)`
    })

    // Shimmer band sweeping diagonally across the sticker during the peel
    const glossOpacity = useTransform(lift, (v) =>
        reduced ? 0 : peelTransient(v) * liftCfg.gloss
    )
    const glossX = useTransform(
        lift,
        (v) =>
            `${dir.sweep.x0 + (dir.sweep.x1 - dir.sweep.x0) * clamp(v, 0, 1)}%`
    )
    const glossY = useTransform(
        lift,
        (v) =>
            `${dir.sweep.y0 + (dir.sweep.y1 - dir.sweep.y0) * clamp(v, 0, 1)}%`
    )

    // Velocity-driven flat rotation, smoothed by a spring so it never jitters
    const rotTarget = useMotionValue(0)
    const rotSpring = useSpring(rotTarget, { stiffness: 300, damping: 26 })
    const rotate = useTransform(rotSpring, (v) => baseRotation + v)

    // Peel: 3D tilt around the grab point, driven by drag velocity
    const tiltXTarget = useMotionValue(0)
    const tiltYTarget = useMotionValue(0)
    const rotateX = useSpring(tiltXTarget, { stiffness: 260, damping: 22 })
    const rotateY = useSpring(tiltYTarget, { stiffness: 260, damping: 22 })

    // Peel: a traveling bulge — one shared displacement map whose position
    // rolls along the peel diagonal as lift progresses, so the bend moves
    // across the sticker like a wave instead of inflating in place
    const bumpMap = getBumpMap()
    const [grabOrigin, setGrabOrigin] = React.useState({ u: 0.5, v: 0.5 })
    const dispMainRef = React.useRef<SVGFEDisplacementMapElement>(null)
    const dispShadowRef = React.useRef<SVGFEDisplacementMapElement>(null)
    const mapImgMainRef = React.useRef<SVGFEImageElement>(null)
    const mapImgShadowRef = React.useRef<SVGFEImageElement>(null)
    const peelPx = reduced ? 0 : (liftCfg.peelAmount / 100) * wPx
    const warpGroupRef = React.useRef<SVGGElement>(null)

    React.useEffect(() => {
        const wave = dir.wave
        const apply = (v: number) => {
            // The wave is a transient: it peaks mid-transition and is zero
            // at rest AND while held, so the steady states never run through
            // the displacement resampler (which is what caused jagged edges)
            const t = clamp(v, 0, 1)
            const s = peelTransient(v) * peelPx
            // Bump center travels corner-to-corner in sticker uv space; the
            // 2w x 2h feImage is positioned so its center sits on the path
            const ix = (wave.x0 + (wave.x1 - wave.x0) * t) * wPx - wPx
            const iy = (wave.y0 + (wave.y1 - wave.y0) * t) * hPx - hPx
            const sStr = String(s)
            const ixStr = String(ix)
            const iyStr = String(iy)
            dispMainRef.current?.setAttribute("scale", sStr)
            dispShadowRef.current?.setAttribute("scale", sStr)
            mapImgMainRef.current?.setAttribute("x", ixStr)
            mapImgMainRef.current?.setAttribute("y", iyStr)
            mapImgShadowRef.current?.setAttribute("x", ixStr)
            mapImgShadowRef.current?.setAttribute("y", iyStr)
            const g = warpGroupRef.current
            if (g) {
                if (s > 0.05) {
                    g.setAttribute("filter", `url(#${warpFilterId})`)
                } else {
                    g.removeAttribute("filter")
                }
            }
        }
        apply(lift.get())
        return lift.on("change", apply)
    }, [peelPx, warpFilterId, dir, wPx, hPx])

    const [z, setZ] = React.useState(index + 1)
    const [dragging, setDragging] = React.useState(false)
    // True from pickup until the landing finishes. While false, the 3D
    // perspective wrappers and will-change hints are dropped so browsers
    // render the resting sticker at full native resolution.
    const [engaged, setEngaged] = React.useState(false)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const liftAnimRef = React.useRef<{ stop: () => void } | null>(null)
    const tiltIdleTimer = React.useRef<number | null>(null)
    const dragStateRef = React.useRef<{
        pointerId: number
        rect: DOMRect
        grabX: number
        grabY: number
        lastX: number
        lastY: number
        lastT: number
        vx: number
        vy: number
    } | null>(null)

    const runLift = React.useCallback(
        (to: 0 | 1) => {
            liftAnimRef.current?.stop()
            const transition = reduced
                ? { duration: to === 1 ? 0.08 : 0.14, ease: "easeOut" as const }
                : {
                      type: "spring" as const,
                      stiffness:
                          to === 1
                              ? motionCfg.pickupStiffness
                              : motionCfg.landingStiffness,
                      damping:
                          to === 1
                              ? motionCfg.pickupDamping
                              : motionCfg.landingDamping,
                  }
            liftAnimRef.current = animate(lift, to, {
                ...transition,
                onComplete: () => {
                    if (to === 0 && !dragStateRef.current) setEngaged(false)
                },
            })
        },
        [
            reduced,
            motionCfg.pickupStiffness,
            motionCfg.pickupDamping,
            motionCfg.landingStiffness,
            motionCfg.landingDamping,
        ]
    )

    const clearTiltTimer = () => {
        if (tiltIdleTimer.current !== null) {
            window.clearTimeout(tiltIdleTimer.current)
            tiltIdleTimer.current = null
        }
    }

    const settleTilt = () => {
        rotTarget.set(0)
        tiltXTarget.set(0)
        tiltYTarget.set(0)
    }

    React.useEffect(
        () => () => {
            liftAnimRef.current?.stop()
            clearTiltTimer()
        },
        []
    )

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!motionCfg.dragEnabled || dragStateRef.current) return
        const board = boardRef.current
        if (!board) return
        e.preventDefault()
        rootRef.current?.setPointerCapture(e.pointerId)
        const rect = board.getBoundingClientRect()
        // Exact local grab point: offset between pointer and current position
        const grabX = e.clientX - rect.left - x.get()
        const grabY = e.clientY - rect.top - y.get()
        dragStateRef.current = {
            pointerId: e.pointerId,
            rect,
            grabX,
            grabY,
            lastX: e.clientX,
            lastY: e.clientY,
            lastT: e.timeStamp,
            vx: 0,
            vy: 0,
        }
        if (!reduced) {
            setGrabOrigin({
                u: clamp(grabX / wPx, 0, 1),
                v: clamp(grabY / hPx, 0, 1),
            })
        }
        setZ(acquireZ())
        setDragging(true)
        setEngaged(true)
        runLift(1)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const s = dragStateRef.current
        if (!s || e.pointerId !== s.pointerId) return
        const nextX = clampAxis(
            e.clientX - s.rect.left - s.grabX,
            wPx,
            cw,
            bounds.padding,
            bounds.constrain
        )
        const nextY = clampAxis(
            e.clientY - s.rect.top - s.grabY,
            hPx,
            ch,
            bounds.padding,
            bounds.constrain
        )
        x.set(nextX)
        y.set(nextY)
        movedRef.current = true
        if (cw > 0 && ch > 0) {
            centerRef.current = {
                cx: (nextX + wPx / 2) / cw,
                cy: (nextY + hPx / 2) / ch,
            }
        }

        const dt = e.timeStamp - s.lastT
        if (dt > 0) {
            s.vx = s.vx * 0.7 + ((e.clientX - s.lastX) / dt) * 1000 * 0.3
            s.vy = s.vy * 0.7 + ((e.clientY - s.lastY) / dt) * 1000 * 0.3
            if (!reduced) {
                if (liftCfg.maxRotation > 0) {
                    rotTarget.set(
                        clamp(
                            s.vx * liftCfg.tiltSensitivity,
                            -liftCfg.maxRotation,
                            liftCfg.maxRotation
                        )
                    )
                }
                if (liftCfg.peelTilt > 0) {
                    // Trailing edge lifts toward the viewer, like dragged paper
                    tiltYTarget.set(
                        clamp(
                            s.vx * PEEL_TILT_RESPONSE,
                            -liftCfg.peelTilt,
                            liftCfg.peelTilt
                        )
                    )
                    tiltXTarget.set(
                        clamp(
                            -s.vy * PEEL_TILT_RESPONSE,
                            -liftCfg.peelTilt,
                            liftCfg.peelTilt
                        )
                    )
                }
                clearTiltTimer()
                tiltIdleTimer.current = window.setTimeout(settleTilt, 90)
            }
        }
        s.lastX = e.clientX
        s.lastY = e.clientY
        s.lastT = e.timeStamp
    }

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        const s = dragStateRef.current
        if (!s || e.pointerId !== s.pointerId) return
        dragStateRef.current = null
        clearTiltTimer()
        settleTilt()
        setDragging(false)
        runLift(0)
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!motionCfg.dragEnabled) return
        const step = e.shiftKey ? 20 : 5
        let dx = 0
        let dy = 0
        if (e.key === "ArrowLeft") dx = -step
        else if (e.key === "ArrowRight") dx = step
        else if (e.key === "ArrowUp") dy = -step
        else if (e.key === "ArrowDown") dy = step
        else return
        e.preventDefault()
        const nextX = clampAxis(
            x.get() + dx,
            wPx,
            cw,
            bounds.padding,
            bounds.constrain
        )
        const nextY = clampAxis(
            y.get() + dy,
            hPx,
            ch,
            bounds.padding,
            bounds.constrain
        )
        x.set(nextX)
        y.set(nextY)
        movedRef.current = true
        if (cw > 0 && ch > 0) {
            centerRef.current = {
                cx: (nextX + wPx / 2) / cw,
                cy: (nextY + hPx / 2) / ch,
            }
        }
        setZ(acquireZ())
    }

    const dilateRadius = appearance.outlineEnabled
        ? Math.max(0, appearance.outlineWidth)
        : 0
    const altText = sticker.alt || sticker.label || "Sticker"
    const initialPeelScale = peelTransient(lift.get()) * peelPx

    // Shared displacement-map primitives. A neutral gray flood sits under
    // the map image so unmapped regions (and browsers where feImage fails)
    // degrade to zero displacement instead of a diagonal shift. The feImage
    // x/y are animated imperatively to roll the bulge across the sticker.
    const waveStartX = dir.wave.x0 * wPx - wPx
    const waveStartY = dir.wave.y0 * hPx - hPx
    const renderMapPrimitives = (
        mapRef: React.RefObject<SVGFEImageElement>
    ) => (
        <>
            <feFlood floodColor="rgb(128,128,128)" result="sbNeutral" />
            {bumpMap && (
                <feImage
                    ref={mapRef}
                    href={bumpMap}
                    x={waveStartX}
                    y={waveStartY}
                    width={2 * wPx}
                    height={2 * hPx}
                    preserveAspectRatio="none"
                    result="sbMapImg"
                />
            )}
            <feMerge result="sbMap">
                <feMergeNode in="sbNeutral" />
                {bumpMap && <feMergeNode in="sbMapImg" />}
            </feMerge>
        </>
    )

    return (
        <motion.div
            ref={rootRef}
            tabIndex={motionCfg.dragEnabled ? 0 : -1}
            role="img"
            aria-label={altText}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onKeyDown={onKeyDown}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: wPx,
                height: hPx,
                x,
                y,
                rotate,
                scale,
                zIndex: z,
                cursor: motionCfg.dragEnabled
                    ? dragging
                        ? "grabbing"
                        : "grab"
                    : "default",
                touchAction: "none",
                willChange: engaged ? "transform" : undefined,
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {/* Displaced alpha silhouette, revealed from the lifted corner */}
            <motion.div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    x: shadowDX,
                    y: shadowDY,
                    opacity: shadowOpacity,
                    maskImage: shadowMask,
                    WebkitMaskImage: shadowMask,
                    pointerEvents: "none",
                    willChange: engaged ? "transform, opacity" : undefined,
                }}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${wPx} ${hPx}`}
                    style={{ display: "block", overflow: "visible" }}
                    focusable="false"
                    aria-hidden="true"
                >
                    <defs>
                        <filter
                            id={shadowFilterId}
                            x="-50%"
                            y="-50%"
                            width="200%"
                            height="200%"
                            primitiveUnits="userSpaceOnUse"
                        >
                            <feMorphology
                                in="SourceAlpha"
                                operator="dilate"
                                radius={dilateRadius}
                                result="silhouette"
                            />
                            <feGaussianBlur
                                in="silhouette"
                                stdDeviation={
                                    Math.max(0, liftCfg.shadowBlur) / 2
                                }
                                result="soft"
                            />
                            <feFlood
                                floodColor={liftCfg.shadowColor}
                                result="tint"
                            />
                            <feComposite
                                in="tint"
                                in2="soft"
                                operator="in"
                                result="tinted"
                            />
                            {renderMapPrimitives(mapImgShadowRef)}
                            <feDisplacementMap
                                ref={dispShadowRef}
                                in="tinted"
                                in2="sbMap"
                                scale={initialPeelScale}
                                xChannelSelector="R"
                                yChannelSelector="G"
                            />
                        </filter>
                    </defs>
                    <image
                        href={src}
                        x="0"
                        y="0"
                        width={wPx}
                        height={hPx}
                        preserveAspectRatio="xMidYMid meet"
                        filter={`url(#${shadowFilterId})`}
                    />
                </svg>
            </motion.div>

            {/* Peel wrappers: corner flap pivoting at the opposite corner,
                then velocity tilt pivoting at the grab point */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: engaged ? 900 : undefined,
                    pointerEvents: "none",
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        transform: flapTransform,
                        transformOrigin: dir.origin,
                        transformStyle: engaged ? "preserve-3d" : undefined,
                        willChange: engaged ? "transform" : undefined,
                    }}
                >
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            rotateX,
                            rotateY,
                            transformOrigin: `${grabOrigin.u * 100}% ${grabOrigin.v * 100}%`,
                            willChange: engaged ? "transform" : undefined,
                        }}
                    >
                        {/* Outline + sticker in one SVG so the dome warps both */}
                        <svg
                            width="100%"
                            height="100%"
                            viewBox={`0 0 ${wPx} ${hPx}`}
                            style={{ display: "block", overflow: "visible" }}
                            focusable="false"
                            aria-hidden="true"
                        >
                            <defs>
                                {appearance.outlineEnabled &&
                                    appearance.outlineWidth > 0 && (
                                        <filter
                                            id={outlineFilterId}
                                            x="-50%"
                                            y="-50%"
                                            width="200%"
                                            height="200%"
                                            primitiveUnits="userSpaceOnUse"
                                        >
                                            <feMorphology
                                                in="SourceAlpha"
                                                operator="dilate"
                                                radius={appearance.outlineWidth}
                                                result="dilated"
                                            />
                                            <feFlood
                                                floodColor={
                                                    appearance.outlineColor
                                                }
                                                result="fill"
                                            />
                                            <feComposite
                                                in="fill"
                                                in2="dilated"
                                                operator="in"
                                            />
                                        </filter>
                                    )}
                                <filter
                                    id={warpFilterId}
                                    x="-50%"
                                    y="-50%"
                                    width="200%"
                                    height="200%"
                                    primitiveUnits="userSpaceOnUse"
                                >
                                    {renderMapPrimitives(mapImgMainRef)}
                                    <feDisplacementMap
                                        ref={dispMainRef}
                                        in="SourceGraphic"
                                        in2="sbMap"
                                        scale={initialPeelScale}
                                        xChannelSelector="R"
                                        yChannelSelector="G"
                                    />
                                </filter>
                            </defs>
                            {/* filter attr is managed imperatively: attached
                                only while displacement is nonzero */}
                            <g ref={warpGroupRef}>
                                {appearance.outlineEnabled &&
                                    appearance.outlineWidth > 0 && (
                                        <image
                                            href={src}
                                            x="0"
                                            y="0"
                                            width={wPx}
                                            height={hPx}
                                            preserveAspectRatio="xMidYMid meet"
                                            filter={`url(#${outlineFilterId})`}
                                        />
                                    )}
                                <image
                                    href={src}
                                    x="0"
                                    y="0"
                                    width={wPx}
                                    height={hPx}
                                    preserveAspectRatio="xMidYMid meet"
                                />
                            </g>
                        </svg>

                        {/* Shimmer: specular band sweeping across the peel,
                            clipped to the sticker's alpha */}
                        {liftCfg.gloss > 0 && (
                            <motion.div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    overflow: "hidden",
                                    opacity: glossOpacity,
                                    maskImage: `url("${src}")`,
                                    WebkitMaskImage: `url("${src}")`,
                                    maskSize: "100% 100%",
                                    WebkitMaskSize: "100% 100%",
                                    maskRepeat: "no-repeat",
                                    WebkitMaskRepeat: "no-repeat",
                                    pointerEvents: "none",
                                }}
                            >
                                <motion.div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        width: "300%",
                                        height: "300%",
                                        x: glossX,
                                        y: glossY,
                                        background: `linear-gradient(${dir.angle}deg, rgba(255,255,255,0) 45%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 55%)`,
                                    }}
                                />
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    )
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

/**
 * StickerBoard — user-supplied images become draggable, physical-feeling
 * stickers with an alpha-aware lift shadow, a directional peel, and a
 * specular shimmer, faithful to the Expo Skia sticker-lift reference.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 * @framerDisableUnlink
 */
export default function StickerBoard(props: StickerBoardProps) {
    const stickers = props.stickers ?? DEFAULT_STICKERS
    const appearance: AppearanceSettings = {
        ...DEFAULT_APPEARANCE,
        ...props.appearance,
    }
    const liftCfg: LiftSettings = { ...DEFAULT_LIFT, ...props.liftEffect }
    const motionCfg: MotionSettings = {
        ...DEFAULT_MOTION,
        ...props.motionSettings,
    }
    const bounds: BoundsSettings = { ...DEFAULT_BOUNDS, ...props.bounds }

    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    const reduced = motionCfg.respectReducedMotion && !!prefersReduced

    const containerRef = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState<{ w: number; h: number } | null>(
        null
    )
    const zCounterRef = React.useRef(stickers.length)
    const acquireZ = React.useCallback(() => ++zCounterRef.current, [])

    React.useLayoutEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return
        const measure = () => {
            const w = el.clientWidth
            const h = el.clientHeight
            setSize((prev) =>
                prev && prev.w === w && prev.h === h ? prev : { w, h }
            )
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic])

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                background: appearance.backgroundColor,
                overflow: appearance.overflow,
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            {isStatic
                ? stickers.map((sticker, i) => (
                      <StaticSticker
                          key={i}
                          sticker={sticker}
                          index={i}
                          appearance={appearance}
                      />
                  ))
                : size &&
                  stickers.map((sticker, i) => (
                      <StickerItem
                          key={i}
                          sticker={sticker}
                          index={i}
                          cw={size.w}
                          ch={size.h}
                          appearance={appearance}
                          lift={liftCfg}
                          motionCfg={motionCfg}
                          bounds={bounds}
                          reduced={reduced}
                          boardRef={containerRef}
                          acquireZ={acquireZ}
                      />
                  ))}
        </div>
    )
}

StickerBoard.defaultProps = {
    stickers: DEFAULT_STICKERS,
    appearance: DEFAULT_APPEARANCE,
    liftEffect: DEFAULT_LIFT,
    motionSettings: DEFAULT_MOTION,
    bounds: DEFAULT_BOUNDS,
}

// ---------------------------------------------------------------------------
// Property controls
// ---------------------------------------------------------------------------

addPropertyControls(StickerBoard, {
    stickers: {
        type: ControlType.Array,
        title: "Stickers",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "Transparent PNG, WebP, or SVG works best",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "",
                },
                width: {
                    type: ControlType.Number,
                    title: "Width",
                    min: 24,
                    max: 800,
                    step: 1,
                    unit: "px",
                    defaultValue: 140,
                },
                initialX: {
                    type: ControlType.Number,
                    title: "X",
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    defaultValue: 50,
                    description: "Starting center position",
                },
                initialY: {
                    type: ControlType.Number,
                    title: "Y",
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    defaultValue: 50,
                },
                rotation: {
                    type: ControlType.Number,
                    title: "Rotation",
                    min: -180,
                    max: 180,
                    step: 1,
                    unit: "°",
                    defaultValue: 0,
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt text",
                    defaultValue: "",
                },
            },
        },
        defaultValue: DEFAULT_STICKERS,
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULT_APPEARANCE.backgroundColor,
            },
            overflow: {
                type: ControlType.Enum,
                title: "Overflow",
                options: ["hidden", "visible"],
                optionTitles: ["Hidden", "Visible"],
                displaySegmentedControl: true,
                defaultValue: DEFAULT_APPEARANCE.overflow,
            },
            outlineEnabled: {
                type: ControlType.Boolean,
                title: "Outline",
                defaultValue: DEFAULT_APPEARANCE.outlineEnabled,
            },
            outlineColor: {
                type: ControlType.Color,
                title: "Outline color",
                defaultValue: DEFAULT_APPEARANCE.outlineColor,
                hidden: (p: any) => !p.outlineEnabled,
            },
            outlineWidth: {
                type: ControlType.Number,
                title: "Outline width",
                min: 0,
                max: 16,
                step: 0.5,
                unit: "px",
                defaultValue: DEFAULT_APPEARANCE.outlineWidth,
                hidden: (p: any) => !p.outlineEnabled,
            },
            globalScale: {
                type: ControlType.Number,
                title: "Sticker scale",
                min: 0.25,
                max: 3,
                step: 0.05,
                defaultValue: DEFAULT_APPEARANCE.globalScale,
                description: "Multiplies every sticker width",
            },
        },
    },
    liftEffect: {
        type: ControlType.Object,
        title: "Lift effect",
        controls: {
            liftScale: {
                type: ControlType.Number,
                title: "Lift scale",
                min: 1,
                max: 1.15,
                step: 0.005,
                defaultValue: DEFAULT_LIFT.liftScale,
                description: "Sticker scale while held",
            },
            shadowX: {
                type: ControlType.Number,
                title: "Shadow X",
                min: -40,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: DEFAULT_LIFT.shadowX,
            },
            shadowY: {
                type: ControlType.Number,
                title: "Shadow Y",
                min: -40,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: DEFAULT_LIFT.shadowY,
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow color",
                defaultValue: DEFAULT_LIFT.shadowColor,
                description: "Use the color's alpha for shadow strength",
            },
            shadowBlur: {
                type: ControlType.Number,
                title: "Shadow blur",
                min: 0,
                max: 12,
                step: 0.5,
                unit: "px",
                defaultValue: DEFAULT_LIFT.shadowBlur,
            },
            peelDirection: {
                type: ControlType.Enum,
                title: "Peel from",
                options: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
                optionTitles: [
                    "Top left",
                    "Top right",
                    "Bottom left",
                    "Bottom right",
                ],
                defaultValue: DEFAULT_LIFT.peelDirection,
                description: "Corner that lifts first on grab",
            },
            peelFlap: {
                type: ControlType.Number,
                title: "Peel angle",
                min: 0,
                max: 25,
                step: 0.5,
                unit: "°",
                defaultValue: DEFAULT_LIFT.peelFlap,
                description: "How far the corner folds up mid-peel",
            },
            peelAmount: {
                type: ControlType.Number,
                title: "Peel bow",
                min: 0,
                max: 15,
                step: 0.5,
                unit: "%",
                defaultValue: DEFAULT_LIFT.peelAmount,
                description: "Strength of the wave rolling across the sticker",
            },
            peelTilt: {
                type: ControlType.Number,
                title: "Drag lean",
                min: 0,
                max: 20,
                step: 0.5,
                unit: "°",
                defaultValue: DEFAULT_LIFT.peelTilt,
                description: "3D lean from drag direction",
            },
            gloss: {
                type: ControlType.Number,
                title: "Shimmer",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: DEFAULT_LIFT.gloss,
                description: "Specular sweep strength during the peel",
            },
            maxRotation: {
                type: ControlType.Number,
                title: "Max spin",
                min: 0,
                max: 15,
                step: 0.5,
                unit: "°",
                defaultValue: DEFAULT_LIFT.maxRotation,
                description: "Largest flat rotation while dragging",
            },
            tiltSensitivity: {
                type: ControlType.Number,
                title: "Spin response",
                min: 0,
                max: 0.02,
                step: 0.001,
                defaultValue: DEFAULT_LIFT.tiltSensitivity,
                description: "How strongly drag speed spins the sticker",
            },
        },
    },
    motionSettings: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            pickupStiffness: {
                type: ControlType.Number,
                title: "Pickup stiffness",
                min: 100,
                max: 1200,
                step: 10,
                defaultValue: DEFAULT_MOTION.pickupStiffness,
            },
            pickupDamping: {
                type: ControlType.Number,
                title: "Pickup damping",
                min: 5,
                max: 80,
                step: 1,
                defaultValue: DEFAULT_MOTION.pickupDamping,
            },
            landingStiffness: {
                type: ControlType.Number,
                title: "Landing stiffness",
                min: 100,
                max: 1200,
                step: 10,
                defaultValue: DEFAULT_MOTION.landingStiffness,
            },
            landingDamping: {
                type: ControlType.Number,
                title: "Landing damping",
                min: 5,
                max: 80,
                step: 1,
                defaultValue: DEFAULT_MOTION.landingDamping,
            },
            dragEnabled: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: DEFAULT_MOTION.dragEnabled,
            },
            respectReducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced motion",
                defaultValue: DEFAULT_MOTION.respectReducedMotion,
                description: "Honor the visitor's reduced-motion setting",
            },
        },
    },
    bounds: {
        type: ControlType.Object,
        title: "Bounds",
        description:
            "More components at [Kullen Jahnke](https://framer.link/uqyd85k)",
        controls: {
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
                defaultValue: DEFAULT_BOUNDS.padding,
                description: "Inset kept between stickers and the edge",
            },
            constrain: {
                type: ControlType.Boolean,
                title: "Constrain",
                defaultValue: DEFAULT_BOUNDS.constrain,
            },
        },
    },
})
