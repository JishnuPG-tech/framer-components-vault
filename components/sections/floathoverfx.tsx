// Image trail component with mouse-following animations and multiple variants
import {
    useRef,
    useEffect,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Extend Window interface to include GSAP
declare global {
    interface Window {
        gsap: any
    }
}

interface ImageTrailProps {
    images: Array<{ src: string; alt: string }>
    variant: number
    threshold: number
    imageSize: number
    borderRadius: number
    style?: CSSProperties
}

function lerp(a: number, b: number, n: number): number {
    return (1 - n) * a + n * b
}

// Add smooth easing function for better interpolation
function easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4)
}

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function getLocalPointerPos(e: MouseEvent | TouchEvent, rect: any) {
    let clientX = 0,
        clientY = 0
    if ("touches" in e && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
    } else if ("clientX" in e) {
        clientX = e.clientX
        clientY = e.clientY
    }
    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
    }
}

function getMouseDistance(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
): number {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return Math.hypot(dx, dy)
}

class ImageItem {
    DOM: { el: any; inner: any }
    defaultStyle = { scale: 1, x: 0, y: 0, opacity: 0 }
    rect: any = null

    constructor(DOM_el: any) {
        this.DOM = {
            el: DOM_el,
            inner: DOM_el.querySelector(".content__img-inner"),
        }
        this.getRect()
        this.initEvents()
    }

    initEvents() {
        this.resize = () => {
            if (typeof window !== "undefined" && window.gsap) {
                window.gsap.set(this.DOM.el, this.defaultStyle)
            }
            this.getRect()
        }
        if (typeof window !== "undefined") {
            window.addEventListener("resize", this.resize)
        }
    }

    resize = () => {}

    getRect() {
        if (typeof window !== "undefined" && this.DOM.el) {
            this.rect = this.DOM.el.getBoundingClientRect()
        }
    }
}

class ImageTrailVariant1 {
    container: any
    DOM: { el: any }
    images: ImageItem[]
    imagesTotal: number
    imgPosition = 0
    zIndexVal = 1
    activeImagesCount = 0
    isIdle = true
    threshold: number
    mousePos = { x: 0, y: 0 }
    lastMousePos = { x: 0, y: 0 }
    cacheMousePos = { x: 0, y: 0 }
    animationId: number | null = null

    constructor(container: any, threshold: number = 80) {
        this.container = container
        this.threshold = threshold
        this.DOM = { el: container }

        if (typeof window !== "undefined") {
            this.images = [
                ...this.DOM.el.querySelectorAll(".content__img"),
            ].map((img) => new ImageItem(img))
            this.imagesTotal = this.images.length
            this.init()
        } else {
            this.images = []
            this.imagesTotal = 0
        }
    }

    init() {
        if (typeof window === "undefined") return

        const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
        }

        this.container.addEventListener(
            "mousemove",
            handlePointerMove as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            handlePointerMove as EventListener
        )

        const initRender = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
            this.cacheMousePos = { ...this.mousePos }
            this.render()
            this.container.removeEventListener(
                "mousemove",
                initRender as EventListener
            )
            this.container.removeEventListener(
                "touchmove",
                initRender as EventListener
            )
        }

        this.container.addEventListener(
            "mousemove",
            initRender as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            initRender as EventListener
        )
    }

    render() {
        if (typeof window === "undefined" || !window.gsap) {
            if (typeof window !== "undefined") {
                this.animationId = requestAnimationFrame(() => this.render())
            }
            return
        }

        const distance = getMouseDistance(this.mousePos, this.lastMousePos)
        this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.08)
        this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.08)

        if (distance > this.threshold) {
            this.showNextImage()
            this.lastMousePos = { ...this.mousePos }
        }

        if (this.isIdle && this.zIndexVal !== 1) {
            this.zIndexVal = 1
        }

        this.animationId = requestAnimationFrame(() => this.render())
    }

    showNextImage() {
        if (typeof window === "undefined" || !window.gsap) return

        ++this.zIndexVal
        this.imgPosition =
            this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0
        const img = this.images[this.imgPosition]

        if (!img || !img.rect) return

        window.gsap.killTweensOf(img.DOM.el)
        window.gsap
            .timeline({
                onStart: () => this.onImageActivated(),
                onComplete: () => this.onImageDeactivated(),
            })
            .fromTo(
                img.DOM.el,
                {
                    opacity: 1,
                    scale: 0.8,
                    zIndex: this.zIndexVal,
                    x: this.cacheMousePos.x - img.rect.width / 2,
                    y: this.cacheMousePos.y - img.rect.height / 2,
                    filter: "blur(2px) brightness(120%)",
                },
                {
                    duration: 0.6,
                    ease: "power2.out",
                    scale: 1,
                    filter: "blur(0px) brightness(100%)",
                    x: this.mousePos.x - img.rect.width / 2,
                    y: this.mousePos.y - img.rect.height / 2,
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 0.8,
                    ease: "power3.in",
                    opacity: 0,
                    scale: 0.3,
                    filter: "blur(3px)",
                },
                0.5
            )
    }

    onImageActivated() {
        this.activeImagesCount++
        this.isIdle = false
    }

    onImageDeactivated() {
        this.activeImagesCount--
        if (this.activeImagesCount === 0) {
            this.isIdle = true
        }
    }

    destroy() {
        if (typeof window !== "undefined" && this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }
}

class ImageTrailVariant2 {
    container: any
    DOM: { el: any }
    images: ImageItem[]
    imagesTotal: number
    imgPosition = 0
    zIndexVal = 1
    activeImagesCount = 0
    isIdle = true
    threshold: number
    mousePos = { x: 0, y: 0 }
    lastMousePos = { x: 0, y: 0 }
    cacheMousePos = { x: 0, y: 0 }
    animationId: number | null = null

    constructor(container: any, threshold: number = 80) {
        this.container = container
        this.threshold = threshold
        this.DOM = { el: container }

        if (typeof window !== "undefined") {
            this.images = [
                ...this.DOM.el.querySelectorAll(".content__img"),
            ].map((img) => new ImageItem(img))
            this.imagesTotal = this.images.length
            this.init()
        } else {
            this.images = []
            this.imagesTotal = 0
        }
    }

    init() {
        if (typeof window === "undefined") return

        const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
        }

        this.container.addEventListener(
            "mousemove",
            handlePointerMove as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            handlePointerMove as EventListener
        )

