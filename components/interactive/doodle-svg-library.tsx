// Doodlemania — hand-drawn SVG doodles with a draw-on animation for Framer.
// 119 built-in doodles, custom SVG import, realistic art-tool textures
// (ink, crayon, chalk, marker, highlighter, pencil), staggered stroke
// drawing, scatter effects, one-shot playback.

import * as React from "react"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
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

// types

interface OriginalStyle {
    fill?: string
    stroke?: string
    fillRule?: string
}

interface DoodleDef {
    paths: string[]
    viewBox: [number, number, number, number]
    styles?: OriginalStyle[]
}
interface DoodleChoice {
    pick: string
    custom: boolean
    svgCode: string
}
interface Look {
    mode: string
    ink: string
    gradA: string
    gradB: string
    angle: number
    texture: string
    weight: number
}
interface Move {
    trigger: string
    once: boolean
    play: string
    time: number
    sequence: string
    rhythm: string
    stagger: number
    ease: string
    pause: number
}
interface Effects {
    style: string
    count: number
    color: string
    tint: string
    opacity: number
    spread: number
    weight: number
    seed: number
}
interface Frame {
    size: number
    padding: number
    backdrop: boolean
    tint: string
    radius: number
}
interface Props {
    doodle: DoodleChoice
    look: Look
    move: Move
    fx: Effects
    frame: Frame
}
interface SubPath {
    d: string
    sx: number
    sy: number
    ex: number
    ey: number
}
interface Segment {
    d: string
    len: number
    pathIndex: number
    angle: number
}

const MAX_SEGMENTS = 500
const MAX_FX_PATHS = 160

const VB: [number, number, number, number] = [0, 0, 100, 100]
const D = (paths: string[]): DoodleDef => ({ paths, viewBox: VB })

