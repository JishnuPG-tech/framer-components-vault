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


interface GalleryImage { src: any; alt?: string; type?: string; video?: string; poster?: any }
interface Props {
 videoPlay: boolean; videoLoop: boolean; images: GalleryImage[]; speed: number; spacing: number; depth: number; imageSize: number; smoothness: number; reverse: boolean; mirror: boolean; stripFade: number; sizeMode: string; imageWidth: number; imageHeight: number; effect: string; effectAmount: number; leftBlur: number; rightBlur: number; edgeBlur: boolean; leftEdgeWidth: number; rightEdgeWidth: number; leftSoftness: number; rightSoftness: number; leftFade: number; rightFade: number; intro: boolean; introDuration: number; introStagger: number; introEase: string;
 autoplay: boolean; controls: boolean; pauseOnHover: boolean; background: string; radius: number; proportions: string; style?: React.CSSProperties
}
const defaults: GalleryImage[] = [
 {src:"https://images.unsplash.com/photo-1668882983356-29c9692fe1ab?w=800&q=85",alt:"Wildflowers in warm sunlight"},
 {src:"https://images.unsplash.com/photo-1505129137389-dc838a46f3f9?w=800&q=85",alt:"A colourful flower garden"},
 {src:"https://images.unsplash.com/photo-1711110375535-7127a43c3432?w=800&q=85",alt:"Daisies beneath woodland trees"},
 {src:"https://images.unsplash.com/photo-1700727844044-69cdc369b58c?w=800&q=85",alt:"Flowers growing in grass"},
 {src:"https://images.unsplash.com/photo-1725012856533-cdc92a7a7f2f?w=800&q=85",alt:"Flowers in a green meadow"},
 {src:"https://images.unsplash.com/photo-1725012856614-7b374a72aa22?w=800&q=85",alt:"A forest filled with flowers"},
 {src:"https://images.unsplash.com/photo-1670038625718-ed2e9bddd774?w=800&q=85",alt:"A purple flower in close-up"},
 {src:"https://images.unsplash.com/photo-1667849637286-eb8ca7bfba79?w=800&q=85",alt:"A collection of delicate flowers"}
]
const mod = (n:number,m:number) => ((n%m)+m)%m

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 474
 */
