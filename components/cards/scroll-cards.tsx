import * as React from "react"
import { useEffect, useRef, useState } from "react"
import {
    motion,
    useScroll,
    useSpring,
    useTransform,
    useMotionValue,
    useMotionValueEvent,
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


/**
 * Kan Biosys: Intro → Mission → Vision (scroll-linked VERTICAL cards)
 * Pins in the middle of the viewport. The card stack slides up as you scroll:
 * the current card moves out and fades, the next one rises into the same centred slot.
 * Native scrolling is never intercepted (CSS sticky + scroll progress).
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 */

type ImageValue = { src?: string; srcSet?: string; alt?: string } | undefined
type Layout = "desktop" | "tablet" | "mobile"

type Intro = {
    show: boolean
    heading: string
    text: string
    textSize: number
    image?: ImageValue
}
type Mission = { heading: string; text: string; image?: ImageValue }
type Vision = {
    heading: string
    text: string
    image?: ImageValue
    flip: boolean
}
type Cards = {
    eyebrow: string
    showProgress: boolean
    maxWidth: number
    minHeight: number
    maxHeight: number
    imageWidth: number
    radius: number
    gap: number
    imageInset: number
    textPadding: string
    mobileTextPadding: string
    titleBodyGap: number
}
type Typo = {
    loadManrope: boolean
    headingFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    headingSize: number
    bodySize: number
    mobileHeadingSize: number
    mobileBodySize: number
    headingLineHeight: number
    bodyLineHeight: number
}
type Colors = {
    accent: string
    background: string
    cardColor: string
    borderColor: string
    headingColor: string
    bodyColor: string
    eyebrowColor: string
    lineColor: string
    inactiveLabel: string
}
type Spacing = {
    paddingY: number
    paddingX: number
    mobilePaddingY: number
    mobilePaddingX: number
}
type Bg = {
    mode: "none" | "fixed" | "perCard"
    fixedImage?: ImageValue
    missionImage?: ImageValue
    visionImage?: ImageValue
    overlayColor: string
    overlayOpacity: number
}
type Motion = {
    scrollLength: number
    smooth: boolean
    canvasPreview: "intro" | "mission" | "vision"
}

type Props = {
    intro?: Partial<Intro>
    mission?: Partial<Mission>
    vision?: Partial<Vision>
    cards?: Partial<Cards>
    type?: Partial<Typo>
    colors?: Partial<Colors>
    spacing?: Partial<Spacing>
    bg?: Partial<Bg>
    motion?: Partial<Motion>
    style?: React.CSSProperties
}

const rnd = (i: number, s: number) => {
    const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
    return x - Math.floor(x)
}

/* piecewise-linear with smoothstep easing inside each segment */
function stops(v: number, ins: number[], outs: number[]) {
    if (v <= ins[0]) return outs[0]
    for (let i = 1; i < ins.length; i++) {
        if (v <= ins[i]) {
            const t = (v - ins[i - 1]) / (ins[i] - ins[i - 1])
            const e = t * t * (3 - 2 * t)
            return outs[i - 1] + (outs[i] - outs[i - 1]) * e
        }
    }
    return outs[outs.length - 1]
}

function BgImg({ img }: { img: ImageValue }) {
    return (
        <img
            src={img?.src}
            srcSet={img?.srcSet}
            alt=""
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
            }}
        />
    )
}

