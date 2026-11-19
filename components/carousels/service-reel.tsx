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

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"

type Sector = { name: string; note: string }
interface Props {
    title?: string
    sectors?: Sector[]
    interval?: number
    style?: React.CSSProperties
}
const defaultTitle = "What can we make for you?"
const defaultSectors: Sector[] = [
    { name: "Brand identity", note: "A logo for the shopfront, a small mark for the browser tab, and a guide that shows your team when to use each." },
    { name: "Web design", note: "Try a clickable version of your site on a phone or a laptop before your developer builds the first page." },
    { name: "Packaging", note: "See how the front of the box reads on a shelf and where the fine print fits on the back. Your printer gets the finished artwork." },
    { name: "Art direction", note: "Before the shoot, we work out the lighting and framing. Your photographer gets a reference board and a shot list." },
    { name: "Motion design", note: "Give your logo a little movement. Use the full animation to open a film and the short loop in a social post." },
    { name: "Editorial design", note: "For a lookbook or an annual report, we pair each story with the right images and lay out a print edition and a screen-friendly PDF." },
]
const fonts = 'https://fonts.googleapis.com/css2?family=Geist:wght@400..700&display=swap'
const layoutCSS = "\n.bt-sector-wheel{container:bt-wheel / inline-size;background:#000;color:#f7f7f5;color-scheme:dark;font-family:Geist,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}\n.bt-sector-wheel *{box-sizing:border-box}\n.bt-sector-wheel .bt-shell{width:100%;max-width:1600px;margin-inline:auto;min-height:100svh;padding:0 clamp(32px,5.3cqw,88px);display:flex;flex-direction:column}\n\n\n\n\n\n.bt-sector-wheel .bt-main{flex:1;display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:clamp(36px,8cqw,128px);align-items:center;padding:clamp(46px,7cqw,105px) 0}\n.bt-sector-wheel .bt-copy,.bt-sector-wheel .bt-index{min-width:0}\n.bt-sector-wheel .bt-title{margin:0;max-width:12.6ch;font-family:inherit;font-size:clamp(46px,5.65cqw,88px);font-weight:550;letter-spacing:-.072em;line-height:.99;text-wrap:balance;color:#fafaf8}\n.bt-sector-wheel .bt-note{margin:32px 0 0;min-height:5em;max-width:37ch;font-size:clamp(15px,1.40cqw,20px);line-height:1.54;color:#b9b9b9}\n.bt-sector-wheel .bt-note p{font:inherit;margin:0}\n.bt-sector-wheel .bt-controls{max-width:385px;display:flex;align-items:center;justify-content:space-between;gap:18px;border-top:1px solid #343434;margin-top:28px;padding-top:18px}\n.bt-sector-wheel .bt-count{display:inline-flex;align-items:center;gap:9px;font:550 14px/18px Geist,'Helvetica Neue',Arial,sans-serif;font-variant-numeric:tabular-nums;color:#f8f8f8}\n.bt-sector-wheel .bt-total{color:#929292}.bt-sector-wheel .bt-arrows{display:flex;gap:8px}\n.bt-sector-wheel button{font-family:inherit;-webkit-tap-highlight-color:transparent;cursor:pointer}\n.bt-sector-wheel .bt-arrow{width:44px;height:44px;display:grid;place-items:center;padding:0;border-radius:50%;transition:background .15s,color .15s,transform .15s}\n.bt-sector-wheel .bt-prev{background:#000;border:1px solid #555;color:#f7f7f7}.bt-sector-wheel .bt-next{background:#f1f1ed;border:1px solid #f1f1ed;color:#070707}\n.bt-sector-wheel .bt-arrow:active{transform:scale(.94)}\n.bt-sector-wheel .bt-mask{position:relative;isolation:isolate;--row:clamp(64px,6.8cqw,104px);height:calc(var(--row)*5);overflow:hidden;touch-action:pan-x pinch-zoom}\n.bt-sector-wheel .bt-band{position:absolute;top:50%;transform:translateY(-50%);height:var(--row);left:0;right:0;border-block:1px solid #414141;pointer-events:none}\n.bt-sector-wheel .bt-band:before{content:'';position:absolute;top:50%;left:0;width:12px;height:3px;transform:translateY(-50%);background:#fafaf8}\n.bt-sector-wheel .bt-origin{position:absolute;left:0;right:0;top:calc(50% - var(--row)/2)}\n.bt-sector-wheel .bt-option{position:absolute;inset:0 0 auto;width:100%;height:var(--row);padding:0 4px 0 26px;display:flex;align-items:center;text-align:left;transform-origin:26px center;border:0;background:transparent;color:#f5f5f2;font-size:clamp(32px,4cqw,62px);font-weight:510;letter-spacing:-.065em;line-height:1.02;overflow-wrap:anywhere}\n.bt-sector-wheel :is(button,.bt-mask):focus-visible{outline:2px solid white;outline-offset:-4px}\n.bt-sector-wheel .bt-hint{display:flex;align-items:center;gap:9px;margin:17px 0 0;font-size:12px;line-height:1.3;color:#a1a1a1}\n.bt-sector-wheel .bt-mouse{display:inline-grid;place-items:start center;padding-top:3px;width:11px;height:16px;border:1px solid currentColor;border-radius:7px}\n.bt-sector-wheel .bt-mouse:after{content:'';width:1px;height:4px;background:currentColor}\n.bt-sector-wheel .bt-swipe{display:none}\n@media(hover:hover){.bt-sector-wheel .bt-prev:hover{background:#262626}.bt-sector-wheel .bt-next:hover{background:#d5d5d0}.bt-sector-wheel .bt-option:hover{color:#fff}}\n@media(pointer:coarse){.bt-sector-wheel .bt-hint .bt-scroll,.bt-sector-wheel .bt-mouse{display:none}.bt-sector-wheel .bt-swipe{display:inline}}\n@media(prefers-reduced-motion:reduce){.bt-sector-wheel .bt-arrow{transition:none}}\n@container bt-wheel (max-width:760px){.bt-sector-wheel .bt-shell{padding-inline:clamp(20px,6cqw,36px)}.bt-sector-wheel .bt-main{grid-template-columns:minmax(0,1fr);align-content:center;gap:34px;padding:40px 0 32px}.bt-sector-wheel .bt-title{font-size:clamp(42px,9.8cqw,64px);max-width:15ch}.bt-sector-wheel .bt-note{margin-top:20px;min-height:4.62em;font-size:15px}.bt-sector-wheel .bt-controls{margin-top:16px;padding-top:12px;max-width:none}.bt-sector-wheel .bt-mask{--row:clamp(50px,11.5cqw,66px);height:calc(var(--row)*3)}.bt-sector-wheel .bt-option{font-size:clamp(28px,7.4cqw,40px)}.bt-sector-wheel .bt-hint{margin-top:12px}}\n"
function Counter({ value, quiet }: { value: number; quiet: boolean }) {
    return <span aria-hidden="true" style={{display:"inline-flex",fontVariantNumeric:"tabular-nums",height:18,lineHeight:"18px"}}>
        {String(value).padStart(2,"0").split("").map((digit,index)=><span key={index} style={{display:"inline-block",height:18,overflow:"hidden"}}>
            <motion.span initial={false} animate={{y:-Number(digit)*18}} transition={{duration:quiet?0:0.8,ease:[0.16,1,0.3,1]}} style={{display:"flex",flexDirection:"column"}}>
                {Array.from({length:10},(_,n)=><span key={n} style={{height:18}}>{n}</span>)}
            </motion.span>
        </span>)}
    </span>
}
function createWheelHandler(step: (direction: number) => void){
    let lastTime=-Infinity;
    let lastStep=-Infinity;
    let direction=0;
    let sum=0;
    let fired=false;
    let previousMagnitude=0;
    return function onWheel(event: WheelEvent){
        if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
        const mode=event.deltaMode;
        const pixels=event.deltaY*(mode===1?16:mode===2?600:1);
        const amount=Math.abs(pixels);
        const sign=Math.sign(pixels);
        const time=event.timeStamp;
        const gap=time-lastTime;
        const discrete=mode!==0 || (amount>=48 && gap>=55 && previousMagnitude===amount);
        const newImpulse=fired && time-lastStep>240 && previousMagnitude<12 && amount>=22 && amount>previousMagnitude*2.5;
        if(gap>165 || sign!==direction || newImpulse || (discrete && time-lastStep>=90)){
            sum=0;
            fired=false;
        }
        direction=sign;
        lastTime=time;
        previousMagnitude=amount;
        if(event.cancelable)event.preventDefault();
        sum+=amount;
        if(fired || sum<(mode===0?14:1))return;
        fired=true;
        lastStep=time;
        step(sign);
    }
}

