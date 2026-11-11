import * as React from "react"
import {
    motion,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
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


/**
 * User request implemented:
 * - Make story text and inline component placement editable from Framer controls
 *   (no file editing needed), while preserving existing visuals and animation.
 * - Keep backward compatibility with legacy slots and timing values.
 * - Keep safe SSR behavior, reduced-motion support, and robust width-fill/height-auto sizing.
 */
const DEFAULT_STORY_TEXT =
    "Introducing a smarter way to tell your story. [] Reveal your message one word at a time, and drop anything right into the sentence — [] a photo, an icon, a button, anything flows naturally with the words.\nScroll to see it come together. []"

/**
 * SCROLL SYSTEM
 *
 * The complete section is tall. Its inner stage remains sticky for one
 * viewport while section progress advances a shared word/component index.
 */
const DESIGN = {
    horizontalPadding: 0,

    /** Minimum runway. Longer stories automatically receive more scroll. */
    minimumScrollLengthVh: 260,
    scrollVhPerItem: 30,

    letterSpacing: "-0.055em",
    wordGap: "0.2em",

    /** Unreached text remains visible at this opacity. */
    dimOpacity: 0.18,
    componentDimOpacity: 0.12,
    transitionDuration: 0.72,
    transitionEase: [0.16, 1, 0.3, 1] as [number, number, number, number],
    minimumRevealSpeed: 0.5,
    maximumRevealSpeed: 5,

    /** Paint an expanding component above the words it overlaps. */
    expandedZIndex: 5,
    activeZIndex: 2,
    restingZIndex: 1,
}

type TextToken = {
    type: "text"
    value: string
    /** "word" reveals each word; "phrase" reveals the complete value. */
    reveal?: "word" | "phrase"
    color?: string
}

type ComponentToken = {
    type: "component"
    /** Positive moves down; negative moves up. */
    offsetY?: number
    /** Positive moves right; negative moves left. */
    offsetX?: number
    ariaLabel?: string
}

type BreakToken = {
    type: "break"
}

type StoryToken = TextToken | ComponentToken | BreakToken
type AlignmentPoint = "top" | "center" | "bottom"
type OffsetKeyword = "start" | "center" | "end"
type ScrollOffsetPair = `${OffsetKeyword} ${OffsetKeyword}`

type RenderUnit =
    | {
          kind: "text"
          key: string
          timelineIndex: number
          value: string
          color?: string
      }
    | {
          kind: "component"
          key: string
          timelineIndex: number
          componentIndex: number
          token: ComponentToken
      }
    | {
          kind: "break"
          key: string
      }

type ScrollStoryInlineProps = {
    /**
     * Framer slot outlet. Keep this as `children` so attached layers remain
     * real, interactive descendants in Preview/Publish.
     */
    children?: React.ReactNode

    /** CSS font object returned by Framer's Font Property Control. */
    font?: React.CSSProperties

    /** Font size controlled separately in the Properties panel. */
    fontSize?: number
    storyText?: string
    originalSize?: boolean
    componentWidth?: number
    componentHeight?: number

    /** Applied to text words only, never to the connected component. */
    textColor?: string

    /** Keep the story pinned, or let it travel normally with the page. */
    scrollBehavior?: "sticky" | "flow"

    /** Scrub continuously with scroll, or activate complete items. */
    revealMode?: "smooth" | "stepped"

    /** How scroll progress is triggered and measured. */
    triggerMode?: "onScroll" | "layerInView" | "sectionInView"

    /** Target point for when in-view reveal starts. */
    startPoint?: AlignmentPoint
    /** Viewport point the start point must reach before reveal begins. */
    startsAt?: AlignmentPoint
    /** Target point for when in-view reveal completes. */
    endPoint?: AlignmentPoint
    /** Viewport point the end point must reach when reveal completes. */
    endsAt?: AlignmentPoint

    /** Reveal pacing multiplier. Lower is slower; higher is faster. */
    revealSpeed?: number

    /**
     * How the paragraph responds when a slotted component grows.
     *
     * "widthOnly" — words reflow around the extra width, while extra height
     * overlaps the text and leaves the line height untouched.
     * "both" — the line grows in both directions, as before.
     */
    expandBehavior?: "widthOnly" | "both"

    /**
     * What sets the height of a paragraph row that contains a component.
     *
     * "textLine" — the row keeps the text line height and the component
     * overlaps it, so line height stays uniform down the paragraph.
     * "component" — the row grows to the component's resting height.
     */
    lineFit?: "textLine" | "component"

    /** Slot 1 timing mode. */
    component1Start?: "onScroll" | "immediate"
    /** Slot 2 timing mode. */
    component2Start?: "onScroll" | "immediate"
    /** Slot 3 timing mode. */
    component3Start?: "onScroll" | "immediate"
    /** Slot 4 timing mode. */
    component4Start?: "onScroll" | "immediate"
    /** Slot 5 timing mode. */
    component5Start?: "onScroll" | "immediate"
    /** Slot 6 timing mode. */
    component6Start?: "onScroll" | "immediate"
    /** Slot 7 timing mode. */
    component7Start?: "onScroll" | "immediate"
    /** Slot 8 timing mode. */
    component8Start?: "onScroll" | "immediate"
    /** Slot 9 timing mode. */
    component9Start?: "onScroll" | "immediate"
    /** Slot 10 timing mode. */
    component10Start?: "onScroll" | "immediate"
    /** Slot 11 timing mode. */
    component11Start?: "onScroll" | "immediate"
    /** Slot 12 timing mode. */
    component12Start?: "onScroll" | "immediate"

    /** Framer-provided sizing and positioning styles. */
    style?: React.CSSProperties

    /**
     * Dynamic per-component timing list (mapped to Slot item order).
     */
    componentTiming?: Array<{
        startMode?: "onScroll" | "immediate"
        offsetX?: number
        offsetY?: number
        ariaLabel?: string
        customSize?: boolean
        width?: number
        height?: number
    }>
    /**
     * Legacy timing schema used by older instances.
     * Example: [{ timing: "Start on Scroll", id: "default-item-0" }]
     */
    storyComponents?: Array<{
        timing?: "Start on Scroll" | "Start Immediately" | string
        startMode?: "onScroll" | "immediate"
        id?: string
    }>
    /**
     * Editable story structure (text / component / break) for ordering inline
     * words and slot positions directly from Framer controls.
     */
    storyItems?: Array<
        | StoryToken
        | {
              itemType?: "Text" | "Inline Component" | "Line Break" | string
              text?: string
              revealAs?: "Words" | "Phrase" | string
              offsetX?: number
              offsetY?: number
              aRIALabel?: string
              ariaLabel?: string
          }
    >
}

function buildRenderUnits(tokens: StoryToken[]): RenderUnit[] {
    const units: RenderUnit[] = []
    let timelineIndex = 0
    let componentIndex = 0

    tokens.forEach((token, tokenIndex) => {
        if (token.type === "break") {
            units.push({ kind: "break", key: `break-${tokenIndex}` })
            return
        }

        if (token.type === "component") {
            units.push({
                kind: "component",
                key: `component-${tokenIndex}`,
                timelineIndex: timelineIndex++,
                componentIndex: componentIndex++,
                token,
            })
            return
        }

        if (token.reveal === "phrase") {
            units.push({
                kind: "text",
                key: `phrase-${tokenIndex}`,
                timelineIndex: timelineIndex++,
                value: token.value,
                color: token.color,
            })
            return
        }

        token.value
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .forEach((word, wordIndex) => {
                units.push({
                    kind: "text",
                    key: `word-${tokenIndex}-${wordIndex}`,
                    timelineIndex: timelineIndex++,
                    value: word,
                    color: token.color,
                })
            })
    })

    return units
}

/**
 * Scroll subscriptions only exist in Preview and on published pages.
 * Keeping them in a separate component means useScroll never even mounts
 * on the Framer canvas or during static asset export.
 */
function LiveScrollProgress({
    sectionRef,
    stageRef,
    triggerMode,
    scrollBehavior,
    inViewOffsets,
    onProgress,
}: {
    sectionRef: React.RefObject<HTMLElement | null>
    stageRef: React.RefObject<HTMLDivElement | null>
    triggerMode: NonNullable<ScrollStoryInlineProps["triggerMode"]>
    scrollBehavior: NonNullable<ScrollStoryInlineProps["scrollBehavior"]>
    inViewOffsets: [ScrollOffsetPair, ScrollOffsetPair]
    onProgress: React.Dispatch<React.SetStateAction<number>>
}) {
    const scrollTargetRef =
        triggerMode === "layerInView" ? stageRef : sectionRef
    const { scrollYProgress } = useScroll({
        target: scrollTargetRef,
        offset:
            triggerMode === "onScroll"
                ? scrollBehavior === "sticky"
                    ? ["start start", "end end"]
                    : ["start 90%", "end 10%"]
                : inViewOffsets,
    })

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        React.startTransition(() => onProgress(latest))
    })

    return null
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ScrollStoryInline(props: ScrollStoryInlineProps) {
    const {
        children,
        font = {},
        fontSize = 48,
        storyText,
        originalSize = false,
        componentWidth = 80,
        componentHeight = 80,
        textColor = "#1D1D1A",
        scrollBehavior = "flow",
        revealMode = "smooth",
        triggerMode = "onScroll",
        startPoint = "top",
        startsAt = "bottom",
        endPoint = "bottom",
        endsAt = "top",
        revealSpeed = 1,
        expandBehavior = "widthOnly",
        lineFit = "textLine",
        component1Start = "onScroll",
        component2Start = "onScroll",
        component3Start = "onScroll",
        component4Start = "onScroll",
        component5Start = "onScroll",
        component6Start = "onScroll",
        component7Start = "onScroll",
        component8Start = "onScroll",
        component9Start = "onScroll",
        component10Start = "onScroll",
        component11Start = "onScroll",
        component12Start = "onScroll",
        componentTiming = [],
        storyComponents = [],
        storyItems,
        style,
    } = props

    const sectionRef = React.useRef<HTMLElement | null>(null)
    const stageRef = React.useRef<HTMLDivElement | null>(null)
    const isStaticRenderer = useIsStaticRenderer()
    const shouldReduceMotion = useReducedMotion()
    const isFramerCanvas = RenderTarget.current() === RenderTarget.canvas
    const normalizedLegacyStoryItems = React.useMemo<StoryToken[]>(
        () => normalizeStoryItems(storyItems),
        [storyItems]
    )
    const activeStoryItems = React.useMemo<StoryToken[]>(() => {
        if (typeof storyText === "string") {
            return parseStoryTextToTokens(storyText)
        }

        if (normalizedLegacyStoryItems.length > 0) {
            return normalizedLegacyStoryItems
        }

        return parseStoryTextToTokens(DEFAULT_STORY_TEXT)
    }, [storyText, normalizedLegacyStoryItems])
    const units = React.useMemo(
        () => buildRenderUnits(activeStoryItems),
        [activeStoryItems]
    )
    const legacySlottedChildren = React.useMemo(
        () => React.Children.toArray(children),
        [children]
    )
    const childIdentitySignatures = React.useMemo(
        () =>
            legacySlottedChildren.map((child) => {
                if (!React.isValidElement(child)) {
                    return typeof child
                }
                const typedChildType = child.type as {
                    displayName?: string
                    name?: string
                }
                const childType =
                    typeof child.type === "string"
                        ? child.type
                        : (typedChildType.displayName ??
                          typedChildType.name ??
                          "component")
                return `${childType}::${String(child.key ?? "")}`
            }),
        [legacySlottedChildren]
    )
    const itemCount = React.useMemo(
        () => units.filter((unit) => unit.kind !== "break").length,
        [units]
    )
    const componentUnits = React.useMemo(
        () =>
            units.filter(
                (unit): unit is Extract<RenderUnit, { kind: "component" }> =>
                    unit.kind === "component"
            ),
        [units]
    )
    const accessibleText = React.useMemo(
        () =>
            activeStoryItems
                .filter((token): token is TextToken => token.type === "text")
                .map((token) => token.value)
                .join(" "),
        [activeStoryItems]
    )

    const inViewOffsets = React.useMemo<[ScrollOffsetPair, ScrollOffsetPair]>(
        () => buildInViewOffsets(startPoint, startsAt, endPoint, endsAt),
        [startPoint, startsAt, endPoint, endsAt]
    )

    const [scrollProgress, setScrollProgress] = React.useState(() =>
        isStaticRenderer ? 1 : 0
    )

    const speedCurveProgress = React.useMemo(() => {
        const safeSpeed = clamp(
            revealSpeed,
            DESIGN.minimumRevealSpeed,
            DESIGN.maximumRevealSpeed
        )
        const curved = 1 - Math.pow(1 - clamp(scrollProgress, 0, 1), safeSpeed)
        return clamp(curved, 0, 1)
    }, [scrollProgress, revealSpeed])

    const effectiveProgress =
        isStaticRenderer || shouldReduceMotion ? 1 : speedCurveProgress
    const revealCursor = effectiveProgress * (itemCount + 1) - 1
    const scrollLengthVh = React.useMemo(() => {
        const safeSpeed = clamp(
            revealSpeed,
            DESIGN.minimumRevealSpeed,
            DESIGN.maximumRevealSpeed
        )
        const baseLength = Math.max(
            DESIGN.minimumScrollLengthVh,
            100 + itemCount * DESIGN.scrollVhPerItem
        )
        return Math.max(120, baseLength / safeSpeed)
    }, [itemCount, revealSpeed])
    const showStickyRunway =
        !isStaticRenderer && scrollBehavior === "sticky" && !shouldReduceMotion

    const legacyStartModes = React.useMemo(
        () => [
            component1Start,
            component2Start,
            component3Start,
            component4Start,
            component5Start,
            component6Start,
            component7Start,
            component8Start,
            component9Start,
            component10Start,
            component11Start,
            component12Start,
        ],
        [
            component1Start,
            component2Start,
            component3Start,
            component4Start,
            component5Start,
            component6Start,
            component7Start,
            component8Start,
            component9Start,
            component10Start,
            component11Start,
            component12Start,
        ]
    )

    const componentStartModes = React.useMemo(
        () =>
            normalizeComponentStartModes(
                componentTiming,
                storyComponents,
                legacyStartModes
            ),
        [componentTiming, storyComponents, legacyStartModes]
    )
    const componentVisualSettings = React.useMemo(
        () => normalizeComponentVisualSettings(componentTiming),
        [componentTiming]
    )
    const sharedComponentSize = React.useMemo(
        () => ({
            width: clamp(componentWidth, 8, 1200),
            height: clamp(componentHeight, 8, 1200),
        }),
        [componentWidth, componentHeight]
    )

    const activeComponentIndices = React.useMemo(() => {
        if (isStaticRenderer || shouldReduceMotion) {
            return new Set(componentUnits.map((unit) => unit.componentIndex))
        }

        const active = new Set<number>()
        componentUnits.forEach((unit) => {
            const unitProgress =
                revealMode === "smooth"
                    ? clamp(revealCursor - unit.timelineIndex + 1, 0, 1)
                    : revealCursor >= unit.timelineIndex
                      ? 1
                      : 0

            if (unitProgress >= 0.999) active.add(unit.componentIndex)
        })

        return active
    }, [
        componentUnits,
        isStaticRenderer,
        shouldReduceMotion,
        revealMode,
        revealCursor,
    ])

    const [componentMountEpochs, setComponentMountEpochs] = React.useState<
        Record<number, number>
    >({})
    const previousActiveComponentIndicesRef = React.useRef<Set<number>>(
        new Set<number>()
    )

    React.useEffect(() => {
        if (isStaticRenderer) return
        const previouslyActive = previousActiveComponentIndicesRef.current
        const enteredIndices: number[] = []

        activeComponentIndices.forEach((componentIndex) => {
            if (!previouslyActive.has(componentIndex)) {
                enteredIndices.push(componentIndex)
            }
        })

        previousActiveComponentIndicesRef.current = new Set(
            activeComponentIndices
        )

        if (enteredIndices.length === 0) return

        React.startTransition(() => {
            setComponentMountEpochs((previousEpochs) => {
                const nextEpochs = { ...previousEpochs }
                enteredIndices.forEach((componentIndex) => {
                    nextEpochs[componentIndex] =
                        (nextEpochs[componentIndex] ?? 0) + 1
                })
                return nextEpochs
            })
        })
    }, [activeComponentIndices, isStaticRenderer])

    /**
     * EXPANSION BEHAVIOR
     *
     * Each slot measures the height it has while it is not being interacted
     * with. That resting height is then locked onto the flex item that sits in
     * the paragraph, so the line box never grows when the component expands
     * downward — the extra height simply overflows and overlaps the words.
     * Width is left intrinsic, so horizontal growth still reflows the text.
     */
    const [restingSlotHeights, setRestingSlotHeights] = React.useState<
        Record<number, number>
    >({})
    const restingSlotHeightsRef = React.useRef<Record<number, number>>({})
    const [restingIntrinsicSizes, setRestingIntrinsicSizes] = React.useState<
        Record<number, { width: number; height: number }>
    >({})
    const restingIntrinsicSizesRef = React.useRef<
        Record<number, { width: number; height: number }>
    >({})
    const intrinsicSizeLockedRef = React.useRef<Record<number, boolean>>({})
    const previousChildIdentitySignaturesRef = React.useRef<string[]>([])
    const [expandedComponentIndex, setExpandedComponentIndex] = React.useState<
        number | null
    >(null)
    const expandedComponentIndexRef = React.useRef<number | null>(null)
    const measuredSlotIndicesRef = React.useRef(new Map<Element, number>())
    const slotResizeObserverRef = React.useRef<ResizeObserver | null>(null)
    const measuredIntrinsicIndicesRef = React.useRef(new Map<Element, number>())
    const intrinsicResizeObserverRef = React.useRef<ResizeObserver | null>(null)
    const slotRefCallbacksRef = React.useRef(
        new Map<number, (element: HTMLDivElement | null) => void>()
    )
    const intrinsicRefCallbacksRef = React.useRef(
        new Map<number, (element: HTMLDivElement | null) => void>()
    )

    const setExpandedSlot = React.useCallback(
        (componentIndex: number | null) => {
            expandedComponentIndexRef.current = componentIndex
            React.startTransition(() =>
                setExpandedComponentIndex(componentIndex)
            )
        },
        []
    )

    const clearExpandedSlot = React.useCallback((componentIndex: number) => {
        if (expandedComponentIndexRef.current !== componentIndex) return
        expandedComponentIndexRef.current = null
        React.startTransition(() => setExpandedComponentIndex(null))
    }, [])

    const handleSlotResize = React.useCallback(
        (entries: ResizeObserverEntry[]) => {
            let nextHeights: Record<number, number> | null = null

            entries.forEach((entry) => {
                const componentIndex = measuredSlotIndicesRef.current.get(
                    entry.target
                )
                if (componentIndex === undefined) return
                // Ignore measurements taken while the slot is expanded, so the
                // locked height stays the resting one.
                if (expandedComponentIndexRef.current === componentIndex) return

                const height = (entry.target as HTMLElement).offsetHeight
                if (!height) return
                if (restingSlotHeightsRef.current[componentIndex] === height) {
                    return
                }

                nextHeights = nextHeights ?? {
                    ...restingSlotHeightsRef.current,
                }
                nextHeights[componentIndex] = height
            })

            if (!nextHeights) return
            restingSlotHeightsRef.current = nextHeights
            const measuredHeights = nextHeights
            React.startTransition(() => setRestingSlotHeights(measuredHeights))
        },
        []
    )

    const handleIntrinsicResize = React.useCallback(
        (entries: ResizeObserverEntry[]) => {
            let nextSizes: Record<
                number,
                { width: number; height: number }
            > | null = null

            entries.forEach((entry) => {
                const componentIndex = measuredIntrinsicIndicesRef.current.get(
                    entry.target
                )
                if (componentIndex === undefined) return
                if (expandedComponentIndexRef.current === componentIndex) return
                const target = entry.target as HTMLElement
                const width = target.offsetWidth
                const height = target.offsetHeight
                if (!width || !height) return
                if (intrinsicSizeLockedRef.current[componentIndex]) return
                const previous =
                    restingIntrinsicSizesRef.current[componentIndex]
                if (
                    previous &&
                    previous.width === width &&
                    previous.height === height
                ) {
                    return
                }

                nextSizes = nextSizes ?? { ...restingIntrinsicSizesRef.current }
                nextSizes[componentIndex] = { width, height }
                intrinsicSizeLockedRef.current[componentIndex] = true
            })

            if (!nextSizes) return
            restingIntrinsicSizesRef.current = nextSizes
            const measuredSizes = nextSizes
            React.startTransition(() => setRestingIntrinsicSizes(measuredSizes))
        },
        []
    )

    const getSlotMeasureRef = (componentIndex: number) => {
        const callbacks = slotRefCallbacksRef.current
        const existing = callbacks.get(componentIndex)
        if (existing) return existing

        const callback = (element: HTMLDivElement | null) => {
            const observed = measuredSlotIndicesRef.current
            const observer = slotResizeObserverRef.current

            observed.forEach((index, target) => {
                if (index !== componentIndex || target === element) return
                observer?.unobserve(target)
                observed.delete(target)
            })

            if (!element) return
            if (typeof ResizeObserver === "undefined") return

            if (!slotResizeObserverRef.current) {
                slotResizeObserverRef.current = new ResizeObserver(
                    handleSlotResize
                )
            }

            observed.set(element, componentIndex)
            slotResizeObserverRef.current.observe(element)
        }

        callbacks.set(componentIndex, callback)
        return callback
    }

    const getIntrinsicMeasureRef = (componentIndex: number) => {
        const callbacks = intrinsicRefCallbacksRef.current
        const existing = callbacks.get(componentIndex)
        if (existing) return existing

        const callback = (element: HTMLDivElement | null) => {
            const observed = measuredIntrinsicIndicesRef.current
            const observer = intrinsicResizeObserverRef.current

            observed.forEach((index, target) => {
                if (index !== componentIndex || target === element) return
                observer?.unobserve(target)
                observed.delete(target)
            })

            if (!element) return
            if (typeof ResizeObserver === "undefined") return

            if (!intrinsicResizeObserverRef.current) {
                intrinsicResizeObserverRef.current = new ResizeObserver(
                    handleIntrinsicResize
                )
            }

            observed.set(element, componentIndex)
            intrinsicResizeObserverRef.current.observe(element)
        }

        callbacks.set(componentIndex, callback)
        return callback
    }

    React.useEffect(() => {
        if (isStaticRenderer) return
        const previousSignatures = previousChildIdentitySignaturesRef.current
        const nextSignatures = childIdentitySignatures
        let nextSizes: Record<
            number,
            { width: number; height: number }
        > | null = null
        let hasReset = false

        const maxLength = Math.max(
            previousSignatures.length,
            nextSignatures.length
        )
        for (let index = 0; index < maxLength; index++) {
            if (previousSignatures[index] === nextSignatures[index]) continue
            if (restingIntrinsicSizesRef.current[index]) {
                nextSizes = nextSizes ?? { ...restingIntrinsicSizesRef.current }
                delete nextSizes[index]
            }
            intrinsicSizeLockedRef.current[index] = false
            hasReset = true
        }

        previousChildIdentitySignaturesRef.current = nextSignatures
        if (!hasReset) return
        if (nextSizes) {
            restingIntrinsicSizesRef.current = nextSizes
            React.startTransition(() => setRestingIntrinsicSizes(nextSizes))
        }
    }, [childIdentitySignatures, isStaticRenderer])

    React.useEffect(() => {
        if (isStaticRenderer) return
        return () => {
            slotResizeObserverRef.current?.disconnect()
            slotResizeObserverRef.current = null
            measuredSlotIndicesRef.current.clear()
            intrinsicResizeObserverRef.current?.disconnect()
            intrinsicResizeObserverRef.current = null
            measuredIntrinsicIndicesRef.current.clear()
            intrinsicSizeLockedRef.current = {}
        }
    }, [isStaticRenderer])

    /**
     * A wrapping flex row is as tall as its tallest item, so a slotted
     * component would otherwise put a floor under the rows it sits in and stop
     * them tightening with the rest of the paragraph. This probe reports the
     * height of a plain text line, which the component rows are then pinned to.
     * offsetHeight is used because it ignores canvas zoom transforms.
     */
    const lineProbeRef = React.useRef<HTMLSpanElement | null>(null)
    const [textLineHeight, setTextLineHeight] = React.useState<
        number | undefined
    >(undefined)
    const fontLineHeight = (font as React.CSSProperties).lineHeight
    const resolvedTextAlign = React.useMemo<"left" | "center" | "right">(() => {
        const value = font?.textAlign
        if (value === "center" || value === "right") return value
        return "left"
    }, [font])
    const rowJustifyContent = React.useMemo<
        "flex-start" | "center" | "flex-end"
    >(() => {
        if (resolvedTextAlign === "center") return "center"
        if (resolvedTextAlign === "right") return "flex-end"
        return "flex-start"
    }, [resolvedTextAlign])
    React.useEffect(() => {
        if (isStaticRenderer) return
        const element = lineProbeRef.current
        if (!element) return

        const measure = () => {
            const height = element.offsetHeight
            if (!height) return
            React.startTransition(() => {
                setTextLineHeight((previousHeight) =>
                    previousHeight !== undefined &&
                    Math.abs(previousHeight - height) < 0.5
                        ? previousHeight
                        : height
                )
            })
        }

        measure()

        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [fontSize, fontLineHeight, isStaticRenderer])

    const rootHeightValue = style?.height
    const rootMinHeightValue = style?.minHeight
    const hasExplicitHeight =
        rootHeightValue !== undefined && rootHeightValue !== null
    const hasExplicitMinHeight =
        rootMinHeightValue !== undefined && rootMinHeightValue !== null
    const rootSectionHeight = hasExplicitHeight ? rootHeightValue : "auto"
    const rootSectionMinHeight = hasExplicitMinHeight
        ? rootMinHeightValue
        : hasExplicitHeight
          ? undefined
          : "max-content"

    const handleInactiveFocusCapture = React.useCallback(
        (event: React.FocusEvent<HTMLDivElement>, isInteractive: boolean) => {
            if (isInteractive) return
            const target = event.target
            if (
                target instanceof HTMLElement &&
                typeof target.blur === "function"
            ) {
                target.blur()
            }
        },
        []
    )

    return (
        <section
            ref={sectionRef}
            aria-label="Interactive story"
            style={{
                ...styles.section,
                ...style,
                height: rootSectionHeight,
                minHeight: rootSectionMinHeight,
                background: "transparent",
            }}
        >
            {!isStaticRenderer && !shouldReduceMotion ? (
                <LiveScrollProgress
                    sectionRef={sectionRef}
                    stageRef={stageRef}
                    triggerMode={triggerMode}
                    scrollBehavior={scrollBehavior}
                    inViewOffsets={inViewOffsets}
                    onProgress={setScrollProgress}
                />
            ) : null}
            <h2 style={styles.screenReaderOnly}>{accessibleText}</h2>

            <div
                ref={stageRef}
                style={{
                    ...styles.stickyStage,
                    position:
                        isStaticRenderer || scrollBehavior === "flow"
                            ? "relative"
                            : "sticky",
                    top:
                        isStaticRenderer || scrollBehavior === "flow"
                            ? undefined
                            : 0,
                }}
            >
                <div
                    className="scroll-story-inline-text"
                    style={{
                        ...styles.story,
                        ...font,
                        fontSize,
                        textAlign: resolvedTextAlign,
                        justifyContent: rowJustifyContent,
                        alignContent: "flex-start",
                    }}
                >
                    <span
                        ref={lineProbeRef}
                        aria-hidden="true"
                        style={styles.lineProbe}
                    >
                        &nbsp;
                    </span>
                    {units.map((unit) => {
                        if (unit.kind === "break") {
                            return (
                                <span
                                    key={unit.key}
                                    aria-hidden="true"
                                    style={styles.lineBreak}
                                />
                            )
                        }

                        // Smooth mode interpolates through each item. Stepped
                        // mode turns the complete item on at its threshold.
                        const unitProgress =
                            revealMode === "smooth"
                                ? clamp(
                                      revealCursor - unit.timelineIndex + 1,
                                      0,
                                      1
                                  )
                                : revealCursor >= unit.timelineIndex
                                  ? 1
                                  : 0

                        if (unit.kind === "text") {
                            const wordStyle: React.CSSProperties = {
                                ...styles.word,
                                color: unit.color ?? textColor,
                                willChange: isStaticRenderer
                                    ? "auto"
                                    : "opacity",
                            }

                            // Render real, motion-free DOM for Framer canvas,
                            // thumbnails and export. Do not instantiate Motion.
                            if (isStaticRenderer) {
                                return (
                                    <span
                                        key={unit.key}
                                        aria-hidden="true"
                                        style={{ ...wordStyle, opacity: 1 }}
                                    >
                                        {unit.value}
                                    </span>
                                )
                            }

                            return (
                                <motion.span
                                    key={unit.key}
                                    aria-hidden="true"
                                    style={wordStyle}
                                    initial={false}
                                    animate={{
                                        opacity: mix(
                                            DESIGN.dimOpacity,
                                            1,
                                            unitProgress
                                        ),
                                    }}
                                    transition={{
                                        duration:
                                            revealMode === "smooth"
                                                ? 0.08
                                                : DESIGN.transitionDuration,
                                        ease: DESIGN.transitionEase,
                                    }}
                                >
                                    {unit.value}
                                </motion.span>
                            )
                        }

                        const componentStartMode =
                            componentStartModes[unit.componentIndex] ??
                            "onScroll"
                        const visualSettings =
                            componentVisualSettings[unit.componentIndex]
                        const resolvedOffsetX =
                            visualSettings?.offsetX ?? unit.token.offsetX ?? 4
                        const resolvedOffsetY =
                            visualSettings?.offsetY ?? unit.token.offsetY ?? 8
                        const resolvedAriaLabel =
                            visualSettings?.ariaLabel ??
                            unit.token.ariaLabel ??
                            "Interactive visual"
                        const targetSize = originalSize
                            ? null
                            : resolveComponentSize(
                                  sharedComponentSize,
                                  visualSettings
                              )
                        const intrinsicSize =
                            restingIntrinsicSizes[unit.componentIndex]
                        const fitScale =
                            targetSize === null
                                ? 1
                                : calculateContainScale(
                                      intrinsicSize,
                                      targetSize
                                  )
                        const shouldStartImmediately =
                            componentStartMode === "immediate"
                        const isComponentActive =
                            isStaticRenderer ||
                            shouldReduceMotion ||
                            activeComponentIndices.has(unit.componentIndex)
                        const shouldMountComponent =
                            shouldStartImmediately || isComponentActive
                        const isComponentInteractive = isComponentActive
                        const componentMountKey = `story-component-${unit.componentIndex}-${componentMountEpochs[unit.componentIndex] ?? 0}`

                        // Once the reveal has finished, drop the transform and
                        // willChange. Either one keeps this wrapper a
                        // containing block for absolutely positioned content
                        // inside the slotted component, which traps an
                        // expanding child in its resting box.
                        const isSettled =
                            isStaticRenderer || unitProgress >= 0.999
                        const isExpanded =
                            expandedComponentIndex === unit.componentIndex
                        const restingHeight =
                            restingSlotHeights[unit.componentIndex] ??
                            (targetSize ? targetSize.height : undefined)
                        // "textLine" keeps every row at the text line height,
                        // so a component never sets a floor under the row it
                        // sits in. "component" pins the row to the component's
                        // resting height instead.
                        const lockedRowHeight =
                            expandBehavior === "both"
                                ? undefined
                                : lineFit === "textLine"
                                  ? textLineHeight
                                  : restingHeight

                        return (
                            <div
                                key={unit.key}
                                onPointerEnter={
                                    isStaticRenderer
                                        ? undefined
                                        : () =>
                                              setExpandedSlot(
                                                  unit.componentIndex
                                              )
                                }
                                onPointerLeave={
                                    isStaticRenderer
                                        ? undefined
                                        : () =>
                                              clearExpandedSlot(
                                                  unit.componentIndex
                                              )
                                }
                                onFocusCapture={
                                    isStaticRenderer
                                        ? undefined
                                        : () =>
                                              setExpandedSlot(
                                                  unit.componentIndex
                                              )
                                }
                                onBlurCapture={
                                    isStaticRenderer
                                        ? undefined
                                        : () =>
                                              clearExpandedSlot(
                                                  unit.componentIndex
                                              )
                                }
                                style={{
                                    ...styles.componentRevealWrapper,
                                    // Height is pinned to the resting
                                    // measurement so vertical growth overlaps
                                    // the paragraph. Width stays intrinsic so
                                    // horizontal growth reflows the words.
                                    width: targetSize?.width,
                                    height: lockedRowHeight,
                                    opacity: isStaticRenderer
                                        ? 1
                                        : mix(
                                              DESIGN.componentDimOpacity,
                                              1,
                                              unitProgress
                                          ),
                                    transform: isSettled
                                        ? "none"
                                        : `scale(${mix(0.94, 1, unitProgress)})`,
                                    willChange: isSettled
                                        ? "auto"
                                        : "transform, opacity",
                                    zIndex: isExpanded
                                        ? DESIGN.expandedZIndex
                                        : isComponentActive
                                          ? DESIGN.activeZIndex
                                          : DESIGN.restingZIndex,
                                    transition: isStaticRenderer
                                        ? "none"
                                        : revealMode === "smooth"
                                          ? "opacity 0.08s linear, transform 0.08s linear"
                                          : `opacity ${DESIGN.transitionDuration}s cubic-bezier(0.16, 1, 0.3, 1), transform ${DESIGN.transitionDuration}s cubic-bezier(0.16, 1, 0.3, 1)`,
                                }}
                            >
                                <div
                                    role="group"
                                    aria-label={resolvedAriaLabel}
                                    style={{
                                        ...styles.componentPositionWrapper,
                                        transform: `translate(${resolvedOffsetX}px, ${resolvedOffsetY}px)`,
                                    }}
                                >
                                    <div
                                        ref={
                                            isStaticRenderer
                                                ? undefined
                                                : getSlotMeasureRef(
                                                      unit.componentIndex
                                                  )
                                        }
                                        className="scroll-story-inline-slot"
                                        style={{
                                            ...styles.componentSlot,
                                            width: targetSize?.width,
                                            height: targetSize?.height,
                                            ...(isFramerCanvas
                                                ? styles.canvasEditableSlot
                                                : null),
                                        }}
                                    >
                                        {/* Keep the slotted Framer layer as a real child node (Slot),
                                         not a ComponentInstance snapshot path, so hover/gesture/delay
                                         interactions remain live in Preview/Publish. */}
                                        <div
                                            ref={
                                                isStaticRenderer
                                                    ? undefined
                                                    : getIntrinsicMeasureRef(
                                                          unit.componentIndex
                                                      )
                                            }
                                            style={{
                                                ...styles.interactiveChildLayer,
                                                ...(originalSize
                                                    ? styles.interactiveChildLayerOriginal
                                                    : styles.interactiveChildLayerFitted),
                                                transform: originalSize
                                                    ? undefined
                                                    : `translate(-50%, -50%) scale(${fitScale})`,
                                                pointerEvents:
                                                    isComponentInteractive
                                                        ? "auto"
                                                        : "none",
                                                visibility:
                                                    isComponentInteractive
                                                        ? "visible"
                                                        : "hidden",
                                            }}
                                            tabIndex={
                                                isComponentInteractive
                                                    ? undefined
                                                    : -1
                                            }
                                            aria-hidden={
                                                !isComponentInteractive
                                            }
                                            onFocusCapture={
                                                isStaticRenderer
                                                    ? undefined
                                                    : (event) =>
                                                          handleInactiveFocusCapture(
                                                              event,
                                                              isComponentInteractive
                                                          )
                                            }
                                        >
                                            {shouldMountComponent ? (
                                                ((React.isValidElement(
                                                    legacySlottedChildren[
                                                        unit.componentIndex
                                                    ]
                                                )
                                                    ? React.cloneElement(
                                                          legacySlottedChildren[
                                                              unit
                                                                  .componentIndex
                                                          ] as React.ReactElement,
                                                          {
                                                              key: componentMountKey,
                                                          }
                                                      )
                                                    : legacySlottedChildren[
                                                          unit.componentIndex
                                                      ]) ?? null)
                                            ) : legacySlottedChildren[
                                                  unit.componentIndex
                                              ] ? (
                                                <span
                                                    aria-hidden="true"
                                                    style={{
                                                        display: "inline-block",
                                                        ...getChildSlotSize(
                                                            legacySlottedChildren[
                                                                unit
                                                                    .componentIndex
                                                            ]
                                                        ),
                                                    }}
                                                />
                                            ) : null}
                                            {!legacySlottedChildren[
                                                unit.componentIndex
                                            ] ? (
                                                <MissingComponent />
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {units.length === 0 ? (
                        <span
                            style={styles.emptyStoryFallback}
                            aria-hidden="true"
                        >
                            Write story text
                        </span>
                    ) : null}
                </div>
            </div>
            {showStickyRunway ? (
                <div
                    aria-hidden="true"
                    style={{
                        ...styles.runwaySpacer,
                        height: `${scrollLengthVh}vh`,
                    }}
                />
            ) : null}
        </section>
    )
}

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum)
}

function toOffsetKeyword(point: AlignmentPoint): OffsetKeyword {
    if (point === "top") return "start"
    if (point === "bottom") return "end"
    return "center"
}

function buildInViewOffsets(
    startPoint: AlignmentPoint,
    startsAt: AlignmentPoint,
    endPoint: AlignmentPoint,
    endsAt: AlignmentPoint
): [ScrollOffsetPair, ScrollOffsetPair] {
    const startTarget = toOffsetKeyword(startPoint)
    const startViewport = toOffsetKeyword(startsAt)
    const endTarget = toOffsetKeyword(endPoint)
    const endViewport = toOffsetKeyword(endsAt)
    return [`${startTarget} ${startViewport}`, `${endTarget} ${endViewport}`]
}

function mix(from: number, to: number, progress: number) {
    return from + (to - from) * progress
}

function normalizeStoryItems(
    storyItems?: ScrollStoryInlineProps["storyItems"]
): StoryToken[] {
    if (!Array.isArray(storyItems) || storyItems.length === 0) {
        return []
    }

    const normalized = storyItems
        .map((item) => {
            if (!item) return null
            const legacySerializedItem = item as {
                itemType?: string
                text?: string
                revealAs?: string
                offsetX?: number
                offsetY?: number
                aRIALabel?: string
                ariaLabel?: string
            }

            if (
                (item as StoryToken).type === "break" ||
                legacySerializedItem.itemType === "Line Break"
            ) {
                return { type: "break" } as BreakToken
            }
            if (
                (item as StoryToken).type === "component" ||
                legacySerializedItem.itemType === "Inline Component"
            ) {
                return {
                    type: "component",
                    offsetX: getNumberOrFallback(
                        (item as ComponentToken).offsetX ??
                            legacySerializedItem.offsetX,
                        4
                    ),
                    offsetY: getNumberOrFallback(
                        (item as ComponentToken).offsetY ??
                            legacySerializedItem.offsetY,
                        8
                    ),
                    ariaLabel:
                        (item as ComponentToken).ariaLabel ??
                        legacySerializedItem.ariaLabel ??
                        legacySerializedItem.aRIALabel ??
                        "Interactive visual",
                } as ComponentToken
            }

            const rawValue =
                typeof (item as TextToken).value === "string"
                    ? (item as TextToken).value
                    : (legacySerializedItem.text ?? "")
            const cleanValue = rawValue.trim()
            if (!cleanValue) return null

            return {
                type: "text",
                value: cleanValue,
                reveal:
                    (item as TextToken).reveal === "phrase" ||
                    legacySerializedItem.revealAs === "Phrase"
                        ? "phrase"
                        : "word",
            } as TextToken
        })
        .filter(Boolean) as StoryToken[]

    return normalized
}

function parseStoryTextToTokens(storyText: string): StoryToken[] {
    if (storyText.length === 0) return []

    const tokens: StoryToken[] = []
    let buffer = ""
    let index = 0

    const flushBuffer = () => {
        if (buffer.length === 0) return
        tokens.push(...textWithNewlinesToTokens(buffer))
        buffer = ""
    }

    while (index < storyText.length) {
        const char = storyText[index]
        const nextChar = storyText[index + 1]

        if (char === "[" && nextChar === "]") {
            flushBuffer()
            tokens.push({
                type: "component",
                offsetX: 4,
                offsetY: 8,
                ariaLabel: "Interactive visual",
            })
            index += 2
            continue
        }

        buffer += char
        index += 1
    }

    flushBuffer()
    return tokens
}

function textWithNewlinesToTokens(text: string): StoryToken[] {
    if (text.length === 0) return []
    const lines = text.split("\n")
    const tokens: StoryToken[] = []

    lines.forEach((line, lineIndex) => {
        if (line.length > 0) {
            tokens.push({
                type: "text",
                value: line,
                reveal: "word",
            })
        }
        if (lineIndex < lines.length - 1) {
            tokens.push({ type: "break" })
        }
    })

    return tokens
}

function normalizeLegacyTimingValue(
    timing?: string
): "onScroll" | "immediate" | null {
    if (!timing) return null
    const compact = timing.trim().toLowerCase()
    if (compact === "start immediately" || compact === "immediate") {
        return "immediate"
    }
    if (compact === "start on scroll" || compact === "onscroll") {
        return "onScroll"
    }
    return null
}

function normalizeComponentStartModes(
    componentTiming: ScrollStoryInlineProps["componentTiming"],
    storyComponents: ScrollStoryInlineProps["storyComponents"],
    legacyStartModes: Array<"onScroll" | "immediate" | undefined>
): Array<"onScroll" | "immediate" | undefined> {
    if (Array.isArray(componentTiming) && componentTiming.length > 0) {
        return componentTiming.map((entry) => entry?.startMode ?? "onScroll")
    }

    if (Array.isArray(storyComponents) && storyComponents.length > 0) {
        return storyComponents.map((entry) => {
            const fromStartMode = entry?.startMode
            if (fromStartMode === "immediate" || fromStartMode === "onScroll") {
                return fromStartMode
            }
            return normalizeLegacyTimingValue(entry?.timing) ?? "onScroll"
        })
    }

    return legacyStartModes
}

function normalizeComponentVisualSettings(
    componentTiming: ScrollStoryInlineProps["componentTiming"]
): Array<{
    offsetX?: number
    offsetY?: number
    ariaLabel?: string
    customSize?: boolean
    width?: number
    height?: number
}> {
    if (!Array.isArray(componentTiming) || componentTiming.length === 0)
        return []

    return componentTiming.map((entry) => ({
        offsetX: typeof entry?.offsetX === "number" ? entry.offsetX : undefined,
        offsetY: typeof entry?.offsetY === "number" ? entry.offsetY : undefined,
        ariaLabel:
            typeof entry?.ariaLabel === "string" &&
            entry.ariaLabel.trim().length > 0
                ? entry.ariaLabel
                : undefined,
        customSize: entry?.customSize === true,
        width: typeof entry?.width === "number" ? entry.width : undefined,
        height: typeof entry?.height === "number" ? entry.height : undefined,
    }))
}

function resolveComponentSize(
    shared: { width: number; height: number },
    visualSettings?: {
        customSize?: boolean
        width?: number
        height?: number
    }
) {
    if (!visualSettings?.customSize) return shared
    return {
        width: clamp(visualSettings.width ?? shared.width, 8, 1200),
        height: clamp(visualSettings.height ?? shared.height, 8, 1200),
    }
}

function calculateContainScale(
    intrinsicSize: { width: number; height: number } | undefined,
    targetSize: { width: number; height: number }
) {
    if (!intrinsicSize) return 1
    const { width, height } = intrinsicSize
    if (!width || !height) return 1
    return Math.min(targetSize.width / width, targetSize.height / height)
}

function getNumberOrFallback(value: unknown, fallback: number) {
    return typeof value === "number" ? value : fallback
}

function getChildSlotSize(child: React.ReactNode): React.CSSProperties {
    if (!React.isValidElement(child)) return {}
    const styleProp = (child.props as { style?: React.CSSProperties }).style
    if (!styleProp) return {}

    const size: React.CSSProperties = {}
    if (styleProp.width !== undefined) size.width = styleProp.width
    if (styleProp.height !== undefined) size.height = styleProp.height
    return size
}

function MissingComponent() {
    return (
        <span style={styles.placeholder} aria-hidden="true">
            <span style={styles.placeholderMark}>＋</span>
            <span style={styles.placeholderLabel}>Connect component</span>
        </span>
    )
}

const styles: Record<string, React.CSSProperties> = {
    section: {
        position: "relative",
        width: "100%",
        height: "auto",
        minWidth: 0,
        minHeight: "max-content",
        overflow: "visible",
        color: "inherit",
        boxSizing: "border-box",
    },
    stickyStage: {
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        alignContent: "flex-start",
        flex: "1 1 auto",
        boxSizing: "border-box",
        paddingInline: DESIGN.horizontalPadding,
        overflow: "visible",
    },
    runwaySpacer: {
        width: "100%",
        pointerEvents: "none",
    },
    story: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        alignContent: "flex-start",
        justifyContent: "flex-start",
        columnGap: DESIGN.wordGap,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        minHeight: 0,
        flex: "1 1 auto",
        boxSizing: "border-box",
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        letterSpacing: DESIGN.letterSpacing,
        overflow: "visible",
    },
    screenReaderOnly: {
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
    },
    word: {
        display: "inline-block",
        flex: "0 1 auto",
        minWidth: 0,
        maxWidth: "100%",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        willChange: "opacity",
    },
    lineBreak: {
        flexBasis: "100%",
        width: 0,
        height: 0,
    },
    lineProbe: {
        position: "absolute",
        display: "block",
        width: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        visibility: "hidden",
        pointerEvents: "none",
    },
    componentRevealWrapper: {
        position: "relative",
        display: "inline-flex",
        flex: "0 0 auto",
        minWidth: 0,
        boxSizing: "border-box",
        // Width follows the child so the paragraph reflows around it.
        width: "max-content",
        alignItems: "center",
        justifyContent: "center",
        transformOrigin: "50% 50%",
        // Nothing in this chain may clip or cap an expanding component.
        overflow: "visible",
        maxWidth: "none",
        maxHeight: "none",
    },
    componentPositionWrapper: {
        position: "relative",
        display: "inline-flex",
        flex: "0 0 auto",
        minWidth: 0,
        boxSizing: "border-box",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        maxWidth: "none",
        maxHeight: "none",
    },
    componentSlot: {
        position: "relative",
        display: "inline-flex",
        flex: "0 0 auto",
        minWidth: 0,
        boxSizing: "border-box",
        width: "max-content",
        height: "max-content",
        minHeight: "min-content",
        maxWidth: "none",
        maxHeight: "none",
        overflow: "visible",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
    },
    interactiveChildLayer: {
        position: "absolute",
        display: "inline-flex",
        minWidth: 0,
        boxSizing: "border-box",
        width: "max-content",
        height: "max-content",
        minHeight: "min-content",
        maxWidth: "none",
        maxHeight: "none",
        overflow: "visible",
        pointerEvents: "auto",
        transformOrigin: "center center",
    },
    interactiveChildLayerFitted: {
        position: "absolute",
        left: "50%",
        top: "50%",
    },
    interactiveChildLayerOriginal: {
        position: "relative",
        left: "auto",
        top: "auto",
    },
    canvasEditableSlot: {
        pointerEvents: "auto",
        isolation: "isolate",
        zIndex: 2,
    },
    placeholder: {
        maxWidth: "min(100%, 16ch)",
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.35em",
        padding: "0.2em 0.45em",
        border: "1px dashed currentColor",
        borderRadius: "999px",
        color: "currentColor",
        background: "transparent",
        fontFamily: "inherit",
        fontSize: "0.18em",
        lineHeight: 1,
        letterSpacing: "0.01em",
        opacity: 0.55,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
    },
    placeholderMark: {
        fontSize: "1em",
        lineHeight: 1,
    },
    placeholderLabel: {
        display: "inline-block",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    emptyStoryFallback: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "1em",
        opacity: 0.35,
        letterSpacing: "0.01em",
    },
}

addPropertyControls(ScrollStoryInline, {
    children: {
        type: ControlType.Slot,
        title: "Component",
        description:
            "Connect inline components here. They are inserted in order at each [] marker in Story Text.",
        maxCount: 12,
    },
    storyText: {
        type: ControlType.String,
        title: "Story Text",
        description:
            "Write your story. Insert [] wherever a connected component should appear. Markers follow Component slot order.",
        defaultValue: DEFAULT_STORY_TEXT,
        displayTextArea: true,
    },
    originalSize: {
        type: ControlType.Boolean,
        title: "Original Size",
        description:
            "Use each connected component’s original size. Turn off to restore your custom sizes.",
        defaultValue: false,
        enabledTitle: "Original",
        disabledTitle: "Custom",
    },
    componentWidth: {
        type: ControlType.Number,
        title: "Component Width",
        description: "Shared resting width for all inline components.",
        defaultValue: 80,
        min: 8,
        max: 1200,
        step: 1,
        hidden: (props) => props.originalSize === true,
    },
    componentHeight: {
        type: ControlType.Number,
        title: "Component Height",
        description: "Shared resting height for all inline components.",
        defaultValue: 80,
        min: 8,
        max: 1200,
        step: 1,
        hidden: (props) => props.originalSize === true,
    },
    componentTiming: {
        type: ControlType.Array,
        title: "Story Components",
        description:
            "Per [] marker / Component slot order: timing, offset, accessibility, and optional custom resting size.",
        maxCount: 12,
        defaultValue: [],
        control: {
            type: ControlType.Object,
            buttonTitle: "Add Timing Entry",
            controls: {
                startMode: {
                    type: ControlType.Enum,
                    title: "Timing",
                    options: ["onScroll", "immediate"],
                    optionTitles: ["Start on Scroll", "Start Immediately"],
                    defaultValue: "onScroll",
                },
                offsetX: {
                    type: ControlType.Number,
                    title: "Offset X",
                    defaultValue: 4,
                    min: -400,
                    max: 400,
                    step: 1,
                },
                offsetY: {
                    type: ControlType.Number,
                    title: "Offset Y",
                    defaultValue: 8,
                    min: -400,
                    max: 400,
                    step: 1,
                },
                ariaLabel: {
                    type: ControlType.String,
                    title: "ARIA Label",
                    defaultValue: "Interactive visual",
                },
                customSize: {
                    type: ControlType.Boolean,
                    title: "Custom Size",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    hidden: (_entry, rootProps) =>
                        rootProps?.originalSize === true,
                },
                width: {
                    type: ControlType.Number,
                    title: "Width",
                    defaultValue: 80,
                    min: 8,
                    max: 1200,
                    step: 1,
                    hidden: (entry, rootProps) =>
                        rootProps?.originalSize === true ||
                        entry.customSize !== true,
                },
                height: {
                    type: ControlType.Number,
                    title: "Height",
                    defaultValue: 80,
                    min: 8,
                    max: 1200,
                    step: 1,
                    hidden: (entry, rootProps) =>
                        rootProps?.originalSize === true ||
                        entry.customSize !== true,
                },
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: 48,
            lineHeight: 0.92,
            letterSpacing: "-0.055em",
            textAlign: "left",
            variant: "Medium",
        },
        defaultFontType: "sans-serif",
        displayFontSize: false,
        displayTextAlignment: true,
        controls: "extended",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 48,
        min: 12,
        max: 240,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#1D1D1A",
    },
    scrollBehavior: {
        type: ControlType.Enum,
        title: "Scroll",
        options: ["flow", "sticky"],
        optionTitles: ["Move", "Sticky"],
        defaultValue: "flow",
        displaySegmentedControl: true,
    },
    revealMode: {
        type: ControlType.Enum,
        title: "Reveal",
        options: ["smooth", "stepped"],
        optionTitles: ["Smooth", "Stepped"],
        defaultValue: "smooth",
        displaySegmentedControl: true,
    },
    expandBehavior: {
        type: ControlType.Enum,
        title: "Expand",
        description:
            "Width only: words move aside for extra width, extra height overlaps the text and keeps the line height fixed.",
        options: ["widthOnly", "both"],
        optionTitles: ["Width Only", "Width & Height"],
        defaultValue: "widthOnly",
        displaySegmentedControl: false,
    },
    lineFit: {
        type: ControlType.Enum,
        title: "Line Fit",
        description:
            "Text Line: component rows keep the text line height and the component overlaps, so line height stays even across the paragraph.",
        options: ["textLine", "component"],
        optionTitles: ["Text Line", "Component"],
        defaultValue: "textLine",
        displaySegmentedControl: false,
        hidden: (props) => props.expandBehavior === "both",
    },
    triggerMode: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["onScroll", "layerInView", "sectionInView"],
        optionTitles: ["On Scroll", "Layer In View", "Section In View"],
        defaultValue: "onScroll",
    },
    startPoint: {
        type: ControlType.Enum,
        title: "Start Point",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "top",
    },
    startsAt: {
        type: ControlType.Enum,
        title: "Starts At",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "bottom",
    },
    endPoint: {
        type: ControlType.Enum,
        title: "End Point",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "bottom",
    },
    endsAt: {
        type: ControlType.Enum,
        title: "Ends At",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "top",
    },
    revealSpeed: {
        type: ControlType.Number,
        title: "Reveal Speed",
        defaultValue: 1,
        min: 0.5,
        max: 5,
        step: 0.05,
    },
})
