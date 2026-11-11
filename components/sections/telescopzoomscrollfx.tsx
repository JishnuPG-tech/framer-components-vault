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


/* ── helpers ─────────────────────────────────────────── */

// Matches GSAP power1.inOut
function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function remap(v: number, lo: number, hi: number): number {
    if (hi <= lo) return v >= hi ? 1 : 0
    return Math.max(0, Math.min(1, (v - lo) / (hi - lo)))
}

/* ── constants (matching source exactly) ─────────────── */

// GSAP timeline total duration (from tween analysis):
// smallImages: 0→1 (dur 1) | frontScale: 0.7→1.7 | frontBlur: 1.0→2.2
const TL = 2.2

const FRONT_SCALES = [1, 0.85, 0.6, 0.45, 0.3, 0.15]

// Positions from source CSS (vw → % approximation for container)
const SMALL_POS: React.CSSProperties[] = [
    { top: "15%", left: "-2%" },
    { top: "5%", left: "20%" },
    { top: "8%", left: "27%" },
    { top: "18%", right: "18%" },
    { top: "5%", right: "10%" },
    { bottom: "5%", left: "10%" },
    { bottom: "8%", left: "23%" },
    { bottom: "3%", left: "45%" },
    { bottom: "5%", right: "15%" },
    { bottom: "9%", right: "7%" },
]

const DEFAULT_MAIN_IMAGE =
    "https://i.ibb.co.com/CsTwgYpN/Futuristic-Corridor-Walk.png"

const DEFAULT_IMAGES = [
    "https://i.ibb.co.com/Cs8cwFTP/Serene-Portrait-Outdoors.png",
    "https://i.ibb.co.com/0yWZKcM6/Smiling-Man-Portrait.png",
    "https://i.ibb.co.com/2YvKtrYg/visualelectric-1759560765488.png",
    "https://i.ibb.co.com/Z6bz0qss/visualelectric-1759560770609.png",
    "https://i.ibb.co.com/Y4pb4Bbx/visualelectric-1760165065844.jpg",
    "https://i.ibb.co.com/PsL75TgK/visualelectric-1760165086031.png",
    "https://i.ibb.co.com/ZR4SyfRB/Woman-in-Green-Jacket.png",
    "https://i.ibb.co.com/kgQhD7QS/visualelectric-1771663523750.png",
    "https://i.ibb.co.com/NnSzLT32/Joyful-Portrait-Outdoors.png",
    "https://i.ibb.co.com/mCCVNWQc/Man-Relaxing-Outdoors.png",
]

