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

import { useReducedMotion } from "framer-motion"

type Ticket = {
    label: string
    date: string
    month: string
    title: string
    venue: string
    time: string
    description: string
    detail: string
    cta: string
    link: string
    color: string
    ink: string
}
type Props = {
    tickets: Ticket[]
    initialOpen: number
    gap: number
    radius: number
    padding: number
    background: string
    duration: number
    titleFont?: React.CSSProperties
    detailFont?: React.CSSProperties
    style?: React.CSSProperties
}
const DEFAULT_TICKETS: Ticket[] = [
    {label:"LIVE MUSIC · 01",date:"18",month:"JUN",title:"AFTER HOURS",venue:"The Glasshouse · Berlin",time:"20:00 — 02:00",description:"An evening of sound, space and everything in between.",detail:"General admission · Doors at 19:30",cta:"Get tickets",link:"",color:"#E5FF54",ink:"#202221"},
    {label:"CREATIVE WORKSHOP · 02",date:"24",month:"JUL",title:"MADE TO MAKE",venue:"Studio North · Hamburg",time:"10:00 — 17:00",description:"A hands-on day for people who love to make things.",detail:"Limited seats · Materials included",cta:"Book a spot",link:"",color:"#C9BCFF",ink:"#222027"},
    {label:"ART & CULTURE · 03",date:"09",month:"AUG",title:"OPEN FORM",venue:"Gallery Twenty · Copenhagen",time:"18:00 — 23:00",description:"New perspectives from a new generation of artists.",detail:"Free entry · RSVP recommended",cta:"Save your place",link:"",color:"#FFB797",ink:"#28221F"},
]
const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x))
const Arrow=()=> <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1060
 * @framerIntrinsicHeight 480
 */
