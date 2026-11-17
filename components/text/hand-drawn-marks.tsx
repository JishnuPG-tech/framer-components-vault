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

type Kind = "highlight" | "underline" | "circle" | "strike" | "box" | "bracket"
type Phrase = { before?: string; text?: string; kind?: Kind }
type Stroke = { d: string; width: number; mark: number; highlight: boolean }
interface Props { phrases?: Phrase[]; ending?: string; textFont?: React.CSSProperties; navigationFont?: React.CSSProperties; textColor?: string; strokeColor?: string; highlightColor?: string; background?: string; strokeWidth?: number; duration?: number; hold?: number; loop?: boolean; uppercase?: boolean; reducedMotion?: boolean; fullViewport?: boolean; showReload?: boolean; reloadLabel?: string; showLibrary?: boolean; libraryLink?: string; price?: string; style?: React.CSSProperties }
const PHRASES: Phrase[] = [
 { before: "", text: "CUTE MOMENTS", kind: "highlight" },
 { before: " ARE MADE OF SOFT YAWNS, ", text: "TINY FINGERS", kind: "underline" },
 { before: " AND ", text: "SLEEPY SMILES", kind: "circle" },
 { before: ". NO NEED TO ", text: "RUSH", kind: "strike" },
 { before: " — JUST ", text: "WARM CUDDLES", kind: "box" },
 { before: ", QUIET DREAMS AND ", text: "ALL THE LOVE", kind: "bracket" },
]
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3)
const hidden: React.CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }
const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.92)", border: "1px solid rgba(0,0,0,.13)", borderRadius: 24, boxShadow: "0 2px 8px rgba(0,0,0,.04)", color: "#62615E" }
const css = `[data-al-highlights] *{box-sizing:border-box}[data-al-highlights] .al-hh-text:focus{outline:none}[data-al-highlights] .al-hh-focus{opacity:0}[data-al-highlights] .al-hh-text[data-keyboard=true]:focus-visible .al-hh-focus{opacity:1}[data-al-highlights] button:focus-visible,[data-al-highlights] a:focus-visible{outline:2px solid #8A847B;outline-offset:4px}`
// Deterministic, gently uneven pen paths; no external drawing dependency.
function penPaths(x: number, y: number, w: number, h: number, kind: Kind, seed: number, weight: number): {d:string;width:number}[] {
 const result: {d:string;width:number}[] = []
 for (let pass = 0; pass < 2; pass++) {
  let n = seed * 173 + pass * 59 + 7
  const jitter = () => { n = (n * 16807) % 2147483647; return (n % 1000 / 500 - 1) * 1.4 }
  const left = x - 4 + jitter(), right = x + w + 4 + jitter(), top = y - 3 + jitter(), bottom = y + h + 3 + jitter(), mid = y + h / 2
  if (kind === "highlight" || kind === "underline" || kind === "strike") {
   const yy = kind === "highlight" || kind === "strike" ? mid : bottom
   result.push({ d: `M ${left} ${yy+jitter()} C ${left+w*.3} ${yy+jitter()} ${left+w*.65} ${yy+jitter()} ${right} ${yy+jitter()}`, width: kind === "highlight" ? h*.82 : weight })
  } else if (kind === "circle") {
   const cx = (left+right)/2, cy=(top+bottom)/2, rx=(right-left)/2+2, ry=(bottom-top)/2+2, k=.5523
   result.push({d:`M ${cx+rx} ${cy} C ${cx+rx+jitter()} ${cy+ry*k} ${cx+rx*k} ${cy+ry+jitter()} ${cx} ${cy+ry} C ${cx-rx*k} ${cy+ry} ${cx-rx+jitter()} ${cy+ry*k} ${cx-rx} ${cy} C ${cx-rx} ${cy-ry*k} ${cx-rx*k} ${cy-ry+jitter()} ${cx} ${cy-ry} C ${cx+rx*k} ${cy-ry} ${cx+rx+jitter()} ${cy-ry*k} ${cx+rx} ${cy+1}`,width:weight})
  } else if (kind === "box") {
   result.push({d:`M ${left} ${top} Q ${left+w*.5} ${top+jitter()} ${right} ${top+jitter()} Q ${right+jitter()} ${mid} ${right} ${bottom} Q ${left+w*.5} ${bottom+jitter()} ${left} ${bottom+jitter()} Q ${left+jitter()} ${mid} ${left} ${top-1}`,width:weight})
  } else {
   result.push({d:`M ${left+6} ${top} L ${left} ${top+jitter()} L ${left+jitter()} ${bottom} L ${left+6} ${bottom+jitter()}`,width:weight})
   result.push({d:`M ${right-6} ${top} L ${right} ${top+jitter()} L ${right+jitter()} ${bottom} L ${right-6} ${bottom+jitter()}`,width:weight})
  }
 }
 return result
}
/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ALHandDrawnHighlights(props: Props) {
 const { phrases=PHRASES, ending=" IN THE WORLD.", textFont, navigationFont, textColor="#68625A", strokeColor="#B7B0A6", highlightColor="#E6E0D7", background="#FFFFFF", strokeWidth=2, duration=.7, hold=2.5, loop=true, uppercase=true, reducedMotion=false, fullViewport=true, showReload=true, reloadLabel="Restart animation", showLibrary=false, libraryLink="/", price="Free", style }=props
 const isStatic=useIsStaticRenderer(), uid=React.useId().replace(/:/g, "")
 const phrasesKey=JSON.stringify((phrases.length?phrases.slice(0,12):PHRASES).map(({before,text,kind})=>({before,text,kind})))
 const items=React.useMemo<Phrase[]>(()=>JSON.parse(phrasesKey),[phrasesKey])
 const fontKey=JSON.stringify(textFont||{})
 const clock=React.useRef({key:"",time:0,paused:false})
 const root=React.useRef<HTMLElement>(null), paragraph=React.useRef<HTMLParagraphElement>(null), marks=React.useRef<(HTMLElement|null)[]>([]), paths=React.useRef<(SVGPathElement|null)[]>([]), announce=React.useRef<HTMLSpanElement>(null)
 const replay=React.useRef(()=>{}), finish=React.useRef(()=>{}), [strokes,setStrokes]=React.useState<Stroke[]>([])
 const fontSize=parseFloat(String(textFont?.fontSize || 28)) || 28
 React.useEffect(()=>{
  const host=root.current,p=paragraph.current;if(!host||!p)return
  let frame=0,dead=false
  const measure=()=>{
   frame=0;if(dead)return
   const bounds=host.getBoundingClientRect();if(!bounds.width||!bounds.height)return
   const availableH=Math.max(40,bounds.height-(!isStatic&&(showReload||showLibrary)?160:64)), availableW=Math.max(40,bounds.width-48)
   let font=fontSize*clamp(bounds.width/1166,.715,1)
   p.style.fontSize=`${font}px`
   // Fit edited copy too, keeping all six enclosures within the visible scene.
   for(let i=0;i<3;i++){
    const rect=p.getBoundingClientRect(), rangeWidth=Math.max(rect.width,...marks.current.filter(Boolean).map(m=>m!.getBoundingClientRect().right-rect.left+10))
    const fit=Math.min(1,availableH/Math.max(rect.height,1),availableW/Math.max(rangeWidth,1));if(fit>.999)break
    font*=fit;p.style.fontSize=`${font}px`
   }
   const base=p.getBoundingClientRect(), next:Stroke[]=[]
   items.forEach((item,index)=>{const mark=marks.current[index];if(!mark||!item.text)return;const range=document.createRange();range.selectNodeContents(mark)
    const rects=Array.from(range.getClientRects()).filter(r=>r.width>0&&r.height>0)
    rects.forEach((r,line)=>{const inkHeight=Math.min(r.height,font*(uppercase?.85:1.05));penPaths(r.left-base.left,r.top-base.top+(r.height-inkHeight)/2,r.width,inkHeight,item.kind||"underline",index*11+line+1,strokeWidth).forEach(path=>next.push({...path,mark:index,highlight:item.kind==="highlight"}))})
   })
   setStrokes(old=>JSON.stringify(old)===JSON.stringify(next)?old:next)
  }
  const schedule=()=>{if(!dead&&!frame)frame=requestAnimationFrame(measure)}
  measure();const resize=new ResizeObserver(schedule);resize.observe(host)
  document.fonts.ready.then(schedule);document.fonts.addEventListener("loadingdone",schedule)
  return()=>{dead=true;resize.disconnect();cancelAnimationFrame(frame);document.fonts.removeEventListener("loadingdone",schedule)}
 },[items,ending,fontSize,fontKey,uppercase,strokeWidth,showReload,showLibrary,isStatic])
 React.useEffect(()=>{
  const host=root.current,p=paragraph.current;if(!host||!p||!strokes.length)return
  const media=window.matchMedia("(prefers-reduced-motion: reduce)")
  const key=JSON.stringify([items,ending,duration,hold,loop])
  if(clock.current.key!==key)clock.current={key,time:0,paused:false}
  let reduced=isStatic||reducedMotion||media.matches,visible=isStatic,dead=false,raf=0,last=0,time=clock.current.time,paused=clock.current.paused
  const save=()=>{clock.current.time=time;clock.current.paused=paused}
  const lengths=strokes.map((_,i)=>paths.current[i]?.getTotalLength()||0), sums=items.map((_,mark)=>strokes.reduce((total,s,i)=>s.mark===mark?total+lengths[i]:total,0)), offsets=strokes.map((s,i)=>strokes.slice(0,i).reduce((total,other,j)=>other.mark===s.mark?total+lengths[j]:total,0))
  const per=Math.max(.1,duration),drawTime=items.length*per,fadeStart=drawTime+hold,end=fadeStart+.5
  const paint=(t:number)=>{
   const fade=reduced||paused?1:1-ease((t-fadeStart)/.5)
   host.dataset.phase=reduced||paused?"still":t<drawTime?"drawing":t<fadeStart?"hold":"out";host.dataset.time=t.toFixed(2);host.dataset.reduced=String(reduced)
   strokes.forEach((s,i)=>{const path=paths.current[i];if(!path)return;const length=lengths[i],total=sums[s.mark]||1,local=(t-s.mark*per)/per,part=length/total,start=offsets[i]/total,progress=reduced||paused?1:ease((local-start)/Math.max(part,.0001))
    path.style.opacity=String(fade*(s.highlight?.66:.9));path.setAttribute("stroke-dasharray",`${length} ${length+1}`);path.setAttribute("stroke-dashoffset",String(length*(1-progress)))
   })
  }
  const stop=()=>{cancelAnimationFrame(raf);raf=0;last=0;host.dataset.running="false"}
  const tick=(now:number)=>{raf=0;if(dead||!visible||document.hidden)return;time+=last?Math.min((now-last)/1000,.05):0;last=now
   if(!loop&&time>=drawTime){time=drawTime;paused=true}else if(time>=end)time=0
   save();paint(time);if(!reduced&&!paused){raf=requestAnimationFrame(tick);host.dataset.running="true"}else stop()
  }
  const wake=()=>{if(dead||!visible||document.hidden)return;if(reduced||paused){paint(drawTime);stop()}else if(!raf){last=0;raf=requestAnimationFrame(tick);host.dataset.running="true"}}
  replay.current=()=>{paused=false;time=0;save();paint(reduced?drawTime:0);wake();if(announce.current)announce.current.textContent=reduced?"All highlights shown":"Highlights replaying"}
  finish.current=()=>{paused=true;time=drawTime;save();paint(time);stop();if(announce.current)announce.current.textContent="All highlights shown"}
  const motion=(event:MediaQueryListEvent)=>{reduced=isStatic||reducedMotion||event.matches;stop();paint(reduced||paused?drawTime:time);wake()}
  const visibility=()=>{stop();if(!document.hidden)wake()}
  const observer=new IntersectionObserver(entries=>{const entry=entries[0];if(entry.intersectionRatio>=.599){visible=true;wake()}else if(!entry.isIntersecting){visible=false;stop()}},{threshold:[0,.6]})
  observer.observe(p);media.addEventListener("change",motion);document.addEventListener("visibilitychange",visibility);paint(reduced||paused?drawTime:time);wake()
  return()=>{dead=true;save();stop();observer.disconnect();media.removeEventListener("change",motion);document.removeEventListener("visibilitychange",visibility);replay.current=()=>{};finish.current=()=>{}}
 },[strokes,items,ending,duration,hold,loop,isStatic,reducedMotion])
 const svg=(highlight:boolean)=><svg aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible",pointerEvents:"none",zIndex:highlight?0:2}}>{strokes.map((s,i)=>s.highlight===highlight?<path key={i} ref={el=>{paths.current[i]=el}} data-mark={s.mark+1} data-pen={highlight?"highlight":"line"} d={s.d} fill="none" stroke={highlight?highlightColor:strokeColor} strokeWidth={s.width} strokeLinecap={highlight?"butt":"round"} strokeLinejoin="round" style={{opacity:isStatic?1:0}}/>:null)}</svg>
 return <section ref={root} data-al-highlights="" data-al-demo-viewport={fullViewport&&showLibrary&&!isStatic?"true":undefined} style={{...style,boxSizing:"border-box",position:"relative",width:style?.width||"100%",height:isStatic?(style?.height||600):fullViewport?"100dvh":style?.height||"100%",overflow:"clip",display:"grid",placeItems:"center",padding:!isStatic&&(showReload||showLibrary)?"80px 24px":"32px 24px",background,touchAction:"pinch-zoom",overscrollBehavior:"none",userSelect:"none",WebkitTapHighlightColor:"transparent",fontFamily:"Arial, sans-serif"}}>
  <style>{css}</style><span ref={announce} aria-live="polite" style={hidden}/><span id={`${uid}-instructions`} style={hidden}>Press Enter or Space to replay. Escape shows all highlights.</span>
  <div style={{position:"relative",width:"100%",maxWidth:"44ch",fontSize,fontFamily:textFont?.fontFamily||"inherit",lineHeight:1.65}}>
   {svg(true)}
   <p ref={paragraph} role={isStatic?undefined:"button"} aria-label={isStatic?undefined:"Replay hand-drawn highlights"} aria-describedby={`${uid}-instructions ${uid}-copy`} tabIndex={isStatic?undefined:0} className="al-hh-text" onPointerDown={e=>{e.currentTarget.dataset.keyboard="false"}} onClick={()=>{if(!isStatic)replay.current()}} onKeyDown={e=>{if(isStatic)return;e.currentTarget.dataset.keyboard="true";if(e.key==="Enter"||e.key===" "){e.preventDefault();replay.current()}else if(e.key==="Escape"){e.preventDefault();finish.current()}}} style={{position:"relative",zIndex:1,margin:0,color:textColor,fontWeight:400,fontSize,lineHeight:1.65,letterSpacing:".015em",...textFont,textTransform:uppercase?"uppercase":"none",cursor:isStatic?"default":"pointer",outline:"none"}}>
    <span id={`${uid}-copy`}>{items.map((item,i)=><React.Fragment key={i}>{item.before}<mark ref={el=>{marks.current[i]=el}} data-kind={item.kind||"underline"} style={{background:"none",color:"inherit",whiteSpace:["circle","box","bracket"].includes(item.kind||"")?"nowrap":"normal"}}>{item.text}</mark></React.Fragment>)}{ending}</span>
    <span className="al-hh-focus" aria-hidden="true" style={{position:"absolute",left:0,bottom:-20,width:48,height:2,background:strokeColor}}/>
   </p>{svg(false)}
  </div>
        {!isStatic && showReload && <button type="button" aria-label={reloadLabel} title={reloadLabel} className="al-hh-control" onClick={() => replay.current()} style={{ ...pill, position: "absolute", right: 16, top: "max(16px,env(safe-area-inset-top))", width: 68, height: 44, padding: 0, cursor: "pointer", zIndex: 5 }}><svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id={`${uid}-reload-top`} x1="24" y1="8" x2="24" y2="37" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor"/><stop offset=".38" stopColor="currentColor" stopOpacity=".94"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient><linearGradient id={`${uid}-reload-bottom`} x1="24" y1="40" x2="24" y2="11" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor"/><stop offset=".38" stopColor="currentColor" stopOpacity=".94"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path d="M27 8.3A16 16 0 0 1 35.3 35.3" stroke={`url(#${uid}-reload-top)`} strokeWidth="4.5"/><path d="M21 39.7A16 16 0 0 1 12.7 12.7" stroke={`url(#${uid}-reload-bottom)`} strokeWidth="4.5"/><path d="M18 8.3 28 2.3v12Z M30 39.7 20 45.7v-12Z" fill="currentColor"/></svg></button>}
        {!isStatic && showLibrary && <nav aria-label="Library" style={{ ...pill, position: "absolute", left: 20, bottom: "max(20px,env(safe-area-inset-bottom))", height: 38, padding: "0 16px", gap: 14, border: 0, zIndex: 5, fontSize: 14, ...navigationFont }}><a href={libraryLink || "/"} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>Library</a><span style={{ fontWeight: 600 }}>{price}</span></nav>}
 </section>
}
addPropertyControls(ALHandDrawnHighlights,{
 phrases:{type:ControlType.Array,title:"Phrases",maxCount:12,defaultValue:PHRASES,control:{type:ControlType.Object,controls:{before:{type:ControlType.String,title:"Text Before",defaultValue:""},text:{type:ControlType.String,title:"Marked Text",defaultValue:"CUTE MOMENTS"},kind:{type:ControlType.Enum,title:"Mark Style",options:["highlight","underline","circle","strike","box","bracket"],optionTitles:["Highlight","Underline","Circle","Strike-through","Box","Brackets"],defaultValue:"underline"}}}},
 ending:{type:ControlType.String,title:"Text After",defaultValue:" IN THE WORLD."},textFont:{type:ControlType.Font,title:"Text Font",controls:"extended",defaultFontType:"sans-serif",defaultValue:{fontSize:"28px",lineHeight:"1.65em",letterSpacing:".015em"}},uppercase:{type:ControlType.Boolean,title:"Uppercase",defaultValue:true},textColor:{type:ControlType.Color,title:"Text Color",defaultValue:"#68625A"},strokeColor:{type:ControlType.Color,title:"Pen Color",defaultValue:"#B7B0A6"},highlightColor:{type:ControlType.Color,title:"Highlight Color",defaultValue:"#E6E0D7"},background:{type:ControlType.Color,title:"Background",defaultValue:"#FFFFFF"},strokeWidth:{type:ControlType.Number,title:"Pen Width",defaultValue:2,min:.5,max:5,step:.1,unit:"px"},duration:{type:ControlType.Number,title:"Per Mark",defaultValue:.7,min:.1,max:3,step:.05,unit:"s"},hold:{type:ControlType.Number,title:"Hold",defaultValue:2.5,min:0,max:10,step:.1,unit:"s"},loop:{type:ControlType.Boolean,title:"Loop",defaultValue:true},reducedMotion:{type:ControlType.Boolean,title:"Reduce Motion",defaultValue:false},fullViewport:{type:ControlType.Boolean,title:"Full Viewport",defaultValue:true},showReload:{type:ControlType.Boolean,title:"Reload",defaultValue:true},reloadLabel:{type:ControlType.String,title:"Reload Label",defaultValue:"Restart animation"},showLibrary:{type:ControlType.Boolean,title:"Demo Navigation",defaultValue:false},libraryLink:{type:ControlType.Link,title:"Library Link",hidden:p=>!p.showLibrary},price:{type:ControlType.String,title:"Demo Price",defaultValue:"Free",hidden:p=>!p.showLibrary},navigationFont:{type:ControlType.Font,title:"Navigation Font",controls:"extended",defaultFontType:"sans-serif",defaultValue:{fontSize:"14px",lineHeight:"1.2em"},hidden:p=>!p.showLibrary}
})
