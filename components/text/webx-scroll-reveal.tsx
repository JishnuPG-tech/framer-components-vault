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
    MotionValue,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 420
 */

type RevealMode = "word" | "character"
type RevealDirection = "forward" | "reverse"

type Props = {
    useDefaults: boolean

    text: string

    activeColor: string
    fadedColor: string

    fadedOpacity: number

    lineBackgroundEnabled: boolean
    lineBackgroundPhrase: string
    lineBackgroundColor: string
    lineBackgroundOpacity: number
    lineBackgroundPaddingX: number
    lineBackgroundPaddingY: number
    lineBackgroundRadius: number

    font: React.CSSProperties

    responsiveFontSize: boolean
    minFontSize: number
    fluidScale: number
    fluidOffset: number
    maxFontSize: number

    revealMode: RevealMode
    revealDirection: RevealDirection

    stagger: number
    softness: number

    scrollStart: number
    scrollEnd: number

    smoothness: number

    style?: React.CSSProperties
}

/* ------------------------------------------------------- */
/* DEFAULTS                                                */
/* ------------------------------------------------------- */

const DEFAULT_FONT: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 72,
    fontWeight: 900,
    lineHeight: 1.08,
    letterSpacing: -3.5,
    textAlign: "left",
}

const DEFAULTS = {
    text: "MakeReign works across brand, product, and marketing to help modern companies scale with speed and clarity.",

    activeColor: "#242424",
    fadedColor: "#242424",

    fadedOpacity: 0.28,

    lineBackgroundEnabled: false,
    lineBackgroundPhrase: "speed and clarity",
    lineBackgroundColor: "#FFE66D",
    lineBackgroundOpacity: 1,
    lineBackgroundPaddingX: 8,
    lineBackgroundPaddingY: 4,
    lineBackgroundRadius: 6,

    font: DEFAULT_FONT,

    responsiveFontSize: true,
    minFontSize: 2,
    fluidScale: 4,
    fluidOffset: 20,
    maxFontSize: 4.5,

    revealMode: "word" as RevealMode,

    revealDirection: "forward" as RevealDirection,

    stagger: 0.72,

    softness: 0.07,

    scrollStart: 0.15,
    scrollEnd: 0.85,

    smoothness: 150,
}

/* ------------------------------------------------------- */
/* UTILITY                                                 */
/* ------------------------------------------------------- */

function clamp(value: number, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value))
}

/* ------------------------------------------------------- */
/* INDIVIDUAL REVEAL UNIT                                  */
/* ------------------------------------------------------- */

function RevealUnit({
    children,

    progress,

    index,
    total,

    activeColor,
    fadedColor,
    fadedOpacity,

    stagger,
    softness,

    reverse,
}: {
    children: React.ReactNode

    progress: MotionValue<number>

    index: number
    total: number

    activeColor: string
    fadedColor: string

    fadedOpacity: number

    stagger: number
    softness: number

    reverse: boolean
}) {
    /* --------------------------------------------------- */
    /* REVEAL ORDER                                        */
    /* --------------------------------------------------- */

    const actualIndex = reverse ? total - 1 - index : index

    const normalizedPosition = total <= 1 ? 0 : actualIndex / (total - 1)

    const safeStagger = clamp(stagger)

    const unitStart = normalizedPosition * safeStagger

    const safeSoftness = Math.max(0.005, softness)

    const unitEnd = Math.min(1, unitStart + safeSoftness)

    /* --------------------------------------------------- */
    /* ACTIVE OPACITY                                      */
    /* --------------------------------------------------- */

    const activeOpacity = useTransform(
        progress,

        [unitStart, unitEnd],

        [0, 1],

        {
            clamp: true,
        }
    )

    return (
        <span
            style={{
                position: "relative",
                display: "inline-block",
            }}
        >
            {/* ========================================== */}
            {/* FADED BASE                                 */}
            {/* ========================================== */}

            <span
                style={{
                    color: fadedColor,
                    opacity: fadedOpacity,
                }}
            >
                {children}
            </span>

            {/* ========================================== */}
            {/* FULL-COLOR COPY                            */}
            {/* ========================================== */}

            <motion.span
                aria-hidden="true"
                style={{
                    position: "absolute",

                    inset: 0,

                    color: activeColor,

                    opacity: activeOpacity,

                    pointerEvents: "none",
                }}
            >
                {children}
            </motion.span>
        </span>
    )
}

