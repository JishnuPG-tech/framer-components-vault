// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useEffect,
    useLayoutEffect,
    useRef,
    type CSSProperties,
} from "react"
import { animate, useMotionValue } from "framer-motion"

interface Props {
    direction: string // "bottom" | "top"
}

// Locked default settings (the paid controls in the full version).
const BLUR = 12
const FADE_IN: any = { type: "spring", stiffness: 300, damping: 30 }
const FADE_OUT: any = { type: "spring", stiffness: 80, damping: 26 }
const LAYERS = 6

// Where the "full version" link points.
const FULL_VERSION_URL =
    "https://buy.polar.sh/polar_cl_7CwEW1iCPM4xJVpmRbzgcZkgUnbbNd14Zc2Gl4VIj2M"

// Avoids the SSR warning for useLayoutEffect on Framer's published export.
const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

/**
 * SCROLL BLUR ESSENTIAL
 *
 * The free version of Scroll Blur. Direction is adjustable; Blur strength and
 * the Fade In/Out transitions are locked to the defaults (those are the paid
 * controls in the full version).
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 200
 */
export default function ScrollBlurEssential(props: Props) {
    const { direction = "bottom" } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const containerRef = useRef<HTMLDivElement | null>(null)
    const sb = useMotionValue(0) // 0..1 blur strength
    const active = useRef(false) // currently scrolling?
    const idle = useRef<ReturnType<typeof setTimeout> | null>(null)
    const controls = useRef<any>(null)

    // Mirror the motion value onto a CSS variable (clamped >= 0 so a spring
    // undershoot can't produce an invalid negative blur radius). On the canvas
    // we hold it at full strength so the blur is visible while editing.
    useIsoLayoutEffect(() => {
        const node = containerRef.current
        if (!node) return
        const write = (v: number) =>
            node.style.setProperty("--sb", String(Math.max(0, v)))
        write(sb.get())
        const unsub = sb.on("change", write)
        if (isCanvas) sb.set(1)
        return unsub
    }, [isCanvas, sb])

    useEffect(() => {
        if (isCanvas) return

        const HOLD_MS = 180

        const clearIdle = () => {
            if (idle.current) {
                clearTimeout(idle.current)
                idle.current = null
            }
        }

        const onScroll = () => {
            if (!active.current) {
                active.current = true
                controls.current = animate(sb, 1, FADE_IN)
            }
            clearIdle()
            idle.current = setTimeout(() => {
                active.current = false
                controls.current = animate(sb, 0, FADE_OUT)
            }, HOLD_MS)
        }

        const opts: AddEventListenerOptions = { passive: true, capture: true }
        window.addEventListener("scroll", onScroll, opts)
        return () => {
            window.removeEventListener("scroll", onScroll, opts)
            clearIdle()
            if (controls.current) controls.current.stop()
        }
    }, [isCanvas, sb])

    const gradientDir = direction === "top" ? "to bottom" : "to top"
    const layers = []
    const step = 100 / LAYERS
    for (let i = 0; i < LAYERS; i++) {
        const b = (BLUR * (i + 1)) / LAYERS
        const coverTop = 100 - i * step
        const fadeStart = Math.max(0, coverTop - step)
        const mask = `linear-gradient(${gradientDir}, rgba(255,255,255,1) 0%, rgba(255,255,255,1) ${fadeStart}%, rgba(255,255,255,0) ${coverTop}%)`
        const filter = `blur(calc(var(--sb, 0) * ${b}px))`
        layers.push(
            <div
                key={i}
                style={{
                    position: "absolute",
                    inset: 0,
                    backdropFilter: filter,
                    WebkitBackdropFilter: filter,
                    WebkitMaskImage: mask,
                    maskImage: mask,
                }}
            />
        )
    }

    const containerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
    }

    // Canvas-only faint fill so the (otherwise transparent) component is visible
    // and grabbable when dropped. Never shown in preview or on the published site.
    const placeholderStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        background: "rgba(138,138,155,0.12)",
        borderRadius: 6,
        pointerEvents: "none",
    }

    return (
        <div ref={containerRef} style={containerStyle}>
            {layers}
            {isCanvas ? <div style={placeholderStyle} /> : null}
        </div>
    )
}

ScrollBlurEssential.defaultProps = {
    direction: "bottom",
}

// The Direction arrows are the one free control. Its description carries the
// upgrade link, so the text sits directly below the arrows in the panel.
addPropertyControls(ScrollBlurEssential, {
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["bottom", "top"],
        optionTitles: ["↑", "↓"],
        displaySegmentedControl: true,
        defaultValue: "bottom",
        description: `Unlock Blur and Fade In / Out controls — [get the full version →](${FULL_VERSION_URL})`,
    },
})
