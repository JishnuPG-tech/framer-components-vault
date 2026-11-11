import * as React from "react"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---------------------------------------------------------------------------
// NOTE ON IMPORTS: this component has exactly one dependency — the "three"
// npm package, resolved and bundled by Framer at publish time (no code is
// ever loaded from a remote CDN at runtime). Every previous attempt at using
// an SVG-loading helper failed for a different reason: "three/examples/jsm/
// ..." and "three/addons/..." subpaths wouldn't resolve at all, and the
// "three-stdlib" package (a common substitute) pulled in a mismatched
// internal "three" version that broke at runtime ("does not provide an
// export named 'AddEquation'"). Rather than depend on any more loader
// packages, SVG <path> parsing is implemented locally below — it only
// touches the stable, core THREE.Shape/THREE.Vector2 API.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Built-in default logo — kobielakdesign's "K" mark, used whenever no custom
// SVG is uploaded via the "Custom SVG" control. Any single/multi-path
// closed-shape SVG works when uploaded, so users can swap in their own logo.
// ---------------------------------------------------------------------------
const DEFAULT_LOGO_SVG = `<svg width="27" height="33" viewBox="0 0 27 33" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.22155 0.0162102C8.45122 -0.0080814 8.62205 -0.00500731 8.73424 0.0249993C8.90252 0.07009 9.05851 0.193477 9.20202 0.395116C9.34764 0.588735 9.50947 0.867915 9.68639 1.23301C9.86121 1.6062 10.0629 2.07228 10.2909 2.63144C10.5189 3.1907 10.7975 3.84984 11.1268 4.60801C11.3186 5.0458 11.5044 5.47373 11.6844 5.89121C11.8624 6.31674 12.0315 6.71374 12.1903 7.08262C12.3469 7.45952 12.4929 7.79539 12.6288 8.08945C12.7544 8.38918 12.8607 8.63241 12.9481 8.81894C13.0293 8.77205 13.1147 8.726 13.204 8.68125C13.291 8.64451 13.3757 8.60313 13.4569 8.55625L15.2596 3.5123C15.287 3.44233 15.3217 3.37388 15.3651 3.3082C15.4004 3.24053 15.4668 3.20241 15.5633 3.19394L19.2938 2.87949C19.3905 2.87106 19.5176 2.86255 19.6747 2.85312C19.8316 2.84371 19.9781 2.85677 20.1141 2.89316C20.2343 2.92537 20.3266 2.98437 20.3895 3.06992C20.4525 3.15549 20.461 3.28253 20.4159 3.45078C20.2491 3.91283 20.0371 4.51333 19.7792 5.25156C19.5132 5.9876 19.2191 6.82772 18.8973 7.77207C18.5654 8.72235 18.2109 9.75703 17.8339 10.8756C17.4467 11.9999 17.0403 13.1793 16.6151 14.4137L15.3729 18.0611L15.9579 17.7164L18.2323 16.0582C18.5114 15.8496 18.7885 15.6492 19.0633 15.4566C19.3404 15.2561 19.5857 15.0769 19.7997 14.9195C20.0236 14.7564 20.2059 14.6206 20.3465 14.5123C20.4872 14.404 20.5684 14.3434 20.5887 14.3316L26.0448 15.317C26.0631 15.3134 26.1005 15.3197 26.1561 15.3346L26.2518 15.36C26.4361 15.4093 26.5159 15.4825 26.4901 15.5787C26.475 15.6347 26.4279 15.6954 26.3505 15.7604C26.283 15.8195 26.1809 15.8948 26.0448 15.9869C25.8759 16.1047 25.629 16.275 25.3036 16.4967C24.988 16.7127 24.6395 16.955 24.2587 17.2223C23.88 17.4815 23.4853 17.7538 23.0741 18.0387C22.6731 18.3176 22.2981 18.5774 21.9501 18.8189C21.604 19.0526 21.3041 19.2565 21.0516 19.4293C20.8078 19.6039 20.6532 19.7168 20.5878 19.7682L19.6366 20.2867C18.9928 20.6381 18.1722 21.0711 17.1757 21.5855C17.3553 21.9085 17.5452 22.2597 17.744 22.6393C17.953 23.0131 18.1477 23.375 18.329 23.7242L19.1844 25.2926L21.746 30.5914C21.7731 30.6501 21.8145 30.7044 21.87 30.7535C21.9254 30.8027 21.9823 30.8481 22.0399 30.8893C22.0973 30.9304 22.1413 30.9726 22.1727 31.0152C22.2143 31.0521 22.2303 31.0904 22.2196 31.1305C22.2067 31.1785 22.1339 31.2407 22.0018 31.317C21.9205 31.3639 21.7749 31.4284 21.5643 31.5094C21.3559 31.5823 21.1119 31.6581 20.8329 31.7379C20.5618 31.8199 20.2692 31.9008 19.9559 31.9801C19.6428 32.0593 19.3421 32.1249 19.0536 32.1764C18.7708 32.238 18.5102 32.2792 18.2723 32.3014C18.0427 32.3256 17.8718 32.3236 17.7596 32.2936C17.5914 32.2485 17.4353 32.1249 17.2919 31.9234C17.1462 31.7298 16.9854 31.4498 16.8085 31.0846C16.6336 30.7114 16.432 30.2453 16.204 29.6861C15.9759 29.1269 15.6974 28.4677 15.368 27.7096C15.1762 27.2717 14.9895 26.8439 14.8094 26.4264C14.6315 26.0009 14.4633 25.6038 14.3046 25.235C14.1479 24.858 14.001 24.5222 13.8651 24.2281C13.7394 23.9284 13.6331 23.6852 13.5458 23.4986C13.4645 23.5456 13.3792 23.5915 13.2899 23.6363C13.2028 23.6731 13.1182 23.7144 13.037 23.7613L11.2352 28.8053C11.2079 28.8752 11.1721 28.9437 11.1288 29.0094C11.0934 29.077 11.0272 29.1152 10.9305 29.1236L7.20006 29.4381C7.10338 29.4465 6.97612 29.455 6.81921 29.4645C6.66231 29.4738 6.51581 29.4608 6.37975 29.4244C6.25969 29.3922 6.16829 29.3331 6.10534 29.2477C6.04239 29.1621 6.03293 29.035 6.07799 28.8668C6.24474 28.4047 6.45678 27.8042 6.71471 27.066C6.98064 26.33 7.2748 25.4899 7.59655 24.5455C7.92848 23.5952 8.28301 22.5606 8.66003 21.442C9.04718 20.3176 9.45355 19.1383 9.87878 17.9039L11.12 14.2555L10.536 14.6012L8.26256 16.2594C7.98351 16.4679 7.70628 16.6684 7.43151 16.8609C7.15445 17.0615 6.90815 17.2407 6.69421 17.398C6.47023 17.5612 6.28796 17.697 6.14733 17.8053C6.00675 17.9135 5.92651 17.9741 5.90612 17.9859L0.450065 17.0006C0.431909 17.0043 0.394735 16.998 0.338737 16.983L0.242057 16.9576C0.0579069 16.9082 -0.0210035 16.835 0.00475235 16.7389C0.0199301 16.6829 0.0661008 16.6221 0.143424 16.5572C0.210806 16.498 0.312917 16.4228 0.449088 16.3307C0.618088 16.2128 0.865593 16.0428 1.19128 15.8209C1.50678 15.6049 1.85448 15.3625 2.23522 15.0953C2.61388 14.836 3.00948 14.5638 3.42077 14.2789C3.82178 14 4.1967 13.7402 4.54479 13.4986C4.89082 13.265 5.18981 13.0611 5.44225 12.8883C5.68661 12.7133 5.84185 12.6006 5.9071 12.5494L6.85729 12.0309C7.50112 11.6795 8.32151 11.2465 9.31823 10.732C9.13853 10.4091 8.94873 10.058 8.74987 9.67832C8.54085 9.30455 8.34618 8.94252 8.16491 8.59336L7.30944 7.025L4.74889 1.72617C4.72172 1.66739 4.68035 1.61327 4.62487 1.56406C4.56935 1.51483 4.51261 1.46954 4.45495 1.42832C4.39731 1.38711 4.35263 1.34512 4.32116 1.30234C4.27963 1.26548 4.26361 1.22711 4.27428 1.18711C4.28716 1.13904 4.36003 1.07682 4.49206 1.00059C4.57334 0.953656 4.71988 0.890155 4.93053 0.809179C5.13887 0.73628 5.38224 0.659436 5.661 0.579687C5.93204 0.497714 6.2247 0.416749 6.53796 0.337499C6.85104 0.258294 7.1518 0.192685 7.4403 0.14121C7.72304 0.0795644 7.98373 0.0383717 8.22155 0.0162102Z" fill="#141414"/>
</svg>`

