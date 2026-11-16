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


type Paint =
    | string
    | null
    | ((x: number, y: number, z: number) => string | null)
const SPAN = 40

function hash(x: number, y: number, z: number) {
    return ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0
}

class Block {
    m = new Map<number, string>()
    key(x: number, y: number, z: number) {
        return (z * SPAN + y) * SPAN + x
    }
    inside(x: number, y: number, z: number) {
        return x >= 0 && y >= 0 && z >= 0 && x < SPAN && y < SPAN && z < SPAN
    }
    put(x: number, y: number, z: number, c: Paint) {
        if (!this.inside(x, y, z)) return
        const v = typeof c === "function" ? c(x, y, z) : c
        const k = this.key(x, y, z)
        if (v == null) this.m.delete(k)
        else this.m.set(k, v)
    }
    has(x: number, y: number, z: number) {
        return this.inside(x, y, z) && this.m.has(this.key(x, y, z))
    }
    box(
        x0: number,
        y0: number,
        z0: number,
        x1: number,
        y1: number,
        z1: number,
        c: Paint
    ) {
        for (let z = z0; z < z1; z++)
            for (let y = y0; y < y1; y++)
                for (let x = x0; x < x1; x++) this.put(x, y, z, c)
    }
    disc(cx: number, cy: number, z: number, r: number, c: Paint) {
        for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
            for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++)
                if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r)
                    this.put(x, y, z, c)
    }
    cyl(cx: number, cy: number, z0: number, z1: number, r: number, c: Paint) {
        for (let z = z0; z < z1; z++) this.disc(cx, cy, z, r, c)
    }
    cone(
        cx: number,
        cy: number,
        z0: number,
        z1: number,
        r0: number,
        r1: number,
        c: Paint
    ) {
        const n = z1 - z0
        for (let z = z0; z < z1; z++) {
            const t = n <= 1 ? 0 : (z - z0) / (n - 1)
            this.disc(cx, cy, z, r0 + (r1 - r0) * t, c)
        }
    }
    ball(
        cx: number,
        cy: number,
        cz: number,
        r: number,
        c: Paint,
        sz = 1,
        zmin = 0
    ) {
        const rz = r * sz
        for (
            let z = Math.max(zmin, Math.floor(cz - rz - 1));
            z <= cz + rz + 1;
            z++
        )
            for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
                for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
                    const d =
                        (x + 0.5 - cx) ** 2 +
                        (y + 0.5 - cy) ** 2 +
                        ((z + 0.5 - cz) / sz) ** 2
                    if (d <= r * r) this.put(x, y, z, c)
                }
    }
    tubeY(cx: number, cz: number, y0: number, y1: number, r: number, c: Paint) {
        for (let y = y0; y < y1; y++)
            for (let z = Math.floor(cz - r - 1); z <= cz + r + 1; z++)
                for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++)
                    if ((x + 0.5 - cx) ** 2 + (z + 0.5 - cz) ** 2 <= r * r)
                        this.put(x, y, z, c)
    }
    recolor(
        fn: (
            x: number,
            y: number,
            z: number,
            c: string
        ) => string | null | undefined
    ) {
        const list = Array.from(this.m.entries())
        for (const [k, c] of list) {
            const x = k % SPAN
            const y = Math.floor(k / SPAN) % SPAN
            const z = Math.floor(k / (SPAN * SPAN))
            const v = fn(x, y, z, c)
            if (v === null) this.m.delete(k)
            else if (v !== undefined) this.m.set(k, v)
        }
    }
}

