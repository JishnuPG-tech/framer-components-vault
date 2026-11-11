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


type Slide = { image: { src: string; srcSet?: string; alt?: string }; title: string; link?: string; newTab?: boolean }
type Props = { slides: Slide[]; duration: number; intensity: number; origin: string; ratio: number; radius: string; padding: string; background: string; textColor: string; accent: string; thumbnails: boolean; showTitle: boolean; autoplay: boolean; interval: number; pauseOnHover: boolean; font: React.CSSProperties; style?: React.CSSProperties }
const defaults: Slide[] = [
{image:{src:"https://framerusercontent.com/images/E0yV8HRuAIsQUG43RQeP2qFtjd4.png",alt:"Glossy red anthurium against an oxblood backdrop"},title:"Anthurium"},
{image:{src:"https://framerusercontent.com/images/HdTTl8SAksfhFhhTsAEfq95g0o.png",alt:"Crumpled silver aluminium on an ivory studio surface"},title:"Aluminium"},
{image:{src:"https://framerusercontent.com/images/cSqt8ZwZlaX5yWGgB2cqiNcTw.png",alt:"Cobalt blue glass sculpture casting luminous caustics"},title:"Cobalt"},
{"image":{"src":"https://framerusercontent.com/images/PONYmqA2xJdN1FSEguzBtfwXuc.png","alt":"Amber glass shard with luminous caustics on orange"},"title":"Amber"},
{"image":{"src":"https://framerusercontent.com/images/z7IPoAgB4kmDygWyeBEVvyM5vY.png","alt":"Violet iris petals with a bright golden center"},"title":"Iris"},
{"image":{"src":"https://framerusercontent.com/images/kioLhWwL5Rk21MBXhElJ6lZx1E0.png","alt":"Chartreuse silk gathered in sculptural folds"},"title":"Silk"},
{"image":{"src":"https://framerusercontent.com/images/fdTS2rHdFtXH3fb1e7FMJXuEs.png","alt":"Glossy black obsidian with fractured silver edges"},"title":"Obsidian"},
{"image":{"src":"https://framerusercontent.com/images/lCgebdvR4gS4EQux1gCqdOXJHok.png","alt":"Iridescent abalone shell on a pale lilac surface"},"title":"Nacre"},
{"image":{"src":"https://framerusercontent.com/images/i5qNrqh8ubpeFGAkrkWBNIsjxuc.png","alt":"Oxidized copper folded on a petrol blue backdrop"},"title":"Copper"}
]
const hidden: React.CSSProperties = {position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clipPath:"inset(50%)",whiteSpace:"nowrap"}

type Point = {x:number;y:number}
type Scene = {image:HTMLImageElement;to:number;start:number;ms:number;origin:Point;seed:number}
function cover(ctx:CanvasRenderingContext2D,image:CanvasImageSource,w:number,h:number,zoom=1){
 const iw=(image as HTMLImageElement).naturalWidth||(image as HTMLCanvasElement).width
 const ih=(image as HTMLImageElement).naturalHeight||(image as HTMLCanvasElement).height
 if(!iw||!ih)return
 const scale=Math.max(w/iw,h/ih)*zoom
 ctx.drawImage(image,(w-iw*scale)/2,(h-ih*scale)/2,iw*scale,ih*scale)
}
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 880
 * @framerIntrinsicHeight 700
 * @framerDisableUnlink
 */
