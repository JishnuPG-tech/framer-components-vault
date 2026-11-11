import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
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

import {
    animate,
    motion,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
} from "framer-motion"

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

interface ResponsiveImage {
    src: string
    srcSet?: string
    alt?: string
}

interface StudioHeroProps {
    image?: ResponsiveImage
    leftWord: string
    rightWord: string
    font: CSSProperties
    maxFontSize: number
    minFontSize: number
    outsideColor: string
    insideColor: string
    background: string
    startScale: number
    mobileStartScale: number
    mobileBreakpoint: number
    scrollLength: number
    edgePadding: number
    shadeColor: string
    shadeOpacity: number
    intro: boolean
    smooth: boolean
    preview: number
    style?: CSSProperties
}

/**
 * Studio Hero — sticky scroll hero.
 * The photo grows from a framed card to full-bleed while the two words
 * ride the photo's edges. The part of the words over the photo switches
 * to the "Text Inside" color.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function StudioHero(props: StudioHeroProps) {
    const {
        image = {
            src: "https://images.unsplash.com/photo-1729547312204-aca48a5b4eb2?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=2400",
            alt: "A street with houses under a clear sky",
        },
        leftWord = "Designed",
        rightWord = "Differently",
        font = {},
        maxFontSize = 96,
        minFontSize = 32,
        outsideColor = "#3A3028",
        insideColor = "#FFFDF8",
        background = "#F3EFE8",
        startScale = 0.5,
        mobileStartScale = 0.5,
        mobileBreakpoint = 810,
        scrollLength = 2.5,
        edgePadding = 12,
        shadeColor = "#000000",
        shadeOpacity = 0.3,
        intro = true,
        smooth = true,
        preview = 0,
    } = props

    const isStatic = useIsStaticRenderer()

    const trackRef = useRef<HTMLElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const rowRef = useRef<HTMLDivElement>(null)

    // Stage width + how wide the text row is per 1px of font size
    const [stageW, setStageW] = useState(1200)
    const [widthPerPx, setWidthPerPx] = useState(0)

    useIsoLayoutEffect(() => {
        const stage = stageRef.current
        const row = rowRef.current
        if (!stage || !row) return
        const measure = () => {
            const word = row.firstElementChild as HTMLElement | null
            const fs = word ? parseFloat(getComputedStyle(word).fontSize) : 0
            const nextW = stage.offsetWidth
            const nextRatio = fs ? row.offsetWidth / fs : 0
            startTransition(() => {
                setStageW((w) => (w === nextW ? w : nextW))
                setWidthPerPx((r) =>
                    Math.abs(r - nextRatio) < 0.001 ? r : nextRatio
                )
            })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(stage)
        ro.observe(row)
        return () => ro.disconnect()
    }, [leftWord, rightWord, font])

    const isMobile = stageW < mobileBreakpoint
    const s0 = isMobile ? mobileStartScale : startScale

    // Fluid size, capped so both words always fit on one line
    const fluid = Math.min(maxFontSize, Math.max(minFontSize, stageW * 0.055))
    const fitCap = widthPerPx ? (stageW - edgePadding * 2) / widthPerPx : fluid
    const fontSize = Math.min(fluid, fitCap)

    // Space each word can travel before it touches the screen edge
    const textW = widthPerPx * fontSize
    const room = Math.max(0, (stageW - textW) / 2 - edgePadding)

    // Progress: page scroll on the live site, the preview slider on canvas
    const { scrollYProgress } = useScroll({
        target: trackRef,
        offset: ["start start", "end end"],
    })
    const springed = useSpring(scrollYProgress, {
        stiffness: 180,
        damping: 36,
        mass: 0.5,
    })
    const previewMV = useMotionValue(preview)
    useEffect(() => previewMV.set(preview), [preview])
    const progress = isStatic ? previewMV : smooth ? springed : scrollYProgress

    // Intro: words start together and split apart on load
    const introMV = useMotionValue(isStatic || !intro ? 1 : 0)
    useEffect(() => {
        if (isStatic || !intro) {
            introMV.set(1)
            return
        }
        const controls = animate(introMV, 1, {
            duration: 1.2,
            delay: 0.25,
            ease: [0.65, 0, 0.35, 1],
        })
        return () => controls.stop()
    }, [isStatic, intro])

    // Layout-dependent inputs live in motion values so transforms stay current
    const s0MV = useMotionValue(s0)
    const stageWMV = useMotionValue(stageW)
    const roomMV = useMotionValue(room)
    const shadeMaxMV = useMotionValue(shadeOpacity)
    useEffect(() => {
        s0MV.set(s0)
        stageWMV.set(stageW)
        roomMV.set(room)
        shadeMaxMV.set(shadeOpacity)
    }, [s0, stageW, room, shadeOpacity])

    const scale = useTransform([progress, s0MV], ([p, a]: number[]) =>
        a + (1 - a) * p
    )
    const clipPath = useTransform(
        scale,
        (s) => `inset(${((1 - s) / 2) * 100}%)`
    )
    const offset = useTransform(
        [scale, introMV, stageWMV, roomMV],
        ([s, i, w, r]: number[]) => Math.min(((1 - s) / 2) * w, r) * i
    )
    const negOffset = useTransform(offset, (v) => -v)
    const shade = useTransform([progress, shadeMaxMV], ([p, m]: number[]) =>
        Math.max(0, (p - 0.55) / 0.45) * m
    )

    const textStyle: CSSProperties = {
        ...font,
        fontSize,
        margin: 0,
        whiteSpace: "pre",
    }

    const heading = (color: string, ref?: React.Ref<HTMLDivElement>) => (
        <div
            ref={ref}
            style={{ display: "flex", alignItems: "baseline", color }}
        >
            <motion.span style={{ ...textStyle, x: negOffset }}>
                {leftWord + " "}
            </motion.span>
            <motion.span style={{ ...textStyle, x: offset }}>
                {rightWord}
            </motion.span>
        </div>
    )

    const layer: CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
    }

    return (
        <section
            ref={trackRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: isStatic ? 800 : `${scrollLength * 100}vh`,
                background,
            }}
        >
            <div
                ref={stageRef}
                style={{
                    position: isStatic ? "relative" : "sticky",
                    top: 0,
                    width: "100%",
                    height: isStatic ? "100%" : "100svh",
                    overflow: "hidden",
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        scale,
                        willChange: "transform",
                    }}
                >
                    <img
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt || ""}
                        loading="eager"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                    <motion.div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: shadeColor,
                            opacity: shade,
                        }}
                    />
                </motion.div>

                {/* Words outside the photo */}
                <h1 style={{ ...layer, margin: 0, font: "inherit" }}>
                    {heading(outsideColor, rowRef)}
                </h1>

                {/* Same words, clipped to the photo's bounds */}
                <motion.div aria-hidden style={{ ...layer, clipPath }}>
                    {heading(insideColor)}
                </motion.div>
            </div>
        </section>
    )
}