export default function EventTicketRevealCards(props:Props){
 const {tickets=DEFAULT_TICKETS,initialOpen=0,gap=14,radius=18,padding=12,background="#F5F5F1",duration=0.52,titleFont,detailFont,style}=props
 const safe=tickets||[]
 const [selected,setSelected]=React.useState(()=>clamp(initialOpen,0,Math.max(safe.length-1,0)))
 const staticRenderer=useIsStaticRenderer()
 const prefersReduced=useReducedMotion()
 const reduced=staticRenderer||prefersReduced
 const uid=React.useId().replace(/[^a-z0-9]/gi,"")
 React.useEffect(()=>{setSelected(i=>clamp(i,0,Math.max(safe.length-1,0)))},[safe.length])
 const smoothDuration=Math.max(0.12,duration)
 return <div data-ticket-root={uid} style={{width:"100%",height:"auto",minWidth:0,boxSizing:"border-box",background,padding:Math.max(0,padding),fontFamily:"Inter, Arial, sans-serif",...style}}>
 <style>{`
 [data-ticket-root="${uid}"] *,[data-ticket-root="${uid}"] *::before,[data-ticket-root="${uid}"] *::after { box-sizing:border-box; }
 [data-ticket-root="${uid}"] .tickets-grid {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${gap}px;align-items:start;}
 [data-ticket-root="${uid}"] .ticket-shell {min-width:0;position:relative;border-radius:${radius}px;overflow:hidden;isolation:isolate;}
 [data-ticket-root="${uid}"] .ticket-head {width:100%;padding:24px 24px 22px;display:flex;flex-direction:column;align-items:stretch;text-align:left;background:none;border:0;color:inherit;cursor:pointer;min-height:338px;position:relative;}
 [data-ticket-root="${uid}"] .ticket-date {display:flex;align-items:flex-start;gap:7px;font-weight:650;font-size:clamp(52px,6vw,88px);line-height:.86;letter-spacing:-.085em;font-variant-numeric:tabular-nums;}
 [data-ticket-root="${uid}"] .ticket-month {font-size:13px;font-weight:750;letter-spacing:-.02em;margin-top:9px;writing-mode:vertical-rl;}
 [data-ticket-root="${uid}"] .ticket-title {font-size:clamp(29px,3.1vw,47px);font-weight:750;line-height:.96;letter-spacing:-.07em;overflow-wrap:break-word;margin:0;}
 [data-ticket-root="${uid}"] .ticket-peek {font-size:13px;line-height:1.4;letter-spacing:-.015em;margin-top:15px;opacity:.78;}
 [data-ticket-root="${uid}"] .ticket-eyebrow {font-size:10px;letter-spacing:.105em;font-weight:750;text-transform:uppercase;white-space:normal;}
 [data-ticket-root="${uid}"] .ticket-cut {height:22px;display:flex;align-items:center;position:relative;}
 [data-ticket-root="${uid}"] .ticket-cut::before {content:"";position:absolute;left:0;right:0;top:50%;border-top:1px dashed currentColor;opacity:.32;}
 [data-ticket-root="${uid}"] .ticket-cut::after {content:"";position:absolute;width:18px;height:18px;border-radius:50%;background:var(--ticket-bg);left:-9px;top:2px;box-shadow:calc(100vw - 100vw + 0px) 0 transparent;}
 [data-ticket-root="${uid}"] .ticket-notch {width:18px;height:18px;border-radius:50%;background:var(--ticket-bg);position:absolute;right:-9px;top:2px;}
 [data-ticket-root="${uid}"] .ticket-bottom {padding:15px 24px 22px;min-height:64px;}
 [data-ticket-root="${uid}"] .ticket-info {font-size:13px;line-height:1.5;}
 [data-ticket-root="${uid}"] .ticket-link {display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px;margin:0 24px 15px;border-radius:9px;background:var(--ticket-ink);color:var(--ticket-color);text-decoration:none;font-size:13px;font-weight:700;min-height:46px;position:relative;z-index:1;}
 [data-ticket-root="${uid}"] .ticket-head:focus-visible,[data-ticket-root="${uid}"] .ticket-link:focus-visible,[data-ticket-root="${uid}"] .ticket-full-link:focus-visible {outline:3px solid #151515;outline-offset:-4px;}
 [data-ticket-root="${uid}"] .ticket-full-link {position:absolute;inset:0;z-index:3;display:block;border-radius:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;}
 [data-ticket-root="${uid}"] .ticket-sr-only {position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
 @container ticket-grid (max-width:750px) { [data-ticket-root="${uid}"] .tickets-grid {grid-template-columns:1fr;} [data-ticket-root="${uid}"] .ticket-head{min-height:225px;} [data-ticket-root="${uid}"] .ticket-date{font-size:64px;} [data-ticket-root="${uid}"] .ticket-title{font-size:44px;} }
 @media(prefers-reduced-motion:reduce){[data-ticket-root="${uid}"] * {scroll-behavior:auto!important;}}
 `}</style>
 <div style={{containerType:"inline-size",containerName:"ticket-grid"} as React.CSSProperties}>
 <div className="tickets-grid">
 {safe.map((ticket,i)=>{
 const open=i===selected
 const ink=ticket.ink||"#202221";const color=ticket.color||"#E5FF54";const link=(ticket.link||"").trim()
 return <article key={i} className="ticket-shell" style={{color:ink,backgroundColor:color,"--ticket-bg":background,"--ticket-ink":ink,"--ticket-color":color} as React.CSSProperties}>
 <button className="ticket-head" type="button" aria-expanded={open} aria-controls={uid+"-panel-"+i} tabIndex={open ? -1 : 0} onClick={()=>{if(!open)setSelected(i)}} style={{cursor:open?"default":"pointer"}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><span className="ticket-eyebrow">{ticket.label}</span><span style={{fontSize:18,fontWeight:400,transform:open?"rotate(-45deg)":"rotate(0deg)",transition:reduced?"none":`transform ${duration}s cubic-bezier(.22,1,.36,1)`}}>↗</span></div>
 <div style={{marginTop:32}}><div className="ticket-date"><span>{ticket.date}</span><span className="ticket-month">{ticket.month}</span></div></div>
 <div style={{flex:1,minHeight:32}}/>
 <h3 className="ticket-title" style={titleFont}>{ticket.title}</h3>
 <div className="ticket-peek">{ticket.venue}</div>
 </button>
 <div className="ticket-cut" aria-hidden="true"><div className="ticket-notch"/></div>
 <div id={uid+"-panel-"+i} style={{display:"grid",gridTemplateRows:open?"1fr":"0fr",transition:reduced?"none":`grid-template-rows ${smoothDuration}s cubic-bezier(.25,.8,.25,1)`,pointerEvents:open?"auto":"none"}} aria-hidden={!open}>
 <div style={{minHeight:0,overflow:"hidden",opacity:open?1:0,transition:reduced?"none":`opacity ${Math.min(smoothDuration * .48,.28)}s ease ${open?smoothDuration*.12:0}s`}}>
 <div className="ticket-bottom" style={detailFont}>
 <div className="ticket-info"><div style={{fontWeight:750,marginBottom:7}}>{ticket.time}</div><div style={{opacity:.76}}>{ticket.description}</div><div style={{marginTop:12,opacity:.7,fontSize:11}}>{ticket.detail}</div></div>

 </div>
 </div>
 </div>
 {link && (open
   ? <div className="ticket-link" aria-hidden="true"><span>{ticket.cta||"Learn more"}</span><Arrow/></div>
   : <a className="ticket-link" href={link} target="_blank" rel="noopener noreferrer"><span>{ticket.cta||"Learn more"}</span><Arrow/></a>
 )}
 <div style={{padding:"0 24px 17px",display:"flex",justifyContent:"space-between",fontWeight:650,fontSize:10,letterSpacing:".12em",opacity:.65}}><span>ADMIT ONE</span><span>{String(i+1).padStart(2,"0")} / {String(safe.length).padStart(2,"0")}</span></div>
 {open && link && <a className="ticket-full-link" href={link} target="_blank" rel="noopener noreferrer" aria-label={ticket.title+" — "+(ticket.cta||"Learn more")+" (opens in a new tab)"}><span className="ticket-sr-only">{ticket.cta||"Learn more"}</span></a>}
 </article>
 })}
 </div></div></div>
}
addPropertyControls(EventTicketRevealCards,{
 tickets:{type:ControlType.Array,title:"Tickets",maxCount:8,control:{type:ControlType.Object,controls:{
 label:{type:ControlType.String,title:"Category"},
 date:{type:ControlType.String,title:"Day"},
 month:{type:ControlType.String,title:"Month"},
 title:{type:ControlType.String,title:"Title"},
 venue:{type:ControlType.String,title:"Venue"},
 time:{type:ControlType.String,title:"Time"},
 description:{type:ControlType.String,title:"Description",displayTextArea:true},
 detail:{type:ControlType.String,title:"Info"},
 cta:{type:ControlType.String,title:"Button label"},
 link:{type:ControlType.Link,title:"Link",defaultValue:""},
 color:{type:ControlType.Color,title:"Ticket color"},
 ink:{type:ControlType.Color,title:"Text color"}
 }},defaultValue:DEFAULT_TICKETS},
 initialOpen:{type:ControlType.Number,title:"Open ticket",min:0,max:7,step:1,defaultValue:0},
 gap:{type:ControlType.Number,title:"Gap",min:0,max:40,defaultValue:14},
 radius:{type:ControlType.Number,title:"Radius",min:0,max:36,defaultValue:18},
 padding:{type:ControlType.Number,title:"Outer padding",min:0,max:60,defaultValue:12},
 background:{type:ControlType.Color,title:"Background",defaultValue:"#F5F5F1"},
 duration:{type:ControlType.Number,title:"Motion",min:.12,max:1.2,step:.02,defaultValue:.52},
 titleFont:{type:ControlType.Font,title:"Title font",controls:"extended"},
 detailFont:{type:ControlType.Font,title:"Details font",controls:"extended"}
})