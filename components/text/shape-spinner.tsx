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
    useTransform,
    animate,
    AnimationPlaybackControls,
} from "framer-motion"

const PRESETS = {
    "Blob 1": {
        path: "M43.1,-68.5C56.2,-58.6,67.5,-47.3,72.3,-33.9C77.2,-20.5,75.5,-4.9,74.2,11.3C72.9,27.6,71.9,44.5,63.8,57.2C55.7,69.8,40.6,78.2,25.5,79.2C10.4,80.1,-4.7,73.6,-20.9,69.6C-37.1,65.5,-54.5,63.9,-66,54.8C-77.5,45.8,-83.2,29.3,-85.7,12.3C-88.3,-4.8,-87.7,-22.3,-79.6,-34.8C-71.5,-47.3,-55.8,-54.9,-41.3,-64.2C-26.7,-73.6,-13.4,-84.7,0.8,-86C15,-87.2,29.9,-78.5,43.1,-68.5Z",
        transform: "translate(100 100)",
        viewBox: "0 0 200 200",
    },
    "Blob 2": {
        path: "M70.2503 44.9161C104.754 40.8777 115.836 36.6165 139.754 18.1887C175.27 -9.16698 228.254 -9.29088 243.405 43.0359C255.055 83.2811 243.822 133.213 217.967 156.106C174.43 194.658 93.854 201.551 43.8393 171.809C0.720734 146.172 -13.1351 96.8501 13.7508 64.7071C22.8695 53.8051 37.2026 48.7831 70.2503 44.9161Z",
        transform: "",
        viewBox: "0 0 248 191",
    },
    "Blob 3": {
        path: "M0.360337 128.243C-4.95996 80.963 48.9099 0 143.698 0C198.853 0 240.797 25.5 240.797 80.317C240.797 142 149.515 189.124 98.1198 196C45.7968 203 6.29684 181 0.360337 128.243Z",
        transform: "",
        viewBox: "0 0 241 198",
    },
    "Blob 4": {
        path: "M32.0976 52.209C34.8122 20.98 43.2895 8.71974 66.7025 2.16904C115.537 -11.4958 165.106 42.8061 200.792 69.9541C228.353 90.9231 258.905 118.634 247.405 156.986C234.473 200.145 174.134 219.45 140.083 191.278C115.666 171.07 106.352 170.314 75.6501 186.048C41.5394 203.529 23.1056 201.979 8.01921 180.36C-3.90179 163.287 -1.34629 142.788 7.94041 125.375C29.0098 85.8661 29.2324 85.1971 32.0976 52.209Z",
        transform: "",
        viewBox: "0 0 250 205",
    },
    "Blob 5": {
        path: "M187.931 37.5939C153.137 39.3861 143.592 8.87971 114.278 1.7375C83.0602 -5.8721 68.9702 13.0603 65.6339 28.5398C63.0621 40.4724 57.6564 45.652 43.4093 48.9699C33.2546 50.8329 24.2566 56.1101 26.6134 70.5852C28.9703 85.0603 24.1931 93.7033 17.0817 98.8813C9.97031 104.06 3.33561 111.412 1.00211 120.99C-2.95029 137.203 5.08441 154.185 19.8927 161.714C36.5332 169.995 45.4702 179.06 44.3014 197.861C44.0093 202.56 45.9702 227.56 69.7622 220.003C75.7712 218.095 100.629 205.224 115.714 229.112C119.47 235.06 128.771 240.913 137.27 242.987C160.062 248.541 183.364 231.739 185.678 208.604C188.188 191.486 191.302 183.459 209.807 189.438C228.117 195.354 239.074 169.869 228.829 156.795C214.61 142.06 231.577 115.56 236.965 93.4483C244.33 63.2239 218.302 34.3022 187.931 37.5939Z",
        transform: "",
        viewBox: "0 0 239 245",
    },
    Circle: {
        path: "M 100, 20 A 80 80 0 1 1 99.9 20",
        transform: "",
        viewBox: "0 0 200 200",
    },
    Pill: {
        path: "M 70,40 L 130,40 A 60 60 0 0 1 130 160 L 70 160 A 60 60 0 0 1 70 40 Z",
        transform: "",
        viewBox: "0 0 200 200",
    },
}

