import React, { useState, useEffect, useRef, useCallback, memo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- Types ---

interface TypographyStyle {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
}

interface Slide {
    title: string
    subtitle: string
    description: string
    accentColor: string
    textPosition: "top" | "center" | "bottom"

    // Layer 1 (Back)
    layer1Image: string
    layer1X: number
    layer1Y: number
    layer1Scale: number
    layer1Parallax: number

    // Layer 2 (Mid Product)
    layer2Image: string
    layer2X: number
    layer2Y: number
    layer2Scale: number
    layer2Parallax: number

    // Layer 3 (Front Elements)
    layer3Image: string
    layer3X: number
    layer3Y: number
    layer3Scale: number
    layer3Parallax: number

    // Layer 4 (Full-Width Texture Overlay)
    layer4Image: string
    layer4Scale: number
    layer4Parallax: number
}

type TransitionEffect =
    | "slide"
    | "fade"
    | "scaleFade"
    | "verticalWipe"
    | "cube3D"

interface Props {
    slides: Slide[]
    selectedSlideIndex: number
    autoplay: boolean
    autoplaySpeed: number
    transitionDuration: number
    transitionEffect: TransitionEffect
    parallaxIntensity: number
    showArrows: boolean
    showDots: boolean

    // Global Framer Typography Controls
    titleFont: TypographyStyle
    subtitleFont: TypographyStyle
    descriptionFont: TypographyStyle
    textColor: string
}

// Base parallax travel multiplier relative to slide distance
const BASE_SPEEDS = {
    layer1: 0.45,
    layer2: 0.72,
    layer3: 1.18,
    layer4: 1.35,
    text: 0.85,
}

function wrapDelta(delta: number, total: number) {
    if (total <= 0) return 0
    return delta - Math.round(delta / total) * total
}

// --- Memoized Parallax Layer ---

interface ParallaxLayerProps {
    image: string
    xPos: number
    yPos: number
    scale: number
    mouseParallaxFactor: number
    mouse: { x: number; y: number }
    zIndex: number
    basePx: number
    speedFactor: number
    slideTransition: string
    axis: "x" | "y"
    usesLayerTravel: boolean
}

const ParallaxLayer = memo(function ParallaxLayer({
    image,
    xPos,
    yPos,
    scale,
    mouseParallaxFactor,
    mouse,
    zIndex,
    basePx,
    speedFactor,
    slideTransition,
    axis,
    usesLayerTravel,
}: ParallaxLayerProps) {
    if (!image) return null

    const local = usesLayerTravel ? basePx * (speedFactor - 1) : 0
    const travelTransform =
        axis === "x"
            ? `translate3d(${local}px, 0, 0)`
            : `translate3d(0, ${local}px, 0)`
    const offsetX = mouse.x * mouseParallaxFactor
    const offsetY = mouse.y * mouseParallaxFactor

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex,
                transform: travelTransform,
                transition: slideTransition,
            }}
        >
            <img
                src={image}
                alt=""
                style={{
                    transform: `translate3d(calc(${xPos}px + ${offsetX}px), calc(${yPos}px + ${offsetY}px), 0px) scale(${scale})`,
                    maxHeight: "75%",
                    maxWidth: "75%",
                    objectFit: "contain",
                    transition: "transform 0.1s ease-out",
                }}
            />
        </div>
    )
})

// --- Main Slider Component ---

