import { useRef, useState, useEffect } from "react"
import {
    motion,
    useScroll,
    useTransform,
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


const MOBILE_DOT_CENTER = 25

type StepItem = {
    number: string
    title: string
    text: string
    image: string
}

type Props = {
    steps: StepItem[]
    accentColor: string
    lineColor: string
    cornerMaskColor: string
    numberFont: any
    numberColor: string
    titleFont: any
    titleColor: string
    textFont: any
    textColor: string
    numberTitleGap: number
    titleTextGap: number
    gridGap: number
    imageRadius: number
    mobileBreakpoint: number
    imageAnimation: "none" | "fade" | "slideUp"
    mobileImageGap: number
    lineWidth: number
    dotSize: number
    showDots: boolean
    cornerRadius: number
}

function useIsMobile(bp: number, containerRef: React.RefObject<HTMLElement>) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const check = (width: number) => setIsMobile(width < bp)
        check(el.offsetWidth)

        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width
            if (typeof width === "number") check(width)
        })
        observer.observe(el)

        return () => observer.disconnect()
    }, [bp, containerRef])

    return isMobile
}

function parseFontSize(font: any): number {
    if (!font?.fontSize) return 16
    const value = String(font.fontSize)
    return parseFloat(value) || 16
}

function getImageAnimation(type: string) {
    if (type === "none") {
        return {
            initial: { opacity: 1, y: 0 },
            whileInView: undefined,
            transition: { duration: 0 },
        }
    }
    if (type === "slideUp") {
        return {
            initial: { opacity: 0, y: 40 },
            whileInView: { opacity: 1, y: 0 },
            transition: { duration: 0.6, ease: [0.42, 0, 0.58, 1] },
        }
    }
    return {
        initial: { opacity: 0, y: 0 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.42, 0, 0.58, 1] },
    }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function StepsFlow(props: Props) {
    const {
        steps = [],
        accentColor,
        lineColor,
        cornerMaskColor,
        numberFont,
        numberColor,
        titleFont,
        titleColor,
        textFont,
        textColor,
        numberTitleGap,
        titleTextGap,
        gridGap,
        imageRadius,
        mobileBreakpoint,
        imageAnimation,
        mobileImageGap,
        lineWidth,
        dotSize,
        showDots,
        cornerRadius,
    } = props

    const lastIndex = steps.length - 1
    const lastReversed = lastIndex % 2 !== 0
    const containerRef = useRef<HTMLDivElement>(null)
    const isMobile = useIsMobile(mobileBreakpoint, containerRef)

    const mobileDotLeft = MOBILE_DOT_CENTER - dotSize / 2
    const mobileLineLeft = MOBILE_DOT_CENTER - lineWidth / 2

    const dotOffset = dotSize / 2 - lineWidth / 2

    return (
        <div ref={containerRef} style={{ width: "100%" }}>
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: isMobile ? "100%" : "calc(100% - 60px)",
                    margin: "0 auto",
                    paddingLeft: isMobile ? 30 : 0,
                    paddingRight: isMobile ? 15 : 0,
                }}
            >
                {steps.map((step, index) => (
                    <StepRow
                        key={`${index}-${lineWidth}-${cornerRadius}`}
                        step={step}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === lastIndex}
                        accentColor={accentColor}
                        lineColor={lineColor}
                        cornerMaskColor={cornerMaskColor}
                        numberFont={numberFont}
                        numberColor={numberColor}
                        titleFont={titleFont}
                        titleColor={titleColor}
                        textFont={textFont}
                        textColor={textColor}
                        numberTitleGap={numberTitleGap}
                        titleTextGap={titleTextGap}
                        gridGap={gridGap}
                        imageRadius={imageRadius}
                        isMobile={isMobile}
                        imageAnimation={imageAnimation}
                        mobileImageGap={mobileImageGap}
                        lineWidth={lineWidth}
                        dotSize={dotSize}
                        showDots={showDots}
                        cornerRadius={cornerRadius}
                    />
                ))}

                {showDots && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: isMobile ? mobileDotLeft : -dotOffset,
                            width: dotSize,
                            height: dotSize,
                            borderRadius: "50%",
                            backgroundColor: accentColor,
                            zIndex: 3,
                        }}
                    />
                )}

                {showDots && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: isMobile
                                ? mobileDotLeft
                                : lastReversed
                                  ? `calc(50% - ${dotOffset}px)`
                                  : -dotOffset,
                            width: dotSize,
                            height: dotSize,
                            borderRadius: "50%",
                            backgroundColor: accentColor,
                            zIndex: 3,
                        }}
                    />
                )}

                {isMobile && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: mobileLineLeft,
                            width: lineWidth,
                            height: "100%",
                            backgroundColor: lineColor,
                            borderRadius: showDots ? 0 : lineWidth / 2,
                            zIndex: 0,
                        }}
                    />
                )}
            </div>
        </div>
    )
}

