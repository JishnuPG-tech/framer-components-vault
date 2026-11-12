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

import { motion, useReducedMotion } from "framer-motion"

type LogoImage = { src?: string; srcSet?: string; alt?: string }
type Logo = { name: string; image?: LogoImage; link: string }
type Props = {
    logos: Logo[]
    visibleCount: number
    desktopColumns: number
    tabletColumns: number
    mobileColumns: number
    cellHeight: number
    horizontalPadding: number
    verticalPadding: number
    radius: number
    backgroundTop: string
    backgroundBottom: string
    logoColor: string
    lineColor: string
    lineThickness: number
    lineVariation: number
    logoSize: number
    imageMode: "white" | "original"
    ctaEnabled: boolean
    ctaText: string
    ctaLink: string
    ctaBackground: string
    ctaColor: string
    hoverMotion: boolean
    logoFont?: React.CSSProperties
    ctaFont?: React.CSSProperties
    style?: React.CSSProperties
}

const NAMES = [
    "forma®", "NORTH", "monok", "usual.", "A—O", "kerno",
    "velar", "sento", "〃", "lucid", "orby", "toka",
    "onno", "RIVÄ", "plano", "muse", "ark",
]
const DEFAULT_LOGOS: Logo[] = NAMES.map(name => ({ name, link: "" }))

const CSS = [
    ".olw-root,.olw-root *{box-sizing:border-box}",
    ".olw-root{container-type:inline-size;isolation:isolate;width:100%;}",
    ".olw-stage{position:relative;width:100%;}",
    ".olw-grid{display:grid;grid-template-columns:repeat(var(--olw-desktop-columns),minmax(0,1fr));grid-auto-rows:var(--olw-row-height);width:100%;gap:0;position:relative;z-index:1}",
    ".olw-rules{position:absolute;inset:0;z-index:0;pointer-events:none;}",
    ".olw-rules-tablet,.olw-rules-mobile{display:none}",
    ".olw-cell{min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;color:inherit;text-decoration:none}",
    ".olw-logo-inner{display:flex;align-items:center;justify-content:center;max-width:85%;width:100%;height:100%;transition:transform .42s cubic-bezier(.2,.8,.2,1),opacity .3s ease;}",
    ".olw-cell[href]:hover .olw-logo-inner,.olw-cell[href]:focus-visible .olw-logo-inner{transform:translateY(-4px) scale(1.04)}",
    ".olw-cell[href]{cursor:pointer;-webkit-tap-highlight-color:transparent}",
    ".olw-cell[href]:focus-visible{outline:2px solid rgba(255,255,255,.9);outline-offset:-7px}",
    ".olw-logo-text{display:block;color:var(--olw-logo-color);white-space:nowrap;text-align:center;font-family:Inter Display,Inter,Arial,sans-serif;font-size:clamp(17px,2.5cqw,31px);font-weight:590;letter-spacing:-.05em;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis}",
    ".olw-logo-image{display:block;width:100%;height:auto;max-height:var(--olw-logo-max-height);object-fit:contain;object-position:center}",
    ".olw-cta{background:var(--olw-cta-bg);color:var(--olw-cta-color);}",
    ".olw-cta-inner{display:flex;gap:9px;align-items:center;justify-content:center;padding:10px;width:100%;max-width:100%;font-family:Inter,Arial,sans-serif;font-size:clamp(12px,1.33cqw,17px);font-weight:550;letter-spacing:-.035em;line-height:1.25;text-align:center;white-space:nowrap}",
    ".olw-cta-arrow{flex:none;transition:transform .3s ease}",
    ".olw-cta[href]:hover .olw-cta-arrow,.olw-cta[href]:focus-visible .olw-cta-arrow{transform:translate(3px,-3px)}",
    ".olw-cta[href]:focus-visible{outline:3px solid var(--olw-cta-color);outline-offset:-5px}",
    "@container (max-width:920px){.olw-grid{grid-template-columns:repeat(var(--olw-tablet-columns),minmax(0,1fr));grid-auto-rows:var(--olw-tablet-row-height)}.olw-rules-desktop{display:none}.olw-rules-tablet{display:block}.olw-logo-text{font-size:clamp(15px,2.7cqw,27px)}.olw-cta-inner{font-size:clamp(12px,1.9cqw,16px)}}",
    "@container (max-width:555px){.olw-grid{grid-template-columns:repeat(var(--olw-mobile-columns),minmax(0,1fr));grid-auto-rows:var(--olw-mobile-row-height)}.olw-rules-tablet{display:none}.olw-rules-mobile{display:block}.olw-logo-text{font-size:clamp(16px,5.8cqw,25px)}.olw-cta-inner{gap:6px;font-size:clamp(10px,3cqw,13px);padding:7px}.olw-cta-arrow{width:15px;height:15px}}",
    "@media (prefers-reduced-motion:reduce){.olw-logo-inner,.olw-cta-arrow{transition:none!important}}",
].join("\n")

