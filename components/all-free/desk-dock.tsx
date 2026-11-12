// Dock — Framer code component (free version)
// A desktop-style dock for portfolios: icons magnify as the cursor passes,
// show tooltips, bounce when clicked, and link anywhere.
// 15 original app-style icons (the calendar shows today's date), or your own images.
// No Apple artwork.
// v1.1: static render on canvas/export, reduced-motion support, keyboard + screen-reader access.
//
// Paste into Framer: Assets → Code → + → New code file → replace contents → Save.

import { useId, useMemo, useRef, useState, type CSSProperties } from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useAnimationControls,
    useReducedMotion,
    AnimatePresence,
    MotionValue,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Glyph =
    | "browser"
    | "calendar"
    | "gallery"
    | "home"
    | "work"
    | "about"
    | "mail"
    | "folder"
    | "notes"
    | "music"
    | "camera"
    | "chat"
    | "settings"
    | "trash"
    | "link"

type Img = { src: string; srcSet?: string; alt?: string }

type Item = {
    label?: string
    glyph?: Glyph
    image?: Img
    link?: string
    newTab?: boolean
    active?: boolean
    divider?: boolean
}

type Props = {
    items: Item[]
    iconSize: number
    maxSize: number
    distance: number
    gap: number
    padding: number
    radius: number
    background: string
    border: string
    blur: number
    shadow: boolean
    tooltips: boolean
    tooltipBg: string
    tooltipText: string
    dotColor: string
    bounce: boolean
    font: any
    style?: CSSProperties
}