function StepRow(props: any) {
    const isStatic = useIsStaticRenderer()
    return isStatic ? (
        <StaticStepRow {...props} />
    ) : (
        <AnimatedStepRow {...props} />
    )
}

function StaticStepRow({
    step,
    index,
    isFirst,
    isLast,
    accentColor,
    lineColor,
    cornerMaskColor,
    numberFont,
    numberColor,
    titleFont,
    titleColor,
    textFont,
    textColor,
    numberTitleGap,
    titleTextGap,
    gridGap,
    imageRadius,
    isMobile,
    mobileImageGap,
    lineWidth,
    dotSize,
    showDots,
    cornerRadius,
}: any) {
    const reversed = !isMobile && index % 2 !== 0
    const numberValue = parseInt(step.number, 10) || 0
    const numFontSize = parseFontSize(numberFont)
    const numLH = Math.round(numFontSize * 0.93)
    const mobileNumSize = numFontSize * 0.7
    const mobileNumLH = Math.round(mobileNumSize * 0.93)
    const mobileTitleSize = parseFontSize(titleFont) * 0.85

    const rowLineOffset = MOBILE_DOT_CENTER - lineWidth / 2 - 30

    const safeCornerRadius = Math.max(cornerRadius, lineWidth)
    const curveSize = safeCornerRadius * 2
    const maskSize = safeCornerRadius
    const curveLeftReversed = `calc(50% - ${curveSize - lineWidth}px)`
    const maskLeftReversed = `calc(50% - ${maskSize - lineWidth}px)`

    if (isMobile) {
        return (
            <div
                style={{
                    position: "relative",
                    padding: "24px 0 24px 20px",
                    zIndex: 1,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: rowLineOffset,
                        width: lineWidth,
                        backgroundColor: accentColor,
                        height: "100%",
                        borderRadius: `${isFirst && !showDots ? lineWidth / 2 : 0}px ${isFirst && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px`,
                    }}
                />

                <div>
                    {step.image ? (
                        <img
                            src={step.image}
                            alt=""
                            style={{
                                width: "100%",
                                height: "auto",
                                borderRadius: imageRadius,
                                display: "block",
                                marginBottom: mobileImageGap,
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                aspectRatio: "16 / 10",
                                borderRadius: imageRadius,
                                background: lineColor,
                                marginBottom: mobileImageGap,
                            }}
                        />
                    )}

                    <div
                        style={{
                            position: "relative",
                            maxHeight: mobileNumLH,
                            overflow: "hidden",
                            ...numberFont,
                            fontSize: mobileNumSize,
                            lineHeight: `${mobileNumLH}px`,
                            color: numberColor,
                        }}
                    >
                        {String(numberValue).padStart(2, "0")}
                    </div>

                    <div
                        style={{
                            marginTop: numberTitleGap,
                            ...titleFont,
                            fontSize: mobileTitleSize,
                            color: titleColor,
                        }}
                    >
                        {step.title}
                    </div>

                    <div
                        style={{
                            marginTop: titleTextGap,
                            ...textFont,
                            color: textColor,
                        }}
                    >
                        {step.text}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                paddingTop: 50,
                paddingBottom: isLast ? 50 : 50 + lineWidth,
                gap: gridGap,
                alignItems: "center",
                ...(reversed ? { direction: "ltr" } : {}),
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: isFirst ? (showDots ? dotSize / 2 : 0) : 0,
                    bottom: isLast ? (showDots ? dotSize / 2 : 0) : 0,
                    left: reversed ? "50%" : 0,
                    width: lineWidth,
                    backgroundColor: lineColor,
                    borderRadius: `${isFirst && !showDots ? lineWidth / 2 : 0}px ${isFirst && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px`,
                }}
            />

            {!isLast && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: reversed ? "auto" : 0,
                        right: reversed ? "50%" : "auto",
                        width: "50%",
                        height: lineWidth,
                        backgroundColor: lineColor,
                    }}
                />
            )}

            {!isFirst && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 1,
                        left: reversed ? maskLeftReversed : 0,
                        top: -lineWidth,
                        width: maskSize,
                        height: maskSize,
                        backgroundColor: cornerMaskColor,
                    }}
                />
            )}

            {!isLast && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 1,
                        left: reversed ? maskLeftReversed : 0,
                        bottom: 0,
                        width: maskSize,
                        height: maskSize,
                        backgroundColor: cornerMaskColor,
                    }}
                />
            )}

            {!isFirst && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        left: reversed ? curveLeftReversed : 0,
                        top: -lineWidth,
                        width: curveSize,
                        height: curveSize,
                        borderRadius: curveSize / 2,
                        border: `${lineWidth}px solid transparent`,
                        borderTopColor: lineColor,
                        transform: reversed
                            ? "rotate(45deg)"
                            : "rotate(-45deg)",
                    }}
                />
            )}

            {!isLast && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        left: reversed ? curveLeftReversed : 0,
                        bottom: 0,
                        width: curveSize,
                        height: curveSize,
                        borderRadius: curveSize / 2,
                        border: `${lineWidth}px solid transparent`,
                        borderTopColor: lineColor,
                        transform: reversed
                            ? "rotate(135deg)"
                            : "rotate(225deg)",
                    }}
                />
            )}

            {!isFirst && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        left: reversed ? curveLeftReversed : 0,
                        top: -lineWidth,
                        width: curveSize,
                        height: curveSize,
                        borderRadius: curveSize / 2,
                        border: `${lineWidth}px solid transparent`,
                        borderTopColor: accentColor,
                        transform: reversed
                            ? "rotate(45deg)"
                            : "rotate(-45deg)",
                        opacity: 1,
                    }}
                />
            )}

            {!isLast && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        left: reversed ? curveLeftReversed : 0,
                        bottom: 0,
                        width: curveSize,
                        height: curveSize,
                        borderRadius: curveSize / 2,
                        border: `${lineWidth}px solid transparent`,
                        borderTopColor: accentColor,
                        transform: reversed
                            ? "rotate(135deg)"
                            : "rotate(225deg)",
                        opacity: 1,
                    }}
                />
            )}

            <div
                style={{
                    position: "absolute",
                    top: isFirst ? (showDots ? dotSize / 2 : 0) : 0,
                    bottom: isLast ? (showDots ? dotSize / 2 : 0) : 0,
                    left: reversed ? "50%" : 0,
                    width: lineWidth,
                    backgroundColor: accentColor,
                    borderRadius: `${isFirst && !showDots ? lineWidth / 2 : 0}px ${isFirst && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px`,
                }}
            />

            {!isLast && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: reversed ? "auto" : 0,
                        right: reversed ? "50%" : "auto",
                        height: lineWidth,
                        backgroundColor: accentColor,
                        width: "50%",
                    }}
                />
            )}

            <div
                style={{
                    position: "relative",
                    zIndex: 3,
                    padding: reversed ? "0 50px 0 0" : "0 0 0 50px",
                    gridColumnStart: reversed ? 2 : "auto",
                    gridRowStart: reversed ? 1 : "auto",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        maxHeight: numLH,
                        overflow: "hidden",
                        ...numberFont,
                        fontSize: numFontSize,
                        lineHeight: `${numLH}px`,
                        color: numberColor,
                    }}
                >
                    {String(numberValue).padStart(2, "0")}
                </div>

                <div
                    style={{
                        marginTop: numberTitleGap,
                        ...titleFont,
                        color: titleColor,
                    }}
                >
                    {step.title}
                </div>

                <div
                    style={{
                        marginTop: titleTextGap,
                        ...textFont,
                        color: textColor,
                    }}
                >
                    {step.text}
                </div>
            </div>

            <div
                style={{
                    position: "relative",
                    zIndex: 3,
                    gridColumnStart: reversed ? 1 : "auto",
                    gridRowStart: reversed ? 1 : "auto",
                }}
            >
                {step.image ? (
                    <img
                        src={step.image}
                        alt=""
                        style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: imageRadius,
                            display: "block",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            aspectRatio: "16 / 10",
                            borderRadius: imageRadius,
                            background: lineColor,
                        }}
                    />
                )}
            </div>
        </div>
    )
}