/* Shown until an image is uploaded: a still microbial network, tight (mission) or wide (vision). */
function Placeholder({
    wide,
    accent,
    ink,
    bg,
}: {
    wide: boolean
    accent: string
    ink: string
    bg: string
}) {
    const n = 16
    const pts = Array.from({ length: n }, (_, i) => {
        const a = i * 2.39996 + (wide ? 0.9 : 0)
        const r =
            i === 0 ? 0 : (wide ? 60 : 36) + Math.sqrt(i) * (wide ? 38 : 22)
        return [200 + Math.cos(a) * r, 200 + Math.sin(a) * r * 1.1]
    })
    const lines: [number, number][] = []
    pts.forEach((p, i) => {
        pts.map((q, j) => ({ j, d: Math.hypot(p[0] - q[0], p[1] - q[1]) }))
            .filter((o) => o.j !== i)
            .sort((a, b) => a.d - b.d)
            .slice(0, wide ? 3 : 2)
            .forEach((o) => lines.push([i, o.j]))
    })
    return (
        <svg
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMid slice"
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                background: bg,
            }}
            aria-hidden
        >
            <g stroke={ink} strokeOpacity={0.3} strokeWidth={0.8} fill="none">
                {lines.map(([a, b], k) => (
                    <line
                        key={k}
                        x1={pts[a][0]}
                        y1={pts[a][1]}
                        x2={pts[b][0]}
                        y2={pts[b][1]}
                    />
                ))}
            </g>
            {pts.map((p, i) => (
                <circle
                    key={i}
                    cx={p[0]}
                    cy={p[1]}
                    r={i === 0 ? 11 : 3 + rnd(i, 4) * 4}
                    fill={i === 0 || i % 5 === 0 ? accent : bg}
                    stroke={ink}
                    strokeWidth={1}
                />
            ))}
        </svg>
    )
}