        const initRender = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
            this.cacheMousePos = { ...this.mousePos }
            this.render()
            this.container.removeEventListener(
                "mousemove",
                initRender as EventListener
            )
            this.container.removeEventListener(
                "touchmove",
                initRender as EventListener
            )
        }

        this.container.addEventListener(
            "mousemove",
            initRender as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            initRender as EventListener
        )
    }

    render() {
        if (typeof window === "undefined" || !window.gsap) {
            if (typeof window !== "undefined") {
                this.animationId = requestAnimationFrame(() => this.render())
            }
            return
        }

        const distance = getMouseDistance(this.mousePos, this.lastMousePos)
        this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.12)
        this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.12)

        if (distance > this.threshold) {
            this.showNextImage()
            this.lastMousePos = { ...this.mousePos }
        }

        if (this.isIdle && this.zIndexVal !== 1) {
            this.zIndexVal = 1
        }

        this.animationId = requestAnimationFrame(() => this.render())
    }

    showNextImage() {
        if (typeof window === "undefined" || !window.gsap) return

        ++this.zIndexVal
        this.imgPosition =
            this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0
        const img = this.images[this.imgPosition]

        if (!img || !img.rect) return

        window.gsap.killTweensOf(img.DOM.el)
        window.gsap.killTweensOf(img.DOM.inner)

        window.gsap
            .timeline({
                onStart: () => this.onImageActivated(),
                onComplete: () => this.onImageDeactivated(),
            })
            .fromTo(
                img.DOM.el,
                {
                    opacity: 1,
                    scale: 0,
                    zIndex: this.zIndexVal,
                    x: this.cacheMousePos.x - img.rect.width / 2,
                    y: this.cacheMousePos.y - img.rect.height / 2,
                    rotation: window.gsap.utils.random(-5, 5),
                },
                {
                    duration: 0.7,
                    ease: "elastic.out(1.2, 0.4)",
                    scale: 1,
                    rotation: 0,
                    x: this.mousePos.x - img.rect.width / 2,
                    y: this.mousePos.y - img.rect.height / 2,
                },
                0
            )
            .fromTo(
                img.DOM.inner,
                {
                    scale: 3,
                    filter: "brightness(250%) saturate(200%) hue-rotate(20deg)",
                },
                {
                    duration: 0.7,
                    ease: "power3.out",
                    scale: 1,
                    filter: "brightness(100%) saturate(100%) hue-rotate(0deg)",
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 0.9,
                    ease: "power4.in",
                    opacity: 0,
                    scale: 0.05,
                    filter: "blur(5px)",
                },
                0.6
            )
    }

    onImageActivated() {
        this.activeImagesCount++
        this.isIdle = false
    }

    onImageDeactivated() {
        this.activeImagesCount--
        if (this.activeImagesCount === 0) {
            this.isIdle = true
        }
    }

    destroy() {
        if (typeof window !== "undefined" && this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }
}

class ImageTrailVariant3 {
    container: any
    DOM: { el: any }
    images: ImageItem[]
    imagesTotal: number
    imgPosition = 0
    zIndexVal = 1
    activeImagesCount = 0
    isIdle = true
    threshold: number
    mousePos = { x: 0, y: 0 }
    lastMousePos = { x: 0, y: 0 }
    cacheMousePos = { x: 0, y: 0 }
    animationId: number | null = null

    constructor(container: any, threshold: number = 80) {
        this.container = container
        this.threshold = threshold
        this.DOM = { el: container }

        if (typeof window !== "undefined") {
            this.images = [
                ...this.DOM.el.querySelectorAll(".content__img"),
            ].map((img) => new ImageItem(img))
            this.imagesTotal = this.images.length
            this.init()
        } else {
            this.images = []
            this.imagesTotal = 0
        }
    }

    init() {
        if (typeof window === "undefined") return

        const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
        }

        this.container.addEventListener(
            "mousemove",
            handlePointerMove as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            handlePointerMove as EventListener
        )

        const initRender = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
            this.cacheMousePos = { ...this.mousePos }
            this.render()
            this.container.removeEventListener(
                "mousemove",
                initRender as EventListener
            )
            this.container.removeEventListener(
                "touchmove",
                initRender as EventListener
            )
        }

        this.container.addEventListener(
            "mousemove",
            initRender as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            initRender as EventListener
        )
    }

    render() {
        if (typeof window === "undefined" || !window.gsap) {
            if (typeof window !== "undefined") {
                this.animationId = requestAnimationFrame(() => this.render())
            }
            return
        }

        const distance = getMouseDistance(this.mousePos, this.lastMousePos)
        this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1)
        this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1)

        if (distance > this.threshold) {
            this.showNextImage()
            this.lastMousePos = { ...this.mousePos }
        }

        if (this.isIdle && this.zIndexVal !== 1) {
            this.zIndexVal = 1
        }

        this.animationId = requestAnimationFrame(() => this.render())
    }

    showNextImage() {
        if (typeof window === "undefined" || !window.gsap) return

        ++this.zIndexVal
        this.imgPosition =
            this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0
        const img = this.images[this.imgPosition]

        if (!img || !img.rect) return

        window.gsap.killTweensOf(img.DOM.el)
        window.gsap.killTweensOf(img.DOM.inner)

        const randomRotation = window.gsap.utils.random(-20, 20)
        const randomScale = window.gsap.utils.random(0.8, 1.2)

        window.gsap
            .timeline({
                onStart: () => this.onImageActivated(),
                onComplete: () => this.onImageDeactivated(),
            })
            .fromTo(
                img.DOM.el,
                {
                    opacity: 1,
                    scale: 0,
                    rotation: randomRotation * 3,
                    zIndex: this.zIndexVal,
                    x: this.cacheMousePos.x - img.rect.width / 2,
                    y: this.cacheMousePos.y - img.rect.height / 2,
                    filter: "blur(8px) brightness(150%)",
                },
                {
                    duration: 0.8,
                    ease: "back.out(2)",
                    scale: randomScale,
                    rotation: randomRotation,
                    filter: "blur(0px) brightness(100%)",
                    x: this.mousePos.x - img.rect.width / 2,
                    y: this.mousePos.y - img.rect.height / 2,
                },
                0
            )
            .fromTo(
                img.DOM.inner,
                {
                    scale: 1.5,
                    filter: "saturate(150%) contrast(120%)",
                },
                {
                    duration: 0.8,
                    ease: "power3.out",
                    scale: 1,
                    filter: "saturate(100%) contrast(100%)",
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 1.2,
                    ease: "power2.in",
                    opacity: 0,
                    scale: 0.1,
                    y: `-=${window.gsap.utils.random(150, 250)}`,
                    x: `+=${window.gsap.utils.random(-80, 80)}`,
                    rotation: `+=${window.gsap.utils.random(-30, 30)}`,
                    filter: "blur(10px)",
                },
                0.8
            )
    }

    onImageActivated() {
        this.activeImagesCount++
        this.isIdle = false
    }

    onImageDeactivated() {
        this.activeImagesCount--
        if (this.activeImagesCount === 0) {
            this.isIdle = true
        }
    }

    destroy() {
        if (typeof window !== "undefined" && this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }
}

