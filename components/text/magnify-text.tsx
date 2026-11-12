
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

import { motion, useReducedMotion, useMotionValue, useSpring, useMotionValueEvent, useTransform } from "framer-motion"

interface Item { title: string; image?: {src:string;alt?:string}; link?: string; newTab?: boolean }
interface Props { mobileStrip:boolean; stripColor:string; stripBounce:number; heightMode:"content"|"frame"|"viewport"; items:Item[]; previewImage?:{src:string;alt?:string}; background:string; color:string; dimColor:string; font:any; baseSize:number; magnification:number; spread:number; spacing:number; imageWidth:number; imageRatio:number; imageRadius:number; imageOpacity:number; duration:number; padding:number; showImage:boolean; resting:number; style?:React.CSSProperties }
const labels=["Living room","Gift card","Big top","Mural","White hall","Sticker","Bright window","Halloween","Grey cover","Billboard","Evening street","Red street"]
const defaults:Item[]=labels.map(title=>({title}))
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 1160
 */
export default function Magnify(props:Props) {
 const {mobileStrip=true,stripColor="#eeede7",stripBounce=0.45,heightMode="frame",items=defaults,previewImage,background="#0b0b0b",color="#eeede7",dimColor="#363636",font={},baseSize=52,magnification=2.3,spread=1.6,spacing=12,imageWidth=340,imageRatio=0.67,imageRadius=18,imageOpacity=.8,duration=.28,padding=24,showImage=true,resting=6,style}=props
 const root=React.useRef<HTMLDivElement>(null)
 const [width,setWidth]=React.useState(1200)
 const [height,setHeight]=React.useState(800)
 const [target,setTarget]=React.useState<number|null>(null)
 const [point,setPoint]=React.useState<{x:number;y:number}|null>(null)
 const [focused,setFocused]=React.useState<number|null>(null)
 const reduced=useReducedMotion()
 const strip=React.useRef<HTMLDivElement>(null)
 const dragging=React.useRef(false)
 const progress=useMotionValue(Math.min(1,Math.max(0,resting/Math.max(1,(items?.length||1)-1))))
 const spring=useSpring(progress,{stiffness:260,damping:34-stripBounce*22,mass:.65})
 const thumbX=useTransform(spring,v=>v*Math.max(0,width-80))
 useMotionValueEvent(spring,"change",v=>{if(width<600&&mobileStrip){setFocused(null);setTarget(Math.max(0,Math.min(1,v))*Math.max(0,(items?.length||1)-1))}})
 React.useEffect(()=>{progress.set(Math.min(1,Math.max(0,resting/Math.max(1,(items?.length||1)-1))))},[resting,items?.length])
 function scrub(e:React.PointerEvent<HTMLDivElement>){e.stopPropagation();const rect=strip.current?.getBoundingClientRect();if(!rect)return;const raw=(e.clientX-rect.left-16)/Math.max(1,rect.width-32);const elastic=raw<0?Math.max(-.08,raw*.2):raw>1?Math.min(1.08,1+(raw-1)*.2):raw;progress.set(elastic);setFocused(null);setPoint(null)}
 function finishScrub(e:React.PointerEvent<HTMLDivElement>){e.stopPropagation();if(!dragging.current)return;dragging.current=false;const n=Math.max(1,(items?.length||1)-1);progress.set(Math.round(Math.max(0,Math.min(1,progress.get()))*n)/n);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}

 const rows:Item[]=Array.isArray(items)?items:[]
 React.useEffect(()=>{const el=root.current;if(!el)return;const observer=new ResizeObserver(()=>{setWidth(el.clientWidth);setHeight(el.clientHeight)});observer.observe(el);setWidth(el.clientWidth);return()=>observer.disconnect()},[])
 const active=focused??target??Math.min(Math.max(0,resting),Math.max(0,rows.length-1))
 const selected=rows[Math.round(active)]
 const asset=selected?.image||previewImage
 const src=typeof asset==="string"?asset:asset?.src
 const compact=width<600
 const stripSpace=compact&&mobileStrip?84:0
 const base=Math.min(baseSize,Math.max(18,width*.0435))
 const natural=rows.reduce((sum,_,i)=>sum+base*(1+(magnification-1)*Math.exp(-Math.pow((i-active)/Math.max(.2,spread),2)*1.6)*.65)+spacing,0)
 const fitScale=heightMode==="content"?1:Math.min(1,Math.max(1,height-padding*2-stripSpace)/Math.max(1,natural))
 const size=base*fitScale
 const rowGap=spacing*fitScale
 const iw=Math.min(imageWidth,width*(compact?.46:.31))
 const ih=Math.min(iw/Math.max(.3,imageRatio),heightMode==="content"?10000:Math.max(1,height-padding*2)*.65)
 const transition={duration:reduced?0:duration,ease:[.22,1,.36,1] as [number,number,number,number]}
 const contentHeight=rows.reduce((sum,_,i)=>sum+size*(1+(magnification-1)*Math.exp(-Math.pow((i-active)/Math.max(.2,spread),2)*1.6)*.65)+rowGap,0)+padding*2+stripSpace
 const boundsHeight=heightMode==="content"?contentHeight:height
 const rowHeights=rows.map((_,i)=>size*(1+(magnification-1)*Math.exp(-Math.pow((i-active)/Math.max(.2,spread),2)*1.6)*.65)+rowGap)
 const listHeight=rowHeights.reduce((sum,h)=>sum+h,0)
 const listStart=padding+Math.max(0,(boundsHeight-padding*2-stripSpace-listHeight)/2)
 const activeIndex=Math.max(0,Math.min(rows.length-1,Math.floor(active)))
 const centerAt=(i:number)=>rowHeights.slice(0,i).reduce((sum,h)=>sum+h,0)+(rowHeights[i]||0)/2
 const fraction=Math.max(0,Math.min(1,active-activeIndex))
 const mobileCenter=listStart+centerAt(activeIndex)*(1-fraction)+centerAt(Math.min(rows.length-1,activeIndex+1))*fraction
 const imageTop=Math.max(padding,Math.min(boundsHeight-stripSpace-ih-padding,(compact?mobileCenter:(point?.y??boundsHeight*.52))-ih*.45))
 const staticView=RenderTarget.current()===RenderTarget.canvas
 const imageX=Math.max(8,Math.min(width-iw-8,point?point.x+24:width*.63))
 function follow(e:React.PointerEvent<HTMLDivElement>){if(e.pointerType==="touch"||(compact&&mobileStrip))return;const box=e.currentTarget.getBoundingClientRect();const y=e.clientY-box.top;setPoint({x:e.clientX-box.left,y});const buttons=Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-magnify-item]"));let closest=0;let distance=Infinity;buttons.forEach((button,i)=>{const b=button.getBoundingClientRect();const d=Math.abs(e.clientY-(b.top+b.height/2));if(d<distance){distance=d;closest=i}});const b=buttons[closest]?.getBoundingClientRect();setTarget(b?closest+(e.clientY-b.top-b.height/2)/Math.max(1,b.height):closest)}
 return <motion.div initial={staticView||reduced?false:{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.1}} transition={{duration:reduced?0:.8,ease:[.22,1,.36,1]}} ref={root} onPointerMove={follow} onPointerLeave={()=>{if(!compact){setTarget(null);setPoint(null)}}} onKeyDown={e=>{if(e.key==="Escape"){setFocused(null);setTarget(null)} }} style={{width:"100%",...style,position:"relative",height:heightMode==="viewport"?"100dvh":heightMode==="content"?"auto":(style?.height??"100%"),display:"flex",flexDirection:"column",justifyContent:"center",background,overflow:"hidden",boxSizing:"border-box",padding:`${padding}px ${compact?12:padding}px ${padding+stripSpace}px`,isolation:"isolate"}}>
 {showImage&&src&&rows.length>0&&<motion.div aria-hidden initial={false} animate={{left:imageX,top:imageTop,opacity:imageOpacity}} transition={transition} style={{position:"absolute",width:iw,height:ih,maxHeight:"65%",borderRadius:imageRadius,overflow:"hidden",pointerEvents:"none",zIndex:0}}><motion.img initial={staticView||reduced?false:{opacity:0,scale:1.035}} animate={{opacity:1,scale:1}} transition={{duration:reduced?0:.35}} key={src} src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} /></motion.div>}
 <div role="list" aria-label="Magnify collection" style={{position:"relative",zIndex:1,width:"100%",flexShrink:0}}>
 {rows.map((item,i)=>{const strength=Math.exp(-Math.pow((i-active)/Math.max(.2,spread),2)*1.6);const fit=(width-(compact?24:padding*2))/Math.max(1,(item.title||"Untitled").length*.56);const fs=Math.min(size*(1+(magnification-1)*strength),fit);const common:any={onFocus:()=>setFocused(i),onBlur:()=>setFocused(null),onPointerDown:(e:React.PointerEvent)=>{if(e.pointerType==="touch"){setTarget(i);const box=root.current?.getBoundingClientRect();if(box)setPoint({x:width*.55,y:e.clientY-box.top})}},onClick:()=>setTarget(i),"data-magnify-item":true,"aria-label":item.title||"Untitled",style:{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",padding:0,border:0,background:"transparent",textDecoration:"none",cursor:item.link?"pointer":"default",fontFamily:"Inter, sans-serif",fontWeight:300,...font,lineHeight:1.12,letterSpacing:"-.045em",position:"relative",whiteSpace:"nowrap",boxSizing:"border-box",WebkitTapHighlightColor:"transparent"},initial:false,animate:{fontSize:fs,height:size*(1+(magnification-1)*strength*.65)+rowGap,color:strength>.65?color:dimColor,opacity:.55+.45*strength},transition}
 return <motion.div initial={staticView||reduced?false:{opacity:0,y:12,filter:"blur(4px)"}} whileInView={{opacity:1,y:0,filter:"blur(0px)"}} viewport={{once:true}} transition={{duration:reduced?0:.65,delay:reduced?0:Math.min(i*.035,.35),ease:[.22,1,.36,1]}} role="listitem" key={i}>{item.link?<motion.a {...common} href={item.link} target={item.newTab?"_blank":undefined} rel={item.newTab?"noopener noreferrer":undefined}>{item.title||"Untitled"}</motion.a>:<motion.button {...common} type="button">{item.title||"Untitled"}</motion.button>}</motion.div>})}
 </div>
 {compact&&mobileStrip&&rows.length>1&&<div style={{position:"absolute",left:24,right:24,bottom:20,zIndex:3,display:"flex",flexDirection:"column",gap:12,alignItems:"center"}}>
 <div ref={strip} role="slider" tabIndex={0} aria-label="Drag to explore items" aria-valuemin={1} aria-valuemax={rows.length} aria-valuenow={Math.round(active)+1} aria-valuetext={selected?.title} aria-orientation="horizontal"
 onPointerDown={e=>{e.preventDefault();e.stopPropagation();dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);scrub(e)}}
 onPointerMove={e=>{e.stopPropagation();if(dragging.current)scrub(e)}} onPointerUp={finishScrub} onPointerCancel={finishScrub} onClick={e=>{e.preventDefault();e.stopPropagation()}}
 onKeyDown={e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();e.stopPropagation();const n=rows.length-1;progress.set(e.key==="Home"?0:e.key==="End"?1:Math.max(0,Math.min(1,progress.get()+(e.key==="ArrowRight"?1:-1)/n)))}}}
 style={{position:"relative",height:44,width:"100%",borderRadius:24,background:"transparent",touchAction:"none",userSelect:"none",cursor:"ew-resize"}}>

 <div aria-hidden style={{position:"absolute",left:16,right:16,top:22,height:1,background:stripColor,opacity:.3,pointerEvents:"none"}}/>
 <motion.div aria-hidden style={{position:"absolute",left:0,top:6,width:32,height:32,borderRadius:16,border:"1px solid rgba(255,255,255,.45)",boxSizing:"border-box",background:"linear-gradient(165deg, rgba(255,255,255,.68) 0%, rgba(255,255,255,.22) 46%, rgba(255,255,255,.08) 52%, rgba(255,255,255,.28) 100%)",backdropFilter:"blur(16px) saturate(180%)",WebkitBackdropFilter:"blur(16px) saturate(180%)",x:reduced?undefined:thumbX,boxShadow:"inset 0 1px 1px rgba(255,255,255,.8), inset 0 -1px 2px rgba(255,255,255,.18), 0 4px 12px rgba(0,0,0,.25)",display:"flex",alignItems:"center",justifyContent:"center",gap:3,...(reduced?{left:Math.max(0,Math.min(1,progress.get()))*(width-80)}:{})}}>
 {[0,1,2].map(n=><span key={n} style={{height:10,width:1,background:stripColor,opacity:.7}}/>)}
 </motion.div>
 </div>
 <span aria-hidden style={{fontFamily:"Inter, sans-serif",fontSize:10,letterSpacing:".14em",textTransform:"uppercase",color:stripColor,opacity:.5}}>Drag to explore</span>
 </div>}
 </motion.div>
}
Magnify.defaultProps={mobileStrip:true,stripColor:"#eeede7",stripBounce:.45,heightMode:"frame",items:defaults,background:"#0b0b0b",color:"#eeede7",dimColor:"#363636",baseSize:52,magnification:2.3,spread:1.6,spacing:12,imageWidth:340,imageRatio:.67,imageRadius:18,imageOpacity:.8,duration:.28,padding:24,showImage:true,resting:6}
addPropertyControls(Magnify,{
 mobileStrip:{type:ControlType.Boolean,title:"Mobile strip",defaultValue:true},
 stripColor:{type:ControlType.Color,title:"Strip handle",defaultValue:"#eeede7",hidden:p=>!p.mobileStrip},
 stripBounce:{type:ControlType.Number,title:"Strip bounce",min:0,max:1,step:.05,defaultValue:.45,hidden:p=>!p.mobileStrip},
 heightMode:{type:ControlType.Enum,title:"Height mode",options:["content","frame","viewport"],optionTitles:["Fit content","Fit frame","Fit viewport"],defaultValue:"frame",description:"Fit frame follows the layer’s height. Fit viewport uses the screen height. Text scales down to keep all items visible."},
 items:{type:ControlType.Array,title:"Items",control:{type:ControlType.Object,controls:{title:{type:ControlType.String,title:"Title",defaultValue:"New item"},image:{type:ControlType.ResponsiveImage,title:"Image"},link:{type:ControlType.Link,title:"Link",description:"Choose a page or paste a destination URL."},newTab:{type:ControlType.Boolean,title:"New tab",defaultValue:false}}},defaultValue:defaults},
 font:{type:ControlType.Font,title:"Font",controls:"extended"},
 baseSize:{type:ControlType.Number,title:"Text size",min:16,max:120,defaultValue:52,unit:"px"},
 magnification:{type:ControlType.Number,title:"Magnify",min:1,max:4,step:.1,defaultValue:2.3},
 spread:{type:ControlType.Number,title:"Reach",min:.3,max:5,step:.1,defaultValue:1.6},
 spacing:{type:ControlType.Number,title:"Row gap",min:0,max:60,defaultValue:12,unit:"px"},
 color:{type:ControlType.Color,title:"Active",defaultValue:"#eeede7"},
 dimColor:{type:ControlType.Color,title:"Inactive",defaultValue:"#363636"},
 background:{type:ControlType.Color,title:"Background",defaultValue:"#0b0b0b"},
 showImage:{type:ControlType.Boolean,title:"Show image",defaultValue:true},
 previewImage:{type:ControlType.ResponsiveImage,title:"Fallback image",hidden:p=>!p.showImage},
 imageWidth:{type:ControlType.Number,title:"Image width",min:80,max:800,defaultValue:340,hidden:p=>!p.showImage},
 imageRatio:{type:ControlType.Number,title:"Image ratio",min:.3,max:2,step:.01,defaultValue:.67,hidden:p=>!p.showImage},
 imageRadius:{type:ControlType.Number,title:"Corners",min:0,max:100,defaultValue:18,hidden:p=>!p.showImage},
 imageOpacity:{type:ControlType.Number,title:"Image opacity",min:0,max:1,step:.05,defaultValue:.8,hidden:p=>!p.showImage},
 duration:{type:ControlType.Number,title:"Motion time",min:0,max:1,step:.05,defaultValue:.28,unit:"s"},
 padding:{type:ControlType.Number,title:"Padding",min:0,max:160,defaultValue:24},
 resting:{type:ControlType.Number,title:"Resting item",min:0,max:50,step:1,defaultValue:6,description:"Zero-based item shown at rest. Hover to magnify; tap on touch screens. Tab to focus; Escape to reset."}
})
