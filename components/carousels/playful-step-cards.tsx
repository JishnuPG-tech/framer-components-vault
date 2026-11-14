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

type Step = { label:string; title:string; text:string; color:string; accent:string; shape:"window"|"palette"|"motion"|"launch"; image?:string; imageFit?:"cover"|"contain"; imagePosition?:"center"|"top"|"bottom"|"left"|"right"; imageAlt?:string; cta:string; link:string }
type Props = { steps:Step[]; cardWidth:number; background:string; ink:string; cardHeight:number; radius:number; spread:number; speed:number; titleFont:React.CSSProperties; bodyFont:React.CSSProperties; style?:React.CSSProperties }

const DEFAULT_STEPS:Step[] = [
 {"label":"START HERE","title":"Find your spark.","text":"Every great project begins with a little curiosity.","color":"#AAA8FF","accent":"#FAFC56","shape":"window","cta":"Get started","link":""},
 {"label":"PICK A PATH","title":"Choose your direction.","text":"Explore the options and find what feels right.","color":"#D5F16B","accent":"#648FFF","shape":"palette","cta":"Explore tools","link":""},
 {"label":"ADD COLOR","title":"Make it your own.","text":"Build a style that feels unmistakably yours.","color":"#FF986E","accent":"#F4B1E3","shape":"palette","cta":"Discover more","link":""},
 {"label":"CREATE MOTION","title":"Bring it to life.","text":"Add tiny moments of movement and delight.","color":"#F6A9DE","accent":"#C9F174","shape":"motion","cta":"Learn more","link":""},
 {"label":"TRY IT OUT","title":"Test the details.","text":"Keep what works. Change what gets in the way.","color":"#6F9CF7","accent":"#F9F46C","shape":"window","cta":"Try it out","link":""},
 {"label":"GO LIVE","title":"Share your idea.","text":"Put it into the world and see what happens.","color":"#FFF26F","accent":"#B6A6FF","shape":"launch","cta":"Start building","link":""},
 {"label":"WHAT'S NEXT","title":"Keep exploring.","text":"A new idea is always just around the corner.","color":"#8EEAC4","accent":"#FF9975","shape":"motion","cta":"Explore more","link":""}
]
const mod=(n:number,m:number)=>((n%m)+m)%m

