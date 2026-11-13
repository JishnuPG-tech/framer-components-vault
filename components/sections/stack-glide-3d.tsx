import * as React from "react"
import { useEffect, useRef, useState } from "react"
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
 * StackGlide — 3D diagonal card stack driven by page scroll or drag.
 * Connect a Collection List (or any stack of cards) to the "Cards" slot.
 * Layer names inside a card:
 *  - "Details": hidden in the card, shown in the side panel for the card in focus
 *  - "CTA": optional button, shown only on the card in focus
 *  - "Info": caption, shown only on the card in focus
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */

type Mode = "scroll" | "drag"

interface CardOpts { width: number; height: number; radius: number; shadow: string }
interface PathOpts {
	spacingX: number
	spacingY: number
	depth: number
	offsetX: number
	offsetY: number
	visible: number
	fadeRight: number
	fadeLeft: number
	focusScale: number
	layering: "active" | "depth"
}
interface TiltOpts { x: number; y: number; z: number; perspective: number }
interface HoverOpts { enabled: boolean; lift: number; scale: number; tilt: number; sides: boolean }
interface MotionOpts { smoothing: number; hold: number; scrollPerCard: number; snap: number }
interface DragOpts { loop: boolean; autoplay: boolean; interval: number; pauseOnHover: boolean; wheel: boolean }
interface ArrowOpts { show: boolean; color: string; fill: string; size: number; place: "card" | "bottom"; gap: number; offset: number }
interface PanelOpts { show: boolean; layer: string; width: number; x: number; y: number; align: "top" | "center" | "bottom" }
interface LayerOpts { cta: boolean; ctaLayer: string; info: string; rise: number }
interface ManualItem {
	image?: { src?: string; srcSet?: string; alt?: string } | string
	video?: string
	label?: string
	title?: string
	description?: string
	cta?: string
	link?: string
}
interface ManualOpts {
	radius: number
	fit: "cover" | "contain"
	background: string
	gap: number
	labelFont: React.CSSProperties
	labelColor: string
	titleFont: React.CSSProperties
	titleColor: string
	textFont: React.CSSProperties
	textColor: string
	ctaFont: React.CSSProperties
	ctaFill: string
	ctaColor: string
	newTab: boolean
}

interface Props {
	mode: Mode
	source: "cms" | "manual"
	content?: React.ReactNode
	items: ManualItem[]
	manual: Partial<ManualOpts>
	card: Partial<CardOpts>
	path: Partial<PathOpts>
	tilt: Partial<TiltOpts>
	hover: Partial<HoverOpts>
	panel: Partial<PanelOpts>
	layers: Partial<LayerOpts>
	motion: Partial<MotionOpts>
	drag: Partial<DragOpts>
	arrows: Partial<ArrowOpts>
	activeVideoOnly: boolean
	minHeight: number
	clip: boolean
	previewIndex: number
	style?: React.CSSProperties
}

