import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

/**
Instructions:
Create a Framer component that follows the Framer component rules and achieves the user's goal.
If the user is asking a question, answer it without creating a component.

---USER START (Latest message)---
A map showing the journey of a product from raw material sources in Brazil and Africa to the factory in China and distribution in the USA.
---USER END (Latest message)---
*/

type Location = {
    name: string
    lat: number
    lon: number
}

type Props = {
    title: string
    showTitle: boolean

    // UI only: used to simplify the property panel (does not affect rendering)
    showAdvancedControls: boolean

    titleFont: any
    titleColor: string
    titleBackground: string
    titleBackgroundOpacity: number
    titlePadding: number
    titleRadius: number
    titleAlign: "left" | "center" | "right"

    // Journey timing
    journeyDuration: number
    loopJourney: boolean
    loopDelay: number

    // Landed marker arrow
    showLandedArrow: boolean
    landedArrowColor: string
    landedArrowSize: number

    // Locations
    useCustomLocations: boolean
    locations: Location[]

    // Legacy locations (when custom is off)
    brazil: Location
    africa: Location
    china: Location
    usa: Location

    // Map image
    mapImage: { src: string; srcSet?: string; alt?: string }
    mapOpacity: number

    // Visuals
    oceanColor: string
    borderColor: string
    borderWidth: number

    showGrid: boolean
    gridColor: string
    gridOpacity: number

    routeColor: string
    routeWidth: number
    routeGlow: boolean

    markerColor: string
    markerRingColor: string
    markerSize: number
    showPulses: boolean

    showLabels: boolean
    labelColor: string
    labelFont: any

    // Layout
    padding: number
    cornerRadius: number
    style?: React.CSSProperties
}

