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

import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion"

interface Props {
    idleMotion: boolean
    idleSpeed: number
    idleStrength: number
    hoverEnabled: boolean
    hoverStrength: number
    hoverLift: number
    hoverDuration: number
    spotlight: boolean
    spotStrength: number
    spotSize: number
    pressEnabled: boolean
    pressScale: number
    pressDuration: number
    secondary: string
    eyeColor: string
    pupilColor: string
    visorColor: string
    followSpeed: number
    followDamping: number
    rimStrength: number
    glowSize: number
    contentGap: number
    label: string
    link: string
    newTab: boolean
    appearance: "Obsidian" | "Pearl" | "Custom"
    surface: string
    textColor: string
    accent: string
    radius: string
    padding: string
    font: React.CSSProperties
    lensSize: number
    tracking: boolean
    followStrength: number
    pixels: boolean
    glow: number
    speed: number
    disabled: boolean
    accessibleLabel: string
    onTap?: () => void
    style?: React.CSSProperties
}

const css = `
.ds-iris-button { -webkit-tap-highlight-color:transparent; }
.ds-iris-button:focus-visible { outline:2px solid var(--iris-focus); outline-offset:5px; }
.ds-iris-button:focus:not(:focus-visible) { outline:none; }
@keyframes ds-iris-orbit { from {transform:rotate(0deg)} to {transform:rotate(360deg)} }
@media (prefers-reduced-motion:reduce) { .ds-iris-beam {animation:none!important;} }
`

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 224
 * @framerIntrinsicHeight 64
 * @framerDisableUnlink
 */
