// Scroll Ticker — Infinite scroll-reactive marquee for Framer.
// Accepts children via Slot. Scroll down → moves left, scroll up → reverses.
// Seamless infinite loop with automatic content replication.

import React, {
    useRef,
    useEffect,
    useCallback,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TickerDirection = "left" | "right"

interface ScrollTickerProps {
    children?: ReactNode
    baseSpeed: number
    initialDirection: TickerDirection
    gap: number
    background: string
    boostIntensity: number
    paddingX: number
    paddingY: number
    style?: CSSProperties
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Scroll Ticker
 *
 * An infinite horizontal ticker that reverses direction based on page
 * scroll. Scroll down → ticker moves in the initial direction; scroll
 * up → ticker reverses. Speed increases proportionally to scroll
 * velocity, then eases back to the base speed.
 *
 * Children are added via the Items slot (up to 10 layers). The content
 * is automatically replicated so the loop is always seamless, regardless
 * of how few or how small the children are.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 80
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScrollTicker(props: ScrollTickerProps) {
    const {
        children,
        baseSpeed,
        initialDirection,
        gap,
        background,
        boostIntensity,
        style,
        paddingX,
        paddingY,
    } = props

    const isStatic = useIsStaticRenderer()

    // Refs — all mutable animation state lives in refs so we never
    // trigger React re-renders on every frame.
    const containerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const frameRef = useRef<number | null>(null)
    const positionRef = useRef(0)
    const directionRef = useRef<TickerDirection>(initialDirection)
    const velocityRef = useRef(1)
    const lastTimeRef = useRef<number | null>(null)
    const lastScrollTimeRef = useRef<number | null>(null)

    // Dynamic replication count — ensures the track is always wide enough
    // for a seamless loop regardless of how few children are provided.
    const [copies, setCopies] = useState(2)

    const inView = useInView(containerRef, { margin: "0px", amount: 0.1 })

    // -----------------------------------------------------------------------
    // Measure & replicate
    // -----------------------------------------------------------------------
    // After mount (and whenever children / gap change) we measure the width
    // of a single set of children vs the container width. If one set isn't
    // wide enough to fill the container we increase the copy count so there
    // are no visible gaps during the loop.

    const measureAndReplicate = useCallback(() => {
        const container = containerRef.current
        const track = trackRef.current
        if (!container || !track) return

        const containerWidth = container.offsetWidth
        if (containerWidth <= 0) return

        // Measure one copy: total track width / current number of copies.
        const singleCopyWidth = track.scrollWidth / copies
        if (singleCopyWidth <= 0) return

        // We need at least 2 copies for the loop, but potentially more if
        // the single copy is narrower than the container.
        const needed = Math.max(
            2,
            Math.ceil((containerWidth * 2) / singleCopyWidth) + 1
        )

        if (needed !== copies) {
            setCopies(needed)
        }
    }, [copies])

    useEffect(() => {
        measureAndReplicate()

        // Re-measure on resize so the copy count stays correct when the
        // viewport width changes (responsive).
        const ro = new ResizeObserver(measureAndReplicate)
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [measureAndReplicate, children, gap])

    // -----------------------------------------------------------------------
    // Sync initialDirection prop → ref
    // -----------------------------------------------------------------------

    useEffect(() => {
        directionRef.current = initialDirection
    }, [initialDirection])

    // -----------------------------------------------------------------------
    // Scroll listener — direction + velocity boost
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (isStatic) return

        const onWheel = (e: WheelEvent) => {
            const dy = e.deltaY

            // Determine direction based on scroll.
            const next: TickerDirection =
                dy > 0
                    ? initialDirection
                    : dy < 0
                      ? initialDirection === "left"
                          ? "right"
                          : "left"
                      : directionRef.current

            directionRef.current = next

            // Velocity boost proportional to scroll delta.
            const absDelta = Math.min(Math.abs(dy), 200)
            const intensity = Math.max(0, boostIntensity)
            velocityRef.current = 1 + (absDelta / 200) * intensity
            lastScrollTimeRef.current = performance.now()
        }

        window.addEventListener("wheel", onWheel, { passive: true })
        return () => window.removeEventListener("wheel", onWheel)
    }, [isStatic, boostIntensity, initialDirection])

    // -----------------------------------------------------------------------
    // Animation loop — runs entirely via refs, no React state
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (isStatic) return

        const step = (timestamp: number) => {
            const track = trackRef.current
            if (!track) {
                frameRef.current = requestAnimationFrame(step)
                return
            }

            // Skip work while off-screen.
            if (!inView) {
                lastTimeRef.current = null
                frameRef.current = requestAnimationFrame(step)
                return
            }

            const prev = lastTimeRef.current
            lastTimeRef.current = timestamp

            if (prev != null) {
                const deltaSec = (timestamp - prev) / 1000
                const dir = directionRef.current === "left" ? -1 : 1

                // Ease velocity back to 1 after scrolling stops.
                let velocity = velocityRef.current
                if (lastScrollTimeRef.current != null) {
                    const elapsed = timestamp - lastScrollTimeRef.current
                    if (elapsed > 100) {
                        const t = Math.min((elapsed - 100) / 400, 1)
                        velocity = 1 + (velocity - 1) * (1 - t)
                        if (t >= 1) {
                            velocity = 1
                            velocityRef.current = 1
                            lastScrollTimeRef.current = null
                        } else {
                            velocityRef.current = velocity
                        }
                    }
                }

                // Move position.
                positionRef.current += dir * baseSpeed * velocity * deltaSec

                // Wrap position so it never drifts to extreme values,
                // and keeps the track seamlessly infinite in BOTH directions.
                const singleCopyWidth = track.scrollWidth / copies
                if (singleCopyWidth > 0) {
                    // Prevent gap when scrolling left
                    while (positionRef.current <= -singleCopyWidth) {
                        positionRef.current += singleCopyWidth
                    }
                    // Prevent gap when scrolling right
                    while (positionRef.current > 0) {
                        positionRef.current -= singleCopyWidth
                    }
                }

                // Direct DOM mutation — no React re-render needed.
                track.style.transform = `translateX(${positionRef.current}px)`
            }

            frameRef.current = requestAnimationFrame(step)
        }

        frameRef.current = requestAnimationFrame(step)
        return () => {
            if (frameRef.current != null) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
            lastTimeRef.current = null
        }
    }, [baseSpeed, inView, isStatic, copies])

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    // Build a single copy of the children strip.
    const strip = children ? (
        <div
            style={{
                display: "inline-flex",
                flexDirection: "row",
                alignItems: "center",
                gap,
                whiteSpace: "nowrap",
                paddingRight: gap,
            }}
        >
            {children}
        </div>
    ) : null

    // Replicate strips so the track is wide enough for seamless looping.
    const strips: ReactNode[] = []
    for (let i = 0; i < copies; i++) {
        strips.push(<React.Fragment key={i}>{strip}</React.Fragment>)
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                overflow: "hidden",
                width: "100%",
                height: "100%",
                background,
                padding: `${paddingY}px ${paddingX}px`,
                ...style,
            }}
            aria-label="Scroll-controlled ticker"
            role="marquee"
        >
            <div
                ref={trackRef}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    willChange: "transform",
                }}
            >
                {strips}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Property Controls
