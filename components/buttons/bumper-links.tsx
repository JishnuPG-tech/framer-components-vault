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


type BumperLink = {
    href: string
    image?: string
    alt?: string
}
type Point = { x: number; y: number }
type Size = { width: number; height: number }
type ItemLayout = Size & {
    collider: "box" | "circle"
}

type Layout = Size & {
    items: ItemLayout[]
}
type Body = Point &
    Size & {
        hx: number
        hy: number
        collider: "box" | "circle"
        radius: number
        vx: number
        vy: number
        angle: number
        angularVelocity: number
        heading: number
        target: Point
        turn: number
        nextTurn: number
        nextIdle: number
        idleUntil: number
        bumpUntil: number
        rejoin: number
        locked: boolean
    }
type Hold = { hover: boolean; focus: boolean; pressed: boolean }
type Settings = {
    speed: number
    wander: number
    cursorResponse: number
    bounce: number
}
type WallImpact = {
    nx: number
    ny: number
    strength: number
    position: number
}
type Props = Partial<Settings> & {
    links?: BumperLink[]

    itemSize?: number
    autoDrive?: boolean

    arenaImage?: string
    arenaFit?: "cover" | "contain"
    arenaRadius?: number
    arenaReactive?: boolean

    style?: React.CSSProperties
}

const svgDataUri = (svg: string) =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
const PHONE_SVG = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="57" height="57" viewBox="0 0 512 512" role="img" aria-label="Phone, imagined as an early iOS skeuomorphic icon">
  <defs>
    <linearGradient id="g" x2="0" y2="1"><stop stop-color="#9af282"/><stop offset=".46" stop-color="#36bd42"/><stop offset="1" stop-color="#08731d"/></linearGradient>
    <linearGradient id="edge" x2="0" y2="1"><stop stop-color="#e3ffd9"/><stop offset=".45" stop-color="#55c85c"/><stop offset="1" stop-color="#075c18"/></linearGradient>
    <linearGradient id="ivory" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".55" stop-color="#fafcf5"/><stop offset="1" stop-color="#cbd6c8"/></linearGradient>
    <filter id="s" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="11"/><feOffset dy="15" result="o"/><feColorMatrix in="o" values="0 0 0 0 0 0 0 0 0 .18 0 0 0 0 .02 0 0 0 .7 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="c"><rect x="25" y="25" width="462" height="462" rx="98"/></clipPath>
  </defs>
  <rect x="14" y="14" width="484" height="484" rx="110" fill="url(#edge)" stroke="#075719" stroke-width="8"/>
  <rect x="26" y="26" width="460" height="460" rx="96" fill="url(#g)"/>
  <g clip-path="url(#c)"><path d="M25 25h462v210c-93-43-196-55-304-28-62 15-113 10-158-17z" fill="#fff" opacity=".25"/><ellipse cx="177" cy="88" rx="121" ry="38" fill="#fff" opacity=".16"/></g>
  <path d="M155 106c19-8 43 0 53 18l45 81c9 17 6 37-8 50l-35 31c21 45 54 79 100 101l32-35c13-14 34-17 50-8l80 45c19 10 27 34 18 53l-16 34c-9 19-29 31-50 29-178-17-320-159-337-337-2-21 10-41 29-50z" fill="#034d12" opacity=".38" transform="translate(0 13)"/>
  <path d="M155 94c19-8 43 0 53 18l45 81c9 17 6 37-8 50l-35 31c21 45 54 79 100 101l32-35c13-14 34-17 50-8l80 45c19 10 27 34 18 53l-16 34c-9 19-29 31-50 29-178-17-320-159-337-337-2-21 10-41 29-50z" fill="url(#ivory)" stroke="#d5e7d4" stroke-width="5" filter="url(#s)"/>
  <path d="M141 112c13-5 29 1 36 13l43 76c5 9 3 21-5 28l-29 26" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".85"/>
  <path d="M367 370l78 43c10 6 14 18 9 29" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7"/>