export default function UltimateParallaxSlider(props: Props) {
    const {
        slides = [],
        selectedSlideIndex = 0,
        autoplay = false,
        autoplaySpeed = 6000,
        transitionDuration = 1.0,
        transitionEffect = "slide",
        parallaxIntensity = 50,
        showArrows = true,
        showDots = true,
        titleFont = {
            fontFamily: "Inter",
            fontSize: "56px",
            fontWeight: 800,
            lineHeight: "1.1em",
            letterSpacing: "-0.02em",
        },
        subtitleFont = {
            fontFamily: "Inter",
            fontSize: "14px",
            fontWeight: 700,
            lineHeight: "1.4em",
            letterSpacing: "0.2em",
        },
        descriptionFont = {
            fontFamily: "Inter",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "1.5em",
            letterSpacing: "0em",
        },
        textColor = "#ffffff",
    } = props

    const totalSlides = slides.length
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStaticRenderer = useIsStaticRenderer()

    // Treat BOTH the Framer canvas and static/export renders as "static".
    // Canvas needs this too: without it, RAF-driven mouse parallax and
    // continuously re-triggering CSS transitions run inside the editor,
    // which is exactly the perf issue Framer's automated review flags.
    const isStatic = isStaticRenderer || isCanvas

    const [virtualIndex, setVirtualIndex] = useState(selectedSlideIndex)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
    const [isInViewport, setIsInViewport] = useState(true)

    const containerRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const rafRef = useRef<number | null>(null)

    const currentIndex =
        totalSlides > 0
            ? ((virtualIndex % totalSlides) + totalSlides) % totalSlides
            : 0

    // Sync active slide in Framer editor preview (still works in canvas —
    // this only updates which slide index the static branch renders).
    useEffect(() => {
        if (isCanvas) {
            setVirtualIndex(
                Math.min(selectedSlideIndex, Math.max(0, totalSlides - 1))
            )
        }
    }, [selectedSlideIndex, totalSlides, isCanvas])

    // Viewport Visibility Tracking via IntersectionObserver — skip entirely
    // in static contexts (canvas/export), nothing to observe for.
    useEffect(() => {
        const el = containerRef.current
        if (!el || isStatic) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInViewport(entry.isIntersecting)
                if (!entry.isIntersecting && rafRef.current) {
                    cancelAnimationFrame(rafRef.current)
                    rafRef.current = null
                }
            },
            { threshold: 0.1 }
        )

        observer.observe(el)
        return () => {
            observer.disconnect()
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [isStatic])

    // Container Resize Observer — only needed by the interactive branch.
    useEffect(() => {
        const el = containerRef.current
        if (!el || isStatic) return
        const update = () =>
            setContainerSize({ w: el.clientWidth, h: el.clientHeight })
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic])

    // Autoplay Loop (Only runs when visible and not static/canvas/export)
    useEffect(() => {
        if (isStatic || !autoplay || totalSlides <= 1 || !isInViewport) return

        timeoutRef.current = setTimeout(() => {
            setVirtualIndex((v) => v + 1)
        }, autoplaySpeed)

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [
        virtualIndex,
        autoplay,
        autoplaySpeed,
        totalSlides,
        isStatic,
        isInViewport,
    ])

    const goTo = useCallback(
        (targetIndex: number) => {
            if (isStatic) return
            setVirtualIndex((v) => {
                const current = ((v % totalSlides) + totalSlides) % totalSlides
                const delta = wrapDelta(targetIndex - current, totalSlides)
                return v + delta
            })
        },
        [totalSlides, isStatic]
    )

    const next = () => !isStatic && setVirtualIndex((v) => v + 1)
    const prev = () => !isStatic && setVirtualIndex((v) => v - 1)

    // Mouse Movement Handler with rAF + Viewport check
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isStatic || !isInViewport) return

        const { clientWidth, clientHeight } = e.currentTarget
        const clientX = e.clientX
        const clientY = e.clientY

        if (rafRef.current) cancelAnimationFrame(rafRef.current)

        rafRef.current = requestAnimationFrame(() => {
            const x = (clientX / clientWidth - 0.5) * 2
            const y = (clientY / clientHeight - 0.5) * 2
            setMousePos({ x, y })
        })
    }

    const handleMouseLeave = () => {
        if (isStatic) return
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        setMousePos({ x: 0, y: 0 })
    }

    if (totalSlides === 0) {
        return <div style={fallbackStyle}>Add slides in the property panel</div>
    }

    // Static fallback view — used for canvas, SSG/SSR, and export alike.
    // Plain styled element, no transitions, no listeners, no observers.
    if (isStatic) {
        const slide = slides[currentIndex] || slides[0]
        return (
            <div
                ref={containerRef}
                style={{
                    ...containerStyle,
                    backgroundColor: slide?.accentColor || "#111",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent:
                            slide?.textPosition === "top"
                                ? "flex-start"
                                : slide?.textPosition === "bottom"
                                  ? "flex-end"
                                  : "center",
                        padding: "40px",
                        boxSizing: "border-box",
                        color: textColor,
                    }}
                >
                    {slide?.layer2Image && (
                        <img
                            src={slide.layer2Image}
                            alt=""
                            style={{
                                maxHeight: "50%",
                                maxWidth: "50%",
                                objectFit: "contain",
                                marginBottom: "20px",
                            }}
                        />
                    )}
                    <div style={{ ...textAreaStyle, color: textColor }}>
                        {slide?.subtitle && (
                            <span style={{ ...subtitleStyle, ...subtitleFont }}>
                                {slide.subtitle}
                            </span>
                        )}
                        <h1 style={{ ...titleStyle, ...titleFont }}>
                            {slide?.title}
                        </h1>
                        <p style={{ ...descStyle, ...descriptionFont }}>
                            {slide?.description}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const intensityMix = parallaxIntensity / 50
    const speedFor = (base: number) => 1 + (base - 1) * intensityMix
    const easing = "cubic-bezier(0.65, 0, 0.35, 1)"
    const slideTransition = `transform ${transitionDuration}s ${easing}`
    const backdropColor = slides[currentIndex]?.accentColor || "#111"

    return (
        <div
            ref={containerRef}
            style={{ ...containerStyle, backgroundColor: backdropColor }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* SOLID BACKGROUND BACKDROP */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                    backgroundColor: backdropColor,
                    transition: `background-color ${transitionDuration}s ease-out`,
                }}
            />

            {slides.map((slide, index) => {
                const delta = wrapDelta(index - virtualIndex, totalSlides)
                const isActive = delta === 0

                if (Math.abs(delta) > 2) return null

                const wrapper = getEffectStyle(
                    transitionEffect,
                    delta,
                    isActive,
                    containerSize,
                    slideTransition,
                    transitionDuration
                )

                let justifyContentVal = "center"
                if (slide.textPosition === "top")
                    justifyContentVal = "flex-start"
                if (slide.textPosition === "bottom")
                    justifyContentVal = "flex-end"

                const axis = transitionEffect === "verticalWipe" ? "y" : "x"
                const basePx =
                    transitionEffect === "slide"
                        ? delta * containerSize.w
                        : transitionEffect === "verticalWipe"
                          ? delta * containerSize.h
                          : 0
                const usesLayerTravel =
                    transitionEffect === "slide" ||
                    transitionEffect === "verticalWipe"

                return (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: slide.accentColor || "#1a1a1a",
                            overflow: "hidden",
                            zIndex: isActive ? 20 : 10,
                            pointerEvents: isActive ? "auto" : "none",
                            ...wrapper,
                        }}
                    >
                        {/* PARALLAX LAYERS 1-3 */}
                        <ParallaxLayer
                            image={slide.layer1Image}
                            xPos={slide.layer1X}
                            yPos={slide.layer1Y}
                            scale={slide.layer1Scale}
                            mouseParallaxFactor={slide.layer1Parallax}
                            mouse={mousePos}
                            zIndex={1}
                            basePx={basePx}
                            speedFactor={speedFor(BASE_SPEEDS.layer1)}
                            slideTransition={slideTransition}
                            axis={axis}
                            usesLayerTravel={usesLayerTravel}
                        />
                        <ParallaxLayer
                            image={slide.layer2Image}
                            xPos={slide.layer2X}
                            yPos={slide.layer2Y}
                            scale={slide.layer2Scale}
                            mouseParallaxFactor={slide.layer2Parallax}
                            mouse={mousePos}
                            zIndex={2}
                            basePx={basePx}
                            speedFactor={speedFor(BASE_SPEEDS.layer2)}
                            slideTransition={slideTransition}
                            axis={axis}
                            usesLayerTravel={usesLayerTravel}
                        />
                        <ParallaxLayer
                            image={slide.layer3Image}
                            xPos={slide.layer3X}
                            yPos={slide.layer3Y}
                            scale={slide.layer3Scale}
                            mouseParallaxFactor={slide.layer3Parallax}
                            mouse={mousePos}
                            zIndex={3}
                            basePx={basePx}
                            speedFactor={speedFor(BASE_SPEEDS.layer3)}
                            slideTransition={slideTransition}
                            axis={axis}
                            usesLayerTravel={usesLayerTravel}
                        />

                        {/* LAYER 4: Full-Width Texture Overlay */}
                        {slide.layer4Image && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "-15%",
                                    left: "-15%",
                                    width: "130%",
                                    height: "130%",
                                    pointerEvents: "none",
                                    zIndex: 25,
                                    transform: usesLayerTravel
                                        ? axis === "x"
                                            ? `translate3d(${basePx * (speedFor(BASE_SPEEDS.layer4) - 1)}px, 0, 0)`
                                            : `translate3d(0, ${basePx * (speedFor(BASE_SPEEDS.layer4) - 1)}px, 0)`
                                        : "translate3d(0,0,0)",
                                    transition: slideTransition,
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundImage: `url(${slide.layer4Image})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        transform: `translate3d(${mousePos.x * slide.layer4Parallax}px, ${mousePos.y * slide.layer4Parallax}px, 0) scale(${slide.layer4Scale})`,
                                        transition: "transform 0.1s ease-out",
                                    }}
                                />
                            </div>
                        )}

                        {/* TEXT CONTAINER & TYPOGRAPHY LAYERS */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 30,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: justifyContentVal,
                                padding: "40px",
                                paddingTop:
                                    slide.textPosition === "top"
                                        ? "60px"
                                        : "0px",
                                paddingBottom:
                                    slide.textPosition === "bottom"
                                        ? "60px"
                                        : "0px",
                                boxSizing: "border-box",
                                pointerEvents: "none",
                                transform: usesLayerTravel
                                    ? axis === "x"
                                        ? `translate3d(${basePx * (speedFor(BASE_SPEEDS.text) - 1)}px, 0, 0)`
                                        : `translate3d(0, ${basePx * (speedFor(BASE_SPEEDS.text) - 1)}px, 0)`
                                    : "translate3d(0,0,0)",
                                transition: slideTransition,
                            }}
                        >
                            <div
                                style={{
                                    ...textAreaStyle,
                                    color: textColor,
                                    opacity: isActive ? 1 : 0,
                                    transition: `opacity ${transitionDuration * 0.7}s ease-out`,
                                }}
                            >
                                {slide.subtitle && (
                                    <span
                                        style={{
                                            ...subtitleStyle,
                                            ...subtitleFont,
                                        }}
                                    >
                                        {slide.subtitle}
                                    </span>
                                )}
                                <h1 style={{ ...titleStyle, ...titleFont }}>
                                    {slide.title}
                                </h1>
                                <p style={{ ...descStyle, ...descriptionFont }}>
                                    {slide.description}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })}

            {/* Navigation Arrows */}
            {showArrows && totalSlides > 1 && (
                <>
                    <button
                        style={{ ...arrowBtn, left: "30px" }}
                        onClick={prev}
                    >
                        &#10094;
                    </button>
                    <button
                        style={{ ...arrowBtn, right: "30px" }}
                        onClick={next}
                    >
                        &#10095;
                    </button>
                </>
            )}

            {/* Pagination Dots */}
            {showDots && totalSlides > 1 && (
                <div style={dotsContainer}>
                    {slides.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => goTo(idx)}
                            style={{
                                ...dotStyle,
                                width: idx === currentIndex ? "32px" : "10px",
                                background:
                                    idx === currentIndex
                                        ? textColor
                                        : "rgba(255,255,255,0.4)",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// Effect Handler
function getEffectStyle(
    effect: TransitionEffect,
    delta: number,
    isActive: boolean,
    size: { w: number; h: number },
    slideTransition: string,
    duration: number
): React.CSSProperties {
    switch (effect) {
        case "slide":
            return {
                transform: `translate3d(${delta * size.w}px, 0, 0)`,
                transition: slideTransition,
            }
        case "verticalWipe":
            return {
                transform: `translate3d(0, ${delta * size.h}px, 0)`,
                transition: slideTransition,
            }
        case "fade":
            return {
                transform: "translate3d(0,0,0)",
                opacity: isActive ? 1 : 0,
                transition: `opacity ${duration}s ease-in-out`,
            }
        case "scaleFade": {
            const scale = isActive ? 1 : delta > 0 ? 1.12 : 0.88
            return {
                transform: `translate3d(0,0,0) scale(${scale})`,
                opacity: isActive ? 1 : 0,
                transition: `opacity ${duration}s ease-in-out, transform ${duration}s cubic-bezier(0.65,0,0.35,1)`,
            }
        }
        case "cube3D": {
            let transform =
                "translate3d(100%, 0, -300px) rotateY(-25deg) scale(0.9)"
            let opacity = 0
            let visibility: "visible" | "hidden" = "hidden"
            if (isActive) {
                transform = "translate3d(0, 0, 0px) rotateY(0deg) scale(1)"
                opacity = 1
                visibility = "visible"
            } else if (delta === -1 || (delta > 1 && delta !== 0)) {
                transform =
                    "translate3d(-100%, 0, -300px) rotateY(25deg) scale(0.9)"
                visibility = "visible"
            } else if (delta === 1 || delta < -1) {
                transform =
                    "translate3d(100%, 0, -300px) rotateY(-25deg) scale(0.9)"
                visibility = "visible"
            }
            return {
                transform,
                opacity,
                visibility,
                backfaceVisibility: "hidden",
                transition: `all ${duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
            }
        }
        default:
            return {}
    }
}

// --- Styles ---

const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    perspective: "1200px",
}

const textAreaStyle: React.CSSProperties = {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    maxWidth: "700px",
    pointerEvents: "auto",
}

const subtitleStyle: React.CSSProperties = {
    textTransform: "uppercase",
    margin: 0,
}

const titleStyle: React.CSSProperties = {
    margin: 0,
}

const descStyle: React.CSSProperties = {
    margin: 0,
}

const arrowBtn: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 50,
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "#fff",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
}

