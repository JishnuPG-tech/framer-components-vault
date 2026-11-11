import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
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
 * BACK TO TOP + SCROLL PROGRESS
 *
 * Features:
 * - Scroll threshold
 * - Smooth / instant scrolling
 * - Icon / text / icon + text layouts
 * - Multiple button shapes
 * - Shape-following scroll progress
 * - Auto-sizing text buttons
 * - Custom scroll container
 * - Position controls
 * - Hover / entrance animations
 * - Reduced-motion support
 * - Keyboard accessibility
 * - Static renderer support
 */

type LayoutMode = "icon" | "textIcon" | "iconText" | "text"

type ShapeMode =
    | "circle"
    | "square"
    | "rounded"
    | "rectangle"
    | "pill"
    | "diamond"
    | "hexagon"
    | "octagon"
    | "custom"

type IconMode = "chevron" | "arrow" | "doubleChevron" | "caret" | "longArrow"

type PositionMode = "left" | "center" | "right"

type VerticalPosition = "top" | "bottom"

type ProgressDirection = "clockwise" | "counterClockwise"

interface BackToTopProps {
    threshold: number
    behavior: "smooth" | "instant"

    layout: LayoutMode
    text: string
    icon: IconMode

    shape: ShapeMode
    customRadius: number

    size: number

    iconSize: number
    textSize: number
    fontWeight: number
    gap: number

    paddingX: number
    paddingY: number

    background: string
    foreground: string
    borderColor: string
    borderWidth: number
    shadow: string

    showProgress: boolean
    progressColor: string
    progressWidth: number
    progressGap: number
    progressOpacity: number
    progressDirection: ProgressDirection

    position: PositionMode
    verticalPosition: VerticalPosition

    offsetX: number
    offsetY: number

    entrance: "fade" | "fadeScale" | "slideUp" | "slideSide" | "none"

    hoverScale: number
    hoverRotation: number
    tapScale: number

    duration: number

    customScrollSelector: string

    ariaLabel: string
}

/* -------------------------------------------------------
   DEFAULTS
------------------------------------------------------- */

const DEFAULTS: BackToTopProps = {
    threshold: 100,
    behavior: "smooth",

    layout: "icon",
    text: "Back to top",
    icon: "chevron",

    shape: "circle",
    customRadius: 16,

    size: 56,

    iconSize: 22,
    textSize: 14,
    fontWeight: 600,
    gap: 8,

    paddingX: 18,
    paddingY: 12,

    background: "#111111",
    foreground: "#FFFFFF",

    borderColor: "rgba(0,0,0,0)",
    borderWidth: 0,

    shadow: "0px 8px 30px 0px rgba(0,0,0,0.16)",

    showProgress: true,
    progressColor: "#111111",
    progressWidth: 3,
    progressGap: 4,
    progressOpacity: 1,
    progressDirection: "clockwise",

    position: "right",
    verticalPosition: "bottom",

    offsetX: 24,
    offsetY: 24,

    entrance: "fadeScale",

    hoverScale: 1.05,
    hoverRotation: 0,
    tapScale: 0.94,

    duration: 0.25,

    customScrollSelector: "",

    ariaLabel: "Back to top",
}

/* -------------------------------------------------------
   ICON
------------------------------------------------------- */

function Icon({
    type,
    size,
    strokeWidth = 2,
}: {
    type: IconMode
    size: number
    strokeWidth?: number
}) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        "aria-hidden": true,
        focusable: false,
    }

    switch (type) {
        case "arrow":
            return (
                <svg {...common}>
                    <path d="M12 19V5" />
                    <path d="M6 11l6-6 6 6" />
                </svg>
            )

        case "doubleChevron":
            return (
                <svg {...common}>
                    <path d="M6 14l6-6 6 6" />
                    <path d="M6 20l6-6 6 6" />
                </svg>
            )

        case "caret":
            return (
                <svg {...common}>
                    <path d="M5 15l7-7 7 7" />
                </svg>
            )

        case "longArrow":
            return (
                <svg {...common}>
                    <path d="M12 19V5" />
                    <path d="M7 10l5-5 5 5" />
                    <path d="M5 19h14" />
                </svg>
            )

        case "chevron":
        default:
            return (
                <svg {...common}>
                    <path d="M6 14l6-6 6 6" />
                </svg>
            )
    }
}

