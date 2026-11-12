import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView, useAnimationFrame } from "framer-motion"

interface MyComponentProps {
    images: Array<{ src?: string; srcSet?: string; alt?: string }>
    background: string
    style?: CSSProperties

    // Grouped Objects untuk Modals/Foldering di panel Framer
    itemSettings: {
        width: number
        height: number
        radius: number
        imageFit: "cover" | "contain" | "fill"
        shadow: unknown
    }
    orbitSettings: {
        radiusX: number
        radiusY: number
        depth: number
        overlap: number
        tilt: number
    }
    playSettings: {
        speed: number
        direction: "rtl" | "ltr"
        loop: boolean
        pauseOnHover: boolean
        cursorInteraction: boolean
    }
}

const DEFAULT_IMAGES: Array<{ src?: string; srcSet?: string; alt?: string }> = [
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Green",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Yellow",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Orange",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Purple",
    },
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Blue",
    },
]

const FALLBACK_CARD_SHADOW = "0px 12px 30px rgba(0, 0, 0, 0.18)"

// --- Utility Functions ---
function toLength(value: unknown, fallback: number): string {
    if (typeof value === "number" && Number.isFinite(value)) return `${value}px`
    if (typeof value === "string" && value.trim().length > 0) return value
    return `${fallback}px`
}

function normalizeSingleShadow(value: unknown): string | null {
    if (typeof value === "string") {
        const normalized = value.trim()
        return normalized.length > 0 ? normalized : null
    }
    if (!value || typeof value !== "object") return null
    const record = value as Record<string, unknown>
    if (
        typeof record.boxShadow === "string" &&
        record.boxShadow.trim().length > 0
    )
        return record.boxShadow.trim()

    const x = toLength(record.x ?? record.offsetX ?? record.horizontal, 0)
    const y = toLength(record.y ?? record.offsetY ?? record.vertical, 12)
    const blur = toLength(record.blur ?? record.blurRadius, 30)
    const spread = toLength(record.spread ?? record.spreadRadius, 0)
    const color =
        typeof record.color === "string" && record.color.trim().length > 0
            ? record.color
            : "rgba(0, 0, 0, 0.18)"
    const inset =
        record.inset === true ||
        record.type === "inner" ||
        record.shadowType === "inner"
            ? "inset "
            : ""
    return `${inset}${x} ${y} ${blur} ${spread} ${color}`
}

