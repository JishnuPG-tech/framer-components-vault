// Image to ASCII Reusable Component
// @framerSupportedLayoutWidth any-prefer-fixed
// @framerSupportedLayoutHeight auto
import { useRef, useEffect, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const defaultImage = {
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "Gradient 1 - Blue"
}

const ASCII_CHARS = "@%#*+=-:. " // darkest to lightest

function imageToAscii(img, width, height, asciiChars = ASCII_CHARS, exposure = 0, contrast = 0, shadows = 0) {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0, width, height)
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = imgData.data

    // Apply exposure/contrast/shadows
    for (let i = 0; i < data.length; i += 4) {
        // calculate average/lightness
        let r = data[i], g = data[i + 1], b = data[i + 2]
        // Exposure shift
        r += exposure
        g += exposure
        b += exposure
        // Clamp 0-255
        r = Math.max(0, Math.min(255, r))
        g = Math.max(0, Math.min(255, g))
        b = Math.max(0, Math.min(255, b))
        // Contrast (formula: (pixel - 128) * c + 128)
        if (contrast !== 0) {
            let c = (contrast/255 + 1)
            r = (r - 128) * c + 128
            g = (g - 128) * c + 128
            b = (b - 128) * c + 128
        }
        // Shadows (lift dark pixels)
        if (shadows !== 0) {
            let intensity = (r + g + b) / 3
            if (intensity < 128) {
                r += shadows * 0.6
                g += shadows * 0.6
                b += shadows * 0.6
            }
        }
        // Clamp again
        data[i] = Math.max(0, Math.min(255, r))
        data[i + 1] = Math.max(0, Math.min(255, g))
        data[i + 2] = Math.max(0, Math.min(255, b))
    }
    ctx.putImageData(imgData, 0, 0)
    let ascii = ""
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let off = (y * width + x) * 4
            let r = data[off], g = data[off + 1], b = data[off + 2]
            let brightness = 0.2126*r + 0.7152*g + 0.0722*b
            let charIdx = Math.floor((brightness / 255) * (asciiChars.length - 1))
            ascii += asciiChars[charIdx]
        }
        ascii += "\n"
    }
    return ascii
}