export default function EyeGlowButton(props: Props) {
    const {
        idleMotion = true,
        idleSpeed = 12,
        idleStrength = 0.55,
        hoverEnabled = true,
        hoverStrength = 0.92,
        hoverLift = 1,
        hoverDuration = 0.3,
        spotlight = true,
        spotStrength = 1,
        spotSize = 180,
        pressEnabled = true,
        pressScale = 0.98,
        pressDuration = 0.14,
        secondary = "#AD99CF",
        eyeColor = "#E7EAE6",
        pupilColor = "#161B21",
        visorColor = "#12171E",
        followSpeed = 260,
        followDamping = 28,
        rimStrength = 0.48,
        glowSize = 20,
        contentGap = 22,
        label = "Explore more", link = "", newTab = false,
        appearance = "Obsidian", surface = "#16191F", textColor = "#F3F5F7",
        accent = "#A9D7F5", radius = "999px", padding = "10px 12px 10px 24px",
        font = {fontFamily:"Inter, sans-serif",fontSize:15,fontWeight:500,letterSpacing:"-0.02em",lineHeight:"1.3em"},
        lensSize = 36, tracking = true, followStrength = 1, pixels = false, glow = 0.35, speed = 4,
        disabled = false, accessibleLabel = "", onTap, style,
    } = props
    const eyeClip = React.useId().replace(/:/g, "") + "-eye-clip"
    const root = React.useRef<HTMLAnchorElement | HTMLButtonElement>(null)
    const lens = React.useRef<HTMLSpanElement>(null)
    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion()
    const [hover, setHover] = React.useState(false)
    const [focus, setFocus] = React.useState(false)
    const [pressed, setPressed] = React.useState(false)
    const [inView, setInView] = React.useState(true)
    const x = useMotionValue(0), y = useMotionValue(0)
    const sx = useSpring(x, {stiffness:followSpeed, damping:followDamping}), sy = useSpring(y, {stiffness:followSpeed, damping:followDamping})
    const lightX = useMotionValue(0), lightY = useMotionValue(0)
    const lightSX = useSpring(lightX, {stiffness:200,damping:30}), lightSY = useSpring(lightY, {stiffness:200,damping:30})
    const centerLight = () => {lightX.set(0);lightY.set(0)}
    const isLink = Boolean(link) && !disabled
    const active = !disabled && hoverEnabled && (hover || focus || pressed)
    const animate = !isStatic && !reduced && inView && !disabled
    const pearl = appearance === "Pearl"
    const bg = appearance === "Custom" ? surface : pearl ? "#EAECEE" : "#171B21"
    const fg = appearance === "Custom" ? textColor : pearl ? "#242B34" : "#F3F5F7"
    const edge = pearl ? "rgba(34,45,60,.22)" : "rgba(255,255,255,.16)"
    const duration = reduced || isStatic ? 0 : hoverDuration

    React.useEffect(() => {
        if (!root.current || isStatic) return
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
        observer.observe(root.current)
        return () => observer.disconnect()
    }, [isStatic,isLink])

    React.useEffect(() => {
        if (!animate) { x.set(0); y.set(0); lightX.set(0); lightY.set(0); return }
        if (!tracking) {x.set(0);y.set(0)}
        let frame = 0, px = 0, py = 0
        const update = () => {
            frame = 0
            const r = lens.current?.getBoundingClientRect()
            const b = root.current?.getBoundingClientRect()
            if (!r || !b) return
            // One listener, independent light and gaze; no React renders on pointer movement.
            lightX.set(Math.max(-b.width/2,Math.min(b.width/2,px-b.left-b.width/2)))
            lightY.set(Math.max(-b.height/2,Math.min(b.height/2,py-b.top-b.height/2)))
            if (tracking) {
                const dx = px-r.left-r.width/2, dy = py-r.top-r.height/2
                x.set(Math.tanh(dx/115) * 3 * followStrength)
                y.set(Math.tanh(dy/140) * 2.8 * followStrength)
            }
        }
        const move = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            px=e.clientX; py=e.clientY
            if (!frame) frame=requestAnimationFrame(update)
        }
        const reset = () => {if(frame)cancelAnimationFrame(frame);frame=0;x.set(0);y.set(0);lightX.set(0);lightY.set(0);setPressed(false);setHover(false)}
        window.addEventListener("pointermove",move,{passive:true})
        window.addEventListener("blur",reset)
        document.documentElement.addEventListener("pointerleave",reset)
        return () => {window.removeEventListener("pointermove",move);window.removeEventListener("blur",reset);document.documentElement.removeEventListener("pointerleave",reset);cancelAnimationFrame(frame)}
    }, [tracking,animate,lensSize,followStrength,x,y,lightX,lightY])

    React.useEffect(() => {if(disabled){setHover(false);setFocus(false);setPressed(false)}},[disabled])
    const Tag: any = isLink ? "a" : "button"
    const decor: React.CSSProperties = {position:"absolute",inset:0,borderRadius:"inherit",pointerEvents:"none"}
    const beam: React.CSSProperties = {
        position:"absolute",width:"180%",aspectRatio:"1",left:"-40%",top:"50%",marginTop:"-90%",
        background:`conic-gradient(from 90deg,transparent 0deg,transparent 240deg,${accent} 300deg,#FFFFFF 326deg,transparent 345deg)`,
        animation:`ds-iris-orbit ${speed}s linear infinite`,animationPlayState:animate&&active?"running":"paused",
    }
    return <Tag ref={root} className="ds-iris-button" href={link && !disabled ? link : undefined}
        target={link && newTab && !disabled ? "_blank" : undefined} rel={link && newTab ? "noopener noreferrer" : undefined}
        type={Tag==="button"?"button":undefined} disabled={Tag==="button"?disabled:undefined}
        aria-label={accessibleLabel || label || "Explore more"} aria-disabled={disabled || undefined}
        onPointerEnter={(e: React.PointerEvent) => {if(e.pointerType!=="touch"&&!disabled)setHover(true)}}
        onPointerLeave={() => {setHover(false);setPressed(false)}}
        onPointerDown={(e: React.PointerEvent) => {if(!disabled&&e.button===0){if(e.pointerType==="touch")centerLight();setPressed(true)}}}
        onPointerUp={() => setPressed(false)} onPointerCancel={() => {setPressed(false);setHover(false)}}
        onFocus={(e: React.FocusEvent<HTMLElement>) => {const visible=e.currentTarget.matches(":focus-visible");setFocus(visible);if(visible)centerLight()}}
        onBlur={() => {setFocus(false);setPressed(false)}}
        onKeyDown={(e: React.KeyboardEvent) => {if(!disabled&&(e.key==="Enter"||(Tag==="button"&&e.key===" ")))setPressed(true)}}
        onKeyUp={() => setPressed(false)} onClick={() => {setPressed(false);if(!disabled)onTap?.()}}
        style={{
            position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"space-between",gap:contentGap,
            padding,borderRadius:radius,border:`1px solid ${edge}`,background:bg,color:fg,
            boxSizing:"border-box",textDecoration:"none",cursor:disabled?"not-allowed":"pointer",
            appearance:"none",userSelect:"none",isolation:"isolate",minHeight:44,
            boxShadow:pearl
                ? `0 ${active?6:3}px ${active?16:8}px #111C2D18,inset 0 1px 0 #FFFFFF,inset 0 -1px 0 #6A768312`
                : `0 2px 3px #00000050,0 ${active?12:6}px ${active?28:18}px #00000040,inset 0 1px 0 #FFFFFF22,inset 0 -1px 0 #00000055`,
            fontFamily:"Inter, sans-serif",fontSize:15,fontWeight:500,letterSpacing:"-0.02em",lineHeight:"1.3em",...font,...style,"--iris-accent":accent,"--iris-focus":pearl?"#315979":accent,opacity:disabled?0.45:style?.opacity,
            transform:pressed&&pressEnabled&&!reduced?`${style?.transform && style.transform !== "none" ? style.transform : ""} scale(${pressScale})`:style?.transform,
            transition:reduced?"none":`transform ${pressDuration}s ease, opacity 180ms ease, box-shadow ${duration}s ease`,
        } as React.CSSProperties}>
        <style>{css}</style>
        <span aria-hidden="true" data-iris-idle-rim="" style={{...decor,padding:1,zIndex:0,
            background:`linear-gradient(115deg,${accent} 0%,${secondary} 25%,rgba(255,255,255,.12) 47%,${secondary} 72%,${accent} 100%)`,
            opacity:rimStrength*(active?1.25:1),transition:`opacity ${duration}s ease`,
            WebkitMask:"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",WebkitMaskComposite:"xor",maskComposite:"exclude"}}/>
        <span aria-hidden="true" style={{...decor,inset:-2,zIndex:-1,
            background:`linear-gradient(115deg,${accent},transparent 40%,${secondary} 75%,${accent})`,
            filter:"blur(9px)",opacity:glow*(active?0.24:0.16),transition:`opacity ${duration}s ease`}}/>
        <span aria-hidden="true" data-iris-idle-orbit="" style={{...decor,overflow:"hidden",opacity:idleMotion?(active?idleStrength*0.3:idleStrength):0,transition:`opacity ${duration}s ease`,zIndex:0,
            padding:1,WebkitMask:"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",WebkitMaskComposite:"xor",maskComposite:"exclude"}}>
            <span className="ds-iris-beam" data-iris-idle-beam="" style={{...beam,
                background:`conic-gradient(from 90deg,transparent 0deg,${secondary} 110deg,transparent 180deg,transparent 240deg,${accent} 300deg,#FFFFFF 326deg,transparent 350deg)`,
                animationDuration:`${idleSpeed}s`,animationPlayState:animate&&idleMotion?"running":"paused"}}/>
        </span>
        <span aria-hidden="true" style={{...decor,overflow:"hidden",opacity:active?hoverStrength:0,transition:`opacity ${duration}s ease`,zIndex:0,
            padding:1,WebkitMask:"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",WebkitMaskComposite:"xor",maskComposite:"exclude"}}>
            <span className="ds-iris-beam" style={beam}/>
        </span>
        <span aria-hidden="true" style={{...decor,boxShadow:`0 0 ${glowSize}px 1px ${accent}`,opacity:active?glow*0.55:glow*0.12,transition:`opacity ${duration}s ease`,zIndex:-1}}/>
        <span aria-hidden="true" style={{...decor,background:pearl?"linear-gradient(170deg,#FFFFFF80,transparent 52%,#6874850A)":"linear-gradient(165deg,#FFFFFF14 0%,#FFFFFF03 43%,transparent 55%,#00000028 100%)",zIndex:0}}/>
        <span aria-hidden="true" style={{...decor,overflow:"hidden",zIndex:1}}>
            {[0,1,2].map(i=><motion.span key={i} data-iris-pixel="" initial={false}
                animate={{x:active&&animate&&pixels?[0,28,56]:0,opacity:active&&animate&&pixels?[0,0.8,0]:0}}
                transition={{duration:0.65,delay:i*0.045,times:[0,0.4,1],ease:[0.22,1,0.36,1]}}
                style={{position:"absolute",left:"55%",bottom:0,width:3,height:2,borderRadius:0.5,background:accent}}/>)}
        </span>

        <span aria-hidden="true" style={{...decor,overflow:"hidden",zIndex:0}}>
            <motion.span data-iris-spotlight="" initial={false} animate={{opacity:active&&spotlight?spotStrength:0}}
                transition={{duration}}
                style={{position:"absolute",left:"50%",top:"50%",marginLeft:-spotSize/2,marginTop:-spotSize*5/12,width:spotSize,height:spotSize*5/6,
                    x:animate?lightSX:0,y:animate?lightSY:0,pointerEvents:"none",
                    background:pearl?"radial-gradient(ellipse,rgba(255,255,255,.75),transparent 72%)":"radial-gradient(ellipse,rgba(220,235,250,.14),transparent 72%)"}}/>
        </span>
        <span aria-hidden="true" style={{...decor,inset:1,zIndex:0,
            background:"linear-gradient(110deg,transparent 13%,rgba(255,255,255,.28) 34%,rgba(255,255,255,.04) 66%,transparent 84%)",
            padding:1,opacity:pearl?0.65:0.42,WebkitMask:"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",WebkitMaskComposite:"xor",maskComposite:"exclude"}}/>
        <span style={{position:"relative",zIndex:1,minWidth:0,overflowWrap:"anywhere",textAlign:"left",flex:"1 1 auto"}}>{label || "Explore more"}</span>
        <motion.span ref={lens} aria-hidden="true" data-iris-visor="" initial={false}
            animate={{y:active&&animate?-hoverLift:0}} transition={{duration:animate?duration:0,ease:[0.22,1,0.36,1]}}
            style={{position:"relative",flex:"0 0 auto",width:lensSize*1.5,height:lensSize,borderRadius:999,display:"grid",placeItems:"center",
            background:visorColor,
            boxShadow:active?"inset 0 1px 4px #00000070,inset 0 -1px 0 #FFFFFF12,0 2px 5px #00000038":"inset 0 1px 4px #00000090,0 1px 0 #FFFFFF14",
            border:`1px solid ${active?"rgba(190,214,237,.34)":pearl?"rgba(24,36,50,.38)":"rgba(255,255,255,.2)"}`,zIndex:1,
            transition:`border-color ${duration}s ease,box-shadow ${duration}s ease`}}>
            <span style={{position:"absolute",inset:0,borderRadius:"inherit",background:"linear-gradient(160deg,#FFFFFF0C,transparent 55%)",pointerEvents:"none"}}/>
            <svg width="100%" height="100%" viewBox="0 0 56 36" style={{overflow:"visible"}}>
                <defs><clipPath id={eyeClip}>{[19,37].map(cx=><rect key={cx} x={cx-7} y="8.5" width="14" height="19" rx="7"/>)}</clipPath></defs>
                <g data-iris-eyes="">
                    {[19,37].map(cx=><rect key={cx} x={cx-7} y="8.5" width="14" height="19" rx="7"
                        fill={eyeColor}/>)}
                    <g clipPath={`url(#${eyeClip})`}>
                    <motion.g data-iris-gaze="" style={{x:reduced?0:sx,y:reduced?0:sy}}>
                        {[19,37].map(cx=><rect key={cx} x={cx-3.25} y="13.5" width="6.5" height="9" rx="3.25"
                            fill={pupilColor}/>)}
                    </motion.g>
                    </g>
                </g>
            </svg>
        </motion.span>
    </Tag>
}