const DEF = {
	card: { width: 380, height: 480, radius: 0, shadow: "rgba(0,0,0,0)" } as CardOpts,
	path: {
		spacingX: 104,
		spacingY: -12,
		depth: 160,
		offsetX: 0,
		offsetY: 0,
		visible: 4,
		fadeRight: 20,
		fadeLeft: 20,
		focusScale: 10,
		layering: "active",
	} as PathOpts,
	tilt: { x: 10, y: -22, z: -4, perspective: 1800 } as TiltOpts,
	hover: { enabled: true, lift: 50, scale: 3, tilt: 8, sides: true } as HoverOpts,
	panel: { show: true, layer: "Details", width: 380, x: 48, y: 48, align: "top" } as PanelOpts,
	layers: { cta: true, ctaLayer: "CTA", info: "Info", rise: 12 } as LayerOpts,
	motion: { smoothing: 0.85, hold: 0.4, scrollPerCard: 70, snap: 1 } as MotionOpts,
	drag: { loop: false, autoplay: false, interval: 4, pauseOnHover: true, wheel: true } as DragOpts,
	arrows: { show: false, color: "#FFFFFF", fill: "rgba(17,17,17,0.9)", size: 44, place: "card", gap: 48, offset: 24 } as ArrowOpts,
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const px = (v: number) => v + "px"
const byName = (name: string) => "[data-framer-name=\"" + String(name).replace(/"/g, '\\"') + "\"]"

// Euler (CSS rotateX→rotateY→rotateZ) to one axis-angle for the "rotate" property.
// Individual transform properties keep Framer's own "transform" (appear effects etc.) intact.
type Q = [number, number, number, number]
const qMul = (a: Q, b: Q): Q => [
	a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
	a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
	a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
	a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
]
const qAxis = (x: number, y: number, z: number, deg: number): Q => {
	const h = (deg * Math.PI) / 360
	const s = Math.sin(h)
	return [Math.cos(h), x * s, y * s, z * s]
}
function tiltToRotate(rx: number, ry: number, rz: number): string {
	let [w, x, y, z] = qMul(qMul(qAxis(1, 0, 0, rx), qAxis(0, 1, 0, ry)), qAxis(0, 0, 1, rz))
	if (w < 0) [w, x, y, z] = [-w, -x, -y, -z]
	const s = Math.sqrt(Math.max(0, 1 - w * w))
	if (s < 1e-6) return "none"
	const angle = (2 * Math.acos(clamp(w, -1, 1)) * 180) / Math.PI
	return [(x / s).toFixed(5), (y / s).toFixed(5), (z / s).toFixed(5), angle.toFixed(3) + "deg"].join(" ")
}

const FONT = "Lora, Georgia, serif"
const PLACEHOLDERS = [
	["#1f2a24", "#6f8f6a", "Field Notes", "Branding", "A quiet identity system for a nature journal."],
	["#2b1d16", "#c9774a", "Ember Studio", "Web", "Portfolio site for a ceramics studio in Lisbon."],
	["#141a2b", "#6b84c9", "Northline", "Product", "Booking flow redesign that cut drop-off by a third."],
	["#2a2418", "#d4b26a", "Sunday Goods", "E-commerce", "A calm, editorial shop for slow homeware."],
	["#23182a", "#a77bc4", "Lumen App", "Mobile", "Sleep tracking app with a soft, low-light UI."],
	["#172626", "#5fb3a6", "Tidewater", "Editorial", "Long-form magazine layouts for a coastal quarterly."],
]
const DEFAULT_ITEMS: ManualItem[] = PLACEHOLDERS.map(([, , title, label, description]) => ({
	label,
	title,
	description,
	cta: "See more",
	link: "",
}))
const DEF_MANUAL: ManualOpts = {
	radius: 14,
	fit: "cover",
	background: "#EEEEEE",
	gap: 10,
	labelFont: {},
	labelColor: "#777777",
	titleFont: {},
	titleColor: "#111111",
	textFont: {},
	textColor: "#555555",
	ctaFont: {},
	ctaFill: "#FFFFFF",
	ctaColor: "#111111",
	newTab: false,
}

// Framer's untouched serif font control returns Noto Serif: treat that as "use the default" (Lora)
const pickFont = (f?: React.CSSProperties): React.CSSProperties => {
	const out: React.CSSProperties = { ...(f || {}) }
	if (!out.fontFamily || /Noto Serif/.test(String(out.fontFamily))) out.fontFamily = FONT
	return out
}

const imgSrc = (im: ManualItem["image"]) => (!im ? "" : typeof im === "string" ? im : im.src || "")

// Built-in cards for manual input (no CMS). Same layer names as CMS cards: CTA and Details.
function ManualCards({ items, opts, autoPlay }: { items?: ManualItem[]; opts?: Partial<ManualOpts>; autoPlay: boolean }) {
	const m = { ...DEF_MANUAL, ...opts }
	const list = items && items.length ? items : DEFAULT_ITEMS
	const fill: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: m.fit }
	return (
		<div>
			{list.map((it, i) => {
				const p = PLACEHOLDERS[i % PLACEHOLDERS.length]
				const src = imgSrc(it.image)
				const alt = (typeof it.image === "object" && it.image && it.image.alt) || it.title || ""
				const srcSet = typeof it.image === "object" && it.image ? it.image.srcSet : undefined
				const hasMedia = !!(src || it.video)
				const ctaText = it.cta || (it.link ? "See more" : "")
				const ctaStyle: React.CSSProperties = {
					position: "absolute",
					left: 16,
					bottom: 16,
					padding: "10px 16px",
					borderRadius: 999,
					background: m.ctaFill,
					color: m.ctaColor,
					fontFamily: FONT,
					fontSize: 14,
					lineHeight: 1.2,
					textDecoration: "none",
					...pickFont(m.ctaFont),
				}
				return (
					<div key={i} style={{ display: "flex", flexDirection: "column" }}>
						<div
							style={{
								flex: 1,
								position: "relative",
								borderRadius: m.radius,
								overflow: "hidden",
								background: hasMedia ? m.background : "linear-gradient(140deg, " + p[1] + " 0%, " + p[0] + " 100%)",
							}}
						>
							{it.video ? (
								<video
									src={it.video}
									poster={src || undefined}
									muted
									loop
									playsInline
									autoPlay={autoPlay}
									preload="metadata"
									style={fill}
								/>
							) : src ? (
								<img src={src} srcSet={srcSet} alt={alt} draggable={false} style={fill} />
							) : null}
							{ctaText ? (
								it.link ? (
									<a
										data-framer-name="CTA"
										href={it.link}
										target={m.newTab ? "_blank" : undefined}
										rel={m.newTab ? "noopener noreferrer" : undefined}
										style={ctaStyle}
									>
										{ctaText}
									</a>
								) : (
									<div data-framer-name="CTA" style={ctaStyle}>
										{ctaText}
									</div>
								)
							) : null}
						</div>
						<div data-framer-name="Details" style={{ display: "flex", flexDirection: "column", gap: m.gap }}>
							{it.label ? (
								<div
									style={{
										fontFamily: FONT,
										fontSize: 13,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: m.labelColor,
										...pickFont(m.labelFont),
									}}
								>
									{it.label}
								</div>
							) : null}
							{it.title ? (
								<div style={{ fontFamily: FONT, fontSize: 44, lineHeight: 1, color: m.titleColor, ...pickFont(m.titleFont) }}>
									{it.title}
								</div>
							) : null}
							{it.description ? (
								<div style={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.5, color: m.textColor, ...pickFont(m.textFont) }}>
									{it.description}
								</div>
							) : null}
						</div>
					</div>
				)
			})}
		</div>
	)
}