/**
 * Journey Map
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 630
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function JourneyMap(props: Props) {
    const {
        title,
        showTitle,

        titleFont,
        titleColor,
        titleBackground,
        titleBackgroundOpacity,
        titlePadding,
        titleRadius,
        titleAlign,

        journeyDuration,
        loopJourney,
        loopDelay,

        showLandedArrow,
        landedArrowColor,
        landedArrowSize,

        // Locations
        useCustomLocations,
        locations = [],

        brazil = { name: "Brazil (Raw materials)", lat: -15.8, lon: -47.9 },
        africa = { name: "West Africa (Raw materials)", lat: 6.5, lon: 3.4 },
        china = { name: "China (Factory)", lat: 31.2, lon: 121.5 },
        usa = { name: "USA (Distribution)", lat: 39.8, lon: -98.6 },

        mapImage = {
            src: "https://framerusercontent.com/images/fkfkmsqUH2vOuCZP9Exl2qdgc.jpg",
            alt: "World map",
        },
        mapOpacity,

        oceanColor,
        borderColor,
        borderWidth,

        showGrid,
        gridColor,
        gridOpacity,

        routeColor,
        routeWidth,
        routeGlow,

        markerColor,
        markerRingColor,
        markerSize,
        showPulses,

        showLabels,
        labelColor,
        labelFont,

        padding,
        cornerRadius,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const ref = React.useRef<HTMLDivElement>(null)
    const shouldAnimate = !isStatic

    const [cycle, setCycle] = React.useState(0)
    const [elapsedSec, setElapsedSec] = React.useState(0)

    React.useEffect(() => {
        if (!shouldAnimate || !loopJourney) return
        if (typeof window === "undefined") return

        const durationMs = Math.max(0, (journeyDuration + loopDelay) * 1000)
        if (durationMs <= 0) return

        const id = window.setInterval(() => {
            React.startTransition(() => setCycle((c) => c + 1))
        }, durationMs)

        return () => window.clearInterval(id)
    }, [shouldAnimate, loopJourney, journeyDuration, loopDelay])

    React.useEffect(() => {
        if (!shouldAnimate) return
        if (typeof window === "undefined") return

        let raf = 0
        let last = 0
        const start = performance.now()

        const tick = (now: number) => {
            raf = window.requestAnimationFrame(tick)
            if (now - last < 50) return
            last = now

            const total = Math.max(0.001, journeyDuration + (loopJourney ? loopDelay : 0))
            const raw = (now - start) / 1000
            const t = loopJourney ? raw % total : Math.min(raw, journeyDuration)
            const clamped = Math.min(t, journeyDuration)
            React.startTransition(() => setElapsedSec(clamped))
        }

        raf = window.requestAnimationFrame(tick)
        return () => window.cancelAnimationFrame(raf)
    }, [shouldAnimate, journeyDuration, loopJourney, loopDelay])

    const effectiveLocations = React.useMemo(() => {
        const legacy = [brazil, africa, china, usa]
        if (!useCustomLocations) return legacy
        const clean = (locations || []).filter(
            (l) => typeof l?.lat === "number" && typeof l?.lon === "number" && String(l?.name || "").length > 0
        )
        return clean.length >= 2 ? clean : legacy
    }, [useCustomLocations, locations, brazil, africa, china, usa])

    const vbW = 1000
    const vbH = 560

    const project = React.useCallback(
        (lat: number, lon: number) => {
            const x = ((lon + 180) / 360) * vbW
            const y = ((90 - lat) / 180) * vbH
            return { x, y }
        },
        [vbW, vbH]
    )

    const routePath = React.useCallback(
        (a: Location, b: Location) => {
            const p1 = project(a.lat, a.lon)
            const p2 = project(b.lat, b.lon)

            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            const mx = (p1.x + p2.x) / 2
            const my = (p1.y + p2.y) / 2

            // Arc up away from equator-ish for a "flight path" feel
            const lift = Math.min(180, Math.max(60, dist * 0.22))
            const nx = -dy / (dist || 1)
            const ny = dx / (dist || 1)

            const cx = mx + nx * lift
            const cy = my + ny * lift

            return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
        },
        [project]
    )

    const points = React.useMemo(() => {
        return effectiveLocations.map((l) => ({ p: project(l.lat, l.lon), l }))
    }, [effectiveLocations, project])

    const segments = React.useMemo(() => {
        const segs: Array<{ from: Location; to: Location; d: string; i: number }> = []
        for (let i = 0; i < effectiveLocations.length - 1; i++) {
            const from = effectiveLocations[i]
            const to = effectiveLocations[i + 1]
            segs.push({ from, to, d: routePath(from, to), i })
        }
        return segs
    }, [effectiveLocations, routePath])

    const gridLines = React.useMemo(() => {
        if (!showGrid) return null

        const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []

        // Longitudes every 30°
        for (let lon = -150; lon <= 150; lon += 30) {
            const x = ((lon + 180) / 360) * vbW
            lines.push({ x1: x, y1: 0, x2: x, y2: vbH })
        }

        // Latitudes every 30°
        for (let lat = -60; lat <= 60; lat += 30) {
            const y = ((90 - lat) / 180) * vbH
            lines.push({ x1: 0, y1: y, x2: vbW, y2: y })
        }

        return lines
    }, [showGrid, vbW, vbH])

    const label = React.useCallback(
        (p: { x: number; y: number }, text: string, dx: number, dy: number, anchor: "start" | "middle" | "end") => {
            if (!showLabels) return null
            return (
                <text
                    x={p.x + dx}
                    y={p.y + dy}
                    fill={labelColor}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    style={{
                        ...labelFont,
                        pointerEvents: "none",
                    }}
                >
                    {text}
                </text>
            )
        },
        [showLabels, labelColor, labelFont]
    )

    const marker = React.useCallback(
        (p: { x: number; y: number }, aria: string, pulseDelay: number) => {
            const r = Math.max(3, markerSize)
            const ring = Math.max(6, markerSize * 2.2)
            const pulseR = Math.max(10, markerSize * 4.0)

            return (
                <g role="group" aria-label={aria}>
                    <circle cx={p.x} cy={p.y} r={ring} fill="transparent" stroke={markerRingColor} strokeWidth={1.5} opacity={0.9} />
                    <circle cx={p.x} cy={p.y} r={r} fill={markerColor} />
                    {showPulses && (
                        <motion.circle
                            cx={p.x}
                            cy={p.y}
                            r={pulseR}
                            fill="transparent"
                            stroke={markerColor}
                            strokeWidth={1.25}
                            initial={{ opacity: 0, scale: 0.35 }}
                            animate={
                                shouldAnimate
                                    ? {
                                          opacity: [0, 0.45, 0],
                                          scale: [0.35, 1.0, 1.15],
                                      }
                                    : { opacity: 0 }
                            }
                            transition={
                                shouldAnimate
                                    ? {
                                          duration: 2.2,
                                          repeat: Infinity,
                                          ease: "easeOut",
                                          delay: pulseDelay,
                                      }
                                    : undefined
                            }
                        />
                    )}
                </g>
            )
        },
        [markerColor, markerRingColor, markerSize, showPulses, shouldAnimate]
    )

    const segmentDuration = React.useMemo(() => {
        const count = Math.max(1, segments.length)
        return Math.max(0.15, journeyDuration / count)
    }, [journeyDuration, segments.length])

    const landedIndex = React.useMemo(() => {
        const maxI = Math.max(0, points.length - 1)
        if (!shouldAnimate) return maxI
        if (points.length <= 1) return 0
        const segD = Math.max(0.001, segmentDuration)
        const idx = Math.floor((elapsedSec + 1e-6) / segD)
        return Math.max(0, Math.min(maxI, idx))
    }, [elapsedSec, segmentDuration, points.length, shouldAnimate])

    const routeCommon = React.useMemo(
        () => ({
            fill: "none",
            stroke: routeColor,
            strokeWidth: routeWidth,
            strokeLinecap: "round" as const,
            strokeLinejoin: "round" as const,
        }),
        [routeColor, routeWidth]
    )

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                padding,
                boxSizing: "border-box",
                borderRadius: cornerRadius,
                background: oceanColor,
                overflow: "hidden",
                ...style,
            }}
            aria-label="Supply chain journey map"
            role="img"
        >
            {showTitle && String(title || "").length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: padding,
                        right: padding,
                        top: padding,
                        zIndex: 2,
                        display: "flex",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "100%",
                            color: titleColor,
                            background: titleBackground,
                            opacity: titleBackgroundOpacity,
                            padding: titlePadding,
                            borderRadius: titleRadius,
                            boxSizing: "border-box",
                            textAlign: titleAlign,
                            ...titleFont,
                        }}
                    >
                        <span style={{ display: "block", width: "100%" }}>{title}</span>
                    </div>
                </div>
            )}
            <svg
                viewBox={`0 0 ${vbW} ${vbH}`}
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                style={{ display: "block" }}
            >
                <defs>
                    <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <linearGradient id="titleFade" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(0,0,0,0.10)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                    </linearGradient>
                </defs>

                {/* Real map image background */}
                {mapImage?.src && (
                    <image
                        href={mapImage.src}
                        x={0}
                        y={0}
                        width={vbW}
                        height={vbH}
                        preserveAspectRatio="none"
                        opacity={mapOpacity}
                    />
                )}

                {showGrid && gridLines && (
                    <g opacity={gridOpacity}>
                        {gridLines.map((l, i) => (
                            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={gridColor} strokeWidth={1} />
                        ))}
                    </g>
                )}

                <rect x={0.5} y={0.5} width={vbW - 1} height={vbH - 1} rx={Math.max(0, cornerRadius * 1.3)} ry={Math.max(0, cornerRadius * 1.3)} fill="transparent" stroke={borderColor} strokeWidth={borderWidth} />

                <g key={`routes-${cycle}`} filter={routeGlow ? "url(#routeGlow)" : undefined}>
                    {segments.map((s) => (
                        <motion.path
                            key={s.i}
                            d={s.d}
                            {...routeCommon}
                            initial={{ pathLength: 0, opacity: 0.25 }}
                            animate={shouldAnimate ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
                            transition={
                                shouldAnimate
                                    ? {
                                          duration: segmentDuration,
                                          delay: s.i * segmentDuration,
                                          ease: "easeInOut",
                                      }
                                    : undefined
                            }
                        />
                    ))}
                </g>

                {points.map(({ p, l }, i) => (
                    <React.Fragment key={i}>
                        {showLandedArrow && i === landedIndex && (
                            <path
                                d={(() => {
                                    const s = Math.max(6, landedArrowSize)
                                    const h = s * 0.9
                                    const x = p.x
                                    const y = p.y - (Math.max(10, markerSize * 4.2) + h)
                                    const w = s * 0.9
                                    return `M ${(x - w).toFixed(2)} ${(y).toFixed(2)} L ${(x + w).toFixed(2)} ${(y).toFixed(2)} L ${x.toFixed(2)} ${(y + h).toFixed(2)} Z`
                                })()}
                                fill={landedArrowColor}
                                opacity={0.95}
                            />
                        )}
                        {marker(p, l.name, i * 0.15)}
                        {label(p, l.name, i === points.length - 1 ? -10 : 10, -14, i === points.length - 1 ? "end" : "start")}
                    </React.Fragment>
                ))}
            </svg>
        </div>
    )
}

