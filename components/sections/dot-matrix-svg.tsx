// DotMatrixSVG.tsx
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


type SourceMode = "upload" | "paste"
type FocalPreset = "tl" | "t" | "tr" | "l" | "c" | "r" | "bl" | "b" | "br"

type VB = [number, number, number, number]
const FALLBACK_VB: VB = [0, 0, 24, 24]

// Faster overall sweep; per-dot delay is derived from this
const TARGET_WAVE_TIME = 0.2

type Props = {
    source: SourceMode
    svgFile?: string
    svgCode?: string

    focalPreset: FocalPreset

    gap: number
    dotRadius: number
    padding: number

    outlineWidth: number
    expand: number

    baseColor: string
    hoverColor: string

    dotDuration: number
    startDelay: number

    ariaLabel?: string
    style?: React.CSSProperties
}

const DEFAULT_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.5" d="M3.84453 3.84453C2.71849 4.97056 2.71849 6.79623 3.84453 7.92226L5.43227 9.51C5.44419 9.49622 5.98691 10.013 6 9.99989L10 5.99989C10.0131 5.98683 9.49625 5.44415 9.50999 5.43226L7.92226 3.84453C6.79623 2.71849 4.97056 2.71849 3.84453 3.84453Z" fill="#1C274C"/>
<path opacity="0.5" d="M5.1332 15.3072C5.29414 14.8976 5.87167 14.8976 6.03261 15.3072L6.18953 15.7065C6.23867 15.8316 6.33729 15.9306 6.46188 15.9799L6.85975 16.1374C7.26783 16.2989 7.26783 16.8786 6.85975 17.0401L6.46188 17.1976C6.33729 17.2469 6.23867 17.3459 6.18953 17.471L6.03261 17.8703C5.87167 18.2799 5.29414 18.2799 5.1332 17.8703L4.97628 17.471C4.92714 17.3459 4.82852 17.2469 4.70393 17.1976L4.30606 17.0401C3.89798 16.8786 3.89798 16.2989 4.30606 16.1374L4.70393 15.9799C4.82852 15.9306 4.92714 15.8316 4.97628 15.7065L5.1332 15.3072Z" fill="#1C274C"/>
<path opacity="0.2" d="M19.9672 9.12945C20.1281 8.71987 20.7057 8.71987 20.8666 9.12945L21.0235 9.5288C21.0727 9.65385 21.1713 9.75284 21.2959 9.80215L21.6937 9.95965C22.1018 10.1212 22.1018 10.7009 21.6937 10.8624L21.2959 11.0199C21.1713 11.0692 21.0727 11.1682 21.0235 11.2932L20.8666 11.6926C20.7057 12.1022 20.1281 12.1022 19.9672 11.6926L19.8103 11.2932C19.7611 11.1682 19.6625 11.0692 19.5379 11.0199L19.14 10.8624C18.732 10.7009 18.732 10.1212 19.14 9.95965L19.5379 9.80215C19.6625 9.75284 19.7611 9.65385 19.8103 9.5288L19.9672 9.12945Z" fill="#1C274C"/>
<path opacity="0.7" d="M16.1 2.30719C16.261 1.8976 16.8385 1.8976 16.9994 2.30719L17.4298 3.40247C17.479 3.52752 17.5776 3.62651 17.7022 3.67583L18.7934 4.1078C19.2015 4.26934 19.2015 4.849 18.7934 5.01054L17.7022 5.44252C17.5776 5.49184 17.479 5.59082 17.4298 5.71587L16.9995 6.81115C16.8385 7.22074 16.261 7.22074 16.1 6.81116L15.6697 5.71587C15.6205 5.59082 15.5219 5.49184 15.3973 5.44252L14.3061 5.01054C13.898 4.849 13.898 4.26934 14.3061 4.1078L15.3973 3.67583C15.5219 3.62651 15.6205 3.52752 15.6697 3.40247L16.1 2.30719Z" fill="#1C274C"/>
<path d="M10.5681 6.48999C10.5562 6.50373 10.0133 5.9867 10.0002 5.99975L6.00024 9.99975C5.98715 10.0128 6.50414 10.5558 6.49036 10.5677L16.078 20.1553C17.204 21.2814 19.0297 21.2814 20.1557 20.1553C21.2818 19.0293 21.2818 17.2036 20.1557 16.0776L10.5681 6.48999Z" fill="#1C274C"/>
</svg>`

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 */
export default function DotMatrixSVG(props: Props) {
    const {
        source,
        svgFile,
        svgCode,
        focalPreset,
        gap,
        dotRadius,
        padding,
        outlineWidth,
        expand,
        baseColor,
        hoverColor,
        dotDuration,
        startDelay,
        ariaLabel,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = React.useId().replace(/:/g, "_")

    const [svgInner, setSvgInner] = React.useState<string | null>(null)
    const [vb, setVb] = React.useState<VB>(FALLBACK_VB)
    const [isHovered, setIsHovered] = React.useState(false)

    const parseSvg = React.useCallback(
        (text?: string | null): { inner: string | null; viewBox: VB } => {
            const raw = text && text.trim().length ? text : DEFAULT_SVG
            const src = raw || DEFAULT_SVG
            const hasRoot = /<svg[\s\S]*?>/i.test(src)
            const inner = hasRoot
                ? src
                      .replace(/^[\s\S]*?<svg[^>]*>/i, "")
                      .replace(/<\/svg>\s*$/i, "")
                : src
            const m = src.match(/viewBox\s*=\s*["']([\d.\s-]+)["']/i)
            let viewBox: VB = FALLBACK_VB
            if (m) {
                const nums = m[1].trim().split(/\s+/).map(Number).slice(0, 4)
                if (
                    nums.length === 4 &&
                    nums.every((n) => Number.isFinite(n))
                ) {
                    viewBox = [nums[0], nums[1], nums[2], nums[3]] as VB
                }
            }
            return { inner, viewBox }
        },
        []
    )

    React.useEffect(() => {
        let cancelled = false
        async function run() {
            try {
                if (source === "upload") {
                    if (!svgFile) {
                        const { inner, viewBox } = parseSvg(undefined)
                        if (!cancelled) {
                            setSvgInner(inner)
                            setVb(viewBox)
                        }
                        return
                    }
                    const res = await fetch(svgFile)
                    const text = await res.text()
                    const { inner, viewBox } = parseSvg(text)
                    if (!cancelled) {
                        setSvgInner(inner)
                        setVb(viewBox)
                    }
                } else {
                    const { inner, viewBox } = parseSvg(svgCode)
                    if (!cancelled) {
                        setSvgInner(inner)
                        setVb(viewBox)
                    }
                }
            } catch {
                if (!cancelled) {
                    const { inner, viewBox } = parseSvg(undefined)
                    setSvgInner(inner)
                    setVb(viewBox)
                }
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [source, svgFile, svgCode, parseSvg])

    // Fit pasted/uploaded art into 0–100 box
    const fit = React.useMemo(() => {
        const box = 100 - padding * 2
        const scale = Math.min(box / vb[2], box / vb[3])
        const tx = (100 - vb[2] * scale) / 2 - vb[0] * scale
        const ty = (100 - vb[3] * scale) / 2 - vb[1] * scale
        return { scale, tx, ty }
    }, [vb, padding])

    // Focal ordering for wave
    const focal = React.useMemo(() => {
        const min = padding + dotRadius
        const max = 100 - padding - dotRadius
        const L = min,
            R = max,
            T = min,
            B = max,
            C = 50
        switch (focalPreset) {
            case "tl":
                return { x: L, y: T }
            case "t":
                return { x: C, y: T }
            case "tr":
                return { x: R, y: T }
            case "l":
                return { x: L, y: C }
            case "c":
                return { x: C, y: C }
            case "r":
                return { x: R, y: C }
            case "bl":
                return { x: L, y: B }
            case "b":
                return { x: C, y: B }
            case "br":
                return { x: R, y: B }
            default:
                return { x: C, y: C }
        }
    }, [focalPreset, padding, dotRadius])

    type Pt = { x: number; y: number; order: number }
    const dots = React.useMemo<Pt[]>(() => {
        const pts: Pt[] = []
        const start = padding + dotRadius
        const end = 100 - padding - dotRadius
        for (let y = start; y <= end + 0.001; y += gap) {
            for (let x = start; x <= end + 0.001; x += gap)
                pts.push({ x, y, order: 0 })
        }
        const d2 = (p: { x: number; y: number }) =>
            (p.x - focal.x) ** 2 + (p.y - focal.y) ** 2
        const sorted = pts.slice().sort((a, b) => d2(a) - d2(b))
        sorted.forEach((p, i) => (p.order = i))
        return sorted
    }, [gap, padding, dotRadius, focal.x, focal.y])

    // In/out timings (no new props). Out is faster & snappier.
    const perDotIn = React.useMemo(
        () => Math.max(0.0005, TARGET_WAVE_TIME / Math.max(1, dots.length)),
        [dots.length]
    )
    const perDotOut = React.useMemo(
        () => Math.max(0.0003, perDotIn * 0.35),
        [perDotIn]
    )
    const durIn = props.dotDuration
    const durOut = Math.max(0.05, durIn * 0.6)

    const interactive = !isStatic
    const ids = React.useMemo(() => {
        const base = `dm_${uid}`
        return {
            gShape: `${base}__shape`,
            gNorm: `${base}__norm`,
            mask: `${base}__mask`,
            filter: `${base}__dilate`,
            scope: `${base}__scope`,
        }
    }, [uid])

    const handleEnter = () => interactive && setIsHovered(true)
    const handleLeave = () => interactive && setIsHovered(false)

    const total = Math.max(0, dots.length - 1)

    return (
        <svg
            role="img"
            aria-label={ariaLabel || "Dot matrix icon"}
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                ...style,
            }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <defs>
                <style>{`
                  /* Normalize source strokes → fills for masking */
                  #${ids.gNorm} *{
                    fill:#fff !important;
                    stroke:#fff !important;
                    stroke-width:${Math.max(0, outlineWidth)}px !important;
                    vector-effect:non-scaling-stroke;
                  }

                  /* Colors toggle via state */
                  #${ids.scope}[data-state="rest"]  circle { fill: var(--dm-base); }
                  #${ids.scope}[data-state="hover"] circle { fill: var(--dm-hover); }

                  /* Directional, state-specific timing */
                  #${ids.scope}[data-state="hover"] circle {
                    transition-duration: var(--dm-dur-in);
                    transition-delay:    var(--delay-in);
                  }
                  #${ids.scope}[data-state="rest"] circle {
                    transition-duration: var(--dm-dur-out);
                    transition-delay:    var(--delay-out);
                  }

                  /* Reduced motion: drop staggering entirely */
                  @media (prefers-reduced-motion: reduce) {
                    #${ids.scope} circle {
                      transition-delay: 0s !important;
                      transition-duration: 0s !important;
                    }
                  }
                `}</style>

                <g
                    id={ids.gShape}
                    transform={`translate(${fit.tx} ${fit.ty}) scale(${fit.scale})`}
                >
                    {/* eslint-disable-next-line react/no-danger */}
                    <g
                        id={ids.gNorm}
                        dangerouslySetInnerHTML={{ __html: svgInner || "" }}
                    />
                </g>

                {expand > 0 && (
                    <filter
                        id={ids.filter}
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                    >
                        <feMorphology
                            in="SourceGraphic"
                            operator="dilate"
                            radius={expand}
                        />
                    </filter>
                )}

                <mask id={ids.mask} maskUnits="userSpaceOnUse">
                    <use
                        href={`#${ids.gShape}`}
                        fill="#fff"
                        filter={expand > 0 ? `url(#${ids.filter})` : undefined}
                    />
                </mask>
            </defs>

            {!svgInner && <rect width="100" height="100" fill="transparent" />}

            <g
                id={ids.scope}
                mask={`url(#${ids.mask})`}
                data-state={isHovered && interactive ? "hover" : "rest"}
                style={
                    {
                        // Palette & global knobs
                        ["--dm-base" as any]: baseColor,
                        ["--dm-hover" as any]: hoverColor,
                        // In/out durations (seconds)
                        ["--dm-dur-in" as any]: `${durIn}s`,
                        ["--dm-dur-out" as any]: `${durOut}s`,
                        // Sweep schedule
                        ["--dm-start" as any]: `${startDelay}s`,
                        ["--dm-perDot-in" as any]: `${perDotIn}s`,
                        ["--dm-perDot-out" as any]: `${perDotOut}s`,
                        ["--dm-total" as any]: `${total}`,
                    } as React.CSSProperties
                }
            >
                {dots.map((p) => {
                    const styleVars: React.CSSProperties = {
                        transitionProperty: "fill",
                        transitionTimingFunction: "cubic-bezier(.3,.8,.2,1)",
                        // Per-dot directional delays
                        ["--order" as any]: String(p.order),
                        ["--delay-in" as any]: `calc(var(--dm-start) + var(--order) * var(--dm-perDot-in))`,
                        ["--delay-out" as any]: `calc(var(--dm-start) + (var(--dm-total) - var(--order)) * var(--dm-perDot-out))`,
                    }
                    return (
                        <circle
                            key={`${p.x}-${p.y}`}
                            cx={p.x}
                            cy={p.y}
                            r={dotRadius}
                            style={styleVars}
                        />
                    )
                })}
            </g>
        </svg>
    )
}

