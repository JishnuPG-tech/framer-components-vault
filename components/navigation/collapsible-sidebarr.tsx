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

type Item = { label: string; icon: string; destination?: string; newTab?: boolean; badge?: string }
interface Props { style?: React.CSSProperties; brand: string; items: Item[]; initial: string; selected: number; surface: string; ink: string; muted: string; accent: string; activeInk: string; padding: string; radius: string; font: any; speed: number; compactOnPhone: boolean; collapseLabel: string; expandLabel: string; rollingText: boolean }
const defaults: Item[] = [
{label:"Overview",icon:"grid",destination:"",newTab:false,badge:""},
{label:"Activity",icon:"pulse",destination:"",newTab:false,badge:"4"},
{label:"Collections",icon:"layers",destination:"",newTab:false,badge:""},
{label:"Schedule",icon:"calendar",destination:"",newTab:false,badge:""},
{label:"Preferences",icon:"sliders",destination:"",newTab:false,badge:""}]
const paths: Record<string, React.ReactNode> = {
grid:<><rect x="3.5" y="3.5" width="6" height="6" rx="1.5"/><rect x="14.5" y="3.5" width="6" height="6" rx="1.5"/><rect x="3.5" y="14.5" width="6" height="6" rx="1.5"/><rect x="14.5" y="14.5" width="6" height="6" rx="1.5"/></>,
pulse:<path d="M3 12h4l3-7 4 14 3-7h4"/>,
layers:<><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
calendar:<><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v5m8-5v5M4 11h16m-11 5h2m3 0h1"/></>,
sliders:<><path d="M4 7h9m5 0h2M4 17h2m5 0h9"/><circle cx="15.5" cy="7" r="2.5"/><circle cx="8.5" cy="17" r="2.5"/></>,
compass:<><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></>,
star:<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.7l6.2-.9L12 3Z"/>,
panel:<><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m7-12-3 4 3 4"/></>
}
function Icon({name}:{name:string}) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flexShrink:0}}>{paths[name] || paths.grid}</svg> }