class ImageTrailVariant4 {
    container: any
    DOM: { el: any }
    images: ImageItem[]
    imagesTotal: number
    imgPosition = 0
    zIndexVal = 1
    activeImagesCount = 0
    isIdle = true
    threshold: number
    mousePos = { x: 0, y: 0 }
    lastMousePos = { x: 0, y: 0 }
    cacheMousePos = { x: 0, y: 0 }
    animationId: number | null = null
    lastAngle = 0

    constructor(container: any, threshold: number = 80) {
        this.container = container
        this.threshold = threshold
        this.DOM = { el: container }

        if (typeof window !== "undefined") {
            this.images = [
                ...this.DOM.el.querySelectorAll(".content__img"),
            ].map((img) => new ImageItem(img))
            this.imagesTotal = this.images.length
            this.init()
        } else {
            this.images = []
            this.imagesTotal = 0
        }
    }

    init() {
        if (typeof window === "undefined") return

        const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
        }

        this.container.addEventListener(
            "mousemove",
            handlePointerMove as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            handlePointerMove as EventListener
        )

        const initRender = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
            this.cacheMousePos = { ...this.mousePos }
            this.render()
            this.container.removeEventListener(
                "mousemove",
                initRender as EventListener
            )
            this.container.removeEventListener(
                "touchmove",
                initRender as EventListener
            )
        }

        this.container.addEventListener(
            "mousemove",
            initRender as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            initRender as EventListener
        )
    }

    render() {
        if (typeof window === "undefined" || !window.gsap) {
            if (typeof window !== "undefined") {
                this.animationId = requestAnimationFrame(() => this.render())
            }
            return
        }

        const distance = getMouseDistance(this.mousePos, this.lastMousePos)
        this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.15)
        this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.15)

        if (distance > this.threshold) {
            this.showNextImage()
            this.lastMousePos = { ...this.mousePos }
        }

        if (this.isIdle && this.zIndexVal !== 1) {
            this.zIndexVal = 1
        }

        this.animationId = requestAnimationFrame(() => this.render())
    }

    showNextImage() {
        if (typeof window === "undefined" || !window.gsap) return

        ++this.zIndexVal
        this.imgPosition =
            this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0
        const img = this.images[this.imgPosition]

        if (!img || !img.rect) return

        // Calculate movement direction and angle
        let dx = this.mousePos.x - this.cacheMousePos.x
        let dy = this.mousePos.y - this.cacheMousePos.y
        let angle = Math.atan2(dy, dx) * (180 / Math.PI)
        if (angle < 0) angle += 360

        const isMovingClockwise = angle >= this.lastAngle
        this.lastAngle = angle
        let startAngle = isMovingClockwise ? angle - 15 : angle + 15

        let distance = Math.sqrt(dx * dx + dy * dy)
        if (distance !== 0) {
            dx /= distance
            dy /= distance
        }
        dx *= distance / 120
        dy *= distance / 120

        window.gsap.killTweensOf(img.DOM.el)
        window.gsap.killTweensOf(img.DOM.inner)

        window.gsap
            .timeline({
                onStart: () => this.onImageActivated(),
                onComplete: () => this.onImageDeactivated(),
            })
            .fromTo(
                img.DOM.el,
                {
                    opacity: 1,
                    scale: 0.2,
                    rotation: startAngle,
                    zIndex: this.zIndexVal,
                    x: this.cacheMousePos.x - img.rect.width / 2,
                    y: this.cacheMousePos.y - img.rect.height / 2,
                    filter: "brightness(80%) saturate(150%) hue-rotate(30deg)",
                },
                {
                    duration: 1.2,
                    ease: "power2.out",
                    scale: 1,
                    rotation: this.lastAngle,
                    filter: "brightness(100%) saturate(100%) hue-rotate(0deg)",
                    x: this.mousePos.x - img.rect.width / 2 + dx * 80,
                    y: this.mousePos.y - img.rect.height / 2 + dy * 80,
                },
                0
            )
            .fromTo(
                img.DOM.inner,
                {
                    scale: 2.5,
                    rotation: -startAngle / 2,
                },
                {
                    duration: 1.2,
                    ease: "power3.out",
                    scale: 1,
                    rotation: 0,
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 0.8,
                    ease: "expo.in",
                    opacity: 0,
                    scale: 0.1,
                    rotation: `+=${window.gsap.utils.random(180, 360)}`,
                    filter: "blur(8px)",
                },
                0.7
            )
            .to(
                img.DOM.el,
                {
                    duration: 2,
                    ease: "power4.out",
                    x: `+=${dx * 200}`,
                    y: `+=${dy * 200}`,
                },
                0.1
            )
    }

    onImageActivated() {
        this.activeImagesCount++
        this.isIdle = false
    }

    onImageDeactivated() {
        this.activeImagesCount--
        if (this.activeImagesCount === 0) {
            this.isIdle = true
        }
    }

    destroy() {
        if (typeof window !== "undefined" && this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }
}

class ImageTrailVariant5 {
    container: any
    DOM: { el: any }
    images: ImageItem[]
    imagesTotal: number
    imgPosition = 0
    zIndexVal = 1
    activeImagesCount = 0
    isIdle = true
    threshold: number
    mousePos = { x: 0, y: 0 }
    lastMousePos = { x: 0, y: 0 }
    cacheMousePos = { x: 0, y: 0 }
    animationId: number | null = null

    constructor(container: any, threshold: number = 80) {
        this.container = container
        this.threshold = threshold
        this.DOM = { el: container }

        if (typeof window !== "undefined") {
            this.images = [
                ...this.DOM.el.querySelectorAll(".content__img"),
            ].map((img) => new ImageItem(img))
            this.imagesTotal = this.images.length
            this.init()
        } else {
            this.images = []
            this.imagesTotal = 0
        }
    }

