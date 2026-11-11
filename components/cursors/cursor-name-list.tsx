// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, {
    startTransition,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

/*
Instructions:
Create a Framer component that follows the Framer component rules and achieves the user's goal.
make a component as such where list is closer together but as '&' moves down the list the list separates sideways as shown in the image
make '&' as a hover state where '&' follows the cursor so as it goes down the list the list separates sideways while above list stays together
*/

type Item = {
    text: string
}

type Side = "left" | "right"

type SpreadEasing = "linear" | "easeIn" | "easeOut" | "easeInOut"

interface Props {
    items: Item[]
    backgroundColor: string
    textColor: string

    font: any
    ampFont: any

    centerCount: number
    startSide: Side

    spreadStart: number
    minSeparation: number
    maxSeparation: number
    hoverSpreadRange: number
    ampGapPx: number
    easing: SpreadEasing

    topPadding: number
    bottomPadding: number

    fitToHeight: boolean
    lineHeightPx: number

    showAmpersand: boolean
    ampersandText: string
    ampAfterIndex: number

    scrollWithPage: boolean
    scrollStartAbovePx: number

    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SpreadingListAmpersand(props: Props) {
    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLDivElement>(null)

    const {
        items,
        backgroundColor,
        textColor,
        font,
        ampFont,
        centerCount,
        startSide,
        spreadStart,
        minSeparation,
        maxSeparation,
        hoverSpreadRange,
        ampGapPx,
        easing,
        topPadding,
        bottomPadding,
        fitToHeight,
        lineHeightPx,
        showAmpersand,
        ampersandText,
        ampAfterIndex,
        scrollWithPage,
        scrollStartAbovePx,
        style,
    } = props

    const [measured, setMeasured] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
    const [isHovering, setIsHovering] = useState(false)
    const [hoverY, setHoverY] = useState(0)
    const [scrollTopInViewport, setScrollTopInViewport] = useState(0)

    const measure = useCallback(() => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const w = Math.max(0, rect.width || 0)
        const h = Math.max(0, rect.height || 0)
        startTransition(() => setMeasured({ w, h }))
    }, [])

    useLayoutEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        measure()
    }, [isStatic, measure])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (!ref.current) return

        const el = ref.current
        let ro: ResizeObserver | null = null

        try {
            ro = new ResizeObserver(() => measure())
            ro.observe(el)
        } catch {
            const onResize = () => measure()
            window.addEventListener("resize", onResize)
            return () => window.removeEventListener("resize", onResize)
        }

        return () => {
            if (ro) ro.disconnect()
        }
    }, [isStatic, measure])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (!scrollWithPage) return

        const update = () => {
            if (!ref.current) return
            const top = ref.current.getBoundingClientRect().top
            startTransition(() => setScrollTopInViewport(top))
        }

        update()
        window.addEventListener("scroll", update, { passive: true })
        window.addEventListener("resize", update)

        return () => {
            window.removeEventListener("scroll", update)
            window.removeEventListener("resize", update)
        }
    }, [isStatic, scrollWithPage])

    const safeItems = useMemo(() => {
        const arr = Array.isArray(items) ? items : []
        return arr.filter((x) => x && typeof x.text === "string")
    }, [items])

    const {
        computedLineStep,
        totalLines,
        yForLine,
        ampLineIndex,
        hasAmp,
        centerCountClamped,
        ampAfterClamped,
    } = useMemo(() => {
        const n = safeItems.length
        const hasAmp = !!showAmpersand
        const ampAfterClamped = Math.max(0, Math.min(n, Math.round(ampAfterIndex)))
        const ampLineIndex = hasAmp ? ampAfterClamped : -1
        const totalLines = n + (hasAmp ? 1 : 0)

        const h = measured.h
        const usableH = Math.max(0, h - topPadding - bottomPadding)
        const baseStep = Math.max(6, lineHeightPx)
        const computedLineStep =
            fitToHeight && totalLines > 1 && usableH > 0 ? Math.max(6, usableH / (totalLines - 1)) : baseStep

        const yForLine = (line: number) => topPadding + line * computedLineStep

        const centerCountClamped = Math.max(0, Math.min(n, Math.round(centerCount)))

        return {
            computedLineStep,
            totalLines,
            yForLine,
            ampLineIndex,
            hasAmp,
            centerCountClamped,
            ampAfterClamped,
        }
    }, [
        safeItems.length,
        showAmpersand,
        ampAfterIndex,
        measured.h,
        topPadding,
        bottomPadding,
        fitToHeight,
        lineHeightPx,
        centerCount,
    ])

    const ease = useCallback(
        (tRaw: number) => {
            const t = Math.max(0, Math.min(1, tRaw))
            if (easing === "linear") return t
            if (easing === "easeIn") return t * t
            if (easing === "easeOut") return 1 - (1 - t) * (1 - t)
            // easeInOut
            return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        },
        [easing]
    )

    const elements = useMemo(() => {
        const n = safeItems.length
        if (n === 0) return []

        const spreadStartClamped = Math.max(0, Math.min(1, spreadStart))

        const isScrollAmpActive = hasAmp && scrollWithPage && !isStatic
        const isHoverAmpActive = hasAmp && isHovering && !isStatic && !scrollWithPage

        const startYAbove = Math.max(0, topPadding - Math.max(0, scrollStartAbovePx))
        const ampYScrollRaw = startYAbove + -scrollTopInViewport
        const ampYScroll = Math.max(startYAbove, Math.min(measured.h - bottomPadding, ampYScrollRaw))

        const ampYActive = isScrollAmpActive
            ? ampYScroll
            : isHoverAmpActive
              ? Math.max(topPadding, Math.min(measured.h - bottomPadding, hoverY))
              : 0

        const ampIsInList = ampYActive >= topPadding

        const ampLineFloat = (isHoverAmpActive || (isScrollAmpActive && ampIsInList))
            ? (ampYActive - topPadding) / Math.max(1e-6, computedLineStep)
            : 0
        const ampItemIndexFloat = (isScrollAmpActive || isHoverAmpActive)
            ? Math.max(0, Math.min(n - 1, ampLineFloat))
            : 0

        const sideForRow = (row: number): Side => {
            const isEven = row % 2 === 0
            if (startSide === "left") return isEven ? "left" : "right"
            return isEven ? "right" : "left"
        }

        const lineIndexForItem = (itemIndex: number) => {
            if (!hasAmp) return itemIndex
            return itemIndex < ampAfterClamped ? itemIndex : itemIndex + 1
        }

        const maxSep = Math.max(0, maxSeparation)
        const minSep = Math.max(0, minSeparation)
        const ampGap = Math.max(0, ampGapPx)

        const out: React.ReactNode[] = []

        for (let i = 0; i < n; i++) {
            const line = lineIndexForItem(i)
            const y = yForLine(line)

            let xOffset = 0

            if (isHoverAmpActive || (isScrollAmpActive && ampIsInList)) {
                const range = Math.max(0.0001, hoverSpreadRange)
                const dist = Math.abs(i - ampItemIndexFloat)
                const progress = 1 - Math.max(0, Math.min(1, dist / range))

                if (progress > 0) {
                    const e = ease(progress)
                    const sep = Math.max(0, maxSep) * e
                    const gap = ampGap * e

                    const row = i - centerCountClamped
                    const side = sideForRow(row)
                    xOffset = (side === "left" ? -1 : 1) * (sep + gap)
                }
            } else {
                const denom = Math.max(1, Math.max(n - 1, 1))
                const progressOverall = denom <= 0 ? 0 : i / denom
                const t = (progressOverall - spreadStartClamped) / Math.max(1e-6, 1 - spreadStartClamped)
                const e = ease(t)
                const sep = minSep + (maxSep - minSep) * e

                const row = i - centerCountClamped
                const side = sideForRow(row)
                xOffset = (side === "left" ? -1 : 1) * sep
            }

            out.push(
                <div
                    key={`item-${i}`}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: y,
                        transform: `translate(-50%, -50%) translateX(${xOffset}px)`,
                        color: textColor,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        ...font,
                    }}
                    aria-hidden="true"
                >
                    {safeItems[i].text}
                </div>
            )
        }

        if (hasAmp) {
            const y = isScrollAmpActive ? ampYActive : isHoverAmpActive ? ampYActive : yForLine(ampLineIndex)
            out.push(
                <div
                    key={`amp`}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: y,
                        transform: `translate(-50%, -50%)`,
                        color: textColor,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        ...ampFont,
                    }}
                    aria-hidden="true"
                >
                    {ampersandText}
                </div>
            )
        }

        return out
    }, [
        safeItems,
        spreadStart,
        hasAmp,
        ampAfterClamped,
        yForLine,
        ampLineIndex,
        ampersandText,
        textColor,
        font,
        ampFont,
        centerCountClamped,
        startSide,
        maxSeparation,
        minSeparation,
        hoverSpreadRange,
        ampGapPx,
        ease,
        isHovering,
        hoverY,
        scrollWithPage,
        scrollStartAbovePx,
        scrollTopInViewport,
        measured.h,
        topPadding,
        bottomPadding,
        computedLineStep,
        isStatic,
    ])

    const isFixedW = !!style && style.width === "100%"

    // Canvas/thumbnail safety: avoid empty render
    if (RenderTarget.current() === RenderTarget.thumbnail && safeItems.length === 0) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    backgroundColor,
                }}
                aria-label="Spreading list"
                role="img"
            />
        )
    }

    return (
        <div
            ref={ref}
            onPointerEnter={
                isStatic || scrollWithPage
                    ? undefined
                    : () => {
                          startTransition(() => setIsHovering(true))
                      }
            }
            onPointerLeave={
                isStatic || scrollWithPage
                    ? undefined
                    : () => {
                          startTransition(() => setIsHovering(false))
                      }
            }
            onPointerMove={
                isStatic || scrollWithPage
                    ? undefined
                    : (e) => {
                          if (!ref.current) return
                          const rect = ref.current.getBoundingClientRect()
                          const y = e.clientY - rect.top
                          startTransition(() => setHoverY(y))
                      }
            }
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                ...(isFixedW ? {} : { minWidth: "max-content" }),
            }}
            aria-label="Spreading list"
            role="img"
        >
            {elements}
        </div>
    )
}

