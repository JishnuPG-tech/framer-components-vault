/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect, useMemo, CSSProperties } from "react"

// ─── Seeded deterministic random ─────────────────────────────────────────────
function sr(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280
    return x - Math.floor(x)
}

// ─── Ring definitions ─────────────────────────────────────────────────────────
const RING_DEFS = [
    { rf: 0.18, count: 6 },
    { rf: 0.34, count: 10 },
    { rf: 0.5, count: 14 },
    { rf: 0.68, count: 18 },
    { rf: 0.86, count: 22 },
]

// ─── Placeholder colours (shown before any images are added) ─────────────────
// Gives the component a rich preview on first canvas drop
const PLACEHOLDER_COLORS = [
    "#D4C5F9",
    "#C5D9F9",
    "#C5F9E8",
    "#F9EEC5",
    "#F9C5C5",
    "#C5F9D4",
    "#F9C5EE",
    "#C5EEF9",
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface Card {
    id: number
    ringIdx: number
    initAngle: number
    tiltDeg: number
    imgIndex: number
}

interface Props {
    images?: string[]
    speed?: number
    imageSize?: number
    borderRadius?: number
    perspective?: number
    spacing?: number
    style?: CSSProperties
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeLayout(
    card: Card,
    angle: number,
    W: number,
    H: number,
    imageSize: number,
    spacing: number,
    perspective: number
) {
    const maxR = Math.min(W, H) * 0.5
    const ring = RING_DEFS[card.ringIdx]
    const a = card.initAngle + angle

    const rx = maxR * ring.rf * spacing * 1.15
    const ry = rx * perspective

    const ex = W * 0.5 + Math.cos(a) * rx
    const ey = H * 0.5 + Math.sin(a) * ry

    const depth = (Math.sin(a) + 1) * 0.5
    const scale = (0.45 + card.ringIdx * 0.12) * (0.55 + depth * 0.9)
    const opacity = 0.25 + depth * 0.72
    // Coarsely quantised z-index — fewer unique values = fewer stacking-context
    // recompositions per frame, which eliminates the visible flash.
    const zIndex = Math.floor(depth * 8) * 10 + card.ringIdx * 2

    const w = imageSize * 1.35
    const h = imageSize

    const transform =
        `translate(${(ex - w * scale * 0.5).toFixed(2)}px,` +
        `${(ey - h * scale * 0.5).toFixed(2)}px)` +
        ` scale(${scale.toFixed(4)})` +
        ` rotate(${card.tiltDeg}deg)`

    return { transform, opacity, zIndex }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CosmosOrbit
 *
 * Images placed on 5 concentric rings that rotate together like a tilted disc.
 * Perspective depth makes the bottom arc appear near (large, vivid) and the
 * top arc appear far (small, faded).
 */
export default function CosmosOrbit({
    images = [],
    speed = 1,
    imageSize = 110,
    borderRadius = 12,
    perspective = 0.38,
    spacing = 1,
    ...rest
}: Props) {
    // ── 4. Static-renderer guard ────────────────────────────────────────────
    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])
    const angleRef = useRef<number>(0)
    const rafRef = useRef<number>()
    const lastTRef = useRef<number | null>(null)

    // ── 5. Visibility ref (updated by IntersectionObserver) ─────────────────
    const isVisibleRef = useRef<boolean>(true)

    // ── 3. Prop refs — loop reads these instead of closing over state ────────
    // This means the RAF loop NEVER restarts when props change, so the shared
    // angle is never reset to 0 → no jump/flash on prop edits.
    const speedRef = useRef(speed)
    const perspectiveRef = useRef(perspective)
    const spacingRef = useRef(spacing)
    const imageSizeRef = useRef(imageSize)

    useEffect(() => {
        speedRef.current = speed
    }, [speed])
    useEffect(() => {
        perspectiveRef.current = perspective
    }, [perspective])
    useEffect(() => {
        spacingRef.current = spacing
    }, [spacing])
    useEffect(() => {
        imageSizeRef.current = imageSize
    }, [imageSize])

    const hasImages = images && images.length > 0
    const poolSize = hasImages ? images.length : PLACEHOLDER_COLORS.length

    // ── Build card list ───────────────────────────────────────────────────
    const cards = useMemo<Card[]>(() => {
        const list: Card[] = []
        let id = 0
        RING_DEFS.forEach(({ count }, ringIdx) => {
            for (let k = 0; k < count; k++) {
                const seed = ringIdx * 200 + k
                list.push({
                    id,
                    ringIdx,
                    initAngle:
                        (k / count) * Math.PI * 2 +
                        (sr(seed + 77) - 0.5) * 0.08,
                    tiltDeg: (sr(seed + 33) - 0.5) * 30,
                    imgIndex: id % poolSize,
                })
                id++
            }
        })
        return list
    }, [poolSize])

    // ── 5. IntersectionObserver — pause loop when off-screen ────────────────
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    // ── isStatic ref — readable inside RAF without making it a dep ──────────
    const isStaticRef = useRef(isStatic)
    useEffect(() => {
        isStaticRef.current = isStatic
    }, [isStatic])

    // ── RAF animation loop ────────────────────────────────────────────────
    // Depends only on `cards`. All other values (speed, perspective, spacing,
    // imageSize, isStatic) are read from refs inside the loop so the loop
    // NEVER restarts or resets the angle when props or render-mode changes.
    // A `cancelled` flag prevents stale closures from running after cleanup.
    useEffect(() => {
        if (cards.length === 0) return
        lastTRef.current = null
        let cancelled = false

        const loop = (ts: number) => {
            if (cancelled) return

            // Skip work when static or off-screen, but keep the RAF chain alive
            // so the loop resumes immediately when conditions change.
            if (isStaticRef.current || !isVisibleRef.current) {
                lastTRef.current = null
                rafRef.current = requestAnimationFrame(loop)
                return
            }

            const container = containerRef.current
            if (!container) {
                rafRef.current = requestAnimationFrame(loop)
                return
            }

            const W = container.offsetWidth
            const H = container.offsetHeight
            const maxR = Math.min(W, H) * 0.5

            const dt =
                lastTRef.current !== null
                    ? Math.min((ts - lastTRef.current) / 1000, 0.05)
                    : 0
            lastTRef.current = ts

            angleRef.current += speedRef.current * 0.25 * dt

            const _imageSize = imageSizeRef.current
            const _spacing = spacingRef.current
            const _perspective = perspectiveRef.current
            const cx = W * 0.5
            const cy = H * 0.5

            cards.forEach((c, i) => {
                const el = itemRefs.current[i]
                if (!el) return

                const ring = RING_DEFS[c.ringIdx]
                const a = c.initAngle + angleRef.current

                const rx = maxR * ring.rf * _spacing * 1.15
                const ry = rx * _perspective

                const ex = cx + Math.cos(a) * rx
                const ey = cy + Math.sin(a) * ry

                const depth = (Math.sin(a) + 1) * 0.5
                const scale = (0.45 + c.ringIdx * 0.12) * (0.55 + depth * 0.9)
                const opacity = 0.25 + depth * 0.72
                const zIndex = Math.floor(depth * 8) * 10 + c.ringIdx * 2

                const w = _imageSize * 1.35
                const h = _imageSize

                el.style.transform =
                    `translate(${(ex - w * scale * 0.5).toFixed(2)}px,` +
                    `${(ey - h * scale * 0.5).toFixed(2)}px)` +
                    ` scale(${scale.toFixed(4)})` +
                    ` rotate(${c.tiltDeg}deg)`
                el.style.opacity = opacity.toFixed(3)
                el.style.zIndex = String(zIndex)
            })

            rafRef.current = requestAnimationFrame(loop)
        }

        rafRef.current = requestAnimationFrame(loop)
        return () => {
            cancelled = true
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [cards])

    // ── 4. Static renderer: compute a fixed first-frame snapshot ─────────
    if (isStatic) {
        const W = 800,
            H = 600
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: 800,
                    minHeight: 600,
                    overflow: "hidden",
                    position: "relative",
                    ...rest.style,
                }}
            >
                {cards.map((c) => {
                    const { transform, opacity, zIndex } = computeLayout(
                        c,
                        Math.PI * 0.6,
                        W,
                        H,
                        imageSize,
                        spacing,
                        perspective
                    )
                    return (
                        <div
                            key={c.id}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: imageSize * 1.35,
                                height: imageSize,
                                borderRadius,
                                overflow: "hidden",
                                transform,
                                opacity,
                                zIndex,
                                boxShadow:
                                    "0 3px 16px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.07)",
                                background: hasImages
                                    ? undefined
                                    : PLACEHOLDER_COLORS[
                                          c.imgIndex % PLACEHOLDER_COLORS.length
                                      ],
                            }}
                        >
                            {hasImages && (
                                <img
                                    src={images[c.imgIndex]}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                    alt=""
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    // ── Live render ───────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 800,
                minHeight: 600,
                overflow: "hidden",
                position: "relative",
                ...rest.style,
            }}
        >
            {cards.map((c, i) => (
                <div
                    key={c.id}
                    ref={(el) => {
                        itemRefs.current[i] = el
                    }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: imageSize * 1.35,
                        height: imageSize,
                        borderRadius,
                        overflow: "hidden",
                        willChange: "transform, opacity",
                        transformOrigin: "center center",
                        boxShadow:
                            "0 3px 16px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.07)",
                        pointerEvents: "none",
                        background: hasImages
                            ? undefined
                            : PLACEHOLDER_COLORS[
                                  c.imgIndex % PLACEHOLDER_COLORS.length
                              ],
                    }}
                >
                    {hasImages && (
                        <img
                            src={images[c.imgIndex]}
                            style={
                                {
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    userSelect: "none",
                                    WebkitUserDrag: "none",
                                } as CSSProperties
                            }
                            draggable={false}
                            alt=""
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────
addPropertyControls(CosmosOrbit, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        maxCount: 200,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 8,
        step: 0.1,
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 110,
        min: 30,
        max: 300,
        step: 5,
        unit: "px",
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 1,
        min: 0.4,
        max: 2.5,
        step: 0.05,
        description:
            "Gap between images. 1 = default · 0.4 = tight · 2.5 = wide",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective Tilt",
        defaultValue: 0.38,
        min: 0.05,
        max: 1.0,
        step: 0.01,
        description: "0.05 = flat top-down · 1.0 = full circle",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
})