    init() {
        if (typeof window === "undefined") return

        const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
        }

        this.container.addEventListener(
            "mousemove",
            handlePointerMove as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            handlePointerMove as EventListener
        )

        const initRender = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
            this.cacheMousePos = { ...this.mousePos }
            this.render()
            this.container.removeEventListener(
                "mousemove",
                initRender as EventListener
            )
            this.container.removeEventListener(
                "touchmove",
                initRender as EventListener
            )
        }

        this.container.addEventListener(
            "mousemove",
            initRender as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            initRender as EventListener
        )
    }

    render() {
        if (typeof window === "undefined" || !window.gsap) {
            if (typeof window !== "undefined") {
                this.animationId = requestAnimationFrame(() => this.render())
            }
            return
        }

        const distance = getMouseDistance(this.mousePos, this.lastMousePos)
        this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.25)
        this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.25)

        if (distance > this.threshold) {
            this.showNextImage()
            this.lastMousePos = { ...this.mousePos }
        }

        if (this.isIdle && this.zIndexVal !== 1) {
            this.zIndexVal = 1
        }

        this.animationId = requestAnimationFrame(() => this.render())
    }

    mapSpeedToSize(speed: number, minSize: number, maxSize: number): number {
        const maxSpeed = 200
        return minSize + (maxSize - minSize) * Math.min(speed / maxSpeed, 1)
    }

    mapSpeedToBrightness(speed: number, minB: number, maxB: number): number {
        const maxSpeed = 150
        return minB + (maxB - minB) * Math.min(speed / maxSpeed, 1)
    }

    showNextImage() {
        if (typeof window === "undefined" || !window.gsap) return

        ++this.zIndexVal
        this.imgPosition =
            this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0
        const img = this.images[this.imgPosition]

        if (!img || !img.rect) return

        // Calculate speed and dynamic properties
        let dx = this.mousePos.x - this.cacheMousePos.x
        let dy = this.mousePos.y - this.cacheMousePos.y
        let speed = Math.sqrt(dx * dx + dy * dy)

        let scaleFactor = this.mapSpeedToSize(speed, 0.4, 1.8)
        let brightnessValue = this.mapSpeedToBrightness(speed, 0.7, 1.5)

        // Create magnetic pull effect
        const pullDistance = speed * 0.8
        const pullAngle = Math.atan2(dy, dx)
        const pullX = Math.cos(pullAngle) * pullDistance
        const pullY = Math.sin(pullAngle) * pullDistance

        window.gsap.killTweensOf(img.DOM.el)
        window.gsap.killTweensOf(img.DOM.inner)

        window.gsap
            .timeline({
                onStart: () => this.onImageActivated(),
                onComplete: () => this.onImageDeactivated(),
            })
            .fromTo(
                img.DOM.el,
                {
                    opacity: 1,
                    scale: 0,
                    zIndex: this.zIndexVal,
                    x: this.cacheMousePos.x - img.rect.width / 2 - pullX,
                    y: this.cacheMousePos.y - img.rect.height / 2 - pullY,
                    filter: `brightness(${brightnessValue * 120}%) contrast(150%) saturate(120%)`,
                },
                {
                    duration: 0.9,
                    ease: "elastic.out(1, 0.6)",
                    scale: scaleFactor,
                    filter: `brightness(${brightnessValue * 100}%) contrast(100%) saturate(100%)`,
                    x: this.mousePos.x - img.rect.width / 2,
                    y: this.mousePos.y - img.rect.height / 2,
                },
                0
            )
            .fromTo(
                img.DOM.inner,
                {
                    scale: 3,
                    filter: "blur(5px) hue-rotate(45deg)",
                },
                {
                    duration: 0.9,
                    ease: "power3.out",
                    scale: 1,
                    filter: "blur(0px) hue-rotate(0deg)",
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 1.1,
                    ease: "power4.in",
                    opacity: 0,
                    scale: 0.05,
                    filter: "blur(12px) brightness(200%)",
                    x: `+=${pullX * 1.5}`,
                    y: `+=${pullY * 1.5}`,
                },
                0.6
            )
    }

    onImageActivated() {
        this.activeImagesCount++
        this.isIdle = false
    }

    onImageDeactivated() {
        this.activeImagesCount--
        if (this.activeImagesCount === 0) {
            this.isIdle = true
        }
    }

    destroy() {
        if (typeof window !== "undefined" && this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }
}

class ImageTrailVariant6 {
    container: any
    DOM: { el: any }
    images: ImageItem[]
    imagesTotal: number
    imgPosition = 0
    zIndexVal = 1
    activeImagesCount = 0
    isIdle = true
    threshold: number
    mousePos = { x: 0, y: 0 }
    lastMousePos = { x: 0, y: 0 }
    cacheMousePos = { x: 0, y: 0 }
    animationId: number | null = null

    constructor(container: any, threshold: number = 80) {
        this.container = container
        this.threshold = threshold
        this.DOM = { el: container }

        if (typeof window !== "undefined") {
            this.images = [
                ...this.DOM.el.querySelectorAll(".content__img"),
            ].map((img) => new ImageItem(img))
            this.imagesTotal = this.images.length
            this.init()
        } else {
            this.images = []
            this.imagesTotal = 0
        }
    }

    init() {
        if (typeof window === "undefined") return

        const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
        }

        this.container.addEventListener(
            "mousemove",
            handlePointerMove as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            handlePointerMove as EventListener
        )

