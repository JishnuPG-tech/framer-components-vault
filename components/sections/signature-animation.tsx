/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 120
 */

import {
    useState,
    useRef,
    useLayoutEffect,
    useId,
    type KeyboardEvent,
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

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function AnimatedSignature(props) {
    const {
        text,
        font,
        fontSize,
        textColor,
        duration,
        autoplay,
        loop,
        showUnderline,
        strokeWidth,
        letterSpacing,
        ariaLabel,
    } = props

    if (!text?.trim()) {
        return null
    }

    const isStatic = useIsStaticRenderer()
    const textRef = useRef<SVGTextElement | null>(null)
    const [measuredWidth, setMeasuredWidth] = useState(0)
    const [key, setKey] = useState(0)
    const maskId = useId()

    // Safely measure actual DOM text width with static render guarding & web font listener
    useLayoutEffect(() => {
        if (isStatic) return

        let isMounted = true

        const measure = () => {
            try {
                if (textRef.current && isMounted) {
                    setMeasuredWidth(textRef.current.getBBox().width)
                }
            } catch (error) {
                // Ignore SVG measurement errors during early render cycles or unmounted states
            }
        }

        // Initial measurement
        measure()

        // Re-measure after external web fonts finish loading
        if (
            typeof document !== "undefined" &&
            document.fonts &&
            "ready" in document.fonts
        ) {
            document.fonts.ready.then(() => {
                if (isMounted) measure()
            })
        }

        return () => {
            isMounted = false
        }
    }, [
        text,
        fontSize,
        font?.fontFamily,
        font?.fontWeight,
        font?.fontStyle,
        letterSpacing,
        isStatic,
    ])

    // Prevent replaying if loop is enabled
    const handleReplay = () => {
        if (loop) return
        setKey((prev) => prev + 1)
    }

    // Handle keyboard interaction for accessibility
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (loop) return
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleReplay()
        }
    }

    // Extract font properties from Framer Font Control
    const fontFamily = font?.fontFamily || "cursive"
    const fontWeight = font?.fontWeight || "400"
    const fontStyle = font?.fontStyle || "normal"

    // Dynamic width fallback before initial measurement
    const textLength = measuredWidth || text.length * fontSize * 0.65
    const svgHeight = fontSize * 2.3

    return (
        <div
            onClick={handleReplay}
            onKeyDown={handleKeyDown}
            tabIndex={loop ? -1 : 0}
            role="img"
            aria-label={ariaLabel || text}
            style={{
                display: "inline-block",
                cursor: loop ? "auto" : "pointer",
                userSelect: "none",
            }}
        >
            <svg
                aria-hidden="true"
                width="100%"
                height={svgHeight}
                viewBox={`0 0 ${Math.max(textLength, 10)} ${svgHeight}`}
                preserveAspectRatio="xMinYMid meet"
                style={{ overflow: "visible", display: "block" }}
            >
                <defs>
                    {/* Unique masked animation container */}
                    <mask id={`${maskId}-${key}`}>
                        <motion.rect
                            key={`rect-${key}`}
                            x="0"
                            y="-20"
                            height={svgHeight * 1.5}
                            fill="#FFFFFF"
                            initial={
                                isStatic
                                    ? false
                                    : { width: autoplay ? 0 : "100%" }
                            }
                            animate={isStatic ? undefined : { width: "100%" }}
                            transition={
                                isStatic
                                    ? undefined
                                    : {
                                          duration: duration,
                                          ease: "easeInOut",
                                          repeat: loop ? Infinity : 0,
                                          repeatType: "loop",
                                          repeatDelay: 1,
                                      }
                            }
                        />
                    </mask>
                </defs>

                {/* Animated Signature Text Layer */}
                <text
                    ref={textRef}
                    x="0"
                    y={fontSize * 1.3}
                    fill={textColor}
                    mask={`url(#${maskId}-${key})`}
                    style={{
                        fontSize: `${fontSize}px`,
                        fontFamily: fontFamily,
                        fontWeight: fontWeight,
                        fontStyle: fontStyle,
                        letterSpacing: `${letterSpacing}px`,
                    }}
                >
                    {text}
                </text>

                {/* Optional Decorative Underline Ink Stroke */}
                {showUnderline && strokeWidth > 0 && text.length > 0 && (
                    <motion.path
                        key={`path-${key}`}
                        d={`M 0 ${fontSize * 1.55} Q ${textLength * 0.5} ${
                            fontSize * 1.7
                        }, ${textLength} ${fontSize * 1.52} L ${
                            textLength * 0.85
                        } ${fontSize * 1.85}`}
                        fill="transparent"
                        stroke={textColor}
                        strokeWidth={strokeWidth}
                        strokeMiterlimit={10}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={
                            isStatic ? false : { pathLength: autoplay ? 0 : 1 }
                        }
                        animate={isStatic ? undefined : { pathLength: 1 }}
                        transition={
                            isStatic
                                ? undefined
                                : {
                                      duration: duration * 0.4,
                                      delay: duration * 0.6,
                                      ease: "easeOut",
                                  }
                        }
                    />
                )}
            </svg>
        </div>
    )
}

// Default Properties
AnimatedSignature.defaultProps = {
    text: "Karim Saif",
    fontSize: 48,
    textColor: "#000000",
    duration: 2.5,
    autoplay: true,
    loop: false,
    showUnderline: true,
    strokeWidth: 2,
    letterSpacing: 1,
    ariaLabel: "Animated Signature",
}

// Property Controls in Framer Panel
addPropertyControls(AnimatedSignature, {
    text: {
        type: ControlType.String,
        title: "Signature",
        defaultValue: "Karim Saif",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Caveat",
            fontWeight: "400",
        },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 48,
        min: 16,
        max: 200,
    },
    textColor: {
        type: ControlType.Color,
        title: "Ink Color",
        defaultValue: "#000000",
    },
    duration: {
        type: ControlType.Number,
        title: "Speed (s)",
        defaultValue: 2.5,
        min: 0.5,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    showUnderline: {
        type: ControlType.Boolean,
        title: "Ink Line",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 2,
        min: 0,
        max: 10,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 1,
        min: -2,
        max: 10,
        step: 0.5,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Animated Signature",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