/* -------------------------------------------------------
   BUTTON SHAPE
------------------------------------------------------- */

function getShapeStyles(
    shape: ShapeMode,
    customRadius: number
): React.CSSProperties {
    switch (shape) {
        case "circle":
            return {
                borderRadius: "50%",
            }

        case "square":
            return {
                borderRadius: 0,
            }

        case "rounded":
            return {
                borderRadius: customRadius,
            }

        case "rectangle":
            return {
                borderRadius: customRadius,
            }

        case "pill":
            return {
                borderRadius: 999,
            }

        case "diamond":
            return {
                borderRadius: 0,
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            }

        case "hexagon":
            return {
                borderRadius: 0,
                clipPath:
                    "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)",
            }

        case "octagon":
            return {
                borderRadius: 0,
                clipPath:
                    "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
            }

        case "custom":
            return {
                borderRadius: customRadius,
                clipPath:
                    "polygon(14% 0%, 86% 0%, 100% 18%, 100% 82%, 86% 100%, 14% 100%, 0% 82%, 0% 18%)",
            }

        default:
            return {
                borderRadius: 16,
            }
    }
}

/* -------------------------------------------------------
   HORIZONTAL POSITION
------------------------------------------------------- */

function getHorizontalPosition(
    position: PositionMode,
    offsetX: number
): React.CSSProperties {
    if (position === "left") {
        return {
            left: offsetX,
            right: "auto",
        }
    }

    if (position === "center") {
        return {
            left: "50%",
            right: "auto",
            transform: "translateX(-50%)",
        }
    }

    return {
        right: offsetX,
        left: "auto",
    }
}

/* -------------------------------------------------------
   PROGRESS PATH
------------------------------------------------------- */

function getProgressPath(
    shape: ShapeMode,
    width: number,
    height: number,
    radius: number
): string {
    const w = Math.max(1, width)
    const h = Math.max(1, height)

    const x = 1.5
    const y = 1.5

    const right = w - 1.5
    const bottom = h - 1.5

    const cx = w / 2
    const cy = h / 2

    switch (shape) {
        case "circle": {
            const r = Math.max(1, Math.min(w, h) / 2 - 1.5)

            return `
                M ${cx} ${cy - r}
                A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r}
            `
        }

        case "square":
            return `
                M ${x} ${y}
                H ${right}
                V ${bottom}
                H ${x}
                Z
            `

        case "rounded":
        case "rectangle": {
            const r = Math.min(Math.max(0, radius), w / 2, h / 2)

            return `
                M ${x + r} ${y}
                H ${right - r}
                A ${r} ${r} 0 0 1 ${right} ${y + r}
                V ${bottom - r}
                A ${r} ${r} 0 0 1 ${right - r} ${bottom}
                H ${x + r}
                A ${r} ${r} 0 0 1 ${x} ${bottom - r}
                V ${y + r}
                A ${r} ${r} 0 0 1 ${x + r} ${y}
                Z
            `
        }

        case "pill": {
            const r = Math.min(w, h) / 2 - 1.5

            return `
                M ${x + r} ${y}
                H ${right - r}
                A ${r} ${r} 0 0 1 ${right - r} ${bottom}
                H ${x + r}
                A ${r} ${r} 0 0 1 ${x + r} ${y}
                Z
            `
        }

        case "diamond":
            return `
                M ${cx} ${y}
                L ${right} ${cy}
                L ${cx} ${bottom}
                L ${x} ${cy}
                Z
            `

        case "hexagon": {
            const side = Math.min(w * 0.25, h / 2)

            return `
                M ${side} ${y}
                H ${w - side}
                L ${right} ${cy}
                L ${w - side} ${bottom}
                H ${side}
                L ${x} ${cy}
                Z
            `
        }

        case "octagon": {
            const cut = Math.min(w * 0.29, h * 0.29)

            return `
                M ${cut} ${y}
                H ${w - cut}
                L ${right} ${cut}
                V ${h - cut}
                L ${w - cut} ${bottom}
                H ${cut}
                L ${x} ${h - cut}
                V ${cut}
                Z
            `
        }

        case "custom": {
            const cutX = w * 0.14
            const cutY = h * 0.18

            return `
                M ${cutX} ${y}
                H ${w - cutX}
                L ${right} ${cutY}
                V ${h - cutY}
                L ${w - cutX} ${bottom}
                H ${cutX}
                L ${x} ${h - cutY}
                V ${cutY}
                Z
            `
        }

        default:
            return `
                M ${x} ${y}
                H ${right}
                V ${bottom}
                H ${x}
                Z
            `
    }
}

