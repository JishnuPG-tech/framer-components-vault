// Instructions: Build a component where circular images float around a box with slow, random movement. Images should bounce off walls and each other. Add a hover state to stop movement.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type FloatingItem = {
    image: ResponsiveImage
    link: string
    label: string
}

type Vec = { x: number; y: number }

interface FloatingBubblesProps {
    items: FloatingItem[]
    openLinksInNewTab: boolean
    backgroundColor: string
    borderColor: string
    borderWidth: number
    borderRadius: string
    padding: number
    imageSize: number
    speed: number
    friction: number
    elasticity: number
    stopOnHover: boolean
    shadow: string
    tooltipBackgroundColor: string
    tooltipTextColor: string
    tooltipFont: CSSProperties
    entranceAnimation: boolean
    entranceDuration: number
    entranceStagger: number
    hoverPulse: boolean
    pulseScale: number
    pulseDuration: number
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FloatingBubbles(props: FloatingBubblesProps) {
    const {
        items,
        openLinksInNewTab,
        backgroundColor,
        borderColor,
        borderWidth,
        borderRadius,
        padding,
        imageSize,
        speed,
        friction,
        elasticity,
        stopOnHover,
        shadow,
        tooltipBackgroundColor,
        tooltipTextColor,
        tooltipFont,
        entranceAnimation,
        entranceDuration,
        entranceStagger,
        hoverPulse,
        pulseScale,
        pulseDuration,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = useId()

    const [mounted, setMounted] = useState(false)

    const [hoveredIndex, setHoveredIndex] = useState<number>(-1)
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

    const dragRef = useRef<{
        active: boolean
        index: number
        pointerId: number
        offsetX: number
        offsetY: number
        moved: boolean
        wasPaused: boolean
        resetMovedTimer: number | null
    }>({
        active: false,
        index: -1,
        pointerId: 0,
        offsetX: 0,
        offsetY: 0,
        moved: false,
        wasPaused: false,
        resetMovedTimer: null,
    })

    const defaultImages: ResponsiveImage[] = useMemo(
        () => [
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4 - Yellow",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3 - Orange",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2 - Purple",
            },
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
        ],
        []
    )

    const imgs = useMemo(() => {
        const hasValidItems = Array.isArray(items) && items.length > 0 && items.some(item => item && item.image && typeof item.image.src === "string" && item.image.src.length > 0)
        const list = hasValidItems ? items : defaultImages.map((img, idx) => ({ image: img, link: "", label: `Item ${idx + 1}` }))
        // Filter invalid
        return list.filter((item) => item && item.image && typeof item.image.src === "string" && item.image.src.length > 0)
    }, [items, defaultImages])

    const containerRef = useRef<HTMLDivElement | null>(null)
    const itemRefs = useRef<Array<HTMLElement | null>>([])
    const boundsRef = useRef({ w: 0, h: 0 })

    const pausedRef = useRef(false)
    const [paused, setPaused] = useState(false)

    const stateRef = useRef<{
        inited: boolean
        r: number
        pos: Vec[]
        vel: Vec[]
        lastT: number
    }>({
        inited: false,
        r: Math.max(8, imageSize / 2),
        pos: [],
        vel: [],
        lastT: 0,
    })

    stateRef.current.r = Math.max(8, imageSize / 2)

    const seededRng = useMemo(() => {
        // Deterministic seed per instance to keep canvas/static preview stable
        let h = 2166136261
        for (let i = 0; i < uid.length; i++) {
            h ^= uid.charCodeAt(i)
            h = Math.imul(h, 16777619)
        }
        let s = (h >>> 0) || 1
        return () => {
            // LCG
            s = (Math.imul(1664525, s) + 1013904223) >>> 0
            return s / 4294967296
        }
    }, [uid])

    const setPausedSafe = (v: boolean) => {
        pausedRef.current = v
        startTransition(() => setPaused(v))
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        startTransition(() => setMounted(true))
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        const el = containerRef.current
        // Ensure bounds are set immediately (important when pasting into a new project)
        const initialRect = el.getBoundingClientRect()
        boundsRef.current = { w: initialRect.width, h: initialRect.height }
        const ro = new ResizeObserver((entries) => {
            const cr = entries[0]?.contentRect
            if (!cr) return
            boundsRef.current = { w: cr.width, h: cr.height }
        })
        ro.observe(el)

        return () => ro.disconnect()
    }, [])

