// Copyright AL Webdesign Studio · https://alwebdesignstudio.com/
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

type Picture={src?:string;url?:string;srcSet?:string;alt?:string}
type Mark={title?:string;text?:string;x?:number;y?:number}
interface Props {image?:Picture;alt?:string;imageRatio?:number;focusX?:number;focusY?:number;marks?:Mark[];labelFont?:React.CSSProperties;eyebrowFont?:React.CSSProperties;navigationFont?:React.CSSProperties;background?:string;textColor?:string;eyebrowColor?:string;lineColor?:string;photoLineColor?:string;corners?:number;speed?:number;stagger?:number;hold?:number;loop?:boolean;reducedMotion?:boolean;fullViewport?:boolean;showReload?:boolean;reloadLabel?:string;showLibrary?:boolean;libraryLink?:string;price?:string;style?:React.CSSProperties}
const PHOTO:Picture & {src:string;alt:string}={src:"https://framerusercontent.com/images/ilARe7WfUlrYOExBoUZqJVRtgs.webp",alt:"Sleeping newborn in a knitted brown outfit and pompom hat"}
const MARKS:Mark[]=[{title:"CUTE",text:"POMPOM HAT",x:46,y:14},{title:"TINY",text:"CURLED FINGERS",x:24,y:33},{title:"SOFT",text:"COSY KNIT",x:43,y:55},{title:"SNUG",text:"WARM BOOTIES",x:51,y:88}]
const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v))
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t)}
const out=(v:number)=>v>=1?1:1-Math.pow(2,-10*clamp(v))
const hidden:React.CSSProperties={position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clipPath:"inset(50%)",whiteSpace:"nowrap",border:0}
const pill:React.CSSProperties={display:"inline-flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,.92)",border:"1px solid rgba(0,0,0,.13)",borderRadius:24,boxShadow:"0 2px 8px rgba(0,0,0,.04)",color:"#62615E"}
const css=`[data-al-annotations] *{box-sizing:border-box}[data-al-annotations] figure:focus{outline:none}[data-al-annotations] .al-an-focus{opacity:0}[data-al-annotations] figure[data-keyboard=true]:focus-visible .al-an-focus{opacity:1}[data-al-annotations] button:focus-visible,[data-al-annotations] a:focus-visible{outline:2px solid #8A847B;outline-offset:4px}`
/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ALAnnotationLines(props:Props){
 const {image=PHOTO,alt=PHOTO.alt,imageRatio=.8,focusX=50,focusY=50,marks=MARKS,labelFont,eyebrowFont,navigationFont,background="#FFFFFF",textColor="#777169",eyebrowColor="#797168",lineColor="#9A938A",photoLineColor="rgba(255,255,255,.92)",corners=6,speed=1,stagger=.75,hold=2.5,loop=true,reducedMotion=false,fullViewport=true,showReload=true,reloadLabel="Restart animation",showLibrary=false,libraryLink="/",price="Free",style}=props
 const isStatic=useIsStaticRenderer(),uid=React.useId().replace(/:/g,"")
 const marksKey=JSON.stringify((marks.length?marks:MARKS).slice(0,6).map(({title,text,x,y})=>({title,text,x,y})))
 const items=React.useMemo<Mark[]>(()=>JSON.parse(marksKey),[marksKey])
 const root=React.useRef<HTMLElement>(null),figure=React.useRef<HTMLElement>(null),photo=React.useRef<HTMLImageElement>(null),groups=React.useRef<(SVGGElement|null)[]>([]),labels=React.useRef<(HTMLDivElement|null)[]>([]),announce=React.useRef<HTMLSpanElement>(null)
 const replay=React.useRef(()=>{}),finish=React.useRef(()=>{}),timeline=React.useRef({time:0,first:true,paused:false})
 const [size,setSize]=React.useState({width:1200,height:900}),[ready,setReady]=React.useState(false)
 const src=image.src||image.url||PHOTO.src
 const gutter=clamp(size.width*.025,16,32),gap=size.width<640?.08:.17,col=size.width<640?.55:.45,ratio=clamp(imageRatio,.5,1.5)
 const h=Math.max(80,Math.min(780,size.height-(!isStatic&&(showReload||showLibrary)?152:64),(size.width-gutter*2)/(ratio+gap+col))),pw=h*ratio,labelX=h*(ratio+gap),cw=h*(ratio+gap+col),lw=h*col,eyebrow=Math.max(9,(parseFloat(String(eyebrowFont?.fontSize||12))||12)*h/780)
 const geometry=React.useMemo(()=>items.map(m=>{const x=clamp((m.x??50)/100,.02,.96)*pw,y=clamp((m.y??50)/100,.03,.91)*h,start=x+11,end=labelX-Math.max(12,24*h/780),inside=Math.max(0,pw-start),outside=Math.max(0,end-Math.max(pw,start));return{x,y,start,end,inside,outside}}),[items,pw,h,labelX])
 React.useEffect(()=>{const el=root.current;if(!el)return;const measure=()=>{const r=el.getBoundingClientRect();if(r.width&&r.height)setSize(p=>p.width===r.width&&p.height===r.height?p:{width:r.width,height:r.height})};measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect()},[])
 React.useEffect(()=>{
  timeline.current={time:0,first:true,paused:false};setReady(false)
  const img=photo.current;if(!img)return;let cancelled=false
  const loaded=()=>{const selected=img.currentSrc;Promise.resolve(img.decode?.()).catch(()=>{}).then(()=>{if(!cancelled&&img.currentSrc===selected)setReady(true)})}
  const failed=()=>{if(!cancelled)setReady(true)}
  img.addEventListener("load",loaded);img.addEventListener("error",failed)
  if(img.complete){if(img.naturalWidth)loaded();else failed()}
  return()=>{cancelled=true;img.removeEventListener("load",loaded);img.removeEventListener("error",failed)}
 },[src,image.srcSet])
 React.useEffect(()=>{
  const el=figure.current,host=root.current,img=photo.current;if(!el||!host||!img)return
  const clock=timeline.current,media=window.matchMedia("(prefers-reduced-motion: reduce)");let reduced=isStatic||reducedMotion||media.matches,raf=0,last=0,visible=isStatic,dead=false
  const all=.4+(items.length-1)*stagger+1.3,fadeStart=all+hold,end=fadeStart+.5
  const paint=(t:number)=>{
   const fade=reduced?1:1-smooth((t-fadeStart)/.5);img.style.opacity=String(!clock.first||reduced?1:smooth(t/.9))
   host.dataset.phase=reduced||clock.paused?"still":t<.4?"photo":t<all?"drawing":t<fadeStart?"hold":"out";host.dataset.time=t.toFixed(2);host.dataset.reduced=String(reduced)
   geometry.forEach((g,i)=>{const group=groups.current[i],label=labels.current[i];if(!group||!label)return;const local=t-(.4+i*stagger),ring=clamp(local/.5),travel=out(local/.9)*(g.inside+g.outside),opacity=reduced?1:local<0?0:fade
    group.style.opacity=String(opacity);const [circle,dot,lineA,lineB]=Array.from(group.children) as SVGElement[]
    circle.setAttribute("r",String(reduced?5.5:3+2.5*out(ring)));circle.style.opacity=dot.style.opacity=String(reduced?1:smooth(ring))
    lineA.setAttribute("stroke-dashoffset",String(reduced?0:g.inside-Math.min(g.inside,travel)));lineB.setAttribute("stroke-dashoffset",String(reduced?0:g.outside-clamp(travel-g.inside,0,g.outside)))
    const labelIn=reduced?1:smooth((local-.55)/.75);label.style.opacity=String(labelIn*fade);label.style.transform=`translateX(${reduced?0:16*(1-out((local-.55)/.7))}px)`
   })
  }
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=0;host.dataset.running="false"}
  const tick=(now:number)=>{raf=0;if(dead||!visible||document.hidden||!ready)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;clock.time+=dt*speed
   if(!loop&&clock.time>=all){clock.time=all;clock.paused=true}else if(clock.time>=end){clock.time=0;clock.first=false}
   paint(clock.time);if(!reduced&&!clock.paused){raf=requestAnimationFrame(tick);host.dataset.running="true"}else stop()
  }
  const wake=()=>{if(dead||!visible||document.hidden||!ready)return;if(reduced){paint(all);stop()}else if(!clock.paused&&!raf){last=0;raf=requestAnimationFrame(tick);host.dataset.running="true"}}
  replay.current=()=>{clock.paused=false;if(reduced){paint(all);stop()}else{clock.time=clock.time>.4&&clock.time<fadeStart?fadeStart:0;clock.first=false;paint(clock.time);wake()}if(announce.current)announce.current.textContent=reduced?"All photograph details shown":"Photograph annotations replaying"}
  finish.current=()=>{clock.paused=true;clock.time=all;clock.first=false;paint(all);stop();if(announce.current)announce.current.textContent="All photograph details shown"}
  const motion=()=>{reduced=isStatic||reducedMotion||media.matches;clock.first=false;paint(reduced?all:clock.time);if(reduced)stop();else wake()}
  const visibility=()=>{if(document.hidden)stop();else wake()}
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.intersectionRatio>=.35;if(visible)wake();else stop()},{threshold:[0,.35]});observer.observe(el)
  media.addEventListener("change",motion);document.addEventListener("visibilitychange",visibility);paint(reduced?all:clock.time);wake()
  return()=>{dead=true;stop();observer.disconnect();media.removeEventListener("change",motion);document.removeEventListener("visibilitychange",visibility);replay.current=()=>{};finish.current=()=>{}}
 },[geometry,items.length,stagger,hold,loop,speed,isStatic,reducedMotion,ready])
 return <section ref={root} data-al-annotations="" data-al-demo-viewport={fullViewport&&showLibrary&&!isStatic?"true":undefined} style={{...style,position:"relative",width:style?.width||"100%",height:isStatic?style?.height||600:fullViewport?"100dvh":style?.height||"100%",minHeight:fullViewport?undefined:240,overflow:"clip",display:"grid",placeItems:"center",background,touchAction:"pinch-zoom",overscrollBehavior:"none",userSelect:"none",WebkitTapHighlightColor:"transparent",fontFamily:"Arial, sans-serif"}}>
  <style>{css}</style><p id={`${uid}-details`} style={hidden}>{alt||image.alt} {items.map(m=>`${m.title}: ${m.text}.`).join(" ")} Press Enter or Space to replay. Escape shows all details.</p><span ref={announce} aria-live="polite" style={hidden}/>
  <figure ref={figure} role={isStatic?undefined:"button"} aria-label={isStatic?"Photograph annotations":"Replay photograph annotations"} aria-describedby={`${uid}-details`} tabIndex={isStatic?undefined:0} data-keyboard="false" onPointerDown={e=>{e.currentTarget.dataset.keyboard="false"}} onClick={isStatic?undefined:()=>replay.current()} onKeyDown={isStatic?undefined:e=>{e.currentTarget.dataset.keyboard="true";if(e.key==="Enter"||e.key===" "){e.preventDefault();replay.current()}else if(e.key==="Escape"){e.preventDefault();finish.current()}}} style={{position:"relative",margin:0,width:cw,height:h,cursor:isStatic?"default":"pointer",outline:"none"}}>
   <img ref={photo} src={src} srcSet={image.srcSet} sizes={`${Math.ceil(pw)}px`} alt={alt||image.alt||""} draggable={false} style={{position:"absolute",left:0,top:0,width:pw,height:h,objectFit:"cover",objectPosition:`${focusX}% ${focusY}%`,borderRadius:corners,boxShadow:"0 3px 14px rgba(70,55,40,.07)",opacity:isStatic?1:0}}/>
   <svg aria-hidden="true" viewBox={`0 0 ${cw} ${h}`} style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible",pointerEvents:"none"}}>{geometry.map((g,i)=><g key={i} ref={e=>{groups.current[i]=e}} style={{opacity:isStatic?1:0}}><circle cx={g.x} cy={g.y} r={5.5} fill="none" stroke={photoLineColor} strokeWidth={1.6}/><circle cx={g.x} cy={g.y} r={2.1} fill={photoLineColor}/><line x1={g.start} x2={g.start+g.inside} y1={g.y} y2={g.y} stroke={photoLineColor} strokeWidth={1.6} strokeDasharray={`${g.inside} ${g.inside+1}`}/><line x1={g.end-g.outside} x2={g.end} y1={g.y} y2={g.y} stroke={lineColor} strokeWidth={1.2} strokeDasharray={`${g.outside} ${g.outside+1}`}/></g>)}</svg>
   <figcaption aria-hidden="true">{items.map((m,i)=><div key={i} ref={e=>{labels.current[i]=e}} data-mark={i+1} style={{position:"absolute",left:labelX,top:geometry[i].y-eyebrow/2,width:lw,opacity:isStatic?1:0,textTransform:"uppercase",pointerEvents:"none"}}><span style={{display:"block",fontWeight:500,lineHeight:1,letterSpacing:".25em",marginBottom:eyebrow*.9,color:eyebrowColor,...eyebrowFont,fontSize:Math.max(9,(parseFloat(String(eyebrowFont?.fontSize||12))||12)*h/780)}}>{m.title}</span><span style={{display:"block",fontWeight:400,lineHeight:1.35,letterSpacing:".01em",color:textColor,overflowWrap:"anywhere",...labelFont,fontSize:Math.max(12,(parseFloat(String(labelFont?.fontSize||21))||21)*h/780)}}>{m.text}</span></div>)}</figcaption>
   <span className="al-an-focus" aria-hidden="true" style={{position:"absolute",left:pw/2-24,bottom:-12,width:48,height:2,background:"#8A847B"}}/>
  </figure>
        {!isStatic && showReload && <button type="button" aria-label={reloadLabel} title={reloadLabel} className="al-an-control" onClick={() => replay.current()} style={{ ...pill, position: "absolute", right: 16, top: "max(16px,env(safe-area-inset-top))", width: 68, height: 44, padding: 0, cursor: "pointer", zIndex: 5 }}><svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id={`${uid}-reload-top`} x1="24" y1="8" x2="24" y2="37" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor"/><stop offset=".38" stopColor="currentColor" stopOpacity=".94"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient><linearGradient id={`${uid}-reload-bottom`} x1="24" y1="40" x2="24" y2="11" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor"/><stop offset=".38" stopColor="currentColor" stopOpacity=".94"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path d="M27 8.3A16 16 0 0 1 35.3 35.3" stroke={`url(#${uid}-reload-top)`} strokeWidth="4.5"/><path d="M21 39.7A16 16 0 0 1 12.7 12.7" stroke={`url(#${uid}-reload-bottom)`} strokeWidth="4.5"/><path d="M18 8.3 28 2.3v12Z M30 39.7 20 45.7v-12Z" fill="currentColor"/></svg></button>}
        {!isStatic && showLibrary && <nav aria-label="Library" style={{ ...pill, position: "absolute", left: 20, bottom: "max(20px,env(safe-area-inset-bottom))", height: 38, padding: "0 16px", gap: 14, border: 0, zIndex: 5, fontSize: 14, ...navigationFont }}><a href={libraryLink || "/"} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>Library</a><span style={{ fontWeight: 600 }}>{price}</span></nav>}
 </section>
}
addPropertyControls(ALAnnotationLines,{
 image:{type:ControlType.ResponsiveImage,title:"Image"},alt:{type:ControlType.String,title:"Alt Text",defaultValue:PHOTO.alt},imageRatio:{type:ControlType.Number,title:"Image Ratio",defaultValue:.8,min:.5,max:1.5,step:.01},focusX:{type:ControlType.Number,title:"Focus X",defaultValue:50,min:0,max:100,unit:"%"},focusY:{type:ControlType.Number,title:"Focus Y",defaultValue:50,min:0,max:100,unit:"%"},
 marks:{type:ControlType.Array,title:"Annotations",maxCount:6,defaultValue:MARKS,control:{type:ControlType.Object,controls:{title:{type:ControlType.String,title:"Eyebrow",defaultValue:"CUTE"},text:{type:ControlType.String,title:"Label",defaultValue:"TINY DETAILS"},x:{type:ControlType.Number,title:"Anchor X",min:2,max:96,defaultValue:50,unit:"%"},y:{type:ControlType.Number,title:"Anchor Y",min:3,max:91,defaultValue:50,unit:"%"}}}},
 background:{type:ControlType.Color,title:"Background",defaultValue:"#FFFFFF"},textColor:{type:ControlType.Color,title:"Label Color",defaultValue:"#777169"},eyebrowColor:{type:ControlType.Color,title:"Eyebrow Color",defaultValue:"#797168"},lineColor:{type:ControlType.Color,title:"Page Line",defaultValue:"#9A938A"},photoLineColor:{type:ControlType.Color,title:"Photo Line",defaultValue:"rgba(255,255,255,.92)"},corners:{type:ControlType.Number,title:"Corners",defaultValue:6,min:0,max:32,unit:"px"},
 labelFont:{type:ControlType.Font,title:"Label Font",controls:"extended",defaultFontType:"sans-serif",defaultValue:{fontSize:"21px",lineHeight:"1.35em"}},eyebrowFont:{type:ControlType.Font,title:"Eyebrow Font",controls:"extended",defaultFontType:"sans-serif",defaultValue:{fontSize:"12px",lineHeight:"1em"}},speed:{type:ControlType.Number,title:"Speed",defaultValue:1,min:.25,max:3,step:.05},stagger:{type:ControlType.Number,title:"Stagger",defaultValue:.75,min:.25,max:2,step:.05,unit:"s"},hold:{type:ControlType.Number,title:"Hold",defaultValue:2.5,min:0,max:10,step:.1,unit:"s"},loop:{type:ControlType.Boolean,title:"Loop",defaultValue:true},reducedMotion:{type:ControlType.Boolean,title:"Reduce Motion",defaultValue:false},fullViewport:{type:ControlType.Boolean,title:"Full Viewport",defaultValue:true},showReload:{type:ControlType.Boolean,title:"Reload",defaultValue:true},reloadLabel:{type:ControlType.String,title:"Reload Label",defaultValue:"Restart animation"},showLibrary:{type:ControlType.Boolean,title:"Demo Navigation",defaultValue:false},libraryLink:{type:ControlType.Link,title:"Library Link",hidden:p=>!p.showLibrary},price:{type:ControlType.String,title:"Demo Price",defaultValue:"Free",hidden:p=>!p.showLibrary},navigationFont:{type:ControlType.Font,title:"Navigation Font",controls:"extended",defaultFontType:"sans-serif",defaultValue:{fontSize:"14px",lineHeight:"1.2em"},hidden:p=>!p.showLibrary}
})
