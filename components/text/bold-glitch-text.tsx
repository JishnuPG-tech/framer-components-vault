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

import { gsap } from "gsap"

type PresetName =
    | "custom"
    | "cleanCut"
    | "sharpDigital"
    | "heavyBreak"
    | "editorial"
    | "minimal"
    | "titleTemplate"

type TriggerMode = "loop" | "once" | "hover"
type Cadence = "clean" | "sharp" | "aggressive" | "editorial"
type ColorMode = "single" | "threeColor"

type FramerFont = React.CSSProperties & {
    variant?: string
}

interface PresetConfig {
    duration: number
    intensity: number
    slices: number
    blocks: number
    cadence: Cadence
}

interface BoldGlitchTextProps {
    text: string
    font: FramerFont
    color: string
    uppercase: boolean

    colorMode: ColorMode
    glitchColor: string
    glitchColorA: string
    glitchColorB: string
    glitchColorC: string
    colorSpread: number

    preset: PresetName
    presetStrength: number
    presetSpeed: number

    animate: boolean
    animateOnCanvas: boolean
    trigger: TriggerMode

    duration: number
    intensity: number
    slices: number
    blocks: number
    cadence: Cadence
    pixelSnap: boolean

    style?: React.CSSProperties
}

const PRESETS: Record<Exclude<PresetName, "custom">, PresetConfig> = {
    cleanCut: {
        duration: 2.45,
        intensity: 4.8,
        slices: 9,
        blocks: 2,
        cadence: "clean",
    },
    sharpDigital: {
        duration: 2.15,
        intensity: 7.3,
        slices: 14,
        blocks: 6,
        cadence: "sharp",
    },
    heavyBreak: {
        duration: 1.85,
        intensity: 9.1,
        slices: 18,
        blocks: 9,
        cadence: "aggressive",
    },
    editorial: {
        duration: 2.75,
        intensity: 5.9,
        slices: 11,
        blocks: 4,
        cadence: "editorial",
    },
    minimal: {
        duration: 3.1,
        intensity: 3.2,
        slices: 6,
        blocks: 1,
        cadence: "clean",
    },
    titleTemplate: {
        duration: 2.2,
        intensity: 7.4,
        slices: 14,
        blocks: 6,
        cadence: "sharp",
    },
}