// =============================================================================
// Self-contained SVG <path> parser — converts path "d" data directly into
// THREE.Shape objects, with no dependency beyond THREE's own core Shape /
// Vector2 API. Supports the full standard path command set (M/L/H/V/C/S/Q/T/
// A/Z, absolute + relative + implicit command repetition) and detects holes
// (e.g. the counter of a letter "O") via point-in-polygon containment.
// =============================================================================

// --- SVG elliptical-arc (A/a) -> cubic bezier segments -----------------------
// Standard arc-to-bezier conversion (per the SVG spec's own arc parameterization
// appendix). Splits the arc into <=90° segments for a good curve fit.
function arcToBezierSegments(
    shape,
    x0,
    y0,
    rx,
    ry,
    xAxisRotationDeg,
    largeArcFlag,
    sweepFlag,
    x,
    y
) {
    if (rx === 0 || ry === 0 || (x0 === x && y0 === y)) {
        shape.lineTo(x, y)
        return
    }
    rx = Math.abs(rx)
    ry = Math.abs(ry)
    const phi = THREE.MathUtils.degToRad(((xAxisRotationDeg % 360) + 360) % 360)
    const cosPhi = Math.cos(phi)
    const sinPhi = Math.sin(phi)

    const dx2 = (x0 - x) / 2
    const dy2 = (y0 - y) / 2
    const x1p = cosPhi * dx2 + sinPhi * dy2
    const y1p = -sinPhi * dx2 + cosPhi * dy2

    let rxSq = rx * rx
    let rySq = ry * ry
    const x1pSq = x1p * x1p
    const y1pSq = y1p * y1p
    const radiiCheck = x1pSq / rxSq + y1pSq / rySq
    if (radiiCheck > 1) {
        const scale = Math.sqrt(radiiCheck)
        rx *= scale
        ry *= scale
        rxSq = rx * rx
        rySq = ry * ry
    }

    const sign = largeArcFlag !== sweepFlag ? 1 : -1
    let sq =
        (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) /
        (rxSq * y1pSq + rySq * x1pSq)
    sq = sq < 0 ? 0 : sq
    const coef = sign * Math.sqrt(sq)
    const cxp = coef * ((rx * y1p) / ry)
    const cyp = coef * -((ry * x1p) / rx)

    const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x) / 2
    const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y) / 2

    const vectorAngle = (ux, uy, vx, vy) => {
        const sign2 = ux * vy - uy * vx < 0 ? -1 : 1
        const len =
            Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy) || 1
        const dot = THREE.MathUtils.clamp((ux * vx + uy * vy) / len, -1, 1)
        return sign2 * Math.acos(dot)
    }

    const theta1 = vectorAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    let dTheta = vectorAngle(
        (x1p - cxp) / rx,
        (y1p - cyp) / ry,
        (-x1p - cxp) / rx,
        (-y1p - cyp) / ry
    )
    if (!sweepFlag && dTheta > 0) dTheta -= Math.PI * 2
    if (sweepFlag && dTheta < 0) dTheta += Math.PI * 2

    const numSegments = Math.max(1, Math.ceil(Math.abs(dTheta) / (Math.PI / 2)))
    const delta = dTheta / numSegments
    const t =
        ((8 / 3) * Math.sin(delta / 4) * Math.sin(delta / 4)) /
        Math.sin(delta / 2)

    const transform = (px, py) => {
        const xr = px * rx
        const yr = py * ry
        return [cosPhi * xr - sinPhi * yr + cx, sinPhi * xr + cosPhi * yr + cy]
    }

    let theta = theta1
    for (let i = 0; i < numSegments; i++) {
        const theta2 = theta + delta
        const cosT1 = Math.cos(theta)
        const sinT1 = Math.sin(theta)
        const cosT2 = Math.cos(theta2)
        const sinT2 = Math.sin(theta2)

        const [cp1x, cp1y] = transform(cosT1 - t * sinT1, sinT1 + t * cosT1)
        const [cp2x, cp2y] = transform(cosT2 + t * sinT2, sinT2 - t * cosT2)
        const [ex, ey] = transform(cosT2, sinT2)

        shape.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey)
        theta = theta2
    }
}

