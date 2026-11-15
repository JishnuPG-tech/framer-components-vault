import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, useInView } from "framer-motion"
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
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function CMSImageComparison(props) {
    const {
        firstImage,
        firstImageFit,
        firstImagePosition,
        firstImageAlt,

        secondImage,
        secondImageFit,
        secondImagePosition,
        secondImageAlt,

        orientation,
        enableHover,
        sliderColor,
        sliderWidth,
        returnToCenter,

        skewAngle,

        usePhysics,
        springStiffness,
        springDamping,

        useSoftEdge,
        featherAmount,

        useParallax,
        parallaxAmount,

        useAutoReveal,
        revealPosition,
        revealDuration,
        revealDelay,
        revealRepeat,

        style,
    } = props

    const containerRef = useRef(null)

    // Framer Marketplace fix: Provjera statičkog renderiranja
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const isStaticMode = isCanvas || isStatic

    const [position, setPosition] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [hasRevealed, setHasRevealed] = useState(false)
    const [imagesLoaded, setImagesLoaded] = useState(isStaticMode)

    const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })

    const isHorizontal = orientation === "horizontal"
    const isSkewActive = skewAngle !== 0

    const isInView = useInView(containerRef, {
        once: !revealRepeat,
        margin: "-50px",
    })

    // --- PRELOAD IMAGES LOGIC ---
    useEffect(() => {
        if (isStaticMode || typeof window === "undefined") {
            setImagesLoaded(true)
            return
        }

        let mounted = true
        setImagesLoaded(false)

        if (!firstImage || !secondImage) {
            setImagesLoaded(true)
            return
        }

        const img1 = new Image()
        const img2 = new Image()

        let loadedCount = 0
        const checkAllLoaded = () => {
            loadedCount++
            if (loadedCount >= 2 && mounted) {
                setImagesLoaded(true)
            }
        }

        img1.onload = checkAllLoaded
        img1.onerror = checkAllLoaded
        img2.onload = checkAllLoaded
        img2.onerror = checkAllLoaded

        img1.src = firstImage
        img2.src = secondImage

        if (img1.complete) checkAllLoaded()
        if (img2.complete) checkAllLoaded()

        return () => {
            mounted = false
        }
    }, [firstImage, secondImage, isStaticMode])

    // --- AUTO REVEAL LOGIC ---
    useEffect(() => {
        if (isStaticMode || typeof window === "undefined") return

        let mounted = true
        let delayTimer
        let durationTimer

        if (isInView && imagesLoaded) {
            if (useAutoReveal && !hasRevealed) {
                const sequence = async () => {
                    await new Promise((resolve) => {
                        delayTimer = setTimeout(resolve, revealDelay * 1000)
                    })
                    if (!mounted) return

                    setPosition(revealPosition)

                    await new Promise((resolve) => {
                        durationTimer = setTimeout(
                            resolve,
                            revealDuration * 1000
                        )
                    })
                    if (!mounted) return

                    setHasRevealed(true)
                    setPosition(50)
                }
                sequence()
            } else if (!useAutoReveal) {
                setHasRevealed(true)
            }
        } else if (revealRepeat && !isInView) {
            setHasRevealed(false)
            setPosition(50)
        }

        return () => {
            mounted = false
            clearTimeout(delayTimer)
            clearTimeout(durationTimer)
        }
    }, [
        isInView,
        imagesLoaded,
        useAutoReveal,
        revealPosition,
        revealDuration,
        revealDelay,
        revealRepeat,
        hasRevealed,
        isStaticMode,
    ])

    // --- MOUSE & POINTER LOGIC ---
    const handleMove = (clientX, clientY) => {
        if (!containerRef.current || (!imagesLoaded && !isStaticMode)) return
        if (!isInView && !isStaticMode) return
        if (useAutoReveal && !hasRevealed && !isStaticMode) return

        const rect = containerRef.current.getBoundingClientRect()
        let newPos
        let normX = (clientX - rect.left) / rect.width
        let normY = (clientY - rect.top) / rect.height

        if (isHorizontal) {
            newPos = normX * 100
        } else {
            newPos = normY * 100
        }

        setPosition(Math.max(0, Math.min(100, newPos)))

        if (useParallax && !isStaticMode) {
            setMouseOffset({
                x: (normX - 0.5) * 2,
                y: (normY - 0.5) * 2,
            })
        }
    }

    const onPointerEnter = () => {
        if (!isStaticMode && isInView) setIsHovered(true)
    }

    const onPointerDown = (e) => {
        if (!isInView && !isStaticMode) return
        if (e.cancelable) e.preventDefault()
        setIsHovered(true)
        setIsDragging(true)
        handleMove(e.clientX, e.clientY)
    }

    const onPointerMove = (e) => {
        if (!isInView && !isStaticMode) return
        if (!isHovered) setIsHovered(true)
        if (enableHover || isDragging) {
            handleMove(e.clientX, e.clientY)
        }
    }

    const onPointerUp = () => {
        setIsDragging(false)
        if (useParallax) setMouseOffset({ x: 0, y: 0 })
    }

    const onPointerLeave = () => {
        setIsHovered(false)
        setIsDragging(false)
        if (useParallax) setMouseOffset({ x: 0, y: 0 })
        if (returnToCenter) setPosition(50)
    }

    const isUserInteracting = isDragging || (enableHover && isHovered)

    const transitionConfig = isStaticMode
        ? { duration: 0 }
        : usePhysics
          ? {
                type: "spring",
                stiffness: springStiffness,
                damping: springDamping,
                mass: 1,
            }
          : isUserInteracting
            ? { duration: 0 }
            : { duration: 0.5, ease: "easeInOut" }

    const activeTransition =
        !isStaticMode && !hasRevealed && useAutoReveal
            ? { duration: revealDuration, ease: "easeInOut" }
            : transitionConfig

    const maskDirection = isHorizontal ? "to right" : "to bottom"

    const clipPosExpr = isSkewActive
        ? `((100% + var(--pos) * 1%) / 3)`
        : `(var(--pos) * 1%)`

    const foregroundMaskStyle = useSoftEdge
        ? {
              WebkitMaskImage: `linear-gradient(${maskDirection}, black calc(${clipPosExpr} - ${featherAmount / 2}px), transparent calc(${clipPosExpr} + ${featherAmount / 2}px))`,
              maskImage: `linear-gradient(${maskDirection}, black calc(${clipPosExpr} - ${featherAmount / 2}px), transparent calc(${clipPosExpr} + ${featherAmount / 2}px))`,
          }
        : {
              clipPath: isHorizontal
                  ? `inset(0 calc(100% - ${clipPosExpr}) 0 0)`
                  : `inset(0 0 calc(100% - ${clipPosExpr}) 0)`,
          }

    const isHoverActive =
        !isStaticMode && ((enableHover && mouseOffset.x !== 0) || isDragging)
    const scaleValue = useParallax && isHoverActive ? 1.02 : 1.0
    const xOffset =
        useParallax && isHoverActive ? mouseOffset.x * -parallaxAmount : 0
    const yOffset =
        useParallax && isHoverActive ? mouseOffset.y * -parallaxAmount : 0

    const imageBaseStyle = {
        position: "absolute",
        width:
            useParallax && !isStaticMode
                ? `calc(100% + ${parallaxAmount * 2}px)`
                : "100%",
        height:
            useParallax && !isStaticMode
                ? `calc(100% + ${parallaxAmount * 2}px)`
                : "100%",
        left: useParallax && !isStaticMode ? -parallaxAmount : 0,
        top: useParallax && !isStaticMode ? -parallaxAmount : 0,
        pointerEvents: "none",
        willChange: "transform",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitUserDrag: "none",
        WebkitTouchCallout: "none",
    }

    const skewWrapperStyle = isSkewActive
        ? isHorizontal
            ? {
                  position: "absolute",
                  top: 0,
                  height: "100%",
                  left: "-100%",
                  width: "300%",
                  transform: `skewX(${skewAngle}deg)`,
                  transformOrigin: "center center",
              }
            : {
                  position: "absolute",
                  left: 0,
                  width: "100%",
                  top: "-100%",
                  height: "300%",
                  transform: `skewY(${skewAngle}deg)`,
                  transformOrigin: "center center",
              }
        : {
              position: "absolute",
              inset: 0,
          }

    const unskewInnerStyle = isSkewActive
        ? isHorizontal
            ? {
                  position: "absolute",
                  top: 0,
                  height: "100%",
                  left: "33.333333%",
                  width: "33.333333%",
                  transform: `skewX(${-skewAngle}deg)`,
                  transformOrigin: "center center",
              }
            : {
                  position: "absolute",
                  left: 0,
                  width: "100%",
                  top: "33.333333%",
                  height: "33.333333%",
                  transform: `skewY(${-skewAngle}deg)`,
                  transformOrigin: "center center",
              }
        : {
              position: "absolute",
              inset: 0,
          }

    const defaultCursor = isHorizontal ? "ew-resize" : "ns-resize"

    const containerStyle = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitUserDrag: "none",
        ...style,
        cursor: style?.cursor || defaultCursor,
    }

    return (
        <motion.div
            ref={containerRef}
            style={containerStyle}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            initial={{ "--pos": 50, opacity: isStaticMode ? 1 : 0 }}
            animate={{
                "--pos": position,
                opacity: isStaticMode || imagesLoaded ? 1 : 0,
            }}
            transition={{
                opacity: { duration: isStaticMode ? 0 : 0.3 },
                "--pos": activeTransition,
            }}
            onPointerEnter={onPointerEnter}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
        >
            {/* BACKGROUND IMAGE (Second) */}
            <div
                style={{ position: "absolute", inset: 0, overflow: "hidden" }}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
            >
                <motion.img
                    src={secondImage}
                    alt={secondImageAlt}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    animate={{ scale: scaleValue, x: xOffset, y: yOffset }}
                    transition={transitionConfig}
                    style={{
                        ...imageBaseStyle,
                        objectFit: secondImageFit || "cover",
                        objectPosition: secondImagePosition || "center",
                    }}
                />
            </div>

            {/* FOREGROUND IMAGE (First) WITH SKEW SUPPORT */}
            <div
                style={{
                    ...skewWrapperStyle,
                    overflow: "hidden",
                    ...foregroundMaskStyle,
                }}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
            >
                <div
                    style={unskewInnerStyle}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                >
                    <motion.img
                        src={firstImage}
                        alt={firstImageAlt}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        animate={{ scale: scaleValue, x: xOffset, y: yOffset }}
                        transition={transitionConfig}
                        style={{
                            ...imageBaseStyle,
                            objectFit: firstImageFit || "cover",
                            objectPosition: firstImagePosition || "center",
                        }}
                    />
                </div>
            </div>

            {/* SLIDER LINE WITH SKEW SUPPORT */}
            <div
                style={{
                    position: "absolute",
                    backgroundColor: sliderColor,
                    pointerEvents: "none",
                    backdropFilter: "blur(4px)",
                    transformOrigin: "center center",
                    ...(isHorizontal
                        ? {
                              width: sliderWidth,
                              height: isSkewActive ? "300%" : "100%",
                              top: isSkewActive ? "-100%" : 0,
                              left: "calc(var(--pos) * 1%)",
                              transform: isSkewActive
                                  ? `translateX(-50%) skewX(${skewAngle}deg)`
                                  : "translateX(-50%)",
                          }
                        : {
                              height: sliderWidth,
                              width: isSkewActive ? "300%" : "100%",
                              left: isSkewActive ? "-100%" : 0,
                              top: "calc(var(--pos) * 1%)",
                              transform: isSkewActive
                                  ? `translateY(-50%) skewY(${skewAngle}deg)`
                                  : "translateY(-50%)",
                          }),
                }}
            />
        </motion.div>
    )
}