/**
 * Image to ASCII
 *
 * Component for Framer that converts an image to ASCII art.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ImageToASCII(props) {
    const isStatic = useIsStaticRenderer()
    const {
        image = defaultImage,
        density = 70,
        exposure = 0,
        contrast = 0,
        shadows = 0,
        bgColor = "#fff",
        textColor = "#000",
        style,
        customChars = "",
        glyphDrift = false, // added
    } = props
    const [ascii, setAscii] = useState("")
    const [imgRatio, setImgRatio] = useState(1)
    const rootRef = useRef(null)

    // Overlay emboss layers: for emboss effect (3 overlays)
    // Persist same random mask for same ascii & same randomizer
    const [overlaySeeds, setOverlaySeeds] = useState([0, 1, 2])
    useEffect(() => {
        setOverlaySeeds([
            Math.floor(12345 + (props.randomizer || 0) * 197),
            Math.floor(54321 + (props.randomizer || 0) * 313),
            Math.floor(23167 + (props.randomizer || 0) * 47)
        ])
    }, [props.randomizer])

    // Drift state for glyph drift mode
    const [driftTick, setDriftTick] = useState(0)
    useEffect(() => {
        if (!glyphDrift) return
        let animating = true
        let rafID
        let last = Date.now()
        function animate() {
            if (!animating) return
            // Subtle per-frame, slow
            rafID = requestAnimationFrame(animate)
            if (Date.now() - last > 60) { // ~16 FPS, enough for living look
                startTransition(() => setDriftTick(t => t+1))
                last = Date.now()
            }
        }
        animate()
        return () => {
            animating = false
            if (rafID) cancelAnimationFrame(rafID)
        }
    }, [glyphDrift])

    // Define cluster model for spatial Randomizer emboss regions
    function getEmbossClusters(randomizer, charW, charH, layerSeed) {
        // Use true noise-like mask: no geometric shapes/sizes, no clusters/ellipses/voronoi
        if (randomizer === 0) return []
        if (randomizer === 10) return [{ type: "all" }]
        // For organic/zoned noise: use seeded PRNG and per-character acceptance
        return [{ type: "mask", seed: layerSeed, prob: randomizer / 10 }]
    }

    // Determine the active character set reactively
    const activeAsciiChars = (customChars && customChars.length > 0)
        ? customChars
        : ASCII_CHARS

    // -------- Glyph Drift logic (main) --------
    // When glyphDrift is enabled, map brightness with indirection
    // Instead of direct mapping, remap brightness bins to alternate chars of similar bin/density
    function getDriftingAscii(asciiBase, asciiChars, indirection, driftTick) {
        if (!glyphDrift) return asciiBase
        // asciiBase is the exact ascii output, with chars selected from asciiChars by index to brightness
        // We need to pseudo-randomly swap brightness bins but preserve structure
        // We'll shuffle brightness-to-char index mapping subtly using driftTick, but keep structure
        const lines = asciiBase.split("\n")
        const charMap = asciiChars.split("")
        const numBins = charMap.length
        let newLines = []
        for (let y = 0; y < lines.length; ++y) {
          let line = lines[y]
          let newLine = ""
          for (let x = 0; x < line.length; ++x) {
            const ch = line[x]
            // If space, keep
            if (ch === " ") { newLine += ch; continue }
            // Which bin does this char correspond to?
            let baseIdx = charMap.indexOf(ch)
            // If not found (could be space or padding), fallback to original
            if (baseIdx < 0) {
              newLine += ch
              continue
            }
            // Drift: pick alt index for this bin, nearby bin
            // We'll use (x,y,driftTick,indirection) to get offset
            let driftSeed = x*8191 ^ y*3191 ^ driftTick*103 ^ indirection
            let driftOffset = Math.round(((Math.sin(driftSeed)+1)*99999)%1 * (numBins > 4 ? 2 : 1))
            let newIdx = (baseIdx + driftOffset) % numBins
            if (numBins > 8 && Math.abs(driftOffset) < 2) { // sometimes swap left
              if (((driftSeed)%4)==0) newIdx = (baseIdx-1+numBins)%numBins
            }
            newLine += charMap[newIdx]
          }
          newLines.push(newLine)
        }
        return newLines.join("\n")
    }

    // Generate ASCII on image, density, custom charset, AND glyph drift changes
    useEffect(() => {
        if (typeof window === "undefined" || !image?.src) return
        const imgEl = new window.Image()
        imgEl.crossOrigin = "Anonymous"
        imgEl.src = image.src
        imgEl.onload = () => {
            const iw = imgEl.naturalWidth
            const ih = imgEl.naturalHeight
            setImgRatio(iw && ih ? iw / ih : 1)
            // To preserve aspect ratio in characters
            let charW = Math.round(density)
            let charH = Math.round(charW / (iw / ih))
            charH = Math.round(charH * 0.5)
            charH = Math.max(2, charH)
            charW = Math.max(2, charW)
            if (charW > 150) charW = 150
            if (charH > 150) charH = 150
            const asciiStrBase = imageToAscii(imgEl, charW, charH, activeAsciiChars, exposure, contrast, shadows)
            if (glyphDrift) {
              // Drift: use tick as indirection, so we get continuous drifting
              startTransition(() => setAscii(getDriftingAscii(asciiStrBase, activeAsciiChars, driftTick, driftTick)))
            } else {
              startTransition(() => setAscii(asciiStrBase))
            }
        }
        // We want to update on every driftTick if glyphDrift is enabled
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image, density, exposure, contrast, shadows, activeAsciiChars, glyphDrift, driftTick])

    // Responsive width
    const realWidth = style && style.width && style.width !== "auto" ? style.width : "100%"
    
    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                width: realWidth,
                background: bgColor,
                padding: 16,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: 16,
                borderRadius: 0,
                position: "relative",
                // REMOVE any minHeight or fixed height here for perfect layout
                height: undefined,
                minHeight: 0,
                maxHeight: "none",
                overflow: "visible",
            }}
        >
            <img
                src={image.src}
                alt=""
                aria-hidden="true"
                style={{ display: "none" }}
                draggable={false}
            />
            <div
                style={{
                    width: "100%",
                    background: bgColor,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    boxSizing: "border-box",
                    userSelect: "text",
                    position: "relative"
                }}
            >
                {/* Overlay emboss layers */}
                {(props.randomizer > 0) && [0, 1, 2].slice(0, Math.ceil(props.randomizer/4+0.5)).map((i) => {
                    // slice: randomizer 1-4 -> 1 layer, 5-8 -> 2, 9-10 -> 3
                    const layerSeed = overlaySeeds[i] || 1337 + i
                    const chars = ascii.split("")
                    // Need to size clusters based on character grid
                    let charGridW = 0, charGridH = 0
                    if (ascii) {
                        let lines = ascii.split("\n")
                        charGridH = lines.length
                        charGridW = lines[0] ? lines[0].length : 0
                    }
                    // clusters = [{cx,cy,r:radius}, ...] spatial coverage
                    let clusters = getEmbossClusters(props.randomizer, charGridW, charGridH, layerSeed)
                    // Organic noise mask: per-character pseudo-random emboss selection
                    function perCharEmboss(x, y) {
                        if (props.randomizer === 10) return true
                        // Basic x/y/seed based hash
                        let s = layerSeed ^ (x * 73856093) ^ (y * 19349663)
                        s = (s * 9301 + 49297) % 233280
                        let rand01 = (Math.sin(s+1)*10000) % 1; rand01 = rand01 < 0 ? -rand01 : rand01
                        return rand01 < (props.randomizer/10)
                    }
                    // Emboss strength per layer, increase as randomizer increases
                    const layerStrength = props.randomizer * (0.7 + 0.3 * i)
                    const yOffset = Math.round(Math.max(1, Math.min(3, layerStrength + i)))
                    const shadowSpread = Math.max(0, 1 + Math.floor(layerStrength*0.62 + i))
                    const shadowY = yOffset+1 
                    // Opacity per layer
                    const alpha = 0.08 + 0.16*props.randomizer/10 + i*0.12
                    // Render ascii, but only chars inside clusters are kept, else replaced with space
                    let masked = ""
                    let idx = 0
                    let lineNo = 0, colNo = 0
                    let lines = ascii.split("\n")
                    for (lineNo=0; lineNo < lines.length; ++lineNo) {
                      for (colNo=0; colNo<lines[lineNo].length; ++colNo, ++idx) {
                        if (perCharEmboss(colNo, lineNo)) masked += lines[lineNo][colNo];
                        else masked += " ";
                      }
                      masked += "\n"
                    }
                    // emboss shadow: subtle multi-shadow for 3D effect
                    const shadow = `0 ${-yOffset}px 0 #fff, 0 ${shadowY}px ${shadowSpread}px rgba(80,80,80,.32)`
                    return (
                      <pre
                        key={"emboss-"+i}
                        aria-hidden="true"
                        style={{
                          pointerEvents: "none",
                          margin: 0,
                          fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          fontSize: 12,
                          color: textColor,
                          opacity: alpha,
                          fontWeight: props.asciiFontWeight || 400,
                          whiteSpace: "pre",
                          lineHeight: "1.1",
                          background: "none",
                          letterSpacing: "0",
                          textAlign: "left",
                          width: "100%",
                          overflowX: "auto",
                          overflowY: "hidden",
                          position: "absolute",
                          top: 0,
                          left: 0,
                          zIndex: 2 + i,
                          transform: `translateY(${-yOffset}px)` ,
                          textShadow: shadow,
                          userSelect: "none",
                        }}
                      >{masked}</pre>
                    )
                  })}
                {/* Glowy Text: layered soft text-shadow overlays when enabled */}
                {props.glowyText && (
                  <>
                    {/* Glow layer 1: [Inner Core Glow] Tight, high opacity, reinforces edges */}
                    <pre
                      aria-hidden="true"
                      style={{
                        pointerEvents: "none",
                        margin: 0,
                        fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontSize: 12,
                        color: props.textColor,
                        opacity: 0.48,
                        fontWeight: props.asciiFontWeight || 400,
                        whiteSpace: "pre",
                        lineHeight: "1.1",
                        background: "none",
                        letterSpacing: "0",
                        textAlign: "left",
                        width: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                        zIndex: 0,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        filter: "none",
                        textShadow:
                          `0 0 2px ${props.textColor}EE, 0 0 3px ${props.textColor}BB, 0 0 0.5px ${props.textColor}F5`,
                      }}
                    >{ascii}</pre>

                    {/* Glow layer 2: [Primary Bloom] Medium blur, moderate opacity, visible glow */}
                    <pre
                      aria-hidden="true"
                      style={{
                        pointerEvents: "none",
                        margin: 0,
                        fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontSize: 12,
                        color: props.textColor,
                        opacity: 0.26,
                        fontWeight: props.asciiFontWeight || 400,
                        whiteSpace: "pre",
                        lineHeight: "1.1",
                        background: "none",
                        letterSpacing: "0",
                        textAlign: "left",
                        width: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                        zIndex: 0,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        filter: "none",
                        textShadow:
                          `0 0 6px ${props.textColor}99, 0 0 12px ${props.textColor}55, 0 0 18px ${props.textColor}30`,
                      }}
                    >{ascii}</pre>

                    {/* Glow layer 3: [Secondary Bloom] Large blur, low-to-medium opacity, cluster light */}
                    <pre
                      aria-hidden="true"
                      style={{
                        pointerEvents: "none",
                        margin: 0,
                        fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontSize: 12,
                        color: props.textColor,
                        opacity: 0.14,
                        fontWeight: props.asciiFontWeight || 400,
                        whiteSpace: "pre",
                        lineHeight: "1.1",
                        background: "none",
                        letterSpacing: "0",
                        textAlign: "left",
                        width: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                        zIndex: 0,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        filter: "none",
                        textShadow:
                          `0 0 18px ${props.textColor}28, 0 0 38px ${props.textColor}10, 0 0 54px ${props.textColor}08`,
                      }}
                    >{ascii}</pre>

                    {/* Glow layer 4: [Ambient Spill] Very large blur, very low opacity, atmospheric spill */}
                    <pre
                      aria-hidden="true"
                      style={{
                        pointerEvents: "none",
                        margin: 0,
                        fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontSize: 12,
                        color: props.textColor,
                        opacity: 0.08,
                        fontWeight: props.asciiFontWeight || 400,
                        whiteSpace: "pre",
                        lineHeight: "1.1",
                        background: "none",
                        letterSpacing: "0",
                        textAlign: "left",
                        width: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                        zIndex: 0,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        filter: "none",
                        textShadow:
                          `0 0 42px ${props.textColor}09, 0 0 80px ${props.textColor}04, 0 0 120px ${props.textColor}02`,
                      }}
                    >{ascii}</pre>
                  </>
                )}
                  {/* Base ASCII layer (always visible) */}
                  <pre
                    style={{
                        margin: 0,
                        fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontSize: 12,
                        color: textColor,
                        whiteSpace: "pre",
                        lineHeight: "1.1",
                        background: "none",
                        letterSpacing: "0",
                        textAlign: "left",
                        width: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                        fontWeight: props.asciiFontWeight || 400,
                        zIndex: 1,
                        position: "relative"
                    }}
                >{ascii}</pre>
            </div>
        </div>
    )
}

