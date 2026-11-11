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
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"

type ModelFileType = "glb" | "gltf" | "usdz"

type Props = {
    modelFile: string
    fileType: ModelFileType

    backgroundColor: string
    backgroundImage: string
    materialColor: string
    materialRoughness: number
    materialMetalness: number
    useCustomMaterial: boolean
    showLoading: boolean
    loadingText: string
    loadingFont: any
    loadingTextColor: string

    enablePanRotateZoom: boolean
    enableZoom: boolean
    autoRotate: boolean
    autoRotateDelayMs: number
    autoRotateSpeed: number
    autoRotateDirection: "x+" | "x-" | "y+" | "y-" | "z+" | "z-"

    cameraOrbitAzimuth: number
    cameraOrbitPolar: number
    cameraOrbitRadius: number
    minCameraOrbitRadius: number
    maxCameraOrbitRadius: number
    fieldOfView: number

    modelScale: number

    modelRotationX: number
    modelRotationY: number
    modelRotationZ: number

    exposure: number
    showShadow: boolean
    shadowIntensity: number
    shadowSoftness: number

    ar: boolean

    style?: CSSProperties
}

const MODEL_VIEWER_SRC =
    "https://cdn.jsdelivr.net/npm/@google/model-viewer/dist/model-viewer.min.js"

function srgbToLinear(channel: number) {
    if (!isFinite(channel)) return 0
    const c = Math.max(0, Math.min(1, channel))
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function hexToLinearRgba(color: string): [number, number, number, number] {
    try {
        if (
            typeof document !== "undefined" &&
            (color.startsWith("var(") || !color.startsWith("#"))
        ) {
            const div = document.createElement("div")
            div.style.color = color
            document.body.appendChild(div)
            const computed = getComputedStyle(div).color
            document.body.removeChild(div)
            if (computed) {
                const match = computed.match(
                    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
                )
                if (match) {
                    const r = srgbToLinear(parseInt(match[1]) / 255)
                    const g = srgbToLinear(parseInt(match[2]) / 255)
                    const b = srgbToLinear(parseInt(match[3]) / 255)
                    const a = match[4] ? parseFloat(match[4]) : 1
                    return [r, g, b, a]
                }
            }
        }

        const c = Color(color)
        if (!c) return [1, 1, 1, 1]

        const r = srgbToLinear(c.r / 255)
        const g = srgbToLinear(c.g / 255)
        const b = srgbToLinear(c.b / 255)
        const a = c.a

        return [r, g, b, a]
    } catch (e) {
        return [1, 1, 1, 1]
    }
}

function applyMaterial(
    mvEl: any,
    options: {
        color: string
        roughness: number
        metalness: number
        useCustomMaterial: boolean
    }
) {
    try {
        const model = mvEl?.model
        const materials = model?.materials
        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            if (typeof window !== "undefined") {
                const attempts = (mvEl?.__framerMaterialAttempts ?? 0) as number
                if (attempts < 20) {
                    mvEl.__framerMaterialAttempts = attempts + 1
                    window.requestAnimationFrame(() =>
                        applyMaterial(mvEl, options)
                    )
                }
            }
            return
        }

        if (!options.useCustomMaterial) {
            return
        }

        const rgba = hexToLinearRgba(options.color)
        for (const mat of materials) {
            mat?.pbrMetallicRoughness?.setBaseColorFactor?.(rgba)
            mat?.pbrMetallicRoughness?.setRoughnessFactor?.(options.roughness)
            mat?.pbrMetallicRoughness?.setMetallicFactor?.(options.metalness)
        }
    } catch {
        // fail open
    }
}

