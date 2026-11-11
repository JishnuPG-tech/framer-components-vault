import React, { useState, useRef, useCallback, useEffect } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Emoji Buttons Pro – Playful Reactions That Convert
 *
 * Facebook-style circular reaction buttons with physics particle bursts.
 * Clean circular design with white SVG icons, soft ambient glow, and
 * color-matched particle bursts on click.
 *
 * IMPORTANT: If colors appear wrong after updating this file,
 * DELETE the component from your canvas and re-add it fresh.
 * Old component instances may have stale prop values cached.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

// ============================================================================
// TYPES
// ============================================================================

interface DotParticle {
    id: number
    active: boolean
    x: number
    y: number
    vx: number
    vy: number
    opacity: number
    size: number
    life: number
    maxLife: number
    isSpark: boolean
    emoji: string
}

interface PresetConfig {
    emoji: string
    label: string
    bgColor: string
    bgLight: string
    bgDark: string
    glowColor: string
    particleColors: string[]
    iconKey: string
    particleSvg: string
    colorIcon: boolean // true = show colored emoji on button, false = white silhouette
}

interface ParticlesConfig {
    density: "low" | "medium" | "high"
    speed: number
    lifetime: number
}

interface StyleConfig {
    glowSize: number
    buttonColor?: string
    glowColor?: string
}

interface Props {
    preset: string
    link?: string
    hoverMessage?: string
    tooltipFont?: Record<string, any>
    size: "S" | "M" | "L"
    particles: ParticlesConfig
    buttonStyle: StyleConfig
    style?: React.CSSProperties
}

// ============================================================================
// SVG ICON PATHS
// ============================================================================

const ICON_PATHS: Record<string, { path: string; viewBox: string }> = {
    heart: {
        path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
        viewBox: "0 0 24 24",
    },
    thumbsUp: {
        path: "M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z",
        viewBox: "0 0 24 24",
    },
    fire: {
        path: "M12 23C7.58 23 4 19.42 4 15c0-3.37 1.8-6.27 4.48-8.13L10 5.69V2l2.03 1.09C16.17 5.38 20 9.52 20 15c0 4.42-3.58 8-8 8zm0-2c3.31 0 6-2.69 6-6 0-3.83-2.6-7.2-6-9.17V9l-2.5-1.5C7.68 9.62 6 12.12 6 15c0 3.31 2.69 6 6 6z",
        viewBox: "0 0 24 24",
    },
    sparkle: {
        path: "M12 1L9 9 1 12l8 3 3 8 3-8 8-3-8-3L12 1zm0 5.5L13.5 10l3.5 2-3.5 2L12 17.5 10.5 14 7 12l3.5-2L12 6.5z",
        viewBox: "0 0 24 24",
    },
    smiley: {
        path: "M15.5 11c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z",
        viewBox: "0 0 24 24",
    },
    heartFace: {
        path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-6.5c1.38 0 2.5-1.12 2.5-2.5h2c0 2.49-2.01 4.5-4.5 4.5S6.5 13.49 6.5 11h2c0 1.38 1.12 2.5 2.5 2.5zM8.56 8.49c.31-.46.97-.49 1.32-.06l.63.77.63-.77c.35-.43 1.01-.4 1.32.06C13.11 9.44 12.05 11 10.5 11S7.9 9.44 8.56 8.49zm5 0c.31-.46.97-.49 1.32-.06l.63.77.63-.77c.35-.43 1.01-.4 1.32.06C18.11 9.44 17.05 11 15.5 11s-2.6-1.56-1.94-2.51z",
        viewBox: "0 0 24 24",
    },
    flag: {
        path: "M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z",
        viewBox: "0 0 24 24",
    },
    rocket: {
        path: "M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55l1.33.26zM11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-12.15 4.5-12.15S14.99.25 9.59 5.65c-2.15 2.15-3.7 5.89-3.7 5.89l5.28 5.46zM14.5 12a2.5 2.5 0 010-5 2.5 2.5 0 010 5zm.63 6.16l.27 1.33c.13.66-.08 1.34-.55 1.81l-4.05 4.05-1.55-3.62c.31-.13 3.6-1.53 5.88-3.57zM5.93 17.08c-1.05 1.05-1.05 2.65-.73 3.65.08.25-.06.41-.13.48-.07.07-.23.21-.48.13-1-.32-2.6-.32-3.65.73l1.08 1.08c.66.66 1.46 1.04 2.37 1.04.73 0 1.51-.24 2.31-.72.1-.06 1.09-.65 1.09-.65-.53.01-1.38-.23-1.86-.74z",
        viewBox: "0 0 24 24",
    },
    chat: {
        path: "M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z",
        viewBox: "0 0 24 24",
    },
}