// ---------- App icon set (original artwork built to iOS app-icon conventions, 100×100)
// Tokens: "ID-" unique prefix, __WD__ weekday, __DD__ day number (calendar shows today live).
const APP_ICONS: Record<string, string> = {
    mail: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#FF8A6B" stop-opacity="1"/><stop offset="1" stop-color="#F23D3D" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-env" gradientUnits="userSpaceOnUse" x1="0" y1="28" x2="0" y2="73"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#F1F2F6" stop-opacity="1"/></linearGradient><linearGradient id="ID-flap" gradientUnits="userSpaceOnUse" x1="0" y1="28" x2="0" y2="56"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#E3E6EC" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)">\n  <rect x="17" y="28" width="66" height="45" rx="7" fill="url(#ID-env)"/>\n  <path d="M18.5 70.5 43 50M81.5 70.5 57 50" stroke="#DADDE4" stroke-width="1.4"/>\n  <path d="M18 31.5a5 5 0 0 1 3.4-3.3H78.6a5 5 0 0 1 3.4 3.3L54.2 54a6.6 6.6 0 0 1-8.4 0z" fill="url(#ID-flap)"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    chat: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#5FD0FF" stop-opacity="1"/><stop offset="1" stop-color="#1A7CF5" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-bub" gradientUnits="userSpaceOnUse" x1="0" y1="21" x2="0" y2="81"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#EAF3FF" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)">\n  <path d="M50 21C31.8 21 17 32.9 17 47.6c0 8.6 5 16.2 12.9 21-.6 4.4-2.9 8.6-6.4 11.4-.6.5-.2 1.4.6 1.4 6.6-.2 12.3-3 16.1-6.6 3.1.8 6.4 1.2 9.8 1.2 18.2 0 33-11.9 33-26.6S68.2 21 50 21z" fill="url(#ID-bub)"/>\n  <circle cx="37" cy="48" r="4" fill="#1A7CF5"/><circle cx="50" cy="48" r="4" fill="#1A7CF5" opacity=".75"/><circle cx="63" cy="48" r="4" fill="#1A7CF5" opacity=".5"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    browser:
        '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#5B8CFF" stop-opacity="1"/><stop offset="1" stop-color="#2237D8" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-gl" gradientUnits="userSpaceOnUse" x1="0" y1="22" x2="0" y2="78"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#DCE6FF" stop-opacity="1"/></linearGradient><radialGradient id="ID-gs" gradientUnits="userSpaceOnUse" cx="40" cy="36" r="34"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)" fill="none" stroke="url(#ID-gl)" stroke-width="3.4" stroke-linecap="round">\n  <circle cx="50" cy="50" r="28"/>\n  <ellipse cx="50" cy="50" rx="12" ry="28"/>\n  <path d="M22 50h56M26 36h48M26 64h48"/>\n</g>\n<circle cx="50" cy="50" r="28" fill="url(#ID-gs)"/>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    calendar:
        '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#F1F2F5" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n</defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<text x="50" y="33" text-anchor="middle" font-family="Inter, -apple-system, \'Segoe UI\', Roboto, sans-serif" font-size="13.5" font-weight="700" letter-spacing=".6" fill="#3A6FF7">__WD__</text>\n<text x="50" y="76" text-anchor="middle" font-family="Inter, -apple-system, \'Segoe UI\', Roboto, sans-serif" font-size="44" font-weight="300" letter-spacing="-1.5" fill="#1C1C1E">__DD__</text>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    gallery:
        '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#F0F1F4" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-sky" gradientUnits="userSpaceOnUse" x1="0" y1="33" x2="0" y2="75"><stop offset="0" stop-color="#6EC6FF" stop-opacity="1"/><stop offset="1" stop-color="#B9E4FF" stop-opacity="1"/></linearGradient><linearGradient id="ID-mtn" gradientUnits="userSpaceOnUse" x1="0" y1="52" x2="0" y2="75"><stop offset="0" stop-color="#3FB27F" stop-opacity="1"/><stop offset="1" stop-color="#2A8F63" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-soft)">\n  <rect x="25" y="24" width="50" height="44" rx="6" fill="#FFB34D" transform="rotate(-10 50 50)"/>\n  <rect x="25" y="24" width="50" height="44" rx="6" fill="#FF7FA8" transform="rotate(7 50 50)"/>\n</g>\n<g filter="url(#ID-ds)">\n  <rect x="22" y="30" width="56" height="48" rx="7" fill="#fff"/>\n  <rect x="25.5" y="33.5" width="49" height="41" rx="4.5" fill="url(#ID-sky)"/>\n  <circle cx="63" cy="44" r="5" fill="#FFE27A"/>\n  <path d="M25.5 68 39 52.5a2 2 0 0 1 3 0L51 63l6-6a2 2 0 0 1 2.8 0L74.5 71v-.5a4 4 0 0 1-4 4H30a4.5 4.5 0 0 1-4.5-4.5z" fill="url(#ID-mtn)"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    notes: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#F0F1F4" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-stk" gradientUnits="userSpaceOnUse" x1="0" y1="22" x2="0" y2="78"><stop offset="0" stop-color="#FFE77A" stop-opacity="1"/><stop offset="1" stop-color="#FFCF3A" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)" transform="rotate(-4 50 50)">\n  <path d="M22 22h56v42L64 78H22z" fill="url(#ID-stk)"/>\n  <path d="M64 78V68a4 4 0 0 1 4-4h10z" fill="#E9B320"/>\n  <path d="M30 36c4-2 7 2 11 0s7-2 11 0 7 2 11 0M30 47c4-2 7 2 11 0s7-2 11 0M30 58c4-2 7 2 11 0" fill="none" stroke="#9C6B00" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    music: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#A774FF" stop-opacity="1"/><stop offset="1" stop-color="#5532F0" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-nt" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="78"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#E6E0FF" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)" fill="url(#ID-nt)">\n  <path d="M38 28.6a3 3 0 0 1 2.3-2.9l30-6.6A3 3 0 0 1 74 22v40.5h-6V34.4L44 39.6V68h-6z"/>\n  <ellipse cx="32.5" cy="69" rx="9.6" ry="7.6" transform="rotate(-18 32.5 69)"/>\n  <ellipse cx="64.5" cy="63.5" rx="9.6" ry="7.6" transform="rotate(-18 64.5 63.5)"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    settings:
        '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#9AA1AB" stop-opacity="1"/><stop offset="1" stop-color="#5E6570" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-gr" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="80"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#D3D8DF" stop-opacity="1"/></linearGradient><linearGradient id="ID-hub" gradientUnits="userSpaceOnUse" x1="0" y1="34" x2="0" y2="66"><stop offset="0" stop-color="#B8BEC8" stop-opacity="1"/><stop offset="1" stop-color="#EEF1F5" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)">\n  <g fill="url(#ID-gr)">\n    <circle cx="50" cy="50" r="24"/>\n    <path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(0 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(30 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(60 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(90 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(120 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(150 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(180 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(210 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(240 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(270 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(300 50 50)"/><path d="M46 20.5h8l1.2 7h-10.4z" transform="rotate(330 50 50)"/>\n  </g>\n  <circle cx="50" cy="50" r="15.5" fill="url(#ID-hub)"/>\n  <circle cx="50" cy="50" r="7.5" fill="#5E6570"/>\n  <circle cx="50" cy="50" r="7.5" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    folder: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#EEF1F6" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-fb" gradientUnits="userSpaceOnUse" x1="0" y1="24" x2="0" y2="74"><stop offset="0" stop-color="#3C9BFF" stop-opacity="1"/><stop offset="1" stop-color="#1C6FE6" stop-opacity="1"/></linearGradient><linearGradient id="ID-ff" gradientUnits="userSpaceOnUse" x1="0" y1="36" x2="0" y2="74"><stop offset="0" stop-color="#7DC6FF" stop-opacity="1"/><stop offset="1" stop-color="#3A93FF" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)">\n  <path d="M18 30a6 6 0 0 1 6-6h14.6a6 6 0 0 1 4.3 1.8l3.7 3.7H76a6 6 0 0 1 6 6V68a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z" fill="url(#ID-fb)"/>\n  <path d="M18 42a6 6 0 0 1 6-6h52a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z" fill="url(#ID-ff)"/>\n  <path d="M18 42a6 6 0 0 1 6-6h52a6 6 0 0 1 6 6v2H18z" fill="#fff" opacity=".28"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    about: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#FFC46B" stop-opacity="1"/><stop offset="1" stop-color="#FF7A2E" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-av" gradientUnits="userSpaceOnUse" x1="0" y1="21" x2="0" y2="79"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#FFEBD9" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)">\n  <circle cx="50" cy="50" r="29" fill="url(#ID-av)"/>\n  <circle cx="50" cy="42" r="10.5" fill="#FF8C3A"/>\n  <path d="M30.5 70.5c3.6-9 11-13.5 19.5-13.5s15.9 4.5 19.5 13.5A28.9 28.9 0 0 1 50 79a28.9 28.9 0 0 1-19.5-8.5z" fill="#FF8C3A"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    camera: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#4B525E" stop-opacity="1"/><stop offset="1" stop-color="#1C2027" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-ring" gradientUnits="userSpaceOnUse" x1="0" y1="24" x2="0" y2="78"><stop offset="0" stop-color="#E9ECF1" stop-opacity="1"/><stop offset="1" stop-color="#9AA1AD" stop-opacity="1"/></linearGradient><radialGradient id="ID-lens" gradientUnits="userSpaceOnUse" cx="44" cy="44" r="22"><stop offset="0" stop-color="#5D8BFF"/><stop offset=".45" stop-color="#3A2DA8"/><stop offset="1" stop-color="#0F1230"/></radialGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)">\n  <circle cx="50" cy="51" r="27" fill="url(#ID-ring)"/>\n  <circle cx="50" cy="51" r="20" fill="#0D1018"/>\n  <circle cx="50" cy="51" r="16" fill="url(#ID-lens)"/>\n  <circle cx="50" cy="51" r="7" fill="#05070C"/>\n  <ellipse cx="43" cy="44" rx="5" ry="3.4" fill="#fff" opacity=".55" transform="rotate(-35 43 44)"/>\n  <circle cx="57.5" cy="58" r="1.8" fill="#9FD0FF" opacity=".6"/>\n</g>\n<circle cx="76" cy="24" r="3.4" fill="#FFD84D"/>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    trash: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#ECEEF2" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-bin" gradientUnits="userSpaceOnUse" x1="30" y1="0" x2="70" y2="0"><stop offset="0" stop-color="#8E98A6" stop-opacity="1"/><stop offset="0.45" stop-color="#C9D0D9" stop-opacity="1"/><stop offset="1" stop-color="#7F8996" stop-opacity="1"/></linearGradient><linearGradient id="ID-lid" gradientUnits="userSpaceOnUse" x1="0" y1="26" x2="0" y2="34"><stop offset="0" stop-color="#C9D0D9" stop-opacity="1"/><stop offset="1" stop-color="#8E98A6" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)">\n  <path d="M30 34h40l-3.6 38.5a6 6 0 0 1-6 5.5H39.6a6 6 0 0 1-6-5.5z" fill="url(#ID-bin)"/>\n  <path d="M40.5 41l.8 30M50 41v30M59.5 41l-.8 30" stroke="#fff" stroke-opacity=".55" stroke-width="2.6" stroke-linecap="round"/>\n  <rect x="25" y="26" width="50" height="8" rx="4" fill="url(#ID-lid)"/>\n  <path d="M43 26v-1.5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3V26" fill="none" stroke="#8C95A3" stroke-width="3"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    home: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#5EE39A" stop-opacity="1"/><stop offset="1" stop-color="#14A85C" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-hs" gradientUnits="userSpaceOnUse" x1="0" y1="21" x2="0" y2="79"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#E5F8EC" stop-opacity="1"/></linearGradient><linearGradient id="ID-win" gradientUnits="userSpaceOnUse" x1="0" y1="54" x2="0" y2="63"><stop offset="0" stop-color="#FFE48A" stop-opacity="1"/><stop offset="1" stop-color="#FFC23D" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)">\n  <path d="M50 21 18.5 47.3a2.6 2.6 0 0 0 1.7 4.6H26V74a5 5 0 0 0 5 5h38a5 5 0 0 0 5-5V51.9h5.8a2.6 2.6 0 0 0 1.7-4.6L53.5 21.2a5.4 5.4 0 0 0-3.5-.2z" fill="url(#ID-hs)"/>\n  <rect x="43" y="58" width="14" height="21" rx="3" fill="#14A85C"/>\n  <rect x="31" y="54" width="9" height="9" rx="2" fill="url(#ID-win)"/>\n  <rect x="60" y="54" width="9" height="9" rx="2" fill="url(#ID-win)"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    work: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#3E4C6B" stop-opacity="1"/><stop offset="1" stop-color="#18203A" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-lea" gradientUnits="userSpaceOnUse" x1="0" y1="32" x2="0" y2="77"><stop offset="0" stop-color="#E2A564" stop-opacity="1"/><stop offset="1" stop-color="#A9652E" stop-opacity="1"/></linearGradient><linearGradient id="ID-gold" gradientUnits="userSpaceOnUse" x1="0" y1="45" x2="0" y2="55"><stop offset="0" stop-color="#FFF0B8" stop-opacity="1"/><stop offset="1" stop-color="#D6A33A" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)">\n  <path d="M38.5 33v-4a5 5 0 0 1 5-5h13a5 5 0 0 1 5 5v4" fill="none" stroke="#C9893F" stroke-width="4.6" stroke-linecap="round"/>\n  <rect x="17" y="32" width="66" height="45" rx="8" fill="url(#ID-lea)"/>\n  <path d="M17 50h66" stroke="#7A4A1F" stroke-width="2"/>\n  <rect x="44" y="45.5" width="12" height="9.5" rx="2.4" fill="url(#ID-gold)"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
    link: '<defs><linearGradient id="ID-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#6FE9F7" stop-opacity="1"/><stop offset="1" stop-color="#0E8FD8" stop-opacity="1"/></linearGradient>\n<filter id="ID-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-color="#000" flood-opacity=".18"/></filter>\n<filter id="ID-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".9" flood-color="#000" flood-opacity=".12"/></filter>\n<linearGradient id="ID-lk" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="70"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#DDF6FC" stop-opacity="1"/></linearGradient></defs>\n<path d="__SQ__" fill="url(#ID-bg)"/>\n<g filter="url(#ID-ds)" fill="none" stroke="url(#ID-lk)" stroke-width="7.5" stroke-linecap="round" transform="rotate(-45 50 50)">\n  <path d="M46 39.5H35a10.5 10.5 0 0 0 0 21h11"/><path d="M54 39.5h11a10.5 10.5 0 0 1 0 21H54"/><path d="M40.5 50h19"/>\n</g>\n<path d="__SQ__" fill="none" stroke="#000" stroke-opacity=".07" stroke-width=".7"/>',
}
const SQUIRCLE =
    "M100.0 50.0L100.0 66.8L99.8 72.1L99.6 76.0L99.3 79.1L98.9 81.8L98.4 84.0L97.9 86.1L97.2 87.9L96.4 89.5L95.6 91.0L94.6 92.3L93.5 93.5L92.3 94.6L91.0 95.6L89.5 96.4L87.9 97.2L86.1 97.9L84.0 98.4L81.8 98.9L79.1 99.3L76.0 99.6L72.1 99.8L66.8 100.0L50.0 100.0L33.2 100.0L27.9 99.8L24.0 99.6L20.9 99.3L18.2 98.9L16.0 98.4L13.9 97.9L12.1 97.2L10.5 96.4L9.0 95.6L7.7 94.6L6.5 93.5L5.4 92.3L4.4 91.0L3.6 89.5L2.8 87.9L2.1 86.1L1.6 84.0L1.1 81.8L0.7 79.1L0.4 76.0L0.2 72.1L0.0 66.8L0.0 50.0L0.0 33.2L0.2 27.9L0.4 24.0L0.7 20.9L1.1 18.2L1.6 16.0L2.1 13.9L2.8 12.1L3.6 10.5L4.4 9.0L5.4 7.7L6.5 6.5L7.7 5.4L9.0 4.4L10.5 3.6L12.1 2.8L13.9 2.1L16.0 1.6L18.2 1.1L20.9 0.7L24.0 0.4L27.9 0.2L33.2 0.0L50.0 0.0L66.8 0.0L72.1 0.2L76.0 0.4L79.1 0.7L81.8 1.1L84.0 1.6L86.1 2.1L87.9 2.8L89.5 3.6L91.0 4.4L92.3 5.4L93.5 6.5L94.6 7.7L95.6 9.0L96.4 10.5L97.2 12.1L97.9 13.9L98.4 16.0L98.9 18.2L99.3 20.9L99.6 24.0L99.8 27.9L100.0 33.2Z"