addPropertyControls(StudioHero, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    leftWord: {
        type: ControlType.String,
        title: "Left Word",
        defaultValue: "Designed",
    },
    rightWord: {
        type: ControlType.String,
        title: "Right Word",
        defaultValue: "Differently",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1.1em",
        },
    },
    maxFontSize: {
        type: ControlType.Number,
        title: "Max Size",
        defaultValue: 96,
        min: 24,
        max: 240,
        unit: "px",
    },
    minFontSize: {
        type: ControlType.Number,
        title: "Min Size",
        defaultValue: 32,
        min: 12,
        max: 120,
        unit: "px",
    },
    outsideColor: {
        type: ControlType.Color,
        title: "Text Outside",
        defaultValue: "#3A3028",
    },
    insideColor: {
        type: ControlType.Color,
        title: "Text Inside",
        defaultValue: "#FFFDF8",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F3EFE8",
    },
    startScale: {
        type: ControlType.Number,
        title: "Start Scale",
        defaultValue: 0.5,
        min: 0.2,
        max: 1,
        step: 0.01,
    },
    mobileStartScale: {
        type: ControlType.Number,
        title: "Mobile Scale",
        defaultValue: 0.5,
        min: 0.2,
        max: 1,
        step: 0.01,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Below",
        defaultValue: 810,
        min: 320,
        max: 1440,
        unit: "px",
    },
    scrollLength: {
        type: ControlType.Number,
        title: "Scroll Length",
        description: "How many screen heights the animation lasts.",
        defaultValue: 2.5,
        min: 1.2,
        max: 6,
        step: 0.1,
    },
    edgePadding: {
        type: ControlType.Number,
        title: "Edge Padding",
        defaultValue: 12,
        min: 0,
        max: 80,
        unit: "px",
    },
    shadeColor: {
        type: ControlType.Color,
        title: "Shade",
        defaultValue: "#000000",
    },
    shadeOpacity: {
        type: ControlType.Number,
        title: "Shade Max",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
    },
    intro: {
        type: ControlType.Boolean,
        title: "Intro Split",
        defaultValue: true,
    },
    smooth: {
        type: ControlType.Boolean,
        title: "Smooth Scroll",
        defaultValue: true,
    },
    preview: {
        type: ControlType.Number,
        title: "Canvas Preview",
        description:
            "Scrub the animation on the canvas. No effect on the live site.",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
    },
})
