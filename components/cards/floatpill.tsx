// FloatPill — Floating Pill Bar with Popover Cards
// by bykunal

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const Svg = ({ children }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: "100%", height: "100%" }}
    >
        {children}
    </svg>
)

const Icons: Record<string, JSX.Element> = {
    home: (
        <Svg>
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
        </Svg>
    ),
    about: (
        <Svg>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </Svg>
    ),
    work: (
        <Svg>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </Svg>
    ),
    contact: (
        <Svg>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </Svg>
    ),
    blog: (
        <Svg>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </Svg>
    ),
    services: (
        <Svg>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </Svg>
    ),
    portfolio: (
        <Svg>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </Svg>
    ),
    shop: (
        <Svg>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
        </Svg>
    ),
    pricing: (
        <Svg>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </Svg>
    ),
    faq: (
        <Svg>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </Svg>
    ),
    team: (
        <Svg>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
        </Svg>
    ),
    careers: (
        <Svg>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            <path d="M2 12.5l10 5.5 10-5.5" />
        </Svg>
    ),
    press: (
        <Svg>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </Svg>
    ),
    events: (
        <Svg>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </Svg>
    ),
    gallery: (
        <Svg>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </Svg>
    ),
    testimonials: (
        <Svg>
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </Svg>
    ),
    resources: (
        <Svg>
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </Svg>
    ),
    docs: (
        <Svg>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </Svg>
    ),
    newsletter: (
        <Svg>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </Svg>
    ),
    partners: (
        <Svg>
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </Svg>
    ),
    instagram: (
        <Svg>
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle
                cx="17.5"
                cy="6.5"
                r="0.8"
                fill="currentColor"
                stroke="none"
            />
        </Svg>
    ),
    twitter: (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: "100%", height: "100%" }}
        >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    ),
    linkedin: (
        <Svg>
            <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
        </Svg>
    ),
    youtube: (
        <Svg>
            <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
            <polygon
                points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
                fill="currentColor"
                stroke="none"
            />
        </Svg>
    ),
    tiktok: (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: "100%", height: "100%" }}
        >
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
        </svg>
    ),
    facebook: (
        <Svg>
            <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </Svg>
    ),
    behance: (
        <Svg>
            <path d="M1 6h8.5C11.43 6 13 7.57 13 9.5S11.43 13 9.5 13H1V6z" />
            <path d="M1 13h9c2.21 0 4 1.79 4 4s-1.79 4-4 4H1V13z" />
            <line x1="15" y1="8" x2="22" y2="8" />
            <path d="M22 13c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c2 0 3.75-1.18 4.58-2.88" />
        </Svg>
    ),
    dribbble: (
        <Svg>
            <circle cx="12" cy="12" r="10" />
            <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
        </Svg>
    ),
    github: (
        <Svg>
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
        </Svg>
    ),
    discord: (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: "100%", height: "100%" }}
        >
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.036.055a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
        </svg>
    ),
    spotify: (
        <Svg>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 13.5c2.5-1 5.5-.8 8 .5" />
            <path d="M7 10.5c3-1.33 7-1.17 10 .5" />
            <path d="M9 16.5c2-.67 4-.67 6 0" />
        </Svg>
    ),
    twitch: (
        <Svg>
            <path d="M21 2H3v16h5v4l4-4h5l4-4V2zM11 11V7m5 4V7" />
        </Svg>
    ),
    whatsapp: (
        <Svg>
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </Svg>
    ),
    telegram: (
        <Svg>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </Svg>
    ),
    reddit: (
        <Svg>
            <circle cx="12" cy="12" r="10" />
            <path d="M16.5 9.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S15 11.83 15 11s.67-1.5 1.5-1.5zm-9 0c.83 0 1.5.67 1.5 1.5S8.33 12.5 7.5 12.5 6 11.83 6 11s.67-1.5 1.5-1.5zM12 16c-2.67 0-4-1-4-1s.5-1.5 4-1.5 4 1.5 4 1.5-1.33 1-4 1z" />
        </Svg>
    ),
    email: (
        <Svg>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </Svg>
    ),
    phone: (
        <Svg>
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </Svg>
    ),
    download: (
        <Svg>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </Svg>
    ),
    upload: (
        <Svg>
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
        </Svg>
    ),
    calendar: (
        <Svg>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </Svg>
    ),
    map: (
        <Svg>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
        </Svg>
    ),
    search: (
        <Svg>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </Svg>
    ),
    share: (
        <Svg>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </Svg>
    ),
    link: (
        <Svg>
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </Svg>
    ),
    send: (
        <Svg>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </Svg>
    ),
    chat: (
        <Svg>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </Svg>
    ),
    bell: (
        <Svg>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
        </Svg>
    ),
    bookmark: (
        <Svg>
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </Svg>
    ),
    heart: (
        <Svg>
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </Svg>
    ),
    globe: (
        <Svg>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </Svg>
    ),
    rss: (
        <Svg>
            <path d="M4 11a9 9 0 019 9" />
            <path d="M4 4a16 16 0 0116 16" />
            <circle cx="5" cy="19" r="1" />
        </Svg>
    ),
    externallink: (
        <Svg>
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </Svg>
    ),
    play: (
        <Svg>
            <circle cx="12" cy="12" r="10" />
            <polygon
                points="10 8 16 12 10 16 10 8"
                fill="currentColor"
                stroke="none"
            />
        </Svg>
    ),
    video: (
        <Svg>
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
        </Svg>
    ),
    mic: (
        <Svg>
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </Svg>
    ),
    music: (
        <Svg>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </Svg>
    ),
    headphones: (
        <Svg>
            <path d="M3 18v-6a9 9 0 0118 0v6" />
            <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
        </Svg>
    ),
    camera: (
        <Svg>
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
        </Svg>
    ),
    image: (
        <Svg>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </Svg>
    ),
    film: (
        <Svg>
            <rect x="2" y="2" width="20" height="20" rx="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
        </Svg>
    ),
    briefcase: (
        <Svg>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </Svg>
    ),
    award: (
        <Svg>
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </Svg>
    ),
    chart: (
        <Svg>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </Svg>
    ),
    rocket: (
        <Svg>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
            <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
        </Svg>
    ),
    target: (
        <Svg>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </Svg>
    ),
    trending: (
        <Svg>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </Svg>
    ),
    dollar: (
        <Svg>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </Svg>
    ),
    shield: (
        <Svg>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </Svg>
    ),
    lock: (
        <Svg>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </Svg>
    ),
    key: (
        <Svg>
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </Svg>
    ),
    settings: (
        <Svg>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </Svg>
    ),
    star: (
        <Svg>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </Svg>
    ),
    sun: (
        <Svg>
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
        </Svg>
    ),
    moon: (
        <Svg>
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </Svg>
    ),
    code: (
        <Svg>
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </Svg>
    ),
    terminal: (
        <Svg>
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
        </Svg>
    ),
    pen: (
        <Svg>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </Svg>
    ),
    book: (
        <Svg>
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </Svg>
    ),
    coffee: (
        <Svg>
            <path d="M18 8h1a4 4 0 010 8h-1" />
            <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
        </Svg>
    ),
    lightning: (
        <Svg>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </Svg>
    ),
    flag: (
        <Svg>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
        </Svg>
    ),
    gift: (
        <Svg>
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect x="2" y="7" width="20" height="5" />
            <line x1="12" y1="22" x2="12" y2="7" />
            <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
        </Svg>
    ),
    layers: (
        <Svg>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </Svg>
    ),
    grid: (
        <Svg>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </Svg>
    ),
    sparkle: (
        <Svg>
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </Svg>
    ),
    user: (
        <Svg>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </Svg>
    ),
    users: (
        <Svg>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
        </Svg>
    ),
    activity: (
        <Svg>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </Svg>
    ),
    compass: (
        <Svg>
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </Svg>
    ),
    anchor: (
        <Svg>
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="22" />
            <path d="M5 15H2a10 10 0 0020 0h-3" />
        </Svg>
    ),
    box: (
        <Svg>
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </Svg>
    ),
    database: (
        <Svg>
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </Svg>
    ),
    server: (
        <Svg>
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
        </Svg>
    ),
    wifi: (
        <Svg>
            <path d="M5 12.55a11 11 0 0114.08 0" />
            <path d="M1.42 9a16 16 0 0121.16 0" />
            <path d="M8.53 16.11a6 6 0 016.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
        </Svg>
    ),
    tool: (
        <Svg>
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </Svg>
    ),
    feather: (
        <Svg>
            <path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z" />
            <line x1="16" y1="8" x2="2" y2="22" />
        </Svg>
    ),
    columns: (
        <Svg>
            <path d="M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7m0-18H5a2 2 0 00-2 2v14a2 2 0 002 2h7m0-18v18" />
        </Svg>
    ),
    linear: (
        <Svg>
            <path d="M3.5 3.5l17 17M3.5 12.5l8-9M12.5 20.5l8-9" />
        </Svg>
    ),
    figma: (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: "100%", height: "100%" }}
        >
            <path d="M5 5.5A3.5 3.5 0 018.5 2H12v7H8.5A3.5 3.5 0 015 5.5zm7-3.5h3.5a3.5 3.5 0 110 7H12V2zm-7 10.5A3.5 3.5 0 018.5 9H12v7H8.5A3.5 3.5 0 015 12.5zM17.5 9a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM5 19.5A3.5 3.5 0 018.5 16H12v3.5a3.5 3.5 0 01-7 0z" />
        </svg>
    ),
    framer: (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: "100%", height: "100%" }}
        >
            <path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
        </svg>
    ),
    notion: (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: "100%", height: "100%" }}
        >
            <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933z" />
        </svg>
    ),
}

