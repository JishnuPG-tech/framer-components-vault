import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as THREE from "three"

export interface FluidConfig {
    simResolution: number
    dyeResolution: number
    pressureIterations: number
    velocityDissipation: number
    dyeDissipation: number
    splatRadius: number
    forceStrength: number
    pressureDecay: number
    threshold: number
    edgeSoftness: number
    inkColor: { r: number; g: number; b: number }
    colorMode: "single" | "multi" | "rainbow"
    blendMode: "difference" | "exclusion" | "screen" | "normal"
    autoDemo: boolean
    ambientSpeed: number
}

export interface CustomTextBlock {
    text?: string
    position?:
        | "top-left"
        | "top-center"
        | "top-right"
        | "center-left"
        | "center"
        | "center-right"
        | "bottom-left"
        | "bottom-center"
        | "bottom-right"
        | "custom-percentage"
        | "custom-pixels"
        | "pin-constraints"
    pinTop?: number
    pinBottom?: number
    pinLeft?: number
    pinRight?: number
    xPercent?: number
    yPercent?: number
    posX?: number
    posY?: number
    offsetX?: number
    offsetY?: number
    rotation?: number
    fontSize?: number
    minFontSize?: number
    maxFontSize?: number
    mobileFontSize?: number
    responsiveMode?: "fluid" | "static" | "responsive-scale"
    hideOnMobile?: boolean
    font?: {
        fontFamily?: string
        fontWeight?: number | string
        fontSize?: number
        fontStyle?: string
        letterSpacing?: number | string
        lineHeight?: number | string
    }
    fontFamily?: string
    fontWeight?: number | string
    letterSpacing?: string
    lineHeight?: string
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
    textAlign?: "left" | "center" | "right" | "justify"
    maxWidth?: number | string
    color?: string
    opacity?: number
    zIndex?: number
}

export interface FluidSimulationFramerProps {
    // Grouped controls for Framer Inspector (optional object wrappers)
    contentGroup?: {
        showMainText?: boolean
        titleText?: string
        subtitleText?: string
        fontFamily?: string
        fontSize?: number
        normalFontSize?: number
        offsetX?: number
        offsetY?: number
        topLeftText?: string
        topRightText?: string
        bottomLeftText?: string
        bottomRightText?: string
        pinTop?: number
        pinBottom?: number
        pinLeft?: number
        pinRight?: number
        font?: {
            fontFamily?: string
            fontWeight?: number | string
            fontSize?: number
            lineHeight?: number | string
            letterSpacing?: number | string
            fontStyle?: string
        }
        textColor?: string
        responsiveMode?: "fluid" | "static" | "responsive-scale"
        minFontSize?: number
        maxFontSize?: number
        mobileFontSize?: number
        hideOnMobile?: boolean
    }
    layoutGroup?: {
        backgroundColor?: string
        verticalAlign?: "top" | "center" | "bottom"
        horizontalAlign?: "left" | "center" | "right"
        textAlign?: "left" | "center" | "right" | "justify"
        textMaxWidth?: number
        contentPadding?: number
    }
    physicsGroup?: {
        inkColor?: string
        colorMode?: "single" | "multi" | "rainbow"
        blendMode?: "difference" | "exclusion" | "screen" | "normal"
        simResolution?: number
        pressureIterations?: number
        splatRadius?: number
        forceStrength?: number
    }
    settingsGroup?: {
        autoDemo?: boolean
        showControls?: boolean
        ariaLabel?: string
    }

    // Direct / flat props
    showMainText?: boolean
    titleText?: string
    subtitleText?: string
    fontFamily?: string
    fontSize?: number
    normalFontSize?: number
    offsetX?: number
    offsetY?: number
    topLeftText?: string
    topRightText?: string
    bottomLeftText?: string
    bottomRightText?: string
    pinTop?: number
    pinBottom?: number
    pinLeft?: number
    pinRight?: number
    font?: {
        fontFamily?: string
        fontWeight?: number | string
        fontSize?: number
        lineHeight?: number | string
        letterSpacing?: number | string
        fontStyle?: string
    }
    textColor?: string
    responsiveMode?: "fluid" | "static" | "responsive-scale"
    minFontSize?: number
    maxFontSize?: number
    mobileFontSize?: number
    hideOnMobile?: boolean
    backgroundColor?: string
    inkColor?: string
    colorMode?: "single" | "multi" | "rainbow"
    blendMode?: "difference" | "exclusion" | "screen" | "normal"
    simResolution?: number
    pressureIterations?: number
    splatRadius?: number
    forceStrength?: number
    autoDemo?: boolean
    showControls?: boolean
    ariaLabel?: string
    style?: React.CSSProperties
    verticalAlign?: "top" | "center" | "bottom"
    horizontalAlign?: "left" | "center" | "right"
    textAlign?: "left" | "center" | "right" | "justify"
    textMaxWidth?: number
    contentPadding?: number
    customTexts?: CustomTextBlock[]
}

const vertShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`

const precisionHeader = `precision highp float; precision mediump sampler2D;`

const shaderSources = {
    splat: {
        v: vertShader,
        f: `
      ${precisionHeader}
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;

      void main () {
          vec2 p = vUv - point.xy;
          p.x *= aspectRatio;
          vec3 splat = exp(-dot(p, p) / radius) * color;
          vec3 base = texture2D(uTarget, vUv).xyz;
          gl_FragColor = vec4(base + splat, 1.0);
      }
    `,
    },
    advection: {
        v: vertShader,
        f: `
      ${precisionHeader}
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform float dt;
      uniform float dissipation;

      void main () {
          vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
          gl_FragColor = dissipation * texture2D(uSource, coord);
          gl_FragColor.a = 1.0;
      }
    `,
    },
    divergence: {
        v: vertShader,
        f: `
      ${precisionHeader}
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform vec2 texelSize;

      void main () {
          float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
          float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
          float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
          float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
          
          float div = 0.5 * (R - L + T - B);
          gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `,
    },
    pressure: {
        v: vertShader,
        f: `
      ${precisionHeader}
      varying vec2 vUv;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      uniform vec2 texelSize;

      void main () {
          float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
          float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
          float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
          float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
          float divergence = texture2D(uDivergence, vUv).x;
          
          float pressure = (L + R + B + T - divergence) * 0.25;
          gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `,
    },
    gradientSubtract: {
        v: vertShader,
        f: `
      ${precisionHeader}
      varying vec2 vUv;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      uniform vec2 texelSize;

      void main () {
          float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
          float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
          float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
          float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          
          velocity.xy -= vec2(R - L, T - B);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `,
    },
    clear: {
        v: vertShader,
        f: `
      ${precisionHeader}
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main () {
          gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `,
    },
    display: {
        v: vertShader,
        f: `
      ${precisionHeader}
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform vec3 inkColor;
      uniform float threshold;
      uniform float edgeSoftness;
      uniform float colorMode;

      void main () {
          vec3 dye = texture2D(uTexture, vUv).xyz;
          float brightness = max(dye.r, max(dye.g, dye.b));
          if (brightness < 0.001) {
              brightness = dot(dye, vec3(0.299, 0.587, 0.114));
          }
          float alpha = smoothstep(threshold - edgeSoftness, threshold + edgeSoftness, brightness);
          
          vec3 finalColor = inkColor;
          if (colorMode > 0.5 && colorMode < 1.5) {
              vec3 normDye = normalize(dye + vec3(0.01));
              finalColor = normDye * max(inkColor, vec3(0.6));
          } else if (colorMode >= 1.5) {
              finalColor = dye;
          }
          
          gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    },
}

interface DoubleRenderTarget {
    read: THREE.WebGLRenderTarget
    write: THREE.WebGLRenderTarget
    swap: () => void
    dispose: () => void
}

class InlineFluidSimulation {
    private config: FluidConfig
    private readonly canvas: HTMLCanvasElement
    private readonly container: HTMLElement
    private renderer!: THREE.WebGLRenderer
    private scene!: THREE.Scene
    private camera!: THREE.OrthographicCamera
    private quad!: THREE.Mesh

    private velocity!: DoubleRenderTarget
    private dye!: DoubleRenderTarget
    private divergence!: THREE.WebGLRenderTarget
    private pressure!: DoubleRenderTarget

    private texelSize: THREE.Vector2 = new THREE.Vector2()
    private materials: Record<string, THREE.ShaderMaterial> = {}

    private mouse = {
        x: 0,
        y: 0,
        lastX: 0,
        lastY: 0,
        moved: false,
        isDown: false,
        timeSinceMove: 0,
    }
    private velocityInput = new THREE.Vector2()
    private hueStep = 0

    private lastTime = Date.now()
    private animFrameId: number | null = null
    private isDestroyed = false
    private width = 0
    private height = 0

    private onMoveHandler!: (e: MouseEvent | TouchEvent) => void
    private onResizeHandler!: () => void
    private onPointerDownHandler!: (e: MouseEvent | TouchEvent) => void
    private onMouseUpHandler!: () => void
    private onTouchEndHandler!: () => void
    private resizeObserver: ResizeObserver | null = null
    private intersectionObserver: IntersectionObserver | null = null
    private isVisible = true

    constructor(
        canvas: HTMLCanvasElement,
        container: HTMLElement,
        initialConfig: FluidConfig
    ) {
        this.canvas = canvas
        this.container = container
        this.config = { ...initialConfig }

        this._setupRenderer()
        this._setupScene()
        this._setupTargets()
        this._setupMaterials()
        this._setupInput()

        this.lastTime = Date.now()
        this._loop()

        setTimeout(() => {
            if (!this.isDestroyed) {
                const w = this.width || 800
                const h = this.height || 600
                this.triggerSplat(w * 0.35, h * 0.45, 140, -100, 2.2)
                this.triggerSplat(w * 0.65, h * 0.55, -140, 100, 2.2)
                this.triggerSplat(w * 0.5, h * 0.3, 0, 160, 2.0)
            }
        }, 40)
    }

    public updateConfig(newConfig: Partial<FluidConfig>) {
        const prevSimRes = this.config.simResolution
        this.config = { ...this.config, ...newConfig }

        if (newConfig.simResolution && newConfig.simResolution !== prevSimRes) {
            this._rebuildTargets()
        }
    }

    public triggerSplat(
        x: number,
        y: number,
        dx: number,
        dy: number,
        radiusMult = 1.0,
        customColor?: THREE.Vector3
    ) {
        if (this.isDestroyed) return
        const force = new THREE.Vector2(dx, -dy).multiplyScalar(
            this.config.forceStrength
        )
        this._splat(x, y, force, radiusMult, customColor)
    }

    private _getSize() {
        let w: number
        let h: number

        try {
            const rect = this.container.getBoundingClientRect()
            w = Math.max(
                100,
                Math.floor(
                    rect.width ||
                        this.canvas.clientWidth ||
                        window.innerWidth ||
                        800
                )
            )
            h = Math.max(
                100,
                Math.floor(
                    rect.height ||
                        this.canvas.clientHeight ||
                        window.innerHeight ||
                        600
                )
            )
        } catch {
            w = 800
            h = 600
        }
        return { w, h }
    }

    private _setupRenderer() {
        const { w, h } = this._getSize()
        this.width = w
        this.height = h

        try {
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                alpha: true,
                antialias: false,
                powerPreference: "default",
                preserveDrawingBuffer: true,
            })
        } catch (err1) {
            console.warn(
                "Primary WebGLRenderer creation failed, attempting fallback...",
                err1
            )
            try {
                this.renderer = new THREE.WebGLRenderer({
                    canvas: this.canvas,
                    alpha: true,
                    antialias: false,
                    failIfMajorPerformanceCaveat: false,
                })
            } catch (err2) {
                console.error(
                    "All WebGLRenderer creation attempts failed:",
                    err2
                )
                throw new Error("WebGL context creation failed")
            }
        }

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        this.renderer.setSize(this.width, this.height, false)
        this.renderer.setClearColor(0x000000, 0)

        this.canvas.addEventListener(
            "webglcontextlost",
            (e) => {
                e.preventDefault()
                if (this.animFrameId !== null) {
                    cancelAnimationFrame(this.animFrameId)
                    this.animFrameId = null
                }
            },
            false
        )
    }

    private _setupScene() {
        this.scene = new THREE.Scene()
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2))
        this.scene.add(this.quad)
    }

    private _getTextureType(): THREE.TextureDataType {
        try {
            if (this.renderer) {
                const gl = this.renderer.getContext()
                if (gl) {
                    const isWebGL2 =
                        typeof WebGL2RenderingContext !== "undefined" &&
                        gl instanceof WebGL2RenderingContext
                    const halfFloatExt = isWebGL2
                        ? gl.getExtension("EXT_color_buffer_float")
                        : gl.getExtension("OES_texture_half_float") ||
                          gl.getExtension("WEBGL_color_buffer_float")
                    if (!halfFloatExt) {
                        return THREE.UnsignedByteType
                    }
                }
            }
        } catch {
            return THREE.UnsignedByteType
        }
        return THREE.HalfFloatType
    }

    private _createTarget(resScale: number) {
        const safeW = Math.max(100, this.width || 800)
        const safeH = Math.max(100, this.height || 600)

        const targetWidth = Math.max(16, Math.floor(resScale))
        const targetHeight = Math.max(
            16,
            Math.floor((resScale * safeH) / safeW)
        )

        const textureType = this._getTextureType()

        return new THREE.WebGLRenderTarget(targetWidth, targetHeight, {
            type: textureType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            depthBuffer: false,
            stencilBuffer: false,
        })
    }

    private _createDouble(resScale: number): DoubleRenderTarget {
        const read = this._createTarget(resScale)
        const write = this._createTarget(resScale)

        return {
            read,
            write,
            swap: function () {
                const temp = this.read
                this.read = this.write
                this.write = temp
            },
            dispose: function () {
                this.read.dispose()
                this.write.dispose()
            },
        }
    }

    private _setupTargets() {
        const simRes = this.config.simResolution
        const dyeRes = this.config.dyeResolution

        this.velocity = this._createDouble(simRes)
        this.dye = this._createDouble(dyeRes)
        this.divergence = this._createTarget(simRes)
        this.pressure = this._createDouble(simRes)

        this.texelSize.set(
            1.0 / this.velocity.read.width,
            1.0 / this.velocity.read.height
        )
    }

    private _rebuildTargets() {
        if (this.velocity) this.velocity.dispose()
        if (this.dye) this.dye.dispose()
        if (this.divergence) this.divergence.dispose()
        if (this.pressure) this.pressure.dispose()

        this._setupTargets()

        for (const mat of Object.values(this.materials)) {
            if (mat.uniforms.texelSize) {
                mat.uniforms.texelSize.value = this.texelSize
            }
        }
    }

    private _setupMaterials() {
        this.materials = {}
        for (const [key, shader] of Object.entries(shaderSources)) {
            this.materials[key] = new THREE.ShaderMaterial({
                vertexShader: shader.v,
                fragmentShader: shader.f,
                uniforms: {
                    texelSize: { value: this.texelSize },
                    aspectRatio: { value: this.width / this.height },
                    uTarget: { value: null },
                    uVelocity: { value: null },
                    uSource: { value: null },
                    uPressure: { value: null },
                    uDivergence: { value: null },
                    uTexture: { value: null },
                    point: { value: new THREE.Vector2() },
                    color: { value: new THREE.Vector3() },
                    radius: { value: 0.1 },
                    dt: { value: 0.016 },
                    dissipation: { value: 0.98 },
                    value: { value: 1.0 },
                    inkColor: { value: new THREE.Vector3(1, 1, 1) },
                    threshold: { value: 0.1 },
                    edgeSoftness: { value: 0.0 },
                    colorMode: { value: 0.0 },
                },
                depthWrite: false,
                depthTest: false,
                transparent: true,
            })
        }
    }

    private _setupInput() {
        this.mouse = {
            x: this.width * 0.5,
            y: this.height * 0.5,
            lastX: this.width * 0.5,
            lastY: this.height * 0.5,
            moved: false,
            isDown: false,
            timeSinceMove: 0,
        }

        this.onMoveHandler = (e: MouseEvent | TouchEvent) => {
            let clientX = 0
            let clientY = 0
            if (e instanceof MouseEvent) {
                clientX = e.clientX
                clientY = e.clientY
            } else if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX
                clientY = e.touches[0].clientY
            } else {
                return
            }

            const rect = this.container.getBoundingClientRect()
            const x = clientX - rect.left
            const y = clientY - rect.top

            const dx = x - this.mouse.lastX
            const dy = y - this.mouse.lastY

            this.velocityInput
                .set(dx, -dy)
                .multiplyScalar(this.config.forceStrength)

            this.mouse.x = x
            this.mouse.y = y
            this.mouse.lastX = x
            this.mouse.lastY = y
            this.mouse.moved = true
            this.mouse.timeSinceMove = 0
        }

        this.onPointerDownHandler = (e: MouseEvent | TouchEvent) => {
            this.onMoveHandler(e)
            this.mouse.isDown = true
            this.triggerSplat(
                this.mouse.x,
                this.mouse.y,
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 80,
                1.5
            )
        }

        this.onResizeHandler = () => {
            const { w, h } = this._getSize()
            this.width = w
            this.height = h
            this.renderer.setSize(this.width, this.height, false)

            for (const mat of Object.values(this.materials)) {
                if (mat.uniforms.aspectRatio) {
                    mat.uniforms.aspectRatio.value = this.width / this.height
                }
            }
            this._rebuildTargets()
        }

        this.container.addEventListener("mousemove", this.onMoveHandler, {
            passive: true,
        })
        this.container.addEventListener("touchmove", this.onMoveHandler, {
            passive: true,
        })
        this.container.addEventListener(
            "mousedown",
            this.onPointerDownHandler,
            { passive: true }
        )
        this.container.addEventListener(
            "touchstart",
            this.onPointerDownHandler,
            { passive: true }
        )
        this.onMouseUpHandler = () => {
            this.mouse.isDown = false
        }
        this.onTouchEndHandler = () => {
            this.mouse.isDown = false
        }
        window.addEventListener("mouseup", this.onMouseUpHandler)
        window.addEventListener("touchend", this.onTouchEndHandler)
        window.addEventListener("resize", this.onResizeHandler)

        if (typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(() => {
                this.onResizeHandler()
            })
            this.resizeObserver.observe(this.container)
        }

        if (typeof IntersectionObserver !== "undefined") {
            this.intersectionObserver = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        this.isVisible = entry.isIntersecting
                    }
                },
                { threshold: 0.01 }
            )
            this.intersectionObserver.observe(this.container)
        }
    }

    private _pass(
        material: THREE.ShaderMaterial,
        target: THREE.WebGLRenderTarget | null = null
    ) {
        this.quad.material = material
        this.renderer.setRenderTarget(target)
        this.renderer.render(this.scene, this.camera)
    }

    private _set(
        material: THREE.ShaderMaterial,
        uniforms: Record<
            string,
            THREE.Texture | THREE.Vector2 | THREE.Vector3 | number
        >
    ) {
        for (const [key, value] of Object.entries(uniforms)) {
            if (material.uniforms[key]) {
                material.uniforms[key].value = value
            }
        }
    }

    private _splat(
        x: number,
        y: number,
        velocity: THREE.Vector2,
        radiusMult = 1.0,
        customColor?: THREE.Vector3
    ) {
        const mat = this.materials.splat
        const point = new THREE.Vector2(x / this.width, 1.0 - y / this.height)
        const radius = (this.config.splatRadius * radiusMult) / 100.0

        this._set(mat, {
            uTarget: this.velocity.read.texture,
            point: point,
            color: new THREE.Vector3(velocity.x, velocity.y, 0),
            radius: radius,
        })
        this._pass(mat, this.velocity.write)
        this.velocity.swap()

        let inkVec = customColor
        if (!inkVec) {
            if (this.config.colorMode === "rainbow") {
                this.hueStep = (this.hueStep + 0.015) % 1.0
                const col = new THREE.Color().setHSL(this.hueStep, 1.0, 0.6)
                inkVec = new THREE.Vector3(col.r, col.g, col.b)
            } else if (this.config.colorMode === "multi") {
                this.hueStep = (this.hueStep + 0.04) % 1.0
                const col = new THREE.Color().setHSL(this.hueStep, 0.9, 0.65)
                inkVec = new THREE.Vector3(col.r, col.g, col.b)
            } else {
                inkVec = new THREE.Vector3(
                    this.config.inkColor.r,
                    this.config.inkColor.g,
                    this.config.inkColor.b
                )
            }
        }

        this._set(mat, {
            uTarget: this.dye.read.texture,
            point: point,
            color: inkVec,
            radius: radius,
        })
        this._pass(mat, this.dye.write)
        this.dye.swap()
    }

    private _simulate(dt: number) {
        this._set(this.materials.advection, {
            uVelocity: this.velocity.read.texture,
            uSource: this.velocity.read.texture,
            dt: dt,
            dissipation: this.config.velocityDissipation,
        })
        this._pass(this.materials.advection, this.velocity.write)
        this.velocity.swap()

        this._set(this.materials.advection, {
            uVelocity: this.velocity.read.texture,
            uSource: this.dye.read.texture,
            dt: dt,
            dissipation: this.config.dyeDissipation,
        })
        this._pass(this.materials.advection, this.dye.write)
        this.dye.swap()

        this._set(this.materials.divergence, {
            uVelocity: this.velocity.read.texture,
        })
        this._pass(this.materials.divergence, this.divergence)

        this._set(this.materials.clear, {
            uTexture: this.pressure.read.texture,
            value: this.config.pressureDecay,
        })
        this._pass(this.materials.clear, this.pressure.write)
        this.pressure.swap()

        for (let i = 0; i < this.config.pressureIterations; i++) {
            this._set(this.materials.pressure, {
                uPressure: this.pressure.read.texture,
                uDivergence: this.divergence.texture,
            })
            this._pass(this.materials.pressure, this.pressure.write)
            this.pressure.swap()
        }

        this._set(this.materials.gradientSubtract, {
            uPressure: this.pressure.read.texture,
            uVelocity: this.velocity.read.texture,
        })
        this._pass(this.materials.gradientSubtract, this.velocity.write)
        this.velocity.swap()
    }

    private _render() {
        const modeVal =
            this.config.colorMode === "multi"
                ? 1.0
                : this.config.colorMode === "rainbow"
                  ? 2.0
                  : 0.0
        this._set(this.materials.display, {
            uTexture: this.dye.read.texture,
            inkColor: new THREE.Vector3(
                this.config.inkColor.r,
                this.config.inkColor.g,
                this.config.inkColor.b
            ),
            threshold: this.config.threshold,
            edgeSoftness: this.config.edgeSoftness,
            colorMode: modeVal,
        })
        this._pass(this.materials.display, null)
    }

    private _ambientMotion(nowSec: number) {
        if (!this.config.autoDemo) return

        const speed = this.config.ambientSpeed * 0.8
        const t1 = nowSec * speed
        const t2 = nowSec * speed * 1.3 + 1.5

        const cx1 = (Math.sin(t1) * 0.35 + 0.5) * this.width
        const cy1 = (Math.cos(t1 * 0.8) * 0.3 + 0.5) * this.height

        const cx2 = (Math.cos(t2 * 1.1) * 0.3 + 0.5) * this.width
        const cy2 = (Math.sin(t2) * 0.35 + 0.5) * this.height

        const vel1 = new THREE.Vector2(
            Math.cos(t1 * 2) * 35,
            Math.sin(t1 * 2) * 35
        )
        const vel2 = new THREE.Vector2(
            -Math.sin(t2 * 2) * 30,
            Math.cos(t2 * 2) * 30
        )

        this._splat(cx1, cy1, vel1, 0.85)
        this._splat(cx2, cy2, vel2, 0.7)
    }

    private _loop() {
        if (this.isDestroyed) return

        if (!this.isVisible) {
            this.lastTime = Date.now()
            this.animFrameId = requestAnimationFrame(this._loop.bind(this))
            return
        }

        const now = Date.now()
        const dt = Math.min((now - this.lastTime) / 1000, 0.016)
        this.lastTime = now
        this.mouse.timeSinceMove += dt

        if (this.mouse.moved) {
            this._splat(this.mouse.x, this.mouse.y, this.velocityInput)
            this.mouse.moved = false
        }

        this._ambientMotion(now / 1000)
        this._simulate(dt)
        this._render()

        this.animFrameId = requestAnimationFrame(this._loop.bind(this))
    }

    public dispose() {
        this.isDestroyed = true
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId)
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
            this.resizeObserver = null
        }

        this.container.removeEventListener("mousemove", this.onMoveHandler)
        this.container.removeEventListener("touchmove", this.onMoveHandler)
        this.container.removeEventListener(
            "mousedown",
            this.onPointerDownHandler
        )
        this.container.removeEventListener(
            "touchstart",
            this.onPointerDownHandler
        )
        window.removeEventListener("resize", this.onResizeHandler)
        window.removeEventListener("mouseup", this.onMouseUpHandler)
        window.removeEventListener("touchend", this.onTouchEndHandler)

        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect()
            this.intersectionObserver = null
        }

        if (this.velocity) this.velocity.dispose()
        if (this.dye) this.dye.dispose()
        if (this.divergence) this.divergence.dispose()
        if (this.pressure) this.pressure.dispose()

        for (const mat of Object.values(this.materials)) {
            mat.dispose()
        }

        this.quad.geometry.dispose()
        if (this.renderer) {
            try {
                const gl = this.renderer.getContext()
                if (gl) {
                    const loseContextExt = gl.getExtension("WEBGL_lose_context")
                    if (loseContextExt) {
                        loseContextExt.loseContext()
                    }
                }
            } catch {
                // ignore
            }
            this.renderer.dispose()
        }
    }
}

