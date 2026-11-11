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

import { motion } from "framer-motion"

type FitMode = "cover" | "contain"
type EasePreset = "linear" | "easeIn" | "easeOut" | "easeInOut" | "custom"

interface Props {
    images: string[]

    logoText: string
    logoImage?: string
    showLogoImage: boolean

    backgroundColor: string
    logoTileColor: string
    logoTextColor: string

    logoImageBgColor: string
    logoImageBgWidth: number
    logoImageBgHeight: number
    logoImageBgRadius: number

    startDelay: number
    introDuration: number
    introHold: number
    stepDuration: number
    overlap: number
    endHold: number
    outroDuration: number

    imageTileWidth: number

    logoTileWidth: number
    logoTileHeight: number

    logoImageWidth: number
    logoImageHeight: number

    borderRadius: number
    imageTileRadius: number
    logoTileRadius: number

    imageFit: FitMode
    logoFont: any

    easePreset: EasePreset
    bezier1: number
    bezier2: number
    bezier3: number
    bezier4: number

    logoEasePreset: EasePreset
    logoBezier1: number
    logoBezier2: number
    logoBezier3: number
    logoBezier4: number

    revealWord: string
    showRevealWord: boolean
    revealStartDelay: number
    revealLetterDuration: number
    revealLetterStagger: number
    revealLetterOffset: number
    revealBottomOffset: number
    revealTextColor: string
    revealFont: any
    revealPaddingLeft: number
    revealPaddingRight: number
    revealPaddingTop: number
}

type BoxPhase = "opening" | "open" | "closing" | "closed"

