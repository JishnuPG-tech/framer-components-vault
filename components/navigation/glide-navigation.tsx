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

import {motion,LayoutGroup,useReducedMotion} from "framer-motion"
interface Props {items:{label:string,url:string,newTab:boolean}[];active:number;background:string;foreground:string;pill:string;selected:string;padding:any;radius:any;font:any;gap:number;style:React.CSSProperties}
const defaults=[{label:"Overview",url:"",newTab:false},{label:"Components",url:"",newTab:false},{label:"Templates",url:"",newTab:false},{label:"Resources",url:"",newTab:false}]
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 60
 * @framerDisableUnlink
 */
export default function GlideNavigation(props:Props){
 const {items=defaults,active=0,background="#1C1D20",foreground="#BFC2C8",pill="#37393E",selected="#F7F8FA",padding="6px",radius="999px",font={},gap=2,style}=props
 const [current,setCurrent]=React.useState(active)
 const [hovered,setHovered]=React.useState<number|null>(null)
 const [focused,setFocused]=React.useState<number|null>(null)
 const id=React.useId().replace(/:/g,"")
 const reduce=useReducedMotion()
 const gesture=React.useRef({x:0,y:0,moved:false})
 React.useEffect(()=>setCurrent(active),[active])
 const clampIndex=(value:number)=>Math.min(Math.max(Number.isFinite(value)?Math.trunc(value):0,0),Math.max(items.length-1,0))
 const currentIndex=clampIndex(current)
 const index=clampIndex(focused ?? hovered ?? currentIndex)
 return <nav onPointerLeave={()=>setHovered(null)} aria-label="Primary navigation" className={"pill-"+id} style={{display:"flex",minWidth:0,maxWidth:"100%",boxSizing:"border-box",padding,backgroundColor:background,backgroundImage:"linear-gradient(180deg,rgba(255,255,255,.065),transparent 70%)",borderRadius:radius,border:"1px solid rgba(255,255,255,.11)",boxShadow:"inset 0 1px 0 rgba(255,255,255,.08),0 2px 3px rgba(16,18,23,.12),0 8px 18px -8px rgba(16,18,23,.24),0 24px 40px -20px rgba(16,18,23,.20)",...style}}>
 <style>{".pill-"+id+" a:focus-visible,.pill-"+id+" button:focus-visible{outline:2px solid #AFC9FF;outline-offset:-3px}.pill-"+id+" a:hover,.pill-"+id+" button:hover{filter:brightness(1.06)}"}</style>
 <LayoutGroup id={id}><motion.div layoutScroll
 onTouchStart={e=>{const t=e.touches[0];if(t)gesture.current={x:t.clientX,y:t.clientY,moved:false};setHovered(null);setFocused(null)}}
 onTouchMove={e=>{const t=e.touches[0];if(t&&Math.hypot(t.clientX-gesture.current.x,t.clientY-gesture.current.y)>8)gesture.current.moved=true}}
 onTouchCancel={()=>{gesture.current.moved=true}}
 onClickCapture={e=>{if(gesture.current.moved&&e.detail!==0){e.preventDefault();e.stopPropagation();gesture.current.moved=false}}}
 style={{display:"flex",gap,width:"100%",minWidth:0,flex:"1 1 0%",overflowX:"auto",scrollbarWidth:"thin",borderRadius:radius}}>
 {items.map((item,i)=>{const Tag:any=item.url?"a":"button";return <Tag key={i} href={item.url||undefined} target={item.newTab?"_blank":undefined} rel={item.newTab?"noopener noreferrer":undefined} type={item.url?undefined:"button"} aria-current={currentIndex===i?"page":undefined} onPointerEnter={e=>{if(e.pointerType!=="touch"){setFocused(null);setHovered(i)}}} onBlur={()=>setFocused(null)} onClick={()=>setCurrent(i)} onFocus={e=>{if(e.currentTarget.matches(":focus-visible")){setHovered(null);setFocused(i)}e.currentTarget.scrollIntoView({block:"nearest",inline:"nearest",behavior:reduce?"auto":"smooth"})}} style={{position:"relative",isolation:"isolate",display:"flex",flex:"1 0 auto",alignItems:"center",justifyContent:"center",minHeight:46,padding:"12px 23px",boxSizing:"border-box",border:0,borderRadius:radius,background:"transparent",color:index===i?selected:foreground,fontFamily:"Inter, sans-serif",fontSize:14,fontWeight:500,lineHeight:"20px",letterSpacing:"-.012em",...font,textDecoration:"none",whiteSpace:"nowrap",cursor:"pointer",WebkitTapHighlightColor:"transparent",transition:"color 160ms ease"}}>
 {index===i&&<motion.span layoutId="active-pill" transition={reduce?{duration:0}:{type:"spring",stiffness:420,damping:36}} style={{position:"absolute",inset:0,borderRadius:radius,pointerEvents:"none",backgroundColor:pill,backgroundImage:"linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,0) 65%)",zIndex:-1,boxShadow:"inset 0 1px 0 rgba(255,255,255,.20),inset 0 0 0 1px rgba(255,255,255,.055),0 2px 4px rgba(0,0,0,.22)"}}/>}{item.label}</Tag>})}
 </motion.div></LayoutGroup></nav>
}
addPropertyControls(GlideNavigation,{
 items:{type:ControlType.Array,title:"Links",control:{type:ControlType.Object,controls:{label:{type:ControlType.String,title:"Label",defaultValue:"Link"},url:{type:ControlType.Link,title:"Destination",defaultValue:""},newTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false}}},defaultValue:defaults},
 active:{type:ControlType.Number,title:"Active Item",defaultValue:0,min:0,max:20,step:1,displayStepper:true},
 background:{type:ControlType.Color,title:"Surface",defaultValue:"#1C1D20"},
 foreground:{type:ControlType.Color,title:"Text",defaultValue:"#BFC2C8"},
 pill:{type:ControlType.Color,title:"Active Pill",defaultValue:"#37393E"},
 selected:{type:ControlType.Color,title:"Active Text",defaultValue:"#F7F8FA"},
 font:{type:ControlType.Font,title:"Typography",controls:"extended"},
 padding:{type:ControlType.Padding,title:"Padding",defaultValue:"6px"},
 radius:{type:ControlType.BorderRadius,title:"Radius",defaultValue:"999px"},
 gap:{type:ControlType.Number,title:"Link Gap",defaultValue:2,min:0,max:24,step:1,description:"Made by Design Supply  \n[Explore more components](https://dub.sh/dsw13)"}
})