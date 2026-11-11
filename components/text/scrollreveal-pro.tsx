// Scroll Text with animation per word, slots for inline components, blur/fade on scroll, full font/text control. No DOMPurify.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { useRef, useMemo } from "react"

const EachWord = ({
    word,
    starting,
    ending,
    startOpacity,
    endOpacity,
    progress,
    children,
    animationStyle,
    enableBlur,
    enableSmooth,
    isCanvas,
}) => {
    const sanitizedWord = word
    const progressVal = useTransform(
        progress,
        [starting, ending],
        [startOpacity, endOpacity]
    )

    const yVal = useTransform(
        progress,
        [starting, ending],
        animationStyle === "slide" ? [20, 0] : [0, 0]
    )

    const blurVal = useTransform(
        progress,
        [starting, ending],
        enableBlur ? [10, 0] : [0, 0]
    )

    const filterVal = useTransform(
        blurVal,
        (value) => `blur(${value}px)`
    )

    const springConfig = { stiffness: 100, damping: 20, mass: 1 }
    
    const smoothOpacity = useSpring(progressVal, springConfig)
    const smoothY = useSpring(yVal, springConfig)
    const smoothBlur = useSpring(blurVal, springConfig)
    
    const smoothFilter = useTransform(
        smoothBlur,
        (value) => `blur(${value}px)`
    )

    const finalOpacity = isCanvas ? 1 : (enableSmooth ? smoothOpacity : progressVal)
    const finalY = isCanvas ? 0 : (enableSmooth ? smoothY : yVal)
    const finalFilter = isCanvas ? "none" : (enableSmooth ? smoothFilter : filterVal)

    if (children) {
        return (
            <motion.span
                style={{
                    opacity: finalOpacity,
                    y: finalY,
                    filter: enableBlur ? finalFilter : undefined,
                    willChange: animationStyle === "slide" ? "opacity, transform" : "opacity",
                    display: "inline-flex",
                    alignItems: "center",
                }}
            >
                {children}
            </motion.span>
        )
    }

    return (
        <motion.span
            style={{
                opacity: finalOpacity,
                y: finalY,
                filter: enableBlur ? finalFilter : undefined,
                willChange: animationStyle === "slide" ? "opacity, transform" : "opacity",
                display: "inline",
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedWord }}
        />
    )
}