function Arrow() {
    return <svg className="olw-cta-arrow" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M5 19 19 5M8 5h11v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.round(Number.isFinite(n) ? n : min)))
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 492
 */
export default function OpenLogoWall(props: Props) {
    const {
        logos = DEFAULT_LOGOS,
        visibleCount = 0,
        desktopColumns = 6,
        tabletColumns = 4,
        mobileColumns = 2,
        cellHeight = 132,
        horizontalPadding = 44,
        verticalPadding = 52,
        radius = 28,
        backgroundTop = "#0925F4",
        backgroundBottom = "#0613BE",
        logoColor = "#FFFFFF",
        lineColor = "rgba(255,255,255,.55)",
        lineThickness = 1,
        lineVariation = 55,
        logoSize = 70,
        imageMode = "white",
        ctaEnabled = true,
        ctaText = "Explore Cases",
        ctaLink = "",
        ctaBackground = "#FFFFFF",
        ctaColor = "#0925F4",
        hoverMotion = true,
        logoFont,
        ctaFont,
        style,
    } = props
    const allLogos = Array.isArray(logos) ? logos.filter(Boolean) : DEFAULT_LOGOS
    const safeLogos = visibleCount > 0 ? allLogos.slice(0, Math.round(visibleCount)) : allLogos
    const ds = clamp(desktopColumns, 2, 10)
    const ts = clamp(tabletColumns, 2, 8)
    const ms = clamp(mobileColumns, 1, 4)
    const count = safeLogos.length + (ctaEnabled ? 1 : 0)
    const [hovered, setHovered] = React.useState(-1)
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const animateHover = hoverMotion && !isStatic && !reducedMotion
    const rootStyles: React.CSSProperties = {
        width: "100%",
        height: "auto",
        minWidth: 0,
        padding: verticalPadding + "px " + horizontalPadding + "px",
        borderRadius: radius,
        background: "linear-gradient(180deg, " + backgroundTop + " 0%, " + backgroundTop + " 58%, " + backgroundBottom + " 100%)",
        color: logoColor,
        overflow: "hidden",
        "--olw-desktop-columns": ds,
        "--olw-tablet-columns": ts,
        "--olw-mobile-columns": ms,
        "--olw-row-height": Math.max(70,cellHeight) + "px",
        "--olw-tablet-row-height": Math.max(80, Math.round(cellHeight * .84)) + "px",
        "--olw-mobile-row-height": Math.max(76, Math.round(cellHeight * .76)) + "px",
        "--olw-logo-color": logoColor,
        "--olw-cta-bg": ctaBackground,
        "--olw-cta-color": ctaColor,
        "--olw-logo-max-height": logoSize + "px",
        ...style,
    } as React.CSSProperties

    function renderRules(cols: number, variant: string) {
        const rows = Math.max(1, Math.ceil(count / cols))
        const strength = Math.max(0, Math.min(1, lineVariation / 100))
        const vert = Array.from({length: cols - 1}, (_, j) => {
            const i = j + 1
            const topTrim = [2, 5, 13, 1, 9, 4, 12, 0, 7][j % 9] * strength
            const bottomTrim = [10, 2, 5, 16, 1, 11, 3, 13, 6][j % 9] * strength
            const adjacent = hovered >= 0 && (hovered % cols === i || hovered % cols === i - 1)
            return <motion.span key={"v"+j} aria-hidden="true"
                initial={false}
                animate={{ opacity: adjacent && animateHover ? 1 : .67, scaleY: adjacent && animateHover ? 1.025 : 1 }}
                transition={{duration:animateHover ? .32 : 0,ease:"easeOut"}}
                style={{position:"absolute",left:(i/cols*100)+"%",top:topTrim+"%",height:(100-topTrim-bottomTrim)+"%",width:lineThickness,marginLeft:-lineThickness/2,background:lineColor,transformOrigin:"center"}}/>
        })
        const hor = Array.from({length:Math.max(0,rows - 1)}, (_, j) => {
            const i = j + 1
            const leftTrim = [5, 12, 2, 16, 7, 0, 11][j % 7] * strength
            const rightTrim = [6, 19, 8, 3, 16, 9, 0][j % 7] * strength
            const adjacent = hovered >= 0 && (Math.floor(hovered/cols)===i || Math.floor(hovered/cols)===i-1)
            return <motion.span key={"h"+j} aria-hidden="true"
                initial={false}
                animate={{opacity:adjacent && animateHover ? 1 : .67,scaleX:adjacent && animateHover ? 1.015 : 1}}
                transition={{duration:animateHover ? .32 : 0,ease:"easeOut"}}
                style={{position:"absolute",top:(i/rows*100)+"%",left:leftTrim+"%",width:(100-leftTrim-rightTrim)+"%",height:lineThickness,marginTop:-lineThickness/2,background:lineColor,transformOrigin:"center"}}/>
        })
        return <div key={variant} className={"olw-rules olw-rules-"+variant} aria-hidden="true">{vert}{hor}</div>
    }

    const imageFilter = imageMode === "white" ? "brightness(0) invert(1)" : "none"
    return <div className="olw-root" style={rootStyles}>
        <style>{CSS}</style>
        <div className="olw-stage">
            {renderRules(ds,"desktop")}
            {renderRules(ts,"tablet")}
            {renderRules(ms,"mobile")}
            <div className="olw-grid" aria-label="Client and partner logos">
                {safeLogos.map((logo,index)=>{
                    const link = typeof logo.link === "string" ? logo.link.trim() : ""
                    const inner = <span className="olw-logo-inner" style={{maxWidth:Math.max(30,Math.min(100,logoSize))+"%"}}>
                        {logo.image?.src
                            ? <img className="olw-logo-image" src={logo.image.src} srcSet={logo.image.srcSet} alt={logo.image.alt || logo.name} draggable={false} style={{filter:imageFilter}}/>
                            : <span className="olw-logo-text" style={{fontWeight:index%5===1 ? 490 : index%5===3 ? 670 : 590,letterSpacing:index%5===1 ? ".065em" : "-.05em",...logoFont}}>{logo.name}</span>}
                    </span>
                    const extra={onMouseEnter:()=>setHovered(index),onMouseLeave:()=>setHovered(-1)}
                    return link
                        ? <a key={index} className="olw-cell" href={link} target="_blank" rel="noopener noreferrer" aria-label={"Visit "+logo.name} {...extra}>{inner}</a>
                        : <div key={index} className="olw-cell" {...extra}>{inner}</div>
                })}
                {ctaEnabled && (
                    ctaLink && ctaLink.trim()
                        ? <a className="olw-cell olw-cta" href={ctaLink.trim()} target="_blank" rel="noopener noreferrer" aria-label={ctaText}  onMouseEnter={()=>setHovered(safeLogos.length)} onMouseLeave={()=>setHovered(-1)}>
                            <span className="olw-cta-inner" style={ctaFont}>{ctaText}<Arrow/></span>
                        </a>
                        : <div className="olw-cell olw-cta" >
                            <span className="olw-cta-inner" style={ctaFont}>{ctaText}</span>
                        </div>
                )}
            </div>
        </div>
    </div>
}