function RollingLabel({text,open,roll,reveal,row,enabled}:{text:string;open:boolean;roll:boolean;reveal:number;row:number;enabled:boolean}) {
const [cycle,setCycle]=React.useState(0)
const [entrance,setEntrance]=React.useState(true)
const previous=React.useRef({open:false,roll:false,reveal:-1})
const running=React.useRef(false)
React.useEffect(()=>{
 const before=previous.current
 const entering=open && (!before.open || before.reveal!==reveal)
 const hovering=open && roll && !before.roll
 previous.current={open,roll,reveal}
 if(!open || !enabled)running.current=false
 if(enabled && (entering || (hovering && !running.current))) {
  running.current=true
  setEntrance(entering)
  setCycle(value=>value+1)
 }
},[open,roll,reveal,enabled])
const slot="calc(1.5em + 4px)"
return <span aria-label={text} style={{opacity:open?1:0,transition:enabled?"opacity 120ms ease":"none",whiteSpace:"nowrap",overflow:"hidden",minWidth:0,flex:1,textAlign:"left",display:"block",height:slot,lineHeight:"1.5em"}}>
<span key={cycle} aria-hidden="true" style={{display:"block",height:slot}}>
{Array.from(text).map((char,j)=><span key={j} style={{display:"inline-block",verticalAlign:"top",height:slot,whiteSpace:"pre"}}>
<span data-fold-roll="" onAnimationEnd={()=>{if(j===Array.from(text).length-1)running.current=false}} style={{display:"block",animation:enabled && open && cycle>0?"fold-character-roll 520ms cubic-bezier(.22,1,.36,1) "+((entrance?.06+Math.min(row*.025,.15):0)+Math.min(j*.016,.16))+"s both":"none"}}>
<span style={{display:"block",height:slot,lineHeight:"1.5em",padding:"2px 0",boxSizing:"border-box"}}>{char}</span>
<span style={{display:"block",height:slot,lineHeight:"1.5em",padding:"2px 0",boxSizing:"border-box"}}>{char}</span>
</span></span>)}
</span></span>
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 264
 * @framerIntrinsicHeight 430
 * @framerDisableUnlink
 */
export default function CollapsibleSidebar(props: Props) {
const {style,brand="Forma",items=defaults,initial="expanded",selected=-1,surface="#252D2B",ink="#F4F3EB",muted="#A8B2A9",accent="#465947",activeInk="#DDECCD",padding="12px",radius="24px",font,speed=.36,compactOnPhone=true,collapseLabel="Collapse",expandLabel="Expand",rollingText=true}=props
const [open,setOpen]=React.useState(initial!=="collapsed")
const [reveal,setReveal]=React.useState(0)
const [active,setActive]=React.useState(selected)
const [hover,setHover]=React.useState<number|null>(null)
const [focus,setFocus]=React.useState<number|null>(null)
const touched=React.useRef(false)
const root=React.useRef<HTMLDivElement>(null)
const prefersReduced=useReducedMotion()
const isCanvas=RenderTarget.current()===RenderTarget.canvas
const reduced=prefersReduced || isCanvas
const id=React.useId()
React.useEffect(()=>{setOpen(initial!=="collapsed");touched.current=false},[initial])
React.useEffect(()=>setActive(selected),[selected])
React.useEffect(()=>{
if(isCanvas || !compactOnPhone || typeof window==="undefined")return
const query=window.matchMedia("(max-width: 600px)")
const update=()=>{if(!touched.current)setOpen(query.matches?false:initial!=="collapsed")}
update();query.addEventListener("change",update)
return ()=>query.removeEventListener("change",update)
},[compactOnPhone,initial,isCanvas])
const transition={duration:reduced?0:speed,ease:[.22,1,.36,1] as [number,number,number,number]}
const label=(text:string,roll=false,row=0)=><RollingLabel text={text} open={open} roll={roll} reveal={reveal} row={row} enabled={rollingText && !reduced}/>
function keyboard(e:React.KeyboardEvent, index:number){
setFocus(index)
if(!["ArrowDown","ArrowUp","Home","End"].includes(e.key))return
e.preventDefault()
const nodes=root.current?.querySelectorAll<HTMLElement>("[data-fold-item]")
if(!nodes?.length)return
const next=e.key==="Home"?0:e.key==="End"?nodes.length-1:(index+(e.key==="ArrowDown"?1:-1)+nodes.length)%nodes.length
nodes[next]?.focus()
}
const safeItems=Array.isArray(items)?items:[]
return <div ref={root} onPointerDownCapture={()=>setFocus(null)} style={{display:"flex",justifyContent:"center",alignItems:"flex-start",...style}}>
<style>{`@keyframes fold-character-roll { from { transform: translate3d(0,0,0); } to { transform: translate3d(0,-50%,0); } } @media (prefers-reduced-motion: reduce) { [data-fold-roll] { animation: none !important; } }`}</style>
<nav aria-label={brand+" navigation"} style={{width:open?"100%":"76px",transition:reduced || !touched.current?"none":"width "+speed+"s cubic-bezier(.4,0,.2,1)",flexShrink:0,boxSizing:"border-box",maxWidth:"100%",background:surface,color:ink,padding,borderRadius:radius,border:"1px solid rgba(39,49,42,.09)",boxShadow:"0 2px 3px rgba(33,40,32,.025), 0 18px 48px -20px rgba(33,40,32,.18)",overflow:"hidden",fontFamily:"Space Grotesk, sans-serif",fontSize:14,fontWeight:500,...font}}>
<div style={{display:"flex",alignItems:"center",gap:12,height:64,padding:"0 14px",marginBottom:16,overflow:"hidden"}}>
<div aria-hidden="true" style={{width:24,height:28,flexShrink:0,position:"relative",color:activeInk}}>
<svg width="24" height="28" viewBox="0 0 24 28" fill="none"><path d="M3 23V5l9-3v18l-9 3Z" fill="currentColor"/><path d="m14 6 7-2v18l-7 3V6Z" fill="currentColor" opacity=".45"/></svg>
</div>
<div style={{fontSize:20,fontWeight:700,letterSpacing:"-.7px",minWidth:0,flex:1}}>{label(brand,false,0)}</div>
</div>
<div id={id} style={{display:"flex",flexDirection:"column",gap:6}}>
{safeItems.map((item,i)=>{
const isActive=i===active, highlighted=hover===i, focused=focus===i
const Tag=item.destination?"a":"button"
return <Tag key={i} data-fold-item="" href={item.destination||undefined} target={item.destination&&item.newTab?"_blank":undefined} rel={item.newTab?"noopener noreferrer":undefined} type={item.destination?undefined:"button"} aria-label={item.label+(item.badge?", "+item.badge+" updates":"")} aria-current={isActive?"page":undefined} title={open?undefined:item.label} onClick={()=>{if(!item.destination)setActive(i)}} onPointerEnter={e=>{if(e.pointerType==="mouse")setHover(i)}} onPointerLeave={()=>setHover(null)} onFocus={e=>setFocus(e.currentTarget.matches(":focus-visible")?i:null)} onBlur={()=>setFocus(null)} onKeyDown={e=>keyboard(e,i)} style={{position:"relative",width:"100%",height:48,boxSizing:"border-box",display:"flex",alignItems:"center",gap:14,padding:"0 15px",background:isActive?accent:highlighted?"rgba(110,125,107,.07)":"transparent",color:isActive?activeInk:ink,border:0,borderRadius:12,outline:focused?"2px solid "+activeInk:"none",outlineOffset:-2,font:"inherit",fontWeight:500,textDecoration:"none",cursor:"pointer",transition:reduced?"none":"background 160ms ease, color 160ms ease",overflow:"hidden",textAlign:"left"}}>
<motion.span initial={false} animate={{y:!reduced && highlighted?-2:0,rotate:!reduced && highlighted?-6:0,scale:!reduced && highlighted?1.08:1}} transition={{type:"spring",stiffness:400,damping:22}} style={{display:"flex",flexShrink:0}}><Icon name={item.icon}/></motion.span>{label(item.label,highlighted || focused,i+1)}
{item.badge && <motion.span animate={{opacity:open?1:0}} transition={transition} style={{fontSize:11,fontWeight:700,background:accent,color:activeInk,borderRadius:6,padding:"3px 6px",flexShrink:0}}>{label(item.badge,false,i+1)}</motion.span>}
{item.badge && !open && <span aria-hidden="true" style={{position:"absolute",width:5,height:5,borderRadius:"50%",background:activeInk,top:9,left:33}}/>}
</Tag>
})}
</div>
<div style={{height:1,background:"rgba(39,49,42,.09)",margin:"24px 8px 10px"}}/>
<button type="button" aria-label={open?collapseLabel:expandLabel} aria-expanded={open} aria-controls={id} title={open?collapseLabel:expandLabel} onClick={()=>{touched.current=true;setHover(null);if(!open)setReveal(value=>value+1);setOpen(!open)}} onFocus={e=>setFocus(e.currentTarget.matches(":focus-visible")?-1:null)} onKeyDown={()=>setFocus(-1)} onPointerEnter={e=>{if(e.pointerType==="mouse")setHover(-1)}} onPointerLeave={()=>setHover(null)} onBlur={()=>setFocus(null)} style={{display:"flex",alignItems:"center",gap:14,width:"100%",height:46,padding:"0 15px",overflow:"hidden",background:"transparent",border:0,borderRadius:12,color:muted,font:"inherit",cursor:"pointer",outline:focus===-1?"2px solid "+activeInk:"none",outlineOffset:-2}}>
<motion.span animate={{rotate:open?0:180}} transition={transition} style={{display:"flex",flexShrink:0}}><Icon name="panel"/></motion.span>
{label(open?collapseLabel:expandLabel,hover===-1 || focus===-1,safeItems.length+1)}
</button>
</nav>
</div>
}
CollapsibleSidebar.displayName="Collapsible Sidebar"
addPropertyControls(CollapsibleSidebar,{
brand:{type:ControlType.String,title:"Brand",defaultValue:"Forma"},
items:{type:ControlType.Array,title:"Items",defaultValue:defaults,control:{type:ControlType.Object,controls:{
label:{type:ControlType.String,title:"Label",defaultValue:"Overview"},
icon:{type:ControlType.Enum,title:"Icon",options:["grid","pulse","layers","calendar","sliders","compass","star"],optionTitles:["Grid","Activity","Layers","Calendar","Sliders","Compass","Star"],defaultValue:"grid"},
destination:{type:ControlType.Link,title:"Destination",defaultValue:""},
newTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false},
badge:{type:ControlType.String,title:"Badge",defaultValue:""}
}}},
initial:{type:ControlType.Enum,title:"Initial State",options:["expanded","collapsed"],optionTitles:["Expanded","Collapsed"],defaultValue:"expanded",displaySegmentedControl:true},
selected:{type:ControlType.Number,title:"Active Item",description:"−1: No active item. 0: First item.",defaultValue:-1,min:-1,max:20,step:1},
compactOnPhone:{type:ControlType.Boolean,title:"Compact Phone",defaultValue:true},
collapseLabel:{type:ControlType.String,title:"Collapse Label",defaultValue:"Collapse"},
expandLabel:{type:ControlType.String,title:"Expand Label",defaultValue:"Expand"},
surface:{type:ControlType.Color,title:"Surface",defaultValue:"#252D2B"},
ink:{type:ControlType.Color,title:"Text",defaultValue:"#F4F3EB"},
muted:{type:ControlType.Color,title:"Muted",defaultValue:"#A8B2A9"},
accent:{type:ControlType.Color,title:"Active Fill",defaultValue:"#465947"},
activeInk:{type:ControlType.Color,title:"Active Text",defaultValue:"#DDECCD"},
font:{type:ControlType.Font,title:"Font",controls:"extended",defaultValue:{fontSize:14,letterSpacing:"-0.2px",lineHeight:"1.4em"}},
padding:{type:ControlType.Padding,title:"Padding",defaultValue:"12px"},
radius:{type:ControlType.BorderRadius,title:"Radius",defaultValue:"24px"},
rollingText:{type:ControlType.Boolean,title:"Rolling Text",defaultValue:true},
speed:{type:ControlType.Number,title:"Duration",defaultValue:.36,min:0,max:1,step:.05,unit:"s",description:"Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"}
})
