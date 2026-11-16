// ─────────────────────────────────────────────────────────────────────────────
//  SwiconHoverGallery — Framer Code Component
//  Horizontal hover-panel gallery with scramble text effect
//
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback, startTransition, type CSSProperties } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─── SCRAMBLE CHARS ──────────────────────────────────────────────────────────
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789•/"

// ─── SCRAMBLE HOOK ───────────────────────────────────────────────────────────
function useScramble(target, trigger, speed) {
    const [display, setDisplay] = useState(target)
    const frameRef = useRef(null)

    useEffect(() => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current)
        let iter = 0
        const total = (target || "").length * speed

        const step = () => {
            setDisplay(
                (target || "")
                    .split("")
                    .map((char, i) => {
                        if (char === " ") return " "
                        if (i < iter / speed) return char
                        return CHARS[Math.floor(Math.random() * CHARS.length)]
                    })
                    .join("")
            )
            iter++
            if (iter < total) frameRef.current = requestAnimationFrame(step)
            else setDisplay(target || "")
        }

        frameRef.current = requestAnimationFrame(step)
        return () => cancelAnimationFrame(frameRef.current)
    }, [trigger]) // eslint-disable-line react-hooks/exhaustive-deps

    return display
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
/**
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 1000
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SwiconHoverGallery(props) {
	const {
		cards,
		textSide = "left",
		backgroundColor = "#0a0a0a",
		textColor = "#ffffff",
		font,
		showSubLabel = true,
		showProgressDots = true,
		scrambleSpeed = 3,
		transitionDuration = 0.6,
		imageObjectFit = "cover",
		borderRadius = 0,
		gap = 0,
		customCursor = false,
		subLabelFont,
		style,
	} = props

	const safeCards =
		Array.isArray(cards) && cards.length > 0
			? cards
			: [
					{
						image: { src: "" },
						label: "SWICON",
						subLabel: "NO. 001",
						accentColor: "#f4c2c2",
					},
			  ]

	const [active, setActive] = useState(0)
	const [scrambleTrigger, setScrambleTrigger] = useState(0)
	const prevActiveRef = useRef(0)
	const [isMobile, setIsMobile] = useState(false)

	useEffect(() => {
		const checkMobile = () => {
			startTransition(() => setIsMobile(window.innerWidth < 768))
		}
		checkMobile()
		window.addEventListener("resize", checkMobile)
		return () => window.removeEventListener("resize", checkMobile)
	}, [])

	const clampedActive = Math.min(active, safeCards.length - 1)
	const card = safeCards[clampedActive]

	const imgSrc =
		card.image && typeof card.image === "object"
			? card.image.src
			: card.image || ""

	const handleHover = useCallback((panelIndex) => {
		if (panelIndex !== prevActiveRef.current) {
			prevActiveRef.current = panelIndex
			startTransition(() => {
				setActive(panelIndex)
				setScrambleTrigger((t) => t + 1)
			})
		}
	}, [])

	const handleClick = useCallback((panelIndex) => {
		if (panelIndex !== prevActiveRef.current) {
			prevActiveRef.current = panelIndex
			startTransition(() => {
				setActive(panelIndex)
				setScrambleTrigger((t) => t + 1)
			})
		}
	}, [])

	const label = useScramble(card.label || "", scrambleTrigger, scrambleSpeed)

	const isTextLeft = textSide === "left"

	const textPanel = (
		<div
			style={{
				width: isMobile ? "100%" : "50%",
				height: isMobile ? "50%" : "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexDirection: "column",
				position: "relative",
				background: backgroundColor,
				overflow: "hidden",
				flexShrink: 0,
			}}
		>
			{showSubLabel && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<p
						key={clampedActive + "-sub"}
						style={{
							letterSpacing: "-0.08em",
							color: textColor,
							...subLabelFont,
							fontSize: isMobile ? `calc(${subLabelFont.fontSize || "200px"} * 0.5)` : subLabelFont.fontSize,
							margin: 0,
							padding: 0,
							textAlign: "center",
							whiteSpace: "nowrap",
							opacity: 0.04,
						}}
					>
						{card.subLabel || ""}
					</p>
				</div>
			)}

			<div
				style={{
					padding: isMobile ? "0 24px" : "0 64px",
					userSelect: "none",
					width: "100%",
					boxSizing: "border-box",
					position: "relative",
					zIndex: 4,
				}}
			>
				<motion.h1
					key={clampedActive + "-label"}
					initial={{ opacity: 0, y: 0 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						duration: transitionDuration,
						delay: 0.05,
					}}
					style={{
						letterSpacing: "0.16em",
						color: textColor,
						margin: "0 0 18px 0",
						padding: 0,
						lineHeight: 1,
						...font,
						fontSize: isMobile ? `calc(${font.fontSize || "64px"} * 0.6)` : font.fontSize,
					}}
				>
					{label}
				</motion.h1>

				{showProgressDots && (
					<div
						style={{
							display: "flex",
							gap: 8,
							marginTop: isMobile ? 24 : 36,
							alignItems: "center",
						}}
					>
						{safeCards.map((_, i) => (
							<motion.div
								key={i}
								animate={{
									width: i === clampedActive ? 24 : 6,
									opacity: i === clampedActive ? 1 : 0.25,
									background: textColor,
								}}
								transition={{ duration: 0.3 }}
								style={{ height: 2, borderRadius: 2 }}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)

	const imagePanel = (
		<div
			style={{
				width: isMobile ? "100%" : "50%",
				height: isMobile ? "50%" : "100%",
				position: "relative",
				overflow: "hidden",
				flexShrink: 0,
			}}
		>
			<AnimatePresence mode="sync">
				<motion.div
					key={clampedActive}
					initial={{ clipPath: "inset(0 100% 0 0)" }}
					animate={{ clipPath: "inset(0 0% 0 0)" }}
					exit={{ clipPath: "inset(0 0 0 100%)" }}
					transition={{
						duration: transitionDuration + 0.1,
						ease: [0.76, 0, 0.24, 1],
					}}
					style={{ position: "absolute", inset: 0 }}
				>
					{imgSrc ? (
						<img
							src={imgSrc}
							alt={card.label}
							style={{
								width: "100%",
								height: "100%",
								objectFit: imageObjectFit,
								display: "block",
							}}
						/>
					) : (
						<div
							style={{
								width: "100%",
								height: "100%",
								background: card.accentColor || "#eee",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								...font,
								fontSize: 11,
								letterSpacing: "0.2em",
								color: "rgba(0,0,0,0.25)",
							}}
						>
							ADD IMAGE
						</div>
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	)

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				overflow: "hidden",
				display: "flex",
				flexDirection: isMobile ? "column" : "row",
				position: "relative",
				borderRadius,
				gap,
				cursor: customCursor && !isMobile ? "none" : "default",
				...style,
			}}
		>
			{isTextLeft && !isMobile ? (
				<>
					{textPanel}
					{imagePanel}
				</>
			) : !isTextLeft && !isMobile ? (
				<>
					{imagePanel}
					{textPanel}
				</>
			) : (
				<>
					{imagePanel}
					{textPanel}
				</>
			)}

			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					flexDirection: isMobile ? "column" : "row",
					zIndex: 20,
					pointerEvents: "all",
				}}
			>
				{safeCards.map((_, i) => (
					<div
						key={i}
						onMouseEnter={isMobile ? undefined : () => handleHover(i)}
						onClick={isMobile ? () => handleClick(i) : undefined}
						onTouchStart={isMobile ? () => handleClick(i) : undefined}
						style={{
							flex: 1,
							height: "100%",
							cursor: customCursor && !isMobile ? "none" : "pointer",
						}}
					/>
				))}
			</div>

			{customCursor && !isMobile && <CustomCursor color={textColor} />}
		</div>
	)
}

// ─── PROPERTY CONTROLS ────────────────────────────────────────────────────────
addPropertyControls(SwiconHoverGallery, {
	// ── Cards ──────────────────────────────────────────────────────────────
	cards: {
		type: ControlType.Array,
		title: "Cards",
		control: {
			type: ControlType.Object,
			controls: {
				image: {
					type: ControlType.ResponsiveImage,
					title: "Image",
				},
				label: {
					type: ControlType.String,
					title: "Label",
					defaultValue: "SWICON",
				},
				subLabel: {
					type: ControlType.String,
					title: "Sub Label",
					defaultValue: "NO. 001",
				},
				accentColor: {
					type: ControlType.Color,
					title: "Accent Color",
					defaultValue: "#f4c2c2",
				},
			},
		},
		defaultValue: [
			{
				image: {
					src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
					alt: "Gradient 1 - Blue",
				},
				label: "SWICON",
				subLabel: "001",
				accentColor: "#f4c2c2",
			},
			{
				image: {
					src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
					alt: "Gradient 2 - Purple",
				},
				label: "DESIGN",
				subLabel: "002",
				accentColor: "#c2d4f4",
			},
			{
				image: {
					src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
					alt: "Gradient 3 - Orange",
				},
				label: "MOTION",
				subLabel: "003",
				accentColor: "#f4d4c2",
			},
		],
	},
	// ── Layout ─────────────────────────────────────────────────────────────
	textSide: {
		type: ControlType.Enum,
		title: "Text Side",
		options: ["left", "right"],
		defaultValue: "left",
		displaySegmentedControl: true,
	},
	// ── Colors ─────────────────────────────────────────────────────────────
	backgroundColor: {
		type: ControlType.Color,
		title: "Background Color",
		defaultValue: "#0a0a0a",
	},
	textColor: {
		type: ControlType.Color,
		title: "Text Color",
		defaultValue: "#ffffff",
	},
	// ── Typography ─────────────────────────────────────────────────────────
	font: {
		type: ControlType.Font,
		title: "Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "24px",
			variant: "Regular",
			letterSpacing: "-0.04em",
			lineHeight: "1em",
		},
	},
	subLabelFont: {
		type: ControlType.Font,
		title: "Sub Label Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "300px",
			variant: "Regular",
			letterSpacing: "-0.08em",
			lineHeight: "0.9em",
		},
	},
	// ── Visibility ─────────────────────────────────────────────────────────
	showSubLabel: {
		type: ControlType.Boolean,
		title: "Show Sublabel",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	showProgressDots: {
		type: ControlType.Boolean,
		title: "Show Progress Dots",
		defaultValue: true,
		enabledTitle: "Show",
		disabledTitle: "Hide",
	},
	// ── Animation ──────────────────────────────────────────────────────────
	scrambleSpeed: {
		type: ControlType.Number,
		title: "Scramble Speed",
		defaultValue: 8,
		min: 1,
		max: 10,
		step: 1,
	},
	transitionDuration: {
		type: ControlType.Number,
		title: "Transition Duration",
		defaultValue: 0.6,
		min: 0.1,
		max: 2,
		step: 0.1,
		unit: "s",
	},
	// ── Image ──────────────────────────────────────────────────────────────
	imageObjectFit: {
		type: ControlType.Enum,
		title: "Image Object Fit",
		options: ["cover", "contain", "fill", "none", "scale-down"],
		defaultValue: "cover",
	},
	borderRadius: {
		type: ControlType.Number,
		title: "Border Radius",
		defaultValue: 0,
		min: 0,
		max: 50,
		step: 1,
		unit: "px",
	},
	gap: {
		type: ControlType.Number,
		title: "Gap",
		defaultValue: 0,
		min: 0,
		max: 50,
		step: 1,
		unit: "px",
	},
	// ── Cursor ─────────────────────────────────────────────────────────────
	customCursor: {
		type: ControlType.Boolean,
		title: "Custom Cursor",
		defaultValue: false,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
})

// ─── CUSTOM CURSOR ────────────────────────────────────────────────────────────
function CustomCursor({ color }) {
	const [pos, setPos] = useState({ x: -200, y: -200 })
	const [trail, setTrail] = useState({ x: -200, y: -200 })
	const posRef = useRef({ x: -200, y: -200 })
	const trailRef = useRef({ x: -200, y: -200 })
	const rafRef = useRef(null)

	useEffect(() => {
		const onMove = (e) => {
			posRef.current = { x: e.clientX, y: e.clientY }
			startTransition(() => setPos({ x: e.clientX, y: e.clientY }))
		}
		window.addEventListener("mousemove", onMove)

		const lerp = () => {
			trailRef.current = {
				x:
					trailRef.current.x +
					(posRef.current.x - trailRef.current.x) * 0.1,
				y:
					trailRef.current.y +
					(posRef.current.y - trailRef.current.y) * 0.1,
			}
			startTransition(() => setTrail({ ...trailRef.current }))
			rafRef.current = requestAnimationFrame(lerp)
		}
		rafRef.current = requestAnimationFrame(lerp)

		return () => {
			window.removeEventListener("mousemove", onMove)
			if (rafRef.current) cancelAnimationFrame(rafRef.current)
		}
	}, [])

	return (
		<>
			<div
				style={{
					position: "fixed",
					left: pos.x,
					top: pos.y,
					width: 7,
					height: 7,
					background: color,
					borderRadius: "50%",
					transform: "translate(-50%, -50%)",
					pointerEvents: "none",
					zIndex: 9999,
					mixBlendMode: "difference",
					willChange: "left, top",
				}}
			/>
			<div
				style={{
					position: "fixed",
					left: trail.x,
					top: trail.y,
					width: 30,
					height: 30,
					border: `1px solid ${color}`,
					borderRadius: "50%",
					opacity: 0.4,
					transform: "translate(-50%, -50%)",
					pointerEvents: "none",
					zIndex: 9998,
					willChange: "left, top",
				}}
			/>
		</>
	)
}