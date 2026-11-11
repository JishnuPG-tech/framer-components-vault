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

import {motion,useReducedMotion,useAnimationControls,useMotionValue,useTransform} from "framer-motion"
type Member={name:string;role:string;bio?:string;image?:{src:string;alt?:string};link?:string;newTab?:boolean;email?:string;phone?:string}
const photos=["https://framerusercontent.com/images/6AYnEOYhsBDkG64GkyshNbyq8.png","https://framerusercontent.com/images/PlaYwDxZ8XJVkYIeWR6p6yyNunk.png","https://images.unsplash.com/photo-1628067630818-fa3e19d96b27?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1000","https://images.unsplash.com/photo-1723559874747-f569722d619c?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1000","https://framerusercontent.com/images/ZqAVbVBkh2s43Tv2wswp69l2nGY.png"]
const defaults:Member[]=[{"name":"Ivory Gate","role":"","bio":""},{"name":"Terracotta Steps","role":"","bio":""},{"name":"Rose Pavilion","role":"","bio":""},{"name":"Soft Passage","role":"","bio":""},{"name":"Cloud Bridge","role":"","bio":""}].map((m,i)=>({...m,image:{src:photos[i],alt:m.name},link:"",newTab:false}))
type Props={members?:Member[];layout?:string;label?:string;background?:string;text?:string;muted?:string;accent?:string;radius?:string;padding?:string;cardHeight?:number;cardWidth?:number;gap?:number;depth?:number;duration?:number;monochrome?:boolean;nameFont?:React.CSSProperties;bodyFont?:React.CSSProperties;details?:boolean;hoverSelect?:boolean;style?:React.CSSProperties}
const css=`
.ds-portraits{position:relative;container-type:inline-size;font-family:Inter,Arial,sans-serif;box-sizing:border-box;-webkit-font-smoothing:antialiased}
.ds-portraits *{box-sizing:border-box}
.ds-portraits button,.ds-portraits a{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}
.ds-portraits button{cursor:pointer}
.ds-portraits :focus-visible{outline:2px solid var(--accent);outline-offset:5px}
.ds-portraits .pr-head{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:26px}
.ds-portraits .pr-count{font:11px ui-monospace,monospace;color:var(--muted)}
.ds-portraits .pr-stage{position:relative;overflow:hidden;touch-action:pan-y;user-select:none}
.ds-portraits .pr-picture{position:absolute;left:50%;top:8px;border:1px solid #ffffff20;padding:0;overflow:hidden;background:#292a28;border-radius:var(--radius);box-shadow:0 18px 40px #0002;transform-origin:center 75%}
.ds-portraits .pr-picture img{height:100%;width:100%;object-fit:cover;object-position:50% 35%;display:block;pointer-events:none}
.ds-portraits .pr-picture:focus-visible{outline-offset:-5px}
.ds-portraits .pr-details{display:grid;grid-template-columns:48px minmax(0,1fr) 48px;gap:20px;align-items:center;margin:22px auto 0;max-width:650px}
.ds-portraits .pr-copy{text-align:center;min-width:0;min-height:142px}
.ds-portraits .pr-role{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.ds-portraits .pr-name{font-size:32px;letter-spacing:-.055em;line-height:1.1;font-weight:500;margin:0;overflow-wrap:anywhere}
.ds-portraits .pr-bio{color:var(--muted);font-size:12px;line-height:1.6;max-width:370px;margin:10px auto 0}
.ds-portraits .pr-links{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:12px}
.ds-portraits .pr-links a{font-size:11px;text-decoration:none;min-height:32px;display:inline-flex;align-items:center;border-bottom:1px solid #8886}
.ds-portraits .pr-arrow{display:grid;place-items:center;border:1px solid #8885;border-radius:50%;width:44px;height:44px;background:transparent;font-size:19px;transition:background .2s}
.ds-portraits .pr-arrow:hover{background:#8882}
.ds-portraits .pr-arrow:disabled{opacity:.25;cursor:default}
.ds-portraits .pr-rail{position:relative;display:flex;margin-top:26px;overflow-x:auto;scrollbar-width:none;isolation:isolate}
.ds-portraits .pr-rail:before{content:"";position:absolute;left:0;right:0;top:21px;border-top:1px solid #8885;z-index:-1}
.ds-portraits .pr-stop{position:relative;flex:1;min-width:64px;border:0;background:none;text-align:center;padding:0 6px 4px;min-height:64px;color:var(--muted);font-size:10px}
.ds-portraits .pr-stop:before{content:"";display:block;width:7px;height:7px;border:1px solid var(--muted);border-radius:50%;margin:18px auto;background:var(--bg);transition:background .3s,box-shadow .3s}
.ds-portraits .pr-stop[aria-current=true]{color:var(--text)}
.ds-portraits .pr-stop[aria-current=true]:before{background:var(--accent);border-color:var(--accent);box-shadow:0 0 0 5px var(--bg),0 0 0 6px #8884}
.ds-portraits .pr-empty{padding:80px 20px;text-align:center;color:var(--muted)}
@container(max-width:550px){
.ds-portraits .pr-head{margin-bottom:20px;font-size:10px}
.ds-portraits .pr-details{grid-template-columns:36px minmax(0,1fr) 36px;gap:8px;margin-top:16px}
.ds-portraits .pr-arrow{width:36px;height:36px}
.ds-portraits .pr-name{font-size:27px}
.ds-portraits .pr-role{font-size:9px;letter-spacing:.07em}
.ds-portraits .pr-bio{font-size:11px}
.ds-portraits .pr-copy{min-height:168px}
.ds-portraits .pr-rail{margin-top:12px}
.ds-portraits .pr-stop{min-width:52px;font-size:9px}
}

.ds-portraits .pr-picture{cursor:pointer;text-decoration:none;display:block;transition:border-color .25s}
.ds-portraits .pr-picture:hover{border-color:#ffffff40}
.ds-portraits .pr-console{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;gap:12px;width:min(100%,360px);margin:14px auto 0}
.ds-portraits .pr-console .pr-arrow{width:44px;height:44px;border:1px solid transparent;background:transparent;color:var(--text);transition:background .2s,border-color .2s}
.ds-portraits .pr-console .pr-arrow:hover{background:#ffffff06;border-color:#ffffff14}
.ds-portraits .pr-console .pr-arrow:active{background:#ffffff10}
.ds-portraits .pr-console .pr-arrow svg{width:18px;height:18px}
.ds-portraits .pr-console-label{display:flex;align-items:center;justify-content:center;gap:16px;min-width:0}
.ds-portraits .pr-brand{font-size:13px;font-weight:500;letter-spacing:-.025em;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ds-portraits .pr-position{display:flex;gap:5px;flex-shrink:0;font-size:11px;font-variant-numeric:tabular-nums;letter-spacing:.02em;color:var(--muted)}
.ds-portraits .pr-position b{font-weight:400;color:var(--text)}
.ds-portraits .pr-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
@container(max-width:550px){.ds-portraits .pr-console{gap:4px;margin-top:6px}.ds-portraits .pr-console-label{gap:14px}.ds-portraits .pr-brand{font-size:12px}}
@media(prefers-reduced-motion:reduce){.ds-portraits *{transition:none!important}}
`

