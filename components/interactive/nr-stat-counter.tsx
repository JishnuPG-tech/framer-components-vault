// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useState, useEffect, startTransition } from "react"

// @framerSupportedLayoutWidth any-prefer-fixed
// @framerSupportedLayoutHeight auto
export default function StatCounterNR(props) {
    const {
        stats,
        duration,
        columns,
        theme,
        numberFont,
        labelFont,
        numberSize,
        labelSize,
        italic,
        bgFill,
        bgColor,
        numColor,
        labelColor,
        accentColor,
        dividers,
        decimals,
        gap,
        paddingY,
    } = props

    const presets = {
        Light: {
            bg: "#F6F2EB",
            num: "#0C0C0B",
            label: "#7A6E5A",
            acc: "#E8604A",
        },
        Dark: {
            bg: "#1A0E48",
            num: "#F6F2EB",
            label: "rgba(246,242,235,0.6)",
            acc: "#E8604A",
        },
        Custom: {
            bg: bgColor,
            num: numColor,
            label: labelColor,
            acc: accentColor,
        },
    }
    const c = presets[theme] || presets.Light
    const background = bgFill ? c.bg : "transparent"

    const isStatic = useIsStaticRenderer()
    const ref = useRef(null)
    const numRefs = useRef([])
    const [fontReady, setFontReady] = useState(isStatic)
    const [width, setWidth] = useState(1200)

    const visible = stats.slice(0, columns)

    const fmt = (v, p) => {
        const val = (Number(v) || 0) * p
        const fixed = val.toFixed(decimals)
        const [intPart, dec] = fixed.split(".")
        const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        return dec ? `${withCommas}.${dec}` : withCommas
    }

    // rAF가 최신 값을 참조하도록 (루프 재시작 없이)
    const dataRef = useRef({ visible, decimals })
    dataRef.current = { visible, decimals }

    // 폰트 로드
    useEffect(() => {
        const id = "nr-stat-fonts"
        if (typeof document !== "undefined" && !document.getElementById(id)) {
            const link = document.createElement("link")
            link.id = id
            link.rel = "stylesheet"
            link.href =
                "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital@0;1&family=DM+Mono&family=DM+Sans&display=swap"
            document.head.appendChild(link)
        }
        if (isStatic) return
        const done = () => startTransition(() => setFontReady(true))
        if (document.fonts?.ready) document.fonts.ready.then(done)
        else done()
    }, [isStatic])

    // 컨테이너 폭 측정 (반응형)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const measure = () => {
            const w = el.offsetWidth
            if (w > 0) startTransition(() => setWidth(w))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // 카운트업 — DOM에 직접 쓰기 (프레임마다 리렌더 X)
    useEffect(() => {
        const write = (p) => {
            const { visible } = dataRef.current
            visible.forEach((s, i) => {
                const node = numRefs.current[i]
                if (node) node.textContent = fmt(s.value, p)
            })
        }
        if (isStatic) {
            write(1)
            return
        }
        const el = ref.current
        if (!el) return
        let raf,
            start = null,
            started = false
        const tick = (now) => {
            if (start === null) start = now
            const t = Math.min((now - start) / (duration * 1000), 1)
            write(1 - Math.pow(1 - t, 3)) // ease-out cubic
            if (t < 1) raf = requestAnimationFrame(tick)
        }
        write(0)
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !started) {
                    started = true
                    raf = requestAnimationFrame(tick)
                    io.disconnect()
                }
            },
            { threshold: 0.4 }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            cancelAnimationFrame(raf)
        }
    }, [isStatic, duration, decimals])

    // 반응형 계산
    let cols = columns
    if (width < 480) cols = 1
    else if (width < 768) cols = Math.min(2, columns)
    else if (width < 1024) cols = Math.min(columns, 3)
    const scale = Math.max(0.5, Math.min(1, width / 1000))
    const numSize = Math.round(numberSize * scale)
    const unitSize = Math.round(numSize * 0.45)

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                background: background,
                boxSizing: "border-box",
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                rowGap: cols < columns ? 32 : 0,
                padding: `${paddingY}px 0`,
            }}
        >
            {visible.map((s, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: gap,
                        padding: "0 24px",
                        borderLeft:
                            dividers && cols > 1 && i % cols !== 0
                                ? "1px solid #D4CFC6"
                                : "none",
                    }}
                >
                    <div
                        style={{
                            fontFamily: `'${numberFont}', serif`,
                            fontStyle: italic ? "italic" : "normal",
                            fontSize: numSize,
                            lineHeight: 1,
                            color: c.num,
                            display: "flex",
                            alignItems: "baseline",
                            minWidth: "max-content",
                            opacity: fontReady ? 1 : 0,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        {s.prefix ? (
                            <span
                                style={{
                                    color: c.acc,
                                    fontSize: unitSize,
                                    marginRight: 2,
                                }}
                            >
                                {s.prefix}
                            </span>
                        ) : null}
                        <span ref={(el) => (numRefs.current[i] = el)}>
                            {fmt(s.value, isStatic ? 1 : 0)}
                        </span>
                        {s.suffix ? (
                            <span
                                style={{
                                    color: c.acc,
                                    fontSize: unitSize,
                                    marginLeft: 2,
                                }}
                            >
                                {s.suffix}
                            </span>
                        ) : null}
                    </div>
                    <div
                        style={{
                            fontFamily: `'${labelFont}', monospace`,
                            fontSize: labelSize,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: c.label,
                            textAlign: "center",
                            minWidth: "max-content",
                        }}
                    >
                        {s.label}
                    </div>
                </div>
            ))}
        </div>
    )
}

