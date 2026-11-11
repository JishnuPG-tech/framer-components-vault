// LiquidGlassButton — Apple-style frosted / liquid glass button for Framer.
// Real edge refraction in Chromium browsers (Chrome, Edge, Arc, Framer editor);
// Safari & Firefox get the same frosted glass without the lens bend.

import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
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


type Icon = "none" | "chevron" | "arrow" | "arrowUpRight" | "plus"

interface Props {
    label: string
    font: CSSProperties
    textColor: string
    icon: Icon
    iconPosition: "left" | "right"
    iconSize: number
    theme: "light" | "dark"
    tint: string
    tintOpacity: number
    blur: number
    refraction: number
    bezel: number
    depth: number
    shadow: number
    radius: number
    padding: string
    gap: number
    shine: boolean
    cursorGlow: boolean
    pressScale: number
    link: string
    newTab: boolean
    disabled: boolean
    onClick?: () => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-auto
 * @framerSupportedLayoutHeight any-prefer-auto
 * @framerDisableUnlink
 */
export default function LiquidGlassButton(props: Props) {
    const {
        label = "Click me",
        font,
        textColor = "#26282D",
        icon = "chevron",
        iconPosition = "right",
        iconSize = 18,
        theme = "light",
        tint = "#FFFFFF",
        tintOpacity = 0.05,
        blur = 5.4,
        refraction = 50,
        bezel = 16,
        depth = 1,
        shadow = 1,
        radius = 999,
        padding = "20px 30px",
        gap = 10,
        shine = true,
        cursorGlow = true,
        pressScale = 0.96,
        link,
        newTab = false,
        disabled = false,
        onClick,
        style,
    } = props

    const rootRef = useRef<HTMLElement>(null)
    const [size, setSize] = useState({ w: 0, h: 0 })
    const [pressed, setPressed] = useState(false)
    const filterId = "lgb" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const chromium = useIsChromium()

    // Track size for the refraction map
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const ro = new ResizeObserver(() => {
            const w = el.offsetWidth
            const h = el.offsetHeight
            setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const r = Math.min(radius, size.h / 2, size.w / 2)
    const useRefraction = chromium && refraction > 0 && size.w > 0
    const map = useMemo(
        () => (useRefraction ? displacementMap(size.w, size.h, r, bezel) : ""),
        [useRefraction, size.w, size.h, r, bezel]
    )

    // Blur and refraction live on separate layers, so the frost always works
    // even if a browser can't render the refraction filter.
    const blurFilter = `blur(${blur}px) saturate(1.5) brightness(1.04)`
    const frostStyle: CSSProperties = {
        backdropFilter: blurFilter,
        WebkitBackdropFilter: blurFilter,
    }
    const lensStyle: CSSProperties = { backdropFilter: `url(#${filterId})` }

    const onMove = (e: React.PointerEvent) => {
        const el = rootRef.current
        if (!el) return
        const b = el.getBoundingClientRect()
        el.style.setProperty("--mx", `${e.clientX - b.left}px`)
        el.style.setProperty("--my", `${e.clientY - b.top}px`)
    }

    const vars = {
        "--r": `${radius}px`,
        "--pad": padding,
        "--gap": `${gap}px`,
        "--text": textColor,
        "--tint": `color-mix(in srgb, ${tint} ${Math.round(tintOpacity * 100)}%, transparent)`,
        "--d": depth,
        "--sh": shadow,
        "--press": pressScale,
    } as CSSProperties

    const iconEl =
        icon !== "none" ? <IconSvg name={icon} size={iconSize} /> : null

    const content = (
        <>
            <style>{CSS}</style>
            {useRefraction && (
                <svg
                    width="0"
                    height="0"
                    style={{ position: "absolute" }}
                    aria-hidden
                >
                    <filter
                        id={filterId}
                        x="0"
                        y="0"
                        width={size.w}
                        height={size.h}
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feImage
                            href={map}
                            xlinkHref={map}
                            x="0"
                            y="0"
                            width={size.w}
                            height={size.h}
                            preserveAspectRatio="none"
                            result="map"
                        />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="map"
                            scale={refraction}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </svg>
            )}
            <span className="lgb-l lgb-shadow" />
            <span className="lgb-l lgb-frost" style={frostStyle} />
            {useRefraction && (
                <span className="lgb-l lgb-lens" style={lensStyle} />
            )}
            <span className="lgb-l lgb-glass">
                {shine && <span className="lgb-shine" />}
            </span>
            <span className="lgb-l lgb-bevel" />
            {cursorGlow && <span className="lgb-l lgb-glow" />}
            <span className="lgb-l lgb-rim" />
            <span className="lgb-content" style={font}>
                {iconPosition === "left" && iconEl}
                {label && <span>{label}</span>}
                {iconPosition === "right" && iconEl}
            </span>
        </>
    )

    const common = {
        ref: rootRef as any,
        className: "lgb",
        "data-theme": theme,
        "data-pressed": pressed,
        "data-disabled": disabled,
        "aria-disabled": disabled || undefined,
        "aria-label": label || undefined,
        style: { ...vars, ...style },
        onPointerMove: onMove,
        onPointerDown: () => !disabled && setPressed(true),
        onPointerUp: () => setPressed(false),
        onPointerLeave: () => setPressed(false),
        onPointerCancel: () => setPressed(false),
        onClick: disabled ? undefined : onClick,
    }

    return link && !disabled ? (
        <a
            {...common}
            href={link}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
        >
            {content}
        </a>
    ) : (
        <button {...common} type="button" disabled={disabled}>
            {content}
        </button>
    )
}

// ---------- helpers ----------

function useIsChromium() {
    const [v, setV] = useState(false)
    useEffect(() => {
        const brands = (navigator as any).userAgentData?.brands as
            | { brand: string }[]
            | undefined
        setV(!!brands?.some((b) => /Chromium|Google Chrome|Edge/.test(b.brand)))
    }, [])
    return v
}

// Builds a displacement map: R/G encode how far the backdrop is pulled
// inward near the edges, so the rim bends what's behind it like a lens.
const mapCache = new Map<string, string>()
function displacementMap(w: number, h: number, r: number, bezel: number) {
    const key = `${w}x${h}r${r}b${bezel}`
    const hit = mapCache.get(key)
    if (hit) return hit
    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    const ctx = c.getContext("2d")
    if (!ctx) return ""
    const img = ctx.createImageData(w, h)
    const bx = w / 2 - r
    const by = h / 2 - r
    const bw = Math.max(1, Math.min(bezel, Math.min(w, h) / 2))
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const px = x + 0.5 - w / 2
            const py = y + 0.5 - h / 2
            const qx = Math.abs(px) - bx
            const qy = Math.abs(py) - by
            let nx = 0
            let ny = 0
            let dist: number
            if (qx > 0 && qy > 0) {
                const l = Math.hypot(qx, qy)
                dist = r - l
                nx = (qx / (l || 1)) * Math.sign(px)
                ny = (qy / (l || 1)) * Math.sign(py)
            } else if (qx > qy) {
                dist = r - qx
                nx = Math.sign(px)
            } else {
                dist = r - qy
                ny = Math.sign(py)
            }
            let dx = 0
            let dy = 0
            if (dist >= 0 && dist < bw) {
                const t = 1 - dist / bw // 1 at the edge → 0 inside
                const k = 1 - Math.sqrt(1 - t * t) // circular lens profile
                dx = -nx * k
                dy = -ny * k
            }
            const i = (y * w + x) * 4
            img.data[i] = 128 + dx * 127
            img.data[i + 1] = 128 + dy * 127
            img.data[i + 2] = 128
            img.data[i + 3] = 255
        }
    }
    ctx.putImageData(img, 0, 0)
    const url = c.toDataURL()
    if (mapCache.size > 40) mapCache.clear()
    mapCache.set(key, url)
    return url
}

function IconSvg({ name, size }: { name: Icon; size: number }) {
    const paths: Record<string, string> = {
        chevron: "M9.5 6l6 6-6 6",
        arrow: "M5 12h14M13 6l6 6-6 6",
        arrowUpRight: "M7 17L17 7M8.5 7H17v8.5",
        plus: "M12 5v14M5 12h14",
    }
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, display: "block" }}
            aria-hidden
        >
            <path d={paths[name]} />
        </svg>
    )
}

