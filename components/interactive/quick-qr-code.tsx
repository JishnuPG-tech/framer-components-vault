import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import QRCodeLib from "qrcode"

// -----------------------------------------------------------------------------
// Default logo SVG -> data URL
// -----------------------------------------------------------------------------

const FRAMER_LOGO_SVG = `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Uploaded to: SVG Repo, www.svgrepo.com, Transformed by: SVG Repo Mixer Tools -->
<svg fill="#ffffff" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg">
  <g id="SVGRepo_bgCarrier" stroke-width="0"/>
  <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
  <g id="SVGRepo_iconCarrier">
    <path d="M200,108H148.12207l57.37109,54.18408A8,8,0,0,1,200,176H136v60a8,8,0,0,1-13.49316,5.81592l-72-68A7.99941,7.99941,0,0,1,48,168V100a8.00008,8.00008,0,0,1,8-8h51.87793L50.50684,37.81592A8,8,0,0,1,56,24H200a8.00008,8.00008,0,0,1,8,8v68A8.00008,8.00008,0,0,1,200,108Z"/>
  </g>
</svg>`

const DEFAULT_LOGO_SRC =
    "data:image/svg+xml;utf8," + encodeURIComponent(FRAMER_LOGO_SVG)

// -----------------------------------------------------------------------------
// Types & helpers
// -----------------------------------------------------------------------------

type LogoProp = {
    src: string
    alt?: string
}

type QRCodeProps = {
    data?: string
    foregroundColor?: string
    backgroundColor?: string
    logo?: LogoProp | string
    logoSize?: number
    logoBorderWidth?: number // padding around logo
    logoBorderRadius?: number // radius for logo AND its background
    logoBackgroundColor?: string
    showLogo?: boolean // toggle logo visibility
    style?: React.CSSProperties
    // Forward id, data-*, onClick, etc.
    [key: string]: any
}

function normalizeLogo(raw: QRCodeProps["logo"]): LogoProp | undefined {
    if (!raw) return undefined
    if (typeof raw === "string") return { src: raw, alt: "Framer Logo" }
    if (typeof raw === "object" && raw.src) {
        return { src: raw.src, alt: raw.alt || "Framer Logo" }
    }
    return undefined
}

// Creates a rounded-rect path (no fill)
function roundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2))

    ctx.beginPath()
    if (radius <= 0) {
        ctx.rect(x, y, w, h)
    } else {
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + w - radius, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
        ctx.lineTo(x + w, y + h - radius)
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
        ctx.lineTo(x + radius, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
    }
    ctx.closePath()
}

