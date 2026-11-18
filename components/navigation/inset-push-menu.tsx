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

interface Item { label: string; link?: string; newTab?: boolean }
interface Props {
 style?: React.CSSProperties
 closedHint?: React.ReactNode
 items?: Item[]
 secondary?: Item[]
 canvasState?: "Closed" | "Open"
 startOpen?: boolean
 background?: string
 pushLayer?: string
 ink?: string
 accent?: string
 padding?: string
 radius?: string
 typeface?: "Editorial" | "Custom"
 font?: React.CSSProperties
 duration?: number
 stagger?: number
 rotation?: number
 menuLabel?: string
 closeLabel?: string
 showNumbers?: boolean
}
const defaults: Item[] = ["Work","Studio","About","Contact"].map(label=>({label,link:"",newTab:false}))
const ease = [0.22, 1, 0.36, 1] as const

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 760
 * @framerDisableUnlink
 */
export default function InsetPushMenu(props: Props) {
 const {
 style, closedHint, items=defaults, secondary=[{label:"Instagram",link:"",newTab:false},{label:"LinkedIn",link:"",newTab:false},{label:"Email",link:"",newTab:false}], canvasState="Open", startOpen=false, background="#30262F",
 pushLayer="Page Content", ink="#F0E7DB", accent="#D2DB9B", padding="36px",
 radius="0px", typeface="Editorial", font={fontFamily:"Inter, sans-serif",fontSize:68,fontWeight:400,letterSpacing:"-0.055em",lineHeight:"1.1em"},
 duration=0.62, stagger=0.055, rotation=-3,
 menuLabel="Menu",closeLabel="Close",showNumbers=false
 }=props
 const canvas=RenderTarget.current()===RenderTarget.canvas
 const [expanded,setExpanded]=React.useState(startOpen)
 const open=canvas?canvasState==="Open":expanded
 const reduce=useReducedMotion()
 const root=React.useRef<HTMLDivElement>(null)
 const toggle=React.useRef<HTMLButtonElement>(null)
 const panel=React.useRef<HTMLElement>(null)
 
 const [width,setWidth]=React.useState(520)
 const id=React.useId().replace(/:/g,"")
 const list=(items || []).filter(item=>item && item.label)
 React.useEffect(()=>{
  const node=root.current
  if(!node)return
  const observer=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width))
  setWidth(node.clientWidth)
  observer.observe(node)
  return ()=>observer.disconnect()
 },[])
 React.useEffect(()=>{
  if(panel.current) (panel.current as any).inert=!open
  
 },[open])
 const pushAnimation=React.useRef<Animation|null>(null)
 const pushedElement=React.useRef<HTMLElement|null>(null)
 const previousPushOpen=React.useRef<boolean|null>(null)
 React.useLayoutEffect(()=>{
  if(canvas||!pushLayer)return
  const target=Array.from(document.querySelectorAll<HTMLElement>("[data-framer-name]")).find(el=>el.getAttribute("data-framer-name")===pushLayer&&!el.contains(root.current))
  if(!target)return
  const sameTarget=pushedElement.current===target
  const stateChanged=sameTarget&&previousPushOpen.current!==null&&previousPushOpen.current!==open
  const current=getComputedStyle(target).translate
  pushAnimation.current?.cancel()
  pushedElement.current=target
  previousPushOpen.current=open
  // Measure synchronously so the first frame also uses the actual mobile width.
  const offset=open?-(root.current?.clientWidth??width)+"px":"0px"
  const from=stateChanged&&current!=="none"?current:offset
  pushAnimation.current=target.animate([{translate:from},{translate:offset}],{duration:reduce||!stateChanged?0:(open?duration:duration*.78)*1000,easing:"cubic-bezier(.22,1,.36,1)",fill:"forwards"})
 },[open,canvas,pushLayer,width,duration,reduce])
 React.useLayoutEffect(()=>()=>{pushAnimation.current?.cancel();pushedElement.current=null;previousPushOpen.current=null},[])
 const close=React.useCallback(()=>{
  setExpanded(false)
  toggle.current?.focus({preventScroll:true})
 },[])
 React.useEffect(()=>{
  if(!open||canvas)return
  const key=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();close()}

  }
  const outside=(event:PointerEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setExpanded(false)}
  document.addEventListener("keydown",key)
  document.addEventListener("pointerdown",outside)
  return ()=>{document.removeEventListener("keydown",key);document.removeEventListener("pointerdown",outside)}
 },[open,canvas,close,list.length])
 const mobile=width<430
 const timing={duration:reduce?0:open?duration:duration*0.78,ease}
 const vars={
 "--ip-accent":accent,"--ip-ink":ink,"--ip-rotate":rotation+"deg",
 "--ip-padding":mobile?"28px":padding,"--ip-font":typeof font.fontSize==="number"?font.fontSize+"px":font.fontSize||"68px",
 "--ip-motion":reduce?"0ms":"480ms",
 } as React.CSSProperties
 const buttonStyle:React.CSSProperties={border:0,background:"transparent",padding:0,color:"inherit",cursor:"pointer",font:"inherit"}
 return <div ref={root} className={"ip-root ip-"+id} style={{width:style?.width ?? 520,height:style?.height ?? 760,...style,...vars,position:"relative",isolation:"isolate",overflow:"hidden",pointerEvents:"none",background:"transparent",color:ink,fontFamily:"Inter, sans-serif"}}>
  <style>{`
   .ip-${id} *{box-sizing:border-box}
   .ip-${id} button:focus-visible,.ip-${id} a:focus-visible{outline:2px solid var(--ip-accent);outline-offset:6px;border-radius:4px}
   .ip-${id} button:focus:not(:focus-visible),.ip-${id} a:focus:not(:focus-visible){outline:none}
   .ip-${id} .ip-panel{padding:var(--ip-padding);padding-top:136px;padding-bottom:28px}
   .ip-${id} .ip-toggle{display:flex;align-items:center;gap:14px;user-select:none}
   .ip-${id} .ip-toggle-label{position:relative;overflow:hidden;height:20px;font-size:12px;font-weight:500;letter-spacing:-.02em}
   .ip-${id} .ip-circle{position:relative;display:block;width:48px;height:48px;border:0;border-radius:0;transition:opacity 200ms;overflow:hidden}
   .ip-${id} .ip-link{display:grid;grid-template-columns:${showNumbers?"24px minmax(0,1fr)":"minmax(0,1fr)"};align-items:center;gap:${mobile?"12px":"20px"};width:100%;padding:${mobile?"12px 2px":"10px 2px"};color:var(--ip-ink);text-decoration:none;background:transparent;border:0;text-align:left;cursor:pointer;font:inherit;position:relative}
   .ip-${id} .ip-number{font:11px/1.1 'Inter',sans-serif;letter-spacing:.02em;color:currentColor;opacity:.5;transition:opacity var(--ip-motion),transform var(--ip-motion)}
   .ip-${id} .ip-word-a{display:block;transform-origin:0 80%;transition:transform var(--ip-motion) cubic-bezier(.22,1,.36,1),color 300ms}
   .ip-${id} .ip-word{display:block;position:relative;perspective:700px;min-width:0;white-space:nowrap}
   .ip-${id} .ip-link:focus-visible .ip-word-a{color:var(--ip-accent);transform:translateX(10px) rotate(var(--ip-rotate))}
   @media(hover:hover){
    .ip-${id} .ip-link:hover .ip-word-a{color:var(--ip-accent);transform:translateX(10px) rotate(var(--ip-rotate))}
    .ip-${id} .ip-link:hover .ip-number{opacity:1;transform:translateX(3px);color:var(--ip-accent)}
    .ip-${id} .ip-toggle:hover .ip-circle{opacity:.55}
   }
   .ip-${id} .ip-small-link{opacity:.72;position:relative;transition:opacity 250ms,color 250ms}
   .ip-${id} .ip-small-link:after{content:"";position:absolute;left:0;bottom:9px;width:100%;height:1px;background:currentColor;transform:scaleX(0);transform-origin:right;transition:transform 300ms cubic-bezier(.22,1,.36,1)}
   .ip-${id} .ip-small-link:hover:after,.ip-${id} .ip-small-link:focus-visible:after{transform:scaleX(1);transform-origin:left}
   .ip-${id} .ip-small-link:hover,.ip-${id} .ip-small-link:focus-visible{opacity:1;color:var(--ip-accent)!important}
   .ip-${id} .ip-link:active{opacity:.7}
   .ip-${id} .ip-toggle:active .ip-circle{opacity:.35}
   @media(prefers-reduced-motion:reduce){.ip-${id} *{transition:none!important;animation:none!important}}
  `}</style>
  <motion.nav className="ip-panel" ref={panel} id={"menu-"+id} aria-label="Main navigation" aria-hidden={!open} initial={false} animate={{x:open?0:"100%"}} transition={timing} style={{position:"absolute",top:0,right:0,left:0,bottom:0,borderRadius:radius,background,overflowY:"auto",overflowX:"hidden",overscrollBehavior:"contain",pointerEvents:open?"auto":"none",display:"flex",flexDirection:"column",borderLeft:"1px solid rgba(37,41,34,.12)"}}>
   <div aria-hidden="true" style={{position:"absolute",top:44,left:mobile?28:36,display:"flex",alignItems:"center",gap:9,fontSize:10,letterSpacing:".14em",textTransform:"uppercase",opacity:.65}}><span style={{width:28,height:1,background:accent,marginRight:8}}/>Explore</div>
   <div style={{width:"100%",maxWidth:620,margin:"0 auto"}}>
    {list.map((item,index)=><motion.div key={index} initial={false} animate={{opacity:open?1:0,x:open?0:26,clipPath:open?"inset(-20% -10% -20% -10%)":"inset(-20% 100% -20% -10%)"}} transition={{...timing,delay:reduce?0:open?0.12+index*stagger:0}} style={{transformOrigin:"left center",marginLeft:index%2?(mobile?20:28):0}}>
     {React.createElement(item.link?"a":"button",{
      className:"ip-link",
      ...(item.link?{href:item.link,target:item.newTab?"_blank":undefined,rel:item.newTab?"noopener noreferrer":undefined}:{type:"button"}),
      tabIndex:open?0:-1,
      onClick:()=>close(),
      style:{...font,fontFamily:typeface==="Editorial"?"Georgia, Times New Roman, serif":font.fontFamily,fontWeight:typeface==="Editorial"?400:font.fontWeight,fontSize:mobile?"clamp(36px, 13vw, 56px)":"var(--ip-font)",lineHeight:1.12}
     },
      showNumbers&&<span className="ip-number" aria-hidden="true">{String(index+1).padStart(2,"0")}</span>,
      <span className="ip-word"><span className="ip-word-a">{item.label}</span></span>
     )}
    </motion.div>)}
   </div>

   <motion.div initial={false} animate={{opacity:open?1:0,y:open?0:12}} transition={{...timing,delay:open&&!reduce?0.3:0}} style={{marginTop:"auto",paddingTop:48}}>
    <div style={{height:1,background:ink,opacity:.16,marginBottom:12}}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(76px,1fr))",columnGap:12,rowGap:4,alignItems:"center"}}>
     {(secondary||[]).filter(item=>item?.label).map((item,index)=>React.createElement(item.link?"a":"button",{key:index,type:item.link?undefined:"button",href:item.link||undefined,target:item.newTab?"_blank":undefined,rel:item.newTab?"noopener noreferrer":undefined,tabIndex:open?0:-1,onClick:close,className:"ip-small-link",style:{...buttonStyle,display:"inline-flex",alignItems:"center",justifyContent:"center",justifySelf:"center",minHeight:44,gap:7,fontSize:12,letterSpacing:".01em",lineHeight:"20px",textDecoration:"none"}},item.label))}
    </div>
   </motion.div>
  </motion.nav>
  {closedHint && <motion.div aria-hidden="true" initial={false} animate={{opacity:open?0:1}} transition={{duration:reduce?0:.2,delay:open?0:.4}} style={{position:"absolute",right:48,top:70,width:180,height:76,filter:"drop-shadow(0 1px 2px rgba(0,0,0,.7))",pointerEvents:"none",visibility:open?"hidden":"visible"}}>{closedHint}</motion.div>}
  <button ref={toggle} type="button" className="ip-toggle" aria-label={open?closeLabel+" navigation":menuLabel+" navigation"} aria-expanded={open} aria-controls={"menu-"+id} onClick={()=>setExpanded(v=>!v)} style={{...buttonStyle,position:"absolute",right:24,top:24,color:ink,zIndex:2,pointerEvents:"auto",background,padding:"0 0 0 18px",borderRadius:2}}>
   <span className="ip-toggle-label" style={{width:Math.max(menuLabel.length,closeLabel.length)*8}}>
    <motion.span initial={false} animate={{y:open?-22:0}} transition={timing} style={{display:"block",position:"absolute",top:2,left:0,lineHeight:"16px"}}>{menuLabel}</motion.span>
    <motion.span initial={false} animate={{y:open?0:22}} transition={timing} style={{display:"block",position:"absolute",top:2,left:0,lineHeight:"16px"}}>{closeLabel}</motion.span>
   </span>
   <span className="ip-circle" aria-hidden="true">
    <motion.span initial={false} animate={{rotate:open?45:0,y:open?0:-4,scaleX:open?0.86:1}} transition={timing} style={{position:"absolute",width:20,height:1.5,left:13,top:22.5,background:"currentColor",borderRadius:2}}/>
    <motion.span initial={false} animate={{rotate:open?-45:0,y:open?0:4,scaleX:open?0.86:1}} transition={timing} style={{position:"absolute",width:20,height:1.5,left:13,top:22.5,background:"currentColor",borderRadius:2}}/>
   </span>
  </button>
 </div>
}
InsetPushMenu.defaultProps = { width:520, height:760 }
addPropertyControls(InsetPushMenu,{
 closedHint:{type:ControlType.ComponentInstance,title:"Closed Hint",description:"Optional hint shown only while the menu is closed."},
 pushLayer:{type:ControlType.String,title:"Push Layer",defaultValue:"Page Content",description:"Name the page-content Stack Page Content, or enter its layer name here. Keep this menu outside that Stack, fixed to the right."},
 secondary:{type:ControlType.Array,title:"Small Links",defaultValue:["Instagram","LinkedIn","Email"].map(label=>({label,link:"",newTab:false})),control:{type:ControlType.Object,controls:{label:{type:ControlType.String,title:"Label",defaultValue:"Link"},link:{type:ControlType.Link,title:"Destination",defaultValue:""},newTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false}}}},
 items:{type:ControlType.Array,title:"Links",defaultValue:defaults,control:{type:ControlType.Object,controls:{
  label:{type:ControlType.String,title:"Label",defaultValue:"Link"},
  link:{type:ControlType.Link,title:"Destination",defaultValue:""},
  newTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false}
 }}},
 startOpen:{type:ControlType.Boolean,title:"Start Open",defaultValue:false},
 canvasState:{type:ControlType.Enum,title:"Canvas",options:["Open","Closed"],defaultValue:"Open",displaySegmentedControl:true,description:"Editor preview only. Set Start Open for the website."},
 background:{type:ControlType.Color,title:"Menu",defaultValue:"#30262F"},
 ink:{type:ControlType.Color,title:"Text",defaultValue:"#F0E7DB"},
 accent:{type:ControlType.Color,title:"Accent",defaultValue:"#D2DB9B"},
 typeface:{type:ControlType.Enum,title:"Typography",options:["Editorial","Custom"],defaultValue:"Editorial"},
 font:{type:ControlType.Font,title:"Link Font",controls:"extended",defaultFontType:"sans-serif",defaultValue:{variant:"Regular",fontSize:"68px",letterSpacing:"-0.055em",lineHeight:"1.1em"}},
 padding:{type:ControlType.Padding,title:"Padding",defaultValue:"36px"},
 radius:{type:ControlType.BorderRadius,title:"Radius",defaultValue:"0px"},
 duration:{type:ControlType.Number,title:"Duration",defaultValue:.62,min:.2,max:1.5,step:.01,unit:"s"},
 stagger:{type:ControlType.Number,title:"Link Stagger",defaultValue:.055,min:0,max:.15,step:.005,unit:"s"},
 rotation:{type:ControlType.Number,title:"Hover Rotate",defaultValue:-3,min:-8,max:8,step:.5,unit:"°"},
 menuLabel:{type:ControlType.String,title:"Menu Label",defaultValue:"Menu"},
 closeLabel:{type:ControlType.String,title:"Close Label",defaultValue:"Close"},
 showNumbers:{type:ControlType.Boolean,title:"Numbers",defaultValue:false,description:"Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"}
})