function Arrow({left=false}:{left?:boolean}) {
 return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{display:"block",transform:left?"rotate(180deg)":"none"}}><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function Art({kind,accent}:{kind:Step["shape"];accent:string}) {
 const ink="#161616"
 return <svg viewBox="0 0 300 300" className="psc-art" width="100%" height="100%" aria-hidden="true">
  <path d="M150 11c31 1 41 33 65 40s53-6 69 16-2 45 7 70 36 34 30 58-36 30-49 50-11 51-36 58-44-17-68-19-44 21-66 10-16-41-35-57-46-19-49-43 24-38 29-62-14-46 4-64 46-8 67-21 22-37 42-36Z" fill={accent}/>
  {kind==="window" && <g transform="rotate(-8 150 150)">
   <rect x="55" y="75" width="193" height="150" rx="24" fill="#FFF" stroke={ink} strokeWidth="4"/>
   <path d="M55 113h193" stroke={ink} strokeWidth="4"/><circle cx="78" cy="94" r="5" fill={ink}/><circle cx="94" cy="94" r="5" fill={ink}/>
   <rect x="80" y="135" width="111" height="17" rx="8" fill={ink}/><rect x="80" y="166" width="138" height="9" rx="4.5" fill="#CECECE"/><rect x="80" y="183" width="104" height="9" rx="4.5" fill="#CECECE"/>
   <circle cx="215" cy="207" r="32" fill="#FF906E" stroke={ink} strokeWidth="4"/><path d="M202 207h26m-13-13v26" stroke={ink} strokeWidth="4" strokeLinecap="round"/>
  </g>}
  {kind==="palette" && <g transform="rotate(-9 150 150)">
   <rect x="48" y="84" width="209" height="149" rx="74" fill="#FFF" stroke={ink} strokeWidth="4"/>
   <circle cx="97" cy="132" r="23" fill="#FF9870" stroke={ink} strokeWidth="3"/><circle cx="175" cy="114" r="23" fill="#8196FF" stroke={ink} strokeWidth="3"/>
   <circle cx="217" cy="175" r="23" fill="#BEF178" stroke={ink} strokeWidth="3"/><circle cx="144" cy="199" r="23" fill="#F4A2DD" stroke={ink} strokeWidth="3"/>
  </g>}
  {kind==="motion" && <g transform="rotate(-11 150 150)">
   <rect x="54" y="78" width="195" height="52" rx="26" fill={ink}/>
   <rect x="40" y="143" width="222" height="52" rx="26" fill="#FFF" stroke={ink} strokeWidth="4"/>
   <rect x="75" y="211" width="166" height="50" rx="25" fill="#F9F36C" stroke={ink} strokeWidth="4"/>
   {Array.from({length:6},(_,i)=><rect key={i} x={79+i*28} y={91+(i%2)*-9} width="10" height={27+(i%2)*18} rx="5" fill="#F9F36C"/>)}
   <path d="M74 169h125m-25-12 25 12-25 12" stroke={ink} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </g>}
  {kind==="launch" && <g>
   <path d="m150 34 31 36 48-20 8 49 48 16-28 36 27 43-52 7-10 51-47-24-25 46-29-46-48 23-9-51-50-10 28-40-29-40 51-12 10-48 47 20Z" fill="#FFF" stroke={ink} strokeWidth="4"/>
   <path d="M87 185 206 75c12-11 30-3 28 13l-6 119c-1 15-17 21-28 12l-31-28-35 45c-10 14-31 4-27-13l13-57-34-4c-17-2-15-24 1-26Z" fill={accent} stroke={ink} strokeWidth="5" strokeLinejoin="round"/>
   <path d="m139 169 57-58" stroke={ink} strokeWidth="5" strokeLinecap="round"/>
  </g>}
  <path d="m35 70 10-20M266 57l20-17M258 266l24 17M35 245l-19 19" stroke={ink} strokeWidth="4.5" strokeLinecap="round"/>
 </svg>
}

