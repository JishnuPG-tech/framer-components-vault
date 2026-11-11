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

import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    animate,
    useReducedMotion,
    useScroll,
    useAnimationFrame,
} from "framer-motion"

// --------------------------- Types & Props ---------------------------
type MotionMode =
    | "Orbit"
    | "Organic"
    | "Lissajous"
    | "Figure8"
    | "Random"
    | "All"

type BlendMode =
    | "normal"
    | "screen"
    | "overlay"
    | "plus-lighter"
    | "multiply"
    | "hard-light"
    | "soft-light"
    | "color-dodge"
    | "color-burn"
    | "difference"
    | "exclusion"
    | "darken"
    | "lighten"
    | "hue"
    | "saturation"
    | "color"
    | "luminosity"

type Quality = "Auto" | "Low" | "Medium" | "High"

type HoverReturnMode = "Instant" | "Smooth" | "Distance"
type HoverInfluence = "Blob1 only" | "Weighted all" | "Center drift"
type PrimaryMotionMode = "Off" | "Orbit" | "Organic"

interface BlobColors {
    color1?: string
    color2?: string
    color3?: string
    color4?: string
    color5?: string
    color6?: string
    color7?: string
    color8?: string
}

interface InteractiveGradientProProps {
    blobColors?: BlobColors

    motionMode: MotionMode
    loopDuration: number
    orbitRadius: number
    followStrength: number

    innerStop: number
    middleStop: number
    outerStop: number

    blur: number
    brightness: number
    radius: number
    bleed: number
    blendMode: BlendMode

    scrollInfluence: number
    pulseOnTap: boolean
    pulseStrength: number
    pauseWhenOffscreen: boolean
    grain: boolean
    grainOpacity: number
    seed: number
    enableGyro: boolean
    gyroStrength: number
    quality: Quality
    baseColor: string

    hoverReturn: HoverReturnMode
    hoverOverscan: number
    hoverInfluence: HoverInfluence
    secondBlobFollow: number
    thirdBlobFollow: number
    fourthBlobFollow: number
    fifthBlobFollow: number
    sixthBlobFollow: number
    seventhBlobFollow: number
    eighthBlobFollow: number
    centerDriftStrength: number

    primaryMotion: PrimaryMotionMode
    primaryMotionRadius: number

    blobCount: number

    allTempo: number
    randomReseedInterval: number

    // Per-blob size scales
    blob1Size: number
    blob2Size: number
    blob3Size: number
    blob4Size: number
    blob5Size: number
    blob6Size: number
    blob7Size: number
    blob8Size: number

    // --- UI grouping objects (UI-only subpanels) ---
    colorsPanel?: any
    blobSizes?: any
    stops?: any
    motion?: any
    appearance?: any
    interaction?: any
    advanced?: any
}

// --------------------------- Utilities ---------------------------
const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v))