export default function CubeIntro(props: Props) {
    const {
        images,
        logoText,
        logoImage,
        showLogoImage,
        backgroundColor,
        logoTileColor,
        logoTextColor,
        logoImageBgColor,
        logoImageBgWidth,
        logoImageBgHeight,
        logoImageBgRadius,
        startDelay,
        introDuration,
        introHold,
        stepDuration,
        overlap,
        endHold,
        outroDuration,
        imageTileWidth,
        logoTileWidth,
        logoTileHeight,
        logoImageWidth,
        logoImageHeight,
        borderRadius,
        imageTileRadius,
        logoTileRadius,
        imageFit,
        logoFont,
        easePreset,
        bezier1,
        bezier2,
        bezier3,
        bezier4,
        logoEasePreset,
        logoBezier1,
        logoBezier2,
        logoBezier3,
        logoBezier4,
        revealWord,
        showRevealWord,
        revealStartDelay,
        revealLetterDuration,
        revealLetterStagger,
        revealLetterOffset,
        revealBottomOffset,
        revealTextColor,
        revealFont,
        revealPaddingLeft,
        revealPaddingRight,
        revealPaddingTop,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const safeImages = React.useMemo(
        () => (images || []).filter(Boolean),
        [images]
    )

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const timers = React.useRef<number[]>([])

    const [containerSize, setContainerSize] = React.useState({
        width: 0,
        height: 0,
    })
    const [startedCount, setStartedCount] = React.useState(
        isCanvas ? Math.min(1, safeImages.length) : 0
    )
    const [boxPhase, setBoxPhase] = React.useState<BoxPhase>(
        isCanvas ? "open" : "opening"
    )
    const [showBottomWord, setShowBottomWord] = React.useState(isCanvas)

    const imageTileHeight = React.useMemo(
        () => imageTileWidth * (9 / 16),
        [imageTileWidth]
    )

    const clearTimers = React.useCallback(() => {
        timers.current.forEach((id) => window.clearTimeout(id))
        timers.current = []
    }, [])

    React.useLayoutEffect(() => {
        const updateSize = () => {
            const el = containerRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            setContainerSize({
                width: rect.width,
                height: rect.height,
            })
        }

        updateSize()

        const observer = new ResizeObserver(updateSize)
        if (containerRef.current) observer.observe(containerRef.current)
        window.addEventListener("resize", updateSize)

        return () => {
            observer.disconnect()
            window.removeEventListener("resize", updateSize)
        }
    }, [])

    const imageEaseValue = React.useMemo(() => {
        switch (easePreset) {
            case "linear":
                return "linear"
            case "easeIn":
                return [0.42, 0, 1, 1]
            case "easeOut":
                return [0, 0, 0.58, 1]
            case "easeInOut":
                return [0.42, 0, 0.58, 1]
            case "custom":
                return [bezier1, bezier2, bezier3, bezier4]
            default:
                return [0.22, 1, 0.36, 1]
        }
    }, [easePreset, bezier1, bezier2, bezier3, bezier4])

    const logoEaseValue = React.useMemo(() => {
        switch (logoEasePreset) {
            case "linear":
                return "linear"
            case "easeIn":
                return [0.42, 0, 1, 1]
            case "easeOut":
                return [0, 0, 0.58, 1]
            case "easeInOut":
                return [0.42, 0, 0.58, 1]
            case "custom":
                return [logoBezier1, logoBezier2, logoBezier3, logoBezier4]
            default:
                return [0.22, 1, 0.36, 1]
        }
    }, [logoEasePreset, logoBezier1, logoBezier2, logoBezier3, logoBezier4])

    React.useEffect(() => {
        clearTimers()

        if (isCanvas) {
            setStartedCount(Math.min(1, safeImages.length))
            setBoxPhase("open")
            setShowBottomWord(showRevealWord)
            return
        }

        setStartedCount(0)
        setBoxPhase("opening")
        setShowBottomWord(false)

        const clampedOverlap = Math.min(
            Math.max(overlap, 0),
            Math.max(stepDuration - 0.01, 0)
        )
        const interval = Math.max(stepDuration - clampedOverlap, 0.01)

        const openDoneAt = startDelay + introDuration
        const imagesStartAt = openDoneAt + introHold

        const openTimer = window.setTimeout(() => {
            setBoxPhase("open")
        }, openDoneAt * 1000)
        timers.current.push(openTimer)

        safeImages.forEach((_, index) => {
            const delay = (imagesStartAt + index * interval) * 1000
            const timer = window.setTimeout(() => {
                setStartedCount((prev) => Math.max(prev, index + 1))
            }, delay)
            timers.current.push(timer)
        })

        const allImagesStartedAt =
            safeImages.length > 0
                ? imagesStartAt + (safeImages.length - 1) * interval
                : imagesStartAt

        const lastImageFullyOpenAt =
            safeImages.length > 0
                ? allImagesStartedAt + stepDuration
                : imagesStartAt

        const closingStartsAt = lastImageFullyOpenAt + endHold
        const closedAt = closingStartsAt + outroDuration
        const revealStartsAt = closedAt + revealStartDelay

        const closeTimer = window.setTimeout(() => {
            setBoxPhase("closing")
        }, closingStartsAt * 1000)

        const closedTimer = window.setTimeout(() => {
            setBoxPhase("closed")
        }, closedAt * 1000)

        const revealTimer = window.setTimeout(() => {
            if (showRevealWord) setShowBottomWord(true)
        }, revealStartsAt * 1000)

        timers.current.push(closeTimer, closedTimer, revealTimer)

        return () => clearTimers()
    }, [
        safeImages,
        startDelay,
        introDuration,
        introHold,
        stepDuration,
        overlap,
        endHold,
        outroDuration,
        revealStartDelay,
        showRevealWord,
        clearTimers,
        isCanvas,
    ])

    const hasLogoImage = showLogoImage && !!logoImage
    const visibleImages = safeImages.slice(0, startedCount)

    const targetSize = React.useMemo(() => {
        return {
            width: Math.max(containerSize.width, imageTileWidth),
            height: Math.max(containerSize.height, imageTileHeight),
        }
    }, [
        containerSize.width,
        containerSize.height,
        imageTileWidth,
        imageTileHeight,
    ])

    const showLogoBox = boxPhase !== "closed"

    const logoWrapperWidth = hasLogoImage ? logoImageBgWidth : logoTileWidth
    const logoWrapperHeight = hasLogoImage ? logoImageBgHeight : logoTileHeight

    const revealCharacters = React.useMemo(
        () => Array.from(revealWord || ""),
        [revealWord]
    )

    const revealTextStyle: React.CSSProperties = {
        color: revealTextColor,
        whiteSpace: "pre",
        lineHeight: 1,
        ...getFontStyle(revealFont),
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                borderRadius,
            }}
        >
            {visibleImages.map((src, index) => (
                <motion.div
                    key={`${index}-${src}`}
                    initial={{
                        width: imageTileWidth,
                        height: imageTileHeight,
                    }}
                    animate={{
                        width: targetSize.width,
                        height: targetSize.height,
                    }}
                    transition={{
                        duration: isCanvas ? 0 : stepDuration,
                        ease: imageEaseValue as any,
                    }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        x: "-50%",
                        y: "-50%",
                        transformOrigin: "center center",
                        overflow: "hidden",
                        borderRadius: imageTileRadius,
                        zIndex: index + 1,
                        pointerEvents: "none",
                        willChange: "width, height",
                        backfaceVisibility: "hidden",
                    }}
                >
                    <img
                        src={src}
                        alt=""
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit: imageFit,
                            objectPosition: "center center",
                            userSelect: "none",
                            pointerEvents: "none",
                            backfaceVisibility: "hidden",
                        }}
                    />
                </motion.div>
            ))}

            {showBottomWord && revealCharacters.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: revealBottomOffset,
                        zIndex: 10000,
                        pointerEvents: "none",
                        overflow: "visible",
                        whiteSpace: "nowrap",
                        paddingLeft: revealPaddingLeft,
                        paddingRight: revealPaddingRight,
                        paddingTop: revealPaddingTop,
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            whiteSpace: "nowrap",
                            overflow: "visible",
                        }}
                    >
                        {revealCharacters.map((char, index) => {
                            const content = char === " " ? "\u00A0" : char

                            return (
                                <span
                                    key={`${char}-${index}`}
                                    style={{
                                        position: "relative",
                                        display: "inline-block",
                                        overflow: "hidden",
                                        verticalAlign: "bottom",
                                    }}
                                >
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            ...revealTextStyle,
                                            visibility: "hidden",
                                            display: "block",
                                        }}
                                    >
                                        {content}
                                    </span>

                                    <motion.span
                                        initial={{
                                            y: revealLetterOffset,
                                            opacity: 1,
                                        }}
                                        animate={{
                                            y: 0,
                                            opacity: 1,
                                        }}
                                        transition={{
                                            duration: isCanvas
                                                ? 0
                                                : revealLetterDuration,
                                            delay: isCanvas
                                                ? 0
                                                : index * revealLetterStagger,
                                            ease: logoEaseValue as any,
                                        }}
                                        style={{
                                            ...revealTextStyle,
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            display: "block",
                                        }}
                                    >
                                        {content}
                                    </motion.span>
                                </span>
                            )
                        })}
                    </div>
                </div>
            )}

            {showLogoBox && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: logoWrapperWidth,
                        height: logoWrapperHeight,
                        transform: "translate(-50%, -50%)",
                        overflow: "hidden",
                        zIndex: 9999,
                        pointerEvents: "none",
                    }}
                >
                    <motion.div
                        initial={{ width: isCanvas ? logoWrapperWidth : 0 }}
                        animate={{
                            width:
                                boxPhase === "opening"
                                    ? logoWrapperWidth
                                    : boxPhase === "closing"
                                      ? 0
                                      : logoWrapperWidth,
                        }}
                        transition={{
                            duration: isCanvas
                                ? 0
                                : boxPhase === "closing"
                                  ? outroDuration
                                  : introDuration,
                            ease: logoEaseValue as any,
                        }}
                        style={{
                            width: logoWrapperWidth,
                            height: logoWrapperHeight,
                            overflow: "hidden",
                            transformOrigin: "left center",
                        }}
                    >
                        {hasLogoImage ? (
                            <div
                                style={{
                                    width: logoImageBgWidth,
                                    height: logoImageBgHeight,
                                    background: logoImageBgColor,
                                    borderRadius: logoImageBgRadius,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxSizing: "border-box",
                                    overflow: "hidden",
                                }}
                            >
                                <img
                                    src={logoImage}
                                    alt={logoText || "Logo"}
                                    draggable={false}
                                    style={{
                                        width: logoImageWidth,
                                        height: logoImageHeight,
                                        objectFit: "contain",
                                        objectPosition: "center center",
                                        display: "block",
                                        userSelect: "none",
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    width: logoTileWidth,
                                    height: logoTileHeight,
                                    background: logoTileColor,
                                    borderRadius: logoTileRadius,
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: "flex-start",
                                    boxSizing: "border-box",
                                    padding: 12,
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        color: logoTextColor,
                                        whiteSpace: "nowrap",
                                        ...getFontStyle(logoFont),
                                    }}
                                >
                                    {logoText}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    )
}

