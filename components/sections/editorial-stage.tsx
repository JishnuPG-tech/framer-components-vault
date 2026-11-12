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

type ImageValue = { src?: string; srcSet?: string; alt?: string }
type Story = {
    title: string
    shortTitle: string
    category: string
    description: string
    image?: ImageValue
    color: string
    textColor: string
    cta: string
    link: string
}
type Props = {
    stories: Story[]
    defaultIndex: number
    stageHeight: number
    panelPadding: number
    radius: number
    navGap: number
    imageZoom: number
    duration: number
    background: string
    neutral: string
    showNumbers: boolean
    headingFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_STORIES: Story[] = [
    {
        title: "MAKE IT BOLD.", shortTitle: "BOLD",
        category: "Creative direction / 01",
        description: "A little color can change everything. Give your next idea a website that refuses to blend in.",
        image: { src: "https://images.unsplash.com/photo-1600778094833-4d4c888b818d?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200", alt: "Fashion portrait in cobalt blue against vibrant orange" },
        color: "#FF6443", textColor: "#171615", cta: "Start Creating", link: "",
    },
    {
        title: "IN FULL BLOOM.", shortTitle: "BLOOM",
        category: "Visual stories / 02",
        description: "Fresh perspectives deserve an equally fresh stage. Let your creative work take up some space.",
        image: { src: "https://images.unsplash.com/photo-1414872809883-7620d2ae7566?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200", alt: "Vivid red poppy in full bloom" },
        color: "#DFFF63", textColor: "#171615", cta: "Get Started", link: "",
    },
    {
        title: "STAY CURIOUS.", shortTitle: "CURIOUS",
        category: "Art & objects / 03",
        description: "Unusual details, unexpected pairings and a digital home for every new experiment.",
        image: { src: "https://images.unsplash.com/photo-1647998943297-68da542bd43b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200", alt: "Abstract pink and violet sculptural object" },
        color: "#D4AEF7", textColor: "#171615", cta: "Make It Yours", link: "",
    },
    {
        title: "BREAK THE MOLD.", shortTitle: "MOLD",
        category: "Fashion & culture / 04",
        description: "A bold idea needs room to move. Build a visual world with a point of view of its own.",
        image: { src: "https://images.unsplash.com/photo-1762327164569-45ae182e6b0a?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200", alt: "Fashion portrait with bright orange and blue color" },
        color: "#3655E9", textColor: "#FFFFFF", cta: "Start Creating", link: "",
    },
]

function Arrow({ size = 20 }: { size?: number }) {
    return (
        <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M4.5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

function padded(i: number) { return String(i + 1).padStart(2, "0") }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)) }

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1140
 * @framerIntrinsicHeight 650
 */