/**
 *
 * @framerIntrinsicWidth 480
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ScrollText(props) {
    const text = props.text
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: [`start ${props.startOffset}`, `end ${props.endOffset}`],
    })

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const segments = useMemo(() => {
        const textWithNewlines = text
            .replace(/<br\s*\/?>(\s*<br\s*\/?>(\s*))?/gi, "\n\n")
            .replace(/<br\s*\/?>(?!\n)/gi, "\n")

        const slotEnabled = props.showSlots
        return textWithNewlines
            .split(
                /(\[[^\]]*\]|\n+|<[^>]+>[^<]*<\/[^^>]+>|<[^>]+>|[^\s\[\]<>\n]+)/g
            )
            .filter(Boolean)
            .map((segment, index) => {
                if (segment.match(/\n+/)) {
                    return { type: "linebreak", content: segment }
                }
                if (segment.startsWith("[") && segment.endsWith("]")) {
                    const slotIndex = parseInt(segment.slice(1, -1)) - 1
                    if (slotEnabled && !isNaN(slotIndex) && slotIndex >= 0) {
                        return {
                            type: "slot",
                            index: slotIndex,
                        }
                    } else {
                        return { type: "text", content: segment }
                    }
                }
                if (segment.match(/^\s+$/)) {
                    return null
                }
                return { type: "text", content: segment }
            })
            .filter((segment) => segment !== null && segment !== undefined)
    }, [text, props.showSlots])

    const totalSegments = segments.length

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "auto",
                // Remove maxWidth: 480,
                ...props.font,
                color: props.textColor,
                margin: 0,
                padding: 0,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "0.25em",
                wordBreak: "break-word",
            }}
        >
            {segments.map((segment, idx) => {
                if (segment.type === "linebreak") {
                    return (
                        <span
                            key={`break-${idx}`}
                            style={{ flexBasis: "100%", height: 0 }}
                        />
                    )
                }
                if (segment.type === "slot") {
                    if (!props.showSlots) return null
                    const slotContent = props.slots?.[segment.index]
                    if (!slotContent) {
                        // Render purple placeholder box when slot is empty
                        const fontSize = parseFloat(props.font?.fontSize) || 36
                        const lineHeight = props.font?.lineHeight || 1.1
                        const lineHeightValue =
                            typeof lineHeight === "string"
                                ? parseFloat(lineHeight) * fontSize
                                : lineHeight * fontSize
                        const boxSize = lineHeightValue
                        return (
                            <EachWord
                                key={`slot-${idx}`}
                                word=""
                                starting={idx / totalSegments}
                                ending={(idx + 1) / totalSegments}
                                startOpacity={props.startOpacity}
                                endOpacity={props.endOpacity}
                                progress={scrollYProgress}
                                animationStyle={props.animationStyle}
                                enableBlur={props.enableBlur}
                                enableSmooth={props.enableSmooth}
                                isCanvas={isCanvas}
                            >
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        alignSelf: "baseline",
                                        marginLeft: props.layerGap || 0,
                                        marginRight: props.layerGap || 0,
                                        backgroundColor:
                                            "rgba(136, 85, 255, 0.1)",
                                        color: "#8855FF",
                                        padding: "4px 12px",
                                        border: "1px solid #8855FF",
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        width: boxSize,
                                        height: boxSize,
                                    }}
                                >
                                    {segment.index + 1}
                                </span>
                            </EachWord>
                        )
                    }
                    return (
                        <EachWord
                            key={`slot-${idx}`}
                            word=""
                            starting={idx / totalSegments}
                            ending={(idx + 1) / totalSegments}
                            startOpacity={props.startOpacity}
                            endOpacity={props.endOpacity}
                            progress={scrollYProgress}
                            animationStyle={props.animationStyle}
                            enableBlur={props.enableBlur}
                            enableSmooth={props.enableSmooth}
                            isCanvas={isCanvas}
                        >
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    marginLeft: props.layerGap || 0,
                                    marginRight: props.layerGap || 0,
                                }}
                            >
                                {slotContent}
                            </span>
                        </EachWord>
                    )
                }
                return (
                    <EachWord
                        key={`text-${idx}`}
                        word={segment.content}
                        starting={idx / totalSegments}
                        ending={(idx + 1) / totalSegments}
                        startOpacity={props.startOpacity}
                        endOpacity={props.endOpacity}
                        progress={scrollYProgress}
                        animationStyle={props.animationStyle}
                        enableBlur={props.enableBlur}
                        enableSmooth={props.enableSmooth}
                        isCanvas={isCanvas}
                    >
                        {null}
                    </EachWord>
                )
            })}
        </div>
    )
}

addPropertyControls(ScrollText, {
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue:
            "Turn your [1] into something people truly value in less time and with more [2]",
        displayTextArea: true,
    },
    showSlots: {
        type: ControlType.Boolean,
        title: "Show Slots",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    slots: {
        type: ControlType.Array,
        title: "Slots",
        description:
            "Add components to slots. Use [1], [2], etc. in text above.",
        control: {
            type: ControlType.ComponentInstance,
        },
        defaultValue: [],
        maxCount: 10,
        hidden: (props) => !props?.showSlots,
    },
    layerGap: {
        type: ControlType.Number,
        title: "Layer Gap",
        defaultValue: 2,
        min: 0,
        max: 100,
        step: 1,
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        defaultValue: {
            fontSize: 36,
            variant: "Regular",
            lineHeight: 1.1,
        },
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
    },
    animationStyle: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["fade", "slide"],
        optionTitles: ["Fade", "Slide"],
        defaultValue: "fade",
        displaySegmentedControl: true,
    },
    enableSmooth: {
        type: ControlType.Boolean,
        title: "Smooth",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    enableBlur: {
        type: ControlType.Boolean,
        title: "Blur",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    startOffset: {
        title: "Start Offset",
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
    },
    endOffset: {
        title: "End Offset",
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
    },
    startOpacity: {
        title: "Start Opacity",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
    },
    endOpacity: {
        title: "End Opacity",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
})