const hexToRgb = (hex: string) => {
    try {
        const c = new THREE.Color(hex)
        return { r: c.r, g: c.g, b: c.b }
    } catch {
        return { r: 1, g: 1, b: 1 }
    }
}

const loadedGoogleFontsSet = new Set<string>()

function loadGoogleFont(family?: string) {
    if (!family || typeof document === "undefined") return
    const primary = family.split(",")[0].replace(/['"]/g, "").trim()
    if (
        !primary ||
        primary.toLowerCase() === "system-ui" ||
        primary.toLowerCase() === "-apple-system" ||
        primary.toLowerCase() === "sans-serif" ||
        primary.toLowerCase() === "serif" ||
        primary.toLowerCase() === "monospace"
    ) {
        return
    }
    if (loadedGoogleFontsSet.has(primary)) return
    loadedGoogleFontsSet.add(primary)

    const fontSlug = primary.replace(/\s+/g, "+")
    const id = `google-font-${fontSlug}`
    if (document.getElementById(id)) return

    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?family=${fontSlug}:ital,wght@0,100..900;1,100..900&display=swap`
    document.head.appendChild(link)
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function FluidSimulationFramer(
    props: FluidSimulationFramerProps
) {
    const showMainText =
        props.contentGroup?.showMainText ?? props.showMainText ?? true
    const titleText =
        props.contentGroup?.titleText ??
        props.titleText ??
        "BUILDING\nTOMORROW\nFOR TODAY"
    const subtitleText =
        props.contentGroup?.subtitleText ?? props.subtitleText ?? ""
    const topLeftText =
        props.contentGroup?.topLeftText ?? props.topLeftText ?? ""
    const topRightText =
        props.contentGroup?.topRightText ?? props.topRightText ?? ""
    const bottomLeftText =
        props.contentGroup?.bottomLeftText ?? props.bottomLeftText ?? ""
    const bottomRightText =
        props.contentGroup?.bottomRightText ?? props.bottomRightText ?? ""

    const font = props.contentGroup?.font ?? props.font
    const titleFontFamily =
        props.contentGroup?.font?.fontFamily ??
        props.font?.fontFamily ??
        props.contentGroup?.fontFamily ??
        props.fontFamily ??
        "system-ui, -apple-system, sans-serif"

    const titleFontSize =
        props.contentGroup?.fontSize ??
        props.fontSize ??
        props.contentGroup?.normalFontSize ??
        props.normalFontSize ??
        props.contentGroup?.font?.fontSize ??
        props.font?.fontSize ??
        84

    const titleOffsetX = props.contentGroup?.offsetX ?? props.offsetX ?? 0
    const titleOffsetY = props.contentGroup?.offsetY ?? props.offsetY ?? 0

    const titleMobileFontSize =
        props.contentGroup?.mobileFontSize ?? props.mobileFontSize ?? 36
    const titleHideOnMobile =
        props.contentGroup?.hideOnMobile ?? props.hideOnMobile ?? false

    const textColor =
        props.contentGroup?.textColor ?? props.textColor ?? "#000000"

    const backgroundColor =
        props.layoutGroup?.backgroundColor ?? props.backgroundColor ?? "#ffffff"
    const verticalAlign =
        props.layoutGroup?.verticalAlign ?? props.verticalAlign ?? "center"
    const horizontalAlign =
        props.layoutGroup?.horizontalAlign ?? props.horizontalAlign ?? "center"
    const textAlign =
        props.layoutGroup?.textAlign ?? props.textAlign ?? "center"
    const textMaxWidth =
        props.layoutGroup?.textMaxWidth ?? props.textMaxWidth ?? 1200
    const contentPadding =
        props.layoutGroup?.contentPadding ?? props.contentPadding ?? 32

    const inkColor = props.physicsGroup?.inkColor ?? props.inkColor ?? "#ffffff"
    const colorMode =
        props.physicsGroup?.colorMode ?? props.colorMode ?? "single"
    const blendMode =
        props.physicsGroup?.blendMode ?? props.blendMode ?? "difference"
    const simResolution =
        props.physicsGroup?.simResolution ?? props.simResolution ?? 256
    const pressureIterations =
        props.physicsGroup?.pressureIterations ?? props.pressureIterations ?? 50
    const splatRadius =
        props.physicsGroup?.splatRadius ?? props.splatRadius ?? 0.32
    const forceStrength =
        props.physicsGroup?.forceStrength ?? props.forceStrength ?? 8.5

    const autoDemo = props.settingsGroup?.autoDemo ?? props.autoDemo ?? true
    const showControls =
        props.settingsGroup?.showControls ?? props.showControls ?? false
    const ariaLabel =
        props.settingsGroup?.ariaLabel ??
        props.ariaLabel ??
        "Interactive WebGL Fluid Inversion Poster"
    const style = props.style
    const customTexts = useMemo(
        () => props.customTexts ?? [],
        [props.customTexts]
    )

    const [isClient, setIsClient] = useState(false)
    const [announcement, setAnnouncement] = useState<string>("")
    const [windowWidth, setWindowWidth] = useState<number>(() =>
        typeof window !== "undefined" ? window.innerWidth : 1200
    )
    const mountedRef = useRef(false)

    // Framer hook: detects static canvas editing and export rendering
    const isStaticRenderer = useIsStaticRenderer()

    useEffect(() => {
        if (mountedRef.current) return
        mountedRef.current = true
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient) return
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [isClient])

    useEffect(() => {
        loadGoogleFont(titleFontFamily)
        if (Array.isArray(customTexts)) {
            customTexts.forEach((item) => {
                if (item.fontFamily) loadGoogleFont(item.fontFamily)
            })
        }
    }, [titleFontFamily, customTexts])

    const isMobile = windowWidth < 768

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const simRef = useRef<InlineFluidSimulation | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const currentConfig: FluidConfig = useMemo(() => {
        const rgbInk = hexToRgb(inkColor)
        return {
            simResolution,
            dyeResolution: 1024,
            pressureIterations,
            velocityDissipation: 0.95,
            dyeDissipation: 0.95,
            splatRadius,
            forceStrength,
            pressureDecay: 0.75,
            threshold: 0.1,
            edgeSoftness: 0.0,
            inkColor: rgbInk,
            colorMode,
            blendMode,
            autoDemo: autoDemo ?? true,
            ambientSpeed: 0.8,
        }
    }, [
        simResolution,
        pressureIterations,
        splatRadius,
        forceStrength,
        inkColor,
        colorMode,
        blendMode,
        autoDemo,
    ])

    const [hasWebGLError, setHasWebGLError] = useState(false)
    const glErrorRef = useRef(false)

    useEffect(() => {
        // Prevent all WebGL and canvas setup on static renders
        if (isStaticRenderer) return
        if (!isClient || !canvasRef.current || !containerRef.current) return

        try {
            const sim = new InlineFluidSimulation(
                canvasRef.current,
                containerRef.current,
                currentConfig
            )
            simRef.current = sim

            return () => {
                sim.dispose()
                simRef.current = null
            }
        } catch (err) {
            console.warn(
                "WebGL context creation or simulation setup failed:",
                err
            )
            if (glErrorRef.current) return
            glErrorRef.current = true
            setHasWebGLError(true)
        }
    }, [isClient, isStaticRenderer, currentConfig])

    useEffect(() => {
        if (simRef.current) {
            simRef.current.updateConfig(currentConfig)
        }
    }, [currentConfig])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (!simRef.current || !containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const centerX = rect.width / 2
            const centerY = rect.height / 2

            switch (e.key) {
                case " ":
                case "Enter": {
                    e.preventDefault()
                    for (let i = 0; i < 4; i++) {
                        const dx = (Math.random() - 0.5) * 150
                        const dy = (Math.random() - 0.5) * 150
                        simRef.current.triggerSplat(
                            centerX + dx / 2,
                            centerY + dy / 2,
                            dx,
                            dy,
                            2.0
                        )
                    }
                    setAnnouncement("Fluid ink burst triggered")
                    break
                }

                case "ArrowUp": {
                    e.preventDefault()
                    simRef.current.triggerSplat(centerX, centerY, 0, -180, 2.5)
                    setAnnouncement("Upward fluid impulse triggered")
                    break
                }

                case "ArrowDown": {
                    e.preventDefault()
                    simRef.current.triggerSplat(centerX, centerY, 0, 180, 2.5)
                    setAnnouncement("Downward fluid impulse triggered")
                    break
                }

                case "ArrowLeft": {
                    e.preventDefault()
                    simRef.current.triggerSplat(centerX, centerY, -180, 0, 2.5)
                    setAnnouncement("Leftward fluid impulse triggered")
                    break
                }

                case "ArrowRight": {
                    e.preventDefault()
                    simRef.current.triggerSplat(centerX, centerY, 180, 0, 2.5)
                    setAnnouncement("Rightward fluid impulse triggered")
                    break
                }

                case "r":
                case "R": {
                    e.preventDefault()
                    simRef.current.updateConfig({
                        simResolution: simResolution === 256 ? 257 : 256,
                    })
                    setTimeout(() => {
                        if (simRef.current)
                            simRef.current.updateConfig({ simResolution })
                    }, 50)
                    setAnnouncement("Fluid simulation cleared")
                    break
                }
            }
        },
        [simResolution]
    )

    const contentAlignItems =
        horizontalAlign === "left"
            ? "flex-start"
            : horizontalAlign === "right"
              ? "flex-end"
              : "center"

    const flexJustifyContent =
        verticalAlign === "top"
            ? "flex-start"
            : verticalAlign === "bottom"
              ? "flex-end"
              : "center"

    const containerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "300px",
        backgroundColor: backgroundColor || "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: flexJustifyContent,
        alignItems: contentAlignItems,
        padding: `${contentPadding ?? 32}px`,
        boxSizing: "border-box",
        overflow: "hidden",
        userSelect: "none",
        outline: "none",
        color: textColor,
        ...style,
    }

    const canvasStyle: React.CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
        mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"],
    }

    const contentStyle: React.CSSProperties = {
        position: "relative",
        zIndex: 5,
        width: "100%",
        maxWidth: `${textMaxWidth ?? 1200}px`,
        textAlign: textAlign || "center",
        display: "flex",
        flexDirection: "column",
        alignItems: contentAlignItems,
        gap: "16px",
        pointerEvents: "none",
    }

    let computedTitleFontSize: string
    if (isMobile && titleMobileFontSize) {
        computedTitleFontSize = `${titleMobileFontSize}px`
    } else if (typeof titleFontSize === "number") {
        computedTitleFontSize = `${titleFontSize}px`
    } else if (typeof titleFontSize === "string") {
        computedTitleFontSize = titleFontSize
    } else {
        computedTitleFontSize = "84px"
    }

    const titleStyle: React.CSSProperties = {
        margin: 0,
        width: "100%",
        fontWeight: font?.fontWeight ?? 900,
        letterSpacing: font?.letterSpacing ?? "-0.04em",
        lineHeight: font?.lineHeight ?? "0.85em",
        textTransform: "uppercase",
        whiteSpace: "pre-wrap",
        wordBreak: "normal",
        overflowWrap: "normal",
        textAlign: textAlign || "center",
        color: textColor,
        fontFamily: titleFontFamily,
        ...font,
        fontSize: computedTitleFontSize,
        transform:
            titleOffsetX !== 0 || titleOffsetY !== 0
                ? `translate(${titleOffsetX}px, ${titleOffsetY}px)`
                : undefined,
    }

    const subtitleStyle: React.CSSProperties = {
        margin: 0,
        fontSize: "clamp(0.875rem, 2vw, 1.125rem)",
        fontFamily: "monospace, sans-serif",
        maxWidth: "650px",
        opacity: 0.8,
        textAlign: textAlign || "center",
        color: textColor,
    }

    const cornerTextStyle: React.CSSProperties = {
        position: "absolute",
        zIndex: 6,
        color: textColor,
        fontFamily: "system-ui, -apple-system, sans-serif",
        pointerEvents: "none",
        fontSize: "13px",
        lineHeight: "1.4em",
    }

    const topLeftStyle: React.CSSProperties = {
        ...cornerTextStyle,
        top: `${contentPadding}px`,
        left: `${contentPadding}px`,
        textAlign: "left",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    }

    const topRightStyle: React.CSSProperties = {
        ...cornerTextStyle,
        top: `${contentPadding}px`,
        right: `${contentPadding}px`,
        maxWidth: "320px",
        textAlign: "right",
        opacity: 0.85,
    }

    const bottomLeftStyle: React.CSSProperties = {
        ...cornerTextStyle,
        bottom: `${contentPadding}px`,
        left: `${contentPadding}px`,
        textAlign: "left",
        opacity: 0.75,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    }

    const bottomRightStyle: React.CSSProperties = {
        ...cornerTextStyle,
        bottom: `${contentPadding}px`,
        right: `${contentPadding}px`,
        textAlign: "right",
        opacity: 0.75,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    }

    const getCustomPositionStyle = (
        item: CustomTextBlock
    ): React.CSSProperties | null => {
        if (!item.text) return null
        if (item.hideOnMobile && isMobile) return null

        const pad = `${contentPadding}px`
        let basePos: React.CSSProperties

        const pos = item.position || "top-left"
        const xPct = item.xPercent ?? 50
        const yPct = item.yPercent ?? 50

        const offX = item.offsetX ?? 0
        const offY = item.offsetY ?? 0
        const rot = item.rotation ?? 0

        if (pos === "pin-constraints") {
            const pTop =
                item.pinTop !== undefined ? `${item.pinTop}px` : undefined
            const pBottom =
                item.pinBottom !== undefined ? `${item.pinBottom}px` : undefined
            const pLeft =
                item.pinLeft !== undefined ? `${item.pinLeft}px` : undefined
            const pRight =
                item.pinRight !== undefined ? `${item.pinRight}px` : undefined

            basePos = {
                ...(pTop !== undefined && { top: pTop }),
                ...(pBottom !== undefined && { bottom: pBottom }),
                ...(pLeft !== undefined && { left: pLeft }),
                ...(pRight !== undefined && { right: pRight }),
            }

            if (
                pTop === undefined &&
                pBottom === undefined &&
                pLeft === undefined &&
                pRight === undefined
            ) {
                basePos = { top: pad, left: pad }
            }

            const transformParts: string[] = []
            if (offX !== 0 || offY !== 0)
                transformParts.push(`translate(${offX}px, ${offY}px)`)
            if (rot !== 0) transformParts.push(`rotate(${rot}deg)`)

            if (transformParts.length > 0) {
                basePos.transform = transformParts.join(" ")
            }
        } else if (pos === "custom-percentage") {
            basePos = {
                left: `${xPct}%`,
                top: `${yPct}%`,
                transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) rotate(${rot}deg)`,
            }
        } else if (pos === "custom-pixels") {
            basePos = {
                left: `${item.posX ?? 100}px`,
                top: `${item.posY ?? 100}px`,
                transform: `translate(${offX}px, ${offY}px) rotate(${rot}deg)`,
            }
        } else {
            let alignTransform = ""
            switch (pos) {
                case "top-center":
                    basePos = { top: pad, left: "50%" }
                    alignTransform = "translateX(-50%)"
                    break
                case "top-right":
                    basePos = { top: pad, right: pad }
                    break
                case "center-left":
                    basePos = { top: "50%", left: pad }
                    alignTransform = "translateY(-50%)"
                    break
                case "center":
                    basePos = { top: "50%", left: "50%" }
                    alignTransform = "translate(-50%, -50%)"
                    break
                case "center-right":
                    basePos = { top: "50%", right: pad }
                    alignTransform = "translateY(-50%)"
                    break
                case "bottom-left":
                    basePos = { bottom: pad, left: pad }
                    break
                case "bottom-center":
                    basePos = { bottom: pad, left: "50%" }
                    alignTransform = "translateX(-50%)"
                    break
                case "bottom-right":
                    basePos = { bottom: pad, right: pad }
                    break
                case "top-left":
                default:
                    basePos = { top: pad, left: pad }
                    break
            }

            if (item.pinTop !== undefined) basePos.top = `${item.pinTop}px`
            if (item.pinBottom !== undefined)
                basePos.bottom = `${item.pinBottom}px`
            if (item.pinLeft !== undefined) basePos.left = `${item.pinLeft}px`
            if (item.pinRight !== undefined)
                basePos.right = `${item.pinRight}px`

            const transformParts: string[] = []
            if (alignTransform) transformParts.push(alignTransform)
            if (offX !== 0 || offY !== 0)
                transformParts.push(`translate(${offX}px, ${offY}px)`)
            if (rot !== 0) transformParts.push(`rotate(${rot}deg)`)

            if (transformParts.length > 0) {
                basePos.transform = transformParts.join(" ")
            }
        }

        const baseFontSize = item.fontSize ?? 14
        let computedFontSize: string = `${baseFontSize}px`

        const mode = item.responsiveMode || "fluid"

        if (mode === "fluid") {
            const minSize =
                item.minFontSize ??
                Math.max(10, Math.round(baseFontSize * 0.65))
            const maxSize = item.maxFontSize ?? Math.round(baseFontSize * 1.5)
            const vwVal = ((baseFontSize / 1200) * 100).toFixed(2)
            computedFontSize = `clamp(${minSize}px, ${vwVal}vw + ${minSize * 0.5}px, ${maxSize}px)`
        } else if (mode === "responsive-scale" || isMobile) {
            if (isMobile && item.mobileFontSize) {
                computedFontSize = `${item.mobileFontSize}px`
            } else if (isMobile) {
                computedFontSize = `${Math.max(10, Math.round(baseFontSize * 0.75))}px`
            }
        }

        const fontObj = item.font
        return {
            position: "absolute",
            zIndex: item.zIndex ?? 6,
            color: item.color || textColor,
            opacity: item.opacity ?? 1,
            textTransform: item.textTransform || "none",
            textAlign: item.textAlign || "left",
            maxWidth: item.maxWidth
                ? typeof item.maxWidth === "number"
                    ? `${item.maxWidth}px`
                    : item.maxWidth
                : isMobile
                  ? "80vw"
                  : "380px",
            pointerEvents: "none",
            cursor: "default",
            userSelect: "none",
            touchAction: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "normal",
            overflowWrap: "normal",
            transition: "font-size 0.2s ease, opacity 0.2s ease",
            fontSize: computedFontSize,
            fontWeight: item.fontWeight ?? 400,
            fontFamily:
                item.fontFamily || "system-ui, -apple-system, sans-serif",
            ...fontObj,
            ...basePos,
        }
    }

    const shortcutContainerStyle: React.CSSProperties = {
        marginTop: "16px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent:
            horizontalAlign === "left"
                ? "flex-start"
                : horizontalAlign === "right"
                  ? "flex-end"
                  : "center",
        gap: "8px",
        fontSize: "11px",
        fontFamily: "monospace, sans-serif",
        opacity: 0.6,
        pointerEvents: "auto",
    }

    const keyCapStyle: React.CSSProperties = {
        padding: "4px 8px",
        borderRadius: "4px",
        backgroundColor: "rgba(0,0,0,0.05)",
        border: "1px solid rgba(0,0,0,0.1)",
    }

    // Static preview: active on Framer Canvas, export rendering, SSR, or WebGL fallback
    if (!isClient || isStaticRenderer || hasWebGLError) {
        return (
            <div style={containerStyle} aria-label={ariaLabel} role="img">
                {topLeftText && <div style={topLeftStyle}>{topLeftText}</div>}
                {topRightText && (
                    <div style={topRightStyle}>{topRightText}</div>
                )}
                {bottomLeftText && (
                    <div style={bottomLeftStyle}>{bottomLeftText}</div>
                )}
                {bottomRightText && (
                    <div style={bottomRightStyle}>{bottomRightText}</div>
                )}

                {customTexts.map((item, idx) => {
                    const itemStyle = getCustomPositionStyle(item)
                    if (!itemStyle) return null
                    return (
                        <div key={idx} style={itemStyle}>
                            {item.text}
                        </div>
                    )
                })}

                {showMainText &&
                    !(isMobile && titleHideOnMobile) &&
                    (titleText || subtitleText) && (
                        <div style={contentStyle}>
                            {titleText && (
                                <h1 style={titleStyle}>{titleText}</h1>
                            )}
                            {subtitleText ? (
                                <p style={subtitleStyle}>{subtitleText}</p>
                            ) : null}
                        </div>
                    )}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            role="region"
            aria-label={ariaLabel}
            onKeyDown={handleKeyDown}
            style={containerStyle}
        >
            <div
                style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    borderWidth: 0,
                }}
                aria-live="polite"
            >
                {announcement}
            </div>

            <canvas ref={canvasRef} style={canvasStyle} />

            {topLeftText && <div style={topLeftStyle}>{topLeftText}</div>}
            {topRightText && <div style={topRightStyle}>{topRightText}</div>}
            {bottomLeftText && (
                <div style={bottomLeftStyle}>{bottomLeftText}</div>
            )}
            {bottomRightText && (
                <div style={bottomRightStyle}>{bottomRightText}</div>
            )}

            {customTexts.map((item, idx) => {
                const itemStyle = getCustomPositionStyle(item)
                if (!itemStyle) return null
                return (
                    <div key={idx} style={itemStyle}>
                        {item.text}
                    </div>
                )
            })}

            {showMainText &&
                !(isMobile && titleHideOnMobile) &&
                (titleText || subtitleText) && (
                    <div style={contentStyle}>
                        {titleText && <h1 style={titleStyle}>{titleText}</h1>}
                        {subtitleText ? (
                            <p style={subtitleStyle}>{subtitleText}</p>
                        ) : null}

                        {showControls && (
                            <div style={shortcutContainerStyle}>
                                <span style={keyCapStyle}>[Space] Splat</span>
                                <span style={keyCapStyle}>
                                    [Arrows] Impulse
                                </span>
                                <span style={keyCapStyle}>[R] Clear</span>
                            </div>
                        )}
                    </div>
                )}
        </div>
    )
}

