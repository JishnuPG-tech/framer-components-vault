import * as React from "react"
import {
    motion,
    useMotionTemplate,
    useMotionValue,
    useReducedMotion,
    useSpring,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SplashGradientButtonProps {
    text?: string
    preset?: "Purple" | "Orange" | "Blue" | "Custom"
    gradientColors?: string[]
    fontStyle?: React.CSSProperties
    textColor?: string
    hoverTextColor?: string
    borderRadius?: number
    borderWidth?: number
    bezelSize?: number
    glowOpacity?: number
    glowSize?: number
    grain?: number
    animateGradient?: boolean
    animationDuration?: number
    hoverIntensity?: number
    clickIntensity?: number
    showIcon?: boolean
    iconType?: "Sparkles" | "Custom SVG"
    icon?: string
    iconPosition?: "Left" | "Right"
    iconSize?: number
    gap?: number
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
    paddingLeft?: number
    link?: string
    newTab?: boolean
    onClick?: React.MouseEventHandler<HTMLElement>
    style?: React.CSSProperties
}

const PALETTES = {
    Purple: ["#4317C2", "#906FE2", "#CFA9FF"],
    Orange: ["#B44D08", "#E58672", "#FCCEB6"],
    Blue: ["#0D46B9", "#71A7E3", "#AAECFA"],
}
const FONT: React.CSSProperties = {
    fontFamily: '"Inter", "Arial", sans-serif',
    fontSize: 27,
    fontWeight: 400,
    letterSpacing: "-0.045em",
    lineHeight: "1em",
}
const SPARKLES =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor"><path d="M21 1c1.2 7 3 8.8 10 10-7 1.2-8.8 3-10 10-1.2-7-3-8.8-10-10 7-1.2 8.8-3 10-10Z"/><path d="M9 16c.7 4.2 1.8 5.3 6 6-4.2.7-5.3 1.8-6 6-.7-4.2-1.8-5.3-6-6 4.2-.7 5.3-1.8 6-6ZM6 3c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3Z"/></svg>'

// A static procedural texture: no image downloads or external assets.
const NOISE = `url("data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" seed="8"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" opacity="0.8" filter="url(#n)"/></svg>'
)}")`

const layer: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
}
const ring: React.CSSProperties = {
    ...layer,
    boxSizing: "border-box",
    WebkitMask:
        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
}
const transparent = (color: string, percent: number) =>
    `color-mix(in srgb, ${color} ${percent}%, transparent)`

