// Flowing Gallery v1.0 (KOJA Studios, 13.11.2026; until 14.11.2026 working title Parting Wall). Many photos hang in calm rows that drift slowly against
// each other. Where the pointer goes, the wall opens: one photo grows, its neighbours step aside in order and a label
// names it. A click brings the photo to the middle, the wall stays visible behind a light veil.
// One large surface: when the focus moves on, the surface stays, its picture cross-fades and its size and place morph.
// Every motion is a spring on a target, so any input can interrupt or reverse it.
// Own code (feel probe of 13.11.2026). Behaviour reference "Moments" (motionin.design) watched from outside only.
// Demo photos: Unsplash License, photographers in build-notes.md.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"

// ------------------------------------------------------------------ props

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}
interface FontValue {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
    fontSize?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
}
interface ItemProps {
    image?: ImageValue
    alt?: string
    title?: string
    subtitle?: string
    link?: string
}
type Shadow = "none" | "soft" | "deep"
type ButtonStyle = "fill" | "line" | "link"
type Touch = "preview" | "open"
interface Props {
    images?: ItemProps[]
    onClick?: () => void
    wall?: { rows?: number; drift?: number; gap?: number; radius?: string; shadow?: Shadow; color?: string }
    openView?: { title?: FontValue; titleColor?: string; subtitle?: FontValue; subColor?: string; veil?: string }
    button?: { show?: boolean; text?: string; style?: ButtonStyle; color?: string; textColor?: string; radius?: string }
    behavior?: { hoverSize?: number; touch?: Touch }
    labels?: { name?: string; close?: string; previous?: string; next?: string }
    /** set by Framer: the layout of this instance (size, position); passed on to the root unchanged (FP-7) */
    style?: CSSProperties
}

// From 15 rows the wall drops below about 50 fps on a four times throttled CPU (20 rows: under 30).
const MAX_ROWS = 14

const DEFAULTS = {
    rows: 11,
    drift: 6,
    gap: 6,
    radius: "4px",
    shadow: "soft" as Shadow,
    color: "#FFFFFF",
    titleColor: "#1F1C18",
    subColor: "#6E675E",
    veil: "rgba(239, 235, 228, 0.62)",
    buttonText: "Request a print",
    buttonColor: "#1F1C18",
    buttonTextColor: "#EFEBE4",
    buttonRadius: "4px",
    hoverSize: 300,
    touch: "preview" as Touch,
}
const MAX_IMAGES = 120

// ------------------------------------------------------------------ demo

interface Demo {
    n: string
    w: number
    h: number
    title: string
    subtitle: string
    alt: string
}
/** the demo while the list is empty: photos in Framer's storage (the address is completed from n in demoSrc) */
const DEMO: Demo[] = [
    // DEMO-START
    { n: "404", w: 2000, h: 1414, title: "Color Steps", subtitle: "Mexico City · 2023", alt: "Stepped walls in crimson, orange and turquoise against a blue sky" },
    { n: "262", w: 2000, h: 1333, title: "Dune Sun", subtitle: "Erg Chebbi · 2022", alt: "Sand dunes with footprints under a hazy sun" },
    { n: "057", w: 2000, h: 1765, title: "Yellow Chair", subtitle: "Antwerp · 2024", alt: "Mustard armchair beside a black door in a white room" },
    { n: "272", w: 2000, h: 3000, title: "Mara", subtitle: "Lisbon · 2025", alt: "Portrait of a woman in a white collar against a red wall" },
    { n: "402", w: 2000, h: 2709, title: "Glazed Vessels", subtitle: "Studio · 2024", alt: "Rows of matte vases in mustard, pink and bottle green" },
    { n: "012", w: 2000, h: 1334, title: "Mist", subtitle: "Black Forest · 2021", alt: "Pine forest fading into white mist" },
    { n: "405", w: 2000, h: 3000, title: "Terraces", subtitle: "Bali · 2024", alt: "Red concrete balconies with hammocks under a strong blue sky" },
    { n: "286", w: 2000, h: 1339, title: "Sage Wall", subtitle: "Ghent · 2025", alt: "Black floor lamp in front of a sage green wall" },
    { n: "265", w: 2000, h: 1333, title: "Swell", subtitle: "Biscay · 2022", alt: "Close view of a dark blue ocean swell" },
    { n: "237", w: 2000, h: 1198, title: "At the Wheel", subtitle: "Oaxaca · 2023", alt: "Hands shaping clay on a potter's wheel" },
    { n: "406", w: 2000, h: 2666, title: "Rust Facade", subtitle: "Rotterdam · 2022", alt: "A rust brown panel facade with irregular windows" },
    { n: "256", w: 2000, h: 1000, title: "Plateau", subtitle: "Utah · 2021", alt: "Eroded gray badlands under a fiery sunset sky" },
    { n: "215", w: 2000, h: 3000, title: "Floating Stairs", subtitle: "Basel · 2024", alt: "Timber stairs with a thin black rail in a white house" },
    { n: "236", w: 2000, h: 1745, title: "Dry Stems", subtitle: "Arles · 2023", alt: "Clay vase with dried stems casting shadows on a warm wall" },
    { n: "276", w: 2000, h: 3000, title: "Jonas", subtitle: "Berlin · 2025", alt: "Portrait of a bearded man in a knit sweater on a dark background" },
    { n: "263", w: 2000, h: 1333, title: "Above Cloud", subtitle: "Dolomites · 2020", alt: "Sea of clouds below dark pines under an orange evening sky" },
    { n: "058", w: 2000, h: 1333, title: "Green Sofa", subtitle: "Madrid · 2024", alt: "Dark green sofa against a pale pink wall" },
    { n: "204", w: 2000, h: 1333, title: "Fins", subtitle: "Melbourne · 2023", alt: "Close view of angled metal fins on a facade" },
    { n: "305", w: 2000, h: 1333, title: "Night Fern", subtitle: "Studio · 2024", alt: "Dark leaves lit magenta against a deep blue backdrop" },
    { n: "246", w: 2000, h: 1333, title: "Lake Fog", subtitle: "Bled · 2021", alt: "Fog over a still lake and a dark tree line" },
    { n: "219", w: 2000, h: 1333, title: "Night Lamp", subtitle: "Oslo · 2023", alt: "Grey bedroom with a lit bedside lamp" },
    { n: "031", w: 2000, h: 1333, title: "Upward", subtitle: "Frankfurt · 2020", alt: "Dark glass towers seen from below against a pale sky" },
    { n: "077", w: 2000, h: 3053, title: "Amber", subtitle: "Studio · 2025", alt: "Amber dropper bottle on a wooden stand with leaf shadows" },
    { n: "268", w: 2000, h: 1333, title: "Open Water", subtitle: "Azores · 2022", alt: "Calm blue sea meeting a pale horizon" },
    { n: "228", w: 2000, h: 3000, title: "Palm Shade", subtitle: "Marrakesh · 2024", alt: "White shell chair beside a large potted palm" },
    { n: "278", w: 2000, h: 1369, title: "Teo", subtitle: "Patagonia · 2023", alt: "Smiling man in a jacket among dry grasses" },
    { n: "234", w: 2000, h: 2500, title: "Stacked Cubes", subtitle: "Boulogne · 2018", alt: "Blue cube shaped apartments stacked against a clear sky" },
    { n: "019", w: 2000, h: 3000, title: "Ridges", subtitle: "Tuscany · 2022", alt: "Layered hills fading in a peach haze" },
    { n: "235", w: 2000, h: 1333, title: "Glazed Bowls", subtitle: "Seville · 2023", alt: "Glazed bowls in green, pink and black on a dark table" },
    { n: "303", w: 2000, h: 2667, title: "Green Room", subtitle: "Accra · 2025", alt: "Dining room with a dark green wall, a white table and an orange pendant lamp" },
    { n: "264", w: 2000, h: 1328, title: "Red Valley", subtitle: "Wadi Rum · 2021", alt: "Desert valley with eroded rock towers" },
    { n: "092", w: 2000, h: 1333, title: "Black Cabin", subtitle: "Hudson Valley · 2024", alt: "Small black timber house with lit windows at the edge of a forest" },
    { n: "306", w: 2000, h: 1333, title: "Brass and Oranges", subtitle: "Studio · 2023", alt: "Brass teapot, halved oranges and lace on a dark table" },
    { n: "271", w: 2000, h: 2996, title: "Pink House", subtitle: "Rethymno · 2024", alt: "Coral pink townhouse with an arched window behind a round shrub" },
    { n: "257", w: 2000, h: 1380, title: "Still River", subtitle: "Jasper · 2020", alt: "Calm river between tall conifers" },
    { n: "060", w: 2000, h: 1328, title: "Blue Loveseat", subtitle: "Montreal · 2023", alt: "Pale blue loveseat with patterned cushions under a framed print" },
    { n: "226", w: 2000, h: 2998, title: "Pale Stool", subtitle: "Studio · 2022", alt: "Pale wooden bar stool against a soft blue wall" },
    { n: "015", w: 2000, h: 1325, title: "High Snow", subtitle: "Valais · 2021", alt: "Snow covered peaks under a light blue sky" },
    { n: "211", w: 2000, h: 3000, title: "Two Slabs", subtitle: "Hong Kong · 2023", alt: "Two slim residential towers against a teal sky" },
    { n: "080", w: 2000, h: 1333, title: "Four Cups", subtitle: "Melbourne · 2024", alt: "Hands holding cups of coffee with latte art" },
    { n: "401", w: 2000, h: 1333, title: "Blue Hour", subtitle: "Tatra · 2023", alt: "Snow-covered spruces against a deep blue twilight sky" },
    { n: "282", w: 2000, h: 3000, title: "Kitchen Corner", subtitle: "Lisbon · 2025", alt: "Kitchen corner with oak cabinets, sage tiles and a steel sink" },
    { n: "045", w: 2000, h: 3020, title: "Yellow Gate", subtitle: "Paros · 2024", alt: "Bright yellow gate framed by pink bougainvillea" },
    { n: "089", w: 2000, h: 1335, title: "Long Hall", subtitle: "Zurich · 2023", alt: "Long bright corridor with a gray floor and black cabinets" },
    { n: "245", w: 2000, h: 1125, title: "Harvest", subtitle: "Burgundy · 2022", alt: "Golden field at sunset with a line of trees" },
    { n: "078", w: 2000, h: 3000, title: "White Vase", subtitle: "Studio · 2024", alt: "Round white vase beside a hanging plant" },
    { n: "202", w: 2000, h: 2552, title: "Blue Curve", subtitle: "Toronto · 2021", alt: "Curving blue balconies of a tower seen from below" },
    { n: "269", w: 2000, h: 3623, title: "Last Light", subtitle: "Crete · 2023", alt: "Low sun behind clouds over a quiet beach" },
    { n: "096", w: 2000, h: 1334, title: "Red Armchair", subtitle: "Prague · 2024", alt: "Sunny room with a red armchair and a dining table" },
    { n: "255", w: 2000, h: 1333, title: "Highland", subtitle: "Andes · 2020", alt: "Snowy mountain above a golden meadow" },
    { n: "304", w: 2000, h: 3000, title: "Red Leaves", subtitle: "Tbilisi · 2022", alt: "Crimson and green leaves filling the frame" },
    { n: "301", w: 2000, h: 1333, title: "Two Walls", subtitle: "Valparaíso · 2022", alt: "Yellow and pink walls rising toward a blue sky" },
    { n: "110", w: 2000, h: 1325, title: "Poppies", subtitle: "Provence · 2023", alt: "Red poppies in a pale wheat field" },
    { n: "244", w: 2000, h: 3000, title: "Crema", subtitle: "Naples · 2021", alt: "Cup of black coffee seen from above" },
    { n: "091", w: 2000, h: 1334, title: "Long Room", subtitle: "Dublin · 2024", alt: "Living room with a sage sofa, a slatted wall and a walnut table" },
    { n: "403", w: 2000, h: 1333, title: "Alpenglow", subtitle: "Valais · 2022", alt: "A snowy ridge in pink evening light under a violet sky" },
    { n: "307", w: 2000, h: 1333, title: "Patchwork Block", subtitle: "Bilbao · 2024", alt: "Apartment block clad in red, yellow and orange panels under a blue sky" },
    { n: "020", w: 2000, h: 1333, title: "Cloud Forest", subtitle: "Oregon · 2020", alt: "Mist drifting over a dense pine forest seen from above" },
    { n: "302", w: 2000, h: 1541, title: "Blue Sofa", subtitle: "Brooklyn · 2025", alt: "Living room with a blue sofa, plants and tall windows at sunset" },
    { n: "261", w: 2000, h: 1284, title: "Mesa", subtitle: "Arizona · 2022", alt: "Red desert with buttes under a blue sky" },
    // DEMO-END
]
const DEMO_SRC: Record<string, string> = {
    // SRC-START
    "110": "https://framerusercontent.com/images/HrZg4RzQrSZG8CjVaYLIrigwME.jpg",
    "202": "https://framerusercontent.com/images/kC4FjGvGLsSStriHcyEi5AWONBg.jpg",
    "204": "https://framerusercontent.com/images/A6Il8nh1Tpg8AqaATEmrGZdv4.jpg",
    "211": "https://framerusercontent.com/images/pfYBFRMhmpzj821FAOxp6BkagS4.jpg",
    "215": "https://framerusercontent.com/images/9NTPRNL0pRCIJ1DlHduYsEgWZM.jpg",
    "219": "https://framerusercontent.com/images/e3GwDvVS4AWYQrQ1kwgMPO8qAw.jpg",
    "226": "https://framerusercontent.com/images/tZfdL63UtvftWN97uYoLeHIko.jpg",
    "228": "https://framerusercontent.com/images/T5UvCjJgi2GjGo2ksZ4y1OKKk.jpg",
    "234": "https://framerusercontent.com/images/lokNjnmCyPcs7FslzYDI1ki9SE.jpg",
    "235": "https://framerusercontent.com/images/N8czyKWMy2oUOM7ItrsPGPt9fE.jpg",
    "236": "https://framerusercontent.com/images/W5YKM7sdAxjc7fDHlNDIPNfAgA.jpg",
    "237": "https://framerusercontent.com/images/qET1UpZviectk45sMc29zBY3ac8.jpg",
    "244": "https://framerusercontent.com/images/QrBD3p5qlIuoGQNS61AlqdTV3g.jpg",
    "245": "https://framerusercontent.com/images/6OicfqJ5q2DXXgUDVk8R5NMI1d4.jpg",
    "246": "https://framerusercontent.com/images/Fxk5IC9ndLzfnOktbN5fPw8Muqc.jpg",
    "255": "https://framerusercontent.com/images/CjJmmmc5g2HUU5pZrIDXg5PMVM.jpg",
    "256": "https://framerusercontent.com/images/2GHJrqzlHj6qf6EmrXy628LFyA.jpg",
    "257": "https://framerusercontent.com/images/04Oq4qyLkVDg6YVSDVXnwMqTS0.jpg",
    "261": "https://framerusercontent.com/images/SvJQNbuIPTToZgpkDR3PPmzEsV0.jpg",
    "262": "https://framerusercontent.com/images/GdndiCllce7JfYXVHSyxVyRhEcw.jpg",
    "263": "https://framerusercontent.com/images/lZpOHS1GBlLqRcBxs0SUZ3xdrAg.jpg",
    "264": "https://framerusercontent.com/images/4NwJF72ChD9JwEO55c3AW4KS6g.jpg",
    "265": "https://framerusercontent.com/images/R3NMzvJGLZK0dWll6ID0wAaDXio.jpg",
    "268": "https://framerusercontent.com/images/o3B6YwYE92KboeaSM37wzAyobc.jpg",
    "269": "https://framerusercontent.com/images/ETGLNMTOmPQqdcwH5ZK2bF9eQFs.jpg",
    "271": "https://framerusercontent.com/images/XKzBy1AUDunlmQS3FUQsQRm1Kg.jpg",
    "272": "https://framerusercontent.com/images/rb0BX9xgwJ2svNnJ3fI2CRudk.jpg",
    "276": "https://framerusercontent.com/images/eQ5aajWjJVRh9uyloEOZaJ2RVI.jpg",
    "278": "https://framerusercontent.com/images/Msi3wyAV6bnhGdC26edieGttHFg.jpg",
    "282": "https://framerusercontent.com/images/8Pu10l7kWa3VCPRVwuXi3UCjCQ.jpg",
    "286": "https://framerusercontent.com/images/LKhtzGTqTDQIvMsmr5xS3tZrEXU.jpg",
    "301": "https://framerusercontent.com/images/QZcvLdBDeMb8BrGwhRIRCdYB0eg.jpg",
    "302": "https://framerusercontent.com/images/U1hH2WlGBUSuwlh7435wWk28sdg.jpg",
    "303": "https://framerusercontent.com/images/C7PsbLmMJN4hKvdvW3gMrntMuk.jpg",
    "304": "https://framerusercontent.com/images/hcT7IueVqo37oydrkVxu06JqZj8.jpg",
    "305": "https://framerusercontent.com/images/f7FMg6qVjM9QOEkrwqdrAPkhpk.jpg",
    "306": "https://framerusercontent.com/images/veEBmJL3gyAPE9SryFe38WGLjWA.jpg",
    "307": "https://framerusercontent.com/images/OnDE5IEnA7FoCrVwRgkPExfT22I.jpg",
    "401": "https://framerusercontent.com/images/Ki3xZsWnBlbk6UE492txkjbgsw.jpg",
    "402": "https://framerusercontent.com/images/PR9NxoERnE3rMf1jZ8g0Kus9QTw.jpg",
    "403": "https://framerusercontent.com/images/U8gybs4LJhvTFD4tX4XTVF6vcc.jpg",
    "404": "https://framerusercontent.com/images/VeuciuU60xW6LCOECvxv1Pf22U.jpg",
    "405": "https://framerusercontent.com/images/PEXlgmh984xSlfDy3GIqfrZjA0.jpg",
    "406": "https://framerusercontent.com/images/uR3vLvsxgzmcSZnijJWKZC0aXY.jpg",
    "057": "https://framerusercontent.com/images/cpgVLCLo0b8fCGwBn1osQ1Wxaqo.jpg",
    "012": "https://framerusercontent.com/images/Wc2aeOlnfUoMEcVsCi7TgMEIq8.jpg",
    "058": "https://framerusercontent.com/images/0iK3IrFAuhqDNs37f05ZE0Eb4.jpg",
    "031": "https://framerusercontent.com/images/CQTlLyZzQZKuIzhS2J1eY3Qc.jpg",
    "077": "https://framerusercontent.com/images/NEFXFJGr5XyLO7PmJwJhOomXLr8.jpg",
    "019": "https://framerusercontent.com/images/Sc8bOfqvRP6gVKvqJesWQ8NsuQ.jpg",
    "092": "https://framerusercontent.com/images/ZbUM6T6xhor3Bs9Rduhs3ipuRM4.jpg",
    "060": "https://framerusercontent.com/images/N9xGTYx4WmtZeqKDkwfcHcBAT0.jpg",
    "015": "https://framerusercontent.com/images/7BvsQwph5kSQbR8fdius7oBDmY0.jpg",
    "080": "https://framerusercontent.com/images/W9Z6iRykw5YCmh9irKwcsri3s8.jpg",
    "045": "https://framerusercontent.com/images/Hg8m0sfbqEYwVIlgbZvrky0.jpg",
    "089": "https://framerusercontent.com/images/YBlMElVJ3axp65AzdCSRvpkyE8.jpg",
    "078": "https://framerusercontent.com/images/wPUde7eVI7HZlFqa3uQ6NUjFKf8.jpg",
    "096": "https://framerusercontent.com/images/YXRLJVek1qYId6OmqkhtNeMxSA.jpg",
    "091": "https://framerusercontent.com/images/YK7y1NvXyzVH0jHPpMhP7JKBnUQ.jpg",
    "020": "https://framerusercontent.com/images/WlmY2lyfHq53AQYHOdCvans.jpg",
    // SRC-END
}
const demoSrc = (d: Demo) => DEMO_SRC[d.n] || ""
/** Framer's scaled copies: the long side scaled down to 512, 1024 and 2048 px, plus the original. */
function demoSrcSet(d: Demo) {
    const long = Math.max(d.w, d.h), src = demoSrc(d)
    return [512, 1024, 2048]
        .filter((n) => n < long)
        .map((n) => `${src}?scale-down-to=${n} ${Math.round((d.w * n) / long)}w`)
        .concat(`${src} ${d.w}w`)
        .join(", ")
}

