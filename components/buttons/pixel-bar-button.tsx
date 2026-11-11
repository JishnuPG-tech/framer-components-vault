import * as React from "react"
import { useId, useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

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
 * PixelBarButton
 *
 * Button built from stacked horizontal bars (like the Tailwind
 * "line" stack) whose widths taper to form a lens/pixel silhouette,
 * with the label layered on top. On hover, each bar pulses along
 * the x-axis on its own independent loop.
 */

function hash(n: number): number {
    const x = Math.sin(n * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

type Props = {
    text: string
    link?: string
    openInNewTab: boolean
    lineColor: string
    textColor: string
    font: React.CSSProperties
    widths: string
    lineThickness: number
    lineGap: number
    lineRadius: number
    amplitude: number
    amplitudeVariation: number
    duration: number
    durationVariation: number
    maxDelay: number
    resetDuration: number
}

export default function PixelBarButton(props: Props) {
    const {
        text,
        link,
        openInNewTab,
        lineColor,
        textColor,
        font,
        widths,
        lineThickness,
        lineGap,
        lineRadius,
        amplitude,
        amplitudeVariation,
        duration,
        durationVariation,
        maxDelay,
        resetDuration,
    } = props

    const uid = useId().replace(/[:]/g, "")
    const cls = `pxbar-${uid}`
    const isStatic = useIsStaticRenderer()

    const rows = widths
        .split(",")
        .map((w) => parseFloat(w.trim()))
        .filter((w) => !isNaN(w))

    const rowAnim = rows.map((_, i) => {
        const dH = hash(i * 3 + 1)
        const aH = hash(i * 3 + 2)
        const delayH = hash(i * 3 + 3)
        const rowDuration = Math.max(
            0.05,
            duration * (1 + (dH - 0.5) * 2 * durationVariation)
        )
        const rowAmplitude =
            1 + (amplitude / 100) * (1 + (aH - 0.5) * 2 * amplitudeVariation)
        const rowPhase = delayH * maxDelay
        return { rowDuration, rowAmplitude, rowPhase }
    })

    const rowRefs = useRef<(HTMLDivElement | null)[]>([])
    const rafRef = useRef<number | null>(null)
    const startRef = useRef(0)

    const stopLoop = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }

    const runFrame = (now: number) => {
        const elapsed = (now - startRef.current) / 1000
        rowAnim.forEach(({ rowDuration, rowAmplitude, rowPhase }, i) => {
            const el = rowRefs.current[i]
            if (!el) return
            const t = (elapsed + rowPhase) / rowDuration
            const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * t)
            const scale = 1 + (rowAmplitude - 1) * wave
            el.style.transition = "none"
            el.style.transform = `scaleX(${scale.toFixed(4)})`
        })
        rafRef.current = requestAnimationFrame(runFrame)
    }

    const handleEnter = () => {
        if (isStatic) return
        stopLoop()
        startRef.current = performance.now()
        rafRef.current = requestAnimationFrame(runFrame)
    }

    const handleLeave = () => {
        if (isStatic) return
        stopLoop()
        rowRefs.current.forEach((el) => {
            if (!el) return
            el.style.transition = "none"
            void el.offsetHeight
            el.style.transition = `transform ${resetDuration}s ease-out`
        })
        requestAnimationFrame(() => {
            rowRefs.current.forEach((el) => {
                if (!el) return
                el.style.transform = "scaleX(1)"
            })
        })
    }

    useEffect(() => stopLoop, [])

    const css = `
        .${cls} {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            text-decoration: none;
            cursor: pointer;
            background: transparent;
            border: none;
            padding: 0;
            appearance: none;
            -webkit-appearance: none;
        }
        .${cls}:focus-visible {
            outline: 2px solid ${lineColor};
            outline-offset: 6px;
            border-radius: 4px;
        }
        .${cls} .row-${uid} {
            height: ${lineThickness}px;
            background: ${lineColor};
            border-radius: ${lineRadius}px;
            transform-origin: center;
            transform: scaleX(1);
        }
        .${cls} .row-${uid}:not(:last-child) {
            margin-bottom: ${lineGap}px;
        }
        .${cls} .label-${uid} {
            position: absolute;
            z-index: 2;
            color: ${textColor};
            white-space: nowrap;
            pointer-events: none;
        }
    `

    const Tag: any = link ? "a" : "button"

    // Apply new tab logic based on the toggle
    const target = link && openInNewTab ? "_blank" : undefined
    const rel = link && openInNewTab ? "noopener noreferrer" : undefined

    return (
        <>
            <style>{css}</style>
            <Tag
                className={cls}
                href={link || undefined}
                target={target}
                rel={rel}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
            >
                {rows.map((w, i) => (
                    <div
                        key={i}
                        className={`row-${uid}`}
                        ref={(el) => (rowRefs.current[i] = el)}
                        style={{ width: `${w}%` }}
                    />
                ))}
                <span className={`label-${uid}`} style={font}>
                    {text}
                </span>
            </Tag>
        </>
    )
}

PixelBarButton.defaultProps = {
    text: "Contact Us",
    openInNewTab: false,
    lineColor: "#000",
    textColor: "#fff",
    font: {
        fontSize: 16,
        fontWeight: 700,
    },
    widths: "85,92,100,100,92,85",
    lineThickness: 8,
    lineGap: 0,
    lineRadius: 0,
    amplitude: 18,
    amplitudeVariation: 0.5,
    duration: 0.5,
    durationVariation: 0.4,
    maxDelay: 0.3,
    resetDuration: 0.7,
}

addPropertyControls(PixelBarButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Contact Us",
        description:
            "Created by [Nora](https://x.com/SalXNura)  \n[See more components](https://www.framer.com/%40noras/?tab=component)",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        // Only show this control if a link has been provided
        hidden: (props) => !props.link,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fff",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0px",
            lineHeight: "1.2em",
        },
    },
    widths: {
        type: ControlType.String,
        title: "Row Widths",
        defaultValue: "85,92,100,100,92,85",
        description:
            "Comma-separated % widths, one per row, top to bottom. Symmetric values give a lens/pixel silhouette.",
    },
    lineThickness: {
        type: ControlType.Number,
        title: "Line Thickness",
        min: 1,
        max: 40,
        defaultValue: 8,
    },
    lineGap: {
        type: ControlType.Number,
        title: "Line Gap",
        min: 0,
        max: 30,
        defaultValue: 0,
    },
    lineRadius: {
        type: ControlType.Number,
        title: "Line Radius",
        min: 0,
        max: 20,
        defaultValue: 0,
    },
    amplitude: {
        type: ControlType.Number,
        title: "Hover Amplitude",
        min: 0,
        max: 100,
        defaultValue: 18,
        description: "Base % wider a bar gets at the peak of its pulse.",
    },
    amplitudeVariation: {
        type: ControlType.Number,
        title: "Size Variation",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
        description:
            "How much each row's pulse size differs from the base amplitude.",
    },
    duration: {
        type: ControlType.Number,
        title: "Cycle Duration",
        min: 0.1,
        max: 5,
        step: 0.05,
        defaultValue: 0.5,
        description: "Base seconds for one bar's short-long-short loop.",
    },
    durationVariation: {
        type: ControlType.Number,
        title: "Time Variation",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.4,
        description:
            "How much each row's speed differs from the base duration.",
    },
    maxDelay: {
        type: ControlType.Number,
        title: "Max Phase Offset",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.3,
        description: "Each row starts at its own point in the cycle.",
    },
    resetDuration: {
        type: ControlType.Number,
        title: "Reset Duration",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 0.7,
        description:
            "Seconds for bars to settle back to their original width on unhover.",
    },
})
