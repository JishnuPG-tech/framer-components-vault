import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
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


interface MediaSrc {
    src: string
    srcSet?: string
    alt?: string
}

interface MediaItem {
    srcs: MediaSrc[]
    duration: number
    transitionDuration: number
    link?: string
    linkTarget?: "_blank" | "_self"
}

interface InlineMediaTextProps {
    text: string
    media: MediaItem[]
    fontSize: number
    fontSizeTablet: number
    fontSizeMobile: number
    mediaSize: number
    mediaSizeTablet: number
    mediaSizeMobile: number
    borderRadius: number
    spacing: number
    spacingTablet: number
    spacingMobile: number
    font: any
    textColor: string
    autoMediaCount: number
    globalDuration: number
    globalTransition: number
    mediaPositions: number[]
    hoverScale: number
    hoverAspectRatio: number
    hoverTransition: number
    enableHoverExpansion: boolean
    tapToExpand: boolean
}

const FALLBACK_IMAGES = [
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
    "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
    "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
    "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
]

const defaultMedia: MediaItem[] = [
    {
        srcs: [
            { src: FALLBACK_IMAGES[0], alt: "Gradient 1 - Blue" },
            { src: FALLBACK_IMAGES[1], alt: "Gradient 2 - Purple" },
            { src: FALLBACK_IMAGES[2], alt: "Gradient 3 - Orange" },
        ],
        duration: 3000,
        transitionDuration: 500,
        link: "",
        linkTarget: "_self",
    },
    {
        srcs: [
            { src: FALLBACK_IMAGES[3], alt: "Gradient 4 - Yellow" },
            { src: FALLBACK_IMAGES[4], alt: "Gradient 5 - Green" },
            { src: FALLBACK_IMAGES[0], alt: "Gradient 1 - Blue" },
        ],
        duration: 3000,
        transitionDuration: 500,
        link: "",
        linkTarget: "_self",
    },
    {
        srcs: [
            { src: FALLBACK_IMAGES[1], alt: "Gradient 2 - Purple" },
            { src: FALLBACK_IMAGES[2], alt: "Gradient 3 - Orange" },
            { src: FALLBACK_IMAGES[3], alt: "Gradient 4 - Yellow" },
        ],
        duration: 3000,
        transitionDuration: 500,
        link: "",
        linkTarget: "_self",
    },
    {
        srcs: [
            { src: FALLBACK_IMAGES[4], alt: "Gradient 5 - Green" },
            { src: FALLBACK_IMAGES[0], alt: "Gradient 1 - Blue" },
            { src: FALLBACK_IMAGES[1], alt: "Gradient 2 - Purple" },
        ],
        duration: 3000,
        transitionDuration: 500,
        link: "",
        linkTarget: "_self",
    },
]

/**
 * Normalises whatever the property controls hand us. An unset row in a
 * ResponsiveImage array arrives as undefined, and reading .src off it would
 * throw during Framer's static render — which fails the whole publish.
 */
function withFallbacks(media: MediaItem[] | undefined): MediaItem[] {
    const source =
        Array.isArray(media) && media.length > 0 ? media : defaultMedia

    return source.filter(Boolean).map((item, index) => {
        const srcs = (Array.isArray(item?.srcs) ? item.srcs : [])
            // ControlType.Image yields a bare URL, ResponsiveImage an object.
            .map((image: any) =>
                typeof image === "string" ? { src: image } : image
            )
            .filter(
                (image) =>
                    image &&
                    typeof image.src === "string" &&
                    image.src.length > 0
            )
            .map((image) => ({
                src: image.src,
                srcSet: image.srcSet,
                alt: image.alt,
            }))

        return {
            ...item,
            srcs:
                srcs.length > 0
                    ? srcs
                    : [
                          {
                              src: FALLBACK_IMAGES[
                                  index % FALLBACK_IMAGES.length
                              ],
                              alt: "",
                          },
                      ],
        }
    })
}

/** Deterministic, SSR-safe scope name — same on the server and in the browser. */
function hash(input: string): string {
    let h = 5381
    for (let i = 0; i < input.length; i++) {
        h = ((h << 5) + h + input.charCodeAt(i)) >>> 0
    }
    return h.toString(36)
}