// ============================================================================
// PRESET DATA — beautiful, curated colors
// ============================================================================

const PRESETS: Record<string, PresetConfig> = {
    like: {
        emoji: "❤️",
        label: "Like",
        bgColor: "#F06292",
        bgLight: "#F48FB1",
        bgDark: "#E91E63",
        glowColor: "rgba(240, 98, 146, 0.22)",
        particleColors: ["#F48FB1", "#F06292", "#EC407A"],
        iconKey: "heart",
        colorIcon: false,
        particleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#e91e63"/></svg>`,
    },
    vote: {
        emoji: "👍",
        label: "Vote",
        bgColor: "#64B5F6",
        bgLight: "#90CAF9",
        bgDark: "#42A5F5",
        glowColor: "rgba(100, 181, 246, 0.22)",
        particleColors: ["#90CAF9", "#64B5F6", "#42A5F5"],
        iconKey: "thumbsUp",
        colorIcon: false,
        particleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" fill="#42a5f5"/></svg>`,
    },
    magic: {
        emoji: "✨",
        label: "Magic",
        bgColor: "#7E57C2",
        bgLight: "#9575CD",
        bgDark: "#5E35B1",
        glowColor: "rgba(126, 87, 194, 0.22)",
        particleColors: ["#FFEE58", "#FDD835", "#F4B400"],
        iconKey: "sparkle",
        colorIcon: true,
        particleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="M121.59 60.83l-13.93-4.49c-8.91-2.94-14.13-10.15-16.58-19.21L84.95 7.27c-.16-.59-.55-1.38-1.75-1.38-1.01 0-1.59.79-1.75 1.38l-6.13 29.87c-2.46 9.06-7.67 16.27-16.58 19.21l-13.93 4.49c-1.97.64-2 3.42-.04 4.09l14.03 4.83c8.88 2.95 14.06 10.15 16.52 19.17l6.14 29.53c.16.59.49 1.65 1.75 1.65 1.33 0 1.59-1.06 1.75-1.65l6.14-29.53c2.46-9.03 7.64-16.23 16.52-19.17l14.03-4.83c1.94-.68 1.91-3.46-.06-4.1z" fill="#fdd835"/><path d="M122.91 62.08c-.22-.55-.65-1.03-1.32-1.25l-13.93-4.49c-8.91-2.94-14.13-10.15-16.58-19.21L84.95 7.27c-.09-.34-.41-.96-.78-1.14l1.98 29.97c1.47 13.68 2.73 20.12 13.65 22 9.38 1.62 20.23 3.48 23.11 3.98z" fill="#ffee58"/><path d="M41.81 86.81c-8.33-2.75-9.09-5.85-10.49-11.08l-3.49-12.24c-.21-.79-2.27-.79-2.49 0L22.97 74.8c-1.41 5.21-4.41 9.35-9.53 11.04l-8.16 3.54c-1.13.37-1.15 1.97-.02 2.35l8.22 2.91c5.1 1.69 8.08 5.83 9.5 11.02l2.37 10.82c.22.79 2.27.79 2.48 0l2.78-10.77c1.41-5.22 3.57-9.37 10.5-11.07l7.72-2.91c1.13-.39 1.12-1.99-.02-2.36l-7-2.56z" fill="#fdd835"/><path d="M59.74 28.14c.56-.19.54-.99-.03-1.15l-7.72-2.08a4.77 4.77 0 01-3.34-3.3L45.61 9.06c-.15-.61-1.02-.61-1.17.01l-2.86 12.5a4.734 4.734 0 01-3.4 3.37l-7.67 1.99c-.57.15-.61.95-.05 1.15l8.09 2.8c1.45.5 2.57 1.68 3.01 3.15l2.89 11.59c.15.6 1.01.61 1.16 0l2.99-11.63a4.773 4.773 0 013.04-3.13l8.1-2.72z" fill="#f4b400" stroke="#f4b400" stroke-miterlimit="10"/></svg>`,
    },
    smile: {
        emoji: "😊",
        label: "Smile",
        bgColor: "#FF7043",
        bgLight: "#FF8A65",
        bgDark: "#F4511E",
        glowColor: "rgba(255, 112, 67, 0.22)",
        particleColors: ["#FFEE58", "#FDE030", "#F7C02B"],
        iconKey: "smiley",
        colorIcon: true,
        particleSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="56" fill="#fde030"/><path d="M111.49 29.67c5.33 8.6 8.11 18.84 8.11 30.23 0 16.9-6.1 31.2-17.6 41.4-10.6 9.3-25 14.5-40.4 14.5-18.06 0-37.04-7.35-48.18-22.94 10.76 17.66 30.99 25.94 50.18 25.94 15.4 0 29.8-5.2 40.4-14.5 11.5-10.2 17.6-24.5 17.6-41.4 0-12.74-3.47-24.06-10.11-33.23z" fill="#eb8f00"/><path d="M48.96 56.89s-.05-.07-.16-.2c-.05-.06-.37-.47-.42-.54-.15-.16-.33-.35-.54-.57-.21-.24-.47-.49-.73-.75-.27-.25-.55-.51-.84-.72-.28-.23-.59-.4-.84-.54-.26-.16-.5-.2-.65-.25-.08-.03-.15-.03-.21-.04a.29.29 0 00-.09 0l-.04.01h-.03c.12 0-.27.01.27-.01l-.55.02c-.14 0-.05.01-.04.01.03 0 .05 0 .07-.01.08-.03 0 0-.02 0a.26.26 0 00-.11.03c-.16.05-.4.09-.65.25-.25.14-.56.31-.84.54-.28.22-.57.47-.84.72-.52.51-.98 1.02-1.3 1.39-.33.38-.51.6-.51.6l-.23.27c-1.37 1.6-3.89 1.87-5.62.61-1.18-.86-1.69-2.2-1.47-3.48 0 0 .07-.41.27-1.12.21-.71.56-1.72 1.25-2.91.69-1.18 1.69-2.57 3.38-3.84.83-.62 1.84-1.24 3.04-1.66.29-.11.6-.21.92-.29.33-.08.59-.17 1.04-.23l.62-.09c.19-.02.47-.05.51-.05l.55-.04.31-.01h.09l.13.01h.24l.51.03c.34.03.67.09 1 .14.65.12 1.3.29 1.89.51a11.1 11.1 0 013.04 1.66c1.69 1.27 2.69 2.66 3.38 3.84.35.59.61 1.15.8 1.64.21.47.36.97.48 1.34.11.36.11.55.16.72.03.16.04.25.04.25.37 2.02-1.12 3.93-3.31 4.26-1.57.25-3.08-.38-3.95-1.5z" fill="#422b0d"/><path d="M88.46 56.89s-.05-.07-.16-.2c-.05-.06-.37-.47-.42-.54-.15-.16-.33-.35-.54-.57-.21-.24-.47-.49-.73-.75-.27-.25-.55-.51-.84-.72-.28-.23-.59-.4-.84-.54-.26-.16-.5-.2-.65-.25-.08-.03-.15-.03-.21-.04a.29.29 0 00-.09 0l-.04.01h-.04c.12 0-.27.01.27-.01l-.55.02c-.14 0-.05.01-.04.01.03 0 .05 0 .07-.01.08-.03 0 0-.02 0a.26.26 0 00-.11.03c-.16.05-.4.09-.65.25-.25.14-.56.31-.84.54-.28.22-.57.47-.84.72-.52.51-.98 1.02-1.3 1.39-.33.38-.51.6-.51.6l-.23.27c-1.37 1.6-3.89 1.87-5.62.61-1.18-.86-1.69-2.2-1.47-3.48 0 0 .07-.41.27-1.12.21-.71.56-1.72 1.25-2.91.69-1.18 1.69-2.57 3.38-3.84.83-.62 1.84-1.24 3.04-1.66.29-.11.6-.21.92-.29.33-.08.59-.17 1.04-.23l.62-.09c.19-.02.47-.05.51-.05l.55-.04.31-.01h.09l.13.01h.24l.51.03c.34.03.67.09 1 .14.65.12 1.3.29 1.89.51a11.1 11.1 0 013.04 1.66c1.69 1.27 2.69 2.66 3.38 3.84.35.59.61 1.15.8 1.64.21.47.36.97.48 1.34.11.36.11.55.16.72.03.16.04.25.04.25.37 2.02-1.12 3.93-3.31 4.26-1.57.25-3.08-.38-3.94-1.5z" fill="#422b0d"/><path d="M64.02 93.99c-12.57 0-22.51-5.95-27.99-12.32-.55-.64-.68-1.5-.33-2.25.35-.77 1.11-1.27 1.93-1.27.37 0 .75.1 1.08.29 5.65 3.26 15.14 7.29 25.28 7.29h.16c10.15 0 19.63-4.04 25.28-7.29.34-.19.71-.3 1.08-.29.82 0 1.58.5 1.93 1.27.34.75.22 1.62-.33 2.25-5.48 6.36-15.43 12.32-27.99 12.32" fill="#422b0d"/></svg>`,
    },
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_MAP = { S: 48, M: 64, L: 80 }
const DENSITY_MAP = { low: 6, medium: 10, high: 15 }
const MAX_POOL = 18
const GRAVITY = -50
const DEFAULT_FONT =
    "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"

// Lighten/darken a hex color by a given amount
function adjustBrightness(hex: string, amount: number): string {
    const c = hex.replace("#", "")
    const num = parseInt(c, 16)
    let r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
    let b = Math.min(255, Math.max(0, (num & 0xff) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

// ============================================================================
// PARTICLE SYSTEM — emoji characters
// ============================================================================

function createDotPool(): DotParticle[] {
    const pool: DotParticle[] = []
    for (let i = 0; i < MAX_POOL; i++) {
        pool.push({
            id: i,
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            opacity: 0,
            size: 0,
            life: 0,
            maxLife: 0,
            isSpark: false,
            emoji: "",
        })
    }
    return pool
}

function activateDots(
    pool: DotParticle[],
    count: number,
    centerX: number,
    centerY: number,
    speedMultiplier: number,
    lifetimeMs: number,
    buttonRadius: number
) {
    let activated = 0
    for (let i = 0; i < pool.length && activated < count; i++) {
        if (!pool[i].active) {
            // Spread particles in a radial burst with some randomness
            const baseAngle = (Math.PI * 2 * activated) / count
            const angle = baseAngle + (Math.random() - 0.5) * 0.9
            const speed = (100 + Math.random() * 160) * speedMultiplier
            const isSpark = activated % 3 === 0

            // Start from edge of circle for a clean burst
            const startR = buttonRadius * 0.6
            pool[i].active = true
            pool[i].x = centerX + Math.cos(angle) * startR
            pool[i].y = centerY + Math.sin(angle) * startR
            pool[i].vx = Math.cos(angle) * speed
            pool[i].vy = Math.sin(angle) * speed - 60
            pool[i].opacity = 1
            pool[i].size = isSpark
                ? 10 + Math.random() * 4
                : 14 + Math.random() * 6
            pool[i].life = 0
            pool[i].maxLife = (lifetimeMs / 1000) * (0.8 + Math.random() * 0.4)
            pool[i].isSpark = isSpark
            activated++
        }
    }
}

// ============================================================================
// PARTICLE RENDERER — SVG icons colored to match button
// ============================================================================

function IconParticleLayer({
    poolRef,
    running,
    svgMarkup,
}: {
    poolRef: React.MutableRefObject<DotParticle[]>
    running: boolean
    svgMarkup: string
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const nodesRef = useRef<HTMLDivElement[]>([])
    const rafRef = useRef<number | null>(null)
    const lastTimeRef = useRef(0)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        container.innerHTML = ""
        nodesRef.current = []
        const encodedSvg = `data:image/svg+xml,${encodeURIComponent(svgMarkup)}`
        for (let i = 0; i < MAX_POOL; i++) {
            const wrapper = document.createElement("div")
            wrapper.style.cssText = `
                position: absolute;
                pointer-events: none;
                will-change: transform, opacity;
                backface-visibility: hidden;
                opacity: 0;
                left: 0;
                top: 0;
                width: 16px;
                height: 16px;
                background-image: url('${encodedSvg}');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            `
            container.appendChild(wrapper)
            nodesRef.current.push(wrapper)
        }
    }, [svgMarkup])

    useEffect(() => {
        if (!running) return

        const tick = (time: number) => {
            if (lastTimeRef.current === 0) lastTimeRef.current = time
            const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05)
            lastTimeRef.current = time

            const pool = poolRef.current
            for (let i = 0; i < pool.length; i++) {
                const p = pool[i]
                const node = nodesRef.current[i]
                if (!node) continue

                if (!p.active) {
                    if (node.style.opacity !== "0") node.style.opacity = "0"
                    continue
                }

                p.life += dt
                if (p.life >= p.maxLife) {
                    p.active = false
                    node.style.opacity = "0"
                    continue
                }

                p.vy += GRAVITY * dt
                p.x += p.vx * dt
                p.y += p.vy * dt

                const progress = p.life / p.maxLife
                p.opacity = 1 - progress * progress * progress

                const s = p.size
                const scale = 1 - progress * 0.4
                node.style.width = `${s}px`
                node.style.height = `${s}px`
                node.style.transform = `translate3d(${p.x - s / 2}px, ${p.y - s / 2}px, 0) scale(${scale})`
                node.style.opacity = String(p.opacity)
            }
            rafRef.current = requestAnimationFrame(tick)
        }

        lastTimeRef.current = 0
        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
    }, [running, poolRef, svgMarkup])

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "visible",
                zIndex: 0,
            }}
        />
    )
}