/**
 * @framerIntrinsicWidth 760
 * @framerIntrinsicHeight 240
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function BoldGlitchText(props: BoldGlitchTextProps) {
    const {
        text,
        font,
        color,
        uppercase,

        colorMode,
        glitchColor,
        glitchColorA,
        glitchColorB,
        glitchColorC,
        colorSpread,

        preset,
        presetStrength,
        presetSpeed,

        animate,
        animateOnCanvas,
        trigger,

        duration,
        intensity,
        slices,
        blocks,
        cadence,
        pixelSnap,
        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const timelineRef = React.useRef<gsap.core.Timeline | null>(null)

    const isStaticRenderer = useIsStaticRenderer()
    const renderTarget = RenderTarget.current()
    const reducedMotion = useReducedMotion()

    const resolved = React.useMemo(() => {
        if (preset === "custom") {
            return {
                duration: clamp(duration, 0.75, 8),
                intensity: clamp(intensity, 0, 10),
                slices: Math.round(clamp(slices, 4, 22)),
                blocks: Math.round(clamp(blocks, 0, 14)),
                cadence,
            }
        }

        const selected = PRESETS[preset]
        const speed = clamp(presetSpeed, 0.5, 1.8)
        const strength = clamp(presetStrength, 0.4, 1.4)

        return {
            duration: clamp(selected.duration / speed, 0.75, 8),
            intensity: clamp(selected.intensity * strength, 0, 10),
            slices: Math.round(clamp(selected.slices, 4, 22)),
            blocks: Math.round(clamp(selected.blocks, 0, 14)),
            cadence: selected.cadence,
        }
    }, [
        preset,
        presetStrength,
        presetSpeed,
        duration,
        intensity,
        slices,
        blocks,
        cadence,
    ])

    const safeText = text?.trim() ? text : "BOLD\nGLITCH"

    const activeColorA = colorMode === "threeColor" ? glitchColorA : glitchColor
    const activeColorB = colorMode === "threeColor" ? glitchColorB : glitchColor
    const activeColorC = colorMode === "threeColor" ? glitchColorC : glitchColor

    const spread = clamp(colorSpread, 0, 10)

    const textAlign = (font?.textAlign ||
        "center") as React.CSSProperties["textAlign"]

    const justifyContent =
        textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center"

    const shouldAnimate =
        animate &&
        !reducedMotion &&
        (!isStaticRenderer ||
            (renderTarget === RenderTarget.canvas && animateOnCanvas))

    const sliceData = React.useMemo(() => {
        const rows: SliceData[] = []
        const rowHeight = 100 / resolved.slices

        for (let i = 0; i < resolved.slices; i++) {
            const jitter = seeded(i, 10) * rowHeight * 0.36
            const height = clamp(
                rowHeight * (0.68 + seeded(i, 11) * 0.72),
                2.5,
                17
            )
            const top = clamp(i * rowHeight + jitter, 0, 97)
            const bottom = clamp(100 - top - height, 0, 100)

            const direction = i % 2 === 0 ? -1 : 1
            const energy = 0.62 + seeded(i, 12) * 1.08

            rows.push({
                id: i,
                top,
                bottom,
                colorIndex: i % 3,
                x: direction * (7 + resolved.intensity * 5.25) * energy,
                y: (seeded(i, 13) - 0.5) * resolved.intensity * 1.65,
                skew: direction * (0.45 + resolved.intensity * 0.58) * energy,
                opacity: 0.62 + seeded(i, 14) * 0.38,
            })
        }

        return rows
    }, [resolved.slices, resolved.intensity])

    const blockData = React.useMemo(() => {
        return Array.from({ length: resolved.blocks }, (_, i) => {
            const top = 4 + seeded(i, 40) * 89
            const height = 3.8 + seeded(i, 41) * 13
            const bottom = clamp(100 - top - height, 0, 100)

            const direction = i % 2 === 0 ? 1 : -1
            const energy = 0.78 + seeded(i, 42) * 1.28

            return {
                id: i,
                top,
                bottom,
                colorIndex: (i + 1) % 3,
                x: direction * (11 + resolved.intensity * 6.2) * energy,
                y: (seeded(i, 43) - 0.5) * resolved.intensity * 2.1,
                scaleX: 0.93 + seeded(i, 44) * 0.17,
                opacity: 0.48 + seeded(i, 45) * 0.44,
            }
        })
    }, [resolved.blocks, resolved.intensity])

    React.useEffect(() => {
        const root = rootRef.current
        if (!root) return

        const ctx = gsap.context(() => {
            const q = gsap.utils.selector(root)

            const title = q(".bgt-title")[0] as HTMLElement | undefined
            const shadowA = q(".bgt-shadow-a")[0] as HTMLElement | undefined
            const shadowB = q(".bgt-shadow-b")[0] as HTMLElement | undefined
            const shadowC = q(".bgt-shadow-c")[0] as HTMLElement | undefined
            const sliceEls = q(".bgt-slice") as HTMLElement[]
            const blockEls = q(".bgt-block") as HTMLElement[]

            if (!title) return

            const titleSetter = createTitleSetter(title)

            const shadowLayers = [shadowA, shadowB, shadowC]
                .filter(Boolean)
                .map((el) => createLayerSetter(el as HTMLElement))

            const sliceLayers = sliceEls.map(createLayerSetter)
            const blockLayers = blockEls.map(createLayerSetter)

            const allLayers = [...shadowLayers, ...sliceLayers, ...blockLayers]

            gsap.set([title, ...allLayers.map((item) => item.el)], {
                force3D: true,
                transformOrigin: "50% 50%",
            })

            resetTitle(titleSetter)
            allLayers.forEach(resetLayer)

            if (!shouldAnimate) return

            const cycle = resolved.duration
            const pattern = getCadencePattern(resolved.cadence)
            const colorOffset = 1.4 + resolved.intensity * 1.85 + spread * 0.9
            const snap = pixelSnap

            const tl = gsap.timeline({
                repeat: trigger === "loop" ? -1 : 0,
                paused: true,
                defaults: { ease: "none" },
            })

            timelineRef.current = tl

            tl.to({}, { duration: cycle }, 0)

            const resetAll = () => {
                resetTitle(titleSetter)
                allLayers.forEach(resetLayer)
            }

            const applyBurst = (burst: Burst) => {
                const titleX = snapValue(
                    burst.direction *
                        burst.power *
                        (1 + resolved.intensity * 0.72),
                    snap
                )

                const titleSkew = snapValue(
                    burst.direction *
                        burst.power *
                        (1.1 + resolved.intensity * 0.46),
                    snap
                )

                titleSetter.x(titleX)
                titleSetter.skewX(titleSkew)
                titleSetter.scaleX(1 + burst.power * 0.005)

                const layerA = shadowLayers[0]
                const layerB = shadowLayers[1]
                const layerC = shadowLayers[2]

                if (layerA) {
                    setLayer(layerA, {
                        opacity: colorMode === "threeColor" ? 0.78 : 0.88,
                        x: snapValue(
                            -burst.direction * colorOffset * burst.power,
                            snap
                        ),
                        y: snapValue(-1 * burst.power, snap),
                        skewX: snapValue(-titleSkew * 0.36, snap),
                        scaleX: 1,
                    })
                }

                if (layerB) {
                    setLayer(layerB, {
                        opacity: colorMode === "threeColor" ? 0.7 : 0.58,
                        x: snapValue(
                            burst.direction * colorOffset * 0.86 * burst.power,
                            snap
                        ),
                        y: snapValue(1 * burst.power, snap),
                        skewX: snapValue(titleSkew * 0.26, snap),
                        scaleX: 1,
                    })
                }

                if (layerC) {
                    setLayer(layerC, {
                        opacity: colorMode === "threeColor" ? 0.56 : 0,
                        x: snapValue(
                            burst.direction * colorOffset * -0.42 * burst.power,
                            snap
                        ),
                        y: snapValue(1.5 * burst.power, snap),
                        skewX: snapValue(titleSkew * -0.18, snap),
                        scaleX: 1 + burst.power * 0.012,
                    })
                }

                sliceLayers.forEach((layer, index) => {
                    const data = sliceData[index]
                    const active = index % burst.density !== 1

                    if (!data || !active) {
                        resetLayer(layer)
                        return
                    }

                    const colorMultiplier =
                        colorMode === "threeColor"
                            ? 1 + data.colorIndex * 0.16
                            : 1

                    setLayer(layer, {
                        opacity: data.opacity,
                        x: snapValue(
                            data.x *
                                burst.power *
                                burst.direction *
                                colorMultiplier,
                            snap
                        ),
                        y: snapValue(data.y * burst.power, snap),
                        skewX: snapValue(data.skew * burst.power, snap),
                        scaleX: 1,
                    })
                })

                blockLayers.forEach((layer, index) => {
                    const data = blockData[index]
                    const active = index % Math.max(2, burst.density - 1) === 0

                    if (!data || !active) {
                        resetLayer(layer)
                        return
                    }

                    const colorMultiplier =
                        colorMode === "threeColor"
                            ? 1 + data.colorIndex * 0.18
                            : 1

                    setLayer(layer, {
                        opacity: data.opacity,
                        x: snapValue(
                            data.x *
                                burst.power *
                                burst.direction *
                                colorMultiplier,
                            snap
                        ),
                        y: snapValue(data.y * burst.power, snap),
                        skewX: 0,
                        scaleX: data.scaleX,
                    })
                })
            }

            pattern.forEach((burst) => {
                const start = cycle * burst.ratio
                tl.call(() => applyBurst(burst), [], start)
                tl.call(resetAll, [], start + burst.hold)
            })

            tl.call(resetAll, [], cycle - 0.015)

            if (trigger !== "hover") {
                tl.play(0)
            }
        }, root)

        return () => {
            timelineRef.current?.kill()
            timelineRef.current = null
            ctx.revert()
        }
    }, [
        shouldAnimate,
        trigger,
        resolved,
        pixelSnap,
        colorMode,
        spread,
        sliceData,
        blockData,
    ])

    const playHover = React.useCallback(() => {
        if (trigger !== "hover" || !shouldAnimate) return
        timelineRef.current?.restart(true)
    }, [trigger, shouldAnimate])

    const rootStyle: React.CSSProperties = {
        ...style,
        width: "100%",
        height: "100%",
        minWidth: 120,
        minHeight: 56,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent,
        overflow: "visible",
        isolation: "isolate",
        color,
        ["--bgt-color" as any]: color,
        ["--bgt-glitch" as any]: glitchColor,
        ["--bgt-glitch-a" as any]: activeColorA,
        ["--bgt-glitch-b" as any]: activeColorB,
        ["--bgt-glitch-c" as any]: activeColorC,
    }

    const titleStyle: React.CSSProperties = {
        ...font,
        margin: 0,
        position: "relative",
        display: "inline-block",
        maxWidth: "100%",
        color,
        textAlign,
        textTransform: uppercase ? "uppercase" : "none",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        lineHeight: font?.lineHeight ?? 0.9,
        letterSpacing: font?.letterSpacing ?? "-0.06em",
        fontWeight: font?.fontWeight ?? 900,
        WebkitFontSmoothing: "antialiased",
        textRendering: "geometricPrecision",
        transform: "translate3d(0, 0, 0)",
    }

    return (
        <div
            ref={rootRef}
            className={pixelSnap ? "bgt-root bgt-pixel" : "bgt-root"}
            style={rootStyle}
            onPointerEnter={playHover}
        >
            <style>{css}</style>

            <h1 className="bgt-title" style={titleStyle}>
                <span className="bgt-base">{safeText}</span>

                <span className="bgt-shadow bgt-shadow-a" aria-hidden="true">
                    {safeText}
                </span>

                <span className="bgt-shadow bgt-shadow-b" aria-hidden="true">
                    {safeText}
                </span>

                <span className="bgt-shadow bgt-shadow-c" aria-hidden="true">
                    {safeText}
                </span>

                {sliceData.map((slice) => (
                    <span
                        key={slice.id}
                        className={`bgt-slice bgt-color-${slice.colorIndex}`}
                        aria-hidden="true"
                        style={{
                            clipPath: `inset(${slice.top}% 0 ${slice.bottom}% 0)`,
                        }}
                    >
                        {safeText}
                    </span>
                ))}

                {blockData.map((block) => (
                    <span
                        key={block.id}
                        className={`bgt-block bgt-color-${block.colorIndex}`}
                        aria-hidden="true"
                        style={{
                            clipPath: `inset(${block.top}% 0 ${block.bottom}% 0)`,
                        }}
                    >
                        {safeText}
                    </span>
                ))}
            </h1>
        </div>
    )
}

interface SliceData {
    id: number
    top: number
    bottom: number
    colorIndex: number
    x: number
    y: number
    skew: number
    opacity: number
}

interface Burst {
    ratio: number
    power: number
    direction: 1 | -1
    hold: number
    density: number
}

type QuickSetter = (value: number) => void

interface LayerSetter {
    el: HTMLElement
    x: QuickSetter
    y: QuickSetter
    skewX: QuickSetter
    scaleX: QuickSetter
    opacity: QuickSetter
}

interface TitleSetter {
    x: QuickSetter
    skewX: QuickSetter
    scaleX: QuickSetter
}

function createTitleSetter(el: HTMLElement): TitleSetter {
    return {
        x: gsap.quickSetter(el, "x", "px") as QuickSetter,
        skewX: gsap.quickSetter(el, "skewX", "deg") as QuickSetter,
        scaleX: gsap.quickSetter(el, "scaleX") as QuickSetter,
    }
}

function createLayerSetter(el: HTMLElement): LayerSetter {
    return {
        el,
        x: gsap.quickSetter(el, "x", "px") as QuickSetter,
        y: gsap.quickSetter(el, "y", "px") as QuickSetter,
        skewX: gsap.quickSetter(el, "skewX", "deg") as QuickSetter,
        scaleX: gsap.quickSetter(el, "scaleX") as QuickSetter,
        opacity: gsap.quickSetter(el, "opacity") as QuickSetter,
    }
}

function resetTitle(title: TitleSetter) {
    title.x(0)
    title.skewX(0)
    title.scaleX(1)
}

function resetLayer(layer: LayerSetter) {
    layer.x(0)
    layer.y(0)
    layer.skewX(0)
    layer.scaleX(1)
    layer.opacity(0)
    layer.el.style.visibility = "hidden"
}

function setLayer(
    layer: LayerSetter,
    value: {
        opacity: number
        x: number
        y: number
        skewX: number
        scaleX: number
    }
) {
    layer.opacity(clamp(value.opacity, 0, 1))
    layer.x(value.x)
    layer.y(value.y)
    layer.skewX(value.skewX)
    layer.scaleX(value.scaleX)
    layer.el.style.visibility = value.opacity > 0.001 ? "visible" : "hidden"
}

function getCadencePattern(cadence: Cadence): Burst[] {
    if (cadence === "clean") {
        return [
            {
                ratio: 0.06,
                power: 0.58,
                direction: -1,
                hold: 0.034,
                density: 4,
            },
            { ratio: 0.18, power: 0.82, direction: 1, hold: 0.042, density: 3 },
            { ratio: 0.42, power: 0.44, direction: -1, hold: 0.03, density: 5 },
            { ratio: 0.68, power: 0.66, direction: 1, hold: 0.038, density: 4 },
        ]
    }

    if (cadence === "aggressive") {
        return [
            {
                ratio: 0.025,
                power: 1.1,
                direction: -1,
                hold: 0.052,
                density: 2,
            },
            { ratio: 0.08, power: 0.76, direction: 1, hold: 0.034, density: 3 },
            {
                ratio: 0.145,
                power: 1.34,
                direction: 1,
                hold: 0.062,
                density: 2,
            },
            {
                ratio: 0.225,
                power: 0.64,
                direction: -1,
                hold: 0.034,
                density: 3,
            },
            { ratio: 0.34, power: 1.0, direction: -1, hold: 0.05, density: 2 },
            { ratio: 0.52, power: 0.58, direction: 1, hold: 0.034, density: 4 },
            {
                ratio: 0.74,
                power: 0.72,
                direction: -1,
                hold: 0.038,
                density: 3,
            },
        ]
    }

    if (cadence === "editorial") {
        return [
            {
                ratio: 0.04,
                power: 0.78,
                direction: -1,
                hold: 0.044,
                density: 4,
            },
            { ratio: 0.23, power: 1.02, direction: 1, hold: 0.052, density: 3 },
            {
                ratio: 0.36,
                power: 0.36,
                direction: -1,
                hold: 0.026,
                density: 6,
            },
            { ratio: 0.61, power: 0.72, direction: 1, hold: 0.04, density: 4 },
            {
                ratio: 0.82,
                power: 0.42,
                direction: -1,
                hold: 0.026,
                density: 5,
            },
        ]
    }

    return [
        { ratio: 0.035, power: 0.96, direction: -1, hold: 0.05, density: 3 },
        { ratio: 0.105, power: 0.58, direction: 1, hold: 0.034, density: 4 },
        { ratio: 0.185, power: 1.22, direction: 1, hold: 0.06, density: 2 },
        { ratio: 0.31, power: 0.48, direction: -1, hold: 0.03, density: 5 },
        { ratio: 0.455, power: 0.82, direction: -1, hold: 0.046, density: 3 },
        { ratio: 0.69, power: 0.38, direction: 1, hold: 0.026, density: 5 },
    ]
}

function useReducedMotion() {
    const [reduced, setReduced] = React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return

        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(media.matches)

        update()

        if (media.addEventListener) {
            media.addEventListener("change", update)
            return () => media.removeEventListener("change", update)
        }

        media.addListener(update)
        return () => media.removeListener(update)
    }, [])

    return reduced
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function seeded(index: number, salt: number) {
    const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123
    return value - Math.floor(value)
}

function snapValue(value: number, snap: boolean) {
    if (!Number.isFinite(value)) return 0
    return snap ? Math.round(value) : value
}

const css = `
.bgt-root,
.bgt-root * {
    box-sizing: border-box;
}

.bgt-root {
    font-synthesis: none;
}

.bgt-title {
    user-select: none;
    transform-origin: 50% 50%;
}

.bgt-base {
    position: relative;
    z-index: 5;
}

.bgt-shadow,
.bgt-slice,
.bgt-block {
    position: absolute;
    inset: 0;
    display: inline-block;
    white-space: inherit;
    word-break: inherit;
    text-align: inherit;
    text-transform: inherit;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transform: translate3d(0, 0, 0);
    transform-origin: 50% 50%;
    will-change: transform, opacity;
}

.bgt-shadow {
    z-index: 2;
}

.bgt-shadow-a {
    color: var(--bgt-glitch-a);
    clip-path: inset(0 0 54% 0);
}

.bgt-shadow-b {
    color: var(--bgt-glitch-b);
    clip-path: inset(35% 0 28% 0);
}

.bgt-shadow-c {
    color: var(--bgt-glitch-c);
    clip-path: inset(47% 0 0 0);
}

.bgt-slice {
    z-index: 6;
}

.bgt-block {
    z-index: 7;
}

.bgt-color-0 {
    color: var(--bgt-glitch-a);
}

.bgt-color-1 {
    color: var(--bgt-glitch-b);
}

.bgt-color-2 {
    color: var(--bgt-glitch-c);
}

.bgt-pixel .bgt-title,
.bgt-pixel .bgt-shadow,
.bgt-pixel .bgt-slice,
.bgt-pixel .bgt-block {
    backface-visibility: hidden;
}

@media (prefers-reduced-motion: reduce) {
    .bgt-shadow,
    .bgt-slice,
    .bgt-block {
        opacity: 0 !important;
        visibility: hidden !important;
        transform: none !important;
    }
}
`

BoldGlitchText.defaultProps = {
    text: "BOLD\nGLITCH",
    font: {
        fontSize: 96,
        lineHeight: 0.9,
        letterSpacing: "-0.06em",
        textAlign: "center",
        fontWeight: 900,
        variant: "Black",
    },
    color: "#000000",
    uppercase: true,

    colorMode: "threeColor",
    glitchColor: "#FFFFFF",
    glitchColorA: "#00E5FF",
    glitchColorB: "#FF2D7A",
    glitchColorC: "#FFE600",
    colorSpread: 5,

    preset: "sharpDigital",
    presetStrength: 1,
    presetSpeed: 1,

    animate: true,
    animateOnCanvas: false,
    trigger: "loop",

    duration: 2.2,
    intensity: 7.4,
    slices: 14,
    blocks: 6,
    cadence: "sharp",
    pixelSnap: true,
}

addPropertyControls(BoldGlitchText, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: "BOLD\nGLITCH",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultFontType: "sans-serif",
        defaultFontSize: "96px",
        displayTextAlignment: true,
        displayFontSize: true,
        controls: "extended",
        defaultValue: {
            fontSize: 96,
            lineHeight: 0.9,
            letterSpacing: "-0.06em",
            textAlign: "center",
            fontWeight: 900,
            variant: "Black",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
    },

    colorMode: {
        type: ControlType.Enum,
        title: "Color Mode",
        options: ["single", "threeColor"],
        optionTitles: ["Single", "3 Colors"],
        defaultValue: "threeColor",
    },
    glitchColor: {
        type: ControlType.Color,
        title: "Glitch",
        defaultValue: "#FFFFFF",
        hidden: ({ colorMode }) => colorMode !== "single",
    },
    glitchColorA: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#00E5FF",
        hidden: ({ colorMode }) => colorMode !== "threeColor",
    },
    glitchColorB: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#FF2D7A",
        hidden: ({ colorMode }) => colorMode !== "threeColor",
    },
    glitchColorC: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#FFE600",
        hidden: ({ colorMode }) => colorMode !== "threeColor",
    },
    colorSpread: {
        type: ControlType.Number,
        title: "Spread",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: ({ colorMode }) => colorMode !== "threeColor",
    },

    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: [
            "custom",
            "cleanCut",
            "sharpDigital",
            "heavyBreak",
            "editorial",
            "minimal",
            "titleTemplate",
        ],
        optionTitles: [
            "Custom",
            "Clean Cut",
            "Sharp Digital",
            "Heavy Break",
            "Editorial",
            "Minimal",
            "Title Template",
        ],
        defaultValue: "sharpDigital",
    },
    presetStrength: {
        type: ControlType.Number,
        title: "Strength",
        min: 0.4,
        max: 1.4,
        step: 0.05,
        defaultValue: 1,
        hidden: ({ preset }) => preset === "custom",
    },
    presetSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.5,
        max: 1.8,
        step: 0.05,
        defaultValue: 1,
        hidden: ({ preset }) => preset === "custom",
    },

    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
    },
    animateOnCanvas: {
        type: ControlType.Boolean,
        title: "Canvas Motion",
        defaultValue: false,
        hidden: ({ animate }) => !animate,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["loop", "once", "hover"],
        optionTitles: ["Loop", "Once", "Hover"],
        defaultValue: "loop",
        hidden: ({ animate }) => !animate,
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.75,
        max: 8,
        step: 0.05,
        unit: "s",
        defaultValue: 2.2,
        hidden: ({ animate, preset }) => !animate || preset !== "custom",
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 7.4,
        hidden: ({ animate, preset }) => !animate || preset !== "custom",
    },
    slices: {
        type: ControlType.Number,
        title: "Slices",
        min: 4,
        max: 22,
        step: 1,
        defaultValue: 14,
        hidden: ({ animate, preset }) => !animate || preset !== "custom",
    },
    blocks: {
        type: ControlType.Number,
        title: "Blocks",
        min: 0,
        max: 14,
        step: 1,
        defaultValue: 6,
        hidden: ({ animate, preset }) => !animate || preset !== "custom",
    },
    cadence: {
        type: ControlType.Enum,
        title: "Cadence",
        options: ["clean", "sharp", "aggressive", "editorial"],
        optionTitles: ["Clean", "Sharp", "Aggressive", "Editorial"],
        defaultValue: "sharp",
        hidden: ({ animate, preset }) => !animate || preset !== "custom",
    },
    pixelSnap: {
        type: ControlType.Boolean,
        title: "Pixel Snap",
        defaultValue: true,
        hidden: ({ animate }) => !animate,
    },
})