/**
 * Inline Media Text
 *
 * A responsive paragraph with images woven into the text flow.
 * Media slots are placed via "Media Positions" (percentage through the text);
 * leave that list empty to distribute them evenly.
 *
 * Breakpoints are driven by CSS custom properties, so the first paint is
 * already correct — no resize listener, no layout flash after hydration.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function InlineMediaText(props: InlineMediaTextProps) {
    const isStatic = useIsStaticRenderer()

    const {
        text = "By merging design and technology, we create systems that are flexible, scalable, and easy to use. The result is a seamless experience that feels natural, engaging, and built to last.",
        media: mediaProp,
        fontSize = 44,
        fontSizeTablet = 24,
        fontSizeMobile = 18,
        mediaSize = 1.5,
        mediaSizeTablet = 1.1,
        mediaSizeMobile = 1.5,
        borderRadius = 7,
        spacing = 0.1,
        spacingTablet = 0.12,
        spacingMobile = 0.1,
        textColor = "#FFFFFF",
        font,
        autoMediaCount = 4,
        globalDuration = 3000,
        globalTransition = 500,
        mediaPositions = [10, 25, 55, 88],
        hoverScale = 2.5,
        hoverAspectRatio = 1.85,
        hoverTransition = 400,
        enableHoverExpansion = true,
        tapToExpand = true,
    } = props

    const media = useMemo(() => withFallbacks(mediaProp), [mediaProp])

    const rootRef = useRef<HTMLDivElement>(null)
    // Derived from the values the stylesheet contains, so server and client
    // agree without useId(), and identical instances share one class.
    const scope = `imt-${hash(
        [
            fontSize,
            fontSizeTablet,
            fontSizeMobile,
            mediaSize,
            mediaSizeTablet,
            mediaSizeMobile,
            spacing,
            spacingTablet,
            spacingMobile,
            hoverScale,
            borderRadius,
        ].join(",")
    )}`

    const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)
    const [tappedSlot, setTappedSlot] = useState<number | null>(null)
    // Keeps the collapsing slot above its neighbours — z-index is not animatable.
    const [lastActiveSlot, setLastActiveSlot] = useState<number | null>(null)
    // Assume hover until the client tells us otherwise; matches the static render.
    const [hasHover, setHasHover] = useState(true)

    /* ---------------------------------------------------------------- input */

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return

        const query = window.matchMedia("(hover: hover) and (pointer: fine)")
        const update = () => setHasHover(query.matches)

        update()
        query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [])

    // Collapse a tapped slot when the next tap lands outside the component.
    useEffect(() => {
        if (tappedSlot === null || typeof document === "undefined") return

        const onPointerDown = (event: PointerEvent) => {
            if (rootRef.current?.contains(event.target as Node)) return
            setTappedSlot(null)
        }

        document.addEventListener("pointerdown", onPointerDown)
        return () => document.removeEventListener("pointerdown", onPointerDown)
    }, [tappedSlot])

    useEffect(() => {
        const active = tappedSlot ?? hoveredSlot
        if (active !== null) setLastActiveSlot(active)
    }, [hoveredSlot, tappedSlot])

    /* -------------------------------------------------------------- cycling */

    const [currentIndices, setCurrentIndices] = useState<number[]>([])

    // Only the slot count, image count and per-slot duration matter to the
    // timers — keying on that instead of the array identity keeps the
    // intervals alive when Framer hands us a fresh array on every render.
    const cycleSignature = media
        .map((item) => `${item.srcs.length}:${item.duration || 0}`)
        .join("|")

    const mediaRef = useRef(media)
    mediaRef.current = media

    useEffect(() => {
        if (isStatic) return

        const intervals: ReturnType<typeof setInterval>[] = []

        mediaRef.current.forEach((item, slotIndex) => {
            const frames = item.srcs.length
            if (frames <= 1) return

            const duration = item.duration || globalDuration

            intervals.push(
                setInterval(() => {
                    setCurrentIndices((prev) => {
                        const next = [...prev]
                        next[slotIndex] = ((next[slotIndex] ?? 0) + 1) % frames
                        return next
                    })
                }, duration)
            )
        })

        return () => intervals.forEach(clearInterval)
    }, [cycleSignature, globalDuration, isStatic])

    /* ------------------------------------------------------- responsive css */

    const clampScale = (factor: number, ceiling: number) =>
        Math.round(Math.min(hoverScale * factor, ceiling) * 1000) / 1000

    const vars = (
        fontPx: number,
        sizeEm: number,
        gapEm: number,
        scale: number
    ) =>
        `--imt-font:${fontPx}px;--imt-media:${sizeEm}em;--imt-gap:${gapEm}em;--imt-scale:${scale};`

    const css = [
        `.${scope}{${vars(fontSize, mediaSize, spacing, hoverScale)}}`,
        `@media (max-width:1023px){.${scope}{${vars(fontSizeTablet, mediaSizeTablet, spacingTablet, clampScale(0.8, 2.5))}}}`,
        `@media (max-width:767px){.${scope}{${vars(fontSizeMobile, mediaSizeMobile, spacingMobile, clampScale(0.6, 2))}}}`,
        `.${scope} a{color:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent;}`,
        `.${scope} a:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:${borderRadius}px;}`,
        `@media (prefers-reduced-motion:reduce){.${scope} *{transition-duration:1ms !important;}}`,
    ].join("")

    /* ----------------------------------------------------------- slot render */

    const tapFirst = enableHoverExpansion && tapToExpand && !hasHover

    const renderSlot = (
        item: MediaItem,
        index: number,
        wordAt: number,
        lastWord: number
    ): ReactNode => {
        const frames = item.srcs.length
        const activeIndex = isStatic ? 0 : (currentIndices[index] ?? 0) % frames
        const transitionMs = item.transitionDuration || globalTransition

        const isExpanded =
            enableHoverExpansion &&
            (hoveredSlot === index || tappedSlot === index)

        const expandedWidth = `calc(var(--imt-media) * var(--imt-scale) * ${hoverAspectRatio})`
        const expandedHeight = `calc(var(--imt-media) * var(--imt-scale))`

        const link = item.link || ""
        const target = item.linkTarget || "_self"
        const Tag: any = link ? "a" : "span"

        const handleClick = (event: React.MouseEvent) => {
            if (!enableHoverExpansion) return

            if (tapFirst && tappedSlot !== index) {
                // First tap expands; the link (if any) waits for the second one.
                event.preventDefault()
                setTappedSlot(index)
                return
            }

            if (tapFirst) setTappedSlot(null)
        }

        return (
            <Tag
                key={`slot-${index}`}
                {...(link
                    ? {
                          href: link,
                          target,
                          rel:
                              target === "_blank"
                                  ? "noopener noreferrer"
                                  : undefined,
                      }
                    : {})}
                style={{
                    display: "inline-block",
                    verticalAlign: "middle",
                    position: "relative",
                    width: "var(--imt-media)",
                    height: "var(--imt-media)",
                    marginLeft: wordAt === 0 ? 0 : "var(--imt-gap)",
                    marginRight: wordAt === lastWord ? 0 : "var(--imt-gap)",
                    cursor: link || tapFirst ? "pointer" : "default",
                }}
                onMouseEnter={() => hasHover && setHoveredSlot(index)}
                onMouseLeave={() => hasHover && setHoveredSlot(null)}
                onFocus={() => enableHoverExpansion && setHoveredSlot(index)}
                onBlur={() => setHoveredSlot(null)}
                onClick={handleClick}
            >
                <span
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: isExpanded ? expandedWidth : "var(--imt-media)",
                        height: isExpanded
                            ? expandedHeight
                            : "var(--imt-media)",
                        borderRadius: `${borderRadius}px`,
                        overflow: "hidden",
                        zIndex: isExpanded
                            ? 100
                            : index === lastActiveSlot
                              ? 50
                              : 1,
                        transition: [
                            `width ${hoverTransition}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                            `height ${hoverTransition}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                            `box-shadow ${hoverTransition}ms ease`,
                        ].join(", "),
                        willChange: "width, height",
                        boxShadow: isExpanded
                            ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)"
                            : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        pointerEvents: "none",
                    }}
                >
                    {item.srcs.map((image, frame) => {
                        const isActive = frame === activeIndex
                        return (
                            <img
                                key={frame}
                                src={image.src}
                                srcSet={image.srcSet}
                                alt={isActive ? image.alt || "" : ""}
                                aria-hidden={isActive ? undefined : true}
                                loading={frame === 0 ? "eager" : "lazy"}
                                decoding="async"
                                draggable={false}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    opacity: isActive ? 1 : 0,
                                    transition: `opacity ${transitionMs}ms ease-in-out`,
                                }}
                            />
                        )
                    })}
                </span>
            </Tag>
        )
    }

    /* ------------------------------------------------------------- assembly */

    // Keep the separators so newlines and double spaces from the textarea survive.
    const tokens = text.split(/(\s+)/)
    const totalWords = tokens.filter((token) => /\S/.test(token)).length
    const slotCount = Math.min(Math.max(autoMediaCount, 0), media.length)

    // wordIndex -> media slots that go in front of that word.
    // totalWords is a valid key and means "append after the last word".
    const slotsAtWord = new Map<number, number[]>()

    if (slotCount > 0 && totalWords > 0) {
        const positions = Array.from({ length: slotCount }, (_, i) => {
            const percentage = mediaPositions?.[i]
            const at =
                typeof percentage === "number"
                    ? Math.round((percentage / 100) * totalWords)
                    : Math.round(((i + 1) * totalWords) / (slotCount + 1))
            return Math.max(0, Math.min(at, totalWords))
        }).sort((a, b) => a - b)

        positions.forEach((at, slot) => {
            const existing = slotsAtWord.get(at)
            if (existing) existing.push(slot)
            else slotsAtWord.set(at, [slot])
        })
    }

    const content: ReactNode[] = []
    let wordIndex = 0

    for (const token of tokens) {
        if (/\S/.test(token)) {
            slotsAtWord
                .get(wordIndex)
                ?.forEach((slot) =>
                    content.push(
                        renderSlot(media[slot], slot, wordIndex, totalWords)
                    )
                )
            wordIndex++
        }
        content.push(token)
    }

    slotsAtWord
        .get(totalWords)
        ?.forEach((slot) =>
            content.push(renderSlot(media[slot], slot, totalWords, totalWords))
        )

    const fontStyles: CSSProperties = {
        fontFamily: font?.fontFamily || "sans-serif",
        fontWeight: font?.fontWeight ?? 500,
        lineHeight: font?.lineHeight || "1.3em",
        letterSpacing: font?.letterSpacing || "-0.02em",
        fontStyle: font?.fontStyle || "normal",
        textAlign: font?.textAlign || "left",
    }

    return (
        <div
            ref={rootRef}
            className={scope}
            // Clips sideways only; expanded media may still overflow the line
            // vertically, but an oversized slot can no longer scroll the page.
            style={{ width: "100%", overflowX: "clip" }}
        >
            <style>{css}</style>
            <p
                style={{
                    ...fontStyles,
                    fontSize: "var(--imt-font)",
                    color: textColor,
                    whiteSpace: "pre-wrap",
                    margin: 0,
                    padding: 0,
                }}
            >
                {content}
            </p>
        </div>
    )
}

