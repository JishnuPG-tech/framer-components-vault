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
type Item = { label: string; icon: string; image?: {src:string;alt?:string}; source?:string; imageStyle?:string; iconScale?:number; link?:string; newTab?:boolean }
interface Props { items?:Item[]; brand?:string; brandLink?:string; brandNewTab?:boolean; logo?:{src:string;alt?:string}; showBrand?:boolean; labels?:string; activeItem?:number; theme?:string; colors?:any; iconSize?:number; iconStroke?:number; font?:React.CSSProperties; padding?:string; cornerRadius?:string; itemRadius?:string; gap?:string; hoverLift?:number; pressScale?:number; transition?:any; style?:React.CSSProperties }
const defaults:Item[]=[{label:"Explore",icon:"Orbit",link:"",newTab:false},{label:"Work",icon:"Stack",link:"",newTab:false},{label:"Studio",icon:"Spark",link:"",newTab:false},{label:"Contact",icon:"ArrowUpRight",link:"",newTab:false}]
const palettes:any={
Cream:{shell:"#FCFBF8",active:"#282B28",ink:"#282B28",muted:"#686B65",activeInk:"#FAFAF5",focus:"#608875",border:"#E4E3DC"},
Graphite:{shell:"#242523",active:"#EEEDE6",ink:"#F3F2EC",muted:"#BCBDB5",activeInk:"#272824",focus:"#C2D3C2",border:"#41423D"}
}
const defaultMotion={type:"spring" as const,stiffness:300,damping:32,mass:.8}
/**
 * Embedded Lucide SVG node data. No imports, runtime requests, or icon library dependency.
 * Official source: https://github.com/lucide-icons/lucide
 * Pinned revision: 500620a2e8123f8d1db191538886dc0c223f69a9
 * Documentation: https://lucide.dev/guide/react
 * License source: https://raw.githubusercontent.com/lucide-icons/lucide/500620a2e8123f8d1db191538886dc0c223f69a9/LICENSE
 * The SVG geometry below is unmodified; attribute names use React SVG casing.
 * Preserve this complete license notice when copying the bundle into another file.
 *
 * ISC License
 *
 * Copyright (c) 2026 Lucide Icons and Contributors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * ---
 *
 * The following Lucide icons are derived from the Feather project:
 *
 * airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out
 *
 * The MIT License (MIT) (for the icons listed above)
 *
 * Copyright (c) 2013-present Cole Bemis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

type LucideNodeTag = "path" | "circle" | "ellipse" | "line" | "polyline" | "polygon" | "rect"
type LucideSvgNode = readonly [LucideNodeTag, Readonly<Record<string, string>>]

/** Apply these attributes to the outer SVG, plus aria-hidden/focusable as appropriate. */
const lucideSvgDefaults = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
} as const

