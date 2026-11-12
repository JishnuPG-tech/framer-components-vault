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

import {
    motion,
    useScroll,
    useTransform,
    useReducedMotion,
    MotionValue,
} from "framer-motion"

type Props = {
    text: string
    link: string

    textColor: string
    backgroundColor: string
    font?: React.CSSProperties

    slices: number
    spread: number
    sliceFalloff: number
    fade: number
    core: number

    style?: React.CSSProperties
}

/* ================================================= */
/* HELPERS                                           */
/* ================================================= */

function getNumericFontSize(font?: React.CSSProperties): number {
    const value = font?.fontSize

    if (typeof value === "number") {
        return value
    }

    if (typeof value === "string") {
        const parsed = parseFloat(value)

        if (!Number.isNaN(parsed)) {
            return parsed
        }
    }

    return 180
}

function getNumericLineHeight(font?: React.CSSProperties): number {
    const value = font?.lineHeight

    if (typeof value === "number") {
        return value
    }

    if (typeof value === "string") {
        const parsed = parseFloat(value)

        if (!Number.isNaN(parsed)) {
            /*
                Framer commonly gives us values
                such as "1em".
            */

            if (value.includes("em") || value.includes("%")) {
                return parsed
            }

            /*
                Unitless line-height.
            */

            if (!value.includes("px")) {
                return parsed
            }
        }
    }

    return 1
}

/* ================================================= */
/* MAIN COMPONENT                                    */
/* ================================================= */

