import type { CSSProperties } from "react"
import { useMemo, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useScroll, useSpring, useTransform } from "framer-motion"

type Mode = "flat" | "gradient"

type GradientDef = {
    angle: number
    color1: string
    color2: string
    extraColors?: string[]
}

interface ScrollColorSwitchProps {
    mode: Mode

    color1: string
    color2: string

    switch: "instant" | "smooth"

    gradientStart: GradientDef
    gradientEnd: GradientDef

    previewMode: "start" | "end"

    startRef: "top" | "center" | "bottom"
    startOffset: number
    endRef: "top" | "center" | "bottom"
    endOffset: number

    style?: CSSProperties
}

/**
 * Scroll Color Switch
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function ScrollColorSwitch(props: ScrollColorSwitchProps) {
    const {
        mode = "flat",
        color1 = "#FFFFFF",
        color2 = "#000000",
        gradientStart = {
            angle: 135,
            color1: "#00A3FF",
            color2: "#8855FF",
            extraColors: [],
        },
        gradientEnd = {
            angle: 135,
            color1: "#FF8A00",
            color2: "#FF2D55",
            extraColors: [],
        },
        previewMode = "start",
        startRef = "bottom",
        startOffset = 0,
        endRef = "center",
        endOffset = 0,
        style,
        switch: flatSwitch = "instant",
    } = props

    const isStatic = useIsStaticRenderer()
    const target = RenderTarget.current()
    const isCanvas = target === RenderTarget.canvas

    const containerRef = useRef<HTMLDivElement>(null)

    // 1. Dinamički proračun okidača (0 = vrh, 0.5 = sredina, 1 = dno)
    const startVal =
        startRef === "top"
            ? startOffset / 100
            : startRef === "center"
              ? 0.5 + startOffset / 100
              : 1 - startOffset / 100

    const endVal =
        endRef === "top"
            ? endOffset / 100
            : endRef === "center"
              ? 0.5 + endOffset / 100
              : 1 - endOffset / 100

    // 2. Primjena na framer-motion useScroll
    const { scrollYProgress } = useScroll({
        target: containerRef,
        // Koristimo "as any" ovdje zbog striktnih Intersection tipova u framer-motionu
        offset: [`start ${startVal}`, `end ${endVal}`] as any,
    })

    // 3. Easing
    const smoothScrollYProgress = useSpring(scrollYProgress, {
        stiffness: 300,
        damping: 40,
        mass: 1,
    })

    // 4. Pametni izračun gradijenata za glatku tranziciju
    // Pretvaramo objekte u stringove za siguran i precizan useMemo dependency
    const gradientStartStr = JSON.stringify(gradientStart)
    const gradientEndStr = JSON.stringify(gradientEnd)

    const gradientStrings = useMemo(() => {
        const start = (JSON.parse(gradientStartStr) || {}) as GradientDef
        const end = (JSON.parse(gradientEndStr) || {}) as GradientDef

        const sColors = [
            start.color1 || "#00A3FF",
            start.color2 || "#8855FF",
            ...(start.extraColors || []),
        ]
        const eColors = [
            end.color1 || "#FF8A00",
            end.color2 || "#FF2D55",
            ...(end.extraColors || []),
        ]

        const maxLen = Math.max(sColors.length, eColors.length)

        // Pad arrays tako da imamo isti broj boja
        while (sColors.length < maxLen)
            sColors.push(sColors[sColors.length - 1])
        while (eColors.length < maxLen)
            eColors.push(eColors[eColors.length - 1])

        const sAngle = Number.isFinite(start.angle) ? start.angle : 135
        const eAngle = Number.isFinite(end.angle) ? end.angle : 135

        const sStops = sColors.map(
            (c, i) => `${c} ${(i / (maxLen - 1)) * 100}%`
        )
        const eStops = eColors.map(
            (c, i) => `${c} ${(i / (maxLen - 1)) * 100}%`
        )

        return {
            start: `linear-gradient(${sAngle}deg, ${sStops.join(", ")})`,
            end: `linear-gradient(${eAngle}deg, ${eStops.join(", ")})`,
        }
    }, [gradientStartStr, gradientEndStr])

    // 5. Animacije
    // Opacity crossfade - koristi se za smooth flat i za SVE gradijente (GPU Optimizirano)
    const topLayerOpacity = useTransform(smoothScrollYProgress, [0, 1], [1, 0])

    // Instant switch - koristi se samo za flat instant mod
    const instantBackground = useTransform(smoothScrollYProgress, (v) =>
        v < 0.5 ? color1 : color2
    )

    // 6. Render logika
    if (isCanvas || isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    // FALLBACK: Solidna boja koja se renderira ako pukne gradijent
                    backgroundColor:
                        mode === "gradient"
                            ? previewMode === "end"
                                ? gradientEnd.color1 || "#FF8A00"
                                : gradientStart.color1 || "#00A3FF"
                            : color1,
                    // GLAVNI PRIKAZ: Gradijent koji se postavlja preko backgroundColor
                    backgroundImage:
                        mode === "gradient"
                            ? previewMode === "end"
                                ? gradientStrings.end
                                : gradientStrings.start
                            : "none",
                    ...style,
                }}
                aria-hidden={true}
            />
        )
    }

    // Određujemo trebamo li koristiti smooth GPU tehniku slojeva
    const isSmooth =
        mode === "gradient" || (mode === "flat" && flatSwitch === "smooth")

    if (isSmooth) {
        return (
            <motion.div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    isolation: "isolate", // Osigurava da z-index ne pobjegne iz komponente
                    ...style,
                }}
                aria-hidden={true}
            >
                {/* Donji sloj (Ciljana pozadina) */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor:
                            mode === "gradient"
                                ? gradientEnd.color1 || "#FF8A00"
                                : color2,
                        backgroundImage:
                            mode === "gradient" ? gradientStrings.end : "none",
                        zIndex: -2,
                    }}
                />
                {/* Gornji sloj (Početna pozadina koja blijedi) */}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor:
                            mode === "gradient"
                                ? gradientStart.color1 || "#00A3FF"
                                : color1,
                        backgroundImage:
                            mode === "gradient"
                                ? gradientStrings.start
                                : "none",
                        zIndex: -1,
                        opacity: topLayerOpacity, // Type safety omogućen bez 'as any'
                    }}
                />
            </motion.div>
        )
    }

    // Flat Instant Mod
    return (
        <motion.div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor: instantBackground, // Za flat boje backgroundColor je siguran i dovoljan
                ...style,
            }}
            aria-hidden={true}
        />
    )
}

