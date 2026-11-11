// @framerDisableUnlink
// BuiltByKern Scroll Blur — full-frame soft progressive backdrop blur.
// Never opacity / isolation / clip-path on backdrop-filter layers.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView, useReducedMotion } from "framer-motion"
import {
    startTransition,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

type Position = "top" | "bottom"
/** edge = vertical fade · u = cupped · inverted = ∩ hard center / soft sides */
type Shape = "edge" | "u" | "inverted"
type Mode = "Always On" | "Follow Scroll" | "Off"

interface BuiltByKern_ScrollBlurProps {
    position: Position
    shape: Shape
    strength: number
    mode: Mode
    settleMs: number
    style?: CSSProperties
}

const LAYERS_MAX = 4
const LAYERS_LOW = 2
const STRENGTH_LAYER_CUTOFF = 4
const STRENGTH_MIN = 2
const STRENGTH_MAX = 10
const STRENGTH_DEFAULT = 8
const SCROLL_HYSTERESIS_PX = 6
const SETTLE_DEFAULT = 280

function layerCountFor(strength: number): number {
    return strength <= STRENGTH_LAYER_CUTOFF ? LAYERS_LOW : LAYERS_MAX
}

function edgeMask(
    position: Position,
    index: number,
    layerCount: number
): string {
    const step = 100 / layerCount
    const coverTop = 100 - index * step
    const fadeStart = Math.max(0, coverTop - step * 1.45)
    const dir = position === "bottom" ? "to top" : "to bottom"
    return `linear-gradient(${dir}, #fff 0%, #fff ${fadeStart}%, transparent ${coverTop}%)`
}

/**
 * U = cupped (clear center, dense sides).
 * Inverted (∩) = hard center, soft left/right sides.
 */
function cupMask(
    position: Position,
    index: number,
    inverted: boolean,
    layerCount: number
): string {
    const t = (index + 1) / layerCount
    const inv = 1 - index / Math.max(1, layerCount - 1)

    if (inverted) {
        const ew = Math.round(28 + (1 - t) * 55)
        const eh = Math.round(55 + t * 50)
        const cy = position === "bottom" ? "100%" : "0%"
        const core = Math.round(6 + t * 10)
        const mid = Math.round(22 + inv * 18)
        const fade = Math.round(48 + inv * 28)
        return `radial-gradient(ellipse ${ew}% ${eh}% at 50% ${cy}, #fff 0%, #fff ${core}%, rgba(255,255,255,0.55) ${mid}%, transparent ${fade}%)`
    }

    const cy = position === "bottom" ? "-6%" : "106%"
    const clear = Math.round(16 + inv * 30)
    const mid = Math.min(82, clear + 18 + inv * 8)
    const hard = Math.min(98, mid + 14 + t * 6)
    return `radial-gradient(ellipse ${125 + t * 45}% ${150 + t * 40}% at 50% ${cy}, transparent 0%, transparent ${clear}%, rgba(255,255,255,0.45) ${mid}%, #fff ${hard}%)`
}

/** Soft toward content — progress^3.5 of peak. */
function blurPx(
    strength: number,
    index: number,
    layerCount: number
): number {
    const progress = (index + 1) / layerCount
    return Math.pow(progress, 3.5) * strength
}

function collectScrollRoots(from: HTMLElement | null): Array<Window | Element> {
    const roots: Array<Window | Element> = []
    if (typeof window !== "undefined") roots.push(window)

    let node: HTMLElement | null = from
    while (node) {
        const style = window.getComputedStyle(node)
        const oy = style.overflowY
        const ox = style.overflowX
        if (
            oy === "auto" ||
            oy === "scroll" ||
            oy === "overlay" ||
            ox === "auto" ||
            ox === "scroll" ||
            ox === "overlay"
        ) {
            roots.push(node)
        }
        node = node.parentElement
    }

    if (typeof document !== "undefined") {
        const se = document.scrollingElement
        if (se && !roots.includes(se)) roots.push(se)
    }
    return roots
}

function readScrollY(root: Window | Element): number {
    if (root === window) {
        return window.scrollY || document.documentElement.scrollTop || 0
    }
    return (root as Element).scrollTop
}

/**
 * Scroll Blur
 *
 * Progressive backdrop blur for section chrome. Soft full-frame masks,
 * scroll show/hide via visibility (Safari-safe).
 *
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 280
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BuiltByKern_ScrollBlur(
    props: Partial<BuiltByKern_ScrollBlurProps>
) {
    const {
        position = "bottom",
        shape = "edge",
        strength = STRENGTH_DEFAULT,
        mode = "Always On",
        settleMs = SETTLE_DEFAULT,
        style,
    } = props

    const isCanvas = useIsOnFramerCanvas() ?? false
    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion() ?? false

    const safeStrength = Math.max(
        STRENGTH_MIN,
        Math.min(STRENGTH_MAX, strength)
    )
    const effectiveStrength = prefersReduced
        ? Math.max(STRENGTH_MIN, safeStrength * 0.45)
        : safeStrength
    const layerCount = layerCountFor(safeStrength)
    const safeSettle = Math.max(200, Math.min(700, Math.round(settleMs)))

    const activePosition: Position = position === "top" ? "top" : "bottom"
    const activeShape: Shape =
        shape === "u" || shape === "inverted" ? shape : "edge"
    const activeMode: Mode =
        mode === "Follow Scroll" || mode === "Off" || mode === "Always On"
            ? mode
            : "Always On"

    const alwaysOn =
        activeMode === "Always On" ||
        isStatic ||
        prefersReduced ||
        (isCanvas && activeMode === "Follow Scroll")

    const followScroll =
        activeMode === "Follow Scroll" &&
        !isCanvas &&
        !isStatic &&
        !prefersReduced

    const hidden = isCanvas && activeMode === "Off"

    const containerRef = useRef<HTMLDivElement>(null)
    const inView = useInView(containerRef, { amount: 0, once: false })
    const [visible, setVisible] = useState(alwaysOn)
    const idleRef = useRef<number | null>(null)
    const lastY = useRef(0)
    const scrollRaf = useRef<number | null>(null)

    useEffect(() => {
        startTransition(() => setVisible(alwaysOn))
    }, [alwaysOn])

    useEffect(() => {
        if (!followScroll) return
        if (!inView) startTransition(() => setVisible(false))
    }, [followScroll, inView])

    useEffect(() => {
        if (!followScroll || !inView) return
        if (typeof window === "undefined") return

        const clearIdle = () => {
            if (idleRef.current !== null) {
                window.clearTimeout(idleRef.current)
                idleRef.current = null
            }
        }

        const onActivity = () => {
            startTransition(() => setVisible(true))
            clearIdle()
            idleRef.current = window.setTimeout(() => {
                startTransition(() => setVisible(false))
            }, safeSettle)
        }

        const onScroll = (root: Window | Element) => {
            if (scrollRaf.current !== null) return
            scrollRaf.current = window.requestAnimationFrame(() => {
                scrollRaf.current = null
                const y = readScrollY(root)
                if (Math.abs(y - lastY.current) < SCROLL_HYSTERESIS_PX) return
                lastY.current = y
                onActivity()
            })
        }

        const roots = collectScrollRoots(containerRef.current)
        const opts: AddEventListenerOptions = { passive: true }
        const handlers = roots.map((root) => {
            const fn = () => onScroll(root)
            root.addEventListener("scroll", fn, opts)
            return { root, fn }
        })

        lastY.current = readScrollY(window)

        return () => {
            for (const { root, fn } of handlers) {
                root.removeEventListener("scroll", fn, opts)
            }
            if (scrollRaf.current !== null) {
                window.cancelAnimationFrame(scrollRaf.current)
            }
            clearIdle()
        }
    }, [followScroll, inView, safeSettle])

    const layers = useMemo(() => {
        if (!inView && !isCanvas && !isStatic) return []
        const nodes: JSX.Element[] = []
        const inverted = activeShape === "inverted"
        for (let i = 0; i < layerCount; i += 1) {
            const px = blurPx(effectiveStrength, i, layerCount)
            const mask =
                activeShape === "edge"
                    ? edgeMask(activePosition, i, layerCount)
                    : cupMask(activePosition, i, inverted, layerCount)
            const filter = `blur(${px.toFixed(1)}px)`
            nodes.push(
                <div
                    key={i}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        backdropFilter: filter,
                        WebkitBackdropFilter: filter,
                        maskImage: mask,
                        WebkitMaskImage: mask,
                    }}
                />
            )
        }
        return nodes
    }, [
        activePosition,
        activeShape,
        effectiveStrength,
        inView,
        isCanvas,
        isStatic,
        layerCount,
    ])

    const root: CSSProperties = {
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        visibility: hidden || !visible ? "hidden" : "visible",
    }

    return (
        <div ref={containerRef} style={root} aria-hidden="true">
            {layers}
        </div>
    )
}

BuiltByKern_ScrollBlur.displayName = "Scroll Blur"

addPropertyControls(BuiltByKern_ScrollBlur, {
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["edge", "u", "inverted"],
        optionTitles: ["Edge", "U", "∩"],
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        defaultValue: "edge",
        description:
            "Edge = vertical fade. U = cupped (clear center). ∩ = hard center, soft sides.",
    },
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["bottom", "top"],
        optionTitles: ["Bottom", "Top"],
        displaySegmentedControl: true,
        defaultValue: "bottom",
        description: "Pinned edge where blur is strongest.",
    },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: STRENGTH_DEFAULT,
        min: STRENGTH_MIN,
        max: STRENGTH_MAX,
        step: 1,
        unit: "px",
        description: "Peak blur at the dense end (Safari-safe range).",
    },
    settleMs: {
        type: ControlType.Number,
        title: "Settle",
        defaultValue: SETTLE_DEFAULT,
        min: 200,
        max: 700,
        step: 10,
        unit: "ms",
        hidden: (p) => p.mode !== "Follow Scroll",
        description:
            "Idle delay after the last scroll before hide (not a fade).",
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["Always On", "Follow Scroll", "Off"],
        optionTitles: ["Always On", "Follow Scroll", "Off"],
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        defaultValue: "Always On",
        description:
            "Always On = pinned. Follow Scroll = show while scrolling (Preview). Off = hide on canvas.\n\nBuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)",
    },
})
