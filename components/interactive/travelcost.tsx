// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion, useInView } from "framer-motion"
import * as React from "react"
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"

type TravelMode = "driving" | "walking"

type Coords = { lat: number; lon: number }

type RouteGeometry = { type: "LineString"; coordinates: [number, number][] }

interface RouteSettings {
    myAddress: string
    travelMode: TravelMode
}

interface Pricing {
    standardRate: number
    baseFee: number
    vatRate: number
    currency: string
}

interface PricingTier {
    minDistanceKm: number
    ratePerKm: number
}

interface Visuals {
    textTemplate: string
    iconPulse: boolean
    accentColor: string
    mapHeight: number
    showBreakdown: boolean
    borderRadius: number
    mapTheme: "light" | "dark" | "silver"
    font: any
}

interface Localization {
    destinationLabel: string
    distanceLabel: string
    durationLabel: string
    statusLabel: string
    baseFeeLabel: string
    distanceCostLabel: string
    discountLabel: string
    netLabel: string
    vatLabel: string
    totalLabel: string
    resetLabel: string
    manualPlaceholder: string
    manualSubmit: string
}

interface TextStrings {
    buttonLabel: string
    loadingText: string
    errorText: string
    deniedText: string
    destinationLabel: string
    distanceLabel: string
    durationLabel: string
    statusLabel: string
    baseFeeLabel: string
    distanceCostLabel: string
    discountLabel: string
    netLabel: string
    vatLabel: string
    totalLabel: string
    resetLabel: string
    manualPlaceholder: string
    manualSubmit: string
}

interface TextStyles {
    buttonFont: any
    statusFont: any
    labelFont: any
    valueFont: any
    breakdownFont: any
    headerFont: any
}

interface CanvasPreview {
    enabled: boolean
    city: string
    distanceKm: number
    durationMin: number
}

type Status = "idle" | "request" | "loading" | "ready" | "denied" | "error"

type MapStyle = "standard" | "grayscale" | "dark"

interface TravelCostProps {
    route: RouteSettings
    pricing: Pricing
    tiers: PricingTier[]
    visuals: Visuals
    localization: Localization
    text: TextStrings
    textStyles: TextStyles
    canvasPreview: CanvasPreview
    initialButtonText: string
    pulseColor: string
    loadingText: string
    errorText: string
    deniedText: string
    gap: number
    mapStyle: MapStyle
    successTemplate: string
    routeColor: string
    lineWidth: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TravelCost(props: TravelCostProps) {
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { amount: 0.2, once: false })

    const {
        route = { myAddress: "New York, NY", travelMode: "driving" },
        pricing = { standardRate: 0.5, baseFee: 0, vatRate: 19, currency: "€" },
        tiers = [{ minDistanceKm: 100, ratePerKm: 0.4 }],
        visuals = {
            textTemplate: "📍 Travel to {city} ({distanceKm}): {totalPrice}",
            iconPulse: true,
            accentColor: "#22CC66",
            mapHeight: 240,
            showBreakdown: true,
            borderRadius: 24,
            mapTheme: "silver",
            font: {},
        },
        text = {
            buttonLabel: "Calculate travel price",
            loadingText: "Planning Route…",
            errorText: "Unable to calculate.",
            deniedText: "Location access denied. Please enter your city manually",
            destinationLabel: "DESTINATION",
            distanceLabel: "DISTANCE",
            durationLabel: "DURATION",
            statusLabel: "STATUS",
            baseFeeLabel: "Base Fee",
            distanceCostLabel: "Distance",
            discountLabel: "Discount",
            netLabel: "Net",
            vatLabel: "VAT",
            totalLabel: "Total",
            resetLabel: "Reset",
            manualPlaceholder: "Enter city",
            manualSubmit: "Calculate",
        },
        textStyles = {
            buttonFont: { fontSize: "15px", variant: "Medium", letterSpacing: "-0.02em", lineHeight: "1.3em" },
            statusFont: { fontSize: "15px", variant: "Medium", letterSpacing: "-0.02em", lineHeight: "1.3em" },
            labelFont: { fontSize: "10px", variant: "Bold", letterSpacing: "0.12em", lineHeight: "1em" },
            valueFont: { fontSize: "16px", variant: "Bold", letterSpacing: "-0.02em", lineHeight: "1.2em" },
            breakdownFont: { fontSize: "15px", variant: "Medium", letterSpacing: "0em", lineHeight: "1.3em" },
            headerFont: { fontSize: "16px", variant: "Bold", letterSpacing: "0em", lineHeight: "1.3em" },
        },
        canvasPreview = {
            enabled: true,
            city: "Philadelphia",
            distanceKm: 156,
            durationMin: 110,
        },
        // localization is merged with defaults further below
        initialButtonText,
        pulseColor,
        loadingText,
        errorText,
        deniedText,
        gap = 8,
        style,
        mapStyle = "grayscale",
        successTemplate,
        routeColor,
        lineWidth = 3,
    } = props

    const localizationDefaults: Localization = useMemo(
        () => ({
            destinationLabel: "DESTINATION",
            distanceLabel: "DISTANCE",
            durationLabel: "DURATION",
            statusLabel: "STATUS",
            baseFeeLabel: "Base Fee",
            distanceCostLabel: "Distance",
            discountLabel: "Discount",
            netLabel: "Net",
            vatLabel: "VAT",
            totalLabel: "Total",
            resetLabel: "Reset",
            manualPlaceholder: "Enter city",
            manualSubmit: "Calculate",
        }),
        []
    )

    const localization: Localization = useMemo(() => {
        const incoming = props.localization
        const fromText: Partial<Localization> = {
            destinationLabel: text?.destinationLabel,
            distanceLabel: text?.distanceLabel,
            durationLabel: text?.durationLabel,
            statusLabel: text?.statusLabel,
            baseFeeLabel: text?.baseFeeLabel,
            distanceCostLabel: text?.distanceCostLabel,
            discountLabel: text?.discountLabel,
            netLabel: text?.netLabel,
            vatLabel: text?.vatLabel,
            totalLabel: text?.totalLabel,
            resetLabel: text?.resetLabel,
            manualPlaceholder: text?.manualPlaceholder,
            manualSubmit: text?.manualSubmit,
        }
        return { ...localizationDefaults, ...(fromText || {}), ...(incoming || {}) }
    }, [props.localization, localizationDefaults, text])

    const derivedInitialButtonText = initialButtonText || text?.buttonLabel || "Calculate travel price"
    const derivedLoadingText = loadingText || text?.loadingText || "Planning Route…"
    const derivedErrorText = errorText || text?.errorText || "Unable to calculate."
    const derivedDeniedText = deniedText || text?.deniedText || "Location access denied. Please enter your city manually"

    const isPreviewMode = canvasPreview.enabled

    const [status, setStatus] = useState<Status>("idle")
    const [city, setCity] = useState<string>("")
    const [distanceKm, setDistanceKm] = useState<number | null>(null)
    const [totalPrice, setTotalPrice] = useState<number | null>(null)
    const [subtotalNet, setSubtotalNet] = useState<number | null>(null)
    const [vatAmount, setVatAmount] = useState<number | null>(null)
    const [effectiveRate, setEffectiveRate] = useState<number | null>(null)
    const [appliedTierLabel, setAppliedTierLabel] = useState<string>("")
    const [durationSec, setDurationSec] = useState<number | null>(null)
    const [debugDetail, setDebugDetail] = useState<string>("")
    const [manualCity, setManualCity] = useState<string>("")
    const [userCoords, setUserCoords] = useState<Coords | null>(null)
    const [originCoords, setOriginCoords] = useState<Coords | null>(null)
    const [routeGeom, setRouteGeom] = useState<RouteGeometry | null>(null)

