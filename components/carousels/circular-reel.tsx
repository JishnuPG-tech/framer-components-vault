import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * CIRCULAR WIDGET SPINNER
 * Scroll (or drag) driven segmented circular ring.
 * Converted from a vanilla JS + GSAP prototype into a self-contained
 * Framer Code Component (no external dependencies).
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

interface WidgetItem {
    image?: { src: string }
    name: string
}

interface Props {
    widgets: WidgetItem[]
    accentColor: string
    backgroundColor: string
    idleRotationSpeed: number
    scrollSensitivity: number
    ringThickness: number
    fontSize: number
    grayscale: boolean
}

export default function CircularWidgetSpinner(props: Props) {
    const {
        widgets,
        accentColor,
        backgroundColor,
        idleRotationSpeed,
        scrollSensitivity,
        ringThickness,
        fontSize,
        grayscale,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const svgHostRef = useRef<SVGSVGElement | null>(null)
    const previewRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLDivElement>(null)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const [ready, setReady] = useState(false)

    // Mutable animation state kept out of React re-renders for performance
    const state = useRef({
        currentIndicatorRotation: 0,
        targetIndicatorRotation: 0,
        currentSpinnerRotation: 0,
        targetSpinnerRotation: 0,
        lastTime: performance.now(),
        lastSegmentIndex: -1,
        centerX: 0,
        centerY: 0,
        outerRadius: 0,
        innerRadius: 0,
        rafId: 0,
    })

    useEffect(() => {
        if (isStatic) return
        const container = containerRef.current
        if (!container || widgets.length === 0) return

        const svgNS = "http://www.w3.org/2000/svg"
        const createSVG = (
            type: string,
            attrs: Record<string, string | number> = {}
        ) => {
            const el = document.createElementNS(svgNS, type)
            Object.entries(attrs).forEach(([k, v]) =>
                el.setAttribute(k, String(v))
            )
            return el
        }

        let svg: SVGSVGElement | null = null
        let resizeObserver: ResizeObserver | null = null

        const buildSpinner = () => {
            if (svg) svg.remove()

            const width = container.clientWidth || 1
            const height = container.clientHeight || 1
            const s = state.current
            const viewportSize = Math.min(width, height)

            s.outerRadius = viewportSize * 0.48
            s.innerRadius = s.outerRadius * (1 - ringThickness / 100)
            s.centerX = width / 2
            s.centerY = height / 2

            svg = createSVG("svg", {
                width: "100%",
                height: "100%",
                viewBox: `0 0 ${width} ${height}`,
            }) as SVGSVGElement
            svg.style.position = "absolute"
            svg.style.top = "0"
            svg.style.left = "0"
            svg.style.display = "block"

            const defs = createSVG("defs")
            svg.appendChild(defs)

            const count = widgets.length
            const anglePerSegment = (2 * Math.PI) / count

            for (let i = 0; i < count; i++) {
                const startAngle = i * anglePerSegment - Math.PI / 2
                const endAngle = (i + 1) * anglePerSegment - Math.PI / 2
                const midAngle = (startAngle + endAngle) / 2

                const clipPath = createSVG("clipPath", { id: `clip-${i}` })
                const path = `M ${
                    s.centerX + s.outerRadius * Math.cos(startAngle)
                } ${
                    s.centerY + s.outerRadius * Math.sin(startAngle)
                } A ${s.outerRadius} ${s.outerRadius} 0 0 1 ${
                    s.centerX + s.outerRadius * Math.cos(endAngle)
                } ${s.centerY + s.outerRadius * Math.sin(endAngle)} L ${
                    s.centerX + s.innerRadius * Math.cos(endAngle)
                } ${
                    s.centerY + s.innerRadius * Math.sin(endAngle)
                } A ${s.innerRadius} ${s.innerRadius} 0 0 0 ${
                    s.centerX + s.innerRadius * Math.cos(startAngle)
                } ${s.centerY + s.innerRadius * Math.sin(startAngle)} Z`

                clipPath.appendChild(createSVG("path", { d: path }))
                defs.appendChild(clipPath)

                const g = createSVG("g", {
                    "clip-path": `url(#clip-${i})`,
                    "data-segment": i,
                })

                const segRadius = (s.innerRadius + s.outerRadius) / 2
                const segX = s.centerX + Math.cos(midAngle) * segRadius
                const segY = s.centerY + Math.sin(midAngle) * segRadius

                const arcLength = s.outerRadius * anglePerSegment
                const imgWidth = arcLength * 1.3
                const imgHeight = (s.outerRadius - s.innerRadius) * 1.3
                const rotationDeg = (midAngle * 180) / Math.PI + 90

                const src = widgets[i]?.image?.src
                if (src) {
                    const image = createSVG("image", {
                        href: src,
                        width: imgWidth,
                        height: imgHeight,
                        x: segX - imgWidth / 2,
                        y: segY - imgHeight / 2,
                        preserveAspectRatio: "xMidYMid slice",
                        transform: `rotate(${rotationDeg} ${segX} ${segY})`,
                    })
                    g.appendChild(image)
                } else {
                    const rect = createSVG("rect", {
                        x: segX - imgWidth / 2,
                        y: segY - imgHeight / 2,
                        width: imgWidth,
                        height: imgHeight,
                        fill: "#333",
                        transform: `rotate(${rotationDeg} ${segX} ${segY})`,
                    })
                    g.appendChild(rect)
                }

                svg.appendChild(g)
            }

            const indicatorLine = createSVG("line", {
                id: "widget-indicator",
                x1: s.centerX,
                y1: s.centerY - s.innerRadius * 0.85,
                x2: s.centerX,
                y2: s.centerY - s.outerRadius * 1.08,
                stroke: accentColor,
                "stroke-width": 3,
                "stroke-linecap": "round",
            })
            svg.appendChild(indicatorLine)

            container.appendChild(svg)
            svgHostRef.current = svg
        }

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t

        const updateContent = () => {
            const s = state.current
            const anglePerSegmentDeg = 360 / widgets.length
            const relativeRotation =
                (((s.currentIndicatorRotation - s.currentSpinnerRotation) %
                    360) +
                    360) %
                360
            const segmentIndex =
                Math.floor(relativeRotation / anglePerSegmentDeg) %
                widgets.length

            if (segmentIndex !== s.lastSegmentIndex) {
                s.lastSegmentIndex = segmentIndex
                const widget = widgets[segmentIndex]

                if (titleRef.current) {
                    titleRef.current.textContent = widget.name
                }

                const previewContainer = previewRef.current
                if (previewContainer && widget.image?.src) {
                    const img = document.createElement("img")
                    img.src = widget.image.src
                    img.alt = widget.name
                    img.style.position = "absolute"
                    img.style.top = "0"
                    img.style.left = "0"
                    img.style.width = "100%"
                    img.style.height = "100%"
                    img.style.objectFit = "cover"
                    img.style.opacity = "0"
                    img.style.filter = grayscale ? "saturate(0)" : "none"
                    img.style.transition = "opacity 0.4s ease"
                    previewContainer.appendChild(img)
                    requestAnimationFrame(() => {
                        img.style.opacity = "1"
                    })

                    const allImages = previewContainer.querySelectorAll("img")
                    if (allImages.length > 3) {
                        for (let i = 0; i < allImages.length - 3; i++) {
                            previewContainer.removeChild(allImages[i])
                        }
                    }
                }
            }
        }

        const animate = () => {
            const s = state.current
            const currentTime = performance.now()
            let deltaTime = (currentTime - s.lastTime) / 1000
            s.lastTime = currentTime
            deltaTime = Math.min(deltaTime, 0.1)

            if (!isCanvas) {
                s.targetIndicatorRotation += idleRotationSpeed * deltaTime
                s.targetSpinnerRotation -= idleRotationSpeed * 0.25 * deltaTime
            }

            s.currentIndicatorRotation = lerp(
                s.currentIndicatorRotation,
                s.targetIndicatorRotation,
                0.1
            )
            s.currentSpinnerRotation = lerp(
                s.currentSpinnerRotation,
                s.targetSpinnerRotation,
                0.1
            )

            const indicatorEl =
                svgHostRef.current?.querySelector("#widget-indicator")
            if (indicatorEl) {
                indicatorEl.setAttribute(
                    "transform",
                    `rotate(${s.currentIndicatorRotation % 360} ${s.centerX} ${s.centerY})`
                )
            }

            svgHostRef.current
                ?.querySelectorAll("[data-segment]")
                .forEach((seg) => {
                    seg.setAttribute(
                        "transform",
                        `rotate(${s.currentSpinnerRotation % 360} ${s.centerX} ${s.centerY})`
                    )
                })

            updateContent()
            if (!isCanvas) {
                s.rafId = requestAnimationFrame(animate)
            }
        }

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            const delta = e.deltaY * scrollSensitivity
            state.current.targetIndicatorRotation += delta
            state.current.targetSpinnerRotation -= delta
        }

        buildSpinner()
        setReady(true)

        let isRunning = false

        const startLoop = () => {
            if (isRunning) return
            isRunning = true
            state.current.lastTime = performance.now()
            state.current.rafId = requestAnimationFrame(animate)
        }

        const stopLoop = () => {
            if (!isRunning) return
            isRunning = false
            cancelAnimationFrame(state.current.rafId)
        }

        if (!isCanvas) {
            container.addEventListener("wheel", handleWheel, {
                passive: false,
            })
        }

        resizeObserver = new ResizeObserver(() => buildSpinner())
        resizeObserver.observe(container)

        // Only animate while the component is actually visible in the
        // viewport. This avoids burning CPU/GPU on a scrolled-away instance.
        let intersectionObserver: IntersectionObserver | null = null
        if (isCanvas) {
            // In the Framer canvas idle rotation is disabled, so a single
            // frame is enough to lay everything out — no continuous loop.
            animate()
        } else if (typeof IntersectionObserver !== "undefined") {
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            startLoop()
                        } else {
                            stopLoop()
                        }
                    })
                },
                { threshold: 0 }
            )
            intersectionObserver.observe(container)
        } else {
            // Fallback for environments without IntersectionObserver support
            startLoop()
        }

        return () => {
            stopLoop()
            container.removeEventListener("wheel", handleWheel)
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            svg?.remove()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        widgets,
        accentColor,
        idleRotationSpeed,
        scrollSensitivity,
        ringThickness,
        grayscale,
        isCanvas,
        isStatic,
    ])

    if (isStatic) {
        const firstWidget = widgets[0]
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {firstWidget?.image?.src && (
                    <img
                        src={firstWidget.image.src}
                        alt={firstWidget.name}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: grayscale ? "saturate(0)" : "none",
                        }}
                    />
                )}
                <div
                    style={{
                        position: "relative",
                        textTransform: "uppercase",
                        fontSize,
                        fontWeight: 500,
                        padding: "6px 10px",
                        backgroundColor: accentColor,
                        color: "#000",
                        borderRadius: 2,
                        zIndex: 2,
                        fontFamily:
                            "'Geist Mono', ui-monospace, SFMono-Regular, monospace",
                        whiteSpace: "nowrap",
                    }}
                >
                    {firstWidget?.name || "Widget"}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
            }}
        >
            <div
                ref={previewRef}
                style={{
                    position: "absolute",
                    inset: 0,
                }}
            />
            <div
                ref={titleRef}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textTransform: "uppercase",
                    fontSize,
                    fontWeight: 500,
                    padding: "6px 10px",
                    backgroundColor: accentColor,
                    color: "#000",
                    borderRadius: 2,
                    zIndex: 2,
                    fontFamily:
                        "'Geist Mono', ui-monospace, SFMono-Regular, monospace",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                }}
            >
                {widgets[0]?.name || ""}
            </div>
            {!ready && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                        fontSize: 12,
                    }}
                >
                    {widgets.length === 0
                        ? "Add widgets in the properties panel"
                        : ""}
                </div>
            )}
        </div>
    )
}