const DOODLES: Record<string, DoodleDef> = {
    "Star Burst": D([
        "M50 8 L61 36 L91 37 L67 56 L76 88 L50 70 L23 87 L33 55 L9 36 L39 36 Z",
    ]),
    "Love Heart": D([
        "M50 84 C22 62 10 34 32 26 C44 22 50 32 50 39 C50 32 56 22 68 26 C90 34 78 62 50 84 Z",
    ]),
    "Happy Face": D([
        "M50 10 C72 10 90 28 90 50 C90 72 72 90 50 90 C28 90 10 72 10 50 C10 28 28 10 50 10 Z",
        "M35 41 Q39 36 43 41 M57 41 Q61 36 65 41",
        "M34 58 C40 70 60 70 66 58",
    ]),
    "Bolt Flash": D(["M57 8 L28 52 L48 52 L40 92 L74 42 L52 42 Z"]),
    "Sunny Days": D([
        "M50 28 C62 28 72 38 72 50 C72 62 62 72 50 72 C38 72 28 62 28 50 C28 38 38 28 50 28 Z",
        "M50 6 L50 16 M50 84 L50 94 M6 50 L16 50 M84 50 L94 50 M19 19 L26 26 M74 74 L81 81 M81 19 L74 26 M26 74 L19 81",
    ]),
    "Flower Pop": D([
        "M50 42 C55 42 58 46 58 50 C58 55 54 58 50 58 C45 58 42 54 42 50 C42 45 46 42 50 42 Z",
        "M50 40 C38 28 44 12 50 12 C56 12 62 28 50 40 M60 50 C72 38 88 44 88 50 C88 56 72 62 60 50 M50 60 C62 72 56 88 50 88 C44 88 38 72 50 60 M40 50 C28 62 12 56 12 50 C12 44 28 38 40 50",
    ]),
    "Cloud Puff": D([
        "M30 66 C16 66 12 50 25 46 C24 32 42 26 50 36 C55 24 76 28 75 44 C88 46 86 66 70 66 Z",
    ]),
    "Rainbow Bow": D([
        "M14 72 C14 48 30 30 50 30 C70 30 86 48 86 72",
        "M26 72 C26 54 36 42 50 42 C64 42 74 54 74 72",
        "M38 72 C38 60 43 54 50 54 C57 54 62 60 62 72",
    ]),
    "Wavy Lines": D([
        "M8 42 C18 30 28 54 38 42 C48 30 58 54 68 42 C78 30 88 54 95 44",
        "M8 62 C18 50 28 74 38 62 C48 50 58 74 68 62 C78 50 88 74 95 64",
    ]),
    "Spiral Spin": D([
        "M52 50 C52 47 49 46 47 48 C44 51 46 57 51 58 C58 59 63 52 61 45 C58 36 46 34 39 40 C30 48 33 63 43 69 C55 76 73 70 78 57 C84 42 73 24 56 20",
    ]),
    "Arrow Dash": D(["M12 50 L86 50 M72 42 L86 50 L72 58"]),
    "Curly Arrow": D(["M16 76 C24 44 48 24 80 30 M70 21 L80 30 L67 35"]),
    "Check Mark": D(["M16 54 L40 78 L86 22"]),
    "Cross Mark": D(["M24 24 L76 76 M76 24 L24 76"]),
    "Circle Loop": D([
        "M54 10 C76 13 92 32 89 54 C86 77 65 93 43 89 C21 85 7 63 13 41 C18 22 38 8 58 12",
    ]),
    "Swoosh Line": D([
        "M12 56 C30 44 62 66 88 50",
        "M20 68 C40 60 60 72 80 64",
    ]),
    "Peekaboo Eye": D([
        "M12 50 C28 28 72 28 88 50 C72 72 28 72 12 50 Z",
        "M50 41 C55 41 59 45 59 50 C59 55 55 59 50 59 C45 59 41 55 41 50 C41 45 45 41 50 41 Z",
    ]),
    "Talk Bubble": D([
        "M24 20 C18 20 14 24 14 30 L14 56 C14 62 18 66 24 66 L36 66 L34 84 L52 66 L76 66 C82 66 86 62 86 56 L86 30 C86 24 82 20 76 20 Z",
        "M29 43 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M47 43 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M65 43 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0",
    ]),
    "King Crown": D([
        "M18 74 L14 34 L34 50 L50 24 L66 50 L86 34 L82 74 Z M20 82 L80 82",
    ]),
    "Rocket Ship": D([
        "M50 10 C62 20 68 38 66 58 L58 72 L42 72 L34 58 C32 38 38 20 50 10 Z",
        "M43 38 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0",
        "M34 58 L22 74 L38 70 M66 58 L78 74 L62 70",
        "M44 78 C46 86 48 88 50 92 C52 88 54 86 56 78",
    ]),
    "Ghost Buddy": D([
        "M50 12 C68 12 78 26 78 44 L78 84 L68 74 L59 85 L50 75 L41 85 L32 74 L22 84 L22 44 C22 26 32 12 50 12 Z",
        "M38 40 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M54 40 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0",
        "M46 56 Q50 60 54 56",
    ]),
    "Coffee Cup": D([
        "M22 40 L72 40 L68 72 C67 78 61 82 47 82 C33 82 27 78 26 72 Z",
        "M72 46 C84 44 86 58 70 62",
        "M38 28 C36 22 40 20 38 14 M52 28 C50 22 54 20 52 14",
    ]),
    "Music Note": D([
        "M40 70 L40 24 L72 18 L72 60",
        "M32 70 a8 6 0 1 0 16 0 a8 6 0 1 0 -16 0 M64 60 a8 6 0 1 0 16 0 a8 6 0 1 0 -16 0",
    ]),
    "Peace Sign": D([
        "M50 12 C71 12 88 29 88 50 C88 71 71 88 50 88 C29 88 12 71 12 50 C12 29 29 12 50 12 Z",
        "M50 12 L50 88 M50 50 L29 71 M50 50 L71 71",
    ]),
    "Forever Loop": D([
        "M32 50 C32 40 44 40 50 50 C56 60 68 60 68 50 C68 40 56 40 50 50 C44 60 32 60 32 50 Z",
    ]),
    "Planet Ring": D([
        "M50 26 C63 26 74 37 74 50 C74 63 63 74 50 74 C37 74 26 63 26 50 C26 37 37 26 50 26 Z",
        "M8 57 C30 67 70 57 92 39 C70 47 30 61 8 57 Z",
    ]),
    "Sparkle Star": D([
        "M50 8 C54 36 64 46 92 50 C64 54 54 64 50 92 C46 64 36 54 8 50 C36 46 46 36 50 8 Z",
    ]),
    "Moon Glow": D([
        "M60 10 A42 42 0 1 0 60 90 A33 33 0 1 1 60 10 Z",
        "M78 24 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z",
    ]),
    "Fire Flame": D([
        "M52 8 C58 24 74 34 74 56 C74 74 62 88 48 88 C34 88 24 76 24 60 C24 48 32 40 36 30 C40 36 44 38 46 36 C42 28 46 16 52 8 Z",
        "M50 46 C56 54 60 58 58 68 C56 76 46 78 42 72 C40 66 44 62 46 56 C48 52 48 50 50 46 Z",
    ]),
    "Gem Stone": D([
        "M30 22 L70 22 L88 42 L50 86 L12 42 Z",
        "M12 42 L88 42 M30 22 L42 42 L50 86 M70 22 L58 42 L50 86",
    ]),
    "Scribble Fun": D([
        "M40 30 C70 20 85 45 70 62 C55 80 25 75 22 55 C19 35 45 20 62 32 C80 45 68 72 45 70 C28 68 25 48 40 40 C55 32 66 45 58 56",
    ]),
    "Letter A": D(["M30 80 L50 20 L70 80 M38 58 L62 58"]),
    "Letter B": D([
        "M36 20 L34 80 M36 20 C56 18 62 30 56 40 C51 48 40 48 35 48 C52 48 64 53 62 66 C60 79 44 82 34 80",
    ]),
    "Letter C": D([
        "M68 30 C60 18 40 18 34 35 C28 52 30 68 40 76 C50 84 64 78 68 70",
    ]),
    "Letter D": D([
        "M36 20 L34 80 M36 20 C60 22 70 40 68 52 C66 68 52 80 34 80",
    ]),
    "Letter E": D(["M64 22 L38 24 L36 50 L56 49 M36 50 L34 78 L64 78"]),
    "Letter F": D(["M64 22 L38 24 L36 50 L56 49 M36 50 L34 80"]),
    "Letter G": D([
        "M68 30 C58 18 38 20 33 38 C28 56 32 72 44 78 C56 84 66 74 65 62 L52 60",
    ]),
    "Letter H": D(["M34 20 L32 80 M66 20 L64 80 M33 52 L65 50"]),
    "Letter I": D(["M50 22 L48 78 M40 22 L60 21 M38 79 L60 78"]),
    "Letter J": D(["M62 20 C62 45 62 65 58 72 C52 82 40 80 36 70"]),
    "Letter K": D(["M36 20 L34 80 M64 26 L36 54 M44 48 L66 80"]),
    "Letter L": D(["M38 20 L36 78 L66 78"]),
    "Letter M": D(["M30 80 L34 22 L50 60 L66 22 L70 80"]),
    "Letter N": D(["M34 80 L36 22 L64 78 L66 22"]),
    "Letter O": D([
        "M50 20 C34 20 28 36 29 50 C30 66 38 80 51 80 C66 80 72 64 71 50 C70 34 64 20 50 20 Z",
    ]),
    "Letter P": D(["M36 80 L38 20 C56 18 66 26 64 38 C62 50 48 52 37 50"]),
    "Letter Q": D([
        "M50 20 C34 20 28 36 29 50 C30 66 38 80 51 80 C66 80 72 64 71 50 C70 34 64 20 50 20 Z M58 68 L72 84",
    ]),
    "Letter R": D([
        "M36 80 L38 20 C56 18 66 26 64 38 C62 50 48 52 37 50 M46 50 L66 80",
    ]),
    "Letter S": D([
        "M64 28 C56 18 38 20 36 32 C34 44 60 46 62 60 C64 74 44 82 34 72",
    ]),
    "Letter T": D(["M32 22 L68 21 M50 22 L48 80"]),
    "Letter U": D([
        "M34 20 C33 45 32 65 38 73 C45 82 58 80 62 70 C66 60 65 40 64 20",
    ]),
    "Letter V": D(["M32 20 L50 80 L68 20"]),
    "Letter W": D(["M28 20 L38 80 L50 40 L62 80 L72 20"]),
    "Letter X": D(["M34 22 L66 78 M66 22 L34 78"]),
    "Letter Y": D(["M34 20 L50 50 L66 20 M50 50 L48 80"]),
    "Letter Z": D(["M34 22 L66 22 L34 78 L68 78"]),
    "Number 0": D([
        "M50 20 C36 20 32 38 32 50 C32 64 38 80 50 80 C63 80 68 63 68 50 C68 37 63 20 50 20 Z",
    ]),
    "Number 1": D(["M40 30 L52 20 L50 80"]),
    "Number 2": D(["M36 30 C40 18 60 18 62 30 C64 42 44 58 34 78 L66 78"]),
    "Number 3": D([
        "M36 26 C46 16 62 20 62 32 C62 42 50 46 46 46 C54 46 64 50 63 62 C62 76 44 82 34 72",
    ]),
    "Number 4": D(["M60 80 L62 20 L32 62 L72 60"]),
    "Number 5": D([
        "M62 22 L40 24 L37 48 C46 42 62 44 64 58 C66 72 50 82 36 74",
    ]),
    "Number 6": D([
        "M58 20 C44 34 34 50 34 62 C34 74 42 80 50 79 C60 78 65 68 62 58 C59 48 46 46 38 54",
    ]),
    "Number 7": D(["M34 22 L66 22 L46 80"]),
    "Number 8": D([
        "M50 48 C40 46 35 38 38 30 C41 21 59 21 62 30 C65 38 60 46 50 48 C39 50 33 59 36 68 C39 78 61 78 64 68 C67 59 61 50 50 48",
    ]),
    "Number 9": D([
        "M62 44 C62 32 52 26 44 30 C36 34 36 46 44 50 C52 54 62 50 62 44 C64 58 58 72 46 80",
    ]),
    "Bang Mark": D(["M50 18 L48 62 M48 78 L48 80"]),
    "Query Mark": D([
        "M36 30 C40 18 62 18 64 32 C66 44 50 48 50 60 M50 76 L50 78",
    ]),
    "Dot Mark": D(["M50 76 L50 78"]),
    "Comma Mark": D(["M52 72 C52 80 48 84 44 88"]),
    "Quote Mark": D(["M44 22 C44 30 40 34 38 36 M58 22 C58 30 54 34 52 36"]),
    "And Mark": D([
        "M66 78 C52 64 42 52 42 40 C42 28 54 24 58 32 C62 40 48 58 36 68 C30 74 34 82 42 80 C50 78 60 70 68 60",
    ]),
    "Scribble Line": D([
        "M10 50 C20 40 18 60 28 50 C38 40 36 60 46 50 C56 40 54 60 64 50 C74 40 72 60 82 50 C88 44 90 52 92 50",
    ]),
    "Tight Scrib": D([
        "M14 56 L20 44 L25 56 L30 44 L35 56 L40 44 L45 56 L50 44 L55 56 L60 44 L65 56 L70 44 L75 56 L80 44 L86 56",
    ]),
    "Loose Scrib": D([
        "M12 52 C22 44 20 58 30 50 C40 42 38 58 48 50 C58 42 56 58 66 50 C76 42 74 58 86 50",
    ]),
    "Spiral Tight": D([
        "M50 50 C52 48 54 50 53 52 C51 55 46 54 45 50 C44 45 50 41 55 43 C61 45 62 53 57 57 C51 62 42 59 39 52 C36 44 42 36 51 35 C61 34 69 42 68 51 C67 61 57 68 47 66",
    ]),
    "Loop Line": D([
        "M10 60 C15 40 25 40 25 55 C25 70 15 70 20 55 C25 40 35 40 35 55 C35 70 25 70 30 55 C35 40 45 40 45 55 C45 70 35 70 40 55 C45 40 55 40 55 55 C55 70 45 70 50 55 C55 40 65 40 65 55 C65 70 55 70 60 55 C65 40 75 40 78 55",
    ]),
    "Wave Tight": D([
        "M10 50 Q15 40 20 50 T30 50 T40 50 T50 50 T60 50 T70 50 T80 50 T90 50",
    ]),
    "Zigzag Line": D([
        "M10 60 L22 40 L34 60 L46 40 L58 60 L70 40 L82 60 L90 46",
    ]),
    "Hatch Patch": D([
        "M20 70 L40 30 M30 74 L50 34 M40 78 L60 38 M50 80 L70 40 M60 82 L80 42",
    ]),
    "Hatch Dense": D([
        "M16 66 L32 34 M24 70 L40 38 M32 74 L48 42 M40 78 L56 46 M48 80 L64 48 M56 82 L72 50 M64 84 L80 52",
    ]),
    "Cross Hatch": D([
        "M20 70 L45 30 M32 74 L57 34 M44 78 L69 38 M56 80 L81 40 M30 34 L55 74 M42 30 L67 70 M54 34 L79 74",
    ]),
    "Scratch Trio": D(["M20 40 L72 34 M18 52 L76 46 M22 64 L72 58"]),
    "Tangle Knot": D([
        "M35 40 C60 25 78 45 65 60 C52 75 28 70 26 55 C24 40 45 32 58 40 C71 48 62 66 46 64 C34 62 32 50 42 46",
    ]),
    "Curly Cue": D([
        "M20 60 C20 40 40 40 40 55 C40 68 26 68 28 56 C30 44 46 42 52 52 C58 62 50 72 42 70 C50 66 60 60 72 58",
    ]),
    "Spring Coil": D([
        "M16 50 a6 12 0 1 0 12 0 a6 12 0 1 0 -12 0 M26 50 a6 12 0 1 0 12 0 a6 12 0 1 0 -12 0 M36 50 a6 12 0 1 0 12 0 a6 12 0 1 0 -12 0 M46 50 a6 12 0 1 0 12 0 a6 12 0 1 0 -12 0 M56 50 a6 12 0 1 0 12 0 a6 12 0 1 0 -12 0 M66 50 a6 12 0 1 0 12 0 a6 12 0 1 0 -12 0",
    ]),
    "Wave Vertical": D(["M50 10 Q40 18 50 26 T50 42 T50 58 T50 74 T50 90"]),
    "Dash Row": D(["M14 50 L28 50 M38 50 L52 50 M62 50 L76 50 M84 50 L92 50"]),
    "Dot Row": D(["M25 50 L25 51 M50 50 L50 51 M75 50 L75 51"]),
    "Slash Marks": D(["M30 70 L45 30 M45 72 L60 32 M60 74 L75 34"]),
    "Emphasis Rays": D([
        "M50 32 L50 12 M30 38 L18 24 M70 38 L82 24 M22 54 L8 50 M78 54 L92 50",
    ]),
    "Swirl S": D(["M30 30 C50 20 60 40 45 48 C30 56 40 76 62 68"]),
    "Pretzel Knot": D([
        "M30 50 C30 30 55 30 55 50 C55 70 30 70 30 50 C30 35 70 35 70 50 C70 65 45 65 45 50",
    ]),
    "Halo Rays": D([
        "M22.9 52.7 L11.3 49.6 M30.2 40.2 L21.7 31.7 M42.7 32.9 L39.6 21.3 M57.3 32.9 L60.4 21.3 M59.8 40.2 L68.3 31.7 M77.1 52.7 L88.7 49.6 M22.9 67.3 L11.3 70.4 M77.1 67.3 L88.7 70.4",
    ]),
    "Highlight Scrib": D([
        "M18 68 L28 32 L30 68 L40 32 L42 68 L52 32 L54 68 L64 32 L66 68 L76 32 L78 68 L86 34",
    ]),
    "Circle Scrib": D([
        "M16 50 C20 32 64 24 80 36 C92 46 70 62 44 64 C24 66 12 60 16 50 C20 36 66 28 82 40 C92 50 68 66 42 66 C22 66 12 58 18 48 C24 34 68 30 80 42 C90 52 66 64 44 64",
    ]),
    "Arrow Curvy": D(["M15 70 C30 40 60 40 80 30 M66 29 L80 30 L73 42"]),
    "Arrow Loop": D([
        "M14 62 C22 40 40 38 42 50 C44 62 28 64 28 52 C28 40 46 36 58 40 L74 44 M64 34 L74 44 L61 48",
    ]),
    "Arrow Spiral": D([
        "M50 50 C54 46 60 48 60 54 C60 62 50 66 42 62 C32 56 32 42 42 34 C54 24 72 30 76 42 M79 28 L76 42 L66 33",
    ]),
    "Arrow Uturn": D([
        "M30 25 L30 55 C30 70 50 70 50 55 L50 35 M43 47 L50 35 L57 47",
    ]),
    "Arrow Zigzag": D([
        "M12 60 L26 42 L38 60 L52 42 L64 60 L80 44 M77 58 L80 44 L67 48",
    ]),
    "Arrow Wave": D(["M12 55 Q22 40 32 55 T52 55 T72 55 M60 48 L72 55 L60 62"]),
    "Arrow Double": D([
        "M18 50 L82 50 M30 43 L18 50 L30 57 M70 43 L82 50 L70 57",
    ]),
    "Arrow Elbow": D(["M20 75 L20 40 L70 40 M58 33 L70 40 L58 47"]),
    "Arrow Corner": D(["M25 25 L25 65 L70 65 M58 58 L70 65 L58 72"]),
    "Arrow Circle": D(["M70 30 A28 28 0 1 0 78 55 M76 69 L78 55 L65 60"]),
    "Arrow Swoosh": D(["M15 75 C35 70 60 55 78 28 M77 42 L78 28 L66 34"]),
    "Arrow Hook": D(["M20 30 C20 60 40 75 65 70 M52 66 L65 70 L55 79"]),
    "Arrow Curl": D([
        "M14 50 C22 38 34 40 32 50 C30 58 20 56 22 48 C24 40 36 38 46 42 L70 46 M58 39 L70 46 L58 53",
    ]),
    "Arrow Bounce": D([
        "M15 70 C25 45 40 45 48 68 C56 45 70 45 80 66 M81 52 L80 66 L69 58",
    ]),
    "Arrow Trail": D([
        "M14 50 L26 50 M34 50 L46 50 M54 50 L66 50 M60 43 L72 50 L60 57",
    ]),
    "Arrow Triple": D([
        "M50 80 L50 30 M43 42 L50 30 L57 42 M42 56 L50 44 L58 56",
    ]),
    "Arrow Fork": D([
        "M20 70 C40 60 45 50 48 40 M48 40 C50 30 60 25 72 22 M48 40 C58 42 68 48 78 56 M59 18 L72 22 L62 32 M73 43 L78 56 L64 54",
    ]),
    "Arrow De Loop": D([
        "M12 60 C20 38 36 36 36 50 C36 62 22 62 24 50 C26 38 44 36 52 44 C60 52 68 48 78 42 M64 42 L78 42 L71 54",
    ]),
    "Arrow Dive": D(["M20 25 C40 30 55 45 60 70 M51 60 L60 70 L65 57"]),
    "Arrow Cross": D([
        "M20 70 L75 30 M61 31 L75 30 L69 43 M25 30 L75 70 M61 68 L75 70 L70 57",
    ]),
    "Arrow Return": D([
        "M20 40 L70 40 M70 40 C85 40 85 60 70 60 L30 60 M42 53 L30 60 L42 67",
    ]),
    "Arrow Spring": D([
        "M13 50 a7 12 0 1 0 14 0 a7 12 0 1 0 -14 0 M25 50 a7 12 0 1 0 14 0 a7 12 0 1 0 -14 0 M37 50 a7 12 0 1 0 14 0 a7 12 0 1 0 -14 0 M49 50 a7 12 0 1 0 14 0 a7 12 0 1 0 -14 0 M63 50 L78 50 M66 43 L78 50 L66 57",
    ]),
}