function ensureModelViewerLoaded(): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve()
    const w = window as any
    if (w.__framerModelViewerLoading) return w.__framerModelViewerLoading
    if (
        typeof customElements !== "undefined" &&
        customElements.get("model-viewer")
    )
        return Promise.resolve()

    w.__framerModelViewerLoading = new Promise<void>((resolve) => {
        if (typeof document === "undefined" || !document.head) {
            resolve()
            return
        }
        const done = () => {
            if (
                typeof customElements !== "undefined" &&
                (customElements as any).whenDefined
            ) {
                ;(customElements as any)
                    .whenDefined("model-viewer")
                    .then(() => resolve())
                    .catch(() => resolve())
                return
            }
            resolve()
        }
        const existing = document.querySelector(
            `script[data-framer-model-viewer="true"]`
        ) as HTMLScriptElement | null
        if (existing) {
            existing.addEventListener("load", () => done(), { once: true })
            existing.addEventListener("error", () => resolve(), { once: true })
            return
        }

        const s = document.createElement("script")
        s.type = "module"
        s.src = MODEL_VIEWER_SRC
        s.async = true
        s.dataset.framerModelViewer = "true"
        s.addEventListener("load", () => done(), { once: true })
        s.addEventListener("error", () => resolve(), { once: true })
        document.head.appendChild(s)
    })
    return w.__framerModelViewerLoading
}