addPropertyControls(ImageToASCII, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    density: {
        type: ControlType.Number,
        title: "Character Density",
        defaultValue: 70,
        min: 20,
        max: 120,
        step: 1,
        unit: "chars"
    },
    exposure: {
        type: ControlType.Number,
        title: "Exposure",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: "",
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: "",
    },
    shadows: {
        type: ControlType.Number,
        title: "Shadows",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: "",
    },
    bgColor: {
        type: ControlType.Enum,
        title: "Background Color",
        options: [
            "#171717", "#F6E800", "#F12786", "#F2D8A4", "#FF0E03",
            "#30D189", "#E6AA9F", "#0128EF", "#163B82", "#FBCA0A",
            "#266533", "#F6F4DC", "#F2F2F2", "#262424", "#EEE5DA"
        ],
        optionTitles: [
            "Void", "Punk", "Ratchet", "Dunes", "Alert",
            "Minty", "Rosie", "Bolt", "Navy", "JCB",
            "Basil", "Creme", "Off-white", "Coal", "Cloud9"
        ],
        defaultValue: "#fff"
    },
    textColor: {
        type: ControlType.Enum,
        title: "ASCII Text Color",
        options: [
            "#171717", "#F6E800", "#F12786", "#F2D8A4", "#FF0E03",
            "#30D189", "#E6AA9F", "#0128EF", "#163B82", "#FBCA0A",
            "#266533", "#F6F4DC", "#F2F2F2", "#262424", "#EEE5DA"
        ],
        optionTitles: [
            "Void", "Punk", "Ratchet", "Dunes", "Alert",
            "Minty", "Rosie", "Bolt", "Navy", "JCB",
            "Basil", "Creme", "Off-white", "Coal", "Cloud9"
        ],
        defaultValue: "#000"
    },
    asciiFontWeight: {
        type: ControlType.Enum,
        title: "ASCII Font Weight",
        options: [300, 400, 500, 600, 700],
        optionTitles: ["Light", "Regular", "Medium", "Semibold", "Bold"],
        defaultValue: 400,
        displaySegmentedControl: false,
        description: "Font weight for ASCII characters."
    },
    randomizer: {
        type: ControlType.Number,
        title: "Randomizer",
        min: 0,
        max: 10,
        defaultValue: 0,
        step: 0.01,
        unit: "",
        description: "Controls the 3D emboss randomness and intensity."
    },
    customChars: {
        type: ControlType.String,
        title: "Custom Characters",
        placeholder: "@#%*+=-:.",
        defaultValue: "",
        description: "Custom ASCII palette (dark to light). If empty, default is used.",
        displayTextArea: false,
    },
    glyphDrift: {
        type: ControlType.Boolean,
        title: "Glyph Drift",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
        description: "Animate temporal ASCII character drift without moving structure."
    },
    glowyText: {
        type: ControlType.Boolean,
        title: "Glowy Text",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
        description: "Add a soft glow to ASCII text."
    },
})
