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


interface Props {
    label: string
    link?: string
    newTab: boolean
    color: string
    glow: string
    fillColors?: {
        base?: string
        wave1?: string
        wave2?: string
        wave3?: string
        wave4?: string
        wave5?: string
        wave6?: string
    }
    borderColors?: {
        start?: string
        lavender?: string
        neutral?: string
        fade?: string
        highlight?: string
        end?: string
    }
    font?: React.CSSProperties
    padding?: string
    radius?: string
    animated: boolean
    previewHover: boolean
    style?: React.CSSProperties
}
const waves = [
    [0.25, 1.2, 0.95, 0, 155, 100, 255, 0.4, 0.35, 1],
    [0.3, 0.9, 0.7, 1.8, 120, 150, 255, 0.35, 0.5, -1],
    [0.2, 1.5, 0.9, 3.2, 80, 70, 180, 0.3, 0.55, 1],
    [0.28, 1, 0.65, 4.8, 210, 185, 255, 0.35, 0.4, -1],
    [0.22, 1.4, 0.7, 2.5, 175, 130, 255, 0.3, 0.6, 1],
    [0.18, 1.7, 0.9, 5.5, 200, 160, 255, 0.25, 0.45, -1],
]
const easing = "cubic-bezier(.16,1,.3,1)"
const defaultFont = {
    fontFamily: '"Instrument Sans", sans-serif',
    fontSize: "16px",
    fontWeight: 500,
    textAlign: "left",
    letterSpacing: "-0.01em",
    lineHeight: "1.4em",
} as const
const defaultFill = {
    base: "#eaf3ff",
    wave1: "#3b82f6",
    wave2: "#60a5fa",
    wave3: "#1d4ed8",
    wave4: "#bfdbfe",
    wave5: "#38bdf8",
    wave6: "#93c5fd",
}
const defaultBorder = {
    start: "#5b93e8",
    lavender: "#a8c9f5",
    neutral: "#d3e2f4",
    fade: "#eaf3ff",
    highlight: "#b5d5fc",
    end: "#2563eb",
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 187
 * @framerIntrinsicHeight 48
 * @framerDisableUnlink
 */
export default function AuraFlowButton(props: Props) {
    const {
        label = "Contact us",
        link,
        newTab = false,
        color = "#1e4f9a",
        glow = "#3b82f6",
        fillColors,
        borderColors,
        font = defaultFont,
        padding = "16px 32px",
        radius = "9999px",
        animated = true,
        previewHover = false,
        style,
    } = props
    const fill = { ...defaultFill, ...fillColors }
    const rimColors = { ...defaultBorder, ...borderColors }
    const wavePalette = React.useMemo(
        () => [
            fill.wave1,
            fill.wave2,
            fill.wave3,
            fill.wave4,
            fill.wave5,
            fill.wave6,
        ],
        [fill.wave1, fill.wave2, fill.wave3, fill.wave4, fill.wave5, fill.wave6]
    )
    const borderStops = React.useMemo(
        () =>
            rimColors.start +
            " 0%," +
            rimColors.lavender +
            " 11%," +
            rimColors.neutral +
            " 25%," +
            rimColors.fade +
            " 42%," +
            rimColors.fade +
            " 60%," +
            rimColors.highlight +
            " 78%," +
            rimColors.end +
            " 100%",
        [
            rimColors.start,
            rimColors.lavender,
            rimColors.neutral,
            rimColors.fade,
            rimColors.highlight,
            rimColors.end,
        ]
    )
    const root = React.useRef<HTMLButtonElement & HTMLAnchorElement>(null)
    const canvas = React.useRef<HTMLCanvasElement>(null)
    const border = React.useRef<HTMLSpanElement>(null)
    const shaft = React.useRef<SVGPathElement>(null)
    const head = React.useRef<SVGPathElement>(null)
    const [hover, setHover] = React.useState(false)
    const [focus, setFocus] = React.useState(false)
    const [pressed, setPressed] = React.useState(false)
    const [reduced, setReduced] = React.useState(false)
    const playing = React.useRef<Animation[]>([])
    const active = hover || focus || previewHover
    const isStaticRenderer = useIsStaticRenderer()

    React.useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [])

    React.useEffect(() => {
        const surface = canvas.current,
            rim = border.current,
            element = root.current
        if (!surface || !rim || !element) return
        const context = surface.getContext("2d", { alpha: true })
        if (!context) return
        // Resolve CSS colors and Framer color variables against this component's own output.
        const colorCanvas = document.createElement("canvas")
        colorCanvas.width = colorCanvas.height = 1
        const colorContext = colorCanvas.getContext("2d", {
            willReadFrequently: true,
        })
        if (!colorContext) return
        const swatch = document.createElement("span")
        swatch.style.display = "none"
        element.appendChild(swatch)
        const palette = wavePalette.map((value) => {
            swatch.style.color = value
            colorContext.clearRect(0, 0, 1, 1)
            colorContext.fillStyle = getComputedStyle(swatch).color
            colorContext.fillRect(0, 0, 1, 1)
            const [r, g, b, a] = colorContext.getImageData(0, 0, 1, 1).data
            return [r, g, b, a / 255]
        })
        swatch.remove()
        let width = 187,
            height = 48,
            raf = 0,
            visible = true
        let targetAngle = 120,
            angle = 120,
            previous = 0,
            started = 0
        const still = reduced || !animated || isStaticRenderer
        const waveY = (x: number, wave: number[], t: number) => {
            const [amplitude, frequency, speed, phase] = wave
            const a = Math.sin(t * speed * 1.008 + phase) * 3
            const b = Math.cos(t * speed * 0.72 + phase + 1.5) * 2.5
            const c = Math.sin(t * speed * 1.296 + phase + 3) * 2
            const magnitude =
                amplitude *
                (1 + Math.sin(t * speed * 0.576 + phase + 0.7) * 0.3)
            return (
                wave[8] * height +
                Math.sin(t * speed * 0.432 + phase + 2) * height * 0.08 +
                Math.sin(x * Math.PI * 2 * frequency + a + phase) *
                    height *
                    magnitude +
                Math.sin(x * Math.PI * 2 * frequency * 2.1 + b + phase + 2) *
                    height *
                    magnitude *
                    0.35 +
                Math.cos(x * Math.PI * 2 * frequency * 3.3 + c + phase + 5) *
                    height *
                    magnitude *
                    0.15
            )
        }
        const paint = (t: number) => {
            context.clearRect(0, 0, width, height)
            for (const [index, wave] of waves.entries()) {
                const down = wave[9] === 1
                context.beginPath()
                context.moveTo(0, waveY(0, wave, t))
                for (let i = 1; i <= 64; i++)
                    context.lineTo((i / 64) * width, waveY(i / 64, wave, t))
                context.lineTo(width, down ? height + 20 : -20)
                context.lineTo(0, down ? height + 20 : -20)
                context.closePath()
                const samples = Array.from({ length: 8 }, (_, i) =>
                    waveY(i / 7, wave, t)
                )
                const edge = down ? Math.min(...samples) : Math.max(...samples)
                const gradient = context.createLinearGradient(
                    0,
                    edge,
                    0,
                    edge + (down ? 1 : -1) * height * 0.6
                )
                const [r, g, b, alpha] = palette[index]
                const rgb = [r, g, b].join(",")
                const opacity = wave[7] * alpha
                gradient.addColorStop(0, "rgba(" + rgb + "," + opacity + ")")
                gradient.addColorStop(
                    0.4,
                    "rgba(" + rgb + "," + opacity * 0.6 + ")"
                )
                gradient.addColorStop(1, "rgba(" + rgb + ",0)")
                context.fillStyle = gradient
                context.fill()
            }
        }
        const resize = () => {
            width = element.clientWidth
            height = element.clientHeight
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            surface.width = Math.max(1, Math.round(width * dpr))
            surface.height = Math.max(1, Math.round(height * dpr))
            context.setTransform(dpr, 0, 0, dpr, 0, 0)
            paint(2.5)
        }
        const move = (event: PointerEvent) => {
            const next =
                (Math.atan2(
                    event.clientY - window.innerHeight / 2,
                    event.clientX - window.innerWidth / 2
                ) *
                    180) /
                    Math.PI +
                90
            targetAngle = angle + ((((next - angle) % 360) + 540) % 360) - 180
        }
        const frame = (now: number) => {
            if (!started) started = now
            const dt = previous ? Math.min(now - previous, 64) : 16
            previous = now
            if (visible && document.visibilityState !== "hidden") {
                angle +=
                    (targetAngle - angle) * (1 - Math.exp((-0.95 * dt) / 1000))
                rim.style.background =
                    "linear-gradient(" + angle + "deg," + borderStops + ")"
                paint((now - started) / 1000 + 2.5)
            }
            raf = requestAnimationFrame(frame)
        }
        const observer = new ResizeObserver(resize)
        observer.observe(element)
        const intersection = new IntersectionObserver((entries) => {
            visible = entries[0]?.isIntersecting ?? true
        })
        intersection.observe(element)
        resize()
        if (!still) {
            window.addEventListener("pointermove", move, { passive: true })
            raf = requestAnimationFrame(frame)
        }
        return () => {
            cancelAnimationFrame(raf)
            observer.disconnect()
            intersection.disconnect()
            window.removeEventListener("pointermove", move)
        }
    }, [reduced, animated, isStaticRenderer, wavePalette, borderStops])

    React.useEffect(() => {
        playing.current.forEach((animation) => animation.cancel())
        playing.current = []
        if (!active || reduced || isStaticRenderer) return
        const draw = (
            path: SVGPathElement | null,
            gap: number,
            duration: number,
            delay: number,
            ease: string
        ) => {
            if (!path) return
            const length = path.getTotalLength()
            playing.current.push(
                path.animate(
                    [
                        {
                            strokeDasharray: length + " " + length * gap,
                            strokeDashoffset: "0",
                        },
                        {
                            strokeDasharray: length + " " + length * gap,
                            strokeDashoffset: String(-length * (1 + gap)),
                        },
                    ],
                    { duration, delay, easing: ease, fill: "backwards" }
                )
            )
        }
        draw(shaft.current, 0.5, 300, 0, "cubic-bezier(.55,.085,.68,.53)")
        draw(head.current, 0.75, 210, 210, "cubic-bezier(.25,.46,.45,.94)")
        return () => playing.current.forEach((animation) => animation.cancel())
    }, [active, reduced, isStaticRenderer])

    const common: React.CSSProperties = {
        position: "absolute",
        pointerEvents: "none",
    }
    const Tag = link ? "a" : "button"
    const textTransition =
        reduced || isStaticRenderer ? "none" : "transform .5s " + easing
    return (
        <Tag
            ref={root as any}
            href={link || undefined}
            target={link && newTab ? "_blank" : undefined}
            rel={link && newTab ? "noopener noreferrer" : undefined}
            type={link ? undefined : "button"}
            aria-label={label}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => {
                setHover(false)
                setPressed(false)
            }}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            onFocus={(event) =>
                setFocus(event.currentTarget.matches(":focus-visible"))
            }
            onBlur={() => {
                setFocus(false)
                setPressed(false)
            }}
            onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") setPressed(true)
            }}
            onKeyUp={() => setPressed(false)}
            style={{
                width: "max-content",
                height: "auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxSizing: "border-box",
                position: "relative",
                isolation: "isolate",
                border: "1px solid transparent",
                background: fill.base,
                color,
                ...defaultFont,
                ...font,
                textDecoration: "none",
                whiteSpace: "nowrap",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                WebkitBackdropFilter: "blur(2px)",
                backdropFilter: "blur(2px)",
                outline: focus ? "2px solid " + glow : "none",
                outlineOffset: 5,
                transform: pressed ? "scale(.98)" : undefined,
                transition:
                    reduced || isStaticRenderer
                        ? "none"
                        : "transform .15s " + easing,
                ...style,
                padding,
                borderRadius: radius,
            }}
        >
            <span
                aria-hidden="true"
                style={{
                    ...common,
                    inset: 0,
                    zIndex: -1,
                    borderRadius: "inherit",
                    overflow: "hidden",
                    background:
                        "linear-gradient(115deg,color-mix(in srgb," +
                        fill.wave1 +
                        " 8%,transparent),color-mix(in srgb," +
                        fill.wave4 +
                        " 12%,transparent))",
                }}
            >
                <canvas
                    ref={canvas}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        filter: "blur(6px)",
                        transform: "scale(1.2)",
                    }}
                />
            </span>
            <span
                ref={border}
                aria-hidden="true"
                style={{
                    ...common,
                    inset: 0,
                    borderRadius: "inherit",
                    padding: 1,
                    boxSizing: "border-box",
                    background: "linear-gradient(120deg," + borderStops + ")",
                    WebkitMask:
                        "linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)",
                    mask: "linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                }}
            />
            <span
                aria-hidden="true"
                style={{
                    ...common,
                    bottom: 0,
                    width: "100%",
                    height: "50%",
                    zIndex: -2,
                    borderRadius: "inherit",
                    background: glow,
                    filter: "blur(20px)",
                    opacity: active ? 1 : 0,
                    transform: active ? "scale(1)" : "scale(.6)",
                    transition:
                        reduced || isStaticRenderer
                            ? "none"
                            : "opacity .4s,transform .4s",
                }}
            />
            <span
                aria-hidden="true"
                style={{
                    display: "grid",
                    overflow: "hidden",
                    position: "relative",
                    pointerEvents: "none",
                }}
            >
                <span
                    style={{
                        display: "block",
                        transform:
                            active && !reduced
                                ? "translateY(-120%)"
                                : "translateY(0)",
                        transition: textTransition,
                    }}
                >
                    {label}
                </span>
                <span
                    style={{
                        display: "block",
                        position: "absolute",
                        left: 0,
                        top: "110%",
                        width: "100%",
                        transform:
                            active && !reduced
                                ? "translateY(-110%)"
                                : "translateY(0)",
                        transition: textTransition,
                    }}
                >
                    {label}
                </span>
            </span>
            <svg
                aria-hidden="true"
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    flexShrink: 0,
                    display: "block",
                    pointerEvents: "none",
                }}
            >
                <path ref={head} d="m12 5 7 7-7 7" />
                <path ref={shaft} d="M5 12h14" />
            </svg>
        </Tag>
    )
}