/**
 * @framerIntrinsicWidth 450
 * @framerIntrinsicHeight 94
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SplashGradientButton(props: SplashGradientButtonProps) {
    const {
        text = "Generate AI",
        preset = "Purple",
        gradientColors = PALETTES.Purple,
        fontStyle = FONT,
        textColor = "#FFFFFF",
        hoverTextColor = "#FFFFFF",
        borderRadius = 999,
        borderWidth = 1.5,
        bezelSize = 8,
        glowOpacity = 0.45,
        glowSize = 18,
        grain = 0.12,
        animateGradient = true,
        animationDuration = 8,
        hoverIntensity = 1,
        clickIntensity = 1,
        showIcon = true,
        iconType = "Sparkles",
        icon = "",
        iconPosition = "Right",
        iconSize = 28,
        gap = 12,
        paddingTop = 31,
        paddingRight = 135,
        paddingBottom = 31,
        paddingLeft = 135,
        link,
        newTab = false,
        onClick,
        style,
    } = props

    const reduceMotion = useReducedMotion()
    const [hovered, setHovered] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [pressed, setPressed] = React.useState(false)
    const [burst, setBurst] = React.useState({ id: 0, x: 50, y: 50 })
    const active = hovered || focused
    const running = animateGradient && !reduceMotion
    const duration = Math.max(2, animationDuration)
    const power = Math.max(0, Math.min(2, hoverIntensity))
    const release = Math.max(0, Math.min(2, clickIntensity))
    const glow = Math.max(0, Math.min(1, glowOpacity))
    const stroke = Math.max(0, borderWidth)
    const palette =
        preset === "Custom"
            ? gradientColors
            : PALETTES[preset] || PALETTES.Purple
    const [deep, middle, light] = PALETTES.Purple.map(
        (fallback, i) => palette?.[i] || fallback
    )

    const pointerX = useMotionValue(50)
    const pointerY = useMotionValue(50)
    const lensX = useSpring(pointerX, { stiffness: 120, damping: 24 })
    const lensY = useSpring(pointerY, { stiffness: 120, damping: 24 })
    const lens = useMotionTemplate`radial-gradient(ellipse at ${lensX}% ${lensY}%, ${transparent(light, 80)} 0%, ${transparent(light, 20)} 32%, transparent 66%)`
    const focusColor = { "--cgb-focus-color": light } as React.CSSProperties
    const Component = link ? motion.a : motion.button

    const position = (
        event: React.MouseEvent<HTMLElement> | React.PointerEvent<HTMLElement>
    ) => {
        const rect = event.currentTarget.getBoundingClientRect()
        return {
            x: Math.max(
                0,
                Math.min(
                    100,
                    ((event.clientX - rect.left) / Math.max(1, rect.width)) *
                        100
                )
            ),
            y: Math.max(
                0,
                Math.min(
                    100,
                    ((event.clientY - rect.top) / Math.max(1, rect.height)) *
                        100
                )
            ),
        }
    }
    const colorVariants = {
        rest: { color: textColor },
        hover: { color: hoverTextColor },
        pressed: { color: hoverTextColor },
    }

    const iconElement = showIcon ? (
        <motion.span
            className="cgb-icon"
            aria-hidden="true"
            variants={colorVariants}
            transition={{ duration: 0.2 }}
            style={{
                display: "inline-flex",
                width: iconSize,
                height: iconSize,
                flexShrink: 0,
            }}
        >
            <motion.span
                initial={{
                    rotate: 0,
                    filter: "drop-shadow(0 0 0px transparent)",
                }}
                animate={{
                    rotate: active && !reduceMotion ? [0, -8, 8, 0] : 0,
                    filter: active
                        ? `drop-shadow(0 0 5px ${light})`
                        : "drop-shadow(0 0 0px transparent)",
                }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
                style={{ display: "block", width: "100%", height: "100%" }}
            >
                <motion.span
                    key={`sparkle-${burst.id}`}
                    initial={{ rotate: 0 }}
                    animate={{
                        rotate:
                            burst.id > 0 && !reduceMotion ? [0, -18, 28, 0] : 0,
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={
                        iconType === "Custom SVG" && icon
                            ? {
                                  display: "block",
                                  width: "100%",
                                  height: "100%",
                                  WebkitMaskImage: `url("${icon}")`,
                                  WebkitMaskSize: "contain",
                                  WebkitMaskPosition: "center",
                                  WebkitMaskRepeat: "no-repeat",
                                  maskImage: `url("${icon}")`,
                                  maskSize: "contain",
                                  maskPosition: "center",
                                  maskRepeat: "no-repeat",
                                  backgroundColor: "currentColor",
                              }
                            : {
                                  display: "block",
                                  width: "100%",
                                  height: "100%",
                              }
                    }
                    dangerouslySetInnerHTML={
                        iconType === "Custom SVG"
                            ? undefined
                            : { __html: SPARKLES }
                    }
                />
            </motion.span>
        </motion.span>
    ) : null

    return (
        <Component
            data-cgb=""
            href={link || undefined}
            target={link && newTab ? "_blank" : undefined}
            rel={link && newTab ? "noopener noreferrer" : undefined}
            type={link ? undefined : "button"}
            initial="rest"
            animate={active ? "hover" : "rest"}
            whileHover="hover"
            whileTap="pressed"
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onFocus={(event) =>
                setFocused(event.currentTarget.matches(":focus-visible"))
            }
            onBlur={() => {
                setFocused(false)
                setPressed(false)
            }}
            onPointerMove={(event) => {
                if (reduceMotion) return
                const point = position(event)
                pointerX.set(point.x)
                pointerY.set(point.y)
            }}
            onPointerDown={(event) => {
                setFocused(false)
                setPressed(true)
                if (!reduceMotion) {
                    const point = position(event)
                    pointerX.set(point.x)
                    pointerY.set(point.y)
                }
            }}
            onPointerUp={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            onPointerLeave={() => {
                setPressed(false)
                pointerX.set(50)
                pointerY.set(50)
            }}
            onKeyDown={(event) => {
                setFocused(true)
                if (event.key === "Enter" || event.key === " ") setPressed(true)
            }}
            onKeyUp={() => setPressed(false)}
            onClick={(event) => {
                setPressed(false)
                const point =
                    event.detail === 0 ? { x: 50, y: 50 } : position(event)
                setBurst((previous) => ({ id: previous.id + 1, ...point }))
                onClick?.(event)
            }}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "max-content",
                boxSizing: "border-box",
                border: 0,
                padding: `${paddingTop + stroke}px ${paddingRight + stroke}px ${paddingBottom + stroke}px ${paddingLeft + stroke}px`,
                borderRadius,
                background: "transparent",
                appearance: "none",
                WebkitAppearance: "none",
                font: "inherit",
                textDecoration: "none",
                cursor: "pointer",
                isolation: "isolate",
                overflow: "visible",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTapHighlightColor: "transparent",
                outline: "none",
                ...focusColor,
                ...style,
            }}
        >
            <style>{`
                [data-cgb] .cgb-icon svg { width: 100%; height: 100%; display: block; }
                [data-cgb]:focus-visible { outline: 2px solid var(--cgb-focus-color) !important; outline-offset: 12px; }
            `}</style>

            {/* Colored atmospheric halo and a charcoal glass bezel. */}
            <motion.div
                aria-hidden="true"
                animate={{
                    opacity: active ? Math.min(1, glow * (1 + power)) : glow,
                }}
                transition={{ duration: 0.5 }}
                style={{
                    ...layer,
                    inset: -3,
                    background: `linear-gradient(90deg, ${deep}, ${middle}, ${deep})`,
                    filter: `blur(${Math.max(0, glowSize)}px)`,
                    zIndex: 0,
                }}
            />
            <div
                aria-hidden="true"
                style={{
                    ...layer,
                    inset: -Math.max(0, bezelSize),
                    background: "rgba(47, 50, 51, 0.58)",
                    boxShadow:
                        "0 10px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.025)",
                    zIndex: 1,
                }}
            />

            {burst.id > 0 && (
                <motion.div
                    key={`halo-${burst.id}`}
                    aria-hidden="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, Math.min(0.9, release * 0.75), 0] }}
                    transition={{
                        duration: reduceMotion ? 0.2 : 0.9,
                        times: [0, 0.2, 1],
                    }}
                    style={{
                        ...layer,
                        inset: -4,
                        background: light,
                        filter: `blur(${Math.max(12, glowSize)}px)`,
                        zIndex: 1,
                    }}
                />
            )}

            {/* Everything luminous is clipped inside this face; the halo remains outside. */}
            <div
                aria-hidden="true"
                style={{
                    ...layer,
                    overflow: "hidden",
                    background: deep,
                    zIndex: 2,
                }}
            >
                <div
                    style={{
                        ...layer,
                        background: `linear-gradient(90deg, ${deep} 0%, ${middle} 50%, ${deep} 100%)`,
                    }}
                />
                <div
                    style={{
                        ...layer,
                        background: `radial-gradient(ellipse at 50% 118%, ${light} 0%, ${transparent(light, 80)} 22%, transparent 68%)`,
                    }}
                />
                <div
                    style={{
                        ...layer,
                        background:
                            "radial-gradient(ellipse at 50% -35%, rgba(255,255,255,0.22), transparent 70%)",
                    }}
                />

                {/* Slow, liquid caustics — the endcaps keep their saturated color. */}
                <motion.div
                    initial={{
                        x: running ? "-5%" : "0%",
                        y: "0%",
                        opacity: 0.55,
                    }}
                    animate={{
                        x: running ? ["-5%", "7%", "-5%"] : "0%",
                        y: running
                            ? active
                                ? ["-10%", "-22%", "-10%"]
                                : ["0%", "-8%", "0%"]
                            : active && !reduceMotion
                              ? "-12%"
                              : "0%",
                        opacity: pressed
                            ? 0.18
                            : active
                              ? Math.min(0.95, 0.55 + power * 0.3)
                              : 0.55,
                    }}
                    transition={{
                        x: {
                            duration,
                            repeat: running ? Infinity : 0,
                            ease: "easeInOut",
                        },
                        y: {
                            duration: active ? duration * 0.55 : duration,
                            repeat: running ? Infinity : 0,
                            ease: "easeInOut",
                        },
                        opacity: { duration: 0.35 },
                    }}
                    style={{
                        position: "absolute",
                        left: "10%",
                        top: "48%",
                        width: "80%",
                        height: "100%",
                        background: `radial-gradient(ellipse, color-mix(in srgb, ${light} 55%, white), transparent 65%)`,
                        filter: "blur(10px)",
                        pointerEvents: "none",
                    }}
                />

                <motion.div
                    initial={false}
                    animate={{
                        opacity: pressed
                            ? 0.75
                            : active
                              ? Math.min(0.75, power * 0.42)
                              : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                        ...layer,
                        background: lens,
                        mixBlendMode: "screen",
                    }}
                />

                {/* Hover launches a refracted light ribbon through the glass. */}
                <motion.div
                    initial={{ x: "-150%", opacity: 0 }}
                    animate={
                        active && !reduceMotion
                            ? {
                                  x: ["-150%", "460%"],
                                  opacity: [0, 0.7 * power, 0.5 * power, 0],
                              }
                            : { x: "-150%", opacity: 0 }
                    }
                    transition={{
                        duration: 1.5,
                        ease: "easeInOut",
                        repeat: active && !reduceMotion ? Infinity : 0,
                        repeatDelay: 1.8,
                    }}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: "-55%",
                        width: "36%",
                        height: "210%",
                        skewX: -22,
                        background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 20%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0.12) 65%, transparent)",
                        filter: "blur(7px)",
                        mixBlendMode: "screen",
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        ...layer,
                        backgroundImage: NOISE,
                        backgroundSize: "160px 160px",
                        opacity: Math.max(0, Math.min(0.4, grain)),
                        mixBlendMode: "soft-light",
                    }}
                />
                <motion.div
                    initial={false}
                    animate={{ opacity: active ? 1 : 0.78 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        ...layer,
                        boxShadow: `inset 1px 1px 2px rgba(255,255,255,0.7), inset -1px -1px 2px ${transparent(light, 80)}, inset 0 5px 10px rgba(255,255,255,0.28), inset 0 -6px 11px ${transparent(light, 60)}`,
                    }}
                />
                <motion.div
                    animate={{ opacity: pressed ? 0.28 : 0 }}
                    transition={{ duration: 0.16 }}
                    style={{
                        ...layer,
                        background: `radial-gradient(ellipse, ${deep}, transparent 78%)`,
                    }}
                />

                {burst.id > 0 && (
                    <div key={`release-${burst.id}`} style={layer}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [
                                    0,
                                    Math.min(0.7, release * 0.48),
                                    0.1,
                                    0,
                                ],
                            }}
                            transition={{
                                duration: reduceMotion ? 0.2 : 0.8,
                                times: [0, 0.12, 0.4, 1],
                            }}
                            style={{
                                ...layer,
                                background: `radial-gradient(ellipse at ${burst.x}% ${burst.y}%, white, ${transparent(light, 85)} 30%, transparent 78%)`,
                                mixBlendMode: "screen",
                            }}
                        />
                        {!reduceMotion &&
                            [0, 0.11].map((delay, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ scale: 0.15, opacity: 0 }}
                                    animate={{
                                        scale: [0.15, 2.5, 11],
                                        opacity: [
                                            0,
                                            Math.min(0.85, release * 0.65),
                                            0,
                                        ],
                                    }}
                                    transition={{
                                        duration: 0.85,
                                        delay,
                                        ease: "easeOut",
                                        times: [0, 0.15, 1],
                                    }}
                                    style={{
                                        position: "absolute",
                                        left: `${burst.x}%`,
                                        top: `${burst.y}%`,
                                        x: "-50%",
                                        y: "-50%",
                                        width: 64,
                                        height: 64,
                                        borderRadius: "50%",
                                        border: `${index ? 1 : 2}px solid rgba(255,255,255,0.85)`,
                                        boxShadow: `0 0 14px ${light}, inset 0 0 12px ${light}`,
                                        pointerEvents: "none",
                                    }}
                                />
                            ))}
                        {!reduceMotion && (
                            <motion.div
                                initial={{ x: "-150%", opacity: 0 }}
                                animate={{
                                    x: "440%",
                                    opacity: [
                                        0,
                                        Math.min(0.7, release * 0.55),
                                        0,
                                    ],
                                }}
                                transition={{
                                    duration: 0.75,
                                    delay: 0.12,
                                    ease: "easeOut",
                                }}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: "-55%",
                                    width: "40%",
                                    height: "210%",
                                    skewX: -25,
                                    background:
                                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                                    mixBlendMode: "screen",
                                    filter: "blur(5px)",
                                }}
                            />
                        )}
                    </div>
                )}

                <motion.div
                    initial={false}
                    animate={{ opacity: active ? 1 : 0.9 }}
                    transition={{ duration: 0.25 }}
                    style={{
                        ...ring,
                        padding: stroke,
                        background: `linear-gradient(145deg, white 0%, rgba(255,255,255,0.9) 18%, rgba(255,255,255,0.22) 60%, ${light} 86%, white 100%)`,
                    }}
                />
                <motion.div
                    animate={
                        running
                            ? { x: ["-180%", "650%"], opacity: [0, 0.75, 0] }
                            : { opacity: 0 }
                    }
                    transition={{
                        duration: duration * 0.75,
                        repeat: running ? Infinity : 0,
                        repeatDelay: 1.5,
                        ease: "easeInOut",
                    }}
                    style={{
                        position: "absolute",
                        top: 1,
                        left: 0,
                        width: "20%",
                        height: 1,
                        background:
                            "linear-gradient(90deg, transparent, white, transparent)",
                        filter: "blur(0.5px)",
                    }}
                />
            </div>

            <span
                style={{
                    position: "relative",
                    zIndex: 3,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap,
                    minWidth: 0,
                    pointerEvents: "none",
                }}
            >
                {iconPosition === "Left" && iconElement}
                <motion.span
                    variants={colorVariants}
                    transition={{ duration: 0.2 }}
                    style={{
                        ...FONT,
                        ...fontStyle,
                        whiteSpace: "nowrap",
                        textShadow: "0 1px 8px rgba(255,255,255,0.12)",
                    }}
                >
                    {text}
                </motion.span>
                {iconPosition === "Right" && iconElement}
            </span>
        </Component>
    )
}

