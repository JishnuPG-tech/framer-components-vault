// @ts-nocheck
"use client"

import * as React from "react"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { Renderer, Triangle, Program, Mesh, Texture } from "https://esm.sh/ogl@1.0.11"
import { gsap } from "https://esm.sh/gsap@3.12.5"

const TRANSITIONS: Record<string, number> = { melt: 0, ripple: 1, shear: 2, swirl: 3 }

export interface MorphSliderItem {
  image: string
  caption?: string
}

export const DEFAULT_MORPH_ITEMS: MorphSliderItem[] = [
  {
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=80",
  },
  {
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
  },
  {
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80",
  },
  {
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1600&q=80",
  },
  {
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80",
  },
]

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform vec2 uResolution;
uniform vec2 uCurrentSize;
uniform vec2 uNextSize;
uniform float uProgress;
uniform float uDir;
uniform int uMode;
uniform float uIntensity;
uniform float uScale;
uniform float uAberration;
uniform float uDrift;
uniform float uTime;
uniform float uReduce;
uniform vec2 uPointer;
uniform vec3 uOverlay;

varying vec2 vUv;

const float PI = 3.14159265359;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 coverUV(vec2 uv, vec2 res, vec2 img) {
  float rA = res.x / max(res.y, 1.0);
  float iA = img.x / max(img.y, 1.0);
  vec2 s = vec2(1.0);
  float ratio = rA / max(iA, 0.0001);
  if (ratio > 1.0) {
    s.y = 1.0 / ratio;
  } else {
    s.x = ratio;
  }
  return (uv - 0.5) * s + 0.5;
}