/* -------------------------------------------------------
   PROGRESS INDICATOR
------------------------------------------------------- */

function ProgressIndicator({
    shape,
    width,
    height,
    radius,
    progress,
    color,
    strokeWidth,
    gap,
    opacity,
    direction,
    isStaticRenderer,
}: {
    shape: ShapeMode
    width: number
    height: number
    radius: number
    progress: number
    color: string
    strokeWidth: number
    gap: number
    opacity: number
    direction: ProgressDirection
    isStaticRenderer: boolean
}) {
    const safeProgress = Math.min(1, Math.max(0, progress))

    const extra = strokeWidth + gap + 2

    const svgWidth = width + extra * 2
    const svgHeight = height + extra * 2

    const path = getProgressPath(shape, width, height, radius)

    const translateX = extra
    const translateY = extra

    const progressOffset =
        direction === "clockwise" ? 1 - safeProgress : -(1 - safeProgress)

    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            style={{
                position: "absolute",
                left: -extra,
                top: -extra,

                width: `calc(100% + ${extra * 2}px)`,
                height: `calc(100% + ${extra * 2}px)`,

                overflow: "visible",
                pointerEvents: "none",

                zIndex: 0,
            }}
        >
            <g transform={`translate(${translateX}, ${translateY})`}>
                {/* Track */}
                <path
                    d={path}
                    pathLength={1}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeOpacity={opacity * 0.12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Progress */}
                {isStaticRenderer ? (
                    <path
                        d={path}
                        pathLength={1}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeOpacity={opacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="1"
                        strokeDashoffset={1}
                    />
                ) : (
                    <motion.path
                        d={path}
                        pathLength={1}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeOpacity={opacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="1"
                        animate={{
                            strokeDashoffset: progressOffset,
                        }}
                        transition={{
                            duration: 0.08,
                            ease: "linear",
                        }}
                    />
                )}
            </g>
        </svg>
    )
}

/* -------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------- */

export default function BackToTop(props: Partial<BackToTopProps>) {
    const settings = {
        ...DEFAULTS,
        ...props,
    }

    /*
     * IMPORTANT:
     *
     * Framer uses this hook when rendering the component
     * statically on the Canvas or during export.
     */
    const isStaticRenderer = useIsStaticRenderer()

    const reducedMotion = useReducedMotion()

    const [visible, setVisible] = React.useState(false)

    const [scrollProgress, setScrollProgress] = React.useState(0)

    const [buttonSize, setButtonSize] = React.useState({
        width: settings.size,
        height: settings.size,
    })

    const buttonRef = React.useRef<HTMLButtonElement | null>(null)

    const tickingRef = React.useRef(false)

    /*
     * In static rendering the button must remain visible
     * so Framer has a useful visual representation.
     */
    const displayVisible = isStaticRenderer ? true : visible

    /* ---------------------------------------------------
       RESOLVE SCROLL TARGET
    --------------------------------------------------- */

    const getScrollTarget = React.useCallback((): Window | HTMLElement => {
        if (typeof window === "undefined") {
            return window
        }

        const selector = settings.customScrollSelector?.trim()

        if (selector) {
            try {
                const element = document.querySelector(selector)

                if (element instanceof HTMLElement) {
                    return element
                }
            } catch {
                // Fall back to page scrolling.
            }
        }

        return window
    }, [settings.customScrollSelector])

    /* ---------------------------------------------------
       GET SCROLL TOP
    --------------------------------------------------- */

    const getScrollTop = React.useCallback((target: Window | HTMLElement) => {
        if (target === window) {
            return (
                window.pageYOffset ||
                document.documentElement.scrollTop ||
                document.body.scrollTop ||
                0
            )
        }

        return (target as HTMLElement).scrollTop
    }, [])

    /* ---------------------------------------------------
       GET SCROLL DISTANCE
    --------------------------------------------------- */

    const getScrollDistance = React.useCallback(
        (target: Window | HTMLElement) => {
            if (target === window) {
                const doc = document.documentElement

                const scrollHeight = Math.max(
                    doc.scrollHeight,
                    document.body?.scrollHeight || 0
                )

                return Math.max(0, scrollHeight - window.innerHeight)
            }

            const element = target as HTMLElement

            return Math.max(0, element.scrollHeight - element.clientHeight)
        },
        []
    )

    /* ---------------------------------------------------
       UPDATE SCROLL
    --------------------------------------------------- */

    const updateScrollState = React.useCallback(() => {
        if (isStaticRenderer || typeof window === "undefined") {
            return
        }

        const target = getScrollTarget()

        const scrollTop = getScrollTop(target)

        const distance = getScrollDistance(target)

        const progress =
            distance > 0 ? Math.min(1, Math.max(0, scrollTop / distance)) : 0

        setVisible(scrollTop > settings.threshold)

        setScrollProgress(progress)

        tickingRef.current = false
    }, [
        isStaticRenderer,
        getScrollTarget,
        getScrollTop,
        getScrollDistance,
        settings.threshold,
    ])

    /* ---------------------------------------------------
       SCROLL LISTENER
    --------------------------------------------------- */

    React.useEffect(() => {
        /*
         * No scroll listeners or requestAnimationFrame
         * loops during Framer static rendering.
         */
        if (isStaticRenderer || typeof window === "undefined") {
            return
        }

        const target = getScrollTarget()

        const handleScroll = () => {
            if (tickingRef.current) {
                return
            }

            tickingRef.current = true

            window.requestAnimationFrame(updateScrollState)
        }

        target.addEventListener("scroll", handleScroll, {
            passive: true,
        })

        window.addEventListener("resize", updateScrollState)

        updateScrollState()

        return () => {
            target.removeEventListener("scroll", handleScroll)

            window.removeEventListener("resize", updateScrollState)
        }
    }, [isStaticRenderer, getScrollTarget, updateScrollState])

    /* ---------------------------------------------------
       MEASURE BUTTON
    --------------------------------------------------- */

    React.useLayoutEffect(() => {
        /*
         * ResizeObserver is a continuous effect.
         * Do not create it during static rendering.
         */
        if (isStaticRenderer) {
            return
        }

        const element = buttonRef.current

        if (!element) {
            return
        }

        const updateSize = () => {
            const rect = element.getBoundingClientRect()

            if (rect.width > 0 && rect.height > 0) {
                setButtonSize({
                    width: rect.width,
                    height: rect.height,
                })
            }
        }

        updateSize()

        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(updateSize)

            observer.observe(element)

            return () => observer.disconnect()
        }

        window.addEventListener("resize", updateSize)

        return () => window.removeEventListener("resize", updateSize)
    }, [
        isStaticRenderer,
        settings.layout,
        settings.text,
        settings.icon,
        settings.iconSize,
        settings.textSize,
        settings.fontWeight,
        settings.gap,
        settings.paddingX,
        settings.paddingY,
        settings.size,
    ])

    /* ---------------------------------------------------
       SCROLL TO TOP
    --------------------------------------------------- */

    const scrollToTop = React.useCallback(() => {
        if (isStaticRenderer || typeof window === "undefined") {
            return
        }

        const target = getScrollTarget()

        const behavior =
            reducedMotion || settings.behavior === "instant" ? "auto" : "smooth"

        if (target === window) {
            window.scrollTo({
                top: 0,
                behavior,
            })
        } else {
            ;(target as HTMLElement).scrollTo({
                top: 0,
                behavior,
            })
        }
    }, [isStaticRenderer, getScrollTarget, reducedMotion, settings.behavior])

    /* ---------------------------------------------------
       KEYBOARD
    --------------------------------------------------- */

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            scrollToTop()
        }
    }

    /* ---------------------------------------------------
       LAYOUT
    --------------------------------------------------- */

    const isIconOnly = settings.layout === "icon"

    const isTextOnly = settings.layout === "text"

    const isHorizontal =
        settings.layout === "textIcon" || settings.layout === "iconText"

    const buttonWidth = isIconOnly ? settings.size : "max-content"

    const buttonHeight = isIconOnly ? settings.size : "auto"

    /* ---------------------------------------------------
       POSITION
    --------------------------------------------------- */

    const positionStyle = {
        position: "fixed" as const,

        ...getHorizontalPosition(settings.position, settings.offsetX),

        ...(settings.verticalPosition === "top"
            ? {
                  top: settings.offsetY,
                  bottom: "auto",
              }
            : {
                  bottom: settings.offsetY,
                  top: "auto",
              }),
    }

    /* ---------------------------------------------------
       SHAPE
    --------------------------------------------------- */

    const shapeStyle = getShapeStyles(settings.shape, settings.customRadius)

    /* ---------------------------------------------------
       ENTRANCE
    --------------------------------------------------- */

    const getInitial = () => {
        /*
         * Static rendering must never start
         * with an animated hidden state.
         */
        if (isStaticRenderer || reducedMotion || settings.entrance === "none") {
            return {
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
            }
        }

        switch (settings.entrance) {
            case "fade":
                return {
                    opacity: 0,
                    scale: 1,
                    x: 0,
                    y: 0,
                }

            case "slideUp":
                return {
                    opacity: 0,
                    scale: 1,
                    x: 0,
                    y: 18,
                }

            case "slideSide":
                return {
                    opacity: 0,
                    scale: 1,
                    x: settings.position === "left" ? -18 : 18,
                    y: 0,
                }

            case "fadeScale":
            default:
                return {
                    opacity: 0,
                    scale: 0.88,
                    x: 0,
                    y: 0,
                }
        }
    }

    const animateState = displayVisible
        ? {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
          }
        : {
              opacity: 0,
              scale: settings.entrance === "fadeScale" ? 0.88 : 1,
              x: 0,
              y: settings.entrance === "slideUp" ? 18 : 0,
          }

    /*
     * Static renderer gets a fixed state.
     * Live website retains the full animation system.
     */
    const staticAnimationState = {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
    }

    /* ---------------------------------------------------
       CONTENT
    --------------------------------------------------- */

    const iconElement = <Icon type={settings.icon} size={settings.iconSize} />

    const textElement = (
        <span
            style={{
                whiteSpace: "nowrap",
                lineHeight: 1,
                fontSize: settings.textSize,
                fontWeight: settings.fontWeight,
                fontFamily: "inherit",
                display: "block",
            }}
        >
            {settings.text}
        </span>
    )

    let content: React.ReactNode

    switch (settings.layout) {
        case "text":
            content = textElement
            break

        case "textIcon":
            content = (
                <>
                    {textElement}
                    {iconElement}
                </>
            )
            break

        case "iconText":
            content = (
                <>
                    {iconElement}
                    {textElement}
                </>
            )
            break

        case "icon":
        default:
            content = iconElement
            break
    }

    /* ---------------------------------------------------
       RENDER
    --------------------------------------------------- */

    return (
        <motion.button
            ref={buttonRef}
            type="button"
            aria-label={settings.ariaLabel}
            aria-hidden={!displayVisible}
            tabIndex={displayVisible ? 0 : -1}
            onClick={scrollToTop}
            onKeyDown={handleKeyDown}
            /*
             * STATIC RENDERER:
             * No entrance animation.
             */
            initial={isStaticRenderer ? false : getInitial()}
            /*
             * STATIC RENDERER:
             * Fixed visual state.
             */
            animate={isStaticRenderer ? staticAnimationState : animateState}
            /*
             * STATIC RENDERER:
             * Animation duration is zero.
             */
            transition={
                isStaticRenderer
                    ? {
                          duration: 0,
                      }
                    : {
                          duration: reducedMotion ? 0 : settings.duration,
                          ease: [0.22, 1, 0.36, 1],
                      }
            }
            /*
             * STATIC RENDERER:
             * No hover animation.
             */
            whileHover={
                isStaticRenderer || reducedMotion
                    ? undefined
                    : {
                          scale: settings.hoverScale,
                          rotate: settings.hoverRotation,
                      }
            }
            /*
             * STATIC RENDERER:
             * No press animation.
             */
            whileTap={
                isStaticRenderer || reducedMotion
                    ? undefined
                    : {
                          scale: settings.tapScale,
                      }
            }
            style={{
                ...positionStyle,

                width: buttonWidth,

                height: buttonHeight,

                minWidth: isIconOnly ? settings.size : 0,

                minHeight: isIconOnly ? settings.size : 0,

                padding: isIconOnly
                    ? 0
                    : `${settings.paddingY}px ${settings.paddingX}px`,

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                flexDirection: "row",

                gap: isHorizontal ? settings.gap : 0,

                boxSizing: "border-box",

                background: settings.background,

                color: settings.foreground,

                border: `${settings.borderWidth}px solid ${settings.borderColor}`,

                boxShadow: settings.shadow,

                cursor: "pointer",

                overflow: "visible",

                WebkitTapHighlightColor: "transparent",

                touchAction: "manipulation",

                fontFamily: "inherit",

                zIndex: 9999,

                pointerEvents: displayVisible ? "auto" : "none",

                ...shapeStyle,
            }}
        >
            {/* -----------------------------------------
                PROGRESS INDICATOR
            ----------------------------------------- */}

            {settings.showProgress &&
                buttonSize.width > 0 &&
                buttonSize.height > 0 && (
                    <ProgressIndicator
                        shape={settings.shape}
                        width={buttonSize.width}
                        height={buttonSize.height}
                        radius={settings.customRadius}
                        progress={isStaticRenderer ? 0 : scrollProgress}
                        color={settings.progressColor}
                        strokeWidth={settings.progressWidth}
                        gap={settings.progressGap}
                        opacity={settings.progressOpacity}
                        direction={settings.progressDirection}
                        isStaticRenderer={isStaticRenderer}
                    />
                )}

            {/* -----------------------------------------
                CONTENT
            ----------------------------------------- */}

            <span
                style={{
                    position: "relative",

                    zIndex: 2,

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

                    gap: isHorizontal ? settings.gap : 0,

                    width: isIconOnly ? "100%" : "max-content",

                    height: isIconOnly ? "100%" : "auto",

                    flexDirection: "row",

                    pointerEvents: "none",
                }}
            >
                {content}
            </span>
        </motion.button>
    )
}