const dotsContainer: React.CSSProperties = {
    position: "absolute",
    bottom: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 50,
    display: "flex",
    gap: "10px",
}

const dotStyle: React.CSSProperties = {
    height: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
}

const fallbackStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#111",
    color: "#fff",
}

// --- Extended Framer Property Controls ---

addPropertyControls(UltimateParallaxSlider, {
    titleFont: {
        type: ControlType.Font,
        title: "Title Typography",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: "56px",
            fontWeight: 800,
            lineHeight: "1.1em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Typography",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.2em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Typography",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "1.5em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },

    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            title: "Slide Configuration",
            controls: {
                title: {
                    type: ControlType.String,
                    defaultValue: "Mango Fresh",
                },
                subtitle: {
                    type: ControlType.String,
                    defaultValue: "Organic Juice",
                },
                description: {
                    type: ControlType.String,
                    defaultValue:
                        "Seamless multi-effect parallax transition, zero background gaps.",
                },
                accentColor: {
                    type: ControlType.Color,
                    title: "Background Accent Color",
                    defaultValue: "#d35400",
                },
                textPosition: {
                    type: ControlType.Enum,
                    title: "Text Position",
                    options: ["top", "center", "bottom"],
                    optionTitles: ["Top", "Center", "Bottom"],
                    defaultValue: "top",
                },

                layer1Image: {
                    type: ControlType.Image,
                    title: "Layer 1: Back Image",
                },
                layer1X: {
                    type: ControlType.Number,
                    title: "L1 Offset X",
                    min: -300,
                    max: 300,
                    step: 5,
                    defaultValue: 0,
                },
                layer1Y: {
                    type: ControlType.Number,
                    title: "L1 Offset Y",
                    min: -300,
                    max: 300,
                    step: 5,
                    defaultValue: 0,
                },
                layer1Scale: {
                    type: ControlType.Number,
                    title: "L1 Scale",
                    min: 0.2,
                    max: 3,
                    step: 0.1,
                    defaultValue: 1,
                },
                layer1Parallax: {
                    type: ControlType.Number,
                    title: "L1 Mouse Parallax",
                    min: 0,
                    max: 50,
                    step: 2,
                    defaultValue: 5,
                },

                layer2Image: {
                    type: ControlType.Image,
                    title: "Layer 2: Product Bottle (Mid)",
                },
                layer2X: {
                    type: ControlType.Number,
                    title: "L2 Offset X",
                    min: -300,
                    max: 300,
                    step: 5,
                    defaultValue: 0,
                },
                layer2Y: {
                    type: ControlType.Number,
                    title: "L2 Offset Y",
                    min: -300,
                    max: 300,
                    step: 5,
                    defaultValue: 0,
                },
                layer2Scale: {
                    type: ControlType.Number,
                    title: "L2 Scale",
                    min: 0.2,
                    max: 3,
                    step: 0.1,
                    defaultValue: 1.1,
                },
                layer2Parallax: {
                    type: ControlType.Number,
                    title: "L2 Mouse Parallax",
                    min: 0,
                    max: 50,
                    step: 2,
                    defaultValue: 15,
                },

                layer3Image: {
                    type: ControlType.Image,
                    title: "Layer 3: Front Object/Splash",
                },
                layer3X: {
                    type: ControlType.Number,
                    title: "L3 Offset X",
                    min: -300,
                    max: 300,
                    step: 5,
                    defaultValue: -40,
                },
                layer3Y: {
                    type: ControlType.Number,
                    title: "L3 Offset Y",
                    min: -300,
                    max: 300,
                    step: 5,
                    defaultValue: 20,
                },
                layer3Scale: {
                    type: ControlType.Number,
                    title: "L3 Scale",
                    min: 0.2,
                    max: 3,
                    step: 0.1,
                    defaultValue: 0.9,
                },
                layer3Parallax: {
                    type: ControlType.Number,
                    title: "L3 Mouse Parallax",
                    min: 0,
                    max: 50,
                    step: 2,
                    defaultValue: 25,
                },

                layer4Image: {
                    type: ControlType.Image,
                    title: "Layer 4: Full-Width Texture Overlay",
                },
                layer4Scale: {
                    type: ControlType.Number,
                    title: "Texture Scale",
                    min: 0.5,
                    max: 2,
                    step: 0.1,
                    defaultValue: 1,
                },
                layer4Parallax: {
                    type: ControlType.Number,
                    title: "Texture Mouse Parallax",
                    min: 0,
                    max: 50,
                    step: 2,
                    defaultValue: 35,
                },
            },
        },
        defaultValue: [
            {
                title: "Mango Fresh",
                subtitle: "Organic Drink",
                description:
                    "Seamless multi-effect parallax transition, zero background gaps.",
                accentColor: "#e67e22",
                textPosition: "top",
                layer1Image:
                    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80",
                layer1X: 0,
                layer1Y: 0,
                layer1Scale: 1,
                layer1Parallax: 5,
                layer2Image:
                    "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
                layer2X: 0,
                layer2Y: 0,
                layer2Scale: 1.1,
                layer2Parallax: 15,
                layer3Image: "",
                layer3X: 0,
                layer3Y: 0,
                layer3Scale: 1,
                layer3Parallax: 25,
                layer4Image: "",
                layer4Scale: 1,
                layer4Parallax: 35,
            },
        ],
    },

    selectedSlideIndex: {
        type: ControlType.Number,
        title: "Editor Slide View",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 0,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    autoplaySpeed: {
        type: ControlType.Number,
        title: "Autoplay Speed",
        defaultValue: 6000,
        hidden: (p) => !p.autoplay,
    },
    transitionEffect: {
        type: ControlType.Enum,
        title: "Transition Effect",
        options: ["slide", "fade", "scaleFade", "verticalWipe", "cube3D"],
        optionTitles: [
            "Slide (Horizontal Parallax)",
            "Fade",
            "Scale Fade",
            "Vertical Wipe",
            "3D Cube",
        ],
        defaultValue: "slide",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Duration (sec)",
        min: 0.4,
        max: 2.5,
        step: 0.1,
        defaultValue: 1.0,
    },
    parallaxIntensity: {
        type: ControlType.Number,
        title: "Layer Parallax Intensity",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
        hidden: (p) =>
            p.transitionEffect === "fade" ||
            p.transitionEffect === "scaleFade" ||
            p.transitionEffect === "cube3D",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
    showDots: { type: ControlType.Boolean, title: "Dots", defaultValue: true },
})