export default function InkRevealSlider(props:Props){
 const {slides=defaults,duration=.72,intensity=26,origin="pointer",ratio=1.5,radius="10px",padding="0px",background="#F1EFE9",textColor="#30322C",accent="#73765E",thumbnails=true,showTitle=false,autoplay=true,interval=4,pauseOnHover=true,font={},style}=props
 const items=React.useMemo(()=>slides.map((s,i)=>({...s,image:s?.image?.src?s.image:defaults[i%defaults.length].image})),[slides])
 const editor=RenderTarget.current()===RenderTarget.canvas
 const uid="bloom"+React.useId().replace(/[^a-zA-Z0-9]/g,"")
 const stage=React.useRef<HTMLButtonElement>(null),surface=React.useRef<HTMLCanvasElement>(null),baseImage=React.useRef<HTMLImageElement>(null),rail=React.useRef<HTMLDivElement>(null)
 const ready=React.useRef(new Map<string,HTMLImageElement>()),pending=React.useRef(new Map<string,Promise<HTMLImageElement>>())
 const scenes=React.useRef<Scene[]>([]),raf=React.useRef(0),ticket=React.useRef(0),selected=React.useRef(0),settled=React.useRef(0)
 const painted=React.useRef(false),geometry=React.useRef({w:880,h:586}),reduced=React.useRef(false),alive=React.useRef(true)
 const draw=React.useRef<(time:number)=>void>(()=>{}),navigateRef=React.useRef<(index:number,point?:Point)=>void>(()=>{})
 const pointer=React.useRef({x:0,y:0}),swiped=React.useRef(false),lastTap=React.useRef(0)
 const [index,setIndex]=React.useState(0),[rendered,setRendered]=React.useState(0),[hovered,setHovered]=React.useState(false),[focused,setFocused]=React.useState(false),[pageVisible,setPageVisible]=React.useState(true),[reduceMotion,setReduceMotion]=React.useState(false),[loading,setLoading]=React.useState(false),[error,setError]=React.useState("")
 const loadImage=React.useCallback((src:string)=>{
  const cached=ready.current.get(src);if(cached)return Promise.resolve(cached)
  const existing=pending.current.get(src);if(existing)return existing
  const promise=new Promise<HTMLImageElement>((resolve,reject)=>{
   const image=new Image();image.decoding="async"
   image.onload=()=>{const finish=()=>{ready.current.set(src,image);pending.current.delete(src);resolve(image)};if(image.decode)image.decode().then(finish,finish);else finish()}
   image.onerror=()=>{pending.current.delete(src);reject(new Error("Image unavailable"))}
   image.src=src
  });pending.current.set(src,promise);return promise
 },[])
 draw.current=(time:number)=>{
  const el=surface.current,ctx=el?.getContext("2d");if(!el||!ctx)return
  const {w,h}=geometry.current,dpr=Math.min(window.devicePixelRatio||1,2)
  if(el.width!==Math.round(w*dpr)||el.height!==Math.round(h*dpr)){el.width=Math.round(w*dpr);el.height=Math.round(h*dpr)}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1
  const layers=scenes.current
  // A completed layer completely covers everything beneath it.
  // Promote that image to the base; newer reveals keep their original clocks.
  let completed=-1
  for(let i=0;i<layers.length;i++)if(time-layers[i].start>=layers[i].ms)completed=i
  if(completed>=0){
   settled.current=layers[completed].to
   setRendered(settled.current)
   layers.splice(0,completed+1)
  }
  ctx.clearRect(0,0,w,h)
  const base=ready.current.get(items[settled.current]?.image.src)
  if(base)cover(ctx,base,w,h)
  else if(baseImage.current?.complete)cover(ctx,baseImage.current,w,h)
  for(const shot of layers){
   const progress=Math.max(0,Math.min(1,(time-shot.start)/shot.ms))
   const ease=1-Math.pow(1-progress,2.6)
   const x=shot.origin.x*w,y=shot.origin.y*h
   const reach=Math.hypot(Math.max(x,w-x),Math.max(y,h-y))+2
   const radius=reach*ease
   const edge=intensity*Math.sin(Math.PI*progress)*Math.min(1,radius/70)
   const drift=progress*.7
   ctx.save();ctx.beginPath()
   for(let i=0;i<=128;i++){
    const a=i/128*Math.PI*2
    const wave=Math.sin(a*3+shot.seed+drift)*.55+Math.sin(a*7-shot.seed*.7-drift*.6)*.3+Math.sin(a*11+shot.seed*.4+drift*.3)*.15
    const r=Math.max(0,radius+edge*wave)
    const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r
    if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)
   }
   ctx.closePath();ctx.clip()
   ctx.globalAlpha=Math.min(1,progress*18)
   cover(ctx,shot.image,w,h,1+.018*(1-ease))
   ctx.restore()
  }
  if(layers.length)raf.current=requestAnimationFrame(draw.current)
  else raf.current=0
 }
 const navigate=React.useCallback((requested:number,point?:Point)=>{
  if(editor||items.length<2)return
  const to=(requested%items.length+items.length)%items.length
  if(to===selected.current)return
  const id=++ticket.current,now=performance.now(),fast=now-lastTap.current<260
  lastTap.current=now;selected.current=to;setIndex(to);setError("")
  const start=(image:HTMLImageElement)=>{
   if(id!==ticket.current||!alive.current)return
   setLoading(false)
   const el=surface.current,button=stage.current;if(!el||!button)return
   const bounds=button.getBoundingClientRect();geometry.current={w:bounds.width,h:bounds.height}
   const {w,h}=geometry.current;if(!w||!h)return
   // New clicks add a live reveal. Existing reveals keep moving to completion.
   const time=performance.now(),isOverlapping=scenes.current.length>0
   cancelAnimationFrame(raf.current)
   if(isOverlapping){
    for(const layer of scenes.current){
     const progress=Math.max(0,Math.min(1,(time-layer.start)/layer.ms))
     const ms=Math.min(layer.ms,fast?360:460)
     layer.start=time-progress*ms
     layer.ms=ms
    }
   }
   const pos=origin==="pointer"&&point?{x:Math.max(0,Math.min(1,point.x/w)),y:Math.max(0,Math.min(1,point.y/h))}:origin==="center"?{x:.5,y:.5}:{x:requested>=settled.current ? .62 : .38,y:.52}
   scenes.current.push({image,to,start:time,ms:reduced.current?1:Math.max(220,duration*1000*(fast?.82:1)),origin:pos,seed:to*1.73})
   painted.current=true;el.style.opacity="1";draw.current(performance.now())
  }
  const cached=ready.current.get(items[to].image.src)
  if(cached)start(cached)
  else{setLoading(true);loadImage(items[to].image.src).then(start,()=>{if(id!==ticket.current||!alive.current)return;selected.current=settled.current;setIndex(settled.current);setLoading(false);setError("This image could not be loaded.")})}
 },[editor,items,duration,origin,loadImage])
 navigateRef.current=navigate
 React.useEffect(()=>{
  alive.current=true
  const media=window.matchMedia("(prefers-reduced-motion: reduce)")
  const sync=()=>{reduced.current=media.matches;setReduceMotion(media.matches);if(media.matches&&scenes.current.length){for(const layer of scenes.current)layer.ms=1;cancelAnimationFrame(raf.current);draw.current(performance.now()+1)}}
  sync();media.addEventListener("change",sync)
  const observer=new ResizeObserver(([entry])=>{if(entry.contentRect.width>0){geometry.current={w:entry.contentRect.width,h:entry.contentRect.height};if(painted.current&&!scenes.current.length)draw.current(performance.now())}})
  if(stage.current)observer.observe(stage.current)
  return()=>{alive.current=false;ticket.current++;observer.disconnect();media.removeEventListener("change",sync);cancelAnimationFrame(raf.current)}
 },[])
 React.useEffect(()=>{
  ticket.current++;cancelAnimationFrame(raf.current);scenes.current=[];painted.current=false;selected.current=0;settled.current=0;setIndex(0);setRendered(0);setLoading(false);setError("")
  if(surface.current)surface.current.style.opacity="0"
  if(!editor)items.forEach(item=>{loadImage(item.image.src).catch(()=>{})})
 },[items,editor,loadImage])
 React.useEffect(()=>{
  const sync=()=>setPageVisible(!document.hidden)
  sync();document.addEventListener("visibilitychange",sync)
  return()=>document.removeEventListener("visibilitychange",sync)
 },[])
 React.useEffect(()=>{
  if(!autoplay||(pauseOnHover&&hovered)||focused||!pageVisible||reduceMotion||loading||editor||items.length<2)return
  // A full interval starts after each selection and whenever hover/focus ends.
  const timer=window.setTimeout(()=>navigateRef.current(selected.current+1),Math.max(interval,duration+.3)*1000)
  return()=>window.clearTimeout(timer)
 },[autoplay,pauseOnHover,hovered,focused,pageVisible,reduceMotion,loading,editor,items.length,interval,duration,index])
 React.useEffect(()=>{
  const strip=rail.current,thumb=strip?.children[index] as HTMLElement|undefined;if(!strip||!thumb)return
  const left=thumb.offsetLeft-(strip.clientWidth-thumb.offsetWidth)/2
  strip.scrollTo({left:Math.max(0,left),behavior:reduced.current||editor?"auto":"smooth"})
 },[index,thumbnails,editor])
 const active=items[Math.min(index,Math.max(0,items.length-1))],image=items[Math.min(rendered,Math.max(0,items.length-1))]
 const chevron=(back:boolean)=><svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true"><g className="bloom-arrow-ink" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"><path d={back?"m10 6-6 6 6 6":"m14 6 6 6-6 6"}/><path className="bloom-shaft" d="M4 12h16" style={{transformOrigin:back?"4px 12px":"20px 12px"}}/></g></svg>
 const button:React.CSSProperties={appearance:"none",border:0,padding:0,width:48,height:48,background:"transparent",color:"inherit",borderRadius:24,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}
 return <div className={uid} role="region" aria-roledescription="carousel" aria-label="Image gallery" onPointerEnter={e=>{if(e.pointerType==="mouse"||e.pointerType==="pen")setHovered(true)}} onPointerLeave={()=>setHovered(false)} onPointerDownCapture={()=>setFocused(false)} onFocusCapture={e=>setFocused((e.target as HTMLElement).matches(":focus-visible"))} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setFocused(false)}} onKeyDown={e=>{if(e.altKey||e.metaKey||e.ctrlKey)return;if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();navigate(selected.current+(e.key==="ArrowRight"?1:-1))}else if(e.key==="Home"){e.preventDefault();navigate(0)}else if(e.key==="End"){e.preventDefault();navigate(items.length-1)}}} style={{width:"100%",height:"100%",minWidth:0,display:"flex",flexDirection:"column",boxSizing:"border-box",padding,background,color:textColor,fontFamily:"Inter, sans-serif",fontSize:14,fontWeight:500,lineHeight:1.4,letterSpacing:"-.015em",...font,...style}}>
 <style>{`
 .${uid} button,.${uid} a{-webkit-tap-highlight-color:transparent}
 .${uid} button:focus-visible,.${uid} a:focus-visible{outline:2px solid ${accent};outline-offset:3px}
 .${uid} .bloom-nav{touch-action:manipulation;opacity:.64;transition:opacity .18s ease}
 .${uid} .bloom-shaft{transform:scaleX(.68);transition:transform .24s cubic-bezier(.22,1,.36,1)}
 .${uid} .bloom-arrow-ink{transition:transform .24s cubic-bezier(.22,1,.36,1)}
 @media(hover:hover) and (pointer:fine){
 .${uid} .bloom-nav:hover{opacity:1}
 .${uid} .bloom-nav:hover .bloom-shaft{transform:scaleX(1)}
 .${uid} .bloom-prev:hover .bloom-arrow-ink{transform:translateX(-1.5px)}
 .${uid} .bloom-next:hover .bloom-arrow-ink{transform:translateX(1.5px)}
 }
 .${uid} .bloom-nav:active{opacity:.5}
 .${uid} .bloom-nav:active .bloom-arrow-ink{transform:translateX(0)}
 .${uid} .bloom-nav:disabled{opacity:.25;cursor:default}
 .${uid} .bloom-rail{scrollbar-width:none;overscroll-behavior-x:contain}
 .${uid} .bloom-rail::-webkit-scrollbar{display:none}
 .${uid} .bloom-thumb{touch-action:manipulation;transition:opacity .14s,transform .18s cubic-bezier(.2,.8,.2,1)}
 .${uid} .bloom-thumb:hover{opacity:1!important;transform:translateY(-2px)!important}
 .${uid} .bloom-thumb:active{transform:scale(.94)!important}
 .${uid} .bloom-title:hover{text-decoration:underline!important;text-underline-offset:4px;text-decoration-thickness:1px}
 @media(prefers-reduced-motion:reduce){.${uid} *{animation:none!important;transition:none!important;scroll-behavior:auto!important}.${uid} .bloom-thumb,.${uid} .bloom-arrow-ink,.${uid} .bloom-shaft{transform:none!important}}
 `}</style>
 <button ref={stage} type="button" aria-busy={loading} disabled={items.length<2} aria-label={active?"Next image. Selected: "+active.title:"Add images in component properties"} onPointerDown={e=>{pointer.current={x:e.clientX,y:e.clientY};swiped.current=false}} onPointerCancel={()=>{swiped.current=true}} onPointerUp={e=>{const dx=e.clientX-pointer.current.x,dy=e.clientY-pointer.current.y;if(e.pointerType!=="mouse"&&Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)){swiped.current=true;navigate(selected.current+(dx<0?1:-1))}}} onClick={e=>{if(swiped.current){swiped.current=false;return}const b=e.currentTarget.getBoundingClientRect();navigate(selected.current+1,e.detail?{x:e.clientX-b.left,y:e.clientY-b.top}:undefined)}} style={{display:"block",position:"relative",width:"100%",flex:"1 1 auto",minHeight:100,aspectRatio:String(ratio),border:0,padding:0,borderRadius:radius,overflow:"hidden",boxShadow:"0 12px 36px rgba(35,32,23,.065),0 1px 2px rgba(35,32,23,.04)",background:"#E8E9E5",cursor:items.length>1?"pointer":"default",touchAction:"pan-y",color:"inherit"}}>
 {image?<img ref={baseImage} src={image.image.src} srcSet={image.image.srcSet} sizes="(max-width:900px) 100vw, 900px" alt={image.image.alt||image.title} draggable={false} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",userSelect:"none"}}/>:<span>Add images to begin</span>}
 <canvas ref={surface} aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0,pointerEvents:"none"}}/>
 </button>
 {active&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,paddingTop:24,flexShrink:0,minWidth:0}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,maxWidth:"100%",minWidth:0}}>
 <button type="button" className="bloom-nav bloom-prev" style={button} disabled={items.length<2} aria-label="Previous image" onClick={()=>navigate(selected.current-1)}>{chevron(true)}</button>
 {thumbnails&&items.length>1?<div ref={rail} className="bloom-rail" role="group" aria-label="Choose image" style={{display:"flex",position:"relative",gap:8,padding:"6px 3px 8px",overflowX:"auto",minWidth:0,maxWidth:610,boxSizing:"border-box"}}>
 {items.map((item,i)=><button key={i} type="button" className="bloom-thumb" aria-label={"Show "+(item.title||"image "+(i+1))} aria-pressed={i===index} onClick={()=>navigate(i)} style={{appearance:"none",position:"relative",border:0,padding:0,width:60,height:54,flexShrink:0,background:"transparent",borderRadius:4,opacity:i===index?1:.84,transform:i===index?"translateY(-1px)":"none",cursor:"pointer"}}>
 <img src={item.image.src} alt="" draggable={false} style={{display:"block",width:"100%",height:44,objectFit:"cover",borderRadius:4,boxShadow:i===index?"0 1px 4px rgba(0,0,0,.12)":"none"}}/>
 <span aria-hidden="true" style={{position:"absolute",left:23,right:23,bottom:0,height:2,borderRadius:1,background:textColor,opacity:i===index?1:0,transform:i===index?"scaleX(1)":"scaleX(.4)",transition:"opacity .12s,transform .16s"}}/>
 </button>)}
 </div>:<span style={{minWidth:40,textAlign:"center",fontSize:12,fontVariantNumeric:"tabular-nums"}}>{String(index+1).padStart(2,"0")}</span>}
 <button type="button" className="bloom-nav bloom-next" style={button} disabled={items.length<2} aria-label="Next image" onClick={()=>navigate(selected.current+1)}>{chevron(false)}</button>

 </div>
 <div style={{display:"grid",gridTemplateColumns:showTitle?"minmax(0,1fr) 1px 58px":"1fr",alignItems:"center",justifyItems:showTitle?"stretch":"center",columnGap:showTitle?16:0,width:showTitle?192:"100%",maxWidth:"100%",minWidth:0,height:28,boxSizing:"border-box"}}>
 {showTitle&&<>{active.link?<a className="bloom-title" href={active.link} target={active.newTab?"_blank":undefined} rel={active.newTab?"noopener noreferrer":undefined} style={{color:"inherit",textDecoration:"none",display:"block",textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{active.title}</a>:<span style={{display:"block",textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{active.title}</span>}
 <span aria-hidden="true" style={{width:1,height:10,alignSelf:"center",background:"currentColor",opacity:.16,flexShrink:0}}/></>}
 <span aria-hidden="true" style={{display:"grid",gridTemplateColumns:"2ch 1ch 2ch",alignItems:"center",justifyContent:"center",textAlign:"center",columnGap:6,width:"100%",fontSize:12,fontWeight:400,fontVariantNumeric:"tabular-nums lining-nums",letterSpacing:".01em",whiteSpace:"nowrap"}}><span>{String(index+1).padStart(2,"0")}</span><span style={{opacity:.32}}>/</span><span style={{opacity:.32}}>{String(items.length).padStart(2,"0")}</span></span>
 </div>
 </div>}
 <span style={hidden} aria-live={autoplay&&!hovered&&!focused?"off":"polite"} aria-atomic="true">{error||(loading?"Loading ":"")+(active?.title||"Image")+" — "+(index+1)+" of "+items.length}</span>
 </div>
}
addPropertyControls(InkRevealSlider,{
 slides:{type:ControlType.Array,title:"Images",maxCount:20,defaultValue:defaults,control:{type:ControlType.Object,controls:{
 image:{type:ControlType.ResponsiveImage,title:"Image"},title:{type:ControlType.String,title:"Title",defaultValue:"Untitled"},
 link:{type:ControlType.Link,title:"Link"},newTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false}}}},
 duration:{type:ControlType.Number,title:"Duration",defaultValue:.72,min:.3,max:4,step:.05,unit:"s"},
 intensity:{type:ControlType.Number,title:"Ink Edge",defaultValue:26,min:0,max:90,step:1},
 origin:{type:ControlType.Enum,title:"Bloom From",options:["pointer","center"],optionTitles:["Click Point","Center"],defaultValue:"pointer"},
 ratio:{type:ControlType.Number,title:"Aspect Ratio",defaultValue:1.5,min:.5,max:3,step:.05},
 radius:{type:ControlType.BorderRadius,title:"Radius",defaultValue:"10px"},
 padding:{type:ControlType.Padding,title:"Padding",defaultValue:"0px"},
 background:{type:ControlType.Color,title:"Background",defaultValue:"#F1EFE9"},
 textColor:{type:ControlType.Color,title:"Text",defaultValue:"#30322C"},
 accent:{type:ControlType.Color,title:"Ink Accent",defaultValue:"#73765E"},
 font:{type:ControlType.Font,title:"Font",controls:"extended",defaultFontType:"sans-serif",defaultValue:{fontSize:"14px",lineHeight:"1.4em",letterSpacing:"-0.01em"}},
 showTitle:{type:ControlType.Boolean,title:"Show Title",defaultValue:false},
 autoplay:{type:ControlType.Boolean,title:"Autoplay",defaultValue:true},
 interval:{type:ControlType.Number,title:"Interval",defaultValue:4,min:2,max:30,step:1,unit:"s",hidden:p=>!p.autoplay},
 pauseOnHover:{type:ControlType.Boolean,title:"Pause on Hover",defaultValue:true,hidden:p=>!p.autoplay},
 thumbnails:{type:ControlType.Boolean,title:"Thumbnails",defaultValue:true,description:"Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"}
})


