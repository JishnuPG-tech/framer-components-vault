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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

type Feature = {
    label: string
    eyebrow: string
    title: string
    description: string
    background: string
    shapeColor: string
    accentColor: string
    link: string
}

type Props = {
    items: Feature[]
    startIndex: number
    radius: number
    padding: number
    speed: number
    showCounter: boolean
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: Feature[] = [
    {
        label: "Dream it",
        eyebrow: "01 / IMAGINE",
        title: "Make it feel alive.",
        description: "Give your website room to move. Create something memorable, unexpected, and unmistakably yours.",
        background: "#5991F3",
        shapeColor: "#EEFF70",
        accentColor: "#F6A9E5",
        link: "",
    },
    {
        label: "Design freely",
        eyebrow: "02 / CREATE",
        title: "Break the usual rules.",
        description: "Mix colors, shapes and little surprises. Make your website feel like it belongs to your story.",
        background: "#EEFF70",
        shapeColor: "#7468EB",
        accentColor: "#FF8C5B",
        link: "",
    },
    {
        label: "Make it move",
        eyebrow: "03 / INTERACT",
        title: "Add a little magic.",
        description: "Tiny interactions make a big difference. Turn an ordinary website into something people remember.",
        background: "#F6A9E5",
        shapeColor: "#FF805A",
        accentColor: "#DFFF75",
        link: "",
    },
    {
        label: "Put it out there",
        eyebrow: "04 / LAUNCH",
        title: "Ready, set, go!",
        description: "Your next website deserves a place in the world. Keep experimenting, creating and sharing.",
        background: "#FF8D60",
        shapeColor: "#F7B9E9",
        accentColor: "#628AF4",
        link: "",
    },
]

const SHAPES = [
    "M219 50 C293 28 342 76 355 133 C378 215 347 278 268 293 C205 320 117 301 94 242 C60 177 87 101 142 77 C164 67 191 57 219 50 Z",
    "M212 46 C294 70 363 89 348 159 C343 234 311 291 234 300 C152 314 96 268 87 208 C75 133 124 61 171 54 C184 50 199 44 212 46 Z",
    "M218 57 C278 25 332 70 350 145 C373 204 316 289 253 297 C164 316 97 268 95 203 C77 130 120 98 167 69 C184 60 199 65 218 57 Z",
    "M206 47 C295 40 365 105 352 178 C352 251 285 292 216 300 C128 303 76 241 93 172 C98 111 135 62 177 54 C187 51 195 48 206 47 Z",
]

const INNER_SHAPES = [
    "M171 113 C216 96 267 105 281 144 C311 190 286 236 242 249 C192 268 145 234 137 197 C126 161 142 130 171 113 Z",
    "M182 112 C232 108 286 131 283 176 C290 213 254 253 209 250 C168 257 139 222 143 184 C143 142 160 128 182 112 Z",
    "M183 117 C217 95 270 113 288 163 C295 209 259 249 207 253 C158 251 130 216 147 163 C154 143 165 126 183 117 Z",
    "M184 109 C237 95 276 116 289 162 C297 214 265 247 218 255 C172 260 131 226 139 183 C143 147 160 124 184 109 Z",
]

const CSS = [
    '.jft-root,.jft-root *{box-sizing:border-box;}',
    '.jft-root{width:100%;min-width:0;container-type:inline-size;font-family:Inter,Arial,sans-serif;color:#151515;}',
    '.jft-stage{position:relative;overflow:hidden;width:100%;min-height:490px;display:flex;flex-direction:column;isolation:isolate;}',
    '.jft-top{display:flex;align-items:center;justify-content:space-between;gap:14px;position:relative;z-index:3;font-size:11px;font-weight:650;letter-spacing:.08em;}',
    '.jft-count{display:flex;align-items:center;gap:9px;font-variant-numeric:tabular-nums;}',
    '.jft-dot{height:5px;width:5px;border-radius:50%;background:#151515;opacity:.22;}',
    '.jft-main{position:relative;z-index:1;flex:1;display:grid;grid-template-columns:1fr 1fr;align-items:center;min-height:330px;text-decoration:none;color:inherit;min-width:0;}',
    '.jft-main[data-linked="true"]{cursor:pointer;}',
    '.jft-copy{position:relative;z-index:2;min-width:0;max-width:525px;padding:24px 0 36px;}',
    '.jft-eyebrow{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:600;letter-spacing:.035em;}',
    '.jft-eyebrow::before{content:"";height:7px;width:7px;border-radius:50%;background:#141414;}',
    '.jft-title{font-weight:720;font-size:clamp(36px,6.15cqi,82px);line-height:.985;letter-spacing:-.068em;margin:17px 0 18px;max-width:630px;}',
    '.jft-description{font-size:clamp(13px,1.35cqi,17px);line-height:1.48;margin:0;max-width:355px;font-weight:460;letter-spacing:-.012em;}',
    '.jft-cta{display:inline-flex;align-items:center;gap:24px;background:#151515;color:#fff;border-radius:999px;padding:14px 16px 14px 19px;font-size:13px;font-weight:600;margin-top:27px;min-height:46px;}',
    '.jft-cta-icon{display:grid;place-items:center;background:white;color:#151515;border-radius:100%;width:23px;height:23px;font-size:16px;transition:transform .3s ease;}',
    '.jft-main[data-linked="true"]:hover .jft-cta-icon{transform:rotate(45deg);}',
    '.jft-visual{height:100%;min-height:300px;display:flex;align-items:center;justify-content:center;position:relative;overflow:visible;pointer-events:none;}',
    '.jft-svg{width:min(100%,470px);height:auto;max-height:355px;overflow:visible;filter:drop-shadow(0px 15px 0px rgba(20,20,20,.035));}',
    '.jft-tabs{position:relative;z-index:3;display:flex;align-items:stretch;gap:10px;flex-wrap:wrap;padding-top:10px;}',
    '.jft-tab{appearance:none;border:1.4px solid rgba(19,19,19,.2);min-height:51px;flex:1 1 140px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-radius:999px;padding:9px 17px 9px 20px;color:#111;background:rgba(255,255,255,.36);font-size:13px;font-weight:650;letter-spacing:-.015em;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
    '.jft-tab[data-active="true"]{background:#151515;color:white;border-color:#151515;}',
    '.jft-tab-num{font-size:10px;opacity:.48;font-weight:600;}',
    '.jft-tab:focus-visible,.jft-main[data-linked="true"]:focus-visible{outline:3px solid #111;outline-offset:4px;}',
    '@container (max-width:720px){.jft-stage{min-height:0}.jft-main{grid-template-columns:1fr 1fr;min-height:340px}.jft-title{font-size:clamp(38px,6cqi,58px)}.jft-description{font-size:14px}.jft-svg{width:108%;max-width:none}.jft-tab{flex-basis:40%;min-height:48px}}',
    '@container (max-width:530px){.jft-stage{min-height:0}.jft-main{display:flex;flex-direction:column-reverse;align-items:stretch;min-height:0;gap:0}.jft-visual{min-height:0;height:232px;margin-top:-12px;margin-bottom:-17px}.jft-svg{height:242px;width:auto;max-height:none}.jft-copy{padding:0 0 22px}.jft-title{font-size:clamp(39px,11cqi,56px);max-width:420px;margin:13px 0}.jft-description{font-size:14px;max-width:390px}.jft-cta{margin-top:20px}.jft-tabs{gap:8px}.jft-tab{padding:9px 13px 9px 15px;flex-basis:40%;min-height:45px;font-size:12px}}',
    '@container (max-width:340px){.jft-svg{height:215px}.jft-visual{height:205px}.jft-title{font-size:38px}.jft-tab{flex-basis:100%;min-height:42px}.jft-top{font-size:9px;gap:6px}.jft-count{white-space:nowrap;gap:4px}.jft-dot{display:none}}',
    '@media (prefers-reduced-motion:reduce){.jft-root *{transition:none!important;scroll-behavior:auto!important;}}',
].join("\n")

const clamp = (number: number, max: number) => Math.max(0, Math.min(max, number))

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 510
 */
export default function JellyFeatureTabs(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        startIndex = 0,
        radius = 32,
        padding = 34,
        speed = 0.65,
        showCounter = true,
        titleFont,
        bodyFont,
        labelFont,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const preferReduced = useReducedMotion()
    const reduced = isStatic || !!preferReduced
    const features = Array.isArray(items) && items.length > 0 ? items : DEFAULT_ITEMS
    const [index, setIndex] = React.useState(() => clamp(startIndex, features.length - 1))
    React.useEffect(() => setIndex(clamp(startIndex, features.length - 1)), [startIndex, features.length])
    const active = features[clamp(index, features.length - 1)]
    const link = (active.link || "").trim()
    const target = link.length > 0
    const change = (next: number) => setIndex(clamp(next, features.length - 1))
    const transition = { duration: reduced ? 0 : speed, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
    const viewContent = (
        <>
            <div className="jft-copy">
                <AnimatePresence initial={false} mode="wait">
                    <motion.div key={index} initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -9 }} transition={{ duration: reduced ? 0 : speed * .47, ease: "easeOut" }}>
                        <div className="jft-eyebrow" style={labelFont}>{active.eyebrow}</div>
                        <h2 className="jft-title" style={titleFont}>{active.title}</h2>
                        <p className="jft-description" style={bodyFont}>{active.description}</p>
                        {target && <span className="jft-cta">Get Started <span className="jft-cta-icon" aria-hidden="true">↗</span></span>}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="jft-visual" aria-hidden="true">
                <motion.svg className="jft-svg" viewBox="0 0 440 360" role="presentation" initial={false}>
                    <motion.path animate={{ d: SHAPES[index % SHAPES.length], fill: active.shapeColor, rotate: index * 3 }} transition={transition} style={{ transformOrigin: "220px 180px" }} />
                    <motion.path animate={{ d: INNER_SHAPES[index % INNER_SHAPES.length], fill: active.accentColor, rotate: -index * 7 }} transition={transition} style={{ transformOrigin: "220px 180px" }} />
                    <motion.g animate={{ rotate: index * 80, scale: index % 2 === 0 ? 1 : 1.14 }} transition={transition} style={{ transformOrigin: "218px 182px" }}>
                        <path d="M218 138 V226 M174 182 H262 M187 151 L249 213 M249 151 L187 213" fill="none" stroke="#171717" strokeWidth="12" strokeLinecap="round" />
                        <circle cx="218" cy="182" r="14" fill="#171717" />
                    </motion.g>
                    <motion.g animate={{ x: index % 2 ? -13 : 10, y: index % 3 ? -12 : 8, rotate: index * 22 }} transition={transition}>
                        <rect x="320" y="49" width="66" height="38" rx="19" fill="#171717" transform="rotate(18 353 68)" />
                        <path d="M341 63 L357 76 M355 62 L359 77" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </motion.g>
                    <motion.circle cx="102" cy="97" r="13" fill="#171717" animate={{ cx: 102 + (index % 2) * 12, cy: 97 + index * 7 }} transition={transition} />
                    <motion.circle cx="355" cy="269" r="9" fill="none" stroke="#171717" strokeWidth="3" animate={{ cx: 355 - index * 7, cy: 269 - (index % 2) * 15 }} transition={transition} />
                    <path d="M77 268 l-11 17 M66 268 l20 14 M83 257 l-5 34" stroke="#171717" strokeWidth="3" strokeLinecap="round" />
                </motion.svg>
            </div>
        </>
    )

    return (
        <div className="jft-root" style={{ ...style, width: "100%", minWidth: 0, boxSizing: "border-box" }}>
            <style>{CSS}</style>
            <motion.div className="jft-stage" initial={false} animate={{ backgroundColor: active.background }} transition={transition} style={{ padding: Math.max(16, padding), borderRadius: Math.max(0, radius) }}>
                <div className="jft-top">
                    <span>THE FUN PART OF MAKING THINGS</span>
                    {showCounter && <span className="jft-count">{String(index + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")} <span className="jft-dot" /> <span className="jft-dot" /> <span className="jft-dot" /></span>}
                </div>
                {target ? (
                    <a className="jft-main" data-linked="true" href={link} target="_blank" rel="noopener noreferrer" aria-label={active.title + " — Get Started"}>{viewContent}</a>
                ) : (
                    <div className="jft-main" data-linked="false">{viewContent}</div>
                )}
                <div className="jft-tabs" role="tablist" aria-label="Explore features">
                    {features.map((item, i) => {
                        const selected = i === index
                        return (
                            <motion.button key={i} type="button" role="tab" aria-selected={selected} aria-label={item.label} data-active={selected} className="jft-tab" onClick={() => change(i)}
                                whileHover={reduced ? undefined : { y: -5, rotate: i % 2 ? 1.5 : -1.5 }}
                                whileTap={reduced ? undefined : { scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 330, damping: 22 }}
                                onKeyDown={(event) => {
                                    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                                        event.preventDefault()
                                        change((index + (event.key === "ArrowRight" ? 1 : features.length - 1)) % features.length)
                                    }
                                }}>
                                <span>{item.label}</span><span className="jft-tab-num">{String(i + 1).padStart(2, "0")}</span>
                            </motion.button>
                        )
                    })}
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(JellyFeatureTabs, {
    items: {
        type: ControlType.Array,
        title: "Features",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Tab", defaultValue: "New feature" },
                eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "DISCOVER" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Something good." },
                description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "Tell people what makes this special." },
                background: { type: ControlType.Color, title: "Background", defaultValue: "#5991F3" },
                shapeColor: { type: ControlType.Color, title: "Main Shape", defaultValue: "#EEFF70" },
                accentColor: { type: ControlType.Color, title: "Inner Shape", defaultValue: "#F6A9E5" },
                link: { type: ControlType.Link, title: "CTA Link", defaultValue: "" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
        maxCount: 8,
    },
    startIndex: { type: ControlType.Number, title: "Start Tab", min: 0, max: 7, step: 1, defaultValue: 0 },
    radius: { type: ControlType.Number, title: "Corner Radius", min: 0, max: 80, step: 1, defaultValue: 32 },
    padding: { type: ControlType.Number, title: "Padding", min: 16, max: 80, step: 1, defaultValue: 34 },
    speed: { type: ControlType.Number, title: "Motion Speed", min: 0, max: 1.5, step: 0.05, defaultValue: 0.65 },
    showCounter: { type: ControlType.Boolean, title: "Show Counter", defaultValue: true },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended" },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended" },
    labelFont: { type: ControlType.Font, title: "Label Font", controls: "extended" },
})
