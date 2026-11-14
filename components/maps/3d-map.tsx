import * as React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
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
 * MapExplorerGlobe
 * ---------------------------------------------------------------
 * A Mapbox-style interactive globe/map component for Framer. Two render
 * providers, switchable via a property control:
 *   - "Free": no signup, MapLibre GL JS + OSM/Esri/CARTO/OpenTopoMap tiles
 *   - "Mapbox": the real Mapbox GL JS renderer + hosted Mapbox styles —
 *     requires a free access token from the person using this component
 *     (a link and input field are shown right in the properties panel)
 *
 * Zoomed out, the earth renders as an evenly-lit, slowly-rotating 3D globe
 * with an atmosphere glow; zoomed in, it smoothly blends into a normal
 * flat map — same behavior as mapbox.com's homepage globe.
 *
 * - Type a place name OR "lat, lng" and it flies there and drops a pin
 * - Free provider: switch between Streets / Satellite / Dark / Light /
 *   Terrain / Voyager. Mapbox provider: Streets / Satellite Streets /
 *   Outdoors / Light / Dark / Navigation Day / Navigation Night
 * - Idle auto-rotation, pauses on interaction, resumable via reset button
 * - Clicking the pin opens a closable location card (name, photo, address,
 *   phone, email) that floats right above it and follows it as the map moves
 * - Geocoding via OSM Nominatim on the free provider, Mapbox Geocoding API
 *   on the Mapbox provider (keeps every request under the provider whose
 *   terms already cover it, and avoids Nominatim's client-side rate limits)
 *
 * Drop this component onto a Framer canvas and resize it like any frame.
 */

const MAPLIBRE_JS = "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"
const MAPLIBRE_CSS = "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css"

const MAPBOX_JS = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.js"
const MAPBOX_CSS = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css"
const MAPBOX_TOKEN_URL = "https://console.mapbox.com/account/access-tokens/"
const MAPBOX_GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"

const MAPBOX_STYLES: Record<string, { label: string; id: string }> = {
    streets: { label: "Streets", id: "streets-v12" },
    satellite: { label: "Satellite Streets", id: "satellite-streets-v12" },
    outdoors: { label: "Outdoors", id: "outdoors-v12" },
    light: { label: "Light", id: "light-v11" },
    dark: { label: "Dark", id: "dark-v11" },
    navDay: { label: "Navigation Day", id: "navigation-day-v1" },
    navNight: { label: "Navigation Night", id: "navigation-night-v1" },
}

function mapboxStyleUrl(key: string): string {
    const def = MAPBOX_STYLES[key] || MAPBOX_STYLES.streets
    return `mapbox://styles/mapbox/${def.id}`
}

const WORLD_CENTER: [number, number] = [12, 24]
const WORLD_ZOOM = 0.9
const SECONDS_PER_REVOLUTION = 140
const SPIN_ZOOM_THRESHOLD = 5

type StyleDef = {
    label: string
    tiles: string[]
    attribution: string
    tileSize: number
    bg: string
}

const STYLES: Record<string, StyleDef> = {
    streets: {
        label: "Streets",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        attribution: "&copy; OpenStreetMap contributors",
        tileSize: 256,
        bg: "#eef0f2",
    },
    satellite: {
        label: "Satellite",
        tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        tileSize: 256,
        bg: "#0c1930",
    },
    dark: {
        label: "Dark",
        tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"],
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        tileSize: 256,
        bg: "#0c1019",
    },
    light: {
        label: "Light",
        tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"],
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        tileSize: 256,
        bg: "#eef0f2",
    },
    terrain: {
        label: "Terrain",
        tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
        attribution: "&copy; OpenStreetMap contributors, SRTM | OpenTopoMap",
        tileSize: 256,
        bg: "#e4e6dc",
    },
    voyager: {
        label: "Voyager",
        tiles: [
            "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        ],
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        tileSize: 256,
        bg: "#eef0f2",
    },
}

function buildStyle(key: string, enableGlobe: boolean): any {
    const def = STYLES[key] || STYLES.streets
    // Satellite imagery has no baked-in labels, so a directional "sun" light
    // can safely darken its far side for a realistic day/night look. Every
    // other style bakes light-colored place names straight into the tile
    // images — darkening/brightening those pixels would wash the text out —
    // so those stay evenly lit and keep only the soft rim-glow atmosphere.
    const useDayLight = key === "satellite"
    return {
        version: 8,
        projection: enableGlobe ? { type: "globe" } : { type: "mercator" },
        sky: {
            "atmosphere-blend": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                1,
                5,
                1,
                7,
                0,
            ],
        },
        ...(useDayLight
            ? { light: { anchor: "map", position: [1.5, 90, 80] } }
            : {}),
        sources: {
            "raster-tiles": {
                type: "raster",
                tiles: def.tiles,
                tileSize: def.tileSize,
                attribution: def.attribution,
            },
        },
        layers: [
            {
                id: "background",
                type: "background",
                paint: { "background-color": def.bg },
            },
            {
                id: "raster-layer",
                type: "raster",
                source: "raster-tiles",
            },
        ],
    }
}

let loadPromise: Promise<any> | null = null

function loadMapLibre(): Promise<any> {
    if (typeof window === "undefined") return Promise.resolve(null)
    if ((window as any).maplibregl)
        return Promise.resolve((window as any).maplibregl)
    if (loadPromise) return loadPromise

    loadPromise = new Promise((resolve, reject) => {
        if (!document.querySelector(`link[href="${MAPLIBRE_CSS}"]`)) {
            const link = document.createElement("link")
            link.rel = "stylesheet"
            link.href = MAPLIBRE_CSS
            document.head.appendChild(link)
        }
        const existing = document.querySelector(
            `script[src="${MAPLIBRE_JS}"]`
        ) as HTMLScriptElement | null
        if (existing) {
            existing.addEventListener("load", () =>
                resolve((window as any).maplibregl)
            )
            existing.addEventListener("error", reject)
            return
        }
        const script = document.createElement("script")
        script.src = MAPLIBRE_JS
        script.async = true
        script.onload = () => resolve((window as any).maplibregl)
        script.onerror = reject
        document.head.appendChild(script)
    })

    return loadPromise
}

let mapboxLoadPromise: Promise<any> | null = null

function loadMapboxGL(): Promise<any> {
    if (typeof window === "undefined") return Promise.resolve(null)
    if ((window as any).mapboxgl)
        return Promise.resolve((window as any).mapboxgl)
    if (mapboxLoadPromise) return mapboxLoadPromise

    mapboxLoadPromise = new Promise((resolve, reject) => {
        if (!document.querySelector(`link[href="${MAPBOX_CSS}"]`)) {
            const link = document.createElement("link")
            link.rel = "stylesheet"
            link.href = MAPBOX_CSS
            document.head.appendChild(link)
        }
        const existing = document.querySelector(
            `script[src="${MAPBOX_JS}"]`
        ) as HTMLScriptElement | null
        if (existing) {
            existing.addEventListener("load", () =>
                resolve((window as any).mapboxgl)
            )
            existing.addEventListener("error", reject)
            return
        }
        const script = document.createElement("script")
        script.src = MAPBOX_JS
        script.async = true
        script.onload = () => resolve((window as any).mapboxgl)
        script.onerror = reject
        document.head.appendChild(script)
    })

    return mapboxLoadPromise
}

type CardInfo = {
    name: string
    address: string
    image?: string
    phone?: string
    email?: string
}

type Props = {
    provider: "free" | "mapbox"
    mapboxToken: string
    mapboxStyle: keyof typeof MAPBOX_STYLES
    defaultLocation: string
    defaultZoom: number
    mapStyle: keyof typeof STYLES
    pinColor: string
    accentColor: string
    enableGlobe: boolean
    startAtGlobeView: boolean
    enableIdleRotation: boolean
    showSearch: boolean
    showStyleSwitcher: boolean
    showLocateButton: boolean
    showResetButton: boolean
    showCoordinates: boolean
    showLocationCard: boolean
    cardImage?: { src: string } | string
    cardPhone: string
    cardEmail: string
    borderRadius: number
    style?: React.CSSProperties
}

/**
 * MapExplorerGlobe
 * ---------------------------------------------------------------
 * A Mapbox-style interactive globe/map component for Framer. Two render
 * providers, switchable via a property control:
 *   - "Free": no signup, MapLibre GL JS + OSM/Esri/CARTO/OpenTopoMap tiles
 *   - "Mapbox": the real Mapbox GL JS renderer + hosted Mapbox styles —
 *     requires a free access token from the person using this component
 *     (a link and input field are shown right in the properties panel)
 *
 * Zoomed out, the earth renders as an evenly-lit, slowly-rotating 3D globe
 * with an atmosphere glow; zoomed in, it smoothly blends into a normal
 * flat map — same behavior as mapbox.com's homepage globe.
 *
 * - Type a place name OR "lat, lng" and it flies there and drops a pin
 * - Free provider: switch between Streets / Satellite / Dark / Light /
 *   Terrain / Voyager. Mapbox provider: Streets / Satellite Streets /
 *   Outdoors / Light / Dark / Navigation Day / Navigation Night
 * - Idle auto-rotation, pauses on interaction, resumable via reset button
 * - Clicking the pin opens a closable location card (name, photo, address,
 *   phone, email) that floats right above it and follows it as the map moves
 * - Geocoding via OSM Nominatim on the free provider, Mapbox Geocoding API
 *   on the Mapbox provider (keeps every request under the provider whose
 *   terms already cover it, and avoids Nominatim's client-side rate limits)
 *
 * Drop this component onto a Framer canvas and resize it like any frame.
 */
/*
 * @framerIntrinsicWidth 450
 * @framerIntrinsicHeight 350
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Map3D(props: Props) {
    const {
        provider,
        mapboxToken,
        mapboxStyle,
        defaultLocation,
        defaultZoom,
        mapStyle,
        pinColor,
        accentColor,
        enableGlobe,
        startAtGlobeView,
        enableIdleRotation,
        showSearch,
        showStyleSwitcher,
        showLocateButton,
        showResetButton,
        showCoordinates,
        showLocationCard,
        cardImage,
        cardPhone,
        cardEmail,
        borderRadius,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const glRef = useRef<any>(null)
    const userInteractingRef = useRef(false)
    const spinEnabledRef = useRef(enableIdleRotation)
    const pinLngLatRef = useRef<{ lat: number; lng: number } | null>(null)
    const cardInfoRef = useRef<CardInfo | null>(null)
    const cardVisibleRef = useRef(false)
    // Guards the geocode() async race: only the most recently *issued*
    // request is allowed to apply its result once it resolves.
    const geocodeSeqRef = useRef(0)
    // Tracks whether the person has ever searched/dropped a pin manually,
    // so a later change to the "Location" property control (from Framer's
    // panel, post-mount) doesn't yank the map out from under them.
    const hasManualSearchRef = useRef(false)
    const providerRef = useRef(provider)
    const mapboxTokenRef = useRef(mapboxToken)

    const [query, setQuery] = useState(defaultLocation)
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")
    const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
        null
    )
    const [ready, setReady] = useState(false)
    const [tokenMissing, setTokenMissing] = useState(false)
    const [activeStyle, setActiveStyle] = useState(mapStyle)
    const [activeMapboxStyle, setActiveMapboxStyle] = useState(mapboxStyle)
    const [cardInfo, setCardInfo] = useState<CardInfo | null>(null)
    const [cardVisible, setCardVisible] = useState(false)
    const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(
        null
    )

    useEffect(() => {
        cardVisibleRef.current = cardVisible
    }, [cardVisible])

    useEffect(() => {
        spinEnabledRef.current = enableIdleRotation
    }, [enableIdleRotation])

    useEffect(() => {
        providerRef.current = provider
        mapboxTokenRef.current = mapboxToken
    }, [provider, mapboxToken])

    const spinGlobe = useCallback(() => {
        const map = mapRef.current
        if (!map || !enableGlobe) return
        if (
            !spinEnabledRef.current ||
            userInteractingRef.current ||
            map.getZoom() >= SPIN_ZOOM_THRESHOLD
        )
            return

        let distancePerSecond = 360 / SECONDS_PER_REVOLUTION
        const zoom = map.getZoom()
        if (zoom > 2.5) {
            const zoomDif =
                (SPIN_ZOOM_THRESHOLD - zoom) / (SPIN_ZOOM_THRESHOLD - 2.5)
            distancePerSecond *= Math.max(zoomDif, 0)
        }
        const c = map.getCenter()
        c.lng -= distancePerSecond
        map.easeTo({ center: c, duration: 1000, easing: (n: number) => n })
    }, [enableGlobe])

    // Recomputes the card's on-screen position from the pin's lng/lat
    // (called on every map move/zoom/rotate while the card is open, and
    // once immediately when the card is opened).
    const updateCardPos = useCallback(() => {
        const map = mapRef.current
        const pin = pinLngLatRef.current
        if (!map || !pin) return
        const point = map.project([pin.lng, pin.lat])
        setCardPos({ x: point.x, y: point.y })
    }, [])

    // Opens the card for whatever pin currently exists, anchored to its
    // current screen position. Only ever called from a pin click.
    const openCardForPin = useCallback(() => {
        if (!cardInfoRef.current) return
        setCardInfo(cardInfoRef.current)
        updateCardPos()
        setCardVisible(true)
    }, [updateCardPos])

    const dropPin = useCallback(
        (lat: number, lng: number, zoom?: number, label?: string) => {
            const gl = glRef.current
            const map = mapRef.current
            if (!gl || !map) return

            // A new pin means any open card refers to the old location —
            // close it. The new pin's card only opens when it's clicked.
            setCardVisible(false)
            pinLngLatRef.current = { lat, lng }

            // Create/move the pin — this must always succeed and be
            // visible, independent of the info card below.
            if (!markerRef.current) {
                markerRef.current = new gl.Marker({ color: pinColor })
                    .setLngLat([lng, lat])
                    .addTo(map)
                const el = markerRef.current.getElement()
                el.style.cursor = "pointer"
                el.addEventListener("click", (e: MouseEvent) => {
                    e.stopPropagation()
                    openCardForPin()
                })
            } else {
                markerRef.current.setLngLat([lng, lat])
            }

            // Build the location card from the geocoded label (Nominatim
            // "display_name" / Mapbox "place_name" both read as "Place,
            // Street, City, ..." — first segment is the name, the rest the
            // address) plus whatever contact details were supplied via
            // property controls. Stored in a ref so the marker's click
            // handler always reads the latest data without needing to be
            // re-attached.
            if (showLocationCard) {
                const fullLabel =
                    label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                const parts = fullLabel.split(",").map((p) => p.trim())
                const name = parts[0] || fullLabel
                const address = label
                    ? parts.slice(1).join(", ") || fullLabel
                    : fullLabel
                const resolvedImage =
                    typeof cardImage === "string" ? cardImage : cardImage?.src

                cardInfoRef.current = {
                    name,
                    address,
                    image: resolvedImage,
                    phone: cardPhone,
                    email: cardEmail,
                }
            } else {
                cardInfoRef.current = null
            }

            spinEnabledRef.current = false
            map.flyTo({
                center: [lng, lat],
                zoom: zoom ?? Math.max(map.getZoom(), 4.5),
                duration: 1800,
                essential: true,
            })
            setCenter({ lat, lng })
        },
        [
            pinColor,
            showLocationCard,
            cardImage,
            cardPhone,
            cardEmail,
            openCardForPin,
        ]
    )

    // Geocodes via whichever provider is active. Free -> OSM Nominatim.
    // Mapbox -> Mapbox Geocoding API (reuses the same access token already
    // required for the map itself, and isn't subject to Nominatim's strict
    // client-side usage policy / rate limiting).
    const geocodeViaNominatim = useCallback(async (text: string) => {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
                text
            )}`,
            { headers: { Accept: "application/json" } }
        )
        const data = await res.json()
        if (!data || data.length === 0) return null
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            label: data[0].display_name as string,
        }
    }, [])

    const geocodeViaMapbox = useCallback(async (text: string) => {
        const token = mapboxTokenRef.current
        const res = await fetch(
            `${MAPBOX_GEOCODE_URL}/${encodeURIComponent(
                text
            )}.json?limit=1&access_token=${encodeURIComponent(token)}`
        )
        const data = await res.json()
        const feature = data?.features?.[0]
        if (!feature) return null
        const [lng, lat] = feature.center
        return {
            lat,
            lng,
            label: feature.place_name as string,
        }
    }, [])

    const geocode = useCallback(
        async (raw: string, zoom?: number) => {
            const text = raw.trim()
            if (!text) return
            const seq = ++geocodeSeqRef.current
            setStatus("loading")
            setErrorMsg("")

            const coordMatch = text.match(
                /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
            )
            if (coordMatch) {
                if (seq !== geocodeSeqRef.current) return
                dropPin(
                    parseFloat(coordMatch[1]),
                    parseFloat(coordMatch[2]),
                    zoom
                )
                setStatus("idle")
                return
            }

            try {
                const result =
                    providerRef.current === "mapbox"
                        ? await geocodeViaMapbox(text)
                        : await geocodeViaNominatim(text)

                // A newer geocode() call was issued while this one was in
                // flight — discard this stale result so it can't overwrite
                // a pin the user has already moved on from.
                if (seq !== geocodeSeqRef.current) return

                if (!result) {
                    setStatus("error")
                    setErrorMsg("No location found — try a different search.")
                    return
                }
                dropPin(result.lat, result.lng, zoom, result.label)
                setStatus("idle")
            } catch (e) {
                if (seq !== geocodeSeqRef.current) return
                setStatus("error")
                setErrorMsg("Search failed. Check your connection.")
            }
        },
        [dropPin, geocodeViaMapbox, geocodeViaNominatim]
    )

    const resetView = useCallback(() => {
        const map = mapRef.current
        if (!map) return
        if (markerRef.current) {
            markerRef.current.remove()
            markerRef.current = null
        }
        setCenter(null)
        setQuery("")
        setStatus("idle")
        setErrorMsg("")
        setCardVisible(false)
        setCardInfo(null)
        pinLngLatRef.current = null
        cardInfoRef.current = null
        hasManualSearchRef.current = false
        spinEnabledRef.current = enableIdleRotation
        map.flyTo({ center: WORLD_CENTER, zoom: WORLD_ZOOM, duration: 1500 })
    }, [enableIdleRotation])

    // Init / re-init map whenever the provider (free vs Mapbox) or the
    // Mapbox token changes. Tears down any existing map instance first.
    useEffect(() => {
        let cancelled = false
        setReady(false)
        setTokenMissing(false)
        setCardVisible(false)
        setCardInfo(null)
        pinLngLatRef.current = null
        cardInfoRef.current = null
        hasManualSearchRef.current = false

        async function setup() {
            let gl: any = null
            let map: any = null

            if (provider === "mapbox") {
                if (!mapboxToken || !mapboxToken.trim()) {
                    setTokenMissing(true)
                    return
                }
                gl = await loadMapboxGL()
                if (cancelled || !gl || !containerRef.current) return
                gl.accessToken = mapboxToken.trim()
                glRef.current = gl
                map = new gl.Map({
                    container: containerRef.current,
                    style: mapboxStyleUrl(activeMapboxStyle),
                    center: WORLD_CENTER,
                    zoom: WORLD_ZOOM,
                    projection: enableGlobe ? "globe" : "mercator",
                    attributionControl: { compact: true },
                })
            } else {
                gl = await loadMapLibre()
                if (cancelled || !gl || !containerRef.current) return
                glRef.current = gl
                map = new gl.Map({
                    container: containerRef.current,
                    style: buildStyle(activeStyle, enableGlobe),
                    center: WORLD_CENTER,
                    zoom: WORLD_ZOOM,
                    attributionControl: { compact: true },
                })
            }

            map.addControl(
                new gl.NavigationControl({ showCompass: true }),
                "bottom-right"
            )

            const markInteracting = () => {
                userInteractingRef.current = true
            }
            const releaseInteracting = () => {
                userInteractingRef.current = false
                spinGlobe()
            }
            map.on("mousedown", markInteracting)
            map.on("dragstart", markInteracting)
            map.on("touchstart", markInteracting, { passive: true } as any)
            map.on("mouseup", releaseInteracting)
            map.on("touchend", releaseInteracting)
            map.on("pitchend", spinGlobe)
            map.on("rotateend", spinGlobe)
            map.on("moveend", spinGlobe)

            // Keep the card glued to the pin as the map pans/zooms/rotates,
            // and dismiss it on any click elsewhere on the map (the pin's
            // own click handler stops propagation so this won't refire).
            map.on("move", () => {
                if (cardVisibleRef.current) updateCardPos()
            })
            map.on("click", () => {
                if (cardVisibleRef.current) setCardVisible(false)
            })

            map.on("load", () => {
                mapRef.current = map
                setReady(true)
                if (provider === "mapbox") {
                    try {
                        map.setFog({})
                    } catch (e) {
                        // non-fatal
                    }
                }
                if (defaultLocation && startAtGlobeView === false) {
                    geocode(defaultLocation, defaultZoom)
                } else {
                    spinGlobe()
                }
            })

            const ro = new ResizeObserver(() => map.resize())
            if (containerRef.current) ro.observe(containerRef.current)
            ;(map as any).__ro = ro
        }

        setup()

        return () => {
            cancelled = true
            if (mapRef.current) {
                if ((mapRef.current as any).__ro)
                    (mapRef.current as any).__ro.disconnect()
                mapRef.current.remove()
                mapRef.current = null
            }
            markerRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider, mapboxToken])

    // Re-fly to `defaultLocation` if it's changed from Framer's property
    // panel after the map has already mounted — but only as long as the
    // person hasn't searched or dropped a pin themselves, so we never yank
    // the view out from under an active exploration.
    const prevDefaultLocationRef = useRef(defaultLocation)
    useEffect(() => {
        if (prevDefaultLocationRef.current === defaultLocation) return
        prevDefaultLocationRef.current = defaultLocation
        if (!ready || hasManualSearchRef.current) return
        if (defaultLocation && startAtGlobeView === false) {
            setQuery(defaultLocation)
            geocode(defaultLocation, defaultZoom)
        }
    }, [defaultLocation, ready, startAtGlobeView, defaultZoom, geocode])

    // Swap style — free provider (raster tiles, rebuilt locally)
    useEffect(() => {
        const map = mapRef.current
        if (!map || !ready || provider !== "free") return
        map.setStyle(buildStyle(activeStyle, enableGlobe))
    }, [activeStyle, enableGlobe, ready, provider])

    // Swap style — Mapbox (hosted style URL, projection re-applied after load)
    useEffect(() => {
        const map = mapRef.current
        if (!map || !ready || provider !== "mapbox") return
        map.setStyle(mapboxStyleUrl(activeMapboxStyle))
        map.once("style.load", () => {
            try {
                map.setProjection({
                    name: enableGlobe ? "globe" : "mercator",
                })
                map.setFog({})
            } catch (e) {
                // non-fatal
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMapboxStyle, ready, provider])

    // Toggle globe/mercator on Mapbox without a full style reload
    useEffect(() => {
        const map = mapRef.current
        if (!map || !ready || provider !== "mapbox") return
        try {
            map.setProjection({ name: enableGlobe ? "globe" : "mercator" })
        } catch (e) {
            // non-fatal
        }
    }, [enableGlobe, ready, provider])

    const locateMe = useCallback(() => {
        if (!navigator.geolocation) return
        hasManualSearchRef.current = true
        setStatus("loading")
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                dropPin(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    12,
                    "Your location"
                )
                setQuery(
                    `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
                )
                setStatus("idle")
            },
            () => {
                setStatus("error")
                setErrorMsg("Couldn't get your location.")
            }
        )
    }, [dropPin])

    const clearSearch = useCallback(() => {
        setQuery("")
    }, [])

    const handleSearchSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()
            hasManualSearchRef.current = true
            geocode(query)
        },
        [geocode, query]
    )

    return (
        <div
            className="map-explorer-space-bg"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 200,
                borderRadius,
                overflow: "hidden",
                fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                ...style,
            }}
        >
            <div
                ref={containerRef}
                style={{ position: "absolute", inset: 0 }}
            />

            {tokenMissing && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: "0 28px",
                        color: "rgba(255,255,255,0.9)",
                        fontSize: 13,
                        lineHeight: 1.5,
                    }}
                >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <rect
                            x="4"
                            y="10"
                            width="16"
                            height="10"
                            rx="2"
                            stroke="rgba(255,255,255,0.8)"
                            strokeWidth="1.6"
                        />
                        <path
                            d="M8 10V7a4 4 0 0 1 8 0v3"
                            stroke="rgba(255,255,255,0.8)"
                            strokeWidth="1.6"
                        />
                    </svg>
                    <div style={{ fontWeight: 600 }}>
                        Add a Mapbox access token
                    </div>
                    <div style={{ maxWidth: 260, opacity: 0.8 }}>
                        Paste it into the "Mapbox access token" field in the
                        properties panel to load Mapbox styles.
                    </div>
                    <a
                        href={MAPBOX_TOKEN_URL}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 12.5,
                            textDecoration: "underline",
                        }}
                    >
                        Get a free token from Mapbox →
                    </a>
                </div>
            )}

            {!ready && !tokenMissing && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 12.5,
                        letterSpacing: 0.3,
                    }}
                >
                    <div
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            border: "2.5px solid rgba(255,255,255,0.25)",
                            borderTopColor: "rgba(255,255,255,0.85)",
                            animation: "mapExplorerSpin 0.8s linear infinite",
                        }}
                    />
                    {provider === "mapbox"
                        ? "Loading Mapbox…"
                        : "Loading globe…"}
                </div>
            )}

            {showSearch && (
                <form
                    onSubmit={handleSearchSubmit}
                    style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        right: showLocateButton ? 56 : 12,
                        zIndex: 5,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "rgba(255,255,255,0.97)",
                        backdropFilter: "blur(8px)",
                        borderRadius: 12,
                        padding: "10px 12px",
                        boxShadow:
                            "0 4px 16px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)",
                        transition: "box-shadow 0.15s ease",
                    }}
                >
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ flexShrink: 0, opacity: 0.5 }}
                    >
                        <circle
                            cx="11"
                            cy="11"
                            r="7"
                            stroke="#333"
                            strokeWidth="2"
                        />
                        <path
                            d="M21 21l-4.35-4.35"
                            stroke="#333"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                clearSearch()
                                ;(e.target as HTMLInputElement).blur()
                            }
                        }}
                        placeholder="Search a place or lat, lng…"
                        style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            fontSize: 13.5,
                            background: "transparent",
                            color: "#1a1a1a",
                            minWidth: 0,
                        }}
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            aria-label="Clear search"
                            style={{
                                border: "none",
                                background: "rgba(0,0,0,0.06)",
                                color: "#666",
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                fontSize: 12,
                                lineHeight: "20px",
                                cursor: "pointer",
                                flexShrink: 0,
                                padding: 0,
                            }}
                        >
                            ×
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        style={{
                            border: "none",
                            background: accentColor,
                            color: "#fff",
                            fontSize: 12.5,
                            fontWeight: 600,
                            padding: "6px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            flexShrink: 0,
                            opacity: status === "loading" ? 0.6 : 1,
                        }}
                    >
                        {status === "loading" ? "…" : "Go"}
                    </button>
                </form>
            )}

            {showLocateButton && (
                <button
                    onClick={locateMe}
                    title="Use my location"
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 5,
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        border: "none",
                        background: "rgba(255,255,255,0.97)",
                        boxShadow:
                            "0 4px 16px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                    }}
                >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke={accentColor}
                            strokeWidth="2"
                        />
                        <path
                            d="M12 2v3M12 19v3M2 12h3M19 12h3"
                            stroke={accentColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            )}

            {showResetButton && (
                <button
                    onClick={resetView}
                    title="Reset to globe view"
                    style={{
                        position: "absolute",
                        top: showLocateButton ? 60 : 12,
                        right: 12,
                        zIndex: 5,
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        border: "none",
                        background: "rgba(255,255,255,0.97)",
                        boxShadow:
                            "0 4px 16px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke={accentColor}
                            strokeWidth="2"
                        />
                        <path
                            d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z"
                            stroke={accentColor}
                            strokeWidth="1.5"
                        />
                    </svg>
                </button>
            )}

            {showStyleSwitcher && !tokenMissing && (
                <div
                    className="map-explorer-style-switcher"
                    style={{
                        position: "absolute",
                        bottom: provider === "mapbox" ? 50 : 12,
                        left: 12,
                        zIndex: 5,
                        display: "flex",
                        gap: 4,
                        background: "rgba(255,255,255,0.97)",
                        backdropFilter: "blur(8px)",
                        borderRadius: 12,
                        padding: 4,
                        boxShadow:
                            "0 4px 16px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)",
                        maxWidth: "calc(100% - 24px)",
                        overflowX: "auto",
                    }}
                    role="group"
                    aria-label="Map style"
                >
                    {provider === "mapbox"
                        ? Object.entries(MAPBOX_STYLES).map(([key, def]) => (
                              <button
                                  key={key}
                                  onClick={() => setActiveMapboxStyle(key)}
                                  aria-pressed={activeMapboxStyle === key}
                                  style={{
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: 11.5,
                                      fontWeight: 600,
                                      padding: "7px 11px",
                                      borderRadius: 8,
                                      background:
                                          activeMapboxStyle === key
                                              ? accentColor
                                              : "transparent",
                                      color:
                                          activeMapboxStyle === key
                                              ? "#fff"
                                              : "#3a3a3a",
                                      transition: "background 0.15s ease",
                                      whiteSpace: "nowrap",
                                  }}
                              >
                                  {def.label}
                              </button>
                          ))
                        : Object.entries(STYLES).map(([key, def]) => (
                              <button
                                  key={key}
                                  onClick={() => setActiveStyle(key)}
                                  aria-pressed={activeStyle === key}
                                  style={{
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: 11.5,
                                      fontWeight: 600,
                                      padding: "7px 11px",
                                      borderRadius: 8,
                                      background:
                                          activeStyle === key
                                              ? accentColor
                                              : "transparent",
                                      color:
                                          activeStyle === key
                                              ? "#fff"
                                              : "#3a3a3a",
                                      transition: "background 0.15s ease",
                                      whiteSpace: "nowrap",
                                  }}
                              >
                                  {def.label}
                              </button>
                          ))}
                </div>
            )}

            {provider === "mapbox" && !tokenMissing && (
                <a
                    href="https://www.mapbox.com/"
                    target="_blank"
                    rel="noreferrer"
                    title="Mapbox"
                    style={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        zIndex: 5,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "rgba(255,255,255,0.97)",
                        backdropFilter: "blur(8px)",
                        borderRadius: 8,
                        padding: "4px 9px 4px 6px",
                        boxShadow:
                            "0 4px 16px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)",
                        textDecoration: "none",
                    }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="#1a1a1a"
                            strokeWidth="1.6"
                        />
                        <path
                            d="M6.5 15.5c2-3.5 3.8-5.3 7.3-7.3-2 3.5-3.8 5.3-7.3 7.3z"
                            fill="#1a1a1a"
                        />
                    </svg>
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#1a1a1a",
                            letterSpacing: 0.2,
                        }}
                    >
                        Mapbox
                    </span>
                </a>
            )}

            {showCoordinates && center && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 12,
                        right: 12,
                        zIndex: 5,
                        background: "rgba(0,0,0,0.65)",
                        color: "#fff",
                        fontSize: 11,
                        fontVariantNumeric: "tabular-nums",
                        padding: "5px 9px",
                        borderRadius: 7,
                        letterSpacing: 0.2,
                    }}
                >
                    {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
                </div>
            )}

            {status === "error" && errorMsg && (
                <div
                    style={{
                        position: "absolute",
                        top: showSearch ? 62 : 12,
                        left: 12,
                        zIndex: 5,
                        background: "#e0403a",
                        color: "#fff",
                        fontSize: 12,
                        padding: "7px 11px",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                >
                    {errorMsg}
                </div>
            )}

            {showLocationCard && cardVisible && cardInfo && cardPos && (
                <div
                    style={{
                        position: "absolute",
                        left: Math.min(
                            Math.max(cardPos.x, 160),
                            (containerRef.current?.clientWidth || 9999) - 160
                        ),
                        top: cardPos.y,
                        zIndex: 6,
                        transform: "translate(-50%, calc(-100% - 48px))",
                        width: 300,
                        maxWidth: "calc(100% - 24px)",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            background: "rgba(255,255,255,0.98)",
                            backdropFilter: "blur(8px)",
                            borderRadius: 14,
                            boxShadow:
                                "0 8px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.04)",
                            overflow: "hidden",
                            animation: "mapExplorerCardIn 0.15s ease",
                            pointerEvents: "auto",
                        }}
                    >
                        <button
                            onClick={() => setCardVisible(false)}
                            aria-label="Close location card"
                            style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                border: "none",
                                background: "rgba(0,0,0,0.45)",
                                color: "#fff",
                                fontSize: 13,
                                lineHeight: "22px",
                                cursor: "pointer",
                                zIndex: 1,
                            }}
                        >
                            ×
                        </button>

                        {cardInfo.image && (
                            <div
                                style={{
                                    width: "100%",
                                    height: 120,
                                    background: `#eee url(${cardInfo.image}) center/cover no-repeat`,
                                }}
                            />
                        )}

                        <div style={{ padding: "12px 14px 14px" }}>
                            <div
                                style={{
                                    fontSize: 14.5,
                                    fontWeight: 700,
                                    color: "#1a1a1a",
                                    marginBottom: 4,
                                    paddingRight: cardInfo.image ? 0 : 22,
                                }}
                            >
                                {cardInfo.name}
                            </div>

                            {cardInfo.address && (
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#555",
                                        lineHeight: 1.4,
                                        marginBottom: 8,
                                    }}
                                >
                                    {cardInfo.address}
                                </div>
                            )}

                            {(cardInfo.phone || cardInfo.email) && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4,
                                        fontSize: 12,
                                    }}
                                >
                                    {cardInfo.phone && (
                                        <a
                                            href={`tel:${cardInfo.phone}`}
                                            style={{
                                                color: accentColor,
                                                textDecoration: "none",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {cardInfo.phone}
                                        </a>
                                    )}
                                    {cardInfo.email && (
                                        <a
                                            href={`mailto:${cardInfo.email}`}
                                            style={{
                                                color: accentColor,
                                                textDecoration: "none",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {cardInfo.email}
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Little arrow pointing down at the pin */}
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            bottom: -7,
                            transform: "translateX(-50%)",
                            width: 0,
                            height: 0,
                            borderLeft: "7px solid transparent",
                            borderRight: "7px solid transparent",
                            borderTop: "7px solid rgba(255,255,255,0.98)",
                            filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.12))",
                        }}
                    />
                </div>
            )}

            <style>{`
                @keyframes mapExplorerSpin {
                    to { transform: rotate(360deg); }
                }
                @keyframes mapExplorerCardIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes mapExplorerTwinkle {
                    0%, 100% { opacity: 0.25; }
                    50% { opacity: 0.9; }
                }
                .map-explorer-space-bg {
                    background-color: #050505;
                    background-image:
                        radial-gradient(
                            ellipse 70% 60% at 25% 20%,
                            rgba(30, 30, 30, 0.35),
                            transparent 60%
                        ),
                        radial-gradient(
                            ellipse 60% 55% at 80% 75%,
                            rgba(20, 20, 20, 0.3),
                            transparent 55%
                        ),
                        linear-gradient(
                            160deg,
                            #0a0a0a 0%,
                            #111111 45%,
                            #050505 100%
                        );
                }
                .map-explorer-space-bg::before,
                .map-explorer-space-bg::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    z-index: -1;
                    pointer-events: none;
                    background-repeat: repeat;
                }
                .map-explorer-space-bg::before {
                    background-image:
                        radial-gradient(1.4px 1.4px at 10% 20%, #fff, transparent 100%),
                        radial-gradient(1px 1px at 25% 75%, #fff, transparent 100%),
                        radial-gradient(1.2px 1.2px at 40% 40%, #cfd8ff, transparent 100%),
                        radial-gradient(1px 1px at 60% 15%, #fff, transparent 100%),
                        radial-gradient(1.6px 1.6px at 72% 62%, #fff, transparent 100%),
                        radial-gradient(1px 1px at 88% 30%, #cfd8ff, transparent 100%),
                        radial-gradient(1px 1px at 15% 55%, #fff, transparent 100%),
                        radial-gradient(1.2px 1.2px at 92% 85%, #fff, transparent 100%),
                        radial-gradient(1px 1px at 50% 90%, #fff, transparent 100%),
                        radial-gradient(1px 1px at 35% 5%, #fff, transparent 100%);
                    background-size: 260px 260px;
                    opacity: 0.9;
                }
                .map-explorer-space-bg::after {
                    background-image:
                        radial-gradient(1px 1px at 5% 45%, #fff, transparent 100%),
                        radial-gradient(1px 1px at 45% 65%, #fff, transparent 100%),
                        radial-gradient(1.3px 1.3px at 65% 25%, #fff, transparent 100%),
                        radial-gradient(1px 1px at 80% 55%, #fff, transparent 100%),
                        radial-gradient(1px 1px at 95% 10%, #fff, transparent 100%),
                        radial-gradient(1px 1px at 20% 90%, #fff, transparent 100%);
                    background-size: 320px 320px;
                    animation: mapExplorerTwinkle 4s ease-in-out infinite;
                }
                .map-explorer-style-switcher::-webkit-scrollbar { display: none; }
                .map-explorer-style-switcher { scrollbar-width: none; }
                .maplibregl-ctrl-attrib { font-size: 9px !important; }
            `}</style>
        </div>
    )
}

