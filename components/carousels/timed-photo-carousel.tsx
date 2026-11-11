import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
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


type ResponsiveImageType = {
    src?: string
    srcSet?: string
    alt?: string
}

type TimedPhotoCarouselProps = {
    images: ResponsiveImageType[]
    slideDuration: number
    showProgressBar: boolean
    progressBarThickness: number
    progressBackgroundColor: string
    progressFillColor: string
    progressColorMode: "basic" | "gradient"
    progressGradientColor1: string
    progressGradientColor2: string
    progressBarPosition: "top" | "bottom"
    progressBarPadding: string
    borderRadius: number
    style?: CSSProperties
}

/**
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TimedPhotoCarousel(props: TimedPhotoCarouselProps) {
    const {
        images,
        slideDuration,
        showProgressBar,
        progressBarThickness,
        progressBackgroundColor,
        progressFillColor,
        progressColorMode,
        progressGradientColor1,
        progressGradientColor2,
        progressBarPosition,
        progressBarPadding,
        borderRadius,
        style,
    } = props

    const safeImages: Required<ResponsiveImageType>[] = useMemo(() => {
        const fallbacks = [
            {
                src: "https://images.pexels.com/photos/31985998/pexels-photo-31985998.jpeg",
                alt: "image 1",
            },
            {
                src: "https://images.pexels.com/photos/18361404/pexels-photo-18361404.jpeg",
                alt: "image 2",
            },
            {
                src: "https://images.pexels.com/photos/17102628/pexels-photo-17102628.jpeg",
                alt: "image 3",
            },
        ]

        if (!images || images.length === 0) {
            return fallbacks.map((img) => ({ ...img, srcSet: "" }))
        }

        return images.map((img, index) => {
            const fallback = fallbacks[index % fallbacks.length]
            return {
                src: img?.src || fallback.src,
                srcSet: img?.srcSet || "",
                alt: img?.alt || fallback.alt,
            }
        })
    }, [images])

    const [currentIndex, setCurrentIndex] = useState(0)
    const [progress, setProgress] = useState(0)

    const totalSlides = safeImages.length
    const durationMs = Math.max(500, slideDuration * 1000)

    const goToNext = useCallback(() => {
        if (totalSlides <= 1) return
        startTransition(() => {
            setCurrentIndex((prev) => (prev + 1) % totalSlides)
            setProgress(0)
        })
    }, [totalSlides])

    useEffect(() => {
        if (totalSlides === 0) return
        if (typeof window === "undefined") return

        let startTime = performance.now()
        let animationFrameId: number

        const tick = (now: number) => {
            const elapsed = now - startTime
            const ratio = elapsed / durationMs

            if (ratio >= 1) {
                goToNext()
                startTime = performance.now()
                startTransition(() => setProgress(0))
            } else {
                startTransition(() => setProgress(ratio))
            }

            animationFrameId = window.requestAnimationFrame(tick)
        }

        animationFrameId = window.requestAnimationFrame(tick)

        return () => {
            if (typeof window !== "undefined" && animationFrameId) {
                window.cancelAnimationFrame(animationFrameId)
            }
        }
    }, [durationMs, goToNext, totalSlides])

    const containerStyle: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius,
            ...style,
        }),
        [borderRadius, style]
    )

    const progressContainerStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            left: 0,
            right: 0,
            bottom: progressBarPosition === "bottom" ? 0 : undefined,
            top: progressBarPosition === "top" ? 0 : undefined,
            height: "auto",
            padding: progressBarPadding,
            boxSizing: "border-box",
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "transparent",
            backdropFilter: "none",
            borderRadius: 999,
        }),
        [progressBackgroundColor, progressBarPadding, progressBarPosition]
    )

    const segmentBaseStyle: CSSProperties = useMemo(
        () => ({
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "auto",
            gap: 6,
        }),
        []
    )

    const segmentFillBaseStyle: CSSProperties = useMemo(
        () => ({
            height: "100%",
            transition: "none",
            borderRadius: 999,
        }),
        []
    )

    const gradientColors = useMemo(() => {
        if (progressColorMode !== "gradient") return [progressFillColor]

        const colors = [progressGradientColor1, progressGradientColor2].filter(
            Boolean
        )
        return colors.length > 0 ? colors : [progressFillColor]
    }, [
        progressColorMode,
        progressFillColor,
        progressGradientColor1,
        progressGradientColor2,
    ])

    const isGradient = useMemo(
        () => progressColorMode === "gradient" && gradientColors.length > 1,
        [progressColorMode, gradientColors]
    )

    const totalSegments = useMemo(
        () => Math.max(totalSlides - 1, 1),
        [totalSlides]
    )

    if (totalSlides === 0) {
        return (
            <div
                style={{
                    ...containerStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#EEEEEE",
                    color: "#999999",
                    fontSize: 14,
                }}
            >
                No images available
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            {safeImages.map((image, index) => {
                const isActive = index === currentIndex
                return (
                    <img
                        key={index}
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: isActive ? 1 : 0,
                            transition: "opacity 400ms ease-in-out",
                        }}
                    />
                )
            })}

            {showProgressBar && totalSlides > 0 && (
                <div style={progressContainerStyle}>
                    {safeImages.map((_, index) => {
                        let widthPercent = 0
                        if (index < currentIndex) {
                            widthPercent = 100
                        } else if (index === currentIndex) {
                            widthPercent = Math.min(
                                Math.max(progress * 100, 0),
                                100
                            )
                        } else {
                            widthPercent = 0
                        }

                        const dotSize = progressBarThickness
                        const barHeight = Math.max(1, progressBarThickness)

                        const colorForIndex =
                            gradientColors[index % gradientColors.length]

                        return (
                            <div
                                key={index}
                                style={{
                                    ...segmentBaseStyle,
                                }}
                            >
                                <div
                                    style={{
                                        width: dotSize,
                                        height: dotSize,
                                        borderRadius: "50%",
                                        marginLeft: -(
                                            progressBarThickness * 1.5
                                        ),
                                        background:
                                            index === currentIndex && isGradient
                                                ? `linear-gradient(135deg, ${gradientColors.join(", ")})`
                                                : index === currentIndex
                                                  ? colorForIndex
                                                  : "rgba(255,255,255,0.6)",
                                    }}
                                />
                                <div
                                    style={{
                                        flex: 1,
                                        height: barHeight,
                                        borderRadius: 999,
                                        backgroundColor:
                                            "rgba(255,255,255,0.35)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            ...segmentFillBaseStyle,
                                            ...(isGradient
                                                ? {
                                                      backgroundImage: `linear-gradient(90deg, ${gradientColors.join(", ")})`,
                                                      backgroundSize: `${totalSegments * 100}% 100%`,
                                                      backgroundPosition: `${(index / totalSegments) * 100}% 0%`,
                                                  }
                                                : {
                                                      backgroundColor:
                                                          colorForIndex,
                                                  }),
                                            width: `${widthPercent}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                    <div
                        style={{
                            ...segmentBaseStyle,
                            flex: "0 0 auto",
                            justifyContent: "flex-end",
                        }}
                    >
                        <div
                            style={{
                                width: progressBarThickness,
                                height: progressBarThickness,
                                borderRadius: "50%",
                                backgroundColor: "rgba(255,255,255,0.6)",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls<TimedPhotoCarouselProps>(TimedPhotoCarousel, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [{}, {}, {}],
    },
    slideDuration: {
        type: ControlType.Number,
        title: "Slide Duration (seconds)",
        defaultValue: 7,
        min: 1,
        max: 15,
        unit: "seconds",
        step: 0.5,
    },
    showProgressBar: {
        type: ControlType.Boolean,
        title: "Progress Bar",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    progressBarThickness: {
        type: ControlType.Number,
        title: "Bar Thickness",
        defaultValue: 3,
        min: 1,
        max: 3,
        unit: "pixels",
        step: 1,
        hidden: (props) => !props.showProgressBar,
    },
    progressColorMode: {
        type: ControlType.Enum,
        title: "Bar Color Mode",
        options: ["basic", "gradient"],
        optionTitles: ["Basic", "Gradient"],
        defaultValue: "basic",
        displaySegmentedControl: true,
        hidden: (props) => !props.showProgressBar,
    },
    progressFillColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#000000",
        hidden: (props) =>
            !props.showProgressBar || props.progressColorMode === "gradient",
    },
    progressGradientColor1: {
        type: ControlType.Color,
        title: "Gradient Color One",
        defaultValue: "#67DDF0",
        hidden: (props) =>
            !props.showProgressBar || props.progressColorMode === "basic",
    },
    progressGradientColor2: {
        type: ControlType.Color,
        title: "Gradient Color Two",
        defaultValue: "#770CC4",
        hidden: (props) =>
            !props.showProgressBar || props.progressColorMode === "basic",
    },
    progressBarPosition: {
        type: ControlType.Enum,
        title: "Bar Position",
        description:
            "Choose whether the progress bar appears at the top or bottom of the image",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
        hidden: (props) => !props.showProgressBar,
    },
    progressBarPadding: {
        type: ControlType.Padding,
        title: "Bar Padding",
        description:
            "Controls the width and horizontal position of the progress bar",
        defaultValue: "20px",
        hidden: (props) => !props.showProgressBar,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
    },
})