const DOODLE_KEYS = Object.keys(DOODLES)

const COLOR_MODES = ["Solid", "Gradient", "Origin"]
const TEXTURES = [
    "Clean Ink",
    "Crayon Art",
    "Chalk Dust",
    "Bold Marker",
    "Hi-Liter",
    "Soft Pencil",
]
const TRIGGERS = [
    "Enter View",
    "Hover Over",
    "Tap to Play",
    "Loop Replay",
    "Always Drawn",
]
const PLAY_STYLES = [
    "Draw Lines",
    "Soft Fade In",
    "Pop & Scale",
    "Blur Reveal",
    "Slide In Up",
]
const SEQUENCES = ["All Together", "Line by Line", "Stroke by Stroke"]
const RHYTHMS = ["Chain Flow", "Fixed Gap", "Shuffle Ink"]
const EASE_NAMES = ["Silky Smooth", "Bouncy Pop", "Steady Flow", "Swift Swoosh"]

const STREAK_TEXTURES = [
    "Crayon Art",
    "Bold Marker",
    "Hi-Liter",
    "Soft Pencil",
    "Chalk Dust",
]
const STREAK_SAFE_PLAYS = ["Draw Lines", "Soft Fade In", "Blur Reveal"]

const EASES: Record<string, any> = {
    "Silky Smooth": [0.65, 0, 0.35, 1],
    "Bouncy Pop": { type: "spring", stiffness: 110, damping: 13, mass: 0.9 },
    "Steady Flow": "linear",
    "Swift Swoosh": [0.22, 1, 0.36, 1],
}

const FX_NONE = "No Effect"
const FX_STYLES = [
    FX_NONE,
    "Scratchy Mess",
    "Hatch Lines",
    "Cross Hatch",
    "Circle Marks",
    "Star Sprinkle",
    "Scribble Rings",
    "Arrow Marks",
    "Wavy Marks",
    "Zigzag Flick",
    "Cross Stamps",
    "Dot Cluster",
    "Top Squiggle",
    "Bottom Dash",
    "Scatter Dust",
]

function mulberry32(seed: number) {
    let s = seed | 0
    return () => {
        s = (s + 0x6d2b79f5) | 0
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const cubicPts = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    n = 8
): number[][] => {
    const pts: number[][] = []
    for (let k = 0; k <= n; k++) {
        const t = k / n,
            u = 1 - t
        pts.push([
            u * u * u * x0 +
                3 * u * u * t * x1 +
                3 * u * t * t * x2 +
                t * t * t * x3,
            u * u * u * y0 +
                3 * u * u * t * y1 +
                3 * u * t * t * y2 +
                t * t * t * y3,
        ])
    }
    return pts
}

const quadPts = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    n = 6
): number[][] => {
    const pts: number[][] = []
    for (let k = 0; k <= n; k++) {
        const t = k / n,
            u = 1 - t
        pts.push([
            u * u * x0 + 2 * u * t * x1 + t * t * x2,
            u * u * y0 + 2 * u * t * y1 + t * t * y2,
        ])
    }
    return pts
}

function arcPoints(
    x1: number,
    y1: number,
    rx: number,
    ry: number,
    rotDeg: number,
    fa: number,
    fs: number,
    x2: number,
    y2: number,
    n = 12
): number[][] {
    if (rx === 0 || ry === 0)
        return [
            [x1, y1],
            [x2, y2],
        ]
    const phi = (rotDeg * Math.PI) / 180,
        cos = Math.cos(phi),
        sin = Math.sin(phi)
    const dx = (x1 - x2) / 2,
        dy = (y1 - y2) / 2
    const x1p = cos * dx + sin * dy,
        y1p = -sin * dx + cos * dy
    let rx2 = rx * rx,
        ry2 = ry * ry
    const lam = (x1p * x1p) / rx2 + (y1p * y1p) / ry2
    if (lam > 1) {
        const s = Math.sqrt(lam)
        rx *= s
        ry *= s
        rx2 = rx * rx
        ry2 = ry * ry
    }
    const num = Math.max(rx2 * ry2 - rx2 * y1p * y1p - ry2 * x1p * x1p, 0)
    const den = rx2 * y1p * y1p + ry2 * x1p * x1p
    const coef = Math.sqrt(num / (den || 1)) * (fa === fs ? -1 : 1)
    const cxp = coef * ((rx * y1p) / ry),
        cyp = coef * ((-ry * x1p) / rx)
    const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
    const cy = sin * cxp + cos * cyp + (y1 + y2) / 2
    const ux = (x1p - cxp) / rx,
        uy = (y1p - cyp) / ry
    const vx = (-x1p - cxp) / rx,
        vy = (-y1p - cyp) / ry
    const dot = ux * vx + uy * vy
    const cross = ux * vy - uy * vx
    let d = Math.acos(
        Math.max(
            -1,
            Math.min(1, dot / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1))
        )
    )
    if (cross < 0) d = -d
    if (!fs && d > 0) d -= 2 * Math.PI
    if (fs && d < 0) d += 2 * Math.PI
    const theta1 = Math.atan2(uy, ux)
    const pts: number[][] = []
    for (let k = 0; k <= n; k++) {
        const t = theta1 + (d * k) / n
        const px = rx * Math.cos(t),
            py = ry * Math.sin(t)
        pts.push([cos * px - sin * py + cx, sin * px + cos * py + cy])
    }
    return pts
}