export default function StackGlide(props: Props) {
	const { mode = "scroll", content, style } = props
	const motion = { ...DEF.motion, ...props.motion }
	const arrows = { ...DEF.arrows, ...props.arrows }
	const panel = { ...DEF.panel, ...props.panel }
	const minHeight = props.minHeight ?? 720

	const isCanvas = RenderTarget.current() === RenderTarget.canvas
	const slot = Array.isArray(content) ? content[0] : content
	const hasSlot = React.isValidElement(slot)
	const manualSource = props.source === "manual"
	const useSlot = !manualSource && hasSlot
	const live = !isCanvas
	const scrollMode = mode === "scroll" && live

	const rootRef = useRef<HTMLDivElement>(null)
	const stageRef = useRef<HTMLDivElement>(null)
	const holderRef = useRef<HTMLDivElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)
	const arrowsRef = useRef<HTMLDivElement>(null)
	const [count, setCount] = useState(
		useSlot ? 1 : manualSource && props.items && props.items.length ? props.items.length : DEFAULT_ITEMS.length
	)

	// Latest props for the animation loop without restarting it
	const cfg = useRef(props)
	const version = useRef(0)
	cfg.current = props
	version.current++

	const control = useRef<{ step: (dir: number) => void }>({ step: () => {} })

	useEffect(() => {
		const root = rootRef.current
		const stage = stageRef.current
		const holder = holderRef.current
		const panelEl = panelRef.current
		if (!root || !stage || !holder || !panelEl) return

		let list: HTMLElement | null = null
		let items: HTMLElement[] = []
		let needsScan = true
		let raf = 0
		let last = performance.now()
		let lastKey = ""
		let sw = stage.clientWidth
		let sh = stage.clientHeight
		let inView = true
		let rotCache = { key: "", value: "none" }
		let panelIdx = -1
		let panelSig = ""
		const hv: number[] = []
		const htx: number[] = []
		const hty: number[] = []
		const reduced =
			typeof window !== "undefined" &&
			!!window.matchMedia &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches

		const p0 = clamp(Math.round(cfg.current.previewIndex || 0), 0, 999)
		const startHere = isCanvas || cfg.current.mode === "drag"
		const st = {
			pos: startHere ? p0 : 0,
			target: startHere ? p0 : 0,
			vel: 0,
			down: false,
			dragging: false,
			justDragged: false,
			startX: 0,
			startY: 0,
			startPos: 0,
			lastX: 0,
			lastT: 0,
			unit: 1,
			hover: false,
			hoverIdx: -1,
			hx: 0,
			hy: 0,
			lastInteract: performance.now(),
			wheelAcc: 0,
			wheelLock: 0,
			fallback: false,
		}

		const opts = () => {
			const c = cfg.current
			return {
				mode: (c.mode || "scroll") as Mode,
				card: { ...DEF.card, ...c.card },
				path: { ...DEF.path, ...c.path },
				tilt: { ...DEF.tilt, ...c.tilt },
				hover: { ...DEF.hover, ...c.hover },
				panel: { ...DEF.panel, ...c.panel },
				layers: { ...DEF.layers, ...c.layers },
				motion: { ...DEF.motion, ...c.motion },
				drag: { ...DEF.drag, ...c.drag },
				arrows: { ...DEF.arrows, ...c.arrows },
				activeVideoOnly: c.activeVideoOnly !== false,
				previewIndex: c.previewIndex || 0,
			}
		}

		// Find the list inside the slot: walk down single-child wrappers until a node has several children.
		const scan = () => {
			needsScan = false
			let el = holder.firstElementChild as HTMLElement | null
			const chain: HTMLElement[] = []
			let depth = 0
			while (el && el.children.length === 1 && depth < 6) {
				chain.push(el)
				el = el.firstElementChild as HTMLElement | null
				depth++
			}
			if (!el) {
				list = null
				items = []
				return
			}
			for (const c of chain) {
				c.style.width = "100%"
				c.style.height = "100%"
				c.style.position = "relative"
				c.style.overflow = "visible"
			}
			list = el
			const ls = list.style
			ls.position = "relative"
			ls.display = "block"
			ls.width = "100%"
			ls.height = "100%"
			ls.padding = "0"
			ls.overflow = "visible"
			ls.perspectiveOrigin = "50% 50%"
			items = (Array.from(list.children) as HTMLElement[]).filter(
				(c) => c instanceof HTMLElement && getComputedStyle(c).display !== "none"
			)
			for (const it of items) {
				const s = it.style
				s.position = "absolute"
				s.left = "50%"
				s.top = "50%"
				s.transformOrigin = "50% 50%"
				s.willChange = "translate, rotate, scale, opacity"
				s.userSelect = "none"
				s.setProperty("-webkit-user-drag", "none")
				it.querySelectorAll("img").forEach((img) => img.setAttribute("draggable", "false"))
			}
			setCount((n) => (n === items.length ? n : items.length))
			lastKey = ""
			panelSig = ""
		}

		const isLoop = (o: ReturnType<typeof opts>) => o.mode === "drag" && o.drag.loop && items.length > 2 && live

		const activeIndex = () => {
			const n = items.length
			if (!n) return 0
			const r = Math.round(st.pos)
			return isLoop(opts()) ? ((r % n) + n) % n : clamp(r, 0, n - 1)
		}

		// Side panel: shows a copy of the focused card's "Details" layer, cross-fading on change
		const updatePanel = (o: ReturnType<typeof opts>) => {
			const narrow = sw < 640
			const ps = panelEl.style
			ps.display = o.panel.show ? "block" : "none"
			if (!o.panel.show) return
			const pad = narrow ? 20 : o.panel.x
			ps.left = px(pad)
			ps.width = narrow ? "calc(100% - " + pad * 2 + "px)" : px(o.panel.width)
			const align = narrow ? "top" : o.panel.align
			ps.top = align === "top" ? px(narrow ? 24 : o.panel.y) : align === "center" ? "50%" : "auto"
			ps.bottom = align === "bottom" ? px(o.panel.y) : "auto"
			ps.translate = align === "center" ? "0 -50%" : "0 0"

			const idx = activeIndex()
			const sig = idx + "|" + o.panel.layer + "|" + items.length
			if (sig === panelSig) return
			const firstRender = panelSig === "" && panelIdx === -1
			panelSig = sig
			const dir = panelIdx === -1 ? 1 : idx >= panelIdx ? 1 : -1
			panelIdx = idx
			const src = items[idx] && (items[idx].querySelector(byName(o.panel.layer)) as HTMLElement | null)

			const old = Array.from(panelEl.children) as HTMLElement[]
			old.forEach((c) => {
				c.style.transition = "opacity 0.3s ease, translate 0.3s ease"
				c.style.opacity = "0"
				c.style.translate = "0 " + px(-12 * dir)
				c.style.position = "absolute"
				c.style.left = "0"
				c.style.right = "0"
				c.style.top = "0"
				setTimeout(() => c.remove(), 320)
			})
			if (!src) return
			const wrap = document.createElement("div")
			const clone = src.cloneNode(true) as HTMLElement
			clone.removeAttribute("aria-hidden")
			const cs = clone.style
			cs.display = clone.dataset.sgDisplay || ""
			cs.position = "relative"
			cs.left = cs.top = cs.right = cs.bottom = "auto"
			cs.width = "100%"
			cs.height = "auto"
			cs.opacity = "1"
			cs.translate = "none"
			cs.transform = "none"
			cs.visibility = "visible"
			wrap.appendChild(clone)
			wrap.style.opacity = firstRender || reduced ? "1" : "0"
			wrap.style.translate = firstRender || reduced ? "0 0" : "0 " + px(14 * dir)
			panelEl.appendChild(wrap)
			if (!firstRender && !reduced) {
				requestAnimationFrame(() =>
					requestAnimationFrame(() => {
						wrap.style.transition = "opacity 0.45s ease 0.08s, translate 0.55s cubic-bezier(.2,.7,.2,1) 0.08s"
						wrap.style.opacity = "1"
						wrap.style.translate = "0 0"
					})
				)
			}
		}

		const layout = () => {
			if (!list || !items.length) return
			const o = opts()
			const n = items.length
			// Space reserved for the panel (on phones it sits above the cards) and the arrows (below)
			const narrow = sw < 640
			const topRes = narrow && o.panel.show && panelEl.childElementCount ? 24 + panelEl.offsetHeight + 16 : 0
			const botRes = o.arrows.show && o.arrows.place === "card" ? o.arrows.size + o.arrows.gap * 0.6 : 0
			const key = [st.pos.toFixed(4), sw, sh, version.current, n, topRes].join("|")
			if (key === lastKey) return
			lastKey = key

			// Shrink everything on small stages (mobile)
			const availH = Math.max(120, sh - topRes - botRes)
			const s = clamp(Math.min(1, sw / (o.card.width * (narrow ? 1.4 : 1.7)), availH / (o.card.height * 1.25)), 0.35, 1)
			const W = o.card.width * s
			const H = o.card.height * s
			const ox = narrow ? 0 : o.path.offsetX * s
			const oy = (narrow ? 0 : o.path.offsetY * s) + (topRes - botRes) / 2
			st.unit = Math.abs((o.path.spacingX / 100) * W) > 20 ? (o.path.spacingX / 100) * W : W * 0.6
			list.style.perspective = px(Math.max(100, o.tilt.perspective * s))
			list.style.perspectiveOrigin = "calc(50% + " + px(ox) + ") calc(50% + " + px(oy) + ")"

			const rk = [o.tilt.x, o.tilt.y, o.tilt.z].join("|")
			if (rotCache.key !== rk) rotCache = { key: rk, value: tiltToRotate(o.tilt.x, o.tilt.y, o.tilt.z) }
			const loop = isLoop(o)
			const vis = Math.max(1, o.path.visible)
			const infoSel = byName(o.layers.info || "Info")
			const ctaSel = byName(o.layers.ctaLayer || "CTA")
			const detailSel = byName(o.panel.layer || "Details")
			const fadeR = clamp(o.path.fadeRight, 0, 100) / 100
			const fadeL = clamp(o.path.fadeLeft, 0, 100) / 100

			for (let i = 0; i < n; i++) {
				const it = items[i]
				let d = i - st.pos
				if (loop) {
					d = ((d % n) + n) % n
					if (d > n / 2) d -= n
				}
				const ad = Math.abs(d)
				let op = ad <= vis ? 1 : Math.max(0, 1 - (ad - vis))
				// Each step away from focus drops opacity by Fade % (1st card 80%, 2nd 60%, ...)
				op *= Math.max(0, 1 - (d > 0 ? fadeR : fadeL) * ad)
				const h = hv[i] || 0
				const x = ox + d * (o.path.spacingX / 100) * W
				const y = oy + d * (o.path.spacingY / 100) * H
				const z = d * o.path.depth * s + h * o.hover.lift * s
				const s2 = it.style
				s2.width = px(W)
				s2.height = px(H)
				s2.marginLeft = px(-W / 2)
				s2.marginTop = px(-H / 2)
				s2.translate = [px(+x.toFixed(2)), px(+y.toFixed(2)), px(+z.toFixed(2))].join(" ")
				s2.rotate =
					h > 0.001
						? tiltToRotate(o.tilt.x + (hty[i] || 0), o.tilt.y + (htx[i] || 0), o.tilt.z)
						: rotCache.value
				// Focused card is bigger than the rest
				const focus = 1 + (clamp(o.path.focusScale, 0, 100) / 100) * clamp(1 - ad, 0, 1)
				s2.scale = (focus * (1 + (h * o.hover.scale) / 100)).toFixed(4)
				s2.opacity = Math.min(1, op + h * (1 - op) * 0.6).toFixed(3)
				const zBase =
					o.path.layering === "depth" && o.path.depth !== 0 ? 1000 + Math.round(z / 5) : 1000 - Math.round(ad * 10)
				s2.zIndex = String(zBase + Math.round(h * 30))
				s2.visibility = op < 0.002 ? "hidden" : "visible"
				s2.pointerEvents = op < 0.05 ? "none" : "auto"
				s2.cursor = ad >= 0.5 && live ? "pointer" : ""
				if (o.card.radius > 0) {
					s2.borderRadius = px(o.card.radius * s)
					s2.overflow = "hidden"
				}
				const hasShadow = !!o.card.shadow && !/rgba\([^)]*,0\)$/.test(o.card.shadow.replace(/\s/g, ""))
				s2.boxShadow = hasShadow ? ["0", px((24 + h * 16) * s), px((60 + h * 30) * s), o.card.shadow].join(" ") : ""

				const active = ad < 0.5
				const wasActive = it.dataset.sgActive === "1"
				it.dataset.sgActive = active ? "1" : "0"
				it.setAttribute("aria-hidden", active ? "false" : "true")

				// Focus-only layers
				const io = clamp(1 - ad * 2.5, 0, 1)
				const rise = "0px " + px(+((1 - io) * o.layers.rise).toFixed(2))
				it.querySelectorAll<HTMLElement>(infoSel).forEach((el) => {
					el.style.opacity = io.toFixed(3)
					el.style.translate = rise
					el.style.pointerEvents = io > 0.5 ? "auto" : "none"
				})
				it.querySelectorAll<HTMLElement>(ctaSel).forEach((el) => {
					el.style.display = o.layers.cta ? "" : "none"
					el.style.opacity = io.toFixed(3)
					el.style.translate = rise
					el.style.pointerEvents = io > 0.5 ? "auto" : "none"
				})
				if (o.panel.show)
					it.querySelectorAll<HTMLElement>(detailSel).forEach((el) => {
						if (el.dataset.sgDisplay === undefined) el.dataset.sgDisplay = el.style.display || ""
						el.style.display = "none"
					})

				if (o.activeVideoOnly && active !== wasActive && live) {
					it.querySelectorAll("video").forEach((v) => {
						if (active) {
							v.muted = true
							const p = v.play()
							if (p && p.catch) p.catch(() => {})
						} else v.pause()
					})
				}
			}
			updatePanel(o)

			// Arrows sit a fixed gap below the focused card (or at the stage bottom)
			const ar = arrowsRef.current
			if (ar) {
				const as = ar.style
				as.left = "calc(50% + " + px(ox) + ")"
				if (o.arrows.place === "bottom") {
					as.top = "auto"
					as.bottom = px(o.arrows.offset)
				} else {
					const grow = 1 + clamp(o.path.focusScale, 0, 100) / 100
					const rz = Math.abs((o.tilt.z * Math.PI) / 180)
					const half = (H / 2) * Math.cos(rz) + (W / 2) * Math.sin(rz)
					const cardBottom = sh / 2 + oy + half * grow * 1.06
					as.bottom = "auto"
					as.top = px(Math.min(sh - o.arrows.size - 8, cardBottom + o.arrows.gap * Math.max(s, 0.6)))
				}
				as.opacity = "1"
			}
		}

		const goTo = (idx: number) => {
			const o = opts()
			const n = items.length
			if (!n) return
			st.lastInteract = performance.now()
			if (o.mode === "scroll" && live) {
				const r = root.getBoundingClientRect()
				const scrollable = Math.max(1, r.height - window.innerHeight)
				const top = window.scrollY + r.top + (n > 1 ? (clamp(idx, 0, n - 1) / (n - 1)) * scrollable : 0)
				window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" })
				return
			}
			if (isLoop(o)) {
				const cur = ((Math.round(st.target) % n) + n) % n
				let d = idx - cur
				if (d > n / 2) d -= n
				if (d < -n / 2) d += n
				st.target = Math.round(st.target) + d
			} else st.target = clamp(idx, 0, n - 1)
		}

		const step = (dir: number) => {
			const n = items.length
			if (!n) return
			const o = opts()
			if (isLoop(o)) {
				st.lastInteract = performance.now()
				st.target = Math.round(st.target) + dir
				return
			}
			const cur = o.mode === "drag" ? Math.round(st.target) : activeIndex()
			goTo(cur + dir)
		}
		control.current.step = step

		const stickyCheck = (r: DOMRect, vh: number) => {
			if (!st.fallback) {
				const top = stage.getBoundingClientRect().top
				const expected = r.top > 0 ? r.top : Math.min(0, r.top + r.height - vh)
				if (r.top < -10 && r.top + r.height - vh > 10 && Math.abs(top - expected) > 4) {
					// An ancestor breaks position: sticky (overflow hidden). Pin manually.
					st.fallback = true
					stage.style.position = "absolute"
					stage.style.top = "0px"
					stage.style.left = "0px"
				}
			}
			if (st.fallback) {
				const off = clamp(-r.top, 0, Math.max(0, r.height - vh))
				stage.style.transform = "translate3d(0, " + px(off) + ", 0)"
			}
		}

		// Ease hover amount and pointer tilt per card
		const animateHover = (o: ReturnType<typeof opts>, dt: number) => {
			const n = items.length
			const k = reduced ? 1 : 1 - Math.pow(0.82, dt * 60)
			const act = activeIndex()
			let moving = false
			for (let i = 0; i < n; i++) {
				const on = o.hover.enabled && st.hoverIdx === i && !st.dragging && (o.hover.sides || i === act)
				const tH = on ? 1 : 0
				const tX = on ? st.hx * o.hover.tilt : 0
				const tY = on ? -st.hy * o.hover.tilt : 0
				const h0 = hv[i] || 0
				const x0 = htx[i] || 0
				const y0 = hty[i] || 0
				hv[i] = h0 + (tH - h0) * k
				htx[i] = x0 + (tX - x0) * k
				hty[i] = y0 + (tY - y0) * k
				if (Math.abs(hv[i] - tH) < 0.001) hv[i] = tH
				if (Math.abs(hv[i] - h0) > 1e-4 || Math.abs(htx[i] - x0) > 1e-3 || Math.abs(hty[i] - y0) > 1e-3) moving = true
			}
			if (moving) lastKey = ""
		}

		const tick = (t: number) => {
			raf = requestAnimationFrame(tick)
			const dt = Math.min(0.05, Math.max(0.001, (t - last) / 1000))
			last = t
			if (needsScan) scan()
			const n = items.length
			if (!n) return
			const o = opts()

			if (!live) {
				st.pos = st.target = clamp(Math.round(o.previewIndex), 0, n - 1)
			} else if (o.mode === "scroll") {
				const r = root.getBoundingClientRect()
				const vh = window.innerHeight
				stickyCheck(r, vh)
				if (!inView) return
				const scrollable = Math.max(1, r.height - vh)
				const p = clamp(-r.top / scrollable, 0, 1)
				const raw = p * Math.max(0, n - 1)
				// "Hold" keeps each card parked for part of its scroll distance
				const h = clamp(o.motion.hold, 0, 0.95)
				const fl = Math.floor(raw)
				let f = clamp((raw - fl - h / 2) / (1 - h), 0, 1)
				f = f * f * (3 - 2 * f)
				st.target = Math.min(n - 1, fl + f)
				const sm = clamp(o.motion.smoothing, 0, 0.98)
				const k = reduced ? 1 : 1 - Math.pow(sm, dt * 60)
				st.pos += (st.target - st.pos) * k
				if (Math.abs(st.target - st.pos) < 0.0005) st.pos = st.target
			} else {
				if (!inView) return
				const now = performance.now()
				if (
					o.drag.autoplay &&
					!st.down &&
					!(o.drag.pauseOnHover && st.hover) &&
					now - st.lastInteract > Math.max(0.5, o.drag.interval) * 1000
				) {
					if (!isLoop(o) && Math.round(st.target) >= n - 1) goTo(0)
					else step(1)
					st.lastInteract = now
				}
				if (!isLoop(o) && !st.dragging) st.target = clamp(st.target, 0, n - 1)
				if (!st.dragging) {
					if (reduced) {
						st.pos = st.target
						st.vel = 0
					} else {
						const stiff = 140 * clamp(o.motion.snap, 0.2, 4) ** 2
						const damp = 2 * Math.sqrt(stiff) * 0.95
						const acc = stiff * (st.target - st.pos) - damp * st.vel
						st.vel += acc * dt
						st.pos += st.vel * dt
						if (Math.abs(st.target - st.pos) < 0.0005 && Math.abs(st.vel) < 0.001) {
							st.pos = st.target
							st.vel = 0
						}
					}
				}
			}
			if (live) animateHover(o, dt)
			layout()
		}

		// Input
		const onDown = (e: PointerEvent) => {
			st.justDragged = false
			if (opts().mode !== "drag" || !live || e.button !== 0) return
			st.down = true
			st.dragging = false
			st.startX = st.lastX = e.clientX
			st.startY = e.clientY
			st.lastT = performance.now()
			st.startPos = st.pos
			st.vel = 0
		}
		const trackHover = (e: PointerEvent) => {
			if (e.pointerType === "touch") return
			const idx = items.findIndex((it) => it.contains(e.target as Node))
			st.hoverIdx = idx
			if (idx >= 0) {
				const r = items[idx].getBoundingClientRect()
				st.hx = clamp(((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1, -1, 1)
				st.hy = clamp(((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1, -1, 1)
			}
		}
		const onMove = (e: PointerEvent) => {
			trackHover(e)
			if (!st.down) return
			const dx = e.clientX - st.startX
			const dy = e.clientY - st.startY
			if (!st.dragging) {
				if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
					st.dragging = true
					st.startX = e.clientX
					st.startPos = st.pos
					try {
						stage.setPointerCapture(e.pointerId)
					} catch (err) {}
					stage.style.cursor = "grabbing"
				} else if (Math.abs(dy) > 10) st.down = false
				return
			}
			const n = items.length
			let np = st.startPos - (e.clientX - st.startX) / st.unit
			if (!isLoop(opts())) {
				if (np < 0) np = np * 0.35
				if (np > n - 1) np = n - 1 + (np - (n - 1)) * 0.35
			}
			const now = performance.now()
			const dtm = Math.max(1, now - st.lastT) / 1000
			const v = -(e.clientX - st.lastX) / st.unit / dtm
			st.vel = st.vel * 0.6 + v * 0.4
			st.lastX = e.clientX
			st.lastT = now
			st.pos = np
			st.target = np
			st.lastInteract = now
		}
		const onUp = () => {
			if (!st.down) return
			st.down = false
			if (!st.dragging) return
			st.dragging = false
			st.justDragged = true
			stage.style.cursor = "grab"
			const n = items.length
			let tgt = Math.round(st.pos + clamp(st.vel, -12, 12) * 0.16)
			if (!isLoop(opts())) tgt = clamp(tgt, 0, n - 1)
			st.target = tgt
			st.lastInteract = performance.now()
		}
		const onClick = (e: MouseEvent) => {
			if (st.justDragged) {
				st.justDragged = false
				e.preventDefault()
				e.stopPropagation()
				return
			}
			if (!live) return
			// Clicking a side card brings it to the center instead of following its link
			const idx = items.findIndex((it) => it.contains(e.target as Node))
			if (idx >= 0 && idx !== activeIndex()) {
				e.preventDefault()
				e.stopPropagation()
				goTo(idx)
			}
		}
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight" || e.key === "ArrowDown") {
				e.preventDefault()
				step(1)
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
				e.preventDefault()
				step(-1)
			}
		}
		const onWheel = (e: WheelEvent) => {
			const o = opts()
			if (o.mode !== "drag" || !o.drag.wheel || !live) return
			if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 2) return
			e.preventDefault()
			st.wheelAcc += e.deltaX
			const now = performance.now()
			if (now > st.wheelLock && Math.abs(st.wheelAcc) > 30) {
				step(Math.sign(st.wheelAcc))
				st.wheelAcc = 0
				st.wheelLock = now + 380
			}
		}
		const onEnter = () => {
			st.hover = true
		}
		const onLeave = () => {
			st.hover = false
			st.hoverIdx = -1
		}

		stage.addEventListener("pointerdown", onDown)
		stage.addEventListener("pointermove", onMove)
		stage.addEventListener("pointerup", onUp)
		stage.addEventListener("pointercancel", onUp)
		stage.addEventListener("click", onClick, true)
		stage.addEventListener("keydown", onKey)
		stage.addEventListener("wheel", onWheel, { passive: false })
		stage.addEventListener("pointerenter", onEnter)
		stage.addEventListener("pointerleave", onLeave)

		const ro =
			typeof ResizeObserver !== "undefined"
				? new ResizeObserver(() => {
						sw = stage.clientWidth
						sh = stage.clientHeight
						lastKey = ""
				  })
				: null
		ro?.observe(stage)

		// Re-scan when the CMS list renders, paginates or changes
		const mo =
			typeof MutationObserver !== "undefined"
				? new MutationObserver((records) => {
						for (const r of records) {
							if (r.type !== "childList") continue
							if (r.target === list || !list || !holder.contains(list)) {
								needsScan = true
								return
							}
							const cur = list
							if (Array.from(r.addedNodes).some((nd) => nd instanceof HTMLElement && !cur.contains(nd))) needsScan = true
							else panelSig = ""
						}
				  })
				: null
		mo?.observe(holder, { childList: true, subtree: true })

		const io =
			typeof IntersectionObserver !== "undefined"
				? new IntersectionObserver(
						([en]) => {
							inView = en.isIntersecting
						},
						{ rootMargin: "200px" }
				  )
				: null
		io?.observe(root)

		raf = requestAnimationFrame(tick)
		return () => {
			cancelAnimationFrame(raf)
			stage.removeEventListener("pointerdown", onDown)
			stage.removeEventListener("pointermove", onMove)
			stage.removeEventListener("pointerup", onUp)
			stage.removeEventListener("pointercancel", onUp)
			stage.removeEventListener("click", onClick, true)
			stage.removeEventListener("keydown", onKey)
			stage.removeEventListener("wheel", onWheel)
			stage.removeEventListener("pointerenter", onEnter)
			stage.removeEventListener("pointerleave", onLeave)
			ro?.disconnect()
			mo?.disconnect()
			io?.disconnect()
			stage.style.transform = ""
			panelEl.innerHTML = ""
		}
	}, [mode, isCanvas, useSlot])

	const slotEl = useSlot
		? React.cloneElement(slot as React.ReactElement<any>, {
				style: { ...((slot as any).props?.style || {}), width: "100%", height: "100%" },
		  })
		: null

	const trackHeight = scrollMode
		? "calc(100vh + " + Math.max(0, count - 1) * Math.max(10, motion.scrollPerCard) + "vh)"
		: "100%"

	const arrowBtn = (dir: number) => (
		<button
			type="button"
			aria-label={dir < 0 ? "Previous" : "Next"}
			onClick={(e) => {
				e.stopPropagation()
				control.current.step(dir)
			}}
			style={{
				width: arrows.size,
				height: arrows.size,
				borderRadius: arrows.size,
				border: "none",
				background: arrows.fill,
				color: arrows.color,
				display: "grid",
				placeItems: "center",
				cursor: "pointer",
				boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
				padding: 0,
			}}
		>
			<svg width={arrows.size * 0.4} height={arrows.size * 0.4} viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d={dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
					stroke="currentColor"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</button>
	)

	return (
		<div
			ref={rootRef}
			style={{
				...style,
				position: "relative",
				width: "100%",
				height: trackHeight,
				minHeight: scrollMode ? undefined : minHeight,
			}}
		>
			<div
				ref={stageRef}
				tabIndex={0}
				role="region"
				aria-roledescription="carousel"
				aria-label="Cards"
				style={{
					position: scrollMode ? "sticky" : "relative",
					top: 0,
					width: "100%",
					height: scrollMode ? "100vh" : "100%",
					minHeight: scrollMode ? undefined : minHeight,
					overflow: props.clip === false ? "visible" : "hidden",
					touchAction: mode === "drag" ? "pan-y" : "auto",
					cursor: mode === "drag" && live ? "grab" : undefined,
					outline: "none",
					userSelect: "none",
				}}
			>
				<div ref={holderRef} style={{ position: "absolute", inset: 0 }}>
					{slotEl || (
						<ManualCards
							items={manualSource ? props.items : undefined}
							opts={props.manual}
							autoPlay={live && props.activeVideoOnly === false}
						/>
					)}
				</div>
				<div
					ref={panelRef}
					aria-live="polite"
					style={{
						position: "absolute",
						zIndex: 4000,
						display: panel.show ? "block" : "none",
						cursor: "auto",
						userSelect: "text",
					}}
				/>
				{arrows.show && (
					<div
						ref={arrowsRef}
						style={{
							position: "absolute",
							opacity: 0,
							transform: "translateX(-50%)",
							display: "flex",
							gap: 10,
							zIndex: 5000,
						}}
					>
						{arrowBtn(-1)}
						{arrowBtn(1)}
					</div>
				)}
				{!manualSource && !hasSlot && isCanvas && (
					<div
						style={{
							position: "absolute",
							right: 16,
							top: 16,
							zIndex: 5000,
							padding: "6px 10px",
							borderRadius: 8,
							background: "rgba(0,153,255,0.12)",
							color: "#0077cc",
							fontFamily: "Inter, system-ui, sans-serif",
							fontSize: 12,
						}}
					>
						Connect a Collection List to “Cards”, or set Source to Manual
					</div>
				)}
			</div>
		</div>
	)
}