</svg>
`)
const MESSAGE_SVG = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="57" height="57" viewBox="0 0 512 512" role="img" aria-label="WhatsApp, imagined as an early iOS skeuomorphic icon">
  <defs>
    <linearGradient id="g" x2="0" y2="1"><stop stop-color="#72eb9a"/><stop offset=".48" stop-color="#13b967"/><stop offset="1" stop-color="#04733e"/></linearGradient>
    <linearGradient id="rim" x2="0" y2="1"><stop stop-color="#c9f7d9"/><stop offset=".42" stop-color="#20bd6d"/><stop offset="1" stop-color="#034f2d"/></linearGradient>
    <radialGradient id="bubble"><stop stop-color="#fff"/><stop offset=".72" stop-color="#f6fff9"/><stop offset="1" stop-color="#ccebd7"/></radialGradient>
    <filter id="drop" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="10"/><feOffset dy="13" result="o"/><feColorMatrix in="o" values="0 0 0 0 0 0 0 0 0 .2 0 0 0 0 .1 0 0 0 .7 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="inner"><feGaussianBlur in="SourceAlpha" stdDeviation="10" result="b"/><feOffset dy="8"/><feComposite in2="b" operator="out"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 .15 0 0 0 0 .05 0 0 0 .8 0"/><feComposite in2="SourceGraphic" operator="over"/></filter>
    <clipPath id="c"><rect x="25" y="25" width="462" height="462" rx="98"/></clipPath>
  </defs>
  <rect x="14" y="14" width="484" height="484" rx="110" fill="url(#rim)" stroke="#034c2b" stroke-width="8"/>
  <rect x="26" y="26" width="460" height="460" rx="96" fill="url(#g)" filter="url(#inner)"/>
  <g clip-path="url(#c)"><path d="M25 25h462v203c-96-38-200-45-310-17-59 15-108 8-152-23z" fill="#fff" opacity=".24"/><path d="M34 60c114-36 243-27 388 16-148-14-268 15-377 76z" fill="#fff" opacity=".12"/></g>
  <path d="M256 111c-85 0-154 64-154 143 0 29 9 56 25 79l-25 82 87-23c21 11 44 17 67 17 85 0 154-64 154-143S341 111 256 111z" fill="#004d2d" opacity=".45" transform="translate(0 11)"/>
  <path d="M256 103c-85 0-154 64-154 143 0 29 9 56 25 79l-25 82 87-23c21 11 44 17 67 17 85 0 154-64 154-143S341 103 256 103z" fill="url(#bubble)" stroke="#eafff0" stroke-width="7" filter="url(#drop)"/>
  <path d="M199 165c-9 0-20 6-27 18-7 12-26 37-26 71 0 34 27 67 31 72 4 5 53 82 130 112 64 25 77 20 91 18 14-2 45-18 51-35 6-17 6-31 4-34-2-3-7-5-15-9l-54-25c-7-3-13-5-18 4l-20 25c-4 5-9 6-17 2-8-4-34-12-64-39-24-21-40-47-45-55-5-8 0-12 4-16l12-14c4-5 5-9 8-15 3-6 1-11-1-15l-25-59c-6-16-13-16-19-16z" fill="#087746"/>
  <path d="M199 159c-9 0-20 6-27 18-7 12-26 37-26 71 0 34 27 67 31 72 4 5 53 82 130 112 64 25 77 20 91 18 14-2 45-18 51-35 6-17 6-31 4-34-2-3-7-5-15-9l-54-25c-7-3-13-5-18 4l-20 25c-4 5-9 6-17 2-8-4-34-12-64-39-24-21-40-47-45-55-5-8 0-12 4-16l12-14c4-5 5-9 8-15 3-6 1-11-1-15l-25-59c-6-16-13-16-19-16z" fill="#22b96b" stroke="#087746" stroke-width="4"/>
</svg>

`)
const MAIL_SVG = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="57" height="57" viewBox="0 0 512 512" role="img" aria-label="Mail, imagined as an early iOS skeuomorphic icon">
  <defs>
    <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#2c9be3"/><stop offset=".56" stop-color="#77c7f2"/><stop offset="1" stop-color="#d8f1ff"/></linearGradient>
    <linearGradient id="edge" x2="0" y2="1"><stop stop-color="#d7f2ff"/><stop offset=".5" stop-color="#52aee2"/><stop offset="1" stop-color="#1d6094"/></linearGradient>
    <linearGradient id="paper" x2="0" y2="1"><stop stop-color="#fffef7"/><stop offset="1" stop-color="#d7d4c5"/></linearGradient>
    <linearGradient id="flap" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#ddd9c8"/></linearGradient>
    <filter id="s" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="11"/><feOffset dy="14" result="o"/><feColorMatrix in="o" values="0 0 0 0 0 0 0 0 0 .12 0 0 0 0 .25 0 0 0 .65 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="c"><rect x="25" y="25" width="462" height="462" rx="98"/></clipPath>
  </defs>
  <rect x="14" y="14" width="484" height="484" rx="110" fill="url(#edge)" stroke="#155a89" stroke-width="8"/>
  <rect x="26" y="26" width="460" height="460" rx="96" fill="url(#sky)"/>
  <g clip-path="url(#c)">
    <path d="M20 275c36-60 86-68 127-45 20-54 97-64 129-13 50-42 141-6 154 58 38-1 69 24 75 62H15z" fill="#fff" opacity=".9"/>
    <path d="M26 25h460v192c-103-44-209-54-316-21-53 16-101 11-144-14z" fill="#fff" opacity=".18"/>
    <ellipse cx="169" cy="95" rx="120" ry="34" fill="#fff" opacity=".18"/>
  </g>
  <g filter="url(#s)">
    <path d="M85 201h342c13 0 24 11 24 24v192c0 13-11 24-24 24H85c-13 0-24-11-24-24V225c0-13 11-24 24-24z" fill="url(#paper)" stroke="#8f938e" stroke-width="6"/>
    <path d="M67 218l189 128 189-128" fill="#f4f2e8" stroke="#a9aaa3" stroke-width="6" stroke-linejoin="round"/>
    <path d="M65 427l132-131 59 40 59-40 132 131" fill="url(#flap)" stroke="#aaa99f" stroke-width="5" stroke-linejoin="round"/>
    <path d="M80 213l176 119 176-119" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="4"/>
  </g>