function ArrowButton({next,press}:{next:boolean;press:()=>void}) {
    return <button className={'bt-arrow '+(next?'bt-next':'bt-prev')} type="button" aria-label={next?'Next service':'Previous service'} onClick={press}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={next?'M5 12h14m-7-7 7 7-7 7':'M19 12H5m7-7-7 7 7 7'}/></svg>
    </button>
}
/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SectorWheel({title=defaultTitle,sectors=defaultSectors,interval=2600,style}:Props) {
    const items=(sectors||[]).filter(item=>item && item.name?.trim())
    const count=items.length
    const [selected,setSelected]=React.useState(0)
    const [hover,setHover]=React.useState(false)
    const [focus,setFocus]=React.useState(false)
    const section=React.useRef<HTMLElement>(null)
    const wheel=React.useRef<HTMLDivElement>(null)
    const touchStart=React.useRef<{x:number;y:number}|null>(null)
    const ignoreClickUntil=React.useRef(0)
    const headingId=React.useId()
    const hintId=React.useId()
    const staticView=useIsStaticRenderer()
    const reduced=useReducedMotion()
    const quiet=!!(staticView||reduced)
    const inView=useInView(section,{amount:0.35})
    const current=count?Math.min(selected,count-1):0
    const paused=hover||focus||quiet||!inView||count<2||interval<=0
    const advance=React.useCallback((direction:number)=>{
        if(count>1)setSelected(value=>(Math.min(value,count-1)+direction+count)%count)
    },[count])
    React.useEffect(()=>{
        if(paused)return
        const timer=window.setTimeout(()=>advance(1),interval)
        return ()=>window.clearTimeout(timer)
    },[paused,current,interval,advance])
    React.useEffect(()=>{
        const node=section.current
        if(!node||staticView||count<2)return
        const handle=createWheelHandler(advance)
        const listen=(event:WheelEvent)=>{
            const bounds=node.getBoundingClientRect()
            const onList=wheel.current?.contains(event.target as Node)
            // Keep the rest of a tall page scrollable; the list always responds.
            if(!onList && ((event.deltaY>0 && bounds.bottom>window.innerHeight+8)||(event.deltaY<0 && bounds.top< -8)))return
            handle(event)
        }
        node.addEventListener('wheel',listen,{passive:false})
        return ()=>node.removeEventListener('wheel',listen)
    },[advance,count,staticView])
    function endSwipe(event:React.TouchEvent<HTMLDivElement>){
        const start=touchStart.current
        touchStart.current=null
        const finger=event.changedTouches[0]
        if(!start||!finger||event.touches.length)return
        const dy=finger.clientY-start.y, dx=finger.clientX-start.x
        if(Math.abs(dy)<32||Math.abs(dy)<=Math.abs(dx))return
        ignoreClickUntil.current=Date.now()+350
        advance(dy<0?1:-1)
    }
    function navigateKey(event:React.KeyboardEvent){
        if(event.altKey||event.metaKey||event.ctrlKey||count<2)return
        const next=event.key==='ArrowRight'||event.key==='ArrowDown'
        const prev=event.key==='ArrowLeft'||event.key==='ArrowUp'
        if(!next&&!prev)return
        event.preventDefault()
        advance(next?1:-1)
    }
    return <section ref={section} aria-labelledby={headingId} className="bt-sector-wheel" style={{...style,width:'100%',background:'#000'}} onKeyDown={navigateKey}
        onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true)}} onPointerLeave={()=>setHover(false)}
        onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setFocus(false)}}>
        <link rel="stylesheet" href={fonts}/><style>{layoutCSS}</style>
        <div className="bt-shell">
            <div className="bt-main">
                <div className="bt-copy">
                    <h1 className="bt-title" id={headingId}>{title}</h1>
                    {count>0 && <><div className="bt-note" aria-live={focus?'polite':'off'} aria-atomic="true"><AnimatePresence mode="wait" initial={false}><motion.p key={current} initial={{opacity:quiet?1:0,y:quiet?0:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:quiet?0:-3}} transition={{duration:quiet?0:.18}}>{items[current].note}</motion.p></AnimatePresence></div>
                    <div className="bt-controls"><span className="bt-count" role="img" aria-label={'Service '+(current+1)+' of '+count}><Counter value={current+1} quiet={quiet}/><span className="bt-total" aria-hidden="true">/</span><span className="bt-total" aria-hidden="true">{String(count).padStart(2,'0')}</span></span>
                    {count>1&&<div className="bt-arrows"><ArrowButton next={false} press={()=>advance(-1)}/><ArrowButton next press={()=>advance(1)}/></div>}</div></>}
                </div>
                {count>0&&<div className="bt-index"><div className="bt-mask" ref={wheel} role="group" tabIndex={count>1?0:-1} aria-label="Choose a service" aria-describedby={count>1?hintId:undefined}
                    onTouchStart={event=>{const t=event.touches[0];touchStart.current=count>1&&event.touches.length===1?{x:t.clientX,y:t.clientY}:null}}
                    onTouchCancel={()=>{touchStart.current=null}} onTouchEnd={endSwipe}>
                    <div className="bt-band" aria-hidden="true"/><div className="bt-origin">
                        {items.map((item,k)=>{
                            let distance=k-current
                            if(distance>count/2)distance-=count
                            if(distance< -count/2)distance+=count
                            const a=Math.abs(distance)
                            const opacity=[1,.54,.32][a]??0
                            return <motion.button key={k} type="button" className="bt-option" tabIndex={-1} aria-pressed={a===0} aria-hidden={a>2} onClick={()=>{if(Date.now()>=ignoreClickUntil.current)setSelected(k)}} initial={false}
                                animate={{y:(distance*100)+'%',opacity,scale:a===0?1:.88}}
                                transition={{duration:quiet||a>2?0:.42,ease:[.22,1,.36,1]}}
                                style={{pointerEvents:a>2?'none':'auto'}}>{item.name}</motion.button>
                        })}
                    </div></div>
                    {count>1&&<p className="bt-hint" id={hintId}><span className="bt-mouse" aria-hidden="true"/><span className="bt-scroll">Scroll to browse services</span><span className="bt-swipe">Swipe or tap a service</span></p>}
                </div>}
            </div>
        </div>
    </section>
}
addPropertyControls(SectorWheel,{
    title:{type:ControlType.String,title:"Heading",defaultValue:defaultTitle,displayTextArea:true},
    sectors:{type:ControlType.Array,title:"Services",defaultValue:defaultSectors,control:{type:ControlType.Object,controls:{name:{type:ControlType.String,title:"Name",defaultValue:"Service"},note:{type:ControlType.String,title:"Description",displayTextArea:true,defaultValue:""}}}},
    interval:{type:ControlType.Number,title:"Interval",defaultValue:2600,min:0,max:20000,step:100,unit:"ms",description:"Set to 0 for manual navigation."},
})