// ---------- styles ----------

const CSS = `
.lgb{
  --mx:50%;--my:50%;
  --hi:255,255,255; --lo:0,0,0;
  --glass-a:.20; --glass-b:.03; --glass-c:.14;
  --rim-hi:.95; --rim-lo:.10; --bev-dark:.34; --bev-light:.9;
  --sh-a:.14; --sh-b:.22; --sh-c:.28;
  --text-shadow:0 1px 0 rgba(255,255,255,.55);
  appearance:none;-webkit-appearance:none;position:relative;display:inline-flex;
  align-items:center;justify-content:center;box-sizing:border-box;
  padding:var(--pad);border:0;margin:0;background:none;border-radius:var(--r);
  color:var(--text);font:inherit;text-decoration:none;outline:none;cursor:pointer;
  user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;
  touch-action:manipulation;isolation:isolate;
  transition:transform .5s cubic-bezier(.2,1.5,.35,1);
}
.lgb[data-theme="dark"]{
  --glass-a:.10; --glass-b:.01; --glass-c:.06;
  --rim-hi:.55; --rim-lo:.05; --bev-dark:.55; --bev-light:.28;
  --sh-a:.30; --sh-b:.40; --sh-c:.50;
  --text-shadow:0 1px 1px rgba(0,0,0,.35);
}
.lgb:hover{transform:translateY(-1px)}
.lgb[data-pressed="true"]{transform:scale(var(--press));transition-duration:.18s;transition-timing-function:cubic-bezier(.3,.7,.4,1)}
.lgb:focus-visible{outline:2px solid rgba(0,122,255,.7);outline-offset:3px}
.lgb[data-disabled="true"]{opacity:.5;cursor:default;pointer-events:none}
.lgb *{box-sizing:border-box}
.lgb-l{position:absolute;inset:0;border-radius:inherit;pointer-events:none}

.lgb-shadow{
  box-shadow:
    0 1px 1px rgba(var(--lo),calc(var(--sh-a)*var(--sh))),
    0 4px 6px -3px rgba(var(--lo),calc(var(--sh-b)*var(--sh))),
    0 14px 24px -12px rgba(var(--lo),calc(var(--sh-c)*var(--sh)));
  transition:box-shadow .3s ease;
}
.lgb:hover .lgb-shadow{
  box-shadow:
    0 1px 1px rgba(var(--lo),calc(var(--sh-a)*var(--sh))),
    0 6px 8px -4px rgba(var(--lo),calc(var(--sh-b)*var(--sh))),
    0 18px 28px -12px rgba(var(--lo),calc(var(--sh-c)*var(--sh)));
}
.lgb[data-pressed="true"] .lgb-shadow{
  box-shadow:
    0 1px 1px rgba(var(--lo),calc(var(--sh-a)*var(--sh))),
    0 2px 3px -2px rgba(var(--lo),calc(var(--sh-b)*var(--sh))),
    0 6px 12px -8px rgba(var(--lo),calc(var(--sh-c)*var(--sh)));
}

.lgb-glass{
  overflow:hidden;
  background:
    linear-gradient(150deg,rgba(var(--hi),var(--glass-a)),rgba(var(--hi),var(--glass-b)) 45%,rgba(var(--hi),var(--glass-c))),
    linear-gradient(var(--tint),var(--tint));
}

.lgb-bevel{
  box-shadow:
    inset 0 1px 1px rgba(var(--hi),calc(.8*var(--rim-hi))),
    inset 0 -1px 1px rgba(var(--hi),calc(.6*var(--rim-hi))),
    inset 0 10px 12px -9px rgba(var(--lo),calc(var(--bev-dark)*var(--d))),
    inset 0 -10px 10px -8px rgba(var(--hi),calc(var(--bev-light)*var(--d))),
    inset 6px 0 9px -8px rgba(var(--lo),calc(.85*var(--bev-dark)*var(--d))),
    inset -6px 0 9px -8px rgba(var(--lo),calc(.7*var(--bev-dark)*var(--d)));
  transition:box-shadow .25s ease;
}
.lgb[data-pressed="true"] .lgb-bevel{
  box-shadow:
    inset 0 1px 1px rgba(var(--hi),calc(.6*var(--rim-hi))),
    inset 0 -1px 1px rgba(var(--hi),calc(.5*var(--rim-hi))),
    inset 0 12px 14px -9px rgba(var(--lo),calc(1.25*var(--bev-dark)*var(--d))),
    inset 0 -8px 9px -8px rgba(var(--hi),calc(.8*var(--bev-light)*var(--d))),
    inset 7px 0 10px -8px rgba(var(--lo),calc(var(--bev-dark)*var(--d))),
    inset -7px 0 10px -8px rgba(var(--lo),calc(.85*var(--bev-dark)*var(--d)));
}

.lgb-rim{
  padding:1px;
  background:conic-gradient(from 200deg,
    rgba(var(--hi),var(--rim-hi)) 0deg,
    rgba(var(--hi),calc(var(--rim-hi)*.3)) 50deg,
    rgba(var(--lo),var(--rim-lo)) 100deg,
    rgba(var(--hi),calc(var(--rim-hi)*.25)) 150deg,
    rgba(var(--hi),var(--rim-hi)) 190deg,
    rgba(var(--hi),calc(var(--rim-hi)*.3)) 240deg,
    rgba(var(--lo),var(--rim-lo)) 285deg,
    rgba(var(--hi),calc(var(--rim-hi)*.3)) 330deg,
    rgba(var(--hi),var(--rim-hi)) 360deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  opacity:.9;
}

/* no mix-blend-mode here: it would cut the frost layer off from the page behind */
.lgb-glow{
  background:radial-gradient(110px 70px at var(--mx) var(--my),rgba(var(--hi),.24),rgba(var(--hi),.06) 45%,transparent 75%);
  opacity:0;transition:opacity .35s ease;
}
.lgb:hover .lgb-glow{opacity:1}
.lgb[data-pressed="true"] .lgb-glow{opacity:.6}

.lgb-shine{
  position:absolute;top:-60%;bottom:-60%;left:0;width:55%;
  background:linear-gradient(105deg,transparent 25%,rgba(var(--hi),.35) 48%,rgba(var(--hi),.5) 52%,transparent 75%);
  transform:translateX(-120%) skewX(-12deg);opacity:.7;pointer-events:none;
}
.lgb:hover .lgb-shine{transform:translateX(320%) skewX(-12deg);transition:transform 1.1s cubic-bezier(.3,.6,.2,1)}

.lgb-content{
  position:relative;z-index:1;display:inline-flex;align-items:center;gap:var(--gap);
  white-space:nowrap;text-shadow:var(--text-shadow);line-height:1.2;
}
@media (prefers-reduced-motion: reduce){
  .lgb,.lgb *{transition:none!important}
  .lgb:hover .lgb-shine{transform:translateX(-120%)}
}
`

