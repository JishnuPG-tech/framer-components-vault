// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef } from "react"

type Props = {
    // Налаштування фону всієї секції
    bgType: "color" | "image"
    bgColor: string
    bgImageUrl: string

    // Налаштування центрального медіа
    mediaType: "video" | "image" | "color"
    videoUrl: string
    imageUrl: string
    solidColor: string

    // Бегущая строка
    tickerText: string
    speed: number
    gap: number

    // Розміри та скролл
    minWidthPercent: number
    minHeightPercent: number
    borderRadius: number
    scrollDistanceVh: number
}

export default function StickyMediaMultiStep(props: Props) {
    const {
        bgType,
        bgColor,
        bgImageUrl,
        mediaType,
        videoUrl,
        imageUrl,
        solidColor,
        tickerText,
        speed,
        gap,
        minWidthPercent,
        minHeightPercent,
        borderRadius,
        scrollDistanceVh,
    } = props

    const sectionRef = useRef<HTMLDivElement>(null)

    // Обов'язкова перевірка статичного рендерингу (Canvas / Export / Screenshots)
    const isStatic = useIsStaticRenderer()

    // Відстеження скроллу
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    })

    // Розрахунок фаз ширини й висоти
    const midWidth1 = minWidthPercent + (100 - minWidthPercent) * 0.35
    const midWidth2 = minWidthPercent + (100 - minWidthPercent) * 0.65
    const midWidth3 = minWidthPercent + (100 - minWidthPercent) * 0.88

    const midHeight1 = minHeightPercent + (100 - minHeightPercent) * 0.35
    const midHeight2 = minHeightPercent + (100 - minHeightPercent) * 0.65
    const midHeight3 = minHeightPercent + (100 - minHeightPercent) * 0.88

    // Динамічні трансформації
    const mediaWidthTransform = useTransform(
        scrollYProgress,
        [0, 0.25, 0.5, 0.75, 1],
        [
            `${minWidthPercent}%`,
            `${midWidth1}%`,
            `${midWidth2}%`,
            `${midWidth3}%`,
            "100%",
        ]
    )

    const mediaHeightTransform = useTransform(
        scrollYProgress,
        [0, 0.25, 0.5, 0.75, 1],
        [
            `${minHeightPercent}%`,
            `${midHeight1}%`,
            `${midHeight2}%`,
            `${midHeight3}%`,
            "100%",
        ]
    )

    const currentRadiusTransform = useTransform(
        scrollYProgress,
        [0, 0.5, 0.85, 1],
        [
            `${borderRadius}px`,
            `${borderRadius * 0.6}px`,
            `${borderRadius * 0.2}px`,
            "0px",
        ]
    )

    // Якщо isStatic === true, використовуємо фіксовані статичні значення
    const mediaWidth = isStatic ? `${minWidthPercent}%` : mediaWidthTransform
    const mediaHeight = isStatic ? `${minHeightPercent}%` : mediaHeightTransform
    const currentRadius = isStatic
        ? `${borderRadius}px`
        : currentRadiusTransform

    // Рендер фону всієї секції
    const backgroundStyle: React.CSSProperties =
        bgType === "image" && bgImageUrl
            ? {
                  backgroundImage: `url(${bgImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
              }
            : {
                  backgroundColor: bgColor,
              }

    const renderMediaContent = () => {
        // У статичному режимі замість відео рендеримо заповнювач, щоб не завантажувати процесор на Canvas
        if (mediaType === "video") {
            if (isStatic) {
                return (
                    <div
                        style={{
                            ...mediaStyle,
                            backgroundColor: "#111827",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontSize: "14px",
                        }}
                    >
                        Video Preview
                    </div>
                )
            }
            return (
                <video
                    src={
                        videoUrl ||
                        "https://framerusercontent.com/assets/zEQ2uqOoz4IUC6n5QUkeURSWg.mp4"
                    }
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={mediaStyle}
                />
            )
        }

        if (mediaType === "image") {
            return (
                <img
                    src={
                        imageUrl ||
                        "https://framerusercontent.com/images/3mE4qR4Xg6v0rZ.jpg"
                    }
                    alt="Background"
                    style={mediaStyle}
                />
            )
        }

        return (
            <div
                style={{
                    ...mediaStyle,
                    backgroundColor: solidColor,
                }}
            />
        )
    }

    return (
        <div
            ref={sectionRef}
            style={{
                ...containerStyle,
                ...backgroundStyle,
                height: isStatic ? "100vh" : `${scrollDistanceVh}vh`,
            }}
        >
            <div style={{ ...stickyWrapStyle, ...backgroundStyle }}>
                <motion.div
                    style={{
                        ...mediaContainerStyle,
                        width: mediaWidth,
                        height: mediaHeight,
                        borderRadius: currentRadius,
                    }}
                >
                    {renderMediaContent()}
                </motion.div>

                {/* Бегущая строка */}
                <div style={tickerContainerStyle}>
                    <motion.div
                        style={{
                            ...tickerTrackStyle,
                            gap: `${gap}px`,
                        }}
                        animate={isStatic ? false : { x: ["0%", "-50%"] }}
                        transition={{
                            duration: speed,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                    >
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    ...tickerContentStyle,
                                    gap: `${gap}px`,
                                }}
                            >
                                <span style={textStyle}>{tickerText}</span>
                                <span style={dotStyle} />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(StickyMediaMultiStep, {
    // --- НАЛАШТУВАННЯ ФОНУ СЕКЦІЇ ---
    bgType: {
        type: ControlType.Enum,
        title: "Section BG",
        options: ["color", "image"],
        optionTitles: ["Color", "Image"],
        defaultValue: "color",
    },
    bgColor: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "#000000",
        hidden: (props) => props.bgType !== "color",
    },
    bgImageUrl: {
        type: ControlType.Image,
        title: "BG Image",
        hidden: (props) => props.bgType !== "image",
    },

    // --- НАЛАШТУВАННЯ ЦЕНТРАЛЬНОГО МЕДІА ---
    mediaType: {
        type: ControlType.Enum,
        title: "Media Type",
        options: ["video", "image", "color"],
        optionTitles: ["Video", "Image", "Solid Color"],
        defaultValue: "video",
    },
    videoUrl: {
        type: ControlType.File,
        title: "Video File",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: (props) => props.mediaType !== "video",
    },
    imageUrl: {
        type: ControlType.Image,
        title: "Media Image",
        hidden: (props) => props.mediaType !== "image",
    },
    solidColor: {
        type: ControlType.Color,
        title: "Media Color",
        defaultValue: "#111827",
        hidden: (props) => props.mediaType !== "color",
    },

    // --- ТЕКСТ ТА БІЖУЧИЙ РЯДОК ---
    tickerText: {
        type: ControlType.String,
        title: "Ticker Text",
        defaultValue:
            "DESIGN YOUR FUTURE • CREATE WITHOUT LIMITS • ELEVATE YOUR BRAND",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed (s)",
        defaultValue: 20,
        min: 5,
        max: 60,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap (px)",
        defaultValue: 30,
        min: 10,
        max: 100,
    },

    // --- РОЗМІРИ ТА СКРОЛЛ ---
    minWidthPercent: {
        type: ControlType.Number,
        title: "Start Width %",
        defaultValue: 35,
        min: 10,
        max: 80,
        unit: "%",
    },
    minHeightPercent: {
        type: ControlType.Number,
        title: "Start Height %",
        defaultValue: 45,
        min: 10,
        max: 80,
        unit: "%",
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 24,
        min: 0,
        max: 60,
        unit: "px",
    },
    scrollDistanceVh: {
        type: ControlType.Number,
        title: "Section Height",
        defaultValue: 200,
        min: 140,
        max: 400,
        unit: "vh",
        step: 10,
    },
})

const containerStyle: React.CSSProperties = {
    width: "100%",
    position: "relative",
}

const stickyWrapStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    width: "100%",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
}

const mediaContainerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    zIndex: 1,
    willChange: "width, height, border-radius",
}

const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
}

const tickerContainerStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    zIndex: 2,
    pointerEvents: "none",
    display: "flex",
    overflow: "hidden",
}

const tickerTrackStyle: React.CSSProperties = {
    display: "flex",
    whiteSpace: "nowrap",
    willChange: "transform",
}

const tickerContentStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
}

const textStyle: React.CSSProperties = {
    fontSize: "clamp(32px, 5vw, 64px)",
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
}

const dotStyle: React.CSSProperties = {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    flexShrink: 0,
}