const MODELS: ((b: Block) => void)[] = [
    // mug
    (b) => {
        const c = "#3B4BD8"
        b.cyl(4, 4, 0, 7, 3.6, c)
        b.cyl(4, 4, 2, 7, 2.6, null)
        b.cyl(4, 4, 5, 6, 2.6, "#4A2C1E")
        b.box(8, 3, 2, 9, 5, 3, c)
        b.box(9, 3, 2, 10, 5, 6, c)
        b.box(8, 3, 5, 9, 5, 6, c)
    },
    // table lamp
    (b) => {
        b.cyl(4.5, 4.5, 0, 1, 2.6, "#2B2B33")
        b.cyl(4.5, 4.5, 1, 2, 1.6, "#3A3A44")
        b.cyl(4.5, 4.5, 2, 6, 0.8, "#C9A46A")
        b.cone(4.5, 4.5, 6, 12, 4.2, 2.3, (x, y, z) =>
            z === 6 ? "#E09A12" : "#F2B21B"
        )
    },
    // cactus
    (b) => {
        const g = "#6FA86A"
        b.cone(4.5, 4.5, 0, 4, 2.6, 3.4, "#D2693F")
        b.cyl(4.5, 4.5, 4, 5, 3.6, "#E07B50")
        b.cyl(4.5, 4.5, 4, 5, 2.6, "#5B3A29")
        b.cyl(4.5, 4.5, 5, 13, 1.6, g)
        b.box(6, 4, 7, 8, 5, 8, g)
        b.box(7, 4, 8, 8, 5, 11, g)
        b.box(4, 6, 9, 5, 8, 10, g)
        b.box(4, 7, 10, 5, 8, 12, g)
        b.recolor((x, y, z, c) =>
            c === g && (x + y + z) % 4 === 0 ? "#5E9659" : undefined
        )
        b.box(4, 4, 13, 6, 5, 14, "#F06A9B")
        b.put(4, 5, 13, "#FF9EC0")
    },
    // gift box
    (b) => {
        const r = "#E23B4E"
        const w = "#F6E7C8"
        b.box(0, 0, 0, 8, 8, 6, r)
        b.box(3, 0, 0, 5, 8, 6, w)
        b.box(0, 3, 0, 8, 5, 6, w)
        b.box(0, 0, 6, 8, 8, 7, "#CF2F42")
        b.box(3, 0, 6, 5, 8, 7, w)
        b.box(0, 3, 6, 8, 5, 7, w)
        b.box(1, 3, 7, 3, 5, 9, w)
        b.box(5, 3, 7, 7, 5, 9, w)
        b.box(3, 3, 7, 5, 5, 8, "#E8D4AE")
    },
    // toadstool
    (b) => {
        b.cyl(4.5, 4.5, 0, 5, 1.8, "#F3EBDD")
        b.ball(
            4.5,
            4.5,
            4.5,
            4.6,
            (x, y, z) =>
                (hash(x, y, z) >>> 3) % 6 === 0 ? "#FFFFFF" : "#E5484D",
            0.8,
            5
        )
    },
    // ice cream
    (b) => {
        b.cone(4.5, 4.5, 0, 7, 0.7, 2.9, (x, y, z) =>
            (x + y + z) % 2 ? "#D9A35B" : "#C68C45"
        )
        b.ball(4.5, 4.5, 8.2, 3.2, "#F7B6C8", 1, 6)
        b.ball(4.5, 4.5, 11.6, 2.7, "#9BD38A", 1, 10)
        b.put(4, 4, 14, "#D7263D")
    },
    // duck
    (b) => {
        const y = "#F7D046"
        b.ball(4.5, 4.5, 2.8, 3.8, y, 0.72, 0)
        b.ball(4.5, 6.3, 6.2, 2.3, y)
        b.box(3, 8, 5, 6, 10, 6, "#F28C28")
        b.box(4, 0, 3, 5, 1, 5, y)
        b.put(3, 7, 7, "#222222")
        b.put(5, 7, 7, "#222222")
    },
    // radio
    (b) => {
        const m = "#7FD6B8"
        const d = "#2F3B3A"
        const c = "#F5F1E6"
        b.box(0, 0, 0, 10, 5, 7, m)
        for (let x = 0; x < 10; x++)
            for (let z = 0; z < 7; z++)
                if ((x + 0.5 - 3) ** 2 + (z + 0.5 - 3.5) ** 2 <= 5.2)
                    b.put(x, 4, z, (x + z) % 2 ? d : "#3E4C4B")
        b.box(6, 4, 4, 9, 5, 5, c)
        b.put(6, 4, 2, c)
        b.put(8, 4, 2, c)
        b.box(1, 2, 7, 2, 3, 9, d)
        b.box(8, 2, 7, 9, 3, 9, d)
        b.box(1, 2, 9, 9, 3, 10, d)
        b.box(9, 1, 7, 10, 2, 13, "#C9CED6")
    },
    // rocket
    (b) => {
        const o = "#FF7A2F"
        b.cyl(4.5, 4.5, 0, 2, 1.6, "#3A3A44")
        b.cyl(4.5, 4.5, 2, 10, 2.5, "#F4F2EE")
        b.cone(4.5, 4.5, 10, 14, 2.3, 0.6, o)
        b.box(7, 4, 1, 9, 5, 5, o)
        b.box(4, 7, 1, 5, 9, 5, o)
        b.box(0, 4, 1, 2, 5, 5, o)
        b.box(4, 0, 1, 5, 2, 5, o)
        b.box(3, 6, 6, 6, 7, 8, "#4DA3FF")
    },
    // pine
    (b) => {
        const g = "#2F7D4F"
        b.cyl(4.5, 4.5, 0, 2, 1, "#7A4B2A")
        b.cone(4.5, 4.5, 2, 6, 4.2, 2.4, g)
        b.cone(4.5, 4.5, 6, 10, 3.3, 1.6, g)
        b.cone(4.5, 4.5, 10, 13, 2.2, 0.6, g)
        b.recolor((x, y, z, c) =>
            c === g && !b.has(x, y, z + 1) && hash(x, y, z) % 3 !== 0
                ? "#EAF4F4"
                : undefined
        )
        b.put(4, 4, 13, "#FFD34D")
    },
    // stool
    (b) => {
        const d = "#8E5A2B"
        b.cyl(4, 4, 6, 7, 3.6, "#C98B4B")
        for (const [x, y] of [
            [1, 1],
            [6, 1],
            [1, 6],
            [6, 6],
        ])
            b.box(x, y, 0, x + 1, y + 1, 6, d)
        b.box(1, 6, 2, 7, 7, 3, d)
        b.box(6, 1, 2, 7, 7, 3, d)
    },
    // cake
    (b) => {
        const s = "#F3C77A"
        const cr = "#FFF4E6"
        b.cyl(4.5, 4.5, 0, 1, 4.5, "#E6E1D8")
        b.cyl(4.5, 4.5, 1, 3, 3.6, s)
        b.cyl(4.5, 4.5, 3, 4, 3.6, "#F48FA8")
        b.cyl(4.5, 4.5, 4, 6, 3.6, s)
        b.cyl(4.5, 4.5, 6, 7, 3.7, cr)
        b.recolor((x, y, z, c) =>
            z === 5 && c === s && hash(x, y, z) % 2 === 0 ? cr : undefined
        )
        b.ball(4.5, 4.5, 7.6, 1.1, "#D7263D")
        b.box(6, 4, 7, 7, 5, 10, "#8FD3FE")
        b.put(6, 4, 10, "#FFC93C")
    },
    // hourglass
    (b) => {
        const f = "#5A3E2B"
        const gl = "#CFE8F2"
        const s = "#F2C77E"
        b.box(0, 0, 0, 9, 9, 1, f)
        b.box(0, 0, 11, 9, 9, 12, f)
        for (const [x, y] of [
            [0, 0],
            [8, 0],
            [0, 8],
            [8, 8],
        ])
            b.box(x, y, 1, x + 1, y + 1, 11, f)
        b.cone(4.5, 4.5, 1, 6, 3.2, 0.8, (x, y, z) => (z < 3 ? s : gl))
        b.cone(4.5, 4.5, 6, 11, 0.8, 3.2, (x, y, z) => (z < 8 ? s : gl))
    },
    // watering can
    (b) => {
        const s = "#66C2B4"
        const d = "#4FA89B"
        b.cyl(4.5, 4.5, 0, 6, 3.2, s)
        b.cyl(4.5, 4.5, 6, 7, 3.2, d)
        b.cyl(4.5, 4.5, 6, 7, 2.2, "#2D5D57")
        b.box(1, 4, 7, 2, 5, 9, d)
        b.box(7, 4, 7, 8, 5, 9, d)
        b.box(1, 4, 9, 8, 5, 10, d)
        for (let k = 0; k < 4; k++) b.box(4, 7 + k, 1 + k, 5, 8 + k, 3 + k, s)
        b.box(3, 11, 4, 6, 12, 7, d)
    },
    // lantern
    (b) => {
        const f = "#2E2A27"
        b.box(1, 1, 0, 8, 8, 1, f)
        b.box(2, 2, 1, 7, 7, 8, (x, y) =>
            x === 2 || x === 6 || y === 2 || y === 6 ? "#FFD978" : "#F6B73C"
        )
        b.box(1, 1, 8, 8, 8, 9, f)
        for (const [x, y] of [
            [1, 1],
            [7, 1],
            [1, 7],
            [7, 7],
        ])
            b.box(x, y, 1, x + 1, y + 1, 8, f)
        b.box(4, 7, 1, 5, 8, 8, f)
        b.box(7, 4, 1, 8, 5, 8, f)
        b.cone(4.5, 4.5, 9, 11, 3, 1, f)
        b.box(4, 4, 11, 5, 5, 13, f)
    },
    // robot
    (b) => {
        const l = "#B9A7E8"
        const d = "#3A3550"
        b.box(2, 3, 0, 4, 6, 2, d)
        b.box(5, 3, 0, 7, 6, 2, d)
        b.box(1, 2, 2, 8, 7, 7, l)
        b.box(3, 6, 3, 6, 7, 6, "#8F7CCF")
        b.put(4, 6, 5, "#FF6B6B")
        b.put(3, 6, 3, "#7CF0E0")
        b.box(8, 4, 3, 9, 5, 6, d)
        b.box(0, 4, 3, 1, 5, 6, d)
        b.box(2, 3, 7, 7, 6, 11, l)
        b.put(3, 5, 9, "#7CF0E0")
        b.put(5, 5, 9, "#7CF0E0")
        b.box(3, 5, 8, 6, 6, 9, d)
        b.box(4, 4, 11, 5, 5, 13, d)
        b.put(4, 4, 13, "#FF6B6B")
    },
    // hot air balloon
    (b) => {
        const cols = ["#FF7B54", "#FFD56B", "#F25C8A"]
        const st = (x: number, y: number) =>
            cols[
                Math.floor(
                    ((Math.atan2(y + 0.5 - 4.5, x + 0.5 - 4.5) + Math.PI) /
                        (Math.PI * 2)) *
                        9
                ) % 3
            ]
        b.ball(4.5, 4.5, 9, 4.3, st, 1, 6)
        b.cone(4.5, 4.5, 4, 6, 1.4, 3.6, st)
        const rope = "#6B4E3D"
        for (const [x, y] of [
            [3, 3],
            [5, 5],
            [3, 5],
            [5, 3],
        ])
            b.box(x, y, 1, x + 1, y + 1, 4, rope)
        b.box(3, 3, 0, 6, 6, 2, "#A86B3C")
    },
    // ringed planet
    (b) => {
        b.ball(6.5, 6.5, 5.5, 4.2, (x, y, z) =>
            z % 3 === 0 ? "#E8956B" : z % 3 === 1 ? "#F6B28B" : "#FBCBA8"
        )
        for (let y = 0; y < 13; y++)
            for (let x = 0; x < 13; x++) {
                const r = Math.hypot(x + 0.5 - 6.5, y + 0.5 - 6.5)
                if (r >= 5.2 && r <= 6.6 && !b.has(x, y, 5))
                    b.put(x, y, 5, "#C9B6FF")
            }
    },
    // teapot
    (b) => {
        const c = "#9CC9B3"
        const d = "#7FB39B"
        b.ball(5, 5, 3.4, 3.9, c, 0.85, 0)
        b.cyl(5, 5, 6, 7, 2.1, d)
        b.box(4, 4, 7, 6, 6, 8, d)
        b.box(4, 8, 1, 6, 9, 3, c)
        b.box(4, 9, 2, 6, 10, 4, c)
        b.box(4, 10, 3, 6, 11, 5, c)
        b.box(4, 11, 4, 6, 12, 6, c)
        b.box(9, 4, 1, 10, 6, 2, d)
        b.box(10, 4, 1, 11, 6, 5, d)
        b.box(9, 4, 4, 10, 6, 5, d)
    },
    // dice
    (b) => {
        b.box(0, 0, 0, 9, 9, 9, "#F4EEE2")
        b.recolor((x, y, z) =>
            [x, y, z].filter((v) => v === 0 || v === 8).length >= 2
                ? null
                : undefined
        )
        const p = "#1F1F24"
        for (const [x, y] of [
            [2, 2],
            [2, 6],
            [4, 4],
            [6, 2],
            [6, 6],
        ])
            b.put(x, y, 8, p)
        for (const [y, z] of [
            [2, 6],
            [4, 4],
            [6, 2],
        ])
            b.put(8, y, z, p)
        for (const [x, z] of [
            [2, 6],
            [6, 2],
        ])
            b.put(x, 8, z, p)
    },
    // camera
    (b) => {
        const d = "#2D2D35"
        b.box(0, 1, 0, 10, 6, 6, "#FF7F6E")
        b.box(0, 1, 5, 10, 6, 6, d)
        b.tubeY(5, 3, 6, 8, 2.2, "#4A4F5C")
        b.tubeY(5, 3, 7, 8, 1.4, "#7FB2FF")
        b.box(1, 5, 4, 3, 6, 5, "#F6F1E7")
        b.box(7, 2, 6, 9, 4, 7, d)
        b.put(2, 3, 6, "#FFD34D")
    },
    // alarm clock
    (b) => {
        const r = "#E5383B"
        const d = "#222226"
        b.tubeY(4.5, 5, 0, 3, 4, r)
        b.tubeY(4.5, 5, 2, 3, 3.1, "#FFF6E5")
        b.box(4, 2, 5, 5, 3, 8, d)
        b.box(5, 2, 5, 7, 3, 6, d)
        b.ball(1.5, 1.5, 9.5, 1.5, r)
        b.ball(7.5, 1.5, 9.5, 1.5, r)
        b.box(4, 1, 9, 5, 2, 11, d)
        b.box(1, 1, 0, 2, 2, 1, d)
        b.box(7, 1, 0, 8, 2, 1, d)
    },
    // cottage
    (b) => {
        const br = "#C8553D"
        b.box(0, 0, 0, 11, 11, 1, "#7BC47F")
        b.box(2, 2, 1, 9, 9, 6, br)
        b.box(7, 3, 6, 8, 4, 11, br)
        for (let k = 0; k < 5; k++)
            b.box(1, 1 + k, 6 + k, 10, 10 - k, 7 + k, "#3D4A5C")
        b.box(4, 8, 1, 6, 9, 4, "#5B3A29")
        b.box(6, 8, 3, 8, 9, 5, "#FFE08A")
        b.box(8, 4, 3, 9, 6, 5, "#FFE08A")
    },
    // ice lolly
    (b) => {
        b.box(4, 3, 0, 5, 4, 4, "#E0B97A")
        b.box(2, 2, 4, 7, 5, 12, "#F25F6B")
        b.box(2, 2, 4, 7, 5, 5, "#6BBF59")
        b.box(2, 2, 5, 7, 5, 6, "#E9F7DF")
        for (const [x, z] of [
            [3, 8],
            [5, 9],
            [4, 10],
            [3, 11],
        ])
            b.put(x, 4, z, "#2A1A1A")
        for (const [y, z] of [
            [3, 8],
            [2, 10],
        ])
            b.put(6, y, z, "#2A1A1A")
        b.box(5, 2, 10, 7, 5, 12, null)
    },
    // headphones
    (b) => {
        const l = "#B79CF2"
        const d = "#6E5AA8"
        b.box(0, 3, 0, 2, 7, 5, l)
        b.box(8, 3, 0, 10, 7, 5, l)
        b.box(2, 3, 1, 3, 7, 4, d)
        b.box(7, 3, 1, 8, 7, 4, d)
        for (let x = 0; x < 10; x++)
            for (let z = 5; z < 12; z++) {
                const r = Math.hypot(x + 0.5 - 5, z + 0.5 - 5)
                if (r >= 3.5 && r <= 5)
                    for (let y = 4; y < 6; y++) b.put(x, y, z, z >= 9 ? d : l)
            }
    },
    // toaster
    (b) => {
        const c = "#D5D9DE"
        b.box(0, 1, 0, 10, 7, 7, c)
        b.box(0, 1, 0, 10, 7, 1, "#AEB4BC")
        b.recolor((x, y, z) =>
            z === 6 &&
            (x === 0 || x === 9 || y === 1 || y === 6) &&
            (x === 0 || x === 9) &&
            (y === 1 || y === 6)
                ? null
                : undefined
        )
        b.box(2, 2, 6, 8, 3, 7, null)
        b.box(2, 5, 6, 8, 6, 7, null)
        b.box(2, 2, 5, 8, 3, 9, (x, y, z) => (z === 8 ? "#A8642F" : "#E3A857"))
        b.box(2, 5, 5, 8, 6, 10, (x, y, z) => (z === 9 ? "#A8642F" : "#E3A857"))
        b.box(10, 3, 3, 11, 4, 4, "#33363C")
        b.put(5, 6, 3, "#33363C")
    },
    // trophy
    (b) => {
        const g = "#F4C430"
        b.box(1, 1, 0, 8, 8, 2, "#3B3B45")
        b.box(3, 7, 0, 6, 8, 1, g)
        b.cyl(4.5, 4.5, 2, 5, 1, g)
        b.cone(4.5, 4.5, 5, 11, 1.5, 3.6, g)
        b.cyl(4.5, 4.5, 10, 11, 2.6, null)
        b.cyl(4.5, 4.5, 9, 10, 2.6, "#C99A12")
        b.box(6, 4, 6, 9, 5, 7, g)
        b.box(9, 4, 6, 10, 5, 10, g)
        b.box(8, 4, 9, 10, 5, 10, g)
        b.box(4, 6, 6, 5, 9, 7, g)
        b.box(4, 9, 6, 5, 10, 10, g)
        b.box(4, 8, 9, 5, 10, 10, g)
    },
    // burger
    (b) => {
        const bun = "#EFAE5E"
        b.cyl(4.5, 4.5, 0, 2, 4, "#E9A85C")
        b.cyl(4.5, 4.5, 2, 4, 4.3, "#6B3A22")
        b.cyl(4.5, 4.5, 4, 5, 4.5, "#FFC83D")
        for (const [x, y] of [
            [8, 4],
            [4, 8],
            [7, 7],
        ])
            b.put(x, y, 3, "#FFC83D")
        b.cyl(4.5, 4.5, 5, 6, 4.6, "#7CC243")
        b.cyl(4.5, 4.5, 6, 7, 4, "#E5483B")
        b.ball(4.5, 4.5, 7, 4.2, bun, 0.75, 7)
        b.recolor((x, y, z, c) =>
            c === bun && !b.has(x, y, z + 1) && hash(x, y, z) % 5 === 0
                ? "#FFF4D6"
                : undefined
        )
    },
    // pencil
    (b) => {
        for (let x = 0; x < 19; x++)
            for (let y = 0; y < 5; y++)
                for (let z = 0; z < 5; z++) {
                    const d = (y + 0.5 - 2.5) ** 2 + (z + 0.5 - 2.5) ** 2
                    let r = 2.1
                    let c = y === 2 ? "#FFD34D" : "#FFC21A"
                    if (x < 4) {
                        r = 0.5 + x * 0.5
                        c = x < 2 ? "#3A3A40" : "#E8C79A"
                    } else if (x === 15) {
                        r = 2.2
                        c = "#C9CED6"
                    } else if (x > 15) c = "#F48FA8"
                    if (d <= r * r) b.put(x, y, z, c)
                }
    },
    // sailboat
    (b) => {
        const s = "#F7F4EC"
        b.box(2, 1, 0, 10, 4, 1, "#2F6FB3")
        b.box(1, 0, 1, 11, 5, 2, "#2F6FB3")
        b.box(0, 0, 2, 12, 5, 3, "#C98B4B")
        b.box(6, 2, 3, 7, 3, 14, "#8E5A2B")
        for (let z = 4; z < 13; z++) {
            const len = Math.round((13 - z) * 0.55)
            for (let x = 7; x < 7 + len; x++)
                b.put(x, 2, z, z === 6 ? "#E85D4A" : s)
            const jib = Math.round((13 - z) * 0.4)
            for (let x = 6 - jib; x < 6; x++) b.put(x, 2, z, s)
        }
        b.box(7, 2, 13, 9, 3, 14, "#E85D4A")
    },
]

