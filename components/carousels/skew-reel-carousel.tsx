
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

interface Item { image: any; caption: string; backdropText?: string; backdropColor?: string; backgroundColor?: string; link?: string; newTab?: boolean }
interface Props { titleFont: any; titleSize: number; titleAlign: string; liquid: boolean; liquidStrength: number; items: Item[]; background: string; textColor: string; title: string; titleColor: string; cardWidth: number; gap: number; ratio: number; radius: number; smoothing: number; inactiveScale: number; inactiveOpacity: number; wheel: boolean; captions: boolean; startIndex: number; font: any; style?: React.CSSProperties }
const defaults: Item[] = [{"image":"https://images.unsplash.com/photo-1533007716222-4b465613a984?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85","caption":"macro photography of dropping ice cube in cup"},{"image":"https://images.unsplash.com/photo-1549652127-2e5e59e86a7a?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85","caption":"liquid in clear plastic cup"},{"image":"https://images.unsplash.com/photo-1642647391072-6a2416f048e5?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85","caption":"a glass filled with liquid and ice on top of a table"},{"image":"https://images.unsplash.com/photo-1621221814951-fa755dd0c993?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85","caption":"clear drinking glass with brown liquid on table"},{"image":"https://images.unsplash.com/photo-1562447457-579fc34967fb?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85","caption":"Milk pouring into a glass of iced coffee on a wooden coaster"}]
const wrap=(v:number,n:number)=>((v%n)+n)%n
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 680
 */
