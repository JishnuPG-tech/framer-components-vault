
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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

type Photo = { src?: string; srcSet?: string; alt?: string }
type Story = { name: string; role: string; quote: string; image?: Photo; backdrop: string; buttonText: string; link: string }
type Props = { stories: Story[]; initialStory: number; stageRadius: number; cardRadius: number; imageRadius: number; outerPadding: number; imagePosition: string; speed: number; cardBackground: string; textColor: string; mutedColor: string; quoteFont?: React.CSSProperties; nameFont?: React.CSSProperties; smallFont?: React.CSSProperties; style?: React.CSSProperties }
const DEFAULT_STORIES: Story[] = [
 { name:"Alex Morgan", role:"Creative Director · Independent Studio", quote:"We wanted something that felt like us. Now every little detail has its place.", image:{src:"https://images.unsplash.com/photo-1626858707111-2fefbc9a848e?auto=format&fit=crop&w=1200&q=85",alt:"Editorial portrait in deep blue tones"},backdrop:"#FA593C",buttonText:"Start Your Site",link:""},
 { name:"Jordan Lee",role:"Founder · Creative Practice",quote:"The best ideas deserve more than another ordinary website.",image:{src:"https://images.unsplash.com/photo-1761882738571-6cf4f77f9b65?auto=format&fit=crop&w=1200&q=85",alt:"Portrait with cobalt and orange tones"},backdrop:"#7567ED",buttonText:"Start Your Site",link:""},
 { name:"Mia Rivera",role:"Artist · Visual Storyteller",quote:"A little bit of personality can completely change how people see your work.",image:{src:"https://images.unsplash.com/photo-1638290420373-ba8c661a1a38?auto=format&fit=crop&w=1200&q=85",alt:"Colorful creative editorial portrait"},backdrop:"#D6EE65",buttonText:"Start Your Site",link:""}
]
const CSS = [
".tcs-root,.tcs-root *{box-sizing:border-box}",
".tcs-root{container-type:inline-size;min-width:0;font-family:Inter,Arial,sans-serif}",
".tcs-stage{display:grid;grid-template-columns:minmax(0,1.06fr) minmax(0,.94fr);gap:20px;padding:26px;border-radius:var(--stage-radius);overflow:hidden;min-width:0}",
".tcs-story{min-width:0;background:var(--card-background);border-radius:var(--card-radius);min-height:450px;display:flex;flex-direction:column;overflow:hidden}",
".tcs-story-content{display:flex;flex-direction:column;flex:1;min-width:0;padding:34px 36px 30px}",
".tcs-eyebrow{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;font-weight:650;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}",
".tcs-topmark{display:inline-block;color:var(--ink);font:42px/.7 Georgia,serif}",
".tcs-quote{margin:38px 0 20px;font-size:clamp(28px,3.1vw,42px);line-height:1.13;letter-spacing:-.055em;font-weight:600;color:var(--ink);text-wrap:pretty}",
".tcs-bottom{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-top:auto;padding-top:24px}",
".tcs-name{color:var(--ink);font-size:15px;font-weight:650;letter-spacing:-.035em}",
".tcs-role{color:var(--muted);font-size:12px;line-height:1.45;margin-top:5px}",
".tcs-cta{display:flex;gap:8px;align-items:center;flex-shrink:0;color:var(--ink);font-size:12px;font-weight:650;white-space:nowrap}",
".tcs-arrow{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:#161616;color:white;border-radius:50%;transition:transform .25s ease}",
".tcs-story-link{display:flex;flex:1;min-width:0;color:inherit;text-decoration:none;cursor:pointer}",
".tcs-story-link:hover .tcs-arrow,.tcs-story-link:focus-visible .tcs-arrow{transform:rotate(-35deg)}",
".tcs-story-link:focus-visible{outline:3px solid #171717;outline-offset:-5px;border-radius:var(--card-radius)}",
".tcs-media{min-width:0;min-height:450px;position:relative;border-radius:var(--image-radius);overflow:hidden;background:#242424}",
".tcs-media-link{position:absolute;inset:0;display:block;border-radius:inherit;overflow:hidden;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}",
".tcs-media-link:focus-visible{outline:3px solid #171717;outline-offset:-5px}",
".tcs-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:var(--image-position);display:block}",
".tcs-media-tag{position:absolute;top:17px;left:17px;background:white;color:#171717;font-weight:650;font-size:10px;letter-spacing:.12em;padding:11px 13px;border-radius:100px;z-index:2}",
".tcs-navigation{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}",
".tcs-nav{border:1px solid rgba(0,0,0,.10);border-radius:12px;background:white;color:#161616;min-width:0;min-height:58px;text-align:left;cursor:pointer;display:flex;align-items:center;gap:12px;padding:12px 15px;font:inherit;transition:background .25s ease,color .25s ease,transform .25s ease}",
".tcs-nav[aria-pressed=true]{background:#171717;color:white;border-color:#171717}",
".tcs-nav:hover{transform:translateY(-2px)}.tcs-nav:focus-visible{outline:3px solid #161616;outline-offset:3px}",
".tcs-num{font-size:11px;opacity:.54;font-weight:650;flex-shrink:0;font-variant-numeric:tabular-nums}",
".tcs-nav-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;letter-spacing:-.025em;font-weight:650}",
".tcs-status{margin-left:auto;width:5px;height:5px;border:1px solid currentColor;border-radius:50%;flex-shrink:0}.tcs-nav[aria-pressed=true] .tcs-status{background:currentColor}",
"@container (max-width:790px){.tcs-stage{grid-template-columns:minmax(0,1fr) minmax(0,.93fr);gap:12px;padding:16px}.tcs-story,.tcs-media{min-height:390px}.tcs-story-content{padding:28px 25px 24px}.tcs-quote{margin-top:27px;font-size:clamp(24px,3.5vw,33px)}.tcs-bottom{flex-wrap:wrap}}",
"@container (max-width:590px){.tcs-stage{grid-template-columns:minmax(0,1fr);padding:12px;gap:12px}.tcs-media{order:-1;min-height:310px;height:310px}.tcs-story{min-height:315px}.tcs-story-content{padding:22px 22px 24px}.tcs-quote{margin-top:20px;margin-bottom:16px;font-size:clamp(25px,6.8cqw,34px);line-height:1.13}.tcs-bottom{gap:16px}.tcs-navigation{margin-top:9px;gap:6px}.tcs-nav{min-height:54px;padding:9px 10px;gap:7px;border-radius:9px}.tcs-nav-name{font-size:11px}.tcs-status{display:none}.tcs-cta{font-size:11px}}",
"@media (prefers-reduced-motion:reduce){.tcs-nav,.tcs-arrow{transition:none!important;transform:none!important}}"
].join("\n")
function Arrow(){ return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 580
 */
export default function TestimonialColorStage(props:Props){
 const {stories=DEFAULT_STORIES,initialStory=0,stageRadius=22,cardRadius=12,imageRadius=12,outerPadding=0,imagePosition="center",speed=.48,cardBackground="#FFFFFF",textColor="#171717",mutedColor="#737373",quoteFont,nameFont,smallFont,style}=props
 const safeStories=Array.isArray(stories)&&stories.length?stories:DEFAULT_STORIES
 const safeIndex=(v:number)=>Math.min(safeStories.length-1,Math.max(0,Math.round(v)))
 const [selected,setSelected]=React.useState(()=>safeIndex(initialStory))
 React.useEffect(()=>setSelected(v=>safeIndex(v)),[safeStories.length])
 React.useEffect(()=>setSelected(safeIndex(initialStory)),[initialStory])
 const active=safeStories[safeIndex(selected)]
 const noMotion=useIsStaticRenderer()||useReducedMotion()
 const duration=noMotion?0:Math.max(.12,Math.min(1.2,speed))
 const link=active.link?.trim()||""
 const vars={"--stage-radius":stageRadius+"px","--card-radius":cardRadius+"px","--image-radius":imageRadius+"px","--card-background":cardBackground,"--ink":textColor,"--muted":mutedColor,"--image-position":imagePosition} as React.CSSProperties
 const content=<div className="tcs-story-content">
  <div className="tcs-eyebrow" style={smallFont}><span>VOICES / THE CREATIVE SIDE</span><span className="tcs-topmark">“</span></div>
  <AnimatePresence initial={false} mode="wait">
   <motion.div key={selected} initial={noMotion?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={noMotion?undefined:{opacity:0,y:-9}} transition={{duration:duration*.65,ease:[.22,.7,.27,1]}} style={{flex:"1 1 auto",display:"flex",flexDirection:"column"}}>
    <blockquote className="tcs-quote" style={quoteFont}>{active.quote}</blockquote>
    <div className="tcs-bottom"><div><div className="tcs-name" style={nameFont}>{active.name}</div><div className="tcs-role" style={smallFont}>{active.role}</div></div>
    {link&&active.buttonText&&<div className="tcs-cta"><span>{active.buttonText}</span><span className="tcs-arrow"><Arrow/></span></div>}</div>
   </motion.div>
  </AnimatePresence>
 </div>
 return <div className="tcs-root" style={{...vars,...style,width:"100%",minWidth:0,height:"auto",padding:Math.max(0,outerPadding),background:"transparent"}}>
  <style>{CSS}</style>
  <motion.div className="tcs-stage" initial={false} animate={{backgroundColor:active.backdrop||"#FA593C"}} transition={{duration,ease:[.22,.7,.27,1]}}>
   <div className="tcs-story">{link?<a className="tcs-story-link" href={link} target="_blank" rel="noopener noreferrer" aria-label={active.buttonText+" — "+active.name}>{content}</a>:content}</div>
   <div className="tcs-media">
    {link ? (
      <a className="tcs-media-link" href={link} target="_blank" rel="noopener noreferrer" aria-label={(active.buttonText||"Visit website")+" — "+active.name}>
        <span className="tcs-media-tag">MADE WITH FEELING ↗</span>
        <AnimatePresence initial={false} mode="sync"><motion.img key={selected+"-"+(active.image?.src||"")} className="tcs-photo" src={active.image?.src||DEFAULT_STORIES[selected%DEFAULT_STORIES.length]?.image?.src} srcSet={active.image?.srcSet} alt={active.image?.alt||"Editorial portrait"} draggable={false} initial={noMotion?false:{opacity:0,scale:1.055}} animate={{opacity:1,scale:1}} exit={noMotion?undefined:{opacity:0,scale:1.025}} transition={{duration:duration*1.1,ease:[.22,.7,.27,1]}}/></AnimatePresence>
      </a>
    ) : (
      <>
        <span className="tcs-media-tag">MADE WITH FEELING ↗</span>
        <AnimatePresence initial={false} mode="sync"><motion.img key={selected+"-"+(active.image?.src||"")} className="tcs-photo" src={active.image?.src||DEFAULT_STORIES[selected%DEFAULT_STORIES.length]?.image?.src} srcSet={active.image?.srcSet} alt={active.image?.alt||"Editorial portrait"} draggable={false} initial={noMotion?false:{opacity:0,scale:1.055}} animate={{opacity:1,scale:1}} exit={noMotion?undefined:{opacity:0,scale:1.025}} transition={{duration:duration*1.1,ease:[.22,.7,.27,1]}}/></AnimatePresence>
      </>
    )}
   </div>
  </motion.div>
  <nav className="tcs-navigation" aria-label="Choose a story" onKeyDown={event=>{
   if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return
   event.preventDefault()
   const next=(selected+(event.key==="ArrowRight"?1:-1)+safeStories.length)%safeStories.length
   setSelected(next)
   event.currentTarget.querySelectorAll("button")[next]?.focus()
  }}>
   {safeStories.map((item,i)=><button key={i} type="button" className="tcs-nav" aria-pressed={i===selected} aria-label={"Show "+item.name+"'s story"} onClick={()=>setSelected(i)}><span className="tcs-num">{String(i+1).padStart(2,"0")}</span><span className="tcs-nav-name">{item.name}</span><span className="tcs-status" aria-hidden="true"/></button>)}
  </nav>
 </div>
}
addPropertyControls(TestimonialColorStage,{
 stories:{type:ControlType.Array,title:"Stories",defaultValue:DEFAULT_STORIES,control:{type:ControlType.Object,controls:{
  name:{type:ControlType.String,title:"Name",defaultValue:""},role:{type:ControlType.String,title:"Role",defaultValue:""},
  quote:{type:ControlType.String,title:"Quote",displayTextArea:true,defaultValue:""},image:{type:ControlType.ResponsiveImage,title:"Photo"},
  backdrop:{type:ControlType.Color,title:"Stage Color",defaultValue:"#FA593C"},buttonText:{type:ControlType.String,title:"CTA",defaultValue:"Start Your Site"},
  link:{type:ControlType.Link,title:"CTA Link",defaultValue:""}
 }}},
 initialStory:{type:ControlType.Number,title:"First Story",defaultValue:0,min:0,max:20,step:1,displayStepper:true},
 stageRadius:{type:ControlType.Number,title:"Stage Radius",defaultValue:22,min:0,max:60,unit:"px"},
 cardRadius:{type:ControlType.Number,title:"Card Radius",defaultValue:12,min:0,max:40,unit:"px"},
 imageRadius:{type:ControlType.Number,title:"Image Radius",defaultValue:12,min:0,max:40,unit:"px"},
 outerPadding:{type:ControlType.Number,title:"Outer Padding",defaultValue:0,min:0,max:60,unit:"px"},
 imagePosition:{type:ControlType.String,title:"Image Crop",defaultValue:"center"},
 cardBackground:{type:ControlType.Color,title:"Card (Neutral)",defaultValue:"#FFFFFF"},
 textColor:{type:ControlType.Color,title:"Text",defaultValue:"#171717"},
 mutedColor:{type:ControlType.Color,title:"Secondary Text",defaultValue:"#737373"},
 quoteFont:{type:ControlType.Font,title:"Quote Font",defaultFontType:"sans-serif"},
 nameFont:{type:ControlType.Font,title:"Name Font",defaultFontType:"sans-serif"},
 smallFont:{type:ControlType.Font,title:"Small Font",defaultFontType:"sans-serif"},
 speed:{type:ControlType.Number,title:"Transition",defaultValue:.48,min:.12,max:1.2,step:.02,unit:"s"}
})
