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


type EffectId =
    | "effect1"
    | "effect2"
    | "effect3"
    | "effect4"
    | "effect5"
    | "effect6"
    | "effect7"
    | "effect8"
    | "effect9"
    | "effect10"
    | "effect11"
    | "effect12"
    | "effect13"
    | "effect14"
    | "effect15"
    | "effect16"
    | "effect17"
    | "effect18"
    | "effect19"
    | "effect20"
    | "effect21"
    | "effect22"
    | "effect23"
    | "effect24"
    | "effect25"
    | "effect26"
    | "effect27"

type Props = {
    width: number
    height: number
    text: string
    effect: EffectId
    titleFont: any
    lineGap: number
    padding: number
    triggerOnce: boolean
    viewportAmount: number
    stagger: number
    textColor: string
}

type CustomData = { index: number; total: number; angle?: number }

const DEFAULT_FONT = {
    fontFamily: "Inter",
    fontWeight: 800,
    fontSize: 64,
    lineHeight: 1.1,
    letterSpacing: 0,
    textAlign: "center" as const,
}

function isValidFontObj(v: any) {
    return v && typeof v.fontFamily === "string" && v.fontFamily.length > 0
}

function pickFontCSS(v: any) {
    const base = { ...DEFAULT_FONT }
    if (!v) return base
    return {
        fontFamily: v.fontFamily ?? base.fontFamily,
        fontWeight: v.fontWeight ?? v.fontStyle ?? v.variant ?? base.fontWeight,
        fontSize: v.fontSize ?? base.fontSize,
        lineHeight: v.lineHeight ?? base.lineHeight,
        letterSpacing: v.letterSpacing ?? base.letterSpacing,
        textAlign: (v.textAlign ?? base.textAlign) as
            | "left"
            | "center"
            | "right",
    }
}

async function ensureFontLoaded(
    fontFamily: string,
    fontWeight: any,
    fontSize: number
) {
    if (typeof document === "undefined") return
    const anyDoc: any = document as any
    if (!anyDoc.fonts || !anyDoc.fonts.load) return
    const weight =
        typeof fontWeight === "number"
            ? fontWeight
            : typeof fontWeight === "string" && /^\d+$/.test(fontWeight)
              ? Number(fontWeight)
              : 400
    const sizePx = typeof fontSize === "number" ? `${fontSize}px` : "64px"
    try {
        await anyDoc.fonts.load(`${weight} ${sizePx} "${fontFamily}"`)
        await anyDoc.fonts.ready
    } catch (e) {}
}

