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

type ImageValue = { src?: string; srcSet?: string; alt?: string }
type Project = {
    title: string
    category: string
    image?: ImageValue
    imagePosition: string
    link: string
}
type Props = {
    projects: Project[]
    background: string
    textColor: string
    mutedColor: string
    lineColor: string
    imageOverlay: number
    accentColor: string
    radius: number
    gap: number
    padding: number
    stageHeight: number
    speed: number
    titleFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const LINK = "https://framer.link/SYJK4Bv"
const DEFAULT_PROJECTS: Project[] = [
    {
        title: "Casa Forma",
        category: "RESIDENTIAL · 2026",
        image: {
            src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=88",
            alt: "Softly lit contemporary living space with natural materials"
        },
        imagePosition: "50% 50%",
        link: LINK
    },
    {
        title: "Soft Geometry",
        category: "ARCHITECTURE · 2025",
        image: {
            src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=88",
            alt: "Minimal architectural interior with warm wooden details"
        },
        imagePosition: "50% 50%",
        link: LINK
    },
    {
        title: "The Still House",
        category: "INTERIORS · 2025",
        image: {
            src: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=88",
            alt: "Quiet contemporary interior with a sculptural material palette"
        },
        imagePosition: "50% 50%",
        link: LINK
    },
    {
        title: "New Perspective",
        category: "SPACES · 2024",
        image: {
            src: "https://images.unsplash.com/photo-1600607688066-890987f18a86?auto=format&fit=crop&w=1600&q=88",
            alt: "Natural light falling across a modern architectural space"
        },
        imagePosition: "50% 50%",
        link: LINK
    }
]

const CSS = [
    ".ipi-root,.ipi-root *{box-sizing:border-box}",
    ".ipi-root{container-type:inline-size;isolation:isolate}",
    ".ipi-shell{display:grid;grid-template-columns:minmax(0,42%) minmax(0,1fr);gap:var(--ipi-gap);width:100%;align-items:stretch}",
    ".ipi-index{display:flex;flex-direction:column;min-width:0;min-height:0}",
    ".ipi-topline{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:4px 0 29px}",
    ".ipi-list{display:flex;flex-direction:column;flex:1;min-height:0}",
    ".ipi-row{appearance:none;position:relative;display:flex;align-items:center;gap:15px;width:100%;min-width:0;flex:1;min-height:83px;padding:16px 0;text-align:left;background:transparent;border:0;border-top:1px solid var(--ipi-line);text-decoration:none;cursor:pointer;color:inherit;-webkit-tap-highlight-color:transparent}",
    ".ipi-row:last-child{border-bottom:1px solid var(--ipi-line)}",
    ".ipi-row:focus-visible,.ipi-stage-link:focus-visible{outline:2px solid var(--ipi-accent);outline-offset:-3px}",
    ".ipi-rowtitle{display:block;min-width:0;overflow-wrap:anywhere;line-height:1.09}",
    ".ipi-number{flex:0 0 27px;align-self:flex-start;padding-top:8px;font-variant-numeric:tabular-nums}",
    ".ipi-rowtext{flex:1;min-width:0}",
    ".ipi-rowarrow{display:flex;align-items:center;justify-content:center;flex:0 0 32px;width:32px;height:32px;border:1px solid currentColor;border-radius:50%;opacity:0;transform:translateX(-8px);transition:opacity .25s ease,transform .4s cubic-bezier(.2,.75,.25,1)}",
    ".ipi-row[aria-current='true'] .ipi-rowarrow,.ipi-row:hover .ipi-rowarrow,.ipi-row:focus-visible .ipi-rowarrow{opacity:1;transform:translateX(0)}",
    ".ipi-visual{position:relative;overflow:hidden;min-width:0;min-height:0;height:var(--ipi-height);background:#CCC5B9}",
    ".ipi-stage-link{position:absolute;inset:0;display:block;color:#fff;cursor:pointer;text-decoration:none;isolation:isolate}",
    ".ipi-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;user-select:none}",
    ".ipi-scrim{position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.68) 100%);pointer-events:none}",
    ".ipi-bottombar{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;gap:20px;align-items:flex-end;padding:30px;color:#fff}",
    ".ipi-stagearrow{width:45px;height:45px;border-radius:50%;background:white;color:#131313;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .35s cubic-bezier(.2,.75,.25,1)}",
    ".ipi-stage-link:hover .ipi-stagearrow{transform:rotate(-45deg)}",
    ".ipi-stage-link:active .ipi-stagearrow{transform:scale(.93)}",
    "@container (max-width:700px){.ipi-shell{display:flex;flex-direction:column-reverse}.ipi-visual{height:auto;aspect-ratio:1.52}.ipi-topline{padding:0 0 17px}.ipi-row{min-height:66px;padding:13px 0}.ipi-number{flex-basis:23px;padding-top:5px}.ipi-bottombar{padding:21px}.ipi-stagearrow{width:40px;height:40px}}",
    "@container (max-width:410px){.ipi-visual{aspect-ratio:1.24}.ipi-row{min-height:61px;gap:10px}.ipi-rowarrow{width:28px;height:28px;flex-basis:28px}.ipi-bottombar{padding:16px}}",
    "@media(prefers-reduced-motion:reduce){.ipi-rowarrow,.ipi-stagearrow{transition:none!important;transform:none!important}}"
].join("\n")

function Arrow({ size = 16 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10h11M10.5 5.5L15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1060
 * @framerIntrinsicHeight 512
 */
export default function ImageProjectIndex(props: Props) {
    const {
        projects = DEFAULT_PROJECTS,
        background = "#F2F0EA",
        textColor = "#20211E",
        mutedColor = "#777870",
        lineColor = "#D1D0C8",
        imageOverlay = 0.06,
        accentColor = "#22231F",
        radius = 16,
        gap = 20,
        padding = 24,
        stageHeight = 444,
        speed = 0.65,
        titleFont,
        labelFont,
        style
    } = props
    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion() || isStatic
    const list = Array.isArray(projects) && projects.length > 0 ? projects : DEFAULT_PROJECTS
    const [selected, setSelected] = React.useState(0)
    const currentIndex = Math.min(selected, list.length - 1)
    const item = list[currentIndex]
    const imageSource = item.image?.src || DEFAULT_PROJECTS[0].image?.src || ""
    const fontTitle: React.CSSProperties = {
        fontFamily: "Instrument Sans, Inter, Arial, sans-serif",
        fontSize: "clamp(19px, 2.8cqw, 32px)",
        fontWeight: 500,
        lineHeight: 1.08,
        letterSpacing: "-0.045em",
        ...titleFont
    }
    const fontLabel: React.CSSProperties = {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.085em",
        lineHeight: 1.25,
        ...labelFont
    }
    const vars = {
        "--ipi-gap": Math.max(0,gap) + "px",
        "--ipi-height": Math.max(260,stageHeight) + "px",
        "--ipi-line": lineColor,
        "--ipi-accent": accentColor
    } as React.CSSProperties
    const select = (index: number) => {
        if (!isStatic) setSelected(index)
    }
    return (
        <div className="ipi-root" style={{
            width: "100%", height: "auto", minWidth: 0, padding: Math.max(0,padding),
            background, borderRadius: Math.max(0,radius), color: textColor,
            ...style, ...vars
        }}>
            <style>{CSS}</style>
            <div className="ipi-shell">
                <div className="ipi-index">
                    <div className="ipi-topline" style={{ color: mutedColor, ...fontLabel }}>
                        <span>SELECTED PROJECTS</span>
                        <span>{String(list.length).padStart(2,"0")} / INDEX</span>
                    </div>
                    <div className="ipi-list">
                        {list.map((p,i) => {
                            const active = i === currentIndex
                            const baseStyle: React.CSSProperties = { color: active ? textColor : mutedColor, transition: reduced ? "none" : "color .3s ease" }
                            const children = <>
                                <span className="ipi-number" style={{ ...fontLabel, color: active ? textColor : mutedColor }}>{String(i+1).padStart(2,"0")}</span>
                                <span className="ipi-rowtext">
                                    <span className="ipi-rowtitle" style={fontTitle}>{p.title}</span>
                                    <span style={{ ...fontLabel, color: mutedColor, display:"block", marginTop: 8 }}>{p.category}</span>
                                </span>
                                <span className="ipi-rowarrow"><Arrow size={15}/></span>
                            </>
                            return active && p.link ? (
                                <a key={i} className="ipi-row" aria-current="true" href={p.link} target="_blank" rel="noopener noreferrer" style={baseStyle}>
                                    {children}
                                </a>
                            ) : (
                                <button key={i} className="ipi-row" type="button" aria-current={active ? "true" : undefined}
                                    aria-label={"Show "+p.title} onMouseEnter={() => select(i)}
                                    onFocus={() => select(i)} onClick={() => select(i)}
                                    style={baseStyle}>
                                    {children}
                                </button>
                            )
                        })}
                    </div>
                </div>
                <div className="ipi-visual" style={{borderRadius: Math.max(0,radius-4)}}>
                    <a className="ipi-stage-link" href={item.link || undefined} target="_blank" rel="noopener noreferrer" aria-label={"Open "+item.title}>
                        <AnimatePresence initial={false} mode="sync">
                            <motion.img className="ipi-image" key={String(currentIndex) + imageSource}
                                src={imageSource} srcSet={item.image?.srcSet} alt={item.image?.alt || item.title}
                                draggable={false} loading={currentIndex===0 ? "eager" : "lazy"}
                                initial={reduced ? false : { clipPath: "inset(0 0 0 100%)", scale: 1.055 }}
                                animate={{clipPath:"inset(0 0 0 0%)", scale:1, opacity:1}}
                                exit={reduced ? {opacity:0} : {opacity:0,transition:{duration:.18,delay:Math.max(0,speed*.72)}}}
                                transition={{duration: reduced ? 0 : speed, ease:[.25,.75,.2,1]}}
                                style={{objectPosition:item.imagePosition||"50% 50%"}}
                            />
                        </AnimatePresence>
                        <div className="ipi-scrim" style={{opacity: 0.78 + Math.max(0,Math.min(1,imageOverlay))*0.22}}/>
                        <div className="ipi-bottombar">
                            <div style={{maxWidth:"82%"}}>
                                <span style={{...fontLabel,color:"rgba(255,255,255,.83)"}}>PROJECT {String(currentIndex+1).padStart(2,"0")} / {String(list.length).padStart(2,"0")}</span>
                                <div style={{...fontTitle,fontSize:"clamp(25px,3.6cqw,44px)",marginTop:8,color:"#FFFFFF"}}>{item.title}</div>
                            </div>
                            <span className="ipi-stagearrow"><Arrow size={19}/></span>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ImageProjectIndex, {
    projects: {
        type:ControlType.Array,title:"Projects",maxCount:12,defaultValue:DEFAULT_PROJECTS,
        control:{type:ControlType.Object,controls:{
            title:{type:ControlType.String,title:"Title",defaultValue:"Project title"},
            category:{type:ControlType.String,title:"Category",defaultValue:"PROJECT · 2026"},
            image:{type:ControlType.ResponsiveImage,title:"Image"},
            imagePosition:{type:ControlType.String,title:"Image Focus",defaultValue:"50% 50%"},
            link:{type:ControlType.Link,title:"Project Link",defaultValue:LINK}
        }}
    },
    background:{type:ControlType.Color,title:"Background",defaultValue:"#F2F0EA"},
    textColor:{type:ControlType.Color,title:"Text",defaultValue:"#20211E"},
    mutedColor:{type:ControlType.Color,title:"Muted Text",defaultValue:"#777870"},
    lineColor:{type:ControlType.Color,title:"Dividers",defaultValue:"#D1D0C8"},
    accentColor:{type:ControlType.Color,title:"Focus Color",defaultValue:"#22231F"},
    imageOverlay:{type:ControlType.Number,title:"Image Overlay",defaultValue:.06,min:0,max:1,step:.05},
    radius:{type:ControlType.Number,title:"Radius",defaultValue:16,min:0,max:50,step:1},
    gap:{type:ControlType.Number,title:"Panel Gap",defaultValue:20,min:0,max:60,step:2},
    padding:{type:ControlType.Number,title:"Padding",defaultValue:24,min:0,max:64,step:2},
    stageHeight:{type:ControlType.Number,title:"Image Height",defaultValue:444,min:280,max:720,step:4},
    speed:{type:ControlType.Number,title:"Reveal Speed",defaultValue:.65,min:.15,max:1.5,step:.05},
    titleFont:{type:ControlType.Font,title:"Title Font",controls:"extended"},
    labelFont:{type:ControlType.Font,title:"Label Font",controls:"extended",}
})