StackGlide.displayName = "StackGlide"

addPropertyControls(StackGlide, {
	mode: {
		type: ControlType.Enum,
		title: "Mode",
		options: ["scroll", "drag"],
		optionTitles: ["Scroll", "Drag"],
		displaySegmentedControl: true,
		defaultValue: "scroll",
		description: "Scroll: set Height to Fit. The section pins and page scroll moves the cards.",
	},
	source: {
		type: ControlType.Enum,
		title: "Source",
		options: ["cms", "manual"],
		optionTitles: ["CMS", "Manual"],
		displaySegmentedControl: true,
		defaultValue: "cms",
		description: "CMS: connect a Collection List or any stack of cards. Manual: add cards below.",
	},
	content: {
		type: ControlType.ComponentInstance,
		title: "Cards",
		hidden: (p: Props) => p.source === "manual",
	},
	items: {
		type: ControlType.Array,
		title: "Items",
		maxCount: 40,
		hidden: (p: Props) => p.source !== "manual",
		control: {
			type: ControlType.Object,
			controls: {
				image: { type: ControlType.ResponsiveImage, title: "Image" },
				video: { type: ControlType.File, title: "Video", allowedFileTypes: ["mp4", "webm", "mov"] },
				label: { type: ControlType.String, title: "Label", defaultValue: "Category" },
				title: { type: ControlType.String, title: "Title", defaultValue: "Project" },
				description: { type: ControlType.String, title: "Description", defaultValue: "", displayTextArea: true },
				cta: { type: ControlType.String, title: "CTA Text", defaultValue: "See more" },
				link: { type: ControlType.Link, title: "Link" },
			},
		},
		defaultValue: DEFAULT_ITEMS,
	},
	manual: {
		type: ControlType.Object,
		title: "Manual Style",
		hidden: (p: Props) => p.source !== "manual",
		controls: {
			radius: { type: ControlType.Number, title: "Radius", defaultValue: 14, min: 0, max: 200, step: 1, unit: "px" },
			fit: {
				type: ControlType.Enum,
				title: "Media Fit",
				options: ["cover", "contain"],
				optionTitles: ["Fill", "Fit"],
				displaySegmentedControl: true,
				defaultValue: "cover",
			},
			background: { type: ControlType.Color, title: "Media BG", defaultValue: "#EEEEEE" },
			gap: { type: ControlType.Number, title: "Text Gap", defaultValue: 10, min: 0, max: 80, step: 1, unit: "px" },
			labelFont: { type: ControlType.Font, title: "Label", controls: "extended", defaultFontType: "serif", defaultValue: { fontSize: 13 } },
			labelColor: { type: ControlType.Color, title: "Label Color", defaultValue: "#777777" },
			titleFont: { type: ControlType.Font, title: "Title", controls: "extended", defaultFontType: "serif", defaultValue: { fontSize: 44, lineHeight: "1em" } },
			titleColor: { type: ControlType.Color, title: "Title Color", defaultValue: "#111111" },
			textFont: { type: ControlType.Font, title: "Description", controls: "extended", defaultFontType: "serif", defaultValue: { fontSize: 16, lineHeight: "1.5em" } },
			textColor: { type: ControlType.Color, title: "Desc. Color", defaultValue: "#555555" },
			ctaFont: { type: ControlType.Font, title: "CTA", controls: "extended", defaultFontType: "serif", defaultValue: { fontSize: 14 } },
			ctaFill: { type: ControlType.Color, title: "CTA Fill", defaultValue: "#FFFFFF" },
			ctaColor: { type: ControlType.Color, title: "CTA Text", defaultValue: "#111111" },
			newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false },
		},
	},
	card: {
		type: ControlType.Object,
		title: "Card",
		controls: {
			width: { type: ControlType.Number, title: "Width", defaultValue: 380, min: 80, max: 1400, step: 1, unit: "px" },
			height: { type: ControlType.Number, title: "Height", defaultValue: 480, min: 80, max: 1400, step: 1, unit: "px" },
			radius: { type: ControlType.Number, title: "Radius", defaultValue: 0, min: 0, max: 200, step: 1, unit: "px" },
			shadow: { type: ControlType.Color, title: "Shadow", defaultValue: "rgba(0,0,0,0)" },
		},
	},
	panel: {
		type: ControlType.Object,
		title: "Side Panel",
		description: "Shows the focused card's layer named below (e.g. title + description).",
		controls: {
			show: { type: ControlType.Boolean, title: "Show", defaultValue: true },
			layer: { type: ControlType.String, title: "Layer Name", defaultValue: "Details" },
			width: { type: ControlType.Number, title: "Width", defaultValue: 380, min: 120, max: 1000, step: 1, unit: "px" },
			x: { type: ControlType.Number, title: "Left", defaultValue: 48, min: 0, max: 600, step: 1, unit: "px" },
			y: { type: ControlType.Number, title: "Edge Gap", defaultValue: 48, min: 0, max: 600, step: 1, unit: "px" },
			align: {
				type: ControlType.Enum,
				title: "Align",
				options: ["top", "center", "bottom"],
				optionTitles: ["Top", "Center", "Bottom"],
				displaySegmentedControl: true,
				defaultValue: "top",
			},
		},
	},
	layers: {
		type: ControlType.Object,
		title: "Card Layers",
		controls: {
			cta: { type: ControlType.Boolean, title: "CTA", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
			ctaLayer: { type: ControlType.String, title: "CTA Layer", defaultValue: "CTA" },
			info: { type: ControlType.String, title: "Info Layer", defaultValue: "Info" },
			rise: { type: ControlType.Number, title: "Rise", defaultValue: 12, min: 0, max: 80, step: 1, unit: "px" },
		},
	},
	path: {
		type: ControlType.Object,
		title: "Path",
		controls: {
			spacingX: { type: ControlType.Number, title: "Spacing X", defaultValue: 104, min: -200, max: 200, step: 1, unit: "%" },
			spacingY: { type: ControlType.Number, title: "Spacing Y", defaultValue: -12, min: -200, max: 200, step: 1, unit: "%" },
			depth: { type: ControlType.Number, title: "Depth", defaultValue: 160, min: -1200, max: 1200, step: 10, unit: "px" },
			offsetX: { type: ControlType.Number, title: "Shift X", defaultValue: 0, min: -800, max: 800, step: 1, unit: "px" },
			offsetY: { type: ControlType.Number, title: "Shift Y", defaultValue: 0, min: -800, max: 800, step: 1, unit: "px" },
			visible: { type: ControlType.Number, title: "Visible", defaultValue: 4, min: 1, max: 12, step: 1, displayStepper: true },
			fadeRight: { type: ControlType.Number, title: "Fade Right", defaultValue: 20, min: 0, max: 100, step: 1, unit: "%" },
			fadeLeft: { type: ControlType.Number, title: "Fade Left", defaultValue: 20, min: 0, max: 100, step: 1, unit: "%" },
			focusScale: { type: ControlType.Number, title: "Focus Size", defaultValue: 10, min: 0, max: 60, step: 1, unit: "%" },
			layering: {
				type: ControlType.Enum,
				title: "On Top",
				options: ["active", "depth"],
				optionTitles: ["Active", "Nearest"],
				displaySegmentedControl: true,
				defaultValue: "active",
			},
		},
	},
	tilt: {
		type: ControlType.Object,
		title: "Tilt",
		controls: {
			x: { type: ControlType.Number, title: "Rotate X", defaultValue: 10, min: -80, max: 80, step: 1, unit: "°" },
			y: { type: ControlType.Number, title: "Rotate Y", defaultValue: -22, min: -80, max: 80, step: 1, unit: "°" },
			z: { type: ControlType.Number, title: "Rotate Z", defaultValue: -4, min: -180, max: 180, step: 1, unit: "°" },
			perspective: { type: ControlType.Number, title: "Perspective", defaultValue: 1800, min: 200, max: 6000, step: 50, unit: "px" },
		},
	},
	hover: {
		type: ControlType.Object,
		title: "Hover",
		controls: {
			enabled: { type: ControlType.Boolean, title: "Enabled", defaultValue: true },
			lift: { type: ControlType.Number, title: "Lift", defaultValue: 50, min: 0, max: 300, step: 1, unit: "px" },
			scale: { type: ControlType.Number, title: "Scale", defaultValue: 3, min: 0, max: 30, step: 0.5, unit: "%" },
			tilt: { type: ControlType.Number, title: "Follow Tilt", defaultValue: 8, min: 0, max: 30, step: 1, unit: "°" },
			sides: { type: ControlType.Boolean, title: "Side Cards", defaultValue: true },
		},
	},
	motion: {
		type: ControlType.Object,
		title: "Motion",
		controls: {
			scrollPerCard: { type: ControlType.Number, title: "Scroll/Card", defaultValue: 70, min: 10, max: 300, step: 5, unit: "vh" },
			hold: { type: ControlType.Number, title: "Hold", defaultValue: 0.4, min: 0, max: 0.9, step: 0.05 },
			smoothing: { type: ControlType.Number, title: "Smoothing", defaultValue: 0.85, min: 0, max: 0.98, step: 0.01 },
			snap: { type: ControlType.Number, title: "Snap Speed", defaultValue: 1, min: 0.2, max: 4, step: 0.1 },
		},
	},
	drag: {
		type: ControlType.Object,
		title: "Drag",
		hidden: (p: Props) => p.mode !== "drag",
		controls: {
			loop: { type: ControlType.Boolean, title: "Loop", defaultValue: false },
			autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: false },
			interval: { type: ControlType.Number, title: "Interval", defaultValue: 4, min: 0.5, max: 20, step: 0.5, unit: "s" },
			pauseOnHover: { type: ControlType.Boolean, title: "Hover Pause", defaultValue: true },
			wheel: { type: ControlType.Boolean, title: "Trackpad", defaultValue: true },
		},
	},
	arrows: {
		type: ControlType.Object,
		title: "Arrows",
		controls: {
			show: { type: ControlType.Boolean, title: "Show", defaultValue: false },
			color: { type: ControlType.Color, title: "Icon", defaultValue: "#FFFFFF" },
			fill: { type: ControlType.Color, title: "Fill", defaultValue: "rgba(17,17,17,0.9)" },
			size: { type: ControlType.Number, title: "Size", defaultValue: 44, min: 24, max: 96, step: 1, unit: "px" },
			place: {
				type: ControlType.Enum,
				title: "Position",
				options: ["card", "bottom"],
				optionTitles: ["Below Card", "Bottom"],
				displaySegmentedControl: true,
				defaultValue: "card",
			},
			gap: { type: ControlType.Number, title: "Gap", defaultValue: 48, min: 0, max: 400, step: 1, unit: "px" },
			offset: { type: ControlType.Number, title: "Bottom", defaultValue: 24, min: 0, max: 400, step: 1, unit: "px" },
		},
	},
	activeVideoOnly: {
		type: ControlType.Boolean,
		title: "Videos",
		enabledTitle: "Active",
		disabledTitle: "All",
		defaultValue: true,
	},
	minHeight: {
		type: ControlType.Number,
		title: "Min Height",
		defaultValue: 720,
		min: 200,
		max: 2000,
		step: 10,
		unit: "px",
		description: "Stage height in Drag mode (with Fit height) and on the canvas.",
	},
	clip: { type: ControlType.Boolean, title: "Clip", defaultValue: true },
	previewIndex: {
		type: ControlType.Number,
		title: "Start Card",
		defaultValue: 1,
		min: 0,
		max: 50,
		step: 1,
		displayStepper: true,
		description: "First active card in Drag mode, and the card shown on the canvas.",
	},
})