// ============================================================================
// BOUNCE COUNTER
// ============================================================================

function BounceCounter({
    count,
    fontFamily,
    fontWeight,
    color,
    fontSize,
}: {
    count: number
    fontFamily: string
    fontWeight: number | string
    color: string
    fontSize: number
}) {
    const controls = useAnimation()
    const prevCount = useRef(count)

    useEffect(() => {
        if (count !== prevCount.current) {
            prevCount.current = count
            controls.start({
                scale: [1, 1.25, 1],
                transition: { duration: 0.25, ease: "easeOut" },
            })
        }
    }, [count, controls])

    return (
        <motion.span
            animate={controls}
            style={{
                fontFamily,
                fontWeight: fontWeight || 600,
                fontSize,
                color,
                display: "inline-block",
                marginTop: 4,
            }}
        >
            {count}
        </motion.span>
    )
}

// ============================================================================
// CANVAS PREVIEW
// ============================================================================

function CanvasPreview({
    bgColor,
    bgLight,
    bgDark,
    glowColor,
    glowSize,
    iconColor,
    iconKey,
    diameter,
    particleColors,
    particleSvg,
    colorIcon,
    style,
}: {
    bgColor: string
    bgLight: string
    bgDark: string
    glowColor: string
    glowSize: number
    iconColor: string
    iconKey: string
    diameter: number
    particleColors: string[]
    particleSvg: string
    colorIcon: boolean
    style?: React.CSSProperties
}) {
    const iconSize = diameter * 0.5
    const iconData = ICON_PATHS[iconKey] || ICON_PATHS.heart
    const glowDiameter = diameter * 1.5

    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
            }}
        >
            {/* Soft ambient glow */}
            <div
                style={{
                    position: "absolute",
                    width: glowDiameter,
                    height: glowDiameter,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    borderRadius: "50%",
                    backgroundColor: glowColor,
                    opacity: 0.08,
                    filter: `blur(${glowSize}px)`,
                    zIndex: 0,
                }}
            />

            {/* Circle button */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: diameter,
                    height: diameter,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 38% 32%, ${bgLight} 0%, ${bgColor} 50%, ${bgDark} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.05)`,
                }}
            >
                {colorIcon ? (
                    <div
                        style={{
                            width: iconSize,
                            height: iconSize,
                            backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(particleSvg)}')`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                        }}
                    />
                ) : (
                    <svg
                        width={iconSize}
                        height={iconSize}
                        viewBox={iconData.viewBox}
                        fill={iconColor}
                    >
                        <path d={iconData.path} />
                    </svg>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EmojiButtons(props: Props) {
    const {
        preset = "like",
        link,
        hoverMessage,
        size = "M",
        particles = {} as ParticlesConfig,
        buttonStyle = {} as StyleConfig,
        style,
    } = props

    // Resolve preset
    const presetData = PRESETS[preset] || PRESETS.like

    const glowSize = buttonStyle.glowSize ?? 16
    const customBtnColor = buttonStyle.buttonColor
    const customGlowColor = buttonStyle.glowColor
    const iconColor = "#FFFFFF"

    // Allow button color override
    const bgColor = customBtnColor || presetData.bgColor
    const bgLight = customBtnColor || presetData.bgLight
    const bgDark = customBtnColor || presetData.bgDark
    const glowColor = customGlowColor || presetData.glowColor
    const particleColors = presetData.particleColors
    const iconKey = presetData.iconKey

    // Particle settings
    const density = particles.density ?? "medium"
    const speedMultiplier = particles.speed ?? 1
    const lifetimeMs = particles.lifetime ?? 800

    // Sizing
    const diameter = SIZE_MAP[size] || 64
    const iconSize = diameter * 0.5
    const glowDiameter = diameter * 1.5

    // State
    const [isHovered, setIsHovered] = useState(false)
    const [particlesRunning, setParticlesRunning] = useState(false)
    const [ringPulse, setRingPulse] = useState(false)
    const poolRef = useRef<DotParticle[]>(createDotPool())
    const buttonControls = useAnimation()

    // Canvas preview
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    if (isCanvas) {
        return (
            <CanvasPreview
                bgColor={bgColor}
                bgLight={bgLight}
                bgDark={bgDark}
                glowColor={glowColor}
                glowSize={glowSize}
                iconColor={iconColor}
                iconKey={iconKey}
                diameter={diameter}
                particleColors={particleColors}
                particleSvg={presetData.particleSvg}
                colorIcon={presetData.colorIcon}
                style={style}
            />
        )
    }

    // Click handler
    const handleClick = useCallback(() => {
        const centerX = diameter / 2
        const centerY = diameter / 2
        const particleCount = DENSITY_MAP[density] || 10

        activateDots(
            poolRef.current,
            particleCount,
            centerX,
            centerY,
            speedMultiplier,
            lifetimeMs,
            diameter / 2
        )

        setParticlesRunning(true)

        // Expanding ring pulse
        setRingPulse(true)
        setTimeout(() => setRingPulse(false), 400)

        buttonControls.start({
            scale: [0.96, 1.02, 1],
            transition: {
                duration: 0.4,
                times: [0, 0.45, 1],
                type: "spring",
                stiffness: 260,
                damping: 18,
            },
        })

        // Haptic
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(20)
        }

        setTimeout(() => {
            const anyActive = poolRef.current.some((p: DotParticle) => p.active)
            if (!anyActive) setParticlesRunning(false)
        }, lifetimeMs + 200)
    }, [density, speedMultiplier, lifetimeMs, diameter, buttonControls])

    // Navigate on click if link is set
    const handleButtonClick = useCallback(() => {
        handleClick()
        if (link) {
            window.open(link, "_blank")
        }
    }, [handleClick, link])

    // Icon data
    const iconData = ICON_PATHS[iconKey] || ICON_PATHS.heart

    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                gap: 6,
                isolation: "isolate",
                zIndex: 0,
            }}
        >
            {/* Button area */}
            <div
                style={{
                    position: "relative",
                    width: diameter,
                    height: diameter,
                }}
            >
                {/* Icon particle layer — full-color emoji SVGs */}
                <IconParticleLayer
                    poolRef={poolRef}
                    running={particlesRunning}
                    svgMarkup={presetData.particleSvg}
                />

                {/* Soft ambient glow — no entry animation */}
                <motion.div
                    initial={{
                        opacity: customGlowColor ? 0.45 : 0.08,
                        scale: 1,
                    }}
                    animate={{
                        opacity: isHovered
                            ? customGlowColor
                                ? 0.65
                                : 0.16
                            : customGlowColor
                              ? 0.45
                              : 0.08,
                        scale: isHovered ? 1.03 : 1,
                    }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        width: glowDiameter,
                        height: glowDiameter,
                        top: "50%",
                        left: "50%",
                        marginTop: -(glowDiameter / 2),
                        marginLeft: -(glowDiameter / 2),
                        borderRadius: "50%",
                        backgroundColor: glowColor,
                        filter: `blur(${glowSize}px)`,
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                />

                {/* Expanding ring pulse on click */}
                {ringPulse && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            width: diameter,
                            height: diameter,
                            top: 0,
                            left: 0,
                            borderRadius: "50%",
                            border: `2px solid ${bgColor}`,
                            zIndex: 1,
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* Circle button */}
                <motion.button
                    animate={buttonControls}
                    whileHover={{
                        scale: 1.04,
                        y: -2,
                        transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 22,
                        },
                    }}
                    whileTap={{
                        scale: 0.96,
                        transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                        },
                    }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    onClick={handleButtonClick}
                    style={{
                        position: "relative",
                        zIndex: 2,
                        width: diameter,
                        height: diameter,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 38% 32%, ${bgLight} 0%, ${bgColor} 50%, ${bgDark} 100%)`,
                        border: "none",
                        outline: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.05)`,
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                        userSelect: "none",
                        padding: 0,
                    }}
                >
                    {presetData.colorIcon ? (
                        <div
                            style={{
                                width: iconSize,
                                height: iconSize,
                                backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(presetData.particleSvg)}')`,
                                backgroundSize: "contain",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                opacity: isHovered ? 1 : 0.95,
                                transition: "opacity 0.25s ease",
                            }}
                        />
                    ) : (
                        <svg
                            width={iconSize}
                            height={iconSize}
                            viewBox={iconData.viewBox}
                            fill={iconColor}
                            style={{
                                opacity: isHovered ? 1 : 0.95,
                                transition: "opacity 0.25s ease",
                            }}
                        >
                            <path d={iconData.path} />
                        </svg>
                    )}
                </motion.button>

                {/* Hover tooltip */}
                <AnimatePresence>
                    {isHovered && hoverMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{
                                duration: 0.2,
                                ease: [0.23, 1, 0.32, 1],
                            }}
                            style={{
                                position: "absolute",
                                bottom: diameter + 10,
                                left: 0,
                                right: 0,
                                display: "flex",
                                justifyContent: "center",
                                zIndex: 10,
                                pointerEvents: "none",
                            }}
                        >
                            <div
                                style={{
                                    background: "rgba(15, 15, 20, 0.88)",
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    fontFamily:
                                        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                    padding: "6px 14px",
                                    borderRadius: 8,
                                    maxWidth: 150,
                                    textAlign: "center" as const,
                                    lineHeight: 1.4,
                                    wordWrap: "break-word" as const,
                                    overflowWrap: "break-word" as const,
                                    boxShadow:
                                        "0 4px 16px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1)",
                                    border: `1px solid rgba(255,255,255,0.08)`,
                                    letterSpacing: "0.01em",
                                    ...(props.tooltipFont || {}),
                                    color: "#ffffff",
                                }}
                            >
                                {hoverMessage}
                            </div>
                            {/* Tooltip arrow */}
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    background: "rgba(15, 15, 20, 0.88)",
                                    transform: "rotate(45deg)",
                                    position: "absolute",
                                    bottom: -4,
                                    left: "50%",
                                    marginLeft: -4,
                                    borderRight: `1px solid rgba(255,255,255,0.08)`,
                                    borderBottom: `1px solid rgba(255,255,255,0.08)`,
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