addPropertyControls(JourneyMap, {
    showAdvancedControls: {
        type: ControlType.Boolean,
        title: "Advanced",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Product journey: Brazil & Africa → China → USA",
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "Show Title",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    titleAlign: {
        type: ControlType.Enum,
        title: "Title Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
        hidden: (p) => !p.showTitle || !p.showAdvancedControls,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
        hidden: (p) => !p.showTitle || !p.showAdvancedControls,
    },
    titleBackground: {
        type: ControlType.Color,
        title: "Title Bg",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.showTitle || !p.showAdvancedControls,
    },
    titleBackgroundOpacity: {
        type: ControlType.Number,
        title: "Title Bg Opacity",
        defaultValue: 0.75,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !p.showTitle || !p.showAdvancedControls,
    },
    titlePadding: {
        type: ControlType.Number,
        title: "Title Padding",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        hidden: (p) => !p.showTitle || !p.showAdvancedControls,
    },
    titleRadius: {
        type: ControlType.Number,
        title: "Title Radius",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        hidden: (p) => !p.showTitle || !p.showAdvancedControls,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: (p) => !p.showTitle,
    },

    journeyDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 8,
        min: 1,
        max: 60,
        step: 0.5,
        unit: "s",
    },
    loopJourney: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loopDelay: {
        type: ControlType.Number,
        title: "Loop Delay",
        defaultValue: 1,
        min: 0,
        max: 20,
        step: 0.5,
        unit: "s",
        hidden: (p) => !p.loopJourney,
    },

    showLandedArrow: {
        type: ControlType.Boolean,
        title: "Landed Arrow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p) => !p.showAdvancedControls,
    },
    landedArrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.showAdvancedControls || !p.showLandedArrow,
    },
    landedArrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 10,
        min: 6,
        max: 30,
        step: 1,
        hidden: (p) => !p.showAdvancedControls || !p.showLandedArrow,
    },

    useCustomLocations: {
        type: ControlType.Boolean,
        title: "Custom Countries",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    locations: {
        type: ControlType.Array,
        title: "Countries",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            icon: "object",
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "New location" },
                lat: { type: ControlType.Number, title: "Lat", defaultValue: 0, min: -90, max: 90, step: 0.1 },
                lon: { type: ControlType.Number, title: "Lon", defaultValue: 0, min: -180, max: 180, step: 0.1 },
            },
        },
        defaultValue: [
            { name: "Brazil (Raw materials)", lat: -15.8, lon: -47.9 },
            { name: "West Africa (Raw materials)", lat: 6.5, lon: 3.4 },
            { name: "China (Factory)", lat: 31.2, lon: 121.5 },
            { name: "USA (Distribution)", lat: 39.8, lon: -98.6 },
        ],
        hidden: (p) => !p.useCustomLocations,
    },

    brazil: {
        type: ControlType.Object,
        title: "Brazil",
        icon: "object",
        hidden: (p) => p.useCustomLocations || !p.showAdvancedControls,
        controls: {
            name: { type: ControlType.String, title: "Name", defaultValue: "Brazil (Raw materials)" },
            lat: { type: ControlType.Number, title: "Lat", defaultValue: -15.8, min: -90, max: 90, step: 0.1 },
            lon: { type: ControlType.Number, title: "Lon", defaultValue: -47.9, min: -180, max: 180, step: 0.1 },
        },
        defaultValue: { name: "Brazil (Raw materials)", lat: -15.8, lon: -47.9 },
    },
    africa: {
        type: ControlType.Object,
        title: "Africa",
        icon: "object",
        hidden: (p) => p.useCustomLocations || !p.showAdvancedControls,
        controls: {
            name: { type: ControlType.String, title: "Name", defaultValue: "West Africa (Raw materials)" },
            lat: { type: ControlType.Number, title: "Lat", defaultValue: 6.5, min: -90, max: 90, step: 0.1 },
            lon: { type: ControlType.Number, title: "Lon", defaultValue: 3.4, min: -180, max: 180, step: 0.1 },
        },
        defaultValue: { name: "West Africa (Raw materials)", lat: 6.5, lon: 3.4 },
    },
    china: {
        type: ControlType.Object,
        title: "China",
        icon: "object",
        hidden: (p) => p.useCustomLocations || !p.showAdvancedControls,
        controls: {
            name: { type: ControlType.String, title: "Name", defaultValue: "China (Factory)" },
            lat: { type: ControlType.Number, title: "Lat", defaultValue: 31.2, min: -90, max: 90, step: 0.1 },
            lon: { type: ControlType.Number, title: "Lon", defaultValue: 121.5, min: -180, max: 180, step: 0.1 },
        },
        defaultValue: { name: "China (Factory)", lat: 31.2, lon: 121.5 },
    },
    usa: {
        type: ControlType.Object,
        title: "USA",
        icon: "object",
        hidden: (p) => p.useCustomLocations || !p.showAdvancedControls,
        controls: {
            name: { type: ControlType.String, title: "Name", defaultValue: "USA (Distribution)" },
            lat: { type: ControlType.Number, title: "Lat", defaultValue: 39.8, min: -90, max: 90, step: 0.1 },
            lon: { type: ControlType.Number, title: "Lon", defaultValue: -98.6, min: -180, max: 180, step: 0.1 },
        },
        defaultValue: { name: "USA (Distribution)", lat: 39.8, lon: -98.6 },
    },

    mapImage: {
        type: ControlType.ResponsiveImage,
        title: "Map Image",
    },
    mapOpacity: {
        type: ControlType.Number,
        title: "Map Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },

    oceanColor: {
        type: ControlType.Color,
        title: "Ocean",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.showAdvancedControls,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
        hidden: (p) => !p.showAdvancedControls,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 8,
        step: 0.5,
        hidden: (p) => !p.showAdvancedControls,
    },

    showGrid: {
        type: ControlType.Boolean,
        title: "Grid",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p) => !p.showAdvancedControls,
    },
    gridColor: {
        type: ControlType.Color,
        title: "Grid Color",
        defaultValue: "#CCCCCC",
        hidden: (p) => !p.showAdvancedControls || !p.showGrid,
    },
    gridOpacity: {
        type: ControlType.Number,
        title: "Grid Opacity",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !p.showAdvancedControls || !p.showGrid,
    },

    routeColor: {
        type: ControlType.Color,
        title: "Route",
        defaultValue: "#13D433",
    },
    routeWidth: {
        type: ControlType.Number,
        title: "Route Width",
        defaultValue: 2.5,
        min: 1,
        max: 12,
        step: 0.5,
        hidden: (p) => !p.showAdvancedControls,
    },
    routeGlow: {
        type: ControlType.Boolean,
        title: "Route Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.showAdvancedControls,
    },

    markerColor: {
        type: ControlType.Color,
        title: "Marker",
        defaultValue: "#000000",
    },
    markerRingColor: {
        type: ControlType.Color,
        title: "Marker Ring",
        defaultValue: "#CCCCCC",
        hidden: (p) => !p.showAdvancedControls,
    },
    markerSize: {
        type: ControlType.Number,
        title: "Marker Size",
        defaultValue: 4,
        min: 2,
        max: 16,
        step: 1,
        hidden: (p) => !p.showAdvancedControls,
    },
    showPulses: {
        type: ControlType.Boolean,
        title: "Pulses",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.showAdvancedControls,
    },

    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#FFBB00",
        hidden: (p) => !p.showAdvancedControls || !p.showLabels,
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: (p) => !p.showLabels,
    },

    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        hidden: (p) => !p.showAdvancedControls,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 48,
        step: 1,
        hidden: (p) => !p.showAdvancedControls,
    },
})