addPropertyControls(EyeGlowButton, {
    label:{type:ControlType.String,title:"Label",defaultValue:"Explore more"},
    link:{type:ControlType.Link,title:"Link",defaultValue:""},
    newTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false},
    appearance:{type:ControlType.Enum,title:"Finish",options:["Obsidian","Pearl","Custom"],defaultValue:"Obsidian"},
    surface:{type:ControlType.Color,title:"Surface",defaultValue:"#16191F",hidden:p=>p.appearance!=="Custom"},
    textColor:{type:ControlType.Color,title:"Text",defaultValue:"#F3F5F7",hidden:p=>p.appearance!=="Custom"},
    accent:{type:ControlType.Color,title:"Accent",defaultValue:"#A9D7F5"},
    font:{type:ControlType.Font,title:"Font",controls:"extended",defaultValue:{fontSize:"15px",variant:"Medium",letterSpacing:"-0.02em",lineHeight:"1.3em"}},
    padding:{type:ControlType.Padding,title:"Padding",defaultValue:"10px 12px 10px 24px"},
    radius:{type:ControlType.BorderRadius,title:"Radius",defaultValue:"999px"},
    lensSize:{type:ControlType.Number,title:"Eye Size",defaultValue:36,min:24,max:60,step:1,unit:"px"},
    tracking:{type:ControlType.Boolean,title:"Eye Follow",defaultValue:true},
    followStrength:{type:ControlType.Number,title:"Follow Range",defaultValue:1,min:0.3,max:1.2,step:0.1,hidden:p=>!p.tracking},
    pixels:{type:ControlType.Boolean,title:"Pixel Trail",defaultValue:false},
    glow:{type:ControlType.Number,title:"Glow",defaultValue:0.35,min:0,max:0.8,step:0.05},
    speed:{type:ControlType.Number,title:"Hover Orbit",defaultValue:4,min:2,max:12,step:0.5,unit:"s"},
    idleMotion:{type:ControlType.Boolean,title:"Idle Motion",defaultValue:true},
    idleSpeed:{type:ControlType.Number,title:"Idle Time",defaultValue:12,min:3,max:40,step:1,unit:"s",hidden:p=>!p.idleMotion},
    idleStrength:{type:ControlType.Number,title:"Idle Light",defaultValue:0.55,min:0,max:1,step:0.05,hidden:p=>!p.idleMotion},
    hoverEnabled:{type:ControlType.Boolean,title:"Hover",defaultValue:true},
    hoverStrength:{type:ControlType.Number,title:"Hover Light",defaultValue:0.92,min:0,max:1,step:0.05,hidden:p=>!p.hoverEnabled},
    hoverLift:{type:ControlType.Number,title:"Eye Lift",defaultValue:1,min:0,max:6,step:0.5,unit:"px",hidden:p=>!p.hoverEnabled},
    hoverDuration:{type:ControlType.Number,title:"Hover Time",defaultValue:0.3,min:0,max:1,step:0.05,unit:"s",hidden:p=>!p.hoverEnabled},
    spotlight:{type:ControlType.Boolean,title:"Spotlight",defaultValue:true,hidden:p=>!p.hoverEnabled},
    spotStrength:{type:ControlType.Number,title:"Spot Strength",defaultValue:1,min:0,max:2,step:0.1,hidden:p=>!p.hoverEnabled||!p.spotlight},
    spotSize:{type:ControlType.Number,title:"Spot Size",defaultValue:180,min:60,max:400,step:10,unit:"px",hidden:p=>!p.hoverEnabled||!p.spotlight},
    pressEnabled:{type:ControlType.Boolean,title:"Press",defaultValue:true},
    pressScale:{type:ControlType.Number,title:"Press Scale",defaultValue:0.98,min:0.85,max:1,step:0.01,hidden:p=>!p.pressEnabled},
    pressDuration:{type:ControlType.Number,title:"Press Time",defaultValue:0.14,min:0,max:0.5,step:0.01,unit:"s",hidden:p=>!p.pressEnabled},
    secondary:{type:ControlType.Color,title:"Gradient End",defaultValue:"#AD99CF"},
    eyeColor:{type:ControlType.Color,title:"Eyes",defaultValue:"#E7EAE6"},
    pupilColor:{type:ControlType.Color,title:"Pupils",defaultValue:"#161B21"},
    visorColor:{type:ControlType.Color,title:"Eye Surface",defaultValue:"#12171E"},
    followSpeed:{type:ControlType.Number,title:"Eye Speed",defaultValue:260,min:80,max:500,step:10,hidden:p=>!p.tracking},
    followDamping:{type:ControlType.Number,title:"Eye Damping",defaultValue:28,min:20,max:50,step:1,hidden:p=>!p.tracking},
    rimStrength:{type:ControlType.Number,title:"Gradient",defaultValue:0.48,min:0,max:1,step:0.05},
    glowSize:{type:ControlType.Number,title:"Glow Size",defaultValue:20,min:0,max:50,step:1,unit:"px"},
    contentGap:{type:ControlType.Number,title:"Content Gap",defaultValue:22,min:0,max:48,step:1,unit:"px"},
    disabled:{type:ControlType.Boolean,title:"Disabled",defaultValue:false},
    onTap:{type:ControlType.EventHandler,title:"On Tap"},
    accessibleLabel:{type:ControlType.String,title:"Aria Label",defaultValue:"",placeholder:"Uses button label",description:"Made by Frame Native  \n[Explore more components](https://dub.sh/dsw13)"},
})