function tint(hex: string, f: number) {
    const n = parseInt(hex.slice(1), 16)
    const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)))
    const r = ch((n >> 16) & 255)
    const g = ch((n >> 8) & 255)
    const b = ch(n & 255)
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

function blockToUri(b: Block) {
    const cells = Array.from(b.m.entries()).map(([k, c]) => ({
        x: k % SPAN,
        y: Math.floor(k / SPAN) % SPAN,
        z: Math.floor(k / (SPAN * SPAN)),
        c,
    }))
    cells.sort((p, q) => p.x + p.y + p.z - (q.x + q.y + q.z) || p.z - q.z)
    const K = 0.8660254
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    const out: string[] = []
    const face = (pts: number[][], fill: string) => {
        let d = ""
        pts.forEach(([x, y, z], i) => {
            const sx = (x - y) * K
            const sy = (x + y) * 0.5 - z
            if (sx < minX) minX = sx
            if (sx > maxX) maxX = sx
            if (sy < minY) minY = sy
            if (sy > maxY) maxY = sy
            d += (i ? "L" : "M") + sx.toFixed(2) + " " + sy.toFixed(2)
        })
        out.push(
            `<path d='${d}Z' fill='${fill}' stroke='${tint(fill, 0.93)}'/>`
        )
    }
    for (const { x, y, z, c } of cells) {
        if (!b.has(x, y, z + 1))
            face(
                [
                    [x, y, z + 1],
                    [x + 1, y, z + 1],
                    [x + 1, y + 1, z + 1],
                    [x, y + 1, z + 1],
                ],
                tint(c, 1.05)
            )
        if (!b.has(x, y + 1, z))
            face(
                [
                    [x, y + 1, z],
                    [x + 1, y + 1, z],
                    [x + 1, y + 1, z + 1],
                    [x, y + 1, z + 1],
                ],
                tint(c, 0.86)
            )
        if (!b.has(x + 1, y, z))
            face(
                [
                    [x + 1, y, z],
                    [x + 1, y + 1, z],
                    [x + 1, y + 1, z + 1],
                    [x + 1, y, z + 1],
                ],
                tint(c, 0.7)
            )
    }
    const pad = 0.6
    const w = maxX - minX + pad * 2
    const h = maxY - minY + pad * 2
    const side = Math.max(w, h)
    const ox = minX - pad - (side - w) / 2
    const oy = minY - pad - (side - h) / 2
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${ox.toFixed(2)} ${oy.toFixed(2)} ${side.toFixed(2)} ${side.toFixed(2)}'>` +
        `<g stroke-width='0.035' stroke-linejoin='round'>${out.join("")}</g></svg>`
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
}

