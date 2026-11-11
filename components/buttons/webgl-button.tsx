import * as React from "react"
import { useEffect, useRef } from "react"
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
 * A button with a live WebGL "liquid fill" animation.
 *
 * Built following Framer's official Code Component guides:
 * - Auto-Sizing: https://www.framer.com/developers/auto-sizing
 * - Property Controls: https://www.framer.com/developers/property-controls
 * - Components Reference: https://www.framer.com/developers/components-reference
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 64
 */
export default function LiquidButton(props) {
    const {
        text,
        color,
        backgroundColor,
        textColor,
        link,
        newTab,
        cornerRadius,
        font,
        padding,
        showIcon,
        iconImage,
        iconSize,
        iconGap,
        onTap,
        style,
    } = props

    const canvasRef = useRef(null)
    const rootRef = useRef(null)
    const colorRef = useRef([0.02, 0.71, 0.83])
    const bgColorRef = useRef([0.02, 0.04, 0.07])

    // Framer's recommended hook for any animated component. Returns true on
    // the Canvas and during export, where we must NOT run continuous
    // animation (performance + export artifacts). Only the live Preview and
    // published site should actually animate.
    const isStatic = useIsStaticRenderer()

    // Normalizes any CSS color string (hex / rgb() / rgba() / hsl() / named)
    // into 0-1 floats by letting the browser's own 2D canvas parse it,
    // instead of hand-parsing hex (Framer's color picker can emit rgba()).
    function colorToFloatRgb(input) {
        try {
            const c = document.createElement("canvas")
            c.width = 1
            c.height = 1
            const ctx = c.getContext("2d")
            ctx.fillStyle = input
            ctx.fillRect(0, 0, 1, 1)
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
            return [r / 255, g / 255, b / 255]
        } catch (e) {
            return [0.02, 0.71, 0.83]
        }
    }

    // Keep color refs in sync without tearing down the WebGL context.
    useEffect(() => {
        colorRef.current = colorToFloatRgb(color || "#06b6d4")
    }, [color])

    useEffect(() => {
        bgColorRef.current = colorToFloatRgb(backgroundColor || "#050b11")
    }, [backgroundColor])

    // Set up WebGL only when NOT static, and tear it down cleanly on unmount
    // or whenever isStatic flips.
    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root) return

        const gl = canvas.getContext("webgl", {
            antialias: true,
            premultipliedAlpha: false,
        })
        if (!gl) return

        const vertexSrc =
            "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"
        const fragmentSrc = `
            precision highp float;
            uniform vec2 u_res;
            uniform float u_time, u_level, u_tilt, u_slosh;
            uniform vec3 u_color;
            uniform vec3 u_bg;
            float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
            float noise(vec2 p){
                vec2 i=floor(p), f=fract(p);
                vec2 u=f*f*(3.0-2.0*f);
                return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
            }
            float fbm(vec2 p){
                float v=0.0; float a=0.5;
                for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.04+vec2(11.3,7.1); a*=0.5; }
                return v;
            }
            void main(){
                vec2 uv = gl_FragCoord.xy / u_res;
                float x = uv.x * (u_res.x / u_res.y);
                float t = u_time;
                float amp = 0.012 + u_slosh * 0.045;
                float surf = u_level + u_tilt * (uv.x - 0.5) * 0.34
                    + amp * sin(x * 5.1 + t * 4.6)
                    + amp * 0.62 * sin(x * 9.7 - t * 6.8 + 1.7);
                float d = surf - uv.y;
                vec3 col = mix(u_bg * 0.72, u_bg * 1.25, uv.y);
                float inside = smoothstep(0.0, 0.012, d);
                vec3 bright = min(u_color * 1.35 + vec3(0.12), vec3(1.0));
                vec3 dark = u_color * 0.28;
                vec3 liquid = mix(bright, dark, clamp(d / max(u_level, 0.001), 0.0, 1.0));
                liquid *= 0.8 + 0.42 * fbm(vec2(x * 4.2, (uv.y + t * 0.14) * 4.2));
                col = mix(col, liquid, inside);
                col += bright * exp(-abs(d) * 80.0) * 0.85;
                vec2 edge = uv * (1.0 - uv);
                col *= 0.55 + 0.45 * pow(edge.x * edge.y * 16.0, 0.22);
                gl_FragColor = vec4(col, 1.0);
            }
        `

        function compileShader(type, src) {
            const shader = gl.createShader(type)
            gl.shaderSource(shader, src)
            gl.compileShader(shader)
            return shader
        }

        const program = gl.createProgram()
        gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSrc))
        gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSrc))
        gl.linkProgram(program)
        gl.useProgram(program)

        const quadBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )
        const positionLoc = gl.getAttribLocation(program, "p")
        gl.enableVertexAttribArray(positionLoc)
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

        const uRes = gl.getUniformLocation(program, "u_res")
        const uTime = gl.getUniformLocation(program, "u_time")
        const uLevel = gl.getUniformLocation(program, "u_level")
        const uTilt = gl.getUniformLocation(program, "u_tilt")
        const uSlosh = gl.getUniformLocation(program, "u_slosh")
        const uColor = gl.getUniformLocation(program, "u_color")
        const uBg = gl.getUniformLocation(program, "u_bg")

        let level = 0.56
        let gulp = 0
        let slosh = 0.4
        let tilt = 0
        let tiltTarget = 0
        let lastPointerX = null
        let lastFrameTime = 0
        let rafId = null
        let disposed = false

        function resizeCanvasToDisplaySize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const w = Math.floor(root.clientWidth * dpr)
            const h = Math.floor(root.clientHeight * dpr)
            if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
                canvas.width = w
                canvas.height = h
                gl.viewport(0, 0, w, h)
            }
        }

        function handlePointerMove(e) {
            const rect = root.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width
            if (lastPointerX !== null) {
                slosh = Math.min(1.4, slosh + Math.abs(x - lastPointerX) * 2.6)
            }
            lastPointerX = x
            tiltTarget = (x - 0.5) * 2
        }
        function handlePointerLeave() {
            lastPointerX = null
            tiltTarget = 0
        }
        function handleClick() {
            gulp = 1
            slosh = Math.min(1.4, slosh + 0.7)
        }

        root.addEventListener("mousemove", handlePointerMove)
        root.addEventListener("mouseleave", handlePointerLeave)
        root.addEventListener("click", handleClick)

        function frame(now) {
            if (disposed) return
            const dt = Math.min(0.05, (now - lastFrameTime) / 1000)
            lastFrameTime = now

            slosh *= Math.exp(-1.5 * dt)
            gulp *= Math.exp(-1.1 * dt)
            tilt += (tiltTarget - tilt) * Math.min(1, dt * 5)
            level += (0.56 - 0.36 * gulp - level) * Math.min(1, dt * 5.5)

            resizeCanvasToDisplaySize()

            const rgb = colorRef.current
            const bg = bgColorRef.current
            gl.uniform2f(uRes, canvas.width || 1, canvas.height || 1)
            gl.uniform1f(uTime, now / 1000)
            gl.uniform1f(uLevel, level)
            gl.uniform1f(uTilt, tilt)
            gl.uniform1f(uSlosh, slosh)
            gl.uniform3f(uColor, rgb[0], rgb[1], rgb[2])
            gl.uniform3f(uBg, bg[0], bg[1], bg[2])
            gl.drawArrays(gl.TRIANGLES, 0, 3)

            rafId = requestAnimationFrame(frame)
        }
        rafId = requestAnimationFrame(frame)

        return () => {
            disposed = true
            if (rafId) cancelAnimationFrame(rafId)
            root.removeEventListener("mousemove", handlePointerMove)
            root.removeEventListener("mouseleave", handlePointerLeave)
            root.removeEventListener("click", handleClick)
        }
    }, [isStatic])

    // Always render the same host tag. Swapping between <button> and <a>
    // based on whether Link is set forces React to destroy and recreate the
    // DOM node whenever Link changes, orphaning the live canvas mid-edit.
    const linkProps = link
        ? { href: link, target: newTab ? "_blank" : "_self", rel: "noopener" }
        : { role: "button", tabIndex: 0 }

    const imageSrc = iconImage
        ? typeof iconImage === "string"
            ? iconImage
            : iconImage.src
        : null

    return (
        <a
            {...linkProps}
            ref={rootRef}
            onClick={onTap}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                border: 0,
                margin: 0,
                borderRadius: cornerRadius,
                overflow: "hidden",
                cursor: "pointer",
                background: backgroundColor,
                textDecoration: "none",
                boxShadow:
                    "0 22px 44px rgba(4,24,36,0.35), 0 3px 9px rgba(5,10,15,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)",
                ...style,
                padding,
            }}
        >
            {isStatic ? (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(to bottom, ${backgroundColor} 0%, ${backgroundColor} 42%, ${color} 42%, ${color} 100%)`,
                    }}
                />
            ) : (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                    }}
                />
            )}
            <span
                style={{
                    position: "relative",
                    zIndex: 1,
                    pointerEvents: "none",
                    color: textColor,
                    display: "flex",
                    alignItems: "center",
                    gap: iconGap,
                    textShadow: "0 1px 10px rgba(0,18,25,0.85)",
                    whiteSpace: "pre",
                    ...font,
                }}
            >
                {text}
                {showIcon && imageSrc && (
                    <img
                        src={imageSrc}
                        alt=""
                        style={{
                            width: iconSize,
                            height: iconSize,
                            flexShrink: 0,
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                )}
            </span>
        </a>
    )
}

LiquidButton.defaultProps = {
    text: "SUBMIT",
    color: "#06b6d4",
    backgroundColor: "#050b11",
    textColor: "#e0faff",
    link: "",
    newTab: false,
    cornerRadius: 18,
    padding: "20px 40px",
    showIcon: true,
    iconSize: 16,
    iconGap: 8,
    font: {
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 400,
        fontSize: 14,
        letterSpacing: "0.3em",
    },
}

addPropertyControls(LiquidButton, {
    text: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "SUBMIT",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 400,
            fontSize: 14,
            letterSpacing: "0.3em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#e0faff",
    },
    color: {
        type: ControlType.Color,
        title: "Liquid Color",
        defaultValue: "#06b6d4",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#050b11",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
    },
    iconImage: {
        type: ControlType.Image,
        title: "Icon Image",
        hidden: (props) => !props.showIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 8,
        max: 64,
        defaultValue: 16,
        hidden: (props) => !props.showIcon,
    },
    iconGap: {
        type: ControlType.Number,
        title: "Icon Gap",
        min: 0,
        max: 60,
        defaultValue: 8,
        hidden: (props) => !props.showIcon,
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "Open In New Tab",
        defaultValue: false,
        hidden: (props) => !props.link,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        defaultValue: 18,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "20px 40px",
    },
})