// ============================================================================
// DEFAULT PROPS
// ============================================================================

EmojiButtons.defaultProps = {
    preset: "like",
    link: undefined,
    hoverMessage: "",
    tooltipFont: undefined,
    size: "M",
    particles: {
        density: "medium",
        speed: 1,
        lifetime: 800,
    },
    buttonStyle: {
        glowSize: 16,
    },
}

// ============================================================================
// PROPERTY CONTROLS
// ============================================================================

addPropertyControls(EmojiButtons, {
    // ═══════════════════════════════════════════════════════════════════════
    // CORE
    // ═══════════════════════════════════════════════════════════════════════
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["like", "vote", "magic", "smile"],
        optionTitles: ["❤️ Like", "👍 Vote", "✨ Magic", "😊 Smile"],
        defaultValue: "like",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["S", "M", "L"],
        optionTitles: ["Small", "Medium", "Large"],
        defaultValue: "M",
        description: " ",
    },
    hoverMessage: {
        type: ControlType.String,
        title: "Hover Text",
        defaultValue: "",
        placeholder: "e.g. Like this!",
        description: " ",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PARTICLES
    // ═══════════════════════════════════════════════════════════════════════
    particles: {
        type: ControlType.Object,
        title: "Particles",
        icon: "effect",
        controls: {
            density: {
                type: ControlType.Enum,
                title: "Density",
                options: ["low", "medium", "high"],
                optionTitles: ["Low (6)", "Medium (10)", "High (15)"],
                defaultValue: "medium",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 1,
                min: 0.3,
                max: 2,
                step: 0.1,
                displayStepper: true,
            },
            lifetime: {
                type: ControlType.Number,
                title: "Lifetime",
                defaultValue: 800,
                min: 300,
                max: 1500,
                step: 50,
                unit: "ms",
                displayStepper: true,
            },
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STYLE
    // ═══════════════════════════════════════════════════════════════════════
    buttonStyle: {
        type: ControlType.Object,
        title: "Style",
        icon: "color",
        controls: {
            buttonColor: {
                type: ControlType.Color,
                title: "Button Color",
                optional: true,
                description: "Overrides preset button color",
            },
            glowColor: {
                type: ControlType.Color,
                title: "Glow Color",
                optional: true,
                description: "Overrides preset glow color",
            },
            glowSize: {
                type: ControlType.Number,
                title: "Glow Size",
                defaultValue: 16,
                min: 0,
                max: 40,
                unit: "px",
            },
        },
    },
    tooltipFont: {
        type: ControlType.Font,
        title: "Tooltip Font",
        controls: "extended",
    },
})