const CMD_RE = /[MmLlHhVvCcSsQqTtAaZz]/
const TOKEN_RE =
    /[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g

function estimateLength(d: string): number {
    const tokens = d.match(TOKEN_RE)
    if (!tokens) return 1
    const isNum = (t?: string) => !!t && !CMD_RE.test(t)
    let i = 0,
        x = 0,
        y = 0,
        sx = 0,
        sy = 0,
        px = 0,
        py = 0,
        len = 0
    let raw = "",
        prevRel = false
    const N = () => parseFloat(tokens[i++])
    const add = (pts: number[][]) => {
        for (let k = 1; k < pts.length; k++)
            len += Math.hypot(
                pts[k][0] - pts[k - 1][0],
                pts[k][1] - pts[k - 1][1]
            )
    }
    const line = (nx: number, ny: number) => {
        len += Math.hypot(nx - x, ny - y)
        x = nx
        y = ny
        px = x
        py = y
    }
    while (i < tokens.length) {
        if (!isNum(tokens[i])) {
            raw = tokens[i++]
            prevRel = raw === raw.toLowerCase() && raw.toUpperCase() !== "Z"
        } else if (raw.toUpperCase() === "M") raw = prevRel ? "l" : "L"
        const rel = raw === raw.toLowerCase() && raw.toUpperCase() !== "Z"
        switch (raw.toUpperCase()) {
            case "M": {
                let nx = N(),
                    ny = N()
                if (rel) {
                    nx += x
                    ny += y
                }
                x = sx = nx
                y = sy = ny
                px = x
                py = y
                break
            }
            case "L": {
                let nx = N(),
                    ny = N()
                if (rel) {
                    nx += x
                    ny += y
                }
                line(nx, ny)
                break
            }
            case "H": {
                let nx = N()
                if (rel) nx += x
                line(nx, y)
                break
            }
            case "V": {
                let ny = N()
                if (rel) ny += y
                line(x, ny)
                break
            }
            case "C": {
                let x1 = N(),
                    y1 = N(),
                    x2 = N(),
                    y2 = N(),
                    nx = N(),
                    ny = N()
                if (rel) {
                    x1 += x
                    y1 += y
                    x2 += x
                    y2 += y
                    nx += x
                    ny += y
                }
                add(cubicPts(x, y, x1, y1, x2, y2, nx, ny))
                px = x2
                py = y2
                x = nx
                y = ny
                break
            }
            case "S": {
                const x1 = 2 * x - px,
                    y1 = 2 * y - py
                let x2 = N(),
                    y2 = N(),
                    nx = N(),
                    ny = N()
                if (rel) {
                    x2 += x
                    y2 += y
                    nx += x
                    ny += y
                }
                add(cubicPts(x, y, x1, y1, x2, y2, nx, ny))
                px = x2
                py = y2
                x = nx
                y = ny
                break
            }
            case "Q": {
                let x1 = N(),
                    y1 = N(),
                    nx = N(),
                    ny = N()
                if (rel) {
                    x1 += x
                    y1 += y
                    nx += x
                    ny += y
                }
                add(quadPts(x, y, x1, y1, nx, ny))
                px = x1
                py = y1
                x = nx
                y = ny
                break
            }
            case "T": {
                const qx = 2 * x - px,
                    qy = 2 * y - py
                let nx = N(),
                    ny = N()
                if (rel) {
                    nx += x
                    ny += y
                }
                add(quadPts(x, y, qx, qy, nx, ny))
                px = qx
                py = qy
                x = nx
                y = ny
                break
            }
            case "A": {
                let rx = N(),
                    ry = N(),
                    rot = N(),
                    fa = N(),
                    fs = N(),
                    nx = N(),
                    ny = N()
                if (rel) {
                    nx += x
                    ny += y
                }
                add(arcPoints(x, y, rx, ry, rot, fa, fs, nx, ny))
                x = nx
                y = ny
                px = x
                py = y
                break
            }
            case "Z": {
                line(sx, sy)
                break
            }
        }
    }
    return Math.max(len, 0.001)
}

function splitSubpaths(d: string): SubPath[] {
    const tokens = d.match(TOKEN_RE)
    if (!tokens) return [{ d, sx: 0, sy: 0, ex: 0, ey: 0 }]
    const isNum = (t?: string) => !!t && !CMD_RE.test(t)
    const round = (v: number) => Math.round(v * 100) / 100
    const out: SubPath[] = []
    let cur: string[] = []
    let i = 0,
        x = 0,
        y = 0,
        sx = 0,
        sy = 0,
        lx = 0,
        ly = 0
    let cmd = ""
    const N = () => parseFloat(tokens[i++])
    const emit = (...parts: (string | number)[]) => cur.push(parts.join(" "))
    const flush = () => {
        if (cur.length) {
            out.push({ d: cur.join(" "), sx, sy, ex: lx, ey: ly })
            cur = []
        }
    }
    while (i < tokens.length) {
        if (!isNum(tokens[i])) cmd = tokens[i++]
        else if (cmd.toUpperCase() === "M") cmd = cmd === "m" ? "l" : "L"
        const rel = cmd === cmd.toLowerCase() && cmd.toUpperCase() !== "Z"
        switch (cmd.toUpperCase()) {
            case "M": {
                let nx = N(),
                    ny = N()
                if (rel) {
                    nx += x
                    ny += y
                }
                flush()
                x = sx = lx = nx
                y = sy = ly = ny
                emit("M", round(x), round(y))
                break
            }
            case "L": {
                let nx = N(),
                    ny = N()
                if (rel) {
                    nx += x
                    ny += y
                }
                x = nx
                y = ny
                lx = x
                ly = y
                emit("L", round(x), round(y))
                break
            }
            case "H": {
                let nx = N()
                if (rel) nx += x
                x = nx
                lx = x
                ly = y
                emit("L", round(x), round(y))
                break
            }
            case "V": {
                let ny = N()
                if (rel) ny += y
                y = ny
                lx = x
                ly = y
                emit("L", round(x), round(y))
                break
            }
            case "C": {
                let x1 = N(),
                    y1 = N(),
                    x2 = N(),
                    y2 = N(),
                    nx = N(),
                    ny = N()
                if (rel) {
                    x1 += x
                    y1 += y
                    x2 += x
                    y2 += y
                    nx += x
                    ny += y
                }
                x = nx
                y = ny
                lx = x
                ly = y
                emit(
                    "C",
                    round(x1),
                    round(y1),
                    round(x2),
                    round(y2),
                    round(x),
                    round(y)
                )
                break
            }
            case "S": {
                let x2 = N(),
                    y2 = N(),
                    nx = N(),
                    ny = N()
                if (rel) {
                    x2 += x
                    y2 += y
                    nx += x
                    ny += y
                }
                x = nx
                y = ny
                lx = x
                ly = y
                emit("S", round(x2), round(y2), round(x), round(y))
                break
            }
            case "Q": {
                let x1 = N(),
                    y1 = N(),
                    nx = N(),
                    ny = N()
                if (rel) {
                    x1 += x
                    y1 += y
                    nx += x
                    ny += y
                }
                x = nx
                y = ny
                lx = x
                ly = y
                emit("Q", round(x1), round(y1), round(x), round(y))
                break
            }
            case "T": {
                let nx = N(),
                    ny = N()
                if (rel) {
                    nx += x
                    ny += y
                }
                x = nx
                y = ny
                lx = x
                ly = y
                emit("T", round(x), round(y))
                break
            }
            case "A": {
                let rx = N(),
                    ry = N(),
                    rot = N(),
                    fa = N(),
                    fs = N(),
                    nx = N(),
                    ny = N()
                if (rel) {
                    nx += x
                    ny += y
                }
                x = nx
                y = ny
                lx = x
                ly = y
                emit(
                    "A",
                    round(rx),
                    round(ry),
                    round(rot),
                    fa,
                    fs,
                    round(x),
                    round(y)
                )
                break
            }
            case "Z": {
                x = sx
                y = sy
                lx = x
                ly = y
                emit("Z")
                break
            }
        }
    }
    flush()
    return out.length ? out : [{ d, sx: 0, sy: 0, ex: 0, ey: 0 }]
}

const chordAngle = (sx: number, sy: number, ex: number, ey: number): number => {
    if (Math.hypot(ex - sx, ey - sy) < 0.5) return 0
    return (Math.atan2(ey - sy, ex - sx) * 180) / Math.PI
}

function buildSegments(paths: string[], sequence: string): Segment[] {
    let segs: Segment[] = []
    if (sequence === "Stroke by Stroke") {
        paths.forEach((p, pi) => {
            splitSubpaths(p).forEach((sp) => {
                segs.push({
                    d: sp.d,
                    len: estimateLength(sp.d),
                    pathIndex: pi,
                    angle: chordAngle(sp.sx, sp.sy, sp.ex, sp.ey),
                })
            })
        })
        if (!segs.length)
            segs = paths.map((p, i) => ({
                d: p,
                len: estimateLength(p),
                pathIndex: i,
                angle: 0,
            }))
    } else {
        paths.forEach((p, pi) => {
            const subs = splitSubpaths(p)
            const first = subs[0]
            const last = subs[subs.length - 1]
            const d = subs.map((s) => s.d).join(" ")
            segs.push({
                d,
                len: estimateLength(d),
                pathIndex: pi,
                angle: chordAngle(first.sx, first.sy, last.ex, last.ey),
            })
        })
    }
    return segs.length > MAX_SEGMENTS ? segs.slice(0, MAX_SEGMENTS) : segs
}

function buildSchedule(
    segs: Segment[],
    rhythm: string,
    gap: number,
    time: number
): { delay: number; duration: number }[] {
    const n = segs.length
    const out = Array.from({ length: n }, () => ({ delay: 0, duration: time }))
    if (!n) return out
    if (rhythm === "Fixed Gap") {
        for (let i = 0; i < n; i++) out[i] = { delay: i * gap, duration: time }
        return out
    }
    const order = Array.from({ length: n }, (_, i) => i)
    if (rhythm === "Shuffle Ink") {
        const rnd = mulberry32(4242)
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1))
            ;[order[i], order[j]] = [order[j], order[i]]
        }
    }
    const total = segs.reduce((s, g) => s + g.len, 0) || 1
    let cursor = 0
    order.forEach((segIndex) => {
        const dur = Math.max(time * (segs[segIndex].len / total), 0.08)
        out[segIndex] = { delay: cursor, duration: dur }
        cursor += dur
    })
    return out
}