    const initIfNeeded = () => {
        const n = imgs.length
        const { w, h } = boundsRef.current
        const r = stateRef.current.r
        if (n <= 0) return false
        if (w <= 0 || h <= 0) return false

        if (stateRef.current.inited && stateRef.current.pos.length === n && stateRef.current.vel.length === n) {
            return true
        }

        const innerW = Math.max(1, w - padding * 2)
        const innerH = Math.max(1, h - padding * 2)

        const rng = seededRng
        const pos: Vec[] = new Array(n)
        const vel: Vec[] = new Array(n)

        const maxTries = 400
        for (let i = 0; i < n; i++) {
            let placed = false
            const xRange = Math.max(0, innerW - r * 2)
            const yRange = Math.max(0, innerH - r * 2)

            for (let t = 0; t < maxTries; t++) {
                const x = padding + r + rng() * xRange
                const y = padding + r + rng() * yRange

                let ok = true
                for (let j = 0; j < i; j++) {
                    const dx = x - pos[j].x
                    const dy = y - pos[j].y
                    const minD = r * 2 + 1
                    if (dx * dx + dy * dy < minD * minD) {
                        ok = false
                        break
                    }
                }
                if (ok) {
                    pos[i] = { x, y }
                    placed = true
                    break
                }
            }
            if (!placed) {
                // Fallback: just scatter; collision resolution will separate over time
                const x = padding + r + rng() * xRange
                const y = padding + r + rng() * yRange
                pos[i] = { x, y }
            }

            const angle = rng() * Math.PI * 2
            const mag = (0.35 + rng() * 0.65) * Math.max(1, speed)
            vel[i] = { x: Math.cos(angle) * mag, y: Math.sin(angle) * mag }
        }

        stateRef.current.pos = pos
        stateRef.current.vel = vel
        stateRef.current.lastT = performance.now()
        stateRef.current.inited = true
        return true
    }

    const applyTransforms = () => {
        const n = imgs.length
        const r = stateRef.current.r
        for (let i = 0; i < n; i++) {
            const node = itemRefs.current[i]
            const p = stateRef.current.pos[i]
            if (!node || !p) continue
            // Centered at p => translate to top-left
            const x = p.x - r
            const y = p.y - r
            node.style.transform = `translate3d(${x}px, ${y}px, 0)`
        }
    }

    const resolveWall = (p: Vec, v: Vec, w: number, h: number, r: number, e: number) => {
        const minX = padding + r
        const minY = padding + r
        const maxX = Math.max(minX, w - padding - r)
        const maxY = Math.max(minY, h - padding - r)

        if (p.x < minX) {
            p.x = minX
            v.x = Math.abs(v.x) * e
        } else if (p.x > maxX) {
            p.x = maxX
            v.x = -Math.abs(v.x) * e
        }

        if (p.y < minY) {
            p.y = minY
            v.y = Math.abs(v.y) * e
        } else if (p.y > maxY) {
            p.y = maxY
            v.y = -Math.abs(v.y) * e
        }
    }

    const clampToWall = (p: Vec, w: number, h: number, r: number) => {
        const minX = padding + r
        const minY = padding + r
        const maxX = Math.max(minX, w - padding - r)
        const maxY = Math.max(minY, h - padding - r)
        p.x = Math.max(minX, Math.min(maxX, p.x))
        p.y = Math.max(minY, Math.min(maxY, p.y))
    }