CircularWidgetSpinner.displayName = "Circular Widget Spinner"

addPropertyControls(CircularWidgetSpinner, {
    widgets: {
        type: ControlType.Array,
        title: "Widgets",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage },
                name: {
                    type: ControlType.String,
                    defaultValue: "Item",
                    placeholder: "Name",
                },
            },
        },
        defaultValue: [
            { name: "Velvet" },
            { name: "Glass Relay" },
            { name: "Noir-17" },
            { name: "Driftline" },
            { name: "Pulse 9" },
            { name: "Cold Meridian" },
            { name: "Astra" },
            { name: "Mono Circuit" },
            { name: "Lumen-04" },
            { name: "Shadow Bloom" },
        ],
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#ffff2b",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    ringThickness: {
        type: ControlType.Number,
        title: "Ring Thickness",
        defaultValue: 37,
        min: 10,
        max: 60,
        step: 1,
        unit: "%",
    },
    idleRotationSpeed: {
        type: ControlType.Number,
        title: "Idle Speed",
        defaultValue: 18,
        min: 0,
        max: 90,
        step: 1,
        description: "Degrees per second of passive rotation",
    },
    scrollSensitivity: {
        type: ControlType.Number,
        title: "Scroll Sensitivity",
        defaultValue: 0.05,
        min: 0.01,
        max: 0.3,
        step: 0.01,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 12,
        min: 8,
        max: 24,
        step: 1,
    },
    grayscale: {
        type: ControlType.Boolean,
        title: "Grayscale Preview",
        defaultValue: true,
    },
})