export default function OnScrollTypography(props: Props) {
    const {
        text,
        effect,
        lineGap,
        padding,
        triggerOnce,
        viewportAmount,
        stagger,
        textColor,
    } = props

    const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)

    const randomAngles = React.useMemo(
        () => lines.map(() => Math.random() * 40 - 20),
        [text]
    )

    const parentVariants = {
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
    }

    const variantsByEffect: Record<
        EffectId,
        { hidden: (c: CustomData) => any; show: (c: CustomData) => any }
    > = {
        effect1: {
            hidden: ({ angle }) => ({ opacity: 0, scale: 0.6, rotateZ: angle }),
            show: () => ({
                opacity: 1,
                scale: 1,
                rotateZ: 0,
                transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
            }),
        },
        effect2: {
            hidden: () => ({ opacity: 0, y: 60, scaleY: 2.3, scaleX: 0.7 }),
            show: () => ({
                opacity: 1,
                y: 0,
                scaleY: 1,
                scaleX: 1,
                transition: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1] },
            }),
        },
        effect3: {
            hidden: () => ({ opacity: 0, scaleY: 0, y: 40 }),
            show: () => ({
                opacity: 1,
                scaleY: 1,
                y: 0,
                transition: { duration: 0.75, ease: [0.33, 1, 0.68, 1] },
            }),
        },
        effect4: {
            hidden: ({ index, total }) => {
                const center = (total - 1) / 2
                return { opacity: 0, x: (index - center) * 80 }
            },
            show: () => ({
                opacity: 1,
                x: 0,
                transition: { duration: 0.8, ease: "easeInOut" },
            }),
        },
        effect5: {
            hidden: ({ index }) => {
                const sx = index % 2 === 0 ? -1 : 1
                const sy = index % 3 === 0 ? -1 : 1
                return {
                    opacity: 0,
                    x: sx * (60 + (index % 5) * 12),
                    y: sy * (40 + (index % 7) * 10),
                    rotateZ: sx * 12,
                }
            },
            show: () => ({
                opacity: 1,
                x: 0,
                y: 0,
                rotateZ: 0,
                transition: { duration: 0.9, ease: "easeInOut" },
            }),
        },
        effect6: {
            hidden: () => ({ opacity: 0, rotateX: -90, y: 40 }),
            show: () => ({
                opacity: 1,
                rotateX: 0,
                y: 0,
                transition: { duration: 0.9, ease: [0.25, 0.8, 0.25, 1] },
            }),
        },
        effect7: {
            hidden: ({ index, total }) => {
                const center = (total - 1) / 2
                const s = index - center >= 0 ? 1 : -1
                return { opacity: 0, rotateY: s * 80, x: s * 40 }
            },
            show: () => ({
                opacity: 1,
                rotateY: 0,
                x: 0,
                transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] },
            }),
        },
        effect8: {
            hidden: () => ({ opacity: 0, x: -40, skewX: -12 }),
            show: () => ({
                opacity: 1,
                x: [-20, 20, -8, 0],
                skewX: [-12, 8, -4, 0],
                transition: { duration: 0.8, ease: "easeOut" },
            }),
        },
        effect9: {
            hidden: () => ({ opacity: 0, y: 40, filter: "blur(12px)" }),
            show: () => ({
                opacity: 1,
                y: 0,
                filter: "blur(0)",
                transition: { duration: 0.9, ease: [0.19, 1, 0.22, 1] },
            }),
        },
        effect10: {
            hidden: () => ({ opacity: 0, y: 40, scale: 0.8, skewY: 10 }),
            show: () => ({
                opacity: 1,
                y: 0,
                scale: 1,
                skewY: 0,
                transition: { duration: 0.7, ease: "easeOut" },
            }),
        },
        effect11: {
            hidden: () => ({ opacity: 0, y: 60, rotateZ: 12 }),
            show: () => ({
                opacity: 1,
                y: 0,
                rotateZ: 0,
                transition: { duration: 0.75, ease: [0.23, 1, 0.32, 1] },
            }),
        },
        effect12: {
            hidden: () => ({ opacity: 0, y: 20 }),
            show: () => ({
                opacity: 1,
                y: 0,
                transition: { duration: 0.7, ease: "easeOut" },
            }),
        },
        effect13: {
            hidden: () => ({ opacity: 0, scale: 0.7, y: 40 }),
            show: () => ({
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { duration: 0.85, ease: [0.19, 1, 0.22, 1] },
            }),
        },
        effect14: {
            hidden: ({ index }) => ({
                opacity: 0,
                x: 40,
                rotateZ: index % 2 ? 3 : -3,
            }),
            show: () => ({
                opacity: 1,
                x: 0,
                rotateZ: 0,
                transition: { duration: 0.8, ease: "easeOut" },
            }),
        },
        effect15: {
            hidden: ({ index, total }) => {
                const c = (total - 1) / 2
                return {
                    opacity: 0,
                    y: 80 + Math.abs(index - c) * 10,
                    scaleY: 1.3,
                }
            },
            show: () => ({
                opacity: 1,
                y: 0,
                scaleY: 1,
                transition: { duration: 0.9, ease: [0.34, 1.56, 0.64, 1] },
            }),
        },
        effect16: {
            hidden: () => ({ opacity: 0, rotateX: 75, y: 40 }),
            show: () => ({
                opacity: 1,
                rotateX: 0,
                y: 0,
                transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] },
            }),
        },
        effect17: {
            hidden: ({ index }) => ({
                opacity: 0,
                x: index % 2 ? 80 : -80,
                y: 30,
                scale: 1.1,
            }),
            show: () => ({
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                transition: { duration: 0.85, ease: "easeInOut" },
            }),
        },
        effect18: {
            hidden: ({ index, total }) => {
                const c = (total - 1) / 2
                return {
                    opacity: 0,
                    scale: 1.3 + Math.abs(index - c) * 0.05,
                    y: 60,
                }
            },
            show: () => ({
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { duration: 0.9, ease: [0.19, 1, 0.22, 1] },
            }),
        },
        effect19: {
            hidden: ({ index }) => ({
                opacity: 0,
                x: index % 2 ? 60 : -60,
                filter: "blur(10px)",
            }),
            show: () => ({
                opacity: 1,
                x: 0,
                filter: "blur(0)",
                transition: { duration: 0.9, ease: "easeOut" },
            }),
        },
        effect20: {
            hidden: () => ({ opacity: 0, rotateX: 90, y: 40 }),
            show: () => ({
                opacity: 1,
                rotateX: 0,
                y: 0,
                transition: { duration: 1, ease: [0.19, 1, 0.22, 1] },
            }),
        },
        effect21: {
            hidden: ({ index, total }) => {
                const c = (total - 1) / 2
                const o = index - c
                return { opacity: 0, x: o * 40, skewX: 10 * (o / total) }
            },
            show: () => ({
                opacity: 1,
                x: 0,
                skewX: 0,
                transition: { duration: 0.85, ease: "easeInOut" },
            }),
        },
        effect22: {
            hidden: () => ({ opacity: 0, y: 80, scale: 1.05 }),
            show: () => ({
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 1, ease: [0.25, 0.8, 0.25, 1] },
            }),
        },
        effect23: {
            hidden: ({ index, total }) => {
                const c = (total - 1) / 2
                return {
                    opacity: 0,
                    scale: 0.6 + Math.abs(index - c) * 0.1,
                    y: 40 + Math.abs(index - c) * 6,
                }
            },
            show: () => ({
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { duration: 0.85, ease: [0.23, 1, 0.32, 1] },
            }),
        },
        effect24: {
            hidden: ({ index, total }) => {
                const c = (total - 1) / 2
                return { opacity: 0, y: -120 - Math.abs(index - c) * 30 }
            },
            show: () => ({
                opacity: 1,
                y: 0,
                transition: { duration: 1.1, ease: [0.34, 1.56, 0.64, 1] },
            }),
        },
        effect25: {
            hidden: ({ index }) => ({
                opacity: 0,
                scale: 1.2,
                rotateZ: index % 2 ? 8 : -8,
                filter: "blur(8px)",
            }),
            show: () => ({
                opacity: 1,
                scale: 1,
                rotateZ: 0,
                filter: "blur(0)",
                transition: { duration: 0.9, ease: "easeInOut" },
            }),
        },
        effect26: {
            hidden: ({ index }) => ({
                opacity: 0,
                y: 60,
                skewY: index % 2 ? -14 : 14,
            }),
            show: () => ({
                opacity: 1,
                y: 0,
                skewY: 0,
                transition: { duration: 0.85, ease: [0.23, 1, 0.32, 1] },
            }),
        },
        effect27: {
            hidden: () => ({ opacity: 0, scale: 0.7, y: 50 }),
            show: () => ({
                opacity: 1,
                scale: [0.7, 1.05, 1],
                y: 0,
                transition: { duration: 0.95, ease: "easeOut" },
            }),
        },
    }

    const [fontReadyTick, setFontReadyTick] = React.useState(0)
    const lockedFontRef = React.useRef<any | null>(null)

    React.useEffect(() => {
        const incoming = props.titleFont
        if (!isValidFontObj(incoming)) return

        const css = pickFontCSS(incoming)
        ensureFontLoaded(css.fontFamily, css.fontWeight, css.fontSize).then(
            () => {
                lockedFontRef.current = incoming
                setFontReadyTick((t) => t + 1)
            }
        )
    }, [props.titleFont])

    const fontCSS = React.useMemo(() => {
        const base = DEFAULT_FONT
        const chosen = lockedFontRef.current || props.titleFont
        const css = pickFontCSS(chosen)
        return { ...base, ...css }
    }, [props.titleFont, fontReadyTick])

    const textAlign: "left" | "center" | "right" = fontCSS.textAlign || "center"

    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent:
            textAlign === "left"
                ? "flex-start"
                : textAlign === "right"
                  ? "flex-end"
                  : "center",
        padding,
        boxSizing: "border-box",
    }

    const blockStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: lineGap,
        textAlign,
        fontFamily: fontCSS.fontFamily,
        fontWeight: fontCSS.fontWeight as any,
        fontSize: fontCSS.fontSize,
        lineHeight: fontCSS.lineHeight as any,
        letterSpacing: fontCSS.letterSpacing as any,
        color: textColor,
    }

    const currentVariants = variantsByEffect[effect]

    const rt: any = RenderTarget as any
    const target = RenderTarget.current()
    const isCanvas = target === rt.canvas
    const isStaticTarget =
        target === rt.export ||
        target === rt.thumbnail ||
        target === rt.render ||
        typeof window === "undefined" ||
        (typeof window !== "undefined" && !(window as any).IntersectionObserver)

    return (
        <div style={containerStyle}>
            <motion.div
                style={{ width: "100%" }}
                initial={isCanvas || isStaticTarget ? "show" : "hidden"}
                animate={isCanvas || isStaticTarget ? "show" : undefined}
                whileInView={isCanvas || isStaticTarget ? undefined : "show"}
                viewport={
                    isCanvas || isStaticTarget
                        ? undefined
                        : { amount: viewportAmount, once: triggerOnce }
                }
            >
                <motion.div variants={parentVariants} style={blockStyle}>
                    {lines.map((line, index) => (
                        <motion.span
                            key={index}
                            style={{ display: "block" }}
                            variants={currentVariants}
                            custom={{
                                index,
                                total: lines.length,
                                angle: randomAngles[index],
                            }}
                        >
                            {line}
                        </motion.span>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    )
}

OnScrollTypography.defaultProps = {
    width: 600,
    height: 300,
    text: "CREATIVE POWER\nUNLOCKED\nTODAY",
    effect: "effect1",
    titleFont: DEFAULT_FONT,
    lineGap: 4,
    padding: 24,
    triggerOnce: false,
    viewportAmount: 0.6,
    stagger: 0.12,
    textColor: "#111111",
}

addPropertyControls(OnScrollTypography, {
    text: { type: ControlType.String, title: "Text", displayTextArea: true },

    effect: {
        type: ControlType.Enum,
        title: "Effect",
        options: [
            "effect1",
            "effect2",
            "effect3",
            "effect4",
            "effect5",
            "effect6",
            "effect7",
            "effect8",
            "effect9",
            "effect10",
            "effect11",
            "effect12",
            "effect13",
            "effect14",
            "effect15",
            "effect16",
            "effect17",
            "effect18",
            "effect19",
            "effect20",
            "effect21",
            "effect22",
            "effect23",
            "effect24",
            "effect25",
            "effect26",
            "effect27",
        ],
        optionTitles: [
            "Scatter Rise",
            "Stretch Up",
            "Reveal From Top",
            "Side Slide",
            "Chaos In",
            "Flip X",
            "Flip Y",
            "Glitch Slide",
            "Blur Rise",
            "Skew Pop",
            "Rotate In",
            "Fade Up",
            "Zoom Rise",
            "Tilt Sweep",
            "Wave Rise",
            "Depth Flip",
            "Layered Slide",
            "Split Zoom",
            "Drift & Blur",
            "Fold Up 3D",
            "Ribbon Sweep",
            "Float In",
            "Center Pop",
            "Elastic Drop",
            "Spiral Blur",
            "Wave Skew",
            "Pulse Zoom",
        ],
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultValue: DEFAULT_FONT,
    } as any,

    lineGap: { type: ControlType.Number, title: "Line Gap", min: 0, max: 80 },
    padding: { type: ControlType.Number, title: "Padding", min: 0, max: 120 },

    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111111",
    },

    triggerOnce: {
        type: ControlType.Boolean,
        title: "Play Once",
        enabledTitle: "Yes",
        disabledTitle: "Loop",
    },

    viewportAmount: {
        type: ControlType.Number,
        title: "Scroll Trigger",
        min: 0.1,
        max: 1,
        step: 0.05,
    },

    stagger: {
        type: ControlType.Number,
        title: "Animation Stagger",
        min: 0,
        max: 1,
        step: 0.01,
    },
})