    const resolvePair = (i: number, j: number, r: number, e: number) => {
        const pi = stateRef.current.pos[i]
        const pj = stateRef.current.pos[j]
        const vi = stateRef.current.vel[i]
        const vj = stateRef.current.vel[j]
        if (!pi || !pj || !vi || !vj) return

        const dx = pj.x - pi.x
        const dy = pj.y - pi.y
        const minD = r * 2
        const dist2 = dx * dx + dy * dy
        if (dist2 <= 0) return
        if (dist2 >= minD * minD) return

        const dist = Math.sqrt(dist2)
        const nx = dx / dist
        const ny = dy / dist

        // Separate overlap
        const overlap = minD - dist
        const sep = overlap * 0.5 + 0.001
        pi.x -= nx * sep
        pi.y -= ny * sep
        pj.x += nx * sep
        pj.y += ny * sep

        // Collision along normal (equal mass) with restitution
        const rvx = vi.x - vj.x
        const rvy = vi.y - vj.y
        const relVelAlongNormal = rvx * nx + rvy * ny
        if (relVelAlongNormal > 0) return

        const jImpulse = -((1 + e) * relVelAlongNormal) / 2
        vi.x += jImpulse * nx
        vi.y += jImpulse * ny
        vj.x -= jImpulse * nx
        vj.y -= jImpulse * ny
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        let raf = 0

        const tick = (t: number) => {
            const ok = initIfNeeded()
            if (!ok) {
                raf = window.requestAnimationFrame(tick)
                return
            }

            if (!pausedRef.current) {
                const { w, h } = boundsRef.current
                const r = stateRef.current.r
                const n = imgs.length

                const last = stateRef.current.lastT
                const dtMs = Math.min(40, Math.max(0, t - last))
                stateRef.current.lastT = t

                const dt = dtMs / 1000

                const fr = Math.max(0, Math.min(0.5, friction))
                const e = Math.max(0, Math.min(1, elasticity))
                const damp = Math.pow(1 - fr, dt * 60)

                // Integrate
                const minV = Math.max(6, Math.max(1, speed) * 0.18)
                for (let i = 0; i < n; i++) {
                    const p = stateRef.current.pos[i]
                    const v = stateRef.current.vel[i]
                    if (!p || !v) continue
                    v.x *= damp
                    v.y *= damp

                    // Prevent friction from fully stopping motion over time
                    const vv = Math.hypot(v.x, v.y)
                    if (vv < minV) {
                        const a = Math.random() * Math.PI * 2
                        v.x = Math.cos(a) * minV
                        v.y = Math.sin(a) * minV
                    }

                    p.x += v.x * dt
                    p.y += v.y * dt
                    resolveWall(p, v, w, h, r, e)
                }

                // Pairwise collisions
                for (let i = 0; i < n; i++) {
                    for (let j = i + 1; j < n; j++) resolvePair(i, j, r, e)
                }

                // Apply walls again after pair separation
                for (let i = 0; i < n; i++) {
                    const p = stateRef.current.pos[i]
                    const v = stateRef.current.vel[i]
                    if (!p || !v) continue
                    resolveWall(p, v, w, h, r, e)
                }

                applyTransforms()
            }

            raf = window.requestAnimationFrame(tick)
        }

        raf = window.requestAnimationFrame(tick)
        return () => window.cancelAnimationFrame(raf)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imgs.length, isStatic, padding, imageSize, speed, seededRng, friction, elasticity])

    // Ensure transforms apply when props change / on first render
    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        const ok = initIfNeeded()
        if (ok) applyTransforms()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imgs.length, imageSize, padding, isStatic])

    const staticPositions = useMemo(() => {
        // Useful static preview (no motion)
        const n = imgs.length
        const rng = seededRng
        const pos: Vec[] = []
        const w = 600
        const h = 360
        const r = Math.max(8, imageSize / 2)
        const innerW = Math.max(1, w - padding * 2)
        const innerH = Math.max(1, h - padding * 2)
        for (let i = 0; i < n; i++) {
            const x = padding + r + rng() * Math.max(1, innerW - r * 2)
            const y = padding + r + rng() * Math.max(1, innerH - r * 2)
            pos.push({ x, y })
        }
        return pos
    }, [imgs.length, imageSize, padding, seededRng])

    const pulseKeyframesName = useMemo(() => {
        const safe = uid.replace(/[^a-zA-Z0-9_-]/g, "_")
        return `fb_pulse_${safe}`
    }, [uid])

    const itemNodes = useMemo(() => {
        const r = Math.max(8, imageSize / 2)
        const sizePx = Math.max(16, imageSize)
        return imgs.map((item, i) => {
            const im = item.image
            const p = staticPositions[i] || { x: padding + r, y: padding + r }
            const x = p.x - r
            const y = p.y - r
            const link = typeof item.link === "string" ? item.link : ""
            const isInteractive = link.length > 0

            const shouldPulse = !isStatic && hoverPulse && hoveredIndex === i && !dragRef.current.active

            const handleClick = () => {
                if (dragRef.current.moved) return
                if (!isInteractive) return
                if (typeof window === "undefined") return
                try {
                    if (openLinksInNewTab) {
                        window.open(link, "_blank", "noopener,noreferrer")
                    } else {
                        window.location.href = link
                    }
                } catch {
                    // noop
                }
            }

            const handlePointerDown = (e: React.PointerEvent) => {
                if (isStatic) return
                if (typeof window === "undefined") return
                if (!containerRef.current) return

                e.preventDefault()
                e.stopPropagation()

                // Hide tooltip when dragging starts
                startTransition(() => setHoveredIndex(-1))

                const ok = initIfNeeded()
                if (!ok) return

                const rect = containerRef.current.getBoundingClientRect()
                const cx = e.clientX - rect.left
                const cy = e.clientY - rect.top

                const current = stateRef.current.pos[i]
                if (!current) return

                const dx = cx - current.x
                const dy = cy - current.y

                if (dragRef.current.resetMovedTimer) {
                    window.clearTimeout(dragRef.current.resetMovedTimer)
                }

                dragRef.current.active = true
                dragRef.current.index = i
                dragRef.current.pointerId = e.pointerId
                dragRef.current.offsetX = dx
                dragRef.current.offsetY = dy
                dragRef.current.moved = false
                dragRef.current.wasPaused = pausedRef.current

                setPausedSafe(true)

                const node = itemRefs.current[i] as any
                if (node?.setPointerCapture) {
                    try {
                        node.setPointerCapture(e.pointerId)
                    } catch {
                        // noop
                    }
                }

                const handleMove = (ev: PointerEvent) => {
                    if (!dragRef.current.active) return
                    if (ev.pointerId !== dragRef.current.pointerId) return
                    if (!containerRef.current) return

                    const { w, h } = boundsRef.current
                    const rr = stateRef.current.r
                    const rrect = containerRef.current.getBoundingClientRect()
                    const mx = ev.clientX - rrect.left
                    const my = ev.clientY - rrect.top

                    const np = stateRef.current.pos[i]
                    if (!np) return

                    const nx = mx - dragRef.current.offsetX
                    const ny = my - dragRef.current.offsetY

                    const movedDx = nx - np.x
                    const movedDy = ny - np.y
                    if (!dragRef.current.moved && movedDx * movedDx + movedDy * movedDy > 9) {
                        dragRef.current.moved = true
                    }

                    np.x = nx
                    np.y = ny
                    clampToWall(np, w, h, rr)

                    const vv = stateRef.current.vel[i]
                    if (vv) {
                        vv.x = 0
                        vv.y = 0
                    }

                    applyTransforms()
                }

                const endDrag = (ev: PointerEvent) => {
                    if (ev.pointerId !== dragRef.current.pointerId) return

                    window.removeEventListener("pointermove", handleMove)
                    window.removeEventListener("pointerup", endDrag)
                    window.removeEventListener("pointercancel", endDrag)

                    const was = dragRef.current.wasPaused
                    dragRef.current.active = false
                    dragRef.current.index = -1

                    setPausedSafe(was)

                    dragRef.current.resetMovedTimer = window.setTimeout(() => {
                        dragRef.current.moved = false
                        dragRef.current.resetMovedTimer = null
                    }, 200)
                }

                window.addEventListener("pointermove", handleMove, { passive: false })
                window.addEventListener("pointerup", endDrag)
                window.addEventListener("pointercancel", endDrag)
            }

            const sharedStyle: CSSProperties = {
                position: "absolute",
                left: 0,
                top: 0,
                width: sizePx,
                height: sizePx,
                transform: `translate3d(${x}px, ${y}px, 0)`,
                willChange: isStatic ? "auto" : "transform",
                pointerEvents: "auto",
                cursor: isInteractive ? "pointer" : "grab",
                touchAction: "none",
            }

            const innerStyle: CSSProperties = {
                width: "100%",
                height: "100%",
                borderRadius: "999px",
                overflow: "hidden",
                boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
                background: "#FFFFFF",
                transform: isStatic || !entranceAnimation ? "scale(1)" : mounted ? "scale(1)" : "scale(0.86)",
                opacity: isStatic || !entranceAnimation ? 1 : mounted ? 1 : 0,
                transitionProperty: "transform, opacity",
                transitionDuration: `${Math.max(0, entranceDuration)}s`,
                transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                transitionDelay:
                    isStatic || !entranceAnimation
                        ? "0s"
                        : `${Math.max(0, entranceStagger) * Math.max(0, i)}s`,
                animation: shouldPulse
                    ? `${pulseKeyframesName} ${Math.max(0.2, pulseDuration)}s ease-in-out infinite`
                    : undefined,
                willChange: shouldPulse ? "transform" : "auto",
            }

            const sharedProps = {
                ref: (node: HTMLElement | null) => {
                    itemRefs.current[i] = node
                },
                style: sharedStyle,
                onClick: isInteractive ? handleClick : undefined,
                onPointerDown: handlePointerDown,
                onMouseEnter: (e: React.MouseEvent) => {
                    if (!isStatic && !dragRef.current.active) {
                        const label = item.label || im.alt || `Item ${i + 1}`
                        if (label) {
                            const rect = e.currentTarget.getBoundingClientRect()
                            startTransition(() => {
                                setHoveredIndex(i)
                                setTooltipPosition({
                                    x: rect.left + rect.width / 2,
                                    y: rect.top - 8,
                                })
                            })
                        }
                    }
                },
                onMouseLeave: () => {
                    if (!isStatic) {
                        startTransition(() => setHoveredIndex(-1))
                    }
                },
                onKeyDown: isInteractive
                    ? (e: React.KeyboardEvent) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handleClick()
                          }
                      }
                    : undefined,
                role: isInteractive ? "link" : "img",
                tabIndex: isInteractive ? 0 : -1,
                "aria-label": im.alt ?? (isInteractive ? "Open link" : "Floating image"),
            }

            return (
                <div key={`${im.src}-${i}`} {...sharedProps}>
                    <div style={innerStyle}>
                        <img
                            src={im.src}
                            srcSet={im.srcSet}
                            alt={im.alt ?? ""}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                            draggable={false}
                        />
                    </div>
                </div>
            )
        })
    }, [
        imgs,
        imageSize,
        isStatic,
        openLinksInNewTab,
        padding,
        staticPositions,
        hoveredIndex,
        hoverPulse,
        pulseDuration,
        pulseKeyframesName,
        entranceAnimation,
        entranceDuration,
        entranceStagger,
        mounted,
    ])

    const hoveredItem = hoveredIndex >= 0 && hoveredIndex < imgs.length ? imgs[hoveredIndex] : null
    const tooltipLabel = hoveredItem ? (hoveredItem.label || hoveredItem.image.alt || `Item ${hoveredIndex + 1}`) : ""

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                border: `${borderWidth}px solid ${borderColor}`,
                borderRadius,
                boxShadow: shadow,
                userSelect: "none",
                WebkitUserSelect: "none",
                ...style,
            }}
            onMouseEnter={
                stopOnHover
                    ? () => {
                          setPausedSafe(true)
                      }
                    : undefined
            }
            onMouseLeave={
                stopOnHover
                    ? () => {
                          setPausedSafe(false)
                      }
                    : undefined
            }
            aria-label={paused ? "Floating images paused" : "Floating images"}
            role="img"
        >
            <style
                dangerouslySetInnerHTML={{
                    __html: `@keyframes ${pulseKeyframesName}{0%,100%{transform:scale(1)}50%{transform:scale(${Math.max(
                        1,
                        pulseScale
                    )})}}`,
                }}
            />
            {itemNodes}
            {hoveredIndex >= 0 && tooltipLabel && typeof window !== "undefined" && (
                <div
                    style={{
                        position: "fixed",
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: "translate(-50%, -100%)",
                        backgroundColor: tooltipBackgroundColor,
                        color: tooltipTextColor,
                        padding: "6px 12px",
                        borderRadius: "6px",
                        pointerEvents: "none",
                        zIndex: 9999,
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        ...tooltipFont,
                    }}
                >
                    {tooltipLabel}
                </div>
            )}
        </div>
    )
}

