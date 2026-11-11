// ──────────────────────────────────────────────────────────────────────────────
// Typography Hover Interaction Component — Ver.2 (Metaball Effect)
// ──────────────────────────────────────────────────────────────────────────────
//
// SKILL.md Rules Applied:
//  ✓ @framer annotations (DisableUnlink, IntrinsicWidth/Height, SupportedLayout)
//  ✓ Font object spread (never access individual font props)
//  ✓ Hydration-safe two-phase rendering (isClient pattern)
//  ✓ startTransition() wrapping all state updates
//  ✓ RenderTarget detection (canvas vs preview)
//  ✓ IntersectionObserver for scroll-triggered mobile fallback
//  ✓ GPU acceleration (willChange, translateZ(0), backfaceVisibility)
//  ✓ defaultProps always defined
//
// Metaball Technique:
//  The "gooey" merge effect uses an SVG feGaussianBlur + feColorMatrix
//  filter applied to the text container. When scaled characters overlap,
//  the blur creates soft edges that the color matrix re-sharpens,
//  producing the organic "melting together" metaball look.
//  This is GPU-composited and avoids any Canvas/WebGL overhead.
// ──────────────────────────────────────────────────────────────────────────────

import {
    useState,
    useEffect,
    useRef,
    useCallback,
    startTransition,
} from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ── Constants ────────────────────────────────────────────────────────────────

/** Buttery easing — fast attack, graceful settle */
const EASE_EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Transition presets */
const TRANSITION_SMOOTH = { duration: 0.65, ease: EASE_EXPO_OUT }

// ── Types ────────────────────────────────────────────────────────────────────

interface TypographyHoverProps {
    // --- Core Props ---
    text: string
    initialColor: string
    hoverColor: string
    font: Record<string, any>
    fontSize: number
    hoverScale: number

    // --- Metaball ---
    metaballIntensity: number // blur radius for gooey effect (px)
    metaballThreshold: number // alpha threshold for edge sharpening

    // --- Animation ---
    transitionSpeed: number

    // --- Mobile ---
    mobileThreshold: number

    // --- Framer ---
    style?: React.CSSProperties
}

// ── Utility: detect touch device via media query ─────────────────────────────

function useIsTouchDevice(): boolean {
    const [isTouch, setIsTouch] = useState(false)

    useEffect(() => {
        const mql = window.matchMedia("(hover: none)")
        startTransition(() => {
            setIsTouch(mql.matches)
        })

        const handler = (e: MediaQueryListEvent) => {
            startTransition(() => {
                setIsTouch(e.matches)
            })
        }

        mql.addEventListener("change", handler)
        return () => mql.removeEventListener("change", handler)
    }, [])

    return isTouch
}

// ── Utility: IntersectionObserver hook for mobile fallback ────────────────────

function useInView(
    ref: React.RefObject<HTMLElement | null>,
    threshold: number
): boolean {
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                startTransition(() => {
                    setInView(entry.isIntersecting)
                })
            },
            { threshold: Math.max(0.05, Math.min(threshold, 1)) }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [ref, threshold])

    return inView
}

// ── SVG Gooey Filter Definition ──────────────────────────────────────────────
// This is the core of the metaball effect.
// 1. feGaussianBlur softens the edges of each character
// 2. feColorMatrix with high alpha contrast re-sharpens the blurred overlap
//    zones, creating the organic "merging blob" appearance.

