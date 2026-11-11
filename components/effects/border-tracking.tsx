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
 * Detect if we're in Framer's design environment (Canvas/Editor),
 * so we can hide the highlight there and only show in Preview/Live.
 */
function isFramerDesignEnv(): boolean {
    if (typeof window === "undefined") return false
    const url = window.location.href
    return url.includes("/canvas") || url.includes("/editor")
}

type Props = {
    fill: string
    isImageMode: boolean
    image: string
    highlightColor: string
    borderWidth: number
    borderRadius: number
    highlightRadius: number
    fadeDuration: number
    proximity: number
    disableOnTouch: boolean
    touchThreshold: number
    // NEW PROPERTIES for Custom Container functionality:
    useCustomContainer: boolean
    containerContentMode: "Fill" | "Fit"
    children?: any
    // ADDED: Horizontal alignment for the custom container
    contentAlign: "flex-start" | "center" | "flex-end"
}
/**
 *
 * @framerIntrinsicWidth 1400
 * @framerIntrinsicHeight 1000
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ProximityCursorHighlight(props: Props) {
    const {
        fill,
        isImageMode,
        image,
        highlightColor,
        borderWidth,
        borderRadius,
        highlightRadius,
        fadeDuration,
        proximity,
        disableOnTouch,
        touchThreshold,
        // NEW PROPERTIES:
        useCustomContainer,
        containerContentMode,
        children,
        // ADDED:
        contentAlign,
        ...rest
    } = props

    // --- HELPER to force child to fill the parent in "Fill" mode ---
    const fillChildIfNeeded = React.useCallback(
        (child: React.ReactNode) => {
            if (containerContentMode !== "Fill") return child
            // If "Fill," forcibly override the child's size and remove constraints
            if (React.isValidElement(child)) {
                const newProps: any = {
                    width: "100%",
                    height: "100%",
                    style: {
                        ...child.props.style,
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        top: 0,
                        left: 0,
                    },
                }
                if ("constraints" in child.props) {
                    newProps.constraints = undefined
                }
                return React.cloneElement(child, newProps)
            }
            return child
        },
        [containerContentMode]
    )

    // Generate a unique gradient ID per instance to avoid collisions
    const gradientId = React.useMemo(() => {
        const randomSuffix = Math.random().toString(36).substr(2, 9)
        return `hoverHighlight-${randomSuffix}`
    }, [])

    // Determine if we're in the Framer Design environment
    const inDesignEnv = isFramerDesignEnv()

    // If user wants to disable on "touch" devices (i.e., small screens),
    // check if the current window width is <= user threshold
    const [isBelowTouchThreshold, setIsBelowTouchThreshold] =
        React.useState(false)
    React.useEffect(() => {
        if (disableOnTouch && typeof window !== "undefined") {
            const updateSize = () => {
                setIsBelowTouchThreshold(window.innerWidth <= touchThreshold)
            }
            updateSize()
            window.addEventListener("resize", updateSize)
            return () => window.removeEventListener("resize", updateSize)
        }
    }, [disableOnTouch, touchThreshold])

    // The highlight effect is enabled if:
    //  - we are NOT in the Framer design environment,
    //  - we are NOT below the user-specified threshold (if disabled on touch).
    const highlightEnabled =
        !inDesignEnv && !(disableOnTouch && isBelowTouchThreshold)

    // We track bounding box to do "proximity" approach detection
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [rect, setRect] = React.useState({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    })
    const [dimensions, setDimensions] = React.useState({ width: 1, height: 1 })

    // "hover" means the mouse is within bounding box ± proximity
    const [hover, setHover] = React.useState(false)

    // Motion values for local cursor position
    const mouseX = useMotionValue(50)
    const mouseY = useMotionValue(50)

    const gradientCenterX = useTransform(mouseX, (val) =>
        dimensions.width > 0 ? (val / dimensions.width) * 100 : 50
    )
    const gradientCenterY = useTransform(mouseY, (val) =>
        dimensions.height > 0 ? (val / dimensions.height) * 100 : 50
    )

    const [gx, setGx] = React.useState(50)
    const [gy, setGy] = React.useState(50)
    React.useEffect(() => {
        const subX = gradientCenterX.onChange((latest) => setGx(latest))
        const subY = gradientCenterY.onChange((latest) => setGy(latest))
        return () => {
            subX()
            subY()
        }
    }, [gradientCenterX, gradientCenterY])

    // Measure bounding box once mounted
    React.useLayoutEffect(() => {
        if (containerRef.current) {
            updateRect()
        }
    }, [])

    const updateRect = () => {
        if (!containerRef.current) return
        const bounds = containerRef.current.getBoundingClientRect()
        setRect({
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
        })
        setDimensions({
            width: bounds.width,
            height: bounds.height,
        })
    }

    // On window resize, re-measure bounding box
    React.useEffect(() => {
        const handleResize = () => updateRect()
        window.addEventListener("resize", handleResize)
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    // GLOBAL pointermove approach:
    // If highlight is enabled, check if the pointer is within the rect ± proximity.
    React.useEffect(() => {
        if (!highlightEnabled) return

        const handlePointerMove = (event: PointerEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                const { clientX, clientY } = event
                const extendedLeft = rect.left - proximity
                const extendedRight = rect.right + proximity
                const extendedTop = rect.top - proximity
                const extendedBottom = rect.bottom + proximity

                const isNear =
                    clientX >= extendedLeft &&
                    clientX <= extendedRight &&
                    clientY >= extendedTop &&
                    clientY <= extendedBottom

                setHover(isNear)

                if (isNear) {
                    const localX = clientX - rect.left
                    const localY = clientY - rect.top
                    mouseX.set(localX)
                    mouseY.set(localY)
                }
            }
        }

        window.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })
        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
        }
    }, [highlightEnabled, proximity, mouseX, mouseY])

    // We'll define a style object for the nested Frame container that uses flex
    // so we can horizontally align the child content based on `contentAlign`.
    const containerFrameStyle: React.CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        background: "transparent",
        display: "flex",
        alignItems: "center", // vertical center
        justifyContent: contentAlign, // horizontal alignment from property
    }

    return (
        <Frame
            width="100%"
            height="100%"
            ref={containerRef}
            {...rest}
            style={{
                position: "relative",
                overflow: "hidden",
                borderRadius,
                // If custom container is used, set background to transparent so the container's styling is visible
                background: isImageMode
                    ? "none"
                    : useCustomContainer
                      ? "transparent"
                      : fill,
                backgroundImage: isImageMode ? `url(${image})` : "none",
                backgroundPosition: "center",
                backgroundSize: "cover",
            }}
        >
            {/* Render custom container content only when Image Mode is OFF and Use Custom Container is true */}
            {!isImageMode &&
                useCustomContainer &&
                (containerContentMode === "Fill" ? (
                    <Frame
                        width="100%"
                        height="100%"
                        style={containerFrameStyle}
                    >
                        {fillChildIfNeeded(children)}
                    </Frame>
                ) : (
                    <Frame style={containerFrameStyle}>
                        {fillChildIfNeeded(children)}
                    </Frame>
                ))}

            {/* When Use Custom Container is false, do NOT render any child container. */}
            {!isImageMode && !useCustomContainer && null}

            {/* If highlightEnabled is true, render the SVG overlay */}
            {highlightEnabled && (
                <svg
                    width="100%"
                    height="100%"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        pointerEvents: "none",
                        borderRadius,
                    }}
                >
                    <defs>
                        <radialGradient
                            id={gradientId}
                            cx={`${gx}%`}
                            cy={`${gy}%`}
                            r={`${highlightRadius}%`}
                            fx={`${gx}%`}
                            fy={`${gy}%`}
                        >
                            <stop
                                offset="0%"
                                stopColor={highlightColor}
                                stopOpacity={1}
                            />
                            <stop
                                offset="100%"
                                stopColor={highlightColor}
                                stopOpacity={0}
                            />
                        </radialGradient>
                    </defs>

                    <motion.rect
                        x={0}
                        y={0}
                        width="100%"
                        height="100%"
                        rx={borderRadius}
                        ry={borderRadius}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={borderWidth}
                        // ADDED LINE: initial opacity = 0 to hide the border on first load
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: hover ? 1 : 0,
                        }}
                        transition={{
                            duration: fadeDuration,
                            ease: "easeInOut",
                        }}
                    />
                </svg>
            )}
        </Frame>
    )
}