const ART: string[] = []
function builtInArt(i: number) {
    const k = ((i % MODELS.length) + MODELS.length) % MODELS.length
    if (!ART[k]) {
        const b = new Block()
        MODELS[k](b)
        ART[k] = blockToUri(b)
    }
    return ART[k]
}

/* ───────────────────────── content ───────────────────────── */

const DEFAULT_ITEMS = [
    ["Slow Morning Mug", "Blueberry Ink"],
    ["Late Shift Lamp", "Marigold Static"],
    ["Desert Roommate", "Sage Terracotta"],
    ["Unopened Surprise", "Cherry Ribbon"],
    ["Forest Toadstool", "Poppy Speckle"],
    ["Two Scoop Summer", "Pistachio Wafer"],
    ["Bathtub Admiral", "Butter Yolk"],
    ["Pocket Broadcaster", "Mint Transistor"],
    ["Weekend Rocket", "Flare Orange"],
    ["Snowline Pine", "Spruce Frost"],
    ["Corner Perch", "Oak Honey"],
    ["Birthday Stack", "Strawberry Cream"],
    ["Patient Hourglass", "Desert Glass"],
    ["Window Garden Can", "Seafoam Tin"],
    ["Campfire Lantern", "Ember Gold"],
    ["Tiny Assistant", "Steel Lilac"],
    ["Hot Air Daydream", "Sunset Stripe"],
    ["Ringed Wanderer", "Nebula Peach"],
    ["Afternoon Teapot", "Celadon Glaze"],
    ["Lucky Throw", "Bone Ivory"],
    ["Instant Memory", "Coral Shutter"],
    ["Wake Up Bell", "Signal Red"],
    ["Little Homestead", "Brick Meadow"],
    ["Melting Point", "Watermelon Ice"],
    ["Quiet Hours", "Lavender Hush"],
    ["Golden Pop", "Chrome Crumb"],
    ["First Place Cup", "Gilded Laurel"],
    ["Double Stack", "Sesame Grill"],
    ["Sketchbook Pencil", "School Bus Yellow"],
    ["Harbour Drifter", "Tidewater Blue"],
].map(([title, caption]) => ({ title, caption, imageUrl: "", link: "" }))