        const initRender = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
            this.cacheMousePos = { ...this.mousePos }
            this.render()
            this.container.removeEventListener(
                "mousemove",
                initRender as EventListener
            )
            this.container.removeEventListener(
                "touchmove",
                initRender as EventListener
            )
        }

        this.container.addEventListener(
            "mousemove",
            initRender as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            initRender as EventListener
        )
    }

    render() {
        if (typeof window === "undefined" || !window.gsap) {
            if (typeof window !== "undefined") {
                this.animationId = requestAnimationFrame(() => this.render())
            }
            return
        }

        const distance = getMouseDistance(this.mousePos, this.lastMousePos)
        this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.2)
        this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.2)

        if (distance > this.threshold) {
            this.showNextImage()
            this.lastMousePos = { ...this.mousePos }
        }

        if (this.isIdle && this.zIndexVal !== 1) {
            this.zIndexVal = 1
        }

        this.animationId = requestAnimationFrame(() => this.render())
    }

    showNextImage() {
        if (typeof window === "undefined" || !window.gsap) return

        ++this.zIndexVal
        this.imgPosition =
            this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0
        const img = this.images[this.imgPosition]

        if (!img || !img.rect) return

        // Liquid morphing effect
        const morphScale = window.gsap.utils.random(0.3, 2.5)
        const morphRotation = window.gsap.utils.random(-180, 180)

        window.gsap.killTweensOf(img.DOM.el)
        window.gsap.killTweensOf(img.DOM.inner)

        window.gsap
            .timeline({
                onStart: () => this.onImageActivated(),
                onComplete: () => this.onImageDeactivated(),
            })
            .fromTo(
                img.DOM.el,
                {
                    opacity: 1,
                    scale: 0.1,
                    rotation: 0,
                    zIndex: this.zIndexVal,
                    x: this.cacheMousePos.x - img.rect.width / 2,
                    y: this.cacheMousePos.y - img.rect.height / 2,
                    filter: "blur(15px) brightness(300%) saturate(200%)",
                    borderRadius: "50%",
                },
                {
                    duration: 1.5,
                    ease: "power4.out",
                    scale: morphScale,
                    rotation: morphRotation,
                    filter: "blur(0px) brightness(100%) saturate(100%)",
                    borderRadius: "15px",
                    x: this.mousePos.x - img.rect.width / 2,
                    y: this.mousePos.y - img.rect.height / 2,
                },
                0
            )
            .fromTo(
                img.DOM.inner,
                {
                    scale: 4,
                    rotation: -morphRotation,
                    filter: "contrast(300%) hue-rotate(90deg)",
                },
                {
                    duration: 1.5,
                    ease: "power3.out",
                    scale: 1,
                    rotation: 0,
                    filter: "contrast(100%) hue-rotate(0deg)",
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 1.8,
                    ease: "power2.in",
                    opacity: 0,
                    scale: 0.05,
                    rotation: `+=${window.gsap.utils.random(360, 720)}`,
                    filter: "blur(20px) brightness(0%)",
                    borderRadius: "0%",
                },
                1.2
            )
    }

    onImageActivated() {
        this.activeImagesCount++
        this.isIdle = false
    }

    onImageDeactivated() {
        this.activeImagesCount--
        if (this.activeImagesCount === 0) {
            this.isIdle = true
        }
    }

    destroy() {
        if (typeof window !== "undefined" && this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }
}

class ImageTrailVariant7 {
    container: any
    DOM: { el: any }
    images: ImageItem[]
    imagesTotal: number
    imgPosition = 0
    zIndexVal = 1
    activeImagesCount = 0
    isIdle = true
    threshold: number
    mousePos = { x: 0, y: 0 }
    lastMousePos = { x: 0, y: 0 }
    cacheMousePos = { x: 0, y: 0 }
    animationId: number | null = null

    constructor(container: any, threshold: number = 80) {
        this.container = container
        this.threshold = threshold
        this.DOM = { el: container }

        if (typeof window !== "undefined") {
            this.images = [
                ...this.DOM.el.querySelectorAll(".content__img"),
            ].map((img) => new ImageItem(img))
            this.imagesTotal = this.images.length
            this.init()
        } else {
            this.images = []
            this.imagesTotal = 0
        }
    }

    init() {
        if (typeof window === "undefined") return

        const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
        }

        this.container.addEventListener(
            "mousemove",
            handlePointerMove as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            handlePointerMove as EventListener
        )

        const initRender = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
            this.cacheMousePos = { ...this.mousePos }
            this.render()
            this.container.removeEventListener(
                "mousemove",
                initRender as EventListener
            )
            this.container.removeEventListener(
                "touchmove",
                initRender as EventListener
            )
        }

        this.container.addEventListener(
            "mousemove",
            initRender as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            initRender as EventListener
        )
    }

    render() {
        if (typeof window === "undefined" || !window.gsap) {
            if (typeof window !== "undefined") {
                this.animationId = requestAnimationFrame(() => this.render())
            }
            return
        }

        const distance = getMouseDistance(this.mousePos, this.lastMousePos)
        this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.18)
        this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.18)

        if (distance > this.threshold) {
            this.showNextImage()
            this.lastMousePos = { ...this.mousePos }
        }

        if (this.isIdle && this.zIndexVal !== 1) {
            this.zIndexVal = 1
        }

        this.animationId = requestAnimationFrame(() => this.render())
    }

    showNextImage() {
        if (typeof window === "undefined" || !window.gsap) return

        ++this.zIndexVal
        this.imgPosition =
            this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0
        const img = this.images[this.imgPosition]

        if (!img || !img.rect) return

        // Glitch effect with digital distortion
        const glitchIntensity = window.gsap.utils.random(0.5, 1.5)

        window.gsap.killTweensOf(img.DOM.el)
        window.gsap.killTweensOf(img.DOM.inner)

        window.gsap
            .timeline({
                onStart: () => this.onImageActivated(),
                onComplete: () => this.onImageDeactivated(),
            })
            .fromTo(
                img.DOM.el,
                {
                    opacity: 1,
                    scale: 0,
                    skewX: 0,
                    skewY: 0,
                    zIndex: this.zIndexVal,
                    x: this.cacheMousePos.x - img.rect.width / 2,
                    y: this.cacheMousePos.y - img.rect.height / 2,
                    filter: "contrast(500%) brightness(200%) hue-rotate(180deg)",
                },
                {
                    duration: 0.3,
                    ease: "power4.out",
                    scale: glitchIntensity,
                    skewX: window.gsap.utils.random(-15, 15),
                    skewY: window.gsap.utils.random(-5, 5),
                    filter: "contrast(100%) brightness(100%) hue-rotate(0deg)",
                    x: this.mousePos.x - img.rect.width / 2,
                    y: this.mousePos.y - img.rect.height / 2,
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 0.1,
                    ease: "none",
                    x: `+=${window.gsap.utils.random(-20, 20)}`,
                    skewX: window.gsap.utils.random(-25, 25),
                    filter: "contrast(300%) brightness(150%) hue-rotate(90deg)",
                    repeat: 3,
                    yoyo: true,
                },
                0.3
            )
            .fromTo(
                img.DOM.inner,
                {
                    scale: 3,
                    x: 0,
                    filter: "invert(100%) contrast(200%)",
                },
                {
                    duration: 0.6,
                    ease: "power2.out",
                    scale: 1,
                    x: window.gsap.utils.random(-10, 10),
                    filter: "invert(0%) contrast(100%)",
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 0.8,
                    ease: "power3.in",
                    opacity: 0,
                    scale: 0.1,
                    skewX: 0,
                    skewY: 0,
                    filter: "contrast(0%) brightness(0%)",
                },
                0.7
            )
    }

    onImageActivated() {
        this.activeImagesCount++
        this.isIdle = false
    }

    onImageDeactivated() {
        this.activeImagesCount--
        if (this.activeImagesCount === 0) {
            this.isIdle = true
        }
    }

    destroy() {
        if (typeof window !== "undefined" && this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }
}

