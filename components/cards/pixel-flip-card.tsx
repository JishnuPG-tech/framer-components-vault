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

interface Props {
 image?: {src:string;alt?:string;srcSet?:string}
 label?:string; title?:string; subtitle?:string; backTitle?:string; description?:string
 action?:string; link?:string; newTab?:boolean
 trigger?:"click"|"hover"; initialSide?:"front"|"back"; duration?:number
 pixels?:boolean; density?:number; pixelColor?:string; tint?:string; textColor?:string
 radius?:string|number; padding?:string|number; titleFont?:React.CSSProperties; bodyFont?:React.CSSProperties
 focusColor?:string; style?:React.CSSProperties
}
const PHOTO="https://images.unsplash.com/photo-1565371557106-c2abcc6fb36a?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=900"
const css=`
.mosaic-card,.mosaic-card *{box-sizing:border-box;user-select:none;-webkit-user-select:none}
.mosaic-card img,.mosaic-card a{-webkit-user-drag:none}
.mosaic-card{isolation:isolate;-webkit-font-smoothing:antialiased;container-type:inline-size}
.mosaic-card button,.mosaic-card a{-webkit-tap-highlight-color:transparent}
.mosaic-card button:focus-visible,.mosaic-card a:focus-visible{outline:2px solid var(--mf-focus);outline-offset:4px}
.mosaic-card button{font:inherit}
.mosaic-card .mf-turn{transition:background .3s ease,box-shadow .3s ease}
.mosaic-card .mf-turn:hover{background:rgba(255,255,255,.20)!important;box-shadow:inset 0 1px 0 #ffffff66,0 4px 16px #00000018!important}
.mosaic-card .mf-turn svg{transition:transform .65s cubic-bezier(.22,1,.36,1)}
.mosaic-card .mf-turn[aria-pressed=true] svg{transform:rotate(180deg)}
.mosaic-card .mf-pixel{opacity:0;transform:scale(.02)}
.mosaic-card .mf-running .mf-pixel{animation:mf-wave var(--mf-cell-time) cubic-bezier(.22,.7,.2,1) both;animation-delay:var(--mf-delay)}
@keyframes mf-wave{0%,100%{opacity:0;transform:scale(.02)}25%,55%{opacity:.8;transform:scale(1.04)}}
@media(prefers-reduced-motion:reduce){.mosaic-card .mf-turn{transition:background .3s ease,box-shadow .3s ease}
.mosaic-card .mf-turn:hover{background:rgba(255,255,255,.20)!important;box-shadow:inset 0 1px 0 #ffffff66,0 4px 16px #00000018!important}
.mosaic-card .mf-turn svg{transition:transform .65s cubic-bezier(.22,1,.36,1)}
.mosaic-card .mf-turn[aria-pressed=true] svg{transform:rotate(180deg)}
.mosaic-card .mf-pixel{animation:none!important}.mosaic-card .mf-turn,.mosaic-card .mf-turn svg{transition:none!important}}
@media(forced-colors:active){.mosaic-card{border:1px solid CanvasText}.mosaic-card button,.mosaic-card a{border:1px solid ButtonText}}
`
const arrow=<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
const flip=<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 8a8 8 0 0 0-13-2L3 9m0-5v5h5M5 16a8 8 0 0 0 13 2l3-3m0 5v-5h-5"/></svg>
/**
 * @framerIntrinsicWidth 380
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function PixelFlipCard(p:Props){
 const {image={src:PHOTO,alt:"Sculptural concrete architecture"},label="",title="Quiet form.",subtitle="A study in light & space",backTitle="A different perspective.",description="Considered details. Unexpected movement. A small moment worth turning over.",action="Explore the collection",link="",newTab=false,trigger="hover",initialSide="front",duration=.95,pixels=true,density=10,pixelColor="#E7E9E5",tint="#17201E",textColor="#F8F8F3",radius="28px",padding="28px",titleFont={},bodyFont={},focusColor="#B7CBBB",style}=p
 const staticRender=useIsStaticRenderer()
 const reduced=!!useReducedMotion()
 const [back,setBack]=React.useState(initialSide==="back")
 const [activeBack,setActiveBack]=React.useState(initialSide==="back")
 const [cycle,setCycle]=React.useState(0)
 const [running,setRunning]=React.useState(false)
 const timers=React.useRef<ReturnType<typeof setTimeout>[]>([])
 const target=React.useRef(initialSide==="back")
 const root=React.useRef<HTMLDivElement>(null)
 const flipRef=React.useRef<HTMLButtonElement>(null)
 const start=React.useRef<{x:number;y:number;id:number}|null>(null)
 const suppress=React.useRef(false)
 const linkRef=React.useRef<HTMLAnchorElement>(null)

 const clear=()=>{timers.current.forEach(clearTimeout);timers.current=[]}
 const seconds=Math.max(.35,Math.min(1.8,Number(duration)||.95))
 React.useEffect(()=>{clear();target.current=initialSide==="back";setBack(target.current);setActiveBack(target.current);setRunning(false)},[initialSide])
 React.useEffect(()=>()=>clear(),[])
 const change=(next:boolean)=>{
  if(staticRender||next===target.current)return
  clear()
  if(root.current?.querySelector("a")===document.activeElement)flipRef.current?.focus()
  target.current=next;setBack(next);setCycle(n=>n+1);setRunning(!reduced)
  if(reduced){setActiveBack(next);setRunning(false)}
  else {
   timers.current.push(setTimeout(()=>setActiveBack(next),seconds*500))
   timers.current.push(setTimeout(()=>setRunning(false),seconds*1000))
  }
 }
 const n=Math.max(6,Math.min(14,Math.round(density)||10)), rows=Math.round(n*1.3)
 const cells=React.useMemo(()=>Array.from({length:n*rows},(_,i)=>({x:i%n,y:Math.floor(i/n),delay:((i%n)/n*.32+Math.floor(i/n)/rows*.16+((i*17)%11)/110)*seconds})),[n,rows,seconds])
 const face:React.CSSProperties={gridArea:"1/1",position:"relative",minWidth:0,minHeight:0,borderRadius:"inherit",overflow:"hidden",backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",background:tint}
 const imageStyle:React.CSSProperties={position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",pointerEvents:"none"}
 const heading:React.CSSProperties={fontFamily:"Inter, sans-serif",fontSize:"clamp(26px,10cqw,42px)",fontWeight:500,lineHeight:1.04,letterSpacing:"-.055em",margin:0,overflowWrap:"anywhere",...titleFont}
 const body:React.CSSProperties={fontFamily:"Inter, sans-serif",fontSize:14,lineHeight:1.55,letterSpacing:"-.01em",...bodyFont}
 const panel:React.CSSProperties={position:"relative",display:"flex",flexDirection:"column",padding,gap:18,height:"100%",minHeight:0}
 const renderPixels=()=>pixels&&!reduced&&!staticRender&&running?<div key={cycle} className="mf-running" aria-hidden="true" style={{position:"absolute",inset:0,display:"grid",gridTemplateColumns:`repeat(${n},1fr)`,gridTemplateRows:`repeat(${rows},1fr)`,pointerEvents:"none",zIndex:3}}>{cells.map((c,i)=><span key={i} className="mf-pixel" style={{background:pixelColor,"--mf-delay":c.delay+"s","--mf-cell-time":seconds*.42+"s"} as React.CSSProperties}/>)}</div>:null
 const renderControls=(side:boolean)=><> {link.trim()&&<a  className="mf-card-link" draggable={false} href={link} target={newTab?"_blank":undefined} rel={newTab?"noopener noreferrer":undefined} aria-label={action||title} tabIndex={activeBack===side?0:-1} style={{position:"absolute",inset:0,borderRadius:"inherit",zIndex:4,touchAction:"pan-y"}}
 onPointerDown={e=>{suppress.current=false;if(e.pointerType!=="mouse")start.current={x:e.clientX,y:e.clientY,id:e.pointerId}}}
 onPointerUp={e=>{const s=start.current;start.current=null;if(!s)return;const dx=e.clientX-s.x,dy=e.clientY-s.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5){suppress.current=true;change(!target.current)}else if(Math.abs(dx)>8||Math.abs(dy)>8)suppress.current=true}}
 onPointerCancel={()=>{start.current=null;suppress.current=true}}
 onClick={e=>{if(staticRender||suppress.current){e.preventDefault();suppress.current=false}}}
 />}
 <button className="mf-turn" ref={activeBack===side?flipRef:undefined} tabIndex={activeBack===side?0:-1} type="button" aria-label={activeBack?"Show front":"Flip card"} aria-pressed={activeBack} onClick={e=>{e.stopPropagation();change(!target.current)}} style={{position:"absolute",right:22,top:22,zIndex:5,width:44,height:44,display:"grid",placeItems:"center",border:"1px solid #ffffff38",borderRadius:14,background:"rgba(255,255,255,.10)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",boxShadow:"inset 0 1px 0 #ffffff24",color:textColor,cursor:"pointer",padding:0}}>{flip}</button></>
 const shown=staticRender?initialSide==="back":back
 return <div ref={root} className="mosaic-card" role="group" aria-label={title||"Pixel flip card"} data-side={activeBack?"back":"front"} style={{width:380,height:500,position:"relative",perspective:1600,color:textColor,...body,...style,borderRadius:radius,"--mf-focus":focusColor} as React.CSSProperties}

 onDragStart={e=>e.preventDefault()}
 onPointerEnter={e=>{if(trigger==="hover"&&e.pointerType==="mouse")change(true)}}
 onPointerLeave={e=>{if(trigger==="hover"&&e.pointerType==="mouse")change(false)}}
 onKeyDown={e=>{if(e.key==="Escape"){change(false);flipRef.current?.focus()}}}
 >
 <style>{css}</style>
 <motion.div animate={{rotateY:reduced?0:shown?180:0}} initial={false} transition={{duration:reduced?0:seconds,ease:[.22,.68,.12,1]}}
 style={{display:"grid",gridTemplateColumns:"minmax(0,1fr)",height:"100%",width:"100%",borderRadius:"inherit",transformStyle:"preserve-3d",touchAction:"pan-y"}}

 >
 <div aria-hidden={activeBack} {...({inert:activeBack?"":undefined} as any)} style={{...face,display:reduced&&shown?"none":"flex",boxShadow:"0 2px 3px #00000012,0 24px 56px -24px #17201e66,inset 0 1px 1px #ffffff65,inset 0 0 0 1px #ffffff20"}}>
 {image?.src&&<img src={image.src} srcSet={image.srcSet} alt={image.alt||""} draggable={false} style={imageStyle}/>}
 <div aria-hidden="true" style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,.52),transparent 38%,rgba(5,16,15,.18) 52%,rgba(5,16,15,.9))"}}/>
 <div style={{...panel,width:"100%"}}>
 
 <div style={{marginTop:"auto",paddingTop:80,paddingBottom:8}}>
 <h3 style={heading}>{title}</h3>
 {subtitle&&<p style={{margin:"12px 0 0",opacity:.8,...body}}>{subtitle}</p>}
 </div>

 </div>
 {renderControls(false)}
 {renderPixels()}
 </div>
 <div aria-hidden={!activeBack} {...({inert:!activeBack?"":undefined} as any)} style={{...face,transform:reduced?"none":"rotateY(180deg)",display:reduced&&!shown?"none":"flex",boxShadow:"0 2px 3px #00000012,0 24px 56px -24px #17201e66,inset 0 1px 1px #ffffff65,inset 0 0 0 1px #ffffff20"}}>
 {image?.src&&<img src={image.src} alt="" draggable={false} style={{...imageStyle,filter:"blur(18px)",transform:"scale(1.14)",opacity:.65}}/>}
 <div aria-hidden="true" style={{position:"absolute",inset:0,background:`linear-gradient(145deg,color-mix(in srgb, ${tint} 50%, transparent),color-mix(in srgb, ${tint} 88%, transparent))`,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}/>
 <div style={{...panel,width:"100%",overflowY:"auto",paddingTop:92}}>
 
 <div style={{marginTop:"auto",paddingTop:44}}>
 <h3 style={heading}>{backTitle}</h3>
 <p style={{...body,margin:"20px 0 0",opacity:.78}}>{description}</p>
 </div>
 {link.trim()&&action&&<div aria-hidden="true" style={{color:textColor,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"14px 0",borderTop:"1px solid #ffffff30",marginTop:12,marginBottom:0,fontSize:13}}>{action}{arrow}</div>}
 {!link.trim()&&<div style={{height:8,flexShrink:0}}/>}
 </div>
 {renderControls(true)}
 {renderPixels()}
 </div>
 </motion.div>

 </div>
}
PixelFlipCard.displayName = "Pixel Flip Card"
addPropertyControls(PixelFlipCard,{
 image:{type:ControlType.ResponsiveImage,title:"Image"},
 title:{type:ControlType.String,title:"Front Title",defaultValue:"Quiet form."},
 subtitle:{type:ControlType.String,title:"Subtitle",defaultValue:"A study in light & space"},
 backTitle:{type:ControlType.String,title:"Back Title",defaultValue:"A different perspective."},
 description:{type:ControlType.String,title:"Description",displayTextArea:true,defaultValue:"Considered details. Unexpected movement. A small moment worth turning over."},
 action:{type:ControlType.String,title:"Link Label",defaultValue:"Explore the collection"},
 link:{type:ControlType.Link,title:"Link",defaultValue:""},
 newTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false},
 trigger:{type:ControlType.Enum,title:"Trigger",options:["click","hover"],optionTitles:["Icon Click","Card Hover"],defaultValue:"hover",description:"Hover the card to reveal the back. The icon flips on click or tap; the rest of the card opens the link."},
 initialSide:{type:ControlType.Enum,title:"Start Side",options:["front","back"],optionTitles:["Front","Back"],defaultValue:"front",displaySegmentedControl:true},
 duration:{type:ControlType.Number,title:"Duration",defaultValue:.95,min:.35,max:1.8,step:.05,unit:"s"},
 pixels:{type:ControlType.Boolean,title:"Pixel Wave",defaultValue:true},
 density:{type:ControlType.Number,title:"Grid",defaultValue:10,min:6,max:14,step:1,hidden:p=>!p.pixels},
 pixelColor:{type:ControlType.Color,title:"Pixel Color",defaultValue:"#E7E9E5",hidden:p=>!p.pixels},
 tint:{type:ControlType.Color,title:"Glass Tint",defaultValue:"#17201E"},
 textColor:{type:ControlType.Color,title:"Text",defaultValue:"#F8F8F3"},
 titleFont:{type:ControlType.Font,title:"Title Font",controls:"extended"},
 bodyFont:{type:ControlType.Font,title:"Body Font",controls:"extended"},
 radius:{type:ControlType.BorderRadius,title:"Radius",defaultValue:"28px"},
 padding:{type:ControlType.Padding,title:"Padding",defaultValue:"28px"},
 focusColor:{type:ControlType.Color,title:"Focus Color",defaultValue:"#B7CBBB",description:"Made by Design Supply  \n[Explore more components](https://dub.sh/dsw13)"}
})

