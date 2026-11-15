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
} from "framer-motion"
import {
    type CSSProperties,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react"

/**
 * X-Ray Hover Effect
 *
 * A component that reveals a second image underneath the first one based on cursor position.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function XRayHover(props: any) {
    const {
        topImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Top Layer",
        },
        bottomImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "X-Ray Layer",
        },
        revealSize = 150,
        softness = 20,
        isStatic = false,
        defaultX = 50,
        defaultY = 50,
        smoothing = true,
        frameRate = 60,
        zoom = 1,
        revealDirection = "cursor",
        revealColor = "rgba(0, 0, 0, 0)",
        cursorIcon = "crosshair",
        customCursor,
        showLens = false,
        lensColor = "#FFFFFF",
        lensWidth = 2,
        style,
    } = props

    const containerRef = useRef(null)
    const lastUpdate = useRef(0)
    const isStaticRenderer = useIsStaticRenderer()
    const [isActive, setIsActive] = useState(false)
    const [topImageError, setTopImageError] = useState(false)
    const [bottomImageError, setBottomImageError] = useState(false)

    // Reset error states when image sources change
    useEffect(() => {
        setTopImageError(false)
    }, [topImage?.src])

    useEffect(() => {
        setBottomImageError(false)
    }, [bottomImage?.src])

    // Motion values for mouse position (0-1 range relative to container)
    const mouseX = useMotionValue(0.5)
    const mouseY = useMotionValue(0.5)

    // Smooth out the movement
    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 }
    const smoothX = useSpring(mouseX, springConfig)
    const smoothY = useSpring(mouseY, springConfig)

    const activeX = smoothing ? smoothX : mouseX
    const activeY = smoothing ? smoothY : mouseY

    const lensX = useTransform(activeX, (x) => `${x * 100}%`)
    const lensY = useTransform(activeY, (y) => `${y * 100}%`)

    // Reveal Animation Logic
    const shouldReveal = isActive || isStatic
    const revealProgress = useSpring(
        shouldReveal ? 1 : 0,
        { stiffness: 2000, damping: 50 }
    )

    const currentRadius = useTransform(
        revealProgress,
        [0, 1],
        [0, revealSize / 2]
    )
    const opacity = useTransform(revealProgress, [0, 0.05], [0, 1])

    const maskImage = useTransform(
        [activeX, activeY, currentRadius],
        ([x, y, r]: any) => {
            const xPct = x * 100
            const yPct = y * 100

            switch (revealDirection) {
                case "leftToRight":
                    return `linear-gradient(to right, black 0%, black ${xPct}%, transparent calc(${xPct}% + ${softness}px))`
                case "rightToLeft":
                    return `linear-gradient(to left, black 0%, black ${100 - xPct}%, transparent calc(${100 - xPct}% + ${softness}px))`
                case "topToBottom":
                    return `linear-gradient(to bottom, black 0%, black ${yPct}%, transparent calc(${yPct}% + ${softness}px))`
                case "bottomToTop":
                    return `linear-gradient(to top, black 0%, black ${100 - yPct}%, transparent calc(${100 - yPct}% + ${softness}px))`
                case "cursor":
                default:
                    return `radial-gradient(circle at ${xPct}% ${yPct}%, black 0%, black ${r}px, transparent ${r + softness}px)`
            }
        }
    )

    const throttleMs = 1000 / frameRate

    const handleMouseMove = useCallback(
        (e) => {
            if (!containerRef.current) return

            const now = Date.now()
            if (now - lastUpdate.current < throttleMs) return
            lastUpdate.current = now

            const rect = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width
            const y = (e.clientY - rect.top) / rect.height
            mouseX.set(x)
            mouseY.set(y)
        },
        [mouseX, mouseY, throttleMs]
    )

    const handleMouseEnter = useCallback(
        (e) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width
                const y = (e.clientY - rect.top) / rect.height
                mouseX.set(x)
                mouseY.set(y)
            }
            setIsActive(true)
        },
        [mouseX, mouseY]
    )

    const handleMouseLeave = useCallback(() => {
        setIsActive(false)
    }, [])

    const handleTouchMove = useCallback(
        (e) => {
            if (!containerRef.current) return

            const now = Date.now()
            if (now - lastUpdate.current < throttleMs) return
            lastUpdate.current = now

            const touch = e.touches[0]
            const rect = containerRef.current.getBoundingClientRect()
            const x = (touch.clientX - rect.left) / rect.width
            const y = (touch.clientY - rect.top) / rect.height
            mouseX.set(x)
            mouseY.set(y)
        },
        [mouseX, mouseY, throttleMs]
    )

    const handleTouchStart = useCallback(
        (e) => {
            if (containerRef.current) {
                const touch = e.touches[0]
                const rect = containerRef.current.getBoundingClientRect()
                const x = (touch.clientX - rect.left) / rect.width
                const y = (touch.clientY - rect.top) / rect.height
                mouseX.set(x)
                mouseY.set(y)
            }
            setIsActive(true)
        },
        [mouseX, mouseY]
    )

    const handleTouchEnd = useCallback(() => {
        setIsActive(false)
    }, [])

    // Handle static preview state
    useEffect(() => {
        if (isStatic || isStaticRenderer) {
            mouseX.set(defaultX / 100)
            mouseY.set(defaultY / 100)
        }
    }, [isStatic, isStaticRenderer, defaultX, defaultY, mouseX, mouseY])

    const cursorStyle =
        cursorIcon === "custom"
            ? customCursor
                ? `url("${customCursor}"), auto`
                : "auto"
            : cursorIcon

    return (
        <motion.div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: "#f0f0f0",
                cursor: cursorStyle,
                touchAction: "none",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            {/* Top Image (Always visible background) */}
            {topImageError || !topImage?.src ? (
                <div style={errorStyle}>
                    {!topImage?.src
                        ? "Missing Top Image"
                        : "Error Loading Top Image"}
                </div>
            ) : (
                <img
                    src={topImage.src}
                    alt={topImage.alt || "Top Layer"}
                    onError={() => setTopImageError(true)}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                />
            )}

            {/* Bottom Image (Revealed by mask) */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity,
                    WebkitMaskImage: maskImage,
                    maskImage: maskImage,
                    pointerEvents: "none",
                    zIndex: 2,
                }}
            >
                {bottomImageError || !bottomImage?.src ? (
                    <div
                        style={{
                            ...errorStyle,
                            background: "#ffeeba",
                            color: "#856404",
                        }}
                    >
                        {!bottomImage?.src
                            ? "Missing X-Ray Image"
                            : "Error Loading X-Ray Image"}
                    </div>
                ) : (
                    <>
                        <img
                            src={bottomImage.src}
                            alt={bottomImage.alt || "X-Ray Layer"}
                            onError={() => setBottomImageError(true)}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: `scale(${zoom})`,
                                pointerEvents: "none",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor: revealColor,
                                pointerEvents: "none",
                            }}
                        />
                    </>
                )}
            </motion.div>

            {/* Lens Ring */}
            {revealDirection === "cursor" && showLens && (
                <motion.div
                    style={{
                        position: "absolute",
                        top: lensY,
                        left: lensX,
                        width: revealSize,
                        height: revealSize,
                        borderRadius: "50%",
                        border: `${lensWidth}px solid ${lensColor}`,
                        pointerEvents: "none",
                        zIndex: 10,
                        marginLeft: -revealSize / 2,
                        marginTop: -revealSize / 2,
                    }}
                />
            )}
        </motion.div>
    )
}

const errorStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: 20,
    textAlign: "center",
    fontSize: 14,
    position: "absolute",
    top: 0,
    left: 0,
    fontWeight: 500,
}

XRayHover.displayName = "XRayHover"

addPropertyControls(XRayHover, {
    topImage: {
        type: ControlType.ResponsiveImage,
        title: "Top Image",
    },
    bottomImage: {
        type: ControlType.ResponsiveImage,
        title: "X-Ray Image",
    },
    revealSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 150,
        min: 50,
        max: 500,
        step: 10,
        hidden: (props) => props.revealDirection !== "cursor",
    },
    softness: {
        type: ControlType.Number,
        title: "Softness",
        defaultValue: 20,
        min: 0,
        max: 100,
    },
    zoom: {
        type: ControlType.Number,
        title: "Zoom",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
        displayStepper: true,
    },
    defaultX: {
        type: ControlType.Number,
        title: "Preview X",
        defaultValue: 50,
        min: 0,
        max: 100,
        unit: "%",
        step: 1,
        hidden: (props) => !props.isStatic,
    },
    defaultY: {
        type: ControlType.Number,
        title: "Preview Y",
        defaultValue: 50,
        min: 0,
        max: 100,
        unit: "%",
        step: 1,
        hidden: (props) => !props.isStatic,
    },
    smoothing: {
        type: ControlType.Boolean,
        title: "Smoothing",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    frameRate: {
        type: ControlType.Enum,
        title: "Frame Rate",
        options: [60, 30, 15],
        optionTitles: ["60 FPS", "30 FPS", "15 FPS"],
        defaultValue: 60,
    },
    revealDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: [
            "cursor",
            "leftToRight",
            "rightToLeft",
            "topToBottom",
            "bottomToTop",
        ],
        optionTitles: [
            "Cursor",
            "Left to Right",
            "Right to Left",
            "Top to Bottom",
            "Bottom to Top",
        ],
        defaultValue: "cursor",
    },
    revealColor: {
        type: ControlType.Color,
        title: "Tint",
        defaultValue: "rgba(0, 0, 0, 0)",
    },
    showLens: {
        type: ControlType.Boolean,
        title: "Show Lens",
        defaultValue: false,
        hidden: (props) => props.revealDirection !== "cursor",
    },
    lensColor: {
        type: ControlType.Color,
        title: "Lens Color",
        defaultValue: "#FFFFFF",
        hidden: (props) =>
            !props.showLens || props.revealDirection !== "cursor",
    },
    lensWidth: {
        type: ControlType.Number,
        title: "Lens Width",
        defaultValue: 2,
        min: 1,
        max: 20,
        hidden: (props) =>
            !props.showLens || props.revealDirection !== "cursor",
    },
    cursorIcon: {
        type: ControlType.Enum,
        title: "Cursor",
        options: [
            "crosshair",
            "default",
            "pointer",
            "grab",
            "zoom-in",
            "zoom-out",
            "custom",
        ],
        optionTitles: [
            "Crosshair",
            "Default",
            "Pointer",
            "Grab",
            "Zoom In",
            "Zoom Out",
            "Custom",
        ],
        defaultValue: "crosshair",
    },
    customCursor: {
        type: ControlType.File,
        title: "Custom Icon",
        allowedFileTypes: ["png", "jpg", "svg", "gif"],
        hidden: (props) => props.cursorIcon !== "custom",
    },
    isStatic: {
        type: ControlType.Boolean,
        title: "Static Preview",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Enable to set a fixed position for the effect in the editor",
    },
})