function AnimatedStepRow({
    step,
    index,
    isFirst,
    isLast,
    accentColor,
    lineColor,
    cornerMaskColor,
    numberFont,
    numberColor,
    titleFont,
    titleColor,
    textFont,
    textColor,
    numberTitleGap,
    titleTextGap,
    gridGap,
    imageRadius,
    isMobile,
    imageAnimation,
    mobileImageGap,
    lineWidth,
    dotSize,
    showDots,
    cornerRadius,
}: any) {
    const reversed = !isMobile && index % 2 !== 0
    const stepRef = useRef<HTMLDivElement>(null)
    const [isNumberTriggered, setIsNumberTriggered] = useState(false)

    const { scrollYProgress } = useScroll({
        target: stepRef,
        offset: ["end end", "start start"],
    })

    const height = useTransform(
        scrollYProgress,
        [0, 0.02, 0.3],
        ["0%", "0%", "100%"]
    )
    const width = useTransform(
        scrollYProgress,
        [0, 0.3, 0.4],
        ["0%", "0%", "50%"]
    )
    const opacityTop = useTransform(scrollYProgress, [0, 0.01], ["0%", "100%"])
    const opacityBottom = useTransform(
        scrollYProgress,
        [0, 0.29, 0.3],
        ["0%", "0%", "100%"]
    )

    useMotionValueEvent(scrollYProgress, "change", (value) => {
        if (value >= 0.15) {
            setIsNumberTriggered(true)
        }
    })

    useEffect(() => {
        if (scrollYProgress.get() >= 0.15) {
            setIsNumberTriggered(true)
        }
    }, [scrollYProgress])

    const numberValue = parseInt(step.number, 10) || 0
    const numFontSize = parseFontSize(numberFont)
    const numLH = Math.round(numFontSize * 0.93)
    const mobileNumSize = numFontSize * 0.7
    const mobileNumLH = Math.round(mobileNumSize * 0.93)
    const mobileTitleSize = parseFontSize(titleFont) * 0.85
    const imgAnim = getImageAnimation(imageAnimation)

    const rowLineOffset = MOBILE_DOT_CENTER - lineWidth / 2 - 30

    const safeCornerRadius = Math.max(cornerRadius, lineWidth)
    const curveSize = safeCornerRadius * 2
    const maskSize = safeCornerRadius
    const curveLeftReversed = `calc(50% - ${curveSize - lineWidth}px)`
    const maskLeftReversed = `calc(50% - ${maskSize - lineWidth}px)`

    if (isMobile) {
        return (
            <motion.div
                ref={stepRef}
                style={{
                    position: "relative",
                    padding: "24px 0 24px 20px",
                    zIndex: 1,
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: rowLineOffset,
                        width: lineWidth,
                        backgroundColor: accentColor,
                        height,
                        borderRadius: `${isFirst && !showDots ? lineWidth / 2 : 0}px ${isFirst && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px`,
                    }}
                />

                <div>
                    {step.image ? (
                        <motion.img
                            src={step.image}
                            alt=""
                            initial={imgAnim.initial}
                            whileInView={imgAnim.whileInView}
                            transition={imgAnim.transition}
                            viewport={{ once: true, amount: 0.1 }}
                            style={{
                                width: "100%",
                                height: "auto",
                                borderRadius: imageRadius,
                                display: "block",
                                marginBottom: mobileImageGap,
                            }}
                            loading="lazy"
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                aspectRatio: "16 / 10",
                                borderRadius: imageRadius,
                                background: lineColor,
                                marginBottom: mobileImageGap,
                            }}
                        />
                    )}

                    <motion.div
                        onViewportEnter={() => setIsNumberTriggered(true)}
                        viewport={{ once: true, amount: 0.1 }}
                        style={{
                            position: "relative",
                            maxHeight: mobileNumLH,
                            overflow: "hidden",
                            ...numberFont,
                            fontSize: mobileNumSize,
                            lineHeight: `${mobileNumLH}px`,
                            color: numberColor,
                            opacity: isNumberTriggered ? 1 : 0,
                        }}
                    >
                        0
                        <motion.span
                            initial={{ y: "0%" }}
                            animate={{
                                y: isNumberTriggered
                                    ? `-${10 * (numberValue % 10)}%`
                                    : "0%",
                            }}
                            transition={{
                                type: "spring",
                                damping: 30,
                                stiffness: 100 + 20 * (numberValue % 10),
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                width: Math.round(mobileNumSize * 0.68),
                                wordBreak: "break-all",
                            }}
                        >
                            0123456789
                        </motion.span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.15,
                            ease: [0.42, 0, 0.58, 1],
                        }}
                        viewport={{ once: true, amount: 0.1 }}
                        style={{
                            marginTop: numberTitleGap,
                            ...titleFont,
                            fontSize: mobileTitleSize,
                            color: titleColor,
                        }}
                    >
                        {step.title}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.3,
                            ease: [0.42, 0, 0.58, 1],
                        }}
                        viewport={{ once: true, amount: 0.1 }}
                        style={{
                            marginTop: titleTextGap,
                            ...textFont,
                            color: textColor,
                        }}
                    >
                        {step.text}
                    </motion.div>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            ref={stepRef}
            style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                paddingTop: 50,
                paddingBottom: isLast ? 50 : 50 + lineWidth,
                gap: gridGap,
                alignItems: "center",
                ...(reversed ? { direction: "ltr" } : {}),
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: isFirst ? (showDots ? dotSize / 2 : 0) : 0,
                    bottom: isLast ? (showDots ? dotSize / 2 : 0) : 0,
                    left: reversed ? "50%" : 0,
                    width: lineWidth,
                    backgroundColor: lineColor,
                    borderRadius: `${isFirst && !showDots ? lineWidth / 2 : 0}px ${isFirst && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px`,
                }}
            />

            {!isLast && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: reversed ? "auto" : 0,
                        right: reversed ? "50%" : "auto",
                        width: "50%",
                        height: lineWidth,
                        backgroundColor: lineColor,
                    }}
                />
            )}

            {!isFirst && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 1,
                        left: reversed ? maskLeftReversed : 0,
                        top: -lineWidth,
                        width: maskSize,
                        height: maskSize,
                        backgroundColor: cornerMaskColor,
                    }}
                />
            )}

            {!isLast && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 1,
                        left: reversed ? maskLeftReversed : 0,
                        bottom: 0,
                        width: maskSize,
                        height: maskSize,
                        backgroundColor: cornerMaskColor,
                    }}
                />
            )}

            {!isFirst && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        left: reversed ? curveLeftReversed : 0,
                        top: -lineWidth,
                        width: curveSize,
                        height: curveSize,
                        borderRadius: curveSize / 2,
                        border: `${lineWidth}px solid transparent`,
                        borderTopColor: lineColor,
                        transform: reversed
                            ? "rotate(45deg)"
                            : "rotate(-45deg)",
                    }}
                />
            )}

            {!isLast && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        left: reversed ? curveLeftReversed : 0,
                        bottom: 0,
                        width: curveSize,
                        height: curveSize,
                        borderRadius: curveSize / 2,
                        border: `${lineWidth}px solid transparent`,
                        borderTopColor: lineColor,
                        transform: reversed
                            ? "rotate(135deg)"
                            : "rotate(225deg)",
                    }}
                />
            )}

            {!isFirst && (
                <motion.div
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        left: reversed ? curveLeftReversed : 0,
                        top: -lineWidth,
                        width: curveSize,
                        height: curveSize,
                        borderRadius: curveSize / 2,
                        border: `${lineWidth}px solid transparent`,
                        borderTopColor: accentColor,
                        transform: reversed
                            ? "rotate(45deg)"
                            : "rotate(-45deg)",
                        opacity: opacityTop,
                    }}
                />
            )}

            {!isLast && (
                <motion.div
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        left: reversed ? curveLeftReversed : 0,
                        bottom: 0,
                        width: curveSize,
                        height: curveSize,
                        borderRadius: curveSize / 2,
                        border: `${lineWidth}px solid transparent`,
                        borderTopColor: accentColor,
                        transform: reversed
                            ? "rotate(135deg)"
                            : "rotate(225deg)",
                        opacity: opacityBottom,
                    }}
                />
            )}

            <div
                style={{
                    position: "absolute",
                    top: isFirst ? (showDots ? dotSize / 2 : 0) : 0,
                    bottom: isLast ? (showDots ? dotSize / 2 : 0) : 0,
                    left: reversed ? "50%" : 0,
                    width: lineWidth,
                    overflow: "hidden",
                    borderRadius: `${isFirst && !showDots ? lineWidth / 2 : 0}px ${isFirst && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px ${isLast && !showDots ? lineWidth / 2 : 0}px`,
                }}
            >
                <motion.div
                    style={{
                        width: "100%",
                        height,
                        backgroundColor: accentColor,
                    }}
                />
            </div>

            {!isLast && (
                <motion.div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: reversed ? "auto" : 0,
                        right: reversed ? "50%" : "auto",
                        height: lineWidth,
                        backgroundColor: accentColor,
                        width,
                    }}
                />
            )}

            <div
                style={{
                    position: "relative",
                    zIndex: 3,
                    padding: reversed ? "0 50px 0 0" : "0 0 0 50px",
                    gridColumnStart: reversed ? 2 : "auto",
                    gridRowStart: reversed ? 1 : "auto",
                }}
            >
                <motion.div
                    onViewportEnter={() => setIsNumberTriggered(true)}
                    viewport={{ once: true, amount: 0.1 }}
                    style={{
                        position: "relative",
                        maxHeight: numLH,
                        overflow: "hidden",
                        ...numberFont,
                        fontSize: numFontSize,
                        lineHeight: `${numLH}px`,
                        color: numberColor,
                        opacity: isNumberTriggered ? 1 : 0,
                    }}
                >
                    0
                    <motion.span
                        initial={{ y: "0%" }}
                        animate={{
                            y: isNumberTriggered
                                ? `-${10 * (numberValue % 10)}%`
                                : "0%",
                        }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 100 + 20 * (numberValue % 10),
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            width: Math.round(numFontSize * 0.68),
                            wordBreak: "break-all",
                        }}
                    >
                        0123456789
                    </motion.span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.5,
                        delay: 0.15,
                        ease: [0.42, 0, 0.58, 1],
                    }}
                    viewport={{ once: true, amount: 0.1 }}
                    style={{
                        marginTop: numberTitleGap,
                        ...titleFont,
                        color: titleColor,
                    }}
                >
                    {step.title}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.5,
                        delay: 0.3,
                        ease: [0.42, 0, 0.58, 1],
                    }}
                    viewport={{ once: true, amount: 0.1 }}
                    style={{
                        marginTop: titleTextGap,
                        ...textFont,
                        color: textColor,
                    }}
                >
                    {step.text}
                </motion.div>
            </div>

            <div
                style={{
                    position: "relative",
                    zIndex: 3,
                    gridColumnStart: reversed ? 1 : "auto",
                    gridRowStart: reversed ? 1 : "auto",
                }}
            >
                {step.image ? (
                    <motion.img
                        src={step.image}
                        alt=""
                        initial={imgAnim.initial}
                        whileInView={imgAnim.whileInView}
                        transition={imgAnim.transition}
                        viewport={{ once: true, amount: 0.2 }}
                        style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: imageRadius,
                            display: "block",
                        }}
                        loading="lazy"
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            aspectRatio: "16 / 10",
                            borderRadius: imageRadius,
                            background: lineColor,
                        }}
                    />
                )}
            </div>
        </motion.div>
    )
}