function generateEffects(
    style: string,
    count: number,
    spread: number,
    seed: number,
    viewBox: [number, number, number, number]
): string[] {
    if (style === FX_NONE || count <= 0) return []
    const [vx, vy, vw, vh] = viewBox
    const cx = vx + vw / 2,
        cy = vy + vh / 2
    const base = Math.min(vw, vh)
    const rand = mulberry32(seed || 1337)
    const innerR = base * 0.42
    const outerR = base * (0.55 + spread * 0.01)
    const place = (size: number) => {
        const r = innerR + (outerR - innerR) * rand()
        const a = rand() * Math.PI * 2
        return {
            x: cx + Math.cos(a) * r,
            y: cy + Math.sin(a) * r,
            a: rand() * 360,
            s: size * (0.6 + rand() * 0.8),
        }
    }
    const paths: string[] = []
    switch (style) {
        case "Scratchy Mess":
            for (let i = 0; i < count; i++) {
                const p = place(base * 0.12),
                    rad = (p.a * Math.PI) / 180,
                    dx = Math.cos(rad) * p.s,
                    dy = Math.sin(rad) * p.s,
                    wb = (rand() - 0.5) * 2
                paths.push(
                    `M ${p.x - dx} ${p.y - dy + wb} L ${p.x + dx} ${p.y + dy + wb}`
                )
            }
            break
        case "Hatch Lines": {
            const rad = ((45 + rand() * 90) * Math.PI) / 180,
                cos = Math.cos(rad),
                sin = Math.sin(rad),
                sp = base / (count + 1)
            for (let i = 0; i < count; i++) {
                const off = (i + 1) * sp - base / 2,
                    l = base * 0.6
                paths.push(
                    `M ${cx + cos * -l - sin * off} ${cy + sin * -l + cos * off} L ${cx + cos * l - sin * off} ${cy + sin * l + cos * off}`
                )
            }
            break
        }
        case "Cross Hatch":
            for (let pass = 0; pass < 2; pass++) {
                const rad = ((pass * 90 + 30) * Math.PI) / 180,
                    cos = Math.cos(rad),
                    sin = Math.sin(rad)
                const half = Math.floor(count / 2),
                    sp = base / (half + 1)
                for (let i = 0; i < half; i++) {
                    const off = (i + 1) * sp - base / 2,
                        l = base * 0.5
                    paths.push(
                        `M ${cx + cos * -l - sin * off} ${cy + sin * -l + cos * off} L ${cx + cos * l - sin * off} ${cy + sin * l + cos * off}`
                    )
                }
            }
            break
        case "Circle Marks":
            for (let i = 0; i < count; i++) {
                const p = place(base * 0.06),
                    r = p.s,
                    w1 = (rand() - 0.5) * r * 0.4,
                    w2 = (rand() - 0.5) * r * 0.4
                paths.push(
                    `M ${p.x - r} ${p.y + w1} A ${r} ${r + w2} 0 1 0 ${p.x + r} ${p.y - w1} A ${r} ${r - w2} 0 1 0 ${p.x - r} ${p.y + w1}`
                )
            }
            break
        case "Star Sprinkle":
            for (let i = 0; i < count; i++) {
                const p = place(base * 0.08),
                    inner = p.s * 0.4,
                    outer = p.s
                let d = ""
                for (let k = 0; k < 8; k++) {
                    const rad = ((p.a + (k * 360) / 8) * Math.PI) / 180,
                        r = k % 2 === 0 ? outer : inner
                    d +=
                        k === 0
                            ? `M ${p.x + Math.cos(rad) * r} ${p.y + Math.sin(rad) * r}`
                            : ` L ${p.x + Math.cos(rad) * r} ${p.y + Math.sin(rad) * r}`
                }
                paths.push(d + " Z")
            }
            break
        case "Scribble Rings":
            for (let i = 0; i < count; i++) {
                const p = place(base * 0.08),
                    r = p.s,
                    wb = r * 0.3
                paths.push(
                    `M ${p.x - r + rand() * wb} ${p.y} C ${p.x - r} ${p.y - r + rand() * wb}, ${p.x + r + rand() * wb} ${p.y - r}, ${p.x + r} ${p.y + rand() * wb} C ${p.x + r + rand() * wb} ${p.y + r}, ${p.x - r + rand() * wb} ${p.y + r}, ${p.x - r + rand() * wb} ${p.y}`
                )
            }
            break
        case "Arrow Marks":
            for (let i = 0; i < count; i++) {
                const p = place(base * 0.1),
                    rad = (p.a * Math.PI) / 180,
                    cos = Math.cos(rad),
                    sin = Math.sin(rad),
                    l = p.s,
                    tx = p.x + cos * l,
                    ty = p.y + sin * l,
                    hl = l * 0.4
                paths.push(
                    `M ${p.x - cos * l} ${p.y - sin * l} L ${tx} ${ty} M ${tx - cos * hl + sin * hl * 0.5} ${ty - sin * hl - cos * hl * 0.5} L ${tx} ${ty} L ${tx - cos * hl - sin * hl * 0.5} ${ty - sin * hl + cos * hl * 0.5}`
                )
            }
            break
        case "Wavy Marks":
            for (let i = 0; i < count; i++) {
                const p = place(base * 0.12),
                    rad = (p.a * Math.PI) / 180,
                    cos = Math.cos(rad),
                    sin = Math.sin(rad),
                    l = p.s * 2,
                    amp = l * 0.2
                let d = `M ${p.x - cos * l} ${p.y - sin * l}`
                for (let k = 1; k <= 6; k++) {
                    const t = (k / 6) * l * 2 - l,
                        side = k % 2 === 0 ? 0 : k % 4 === 1 ? 1 : -1
                    d += ` L ${p.x + cos * t - sin * side * amp} ${p.y + sin * t + cos * side * amp}`
                }
                paths.push(d)
            }
            break
        case "Zigzag Flick":
            for (let i = 0; i < count; i++) {
                const p = place(base * 0.1),
                    rad = (p.a * Math.PI) / 180,
                    cos = Math.cos(rad),
                    sin = Math.sin(rad),
                    l = p.s * 1.5,
                    amp = l * 0.35
                let d = `M ${p.x - cos * l} ${p.y - sin * l}`
                for (let k = 1; k <= 4; k++) {
                    const t = (k / 4) * l * 2 - l,
                        side = k % 2 === 0 ? 1 : -1
                    d += ` L ${p.x + cos * t - sin * side * amp} ${p.y + sin * t + cos * side * amp}`
                }
                paths.push(d)
            }
            break
        case "Cross Stamps":
            for (let i = 0; i < count; i++) {
                const p = place(base * 0.08),
                    rad = (p.a * Math.PI) / 180,
                    cos = Math.cos(rad),
                    sin = Math.sin(rad),
                    s = p.s
                paths.push(
                    `M ${p.x - cos * s} ${p.y - sin * s} L ${p.x + cos * s} ${p.y + sin * s}`,
                    `M ${p.x + sin * s} ${p.y - cos * s} L ${p.x - sin * s} ${p.y + cos * s}`
                )
            }
            break
        case "Dot Cluster":
            for (let i = 0; i < count * 3; i++) {
                const p = place(base * 0.02),
                    r = p.s * 0.3 + 0.3
                paths.push(
                    `M ${p.x - r} ${p.y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`
                )
            }
            break
        case "Top Squiggle": {
            const y = vy + vh * 0.12,
                amp = base * 0.04,
                steps = Math.max(6, count)
            let d = `M ${vx + vw * 0.1} ${y}`
            for (let k = 1; k <= steps; k++)
                d += ` L ${vx + vw * (0.1 + 0.8 * (k / steps))} ${y + (k % 2 === 0 ? 1 : -1) * amp + (rand() - 0.5) * amp * 0.6}`
            paths.push(d)
            break
        }
        case "Bottom Dash": {
            const y = vy + vh * 0.88,
                dashes = Math.max(4, count),
                segW = (vw * 0.8) / (dashes * 2)
            for (let i = 0; i < dashes; i++)
                paths.push(
                    `M ${vx + vw * 0.1 + i * segW * 2} ${y} L ${vx + vw * 0.1 + i * segW * 2 + segW} ${y}`
                )
            break
        }
        case "Scatter Dust":
            for (let i = 0; i < count * 2; i++) {
                const p = place(base * 0.01),
                    l = p.s * 0.5 + 0.4,
                    rad = (p.a * Math.PI) / 180
                paths.push(
                    `M ${p.x - Math.cos(rad) * l} ${p.y - Math.sin(rad) * l} L ${p.x + Math.cos(rad) * l} ${p.y + Math.sin(rad) * l}`
                )
            }
            break
    }
    return paths.length > MAX_FX_PATHS ? paths.slice(0, MAX_FX_PATHS) : paths
}

const toNum = (value: string | null, fallback = 0): number => {
    const parsed = parseFloat(value ?? "")
    return Number.isFinite(parsed) ? parsed : fallback
}