function normalizeBoxShadow(value: unknown): string {
    if (Array.isArray(value)) {
        const normalized = value
            .map(normalizeSingleShadow)
            .filter((item): item is string => Boolean(item))
        return normalized.length > 0
            ? normalized.join(", ")
            : FALLBACK_CARD_SHADOW
    }
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>
        if (Array.isArray(record.shadows)) {
            const normalized = record.shadows
                .map(normalizeSingleShadow)
                .filter((item): item is string => Boolean(item))
            return normalized.length > 0
                ? normalized.join(", ")
                : FALLBACK_CARD_SHADOW
        }
    }
    return normalizeSingleShadow(value) ?? FALLBACK_CARD_SHADOW
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function OrbitCarouselImages(props: MyComponentProps) {
    const {
        images = DEFAULT_IMAGES,
        background = "transparent",
        style,
        itemSettings,
        orbitSettings,
        playSettings,
    } = props

    // Ekstraksi nilai dengan fallback aman
    const itemWidth = itemSettings?.width ?? 200
    const itemHeight = itemSettings?.height ?? 280
    const borderRadius = itemSettings?.radius ?? 16
    const imageFit = itemSettings?.imageFit ?? "cover"
    const cardShadow = itemSettings?.shadow ?? FALLBACK_CARD_SHADOW

    const radiusX = orbitSettings?.radiusX ?? 250
    const radiusY = orbitSettings?.radiusY ?? 100
    const depthStrength = orbitSettings?.depth ?? 0.45
    const overlap = orbitSettings?.overlap ?? 0.8
    const tiltIntensity = orbitSettings?.tilt ?? 25

    const speed = playSettings?.speed ?? 1.0
    const direction = playSettings?.direction ?? "rtl"
    const loop = playSettings?.loop ?? true
    const pauseOnHover = playSettings?.pauseOnHover ?? true
    const cursorInteraction = playSettings?.cursorInteraction ?? true

    const rootRef = useRef<HTMLDivElement | null>(null)
    const isInView = useInView(rootRef, { margin: "200px" })
    const isStatic = useIsStaticRenderer()

    const [combinedAngle, setCombinedAngle] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [isDraggingUI, setIsDraggingUI] = useState(false)

    const orbitAngleRef = useRef(0)
    const currentDragOffsetRef = useRef(0)
    const targetDragOffsetRef = useRef(0)
    const dragVelocityRef = useRef(0)

    const dragStartXRef = useRef(0)
    const dragStartYRef = useRef(0)
    const dragStartOffsetRef = useRef(0)
    const isDraggingRef = useRef(false)
    const isHoveredRef = useRef(false)

    useEffect(() => {
        isHoveredRef.current = isHovered
    }, [isHovered])

    const activeImages = useMemo(() => {
        return Array.isArray(images) && images.length > 0
            ? images
            : DEFAULT_IMAGES
    }, [images])

    const normalizedCardShadow = useMemo(
        () => normalizeBoxShadow(cardShadow),
        [cardShadow]
    )
    const directionSign = direction === "rtl" ? 1 : -1

    useAnimationFrame((time, delta) => {
        const dt = Math.min(delta / 1000, 0.05)
        const isDragging = isDraggingRef.current
        const isPlaying =
            loop &&
            !isStatic &&
            isInView &&
            (!pauseOnHover || !isHoveredRef.current) &&
            !isDragging

        if (isPlaying) {
            orbitAngleRef.current += speed * dt * directionSign
        }

        if (isDragging) {
            dragVelocityRef.current =
                (targetDragOffsetRef.current - currentDragOffsetRef.current) *
                0.2
            currentDragOffsetRef.current += dragVelocityRef.current
        } else {
            dragVelocityRef.current *= 0.93
            currentDragOffsetRef.current += dragVelocityRef.current
            targetDragOffsetRef.current = currentDragOffsetRef.current
        }

        setCombinedAngle(orbitAngleRef.current + currentDragOffsetRef.current)
    })

    const onPointerDown = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!cursorInteraction || activeImages.length <= 1) return
            dragStartXRef.current = event.clientX
            dragStartYRef.current = event.clientY
            dragStartOffsetRef.current = targetDragOffsetRef.current
            isDraggingRef.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
            startTransition(() => setIsDraggingUI(true))
        },
        [activeImages.length, cursorInteraction]
    )

    const onPointerMove = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!cursorInteraction || !isDraggingRef.current) return
            const deltaX = event.clientX - dragStartXRef.current
            const deltaY = event.clientY - dragStartYRef.current

            const horizontal = deltaX / Math.max(radiusX, 1)
            const vertical = deltaY / Math.max(radiusY, 1)

            targetDragOffsetRef.current =
                dragStartOffsetRef.current + horizontal * 2.5 + vertical * 1.0
        },
        [cursorInteraction, radiusX, radiusY]
    )

    const stopDragging = useCallback(
        (event?: ReactPointerEvent<HTMLDivElement>) => {
            if (!isDraggingRef.current) return
            if (event)
                event.currentTarget.releasePointerCapture(event.pointerId)
            isDraggingRef.current = false
            startTransition(() => setIsDraggingUI(false))
        },
        []
    )

    const cards = useMemo(() => {
        const count = activeImages.length
        if (count === 0) return null

        const step = (Math.PI * 2) / count
        const overlapInfluence = Math.max(0, Math.min(1, overlap))

        return activeImages.map((image, index) => {
            const angle = combinedAngle + index * step

            const x = Math.cos(angle) * radiusX
            const y = Math.sin(angle) * radiusY
            const zNormalized = (Math.sin(angle) + 1) / 2
            const zTranslate = (zNormalized - 0.5) * (depthStrength * 200)

            const depthScale =
                1 - (1 - zNormalized) * depthStrength * overlapInfluence
            const opacity = 0.4 + zNormalized * 0.6
            const zIndex = Math.round(zNormalized * 1000)

            const rotateY = Math.cos(angle) * -tiltIntensity
            const rotateX = Math.sin(angle) * (tiltIntensity * 0.2)

            return (
                <div
                    key={`${image.src ?? "image"}-${index}`}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: itemWidth,
                        height: itemHeight,
                        transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${zTranslate}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${depthScale})`,
                        transformOrigin: "center center",
                        borderRadius,
                        overflow: "hidden",
                        boxShadow: normalizedCardShadow,
                        opacity,
                        zIndex,
                        background: "#F5F5F5",
                        willChange: "transform, opacity",
                        backfaceVisibility: "visible",
                    }}
                >
                    <img
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt || ""}
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: imageFit,
                            display: "block",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                    />
                </div>
            )
        })
    }, [
        activeImages,
        borderRadius,
        normalizedCardShadow,
        depthStrength,
        combinedAngle,
        imageFit,
        itemHeight,
        itemWidth,
        overlap,
        radiusX,
        radiusY,
        tiltIntensity,
    ])

    return (
        <div
            ref={rootRef}
            role="region"
            aria-label="Orbit 3D Carousel"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            onPointerLeave={stopDragging}
            onMouseEnter={() => startTransition(() => setIsHovered(true))}
            onMouseLeave={() => startTransition(() => setIsHovered(false))}
            style={{
                ...style,
                width: style?.width ?? "100%",
                height: style?.height ?? "100%",
                position: "relative",
                overflow: "visible",
                background,
                perspective: "1200px",
                transformStyle: "preserve-3d",
                cursor: cursorInteraction
                    ? isDraggingUI
                        ? "grabbing"
                        : "grab"
                    : "default",
                touchAction: cursorInteraction ? "none" : "auto",
            }}
        >
            {cards}
        </div>
    )
}

// --- PROPERTY CONTROLS ---
addPropertyControls(OrbitCarouselImages, {
    images: {
        type: ControlType.Array,
        title: "Content",
        control: { type: ControlType.ResponsiveImage },
        defaultValue: DEFAULT_IMAGES,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },

    // --- FOLDERING/MODALS UNTUK ITEM ---
    itemSettings: {
        type: ControlType.Object,
        title: "Item Style",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                min: 40,
                max: 800,
                step: 1,
                defaultValue: 200,
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                min: 40,
                max: 800,
                step: 1,
                defaultValue: 280,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 16,
            },
            imageFit: {
                type: ControlType.Enum,
                title: "Image Fit",
                options: ["cover", "contain", "fill"],
                optionTitles: ["Cover", "Contain", "Fill"],
                defaultValue: "cover",
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue: FALLBACK_CARD_SHADOW,
            },
        },
        defaultValue: {
            width: 200,
            height: 280,
            radius: 16,
            imageFit: "cover",
            shadow: FALLBACK_CARD_SHADOW,
        },
    },

    // --- FOLDERING/MODALS UNTUK ORBIT 3D ---
    orbitSettings: {
        type: ControlType.Object,
        title: "Orbit 3D",
        controls: {
            radiusX: {
                type: ControlType.Number,
                title: "Radius X",
                min: 10,
                max: 1000,
                step: 1,
                defaultValue: 250,
            },
            radiusY: {
                type: ControlType.Number,
                title: "Radius Y",
                min: 10,
                max: 1000,
                step: 1,
                defaultValue: 100,
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.45,
            },
            overlap: {
                type: ControlType.Number,
                title: "Overlap",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.8,
            },
            tilt: {
                type: ControlType.Number,
                title: "3D Tilt",
                min: 0,
                max: 90,
                step: 1,
                defaultValue: 25,
            },
        },
        defaultValue: {
            radiusX: 250,
            radiusY: 100,
            depth: 0.45,
            overlap: 0.8,
            tilt: 25,
        },
    },

    // --- FOLDERING/MODALS UNTUK PLAYBACK ---
    playSettings: {
        type: ControlType.Object,
        title: "Playback",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 6,
                step: 0.1,
                defaultValue: 1.0,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["rtl", "ltr"],
                optionTitles: ["Right to Left", "Left to Right"],
                defaultValue: "rtl",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            cursorInteraction: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
        defaultValue: {
            speed: 1.0,
            direction: "rtl",
            loop: true,
            pauseOnHover: true,
            cursorInteraction: true,
        },
    },
})
