// Cursor Image Trail Effect Component for Framer
// Features: Mouse tracking, hover activation, image cycling, trail history, smooth animation, full customization
import {
    useRef,
    useState,
    useEffect,
    useCallback,
    useMemo,
    startTransition,
    type CSSProperties,
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


const defaultImages = [
    { src: "https://framerusercontent.com/images/0zT6a3dKxctRPuHNghnTWbjVs9c.jpg", alt: "Blur 1" },
    { src: "https://framerusercontent.com/images/WyAn5EAh2BKICJ24OrNJeZnBbQ.jpg", alt: "Blur 2" },
    { src: "https://framerusercontent.com/images/tEoFxDZ1dCYiC7xR0kfQJv6tfqc.jpg", alt: "Blur 3" },
    { src: "https://framerusercontent.com/images/bsqbarLgTfOm22gOukhRbsvO0A4.jpg", alt: "Blur 4" },
    { src: "https://framerusercontent.com/images/AAvkv8AjE00DpxBt8wiCgdAxdjE.jpg", alt: "Blur 5" },
    { src: "https://framerusercontent.com/images/uVR81SOnXD3FhNVREKU3wjqBKo.jpg", alt: "Blur 6" },
    { src: "https://framerusercontent.com/images/uhwo0eNsxMfKUxZ2EvBSvqAs8.jpg", alt: "Blur 7" },
    { src: "https://framerusercontent.com/images/dJzfYAZYnIt9E7pkSXCh0Jncs.jpg", alt: "Blur 8" },
]

const ENTRANCE_ANIMATIONS = {
    fade: { opacity: [0, 1] },
    scale: { scale: [0.7, 1], opacity: [0, 1] },
    rotate: { rotate: [-45, 0], opacity: [0, 1] },
    slide: { y: [20, 0], opacity: [0, 1] },
    bounce: { scale: [0.7, 1.1, 1], opacity: [0, 1] },
}
const EXIT_ANIMATIONS = {
    fade: { opacity: [1, 0] },
    scale: { scale: [1, 0.7], opacity: [1, 0] },
    rotate: { rotate: [0, 45], opacity: [1, 0] },
    dissolve: { filter: ["blur(0px)", "blur(8px)"], opacity: [1, 0] },
    shrink: { scale: [1, 0], opacity: [1, 0] },
}
const BLEND_MODES = ["normal", "multiply", "screen", "overlay"]

function lerp(a, b, t) {
    return a + (b - a) * t
}

function getRandomBetween(min, max) {
    return Math.random() * (max - min) + min
}

/**
 * CursorImageTrail
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CursorImageTrail(props) {
    const {
        images = defaultImages,
        trailLength = 6,
        imageSize = 80,
        entranceEffect = "fade",
        exitEffect = "fade",
        animationDuration = 0.6,
        rotationEnabled = false,
        rotationRange = 30,
        opacityMin = 0.2,
        opacityMax = 1,
        spawnRate = 1,
        randomOffsetEnabled = false,
        randomOffsetRange = 20,
        blendMode = "normal",
        hoverOnly = true,
        blurEnabled = false,
        scaleVariation = false,
        clickBehavior = "none",
        style,
        children,
    } = props

    const containerRef = useRef(null)
    const [isHovering, setIsHovering] = useState(false)
    const [trail, setTrail] = useState([])
    const [lastSpawn, setLastSpawn] = useState(0)
    const [frozen, setFrozen] = useState(false)
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
    const [imageIdx, setImageIdx] = useState(0)
    const isStatic = useIsStaticRenderer()
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

    // Update window size for boundary detection
    useEffect(() => {
        if (typeof window !== "undefined") {
            function handleResize() {
                setWindowSize({ width: window.innerWidth, height: window.innerHeight })
            }
            handleResize()
            window.addEventListener("resize", handleResize)
            return () => window.removeEventListener("resize", handleResize)
        }
    }, [])

    // Mouse move handler
    const handleMouseMove = useCallback(
        (e) => {
            if (!isHovering || frozen || isStatic) return
            const now = Date.now()
            if (now - lastSpawn < 1000 / Math.max(1, spawnRate)) return
            setLastSpawn(now)
            let x = e.clientX
            let y = e.clientY
            // Clamp to viewport
            x = Math.max(0, Math.min(x, windowSize.width - imageSize))
            y = Math.max(0, Math.min(y, windowSize.height - imageSize))
            // Random offset
            if (randomOffsetEnabled) {
                x += getRandomBetween(-randomOffsetRange, randomOffsetRange)
                y += getRandomBetween(-randomOffsetRange, randomOffsetRange)
            }
            // Add new trail item
            setTrail((prev) => {
                const next = [
                    {
                        x,
                        y,
                        key: now + Math.random(),
                        image: images[imageIdx % images.length],
                        created: now,
                        rotation: rotationEnabled ? getRandomBetween(-rotationRange, rotationRange) : 0,
                        scale: scaleVariation ? getRandomBetween(0.7, 1.2) : 1,
                    },
                    ...prev,
                ].slice(0, trailLength)
                return next
            })
            setImageIdx((idx) => (idx + 1) % images.length)
            setLastPos({ x, y })
        },
        [isHovering, frozen, isStatic, lastSpawn, spawnRate, images, imageIdx, imageSize, randomOffsetEnabled, randomOffsetRange, rotationEnabled, rotationRange, scaleVariation, trailLength, windowSize],
    )

    // Mouse leave handler
    const handleMouseLeave = useCallback(() => {
        setIsHovering(false)
        setTrail([])
    }, [])

    // Mouse enter handler
    const handleMouseEnter = useCallback(() => {
        setIsHovering(true)
    }, [])

    // Click behavior
    const handleClick = useCallback(() => {
        if (clickBehavior === "freeze") {
            setFrozen((f) => !f)
        } else if (clickBehavior === "scatter") {
            setTrail((prev) =>
                prev.map((item) => ({
                    ...item,
                    x: getRandomBetween(0, windowSize.width - imageSize),
                    y: getRandomBetween(0, windowSize.height - imageSize),
                })),
            )
        }
    }, [clickBehavior, windowSize, imageSize])

    // Remove old trail items
    useEffect(() => {
        if (frozen || isStatic) return
        if (!isHovering) return
        const interval = setInterval(() => {
            setTrail((prev) => prev.filter((item, i) => i < trailLength))
        }, 100)
        return () => clearInterval(interval)
    }, [frozen, isStatic, isHovering, trailLength])

    // Inactive state: fade out trail when not moving
    useEffect(() => {
        if (frozen || isStatic) return
        if (!isHovering) return
        let timeout = setTimeout(() => setTrail([]), 1200)
        return () => clearTimeout(timeout)
    }, [trail, isHovering, frozen, isStatic])

    // Mobile fallback: tap to spawn images
    useEffect(() => {
        if (typeof window === "undefined") return
        const isTouch = "ontouchstart" in window
        if (!isTouch) return
        const handleTouch = (e) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const touches = e.touches[0]
            let x = touches.clientX
            let y = touches.clientY
            x = Math.max(0, Math.min(x, windowSize.width - imageSize))
            y = Math.max(0, Math.min(y, windowSize.height - imageSize))
            setTrail((prev) => [
                {
                    x,
                    y,
                    key: Date.now() + Math.random(),
                    image: images[imageIdx % images.length],
                    created: Date.now(),
                    rotation: rotationEnabled ? getRandomBetween(-rotationRange, rotationRange) : 0,
                    scale: scaleVariation ? getRandomBetween(0.7, 1.2) : 1,
                },
                ...prev,
            ].slice(0, trailLength))
            setImageIdx((idx) => (idx + 1) % images.length)
        }
        containerRef.current?.addEventListener("touchstart", handleTouch)
        return () => containerRef.current?.removeEventListener("touchstart", handleTouch)
    }, [images, imageIdx, imageSize, trailLength, windowSize, rotationEnabled, rotationRange, scaleVariation])

    // Animation style helpers
    const getEntranceStyle = (i) => {
        const preset = ENTRANCE_ANIMATIONS[entranceEffect] || ENTRANCE_ANIMATIONS.fade
        const t = 1 - i / Math.max(1, trail.length - 1)
        const duration = animationDuration * 1000
        const delay = i * (duration / trailLength) * 0.5
        return {
            transition: `all ${animationDuration}s cubic-bezier(.4,0,.2,1) ${delay}ms`,
            opacity: lerp(opacityMin, opacityMax, t),
            zIndex: 100 + i,
            pointerEvents: "none" as const,
            filter: blurEnabled ? `blur(${Math.max(0, 8 * (1 - t))}px)` : undefined,
            mixBlendMode: blendMode as CSSProperties["mixBlendMode"],
        }
    }

    // Main render
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: hoverOnly ? "pointer" : "default",
                touchAction: "none",
            }}
            onMouseMove={hoverOnly ? handleMouseMove : undefined}
            onMouseLeave={hoverOnly ? handleMouseLeave : undefined}
            onMouseEnter={hoverOnly ? handleMouseEnter : undefined}
            onClick={handleClick}
            tabIndex={0}
            aria-label="Cursor image trail area"
        >
            {children}
            {trail.map((item, i) => (
                <img
                    key={item.key}
                    src={item.image?.src}
                    alt={item.image?.alt || "trail"}
                    style={{
                        position: "fixed",
                        left: item.x,
                        top: item.y,
                        width: imageSize,
                        height: imageSize,
                        objectFit: "cover",
                        borderRadius: 8,
                        transform: `translate(-50%,-50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                        ...getEntranceStyle(i),
                    }}
                    draggable={false}
                />
            ))}
        </div>
    )
}

addPropertyControls(CursorImageTrail, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.String, title: "Image URL", defaultValue: defaultImages[0].src },
                alt: { type: ControlType.String, title: "Alt", defaultValue: "Trail Image" },
            },
        },
        defaultValue: defaultImages,
        maxCount: 10,
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        min: 1,
        max: 10,
        defaultValue: 6,
        step: 1,
        unit: "",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        min: 24,
        max: 200,
        defaultValue: 80,
        step: 1,
        unit: "px",
    },
    entranceEffect: {
        type: ControlType.Enum,
        title: "Entrance Effect",
        options: ["fade", "scale", "rotate", "slide", "bounce"],
        optionTitles: ["Fade In", "Scale Up", "Rotate In", "Slide In", "Bounce In"],
        defaultValue: "fade",
    },
    exitEffect: {
        type: ControlType.Enum,
        title: "Exit Effect",
        options: ["fade", "scale", "rotate", "dissolve", "shrink"],
        optionTitles: ["Fade Out", "Scale Down", "Rotate Out", "Dissolve", "Shrink Away"],
        defaultValue: "fade",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Anim Duration",
        min: 0.2,
        max: 2,
        step: 0.05,
        defaultValue: 0.6,
        unit: "s",
    },
    rotationEnabled: {
        type: ControlType.Boolean,
        title: "Random Rotation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    rotationRange: {
        type: ControlType.Number,
        title: "Rotation Range",
        min: 0,
        max: 180,
        step: 1,
        defaultValue: 30,
        unit: "°",
        hidden: ({ rotationEnabled }) => !rotationEnabled,
    },
    opacityMin: {
        type: ControlType.Number,
        title: "Opacity Min",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.2,
    },
    opacityMax: {
        type: ControlType.Number,
        title: "Opacity Max",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
    },
    spawnRate: {
        type: ControlType.Number,
        title: "Spawn Rate",
        min: 1,
        max: 60,
        step: 1,
        defaultValue: 12,
        unit: "Hz",
    },
    randomOffsetEnabled: {
        type: ControlType.Boolean,
        title: "Random Offset",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    randomOffsetRange: {
        type: ControlType.Number,
        title: "Offset Range",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 20,
        unit: "px",
        hidden: ({ randomOffsetEnabled }) => !randomOffsetEnabled,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: BLEND_MODES,
        optionTitles: BLEND_MODES.map((m) => m.charAt(0).toUpperCase() + m.slice(1)),
        defaultValue: "normal",
    },
    blurEnabled: {
        type: ControlType.Boolean,
        title: "Motion Blur",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scaleVariation: {
        type: ControlType.Boolean,
        title: "Scale Variation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverOnly: {
        type: ControlType.Boolean,
        title: "Hover Only",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    clickBehavior: {
        type: ControlType.Enum,
        title: "Click Behavior",
        options: ["none", "freeze", "scatter"],
        optionTitles: ["None", "Freeze Trail", "Scatter Images"],
        defaultValue: "none",
    },
})