/**
 * @framerDisplayName 3D Model Preview
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ModelViewer3D(props: Props) {
    const {
        modelFile = "https://framerusercontent.com/assets/6VXEJQk2omaRkVDodXBl83KpB24.glb",
        fileType = "glb",

        backgroundColor = "transparent",
        backgroundImage = "",
        materialColor = "#FFFFFF",
        materialRoughness = 0.5,
        materialMetalness = 0.5,
        useCustomMaterial = true,
        showLoading = true,
        loadingText = "Loading 3D…",
        loadingFont,
        loadingTextColor = "#000000",

        enablePanRotateZoom = true,
        enableZoom = true,
        autoRotate = false,
        autoRotateDelayMs = 0,
        autoRotateSpeed = 30,
        autoRotateDirection = "y+",

        cameraOrbitAzimuth = 0,
        cameraOrbitPolar = 75,
        cameraOrbitRadius = 105,
        minCameraOrbitRadius = 10,
        maxCameraOrbitRadius = 400,
        fieldOfView = 45,

        modelScale = 1,

        modelRotationX = 0,
        modelRotationY = 0,
        modelRotationZ = 0,

        exposure = 1,
        showShadow = true,
        shadowIntensity = 0.6,
        shadowSoftness = 0.8,

        ar = false,
        style,
    } = props

    const effectiveShadowIntensity = showShadow ? shadowIntensity : 0

    useIsStaticRenderer()
    const isRestricted =
        RenderTarget.current() === RenderTarget.thumbnail ||
        RenderTarget.current() === RenderTarget.export
    const containerRef = useRef<HTMLDivElement>(null)
    const mvRef = useRef<any>(null)
    const colorResolverRef = useRef<HTMLDivElement>(null)
    const lastAppliedOptionsRef = useRef<string>("")
    const orientationRef = useRef<{ x: number; y: number; z: number }>({
        x: 0,
        y: 0,
        z: 0,
    })
    const rotateRafRef = useRef<number>(0)
    const rotateLastTsRef = useRef<number>(0)
    const [ready, setReady] = useState<boolean>(() =>
        typeof window !== "undefined" && typeof customElements !== "undefined"
            ? !!customElements.get("model-viewer")
            : false
    )
    const [status, setStatus] = useState<"loading" | "loaded" | "error">(
        "loading"
    )

    const src = useMemo(() => {
        const safe = (modelFile || "").trim()
        return safe.length ? safe : ""
    }, [modelFile])

    const iosSrc = useMemo(() => {
        if (fileType !== "usdz") return undefined
        return src || undefined
    }, [fileType, src])

    const showPlaceholder = isRestricted || !src
    const showLoadingOverlay = showLoading && (!ready || status === "loading")

    const applyCurrentMaterial = () => {
        const el = mvRef.current
        if (!el) return
        let c = materialColor
        if (colorResolverRef.current) {
            const resolved = window.getComputedStyle(
                colorResolverRef.current
            ).color
            if (resolved) c = resolved
        }

        const options = {
            color: c,
            roughness: materialRoughness,
            metalness: materialMetalness,
            useCustomMaterial,
        }
        const optionsString = JSON.stringify(options)

        const model = el?.model
        const materials = model?.materials
        const materialsReady =
            materials && Array.isArray(materials) && materials.length > 0

        if (materialsReady && lastAppliedOptionsRef.current === optionsString) {
            return
        }

        applyMaterial(el, options)
        if (materialsReady) {
            lastAppliedOptionsRef.current = optionsString
        }
    }

    useEffect(() => {
        startTransition(() => {
            setStatus("loading")
        })
    }, [src])

    useEffect(() => {
        if (showPlaceholder) return
        let cancelled = false
        ensureModelViewerLoaded().then(() => {
            if (cancelled) return
            startTransition(() => setReady(true))
        })
        return () => {
            cancelled = true
        }
    }, [showPlaceholder])

    useEffect(() => {
        if (showPlaceholder) return
        if (!mvRef.current) return
        applyCurrentMaterial()
    }, [
        materialColor,
        materialRoughness,
        materialMetalness,
        useCustomMaterial,
        showPlaceholder,
    ])

    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined")
            return
        if (showPlaceholder) return
        const el = mvRef.current
        if (!el) return

        let raf = 0
        const apply = () => applyCurrentMaterial()
        apply()

        let intervalId = 0 as unknown as number
        try {
            intervalId = window.setInterval(() => apply(), 500)
        } catch {
            intervalId = 0 as unknown as number
        }

        const schedule = () => {
            if (raf) return
            raf = window.requestAnimationFrame(() => {
                raf = 0
                apply()
            })
        }

        let observer: MutationObserver | null = null
        try {
            observer = new MutationObserver(() => schedule())
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: [
                    "class",
                    "style",
                    "data-theme",
                    "data-framer-theme",
                ],
            })
            if (document.body)
                observer.observe(document.body, {
                    attributes: true,
                    attributeFilter: ["class", "style", "data-framer-theme"],
                })
            if (containerRef.current?.parentElement) {
                observer.observe(containerRef.current.parentElement, {
                    attributes: true,
                    attributeFilter: ["class", "style", "data-framer-theme"],
                })
            }
        } catch {
            observer = null
        }

        let mql: MediaQueryList | null = null
        const handleScheme = () => schedule()
        try {
            mql = window.matchMedia?.("(prefers-color-scheme: dark)") ?? null
            mql?.addEventListener?.("change", handleScheme)
        } catch {
            mql = null
        }

        return () => {
            if (raf) window.cancelAnimationFrame(raf)
            raf = 0
            if (intervalId) window.clearInterval(intervalId)
            intervalId = 0 as unknown as number
            observer?.disconnect()
            try {
                mql?.removeEventListener?.("change", handleScheme)
            } catch {}
        }
    }, [
        materialColor,
        materialRoughness,
        materialMetalness,
        useCustomMaterial,
        showPlaceholder,
    ])

    const baseOrientation = useMemo(() => {
        const x = Number(modelRotationX)
        const y = Number(modelRotationY)
        const z = Number(modelRotationZ)
        const safeX = isFinite(x) ? x : 0
        const safeY = isFinite(y) ? y : 0
        const safeZ = isFinite(z) ? z : 0
        return `${safeX}deg ${safeY}deg ${safeZ}deg`
    }, [modelRotationX, modelRotationY, modelRotationZ])

    const effectiveRotationPerSecond = useMemo(() => {
        const n = Number(autoRotateSpeed)
        if (!isFinite(n) || n === 0) return "0deg"
        const direction = autoRotateDirection.endsWith("-") ? -1 : 1
        return `${n * direction}deg`
    }, [autoRotateSpeed, autoRotateDirection])

    const effectiveRotationPerSecondNumber = useMemo(() => {
        const n = Number(autoRotateSpeed)
        if (!isFinite(n)) return 0
        const direction = autoRotateDirection.endsWith("-") ? -1 : 1
        return n * direction
    }, [autoRotateSpeed, autoRotateDirection])

    const rotateAxis = useMemo(
        () => autoRotateDirection.charAt(0) as "x" | "y" | "z",
        [autoRotateDirection]
    )

    // FIX: model-viewer has no scale attribute and CSS transform breaks layout
    // in the browser. Instead we scale by adjusting the camera orbit radius
    // inversely — a larger radius moves the camera further away, making the
    // model appear smaller. scale=1 → radius as-set; scale=0.5 → 2× radius.
    const cameraOrbit = useMemo(() => {
        const az = isFinite(cameraOrbitAzimuth) ? cameraOrbitAzimuth : 0
        const pol = isFinite(cameraOrbitPolar) ? cameraOrbitPolar : 75
        const baseRadius = isFinite(cameraOrbitRadius) ? cameraOrbitRadius : 105
        const safeScale = Math.max(0.01, Number(modelScale) || 1)
        const scaledRadius = baseRadius / safeScale
        return `${az}deg ${pol}deg ${scaledRadius}%`
    }, [cameraOrbitAzimuth, cameraOrbitPolar, cameraOrbitRadius, modelScale])

    const minCameraOrbit = useMemo(() => {
        const r = Number(minCameraOrbitRadius)
        return `auto auto ${isFinite(r) ? Math.max(0, r) : 10}%`
    }, [minCameraOrbitRadius])

    const maxCameraOrbit = useMemo(() => {
        const r = Number(maxCameraOrbitRadius)
        return `auto auto ${isFinite(r) ? Math.max(0, r) : 400}%`
    }, [maxCameraOrbitRadius])

    const fieldOfViewString = useMemo(() => {
        const f = Number(fieldOfView)
        return isFinite(f) ? `${f}deg` : "45deg"
    }, [fieldOfView])

    const containerStyle: CSSProperties = {
        ...(style || {}),
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: backgroundImage
            ? `url(${backgroundImage}) center / cover no-repeat`
            : backgroundColor,
        // @ts-ignore
        "--progress-bar-height": "0px",
        "--progress-bar-color": "transparent",
    }

    const placeholderStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: backgroundColor,
        color: loadingTextColor,
        gap: 10,
        padding: 16,
        textAlign: "center",
    }

    const loadingTextStyle: CSSProperties = useMemo(
        () => ({
            width: "max-content",
            maxWidth: "100%",
            ...loadingFont,
        }),
        [loadingFont]
    )

    const ModelViewerTag: any = "model-viewer"

    useEffect(() => {
        if (showPlaceholder) return
        const el = mvRef.current
        if (!el?.addEventListener) return
        const handleLoaded = () => {
            startTransition(() => {
                setStatus("loaded")
            })
            applyCurrentMaterial()
        }
        const handleError = () => {
            startTransition(() => setStatus("error"))
        }
        const handleSceneReady = () => {
            startTransition(() => {
                setStatus("loaded")
            })
            applyCurrentMaterial()
        }
        el.addEventListener("load", handleLoaded)
        el.addEventListener("error", handleError)
        el.addEventListener("scene-graph-ready", handleSceneReady)

        let pollId = 0 as unknown as number
        try {
            pollId = window.setInterval(() => {
                const anyEl = el as any
                if (anyEl?.loaded || anyEl?.model) {
                    startTransition(() => setStatus("loaded"))
                    applyCurrentMaterial()
                }
            }, 250)
        } catch {
            pollId = 0 as unknown as number
        }

        return () => {
            if (pollId) window.clearInterval(pollId)
            pollId = 0 as unknown as number
            el.removeEventListener("load", handleLoaded)
            el.removeEventListener("error", handleError)
            el.removeEventListener("scene-graph-ready", handleSceneReady)
        }
    }, [
        showPlaceholder,
        materialColor,
        materialRoughness,
        materialMetalness,
        useCustomMaterial,
    ])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (isRestricted) return
        if (showPlaceholder) return
        if (!autoRotate) return
        if (rotateAxis === "y") return

        const el = mvRef.current
        if (!el) return

        const axis: "x" | "y" | "z" = rotateAxis
        orientationRef.current = {
            x: isFinite(Number(modelRotationX)) ? Number(modelRotationX) : 0,
            y: isFinite(Number(modelRotationY)) ? Number(modelRotationY) : 0,
            z: isFinite(Number(modelRotationZ)) ? Number(modelRotationZ) : 0,
        }
        rotateLastTsRef.current = 0

        const setOrientationOnEl = () => {
            const o = orientationRef.current
            const value = `${o.x}deg ${o.y}deg ${o.z}deg`
            try {
                if (el.setAttribute) el.setAttribute("orientation", value)
                ;(el as any).orientation = value
            } catch {
                // fail open
            }
        }

        setOrientationOnEl()

        const tick = (ts: number) => {
            const last = rotateLastTsRef.current
            rotateLastTsRef.current = ts
            const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0
            if (dt > 0) {
                const delta = effectiveRotationPerSecondNumber * dt
                const next = (orientationRef.current[axis] + delta) % 360
                orientationRef.current = {
                    ...orientationRef.current,
                    [axis]: next,
                }
                setOrientationOnEl()
            }
            rotateRafRef.current = window.requestAnimationFrame(tick)
        }

        rotateRafRef.current = window.requestAnimationFrame(tick)
        return () => {
            if (rotateRafRef.current)
                window.cancelAnimationFrame(rotateRafRef.current)
            rotateRafRef.current = 0
        }
    }, [
        autoRotate,
        effectiveRotationPerSecondNumber,
        isRestricted,
        modelRotationX,
        modelRotationY,
        modelRotationZ,
        rotateAxis,
        showPlaceholder,
    ])

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            aria-label="3D model viewer"
        >
            <div
                ref={colorResolverRef}
                style={{
                    visibility: "hidden",
                    position: "absolute",
                    pointerEvents: "none",
                    color: materialColor,
                }}
            />
            {status === "error" && (
                <div style={placeholderStyle}>
                    <div style={loadingTextStyle}>Failed to load 3D model.</div>
                </div>
            )}
            {showLoadingOverlay && (
                <div style={placeholderStyle}>
                    <div style={loadingTextStyle}>{loadingText}</div>
                </div>
            )}
            <ModelViewerTag
                ref={mvRef}
                src={src}
                {...{
                    "ios-src": iosSrc,
                    "camera-controls": enablePanRotateZoom ? "" : undefined,
                    "disable-zoom":
                        enablePanRotateZoom && !enableZoom
                            ? ""
                            : !enablePanRotateZoom
                              ? ""
                              : undefined,
                    "disable-pan": enablePanRotateZoom ? undefined : "",
                    "disable-tap": "",
                    "interaction-prompt": "none",
                    "shadow-intensity": effectiveShadowIntensity,
                    "shadow-softness": shadowSoftness,
                    exposure,
                    "camera-orbit": cameraOrbit,
                    "min-camera-orbit": minCameraOrbit,
                    "max-camera-orbit": maxCameraOrbit,
                    "field-of-view": fieldOfViewString,
                    "auto-rotate":
                        autoRotate && rotateAxis === "y" ? "" : undefined,
                    "auto-rotate-delay": autoRotateDelayMs,
                    "rotation-per-second":
                        rotateAxis === "y"
                            ? effectiveRotationPerSecond
                            : undefined,
                    orientation: baseOrientation,
                    ar: ar ? "" : undefined,
                    "ar-modes": ar
                        ? "webxr scene-viewer quick-look"
                        : undefined,
                    "touch-action": "none",
                }}
                alt="3D model"
                style={{
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    display: "block",
                    visibility: "visible",
                }}
                role="application"
                aria-label="Interactive 3D model. Drag to rotate. Right-drag to pan. Scroll to zoom."
            />
        </div>
    )
}

addPropertyControls(ModelViewer3D, {
    modelFile: {
        type: ControlType.File,
        title: "3D File",
        allowedFileTypes: ["glb", "gltf", "usdz"],
    },
    fileType: {
        type: ControlType.Enum,
        title: "Type",
        options: ["glb", "gltf", "usdz"],
        optionTitles: ["GLB", "GLTF", "USDZ"],
        defaultValue: "glb",
        displaySegmentedControl: true,
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Bg Color",
        defaultValue: "transparent",
    },
    backgroundImage: {
        type: ControlType.Image,
        title: "Bg Image",
    },
    useCustomMaterial: {
        type: ControlType.Boolean,
        title: "Material",
        defaultValue: true,
        enabledTitle: "Custom",
        disabledTitle: "Original",
    },
    materialColor: {
        type: ControlType.Color,
        title: "Tint",
        defaultValue: "#000000",
        hidden: (p) => !p.useCustomMaterial,
    },
    materialRoughness: {
        type: ControlType.Number,
        title: "Roughness",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.useCustomMaterial,
    },
    materialMetalness: {
        type: ControlType.Number,
        title: "Metalness",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.useCustomMaterial,
    },

    enablePanRotateZoom: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableZoom: {
        type: ControlType.Boolean,
        title: "Zoom",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.enablePanRotateZoom,
    },

    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoRotateDelayMs: {
        type: ControlType.Number,
        title: "Rotate Delay",
        defaultValue: 0,
        min: 0,
        max: 10000,
        step: 50,
        unit: "ms",
        hidden: (p) => !p.autoRotate,
    },
    autoRotateSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 30,
        min: 0,
        max: 360,
        step: 1,
        unit: "dps",
        hidden: (p) => !p.autoRotate,
    },
    autoRotateDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["x+", "x-", "y+", "y-", "z+", "z-"],
        optionTitles: ["X+", "X-", "Y+", "Y-", "Z+", "Z-"],
        defaultValue: "y+",
        hidden: (p) => !p.autoRotate,
    },

    modelRotationX: {
        type: ControlType.Number,
        title: "Rotation X",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },
    modelRotationY: {
        type: ControlType.Number,
        title: "Rotation Y",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },
    modelRotationZ: {
        type: ControlType.Number,
        title: "Rotation Z",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },

    cameraOrbitAzimuth: {
        type: ControlType.Number,
        title: "Orbit Azimuth",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },
    cameraOrbitPolar: {
        type: ControlType.Number,
        title: "Orbit Polar",
        defaultValue: 75,
        min: 0,
        max: 180,
        step: 1,
        unit: "°",
    },
    cameraOrbitRadius: {
        type: ControlType.Number,
        title: "Orbit Radius",
        defaultValue: 105,
        min: 1,
        max: 400,
        step: 1,
        unit: "%",
    },
    minCameraOrbitRadius: {
        type: ControlType.Number,
        title: "Min Orbit",
        defaultValue: 10,
        min: 0,
        max: 400,
        step: 1,
        unit: "%",
    },
    maxCameraOrbitRadius: {
        type: ControlType.Number,
        title: "Max Orbit",
        defaultValue: 400,
        min: 0,
        max: 400,
        step: 1,
        unit: "%",
    },
    fieldOfView: {
        type: ControlType.Number,
        title: "FOV",
        defaultValue: 45,
        min: 10,
        max: 120,
        step: 1,
        unit: "°",
    },

    modelScale: {
        type: ControlType.Number,
        title: "Model Scale",
        defaultValue: 1,
        min: 0.01,
        max: 5,
        step: 0.01,
    },

    exposure: {
        type: ControlType.Number,
        title: "Exposure",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
    },
    showShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow Int.",
        defaultValue: 0.6,
        min: 0,
        max: 2,
        step: 0.05,
        hidden: (p) => !p.showShadow,
    },
    shadowSoftness: {
        type: ControlType.Number,
        title: "Softness",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.02,
        hidden: (p) => !p.showShadow,
    },

    ar: {
        type: ControlType.Boolean,
        title: "AR",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    showLoading: {
        type: ControlType.Boolean,
        title: "Loading",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    loadingText: {
        type: ControlType.String,
        title: "Loading Text",
        defaultValue: "Loading 3D…",
        hidden: (p) => !p.showLoading,
    },
    loadingTextColor: {
        type: ControlType.Color,
        title: "Loading Color",
        defaultValue: "#000000",
        hidden: (p) => !p.showLoading,
    },
    loadingFont: {
        type: ControlType.Font,
        title: "Loading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        hidden: (p) => !p.showLoading,
        description:
            "Component by Blue Jackson: [Get In Touch](https://www.jacksonvisualdesign.com/links)",
    },
})