class ImageTrailVariant8 {
    container: any
    DOM: { el: any }
    images: ImageItem[]
    imagesTotal: number
    imgPosition = 0
    zIndexVal = 1
    activeImagesCount = 0
    isIdle = true
    threshold: number
    mousePos = { x: 0, y: 0 }
    lastMousePos = { x: 0, y: 0 }
    cacheMousePos = { x: 0, y: 0 }
    animationId: number | null = null

    constructor(container: any, threshold: number = 80) {
        this.container = container
        this.threshold = threshold
        this.DOM = { el: container }

        if (typeof window !== "undefined") {
            this.images = [
                ...this.DOM.el.querySelectorAll(".content__img"),
            ].map((img) => new ImageItem(img))
            this.imagesTotal = this.images.length
            this.init()
        } else {
            this.images = []
            this.imagesTotal = 0
        }
    }

    init() {
        if (typeof window === "undefined") return

        const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
        }

        this.container.addEventListener(
            "mousemove",
            handlePointerMove as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            handlePointerMove as EventListener
        )

        const initRender = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
            this.cacheMousePos = { ...this.mousePos }
            this.render()
            this.container.removeEventListener(
                "mousemove",
                initRender as EventListener
            )
            this.container.removeEventListener(
                "touchmove",
                initRender as EventListener
            )
        }

        this.container.addEventListener(
            "mousemove",
            initRender as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            initRender as EventListener
        )
    }

    render() {
        if (typeof window === "undefined" || !window.gsap) {
            if (typeof window !== "undefined") {
                this.animationId = requestAnimationFrame(() => this.render())
            }
            return
        }

        const distance = getMouseDistance(this.mousePos, this.lastMousePos)
        this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.05)
        this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.05)

        if (distance > this.threshold) {
            this.showNextImage()
            this.lastMousePos = { ...this.mousePos }
        }

        if (this.isIdle && this.zIndexVal !== 1) {
            this.zIndexVal = 1
        }

        this.animationId = requestAnimationFrame(() => this.render())
    }

    showNextImage() {
        if (typeof window === "undefined" || !window.gsap) return

        ++this.zIndexVal
        this.imgPosition =
            this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0
        const img = this.images[this.imgPosition]

        if (!img || !img.rect) return

        // 3D perspective effect
        const rect = this.container.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const relX = this.mousePos.x - centerX
        const relY = this.mousePos.y - centerY

        const rotationX = -(relY / centerY) * 45
        const rotationY = (relX / centerX) * 45
        const zDepth = Math.sqrt(relX * relX + relY * relY) * 2

        window.gsap.killTweensOf(img.DOM.el)
        window.gsap.killTweensOf(img.DOM.inner)

        window.gsap
            .timeline({
                onStart: () => this.onImageActivated(),
                onComplete: () => this.onImageDeactivated(),
            })
            .set(this.DOM.el, { perspective: 1500 }, 0)
            .fromTo(
                img.DOM.el,
                {
                    opacity: 1,
                    scale: 0.3,
                    z: -800,
                    rotationX: rotationX * 2,
                    rotationY: rotationY * 2,
                    zIndex: this.zIndexVal,
                    x: this.cacheMousePos.x - img.rect.width / 2,
                    y: this.cacheMousePos.y - img.rect.height / 2,
                    filter: "brightness(300%) contrast(200%)",
                },
                {
                    duration: 1.2,
                    ease: "power3.out",
                    scale: 1 + zDepth / 1000,
                    z: zDepth,
                    rotationX: rotationX,
                    rotationY: rotationY,
                    filter: "brightness(100%) contrast(100%)",
                    x: this.mousePos.x - img.rect.width / 2,
                    y: this.mousePos.y - img.rect.height / 2,
                },
                0
            )
            .fromTo(
                img.DOM.inner,
                {
                    scale: 2.5,
                    rotationZ: window.gsap.utils.random(-45, 45),
                },
                {
                    duration: 1.2,
                    ease: "power2.out",
                    scale: 1,
                    rotationZ: 0,
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 1.5,
                    ease: "power4.in",
                    opacity: 0,
                    z: -1200,
                    scale: 0.1,
                    rotationX: `+=${window.gsap.utils.random(-180, 180)}`,
                    rotationY: `+=${window.gsap.utils.random(-180, 180)}`,
                    filter: "brightness(0%) contrast(0%)",
                },
                0.8
            )
    }

    onImageActivated() {
        this.activeImagesCount++
        this.isIdle = false
    }

    onImageDeactivated() {
        this.activeImagesCount--
        if (this.activeImagesCount === 0) {
            this.isIdle = true
        }
    }

    destroy() {
        if (typeof window !== "undefined" && this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }
}

class ImageTrailVariant9 {
    container: any
    DOM: { el: any }
    images: ImageItem[]
    imagesTotal: number
    imgPosition = 0
    zIndexVal = 1
    activeImagesCount = 0
    isIdle = true
    threshold: number
    mousePos = { x: 0, y: 0 }
    lastMousePos = { x: 0, y: 0 }
    cacheMousePos = { x: 0, y: 0 }
    animationId: number | null = null

    constructor(container: any, threshold: number = 80) {
        this.container = container
        this.threshold = threshold
        this.DOM = { el: container }

        if (typeof window !== "undefined") {
            this.images = [
                ...this.DOM.el.querySelectorAll(".content__img"),
            ].map((img) => new ImageItem(img))
            this.imagesTotal = this.images.length
            this.init()
        } else {
            this.images = []
            this.imagesTotal = 0
        }
    }

    init() {
        if (typeof window === "undefined") return

        const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
        }