/* -------------------------------------------------------
   DEFAULT PROPS
------------------------------------------------------- */

BackToTop.defaultProps = DEFAULTS

/* -------------------------------------------------------
   PROPERTY CONTROLS
------------------------------------------------------- */

addPropertyControls(BackToTop, {
    /* ---------------------------------------------
       BEHAVIOR
    --------------------------------------------- */

    threshold: {
        type: ControlType.Number,
        title: "Show After",
        defaultValue: 100,
        min: 0,
        max: 3000,
        step: 10,
        unit: "px",
        displayStepper: true,
        description: "Button appears after this amount of scrolling.",
    },

    behavior: {
        type: ControlType.Enum,
        title: "Scroll",
        defaultValue: "smooth",
        options: ["smooth", "instant"],
        optionTitles: ["Smooth", "Instant"],
    },

    customScrollSelector: {
        type: ControlType.String,
        title: "Scroll Container",
        defaultValue: "",
        placeholder: "e.g. .scroll-container",
        description: "Optional CSS selector for a custom scrolling container.",
    },

    /* ---------------------------------------------
       CONTENT
    --------------------------------------------- */

    layout: {
        type: ControlType.Enum,
        title: "Layout",
        defaultValue: "icon",
        options: ["icon", "textIcon", "iconText", "text"],
        optionTitles: ["Icon", "Text + Icon", "Icon + Text", "Text"],
    },

    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Back to top",
        hidden: (props) => props.layout === "icon",
    },

    icon: {
        type: ControlType.Enum,
        title: "Icon",
        defaultValue: "chevron",
        options: ["chevron", "arrow", "doubleChevron", "caret", "longArrow"],
        optionTitles: [
            "Chevron",
            "Arrow",
            "Double Chevron",
            "Caret",
            "Long Arrow",
        ],
        hidden: (props) => props.layout === "text",
    },

    /* ---------------------------------------------
       SHAPE
    --------------------------------------------- */

    shape: {
        type: ControlType.Enum,
        title: "Shape",
        defaultValue: "circle",
        options: [
            "circle",
            "square",
            "rounded",
            "rectangle",
            "pill",
            "diamond",
            "hexagon",
            "octagon",
            "custom",
        ],
        optionTitles: [
            "Circle",
            "Square",
            "Rounded",
            "Rectangle",
            "Pill",
            "Diamond",
            "Hexagon",
            "Octagon",
            "Custom",
        ],
    },

    customRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) =>
            props.shape !== "rounded" &&
            props.shape !== "rectangle" &&
            props.shape !== "custom",
    },

    /* ---------------------------------------------
       SIZE
    --------------------------------------------- */

    size: {
        type: ControlType.Number,
        title: "Button Size",
        defaultValue: 56,
        min: 32,
        max: 160,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => props.layout !== "icon",
    },

    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 22,
        min: 10,
        max: 64,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => props.layout === "text",
    },

    textSize: {
        type: ControlType.Number,
        title: "Text Size",
        defaultValue: 14,
        min: 8,
        max: 32,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => props.layout === "icon",
    },

    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 600,
        min: 300,
        max: 900,
        step: 100,
        displayStepper: true,
        hidden: (props) => props.layout === "icon",
    },

    gap: {
        type: ControlType.Number,
        title: "Icon Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => props.layout === "icon" || props.layout === "text",
    },

    paddingX: {
        type: ControlType.Number,
        title: "Horizontal",
        defaultValue: 18,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => props.layout === "icon",
    },

    paddingY: {
        type: ControlType.Number,
        title: "Vertical",
        defaultValue: 12,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => props.layout === "icon",
    },

    /* ---------------------------------------------
       COLORS
    --------------------------------------------- */

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },

    foreground: {
        type: ControlType.Color,
        title: "Text / Icon",
        defaultValue: "#FFFFFF",
    },

    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(0,0,0,0)",
    },

    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
        max: 8,
        step: 1,
        unit: "px",
        displayStepper: true,
    },

    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0px 8px 30px 0px rgba(0,0,0,0.16)",
    },

    /* ---------------------------------------------
       SCROLL PROGRESS
    --------------------------------------------- */

    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    progressColor: {
        type: ControlType.Color,
        title: "Progress Color",
        defaultValue: "#111111",
        hidden: (props) => !props.showProgress,
    },

    progressWidth: {
        type: ControlType.Number,
        title: "Progress Width",
        defaultValue: 3,
        min: 1,
        max: 12,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => !props.showProgress,
    },

    progressGap: {
        type: ControlType.Number,
        title: "Progress Gap",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => !props.showProgress,
    },

    progressOpacity: {
        type: ControlType.Number,
        title: "Progress Opacity",
        defaultValue: 1,
        min: 0.1,
        max: 1,
        step: 0.05,
        displayStepper: true,
        hidden: (props) => !props.showProgress,
    },

    progressDirection: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "clockwise",
        options: ["clockwise", "counterClockwise"],
        optionTitles: ["Clockwise", "Counter-clockwise"],
        displaySegmentedControl: true,
        hidden: (props) => !props.showProgress,
    },

    /* ---------------------------------------------
       POSITION
    --------------------------------------------- */

    position: {
        type: ControlType.Enum,
        title: "Horizontal",
        defaultValue: "right",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },

    verticalPosition: {
        type: ControlType.Enum,
        title: "Vertical",
        defaultValue: "bottom",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        displaySegmentedControl: true,
    },

    offsetX: {
        type: ControlType.Number,
        title: "Horizontal Offset",
        defaultValue: 24,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
    },

    offsetY: {
        type: ControlType.Number,
        title: "Vertical Offset",
        defaultValue: 24,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
    },

    /* ---------------------------------------------
       ANIMATION
    --------------------------------------------- */

    entrance: {
        type: ControlType.Enum,
        title: "Entrance",
        defaultValue: "fadeScale",
        options: ["fadeScale", "fade", "slideUp", "slideSide", "none"],
        optionTitles: [
            "Fade + Scale",
            "Fade",
            "Slide Up",
            "Slide Side",
            "None",
        ],
    },

    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.25,
        step: 0.01,
    },

    hoverRotation: {
        type: ControlType.Number,
        title: "Hover Rotation",
        defaultValue: 0,
        min: -20,
        max: 20,
        step: 1,
        unit: "deg",
    },

    tapScale: {
        type: ControlType.Number,
        title: "Press Scale",
        defaultValue: 0.94,
        min: 0.75,
        max: 1,
        step: 0.01,
    },

    duration: {
        type: ControlType.Number,
        title: "Animation",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
        unit: "s",
    },

    /* ---------------------------------------------
       ACCESSIBILITY
    --------------------------------------------- */

    ariaLabel: {
        type: ControlType.String,
        title: "Accessibility Label",
        defaultValue: "Back to top",
        description: "Accessible name announced by screen readers.",
    },
})