CubeIntro.defaultProps = {
    images: [],

    logoText: "studio.normal.",
    logoImage: "",
    showLogoImage: false,

    backgroundColor: "#022B34",
    logoTileColor: "#2C9AD0",
    logoTextColor: "#041A21",

    logoImageBgColor: "#2C9AD0",
    logoImageBgWidth: 144,
    logoImageBgHeight: 172,
    logoImageBgRadius: 0,

    startDelay: 0.2,
    introDuration: 0.6,
    introHold: 0.2,
    stepDuration: 1.2,
    overlap: 0.25,
    endHold: 0.5,
    outroDuration: 0.5,

    imageTileWidth: 220,

    logoTileWidth: 144,
    logoTileHeight: 172,

    logoImageWidth: 100,
    logoImageHeight: 100,

    borderRadius: 18,
    imageTileRadius: 0,
    logoTileRadius: 0,

    imageFit: "cover",

    easePreset: "easeOut",
    bezier1: 0.22,
    bezier2: 1,
    bezier3: 0.36,
    bezier4: 1,

    logoEasePreset: "easeOut",
    logoBezier1: 0.22,
    logoBezier2: 1,
    logoBezier3: 0.36,
    logoBezier4: 1,

    showRevealWord: true,
    revealWord: "studio.normal.",
    revealStartDelay: 0.1,
    revealLetterDuration: 0.7,
    revealLetterStagger: 0.06,
    revealLetterOffset: 260,
    revealBottomOffset: -8,
    revealTextColor: "#032834",
    revealPaddingLeft: 0,
    revealPaddingRight: 0,
    revealPaddingTop: 0,

    revealFont: {
        fontFamily: "Inter",
        fontSize: 320,
        fontWeight: 700,
        letterSpacing: -0.08,
        lineHeight: 1,
        textAlign: "left",
    },

    logoFont: {
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: -0.03,
        lineHeight: 1,
    },
}