addPropertyControls(SplashGradientButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Generate AI",
    },
    preset: {
        type: ControlType.Enum,
        title: "Palette",
        options: ["Purple", "Orange", "Blue", "Custom"],
        defaultValue: "Purple",
    },
    gradientColors: {
        type: ControlType.Array,
        title: "Colors",
        defaultValue: PALETTES.Purple,
        maxCount: 3,
        control: { type: ControlType.Color },
        hidden: (p) => p.preset !== "Custom",
        description: "Dark ends, middle, luminous highlight.",
    },
    fontStyle: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 27,
            variant: "Regular",
            letterSpacing: "-0.045em",
            lineHeight: "1em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Rim",
        defaultValue: 1.5,
        min: 0,
        max: 6,
        step: 0.5,
    },
    bezelSize: {
        type: ControlType.Number,
        title: "Bezel",
        defaultValue: 8,
        min: 0,
        max: 20,
    },
    glowOpacity: {
        type: ControlType.Number,
        title: "Glow Alpha",
        defaultValue: 0.45,
        min: 0,
        max: 1,
        step: 0.05,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Blur",
        defaultValue: 18,
        min: 0,
        max: 60,
    },
    grain: {
        type: ControlType.Number,
        title: "Grain",
        defaultValue: 0.12,
        min: 0,
        max: 0.4,
        step: 0.01,
    },
    animateGradient: {
        type: ControlType.Boolean,
        title: "Ambient",
        defaultValue: true,
        description: "Slow light drift. Hover and click remain interactive.",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Cycle (s)",
        defaultValue: 8,
        min: 2,
        max: 30,
        step: 0.5,
        hidden: (p) => !p.animateGradient,
    },
    hoverIntensity: {
        type: ControlType.Number,
        title: "Hover Light",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.1,
    },
    clickIntensity: {
        type: ControlType.Number,
        title: "Click Pulse",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.1,
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
    },
    iconType: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["Sparkles", "Custom SVG"],
        defaultValue: "Sparkles",
        hidden: (p) => !p.showIcon,
    },
    icon: {
        type: ControlType.File,
        title: "SVG File",
        allowedFileTypes: ["svg"],
        hidden: (p) => !p.showIcon || p.iconType !== "Custom SVG",
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["Left", "Right"],
        defaultValue: "Right",
        hidden: (p) => !p.showIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 28,
        min: 8,
        max: 100,
        hidden: (p) => !p.showIcon,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 80,
        hidden: (p) => !p.showIcon,
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Top Pad",
        defaultValue: 31,
        min: 0,
        max: 150,
    },
    paddingRight: {
        type: ControlType.Number,
        title: "Right Pad",
        defaultValue: 135,
        min: 0,
        max: 200,
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Bottom Pad",
        defaultValue: 31,
        min: 0,
        max: 150,
    },
    paddingLeft: {
        type: ControlType.Number,
        title: "Left Pad",
        defaultValue: 135,
        min: 0,
        max: 200,
    },
    link: { type: ControlType.Link, title: "Link" },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (p) => !p.link,
    },
    onClick: { type: ControlType.EventHandler },
})