</svg>
`)
const IG_SVG = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="57" height="57" viewBox="0 0 512 512" role="img" aria-label="Instagram, imagined as an early iOS skeuomorphic icon">
  <defs>
    <linearGradient id="leather" x2="0" y2="1"><stop stop-color="#9a6a45"/><stop offset=".5" stop-color="#70452b"/><stop offset="1" stop-color="#3d2418"/></linearGradient>
    <linearGradient id="metal" x2="0" y2="1"><stop stop-color="#f1eee5"/><stop offset=".2" stop-color="#8d918f"/><stop offset=".42" stop-color="#eeeadd"/><stop offset=".72" stop-color="#656a68"/><stop offset="1" stop-color="#d9d5c9"/></linearGradient>
    <radialGradient id="lens"><stop stop-color="#79d9e6"/><stop offset=".2" stop-color="#183a4c"/><stop offset=".55" stop-color="#09151e"/><stop offset=".78" stop-color="#326c79"/><stop offset="1" stop-color="#05090d"/></radialGradient>
    <radialGradient id="glass" cx="35%" cy="28%"><stop stop-color="#b7ffff" stop-opacity=".85"/><stop offset=".2" stop-color="#3c9cae" stop-opacity=".45"/><stop offset=".55" stop-color="#06131c" stop-opacity="0"/></radialGradient>
    <filter id="d" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="10"/><feOffset dy="13" result="o"/><feColorMatrix in="o" values="0 0 0 0 0 0 0 0 0 .03 0 0 0 0 0 0 0 0 .75 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="grain" width="17" height="17" patternUnits="userSpaceOnUse"><path d="M1 4c5-5 9 6 15 1M2 14c4-4 8 3 13-1" fill="none" stroke="#fff" stroke-opacity=".055" stroke-width="2"/></pattern>
    <clipPath id="c"><rect x="24" y="24" width="464" height="464" rx="100"/></clipPath>
  </defs>
  <rect x="14" y="14" width="484" height="484" rx="110" fill="url(#metal)" stroke="#3c3028" stroke-width="8"/>
  <rect x="27" y="27" width="458" height="458" rx="94" fill="url(#leather)" stroke="#bc8c65" stroke-width="3"/>
  <g clip-path="url(#c)"><rect x="25" y="25" width="462" height="462" fill="url(#grain)"/><path d="M26 27h460v156H26z" fill="#d9d3c1"/><path d="M26 152h460v31H26z" fill="url(#metal)"/><path d="M48 48h416v75H48z" rx="18" fill="#312b27"/><path d="M58 58h396v19H58z" rx="9" fill="#fff" opacity=".2"/></g>
  <g filter="url(#d)">
    <circle cx="256" cy="307" r="137" fill="#171719" stroke="url(#metal)" stroke-width="27"/>
    <circle cx="256" cy="307" r="104" fill="url(#lens)" stroke="#0d1113" stroke-width="13"/>
    <circle cx="256" cy="307" r="84" fill="url(#glass)"/>
    <circle cx="256" cy="307" r="54" fill="none" stroke="#51a8b8" stroke-opacity=".28" stroke-width="9"/>
    <ellipse cx="222" cy="268" rx="28" ry="17" fill="#d7ffff" opacity=".65" transform="rotate(-32 222 268)"/>
  </g>
  <rect x="335" y="57" width="101" height="70" rx="15" fill="#252421" stroke="url(#metal)" stroke-width="9"/>
  <circle cx="386" cy="92" r="22" fill="#6baca4" stroke="#1c3634" stroke-width="6"/><circle cx="379" cy="84" r="8" fill="#e9ffff" opacity=".7"/>
  <path d="M84 115h157" stroke="#b74a34" stroke-width="14"/><path d="M84 115h52" stroke="#e7c24c" stroke-width="14"/><path d="M136 115h54" stroke="#5fa078" stroke-width="14"/>
</svg>
`)
const X_SVG = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="57" height="57" viewBox="0 0 512 512" role="img" aria-label="Twitter, imagined as an early iOS skeuomorphic icon">
  <defs>
    <linearGradient id="bg" x2="0" y2="1"><stop stop-color="#8ee6ff"/><stop offset=".5" stop-color="#25aee8"/><stop offset="1" stop-color="#0878ba"/></linearGradient>
    <linearGradient id="rim" x2="0" y2="1"><stop stop-color="#d8f7ff"/><stop offset=".45" stop-color="#49bde8"/><stop offset="1" stop-color="#075c98"/></linearGradient>
    <linearGradient id="bird" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".55" stop-color="#f7fbff"/><stop offset="1" stop-color="#c9e5ef"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="10" result="b"/><feOffset dy="12" result="o"/><feColorMatrix in="o" values="0 0 0 0 0 0 0 0 0 .15 0 0 0 0 .25 0 0 0 .65 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="inset"><feGaussianBlur stdDeviation="7" result="b"/><feComposite in="SourceGraphic" in2="b" operator="out" result="i"/><feFlood flood-color="#003d68" flood-opacity=".65"/><feComposite in2="i" operator="in"/><feComposite in2="SourceGraphic" operator="over"/></filter>
    <clipPath id="clip"><rect x="18" y="18" width="476" height="476" rx="104"/></clipPath>
  </defs>
  <rect x="14" y="14" width="484" height="484" rx="110" fill="url(#rim)" stroke="#075681" stroke-width="8"/>
  <rect x="26" y="26" width="460" height="460" rx="96" fill="url(#bg)" filter="url(#inset)"/>
  <g clip-path="url(#clip)"><path d="M22 36h468v203c-85-38-180-52-280-37-80 12-139 2-188-29z" fill="#fff" opacity=".25"/><path d="M38 70c91-38 222-34 362 4-130-10-242 11-347 70z" fill="#fff" opacity=".12"/></g>
  <path d="M394 155c-13 8-27 13-42 16-13-15-31-24-51-24-38 0-69 31-69 69 0 5 1 11 2 16-57-3-108-30-142-72-6 10-9 22-9 35 0 24 12 45 31 57-11 0-22-3-31-8v1c0 34 24 62 56 68-6 2-12 3-18 3-5 0-9 0-13-1 9 28 35 48 66 48-24 19-55 30-89 30-6 0-12 0-17-1 32 20 69 32 109 32 131 0 203-109 203-203v-9c14-10 26-22 35-36-13 6-26 9-40 11 14-9 25-22 31-39-13 8-28 14-43 17 13-14 20-31 20-50 0-2 0-3-1-4z" fill="#073d5c" opacity=".35" transform="translate(0 12)"/>
  <path d="M394 143c-13 8-27 13-42 16-13-15-31-24-51-24-38 0-69 31-69 69 0 5 1 11 2 16-57-3-108-30-142-72-6 10-9 22-9 35 0 24 12 45 31 57-11 0-22-3-31-8v1c0 34 24 62 56 68-6 2-12 3-18 3-5 0-9 0-13-1 9 28 35 48 66 48-24 19-55 30-89 30-6 0-12 0-17-1 32 20 69 32 109 32 131 0 203-109 203-203v-9c14-10 26-22 35-36-13 6-26 9-40 11 14-9 25-22 31-39-13 8-28 14-43 17 13-14 20-31 20-50 0-2 0-3-1-4z" fill="url(#bird)" stroke="#d4edf5" stroke-width="4" filter="url(#shadow)"/>
  <ellipse cx="183" cy="83" rx="119" ry="35" fill="#fff" opacity=".2"/>