// DEFAULT PROPS
CMSImageComparison.defaultProps = {
    firstImage: "https://unsplash.com/photos/JQjvDIbBXx4/download?w=1200&q=80",
    firstImageFit: "cover",
    firstImagePosition: "center",
    firstImageAlt: "Pink and white flower on red background",
    secondImage: "https://unsplash.com/photos/UmBh2C0n3eo/download?w=1200&q=80",
    secondImageFit: "cover",
    secondImagePosition: "center",
    secondImageAlt:
        "Bright orange flower with dark center on vibrant yellow background",
    orientation: "horizontal",
    enableHover: true,
    sliderColor: "rgba(255, 255, 255, 1)",
    sliderWidth: 2,
    returnToCenter: true,
    skewAngle: 0,
    usePhysics: false,
    springStiffness: 400,
    springDamping: 30,
    useSoftEdge: false,
    featherAmount: 100,
    useParallax: false,
    parallaxAmount: 15,
    useAutoReveal: false,
    revealPosition: 20,
    revealDuration: 0.8,
    revealDelay: 0.2,
    revealRepeat: false,
}

addPropertyControls(CMSImageComparison, {
    firstImage: { type: ControlType.Image, title: "Foreground Img" },
    firstImageFit: {
        type: ControlType.Enum,
        title: "↳ Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    firstImagePosition: {
        type: ControlType.Enum,
        title: "↳ Position",
        options: ["center", "top", "bottom", "left", "right"],
        optionTitles: ["Center", "Top", "Bottom", "Left", "Right"],
        defaultValue: "center",
    },
    firstImageAlt: {
        type: ControlType.String,
        title: "↳ Alt Text",
        defaultValue: "Pink and white flower on red background",
    },
    secondImage: { type: ControlType.Image, title: "Background Img" },
    secondImageFit: {
        type: ControlType.Enum,
        title: "↳ Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    secondImagePosition: {
        type: ControlType.Enum,
        title: "↳ Position",
        options: ["center", "top", "bottom", "left", "right"],
        optionTitles: ["Center", "Top", "Bottom", "Left", "Right"],
        defaultValue: "center",
    },
    secondImageAlt: {
        type: ControlType.String,
        title: "↳ Alt Text",
        defaultValue:
            "Bright orange flower with dark center on vibrant yellow background",
    },
    orientation: {
        type: ControlType.Enum,
        title: "Axis",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
    },
    enableHover: {
        type: ControlType.Boolean,
        title: "Enable Hover",
        defaultValue: true,
    },
    returnToCenter: {
        type: ControlType.Boolean,
        title: "Snap Center",
        defaultValue: true,
    },
    skewAngle: {
        type: ControlType.Number,
        title: "📐 Skew (°)",
        defaultValue: 0,
        min: -45,
        max: 45,
        displayStepper: true,
    },
    usePhysics: {
        type: ControlType.Boolean,
        title: "🧲 Spring Physics",
        defaultValue: false,
    },
    springStiffness: {
        type: ControlType.Number,
        title: "↳ Speed",
        defaultValue: 400,
        min: 50,
        max: 1000,
        hidden: (p) => !p.usePhysics,
    },
    springDamping: {
        type: ControlType.Number,
        title: "↳ Smoothness",
        defaultValue: 30,
        min: 5,
        max: 100,
        hidden: (p) => !p.usePhysics,
    },
    useSoftEdge: {
        type: ControlType.Boolean,
        title: "🌫️ Soft Edge",
        defaultValue: false,
    },
    featherAmount: {
        type: ControlType.Number,
        title: "↳ Feather Width",
        defaultValue: 100,
        min: 10,
        max: 300,
        displayStepper: true,
        hidden: (p) => !p.useSoftEdge,
    },
    useParallax: {
        type: ControlType.Boolean,
        title: "🌌 3D Parallax",
        defaultValue: false,
    },
    parallaxAmount: {
        type: ControlType.Number,
        title: "↳ Depth",
        defaultValue: 15,
        min: 5,
        max: 50,
        displayStepper: true,
        hidden: (p) => !p.useParallax,
    },
    useAutoReveal: {
        type: ControlType.Boolean,
        title: "✨ Auto-Reveal",
        defaultValue: false,
    },
    revealPosition: {
        type: ControlType.Number,
        title: "↳ Peek To (%)",
        defaultValue: 20,
        min: 5,
        max: 95,
        hidden: (p) => !p.useAutoReveal,
    },
    revealDuration: {
        type: ControlType.Number,
        title: "↳ Speed (s)",
        defaultValue: 0.8,
        min: 0.2,
        max: 3.0,
        step: 0.1,
        displayStepper: true,
        hidden: (p) => !p.useAutoReveal,
    },
    revealDelay: {
        type: ControlType.Number,
        title: "↳ Delay (s)",
        defaultValue: 0.2,
        min: 0,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
        hidden: (p) => !p.useAutoReveal,
    },
    revealRepeat: {
        type: ControlType.Boolean,
        title: "↳ Repeat",
        defaultValue: false,
        hidden: (p) => !p.useAutoReveal,
    },
    sliderColor: {
        type: ControlType.Color,
        title: "Slider Color",
        defaultValue: "rgba(255, 255, 255, 1)",
    },
    sliderWidth: {
        type: ControlType.Number,
        title: "Slider Width",
        defaultValue: 2,
        min: 0,
        max: 24,
        displayStepper: true,
        description:
            "Crafted with 🖤 by Igor.\n\nGrab more [Framer components](https://www.framer.com/%40igor-reif/), and if this freebie saved you some time, feel free to [Buy me a beer](https://revolut.me/ireif). Cheers!🍻",
    },
})
