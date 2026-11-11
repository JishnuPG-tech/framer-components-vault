// ORBITDOT GLOBE
// BUILD: ORBITDOT-V6-5-OPTIMIZED-20260814
// Coordinates format: "Latitude, Longitude"
// Marketplace-safe final build:
// ✓ useIsStaticRenderer
// ✓ Embedded land mask
// ✓ No runtime fetch or external CDN
// ✓ Open Link + smart anchored Popover
// ✓ Popovers map sequentially to locations using Open Popover
// ✓ Mobile two-finger globe zoom
// ✓ Safe URL validation
// ✓ Accessible keyboard-friendly Popovers

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as THREE from "three"

type LabelStyle = "auto" | "marker"
type LocationAction = "none" | "link" | "popover"

type GlobeLocation = {
    coordinates: string
    name: string
    color: string
    pulse: boolean
    showLabel: boolean
    action: LocationAction
    url: string
    newTab: boolean
}

type ParsedLocation = {
    locationIndex: number
    popoverSlotIndex: number
    latitude: number
    longitude: number
    name: string
    color: string
    pulse: boolean
    showLabel: boolean
    action: LocationAction
    url: string
    newTab: boolean
}

type OrbitDotProps = {
    oceanColor: string
    landColor: string
    dotSize: number
    dotDensity: number
    autoRotate: boolean
    labelStyle: LabelStyle
    showQuickStart: boolean
    locations: GlobeLocation[]
    popovers: React.ReactNode[]
    style?: React.CSSProperties
}

type Status = "loading" | "ready" | "error" | "unsupported"

type LabelRecord = {
    element: HTMLDivElement
    localPosition: THREE.Vector3
}

type PulseRecord = {
    mesh: THREE.Mesh
    material: THREE.MeshBasicMaterial
    offset: number
}

type MarkerRecord = {
    locationIndex: number
    popoverSlotIndex: number
    sprite: THREE.Sprite
    localPosition: THREE.Vector3
    baseScale: number
    action: LocationAction
    url: string
    newTab: boolean
    hovered: boolean
}

const BUILD_ID = "ORBITDOT-V6-5-OPTIMIZED-20260814"

const LAND_MASK_DATA_URL =
    "data:image/png;base64,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"

const GLOBE_RADIUS = 100
const LAND_RADIUS = 100.75
const LOCATION_RADIUS = 102

const MASK_WIDTH = 720
const MASK_HEIGHT = 360

let cachedLandMask: ImageData | null = null
let cachedMaskPromise: Promise<ImageData> | null = null

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function isMobileDevice() {
    if (typeof window === "undefined") return false

    const coarsePointer =
        window.matchMedia?.("(pointer: coarse)").matches ?? false

    return coarsePointer || window.innerWidth <= 767
}

function supportsWebGL() {
    if (typeof document === "undefined") return false

    try {
        const canvas = document.createElement("canvas")

        return Boolean(
            window.WebGLRenderingContext &&
                (canvas.getContext("webgl") ||
                    canvas.getContext("experimental-webgl"))
        )
    } catch {
        return false
    }
}

function getSafeHttpUrl(value: string) {
    if (typeof window === "undefined") return null

    const input = value.trim()
    if (!input) return null

    try {
        const parsed = new URL(input, window.location.href)

        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return null
        }

        return parsed.href
    } catch {
        return null
    }
}

function safeColor(value: string, fallback: string) {
    try {
        return new THREE.Color(value)
    } catch {
        return new THREE.Color(fallback)
    }
}

function colorToRgba(value: string, alpha: number) {
    const color = safeColor(value, "#FF4D00")

    return `rgba(${Math.round(color.r * 255)}, ${Math.round(
        color.g * 255
    )}, ${Math.round(color.b * 255)}, ${alpha})`
}

/* -------------------------------------------------------------------------- */
/* Contrast */
/* -------------------------------------------------------------------------- */

function linearizeChannel(channel: number) {
    return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4)
}

function getLuminance(value: string) {
    const color = safeColor(value, "#FFFFFF")

    return (
        0.2126 * linearizeChannel(color.r) +
        0.7152 * linearizeChannel(color.g) +
        0.0722 * linearizeChannel(color.b)
    )
}

function getContrastRatio(first: string, second: string) {
    const firstLuminance = getLuminance(first)
    const secondLuminance = getLuminance(second)

    const lighter = Math.max(firstLuminance, secondLuminance)
    const darker = Math.min(firstLuminance, secondLuminance)

    return (lighter + 0.05) / (darker + 0.05)
}

function getBestTextColor(background: string) {
    const whiteContrast = getContrastRatio(background, "#FFFFFF")
    const blackContrast = getContrastRatio(background, "#000000")

    return whiteContrast >= blackContrast ? "#FFFFFF" : "#000000"
}

function getAutoLabelColors(surfaceColor: string) {
    const whiteContrast = getContrastRatio(surfaceColor, "#FFFFFF")
    const blackContrast = getContrastRatio(surfaceColor, "#000000")

    const background = whiteContrast >= blackContrast ? "#FFFFFF" : "#000000"

    return {
        background,
        text: background === "#FFFFFF" ? "#000000" : "#FFFFFF",
    }
}

/* -------------------------------------------------------------------------- */
/* Coordinates */
/* -------------------------------------------------------------------------- */

function parseCoordinates(value: string) {
    if (typeof value !== "string") return null

    const normalized = value
        .trim()
        .replace(/[()[\]{}]/g, "")
        .replace(/[，;]/g, ",")
        .replace(/\s+/g, " ")

    if (!normalized) return null

    let parts = normalized
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)

    if (parts.length !== 2) {
        parts = normalized
            .split(/\s+/)
            .map((part) => part.trim())
            .filter(Boolean)
    }

    if (parts.length !== 2) return null

    const latitude = Number(parts[0])
    const longitude = Number(parts[1])

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return null
    }

    return { latitude, longitude }
}

function latLngToVector3(latitude: number, longitude: number, radius: number) {
    const lat = THREE.MathUtils.degToRad(latitude)
    const lng = THREE.MathUtils.degToRad(longitude)

    return new THREE.Vector3(
        radius * Math.cos(lat) * Math.sin(lng),
        radius * Math.sin(lat),
        radius * Math.cos(lat) * Math.cos(lng)
    )
}

