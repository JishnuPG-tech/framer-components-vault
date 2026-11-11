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

interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface StepItem {
    number: string
    title: string
    description: string
    icon?: ResponsiveImageValue
}

interface StepProgressProps {
    steps: StepItem[]
    playback: "loop" | "once"
    progressMotion: "linear" | "ease" | "spring"
    showIcons: boolean
    showStepNumber: boolean
    numberFormat: "padded" | "numeric" | "alpha" | "roman"
    showTitle: boolean
    showDescription: boolean
    stepDuration: number
    canvasState: number
    stepPause: number
    loopPause: number
    startDelay: number
    mobileAt: number
    baseColor: string
    baseThickness: number
    progressColor: string
    activeBackgroundColor?: string
    progressThickness: number
    nodeSize: number
    iconSize: number
    nodeStrokeWidth: number
    showShadow: boolean
    shadow: string
    nodeRadius: number
    nodeBackground: string
    nodeStrokeColor: string
    activeStrokeColor: string
    iconColor: string
    checkColor: string
    checkIcon?: ResponsiveImageValue
    numberColor: string
    titleColor: string
    descriptionColor: string
    numberFont: React.CSSProperties
    titleFont: React.CSSProperties
    descriptionFont: React.CSSProperties
    textGap: number
    contentGap: number
    itemGap: number
    mobileStepGap: number
    mobileTextOffset: number
    animation?: { playback?: "loop" | "once"; progressMotion?: "linear" | "ease" | "spring"; stepDuration?: number; canvasState?: number; stepPause?: number; startDelay?: number; loopPause?: number }
    colors?: { baseColor?: string; progressColor?: string; activeBackgroundColor?: string; nodeBackground?: string; nodeStrokeColor?: string; activeStrokeColor?: string; iconColor?: string; checkColor?: string; numberColor?: string; titleColor?: string; descriptionColor?: string }
    icons?: { showIcons?: boolean; checkIcon?: ResponsiveImageValue; nodeSize?: number; iconSize?: number; nodeStrokeWidth?: number; showShadow?: boolean; shadow?: string; nodeRadius?: number }
    lines?: { baseColor?: string; baseThickness?: number; progressColor?: string; progressThickness?: number }
    stepStyle?: { showIcons?: boolean; checkIcon?: ResponsiveImageValue; nodeSize?: number; iconSize?: number; nodeStrokeWidth?: number; nodeRadius?: number; nodeBackground?: string; activeBackgroundColor?: string; nodeStrokeColor?: string; activeStrokeColor?: string; iconColor?: string; checkColor?: string; showShadow?: boolean; shadow?: string }
    textStyle?: { showStepNumber?: boolean; numberFormat?: "padded" | "numeric" | "alpha" | "roman"; showTitle?: boolean; showDescription?: boolean; numberColor?: string; titleColor?: string; descriptionColor?: string; numberFont?: React.CSSProperties; titleFont?: React.CSSProperties; descriptionFont?: React.CSSProperties; textGap?: number }
    layout?: { mobileAt?: number; contentGap?: number; itemGap?: number; mobileStepGap?: number; mobileTextOffset?: number }
    style?: React.CSSProperties
}

const fallbackSteps: StepItem[] = [
    { number: "01", title: "Odbiór", description: "do magazynu" },
    { number: "02", title: "Transport liniowy", description: "do centralnej sortowni" },
    { number: "03", title: "Cross-docking", description: "na centralnej sortowni" },
    { number: "04", title: "Transport liniowy", description: "na poszczególne regiony" },
    { number: "05", title: "Segregacja", description: "na trasy miastowe" },
    { number: "06", title: "Dostarczenie", description: "do klienta" },
]

function CheckIcon({ color }: { color: string }) {
    return (
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5 9.2 17 19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function TintedIcon({ color, icon }: { color: string; icon: ResponsiveImageValue }) {
    if (!icon.src) return null
    return (
        <span
            aria-hidden="true"
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                backgroundColor: color,
                WebkitMaskImage: `url("${icon.src}")`,
                maskImage: `url("${icon.src}")`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
            }}
        />
    )
}

function CompletionIcon({ color, icon }: { color: string; icon?: ResponsiveImageValue }) {
    if (!icon?.src) return <CheckIcon color={color} />
    return <TintedIcon color={color} icon={icon} />
}