function appSvg(name: string, prefix: string): string {
    const d = new Date()
    const wd = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
    return (APP_ICONS[name] || APP_ICONS.link)
        .replace(/__SQ__/g, SQUIRCLE)
        .replace(/ID-/g, prefix + "-")
        .replace("__WD__", wd)
        .replace("__DD__", String(d.getDate()))
}

const DEFAULT_ITEMS: Item[] = [
    { label: "Home", glyph: "home", link: "/", active: true },
    { label: "Work", glyph: "gallery", link: "/work" },
    { label: "About", glyph: "about", link: "/about" },
    { label: "Notes", glyph: "notes", link: "/blog" },
    { label: "Contact", glyph: "mail", link: "mailto:hello@example.com" },
    {
        label: "Book a call",
        glyph: "calendar",
        link: "https://calendly.com",
        newTab: true,
    },
    { divider: true },
    { label: "Trash", glyph: "trash" },
]

// ---------- One dock icon ----------
function DockIcon({
    item,
    mouseX,
    p,
    still,
    isStatic,
}: {
    item: Item
    mouseX: MotionValue<number>
    p: Props
    still: boolean // no magnify / bounce (canvas, export, or OS "reduce motion")
    isStatic: boolean // Framer canvas / export / thumbnail render
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [hover, setHover] = useState(false)
    const [focused, setFocused] = useState(false)
    const controls = useAnimationControls()
    const uid = "dk" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const illustrated = useMemo(
        () => appSvg(item.glyph || "link", uid),
        [item.glyph, uid]
    )

    const dist = useTransform(mouseX, (x) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r || x === Infinity) return Infinity
        return x - (r.left + r.width / 2)
    })
    const target = useTransform(
        dist,
        [-p.distance, 0, p.distance],
        [p.iconSize, Math.max(p.maxSize, p.iconSize), p.iconSize],
        { clamp: true }
    )
    const size = useSpring(target, { mass: 0.1, stiffness: 170, damping: 14 })
    const radius = useTransform(size, (s) => s * 0.225)

    // Static values used on the canvas / in exports / with reduced motion
    const sizeV = still ? p.iconSize : size
    const radiusV = still ? p.iconSize * 0.225 : radius
    const showTip =
        !isStatic && p.tooltips && (hover || focused) && !!item.label

    const onClick = () => {
        if (p.bounce && !still) {
            controls.start({
                y: [0, -p.iconSize * 0.45, 0, -p.iconSize * 0.18, 0],
                transition: { duration: 0.7, ease: "easeOut" },
            })
        }
    }

    const tile = item.image?.src ? (
        <motion.img
            src={item.image.src}
            srcSet={item.image.srcSet}
            alt={item.image.alt || item.label || ""}
            draggable={false}
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: radiusV,
                display: "block",
            }}
        />
    ) : (
        <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            width="100%"
            height="100%"
            style={{
                display: "block",
                overflow: "visible",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.14))",
            }}
            dangerouslySetInnerHTML={{ __html: illustrated }}
        />
    )

    const inner = (
        <motion.div
            ref={ref}
            onHoverStart={isStatic ? undefined : () => setHover(true)}
            onHoverEnd={isStatic ? undefined : () => setHover(false)}
            animate={isStatic ? undefined : controls}
            style={{
                width: sizeV,
                height: sizeV,
                position: "relative",
                cursor: "pointer",
            }}
        >
            {tile}
            <AnimatePresence>
                {showTip && (
                    <motion.div
                        role="tooltip"
                        initial={{ opacity: 0, y: 6, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 6, x: "-50%" }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "absolute",
                            bottom: "calc(100% + 10px)",
                            left: "50%",
                            padding: "5px 10px",
                            borderRadius: 8,
                            background: p.tooltipBg,
                            color: p.tooltipText,
                            fontFamily:
                                "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                            fontSize: 13,
                            fontWeight: 500,
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                            ...p.font,
                        }}
                    >
                        {item.label}
                        <span
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: "50%",
                                marginLeft: -5,
                                width: 0,
                                height: 0,
                                borderLeft: "5px solid transparent",
                                borderRight: "5px solid transparent",
                                borderTop: `5px solid ${p.tooltipBg}`,
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            {item.active && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: -Math.max(5, p.padding * 0.55),
                        width: 4,
                        height: 4,
                        marginLeft: -2,
                        borderRadius: 2,
                        background: p.dotColor,
                    }}
                />
            )}
        </motion.div>
    )

    // Shared props: keyboard focus shows the tooltip, Enter/Space/click plays the bounce
    const a11y = {
        "aria-label": item.label || item.glyph || "Dock item",
        "aria-current": item.active ? ("page" as const) : undefined,
        onClick,
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
    }
    const focusStyle: CSSProperties = {
        display: "block",
        borderRadius: "22.5%",
        outlineOffset: 3,
    }

    if (!item.link) {
        // Non-link items are real buttons: focusable, announced, and Enter/Space work
        return (
            <button
                type="button"
                {...a11y}
                style={{
                    ...focusStyle,
                    padding: 0,
                    margin: 0,
                    border: 0,
                    background: "none",
                    font: "inherit",
                    color: "inherit",
                    cursor: "pointer",
                }}
            >
                {inner}
            </button>
        )
    }
    return (
        <a
            href={item.link}
            target={item.newTab ? "_blank" : undefined}
            rel={item.newTab ? "noopener noreferrer" : undefined}
            {...a11y}
            style={{ ...focusStyle, textDecoration: "none" }}
        >
            {inner}
        </a>
    )
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function Dock(props: Props) {
    const p = { ...Dock.defaultProps, ...props } as Props
    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const still = isStatic || !!reduceMotion
    const mouseX = useMotionValue(Infinity)
    const items = p.items && p.items.length ? p.items : DEFAULT_ITEMS

    return (
        <div
            style={{
                ...p.style,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                // reserve room above for magnification + tooltip so nothing gets clipped
                paddingTop:
                    Math.max(0, p.maxSize - p.iconSize) + (p.tooltips ? 34 : 6),
            }}
        >
            <nav
                aria-label="Dock"
                onMouseMove={still ? undefined : (e) => mouseX.set(e.clientX)}
                onMouseLeave={still ? undefined : () => mouseX.set(Infinity)}
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: p.gap,
                    padding: p.padding,
                    height: p.iconSize + p.padding * 2,
                    boxSizing: "border-box",
                    borderRadius: p.radius,
                    background: p.background,
                    border: `1px solid ${p.border}`,
                    backdropFilter: p.blur
                        ? `blur(${p.blur}px) saturate(160%)`
                        : undefined,
                    WebkitBackdropFilter: p.blur
                        ? `blur(${p.blur}px) saturate(160%)`
                        : undefined,
                    boxShadow: p.shadow
                        ? "0 10px 30px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)"
                        : undefined,
                }}
            >
                {items.map((item, i) =>
                    item.divider ? (
                        <div
                            key={i}
                            aria-hidden="true"
                            style={{
                                width: 1,
                                alignSelf: "stretch",
                                margin: `${p.padding * 0.3}px ${Math.max(2, p.gap * 0.3)}px`,
                                background: p.border,
                            }}
                        />
                    ) : (
                        <DockIcon
                            key={i}
                            item={item}
                            mouseX={mouseX}
                            p={p}
                            still={still}
                            isStatic={isStatic}
                        />
                    )
                )}
            </nav>
        </div>
    )
}