export default function ShapeSpinner(props) {
    const {
        presetShape = "Circle",
        textPathShape = "Match Shape",
        customPath = "",
        shapeColor = "#EEEEEE",
        image,
        video,
        imageZoom = 100,
        imageOffsetX = 0,
        imageOffsetY = 0,
        showStroke = false,
        strokeColor = "#000000",
        strokeWidth = 2,
        showShadow = false,
        shadowColor = "rgba(0,0,0,0.1)",
        shadowBlur = 20,
        shadowX = 0,
        shadowY = 10,
        showText = true,
        text = "SHAPE SPINNER",
        textRepeats = 4,
        textSpacing = 8,
        letterSpacing = 0,
        textDistance = -10,
        font = { fontSize: 14, fontWeight: 700 },
        textColor = "#000000",
        direction = "Clockwise",
        textTransition,
        animateOnHover = false,
        hoverEffect = true,
        hoverStyle = "Grow Together",
        hoverScale = 1.1,
        hoverRotate = 5,
        hoverTransition,
        hoverTextColor = "#FFFFFF",
        isLink = false,
        linkUrl = "",
        newTab = true,
        cursorType = "auto",
        customCursorImage,
        cursorSize = 32,
        style,
    } = props

    const rawId = React.useId() || "id"
    const uniqueId = "sp-" + rawId.replace(/[^a-zA-Z0-9]/g, "")
    const [isHovered, setIsHovered] = React.useState(false)
    const [processedCursor, setProcessedCursor] = React.useState(null)
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const animInstance = React.useRef<AnimationPlaybackControls | null>(null)

    React.useEffect(() => {
        if (cursorType === "custom" && customCursorImage) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.src = customCursorImage
            img.onload = () => {
                const canvas = document.createElement("canvas")
                const size = Math.min(Math.max(cursorSize, 16), 128)
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext("2d")
                ctx.drawImage(img, 0, 0, size, size)
                setProcessedCursor(
                    `url(${canvas.toDataURL()}) ${size / 2} ${size / 2}, auto`
                )
            }
        } else {
            setProcessedCursor(null)
        }
    }, [customCursorImage, cursorType, cursorSize])

    React.useEffect(() => {
        if (!videoRef.current) return
        if (animateOnHover) {
            isHovered
                ? videoRef.current.play().catch(() => {})
                : videoRef.current.pause()
        } else {
            videoRef.current.play().catch(() => {})
        }
    }, [isHovered, animateOnHover])

    const getCursor = () => {
        if (cursorType === "custom" && processedCursor) return processedCursor
        if (cursorType === "auto" && isLink) return "pointer"
        return cursorType
    }

    const activeData =
        presetShape === "Custom"
            ? {
                  path:
                      customPath.match(/d=["']([^"']+)["']/)?.[1] || customPath,
                  transform: "",
                  viewBox:
                      customPath.match(/viewBox=["']([^"']+)["']/)?.[1] ||
                      "0 0 200 200",
              }
            : PRESETS[presetShape]

    const activeTextPathData =
        textPathShape === "Match Shape" ? activeData : PRESETS[textPathShape]
    const spaceString = "\u00A0".repeat(Math.max(0, textSpacing))
    const repeatedText = Array.from(
        { length: Math.max(1, textRepeats) },
        () => (text || "") + spaceString
    ).join("")
    const zoomVal = (imageZoom || 100) / 100

    const progress = useMotionValue(0)
    React.useEffect(() => {
        if (!showText) return
        animInstance.current = animate(
            progress,
            direction === "Clockwise" ? [0, 100] : [100, 0],
            {
                ...textTransition,
                repeat: Infinity,
                ease: textTransition?.ease || "linear",
            }
        )
        return () => animInstance.current?.stop()
    }, [textTransition, direction, showText])

    React.useEffect(() => {
        if (!animInstance.current) return
        animateOnHover && !isHovered
            ? animInstance.current.pause()
            : animInstance.current.play()
    }, [isHovered, animateOnHover])

    const startOffset1 = useTransform(progress, (v) => `${v}%`)
    const startOffset2 = useTransform(progress, (v) => `${v - 100}%`)

    const hoverRotateVal = hoverEffect && isHovered ? hoverRotate : 0
    const hoverScaleVal = hoverEffect && isHovered ? hoverScale : 1
    const shadowString = `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`

    return (
        <motion.div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                cursor: getCursor(),
                textDecoration: "none",
                filter:
                    showShadow && shadowBlur > 0
                        ? `drop-shadow(${shadowString})`
                        : "none",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() =>
                isLink &&
                linkUrl &&
                window.open(linkUrl, newTab ? "_blank" : "_self")
            }
        >
            <motion.svg
                viewBox={activeData.viewBox}
                style={{ width: "100%", height: "100%", overflow: "visible" }}
                animate={{ scale: hoverScaleVal, rotate: hoverRotateVal }}
                transition={hoverTransition}
            >
                <defs>
                    <clipPath id={`clip-${uniqueId}`}>
                        <path
                            d={activeData.path}
                            transform={activeData.transform}
                        />
                    </clipPath>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill={shapeColor}
                    clipPath={`url(#clip-${uniqueId})`}
                />
                {video && (
                    <foreignObject
                        width="100%"
                        height="100%"
                        clipPath={`url(#clip-${uniqueId})`}
                    >
                        <video
                            ref={videoRef}
                            src={video}
                            autoPlay={!animateOnHover}
                            loop
                            muted
                            playsInline
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: `scale(${zoomVal}) translate(${imageOffsetX}%, ${imageOffsetY}%)`,
                            }}
                        />
                    </foreignObject>
                )}
                {!video && image && (
                    <image
                        href={image}
                        x={`${imageOffsetX + (100 - 100 * zoomVal) / 2}%`}
                        y={`${imageOffsetY + (100 - 100 * zoomVal) / 2}%`}
                        width={`${100 * zoomVal}%`}
                        height={`${100 * zoomVal}%`}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#clip-${uniqueId})`}
                    />
                )}
                {showStroke && (
                    <path
                        d={activeData.path}
                        transform={activeData.transform}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                    />
                )}
            </motion.svg>

            {showText && (
                <motion.svg
                    viewBox={activeTextPathData.viewBox}
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        overflow: "visible",
                        pointerEvents: "none",
                    }}
                    animate={{
                        scale:
                            hoverStyle === "Grow Together" ? hoverScaleVal : 1,
                        rotate: hoverRotateVal,
                    }}
                    transition={hoverTransition}
                >
                    <path
                        id={`tp-${uniqueId}`}
                        d={activeTextPathData.path}
                        transform={activeTextPathData.transform}
                        fill="none"
                    />
                    <text
                        style={{
                            ...font,
                            fill:
                                hoverEffect && isHovered
                                    ? hoverTextColor
                                    : textColor,
                            letterSpacing: `${letterSpacing}px`,
                        }}
                    >
                        <motion.textPath
                            href={`#tp-${uniqueId}`}
                            startOffset={startOffset1}
                        >
                            <tspan dy={textDistance}>{repeatedText}</tspan>
                        </motion.textPath>
                        <motion.textPath
                            href={`#tp-${uniqueId}`}
                            startOffset={startOffset2}
                        >
                            <tspan dy={textDistance}>{repeatedText}</tspan>
                        </motion.textPath>
                    </text>
                </motion.svg>
            )}
        </motion.div>
    )
}

