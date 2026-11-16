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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 2200
 */

const EASE = "cubic-bezier(.16,1,.3,1)"
const SCROLL_SMOOTHING = 0.12

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function lerp(start: number, end: number, progress: number) {
    return start + (end - start) * progress
}

function mapRange(
    value: number,
    inputStart: number,
    inputEnd: number,
    outputStart = 0,
    outputEnd = 1
) {
    if (inputStart === inputEnd) return outputEnd

    const progress = clamp((value - inputStart) / (inputEnd - inputStart), 0, 1)

    return lerp(outputStart, outputEnd, progress)
}

function navigate(link?: string) {
    if (!link) return

    if (link.startsWith("#")) {
        document.querySelector(link)?.scrollIntoView({
            behavior: "smooth",
        })
        return
    }

    window.location.href = link
}

function getMask(
    shape: string,
    progress: number,
    startSize: number,
    radius: number
) {
    const p = clamp(progress, 0, 1)

    if (shape === "Circle") {
        const size = lerp(startSize, 76, p)
        return `circle(${size}% at 50% 50%)`
    }

    if (shape === "Horizontal") {
        const inset = lerp(clamp(50 - startSize * 0.5, 8, 47), 0, p)

        const currentRadius = lerp(radius, 0, p)

        return `inset(${inset}% 0% ${inset}% 0% round ${currentRadius}px)`
    }

    if (shape === "Vertical") {
        const inset = lerp(clamp(50 - startSize * 0.5, 8, 47), 0, p)

        const currentRadius = lerp(radius, 0, p)

        return `inset(0% ${inset}% 0% ${inset}% round ${currentRadius}px)`
    }

    if (shape === "Diamond") {
        const size = lerp(startSize * 0.45, 58, p)

        return `polygon(
            50% ${50 - size}%,
            ${50 + size}% 50%,
            50% ${50 + size}%,
            ${50 - size}% 50%
        )`
    }

    const inset = lerp(clamp(50 - startSize * 0.5, 5, 45), 0, p)

    const currentRadius = lerp(radius, 0, p)

    return `inset(${inset}% round ${currentRadius}px)`
}

