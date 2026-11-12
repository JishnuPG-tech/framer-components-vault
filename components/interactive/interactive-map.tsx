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


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

const W = 800
const H = 850

const SOURCES = {
    regions: "regions-version-simplifiee.geojson",
    departements: "departements-version-simplifiee.geojson",
}

const BASE = "https://cdn.jsdelivr.net/gh/gregoiredavid/france-geojson@master/"

type Point = [number, number]

type Location = {
    name: string
    company: string
    department: string
    activity: string
    latitude: number
    longitude: number
    website: string
}

const DEMO_LOCATIONS: Location[] = [
    {
        name: "Agence Paris",
        company: "Express Logistique",
        department: "Paris (75)",
        activity: "Transport et logistique",
        latitude: 48.8566,
        longitude: 2.3522,
        website: "https://example.com",
    },
    {
        name: "Agence Lille",
        company: "Express Logistique",
        department: "Nord (59)",
        activity: "Transport et logistique",
        latitude: 50.6292,
        longitude: 3.0573,
        website: "https://example.com",
    },
    {
        name: "Agence Lyon",
        company: "Express Logistique",
        department: "Rhône (69)",
        activity: "Transport et logistique",
        latitude: 45.764,
        longitude: 4.8357,
        website: "https://example.com",
    },
    {
        name: "Agence Bordeaux",
        company: "Express Logistique",
        department: "Gironde (33)",
        activity: "Transport et logistique",
        latitude: 44.8378,
        longitude: -0.5792,
        website: "https://example.com",
    },
    {
        name: "Agence Marseille",
        company: "Express Logistique",
        department: "Bouches-du-Rhône (13)",
        activity: "Transport et logistique",
        latitude: 43.2965,
        longitude: 5.3698,
        website: "https://example.com",
    },
]

function collectPoints(coords: any, output: Point[]) {
    if (
        Array.isArray(coords) &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
    ) {
        output.push(coords as Point)
    } else if (Array.isArray(coords)) {
        coords.forEach((c) => collectPoints(c, output))
    }
}

function makePath(geometry: any, project: (point: Point) => Point) {
    if (!geometry) return ""

    const polygons =
        geometry.type === "Polygon"
            ? [geometry.coordinates]
            : geometry.type === "MultiPolygon"
              ? geometry.coordinates
              : []

    return polygons
        .map((polygon: Point[][]) =>
            polygon
                .map((ring: Point[]) => {
                    if (!ring.length) return ""

                    return (
                        ring
                            .map((point, i) => {
                                const [x, y] = project(point)

                                return `${
                                    i === 0 ? "M" : "L"
                                }${x.toFixed(2)},${y.toFixed(2)}`
                            })
                            .join(" ") + " Z"
                    )
                })
                .join(" ")
        )
        .join(" ")
}

