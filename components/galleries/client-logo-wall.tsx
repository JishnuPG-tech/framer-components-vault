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

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

type FramerImage = { src?: string; srcSet?: string; alt?: string }

type Client = {
    name: string
    category: string
    headline: string
    description: string
    service: string
    cta: string
    link: string
    logo?: FramerImage
}

type Props = {
    clients: Client[]
    defaultSelected: number
    background: string
    tileBackground: string
    accent: string
    foreground: string
    muted: string
    activeForeground: string
    tileBorder: string
    gap: number
    radius: number
    cellHeight: number
    motionSpeed: number
    logoFont?: React.CSSProperties
    titleFont?: React.CSSProperties
    detailFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_CLIENTS: Client[] = [
    {
        name: "forma®",
        category: "Creative studio",
        headline: "Great work starts with a great partnership.",
        description: "A thoughtful digital identity, built to make every interaction feel effortless.",
        service: "Brand identity / Digital",
        cta: "Create Your Own",
        link: "",
    },
    {
        name: "NORTH",
        category: "Digital products",
        headline: "Making ambitious ideas feel refreshingly simple.",
        description: "An expressive digital experience with clarity at every touchpoint.",
        service: "Strategy / Experience",
        cta: "Create Your Own",
        link: "",
    },
    {
        name: "monok",
        category: "Design & culture",
        headline: "A new perspective on the things we use every day.",
        description: "A distinctive online home that puts ideas and people first.",
        service: "Art direction / Website",
        cta: "Create Your Own",
        link: "",
    },
    {
        name: "usual.",
        category: "Lifestyle brand",
        headline: "An identity designed to move with you.",
        description: "An editorial approach to a modern brand and its digital world.",
        service: "Branding / Web design",
        cta: "Create Your Own",
        link: "",
    },
    {
        name: "A—O",
        category: "Creative technology",
        headline: "Crafting what comes next, together.",
        description: "A focused digital story that balances character and utility.",
        service: "Design / Development",
        cta: "Create Your Own",
        link: "",
    },
]

const CSS = [
    ".cpm-root,.cpm-root *{box-sizing:border-box}",
    ".cpm-root{container-type:inline-size;isolation:isolate;}",
    ".cpm-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,var(--cell));grid-auto-rows:var(--cell);gap:var(--gap);width:100%;}",
    ".cpm-item{min-width:0;min-height:0;position:relative;}",
    ".cpm-item:first-child{grid-column:span 2;grid-row:span 2;}",
    ".cpm-surface{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;position:relative;border-radius:inherit;}",
    ".cpm-feature-link:hover .cpm-name,.cpm-feature-link:focus-visible .cpm-name{transform:translateY(-3px)}",
    ".cpm-feature-link:hover .cpm-small-arrow,.cpm-feature-link:focus-visible .cpm-small-arrow{transform:translate(3px,-3px)}",
    ".cpm-name{transition:transform .35s cubic-bezier(.2,.75,.2,1);}",
    ".cpm-small-arrow{transition:transform .35s cubic-bezier(.2,.75,.2,1)}",
    ".cpm-feature-link{color:inherit;text-decoration:none;cursor:pointer;}",
    ".cpm-feature-link:focus-visible{outline:3px solid var(--focus);outline-offset:-5px;}",
    ".cpm-logo-img{display:block;max-width:100%;max-height:70px;width:auto;height:auto;object-fit:contain;object-position:left center;}",
    ".cpm-mini-logo{display:block;max-width:80%;max-height:54px;object-fit:contain;width:auto;height:auto;}",
    ".cpm-cta{display:inline-flex;align-items:center;gap:9px;font-size:12px;font-weight:600;letter-spacing:-.015em;line-height:1.2;white-space:nowrap;}",
    ".cpm-cta svg{transition:transform .3s ease}.cpm-feature-link:hover .cpm-cta svg{transform:translate(3px,-3px)}",
    ".cpm-feature-link:hover .cpm-cta{text-decoration:underline;text-underline-offset:4px;}",
    "@container (max-width:850px){.cpm-grid{grid-template-rows:repeat(2,175px);grid-auto-rows:175px}.cpm-featured{padding:27px!important}.cpm-feature-headline{font-size:clamp(25px,3.15cqw,30px)!important}.cpm-feature-description{font-size:12px!important}.cpm-mini{padding:18px!important}.cpm-small-logo-text{font-size:clamp(20px,3cqw,32px)!important}}",
    "@container (max-width:590px){.cpm-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:350px;grid-auto-rows:145px;gap:9px}.cpm-item:first-child{grid-column:1/-1;grid-row:span 1}.cpm-featured{padding:26px!important}.cpm-feature-headline{font-size:clamp(24px,6.6cqw,29px)!important}.cpm-feature-description{font-size:12px!important;max-width:95%!important}.cpm-mini{padding:17px!important}.cpm-small-logo-text{font-size:clamp(18px,5cqw,30px)!important}.cpm-mini-category{font-size:10px!important}.cpm-logo-img{max-height:58px}}",
    "@container (max-width:355px){.cpm-featured{padding:20px!important}.cpm-feature-headline{font-size:23px!important}.cpm-feature-description{display:none!important}.cpm-mini{padding:14px!important}.cpm-small-logo-text{font-size:21px!important}}",
    "@media(prefers-reduced-motion:reduce){.cpm-root *, .cpm-root *:before,.cpm-root *:after{transition:none!important;animation:none!important}}"
].join("\n")

function CornerArrow({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{display:"block",flexShrink:0}}>
            <path d="M5 19L19 5M7 5h12v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 460
 */
export default function ClientProofMosaic(props: Props) {
    const {
        clients = DEFAULT_CLIENTS,
        defaultSelected = 0,
        background = "#F3F3F1",
        tileBackground = "#FFFFFF",
        accent = "#3046EE",
        foreground = "#1A1A1A",
        muted = "#898984",
        activeForeground = "#FFFFFF",
        tileBorder = "#E8E8E5",
        gap = 12,
        radius = 18,
        cellHeight = 220,
        motionSpeed = 0.68,
        logoFont,
        titleFont,
        detailFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const noMotion = isStatic || Boolean(reduceMotion)
    const safe = Array.isArray(clients) && clients.length ? clients : DEFAULT_CLIENTS
    const clampedDefault = Math.max(0, Math.min(safe.length - 1, Math.round(defaultSelected || 0)))
    // Featured client is configured in Framer. All cards navigate directly when linked.
    const activeIndex = clampedDefault
    const ordered = [activeIndex, ...safe.map((_, index) => index).filter(i => i !== activeIndex)]
    const displayed = ordered.map(index => ({ client: safe[index], index }))

    const brandStyle: React.CSSProperties = {
        fontFamily: "Inter Display, Inter, sans-serif",
        fontSize: 33,
        fontWeight: 650,
        letterSpacing: "-.065em",
        lineHeight: 1,
        ...logoFont,
    }
    const headlineStyle: React.CSSProperties = {
        fontFamily: "Inter Display, Inter, sans-serif",
        fontSize: 31,
        fontWeight: 480,
        letterSpacing: "-.039em",
        lineHeight: 1.17,
        ...titleFont,
    }
    const smallStyle: React.CSSProperties = {
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        fontWeight: 450,
        letterSpacing: "-.005em",
        lineHeight: 1.45,
        ...detailFont,
    }

    return (
        <div
            className="cpm-root"
            style={{
                width:"100%",
                height:"auto",
                minWidth:0,
                padding:gap,
                borderRadius:radius + gap / 2,
                background,
                color:foreground,
                "--gap":gap + "px",
                "--cell":Math.max(125,cellHeight) + "px",
                "--focus":foreground,
                ...style,
            } as React.CSSProperties}
        >
            <style>{CSS}</style>
            <div className="cpm-grid" aria-label="Featured clients and projects">
                {displayed.map(({client,index}, position) => {
                    const active = position === 0
                    const url = typeof client.link === "string" ? client.link.trim() : ""
                    const content = active ? (
                        <div
                            className="cpm-surface cpm-featured"
                            style={{
                                padding:36,
                                justifyContent:"space-between",
                                background:accent,
                                color:activeForeground,
                                gap:20,
                            }}
                        >
                            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,minWidth:0}}>
                                <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:0}}>
                                    {client.logo?.src ? (
                                        <img className="cpm-logo-img" src={client.logo.src} srcSet={client.logo.srcSet} alt={client.logo.alt || client.name} draggable={false}/>
                                    ) : (
                                        <span style={{...brandStyle,display:"block",overflowWrap:"anywhere"}}>{client.name}</span>
                                    )}
                                    
                                </div>
                                <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:35,height:35,border:"1px solid rgba(255,255,255,.46)",borderRadius:"50%",flexShrink:0}}>
                                    {url ? <CornerArrow size={17}/> : <span style={{fontSize:11,fontWeight:600}}>{String(index+1).padStart(2,"0")}</span>}
                                </div>
                            </div>
                            <AnimatePresence initial={false} mode="wait">
                                <motion.div
                                    key={index}
                                    initial={noMotion ? false : {opacity:0,y:11}}
                                    animate={{opacity:1,y:0}}
                                    exit={noMotion ? undefined : {opacity:0,y:-8}}
                                    transition={{duration:noMotion ? 0 : Math.min(.36,motionSpeed*.48),ease:[.22,1,.36,1]}}
                                    style={{display:"flex",flexDirection:"column",gap:12,maxWidth:500,marginTop:"auto"}}
                                >
                                    
                                    <h3 className="cpm-feature-headline" style={{...headlineStyle,margin:0,color:activeForeground,maxWidth:455,overflowWrap:"break-word"}}>
                                        {client.headline}
                                    </h3>
                                    <p className="cpm-feature-description" style={{...smallStyle,margin:0,color:"rgba(255,255,255,.72)",fontSize:12.5,lineHeight:1.55,maxWidth:400}}>
                                        {client.description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",borderTop:"1px solid rgba(255,255,255,.4)",paddingTop:17}}>
                                <span style={{...smallStyle,fontSize:11,color:"rgba(255,255,255,.76)"}}>{client.service}</span>
                                {url && client.cta && (
                                    <span className="cpm-cta">
                                        {client.cta}<CornerArrow size={15}/>
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="cpm-surface cpm-mini" style={{background:tileBackground,padding:22,justifyContent:"space-between",gap:10}}>
                            <div style={{display:"flex",justifyContent:"flex-end",minHeight:15}}>
                                {url && <span className="cpm-small-arrow" style={{display:"inline-flex",color:muted}}><CornerArrow size={15}/></span>}
                            </div>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:9,flex:1,minWidth:0}}>
                                {client.logo?.src ? (
                                    <img className="cpm-mini-logo" src={client.logo.src} srcSet={client.logo.srcSet} alt={client.logo.alt || client.name} draggable={false}/>
                                ) : (
                                    <span className="cpm-name cpm-small-logo-text" style={{...brandStyle,fontSize:32,display:"block",textAlign:"center",overflowWrap:"anywhere",maxWidth:"100%"}}>{client.name}</span>
                                )}
                                <span className="cpm-mini-category" style={{...smallStyle,color:muted,fontSize:11,textAlign:"center"}}>{client.category}</span>
                            </div>
                            <div style={{height:15}} aria-hidden="true"/>
                        </div>
                    )

                    return (
                        <motion.div
                            key={index}
                            className="cpm-item"
                            initial={false}
                            style={{
                                borderRadius:radius,
                                background:active ? accent : tileBackground,
                                border:active ? "1px solid transparent" : "1px solid " + tileBorder,
                                boxShadow:active ? "0 12px 38px rgba(38,57,187,.10)" : "none",
                                overflow:"hidden",
                            }}
                        >
                            {active ? (
                                url ? (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="cpm-surface cpm-feature-link" aria-label={client.name + " — " + client.cta}>
                                        {content}
                                    </a>
                                ) : (
                                    <div className="cpm-surface">{content}</div>
                                )
                            ) : url ? (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="cpm-surface cpm-feature-link" aria-label={"Visit " + client.name}>
                                    {content}
                                </a>
                            ) : (
                                <div className="cpm-surface">{content}</div>
                            )}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

ClientProofMosaic.defaultProps = {
    clients: DEFAULT_CLIENTS,
    defaultSelected: 0,
    background: "#F3F3F1",
    tileBackground: "#FFFFFF",
    accent: "#3046EE",
    foreground: "#1A1A1A",
    muted: "#898984",
    activeForeground: "#FFFFFF",
    tileBorder: "#E8E8E5",
    gap: 12,
    radius: 18,
    cellHeight: 220,
    motionSpeed: .68,
}

addPropertyControls(ClientProofMosaic, {
    clients: {
        type: ControlType.Array,
        title: "Clients",
        maxCount: 12,
        defaultValue: DEFAULT_CLIENTS,
        control: {
            type: ControlType.Object,
            controls: {
                name: {type:ControlType.String,title:"Name",defaultValue:"New Client"},
                logo: {type:ControlType.ResponsiveImage,title:"Logo"},
                category: {type:ControlType.String,title:"Category",defaultValue:"Creative studio"},
                headline: {type:ControlType.String,title:"Headline",displayTextArea:true,defaultValue:"Great work starts together."},
                description: {type:ControlType.String,title:"Description",displayTextArea:true,defaultValue:"A thoughtful new digital experience."},
                service: {type:ControlType.String,title:"Services",defaultValue:"Brand / Digital"},
                cta: {type:ControlType.String,title:"CTA",defaultValue:"Explore Project"},
                link: {type:ControlType.Link,title:"Link",defaultValue:""},
            },
        },
    },
    defaultSelected: {type:ControlType.Number,title:"Featured Client",min:0,max:11,step:1,defaultValue:0,displayStepper:true},
    background: {type:ControlType.Color,title:"Canvas",defaultValue:"#F3F3F1"},
    tileBackground: {type:ControlType.Color,title:"Tile",defaultValue:"#FFFFFF"},
    accent: {type:ControlType.Color,title:"Feature",defaultValue:"#3046EE"},
    foreground: {type:ControlType.Color,title:"Text",defaultValue:"#1A1A1A"},
    muted: {type:ControlType.Color,title:"Muted",defaultValue:"#898984"},
    activeForeground: {type:ControlType.Color,title:"Feature Text",defaultValue:"#FFFFFF"},
    tileBorder: {type:ControlType.Color,title:"Tile Border",defaultValue:"#E8E8E5"},
    gap: {type:ControlType.Number,title:"Gap",min:0,max:32,step:1,defaultValue:12,unit:"px"},
    radius: {type:ControlType.Number,title:"Radius",min:0,max:40,step:1,defaultValue:18,unit:"px"},
    cellHeight: {type:ControlType.Number,title:"Cell Height",min:125,max:320,step:5,defaultValue:220,unit:"px"},
    motionSpeed: {type:ControlType.Number,title:"Reveal Speed",min:.3,max:1.4,step:.05,defaultValue:.68,unit:"s"},
    logoFont: {type:ControlType.Font,title:"Logo Font",controls:"extended",},
    titleFont: {type:ControlType.Font,title:"Title Font",controls:"extended",},
    detailFont: {type:ControlType.Font,title:"Detail Font",controls:"extended",},
})