    const mapHostRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const originMarkerRef = useRef<any>(null)
    const routeLayerRef = useRef<any>(null)

    const locale = useMemo(() => {
        if (typeof navigator !== "undefined" && navigator.language) return navigator.language
        return "en-US"
    }, [])

    const formatMoney = useCallback(
        (value: number) => {
            const formatted = new Intl.NumberFormat(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value)
            const cur = (pricing?.currency ?? "").trim()
            return cur ? `${formatted} ${cur}` : formatted
        },
        [locale, pricing?.currency]
    )

    const formatKm = useCallback(
        (value: number) => {
            const formatted = new Intl.NumberFormat(locale, {
                minimumFractionDigits: value < 10 ? 1 : 0,
                maximumFractionDigits: value < 10 ? 1 : 0,
            }).format(value)
            return `${formatted} km`
        },
        [locale]
    )

    const safeSessionGet = useCallback((key: string) => {
        if (typeof window === "undefined") return null
        try {
            return window.sessionStorage.getItem(key)
        } catch {
            return null
        }
    }, [])

    const safeSessionSet = useCallback((key: string, value: string) => {
        if (typeof window === "undefined") return
        try {
            window.sessionStorage.setItem(key, value)
        } catch {
            // ignore
        }
    }, [])

    const cacheKeyBase = useMemo(() => {
        const addr = (route?.myAddress ?? "").trim()
        const mode = route?.travelMode ?? "driving"
        const rate = pricing?.standardRate ?? 0
        const base = pricing?.baseFee ?? 0
        const vat = pricing?.vatRate ?? 0
        const tierSig = (() => {
            try {
                return encodeURIComponent(JSON.stringify((tiers ?? []).map((t) => ({
                    m: typeof t?.minDistanceKm === "number" ? t.minDistanceKm : 0,
                    r: typeof t?.ratePerKm === "number" ? t.ratePerKm : rate,
                }))))
            } catch {
                return ""
            }
        })()
        return `framer:travelCost:v2:${encodeURIComponent(addr)}:${mode}:${rate}:${base}:${vat}:${tierSig}`
    }, [route?.myAddress, route?.travelMode, pricing?.standardRate, pricing?.baseFee, pricing?.vatRate, tiers])

    const buildCacheKey = useCallback(
        (user: Coords) => {
            // Round to reduce cache fragmentation while staying accurate enough
            const lat = Math.round(user.lat * 1000) / 1000
            const lon = Math.round(user.lon * 1000) / 1000
            return `${cacheKeyBase}:${lat},${lon}`
        },
        [cacheKeyBase]
    )

    const parseNumber = (n: any) => (typeof n === "number" && isFinite(n) ? n : null)

    const fetchJson = useCallback(async (url: string, timeoutMs: number) => {
        if (typeof AbortController === "undefined") {
            const res = await fetch(url)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json()
        }
        const controller = new AbortController()
        const id = (typeof window !== "undefined"
            ? window.setTimeout(() => controller.abort(), timeoutMs)
            : 0) as unknown as number
        try {
            const res = await fetch(url, { signal: controller.signal })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return await res.json()
        } finally {
            if (typeof window !== "undefined") window.clearTimeout(id)
        }
    }, [])