// --- Path data tokenizer ------------------------------------------------------
// Hand-rolled (not regex-only) so arc flags (single '0'/'1' digits that SVG
// exporters often pack with no separator, e.g. "11-5,0") parse correctly.
function parsePathCommands(d) {
    const commands = []
    const len = d.length
    let i = 0

    const skipSeparators = () => {
        while (i < len && /[\s,]/.test(d[i])) i++
    }
    const readNumber = () => {
        skipSeparators()
        const start = i
        if (d[i] === "+" || d[i] === "-") i++
        while (i < len && /[0-9]/.test(d[i])) i++
        if (d[i] === ".") {
            i++
            while (i < len && /[0-9]/.test(d[i])) i++
        }
        if (d[i] === "e" || d[i] === "E") {
            i++
            if (d[i] === "+" || d[i] === "-") i++
            while (i < len && /[0-9]/.test(d[i])) i++
        }
        if (i === start)
            throw new Error(`Invalid number at position ${i} in path data`)
        return parseFloat(d.slice(start, i))
    }
    const readFlag = () => {
        skipSeparators()
        const c = d[i]
        if (c !== "0" && c !== "1")
            throw new Error(`Invalid arc flag at position ${i} in path data`)
        i++
        return c === "1" ? 1 : 0
    }

    const ARG_COUNTS = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, z: 0 }
    let currentCommand = null

    while (true) {
        skipSeparators()
        if (i >= len) break

        if (/[MmLlHhVvCcSsQqTtAaZz]/.test(d[i])) {
            currentCommand = d[i]
            i++
        }
        if (!currentCommand) break

        const key = currentCommand.toLowerCase()
        if (key === "z") {
            commands.push({ command: currentCommand, args: [] })
            currentCommand = null
            continue
        }

        const args = []
        if (key === "a") {
            args.push(
                readNumber(),
                readNumber(),
                readNumber(),
                readFlag(),
                readFlag(),
                readNumber(),
                readNumber()
            )
        } else {
            const count = ARG_COUNTS[key]
            for (let k = 0; k < count; k++) args.push(readNumber())
        }
        commands.push({ command: currentCommand, args })

        // Implicit command repetition: a coordinate pair with no following
        // command letter repeats the current command (M repeats as L).
        skipSeparators()
        if (i < len && /[0-9.+-]/.test(d[i])) {
            if (currentCommand === "M") currentCommand = "L"
            else if (currentCommand === "m") currentCommand = "l"
        } else {
            currentCommand = null
        }
    }

    return commands
}

// --- Commands -> THREE.Shape[] (one per subpath) ------------------------------
function commandsToSubpaths(commands) {
    const subpaths = []
    let currentShape = null
    const current = new THREE.Vector2(0, 0)
    const start = new THREE.Vector2(0, 0)
    let lastControl = null

    const ensureShape = () => {
        if (!currentShape) {
            currentShape = new THREE.Shape()
            currentShape.moveTo(current.x, current.y)
            subpaths.push(currentShape)
        }
        return currentShape
    }

    commands.forEach(({ command, args }) => {
        const isRelative = command === command.toLowerCase()
        const cmd = command.toUpperCase()
        const abs = (x, y) =>
            isRelative ? [current.x + x, current.y + y] : [x, y]

        switch (cmd) {
            case "M": {
                const [x, y] = abs(args[0], args[1])
                currentShape = new THREE.Shape()
                currentShape.moveTo(x, y)
                subpaths.push(currentShape)
                current.set(x, y)
                start.set(x, y)
                lastControl = null
                break
            }
            case "L": {
                const [x, y] = abs(args[0], args[1])
                ensureShape().lineTo(x, y)
                current.set(x, y)
                lastControl = null
                break
            }
            case "H": {
                const x = isRelative ? current.x + args[0] : args[0]
                ensureShape().lineTo(x, current.y)
                current.x = x
                lastControl = null
                break
            }
            case "V": {
                const y = isRelative ? current.y + args[0] : args[0]
                ensureShape().lineTo(current.x, y)
                current.y = y
                lastControl = null
                break
            }
            case "C": {
                const [x1, y1] = abs(args[0], args[1])
                const [x2, y2] = abs(args[2], args[3])
                const [x, y] = abs(args[4], args[5])
                ensureShape().bezierCurveTo(x1, y1, x2, y2, x, y)
                current.set(x, y)
                lastControl = { x: x2, y: y2 }
                break
            }
            case "S": {
                const [x2, y2] = abs(args[0], args[1])
                const [x, y] = abs(args[2], args[3])
                const x1 = lastControl
                    ? 2 * current.x - lastControl.x
                    : current.x
                const y1 = lastControl
                    ? 2 * current.y - lastControl.y
                    : current.y
                ensureShape().bezierCurveTo(x1, y1, x2, y2, x, y)
                current.set(x, y)
                lastControl = { x: x2, y: y2 }
                break
            }
            case "Q": {
                const [x1, y1] = abs(args[0], args[1])
                const [x, y] = abs(args[2], args[3])
                ensureShape().quadraticCurveTo(x1, y1, x, y)
                current.set(x, y)
                lastControl = { x: x1, y: y1 }
                break
            }
            case "T": {
                const [x, y] = abs(args[0], args[1])
                const x1 = lastControl
                    ? 2 * current.x - lastControl.x
                    : current.x
                const y1 = lastControl
                    ? 2 * current.y - lastControl.y
                    : current.y
                ensureShape().quadraticCurveTo(x1, y1, x, y)
                current.set(x, y)
                lastControl = { x: x1, y: y1 }
                break
            }
            case "A": {
                const [rx, ry, rotation, largeArc, sweep] = args
                const [x, y] = abs(args[5], args[6])
                arcToBezierSegments(
                    ensureShape(),
                    current.x,
                    current.y,
                    rx,
                    ry,
                    rotation,
                    !!largeArc,
                    !!sweep,
                    x,
                    y
                )
                current.set(x, y)
                lastControl = null
                break
            }
            case "Z": {
                if (currentShape) currentShape.lineTo(start.x, start.y)
                current.set(start.x, start.y)
                lastControl = null
                break
            }
            default:
                break
        }
    })

    return subpaths
}

// --- Hole detection via point-in-polygon containment --------------------------
function shoelaceArea(points) {
    let area = 0
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i]
        const p2 = points[(i + 1) % points.length]
        area += p1.x * p2.y - p2.x * p1.y
    }
    return Math.abs(area / 2)
}

function pointInPolygon(point, polygonPoints) {
    let inside = false
    for (
        let i = 0, j = polygonPoints.length - 1;
        i < polygonPoints.length;
        j = i++
    ) {
        const xi = polygonPoints[i].x
        const yi = polygonPoints[i].y
        const xj = polygonPoints[j].x
        const yj = polygonPoints[j].y
        const intersect =
            yi > point.y !== yj > point.y &&
            point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
        if (intersect) inside = !inside
    }
    return inside
}