Dock.defaultProps = {
    items: DEFAULT_ITEMS,
    iconSize: 56,
    maxSize: 88,
    distance: 140,
    gap: 12,
    padding: 10,
    radius: 26,
    background: "rgba(255,255,255,0.32)",
    border: "rgba(255,255,255,0.75)",
    blur: 24,
    shadow: true,
    tooltips: true,
    tooltipBg: "#111111",
    tooltipText: "#FFFFFF",
    dotColor: "#111111",
    bounce: true,
}

addPropertyControls(Dock, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 14,
        control: {
            type: ControlType.Object,
            controls: {
                divider: {
                    type: ControlType.Boolean,
                    title: "Divider",
                    defaultValue: false,
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    hidden: (i: any) => i.divider,
                },
                glyph: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: [
                        "home",
                        "work",
                        "gallery",
                        "about",
                        "mail",
                        "chat",
                        "calendar",
                        "notes",
                        "folder",
                        "browser",
                        "music",
                        "camera",
                        "settings",
                        "trash",
                        "link",
                    ],
                    optionTitles: [
                        "Home",
                        "Work",
                        "Gallery",
                        "About",
                        "Mail",
                        "Chat",
                        "Calendar (live date)",
                        "Notes",
                        "Folder",
                        "Browser",
                        "Music",
                        "Camera",
                        "Settings",
                        "Trash",
                        "Link",
                    ],
                    hidden: (i: any) => i.divider,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Custom Image",
                    hidden: (i: any) => i.divider,
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    hidden: (i: any) => i.divider,
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    hidden: (i: any) => i.divider,
                },
                active: {
                    type: ControlType.Boolean,
                    title: "Active Dot",
                    defaultValue: false,
                    hidden: (i: any) => i.divider,
                },
            },
        },
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 24,
        max: 96,
        step: 1,
        unit: "px",
    },
    maxSize: {
        type: ControlType.Number,
        title: "Magnify To",
        min: 24,
        max: 160,
        step: 1,
        unit: "px",
    },
    distance: {
        type: ControlType.Number,
        title: "Reach",
        min: 40,
        max: 400,
        step: 5,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Dock Radius",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    background: { type: ControlType.Color, title: "Background" },
    border: { type: ControlType.Color, title: "Border" },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    shadow: { type: ControlType.Boolean, title: "Shadow" },
    tooltips: { type: ControlType.Boolean, title: "Tooltips" },
    tooltipBg: {
        type: ControlType.Color,
        title: "Tooltip BG",
        hidden: (p: any) => !p.tooltips,
    },
    tooltipText: {
        type: ControlType.Color,
        title: "Tooltip Text",
        hidden: (p: any) => !p.tooltips,
    },
    font: {
        type: ControlType.Font,
        title: "Tooltip Font",
        controls: "extended",
        hidden: (p: any) => !p.tooltips,
    },
    dotColor: { type: ControlType.Color, title: "Dot" },
    bounce: { type: ControlType.Boolean, title: "Bounce on Click" },
})