/* -------------------------------------------------------------------------- */
/* Land mask */
/* -------------------------------------------------------------------------- */

function coordinateToMaskPoint(
    longitude: number,
    latitude: number
): [number, number] {
    return [
        ((longitude + 180) / 360) * MASK_WIDTH,
        ((90 - latitude) / 180) * MASK_HEIGHT,
    ]
}

async function createLandMask(): Promise<ImageData> {
    if (cachedLandMask) return cachedLandMask
    if (cachedMaskPromise) return cachedMaskPromise

    cachedMaskPromise = new Promise<ImageData>((resolve, reject) => {
        const image = new Image()

        image.onload = () => {
            try {
                const canvas = document.createElement("canvas")
                canvas.width = MASK_WIDTH
                canvas.height = MASK_HEIGHT

                const context = canvas.getContext("2d", {
                    willReadFrequently: true,
                })

                if (!context) {
                    reject(new Error("Canvas 2D is unavailable."))
                    return
                }

                context.clearRect(0, 0, MASK_WIDTH, MASK_HEIGHT)
                context.drawImage(image, 0, 0, MASK_WIDTH, MASK_HEIGHT)

                cachedLandMask = context.getImageData(
                    0,
                    0,
                    MASK_WIDTH,
                    MASK_HEIGHT
                )

                resolve(cachedLandMask)
            } catch (error) {
                reject(error)
            }
        }

        image.onerror = () =>
            reject(new Error("Unable to decode bundled land mask."))

        image.src = LAND_MASK_DATA_URL
    })

    try {
        return await cachedMaskPromise
    } catch (error) {
        cachedMaskPromise = null
        throw error
    }
}

function isLand(mask: ImageData, longitude: number, latitude: number) {
    const [rawX, rawY] = coordinateToMaskPoint(longitude, latitude)

    const x = clamp(Math.floor(rawX), 0, MASK_WIDTH - 1)
    const y = clamp(Math.floor(rawY), 0, MASK_HEIGHT - 1)

    return mask.data[(y * MASK_WIDTH + x) * 4 + 3] > 0
}

/* -------------------------------------------------------------------------- */
/* Land dots */
/* -------------------------------------------------------------------------- */

function getCandidateCount(density: number, mobile: boolean) {
    const level = clamp(Math.round(density), 1, 5)

    const desktop: Record<number, number> = {
        1: 5000,
        2: 8000,
        3: 12000,
        4: 17000,
        5: 23000,
    }

    const mobileCounts: Record<number, number> = {
        1: 3000,
        2: 4800,
        3: 6800,
        4: 8200,
        5: 9600,
    }

    const source = mobile ? mobileCounts : desktop

    return source[level] ?? source[3]
}

function createLandGeometry(mask: ImageData, density: number, mobile: boolean) {
    const count = getCandidateCount(density, mobile)
    const positions: number[] = []

    const goldenAngle = Math.PI * (3 - Math.sqrt(5))

    for (let index = 0; index < count; index++) {
        const progress = count <= 1 ? 0 : index / (count - 1)
        const y = 1 - progress * 2

        const horizontalRadius = Math.sqrt(Math.max(0, 1 - y * y))

        const angle = goldenAngle * index
        const x = Math.cos(angle) * horizontalRadius
        const z = Math.sin(angle) * horizontalRadius

        const latitude = Math.asin(clamp(y, -1, 1)) * (180 / Math.PI)

        const longitude = Math.atan2(x, z) * (180 / Math.PI)

        if (!isLand(mask, longitude, latitude)) continue

        positions.push(x * LAND_RADIUS, y * LAND_RADIUS, z * LAND_RADIUS)
    }

    const geometry = new THREE.BufferGeometry()

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
    )

    geometry.computeBoundingSphere()

    return geometry
}

function createDotTexture() {
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64

    const context = canvas.getContext("2d")
    if (!context) return null

    context.clearRect(0, 0, 64, 64)
    context.beginPath()
    context.arc(32, 32, 27, 0, Math.PI * 2)
    context.fillStyle = "#FFFFFF"
    context.fill()

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace

    return texture
}

/* -------------------------------------------------------------------------- */
/* Location visuals */
/* -------------------------------------------------------------------------- */

function createMarkerTexture(colorValue: string) {
    const canvas = document.createElement("canvas")
    canvas.width = 96
    canvas.height = 96

    const context = canvas.getContext("2d")
    if (!context) return null

    const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 47)

    gradient.addColorStop(0, colorToRgba(colorValue, 1))
    gradient.addColorStop(0.18, colorToRgba(colorValue, 1))
    gradient.addColorStop(0.42, colorToRgba(colorValue, 0.68))
    gradient.addColorStop(0.7, colorToRgba(colorValue, 0.14))
    gradient.addColorStop(1, colorToRgba(colorValue, 0))

    context.fillStyle = gradient
    context.fillRect(0, 0, 96, 96)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace

    return texture
}

function createLabelElement(
    location: ParsedLocation,
    labelLayer: HTMLDivElement,
    landMask: ImageData,
    labelStyle: LabelStyle,
    oceanColor: string,
    landColor: string
) {
    const element = document.createElement("div")

    element.textContent = location.name

    let background = location.color
    let text = getBestTextColor(location.color)

    if (labelStyle === "auto") {
        const surfaceColor = isLand(
            landMask,
            location.longitude,
            location.latitude
        )
            ? landColor
            : oceanColor

        const adaptive = getAutoLabelColors(surfaceColor)

        background = adaptive.background
        text = adaptive.text
    }

    const dark = getLuminance(background) < 0.35

    Object.assign(element.style, {
        position: "absolute",
        left: "0",
        top: "0",
        zIndex: "2",

        padding: "5px 8px",
        borderRadius: "999px",

        color: text,
        background,

        border: `1px solid ${
            dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)"
        }`,

        boxShadow: dark
            ? "0 4px 14px rgba(0,0,0,0.35)"
            : "0 4px 14px rgba(0,0,0,0.16)",

        fontFamily:
            'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

        fontSize: "10px",
        fontWeight: "500",
        lineHeight: "1",
        whiteSpace: "nowrap",

        pointerEvents: "none",
        userSelect: "none",

        opacity: "0",

        transform: "translate(-50%, calc(-100% - 10px))",

        willChange: "left, top, opacity",
    } as Partial<CSSStyleDeclaration>)

    labelLayer.appendChild(element)

    return element
}