function createSelectionStepper(read,commit,schedule=setTimeout,unschedule=clearTimeout){
 let target=null,timer=null,disposed=false
 const wrap=(n,count)=>count?((n%count)+count)%count:0
 function stop(){if(timer!==null)unschedule(timer);timer=null;target=null}
 function advance(){
   timer=null
   const state=read(),count=state.count
   if(disposed||!count||target===null){stop();return}
   const current=wrap(state.index,count)
   target=wrap(target,count)
   if(current===target){target=null;return}
   if(state.motionOff){const destination=target;target=null;commit(destination);return}
   let delta=target-current
   if(delta>count/2)delta-=count
   if(delta< -count/2)delta+=count
   commit(wrap(current+Math.sign(delta),count))
   timer=schedule(advance,Math.max(160,state.duration*1000))
 }
 return {
   seek(n){if(disposed)return;const state=read();if(!state.count)return;target=wrap(n,state.count);if(timer===null)advance()},
   step(direction){stop();const state=read();if(!disposed&&state.count)commit(wrap(state.index+direction,state.count))},
   stop,
   dispose(){stop();disposed=true}
 }
}

function SmoothCard({pose,relativePosition,looping,motionOff,duration,children,...props}:any){
 const controls=useAnimationControls()
 const size=useMotionValue(pose.scale)
 const layer=useTransform(size,value=>Math.round(value*1000))
 const previous=React.useRef(relativePosition)
 const first=React.useRef(true)
 React.useEffect(()=>{
   let cancelled=false
   const wrapped=looping&&Math.abs(relativePosition-previous.current)>2
   previous.current=relativePosition
   const speed=.7/Math.max(.15,duration)
   const transition={type:"spring" as const,stiffness:150*speed*speed,damping:27*speed,mass:1,restDelta:.001,restSpeed:.01,filter:{duration:Math.min(duration,.35),ease:"easeOut" as const},opacity:{duration:.16}}
   if(first.current||motionOff){first.current=false;controls.set(pose);return}
   if(wrapped){
     void (async()=>{
       await controls.start({opacity:0},{duration:.09,ease:"easeOut"})
       if(cancelled)return
       controls.set({...pose,opacity:0})
       await controls.start({opacity:pose.opacity},{duration:.22,ease:"easeOut"})
     })()
   }else{void controls.start(pose,transition)}
   return()=>{cancelled=true;controls.stop()}
 },[pose.x,pose.y,pose.scale,pose.rotate,pose.width,pose.height,pose.opacity,pose.filter,relativePosition,looping,motionOff,duration,controls])
 return <motion.a {...props} initial={pose} animate={controls} style={{...props.style,scale:size,zIndex:layer}}>{children}</motion.a>
}