        this.container.addEventListener(
            "mousemove",
            handlePointerMove as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            handlePointerMove as EventListener
        )

        const initRender = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
            this.cacheMousePos = { ...this.mousePos }
            this.render()
            this.container.removeEventListener(
                "mousemove",
                initRender as EventListener
            )
            this.container.removeEventListener(
                "touchmove",
                initRender as EventListener
            )
        }

        this.container.addEventListener(
            "mousemove",
            initRender as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            initRender as EventListener
        )
    }

    render() {
        if (typeof window === "undefined" || !window.gsap) {
            if (typeof window !== "undefined") {
                this.animationId = requestAnimationFrame(() => this.render())
            }
            return
        }

        const distance = getMouseDistance(this.mousePos, this.lastMousePos)
        this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.3)
        this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.3)

        if (distance > this.threshold) {
            this.showNextImage()
            this.lastMousePos = { ...this.mousePos }
        }

        if (this.isIdle && this.zIndexVal !== 1) {
            this.zIndexVal = 1
        }

        this.animationId = requestAnimationFrame(() => this.render())
    }

    showNextImage() {
        if (typeof window === "undefined" || !window.gsap) return

        ++this.zIndexVal
        this.imgPosition =
            this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0
        const img = this.images[this.imgPosition]

        if (!img || !img.rect) return

        // Particle explosion effect
        const particleCount = 8
        const explosionRadius = 150

        window.gsap.killTweensOf(img.DOM.el)
        window.gsap.killTweensOf(img.DOM.inner)

        // Create particle effect simulation
        const particles = []
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2
            const distance = window.gsap.utils.random(50, explosionRadius)
            particles.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                scale: window.gsap.utils.random(0.1, 0.3),
                rotation: window.gsap.utils.random(0, 360),
            })
        }

        window.gsap
            .timeline({
                onStart: () => this.onImageActivated(),
                onComplete: () => this.onImageDeactivated(),
            })
            .fromTo(
                img.DOM.el,
                {
                    opacity: 1,
                    scale: 0,
                    rotation: 0,
                    zIndex: this.zIndexVal,
                    x: this.cacheMousePos.x - img.rect.width / 2,
                    y: this.cacheMousePos.y - img.rect.height / 2,
                    filter: "brightness(100%) saturate(100%)",
                },
                {
                    duration: 0.4,
                    ease: "back.out(3)",
                    scale: 1.2,
                    rotation: window.gsap.utils.random(-15, 15),
                    filter: "brightness(150%) saturate(150%)",
                    x: this.mousePos.x - img.rect.width / 2,
                    y: this.mousePos.y - img.rect.height / 2,
                },
                0
            )
            .fromTo(
                img.DOM.inner,
                {
                    scale: 1.5,
                    filter: "blur(3px)",
                },
                {
                    duration: 0.4,
                    ease: "power2.out",
                    scale: 1,
                    filter: "blur(0px)",
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 0.2,
                    ease: "power4.in",
                    scale: 0.8,
                    filter: "brightness(300%) saturate(200%)",
                },
                0.4
            )
            .to(
                img.DOM.el,
                {
                    duration: 1.5,
                    ease: "power2.out",
                    opacity: 0,
                    scale: 0.05,
                    rotation: `+=${window.gsap.utils.random(720, 1080)}`,
                    filter: "brightness(0%) saturate(0%)",
                    x: `+=${particles[0].x}`,
                    y: `+=${particles[0].y}`,
                },
                0.6
            )
    }

    onImageActivated() {
        this.activeImagesCount++
        this.isIdle = false
    }

    onImageDeactivated() {
        this.activeImagesCount--
        if (this.activeImagesCount === 0) {
            this.isIdle = true
        }
    }

    destroy() {
        if (typeof window !== "undefined" && this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }
}

class ImageTrailVariant10 {
    container: any
    DOM: { el: any }
    images: ImageItem[]
    imagesTotal: number
    imgPosition = 0
    zIndexVal = 1
    activeImagesCount = 0
    isIdle = true
    threshold: number
    mousePos = { x: 0, y: 0 }
    lastMousePos = { x: 0, y: 0 }
    cacheMousePos = { x: 0, y: 0 }
    animationId: number | null = null

    constructor(container: any, threshold: number = 80) {
        this.container = container
        this.threshold = threshold
        this.DOM = { el: container }

        if (typeof window !== "undefined") {
            this.images = [
                ...this.DOM.el.querySelectorAll(".content__img"),
            ].map((img) => new ImageItem(img))
            this.imagesTotal = this.images.length
            this.init()
        } else {
            this.images = []
            this.imagesTotal = 0
        }
    }

    init() {
        if (typeof window === "undefined") return

        const handlePointerMove = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
        }

        this.container.addEventListener(
            "mousemove",
            handlePointerMove as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            handlePointerMove as EventListener
        )

        const initRender = (ev: MouseEvent | TouchEvent) => {
            const rect = this.container.getBoundingClientRect()
            this.mousePos = getLocalPointerPos(ev, rect)
            this.cacheMousePos = { ...this.mousePos }
            this.render()
            this.container.removeEventListener(
                "mousemove",
                initRender as EventListener
            )
            this.container.removeEventListener(
                "touchmove",
                initRender as EventListener
            )
        }