/* ── component ───────────────────────────────────────── */

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function TelescopeZoom(props) {
    const {
        mainImage,
        smallImages = [],
        leftText,
        rightText,
        font,
        fontColor,
        blurAmount,
        maskSoftness,
        duration,
        trigger,
        triggerTarget,
        loop,
        bgColor,
        depth,
        smallSize,
        scrollSpeed,
        style,
    } = props

    const wrapperRef = React.useRef<HTMLDivElement>(null)
    const rawPRef = React.useRef(0)
    const rafRef = React.useRef(0)
    const [rawP, setRawP] = React.useState(0)

    // Eased progress (matches source: power1.inOut applied to scroll progress)
    // Used for media container scale + text split (CSS --progress in source)
    const easedP = easeInOut(rawP)

    /* ── linear animation driver (for hover / auto) ── */

    const animateTo = React.useCallback(
        (target: number, onDone?: () => void) => {
            cancelAnimationFrame(rafRef.current)
            const start = rawPRef.current
            const delta = target - start
            if (Math.abs(delta) < 0.001) {
                rawPRef.current = target
                setRawP(target)
                onDone?.()
                return
            }
            const t0 = performance.now()
            const ms = duration * 1000
            const tick = () => {
                const t = Math.min(1, (performance.now() - t0) / ms)
                // Linear interpolation — all easing is in the render formulas
                rawPRef.current = start + delta * t
                setRawP(rawPRef.current)
                if (t < 1) rafRef.current = requestAnimationFrame(tick)
                else {
                    rawPRef.current = target
                    setRawP(target)
                    onDone?.()
                }
            }
            rafRef.current = requestAnimationFrame(tick)
        },
        [duration]
    )

    /* ── scroll-scrub trigger (viewport position based) ── */

    React.useEffect(() => {
        if (trigger !== "onScroll") return

        // Find trigger element: by accessibility name or fall back to self
        let el: HTMLElement | null = null
        const hasTriggerTarget = !!(triggerTarget && triggerTarget.trim())
        if (hasTriggerTarget) {
            const name = triggerTarget.trim()
            el =
                document.querySelector(`[data-framer-name="${name}"]`) ||
                document.querySelector(`[aria-label="${name}"]`) ||
                document.querySelector(`#${CSS.escape(name)}`)
        }
        if (!el) el = wrapperRef.current
        if (!el) return

        let ticking = false
        const update = () => {
            const rect = el!.getBoundingClientRect()
            const vh = window.innerHeight
            let raw: number

            if (hasTriggerTarget) {
                // Sticky scroll-space formula.
                // triggerTarget should be the tall outer container; this component
                // should be position:sticky (top:0) inside it.
                // raw = 0 when container top reaches viewport top
                // raw = 1 when (container.height - vh) px of scroll have elapsed
                const scrollRange = Math.max(
                    1,
                    (rect.height - vh) * scrollSpeed
                )
                raw = Math.max(0, Math.min(1, -rect.top / scrollRange))
            } else {
                // Viewport-scrub formula (component itself as trigger):
                // raw = 0 when component top enters at viewport bottom
                // raw = 1 when component bottom exits at viewport top
                const total = vh + rect.height
                raw = Math.max(0, Math.min(1, (vh - rect.top) / total))
            }

            rawPRef.current = raw
            setRawP(raw)
            ticking = false
        }

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(update)
                ticking = true
            }
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll, { passive: true })
        update()
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
        }
    }, [trigger, triggerTarget, scrollSpeed])

    /* ── hover trigger ── */

    React.useEffect(() => {
        if (trigger !== "onHover") return
        const el = wrapperRef.current
        if (!el) return
        const enter = () => animateTo(1)
        const leave = () => animateTo(0)
        el.addEventListener("pointerenter", enter)
        el.addEventListener("pointerleave", leave)
        return () => {
            el.removeEventListener("pointerenter", enter)
            el.removeEventListener("pointerleave", leave)
            cancelAnimationFrame(rafRef.current)
        }
    }, [trigger, animateTo])

    /* ── auto trigger ── */

    React.useEffect(() => {
        if (trigger !== "auto") return
        const id = setTimeout(() => {
            animateTo(1, () => {
                if (!loop) return
                const cycle = () =>
                    animateTo(0, () =>
                        setTimeout(() => animateTo(1, cycle), 400)
                    )
                setTimeout(cycle, 1000)
            })
        }, 300)
        return () => {
            clearTimeout(id)
            cancelAnimationFrame(rafRef.current)
        }
    }, [trigger, loop, animateTo])

    React.useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

    /* ── canvas preview ──────────────────────── */

    if (RenderTarget.current() === RenderTarget.canvas) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: 0,
                    padding: 0,
                    boxSizing: "border-box",
                }}
            >
                <img
                    src={mainImage?.src || DEFAULT_MAIN_IMAGE}
                    srcSet={mainImage?.srcSet}
                    alt={mainImage?.alt || ""}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.3,
                    }}
                />
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        textAlign: "center",
                        padding: "0 24px",
                    }}
                >
                    <span
                        style={{
                            color: fontColor,
                            display: "block",
                            ...font,
                        }}
                    >
                        {leftText} {rightText}
                    </span>
                    {trigger === "onScroll" ? (
                        <div
                            style={{
                                fontSize: "11px",
                                color: fontColor,
                                opacity: 0.65,
                                marginTop: 14,
                                display: "block",
                                lineHeight: "1.7em",
                                textAlign: "left",
                                background: "rgba(0,0,0,0.06)",
                                borderRadius: 8,
                                padding: "10px 14px",
                                maxWidth: 320,
                            }}
                        >
                            <strong
                                style={{ display: "block", marginBottom: 4 }}
                            >
                                Scroll Setup (required)
                            </strong>
                            1. Create a Frame ~3× the viewport height (e.g.
                            300vh). Add Scroll Section name (e.g. "ScrollSpace")
                            <br />
                            2. Place the component before it, set{" "}
                            <em>Position → Fixed</em>, Top: 0, fill the Frame
                            <br />
                            3. Set <em>Trigger Target</em> → "ScrollSpace"
                        </div>
                    ) : (
                        <span
                            style={{
                                fontSize: "12px",
                                color: fontColor,
                                opacity: 0.5,
                                marginTop: 8,
                                display: "block",
                            }}
                        >
                            Telescope Zoom — {trigger}
                        </span>
                    )}
                </div>
            </div>
        )
    }

    /* ── animation formulas (exact GSAP timeline mapping) ── */

    const validSmall = (smallImages || []).filter((img: any) => img?.src)
    const imgs: string[] =
        validSmall.length > 0
            ? validSmall.slice(0, 10).map((img: any) => img.src)
            : DEFAULT_IMAGES
    const n = imgs.length

    // Small images: timeline 0→1, stagger {amount: 0.2, from: "center"}
    // center images start first, edges start 0.2 later
    const getSmallStyle = (i: number) => {
        const center = (n - 1) / 2 || 0.5
        const dist = n > 1 ? Math.abs(i - center) / center : 0
        const staggerOff = dist * 0.2 // GSAP stagger amount = 0.2
        const tStart = staggerOff / TL
        const tEnd = (staggerOff + 1) / TL
        const lp = easeInOut(remap(rawP, tStart, tEnd))
        return {
            transform: `translateZ(${lp * depth}px)`,
            opacity: lp > 0.85 ? Math.max(0, 1 - (lp - 0.85) / 0.15) : 1,
        }
    }

    // Front scale: position 0.6, delay 0.1 → starts at 0.7, duration 1 → ends at 1.7
    // All layers animate together (no stagger)
    const getFrontStyle = (i: number) => {
        const init = FRONT_SCALES[i]
        const scaleStart = 0.7 / TL
        const scaleEnd = 1.7 / TL
        const sp = easeInOut(remap(rawP, scaleStart, scaleEnd))
        const currentScale = init + (1 - init) * sp

        // Front blur: position 0.6, delay 0.4 → starts at 1.0, duration 1
        // stagger {amount: 0.2, from: "end"} → layer 5 first, layer 0 last
        const blurStagger = ((5 - i) / 5) * 0.2
        const blurStart = (1.0 + blurStagger) / TL
        const blurEnd = (2.0 + blurStagger) / TL
        const bp = easeInOut(remap(rawP, blurStart, blurEnd))

        return {
            transform: `scale(${currentScale})`,
            filter: `blur(${blurAmount * (1 - bp)}px)`,
        }
    }

    const maskGrad = `radial-gradient(circle, black ${maskSoftness}%, transparent ${maskSoftness + 30}%)`

    // Text split: matches source CSS calc(var(--progress) * (-66vw + 100%))
    // Simplified: at easedP=1, text moves ~66vw outward
    const textOffsetVw = easedP * 66

    /* ── animation content (shared between scroll/non-scroll) ── */

    const animContent = (
        <>
            {/* ── small scattered images ── */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    perspective: `${depth}px`,
                    pointerEvents: "none",
                }}
            >
                {imgs.map((src, i) => {
                    const pos = SMALL_POS[i % SMALL_POS.length]
                    const anim = getSmallStyle(i)
                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                ...pos,
                                width: `${smallSize}%`,
                                aspectRatio: "3/4",
                                borderRadius: 4,
                                overflow: "hidden",
                                transformStyle: "preserve-3d",
                                backfaceVisibility: "hidden",
                                willChange: "transform, opacity",
                                ...anim,
                            }}
                        >
                            <img
                                src={src}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </div>
                    )
                })}
            </div>

            {/* ── media container (telescope zoom) ── */}
            {/* Source: .section__media { transform: scale(var(--progress)) } */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    transform: `scale(${easedP})`,
                    transformOrigin: "center",
                    willChange: "transform",
                }}
            >
                {/* back layer — sharp, no mask */}
                <div style={{ position: "absolute", inset: 0 }}>
                    <img
                        src={mainImage?.src || DEFAULT_MAIN_IMAGE}
                        srcSet={mainImage?.srcSet}
                        alt={mainImage?.alt || ""}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                </div>

                {/* front mask layers (6 layers, each with circular mask) */}
                {FRONT_SCALES.map((_, i) => {
                    const fs = getFrontStyle(i)
                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: i + 1,
                                transformOrigin: "center",
                                willChange: "transform, filter",
                                ...fs,
                            }}
                        >
                            <img
                                src={mainImage?.src || DEFAULT_MAIN_IMAGE}
                                srcSet={mainImage?.srcSet}
                                alt={mainImage?.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    maskImage: maskGrad,
                                    WebkitMaskImage: maskGrad,
                                }}
                            />
                        </div>
                    )
                })}
            </div>

            {/* ── text overlay (splits apart from exact center) ── */}
            {(leftText || rightText) && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 3,
                        pointerEvents: "none",
                    }}
                >
                    {leftText && (
                        <span
                            style={{
                                position: "absolute",
                                right: "50%",
                                top: "50%",
                                transform: `translate3d(${-textOffsetVw}vw, -50%, 0)`,
                                marginRight: "0.15em",
                                whiteSpace: "nowrap",
                                color: fontColor,
                                ...font,
                            }}
                        >
                            {leftText}
                        </span>
                    )}
                    {rightText && (
                        <span
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: `translate3d(${textOffsetVw}vw, -50%, 0)`,
                                marginLeft: "0.15em",
                                whiteSpace: "nowrap",
                                color: fontColor,
                                ...font,
                            }}
                        >
                            {rightText}
                        </span>
                    )}
                </div>
            )}
        </>
    )

    /* ── render (single container for all triggers) ── */

    return (
        <div
            ref={wrapperRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                backgroundColor: bgColor,
                margin: 0,
                padding: 0,
                boxSizing: "border-box",
                cursor: trigger === "onHover" ? "pointer" : undefined,
            }}
        >
            {animContent}
        </div>
    )
}