function disposeObject(object: THREE.Object3D) {
    object.traverse((child: any) => {
        child.geometry?.dispose?.()

        if (Array.isArray(child.material)) {
            for (const material of child.material) {
                material.map?.dispose?.()
                material.dispose?.()
            }
        } else {
            child.material?.map?.dispose?.()
            child.material?.dispose?.()
        }
    })
}

function StatusMessage({ status, color }: { status: Status; color: string }) {
    if (status === "ready") return null

    const message =
        status === "loading"
            ? "Loading globe…"
            : status === "unsupported"
              ? "WebGL is unavailable on this device."
              : "Unable to load globe data."

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 5,

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                padding: 20,

                color,

                fontFamily:
                    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

                fontSize: 12,
                textAlign: "center",

                pointerEvents: "none",

                opacity: status === "loading" ? 0.5 : 0.8,
            }}
        >
            {message}
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 */
export default function OrbitDotGlobe(props: OrbitDotProps) {
    const {
        oceanColor = "#F4F4F1",
        landColor = "#171717",
        dotSize = 1.8,
        dotDensity = 3,
        autoRotate = true,
        labelStyle = "auto",
        showQuickStart = false,
        locations = [],
        popovers = [],
        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const labelLayerRef = useRef<HTMLDivElement>(null)

    const [status, setStatus] = useState<Status>("loading")
    const [activePopoverIndex, setActivePopoverIndex] = useState<number | null>(
        null
    )
    const activePopoverIndexRef = useRef<number | null>(null)
    const activeMarkerRef = useRef<MarkerRecord | null>(null)
    const popoverRef = useRef<HTMLDivElement>(null)
    const positionPopoverRef = useRef<(() => void) | null>(null)
    const closeTimerRef = useRef<number | null>(null)
    const autoRotateRef = useRef(autoRotate)
    const popoversRef = useRef(popovers)

    useEffect(() => {
        autoRotateRef.current = autoRotate
    }, [autoRotate])

    useEffect(() => {
        popoversRef.current = popovers
    }, [popovers])

    function closePopover() {
        const element = popoverRef.current

        activePopoverIndexRef.current = null
        activeMarkerRef.current = null

        if (element) {
            element.animate(
                [
                    { opacity: 1, transform: "scale(1)" },
                    { opacity: 0, transform: "scale(0.96)" },
                ],
                {
                    duration: 120,
                    easing: "ease-in",
                    fill: "forwards",
                }
            )
        }

        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current)
        }

        closeTimerRef.current = window.setTimeout(() => {
            setActivePopoverIndex(null)
            closeTimerRef.current = null
        }, 120)
    }

    useEffect(() => {
        return () => {
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (activePopoverIndex === null) return

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault()
                closePopover()
            }
        }

        window.addEventListener("keydown", onKeyDown)

        let secondFrame = 0

        const firstFrame = window.requestAnimationFrame(() => {
            positionPopoverRef.current?.()

            secondFrame = window.requestAnimationFrame(() => {
                positionPopoverRef.current?.()
                popoverRef.current?.focus({
                    preventScroll: true,
                })
            })
        })

        return () => {
            window.cancelAnimationFrame(firstFrame)
            if (secondFrame) {
                window.cancelAnimationFrame(secondFrame)
            }
            window.removeEventListener("keydown", onKeyDown)
        }
    }, [activePopoverIndex])

    const locationsKey = useMemo(() => {
        try {
            return JSON.stringify(locations ?? [])
        } catch {
            return "[]"
        }
    }, [locations])

    useEffect(() => {
        const container = containerRef.current
        const labelLayer = labelLayerRef.current

        if (!container || !labelLayer || typeof window === "undefined") {
            return
        }

        if (!supportsWebGL()) {
            setStatus("unsupported")
            return
        }

        const mobile = isMobileDevice()

        let disposed = false
        let visible = true
        let animationFrame = 0

        let resizeObserver: ResizeObserver | null = null
        let visibilityObserver: IntersectionObserver | null = null

        let renderer: THREE.WebGLRenderer | null = null
        let scene: THREE.Scene | null = null
        let camera: THREE.PerspectiveCamera | null = null
        let globeGroup: THREE.Group | null = null

        let baseCameraDistance = 0
        let currentCameraDistance = 0
        let maxCameraDistance = 0
        const minimumCameraDistance = GLOBE_RADIUS + 0.75

        const labelRecords: LabelRecord[] = []
        const pulseRecords: PulseRecord[] = []
        const markerRecords: MarkerRecord[] = []

        const parsedLocations: ParsedLocation[] = (() => {
            if (!Array.isArray(locations)) return []

            let nextPopoverSlotIndex = 0

            return locations
                .map((location, locationIndex) => {
                    if (!location) return null

                    const parsed = parseCoordinates(location.coordinates)

                    if (!parsed) return null

                    const name = location.name?.trim() ?? ""

                    const action: LocationAction =
                        location.action === "link"
                            ? "link"
                            : location.action === "popover"
                              ? "popover"
                              : "none"

                    const popoverSlotIndex =
                        action === "popover" ? nextPopoverSlotIndex++ : -1

                    return {
                        locationIndex,
                        popoverSlotIndex,
                        latitude: parsed.latitude,
                        longitude: parsed.longitude,
                        name,
                        color: location.color || "#FF4D00",
                        pulse: location.pulse !== false,
                        showLabel:
                            location.showLabel !== false && name.length > 0,
                        action,
                        url: location.url?.trim() || "",
                        newTab: location.newTab !== false,
                    }
                })
                .filter(
                    (location): location is ParsedLocation => location !== null
                )
        })()

        setStatus("loading")
        labelLayer.innerHTML = ""

        async function initialize() {
            try {
                const landMask = await createLandMask()

                if (disposed) return

                const width = Math.max(container.clientWidth, 1)
                const height = Math.max(container.clientHeight, 1)

                renderer = new THREE.WebGLRenderer({
                    alpha: true,
                    antialias: !mobile,
                    powerPreference: "high-performance",
                })

                renderer.setClearColor(0x000000, 0)

                renderer.setPixelRatio(
                    Math.min(window.devicePixelRatio || 1, mobile ? 1.1 : 1.5)
                )

                renderer.setSize(width, height, false)
                renderer.outputColorSpace = THREE.SRGBColorSpace

                Object.assign(renderer.domElement.style, {
                    position: "absolute",
                    inset: "0",
                    width: "100%",
                    height: "100%",
                    display: "block",
                    touchAction: mobile ? "pan-y" : "none",
                    cursor: isStaticRenderer ? "default" : "grab",
                })

                container.insertBefore(renderer.domElement, labelLayer)

                scene = new THREE.Scene()

                camera = new THREE.PerspectiveCamera(
                    34,
                    width / height,
                    0.1,
                    1000
                )

                globeGroup = new THREE.Group()

                globeGroup.rotation.z = THREE.MathUtils.degToRad(-8)

                globeGroup.rotation.y = THREE.MathUtils.degToRad(-105)

                globeGroup.rotation.x = THREE.MathUtils.degToRad(4)

                scene.add(globeGroup)

                const ocean = new THREE.Mesh(
                    new THREE.SphereGeometry(
                        GLOBE_RADIUS,
                        mobile ? 32 : 48,
                        mobile ? 24 : 32
                    ),
                    new THREE.MeshPhongMaterial({
                        color: safeColor(oceanColor, "#F4F4F1"),
                        specular: new THREE.Color("#333333"),
                        shininess: 3,
                        depthWrite: true,
                        depthTest: true,
                    })
                )

                globeGroup.add(ocean)

                const landPoints = new THREE.Points(
                    createLandGeometry(landMask, dotDensity, mobile),
                    new THREE.PointsMaterial({
                        color: safeColor(landColor, "#171717"),
                        size: clamp(
                            mobile ? dotSize * 1.05 : dotSize,
                            0.6,
                            4.5
                        ),
                        sizeAttenuation: true,
                        map: createDotTexture() ?? undefined,
                        transparent: true,
                        alphaTest: 0.25,
                        opacity: 1,
                        depthWrite: true,
                        depthTest: true,
                    })
                )

                globeGroup.add(landPoints)

                parsedLocations.forEach((location, index) => {
                    if (!globeGroup) return

                    const localPosition = latLngToVector3(
                        location.latitude,
                        location.longitude,
                        LOCATION_RADIUS
                    )

                    const marker = new THREE.Sprite(
                        new THREE.SpriteMaterial({
                            map:
                                createMarkerTexture(location.color) ??
                                undefined,
                            color: 0xffffff,
                            transparent: true,
                            depthTest: true,
                            depthWrite: false,
                        })
                    )

                    marker.position.copy(localPosition)

                    const markerSize = mobile ? 9 : 8
                    marker.scale.set(markerSize, markerSize, 1)

                    globeGroup.add(marker)

                    markerRecords.push({
                        locationIndex: location.locationIndex,
                        popoverSlotIndex: location.popoverSlotIndex,
                        sprite: marker,
                        localPosition: localPosition.clone(),
                        baseScale: markerSize,
                        action: location.action,
                        url: location.url,
                        newTab: location.newTab,
                        hovered: false,
                    })

                    if (location.pulse) {
                        const ringMaterial = new THREE.MeshBasicMaterial({
                            color: safeColor(location.color, "#FF4D00"),
                            transparent: true,
                            opacity: 0.72,
                            side: THREE.DoubleSide,
                            depthTest: true,
                            depthWrite: false,
                        })

                        const ring = new THREE.Mesh(
                            new THREE.RingGeometry(1.8, 2.15, mobile ? 24 : 40),
                            ringMaterial
                        )

                        ring.position.copy(localPosition)

                        ring.quaternion.setFromUnitVectors(
                            new THREE.Vector3(0, 0, 1),
                            localPosition.clone().normalize()
                        )

                        globeGroup.add(ring)

                        pulseRecords.push({
                            mesh: ring,
                            material: ringMaterial,
                            offset: index / Math.max(parsedLocations.length, 1),
                        })
                    }

                    if (location.showLabel) {
                        labelRecords.push({
                            element: createLabelElement(
                                location,
                                labelLayer,
                                landMask,
                                labelStyle,
                                oceanColor,
                                landColor
                            ),
                            localPosition: localPosition.clone(),
                        })
                    }
                })

                const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)

                const mainLight = new THREE.DirectionalLight(0xffffff, 0.85)

                mainLight.position.set(-150, 130, 260)

                const fillLight = new THREE.DirectionalLight(0xffffff, 0.18)

                fillLight.position.set(180, -90, 100)

                scene.add(ambientLight, mainLight, fillLight)

                function fitCamera() {
                    if (!renderer || !camera || !container) return

                    const nextWidth = Math.max(container.clientWidth, 1)

                    const nextHeight = Math.max(container.clientHeight, 1)

                    const previousBaseDistance = baseCameraDistance

                    const previousZoomRatio =
                        previousBaseDistance > 0
                            ? currentCameraDistance / previousBaseDistance
                            : 1

                    renderer.setSize(nextWidth, nextHeight, false)

                    camera.aspect = nextWidth / nextHeight

                    const verticalFov = THREE.MathUtils.degToRad(camera.fov)

                    const horizontalFov =
                        2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect)

                    const limitingFov = Math.min(verticalFov, horizontalFov)

                    const distance = 110 / Math.sin(limitingFov / 2)

                    baseCameraDistance = distance * 1.08

                    camera.position.set(0, 0, baseCameraDistance)
                    camera.updateProjectionMatrix()

                    const leftEdge = new THREE.Vector3(
                        -GLOBE_RADIUS,
                        0,
                        0
                    ).project(camera)

                    const rightEdge = new THREE.Vector3(
                        GLOBE_RADIUS,
                        0,
                        0
                    ).project(camera)

                    const initialGlobeWidth =
                        Math.abs(rightEdge.x - leftEdge.x) * 0.5 * nextWidth

                    const viewportWidth = Math.max(window.innerWidth, 1)

                    const minimumAllowedWidth =
                        initialGlobeWidth >= viewportWidth * 0.72
                            ? viewportWidth * 0.72
                            : initialGlobeWidth

                    const zoomOutRatio =
                        minimumAllowedWidth > 0
                            ? initialGlobeWidth / minimumAllowedWidth
                            : 1

                    maxCameraDistance =
                        baseCameraDistance * Math.max(1, zoomOutRatio)

                    currentCameraDistance = clamp(
                        baseCameraDistance * previousZoomRatio,
                        minimumCameraDistance,
                        maxCameraDistance
                    )

                    camera.position.z = currentCameraDistance
                }

                resizeObserver = new ResizeObserver(() => {
                    fitCamera()

                    if (isStaticRenderer && renderer && scene && camera) {
                        globeGroup?.updateMatrixWorld(true)
                        renderer.render(scene, camera)
                    }
                })

                resizeObserver.observe(container)
                fitCamera()

                const worldPosition = new THREE.Vector3()
                const projectedPosition = new THREE.Vector3()
                const cameraPosition = new THREE.Vector3()
                const normal = new THREE.Vector3()
                const toCamera = new THREE.Vector3()

                function updateLabels() {
                    if (
                        !camera ||
                        !globeGroup ||
                        !container ||
                        labelRecords.length === 0
                    ) {
                        return
                    }

                    const labelWidth = container.clientWidth
                    const labelHeight = container.clientHeight

                    camera.getWorldPosition(cameraPosition)

                    for (const record of labelRecords) {
                        worldPosition
                            .copy(record.localPosition)
                            .applyMatrix4(globeGroup.matrixWorld)

                        normal.copy(worldPosition).normalize()

                        toCamera
                            .copy(cameraPosition)
                            .sub(worldPosition)
                            .normalize()

                        const facing = normal.dot(toCamera)

                        if (facing <= 0.06) {
                            record.element.style.opacity = "0"
                            continue
                        }

                        projectedPosition.copy(worldPosition).project(camera)

                        const x = (projectedPosition.x * 0.5 + 0.5) * labelWidth

                        const y =
                            (-projectedPosition.y * 0.5 + 0.5) * labelHeight

                        const inside =
                            projectedPosition.z > -1 &&
                            projectedPosition.z < 1 &&
                            x > -100 &&
                            x < labelWidth + 100 &&
                            y > -50 &&
                            y < labelHeight + 50

                        if (!inside) {
                            record.element.style.opacity = "0"
                            continue
                        }

                        record.element.style.left = `${x}px`
                        record.element.style.top = `${y}px`
                        record.element.style.opacity = `${clamp(
                            facing * 1.8,
                            0,
                            1
                        )}`
                    }
                }

                function updatePopoverPosition() {
                    if (
                        !camera ||
                        !globeGroup ||
                        !renderer ||
                        !activeMarkerRef.current ||
                        !popoverRef.current
                    ) {
                        return
                    }

                    const record = activeMarkerRef.current
                    const element = popoverRef.current
                    const rect = renderer.domElement.getBoundingClientRect()

                    worldPosition
                        .copy(record.localPosition)
                        .applyMatrix4(globeGroup.matrixWorld)

                    projectedPosition.copy(worldPosition).project(camera)

                    const anchorX =
                        (projectedPosition.x * 0.5 + 0.5) * rect.width

                    const anchorY =
                        (-projectedPosition.y * 0.5 + 0.5) * rect.height

                    const width = element.offsetWidth
                    const height = element.offsetHeight
                    const gap = 16
                    const margin = 12

                    const roomRight = renderer.domElement.clientWidth - anchorX
                    const roomLeft = anchorX
                    const roomBottom =
                        renderer.domElement.clientHeight - anchorY

                    let placement: "right" | "left" | "bottom" | "top" = "right"

                    if (roomRight >= width + gap + margin) {
                        placement = "right"
                    } else if (roomLeft >= width + gap + margin) {
                        placement = "left"
                    } else if (roomBottom >= height + gap + margin) {
                        placement = "bottom"
                    } else {
                        placement = "top"
                    }

                    let left = anchorX + gap
                    let top = anchorY - height / 2

                    if (placement === "left") {
                        left = anchorX - width - gap
                        top = anchorY - height / 2
                    } else if (placement === "bottom") {
                        left = anchorX - width / 2
                        top = anchorY + gap
                    } else if (placement === "top") {
                        left = anchorX - width / 2
                        top = anchorY - height - gap
                    }

                    left = clamp(
                        left,
                        margin,
                        renderer.domElement.clientWidth - width - margin
                    )

                    top = clamp(
                        top,
                        margin,
                        renderer.domElement.clientHeight - height - margin
                    )

                    element.style.left = `${left}px`
                    element.style.top = `${top}px`
                    element.dataset.placement = placement
                }

                positionPopoverRef.current = updatePopoverPosition

                /*
                 * Static context:
                 * render exactly one frame.
                 * No requestAnimationFrame, drag, pulse animation
                 * or auto rotation.
                 */
                if (isStaticRenderer) {
                    globeGroup.updateMatrixWorld(true)
                    updateLabels()
                    renderer.render(scene, camera)

                    setStatus("ready")
                    return
                }

                visibilityObserver = new IntersectionObserver(
                    (entries) => {
                        visible = entries[0]?.isIntersecting ?? true
                    },
                    {
                        rootMargin: "100px",
                        threshold: 0,
                    }
                )

                visibilityObserver.observe(container)

                let dragging = false
                let pinching = false
                let pinchStartDistance = 0
                let pinchStartCameraDistance = 0
                let pointerStartX = 0
                let pointerStartY = 0
                let rotationStartX = 0
                let rotationStartY = 0
                let lastInteraction = performance.now()
                let hoveredMarker: MarkerRecord | null = null

                const raycaster = new THREE.Raycaster()
                const pointerNdc = new THREE.Vector2()
                const markerSprites = markerRecords.map(
                    (record) => record.sprite
                )
                const markerBySprite = new Map<THREE.Object3D, MarkerRecord>(
                    markerRecords.map((record) => [record.sprite, record])
                )
                const interactionWorldPosition = new THREE.Vector3()
                const interactionCameraPosition = new THREE.Vector3()
                const interactionNormal = new THREE.Vector3()
                const interactionToCamera = new THREE.Vector3()

                function getInteractiveMarker(
                    event: PointerEvent
                ): MarkerRecord | null {
                    if (
                        !renderer ||
                        !camera ||
                        !globeGroup ||
                        markerSprites.length === 0
                    ) {
                        return null
                    }

                    const rect = renderer.domElement.getBoundingClientRect()

                    if (rect.width <= 0 || rect.height <= 0) {
                        return null
                    }

                    pointerNdc.set(
                        ((event.clientX - rect.left) / rect.width) * 2 - 1,
                        -((event.clientY - rect.top) / rect.height) * 2 + 1
                    )

                    raycaster.setFromCamera(pointerNdc, camera)

                    const intersections = raycaster.intersectObjects(
                        markerSprites,
                        false
                    )

                    camera.getWorldPosition(interactionCameraPosition)

                    for (const intersection of intersections) {
                        const record = markerBySprite.get(intersection.object)

                        if (
                            !record ||
                            record.action === "none" ||
                            (record.action === "link" && !record.url) ||
                            (record.action === "popover" &&
                                !popoversRef.current[record.popoverSlotIndex])
                        ) {
                            continue
                        }

                        interactionWorldPosition
                            .copy(record.localPosition)
                            .applyMatrix4(globeGroup.matrixWorld)

                        interactionNormal
                            .copy(interactionWorldPosition)
                            .normalize()

                        interactionToCamera
                            .copy(interactionCameraPosition)
                            .sub(interactionWorldPosition)
                            .normalize()

                        if (interactionNormal.dot(interactionToCamera) > 0.06) {
                            return record
                        }
                    }

                    return null
                }

                function setHoveredMarker(nextMarker: MarkerRecord | null) {
                    if (hoveredMarker === nextMarker) return

                    if (hoveredMarker) {
                        hoveredMarker.hovered = false
                    }

                    hoveredMarker = nextMarker

                    if (hoveredMarker) {
                        hoveredMarker.hovered = true
                    }

                    if (renderer && !dragging) {
                        renderer.domElement.style.cursor = hoveredMarker
                            ? "pointer"
                            : "grab"
                    }
                }

                function runMarkerAction(marker: MarkerRecord) {
                    if (marker.action === "popover") {
                        const popoverContent =
                            popoversRef.current[marker.popoverSlotIndex]

                        if (!popoverContent) {
                            console.warn(
                                `[${BUILD_ID}] Popover ${
                                    marker.popoverSlotIndex + 1
                                } is not connected for Location ${
                                    marker.locationIndex + 1
                                }.`
                            )
                            return
                        }

                        activeMarkerRef.current = marker
                        activePopoverIndexRef.current = marker.popoverSlotIndex

                        setActivePopoverIndex(marker.popoverSlotIndex)

                        return
                    }

                    if (marker.action !== "link" || !marker.url) {
                        return
                    }

                    const safeUrl = getSafeHttpUrl(marker.url)

                    if (!safeUrl) {
                        console.warn(
                            `[${BUILD_ID}] Invalid URL. Only http:// and https:// URLs are supported.`
                        )
                        return
                    }

                    if (marker.newTab) {
                        const openedWindow = window.open(
                            safeUrl,
                            "_blank",
                            "noopener,noreferrer"
                        )

                        if (openedWindow) {
                            openedWindow.opener = null
                        }
                    } else {
                        window.location.assign(safeUrl)
                    }
                }

                function getTouchDistance(touches: TouchList) {
                    if (touches.length < 2) return 0

                    const first = touches[0]
                    const second = touches[1]

                    return Math.hypot(
                        second.clientX - first.clientX,
                        second.clientY - first.clientY
                    )
                }

                function onTouchStart(event: TouchEvent) {
                    if (!mobile || !camera || event.touches.length < 2) {
                        return
                    }

                    const distance = getTouchDistance(event.touches)

                    if (distance <= 0) return

                    event.preventDefault()

                    pinching = true
                    dragging = false
                    pinchStartDistance = distance
                    pinchStartCameraDistance =
                        currentCameraDistance || camera.position.z

                    lastInteraction = performance.now()
                    setHoveredMarker(null)

                    if (renderer) {
                        renderer.domElement.style.cursor = "grabbing"
                    }
                }

                function onTouchMove(event: TouchEvent) {
                    if (
                        !mobile ||
                        !pinching ||
                        !camera ||
                        event.touches.length < 2
                    ) {
                        return
                    }

                    const distance = getTouchDistance(event.touches)

                    if (distance <= 0 || pinchStartDistance <= 0) {
                        return
                    }

                    event.preventDefault()

                    const gestureScale = distance / pinchStartDistance

                    const nextDistance =
                        pinchStartCameraDistance / Math.max(gestureScale, 0.001)

                    currentCameraDistance = clamp(
                        nextDistance,
                        minimumCameraDistance,
                        Math.max(maxCameraDistance, baseCameraDistance)
                    )

                    camera.position.z = currentCameraDistance

                    lastInteraction = performance.now()
                }

                function finishPinch(event: TouchEvent) {
                    if (!pinching) return

                    if (event.touches.length >= 2) {
                        return
                    }

                    pinching = false
                    pinchStartDistance = 0
                    pinchStartCameraDistance = currentCameraDistance
                    lastInteraction = performance.now()

                    if (renderer) {
                        renderer.domElement.style.cursor = "grab"
                    }
                }

                function onPointerDown(event: PointerEvent) {
                    if (
                        !renderer ||
                        !globeGroup ||
                        pinching ||
                        activePopoverIndexRef.current !== null
                    )
                        return

                    dragging = true
                    pointerStartX = event.clientX
                    pointerStartY = event.clientY
                    rotationStartX = globeGroup.rotation.x
                    rotationStartY = globeGroup.rotation.y
                    lastInteraction = performance.now()

                    renderer.domElement.style.cursor = "grabbing"

                    renderer.domElement.setPointerCapture?.(event.pointerId)
                }

                function onPointerMove(event: PointerEvent) {
                    if (!globeGroup || pinching) return

                    if (activePopoverIndexRef.current !== null) {
                        setHoveredMarker(null)
                        return
                    }

                    if (!dragging) {
                        setHoveredMarker(getInteractiveMarker(event))
                        return
                    }

                    const deltaX = event.clientX - pointerStartX

                    const deltaY = event.clientY - pointerStartY

                    globeGroup.rotation.y = rotationStartY + deltaX * 0.006

                    if (!mobile) {
                        globeGroup.rotation.x = clamp(
                            rotationStartX + deltaY * 0.004,
                            -0.72,
                            0.72
                        )
                    }

                    lastInteraction = performance.now()
                }

                function finishPointer(
                    event: PointerEvent,
                    allowActivation: boolean
                ) {
                    if (!renderer) return

                    const movement = Math.hypot(
                        event.clientX - pointerStartX,
                        event.clientY - pointerStartY
                    )

                    dragging = false
                    lastInteraction = performance.now()

                    if (
                        renderer.domElement.hasPointerCapture?.(event.pointerId)
                    ) {
                        renderer.domElement.releasePointerCapture?.(
                            event.pointerId
                        )
                    }

                    const marker =
                        allowActivation && movement <= 7
                            ? getInteractiveMarker(event)
                            : null

                    setHoveredMarker(
                        allowActivation ? getInteractiveMarker(event) : null
                    )

                    if (marker) {
                        runMarkerAction(marker)
                    }
                }

                function onPointerUp(event: PointerEvent) {
                    finishPointer(event, true)
                }

                function onPointerCancel(event: PointerEvent) {
                    finishPointer(event, false)
                }

                function onPointerLeave(event: PointerEvent) {
                    if (dragging) {
                        finishPointer(event, false)
                    } else {
                        setHoveredMarker(null)
                    }
                }

                renderer.domElement.addEventListener(
                    "pointerdown",
                    onPointerDown
                )

                renderer.domElement.addEventListener(
                    "pointermove",
                    onPointerMove
                )

                renderer.domElement.addEventListener("pointerup", onPointerUp)

                renderer.domElement.addEventListener(
                    "pointercancel",
                    onPointerCancel
                )

                renderer.domElement.addEventListener(
                    "pointerleave",
                    onPointerLeave
                )

                renderer.domElement.addEventListener(
                    "touchstart",
                    onTouchStart,
                    { passive: false }
                )

                renderer.domElement.addEventListener("touchmove", onTouchMove, {
                    passive: false,
                })

                renderer.domElement.addEventListener("touchend", finishPinch, {
                    passive: true,
                })

                renderer.domElement.addEventListener(
                    "touchcancel",
                    finishPinch,
                    { passive: true }
                )
                ;(renderer.domElement as any).__orbitDotHandlers = {
                    onPointerDown,
                    onPointerMove,
                    onPointerUp,
                    onPointerCancel,
                    onPointerLeave,
                    onTouchStart,
                    onTouchMove,
                    finishPinch,
                }

                const clock = new THREE.Clock()

                function animate() {
                    if (
                        disposed ||
                        !renderer ||
                        !scene ||
                        !camera ||
                        !globeGroup
                    ) {
                        return
                    }

                    animationFrame = requestAnimationFrame(animate)

                    if (!visible) {
                        clock.getDelta()
                        return
                    }

                    const delta = Math.min(clock.getDelta(), 0.05)

                    const elapsed = clock.elapsedTime

                    if (
                        autoRotateRef.current &&
                        activePopoverIndexRef.current === null &&
                        !dragging &&
                        !pinching &&
                        performance.now() - lastInteraction > 300
                    ) {
                        globeGroup.rotation.y += delta * (mobile ? 0.12 : 0.18)
                    }

                    for (const marker of markerRecords) {
                        const targetScale =
                            marker.baseScale * (marker.hovered ? 1.18 : 1)

                        const currentScale = marker.sprite.scale.x

                        const nextScale = THREE.MathUtils.lerp(
                            currentScale,
                            targetScale,
                            Math.min(1, delta * 14)
                        )

                        marker.sprite.scale.set(nextScale, nextScale, 1)
                    }

                    for (const pulse of pulseRecords) {
                        const cycle = (elapsed * 0.72 + pulse.offset) % 1

                        pulse.mesh.scale.setScalar(0.75 + cycle * 2.6)

                        pulse.material.opacity = (1 - cycle) * 0.72
                    }

                    globeGroup.updateMatrixWorld(true)
                    updateLabels()
                    updatePopoverPosition()
                    renderer.render(scene, camera)
                }

                setStatus("ready")
                animate()
            } catch (error) {
                console.error(`[${BUILD_ID}]`, error)

                if (!disposed) {
                    setStatus("error")
                }
            }
        }

        initialize()

        return () => {
            disposed = true

            cancelAnimationFrame(animationFrame)

            resizeObserver?.disconnect()
            visibilityObserver?.disconnect()

            positionPopoverRef.current = null
            labelLayer.innerHTML = ""

            if (renderer) {
                const handlers = (renderer.domElement as any).__orbitDotHandlers

                if (handlers) {
                    renderer.domElement.removeEventListener(
                        "pointerdown",
                        handlers.onPointerDown
                    )

                    renderer.domElement.removeEventListener(
                        "pointermove",
                        handlers.onPointerMove
                    )

                    renderer.domElement.removeEventListener(
                        "pointerup",
                        handlers.onPointerUp
                    )

                    renderer.domElement.removeEventListener(
                        "pointercancel",
                        handlers.onPointerCancel
                    )

                    renderer.domElement.removeEventListener(
                        "pointerleave",
                        handlers.onPointerLeave
                    )

                    renderer.domElement.removeEventListener(
                        "touchstart",
                        handlers.onTouchStart
                    )

                    renderer.domElement.removeEventListener(
                        "touchmove",
                        handlers.onTouchMove
                    )

                    renderer.domElement.removeEventListener(
                        "touchend",
                        handlers.finishPinch
                    )

                    renderer.domElement.removeEventListener(
                        "touchcancel",
                        handlers.finishPinch
                    )
                }
            }

            if (scene) {
                disposeObject(scene)
                scene.clear()
            }

            renderer?.dispose()
            renderer?.forceContextLoss()

            if (
                renderer?.domElement &&
                renderer.domElement.parentElement === container
            ) {
                container.removeChild(renderer.domElement)
            }

            renderer = null
            scene = null
            camera = null
            globeGroup = null
        }
    }, [
        oceanColor,
        landColor,
        dotSize,
        dotDensity,
        labelStyle,
        locationsKey,
        isStaticRenderer,
    ])

    return (
        <div
            ref={containerRef}
            data-build={BUILD_ID}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 1,
                minHeight: 1,
                overflow: "visible",
                background: "transparent",
                isolation: "isolate",
                ...style,
            }}
        >
            {showQuickStart && isStaticRenderer && (
                <div
                    style={{
                        position: "absolute",
                        left: 16,
                        top: 16,
                        zIndex: 30,
                        width: "min(380px, calc(100% - 32px))",
                        padding: "18px 20px",
                        borderRadius: 16,
                        background: "rgba(18,18,18,0.94)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.28)",
                        color: "#FFFFFF",
                        fontFamily:
                            'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            marginBottom: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            opacity: 0.64,
                        }}
                    >
                        OrbitDot Globe
                    </div>

                    <div
                        style={{
                            marginBottom: 14,
                            fontSize: 14,
                            fontWeight: 700,
                            lineHeight: 1.3,
                        }}
                    >
                        Quick Start — How to use Popovers
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gap: 12,
                            fontSize: 11,
                            lineHeight: 1.5,
                            opacity: 0.9,
                        }}
                    >
                        <div>
                            <strong>1. Choose a location</strong>
                            <br />
                            Open a Location item and set its
                            <strong> Action</strong> to
                            <strong> Open Popover</strong>.
                        </div>

                        <div>
                            <strong>2. Connect your popovers</strong>
                            <br />
                            In the main component settings, add your custom
                            Framer components inside
                            <strong> Connect Popovers ↓</strong>.
                        </div>

                        <div>
                            <strong>3. Automatic matching</strong>
                            <br />
                            Popovers are matched automatically in the same order
                            as the locations using
                            <strong> Open Popover</strong>.
                        </div>

                        <div
                            style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            <strong>Example</strong>
                            <br />
                            London → London Card
                            <br />
                            Tokyo → Tokyo Card
                            <br />
                            Paris → Paris Card
                            <br />
                            <span
                                style={{
                                    display: "inline-block",
                                    marginTop: 6,
                                    opacity: 0.72,
                                }}
                            >
                                If London is the first location using Open
                                Popover, it will use the first connected
                                Popover.
                            </span>
                        </div>

                        <div>
                            <strong>Notes</strong>
                            <br />
                            • Popovers pause the globe rotation while open.
                            <br />
                            • Click outside the popover to close it.
                            <br />• Open Link and Open Popover can be mixed
                            freely.
                        </div>

                        <div
                            style={{
                                paddingTop: 10,
                                borderTop: "1px solid rgba(255,255,255,0.12)",
                                fontSize: 10,
                                lineHeight: 1.45,
                                opacity: 0.68,
                            }}
                        >
                            This Quick Start is only visible in the Framer
                            Editor/Canvas and will not appear on your published
                            website.
                        </div>
                    </div>
                </div>
            )}

            <div
                ref={labelLayerRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            />

            {!isStaticRenderer &&
                activePopoverIndex !== null &&
                popovers[activePopoverIndex] && (
                    <div
                        onPointerDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closePopover()
                            }
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 20,
                            pointerEvents: "auto",
                            overflow: "visible",
                        }}
                    >
                        <div
                            ref={popoverRef}
                            role="dialog"
                            aria-label="Location details"
                            tabIndex={-1}
                            onFocus={(event) => {
                                event.currentTarget.style.outline = "none"
                            }}
                            onPointerDown={(event) => event.stopPropagation()}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                opacity: 1,
                                transform: "scale(1)",
                                transformOrigin: "center",
                                pointerEvents: "auto",
                                maxWidth: "calc(100% - 24px)",
                                maxHeight: "calc(100% - 24px)",
                                outline: "none",
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            {popovers[activePopoverIndex]}
                        </div>
                    </div>
                )}

            <StatusMessage status={status} color={landColor} />
        </div>
    )
}