DotMatrixSVG.defaultProps = {
    source: "upload" as SourceMode,

    focalPreset: "c" as FocalPreset,

    gap: 6,
    dotRadius: 1.8,
    padding: 6,

    outlineWidth: 2,
    expand: 0,

    baseColor: "rgba(128,128,128,0.85)",
    hoverColor: "#1890A3",

    // Snappier default
    dotDuration: 0.08,
    startDelay: 0,

    ariaLabel: "Dot matrix SVG",
}

addPropertyControls(DotMatrixSVG, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["upload", "paste"],
        optionTitles: ["Upload", "Paste"],
        displaySegmentedControl: true,
        description: "Upload an SVG file or paste raw SVG markup.",
    },
    svgFile: {
        type: ControlType.File,
        title: "SVG",
        allowedFileTypes: ["svg"],
        hidden: (p) => p.source !== "upload",
        description: "Accepts .svg files. The icon will be masked into dots.",
    },
    svgCode: {
        type: ControlType.String,
        title: "SVG Code",
        placeholder: "<svg viewBox='0 0 24 24'>…</svg> or inner <path/>",
        displayTextArea: true,
        hidden: (p) => p.source !== "paste",
    },
    focalPreset: {
        type: ControlType.Enum,
        title: "Focal point",
        options: ["tl", "t", "tr", "l", "c", "r", "bl", "b", "br"],
        optionTitles: [
            "Top-Left",
            "Top",
            "Top-Right",
            "Left",
            "Center",
            "Right",
            "Bottom-Left",
            "Bottom",
            "Bottom-Right",
        ],
        description: "Where the color wave starts (reverses on hover-out).",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 2,
        max: 40,
        unit: "px",
    },
    dotRadius: {
        type: ControlType.Number,
        title: "Dot",
        min: 0.5,
        max: 12,
        step: 0.1,
        unit: "px",
        description: "Dot radius in pixels.",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 24,
        unit: "px",
    },
    outlineWidth: {
        type: ControlType.Number,
        title: "Stroke→Fill",
        min: 0,
        max: 12,
        step: 0.5,
        description: "Thickens outline icons so the mask looks solid.",
    },
    expand: {
        type: ControlType.Number,
        title: "Expand",
        min: 0,
        max: 4,
        step: 0.5,
        description: "Dilate the mask slightly to close tiny gaps.",
    },
    dotDuration: {
        type: ControlType.Number,
        title: "Dot duration",
        min: 0.03,
        max: 1,
        step: 0.01,
        description: "How long each dot takes to change color.",
    },
    startDelay: {
        type: ControlType.Number,
        title: "Start delay",
        min: 0,
        max: 1,
        step: 0.01,
    },
    baseColor: { title: "Base", type: ControlType.Color },
    hoverColor: { title: "Hover", type: ControlType.Color },
})