export default function SplitText(props: Props) {
    const {
        text,
        link,

        textColor,
        backgroundColor,
        font,

        slices,
        spread,
        sliceFalloff,
        fade,
        core,

        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)

    const isStatic = useIsStaticRenderer()

    const reducedMotion = useReducedMotion()

    /* ============================================= */
    /* TYPOGRAPHY                                    */
    /* ============================================= */

    /*
        Typography is controlled exclusively
        through Framer's Font control.

        No second size control.
    */

    const fontSize = getNumericFontSize(font)

    const lineHeight = getNumericLineHeight(font)

    const textHeight = fontSize * lineHeight

    /* ============================================= */
    /* SCROLL                                        */
    /* ============================================= */

    const { scrollYProgress } = useScroll({
        target: containerRef,

        offset: ["start center", "end center"],
    })

    /*
        Initial section stays clean.

        Then the split effect unfolds while
        scrolling through the component.
    */

    const progress = useTransform(
        scrollYProgress,
        [0, 0.18, 0.85, 1],
        [0, 0, 1, 1],
        {
            clamp: true,
        }
    )

    /* ============================================= */
    /* SLICE ARRAY                                   */
    /* ============================================= */

    const sliceCount = Math.max(2, Math.round(slices))

    const sliceArray = React.useMemo(
        () =>
            Array.from(
                {
                    length: sliceCount,
                },
                (_, index) => index
            ),
        [sliceCount]
    )

    /*
        Static Framer canvas:
        show clean base state.

        Preview / live website:
        enable scroll effect.
    */

    const shouldAnimate = !isStatic && !reducedMotion

    /* ============================================= */
    /* OUTPUT                                        */
    /* ============================================= */

    return (
        <div
            ref={containerRef}
            style={{
                ...style,

                width: "100%",
                height: "100%",

                position: "relative",

                overflow: "hidden",

                backgroundColor,

                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* ================================= */}
            {/* BASE TEXT + LINK                  */}
            {/* ================================= */}

            {link ? (
                <a
                    href={link}
                    style={{
                        position: "absolute",

                        left: "50%",
                        top: "50%",

                        transform: "translate(-50%, -50%)",

                        display: "block",

                        textDecoration: "none",
                        color: "inherit",

                        cursor: "pointer",

                        zIndex: 2,
                    }}
                >
                    <BaseText text={text} color={textColor} font={font} />
                </a>
            ) : (
                <Text text={text} color={textColor} font={font} />
            )}

            {/* ================================= */}
            {/* ANIMATED SLICES                   */}
            {/* ================================= */}

            {shouldAnimate && (
                <>
                    {/* TOP */}

                    {sliceArray.map((index) => (
                        <Slice
                            key={`top-${index}`}
                            side="top"
                            index={index}
                            count={sliceCount}
                            text={text}
                            color={textColor}
                            font={font}
                            textHeight={textHeight}
                            progress={progress}
                            spread={spread}
                            sliceFalloff={sliceFalloff}
                            fade={fade}
                            core={core}
                        />
                    ))}

                    {/* BOTTOM */}

                    {sliceArray.map((index) => (
                        <Slice
                            key={`bottom-${index}`}
                            side="bottom"
                            index={index}
                            count={sliceCount}
                            text={text}
                            color={textColor}
                            font={font}
                            textHeight={textHeight}
                            progress={progress}
                            spread={spread}
                            sliceFalloff={sliceFalloff}
                            fade={fade}
                            core={core}
                        />
                    ))}
                </>
            )}
        </div>
    )
}

/* ================================================= */
/* NORMAL CENTERED TEXT                              */
/* ================================================= */

function Text({
    text,
    color,
    font,
}: {
    text: string
    color: string
    font?: React.CSSProperties
}) {
    return (
        <div
            style={{
                position: "absolute",

                left: "50%",
                top: "50%",

                transform: "translate(-50%, -50%)",

                ...font,

                color,

                whiteSpace: "nowrap",

                userSelect: "none",
                pointerEvents: "none",
            }}
        >
            {text}
        </div>
    )
}

/* ================================================= */
/* LINKED BASE TEXT                                  */
/* ================================================= */

function BaseText({
    text,
    color,
    font,
}: {
    text: string
    color: string
    font?: React.CSSProperties
}) {
    return (
        <div
            style={{
                position: "relative",

                ...font,

                color,

                whiteSpace: "nowrap",

                userSelect: "none",
            }}
        >
            {text}
        </div>
    )
}

/* ================================================= */
/* SLICE                                             */
/* ================================================= */

function Slice({
    side,

    index,
    count,

    text,
    color,
    font,

    textHeight,

    progress,

    spread,
    sliceFalloff,
    fade,
    core,
}: {
    side: "top" | "bottom"

    index: number
    count: number

    text: string
    color: string
    font?: React.CSSProperties

    textHeight: number

    progress: MotionValue<number>

    spread: number
    sliceFalloff: number
    fade: number
    core: number
}) {
    /* ============================================= */
    /* DISTANCE                                      */
    /* ============================================= */

    /*
        0 = first / inner slice
        1 = final / outer slice
    */

    const distance = count <= 1 ? 0 : index / (count - 1)

    const halfHeight = textHeight / 2

    /* ============================================= */
    /* SLICE HEIGHT DISTRIBUTION                     */
    /* ============================================= */

    /*
        Instead of simply cutting the text into
        equal strips, we create weighted strips.

        Slice Falloff = 0
        █████
        █████
        █████
        █████

        Higher Slice Falloff
        ███████████
        ███████
        ████
        ██
        ▌

        The first slice can therefore start
        significantly thicker and the following
        slices progressively become thinner.
    */

    const safeFalloff = Math.max(0, sliceFalloff)

    /*
        Weight of this individual slice.

        Higher falloff makes later slices
        lose height faster.
    */

    const getWeight = (sliceIndex: number) => {
        const normalized = count <= 1 ? 0 : sliceIndex / (count - 1)

        if (safeFalloff === 0) {
            return 1
        }

        return Math.pow(Math.max(0.04, 1 - normalized), safeFalloff)
    }

    /*
        Calculate all weights so they still
        fill exactly one half of the source word.
    */

    let totalWeight = 0

    for (let i = 0; i < count; i++) {
        totalWeight += getWeight(i)
    }

    const currentWeight = getWeight(index)

    const sliceHeight = Math.max(1, halfHeight * (currentWeight / totalWeight))

    /* ============================================= */
    /* SOURCE OFFSET                                 */
    /* ============================================= */

    /*
        Add the heights of all previous slices.

        This makes every slice sample a unique
        horizontal section of the word without
        overlapping the previous source slice.
    */

    let previousHeight = 0

    for (let i = 0; i < index; i++) {
        previousHeight += halfHeight * (getWeight(i) / totalWeight)
    }

    /*
        Important:

        index 0 starts directly next to the
        center of the word.

        Later slices move toward the outer
        edge of the original text.
    */

    let sourceY = 0

    if (side === "top") {
        sourceY = halfHeight - previousHeight - sliceHeight
    } else {
        sourceY = halfHeight + previousHeight
    }

    /* ============================================= */
    /* MOVEMENT                                      */
    /* ============================================= */

    const safeCore = Math.max(0.02, Math.min(0.8, core))

    /*
        First slice:
        moves only slightly.

        Outer slices:
        progressively move further.
    */

    const movementStrength =
        safeCore + Math.pow(distance, 1.45) * (1 - safeCore)

    const direction = side === "top" ? -1 : 1

    const finalY = direction * spread * movementStrength

    /* ============================================= */
    /* STAGGER                                       */
    /* ============================================= */

    const delay = distance * 0.12

    const animationEnd = Math.min(1, delay + 0.75)

    const localProgress = useTransform(
        progress,

        [delay, animationEnd],

        [0, 1],

        {
            clamp: true,
        }
    )

    /* ============================================= */
    /* Y TRANSFORM                                   */
    /* ============================================= */

    /*
        At the beginning the duplicate slice
        sits directly inside the original word.

        It only becomes visible after it starts
        separating.
    */

    const y = useTransform(
        localProgress,

        [0, 0.06, 0.22, 1],

        [0, 0, finalY * 0.12, finalY]
    )

    /* ============================================= */
    /* OPACITY                                       */
    /* ============================================= */

    /*
        Outer slices automatically fade more.

        Fade controls the strength of that
        progression.
    */

    const distanceOpacity = Math.max(
        0.05,

        1 - distance * fade * 0.92
    )

    const endOpacity = distanceOpacity * (1 - fade * 0.7)

    /*
        Start = invisible.

        As soon as the slice separates from the
        word it fades in.

        At the end the outer slices become
        increasingly subtle.
    */

    const opacity = useTransform(
        localProgress,

        [0, 0.06, 0.12, 0.28, 0.72, 1],

        [0, 0, 0, distanceOpacity, distanceOpacity, endOpacity]
    )

    /* ============================================= */
    /* CLIPPING                                      */
    /* ============================================= */

    /*
        Convert the text-relative source
        coordinates into clip-path values
        relative to the component center.
    */

    const sliceTop = sourceY

    const sliceBottom = textHeight - sourceY - sliceHeight

    const topInset = `calc(50% - ${halfHeight - sliceTop}px)`

    const bottomInset = `calc(50% - ${halfHeight - sliceBottom}px)`

    return (
        <motion.div
            style={{
                position: "absolute",

                inset: 0,

                y,
                opacity,

                pointerEvents: "none",

                clipPath: `inset(
                    ${topInset}
                    0
                    ${bottomInset}
                    0
                )`,

                willChange: "transform, opacity",
            }}
        >
            <Text text={text} color={color} font={font} />
        </motion.div>
    )
}

/* ================================================= */
/* DEFAULTS                                          */
/* ================================================= */

SplitText.defaultProps = {
    width: 1200,
    height: 800,

    text: "CONTACT US",

    link: "",

    textColor: "#FF6B45",

    backgroundColor: "#FFFFFF",

    slices: 7,

    spread: 300,

    sliceFalloff: 1.25,

    fade: 0.75,

    core: 0.15,
}

/* ================================================= */
/* PROPERTY CONTROLS                                 */
/* ================================================= */

addPropertyControls(SplitText, {
    /* ----------------------------------------- */
    /* CONTENT                                   */
    /* ----------------------------------------- */

    text: {
        type: ControlType.String,

        title: "Text",

        defaultValue: "CONTACT US",
    },

    link: {
        type: ControlType.Link,

        title: "Link",

        defaultValue: "",
    },

    /* ----------------------------------------- */
    /* TYPOGRAPHY                                */
    /* ----------------------------------------- */

    font: {
        type: ControlType.Font,

        title: "Font",

        controls: "extended",

        defaultValue: {
            fontFamily: "Poppins",

            fontWeight: "900",

            fontSize: "180px",

            lineHeight: "1em",

            letterSpacing: "0em",

            textAlign: "left",
        },
    },

    /* ----------------------------------------- */
    /* COLORS                                    */
    /* ----------------------------------------- */

    textColor: {
        type: ControlType.Color,

        title: "Color",

        defaultValue: "#FF6B45",
    },

    backgroundColor: {
        type: ControlType.Color,

        title: "Background",

        defaultValue: "#FFFFFF",
    },

    /* ----------------------------------------- */
    /* EFFECT                                    */
    /* ----------------------------------------- */

    slices: {
        type: ControlType.Number,

        title: "Slices",

        defaultValue: 7,

        min: 2,
        max: 16,
        step: 1,

        displayStepper: true,
    },

    spread: {
        type: ControlType.Number,

        title: "Spread",

        defaultValue: 300,

        min: 50,
        max: 700,
        step: 10,
    },

    sliceFalloff: {
        type: ControlType.Number,

        title: "Falloff",

        defaultValue: 1.25,

        min: 0,
        max: 4,
        step: 0.05,
    },

    fade: {
        type: ControlType.Number,

        title: "Fade",

        defaultValue: 0.75,

        min: 0,
        max: 1,
        step: 0.05,
    },

    core: {
        type: ControlType.Number,

        title: "Core",

        defaultValue: 0.15,

        min: 0.02,
        max: 0.8,
        step: 0.01,
    },
})