const ICON_KEYS = Object.keys(Icons)

const makeSlot = (icon, heading, subtext, desc, emoji, thumbColor) => ({
    icon: {
        type: ControlType.Enum,
        title: "Icon",
        options: ICON_KEYS,
        defaultValue: icon,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: heading,
    },
    subtext: {
        type: ControlType.String,
        title: "Subtext",
        defaultValue: subtext,
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: desc,
    },
    emoji: { type: ControlType.String, title: "Emoji", defaultValue: emoji },
    thumbColor: {
        type: ControlType.Color,
        title: "Thumb Color",
        defaultValue: thumbColor,
    },
    thumbImage: { type: ControlType.Image, title: "Thumb Image" },
    link: { type: ControlType.Link, title: "Link" },
})

// Zero-flash thumbnail: emoji placeholder always rendered underneath,
// image fades in on top when ready. No color flash on switch.
function Thumb({ src, color, radius, emoji }) {
    const [ready, setReady] = useState(false)
    const prevSrc = useRef(undefined)

    useEffect(() => {
        if (src === prevSrc.current) return
        prevSrc.current = src
        setReady(false)
    }, [src])

    // When src is set: transparent background, no emoji, image fades in over nothing
    // When no src: show color + emoji, no image element at all
    const hasImage = !!src

    return (
        <div
            style={{
                width: 88,
                height: 88,
                flexShrink: 0,
                borderRadius: radius,
                // Only show color when there's no image — never flashes behind image
                background: hasImage ? "transparent" : color,
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
            }}
        >
            {/* Emoji only rendered when no image — never shown alongside image */}
            {!hasImage && (
                <span style={{ lineHeight: 1 }}>{emoji || "🏠"}</span>
            )}

            {/* Image only rendered when src exists */}
            {hasImage && (
                <img
                    key={src}
                    src={src}
                    alt=""
                    onLoad={() => setReady(true)}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        opacity: ready ? 1 : 0,
                        transition: ready ? "opacity 0.15s ease" : "none",
                    }}
                />
            )}
        </div>
    )
}