export default function RunwayCarousel3D(props: Partial<Props>) {
 const isStaticRenderer=useIsStaticRenderer()
 const {images=defaults,speed=1,spacing=1,depth=1000,imageSize=1,autoplay=true,controls=true,pauseOnHover=false,background="#e4e4e4",radius=5,proportions="landscape",smoothness=.65,reverse=false,mirror=false,stripFade=18,sizeMode="auto",imageWidth=40,imageHeight=60,effect="perspective",effectAmount=1,leftBlur=12,rightBlur=12,edgeBlur=true,leftEdgeWidth=20,rightEdgeWidth=20,leftSoftness=100,rightSoftness=100,leftFade=0,rightFade=0,intro=true,introDuration=1.8,introStagger=.045,introEase="smooth",videoPlay=true,videoLoop=true,style}=props
 const content = (Array.isArray(images)?images:[]).filter(Boolean).map(item=>({...item,src:item.type==="video"?item.video:(typeof item.src==="string"?item.src:item.src?.src),poster:typeof item.poster==="string"?item.poster:item.poster?.src})).filter(item=>item.src)
 const activeMedia=(panel:Element|null):any=>panel?.querySelector('video[data-active="true"]')||panel?.querySelector("img")
 const mediaWidth=(el:any)=>el?.videoWidth||el?.naturalWidth||0
 const mediaHeight=(el:any)=>el?.videoHeight||el?.naturalHeight||1
 const syncMedia=(panel:HTMLElement,item:GalleryImage,run:boolean):any=>{
   const image=panel.querySelector("img")!
   const video=panel.querySelector("video")!
   const isVideo=item.type==="video"
   image.style.display=isVideo?"none":"block"
   video.style.display=isVideo?"block":"none"
   video.dataset.active=String(isVideo)
   if(isVideo){
     video.muted=true;video.loop=videoLoop
     if(video.getAttribute("src")!==item.src){video.pause();video.src=item.src;video.load()}
     if(item.poster)video.poster=item.poster;else video.removeAttribute("poster")
     video.setAttribute("aria-label",item.alt||"Gallery video")
     if(run&&videoPlay&&!isStaticRenderer&&!canvas&&!reduced&&!document.hidden){if(video.paused)video.play().catch(()=>{})}
     else if(!video.paused)video.pause()
   }else{
     if(!video.paused)video.pause()
     if(video.hasAttribute("src")){video.removeAttribute("src");video.load()}
     if(image.getAttribute("src")!==item.src)image.src=item.src
     image.alt=item.alt||"Gallery image"
   }
   return isVideo?video:image
 }
 const root=React.useRef<HTMLDivElement>(null)
 const cards=React.useRef<(HTMLDivElement|null)[]>([])
 const phase=React.useRef(0)
 const introElapsed=React.useRef(0)
 const [imagesReady,setImagesReady]=React.useState(false)
 const velocity=React.useRef(0)
 const strip=React.useRef<HTMLDivElement>(null)
 const starters=React.useRef<(HTMLDivElement|null)[]>([])
 const size=React.useRef({width:1200,height:474})
 const [playing,setPlaying]=React.useState(autoplay)
 const [hovered,setHovered]=React.useState(false)
 const [reduced,setReduced]=React.useState(false)
 const canvas=RenderTarget.current()===RenderTarget.canvas
 const staticMode=isStaticRenderer||canvas
 const redrawStatic=React.useRef<(()=>void)|null>(null)
 const count=10
 const baseWidth=(w:number,h:number)=>(sizeMode==="manual"?imageWidth*Math.min(1,w/1200):Math.min(w*.032,h*.085))*imageSize
 const ratioFor=(natural:number)=>sizeMode==="manual"?imageWidth/Math.max(1,imageHeight):natural
 const geometry=(slot:number,side:number,travel:number,w:number,h:number)=>{
   const progress=(slot+travel+.42)/count
   const cycle=Math.floor(progress),t=progress-cycle
   const distance=t*count
   const centreSlots=2
   const outward=Math.max(0,distance-centreSlots)
   const k=2.65*Math.pow(1000/Math.max(200,depth),.12)
   const step=k/(count-centreSlots)
   const centreGrowth=.12
   const growth=Math.exp(centreGrowth*Math.min(distance,centreSlots)+step*outward)
   const gap=Math.max(.035,spacing*.22)
   const base=baseWidth(w,h)
   const centrePitch=base
   // One continuous path: the same panel leaves the centre strip and grows outward.
   const path=base*(1+Math.exp(step)+2*gap)/(2*(Math.exp(step)-1))
   const centreEnd=Math.exp(centreGrowth*centreSlots)
   const x=side*(base*.5+centrePitch*(Math.exp(centreGrowth*Math.min(distance,centreSlots))-1)/centreGrowth+path*Math.max(0,growth-centreEnd))
   const panelWidth=base*growth
   const angle=side*-12*Math.min(1,outward)
   const actualWidth=panelWidth/Math.cos(angle*Math.PI/180)
   const panelHeight=actualWidth/1.45
   const p=Math.max(200,depth)
   const scale=growth
   return {cycle,t,x,actualWidth,panelHeight,z:p*(1-1/scale),scale,angle}
 }
 React.useEffect(()=>{
   let cancelled=false
   if(staticMode){setImagesReady(true);return}
   const pending:HTMLImageElement[]=[]
   setImagesReady(false)
   const requests=content.map(item=>new Promise<void>(resolve=>{
     if(item.type==="video"){resolve();return}
     const image=new Image();pending.push(image)
     image.onload=()=>{if(image.decode) image.decode().catch(()=>{}).then(()=>resolve());else resolve()}
     image.onerror=()=>resolve()
     image.src=item.src
   }))
   const timer=setTimeout(()=>{if(!cancelled)setImagesReady(true)},5000)
   Promise.all(requests).then(()=>{if(!cancelled){clearTimeout(timer);setImagesReady(true)}})
   return ()=>{cancelled=true;clearTimeout(timer);pending.forEach(image=>{image.onload=null;image.onerror=null})}
 },[content.map(item=>item.src).join("|"),staticMode])
 const easeIntro=(value:number)=>{
   const t=Math.max(0,Math.min(1,value))
   return introEase==="linear"?t:introEase==="out"?1-Math.pow(1-t,3):t*t*t*(t*(t*6-15)+10)
 }
 React.useEffect(()=>setPlaying(autoplay),[autoplay])
 React.useEffect(()=>{
   const media=window.matchMedia("(prefers-reduced-motion: reduce)")
   const update=()=>setReduced(media.matches)
   update();media.addEventListener("change",update)
   return ()=>media.removeEventListener("change",update)
 },[])
 React.useEffect(()=>{
   if(!root.current)return
   const observer=new ResizeObserver(entries=>{
     const r=entries[0].contentRect
     size.current={width:r.width,height:r.height}
     if(staticMode)redrawStatic.current?.()
   })
   observer.observe(root.current)
   return ()=>observer.disconnect()
 },[staticMode])
 React.useEffect(()=>{
   let frame=0, previous=0
   const draw=(now:number)=>{
     const dt=previous?Math.min((now-previous)/1000,.05):0
     previous=now
     const active=playing && !staticMode && !reduced && !(pauseOnHover&&hovered) && !document.hidden
     const target=Math.max(0,speed)*.38*(reverse?-1:1)
     const damping=1-Math.exp(-dt/(.025+smoothness*1.2))
     velocity.current+=(target-velocity.current)*damping
     const startup=intro&&!staticMode&&!reduced
     const totalIntro=Math.max(.1,introDuration)+(count-1)*introStagger
     if(startup&&imagesReady&&!document.hidden) introElapsed.current+=dt
     const introComplete=!startup||introElapsed.current>=totalIntro
     const overallIntro=!startup?1:easeIntro(introElapsed.current/Math.max(.1,introDuration))
     if(active&&introComplete) phase.current+=dt*velocity.current
     const {width:w,height:h}=size.current
     const p=Math.max(200,depth)
     let stripHeight=Infinity
     const stripWidth=baseWidth(w,h)*(1+Math.max(.035,spacing*.22))*4.4
     for(let i=0;i<count*2;i++){
       const el=cards.current[i];if(!el||!content.length)continue
       const slot=Math.floor(i/2),side=i%2===0?-1:1
       const g=geometry(slot,side,staticMode?0:phase.current,w,h)
       const sequence=slot-g.cycle*count
       const index=mod(mirror?sequence:sequence*2+(side===1?1:0),content.length)
       const item=content[index]
       const img=syncMedia(el,item,active&&introComplete)
       let ratio=proportions==="original"&&mediaWidth(img)?mediaWidth(img)/mediaHeight(img):1.45
       // Both sides share the right-hand panel envelope, so mixed source ratios
       // cannot introduce a different height or baseline on the left.
       if(side===-1 && proportions==="original"){
         const paired=activeMedia(cards.current[i+1])
         if(mediaWidth(paired) && mediaHeight(paired)) ratio=mediaWidth(paired)/mediaHeight(paired)
       }
       ratio=ratioFor(ratio)
       if(g.t*count<2.6) stripHeight=Math.min(stripHeight,g.actualWidth/g.scale/ratio)
       el.style.borderRadius=radius+"px"
       img.style.borderRadius=radius+"px"
       const reveal=!startup?1:easeIntro((introElapsed.current-slot*introStagger)/Math.max(.1,introDuration))
       const seed=baseWidth(w,h)*.3
       const displayedWidth=seed+(g.actualWidth-seed)*reveal
       el.style.width=displayedWidth+"px"
       el.style.height=displayedWidth/ratio+"px"
       el.style.transform="translate(-50%, -50%) translate3d("+(g.x*reveal)+"px,0,0) rotateY("+(g.angle*reveal)+"deg)"
       el.style.filter="none"
       const strength=reduced?0:effectAmount*reveal
       const ramp=Math.max(0,(g.t*count-1.5)/(count-1.5))
       const turn=effect==="rotate"?Math.sin(ramp*Math.PI)*side*45*strength:effect==="flip"?ramp*360*strength:0
       const tilt=effect==="tilt"?Math.sin(ramp*Math.PI*2)*25*strength:0
       const spin=effect==="spin"?ramp*360*side*strength:0
       img.style.transform=turn||tilt||spin?"rotateY("+turn+"deg) rotateX("+tilt+"deg) rotateZ("+spin+"deg)":"none"
       img.style.backfaceVisibility="visible"
       el.style.perspective=Math.max(400,depth)+"px"
       const outer=(Math.abs(g.x)-g.panelHeight)/Math.max(1,w*.5)
       el.style.opacity=String(Math.max(0,Math.min(1,(1.65-outer)*4)))
       el.style.zIndex=String(Math.round(g.t*1000))
     }
     // The next incoming pair fills the centre while the preceding pair travels out.
     const incoming=Math.floor(phase.current+.42)
     const fraction=mod(phase.current+.42,1)
     const base=baseWidth(w,h)
     for(let s=0;s<2;s++){
       const panel=starters.current[s]
       if(!panel || !content.length) continue
       const side=s===0?-1:1
       const sequence=-incoming-1
       const index=mod(mirror?sequence:sequence*2+s,content.length)
       const item=content[index]
       const image=syncMedia(panel,item,active&&introComplete)
       const right=activeMedia(starters.current[1])
       const measure=s===0&&mediaWidth(right)?right:image
       const ratio=ratioFor(proportions==="original"&&mediaWidth(measure)?mediaWidth(measure)/mediaHeight(measure):1.45)
       panel.style.filter="none"
       panel.style.opacity=String(overallIntro)
       panel.style.width=base+"px"
       panel.style.height=base/ratio+"px"
       panel.style.transform="translate(-50%,-50%) translateX("+(side*base*(fraction-.5))+"px)"
       const cut=(1-fraction)*100
       panel.style.clipPath=s===0?"inset(0 "+cut+"% 0 0)":"inset(0 0 0 "+cut+"%)"
       panel.style.borderRadius=radius+"px"
     }
     if(strip.current){
       strip.current.style.height=(Number.isFinite(stripHeight)?stripHeight:0)+"px"
       strip.current.style.width=stripWidth*overallIntro+"px"
       strip.current.style.opacity=String(overallIntro)
     }
     if(!staticMode)frame=requestAnimationFrame(draw)
   }
   if(staticMode){
     redrawStatic.current=()=>draw(0)
     draw(0)
   }else{
     redrawStatic.current=null
     frame=requestAnimationFrame(draw)
   }
   const mountedRoot=root.current
   return ()=>{redrawStatic.current=null;if(frame)cancelAnimationFrame(frame);mountedRoot?.querySelectorAll("video").forEach(video=>video.pause())}
 },[content.map(i=>i.src+"|"+i.alt).join(),count,playing,canvas,reduced,pauseOnHover,hovered,speed,depth,imageSize,spacing,proportions,radius,smoothness,reverse,mirror,sizeMode,imageWidth,imageHeight,effect,effectAmount,leftBlur,rightBlur,intro,introDuration,introStagger,introEase,imagesReady,videoPlay,videoLoop,staticMode,isStaticRenderer])
 return <div ref={root} role="region" aria-label="3D Runway Carousel" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{width:"100%",height:"100%",minHeight:160,...style,position:"relative",overflow:"hidden",background,perspective:Math.max(200,depth),perspectiveOrigin:"50% 50%"}}>
   {content.length ? Array.from({length:count*2},(_,i)=>{
     const slot=Math.floor(i/2),side=i%2===0?-1:1
     const g=geometry(slot,side,0,1200,474),item=content[(mirror?slot:i)%content.length]
     return <div key={i} ref={el=>{cards.current[i]=el}} aria-hidden="true" style={{position:"absolute",left:"50%",top:"50%",height:intro&&!staticMode?baseWidth(1200,474)*.3/1.45:g.panelHeight,width:intro&&!staticMode?baseWidth(1200,474)*.3:g.actualWidth,transform:"translate(-50%, -50%) translate3d("+(intro&&!staticMode?0:g.x)+"px,0,0) rotateY("+(intro&&!staticMode?0:g.angle)+"deg)",transformStyle:"preserve-3d",backfaceVisibility:"hidden",zIndex:Math.round(g.t*1000),willChange:staticMode?"auto":"transform",borderRadius:radius,overflow:"hidden"}}>
       <img onLoad={()=>{if(staticMode)redrawStatic.current?.()}} src={item.type==="video"?item.poster:item.src} alt={item.alt||"Gallery photograph"} draggable={false} style={{display:"block",height:"100%",width:"100%",objectFit:"cover",borderRadius:radius}}/>
       <video onLoadedMetadata={()=>{if(staticMode)redrawStatic.current?.()}} muted playsInline loop={videoLoop} preload="metadata" poster={item.poster} src={item.type==="video"?item.src:undefined} data-active={item.type==="video"?"true":"false"} aria-label={item.alt||"Gallery video"} style={{display:item.type==="video"?"block":"none",width:"100%",height:"100%",objectFit:"cover",borderRadius:radius}}/>
     </div>
   }):<div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",fontFamily:"sans-serif",fontSize:14,color:"#555"}}>Add images to your gallery</div>}
   {content.length>0&&[0,1].map(s=>{const item=content[mod(-2+s,content.length)];return <div key={"starting-"+s} ref={el=>{starters.current[s]=el}} aria-hidden="true" style={{position:"absolute",left:"50%",top:"50%",height:0,width:0,overflow:"hidden",zIndex:1}}><img onLoad={()=>{if(staticMode)redrawStatic.current?.()}} src={item.type==="video"?item.poster:item.src} alt="" draggable={false} style={{display:item.type==="video"?"none":"block",width:"100%",height:"100%",objectFit:"cover"}}/><video onLoadedMetadata={()=>{if(staticMode)redrawStatic.current?.()}} muted playsInline loop={videoLoop} preload="metadata" poster={item.poster} data-active={item.type==="video"?"true":"false"} src={item.type==="video"?item.src:undefined} style={{display:item.type==="video"?"block":"none",width:"100%",height:"100%",objectFit:"cover"}}/></div>})}
   {content.length>0&&<div ref={strip} aria-hidden="true" style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:"16.5%",height:0,background:"#08090e",maskImage:"linear-gradient(to right,transparent 0%,black "+stripFade+"%,black "+(100-stripFade)+"%,transparent 100%)",WebkitMaskImage:"linear-gradient(to right,transparent 0%,black "+stripFade+"%,black "+(100-stripFade)+"%,transparent 100%)",pointerEvents:"none",zIndex:0}}/>}
   {edgeBlur&&content.length>0&&[0,1].map(side=>{
     const width=side===0?leftEdgeWidth:rightEdgeWidth
     const blur=side===0?leftBlur:rightBlur
     const softness=side===0?leftSoftness:rightSoftness
     const fade=side===0?leftFade:rightFade
     const mask="linear-gradient(to "+(side===0?"right":"left")+",black 0%,black "+Math.max(0,100-softness)+"%,transparent 100%)"
     return <div key={"edge-blur-"+side} aria-hidden="true" style={{position:"absolute",top:0,bottom:0,left:side===0?0:undefined,right:side===1?0:undefined,width:width+"%",zIndex:1500,pointerEvents:"none",backdropFilter:blur>0?"blur("+blur+"px)":"none",WebkitBackdropFilter:blur>0?"blur("+blur+"px)":"none",maskImage:mask,WebkitMaskImage:mask}}><div style={{position:"absolute",inset:0,background,opacity:fade/100}}/></div>
   })}
   {controls&&content.length>0&&<button type="button" aria-label={playing?"Pause gallery":"Resume gallery"} aria-pressed={!playing} onClick={()=>setPlaying(v=>!v)} style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",zIndex:2000,border:"1px solid rgba(0,0,0,.16)",borderRadius:30,padding:"9px 18px",background:"rgba(255,255,255,.88)",color:"#222",cursor:"pointer",fontFamily:"system-ui, sans-serif",fontSize:12,lineHeight:"18px"}}>{playing?"Pause":"Resume"}</button>}
 </div>
}
RunwayCarousel3D.displayName = "3D Runway Carousel"

