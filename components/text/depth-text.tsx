// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useMemo, useRef, type CSSProperties } from "react"

const MAX_LAYERS = 64

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)

const getLayerColor = (
    faceColor: string,
    depthColor: string,
    index: number,
    total: number
) => {
    const progress = total <= 1 ? 1 : index / total
    const eased = progress * progress
    const faceMix = Math.round((1 - eased) * 72 + 4)
    return `color-mix(in srgb, ${faceColor} ${faceMix}%, ${depthColor})`
}

const getTransform = (x: number, y: number) =>
    `rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg)`

interface DepthTextProps {
    text: string
    tag: "h1" | "h2" | "h3" | "p" | "span"
    font: CSSProperties
    faceColor: string
    depthColor: string
    layers: number
    depth: number
    shadow: boolean
    tilt: number
    perspective: number
    pointerTracking: boolean
    smoothing: number
    autoOrbit: boolean
    orbitSpeed: number
    style?: CSSProperties
}

/**
 * Depth Text
 *
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 140
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function DepthText3D(props: DepthTextProps) {
    const {
        text = "Elevate",
        tag = "span",
        font,
        faceColor = "#F8FAFC",
        depthColor = "#7C3AED",
        layers = 34,
        depth = 2.4,
        shadow = true,
        tilt = 7.5,
        perspective = 900,
        pointerTracking = true,
        smoothing = 0.14,
        autoOrbit = true,
        orbitSpeed = 0.35,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)

    const safeLayers = clamp(Math.round(layers || 1), 2, MAX_LAYERS)
    const safeDepth = clamp(depth || 0, 0, 12)
    const safeTilt = clamp(tilt || 0, 0, 12)
    const safeSmoothing = clamp(smoothing || 0.14, 0.02, 0.35)
    const safePerspective = clamp(perspective || 900, 300, 2000)
    const safeOrbitSpeed = clamp(orbitSpeed || 0, 0, 2)

    const baseX = -safeTilt * 0.32
    const baseY = safeTilt * 0.42

    const depthLayers = useMemo(
        () =>
            Array.from({ length: safeLayers }, (_, i) => {
                const index = safeLayers - i
                return {
                    index,
                    color: getLayerColor(faceColor, depthColor, index, safeLayers),
                    transform: `translateZ(${-index * safeDepth}px)`,
                }
            }),
        [safeLayers, safeDepth, faceColor, depthColor]
    )

    useEffect(() => {
        const root = rootRef.current
        const stage = stageRef.current
        if (isStatic || !root || !stage || typeof window === "undefined") return

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        const finePointer = window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        ).matches
        const canTrackPointer = pointerTracking && finePointer && !reducedMotion

        const current = { x: baseX, y: baseY }
        const target = { x: baseX, y: baseY }
        const apply = () => {
            stage.style.transform = getTransform(current.x, current.y)
        }
        apply()
        if (reducedMotion) return

        let frameId = 0
        let running = false
        let activePointer = false
        const startTime = performance.now()

        const onPointerMove = (event: PointerEvent) => {
            const rect = root.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            activePointer = true
            const x = clamp(
                (event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.8),
                -1,
                1
            )
            const y = clamp(
                (event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.8),
                -1,
                1
            )
            target.x = baseX - y * safeTilt
            target.y = baseY + x * safeTilt
        }
        const onPointerLeave = () => {
            activePointer = false
            target.x = baseX
            target.y = baseY
        }

        if (canTrackPointer) {
            window.addEventListener("pointermove", onPointerMove)
            document.documentElement.addEventListener("pointerleave", onPointerLeave)
            window.addEventListener("blur", onPointerLeave)
        }

        const tick = (now: number) => {
            if ((!canTrackPointer || !activePointer) && autoOrbit) {
                const orbit = ((now - startTime) / 1000) * safeOrbitSpeed * Math.PI * 2
                const amount = canTrackPointer ? 0.18 : 0.55
                target.x = baseX + Math.sin(orbit) * safeTilt * amount
                target.y = baseY + Math.cos(orbit * 0.85) * safeTilt * amount
            }
            current.x += (target.x - current.x) * safeSmoothing
            current.y += (target.y - current.y) * safeSmoothing
            apply()
            frameId = requestAnimationFrame(tick)
        }

        const start = () => {
            if (running) return
            running = true
            frameId = requestAnimationFrame(tick)
        }
        const stop = () => {
            running = false
            cancelAnimationFrame(frameId)
        }

        // Only animate while the text is on screen
        const observer = new IntersectionObserver(
            ([entry]) => (entry.isIntersecting ? start() : stop()),
            { threshold: 0.1 }
        )
        observer.observe(root)

        return () => {
            observer.disconnect()
            stop()
            if (canTrackPointer) {
                window.removeEventListener("pointermove", onPointerMove)
                document.documentElement.removeEventListener(
                    "pointerleave",
                    onPointerLeave
                )
                window.removeEventListener("blur", onPointerLeave)
            }
        }
    }, [
        isStatic,
        autoOrbit,
        pointerTracking,
        baseX,
        baseY,
        safeOrbitSpeed,
        safeSmoothing,
        safeTilt,
    ])

    const Tag = tag as "span"
    const isFixedWidth = style?.width === "100%"
    const isFixedHeight = style?.height === "100%"

    const textStyle: CSSProperties = {
        ...font,
        gridArea: "1 / 1",
        display: "inline-block",
        margin: 0,
        whiteSpace: "pre",
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        fontKerning: "normal",
        textRendering: "geometricPrecision",
    }

    const faceShadow = shadow
        ? `0 22px 34px color-mix(in srgb, ${depthColor} 36%, transparent), 0 4px 8px rgba(0, 0, 0, 0.28)`
        : "none"

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isFixedWidth ? "100%" : "max-content",
                height: isFixedHeight ? "100%" : "auto",
                perspective: `${safePerspective}px`,
                perspectiveOrigin: "50% 48%",
                isolation: "isolate",
            }}
        >
            <div
                ref={stageRef}
                style={{
                    position: "relative",
                    display: "inline-grid",
                    placeItems: "center",
                    transformStyle: "preserve-3d",
                    transform: getTransform(baseX, baseY),
                    transformOrigin: "50% 50%",
                    willChange: isStatic ? "auto" : "transform",
                }}
            >
                {/* Layers draw the text via ::before so it appears only once in the HTML */}
                <style>{`.depth-text-layer::before{content:attr(data-text)}`}</style>
                {depthLayers.map((layer) => (
                    <span
                        aria-hidden="true"
                        className="depth-text-layer"
                        data-text={text}
                        key={layer.index}
                        style={{
                            ...textStyle,
                            position: "absolute",
                            inset: 0,
                            zIndex: 0,
                            color: layer.color,
                            transform: layer.transform,
                            filter: "saturate(0.95) brightness(0.92)",
                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                    />
                ))}
                <Tag
                    style={{
                        ...textStyle,
                        position: "relative",
                        zIndex: 1,
                        color: faceColor,
                        textShadow: faceShadow,
                        transform: "translateZ(0.6px)",
                    }}
                >
                    {text}
                </Tag>
            </div>
        </div>
    )
}