function PlaceholderIcon({ color, index }: { color: string; index: number }) {
    const variant = index % 6
    return (
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {variant === 0 && <><rect x="5" y="4" width="14" height="16" rx="2" stroke={color} strokeWidth="1.8" /><path d="M12 7v8m0 0-3-3m3 3 3-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>}
            {variant === 1 && <><circle cx="6" cy="16" r="2.5" stroke={color} strokeWidth="1.8" /><path d="m8.5 15 4-4 3 1 3.5-5M17 7h2v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>}
            {variant === 2 && <><rect x="5" y="5" width="14" height="14" rx="2" stroke={color} strokeWidth="1.8" /><path d="m9 9 6 6m0-5v5h-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>}
            {variant === 3 && <><path d="M12 4v5m0 0-5 4m5-4 5 4M7 13v5m10-5v5" stroke={color} strokeWidth="1.8" strokeLinecap="round" /><path d="m4.5 16.5 2.5 2.5 2.5-2.5m5 0L17 19l2.5-2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>}
            {variant === 4 && <><path d="M12 4v16M4 12h16m-3-3 3 3-3 3M7 9l-3 3 3 3m2-8 3-3 3 3m-6 10 3 3 3-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>}
            {variant === 5 && <><rect x="5" y="5" width="14" height="14" rx="2" stroke={color} strokeWidth="1.8" /><path d="M12 17V9m0 0-3 3m3-3 3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>}
        </svg>
    )
}

function toRoman(value: number) {
    const numerals: Array<[number, string]> = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]
    let remaining = Math.max(1, Math.floor(value))
    let result = ""
    for (const [amount, numeral] of numerals) {
        while (remaining >= amount) {
            result += numeral
            remaining -= amount
        }
    }
    return result
}

function toAlpha(value: number) {
    let remaining = Math.max(1, Math.floor(value))
    let result = ""
    while (remaining > 0) {
        remaining -= 1
        result = String.fromCharCode(65 + (remaining % 26)) + result
        remaining = Math.floor(remaining / 26)
    }
    return result
}

function formatStepNumber(customValue: string, index: number, format: "padded" | "numeric" | "alpha" | "roman") {
    const value = index + 1
    if (format === "numeric") return String(value)
    if (format === "alpha") return toAlpha(value)
    if (format === "roman") return toRoman(value)
    return String(value).padStart(2, "0")
}

function wait(milliseconds: number) {
    return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))
}

const displayStringTranslations: Record<string, string> = {
    Odbiór: "Pickup",
    "do magazynu": "to the warehouse",
    "Transport liniowy": "Linehaul transport",
    "do centralnej sortowni": "to the central sorting hub",
    "na centralnej sortowni": "at the central sorting hub",
    "na poszczególne regiony": "to individual regions",
    Segregacja: "Sorting",
    "na trasy miastowe": "for city delivery routes",
    Koncepcja: "Concept",
    "Kierunek i narracja": "Direction and narrative",
    Redakcja: "Editing",
    "Struktura i rytm": "Structure and rhythm",
    Korekta: "Proofreading",
    "Detal i precyzja": "Detail and precision",
    Publikacja: "Publication",
    "Finalne wydanie": "Final release",
    Diagnozujemy: "We diagnose",
    "Sprawdzamy za pomocą pomiarów i symulacji, skąd pochodzi hałas, jak się przenosi oraz jak go ograniczyć.": "Using measurements and simulations, we determine where the noise comes from, how it travels, and how to reduce it.",
    "Dobieramy rozwiązanie": "We select the right solution",
    "Wskazujemy, co zadziała w Twoim przypadku, bez przepłacania za drogie rozwiązania, których nie potrzebujesz.": "We identify what will work in your case, without making you overpay for expensive solutions you don’t need.",
    "Planujemy budżet": "We plan the budget",
    "Przygotowujemy szczegółową analizę oraz wycenę materiałów wraz z montażem. Nie wiesz, od czego zacząć? Opisz problem.": "We prepare a detailed analysis and quote for materials and installation. Not sure where to start? Describe the problem.",
}

function translateDisplayString(value: string) {
    return displayStringTranslations[value] ?? value
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function StepProgress(props: StepProgressProps) {
    const {
        steps = fallbackSteps,
        playback = "loop",
        progressMotion = "ease",
        showIcons = true,
        showStepNumber = true,
        numberFormat = "padded",
        showTitle = true,
        showDescription = true,
        stepDuration = 1.1,
        canvasState = 3,
        stepPause = 0.22,
        loopPause = 1.8,
        startDelay = 0.8,
        mobileAt = 640,
        baseColor = "#E7E7E9",
        baseThickness = 10,
        progressColor = "#28336F",
        activeBackgroundColor,
        progressThickness = 10,
        nodeSize = 36,
        iconSize = 20,
        nodeStrokeWidth = 3,
        showShadow = true,
        shadow = "0px 8px 18px 0px rgba(40, 51, 111, 0.2)",
        nodeRadius = 10,
        nodeBackground = "#FFFFFF",
        nodeStrokeColor = "#E7E7E9",
        activeStrokeColor = "#28336F",
        iconColor = "#28336F",
        checkColor = "#FFFFFF",
        checkIcon,
        numberColor = "#B0B0B4",
        titleColor = "#242426",
        descriptionColor = "#A4A4A8",
        numberFont = {},
        titleFont = {},
        descriptionFont = {},
        textGap = 5,
        contentGap = 16,
        itemGap = 8,
        mobileStepGap = 8,
        mobileTextOffset = 0,
        style,
    } = { ...props, ...(props.animation ?? {}), ...(props.colors ?? {}), ...(props.icons ?? {}), ...(props.lines ?? {}), ...(props.stepStyle ?? {}), ...(props.textStyle ?? {}), ...(props.layout ?? {}) }

    const rootRef = React.useRef<HTMLDivElement>(null)
    const nodeRefs = React.useRef<Array<HTMLDivElement | null>>([])
    const resolvedActiveBackground = activeBackgroundColor ?? progressColor
    const isStatic = useIsStaticRenderer()
    const safeSteps = steps?.length ? steps : fallbackSteps
    const [vertical, setVertical] = React.useState(false)
    const [containerWidth, setContainerWidth] = React.useState(0)
    const staticCompleted = Math.min(Math.max(-1, Math.round(canvasState) - 1), safeSteps.length - 1)
    const staticProgress = staticCompleted < 0 ? 0 : staticCompleted / Math.max(1, safeSteps.length - 1)
    const [progress, setProgress] = React.useState(0)
    const [completed, setCompleted] = React.useState(-1)
    const displayedProgress = isStatic ? staticProgress : progress
    const displayedCompleted = isStatic ? staticCompleted : completed
    const [resetting, setResetting] = React.useState(false)
    const [verticalTrack, setVerticalTrack] = React.useState({ top: nodeSize / 2, height: 0 })

    React.useEffect(() => {
        const element = rootRef.current
        if (!element || typeof ResizeObserver === "undefined") return
        const update = (width: number) => {
            setContainerWidth(width)
            setVertical(width <= mobileAt)
        }
        update(element.getBoundingClientRect().width)
        const observer = new ResizeObserver((entries) => update(entries[0]?.contentRect.width ?? element.clientWidth))
        observer.observe(element)
        return () => observer.disconnect()
    }, [mobileAt])

    React.useLayoutEffect(() => {
        if (!vertical) return
        const root = rootRef.current
        const firstNode = nodeRefs.current[0]
        const lastNode = nodeRefs.current[safeSteps.length - 1]
        if (!root || !firstNode || !lastNode) return

        const measureTrack = () => {
            const rootRect = root.getBoundingClientRect()
            const firstRect = firstNode.getBoundingClientRect()
            const lastRect = lastNode.getBoundingClientRect()
            const top = firstRect.top - rootRect.top + firstRect.height / 2
            const lastCenter = lastRect.top - rootRect.top + lastRect.height / 2
            setVerticalTrack({ top, height: Math.max(0, lastCenter - top) })
        }

        measureTrack()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(measureTrack)
        observer.observe(root)
        nodeRefs.current.forEach((node) => node && observer.observe(node))
        return () => observer.disconnect()
    }, [vertical, safeSteps.length, nodeSize, mobileStepGap, contentGap])

    React.useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        let cancelled = false

        const run = async () => {
            do {
                setResetting(true)
                setProgress(0)
                setCompleted(-1)
                await wait(550)
                if (cancelled) return
                setResetting(false)
                await wait(Math.max(0, startDelay) * 1000)
                if (cancelled) return
                setCompleted(0)
                await wait(340)

                for (let index = 1; index < safeSteps.length; index += 1) {
                    if (cancelled) return
                    const travelMs = Math.max(50, stepDuration * 1000)
                    const horizontalSegment = safeSteps.length > 1
                        ? (containerWidth - 2 * horizontalInset) / (safeSteps.length - 1)
                        : containerWidth
                    const segmentDistance = vertical
                        ? Math.max(nodeSize + mobileStepGap, 92 + mobileStepGap)
                        : Math.max(nodeSize, horizontalSegment)
                    const handoffMs = Math.min(280, Math.max(60, travelMs * (nodeSize / 2) / segmentDistance))
                    setProgress(index / Math.max(1, safeSteps.length - 1))
                    await wait(Math.max(0, travelMs - handoffMs))
                    if (cancelled) return
                    setCompleted(index)
                    await wait(handoffMs)
                    if (cancelled) return
                    await wait(Math.max(0, stepPause) * 1000)
                }

                if (playback === "once" || cancelled) return
                await wait(Math.max(0, loopPause) * 1000)
            } while (!cancelled)
        }

        run()
        return () => {
            cancelled = true
        }
    }, [isStatic, playback, safeSteps.length, stepDuration, stepPause, loopPause, startDelay, containerWidth, vertical, nodeSize, itemGap, mobileStepGap])

    const lineInset = nodeSize / 2
    const horizontalInset = containerWidth > 0
        ? Math.max(nodeSize / 2, (containerWidth - itemGap * Math.max(0, safeSteps.length - 1)) / Math.max(1, safeSteps.length) / 2)
        : nodeSize / 2
    const directionStyle: React.CSSProperties = vertical
        ? { gridTemplateColumns: `${nodeSize}px minmax(0, 1fr)`, rowGap: mobileStepGap, columnGap: contentGap }
        : { gridTemplateColumns: `repeat(${safeSteps.length}, minmax(0, 1fr))`, columnGap: itemGap }

    return (
        <section
            ref={rootRef}
            aria-label="Process steps"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "auto",
                minHeight: vertical ? undefined : 145,
                display: "grid",
                alignItems: "start",
                boxSizing: "border-box",
                overflow: "visible",
                ...directionStyle,
            }}
        >
            <div
                aria-hidden="true"
                style={vertical
                    ? { position: "absolute", left: lineInset - baseThickness / 2, top: verticalTrack.top, height: verticalTrack.height, width: baseThickness, background: baseColor, borderRadius: 999 }
                    : { position: "absolute", left: horizontalInset, right: horizontalInset, top: lineInset - baseThickness / 2, height: baseThickness, background: baseColor, borderRadius: 999 }}
            />
            <motion.div
                aria-hidden="true"
                initial={false}
                animate={isStatic ? undefined : vertical ? { scaleY: displayedProgress, scaleX: 1 } : { scaleX: displayedProgress, scaleY: 1 }}
                transition={resetting
                    ? { duration: 0 }
                    : progressMotion === "spring"
                        ? { type: "spring", duration: Math.max(0.1, stepDuration), bounce: 0.12 }
                        : progressMotion === "ease"
                            ? { duration: Math.max(0.05, stepDuration), ease: [0.4, 0, 0.2, 1] }
                            : { duration: Math.max(0.05, stepDuration), ease: "linear" }}
                style={vertical
                    ? { position: "absolute", left: lineInset - progressThickness / 2, top: verticalTrack.top, height: verticalTrack.height, width: progressThickness, background: progressColor, borderRadius: 999, transformOrigin: "top center", transform: isStatic ? `scaleY(${displayedProgress})` : undefined }
                    : { position: "absolute", left: horizontalInset, right: horizontalInset, top: lineInset - progressThickness / 2, height: progressThickness, background: progressColor, borderRadius: 999, transformOrigin: "left center", transform: isStatic ? `scaleX(${displayedProgress})` : undefined }}
            />

            {safeSteps.map((step, index) => {
                const done = index <= displayedCompleted
                const node = (
                    <motion.div
                        ref={(element) => {
                            nodeRefs.current[index] = element
                        }}
                        key={`node-${index}`}
                        animate={isStatic ? undefined : {
                            backgroundColor: done ? resolvedActiveBackground : nodeBackground,
                            borderColor: done ? activeStrokeColor : nodeStrokeColor,
                            scale: 1,
                        }}
                        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            width: nodeSize,
                            height: nodeSize,
                            borderRadius: nodeRadius,
                            border: `${nodeStrokeWidth}px solid ${done ? activeStrokeColor : nodeStrokeColor}`,
                            borderColor: done ? activeStrokeColor : nodeStrokeColor,
                            backgroundColor: done ? resolvedActiveBackground : nodeBackground,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            boxSizing: "border-box",
                            position: "relative",
                            zIndex: 2,
                            boxShadow: showShadow ? shadow : "none",
                            justifySelf: vertical ? "start" : "center",
                            gridColumn: vertical ? 1 : index + 1,
                            gridRow: vertical ? index + 1 : 1,
                        }}
                    >
                        {showIcons && (
                            <div style={{ width: iconSize, height: iconSize, position: "relative" }}>
                                <motion.div
                                    initial={false}
                                    animate={isStatic ? undefined : { opacity: done ? 0 : 1, scale: done ? 0.9 : 1, filter: done ? "blur(3px)" : "blur(0px)" }}
                                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: isStatic && done ? 0 : 1 }}
                                >
                                    {step.icon?.src ? (
                                        <TintedIcon color={iconColor} icon={step.icon} />
                                    ) : <PlaceholderIcon color={iconColor} index={index} />}
                                </motion.div>
                                <motion.div
                                    initial={false}
                                    animate={isStatic ? undefined : { opacity: done ? 1 : 0, scale: done ? 1 : 0.88, filter: done ? "blur(0px)" : "blur(3px)" }}
                                    transition={{ duration: 0.36, delay: done ? 0.04 : 0, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: isStatic && done ? 1 : 0 }}
                                >
                                    <CompletionIcon color={checkColor} icon={checkIcon} />
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                )

                const copy = (
                    <div
                        key={`copy-${index}`}
                        style={{
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: textGap,
                            textAlign: vertical ? "left" : "center",
                            gridColumn: vertical ? 2 : index + 1,
                            gridRow: vertical ? index + 1 : 2,
                            paddingTop: vertical ? 0 : contentGap,
                            alignSelf: vertical ? "center" : "start",
                            transform: vertical ? `translateY(${mobileTextOffset}px)` : undefined,
                        }}
                    >
                        {showStepNumber && (
                            <div style={{ ...numberFont, color: numberColor }}>{formatStepNumber(step.number, index, numberFormat)}</div>
                        )}
                        {showTitle && (
                            <div style={{ ...titleFont, color: titleColor }}>{translateDisplayString(step.title)}</div>
                        )}
                        {showDescription && (
                            <div style={{ ...descriptionFont, color: descriptionColor }}>{translateDisplayString(step.description)}</div>
                        )}
                    </div>
                )

                return <React.Fragment key={index}>{node}{copy}</React.Fragment>
            })}
        </section>
    )
}