// PROPERTY CONTROLS
addPropertyControls(ProximityCursorHighlight, {
    isImageMode: {
        title: "Image Mode",
        type: ControlType.Boolean,
        defaultValue: false,
        description:
            "Use an uploaded image as the background instead of a solid color.",
    },
    useCustomContainer: {
        title: "Use Custom Container",
        type: ControlType.Boolean,
        defaultValue: false,
        description:
            "When OFF, uses a solid Color Fill; when ON, uses a custom container from the canvas.",
    },
    // If custom container is NOT used, show Fill Color.
    fill: {
        title: "Color Fill",
        type: ControlType.Color,
        defaultValue: "#ffffff",
        hidden: ({ isImageMode, useCustomContainer }) =>
            isImageMode || useCustomContainer,
        description:
            "Solid background color if not in Image Mode and not using a custom container.",
    },
    // If custom container IS used, show Container Content Mode.
    containerContentMode: {
        title: "Container Content Mode",
        type: ControlType.Enum,
        defaultValue: "Fill",
        options: ["Fill", "Fit"],
        hidden: ({ isImageMode, useCustomContainer }) =>
            isImageMode || !useCustomContainer,
        description:
            "If using a custom container, choose whether its content fills the component or uses its intrinsic size.",
    },
    // Show Content only if Image Mode is OFF and Custom Container is enabled.
    children: {
        title: "Content",
        type: ControlType.ComponentInstance,
        hidden: ({ isImageMode, useCustomContainer }) =>
            isImageMode || !useCustomContainer,
        description: "Optional content displayed inside the custom container.",
    },
    // ADDED: contentAlign for horizontal alignment
    contentAlign: {
        title: "Align",
        type: ControlType.SegmentedEnum,
        defaultValue: "center",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        hidden: ({ useCustomContainer }) => !useCustomContainer,
        description: "Horizontally align the content within the container.",
    },
    image: {
        title: "Image",
        type: ControlType.Image,
        hidden: ({ isImageMode }) => !isImageMode,
        description: "Upload/select an image if Image Mode is ON.",
    },
    highlightColor: {
        title: "Highlight",
        type: ControlType.Color,
        defaultValue: "#00ff00",
        description:
            "Center color of the highlight gradient near the cursor (fades outward).",
    },
    borderWidth: {
        title: "Stroke Width",
        type: ControlType.Number,
        defaultValue: 3,
        min: 1,
        max: 20,
        description: "Thickness of the highlighted stroke near the cursor.",
    },
    borderRadius: {
        title: "Radius",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 100,
        description: "Round the corners of the frame (and highlight edge).",
    },
    highlightRadius: {
        title: "Highlight Size",
        type: ControlType.Number,
        defaultValue: 40,
        min: 0,
        max: 200,
        description:
            "Size of the highlight area (in % of the frame) around the cursor.",
    },
    fadeDuration: {
        title: "Fade Duration",
        type: ControlType.Number,
        defaultValue: 0.3,
        min: 0,
        max: 3,
        step: 0.1,
        description: "Time (in seconds) for the highlight to fade in/out.",
    },
    proximity: {
        title: "Proximity (px)",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 200,
        description:
            "How many pixels outside the bounding box to trigger highlight. Lets you 'light up' sooner.",
    },
    disableOnTouch: {
        title: "Disable on Touch?",
        type: ControlType.Boolean,
        defaultValue: false,
        description:
            "If ON, disables the highlight effect below a certain width)",
    },
    touchThreshold: {
        title: "Disable Width",
        type: ControlType.Number,
        defaultValue: 810,
        min: 0,
        max: 2000,
        hidden: ({ disableOnTouch }) => !disableOnTouch,
        description:
            "If screen width is <= this value, the highlight effect is disabled. \n \n Made with 🖤  for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works/)",
    },
})