// ------------------------------------------------------------------ small helpers

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const str = (v: unknown) => (typeof v === "string" ? v : "")
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)
const r1 = (v: number) => Math.round(v * 10) / 10
const r4 = (v: number) => Math.round(v * 1e4) / 1e4
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches

/** ends a name with a full stop unless it already ends with one (alt texts often do) */
const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`)
/** a photo's button carries its full name: title, subtitle and what the picture shows (FP-19) */
function nameOf(title: string, subtitle: string, alt: string, i: number) {
    const parts = [title.trim(), subtitle.trim(), alt.trim()].filter((p, k, all) => p && all.indexOf(p) === k)
    return parts.length ? parts.map(sentence).join(" ") : `Image ${i + 1}`
}
/** A length from a Framer BorderRadius string ("8px" or four values); anything else falls back. */
function radiusCss(v: unknown, fallback: string) {
    const s = str(v).trim()
    return /^(\d+(\.\d+)?px)(\s+\d+(\.\d+)?px){0,3}$/.test(s) ? s : fallback
}
function fontPx(f: FontValue | undefined, d: number) {
    const v = f?.fontSize
    const n = typeof v === "number" ? v : parseFloat(str(v))
    return Number.isFinite(n) && n > 0 ? clamp(n, 8, 120) : d
}
function fontCss(f: FontValue | undefined, d: { lineHeight: string; letterSpacing: string; weight: string }) {
    const family = str(f?.fontFamily) || "system-ui, sans-serif"
    const w = f?.fontWeight
    const weight = typeof w === "number" ? String(w) : /^\d{3}$/.test(str(w)) ? str(w) : d.weight
    const lh = f?.lineHeight
    const lineHeight = typeof lh === "number" ? String(lh) : /^[\d.]+(em|px|%)?$/.test(str(lh)) ? str(lh) : d.lineHeight
    const ls = f?.letterSpacing
    const letterSpacing = typeof ls === "number" ? `${ls}px` : /^-?[\d.]+(em|px)$/.test(str(ls)) ? str(ls) : d.letterSpacing
    return { family, weight, style: str(f?.fontStyle) === "italic" ? "italic" : "normal", lineHeight, letterSpacing }
}
/** A link from the panel without script or data addresses (those fall back to On Click). */
const safeLink = (s: string) => (/^(javascript|vbscript|data):/i.test(s.replace(/[\u0000- ]/g, "")) ? "" : s)

/**
 * Framer's image storage or this site: a path with one slash, or (in the browser) an address of the same origin.
 * Other addresses are never requested (FP-5).
 */
function allowedSrc(src: string) {
    if (/^https:\/\/framerusercontent\.com\//.test(src)) return true
    if (/^\/(?!\/)/.test(src)) return true
    if (typeof location === "undefined") return false
    try {
        return new URL(src, location.href).origin === location.origin
    } catch (e) {
        if (e instanceof TypeError) return false
        throw e
    }
}
const allowedSet = (set: string) =>
    set
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part && allowedSrc(part.split(/\s+/)[0]))
        .join(", ")
/**
 * Tiles are small: Framer's storage scales any picture down on request, so a tile's srcset starts with a copy 256 px
 * long (other addresses keep their own srcset).
 */
function tileSetOf(src: string, set: string, ratio: number) {
    if (!/^https:\/\/framerusercontent\.com\/images\/[^?#]+\.(jpe?g|png|webp|avif)(\?|$)/i.test(src)) return set
    try {
        const u = new URL(src)
        u.searchParams.set("scale-down-to", "256")
        const w = Math.round(ratio >= 1 ? 256 : 256 * ratio)
        return set ? `${u.toString()} ${w}w, ${set}` : `${u.toString()} ${w}w`
    } catch (e) {
        if (!(e instanceof TypeError)) throw e
        return set
    }
}
/** Width over height when the address or the srcset tells it; 0 when only loading can tell. */
function ratioOf(img: ImageValue | undefined): number {
    const src = str(img?.src)
    try {
        const u = new URL(src, "https://framerusercontent.com")
        const w = Number(u.searchParams.get("width")), h = Number(u.searchParams.get("height"))
        if (w > 0 && h > 0) return w / h
    } catch (e) {
        if (!(e instanceof TypeError)) throw e
    }
    // Framer's copies scale the long side: a copy narrower than its scale is a portrait of that format
    for (const part of str(img?.srcSet).split(",")) {
        const m = /scale-down-to=(\d+)\s+(\d+)w/.exec(part)
        if (m && Number(m[2]) < Number(m[1]) - 1) return Number(m[2]) / Number(m[1])
    }
    return 0
}

// ------------------------------------------------------------------ the pictures

interface Pic {
    src: string
    set: string
    ratio: number
    tileSet: string
    title: string
    subtitle: string
    alt: string
    link: string
    name: string
    at: number // position in the Images list (hints name it)
}
interface Problem {
    i: number
    kind: "origin" | "load"
}
function picsOf(images: ItemProps[] | undefined): { pics: Pic[]; demo: boolean; problems: Problem[] } {
    const list = Array.isArray(images) ? images.filter((x) => x && typeof x === "object").slice(0, MAX_IMAGES) : []
    if (!list.length) {
        const pics = DEMO.map((d, i) => ({ src: demoSrc(d), set: demoSrcSet(d), tileSet: tileSetOf(demoSrc(d), demoSrcSet(d), d.w / d.h), ratio: d.w / d.h, title: d.title, subtitle: d.subtitle, alt: d.alt, link: "", name: nameOf(d.title, d.subtitle, d.alt, i), at: i }))
        return { pics, demo: true, problems: [] }
    }
    // entries without an allowed picture stay out of the wall; the editor names those from elsewhere (FP-5)
    const problems: Problem[] = []
    const pics: Pic[] = []
    list.forEach((it, i) => {
        const raw = str(it.image?.src)
        if (!raw) return
        if (!allowedSrc(raw)) {
            problems.push({ i, kind: "origin" })
            return
        }
        const ratio = ratioOf(it.image) || 1.5
        const alt = str(it.alt) || str(it.image?.alt)
        const title = str(it.title), subtitle = str(it.subtitle)
        const set = allowedSet(str(it.image?.srcSet))
        pics.push({ src: raw, set, tileSet: tileSetOf(raw, set, ratio), ratio, title, subtitle, alt, link: safeLink(str(it.link)), name: nameOf(title, subtitle, alt, i), at: i })
    })
    return { pics, demo: false, problems }
}
/** Two lists of images that would give the same wall, compared field by field (FP-15: no JSON keys). */
function sameImages(a: unknown, b: unknown) {
    if (a === b) return true
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((x: ItemProps | null | undefined, i) => {
        const y: ItemProps | null | undefined = b[i]
        if (x === y) return true
        if (!x || !y || typeof x !== "object" || typeof y !== "object") return false
        const xi = x.image, yi = y.image
        const sameImage = xi === yi || (!!xi && !!yi && xi.src === yi.src && xi.srcSet === yi.srcSet && xi.alt === yi.alt)
        return sameImage && x.alt === y.alt && x.title === y.title && x.subtitle === y.subtitle && x.link === y.link
    })
}

// ------------------------------------------------------------------ the hanging (values from the approved feel probe)

const WIDE = 1.9 // widest tile in tile heights (wider photos are cropped)
const PAD_B = 2.9 // the ring reaches this many tile heights (plus a gap) beyond each side, the seam stays hidden
const ROW_STRIDE = 997 // each row draws from its own stretch of the shuffled stream (longer than any row), so rows never share a run
const COVER = 2.4 // rows reach for stages up to 2.4 times as wide as tall; wider stages take larger tiles (no empty strip)

/** a small seeded random generator (the same wall on the server and in the browser) */
function rng(seed: number) {
    let s = seed % 2147483647
    if (s <= 0) s += 2147483646
    return () => {
        s = (s * 16807) % 2147483647
        return (s - 1) / 2147483646
    }
}
/** The shuffled stream of pictures: each comes again only when all others were there, never twice in a row. */
function streamOf(count: number) {
    const cycles: number[][] = []
    const cycle = (c: number): number[] => {
        while (cycles.length <= c) {
            const n = cycles.length, r = rng(11 + n * 7919)
            const p = Array.from({ length: count }, (_, i) => i)
            for (let i = count - 1; i > 0; i--) {
                const j = Math.floor(r() * (i + 1))
                ;[p[i], p[j]] = [p[j], p[i]]
            }
            const prev = n ? cycles[n - 1] : null
            if (prev && count > 1 && p[0] === prev[count - 1]) [p[0], p[count - 1]] = [p[count - 1], p[0]]
            cycles.push(p)
        }
        return cycles[c]
    }
    return (j: number) => cycle(Math.floor(j / count))[j % count]
}
interface Slot {
    k: number // picture
    a: number // width in tile heights
    A: number // sum of the widths before it (tile heights)
    n: number // tiles before it (gaps)
}
/** K: the shortest ring in tile heights minus both hidden margins; a tile is at least (W + 2 gaps) / K tall */
const ringK = (rows: Row[]) => Math.max(1, Math.min(...rows.map((r) => r.A)) - 2 * PAD_B)
interface Row {
    slots: Slot[]
    A: number // ring length in tile heights, without gaps
    N: number // gaps in the ring
    off: number // start offset (tile heights)
}
/**
 * Rows + 2 rows (one hidden above, one below) of tiles in their real formats. Each row is a ring long enough for a
 * stage `cover` times as wide as tall; `gapB` is the gap in tile heights (an estimate is enough for the count).
 */
function hangingOf(ratios: number[], rows: number, gapB: number, cover: number): Row[] {
    const pick = streamOf(Math.max(1, ratios.length))
    const need = cover * rows * (1 + gapB) + 2 * (PAD_B + gapB)
    const out: Row[] = []
    for (let r = 0; r < rows + 2; r++) {
        const slots: Slot[] = []
        let A = 0, n = 0
        while (A + n * gapB < need || slots.length < 2) {
            const k = ratios.length ? pick(r * ROW_STRIDE + slots.length) : 0
            const a = Math.min(WIDE, Math.max(0.3, ratios[k] || 1.5))
            slots.push({ k, a, A, n })
            A += a
            n++
        }
        out.push({ slots, A, N: n, off: rng(503 + r * 131)() * 1.6 })
    }
    return out
}

// ------------------------------------------------------------------ loading (FP-4, FP-5, FP-12)

type LoadKind = "load" | "slow" | "odd"
const LOAD_LIMIT = 10000
/**
 * The one way the engine loads a picture: same sizes and srcset as the element that shows it, a time limit, the first
 * result counts, everything removed afterwards. Resolves true when the picture is decoded.
 */
function loadPic(src: string, set: string, sizes: string, report: (kind: LoadKind) => void): { done: Promise<boolean>; cancel: () => void } {
    const img = new Image()
    let settled = false, timer = 0
    let resolve: (ok: boolean) => void = () => {}
    const done = new Promise<boolean>((res) => (resolve = res))
    const finish = (ok: boolean, kind?: LoadKind) => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        if (kind) report(kind)
        resolve(ok)
    }
    img.decoding = "async"
    if (set) {
        img.sizes = sizes
        img.srcset = set
    }
    img.src = src
    timer = window.setTimeout(() => finish(false, "slow"), LOAD_LIMIT)
    img.decode().then(
        () => finish(true),
        // a broken or missing picture rejects with a DOMException; anything else is unexpected and named as such (FP-8)
        (e: unknown) => finish(false, e instanceof DOMException ? "load" : "odd"),
    )
    return { done, cancel: () => finish(false) }
}

// ------------------------------------------------------------------ the engine

interface Options {
    pics: Pic[]
    hanging: Row[]
    rows: number
    gap: number
    drift: number
    hoverSize: number
    touch: Touch
    buttonShow: boolean
    buttonText: string
    clickable: boolean
}
interface Surface {
    el: HTMLDivElement
    imgs: HTMLImageElement[]
    front: number
    want: HTMLImageElement | null
    zc: number
    tOff: number
    tile: number
    k: number
    mode: "idle" | "grow" | "shrink" | "detail"
    cx: number
    cy: number
    w: number
    h: number
    vcx: number
    vcy: number
    vw: number
    vh: number
    last: string
    loads: Array<() => void>
}
interface Sp {
    x: number
    y: number
    vx: number
    vy: number
}
function spring(o: Record<string, number>, p: string, v: string, target: number, k: number, z: number, dt: number) {
    const c = 2 * z * Math.sqrt(k)
    o[v] += (k * (target - o[p]) - c * o[v]) * dt
    o[p] += o[v] * dt
}

/**
 * Drives one wall: rows, the clearing, the large surface, the label and the open view. Everything it writes stays
 * inside its own element (FP-16); its listeners sit on that element, globally it only reads (visibility, motion setting).
 */
class Engine {
    root: HTMLDivElement
    stage: HTMLDivElement
    wallEl: HTMLDivElement
    veil: HTMLDivElement
    labelEl: HTMLDivElement
    labelT: HTMLElement
    labelS: HTMLElement
    view: HTMLDivElement
    nav: HTMLDivElement
    prev: HTMLButtonElement
    next: HTMLButtonElement
    count: HTMLElement
    closeB: HTMLButtonElement
    cap: HTMLDivElement
    altEl: HTMLElement
    live: HTMLElement
    capT: HTMLElement
    capS: HTMLElement
    linkB: HTMLAnchorElement
    actB: HTMLButtonElement
    o: Options
    onAction: () => void
    // stage
    W = 0
    H = 0
    b = 60
    pad = 0
    phone = false
    rm = reducedMotion()
    // rows and tiles
    rowEls: HTMLDivElement[] = []
    tiles: HTMLButtonElement[] = []
    rowL: number[] = []
    rowOff: number[] = []
    rowLast: string[] = []
    rowOf: Int16Array = new Int16Array(0)
    bx: Float32Array = new Float32Array(0)
    wrap: Float32Array = new Float32Array(0)
    hy: Float32Array = new Float32Array(0)
    tw: Float32Array = new Float32Array(0)
    th: Float32Array = new Float32Array(0)
    kOf: Int16Array = new Int16Array(0)
    x: Float32Array = new Float32Array(0)
    y: Float32Array = new Float32Array(0)
    s: Float32Array = new Float32Array(0)
    vx: Float32Array = new Float32Array(0)
    vy: Float32Array = new Float32Array(0)
    vs: Float32Array = new Float32Array(0)
    lastT: string[] = []
    lastZ: Int8Array = new Int8Array(0)
    N = 0
    // motion
    T = { x: 0, y: 0 }
    P: Sp = { x: 0, y: 0, vx: 0, vy: 0 }
    S = 0
    D = 0
    hover = -1
    focusIdx = -1
    mark = -1
    inp = { pointer: false, focus: false, holdUntil: 0, type: "mouse", down: null as null | { id: number; x: number; y: number; drag: boolean }, forced: -1, keyboard: false }
    surfaces: Surface[] = []
    aktiv: Surface | null = null
    CL = { x: 0, y: 0, bx: 0, by: 0, s: 0, vx: 0, vy: 0, vbx: 0, vby: 0, vs: 0 }
    open = { i: -1, phase: 0, t0: 0, frozen: null as null | { x: number; y: number; bx: number; by: number }, browseT: -10, dir: 1, fade: false, newK: -1, viaKey: false }
    spalteH = 60
    schK = -1
    schF = 1
    // loop
    raf = 0
    lastMs = 0
    // false until the IntersectionObserver reports: a wall far down the page loads nothing before it comes near
    visible = false
    alive = true
    io: IntersectionObserver | null = null
    ro: ResizeObserver | null = null
    mq: MediaQueryList | null = null
    wakeTimer = 0
    swipe: null | { x: number; y: number } = null
    preload = new Map<string, () => void>()
    tileLoads: Uint8Array = new Uint8Array(0)
    shown: Uint8Array = new Uint8Array(0)
    tileTimers = new Set<number>()
    fillTick = 0
    reportLoad: (k: number, kind: LoadKind) => void

    constructor(root: HTMLDivElement, o: Options, onAction: () => void, reportLoad: (k: number, kind: LoadKind) => void) {
        this.root = root
        this.o = o
        this.onAction = onAction
        this.reportLoad = reportLoad
        const q = <T extends Element>(s: string) => root.querySelector(s) as T
        this.stage = q<HTMLDivElement>(".pw-stage")
        this.wallEl = q<HTMLDivElement>(".pw-wall")
        this.veil = q<HTMLDivElement>(".pw-veil")
        this.labelEl = q<HTMLDivElement>(".pw-label")
        this.labelT = q<HTMLElement>(".pw-label b")
        this.labelS = q<HTMLElement>(".pw-label span")
        this.view = q<HTMLDivElement>(".pw-view")
        this.nav = q<HTMLDivElement>(".pw-nav")
        this.prev = q<HTMLButtonElement>(".pw-prev")
        this.next = q<HTMLButtonElement>(".pw-next")
        this.count = q<HTMLElement>(".pw-count")
        this.closeB = q<HTMLButtonElement>(".pw-close")
        this.cap = q<HTMLDivElement>(".pw-cap")
        this.capT = q<HTMLElement>(".pw-cap-t")
        this.altEl = q<HTMLElement>(".pw-alt")
        this.live = q<HTMLElement>(".pw-live")
        this.capS = q<HTMLElement>(".pw-cap-s")
        this.linkB = q<HTMLAnchorElement>("a.pw-btn")
        this.actB = q<HTMLButtonElement>("button.pw-btn")
        root.querySelectorAll<HTMLDivElement>(".pw-surface").forEach((el) => {
            const imgs = Array.from(el.querySelectorAll("img"))
            this.surfaces.push({ el, imgs, front: 0, want: null, zc: 1, tOff: 0, tile: -1, k: -1, mode: "idle", cx: 0, cy: 0, w: 0, h: 0, vcx: 0, vcy: 0, vw: 0, vh: 0, last: "", loads: [] })
        })
        this.bind()
        this.measure()
        this.adopt()
        // in view (with half a screen ahead): the loop runs and the tiles near the stage get their pictures
        this.io = new IntersectionObserver(
            (en) => {
                this.visible = !!en[0]?.isIntersecting
                if (this.visible) {
                    this.fillNear()
                    this.wake()
                }
            },
            { rootMargin: "50% 0px" },
        )
        this.io.observe(root)
        this.ro = new ResizeObserver(() => {
            if (this.stage.clientWidth !== this.W || this.stage.clientHeight !== this.H) {
                // a new size (breakpoint, turning the phone) keeps the rows where they drifted to, in tile heights
                const keep = this.rowOff.map((o) => o / this.b)
                this.closeNow()
                this.measure()
                this.adopt(keep)
                this.wake()
            }
        })
        this.ro.observe(this.stage)
        // the system setting may change while the page is open: read only, on the MediaQueryList itself
        if (typeof matchMedia === "function") {
            this.mq = matchMedia("(prefers-reduced-motion: reduce)")
            this.mq.addEventListener("change", this.onMotion)
        }
        this.wake()
    }

    // ---------------------------------------------------------------- setup

    onMotion = () => {
        this.rm = reducedMotion()
        this.root.classList.toggle("pw-rm", this.rm)
        this.release()
        this.wake()
    }
    measure() {
        this.W = this.stage.clientWidth
        this.H = this.stage.clientHeight
        this.phone = this.W < 640
        const rows = clamp(Math.round(this.o.rows), 2, 30)
        this.b = Math.max(24, (this.H - rows * this.o.gap) / rows, (this.W + 2 * this.o.gap) / ringK(this.o.hanging))
        this.pad = PAD_B * this.b + this.o.gap
        this.root.classList.toggle("pw-rm", this.rm)
    }
    /** reads the tiles React rendered for the current hanging and places them in px at the same spot as the server HTML */
    adopt(keep?: number[]) {
        const o = this.o, b = this.b, gap = o.gap
        this.rowEls = Array.from(this.wallEl.querySelectorAll<HTMLDivElement>(".pw-row"))
        this.tiles = Array.from(this.wallEl.querySelectorAll<HTMLButtonElement>(".pw-tile"))
        const N = (this.N = this.tiles.length)
        this.rowOf = new Int16Array(N)
        this.bx = new Float32Array(N)
        this.wrap = new Float32Array(N)
        this.hy = new Float32Array(N)
        this.tw = new Float32Array(N)
        this.th = new Float32Array(N)
        this.kOf = new Int16Array(N)
        this.x = new Float32Array(N)
        this.y = new Float32Array(N)
        this.s = new Float32Array(N).fill(1)
        this.vx = new Float32Array(N)
        this.vy = new Float32Array(N)
        this.vs = new Float32Array(N)
        this.lastT = new Array(N).fill("")
        this.lastZ = new Int8Array(N)
        this.tileLoads = new Uint8Array(N)
        this.shown = new Uint8Array(N).fill(1)
        this.rowL = []
        this.rowOff = []
        this.rowLast = []
        let i = 0
        o.hanging.forEach((row, r) => {
            this.rowL.push(row.A * b + row.N * gap)
            this.rowOff.push((keep && keep[r] !== undefined ? keep[r] : row.off) * b)
            this.rowLast.push("")
            for (const sl of row.slots) {
                if (i >= N) break
                this.rowOf[i] = r
                this.bx[i] = sl.A * b + sl.n * gap
                this.hy[i] = gap / 2 + (r - 1) * (b + gap)
                this.tw[i] = sl.a * b
                this.th[i] = b
                this.kOf[i] = sl.k
                i++
            }
        })
        for (const L of this.surfaces) this.releaseSurface(L)
        this.aktiv = null
        this.hover = -1
        this.S = 0
        this.CL.s = this.CL.bx = this.CL.by = 0
        this.placeRows(true)
        for (let j = 0; j < N; j++) this.drawTile(j)
        this.fillNear()
        // roving tab stop on the first tile in view
        const first = this.inView()[0] ?? 0
        this.setStop(this.tiles[first] ? first : -1)
        this.P.x = this.T.x = this.W / 2
        this.P.y = this.T.y = this.H / 2
    }
    setOptions(o: Options) {
        const layout = o.hanging !== this.o.hanging || o.rows !== this.o.rows || o.gap !== this.o.gap
        this.o = o
        if (layout) {
            this.measure()
            this.adopt()
            this.closeNow()
        } else if (this.open.i >= 0 && this.aktiv) this.fillView(this.aktiv.k, false)
        this.wake()
    }

    // ---------------------------------------------------------------- rows (rings, seam off stage)

    /** each row's offset in px on its own layer; a tile jumps by one ring length only when it crosses the hidden seam */
    placeRows(force = false) {
        for (let r = 0; r < this.rowEls.length; r++) {
            const L = this.rowL[r] || 1
            let off = this.rowOff[r] % L
            if (off < 0) off += L
            this.rowOff[r] = off
            const t = `translate3d(${r1(off)}px,0,0)`
            if (force || t !== this.rowLast[r]) {
                this.rowEls[r].style.transform = t
                this.rowLast[r] = t
            }
        }
        for (let i = 0; i < this.N; i++) {
            const r = this.rowOf[i], L = this.rowL[r] || 1
            const w = this.bx[i] + this.rowOff[r] >= L ? -L : 0
            if (w !== this.wrap[i] || force) {
                this.wrap[i] = w
                this.lastT[i] = ""
            }
        }
    }
    /** left edge of a tile's home on the stage (without stepping aside) */
    hx(i: number) {
        return this.rowOff[this.rowOf[i]] + this.bx[i] - this.pad + this.wrap[i]
    }
    cxOf(i: number) {
        return this.hx(i) + this.tw[i] / 2
    }
    cyOf(i: number) {
        return this.hy[i] + this.th[i] / 2
    }
    inView() {
        const v: number[] = []
        for (let i = 0; i < this.N; i++) {
            const cx = this.cxOf(i), cy = this.cyOf(i)
            if (cx > 0 && cx < this.W && cy > 0 && cy < this.H) v.push(i)
        }
        return v.sort((a, b) => this.rowOf[a] - this.rowOf[b] || this.cxOf(a) - this.cxOf(b))
    }
    /** tiles within one ring margin of the stage get their picture (the first view came with the server HTML) */
    fillNear() {
        // nothing before the wall comes near the visible part of the page
        if (!this.visible) return
        const tl = this.tileLoads
        for (let i = 0; i < this.N; i++) {
            if (tl[i]) continue
            const x0 = this.hx(i)
            if (x0 + this.tw[i] < -this.pad || x0 > this.W + this.pad) continue
            tl[i] = 1
            const img = this.tiles[i].querySelector("img")
            const p = this.o.pics[this.kOf[i]]
            if (!img || !p) continue
            // lazy loading never starts in a clipped stage: near the stage the engine loads at once
            img.loading = "eager"
            if (!img.getAttribute("src")) {
                img.sizes = `${Math.round(this.tw[i])}px`
                if (p.tileSet) img.srcset = p.tileSet
                img.src = p.src
            } else if (this.tw[i] > 1.25 * (parseFloat(img.sizes) || 0)) {
                // the server guessed sizes from a 900 px stage: a taller stage shows the tile larger, it gets the next step
                img.sizes = `${Math.round(this.tw[i])}px`
            }
            this.watchTile(img, this.kOf[i])
        }
    }
    /** a tile picture that has not arrived after the time limit is named in the editor (FP-4); the tile stays calm */
    watchTile(img: HTMLImageElement, k: number) {
        if (img.complete && img.naturalWidth > 0) return
        const t = window.setTimeout(() => {
            this.tileTimers.delete(t)
            // tiles near the stage load at once (fillNear), so a picture still missing here was asked for and has not come
            if (this.alive && img.getAttribute("src") && !img.complete && !img.classList.contains("is-broken")) this.reportLoad(k, "slow")
        }, LOAD_LIMIT)
        this.tileTimers.add(t)
    }
    drawTile(i: number) {
        const t = `translate3d(${r1(this.bx[i] - this.pad + this.wrap[i] + this.x[i])}px,${r1(this.hy[i] + this.y[i])}px,0) scale(${this.s[i].toFixed(3)})`
        if (t !== this.lastT[i]) {
            this.tiles[i].style.transform = t
            this.lastT[i] = t
        }
    }
    setStop(i: number) {
        if (this.focusIdx >= 0 && this.tiles[this.focusIdx]) this.tiles[this.focusIdx].tabIndex = -1
        this.focusIdx = i
        if (i >= 0 && this.tiles[i]) this.tiles[i].tabIndex = 0
    }

    // ---------------------------------------------------------------- the large surface

    labelH() {
        return this.phone ? 46 : 52
    }
    grownSize(k: number) {
        const a = this.o.pics[k]?.ratio || 1.5
        let h = Math.min(clamp(this.o.hoverSize, 100, 600), this.H * (this.phone ? 0.36 : 0.42))
        if (a < 1) h *= 1.1
        let w = h * a
        const maxW = this.phone ? this.W * 0.68 : this.W * 0.34
        if (w > maxW) {
            w = maxW
            h = w / a
        }
        return { w, h }
    }
    grownTarget(i: number) {
        const { w, h } = this.grownSize(this.kOf[i])
        let gx = this.cxOf(i), gy = this.cyOf(i)
        if (this.inp.pointer && this.inp.type === "mouse") {
            gx += (this.P.x - gx) * 0.4
            gy += (this.P.y - gy) * 0.4
        }
        const m = 14
        gx = clamp(gx, m + w / 2, Math.max(m + w / 2, this.W - m - w / 2))
        gy = clamp(gy, m + h / 2, Math.max(m + h / 2, this.H - m - h / 2 - this.labelH()))
        return { cx: gx, cy: gy, w, h }
    }
    tileRect(i: number) {
        return { cx: this.cxOf(i) + this.x[i], cy: this.cyOf(i) + this.y[i], w: this.tw[i] * this.s[i], h: this.th[i] * this.s[i] }
    }
    sizesFor(px: number) {
        return `${Math.max(32, Math.round(px))}px`
    }
    /** cross-fade: the new picture lies on top and fades in; everything below stays until it is covered */
    swap(L: Surface, k: number, px: number) {
        const p = this.o.pics[k]
        if (!p || !p.src) return
        const cur = L.imgs[L.front]
        const sizes = this.sizesFor(px)
        const same = (im: HTMLImageElement) => im.getAttribute("data-k") === String(k) && im.sizes === sizes
        if (L.want && same(L.want)) return
        if (!L.want && same(cur) && !cur.classList.contains("is-off")) return
        const free = L.imgs.filter((im) => im !== cur)
        const nxt = free.find((im) => im.classList.contains("is-off")) || free.sort((a, b) => +a.style.zIndex - +b.style.zIndex)[0]
        nxt.style.transition = "none"
        nxt.classList.add("is-off")
        nxt.style.zIndex = String(++L.zc)
        nxt.setAttribute("data-k", String(k))
        nxt.alt = ""
        if (p.set) {
            nxt.sizes = sizes
            nxt.srcset = p.set
        } else nxt.removeAttribute("srcset")
        nxt.src = p.src
        L.want = nxt
        const ld = loadPic(p.src, p.set, sizes, (kind) => this.reportLoad(k, kind))
        L.loads.push(ld.cancel)
        ld.done.then((ok) => {
            if (!this.alive || L.want !== nxt) return
            L.want = null
            if (!ok) return
            void nxt.offsetWidth
            nxt.style.transition = ""
            nxt.classList.remove("is-off")
            L.front = L.imgs.indexOf(nxt)
            window.clearTimeout(L.tOff)
            L.tOff = window.setTimeout(() => {
                if (L.imgs[L.front] !== nxt) return
                for (const im of L.imgs)
                    if (im !== nxt) {
                        im.style.transition = "none"
                        im.classList.add("is-off")
                    }
            }, 380)
        })
    }
    assign(L: Surface, i: number) {
        L.tile = i
        L.k = this.kOf[i]
        const r = this.tileRect(i)
        L.cx = r.cx
        L.cy = r.cy
        L.w = r.w
        L.h = r.h
        L.vcx = L.vcy = L.vw = L.vh = 0
        L.last = ""
        window.clearTimeout(L.tOff)
        L.want = null
        L.zc = 1
        // the tile's own copy is already loaded: it shows at once, the larger copy fades in over it
        const tileImg = this.tiles[i]?.querySelector("img")
        L.imgs.forEach((im, n) => {
            im.style.transition = "none"
            im.style.zIndex = n ? "" : "1"
            im.className = n ? "is-off" : ""
            im.removeAttribute("data-k")
        })
        const first = L.imgs[0]
        if (tileImg && tileImg.getAttribute("src")) {
            if (tileImg.sizes) first.sizes = tileImg.sizes
            if (tileImg.srcset) first.srcset = tileImg.srcset
            else first.removeAttribute("srcset")
            first.src = tileImg.getAttribute("src") || ""
        }
        L.front = 0
        L.el.style.opacity = ""
        L.el.classList.add("is-on")
        this.tiles[i]?.classList.add("is-under")
        const g = this.grownSize(L.k)
        this.swap(L, L.k, Math.max(g.w, g.h * (this.o.pics[L.k]?.ratio || 1)))
    }
    retarget(L: Surface, i: number) {
        if (L.tile === i) return
        if (L.tile >= 0) this.tiles[L.tile]?.classList.remove("is-under")
        L.tile = i
        this.tiles[i]?.classList.add("is-under")
        const k = this.kOf[i]
        if (L.k !== k) {
            L.k = k
            const g = this.grownSize(k)
            this.swap(L, k, g.w)
        }
    }
    releaseSurface(L: Surface) {
        if (L.tile >= 0) this.tiles[L.tile]?.classList.remove("is-under")
        for (const c of L.loads) c()
        L.loads = []
        L.want = null
        L.tile = -1
        L.k = -1
        L.mode = "idle"
        L.el.classList.remove("is-on", "is-focus")
        L.last = ""
    }
    /** one large surface: it stays and morphs to the next photo; a new one grows only when none stands large */
    setHover(i: number) {
        // a wall without one valid picture stays still: nothing grows, nothing opens
        if (!this.o.pics.length) i = -1
        if (i === this.hover && (i < 0 || (this.aktiv && this.aktiv.tile === i))) return
        this.hover = i
        if (i < 0 || this.rm) {
            if (this.aktiv && this.aktiv.mode === "grow") this.aktiv.mode = "shrink"
            this.aktiv = null
            return
        }
        let L: Surface | null = this.aktiv && this.aktiv.mode !== "idle" ? this.aktiv : null
        if (!L) {
            const back = this.surfaces.filter((l) => l.mode === "shrink" && l.w * l.h > 1.6 * this.tw[l.tile] * this.th[l.tile]).sort((a, b) => b.w * b.h - a.w * a.h)[0]
            if (back) L = back
        }
        if (L) this.retarget(L, i)
        else {
            L = this.surfaces.find((l) => l.mode === "idle") || this.surfaces[0]
            if (L.mode !== "idle") this.releaseSurface(L)
            this.assign(L, i)
        }
        L.mode = "grow"
        this.aktiv = L
        L.el.parentElement?.appendChild(L.el)
    }
    release() {
        for (const L of this.surfaces) this.releaseSurface(L)
        this.aktiv = null
        this.hover = -1
        this.setMark(-1)
    }
    /** the tile whose place in the wall (without stepping aside) lies at this point, or the nearest */
    atPlace(px: number, py: number) {
        let best = -1, bd = Infinity
        for (let i = 0; i < this.N; i++) {
            const x0 = this.hx(i)
            if (px >= x0 && px <= x0 + this.tw[i] && py >= this.hy[i] && py <= this.hy[i] + this.th[i]) return i
            const d = (this.cxOf(i) - px) ** 2 + (this.cyOf(i) - py) ** 2
            if (d < bd) {
                bd = d
                best = i
            }
        }
        return best
    }
    pick() {
        if (this.inp.forced >= 0) return this.inp.forced
        const h = this.hover
        if (h >= 0) {
            const m = this.b * 0.1, x0 = this.hx(h)
            if (this.P.x > x0 - m && this.P.x < x0 + this.tw[h] + m && this.P.y > this.hy[h] - m && this.P.y < this.hy[h] + this.th[h] + m) return h
        }
        return this.atPlace(this.P.x, this.P.y)
    }

    // ---------------------------------------------------------------- input (all on the own element)

    local(e: { clientX: number; clientY: number }) {
        const r = this.stage.getBoundingClientRect()
        const kx = r.width ? this.W / r.width : 1, ky = r.height ? this.H / r.height : 1
        return [(e.clientX - r.left) * kx, (e.clientY - r.top) * ky]
    }
    now() {
        return performance.now() / 1000
    }
    bind() {
        const root = this.root
        root.addEventListener("pointermove", this.onMove, { passive: true })
        root.addEventListener("pointerleave", this.onLeave, { passive: true })
        root.addEventListener("pointerdown", this.onDown, { passive: true })
        root.addEventListener("pointerup", this.onUp, { passive: true })
        root.addEventListener("pointercancel", this.onUp, { passive: true })
        root.addEventListener("click", this.onClick)
        root.addEventListener("keydown", this.onKey)
        root.addEventListener("focusin", this.onFocusIn)
        root.addEventListener("focusout", this.onFocusOut)
    }
    onMove = (e: PointerEvent) => {
        if (this.open.i >= 0) return
        this.inp.type = e.pointerType
        const [mx, my] = this.local(e)
        if (e.pointerType === "mouse") {
            // the mouse takes over from a keyboard focus: from now on only the pointer holds the wall
            this.inp.pointer = true
            this.inp.focus = false
            this.inp.forced = -1
            this.inp.keyboard = false
            this.T.x = mx
            this.T.y = my
            this.wake()
        } else if (this.inp.down && e.pointerId === this.inp.down.id) {
            if (Math.hypot(mx - this.inp.down.x, my - this.inp.down.y) > 8) this.inp.down.drag = true
            if (this.inp.down.drag) {
                this.inp.forced = -1
                this.T.x = mx
                this.T.y = my
                this.inp.holdUntil = this.now() + 4
                this.wake()
            }
        }
    }
    onLeave = (e: PointerEvent) => {
        if (e.pointerType === "mouse") {
            this.inp.pointer = false
            this.wake()
        }
    }
    onDown = (e: PointerEvent) => {
        this.inp.type = e.pointerType
        this.inp.keyboard = false
        if (e.pointerType !== "mouse") {
            const [mx, my] = this.local(e)
            this.inp.down = { id: e.pointerId, x: mx, y: my, drag: false }
            if (this.open.i >= 0 && (e.target as Element | null)?.closest?.(".pw-stage") && !(e.target as Element).closest(".pw-view a, .pw-view button")) this.swipe = { x: e.clientX, y: e.clientY }
        }
    }
    onUp = (e: PointerEvent) => {
        this.inp.down = null
        const sw = this.swipe
        this.swipe = null
        if (!sw || this.open.i < 0) return
        const dx = e.clientX - sw.x, dy = e.clientY - sw.y
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) this.browse(dx < 0 ? 1 : -1)
    }
    /** inside the large surface, a click counts for its photo (the surface itself is only a picture) */
    inSurface(px: number, py: number) {
        const L = this.aktiv
        if (!L || L.mode !== "grow") return false
        return Math.abs(px - L.cx) <= L.w / 2 && Math.abs(py - L.cy) <= L.h / 2
    }
    onClick = (e: MouseEvent) => {
        const t = e.target as Element | null
        if (!t || !t.closest || !this.o.pics.length) return
        if (t.closest(".pw-view")) return
        if (this.open.i >= 0) {
            if (t.closest(".pw-veil")) this.close()
            return
        }
        const tile = t.closest(".pw-tile") as HTMLButtonElement | null
        if (!tile && !t.closest(".pw-stage")) return
        const [mx, my] = this.local(e)
        const key = e.detail === 0
        let i = tile ? Number(tile.dataset.i) : this.hover
        if (!key && this.inSurface(mx, my) && this.aktiv) i = this.aktiv.tile
        else if (!tile && this.inp.type !== "mouse") i = this.atPlace(mx, my)
        if (!(i >= 0)) return
        // touch, Preview: the first tap enlarges, a tap on the enlarged photo opens it; Open: at once
        const big = this.rm ? this.hover === i && this.inp.holdUntil > this.now() : !!this.aktiv && this.aktiv.mode === "grow" && this.aktiv.tile === i
        if (this.o.touch === "preview" && this.inp.type !== "mouse" && !key && !big) {
            this.inp.forced = i
            this.T.x = this.cxOf(i)
            this.T.y = this.cyOf(i)
            this.inp.holdUntil = this.now() + 4
            if (this.rm) {
                this.hover = i
                this.setMark(i)
            }
            this.wake()
            return
        }
        this.openAt(i, key)
    }
    onFocusIn = (e: FocusEvent) => {
        const tile = (e.target as Element | null)?.closest?.(".pw-tile") as HTMLButtonElement | null
        if (!tile) return
        const i = Number(tile.dataset.i)
        // a tab stop that drifted out of view hands the focus to the first tile in view
        const cx = this.cxOf(i)
        if (cx < 0 || cx > this.W) {
            const first = this.inView()[0]
            if (first !== undefined && first !== i) {
                this.setStop(first)
                this.tiles[first].focus({ preventScroll: true })
                return
            }
        }
        this.setStop(i)
        // only a keyboard focus holds the wall (after a click or a tap the focus stays without effect)
        if (!tile.matches(":focus-visible")) return
        this.inp.focus = true
        this.inp.keyboard = true
        this.inp.forced = i
        this.T.x = this.cxOf(i)
        this.T.y = this.cyOf(i)
        if (this.rm) this.hover = i
        this.wake()
    }
    onFocusOut = (e: FocusEvent) => {
        if (!this.wallEl.contains(e.relatedTarget as Node | null)) {
            this.inp.focus = false
            this.inp.forced = -1
            this.wake()
        }
    }
    onKey = (e: KeyboardEvent) => {
        this.inp.keyboard = true
        if (this.open.i >= 0) {
            if (e.key === "Escape") {
                // Escape closes the view, its tooltips go with it (FP-14)
                e.preventDefault()
                this.close()
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                this.browse(1)
            } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                this.browse(-1)
            } else if (e.key === "Tab") {
                const f = this.focusables(), at = f.indexOf(document.activeElement as HTMLElement)
                if (f.length) {
                    e.preventDefault()
                    // from the dialog itself, Tab goes to the first control and Shift+Tab to the last
                    const next = at < 0 ? (e.shiftKey ? f.length - 1 : 0) : (at + (e.shiftKey ? -1 : 1) + f.length) % f.length
                    f[next].focus()
                }
            }
            return
        }
        const keys: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
        const d = keys[e.key]
        if (!d || !(e.target as Element | null)?.closest?.(".pw-tile")) return
        e.preventDefault()
        const [dx, dy] = d, i = this.focusIdx
        if (i < 0) return
        let best = -1, bd = Infinity
        for (const j of this.inView()) {
            const ddx = this.cxOf(j) - this.cxOf(i), ddy = this.cyOf(j) - this.cyOf(i)
            if ((dx && (Math.sign(ddx) !== dx || Math.abs(ddx) < 6)) || (dy && (Math.sign(ddy) !== dy || Math.abs(ddy) < this.b * 0.4))) continue
            const dist = dx ? Math.abs(ddx) + Math.abs(ddy) * 3 : Math.abs(ddy) + Math.abs(ddx) * 1.5
            if (dist < bd) {
                bd = dist
                best = j
            }
        }
        if (best >= 0) this.tiles[best].focus({ preventScroll: true })
    }
    setMark(i: number) {
        if (i === this.mark) return
        if (this.mark >= 0) this.tiles[this.mark]?.classList.remove("is-mark")
        if (i >= 0) this.tiles[i]?.classList.add("is-mark")
        this.mark = i
    }

    // ---------------------------------------------------------------- open view

    focusables() {
        return [this.prev, this.next, this.linkB, this.actB, this.closeB].filter((el) => !el.hidden) as HTMLElement[]
    }
    viewInteractive(on: boolean) {
        const v = this.view
        if (on) {
            v.removeAttribute("inert")
            v.removeAttribute("aria-hidden")
        } else {
            v.setAttribute("inert", "")
            v.setAttribute("aria-hidden", "true")
        }
        for (const el of [this.prev, this.next, this.closeB, this.actB, this.linkB]) el.tabIndex = on ? 0 : -1
    }
    fillView(k: number, text: boolean) {
        const p = this.o.pics[k]
        if (!p) return
        const total = this.o.pics.length
        const pad2 = (n: number) => String(n).padStart(Math.max(2, String(total).length), "0")
        this.count.textContent = `${pad2(k + 1)} / ${pad2(total)}`
        if (text) {
            this.capT.textContent = p.title || p.alt || `Image ${p.at + 1}`
            this.capS.textContent = p.subtitle
            this.capS.hidden = !p.subtitle
            this.altEl.textContent = p.alt
            this.open.newK = -1
        }
        // one photo: nothing to step through
        const many = total > 1
        this.prev.hidden = this.next.hidden = !many
        this.count.hidden = !many
        const showBtn = this.o.buttonShow && this.o.buttonText !== "" && (!!p.link || this.o.clickable)
        this.linkB.hidden = !(showBtn && !!p.link)
        this.actB.hidden = !(showBtn && !p.link)
        if (p.link) {
            this.linkB.href = p.link
            // another site opens in a new tab, this site in the same one (Framer's Link control gives only the address)
            let foreign = false
            try {
                foreign = new URL(p.link, location.href).origin !== location.origin
            } catch (e) {
                if (!(e instanceof TypeError)) throw e
            }
            if (foreign) {
                this.linkB.target = "_blank"
                this.linkB.rel = "noopener"
            } else {
                this.linkB.removeAttribute("target")
                this.linkB.removeAttribute("rel")
            }
        } else this.linkB.removeAttribute("href")
    }
    layoutView(k: number) {
        const a = this.o.pics[k]?.ratio || 1.5, W = this.W, H = this.H
        if (W >= 860) {
            // very low strips (under 320 px) take a smaller margin, and the photo shrinks before the caption leaves the stage
            const padY = H < 320 ? 12 : 28, rowH = 32, g1 = 12, g2 = 22
            const maxW = Math.min(W * 0.44, 700)
            const free = H - padY * 2 - rowH - g1 - g2 - this.spalteH
            let h = Math.max(H < 560 ? Math.max(32, Math.min(96, free)) : 140, Math.min(H * 0.5, free)), w = h * a
            if (w > maxW) {
                w = maxW
                h = w / a
            }
            const top = Math.max(padY, (H - (rowH + g1 + h + g2 + this.spalteH)) / 2)
            const im = { x: (W - w) / 2, y: top + rowH + g1, w, h }
            const colW = Math.max(w, 360)
            const cx = im.x + (w - colW) / 2
            return { img: im, nav: { x: cx - 9, y: top }, col: { x: cx, y: im.y + h + g2, w: colW }, zu: { x: cx + colW - 23, y: top } }
        }
        const padX = 16, top = 56
        const avail = H - top - this.spalteH - 32
        let w = W - padX * 2, h = w / a
        const maxH = Math.max(H < 560 ? Math.max(32, Math.min(96, avail)) : 150, Math.min(H * 0.52, avail))
        if (h > maxH) {
            h = maxH
            w = h * a
        }
        const im = { x: (W - w) / 2, y: top, w, h }
        return { img: im, nav: { x: padX - 9, y: 12 }, col: { x: padX, y: top + h + 18, w: W - padX * 2 }, zu: { x: W - padX - 23, y: 12 } }
    }
    placeView() {
        const k = this.aktiv ? this.aktiv.k : 0
        this.view.classList.toggle("is-narrow", this.W < 860)
        // a flat stage (a strip): title and subtitle on one line each, so photo, caption and button fit its height
        this.view.classList.toggle("is-flat", this.H < 560)
        for (let n = 0; n < 2; n++) {
            this.cap.style.width = `${r1(this.layoutView(k).col.w)}px`
            this.spalteH = this.cap.offsetHeight || this.spalteH
        }
        const lay = this.layoutView(k)
        this.cap.style.left = `${r1(lay.col.x)}px`
        this.cap.style.top = `${r1(lay.col.y)}px`
        this.nav.style.left = `${r1(lay.nav.x)}px`
        this.nav.style.top = `${r1(lay.nav.y)}px`
        this.closeB.style.left = `${r1(lay.zu.x)}px`
        this.closeB.style.top = `${r1(lay.zu.y)}px`
    }
    stageOf() {
        const lay = this.layoutView(this.aktiv ? this.aktiv.k : 0)
        const x0 = Math.min(lay.img.x, lay.col.x), x1 = Math.max(lay.img.x + lay.img.w, lay.col.x + lay.col.w)
        const y0 = Math.min(lay.img.y, lay.nav.y), y1 = Math.max(lay.img.y + lay.img.h, lay.col.y + this.spalteH)
        const m = this.phone ? 6 : 26
        return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, bx: (x1 - x0) / 2 + m, by: (y1 - y0) / 2 + m }
    }
    openAt(i: number, viaKey: boolean) {
        if (this.open.i >= 0 || i < 0 || !this.tiles[i]) return
        this.inp.forced = i
        this.T.x = this.cxOf(i)
        this.T.y = this.cyOf(i)
        if (this.rm) {
            this.hover = i
            const L0 = this.surfaces[0]
            this.releaseSurface(L0)
            this.assign(L0, i)
            this.aktiv = L0
            this.setMark(-1)
        } else this.setHover(i)
        const L = this.aktiv
        if (!L) return
        L.mode = "detail"
        Object.assign(this.open, { i, phase: 1, t0: this.now(), fade: false, viaKey, newK: -1 })
        this.tiles[i].setAttribute("aria-expanded", "true")
        this.fillView(L.k, true)
        L.imgs.forEach((im) => (im.alt = ""))
        this.view.hidden = false
        this.viewInteractive(true)
        this.veil.classList.add("is-on")
        this.view.classList.add("is-still")
        this.placeView()
        void this.cap.offsetWidth
        this.view.classList.remove("is-still")
        this.open.frozen = this.stageOf()
        if (this.rm) {
            const d = this.layoutView(L.k).img
            L.cx = d.x + d.w / 2
            L.cy = d.y + d.h / 2
            L.w = d.w
            L.h = d.h
        }
        this.swap(L, L.k, this.layoutView(L.k).img.w)
        this.preloadAround(L.k)
        this.wake()
        // by keyboard the first control takes the focus, otherwise the dialog itself (no focus ring after a click)
        window.setTimeout(() => {
            if (!this.alive || this.open.i < 0) return
            if (viaKey) (this.o.pics.length > 1 ? this.prev : this.closeB).focus({ preventScroll: true })
            else this.view.focus({ preventScroll: true })
        }, this.rm ? 0 : 200)
    }
    close() {
        if (this.open.i < 0 || this.open.phase === -1) return
        const L = this.aktiv
        if (L && L.k !== this.kOf[L.tile]) {
            // after browsing: back to the tile with the current photo that lies nearest to the old one
            let j = -1, bd = Infinity
            for (const t of this.inView())
                if (this.kOf[t] === L.k) {
                    const d = (this.cxOf(t) - this.cxOf(L.tile)) ** 2 + (this.cyOf(t) - this.cyOf(L.tile)) ** 2
                    if (d < bd) {
                        bd = d
                        j = t
                    }
                }
            if (j >= 0) {
                this.tiles[L.tile]?.classList.remove("is-under")
                L.tile = j
                this.tiles[j]?.classList.add("is-under")
                this.hover = j
                this.inp.forced = j
                this.T.x = this.cxOf(j)
                this.T.y = this.cyOf(j)
            } else this.open.fade = true
        }
        if (this.rm) this.open.fade = true
        // the focus leaves the view before it becomes inert (FP-3, closed overlay)
        const hadFocus = this.view.contains(document.activeElement)
        if (hadFocus) {
            const f = L && L.tile >= 0 ? this.tiles[L.tile] : this.tiles[this.focusIdx]
            if (f) {
                this.setStop(Number(f.dataset.i))
                f.focus({ preventScroll: true })
            }
        }
        if (this.open.i >= 0) this.tiles[this.open.i]?.setAttribute("aria-expanded", "false")
        this.viewInteractive(false)
        this.open.phase = -1
        this.open.t0 = this.now()
        this.open.frozen = null
        if (L && !this.open.fade) L.mode = "grow"
        this.wake()
    }
    closeNow() {
        if (this.open.i >= 0) this.tiles[this.open.i]?.setAttribute("aria-expanded", "false")
        // the focus leaves the view before it hides (FP-3, closed overlay)
        if (this.view.contains(document.activeElement)) {
            const f = this.tiles[this.focusIdx] || this.tiles[this.inView()[0] ?? 0]
            f?.focus({ preventScroll: true })
        }
        this.view.hidden = true
        this.viewInteractive(false)
        this.veil.classList.remove("is-on")
        this.veil.style.opacity = "0"
        this.wallEl.style.transform = "scale(1)"
        this.open.i = -1
        this.open.phase = 0
        this.open.frozen = null
    }
    finishClose() {
        const L = this.aktiv
        if (this.open.fade && L) {
            this.releaseSurface(L)
            this.aktiv = null
            this.hover = -1
        }
        this.closeNow()
        this.open.fade = false
        if (!this.inp.focus) this.inp.forced = -1
    }
    preloadAround(k: number) {
        const total = this.o.pics.length
        for (const d of [-1, 1]) {
            const j = (k + d + total) % total, p = this.o.pics[j]
            if (!p || !p.src) continue
            const sizes = this.sizesFor(this.layoutView(j).img.w), key = `${j}|${sizes}`
            if (this.preload.has(key)) continue
            const ld = loadPic(p.src, p.set, sizes, (kind) => this.reportLoad(j, kind))
            this.preload.set(key, ld.cancel)
        }
    }
    browse(d: number) {
        if (this.open.i < 0 || this.open.phase === -1 || !this.aktiv) return
        const L = this.aktiv, total = this.o.pics.length
        // one photo: nothing to browse to
        if (total < 2) return
        L.k = (L.k + d + total) % total
        this.open.browseT = this.now()
        this.open.dir = d
        this.fillView(L.k, false)
        this.open.newK = L.k
        const p = this.o.pics[L.k]
        if (p) this.live.textContent = `${[p.title || p.alt || `Image ${p.at + 1}`, p.subtitle].filter(Boolean).join(". ")}. ${L.k + 1} of ${total}.`
        this.placeView()
        this.swap(L, L.k, this.layoutView(L.k).img.w)
        this.open.frozen = this.stageOf()
        this.preloadAround(L.k)
        this.wake()
    }
    /** the new title and subtitle are set: the caption is measured again, image and clearing follow its height */
    newText() {
        this.fillView(this.open.newK, true)
        this.placeView()
        if (this.open.phase !== -1) this.open.frozen = this.stageOf()
    }
    action = () => {
        if (this.open.i < 0) return
        this.onAction()
    }

    // ---------------------------------------------------------------- clearing

    clearingTarget() {
        if (this.open.frozen) return { ...this.open.frozen, s: 1 }
        const L = this.aktiv
        if (!L || L.mode !== "grow" || this.S < 0.001) return null
        const g = this.grownTarget(L.tile), lab = this.labelH(), S = this.S
        return { x: g.cx, y: g.cy + lab * 0.5, bx: (g.w / 2) * S, by: (g.h / 2 + lab * 0.5) * S, s: S }
    }
    clearingStep(dt: number) {
        const CL = this.CL, z = this.clearingTarget()
        const t = z || { x: CL.x, y: CL.y, bx: 0, by: 0, s: 0 }
        if (z && CL.s < 0.01) {
            CL.x = z.x
            CL.y = z.y
            CL.vx = CL.vy = 0
        }
        if (this.rm) {
            Object.assign(CL, { x: t.x, y: t.y, bx: t.bx, by: t.by, s: t.s, vx: 0, vy: 0, vbx: 0, vby: 0, vs: 0 })
            return false
        }
        const o = CL as unknown as Record<string, number>
        spring(o, "x", "vx", t.x, 170, 1, dt)
        spring(o, "y", "vy", t.y, 170, 1, dt)
        spring(o, "bx", "vbx", t.bx, 170, 1, dt)
        spring(o, "by", "vby", t.by, 170, 1, dt)
        spring(o, "s", "vs", t.s, 170, 1, dt)
        CL.s = clamp(CL.s, 0, 1)
        CL.bx = Math.max(0, CL.bx)
        CL.by = Math.max(0, CL.by)
        return Math.hypot(CL.x - t.x, CL.y - t.y) > 0.3 || Math.abs(CL.bx - t.bx) + Math.abs(CL.by - t.by) > 0.3 || Math.abs(CL.s - t.s) > 0.002
    }

    // ---------------------------------------------------------------- loop

    wake = () => {
        if (!this.raf && this.visible && this.alive) {
            this.lastMs = performance.now()
            this.raf = requestAnimationFrame(this.frame)
        }
    }
    frame = (ms: number) => {
        this.raf = 0
        if (!this.alive) return
        const dt = Math.min(0.034, Math.max(0.001, (ms - this.lastMs) / 1000))
        this.lastMs = ms
        let busy = false
        try {
            busy = this.step(dt)
        } catch {
            // Justified exception to FP-8 (build-notes.md): the engine only runs on the page, never in the editor canvas,
            // and Framer's preview is the published page, so there is no editor to name the reason to. Visitors keep a
            // calm wall: the loop stops and the large surface goes back to its tile.
            this.alive = false
            this.release()
            return
        }
        if (busy && this.visible) this.raf = requestAnimationFrame(this.frame)
        else {
            // a tap holds the drift for 4 s: wake exactly when that hold ends (pointer and focus wake on leaving)
            window.clearTimeout(this.wakeTimer)
            const left = this.inp.holdUntil - this.now()
            if (left > 0) this.wakeTimer = window.setTimeout(this.wake, left * 1000 + 20)
        }
    }
    step(dt: number) {
        const t = this.now(), inp = this.inp
        const user = inp.pointer || inp.focus || inp.holdUntil > t
        const active = this.open.i >= 0 || user
        if (!user && this.open.i < 0) inp.forced = -1
        const Sgoal = active && !this.rm ? 1 : 0
        this.S += (Sgoal - this.S) * (1 - Math.exp(-dt * (Sgoal > this.S ? 6 : 2.4)))
        const P = this.P as unknown as Record<string, number>
        spring(P, "x", "vx", this.T.x, 80, 0.95, dt)
        spring(P, "y", "vy", this.T.y, 80, 0.95, dt)
        let busy = Math.abs(this.S - Sgoal) > 0.002 || Math.hypot(this.P.vx, this.P.vy) > 0.5 || Math.hypot(this.T.x - this.P.x, this.T.y - this.P.y) > 0.4

        // drift: rows move left and right in turn; pointer, focus, a tap and the open view hold them softly
        const drift = clamp(this.o.drift, 0, 40)
        const Dgoal = drift > 0 && !this.rm && this.open.i < 0 && !user ? 1 : 0
        this.D += (Dgoal - this.D) * (1 - Math.exp(-dt * 2.2))
        if (!Dgoal && this.D < 0.02) this.D = 0
        if (this.D > 0) {
            for (let r = 0; r < this.rowOff.length; r++) this.rowOff[r] += (r % 2 ? 1 : -1) * drift * this.D * dt
            this.placeRows()
            if (++this.fillTick % 15 === 0) this.fillNear()
            busy = true
        }

        // choice
        if (this.open.i < 0) {
            if (this.rm) {
                // reduced motion: no springs, the label stands at the tile under the pointer
                if (!user) this.hover = -1
                else if (inp.pointer && inp.forced < 0) this.hover = this.atPlace(this.T.x, this.T.y)
                else if (inp.forced >= 0) this.hover = inp.forced
            } else if (active) this.setHover(this.pick())
            else if (this.hover >= 0) this.setHover(-1)
        }

        // open and close
        let o = 0
        if (this.open.i >= 0) {
            const dur = this.open.phase === -1 ? (this.rm ? 0.18 : 0.4) : this.rm ? 0.22 : 0.55
            const p = clamp((t - this.open.t0) / dur, 0, 1)
            if (this.open.phase === 1) {
                o = ease(p)
                if (p >= 1) this.open.phase = 0
            } else if (this.open.phase === 0) o = 1
            else o = 1 - ease(p)
            if (this.open.phase !== 0 || t - this.open.browseT < 0.4) busy = true
            // always a transform on the wall: switching between none and a scale would rebuild every layer below it
            this.wallEl.style.transform = `scale(${(1 - (this.rm ? 0 : 0.015 * o)).toFixed(4)})`
            this.veil.style.opacity = o.toFixed(3)
            this.textFrame(t, o)
            if (this.open.phase === -1 && p >= 1) {
                this.finishClose()
                o = 0
            }
        }

        // the large surface
        for (const L of this.surfaces) {
            if (L.mode === "idle") continue
            let g: { cx: number; cy: number; w: number; h: number }, k: number, z: number
            if (L.mode === "grow") {
                g = this.grownTarget(L.tile)
                k = 170
                z = 0.97
            } else if (L.mode === "shrink") {
                g = this.tileRect(L.tile)
                k = 140
                z = 1
            } else {
                const d = this.layoutView(L.k).img
                g = { cx: d.x + d.w / 2, cy: d.y + d.h / 2, w: d.w, h: d.h }
                k = 140
                z = 0.96
            }
            if (this.rm) {
                L.cx = g.cx
                L.cy = g.cy
                L.w = g.w
                L.h = g.h
                L.vcx = L.vcy = L.vw = L.vh = 0
            } else {
                const lo = L as unknown as Record<string, number>
                spring(lo, "cx", "vcx", g.cx, k, z, dt)
                spring(lo, "cy", "vcy", g.cy, k, z, dt)
                spring(lo, "w", "vw", g.w, k, z, dt)
                spring(lo, "h", "vh", g.h, k, z, dt)
            }
            const rest = Math.abs(L.w - g.w) < 0.5 && Math.abs(L.h - g.h) < 0.5 && Math.hypot(L.cx - g.cx, L.cy - g.cy) < 0.5 && Math.abs(L.vw) + Math.abs(L.vcx) + Math.abs(L.vcy) < 4
            if (L.mode === "shrink" && rest) {
                this.releaseSurface(L)
                if (this.aktiv === L) this.aktiv = null
                continue
            }
            if (!rest) busy = true
            const op = this.open.fade && L === this.aktiv ? o : 1
            const sty = `${r1(L.cx - L.w / 2)}|${r1(L.cy - L.h / 2)}|${r1(L.w)}|${r1(L.h)}|${op.toFixed(2)}`
            if (sty !== L.last) {
                L.last = sty
                L.el.style.transform = `translate3d(${r1(L.cx - L.w / 2)}px,${r1(L.cy - L.h / 2)}px,0)`
                L.el.style.width = `${r1(L.w)}px`
                L.el.style.height = `${r1(L.h)}px`
                L.el.style.opacity = op < 1 ? op.toFixed(2) : ""
            }
            const ring = L === this.aktiv && inp.focus && inp.keyboard && L.mode === "grow"
            L.el.classList.toggle("is-focus", ring)
        }

        // tiles step aside around a rectangular clearing
        if (this.clearingStep(dt)) busy = true
        const CL = this.CL, c = CL.s > 0.002 || CL.bx > 0.3 ? CL : null
        const ah = this.aktiv ? this.aktiv.tile : -1, gap = this.o.gap
        for (let i = 0; i < this.N; i++) {
            let gx = 0, gy = 0, gs = 1, zl = 0
            if (c && i !== ah) {
                // distance in units of half the clearing plus half the tile and a gap: at 1 the tile is one gap off the edge
                const ax = c.bx + (this.tw[i] * 0.5 + gap) * c.s + 1, ay = c.by + (this.th[i] * 0.5 + gap) * c.s + 1
                const nx = (this.cxOf(i) - c.x) / ax, ny = (this.cyOf(i) - c.y) / ay, ux = Math.abs(nx), uy = Math.abs(ny)
                // each tile steps aside at right angles to the nearest edge: whole pieces of rows lift above and below,
                // beside it the tiles move along their row; only at the corners at a slant
                const wx = clamp((ux - uy) / 0.25 + 1, 0, 1), wy = clamp((uy - ux) / 0.25 + 1, 0, 1)
                const away = (u: number) => (Math.cbrt(u * u * u + 1) - u) / (1 + (u / 3.5) ** 4)
                gx = Math.sign(nx) * away(ux) * ax * wx
                gy = Math.sign(ny) * away(uy) * ay * wy
                const rs = Math.max(ux, uy)
                gs = 1 - 0.08 * this.S * Math.exp(-(((rs - 1.05) / 0.8) ** 2))
                // the nearer a tile hung to the clearing, the higher it lies: all overlaps follow one direction
                zl = rs < 2.4 ? 1 + Math.round((2.4 - rs) * 4) : 0
            }
            if (zl !== this.lastZ[i]) {
                const el = this.tiles[i]
                el.style.zIndex = zl ? String(zl) : ""
                // tiles near the clearing move: there they get their own layer (no repaint per frame), the rest stays flat
                if ((zl > 0) !== (this.lastZ[i] > 0)) el.classList.toggle("is-near", zl > 0)
                this.lastZ[i] = zl
            }
            if (this.rm) {
                this.x[i] = gx
                this.y[i] = gy
                this.s[i] = gs
                this.vx[i] = this.vy[i] = this.vs[i] = 0
            } else {
                // opening fast, closing calmly
                const opening = gx * gx + gy * gy >= this.x[i] * this.x[i] + this.y[i] * this.y[i]
                const kk = opening ? 150 : 34, cz = 2 * (opening ? 0.82 : 1) * Math.sqrt(kk)
                this.vx[i] += (kk * (gx - this.x[i]) - cz * this.vx[i]) * dt
                this.x[i] += this.vx[i] * dt
                this.vy[i] += (kk * (gy - this.y[i]) - cz * this.vy[i]) * dt
                this.y[i] += this.vy[i] * dt
                this.vs[i] += (150 * (gs - this.s[i]) - 22 * this.vs[i]) * dt
                this.s[i] += this.vs[i] * dt
                if (!busy && (Math.abs(this.vx[i]) > 0.3 || Math.abs(this.vy[i]) > 0.3 || Math.abs(gx - this.x[i]) > 0.25 || Math.abs(gy - this.y[i]) > 0.25 || Math.abs(gs - this.s[i]) > 0.002)) busy = true
            }
            // outside the stage a tile is written once on its way out and then left alone until it comes back in view
            // (its springs keep running): fewer style changes per frame on long rings
            const x0 = this.hx(i) + this.x[i], y0 = this.hy[i] + this.y[i], m = this.b
            const seen = !(x0 + this.tw[i] < -m || x0 > this.W + m || y0 + this.th[i] < -m || y0 > this.H + m)
            if (seen || this.shown[i]) this.drawTile(i)
            this.shown[i] = seen ? 1 : 0
        }
        if (this.labelFrame(dt)) busy = true
        return busy || this.D > 0
    }

    /** the label: title and subtitle under the large surface; with reduced motion at the tile under the pointer */
    labelFrame(dt: number) {
        let a = 0, X = 0, Y = 0, k = -1
        if (this.open.i < 0) {
            if (this.rm) {
                const h = this.hover
                if (h >= 0 && (this.inp.pointer || this.inp.focus || this.inp.holdUntil > this.now())) {
                    k = this.kOf[h]
                    a = 1
                    // inside the stage: clamped at the sides, above the tile when there is no room below
                    const lw = this.labelEl.offsetWidth || 160, lh = this.labelEl.offsetHeight || 48
                    X = clamp(this.hx(h), 8, Math.max(8, this.W - lw - 8))
                    Y = this.hy[h] + this.th[h] + 8
                    if (Y + lh > this.H - 8) Y = Math.max(8, this.hy[h] - lh - 8)
                }
                this.setMark(a > 0 && !this.inp.focus ? h : -1)
            } else if (this.aktiv && this.aktiv.mode === "grow") {
                const L = this.aktiv, g = this.grownSize(L.k)
                k = L.k
                a = clamp((Math.max(L.w / g.w, L.h / g.h) - 0.72) / 0.22, 0, 1) * clamp((this.S - 0.5) / 0.5, 0, 1)
                X = L.cx - L.w / 2
                Y = L.cy + L.h / 2 + 12 + (1 - a) * 6
                // never wider than the photo: the clearing makes room for exactly that width
                const mw = `${Math.max(120, Math.round(g.w))}px`
                if (this.labelEl.style.maxWidth !== mw) this.labelEl.style.maxWidth = mw
            }
        }
        if (k >= 0 && k !== this.schK) {
            // out first, then the new text in; an invisible label swaps at once
            this.schF = a < 0.02 || this.rm ? 0 : this.schF - dt / 0.1
            if (this.schF <= 0) {
                this.schF = 0
                this.schK = k
                const p = this.o.pics[k]
                this.labelT.textContent = p?.title || ""
                this.labelS.textContent = p?.subtitle || ""
            }
        } else this.schF = this.rm ? 1 : Math.min(1, this.schF + dt / 0.2)
        this.labelEl.style.transform = `translate3d(${r1(X)}px,${r1(Y)}px,0)`
        this.labelEl.style.opacity = (a * this.schF).toFixed(3)
        this.labelEl.classList.toggle("is-plate", this.rm)
        return a > 0 && (this.schF < 1 || (k >= 0 && k !== this.schK))
    }
    /** the texts of the open view: staggered in; while browsing the old title fades out and the new one in with the photo */
    textFrame(t: number, o: number) {
        const parts = [this.nav, this.closeB, this.cap, this.linkB, this.actB].filter((el) => !el.hidden)
        const b = clamp((t - this.open.browseT) / 0.32, 0, 1)
        const bx = (1 - easeOut(b)) * 14 * this.open.dir
        parts.forEach((el, idx) => {
            let a: number
            if (this.open.phase === -1) a = 1 - clamp((t - this.open.t0) / 0.14, 0, 1)
            else if (this.rm) a = o
            else a = clamp((t - this.open.t0 - 0.16 - 0.045 * idx) / 0.34, 0, 1)
            const inCap = el === this.cap
            let ab = 1
            if (inCap && b < 1) ab = b < 0.4 ? 1 - b / 0.4 : (b - 0.4) / 0.6
            if (inCap && b >= 0.4 && this.open.newK >= 0) this.newText()
            el.style.opacity = (easeOut(a) * ab).toFixed(3)
            el.style.transform = this.rm ? "" : `translate(${inCap ? r1(bx) : 0}px, ${r1((1 - easeOut(a)) * 14)}px)`
        })
    }

    destroy() {
        this.alive = false
        cancelAnimationFrame(this.raf)
        window.clearTimeout(this.wakeTimer)
        this.io?.disconnect()
        this.ro?.disconnect()
        this.mq?.removeEventListener("change", this.onMotion)
        const root = this.root
        root.removeEventListener("pointermove", this.onMove)
        root.removeEventListener("pointerleave", this.onLeave)
        root.removeEventListener("pointerdown", this.onDown)
        root.removeEventListener("pointerup", this.onUp)
        root.removeEventListener("pointercancel", this.onUp)
        root.removeEventListener("click", this.onClick)
        root.removeEventListener("keydown", this.onKey)
        root.removeEventListener("focusin", this.onFocusIn)
        root.removeEventListener("focusout", this.onFocusOut)
        for (const L of this.surfaces) {
            window.clearTimeout(L.tOff)
            for (const c of L.loads) c()
        }
        for (const c of this.preload.values()) c()
        this.preload.clear()
        for (const t of this.tileTimers) window.clearTimeout(t)
        this.tileTimers.clear()
    }
}

// ------------------------------------------------------------------ stylesheet (static, values come as variables)

const SHADOWS: Record<Shadow, { tile: string; surface: string }> = {
    none: { tile: "none", surface: "none" },
    soft: { tile: "0 1px 1px rgba(45,35,25,.10), 0 10px 18px -12px rgba(45,35,25,.45)", surface: "0 2px 4px rgba(45,35,25,.12), 0 14px 26px -16px rgba(45,35,25,.4), 0 34px 70px -26px rgba(45,35,25,.55)" },
    deep: { tile: "0 2px 3px rgba(45,35,25,.16), 0 16px 26px -12px rgba(45,35,25,.6)", surface: "0 3px 6px rgba(45,35,25,.18), 0 20px 34px -16px rgba(45,35,25,.5), 0 46px 90px -28px rgba(45,35,25,.7)" },
}

const CSS = `
.pw{position:relative;overflow:hidden;overflow:clip;background:var(--pw-bg);color:var(--pw-tc);-webkit-user-select:none;user-select:none;touch-action:pan-y;-webkit-tap-highlight-color:transparent}
.pw-stage{position:absolute;inset:0;overflow:hidden;overflow:clip;container-type:size;contain:layout paint}
.pw-wall{position:absolute;inset:0;z-index:0;cursor:pointer;transform-origin:50% 50%;transform:scale(1);will-change:transform;--pw-b:max(24px,calc((100cqh - var(--pw-rows) * var(--pw-gap)) / var(--pw-rows)),calc((100cqw + 2 * var(--pw-gap)) / var(--pw-k)))}
.pw-wall:focus{outline:none}
.pw-row{position:absolute;left:0;top:0;width:0;height:0;will-change:transform}
.pw-tile{position:absolute;left:0;top:0;width:calc(var(--pw-b) * var(--a));height:var(--pw-b);padding:0;margin:0;border:1px solid rgba(31,28,24,.07);border-radius:var(--pw-r);background:rgba(31,28,24,.06);overflow:hidden;cursor:pointer;transform-origin:50% 50%;box-shadow:var(--pw-tsh);font:inherit;color:inherit;-webkit-appearance:none;appearance:none;transition:opacity .25s ease;-webkit-tap-highlight-color:transparent}
.pw-tile img{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}
.pw-tile img.is-broken{visibility:hidden}
.pw-tile.is-under{opacity:0}
.pw-tile.is-near{will-change:transform}
.pw-tile:focus{outline:none}
.pw-rm .pw-tile.is-mark,.pw-rm .pw-tile:focus-visible{outline:2px solid var(--pw-tc);outline-offset:3px}
.pw-veil{position:absolute;inset:0;background:var(--pw-veil);opacity:0;pointer-events:none}
.pw-veil.is-on{pointer-events:auto}
.pw-surfaces{position:absolute;inset:0;pointer-events:none}
.pw-surface{position:absolute;left:0;top:0;display:none;border-radius:var(--pw-r);overflow:hidden;background:rgba(31,28,24,.06);border:1px solid rgba(31,28,24,.08);box-shadow:var(--pw-ssh)}
.pw-surface.is-on{display:block}
.pw-surface img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .32s ease;-webkit-user-drag:none}
.pw-surface img.is-off{opacity:0}
.pw-surface.is-focus{outline:2px solid var(--pw-tc);outline-offset:4px}
.pw-label{position:absolute;left:0;top:0;pointer-events:none;opacity:0;white-space:nowrap;max-width:min(560px,80cqw)}
.pw-label.is-plate{max-width:min(360px,80cqw)!important}
.pw-label b,.pw-label span{overflow:hidden;text-overflow:ellipsis}
.pw-label b{display:block;font-family:var(--pw-tf);font-weight:var(--pw-tw);font-style:var(--pw-ts);font-size:20px;line-height:24px;letter-spacing:var(--pw-tk);color:var(--pw-tc)}
.pw-label span{display:block;margin-top:2px;font-family:var(--pw-uf);font-weight:var(--pw-uw);font-style:var(--pw-us);font-size:12.5px;line-height:18px;letter-spacing:var(--pw-uk);color:var(--pw-uc)}
.pw-label.is-plate{background:var(--pw-bg);padding:6px 10px 7px;border-radius:3px;box-shadow:0 6px 16px -8px rgba(45,35,25,.4)}
.pw-view{position:absolute;inset:0;pointer-events:none}
.pw-view[hidden]{display:none}
.pw-view:focus{outline:none}
.pw-nav,.pw-close,.pw-cap{position:absolute;left:0;top:0;pointer-events:auto;transition:left .34s cubic-bezier(.2,.7,.2,1),top .34s cubic-bezier(.2,.7,.2,1),width .34s cubic-bezier(.2,.7,.2,1)}
.pw-view.is-still .pw-nav,.pw-view.is-still .pw-close,.pw-view.is-still .pw-cap{transition:none}
.pw-nav{display:flex;align-items:center}
.pw-nk{position:relative;width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:var(--pw-uc);display:inline-grid;place-items:center;cursor:pointer;padding:0;margin:0;font:inherit;-webkit-appearance:none;appearance:none;transition:color .15s,background-color .15s;-webkit-tap-highlight-color:transparent}
.pw-nk svg{width:15px;height:15px;display:block}
.pw-count{font-family:var(--pw-uf);font-size:12px;line-height:1;letter-spacing:.04em;color:var(--pw-uc);font-variant-numeric:tabular-nums;min-width:4.4em;text-align:center}
.pw-cap{display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:14px 28px}
.pw-cap-x{min-width:0}
.pw-cap-t{margin:0;font-family:var(--pw-tf);font-weight:var(--pw-tw);font-style:var(--pw-ts);font-size:var(--pw-tz);line-height:var(--pw-tl);letter-spacing:var(--pw-tk);color:var(--pw-tc);overflow-wrap:anywhere}
.pw-cap-s{margin:6px 0 0;font-family:var(--pw-uf);font-weight:var(--pw-uw);font-style:var(--pw-us);font-size:var(--pw-uz);line-height:var(--pw-ul);letter-spacing:var(--pw-uk);color:var(--pw-uc);overflow-wrap:anywhere}
.pw-btn{flex:none;display:inline-flex;align-items:center;height:42px;padding:0 18px;margin:0;border:0;border-radius:var(--pw-kr);font-family:var(--pw-uf);font-weight:500;font-size:14px;line-height:1;text-decoration:none;cursor:pointer;-webkit-appearance:none;appearance:none;transition:background-color .15s,color .15s,border-color .15s,opacity .15s;-webkit-tap-highlight-color:transparent}
.pw-btn[hidden],.pw-nk[hidden],.pw-count[hidden]{display:none!important}
.pw-btn.is-fill{background:var(--pw-kc);color:var(--pw-kt)}
.pw-btn.is-line{background:transparent;border:1px solid var(--pw-kc);color:var(--pw-kc)}
.pw-btn.is-link{height:auto;padding:0 0 3px;border-radius:0;background:transparent;color:var(--pw-kc);border-bottom:1px solid color-mix(in srgb,var(--pw-kc) 40%,transparent)}
@media (hover:hover){.pw-nk:hover{color:var(--pw-tc);background:color-mix(in srgb,var(--pw-tc) 7%,transparent)}.pw-btn.is-fill:hover{opacity:.86}.pw-btn.is-line:hover{background:color-mix(in srgb,var(--pw-kc) 8%,transparent)}.pw-btn.is-link:hover{border-bottom-color:var(--pw-kc)}}
.pw-nk:focus-visible,.pw-btn:focus-visible{outline:2px solid var(--pw-tc);outline-offset:2px}
.pw-nk:focus:not(:focus-visible),.pw-btn:focus:not(:focus-visible){outline:none}
.pw-tip{position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%);padding:5px 9px;border-radius:6px;background:var(--pw-tc);color:var(--pw-bg);font-family:var(--pw-uf);font-size:12px;line-height:1.2;white-space:nowrap;opacity:0;visibility:hidden;pointer-events:auto;transition:opacity .15s ease 0s,visibility 0s .15s;z-index:2}
@media (hover:hover){.pw-nk:hover .pw-tip{opacity:1;visibility:visible;transition:opacity .15s ease .4s,visibility 0s .4s}}
.pw-nk:focus-visible .pw-tip{opacity:1;visibility:visible;transition:opacity .15s ease 0s,visibility 0s 0s}
.pw-close .pw-tip{left:auto;right:0;transform:none}
.pw-prev .pw-tip{left:0;transform:none}
.pw-view.is-narrow .pw-cap{flex-direction:column;align-items:flex-start}
.pw-view.is-narrow .pw-cap-t{font-size:calc(var(--pw-tz) * .82)}
.pw-cap-t{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
.pw-view.is-narrow .pw-cap-t{-webkit-line-clamp:2}
.pw-view.is-flat .pw-cap-t{-webkit-line-clamp:1;font-size:calc(var(--pw-tz) * .82)}
.pw-view.is-flat .pw-cap-s{-webkit-line-clamp:1}
.pw-view.is-flat.is-narrow .pw-cap{flex-direction:row;align-items:flex-end}
.pw-view.is-flat .pw-cap-x{flex:1 1 auto;min-width:min(50%,240px)}
.pw-view.is-flat .pw-cap{flex-wrap:wrap}
.pw-cap-s{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.pw-btn{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pw-btn.is-fill,.pw-btn.is-line{display:inline-block;line-height:42px}
.pw-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.pw-hint{position:absolute;left:12px;bottom:12px;z-index:5;max-width:calc(100% - 24px);padding:8px 11px;border-radius:8px;background:rgba(20,19,18,.86);color:#F4F1EA;font:500 12px/1.4 system-ui,sans-serif;pointer-events:none}
@media (prefers-reduced-motion:reduce){.pw-tile,.pw-surface img,.pw-nav,.pw-close,.pw-cap,.pw-nk,.pw-btn,.pw-tip{transition:none!important}}
`

// ------------------------------------------------------------------ component

const ICON_PREV = "M9.5 3.5 5 8l4.5 4.5"
const ICON_NEXT = "m6.5 3.5 4.5 4.5-4.5 4.5"
const ICON_CLOSE = "M4 4l8 8M12 4l-8 8"
function Icon({ d }: { d: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3} aria-hidden="true" focusable="false">
            <path d={d} />
        </svg>
    )
}
/** React 18 writes inert only as text; the closed view starts inert (FP-3, closed overlay) */
const INERT = { inert: "" } as unknown as { inert: boolean }

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 * @framerDisableUnlink
 */
export default function PartingWall(props: Props) {
    const { images, onClick, wall, openView, button, behavior, labels, style } = props
    // the thumbnail is a still too (RenderTarget only for this special case and for the editor's notes)
    const isStatic = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.thumbnail
    // the switch for motion is useIsStaticRenderer(); RenderTarget only tells the editor canvas (hints) from the export
    const onCanvas = isStatic && RenderTarget.current() === RenderTarget.canvas
    const uid = useId().replace(/:/g, "")
    const rootRef = useRef<HTMLDivElement>(null)
    const engRef = useRef<Engine | null>(null)
    const ownSheet = useSharedSheet(rootRef)

    // a new list with the same content counts as the same input (compared once per new list, FP-15)
    const listRef = useRef<ItemProps[] | undefined>(images)
    if (!sameImages(listRef.current, images)) listRef.current = images
    const list = listRef.current
    const { pics, demo, problems } = useMemo(() => picsOf(list), [list])

    // own images without a known format stay 3:2 and are cropped: a later measurement would shift the whole wall
    const ratios = useMemo(() => pics.map((p) => p.ratio), [pics])

    const rows = clamp(Math.round(num(wall?.rows, DEFAULTS.rows)), 4, MAX_ROWS)
    const gap = clamp(num(wall?.gap, DEFAULTS.gap), 0, 32)
    const drift = clamp(num(wall?.drift, DEFAULTS.drift), 0, 12)
    const hoverSize = clamp(num(behavior?.hoverSize, DEFAULTS.hoverSize), 140, 420)
    const touch: Touch = behavior?.touch === "open" ? "open" : "preview"
    const shadow: Shadow = wall?.shadow === "none" || wall?.shadow === "deep" ? wall.shadow : "soft"
    const buttonShow = button?.show !== false
    const buttonStyle: ButtonStyle = button?.style === "line" || button?.style === "link" ? button.style : "fill"
    // the gap in tile heights only sets how many tiles a row needs; an 800 px stage is the estimate before measuring
    const gapB = gap / Math.max(24, (800 - rows * gap) / rows)
    const hanging = useMemo(() => hangingOf(ratios, rows, gapB, COVER), [ratios, rows, gapB])

    const [loadIssues, setLoadIssues] = useState<Record<number, LoadKind>>({})
    // one note per picture; "did not load" outranks "is too slow to load"
    // notes are only shown in the editor canvas; elsewhere a report changes nothing (no render of the whole wall)
    const canvasRef = useRef(onCanvas)
    canvasRef.current = onCanvas
    const report = useRef((k: number, kind: LoadKind) => {
        if (canvasRef.current) setLoadIssues((m) => (m[k] === kind || m[k] === "load" ? m : { ...m, [k]: kind }))
    })

    // one listener for the failed pictures of all tiles (error does not bubble, capture does): the tile stays a calm
    // surface, the editor names the image (FP-12)
    useEffect(() => {
        const wallEl = rootRef.current?.querySelector(".pw-wall")
        if (!wallEl) return
        const onError = (e: Event) => {
            const img = e.target
            if (!(img instanceof HTMLImageElement)) return
            const k = Number(img.getAttribute("data-k"))
            img.classList.add("is-broken")
            if (Number.isFinite(k)) report.current(k, "load")
        }
        wallEl.addEventListener("error", onError, true)
        // in the editor canvas no engine runs: a picture still missing after the time limit is named there (FP-4, FP-12)
        const slow = onCanvas
            ? window.setTimeout(() => {
                  const box = wallEl.getBoundingClientRect()
                  for (const img of wallEl.querySelectorAll("img")) {
                      const k = Number(img.getAttribute("data-k")), r = img.getBoundingClientRect()
                      const seen = r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom
                      if (seen && img.getAttribute("src") && !img.complete && Number.isFinite(k)) report.current(k, "slow")
                  }
              }, LOAD_LIMIT)
            : 0
        return () => {
            wallEl.removeEventListener("error", onError, true)
            window.clearTimeout(slow)
        }
    }, [onCanvas])

    const clickable = typeof onClick === "function"
    const btnText = str(button?.text).trim()
    const options: Options = useMemo(() => ({ pics, hanging, rows, gap, drift, hoverSize, touch, buttonShow, buttonText: btnText, clickable }), [pics, hanging, rows, gap, drift, hoverSize, touch, buttonShow, btnText, clickable])
    const onClickRef = useRef(onClick)
    onClickRef.current = onClick

    // the engine lives with the element; options reach it without rebuilding
    // deps: the engine is built once per element; options and hanging arrive through setOptions below
    useBrowserLayoutEffect(() => {
        const root = rootRef.current
        if (isStatic || !root) return
        const eng = new Engine(root, options, () => onClickRef.current?.(), (k, kind) => report.current(k, kind))
        engRef.current = eng
        return () => {
            eng.destroy()
            engRef.current = null
        }
    }, [isStatic])
    useBrowserLayoutEffect(() => {
        engRef.current?.setOptions(options)
    }, [options])

    const titleFont = fontCss(openView?.title, { lineHeight: "1.06em", letterSpacing: "-0.01em", weight: "500" })
    const subFont = fontCss(openView?.subtitle, { lineHeight: "1.4em", letterSpacing: "0em", weight: "400" })
    const vars = {
        "--pw-bg": str(wall?.color) || DEFAULTS.color,
        "--pw-rows": String(rows),
        "--pw-k": String(r4(ringK(hanging))),
        "--pw-gap": `${gap}px`,
        "--pw-r": radiusCss(wall?.radius, DEFAULTS.radius),
        "--pw-tsh": SHADOWS[shadow].tile,
        "--pw-ssh": SHADOWS[shadow].surface,
        "--pw-tf": titleFont.family,
        "--pw-tw": titleFont.weight,
        "--pw-ts": titleFont.style,
        "--pw-tz": `${fontPx(openView?.title, 34)}px`,
        "--pw-tl": titleFont.lineHeight,
        "--pw-tk": titleFont.letterSpacing,
        "--pw-tc": str(openView?.titleColor) || DEFAULTS.titleColor,
        "--pw-uf": subFont.family,
        "--pw-uw": subFont.weight,
        "--pw-us": subFont.style,
        "--pw-uz": `${fontPx(openView?.subtitle, 14)}px`,
        "--pw-ul": subFont.lineHeight,
        "--pw-uk": subFont.letterSpacing,
        "--pw-uc": str(openView?.subColor) || DEFAULTS.subColor,
        "--pw-veil": str(openView?.veil) || DEFAULTS.veil,
        "--pw-kc": str(button?.color) || DEFAULTS.buttonColor,
        "--pw-kt": str(button?.textColor) || DEFAULTS.buttonTextColor,
        "--pw-kr": radiusCss(button?.radius, DEFAULTS.buttonRadius),
    } as CSSProperties

    const name = str(labels?.name) || "Photo wall"
    const lClose = str(labels?.close) || "Close"
    const lPrev = str(labels?.previous) || "Previous"
    const lNext = str(labels?.next) || "Next"

    // hints only in the editor canvas: demo, images from elsewhere (FP-5), loading problems (FP-12)
    const hints: string[] = []
    if (onCanvas) {
        if (demo) hints.push("Demo images. Add your own under Images.")
        for (const p of problems) hints.push(`Image ${p.i + 1} is not from Framer's image picker.`)
    }
    if (!demo && !pics.length && onCanvas) hints.push("Add images under Images.")
    // Framer's preview and the published page share one render target: visitors never see a note (FP-12)
    if (onCanvas) {
        for (const [k, kind] of Object.entries(loadIssues)) hints.push(`Image ${(pics[Number(k)]?.at ?? Number(k)) + 1} ${kind === "slow" ? "is too slow to load" : kind === "odd" ? "failed unexpectedly" : "did not load"}.`)
    }

    const bEst = Math.max(24, (900 - rows * gap) / rows)
    // a new hanging gets new elements: a tile's picture set by the engine never stays at a place that shows another photo
    const layoutRef = useRef({ hanging, key: 0 })
    if (layoutRef.current.hanging !== hanging) layoutRef.current = { hanging, key: layoutRef.current.key + 1 }
    const layoutKey = layoutRef.current.key
    // the first tile in view on the server: row 1 (the first full row), the leftmost tile on stage
    let stop = -1
    let flat = 0
    const tilesJsx = hanging.map((row, r) => {
        const slots = row.slots.map((sl) => {
            const i = flat++
            const p = pics[sl.k]
            // left edge in tile heights and gaps: A + n gaps, minus the hidden margin; the row layer adds its offset
            const left = `calc(var(--pw-b) * ${r4(sl.A - PAD_B)} + var(--pw-gap) * ${sl.n - 1})`
            const top = `calc(var(--pw-b) * ${r - 1} + var(--pw-gap) * ${r - 0.5})`
            if (stop < 0 && r === 1 && sl.A + row.off - PAD_B > 0) stop = i
            // the first view of a 16:9 stage: from one tile height left of it to its right edge (the engine fills the rest)
            const near = r >= 1 && r <= rows && sl.A + row.off - PAD_B + sl.a > -1 && sl.A + row.off - PAD_B < (16 / 9) * rows * (1 + gapB) + 1
            return (
                <button
                    key={`${layoutKey}:${i}`}
                    type="button"
                    className="pw-tile"
                    data-i={i}
                    tabIndex={i === stop && p ? 0 : -1}
                    disabled={!p}
                    aria-label={p ? p.name : `Image ${sl.k + 1}`}
                    aria-haspopup="dialog"
                    aria-expanded="false"
                    aria-controls={`${uid}-view`}
                    aria-describedby={`${uid}-keys`}
                    style={{ "--a": String(r4(sl.a)), transform: `translate3d(${left},${top},0)` } as CSSProperties}
                >
                    {p ? (
                        // the first view loads at once (srcset before src, sizes from an 900 px stage); the engine fills
                        // the rest as they come near, so nothing waits on the browser's lazy loading in a clipped stage
                        near ? (
                            <img alt="" data-k={sl.k} loading="lazy" sizes={`${Math.round(sl.a * bEst)}px`} srcSet={p.tileSet || undefined} src={p.src} decoding="async" draggable={false} />
                        ) : (
                            <img alt="" data-k={sl.k} decoding="async" draggable={false} />
                        )
                    ) : null}
                </button>
            )
        })
        return (
            <div key={`${layoutKey}:${r}`} className="pw-row" style={{ transform: `translate3d(calc(var(--pw-b) * ${r4(row.off)}),0,0)` }}>
                {slots}
            </div>
        )
    })

    return (
        <div ref={rootRef} className="pw" style={{ ...style, ...vars }}>
            {/* static stylesheet: a module constant, no props or CMS values (FP-20); once per page (FP-21) */}
            {ownSheet ? <style dangerouslySetInnerHTML={{ __html: CSS }} /> : null}
            <div className="pw-stage">
                <div className="pw-wall" role="group" aria-label={name}>
                    {tilesJsx}
                </div>
                <p className="pw-sr" id={`${uid}-keys`}>
                    Arrow keys move between photos.
                </p>
                <div className="pw-veil" aria-hidden="true" />
                <div className="pw-surfaces" aria-hidden="true">
                    {[0, 1, 2].map((s) => (
                        <div key={s} className="pw-surface">
                            {[0, 1, 2].map((n) => (
                                <img key={n} alt="" className={n ? "is-off" : undefined} decoding="async" draggable={false} />
                            ))}
                        </div>
                    ))}
                </div>
                <div className="pw-label" aria-hidden="true">
                    <b />
                    <span />
                </div>
                <div className="pw-view" id={`${uid}-view`} role="dialog" aria-modal="true" aria-labelledby={`${uid}-title`} aria-describedby={`${uid}-alt`} tabIndex={-1} hidden aria-hidden="true" {...INERT}>
                    <p className="pw-sr pw-alt" id={`${uid}-alt`} />
                    <p className="pw-sr pw-live" aria-live="polite" />
                    <div className="pw-nav" role="group" aria-label="Browse">
                        <button type="button" className="pw-nk pw-prev" aria-label={lPrev} tabIndex={-1} onClick={() => engRef.current?.browse(-1)}>
                            <Icon d={ICON_PREV} />
                            <span className="pw-tip" aria-hidden="true">
                                {lPrev}
                            </span>
                        </button>
                        <span className="pw-count" />
                        <button type="button" className="pw-nk pw-next" aria-label={lNext} tabIndex={-1} onClick={() => engRef.current?.browse(1)}>
                            <Icon d={ICON_NEXT} />
                            <span className="pw-tip" aria-hidden="true">
                                {lNext}
                            </span>
                        </button>
                    </div>
                    <div className="pw-cap">
                        <div className="pw-cap-x">
                            <h2 className="pw-cap-t" id={`${uid}-title`} />
                            <p className="pw-cap-s" />
                        </div>
                        <a className={`pw-btn is-${buttonStyle}`} tabIndex={-1} hidden>
                            {btnText}
                        </a>
                        <button type="button" className={`pw-btn is-${buttonStyle}`} tabIndex={-1} hidden onClick={() => engRef.current?.action()}>
                            {btnText}
                        </button>
                    </div>
                    <button type="button" className="pw-nk pw-close" aria-label={lClose} tabIndex={-1} onClick={() => engRef.current?.close()}>
                        <Icon d={ICON_CLOSE} />
                        <span className="pw-tip" aria-hidden="true">
                            {lClose}
                        </span>
                    </button>
                </div>
                {hints.length ? <div className="pw-hint">{hints.slice(0, 3).join(" ")}</div> : null}
            </div>
        </div>
    )
}

/** one stylesheet per page for all walls (FP-21): the server HTML, the static export and the first frame carry each
 * wall's own copy, so it is styled before any script runs; once mounted, only the first wall keeps its copy (inside its
 * own element, FP-16), the others drop theirs before the first paint, and when that wall leaves, the next one takes over. */
const sheetHolders = new Map<Document, Array<(own: boolean) => void>>()
function useSharedSheet(ref: { current: HTMLElement | null }) {
    const [own, setOwn] = useState(true)
    useBrowserLayoutEffect(() => {
        const doc = ref.current?.ownerDocument
        if (!doc) return
        const list = sheetHolders.get(doc) ?? []
        sheetHolders.set(doc, list)
        list.push(setOwn)
        setOwn(list[0] === setOwn)
        return () => {
            const i = list.indexOf(setOwn)
            if (i >= 0) list.splice(i, 1)
            if (i === 0 && list.length) list[0](true)
            if (!list.length) sheetHolders.delete(doc)
        }
    }, [ref])
    return own
}

addPropertyControls(PartingWall, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: MAX_IMAGES,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: { type: ControlType.String, title: "Alt Text", defaultValue: "", description: "Empty: the image's own alt text." },
                title: { type: ControlType.String, title: "Title", defaultValue: "" },
                subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: [],
    },
    onClick: { type: ControlType.EventHandler, title: "On Click", description: "Fires on the button of an open image without a link." },
    wall: {
        type: ControlType.Object,
        title: "Wall",
        buttonTitle: "Rows & Drift",
        controls: {
            rows: { type: ControlType.Number, title: "Rows", min: 4, max: 14, step: 1, displayStepper: true, defaultValue: DEFAULTS.rows },
            drift: { type: ControlType.Number, title: "Drift", min: 0, max: 12, step: 1, defaultValue: DEFAULTS.drift, description: "Pixels per second." },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 32, step: 1, unit: "px", defaultValue: DEFAULTS.gap },
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: DEFAULTS.radius },
            shadow: { type: ControlType.Enum, title: "Shadow", options: ["none", "soft", "deep"], optionTitles: ["None", "Soft", "Deep"], displaySegmentedControl: true, defaultValue: DEFAULTS.shadow },
            color: { type: ControlType.Color, title: "Backdrop", defaultValue: DEFAULTS.color },
        },
    },
    openView: {
        type: ControlType.Object,
        title: "Caption",
        buttonTitle: "Fonts & Veil",
        controls: {
            title: { type: ControlType.Font, title: "Title", controls: "extended", defaultFontType: "sans-serif", defaultValue: { variant: "Medium", fontSize: 34, lineHeight: "1.06em", letterSpacing: "-0.01em" } },
            titleColor: { type: ControlType.Color, title: "Title Color", defaultValue: DEFAULTS.titleColor, description: "Also the label under the large image." },
            subtitle: { type: ControlType.Font, title: "Subtitle", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 14, lineHeight: "1.4em", letterSpacing: "0em" } },
            subColor: { type: ControlType.Color, title: "Sub Color", defaultValue: DEFAULTS.subColor },
            veil: { type: ControlType.Color, title: "Veil", defaultValue: DEFAULTS.veil },
        },
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        buttonTitle: "Style",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", enabledTitle: "Yes", disabledTitle: "No", defaultValue: true, description: "Shows with a Link or On Click." },
            text: { type: ControlType.String, title: "Text", defaultValue: DEFAULTS.buttonText, hidden: (p: { show?: boolean }) => p.show === false },
            style: { type: ControlType.Enum, title: "Style", options: ["fill", "line", "link"], optionTitles: ["Fill", "Line", "Link"], displaySegmentedControl: true, defaultValue: "fill", hidden: (p: { show?: boolean }) => p.show === false },
            color: { type: ControlType.Color, title: "Color", defaultValue: DEFAULTS.buttonColor, hidden: (p: { show?: boolean }) => p.show === false },
            textColor: { type: ControlType.Color, title: "Text Color", defaultValue: DEFAULTS.buttonTextColor, hidden: (p: { show?: boolean; style?: ButtonStyle }) => p.show === false || (p.style !== undefined && p.style !== "fill") },
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: DEFAULTS.buttonRadius, hidden: (p: { show?: boolean; style?: ButtonStyle }) => p.show === false || p.style === "link" },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        buttonTitle: "Hover & Touch",
        controls: {
            hoverSize: { type: ControlType.Number, title: "Hover Size", min: 140, max: 420, step: 10, unit: "px", defaultValue: DEFAULTS.hoverSize, description: "Height of the large image, smaller in short walls." },
            touch: { type: ControlType.Enum, title: "Touch", options: ["preview", "open"], optionTitles: ["Preview", "Open"], displaySegmentedControl: true, defaultValue: DEFAULTS.touch, description: "Preview: the first tap enlarges, the second opens." },
        },
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        buttonTitle: "Name & Buttons",
        controls: {
            name: { type: ControlType.String, title: "Name", defaultValue: "Photo wall", description: "For screen readers; each wall on a page needs its own." },
            close: { type: ControlType.String, title: "Close", defaultValue: "Close" },
            previous: { type: ControlType.String, title: "Previous", defaultValue: "Previous" },
            next: { type: ControlType.String, title: "Next", defaultValue: "Next" },
        },
    },
})

PartingWall.displayName = "Flowing Gallery"
