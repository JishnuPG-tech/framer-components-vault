// Organic Radial Background — v2
// Fixes for scroll jitter + compositing conflicts:
// Organic Radial Background — v2
// Fixes for scroll jitter + compositing conflicts:
// - Pause SVG animations when offscreen (IntersectionObserver + svg.pauseAnimations())
// - Avoid unnecessary regeneration (remove backgroundColor from deps, stable signature)
// - Optional mobile dot cap for performance
// - Respects prefers-reduced-motion unless Preview Animation enabled

import { useEffect, useMemo, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface OrganicRadialProps {
    totalDots: number
    mobileDotCap: number
    dotRadius: number
    duration: number
    backgroundColor: string
    margin: number
    minOpacity: number
    maxOpacity: number
    minScale: number
    maxScale: number
    useMultipleColors: boolean
    colors: { color: string }[]
    organicVariation: number
    previewAnimation: boolean
    pauseWhenOffscreen: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function OrganicRadialBackground(props: OrganicRadialProps) {
    const {
        totalDots = 600,
        mobileDotCap = 320,
        dotRadius = 2,
        duration = 4,
        backgroundColor = "#000000",
        margin = 20,
        minOpacity = 0.2,
        maxOpacity = 1,
        minScale = 0.8,
        maxScale = 1.3,
        useMultipleColors = true,
        colors = [
            { color: "#FF00FF" },
            { color: "#9D00FF" },
            { color: "#00FFFF" },
            { color: "#7FFF00" },
            { color: "#FF6600" },
        ],
        organicVariation = 0.3,
        previewAnimation = false,
        pauseWhenOffscreen = true,
    } = props

    const svgRef = useRef<SVGSVGElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    // Reduced motion (in published). PreviewAnimation overrides this in canvas if user wants.
    const prefersReducedMotion =
        typeof window !== "undefined"
            ? window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
            : false

    // Decide dot count based on viewport width (safe + simple)
    const effectiveDotCount = useMemo(() => {
        const isMobile =
            typeof window !== "undefined" ? window.innerWidth <= 560 : false
        if (isMobile) return Math.min(totalDots, mobileDotCap)
        return totalDots
    }, [totalDots, mobileDotCap])

    // Create a stable signature so we only rebuild when the actual pattern inputs change.
    // IMPORTANT: backgroundColor does not affect SVG points, only wrapper style.
    const signature = useMemo(() => {
        const colorList = (colors || []).map((c) => c?.color || "").join("|")
        return [
            effectiveDotCount,
            dotRadius,
            duration,
            margin,
            minOpacity,
            maxOpacity,
            minScale,
            maxScale,
            useMultipleColors ? 1 : 0,
            colorList,
            organicVariation,
            // animation mode changes SVG attributes
            isStatic ? 1 : 0,
            previewAnimation ? 1 : 0,
            prefersReducedMotion ? 1 : 0,
        ].join("::")
    }, [
        effectiveDotCount,
        dotRadius,
        duration,
        margin,
        minOpacity,
        maxOpacity,
        minScale,
        maxScale,
        useMultipleColors,
        colors,
        organicVariation,
        isStatic,
        previewAnimation,
        prefersReducedMotion,
    ])

    const lastSigRef = useRef<string>("")

    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return

        // Avoid rebuilding if nothing materially changed
        if (lastSigRef.current === signature) return
        lastSigRef.current = signature

        const SIZE = 800
        const PHI = (1 + Math.sqrt(5)) / 2
        const GOLDEN_ANGLE = 2 * Math.PI * (1 - 1 / PHI)
        const CENTER = SIZE / 2
        const MAX_RADIUS = CENTER - margin - dotRadius

        // Clear existing content
        svg.innerHTML = ""

        const fragment = document.createDocumentFragment()

        // If static renderer and previewAnimation is off OR reduced motion requested:
        // render dots without SMIL animation to keep it perfectly stable.
        const shouldAnimate =
            (!isStatic || previewAnimation) && !prefersReducedMotion

        for (let i = 0; i < effectiveDotCount; i++) {
            const theta = i * GOLDEN_ANGLE
            const r = Math.sqrt(i / effectiveDotCount) * MAX_RADIUS

            const petalCount = 8
            const petalStrength = organicVariation * 20
            const petalOffset =
                Math.sin(theta * petalCount) * petalStrength * (r / MAX_RADIUS)

            const finalR = r + petalOffset
            const x = CENTER + finalR * Math.cos(theta)
            const y = CENTER + finalR * Math.sin(theta)

            const distanceFromCenter = i / effectiveDotCount

            let currentColor = colors[0]?.color || "#FFFFFF"
            if (useMultipleColors && colors.length > 0) {
                const colorIndex = Math.floor(
                    distanceFromCenter * colors.length
                )
                currentColor =
                    colors[Math.min(colorIndex, colors.length - 1)].color
            }

            const circle = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            )
            circle.setAttribute("cx", x.toString())
            circle.setAttribute("cy", y.toString())
            circle.setAttribute("r", dotRadius.toString())
            circle.setAttribute("fill", currentColor)

            if (!shouldAnimate) {
                circle.setAttribute("opacity", "0.7")
            } else {
                circle.setAttribute("opacity", "0")
                const animDelay = distanceFromCenter * duration * 0.5

                const animR = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "animate"
                )
                animR.setAttribute("attributeName", "r")
                animR.setAttribute(
                    "values",
                    `${dotRadius * minScale};${dotRadius * maxScale};${dotRadius * minScale}`
                )
                animR.setAttribute("dur", `${duration}s`)
                animR.setAttribute("begin", `${animDelay}s`)
                animR.setAttribute("repeatCount", "indefinite")
                animR.setAttribute("calcMode", "spline")
                animR.setAttribute("keySplines", "0.4 0 0.6 1;0.4 0 0.6 1")
                circle.appendChild(animR)

                const animO = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "animate"
                )
                animO.setAttribute("attributeName", "opacity")
                animO.setAttribute(
                    "values",
                    `${minOpacity};${maxOpacity};${minOpacity}`
                )
                animO.setAttribute("dur", `${duration}s`)
                animO.setAttribute("begin", `${animDelay}s`)
                animO.setAttribute("repeatCount", "indefinite")
                animO.setAttribute("calcMode", "spline")
                animO.setAttribute("keySplines", "0.4 0 0.6 1;0.4 0 0.6 1")
                circle.appendChild(animO)
            }

            fragment.appendChild(circle)
        }

        svg.appendChild(fragment)

        // When we rebuild, if animations exist and we are allowed to animate,
        // default to running (IntersectionObserver will pause if needed).
        if (
            pauseWhenOffscreen &&
            typeof (svg as any).unpauseAnimations === "function"
        ) {
            try {
                ;(svg as any).unpauseAnimations()
            } catch {}
        }
    }, [
        signature,
        effectiveDotCount,
        colors,
        dotRadius,
        duration,
        margin,
        minOpacity,
        maxOpacity,
        minScale,
        maxScale,
        useMultipleColors,
        organicVariation,
        isStatic,
        previewAnimation,
        prefersReducedMotion,
        pauseWhenOffscreen,
    ])

    // Pause animations when not visible (this is the big win for scroll jitter)
    useEffect(() => {
        if (!pauseWhenOffscreen) return
        const svg = svgRef.current as any
        const wrapper = wrapperRef.current
        if (!svg || !wrapper) return

        // If no SMIL animation methods exist, nothing to do
        const canPause =
            typeof svg.pauseAnimations === "function" &&
            typeof svg.unpauseAnimations === "function"
        if (!canPause) return

        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return
                // Pause as soon as it leaves viewport; resume when visible.
                try {
                    if (entry.isIntersecting) svg.unpauseAnimations()
                    else svg.pauseAnimations()
                } catch {}
            },
            { threshold: 0.05 }
        )

        io.observe(wrapper)
        return () => io.disconnect()
    }, [pauseWhenOffscreen])

    return (
        <div
            ref={wrapperRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                // compositing stability hints
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                ...props.style,
            }}
        >
            <svg
                ref={svgRef}
                width="800"
                height="800"
                viewBox="0 0 800 800"
                style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: "auto",
                    height: "auto",
                }}
            />
        </div>
    )
}