addPropertyControls(FloatingBubbles, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 10,
        defaultValue: [
            { image: {}, link: "", label: "Item 1" },
            { image: {}, link: "", label: "Item 2" },
            { image: {}, link: "", label: "Item 3" },
            { image: {}, link: "", label: "Item 4" },
            { image: {}, link: "", label: "Item 5" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Item",
                },
            },
        },
    },
    openLinksInNewTab: {
        type: ControlType.Boolean,
        title: "Link Target",
        defaultValue: true,
        enabledTitle: "New Tab",
        disabledTitle: "Same Tab",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border W",
        defaultValue: 1,
        min: 0,
        max: 12,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 64,
        min: 24,
        max: 160,
        step: 1,
        unit: "px",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 28,
        min: 5,
        max: 120,
        step: 1,
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        defaultValue: 0.02,
        min: 0,
        max: 0.2,
        step: 0.005,
    },
    elasticity: {
        type: ControlType.Number,
        title: "Elasticity",
        defaultValue: 0.9,
        min: 0,
        max: 1,
        step: 0.05,
    },
    stopOnHover: {
        type: ControlType.Boolean,
        title: "Stop on Hover",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 10px 30px rgba(0,0,0,0.10)",
    },
    tooltipBackgroundColor: {
        type: ControlType.Color,
        title: "Tooltip BG",
        defaultValue: "#000000",
    },
    tooltipTextColor: {
        type: ControlType.Color,
        title: "Tooltip Text",
        defaultValue: "#FFFFFF",
    },
    tooltipFont: {
        type: ControlType.Font,
        title: "Tooltip Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    entranceAnimation: {
        type: ControlType.Boolean,
        title: "Entrance",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    entranceDuration: {
        type: ControlType.Number,
        title: "Enter Dur",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
        hidden: ({ entranceAnimation }) => !entranceAnimation,
    },
    entranceStagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.05,
        min: 0,
        max: 0.3,
        step: 0.01,
        unit: "s",
        hidden: ({ entranceAnimation }) => !entranceAnimation,
    },
    hoverPulse: {
        type: ControlType.Boolean,
        title: "Hover Pulse",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    pulseScale: {
        type: ControlType.Number,
        title: "Pulse Scale",
        defaultValue: 1.06,
        min: 1,
        max: 1.25,
        step: 0.01,
        hidden: ({ hoverPulse }) => !hoverPulse,
    },
    pulseDuration: {
        type: ControlType.Number,
        title: "Pulse Dur",
        defaultValue: 1.6,
        min: 0.4,
        max: 4,
        step: 0.1,
        unit: "s",
        hidden: ({ hoverPulse }) => !hoverPulse,
    },
})