addPropertyControls(RunwayCarousel3D,{
 images:{type:ControlType.Array,title:"Media",control:{type:ControlType.Object,controls:{
 type:{type:ControlType.Enum,title:"Media Type",options:["image","video"],optionTitles:["Image","Video"],defaultValue:"image"},
 src:{type:ControlType.Image,title:"Image",hidden:p=>p.type==="video"},
 video:{type:ControlType.File,title:"Video Upload",allowedFileTypes:["mp4","webm","mov"],hidden:p=>p.type!=="video"},
 poster:{type:ControlType.Image,title:"Video Poster",hidden:p=>p.type!=="video"},
 alt:{type:ControlType.String,title:"Description"}
 }},defaultValue:defaults},
 videoPlay:{type:ControlType.Boolean,title:"Play Videos",defaultValue:true},
 videoLoop:{type:ControlType.Boolean,title:"Loop Videos",defaultValue:true},
 intro:{type:ControlType.Boolean,title:"Opening Animation",defaultValue:true},
 introDuration:{type:ControlType.Number,title:"Opening Duration",defaultValue:1.8,min:.3,max:6,step:.1,unit:"s",hidden:p=>p.intro===false},
 introStagger:{type:ControlType.Number,title:"Opening Stagger",defaultValue:.045,min:0,max:.2,step:.005,unit:"s",hidden:p=>p.intro===false},
 introEase:{type:ControlType.Enum,title:"Opening Ease",options:["smooth","out","linear"],optionTitles:["Smooth","Ease Out","Linear"],defaultValue:"smooth",hidden:p=>p.intro===false},
 speed:{type:ControlType.Number,title:"Speed",defaultValue:1,min:.1,max:5,step:.1},
 spacing:{type:ControlType.Number,title:"Spacing",defaultValue:1,min:.4,max:2,step:.1},
 depth:{type:ControlType.Number,title:"Perspective",defaultValue:1000,min:200,max:2400,step:50,unit:"px"},
 sizeMode:{type:ControlType.Enum,title:"Image Sizing",options:["auto","manual"],optionTitles:["Automatic","Manual width & height"],defaultValue:"auto"},
 imageWidth:{type:ControlType.Number,title:"Image Width",defaultValue:40,min:12,max:180,step:1,unit:"px",hidden:p=>p.sizeMode!=="manual",description:"Starting image width. Images grow progressively toward the edges."},
 imageHeight:{type:ControlType.Number,title:"Image Height",defaultValue:60,min:12,max:240,step:1,unit:"px",hidden:p=>p.sizeMode!=="manual"},
 leftBlur:{type:ControlType.Number,title:"Left Edge Blur",defaultValue:12,min:0,max:40,step:.5,unit:"px",hidden:p=>p.edgeBlur===false},
 rightBlur:{type:ControlType.Number,title:"Right Edge Blur",defaultValue:12,min:0,max:40,step:.5,unit:"px",hidden:p=>p.edgeBlur===false},
 edgeBlur:{type:ControlType.Boolean,title:"Edge Blur",defaultValue:true},
 leftEdgeWidth:{type:ControlType.Number,title:"Left Width",defaultValue:20,min:0,max:45,step:1,unit:"%",hidden:p=>p.edgeBlur===false},
 rightEdgeWidth:{type:ControlType.Number,title:"Right Width",defaultValue:20,min:0,max:45,step:1,unit:"%",hidden:p=>p.edgeBlur===false},
 leftSoftness:{type:ControlType.Number,title:"Left Softness",defaultValue:100,min:1,max:100,step:1,unit:"%",hidden:p=>p.edgeBlur===false},
 rightSoftness:{type:ControlType.Number,title:"Right Softness",defaultValue:100,min:1,max:100,step:1,unit:"%",hidden:p=>p.edgeBlur===false},
 leftFade:{type:ControlType.Number,title:"Left Fade",defaultValue:0,min:0,max:100,step:1,unit:"%",hidden:p=>p.edgeBlur===false,description:"Fade the edge toward the gallery background."},
 rightFade:{type:ControlType.Number,title:"Right Fade",defaultValue:0,min:0,max:100,step:1,unit:"%",hidden:p=>p.edgeBlur===false},
 effect:{type:ControlType.Enum,title:"Motion Effect",options:["perspective","rotate","flip","tilt","spin"],optionTitles:["Classic perspective","3D rotation","3D flip","3D tilt","Spin"],defaultValue:"perspective"},
 effectAmount:{type:ControlType.Number,title:"Effect Amount",defaultValue:1,min:0,max:2,step:.1,hidden:p=>!p.effect||p.effect==="perspective"},
 imageSize:{type:ControlType.Number,title:"Image Size",defaultValue:1,min:.4,max:3,step:.05},
 smoothness:{type:ControlType.Number,title:"Smoothness",defaultValue:.65,min:0,max:1,step:.05,description:"Softens speed and direction changes without changing the steady playback speed."},
 reverse:{type:ControlType.Boolean,title:"Reverse",defaultValue:false,enabledTitle:"Inward",disabledTitle:"Outward"},
 mirror:{type:ControlType.Boolean,title:"Mirror Images",defaultValue:false,description:"Use matching images on the left and right paths."},
 stripFade:{type:ControlType.Number,title:"Strip Fade",defaultValue:18,min:0,max:45,step:1,unit:"%"},
 autoplay:{type:ControlType.Boolean,title:"Autoplay",defaultValue:true},
 controls:{type:ControlType.Boolean,title:"Playback UI",defaultValue:true},
 pauseOnHover:{type:ControlType.Boolean,title:"Hover Pause",defaultValue:false},
 background:{type:ControlType.Color,title:"Background",defaultValue:"#e4e4e4"},
 proportions:{type:ControlType.Enum,title:"Proportions",options:["landscape","original"],optionTitles:["Landscape crop","Original ratio"],defaultValue:"landscape"},
 radius:{type:ControlType.Number,title:"Corners",defaultValue:5,min:0,max:30,step:1,unit:"px",description:"Build by Muthu V  \n[Explore more components](https://www.framer.com/@muthu-v/components/)"}
})