FluidSimulationFramer.displayName = "Fluid Mask"

FluidSimulationFramer.defaultProps = {
    contentGroup: {
        showMainText: true,
        titleText: "BUILDING\nTOMORROW\nFOR TODAY",
        fontSize: 84,
        font: {
            fontSize: 84,
            lineHeight: "0.85em",
            letterSpacing: "-0.04em",
        },
        textColor: "#000000",
        offsetX: 0,
        offsetY: 0,
        hideOnMobile: false,
    },
    layoutGroup: {
        backgroundColor: "#ffffff",
        verticalAlign: "center",
        horizontalAlign: "center",
        textAlign: "center",
        textMaxWidth: 1200,
        contentPadding: 32,
    },
    physicsGroup: {
        inkColor: "#ffffff",
        colorMode: "single",
        blendMode: "difference",
        simResolution: 256,
        pressureIterations: 50,
        splatRadius: 0.32,
        forceStrength: 8.5,
    },
    settingsGroup: {
        autoDemo: true,
        showControls: false,
        ariaLabel: "Mask Fluid",
    },
    showMainText: true,
    titleText: "BUILDING\nTOMORROW\nFOR TODAY",
    subtitleText: "",
    topLeftText: "",
    topRightText: "",
    bottomLeftText: "",
    bottomRightText: "",
    customTexts: [
        {
            text: "MASK FLUID",
            position: "top-left",
            fontSize: 13,
            fontWeight: 700,
            color: "#000000",
            opacity: 1,
        },
        {
            text: "INTERACTIVE WEBGL INVERSION",
            position: "top-right",
            fontSize: 13,
            fontWeight: 500,
            color: "#000000",
            opacity: 0.85,
        },
        {
            text: "HOVER & DRAG TO REVEAL",
            position: "bottom-left",
            fontSize: 13,
            fontWeight: 500,
            color: "#000000",
            opacity: 0.75,
        },
        {
            text: "FRAMER EDITION 2026",
            position: "bottom-right",
            fontSize: 13,
            fontWeight: 500,
            color: "#000000",
            opacity: 0.75,
        },
    ],
}