type Entry = {
    src: string
    alt: string
    title: string
    caption: string
    link: string
}

function normalise(list: any[] | undefined): Entry[] {
    const src = Array.isArray(list) && list.length ? list : DEFAULT_ITEMS
    return src.map((it: any, i: number) => ({
        src:
            it?.image?.src ||
            (typeof it?.imageUrl === "string" ? it.imageUrl.trim() : "") ||
            builtInArt(i),
        alt: it?.image?.alt || it?.title || "",
        title: it?.title || "",
        caption: it?.caption || "",
        link: it?.link || "",
    }))
}

/* ───────────────────────── layout (pure CSS, container queries) ───────────────────────── */

type Plan = { c: number; r: number; side: number; top: number; bottom: number }
const PLANS: Record<string, Plan> = {
    panorama: { c: 9, r: 5, side: 2, top: 1, bottom: 1 },
    landscape: { c: 8, r: 6, side: 2, top: 1, bottom: 1 },
    square: { c: 7, r: 7, side: 1, top: 1, bottom: 1 },
    portrait: { c: 4, r: 8, side: 0, top: 2, bottom: 2 },
}
const MAX_TILES = 32

function ringOf(p: Plan) {
    const cells: [number, number][] = []
    for (let r = 0; r < p.r; r++)
        for (let c = 0; c < p.c; c++) {
            const inner =
                c >= p.side &&
                c < p.c - p.side &&
                r >= p.top &&
                r < p.r - p.bottom
            if (!inner) cells.push([r, c])
        }
    return cells
}

function planRules(s: string, p: Plan, gap: number) {
    const cells = ringOf(p)
    let css =
        `${s}-grid{--cell:min(calc((100cqw - ${(p.c - 1) * gap}px) / ${p.c}),calc((100cqh - ${(p.r - 1) * gap}px) / ${p.r}));` +
        `grid-template-columns:repeat(${p.c},var(--cell));grid-template-rows:repeat(${p.r},var(--cell))}` +
        `${s}-pv{grid-area:${p.top + 1}/${p.side + 1}/${p.r - p.bottom + 1}/${p.c - p.side + 1}}`
    for (let k = 0; k < MAX_TILES; k++) {
        const cell = cells[k]
        css += cell
            ? `${s}-t${k}{display:block;grid-area:${cell[0] + 1}/${cell[1] + 1}}`
            : `${s}-t${k}{display:none}`
    }
    return css
}