export default function EditorialColorStage(props: Props) {
    const {
        stories = DEFAULT_STORIES, defaultIndex = 0, stageHeight = 552, panelPadding = 52,
        radius = 8, navGap = 8, imageZoom = 1.035, duration = 0.58,
        background = "#F5F4F0", neutral = "#FFFFFF", showNumbers = true,
        headingFont, bodyFont, labelFont, style,
    } = props
    const list = Array.isArray(stories) && stories.length ? stories : DEFAULT_STORIES
    const [active, setActive] = React.useState(() => clamp(Math.round(defaultIndex), 0, list.length - 1))
    const [previous, setPrevious] = React.useState(() => clamp(Math.round(defaultIndex), 0, list.length - 1))
    const [visited, setVisited] = React.useState(false)
    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    const noMotion = isStatic || prefersReduced
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const scope = "ecs-" + uid
    const item = list[clamp(active, 0, list.length - 1)]
    const oldItem = list[clamp(previous, 0, list.length - 1)]
    const time = clamp(duration, 0.1, 1.6)
    const reveal = !noMotion && visited && previous !== active
    const picture = item.image?.src || ""
    const canNavigate = Boolean(item.link && item.link.trim())
    const photoLabel = (item.title || "Editorial") + (canNavigate ? ", open link in a new tab" : "")
    const fontHeading: React.CSSProperties = {
        fontFamily: "Inter, Arial, sans-serif", fontWeight: 800,
        letterSpacing: "-0.075em", lineHeight: 0.90, ...headingFont,
    }
    const fontBody: React.CSSProperties = {
        fontFamily: "Inter, Arial, sans-serif", fontSize: 15, fontWeight: 400,
        lineHeight: 1.48, letterSpacing: "-0.015em", ...bodyFont,
    }
    const fontLabel: React.CSSProperties = {
        fontFamily: "Inter, Arial, sans-serif", fontSize: 11, fontWeight: 600,
        letterSpacing: "0.055em", lineHeight: 1.25, ...labelFont,
    }

    React.useEffect(() => {
        const next = clamp(Math.round(defaultIndex), 0, list.length - 1)
        setActive(next); setPrevious(next); setVisited(false)
    }, [defaultIndex, list.length])
    const select = React.useCallback((i: number) => {
        if (i === active || i < 0 || i >= list.length) return
        setPrevious(active); setActive(i); setVisited(true)
    }, [active, list.length])
    const onIndexKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
        e.preventDefault()
        const next = (active + (e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length
        select(next)
        const targets = e.currentTarget.querySelectorAll<HTMLElement>(".ecs-tab")
        targets[next]?.focus()
    }

    const css = [
        "." + scope + " { box-sizing:border-box; container-type:inline-size; container-name:editorial-color-stage; }",
        "." + scope + " * { box-sizing:border-box; }",
        "." + scope + " .ecs-stage { display:grid; grid-template-columns:minmax(0,44%) minmax(0,56%); width:100%; overflow:hidden; }",
        "." + scope + " .ecs-copy { grid-column:1;grid-row:1;display:flex;flex-direction:column;min-width:0; }",
        "." + scope + " .ecs-visual { grid-column:2;grid-row:1;position:relative;min-width:0;overflow:hidden; }",
        "." + scope + " .ecs-title { margin:0; font-size:clamp(48px,7.3cqw,106px); overflow-wrap:normal; text-wrap:balance; }",
        "." + scope + " .ecs-link { text-decoration:none;color:inherit; }",
        "." + scope + " .ecs-link:focus-visible, ." + scope + " .ecs-tab:focus-visible { outline:3px solid currentColor;outline-offset:-5px; }",
        "." + scope + " .ecs-photo { position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block; }",
        "." + scope + " .ecs-tabs { display:grid;grid-template-columns:repeat(" + list.length + ",minmax(0,1fr)); }",
        "." + scope + " .ecs-tab-short {display:none;}",
        "." + scope + " .ecs-tab { min-width:0;border:0;appearance:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;text-decoration:none;font-family:inherit;transition:background-color .25s ease,color .25s ease; }",
        "." + scope + " .ecs-tab:hover { filter:brightness(.97) }",
        "." + scope + " button.ecs-tab[data-active=true] { cursor:default; }",
        "@container editorial-color-stage (max-width: 980px) {",
        "  ." + scope + " .ecs-tab-long {display:none;}",
        "  ." + scope + " .ecs-tab-short {display:block;}",
        "}",
        "@container editorial-color-stage (max-width: 770px) {",
        "  ." + scope + " .ecs-stage { grid-template-columns: 1fr;grid-template-rows: 340px auto; }",
        "  ." + scope + " .ecs-visual { grid-column:1;grid-row:1;min-height:340px; }",
        "  ." + scope + " .ecs-copy { grid-column:1;grid-row:2;min-height:350px; }",
        "  ." + scope + " .ecs-title { font-size:clamp(48px,10.5cqw,84px); }",
        "  ." + scope + " .ecs-tabs { grid-template-columns:repeat(2,minmax(0,1fr)); }",
        "}",
        "@container editorial-color-stage (max-width: 450px) {",
        "  ." + scope + " .ecs-stage { grid-template-rows: 300px auto; }",
        "  ." + scope + " .ecs-visual { min-height:300px; }",
        "  ." + scope + " .ecs-copy { min-height:320px; }",
        "  ." + scope + " .ecs-title { font-size:clamp(42px,11.6cqw,64px); }",
        "  ." + scope + " .ecs-tab-long {display:none;}",
        "  ." + scope + " .ecs-tab-short {display:block;}",
        "}",
        "@media (prefers-reduced-motion:reduce) { ." + scope + " .ecs-tab { transition:none !important; } }",
    ].join("\n")

    const titleAndText = (
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",maxWidth:"100%",gap:18}}>
            <div style={{...fontLabel,opacity:0.75,textTransform:"uppercase"}}>{item.category}</div>
            <h2 className="ecs-title" style={fontHeading}>{item.title}</h2>
            <p style={{...fontBody,maxWidth:320,margin:"2px 0 0",opacity:0.78}}>{item.description}</p>
            {canNavigate && (
                <div style={{display:"flex",gap:15,alignItems:"center",marginTop:7,paddingBottom:5,borderBottom:"1px solid currentColor"}}>
                    <span style={{...fontLabel,fontSize:12,letterSpacing:"0.015em"}}>{item.cta || "Discover More"}</span>
                    <Arrow size={17}/>
                </div>
            )}
        </div>
    )

    return (
        <div className={scope} style={{...style,width:"100%",height:"auto",minWidth:0,background,padding:0}}>
            <style>{css}</style>
            <div className="ecs-stage" style={{
                minHeight:Math.max(400,stageHeight),borderRadius:radius,background:item.color,
            }}>
                <motion.section className="ecs-copy"
                    initial={false}
                    animate={{backgroundColor:item.color,color:item.textColor}}
                    transition={{duration:noMotion?0:time,ease:[0.22,1,0.36,1]}}
                    style={{padding:Math.max(20,panelPadding),justifyContent:"space-between",gap:38}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                        <div style={{...fontLabel,textTransform:"uppercase"}}>THE COLOR EDIT / VOL. 01</div>
                        <div style={{...fontLabel,opacity:0.66}}>{padded(active)} / {String(list.length).padStart(2,"0")}</div>
                    </div>
                    {canNavigate ? (
                        <a className="ecs-link" href={item.link} target="_blank" rel="noopener noreferrer"
                            aria-label={item.title + " — " + (item.cta || "Discover More")}
                            style={{display:"block",flex:1,alignContent:"end",minWidth:0}}>
                            <motion.div key={active} initial={reveal?{opacity:0,y:19}:false}
                                animate={{opacity:1,y:0}} transition={{duration:noMotion?0:time*0.8,ease:[0.22,1,0.36,1]}}>
                                {titleAndText}
                            </motion.div>
                        </a>
                    ) : (
                        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                            <motion.div key={active} initial={reveal?{opacity:0,y:19}:false}
                                animate={{opacity:1,y:0}} transition={{duration:noMotion?0:time*0.8,ease:[0.22,1,0.36,1]}}>
                                {titleAndText}
                            </motion.div>
                        </div>
                    )}
                </motion.section>
                <div className="ecs-visual" style={{backgroundColor:item.color}}>
                    {oldItem.image?.src && reveal && (
                        <img className="ecs-photo" src={oldItem.image.src} alt="" aria-hidden="true" style={{objectPosition:"center"}} draggable={false}/>
                    )}
                    {picture ? (
                        <motion.img key={active + "-" + picture} className="ecs-photo"
                            src={picture} srcSet={item.image?.srcSet} alt={canNavigate ? "" : item.image?.alt || item.title}
                            draggable={false} initial={reveal?{clipPath:"inset(0 100% 0 0)",scale:imageZoom}:{clipPath:"inset(0 0% 0 0)",scale:1}}
                            animate={{clipPath:"inset(0 0% 0 0)",scale:1}}
                            transition={{duration:noMotion?0:time,ease:[0.22,1,0.36,1]}}
                        />
                    ) : (
                        <div style={{position:"absolute",inset:0,background:"linear-gradient(140deg,rgba(255,255,255,.22),rgba(0,0,0,.13))"}} />
                    )}
                    {canNavigate ? (
                        <a className="ecs-link" href={item.link} target="_blank" rel="noopener noreferrer"
                            aria-label={photoLabel}
                            style={{position:"absolute",inset:0,display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:25}}>
                            <div style={{width:48,height:48,borderRadius:99,background:"#FFFFFF",color:"#141414",display:"grid",placeItems:"center",boxShadow:"0 8px 24px rgba(0,0,0,.12)"}}>
                                <Arrow/>
                            </div>
                        </a>
                    ) : null}
                    <div aria-hidden="true" style={{position:"absolute",top:24,left:24,borderRadius:99,padding:"9px 12px",background:"rgba(255,255,255,.96)",color:"#111",...fontLabel,fontSize:10}}>
                        EDITORIAL / {padded(active)}
                    </div>
                </div>
            </div>
            <div className="ecs-tabs" role="group" aria-label="Choose an editorial story" onKeyDown={onIndexKey}
                style={{gap:Math.max(0,navGap),marginTop:Math.max(0,navGap)}}>
                {list.map((story,i)=>{
                    const hasLink = Boolean(story.link && story.link.trim())
                    const shared = {
                        key:i, className:"ecs-tab", "data-active":active===i,
                        onMouseEnter:()=>{ if(!isStatic) select(i) },
                        style:{
                            background:active===i?story.color:neutral,
                            color:active===i?story.textColor:"#191919",
                            minHeight:68,padding:"13px 18px",borderRadius:Math.min(6,radius),
                        } as React.CSSProperties,
                    }
                    const content = (
                        <>
                            <span style={{display:"flex",gap:11,minWidth:0,alignItems:"center"}}>
                                {showNumbers && <span style={{...fontLabel,opacity:0.55,flexShrink:0}}>{padded(i)}</span>}
                                <span className="ecs-tab-long" style={{...fontLabel,letterSpacing:"-0.01em",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{story.title}</span>
                                <span className="ecs-tab-short" style={{...fontLabel,letterSpacing:"-0.01em",fontSize:12,whiteSpace:"nowrap"}}>{story.shortTitle || story.title}</span>
                            </span>
                            <span aria-hidden="true" style={{fontSize:17,flexShrink:0,opacity:active===i?1:0.45}}>↗</span>
                        </>
                    )
                    return hasLink ? (
                        <a {...shared} href={story.link} target="_blank" rel="noopener noreferrer"
                           aria-label={story.title + " — open in a new tab"}
                           aria-current={active===i ? "true" : undefined}>
                            {content}
                        </a>
                    ) : (
                        <button {...shared} type="button" aria-pressed={active===i}
                           aria-label={"Show " + story.title} onClick={()=>select(i)}>
                            {content}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(EditorialColorStage, {
    stories: {
        type:ControlType.Array,title:"Editorial Stories",
        maxCount:8,
        control:{type:ControlType.Object,controls:{
            title:{type:ControlType.String,title:"Headline",defaultValue:"A BOLD IDEA."},
            shortTitle:{type:ControlType.String,title:"Short Label",defaultValue:"BOLD"},
            category:{type:ControlType.String,title:"Category",defaultValue:"Creative direction"},
            description:{type:ControlType.String,title:"Description",displayTextArea:true,defaultValue:"A fresh way to show your story."},
            image:{type:ControlType.ResponsiveImage,title:"Editorial Image"},
            color:{type:ControlType.Color,title:"Panel Color",defaultValue:"#FF6443"},
            textColor:{type:ControlType.Color,title:"Text Color",defaultValue:"#171615"},
            cta:{type:ControlType.String,title:"CTA Text",defaultValue:"Start Creating"},
            link:{type:ControlType.Link,title:"Link",defaultValue:""},
        }},
        defaultValue:DEFAULT_STORIES,
    },
    defaultIndex:{type:ControlType.Number,title:"Start At",min:0,max:7,step:1,defaultValue:0},
    stageHeight:{type:ControlType.Number,title:"Stage Height",min:400,max:800,step:10,defaultValue:552,unit:"px"},
    panelPadding:{type:ControlType.Number,title:"Panel Padding",min:20,max:90,step:2,defaultValue:52,unit:"px"},
    radius:{type:ControlType.Number,title:"Radius",min:0,max:36,step:1,defaultValue:8,unit:"px"},
    navGap:{type:ControlType.Number,title:"Nav Gap",min:0,max:24,step:1,defaultValue:8,unit:"px"},
    imageZoom:{type:ControlType.Number,title:"Wipe Zoom",min:1,max:1.2,step:0.005,defaultValue:1.035},
    duration:{type:ControlType.Number,title:"Wipe Duration",min:0.1,max:1.6,step:0.05,defaultValue:0.58,unit:"s"},
    background:{type:ControlType.Color,title:"Background",defaultValue:"#F5F4F0"},
    neutral:{type:ControlType.Color,title:"Inactive Tabs",defaultValue:"#FFFFFF"},
    showNumbers:{type:ControlType.Boolean,title:"Show Numbers",defaultValue:true},
    headingFont:{type:ControlType.Font,title:"Headline Font",controls:"extended"},
    bodyFont:{type:ControlType.Font,title:"Body Font",controls:"extended"},
    labelFont:{type:ControlType.Font,title:"Label Font",controls:"extended"},
})