</svg>
`)

const DEFAULT_LINKS: BumperLink[] = [
    {
        image: PHONE_SVG,
        href: "#",
        alt: "Phone",
    },
    {
        image: MESSAGE_SVG,
        href: "#",
        alt: "Message",
    },
    {
        image: MAIL_SVG,
        href: "#",
        alt: "Mail",
    },
    {
        image: IG_SVG,
        href: "#",
        alt: "Instagram",
    },
    {
        image: X_SVG,
        href: "#",
        alt: "Twitter",
    },
]

const fallbackImageFor = (link: BumperLink) => {
    switch (link.alt) {
        case "Phone":
            return PHONE_SVG
        case "Message":
            return MESSAGE_SVG
        case "Mail":
            return MAIL_SVG
        case "Instagram":
            return IG_SVG
        case "Twitter":
            return X_SVG
        default:
            return ""
    }
}

const RAD = Math.PI / 180
const MAX_ANGLE = 12 * RAD
const GAP = 14
const IMPACT_BOOST = 1.15
const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v))

const angleDelta = (from: number, to: number) => {
    let delta = (to - from) % (Math.PI * 2)

    if (delta > Math.PI) delta -= Math.PI * 2
    if (delta < -Math.PI) delta += Math.PI * 2

    return delta
}
const value = (v: number, fallback: number, lo: number, hi: number) =>
    clamp(Number.isFinite(v) ? v : fallback, lo, hi)
const hash = (seed: number) => {
    const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453
    return n - Math.floor(n)
}

function extents(size: Size) {
    const xAngle = Math.min(MAX_ANGLE, Math.atan2(size.height, size.width))
    const yAngle = Math.min(MAX_ANGLE, Math.atan2(size.width, size.height))
    return {
        hx:
            (size.width * Math.cos(xAngle) + size.height * Math.sin(xAngle)) /
                2 +
            3,
        hy:
            (size.height * Math.cos(yAngle) + size.width * Math.sin(yAngle)) /
                2 +
            3,
    }
}

function park(layout: Layout): Body[] | null {
    const sizes = layout.items.map((size) => {
        if (size.collider === "circle") {
            const radius = Math.min(size.width, size.height) * 0.52

            return {
                ...size,
                hx: radius,
                hy: radius,
                radius,
            }
        }

        return {
            ...size,
            ...extents(size),
            radius: 0,
        }
    })
    const rows: number[][] = [[]]
    const totalWidth =
        sizes.reduce((sum, size) => sum + size.hx * 2, 0) +
        GAP * Math.max(0, sizes.length - 1)

    const columns =
        totalWidth <= layout.width - GAP * 2
            ? sizes.length
            : Math.ceil(Math.sqrt(sizes.length))
    let used = 0
    for (let i = 0; i < sizes.length; i++) {
        if (sizes[i].hx * 2 > layout.width - GAP * 2) return null
        let row = rows[rows.length - 1]
        if (
            row.length &&
            (row.length >= columns ||
                used + GAP + sizes[i].hx * 2 > layout.width - GAP * 2)
        ) {
            rows.push([])
            row = rows[rows.length - 1]
            used = 0
        }
        row.push(i)
        used += sizes[i].hx * 2 + (row.length > 1 ? GAP : 0)
    }
    const heights = rows.map((row) =>
        Math.max(...row.map((i) => sizes[i].hy * 2))
    )
    const availableHeight = layout.height - heights.reduce((a, b) => a + b, 0)

    if (availableHeight < 0) return null

    const verticalGap = Math.max(2, availableHeight / (rows.length + 1))
    const bodies: Body[] = []
    let y = verticalGap
    rows.forEach((row, r) => {
        const horizontalGap =
            (layout.width - row.reduce((sum, i) => sum + sizes[i].hx * 2, 0)) /
            (row.length + 1)
        let x = horizontalGap
        row.forEach((i) => {
            const size = sizes[i]
            bodies[i] = {
                ...size,
                x: x + size.hx,
                y: y + heights[r] / 2,
                vx: 0,
                vy: 0,
                angle: (-4 + hash(i * 17 + 3) * 8) * RAD,
                angularVelocity: 0,
                heading: (-4 + hash(i * 17 + 3) * 8) * RAD,
                target: {
                    x: layout.width * (i % 2 ? 0.24 : 0.76),
                    y: layout.height * (i % 3 ? 0.3 : 0.7),
                },
                turn: 0,
                nextTurn: 8 + i * 0.7,
                nextIdle: 12 + i * 3.7,
                idleUntil: 0,
                bumpUntil: 0,
                rejoin: 0,
                locked: false,
            }
            x += size.hx * 2 + horizontalGap
        })
        y += heights[r] + verticalGap
    })
    return bodies
}

function destination(body: Body, layout: Layout, x: number, y: number): Point {
    return {
        x: clamp(x, body.hx + GAP, layout.width - body.hx - GAP),
        y: clamp(y, body.hy + GAP, layout.height - body.hy - GAP),
    }
}

function collide(
    a: Body,
    b: Body,
    restitution: number,
    time: number,
    layout: Layout,
    driving: boolean
) {
    const dx = b.x - a.x,
        dy = b.y - a.y
    if (a.collider === "circle" && b.collider === "circle") {
        const distance = Math.hypot(dx, dy)
        const minDistance = a.radius + b.radius

        if (distance >= minDistance || (a.locked && b.locked)) return

        const safeDistance = Math.max(distance, 0.001)
        const nx = dx / safeDistance
        const ny = dy / safeDistance

        const ia = a.locked ? 0 : 1
        const ib = b.locked ? 0 : 1
        const total = ia + ib

        if (!total) return

        const overlap = minDistance - distance + 0.02

        a.x -= (nx * overlap * ia) / total
        a.y -= (ny * overlap * ia) / total
        b.x += (nx * overlap * ib) / total
        b.y += (ny * overlap * ib) / total

        const incoming = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny

        if (incoming < 0) {
            const impulse =
                ((-(1 + restitution) * incoming) / total) * IMPACT_BOOST

            a.vx -= impulse * nx * ia
            a.vy -= impulse * ny * ia

            b.vx += impulse * nx * ib
            b.vy += impulse * ny * ib

            const tangentX = -ny
            const tangentY = nx

            const tangential =
                (b.vx - a.vx) * tangentX + (b.vy - a.vy) * tangentY

            const spin = clamp(tangential * 0.008, -0.65, 0.65)

            a.angularVelocity -= spin * ia
            b.angularVelocity += spin * ib
        }

        if (driving) {
            for (const [body, sign] of [
                [a, -1],
                [b, 1],
            ] as const) {
                if (body.locked || time < body.bumpUntil) continue

                body.target = destination(
                    body,
                    layout,
                    body.x + sign * nx * 160,
                    body.y + sign * ny * 160
                )

                body.heading = Math.atan2(
                    body.target.y - body.y,
                    body.target.x - body.x
                )

                body.nextTurn = time + 2.4
                body.bumpUntil = time + 0.38
            }
        }

        return
    }
    const ox = a.hx + b.hx - Math.abs(dx),
        oy = a.hy + b.hy - Math.abs(dy)
    if (ox <= 0 || oy <= 0 || (a.locked && b.locked)) return
    const horizontal = ox < oy
    const nx = horizontal ? (dx >= 0 ? 1 : -1) : 0
    const ny = horizontal ? 0 : dy >= 0 ? 1 : -1
    const ia = a.locked ? 0 : 1,
        ib = b.locked ? 0 : 1,
        total = ia + ib
    const overlap = (horizontal ? ox : oy) + 0.02
    a.x -= (nx * overlap * ia) / total
    a.y -= (ny * overlap * ia) / total
    b.x += (nx * overlap * ib) / total
    b.y += (ny * overlap * ib) / total
    const incoming = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
    if (incoming < 0) {
        const impulse = ((-(1 + restitution) * incoming) / total) * IMPACT_BOOST
        a.vx -= impulse * nx * ia
        a.vy -= impulse * ny * ia
        b.vx += impulse * nx * ib
        b.vy += impulse * ny * ib
        const offset = horizontal ? dy / (a.hy + b.hy) : -dx / (a.hx + b.hx)
        const spin = clamp(
            impulse * (Math.abs(offset) > 0.1 ? offset : 0.3) * 0.018,
            -0.65,
            0.65
        )
        a.angularVelocity -= spin * ia
        b.angularVelocity += spin * ib
    }
    if (driving)
        for (const [body, sign] of [
            [a, -1],
            [b, 1],
        ] as const) {
            if (body.locked || time < body.bumpUntil) continue
            body.target = destination(
                body,
                layout,
                body.x + sign * (nx * 160 + ny * 65),
                body.y + sign * (ny * 160 - nx * 65)
            )

            body.heading = Math.atan2(
                body.target.y - body.y,
                body.target.x - body.x
            )

            body.nextTurn = time + 2.4
            body.bumpUntil = time + 0.38
        }
}

function walls(
    body: Body,
    layout: Layout,
    restitution: number,
    onImpact?: (impact: WallImpact) => void
) {
    if (body.locked) return
    const left = body.hx + 6,
        right = layout.width - body.hx - 6
    const top = body.hy + 6,
        bottom = layout.height - body.hy - 6
    let hit = 0
    if (body.x < left) {
        body.x = left

        if (body.vx < 0) {
            hit = -body.vx
            body.vx *= -restitution

            onImpact?.({
                nx: 1,
                ny: 0,
                strength: hit,
                position: clamp(body.y / layout.height, 0, 1),
            })
        }
    }
    if (body.x > right) {
        body.x = right

        if (body.vx > 0) {
            hit = body.vx
            body.vx *= -restitution

            onImpact?.({
                nx: -1,
                ny: 0,
                strength: hit,
                position: clamp(body.y / layout.height, 0, 1),
            })
        }
    }
    if (body.y < top) {
        body.y = top

        if (body.vy < 0) {
            hit = -body.vy
            body.vy *= -restitution

            onImpact?.({
                nx: 0,
                ny: 1,
                strength: hit,
                position: clamp(body.x / layout.width, 0, 1),
            })
        }
    }
    if (body.y > bottom) {
        body.y = bottom

        if (body.vy > 0) {
            hit = body.vy
            body.vy *= -restitution

            onImpact?.({
                nx: 0,
                ny: -1,
                strength: hit,
                position: clamp(body.x / layout.width, 0, 1),
            })
        }
    }
    if (hit)
        body.angularVelocity +=
            clamp(hit * 0.008, 0, 0.3) * (body.x < layout.width / 2 ? 1 : -1)
}

function advance(
    bodies: Body[],
    layout: Layout,
    dt: number,
    time: number,
    driving: boolean,
    settings: Settings,
    pointer: Point | null,
    onWallImpact?: (impact: WallImpact) => void
) {
    const steps = Math.max(1, Math.ceil(dt * 120)),
        h = dt / steps
    const cruise = 80 * settings.speed,
        restitution = 0.25 + settings.bounce * 0.5
    for (let step = 0; step < steps; step++) {
        bodies.forEach((body, i) => {
            if (body.locked) return
            body.rejoin += (1 - body.rejoin) * (1 - Math.exp(-2 * h))
            if (driving && time >= body.nextIdle) {
                body.idleUntil = time + 1.1 + hash(i + body.turn) * 1.2
                body.nextIdle = time + 18 + hash(i * 7 + body.turn) * 10
            }
            if (driving && time >= body.nextTurn) {
                body.turn++
                body.target = destination(
                    body,
                    layout,
                    layout.width * hash(i * 23 + body.turn * 11),
                    layout.height * hash(i * 19 + body.turn * 17)
                )
                body.nextTurn = time + 5 + hash(i + body.turn * 7) * 5
            }
            let desiredX = 0,
                desiredY = 0
            const recovering = time < body.bumpUntil
            const moving = driving && time >= body.idleUntil && !recovering
            if (recovering) {
                const impactDrag = Math.exp(-4.5 * h)

                body.vx *= impactDrag
                body.vy *= impactDrag
            }
            if (moving) {
                const dx = body.target.x - body.x,
                    dy = body.target.y - body.y

                body.heading = Math.atan2(dy, dx)

                const distance = Math.max(1, Math.hypot(dx, dy))
                const velocity = Math.max(1, Math.hypot(body.vx, body.vy))
                const mix = 0.35 + settings.wander * 0.65
                let sx =
                    (dx / distance) * mix + (body.vx / velocity) * (1 - mix)
                let sy =
                    (dy / distance) * mix + (body.vy / velocity) * (1 - mix)
                let calm = 1
                for (const other of bodies) {
                    if (!other.locked || other === body) continue
                    const px =
                        body.x -
                        clamp(
                            body.x,
                            other.x - other.hx - body.hx,
                            other.x + other.hx + body.hx
                        )
                    const py =
                        body.y -
                        clamp(
                            body.y,
                            other.y - other.hy - body.hy,
                            other.y + other.hy + body.hy
                        )
                    const d = Math.hypot(px, py)
                    if (d > 0 && d < 72) {
                        const near = 1 - d / 72
                        sx += (px / d) * near * 3
                        sy += (py / d) * near * 3
                        calm = Math.min(calm, 0.15 + 0.85 * clamp(d / 35, 0, 1))
                    }
                }
                if (pointer) {
                    const px = pointer.x - body.x,
                        py = pointer.y - body.y,
                        d = Math.hypot(px, py)
                    if (d > 0.1 && d < 190) {
                        const close = Math.min(
                            100,
                            Math.hypot(body.hx, body.hy) + 28
                        )
                        const strength =
                            d < close
                                ? -0.8 * (1 - d / close)
                                : 0.22 *
                                  Math.sin(
                                      (Math.PI * (d - close)) / (190 - close)
                                  )
                        sx += (px / d) * strength * settings.cursorResponse
                        sy += (py / d) * strength * settings.cursorResponse
                    }
                }
                const length = Math.max(0.1, Math.hypot(sx, sy))
                const pace =
                    cruise * body.rejoin * calm * clamp(distance / 32, 0.25, 1)
                desiredX = (sx / length) * pace
                desiredY = (sy / length) * pace
            }
            const blend = recovering ? 0 : 1 - Math.exp(-(moving ? 1.7 : 7) * h)
            body.vx += (desiredX - body.vx) * blend
            body.vy += (desiredY - body.vy) * blend
            body.x += body.vx * h
            body.y += body.vy * h
        })

        for (let pass = 0; pass < 6; pass++) {
            for (let i = 0; i < bodies.length; i++)
                for (let j = i + 1; j < bodies.length; j++)
                    collide(
                        bodies[i],
                        bodies[j],
                        restitution,
                        time,
                        layout,
                        driving
                    )
            for (const body of bodies) {
                walls(body, layout, restitution, onWallImpact)
            }
        }
        for (const body of bodies) {
            if (body.locked) continue
            const speed = Math.hypot(body.vx, body.vy),
                cap = cruise * 1.5

            const recovering = time < body.bumpUntil

            if (speed > cap) {
                body.vx *= cap / speed
                body.vy *= cap / speed
            }
            if (!driving && speed < 0.2) {
                body.vx = 0
                body.vy = 0
            }
            if (driving && !recovering) {
                const turnError = angleDelta(body.angle, body.heading)

                body.angularVelocity +=
                    (turnError * 7.5 - body.angularVelocity * 4.2) * h
            } else {
                body.angularVelocity *= Math.exp(-2.5 * h)
            }
            body.angularVelocity = clamp(body.angularVelocity, -0.8, 0.8)
            body.angle += body.angularVelocity * h

            if (!driving && Math.abs(body.angularVelocity) < 0.001)
                body.angularVelocity = 0
        }
    }
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 380
 */
export default function BumperLinks({
    links = DEFAULT_LINKS,

    itemSize = 48,
    autoDrive = true,
    speed = 1.7,
    wander = 0.65,
    cursorResponse = 0.6,
    bounce = 0.6,

    arenaImage,
    arenaFit = "cover",
    arenaRadius = 16,
    arenaReactive = true,

    style,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const arenaRef = React.useRef<HTMLElement>(null)
    const inView = React.useRef(true)

    const nodes = React.useRef<(HTMLAnchorElement | null)[]>([])
    const visualNodes = React.useRef<(HTMLElement | null)[]>([])
    const bodies = React.useRef<Body[]>([])
    const holds = React.useRef<Hold[]>([])
    const pointer = React.useRef<Point | null>(null)
    const time = React.useRef(0)
    const arenaVisualRef = React.useRef<HTMLDivElement>(null)

    const arenaMotion = React.useRef({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        angularVelocity: 0,
    })
    const [reduced, setReduced] = React.useState(true)
    const [driving, setDriving] = React.useState(autoDrive)
    const [layout, setLayout] = React.useState<Layout | null>(null)

    const content = React.useMemo(() => {
        return (Array.isArray(links) ? links : DEFAULT_LINKS)
            .filter(Boolean)
            .slice(0, 12)
    }, [links])

    const settings = React.useMemo<Settings>(
        () => ({
            speed: value(speed, 1, 0.25, 2),
            wander: value(wander, 0.65, 0, 1),
            cursorResponse: value(cursorResponse, 0.6, 0, 1),
            bounce: value(bounce, 0.6, 0, 1),
        }),
        [speed, wander, cursorResponse, bounce]
    )
    const bumperSize = value(itemSize, 48, 24, 96)
    const parked = React.useMemo(
        () =>
            layout && layout.items.length === content.length
                ? park(layout)
                : null,
        [layout, content.length]
    )
    const fixed = isStatic || reduced
    const rendered =
        fixed || bodies.current.length !== content.length
            ? parked
            : bodies.current

    React.useEffect(() => {
        setDriving(autoDrive)
    }, [autoDrive])
    React.useEffect(() => {
        if (isStatic) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [isStatic])

    React.useEffect(() => {
        const arena = arenaRef.current
        if (!arena) return
        const measure = () => {
            const items = content.map((_, i) => ({
                width: visualNodes.current[i]?.offsetWidth || 0,
                height: visualNodes.current[i]?.offsetHeight || 0,
                collider: "circle" as const,
            }))
            if (
                !arena.clientWidth ||
                !arena.clientHeight ||
                items.some((item) => !item.width || !item.height)
            )
                return
            const next = {
                width: arena.clientWidth,
                height: arena.clientHeight,
                items,
            }
            setLayout((old) =>
                JSON.stringify(old) === JSON.stringify(next) ? old : next
            )
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(arena)
        content.forEach((_, i) => {
            const node = visualNodes.current[i]
            if (node) observer.observe(node)
        })
        return () => observer.disconnect()
    }, [content])

    React.useEffect(() => {
        bodies.current = parked?.map((body) => ({ ...body })) || []
        holds.current = content.map((_, i) => ({
            hover: false,
            pressed: false,
            focus:
                !fixed &&
                nodes.current[i] ===
                    nodes.current[i]?.ownerDocument.activeElement,
        }))
        bodies.current.forEach((body, i) => {
            body.locked = holds.current[i].focus
        })
        time.current = 0
        pointer.current = null
    }, [parked, fixed, content])

    React.useEffect(() => {
        if (isStatic || !layout || !parked) return

        const hitArena = (impact: WallImpact) => {
            if (!arenaReactive || !arenaImage) return

            const motion = arenaMotion.current
            const force = clamp(impact.strength / 48, 0, 1.5)

            motion.vx += -impact.nx * force * 42
            motion.vy += -impact.ny * force * 42

            const offCenter = impact.position - 0.5

            motion.angularVelocity +=
                offCenter * force * (Math.abs(impact.nx) > 0 ? -1 : 1) * 0.09
        }
        const paint = () =>
            bodies.current.forEach((body, i) => {
                const node = nodes.current[i]
                if (node)
                    node.style.transform = `translate3d(${body.x - body.width / 2}px, ${body.y - body.height / 2}px, 0) rotate(${body.angle / RAD}deg)`
            })
        paint()
        if (reduced) return
        let frame = 0,
            last: number | null = null,
            disposed = false
        const needsFrame = () =>
            driving ||
            bodies.current.some(
                (body) =>
                    !body.locked &&
                    (body.vx !== 0 ||
                        body.vy !== 0 ||
                        body.angularVelocity !== 0)
            )
        if (!needsFrame()) return
        const tick = (now: number) => {
            frame = 0
            if (disposed || document.hidden || !inView.current) return
            const dt = last === null ? 0 : clamp((now - last) / 1000, 0, 0.05)
            last = now
            if (driving) time.current += dt
            advance(
                bodies.current,
                layout,
                dt,
                time.current,
                driving,
                settings,
                pointer.current,
                hitArena
            )
            if (arenaImage && arenaReactive) {
                const motion = arenaMotion.current

                const spring = 85
                const damping = 13

                motion.vx += (-motion.x * spring - motion.vx * damping) * dt

                motion.vy += (-motion.y * spring - motion.vy * damping) * dt

                motion.angularVelocity +=
                    (-motion.angle * 100 - motion.angularVelocity * 15) * dt

                motion.x += motion.vx * dt
                motion.y += motion.vy * dt
                motion.angle += motion.angularVelocity * dt

                const arena = arenaVisualRef.current

                if (arena) {
                    arena.style.transform =
                        `translate3d(${motion.x}px, ${motion.y}px, 0) ` +
                        `rotate(${motion.angle}rad)`
                }
            }

            paint()
            if (inView.current && !document.hidden && needsFrame()) {
                frame = requestAnimationFrame(tick)
            }
        }

        const arena = arenaRef.current

        const observer = new IntersectionObserver(
            ([entry]) => {
                inView.current = entry.isIntersecting

                if (!entry.isIntersecting) {
                    if (frame) cancelAnimationFrame(frame)
                    frame = 0
                    last = null
                    pointer.current = null
                    return
                }

                if (!document.hidden && !frame && needsFrame()) {
                    frame = requestAnimationFrame(tick)
                }
            },
            {
                root: null,
                rootMargin: "200px",
                threshold: 0,
            }
        )

        if (arena) observer.observe(arena)

        const visibility = () => {
            if (frame) cancelAnimationFrame(frame)
            frame = 0
            last = null
            pointer.current = null
            if (!document.hidden && inView.current && needsFrame())
                frame = requestAnimationFrame(tick)
        }
        document.addEventListener("visibilitychange", visibility)
        if (!document.hidden && inView.current && needsFrame()) {
            frame = requestAnimationFrame(tick)
        }
        return () => {
            disposed = true

            observer.disconnect()

            if (frame) cancelAnimationFrame(frame)

            document.removeEventListener("visibilitychange", visibility)
        }
    }, [
        isStatic,
        reduced,
        fixed,
        driving,
        layout,
        parked,
        settings,
        arenaImage,
        arenaReactive,
    ])

    const hold = (index: number, key: keyof Hold, active: boolean) => {
        const flags = holds.current[index],
            body = bodies.current[index]
        if (!flags || !body || fixed) return
        flags[key] = active
        body.locked = flags.hover || flags.focus || flags.pressed
        if (body.locked) {
            body.vx = 0
            body.vy = 0
            body.angularVelocity = 0
            body.rejoin = 0
        }
    }
    const interaction = (i: number) =>
        fixed
            ? {}
            : {
                  onPointerEnter: (event: React.PointerEvent) => {
                      if (event.pointerType !== "touch") hold(i, "hover", true)
                  },
                  onPointerLeave: () => {
                      hold(i, "hover", false)
                      hold(i, "pressed", false)
                  },
                  onPointerDown: () => hold(i, "pressed", true),
                  onPointerUp: () => hold(i, "pressed", false),
                  onPointerCancel: () => hold(i, "pressed", false),
                  onLostPointerCapture: () => hold(i, "pressed", false),
                  onFocus: () => hold(i, "focus", true),
                  onBlur: () => hold(i, "focus", false),
              }

    return (
        <div
            className="pgu-bumper-links"
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                minWidth: 0,
                minHeight: 0,
                background: "transparent",
                ...style,
            }}
        >
            <style>{`
    .pgu-bumper-links a {
        display: block;
        box-sizing: border-box;
        color: inherit;
        background: transparent;
        text-decoration: none;
         padding: 0;
    min-height: 0;
        max-width: calc(100% - 40px);
        line-height: 1.3;
        font-weight: 500;
        letter-spacing: .03em;
        text-align: center;
        overflow-wrap: anywhere;
        transform-origin: center;
    }

    .pgu-bumper-links a::before {
    content: "";
    position: absolute;
    inset: -10px -12px;
}

