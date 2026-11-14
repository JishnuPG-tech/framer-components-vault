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


const DEFAULT_HONEYCOMB = [5, 6, 7, 8, 9, 8, 7, 6, 5]
const SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1499084732479-de2c02d45fc4",
    "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d",
    "https://images.unsplash.com/photo-1495567720989-cebdbdd97913",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
    "https://images.unsplash.com/photo-1518770660439-4636190af475",
    "https://images.unsplash.com/photo-1511765224389-37f0e77cf0eb",
    "https://images.unsplash.com/photo-1520975916090-3105956dac38",
    "https://images.unsplash.com/photo-1471357674240-e1a485acb3e1",
    "https://images.unsplash.com/photo-1520974735194-7f4ad6ac3a94",
]

export default function HoneycombImages(props) {
    const {
        honeycomb = DEFAULT_HONEYCOMB,
        images = SAMPLE_IMAGES,
        hexagonSizeVmin = 8,
        gapVmin = 0.1,
        rippleDurationMs = 320, // faster
        rippleDelayFactorMs = 5, // less delay between rings → smoother
        autoRipple = true,
        autoRippleMs = 3000,
        className,
        style,
    } = props

    const containerRef = React.useRef(null)
    const hexRefs = React.useRef([])
    const autoTimerRef = React.useRef(null)

    // Build flat cell list for indexing images
    const flatCount = React.useMemo(
        () => honeycomb.reduce((a, b) => a + b, 0),
        [honeycomb]
    )

    const colStarts = React.useMemo(() => {
        const arr = [0]
        honeycomb.forEach((n, i) => arr.push(arr[i] + n))
        return arr
    }, [honeycomb])

    const pickImage = React.useCallback(
        (i) => images[i % images.length] || "",
        [images]
    )

    const rippleFromElement = React.useCallback(
        (target) => {
            const container = containerRef.current
            if (!container) return
            if (container.classList.contains("show-ripple")) return

            const targetRect = target.getBoundingClientRect()
            const data = hexRefs.current
                .filter(Boolean)
                .map((el) => {
                    const rect = el.getBoundingClientRect()
                    const distance = Math.hypot(
                        rect.x - targetRect.x,
                        rect.y - targetRect.y
                    )
                    return { el, distance }
                })
                .sort((a, b) => a.distance - b.distance)

            const max = data[data.length - 1]
            const maxDist = Math.max(1, max?.distance || 1)
            data.forEach(({ el, distance }) => {
                el.style.setProperty(
                    "--ripple-factor",
                    String((distance * 100) / maxDist)
                )
                el.style.setProperty("--duration", `${rippleDurationMs}ms`)
                el.style.setProperty(
                    "--delay-factor",
                    `${rippleDelayFactorMs}ms`
                )
            })

            container.classList.add("show-ripple")

            const onEnd = () => {
                requestAnimationFrame(() => {
                    container.classList.remove("show-ripple")
                    data.forEach(({ el }) => {
                        el.style.removeProperty("--ripple-factor")
                        el.style.removeProperty("--duration")
                        el.style.removeProperty("--delay-factor")
                    })
                    max.el.removeEventListener("animationend", onEnd)
                })
            }
            max.el.addEventListener("animationend", onEnd)
        },
        [rippleDurationMs, rippleDelayFactorMs]
    )

    const rippleFromPoint = React.useCallback(
        (x, y) => {
            const container = containerRef.current
            if (!container) return
            if (container.classList.contains("show-ripple")) return

            const data = hexRefs.current
                .filter(Boolean)
                .map((el) => {
                    const rect = el.getBoundingClientRect()
                    const cx = rect.x + rect.width / 2
                    const cy = rect.y + rect.height / 2
                    const distance = Math.hypot(cx - x, cy - y)
                    return { el, distance }
                })
                .sort((a, b) => a.distance - b.distance)

            const max = data[data.length - 1]
            const maxDist = Math.max(1, max?.distance || 1)
            data.forEach(({ el, distance }) => {
                el.style.setProperty(
                    "--ripple-factor",
                    String((distance * 100) / maxDist)
                )
                el.style.setProperty("--duration", `${rippleDurationMs}ms`)
                el.style.setProperty(
                    "--delay-factor",
                    `${rippleDelayFactorMs}ms`
                )
            })

            container.classList.add("show-ripple")

            const onEnd = () => {
                requestAnimationFrame(() => {
                    container.classList.remove("show-ripple")
                    data.forEach(({ el }) => {
                        el.style.removeProperty("--ripple-factor")
                        el.style.removeProperty("--duration")
                        el.style.removeProperty("--delay-factor")
                    })
                    max.el.removeEventListener("animationend", onEnd)
                })
            }
            max.el.addEventListener("animationend", onEnd)
        },
        [rippleDurationMs, rippleDelayFactorMs]
    )

    // Auto: ripple from center on appear and every N ms
    React.useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const fireCenterRipple = () => {
            const rect = container.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            rippleFromPoint(cx, cy)
        }

        // initial after layout
        const t0 = window.setTimeout(fireCenterRipple, 200)

        // periodic
        if (autoRipple && autoRippleMs > 0) {
            autoTimerRef.current && clearInterval(autoTimerRef.current)
            autoTimerRef.current = window.setInterval(() => {
                if (!container.classList.contains("show-ripple"))
                    fireCenterRipple()
            }, autoRippleMs)
        }

        return () => {
            clearTimeout(t0)
            if (autoTimerRef.current) clearInterval(autoTimerRef.current)
        }
    }, [autoRipple, autoRippleMs, rippleFromPoint])

    return (
        <div
            className={`honeycomb ${className || ""}`}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: "transparent",
                ...style,
            }}
        >
            <style>{`
        .honeycomb .container { display:flex; position:relative; align-items:center; gap: var(--gap); }
        .honeycomb .column { margin: 0 calc(-0.2vmin); display:flex; flex-direction:column; align-items:center; gap: var(--gap); }

        .honeycomb .hex { 
          width: var(--hexagon-size); aspect-ratio:1; position:relative; cursor:pointer; will-change: transform, filter; 
          box-shadow: 0 0.25vmin 0.8vmin rgba(0,0,0,0.12);
          background-size: cover; background-position: center; background-repeat: no-repeat; 
          clip-path: polygon(
            98.66024% 45%,99.39693% 46.5798%,99.84808% 48.26352%,100% 50%,99.84808% 51.73648%,99.39693% 53.4202%,98.66025% 55%,
            78.66025% 89.64102%,77.66044% 91.06889%,76.42788% 92.30146%,75% 93.30127%,73.4202% 94.03794%,71.73648% 94.48909%,70% 94.64102%,
            30% 94.64102%,28.26352% 94.48909%,26.5798% 94.03794%,25% 93.30127%,23.57212% 92.30146%,22.33956% 91.06889%,21.33975% 89.64102%,
            1.33975% 55%,0.60307% 53.4202%,0.15192% 51.73648%,0% 50%,0.15192% 48.26352%,0.60307% 46.5798%,1.33975% 45%,
            21.33975% 10.35898%,22.33956% 8.93111%,23.57212% 7.69854%,25% 6.69873%,26.5798% 5.96206%,28.26352% 5.51091%,30% 5.35898%,
            70% 5.35898%,71.73648% 5.51091%,73.4202% 5.96206%,75% 6.69873%,76.42788% 7.69854%,77.66044% 8.93111%,78.66025% 10.35898%
          );
          transition: filter .18s ease;
        }
        @media(hover:hover){ .honeycomb .hex:hover { filter: brightness(1.06);} }

        @keyframes ripple { 
          0%   { transform: scale(1);   opacity: 1; }
          45%  { transform: scale(0.9); opacity: .48; }
          70%  { transform: scale(1.35); }
          100% { transform: scale(1);   opacity: 1; }
        }
        .honeycomb .container.show-ripple { pointer-events:none; }
        .honeycomb .container.show-ripple .hex { 
          animation: ripple var(--duration, 320ms) cubic-bezier(.25,.75,.25,1);
          animation-delay: calc(var(--ripple-factor) * var(--delay-factor, 5ms));
          animation-fill-mode: none;
        }
      `}</style>

            <div
                ref={containerRef}
                className="container"
                style={{
                    "--hexagon-size": `${hexagonSizeVmin}vmin`,
                    "--gap": `${gapVmin}vmin`,
                }}
            >
                {honeycomb.map((count, col) => (
                    <div
                        className="column"
                        key={`col-${col}`}
                        style={{ "--column": col }}
                    >
                        {Array.from({ length: count }).map((_, i) => {
                            const flatIndex = colStarts[col] + i
                            const url = pickImage(flatIndex)
                            return (
                                <div
                                    key={`h-${col}-${i}`}
                                    className="hex"
                                    ref={(el) => {
                                        if (el) hexRefs.current[flatIndex] = el
                                    }}
                                    style={{
                                        "--index": i + 1,
                                        backgroundImage: `url(${url})`,
                                    }}
                                    onClick={(e) =>
                                        rippleFromElement(e.currentTarget)
                                    }
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}

addPropertyControls(HoneycombImages, {
    honeycomb: {
        type: ControlType.Array,
        title: "Honeycomb",
        propertyControl: { type: ControlType.Number },
        defaultValue: DEFAULT_HONEYCOMB,
    },
    images: {
        type: ControlType.Array,
        title: "Images (URLs)",
        propertyControl: { type: ControlType.Image },
        defaultValue: SAMPLE_IMAGES,
    },
    hexagonSizeVmin: {
        type: ControlType.Number,
        title: "Hex Size",
        min: 2,
        max: 16,
        step: 0.25,
        defaultValue: 8,
    },
    gapVmin: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.1,
    },
    rippleDurationMs: {
        type: ControlType.Number,
        title: "Ripple (ms)",
        min: 120,
        max: 1200,
        step: 10,
        defaultValue: 320,
    },
    rippleDelayFactorMs: {
        type: ControlType.Number,
        title: "Ring Delay (ms)",
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 5,
    },
    autoRipple: {
        type: ControlType.Boolean,
        title: "Auto Ripple",
        defaultValue: true,
    },
    autoRippleMs: {
        type: ControlType.Number,
        title: "Auto Every (ms)",
        min: 500,
        max: 10000,
        step: 100,
        defaultValue: 3000,
    },
})
