// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

const CAMERA_IMG =
    "https://framerusercontent.com/images/faSQCsjxWAxm797J8v2vs5UOYNU.png"
const DIAL_IMG =
    "https://framerusercontent.com/images/AhAM7E9LUSjcdWreLEPhzQuPw.png"

const DEFAULT_SLIDES = [
    "https://framerusercontent.com/images/RhJSKj5uuUQDI1KFRuqkeoVg.jpg",
    "https://framerusercontent.com/images/Y3Qavz8u5eqQ0HxFyVKIQXjs2I.jpg",
    "https://framerusercontent.com/images/Df5YIiBmPpfRrogEUJUyegiuuV0.jpg",
]

type Props = {
    slides?: string[]
    slideAlt?: string[]
    cameraImage?: string
    dialImage?: string
    cameraWidth?: number
    screenLeft?: number
    screenTop?: number
    screenWidth?: number
    screenHeight?: number
    screenRadius?: number
    dialLeft?: number
    dialTop?: number
    dialWidth?: number
    dialStep?: number
    transitionStyle?: "fade" | "slide"
    speed?: number
    autoPlay?: boolean
    interval?: number
    pauseOnHover?: boolean
    loop?: boolean
    dragToChange?: boolean
    showGrid?: boolean
    showBrackets?: boolean
    bracketColor?: string
    showDots?: boolean
    dotColor?: string
    showBackdrop?: boolean
    backdropBlur?: number
    backdropHeight?: number
    backdropOffset?: number
    shadow?: boolean
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    slides: DEFAULT_SLIDES,
    slideAlt: [],
    cameraImage: CAMERA_IMG,
    dialImage: DIAL_IMG,
    cameraWidth: 460,
    screenLeft: 12.84,
    screenTop: 43.3,
    screenWidth: 47.5,
    screenHeight: 43.1,
    screenRadius: 8,
    dialLeft: 64.72,
    dialTop: 63.2,
    dialWidth: 18.8,
    dialStep: 20,
    transitionStyle: "fade",
    speed: 0.35,
    autoPlay: false,
    interval: 4,
    pauseOnHover: true,
    loop: true,
    dragToChange: true,
    showGrid: true,
    showBrackets: true,
    bracketColor: "rgba(255,255,255,0.95)",
    showDots: true,
    dotColor: "rgba(255,255,255,0.95)",
    showBackdrop: true,
    backdropBlur: 28,
    backdropHeight: 62,
    backdropOffset: 30,
    shadow: true,
}

function withDefaults(props: Props): Required<Omit<Props, "style">> & {
    style?: React.CSSProperties
} {
    const merged: any = { ...DEFAULTS }
    const given: any = props || {}
    Object.keys(given).forEach((key) => {
        if (given[key] !== undefined) merged[key] = given[key]
    })
    return merged
}

/* --------------------------------------------------------------- colour */

/** Returns the same colour at a different alpha, so the inactive dots follow
 *  whatever the buyer picked for Dot color instead of staying white. */