function layoutCss(uid: string, arrangement: string, gap: number) {
    const s = `.k${uid}`
    if (arrangement && arrangement !== "auto")
        return planRules(s, PLANS[arrangement] || PLANS.square, gap)
    const stage = `ks${uid}`
    return (
        planRules(s, PLANS.square, gap) +
        `@container ${stage} (min-aspect-ratio: 231/200){${planRules(s, PLANS.landscape, gap)}}` +
        `@container ${stage} (min-aspect-ratio: 31/20){${planRules(s, PLANS.panorama, gap)}}` +
        `@container ${stage} (max-aspect-ratio: 707/1000){${planRules(s, PLANS.portrait, gap)}}`
    )
}

function px(v: any, fallback: number) {
    if (typeof v === "number") return `${v}px`
    if (typeof v === "string" && v.trim()) return v
    return `${fallback}px`
}

function useScope() {
    return useId().replace(/[^a-zA-Z0-9]/g, "")
}

/* ───────────────────────── static branch (canvas / export) ───────────────────────── */

function StillCloister(props: any) {
    const uid = useScope()
    const entries = normalise(props.items)
    const n = entries.length
    const look = props.look || {}
    const pv = props.preview || {}
    const tiles = props.tiles || {}
    const gap = look.gap ?? 6
    const start = Math.min(
        n - 1,
        Math.max(0, Math.round((props.startIndex ?? 1) - 1))
    )
    const item = entries[start]
    const tf = props.titleFont || {}
    const cf = props.captionFont || {}
    const cells = []
    for (let k = 0; k < MAX_TILES; k++) {
        const idx = k % n
        cells.push(
            <div
                key={k}
                className={`k${uid}-t${k}`}
                style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: look.tileRadius ?? 4,
                    background:
                        idx === start
                            ? (look.tileActive ?? "#EAEAE6")
                            : (look.tileColor ?? "#F2F2EF"),
                }}
            >
                <img
                    src={entries[idx].src}
                    alt=""
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: `${tiles.padding ?? 14}%`,
                        width: `${100 - 2 * (tiles.padding ?? 14)}%`,
                        height: `${100 - 2 * (tiles.padding ?? 14)}%`,
                        objectFit: "contain",
                    }}
                />
            </div>
        )
    }
    return (
        <div
            style={
                {
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    padding: look.padding ?? 16,
                    background: look.background ?? "#FFFFFF",
                    borderRadius: look.frameRadius ?? 0,
                    overflow: "hidden",
                } as React.CSSProperties
            }
        >
            <style>{layoutCss(uid, props.arrangement, gap)}</style>
            <div
                style={
                    {
                        flex: 1,
                        minHeight: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        containerType: "size",
                        containerName: `ks${uid}`,
                    } as React.CSSProperties
                }
            >
                <div
                    className={`k${uid}-grid`}
                    style={{ display: "grid", gap }}
                >
                    {cells}
                    <div
                        className={`k${uid}-pv`}
                        style={
                            {
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: look.previewRadius ?? 4,
                                background: look.previewColor ?? "#F4F4F1",
                                containerType: "size",
                            } as React.CSSProperties
                        }
                    >
                        <img
                            src={item.src}
                            alt={item.alt}
                            draggable={false}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "46%",
                                width: `${pv.imageSize ?? 48}cqmin`,
                                height: `${pv.imageSize ?? 48}cqmin`,
                                transform: "translate(-50%, -50%)",
                                objectFit: "contain",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                left: "6%",
                                bottom: "7%",
                                right: "28%",
                            }}
                        >
                            <div
                                style={{
                                    ...tf,
                                    fontSize: `clamp(12px, 6cqmin, ${px(tf.fontSize, 22)})`,
                                    color: look.titleColor ?? "#141414",
                                    margin: 0,
                                }}
                            >
                                {item.title}
                            </div>
                            {pv.showCaption !== false && item.caption && (
                                <div
                                    style={{
                                        ...cf,
                                        fontSize: `clamp(8px, 2.6cqmin, ${px(cf.fontSize, 10)})`,
                                        color: look.captionColor ?? "#A3A39E",
                                        textTransform: "uppercase",
                                        marginTop: "0.5em",
                                    }}
                                >
                                    {item.caption}
                                </div>
                            )}
                        </div>
                        {item.link && pv.linkLabel && (
                            <div
                                style={{
                                    ...cf,
                                    position: "absolute",
                                    right: "6%",
                                    bottom: "7%",
                                    fontSize: `clamp(8px, 2.6cqmin, ${px(cf.fontSize, 10)})`,
                                    color: look.titleColor ?? "#141414",
                                    textTransform: "uppercase",
                                }}
                            >
                                {pv.linkLabel} ↗
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ───────────────────────── live branch ───────────────────────── */

function useOnScreen(ref: React.RefObject<HTMLElement>) {
    const [seen, setSeen] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setSeen(true)
            return
        }
        const io = new IntersectionObserver(
            ([e]) => setSeen(e.isIntersecting),
            { threshold: 0.05 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [ref])
    return seen
}

function usePageShown() {
    const [shown, setShown] = useState(true)
    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setShown(document.visibilityState !== "hidden")
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])
    return shown
}

function useCalmPreference() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(mq.matches)
        sync()
        mq.addEventListener?.("change", sync)
        return () => mq.removeEventListener?.("change", sync)
    }, [])
    return calm
}

const SWAPS: Record<string, [string, string]> = {
    bloom: [
        "from{opacity:0;filter:blur(18px);transform:scale(.9)}to{opacity:1;filter:blur(0);transform:none}",
        "to{opacity:0;filter:blur(10px);transform:scale(1.04)}",
    ],
    rise: [
        "from{opacity:0;transform:translateY(9%)}to{opacity:1;transform:none}",
        "to{opacity:0;transform:translateY(-5%)}",
    ],
    zoom: [
        "from{opacity:0;transform:scale(1.2)}to{opacity:1;transform:none}",
        "to{opacity:0;transform:scale(.92)}",
    ],
    fade: ["from{opacity:0}to{opacity:1}", "to{opacity:0}"],
}