/* ------------------------------------------------------- */
/* WORD                                                    */
/* ------------------------------------------------------- */

function RevealWord({
    word,

    wordIndex,

    characterStartIndex,

    totalWords,
    totalCharacters,

    progress,

    revealMode,

    activeColor,
    fadedColor,
    fadedOpacity,

    stagger,
    softness,

    reverse,
}: {
    word: string

    wordIndex: number

    characterStartIndex: number

    totalWords: number
    totalCharacters: number

    progress: MotionValue<number>

    revealMode: RevealMode

    activeColor: string
    fadedColor: string

    fadedOpacity: number

    stagger: number
    softness: number

    reverse: boolean
}) {
    /* --------------------------------------------------- */
    /* WORD MODE                                           */
    /* --------------------------------------------------- */

    if (revealMode === "word") {
        return (
            <span
                style={{
                    whiteSpace: "nowrap",
                }}
            >
                <RevealUnit
                    progress={progress}
                    index={wordIndex}
                    total={totalWords}
                    activeColor={activeColor}
                    fadedColor={fadedColor}
                    fadedOpacity={fadedOpacity}
                    stagger={stagger}
                    softness={softness}
                    reverse={reverse}
                >
                    {word}
                </RevealUnit>
            </span>
        )
    }

    /* --------------------------------------------------- */
    /* CHARACTER MODE                                      */
    /* --------------------------------------------------- */

    const characters = word.split("")

    return (
        <span
            style={{
                whiteSpace: "nowrap",
            }}
        >
            {characters.map((character, localIndex) => {
                const globalIndex = characterStartIndex + localIndex

                return (
                    <RevealUnit
                        key={globalIndex}
                        progress={progress}
                        index={globalIndex}
                        total={totalCharacters}
                        activeColor={activeColor}
                        fadedColor={fadedColor}
                        fadedOpacity={fadedOpacity}
                        stagger={stagger}
                        softness={softness}
                        reverse={reverse}
                    >
                        {character}
                    </RevealUnit>
                )
            })}
        </span>
    )
}

/* ------------------------------------------------------- */
/* COMPONENT                                               */
/* ------------------------------------------------------- */