StepsFlow.defaultProps = {
    accentColor: "#B8956A",
    lineColor: "#E8E0D4",
    cornerMaskColor: "#FFFFFF",
    numberFont: {
        fontSize: 96,
        fontWeight: 300,
        lineHeight: "1.1",
        letterSpacing: "-0.02em",
    },
    numberColor: "#B8956A",
    titleFont: {
        fontSize: 24,
        fontWeight: 600,
        lineHeight: "1.3",
        letterSpacing: "-0.01em",
    },
    titleColor: "#2C2418",
    textFont: {
        fontSize: 14,
        fontWeight: 400,
        lineHeight: "1.65em",
    },
    textColor: "#7A7060",
    numberTitleGap: 36,
    titleTextGap: 12,
    gridGap: 80,
    imageRadius: 24,
    mobileBreakpoint: 809,
    imageAnimation: "fade",
    mobileImageGap: 16,
    lineWidth: 10,
    dotSize: 30,
    showDots: true,
    cornerRadius: 50,
    steps: [
        {
            number: "01",
            title: "Concept",
            text: "We start with your ideas and vision, shaping the concept that lays the foundation for your future space.",
            image: "",
        },
        {
            number: "02",
            title: "Planning",
            text: "We refine every detail with smart planning, ensuring functionality, aesthetics, and sustainability come together.",
            image: "",
        },
        {
            number: "03",
            title: "Construction",
            text: "Our trusted team brings the design to life with precision, quality materials, and exceptional craftsmanship.",
            image: "",
        },
        {
            number: "04",
            title: "Interior",
            text: "We create and craft interiors that reflect your style and enhance the way you live and work.",
            image: "",
        },
        {
            number: "05",
            title: "Delivery",
            text: "We complete every detail and deliver a space that's ready for you to enjoy.",
            image: "",
        },
    ],
}