const CSS = "\n.psc-root{container-type:inline-size}\n.psc-root *{box-sizing:border-box}\n.psc-stage{position:relative;height:calc(var(--psc-h) + 50px);width:100%;isolation:isolate;touch-action:pan-y}\n.psc-card{position:absolute;inset:0;margin:auto;width:min(74%,var(--psc-w));height:var(--psc-h);will-change:transform}\n.psc-surface{height:100%;width:100%;display:flex;flex-direction:column-reverse;justify-content:space-between;position:relative;overflow:hidden;border-radius:var(--psc-r);border:1px solid rgba(0,0,0,.08);padding:20px;color:var(--psc-ink);text-decoration:none;text-align:left;box-shadow:0 20px 34px rgba(0,0,0,.12),0 4px 9px rgba(0,0,0,.05)}\n.psc-content{width:100%;min-height:0;display:flex;flex:1;flex-direction:column;justify-content:flex-end;position:relative;z-index:2}\n.psc-meta{font-size:9px;letter-spacing:.08em;font-weight:800;display:flex;align-items:center;gap:8px;line-height:1.1}\n.psc-no{padding:6px 8px;border-radius:40px;border:1.4px solid currentColor;line-height:1}\n.psc-copy{margin:6px 0 0}\n.psc-title{font-size:clamp(23px,2.45cqw,29px);font-weight:800;letter-spacing:-.055em;line-height:1.075;max-width:100%;margin:8px 0 9px;text-wrap:balance}\n.psc-text{font-size:12px;font-weight:500;line-height:1.42;max-width:100%;margin:0}\n.psc-cta{display:inline-flex;align-items:center;gap:9px;min-height:26px;margin-top:11px;padding-bottom:4px;border-bottom:1.5px solid currentColor;font-size:11px;font-weight:800}\n.psc-cta svg{transition:transform .35s cubic-bezier(.2,.9,.25,1)}\n.psc-surface:hover .psc-cta svg{transform:translateX(7px)}\n.psc-art-area{height:120px;flex:0 0 120px;width:100%;min-width:0;display:grid;place-items:center;overflow:visible}\n.psc-art{display:block;width:132px;height:132px;max-width:100%;overflow:visible;transform:rotate(0deg) scale(1);transition:transform .65s cubic-bezier(.18,1.3,.28,1)}\n.psc-surface:hover .psc-art{transform:rotate(-10deg) scale(1.09)}\n.psc-photo-frame{width:100%;height:100%;border-radius:18px;overflow:hidden;background:rgba(255,255,255,.35);box-shadow:0 5px 16px rgba(0,0,0,.12)}\n.psc-photo{display:block;width:100%;height:100%;transition:transform .65s cubic-bezier(.18,1.3,.28,1)}\n.psc-surface:hover .psc-photo{transform:scale(1.08)}\n.psc-side{border:0;background:transparent;padding:0;cursor:pointer;width:100%;height:100%;border-radius:var(--psc-r);overflow:hidden}\n.psc-side:hover{filter:brightness(1.04)}\n.psc-side .psc-surface{pointer-events:none}\n.psc-side .psc-content{opacity:0}\n.psc-side .psc-art-area{opacity:.95}\n.psc-footer{display:flex;justify-content:center;align-items:center;gap:12px;padding:0 14px 12px}\n.psc-footer-dots{display:flex;align-items:center;gap:6px}\n.psc-nav{display:grid;place-items:center;background:transparent;border:1.4px solid currentColor;color:inherit;border-radius:50%;width:36px;height:36px;cursor:pointer;padding:0;flex:none;transition:background .22s,color .22s,transform .3s}\n.psc-nav:hover{background:var(--psc-ink);color:white;transform:scale(1.06)}\n.psc-nav:active{transform:scale(.94)}\n.psc-dot{width:17px;height:4px;background:currentColor;border:0;border-radius:8px;opacity:.19;cursor:pointer;padding:0;transition:width .35s,opacity .35s}\n.psc-dot[aria-current=step]{opacity:1;width:35px}\n.psc-dot:hover{opacity:.58}\n.psc-side:focus-visible,.psc-nav:focus-visible,.psc-dot:focus-visible,.psc-link:focus-visible{outline:3px solid var(--psc-ink);outline-offset:4px}\n@container(max-width:700px){.psc-card{width:min(78%,var(--psc-w))}}\n@container(max-width:520px){\n .psc-card{width:min(80%,260px,var(--psc-w));height:var(--psc-mobile-h)}\n .psc-stage{height:calc(var(--psc-mobile-h) + 40px)}\n .psc-surface{padding:17px}\n .psc-art-area{height:102px;flex:0 0 102px}\n .psc-art{width:115px;height:115px}\n .psc-photo-frame{border-radius:15px}\n .psc-title{font-size:clamp(22px,7cqw,25px);margin:6px 0 7px}\n .psc-text{font-size:11.4px;line-height:1.35}\n .psc-cta{font-size:11px;min-height:24px;margin-top:7px}\n .psc-meta{font-size:8.5px}\n .psc-no{padding:5px 7px}\n .psc-footer{gap:10px;padding-bottom:10px}\n .psc-footer-dots{gap:5px}\n .psc-dot{width:15px}\n .psc-dot[aria-current=step]{width:30px}\n .psc-nav{width:34px;height:34px}\n}\n@media(prefers-reduced-motion:reduce){.psc-root *,.psc-root *:before,.psc-root *:after{transition-duration:.01ms!important;animation-duration:.01ms!important}}\n"