addPropertyControls(ScrollColorSwitch, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["flat", "gradient"],
        optionTitles: ["Flat", "Gradient"],
        defaultValue: "flat",
        displaySegmentedControl: true,
    },
    switch: {
        type: ControlType.Enum,
        title: "Switch",
        options: ["instant", "smooth"],
        optionTitles: ["Instant", "Smooth"],
        defaultValue: "instant",
        displaySegmentedControl: true,
        hidden: ({ mode }) => mode !== "flat",
    },
    previewMode: {
        type: ControlType.Enum,
        title: "Preview on Canvas",
        options: ["start", "end"],
        optionTitles: ["Start", "End"],
        defaultValue: "start",
        displaySegmentedControl: true,
        hidden: ({ mode }) => mode !== "gradient",
    },
    color1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#0099FF",
        hidden: ({ mode }) => mode !== "flat",
    },
    color2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#111111",
        hidden: ({ mode }) => mode !== "flat",
    },
    gradientStart: {
        type: ControlType.Object,
        title: "Gradient Start",
        icon: "color",
        hidden: ({ mode }) => mode !== "gradient",
        controls: {
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 135,
                min: 0,
                max: 360,
                step: 1,
                unit: "deg",
            },
            color1: {
                type: ControlType.Color,
                title: "Color 1",
                defaultValue: "#00A3FF",
            },
            color2: {
                type: ControlType.Color,
                title: "Color 2",
                defaultValue: "#8855FF",
            },
            extraColors: {
                type: ControlType.Array,
                title: "Extra Colors",
                control: {
                    type: ControlType.Color,
                },
                defaultValue: [],
            },
        },
        defaultValue: {
            angle: 135,
            color1: "#00A3FF",
            color2: "#8855FF",
            extraColors: [],
        },
    },
    gradientEnd: {
        type: ControlType.Object,
        title: "Gradient End",
        icon: "color",
        hidden: ({ mode }) => mode !== "gradient",
        controls: {
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 135,
                min: 0,
                max: 360,
                step: 1,
                unit: "deg",
            },
            color1: {
                type: ControlType.Color,
                title: "Color 1",
                defaultValue: "#FF8A00",
            },
            color2: {
                type: ControlType.Color,
                title: "Color 2",
                defaultValue: "#FF2D55",
            },
            extraColors: {
                type: ControlType.Array,
                title: "Extra Colors",
                control: {
                    type: ControlType.Color,
                },
                defaultValue: [],
            },
        },
        defaultValue: {
            angle: 135,
            color1: "#FF8A00",
            color2: "#FF2D55",
            extraColors: [],
        },
    },
    startRef: {
        type: ControlType.Enum,
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "bottom",
        title: "Start Reference",
    },
    startOffset: {
        type: ControlType.Number,
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        title: "Start Offset (%)",
    },
    endRef: {
        type: ControlType.Enum,
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        title: "End Reference",
    },
    endOffset: {
        type: ControlType.Number,
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        title: "End Offset (%)",
        description:
            "Crafted with 🖤 by Igor.\n\nGrab more [Framer components](https://www.framer.com/%40igor-reif/?tab=marketplace), and if this freebie saved you some time, feel free to [Buy me a beer](https://revolut.me/ireif). Cheers!🍻",
    },
})