export default function WebXScrollTextReveal(props: Props) {
    const { useDefaults, style } = props

    /* --------------------------------------------------- */
    /* RESET / CONFIG                                      */
    /* --------------------------------------------------- */

    const config = useDefaults ? DEFAULTS : props

    const {
        text,

        activeColor,
        fadedColor,

        fadedOpacity,

        lineBackgroundEnabled,
        lineBackgroundPhrase,
        lineBackgroundColor,
        lineBackgroundOpacity,
        lineBackgroundPaddingX,
        lineBackgroundPaddingY,
        lineBackgroundRadius,

        font,

        responsiveFontSize,
        minFontSize,
        fluidScale,
        fluidOffset,
        maxFontSize,

        revealMode,
        revealDirection,

        stagger,
        softness,

        scrollStart,
        scrollEnd,

        smoothness,
    } = config

    const containerRef = React.useRef<HTMLDivElement>(null)

    const isStaticRenderer = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const [isNearViewport, setIsNearViewport] = React.useState(false)

    /* --------------------------------------------------- */
    /* TEXT                                                */
    /* --------------------------------------------------- */

    const cleanText = text?.trim() || DEFAULTS.text

    const words = cleanText.split(/\s+/).filter(Boolean)

    const totalWords = words.length

    const totalCharacters = words.reduce(
        (total, word) => total + word.length,

        0
    )

    /* --------------------------------------------------- */
    /* CHARACTER INDEXES                                   */
    /* --------------------------------------------------- */

    let runningCharacterIndex = 0

    const wordsWithIndexes = words.map((word, wordIndex) => {
        const item = {
            word,

            wordIndex,

            characterStartIndex: runningCharacterIndex,
        }

        runningCharacterIndex += word.length

        return item
    })

    /* --------------------------------------------------- */
    /* VIEWPORT VISIBILITY                                 */
    /* --------------------------------------------------- */

    React.useEffect(() => {
        if (isStaticRenderer || prefersReducedMotion) {
            setIsNearViewport(false)
            return
        }

        const element = containerRef.current
        if (!element || typeof IntersectionObserver === "undefined") {
            setIsNearViewport(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => setIsNearViewport(entry.isIntersecting),
            { rootMargin: "50% 0px" }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [isStaticRenderer, prefersReducedMotion])

    /* --------------------------------------------------- */
    /* SCOPED SCROLL PROGRESS                              */
    /* --------------------------------------------------- */

    const scrollYProgress = useMotionValue(0)

    /* --------------------------------------------------- */
    /* SMOOTH SCROLL                                       */
    /* --------------------------------------------------- */

    const smoothProgress = useSpring(
        scrollYProgress,

        {
            stiffness: smoothness,

            damping: 30,

            mass: 0.25,
        }
    )

    React.useEffect(() => {
        if (
            isStaticRenderer ||
            prefersReducedMotion ||
            !isNearViewport ||
            typeof window === "undefined"
        ) {
            smoothProgress.stop()
            return
        }

        const element = containerRef.current
        if (!element) return

        let frameId: number | null = null

        const updateProgress = () => {
            frameId = null

            const rect = element.getBoundingClientRect()
            const viewportHeight = window.innerHeight || 1

            // Matches the previous "start 90%, end 10%" behaviour.
            const travelDistance = rect.height + viewportHeight * 0.8
            const nextProgress =
                travelDistance > 0
                    ? (viewportHeight * 0.9 - rect.top) / travelDistance
                    : 0

            scrollYProgress.set(clamp(nextProgress))
        }

        const scheduleUpdate = () => {
            if (frameId !== null) return
            frameId = window.requestAnimationFrame(updateProgress)
        }

        updateProgress()
        window.addEventListener("scroll", scheduleUpdate, { passive: true })
        window.addEventListener("resize", scheduleUpdate)

        return () => {
            window.removeEventListener("scroll", scheduleUpdate)
            window.removeEventListener("resize", scheduleUpdate)

            if (frameId !== null) window.cancelAnimationFrame(frameId)
            smoothProgress.stop()
        }
    }, [
        isNearViewport,
        isStaticRenderer,
        prefersReducedMotion,
        scrollYProgress,
        smoothProgress,
    ])

    /* --------------------------------------------------- */
    /* USER SCROLL RANGE                                   */
    /* --------------------------------------------------- */

    const safeStart = Math.min(scrollStart, scrollEnd - 0.001)

    const safeEnd = Math.max(scrollEnd, safeStart + 0.001)

    const revealProgress = useTransform(
        smoothProgress,

        [safeStart, safeEnd],

        [0, 1],

        {
            clamp: true,
        }
    )

    /* --------------------------------------------------- */
    /* CANVAS PREVIEW                                      */
    /* --------------------------------------------------- */

    /*
     * Framer canvas does not scroll.
     *
     * Display roughly half-revealed so the
     * component can be designed visually.
     */

    const canvasProgress = useMotionValue(0.55)
    const reducedMotionProgress = useMotionValue(1)

    const progress = isStaticRenderer
        ? canvasProgress
        : prefersReducedMotion
          ? reducedMotionProgress
          : revealProgress

    /* --------------------------------------------------- */
    /* DIRECTION                                           */
    /* --------------------------------------------------- */

    const reverse = revealDirection === "reverse"

    /* --------------------------------------------------- */
    /* TYPOGRAPHY                                          */
    /* --------------------------------------------------- */

    /*
     * Native ControlType.Font returns CSS-compatible
     * font styles such as:
     *
     * fontFamily
     * fontWeight
     * fontStyle
     * fontSize
     * lineHeight
     * letterSpacing
     * textAlign
     *
     * We simply spread them onto the text wrapper.
     */

    const typography: React.CSSProperties = {
        ...DEFAULT_FONT,
        ...font,
    }

    const lineBackgroundStyle: React.CSSProperties & Record<string, any> = {
        display: "inline",
        padding: lineBackgroundEnabled
            ? `${lineBackgroundPaddingY}px ${lineBackgroundPaddingX}px`
            : 0,
        background: lineBackgroundEnabled
            ? `color-mix(in srgb, ${lineBackgroundColor} ${clamp(lineBackgroundOpacity) * 100}%, transparent)`
            : "transparent",
        borderRadius: lineBackgroundEnabled ? `${lineBackgroundRadius}px` : 0,
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
    }

    function normalizeMatchWord(value: string) {
        return value
            .toLocaleLowerCase()
            .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    }

    const phraseWords = (lineBackgroundPhrase || "")
        .trim()
        .split(/\s+/)
        .map(normalizeMatchWord)
        .filter(Boolean)

    let highlightStart = -1
    let highlightEnd = -1

    if (lineBackgroundEnabled && wordsWithIndexes.length > 0) {
        if (phraseWords.length === 0) {
            highlightStart = 0
            highlightEnd = wordsWithIndexes.length - 1
        } else {
            const normalizedWords = wordsWithIndexes.map((item) =>
                normalizeMatchWord(item.word)
            )

            for (
                let startIndex = 0;
                startIndex <= normalizedWords.length - phraseWords.length;
                startIndex++
            ) {
                const matches = phraseWords.every(
                    (phraseWord, phraseIndex) =>
                        normalizedWords[startIndex + phraseIndex] === phraseWord
                )

                if (matches) {
                    highlightStart = startIndex
                    highlightEnd = startIndex + phraseWords.length - 1
                    break
                }
            }
        }
    }

    function renderRevealWord(item: (typeof wordsWithIndexes)[number]) {
        return (
            <RevealWord
                word={item.word}
                wordIndex={item.wordIndex}
                characterStartIndex={item.characterStartIndex}
                totalWords={totalWords}
                totalCharacters={totalCharacters}
                progress={progress}
                revealMode={revealMode}
                activeColor={activeColor}
                fadedColor={fadedColor}
                fadedOpacity={fadedOpacity}
                stagger={stagger}
                softness={softness}
                reverse={reverse}
            />
        )
    }

    function renderWordRange(start: number, end: number) {
        return wordsWithIndexes.slice(start, end).map((item, index) => (
            <React.Fragment key={`${item.word}-${item.wordIndex}`}>
                {renderRevealWord(item)}
                {index < end - start - 1 && " "}
            </React.Fragment>
        ))
    }

    /* --------------------------------------------------- */
    /* RENDER                                              */
    /* --------------------------------------------------- */

    return (
        <div
            ref={containerRef}
            style={{
                /*
                 * Preserve Framer sizing.
                 */

                ...style,

                position: "relative",

                display: "flex",

                alignItems: "center",

                overflow: "visible",
            }}
        >
            <div
                style={{
                    width: "100%",

                    /*
                     * NATIVE FRAMER TYPOGRAPHY
                     */

                    ...typography,

                    fontSize: responsiveFontSize
                        ? `clamp(${minFontSize}rem, calc(${fluidScale}vw + ${fluidOffset}px), ${maxFontSize}rem)`
                        : typography.fontSize,

                    color: activeColor,

                    /*
                     * Normal responsive text wrapping.
                     */

                    whiteSpace: "normal",

                    overflowWrap: "normal",

                    wordBreak: "normal",
                }}
            >
                {highlightStart >= 0 && highlightEnd >= highlightStart ? (
                    <>
                        {highlightStart > 0 && (
                            <>{renderWordRange(0, highlightStart)} </>
                        )}

                        <span style={lineBackgroundStyle}>
                            {renderWordRange(highlightStart, highlightEnd + 1)}
                        </span>

                        {highlightEnd < wordsWithIndexes.length - 1 && (
                            <>
                                {" "}
                                {renderWordRange(
                                    highlightEnd + 1,
                                    wordsWithIndexes.length
                                )}
                            </>
                        )}
                    </>
                ) : (
                    renderWordRange(0, wordsWithIndexes.length)
                )}
            </div>
        </div>
    )
}

/* ------------------------------------------------------- */
/* DEFAULT PROPS                                           */
/* ------------------------------------------------------- */

export const defaultProps = {
    useDefaults: false,

    ...DEFAULTS,
}

WebXScrollTextReveal.defaultProps = defaultProps

/* ------------------------------------------------------- */
/* WEBX LAB PREVIEW                                        */
/* ------------------------------------------------------- */

export const webXPreview = {
    width: 900,
    height: 520,
}

/* ------------------------------------------------------- */
/* PROPERTY CONTROLS                                       */
/* ------------------------------------------------------- */

export const propertyControls = {
    /* =============================================== */
    /* RESET                                           */
    /* =============================================== */

    useDefaults: {
        type: ControlType.Boolean,

        title: "Reset",

        enabledTitle: "Defaults",

        disabledTitle: "Custom",

        defaultValue: false,
    },

    /* =============================================== */
    /* TEXT                                            */
    /* =============================================== */

    text: {
        type: ControlType.String,

        title: "Text",

        defaultValue: DEFAULTS.text,

        displayTextArea: true,

        hidden: (props) => props.useDefaults,
    },

    /* =============================================== */
    /* ACTIVE COLOR                                    */
    /* =============================================== */

    activeColor: {
        type: ControlType.Color,

        title: "Active",

        defaultValue: DEFAULTS.activeColor,

        hidden: (props) => props.useDefaults,
    },

    /* =============================================== */
    /* FADED COLOR                                     */
    /* =============================================== */

    fadedColor: {
        type: ControlType.Color,

        title: "Faded",

        defaultValue: DEFAULTS.fadedColor,

        hidden: (props) => props.useDefaults,
    },

    /* =============================================== */
    /* FADED OPACITY                                   */
    /* =============================================== */

    fadedOpacity: {
        type: ControlType.Number,

        title: "Fade",

        defaultValue: DEFAULTS.fadedOpacity,

        min: 0,

        max: 1,

        step: 0.01,

        hidden: (props) => props.useDefaults,
    },

    /* =============================================== */
    /* FLOWING BACKGROUND                              */
    /* =============================================== */

    lineBackgroundEnabled: {
        type: ControlType.Boolean,

        title: "Text Background",

        defaultValue: DEFAULTS.lineBackgroundEnabled,

        hidden: (props) => props.useDefaults,
    },

    lineBackgroundPhrase: {
        type: ControlType.String,

        title: "Highlight Phrase",

        defaultValue: DEFAULTS.lineBackgroundPhrase,

        placeholder: "Leave empty for all text",

        hidden: (props) => props.useDefaults || !props.lineBackgroundEnabled,
    },

    lineBackgroundColor: {
        type: ControlType.Color,

        title: "Background",

        defaultValue: DEFAULTS.lineBackgroundColor,

        hidden: (props) => props.useDefaults || !props.lineBackgroundEnabled,
    },

    lineBackgroundOpacity: {
        type: ControlType.Number,

        title: "BG Opacity",

        defaultValue: DEFAULTS.lineBackgroundOpacity,

        min: 0,
        max: 1,
        step: 0.05,

        hidden: (props) => props.useDefaults || !props.lineBackgroundEnabled,
    },

    lineBackgroundPaddingX: {
        type: ControlType.Number,

        title: "BG Padding X",

        defaultValue: DEFAULTS.lineBackgroundPaddingX,

        min: 0,
        max: 40,
        step: 1,
        unit: "px",

        hidden: (props) => props.useDefaults || !props.lineBackgroundEnabled,
    },

    lineBackgroundPaddingY: {
        type: ControlType.Number,

        title: "BG Padding Y",

        defaultValue: DEFAULTS.lineBackgroundPaddingY,

        min: 0,
        max: 24,
        step: 1,
        unit: "px",

        hidden: (props) => props.useDefaults || !props.lineBackgroundEnabled,
    },

    lineBackgroundRadius: {
        type: ControlType.Number,

        title: "BG Radius",

        defaultValue: DEFAULTS.lineBackgroundRadius,

        min: 0,
        max: 40,
        step: 1,
        unit: "px",

        hidden: (props) => props.useDefaults || !props.lineBackgroundEnabled,
    },

    /* =============================================== */
    /* NATIVE FRAMER TYPOGRAPHY                        */
    /* =============================================== */

    font: {
        type: ControlType.Font,

        title: "Typography",

        /*
         * Gives you Framer's actual
         * font-family selector.
         */

        defaultFontType: "sans-serif",

        defaultFontSize: "72px",

        /*
         * Show size directly in
         * the typography control.
         */

        displayFontSize: true,

        /*
         * Also expose Left / Center /
         * Right / Justify.
         */

        displayTextAlignment: true,

        /*
         * Extended exposes:
         *
         * Family
         * Variant / Weight
         * Size
         * Line Height
         * Letter Spacing
         * Alignment
         */

        controls: "extended",

        defaultValue: {
            fontSize: 72,

            lineHeight: 1.08,

            letterSpacing: -3.5,

            textAlign: "left",

            variant: "Black",
        },

        hidden: (props) => props.useDefaults,
    },

    responsiveFontSize: {
        type: ControlType.Boolean,

        title: "Responsive Size",

        defaultValue: DEFAULTS.responsiveFontSize,

        hidden: (props) => props.useDefaults,
    },

    minFontSize: {
        type: ControlType.Number,

        title: "Minimum",

        defaultValue: DEFAULTS.minFontSize,

        min: 0.75,
        max: 8,
        step: 0.05,
        unit: "rem",

        hidden: (props) => props.useDefaults || !props.responsiveFontSize,
    },

    fluidScale: {
        type: ControlType.Number,

        title: "Fluid Scale",

        defaultValue: DEFAULTS.fluidScale,

        min: 0,
        max: 15,
        step: 0.1,
        unit: "vw",

        hidden: (props) => props.useDefaults || !props.responsiveFontSize,
    },

    fluidOffset: {
        type: ControlType.Number,

        title: "Size Offset",

        defaultValue: DEFAULTS.fluidOffset,

        min: 0,
        max: 120,
        step: 1,
        unit: "px",

        hidden: (props) => props.useDefaults || !props.responsiveFontSize,
    },

    maxFontSize: {
        type: ControlType.Number,

        title: "Maximum",

        defaultValue: DEFAULTS.maxFontSize,

        min: 1,
        max: 15,
        step: 0.05,
        unit: "rem",

        hidden: (props) => props.useDefaults || !props.responsiveFontSize,
    },

    /* =============================================== */
    /* REVEAL MODE                                     */
    /* =============================================== */

    revealMode: {
        type: ControlType.Enum,

        title: "Reveal By",

        options: ["word", "character"],

        optionTitles: ["Word", "Character"],

        defaultValue: DEFAULTS.revealMode,

        hidden: (props) => props.useDefaults,
    },

    /* =============================================== */
    /* DIRECTION                                       */
    /* =============================================== */

    revealDirection: {
        type: ControlType.Enum,

        title: "Direction",

        options: ["forward", "reverse"],

        optionTitles: ["Forward", "Reverse"],

        defaultValue: DEFAULTS.revealDirection,

        hidden: (props) => props.useDefaults,
    },

    /* =============================================== */
    /* STAGGER                                         */
    /* =============================================== */

    stagger: {
        type: ControlType.Number,

        title: "Stagger",

        defaultValue: DEFAULTS.stagger,

        min: 0,

        max: 1,

        step: 0.01,

        hidden: (props) => props.useDefaults,
    },

    /* =============================================== */
    /* SOFTNESS                                        */
    /* =============================================== */

    softness: {
        type: ControlType.Number,

        title: "Softness",

        defaultValue: DEFAULTS.softness,

        min: 0.005,

        max: 0.4,

        step: 0.005,

        hidden: (props) => props.useDefaults,
    },

    /* =============================================== */
    /* START                                           */
    /* =============================================== */

    scrollStart: {
        type: ControlType.Number,

        title: "Start",

        defaultValue: DEFAULTS.scrollStart,

        min: 0,

        max: 1,

        step: 0.01,

        hidden: (props) => props.useDefaults,
    },

    /* =============================================== */
    /* END                                             */
    /* =============================================== */

    scrollEnd: {
        type: ControlType.Number,

        title: "End",

        defaultValue: DEFAULTS.scrollEnd,

        min: 0,

        max: 1,

        step: 0.01,

        hidden: (props) => props.useDefaults,
    },

    /* =============================================== */
    /* SMOOTHNESS                                      */
    /* =============================================== */

    smoothness: {
        type: ControlType.Number,

        title: "Smooth",

        defaultValue: DEFAULTS.smoothness,

        min: 40,

        max: 400,

        step: 10,

        hidden: (props) => props.useDefaults,
    },
}

addPropertyControls(WebXScrollTextReveal, propertyControls)