// Single popover — swaps content instantly, no double animation on icon switch
const Popover = memo(function Popover({
    activeSlot,
    isOpen,
    font,
    cardRadius,
    thumbRadius,
    isDark,
    titleColor,
    bodyColor,
    pillRef,
    isCanvas,
}) {
    // Compute position synchronously — no useEffect delay, correct on first click
    function getPos(): React.CSSProperties {
        if (!pillRef.current) {
            return {
                position: "fixed" as const,
                bottom: 80,
                left: "50%",
                transform: "translateX(-50%)",
                width: 300,
                zIndex: 99999,
            }
        }
        if (isCanvas) {
            return {
                position: "absolute" as const,
                bottom: "calc(100% + 12px)",
                left: "50%",
                transform: "translateX(-50%)",
                width: 300,
                zIndex: 10,
            }
        }
        const rect = pillRef.current.getBoundingClientRect()
        const cardW = Math.min(300, window.innerWidth - 32)
        const cx = rect.left + rect.width / 2
        return {
            position: "fixed" as const,
            bottom: window.innerHeight - rect.top + 12,
            left: Math.max(
                16,
                Math.min(cx - cardW / 2, window.innerWidth - cardW - 16)
            ),
            width: cardW,
            zIndex: 99999,
        }
    }

    if (!activeSlot) return null

    const cr = cardRadius ?? 22
    const tr = thumbRadius ?? 14
    const bg = isDark ? "rgba(28,26,24,0.88)" : "rgba(255,255,255,0.88)"
    const bd = isDark
        ? "1px solid rgba(255,255,255,0.09)"
        : "1px solid rgba(0,0,0,0.07)"
    const tc = titleColor || (isDark ? "#ffffff" : "#111111")
    const bc = bodyColor || (isDark ? "rgba(255,255,255,0.5)" : "#ABABAB")
    const { fontSize: _a, lineHeight: _b, ...fontStyle } = font ?? {}

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="pill-pop"
                    initial={{ opacity: 0, y: 10, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 34,
                        mass: 0.8,
                    }}
                    style={{ pointerEvents: "all", ...getPos() }}
                >
                    <div
                        style={{
                            background: bg,
                            backdropFilter: "blur(24px) saturate(1.8)",
                            WebkitBackdropFilter: "blur(24px) saturate(1.8)",
                            border: bd,
                            borderRadius: cr,
                            padding: 10,
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            overflow: "hidden",
                        }}
                    >
                        <Thumb
                            src={activeSlot.thumbImage}
                            color={activeSlot.thumbColor || "#FF6B35"}
                            radius={tr}
                            emoji={activeSlot.emoji || "🏠"}
                        />
                        <div
                            style={{
                                flex: 1,
                                minWidth: 0,
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                                paddingRight: 4,
                            }}
                        >
                            <div
                                style={{
                                    ...fontStyle,
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: tc,
                                    letterSpacing: "-0.3px",
                                    lineHeight: 1.25,
                                    wordBreak: "break-word",
                                }}
                            >
                                {activeSlot.heading || "Heading"}
                            </div>
                            {activeSlot.subtext && (
                                <div
                                    style={{
                                        ...fontStyle,
                                        fontSize: 12.5,
                                        color: bc,
                                        lineHeight: 1.4,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {activeSlot.subtext}
                                </div>
                            )}
                            {activeSlot.description && (
                                <div
                                    style={{
                                        ...fontStyle,
                                        fontSize: 11.5,
                                        color: bc,
                                        lineHeight: 1.45,
                                        wordBreak: "break-word",
                                        opacity: 0.8,
                                    }}
                                >
                                    {activeSlot.description}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})

export default function FloatPill(props) {
    const {
        pillStyle,
        triggerMode,
        iconCount,
        font,
        cardRadius,
        thumbRadius,
        titleColor,
        bodyColor,
        slot1,
        slot2,
        slot3,
        slot4,
        slot5,
    } = props

    const [activeIndex, setActiveIndex] = useState(null)
    const pillRef = useRef(null)
    const isCanvas = RenderTarget.current() !== RenderTarget.preview

    const close = useCallback(() => setActiveIndex(null), [])
    const toggle = useCallback(
        (i) => setActiveIndex((prev) => (prev === i ? null : i)),
        []
    )

    useEffect(() => {
        if (isCanvas) return
        const h = (e) => {
            if (pillRef.current && !pillRef.current.contains(e.target)) close()
        }
        document.addEventListener("mousedown", h)
        return () => document.removeEventListener("mousedown", h)
    }, [close, isCanvas])

    const allSlots = [slot1, slot2, slot3, slot4, slot5].slice(0, iconCount)
    const activeSlot =
        activeIndex !== null ? (allSlots[activeIndex] ?? null) : null
    const isDark = pillStyle !== "light"

    const iconColor = isDark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.48)"
    const iconColorActive = isDark ? "#ffffff" : "rgba(0,0,0,0.9)"
    const iconBgActive = isDark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.07)"
    const dividerColor = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.1)"

    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            <Popover
                activeSlot={activeSlot}
                isOpen={activeIndex !== null}
                font={font}
                cardRadius={cardRadius}
                thumbRadius={thumbRadius}
                isDark={isDark}
                titleColor={titleColor}
                bodyColor={bodyColor}
                pillRef={pillRef}
                isCanvas={isCanvas}
            />
            <div
                ref={pillRef}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: isDark
                        ? "rgba(28,26,24,0.95)"
                        : "rgba(240,238,235,0.95)",
                    backdropFilter: "blur(24px) saturate(1.6)",
                    WebkitBackdropFilter: "blur(24px) saturate(1.6)",
                    borderRadius: 100,
                    padding: "8px 10px",
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.07)"
                        : "1px solid rgba(0,0,0,0.08)",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {allSlots.map((slot, i) => {
                    if (!slot) return null
                    const isActive = activeIndex === i
                    return (
                        <div
                            key={i}
                            style={{ display: "flex", alignItems: "center" }}
                        >
                            <motion.div
                                whileTap={{ scale: 0.86 }}
                                onClick={() => toggle(i)}
                                onMouseEnter={
                                    triggerMode === "hover"
                                        ? () => setActiveIndex(i)
                                        : undefined
                                }
                                onMouseLeave={
                                    triggerMode === "hover" ? close : undefined
                                }
                                style={{
                                    width: 46,
                                    height: 46,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    background: isActive
                                        ? iconBgActive
                                        : "transparent",
                                    transition: "background 0.15s ease",
                                    color: isActive
                                        ? iconColorActive
                                        : iconColor,
                                    flexShrink: 0,
                                    userSelect: "none",
                                }}
                            >
                                <div style={{ width: 20, height: 20 }}>
                                    {Icons[slot.icon] ?? Icons.home}
                                </div>
                            </motion.div>
                            {i < allSlots.length - 1 && (
                                <div
                                    style={{
                                        width: 1,
                                        height: 18,
                                        background: dividerColor,
                                        margin: "0 2px",
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(FloatPill, {
    pillStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
    },
    triggerMode: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["click", "hover"],
        optionTitles: ["Click", "Hover"],
        defaultValue: "click",
    },
    iconCount: {
        type: ControlType.Number,
        title: "Icons",
        min: 2,
        max: 5,
        step: 1,
        defaultValue: 3,
        displayStepper: true,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#ffffff",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "rgba(255,255,255,0.5)",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 22,
        displayStepper: true,
    },
    thumbRadius: {
        type: ControlType.Number,
        title: "Thumb Radius",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 14,
        displayStepper: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    slot1: {
        type: ControlType.Object,
        title: "Icon 1",
        controls: makeSlot("home", "Home", "Start here", "", "🏠", "#FF6B35"),
    },
    slot2: {
        type: ControlType.Object,
        title: "Icon 2",
        controls: makeSlot(
            "work",
            "Work",
            "Selected case studies",
            "",
            "💼",
            "#4A90E2"
        ),
    },
    slot3: {
        type: ControlType.Object,
        title: "Icon 3",
        controls: makeSlot(
            "contact",
            "Contact",
            "hi@you.com",
            "",
            "✉️",
            "#34C759"
        ),
    },
    slot4: {
        type: ControlType.Object,
        title: "Icon 4",
        hidden: (props) => props.iconCount < 4,
        controls: makeSlot(
            "about",
            "About",
            "Designer & builder",
            "",
            "👤",
            "#A855F7"
        ),
    },
    slot5: {
        type: ControlType.Object,
        title: "Icon 5",
        hidden: (props) => props.iconCount < 5,
        controls: makeSlot(
            "instagram",
            "Instagram",
            "@yourhandle",
            "",
            "📸",
            "#F97316"
        ),
    },
})