.pgu-bumper-links .bumper-car {
    position: relative;
    display: block;
}

.pgu-bumper-links .bumper-chassis {
    position: absolute;
    inset: 2px;
    border-radius: 13px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(0, 0, 0, 0.16);
    box-shadow:
        0 3px 5px rgba(0, 0, 0, 0.18),
        0 1px 1px rgba(0, 0, 0, 0.12);
    transform: translateY(3px);
}

.pgu-bumper-links img {
    position: relative;
z-index: 1;
    display: block;
    width: 100%;
    height: 100%; 
    object-fit: contain;
    pointer-events: none;
    user-select: none;
}

.pgu-bumper-links a.is-image {
    padding: 0;
    min-height: 0;
    max-width: none;
}

    .pgu-bumper-links a:hover {
        text-decoration: underline;
        text-underline-offset: 5px;
    }

    .pgu-bumper-links a:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 3px;
        border-radius: 2px;
    }
`}</style>
            {arenaImage && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 6,
                        borderRadius: arenaRadius,
                        overflow: "hidden",
                        pointerEvents: "none",
                        zIndex: 0,

                        boxSizing: "border-box",
                        border: "6px solid rgba(24, 24, 24, 0.88)",
                        boxShadow: `
    inset 0 1px 0 rgba(255,255,255,0.22),
    inset 0 -2px 3px rgba(0,0,0,0.32),
    0 1px 0 rgba(255,255,255,0.10),
    0 5px 12px rgba(0,0,0,0.18)