export default function SkewReel(props: Partial<Props>) {
 const p={titleFont:{fontFamily:"Inter, sans-serif"},titleSize:156,titleAlign:"center",liquid:true,liquidStrength:32,background:"#1b1b1b",textColor:"#ddddda",title:"Captured",titleColor:"#777773",cardWidth:250,gap:80,ratio:1.5,radius:4,smoothing:0.085,inactiveScale:0.8,inactiveOpacity:0.42,wheel:true,captions:true,startIndex:2,font:{fontFamily:"Inter, sans-serif",fontSize:12,fontWeight:500},...props}
 const items=p.items?.length?p.items:defaults
 const root=React.useRef<HTMLDivElement>(null)

 const themeA=React.useRef<HTMLDivElement>(null)
 const themeB=React.useRef<HTMLDivElement>(null)
 const titleA=React.useRef<HTMLAnchorElement>(null)
 const titleB=React.useRef<HTMLAnchorElement>(null)
 const cards=React.useRef<(HTMLDivElement|null)[]>([])
 const motion=React.useRef({target:0,current:0,previous:0,drag:false,x:0,y:0,moved:false,base:0})
 const [size,setSize]=React.useState({width:1200,height:680})
 const [active,setActive]=React.useState(p.startIndex)
 const staticMode=RenderTarget.current()===RenderTarget.canvas
 const [reduced,setReduced]=React.useState(false)
 const w=Math.min(p.cardWidth,size.width*0.64,(size.height-100)/p.ratio)
 const step=Math.max(1,w+p.gap*Math.min(1,size.width/1200))
 const count=items.length
 const copies=Math.ceil(7/count)*count
 const slots=Array.from({length:copies},(_,i)=>i-Math.floor(copies/2))
 React.useEffect(()=>{const el=root.current;if(!el)return;const ro=new ResizeObserver(([e])=>setSize({width:e.contentRect.width,height:e.contentRect.height}));ro.observe(el);return()=>ro.disconnect()},[])
 React.useEffect(()=>{const mq=window.matchMedia("(prefers-reduced-motion: reduce)");const change=()=>setReduced(mq.matches);change();mq.addEventListener("change",change);return()=>mq.removeEventListener("change",change)},[])
 React.useEffect(()=>{motion.current.target=0;motion.current.current=0},[step,p.startIndex,count])
 React.useEffect(()=>{
  if(staticMode)return
  let frame=0,last=0
  const tick=(time:number)=>{
   const m=motion.current;const dt=Math.min(3,(time-last)/16.667||1);last=time
   m.current+=(m.target-m.current)*(reduced?1:1-Math.pow(1-p.smoothing,dt))
   const velocity=(m.current-m.previous)/dt;m.previous=m.current
   const liquidAmount=p.liquid&&!reduced?Math.min(1,Math.abs(velocity)/22):0

   const progress=-m.current/step+p.startIndex
   const lower=Math.floor(progress),mix=progress-lower
   const a=items[wrap(lower,count)],b=items[wrap(lower+1,count)]
   if(themeA.current)themeA.current.style.background=a.backgroundColor||p.background
   if(themeB.current){themeB.current.style.background=b.backgroundColor||p.background;themeB.current.style.opacity=String(mix)}
   ;[[titleA.current,a,1-mix],[titleB.current,b,mix]].forEach(([el,item,opacity]:any[])=>{
    if(!el)return
    el.textContent=item.backdropText??p.title
    if(item.link)el.setAttribute("href",item.link);else el.removeAttribute("href")
    el.target=item.newTab?"_blank":"_self"
    el.style.pointerEvents=item.link&&opacity>0.5?"auto":"none"
    el.style.color=item.backdropColor||p.titleColor
    el.style.opacity=String(opacity)
    el.style.transform="translateY(-50%)"
   })
   const period=copies*step
   slots.forEach((slot,i)=>{
    const el=cards.current[i];if(!el)return
    const position=wrap(slot*step+m.current+period/2,period)-period/2
    const index=wrap(slot-Math.round((slot*step+m.current-position)/period)*copies+p.startIndex,count)
    // Each rendered slot updates its content only when crossing the offscreen seam.
    const img=el.querySelector("img"),label=el.querySelector("[data-caption]")
    const item=items[index];const src=typeof item.image==="string"?item.image:item.image?.src
    if(img&&img.getAttribute("src")!==src){el.querySelectorAll("img").forEach(image=>image.setAttribute("src",src||""));img.setAttribute("alt",item.caption||"Gallery image")}
    if(label)label.textContent=item.caption||""
    const link=el.querySelector("a");if(link){if(item.link)link.setAttribute("href",item.link);else link.removeAttribute("href");link.target=item.newTab?"_blank":"_self"}
    const focus=Math.max(0,1-Math.abs(position)/step)
    const scale=p.inactiveScale+(1-p.inactiveScale)*focus
    el.style.transform="translate3d("+position+"px,0,0) scale("+scale+")"
    el.style.filter="brightness("+(p.inactiveOpacity+(1-p.inactiveOpacity)*focus)+")"
    el.style.visibility=Math.abs(position)<step*2.5?"visible":"hidden"
    const bend=p.liquid&&!reduced?Math.sign(velocity)*liquidAmount*Math.min(w*0.28,p.liquidStrength*0.5):0
    const strips=el.querySelector<HTMLElement>("[data-bend]")
    if(strips){strips.style.opacity=Math.abs(bend)>0.1?"1":"0";Array.from(strips.children).forEach((strip:HTMLElement,j)=>{strip.style.transform="translateX("+(bend*Math.sin(Math.PI*(j+0.5)/32))+"px)"})}
    if(img)img.style.opacity=Math.abs(bend)>0.1?"0":"1"
   })
   const next=wrap(Math.round(-m.current/step)+p.startIndex,count)
   setActive(a=>a===next?a:next)
   frame=requestAnimationFrame(tick)
  };frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)
 },[step,copies,count,p.startIndex,p.smoothing,p.inactiveScale,p.inactiveOpacity,reduced,staticMode,items,p.liquid,p.liquidStrength,p.title,p.background,p.titleColor,size.width])
 React.useEffect(()=>{
  const el=root.current;if(!el||!p.wheel||staticMode)return
  const handle=(e:WheelEvent)=>{if(e.ctrlKey)return;e.preventDefault();motion.current.target-=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*(e.deltaMode===1?16:1)}
  el.addEventListener("wheel",handle,{passive:false});return()=>el.removeEventListener("wheel",handle)
 },[p.wheel,staticMode])
 const guardLink=(e:React.MouseEvent<HTMLAnchorElement>)=>{if(e.detail>0&&motion.current.moved)e.preventDefault()}
 const titleStyle:React.CSSProperties={position:"absolute",left:16,right:16,top:"50%",transform:"translateY(-50%)",display:"flex",justifyContent:p.titleAlign==="left"?"flex-start":p.titleAlign==="right"?"flex-end":"center",lineHeight:1.05,...p.titleFont,fontSize:Math.min(p.titleSize,p.titleSize*size.width/1200),color:items[wrap(p.startIndex,count)].backdropColor||p.titleColor,whiteSpace:"nowrap",textDecoration:"none",userSelect:"none",WebkitUserSelect:"none"}
 const advance=(n:number)=>{motion.current.target=(Math.round(motion.current.target/step)-n)*step}
 return <div ref={root} role="region" aria-label="Skew photo reel" aria-roledescription="carousel" tabIndex={0}
 onKeyDown={e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();advance(e.key==="ArrowRight"?1:-1)}}}
 onPointerDown={e=>{if(e.button!==0)return;if(e.pointerType==="mouse")e.preventDefault();const m=motion.current;m.drag=true;m.x=e.clientX;m.y=e.clientY;m.moved=false;m.base=m.target}}
 onPointerMove={e=>{const m=motion.current;if(m.drag){if(Math.hypot(e.clientX-m.x,e.clientY-m.y)>6){m.moved=true;root.current?.setPointerCapture(e.pointerId)}m.target=m.base+e.clientX-m.x}}}
 onPointerUp={e=>{motion.current.drag=false;if(root.current?.hasPointerCapture(e.pointerId))root.current.releasePointerCapture(e.pointerId);motion.current.target=Math.round(motion.current.target/step)*step}}
 onPointerCancel={()=>{motion.current.drag=false}}
 style={{width:"100%",height:"100%",minHeight:200,position:"relative",overflow:"hidden",background:items[wrap(p.startIndex,count)].backgroundColor||p.background,color:p.textColor,touchAction:"pan-y",cursor:"grab",outlineOffset:-4,...p.style,userSelect:"none",WebkitUserSelect:"none"}}>
 <div ref={themeA} aria-hidden style={{position:"absolute",inset:0,background:items[wrap(p.startIndex,count)].backgroundColor||p.background,pointerEvents:"none"}}/>
 <div ref={themeB} aria-hidden style={{position:"absolute",inset:0,opacity:0,pointerEvents:"none"}}/>
 <a ref={titleA} href={items[wrap(p.startIndex,count)].link||undefined} target={items[wrap(p.startIndex,count)].newTab?"_blank":undefined} rel="noopener noreferrer" draggable={false} onClick={guardLink} style={{...titleStyle,pointerEvents:items[wrap(p.startIndex,count)].link?"auto":"none"}}>{items[wrap(p.startIndex,count)].backdropText??p.title}</a>
 <a ref={titleB} rel="noopener noreferrer" draggable={false} onClick={guardLink} style={{...titleStyle,opacity:0,pointerEvents:"none"}}/>

 <div style={{position:"absolute",left:"50%",top:"50%",width:w,height:w*p.ratio+28,marginLeft:-w/2,marginTop:-(w*p.ratio+28)/2}}>
 {slots.map((slot,i)=>{const item=items[wrap(slot+p.startIndex,count)];return <div key={slot} ref={el=>{cards.current[i]=el}} style={{position:"absolute",left:0,top:0,width:w,transform:"translateX("+slot*step+"px) scale("+(slot===0?1:p.inactiveScale)+")",filter:"brightness("+(slot===0?1:p.inactiveOpacity)+")",visibility:Math.abs(slot)<2.5?"visible":"hidden",willChange:"transform, opacity",transformOrigin:"50% 50%"}}>
 <a href={item.link||undefined} target={item.newTab?"_blank":undefined} rel="noopener noreferrer" draggable={false} onClick={guardLink} style={{display:"block",color:"inherit",textDecoration:"none",cursor:item.link?"pointer":"grab"}}><img src={typeof item.image==="string"?item.image:item.image?.src} alt={item.caption||"Gallery image"} draggable={false} style={{display:"block",width:"100%",height:w*p.ratio,objectFit:"cover",borderRadius:p.radius,userSelect:"none",pointerEvents:"none"}}/>
 <div data-bend aria-hidden style={{position:"absolute",left:0,top:0,width:w,height:w*p.ratio,opacity:0,pointerEvents:"none"}}>
 {Array.from({length:32},(_,j)=><div key={j} style={{position:"absolute",left:0,top:j*w*p.ratio/32,width:w,height:w*p.ratio/32+0.75,overflow:"hidden",willChange:"transform"}}><img src={typeof item.image==="string"?item.image:item.image?.src} alt="" draggable={false} style={{position:"absolute",left:0,top:-j*w*p.ratio/32,width:w,height:w*p.ratio,objectFit:"cover",pointerEvents:"none",userSelect:"none"}}/></div>)}
 </div>
 {p.captions&&<div data-caption style={{...p.font,pointerEvents:"none",userSelect:"none",WebkitUserSelect:"none",fontFamily:p.font?.fontFamily||"Inter, sans-serif",color:p.textColor,marginTop:12,lineHeight:1.4}}>{item.caption}</div>}
 </a></div>})}
 </div>
 <span aria-live="polite" style={{pointerEvents:"none",position:"absolute",width:1,height:1,overflow:"hidden",clipPath:"inset(50%)"}}>{items[active]?.caption} — {active+1} of {count}</span>
 </div>
}
addPropertyControls(SkewReel,{
 titleFont:{type:ControlType.Font,title:"Title font",controls:"extended",defaultValue:{fontSize:"156px"}},
 titleSize:{type:ControlType.Number,title:"Title size",defaultValue:156,min:16,max:400,unit:"px"},
 titleAlign:{type:ControlType.Enum,title:"Title alignment",options:["left","center","right"],defaultValue:"center"},
 liquid:{type:ControlType.Boolean,title:"Curved drag",defaultValue:true},
 liquidStrength:{type:ControlType.Number,title:"Bend amount",defaultValue:32,min:0,max:120,step:1,hidden:p=>!p.liquid},
 items:{type:ControlType.Array,title:"Images",control:{type:ControlType.Object,controls:{image:{type:ControlType.ResponsiveImage,title:"Image"},caption:{type:ControlType.String,title:"Caption"},backdropText:{type:ControlType.String,title:"Backdrop text"},backdropColor:{type:ControlType.Color,title:"Text color"},backgroundColor:{type:ControlType.Color,title:"Background"},link:{type:ControlType.Link,title:"Link"},newTab:{type:ControlType.Boolean,title:"New tab",defaultValue:false}}},defaultValue:defaults},
 title:{type:ControlType.String,title:"Fallback title",defaultValue:"Captured"},
 background:{type:ControlType.Color,title:"Fallback background",defaultValue:"#1b1b1b"},
 titleColor:{type:ControlType.Color,title:"Fallback title color",defaultValue:"#777773"},
 textColor:{type:ControlType.Color,title:"Caption color",defaultValue:"#ddddda"},
 font:{type:ControlType.Font,title:"Caption font",controls:"extended",defaultValue:{fontSize:"12px"}},
 cardWidth:{type:ControlType.Number,title:"Card width",defaultValue:250,min:80,max:700,unit:"px"},
 ratio:{type:ControlType.Number,title:"Height ratio",defaultValue:1.5,min:0.5,max:2.5,step:0.05},
 gap:{type:ControlType.Number,title:"Spacing",defaultValue:80,min:8,max:240,unit:"px"},
 radius:{type:ControlType.Number,title:"Corners",defaultValue:4,min:0,max:80,unit:"px"},
 smoothing:{type:ControlType.Number,title:"Response",defaultValue:0.085,min:0.02,max:0.4,step:0.005},
 inactiveScale:{type:ControlType.Number,title:"Side scale",defaultValue:0.8,min:0.4,max:1,step:0.01},
 inactiveOpacity:{type:ControlType.Number,title:"Side opacity",defaultValue:0.42,min:0.05,max:1,step:0.01},
 captions:{type:ControlType.Boolean,title:"Captions",defaultValue:true},
 wheel:{type:ControlType.Boolean,title:"Wheel scroll",defaultValue:true},
 startIndex:{type:ControlType.Number,title:"Start image",defaultValue:2,min:0,max:99,step:1}
})