addPropertyControls(StepProgress, {
    steps: {
        type: ControlType.Array,
        title: "Steps",
        maxCount: 12,
        description: "Add, remove and reorder the steps in the process.",
        control: {
            type: ControlType.Object,
            buttonTitle: "Step",
            controls: {
                number: { type: ControlType.String, title: "Number", defaultValue: "01" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Step title" },
                description: { type: ControlType.String, title: "Description", defaultValue: "Describe this step.", displayTextArea: true },
                icon: { type: ControlType.ResponsiveImage, title: "Icon" },
            },
        },
        defaultValue: fallbackSteps,
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        buttonTitle: "Animation",
        icon: "effect",
        defaultValue: { playback: "loop", progressMotion: "ease", stepDuration: 1.1, canvasState: 3, stepPause: 0.22, startDelay: 0.8, loopPause: 1.8 },
        controls: {
            playback: { type: ControlType.Enum, title: "Playback", options: ["loop", "once"], optionTitles: ["Loop", "Once"], defaultValue: "loop", displaySegmentedControl: true },
            progressMotion: { type: ControlType.Enum, title: "Motion", description: "Choose steady, eased, or spring movement.", options: ["linear", "ease", "spring"], optionTitles: ["Linear", "Ease", "Spring"], defaultValue: "ease", displaySegmentedControl: true },
            canvasState: { type: ControlType.Number, title: "Canvas State", description: "Number of completed steps shown on the Framer canvas only.", defaultValue: 3, min: 0, max: 12, step: 1, displayStepper: true },
            stepDuration: { type: ControlType.Number, title: "Step Time", description: "Time for the line to travel between two steps.", defaultValue: 1.1, min: 0.1, max: 8, step: 0.1, unit: "s" },
            stepPause: { type: ControlType.Number, title: "Step Pause", description: "Optional hold after a step is completed.", defaultValue: 0.22, min: 0, max: 3, step: 0.05, unit: "s" },
            startDelay: { type: ControlType.Number, title: "Start Delay", description: "Delay before the first animation starts.", defaultValue: 0.8, min: 0, max: 8, step: 0.1, unit: "s" },
            loopPause: { type: ControlType.Number, title: "Loop Pause", description: "Hold after the last step before restarting.", defaultValue: 1.8, min: 0, max: 12, step: 0.1, unit: "s", hidden: (value) => value.playback !== "loop" },
        },
    },
    lines: {
        type: ControlType.Object,
        title: "Lines",
        buttonTitle: "Lines",
        icon: "object",
        description: "Style the inactive track and animated progress line.",
        defaultValue: { baseColor: "#E7E7E9", baseThickness: 10, progressColor: "#28336F", progressThickness: 10 },
        controls: {
            baseColor: { type: ControlType.Color, title: "Base Color", defaultValue: "#E7E7E9" },
            baseThickness: { type: ControlType.Number, title: "Base Width", description: "Thickness of the inactive line.", defaultValue: 10, min: 1, max: 16, step: 1, unit: "px" },
            progressColor: { type: ControlType.Color, title: "Progress Color", defaultValue: "#28336F" },
            progressThickness: { type: ControlType.Number, title: "Progress Width", description: "Thickness of the animated line.", defaultValue: 10, min: 1, max: 16, step: 1, unit: "px" },
        },
    },
    stepStyle: {
        type: ControlType.Object,
        title: "Steps & Icons",
        buttonTitle: "Steps & Icons",
        icon: "object",
        description: "Control step shapes, icons, completion mark, strokes and shadow.",
        defaultValue: { showIcons: true, nodeSize: 36, iconSize: 20, nodeStrokeWidth: 3, nodeRadius: 10, nodeBackground: "#FFFFFF", activeBackgroundColor: "#28336F", nodeStrokeColor: "#E7E7E9", activeStrokeColor: "#28336F", iconColor: "#28336F", checkColor: "#FFFFFF", showShadow: true, shadow: "0px 8px 18px 0px rgba(40, 51, 111, 0.2)" },
        controls: {
            showIcons: { type: ControlType.Boolean, title: "Show Icons", description: "Show step icons and the completion mark.", defaultValue: true },
            iconSize: { type: ControlType.Number, title: "Icon Size", description: "Size of the step icon and completion mark.", defaultValue: 20, min: 4, max: 96, step: 1, unit: "px", hidden: (value) => value.showIcons === false },
            iconColor: { type: ControlType.Color, title: "Icon Color", description: "Tint color for step icons. SVG or transparent PNG works best.", defaultValue: "#28336F", hidden: (value) => value.showIcons === false },
            checkIcon: { type: ControlType.ResponsiveImage, title: "Check Icon", description: "Optional custom completion icon. SVG works best.", hidden: (value) => value.showIcons === false },
            checkColor: { type: ControlType.Color, title: "Check Icon Color", defaultValue: "#FFFFFF", hidden: (value) => value.showIcons === false },
            nodeSize: { type: ControlType.Number, title: "BG Size", description: "Size of the shape behind each icon.", defaultValue: 36, min: 20, max: 120, step: 1, unit: "px" },
            nodeRadius: { type: ControlType.Number, title: "BG Radius", defaultValue: 10, min: 0, max: 60, step: 1, unit: "px" },
            nodeBackground: { type: ControlType.Color, title: "Idle BG", defaultValue: "#FFFFFF" },
            activeBackgroundColor: { type: ControlType.Color, title: "Active BG", description: "Background of completed steps. Uses Progress Color when unset.", defaultValue: "#28336F", optional: true },
            nodeStrokeWidth: { type: ControlType.Number, title: "Stroke Width", defaultValue: 3, min: 0, max: 40, step: 1, unit: "px" },
            nodeStrokeColor: { type: ControlType.Color, title: "Idle Stroke", defaultValue: "#E7E7E9" },
            activeStrokeColor: { type: ControlType.Color, title: "Active Stroke", defaultValue: "#28336F" },
            showShadow: { type: ControlType.Boolean, title: "Show Shadow", defaultValue: true },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0px 8px 18px 0px rgba(40, 51, 111, 0.2)", hidden: (value) => value.showShadow === false },
        },
    },
    textStyle: {
        type: ControlType.Object,
        title: "Text",
        buttonTitle: "Text",
        icon: "object",
        description: "Control step numbers, typography and text colors.",
        defaultValue: { showStepNumber: true, numberFormat: "padded", showTitle: true, showDescription: true, numberColor: "#B0B0B4", titleColor: "#242426", descriptionColor: "#A4A4A8", textGap: 5 },
        controls: {
            showStepNumber: { type: ControlType.Boolean, title: "Step Number", description: "Show or hide the number for each step.", defaultValue: true },
            numberFormat: { type: ControlType.Enum, title: "Number Format", description: "Choose the automatic numbering style.", options: ["padded", "numeric", "alpha", "roman"], optionTitles: ["01, 02, 03", "1, 2, 3", "A, B, C", "I, II, III"], defaultValue: "padded", hidden: (value) => value.showStepNumber === false },
            numberColor: { type: ControlType.Color, title: "Number Color", defaultValue: "#B0B0B4", hidden: (value) => value.showStepNumber === false },
            numberFont: { type: ControlType.Font, title: "Number Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 10, variant: "Medium", letterSpacing: "0.1em", lineHeight: "1.2em" }, hidden: (value) => value.showStepNumber === false },
            showTitle: { type: ControlType.Boolean, title: "Show Title", description: "Show or hide the title for each step.", defaultValue: true },
            titleColor: { type: ControlType.Color, title: "Title Color", defaultValue: "#242426", hidden: (value) => value.showTitle === false },
            titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 16, variant: "Regular", letterSpacing: "-0.025em", lineHeight: "1.2em" }, hidden: (value) => value.showTitle === false },
            showDescription: { type: ControlType.Boolean, title: "Show Description", description: "Show or hide the description for each step.", defaultValue: true },
            descriptionColor: { type: ControlType.Color, title: "Body Color", defaultValue: "#A4A4A8", hidden: (value) => value.showDescription === false },
            descriptionFont: { type: ControlType.Font, title: "Body Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 12, variant: "Regular", letterSpacing: "-0.015em", lineHeight: "1.35em" }, hidden: (value) => value.showDescription === false },
            textGap: { type: ControlType.Number, title: "Text Gap", description: "Space between the visible number, title and description.", defaultValue: 5, min: 0, max: 40, step: 1, unit: "px" },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        buttonTitle: "Layout",
        icon: "object",
        defaultValue: { mobileAt: 640, contentGap: 16, itemGap: 8, mobileStepGap: 8, mobileTextOffset: 0 },
        controls: {
            mobileAt: { type: ControlType.Number, title: "Vertical At", description: "Switch to vertical layout below this component width.", defaultValue: 640, min: 240, max: 1200, step: 10, unit: "px" },
            contentGap: { type: ControlType.Number, title: "Copy Gap", description: "Space between the step shape and its text.", defaultValue: 16, min: 0, max: 60, step: 1, unit: "px" },
            itemGap: { type: ControlType.Number, title: "Step Gap", description: "Horizontal space between steps on desktop.", defaultValue: 8, min: 0, max: 120, step: 1, unit: "px" },
            mobileStepGap: { type: ControlType.Number, title: "Mobile Gap", description: "Vertical space between steps on mobile.", defaultValue: 8, min: 0, max: 120, step: 1, unit: "px" },
            mobileTextOffset: { type: ControlType.Number, title: "Text Offset", description: "Move the mobile text block vertically. Positive values move it down.", defaultValue: 0, min: -40, max: 40, step: 1, unit: "px" },
        },
    },
})