    const getUserLocation = useCallback(async (): Promise<{ coords: Coords; city?: string; source: "geolocation"; denied?: boolean }> => {
        if (typeof window === "undefined" || !(typeof navigator !== "undefined" && "geolocation" in navigator) || !navigator.geolocation) {
            throw new Error("Geolocation is not available.")
        }

        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 2 * 60 * 1000,
                })
            })

            const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude }

            // Best-effort reverse geocode to city
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
                    coords.lat
                )}&lon=${encodeURIComponent(coords.lon)}&email=hello@framer.com`
                const data = await fetchJson(url, 8000)
                const addr = data?.address
                const city =
                    addr?.city ||
                    addr?.town ||
                    addr?.village ||
                    addr?.municipality ||
                    addr?.county ||
                    data?.name
                return { coords, city, source: "geolocation" }
            } catch {
                return { coords, source: "geolocation" }
            }
        } catch (e: any) {
            const isSecureOriginIssue =
                (typeof window !== "undefined" && "isSecureContext" in window && !(window as any).isSecureContext) ||
                /secure origin|secure context|Only secure origins are allowed/i.test(String(e?.message || ""))
            if (isSecureOriginIssue) throw new Error("Geolocation requires HTTPS")

            const code = e?.code
            const denied = code === 1 // PERMISSION_DENIED
            if (denied) return { coords: { lat: 0, lon: 0 }, source: "geolocation", denied: true }
            throw e
        }
    }, [fetchJson])

    const geocodeAddress = useCallback(
        async (address: string): Promise<Coords> => {
            const q = address.trim()
            if (!q) throw new Error("Missing origin address.")

            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}&email=hello@framer.com`
            const results = await fetchJson(url, 10000)
            const first = Array.isArray(results) ? results[0] : null
            const lat = first ? Number(first.lat) : NaN
            const lon = first ? Number(first.lon) : NaN
            if (!isFinite(lat) || !isFinite(lon)) throw new Error("Unable to geocode origin address.")
            return { lat, lon }
        },
        [fetchJson]
    )

    const osrmProfile = useMemo(() => {
        const mode = route?.travelMode ?? "driving"
        return mode === "walking" ? "walking" : "driving"
    }, [route?.travelMode])

    const computeRoute = useCallback(
        async (origin: Coords, user: Coords): Promise<{ km: number; durationSec: number; geometry: RouteGeometry }> => {
            const haversineKm = (a: Coords, b: Coords) => {
                const toRad = (d: number) => (d * Math.PI) / 180
                const R = 6371
                const dLat = toRad(b.lat - a.lat)
                const dLon = toRad(b.lon - a.lon)
                const lat1 = toRad(a.lat)
                const lat2 = toRad(b.lat)
                const h =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
                return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
            }

            try {
                // OSRM expects lon,lat
                const base = "https://router.project-osrm.org"
                const url = `${base}/route/v1/${osrmProfile}/${origin.lon},${origin.lat};${user.lon},${user.lat}?overview=full&geometries=geojson&alternatives=false&steps=false&annotations=false`
                const data = await fetchJson(url, 12000)
                const route0 = data?.routes?.[0]
                const meters = route0?.distance
                const seconds = route0?.duration
                const geom = route0?.geometry
                const m = parseNumber(meters)
                const s = parseNumber(seconds)
                const coords = geom?.coordinates
                const okCoords =
                    Array.isArray(coords) &&
                    coords.length > 1 &&
                    coords.every((p: any) => Array.isArray(p) && isFinite(Number(p[0])) && isFinite(Number(p[1])))
                if (m == null || s == null || !okCoords) throw new Error("Unable to compute route.")
                return {
                    km: Math.max(0, m / 1000),
                    durationSec: Math.max(0, s),
                    geometry: { type: "LineString", coordinates: coords as [number, number][] },
                }
            } catch {
                const km = Math.max(0, haversineKm(origin, user))
                const speedKmh = osrmProfile === "walking" ? 5 : 60
                const durationSec = Math.max(0, (km / Math.max(1, speedKmh)) * 3600)
                return {
                    km,
                    durationSec,
                    geometry: { type: "LineString", coordinates: [[origin.lon, origin.lat], [user.lon, user.lat]] },
                }
            }
        },
        [fetchJson, osrmProfile]
    )

    const selectRateForKm = useCallback(
        (km: number) => {
            const baseRate = typeof pricing?.standardRate === "number" ? pricing.standardRate : 0
            const list = Array.isArray(tiers) ? tiers : []
            const sorted = list
                .map((t) => ({
                    minDistanceKm: typeof t?.minDistanceKm === "number" ? t.minDistanceKm : 0,
                    ratePerKm: typeof t?.ratePerKm === "number" ? t.ratePerKm : baseRate,
                }))
                .filter((t) => isFinite(t.minDistanceKm) && isFinite(t.ratePerKm) && t.minDistanceKm >= 0)
                .sort((a, b) => a.minDistanceKm - b.minDistanceKm)

            let applied = { minDistanceKm: 0, ratePerKm: baseRate }
            for (const t of sorted) {
                if (km >= t.minDistanceKm) applied = t
            }
            return applied
        },
        [pricing?.standardRate, tiers]
    )

    const computeTotals = useCallback(
        (km: number) => {
            const base = typeof pricing?.baseFee === "number" ? pricing.baseFee : 0
            const vatRate = typeof pricing?.vatRate === "number" ? pricing.vatRate : 0
            const standardRate = typeof pricing?.standardRate === "number" ? pricing.standardRate : 0
            const applied = selectRateForKm(km)
            const rate = Math.max(0, applied.ratePerKm)
            const kmClamped = Math.max(0, km)
            const baseFee = Math.max(0, base)
            const distanceCost = kmClamped * rate
            const net = baseFee + distanceCost
            const vat = (net * Math.max(0, vatRate)) / 100
            const total = net + vat
            const hasTier = applied.minDistanceKm > 0 && isFinite(applied.minDistanceKm)
            const tierLabel = hasTier ? `Tier from ${applied.minDistanceKm} km` : ""
            const discountAmount = kmClamped * Math.max(0, standardRate - rate)
            return { total, net, vat, rate, distanceCost, baseFee, tierLabel, discountAmount, standardRate }
        },
        [pricing?.baseFee, pricing?.vatRate, pricing?.standardRate, selectRateForKm]
    )

    const buildText = useCallback(
        (template: string, cityValue: string, kmValue: number, totalValue: number) => {
            const replacements: Record<string, string> = {
                "{city}": cityValue || "your area",
                "{distanceKm}": `~${formatKm(kmValue)}`,
                "{totalPrice}": formatMoney(totalValue),
                "{currency}": (pricing?.currency ?? "").trim(),
                "{mode}": (route?.travelMode ?? "driving") === "walking" ? "Walking" : "Driving",
            }
            let out = template || ""
            for (const k of Object.keys(replacements)) out = out.split(k).join(replacements[k])
            return out
        },
        [formatKm, formatMoney, pricing?.currency, route?.travelMode]
    )

    const reset = useCallback(() => {
        startTransition(() => {
            setStatus("idle")
            setCity("")
            setDistanceKm(null)
            setTotalPrice(null)
            setDurationSec(null)
            setDebugDetail("")
            setUserCoords(null)
            setOriginCoords(null)
            setRouteGeom(null)
        })
    }, [])

    const loadLeaflet = useCallback(async () => {
        if (typeof window === "undefined") return null
        const w = window as any
        if (w.L) return w.L

        // CSS
        const cssId = "framer-leaflet-css"
        if (!document.getElementById(cssId)) {
            const link = document.createElement("link")
            link.id = cssId
            link.rel = "stylesheet"
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            link.crossOrigin = ""
            document.head.appendChild(link)
        }

        // JS
        const jsId = "framer-leaflet-js"
        const existing = document.getElementById(jsId) as HTMLScriptElement | null
        if (existing) {
            await new Promise<void>((resolve) => {
                if ((window as any).L) return resolve()
                existing.addEventListener("load", () => resolve(), { once: true })
                existing.addEventListener("error", () => resolve(), { once: true })
            })
            return (window as any).L || null
        }

        await new Promise<void>((resolve) => {
            const script = document.createElement("script")
            script.id = jsId
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            script.async = true
            script.defer = true
            script.crossOrigin = ""
            script.onload = () => resolve()
            script.onerror = () => resolve()
            document.body.appendChild(script)
        })

        return (window as any).L || null
    }, [])

    const tileConfig = useMemo(() => {
        const theme = (visuals?.mapTheme ?? (mapStyle === "dark" ? "dark" : mapStyle === "grayscale" ? "silver" : "light")) as Visuals["mapTheme"]
        if (theme === "dark") {
            return {
                url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                attribution: "© OpenStreetMap © CARTO",
            }
        }
        if (theme === "silver") {
            return {
                url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
                attribution: "© OpenStreetMap © CARTO",
            }
        }
        return {
            url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            attribution: "© OpenStreetMap © CARTO",
        }
    }, [mapStyle, visuals?.mapTheme])

    const computeFor = useCallback(
        async (userCoords: Coords, userCity: string, source: string) => {
            const addr = (route?.myAddress ?? "").trim()
            if (!addr) throw new Error("Missing origin address.")

            const key = buildCacheKey(userCoords)
            const cached = safeSessionGet(key)
            if (cached) {
                try {
                    const parsed = JSON.parse(cached)
                    const km = parseNumber(parsed?.distanceKm)
                    const total = parseNumber(parsed?.totalPrice)
                    const net = parseNumber(parsed?.subtotalNet)
                    const vat = parseNumber(parsed?.vatAmount)
                    const rate = parseNumber(parsed?.effectiveRate)
                    const dur = parseNumber(parsed?.durationSec)
                    const geom = parsed?.geometry
                    const c = typeof parsed?.city === "string" ? parsed.city : userCity || ""
                    const okGeom =
                        geom?.type === "LineString" &&
                        Array.isArray(geom?.coordinates) &&
                        geom.coordinates.length > 1
                    if (km != null && total != null && dur != null && okGeom) {
                        const cachedTierLabel = typeof parsed?.appliedTierLabel === "string" ? parsed.appliedTierLabel : ""
                        startTransition(() => {
                            setCity(c)
                            setDistanceKm(km)
                            setTotalPrice(total)
                            setSubtotalNet(net)
                            setVatAmount(vat)
                            setEffectiveRate(rate)
                            setAppliedTierLabel(cachedTierLabel)
                            setDurationSec(dur)
                            setUserCoords(userCoords)
                            setOriginCoords(parsed?.originCoords || null)
                            setRouteGeom(geom)
                            setStatus("ready")
                            setDebugDetail(`Cached (${source}).`)
                        })
                        return
                    }
                } catch {
                    // ignore
                }
            }

            const originCoords = await geocodeAddress(addr)
            const routeRes = await computeRoute(originCoords, userCoords)
            const totals = computeTotals(routeRes.km)

            const cityFinal = userCity || ""
            safeSessionSet(
                key,
                JSON.stringify({
                    distanceKm: routeRes.km,
                    durationSec: routeRes.durationSec,
                    totalPrice: totals.total,
                    subtotalNet: totals.net,
                    vatAmount: totals.vat,
                    effectiveRate: totals.rate,
                    appliedTierLabel: totals.tierLabel,
                    city: cityFinal,
                    originCoords,
                    geometry: routeRes.geometry,
                    ts: Date.now(),
                    mode: route?.travelMode ?? "driving",
                })
            )

            startTransition(() => {
                setCity(cityFinal)
                setDistanceKm(routeRes.km)
                setTotalPrice(totals.total)
                setSubtotalNet(totals.net)
                setVatAmount(totals.vat)
                setEffectiveRate(totals.rate)
                setAppliedTierLabel(totals.tierLabel)
                setDurationSec(routeRes.durationSec)
                setUserCoords(userCoords)
                setOriginCoords(originCoords)
                setRouteGeom(routeRes.geometry)
                setStatus("ready")
                setDebugDetail(`Fresh (${source}).`)
            })
        },
        [
            route?.myAddress,
            route?.travelMode,
            buildCacheKey,
            safeSessionGet,
            geocodeAddress,
            computeRoute,
            computeTotals,
            safeSessionSet,
        ]
    )

    const handleCalculate = useCallback(async () => {
        if (isStatic) {
            startTransition(() => {
                setStatus("error")
                setDebugDetail("Static renderer: calculation disabled.")
            })
            return
        }

        startTransition(() => {
            setStatus("request")
            setDebugDetail("")
        })

        try {
            const res = await getUserLocation()
            if (res.denied) {
                startTransition(() => {
                    setStatus("denied")
                    setDebugDetail("User denied geolocation.")
                })
                return
            }

            startTransition(() => setStatus("loading"))
            await computeFor(res.coords, res.city || "", res.source)
        } catch (e: any) {
            startTransition(() => {
                setStatus("error")
                setDebugDetail(typeof e?.message === "string" ? e.message : "Unknown error.")
            })
        }
    }, [computeFor, getUserLocation, isStatic])

    const handleManualSubmit = useCallback(async () => {
        const q = (manualCity ?? "").trim()
        if (!q) return

        startTransition(() => {
            setStatus("loading")
            setDebugDetail("")
        })

        try {
            const userCoords = await geocodeAddress(q)
            await computeFor(userCoords, q, "manual")
        } catch (e: any) {
            startTransition(() => {
                setStatus("error")
                setDebugDetail(typeof e?.message === "string" ? e.message : "Unknown error.")
            })
        }
    }, [computeFor, geocodeAddress, manualCity])

    const icon = useMemo(() => {
        const size = 10
        const pulseEnabled = status === "loading" || status === "request" ? true : !!visuals?.iconPulse
        const color = pulseColor ?? visuals?.accentColor ?? "#22CC66"

        return (
            <span
                aria-hidden="true"
                style={{
                    width: size,
                    height: size,
                    position: "relative",
                    display: "inline-block",
                    flex: "0 0 auto",
                }}
            >
                <motion.span
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 999,
                        background: color,
                    }}
                    animate={pulseEnabled ? { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] } : { scale: 1, opacity: 1 }}
                    transition={pulseEnabled ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                />
                <motion.span
                    style={{
                        position: "absolute",
                        inset: -6,
                        borderRadius: 999,
                        background: color,
                        opacity: 0.12,
                        filter: "blur(0px)",
                    }}
                    animate={pulseEnabled ? { scale: [1, 1.9], opacity: [0.28, 0] } : { scale: 1, opacity: 0 }}
                    transition={pulseEnabled ? { duration: 1.6, repeat: Infinity, ease: "easeOut" } : { duration: 0.2 }}
                />
            </span>
        )
    }, [status, visuals?.iconPulse, visuals?.accentColor, pulseColor])

    const previewData = useMemo(() => {
        if (!isPreviewMode) return null
        const km = Math.max(0, Number(canvasPreview.distanceKm ?? 0))
        const mins = Math.max(0, Number(canvasPreview.durationMin ?? 0))
        const totals = computeTotals(km)
        return {
            city: String(canvasPreview.city ?? "") || "New York",
            distanceKm: km,
            durationSec: mins * 60,
            totalPrice: totals.total,
            subtotalNet: totals.net,
            vatAmount: totals.vat,
            effectiveRate: totals.rate,
            appliedTierLabel: totals.tierLabel,
        }
    }, [isPreviewMode, canvasPreview.distanceKm, canvasPreview.durationMin, canvasPreview.city, computeTotals])

    const statusDisplay: Status = previewData ? "ready" : status
    const cityDisplay = previewData ? previewData.city : city
    const distanceKmDisplay = previewData ? previewData.distanceKm : distanceKm
    const totalPriceDisplay = previewData ? previewData.totalPrice : totalPrice
    const subtotalNetDisplay = previewData ? previewData.subtotalNet : subtotalNet
    const vatAmountDisplay = previewData ? previewData.vatAmount : vatAmount
    const effectiveRateDisplay = previewData ? previewData.effectiveRate : effectiveRate
    const appliedTierLabelDisplay = previewData ? previewData.appliedTierLabel : appliedTierLabel
    const durationSecDisplay = previewData ? previewData.durationSec : durationSec

    const timeStr = useMemo(() => {
        if (durationSecDisplay == null) return "—"
        const totalSec = Math.max(0, Number(durationSecDisplay))
        const totalMin = Math.round(totalSec / 60)
        if (!isFinite(totalMin)) return "—"
        if (totalMin < 60) return `${totalMin} min`
        const h = Math.floor(totalMin / 60)
        const m = totalMin % 60
        return m > 0 ? `${h}h ${m}m` : `${h}h`
    }, [durationSecDisplay])

    const contentText = useMemo(() => {
        if (statusDisplay === "ready" && distanceKmDisplay != null && totalPriceDisplay != null) {
            const template =
                (successTemplate || visuals?.textTemplate) ??
                "📍 Travel to {city} ({distanceKm}): {totalPrice}"
            return buildText(template, cityDisplay, distanceKmDisplay, totalPriceDisplay)
        }
        if (statusDisplay === "denied") return derivedDeniedText
        if (statusDisplay === "error") return derivedErrorText
        return derivedLoadingText
    }, [
        statusDisplay,
        distanceKmDisplay,
        totalPriceDisplay,
        visuals?.textTemplate,
        successTemplate,
        buildText,
        cityDisplay,
        derivedLoadingText,
        derivedErrorText,
        derivedDeniedText,
    ])

    const showBreakdown = !!visuals?.showBreakdown

    const isFixedWidth = !!(style && style.width === "100%")
    const isFixedHeight = !!(style && style.height === "100%")

    const panelRadius = Math.max(0, visuals?.borderRadius ?? 24)

    const panelStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        borderRadius: panelRadius,
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04), 0 8px 10px -6px rgba(0,0,0,0.04)",
        backdropFilter: "blur(12px)",
        color: "#000000",
    }

    const variants = {
        enter: { opacity: 0, scale: 0.98 },
        center: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
    }

    useEffect(() => {
        if (isStatic) return
        if (status !== "ready") return
        if (isPreviewMode) return
        if (!userCoords) return
        if (!originCoords) return
        if (!routeGeom) return
        if (!mapHostRef.current) return

        let alive = true

        ;(async () => {
            const L = await loadLeaflet()
            if (!alive || !L) return

            const el = mapHostRef.current
            if (!el) return

            if (!mapRef.current) {
                mapRef.current = L.map(el, {
                    zoomControl: false,
                    attributionControl: false,
                    dragging: true,
                    scrollWheelZoom: true,
                    doubleClickZoom: true,
                    touchZoom: true,
                })
            }

            const map = mapRef.current

            // Ensure single tile layer by replacing if style changed
            if ((map as any)._framerTileLayer) {
                try {
                    map.removeLayer((map as any)._framerTileLayer)
                } catch {}
                ;(map as any)._framerTileLayer = null
            }

            const tileLayer = L.tileLayer(tileConfig.url, {
                attribution: tileConfig.attribution,
                maxZoom: 20,
                crossOrigin: true,
            })
            tileLayer.addTo(map)
            ;(map as any)._framerTileLayer = tileLayer

            // Markers
            const accent = pulseColor ?? visuals?.accentColor ?? "#22CC66"
            const businessHtml = `<div style=\"width:18px;height:18px;background:rgba(0,0,0,0.85);border:2px solid rgba(255,255,255,0.95);border-radius:999px;box-shadow:0 10px 20px rgba(0,0,0,0.25);\"></div>`
            const userHtml = `<div class=\"framer-user-pin\" style=\"width:18px;height:18px;border-radius:999px;position:relative;\"><div style=\"position:absolute;inset:0;background:${accent};border:2px solid rgba(255,255,255,0.95);border-radius:999px;box-shadow:0 10px 20px rgba(0,0,0,0.25);\"></div><div class=\"framer-user-pulse\" style=\"position:absolute;inset:-10px;border-radius:999px;background:${accent};opacity:0.18;filter:blur(0px);\"></div></div>`

            const businessIcon = L.divIcon({
                className: "framer-leaflet-pin",
                html: businessHtml,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            })
            const userIcon = L.divIcon({
                className: "framer-leaflet-pin",
                html: userHtml,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            })

            if (!originMarkerRef.current) {
                originMarkerRef.current = L.marker([originCoords.lat, originCoords.lon], { icon: businessIcon }).addTo(map)
            } else {
                originMarkerRef.current.setLatLng([originCoords.lat, originCoords.lon])
                originMarkerRef.current.setIcon(businessIcon)
            }

            if (!markerRef.current) {
                markerRef.current = L.marker([userCoords.lat, userCoords.lon], { icon: userIcon }).addTo(map)
            } else {
                markerRef.current.setLatLng([userCoords.lat, userCoords.lon])
                markerRef.current.setIcon(userIcon)
            }

            // Route polyline
            const routeLatLngs = (routeGeom.coordinates || []).map((p) => [p[1], p[0]])
            if (routeLayerRef.current) {
                try {
                    map.removeLayer(routeLayerRef.current)
                } catch {}
                routeLayerRef.current = null
            }

            const stroke = routeColor || accent
            const weight = typeof lineWidth === "number" && isFinite(lineWidth) ? Math.max(1, lineWidth) : 3

            const polyline = L.polyline(routeLatLngs as any, {
                color: stroke,
                weight,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
            }).addTo(map)
            routeLayerRef.current = polyline

            // Best-effort draw animation
            try {
                const path = (polyline as any)._path as SVGPathElement | undefined
                if (path) {
                    const len = path.getTotalLength()
                    path.style.strokeDasharray = `${len}`
                    path.style.strokeDashoffset = `${len}`
                    path.getBoundingClientRect()
                    path.style.transition = "stroke-dashoffset 900ms ease-out"
                    requestAnimationFrame(() => {
                        path.style.strokeDashoffset = "0"
                    })
                }
            } catch {}

            const bounds = L.latLngBounds([])
            bounds.extend([originCoords.lat, originCoords.lon])
            bounds.extend([userCoords.lat, userCoords.lon])
            try {
                polyline.getLatLngs().forEach((ll: any) => bounds.extend(ll))
            } catch {}

            map.fitBounds(bounds, {
                animate: false,
                padding: [18, 18],
            })

            // Resize handling
            let ro: ResizeObserver | null = null
            if (typeof ResizeObserver !== "undefined") {
                ro = new ResizeObserver(() => {
                    try {
                        map.invalidateSize({ animate: false })
                    } catch {}
                })
                ro.observe(el)
            }

            return () => {
                if (ro) ro.disconnect()
            }
        })()

        return () => {
            alive = false
        }
    }, [isStatic, status, userCoords, originCoords, routeGeom, loadLeaflet, tileConfig.url, tileConfig.attribution, pulseColor, visuals?.accentColor, routeColor, lineWidth, isPreviewMode])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                ...((isFixedWidth || isFixedHeight) ? {} : { padding: 0 }),
                ...style,
            }}
            aria-live="polite"
        >
            <div style={panelStyle}>
                <AnimatePresence mode="wait">
                    {statusDisplay === "idle" && (
                        <motion.div
                            key="idle"
                            initial={isStatic ? false : "enter"}
                            animate="center"
                            exit="exit"
                            variants={variants}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            style={{ width: "100%", display: "flex", justifyContent: "center" }}
                        >
                            <button
                                type="button"
                                onClick={handleCalculate}
                                style={{
                                    ...(textStyles?.buttonFont ?? visuals?.font ?? {}),
                                    appearance: "none",
                                    border: "1px solid rgba(0,0,0,0.06)",
                                    background: "#FFFFFF",
                                    color: "#000000",
                                    WebkitTextFillColor: "#000000",
                                    textDecoration: "none",
                                    borderRadius: 999,
                                    padding: "12px 16px",
                                    cursor: "pointer",
                                    width: "auto",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                                aria-label={text?.manualPlaceholder || "Calculate travel to my location"}
                            >
                                {text?.buttonLabel || "Calculate travel to my location"}
                            </button>
                        </motion.div>
                    )}

                    {(statusDisplay === "request" || statusDisplay === "loading" || statusDisplay === "ready" || statusDisplay === "denied" || statusDisplay === "error") && (
                        <motion.div
                            key="content"
                            initial={isStatic ? false : "enter"}
                            animate="center"
                            exit="exit"
                            variants={variants}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            {(statusDisplay === "loading" || statusDisplay === "request" || statusDisplay === "error") && (
                                <div
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: Math.max(0, gap ?? 8),
                                    }}
                                >
                                    {statusDisplay === "loading" || statusDisplay === "request" ? icon : <span style={{ width: 10, height: 10 }} aria-hidden="true" />}
                                    <span
                                        style={{
                                            ...(textStyles?.statusFont ?? visuals?.font ?? {}),
                                            minWidth: isFixedWidth ? undefined : "max-content",
                                            whiteSpace: "pre-wrap",
                                            opacity: statusDisplay === "error" ? 0.85 : 1,
                                            position: "relative",
                                            flex: 1,
                                            userSelect: "none",
                                            textDecoration: "none",
                                            color: "inherit",
                                        }}
                                        title={statusDisplay === "error" ? debugDetail : undefined}
                                    >
                                        {contentText}
                                    </span>
                                </div>
                            )}

                            {statusDisplay === "ready" && (userCoords || previewData) && (
                                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
                                    <motion.div
                                        initial={isStatic ? false : { opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.06 }}
                                        style={{
                                            width: "100%",
                                            height: Math.max(160, visuals?.mapHeight ?? 240),
                                            borderRadius: Math.max(0, visuals?.borderRadius ?? 24),
                                            overflow: "hidden",
                                            border: "1px solid rgba(0,0,0,0.05)",
                                            background: "rgba(0,0,0,0.02)",
                                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04), 0 8px 10px -6px rgba(0,0,0,0.04)",
                                        }}
                                        aria-label="Map"
                                    >
                                        {isPreviewMode ? (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    background: "#F5F5F5",
                                                    color: "#999",
                                                }}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="48"
                                                    height="48"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    style={{ opacity: 0.5 }}
                                                >
                                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                                    <circle cx="12" cy="10" r="3" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div
                                                ref={mapHostRef}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                }}
                                            />
                                        )}
                                    </motion.div>

                                    <motion.div
                                        initial={isStatic ? false : { opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.06 }}
                                        style={{
                                            width: "100%",
                                            display: "grid",
                                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                            gap: 10,
                                        }}
                                    >
                                        {(() => {
                                            const km = Math.max(0, distanceKmDisplay ?? 0)
                                            const rate = Math.max(0, effectiveRateDisplay ?? (pricing?.standardRate ?? 0))
                                            const baseFee = Math.max(0, pricing?.baseFee ?? 0)
                                            const distCost = km * rate
                                            const net = subtotalNetDisplay ?? baseFee + distCost
                                            const vatRate = Math.max(0, pricing?.vatRate ?? 0)
                                            const vat = vatAmountDisplay ?? (net * vatRate) / 100
                                            const total = totalPriceDisplay ?? net + vat
                                            const standardRate = Math.max(0, pricing?.standardRate ?? 0)
                                            const discount = Math.max(0, km * (standardRate - rate))
                                            const tierLabel = appliedTierLabelDisplay
                                            const showDiscountLine = tierLabel && isFinite(discount) && discount > 0.005
                                            return (
                                                <>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                        <div style={{ ...(textStyles?.labelFont ?? visuals?.font ?? {}), textTransform: "uppercase", color: "rgba(0,0,0,0.45)" }}>
                                                            {text.destinationLabel || "DESTINATION"}
                                                        </div>
                                                        <div style={{ ...(textStyles?.valueFont ?? visuals?.font ?? {}), color: "#000", userSelect: "none", textDecoration: "none" }}>
                                                            {cityDisplay || "Your area"}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                        <div style={{ ...(textStyles?.labelFont ?? visuals?.font ?? {}), textTransform: "uppercase", color: "rgba(0,0,0,0.45)" }}>
                                                            {text.distanceLabel || "DISTANCE"}
                                                        </div>
                                                        <div style={{ ...(textStyles?.valueFont ?? visuals?.font ?? {}), color: "#000", userSelect: "none", textDecoration: "none" }}>
                                                            {formatKm(km)}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                        <div style={{ ...(textStyles?.labelFont ?? visuals?.font ?? {}), textTransform: "uppercase", color: "rgba(0,0,0,0.45)" }}>
                                                            {text.durationLabel || "DURATION"}
                                                        </div>
                                                        <div style={{ ...(textStyles?.valueFont ?? visuals?.font ?? {}), color: "#000", userSelect: "none", textDecoration: "none" }}>
                                                            {timeStr}
                                                        </div>
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </motion.div>

                                    <AnimatePresence initial={isStatic ? false : false}>
                                        {showBreakdown && distanceKmDisplay != null && totalPriceDisplay != null && subtotalNetDisplay != null && vatAmountDisplay != null && (
                                            <motion.div
                                                key="breakdown"
                                                initial={isStatic ? false : "hidden"}
                                                animate="show"
                                                exit="hidden"
                                                variants={{
                                                    hidden: { opacity: 0, y: -10, filter: "blur(6px)" },
                                                    show: {
                                                        opacity: 1,
                                                        y: 0,
                                                        filter: "blur(0px)",
                                                        transition: isStatic
                                                            ? undefined
                                                            : {
                                                                  duration: 0.25,
                                                                  ease: "easeOut",
                                                                  staggerChildren: 0.05,
                                                                  staggerDirection: -1,
                                                              },
                                                    },
                                                }}
                                                style={{
                                                    ...(textStyles?.breakdownFont ?? visuals?.font ?? {}),
                                                    width: "100%",
                                                    borderRadius: Math.max(0, visuals?.borderRadius ?? 24),
                                                    border: "1px solid rgba(0,0,0,0.05)",
                                                    background: "rgba(255,255,255,0.88)",
                                                    padding: 24,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 12,
                                                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04), 0 8px 10px -6px rgba(0,0,0,0.04)",
                                                }}
                                            >
                                                {(() => {
                                                    const km = Math.max(0, distanceKmDisplay ?? 0)
                                                    const rate = Math.max(0, effectiveRateDisplay ?? (pricing?.standardRate ?? 0))
                                                    const baseFee = Math.max(0, pricing?.baseFee ?? 0)
                                                    const distCost = km * rate
                                                    const net = subtotalNetDisplay ?? baseFee + distCost
                                                    const vatRate = Math.max(0, pricing?.vatRate ?? 0)
                                                    const vat = vatAmountDisplay ?? (net * vatRate) / 100
                                                    const total = totalPriceDisplay ?? net + vat
                                                    const standardRate = Math.max(0, pricing?.standardRate ?? 0)
                                                    const discount = Math.max(0, km * (standardRate - rate))
                                                    const tierLabel = appliedTierLabelDisplay
                                                    const showDiscountLine = tierLabel && isFinite(discount) && discount > 0.005
                                                    return (
                                                        <>
                                                            <motion.div
                                                                initial={isStatic ? false : undefined}
                                                                variants={{
                                                                    hidden: { opacity: 0, y: 6, filter: "blur(6px)" },
                                                                    show: { opacity: 1, y: 0, filter: "blur(0px)" },
                                                                }}
                                                                style={{ display: "flex", justifyContent: "space-between", gap: 12, ...(textStyles?.breakdownFont ?? visuals?.font ?? {}) }}
                                                            >
                                                                <span>{text.baseFeeLabel || "Base Fee"}</span>
                                                                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(baseFee)}</span>
                                                            </motion.div>
                                                            <motion.div
                                                                initial={isStatic ? false : undefined}
                                                                variants={{
                                                                    hidden: { opacity: 0, y: 6, filter: "blur(6px)" },
                                                                    show: { opacity: 1, y: 0, filter: "blur(0px)" },
                                                                }}
                                                                style={{ display: "flex", justifyContent: "space-between", gap: 12, ...(textStyles?.breakdownFont ?? visuals?.font ?? {}) }}
                                                            >
                                                                <span>{text.distanceCostLabel || "Distance"} ({formatKm(km)} × {formatMoney(rate)})</span>
                                                                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(distCost)}</span>
                                                            </motion.div>
                                                            {showDiscountLine && (
                                                                <motion.div
                                                                    initial={isStatic ? false : undefined}
                                                                    variants={{
                                                                        hidden: { opacity: 0, y: 6, filter: "blur(6px)" },
                                                                        show: { opacity: 1, y: 0, filter: "blur(0px)" },
                                                                    }}
                                                                    style={{ display: "flex", justifyContent: "space-between", gap: 12, opacity: 0.95, color: visuals?.accentColor ?? "#22CC66", ...(textStyles?.breakdownFont ?? visuals?.font ?? {}) }}
                                                                >
                                                                    <span>{tierLabel} ({text.discountLabel || "Discount"})</span>
                                                                    <span style={{ fontVariantNumeric: "tabular-nums" }}>-{formatMoney(discount)}</span>
                                                                </motion.div>
                                                            )}
                                                            <motion.div
                                                                initial={isStatic ? false : undefined}
                                                                variants={{
                                                                    hidden: { opacity: 0 },
                                                                    show: { opacity: 1 },
                                                                }}
                                                                style={{ height: 1, background: "rgba(0,0,0,0.03)" }}
                                                            />
                                                            <motion.div
                                                                initial={isStatic ? false : undefined}
                                                                variants={{
                                                                    hidden: { opacity: 0, y: 6, filter: "blur(6px)" },
                                                                    show: { opacity: 1, y: 0, filter: "blur(0px)" },
                                                                }}
                                                                style={{ display: "flex", justifyContent: "space-between", gap: 12, ...(textStyles?.headerFont ?? visuals?.font ?? {}) }}
                                                            >
                                                                <span>{text.netLabel || "Net"}</span>
                                                                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(net)}</span>
                                                            </motion.div>
                                                            {vatRate > 0 && (
                                                                <motion.div
                                                                    initial={isStatic ? false : undefined}
                                                                    variants={{
                                                                        hidden: { opacity: 0, y: 6, filter: "blur(6px)" },
                                                                        show: { opacity: 1, y: 0, filter: "blur(0px)" },
                                                                    }}
                                                                    style={{ display: "flex", justifyContent: "space-between", gap: 12, ...(textStyles?.breakdownFont ?? visuals?.font ?? {}) }}
                                                                >
                                                                    <span>{text.vatLabel || "VAT"} ({vatRate}%)</span>
                                                                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(vat)}</span>
                                                                </motion.div>
                                                            )}
                                                            <motion.div
                                                                initial={isStatic ? false : undefined}
                                                                variants={{
                                                                    hidden: { opacity: 0 },
                                                                    show: { opacity: 1 },
                                                                }}
                                                                style={{ height: 1, background: "rgba(0,0,0,0.03)" }}
                                                            />
                                                            <motion.div
                                                                initial={isStatic ? false : undefined}
                                                                variants={{
                                                                    hidden: { opacity: 0, y: 6, filter: "blur(6px)" },
                                                                    show: { opacity: 1, y: 0, filter: "blur(0px)" },
                                                                }}
                                                                style={{ display: "flex", justifyContent: "space-between", gap: 12, ...(textStyles?.headerFont ?? visuals?.font ?? {}) }}
                                                            >
                                                                <span>{text.totalLabel || "Total"}</span>
                                                                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(total)}</span>
                                                            </motion.div>
                                                        </>
                                                    )
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {statusDisplay === "denied" && (
                    <div
                        style={{
                            width: "100%",
                            marginTop: 10,
                            display: "flex",
                            gap: 8,
                        }}
                    >
                        <input
                            value={manualCity}
                            onChange={(e) => {
                                const v = e.currentTarget.value
                                startTransition(() => setManualCity(v))
                            }}
                            placeholder={text?.manualPlaceholder || "Enter city"}
                            aria-label={text?.manualPlaceholder || "Enter your city"}
                            style={{
                                ...(textStyles?.buttonFont ?? visuals?.font ?? {}),
                                flex: 1,
                                borderRadius: 10,
                                border: "1px solid rgba(0,0,0,0.12)",
                                padding: "10px 12px",
                                outline: "none",
                                background: "rgba(255,255,255,0.9)",
                                color: "inherit",
                                textDecoration: "none",
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleManualSubmit}
                            style={{
                                ...(textStyles?.buttonFont ?? visuals?.font ?? {}),
                                appearance: "none",
                                border: "1px solid rgba(0,0,0,0.10)",
                                background: "#FFFFFF",
                                borderRadius: 10,
                                padding: "10px 12px",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            {text?.manualSubmit || "Calculate"}
                        </button>
                    </div>
                )}
            </div>

            <style>
                {`
                a[href^="tel"], a[href^="sms"], a[href^="mailto"] { text-decoration: none; color: inherit; pointer-events: none; }

                @keyframes globalPulse {
                    0% { transform: scale(0.9); opacity: 0.35; filter: blur(0px); }
                    60% { transform: scale(1.7); opacity: 0; filter: blur(0px); }
                    100% { transform: scale(1.7); opacity: 0; filter: blur(0px); }
                }
                .framer-user-pulse {
                    animation: globalPulse 1.6s ease-out infinite;
                    filter: blur(0px);
                }
            `}
            </style>
        </div>
    )
}

addPropertyControls(TravelCost, {
    route: {
        type: ControlType.Object,
        title: "📍 Route",
        icon: "object",
        controls: {
            myAddress: {
                type: ControlType.String,
                title: "My Address",
                description: "Your business starting point.",
                defaultValue: "New York, NY",
                placeholder: "e.g. Alexanderplatz, Berlin",
            },
            travelMode: {
                type: ControlType.Enum,
                title: "Travel Mode",
                description: "Switch between car or foot.",
                defaultValue: "driving",
                options: ["driving", "walking"],
                optionTitles: ["Driving", "Walking"],
                displaySegmentedControl: true,
            },
        },
        defaultValue: {
            myAddress: "New York, NY",
            travelMode: "driving",
        },
    },
    pricing: {
        type: ControlType.Object,
        title: "💰 Pricing",
        icon: "object",
        controls: {
            currency: {
                type: ControlType.Enum,
                title: "Currency",
                description: "Used for all prices.",
                defaultValue: "€",
                options: ["€", "$", "£", "Fr.", "¥", "A$", "C$"],
                optionTitles: ["EUR (€)", "USD ($)", "GBP (£)", "CHF (Fr.)", "JPY (¥)", "AUD (A$)", "CAD (C$)"],
            },
            baseFee: {
                type: ControlType.Number,
                title: "Base Fee",
                description: "Always added to the calculation (e.g., call-out fee).",
                defaultValue: 0,
                min: 0,
                max: 500,
                step: 1,
            },
            standardRate: {
                type: ControlType.Number,
                title: "Rate / km",
                description: "Default price per km (before tiered pricing).",
                defaultValue: 0.5,
                min: 0,
                max: 10,
                step: 0.05,
            },
            vatRate: {
                type: ControlType.Number,
                title: "VAT (%)",
                description: "VAT percentage applied to net. Set to 0 to hide VAT line.",
                defaultValue: 19,
                min: 0,
                max: 30,
                step: 0.5,
            },
        },
        defaultValue: {
            currency: "€",
            baseFee: 0,
            standardRate: 0.5,
            vatRate: 19,
        },
    },
    tiers: {
        type: ControlType.Array,
        title: "🧾 Tiers",
        description: "Add distance-based discounts (e.g., >100km). The last tier whose Min KM is <= route distance will apply.",
        control: {
            type: ControlType.Object,
            controls: {
                minDistanceKm: {
                    type: ControlType.Number,
                    title: "Min KM",
                    defaultValue: 0,
                    min: 0,
                    max: 5000,
                    step: 1,
                    unit: "km",
                },
                ratePerKm: {
                    type: ControlType.Number,
                    title: "Rate",
                    defaultValue: 0.5,
                    min: 0,
                    max: 10,
                    step: 0.05,
                },
            },
        },
        defaultValue: [{ minDistanceKm: 100, ratePerKm: 0.4 }],
    },
    visuals: {
        type: ControlType.Object,
        title: "🎨 Visual Style",
        description: "Design and layout settings.",
        icon: "color",
        controls: {
            accentColor: {
                type: ControlType.Color,
                title: "Accent Color",
                description: "Used for route + pins + highlights.",
                defaultValue: "#22CC66",
            },
            mapHeight: {
                type: ControlType.Number,
                title: "Map Height",
                description: "Height of the interactive map area.",
                defaultValue: 240,
                min: 160,
                max: 520,
                step: 10,
                unit: "px",
            },
            showBreakdown: {
                type: ControlType.Boolean,
                title: "Show Breakdown",
                description: "Show an invoice-style breakdown below the map.",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                description: "Corner radius for map + cards.",
                defaultValue: 24,
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
            },
            mapTheme: {
                type: ControlType.Enum,
                title: "Map Theme",
                description: "Minimalist tiles (no API key).",
                defaultValue: "silver",
                options: ["light", "silver", "dark"],
                optionTitles: ["Light", "Silver", "Dark"],
                displaySegmentedControl: true,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                description: "Set the font family, size, and weight.",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "15px",
                    variant: "Medium",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.3em",
                },
            },
        },
        defaultValue: {
            accentColor: "#22CC66",
            mapHeight: 240,
            showBreakdown: true,
            borderRadius: 24,
            mapTheme: "silver",
            font: {
                fontSize: "15px",
                variant: "Medium",
                letterSpacing: "-0.02em",
                lineHeight: "1.3em",
            },
        },
    },
    textStyles: {
        type: ControlType.Object,
        title: "✍️ Text Styles",
        description: "Customize fonts for different text elements.",
        icon: "object",
        controls: {
            buttonFont: {
                type: ControlType.Font,
                title: "Button & Input",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "15px", variant: "Medium", letterSpacing: "-0.02em", lineHeight: "1.3em" },
            },
            statusFont: {
                type: ControlType.Font,
                title: "Status Text",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "15px", variant: "Medium", letterSpacing: "-0.02em", lineHeight: "1.3em" },
            },
            labelFont: {
                type: ControlType.Font,
                title: "Small Labels",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "10px", variant: "Bold", letterSpacing: "0.12em", lineHeight: "1em" },
            },
            valueFont: {
                type: ControlType.Font,
                title: "Large Values",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "16px", variant: "Bold", letterSpacing: "-0.02em", lineHeight: "1.2em" },
            },
            breakdownFont: {
                type: ControlType.Font,
                title: "Breakdown Text",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "15px", variant: "Medium", letterSpacing: "0em", lineHeight: "1.3em" },
            },
            headerFont: {
                type: ControlType.Font,
                title: "Section Headers",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "16px", variant: "Bold", letterSpacing: "0em", lineHeight: "1.3em" },
            },
        },
        defaultValue: {
            buttonFont: { fontSize: "15px", variant: "Medium", letterSpacing: "-0.02em", lineHeight: "1.3em" },
            statusFont: { fontSize: "15px", variant: "Medium", letterSpacing: "-0.02em", lineHeight: "1.3em" },
            labelFont: { fontSize: "10px", variant: "Bold", letterSpacing: "0.12em", lineHeight: "1em" },
            valueFont: { fontSize: "16px", variant: "Bold", letterSpacing: "-0.02em", lineHeight: "1.2em" },
            breakdownFont: { fontSize: "15px", variant: "Medium", letterSpacing: "0em", lineHeight: "1.3em" },
            headerFont: { fontSize: "16px", variant: "Bold", letterSpacing: "0em", lineHeight: "1.3em" },
        },
    },
    text: {
        type: ControlType.Object,
        title: "🏷️ Text",
        description: "All user-facing strings in one place.",
        icon: "object",
        controls: {
            buttonLabel: {
                type: ControlType.String,
                title: "Button Label",
                description: "Primary CTA text shown in Idle state.",
                defaultValue: "Calculate travel price",
            },
            loadingText: {
                type: ControlType.String,
                title: "Loading Text",
                description: "Shown while routing is being calculated.",
                defaultValue: "Planning Route…",
            },
            errorText: {
                type: ControlType.String,
                title: "Error Text",
                description: "Shown if routing/geocoding fails.",
                defaultValue: "Unable to calculate.",
            },
            deniedText: {
                type: ControlType.String,
                title: "Denied Text",
                description: "Shown when the user blocks location access.",
                defaultValue: "Location access denied. Please enter your city manually",
            },
            destinationLabel: { type: ControlType.String, title: "Destination Label", description: "Small caps label above the city.", defaultValue: "DESTINATION" },
            distanceLabel: { type: ControlType.String, title: "Distance Label", description: "Label for distance in the summary grid.", defaultValue: "DISTANCE" },
            durationLabel: { type: ControlType.String, title: "Duration Label", description: "Label for duration in the summary grid.", defaultValue: "DURATION" },
            statusLabel: { type: ControlType.String, title: "Status Label", description: "Label for status in the summary grid.", defaultValue: "STATUS" },
            baseFeeLabel: { type: ControlType.String, title: "Base Fee Label", description: "Breakdown label.", defaultValue: "Base Fee" },
            distanceCostLabel: { type: ControlType.String, title: "Distance Label", description: "Breakdown label.", defaultValue: "Distance" },
            discountLabel: { type: ControlType.String, title: "Discount Label", description: "Breakdown label for savings line.", defaultValue: "Discount" },
            netLabel: { type: ControlType.String, title: "Net Label", description: "Breakdown label for net subtotal.", defaultValue: "Net" },
            vatLabel: { type: ControlType.String, title: "VAT Label", description: "Breakdown label for VAT line.", defaultValue: "VAT" },
            totalLabel: { type: ControlType.String, title: "Total Label", description: "Breakdown label for the hero total.", defaultValue: "Total" },
            resetLabel: { type: ControlType.String, title: "Reset Label", description: "ARIA label for the reset icon button.", defaultValue: "Reset" },
            manualPlaceholder: { type: ControlType.String, title: "Manual Placeholder", description: "Placeholder for manual city input.", defaultValue: "Enter city" },
            manualSubmit: { type: ControlType.String, title: "Manual Submit", description: "Button label for manual city calculation.", defaultValue: "Calculate" },
        },
        defaultValue: {
            buttonLabel: "Calculate travel price",
            loadingText: "Planning Route…",
            errorText: "Unable to calculate.",
            deniedText: "Location access denied. Please enter your city manually",
            destinationLabel: "DESTINATION",
            distanceLabel: "DISTANCE",
            durationLabel: "DURATION",
            statusLabel: "STATUS",
            baseFeeLabel: "Base Fee",
            distanceCostLabel: "Distance",
            discountLabel: "Discount",
            netLabel: "Net",
            vatLabel: "VAT",
            totalLabel: "Total",
            resetLabel: "Reset",
            manualPlaceholder: "Enter city",
            manualSubmit: "Calculate",
        },
    },
    canvasPreview: {
        type: ControlType.Object,
        title: "🧪 Canvas Preview",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            city: {
                type: ControlType.String,
                title: "City",
                defaultValue: "Philadelphia",
                hidden: (props) => !props.enabled,
            },
            distanceKm: {
                type: ControlType.Number,
                title: "Distance",
                defaultValue: 156,
                min: 0,
                max: 5000,
                step: 1,
                unit: "km",
                hidden: (props) => !props.enabled,
            },
            durationMin: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 110,
                min: 0,
                max: 2000,
                step: 1,
                unit: "min",
                hidden: (props) => !props.enabled,
            },
        },
        defaultValue: {
            enabled: true,
            city: "Philadelphia",
            distanceKm: 156,
            durationMin: 110,
        },
    },
})