function motionCss(
    uid: string,
    mode: string,
    dur: number,
    hover: string,
    look: any
) {
    const s = `.k${uid}`
    const [enter, leave] = SWAPS[mode] || SWAPS.bloom
    const ease = "cubic-bezier(.2,.75,.15,1)"
    let css =
        `@keyframes k${uid}-in{${enter}}@keyframes k${uid}-out{${leave}}` +
        `@keyframes k${uid}-txt{from{opacity:0;filter:blur(6px);transform:translateY(6px)}to{opacity:1;filter:blur(0);transform:none}}` +
        `${s}-in{animation:k${uid}-in ${dur}s ${ease} both}` +
        `${s}-in ${s}-txt{animation:k${uid}-txt ${dur}s ${ease} ${(dur * 0.15).toFixed(2)}s both}` +
        `${s}-out{animation:k${uid}-out ${(dur * 0.55).toFixed(2)}s ease-in both;pointer-events:none}` +
        `${s}-tile{transition:background-color .3s ease}` +
        `${s}-tile img{transition:transform .4s ${ease},opacity .3s ease}` +
        `${s}-tile:focus-visible{outline:2px solid ${look.titleColor ?? "#141414"};outline-offset:2px}`
    if (hover === "lift")
        css += `${s}-tile:hover img{transform:translateY(-4%) scale(1.08)}`
    if (hover === "dim")
        css += `${s}-grid[data-over="1"] ${s}-tile:not(${s}-on) img{opacity:.32}${s}-on img{transform:scale(1.06)}`
    css += `@media (prefers-reduced-motion: reduce){${s}-in,${s}-in ${s}-txt{animation:none}${s}-out{display:none}${s}-tile img{transition:none}}`
    return css
}

type Layer = { key: number; idx: number; out: boolean }