/**
 * @framerDisableUnlink
 */

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function QRCode(props: QRCodeProps) {
    const {
        data = "https://framer.com",
        foregroundColor = "#000000",
        backgroundColor = "#FFFFFF",
        logo = { src: DEFAULT_LOGO_SRC, alt: "Framer Logo" },
        logoSize = 20,
        logoBorderWidth = 8, // padding
        logoBorderRadius = 0, // radius for both border + logo
        logoBackgroundColor = "#000000",
        showLogo = true,
        style,
        ...rest
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const [size, setSize] = useState({ width: 0, height: 0 })

    // Measure container size (integer CSS pixels)
    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return

        const updateSize = () => {
            const w = Math.max(1, Math.floor(el.clientWidth))
            const h = Math.max(1, Math.floor(el.clientHeight))
            setSize((prev) =>
                prev.width === w && prev.height === h
                    ? prev
                    : { width: w, height: h }
            )
        }

        updateSize()

        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(updateSize)
            ro.observe(el)
            return () => ro.disconnect()
        } else {
            window.addEventListener("resize", updateSize)
            return () => window.removeEventListener("resize", updateSize)
        }
    }, [])

    // Draw QR + logo
    useEffect(() => {
        const canvas = canvasRef.current
        const { width, height } = size
        if (!canvas || !width || !height) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr =
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

        // HiDPI canvas setup
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = width + "px"
        canvas.style.height = height + "px"
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        // Background
        ctx.imageSmoothingEnabled = false
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)

        // Generate QR
        let qr
        try {
            qr = QRCodeLib.create(data || " ", {
                errorCorrectionLevel: "H",
            } as any)
        } catch {
            return
        }

        const moduleCount: number = qr.modules.size
        const dataFlat: any = qr.modules.data

        // Determine which modules are dark, using official API when possible
        const isDark = (row: number, col: number) => {
            if (typeof (qr as any).isDark === "function") {
                return (qr as any).isDark(row, col)
            }
            if (qr.modules && typeof qr.modules.get === "function") {
                return qr.modules.get(row, col)
            }
            const index = row * moduleCount + col
            return Boolean(dataFlat[index])
        }

        // ---------------------------------------------------------------------
        // Module geometry – make QR fill the available square (no extra border)
        // ---------------------------------------------------------------------
        const qrSize = Math.min(width, height) // fully use the square
        const moduleSize = qrSize / moduleCount // may be fractional
        const offsetX = (width - qrSize) / 2
        const offsetY = (height - qrSize) / 2

        // Small overlap to avoid grey seams between modules
        const fudge = 0.6

        ctx.beginPath()
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (!isDark(row, col)) continue
                const x = offsetX + col * moduleSize
                const y = offsetY + row * moduleSize
                ctx.rect(
                    x - fudge,
                    y - fudge,
                    moduleSize + 2 * fudge,
                    moduleSize + 2 * fudge
                )
            }
        }
        ctx.fillStyle = foregroundColor
        ctx.fill()

        // ---------------------------------------------------------------------
        // Centered logo + rounded background
        // ---------------------------------------------------------------------
        if (!showLogo) {
            // No logo at all
            return
        }

        const normalizedLogo = normalizeLogo(logo) || {
            src: DEFAULT_LOGO_SRC,
            alt: "Framer Logo",
        }
        const logoSrc = normalizedLogo.src
        const logoAlt = normalizedLogo.alt

        if (!logoSrc) return

        const baseSize = qrSize

        // Snap logo size & position to whole pixels to avoid blur from sub-pixel placement
        const logoSizePx = Math.max(20, (baseSize * logoSize) / 100)
        const logoSizePxRounded = Math.round(logoSizePx)

        const logoX = Math.round((width - logoSizePxRounded) / 2)
        const logoY = Math.round((height - logoSizePxRounded) / 2)
        const padding = Math.max(0, logoBorderWidth)

        const bgSize = logoSizePxRounded + padding * 2
        const bgX = logoX - padding
        const bgY = logoY - padding

        // Rounded background (border/padding) with same radius as logo
        if (padding > 0) {
            ctx.fillStyle = logoBackgroundColor || backgroundColor
            roundedRectPath(ctx, bgX, bgY, bgSize, bgSize, logoBorderRadius)
            ctx.fill()
        }

        let cancelled = false
        const img = new Image()
        img.src = logoSrc
        if (logoAlt) {
            // @ts-ignore alt exists at runtime even if not in TS lib
            img.alt = logoAlt
        }

        img.onload = () => {
            if (cancelled) return
            const ctx2 = canvas.getContext("2d")
            if (!ctx2) return

            ctx2.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx2.imageSmoothingEnabled = true
            // @ts-ignore older browsers may ignore this
            ctx2.imageSmoothingQuality = "high"

            // Ensure rounded border is present (same color as background)
            if (padding > 0) {
                ctx2.fillStyle = logoBackgroundColor || backgroundColor
                roundedRectPath(
                    ctx2,
                    bgX,
                    bgY,
                    bgSize,
                    bgSize,
                    logoBorderRadius
                )
                ctx2.fill()
            }

            // Clip logo itself to the same radius (inner rect)
            ctx2.save()
            roundedRectPath(
                ctx2,
                logoX,
                logoY,
                logoSizePxRounded,
                logoSizePxRounded,
                logoBorderRadius
            )
            ctx2.clip()

            ctx2.drawImage(
                img,
                logoX,
                logoY,
                logoSizePxRounded,
                logoSizePxRounded
            )
            ctx2.restore()
        }

        img.onerror = () => {
            // Ignore logo load errors
        }

        return () => {
            cancelled = true
        }
    }, [
        data,
        foregroundColor,
        backgroundColor,
        logo,
        logoSize,
        logoBorderWidth,
        logoBorderRadius,
        logoBackgroundColor,
        showLogo,
        size.width,
        size.height,
    ])

    return (
        <div
            ref={containerRef}
            {...rest}
            style={{
                position: "relative",
                width: "250px",
                height: "250px",
                minWidth: 100, // at least 100px
                minHeight: 100, // at least 100px
                boxSizing: "border-box",
                overflow: "hidden",
                backgroundColor,
                border: "none", // make sure no CSS border
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    border: "none", // no border on canvas
                }}
            />
        </div>
    )
}

// -----------------------------------------------------------------------------
// Default canvas size in Framer (make frame square by default)
// -----------------------------------------------------------------------------

;(QRCode as any).defaultProps = {
    width: 200,
    height: 200,
}

// -----------------------------------------------------------------------------
// Framer property controls
// -----------------------------------------------------------------------------

addPropertyControls(QRCode, {
    data: {
        type: ControlType.String,
        title: "Text/URL",
        defaultValue: "https://framer.com",
        displayTextArea: true,
    },
    foregroundColor: {
        type: ControlType.Color,
        title: "QR Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF",
    },
    showLogo: {
        type: ControlType.Boolean,
        title: "Show Logo",
        defaultValue: true,
    },
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
        description: "Upload 250x250 size image",
        defaultValue: { src: DEFAULT_LOGO_SRC } as any,
        hidden: (props: any) => props.showLogo === false,
    } as any,
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        min: 10,
        max: 30,
        defaultValue: 20,
        displayStepper: true,
        hidden: (props: any) => props.showLogo === false,
    },
    logoBackgroundColor: {
        type: ControlType.Color,
        title: "Logo Background",
        defaultValue: "#000000",
        hidden: (props: any) =>
            props.showLogo === false || (props.logoBorderWidth ?? 0) <= 0,
    },
    logoBorderRadius: {
        type: ControlType.Number,
        title: "Logo Border Radius",
        min: 0,
        max: 64,
        defaultValue: 12,
        displayStepper: true,
        hidden: (props: any) => props.showLogo === false,
    },
    logoBorderWidth: {
        type: ControlType.Number,
        title: "Padding",
        description: "by [FramerGeeks](https://www.framergeeks.com)",
        min: 0,
        max: 40,
        defaultValue: 8,
        displayStepper: true,
        hidden: (props: any) => props.showLogo === false,
    },
})
