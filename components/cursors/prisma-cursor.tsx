// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useMemo, useRef, type CSSProperties } from "react"
import { useInView } from "framer-motion"

// Instructions:
// Create a full-screen animated Prism background using Canvas. The geometric shape rotates and changes color hue over time.
// It reacts to cursor position and velocity. Include speed and intensity controls as props.

type MouseState = {
	x: number
	y: number
	vx: number
	vy: number
	lastX: number
	lastY: number
	lastT: number
	has: boolean
}

type PrismConfig = {
	speed: number
	intensity: number
	interact: boolean
	fadeAlpha: number
	sides: number
	lineWidth: number
}

type PrismaProps = {
	speed: number
	intensity: number
	interact: boolean
	fadeAlpha: number
	background: string
	sides: number
	lineWidth: number
	style?: CSSProperties
}

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n))
}

function Prism(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	mouse: MouseState,
	time: number,
	config: PrismConfig
) {
	// motion blur / trailing
	ctx.fillStyle = `rgba(10,10,10,${clamp(config.fadeAlpha, 0, 1)})`
	ctx.fillRect(0, 0, w, h)

	if (!config.interact) return

	const baseSides = Math.max(3, Math.round(config.sides || 6))
	const speedMag = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy)
	const vel = clamp(speedMag / 1500, 0, 1)
	const sideDelta = Math.round(clamp(mouse.vx / 700 + mouse.vy / 700, -4, 4) * vel)
	const sides = clamp(baseSides + sideDelta, 3, 12)
	const radius = 24 * config.intensity + speedMag * 0.02

	ctx.save()
	ctx.translate(mouse.x, mouse.y)
	ctx.rotate(time * config.speed + vel * 0.35)
	ctx.beginPath()

	for (let i = 0; i < sides; i++) {
		const a = (i / sides) * Math.PI * 2
		const wobble = 1 + Math.sin(time * 3 + i * 1.7 + mouse.x * 0.01 + mouse.y * 0.01) * 0.28 * vel
		const r = radius * wobble
		const px = Math.cos(a) * r
		const py = Math.sin(a) * r
		if (i === 0) ctx.moveTo(px, py)
		else ctx.lineTo(px, py)
	}

	ctx.closePath()
	ctx.strokeStyle = `hsla(${time * 50}, 80%, 60%, 0.6)`
	ctx.lineWidth = Math.max(0.5, config.lineWidth || 2)
	ctx.stroke()
	ctx.restore()
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Prisma(props: PrismaProps) {
	const {
		speed,
		intensity,
		interact,
		fadeAlpha,
		background,
		sides,
		lineWidth,
		style,
	} = props

	const containerRef = useRef<HTMLDivElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const rafRef = useRef<number | null>(null)

	const mouseRef = useRef<MouseState>({
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		lastX: 0,
		lastY: 0,
		lastT: 0,
		has: false,
	})

	const configRef = useRef<PrismConfig>({
		speed,
		intensity,
		interact,
		fadeAlpha,
		sides,
		lineWidth,
	})

	useEffect(() => {
		configRef.current = { speed, intensity, interact, fadeAlpha, sides, lineWidth }
	}, [speed, intensity, interact, fadeAlpha, sides, lineWidth])

	const isStatic = useIsStaticRenderer()
	const inView = useInView(containerRef, { amount: 0.05 })

	const prefersReducedMotion = useMemo(() => {
		if (typeof window === "undefined") return false
		return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
	}, [])

	useEffect(() => {
		if (typeof window === "undefined") return
		const win = window as unknown as Window
		if (isStatic) return
		if (!inView) return
		if (prefersReducedMotion) return

		const canvas = canvasRef.current
		const container = containerRef.current
		if (!canvas || !container) return

		const ctx = canvas.getContext("2d")
		if (!ctx) return

		let dpr = Math.max(1, Math.min(2, win.devicePixelRatio || 1))

		const resize = () => {
			const rect = container.getBoundingClientRect()
			const w = Math.max(1, Math.floor(rect.width))
			const h = Math.max(1, Math.floor(rect.height))
			dpr = Math.max(1, Math.min(2, win.devicePixelRatio || 1))
			canvas.width = Math.floor(w * dpr)
			canvas.height = Math.floor(h * dpr)
			canvas.style.width = `${w}px`
			canvas.style.height = `${h}px`
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

			// Initialize mouse to center on first paint for nicer look
			const m = mouseRef.current
			if (!m.has) {
				m.x = w / 2
				m.y = h / 2
				m.lastX = m.x
				m.lastY = m.y
				m.lastT = performance.now()
				m.vx = 0
				m.vy = 0
				m.has = true
			}
		}

		resize()

		let ro: ResizeObserver | null = null
		if ("ResizeObserver" in win) {
			ro = new ResizeObserver(() => resize())
			ro.observe(container)
		} else {
			win.addEventListener("resize", resize)
		}

		const handlePointerMove = (e: PointerEvent) => {
			const rect = container.getBoundingClientRect()
			const x = e.clientX - rect.left
			const y = e.clientY - rect.top

			const now = performance.now()
			const m = mouseRef.current

			const dt = Math.max(8, now - (m.lastT || now)) // ms
			const vx = ((x - m.lastX) / dt) * 1000
			const vy = ((y - m.lastY) / dt) * 1000

			m.x = x
			m.y = y
			m.vx = clamp(vx, -2500, 2500)
			m.vy = clamp(vy, -2500, 2500)
			m.lastX = x
			m.lastY = y
			m.lastT = now
			m.has = true
		}

		const handlePointerLeave = () => {
			const m = mouseRef.current
			m.vx *= 0.6
			m.vy *= 0.6
		}

		container.addEventListener("pointermove", handlePointerMove, { passive: true })
		container.addEventListener("pointerleave", handlePointerLeave, { passive: true })

		const t0 = performance.now()

		// Paint initial background once so the trail starts from the chosen background color
		ctx.fillStyle = background
		ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)

		const loop = () => {
			const rect = container.getBoundingClientRect()
			const w = Math.max(1, rect.width)
			const h = Math.max(1, rect.height)

			// decay velocity a bit for a smoother feel
			const m = mouseRef.current
			m.vx *= 0.92
			m.vy *= 0.92

			const time = (performance.now() - t0) / 1000
			Prism(ctx, w, h, m, time, configRef.current)

			rafRef.current = win.requestAnimationFrame(loop)
		}

		rafRef.current = win.requestAnimationFrame(loop)

		return () => {
			if (rafRef.current != null) win.cancelAnimationFrame(rafRef.current)
			rafRef.current = null

			container.removeEventListener("pointermove", handlePointerMove)
			container.removeEventListener("pointerleave", handlePointerLeave)

			if (ro) ro.disconnect()
			else win.removeEventListener("resize", resize)
		}
	}, [isStatic, inView, prefersReducedMotion, background])

	// Static render: draw once (no interaction), still showing the prism centered
	useEffect(() => {
		if (typeof window === "undefined") return
		const win = window as unknown as Window
		if (!isStatic) return

		const canvas = canvasRef.current
		const container = containerRef.current
		if (!canvas || !container) return

		const ctx = canvas.getContext("2d")
		if (!ctx) return

		const rect = container.getBoundingClientRect()
		const w = Math.max(1, Math.floor(rect.width))
		const h = Math.max(1, Math.floor(rect.height))
		const dpr = Math.max(1, Math.min(2, win.devicePixelRatio || 1))

		canvas.width = Math.floor(w * dpr)
		canvas.height = Math.floor(h * dpr)
		canvas.style.width = `${w}px`
		canvas.style.height = `${h}px`
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

		ctx.fillStyle = background
		ctx.fillRect(0, 0, w, h)

		const m: MouseState = {
			x: w / 2,
			y: h / 2,
			vx: 0,
			vy: 0,
			lastX: w / 2,
			lastY: h / 2,
			lastT: 0,
			has: true,
		}

		Prism(ctx, w, h, m, 2.4, {
			speed,
			intensity,
			interact: true,
			fadeAlpha: clamp(fadeAlpha, 0, 1),
			sides,
			lineWidth,
		})
	}, [isStatic, background, speed, intensity, fadeAlpha, sides, lineWidth])

	return (
		<div
			ref={containerRef}
			style={{
				...style,
				position: "relative",
				width: "100%",
				height: "100%",
				overflow: "hidden",
				touchAction: "none",
				background,
			}}
			aria-label="Animated prism background"
			role="img"
		>
			<canvas
				ref={canvasRef}
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					display: "block",
				}}
			/>
		</div>
	)
}

addPropertyControls(Prisma, {
	speed: {
		type: ControlType.Number,
		title: "Speed",
		defaultValue: 2,
		min: 0,
		max: 8,
		step: 0.1,
	},
	intensity: {
		type: ControlType.Number,
		title: "Intensity",
		defaultValue: 0.8,
		min: 0,
		max: 3,
		step: 0.05,
	},
	interact: {
		type: ControlType.Boolean,
		title: "Interact",
		description: "Enable cursor reaction (movement changes shape + size).",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	fadeAlpha: {
		type: ControlType.Number,
		title: "Trail",
		description: "How quickly the previous frames fade. Lower = longer trails.",
		defaultValue: 0.05,
		min: 0,
		max: 0.35,
		step: 0.01,
	},
	background: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#000000",
	},
	sides: {
		type: ControlType.Number,
		title: "Sides",
		description: "Base polygon sides. Cursor speed will add/subtract sides.",
		defaultValue: 4,
		min: 3,
		max: 12,
		step: 1,
	},
	lineWidth: {
		type: ControlType.Number,
		title: "Line",
		description: "Stroke thickness of the prism outline.",
		defaultValue: 2,
		min: 0.5,
		max: 8,
		step: 0.5,
	},
})