OrganicRadialBackground.displayName = "OrganicRadialBackground"

addPropertyControls(OrganicRadialBackground, {
    previewAnimation: {
        type: ControlType.Boolean,
        title: "Preview Animation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    pauseWhenOffscreen: {
        type: ControlType.Boolean,
        title: "Pause Offscreen",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    totalDots: {
        type: ControlType.Number,
        title: "Total Dots",
        defaultValue: 600,
        min: 100,
        max: 1200,
        step: 50,
    },
    mobileDotCap: {
        type: ControlType.Number,
        title: "Mobile Dot Cap",
        description: "Caps dots on small screens for smoother scroll",
        defaultValue: 320,
        min: 120,
        max: 600,
        step: 20,
    },
    dotRadius: {
        type: ControlType.Number,
        title: "Dot Radius",
        defaultValue: 2,
        min: 0.5,
        max: 8,
        step: 0.1,
        unit: "px",
    },
    duration: {
        type: ControlType.Number,
        title: "Pulse Duration",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
    },
    organicVariation: {
        type: ControlType.Number,
        title: "Organic Variation",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
    },
    useMultipleColors: {
        type: ControlType.Boolean,
        title: "Multiple Colors",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    colors: {
        type: ControlType.Array,
        title: "Colors",
        control: {
            type: ControlType.Object,
            controls: {
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#FFFFFF",
                },
            },
        },
        defaultValue: [
            { color: "#FF00FF" },
            { color: "#9D00FF" },
            { color: "#00FFFF" },
            { color: "#7FFF00" },
            { color: "#FF6600" },
        ],
        maxCount: 10,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
    },
    margin: {
        type: ControlType.Number,
        title: "Margin",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    minOpacity: {
        type: ControlType.Number,
        title: "Min Opacity",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.1,
    },
    maxOpacity: {
        type: ControlType.Number,
        title: "Max Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.1,
    },
    minScale: {
        type: ControlType.Number,
        title: "Min Scale",
        defaultValue: 0.8,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
    maxScale: {
        type: ControlType.Number,
        title: "Max Scale",
        defaultValue: 1.3,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
})