/**
 * Adapted from Matthias's Team Spotlight: centered portrait, relative card positions and member navigation.
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function ArcshiftGallery({members=defaults,layout="Spotlight",label="Design Supply",background="#111111",text="#F3F0E8",muted="#A6A99F",accent="#F3F0E8",radius="10px",padding="32px",cardHeight=360,cardWidth=280,gap=12,depth=1,duration=.7,monochrome=false,nameFont={},bodyFont={},details=false,hoverSelect=true,style}:Props){
 const data=Array.isArray(members)?members.slice(0,12):[]
 const count=data.length
 const [index,setIndex]=React.useState(0),[width,setWidth]=React.useState(1036)
 const root=React.useRef<HTMLDivElement>(null),start=React.useRef<{x:number;y:number}|null>(null),moved=React.useRef(false)
 const staticRender=useIsStaticRenderer(),reduced=useReducedMotion()
 const active=Math.min(index,Math.max(0,count-1))
 const indexRef=React.useRef(active)
 const configuration=React.useRef({count,duration,motionOff:staticRender||!!reduced})
 configuration.current={count,duration,motionOff:staticRender||!!reduced}
 const selection=React.useRef<ReturnType<typeof createSelectionStepper>|null>(null)
 if(!selection.current)selection.current=createSelectionStepper(()=>({...configuration.current,index:indexRef.current}),n=>{indexRef.current=n;setIndex(n)})
 const pendingHover=React.useRef<{index:number;timer:ReturnType<typeof setTimeout>}|null>(null)
 const lastPointer=React.useRef<{x:number;y:number}|null>(null)
 const cancelHover=()=>{if(pendingHover.current)clearTimeout(pendingHover.current.timer);pendingHover.current=null}
 const pauseHover=()=>{cancelHover();selection.current?.stop()}
 React.useEffect(()=>()=>{cancelHover();selection.current?.stop()},[])
 React.useEffect(()=>{pauseHover();const bounded=Math.min(indexRef.current,Math.max(0,count-1));indexRef.current=bounded;setIndex(bounded)},[count])
 function hoverCard(e:React.PointerEvent<HTMLAnchorElement>,i:number){
   if(!hoverSelect||staticRender||e.pointerType!=="mouse"||e.buttons!==0||start.current)return
   const previous=lastPointer.current
   if(previous&&Math.hypot(e.clientX-previous.x,e.clientY-previous.y)<3)return
   lastPointer.current={x:e.clientX,y:e.clientY}
   if(pendingHover.current?.index===i)return
   cancelHover()
   pendingHover.current={index:i,timer:setTimeout(()=>{pendingHover.current=null;selection.current?.seek(i)},140)}
 }
 React.useEffect(()=>{const el=root.current;if(!el)return;const read=()=>{const s=getComputedStyle(el);setWidth(el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight))};read();const observer=new ResizeObserver(read);observer.observe(el);return()=>observer.disconnect()},[])
 const small=width<550
 const h=Math.min(cardHeight,small?Math.max(220,width*1.03):cardHeight)
 const cw=Math.min(cardWidth,small?width*.72:width*.38)
 const choose=(n:number)=>{cancelHover();selection.current?.seek(n)}
 const next=()=>{cancelHover();selection.current?.step(1)},prev=()=>{cancelHover();selection.current?.step(-1)}
 function relative(i:number){let d=i-active;if(d>count/2)d-=count;if(d< -count/2)d+=count;return d}
 const person=data[active]
 const railGap=Math.min(gap,Math.max(1,(width-cw)/Math.max(1,count-1)*.4))
 const narrow=Math.max(1,Math.min(small?28:64,(width-cw-railGap*(count-1))/Math.max(1,count-1)))
 const railWidth=cw+(narrow+railGap)*(count-1)
 return <div ref={root} className="ds-portraits" role="region" aria-roledescription="carousel" aria-label="Image gallery" style={{...style,...bodyFont,padding,background,color:text,"--bg":background,"--text":text,"--muted":muted,"--accent":accent,"--radius":radius} as React.CSSProperties}
 onKeyDown={e=>{if(e.key==="ArrowRight"){e.preventDefault();next()}if(e.key==="ArrowLeft"){e.preventDefault();prev()}if(e.key==="Home"){e.preventDefault();choose(0)}if(e.key==="End"){e.preventDefault();choose(count-1)}}}>
 <style>{css}</style>{details&&<header className="pr-head"><span>{label}</span><span className="pr-count">{count?String(active+1).padStart(2,"0"):"00"} / {String(count).padStart(2,"0")}</span></header>}
 {!count?<div className="pr-empty">Add a team member to get started.</div>:<>
 <div className="pr-stage" style={{height:h+54}} onPointerDown={e=>{if(e.button!==0)return;pauseHover();start.current={x:e.clientX,y:e.clientY};moved.current=false}} onPointerMove={e=>{if(start.current&&Math.hypot(e.clientX-start.current.x,e.clientY-start.current.y)>12)moved.current=true}} onPointerUp={e=>{if(!start.current)return;const dx=e.clientX-start.current.x,dy=e.clientY-start.current.y;moved.current=moved.current||Math.hypot(dx,dy)>12;start.current=null;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.2){dx<0?next():prev();moved.current=true}}} onPointerCancel={()=>{if(start.current)moved.current=true;start.current=null;cancelHover()}} onPointerLeave={e=>{pauseHover();lastPointer.current=null;if(e.pointerType==="mouse")start.current=null}}>
 {data.map((member,i)=>{
 const rel=relative(i),distance=Math.abs(rel),isActive=i===active
 let x=rel*(small?cw*.42:Math.min(cw*.61,(width-cw*.85)/4))-cw/2,y=distance*(small?12:19),scale=1-distance*.105,rotate=rel*depth,w=cw,opacity=distance>2?0:1
 if(layout==="Rail"){w=isActive?cw:narrow;x=-railWidth/2+i*(narrow+railGap)+(i>active?cw-narrow:0);y=isActive?0:22;scale=1;rotate=0;opacity=1}
 const visible=layout==="Rail"||distance<=2
 const pose={x,y,scale,rotate,width:w,height:h,opacity,filter:(monochrome?"grayscale(1)":"grayscale(0)")+(isActive?" brightness(1)":" brightness(.68)")}
 return <SmoothCard key={i} pose={pose} relativePosition={rel} looping={layout!=="Rail"} motionOff={staticRender||!!reduced} duration={duration} className="pr-picture" draggable={false} onDragStart={e=>e.preventDefault()} data-active={isActive} href={member.link||undefined} target={member.newTab?"_blank":undefined} rel={member.newTab?"noopener noreferrer":undefined} role={member.link?undefined:"button"} aria-label={(member.link?"Open ":"Select ")+(member.name||"image "+(i+1))} aria-pressed={member.link?undefined:isActive} onPointerEnter={e=>hoverCard(e,i)} onPointerMove={e=>hoverCard(e,i)} onPointerLeave={()=>{if(pendingHover.current?.index===i)cancelHover()}} onFocus={e=>{if(e.currentTarget.matches(":focus-visible"))choose(i)}} onKeyDown={e=>{if(!member.link&&(e.key==="Enter"||e.key===" ")){e.preventDefault();choose(i)}}} aria-hidden={!visible} tabIndex={visible?0:-1} onClick={e=>{if(moved.current&&e.detail>0){e.preventDefault();moved.current=false;return}if(!member.link){e.preventDefault();choose(i)}}} style={{pointerEvents:visible?"auto":"none"}}>
 <img src={member.image?.src||photos[i%photos.length]} alt={member.image?.alt||member.name||""} draggable={false}/>
 </SmoothCard>})}</div>
 {details?<><div className="pr-details">
 <button className="pr-arrow" aria-label="Previous image" disabled={count<2} onClick={prev}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></button>
 <div className="pr-copy" aria-live="polite" aria-atomic="true"><motion.div key={active} initial={staticRender?false:{opacity:0,y:reduced?0:8}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.3}}>
 <div className="pr-role">{person?.role}</div><h2 className="pr-name" style={nameFont}>{person?.name}</h2>
 {person?.bio&&<p className="pr-bio">{person.bio}</p>}
 <div className="pr-links">{person?.link&&<a href={person.link} target={person.newTab?"_blank":undefined} rel={person.newTab?"noopener noreferrer":undefined}>View profile ↗</a>}{person?.email&&<a href={"mailto:"+person.email}>Email ↗</a>}{person?.phone&&<a href={"tel:"+person.phone}>Call ↗</a>}</div></motion.div></div>
 <button className="pr-arrow" aria-label="Next image" disabled={count<2} onClick={next}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>
 </div>
 <nav className="pr-rail" aria-label="Choose team member">{data.map((m,i)=><button key={i} className="pr-stop" aria-label={m.name||"Member "+(i+1)} aria-current={i===active?"true":undefined} onClick={()=>choose(i)}>{m.name?.split(" ")[0]||String(i+1).padStart(2,"0")}</button>)}</nav></>:<div className="pr-console"><button className="pr-arrow" aria-label="Previous image" disabled={count<2} onClick={prev}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></button><div className="pr-console-label"><span className="pr-brand">{label}</span><span className="pr-position" aria-hidden="true"><b>{String(active+1).padStart(2,"0")}</b><span>/</span><span>{String(count).padStart(2,"0")}</span></span></div><button className="pr-arrow" aria-label="Next image" disabled={count<2} onClick={next}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button><span className="pr-sr" aria-live="polite">{person?.name}, {active+1} of {count}</span></div>}
 </>}</div>
}
addPropertyControls(ArcshiftGallery,{
 members:{type:ControlType.Array,title:"Items",maxCount:12,defaultValue:defaults,control:{type:ControlType.Object,controls:{name:{type:ControlType.String,title:"Name",defaultValue:"Alex Morgan"},role:{type:ControlType.String,title:"Role",defaultValue:"Designer"},bio:{type:ControlType.String,title:"Bio",displayTextArea:true},image:{type:ControlType.ResponsiveImage,title:"Image"},link:{type:ControlType.Link,title:"Link",defaultValue:""},newTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false},email:{type:ControlType.String,title:"Email",defaultValue:""},phone:{type:ControlType.String,title:"Phone",defaultValue:""}}}},
 layout:{type:ControlType.Enum,title:"Layout",options:["Spotlight","Rail"],defaultValue:"Spotlight",displaySegmentedControl:true},
 hoverSelect:{type:ControlType.Boolean,title:"Hover Select",defaultValue:true},
 details:{type:ControlType.Boolean,title:"Profile Details",defaultValue:false},
 label:{type:ControlType.String,title:"Label",defaultValue:"Design Supply"},
 background:{type:ControlType.Color,title:"Background",defaultValue:"#111111"},text:{type:ControlType.Color,title:"Text",defaultValue:"#F3F0E8"},muted:{type:ControlType.Color,title:"Secondary",defaultValue:"#A6A99F"},accent:{type:ControlType.Color,title:"Accent",defaultValue:"#F3F0E8"},monochrome:{type:ControlType.Boolean,title:"Monochrome",defaultValue:false},
 nameFont:{type:ControlType.Font,title:"Name Font",controls:"extended"},bodyFont:{type:ControlType.Font,title:"Body Font",controls:"extended"},
 radius:{type:ControlType.BorderRadius,title:"Card Radius",defaultValue:"10px"},padding:{type:ControlType.Padding,title:"Padding",defaultValue:"32px"},
 cardWidth:{type:ControlType.Number,title:"Card Width",defaultValue:270,min:160,max:420,step:1},cardHeight:{type:ControlType.Number,title:"Card Height",defaultValue:340,min:200,max:520,step:1},
 gap:{type:ControlType.Number,title:"Rail Gap",defaultValue:12,min:4,max:24,step:1},depth:{type:ControlType.Number,title:"Tilt",defaultValue:2,min:0,max:6,step:.5,unit:"°"},
 duration:{type:ControlType.Number,title:"Motion",defaultValue:.7,min:.15,max:1.5,step:.05,unit:"s",description:"Made by Design Supply  \n[Explore more components](https://dub.sh/dsw13)"}
})