addPropertyControls(FluidSimulationFramer, {
    contentGroup: {
        type: ControlType.Object,
        title: "Main Title",
        icon: "object",
        controls: {
            showMainText: {
                type: ControlType.Boolean,
                title: "Show Title",
                defaultValue: true,
            },
            titleText: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "BUILDING\nTOMORROW\nFOR TODAY",
                displayTextArea: true,
            },
            fontSize: {
                type: ControlType.Number,
                title: "Font Size (px)",
                defaultValue: 84,
                min: 16,
                max: 200,
                step: 1,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#000000",
            },
            offsetX: {
                type: ControlType.Number,
                title: "X Offset",
                unit: "px",
                defaultValue: 0,
                min: -3000,
                max: 3000,
                step: 1,
            },
            offsetY: {
                type: ControlType.Number,
                title: "Y Offset",
                unit: "px",
                defaultValue: 0,
                min: -3000,
                max: 3000,
                step: 1,
            },
            hideOnMobile: {
                type: ControlType.Boolean,
                title: "Hide Mobile",
                defaultValue: false,
            },
        },
    },
    customTexts: {
        type: ControlType.Array,
        title: "Text Elements",
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "New Text Layer",
                    displayTextArea: true,
                },
                font: {
                    type: ControlType.Font,
                    title: "Font",
                    controls: "extended",
                },
                position: {
                    type: ControlType.Enum,
                    title: "Position",
                    defaultValue: "top-left",
                    options: [
                        "top-left",
                        "top-center",
                        "top-right",
                        "center-left",
                        "center",
                        "center-right",
                        "bottom-left",
                        "bottom-center",
                        "bottom-right",
                        "custom-percentage",
                        "custom-pixels",
                    ],
                    optionTitles: [
                        "Top Left",
                        "Top Center",
                        "Top Right",
                        "Center Left",
                        "Center",
                        "Center Right",
                        "Bottom Left",
                        "Bottom Center",
                        "Bottom Right",
                        "Custom %",
                        "Custom px",
                    ],
                },
                xPercent: {
                    type: ControlType.Number,
                    title: "X (%)",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    hidden(props: Pick<CustomTextBlock, "position">) {
                        return props.position !== "custom-percentage"
                    },
                },
                yPercent: {
                    type: ControlType.Number,
                    title: "Y (%)",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    hidden(props: Pick<CustomTextBlock, "position">) {
                        return props.position !== "custom-percentage"
                    },
                },
                posX: {
                    type: ControlType.Number,
                    title: "X (px)",
                    unit: "px",
                    defaultValue: 100,
                    min: -2000,
                    max: 4000,
                    step: 1,
                    hidden(props: Pick<CustomTextBlock, "position">) {
                        return props.position !== "custom-pixels"
                    },
                },
                posY: {
                    type: ControlType.Number,
                    title: "Y (px)",
                    unit: "px",
                    defaultValue: 100,
                    min: -2000,
                    max: 4000,
                    step: 1,
                    hidden(props: Pick<CustomTextBlock, "position">) {
                        return props.position !== "custom-pixels"
                    },
                },
                offsetX: {
                    type: ControlType.Number,
                    title: "X Offset",
                    unit: "px",
                    defaultValue: 0,
                    min: -3000,
                    max: 3000,
                    step: 1,
                },
                offsetY: {
                    type: ControlType.Number,
                    title: "Y Offset",
                    unit: "px",
                    defaultValue: 0,
                    min: -3000,
                    max: 3000,
                    step: 1,
                },
                rotation: {
                    type: ControlType.Number,
                    title: "Rotation",
                    defaultValue: 0,
                    min: -180,
                    max: 180,
                    step: 1,
                },
                fontSize: {
                    type: ControlType.Number,
                    title: "Font Size (px)",
                    defaultValue: 14,
                    min: 8,
                    max: 120,
                    step: 1,
                },
                fontWeight: {
                    type: ControlType.Number,
                    title: "Weight",
                    defaultValue: 400,
                    min: 100,
                    max: 900,
                    step: 100,
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#000000",
                },
                opacity: {
                    type: ControlType.Number,
                    title: "Opacity",
                    defaultValue: 0.8,
                    min: 0,
                    max: 1,
                    step: 0.05,
                },
                hideOnMobile: {
                    type: ControlType.Boolean,
                    title: "Hide Mobile",
                    defaultValue: false,
                },
            },
        },
    },
    layoutGroup: {
        type: ControlType.Object,
        title: "Layout & Framing",
        icon: "effect",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#ffffff",
            },
            verticalAlign: {
                type: ControlType.Enum,
                title: "Vert Align",
                defaultValue: "center",
                options: ["top", "center", "bottom"],
                optionTitles: ["Top", "Center", "Bottom"],
                displaySegmentedControl: true,
            },
            horizontalAlign: {
                type: ControlType.Enum,
                title: "Horiz Align",
                defaultValue: "center",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
            },
            textAlign: {
                type: ControlType.Enum,
                title: "Text Align",
                defaultValue: "center",
                options: ["left", "center", "right", "justify"],
                optionTitles: ["Left", "Center", "Right", "Justify"],
                displaySegmentedControl: true,
            },
            textMaxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                defaultValue: 1200,
                min: 200,
                max: 2400,
                step: 20,
            },
            contentPadding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 32,
                min: 0,
                max: 120,
                step: 4,
            },
        },
    },
    physicsGroup: {
        type: ControlType.Object,
        title: "Fluid Physics & Ink",
        icon: "color",
        controls: {
            inkColor: {
                type: ControlType.Color,
                title: "Ink Color",
                defaultValue: "#ffffff",
            },
            colorMode: {
                type: ControlType.Enum,
                title: "Color Mode",
                defaultValue: "single",
                options: ["single", "multi", "rainbow"],
                optionTitles: ["Solid Tint", "Multi-Swirl", "Rainbow"],
            },
            blendMode: {
                type: ControlType.Enum,
                title: "Blend Mode",
                defaultValue: "difference",
                options: ["difference", "exclusion", "screen", "normal"],
                optionTitles: ["Difference", "Exclusion", "Screen", "Normal"],
            },
            simResolution: {
                type: ControlType.Number,
                title: "Resolution",
                defaultValue: 256,
                min: 64,
                max: 512,
                step: 32,
                displayStepper: true,
            },
            pressureIterations: {
                type: ControlType.Number,
                title: "Pressure",
                defaultValue: 50,
                min: 10,
                max: 100,
                step: 5,
            },
            splatRadius: {
                type: ControlType.Number,
                title: "Splat Size",
                defaultValue: 0.32,
                min: 0.05,
                max: 1.0,
                step: 0.05,
            },
            forceStrength: {
                type: ControlType.Number,
                title: "Force",
                defaultValue: 8.5,
                min: 1.0,
                max: 30.0,
                step: 0.5,
            },
        },
    },
    settingsGroup: {
        type: ControlType.Object,
        title: "Behavior & Access",
        icon: "interaction",
        controls: {
            autoDemo: {
                type: ControlType.Boolean,
                title: "Auto Ripples",
                defaultValue: true,
            },
            showControls: {
                type: ControlType.Boolean,
                title: "Shortcuts",
                defaultValue: false,
            },
            ariaLabel: {
                type: ControlType.String,
                title: "ARIA Label",
                defaultValue: "Interactive WebGL Fluid Inversion Poster",
            },
        },
    },
})