// Groups raw subpaths into final shapes-with-holes: a subpath contained by an
// odd number of larger subpaths is a hole; it's assigned to the smallest
// subpath (with an even containment count) that contains it. This correctly
// handles the common cases (a letter's counter, a ring icon) without needing
// SVG fill-rule metadata.
function subpathsToShapes(subpaths) {
    if (subpaths.length <= 1) return subpaths

    const sampled = subpaths.map((shape) => {
        const points = shape.getPoints(48)
        return { shape, points, area: shoelaceArea(points) }
    })

    const containment = sampled.map(() => 0)
    for (let i = 0; i < sampled.length; i++) {
        for (let j = 0; j < sampled.length; j++) {
            if (i === j) continue
            if (
                sampled[j].area > sampled[i].area &&
                pointInPolygon(sampled[i].points[0], sampled[j].points)
            ) {
                containment[i]++
            }
        }
    }

    const outer = []
    sampled.forEach((s, i) => {
        if (containment[i] % 2 === 0) outer.push({ index: i, shape: s.shape })
    })

    sampled.forEach((s, i) => {
        if (containment[i] % 2 === 0) return // already an outer shape
        let bestIndex = -1
        let bestArea = Infinity
        for (let j = 0; j < sampled.length; j++) {
            if (containment[j] % 2 !== 0) continue
            if (
                sampled[j].area > s.area &&
                sampled[j].area < bestArea &&
                pointInPolygon(s.points[0], sampled[j].points)
            ) {
                bestArea = sampled[j].area
                bestIndex = j
            }
        }
        if (bestIndex === -1) return // orphan hole with no enclosing shape — ignore
        const parent = outer.find((e) => e.index === bestIndex)
        if (parent) parent.shape.holes.push(subpaths[i])
    })

    return outer.map((e) => e.shape)
}

function parseSvgToShapes(svgMarkup) {
    const doc = new DOMParser().parseFromString(svgMarkup, "image/svg+xml")
    const pathEls = Array.from(doc.querySelectorAll("path"))

    let allSubpaths = []
    pathEls.forEach((el) => {
        const d = el.getAttribute("d")
        if (!d) return
        try {
            const commands = parsePathCommands(d)
            allSubpaths = allSubpaths.concat(commandsToSubpaths(commands))
        } catch (err) {
            console.warn(
                "RotatingLogo3D: failed to parse an SVG <path>, skipping it.",
                err
            )
        }
    })

    return subpathsToShapes(allSubpaths)
}

function buildGeometries(
    svgMarkup,
    depth,
    bevelSize,
    bevelSegments,
    curveSegments
) {
    const shapes = parseSvgToShapes(svgMarkup)

    // Safety net: an uploaded file that fails to yield any usable closed
    // shape (corrupt SVG, stroke-only artwork, etc.) falls back to the
    // built-in logo instead of producing an empty/broken mesh.
    if (shapes.length === 0 && svgMarkup !== DEFAULT_LOGO_SVG) {
        console.warn(
            "RotatingLogo3D: uploaded SVG has no usable closed shapes, falling back to default logo."
        )
        return buildGeometries(
            DEFAULT_LOGO_SVG,
            depth,
            bevelSize,
            bevelSegments,
            curveSegments
        )
    }

    const extrudeSettings = {
        depth,
        bevelEnabled: true,
        bevelThickness: bevelSize * 0.6,
        bevelSize,
        bevelSegments,
        curveSegments,
    }

    const geometries = shapes.map((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
        // SVG uses a Y-down coordinate space. Rotating (not negative-scaling)
        // preserves correct face winding / normals for the metallic material.
        geometry.rotateX(Math.PI)
        return geometry
    })

    const box = new THREE.Box3()
    geometries.forEach((g) => {
        g.computeBoundingBox()
        box.union(g.boundingBox)
    })

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y) || 1
    const targetSize = 12 // normalized on-screen size regardless of source SVG units
    const scaleFactor = targetSize / maxDim

    geometries.forEach((g) => {
        g.translate(-center.x, -center.y, -center.z)
        g.scale(scaleFactor, scaleFactor, scaleFactor)
        g.computeVertexNormals()
    })

    return geometries
}

// ---------------------------------------------------------------------------
// Linear gradient baked as per-vertex colors (multiplied into the PBR base
// color via MeshPhysicalMaterial's vertexColors). Because it's baked in
// local space and rotates rigidly with the object, it sweeps across the
// silhouette as the logo spins — that's what produces shifting light/dark
// bands on top of the metal's env-map reflections.
// ---------------------------------------------------------------------------
function applyGradientColors(geometries, colorBottom, colorTop, angleDeg) {
    const cBottom = new THREE.Color(colorBottom)
    const cTop = new THREE.Color(colorTop)
    const rad = THREE.MathUtils.degToRad(angleDeg)
    const axisX = Math.sin(rad)
    const axisY = Math.cos(rad)

    let minProj = Infinity
    let maxProj = -Infinity
    geometries.forEach((g) => {
        const pos = g.attributes.position
        for (let i = 0; i < pos.count; i++) {
            const p = pos.getX(i) * axisX + pos.getY(i) * axisY
            if (p < minProj) minProj = p
            if (p > maxProj) maxProj = p
        }
    })
    const range = maxProj - minProj || 1

    const tmp = new THREE.Color()
    geometries.forEach((g) => {
        const pos = g.attributes.position
        const colors = new Float32Array(pos.count * 3)
        for (let i = 0; i < pos.count; i++) {
            const p = pos.getX(i) * axisX + pos.getY(i) * axisY
            const t = THREE.MathUtils.clamp((p - minProj) / range, 0, 1)
            tmp.copy(cBottom).lerp(cTop, t)
            colors[i * 3] = tmp.r
            colors[i * 3 + 1] = tmp.g
            colors[i * 3 + 2] = tmp.b
        }
        g.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    })
}

// ---------------------------------------------------------------------------
// Custom "studio" light environment for PMREM reflections. A generic
// environment reads too flat/uniform on a highly metallic material — real
// studio HDRIs get their strong bright/dark gradient across facets from a
// few bright softbox panels against an otherwise dark surround. This
// reproduces that directly instead of relying on a preset.
// ---------------------------------------------------------------------------
function createStudioEnvironment() {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0c0c10)

    const addPanel = (x, y, z, w, h, color, intensity) => {
        const geometry = new THREE.PlaneGeometry(w, h)
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color).multiplyScalar(intensity),
            toneMapped: false,
            side: THREE.DoubleSide,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(x, y, z)
        mesh.lookAt(0, 0, 0)
        scene.add(mesh)
    }

    addPanel(0, 7, 9, 12, 16, 0xffffff, 3.4) // big soft key light, front-top
    addPanel(-9, 1, -5, 9, 12, 0xcfc8ff, 1.5) // lavender fill, back-left
    addPanel(9, -4, -3, 7, 9, 0xffffff, 1.1) // rim light, lower-right
    addPanel(0, -8, 4, 14, 6, 0xffffff, 0.5) // soft bounce from below

    return scene
}

