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
 * Frosted Orb Button
 * A glassy frosted pill with glossy orbs that are magnetically pulled toward
 * the cursor and sit half-submerged behind a layer of frost.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 84
 */

type Props = {
    text: string
    link: string
    font: React.CSSProperties
    textColor: string
    orbColor: string
    frostColor: string
    blur: number
    orbFrost: number
    shine: boolean
    shadow: number
    radius: number
    padding: number
    gap: number
    rim: boolean
    followMode: string
    followStrength: number
    animateOnCanvas: boolean
    respectReducedMotion: boolean
    style?: React.CSSProperties
}

// size / x / y are in % of the orb zone. k = spring stiffness (heavier orbs
// react slower), reach = how far this orb can be pulled (relative).
const ORBS = [
    { size: 58, x: 46, y: 46, k: 0.1, reach: 1 },
    { size: 38, x: 74, y: 66, k: 0.14, reach: 1.5 },
    { size: 28, x: 22, y: 70, k: 0.07, reach: 0.8 },
]

const DAMPING = 0.78
const FROST_MASK = "linear-gradient(158deg, transparent 22%, #000 66%)"

export default function FrostedOrbButton(props: Props) {
    const {
        text,
        link,
        font,
        textColor,
        orbColor,
        frostColor,
        blur,
        orbFrost,
        shine,
        shadow,
        radius,
        padding,
        gap,
        rim,
        followMode,
        followStrength,
        animateOnCanvas,
        respectReducedMotion,
        style,
    } = props

    const rootRef = React.useRef<HTMLElement | null>(null)
    const zoneRef = React.useRef<HTMLDivElement | null>(null)
    const orbRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const [hover, setHover] = React.useState(false)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (followMode === "off") return
        if (isCanvas && !animateOnCanvas) return

        if (
            respectReducedMotion &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ) {
            return
        }

        const pointer = { x: 0, y: 0, active: false }
        const pos = ORBS.map(() => ({ x: 0, y: 0 }))
        const vel = ORBS.map(() => ({ x: 0, y: 0 }))
        let raf = 0
        let running = false

        const tick = () => {
            const zone = zoneRef.current
            let moving = false

            if (zone) {
                const rect = zone.getBoundingClientRect()
                const w = rect.width

                ORBS.forEach((orb, i) => {
                    const el = orbRefs.current[i]
                    if (!el) return

                    let tx = 0
                    let ty = 0

                    if (pointer.active) {
                        // vector from this orb's resting centre to the cursor
                        const cx = rect.left + (w * orb.x) / 100
                        const cy = rect.top + (rect.height * orb.y) / 100
                        const dx = pointer.x - cx
                        const dy = pointer.y - cy
                        const dist = Math.hypot(dx, dy)

                        if (dist > 0.5) {
                            // magnetic: always leans toward the cursor, and
                            // pulls harder the closer the cursor gets
                            const near = Math.exp(-dist / 420)
                            const reach =
                                w * 0.42 * followStrength * orb.reach
                            const pull = reach * (0.4 + 0.6 * near)
                            const mag = Math.min(dist, pull)
                            tx = (dx / dist) * mag
                            ty = (dy / dist) * mag
                        }
                    }

                    const p = pos[i]
                    const v = vel[i]
                    // spring with a little overshoot = liquid, magnetic feel
                    v.x = (v.x + (tx - p.x) * orb.k) * DAMPING
                    v.y = (v.y + (ty - p.y) * orb.k) * DAMPING
                    p.x += v.x
                    p.y += v.y

                    if (
                        Math.abs(v.x) > 0.01 ||
                        Math.abs(v.y) > 0.01 ||
                        Math.abs(tx - p.x) > 0.05 ||
                        Math.abs(ty - p.y) > 0.05
                    ) {
                        moving = true
                    }

                    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
                })
            }

            if (moving) {
                raf = requestAnimationFrame(tick)
            } else {
                running = false
            }
        }

        const start = () => {
            if (!running) {
                running = true
                raf = requestAnimationFrame(tick)
            }
        }

        const onMove = (e: PointerEvent | MouseEvent) => {
            pointer.x = e.clientX
            pointer.y = e.clientY
            pointer.active = true
            start()
        }

        const onLeave = () => {
            pointer.active = false
            start()
        }

        const root = rootRef.current
        if (followMode === "page") {
            window.addEventListener("pointermove", onMove, { passive: true })
            window.addEventListener("mousemove", onMove, { passive: true })
            document.addEventListener("mouseleave", onLeave)
        } else if (root) {
            root.addEventListener("pointermove", onMove, { passive: true })
            root.addEventListener("mousemove", onMove, { passive: true })
            root.addEventListener("pointerleave", onLeave)
        }

        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("mousemove", onMove)
            document.removeEventListener("mouseleave", onLeave)
            if (root) {
                root.removeEventListener("pointermove", onMove)
                root.removeEventListener("mousemove", onMove)
                root.removeEventListener("pointerleave", onLeave)
            }
            orbRefs.current.forEach((el) => {
                if (el) el.style.transform = ""
            })
        }
    }, [followMode, followStrength, isCanvas, animateOnCanvas, respectReducedMotion])

    const light = `color-mix(in srgb, ${orbColor} 45%, white)`
    const dark = `color-mix(in srgb, ${orbColor} 72%, black)`

    // scales every shadow alpha with the "Shadow" control (0 = none)
    const s = Math.max(0, shadow)
    const a = (n: number) => Math.min(1, n * s).toFixed(3)

    const rootStyle: React.CSSProperties = {
        position: "relative",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap,
        width: "100%",
        height: "100%",
        minWidth: 0,
        padding,
        borderRadius: radius,
        backgroundColor: frostColor,
        // soft light falling across the glass
        backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.06) 42%, rgba(255,255,255,0.16) 100%)",
        backdropFilter: `blur(${blur}px) saturate(180%) brightness(1.06)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(180%) brightness(1.06)`,
        boxShadow: [
            // glass edges and inner light
            "inset 0 1.5px 1px rgba(255,255,255,0.95)",
            "inset 0 0 0 1px rgba(255,255,255,0.28)",
            "inset 0 -14px 24px -8px rgba(255,255,255,0.35)",
            `inset 0 -3px 8px rgba(140,80,100,${a(0.14)})`,
            // layered drop shadow: tight contact, mid, then wide ambient
            `0 1px 2px rgba(90,50,65,${a(0.12)})`,
            `0 6px 14px -4px rgba(90,50,65,${a(0.16)})`,
            `0 22px 44px -20px rgba(110,60,70,${a(0.4)})`,
        ].join(", "),
        color: textColor,
        textDecoration: "none",
        cursor: "pointer",
        overflow: "hidden",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        transform: hover ? "scale(1.02)" : "scale(1)",
        transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        ...style,
    }

    const content = (
        <>
            {/* orb zone: orbs on the bottom, a static frost veil on top */}
            <div
                ref={zoneRef}
                aria-hidden
                style={{
                    position: "relative",
                    height: "100%",
                    aspectRatio: "1 / 1",
                    flexShrink: 0,
                }}
            >
                {ORBS.map((orb, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: `${orb.x}%`,
                            top: `${orb.y}%`,
                            width: `${orb.size}%`,
                            aspectRatio: "1 / 1",
                            marginLeft: `${-orb.size / 2}%`,
                            marginTop: `${-orb.size / 2}%`,
                        }}
                    >
                        <div
                            ref={(el) => {
                                orbRefs.current[i] = el
                            }}
                            style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                willChange: "transform",
                            }}
                        >
                            {/* soft contact shadow cast on the glass below */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: "8%",
                                    right: "8%",
                                    bottom: "-22%",
                                    height: "34%",
                                    borderRadius: "50%",
                                    background: `rgba(70, 35, 55, ${a(0.3)})`,
                                    filter: "blur(7px)",
                                }}
                            />
                            {/* soft colored glow under the orb */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: "10% 0 -14% 0",
                                    borderRadius: "50%",
                                    background: orbColor,
                                    filter: "blur(14px)",
                                    opacity: 0.5,
                                }}
                            />
                            {/* glossy sphere */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "50%",
                                    background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, ${light} 22%, ${orbColor} 58%, ${dark} 100%)`,
                                    boxShadow: [
                                        "inset -4px -6px 12px rgba(0,0,0,0.12)",
                                        "inset 3px 4px 8px rgba(255,255,255,0.55)",
                                        `0 6px 12px -5px rgba(70,35,55,${a(0.28)})`,
                                    ].join(", "),
                                    opacity: 0.94,
                                }}
                            />
                        </div>
                    </div>
                ))}

                {/* frost veil: stays still while the orbs slide underneath */}
                {orbFrost > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: -padding,
                            backdropFilter: `blur(${orbFrost}px)`,
                            WebkitBackdropFilter: `blur(${orbFrost}px)`,
                            background:
                                "linear-gradient(158deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.5) 100%)",
                            WebkitMaskImage: FROST_MASK,
                            maskImage: FROST_MASK,
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>

            {/* glass reflection along the top edge */}
            {shine && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: "7%",
                        right: "7%",
                        top: "5%",
                        height: "40%",
                        borderRadius: "999px 999px 60% 60% / 100% 100% 60% 60%",
                        background:
                            "linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 60%, rgba(255,255,255,0) 100%)",
                        opacity: 0.85,
                        pointerEvents: "none",
                    }}
                />
            )}

            {rim && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "inherit",
                        padding: 1.5,
                        background:
                            "conic-gradient(from 200deg, rgba(255,255,255,0.95), #ffb8dc, #b8c9ff, #b9ffe2, #fff4b8, rgba(255,255,255,0.95))",
                        WebkitMask:
                            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                        WebkitMaskComposite: "xor",
                        mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
                        opacity: 0.8,
                        pointerEvents: "none",
                    }}
                />
            )}

            <span
                style={{
                    position: "relative",
                    flex: 1,
                    minWidth: 0,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    paddingRight: padding * 1.5,
                    fontSize: 22,
                    // light catching the edge of the letters, like etched glass
                    textShadow: `0 1px 0 rgba(255,255,255,${a(0.55)})`,
                    ...font,
                }}
            >
                {text}
            </span>
        </>
    )

    const common = {
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: rootStyle,
    }

    if (link) {
        return (
            <a
                ref={(el) => {
                    rootRef.current = el
                }}
                href={link}
                {...common}
            >
                {content}
            </a>
        )
    }

    return (
        <div
            ref={(el) => {
                rootRef.current = el
            }}
            role="button"
            tabIndex={0}
            {...common}
        >
            {content}
        </div>
    )
}

FrostedOrbButton.defaultProps = {
    text: "Get in touch",
    link: "",
    textColor: "#3b2a2f",
    orbColor: "#7ed957",
    frostColor: "rgba(255, 244, 246, 0.35)",
    blur: 18,
    orbFrost: 7,
    shine: true,
    shadow: 1,
    radius: 999,
    padding: 12,
    gap: 8,
    rim: true,
    followMode: "page",
    followStrength: 1,
    animateOnCanvas: true,
    respectReducedMotion: false,
}

addPropertyControls(FrostedOrbButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Get in touch",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text color",
        defaultValue: "#3b2a2f",
    },
    orbColor: {
        type: ControlType.Color,
        title: "Orb color",
        defaultValue: "#7ed957",
    },
    frostColor: {
        type: ControlType.Color,
        title: "Frost color",
        defaultValue: "rgba(255, 244, 246, 0.35)",
    },
    blur: {
        type: ControlType.Number,
        title: "Glass blur",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    orbFrost: {
        type: ControlType.Number,
        title: "Orb frost",
        defaultValue: 7,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    shadow: {
        type: ControlType.Number,
        title: "Shadow",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.1,
    },
    shine: {
        type: ControlType.Boolean,
        title: "Glass shine",
        defaultValue: true,
    },
    rim: {
        type: ControlType.Boolean,
        title: "Rainbow rim",
        defaultValue: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    followMode: {
        type: ControlType.Enum,
        title: "Orbs follow",
        options: ["page", "button", "off"],
        optionTitles: ["Cursor on page", "Cursor on button", "Off"],
        defaultValue: "page",
    },
    followStrength: {
        type: ControlType.Number,
        title: "Magnet strength",
        defaultValue: 1,
        min: 0.2,
        max: 2.5,
        step: 0.1,
        hidden: (props) => props.followMode === "off",
    },
    animateOnCanvas: {
        type: ControlType.Boolean,
        title: "Animate in editor",
        defaultValue: true,
        hidden: (props) => props.followMode === "off",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Honor reduced motion",
        defaultValue: false,
        hidden: (props) => props.followMode === "off",
    },
})