addPropertyControls(ShapeSpinner, {
    presetShape: {
        type: ControlType.Enum,
        title: "Base Shape",
        options: [
            "Circle",
            "Pill",
            "Blob 1",
            "Blob 2",
            "Blob 3",
            "Blob 4",
            "Blob 5",
            "Custom",
        ],
        defaultValue: "Circle",
    },
    customPath: {
        type: ControlType.String,
        title: "SVG Path",
        displayTextArea: true,
        hidden: (props) => props.presetShape !== "Custom",
    },
    shapeColor: {
        type: ControlType.Color,
        title: "Shape Color",
        defaultValue: "#EEEEEE",
    },
    showStroke: {
        type: ControlType.Boolean,
        title: "Show Stroke",
        defaultValue: false,
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 2,
        min: 1,
        max: 20,
        hidden: (props) => !props.showStroke,
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#000000",
        hidden: (props) => !props.showStroke,
    },

    showShadow: {
        type: ControlType.Boolean,
        title: "Show Shadow",
        defaultValue: false,
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "rgba(0,0,0,0.2)",
        hidden: (props) => !props.showShadow,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 100,
        defaultValue: 20,
        hidden: (props) => !props.showShadow,
    },
    shadowX: {
        type: ControlType.Number,
        title: "X Offset",
        defaultValue: 0,
        hidden: (props) => !props.showShadow,
    },
    shadowY: {
        type: ControlType.Number,
        title: "Y Offset",
        defaultValue: 10,
        hidden: (props) => !props.showShadow,
    },

    video: {
        type: ControlType.File,
        title: "Video Fill",
        allowedFileTypes: ["mp4"],
    },
    image: {
        type: ControlType.Image,
        title: "Image Fill",
        hidden: (props) => !!props.video,
    },
    imageZoom: {
        type: ControlType.Number,
        title: "Media Zoom",
        defaultValue: 100,
        min: 50,
        max: 500,
    },
    imageOffsetX: {
        type: ControlType.Number,
        title: "Media X Offset",
        defaultValue: 0,
        min: -100,
        max: 100,
    },
    imageOffsetY: {
        type: ControlType.Number,
        title: "Media Y Offset",
        defaultValue: 0,
        min: -100,
        max: 100,
    },
    animateOnHover: {
        type: ControlType.Boolean,
        title: "Hover Sync",
        defaultValue: false,
    },

    showText: {
        type: ControlType.Boolean,
        title: "Show Text",
        defaultValue: true,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "SHAPE SPINNER",
        hidden: (props) => !props.showText,
    },
    textPathShape: {
        type: ControlType.Enum,
        title: "Text Path",
        options: [
            "Match Shape",
            "Circle",
            "Pill",
            "Blob 1",
            "Blob 2",
            "Blob 3",
            "Blob 4",
            "Blob 5",
        ],
        defaultValue: "Match Shape",
        hidden: (props) => !props.showText,
    },
    textTransition: {
        type: ControlType.Transition,
        title: "Text Anim",
        defaultValue: { type: "tween", duration: 15, ease: "linear" },
        hidden: (props) => !props.showText,
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: { fontSize: 14, variant: "Bold" },
        hidden: (props) => !props.showText,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        hidden: (props) => !props.showText,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["Clockwise", "Counter-Clockwise"],
        defaultValue: "Clockwise",
        hidden: (props) => !props.showText,
    },
    textRepeats: {
        type: ControlType.Number,
        title: "Repeats",
        defaultValue: 4,
        hidden: (props) => !props.showText,
    },
    textSpacing: {
        type: ControlType.Number,
        title: "Word Spacing",
        defaultValue: 8,
        hidden: (props) => !props.showText,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -5,
        max: 30,
        step: 0.1,
        hidden: (props) => !props.showText,
    },
    textDistance: {
        type: ControlType.Number,
        title: "Text Distance",
        defaultValue: -10,
        hidden: (props) => !props.showText,
    },

    hoverEffect: {
        type: ControlType.Boolean,
        title: "Hover Effect",
        defaultValue: true,
    },
    hoverStyle: {
        type: ControlType.Enum,
        title: "Hover Style",
        options: ["Grow Together", "Grow Shape Only"],
        defaultValue: "Grow Together",
        hidden: (props) => !props.hoverEffect || !props.showText,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.1,
        step: 0.05,
        hidden: (props) => !props.hoverEffect,
    },
    hoverRotate: {
        type: ControlType.Number,
        title: "Hover Rotate",
        defaultValue: 5,
        hidden: (props) => !props.hoverEffect,
    },
    hoverTransition: {
        type: ControlType.Transition,
        title: "Hover Anim (Shape)",
        defaultValue: { type: "spring", stiffness: 300, damping: 20 },
        hidden: (props) => !props.hoverEffect,
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.hoverEffect || !props.showText,
    },

    isLink: {
        type: ControlType.Boolean,
        title: "Enable Link",
        defaultValue: false,
    },
    linkUrl: {
        type: ControlType.String,
        title: "URL",
        defaultValue: "https://",
        hidden: (props) => !props.isLink,
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: true,
        hidden: (props) => !props.isLink,
    },
    cursorType: {
        type: ControlType.Enum,
        title: "Cursor",
        options: ["auto", "default", "pointer", "custom"],
        defaultValue: "auto",
    },
    customCursorImage: {
        type: ControlType.Image,
        title: "Custom Image",
        hidden: (props) => props.cursorType !== "custom",
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 32,
        min: 16,
        max: 128,
        hidden: (props) => props.cursorType !== "custom",
    },
})