const SHADOW_VERTEX = `
  varying vec2 vShadowUv;
  void main() {
    vShadowUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SHADOW_FRAGMENT = `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec2 uTexelSize;
  uniform float uBlurRadius;
  varying vec2 vShadowUv;
  void main() {
    float alpha = 0.0;
    float total = 0.0;
    for (int x = -2; x <= 2; x++) {
      for (int y = -2; y <= 2; y++) {
        vec2 offset = vec2(float(x), float(y)) * uTexelSize * uBlurRadius;
        alpha += texture2D(uMap, vShadowUv + offset).a;
        total += 1.0;
      }
    }
    alpha /= total;
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha * uOpacity);
  }
`

// ---------------------------------------------------------------------------
// Real contact shadow: renders a plain black silhouette of the logo from
// straight above into a small render target each frame, then projects a
// blurred version of that texture onto a ground plane below the object.
// Because it's an actual render of the current geometry/rotation (not a
// fixed blob), the shadow's size and shape always track the logo's true
// footprint as it spins — the orthographic camera's frustum is refit to the
// live bounding box every frame. Height is fixed (computed once from the
// resting pose + a gap), so the object reads as floating a constant distance
// above the ground rather than the shadow chasing every wobble.
// ---------------------------------------------------------------------------
function createContactShadowRig(geometries, restRotation, resolution = 64) {
    const shadowScene = new THREE.Scene()
    const shadowGroup = new THREE.Group()
    const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    geometries.forEach((geo) => {
        shadowGroup.add(new THREE.Mesh(geo, blackMaterial))
    })
    shadowScene.add(shadowGroup)

    const shadowCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 60)
    shadowCamera.position.set(0, 30, 0)
    shadowCamera.rotation.x = -Math.PI / 2 // look straight down

    const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
        format: THREE.RGBAFormat,
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
    })

    const planeGeometry = new THREE.PlaneGeometry(1, 1)
    const planeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uMap: { value: renderTarget.texture },
            uOpacity: { value: 0.45 },
            uTexelSize: {
                value: new THREE.Vector2(1 / resolution, 1 / resolution),
            },
            uBlurRadius: { value: 1.6 },
        },
        vertexShader: SHADOW_VERTEX,
        fragmentShader: SHADOW_FRAGMENT,
        transparent: true,
        depthWrite: false,
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2

    // Stable floor height, computed once from the resting tilt — not
    // recomputed every frame — so the gap under the logo stays constant
    // instead of the shadow plane chasing the lowest point each frame.
    // ceilingY is exposed too so the camera can center on the true combined
    // span of [logo top .. shadow bottom] — after tilting, the logo is not
    // necessarily symmetric above/below its own y=0 center, so this can't be
    // assumed/approximated from floorY alone.
    shadowGroup.rotation.copy(restRotation)
    shadowGroup.updateMatrixWorld(true)
    const restBox = new THREE.Box3().setFromObject(shadowGroup)
    const floorY = restBox.min.y
    const ceilingY = restBox.max.y

    const box = new THREE.Box3()
    const size = new THREE.Vector3()
    const MARGIN = 1.15 // slight headroom for the blur to fall off before the texture edge

    function update(renderer, sourceRotation, gap) {
        shadowGroup.rotation.copy(sourceRotation)
        shadowGroup.updateMatrixWorld(true)

        box.setFromObject(shadowGroup)
        box.getSize(size)
        const footprint = Math.max(size.x, size.z, 2) * MARGIN

        shadowCamera.left = -footprint / 2
        shadowCamera.right = footprint / 2
        shadowCamera.top = footprint / 2
        shadowCamera.bottom = -footprint / 2
        shadowCamera.updateProjectionMatrix()

        plane.scale.set(footprint, footprint, 1)
        plane.position.y = floorY - gap

        const prevTarget = renderer.getRenderTarget()
        const prevClearColor = new THREE.Color()
        renderer.getClearColor(prevClearColor)
        const prevClearAlpha = renderer.getClearAlpha()

        renderer.setRenderTarget(renderTarget)
        renderer.setClearColor(0x000000, 0)
        renderer.clear(true, true, true)
        renderer.render(shadowScene, shadowCamera)

        renderer.setRenderTarget(prevTarget)
        renderer.setClearColor(prevClearColor, prevClearAlpha)
    }

    function dispose() {
        blackMaterial.dispose()
        planeGeometry.dispose()
        planeMaterial.dispose()
        renderTarget.dispose()
    }

    return { plane, update, dispose, floorY, ceilingY }
}

/**
 * Rotating 3D Logo — extrudes any uploaded SVG into a metallic, gradient-lit
 * 3D mesh with a real-time contact shadow, auto-rotation, and click-and-drag
 * spin with momentum. Built on plain Three.js (no @react-three/fiber or
 * drei) for maximum compatibility with Framer's bundler.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function RotatingLogo3D(props) {
    const {
        logo = {},
        material = {},
        lighting = {},
        animation = {},
        shadow = {},
        camera: cameraSettings = {},
        style,
    } = props

    const {
        customSvg,
        depth = 6,
        bevelSize = 0.4,
        bevelSegments = 6,
        curveSegments = 24,
    } = logo

    const {
        colorBottom = "#8962FF",
        colorTop = "#FFFFFF",
        gradientAngle = 0,
        metalness = 0.94,
        roughness = 0.68,
        clearcoat = 1,
        clearcoatRoughness = 0.08,
    } = material

    const {
        envMapIntensity = 2.2,
        envBlur = 0.05,
        ambientIntensity = 0.25,
        lightIntensity = 3,
    } = lighting

    const {
        rotationSpeed = 0.35,
        tiltX = -10,
        tiltY = 25,
        tiltZ = -8,
        enableDragSpin = true,
    } = animation

    const {
        showShadow = true,
        shadowOpacity = 0.45,
        shadowGap = 1.8,
        shadowBlur = 1.6,
    } = shadow

    const { cameraDistance = 46 } = cameraSettings

    const containerRef = useRef(null)
    const [isClient, setIsClient] = useState(false)
    const [svgMarkup, setSvgMarkup] = useState(DEFAULT_LOGO_SVG)

    // True whenever Framer is producing a non-interactive, static render of
    // this component — an unfocused canvas thumbnail, an image/PDF export,
    // print, etc. — as opposed to the live, interactive preview/published
    // site. The continuous WebGL animation loop below must not run here.
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        setIsClient(true)
    }, [])

    // Framer's File control only ever gives back a URL, not the SVG's own
    // markup — fetch and read it as text. Falls back to the built-in logo on
    // any failure (network error, non-SVG file, empty response, etc.).
    useEffect(() => {
        let cancelled = false
        if (!customSvg) {
            setSvgMarkup(DEFAULT_LOGO_SVG)
            return
        }
        fetch(customSvg)
            .then((res) => {
                if (!res.ok)
                    throw new Error(`Failed to fetch SVG (${res.status})`)
                return res.text()
            })
            .then((text) => {
                if (!cancelled && text && text.includes("<svg")) {
                    setSvgMarkup(text)
                } else if (!cancelled) {
                    console.warn(
                        "RotatingLogo3D: uploaded file doesn't look like a valid SVG, using default logo."
                    )
                    setSvgMarkup(DEFAULT_LOGO_SVG)
                }
            })
            .catch((err) => {
                console.warn(
                    "RotatingLogo3D: failed to load custom SVG, using default logo.",
                    err
                )
                if (!cancelled) setSvgMarkup(DEFAULT_LOGO_SVG)
            })
        return () => {
            cancelled = true
        }
    }, [customSvg])

    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas

    // The render loop below is set up once per "rebuild". It reads
    // rotationSpeed / isOnCanvas live through this ref so those two props
    // don't need to trigger a full scene teardown+rebuild every frame.
    const liveProps = useRef({ rotationSpeed, isOnCanvas })
    liveProps.current = { rotationSpeed, isOnCanvas }

    useEffect(() => {
        if (!isClient) return
        const container = containerRef.current
        if (!container) return

        const width = container.clientWidth || 400
        const height = container.clientHeight || 400

        // Base vertical FOV is tuned for a roughly square frame. A
        // PerspectiveCamera's fov is its VERTICAL field of view — on a
        // narrow/tall (portrait, e.g. mobile) frame, keeping it fixed would
        // shrink the HORIZONTAL view and crop the sides of the logo. Widening
        // the vertical FOV on narrow frames keeps the same horizontal extent
        // a square frame would show, so nothing gets clipped.
        const BASE_FOV = 32
        function verticalFovForAspect(aspect) {
            if (aspect >= 1) return BASE_FOV
            const halfWidthAtBase = Math.tan(
                THREE.MathUtils.degToRad(BASE_FOV / 2)
            )
            const neededHalfHeight = halfWidthAtBase / aspect
            return THREE.MathUtils.radToDeg(Math.atan(neededHalfHeight) * 2)
        }

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(
            verticalFovForAspect(width / height),
            width / height,
            0.1,
            150
        )
        camera.position.set(0, 0, cameraDistance)

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setSize(width, height)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        container.appendChild(renderer.domElement)

        // Environment map for PBR reflections. A lower blur value here keeps
        // the panel edges crisp instead of blurring everything into one flat
        // average — that crispness is what reads as "chrome" rather than
        // "soft plastic".
        const pmrem = new THREE.PMREMGenerator(renderer)
        const envRenderTarget = pmrem.fromScene(
            createStudioEnvironment(),
            envBlur
        )
        scene.environment = envRenderTarget.texture

        // Kept deliberately dim: a bright ambient term is exactly what
        // flattens contrast and washes the gradient/reflections into a
        // pastel look. Most of the light should come from the directional
        // key light and the environment panels, not flat ambient fill.
        const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity)
        const directional = new THREE.DirectionalLight(0xffffff, lightIntensity)
        directional.position.set(4, 10, 8)
        scene.add(ambient, directional)

        const geometries = buildGeometries(
            svgMarkup,
            depth,
            bevelSize,
            bevelSegments,
            curveSegments
        )
        applyGradientColors(geometries, colorBottom, colorTop, gradientAngle)

        const physicalMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, // white so the baked vertex-color gradient shows true-to-value
            vertexColors: true,
            metalness,
            roughness,
            envMapIntensity,
            // A strong, sharp clearcoat produces a tight bright specular
            // highlight streak — the base metal roughness alone only gives a
            // broad, soft highlight.
            clearcoat,
            clearcoatRoughness,
            ior: 1.5,
        })

        const group = new THREE.Group()
        // Base tilt, adjustable via the Tilt X/Y/Z controls. Only Y keeps
        // animating (auto-rotate).
        group.rotation.set(
            THREE.MathUtils.degToRad(tiltX),
            THREE.MathUtils.degToRad(tiltY),
            THREE.MathUtils.degToRad(tiltZ)
        )
        geometries.forEach((geo) => {
            group.add(new THREE.Mesh(geo, physicalMaterial))
        })
        scene.add(group)

        let shadowRig = null
        if (showShadow) {
            shadowRig = createContactShadowRig(geometries, group.rotation)
            shadowRig.plane.material.uniforms.uOpacity.value = shadowOpacity
            shadowRig.plane.material.uniforms.uBlurRadius.value = shadowBlur
            scene.add(shadowRig.plane)

            // Frame the camera on the midpoint between the object's center
            // and the shadow floor, instead of just the object's center, so
            // the shadow has headroom to stay inside the frame too. Uses the
            // logo's actual top/bottom extent (not an assumed symmetry
            // around its own y=0 center) since tilting an asymmetric shape
            // doesn't keep it symmetric top-to-bottom.
            const verticalCenter =
                (shadowRig.ceilingY + (shadowRig.floorY - shadowGap)) / 2
            camera.position.y = verticalCenter
            camera.lookAt(0, verticalCenter, 0)
        }

        // -----------------------------------------------------------------
        // Drag-to-spin: dragging directly rotates the logo under the
        // pointer. On release, the drag's exit velocity becomes a "fling"
        // added on top of the normal auto-rotate speed, then decays
        // (exponential damping) back down to just the base rotation —
        // exactly like flicking a coin or a globe. Disabled entirely in the
        // static-rendering case below, since there is no ongoing render
        // loop there to reflect any dragging back to the screen.
        // -----------------------------------------------------------------
        const DRAG_SENSITIVITY = 0.008 // radians of spin per pixel dragged
        const FLING_DAMPING = 2.6 // higher = fling settles back to normal sooner
        const MAX_FLING_VELOCITY = 20 // rad/s cap so a hard flick can't spin absurdly fast

        const interaction = {
            isDragging: false,
            pointerId: null,
            lastX: 0,
            lastTime: 0,
            velocity: 0,
        }
        let flingVelocity = 0

        function onPointerDown(e) {
            if (liveProps.current.isOnCanvas) return
            interaction.isDragging = true
            interaction.pointerId = e.pointerId
            interaction.lastX = e.clientX
            interaction.lastTime = performance.now()
            interaction.velocity = 0
            flingVelocity = 0
            container.style.cursor = "grabbing"
            container.setPointerCapture(e.pointerId)
        }

        function onPointerMove(e) {
            if (
                !interaction.isDragging ||
                e.pointerId !== interaction.pointerId
            )
                return
            const now = performance.now()
            const dt = Math.max(now - interaction.lastTime, 1) / 1000
            const dx = e.clientX - interaction.lastX
            const dRot = dx * DRAG_SENSITIVITY
            group.rotation.y += dRot
            const instantVelocity = dRot / dt
            // Smoothed so the release velocity isn't dictated by one jittery
            // final pointer event.
            interaction.velocity =
                interaction.velocity * 0.7 + instantVelocity * 0.3
            interaction.lastX = e.clientX
            interaction.lastTime = now
        }

        function endDrag(e) {
            if (interaction.pointerId !== e.pointerId) return
            interaction.isDragging = false
            interaction.pointerId = null
            flingVelocity = THREE.MathUtils.clamp(
                interaction.velocity,
                -MAX_FLING_VELOCITY,
                MAX_FLING_VELOCITY
            )
            container.style.cursor = "grab"
        }

        if (enableDragSpin && !isStatic) {
            container.style.cursor = "grab"
            container.style.touchAction = "none"
            container.addEventListener("pointerdown", onPointerDown)
            container.addEventListener("pointermove", onPointerMove)
            container.addEventListener("pointerup", endDrag)
            container.addEventListener("pointercancel", endDrag)
        }

        let animationId = null
        let disposed = false
        let visibilityObserver = null

        // Renders exactly one frame, including one shadow pass so the logo
        // isn't shadowless in a single-frame (static) render.
        function renderOnce() {
            if (shadowRig) shadowRig.update(renderer, group.rotation, shadowGap)
            renderer.render(scene, camera)
        }

        if (isStatic) {
            // Static rendering context (unfocused canvas thumbnail, image
            // export, PDF/print, etc.): render exactly one frame and stop —
            // no requestAnimationFrame loop, no rotation, no per-frame
            // shadow re-render. This is the WebGL work Framer's review
            // flagged as running outside of live/interactive rendering.
            renderOnce()
        } else {
            const renderLoop = () => {
                if (disposed) return
                const { rotationSpeed: speed, isOnCanvas: onCanvas } =
                    liveProps.current
                const dt = 0.016
                if (!interaction.isDragging) {
                    group.rotation.y +=
                        (onCanvas ? 0 : speed + flingVelocity) * dt
                    flingVelocity *= Math.exp(-FLING_DAMPING * dt)
                    if (Math.abs(flingVelocity) < 0.001) flingVelocity = 0
                }
                renderOnce()
                animationId = requestAnimationFrame(renderLoop)
            }

            const startLoop = () => {
                if (disposed || animationId !== null) return
                animationId = requestAnimationFrame(renderLoop)
            }
            const stopLoop = () => {
                if (animationId !== null) {
                    cancelAnimationFrame(animationId)
                    animationId = null
                }
            }

            // Render one frame immediately so there's no blank flash before
            // the IntersectionObserver's first callback arrives (it fires
            // asynchronously, not synchronously on `.observe()`).
            renderOnce()

            // Pause the whole rAF loop — no rotation update, no shadow
            // re-render, no renderer.render() call — while the component is
            // scrolled out of the viewport, and resume exactly where it left
            // off once it's visible again. Same viewport-based
            // IntersectionObserver approach as scroll-triggered animations
            // elsewhere in this codebase; { threshold: 0 } means "any pixel
            // on screen counts as visible".
            visibilityObserver = new IntersectionObserver(
                (entries) => {
                    const entry = entries[entries.length - 1]
                    if (entry.isIntersecting) startLoop()
                    else stopLoop()
                },
                { threshold: 0 }
            )
            visibilityObserver.observe(container)
        }

        const resizeObserver = new ResizeObserver(() => {
            const w = container.clientWidth
            const h = container.clientHeight
            if (!w || !h) return
            const aspect = w / h
            camera.aspect = aspect
            camera.fov = verticalFovForAspect(aspect)
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
            // The live loop above picks up the new size on its very next
            // frame automatically once running; the static case (and the
            // live case while paused off-screen) has no loop ticking, so the
            // single current frame has to be re-rendered explicitly here.
            if (isStatic || animationId === null) renderOnce()
        })
        resizeObserver.observe(container)

        return () => {
            disposed = true
            if (animationId !== null) cancelAnimationFrame(animationId)
            if (visibilityObserver) visibilityObserver.disconnect()
            resizeObserver.disconnect()

            if (enableDragSpin && !isStatic) {
                container.removeEventListener("pointerdown", onPointerDown)
                container.removeEventListener("pointermove", onPointerMove)
                container.removeEventListener("pointerup", endDrag)
                container.removeEventListener("pointercancel", endDrag)
                container.style.cursor = ""
                container.style.touchAction = ""
            }

            geometries.forEach((g) => g.dispose())
            physicalMaterial.dispose()
            if (shadowRig) shadowRig.dispose()
            envRenderTarget.texture.dispose()
            pmrem.dispose()
            renderer.dispose()
            if (renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement)
            }
        }
        // rotationSpeed / isOnCanvas are read live via `liveProps`, so they are
        // intentionally excluded here — everything else (including isStatic)
        // rebuilds the scene, since transitioning in/out of a static render
        // is rare and cleanly tearing down + rebuilding is the simplest way
        // to guarantee the rAF loop is fully stopped/started correctly.
    }, [
        isClient,
        isStatic,
        svgMarkup,
        colorBottom,
        colorTop,
        gradientAngle,
        metalness,
        roughness,
        depth,
        bevelSize,
        bevelSegments,
        curveSegments,
        envMapIntensity,
        envBlur,
        ambientIntensity,
        lightIntensity,
        clearcoat,
        clearcoatRoughness,
        enableDragSpin,
        tiltX,
        tiltY,
        tiltZ,
        showShadow,
        shadowOpacity,
        shadowGap,
        shadowBlur,
        cameraDistance,
    ])

    if (!isClient) {
        // SSR-safe fallback — WebGL/Canvas is client-only.
        return <div style={{ ...style, background: "transparent" }} />
    }

    return (
        <div
            ref={containerRef}
            style={{ ...style, background: "transparent", overflow: "hidden" }}
        />
    )
}

RotatingLogo3D.defaultProps = {
    logo: {
        depth: 4.6,
        bevelSize: 0.4,
        bevelSegments: 6,
        curveSegments: 24,
    },
    material: {
        colorBottom: "#8962FF",
        colorTop: "#ABA3C4",
        gradientAngle: 0,
        metalness: 0.72,
        roughness: 0.8,
        clearcoat: 0.55,
        clearcoatRoughness: 0.5,
    },
    lighting: {
        envMapIntensity: 2.2,
        envBlur: 0.05,
        ambientIntensity: 0.25,
        lightIntensity: 3,
    },
    animation: {
        rotationSpeed: 0.8,
        tiltX: -10,
        tiltY: 25,
        tiltZ: -8,
        enableDragSpin: true,
    },
    shadow: {
        showShadow: true,
        shadowOpacity: 0.05,
        shadowGap: 0.6,
        shadowBlur: 3.3,
    },
    camera: {
        cameraDistance: 38,
    },
}

addPropertyControls(RotatingLogo3D, {
    logo: {
        type: ControlType.Object,
        title: "Logo",
        icon: "object",
        controls: {
            customSvg: {
                type: ControlType.File,
                title: "Custom SVG",
                allowedFileTypes: ["svg"],
                description:
                    "Upload any single-color SVG logo. Leave empty to use the default logo.",
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                min: 0.5,
                max: 20,
                step: 0.1,
                defaultValue: 4.6,
                description:
                    "How thick the logo is extruded in 3D, front to back.",
            },
            bevelSize: {
                type: ControlType.Number,
                title: "Bevel Size",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 0.4,
                description:
                    'Rounds the edges instead of leaving them razor-sharp — bigger values read as more "soft plastic", smaller as more "cut metal".',
            },
            bevelSegments: {
                type: ControlType.Number,
                title: "Bevel Smoothness",
                min: 1,
                max: 12,
                step: 1,
                defaultValue: 6,
                description:
                    "More segments = smoother rounded edges, at a small performance cost. Raise this if Bevel Size looks faceted.",
            },
            curveSegments: {
                type: ControlType.Number,
                title: "Curve Smoothness",
                min: 4,
                max: 48,
                step: 1,
                defaultValue: 24,
                description:
                    "How finely curved parts of your SVG are subdivided. Raise this for logos with large smooth curves; lower it for angular logos to save performance.",
            },
        },
    },
    material: {
        type: ControlType.Object,
        title: "Color & Material",
        icon: "color",
        controls: {
            colorBottom: {
                type: ControlType.Color,
                title: "Bottom Color",
                defaultValue: "#8962FF",
            },
            colorTop: {
                type: ControlType.Color,
                title: "Top Color",
                defaultValue: "#ABA3C4",
            },
            gradientAngle: {
                type: ControlType.Number,
                title: "Gradient Angle",
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
                defaultValue: 0,
                description:
                    "Rotates the direction the color gradient runs across the logo (0° = bottom to top). The gradient is baked into the logo, so it spins together with it.",
            },
            metalness: {
                type: ControlType.Number,
                title: "Metalness",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.72,
                description:
                    '0 = plain matte plastic, 1 = fully reflective metal. Most of the "chrome" look comes from this being high.',
            },
            roughness: {
                type: ControlType.Number,
                title: "Roughness",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.8,
                description:
                    "0 = mirror-smooth reflections, 1 = frosted/matte. Works together with Metalness.",
            },
            clearcoat: {
                type: ControlType.Number,
                title: "Clearcoat",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.55,
                description:
                    'Adds a thin glossy "lacquer" layer on top of the metal, producing a tight bright highlight streak. Set to 0 to remove it.',
            },
            clearcoatRoughness: {
                type: ControlType.Number,
                title: "Highlight Sharpness",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.5,
                description:
                    "Only affects the Clearcoat layer above. Lower = tighter, brighter highlight; higher = softer, broader glow.",
            },
        },
    },
    lighting: {
        type: ControlType.Object,
        title: "Lighting",
        icon: "effect",
        controls: {
            envMapIntensity: {
                type: ControlType.Number,
                title: "Reflection Intensity",
                min: 0,
                max: 4,
                step: 0.1,
                defaultValue: 2.2,
                description:
                    "How strongly the studio lighting reflects off the metal. Higher makes it look shinier and more contrasty.",
            },
            envBlur: {
                type: ControlType.Number,
                title: "Reflection Blur",
                min: 0,
                max: 0.3,
                step: 0.01,
                defaultValue: 0.05,
                description:
                    "Sharper (lower) reads as polished chrome; blurrier (higher) reads as soft brushed metal or plastic.",
            },
            ambientIntensity: {
                type: ControlType.Number,
                title: "Ambient Light",
                min: 0,
                max: 1.5,
                step: 0.05,
                defaultValue: 0.25,
                description:
                    "Flat fill light from every direction. Keep this low — too much washes out contrast and flattens the gradient/reflections.",
            },
            lightIntensity: {
                type: ControlType.Number,
                title: "Key Light Intensity",
                min: 0,
                max: 6,
                step: 0.1,
                defaultValue: 3,
                description:
                    "Brightness of the main directional light, the source of the strongest highlight.",
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        icon: "interaction",
        controls: {
            rotationSpeed: {
                type: ControlType.Number,
                title: "Rotation Speed",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 0.8,
                unit: "rad/s",
            },
            tiltX: {
                type: ControlType.Number,
                title: "Tilt X",
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
                defaultValue: -10,
                description:
                    "Fixed pitch tilt of the logo — it keeps spinning around this base orientation.",
            },
            tiltY: {
                type: ControlType.Number,
                title: "Tilt Y",
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
                defaultValue: 25,
                description:
                    "Fixed yaw tilt — the starting angle of the auto-rotation.",
            },
            tiltZ: {
                type: ControlType.Number,
                title: "Tilt Z (Roll)",
                min: -180,
                max: 180,
                step: 1,
                unit: "°",
                defaultValue: -8,
                description:
                    "Fixed roll — use this to stand the logo upright or lay it on its side.",
            },
            enableDragSpin: {
                type: ControlType.Boolean,
                title: "Drag to Spin",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    'Lets visitors click/tap and drag the logo to spin it — releasing gives it a momentum "fling" that settles back into the normal auto-rotation.',
            },
        },
    },
    shadow: {
        type: ControlType.Object,
        title: "Shadow",
        icon: "boolean",
        controls: {
            showShadow: {
                type: ControlType.Boolean,
                title: "Enable Shadow",
                defaultValue: true,
            },
            shadowOpacity: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.05,
                hidden: (props) => !props.showShadow,
                description:
                    "Darkness of the shadow. The shadow is a real-time render of the logo's silhouette, so it always matches its current shape and size as it spins.",
            },
            shadowGap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 8,
                step: 0.1,
                defaultValue: 0.6,
                hidden: (props) => !props.showShadow,
                description:
                    'How far below the logo the shadow sits — bigger values make the logo read as "floating" higher above the ground.',
            },
            shadowBlur: {
                type: ControlType.Number,
                title: "Blur",
                min: 0,
                max: 4,
                step: 0.1,
                defaultValue: 3.3,
                hidden: (props) => !props.showShadow,
                description:
                    "Softens the shadow's edge. 0 gives a hard-edged silhouette.",
            },
        },
    },
    camera: {
        type: ControlType.Object,
        title: "Camera",
        icon: "object",
        description:
            "Component created by [kobielakdesign](https://www.framer.com/%40kobielakdesign/)",
        controls: {
            cameraDistance: {
                type: ControlType.Number,
                title: "Distance (Zoom)",
                min: 20,
                max: 100,
                step: 1,
                defaultValue: 38,
                description:
                    "How far back the camera sits. Increase this if the logo or its shadow gets clipped by the frame after changing Depth, Bevel, or Shadow Gap.",
            },
        },
    },
})