// ---------- property controls ----------

addPropertyControls(LiquidGlassButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Click me",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            lineHeight: "1.2em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#26282D",
    },
    icon: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["none", "chevron", "arrow", "arrowUpRight", "plus"],
        optionTitles: ["None", "Chevron", "Arrow", "Arrow ↗", "Plus"],
        defaultValue: "chevron",
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "right",
        hidden: (p) => p.icon === "none",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 18,
        min: 8,
        max: 48,
        step: 1,
        hidden: (p) => p.icon === "none",
    },
    theme: {
        type: ControlType.Enum,
        title: "Surface",
        options: ["light", "dark"],
        optionTitles: ["Light BG", "Dark BG"],
        displaySegmentedControl: true,
        defaultValue: "light",
    },
    tint: { type: ControlType.Color, title: "Tint", defaultValue: "#FFFFFF" },
    tintOpacity: {
        type: ControlType.Number,
        title: "Tint Amount",
        defaultValue: 0.05,
        min: 0,
        max: 1,
        step: 0.01,
    },
    blur: {
        type: ControlType.Number,
        title: "Frost",
        defaultValue: 5.4,
        min: 0,
        max: 40,
        step: 0.1,
        unit: "px",
    },
    refraction: {
        type: ControlType.Number,
        title: "Refraction",
        defaultValue: 50,
        min: 0,
        max: 150,
        step: 1,
        description: "Lens bend at the edges. Chromium browsers only.",
    },
    bezel: {
        type: ControlType.Number,
        title: "Edge Width",
        defaultValue: 16,
        min: 2,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (p) => p.refraction === 0,
    },
    depth: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
    },
    shadow: {
        type: ControlType.Number,
        title: "Shadow",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        step: 1,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "20px 30px 20px 30px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
    },
    shine: {
        type: ControlType.Boolean,
        title: "Hover Shine",
        defaultValue: true,
    },
    cursorGlow: {
        type: ControlType.Boolean,
        title: "Cursor Glow",
        defaultValue: true,
    },
    pressScale: {
        type: ControlType.Number,
        title: "Press Scale",
        defaultValue: 0.96,
        min: 0.85,
        max: 1,
        step: 0.01,
    },
    link: { type: ControlType.Link, title: "Link" },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (p) => !p.link,
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    onClick: { type: ControlType.EventHandler },
})