        this.container.addEventListener(
            "mousemove",
            initRender as EventListener
        )
        this.container.addEventListener(
            "touchmove",
            initRender as EventListener
        )
    }

    render() {
        if (typeof window === "undefined" || !window.gsap) {
            if (typeof window !== "undefined") {
                this.animationId = requestAnimationFrame(() => this.render())
            }
            return
        }

        const distance = getMouseDistance(this.mousePos, this.lastMousePos)
        this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.08)
        this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.08)

        if (distance > this.threshold) {
            this.showNextImage()
            this.lastMousePos = { ...this.mousePos }
        }

        if (this.isIdle && this.zIndexVal !== 1) {
            this.zIndexVal = 1
        }

        this.animationId = requestAnimationFrame(() => this.render())
    }

    showNextImage() {
        if (typeof window === "undefined" || !window.gsap) return

        ++this.zIndexVal
        this.imgPosition =
            this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0
        const img = this.images[this.imgPosition]

        if (!img || !img.rect) return

        // Wave ripple effect
        const waveIntensity = window.gsap.utils.random(0.8, 1.5)
        const waveFrequency = window.gsap.utils.random(2, 4)

        window.gsap.killTweensOf(img.DOM.el)
        window.gsap.killTweensOf(img.DOM.inner)

        window.gsap
            .timeline({
                onStart: () => this.onImageActivated(),
                onComplete: () => this.onImageDeactivated(),
            })
            .fromTo(
                img.DOM.el,
                {
                    opacity: 1,
                    scale: 0.1,
                    zIndex: this.zIndexVal,
                    x: this.cacheMousePos.x - img.rect.width / 2,
                    y: this.cacheMousePos.y - img.rect.height / 2,
                    filter: "blur(20px) brightness(200%) contrast(200%)",
                    clipPath: "circle(0% at 50% 50%)",
                },
                {
                    duration: 0.8,
                    ease: "power3.out",
                    scale: waveIntensity,
                    filter: "blur(0px) brightness(100%) contrast(100%)",
                    clipPath: "circle(100% at 50% 50%)",
                    x: this.mousePos.x - img.rect.width / 2,
                    y: this.mousePos.y - img.rect.height / 2,
                },
                0
            )
            .fromTo(
                img.DOM.inner,
                {
                    scale: 3,
                    filter: "hue-rotate(180deg) saturate(300%)",
                },
                {
                    duration: 0.8,
                    ease: "power2.out",
                    scale: 1,
                    filter: "hue-rotate(0deg) saturate(100%)",
                },
                0
            )
            .to(
                img.DOM.el,
                {
                    duration: 0.3,
                    ease: "none",
                    scaleX: `*=${1 + Math.sin(Date.now() * 0.01) * 0.1}`,
                    scaleY: `*=${1 + Math.cos(Date.now() * 0.01) * 0.1}`,
                    repeat: waveFrequency,
                    yoyo: true,
                },
                0.8
            )
            .to(
                img.DOM.el,
                {
                    duration: 1.2,
                    ease: "power4.in",
                    opacity: 0,
                    scale: 0.05,
                    filter: "blur(25px) brightness(0%)",
                    clipPath: "circle(0% at 50% 50%)",
                },
                1.1
            )
    }

    onImageActivated() {
        this.activeImagesCount++
        this.isIdle = false
    }

    onImageDeactivated() {
        this.activeImagesCount--
        if (this.activeImagesCount === 0) {
            this.isIdle = true
        }
    }

    destroy() {
        if (typeof window !== "undefined" && this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
    }
}

const variantMap = {
    1: ImageTrailVariant1,
    2: ImageTrailVariant2,
    3: ImageTrailVariant3,
    4: ImageTrailVariant4,
    5: ImageTrailVariant5,
    6: ImageTrailVariant6,
    7: ImageTrailVariant7,
    8: ImageTrailVariant8,
    9: ImageTrailVariant9,
    10: ImageTrailVariant10,
}

/**
 * Image Trail - Mouse-following image animation component with multiple variants
 *
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageTrail(props: ImageTrailProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2 - Purple",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3 - Orange",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4 - Yellow",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
            },
        ],
        variant = 1,
        threshold = 60,
        imageSize = 190,
        borderRadius = 15,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const trailInstanceRef = useRef<any>(null)
    const isStatic = useIsStaticRenderer()
    const [gsapLoaded, setGsapLoaded] = useState(false)

    // Load GSAP
    useEffect(() => {
        if (typeof window === "undefined" || isStatic) return

        const loadGSAP = async () => {
            try {
                if (!window.gsap) {
                    const script = document.createElement("script")
                    script.src =
                        "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
                    script.onload = () => {
                        startTransition(() => setGsapLoaded(true))
                    }
                    document.head.appendChild(script)
                } else {
                    startTransition(() => setGsapLoaded(true))
                }
            } catch (error) {
                console.error("Failed to load GSAP:", error)
            }
        }

        loadGSAP()
    }, [isStatic])

    // Initialize trail effect
    useEffect(() => {
        if (!containerRef.current || !gsapLoaded || isStatic) return

        // Clean up previous instance
        if (trailInstanceRef.current) {
            trailInstanceRef.current.destroy()
        }

        // Create new instance based on variant
        const VariantClass =
            variantMap[variant as keyof typeof variantMap] || variantMap[1]
        trailInstanceRef.current = new VariantClass(
            containerRef.current,
            threshold
        )

        return () => {
            if (trailInstanceRef.current) {
                trailInstanceRef.current.destroy()
            }
        }
    }, [gsapLoaded, threshold, variant, images, isStatic])

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: 8,
                    color: "white",
                    fontSize: "16px",
                    fontWeight: "500",
                    textAlign: "center",
                    padding: "20px",
                }}
            >
                ✨ Move mouse to see smooth image trail effect
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="content"
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                zIndex: 100,
                borderRadius: 8,
                background: "transparent",
                overflow: "visible",
                cursor: "none",
            }}
        >
            {images.map((image, i) => (
                <div
                    key={i}
                    className="content__img"
                    style={{
                        width: `${imageSize}px`,
                        aspectRatio: "1.1",
                        borderRadius: `${borderRadius}px`,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        opacity: 0,
                        overflow: "hidden",
                        willChange: "transform, filter, opacity",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                    }}
                >
                    <div
                        className="content__img-inner"
                        style={{
                            backgroundImage: `url(${image.src})`,
                            backgroundPosition: "50% 50%",
                            width: "calc(100% + 20px)",
                            height: "calc(100% + 20px)",
                            backgroundSize: "cover",
                            position: "absolute",
                            top: "calc(-1 * 20px / 2)",
                            left: "calc(-1 * 20px / 2)",
                        }}
                    />
                </div>
            ))}
        </div>
    )
}

addPropertyControls(ImageTrail, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2 - Purple",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3 - Orange",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4 - Yellow",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
            },
        ],
        maxCount: 20,
    },
    variant: {
        type: ControlType.Enum,
        title: "Animation Style",
        options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        optionTitles: [
            "Classic Fade",
            "Bounce Scale",
            "Float Away",
            "Spiral Motion",
            "Magnetic Pull",
            "Liquid Morph",
            "Glitch Effect",
            "3D Perspective",
            "Particle Burst",
            "Wave Ripple",
        ],
        defaultValue: 1,
    },
    threshold: {
        type: ControlType.Number,
        title: "Sensitivity",
        defaultValue: 60,
        min: 20,
        max: 150,
        step: 10,
        unit: "px",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 190,
        min: 80,
        max: 300,
        step: 10,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 15,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})