Map3D.defaultProps = {
    provider: "free",
    mapboxToken: "",
    mapboxStyle: "streets",
    defaultLocation: "New York, NY",
    defaultZoom: 11,
    mapStyle: "streets",
    pinColor: "#E0403A",
    accentColor: "#1A73E8",
    enableGlobe: true,
    startAtGlobeView: true,
    enableIdleRotation: true,
    showSearch: false,
    showStyleSwitcher: false,
    showLocateButton: false,
    showResetButton: false,
    showCoordinates: false,
    showLocationCard: true,
    cardPhone: "",
    cardEmail: "",
    borderRadius: 16,
}

addPropertyControls(Map3D, {
    provider: {
        type: ControlType.Enum,
        title: "Map provider",
        options: ["free", "mapbox"],
        optionTitles: ["Free (no token)", "Mapbox (token required)"],
        defaultValue: "free",
        description:
            "Free uses OSM/Esri/CARTO tiles, no signup needed. Mapbox uses the real Mapbox GL renderer and requires your own access token below.",
    },
    mapboxToken: {
        type: ControlType.String,
        title: "Mapbox access token",
        defaultValue: "",
        placeholder: "pk.eyJ1Ijoi...",
        hidden: (props) => props.provider !== "mapbox",
        description:
            "Get a free public token at console.mapbox.com/account/access-tokens — sign up, copy the default public token (starts with 'pk.'), and paste it here.",
    },
    mapboxStyle: {
        type: ControlType.Enum,
        title: "Mapbox style",
        options: Object.keys(MAPBOX_STYLES),
        optionTitles: Object.values(MAPBOX_STYLES).map((l) => l.label),
        defaultValue: "streets",
        hidden: (props) => props.provider !== "mapbox",
    },
    defaultLocation: {
        type: ControlType.String,
        title: "Location",
        defaultValue: "New York, NY",
        placeholder: "Place name or lat, lng",
    },
    defaultZoom: {
        type: ControlType.Number,
        title: "Zoom",
        min: 1,
        max: 24,
        step: 1,
        defaultValue: 11,
    },
    mapStyle: {
        type: ControlType.Enum,
        title: "Map style",
        options: Object.keys(STYLES),
        optionTitles: Object.values(STYLES).map((l) => l.label),
        defaultValue: "streets",
        hidden: (props) => props.provider === "mapbox",
    },
    enableGlobe: {
        type: ControlType.Boolean,
        title: "3D globe",
        defaultValue: true,
        description:
            "Renders as a rotating globe when zoomed out, blending into a flat map as you zoom in.",
    },
    startAtGlobeView: {
        type: ControlType.Boolean,
        title: "Start at globe view",
        defaultValue: true,
        description:
            "On: opens as a spinning whole-earth view, no pin, until someone searches. Off: flies straight to Location on load.",
    },
    enableIdleRotation: {
        type: ControlType.Boolean,
        title: "Idle rotation",
        defaultValue: true,
    },
    pinColor: {
        type: ControlType.Color,
        title: "Pin color",
        defaultValue: "#E0403A",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent color",
        defaultValue: "#1A73E8",
    },
    showSearch: {
        type: ControlType.Boolean,
        title: "Search bar",
        defaultValue: false,
    },
    showStyleSwitcher: {
        type: ControlType.Boolean,
        title: "Style switcher",
        defaultValue: false,
    },
    showLocateButton: {
        type: ControlType.Boolean,
        title: "Locate button",
        defaultValue: false,
    },
    showResetButton: {
        type: ControlType.Boolean,
        title: "Reset-view button",
        defaultValue: false,
    },
    showCoordinates: {
        type: ControlType.Boolean,
        title: "Show coordinates",
        defaultValue: false,
    },
    showLocationCard: {
        type: ControlType.Boolean,
        title: "Location card",
        defaultValue: true,
        description:
            "Shows a closable card (name, image, address, phone, email) whenever a pin is dropped.",
    },
    cardImage: {
        type: ControlType.Image,
        title: "Card image",
    },
    cardPhone: {
        type: ControlType.String,
        title: "Card phone",
        defaultValue: "",
        placeholder: "+1 555 123 4567",
        hidden: (props) => !props.showLocationCard,
    },
    cardEmail: {
        type: ControlType.String,
        title: "Card email",
        defaultValue: "",
        placeholder: "hello@example.com",
        hidden: (props) => !props.showLocationCard,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner radius",
        min: 0,
        max: 64,
        step: 1,
        defaultValue: 16,
    },
})