addPropertyControls(CubeIntro, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        maxCount: 12,
    },

    showLogoImage: {
        type: ControlType.Boolean,
        title: "Use Logo Img",
        defaultValue: false,
    },

    logoImage: {
        type: ControlType.Image,
        title: "Logo Image",
        hidden: (props) => !props.showLogoImage,
    },

    logoImageBgColor: {
        type: ControlType.Color,
        title: "Logo BG",
        defaultValue: "#2C9AD0",
        hidden: (props) => !props.showLogoImage,
    },

    logoImageBgWidth: {
        type: ControlType.Number,
        title: "Logo BG W",
        defaultValue: 144,
        min: 20,
        max: 1200,
        step: 1,
        hidden: (props) => !props.showLogoImage,
    },

    logoImageBgHeight: {
        type: ControlType.Number,
        title: "Logo BG H",
        defaultValue: 172,
        min: 20,
        max: 1200,
        step: 1,
        hidden: (props) => !props.showLogoImage,
    },

    logoImageBgRadius: {
        type: ControlType.Number,
        title: "Logo BG Radius",
        defaultValue: 0,
        min: 0,
        max: 300,
        step: 1,
        hidden: (props) => !props.showLogoImage,
    },

    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "studio.normal.",
        hidden: (props) => props.showLogoImage,
    },

    logoFont: {
        type: ControlType.Font,
        title: "Logo Font",
        controls: "extended",
        hidden: (props) => props.showLogoImage,
        defaultValue: {
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: -0.03,
            lineHeight: 1,
        },
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "BG",
        defaultValue: "#022B34",
    },

    logoTileColor: {
        type: ControlType.Color,
        title: "Tile",
        defaultValue: "#2C9AD0",
        hidden: (props) => props.showLogoImage,
    },

    logoTextColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#041A21",
        hidden: (props) => props.showLogoImage,
    },

    startDelay: {
        type: ControlType.Number,
        title: "Start",
        defaultValue: 0.2,
        min: 0,
        max: 5,
        step: 0.05,
        unit: "s",
    },

    introDuration: {
        type: ControlType.Number,
        title: "Intro",
        defaultValue: 0.6,
        min: 0.05,
        max: 5,
        step: 0.05,
        unit: "s",
    },

    introHold: {
        type: ControlType.Number,
        title: "Intro Hold",
        defaultValue: 0.2,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
    },

    stepDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.2,
        min: 0.2,
        max: 6,
        step: 0.05,
        unit: "s",
    },

    overlap: {
        type: ControlType.Number,
        title: "Overlap",
        defaultValue: 0.25,
        min: 0,
        max: 3,
        step: 0.01,
        unit: "s",
    },

    endHold: {
        type: ControlType.Number,
        title: "End Hold",
        defaultValue: 0.5,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
    },

    outroDuration: {
        type: ControlType.Number,
        title: "Outro",
        defaultValue: 0.5,
        min: 0.05,
        max: 5,
        step: 0.05,
        unit: "s",
    },

    easePreset: {
        type: ControlType.Enum,
        title: "Img Ease",
        defaultValue: "easeOut",
        options: ["linear", "easeIn", "easeOut", "easeInOut", "custom"],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Custom",
        ],
    },

    bezier1: {
        type: ControlType.Number,
        title: "Img B1",
        defaultValue: 0.22,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => props.easePreset !== "custom",
    },

    bezier2: {
        type: ControlType.Number,
        title: "Img B2",
        defaultValue: 1,
        min: 0,
        max: 1.5,
        step: 0.01,
        hidden: (props) => props.easePreset !== "custom",
    },

    bezier3: {
        type: ControlType.Number,
        title: "Img B3",
        defaultValue: 0.36,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => props.easePreset !== "custom",
    },

    bezier4: {
        type: ControlType.Number,
        title: "Img B4",
        defaultValue: 1,
        min: 0,
        max: 1.5,
        step: 0.01,
        hidden: (props) => props.easePreset !== "custom",
    },

    logoEasePreset: {
        type: ControlType.Enum,
        title: "Logo Ease",
        defaultValue: "easeOut",
        options: ["linear", "easeIn", "easeOut", "easeInOut", "custom"],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Custom",
        ],
    },

    logoBezier1: {
        type: ControlType.Number,
        title: "Logo B1",
        defaultValue: 0.22,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => props.logoEasePreset !== "custom",
    },

    logoBezier2: {
        type: ControlType.Number,
        title: "Logo B2",
        defaultValue: 1,
        min: 0,
        max: 1.5,
        step: 0.01,
        hidden: (props) => props.logoEasePreset !== "custom",
    },

    logoBezier3: {
        type: ControlType.Number,
        title: "Logo B3",
        defaultValue: 0.36,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => props.logoEasePreset !== "custom",
    },

    logoBezier4: {
        type: ControlType.Number,
        title: "Logo B4",
        defaultValue: 1,
        min: 0,
        max: 1.5,
        step: 0.01,
        hidden: (props) => props.logoEasePreset !== "custom",
    },

    showRevealWord: {
        type: ControlType.Boolean,
        title: "Show Word",
        defaultValue: true,
    },

    revealWord: {
        type: ControlType.String,
        title: "Word",
        defaultValue: "studio.normal.",
        hidden: (props) => !props.showRevealWord,
    },

    revealStartDelay: {
        type: ControlType.Number,
        title: "Word Delay",
        defaultValue: 0.1,
        min: 0,
        max: 5,
        step: 0.05,
        unit: "s",
        hidden: (props) => !props.showRevealWord,
    },

    revealLetterDuration: {
        type: ControlType.Number,
        title: "Letter Time",
        defaultValue: 0.7,
        min: 0.05,
        max: 5,
        step: 0.05,
        unit: "s",
        hidden: (props) => !props.showRevealWord,
    },

    revealLetterStagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.06,
        min: 0,
        max: 1,
        step: 0.01,
        unit: "s",
        hidden: (props) => !props.showRevealWord,
    },

    revealLetterOffset: {
        type: ControlType.Number,
        title: "Letter Offset",
        defaultValue: 260,
        min: 0,
        max: 1200,
        step: 1,
        hidden: (props) => !props.showRevealWord,
    },

    revealBottomOffset: {
        type: ControlType.Number,
        title: "Word Padding Bottom",
        defaultValue: -8,
        min: -400,
        max: 400,
        step: 1,
        hidden: (props) => !props.showRevealWord,
    },

    revealPaddingLeft: {
        type: ControlType.Number,
        title: "Word Padding Left",
        defaultValue: 0,
        min: 0,
        max: 800,
        step: 1,
        hidden: (props) => !props.showRevealWord,
    },

    revealPaddingRight: {
        type: ControlType.Number,
        title: "Word Padding Right",
        defaultValue: 0,
        min: 0,
        max: 800,
        step: 1,
        hidden: (props) => !props.showRevealWord,
    },

    revealPaddingTop: {
        type: ControlType.Number,
        title: "Word Padding Top",
        defaultValue: 0,
        min: 0,
        max: 800,
        step: 1,
        hidden: (props) => !props.showRevealWord,
    },

    revealTextColor: {
        type: ControlType.Color,
        title: "Word Color",
        defaultValue: "#032834",
        hidden: (props) => !props.showRevealWord,
    },

    revealFont: {
        type: ControlType.Font,
        title: "Word Font",
        controls: "extended",
        hidden: (props) => !props.showRevealWord,
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 320,
            fontWeight: 700,
            letterSpacing: -0.08,
            lineHeight: 1,
            textAlign: "left",
        },
    },

    imageTileWidth: {
        type: ControlType.Number,
        title: "Img 16:9 W",
        defaultValue: 220,
        min: 20,
        max: 1600,
        step: 1,
    },

    logoTileWidth: {
        type: ControlType.Number,
        title: "Logo Tile W",
        defaultValue: 144,
        min: 20,
        max: 1200,
        step: 1,
        hidden: (props) => props.showLogoImage,
    },

    logoTileHeight: {
        type: ControlType.Number,
        title: "Logo Tile H",
        defaultValue: 172,
        min: 20,
        max: 1200,
        step: 1,
        hidden: (props) => props.showLogoImage,
    },

    logoImageWidth: {
        type: ControlType.Number,
        title: "Logo W",
        defaultValue: 100,
        min: 1,
        max: 1200,
        step: 1,
        hidden: (props) => !props.showLogoImage,
    },

    logoImageHeight: {
        type: ControlType.Number,
        title: "Logo H",
        defaultValue: 100,
        min: 1,
        max: 1200,
        step: 1,
        hidden: (props) => !props.showLogoImage,
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 18,
        min: 0,
        max: 100,
        step: 1,
    },

    imageTileRadius: {
        type: ControlType.Number,
        title: "Img Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
    },

    logoTileRadius: {
        type: ControlType.Number,
        title: "Logo Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        hidden: (props) => props.showLogoImage,
    },

    imageFit: {
        type: ControlType.Enum,
        title: "Fit",
        defaultValue: "cover",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
    },
})

function getFontStyle(font: any): React.CSSProperties {
    if (!font) return {}

    return {
        fontFamily: font.fontFamily,
        fontSize: font.fontSize,
        fontWeight: font.fontWeight,
        fontStyle: font.fontStyle,
        letterSpacing: font.letterSpacing,
        lineHeight: font.lineHeight,
        textAlign: font.textAlign,
        textTransform: font.textTransform,
    }
}
