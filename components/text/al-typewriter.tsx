import * as React from 'react'
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
interface Props {
 stem?:string; phrases?:string[]; font?:React.CSSProperties; navigationFont?:React.CSSProperties;
 color?:string; background?:string; typeSpeed?:number; deleteSpeed?:number; hold?:number; pause?:number;
 blink?:number; mobileBreak?:number; autoplay?:boolean; reducedMotion?:boolean; fullViewport?:boolean;
 showReload?:boolean; showLibrary?:boolean; libraryLink?:string; price?:string; style?:React.CSSProperties;
}
const DEFAULTS=['SMILES','DREAMS','MOMENTS','BEGINNINGS']
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
const letters=(text:string)=>{
 const Segmenter=(Intl as unknown as {Segmenter?:new(locale?:string,options?:{granularity:string})=>{segment:(text:string)=>Iterable<{segment:string}>}}).Segmenter
 return Segmenter?Array.from(new Segmenter(undefined,{granularity:'grapheme'}).segment(text),part=>part.segment):Array.from(text)
}
const pill:React.CSSProperties={display:'inline-flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,.92)',border:'1px solid rgba(0,0,0,.13)',borderRadius:24,boxShadow:'0 2px 8px rgba(0,0,0,.04)',color:'#62615E'}
const css=`
[data-al-typewriter]{outline:none;-webkit-tap-highlight-color:transparent}
[data-al-typewriter] *{box-sizing:border-box}
[data-al-typewriter] .al-tw-stage{position:absolute;inset:0;display:grid;place-items:center;padding:24px;pointer-events:none}
[data-al-typewriter] .al-tw-heading{position:relative;display:flex;align-items:baseline;gap:.25em;width:max-content;max-width:none;margin:0;white-space:nowrap;text-align:left}
[data-al-typewriter] .al-tw-track{position:relative;display:inline-grid;grid-template-columns:max-content;grid-template-rows:auto;white-space:pre}
[data-al-typewriter] .al-tw-measure{grid-area:1/1;visibility:hidden;pointer-events:none;white-space:pre}
[data-al-typewriter] .al-tw-line{position:absolute;top:0;left:0;white-space:pre}
[data-al-typewriter] .al-tw-caret{display:inline-block;animation:al-tw-blink var(--al-tw-blink,1s) step-end infinite}
[data-al-typewriter][data-phase=type] .al-tw-caret,[data-al-typewriter][data-phase=delete] .al-tw-caret,[data-al-typewriter][data-paused=true] .al-tw-caret,[data-al-typewriter][data-reduced=true] .al-tw-caret{animation:none;opacity:1}
[data-al-typewriter][data-mobile=true] .al-tw-heading{flex-direction:column;align-items:flex-start;gap:0}
[data-al-typewriter] .al-tw-heading::after{content:'';position:absolute;left:0;bottom:-10px;width:24px;height:2px;background:currentColor;opacity:0}
[data-al-typewriter]:focus-visible .al-tw-heading::after{opacity:.7}
[data-al-typewriter] button:focus-visible,[data-al-typewriter] nav a:focus-visible{outline:2px solid #77716A;outline-offset:4px}
[data-al-typewriter] .al-tw-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@keyframes al-tw-blink{0%,50%{opacity:1}50.01%,100%{opacity:0}}
@media(prefers-reduced-motion:reduce){[data-al-typewriter] .al-tw-caret{animation:none}}
`
/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ALTypewriter(props:Props){
 const {stem='SWEET',phrases=DEFAULTS,font,navigationFont,color='#77716A',background='#FAF9F7',typeSpeed=70,deleteSpeed=40,hold=1200,pause=400,blink=1,mobileBreak=600,autoplay=true,reducedMotion=false,fullViewport=true,showReload=true,showLibrary=false,libraryLink='/',price='Free',style}=props
 const textKey=JSON.stringify(phrases),words=React.useMemo(()=>{const clean=phrases.map(s=>String(s).trim().toUpperCase()).filter(Boolean).slice(0,24);return clean.length?clean:DEFAULTS},[textKey])
 const prefix=String(stem).toUpperCase(),fontKey=JSON.stringify(font),isStatic=useIsStaticRenderer(),uid=React.useId().replace(/:/g,'')
 const root=React.useRef<HTMLElement>(null),title=React.useRef<HTMLHeadingElement>(null),word=React.useRef<HTMLSpanElement>(null),caret=React.useRef<HTMLSpanElement>(null),reset=React.useRef(()=>{})
 const togglePause=React.useRef(()=>{}),refresh=React.useRef(()=>{}),[paused,setPaused]=React.useState(!autoplay)
 const settings=React.useRef({typeSpeed,deleteSpeed,hold,pause,mobileBreak,autoplay,reducedMotion,fontSize:60});
 const fontSize=clamp(parseFloat(String(font?.fontSize||60))||60,10,240)
 settings.current={typeSpeed,deleteSpeed,hold,pause,mobileBreak,autoplay,reducedMotion,fontSize}
 React.useEffect(()=>{
  let {typeSpeed,deleteSpeed,hold,pause,mobileBreak,autoplay,reducedMotion,fontSize}=settings.current
  const host=root.current,heading=title.current,text=word.current,cursor=caret.current;if(!host||!heading||!text||!cursor)return
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)'),quiet=()=>isStatic||reducedMotion||mq.matches
  const graphemes=words.map(letters)
  let index=0,count=0,phase:'pause'|'type'|'hold'|'delete'='pause',timer=0,due=0,remaining=Math.max(0,pause),visible=true,manualPause=!autoplay,disposed=false,steps=0
  const halted=()=>quiet()||manualPause||!visible||document.hidden
  const stop=()=>{if(timer){remaining=Math.max(0,due-performance.now());clearTimeout(timer);timer=0}}
  const paint=()=>{
   setPaused(manualPause);text.textContent=graphemes[index].slice(0,count).join('');host.dataset.index=String(index);host.dataset.count=String(count);host.dataset.phase=phase;host.dataset.steps=String(steps);host.dataset.paused=String(halted());host.dataset.reduced=String(quiet())
  }
  const schedule=()=>{if(timer||disposed||halted())return;due=performance.now()+remaining;timer=window.setTimeout(advance,Math.max(1,remaining))}
  const rest=(state:'hold'|'pause',ms:number)=>{phase=state;remaining=ms;cursor.style.animation='none';void cursor.offsetWidth;cursor.style.animation=''}
  const advance=()=>{
   timer=0;if(disposed||halted())return;steps++
   if(phase==='pause'){phase='type';count=1;remaining=typeSpeed;if(count>=graphemes[index].length)rest('hold',hold)}
   else if(phase==='type'){count++;remaining=typeSpeed;if(count>=graphemes[index].length)rest('hold',hold)}
   else if(phase==='hold'){phase='delete';count=Math.max(0,count-1);remaining=deleteSpeed;if(!count){index=(index+1)%words.length;rest('pause',pause)}}
   else {count=Math.max(0,count-1);remaining=deleteSpeed;if(!count){index=(index+1)%words.length;rest('pause',pause)}}
   paint();schedule()
  }
  const layout=()=>{
   const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return
   host.dataset.mobile=String(w<mobileBreak);host.dataset.width=String(w);host.dataset.height=String(h)
   const base=Math.min(fontSize,Math.max(fontSize*.5,w*.04));heading.style.fontSize=`${base}px`
   const maxW=Math.max(24,w-48),maxH=Math.max(24,h-(isStatic?48:140)),r=heading.getBoundingClientRect()
   const scale=Math.min(1,maxW/Math.max(1,r.width),maxH/Math.max(1,r.height));heading.style.fontSize=`${Math.max(4,base*scale)}px`
  }
  const start=()=>{
   stop();index=0;steps=0;manualPause=!autoplay;phase='pause';count=0;remaining=pause
   if(quiet()||!autoplay){count=graphemes[0].length;phase='hold';remaining=hold}
   paint();schedule()
  };reset.current=start
  togglePause.current=()=>{if(isStatic)return;stop();manualPause=!manualPause;paint();schedule()}
  const keydown=(e:KeyboardEvent)=>{
   if(isStatic)return
   if((e.target as HTMLElement).closest('button,nav,a'))return
   if(![' ','Enter','Escape','Home','End','ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key))return
   e.preventDefault();host.dataset.keyboard='true';stop()
   if(e.key==='Home'){index=0;count=graphemes[0].length;phase='hold';manualPause=true;remaining=hold}
   else if(e.key==='End'){index=words.length-1;count=graphemes[index].length;phase='hold';manualPause=true;remaining=hold}
   else if(e.key.startsWith('Arrow')){index=(index+(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)+words.length)%words.length;count=graphemes[index].length;phase='hold';remaining=hold}
   else manualPause=e.key==='Escape'?true:!manualPause
   paint();schedule()
  }
  const pointer=()=>{host.dataset.keyboard='false'}
  const visibility=()=>{stop();paint();schedule()}
  const motion=()=>{stop();if(quiet()){count=graphemes[index].length;phase='hold';remaining=hold}paint();schedule()}
  refresh.current=()=>{
   stop();const wasQuiet=quiet(),oldAutoplay=autoplay;({typeSpeed,deleteSpeed,hold,pause,mobileBreak,autoplay,reducedMotion,fontSize}=settings.current)
   if(oldAutoplay!==autoplay)manualPause=!autoplay
   if(!wasQuiet&&quiet()){count=graphemes[index].length;phase='hold';remaining=hold}
   layout();paint();schedule()
  }
  layout();start();const ro=new ResizeObserver(layout);ro.observe(host)
  const io=new IntersectionObserver(([e])=>{stop();visible=e.isIntersecting;paint();schedule()},{threshold:0});io.observe(host)
  const fontLoaded=()=>{if(!disposed)layout()};document.fonts.ready.then(fontLoaded);document.fonts.addEventListener('loadingdone',fontLoaded)
  host.addEventListener('keydown',keydown);host.addEventListener('pointerdown',pointer);document.addEventListener('visibilitychange',visibility);mq.addEventListener('change',motion)
  return()=>{disposed=true;stop();ro.disconnect();io.disconnect();host.removeEventListener('keydown',keydown);host.removeEventListener('pointerdown',pointer);document.removeEventListener('visibilitychange',visibility);mq.removeEventListener('change',motion);document.fonts.removeEventListener('loadingdone',fontLoaded);reset.current=()=>{};togglePause.current=()=>{};refresh.current=()=>{}}
 },[textKey,isStatic])
 React.useEffect(()=>{refresh.current()},[prefix,fontKey,typeSpeed,deleteSpeed,hold,pause,mobileBreak,autoplay,reducedMotion,showReload,showLibrary])
 return <section ref={root} data-al-typewriter="true" data-al-demo-viewport={fullViewport&&showLibrary&&!isStatic?'true':undefined} data-reduced={isStatic||reducedMotion?'true':undefined} role="region" aria-label="Typewriter" aria-describedby={`${uid}-instructions`} tabIndex={isStatic?undefined:0} style={{...style,position:'relative',width:'100%',height:fullViewport&&!isStatic?'100dvh':style?.height||'100%',minHeight:0,overflow:'clip',overscrollBehavior:'none',touchAction:fullViewport&&showLibrary&&!isStatic?'none':'auto',background}}>
  <style dangerouslySetInnerHTML={{__html:css}}/>
  <div className="al-tw-stage"><h1 ref={title} className="al-tw-heading" aria-label={`${prefix}: ${words.join(', ')}`} style={{fontFamily:'Inter, sans-serif',fontWeight:400,lineHeight:1.1,letterSpacing:'-.01em',...font,fontSize:`clamp(${fontSize/2}px,4vw,${fontSize}px)`,color}}>
   <span className="al-tw-stem" aria-hidden="true">{prefix}</span>
   <span className="al-tw-track" aria-hidden="true">{words.map((p,i)=><span key={i} className="al-tw-measure">{p}|</span>)}<span className="al-tw-line"><span ref={word} className="al-tw-word">{words[0]}</span><span ref={caret} className="al-tw-caret" style={{'--al-tw-blink':`${blink}s`} as React.CSSProperties}>|</span></span></span>
  </h1></div>
  <span id={`${uid}-instructions`} className="al-tw-sr">A headline that types, holds and erases each phrase. Space or Enter pauses and resumes. Escape pauses. Arrow keys change the phrase. Home and End show the first or last phrase.</span>
{!isStatic&&<button type="button" aria-label={paused?'Resume typewriter':'Pause typewriter'} aria-pressed={paused} onClick={()=>togglePause.current()} style={{...pill,position:'absolute',left:16,top:'max(16px,env(safe-area-inset-top))',minWidth:80,height:44,padding:'0 14px',cursor:'pointer',zIndex:20,fontSize:14,...navigationFont}}>{paused?'Resume':'Pause'}</button>}
{showReload && !isStatic && (
        <button
          type="button"
          className="al-tw-reset" aria-label="Restart typewriter"
          title="Restart typewriter"
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
addPropertyControls(ALTypewriter,{
 stem:{type:ControlType.String,title:'Stem',defaultValue:'SWEET'},phrases:{type:ControlType.Array,title:'Phrases',maxCount:24,control:{type:ControlType.String,defaultValue:'SMILES'},defaultValue:DEFAULTS},
 font:{type:ControlType.Font,title:'Text font',controls:'extended',defaultFontType:'sans-serif',defaultValue:{fontSize:60,variant:'Regular',lineHeight:1.1,letterSpacing:'-.01em'}},
 navigationFont:{type:ControlType.Font,title:'Navigation font',controls:'extended',defaultFontType:'sans-serif',defaultValue:{fontSize:14}},
 color:{type:ControlType.Color,title:'Text color',defaultValue:'#77716A'},background:{type:ControlType.Color,title:'Background',defaultValue:'#FAF9F7'},
 typeSpeed:{type:ControlType.Number,title:'Typing',defaultValue:70,min:15,max:300,unit:'ms'},deleteSpeed:{type:ControlType.Number,title:'Deleting',defaultValue:40,min:10,max:200,unit:'ms'},hold:{type:ControlType.Number,title:'Hold',defaultValue:1200,min:200,max:6000,step:100,unit:'ms'},pause:{type:ControlType.Number,title:'Pause',defaultValue:400,min:0,max:3000,step:50,unit:'ms'},blink:{type:ControlType.Number,title:'Caret blink',defaultValue:1,min:.5,max:2,step:.1,unit:'s'},
 mobileBreak:{type:ControlType.Number,title:'Line break',defaultValue:600,min:320,max:1200,unit:'px'},autoplay:{type:ControlType.Boolean,title:'Autoplay',defaultValue:true},reducedMotion:{type:ControlType.Boolean,title:'Reduced motion',defaultValue:false},fullViewport:{type:ControlType.Boolean,title:'Full viewport',defaultValue:true},showReload:{type:ControlType.Boolean,title:'Reload',defaultValue:true},showLibrary:{type:ControlType.Boolean,title:'Demo navigation',defaultValue:false},libraryLink:{type:ControlType.Link,title:'Library link',defaultValue:'/',hidden:p=>!p.showLibrary},price:{type:ControlType.String,title:'Price label',defaultValue:'Free',hidden:p=>!p.showLibrary}
})
