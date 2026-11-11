import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
}

type SliderProps = {
    images: ResponsiveImage[]
    startSlide: number
    showBackground: boolean
    background: string
    gap: number
    bottom: number
    radius: number
    activeWidth: number
    activeHeight: number
    nearWidth: number
    nearHeight: number
    farWidth: number
    farHeight: number
    sideWidth: number
    sideHeight: number
    lift: number
    ghostOpacity: number
    swipeEnabled: boolean
    swipeSensitivity: number
    swipeCooldown: number
    lightboxEnabled: boolean
    lightboxWidth: number
    lightboxHeight: number
    lightboxBackdropBlur: number
    lightboxBackdropOpacity: number
    lightboxRadius: number
    transition: any
    style?: React.CSSProperties
}

const defaultImages: ResponsiveImage[] = [
    { src: "./assets/superpower.svg", alt: "Superpower" },
    { src: "./assets/girlfriends.svg", alt: "Girlfriends" },
    { src: "./assets/character-ai.svg", alt: "Character AI" },
    { src: "./assets/bastion-bees.svg", alt: "Bastion Bees" },
    { src: "./assets/eliza-dolittle.svg", alt: "Eliza Dolittle" },
    { src: "./assets/waverly.svg", alt: "Waverly" },
    { src: "./assets/timmons.svg", alt: "Timmons" },
    { src: "./assets/poga.svg", alt: "POGA" },
]

function wrapIndex(index: number, total: number) {
    return ((index % total) + total) % total
}

function getStartIndex(startSlide: number, total: number) {
    return Math.max(0, Math.min(Math.round(startSlide || 1) - 1, total - 1))
}

function getSize(index: number, activeIndex: number, props: SliderProps) {
    const distance = Math.abs(index - activeIndex)

    if (distance === 0) {
        return {
            width: props.activeWidth,
            height: props.activeHeight,
            y: -props.lift,
            opacity: 1,
        }
    }

    if (distance === 1) {
        return {
            width: props.nearWidth,
            height: props.nearHeight,
            y: 0,
            opacity: 1,
        }
    }

    if (distance === 2) {
        return {
            width: props.farWidth,
            height: props.farHeight,
            y: 0,
            opacity: 1,
        }
    }

    return {
        width: props.sideWidth,
        height: props.sideHeight,
        y: 0,
        opacity: props.ghostOpacity,
    }
}

function getTrackX(
    slideCount: number,
    activeIndex: number,
    props: SliderProps
) {
    const center = Array.from({ length: slideCount }).reduce(
        (sum, _image, index) => {
            if (index >= activeIndex) return sum
            return sum + getSize(index, activeIndex, props).width + props.gap
        },
        0 as number
    )

    return -(center + getSize(activeIndex, activeIndex, props).width / 2)
}

function getLoopImages(images: ResponsiveImage[]) {
    if (images.length <= 1) {
        return images.map((image, index) => ({
            image,
            originalIndex: index,
            cycle: 0,
        }))
    }

    return [-1, 0, 1].flatMap((cycle) =>
        images.map((image, originalIndex) => ({ image, originalIndex, cycle }))
    )
}