OpenLogoWall.defaultProps = {
    logos:DEFAULT_LOGOS,visibleCount:0,desktopColumns:6,tabletColumns:4,mobileColumns:2,
    cellHeight:132,horizontalPadding:44,verticalPadding:52,radius:28,
    backgroundTop:"#0925F4",backgroundBottom:"#0613BE",
    logoColor:"#FFFFFF",lineColor:"rgba(255,255,255,.55)",lineThickness:1,
    lineVariation:55,logoSize:70,imageMode:"white",ctaEnabled:true,
    ctaText:"Explore Cases",ctaLink:"",ctaBackground:"#FFFFFF",
    ctaColor:"#0925F4",hoverMotion:true,
}

addPropertyControls(OpenLogoWall,{
    logos:{
        type:ControlType.Array,title:"Logos",maxCount:48,defaultValue:DEFAULT_LOGOS,
        control:{type:ControlType.Object,controls:{
            name:{type:ControlType.String,title:"Name",defaultValue:"Client"},
            image:{type:ControlType.ResponsiveImage,title:"Logo Image"},
            link:{type:ControlType.Link,title:"Link",defaultValue:""},
        }},
    },
    visibleCount:{type:ControlType.Number,title:"Logo Limit",min:0,max:48,step:1,defaultValue:0,displayStepper:true},
    desktopColumns:{type:ControlType.Number,title:"Desktop Cols",min:2,max:10,step:1,defaultValue:6,displayStepper:true},
    tabletColumns:{type:ControlType.Number,title:"Tablet Cols",min:2,max:8,step:1,defaultValue:4,displayStepper:true},
    mobileColumns:{type:ControlType.Number,title:"Mobile Cols",min:1,max:4,step:1,defaultValue:2,displayStepper:true},
    cellHeight:{type:ControlType.Number,title:"Cell Height",min:70,max:260,step:2,defaultValue:132,unit:"px"},
    horizontalPadding:{type:ControlType.Number,title:"Side Padding",min:0,max:130,step:2,defaultValue:44,unit:"px"},
    verticalPadding:{type:ControlType.Number,title:"Top / Bottom",min:0,max:140,step:2,defaultValue:52,unit:"px"},
    radius:{type:ControlType.Number,title:"Outer Radius",min:0,max:60,step:1,defaultValue:28,unit:"px"},
    backgroundTop:{type:ControlType.Color,title:"Blue Top",defaultValue:"#0925F4"},
    backgroundBottom:{type:ControlType.Color,title:"Blue Bottom",defaultValue:"#0613BE"},
    logoColor:{type:ControlType.Color,title:"Logo Color",defaultValue:"#FFFFFF"},
    logoSize:{type:ControlType.Number,title:"Logo Size",min:30,max:100,step:1,defaultValue:70,unit:"%"},
    imageMode:{type:ControlType.Enum,title:"Image Tint",options:["white","original"],optionTitles:["White","Original"],defaultValue:"white"},
    lineColor:{type:ControlType.Color,title:"Dividers",defaultValue:"rgba(255,255,255,.55)"},
    lineThickness:{type:ControlType.Number,title:"Line Width",min:.5,max:3,step:.5,defaultValue:1,unit:"px"},
    lineVariation:{type:ControlType.Number,title:"Open Ends",min:0,max:100,step:5,defaultValue:55,unit:"%"},
    ctaEnabled:{type:ControlType.Boolean,title:"Show CTA",defaultValue:true},
    ctaText:{type:ControlType.String,title:"CTA Label",defaultValue:"Explore Cases",hidden:p=>!p.ctaEnabled},
    ctaLink:{type:ControlType.Link,title:"CTA Link",defaultValue:"",hidden:p=>!p.ctaEnabled},
    ctaBackground:{type:ControlType.Color,title:"CTA Fill",defaultValue:"#FFFFFF",hidden:p=>!p.ctaEnabled},
    ctaColor:{type:ControlType.Color,title:"CTA Text",defaultValue:"#0925F4",hidden:p=>!p.ctaEnabled},
    hoverMotion:{type:ControlType.Boolean,title:"Line Hover",defaultValue:true},
    logoFont:{type:ControlType.Font,title:"Logo Font",controls:"extended"},
    ctaFont:{type:ControlType.Font,title:"CTA Font",controls:"extended"},
})