function shapeToPath(el: Element): string | null {
    const attr = (name: string) => el.getAttribute(name)
    switch (el.tagName.toLowerCase()) {
        case "path":
            return attr("d")
        case "line":
            return `M ${toNum(attr("x1"))} ${toNum(attr("y1"))} L ${toNum(attr("x2"))} ${toNum(attr("y2"))}`
        case "polyline":
        case "polygon": {
            const points = (attr("points") || "")
                .trim()
                .split(/[\s,]+/)
                .map(Number)
                .filter(Number.isFinite)
            if (points.length < 4) return null
            let d = `M ${points[0]} ${points[1]}`
            for (let i = 2; i < points.length - 1; i += 2)
                d += ` L ${points[i]} ${points[i + 1]}`
            return el.tagName.toLowerCase() === "polygon" ? `${d} Z` : d
        }
        case "circle": {
            const cx = toNum(attr("cx")),
                cy = toNum(attr("cy")),
                r = toNum(attr("r"))
            return r > 0
                ? `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`
                : null
        }
        case "ellipse": {
            const cx = toNum(attr("cx")),
                cy = toNum(attr("cy")),
                rx = toNum(attr("rx")),
                ry = toNum(attr("ry"))
            return rx > 0 && ry > 0
                ? `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`
                : null
        }
        case "rect": {
            const x = toNum(attr("x")),
                y = toNum(attr("y")),
                w = toNum(attr("width")),
                h = toNum(attr("height"))
            if (w <= 0 || h <= 0) return null
            const rx = Math.min(toNum(attr("rx")), w / 2),
                ry = Math.min(toNum(attr("ry"), rx), h / 2)
            if (rx <= 0) return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`
            return `M ${x + rx} ${y} h ${w - 2 * rx} a ${rx} ${ry} 0 0 1 ${rx} ${ry} v ${h - 2 * ry} a ${rx} ${ry} 0 0 1 ${-rx} ${ry} h ${-(w - 2 * rx)} a ${rx} ${ry} 0 0 1 ${-rx} ${-ry} v ${-(h - 2 * ry)} a ${rx} ${ry} 0 0 1 ${rx} ${-ry} Z`
        }
        default:
            return null
    }
}

function getInheritedAttr(el: Element, name: string): string | null {
    let current: Node | null = el
    while (current) {
        if (current.nodeType === 1) {
            const val = (current as Element).getAttribute(name)
            if (val) return val
        }
        current = current.parentNode
    }
    return null
}

function shapeStyle(el: Element): OriginalStyle {
    const style: OriginalStyle = {}
    const strokeAttr =
        el.getAttribute("stroke") || getInheritedAttr(el, "stroke")
    if (strokeAttr) style.stroke = strokeAttr
    const fillAttr = el.getAttribute("fill") || getInheritedAttr(el, "fill")
    if (fillAttr) style.fill = fillAttr
    const fillRule =
        el.getAttribute("fill-rule") || getInheritedAttr(el, "fill-rule")
    if (fillRule) style.fillRule = fillRule
    return style
}

function parseCustomSvg(code: string): DoodleDef {
    const empty: DoodleDef = { paths: [], viewBox: [0, 0, 100, 100] }
    if (!code.trim() || typeof DOMParser === "undefined") return empty
    try {
        const doc = new DOMParser().parseFromString(code, "image/svg+xml")
        if (doc.querySelector("parsererror")) return empty
        const svg = doc.querySelector("svg")
        if (!svg) return empty
        let viewBox: [number, number, number, number] = [0, 0, 100, 100]
        const rawBox = svg.getAttribute("viewBox")
        if (rawBox) {
            const parts = rawBox.split(/[\s,]+/).map(Number)
            if (parts.length === 4 && parts.every(Number.isFinite))
                viewBox = parts as DoodleDef["viewBox"]
        } else {
            const w = toNum(svg.getAttribute("width")),
                h = toNum(svg.getAttribute("height"))
            if (w > 0 && h > 0) viewBox = [0, 0, w, h]
        }
        const paths: string[] = []
        const styles: OriginalStyle[] = []
        doc.querySelectorAll(
            "path, line, polyline, polygon, circle, ellipse, rect"
        ).forEach((el) => {
            const d = shapeToPath(el)
            if (!d) return
            paths.push(d)
            styles.push(shapeStyle(el))
        })
        return { paths, viewBox, styles }
    } catch {
        return empty
    }
}

const FILTER_REGION = { x: "-25%", y: "-25%", width: "150%", height: "150%" }

function TextureFilter({ texture, id }: { texture: string; id: string }) {
    switch (texture) {
        case "Bold Marker":
            return (
                <filter id={id} {...FILTER_REGION}>
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.014 0.02"
                        numOctaves={3}
                        seed={7}
                        result="wob"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="wob"
                        scale={2.4}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="disp"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.006 0.11"
                        numOctaves={2}
                        seed={12}
                        result="streak"
                    />
                    <feColorMatrix
                        in="streak"
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 0.42"
                        result="streakA"
                    />
                    <feComposite
                        in="disp"
                        in2="streakA"
                        operator="in"
                        result="channeled"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.11 0.11"
                        numOctaves={2}
                        seed={5}
                        result="nib"
                    />
                    <feDisplacementMap
                        in="channeled"
                        in2="nib"
                        scale={1.1}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="rough"
                    />
                    <feGaussianBlur
                        in="rough"
                        stdDeviation={0.22}
                        result="soft"
                    />
                    <feComponentTransfer in="soft">
                        <feFuncA type="linear" slope={1.3} intercept={-0.03} />
                    </feComponentTransfer>
                </filter>
            )
        case "Hi-Liter":
            return (
                <filter id={id} {...FILTER_REGION}>
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.012 0.02"
                        numOctaves={3}
                        seed={9}
                        result="wob"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="wob"
                        scale={3.1}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="disp"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.004 0.085"
                        numOctaves={2}
                        seed={21}
                        result="streak"
                    />
                    <feColorMatrix
                        in="streak"
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.15 0 0 0 0.16"
                        result="streakA"
                    />
                    <feComposite
                        in="disp"
                        in2="streakA"
                        operator="in"
                        result="channeled"
                    />
                    <feComponentTransfer in="channeled" result="skippy">
                        <feFuncA
                            type="table"
                            tableValues="0 0.34 0.62 0.5 0.7 0.58 0.66"
                        />
                    </feComponentTransfer>
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.08 0.08"
                        numOctaves={2}
                        seed={4}
                        result="nib"
                    />
                    <feDisplacementMap
                        in="skippy"
                        in2="nib"
                        scale={1.7}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="rough"
                    />
                    <feGaussianBlur in="rough" stdDeviation={0.34} />
                </filter>
            )
        case "Crayon Art":
            return (
                <filter id={id} {...FILTER_REGION}>
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.02 0.03"
                        numOctaves={4}
                        seed={11}
                        result="wob"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="wob"
                        scale={3.4}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="disp"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.5 0.5"
                        numOctaves={2}
                        seed={31}
                        result="tooth"
                    />
                    <feDisplacementMap
                        in="disp"
                        in2="tooth"
                        scale={0.9}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="toothy"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.01 0.16"
                        numOctaves={2}
                        seed={17}
                        result="streak"
                    />
                    <feColorMatrix
                        in="streak"
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.55 0 0 0 0.55"
                        result="streakA"
                    />
                    <feComposite
                        in="toothy"
                        in2="streakA"
                        operator="in"
                        result="channeled"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.55 0.55"
                        numOctaves={3}
                        seed={4}
                        result="grain"
                    />
                    <feColorMatrix
                        in="grain"
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.85 0.3"
                        result="grainA"
                    />
                    <feComposite in="channeled" in2="grainA" operator="in" />
                </filter>
            )
        case "Chalk Dust":
            return (
                <filter id={id} {...FILTER_REGION}>
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.016 0.024"
                        numOctaves={3}
                        seed={21}
                        result="wob"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="wob"
                        scale={2}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="disp"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.008 0.14"
                        numOctaves={2}
                        seed={16}
                        result="striation"
                    />
                    <feColorMatrix
                        in="striation"
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.35 0 0 0 0.72"
                        result="striationA"
                    />
                    <feComposite
                        in="disp"
                        in2="striationA"
                        operator="in"
                        result="streaked"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.18 0.18"
                        numOctaves={2}
                        seed={8}
                        result="edge"
                    />
                    <feDisplacementMap
                        in="streaked"
                        in2="edge"
                        scale={1.6}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="rough"
                    />
                    <feGaussianBlur
                        in="rough"
                        stdDeviation={0.25}
                        result="soft"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.5 0.5"
                        numOctaves={2}
                        seed={9}
                        result="grain"
                    />
                    <feColorMatrix
                        in="grain"
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 0.25"
                        result="grainA"
                    />
                    <feComposite
                        in="soft"
                        in2="grainA"
                        operator="in"
                        result="grained"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.03 0.045"
                        numOctaves={2}
                        seed={14}
                        result="press"
                    />
                    <feColorMatrix
                        in="press"
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.5 0 0 0 0.6"
                        result="pressA"
                    />
                    <feComposite
                        in="grained"
                        in2="pressA"
                        operator="in"
                        result="pressed"
                    />
                    <feComponentTransfer in="pressed">
                        <feFuncA type="linear" slope={1.15} intercept={0.02} />
                    </feComponentTransfer>
                </filter>
            )
        case "Soft Pencil":
            return (
                <filter id={id} {...FILTER_REGION}>
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.03 0.04"
                        numOctaves={3}
                        seed={5}
                        result="wob"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="wob"
                        scale={1.5}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="disp"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.6 0.6"
                        numOctaves={2}
                        seed={14}
                        result="tooth"
                    />
                    <feDisplacementMap
                        in="disp"
                        in2="tooth"
                        scale={0.6}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="toothy"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.02 0.2"
                        numOctaves={2}
                        seed={23}
                        result="streak"
                    />
                    <feColorMatrix
                        in="streak"
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.4 0 0 0 0.68"
                        result="streakA"
                    />
                    <feComposite
                        in="toothy"
                        in2="streakA"
                        operator="in"
                        result="channeled"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.45 0.45"
                        numOctaves={2}
                        seed={13}
                        result="grain"
                    />
                    <feColorMatrix
                        in="grain"
                        type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0.55"
                        result="grainA"
                    />
                    <feComposite
                        in="channeled"
                        in2="grainA"
                        operator="in"
                        result="grained"
                    />
                    <feComponentTransfer in="grained">
                        <feFuncA type="linear" slope={0.95} intercept={0} />
                    </feComponentTransfer>
                </filter>
            )
        default:
            return (
                <filter id={id} {...FILTER_REGION}>
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.012 0.02"
                        numOctaves={2}
                        seed={3}
                        result="wob"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="wob"
                        scale={1.4}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="disp"
                    />
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.14 0.14"
                        numOctaves={2}
                        seed={6}
                        result="nib"
                    />
                    <feDisplacementMap
                        in="disp"
                        in2="nib"
                        scale={0.5}
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            )
    }
}

const DEFAULTS: Props = {
    doodle: { pick: "Star Burst", custom: false, svgCode: "" },
    look: {
        mode: "Solid",
        ink: "#4F46E5",
        gradA: "#FF5E7E",
        gradB: "#7C5CFF",
        angle: 90,
        texture: "Clean Ink",
        weight: 4,
    },
    move: {
        trigger: "Enter View",
        once: false,
        play: "Draw Lines",
        time: 1.5,
        sequence: "Stroke by Stroke",
        rhythm: "Chain Flow",
        stagger: 0.18,
        ease: "Silky Smooth",
        pause: 1.2,
    },
    fx: {
        style: FX_NONE,
        count: 12,
        color: "#1F2937",
        tint: "Match Doodle",
        opacity: 0.7,
        spread: 40,
        weight: 2,
        seed: 1337,
    },
    frame: {
        size: 130,
        padding: 0,
        backdrop: false,
        tint: "#FFF6E5",
        radius: 24,
    },
}

export function Doodlemania(props: Props) {
    const doodle = { ...DEFAULTS.doodle, ...props.doodle }
    const look = { ...DEFAULTS.look, ...props.look }
    const move = { ...DEFAULTS.move, ...props.move }
    const fx = { ...DEFAULTS.fx, ...props.fx }
    const frame = { ...DEFAULTS.frame, ...props.frame }

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const reduceMotion = useReducedMotion()
    const inert = isStatic || reduceMotion

    const custom = useMemo(
        () => parseCustomSvg(doodle.svgCode),
        [doodle.svgCode]
    )
    const source = doodle.custom
        ? custom
        : (DOODLES[doodle.pick] ?? DOODLES["Star Burst"])
    const paths = source.paths
    const [vx, vy, vw, vh] = source.viewBox

    const isOrigin = look.mode === "Origin"

    // FIX 1: Use React 18 useId() for stable, unique IDs per instance.
    // Survives re-renders without change; guaranteed unique across all
    // Doodlemania instances on the same page.
    const uid = useId()
    const gradientId = `dg${uid}`
    const textureId = `dt${uid}`

    const paint = look.mode === "Gradient" ? `url(#${gradientId})` : look.ink
    const strokeW = look.weight * (Math.max(vw, vh) / 100)
    const textureUrl =
        look.texture === "Clean Ink" ? undefined : `url(#${textureId})`
    const width = frame.size
    const height = frame.size * (vh / vw)

    const useDir =
        STREAK_TEXTURES.includes(look.texture) &&
        STREAK_SAFE_PLAYS.includes(move.play)
    const rcx = vx + vw / 2
    const rcy = vy + vh / 2
    const bucketOf = (a: number) => {
        const b = Math.round(a / 15) * 15
        return ((b % 180) + 180) % 180
    }

    const getPathProps = (pathIndex: number) => {
        if (!isOrigin) {
            return {
                fill: "none",
                stroke: paint,
                strokeWidth: strokeW,
                strokeLinecap: "round" as const,
                strokeLinejoin: "round" as const,
            }
        }
        const style = source.styles?.[pathIndex] || {}
        let resolvedFill = style.fill
        if (resolvedFill === "currentColor") resolvedFill = paint
        let resolvedStroke = style.stroke
        if (resolvedStroke === "currentColor") resolvedStroke = paint
        const hasFillAttr = style.fill !== undefined
        const hasStrokeAttr = style.stroke !== undefined
        if (!hasFillAttr && !hasStrokeAttr) resolvedFill = "#000000"
        const useFill = resolvedFill && resolvedFill !== "none"
        const useStroke = resolvedStroke && resolvedStroke !== "none"
        return {
            fill: useFill ? resolvedFill : "none",
            stroke: useStroke ? resolvedStroke : useFill ? "none" : paint,
            strokeWidth: useFill && !useStroke ? 0 : strokeW,
            strokeLinecap: "round" as const,
            strokeLinejoin: "round" as const,
            fillRule: style.fillRule ? style.fillRule : undefined,
        }
    }

    const fxPaint = fx.tint === "Match Doodle" ? paint : fx.color
    const fxStrokeW = fx.weight * (Math.max(vw, vh) / 100)
    const fxPaths = useMemo(
        () =>
            generateEffects(
                fx.style,
                fx.count,
                fx.spread,
                fx.seed,
                source.viewBox
            ),
        [fx.style, fx.count, fx.spread, fx.seed, source.viewBox]
    )

    const segments = useMemo(
        () => buildSegments(paths, move.sequence),
        [paths, move.sequence]
    )
    const schedule = useMemo(
        () =>
            move.sequence === "All Together"
                ? segments.map(() => ({ delay: 0, duration: move.time }))
                : buildSchedule(segments, move.rhythm, move.stagger, move.time),
        [segments, move.sequence, move.rhythm, move.stagger, move.time]
    )
    const scheduleEnd =
        schedule.reduce((m, s) => Math.max(m, s.delay + s.duration), 0) ||
        move.time

    const buckets = useMemo(() => {
        const m = new Map<number, number[]>()
        segments.forEach((s, i) => {
            const k = useDir ? bucketOf(s.angle) : 0
            const arr = m.get(k)
            if (arr) arr.push(i)
            else m.set(k, [i])
        })
        return Array.from(m.entries())
    }, [segments, useDir])

    const hostRef = useRef<HTMLDivElement>(null)
    const needsObserver =
        !inert &&
        (move.trigger === "Enter View" ||
            move.trigger === "Loop Replay" ||
            move.trigger === "Always Drawn")
    const [visible, setVisible] = useState(
        () => typeof IntersectionObserver === "undefined"
    )

    useEffect(() => {
        if (!needsObserver) {
            setVisible(true)
            return
        }
        if (typeof IntersectionObserver === "undefined") {
            setVisible(true)
            return
        }
        const node = hostRef.current
        if (!node) return
        const io = new IntersectionObserver(
            (entries) => setVisible(entries[entries.length - 1].isIntersecting),
            { threshold: [0, 0.1, 0.25, 0.5, 1.0], rootMargin: "50px" }
        )
        io.observe(node)
        return () => io.disconnect()
    }, [needsObserver])

    const [active, setActive] = useState(false)
    const [runId, setRunId] = useState(1)
    const hasPlayed = useRef(false)

    const start = useCallback(() => {
        setActive(true)
        setRunId((n) => n + 1)
    }, [])
    const stop = useCallback(() => setActive(false), [])

    const launch = useCallback(() => {
        if (move.once && hasPlayed.current) return
        hasPlayed.current = true
        start()
    }, [move.once, start])

    const previousTrigger = useRef(move.trigger)
    useEffect(() => {
        if (previousTrigger.current !== move.trigger) {
            previousTrigger.current = move.trigger
            hasPlayed.current = false
            setActive(false)
        }
    }, [move.trigger])

    useEffect(() => {
        hasPlayed.current = false
    }, [move.once])

    useEffect(() => {
        if (inert || move.trigger !== "Enter View") return
        if (visible) launch()
        else if (!move.once) stop()
    }, [visible, move.trigger, move.once, inert, launch, stop])

    useEffect(() => {
        if (inert || move.trigger !== "Always Drawn") return
        if (visible && !hasPlayed.current) launch()
    }, [visible, move.trigger, inert, launch])

    useEffect(() => {
        if (inert || move.trigger !== "Loop Replay" || !visible) return
        if (isCanvas) {
            start()
            return
        }
        let alive = true
        let timerId: ReturnType<typeof setTimeout> | null = null
        const cycle = () => {
            if (!alive) return
            start()
            timerId = setTimeout(cycle, (scheduleEnd + move.pause) * 1000)
        }
        cycle()
        return () => {
            alive = false
            if (timerId !== null) clearTimeout(timerId)
        }
    }, [move.trigger, visible, isCanvas, inert, scheduleEnd, move.pause, start])

    useEffect(() => {
        if (inert) return
        hasPlayed.current = false
        setRunId((n) => n + 1)
    }, [
        doodle.custom,
        doodle.svgCode,
        doodle.pick,
        isOrigin,
        look.texture,
        inert,
    ])

    const interactive = !inert
    const hoverHandlers =
        interactive && move.trigger === "Hover Over"
            ? {
                  onMouseEnter: launch,
                  onMouseLeave: () => {
                      if (!move.once) stop()
                  },
              }
            : {}
    const tapHandlers =
        interactive && move.trigger === "Tap to Play" ? { onClick: launch } : {}

    const animationFor = (index: number): any => {
        const slot = schedule[index] ?? { delay: 0, duration: move.time }
        const transition = {
            duration: slot.duration,
            ease: EASES[move.ease] ?? EASES["Silky Smooth"],
            delay: slot.delay,
        }
        switch (move.play) {
            case "Soft Fade In":
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    transition,
                }
            case "Pop & Scale":
                return {
                    initial: { opacity: 0, scale: 0.4 },
                    animate: { opacity: 1, scale: 1 },
                    transition,
                    style: {
                        transformBox: "fill-box",
                        transformOrigin: "50% 50%",
                    },
                }
            case "Blur Reveal":
                return {
                    initial: { opacity: 0, filter: "blur(12px)" },
                    animate: { opacity: 1, filter: "blur(0px)" },
                    transition,
                }
            case "Slide In Up":
                return {
                    initial: { opacity: 0, y: Math.max(vh * 0.2, 12) },
                    animate: { opacity: 1, y: 0 },
                    transition,
                }
            default:
                return {
                    initial: { pathLength: 0 },
                    animate: { pathLength: 1 },
                    transition,
                }
        }
    }

    const fxAnimation = {
        initial: { opacity: 0 },
        animate: { opacity: fx.opacity },
        transition: {
            duration: move.time * 0.6,
            ease: "easeOut" as const,
            delay: scheduleEnd * 0.75,
        },
    }

    const waiting = !inert && !active
    const showGhost =
        waiting &&
        move.trigger !== "Always Drawn" &&
        move.trigger !== "Loop Replay"
    const showFinal = inert || (waiting && !showGhost)
    const showFx = inert || active

    const strokeLayer = (kind: "ghost" | "final" | "anim") =>
        buckets.map(([b, idxs]) => (
            <g
                key={`bk-${kind}-${b}`}
                filter={textureUrl}
                transform={
                    useDir && b !== 0 ? `rotate(${b} ${rcx} ${rcy})` : undefined
                }
            >
                {idxs.map((i) => {
                    const seg = segments[i]
                    const inner =
                        useDir && b !== 0
                            ? `rotate(${-b} ${rcx} ${rcy})`
                            : undefined
                    const pprops = getPathProps(seg.pathIndex)
                    if (kind === "anim") {
                        const isFilled =
                            pprops.fill !== "none" && pprops.stroke === "none"
                        let anim = animationFor(i)
                        if (isFilled)
                            anim = {
                                initial: { opacity: 0 },
                                animate: { opacity: 1 },
                                transition: anim.transition,
                            }
                        return (
                            <motion.path
                                key={`${runId}-${i}`}
                                d={seg.d}
                                transform={inner}
                                {...pprops}
                                {...anim}
                            />
                        )
                    }
                    return (
                        <path
                            key={`${kind}-${i}`}
                            d={seg.d}
                            transform={inner}
                            {...pprops}
                            opacity={kind === "ghost" ? 0.18 : undefined}
                        />
                    )
                })}
            </g>
        ))

    return (
        <div
            ref={hostRef}
            {...hoverHandlers}
            {...tapHandlers}
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: frame.padding,
                overflow: "hidden",
                background: frame.backdrop ? frame.tint : "transparent",
                borderRadius: frame.backdrop ? frame.radius : 0,
                cursor:
                    interactive && move.trigger === "Tap to Play"
                        ? "pointer"
                        : "default",
            }}
        >
            {paths.length > 0 && (
                <svg
                    width={width}
                    height={height}
                    viewBox={`${vx} ${vy} ${vw} ${vh}`}
                    style={{ display: "block", overflow: "visible" }}
                >
                    <defs>
                        {/* FIX 2: key the gradient by mode so switching Solid <-> Gradient
                            does a clean remount instead of an attribute update that can
                            leave the url(#...) reference stale in the browser cache. */}
                        {look.mode === "Gradient" && (
                            <linearGradient
                                key={`grad-${look.mode}-${look.angle}`}
                                id={gradientId}
                                gradientUnits="userSpaceOnUse"
                                x1={vx}
                                y1={vy}
                                x2={vx + vw}
                                y2={vy + vh}
                                gradientTransform={`rotate(${look.angle} ${vx + vw / 2} ${vy + vh / 2})`}
                            >
                                <stop offset="0%" stopColor={look.gradA} />
                                <stop offset="100%" stopColor={look.gradB} />
                            </linearGradient>
                        )}
                        {/* FIX 3: key the filter by texture so switching Clean Ink <-> Chalk
                            does a clean mount/dismount of the <filter> element. Without this,
                            React reconciles the filter in-place while the url(#dt...) reference
                            is still active, and the browser caches the failed reference until
                            a full page reload. */}
                        <TextureFilter
                            key={look.texture}
                            texture={look.texture}
                            id={textureId}
                        />
                    </defs>

                    {showFx && fxPaths.length > 0 && (
                        <g filter={textureUrl}>
                            {inert ? (
                                <g opacity={fx.opacity}>
                                    {fxPaths.map((d, i) => (
                                        <path
                                            key={`fxs-${i}`}
                                            d={d}
                                            stroke={fxPaint}
                                            strokeWidth={fxStrokeW}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    ))}
                                </g>
                            ) : (
                                <motion.g {...fxAnimation}>
                                    {fxPaths.map((d, i) => (
                                        <path
                                            key={`fx-${i}-${runId}`}
                                            d={d}
                                            stroke={fxPaint}
                                            strokeWidth={fxStrokeW}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    ))}
                                </motion.g>
                            )}
                        </g>
                    )}

                    {showGhost && strokeLayer("ghost")}
                    {showFinal && strokeLayer("final")}
                    {!inert && active && strokeLayer("anim")}
                </svg>
            )}
        </div>
    )
}