const CardFace = ({step,index,active,ink,titleFont,bodyFont}:{step:Step;index:number;active:boolean;ink:string;titleFont:React.CSSProperties;bodyFont:React.CSSProperties}) =>
 <div className="psc-surface" style={{background:step.color||"#A8ACFF",cursor:active&&step.link?"pointer":"inherit"}}>
  <div className="psc-content">
   <div className="psc-meta"><span className="psc-no">{String(index+1).padStart(2,"0")}</span><span>{step.label}</span></div>
   <div className="psc-copy"><h3 className="psc-title" style={titleFont}>{step.title}</h3><p className="psc-text" style={bodyFont}>{step.text}</p>
    {active&&!!step.link&&!!step.cta&&<span className="psc-cta">{step.cta}<Arrow/></span>}
   </div>
  </div>
  <div className="psc-art-area">{step.image?<div className="psc-photo-frame"><img className="psc-photo" src={step.image} alt={step.imageAlt||""} draggable={false} style={{objectFit:step.imageFit||"cover",objectPosition:step.imagePosition||"center"}}/></div>:<Art kind={step.shape||"window"} accent={step.accent||"#F7FA5C"}/>}</div>
 </div>

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 750
 * @framerIntrinsicHeight 450
 */
export default function PlayfulStepsCarousel(props:Props) {
 const {steps=DEFAULT_STEPS,background="#FFF",ink="#161616",cardWidth=275,cardHeight=355,radius=26,spread=21,speed=.65,titleFont={},bodyFont={},style} = props
 const list=Array.isArray(steps)&&steps.length?steps:DEFAULT_STEPS
 const [active,setActive]=React.useState(0)
 const staticMode=useIsStaticRenderer(), reduced=useReducedMotion()
 const touch=React.useRef<{x:number;y:number}|null>(null)
 const swallow=React.useRef(false)
 const total=list.length
 React.useEffect(()=>setActive(n=>Math.min(n,total-1)),[total])
 const move=React.useCallback((n:number)=>setActive(i=>mod(i+n,total)),[total])
 const transition=staticMode||reduced?{duration:0}:{type:"spring" as const,stiffness:185/Math.max(speed,.25),damping:28/Math.sqrt(Math.max(speed,.25)),mass:1}
 const titleStyle={fontFamily:"Manrope, Inter, sans-serif",fontWeight:800,...titleFont}
 const bodyStyle={fontFamily:"Manrope, Inter, sans-serif",fontWeight:500,...bodyFont}
 return <div className="psc-root" tabIndex={0} onKeyDown={e=>{if(e.key==="ArrowRight"){e.preventDefault();move(1)} if(e.key==="ArrowLeft"){e.preventDefault();move(-1)}}} style={{...style,width:"100%",background,color:ink,overflow:"hidden",boxSizing:"border-box",fontFamily:"Manrope, Inter, sans-serif",["--psc-w" as any]:String(cardWidth)+"px",["--psc-h" as any]:String(cardHeight)+"px",["--psc-mobile-h" as any]:String(Math.max(325,cardHeight-30))+"px",["--psc-r" as any]:String(radius)+"px",["--psc-ink" as any]:ink}}>
  <style>{CSS}</style>
  <div className="psc-stage" onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{if(!touch.current)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.2){swallow.current=true;move(dx<0?1:-1);setTimeout(()=>{swallow.current=false},400)}touch.current=null}} onClickCapture={e=>{if(swallow.current){e.preventDefault();e.stopPropagation();swallow.current=false}}}>
   {list.map((step,i)=>{
    let rel=i-active
    if(rel>total/2)rel-=total
    if(rel<-total/2)rel+=total
    if(total%2===0&&rel===total/2)rel=-rel
    const dist=Math.abs(rel),show=dist<=3,chosen=rel===0
    const face=<CardFace step={step} index={i} active={chosen} ink={ink} titleFont={titleStyle} bodyFont={bodyStyle}/>
    return <motion.div className="psc-card" key={i} initial={false} animate={{x:String(rel*spread)+"%",y:dist*8,rotate:rel*7,scale:1-dist*.07,opacity:show?1:0}} transition={transition} style={{zIndex:100-dist,pointerEvents:show?"auto":"none"}}>
     {chosen?(step.link?<a className="psc-link" href={step.link} target="_blank" rel="noopener noreferrer" style={{display:"block",height:"100%",color:"inherit",textDecoration:"none",borderRadius:radius}} aria-label={step.title+". "+(step.cta||"Open link")}>{face}</a>:<div style={{height:"100%"}}>{face}</div>):<button type="button" className="psc-side" aria-label={"Show step "+(i+1)+": "+step.title} onClick={()=>setActive(i)}>{face}</button>}
    </motion.div>
   })}
  </div>
  <div className="psc-footer"><button type="button" className="psc-nav" onClick={()=>move(-1)} aria-label="Previous step"><Arrow left/></button><div className="psc-footer-dots" aria-label="Choose a step">{list.map((_,i)=><button key={i} type="button" className="psc-dot" onClick={()=>setActive(i)} aria-label={"Go to step "+(i+1)} aria-current={i===active?"step":undefined}/>)}</div><button type="button" className="psc-nav" onClick={()=>move(1)} aria-label="Next step"><Arrow/></button></div>
 </div>
}
PlayfulStepsCarousel.defaultProps={steps:DEFAULT_STEPS,background:"#FFFFFF",ink:"#161616",cardWidth:275,cardHeight:355,radius:26,spread:21,speed:.65,titleFont:{fontFamily:"Manrope",fontWeight:800},bodyFont:{fontFamily:"Manrope",fontWeight:500}}
addPropertyControls(PlayfulStepsCarousel,{
 steps:{type:ControlType.Array,title:"Steps",defaultValue:DEFAULT_STEPS,maxCount:10,control:{type:ControlType.Object,controls:{
  label:{type:ControlType.String,title:"Label",defaultValue:"STEP"},
  title:{type:ControlType.String,title:"Title",defaultValue:"Your next step"},
  text:{type:ControlType.String,title:"Description",displayTextArea:true,defaultValue:"Describe what happens here."},
  color:{type:ControlType.Color,title:"Card Color",defaultValue:"#A8ACFF"},
  accent:{type:ControlType.Color,title:"Shape Color",defaultValue:"#F7FA5C"},
  shape:{type:ControlType.Enum,title:"Illustration",options:["window","palette","motion","launch"],optionTitles:["Window","Palette","Motion","Launch"],defaultValue:"window"},
  image:{type:ControlType.Image,title:"Image"},
  imageFit:{type:ControlType.Enum,title:"Image Fit",options:["cover","contain"],optionTitles:["Cover","Contain"],defaultValue:"cover"},
  imagePosition:{type:ControlType.Enum,title:"Image Focus",options:["center","top","bottom","left","right"],optionTitles:["Center","Top","Bottom","Left","Right"],defaultValue:"center"},
  imageAlt:{type:ControlType.String,title:"Image Alt",defaultValue:""},
  cta:{type:ControlType.String,title:"CTA",defaultValue:"Learn more"},
  link:{type:ControlType.Link,title:"Link",defaultValue:""}
 }}},
 background:{type:ControlType.Color,title:"Background",defaultValue:"#FFFFFF"},
 ink:{type:ControlType.Color,title:"Text Color",defaultValue:"#161616"},
 cardWidth:{type:ControlType.Number,title:"Card Width",defaultValue:275,min:220,max:440,step:10,unit:"px"},
 cardHeight:{type:ControlType.Number,title:"Card Height",defaultValue:355,min:310,max:520,step:10,unit:"px"},
 radius:{type:ControlType.Number,title:"Corner Radius",defaultValue:26,min:0,max:80,unit:"px"},
 spread:{type:ControlType.Number,title:"Card Spread",defaultValue:21,min:8,max:30,unit:"%"},
 speed:{type:ControlType.Number,title:"Motion Speed",defaultValue:.65,min:.3,max:1.5,step:.05},
 titleFont:{type:ControlType.Font,title:"Title Font",controls:"extended"},
 bodyFont:{type:ControlType.Font,title:"Body Font",controls:"extended"}
})