export default function ScrollDrivenImageMask(props: any) {
    const {
        image,

        background,
        mediaBackground,

        eyebrow,
        headline,
        body,

        buttonLabel,
        buttonLink,

        maskShape,
        startMaskSize,
        maskRadius,

        revealStart,
        revealEnd,

        imageFit,
        imagePosition,

        startImageScale,
        endImageScale,

        startBlur,
        endBlur,

        startBrightness,
        endBrightness,

        scrollParallax,
        pointerParallax,

        overlayTop,
        overlayBottom,

        vignette,
        vignetteStrength,

        contentPosition,
        contentAlign,
        contentWidth,
        contentPadding,

        eyebrowFont,
        eyebrowSize,
        eyebrowColor,

        headlineFont,
        headlineSize,
        headlineLine,
        headlineTracking,
        headlineColor,

        bodyFont,
        bodySize,
        bodyLine,
        bodyColor,

        buttonBackground,
        buttonColor,

        textRevealStart,
        textRevealEnd,

        showProgress,
        progressSide,
        progressColor,
        progressTrackColor,
        showPercentage,

        mobileBreakpoint,
        mobileMaskScale,
        mobileHeadlineSize,
        mobileParallax,

        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const frameRef = React.useRef<HTMLDivElement | null>(null)
    const rafRef = React.useRef<number | null>(null)
    const targetProgressRef = React.useRef(0)
    const smoothProgressRef = React.useRef(0)

    const [progress, setProgress] = React.useState(0)
    const [componentWidth, setComponentWidth] = React.useState(1200)

    const [pointer, setPointer] = React.useState({
        x: 0,
        y: 0,
    })

    const [reducedMotion, setReducedMotion] = React.useState(false)
    const [isNearViewport, setIsNearViewport] = React.useState(false)

    React.useLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return

        const measure = () => {
            const rect = root.getBoundingClientRect()

            if (rect.width > 0) {
                setComponentWidth(rect.width)
            }
        }

        measure()

        if (isStaticRenderer || typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(measure)
        observer.observe(root)

        return () => observer.disconnect()
    }, [isStaticRenderer])

    React.useEffect(() => {
        if (isStaticRenderer || typeof window === "undefined") return

        const query = window.matchMedia("(prefers-reduced-motion: reduce)")

        const update = () => {
            setReducedMotion(query.matches)
        }

        update()
        query.addEventListener?.("change", update)

        return () => {
            query.removeEventListener?.("change", update)
        }
    }, [isStaticRenderer])

    React.useEffect(() => {
        if (isStaticRenderer || typeof window === "undefined") return
        if (typeof IntersectionObserver === "undefined") {
            setIsNearViewport(true)
            return
        }

        const root = rootRef.current
        if (!root) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsNearViewport(entry.isIntersecting)
            },
            {
                root: null,
                rootMargin: "75% 0px 75% 0px",
                threshold: 0,
            }
        )

        observer.observe(root)

        return () => observer.disconnect()
    }, [isStaticRenderer])

    React.useEffect(() => {
        if (isStaticRenderer || typeof window === "undefined") return

        if (reducedMotion) {
            targetProgressRef.current = 1
            smoothProgressRef.current = 1
            setProgress(1)
            return
        }

        if (!isNearViewport) {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            return
        }

        const readTargetProgress = () => {
            const root = rootRef.current
            if (!root) return

            const rect = root.getBoundingClientRect()
            const availableDistance = rect.height - window.innerHeight

            targetProgressRef.current =
                availableDistance <= 0
                    ? clamp(
                          (window.innerHeight - rect.top) /
                              (window.innerHeight + rect.height),
                          0,
                          1
                      )
                    : clamp(-rect.top / availableDistance, 0, 1)
        }

        const animateTowardsTarget = () => {
            const current = smoothProgressRef.current
            const target = targetProgressRef.current
            const next = current + (target - current) * SCROLL_SMOOTHING

            smoothProgressRef.current =
                Math.abs(target - next) < 0.0005 ? target : next
            setProgress(smoothProgressRef.current)

            if (Math.abs(target - smoothProgressRef.current) >= 0.0005) {
                rafRef.current = requestAnimationFrame(animateTowardsTarget)
            } else {
                rafRef.current = null
            }
        }

        const update = () => {
            readTargetProgress()

            if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(animateTowardsTarget)
            }
        }

        update()

        window.addEventListener("scroll", update, {
            passive: true,
        })

        window.addEventListener("resize", update)

        return () => {
            window.removeEventListener("scroll", update)
            window.removeEventListener("resize", update)

            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [isStaticRenderer, reducedMotion, isNearViewport])

    const mobile = componentWidth <= mobileBreakpoint

    const responsiveHeadline = mobile
        ? Math.min(
              headlineSize,
              mobileHeadlineSize,
              Math.max(28, componentWidth * 0.12)
          )
        : componentWidth <= 900
          ? Math.min(headlineSize, 72)
          : headlineSize

    const responsivePadding =
        componentWidth <= 440
            ? Math.min(contentPadding, 20)
            : componentWidth <= 700
              ? Math.min(contentPadding, 28)
              : contentPadding

    if (isStaticRenderer) {
        return (
            <div
                ref={rootRef}
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minHeight: 900,
                    overflow: "hidden",
                    background,
                    boxSizing: "border-box",
                    isolation: "isolate",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 24,
                        overflow: "hidden",
                        background: mediaBackground,
                    }}
                >
                    {image ? (
                        <img
                            src={image}
                            alt=""
                            draggable={false}
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: imageFit,
                                objectPosition: imagePosition,
                                filter: `brightness(${endBrightness})`,
                                pointerEvents: "none",
                                userSelect: "none",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "grid",
                                placeItems: "center",
                                background: mediaBackground,
                            }}
                        >
                            <div
                                style={{
                                    width: "min(42vw,420px)",
                                    aspectRatio: "1",
                                    borderRadius: "50%",
                                    background:
                                        "radial-gradient(circle at 35% 30%, #D7CEFF, #7052E8 38%, #171717 78%)",
                                    opacity: 0.85,
                                }}
                            />
                        </div>
                    )}

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            background: `linear-gradient(to bottom, rgba(0,0,0,${overlayTop}) 0%, rgba(0,0,0,.03) 40%, rgba(0,0,0,${overlayBottom}) 100%)`,
                            pointerEvents: "none",
                        }}
                    />

                    {vignette && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 3,
                                background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${vignetteStrength}) 100%)`,
                                pointerEvents: "none",
                            }}
                        />
                    )}
                </div>

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 10,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        padding: responsivePadding,
                        boxSizing: "border-box",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                contentPosition === "Center"
                                    ? "center"
                                    : contentPosition === "Right"
                                      ? "flex-end"
                                      : "flex-start",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                maxWidth: contentWidth,
                                textAlign:
                                    contentAlign === "Center"
                                        ? "center"
                                        : contentAlign === "Right"
                                          ? "right"
                                          : "left",
                                color: headlineColor,
                            }}
                        >
                            {eyebrow && (
                                <div
                                    style={{
                                        ...eyebrowFont,
                                        marginBottom: 14,
                                        fontSize: eyebrowSize,
                                        lineHeight: 1,
                                        letterSpacing: ".065em",
                                        textTransform: "uppercase",
                                        color: eyebrowColor,
                                        opacity: 0.88,
                                    }}
                                >
                                    {eyebrow}
                                </div>
                            )}

                            <div
                                style={{
                                    ...headlineFont,
                                    fontSize: responsiveHeadline,
                                    lineHeight: headlineLine,
                                    letterSpacing: `${headlineTracking}em`,
                                    color: headlineColor,
                                    textWrap: "balance",
                                    overflowWrap: "normal",
                                    wordBreak: "normal",
                                    hyphens: "none",
                                }}
                            >
                                {headline}
                            </div>

                            {body && (
                                <div
                                    style={{
                                        ...bodyFont,
                                        maxWidth: 620,
                                        marginTop: mobile ? 14 : 20,
                                        fontSize: mobile
                                            ? Math.min(bodySize, 15)
                                            : bodySize,
                                        lineHeight: bodyLine,
                                        color: bodyColor,
                                        opacity: 0.88,
                                    }}
                                >
                                    {body}
                                </div>
                            )}

                            {buttonLabel && (
                                <div
                                    style={{
                                        display: "inline-flex",
                                        marginTop: 24,
                                        padding: "13px 18px",
                                        borderRadius: 999,
                                        background: buttonBackground,
                                        color: buttonColor,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: ".02em",
                                    }}
                                >
                                    {buttonLabel} ↗
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const effectiveRevealStart = mobile
        ? Math.max(0, revealStart - 0.05)
        : revealStart

    const effectiveRevealEnd = mobile
        ? Math.min(1, revealEnd + (1 - mobileMaskScale) * 0.15)
        : revealEnd

    const revealProgress = reducedMotion
        ? 1
        : mapRange(progress, effectiveRevealStart, effectiveRevealEnd, 0, 1)

    const maskProgress = mobile
        ? clamp(revealProgress * mobileMaskScale + (1 - mobileMaskScale), 0, 1)
        : revealProgress

    const clipPath = reducedMotion
        ? "inset(0% round 0px)"
        : getMask(maskShape, maskProgress, startMaskSize, maskRadius)

    const mediaScale = reducedMotion
        ? endImageScale
        : lerp(startImageScale, endImageScale, revealProgress)

    const mediaBlur = reducedMotion
        ? endBlur
        : lerp(startBlur, endBlur, revealProgress)

    const mediaBrightness = reducedMotion
        ? endBrightness
        : lerp(startBrightness, endBrightness, revealProgress)

    const effectiveScrollParallax = mobile
        ? scrollParallax * mobileParallax
        : scrollParallax

    const scrollY = reducedMotion
        ? 0
        : lerp(effectiveScrollParallax, -effectiveScrollParallax, progress)

    const pointerAmount = mobile ? 0 : pointerParallax

    const pointerX = pointer.x * pointerAmount
    const pointerY = pointer.y * pointerAmount

    const effectiveTextStart = clamp(
        Math.max(effectiveRevealEnd + 0.02, textRevealStart),
        0,
        0.96
    )

    const effectiveTextEnd = clamp(
        Math.max(effectiveTextStart + 0.04, textRevealEnd),
        effectiveTextStart + 0.01,
        1
    )

    const textIn = reducedMotion
        ? 1
        : mapRange(progress, effectiveTextStart, effectiveTextEnd, 0, 1)

    const textOpacity = textIn

    const textY = lerp(42, 0, textIn)

    const textScale = lerp(0.985, 1, textIn)

    const progressPercent = Math.round(progress * 100)

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (mobile || reducedMotion || event.pointerType === "touch") return

        const frame = frameRef.current
        if (!frame) return

        const rect = frame.getBoundingClientRect()

        const x = clamp(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -1,
            1
        )

        const y = clamp(
            ((event.clientY - rect.top) / rect.height) * 2 - 1,
            -1,
            1
        )

        setPointer({
            x,
            y,
        })
    }

    const resetPointer = () => {
        setPointer({
            x: 0,
            y: 0,
        })
    }

    const contentAlignment =
        contentAlign === "Center"
            ? "center"
            : contentAlign === "Right"
              ? "right"
              : "left"

    const horizontalAlignment =
        contentPosition === "Center"
            ? "center"
            : contentPosition === "Right"
              ? "flex-end"
              : "flex-start"

    return (
        <div
            ref={rootRef}
            style={{
                ...style,

                position: "relative",

                width: "100%",
                height: "100%",

                minHeight: 900,

                background,

                boxSizing: "border-box",
            }}
        >
            <div
                ref={frameRef}
                onPointerMove={handlePointerMove}
                onPointerLeave={resetPointer}
                style={{
                    position: "sticky",

                    top: 0,

                    width: "100%",
                    height: "100vh",

                    overflow: "hidden",

                    background,

                    isolation: "isolate",
                }}
            >
                <div
                    style={{
                        position: "absolute",

                        inset: 0,

                        display: "grid",

                        placeItems: "center",

                        pointerEvents: "none",

                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            fontSize: mobile
                                ? "clamp(100px,35vw,220px)"
                                : "clamp(180px,30vw,500px)",

                            fontWeight: 600,

                            lineHeight: 0.75,

                            letterSpacing: "-.08em",

                            color: headlineColor,

                            opacity: lerp(0.055, 0.012, revealProgress),

                            transform: `scale(${lerp(
                                1,
                                1.14,
                                revealProgress
                            )})`,

                            transition: reducedMotion
                                ? "none"
                                : "opacity 200ms linear",

                            whiteSpace: "nowrap",

                            userSelect: "none",
                        }}
                    >
                        {eyebrow || "REVEAL"}
                    </div>
                </div>

                <div
                    style={{
                        position: "absolute",

                        inset: 0,

                        display: "grid",

                        placeItems: "center",

                        padding: mobile ? 12 : 24,

                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            position: "relative",

                            width: "100%",
                            height: "100%",

                            overflow: "hidden",

                            clipPath,

                            WebkitClipPath: clipPath,

                            transition: reducedMotion
                                ? "none"
                                : `clip-path 420ms ${EASE}`,

                            background: mediaBackground,

                            willChange: "clip-path",

                            transform: "translateZ(0)",
                        }}
                    >
                        {image ? (
                            <img
                                src={image}
                                alt=""
                                draggable={false}
                                style={{
                                    position: "absolute",

                                    inset: "-5%",

                                    width: "110%",
                                    height: "110%",

                                    objectFit: imageFit,
                                    objectPosition: imagePosition,

                                    transform: `
                                        translate3d(
                                            ${pointerX}px,
                                            ${scrollY + pointerY}px,
                                            0
                                        )
                                        scale(${mediaScale})
                                    `,

                                    filter: `
                                        blur(${mediaBlur}px)
                                        brightness(${mediaBrightness})
                                    `,

                                    transition: reducedMotion
                                        ? "none"
                                        : `
                                            transform 520ms ${EASE},
                                            filter 360ms ${EASE}
                                        `,

                                    willChange: "transform, filter",

                                    pointerEvents: "none",

                                    userSelect: "none",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    position: "absolute",

                                    inset: 0,

                                    display: "grid",

                                    placeItems: "center",

                                    background: mediaBackground,
                                }}
                            >
                                <div
                                    style={{
                                        width: "min(42vw,420px)",

                                        aspectRatio: "1",

                                        borderRadius: "50%",

                                        background:
                                            "radial-gradient(circle at 35% 30%, #D7CEFF, #7052E8 38%, #171717 78%)",

                                        filter: "blur(2px)",

                                        opacity: 0.85,
                                    }}
                                />
                            </div>
                        )}

                        <div
                            style={{
                                position: "absolute",

                                inset: 0,

                                zIndex: 2,

                                pointerEvents: "none",

                                background: `
                                    linear-gradient(
                                        to bottom,
                                        rgba(0,0,0,${overlayTop}) 0%,
                                        rgba(0,0,0,.03) 40%,
                                        rgba(0,0,0,${overlayBottom}) 100%
                                    )
                                `,
                            }}
                        />

                        {vignette && (
                            <div
                                style={{
                                    position: "absolute",

                                    inset: 0,

                                    zIndex: 3,

                                    pointerEvents: "none",

                                    background: `
                                        radial-gradient(
                                            ellipse at center,
                                            transparent 40%,
                                            rgba(0,0,0,${vignetteStrength}) 100%
                                        )
                                    `,
                                }}
                            />
                        )}
                    </div>
                </div>

                <div
                    style={{
                        position: "absolute",

                        inset: 0,

                        zIndex: 10,

                        display: "flex",

                        justifyContent: "flex-end",

                        flexDirection: "column",

                        padding: responsivePadding,

                        boxSizing: "border-box",

                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            width: "100%",

                            display: "flex",

                            justifyContent: horizontalAlignment,
                        }}
                    >
                        <div
                            style={{
                                width: "100%",

                                maxWidth: mobile ? "100%" : contentWidth,

                                textAlign: contentAlignment as any,

                                color: headlineColor,

                                opacity: textOpacity,

                                visibility:
                                    textOpacity <= 0.001 ? "hidden" : "visible",

                                transform: `
                                    translate3d(
                                        0,
                                        ${textY}px,
                                        0
                                    )
                                    scale(${textScale})
                                `,

                                transformOrigin:
                                    contentAlignment === "center"
                                        ? "center bottom"
                                        : contentAlignment === "right"
                                          ? "right bottom"
                                          : "left bottom",

                                transition: reducedMotion
                                    ? "none"
                                    : `
                                        opacity 520ms ${EASE},
                                        transform 680ms ${EASE}
                                    `,

                                willChange: "transform, opacity",
                            }}
                        >
                            {eyebrow && (
                                <div
                                    style={{
                                        ...eyebrowFont,

                                        marginBottom: mobile ? 10 : 14,

                                        fontSize: eyebrowSize,

                                        lineHeight: 1,

                                        letterSpacing: ".065em",

                                        textTransform: "uppercase",

                                        color: eyebrowColor,

                                        opacity: 0.88,

                                        textShadow:
                                            "0 1px 14px rgba(0,0,0,.28)",
                                    }}
                                >
                                    {eyebrow}
                                </div>
                            )}

                            <div
                                style={{
                                    ...headlineFont,

                                    fontSize: responsiveHeadline,

                                    lineHeight: headlineLine,

                                    letterSpacing: `${headlineTracking}em`,

                                    color: headlineColor,

                                    textWrap: "balance",

                                    overflowWrap: "normal",

                                    wordBreak: "normal",

                                    hyphens: "none",

                                    textShadow: "0 2px 22px rgba(0,0,0,.28)",
                                }}
                            >
                                {headline}
                            </div>

                            {body && (
                                <div
                                    style={{
                                        ...bodyFont,

                                        maxWidth:
                                            contentAlignment === "center"
                                                ? 620
                                                : 560,

                                        marginTop: mobile ? 14 : 20,

                                        marginLeft:
                                            contentAlignment === "center"
                                                ? "auto"
                                                : contentAlignment === "right"
                                                  ? "auto"
                                                  : 0,

                                        fontSize: mobile
                                            ? Math.min(bodySize, 15)
                                            : bodySize,

                                        lineHeight: bodyLine,

                                        color: bodyColor,

                                        opacity: 0.88,

                                        textShadow:
                                            "0 1px 16px rgba(0,0,0,.32)",
                                    }}
                                >
                                    {body}
                                </div>
                            )}

                            {buttonLabel && buttonLink && (
                                <button
                                    onClick={() => navigate(buttonLink)}
                                    style={{
                                        marginTop: mobile ? 18 : 24,

                                        padding: "13px 18px",

                                        border: 0,

                                        borderRadius: 999,

                                        background: buttonBackground,

                                        color: buttonColor,

                                        fontSize: 11,

                                        fontWeight: 600,

                                        letterSpacing: ".02em",

                                        cursor: "pointer",

                                        pointerEvents: "auto",

                                        boxShadow: "0 8px 30px rgba(0,0,0,.08)",

                                        transition: `transform 500ms ${EASE}`,
                                    }}
                                    onPointerEnter={(event) => {
                                        event.currentTarget.style.transform =
                                            "translateY(-2px) scale(1.02)"
                                    }}
                                    onPointerLeave={(event) => {
                                        event.currentTarget.style.transform =
                                            "translateY(0) scale(1)"
                                    }}
                                >
                                    {buttonLabel} ↗
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {showProgress && (
                    <div
                        style={{
                            position: "absolute",

                            zIndex: 20,

                            top: "50%",

                            [progressSide === "Left" ? "left" : "right"]: mobile
                                ? 12
                                : 24,

                            transform: "translateY(-50%)",

                            display: "flex",

                            flexDirection: "column",

                            alignItems: "center",

                            gap: 10,

                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",

                                width: 1,

                                height: mobile ? 100 : 160,

                                background: progressTrackColor,

                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",

                                    left: 0,
                                    right: 0,
                                    top: 0,

                                    height: `${progress * 100}%`,

                                    background: progressColor,

                                    transition: reducedMotion
                                        ? "none"
                                        : `height 240ms ${EASE}`,
                                }}
                            />
                        </div>

                        {showPercentage && (
                            <div
                                style={{
                                    ...eyebrowFont,

                                    fontSize: mobile ? 8 : 9,

                                    lineHeight: 1,

                                    color: progressColor,

                                    opacity: 0.72,

                                    writingMode: "vertical-rl",

                                    transform: "rotate(180deg)",
                                }}
                            >
                                {String(progressPercent).padStart(2, "0")}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export const defaultProps = {
    background: "#F5F3EE",

    mediaBackground: "#111111",

    eyebrow: "BODILUM / VISUAL EXPERIENCE",

    headline: "Ideas become clearer when the interface disappears.",

    body: "A scroll-driven media reveal designed to turn a single image into a cinematic transition.",

    buttonLabel: "Explore Project",

    buttonLink: "",

    maskShape: "Rounded",

    startMaskSize: 16,

    maskRadius: 52,

    revealStart: 0.4,

    revealEnd: 0.48,

    imageFit: "cover",

    imagePosition: "center center",

    startImageScale: 1.18,

    endImageScale: 1.02,

    startBlur: 8,

    endBlur: 0,

    startBrightness: 0.72,

    endBrightness: 1,

    scrollParallax: 38,

    pointerParallax: 10,

    overlayTop: 0.08,

    overlayBottom: 0.7,

    vignette: true,

    vignetteStrength: 0.38,

    contentPosition: "Left",

    contentAlign: "Left",

    contentWidth: 760,

    contentPadding: 56,

    eyebrowSize: 11,

    eyebrowColor: "#FFFFFF",

    headlineSize: 86,

    headlineLine: 0.9,

    headlineTracking: -0.055,

    headlineColor: "#FFFFFF",

    bodySize: 16,

    bodyLine: 1.45,

    bodyColor: "#FFFFFF",

    buttonBackground: "#FFFFFF",

    buttonColor: "#111111",

    textRevealStart: 0.5,

    textRevealEnd: 0.54,

    showProgress: true,

    progressSide: "Right",

    progressColor: "#FFFFFF",

    progressTrackColor: "rgba(255,255,255,.22)",

    showPercentage: true,

    mobileBreakpoint: 620,

    mobileMaskScale: 0.82,

    mobileHeadlineSize: 48,

    mobileParallax: 0.35,
}

ScrollDrivenImageMask.defaultProps = defaultProps

export const propertyControls = {
    image: {
        type: ControlType.Image,
        title: "Image",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F3EE",
    },

    mediaBackground: {
        type: ControlType.Color,
        title: "Media BG",
        defaultValue: "#111111",
    },

    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "BODILUM / VISUAL EXPERIENCE",
    },

    headline: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "Ideas become clearer when the interface disappears.",
        displayTextArea: true,
    },

    body: {
        type: ControlType.String,
        title: "Body",
        defaultValue:
            "A scroll-driven media reveal designed to turn a single image into a cinematic transition.",
        displayTextArea: true,
    },

    buttonLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Explore Project",
    },

    buttonLink: {
        type: ControlType.Link,
        title: "Button Link",
    },

    maskShape: {
        type: ControlType.Enum,
        title: "Mask",

        options: ["Rounded", "Circle", "Horizontal", "Vertical", "Diamond"],

        defaultValue: "Rounded",
    },

    startMaskSize: {
        type: ControlType.Number,
        title: "Start Size",
        defaultValue: 16,
        min: 4,
        max: 80,
        step: 1,
        unit: "%",
    },

    maskRadius: {
        type: ControlType.Number,
        title: "Start Radius",
        defaultValue: 52,
        min: 0,
        max: 200,
        unit: "px",

        hidden(props) {
            return props.maskShape === "Circle" || props.maskShape === "Diamond"
        },
    },

    revealStart: {
        type: ControlType.Number,
        title: "Reveal Start",
        defaultValue: 0.4,
        min: 0,
        max: 0.8,
        step: 0.01,
    },

    revealEnd: {
        type: ControlType.Number,
        title: "Reveal End",
        defaultValue: 0.48,
        min: 0.2,
        max: 1,
        step: 0.01,
    },

    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",

        options: ["cover", "contain"],

        defaultValue: "cover",
    },

    imagePosition: {
        type: ControlType.Enum,
        title: "Image Pos",

        options: [
            "center center",
            "center top",
            "center bottom",
            "left center",
            "right center",
        ],

        optionTitles: ["Center", "Top", "Bottom", "Left", "Right"],

        defaultValue: "center center",
    },

    startImageScale: {
        type: ControlType.Number,
        title: "Start Scale",
        defaultValue: 1.18,
        min: 1,
        max: 1.6,
        step: 0.01,
    },

    endImageScale: {
        type: ControlType.Number,
        title: "End Scale",
        defaultValue: 1.02,
        min: 0.9,
        max: 1.4,
        step: 0.01,
    },

    startBlur: {
        type: ControlType.Number,
        title: "Start Blur",
        defaultValue: 8,
        min: 0,
        max: 40,
        unit: "px",
    },

    endBlur: {
        type: ControlType.Number,
        title: "End Blur",
        defaultValue: 0,
        min: 0,
        max: 20,
        unit: "px",
    },

    startBrightness: {
        type: ControlType.Number,
        title: "Start Light",
        defaultValue: 0.72,
        min: 0.2,
        max: 1.5,
        step: 0.01,
    },

    endBrightness: {
        type: ControlType.Number,
        title: "End Light",
        defaultValue: 1,
        min: 0.2,
        max: 1.5,
        step: 0.01,
    },

    scrollParallax: {
        type: ControlType.Number,
        title: "Scroll Parallax",
        defaultValue: 38,
        min: 0,
        max: 160,
        unit: "px",
    },

    pointerParallax: {
        type: ControlType.Number,
        title: "Mouse Parallax",
        defaultValue: 10,
        min: 0,
        max: 50,
        unit: "px",
    },

    overlayTop: {
        type: ControlType.Number,
        title: "Top Overlay",
        defaultValue: 0.08,
        min: 0,
        max: 1,
        step: 0.01,
    },

    overlayBottom: {
        type: ControlType.Number,
        title: "Bottom Overlay",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.01,
    },

    vignette: {
        type: ControlType.Boolean,
        title: "Vignette",
        defaultValue: true,
    },

    vignetteStrength: {
        type: ControlType.Number,
        title: "Vignette Amt",
        defaultValue: 0.38,
        min: 0,
        max: 0.9,
        step: 0.01,

        hidden(props) {
            return !props.vignette
        },
    },

    contentPosition: {
        type: ControlType.Enum,
        title: "Content Pos",

        options: ["Left", "Center", "Right"],

        defaultValue: "Left",
    },

    contentAlign: {
        type: ControlType.Enum,
        title: "Text Align",

        options: ["Left", "Center", "Right"],

        defaultValue: "Left",
    },

    contentWidth: {
        type: ControlType.Number,
        title: "Content Width",
        defaultValue: 760,
        min: 280,
        max: 1200,
        unit: "px",
    },

    contentPadding: {
        type: ControlType.Number,
        title: "Content Pad",
        defaultValue: 56,
        min: 12,
        max: 140,
        unit: "px",
    },

    eyebrowFont: {
        type: ControlType.Font,
        title: "Eyebrow Font",
        controls: "extended",
    },

    eyebrowSize: {
        type: ControlType.Number,
        title: "Eyebrow Size",
        defaultValue: 11,
        min: 8,
        max: 24,
        unit: "px",
    },

    eyebrowColor: {
        type: ControlType.Color,
        title: "Eyebrow Color",
        defaultValue: "#FFFFFF",
    },

    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        controls: "extended",
    },

    headlineSize: {
        type: ControlType.Number,
        title: "Headline Size",
        defaultValue: 86,
        min: 30,
        max: 160,
        unit: "px",
    },

    headlineLine: {
        type: ControlType.Number,
        title: "Headline Line",
        defaultValue: 0.9,
        min: 0.7,
        max: 1.4,
        step: 0.01,
    },

    headlineTracking: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: -0.055,
        min: -0.15,
        max: 0.1,
        step: 0.005,
    },

    headlineColor: {
        type: ControlType.Color,
        title: "Headline",
        defaultValue: "#FFFFFF",
    },

    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
    },

    bodySize: {
        type: ControlType.Number,
        title: "Body Size",
        defaultValue: 16,
        min: 10,
        max: 30,
        unit: "px",
    },

    bodyLine: {
        type: ControlType.Number,
        title: "Body Line",
        defaultValue: 1.45,
        min: 1,
        max: 2,
        step: 0.02,
    },

    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "#FFFFFF",
    },

    buttonBackground: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: "#FFFFFF",
    },

    buttonColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#111111",
    },

    textRevealStart: {
        type: ControlType.Number,
        title: "Text Start",
        defaultValue: 0.5,
        min: 0,
        max: 0.96,
        step: 0.01,
    },

    textRevealEnd: {
        type: ControlType.Number,
        title: "Text End",
        defaultValue: 0.54,
        min: 0.05,
        max: 1,
        step: 0.01,
    },

    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
    },

    progressSide: {
        type: ControlType.Enum,
        title: "Progress Side",

        options: ["Left", "Right"],

        defaultValue: "Right",

        hidden(props) {
            return !props.showProgress
        },
    },

    progressColor: {
        type: ControlType.Color,
        title: "Progress",
        defaultValue: "#FFFFFF",

        hidden(props) {
            return !props.showProgress
        },
    },

    progressTrackColor: {
        type: ControlType.Color,
        title: "Progress Track",
        defaultValue: "rgba(255,255,255,.22)",

        hidden(props) {
            return !props.showProgress
        },
    },

    showPercentage: {
        type: ControlType.Boolean,
        title: "Percentage",
        defaultValue: true,

        hidden(props) {
            return !props.showProgress
        },
    },

    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile BP",
        defaultValue: 620,
        min: 320,
        max: 850,
        unit: "px",
    },

    mobileMaskScale: {
        type: ControlType.Number,
        title: "Mobile Reveal",
        defaultValue: 0.82,
        min: 0.5,
        max: 1,
        step: 0.01,
    },

    mobileHeadlineSize: {
        type: ControlType.Number,
        title: "Mobile Title",
        defaultValue: 48,
        min: 24,
        max: 80,
        unit: "px",
    },

    mobileParallax: {
        type: ControlType.Number,
        title: "Mobile Motion",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
    },
}

addPropertyControls(ScrollDrivenImageMask, propertyControls)