/* ── defaults ────────────────────────────────────────── */

TelescopeZoom.defaultProps = {
    mainImage: undefined,
    smallImages: [],
    leftText: "smooth",
    rightText: "animation",
    fontColor: "#1a1a1a",
    blurAmount: 2,
    maskSoftness: 25,
    duration: 2,
    trigger: "onScroll",
    triggerTarget: "",
    loop: true,
    bgColor: "#ffffff",
    depth: 800,
    smallSize: 10,
    scrollSpeed: 1,
}

/* ── property controls ───────────────────────────────── */

addPropertyControls(TelescopeZoom, {
    trigger: {
        title: "Trigger",
        type: ControlType.Enum,
        options: ["onScroll", "onHover", "auto"],
        optionTitles: ["Scroll (Recommended)", "Hover", "Auto"],
        defaultValue: "onScroll",
    },
    mainImage: {
        title: "Main Image",
        type: ControlType.ResponsiveImage,
    },
    smallImages: {
        title: "Small Images",
        type: ControlType.Array,
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 10,
    },
    leftText: {
        title: "Left Text",
        type: ControlType.String,
        defaultValue: "smooth",
    },
    rightText: {
        title: "Right Text",
        type: ControlType.String,
        defaultValue: "animation",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    fontColor: {
        title: "Font Color",
        type: ControlType.Color,
        defaultValue: "#1a1a1a",
    },
    bgColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#ffffff",
    },
    blurAmount: {
        title: "Blur",
        type: ControlType.Number,
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    maskSoftness: {
        title: "Mask Edge",
        type: ControlType.Number,
        defaultValue: 25,
        min: 5,
        max: 50,
        step: 1,
        unit: "%",
        description: "Controls the telescope aperture edge softness",
    },
    depth: {
        title: "3D Depth",
        type: ControlType.Number,
        defaultValue: 800,
        min: 200,
        max: 2000,
        step: 50,
        unit: "px",
    },
    smallSize: {
        title: "Small Img Size",
        type: ControlType.Number,
        defaultValue: 10,
        min: 3,
        max: 25,
        step: 1,
        unit: "%",
    },
    triggerTarget: {
        title: "Trigger Target",
        type: ControlType.String,
        defaultValue: "",
        placeholder: "e.g. ScrollSpace",
        hidden: (p) => p.trigger !== "onScroll",
    },
    scrollSpeed: {
        title: "Scroll Speed",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.5,
        max: 5,
        step: 0.5,
        description:
            "Only applies when Trigger Target is set. Higher = more scroll distance required to complete the animation.",
        hidden: (p) => p.trigger !== "onScroll",
    },
    duration: {
        title: "Duration",
        type: ControlType.Number,
        defaultValue: 2,
        min: 0.3,
        max: 8,
        step: 0.1,
        unit: "s",
        hidden: (p) => p.trigger === "onScroll",
    },
    loop: {
        title: "Loop",
        type: ControlType.Boolean,
        defaultValue: true,
        hidden: (p) => p.trigger !== "auto",
    },
})