export default function KanBiosysMissionVision(props: Props) {
    const intro = { ...D.intro, ...(props.intro || {}) }
    const mission = { ...D.mission, ...(props.mission || {}) }
    const vision = { ...D.vision, ...(props.vision || {}) }
    const cards = { ...D.cards, ...(props.cards || {}) }
    const typo = { ...D.type, ...(props.type || {}) }
    const colors = { ...D.colors, ...(props.colors || {}) }
    const spacing = { ...D.spacing, ...(props.spacing || {}) }
    const bg = { ...D.bg, ...(props.bg || {}) }
    const mo = { ...D.motion, ...(props.motion || {}) }
    const style = props.style

    const {
        show: showIntro,
        heading: introHeading,
        text: introText,
        textSize: introSize,
        image: introImage,
    } = intro
    const {
        heading: missionHeading,
        text: missionDescription,
        image: missionImage,
    } = mission
    const {
        heading: visionHeading,
        text: visionDescription,
        image: visionImage,
        flip: flipVision,
    } = vision
    const {
        eyebrow,
        showProgress,
        maxWidth: maxCardWidth,
        minHeight: minCardHeight,
        maxHeight: maxCardHeight,
        imageWidth,
        radius: cardRadius,
        gap: cardGap,
        imageInset,
        textPadding,
        mobileTextPadding,
        titleBodyGap,
    } = cards
    const {
        loadManrope,
        headingFont,
        bodyFont,
        headingSize,
        bodySize,
        mobileHeadingSize,
        mobileBodySize,
        headingLineHeight,
        bodyLineHeight,
    } = typo
    const {
        accent,
        background,
        cardColor,
        borderColor,
        headingColor,
        bodyColor,
        eyebrowColor,
        lineColor: textColor,
        inactiveLabel: secondaryColor,
    } = colors
    const { paddingY, paddingX, mobilePaddingY, mobilePaddingX } = spacing
    const {
        mode: bgMode,
        fixedImage: fixedBgImage,
        missionImage: missionBgImage,
        visionImage: visionBgImage,
        overlayColor: bgOverlayColor,
        overlayOpacity: bgOverlayOpacity,
    } = bg
    const { scrollLength, smooth: smoothScrub, canvasPreview } = mo

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReduced(mq.matches)
        const h = () => setReduced(mq.matches)
        mq.addEventListener?.("change", h)
        return () => mq.removeEventListener?.("change", h)
    }, [])
    const useSmooth = smoothScrub && !reduced

    /* ---- measure the component's own width + the pinned stage height ---- */
    const rootRef = useRef<HTMLElement>(null)
    const outerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(1440)
    const [stageH, setStageH] = useState(900)
    useEffect(() => {
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            entries.forEach((e) => {
                if (e.target === rootRef.current) setWidth(e.contentRect.width)
                else if (e.target === stageRef.current)
                    setStageH(e.contentRect.height)
            })
        })
        if (rootRef.current) ro.observe(rootRef.current)
        if (stageRef.current) ro.observe(stageRef.current)
        return () => ro.disconnect()
    }, [])
    const layout: Layout =
        width >= 960 ? "desktop" : width >= 600 ? "tablet" : "mobile"
    const isMobile = layout === "mobile"
    const isDesktop = layout === "desktop"

    const padX = isMobile ? mobilePaddingX : paddingX
    const padY = isMobile ? mobilePaddingY : paddingY
    const gap = cardGap
    const cardW = Math.max(
        240,
        Math.round(Math.min(width - padX * 2, maxCardWidth))
    )

    // Card height = what's left after padding + progress row, clamped. Numeric so the track knows its travel.
    const reserve = padY * 2 + (showProgress ? 84 : 0)
    const minH = isMobile ? Math.max(minCardHeight, 520) : minCardHeight
    const cardH = isCanvas
        ? 640
        : Math.round(Math.min(maxCardHeight, Math.max(minH, stageH - reserve)))
    const shift = cardH + gap // vertical travel per card

    /* ---- scroll progress: 0 = Intro, 1 = Mission, 2 = Vision ---- */
    const hasIntro = showIntro && !!introText
    const hasIntroRef = useRef(hasIntro)
    hasIntroRef.current = hasIntro
    const reducedRef = useRef(reduced)
    reducedRef.current = reduced

    const { scrollYProgress } = useScroll({
        target: outerRef,
        offset: ["start start", "end end"],
    })
    const raw = useTransform(scrollYProgress, (v: number) =>
        hasIntroRef.current
            ? stops(v, [0, 0.14, 0.4, 0.58, 0.84, 1], [0, 0, 1, 1, 2, 2])
            : stops(v, [0, 0.1, 0.9, 1], [1, 1, 2, 2])
    )
    const spring = useSpring(raw, { stiffness: 110, damping: 30, mass: 0.5 })
    const staticP = useMotionValue(1)
    useEffect(
        () =>
            staticP.set(
                canvasPreview === "vision"
                    ? 2
                    : canvasPreview === "intro" && hasIntro
                      ? 0
                      : 1
            ),
        [canvasPreview, hasIntro, staticP]
    )
    const p = isCanvas ? staticP : useSmooth ? spring : raw

    const shiftMV = useMotionValue(shift)
    useEffect(() => shiftMV.set(shift), [shift, shiftMV])
    const baseMV = useMotionValue(hasIntro ? 0 : 1)
    useEffect(() => {
        baseMV.set(hasIntro ? 0 : 1)
    }, [hasIntro, baseMV])

    /* The whole stack travels UP as progress increases */
    const trackY = useTransform(
        [p, shiftMV, baseMV] as any,
        ([v, sh, b]: number[]) => -(v - b) * sh
    )

    /* Intro: fades in with focus as the section arrives, then leaves as Mission rises in */
    const { scrollYProgress: enterRaw } = useScroll({
        target: outerRef,
        offset: ["start 90%", "start 35%"],
    })
    const staticOne = useMotionValue(1)
    const enter = isCanvas ? staticOne : enterRaw
    const iExit = useTransform(p, [0, 0.6], [1, 0])
    const iOpacity = useTransform(
        [enter, iExit] as any,
        ([a, b]: number[]) => a * b
    )
    const iFilter = useTransform([enter, iExit] as any, ([a, b]: number[]) =>
        reducedRef.current
            ? "none"
            : `blur(${((1 - a) * 10 + (1 - b) * 6).toFixed(1)}px)`
    )
    const iImgY = useTransform(p, [0, 1], [0, -28])
    const iY = useTransform(enter, [0, 1], [28, 0])
    const iScale = useTransform(p, [0, 1], [1, 0.97])

    /* Mission arrives as the intro leaves; Vision arrives late and soft.
       (No per-card Y offsets: the track provides the vertical motion.) */
    const mOpacity = useTransform(p, [0.4, 0.9, 1.1, 1.6], [0, 1, 1, 0])
    const mScale = useTransform(p, [0.3, 1, 2], [0.97, 1, 0.97])
    const vOpacity = useTransform(p, [1.35, 1.85], [0, 1])
    const vScale = useTransform(p, [1.2, 2], [0.97, 1])
    // image parallax: vertical
    const mImgY = useTransform(p, [0, 1, 2], [28, 0, -28])
    const vImgY = useTransform(p, [1, 2], [28, 0])
    const bgVisionOpacity = useTransform(p, [1.3, 1.8], [0, 1])
    const barFill = useTransform(p, [1, 2], ["0%", "100%"])

    const labels = [missionHeading, visionHeading]
    const progressOpacity = useTransform(p, [0.3, 0.9], [0, 1])
    const [active, setActive] = useState(0)
    useMotionValueEvent(p, "change", (v) => {
        setActive(hasIntroRef.current && v < 0.5 ? -1 : v > 1.5 ? 1 : 0)
    })

    const goTo = (idx: number) => {
        const el = outerRef.current
        if (!el || typeof window === "undefined") return
        const top = el.getBoundingClientRect().top + window.scrollY
        const range = el.offsetHeight - window.innerHeight
        const f = hasIntro ? [0.49, 0.95] : [0.05, 0.95]
        window.scrollTo({
            top: top + range * f[idx],
            behavior: reduced ? "auto" : "smooth",
        })
    }

    /* ---- sizes ---- */
    const hSize = isDesktop
        ? headingSize
        : isMobile
          ? mobileHeadingSize
          : Math.max(40, Math.round(headingSize * 0.62))
    const bSize = isDesktop
        ? bodySize
        : isMobile
          ? mobileBodySize
          : Math.max(14, bodySize - 3)
    const iSize = isDesktop
        ? introSize
        : isMobile
          ? Math.max(14, Math.round(introSize * 0.62))
          : Math.round(introSize * 0.8)
    const inset = isMobile ? Math.min(imageInset, 12) : imageInset
    const tbGap = isMobile ? Math.min(titleBodyGap, 18) : titleBodyGap

    /* Plain render function (not a component) so cards never remount on state changes */
    const renderCard = ({
        key,
        heading,
        description,
        image,
        wide,
        flip,
        opacity,
        scale,
        y,
        imgY,
        filter,
        bodyPx,
        maxCh,
    }: {
        key: string
        heading: string
        description: string
        image: ImageValue
        wide: boolean
        flip: boolean
        opacity: any
        scale: any
        y?: any
        imgY: any
        filter?: any
        bodyPx?: number
        maxCh?: string
    }) => (
        <motion.article
            key={key}
            style={{
                flex: "0 0 auto",
                width: cardW,
                height: cardH,
                opacity,
                scale,
                y,
                filter,
                display: "flex",
                flexDirection: isMobile
                    ? "column"
                    : flip
                      ? "row-reverse"
                      : "row",
                background: cardColor,
                border: `1px solid ${borderColor}`,
                borderRadius: cardRadius,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "relative",
                    flex: isMobile ? "0 0 38%" : `0 0 ${imageWidth}%`,
                    margin: isMobile ? `${inset}px ${inset}px 0` : inset,
                    borderRadius: Math.max(0, cardRadius - 8),
                    overflow: "hidden",
                    border: `1px solid ${borderColor}`,
                    background,
                }}
            >
                <motion.div
                    style={{ position: "absolute", inset: -32, y: imgY }}
                >
                    {image && image.src ? (
                        <img
                            src={image.src}
                            srcSet={image.srcSet}
                            alt={image.alt || ""}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : (
                        <Placeholder
                            wide={wide}
                            accent={accent}
                            ink={textColor}
                            bg={background}
                        />
                    )}
                </motion.div>
            </div>
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 24,
                    padding: isMobile ? mobileTextPadding : textPadding,
                }}
            >
                {eyebrow && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                        }}
                    >
                        <span
                            style={{
                                color: eyebrowColor,
                                ...bodyFont,
                                fontSize: 13,
                                fontWeight: 600,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                            }}
                        >
                            {eyebrow}
                        </span>
                        <span
                            aria-hidden
                            style={{
                                flex: 1,
                                height: 1,
                                background: textColor,
                                opacity: 0.16,
                            }}
                        />
                    </div>
                )}
                <div>
                    <h2
                        style={{
                            margin: 0,
                            color: headingColor,
                            lineHeight: headingLineHeight,
                            fontWeight: 600,
                            letterSpacing: "-0.045em",
                            ...headingFont,
                            fontSize: hSize,
                        }}
                    >
                        {heading}
                    </h2>
                    <p
                        style={{
                            margin: `${tbGap}px 0 0`,
                            lineHeight: bodyLineHeight,
                            fontWeight: 500,
                            color: bodyColor,
                            maxWidth: maxCh ?? "40ch",
                            ...bodyFont,
                            fontSize: bodyPx ?? bSize,
                        }}
                    >
                        {description}
                    </p>
                </div>
            </div>
        </motion.article>
    )

    return (
        <section
            ref={rootRef}
            className="kbmv"
            style={{
                width: "100%",
                boxSizing: "border-box",
                background,
                color: textColor,
                position: "relative",
                overflowX: "clip",
                fontFamily: `"Manrope", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif`,
                ...style,
            }}
        >
            <style>{`
                ${loadManrope ? "@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');" : ""}
                .kbmv *{box-sizing:border-box}
                .kbmv .kb-stage{height:100vh;height:100svh}
                .kbmv button{all:unset;cursor:pointer;-webkit-tap-highlight-color:transparent}
                .kbmv button:focus-visible{outline:2px solid ${textColor};outline-offset:4px}
            `}</style>

            <div
                ref={outerRef}
                style={{
                    height: isCanvas ? "auto" : `${scrollLength}vh`,
                    position: "relative",
                }}
            >
                <div
                    ref={stageRef}
                    className={isCanvas ? undefined : "kb-stage"}
                    style={{
                        position: isCanvas ? "relative" : "sticky",
                        top: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center" /* vertical centring */,
                        alignItems: "stretch",
                        gap: isMobile ? 20 : 32,
                        padding: isCanvas ? `${padY}px 0` : 0,
                        overflowX: "clip",
                    }}
                >
                    {bgMode !== "none" && (
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 0,
                                pointerEvents: "none",
                                overflow: "hidden",
                            }}
                        >
                            {bgMode === "fixed" && fixedBgImage?.src && (
                                <BgImg img={fixedBgImage} />
                            )}
                            {bgMode === "perCard" && (
                                <>
                                    {missionBgImage?.src && (
                                        <BgImg img={missionBgImage} />
                                    )}
                                    {visionBgImage?.src && (
                                        <motion.div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                opacity: bgVisionOpacity,
                                            }}
                                        >
                                            <BgImg img={visionBgImage} />
                                        </motion.div>
                                    )}
                                </>
                            )}
                            {((bgMode === "fixed" && fixedBgImage?.src) ||
                                (bgMode === "perCard" &&
                                    (missionBgImage?.src ||
                                        visionBgImage?.src))) && (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: bgOverlayColor,
                                        opacity: bgOverlayOpacity,
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* Viewport window: one card tall, clips the stack */}
                    <div
                        style={{
                            position: "relative",
                            zIndex: 1,
                            width: cardW,
                            height: cardH,
                            margin: "0 auto",
                            overflow: "hidden",
                            flex: "0 0 auto",
                        }}
                    >
                        <motion.div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: cardW,
                                display: "flex",
                                flexDirection: "column",
                                gap,
                                y: trackY,
                                willChange: "transform",
                            }}
                        >
                            {hasIntro &&
                                renderCard({
                                    key: "intro",
                                    heading: introHeading,
                                    description: introText,
                                    image: introImage,
                                    wide: true,
                                    flip: true,
                                    opacity: iOpacity,
                                    scale: iScale,
                                    y: reduced ? 0 : iY,
                                    imgY: iImgY,
                                    filter: iFilter,
                                    bodyPx: iSize,
                                    maxCh: "52ch",
                                })}
                            {renderCard({
                                key: "mission",
                                heading: missionHeading,
                                description: missionDescription,
                                image: missionImage,
                                wide: false,
                                flip: false,
                                opacity: mOpacity,
                                scale: mScale,
                                imgY: mImgY,
                            })}
                            {renderCard({
                                key: "vision",
                                heading: visionHeading,
                                description: visionDescription,
                                image: visionImage,
                                wide: true,
                                flip: flipVision,
                                opacity: vOpacity,
                                scale: vScale,
                                imgY: vImgY,
                            })}
                        </motion.div>
                    </div>

                    {showProgress && (
                        <motion.div
                            role="tablist"
                            aria-label="Our Mission or Our Vision"
                            style={{
                                position: "relative",
                                zIndex: 1,
                                width: cardW,
                                margin: "0 auto",
                                flex: "0 0 auto",
                                opacity: progressOpacity,
                                pointerEvents: active === -1 ? "none" : "auto",
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    height: 2,
                                    background: `${textColor}1f`,
                                }}
                            >
                                <motion.div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: -2,
                                        bottom: -2,
                                        width: barFill,
                                        background: accent,
                                        borderRight: `2px solid ${textColor}`,
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginTop: 14,
                                }}
                            >
                                {labels.map((label, i) => (
                                    <button
                                        key={i}
                                        role="tab"
                                        aria-selected={active === i}
                                        onClick={() => goTo(i)}
                                        style={{
                                            ...bodyFont,
                                            fontSize: 14,
                                            fontWeight: 700,
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            color:
                                                active === i
                                                    ? textColor
                                                    : secondaryColor,
                                            opacity: active === i ? 1 : 0.7,
                                            transition:
                                                "color .3s ease, opacity .3s ease",
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    )
}

const MISSION =
    "To harness the power of microbes and precision agriculture to deliver effective, sustainable and responsible biological solutions that maximize plant potential and empower farmers."
const VISION =
    "As Indian Agri-biotech company, our vision is to transform agriculture through microbial innovation that increases yields, reduces cultivation costs, and promotes healthy soil, food, water and the environment."
const INTRO =
    "The world will need to feed nearly 9 billion people, placing immense pressure on agriculture to significantly increase food production. Simply increasing the use of fertilizers, pesticides and water is not a sustainable solution. Microbes offer a powerful alternative—helping unlock nature’s potential to build healthier soils, stronger crops and a more sustainable future for agriculture."

const D = {
    intro: {
        show: true,
        heading: "By 2050",
        text: INTRO,
        textSize: 18,
    } as Intro,
    mission: { heading: "Our Mission", text: MISSION } as Mission,
    vision: { heading: "Our Vision", text: VISION, flip: true } as Vision,
    cards: {
        eyebrow: "Kan Biosys",
        showProgress: true,
        maxWidth: 1280,
        minHeight: 460,
        maxHeight: 720,
        imageWidth: 46,
        radius: 20,
        gap: 24,
        imageInset: 16,
        textPadding: "44px",
        mobileTextPadding: "20px 22px 24px",
        titleBodyGap: 28,
    } as Cards,
    type: {
        loadManrope: true,
        headingSize: 88,
        bodySize: 20,
        mobileHeadingSize: 52,
        mobileBodySize: 16,
        headingLineHeight: 0.95,
        bodyLineHeight: 1.5,
    } as Typo,
    colors: {
        accent: "#C4FF2E",
        background: "#F5F4EF",
        cardColor: "#FBFAF7",
        borderColor: "rgba(18,20,17,0.14)",
        headingColor: "#121411",
        bodyColor: "#666A61",
        eyebrowColor: "#121411",
        lineColor: "#121411",
        inactiveLabel: "#666A61",
    } as Colors,
    spacing: {
        paddingY: 120,
        paddingX: 80,
        mobilePaddingY: 64,
        mobilePaddingX: 20,
    } as Spacing,
    bg: { mode: "none", overlayColor: "#F5F4EF", overlayOpacity: 0.4 } as Bg,
    motion: {
        scrollLength: 260,
        smooth: true,
        canvasPreview: "mission",
    } as Motion,
}

KanBiosysMissionVision.defaultProps = { ...D, width: 1440 }

const num = (
    title: string,
    d: number,
    min: number,
    max: number,
    step: number,
    unit?: string
) => ({
    type: ControlType.Number as const,
    title,
    min,
    max,
    step,
    unit,
    defaultValue: d,
})

addPropertyControls(KanBiosysMissionVision, {
    intro: {
        type: ControlType.Object,
        title: "1 · Intro card",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show intro",
                defaultValue: true,
            },
            heading: {
                type: ControlType.String,
                title: "Title",
                defaultValue: D.intro.heading,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                displayTextArea: true,
                defaultValue: INTRO,
            },
            textSize: num("Text size", 18, 14, 40, 1, "px"),
            image: { type: ControlType.ResponsiveImage, title: "Image" },
        },
    },
    mission: {
        type: ControlType.Object,
        title: "2 · Mission card",
        controls: {
            heading: {
                type: ControlType.String,
                title: "Title",
                defaultValue: D.mission.heading,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                displayTextArea: true,
                defaultValue: MISSION,
            },
            image: { type: ControlType.ResponsiveImage, title: "Image" },
        },
    },
    vision: {
        type: ControlType.Object,
        title: "3 · Vision card",
        controls: {
            heading: {
                type: ControlType.String,
                title: "Title",
                defaultValue: D.vision.heading,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                displayTextArea: true,
                defaultValue: VISION,
            },
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            flip: {
                type: ControlType.Boolean,
                title: "Image on right",
                defaultValue: true,
            },
        },
    },
    cards: {
        type: ControlType.Object,
        title: "4 · Card layout",
        controls: {
            eyebrow: {
                type: ControlType.String,
                title: "Eyebrow text",
                defaultValue: "Kan Biosys",
            },
            showProgress: {
                type: ControlType.Boolean,
                title: "Progress bar",
                defaultValue: true,
            },
            maxWidth: num("Max width", 1280, 600, 1800, 20, "px"),
            minHeight: num("Min height", 460, 320, 800, 10, "px"),
            maxHeight: num("Max height", 720, 400, 1000, 10, "px"),
            imageWidth: num("Image width", 46, 25, 65, 1, "%"),
            radius: num("Corner radius", 20, 0, 48, 1, "px"),
            gap: num("Gap between cards", 24, 0, 160, 4, "px"),
            imageInset: num("Image inset", 16, 0, 48, 2, "px"),
            textPadding: {
                type: ControlType.Padding,
                title: "Text to card edge",
                defaultValue: "44px",
            },
            mobileTextPadding: {
                type: ControlType.Padding,
                title: "Mobile text to edge",
                defaultValue: "20px 22px 24px",
            },
            titleBodyGap: num("Title to body", 28, 0, 120, 2, "px"),
        },
    },
    type: {
        type: ControlType.Object,
        title: "5 · Typography",
        controls: {
            loadManrope: {
                type: ControlType.Boolean,
                title: "Load Manrope",
                defaultValue: true,
            },
            headingFont: {
                type: ControlType.Font,
                title: "Title font",
                controls: "basic",
                defaultFontType: "sans-serif",
            },
            bodyFont: {
                type: ControlType.Font,
                title: "Body font",
                controls: "basic",
                defaultFontType: "sans-serif",
            },
            headingSize: num("Title size", 88, 40, 160, 2, "px"),
            bodySize: num("Body size", 20, 14, 32, 1, "px"),
            mobileHeadingSize: num("Mobile title", 52, 28, 96, 2, "px"),
            mobileBodySize: num("Mobile body", 16, 12, 24, 1, "px"),
            headingLineHeight: num("Title line height", 0.95, 0.8, 1.4, 0.05),
            bodyLineHeight: num("Body line height", 1.5, 1.1, 2, 0.05),
        },
    },
    colors: {
        type: ControlType.Object,
        title: "6 · Colours",
        controls: {
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#C4FF2E",
            },
            background: {
                type: ControlType.Color,
                title: "Section",
                defaultValue: "#F5F4EF",
            },
            cardColor: {
                type: ControlType.Color,
                title: "Card",
                defaultValue: "#FBFAF7",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Card border",
                defaultValue: "rgba(18,20,17,0.14)",
            },
            headingColor: {
                type: ControlType.Color,
                title: "Title",
                defaultValue: "#121411",
            },
            bodyColor: {
                type: ControlType.Color,
                title: "Body",
                defaultValue: "#666A61",
            },
            eyebrowColor: {
                type: ControlType.Color,
                title: "Eyebrow",
                defaultValue: "#121411",
            },
            lineColor: {
                type: ControlType.Color,
                title: "Lines & active label",
                defaultValue: "#121411",
            },
            inactiveLabel: {
                type: ControlType.Color,
                title: "Inactive label",
                defaultValue: "#666A61",
            },
        },
    },
    spacing: {
        type: ControlType.Object,
        title: "7 · Section spacing",
        controls: {
            paddingY: num("Top / bottom", 120, 0, 240, 4, "px"),
            paddingX: num("Sides", 80, 0, 240, 4, "px"),
            mobilePaddingY: num("Mobile top / bottom", 64, 0, 160, 4, "px"),
            mobilePaddingX: num("Mobile sides", 20, 0, 80, 2, "px"),
        },
    },
    bg: {
        type: ControlType.Object,
        title: "8 · Background image",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["none", "fixed", "perCard"],
                optionTitles: ["None", "One image", "Mission + Vision"],
                defaultValue: "none",
            },
            fixedImage: {
                type: ControlType.ResponsiveImage,
                title: "Image",
                hidden: (p: Bg) => p.mode !== "fixed",
            },
            missionImage: {
                type: ControlType.ResponsiveImage,
                title: "Mission image",
                hidden: (p: Bg) => p.mode !== "perCard",
            },
            visionImage: {
                type: ControlType.ResponsiveImage,
                title: "Vision image",
                hidden: (p: Bg) => p.mode !== "perCard",
            },
            overlayColor: {
                type: ControlType.Color,
                title: "Overlay",
                defaultValue: "#F5F4EF",
                hidden: (p: Bg) => p.mode === "none",
            },
            overlayOpacity: {
                ...num("Overlay amount", 0.4, 0, 1, 0.05),
                hidden: (p: Bg) => p.mode === "none",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "9 · Scroll & motion",
        controls: {
            scrollLength: num("Scroll length", 260, 150, 600, 10, "vh"),
            smooth: {
                type: ControlType.Boolean,
                title: "Smooth scrub",
                defaultValue: true,
            },
            canvasPreview: {
                type: ControlType.Enum,
                title: "Canvas preview",
                options: ["intro", "mission", "vision"],
                optionTitles: ["Intro", "Mission", "Vision"],
                displaySegmentedControl: true,
                defaultValue: "mission",
            },
        },
    },
})