void main() {
  float p = clamp(uProgress, 0.0, 1.0);
  float env = sin(p * PI);

  vec2 uv = vUv;

  uv += vec2(sin(uTime * 0.25 + uv.y * 4.0), cos(uTime * 0.22 + uv.x * 4.0)) * uDrift * 0.008;
  uv = (uv - 0.5) * (1.0 - uDrift * 0.02 * sin(uTime * 0.4)) + 0.5;

  vec2 uvC = uv;
  vec2 uvN = uv;
  float m = smoothstep(0.0, 1.0, p);

  if (uReduce < 0.5) {
    if (uMode == 3) {
      vec2 c = uv - 0.5;
      float r = length(c);
      float ang = env * uIntensity * 3.5 * (1.0 - r);
      uvC = rot(ang) * c + 0.5;
      uvN = rot(-ang) * c + 0.5;
      m = smoothstep(0.0, 1.0, p);
    } else if (uMode == 1) {
      float d = distance(uv, uPointer);
      float ring = p * 1.6;
      float wave = sin((d - ring) * 30.0) * env;
      vec2 dir = normalize(uv - uPointer + 1e-4);
      vec2 disp = dir * wave * uIntensity * 0.25;
      uvC = uv + disp;
      uvN = uv + disp * 0.6;
      m = 1.0 - smoothstep(ring - 0.03, ring + 0.03, d);
    } else if (uMode == 2) {
      float slices = 14.0;
      float row = floor(uv.y * slices);
      float rnd = hash11(row);
      vec2 disp = vec2((rnd - 0.5) * env * uIntensity * 0.6, 0.0);
      uvC = uv + disp;
      uvN = uv + disp;
      float localX = uDir > 0.0 ? uv.x : 1.0 - uv.x;
      float th = p * 1.5 - 0.25 + (rnd - 0.5) * 0.25;
      m = 1.0 - smoothstep(th - 0.06, th + 0.06, localX);
    } else {
      float nn = fbm(uv * uScale + uTime * 0.03);
      float warp = fbm(uv * uScale * 1.7 - uTime * 0.02);
      vec2 g = vec2(nn, warp) - 0.5;
      uvC = uv + g * uIntensity * 0.5 * p;
      uvN = uv - g * uIntensity * 0.5 * (1.0 - p);
      m = smoothstep(nn - 0.15, nn + 0.15, p);
    }
  }

  vec2 sC = coverUV(uvC, uResolution, uCurrentSize);
  vec2 sN = coverUV(uvN, uResolution, uNextSize);

  float ca = uReduce < 0.5 ? uAberration * env * 0.03 : 0.0;

  vec3 colC = vec3(
    texture2D(tCurrent, sC + vec2(ca, 0.0)).r,
    texture2D(tCurrent, sC).g,
    texture2D(tCurrent, sC - vec2(ca, 0.0)).b
  );
  vec3 colN = vec3(
    texture2D(tNext, sN + vec2(ca, 0.0)).r,
    texture2D(tNext, sN).g,
    texture2D(tNext, sN - vec2(ca, 0.0)).b
  );

  vec3 col = mix(colC, colN, m);

  float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
  col = mix(col, uOverlay, (1.0 - vig) * 0.28);

  gl_FragColor = vec4(col, 1.0);
}
`

function makeFallbackTexture(gl: any) {
  const size = 4
  const data = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 24
    data[i * 4 + 1] = 24
    data[i * 4 + 2] = 28
    data[i * 4 + 3] = 255
  }
  return new Texture(gl, { image: data, width: size, height: size, generateMipmaps: false })
}

function hexToRgb(hex: string): [number, number, number] {
  let h = (hex || "#000000").replace("#", "")
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  }
  const num = parseInt(h, 16)
  return [(num >> 16) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255]
}

export class MorphEngine {
  container: HTMLElement
  items: MorphSliderItem[]
  getOptions: () => any
  onIndexChange?: (index: number) => void
  reducedMotion: boolean
  current: number
  animating: boolean
  dragging: boolean
  dragDir: number
  shownIndex: number
  tween: any
  renderer: Renderer
  gl: any
  canvas: HTMLCanvasElement
  geometry: Triangle
  textures: any[]
  sizes: [number, number][]
  program: Program
  mesh: Mesh
  boundContextLost: (e: any) => void
  resizeObserver: ResizeObserver
  boundLoop: (t: number) => void
  raf: number

  constructor(
    container: HTMLElement,
    {
      items,
      startIndex,
      reducedMotion,
      getOptions,
      onIndexChange,
      dprCap,
    }: {
      items: MorphSliderItem[]
      startIndex: number
      reducedMotion: boolean
      getOptions: () => any
      onIndexChange?: (index: number) => void
      dprCap: number
    }
  ) {
    this.container = container
    this.items = items
    this.getOptions = getOptions
    this.onIndexChange = onIndexChange
    this.reducedMotion = reducedMotion

    this.current = startIndex
    this.animating = false
    this.dragging = false
    this.dragDir = 0
    this.shownIndex = startIndex
    this.tween = null

    this.renderer = new Renderer({
      alpha: false,
      antialias: true,
      dpr: Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, dprCap),
    })
    this.gl = this.renderer.gl
    this.gl.clearColor(0.05, 0.05, 0.06, 1)

    this.canvas = this.gl.canvas
    this.canvas.className = "morph-slider-canvas"
    container.appendChild(this.canvas)

    this.geometry = new Triangle(this.gl)

    this.textures = this.items.map(() => makeFallbackTexture(this.gl))
    this.sizes = this.items.map(() => [1, 1])

    const opts = this.getOptions()
    const transitionKey = typeof opts.transition === "string" ? opts.transition.toLowerCase() : "melt"
    this.program = new Program(this.gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        tCurrent: { value: this.textures[startIndex] },
        tNext: { value: this.textures[startIndex] },
        uResolution: { value: [1, 1] },
        uCurrentSize: { value: [1, 1] },
        uNextSize: { value: [1, 1] },
        uProgress: { value: 0 },
        uDir: { value: 1 },
        uMode: { value: TRANSITIONS[transitionKey] ?? 0 },
        uIntensity: { value: opts.intensity ?? 0.55 },
        uScale: { value: opts.scale ?? 2.4 },
        uAberration: { value: opts.aberration ?? 0.35 },
        uDrift: { value: opts.drift ?? 0.4 },
        uTime: { value: 0 },
        uReduce: { value: reducedMotion ? 1 : 0 },
        uPointer: { value: [0.5, 0.5] },
        uOverlay: { value: hexToRgb(opts.overlayColor || "#000000") },
      },
    })

    this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program })

    this.boundContextLost = this.onContextLost.bind(this)
    this.canvas.addEventListener("webglcontextlost", this.boundContextLost, false)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()

    this.loadTextures()

    this.boundLoop = this.loop.bind(this)
    this.raf = requestAnimationFrame(this.boundLoop)
  }

  loadTextures() {
    this.items.forEach((item, index) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = item.image
      img.onload = () => {
        const texture = new Texture(this.gl, { generateMipmaps: false })
        texture.image = img
        this.textures[index] = texture
        this.sizes[index] = [img.naturalWidth || 1, img.naturalHeight || 1]
        if (index === this.current) {
          this.program.uniforms.tCurrent.value = texture
          this.program.uniforms.uCurrentSize.value = this.sizes[index]
        }
      }
      img.onerror = () => {}
    })
  }

  resize() {
    const rect = this.container.getBoundingClientRect()
    const w = Math.max(rect.width, 1)
    const h = Math.max(rect.height, 1)
    this.renderer.setSize(w, h)
    this.program.uniforms.uResolution.value = [w, h]
  }

  syncOptions() {
    const opts = this.getOptions()
    const transitionKey = typeof opts.transition === "string" ? opts.transition.toLowerCase() : "melt"
    this.program.uniforms.uMode.value = TRANSITIONS[transitionKey] ?? 0
    this.program.uniforms.uIntensity.value = opts.intensity ?? 0.55
    this.program.uniforms.uScale.value = opts.scale ?? 2.4
    this.program.uniforms.uAberration.value = opts.aberration ?? 0.35
    this.program.uniforms.uDrift.value = opts.drift ?? 0.4
    this.program.uniforms.uOverlay.value = hexToRgb(opts.overlayColor || "#000000")
  }

  loop(t: number) {
    this.program.uniforms.uTime.value = t * 0.001
    if (!this.dragging && !this.animating) this.syncOptions()
    this.renderer.render({ scene: this.mesh })
    this.raf = requestAnimationFrame(this.boundLoop)
  }

  wrap(i: number) {
    const n = this.items.length
    return ((i % n) + n) % n
  }

  prepareNext(dir: number) {
    const target = this.wrap(this.current + dir)
    this.program.uniforms.tCurrent.value = this.textures[this.current]
    this.program.uniforms.uCurrentSize.value = this.sizes[this.current]
    this.program.uniforms.tNext.value = this.textures[target]
    this.program.uniforms.uNextSize.value = this.sizes[target]
    this.program.uniforms.uDir.value = dir
    return target
  }

  goTo(dirOrTarget: number, isDirect: boolean = false) {
    if (this.animating || this.dragging || this.items.length < 2) return
    const opts = this.getOptions()
    let target: number
    let dir: number
    if (isDirect) {
      if (dirOrTarget === this.current) return
      target = this.wrap(dirOrTarget)
      dir = target > this.current ? 1 : -1
    } else {
      dir = dirOrTarget
      if (!opts.loop) {
        const raw = this.current + dir
        if (raw < 0 || raw > this.items.length - 1) return
      }
      target = this.wrap(this.current + dir)
    }
    this.syncOptions()
    this.program.uniforms.tCurrent.value = this.textures[this.current]
    this.program.uniforms.uCurrentSize.value = this.sizes[this.current]
    this.program.uniforms.tNext.value = this.textures[target]
    this.program.uniforms.uNextSize.value = this.sizes[target]
    this.program.uniforms.uDir.value = dir
    this.animating = true
    this.announce(target)
    const duration = this.reducedMotion ? Math.min(opts.duration, 0.4) : opts.duration
    this.tween = gsap.fromTo(
      this.program.uniforms.uProgress,
      { value: 0 },
      {
        value: 1,
        duration,
        ease: opts.ease || "power2.inOut",
        onComplete: () => this.commit(target),
      }
    )
  }

  announce(index: number) {
    if (index === this.shownIndex) return
    this.shownIndex = index
    if (this.onIndexChange) this.onIndexChange(index)
  }

  commit(target: number) {
    this.current = target
    this.program.uniforms.tCurrent.value = this.textures[target]
    this.program.uniforms.uCurrentSize.value = this.sizes[target]
    this.program.uniforms.uProgress.value = 0
    this.animating = false
    this.tween = null
    this.announce(target)
  }

  next() {
    this.goTo(1)
  }

  prev() {
    this.goTo(-1)
  }

  setPointer(x: number, y: number) {
    this.program.uniforms.uPointer.value = [x, y]
  }

  beginDrag() {
    if (this.animating || this.items.length < 2) return false
    this.dragging = true
    this.dragDir = 0
    this.syncOptions()
    return true
  }

  drag(ndx: number) {
    if (!this.dragging) return
    const opts = this.getOptions()
    const dir = ndx < 0 ? 1 : -1
    if (!opts.loop) {
      const raw = this.current + dir
      if (raw < 0 || raw > this.items.length - 1) {
        this.program.uniforms.uProgress.value = 0
        return
      }
    }
    if (dir !== this.dragDir) {
      this.dragDir = dir
      this.prepareNext(dir)
    }
    const progress = Math.min(Math.abs(ndx), 1)
    this.program.uniforms.uProgress.value = progress
    this.announce(progress > 0.5 ? this.wrap(this.current + dir) : this.current)
  }

  endDrag() {
    if (!this.dragging) return
    this.dragging = false
    const p = this.program.uniforms.uProgress.value
    if (this.dragDir === 0) return
    const target = this.wrap(this.current + this.dragDir)
    const duration = this.reducedMotion ? 0.3 : 0.5
    this.animating = true
    if (p > 0.4) {
      this.announce(target)
      this.tween = gsap.to(this.program.uniforms.uProgress, {
        value: 1,
        duration,
        ease: "power2.out",
        onComplete: () => this.commit(target),
      })
    } else {
      this.announce(this.current)
      this.tween = gsap.to(this.program.uniforms.uProgress, {
        value: 0,
        duration,
        ease: "power2.out",
        onComplete: () => {
          this.animating = false
          this.tween = null
        },
      })
    }
  }

  onContextLost(e: any) {
    e.preventDefault()
    cancelAnimationFrame(this.raf)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    if (this.tween) this.tween.kill()
    this.resizeObserver.disconnect()
    this.canvas.removeEventListener("webglcontextlost", this.boundContextLost)
    this.textures.forEach((tex) => {
      if (tex && tex.texture) this.gl.deleteTexture(tex.texture)
    })
    if (this.program && this.program.program) this.gl.deleteProgram(this.program.program)
    const ext = this.gl.getExtension("WEBGL_lose_context")
    if (ext) ext.loseContext()
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas)
  }
}

export type MorphTransition = "melt" | "ripple" | "shear" | "swirl"

export interface MorphSliderProps {
  items?: MorphSliderItem[]
  slides?: MorphSliderItem[]
  startIndex?: number
  transition?: MorphTransition | string
  duration?: number
  durationS?: number
  ease?: string
  intensity?: number
  scale?: number
  noiseScale?: number
  aberration?: number
  drift?: number
  idleDrift?: number
  autoplay?: boolean
  autoplayDelay?: number
  delayS?: number
  loop?: boolean
  radius?: number
  cornerRadius?: number
  overlayColor?: string
  showCaptions?: boolean
  showControls?: boolean
  arrows?: boolean
  showIndicators?: boolean
  indicators?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MorphSlider(props: MorphSliderProps) {
  const {
    items,
    slides,
    startIndex = 0,
    transition = "melt",
    duration = 1.1,
    durationS,
    ease = "power2.inOut",
    intensity = 0.55,
    scale = 2.4,
    noiseScale,
    aberration = 0.35,
    drift = 0.4,
    idleDrift,
    autoplay = false,
    autoplayDelay = 4,
    delayS,
    loop = true,
    radius = 16,
    cornerRadius,
    overlayColor = "#000000",
    showCaptions = true,
    showControls = true,
    arrows,
    showIndicators = true,
    indicators,
    className = "",
    style,
    ...restProps
  } = props as any

  const activeTransition = String(transition || "melt").toLowerCase()
  const activeDuration = Number(durationS ?? duration ?? 1.1)
  const activeIntensity = Number(intensity ?? 0.55)
  const activeScale = Number(noiseScale ?? scale ?? 2.4)
  const activeAberration = Number(aberration ?? 0.35)
  const activeDrift = Number(idleDrift ?? drift ?? 0.4)
  const activeAutoplay = Boolean(autoplay ?? false)
  const activeDelay = Number(delayS ?? autoplayDelay ?? 4)
  const activeLoop = Boolean(loop ?? true)
  const activeRadius = Number(cornerRadius ?? radius ?? 16)
  const activeShowControls = Boolean(arrows ?? showControls ?? true)
  const activeShowIndicators = Boolean(indicators ?? showIndicators ?? true)
  const activeShowCaptions = Boolean(showCaptions ?? true)

  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<MorphEngine | null>(null)
  const [index, setIndex] = useState(startIndex)
  const [hovering, setHovering] = useState(false)

  const optsRef = useRef<any>({
    transition: activeTransition,
    duration: activeDuration,
    ease,
    intensity: activeIntensity,
    scale: activeScale,
    aberration: activeAberration,
    drift: activeDrift,
    overlayColor,
    loop: activeLoop,
  })

  optsRef.current = {
    transition: activeTransition,
    duration: activeDuration,
    ease,
    intensity: activeIntensity,
    scale: activeScale,
    aberration: activeAberration,
    drift: activeDrift,
    overlayColor,
    loop: activeLoop,
  }

  // Stable item resolution for Framer (supports ResponsiveImage objects, string URLs, and custom slides)
  const rawList = slides && slides.length > 0 ? slides : items && items.length > 0 ? items : DEFAULT_MORPH_ITEMS
  const itemsKey = useMemo(() => {
    return JSON.stringify(
      rawList.map((it: any) => {
        if (!it) return ""
        if (typeof it === "string") return it
        return it.imageURL || it.image?.src || it.image || it.src || ""
      })
    )
  }, [rawList])

  const safeItems: MorphSliderItem[] = useMemo(() => {
    return rawList.map((item: any, idx: number) => {
      let img = ""
      if (typeof item === "string") img = item
      else if (typeof item?.imageURL === "string") img = item.imageURL
      else if (typeof item?.image === "string") img = item.image
      else if (item?.image?.src) img = item.image.src
      else if (item?.src) img = item.src
      return {
        image: img || DEFAULT_MORPH_ITEMS[idx % DEFAULT_MORPH_ITEMS.length].image,
        caption: typeof item?.caption === "string" ? item.caption : undefined,
      }
    })
  }, [itemsKey])

  useEffect(() => {
    if (!containerRef.current) return undefined
    const reducedMotion =
      typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false

    const engine = new MorphEngine(containerRef.current, {
      items: safeItems,
      startIndex,
      reducedMotion,
      dprCap: 2,
      getOptions: () => optsRef.current,
      onIndexChange: setIndex,
    })
    engineRef.current = engine
    setIndex(startIndex)

    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [itemsKey, startIndex])

  const handleNext = useCallback(() => engineRef.current?.next(), [])
  const handlePrev = useCallback(() => engineRef.current?.prev(), [])

  useEffect(() => {
    if (!activeAutoplay || hovering) return undefined
    const id = setTimeout(() => engineRef.current?.next(), Math.max(activeDelay, 1) * 1000)
    return () => clearTimeout(id)
  }, [activeAutoplay, activeDelay, hovering, index])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    let startX = 0
    let width = 1
    let active = false

    const onDown = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      width = rect.width || 1
      startX = e.clientX
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      engineRef.current?.setPointer(px, 1 - py)
      active = engineRef.current?.beginDrag() ?? false
      if (active && el.setPointerCapture) {
        try {
          el.setPointerCapture(e.pointerId)
        } catch {}
      }
    }
    const onMove = (e: PointerEvent) => {
      if (!active) return
      const ndx = (e.clientX - startX) / width
      engineRef.current?.drag(ndx)
    }
    const onUp = () => {
      if (!active) return
      active = false
      engineRef.current?.endDrag()
    }

    el.addEventListener("pointerdown", onDown)
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerup", onUp)
    el.addEventListener("pointercancel", onUp)

    return () => {
      el.removeEventListener("pointerdown", onDown)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerup", onUp)
      el.removeEventListener("pointercancel", onUp)
    }
  }, [])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      }
    },
    [handleNext, handlePrev]
  )

  const hasCaptions = safeItems.some((item) => Boolean(item.caption))

  return (
    <div
      className={`morph-slider ${className}`.trim()}
      style={{
        borderRadius: `${activeRadius}px`,
        "--ms-swap": `${(activeDuration * 0.66).toFixed(3)}s`,
        "--ms-dot": `${(activeDuration * 0.45).toFixed(3)}s`,
        ...style,
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      {...restProps}
    >
      <style>{`
        .morph-slider {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #0c0c0e;
          user-select: none;
          touch-action: pan-y;
        }
        .morph-slider-stage {
          position: absolute;
          inset: 0;
          cursor: grab;
          outline: none;
        }
        .morph-slider-stage:active {
          cursor: grabbing;
        }
        .morph-slider-stage:focus-visible {
          box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.7);
        }
        .morph-slider-canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
        .morph-slider-caption {
          position: absolute;
          top: 18px;
          left: 20px;
          z-index: 3;
          pointer-events: none;
        }
        .morph-slider-caption-text {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f4f4f5;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.01em;
          opacity: 0;
          transform: translateY(6px);
          transition:
            opacity var(--ms-swap) cubic-bezier(0.16, 1, 0.3, 1),
            transform var(--ms-swap) cubic-bezier(0.16, 1, 0.3, 1);
        }
        .morph-slider-caption-text.is-active {
          opacity: 1;
          transform: translateY(0);
        }
        .morph-slider-controls {
          position: absolute;
          right: 20px;
          bottom: 18px;
          z-index: 3;
          display: flex;
          gap: 8px;
        }
        .morph-slider-btn {
          width: 38px;
          height: 38px;
          padding: 0;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #f4f4f5;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.15s ease;
        }
        .morph-slider-btn:hover {
          background: rgba(0, 0, 0, 0.65);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.06);
        }
        .morph-slider-btn:active {
          transform: scale(0.96);
        }
        .morph-slider-btn:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.8);
          outline-offset: 2px;
        }
        .morph-slider-indicators {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 18px;
          z-index: 3;
          display: flex;
          gap: 8px;
          justify-content: center;
          align-items: center;
        }
        .morph-slider-dot {
          width: 8px;
          height: 8px;
          padding: 0;
          border: none;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.35);
          cursor: pointer;
          transition:
            width var(--ms-dot) cubic-bezier(0.16, 1, 0.3, 1),
            background var(--ms-dot) ease;
        }
        .morph-slider-dot.is-active {
          width: 22px;
          background: rgba(255, 255, 255, 0.95);
        }
        .morph-slider-dot:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.8);
          outline-offset: 2px;
        }
        @media (max-width: 420px) {
          .morph-slider-btn { width: 34px; height: 34px; }
          .morph-slider-caption-text { font-size: 13px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .morph-slider-caption-text,
          .morph-slider-btn,
          .morph-slider-dot { animation: none; transition: none; }
        }
      `}</style>
      <div
        ref={containerRef}
        className="morph-slider-stage"
        role="group"
        aria-roledescription="carousel"
        aria-label="Image morph slider"
        tabIndex={0}
        onKeyDown={onKeyDown}
      />

      {activeShowCaptions && hasCaptions && (
        <div className="morph-slider-caption" aria-live="polite">
          {safeItems.map((item, i) =>
            item.caption ? (
              <span
                key={i}
                aria-hidden={i === index ? undefined : true}
                className={`morph-slider-caption-text ${i === index ? "is-active" : ""}`}
              >
                {item.caption}
              </span>
            ) : null
          )}
        </div>
      )}

      {activeShowControls && (
        <div className="morph-slider-controls">
          <button type="button" className="morph-slider-btn" aria-label="Previous slide" onClick={handlePrev}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M15 5l-7 7 7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button type="button" className="morph-slider-btn" aria-label="Next slide" onClick={handleNext}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M9 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {activeShowIndicators && (
        <div className="morph-slider-indicators" role="tablist" aria-label="Slides">
          {safeItems.map((item, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              className={`morph-slider-dot ${i === index ? "is-active" : ""}`}
              onClick={() => {
                const engine = engineRef.current
                if (!engine || i === index) return
                engine.goTo(i, true)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

addPropertyControls(MorphSlider, {
  slides: {
    type: ControlType.Array,
    title: "Slides",
    control: {
      type: ControlType.Object,
      controls: {
        image: {
          type: ControlType.ResponsiveImage,
          title: "Image Upload",
        },
        src: {
          type: ControlType.String,
          title: "Image URL",
          defaultValue: "",
        },
        caption: {
          type: ControlType.String,
          title: "Caption",
          defaultValue: "",
        },
      },
    },
    defaultValue: DEFAULT_MORPH_ITEMS.map((item) => ({
      src: item.image,
      caption: item.caption || "",
    })),
  },
  transition: {
    type: ControlType.Enum,
    title: "Transition",
    options: ["melt", "ripple", "shear", "swirl"],
    optionTitles: ["Melt", "Ripple", "Shear", "Swirl"],
    defaultValue: "melt",
  },
  durationS: {
    type: ControlType.Number,
    title: "Duration (s)",
    min: 0.3,
    max: 3,
    step: 0.1,
    defaultValue: 1.1,
  },
  intensity: {
    type: ControlType.Number,
    title: "Intensity",
    min: 0,
    max: 1.5,
    step: 0.05,
    defaultValue: 0.55,
  },
  noiseScale: {
    type: ControlType.Number,
    title: "Noise Scale",
    min: 0.5,
    max: 5,
    step: 0.1,
    defaultValue: 2.4,
  },
  aberration: {
    type: ControlType.Number,
    title: "Aberration",
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.35,
  },
  idleDrift: {
    type: ControlType.Number,
    title: "Idle Drift",
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.4,
  },
  autoplay: {
    type: ControlType.Boolean,
    title: "Autoplay",
    defaultValue: false,
  },
  delayS: {
    type: ControlType.Number,
    title: "Delay (s)",
    min: 1,
    max: 15,
    step: 1,
    defaultValue: 4,
  },
  loop: {
    type: ControlType.Boolean,
    title: "Loop",
    defaultValue: true,
  },
  cornerRadius: {
    type: ControlType.Number,
    title: "Corner Radius",
    min: 0,
    max: 48,
    step: 2,
    defaultValue: 16,
  },
  arrows: {
    type: ControlType.Boolean,
    title: "Arrows",
    defaultValue: true,
  },
  indicators: {
    type: ControlType.Boolean,
    title: "Indicators",
    defaultValue: true,
  },
})