`,
                    }}
                >
                    <div
                        ref={arenaVisualRef}
                        style={{
                            position: "absolute",
                            inset: -12,
                            transformOrigin: "center",
                            willChange: arenaReactive ? "transform" : undefined,
                        }}
                    >
                        <img
                            src={arenaImage}
                            alt=""
                            draggable={false}
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "block",
                                objectFit: arenaFit,
                                userSelect: "none",
                            }}
                        />
                    </div>
                </div>
            )}

            <nav
                ref={arenaRef}
                aria-label="Bumper links"
                onPointerMove={
                    !fixed && driving && parked && settings.cursorResponse > 0
                        ? (event) => {
                              if (event.pointerType !== "mouse" || !layout)
                                  return
                              const bounds =
                                  event.currentTarget.getBoundingClientRect()
                              if (bounds.width && bounds.height)
                                  pointer.current = {
                                      x:
                                          ((event.clientX - bounds.left) *
                                              layout.width) /
                                          bounds.width,
                                      y:
                                          ((event.clientY - bounds.top) *
                                              layout.height) /
                                          bounds.height,
                                  }
                          }
                        : undefined
                }
                onPointerLeave={
                    fixed
                        ? undefined
                        : () => {
                              pointer.current = null
                          }
                }
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    alignContent: parked ? "space-around" : "flex-start",
                    justifyContent: "space-around",
                    alignItems: "center",
                    gap: parked ? 0 : 14,
                    overflow: parked ? "visible" : "auto",
                }}
            >
                {content.map((link, i) => {
                    const body = parked ? rendered?.[i] || parked[i] : null
                    return (
                        <a
                            key={i}
                            ref={(node) => {
                                nodes.current[i] = node
                            }}
                            data-bumper-item={i}
                            href={
                                typeof link.href === "string" &&
                                link.href.trim()
                                    ? link.href
                                    : undefined
                            }
                            {...interaction(i)}
                            style={
                                body
                                    ? {
                                          position: "absolute",
                                          left: 0,
                                          top: 0,
                                          transform: `translate3d(${body.x - body.width / 2}px, ${body.y - body.height / 2}px, 0) rotate(${body.angle / RAD}deg)`,
                                          willChange:
                                              !fixed && driving
                                                  ? "transform"
                                                  : undefined,
                                      }
                                    : { position: "relative" }
                            }
                        >
                            <span
                                className="bumper-car"
                                ref={(node) => {
                                    visualNodes.current[i] = node
                                }}
                                style={{
                                    width: bumperSize,
                                    height: bumperSize,
                                }}
                            >
                                <span
                                    className="bumper-chassis"
                                    aria-hidden="true"
                                />

                                <img
                                    src={link.image || fallbackImageFor(link)}
                                    alt={link.alt || ""}
                                    draggable={false}
                                />
                            </span>
                        </a>
                    )
                })}
            </nav>
        </div>
    )
}

addPropertyControls(BumperLinks, {
    links: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 12,
        defaultValue: [
            {
                alt: "Phone",
                href: "",
            },
            {
                alt: "Message",
                href: "",
            },
            {
                alt: "Mail",
                href: "",
            },
            {
                alt: "Instagram",
                href: "",
            },
            {
                alt: "Twitter",
                href: "",
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },

                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                },

                href: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
    },

    itemSize: {
        type: ControlType.Number,
        title: "Item Size",
        min: 24,
        max: 96,
        step: 1,
        defaultValue: 48,
        unit: "px",
    },
    autoDrive: {
        type: ControlType.Boolean,
        title: "Auto Drive",
        defaultValue: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.25,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    wander: {
        type: ControlType.Number,
        title: "Wander",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.65,
    },
    cursorResponse: {
        type: ControlType.Number,
        title: "Cursor Response",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.6,
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.6,
    },

    arenaImage: {
        type: ControlType.Image,
        title: "Arena",
    },

    arenaFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        hidden: (props) => !props.arenaImage,
    },

    arenaRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 16,
        unit: "px",
        hidden: (props) => !props.arenaImage,
    },

    arenaReactive: {
        type: ControlType.Boolean,
        title: "Reactive",
        defaultValue: true,
        hidden: (props) => !props.arenaImage,
    },
})