Doodlemania.defaultProps = DEFAULTS

addPropertyControls(Doodlemania, {
    doodle: {
        type: ControlType.Object,
        title: "Doodle Choice",
        controls: {
            pick: {
                type: ControlType.Enum,
                title: "Pick a Doodle",
                options: DOODLE_KEYS,
                defaultValue: "Star Burst",
                hidden: (props) => props.custom === true,
            },
            custom: {
                type: ControlType.Boolean,
                title: "Custom Doodle",
                defaultValue: false,
            },
            svgCode: {
                type: ControlType.String,
                title: "Paste SVG Code",
                displayTextArea: true,
                defaultValue: "",
                hidden: (props) => !props.custom,
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style & Color",
        controls: {
            mode: {
                type: ControlType.SegmentedEnum,
                title: "Color Mode",
                options: COLOR_MODES,
                defaultValue: "Solid",
            },
            ink: {
                type: ControlType.Color,
                title: "Ink Color",
                defaultValue: "#4F46E5",
                hidden: (props) =>
                    props.mode !== "Solid" && props.mode !== "Origin",
            },
            gradA: {
                type: ControlType.Color,
                title: "Blend Start",
                defaultValue: "#FF5E7E",
                hidden: (props) => props.mode !== "Gradient",
            },
            gradB: {
                type: ControlType.Color,
                title: "Blend Finish",
                defaultValue: "#7C5CFF",
                hidden: (props) => props.mode !== "Gradient",
            },
            angle: {
                type: ControlType.Number,
                title: "Blend Angle",
                min: 0,
                max: 360,
                step: 5,
                defaultValue: 90,
                hidden: (props) => props.mode !== "Gradient",
            },
            texture: {
                type: ControlType.Enum,
                title: "Texture Feel",
                options: TEXTURES,
                defaultValue: "Clean Ink",
            },
            weight: {
                type: ControlType.Number,
                title: "Line Weight",
                min: 1,
                max: 12,
                step: 0.5,
                defaultValue: 4,
            },
        },
    },
    fx: {
        type: ControlType.Object,
        title: "Doodle FX",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Effect Style",
                options: FX_STYLES,
                defaultValue: FX_NONE,
            },
            count: {
                type: ControlType.Number,
                title: "Mark Count",
                min: 1,
                max: 50,
                step: 1,
                defaultValue: 12,
                hidden: (props) => props.style === FX_NONE,
            },
            tint: {
                type: ControlType.Enum,
                title: "Mark Tint",
                options: ["Match Doodle", "Custom Ink"],
                defaultValue: "Match Doodle",
                hidden: (props) => props.style === FX_NONE,
            },
            color: {
                type: ControlType.Color,
                title: "FX Color",
                defaultValue: "#1F2937",
                hidden: (props) =>
                    props.style === FX_NONE || props.tint === "Match Doodle",
            },
            opacity: {
                type: ControlType.Number,
                title: "FX Opacity",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.7,
                hidden: (props) => props.style === FX_NONE,
            },
            spread: {
                type: ControlType.Number,
                title: "FX Spread",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 40,
                hidden: (props) => props.style === FX_NONE,
            },
            weight: {
                type: ControlType.Number,
                title: "FX Weight",
                min: 0.5,
                max: 8,
                step: 0.25,
                defaultValue: 2,
                hidden: (props) => props.style === FX_NONE,
            },
            seed: {
                type: ControlType.Number,
                title: "FX Seed",
                min: 1,
                max: 9999,
                step: 1,
                defaultValue: 1337,
                hidden: (props) => props.style === FX_NONE,
            },
        },
    },
    move: {
        type: ControlType.Object,
        title: "Motion & Play",
        controls: {
            trigger: {
                type: ControlType.Enum,
                title: "Play Trigger",
                options: TRIGGERS,
                defaultValue: "Enter View",
            },
            once: {
                type: ControlType.Boolean,
                title: "Play Once",
                defaultValue: false,
                hidden: (props) =>
                    props.trigger === "Loop Replay" ||
                    props.trigger === "Always Drawn",
            },
            play: {
                type: ControlType.Enum,
                title: "Play Style",
                options: PLAY_STYLES,
                defaultValue: "Draw Lines",
            },
            sequence: {
                type: ControlType.Enum,
                title: "Draw Sequence",
                options: SEQUENCES,
                defaultValue: "Stroke by Stroke",
            },
            rhythm: {
                type: ControlType.Enum,
                title: "Stagger Rhythm",
                options: RHYTHMS,
                defaultValue: "Chain Flow",
                hidden: (props) => props.sequence === "All Together",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger Gap",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 0.18,
                hidden: (props) =>
                    props.sequence === "All Together" ||
                    props.rhythm !== "Fixed Gap",
            },
            time: {
                type: ControlType.Number,
                title: "Draw Time",
                min: 0.2,
                max: 8,
                step: 0.1,
                defaultValue: 1.5,
            },
            ease: {
                type: ControlType.Enum,
                title: "Ease Feel",
                options: EASE_NAMES,
                defaultValue: "Silky Smooth",
            },
            pause: {
                type: ControlType.Number,
                title: "Loop Pause",
                min: 0,
                max: 10,
                step: 0.1,
                defaultValue: 1.2,
                hidden: (props) => props.trigger !== "Loop Replay",
            },
        },
    },
    frame: {
        type: ControlType.Object,
        title: "Size & Space",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Doodle Size",
                min: 40,
                max: 800,
                step: 4,
                defaultValue: 130,
            },
            padding: {
                type: ControlType.Number,
                title: "Inner Space",
                min: 0,
                max: 100,
                step: 2,
                defaultValue: 0,
            },
            backdrop: {
                type: ControlType.Boolean,
                title: "Show Backdrop",
                defaultValue: false,
            },
            tint: {
                type: ControlType.Color,
                title: "Backdrop Tint",
                defaultValue: "#FFF6E5",
                hidden: (props) => !props.backdrop,
            },
            radius: {
                type: ControlType.Number,
                title: "Corner Round",
                min: 0,
                max: 120,
                step: 2,
                defaultValue: 24,
                hidden: (props) => !props.backdrop,
            },
        },
    },
})

export default Doodlemania
