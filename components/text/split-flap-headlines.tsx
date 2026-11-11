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

type Board = {text?:string}
type Tile = {el:HTMLSpanElement;parts:HTMLSpanElement[];letters:HTMLSpanElement[];current:string;origin:string;sequence:string[];due:number;done:boolean;painted:number}
interface Props {boards?:Board[];font?:React.CSSProperties;navigationFont?:React.CSSProperties;background?:string;tileColor?:string;textColor?:string;flipDuration?:number;columnStagger?:number;rowStagger?:number;hold?:number;loop?:boolean;reducedMotion?:boolean;fullViewport?:boolean;showReload?:boolean;reloadLabel?:string;showLibrary?:boolean;libraryLink?:string;price?:string;style?:React.CSSProperties}
const BOARDS:Board[]=[{text:"CUTE MOMENTS\nTINY WONDERS\nSO MUCH LOVE"},{text:"SLEEPY SMILES\nSOFT CUDDLES\nSWEET DREAMS"},{text:"TINY FINGERS\nCOSY CUDDLES\nHAPPY HEARTS"}]
const CHARACTERS="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:"
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v))
const hidden:React.CSSProperties={position:"absolute",width:1,height:1,overflow:"hidden",clipPath:"inset(50%)",whiteSpace:"nowrap"}
const pill:React.CSSProperties={display:"inline-flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,.92)",border:"1px solid rgba(0,0,0,.13)",borderRadius:24,boxShadow:"0 2px 8px rgba(0,0,0,.04)",color:"#62615E"}
const css=`[data-al-flap] *{box-sizing:border-box}[data-al-flap] .al-flap-board:focus{outline:none}[data-al-flap] .al-flap-focus{opacity:0}[data-al-flap][data-keyboard=true] .al-flap-board:focus-visible .al-flap-focus{opacity:1}[data-al-flap] button:focus-visible,[data-al-flap] a:focus-visible{outline:2px solid #8A847B;outline-offset:4px}`
/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ALSplitFlapHeadlines(props:Props){
 const {boards=BOARDS,font,navigationFont,background="#FFFFFF",tileColor="#E4DFD7",textColor="#625D55",flipDuration=.12,columnStagger=.055,rowStagger=.32,hold=2.5,loop=true,reducedMotion=false,fullViewport=true,showReload=true,reloadLabel="Restart animation",showLibrary=false,libraryLink="/",price="Free",style}=props
 const isStatic=useIsStaticRenderer(),uid=React.useId().replace(/:/g,"")
 const boardsKey=JSON.stringify(boards.map(b=>b.text||"CUTE MOMENTS"))
 const pages=React.useMemo(()=>{const values=JSON.parse(boardsKey) as string[];return (values.length?values:BOARDS.map(b=>b.text!)).slice(0,8).map(text=>text.toUpperCase().split(/\r?\n/).slice(0,6).map(line=>Array.from(line).slice(0,32)))},[boardsKey])
 const rows=Math.max(...pages.map(p=>p.length)),columns=Math.max(1,...pages.flat().map(line=>line.length))
 const root=React.useRef<HTMLElement>(null),board=React.useRef<HTMLDivElement>(null),cells=React.useRef<(HTMLSpanElement|null)[]>([]),rowElements=React.useRef<(HTMLDivElement|null)[]>([]),announce=React.useRef<HTMLSpanElement>(null)
 const replay=React.useRef(()=>{}),advance=React.useRef(()=>{}),finish=React.useRef(()=>{})
 const [bounds,setBounds]=React.useState({width:1200,height:900})
 const baseFont=parseFloat(String(font?.fontSize||72))||72,rawLine=String(font?.lineHeight||"1.25em"),heightRatio=clamp(rawLine.endsWith("px")?(parseFloat(rawLine)||90)/baseFont:rawLine.endsWith("%")?(parseFloat(rawLine)||125)/100:parseFloat(rawLine)||1.25,1,2)
 const gutter=clamp(bounds.width*.025,16,32),availableH=Math.max(40,bounds.height-(!isStatic&&(showReload||showLibrary)?160:64)),size=Math.max(1,Math.min(clamp(bounds.width*.052,Math.min(25.6,baseFont),baseFont),(bounds.width-gutter*2)/(columns*.86),availableH/(rows*heightRatio+(rows-1)*.35)))
 React.useEffect(()=>{const el=root.current;if(!el)return;const measure=()=>{const r=el.getBoundingClientRect();if(r.width&&r.height)setBounds(old=>old.width===r.width&&old.height===r.height?old:{width:r.width,height:r.height})};measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect()},[])
 React.useEffect(()=>{
  const hostNode=root.current,display=board.current;if(!hostNode||!display)return;const host=hostNode
  const tiles:Tile[]=cells.current.slice(0,rows*columns).filter((el):el is HTMLSpanElement=>!!el).map(el=>{const parts=Array.from(el.querySelectorAll<HTMLSpanElement>('[data-half]'));return {el,parts,letters:parts.map(p=>p.firstElementChild as HTMLSpanElement),current:" ",origin:" ",sequence:[],due:0,done:true,painted:-1}})
  const media=window.matchMedia("(prefers-reduced-motion: reduce)")
  let reduced=isStatic||reducedMotion||media.matches,visible=isStatic,dead=false,raf=0,last=0,clock=0,index=0,pending:number|null=null,phase="waiting",holdTimer=0,holdRemaining=hold*1000,holdStarted=0,manual=false,run=0
  const flipMs=Math.max(.06,flipDuration)*1000
  const text=(page:number,r:number,c:number)=>pages[page]?.[r]?.[c]||" "
  const label=(page:number)=>{rowElements.current.forEach((row,r)=>row?.setAttribute("aria-label",(pages[page]?.[r]||[]).join("")));host.dataset.board=String(page+1)}
  const setPhase=(next:string)=>{phase=next;host.dataset.phase=next;host.dataset.reduced=String(reduced)}
  const settle=(tile:Tile,char:string)=>{tile.current=char;tile.letters.forEach(el=>el.textContent=char);tile.parts[2].style.transform="rotateX(0deg)";tile.parts[3].style.transform="rotateX(90deg)";tile.el.dataset.current=char;tile.el.dataset.fold="landed"}
  const cancelHold=()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=0;holdRemaining=Math.max(0,holdRemaining-(performance.now()-holdStarted))}}
  const stop=()=>{cancelAnimationFrame(raf);raf=0;last=0;cancelHold();host.dataset.running="false"}
  const show=(page:number)=>{index=page;pending=null;label(page);tiles.forEach((tile,i)=>{tile.done=true;settle(tile,text(page,Math.floor(i/columns),i%columns))});setPhase("still");stop()}
  const inform=()=>{if(manual&&announce.current)announce.current.textContent=pages[index].map(line=>line.join("")).join(". ");manual=false}
  const scheduleHold=()=>{if(dead||!visible||document.hidden||reduced||!loop||pages.length<2||holdTimer)return;holdStarted=performance.now();holdTimer=window.setTimeout(()=>{holdTimer=0;request((index+1)%pages.length,false)},holdRemaining)}
  const begin=(page:number)=>{
   index=page;pending=null;run++;label(page);setPhase("drawing")
   tiles.forEach((tile,i)=>{const r=Math.floor(i/columns),c=i%columns,target=text(page,r,c);tile.origin=tile.current;tile.painted=-1;tile.due=clock+r*rowStagger*1000+c*columnStagger*1000;tile.done=tile.current===" "&&target===" "
    let seed=(i+1)*1009+run*9176;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};const count=2+Math.floor(random()*5);tile.sequence=Array.from({length:count},()=>CHARACTERS[Math.floor(random()*CHARACTERS.length)]).concat(target)
   });wake()
  }
  const request=(page:number,user:boolean)=>{
   manual=user;cancelHold();if(reduced){show(page);inform();return}
   pending=page
   if(phase==="drawing"||phase==="draining"){
    // Keep only the flip already in flight. Its lower half lands before the new board starts.
    tiles.forEach(tile=>{if(tile.done)return;if(clock<tile.due){tile.done=true;return}const step=Math.floor((clock-tile.due)/flipMs);tile.sequence=tile.sequence.slice(0,Math.min(step+1,tile.sequence.length))});setPhase("draining");wake()
   }else begin(page)
  }
  const paint=(tile:Tile,step:number,progress:number)=>{
   const from=step===0?tile.origin:tile.sequence[step-1],to=tile.sequence[step]
   if(tile.painted!==step){tile.letters[0].textContent=to;tile.letters[1].textContent=from;tile.letters[2].textContent=from;tile.letters[3].textContent=to;tile.painted=step}
   if(progress<.5){const t=progress*2;tile.parts[2].style.transform=`rotateX(${-90*t*t}deg)`;tile.parts[3].style.transform="rotateX(90deg)";tile.el.dataset.fold="top"}
   else {const t=(progress-.5)*2;tile.parts[2].style.transform="rotateX(-90deg)";tile.parts[3].style.transform=`rotateX(${90*(1-t)*(1-t)}deg)`;tile.el.dataset.fold="bottom"}
  }
  const tick=(now:number)=>{
   raf=0;if(dead||!visible||document.hidden||reduced)return;clock+=last?Math.min(now-last,50):0;last=now
   tiles.forEach(tile=>{if(tile.done||clock<tile.due)return;const elapsed=clock-tile.due,step=Math.floor(elapsed/flipMs);if(step>=tile.sequence.length){settle(tile,tile.sequence[tile.sequence.length-1]);tile.done=true}else paint(tile,step,elapsed/flipMs-step)})
   if(tiles.every(tile=>tile.done)){
    if(pending!==null){begin(pending)}else{setPhase("hold");host.dataset.running="false";last=0;holdRemaining=hold*1000;inform();scheduleHold();return}
   }
   if(!raf){raf=requestAnimationFrame(tick);host.dataset.running="true"}
  }
  function wake(){if(dead||!visible||document.hidden||reduced)return;if(phase==="hold"){scheduleHold();return}if(phase==="still")return;if(phase==="waiting"){begin(index);return}if(!raf){last=0;raf=requestAnimationFrame(tick);host.dataset.running="true"}}
  replay.current=()=>request(0,true)
  advance.current=()=>request(((pending??index)+1)%pages.length,true)
  finish.current=()=>{show(pending??index);manual=true;inform()}
  const motion=(event:MediaQueryListEvent)=>{reduced=isStatic||reducedMotion||event.matches;stop();if(reduced)show(pending??index);else{setPhase("waiting");wake()}}
  const visibility=()=>{if(document.hidden)stop();else wake()}
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.intersectionRatio>=.4;if(visible)wake();else stop()},{threshold:[0,.4]});observer.observe(display)
  media.addEventListener("change",motion);document.addEventListener("visibilitychange",visibility)
  tiles.forEach(tile=>settle(tile," "));label(0);if(reduced)show(0);else{setPhase("waiting");wake()}
  return()=>{dead=true;stop();observer.disconnect();media.removeEventListener("change",motion);document.removeEventListener("visibilitychange",visibility);replay.current=()=>{};advance.current=()=>{};finish.current=()=>{}}
 },[pages,rows,columns,flipDuration,columnStagger,rowStagger,hold,loop,isStatic,reducedMotion])
 const halfStyle:React.CSSProperties={position:"absolute",left:0,width:"100%",height:"50%",overflow:"hidden",background:tileColor,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden"}
 return <section ref={root} data-al-flap="" data-al-demo-viewport={fullViewport&&showLibrary&&!isStatic?"true":undefined} onPointerDown={()=>{if(root.current)root.current.dataset.keyboard="false"}} onClick={e=>{if(!isStatic&&!(e.target as Element).closest("button,a,nav"))advance.current()}} style={{...style,boxSizing:"border-box",position:"relative",width:style?.width||"100%",height:isStatic?style?.height||600:fullViewport?"100dvh":style?.height||"100%",overflow:"clip",display:"grid",placeItems:"center",padding:`${!isStatic&&(showReload||showLibrary)?80:32}px ${gutter}px`,background,touchAction:"pinch-zoom",overscrollBehavior:"none",userSelect:"none",WebkitTapHighlightColor:"transparent",fontFamily:"monospace"}}>
  <style>{css}</style><span ref={announce} aria-live="polite" style={hidden}/><span id={`${uid}-instructions`} style={hidden}>Press Enter or Space for the next headline board. Escape stops the animation.</span>
  <div ref={board} role={isStatic?undefined:"button"} aria-label="Next headline board" aria-describedby={`${uid}-instructions`} tabIndex={isStatic?undefined:0} className="al-flap-board" onKeyDown={e=>{if(root.current)root.current.dataset.keyboard="true";if(e.key==="Enter"||e.key===" "){e.preventDefault();advance.current()}else if(e.key==="Escape"){e.preventDefault();finish.current()}}} style={{position:"relative",display:"flex",flexDirection:"column",gap:".35em",fontWeight:500,...font,fontSize:size,lineHeight:`${heightRatio}em`,textAlign:"center",cursor:isStatic?"default":"pointer",outline:"none"}}>
   {Array.from({length:rows},(_,r)=><div key={r} ref={el=>{rowElements.current[r]=el}} role="group" aria-label={(pages[0][r]||[]).join("")} style={{display:"flex",gap:".08em"}}>{Array.from({length:columns},(_,c)=>{const char=isStatic?pages[0]?.[r]?.[c]||" ":" ";return <span key={c} ref={el=>{cells.current[r*columns+c]=el}} aria-hidden="true" data-tile={`${r}-${c}`} style={{position:"relative",display:"block",width:".78em",height:`${heightRatio}em`,flex:"none",perspective:"6em",color:textColor,borderRadius:".08em",boxShadow:"0 2px 5px rgba(90,76,57,.08)"}}>
    {[0,1,2,3].map(part=>{const bottom=part%2===1;return <span key={part} data-half={part} style={{...halfStyle,top:bottom?undefined:0,bottom:bottom?0:undefined,borderRadius:bottom?"0 0 .08em .08em":".08em .08em 0 0",transformOrigin:bottom?"50% 0%":"50% 100%",transform:part===3?"rotateX(90deg)":"rotateX(0deg)",zIndex:part>=2?2:0}}><span style={{position:"absolute",left:0,width:"100%",height:`${heightRatio}em`,top:bottom?undefined:0,bottom:bottom?0:undefined}}>{char}</span></span>})}
    <i aria-hidden="true" style={{position:"absolute",left:0,right:0,top:"50%",height:1,marginTop:-.5,background,zIndex:3}}/>
   </span>})}</div>)}
   <span className="al-flap-focus" aria-hidden="true" style={{position:"absolute",left:0,bottom:-16,width:48,height:2,background:textColor}}/>
  </div>
        {showReload && !isStatic && <button type="button" aria-label={reloadLabel} title={reloadLabel} className="al-flap-control" onClick={() => replay.current()} style={{ ...pill, position: "absolute", right: 16, top: "max(16px,env(safe-area-inset-top))", width: 68, height: 44, padding: 0, cursor: "pointer", zIndex: 5 }}><svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id={`${uid}-reload-top`} x1="24" y1="8" x2="24" y2="37" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor"/><stop offset=".38" stopColor="currentColor" stopOpacity=".94"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient><linearGradient id={`${uid}-reload-bottom`} x1="24" y1="40" x2="24" y2="11" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor"/><stop offset=".38" stopColor="currentColor" stopOpacity=".94"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path d="M27 8.3A16 16 0 0 1 35.3 35.3" stroke={`url(#${uid}-reload-top)`} strokeWidth="4.5"/><path d="M21 39.7A16 16 0 0 1 12.7 12.7" stroke={`url(#${uid}-reload-bottom)`} strokeWidth="4.5"/><path d="M18 8.3 28 2.3v12Z M30 39.7 20 45.7v-12Z" fill="currentColor"/></svg></button>}
        {showLibrary && !isStatic && <nav aria-label="Library" style={{ ...pill, position: "absolute", left: 20, bottom: "max(20px,env(safe-area-inset-bottom))", height: 38, padding: "0 16px", gap: 14, border: 0, zIndex: 5, fontSize: 14, ...navigationFont }}><a href={libraryLink || "/"} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>Library</a><span style={{ fontWeight: 600 }}>{price}</span></nav>}
 </section>
}
addPropertyControls(ALSplitFlapHeadlines,{
 boards:{type:ControlType.Array,title:"Boards",maxCount:8,defaultValue:BOARDS,control:{type:ControlType.Object,controls:{text:{type:ControlType.String,title:"Lines",displayTextArea:true,defaultValue:"CUTE MOMENTS\nTINY WONDERS\nSO MUCH LOVE",description:"One row per line. Up to 6 rows, 32 characters each."}}}},font:{type:ControlType.Font,title:"Headline Font",controls:"extended",defaultFontType:"monospace",defaultValue:{fontSize:"72px",lineHeight:"1.25em"}},background:{type:ControlType.Color,title:"Background",defaultValue:"#FFFFFF"},tileColor:{type:ControlType.Color,title:"Tile Color",defaultValue:"#E4DFD7"},textColor:{type:ControlType.Color,title:"Letter Color",defaultValue:"#625D55"},flipDuration:{type:ControlType.Number,title:"Flip Duration",defaultValue:.12,min:.06,max:.6,step:.01,unit:"s"},columnStagger:{type:ControlType.Number,title:"Column Stagger",defaultValue:.055,min:0,max:.2,step:.005,unit:"s"},rowStagger:{type:ControlType.Number,title:"Row Stagger",defaultValue:.32,min:0,max:1,step:.01,unit:"s"},hold:{type:ControlType.Number,title:"Hold",defaultValue:2.5,min:.5,max:10,step:.1,unit:"s"},loop:{type:ControlType.Boolean,title:"Loop",defaultValue:true},reducedMotion:{type:ControlType.Boolean,title:"Reduce Motion",defaultValue:false},fullViewport:{type:ControlType.Boolean,title:"Full Viewport",defaultValue:true},showReload:{type:ControlType.Boolean,title:"Reload",defaultValue:true},reloadLabel:{type:ControlType.String,title:"Reload Label",defaultValue:"Restart animation"},showLibrary:{type:ControlType.Boolean,title:"Demo Navigation",defaultValue:false},libraryLink:{type:ControlType.Link,title:"Library Link",hidden:p=>!p.showLibrary},price:{type:ControlType.String,title:"Demo Price",defaultValue:"Free",hidden:p=>!p.showLibrary},navigationFont:{type:ControlType.Font,title:"Navigation Font",controls:"extended",defaultFontType:"sans-serif",defaultValue:{fontSize:"14px",lineHeight:"1.2em"},hidden:p=>!p.showLibrary}
})