addPropertyControls(InlineMediaText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "By merging design and technology, we create systems that are flexible, scalable, and easy to use. The result is a seamless experience that feels natural, engaging, and built to last.",
        displayTextArea: true,
        placeholder: "Enter text...",
    },
    media: {
        type: ControlType.Array,
        title: "Media Slots",
        control: {
            type: ControlType.Object,
            controls: {
                srcs: {
                    type: ControlType.Array,
                    title: "Images",
                    description:
                        "Cycles through these. Fill in alt text — it is the accessible name when the slot has a link.",
                    // TEST 2: if publishing still fails, swap this line for
                    //     control: { type: ControlType.Image },
                    // The code above handles both shapes.
                    control: { type: ControlType.ResponsiveImage },
                    defaultValue: [
                        { src: FALLBACK_IMAGES[0], alt: "Gradient 1 - Blue" },
                    ],
                    maxCount: 20,
                },
                duration: {
                    type: ControlType.Number,
                    title: "Duration",
                    defaultValue: 3000,
                    min: 500,
                    max: 20000,
                    step: 100,
                    unit: "ms",
                    displayStepper: true,
                },
                transitionDuration: {
                    type: ControlType.Number,
                    title: "Transition",
                    defaultValue: 500,
                    min: 0,
                    max: 2000,
                    step: 50,
                    unit: "ms",
                    displayStepper: true,
                },
                // TEST 1: was ControlType.Link with defaultValue "". Framer
                // resolves Link values at publish time only — never on the
                // canvas or in preview — so an invalid value fails there first.
                link: {
                    type: ControlType.String,
                    title: "Link URL",
                    defaultValue: "",
                    placeholder: "https://…",
                },
                linkTarget: {
                    type: ControlType.Enum,
                    title: "Link Target",
                    options: ["_self", "_blank"],
                    optionTitles: ["Same Tab", "New Tab"],
                    defaultValue: "_self",
                    displaySegmentedControl: true,
                },
            },
        },
        defaultValue: defaultMedia,
        maxCount: 10,
    },
    mediaPositions: {
        type: ControlType.Array,
        title: "Media Positions",
        description:
            "Where each slot sits, as a percentage through the text. 0 = before the first word, 100 = after the last. Leave empty to distribute evenly.",
        control: {
            type: ControlType.Number,
            min: 0,
            max: 100,
            step: 5,
            unit: "%",
        },
        defaultValue: [10, 25, 55, 88],
        maxCount: 10,
    },
    autoMediaCount: {
        type: ControlType.Number,
        title: "Media Count",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    globalDuration: {
        type: ControlType.Number,
        title: "Global Duration",
        description: "Used by slots that have no duration of their own.",
        defaultValue: 3000,
        min: 500,
        max: 20000,
        step: 100,
        unit: "ms",
        displayStepper: true,
    },
    globalTransition: {
        type: ControlType.Number,
        title: "Global Transition",
        defaultValue: 500,
        min: 0,
        max: 2000,
        step: 50,
        unit: "ms",
        displayStepper: true,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        description: "Wins over the size set in Typography.",
        defaultValue: 44,
        min: 8,
        max: 120,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    fontSizeTablet: {
        type: ControlType.Number,
        title: "Font Size (Tablet)",
        defaultValue: 24,
        min: 8,
        max: 120,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    fontSizeMobile: {
        type: ControlType.Number,
        title: "Font Size (Mobile)",
        defaultValue: 18,
        min: 8,
        max: 120,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    mediaSize: {
        type: ControlType.Number,
        title: "Media Size",
        defaultValue: 1.5,
        min: 0.5,
        max: 3,
        step: 0.1,
        unit: "em",
        displayStepper: true,
    },
    mediaSizeTablet: {
        type: ControlType.Number,
        title: "Media Size (Tablet)",
        defaultValue: 1.1,
        min: 0.5,
        max: 3,
        step: 0.1,
        unit: "em",
        displayStepper: true,
    },
    mediaSizeMobile: {
        type: ControlType.Number,
        title: "Media Size (Mobile)",
        defaultValue: 1.5,
        min: 0.5,
        max: 3,
        step: 0.1,
        unit: "em",
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 7,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 0.1,
        min: 0,
        max: 1,
        step: 0.05,
        unit: "em",
        displayStepper: true,
    },
    spacingTablet: {
        type: ControlType.Number,
        title: "Spacing (Tablet)",
        defaultValue: 0.12,
        min: 0,
        max: 1,
        step: 0.05,
        unit: "em",
        displayStepper: true,
    },
    spacingMobile: {
        type: ControlType.Number,
        title: "Spacing (Mobile)",
        defaultValue: 0.1,
        min: 0,
        max: 1,
        step: 0.05,
        unit: "em",
        displayStepper: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Medium",
            letterSpacing: "-0.02em",
            lineHeight: "1.3em",
            textAlign: "left",
        },
    },
    enableHoverExpansion: {
        type: ControlType.Boolean,
        title: "Hover Expansion",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        description: "Scaled down automatically on tablet and mobile.",
        defaultValue: 2.5,
        min: 1.2,
        max: 5,
        step: 0.1,
        displayStepper: true,
        hidden: ({ enableHoverExpansion }) => !enableHoverExpansion,
    },
    hoverAspectRatio: {
        type: ControlType.Number,
        title: "Hover Aspect Ratio",
        description: "Width / height when expanded (1.85 ≈ 16:9, 2 = 2:1).",
        defaultValue: 1.85,
        min: 1,
        max: 3,
        step: 0.05,
        displayStepper: true,
        hidden: ({ enableHoverExpansion }) => !enableHoverExpansion,
    },
    hoverTransition: {
        type: ControlType.Number,
        title: "Hover Transition",
        defaultValue: 400,
        min: 100,
        max: 1000,
        step: 50,
        unit: "ms",
        displayStepper: true,
        hidden: ({ enableHoverExpansion }) => !enableHoverExpansion,
    },
    tapToExpand: {
        type: ControlType.Boolean,
        title: "Tap to Expand",
        description:
            "On devices without hover: first tap expands, second tap follows the link.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableHoverExpansion }) => !enableHoverExpansion,
    },
})