/** Existing MorphingDockNavbar names are retained so saved selections migrate without remapping. */
const lucideIcons: Readonly<Record<string, readonly LucideSvgNode[]>> = {
    "Home": [
        [
            "path",
            {
                "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
            }
        ],
        [
            "path",
            {
                "d": "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            }
        ]
    ],
    "Grid": [
        [
            "rect",
            {
                "width": "7",
                "height": "7",
                "x": "3",
                "y": "3",
                "rx": "1"
            }
        ],
        [
            "rect",
            {
                "width": "7",
                "height": "7",
                "x": "14",
                "y": "3",
                "rx": "1"
            }
        ],
        [
            "rect",
            {
                "width": "7",
                "height": "7",
                "x": "14",
                "y": "14",
                "rx": "1"
            }
        ],
        [
            "rect",
            {
                "width": "7",
                "height": "7",
                "x": "3",
                "y": "14",
                "rx": "1"
            }
        ]
    ],
    "Person": [
        [
            "circle",
            {
                "cx": "12",
                "cy": "8",
                "r": "5"
            }
        ],
        [
            "path",
            {
                "d": "M20 21a8 8 0 0 0-16 0"
            }
        ]
    ],
    "Mail": [
        [
            "path",
            {
                "d": "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"
            }
        ],
        [
            "rect",
            {
                "x": "2",
                "y": "4",
                "width": "20",
                "height": "16",
                "rx": "2"
            }
        ]
    ],
    "Briefcase": [
        [
            "path",
            {
                "d": "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
            }
        ],
        [
            "rect",
            {
                "width": "20",
                "height": "14",
                "x": "2",
                "y": "6",
                "rx": "2"
            }
        ]
    ],
    "Folder": [
        [
            "path",
            {
                "d": "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
            }
        ]
    ],
    "Star": [
        [
            "path",
            {
                "d": "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
            }
        ]
    ],
    "Heart": [
        [
            "path",
            {
                "d": "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
            }
        ]
    ],
    "Search": [
        [
            "path",
            {
                "d": "m21 21-4.34-4.34"
            }
        ],
        [
            "circle",
            {
                "cx": "11",
                "cy": "11",
                "r": "8"
            }
        ]
    ],
    "Settings": [
        [
            "path",
            {
                "d": "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
            }
        ],
        [
            "circle",
            {
                "cx": "12",
                "cy": "12",
                "r": "3"
            }
        ]
    ],
    "Bell": [
        [
            "path",
            {
                "d": "M10.268 21a2 2 0 0 0 3.464 0"
            }
        ],
        [
            "path",
            {
                "d": "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
            }
        ]
    ],
    "Calendar": [
        [
            "path",
            {
                "d": "M8 2v3"
            }
        ],
        [
            "path",
            {
                "d": "M16 2v3"
            }
        ],
        [
            "rect",
            {
                "x": "3",
                "y": "3",
                "width": "18",
                "height": "18",
                "rx": "2"
            }
        ],
        [
            "path",
            {
                "d": "M3 9h18"
            }
        ]
    ],
    "Compass": [
        [
            "circle",
            {
                "cx": "12",
                "cy": "12",
                "r": "10"
            }
        ],
        [
            "path",
            {
                "d": "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"
            }
        ]
    ],
    "Bookmark": [
        [
            "path",
            {
                "d": "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"
            }
        ]
    ],
    "ShoppingBag": [
        [
            "path",
            {
                "d": "M16 10a4 4 0 0 1-8 0"
            }
        ],
        [
            "path",
            {
                "d": "M3.103 6.034h17.794"
            }
        ],
        [
            "path",
            {
                "d": "M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"
            }
        ]
    ],
    "Chart": [
        [
            "path",
            {
                "d": "M3 3v16a2 2 0 0 0 2 2h16"
            }
        ],
        [
            "path",
            {
                "d": "M18 17V9"
            }
        ],
        [
            "path",
            {
                "d": "M13 17V5"
            }
        ],
        [
            "path",
            {
                "d": "M8 17v-3"
            }
        ]
    ],
    "Globe": [
        [
            "circle",
            {
                "cx": "12",
                "cy": "12",
                "r": "10"
            }
        ],
        [
            "path",
            {
                "d": "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"
            }
        ],
        [
            "path",
            {
                "d": "M2 12h20"
            }
        ]
    ],
    "Camera": [
        [
            "path",
            {
                "d": "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"
            }
        ],
        [
            "circle",
            {
                "cx": "12",
                "cy": "13",
                "r": "3"
            }
        ]
    ],
    "Music": [
        [
            "path",
            {
                "d": "M9 18V5l12-2v13"
            }
        ],
        [
            "circle",
            {
                "cx": "6",
                "cy": "18",
                "r": "3"
            }
        ],
        [
            "circle",
            {
                "cx": "18",
                "cy": "16",
                "r": "3"
            }
        ]
    ],
    "FileText": [
        [
            "path",
            {
                "d": "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
            }
        ],
        [
            "path",
            {
                "d": "M14 2v5a1 1 0 0 0 1 1h5"
            }
        ],
        [
            "path",
            {
                "d": "M10 9H8"
            }
        ],
        [
            "path",
            {
                "d": "M16 13H8"
            }
        ],
        [
            "path",
            {
                "d": "M16 17H8"
            }
        ]
    ],
    "MessageCircle": [
        [
            "path",
            {
                "d": "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
            }
        ]
    ],
    "Plus": [
        [
            "path",
            {
                "d": "M5 12h14"
            }
        ],
        [
            "path",
            {
                "d": "M12 5v14"
            }
        ]
    ]
}

const lucideIconNames = [
    "Home",
    "Grid",
    "Person",
    "Mail",
    "Briefcase",
    "Folder",
    "Star",
    "Heart",
    "Search",
    "Settings",
    "Bell",
    "Calendar",
    "Compass",
    "Bookmark",
    "ShoppingBag",
    "Chart",
    "Globe",
    "Camera",
    "Music",
    "FileText",
    "MessageCircle",
    "Plus"
] as const
type LucideIconName = typeof lucideIconNames[number]

/** Label-to-canonical-name mapping for provenance and documentation. */
const lucideCanonicalNames = {
    "Home": "house",
    "Grid": "layout-grid",
    "Person": "user-round",
    "Mail": "mail",
    "Briefcase": "briefcase",
    "Folder": "folder",
    "Star": "star",
    "Heart": "heart",
    "Search": "search",
    "Settings": "settings",
    "Bell": "bell",
    "Calendar": "calendar",
    "Compass": "compass",
    "Bookmark": "bookmark",
    "ShoppingBag": "shopping-bag",
    "Chart": "chart-column",
    "Globe": "globe",
    "Camera": "camera",
    "Music": "music",
    "FileText": "file-text",
    "MessageCircle": "message-circle",
    "Plus": "plus"
} as const

const lucideSourceRevision = "500620a2e8123f8d1db191538886dc0c223f69a9"

const contourIcons:any={
 Orbit:[["circle",{cx:12,cy:12,r:8.5,fill:"currentColor",fillOpacity:.08}],["path",{d:"m15.7 8.3-2.2 5.2-5.2 2.2 2.2-5.2z",fill:"currentColor",fillOpacity:.22}]],
 Stack:[["rect",{x:7,y:3,width:14,height:14,rx:3,fill:"currentColor",fillOpacity:.14}],["path",{d:"M16 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h1"}],["path",{d:"M11 8h6M11 12h4"}]],
 Spark:[["path",{d:"M12 2.5c1.2 5.6 3.9 8.3 9.5 9.5-5.6 1.2-8.3 3.9-9.5 9.5C10.8 15.9 8.1 13.2 2.5 12 8.1 10.8 10.8 8.1 12 2.5Z",fill:"currentColor",fillOpacity:.14}]],
 ArrowUpRight:[["rect",{x:3,y:3,width:18,height:18,rx:6,fill:"currentColor",fillOpacity:.08}],["path",{d:"M8 16 16 8M8 8h8v8"}]]
}

function Glyph({ item, size, stroke }: { item: Item; size: number; stroke: number }) {
    const upload = item.source === "Upload" || item.icon === "Custom"
    const iconSize = Math.min(32, size * Math.max(.5, Math.min(1.5, item.iconScale ?? 1)))
    if (upload && item.image?.src) {
        if (item.imageStyle === "Monochrome") return <span aria-hidden="true" style={{ width: iconSize, height: iconSize, display: "block", background: "currentColor", maskImage: `url(${JSON.stringify(item.image.src)})`, WebkitMaskImage: `url(${JSON.stringify(item.image.src)})`, maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}/>
        return <img src={item.image.src} alt="" draggable={false} style={{ width: iconSize, height: iconSize, objectFit: "contain", display: "block" }}/>
    }
    return <svg aria-hidden="true" focusable="false" width={iconSize} height={iconSize} {...lucideSvgDefaults} strokeWidth={stroke}>{(contourIcons[item.icon] || lucideIcons[item.icon] || lucideIcons.Grid).map(([tag, attributes], i) => React.createElement(tag, { ...attributes, key: i }))}</svg>
}

/**
 * Contour Dock adapts Matthias's Morphing Dock Navbar icon system and navigation interactions.
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 64
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function ContourDock(props:Props){
 const {items=defaults,brand="Design Supply",brandLink="",brandNewTab=false,showBrand=false,logo,activeItem=1,theme="Graphite",colors={},iconSize=20,iconStroke=1.6,font={},padding="7px",cornerRadius="21px",itemRadius="14px",gap="4px",hoverLift=0,labels="Active",pressScale=.97,transition=defaultMotion,style}=props
 const list=Array.isArray(items)&&items.length?items.slice(0,6):defaults
 const clamp=(n:number)=>Math.max(0,Math.min(list.length-1,Number.isFinite(n)?n:0))
 const safe=clamp(activeItem-1)
 const [selected,setSelected]=React.useState(safe)
 const [hovered,setHovered]=React.useState<number|null>(null)
 const [focused,setFocused]=React.useState<number|null>(null)
 const [compact,setCompact]=React.useState(false)
 const [rect,setRect]=React.useState({x:0,y:0,w:0,h:0})
 const root=React.useRef<HTMLDivElement>(null)
 const nav=React.useRef<HTMLDivElement>(null)
 const refs=React.useRef<(HTMLAnchorElement|HTMLButtonElement|null)[]>([])
 const staticRender=useIsStaticRenderer()
 const reduce=!!useReducedMotion()
 const unique=React.useId().replace(/:/g,"")
 const current=staticRender?safe:clamp(hovered??focused??selected)
 const palette=theme==="Custom"?{...palettes.Cream,...colors}:palettes[theme]||palettes.Cream
 React.useEffect(()=>setSelected(safe),[safe])
 React.useEffect(()=>{
   const el=root.current;if(!el)return
   const measure=()=>setCompact(el.clientWidth<(showBrand?490:370))
   measure();const observer=new ResizeObserver(measure);observer.observe(el)
   return()=>observer.disconnect()
 },[showBrand])
 React.useLayoutEffect(()=>{
  const el=refs.current[current],parent=nav.current;if(!el||!parent)return
  const measure=()=>{const r={x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight};setRect(prev=>Object.keys(r).some(k=>r[k]!==prev[k])?r:prev)}
  measure();const observer=new ResizeObserver(measure);observer.observe(parent);observer.observe(el)
  return()=>observer.disconnect()
 },[current,compact,list.length,brand,showBrand,font,padding,gap])
 function keyDown(e:React.KeyboardEvent,i:number){
  let next=i
  if(e.key==="ArrowRight")next=(i+1)%list.length
  else if(e.key==="ArrowLeft")next=(i-1+list.length)%list.length
  else if(e.key==="Home")next=0
  else if(e.key==="End")next=list.length-1
  else if(e.key==="Escape"){setHovered(null);return}
  else return
  e.preventDefault();refs.current[next]?.focus()
 }
 const fontStyle:React.CSSProperties={fontFamily:"Manrope, sans-serif",fontSize:13,fontWeight:600,letterSpacing:"-.025em",lineHeight:"1.25em",...font}
 const BrandTag=brandLink?"a":"div"
 return <div ref={root} className={`contour-${unique}`} style={{position:"relative",boxSizing:"border-box",...style}}>
 <style>{`
 .contour-${unique} a,.contour-${unique} button{-webkit-tap-highlight-color:transparent;}
 .contour-${unique} .contour-link:focus-visible,.contour-${unique} .contour-brand:focus-visible{outline:2px solid ${palette.focus};outline-offset:3px;}
 .contour-${unique} .contour-link:focus:not(:focus-visible){outline:none;}
 @media(forced-colors:active){.contour-${unique} .contour-link{border:1px solid ButtonText!important;color:ButtonText!important;}}
 `}</style>
 <nav aria-label={showBrand?brand||"Main navigation":"Main navigation"} style={{display:"flex",flexDirection:compact?"column":"row",alignItems:"stretch",gap:compact?7:10,padding,boxSizing:"border-box",borderRadius:cornerRadius,border:`1px solid ${palette.border}`,background:palette.shell,backgroundImage:"linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,0) 75%)",boxShadow:"0 1px 2px rgba(16,24,20,.12), 0 8px 16px -8px rgba(16,24,20,.22), 0 24px 42px -20px rgba(16,24,20,.30), inset 0 1px 0 rgba(255,255,255,.09)"}}>
 {showBrand&&<BrandTag className="contour-brand" {...(brandLink?{href:brandLink,target:brandNewTab?"_blank":undefined,rel:brandNewTab?"noopener noreferrer":undefined}:{})} style={{display:"flex",alignItems:"center",justifyContent:compact?"center":"flex-start",gap:10,flexShrink:0,padding:compact?"9px 12px 5px":"0 20px 0 13px",color:palette.ink,textDecoration:"none",borderRadius:8,minWidth:0,maxWidth:compact?"100%":"38%",...fontStyle,fontSize:13,fontWeight:500}}>
 {logo?.src?<img src={logo.src} alt="" draggable={false} style={{width:20,height:20,objectFit:"contain",flexShrink:0}}/>:<svg aria-hidden="true" width="21" height="22" viewBox="0 0 21 22" fill="none" style={{flexShrink:0}}><path d="M2 6h11v14H2zM8 2h11v14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 10h3v6H6z" fill="currentColor"/></svg>}
 <span style={{overflowWrap:"anywhere"}}>{brand}</span>
 </BrandTag>}
 {!compact&&showBrand&&<span aria-hidden="true" style={{alignSelf:"center",height:20,width:1,background:palette.border,flexShrink:0}}/>}
 <div ref={nav} onPointerLeave={()=>setHovered(null)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setFocused(null)}} style={{position:"relative",display:"grid",gridTemplateColumns:`repeat(${compact&&list.length>4?Math.ceil(list.length/2):list.length},minmax(0,1fr))`,gap,flex:1,minWidth:0}}>
 {rect.w>0&&!staticRender&&<motion.div aria-hidden="true" initial={false} animate={{x:rect.x,y:rect.y,width:rect.w,height:rect.h}} transition={reduce?{duration:0}:transition} style={{position:"absolute",left:0,top:0,borderRadius:itemRadius,background:palette.active,pointerEvents:"none",boxShadow:"0 1px 2px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.24)"}}/>}
 {list.map((item,i)=>{
 const Tag=item.link?motion.a:motion.button
 const selectedItem=i===clamp(selected)
 const reveal=compact||labels==="Always"||i===current
 return <Tag key={i} className="contour-link" ref={(el:any)=>{refs.current[i]=el}}
 {...(item.link?{href:item.link,target:item.newTab?"_blank":undefined,rel:item.newTab?"noopener noreferrer":undefined,"aria-current":selectedItem?"page":undefined}:{type:"button","aria-pressed":selectedItem})}
 aria-label={item.label||`Page ${i+1}`}
 onPointerEnter={e=>{if(e.pointerType!=="touch")setHovered(i)}}
 onPointerDown={()=>setFocused(null)}
 onFocus={e=>{if(e.currentTarget.matches(":focus-visible")){setFocused(i);setHovered(null)}}}
 onKeyDown={e=>keyDown(e,i)}
 onClick={e=>{if(!e.metaKey&&!e.ctrlKey)setSelected(i)}}
 whileTap={reduce?undefined:{scale:pressScale}} transition={reduce?{duration:0}:{duration:.18}}
 style={{position:"relative",display:"flex",flexDirection:compact?"column":"row",gap:compact?5:0,alignItems:"center",justifyContent:"center",padding:compact?"10px 2px":"12px 4px",minWidth:0,minHeight:compact?60:48,background:staticRender&&i===safe?palette.active:"transparent",border:0,borderRadius:itemRadius,textDecoration:"none",cursor:"pointer",userSelect:"none",touchAction:"manipulation",color:i===current?palette.activeInk:palette.muted,...fontStyle,transition:"color .2s ease",boxSizing:"border-box"}}>
 <motion.span animate={{y:!reduce&&i===hovered?-hoverLift:0}} transition={reduce?{duration:0}:transition} style={{display:"flex",flexShrink:0,pointerEvents:"none"}}><Glyph item={item} size={iconSize} stroke={iconStroke}/></motion.span>
 <motion.span aria-hidden="true" initial={false} animate={{width:reveal?"auto":0,opacity:reveal?1:0,marginLeft:reveal&&!compact?6:0}} transition={reduce||staticRender?{duration:0}:{duration:.28,ease:[.22,1,.36,1]}} style={{display:"block",maxWidth:compact?"100%":"calc(100% - 22px)",overflow:"hidden",pointerEvents:"none",whiteSpace:"nowrap",textOverflow:"ellipsis",fontSize:"inherit"}}>{item.label}</motion.span>
 </Tag>
 })}
 </div></nav></div>
}
ContourDock.displayName="Contour Dock"
addPropertyControls(ContourDock,{
 brand:{type:ControlType.String,title:"Brand",defaultValue:"Design Supply"},
 showBrand:{type:ControlType.Boolean,title:"Show Brand",defaultValue:false},
 logo:{type:ControlType.ResponsiveImage,title:"Logo",hidden:p=>!p.showBrand},
 brandLink:{type:ControlType.Link,title:"Brand Link",defaultValue:"",hidden:p=>!p.showBrand},
 brandNewTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false,hidden:p=>!p.showBrand},
 items:{type:ControlType.Array,title:"Items",maxCount:6,defaultValue:defaults,control:{type:ControlType.Object,controls:{
 label:{type:ControlType.String,title:"Label",defaultValue:"Page"},
 source:{type:ControlType.Enum,title:"Icon Source",options:["Library","Upload"],defaultValue:"Library"},
 icon:{type:ControlType.Enum,title:"Icon",options:["Orbit","Stack","Spark","ArrowUpRight",...lucideIconNames],defaultValue:"Grid",hidden:p=>p.source==="Upload"},
 image:{type:ControlType.ResponsiveImage,title:"Image",hidden:p=>p.source!=="Upload"},
 imageStyle:{type:ControlType.Enum,title:"Image Style",options:["Original","Monochrome"],defaultValue:"Original",hidden:p=>p.source!=="Upload"},
 iconScale:{type:ControlType.Number,title:"Icon Scale",defaultValue:1,min:.5,max:1.5,step:.05},
 link:{type:ControlType.Link,title:"Link",defaultValue:""},
 newTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false}
 }}},
 activeItem:{type:ControlType.Number,title:"Active Item",defaultValue:1,min:1,max:6,step:1},
 theme:{type:ControlType.Enum,title:"Theme",options:["Cream","Graphite","Custom"],defaultValue:"Graphite"},
 labels:{type:ControlType.Enum,title:"Labels",options:["Active","Always"],defaultValue:"Active"},
 colors:{type:ControlType.Object,title:"Colors",hidden:p=>p.theme!=="Custom",controls:Object.fromEntries(Object.entries(palettes.Cream).map(([key,value])=>[key,{type:ControlType.Color,title:key[0].toUpperCase()+key.slice(1),defaultValue:String(value)}]))},
 iconSize:{type:ControlType.Number,title:"Icon Size",defaultValue:20,min:16,max:30,unit:"px"},
 iconStroke:{type:ControlType.Number,title:"Icon Stroke",defaultValue:1.6,min:1,max:3,step:.25},
 font:{type:ControlType.Font,title:"Font",controls:"extended",defaultFontType:"sans-serif",defaultValue:{fontSize:"13px",variant:"Semibold",lineHeight:"1.25em",letterSpacing:"-.02em"}},
 padding:{type:ControlType.Padding,title:"Padding",defaultValue:"7px"},
 cornerRadius:{type:ControlType.BorderRadius,title:"Shell Radius",defaultValue:"21px"},
 itemRadius:{type:ControlType.BorderRadius,title:"Item Radius",defaultValue:"14px"},
 gap:{type:ControlType.Gap,title:"Gap",defaultValue:"4px"},
 hoverLift:{type:ControlType.Number,title:"Hover Lift",defaultValue:0,min:0,max:6,unit:"px"},
 pressScale:{type:ControlType.Number,title:"Press Scale",defaultValue:.97,min:.9,max:1,step:.01},
 transition:{type:ControlType.Transition,title:"Motion",defaultValue:defaultMotion,description:"Made by Design Supply  \n[Explore more components](https://dub.sh/dsw13)"}
})
