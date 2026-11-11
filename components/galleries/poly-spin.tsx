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


type Vec = [number, number, number]
type Quat = [number, number, number, number]
interface ImageValue { src: string; srcSet?: string; alt?: string }
interface ImageSlot { image?: ImageValue | null; label?: string }
interface Props {
    imageSlots?: ImageSlot[] | null
    images?: (ImageValue | ImageSlot | null | undefined)[] | null
    sensitivity?: number
    quickRelease?: boolean
    releaseDelay?: number
    resistance?: number
    gap?: number
    edgeColor?: string
    surfaceColor?: string
    edgeWidth?: number
    style?: React.CSSProperties
}
const dot = (a: Vec, b: Vec) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
const scale = (v: Vec, s: number): Vec => [v[0]*s,v[1]*s,v[2]*s]
const subtract = (a: Vec, b: Vec): Vec => [a[0]-b[0],a[1]-b[1],a[2]-b[2]]
const cross = (a: Vec, b: Vec): Vec => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
const normalize = (v: Vec): Vec => scale(v,1/Math.hypot(...v))
const average = (vs: Vec[]): Vec => scale(vs.reduce<Vec>((s,v)=>[s[0]+v[0],s[1]+v[1],s[2]+v[2]],[0,0,0]),1/vs.length)

// Regular icosahedron: twenty congruent equilateral triangular image tiles.
function createFaces() {
    const phi=(1+Math.sqrt(5))/2, ico: Vec[]=[]
    for (const a of [-1,1]) for (const b of [-phi,phi]) ico.push([0,a,b],[a,b,0],[b,0,a])
    const adjacent=(i:number,j:number)=>Math.abs(Math.hypot(...subtract(ico[i],ico[j]))-2)<1e-6
    const triangles:number[][]=[]
    for(let a=0;a<12;a++) for(let b=a+1;b<12;b++) for(let c=b+1;c<12;c++) {
        if(adjacent(a,b)&&adjacent(a,c)&&adjacent(b,c)) triangles.push([a,b,c])
    }
    const raw:Vec[][]=triangles.map(indices=>indices.map(i=>normalize(ico[i])))
    // Aim one triangular face at the viewer, with a corner pointing upward.
    const forward=normalize(average(raw[0]))
    const down=normalize(subtract([0,1,0],scale(forward,forward[1])))
    const right=normalize(cross(down,forward))
    const frontCorner=raw[0].map(v=>[dot(v,right),dot(v,down)]).sort((a,b)=>Math.abs(Math.atan2(a[1],a[0]))-Math.abs(Math.atan2(b[1],b[0])))[0]
    const angle=-Math.PI/2-Math.atan2(frontCorner[1],frontCorner[0]),cos=Math.cos(angle),sin=Math.sin(angle)
    return raw.map((original,index)=>{
        const vertices=original.map((v):Vec=>{const x=dot(v,right),y=dot(v,down);return [x*cos-y*sin,x*sin+y*cos,dot(v,forward)]})
        const center=average(vertices), normal=normalize(center)
        const localY=normalize(subtract([0,1,0],scale(normal,normal[1])))
        const localX=normalize(cross(localY,normal))
        const uv=vertices.map(v=>[dot(subtract(v,center),localX)*200,dot(subtract(v,center),localY)*200])
        uv.sort((a,b)=>Math.atan2(a[1],a[0])-Math.atan2(b[1],b[0]))
        const x=Math.min(...uv.map(p=>p[0])), y=Math.min(...uv.map(p=>p[1]))
        const width=Math.max(...uv.map(p=>p[0]))-x, height=Math.max(...uv.map(p=>p[1]))-y
        const points=uv.map(p=>[p[0]-x,p[1]-y])
        const position=center.map((v,i)=>200*v+localX[i]*x+localY[i]*y)
        return {
            index, width, height, normal,
            cx:-x, cy:-y,
            points:points.map(p=>p.join(',')).join(' '),
            clip:`polygon(${points.map(p=>`${p[0]/width*100}% ${p[1]/height*100}%`).join(',')})`,
            transform:`matrix3d(${[...localX,0,...localY,0,...normal,0,...position,1].join(',')})`,
        }
    })
}
const faces=createFaces()
const identity:Quat=[0,0,0,1]
function multiply(a:Quat,b:Quat):Quat {
    return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]
}
function rotation(v:Vec):Quat {
    const angle=Math.hypot(...v)
    return angle<1e-10?[...identity]:[...scale(v,Math.sin(angle/2)/angle),Math.cos(angle/2)] as Quat
}
function turn(q:Quat,v:Vec):Quat {
    const next=multiply(rotation(v),q),length=Math.hypot(...next)
    return next.map(n=>n/length) as Quat
}
function blend(a:Quat,b:Quat,t:number):Quat {
    let cosine=a.reduce((s,n,i)=>s+n*b[i],0), end=b
    if(cosine<0){end=b.map(n=>-n) as Quat;cosine=-cosine}
    if(cosine>.9995){const q=a.map((n,i)=>n+(end[i]-n)*t) as Quat;const length=Math.hypot(...q);return q.map(n=>n/length) as Quat}
    const theta=Math.acos(Math.min(1,cosine)),denom=Math.sin(theta)
    return a.map((n,i)=>(n*Math.sin((1-t)*theta)+end[i]*Math.sin(t*theta))/denom) as Quat
}
function toMatrix([x,y,z,w]:Quat) {
    return `matrix3d(${[1-2*(y*y+z*z),2*(x*y+z*w),2*(x*z-y*w),0,2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w),0,2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y),0,0,0,0,1].join(',')})`
}