addPropertyControls(SpreadingListAmpersand, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                text: { type: ControlType.String, title: "Text", defaultValue: "Name" },
            },
        },
        defaultValue: [
            { text: "Coach" },
            { text: "Stella McCartney" },
            { text: "Craig McDean" },
            { text: "Juergen Teller" },
            { text: "Viviane Sassen" },
            { text: "Vegamour" },
            { text: "Augustinus Bader" },
            { text: "Steven Klein" },
            { text: "Lachlan Bailey" },
            { text: "Willy Vanderperre" },
            { text: "Ilia Beauty" },
            { text: "Johannes Leonardo" },
            { text: "TBWA\\" },
            { text: "Josh Olins" },
            { text: "Ben Hassett" },
            { text: "Amazon" },
            { text: "Dan Jackson" },
            { text: "U Beauty" },
            { text: "Mazarine Eilish" },
        ],
    },
    showAmpersand: {
        type: ControlType.Boolean,
        title: "Ampersand",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    ampersandText: {
        type: ControlType.String,
        title: "Amp Text",
        defaultValue: "&",
        hidden: (p) => !p.showAmpersand,
    },
    ampAfterIndex: {
        type: ControlType.Number,
        title: "Amp After",
        defaultValue: 11,
        min: 0,
        max: 200,
        step: 1,
        displayStepper: true,
        hidden: (p) => !p.showAmpersand,
    },
    scrollWithPage: {
        type: ControlType.Boolean,
        title: "Scroll Amp",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.showAmpersand,
    },
    scrollStartAbovePx: {
        type: ControlType.Number,
        title: "Start Above",
        defaultValue: 80,
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        hidden: (p) => !p.showAmpersand || !p.scrollWithPage,
    },
    centerCount: {
        type: ControlType.Number,
        title: "Center Top",
        defaultValue: 9,
        min: 0,
        max: 200,
        step: 1,
        displayStepper: true,
    },
    startSide: {
        type: ControlType.Enum,
        title: "First Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    spreadStart: {
        type: ControlType.Number,
        title: "Spread Start",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.01,
    },
    minSeparation: {
        type: ControlType.Number,
        title: "Min Sep",
        defaultValue: 6,
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
    },
    maxSeparation: {
        type: ControlType.Number,
        title: "Max Sep",
        defaultValue: 260,
        min: 0,
        max: 800,
        step: 1,
        unit: "px",
    },
    hoverSpreadRange: {
        type: ControlType.Number,
        title: "Hover Range",
        defaultValue: 4,
        min: 0.5,
        max: 30,
        step: 0.5,
        unit: "lines",
    },
    ampGapPx: {
        type: ControlType.Number,
        title: "Amp Gap",
        defaultValue: 16,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["linear", "easeIn", "easeOut", "easeInOut"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In-Out"],
        defaultValue: "easeOut",
    },
    fitToHeight: {
        type: ControlType.Boolean,
        title: "Fit Height",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    lineHeightPx: {
        type: ControlType.Number,
        title: "Line Step",
        defaultValue: 32,
        min: 10,
        max: 140,
        step: 1,
        unit: "px",
        hidden: (p) => p.fitToHeight,
    },
    topPadding: {
        type: ControlType.Number,
        title: "Top Pad",
        defaultValue: 38,
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
    },
    bottomPadding: {
        type: ControlType.Number,
        title: "Bottom Pad",
        defaultValue: 40,
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Item Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "30px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    ampFont: {
        type: ControlType.Font,
        title: "Amp Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})