DepthText3D.displayName = "Depth Text"

addPropertyControls(DepthText3D, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Elevate",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "112px",
            variant: "Black",
            letterSpacing: "-0.065em",
            lineHeight: "0.86em",
            textAlign: "center",
        },
    },
    faceColor: {
        type: ControlType.Color,
        title: "Face",
        defaultValue: "#F8FAFC",
    },
    depthColor: {
        type: ControlType.Color,
        title: "Depth Color",
        defaultValue: "#7C3AED",
    },
    layers: {
        type: ControlType.Number,
        title: "Layers",
        defaultValue: 34,
        min: 2,
        max: MAX_LAYERS,
        step: 1,
    },
    depth: {
        type: ControlType.Number,
        title: "Depth",
        defaultValue: 2.4,
        min: 0,
        max: 12,
        step: 0.1,
        unit: "px",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 7.5,
        min: 0,
        max: 12,
        step: 0.1,
        unit: "°",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 900,
        min: 300,
        max: 2000,
        step: 10,
        unit: "px",
    },
    pointerTracking: {
        type: ControlType.Boolean,
        title: "Follow Cursor",
        defaultValue: true,
    },
    autoOrbit: {
        type: ControlType.Boolean,
        title: "Auto Orbit",
        defaultValue: true,
    },
    orbitSpeed: {
        type: ControlType.Number,
        title: "Orbit Speed",
        defaultValue: 0.35,
        min: 0,
        max: 2,
        step: 0.05,
        hidden: (props) => !props.autoOrbit,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 0.14,
        min: 0.02,
        max: 0.35,
        step: 0.01,
        hidden: (props) => !props.autoOrbit && !props.pointerTracking,
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        defaultValue: "span",
        options: ["h1", "h2", "h3", "p", "span"],
        optionTitles: ["H1", "H2", "H3", "P", "Span"],
    },
})