function getValidImages(images?: ResponsiveImage[]) {
    const validImages = images?.filter((image) => Boolean(image?.src)) || []
    return validImages.length ? validImages : defaultImages
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function OverStimulatedSlider(props: SliderProps) {
    const isStaticRenderer = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const [isInViewport, setIsInViewport] = React.useState(false)
    const images = React.useMemo(
        () => getValidImages(props.images),
        [props.images]
    )
    const loopImages = React.useMemo(() => getLoopImages(images), [images])
    const [activeIndex, setActiveIndex] = React.useState(() =>
        getStartIndex(props.startSlide, images.length)
    )
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(
        null
    )
    const activeRenderIndex =
        images.length > 1 ? images.length + activeIndex : activeIndex
    const wheelAmount = React.useRef(0)
    const lastSwipeTime = React.useRef(0)

    React.useEffect(() => {
        setActiveIndex(getStartIndex(props.startSlide, images.length))
    }, [images.length, props.startSlide])

    React.useEffect(() => {
        if (isStaticRenderer) {
            setIsInViewport(false)
            return
        }

        const element = containerRef.current
        if (!element || typeof IntersectionObserver === "undefined") {
            setIsInViewport(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => setIsInViewport(entry.isIntersecting),
            { threshold: 0.01 }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [isStaticRenderer])

    const shouldAnimate = !isStaticRenderer && isInViewport

    React.useEffect(() => {
        if (!shouldAnimate) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setLightboxIndex(null)
            }

            if (event.key === "ArrowLeft") {
                setActiveIndex((current) =>
                    wrapIndex(current - 1, images.length)
                )
            }

            if (event.key === "ArrowRight") {
                setActiveIndex((current) =>
                    wrapIndex(current + 1, images.length)
                )
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [images.length, shouldAnimate])

    const moveBy = React.useCallback(
        (amount: number) => {
            setActiveIndex((current) =>
                wrapIndex(current + amount, images.length)
            )
        },
        [images.length]
    )

    const handleWheel = React.useCallback(
        (event: React.WheelEvent<HTMLDivElement>) => {
            if (!props.swipeEnabled || images.length < 2) return

            const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)
            const swipeDelta = horizontal ? event.deltaX : event.deltaY

            if (Math.abs(swipeDelta) < 1) return

            event.preventDefault()
            wheelAmount.current += swipeDelta

            const now = Date.now()
            const canSwipe = now - lastSwipeTime.current > props.swipeCooldown

            if (
                Math.abs(wheelAmount.current) >= props.swipeSensitivity &&
                canSwipe
            ) {
                moveBy(wheelAmount.current > 0 ? 1 : -1)
                wheelAmount.current = 0
                lastSwipeTime.current = now
            }
        },
        [
            images.length,
            moveBy,
            props.swipeCooldown,
            props.swipeEnabled,
            props.swipeSensitivity,
        ]
    )

    const trackX = getTrackX(loopImages.length, activeRenderIndex, props)
    const lightboxImage =
        lightboxIndex === null
            ? null
            : images[wrapIndex(lightboxIndex, images.length)]
    const trackStyle: React.CSSProperties = {
        position: "absolute",
        left: "50%",
        bottom: props.bottom,
        display: "flex",
        alignItems: "flex-end",
        gap: props.gap,
        paddingTop: 38,
        willChange: shouldAnimate ? "transform" : "auto",
    }

    return (
        <div
            ref={containerRef}
            onWheel={shouldAnimate ? handleWheel : undefined}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 320,
                overflow: "hidden",
                background: props.showBackground
                    ? props.background
                    : "transparent",
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
            }}
        >
            <button
                aria-label="Previous slide"
                onClick={() => moveBy(-1)}
                style={edgeStyle("left")}
            />
            {!shouldAnimate ? (
                <div
                    style={{
                        ...trackStyle,
                        transform: `translateX(${trackX}px)`,
                    }}
                >
                    {loopImages.map(
                        ({ image, originalIndex, cycle }, index) => {
                            const state = getSize(
                                index,
                                activeRenderIndex,
                                props
                            )
                            const isRealSlide =
                                cycle === 0 || images.length <= 1

                            return (
                                <button
                                    key={`${cycle}-${image.src || "slide"}-${originalIndex}`}
                                    type="button"
                                    aria-label={`Open ${image.alt || `slide ${originalIndex + 1}`}`}
                                    aria-hidden={!isRealSlide}
                                    tabIndex={isRealSlide ? 0 : -1}
                                    onClick={() =>
                                        setActiveIndex(originalIndex)
                                    }
                                    style={{
                                        position: "relative",
                                        flex: "0 0 auto",
                                        width: state.width,
                                        height: state.height,
                                        opacity: state.opacity,
                                        border: 0,
                                        padding: 0,
                                        background: "transparent",
                                        cursor: "pointer",
                                        transform: `translateY(${state.y}px)`,
                                    }}
                                >
                                    <span
                                        style={{
                                            position: "relative",
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            overflow: "hidden",
                                            borderRadius: props.radius,
                                            background: "#dedada",
                                            boxShadow:
                                                "0 0 0 1px rgba(0,0,0,.02), 0 16px 32px rgba(0,0,0,.06)",
                                        }}
                                    >
                                        <img
                                            src={image.src}
                                            srcSet={image.srcSet}
                                            alt={image.alt || ""}
                                            loading="eager"
                                            decoding="sync"
                                            draggable={false}
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </span>
                                </button>
                            )
                        }
                    )}
                </div>
            ) : (
                <motion.div
                    initial={{ x: trackX }}
                    animate={{ x: trackX }}
                    transition={props.transition}
                    style={trackStyle}
                >
                    {loopImages.map(
                        ({ image, originalIndex, cycle }, index) => {
                            const state = getSize(
                                index,
                                activeRenderIndex,
                                props
                            )
                            const isRealSlide =
                                cycle === 0 || images.length <= 1

                            return (
                                <motion.button
                                    key={`${cycle}-${image.src || "slide"}-${originalIndex}`}
                                    type="button"
                                    aria-label={`Open ${image.alt || `slide ${originalIndex + 1}`}`}
                                    aria-hidden={!isRealSlide}
                                    tabIndex={isRealSlide ? 0 : -1}
                                    onClick={() => {
                                        setActiveIndex(originalIndex)
                                        if (props.lightboxEnabled) {
                                            setLightboxIndex(originalIndex)
                                        }
                                    }}
                                    initial={state}
                                    animate={state}
                                    transition={props.transition}
                                    style={{
                                        position: "relative",
                                        flex: "0 0 auto",
                                        width: state.width,
                                        height: state.height,
                                        opacity: state.opacity,
                                        border: 0,
                                        padding: 0,
                                        background: "transparent",
                                        cursor: "pointer",
                                        y: state.y,
                                    }}
                                >
                                    <span
                                        style={{
                                            position: "relative",
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            overflow: "hidden",
                                            borderRadius: props.radius,
                                            background: "#dedada",
                                            boxShadow:
                                                "0 0 0 1px rgba(0,0,0,.02), 0 16px 32px rgba(0,0,0,.06)",
                                        }}
                                    >
                                        <img
                                            src={image.src}
                                            srcSet={image.srcSet}
                                            alt={image.alt || ""}
                                            loading="eager"
                                            decoding="sync"
                                            draggable={false}
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </span>
                                </motion.button>
                            )
                        }
                    )}
                </motion.div>
            )}
            <button
                aria-label="Next slide"
                onClick={() => moveBy(1)}
                style={edgeStyle("right")}
            />
            {shouldAnimate && (
                <AnimatePresence>
                    {props.lightboxEnabled && lightboxImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.24, ease: "easeOut" }}
                            onClick={() => setLightboxIndex(null)}
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 24,
                                background: `rgba(0, 0, 0, ${props.lightboxBackdropOpacity})`,
                                backdropFilter: `blur(${props.lightboxBackdropBlur}px)`,
                                WebkitBackdropFilter: `blur(${props.lightboxBackdropBlur}px)`,
                                cursor: "zoom-out",
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.92, opacity: 0, y: 18 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.96, opacity: 0, y: 10 }}
                                transition={props.transition}
                                onClick={(event) => event.stopPropagation()}
                                style={{
                                    width: `min(${props.lightboxWidth}px, 92%)`,
                                    height: `min(${props.lightboxHeight}px, 88%)`,
                                    overflow: "hidden",
                                    borderRadius: props.lightboxRadius,
                                    background: "#111",
                                    boxShadow:
                                        "0 32px 90px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.12)",
                                    cursor: "default",
                                }}
                            >
                                <img
                                    src={lightboxImage.src}
                                    srcSet={lightboxImage.srcSet}
                                    alt={lightboxImage.alt || ""}
                                    draggable={false}
                                    loading="eager"
                                    decoding="sync"
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}

function edgeStyle(side: "left" | "right"): React.CSSProperties {
    return {
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        zIndex: 2,
        width: "18%",
        border: 0,
        padding: 0,
        background: "transparent",
        cursor: "pointer",
    }
}

OverStimulatedSlider.defaultProps = {
    width: 1440,
    height: 783,
    images: defaultImages,
    startSlide: 5,
    showBackground: true,
    background: "#000000",
    gap: 10,
    bottom: 22,
    radius: 8,
    activeWidth: 188,
    activeHeight: 254,
    nearWidth: 148,
    nearHeight: 205,
    farWidth: 118,
    farHeight: 172,
    sideWidth: 112,
    sideHeight: 164,
    lift: 5,
    ghostOpacity: 0.17,
    swipeEnabled: true,
    swipeSensitivity: 70,
    swipeCooldown: 520,
    lightboxEnabled: true,
    lightboxWidth: 640,
    lightboxHeight: 820,
    lightboxBackdropBlur: 8,
    lightboxBackdropOpacity: 0.38,
    lightboxRadius: 10,
    transition: { type: "tween", duration: 1.1, ease: [0.16, 1, 0.3, 1] },
}

addPropertyControls(OverStimulatedSlider, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 12,
    },
    startSlide: {
        type: ControlType.Number,
        title: "Start Slide",
        description:
            "The image number that should be centered when the component loads.",
        defaultValue: 5,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
    },
    transition: {
        type: ControlType.Transition,
        title: "Easing",
        description: "Controls the slider and lightbox animation feel.",
        defaultValue: { type: "tween", duration: 1.1, ease: [0.16, 1, 0.3, 1] },
    },
    showBackground: {
        type: ControlType.Boolean,
        title: "Background",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    background: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
        hidden: (props) => !props.showBackground,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 80,
        step: 1,
        displayStepper: true,
    },
    bottom: {
        type: ControlType.Number,
        title: "Bottom",
        defaultValue: 22,
        min: 0,
        max: 300,
        step: 1,
        displayStepper: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 48,
        step: 1,
        displayStepper: true,
    },
    activeWidth: {
        type: ControlType.Number,
        title: "Active Width",
        defaultValue: 188,
        min: 80,
        max: 600,
        step: 1,
    },
    activeHeight: {
        type: ControlType.Number,
        title: "Active Height",
        defaultValue: 254,
        min: 120,
        max: 800,
        step: 1,
    },
    nearWidth: {
        type: ControlType.Number,
        title: "Near Width",
        defaultValue: 148,
        min: 60,
        max: 500,
        step: 1,
    },
    nearHeight: {
        type: ControlType.Number,
        title: "Near Height",
        defaultValue: 205,
        min: 100,
        max: 700,
        step: 1,
    },
    farWidth: {
        type: ControlType.Number,
        title: "Far Width",
        defaultValue: 118,
        min: 50,
        max: 420,
        step: 1,
    },
    farHeight: {
        type: ControlType.Number,
        title: "Far Height",
        defaultValue: 172,
        min: 80,
        max: 640,
        step: 1,
    },
    sideWidth: {
        type: ControlType.Number,
        title: "Side Width",
        defaultValue: 112,
        min: 40,
        max: 400,
        step: 1,
    },
    sideHeight: {
        type: ControlType.Number,
        title: "Side Height",
        defaultValue: 164,
        min: 70,
        max: 600,
        step: 1,
    },
    lift: {
        type: ControlType.Number,
        title: "Lift",
        defaultValue: 5,
        min: 0,
        max: 80,
        step: 1,
    },
    ghostOpacity: {
        type: ControlType.Number,
        title: "Fade",
        defaultValue: 0.17,
        min: 0,
        max: 1,
        step: 0.01,
    },
    swipeEnabled: {
        type: ControlType.Boolean,
        title: "Swipe",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    swipeSensitivity: {
        type: ControlType.Number,
        title: "Swipe Amt",
        description:
            "Lower values react to smaller trackpad swipes. Higher values need a stronger swipe.",
        defaultValue: 70,
        min: 10,
        max: 240,
        step: 1,
        hidden: (props) => !props.swipeEnabled,
    },
    swipeCooldown: {
        type: ControlType.Number,
        title: "Cooldown",
        defaultValue: 520,
        min: 0,
        max: 1600,
        step: 10,
        hidden: (props) => !props.swipeEnabled,
    },
    lightboxEnabled: {
        type: ControlType.Boolean,
        title: "Lightbox",
        description:
            "Opens a clicked image in a larger focused view with a blurred backdrop.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    lightboxWidth: {
        type: ControlType.Number,
        title: "Box Width",
        defaultValue: 640,
        min: 180,
        max: 1600,
        step: 1,
        hidden: (props) => !props.lightboxEnabled,
    },
    lightboxHeight: {
        type: ControlType.Number,
        title: "Box Height",
        defaultValue: 820,
        min: 180,
        max: 1600,
        step: 1,
        hidden: (props) => !props.lightboxEnabled,
    },
    lightboxBackdropBlur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        hidden: (props) => !props.lightboxEnabled,
    },
    lightboxBackdropOpacity: {
        type: ControlType.Number,
        title: "Dim",
        defaultValue: 0.38,
        min: 0,
        max: 0.9,
        step: 0.01,
        hidden: (props) => !props.lightboxEnabled,
    },
    lightboxRadius: {
        type: ControlType.Number,
        title: "Box Radius",
        description:
            "created with <3\n[FrameSpace.](https://www.framespace.agency/)",
        defaultValue: 10,
        min: 0,
        max: 80,
        step: 1,
        hidden: (props) => !props.lightboxEnabled,
    },
})