export default function FranceServiceMap(props: any) {
    const {
        mode,
        territoryColor,
        borderColor,
        hoverColor,
        borderWidth,
        hoverSpeed,
        locations,
        showMarkers,
        markerColor,
        markerSize,
        markerBorder,
        markerPulse,
        cardBackground,
        cardText,
        showTooltip,
        enableZoom,
        showControls,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const [features, setFeatures] = React.useState<any[]>([])
    const [status, setStatus] = React.useState("loading")

    const [activeTerritory, setActiveTerritory] = React.useState<string | null>(
        null
    )

    const [activeMarker, setActiveMarker] = React.useState<number | null>(null)

    const [lockedMarker, setLockedMarker] = React.useState<number | null>(null)

    const [pointer, setPointer] = React.useState({
        x: 0,
        y: 0,
    })

    const [zoom, setZoom] = React.useState(1)

    const [offset, setOffset] = React.useState({
        x: 0,
        y: 0,
    })

    const [containerSize, setContainerSize] = React.useState({
        width: 800,
        height: 850,
    })

    const containerRef = React.useRef<HTMLDivElement>(null)
    const dragRef = React.useRef<any>(null)
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const instanceId = React.useId().replace(/:/g, "")
    const pulseName = `marker-pulse-${instanceId}`

    React.useEffect(() => {
        if (!containerRef.current) return

        const observer = new ResizeObserver((entries) => {
            const rect = entries[0].contentRect

            setContainerSize({
                width: rect.width,
                height: rect.height,
            })
        })

        observer.observe(containerRef.current)

        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        let cancelled = false

        setStatus("loading")
        setActiveTerritory(null)
        setActiveMarker(null)
        setLockedMarker(null)

        async function loadMap() {
            const file = SOURCES[mode] || SOURCES.departements

            const urls = [
                BASE + file,
                "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/" +
                    file,
            ]

            for (const url of urls) {
                try {
                    const response = await fetch(url)

                    if (!response.ok) continue

                    const json = await response.json()

                    if (
                        json.type !== "FeatureCollection" ||
                        !Array.isArray(json.features)
                    ) {
                        continue
                    }

                    if (!cancelled) {
                        setFeatures(json.features)
                        setStatus("ready")
                    }

                    return
                } catch (error) {
                    console.warn("Map loading error:", error)
                }
            }

            if (!cancelled) setStatus("error")
        }

        loadMap()

        return () => {
            cancelled = true
        }
    }, [mode])

    const geometry = React.useMemo(() => {
        if (!features.length) return null

        const points: Point[] = []

        features.forEach((feature) =>
            collectPoints(feature.geometry?.coordinates, points)
        )

        if (!points.length) return null

        const minLon = Math.min(...points.map((p) => p[0]))
        const maxLon = Math.max(...points.map((p) => p[0]))
        const minLat = Math.min(...points.map((p) => p[1]))
        const maxLat = Math.max(...points.map((p) => p[1]))

        const cosLat = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)

        const geoWidth = (maxLon - minLon) * cosLat
        const geoHeight = maxLat - minLat

        const padding = 35

        const scale = Math.min(
            (W - padding * 2) / geoWidth,
            (H - padding * 2) / geoHeight
        )

        const originX = (W - geoWidth * scale) / 2
        const originY = (H - geoHeight * scale) / 2

        const project = ([lon, lat]: Point): Point => [
            originX + (lon - minLon) * cosLat * scale,
            originY + (maxLat - lat) * scale,
        ]

        const territories = features.map((feature, index) => ({
            id: String(feature.properties?.code ?? index),
            name: String(feature.properties?.nom ?? "Territoire"),
            code: String(feature.properties?.code ?? ""),
            d: makePath(feature.geometry, project),
        }))

        return { territories, project }
    }, [features])

    const activeArea = geometry?.territories.find(
        (area) => area.id === activeTerritory
    )

    const visibleLocations = React.useMemo(() => {
        if (!showMarkers || !geometry) return []

        return (locations || [])
            .filter(
                (location: Location) =>
                    Number.isFinite(Number(location.latitude)) &&
                    Number.isFinite(Number(location.longitude))
            )
            .map((location: Location) => ({
                ...location,
                coordinates: geometry.project([
                    Number(location.longitude),
                    Number(location.latitude),
                ]),
            }))
    }, [locations, geometry, showMarkers])

    const selectedLocation =
        activeMarker !== null ? visibleLocations[activeMarker] : null

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
    }

    const scheduleClose = () => {
        cancelClose()

        if (lockedMarker !== null) return

        closeTimer.current = setTimeout(() => {
            setActiveMarker(null)
        }, 450)
    }

    const openMarker = (index: number) => {
        cancelClose()

        if (lockedMarker !== null) return

        setActiveMarker(index)
        setActiveTerritory(null)
    }

    const lockMarker = (index: number) => {
        cancelClose()

        setActiveMarker(index)
        setLockedMarker(index)
        setActiveTerritory(null)
    }

    const closeCard = () => {
        cancelClose()
        setActiveMarker(null)
        setLockedMarker(null)
    }

    React.useEffect(() => {
        return () => {
            if (closeTimer.current) {
                clearTimeout(closeTimer.current)
            }
        }
    }, [])

    const updatePointer = (event: React.PointerEvent) => {
        const rect = containerRef.current?.getBoundingClientRect()

        if (!rect) return

        setPointer({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        })
    }

    const startDrag = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!enableZoom || isStatic) return

        if (event.pointerType === "mouse" && event.button !== 0) {
            return
        }

        dragRef.current = {
            x: event.clientX,
            y: event.clientY,
            offsetX: offset.x,
            offsetY: offset.y,
        }

        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const moveDrag = (event: React.PointerEvent) => {
        if (!dragRef.current) return

        const rect = containerRef.current?.getBoundingClientRect()

        if (!rect) return

        const factor = Math.min(rect.width / W, rect.height / H)

        if (factor <= 0) return

        setOffset({
            x:
                dragRef.current.offsetX +
                (event.clientX - dragRef.current.x) / factor,
            y:
                dragRef.current.offsetY +
                (event.clientY - dragRef.current.y) / factor,
        })
    }

    const resetMap = () => {
        setZoom(1)
        setOffset({ x: 0, y: 0 })
        closeCard()
    }

    const getCardPosition = () => {
        if (!selectedLocation) {
            return { left: 0, top: 0 }
        }

        const [x, y] = selectedLocation.coordinates

        const transformedX = W / 2 + offset.x + zoom * (x - W / 2)

        const transformedY = H / 2 + offset.y + zoom * (y - H / 2)

        const factor = Math.min(
            containerSize.width / W,
            containerSize.height / H
        )

        const paddingX = (containerSize.width - W * factor) / 2

        const paddingY = (containerSize.height - H * factor) / 2

        const screenX = paddingX + transformedX * factor

        const screenY = paddingY + transformedY * factor

        const cardWidth = Math.min(235, Math.max(100, containerSize.width - 16))

        const left = Math.max(
            8,
            Math.min(screenX + 20, containerSize.width - cardWidth - 8)
        )

        const top = Math.max(
            8,
            Math.min(screenY - 85, containerSize.height - 175)
        )

        return { left, top }
    }

    const cardPosition = getCardPosition()

    const buttonStyle: React.CSSProperties = {
        width: 34,
        height: 34,
        background: "#242424",
        color: "#FFFFFF",
        border: `1px solid ${borderColor}`,
        borderRadius: 7,
        fontSize: 18,
        cursor: "pointer",
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 200,

                // Fond entièrement transparent
                background: "transparent",
                backgroundColor: "transparent",
                backgroundImage: "none",

                overflow: "hidden",
                borderRadius: 0,
                fontFamily: "Inter, sans-serif",
            }}
        >
            <style>
                {`
                    @keyframes ${pulseName} {
                        0% {
                            opacity: 0.6;
                            transform: scale(1);
                        }
                        70% {
                            opacity: 0;
                            transform: scale(2.5);
                        }
                        100% {
                            opacity: 0;
                            transform: scale(2.5);
                        }
                    }
                `}
            </style>

            {status !== "ready" && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                        fontSize: 13,
                        textAlign: "center",
                        padding: 20,
                        background: "transparent",
                    }}
                >
                    {status === "loading"
                        ? "Chargement de la carte..."
                        : "Impossible de charger la carte."}
                </div>
            )}

            {status === "ready" && geometry && (
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="xMidYMid meet"
                    onPointerDown={startDrag}
                    onPointerMove={moveDrag}
                    onPointerUp={() => {
                        dragRef.current = null
                    }}
                    onPointerCancel={() => {
                        dragRef.current = null
                    }}
                    onClick={() => closeCard()}
                    style={{
                        display: "block",
                        background: "transparent",
                        touchAction: enableZoom ? "none" : "auto",
                        userSelect: "none",
                    }}
                >
                    <g
                        transform={`
                            translate(
                                ${W / 2 + offset.x},
                                ${H / 2 + offset.y}
                            )
                            scale(${zoom})
                            translate(${-W / 2}, ${-H / 2})
                        `}
                    >
                        {geometry.territories.map((area) => {
                            const hovered = activeTerritory === area.id

                            return (
                                <path
                                    key={area.id}
                                    d={area.d}
                                    fill={hovered ? hoverColor : territoryColor}
                                    stroke={hovered ? hoverColor : borderColor}
                                    strokeWidth={
                                        hovered
                                            ? borderWidth * 1.5
                                            : borderWidth
                                    }
                                    vectorEffect="non-scaling-stroke"
                                    fillRule="evenodd"
                                    onPointerEnter={(event) => {
                                        if (
                                            isStatic ||
                                            dragRef.current ||
                                            activeMarker !== null
                                        ) {
                                            return
                                        }

                                        setActiveTerritory(area.id)
                                        updatePointer(event)
                                    }}
                                    onPointerMove={(event) => {
                                        if (!dragRef.current) {
                                            updatePointer(event)
                                        }
                                    }}
                                    onPointerLeave={() =>
                                        setActiveTerritory(null)
                                    }
                                    style={{
                                        cursor: "pointer",
                                        transition: `fill ${hoverSpeed}s ease, stroke ${hoverSpeed}s ease`,
                                    }}
                                />
                            )
                        })}

                        {visibleLocations.map((location, index) => {
                            const [x, y] = location.coordinates
                            const selected = activeMarker === index

                            return (
                                <g
                                    key={index}
                                    transform={`translate(${x}, ${y})`}
                                    onPointerEnter={(event) => {
                                        if (isStatic || dragRef.current) {
                                            return
                                        }

                                        openMarker(index)
                                        updatePointer(event)
                                    }}
                                    onPointerLeave={scheduleClose}
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        lockMarker(index)
                                    }}
                                    style={{
                                        cursor: "pointer",
                                    }}
                                >
                                    <circle
                                        r={
                                            Math.max(markerSize * 2.2, 15) /
                                            zoom
                                        }
                                        fill="transparent"
                                    />

                                    {markerPulse && !isStatic && (
                                        <circle
                                            r={markerSize / zoom}
                                            fill={markerColor}
                                            style={{
                                                transformBox: "fill-box",
                                                transformOrigin: "center",
                                                animation: `${pulseName} 2.2s ease-out infinite`,
                                                animationDelay: `${index * 0.3}s`,
                                                pointerEvents: "none",
                                            }}
                                        />
                                    )}

                                    <circle
                                        r={
                                            (selected
                                                ? markerSize * 1.3
                                                : markerSize) / zoom
                                        }
                                        fill={markerColor}
                                        stroke={markerBorder}
                                        strokeWidth={1.5 / zoom}
                                        style={{
                                            transition: "all 0.2s ease",
                                            pointerEvents: "none",
                                        }}
                                    />
                                </g>
                            )
                        })}
                    </g>
                </svg>
            )}

            {showTooltip &&
                activeArea &&
                activeMarker === null &&
                !isStatic && (
                    <div
                        style={{
                            position: "absolute",
                            left: Math.max(
                                8,
                                Math.min(
                                    pointer.x + 15,
                                    containerSize.width - 180
                                )
                            ),
                            top: Math.max(8, pointer.y - 45),
                            padding: "9px 13px",
                            background: cardBackground,
                            border: `1px solid ${borderColor}`,
                            borderRadius: 8,
                            color: cardText,
                            fontSize: 13,
                            fontWeight: 600,
                            pointerEvents: "none",
                            zIndex: 5,
                        }}
                    >
                        {mode === "departements" ? `${activeArea.code} — ` : ""}
                        {activeArea.name}
                    </div>
                )}

            {selectedLocation && !isStatic && (
                <div
                    onPointerEnter={cancelClose}
                    onPointerLeave={scheduleClose}
                    onClick={(event) => event.stopPropagation()}
                    style={{
                        position: "absolute",
                        left: cardPosition.left,
                        top: cardPosition.top,
                        width: 235,
                        maxWidth: "calc(100% - 16px)",
                        boxSizing: "border-box",
                        background: cardBackground,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 12,
                        padding: 16,
                        color: cardText,
                        zIndex: 20,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                        pointerEvents: "auto",
                        cursor: "default",
                    }}
                >
                    <button
                        onClick={(event) => {
                            event.stopPropagation()
                            closeCard()
                        }}
                        aria-label="Fermer la fiche"
                        style={{
                            position: "absolute",
                            top: 9,
                            right: 9,
                            width: 25,
                            height: 25,
                            border: "none",
                            background: "transparent",
                            color: cardText,
                            fontSize: 20,
                            cursor: "pointer",
                        }}
                    >
                        ×
                    </button>

                    <div
                        style={{
                            fontSize: 15,
                            fontWeight: 700,
                            marginBottom: 5,
                            paddingRight: 20,
                        }}
                    >
                        {selectedLocation.name}
                    </div>

                    <div
                        style={{
                            fontSize: 12,
                            opacity: 0.7,
                            marginBottom: 12,
                        }}
                    >
                        {selectedLocation.company}
                    </div>

                    <div
                        style={{
                            fontSize: 12,
                            marginBottom: 7,
                        }}
                    >
                        📍 {selectedLocation.department}
                    </div>

                    <div
                        style={{
                            fontSize: 12,
                            marginBottom: 14,
                        }}
                    >
                        {selectedLocation.activity}
                    </div>

                    {selectedLocation.website && (
                        <a
                            href={selectedLocation.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            style={{
                                display: "inline-block",
                                color: cardText,
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: "underline",
                                textUnderlineOffset: 3,
                                cursor: "pointer",
                            }}
                        >
                            Visiter le site ↗
                        </a>
                    )}
                </div>
            )}

            {enableZoom && showControls && !isStatic && (
                <div
                    style={{
                        position: "absolute",
                        right: 16,
                        bottom: 16,
                        display: "flex",
                        gap: 6,
                        zIndex: 10,
                    }}
                >
                    <button
                        style={buttonStyle}
                        onClick={() => setZoom((z) => Math.min(6, z * 1.3))}
                    >
                        +
                    </button>

                    <button
                        style={buttonStyle}
                        onClick={() => setZoom((z) => Math.max(1, z / 1.3))}
                    >
                        −
                    </button>

                    <button style={buttonStyle} onClick={resetMap}>
                        ↺
                    </button>
                </div>
            )}
        </div>
    )
}