function LiveCloister(props: any) {
    const uid = useScope()
    const entries = useMemo(() => normalise(props.items), [props.items])
    const n = entries.length
    const look = props.look || {}
    const pv = props.preview || {}
    const tiles = props.tiles || {}
    const idle = props.idle || {}
    const gap = look.gap ?? 6
    const pad = tiles.padding ?? 14
    const first = Math.min(
        n - 1,
        Math.max(0, Math.round((props.startIndex ?? 1) - 1))
    )

    const rootRef = useRef<HTMLDivElement>(null)
    const activeRef = useRef(first)
    const seqRef = useRef(1)
    const pointerKind = useRef("mouse")
    const [active, setActive] = useState(first)
    const [layers, setLayers] = useState<Layer[]>([
        { key: 0, idx: first, out: false },
    ])
    const [over, setOver] = useState(false)

    const onScreen = useOnScreen(rootRef)
    const pageShown = usePageShown()
    const calm = useCalmPreference()

    const show = useCallback((idx: number) => {
        if (idx === activeRef.current) return
        activeRef.current = idx
        setActive(idx)
        const key = seqRef.current++
        setLayers((prev) => {
            const current = prev.filter((l) => !l.out)
            const last = current[current.length - 1]
            return last
                ? [
                      { ...last, out: true },
                      { key, idx, out: false },
                  ]
                : [{ key, idx, out: false }]
        })
    }, [])

    const retire = useCallback((key: number) => {
        setLayers((prev) => prev.filter((l) => !(l.out && l.key === key)))
    }, [])

    useEffect(() => {
        if (activeRef.current >= n) {
            activeRef.current = -1
            show(0)
        }
    }, [n, show])

    const cycling =
        !!idle.enabled && onScreen && pageShown && !calm && !over && n > 1
    useEffect(() => {
        if (!cycling) return
        const t = window.setTimeout(
            () => show((activeRef.current + 1) % n),
            Math.max(800, (idle.delay ?? 3) * 1000)
        )
        return () => window.clearTimeout(t)
    }, [cycling, active, n, idle.delay, show])

    const go = (link: string) => {
        if (!link || typeof window === "undefined") return
        if (pv.newTab !== false)
            window.open(link, "_blank", "noopener,noreferrer")
        else window.location.href = link
    }

    const tf = props.titleFont || {}
    const cf = props.captionFont || {}
    const titleStyle: React.CSSProperties = {
        ...tf,
        fontSize: `clamp(12px, 6cqmin, ${px(tf.fontSize, 22)})`,
        color: look.titleColor ?? "#141414",
        margin: 0,
    }
    const captionStyle: React.CSSProperties = {
        ...cf,
        fontSize: `clamp(8px, 2.6cqmin, ${px(cf.fontSize, 10)})`,
        color: look.captionColor ?? "#A3A39E",
        textTransform: "uppercase",
        marginTop: "0.5em",
    }

    const tileNodes = []
    for (let k = 0; k < MAX_TILES; k++) {
        const idx = k % n
        const e = entries[idx]
        const on = idx === active
        tileNodes.push(
            <div
                key={k}
                role="button"
                tabIndex={0}
                aria-label={e.title || `Item ${idx + 1}`}
                aria-pressed={on}
                className={`k${uid}-tile k${uid}-t${k}${on ? ` k${uid}-on` : ""}`}
                onPointerDown={(ev) => (pointerKind.current = ev.pointerType)}
                onPointerEnter={(ev) => {
                    if (ev.pointerType !== "touch") show(idx)
                }}
                onFocus={() => show(idx)}
                onClick={() => {
                    const wasOn = activeRef.current === idx
                    show(idx)
                    if (
                        tiles.click === "link" &&
                        e.link &&
                        (pointerKind.current !== "touch" || wasOn)
                    )
                        go(e.link)
                }}
                onKeyDown={(ev) => {
                    if (
                        (ev.key === "Enter" || ev.key === " ") &&
                        tiles.click === "link" &&
                        e.link
                    ) {
                        ev.preventDefault()
                        go(e.link)
                    }
                }}
                style={{
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    outline: "none",
                    borderRadius: look.tileRadius ?? 4,
                    background: on
                        ? (look.tileActive ?? "#EAEAE6")
                        : (look.tileColor ?? "#F2F2EF"),
                }}
            >
                <img
                    src={e.src}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    style={{
                        position: "absolute",
                        inset: `${pad}%`,
                        width: `${100 - 2 * pad}%`,
                        height: `${100 - 2 * pad}%`,
                        objectFit: "contain",
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                />
            </div>
        )
    }

    const current = entries[active] || entries[0]

    return (
        <div
            ref={rootRef}
            style={
                {
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    padding: look.padding ?? 16,
                    background: look.background ?? "#FFFFFF",
                    borderRadius: look.frameRadius ?? 0,
                    overflow: "hidden",
                } as React.CSSProperties
            }
        >
            <style>
                {layoutCss(uid, props.arrangement, gap) +
                    motionCss(
                        uid,
                        pv.transition,
                        pv.duration ?? 0.6,
                        tiles.hover ?? "lift",
                        look
                    )}
            </style>
            <div
                style={
                    {
                        flex: 1,
                        minHeight: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        containerType: "size",
                        containerName: `ks${uid}`,
                    } as React.CSSProperties
                }
            >
                <div
                    className={`k${uid}-grid`}
                    data-over={over ? "1" : "0"}
                    onPointerEnter={(ev) =>
                        ev.pointerType !== "touch" && setOver(true)
                    }
                    onPointerLeave={() => setOver(false)}
                    style={{ display: "grid", gap }}
                >
                    {tileNodes}
                    <div
                        className={`k${uid}-pv`}
                        aria-live="polite"
                        style={
                            {
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: look.previewRadius ?? 4,
                                background: look.previewColor ?? "#F4F4F1",
                                containerType: "size",
                            } as React.CSSProperties
                        }
                    >
                        {layers.map((layer) => {
                            const e = entries[layer.idx] || entries[0]
                            const cls = layer.out
                                ? `k${uid}-out`
                                : layer.key > 0
                                  ? `k${uid}-in`
                                  : ""
                            return (
                                <div
                                    key={layer.key}
                                    className={cls}
                                    onAnimationEnd={(ev) => {
                                        if (
                                            layer.out &&
                                            ev.target === ev.currentTarget
                                        )
                                            retire(layer.key)
                                    }}
                                    style={{ position: "absolute", inset: 0 }}
                                >
                                    <img
                                        src={e.src}
                                        alt={e.alt}
                                        draggable={false}
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            top: "46%",
                                            width: `${pv.imageSize ?? 48}cqmin`,
                                            height: `${pv.imageSize ?? 48}cqmin`,
                                            transform: "translate(-50%, -50%)",
                                            objectFit: "contain",
                                            userSelect: "none",
                                        }}
                                    />
                                    <div
                                        className={`k${uid}-txt`}
                                        style={{
                                            position: "absolute",
                                            left: "6%",
                                            bottom: "7%",
                                            right: "28%",
                                        }}
                                    >
                                        <div style={titleStyle}>{e.title}</div>
                                        {pv.showCaption !== false &&
                                            e.caption && (
                                                <div style={captionStyle}>
                                                    {e.caption}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            )
                        })}
                        {current.link && (
                            <a
                                href={current.link}
                                target={
                                    pv.newTab !== false ? "_blank" : undefined
                                }
                                rel="noopener noreferrer"
                                aria-label={current.title || "Open"}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    color: "inherit",
                                    textDecoration: "none",
                                }}
                            >
                                {pv.linkLabel && (
                                    <span
                                        style={{
                                            ...captionStyle,
                                            marginTop: 0,
                                            position: "absolute",
                                            right: "6%",
                                            bottom: "7%",
                                            color: look.titleColor ?? "#141414",
                                        }}
                                    >
                                        {pv.linkLabel} ↗
                                    </span>
                                )}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Cloister(props: any) {
    const still = useIsStaticRenderer()
    if (still) return <StillCloister {...props} />
    return <LiveCloister {...props} />
}

addPropertyControls(Cloister, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: MAX_TILES,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "New Piece",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "Colourway",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start Item",
        min: 1,
        max: MAX_TILES,
        step: 1,
        defaultValue: 1,
        displayStepper: true,
    },
    arrangement: {
        type: ControlType.Enum,
        title: "Arrangement",
        options: ["auto", "panorama", "landscape", "square", "portrait"],
        optionTitles: ["Auto", "9 × 5", "8 × 6", "7 × 7", "4 × 8"],
        defaultValue: "auto",
    },
    preview: {
        type: ControlType.Object,
        title: "Preview",
        controls: {
            transition: {
                type: ControlType.Enum,
                title: "Swap",
                options: ["bloom", "rise", "zoom", "fade"],
                optionTitles: ["Blur Bloom", "Rise", "Zoom", "Fade"],
                defaultValue: "bloom",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.2,
                max: 1.6,
                step: 0.05,
                unit: "s",
                defaultValue: 0.6,
            },
            imageSize: {
                type: ControlType.Number,
                title: "Image Size",
                min: 25,
                max: 95,
                step: 1,
                unit: "%",
                defaultValue: 48,
            },
            showCaption: {
                type: ControlType.Boolean,
                title: "Caption",
                defaultValue: true,
            },
            linkLabel: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: "Open",
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: true,
            },
        },
    },
    tiles: {
        type: ControlType.Object,
        title: "Tiles",
        controls: {
            hover: {
                type: ControlType.Enum,
                title: "Hover",
                options: ["lift", "dim", "none"],
                optionTitles: ["Lift", "Dim Others", "None"],
                defaultValue: "lift",
            },
            padding: {
                type: ControlType.Number,
                title: "Inset",
                min: 0,
                max: 35,
                step: 1,
                unit: "%",
                defaultValue: 14,
            },
            click: {
                type: ControlType.Enum,
                title: "Click",
                options: ["preview", "link"],
                optionTitles: ["Preview", "Open Link"],
                defaultValue: "preview",
            },
        },
    },
    idle: {
        type: ControlType.Object,
        title: "Idle Cycle",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: false,
            },
            delay: {
                type: ControlType.Number,
                title: "Every",
                min: 1.5,
                max: 10,
                step: 0.5,
                unit: "s",
                defaultValue: 3,
                hidden: (p: any) => !p.enabled,
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#FFFFFF",
            },
            tileColor: {
                type: ControlType.Color,
                title: "Tile",
                defaultValue: "#F2F2EF",
            },
            tileActive: {
                type: ControlType.Color,
                title: "Tile Active",
                defaultValue: "#EAEAE6",
            },
            previewColor: {
                type: ControlType.Color,
                title: "Preview",
                defaultValue: "#F4F4F1",
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title",
                defaultValue: "#141414",
            },
            captionColor: {
                type: ControlType.Color,
                title: "Caption",
                defaultValue: "#A3A39E",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 24,
                step: 1,
                defaultValue: 6,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 16,
            },
            tileRadius: {
                type: ControlType.Number,
                title: "Tile Radius",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 4,
            },
            previewRadius: {
                type: ControlType.Number,
                title: "Preview Radius",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 4,
            },
            frameRadius: {
                type: ControlType.Number,
                title: "Frame Radius",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 0,
            },
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
        },
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.08em",
            lineHeight: 1.3,
        },
    },
})