function fade(color: string, alpha: number): string {
    const c = (color || "").trim()
    const rgb = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
    if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`
    let hex = c.replace("#", "")
    if (hex.length === 3 || hex.length === 4)
        hex = hex
            .split("")
            .map((ch) => ch + ch)
            .join("")
    if (hex.length === 6 || hex.length === 8) {
        const n = parseInt(hex.slice(0, 6), 16)
        if (!isNaN(n))
            return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
    }
    return `rgba(255, 255, 255, ${alpha})`
}

/* ------------------------------------------------------------------ dot */

/** The visible pill is 6px tall, but the button around it is 24px so it can
 *  actually be tapped. The padding is transparent, so nothing looks different. */
function Dot({
    index,
    active,
    color,
    inactiveColor,
    reduce,
    onSelect,
}: {
    index: number
    active: boolean
    color: string
    inactiveColor: string
    reduce: boolean
    onSelect: (i: number) => void
}) {
    const [focusRing, setFocusRing] = useState(false)
    return (
        <button
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={active}
            onClick={() => onSelect(index)}
            onFocus={(e) => {
                try {
                    if (e.currentTarget.matches(":focus-visible"))
                        setFocusRing(true)
                } catch (err) {
                    setFocusRing(true)
                }
            }}
            onBlur={() => setFocusRing(false)}
            style={{
                display: "block",
                margin: 0,
                padding: "9px 2px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                appearance: "none",
                WebkitTapHighlightColor: "transparent",
                outline: focusRing ? `2px solid ${color}` : "none",
                outlineOffset: -1,
                borderRadius: 4,
                lineHeight: 0,
            }}
        >
            <motion.span
                animate={{
                    width: active ? 18 : 7,
                    background: active ? color : inactiveColor,
                }}
                initial={false}
                transition={{ duration: reduce ? 0 : 0.2 }}
                style={{
                    display: "block",
                    width: active ? 18 : 7,
                    height: 6,
                    borderRadius: 3,
                    background: active ? color : inactiveColor,
                    boxShadow: "0 0 3px rgba(0,0,0,0.45)",
                }}
            />
        </button>
    )
}

/* ---------------------------------------------------------------- screen */

type ViewfinderProps = {
    images: string[]
    alts: string[]
    activeIndex: number
    direction: number
    onSwipe: (dir: number) => void
    onKey: (e: React.KeyboardEvent) => void
    transitionStyle: "fade" | "slide"
    speed: number
    showGrid: boolean
    showBrackets: boolean
    bracketColor: string
    dragToChange: boolean
    isStatic: boolean
    reduce: boolean
}

function Viewfinder({
    images,
    alts,
    activeIndex,
    direction,
    onSwipe,
    onKey,
    transitionStyle,
    speed,
    showGrid,
    showBrackets,
    bracketColor,
    dragToChange,
    isStatic,
    reduce,
}: ViewfinderProps) {
    const startX = useRef(0)
    const isDragging = useRef(false)
    const [focusRing, setFocusRing] = useState(false)

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!dragToChange) return
        isDragging.current = true
        startX.current = e.clientX
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch (err) {}
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging.current) return
        isDragging.current = false
        const diff = startX.current - e.clientX
        if (Math.abs(diff) > 20) onSwipe(diff > 0 ? 1 : -1)
    }

    const imageStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        pointerEvents: "none",
        userSelect: "none",
    }

    const variants =
        transitionStyle === "slide"
            ? {
                  enter: (dir: number) => ({
                      x: dir >= 0 ? "100%" : "-100%",
                      opacity: 1,
                  }),
                  center: { x: 0, opacity: 1 },
                  exit: (dir: number) => ({
                      x: dir >= 0 ? "-100%" : "100%",
                      opacity: 1,
                  }),
              }
            : {
                  enter: { opacity: 0, scale: 1.04 },
                  center: { opacity: 1, scale: 1 },
                  exit: { opacity: 0, scale: 0.97 },
              }

    return (
        <div
            onPointerDown={isStatic ? undefined : handlePointerDown}
            onPointerUp={isStatic ? undefined : handlePointerUp}
            onKeyDown={isStatic ? undefined : onKey}
            onFocus={
                isStatic
                    ? undefined
                    : (e) => {
                          try {
                              if (e.currentTarget.matches(":focus-visible"))
                                  setFocusRing(true)
                          } catch (err) {
                              setFocusRing(true)
                          }
                      }
            }
            onBlur={isStatic ? undefined : () => setFocusRing(false)}
            tabIndex={isStatic ? undefined : 0}
            role="group"
            aria-roledescription="carousel"
            aria-label="Photo slider"
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative",
                cursor: dragToChange && !isStatic ? "grab" : "default",
                background: "#000",
                outline: "none",
                touchAction: "pan-y",
                boxShadow: focusRing
                    ? `inset 0 0 0 2px ${bracketColor}`
                    : "none",
            }}
        >
            {isStatic ? (
                <img
                    src={images[0]}
                    alt={alts[0] || ""}
                    style={imageStyle}
                    draggable={false}
                />
            ) : (
                <AnimatePresence initial={false} custom={direction}>
                    <motion.img
                        key={activeIndex}
                        custom={direction}
                        src={images[activeIndex]}
                        alt={alts[activeIndex] || ""}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            duration: reduce ? 0 : speed,
                            ease: "easeInOut",
                        }}
                        style={{
                            ...imageStyle,
                            position: "absolute",
                            inset: 0,
                        }}
                        draggable={false}
                    />
                </AnimatePresence>
            )}

            {showGrid ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                        backgroundSize: "33.33% 33.33%",
                    }}
                />
            ) : null}

            {showBrackets
                ? [
                      {
                          top: 6,
                          left: 6,
                          borderTop: `2px solid ${bracketColor}`,
                          borderLeft: `2px solid ${bracketColor}`,
                      },
                      {
                          top: 6,
                          right: 6,
                          borderTop: `2px solid ${bracketColor}`,
                          borderRight: `2px solid ${bracketColor}`,
                      },
                      {
                          bottom: 6,
                          left: 6,
                          borderBottom: `2px solid ${bracketColor}`,
                          borderLeft: `2px solid ${bracketColor}`,
                      },
                      {
                          bottom: 6,
                          right: 6,
                          borderBottom: `2px solid ${bracketColor}`,
                          borderRight: `2px solid ${bracketColor}`,
                      },
                  ].map((s, i) => (
                      <div
                          key={i}
                          style={{
                              position: "absolute",
                              width: 14,
                              height: 14,
                              pointerEvents: "none",
                              ...s,
                          }}
                      />
                  ))
                : null}
        </div>
    )
}

/* ------------------------------------------------------------- component */

/**
 * DSLR Slider
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 352
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function DSLRSlider(props: Props) {
    const p = withDefaults(props)
    const isStatic = useIsStaticRenderer()
    const reduce = !!useReducedMotion()

    const list = (p.slides || []).filter(Boolean)
    const images = list.length > 0 ? list : DEFAULT_SLIDES
    const count = images.length

    const [activeIndex, setActiveIndex] = useState(0)
    const [direction, setDirection] = useState(1)
    const [dialRotation, setDialRotation] = useState(0)
    const [hovered, setHovered] = useState(false)
    const [cameraFailed, setCameraFailed] = useState(false)

    const safeIndex = Math.min(activeIndex, count - 1)

    const goTo = useCallback(
        (idx: number) => {
            let next = idx
            if (p.loop) {
                next = ((idx % count) + count) % count
            } else {
                next = Math.max(0, Math.min(count - 1, idx))
            }
            if (next === safeIndex) return
            let steps = next - safeIndex
            if (p.loop) {
                if (steps > count / 2) steps -= count
                if (steps < -count / 2) steps += count
            }
            setDirection(steps >= 0 ? 1 : -1)
            setDialRotation((r) => r + steps * p.dialStep)
            setActiveIndex(next)
        },
        [safeIndex, count, p.loop, p.dialStep]
    )

    const step = useCallback(
        (dir: number) => goTo(safeIndex + dir),
        [goTo, safeIndex]
    )

    const handleKey = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowRight") {
                e.preventDefault()
                step(1)
            } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                step(-1)
            }
        },
        [step]
    )

    const paused = p.pauseOnHover && hovered
    useEffect(() => {
        if (isStatic) return
        if (reduce) return
        if (!p.autoPlay) return
        if (paused) return
        if (count < 2) return
        const ms = Math.max(1, p.interval) * 1000
        const id = window.setInterval(() => {
            setDirection(1)
            setDialRotation((r) => r + p.dialStep)
            setActiveIndex((i) => {
                const next = i + 1
                if (next >= count) return p.loop ? 0 : i
                return next
            })
        }, ms)
        return () => window.clearInterval(id)
    }, [
        isStatic,
        reduce,
        p.autoPlay,
        paused,
        p.interval,
        p.loop,
        p.dialStep,
        count,
    ])

    const inactiveDot = fade(p.dotColor, 0.38)

    const dots =
        p.showDots && count > 1 ? (
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -1,
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "center",
                    columnGap: 1,
                    rowGap: 0,
                    padding: "0 4px",
                    zIndex: 3,
                }}
            >
                {images.map((_, i) =>
                    isStatic ? (
                        <div
                            key={i}
                            style={{
                                margin: "9px 2px",
                                width: i === 0 ? 18 : 7,
                                height: 6,
                                borderRadius: 3,
                                background: i === 0 ? p.dotColor : inactiveDot,
                                boxShadow: "0 0 3px rgba(0,0,0,0.45)",
                            }}
                        />
                    ) : (
                        <Dot
                            key={i}
                            index={i}
                            active={i === safeIndex}
                            color={p.dotColor}
                            inactiveColor={inactiveDot}
                            reduce={reduce}
                            onSelect={goTo}
                        />
                    )
                )}
            </div>
        ) : null

    return (
        <div
            onMouseEnter={isStatic ? undefined : () => setHovered(true)}
            onMouseLeave={isStatic ? undefined : () => setHovered(false)}
            style={{
                width: "100%",
                height: "100%",
                minHeight: 24,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                ...(p.style || {}),
            }}
        >
            {p.showBackdrop ? (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        right: 0,
                        transform: `translateY(calc(-50% + ${p.backdropOffset}px))`,
                        height: `${p.backdropHeight}%`,
                        overflow: "hidden",
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                >
                    {isStatic ? (
                        <div
                            style={{
                                position: "absolute",
                                inset: `-${p.backdropBlur * 2.5}px`,
                                backgroundImage: `url(${images[0]})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                filter: `blur(${p.backdropBlur}px) brightness(0.7) saturate(1.2)`,
                            }}
                        />
                    ) : (
                        <AnimatePresence>
                            <motion.div
                                key={safeIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: reduce ? 0 : 0.7 }}
                                style={{
                                    position: "absolute",
                                    inset: `-${p.backdropBlur * 2.5}px`,
                                    backgroundImage: `url(${images[safeIndex]})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    filter: `blur(${p.backdropBlur}px) brightness(0.7) saturate(1.2)`,
                                }}
                            />
                        </AnimatePresence>
                    )}
                </div>
            ) : null}

            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: `min(${Math.max(1, p.cameraWidth)}px, 85%)`,
                    flexShrink: 0,
                }}
            >
                <img
                    src={
                        cameraFailed ? CAMERA_IMG : p.cameraImage || CAMERA_IMG
                    }
                    alt=""
                    onError={() => setCameraFailed(true)}
                    style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                        userSelect: "none",
                        pointerEvents: "none",
                        filter: p.shadow
                            ? "drop-shadow(0 16px 40px rgba(0,0,0,0.5))"
                            : "none",
                    }}
                    draggable={false}
                />

                <div
                    style={{
                        position: "absolute",
                        top: `${p.screenTop}%`,
                        left: `${p.screenLeft}%`,
                        width: `${p.screenWidth}%`,
                        height: `${p.screenHeight}%`,
                        overflow: "hidden",
                        borderRadius: p.screenRadius,
                    }}
                >
                    <Viewfinder
                        images={images}
                        alts={p.slideAlt || []}
                        activeIndex={safeIndex}
                        direction={direction}
                        onSwipe={step}
                        onKey={handleKey}
                        transitionStyle={p.transitionStyle}
                        speed={p.speed}
                        showGrid={p.showGrid}
                        showBrackets={p.showBrackets}
                        bracketColor={p.bracketColor}
                        dragToChange={p.dragToChange}
                        isStatic={isStatic}
                        reduce={reduce}
                    />
                    {dots}
                    {isStatic ? null : (
                        <div
                            aria-live="polite"
                            aria-atomic="true"
                            style={{
                                position: "absolute",
                                width: 1,
                                height: 1,
                                overflow: "hidden",
                                clip: "rect(0 0 0 0)",
                                clipPath: "inset(50%)",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {`Slide ${safeIndex + 1} of ${count}`}
                        </div>
                    )}
                </div>

                {p.dialImage ? (
                    isStatic ? (
                        <img
                            src={p.dialImage}
                            alt=""
                            style={{
                                position: "absolute",
                                top: `${p.dialTop}%`,
                                left: `${p.dialLeft}%`,
                                width: `${p.dialWidth}%`,
                                height: "auto",
                                pointerEvents: "none",
                            }}
                            draggable={false}
                        />
                    ) : (
                        <motion.img
                            src={p.dialImage}
                            alt=""
                            animate={{ rotate: dialRotation }}
                            transition={
                                reduce
                                    ? { duration: 0 }
                                    : {
                                          type: "spring",
                                          stiffness: 200,
                                          damping: 24,
                                      }
                            }
                            style={{
                                position: "absolute",
                                top: `${p.dialTop}%`,
                                left: `${p.dialLeft}%`,
                                width: `${p.dialWidth}%`,
                                height: "auto",
                                userSelect: "none",
                                pointerEvents: "none",
                                transformOrigin: "center center",
                            }}
                            draggable={false}
                        />
                    )
                ) : null}
            </div>
        </div>
    )
}

addPropertyControls(DSLRSlider, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: { type: ControlType.Image },
        maxCount: 20,
        description:
            "Your photographs. Leave this empty and the three demo photos are shown instead.",
    },
    slideAlt: {
        type: ControlType.Array,
        title: "Alt text",
        control: {
            type: ControlType.String,
            placeholder: "What is in the photo",
        },
        maxCount: 20,
        description:
            "One line per slide, in the same order. Read out by screen readers and used by image search.",
    },
    transitionStyle: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["fade", "slide"],
        optionTitles: ["Fade", "Slide"],
        defaultValue: DEFAULTS.transitionStyle,
        displaySegmentedControl: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: DEFAULTS.speed,
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: DEFAULTS.autoPlay,
    },
    interval: {
        type: ControlType.Number,
        title: "Every",
        min: 1,
        max: 20,
        step: 0.5,
        unit: "s",
        defaultValue: DEFAULTS.interval,
        hidden: (props) => !props.autoPlay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on hover",
        defaultValue: DEFAULTS.pauseOnHover,
        hidden: (props) => !props.autoPlay,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: DEFAULTS.loop,
    },
    dragToChange: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: DEFAULTS.dragToChange,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Dots",
        defaultValue: DEFAULTS.showDots,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot color",
        defaultValue: DEFAULTS.dotColor,
        hidden: (props) => !props.showDots,
        description:
            "The dots you have not selected use the same colour, faded.",
    },
    showGrid: {
        type: ControlType.Boolean,
        title: "Grid",
        defaultValue: DEFAULTS.showGrid,
    },
    showBrackets: {
        type: ControlType.Boolean,
        title: "Brackets",
        defaultValue: DEFAULTS.showBrackets,
    },
    bracketColor: {
        type: ControlType.Color,
        title: "Bracket color",
        defaultValue: DEFAULTS.bracketColor,
        hidden: (props) => !props.showBrackets,
    },
    showBackdrop: {
        type: ControlType.Boolean,
        title: "Backdrop",
        defaultValue: DEFAULTS.showBackdrop,
    },
    backdropBlur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: DEFAULTS.backdropBlur,
        hidden: (props) => !props.showBackdrop,
    },
    backdropHeight: {
        type: ControlType.Number,
        title: "Band height",
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: DEFAULTS.backdropHeight,
        hidden: (props) => !props.showBackdrop,
    },
    backdropOffset: {
        type: ControlType.Number,
        title: "Band offset",
        min: -400,
        max: 400,
        step: 1,
        unit: "px",
        defaultValue: DEFAULTS.backdropOffset,
        hidden: (props) => !props.showBackdrop,
        description:
            "Moves the blurred band up or down relative to the middle of the component.",
    },
    cameraWidth: {
        type: ControlType.Number,
        title: "Camera size",
        min: 200,
        max: 1200,
        step: 10,
        unit: "px",
        defaultValue: DEFAULTS.cameraWidth,
        description:
            "The camera never grows past 85% of the section, so it shrinks by itself on a phone.",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: DEFAULTS.shadow,
    },
    cameraImage: {
        type: ControlType.Image,
        title: "Camera",
        description:
            "Your own camera photograph. After swapping it, set Screen X/Y/W/H below to put the picture on its display.",
    },
    dialImage: {
        type: ControlType.Image,
        title: "Dial",
        description: "Clear this if your camera has no wheel to turn.",
    },
    dialStep: {
        type: ControlType.Number,
        title: "Dial turn",
        min: 0,
        max: 180,
        step: 5,
        unit: "°",
        defaultValue: DEFAULTS.dialStep,
        description: "How far the wheel turns for every slide you move past.",
    },
    screenLeft: {
        type: ControlType.Number,
        title: "Screen X",
        min: 0,
        max: 100,
        step: 0.5,
        unit: "%",
        defaultValue: DEFAULTS.screenLeft,
        description:
            "ADVANCED. Left edge of the display, as a percentage of the CAMERA IMAGE, not of the section.",
    },
    screenTop: {
        type: ControlType.Number,
        title: "Screen Y",
        min: 0,
        max: 100,
        step: 0.5,
        unit: "%",
        defaultValue: DEFAULTS.screenTop,
        description:
            "Top edge of the display, as a percentage of the camera image.",
    },
    screenWidth: {
        type: ControlType.Number,
        title: "Screen W",
        min: 1,
        max: 100,
        step: 0.5,
        unit: "%",
        defaultValue: DEFAULTS.screenWidth,
        description:
            "Width of the display, as a percentage of the camera image.",
    },
    screenHeight: {
        type: ControlType.Number,
        title: "Screen H",
        min: 1,
        max: 100,
        step: 0.5,
        unit: "%",
        defaultValue: DEFAULTS.screenHeight,
        description:
            "Height of the display, as a percentage of the camera image.",
    },
    screenRadius: {
        type: ControlType.Number,
        title: "Screen radius",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: DEFAULTS.screenRadius,
    },
    dialLeft: {
        type: ControlType.Number,
        title: "Dial X",
        min: 0,
        max: 100,
        step: 0.5,
        unit: "%",
        defaultValue: DEFAULTS.dialLeft,
        description:
            "ADVANCED. Left edge of the dial image, as a percentage of the camera image. This is its corner, not its centre.",
    },
    dialTop: {
        type: ControlType.Number,
        title: "Dial Y",
        min: 0,
        max: 100,
        step: 0.5,
        unit: "%",
        defaultValue: DEFAULTS.dialTop,
        description:
            "Top edge of the dial image, as a percentage of the camera image.",
    },
    dialWidth: {
        type: ControlType.Number,
        title: "Dial W",
        min: 1,
        max: 100,
        step: 0.5,
        unit: "%",
        defaultValue: DEFAULTS.dialWidth,
        description:
            "Width of the dial image, as a percentage of the camera image.",
    },
})