FranceServiceMap.defaultProps = {
    mode: "departements",

    territoryColor: "#292929",
    borderColor: "#555555",
    hoverColor: "#FFFFFF",

    borderWidth: 0.8,
    hoverSpeed: 0.25,

    locations: DEMO_LOCATIONS,

    showMarkers: true,
    markerColor: "#FF4444",
    markerBorder: "#FFFFFF",
    markerSize: 6,
    markerPulse: true,

    cardBackground: "#202020",
    cardText: "#FFFFFF",

    showTooltip: true,
    enableZoom: true,
    showControls: true,
}

addPropertyControls(FranceServiceMap, {
    mode: {
        type: ControlType.Enum,
        title: "Map Mode",
        options: ["regions", "departements"],
        optionTitles: ["Régions", "Départements"],
        displaySegmentedControl: true,
    },

    territoryColor: {
        type: ControlType.Color,
        title: "Territories",
    },

    borderColor: {
        type: ControlType.Color,
        title: "Borders",
    },

    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
    },

    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 4,
        step: 0.1,
    },

    hoverSpeed: {
        type: ControlType.Number,
        title: "Hover Speed",
        min: 0.1,
        max: 1.5,
        step: 0.05,
    },

    showMarkers: {
        type: ControlType.Boolean,
        title: "Show Markers",
    },

    locations: {
        type: ControlType.Array,
        title: "Locations",
        maxCount: 100,
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Location Name",
                },
                company: {
                    type: ControlType.String,
                    title: "Company",
                },
                department: {
                    type: ControlType.String,
                    title: "Department",
                },
                activity: {
                    type: ControlType.String,
                    title: "Activity",
                },
                latitude: {
                    type: ControlType.Number,
                    title: "Latitude",
                    min: -90,
                    max: 90,
                    step: 0.0001,
                },
                longitude: {
                    type: ControlType.Number,
                    title: "Longitude",
                    min: -180,
                    max: 180,
                    step: 0.0001,
                },
                website: {
                    type: ControlType.String,
                    title: "Website URL",
                },
            },
        },
        hidden: (props) => !props.showMarkers,
    },

    markerColor: {
        type: ControlType.Color,
        title: "Marker Color",
        hidden: (props) => !props.showMarkers,
    },

    markerBorder: {
        type: ControlType.Color,
        title: "Marker Border",
        hidden: (props) => !props.showMarkers,
    },

    markerSize: {
        type: ControlType.Number,
        title: "Marker Size",
        min: 3,
        max: 20,
        step: 1,
        hidden: (props) => !props.showMarkers,
    },

    markerPulse: {
        type: ControlType.Boolean,
        title: "Marker Pulse",
        hidden: (props) => !props.showMarkers,
    },

    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
    },

    cardText: {
        type: ControlType.Color,
        title: "Card Text",
    },

    showTooltip: {
        type: ControlType.Boolean,
        title: "Territory Names",
    },

    enableZoom: {
        type: ControlType.Boolean,
        title: "Enable Zoom",
    },

    showControls: {
        type: ControlType.Boolean,
        title: "Zoom Buttons",
        hidden: (props) => !props.enableZoom,
    },
})