OrbitDotGlobe.defaultProps = {
    oceanColor: "#F4F4F1",
    landColor: "#171717",
    dotSize: 1.8,
    dotDensity: 3,
    autoRotate: true,
    labelStyle: "auto",
    showQuickStart: false,
    locations: [],
    popovers: [],
}

addPropertyControls(OrbitDotGlobe, {
    oceanColor: {
        type: ControlType.Color,
        title: "Ocean",
        defaultValue: "#F4F4F1",
    },

    landColor: {
        type: ControlType.Color,
        title: "Land",
        defaultValue: "#171717",
    },

    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 1.8,
        min: 0.6,
        max: 4.5,
        step: 0.1,
        displayStepper: true,
    },

    dotDensity: {
        type: ControlType.Number,
        title: "Density",
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
    },

    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    labelStyle: {
        type: ControlType.Enum,
        title: "Label Style",
        options: ["auto", "marker"],
        optionTitles: ["Auto Contrast", "Marker Color"],
        defaultValue: "auto",
    },

    showQuickStart: {
        type: ControlType.Boolean,
        title: "Quick Start",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    // GUIDE: 1st location using Open Popover → 1st connected Popover
    // 2nd location using Open Popover → 2nd connected Popover
    // Connect popovers in the same order as locations
    // whose Action is set to Open Popover.
    popovers: {
        type: ControlType.Array,
        title: "Connect Popovers ↓",
        control: {
            type: ControlType.ComponentInstance,
        },
        maxCount: 20,
    },

    locations: {
        type: ControlType.Array,
        title: "Locations",
        maxCount: 20,
        defaultValue: [],

        control: {
            type: ControlType.Object,

            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "",
                    placeholder: "Location name",
                },

                coordinates: {
                    type: ControlType.String,
                    title: "Coordinates",
                    defaultValue: "",
                    placeholder: "51.530157890229276, -0.13249800763110262",
                },

                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#FF4D00",
                },

                pulse: {
                    type: ControlType.Boolean,
                    title: "Pulse",
                    defaultValue: true,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },

                showLabel: {
                    type: ControlType.Boolean,
                    title: "Label",
                    defaultValue: true,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                },

                action: {
                    type: ControlType.Enum,
                    title: "Action",
                    options: ["none", "link", "popover"],
                    optionTitles: ["None", "Open Link", "Open Popover"],
                    defaultValue: "none",
                },

                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "",
                    placeholder: "https://example.com",
                    hidden(props) {
                        return props.action !== "link"
                    },
                },

                newTab: {
                    type: ControlType.Boolean,
                    title: "Open In",
                    defaultValue: true,
                    enabledTitle: "New Tab",
                    disabledTitle: "Same Tab",
                    hidden(props) {
                        return props.action !== "link"
                    },
                },
            },
        },
    },
})