addPropertyControls(StepsFlow, {
    steps: {
        type: ControlType.Array,
        title: "Steps",
        control: {
            type: ControlType.Object,
            controls: {
                number: {
                    type: ControlType.String,
                    title: "Number",
                    defaultValue: "01",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Step title",
                },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    displayTextArea: true,
                    defaultValue: "Step description",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
            },
        },
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: 96,
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
        },
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#B8956A",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: 24,
            lineHeight: "1.3",
            letterSpacing: "-0.01em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#2C2418",
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            variant: "Regular",
            lineHeight: "1.65em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#7A7060",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Line Progress Color",
        defaultValue: "#B8956A",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#E8E0D4",
    },
    cornerMaskColor: {
        type: ControlType.Color,
        title: "Corner Mask",
        defaultValue: "#FFFFFF",
    },
    numberTitleGap: {
        type: ControlType.Number,
        title: "Num → Title",
        defaultValue: 36,
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
    },
    titleTextGap: {
        type: ControlType.Number,
        title: "Title → Text",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
    },
    gridGap: {
        type: ControlType.Number,
        title: "Grid Gap",
        defaultValue: 80,
        min: 20,
        max: 200,
        step: 10,
        unit: "px",
    },
    mobileImageGap: {
        type: ControlType.Number,
        title: "Image → Number (Mobile)",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        description: "Gap between the image and the number, mobile layout only",
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        defaultValue: 24,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    imageAnimation: {
        type: ControlType.Enum,
        title: "Image Animation",
        options: ["none", "fade", "slideUp"],
        optionTitles: ["None", "Fade", "Slide Up"],
        defaultValue: "fade",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 809,
        min: 320,
        max: 1024,
        step: 1,
        unit: "px",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 10,
        min: 2,
        max: 40,
        step: 1,
        unit: "px",
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Points",
        defaultValue: true,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Start/End Point",
        defaultValue: 30,
        min: 8,
        max: 80,
        step: 1,
        unit: "px",
        hidden: (props: any) => !props.showDots,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 50,
        min: 10,
        max: 150,
        step: 1,
        unit: "px",
        description: "Only for desktop",
    },
})
