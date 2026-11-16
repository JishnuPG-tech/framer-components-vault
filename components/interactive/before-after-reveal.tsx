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
 * @framerIntrinsicHeight 720
 */

const EASE = "cubic-bezier(.11,1,.1,1)"

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function navigate(link?: string) {
    if (!link || typeof window === "undefined") return

    if (link.startsWith("#")) {
        window.document.querySelector(link)?.scrollIntoView({
            behavior: "smooth",
        })
        return
    }

    window.location.href = link
}

export default function InteractiveBeforeAfterReveal(props: any) {
    const isStaticRenderer = useIsStaticRenderer()
    const {
        beforeImage,
        afterImage,

        beforeLabel,
        afterLabel,

        orientation,
        interactionMode,

        initialPosition,
        clickToSet,
        resetOnDoubleClick,
        keyboardStep,

        animateEntrance,
        entrancePosition,
        entranceDelay,
        entranceDuration,

        background,
        radius,

        imageFit,
        beforePosition,
        afterPosition,

        beforeScale,
        afterScale,
        hoverScale,

        beforeBrightness,
        afterBrightness,

        inactiveDim,
        vignette,
        vignetteStrength,

        dividerColor,
        dividerWidth,
        dividerOpacity,

        handle,
        handleSize,
        handleBackground,
        handleColor,
        handleBorder,
        handleBorderWidth,
        handleShadow,
        handleShadowOpacity,

        showPercentage,
        percentageFont,
        percentageSize,

        showLabels,
        labelStyle,
        labelFont,
        labelSize,
        labelBackground,
        labelColor,
        labelBlur,

        showContent,
        eyebrow,
        headline,
        body,

        contentPosition,
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

        showCTA,
        ctaLabel,
        ctaLink,
        ctaBackground,
        ctaColor,

        pointerParallax,

        mobileBreakpoint,
        mobileHeadlineSize,
        mobileContentPadding,
        mobileHideBody,
        mobileHandleScale,

        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement | null>(null)

    const beforeImageRef = React.useRef<HTMLImageElement | null>(null)
    const afterImageRef = React.useRef<HTMLImageElement | null>(null)

    const pointerIdRef = React.useRef<number | null>(null)
    const entranceTimerRef = React.useRef<number | null>(null)
    const pointerFrameRef = React.useRef<number | null>(null)
    const pendingPointerRef = React.useRef({ x: 0, y: 0 })

    const [componentWidth, setComponentWidth] = React.useState(1200)

    // Static renders must be deterministic and show the useful final state.
    const [position, setPosition] = React.useState(
        isStaticRenderer || !animateEntrance
            ? initialPosition
            : entrancePosition
    )

    const [dragging, setDragging] = React.useState(false)
    const [hovered, setHovered] = React.useState(false)
    const [entranceComplete, setEntranceComplete] = React.useState(
        isStaticRenderer || !animateEntrance
    )

    const [pointer, setPointer] = React.useState({
        x: 0,
        y: 0,
    })

    React.useLayoutEffect(() => {
        if (isStaticRenderer || typeof ResizeObserver === "undefined") return

        const root = rootRef.current
        if (!root) return

        const measure = () => {
            const rect = root.getBoundingClientRect()

            if (rect.width > 0) {
                setComponentWidth(rect.width)
            }
        }

        measure()

        const observer = new ResizeObserver(measure)
        observer.observe(root)

        return () => observer.disconnect()
    }, [isStaticRenderer])

    React.useEffect(() => {
        if (isStaticRenderer || !animateEntrance) {
            setEntranceComplete(true)
            setPosition(initialPosition)
            return
        }

        if (typeof IntersectionObserver === "undefined") {
            setEntranceComplete(true)
            setPosition(initialPosition)
            return
        }

        const root = rootRef.current
        if (!root) return

        setPosition(entrancePosition)
        setEntranceComplete(false)

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]

                if (!entry?.isIntersecting) return

                observer.disconnect()

                entranceTimerRef.current = window.setTimeout(() => {
                    setPosition(initialPosition)
                    setEntranceComplete(true)
                }, entranceDelay)
            },
            {
                threshold: 0.2,
            }
        )

        observer.observe(root)

        return () => {
            observer.disconnect()

            if (entranceTimerRef.current !== null) {
                window.clearTimeout(entranceTimerRef.current)
            }
        }
    }, [
        animateEntrance,
        entrancePosition,
        entranceDelay,
        initialPosition,
        isStaticRenderer,
    ])

    React.useEffect(() => {
        return () => {
            if (pointerFrameRef.current !== null) {
                window.cancelAnimationFrame(pointerFrameRef.current)
            }
        }
    }, [])

    React.useEffect(() => {
        if (dragging) return
        if (animateEntrance && !entranceComplete) return

        setPosition(initialPosition)
    }, [initialPosition])

    const mobile = componentWidth <= mobileBreakpoint

    const effectiveHandleSize = mobile
        ? handleSize * mobileHandleScale
        : handleSize

    const responsiveHeadlineSize = mobile
        ? Math.min(headlineSize, mobileHeadlineSize)
        : componentWidth <= 850
          ? Math.min(headlineSize, 60)
          : headlineSize

    const responsiveContentPadding = mobile
        ? Math.min(contentPadding, mobileContentPadding)
        : contentPadding

    const updatePositionFromPointer = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        const root = rootRef.current
        if (!root) return

        const rect = root.getBoundingClientRect()

        let next = 50

        if (orientation === "Horizontal") {
            next = ((event.clientX - rect.left) / rect.width) * 100
        } else {
            next = ((event.clientY - rect.top) / rect.height) * 100
        }

        setPosition(clamp(next, 0, 100))
    }

    const updateParallax = (event: React.PointerEvent<HTMLDivElement>) => {
        if (mobile || event.pointerType === "touch" || pointerParallax <= 0)
            return

        const root = rootRef.current
        if (!root) return

        const rect = root.getBoundingClientRect()

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

        pendingPointerRef.current = { x, y }

        // Coalesce high-frequency pointer events into one update per frame.
        if (pointerFrameRef.current === null) {
            pointerFrameRef.current = window.requestAnimationFrame(() => {
                pointerFrameRef.current = null
                setPointer(pendingPointerRef.current)
            })
        }
    }

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return
        if (event.button !== 0 && event.pointerType !== "touch") {
            return
        }

        pointerIdRef.current = event.pointerId

        event.currentTarget.setPointerCapture?.(event.pointerId)

        setDragging(true)
        setHovered(true)

        updatePositionFromPointer(event)
    }

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return
        updateParallax(event)

        if (interactionMode === "Follow" && !mobile) {
            updatePositionFromPointer(event)
            return
        }

        if (!dragging) return

        updatePositionFromPointer(event)
    }

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return
        if (
            pointerIdRef.current !== null &&
            event.currentTarget.hasPointerCapture?.(pointerIdRef.current)
        ) {
            event.currentTarget.releasePointerCapture?.(pointerIdRef.current)
        }

        pointerIdRef.current = null
        setDragging(false)
    }

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return
        if (!clickToSet) return
        if (interactionMode === "Follow") return

        const root = rootRef.current
        if (!root) return

        const rect = root.getBoundingClientRect()

        let next = 50

        if (orientation === "Horizontal") {
            next = ((event.clientX - rect.left) / rect.width) * 100
        } else {
            next = ((event.clientY - rect.top) / rect.height) * 100
        }

        setPosition(clamp(next, 0, 100))
    }

    const onDoubleClick = () => {
        if (isStaticRenderer) return
        if (!resetOnDoubleClick) return

        setPosition(initialPosition)
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return
        let next = position

        if (orientation === "Horizontal" && event.key === "ArrowLeft") {
            next -= keyboardStep
        }

        if (orientation === "Horizontal" && event.key === "ArrowRight") {
            next += keyboardStep
        }

        if (orientation === "Vertical" && event.key === "ArrowUp") {
            next -= keyboardStep
        }

        if (orientation === "Vertical" && event.key === "ArrowDown") {
            next += keyboardStep
        }

        if (event.key === "Home") {
            next = 0
        }

        if (event.key === "End") {
            next = 100
        }

        if (next !== position || event.key === "Home" || event.key === "End") {
            event.preventDefault()

            setPosition(clamp(next, 0, 100))
        }
    }

    const resetPointer = () => {
        if (isStaticRenderer) return
        setHovered(false)

        if (!dragging) {
            setPointer({
                x: 0,
                y: 0,
            })
        }
    }

    const beforeX = pointer.x * pointerParallax * -0.45

    const beforeY = pointer.y * pointerParallax * -0.3

    const afterX = pointer.x * pointerParallax * 0.45

    const afterY = pointer.y * pointerParallax * 0.3

    const beforeClip =
        orientation === "Horizontal"
            ? `inset(0 ${100 - position}% 0 0)`
            : `inset(0 0 ${100 - position}% 0)`

    const dividerPosition =
        orientation === "Horizontal"
            ? {
                  left: `${position}%`,
                  top: 0,
                  bottom: 0,
                  width: dividerWidth,
                  transform: "translateX(-50%)",
              }
            : {
                  top: `${position}%`,
                  left: 0,
                  right: 0,
                  height: dividerWidth,
                  transform: "translateY(-50%)",
              }

    const handlePosition =
        orientation === "Horizontal"
            ? {
                  left: `${position}%`,
                  top: "50%",
                  transform: "translate(-50%,-50%)",
              }
            : {
                  left: "50%",
                  top: `${position}%`,
                  transform: "translate(-50%,-50%)",
              }

    const labelOffset = mobile ? 14 : 20

    const beforeLabelPosition =
        orientation === "Horizontal"
            ? {
                  left: labelOffset,
                  top: labelOffset,
              }
            : {
                  left: labelOffset,
                  top: labelOffset,
              }

    const afterLabelPosition =
        orientation === "Horizontal"
            ? {
                  right: labelOffset,
                  top: labelOffset,
              }
            : {
                  left: labelOffset,
                  bottom: labelOffset,
              }

    const contentStyles: React.CSSProperties | undefined =
        contentPosition === "Top Left"
            ? {
                  left: responsiveContentPadding,
                  top: responsiveContentPadding,
              }
            : contentPosition === "Top Right"
              ? {
                    right: responsiveContentPadding,
                    top: responsiveContentPadding,
                    textAlign: "right",
                }
              : contentPosition === "Bottom Right"
                ? {
                      right: responsiveContentPadding,
                      bottom: responsiveContentPadding,
                      textAlign: "right",
                  }
                : {
                      left: responsiveContentPadding,
                      bottom: responsiveContentPadding,
                  }

    const positionTransition =
        isStaticRenderer || dragging || interactionMode === "Follow"
            ? "none"
            : `clip-path ${
                  entranceComplete ? 550 : entranceDuration
              }ms ${EASE}, left ${
                  entranceComplete ? 550 : entranceDuration
              }ms ${EASE}, top ${
                  entranceComplete ? 550 : entranceDuration
              }ms ${EASE}`

    return (
        <div
            ref={rootRef}
            role="slider"
            tabIndex={isStaticRenderer ? -1 : 0}
            aria-label={`${beforeLabel} and ${afterLabel} comparison`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            aria-orientation={
                orientation === "Horizontal" ? "horizontal" : "vertical"
            }
            onPointerDown={isStaticRenderer ? undefined : onPointerDown}
            onPointerMove={isStaticRenderer ? undefined : onPointerMove}
            onPointerUp={isStaticRenderer ? undefined : onPointerUp}
            onPointerCancel={isStaticRenderer ? undefined : onPointerUp}
            onPointerEnter={
                isStaticRenderer ? undefined : () => setHovered(true)
            }
            onPointerLeave={isStaticRenderer ? undefined : resetPointer}
            onClick={isStaticRenderer ? undefined : onClick}
            onDoubleClick={isStaticRenderer ? undefined : onDoubleClick}
            onKeyDown={isStaticRenderer ? undefined : onKeyDown}
            style={{
                ...style,

                position: "relative",

                width: "100%",
                height: "100%",

                overflow: "hidden",

                borderRadius: radius,

                background,

                isolation: "isolate",

                cursor: isStaticRenderer
                    ? "default"
                    : interactionMode === "Follow"
                      ? "crosshair"
                      : dragging
                        ? "grabbing"
                        : "grab",

                touchAction: orientation === "Horizontal" ? "pan-y" : "pan-x",

                outline: "none",

                userSelect: "none",

                WebkitUserSelect: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    overflow: "hidden",
                    background,
                }}
            >
                {afterImage ? (
                    <img
                        ref={afterImageRef}
                        src={afterImage}
                        alt={afterLabel}
                        draggable={false}
                        style={{
                            position: "absolute",

                            inset: "-4%",

                            width: "108%",
                            height: "108%",

                            objectFit: imageFit,
                            objectPosition: afterPosition,

                            transform: `
                                translate3d(
                                    ${afterX}px,
                                    ${afterY}px,
                                    0
                                )
                                scale(${
                                    afterScale * (hovered ? hoverScale : 1)
                                })
                            `,

                            filter: `
                                brightness(${afterBrightness})
                            `,

                            transition: isStaticRenderer
                                ? "none"
                                : `transform 800ms ${EASE}, filter 500ms ${EASE}`,

                            pointerEvents: "none",

                            willChange: isStaticRenderer
                                ? undefined
                                : "transform, filter",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,

                            display: "grid",
                            placeItems: "center",

                            background:
                                "linear-gradient(135deg,#D9D2FF,#6F5BDB)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "clamp(70px,13vw,180px)",

                                fontWeight: 600,

                                letterSpacing: "-.06em",

                                color: "#FFFFFF",

                                opacity: 0.2,
                            }}
                        >
                            AFTER
                        </div>
                    </div>
                )}
            </div>

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,

                    clipPath: beforeClip,
                    WebkitClipPath: beforeClip,

                    overflow: "hidden",

                    transition: positionTransition,

                    willChange: isStaticRenderer ? undefined : "clip-path",
                }}
            >
                {beforeImage ? (
                    <img
                        ref={beforeImageRef}
                        src={beforeImage}
                        alt={beforeLabel}
                        draggable={false}
                        style={{
                            position: "absolute",

                            inset: "-4%",

                            width: "108%",
                            height: "108%",

                            objectFit: imageFit,
                            objectPosition: beforePosition,

                            transform: `
                                translate3d(
                                    ${beforeX}px,
                                    ${beforeY}px,
                                    0
                                )
                                scale(${
                                    beforeScale * (hovered ? hoverScale : 1)
                                })
                            `,

                            filter: `
                                brightness(${beforeBrightness})
                            `,

                            transition: isStaticRenderer
                                ? "none"
                                : `transform 800ms ${EASE}, filter 500ms ${EASE}`,

                            pointerEvents: "none",

                            willChange: isStaticRenderer
                                ? undefined
                                : "transform, filter",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,

                            display: "grid",
                            placeItems: "center",

                            background:
                                "linear-gradient(135deg,#242424,#080808)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "clamp(70px,13vw,180px)",

                                fontWeight: 600,

                                letterSpacing: "-.06em",

                                color: "#FFFFFF",

                                opacity: 0.13,
                            }}
                        >
                            BEFORE
                        </div>
                    </div>
                )}
            </div>

            {inactiveDim > 0 && (
                <>
                    <div
                        style={{
                            position: "absolute",

                            inset: 0,

                            zIndex: 3,

                            pointerEvents: "none",

                            clipPath:
                                orientation === "Horizontal"
                                    ? `inset(0 0 0 ${position}%)`
                                    : `inset(${position}% 0 0 0)`,

                            background: `rgba(0,0,0,${
                                inactiveDim * (position < 50 ? 0.22 : 0.08)
                            })`,

                            transition: positionTransition,
                        }}
                    />

                    <div
                        style={{
                            position: "absolute",

                            inset: 0,

                            zIndex: 3,

                            pointerEvents: "none",

                            clipPath: beforeClip,

                            background: `rgba(0,0,0,${
                                inactiveDim * (position >= 50 ? 0.22 : 0.08)
                            })`,

                            transition: positionTransition,
                        }}
                    />
                </>
            )}

            {vignette && (
                <div
                    style={{
                        position: "absolute",

                        inset: 0,

                        zIndex: 4,

                        pointerEvents: "none",

                        background: `
                            radial-gradient(
                                ellipse at center,
                                transparent 46%,
                                rgba(0,0,0,${vignetteStrength}) 100%
                            )
                        `,
                    }}
                />
            )}

            {showContent && (
                <div
                    style={{
                        position: "absolute",

                        zIndex: 6,

                        width: `min(${contentWidth}px, calc(100% - ${
                            responsiveContentPadding * 2
                        }px))`,

                        color: headlineColor,

                        pointerEvents: "none",

                        ...contentStyles,
                    }}
                >
                    {eyebrow && (
                        <div
                            style={{
                                ...eyebrowFont,

                                marginBottom: mobile ? 8 : 11,

                                fontSize: eyebrowSize,

                                lineHeight: 1,

                                letterSpacing: ".06em",

                                textTransform: "uppercase",

                                color: eyebrowColor,

                                opacity: 0.88,

                                textShadow: "0 1px 14px rgba(0,0,0,.35)",
                            }}
                        >
                            {eyebrow}
                        </div>
                    )}

                    {headline && (
                        <div
                            style={{
                                ...headlineFont,

                                fontSize: responsiveHeadlineSize,

                                lineHeight: headlineLine,

                                letterSpacing: `${headlineTracking}em`,

                                color: headlineColor,

                                textWrap: "balance",

                                overflowWrap: "break-word",

                                textShadow: "0 2px 20px rgba(0,0,0,.36)",
                            }}
                        >
                            {headline}
                        </div>
                    )}

                    {body && !(mobile && mobileHideBody) && (
                        <div
                            style={{
                                ...bodyFont,

                                maxWidth: 560,

                                marginTop: mobile ? 11 : 16,

                                marginLeft: contentPosition.includes("Right")
                                    ? "auto"
                                    : undefined,

                                fontSize: mobile
                                    ? Math.min(bodySize, 14)
                                    : bodySize,

                                lineHeight: bodyLine,

                                color: bodyColor,

                                opacity: 0.88,

                                textShadow: "0 1px 14px rgba(0,0,0,.36)",
                            }}
                        >
                            {body}
                        </div>
                    )}

                    {showCTA && ctaLabel && ctaLink && (
                        <button
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                                event.stopPropagation()

                                navigate(ctaLink)
                            }}
                            style={{
                                marginTop: mobile ? 16 : 21,

                                border: 0,

                                borderRadius: 999,

                                padding: "12px 17px",

                                background: ctaBackground,

                                color: ctaColor,

                                fontSize: 11,

                                fontWeight: 600,

                                cursor: "pointer",

                                pointerEvents: "auto",

                                transition: isStaticRenderer
                                    ? "none"
                                    : `transform 500ms ${EASE}`,
                            }}
                            onPointerEnter={(event) => {
                                event.currentTarget.style.transform =
                                    "translateY(-2px)"
                            }}
                            onPointerLeave={(event) => {
                                event.currentTarget.style.transform =
                                    "translateY(0)"
                            }}
                        >
                            {ctaLabel} ↗
                        </button>
                    )}
                </div>
            )}

            {showLabels && (
                <>
                    <ComparisonLabel
                        text={beforeLabel}
                        style={beforeLabelPosition}
                        labelStyle={labelStyle}
                        font={labelFont}
                        fontSize={labelSize}
                        background={labelBackground}
                        color={labelColor}
                        blur={labelBlur}
                    />

                    <ComparisonLabel
                        text={afterLabel}
                        style={afterLabelPosition}
                        labelStyle={labelStyle}
                        font={labelFont}
                        fontSize={labelSize}
                        background={labelBackground}
                        color={labelColor}
                        blur={labelBlur}
                    />
                </>
            )}

            <div
                style={{
                    position: "absolute",

                    zIndex: 10,

                    pointerEvents: "none",

                    background: dividerColor,

                    opacity: dividerOpacity,

                    boxShadow: handleShadow
                        ? `0 0 18px rgba(255,255,255,.18)`
                        : "none",

                    transition: positionTransition,

                    ...dividerPosition,
                }}
            />

            {handle && (
                <div
                    style={{
                        position: "absolute",

                        zIndex: 11,

                        width: effectiveHandleSize,

                        height: effectiveHandleSize,

                        display: "grid",

                        placeItems: "center",

                        borderRadius: 999,

                        border: `${handleBorderWidth}px solid ${handleBorder}`,

                        background: handleBackground,

                        color: handleColor,

                        boxSizing: "border-box",

                        boxShadow: handleShadow
                            ? `0 12px 34px rgba(0,0,0,${handleShadowOpacity})`
                            : "none",

                        pointerEvents: "none",

                        transition: positionTransition,

                        backdropFilter: "blur(12px)",

                        WebkitBackdropFilter: "blur(12px)",

                        ...handlePosition,
                    }}
                >
                    <div
                        style={{
                            display: "flex",

                            flexDirection:
                                orientation === "Horizontal" ? "row" : "column",

                            alignItems: "center",

                            justifyContent: "center",

                            gap: mobile ? 1 : 2,

                            fontSize: effectiveHandleSize * 0.25,

                            lineHeight: 1,

                            fontWeight: 700,
                        }}
                    >
                        {orientation === "Horizontal" ? (
                            <>
                                <span>‹</span>
                                <span>›</span>
                            </>
                        ) : (
                            <>
                                <span>⌃</span>
                                <span>⌄</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {showPercentage && (
                <div
                    style={{
                        position: "absolute",

                        zIndex: 12,

                        pointerEvents: "none",

                        ...(orientation === "Horizontal"
                            ? {
                                  left: `${position}%`,
                                  top:
                                      "calc(50% + " +
                                      (effectiveHandleSize / 2 + 12) +
                                      "px)",
                                  transform: "translateX(-50%)",
                              }
                            : {
                                  left:
                                      "calc(50% + " +
                                      (effectiveHandleSize / 2 + 12) +
                                      "px)",
                                  top: `${position}%`,
                                  transform: "translateY(-50%)",
                              }),

                        ...percentageFont,

                        padding: "6px 8px",

                        borderRadius: 999,

                        background: "rgba(0,0,0,.34)",

                        backdropFilter: "blur(10px)",

                        WebkitBackdropFilter: "blur(10px)",

                        fontSize: percentageSize,

                        lineHeight: 1,

                        color: "#FFFFFF",

                        whiteSpace: "nowrap",

                        transition: positionTransition,
                    }}
                >
                    {Math.round(position)}%
                </div>
            )}
        </div>
    )
}

function ComparisonLabel({
    text,
    style,
    labelStyle,
    font,
    fontSize,
    background,
    color,
    blur,
}: any) {
    if (!text) return null

    return (
        <div
            style={{
                position: "absolute",

                zIndex: 8,

                pointerEvents: "none",

                ...style,
            }}
        >
            <div
                style={{
                    ...font,

                    padding: labelStyle === "Pill" ? "9px 12px" : 0,

                    borderRadius: 999,

                    background:
                        labelStyle === "Pill" ? background : "transparent",

                    backdropFilter:
                        labelStyle === "Pill" ? `blur(${blur}px)` : undefined,

                    WebkitBackdropFilter:
                        labelStyle === "Pill" ? `blur(${blur}px)` : undefined,

                    fontSize,

                    lineHeight: 1,

                    fontWeight: 600,

                    letterSpacing: ".04em",

                    textTransform: "uppercase",

                    color,

                    textShadow:
                        labelStyle === "Text"
                            ? "0 1px 12px rgba(0,0,0,.38)"
                            : "none",

                    whiteSpace: "nowrap",
                }}
            >
                {text}
            </div>
        </div>
    )
}

export const defaultProps = {
    beforeLabel: "Before",
    afterLabel: "After",

    orientation: "Horizontal",
    interactionMode: "Drag",

    initialPosition: 50,

    clickToSet: true,
    resetOnDoubleClick: true,

    keyboardStep: 2,

    animateEntrance: true,
    entrancePosition: 12,
    entranceDelay: 200,
    entranceDuration: 1000,

    background: "#111111",

    radius: 28,

    imageFit: "cover",

    beforePosition: "center center",
    afterPosition: "center center",

    beforeScale: 1.02,
    afterScale: 1.02,

    hoverScale: 1.015,

    beforeBrightness: 0.9,
    afterBrightness: 1,

    inactiveDim: 0.12,

    vignette: true,
    vignetteStrength: 0.3,

    dividerColor: "#FFFFFF",
    dividerWidth: 1,
    dividerOpacity: 0.9,

    handle: true,

    handleSize: 54,

    handleBackground: "rgba(255,255,255,.92)",

    handleColor: "#111111",

    handleBorder: "rgba(255,255,255,.5)",

    handleBorderWidth: 1,

    handleShadow: true,
    handleShadowOpacity: 0.14,

    showPercentage: false,

    percentageSize: 9,

    showLabels: true,

    labelStyle: "Pill",

    labelSize: 10,

    labelBackground: "rgba(15,15,15,.42)",

    labelColor: "#FFFFFF",

    labelBlur: 14,

    showContent: false,

    eyebrow: "TRANSFORMATION / 2026",

    headline: "From initial direction to final experience.",

    body: "Drag across the image to compare the two states.",

    contentPosition: "Bottom Left",

    contentWidth: 680,

    contentPadding: 34,

    eyebrowSize: 10,

    eyebrowColor: "#FFFFFF",

    headlineSize: 54,

    headlineLine: 0.94,

    headlineTracking: -0.045,

    headlineColor: "#FFFFFF",

    bodySize: 14,

    bodyLine: 1.45,

    bodyColor: "#FFFFFF",

    showCTA: false,

    ctaLabel: "View Project",

    ctaBackground: "#FFFFFF",

    ctaColor: "#111111",

    pointerParallax: 5,

    mobileBreakpoint: 620,

    mobileHeadlineSize: 36,

    mobileContentPadding: 20,

    mobileHideBody: true,

    mobileHandleScale: 0.82,
}

InteractiveBeforeAfterReveal.defaultProps = defaultProps

export const propertyControls = {
    beforeImage: {
        type: ControlType.Image,
        title: "Before Image",
    },

    afterImage: {
        type: ControlType.Image,
        title: "After Image",
    },

    beforeLabel: {
        type: ControlType.String,
        title: "Before Label",
        defaultValue: "Before",
    },

    afterLabel: {
        type: ControlType.String,
        title: "After Label",
        defaultValue: "After",
    },

    orientation: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["Horizontal", "Vertical"],
        defaultValue: "Horizontal",
    },

    interactionMode: {
        type: ControlType.Enum,
        title: "Interaction",
        options: ["Drag", "Follow"],
        defaultValue: "Drag",
    },

    initialPosition: {
        type: ControlType.Number,
        title: "Start Position",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },

    clickToSet: {
        type: ControlType.Boolean,
        title: "Click to Set",
        defaultValue: true,

        hidden(props) {
            return props.interactionMode === "Follow"
        },
    },

    resetOnDoubleClick: {
        type: ControlType.Boolean,
        title: "Double Reset",
        defaultValue: true,
    },

    keyboardStep: {
        type: ControlType.Number,
        title: "Keyboard Step",
        defaultValue: 2,
        min: 1,
        max: 20,
        step: 1,
        unit: "%",
    },

    animateEntrance: {
        type: ControlType.Boolean,
        title: "Entrance",
        defaultValue: true,
    },

    entrancePosition: {
        type: ControlType.Number,
        title: "Entrance From",
        defaultValue: 12,
        min: 0,
        max: 100,
        unit: "%",

        hidden(props) {
            return !props.animateEntrance
        },
    },

    entranceDelay: {
        type: ControlType.Number,
        title: "Entrance Delay",
        defaultValue: 200,
        min: 0,
        max: 2000,
        step: 50,
        unit: "ms",

        hidden(props) {
            return !props.animateEntrance
        },
    },

    entranceDuration: {
        type: ControlType.Number,
        title: "Entrance Speed",
        defaultValue: 1000,
        min: 250,
        max: 2500,
        step: 50,
        unit: "ms",

        hidden(props) {
            return !props.animateEntrance
        },
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 28,
        min: 0,
        max: 100,
        unit: "px",
    },

    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        defaultValue: "cover",
    },

    beforePosition: {
        type: ControlType.Enum,
        title: "Before Pos",

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

    afterPosition: {
        type: ControlType.Enum,
        title: "After Pos",

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

    beforeScale: {
        type: ControlType.Number,
        title: "Before Scale",
        defaultValue: 1.02,
        min: 0.9,
        max: 1.3,
        step: 0.005,
    },

    afterScale: {
        type: ControlType.Number,
        title: "After Scale",
        defaultValue: 1.02,
        min: 0.9,
        max: 1.3,
        step: 0.005,
    },

    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.015,
        min: 1,
        max: 1.15,
        step: 0.005,
    },

    beforeBrightness: {
        type: ControlType.Number,
        title: "Before Light",
        defaultValue: 0.9,
        min: 0.2,
        max: 1.5,
        step: 0.01,
    },

    afterBrightness: {
        type: ControlType.Number,
        title: "After Light",
        defaultValue: 1,
        min: 0.2,
        max: 1.5,
        step: 0.01,
    },

    inactiveDim: {
        type: ControlType.Number,
        title: "Inactive Dim",
        defaultValue: 0.12,
        min: 0,
        max: 0.8,
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
        defaultValue: 0.3,
        min: 0,
        max: 0.8,
        step: 0.01,

        hidden(props) {
            return !props.vignette
        },
    },

    dividerColor: {
        type: ControlType.Color,
        title: "Divider",
        defaultValue: "#FFFFFF",
    },

    dividerWidth: {
        type: ControlType.Number,
        title: "Divider Width",
        defaultValue: 1,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "px",
    },

    dividerOpacity: {
        type: ControlType.Number,
        title: "Divider Opacity",
        defaultValue: 0.9,
        min: 0,
        max: 1,
        step: 0.01,
    },

    handle: {
        type: ControlType.Boolean,
        title: "Handle",
        defaultValue: true,
    },

    handleSize: {
        type: ControlType.Number,
        title: "Handle Size",
        defaultValue: 54,
        min: 24,
        max: 120,
        unit: "px",

        hidden(props) {
            return !props.handle
        },
    },

    handleBackground: {
        type: ControlType.Color,
        title: "Handle BG",
        defaultValue: "rgba(255,255,255,.92)",

        hidden(props) {
            return !props.handle
        },
    },

    handleColor: {
        type: ControlType.Color,
        title: "Handle Icon",
        defaultValue: "#111111",

        hidden(props) {
            return !props.handle
        },
    },

    handleBorder: {
        type: ControlType.Color,
        title: "Handle Border",
        defaultValue: "rgba(255,255,255,.5)",

        hidden(props) {
            return !props.handle
        },
    },

    handleBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 6,
        unit: "px",

        hidden(props) {
            return !props.handle
        },
    },

    handleShadow: {
        type: ControlType.Boolean,
        title: "Handle Shadow",
        defaultValue: true,

        hidden(props) {
            return !props.handle
        },
    },

    handleShadowOpacity: {
        type: ControlType.Number,
        title: "Shadow Opacity",
        defaultValue: 0.14,
        min: 0,
        max: 1,
        step: 0.01,

        hidden(props) {
            return !props.handle || !props.handleShadow
        },
    },

    showPercentage: {
        type: ControlType.Boolean,
        title: "Percentage",
        defaultValue: false,
    },

    percentageFont: {
        type: ControlType.Font,
        title: "Percent Font",
        controls: "extended",

        hidden(props) {
            return !props.showPercentage
        },
    },

    percentageSize: {
        type: ControlType.Number,
        title: "Percent Size",
        defaultValue: 9,
        min: 7,
        max: 20,
        unit: "px",

        hidden(props) {
            return !props.showPercentage
        },
    },

    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: true,
    },

    labelStyle: {
        type: ControlType.Enum,
        title: "Label Style",
        options: ["Pill", "Text"],
        defaultValue: "Pill",

        hidden(props) {
            return !props.showLabels
        },
    },

    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",

        hidden(props) {
            return !props.showLabels
        },
    },

    labelSize: {
        type: ControlType.Number,
        title: "Label Size",
        defaultValue: 10,
        min: 8,
        max: 22,
        unit: "px",

        hidden(props) {
            return !props.showLabels
        },
    },

    labelBackground: {
        type: ControlType.Color,
        title: "Label BG",
        defaultValue: "rgba(15,15,15,.42)",

        hidden(props) {
            return !props.showLabels || props.labelStyle !== "Pill"
        },
    },

    labelColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "#FFFFFF",

        hidden(props) {
            return !props.showLabels
        },
    },

    labelBlur: {
        type: ControlType.Number,
        title: "Label Blur",
        defaultValue: 14,
        min: 0,
        max: 40,
        unit: "px",

        hidden(props) {
            return !props.showLabels || props.labelStyle !== "Pill"
        },
    },

    showContent: {
        type: ControlType.Boolean,
        title: "Content",
        defaultValue: false,
    },

    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "TRANSFORMATION / 2026",

        hidden(props) {
            return !props.showContent
        },
    },

    headline: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "From initial direction to final experience.",
        displayTextArea: true,

        hidden(props) {
            return !props.showContent
        },
    },

    body: {
        type: ControlType.String,
        title: "Body",
        defaultValue: "Drag across the image to compare the two states.",
        displayTextArea: true,

        hidden(props) {
            return !props.showContent
        },
    },

    contentPosition: {
        type: ControlType.Enum,
        title: "Content Pos",

        options: ["Top Left", "Top Right", "Bottom Left", "Bottom Right"],

        defaultValue: "Bottom Left",

        hidden(props) {
            return !props.showContent
        },
    },

    contentWidth: {
        type: ControlType.Number,
        title: "Content Width",
        defaultValue: 680,
        min: 240,
        max: 1000,
        unit: "px",

        hidden(props) {
            return !props.showContent
        },
    },

    contentPadding: {
        type: ControlType.Number,
        title: "Content Pad",
        defaultValue: 34,
        min: 12,
        max: 100,
        unit: "px",

        hidden(props) {
            return !props.showContent
        },
    },

    eyebrowFont: {
        type: ControlType.Font,
        title: "Eyebrow Font",
        controls: "extended",

        hidden(props) {
            return !props.showContent
        },
    },

    eyebrowSize: {
        type: ControlType.Number,
        title: "Eyebrow Size",
        defaultValue: 10,
        min: 8,
        max: 22,
        unit: "px",

        hidden(props) {
            return !props.showContent
        },
    },

    eyebrowColor: {
        type: ControlType.Color,
        title: "Eyebrow Color",
        defaultValue: "#FFFFFF",

        hidden(props) {
            return !props.showContent
        },
    },

    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        controls: "extended",

        hidden(props) {
            return !props.showContent
        },
    },

    headlineSize: {
        type: ControlType.Number,
        title: "Headline Size",
        defaultValue: 54,
        min: 22,
        max: 120,
        unit: "px",

        hidden(props) {
            return !props.showContent
        },
    },

    headlineLine: {
        type: ControlType.Number,
        title: "Headline Line",
        defaultValue: 0.94,
        min: 0.7,
        max: 1.5,
        step: 0.01,

        hidden(props) {
            return !props.showContent
        },
    },

    headlineTracking: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: -0.045,
        min: -0.15,
        max: 0.1,
        step: 0.005,

        hidden(props) {
            return !props.showContent
        },
    },

    headlineColor: {
        type: ControlType.Color,
        title: "Headline Color",
        defaultValue: "#FFFFFF",

        hidden(props) {
            return !props.showContent
        },
    },

    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",

        hidden(props) {
            return !props.showContent
        },
    },

    bodySize: {
        type: ControlType.Number,
        title: "Body Size",
        defaultValue: 14,
        min: 10,
        max: 28,
        unit: "px",

        hidden(props) {
            return !props.showContent
        },
    },

    bodyLine: {
        type: ControlType.Number,
        title: "Body Line",
        defaultValue: 1.45,
        min: 1,
        max: 2,
        step: 0.02,

        hidden(props) {
            return !props.showContent
        },
    },

    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "#FFFFFF",

        hidden(props) {
            return !props.showContent
        },
    },

    showCTA: {
        type: ControlType.Boolean,
        title: "CTA",
        defaultValue: false,

        hidden(props) {
            return !props.showContent
        },
    },

    ctaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "View Project",

        hidden(props) {
            return !props.showContent || !props.showCTA
        },
    },

    ctaLink: {
        type: ControlType.Link,
        title: "CTA Link",

        hidden(props) {
            return !props.showContent || !props.showCTA
        },
    },

    ctaBackground: {
        type: ControlType.Color,
        title: "CTA BG",
        defaultValue: "#FFFFFF",

        hidden(props) {
            return !props.showContent || !props.showCTA
        },
    },

    ctaColor: {
        type: ControlType.Color,
        title: "CTA Text",
        defaultValue: "#111111",

        hidden(props) {
            return !props.showContent || !props.showCTA
        },
    },

    pointerParallax: {
        type: ControlType.Number,
        title: "Image Motion",
        defaultValue: 5,
        min: 0,
        max: 30,
        unit: "px",
    },

    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile BP",
        defaultValue: 620,
        min: 320,
        max: 850,
        unit: "px",
    },

    mobileHeadlineSize: {
        type: ControlType.Number,
        title: "Mobile Title",
        defaultValue: 36,
        min: 20,
        max: 70,
        unit: "px",

        hidden(props) {
            return !props.showContent
        },
    },

    mobileContentPadding: {
        type: ControlType.Number,
        title: "Mobile Pad",
        defaultValue: 20,
        min: 10,
        max: 60,
        unit: "px",

        hidden(props) {
            return !props.showContent
        },
    },

    mobileHideBody: {
        type: ControlType.Boolean,
        title: "Hide Body Mobile",
        defaultValue: true,

        hidden(props) {
            return !props.showContent
        },
    },

    mobileHandleScale: {
        type: ControlType.Number,
        title: "Mobile Handle",
        defaultValue: 0.82,
        min: 0.5,
        max: 1.2,
        step: 0.01,

        hidden(props) {
            return !props.handle
        },
    },
}

addPropertyControls(InteractiveBeforeAfterReveal, propertyControls)