AuraFlowButton.displayName = "Aura Flow Button"

addPropertyControls(AuraFlowButton, {
    label: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Contact us",
    },
    link: { type: ControlType.Link, title: "Link" },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#1e4f9a",
    },
    glow: { type: ControlType.Color, title: "Glow", defaultValue: "#3b82f6" },
    fillColors: {
        type: ControlType.Object,
        title: "Gradient Colors",
        controls: {
            base: {
                type: ControlType.Color,
                title: "Base",
                defaultValue: defaultFill.base,
            },
            wave1: {
                type: ControlType.Color,
                title: "Wave 1",
                defaultValue: defaultFill.wave1,
            },
            wave2: {
                type: ControlType.Color,
                title: "Wave 2",
                defaultValue: defaultFill.wave2,
            },
            wave3: {
                type: ControlType.Color,
                title: "Wave 3",
                defaultValue: defaultFill.wave3,
            },
            wave4: {
                type: ControlType.Color,
                title: "Wave 4",
                defaultValue: defaultFill.wave4,
            },
            wave5: {
                type: ControlType.Color,
                title: "Wave 5",
                defaultValue: defaultFill.wave5,
            },
            wave6: {
                type: ControlType.Color,
                title: "Wave 6",
                defaultValue: defaultFill.wave6,
            },
        },
    },
    borderColors: {
        type: ControlType.Object,
        title: "Border Colors",
        controls: {
            start: {
                type: ControlType.Color,
                title: "Start",
                defaultValue: defaultBorder.start,
            },
            lavender: {
                type: ControlType.Color,
                title: "Soft",
                defaultValue: defaultBorder.lavender,
            },
            neutral: {
                type: ControlType.Color,
                title: "Neutral",
                defaultValue: defaultBorder.neutral,
            },
            fade: {
                type: ControlType.Color,
                title: "Fade",
                defaultValue: defaultBorder.fade,
            },
            highlight: {
                type: ControlType.Color,
                title: "Highlight",
                defaultValue: defaultBorder.highlight,
            },
            end: {
                type: ControlType.Color,
                title: "End",
                defaultValue: defaultBorder.end,
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultFontType: "sans-serif",
        defaultValue: { ...defaultFont, variant: "Medium" },
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "16px 32px",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "9999px",
    },
    animated: {
        type: ControlType.Boolean,
        title: "Animation",
        defaultValue: true,
    },
    previewHover: {
        type: ControlType.Boolean,
        title: "Show Hover",
        defaultValue: false,
        description:
            "\nMade by [Zelo Studio](https://framer.link/kjFVSDz)\n\n[→ More Components](https://framer.link/kjFVSDz)",
    },
})
