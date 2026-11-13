import { useEffect, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CarbonScoreProps {
    showLabel: boolean
    label: string
    accent: string
    labelColor: string
    background: string
    valueColor: string
    ratingColor: string
    radius: string
    gap: number
    greenHosting: boolean
    showRating: boolean
    font: CSSProperties
    style?: CSSProperties
}

// Sustainable Web Design model v4, same constants as CO2.js by the Green Web Foundation
// (https://github.com/thegreenwebfoundation/co2.js, Apache-2.0).
// Global grid intensity data: Ember (https://ember-energy.org, CC BY-SA 4.0).
const KWH_PER_GB = {
    dataCentre: 0.055 + 0.012,
    network: 0.059 + 0.013,
    device: 0.08 + 0.081,
}
const DATA_CENTRE_OPERATIONAL = 0.055
const GRID_INTENSITY = 494 // gCO2e/kWh, global average
const RENEWABLE_INTENSITY = 50 // gCO2e/kWh
const RATINGS: [number, string][] = [
    [0.04, "A+"],
    [0.079, "A"],
    [0.145, "B"],
    [0.209, "C"],
    [0.278, "D"],
    [0.359, "E"],
]
const SETTLE_MS = 2000
const ROUTE_POLL_MS = 500
// Images, video and audio belong to the page that requested them
const MEDIA_TYPES = new Set(["img", "image", "video", "audio", "track"])
const MEDIA_URL = /\.(png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|mov|m4v|mp3|wav|ogg)(\?|#|$)/i
const SAMPLE_GRAMS = 0.07

function gramsPerView(bytes: number, green: boolean): number {
    const gb = bytes / 1e9
    const total =
        KWH_PER_GB.dataCentre + KWH_PER_GB.network + KWH_PER_GB.device
    if (!green) return gb * total * GRID_INTENSITY
    // Green hosting only lowers the data centre's operational energy
    const greenPart = DATA_CENTRE_OPERATIONAL * RENEWABLE_INTENSITY
    const greyPart = (total - DATA_CENTRE_OPERATIONAL) * GRID_INTENSITY
    return gb * (greenPart + greyPart)
}

function rating(grams: number): string {
    for (const [max, grade] of RATINGS) if (grams <= max) return grade
    return "F"
}

function formatGrams(grams: number): string {
    return grams < 0.01 ? grams.toFixed(3) : grams.toFixed(2)
}

// Size of an entry as on a first, uncached visit
function entrySize(entry: PerformanceResourceTiming): number {
    return Math.max(entry.transferSize || 0, entry.encodedBodySize || 0)
}

function isMedia(entry: PerformanceResourceTiming): boolean {
    return MEDIA_TYPES.has(entry.initiatorType) || MEDIA_URL.test(entry.name)
}

function pathOf(url: string): string {
    try {
        return new URL(url, window.location.href).pathname
    } catch {
        return ""
    }
}

interface Resource {
    size: number
    start: number
    media: boolean
}

// One route watcher shared by every instance on the page. Framer swaps pages
// without a reload, so the badge listens for page changes to measure again.
type RouteListener = () => void
const routeListeners = new Set<RouteListener>()
let lastPath = ""
let stopRouteWatch: (() => void) | null = null

function emitIfRouteChanged() {
    const next = window.location.pathname
    if (next === lastPath) return
    lastPath = next
    routeListeners.forEach((listener) => listener())
}

function watchRoute(listener: RouteListener): () => void {
    routeListeners.add(listener)
    if (!stopRouteWatch) {
        lastPath = window.location.pathname
        window.addEventListener("popstate", emitIfRouteChanged)
        const nav = (window as any).navigation
        if (nav && typeof nav.addEventListener === "function") {
            // Navigation API: fires on every history change, no polling
            nav.addEventListener("currententrychange", emitIfRouteChanged)
            stopRouteWatch = () => {
                nav.removeEventListener("currententrychange", emitIfRouteChanged)
                window.removeEventListener("popstate", emitIfRouteChanged)
            }
        } else {
            // Fallback: a single shared check, whatever the number of instances
            const id = window.setInterval(emitIfRouteChanged, ROUTE_POLL_MS)
            stopRouteWatch = () => {
                window.clearInterval(id)
                window.removeEventListener("popstate", emitIfRouteChanged)
            }
        }
    }
    return () => {
        routeListeners.delete(listener)
        if (routeListeners.size === 0 && stopRouteWatch) {
            stopRouteWatch()
            stopRouteWatch = null
        }
    }
}

/**
 * Carbon Score
 *
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 56
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function CarbonScore(props: CarbonScoreProps) {
    const {
        showLabel = true,
        label = "Carbon Score",
        accent = "#96EB54",
        labelColor = "#0E0E0E",
        background = "#FFFFFF",
        valueColor = "#0E0E0E",
        ratingColor = "#666666",
        gap = 4,
        radius = "8px",
        greenHosting = false,
        showRating = true,
        font,
    } = props

    const isStatic = useIsStaticRenderer()
    const [bytes, setBytes] = useState<number | null>(null)

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        if (typeof PerformanceObserver === "undefined") return

        // Largest size per URL, so repeated requests count once
        const resources = new Map<string, Resource>()
        const add = (entries: PerformanceEntryList) => {
            for (const e of entries as PerformanceResourceTiming[]) {
                const prev = resources.get(e.name)
                resources.set(e.name, {
                    size: Math.max(entrySize(e), prev?.size || 0),
                    start: Math.max(e.startTime, prev?.start || 0),
                    media: isMedia(e),
                })
            }
        }
        add(performance.getEntriesByType("navigation"))
        add(performance.getEntriesByType("resource"))

        const observer = new PerformanceObserver((list) => add(list.getEntries()))
        observer.observe({ type: "resource", buffered: true })

        // Site code (HTML, scripts, styles, fonts) is what any first visit
        // loads; media only counts when requested for the current page.
        const path = window.location.pathname
        const first = performance.getEntriesByType("navigation")[0]
        let pageStart =
            first && pathOf(first.name) !== path ? performance.now() - 1000 : 0

        let timer = 0
        const finish = () => {
            let total = 0
            resources.forEach((r) => {
                if (!r.media || r.start >= pageStart) total += r.size
            })
            startTransition(() => setBytes(total))
        }
        const onLoad = () => {
            timer = window.setTimeout(finish, SETTLE_MS)
        }
        if (document.readyState === "complete") onLoad()
        else window.addEventListener("load", onLoad, { once: true })

        const unwatch = watchRoute(() => {
            pageStart = performance.now() - ROUTE_POLL_MS
            window.clearTimeout(timer)
            startTransition(() => setBytes(null))
            timer = window.setTimeout(finish, SETTLE_MS)
        })

        return () => {
            observer.disconnect()
            window.clearTimeout(timer)
            unwatch()
            window.removeEventListener("load", onLoad)
        }
    }, [isStatic])

    const grams = isStatic
        ? SAMPLE_GRAMS
        : bytes !== null
          ? gramsPerView(bytes, greenHosting)
          : null

    const value =
        grams !== null ? `${formatGrams(grams)}g of CO₂/view` : "Measuring CO₂…"

    const cell: CSSProperties = {
        display: "flex",
        alignItems: "center",
        // Scales with the font size (6px 10px at 13px)
        padding: "0.46em 0.77em",
    }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap,
                minWidth: "max-content",
                ...font,
            }}
            // Announces the measurement and rating as they update
            role="status"
            aria-live="polite"
            aria-atomic="true"
        >
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "stretch",
                    borderRadius: radius,
                    border: `2px solid ${accent}`,
                    overflow: "hidden",
                    background,
                    whiteSpace: "nowrap",
                }}
            >
                <span style={{ ...cell, color: valueColor }}>{value}</span>
                {showLabel && (
                    <span
                        style={{
                            ...cell,
                            background: accent,
                            color: labelColor,
                            fontWeight: 700,
                        }}
                    >
                        {label}
                    </span>
                )}
            </div>
            {showRating && grams !== null && (
                <span style={{ color: ratingColor }}>
                    Carbon rating: {rating(Number(formatGrams(grams)))}
                </span>
            )}
        </div>
    )
}

CarbonScore.displayName = "Carbon Score"

addPropertyControls(CarbonScore, {
    greenHosting: {
        type: ControlType.Boolean,
        title: "Green Hosting",
        defaultValue: false,
        description: "On if your host runs on renewable energy.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
    },
    showLabel: {
        type: ControlType.Boolean,
        title: "Label",
        defaultValue: true,
    },
    label: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Carbon Score",
        hidden: (props) => !props.showLabel,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#0E0E0E",
        hidden: (props) => !props.showLabel,
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#96EB54",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    valueColor: {
        type: ControlType.Color,
        title: "Value Color",
        defaultValue: "#0E0E0E",
    },
    showRating: {
        type: ControlType.Boolean,
        title: "Rating",
        defaultValue: true,
    },
    ratingColor: {
        type: ControlType.Color,
        title: "Rating Color",
        defaultValue: "#666666",
        hidden: (props) => !props.showRating,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 4,
        min: 0,
        max: 40,
        unit: "px",
        hidden: (props) => !props.showRating,
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "8px",
    },
})