StatCounterNR.defaultProps = {
    stats: [
        { value: 1400, prefix: "", suffix: "+", label: "Users" },
        { value: 98, prefix: "", suffix: "%", label: "Satisfaction" },
        { value: 24, prefix: "", suffix: "/7", label: "Support" },
        { value: 12, prefix: "$", suffix: "M", label: "Funding" },
    ],
    duration: 2,
    columns: 4,
    theme: "Light",
    numberFont: "Cormorant Garamond",
    labelFont: "DM Mono",
    numberSize: 88,
    labelSize: 13,
    italic: false,
    bgFill: true,
    bgColor: "#F6F2EB",
    numColor: "#0C0C0B",
    labelColor: "#7A6E5A",
    accentColor: "#E8604A",
    dividers: true,
    decimals: 0,
    gap: 10,
    paddingY: 64,
}

addPropertyControls(StatCounterNR, {
    stats: {
        type: ControlType.Array,
        title: "Stats",
        control: {
            type: ControlType.Object,
            controls: {
                value: {
                    type: ControlType.Number,
                    title: "Value",
                    displayStepper: false,
                },
                prefix: { type: ControlType.String, title: "Prefix" },
                suffix: { type: ControlType.String, title: "Suffix" },
                label: { type: ControlType.String, title: "Label" },
            },
        },
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.5,
        max: 6,
        step: 0.5,
        unit: "s",
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        min: 0,
        max: 2,
        step: 1,
        displayStepper: true,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Light", "Dark", "Custom"],
        displaySegmentedControl: true,
    },
    bgFill: {
        type: ControlType.Boolean,
        title: "Background Fill",
        defaultValue: true,
    },
    numberFont: {
        type: ControlType.Enum,
        title: "Number Font",
        options: ["Cormorant Garamond", "DM Sans", "DM Mono"],
    },
    labelFont: {
        type: ControlType.Enum,
        title: "Label Font",
        options: ["DM Mono", "DM Sans", "Cormorant Garamond"],
    },
    italic: { type: ControlType.Boolean, title: "Number Italic" },
    numberSize: {
        type: ControlType.Number,
        title: "Number Size",
        min: 24,
        max: 160,
        step: 2,
        unit: "px",
    },
    labelSize: {
        type: ControlType.Number,
        title: "Label Size",
        min: 8,
        max: 20,
        step: 1,
        unit: "px",
    },
    dividers: { type: ControlType.Boolean, title: "Dividers" },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 120,
        step: 4,
        unit: "px",
    },
    bgColor: { type: ControlType.Color, title: "BG (Custom)" },
    numColor: { type: ControlType.Color, title: "Number (Custom)" },
    labelColor: { type: ControlType.Color, title: "Label (Custom)" },
    accentColor: { type: ControlType.Color, title: "Accent (Custom)" },
})