// ---------------------------------------------------------------------------

addPropertyControls(ScrollTicker, {
    children: {
        type: ControlType.Slot,
        title: "Items",
        maxCount: 10,
    },

    // — Motion ——————————————————————————————————————————————————————————————
    baseSpeed: {
        type: ControlType.Number,
        title: "Speed",
        description: "Base scroll speed in pixels per second.",
        defaultValue: 80,
        min: 10,
        max: 400,
        unit: "px/s",
        step: 10,
    },
    initialDirection: {
        type: ControlType.Enum,
        title: "Direction",
        description:
            "Default travel direction. Reverses automatically when the user scrolls the opposite way.",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    boostIntensity: {
        type: ControlType.Number,
        title: "Scroll Boost",
        description:
            "How much scroll velocity accelerates the ticker. 0 = no boost, 3 = maximum.",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
    },

    // — Layout ——————————————————————————————————————————————————————————————
    gap: {
        type: ControlType.Number,
        title: "Gap",
        description: "Space between each item in the ticker.",
        defaultValue: 24,
        min: 0,
        max: 120,
        step: 4,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        description: "Horizontal inner padding of the ticker container.",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        description: "Vertical inner padding of the ticker container.",
        defaultValue: 8,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
    },

    // — Style ——————————————————————————————————————————————————————————————
    background: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color of the ticker container.",
        defaultValue: "#FFFFFF",
    },
})