function useElementSize<T extends HTMLElement>(): [
    React.RefObject<T>,
    number,
    number,
] {
    const ref = React.useRef<T>(null)
    const [size, setSize] = React.useState({ w: 0, h: 0 })
    React.useLayoutEffect(() => {
        if (!ref.current) return
        const el = ref.current
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (r) setSize({ w: r.width, h: r.height })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    return [ref, size.w, size.h]
}

function seededRand(seed: number) {
    let s = seed >>> 0 || 1
    return () => {
        s = (1664525 * s + 1013904223) >>> 0
        return s / 0xffffffff
    }
}

// --- Optimized organic offset with per-seed param caching ---
const organicCache = new Map<
    number,
    { f1: number; f2: number; f3: number; p1: number; p2: number; p3: number }
>()
function organicOffset(t: number, amp: number, seed: number) {
    let params = organicCache.get(seed)
    if (!params) {
        const rand = seededRand(seed)
        params = {
            f1: 0.6 + rand() * 0.7,
            f2: 1.3 + rand() * 1.0,
            f3: 0.2 + rand() * 0.4,
            p1: rand() * Math.PI * 2,
            p2: rand() * Math.PI * 2,
            p3: rand() * Math.PI * 2,
        }
        organicCache.set(seed, params)
    }
    const { f1, f2, f3, p1, p2, p3 } = params
    return (
        amp *
        (0.56 * Math.sin(f1 * t + p1) +
            0.32 * Math.sin(f2 * t + p2) +
            0.12 * Math.sin(f3 * t + p3))
    )
}

function computeBlobSizePx(
    w: number,
    h: number,
    blur: number,
    bleed: number,
    outerStop: number
) {
    const base = Math.max(w, h)
    return base * 1.5 * (outerStop / 60) + blur * 2 + bleed * 2
}

function qualityMultipliers(q: Exclude<Quality, "Auto">) {
    switch (q) {
        case "Low":
            return { blur: 0.85, radius: 0.8, speed: 0.8 }
        case "Medium":
            return { blur: 1.0, radius: 1.0, speed: 1.0 }
        case "High":
        default:
            return { blur: 1.1, radius: 1.05, speed: 1.1 }
    }
}

function detectQualityFromDeviceMemory(dm: number): Exclude<Quality, "Auto"> {
    return dm <= 4 ? "Low" : dm <= 8 ? "Medium" : "High"
}

type BaseMode = "Orbit" | "Organic" | "Lissajous" | "Figure8"

function posForMode(
    mode: BaseMode,
    t: number,
    r: number,
    phaseShift: number,
    seed: number
) {
    switch (mode) {
        case "Organic":
            return {
                x: organicOffset(t + phaseShift, r, seed + 11),
                y: organicOffset(t + phaseShift + 0.7, r, seed + 19),
            }
        case "Lissajous": {
            const a = 1,
                b = 2
            return {
                x: Math.cos(a * (t + phaseShift)) * r,
                y: Math.sin(b * (t + phaseShift)) * r,
            }
        }
        case "Figure8":
            return {
                x: Math.sin(t + phaseShift) * r,
                y: Math.sin(2 * (t + phaseShift)) * 0.66 * r,
            }
        case "Orbit":
        default:
            return {
                x: Math.cos(t + phaseShift) * r,
                y: Math.sin(t + phaseShift) * r,
            }
    }
}

function posAll(
    t: number,
    r: number,
    phaseShift: number,
    seed: number,
    tempo: number
) {
    const tt = t * Math.max(0.1, tempo)
    const w1 = (Math.sin(tt * 0.25 + 0.0) + 1) * 0.5
    const w2 = (Math.sin(tt * 0.27 + 1.3) + 1) * 0.5
    const w3 = (Math.sin(tt * 0.31 + 2.1) + 1) * 0.5
    const w4 = (Math.sin(tt * 0.22 + 3.0) + 1) * 0.5
    const sum = w1 + w2 + w3 + w4 + 1e-6
    const P1 = posForMode("Orbit", tt, r, phaseShift, seed)
    const P2 = posForMode("Organic", tt, r, phaseShift, seed)
    const P3 = posForMode("Lissajous", tt, r, phaseShift, seed)
    const P4 = posForMode("Figure8", tt, r, phaseShift, seed)
    return {
        x: (P1.x * w1 + P2.x * w2 + P3.x * w3 + P4.x * w4) / sum,
        y: (P1.y * w1 + P2.y * w2 + P3.y * w3 + P4.y * w4) / sum,
    }
}

function randomBaseMode(index: number, seed: number): BaseMode {
    const rnd = seededRand(seed + index)()
    const modes: BaseMode[] = ["Orbit", "Organic", "Lissajous", "Figure8"]
    return modes[Math.floor(rnd * modes.length)] as BaseMode
}

function angleForIndex(i: number, count: number) {
    const N = Math.max(2, count)
    return i * ((2 * Math.PI) / N)
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 * @framerDisableUnlink
 */
// --------------------------- Component ---------------------------
export default function InteractiveGradientPro(
    props: Partial<InteractiveGradientProProps>
) {
    // defaults
    let {
        blobColors = {},

        motionMode = "Orbit",
        loopDuration = 16,
        orbitRadius = 28,
        followStrength = 0.35,

        innerStop = 0,
        middleStop = 22,
        outerStop = 60,

        blur = 60,
        brightness = 1,
        radius = 20,
        bleed = 0,
        blendMode = "screen",

        scrollInfluence = 0,
        pulseOnTap = false,
        pulseStrength = 0.35,
        pauseWhenOffscreen = true,
        grain = false,
        grainOpacity = 0.08,
        seed = 1,
        enableGyro = false,
        gyroStrength = 0.25,
        quality = "Auto",
        baseColor = "#0e0f12",

        hoverReturn = "Smooth",
        hoverOverscan = 12,
        hoverInfluence = "Blob1 only",
        secondBlobFollow = 0.3,
        thirdBlobFollow = 0.15,
        fourthBlobFollow = 0.1,
        fifthBlobFollow = 0.08,
        sixthBlobFollow = 0.07,
        seventhBlobFollow = 0.06,
        eighthBlobFollow = 0.05,
        centerDriftStrength = 0.2,

        primaryMotion = "Off",
        primaryMotionRadius = 8,

        blobCount = 5,

        allTempo = 1,
        randomReseedInterval = 0,

        // per-blob size scales (1 = base)
        blob1Size = 1,
        blob2Size = 1,
        blob3Size = 1,
        blob4Size = 1,
        blob5Size = 1,
        blob6Size = 1,
        blob7Size = 1,
        blob8Size = 1,
    } = props as InteractiveGradientProProps

    // UI subpanels
    const gp: any = props || {}
    const GColors = gp.colorsPanel || {}
    const GSizes = gp.blobSizes || {}
    const GStops = gp.stops || {}
    const GMotion = gp.motion || {}
    const GAppearance = gp.appearance || {}
    const GInteraction = gp.interaction || {}
    const GAdvanced = gp.advanced || {}

    // Colors
    blobColors = {
        ...blobColors,
        color1: GColors.color1 ?? blobColors.color1,
        color2: GColors.color2 ?? blobColors.color2,
        color3: GColors.color3 ?? blobColors.color3,
        color4: GColors.color4 ?? blobColors.color4,
        color5: GColors.color5 ?? blobColors.color5,
        color6: GColors.color6 ?? blobColors.color6,
        color7: GColors.color7 ?? blobColors.color7,
        color8: GColors.color8 ?? blobColors.color8,
    }

    // Per-blob sizes
    blob1Size = GSizes.blob1Size ?? blob1Size
    blob2Size = GSizes.blob2Size ?? blob2Size
    blob3Size = GSizes.blob3Size ?? blob3Size
    blob4Size = GSizes.blob4Size ?? blob4Size
    blob5Size = GSizes.blob5Size ?? blob5Size
    blob6Size = GSizes.blob6Size ?? blob6Size
    blob7Size = GSizes.blob7Size ?? blob7Size
    blob8Size = GSizes.blob8Size ?? blob8Size

    // Stops
    innerStop = GStops.innerStop ?? innerStop
    middleStop = GStops.middleStop ?? middleStop
    outerStop = GStops.outerStop ?? outerStop

    // Motion
    motionMode = (GMotion.motionMode ?? motionMode) as MotionMode
    allTempo = GMotion.allTempo ?? allTempo
    randomReseedInterval = GMotion.randomReseedInterval ?? randomReseedInterval
    loopDuration = GMotion.loopDuration ?? loopDuration
    orbitRadius = GMotion.orbitRadius ?? orbitRadius
    // followStrength moved out of Motion
    primaryMotion = (GMotion.primaryMotion ??
        primaryMotion) as PrimaryMotionMode
    primaryMotionRadius = GMotion.primaryMotionRadius ?? primaryMotionRadius
    blobCount = GMotion.blobCount ?? blobCount // (top-level control now; keep fallback)
    scrollInfluence = GMotion.scrollInfluence ?? scrollInfluence

    // Appearance
    blendMode = (GAppearance.blendMode ?? blendMode) as BlendMode
    blur = GAppearance.blur ?? blur
    brightness = GAppearance.brightness ?? brightness
    radius = GAppearance.radius ?? radius
    bleed = GAppearance.bleed ?? bleed
    baseColor = GAppearance.baseColor ?? baseColor
    grain = GAppearance.grain ?? grain
    grainOpacity = GAppearance.grainOpacity ?? grainOpacity

    // Interaction (followStrength moved here)
    hoverReturn = (GInteraction.hoverReturn ?? hoverReturn) as HoverReturnMode
    hoverOverscan = GInteraction.hoverOverscan ?? hoverOverscan
    hoverInfluence = (GInteraction.hoverInfluence ??
        hoverInfluence) as HoverInfluence
    secondBlobFollow = GInteraction.secondBlobFollow ?? secondBlobFollow
    thirdBlobFollow = GInteraction.thirdBlobFollow ?? thirdBlobFollow
    fourthBlobFollow = GInteraction.fourthBlobFollow ?? fourthBlobFollow
    fifthBlobFollow = GInteraction.fifthBlobFollow ?? fifthBlobFollow
    sixthBlobFollow = GInteraction.sixthBlobFollow ?? sixthBlobFollow
    seventhBlobFollow = GInteraction.seventhBlobFollow ?? seventhBlobFollow
    eighthBlobFollow = GInteraction.eighthBlobFollow ?? eighthBlobFollow
    centerDriftStrength =
        GInteraction.centerDriftStrength ?? centerDriftStrength
    pulseOnTap = GInteraction.pulseOnTap ?? pulseOnTap
    pulseStrength = GInteraction.pulseStrength ?? pulseStrength
    enableGyro = GInteraction.enableGyro ?? enableGyro
    gyroStrength = GInteraction.gyroStrength ?? gyroStrength
    followStrength = GInteraction.followStrength ?? followStrength

    // Advanced
    quality = (GAdvanced.quality ?? quality) as Quality
    pauseWhenOffscreen = GAdvanced.pauseWhenOffscreen ?? pauseWhenOffscreen
    seed = GAdvanced.seed ?? seed

    // Resolve colors array
    const C = [
        blobColors.color1 || "#FF5EDB",
        blobColors.color2 || "#7B61FF",
        blobColors.color3 || "#2EE6A6",
        blobColors.color4 || "#FFB86C",
        blobColors.color5 || "#61E6FF",
        blobColors.color6 || "#B7F8DB",
        blobColors.color7 || "#FF6E7F",
        blobColors.color8 || "#8E54E9",
    ]

    const reduce = useReducedMotion()
    const isStatic = useIsStaticRenderer()

    const [ref, w, h] = useElementSize<HTMLDivElement>()
    const widthMV = useMotionValue(w)
    const heightMV = useMotionValue(h)
    React.useEffect(() => {
        widthMV.set(w)
        heightMV.set(h)
    }, [w, h, widthMV, heightMV])

    const initialVisualQRef = React.useRef<Exclude<Quality, "Auto">>(
        quality === "Auto" ? "Medium" : quality
    )
    const [autoDetectedQ, setAutoDetectedQ] = React.useState<Exclude<
        Quality,
        "Auto"
    > | null>(null)
    React.useEffect(() => {
        if (quality !== "Auto") return
        const dm =
            (typeof navigator !== "undefined" &&
                (navigator as any)?.deviceMemory) ||
            null
        if (dm != null)
            setAutoDetectedQ(detectQualityFromDeviceMemory(Number(dm)))
        else setAutoDetectedQ(null)
    }, [quality])

    const visualQ: Exclude<Quality, "Auto"> =
        quality === "Auto" ? initialVisualQRef.current : quality
    const perfQ: Exclude<Quality, "Auto"> =
        quality === "Auto"
            ? (autoDetectedQ ?? initialVisualQRef.current)
            : quality

    const visualMul = React.useMemo(
        () => qualityMultipliers(visualQ),
        [visualQ]
    )
    const perfMul = React.useMemo(() => qualityMultipliers(perfQ), [perfQ])

    const effBlur = blur * visualMul.blur
    const effOrbit = orbitRadius * visualMul.radius
    const effDuration = Math.max(0.1, loopDuration / perfMul.speed)

    // Pointer state
    const pointerX = useMotionValue(0.5)
    const pointerY = useMotionValue(0.5)
    const pX = useSpring(pointerX, { stiffness: 200, damping: 28, mass: 0.8 })
    const pY = useSpring(pointerY, { stiffness: 200, damping: 28, mass: 0.8 })
    const x1PctBase = useTransform(
        pX,
        (v) => 50 + (v * 100 - 50) * followStrength
    )
    const y1PctBase = useTransform(
        pY,
        (v) => 50 + (v * 100 - 50) * followStrength
    )

    // Hover tracking (overscan)
    const rectRef = React.useRef<DOMRect | null>(null)
    const overscanRef = React.useRef(hoverOverscan)
    React.useEffect(() => {
        overscanRef.current = hoverOverscan
    }, [hoverOverscan])

    const triggerPointerReturn = React.useCallback(() => {
        const cx = 0.5,
            cy = 0.5
        const px = pointerX.get()
        const py = pointerY.get()
        if (hoverReturn === "Instant") {
            pointerX.set(cx)
            pointerY.set(cy)
            return
        }
        let dur = 0.35
        if (hoverReturn === "Distance") {
            const dx = px - cx
            const dy = py - cy
            const dist = Math.sqrt(dx * dx + dy * dy)
            dur = clamp(0.18 + dist * 0.45, 0.18, 0.5)
        }
        animate(pointerX, cx, { duration: dur, ease: "easeOut" })
        animate(pointerY, cy, { duration: dur, ease: "easeOut" })
    }, [hoverReturn, pointerX, pointerY])

    const handleGlobalMove = React.useCallback(
        (e: PointerEvent) => {
            const rect = rectRef.current
            if (!rect) return
            const os = Math.max(0, overscanRef.current || 0)
            const inside =
                e.clientX >= rect.left - os &&
                e.clientX <= rect.right + os &&
                e.clientY >= rect.top - os &&
                e.clientY <= rect.bottom + os

            if (!inside) {
                triggerPointerReturn()
                rectRef.current = null
                window.removeEventListener("pointermove", handleGlobalMove)
                return
            }
            const nx = clamp((e.clientX - rect.left) / rect.width, 0, 1)
            const ny = clamp((e.clientY - rect.top) / rect.height, 0, 1)
            pointerX.set(nx)
            pointerY.set(ny)
        },
        [pointerX, pointerY, triggerPointerReturn]
    )

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || reduce) return
        if ((hoverOverscan || 0) > 0) return
        const rect = e.currentTarget.getBoundingClientRect()
        const nx = clamp((e.clientX - rect.left) / rect.width, 0, 1)
        const ny = clamp((e.clientY - rect.top) / rect.height, 0, 1)
        pointerX.set(nx)
        pointerY.set(ny)
    }
    const onPointerLeave = () => {
        if (isStatic || reduce) return
        if ((hoverOverscan || 0) > 0) return
        triggerPointerReturn()
    }
    const onPointerEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isStatic || reduce) return
        if ((hoverOverscan || 0) > 0) {
            const el = e.currentTarget
            rectRef.current = el.getBoundingClientRect()
            window.addEventListener("pointermove", handleGlobalMove)
            const r = rectRef.current
            if (r) {
                const nx = clamp((e.clientX - r.left) / r.width, 0, 1)
                const ny = clamp((e.clientY - r.top) / r.height, 0, 1)
                pointerX.set(nx)
                pointerY.set(ny)
            }
        } else {
            onPointerMove(e as any)
        }
    }

    React.useEffect(() => {
        return () => window.removeEventListener("pointermove", handleGlobalMove)
    }, [handleGlobalMove])

    // Gyro
    React.useEffect(() => {
        if (!enableGyro) return
        const handler = (e: DeviceOrientationEvent) => {
            const gx = clamp(((e.gamma || 0) + 45) / 90, 0, 1)
            const gy = clamp(((e.beta || 0) + 45) / 90, 0, 1)
            const s = gyroStrength
            pointerX.set(0.5 * (1 - s) + gx * s)
            pointerY.set(0.5 * (1 - s) + gy * s)
        }
        try {
            const anyDO = (window as any).DeviceOrientationEvent
            if (anyDO && typeof anyDO.requestPermission === "function") {
                anyDO.requestPermission().then((state: string) => {
                    if (state === "granted")
                        window.addEventListener("deviceorientation", handler)
                })
            } else {
                window.addEventListener("deviceorientation", handler)
            }
        } catch {}
        return () => window.removeEventListener("deviceorientation", handler)
    }, [enableGyro, gyroStrength, pointerX, pointerY])

    // Offscreen pause
    const [inView, setInView] = React.useState(true)
    React.useEffect(() => {
        if (!pauseWhenOffscreen || !ref.current) return
        const obs = new IntersectionObserver(
            (entries) => setInView(entries[0]?.isIntersecting ?? true),
            { root: null, threshold: 0.01, rootMargin: "200px" }
        )
        obs.observe(ref.current)
        return () => obs.disconnect()
    }, [pauseWhenOffscreen, ref])

    // Time / phase base animation
    const phaseBase = useMotionValue(0)
    const { scrollYProgress } = useScroll()
    const phase = useTransform([phaseBase, scrollYProgress], ([p, s]) => {
        const extra = clamp(scrollInfluence, 0, 1) * s * (Math.PI * 2)
        return p + extra
    })

    // Random reseed for "Random" mode
    const [randCycle, setRandCycle] = React.useState(0)
    const randElapsedRef = React.useRef(0)

    useAnimationFrame((t, delta) => {
        if (reduce || isStatic) return
        const shouldRun = !pauseWhenOffscreen || inView
        if (!shouldRun) return
        const speed = (Math.PI * 2) / effDuration
        const inc = (delta / 1000) * speed
        phaseBase.set(phaseBase.get() + inc)

        if (motionMode === "Random" && randomReseedInterval > 0) {
            randElapsedRef.current += delta / 1000
            if (randElapsedRef.current >= randomReseedInterval) {
                randElapsedRef.current = 0
                setRandCycle((c) => c + 1)
            }
        }
    })

    // Pulse on tap
    const pulseMV = useMotionValue(1)
    const onPointerDown = () => {
        if (!pulseOnTap || reduce || isStatic) return
        const to = 1 + clamp(pulseStrength, 0, 1)
        animate(pulseMV, to, {
            type: "spring",
            stiffness: 300,
            damping: 18,
        }).then(() =>
            animate(pulseMV, 1, { type: "spring", stiffness: 160, damping: 20 })
        )
    }

    const radiusPct = useTransform(pulseMV, (p) => effOrbit * p)

    const pOffX = useTransform(pX, (v) => (v * 100 - 50) * followStrength)
    const pOffY = useTransform(pY, (v) => (v * 100 - 50) * followStrength)

    const wArr = [
        0,
        hoverInfluence === "Weighted all" ? clamp(secondBlobFollow, 0, 1) : 0,
        hoverInfluence === "Weighted all" ? clamp(thirdBlobFollow, 0, 1) : 0,
        hoverInfluence === "Weighted all" ? clamp(fourthBlobFollow, 0, 1) : 0,
        hoverInfluence === "Weighted all" ? clamp(fifthBlobFollow, 0, 1) : 0,
        hoverInfluence === "Weighted all" ? clamp(sixthBlobFollow, 0, 1) : 0,
        hoverInfluence === "Weighted all" ? clamp(seventhBlobFollow, 0, 1) : 0,
        hoverInfluence === "Weighted all" ? clamp(eighthBlobFollow, 0, 1) : 0,
    ] as const
    const cDrift =
        hoverInfluence === "Center drift" ? clamp(centerDriftStrength, 0, 1) : 0

    const modeForBlob = React.useCallback(
        (i: number): MotionMode | BaseMode => {
            if (motionMode === "Random")
                return randomBaseMode(i + randCycle * 101, seed)
            return motionMode
        },
        [motionMode, seed, randCycle]
    )

    const calcXY = React.useCallback(
        (i: number, t: number, r: number) => {
            const angle = angleForIndex(i, Math.max(1, blobCount))
            const sel = modeForBlob(i)
            if (sel === "All")
                return posAll(t, r, angle, seed + i * 101, allTempo)
            if (sel === "Random")
                return posForMode(
                    randomBaseMode(i + randCycle * 101, seed),
                    t,
                    r,
                    angle,
                    seed + i * 101
                )
            return posForMode(sel as BaseMode, t, r, angle, seed + i * 101)
        },
        [blobCount, modeForBlob, seed, allTempo, randCycle]
    )

    // Primary drift for blob 1
    const primaryOn = primaryMotion !== "Off" && primaryMotionRadius > 0
    const x1DriftPct = useTransform(phase, (t) => {
        if (!primaryOn) return 0
        const r = primaryMotionRadius
        if (primaryMotion === "Organic")
            return organicOffset(t + 0.35, r, seed + 501)
        return Math.cos(t) * r
    })
    const y1DriftPct = useTransform(phase, (t) => {
        if (!primaryOn) return 0
        const r = primaryMotionRadius
        if (primaryMotion === "Organic")
            return organicOffset(t + 1.1, r, seed + 509)
        return Math.sin(t) * r
    })

    const x1Pct = useTransform([x1PctBase, x1DriftPct], ([base, d]) => base + d)
    const y1Pct = useTransform([y1PctBase, y1DriftPct], ([base, d]) => base + d)

    // Base blob size and per-blob MotionValues
    const baseBlobSize = computeBlobSizePx(w, h, effBlur, bleed, outerStop)
    const baseBlobSizeMV = useMotionValue(baseBlobSize)
    React.useEffect(() => {
        baseBlobSizeMV.set(baseBlobSize)
    }, [baseBlobSize, baseBlobSizeMV])

    // Per-blob size scales
    const sizeScales = [
        blob1Size,
        blob2Size,
        blob3Size,
        blob4Size,
        blob5Size,
        blob6Size,
        blob7Size,
        blob8Size,
    ]
    const sMV = sizeScales.map((scale) =>
        useTransform(baseBlobSizeMV, (s) => s * scale)
    )

    const pctToPx = (pctMV: any, axisMV: any, sizeMV: any) =>
        useTransform(
            [pctMV, axisMV, sizeMV],
            ([p, axis, s]) => (p / 100) * axis - s / 2
        )

    const x1px = pctToPx(x1Pct, widthMV, sMV[0])
    const y1px = pctToPx(y1Pct, heightMV, sMV[0])

    // blobs 2..8 percentage positions
    const xPctArr = new Array(8).fill(null)
    const yPctArr = new Array(8).fill(null)

    for (let i = 1; i < 8; i++) {
        // i corresponds to blob index (1-based for math), but 0 is blob1 already handled
        xPctArr[i] = useTransform([phase, radiusPct, pOffX], ([t, r, offX]) => {
            const cx = 50 + offX * cDrift
            const { x } = calcXY(i, t, r)
            return cx + x + offX * (wArr[i] || 0)
        })
        yPctArr[i] = useTransform([phase, radiusPct, pOffY], ([t, r, offY]) => {
            const cy = 50 + offY * cDrift
            const { y } = calcXY(i, t, r)
            return cy + y + offY * (wArr[i] || 0)
        })
    }

    const xPxArr = xPctArr.map((xp, i) =>
        i === 0 ? x1px : pctToPx(xp, widthMV, sMV[i])
    )
    const yPxArr = yPctArr.map((yp, i) =>
        i === 0 ? y1px : pctToPx(yp, heightMV, sMV[i])
    )

    // Static positions (SSR/reduced motion)
    const staticPos = React.useMemo(() => {
        const N = Math.max(1, blobCount)
        const arr = [] as { x: number; y: number }[]
        for (let i = 0; i < Math.min(N, 8); i++) {
            const ang = angleForIndex(i, N)
            arr.push({
                x: 50 + Math.cos(ang) * effOrbit,
                y: 50 + Math.sin(ang) * effOrbit,
            })
        }
        return arr
    }, [blobCount, effOrbit])

    const mkGradient = React.useCallback(
        (color: string) =>
            `radial-gradient(circle, ${color} ${clamp(innerStop, 0, 100)}%, ${color} ${clamp(
                middleStop,
                innerStop,
                100
            )}%, rgba(0,0,0,0) ${clamp(outerStop, middleStop, 100)}%)`,
        [innerStop, middleStop, outerStop]
    )

    const containerFilter = `blur(${effBlur}px) brightness(${brightness})`

    // blend-mode fallback for plus-lighter
    const supportsPlusLighter =
        typeof CSS !== "undefined" &&
        (CSS as any).supports?.("mix-blend-mode", "plus-lighter")
    const effectiveBlend =
        blendMode === "plus-lighter" && !supportsPlusLighter
            ? "screen"
            : blendMode

    const GrainOverlay = grain ? (
        <svg
            aria-hidden
            focusable="false"
            width="100%"
            height="100%"
            style={{
                position: "absolute",
                inset: 0,
                opacity: clamp(grainOpacity, 0, 1),
                pointerEvents: "none",
                mixBlendMode: (blendMode === "normal"
                    ? "overlay"
                    : (effectiveBlend as any)) as any,
            }}
        >
            <filter id="noiseFilter">
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.9"
                    numOctaves="1"
                    stitchTiles="stitch"
                    seed={seed}
                />
                <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
    ) : null

    const shouldBeStatic = isStatic || reduce

    // Precompute static sizes for SSR branch
    const baseBlobSizeVal = baseBlobSize
    const bs = [
        baseBlobSizeVal * blob1Size,
        baseBlobSizeVal * blob2Size,
        baseBlobSizeVal * blob3Size,
        baseBlobSizeVal * blob4Size,
        baseBlobSizeVal * blob5Size,
        baseBlobSizeVal * blob6Size,
        baseBlobSizeVal * blob7Size,
        baseBlobSizeVal * blob8Size,
    ]

    const renderBlob = (i: number) => {
        const show = blobCount >= i + 1
        if (!show) return null
        const isFirst = i === 0
        const style: any = {
            position: "absolute",
            width: shouldBeStatic ? bs[i] : sMV[i],
            height: shouldBeStatic ? bs[i] : sMV[i],
            left: 0,
            top: 0,
            x: shouldBeStatic
                ? ((staticPos[i]?.x ?? 50) / 100) * w - bs[i] / 2
                : xPxArr[i],
            y: shouldBeStatic
                ? ((staticPos[i]?.y ?? 50) / 100) * h - bs[i] / 2
                : yPxArr[i],
            backgroundImage: mkGradient(C[i]),
            mixBlendMode: effectiveBlend as any,
            pointerEvents: "none",
            willChange: shouldBeStatic ? "auto" : "transform",
        }
        return <motion.div key={i} style={style} />
    }

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                borderRadius: radius,
                overflow: "hidden",
                backgroundColor: baseColor,
            }}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onPointerEnter={onPointerEnter}
            onPointerDown={onPointerDown}
        >
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -bleed,
                    filter: containerFilter,
                    willChange: shouldBeStatic ? "auto" : "transform",
                }}
            >
                {Array.from({ length: 8 }).map((_, i) => renderBlob(i))}
                {GrainOverlay}
            </motion.div>
        </div>
    )
}