/**
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 560
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Polyspin({images=[],imageSlots,sensitivity=1,resistance=.8,quickRelease=false,releaseDelay=55,gap=0,edgeColor="#343434",surfaceColor="#FAFAF8",edgeWidth=1,style}:Props) {
    // Cleared Framer image controls can leave empty entries or a null array.
    const suppliedImages=imageSlots??images
    const activeImages:ImageValue[]=Array.isArray(suppliedImages)
        ? suppliedImages.map(item=>item&&'image' in item?(item.image?{...item.image,alt:item.label||item.image.alt}:null):item as ImageValue|null|undefined).filter((image):image is ImageValue=>!!image&&typeof image.src==='string'&&image.src.trim().length>0).slice(0,12)
        : []
    const root=React.useRef<HTMLDivElement>(null)
    const stage=React.useRef<HTMLDivElement>(null)
    const rotor=React.useRef<HTMLDivElement>(null)
    const sizing=React.useRef<HTMLDivElement>(null)
    const orientation=React.useRef<Quat>([...identity])
    const isStatic=useIsStaticRenderer()

    React.useEffect(()=>{
        const host=root.current, surface=stage.current, object=rotor.current, fit=sizing.current
        if(!host||!surface||!object||!fit)return
        let target:Quat=[...orientation.current], velocity:Vec=[0,0,0]
        let raf=0,lastFrame=0,lastMove=0,visible=true,disposed=false
        let dragMode='spin',bounds=surface.getBoundingClientRect()
        let earlyCoast=false,releaseTimer=0
        let lastFastVelocity:Vec=[0,0,0],lastFastTime=-Infinity
        const isMac=/Mac/.test(navigator.platform)
        const cancelRelease=()=>{window.clearTimeout(releaseTimer);releaseTimer=0}
        let travel:Vec=[0,0,0]
        let samples:{time:number;travel:Vec}[]=[]
        const pointers=new Map<number,{x:number;y:number}>()
        const preference=window.matchMedia('(prefers-reduced-motion: reduce)')
        let reduced=preference.matches
        const paint=()=>{object.style.transform=toMatrix(orientation.current)}
        const distance=()=>1-Math.abs(orientation.current.reduce((sum,n,i)=>sum+n*target[i],0))
        const stop=()=>{cancelAnimationFrame(raf);raf=0}
        const wake=()=>{
            if(raf||disposed||isStatic||!visible||document.hidden)return
            lastFrame=performance.now();raf=requestAnimationFrame(tick)
        }
        function tick(time:number){
            raf=0
            if(disposed||!visible||document.hidden)return
            const dt=Math.min((time-lastFrame)/1000,.05);lastFrame=time
            const coasting=(pointers.size===0||earlyCoast)&&!reduced&&Math.hypot(...velocity)>.003
            if(coasting){
                // Integrate angular velocity analytically: same glide at 60 or 120 Hz.
                const friction=Math.max(.12,resistance*.5),decay=Math.exp(-friction*dt)
                orientation.current=turn(orientation.current,scale(velocity,(1-decay)/friction))
                target=[...orientation.current]
                velocity=scale(velocity,decay)
            }else{
                orientation.current=reduced?[...target]:blend(orientation.current,target,1-Math.exp(-dt/.028))
            }
            paint()
            if(coasting||distance()>1e-9)raf=requestAnimationFrame(tick)
            else {if(pointers.size===0)velocity=[0,0,0];orientation.current=[...target];paint()}
        }
        const resize=()=>{
            bounds=surface.getBoundingClientRect()
            const size=Math.max(1,Math.min(host.clientWidth,host.clientHeight))
            fit.style.transform=`scale(${size*.44/200})`
            surface.style.perspective=`${size*6}px`
        }
        resize();paint()
        const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host)
        const visibilityObserver=new IntersectionObserver(([entry])=>{
            visible=entry.isIntersecting
            if(visible)wake();else {cancelRelease();earlyCoast=false;stop();velocity=[0,0,0]}
        });visibilityObserver.observe(host)
        const clear=()=>{cancelRelease();earlyCoast=false;pointers.clear();velocity=[0,0,0];surface.style.cursor='grab';wake()}
        const onVisibility=()=>{if(document.hidden){clear();stop()}else wake()}
        const onPreference=()=>{reduced=preference.matches;if(reduced){cancelRelease();earlyCoast=false;velocity=[0,0,0];orientation.current=[...target];paint()}}
        const addRotation=(v:Vec,time:number,mode:string)=>{
            target=turn(target,v)
            // Estimate release speed from a recent gesture window, not its last event.
            if(mode!==dragMode||time-lastMove>120){
                travel=[0,0,0]
                samples=[{time:time-16,travel:[0,0,0]}]
            }
            travel=[travel[0]+v[0],travel[1]+v[1],travel[2]+v[2]]
            samples.push({time,travel:[...travel]})
            while(samples.length>2&&samples[1].time<time-60)samples.shift()
            const first=samples[0]
            const elapsed=Math.max(16,time-first.time)/1000
            const measured=scale(subtract(travel,first.travel),1/elapsed)
            velocity=scale(measured,Math.min(1,12/Math.max(1e-6,Math.hypot(...measured))))
            lastMove=time;dragMode=mode
            if(mode==='spin'&&Math.hypot(...velocity)>1.8){lastFastVelocity=[...velocity];lastFastTime=time}
            // Pointer tracking is direct. Only the released motion is eased by friction.
            orientation.current=[...target];paint()
        }
        const onDown=(e:PointerEvent)=>{
            if(isStatic||e.button!==0||pointers.size>=2)return
            e.preventDefault();surface.style.outline='none';surface.focus({preventScroll:true})
            bounds=surface.getBoundingClientRect()
            pointers.set(e.pointerId,{x:e.clientX,y:e.clientY})
            cancelRelease();earlyCoast=false;lastFastVelocity=[0,0,0];lastFastTime=-Infinity;stop();velocity=[0,0,0];target=[...orientation.current];lastMove=e.timeStamp
            travel=[0,0,0];samples=[{time:lastMove,travel:[0,0,0]}]
            dragMode=e.metaKey||e.ctrlKey||pointers.size===2?'roll':'spin'
            surface.setPointerCapture(e.pointerId);surface.style.cursor='grabbing'
        }
        const onMove=(e:PointerEvent)=>{
            const previous=pointers.get(e.pointerId);if(!previous)return
            e.preventDefault()
            const current={x:e.clientX,y:e.clientY},dx=current.x-previous.x,dy=current.y-previous.y
            if(dx===0&&dy===0)return
            cancelRelease()
            if(earlyCoast){
                earlyCoast=false;stop();target=[...orientation.current];velocity=[0,0,0]
                travel=[0,0,0];samples=[{time:e.timeStamp-16,travel:[0,0,0]}]
            }
            const factor=3.4*sensitivity/Math.max(120,Math.min(bounds.width,bounds.height))
            let amount:Vec,mode='spin'
            if(pointers.size===2){
                const other=Array.from(pointers.entries()).find(([id])=>id!==e.pointerId)![1]
                const a={x:previous.x-other.x,y:previous.y-other.y},b={x:current.x-other.x,y:current.y-other.y}
                amount=[0,0,Math.hypot(a.x,a.y)>20?Math.atan2(a.x*b.y-a.y*b.x,a.x*b.x+a.y*b.y):0];mode='roll'
            }else if(e.metaKey||e.ctrlKey){
                const cx=bounds.left+bounds.width/2,cy=bounds.top+bounds.height/2
                const a={x:previous.x-cx,y:previous.y-cy},b={x:current.x-cx,y:current.y-cy}
                amount=[0,0,Math.hypot(a.x,a.y)>32&&Math.hypot(b.x,b.y)>32?Math.atan2(a.x*b.y-a.y*b.x,a.x*b.x+a.y*b.y)*sensitivity:dx*factor];mode='roll'
            }else amount=[-dy*factor,dx*factor,0]
            pointers.set(e.pointerId,current)
            addRotation(amount,e.timeStamp,mode)
            // macOS mouse events cannot distinguish three-finger drag from a physical click.
            // Opt-in anticipation only after a fast, sampled spin; touch and roll keep native release.
            if(quickRelease&&isMac&&e.pointerType==='mouse'&&e.type==='pointermove'&&
                pointers.size===1&&mode==='spin'&&!reduced&&samples.length>=3&&
                Math.hypot(...velocity)>1.8){
                releaseTimer=window.setTimeout(()=>{
                    releaseTimer=0
                    if(disposed||!visible||document.hidden||reduced||pointers.size!==1)return
                    earlyCoast=true;target=[...orientation.current];wake()
                },Math.max(30,Math.min(150,releaseDelay)))
            }
        }
        const onUp=(e:PointerEvent)=>{
            if(!pointers.has(e.pointerId))return
            // Include the release position if the browser combined the final move with pointerup.
            cancelRelease()
            // Capture loss ends our drag ownership; it is not a pointer cancellation.
            const released=e.type==='pointerup'||e.type==='lostpointercapture'
            const anticipated=earlyCoast
            if(e.type==='pointerup'&&!anticipated)onMove(e)
            earlyCoast=false
            pointers.delete(e.pointerId)
            if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId)
            if(pointers.size){velocity=[0,0,0];lastMove=e.timeStamp;travel=[0,0,0];samples=[{time:lastMove,travel:[0,0,0]}];return}
            const idle=Math.max(0,e.timeStamp-lastMove)
            const fastAge=e.timeStamp-lastFastTime
            // A tiny movement after anticipated coasting can replace a flick with near-zero speed.
            // Keep the recent fast sample for an actual mouse release, but let old movement expire.
            if(released&&e.pointerType==='mouse'&&
                Math.hypot(...velocity)<1&&fastAge>=0&&fastAge<140){
                velocity=scale(lastFastVelocity,Math.exp(-fastAge/250))
            }
            velocity=!released||reduced?[0,0,0]:anticipated?velocity:scale(velocity,Math.exp(-Math.max(0,idle-180)/150))
            lastFastVelocity=[0,0,0];lastFastTime=-Infinity
            // Release from the visible orientation, avoiding a snap to a hidden target.
            if(Math.hypot(...velocity)>.003)target=[...orientation.current]
            surface.style.cursor='grab';stop();wake()
        }
        const onKey=(e:KeyboardEvent)=>{
            const angles:Record<string,Vec>={ArrowLeft:[0,-.15,0],ArrowRight:[0,.15,0],ArrowUp:[.15,0,0],ArrowDown:[-.15,0,0]}
            if(!angles[e.key])return
            cancelRelease();earlyCoast=false
            e.preventDefault();surface.style.outline='2px solid currentColor';surface.style.outlineOffset='-3px';velocity=[0,0,0]
            target=turn(target,e.shiftKey||e.metaKey||e.ctrlKey?[0,0,e.key==='ArrowLeft'||e.key==='ArrowUp'?-.15:.15]:angles[e.key])
            if(reduced){orientation.current=[...target];paint()}else wake()
        }
        const onContext=(e:Event)=>e.preventDefault()
        surface.addEventListener('pointerdown',onDown)
        surface.addEventListener('pointermove',onMove)
        surface.addEventListener('pointerup',onUp)
        surface.addEventListener('pointercancel',onUp)
        surface.addEventListener('lostpointercapture',onUp)
        surface.addEventListener('keydown',onKey)
        surface.addEventListener('contextmenu',onContext)
        window.addEventListener('blur',clear)
        document.addEventListener('visibilitychange',onVisibility)
        preference.addEventListener('change',onPreference)
        return()=>{
            disposed=true;cancelRelease();stop();resizeObserver.disconnect();visibilityObserver.disconnect()
            surface.removeEventListener('pointerdown',onDown);surface.removeEventListener('pointermove',onMove)
            surface.removeEventListener('pointerup',onUp);surface.removeEventListener('pointercancel',onUp)
            surface.removeEventListener('lostpointercapture',onUp);surface.removeEventListener('keydown',onKey)
            surface.removeEventListener('contextmenu',onContext);window.removeEventListener('blur',clear)
            document.removeEventListener('visibilitychange',onVisibility);preference.removeEventListener('change',onPreference)
        }
    },[sensitivity,resistance,quickRelease,releaseDelay,isStatic])

    return <div ref={root} style={{width:560,height:560,...style,position:'relative',overflow:'hidden'}}>
        <div ref={stage} tabIndex={0} role="group" aria-label="Interactive image sphere. Drag to spin. Command or Control drag to roll. On touch screens twist with two fingers. Arrow keys rotate; Shift and arrow keys roll."
            style={{position:'absolute',inset:0,perspective:3360,cursor:'grab',touchAction:'none',userSelect:'none',WebkitUserSelect:'none'}}>
            <div ref={sizing} style={{position:'absolute',left:'50%',top:'50%',width:0,height:0,transform:'scale(1.232)',transformStyle:'preserve-3d',pointerEvents:'none'}}>
                <div ref={rotor} data-polyspin-rotor="" style={{width:0,height:0,transform:toMatrix(orientation.current),transformStyle:'preserve-3d',willChange:'transform'}}>
                    {faces.map(face=>{
                        const image=activeImages[face.index%Math.max(1,activeImages.length)]
                        const iconSize=Math.min(face.width,face.height)*.48
                        return <div key={face.index} style={{position:'absolute',width:face.width,height:face.height,transformOrigin:'0 0',transform:face.transform,backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden'}}>
                            <div style={{position:'absolute',inset:0,clipPath:face.clip,background:edgeColor,transformOrigin:`${face.cx}px ${face.cy}px`,transform:`scale(${1-Math.max(0,gap)/100})`}}>
                                <div style={{position:'absolute',inset:0,clipPath:face.clip,background:surfaceColor,transformOrigin:`${face.cx}px ${face.cy}px`,transform:`scale(${1-edgeWidth*.012})`}}>
                                {image?.src?<img src={image.src} srcSet={image.srcSet} sizes="240px" alt={image.alt||''} draggable={false} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:
                                    <svg aria-hidden="true" viewBox="0 0 100 80" style={{position:'absolute',width:iconSize,height:iconSize*.8,left:face.cx-iconSize/2,top:face.cy-iconSize*.4,overflow:'visible'}} fill="none" stroke={edgeColor} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
                                        <circle cx="68" cy="17" r="7"/>
                                        <path d="M12 66 L39 32 L56 49 L66 39 L88 66 Z"/>
                                    </svg>}
                                </div>
                            </div>
                        </div>
                    })}
                </div>
            </div>
        </div>
    </div>
}
addPropertyControls(Polyspin,{
    images:{type:ControlType.Array,title:'Images',maxCount:12,control:{type:ControlType.ResponsiveImage},hidden:()=>true},
    imageSlots:{type:ControlType.Array,title:'Image Slots',maxCount:12,control:{type:ControlType.Object,controls:{image:{type:ControlType.ResponsiveImage,title:'Image'},label:{type:ControlType.String,title:'Alt Text',defaultValue:''}}},description:'Up to 12 images.'},
    sensitivity:{type:ControlType.Number,title:'Drag Speed',defaultValue:1,min:.2,max:3,step:.1},
    resistance:{type:ControlType.Number,title:'Resistance',defaultValue:.8,min:.2,max:5,step:.1,description:'Lower values create a longer, gentler glide.'},
    quickRelease:{type:ControlType.Boolean,title:'Quick Release',defaultValue:false,description:'Anticipate fast Mac flicks. Pausing may also start a spin.'},
    releaseDelay:{type:ControlType.Number,title:'Release Delay',defaultValue:55,min:30,max:150,step:5,unit:'ms',hidden:props=>!props.quickRelease},
    gap:{type:ControlType.Number,title:'Tile Gap',defaultValue:0,min:0,max:8,step:.1,unit:'%'},
    edgeColor:{type:ControlType.Color,title:'Edge Color',defaultValue:'#343434'},
    surfaceColor:{type:ControlType.Color,title:'Surface',defaultValue:'#FAFAF8'},
    edgeWidth:{type:ControlType.Number,title:'Edge Width',defaultValue:1,min:0,max:4,step:.1},
})
