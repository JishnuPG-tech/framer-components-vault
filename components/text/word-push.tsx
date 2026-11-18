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

// Copyright AL Webdesign Studio · https://alwebdesignstudio.com/
interface Word {text?:string;beats?:number}
interface Timeline {starts:number[];shift:number;out:number;push:number;period:number;reduced:boolean;loop:boolean}
function retime(elapsed:number,old:Timeline,next:Timeline){
 const t=old.loop?elapsed%old.period:elapsed
 if(t<old.shift)return next.reduced?0:t/Math.max(1,old.shift)*next.shift
 if(old.loop&&!old.reduced&&t>=old.out){const progress=(t-old.out)/(old.period-old.out);return next.reduced?next.starts[next.starts.length-1]:next.out+progress*(next.period-next.out)}
 let i=0;for(let j=0;j<old.starts.length;j++)if(t>=old.starts[j]+old.shift)i=j
 const j=Math.min(i,next.starts.length-1),start=old.starts[i]+old.shift,target=next.starts[j]+next.shift
 const end=old.starts[i+1]!==undefined?old.starts[i+1]+old.shift:old.loop?(old.reduced?old.period:old.out):Infinity
 const targetEnd=next.starts[j+1]!==undefined?next.starts[j+1]+next.shift:next.loop?(next.reduced?next.period:next.out):Infinity
 if(!Number.isFinite(end)||!Number.isFinite(targetEnd))return target+(t-start)/old.push*next.push
 return target+clamp((t-start)/(end-start))*(targetEnd-target)
}
interface Props {lead?:string;words?:Word[];leadFont?:React.CSSProperties;wordFont?:React.CSSProperties;navigationFont?:React.CSSProperties;background?:string;leadColor?:string;wordColor?:string;bpm?:number;duration?:number;loop?:boolean;reducedMotion?:boolean;fullViewport?:boolean;showReload?:boolean;showLibrary?:boolean;libraryLink?:string;price?:string;style?:React.CSSProperties}
const DEFAULTS:Word[]=[{text:'SWEET',beats:2},{text:'GENTLE',beats:2},{text:'TINY',beats:1},{text:'WARM',beats:1},{text:'PLAYFUL',beats:2},{text:'TENDER',beats:2},{text:'SOFT',beats:1},{text:'JOYFUL',beats:1},{text:'CLOSE',beats:2},{text:'FOREVER',beats:2}]
const pill:React.CSSProperties={display:'inline-flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,.92)',border:'1px solid rgba(0,0,0,.13)',borderRadius:24,boxShadow:'0 2px 8px rgba(0,0,0,.04)',color:'#62615E'}
const css=`
[data-al-word-push]{container-type:size;isolation:isolate;touch-action:pinch-zoom;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}
[data-al-word-push] *{box-sizing:border-box}
[data-al-word-push]:focus{outline:none}
[data-al-word-push][data-keyboard=true]:focus-visible::after{content:"";position:absolute;left:calc(50% - 24px);bottom:72px;width:48px;height:2px;background:currentColor}
[data-al-word-push] button:focus-visible,[data-al-word-push] a:focus-visible{outline:2px solid #776F64;outline-offset:4px}
[data-al-word-push] .awp-line{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:start;gap:.24em;margin:0;white-space:nowrap;line-height:1.25;letter-spacing:-.02em;pointer-events:none}
[data-al-word-push] .awp-mask{display:block;position:relative;clip-path:inset(0 -2em 0 -.4em)}
[data-al-word-push] .awp-lead{display:block;font-weight:400}
[data-al-word-push] .awp-slot{display:grid}
[data-al-word-push] .awp-word{display:block;grid-area:1/1;opacity:0;font-weight:500}
[data-al-word-push] .awp-word:first-child{opacity:1}
[data-al-word-push] .awp-measure{position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;white-space:nowrap;line-height:1.25;letter-spacing:-.02em}
[data-al-word-push] .awp-measure span{display:block;width:max-content}
[data-al-word-push] .awp-a11y{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
`
const clamp=(n:number)=>Math.max(0,Math.min(1,n))
function ease(x:number){x=clamp(x);if(x===0||x===1)return x;let lo=0,hi=1;for(let i=0;i<14;i++){const t=(lo+hi)/2,v=3*(1-t)*(1-t)*t*.22+3*(1-t)*t*t*.36+t*t*t;if(v<x)lo=t;else hi=t}const t=(lo+hi)/2;return 3*(1-t)*(1-t)*t+3*(1-t)*t*t+t*t*t}
/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ALWordPush(props:Props){
 const {lead='LOVE IS',words=DEFAULTS,leadFont,wordFont,navigationFont,background='#FAF9F7',leadColor='#7C7367',wordColor='#746C60',bpm=120,duration=600,loop=true,reducedMotion=false,fullViewport=true,showReload=true,showLibrary=false,libraryLink='/',price='Free',style}=props
 const key=JSON.stringify(words),fontKey=JSON.stringify([leadFont,wordFont]),items=React.useMemo(()=>{const valid=words.filter(w=>w.text?.trim()).slice(0,30).map(w=>({text:w.text!.trim().toUpperCase(),beats:Math.max(.5,w.beats||2)}));return valid.length?valid:DEFAULTS.map(w=>({text:w.text!,beats:w.beats!}))},[key]),label=lead.toUpperCase(),root=React.useRef<HTMLElement>(null),reset=React.useRef(()=>{}),saved=React.useRef<{elapsed:number;timeline:Timeline|null}>({elapsed:0,timeline:null}),manualPause=React.useRef(false),pause=React.useRef(()=>{}),uid=React.useId().replace(/:/g,''),isStatic=useIsStaticRenderer()
 const baseLead=parseFloat(String(leadFont?.fontSize||112))||112,baseWord=parseFloat(String(wordFont?.fontSize||112))||112,fallbackSize=`max(6px,min(${Math.max(baseLead,baseWord)}px,${78/(label.length+Math.max(...items.map(w=>w.text.length))+1)}cqw,calc((100cqh - 136px)/1.5)))`
 React.useEffect(()=>{
  const host=root.current;if(!host)return
  const line=host.querySelector<HTMLElement>('.awp-line')!,leadEl=host.querySelector<HTMLElement>('.awp-lead')!,leadMask=host.querySelector<HTMLElement>('.awp-mask')!,slot=host.querySelector<HTMLElement>('.awp-slot')!,nodes=Array.from(host.querySelectorAll<HTMLElement>('.awp-word')),probes=Array.from(host.querySelectorAll<HTMLElement>('.awp-measure span')),announce=host.querySelector<HTMLElement>('.awp-a11y')!,mq=matchMedia('(prefers-reduced-motion: reduce)'),beat=60000/Math.max(30,bpm),push=Math.max(100,duration)
  const starts:number[]=[];let total=0;items.forEach(w=>{starts.push(total);total+=w.beats*beat});const lastStart=starts[starts.length-1],out=70+lastStart+2.5*beat,cycle=out+push+900,reducedCycle=total+2.5*beat
  const timeline=():Timeline=>({starts,shift:reducedMotion||mq.matches?0:70,out,push,period:reducedMotion||mq.matches?reducedCycle:cycle,reduced:reducedMotion||mq.matches,loop})
  let currentTimeline=timeline()
  let elapsed=saved.current.timeline?retime(saved.current.elapsed,saved.current.timeline,currentTimeline):0,raf=0,timer=0,last=0,ready=false,disposed=false,visible=true,announced=-2,lineHeight=0
  const quiet=()=>reducedMotion||mq.matches
  const stop=()=>{cancelAnimationFrame(raf);clearTimeout(timer);raf=0;timer=0;last=0;host.dataset.running='false';leadEl.style.willChange='auto';nodes.forEach(n=>n.style.willChange='auto')}
  const advance=(now:number)=>{if(last)elapsed+=now-last;last=now;saved.current={elapsed,timeline:currentTimeline}}
  const paint=()=>{
   const reduced=quiet(),period=reduced?reducedCycle:cycle,t=isStatic?0:loop?elapsed%period:elapsed,shift=reduced?0:70
   let index=-1;for(let i=0;i<starts.length;i++)if(t>=starts[i]+shift)index=i
   if(isStatic)index=0
   const leaving=!reduced&&loop&&t>=out,blank=leaving&&t>=out+push
   let moving=false,next=Infinity
   const event=(at:number)=>{if(at>t+.25)next=Math.min(next,at-t)}
   let ly=0;if(!reduced&&!isStatic){ly=leaving?ease((t-out)/push)*100:-100*(1-ease(t/push));moving=t<push||leaving&&!blank;event(push);if(loop){event(out);event(out+push);event(cycle)}}
   leadEl.style.transform=`translateY(${ly}%)`;leadEl.style.willChange=moving?'transform':'auto'
   nodes.forEach((node,i)=>{const start=starts[i]+shift,end=i+1<items.length?starts[i+1]+shift:loop&&!reduced?out:Infinity;let y=0,show=false
    if(isStatic||reduced){show=i===index;node.style.willChange='auto'}
    else if(t>=start&&t<end+push){show=true;if(t<end){y=-100*(1-ease((t-start)/push));if(t<start+push)moving=true}else{const from=-100*(1-ease((end-start)/push));y=from+(100-from)*ease((t-end)/push);moving=true}node.style.willChange=moving?'transform':'auto'}
    node.style.opacity=show?'1':'0';node.style.transform=`translateY(${y}%)`;if(!isStatic){event(start);if(!reduced){event(start+push);event(end);event(end+push)}}
   })
   if(reduced&&loop)event(reducedCycle)
   if(index>=0&&index!==announced){announced=index;announce.textContent=`${label} ${items[index].text}`}
   host.dataset.word=index>=0?items[index].text:'';host.dataset.elapsed=String(Math.round(t));host.dataset.phase=isStatic?'static':reduced?'reduced':blank?'pause':leaving?'outro':t<70?'intro':'words';host.dataset.reduced=String(reduced)
   return {moving:!reduced&&!isStatic&&moving,next}
  }
  const layout=()=>{
   const w=host.clientWidth,h=host.clientHeight,pad=Math.min(32,Math.max(16,w*.025)),leadW=probes[0].getBoundingClientRect().width,wordW=Math.max(...probes.slice(1).map(p=>p.getBoundingClientRect().width)),baseH=Math.max(...probes.map(p=>p.getBoundingClientRect().height)),gap=Math.max(baseLead,baseWord)*.24,available=Math.max(8,h-136),scale=Math.min(1,.78*Math.max(8,w-2*pad)/(leadW+wordW+gap),available/baseH)
   leadEl.style.fontSize=baseLead*scale+'px';nodes.forEach(n=>n.style.fontSize=baseWord*scale+'px');line.style.fontSize=Math.max(baseLead,baseWord)*scale+'px';line.style.gap=gap*scale+'px';leadMask.style.width=leadW*scale+'px';slot.style.width=wordW*scale+'px';lineHeight=baseH*scale;leadMask.style.height=slot.style.height=lineHeight+'px';leadEl.style.height=lineHeight+'px';nodes.forEach(n=>n.style.height=lineHeight+'px');host.dataset.width=String(w);host.dataset.height=String(h);paint()
  }
  const tick=(now:number)=>{raf=0;timer=0;if(disposed||!ready||isStatic||manualPause.current||!visible||document.hidden){stop();return}advance(now);const {moving,next}=paint();if(moving){host.dataset.running='true';raf=requestAnimationFrame(tick)}else{host.dataset.running='false';if(Number.isFinite(next)){timer=window.setTimeout(()=>{timer=0;raf=requestAnimationFrame(tick)},Math.max(1,next))}}}
  const wake=()=>{host.dataset.paused=String(manualPause.current||!visible||document.hidden);if(manualPause.current||!visible||document.hidden||isStatic){if(last)advance(performance.now());stop();return}if(ready&&!raf&&!timer){last=performance.now();raf=requestAnimationFrame(tick)}}
  reset.current=()=>{if(isStatic)return;manualPause.current=false;stop();elapsed=0;saved.current={elapsed,timeline:currentTimeline};announced=-2;paint();wake()}
  pause.current=()=>{if(isStatic)return;manualPause.current=!manualPause.current;wake();paint()}
  const visibility=()=>wake(),motion=()=>{if(last)advance(performance.now());stop();const next=timeline();elapsed=retime(elapsed,currentTimeline,next);currentTimeline=next;saved.current={elapsed,timeline:currentTimeline};paint();wake()}
  const ro=new ResizeObserver(layout),io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;wake()});ro.observe(host);io.observe(host);document.addEventListener('visibilitychange',visibility);mq.addEventListener('change',motion)
  layout();if(isStatic){ready=true;paint()}else document.fonts.ready.then(()=>{if(disposed)return;ready=true;layout();wake()})
  return()=>{if(last)advance(performance.now());disposed=true;stop();ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',visibility);mq.removeEventListener('change',motion);reset.current=()=>{};pause.current=()=>{}}
 },[key,label,fontKey,bpm,duration,loop,reducedMotion,isStatic])
 return <section ref={root} data-al-word-push="" data-keyboard="false" data-al-demo-viewport={fullViewport&&showLibrary&&!isStatic?'true':undefined} tabIndex={isStatic?undefined:0} role="region" aria-label="Word Push. Press Enter to restart or Escape to pause and resume." onPointerDown={e=>{e.currentTarget.dataset.keyboard='false'}} onKeyDownCapture={e=>{e.currentTarget.dataset.keyboard='true'}} onClick={e=>{if(!isStatic&&!(e.target as HTMLElement).closest('button,a'))reset.current()}} onKeyDown={e=>{if(isStatic)return;if(e.key==='Escape'){e.preventDefault();pause.current();return}if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();reset.current()}}} style={{...style,position:'relative',width:'100%',height:fullViewport?'100dvh':'100%',minHeight:0,overflow:'clip',background,color:wordColor,fontFamily:'Inter, sans-serif'}}>
 <style dangerouslySetInnerHTML={{__html:css}}/><p className="awp-a11y" aria-live="polite" aria-atomic="true">{label} {items[0].text}</p><div className="awp-line" aria-hidden="true" style={{fontSize:fallbackSize}}><span className="awp-mask"><span className="awp-lead" style={{...leadFont,fontSize:'inherit',color:leadColor}}>{label}</span></span><span className="awp-mask awp-slot">{items.map((w,i)=><span className="awp-word" key={i} style={{...wordFont,fontSize:'inherit',color:wordColor}}>{w.text}</span>)}</span></div><div className="awp-measure" aria-hidden="true"><span style={{...leadFont,fontSize:baseLead,fontWeight:leadFont?.fontWeight||400}}>{label}</span>{items.map((w,i)=><span key={i} style={{...wordFont,fontSize:baseWord,fontWeight:wordFont?.fontWeight||500}}>{w.text}</span>)}</div>
 {showReload && !isStatic && (
        <button
          type="button"
          className="awp-reset" aria-label="Replay words"
          title="Replay words"
          onClick={() => reset.current()}
          style={{
            ...pill,
            position: "absolute",
            right: 16,
            top: "max(16px,env(safe-area-inset-top))",
            width: 68,
            height: 44,
            padding: 0,
            cursor: "pointer",
            zIndex: 20,
          }}
        >
          {" "}
          <svg
            width="32"
            height="32"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient
                id={`${uid}-reload-top`}
                x1="24"
                y1="8"
                x2="24"
                y2="37"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="currentColor" />
                <stop offset=".38" stopColor="currentColor" stopOpacity=".94" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id={`${uid}-reload-bottom`}
                x1="24"
                y1="40"
                x2="24"
                y2="11"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="currentColor" />
                <stop offset=".38" stopColor="currentColor" stopOpacity=".94" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M27 8.3A16 16 0 0 1 35.3 35.3"
              stroke={`url(#${uid}-reload-top)`}
              strokeWidth="4.5"
            />
            <path
              d="M21 39.7A16 16 0 0 1 12.7 12.7"
              stroke={`url(#${uid}-reload-bottom)`}
              strokeWidth="4.5"
            />
            <path
              d="M18 8.3 28 2.3v12Z M30 39.7 20 45.7v-12Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
      {showLibrary && !isStatic && (
        <nav
          aria-label="Library"
          style={{
            ...pill,
            position: "absolute",
            left: 20,
            bottom: "max(20px,env(safe-area-inset-bottom))",
            height: 38,
            padding: "0 16px",
            gap: 14,
            border: 0,
            zIndex: 20,
            fontSize: 14,
            ...navigationFont,
          }}
        >
          <a
            href={libraryLink || "/"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m15 5-7 7 7 7" />
            </svg>
            Library
          </a>
          <span style={{ fontWeight: 600 }}>{price}</span>
        </nav>
      )}

 </section>
}
const fontControl={type:ControlType.Font,controls:'extended',defaultFontType:'sans-serif'} as const
addPropertyControls(ALWordPush,{lead:{type:ControlType.String,title:'Lead',defaultValue:'LOVE IS'},words:{type:ControlType.Array,title:'Words',maxCount:30,defaultValue:DEFAULTS,control:{type:ControlType.Object,controls:{text:{type:ControlType.String,title:'Word'},beats:{type:ControlType.Number,title:'Beats',min:.5,max:8,step:.5,defaultValue:2}}}},leadFont:{...fontControl,title:'Lead Font'},wordFont:{...fontControl,title:'Word Font'},navigationFont:{...fontControl,title:'Navigation Font'},background:{type:ControlType.Color,title:'Background',defaultValue:'#FAF9F7'},leadColor:{type:ControlType.Color,title:'Lead Color',defaultValue:'#7C7367'},wordColor:{type:ControlType.Color,title:'Word Color',defaultValue:'#746C60'},bpm:{type:ControlType.Number,title:'BPM',min:30,max:240,defaultValue:120},duration:{type:ControlType.Number,title:'Push Duration',min:100,max:1200,step:50,defaultValue:600,unit:'ms'},loop:{type:ControlType.Boolean,title:'Loop',defaultValue:true},reducedMotion:{type:ControlType.Boolean,title:'Reduced Motion',defaultValue:false},fullViewport:{type:ControlType.Boolean,title:'Full Viewport',defaultValue:true},showReload:{type:ControlType.Boolean,title:'Show Reload',defaultValue:true},showLibrary:{type:ControlType.Boolean,title:'Show Library',defaultValue:false},libraryLink:{type:ControlType.Link,title:'Library Link',defaultValue:'/',hidden:p=>!p.showLibrary},price:{type:ControlType.String,title:'Price',defaultValue:'Free',hidden:p=>!p.showLibrary}})