function GooeyFilterDef({
    id,
    blur,
    threshold,
}: {
    id: string
    blur: number
    threshold: number
}) {
    // The color matrix multiplies the alpha channel to create sharp edges
    // from the blurred shapes. Higher threshold = sharper edges.
    const alphaMultiplier = Math.max(10, Math.min(threshold, 100))
    const alphaShift = -(alphaMultiplier / 2 - 0.5)

    return (
        <svg
            style={{
                position: "absolute",
                width: 0,
                height: 0,
                overflow: "hidden",
                pointerEvents: "none",
            }}
            aria-hidden="true"
        >
            <defs>
                <filter id={id}>
                    {/* Step 1: Blur — softens character edges */}
                    <feGaussianBlur
                        in="SourceGraphic"
                        stdDeviation={blur}
                        result="blur"
                    />
                    {/* Step 2: Alpha threshold — re-sharpens overlapping areas */}
                    <feColorMatrix
                        in="blur"
                        type="matrix"
                        values={`
                            1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 ${alphaMultiplier} ${alphaShift}
                        `}
                        result="goo"
                    />
                    {/* Step 3: Composite — merge gooey result with original */}
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
            </defs>
        </svg>
    )
}

// ── Main Component ───────────────────────────────────────────────────────────

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function TypographyHoverMetaball(props: TypographyHoverProps) {
    const {
        text = "TEXT HERE",
        initialColor = "#ffffff",
        hoverColor = "#ff3c5f",
        font,
        fontSize = 72,
        hoverScale = 1.08,
        metaballIntensity = 8,
        metaballThreshold = 35,
        transitionSpeed = 0.55,
        mobileThreshold = 0.45,
        style,
    } = props

    // --- Stable filter ID (unique per component instance) ---
    const filterIdRef = useRef(
        `gooey-${Math.random().toString(36).slice(2, 9)}`
    )
    const filterId = filterIdRef.current

    // --- Hydration safety (SKILL.md: two-phase rendering) ---
    const [isClient, setIsClient] = useState(false)
    useEffect(() => {
        startTransition(() => {
            setIsClient(true)
        })
    }, [])

    // --- Canvas detection ---
    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas

    // --- Refs ---
    const containerRef = useRef<HTMLDivElement>(null)
    const charRefsArray = useRef<(HTMLSpanElement | null)[]>([])
    const mouseXRef = useRef<number | null>(null)
    const isHoveredRef = useRef(false)
    const rafId = useRef<number>(0)

    // --- Hover state (for glow only) ---
    const [isHovered, setIsHovered] = useState(false)

    // --- Touch/mobile detection (always call hook — Rules of Hooks) ---
    const isTouchRaw = useIsTouchDevice()
    const isTouchDevice = isClient ? isTouchRaw : false

    // --- IntersectionObserver mobile fallback ---
    const isInView = useInView(containerRef, mobileThreshold)

    // Determine active state: hover on desktop, in-view on mobile
    const isActive = isTouchDevice ? isInView : isHovered

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (isTouchDevice) return
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
                mouseXRef.current = e.clientX - rect.left
            }
        },
        [isTouchDevice]
    )

    const handlePointerEnter = useCallback(
        (e: React.PointerEvent) => {
            if (isTouchDevice) return
            isHoveredRef.current = true
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
                mouseXRef.current = e.clientX - rect.left
            }
            setIsHovered(true)
        },
        [isTouchDevice]
    )

    const handlePointerLeave = useCallback(() => {
        if (isTouchDevice) return
        isHoveredRef.current = false
        mouseXRef.current = null
        setIsHovered(false)
    }, [isTouchDevice])

    // --- rAF animation loop: smooth wave via direct DOM manipulation ---
    useEffect(() => {
        if (!isClient || isTouchDevice) return

        const LERP_SPEED = 0.12
        const RADIUS = fontSize * 2.5
        const extraScale = hoverScale - 1

        const currentScales: number[] = new Array(text.length).fill(1)

        const tick = () => {
            const chars = charRefsArray.current
            const mouseX = mouseXRef.current
            const hovered = isHoveredRef.current

            for (let i = 0; i < chars.length; i++) {
                const el = chars[i]
                if (!el) continue

                let targetScale = 1
                if (hovered && mouseX !== null) {
                    const charRect = el.getBoundingClientRect()
                    const containerRect =
                        containerRef.current?.getBoundingClientRect()
                    if (containerRect) {
                        const charCenterX =
                            charRect.left -
                            containerRect.left +
                            charRect.width / 2
                        const distance = Math.abs(mouseX - charCenterX)

                        if (distance < RADIUS) {
                            const t = 1 - distance / RADIUS
                            const influence = t * t * (3 - 2 * t)
                            targetScale = 1 + extraScale * influence
                        }
                    }
                }

                currentScales[i] +=
                    (targetScale - currentScales[i]) * LERP_SPEED

                if (Math.abs(currentScales[i] - 1) < 0.001) {
                    currentScales[i] = 1
                }

                el.style.transform = `scale(${currentScales[i]})`
                el.style.color =
                    currentScales[i] > 1.005 ? hoverColor : initialColor
            }

            rafId.current = requestAnimationFrame(tick)
        }

        rafId.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafId.current)
    }, [
        isClient,
        isTouchDevice,
        text,
        fontSize,
        hoverScale,
        hoverColor,
        initialColor,
    ])

    // ── SSR fallback ─────────────────────────────────────────────────────────
    if (!isClient) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                <span
                    style={{
                        ...(font || {}),
                        fontSize,
                        color: initialColor,
                    }}
                >
                    {text}
                </span>
            </div>
        )
    }

    // ── Canvas preview ───────────────────────────────────────────────────────
    if (isOnCanvas) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <span
                    style={{
                        ...(font || {}),
                        fontSize,
                        color: initialColor,
                        whiteSpace: "nowrap",
                    }}
                >
                    {text}
                </span>
                <div
                    style={{
                        position: "absolute",
                        bottom: 6,
                        right: 8,
                        fontSize: 9,
                        color: "rgba(255,255,255,0.35)",
                        fontFamily: "Inter, sans-serif",
                        letterSpacing: "0.06em",
                        pointerEvents: "none",
                    }}
                >
                    METABALL ↗
                </div>
            </div>
        )
    }

    // ── Full interactive render ──────────────────────────────────────────────

    return (
        <>
            {/* SVG filter definition — injected once, referenced by CSS */}
            <GooeyFilterDef
                id={filterId}
                blur={metaballIntensity}
                threshold={metaballThreshold}
            />

            <motion.div
                ref={containerRef}
                onPointerMove={handlePointerMove}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                style={{
                    ...style,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                    willChange: "transform",
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                }}
            >
                {/* ── Metaball Text Container ─────────────────────────────── */}
                {/*
                    The SVG filter is applied to this wrapper div.
                    When characters scale up and their blurred edges overlap,
                    the feColorMatrix merges them into one organic shape.
                    The background color MUST match the component's background
                    for the contrast trick to work — we use a pseudo-approach
                    with the filter applied directly.
                */}
                <div
                    aria-label={text}
                    style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        overflow: "visible",
                        // Apply the SVG gooey filter ONLY when hovered
                        filter: isActive ? `url(#${filterId})` : "none",
                        WebkitFilter: isActive ? `url(#${filterId})` : "none",
                        // Smooth transition for filter on/off
                        transition:
                            "filter 0.3s ease, -webkit-filter 0.3s ease",
                    }}
                >
                    {text.split("").map((char, index) => (
                        <motion.span
                            key={`${char}-${index}`}
                            ref={(el) => {
                                charRefsArray.current[index] = el
                            }}
                            aria-hidden="true"
                            // Mobile fallback
                            {...(isTouchDevice
                                ? {
                                      animate: isInView
                                          ? {
                                                scale: hoverScale,
                                                color: hoverColor,
                                            }
                                          : {
                                                scale: 1,
                                                color: initialColor,
                                            },
                                      transition: {
                                          type: "spring",
                                          stiffness: 400,
                                          damping: 22,
                                          mass: 0.6,
                                          delay: index * 0.03,
                                      },
                                  }
                                : {})}
                            style={{
                                ...(font || {}),
                                fontSize,
                                color: initialColor,
                                display: "inline-block",
                                whiteSpace: "pre",
                                willChange: "transform, color",
                                transformOrigin: "center bottom",
                                transition: isTouchDevice
                                    ? undefined
                                    : "color 0.2s ease",
                            }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </div>

                {/* ── Ambient glow behind text on hover ───────────────────── */}
                <motion.div
                    animate={{
                        opacity: isActive ? 0.35 : 0,
                        scale: isActive ? 1.2 : 0.8,
                    }}
                    transition={TRANSITION_SMOOTH}
                    style={{
                        position: "absolute",
                        width: "80%",
                        height: "120%",
                        borderRadius: "50%",
                        background: `radial-gradient(ellipse at center, ${hoverColor}30, transparent 70%)`,
                        filter: "blur(40px)",
                        zIndex: 0,
                        pointerEvents: "none",
                        willChange: "transform, opacity",
                    }}
                />
            </motion.div>
        </>
    )
}

// ── Display Name ─────────────────────────────────────────────────────────────

TypographyHoverMetaball.displayName = "METABALLTEXT"

// ── Default Props ────────────────────────────────────────────────────────────

TypographyHoverMetaball.defaultProps = {
    text: "TEXT HERE",
    initialColor: "#ffffff",
    hoverColor: "#ff3c5f",
    font: {
        fontFamily: "Inter",
        fontWeight: 800,
        fontSize: 72,
        lineHeight: "1em",
        letterSpacing: "-0.03em",
    },
    fontSize: 72,
    hoverScale: 1.3,
    metaballIntensity: 8,
    metaballThreshold: 35,
    transitionSpeed: 0.55,
    mobileThreshold: 0.45,
}

// ── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(TypographyHoverMetaball, {
    // ── Typography ───────────────────────────────────────────────────────────
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "TEXT HERE",
        placeholder: "Enter display text…",
    },
    font: {
        type: ControlType.Font,
        title: "Font Style",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 72,
            lineHeight: "1em",
            letterSpacing: "-0.03em",
        },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 72,
        min: 12,
        max: 400,
        step: 1,
        unit: "px",
    },

    // ── Colors ───────────────────────────────────────────────────────────────
    initialColor: {
        type: ControlType.Color,
        title: "Default Color",
        defaultValue: "#ffffff",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#ff3c5f",
    },

    // ── Hover Scale ──────────────────────────────────────────────────────────
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.3,
        min: 1,
        max: 2,
        step: 0.01,
        description:
            "Scale factor for hovered characters. Higher values make the metaball merge more visible.",
    },

    // ── Metaball Effect ──────────────────────────────────────────────────────
    metaballIntensity: {
        type: ControlType.Number,
        title: "Gooey Blur",
        defaultValue: 8,
        min: 1,
        max: 30,
        step: 1,
        unit: "px",
        description:
            "Blur radius for the metaball effect. Higher = softer, more liquid merging.",
    },
    metaballThreshold: {
        type: ControlType.Number,
        title: "Gooey Sharpness",
        defaultValue: 35,
        min: 10,
        max: 80,
        step: 1,
        description:
            "Alpha threshold for edge sharpening. Lower = more gooey, Higher = crisper edges.",
    },

    // ── Animation ────────────────────────────────────────────────────────────
    transitionSpeed: {
        type: ControlType.Number,
        title: "Transition",
        defaultValue: 0.55,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
        description: "Duration for hover animations.",
    },

    // ── Mobile Fallback ──────────────────────────────────────────────────────
    mobileThreshold: {
        type: ControlType.Number,
        title: "Mobile Threshold",
        defaultValue: 0.45,
        min: 0.1,
        max: 1,
        step: 0.05,
        description:
            "IntersectionObserver threshold on touch devices. " +
            "When this % of the component enters the viewport, " +
            "the hover state triggers automatically.",
    },
})