// --------------------------- Grouped Property Controls (order matters) ---------------------------

const BLEND_OPTIONS: BlendMode[] = [
    "normal",
    "screen",
    "overlay",
    "plus-lighter",
    "multiply",
    "hard-light",
    "soft-light",
    "color-dodge",
    "color-burn",
    "difference",
    "exclusion",
    "darken",
    "lighten",
    "hue",
    "saturation",
    "color",
    "luminosity",
]

addPropertyControls(InteractiveGradientPro, {
    // (A) Make blobCount the very first property (top-level)
    blobCount: {
        type: ControlType.Number,
        title: "Blob Count",
        defaultValue: 5,
        min: 1,
        max: 8,
        step: 1,
    },

    // 1) Colors
    colorsPanel: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            color1: {
                type: ControlType.Color,
                title: "Blob 1",
                defaultValue: "#FF5EDB",
            },
            color2: {
                type: ControlType.Color,
                title: "Blob 2",
                defaultValue: "#7B61FF",
            },
            color3: {
                type: ControlType.Color,
                title: "Blob 3",
                defaultValue: "#2EE6A6",
            },
            color4: {
                type: ControlType.Color,
                title: "Blob 4",
                defaultValue: "#FFB86C",
            },
            color5: {
                type: ControlType.Color,
                title: "Blob 5",
                defaultValue: "#61E6FF",
            },
            color6: {
                type: ControlType.Color,
                title: "Blob 6",
                defaultValue: "#B7F8DB",
            },
            color7: {
                type: ControlType.Color,
                title: "Blob 7",
                defaultValue: "#FF6E7F",
            },
            color8: {
                type: ControlType.Color,
                title: "Blob 8",
                defaultValue: "#8E54E9",
            },
        },
    },

    // 2) Blob Sizes
    blobSizes: {
        type: ControlType.Object,
        title: "Blob Sizes",
        controls: {
            blob1Size: {
                type: ControlType.Number,
                title: "Blob 1",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
            blob2Size: {
                type: ControlType.Number,
                title: "Blob 2",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
            blob3Size: {
                type: ControlType.Number,
                title: "Blob 3",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
            blob4Size: {
                type: ControlType.Number,
                title: "Blob 4",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
            blob5Size: {
                type: ControlType.Number,
                title: "Blob 5",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
            blob6Size: {
                type: ControlType.Number,
                title: "Blob 6",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
            blob7Size: {
                type: ControlType.Number,
                title: "Blob 7",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
            blob8Size: {
                type: ControlType.Number,
                title: "Blob 8",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
        },
    },

    // 3) Gradient stops
    stops: {
        type: ControlType.Object,
        title: "Gradient Stops",
        controls: {
            innerStop: {
                type: ControlType.Number,
                title: "Inner",
                defaultValue: 0,
                min: 0,
                max: 60,
                step: 1,
                unit: "%",
            },
            middleStop: {
                type: ControlType.Number,
                title: "Middle",
                defaultValue: 22,
                min: 0,
                max: 80,
                step: 1,
                unit: "%",
            },
            outerStop: {
                type: ControlType.Number,
                title: "Outer",
                defaultValue: 60,
                min: 20,
                max: 100,
                step: 1,
                unit: "%",
            },
        },
    },

    // 4) Motion (followStrength removed from here)
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            motionMode: {
                type: ControlType.Enum,
                title: "Mode",
                options: [
                    "Orbit",
                    "Organic",
                    "Lissajous",
                    "Figure8",
                    "Random",
                    "All",
                ],
                defaultValue: "Orbit",
            },
            allTempo: {
                type: ControlType.Number,
                title: "All Tempo",
                defaultValue: 1,
                min: 0.1,
                max: 3,
                step: 0.05,
                hidden: ({ motion, motionMode }: any) =>
                    (motion?.motionMode ?? motionMode) !== "All",
            },
            randomReseedInterval: {
                type: ControlType.Number,
                title: "Random Reseed (s)",
                defaultValue: 0,
                min: 0,
                max: 30,
                step: 0.5,
                hidden: ({ motion, motionMode }: any) =>
                    (motion?.motionMode ?? motionMode) !== "Random",
            },
            loopDuration: {
                type: ControlType.Number,
                title: "Loop (s)",
                defaultValue: 16,
                min: 1,
                max: 60,
                step: 0.1,
                unit: "s",
            },
            orbitRadius: {
                type: ControlType.Number,
                title: "Orbit Radius",
                defaultValue: 28,
                min: 0,
                max: 48,
                step: 1,
                unit: "%",
            },
            primaryMotion: {
                type: ControlType.Enum,
                title: "Primary 1",
                options: ["Off", "Orbit", "Organic"],
                defaultValue: "Off",
            },
            primaryMotionRadius: {
                type: ControlType.Number,
                title: "Primary Radius",
                defaultValue: 8,
                min: 0,
                max: 24,
                step: 1,
                unit: "%",
                hidden: ({ motion, primaryMotion }: any) =>
                    (motion?.primaryMotion ?? primaryMotion) === "Off",
            },
            // blobCount moved to top-level
            scrollInfluence: {
                type: ControlType.Number,
                title: "Scroll FX",
                defaultValue: 0,
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
    },

    // 5) Appearance (make Grain Opacity visible when Grain is true robustly)
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            blendMode: {
                type: ControlType.Enum,
                title: "Blend",
                options: BLEND_OPTIONS,
                defaultValue: "screen",
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 60,
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
            },
            brightness: {
                type: ControlType.Number,
                title: "Brightness",
                defaultValue: 1,
                min: 0.2,
                max: 1.4,
                step: 0.01,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 20,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            bleed: {
                type: ControlType.Number,
                title: "Bleed",
                defaultValue: 0,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
            },
            baseColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0e0f12",
            },
            grain: {
                type: ControlType.Boolean,
                title: "Grain",
                defaultValue: false,
            },
            grainOpacity: {
                type: ControlType.Number,
                title: "Grain Opacity",
                defaultValue: 0.08,
                min: 0,
                max: 1,
                step: 0.01,
                // show when grain is true (whether read from nested appearance or top-level fallback)
                hidden: (p: any) => {
                    const on =
                        (p?.appearance && p.appearance.grain) ??
                        p?.grain ??
                        false
                    return !on
                },
            },
        },
    },

    // 6) Interaction (followStrength is FIRST here)
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            followStrength: {
                type: ControlType.Number,
                title: "Follow",
                defaultValue: 0.35,
                min: 0,
                max: 1,
                step: 0.01,
            },
            hoverReturn: {
                type: ControlType.Enum,
                title: "Hover Return",
                options: ["Instant", "Smooth", "Distance"],
                defaultValue: "Smooth",
            },
            hoverOverscan: {
                type: ControlType.Number,
                title: "Hover Overscan",
                defaultValue: 12,
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
            },
            hoverInfluence: {
                type: ControlType.Enum,
                title: "Hover Influence",
                options: ["Blob1 only", "Weighted all", "Center drift"],
                defaultValue: "Blob1 only",
            },
            // Show Blob follow controls when "Weighted all" and only up to blobCount
            secondBlobFollow: {
                type: ControlType.Number,
                title: "Blob2 Follow",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ interaction, hoverInfluence, blobCount }: any) =>
                    (interaction?.hoverInfluence ?? hoverInfluence) !==
                        "Weighted all" || (blobCount ?? 5) < 2,
            },
            thirdBlobFollow: {
                type: ControlType.Number,
                title: "Blob3 Follow",
                defaultValue: 0.15,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ interaction, hoverInfluence, blobCount }: any) =>
                    (interaction?.hoverInfluence ?? hoverInfluence) !==
                        "Weighted all" || (blobCount ?? 5) < 3,
            },
            fourthBlobFollow: {
                type: ControlType.Number,
                title: "Blob4 Follow",
                defaultValue: 0.1,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ interaction, hoverInfluence, blobCount }: any) =>
                    (interaction?.hoverInfluence ?? hoverInfluence) !==
                        "Weighted all" || (blobCount ?? 5) < 4,
            },
            fifthBlobFollow: {
                type: ControlType.Number,
                title: "Blob5 Follow",
                defaultValue: 0.08,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ interaction, hoverInfluence, blobCount }: any) =>
                    (interaction?.hoverInfluence ?? hoverInfluence) !==
                        "Weighted all" || (blobCount ?? 5) < 5,
            },
            sixthBlobFollow: {
                type: ControlType.Number,
                title: "Blob6 Follow",
                defaultValue: 0.07,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ interaction, hoverInfluence, blobCount }: any) =>
                    (interaction?.hoverInfluence ?? hoverInfluence) !==
                        "Weighted all" || (blobCount ?? 5) < 6,
            },
            seventhBlobFollow: {
                type: ControlType.Number,
                title: "Blob7 Follow",
                defaultValue: 0.06,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ interaction, hoverInfluence, blobCount }: any) =>
                    (interaction?.hoverInfluence ?? hoverInfluence) !==
                        "Weighted all" || (blobCount ?? 5) < 7,
            },
            eighthBlobFollow: {
                type: ControlType.Number,
                title: "Blob8 Follow",
                defaultValue: 0.05,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ interaction, hoverInfluence, blobCount }: any) =>
                    (interaction?.hoverInfluence ?? hoverInfluence) !==
                        "Weighted all" || (blobCount ?? 5) < 8,
            },
            centerDriftStrength: {
                type: ControlType.Number,
                title: "Center Drift",
                defaultValue: 0.2,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ interaction, hoverInfluence }: any) =>
                    (interaction?.hoverInfluence ?? hoverInfluence) !==
                    "Center drift",
            },
            pulseOnTap: {
                type: ControlType.Boolean,
                title: "Pulse on Tap",
                defaultValue: false,
            },
            pulseStrength: {
                type: ControlType.Number,
                title: "Pulse Strength",
                defaultValue: 0.35,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ interaction, pulseOnTap }: any) =>
                    !(interaction?.pulseOnTap ?? pulseOnTap),
            },
            enableGyro: {
                type: ControlType.Boolean,
                title: "Gyro",
                defaultValue: false,
            },
            gyroStrength: {
                type: ControlType.Number,
                title: "Gyro Strength",
                defaultValue: 0.25,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: ({ interaction, enableGyro }: any) =>
                    !(interaction?.enableGyro ?? enableGyro),
            },
        },
    },

    // 7) Advanced
    advanced: {
        type: ControlType.Object,
        title: "Advanced",
        controls: {
            quality: {
                type: ControlType.Enum,
                title: "Quality",
                options: ["Auto", "Low", "Medium", "High"],
                defaultValue: "Auto",
            },
            pauseWhenOffscreen: {
                type: ControlType.Boolean,
                title: "Pause Offscreen",
                defaultValue: true,
            },
            seed: {
                type: ControlType.Number,
                title: "Seed",
                defaultValue: 1,
                min: 0,
                max: 9999,
                step: 1,
            },
        },
    },
})
