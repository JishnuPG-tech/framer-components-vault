import { useState, useCallback, startTransition, useRef, useEffect, type CSSProperties, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type React from "react"

interface ListItem {
	title: string
	externalUrl: string
	internalPage: string
}

interface SoundListProps {
	title: string
	items: ListItem[]
	backgroundColor: string
	textColor: string
	hoverBackgroundColor: string
	hoverTextColor: string
	dividerColor: string
	arrowColor: string
	hoverArrowColor: string
	font: any
	titleFont: any
	transition: any
	itemPadding: number
	gap: number
	arrowSize: number
	enableSounds: boolean
	hoverSoundVolume: number
	clickSoundVolume: number
	soundPreset: string
	blockExternalLinks: boolean
	style?: CSSProperties
}

// Move presets outside component to avoid recreation
const SOUND_PRESETS: Record<string, Array<{ frequency: number; type: OscillatorType; duration: number }>> = {
	deep: [
		{ frequency: 150, type: "sine", duration: 0.08 },
		{ frequency: 120, type: "triangle", duration: 0.1 },
		{ frequency: 80, type: "sine", duration: 0.12 },
	],
	retro: [
		{ frequency: 440, type: "square", duration: 0.05 },
		{ frequency: 330, type: "square", duration: 0.06 },
		{ frequency: 220, type: "sawtooth", duration: 0.07 },
	],
	minimal: [
		{ frequency: 200, type: "sine", duration: 0.04 },
		{ frequency: 200, type: "sine", duration: 0.05 },
		{ frequency: 180, type: "sine", duration: 0.03 },
	],
	futuristic: [
		{ frequency: 600, type: "sine", duration: 0.03 },
		{ frequency: 800, type: "triangle", duration: 0.04 },
		{ frequency: 1000, type: "sine", duration: 0.02 },
	],
	nature: [
		{ frequency: 350, type: "sine", duration: 0.06 },
		{ frequency: 280, type: "sine", duration: 0.08 },
		{ frequency: 420, type: "triangle", duration: 0.05 },
	],
	lofi: [
		{ frequency: 180, type: "sine", duration: 0.1 },
		{ frequency: 220, type: "sine", duration: 0.12 },
		{ frequency: 160, type: "triangle", duration: 0.08 },
	],
	glass: [
		{ frequency: 1200, type: "sine", duration: 0.04 },
		{ frequency: 1600, type: "sine", duration: 0.05 },
		{ frequency: 2000, type: "sine", duration: 0.03 },
	],
	glitch: [
		{ frequency: 50, type: "sawtooth", duration: 0.02 },
		{ frequency: 800, type: "square", duration: 0.015 },
		{ frequency: 200, type: "sawtooth", duration: 0.025 },
	],
	brutalism: [
		{ frequency: 120, type: "sine", duration: 0.12 },
		{ frequency: 100, type: "sine", duration: 0.15 },
		{ frequency: 140, type: "sine", duration: 0.1 },
	],
}

// Helper to validate URLs - only allow safe schemes
function isValidExternalUrl(url: string): boolean {
	if (!url) return false
	try {
		const urlObj = new URL(url)
		return urlObj.protocol === "https:" || urlObj.protocol === "http:"
	} catch {
		return false
	}
}

// Helper to format ease value for CSS - moved outside component
function formatEase(ease: string | number[] | undefined): string {
	if (!ease) return "ease-out"
	if (Array.isArray(ease)) {
		return `cubic-bezier(${ease.join(", ")})`
	}
	return ease.replace(/([A-Z])/g, "-$1").toLowerCase()
}

/**
 * Interactive Brand List
 *
 * A high-contrast interactive list with hover-triggered color inversion
 * and northeast arrow navigation indicators.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SoundList(props: SoundListProps) {
	const isStatic = useIsStaticRenderer()
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

	// Detect reduced motion preference - skip in static mode
	useEffect(() => {
		if (typeof window === "undefined" || isStatic) return
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
		setPrefersReducedMotion(mediaQuery.matches)
		const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
		mediaQuery.addEventListener("change", handleChange)
		return () => mediaQuery.removeEventListener("change", handleChange)
	}, [isStatic])

	const {
		title = "CREATIVE BRANDS WE'VE HELPED_",
		items = [
			{ title: "Backhouse", externalUrl: "#", internalPage: "" },
			{ title: "Mammoth Murals", externalUrl: "#", internalPage: "" },
			{ title: "Supersolid", externalUrl: "#", internalPage: "" },
			{ title: "OH Architecture", externalUrl: "#", internalPage: "" },
			{ title: "HISS (University of Sydney)", externalUrl: "#", internalPage: "" },
			{ title: "Squiggle (University of Sydney)", externalUrl: "#", internalPage: "" },
			{ title: "BlueBrown Partners", externalUrl: "#", internalPage: "" },
			{ title: "SEBAI", externalUrl: "#", internalPage: "" },
			{ title: "MLV Ignite", externalUrl: "#", internalPage: "" },
		],
		backgroundColor = "#0a0a0a",
		textColor = "#ffffff",
		hoverBackgroundColor = "#e5e5e5",
		hoverTextColor = "#0a0a0a",
		dividerColor = "#333333",
		arrowColor = "#ffffff",
		hoverArrowColor = "#0a0a0a",
		font,
		titleFont,
		transition,
		itemPadding = 8,
		gap = 0,
		arrowSize = 14,
		enableSounds = true,
		hoverSoundVolume = 0.1,
		clickSoundVolume = 0.2,
		soundPreset = "deep",
		blockExternalLinks = false,
	} = props

	const [activeIndex, setActiveIndex] = useState<number | null>(null)
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
	const [noLinkIndex, setNoLinkIndex] = useState<number | null>(null)
	const [showNoLinkMessage, setShowNoLinkMessage] = useState<number | null>(null)
	const [isTitleHidden, setIsTitleHidden] = useState<number | null>(null)

	// Audio context for sound effects
	const audioContextRef = useRef<AudioContext | null>(null)
	const noLinkTimeoutRef = useRef<number | null>(null)
	const hideMessageTimeoutRef = useRef<number | null>(null)
	const showTitleTimeoutRef = useRef<number | null>(null)

	const getAudioContext = useCallback(() => {
		if (typeof window === "undefined") return null
		if (!audioContextRef.current) {
			try {
				audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
			} catch (e) {
				return null
			}
		}
		return audioContextRef.current
	}, [])

	// Play one of 3 sounds randomly based on selected preset
	const playSound = useCallback((volume: number) => {
		if (!enableSounds || typeof window === "undefined") return
		
		try {
			const ctx = getAudioContext()
			if (!ctx) return

			// Randomly select one of 3 sound variations
			const soundIndex = Math.floor(Math.random() * 3)

			const oscillator = ctx.createOscillator()
			const gainNode = ctx.createGain()

			oscillator.connect(gainNode)
			gainNode.connect(ctx.destination)

			// Sound preset configurations
			const preset = SOUND_PRESETS[soundPreset] || SOUND_PRESETS.deep
			const config = preset[soundIndex]

			oscillator.frequency.value = config.frequency
			oscillator.type = config.type
			gainNode.gain.setValueAtTime(volume, ctx.currentTime)
			gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration)

			oscillator.start(ctx.currentTime)
			oscillator.stop(ctx.currentTime + config.duration)
		} catch (e) {
			// Silently ignore audio errors
		}
	}, [enableSounds, getAudioContext, soundPreset])

	const duration = prefersReducedMotion ? 0 : (transition?.duration ?? 0.2)
	const ease = formatEase(transition?.ease)

	// Pre-compute transition strings - instant when reduced motion preferred
	const bgTransition = prefersReducedMotion ? "none" : `background-color ${duration}s ${ease}`
	const paddingTransition = prefersReducedMotion ? "none" : `padding ${duration}s ${ease}`
	const colorTransition = prefersReducedMotion ? "none" : `color ${duration}s ${ease}`
	const transformTransition = prefersReducedMotion ? "none" : `transform ${duration}s ${ease}`
	const opacityTransition = prefersReducedMotion ? "none" : `opacity ${duration}s ${ease}`

	// Pre-compute combined transition for items
	const itemTransition = prefersReducedMotion ? "none" : `${bgTransition}, ${paddingTransition}`
	const textTransition = prefersReducedMotion ? "none" : `${colorTransition}, ${opacityTransition}`
	const arrowTransition = prefersReducedMotion ? "none" : `${colorTransition}, ${transformTransition}, ${opacityTransition}`
	const noLinkTransition = prefersReducedMotion
		? "none"
		: `left ${duration}s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out`

	// Memoize font size calculation
	const noLinkFontSize = useMemo(() => {
		if (!font?.fontSize) return "23px"
		const size = parseInt(font.fontSize)
		return isNaN(size) ? "23px" : `${size - 1}px`
	}, [font?.fontSize])

	// Show "no link" error animation - moved before handleClick to fix hoisting issue
	const showNoLinkError = useCallback((index: number) => {
		// Clear any existing timeouts
		if (noLinkTimeoutRef.current) {
			window.clearTimeout(noLinkTimeoutRef.current)
		}
		if (hideMessageTimeoutRef.current) {
			window.clearTimeout(hideMessageTimeoutRef.current)
		}
		if (showTitleTimeoutRef.current) {
			window.clearTimeout(showTitleTimeoutRef.current)
		}

		startTransition(() => {
			setNoLinkIndex(index)
			setIsTitleHidden(index)
		})

		// Show message after title hides
		noLinkTimeoutRef.current = window.setTimeout(() => {
			startTransition(() => setShowNoLinkMessage(index))
		}, 200)

		// Hide message
		hideMessageTimeoutRef.current = window.setTimeout(() => {
			startTransition(() => setShowNoLinkMessage(null))
		}, 2000)

		// Show title again
		showTitleTimeoutRef.current = window.setTimeout(() => {
			startTransition(() => {
				setIsTitleHidden(null)
				setNoLinkIndex(null)
			})
		}, 2400)
	}, [])

	const handleMouseEnter = useCallback((index: number) => {
		if (isStatic) return
		startTransition(() => setHoveredIndex(index))
		playSound(hoverSoundVolume)
	}, [playSound, hoverSoundVolume, isStatic])

	const handleMouseLeave = useCallback(() => {
		if (isStatic) return
		startTransition(() => {
			setHoveredIndex(null)
			setActiveIndex(null)
		})
	}, [isStatic])

	

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (noLinkTimeoutRef.current) {
				window.clearTimeout(noLinkTimeoutRef.current)
			}
			if (hideMessageTimeoutRef.current) {
				window.clearTimeout(hideMessageTimeoutRef.current)
			}
			if (showTitleTimeoutRef.current) {
				window.clearTimeout(showTitleTimeoutRef.current)
			}
		}
	}, [])

	const containerStyle: CSSProperties = {
		width: "100%",
		height: "100%",
		backgroundColor,
		padding: "0",
		display: "flex",
		flexDirection: "column",
		overflow: "hidden",
	}

	const titleStyle: CSSProperties = {
		color: "#888888",
		fontSize: "13px",
		letterSpacing: "0.15em",
		fontWeight: 400,
		textTransform: "uppercase",
		marginBottom: "8px",
		marginTop: 0,
		marginLeft: 0,
		marginRight: 0,
		...titleFont,
	}

	const listStyle: CSSProperties = {
		listStyle: "none",
		margin: 0,
		padding: 0,
		display: "flex",
		flexDirection: "column",
		flex: 1,
		overflow: "auto",
	}

	return (
		<div style={containerStyle}>
			<h2 style={titleStyle}>{title}</h2>
			<ul style={listStyle}>
				{items.map((item, index) => {
					const isHovered = hoveredIndex === index
					const isActive = activeIndex === index
					const isHighlighted = isHovered || isActive
					const isShowingNoLink = noLinkIndex === index
					const isTitleVisible = isTitleHidden !== index

					// Determine valid link for href using strict URL validation
					const hasInternalLink = item.internalPage && item.internalPage !== ""
					const hasExternalLink = isValidExternalUrl(item.externalUrl)
					const href = hasInternalLink ? item.internalPage : (hasExternalLink ? item.externalUrl : "#")

					const textStyle: CSSProperties = {
						color: isHighlighted ? hoverTextColor : textColor,
						transition: `${colorTransition}, ${opacityTransition}`,
						margin: 0,
						display: "flex",
						alignItems: "center",
						lineHeight: 1,
						opacity: isTitleVisible ? 1 : 0,
						...font,
					}

					const arrowStyle: CSSProperties = {
						color: isHighlighted ? hoverArrowColor : arrowColor,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						transition: `${colorTransition}, ${transformTransition}, ${opacityTransition}`,
						transform: isHighlighted ? "translate(2px, -2px)" : "translate(0, 0)",
						fontFamily: "system-ui, sans-serif",
						fontSize: `${arrowSize}px`,
						opacity: isTitleVisible ? 1 : 0,
					}

					const noLinkStyle: CSSProperties = {
						position: "absolute",
						left: isHighlighted ? itemPadding : 0,
						top: "50%",
						transform: showNoLinkMessage === index
							? "translateY(-50%) scale(1)"
							: "translateY(0%) scale(0.95)",
						color: isHighlighted ? hoverTextColor : textColor,
						fontSize: noLinkFontSize,
						fontWeight: font?.fontWeight ?? 500,
						fontFamily: font?.fontFamily,
						letterSpacing: font?.letterSpacing,
						lineHeight: font?.lineHeight ?? 1,
						opacity: showNoLinkMessage === index ? 1 : 0,
						pointerEvents: "none",
						whiteSpace: "nowrap",
						zIndex: 10,
						transition: noLinkTransition,
					}

					// Common wrapper styles
					const wrapperBaseStyle: CSSProperties = {
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: `${itemPadding}px ${isHighlighted ? 10 : 0}px`,
						borderBottom: `1px solid ${dividerColor}`,
						cursor: hasInternalLink || hasExternalLink ? "pointer" : "default",
						backgroundColor: isHighlighted ? hoverBackgroundColor : "transparent",
						marginTop: index === 0 ? 0 : `${gap}px`,
						willChange: "transform",
						transition: `${bgTransition}, ${paddingTransition}`,
						textDecoration: "none",
					}

					// Internal Link - Framer Link (anchor tag, no click handler)
					if (hasInternalLink) {
						return (
							<li
								key={index}
								style={{ position: "relative" }}
								onMouseEnter={() => handleMouseEnter(index)}
								onMouseLeave={handleMouseLeave}
							>
								<a
									href={item.internalPage}
									style={wrapperBaseStyle}
									onClick={() => playSound(clickSoundVolume)}
								>
									<span style={textStyle}>{item.title}</span>
									<span style={arrowStyle} aria-hidden="true">
										↗
									</span>
								</a>
							</li>
						)
					}

					// External Link - Normal anchor with target blank
					if (hasExternalLink) {
						return (
							<li
								key={index}
								style={{ position: "relative" }}
								onMouseEnter={() => handleMouseEnter(index)}
								onMouseLeave={handleMouseLeave}
							>
								<a
									href={blockExternalLinks ? "#" : item.externalUrl}
									target="_blank"
									rel="noopener noreferrer"
									style={wrapperBaseStyle}
									onClick={(e) => {
										playSound(clickSoundVolume)
										if (blockExternalLinks) {
											e.preventDefault()
											showNoLinkError(index)
										}
									}}
								>
									<span style={textStyle}>{item.title}</span>
									<span style={arrowStyle} aria-hidden="true">
										↗
									</span>
									{blockExternalLinks && (
										<div style={noLinkStyle}>
											Connect to a link or page.
										</div>
									)}
								</a>
							</li>
						)
					}

					// No Link - Fallback div (not clickable)
					return (
						<li
							key={index}
							style={{ position: "relative" }}
							onMouseEnter={() => handleMouseEnter(index)}
							onMouseLeave={handleMouseLeave}
						>
							<div
								style={{
									...wrapperBaseStyle,
									cursor: "default",
								}}
								onClick={() => showNoLinkError(index)}
							>
								<span style={textStyle}>{item.title}</span>
								<span style={arrowStyle} aria-hidden="true">
									↗
								</span>
								<div style={noLinkStyle}>
									Connect to a link or page.
								</div>
							</div>
						</li>
					)
				})}
			</ul>
		</div>
	)
}

addPropertyControls(SoundList, {
	title: {
		type: ControlType.String,
		title: "Title",
		defaultValue: "CREATIVE BRANDS WE'VE HELPED_",
		displayTextArea: false,
	},
	items: {
		type: ControlType.Array,
		title: "Brand Items",
		control: {
			type: ControlType.Object,
			controls: {
				title: {
					type: ControlType.String,
					title: "Brand Name",
					defaultValue: "Brand Name",
				},
				internalPage: {
					type: ControlType.Link,
					title: "Internal Page",
				},
				externalUrl: {
					type: ControlType.String,
					title: "External URL",
					placeholder: "https://example.com",
				},
			},
		},
		defaultValue: [
			{ title: "Backhouse", externalUrl: "#", internalPage: "" },
			{ title: "Mammoth Murals", externalUrl: "#", internalPage: "" },
			{ title: "Supersolid", externalUrl: "#", internalPage: "" },
			{ title: "OH Architecture", externalUrl: "#", internalPage: "" },
			{ title: "HISS (University of Sydney)", externalUrl: "#", internalPage: "" },
			{ title: "Squiggle (University of Sydney)", externalUrl: "#", internalPage: "" },
			{ title: "BlueBrown Partners", externalUrl: "#", internalPage: "" },
			{ title: "SEBAI", externalUrl: "#", internalPage: "" },
			{ title: "MLV Ignite", externalUrl: "#", internalPage: "" },
		],
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#0a0a0a",
	},
	textColor: {
		type: ControlType.Color,
		title: "Text Color",
		defaultValue: "#ffffff",
	},
	hoverBackgroundColor: {
		type: ControlType.Color,
		title: "Hover Background",
		defaultValue: "#e5e5e5",
	},
	hoverTextColor: {
		type: ControlType.Color,
		title: "Hover Text",
		defaultValue: "#0a0a0a",
	},
	dividerColor: {
		type: ControlType.Color,
		title: "Divider Color",
		defaultValue: "#333333",
	},
	arrowColor: {
		type: ControlType.Color,
		title: "Arrow Color",
		defaultValue: "#ffffff",
	},
	hoverArrowColor: {
		type: ControlType.Color,
		title: "Hover Arrow",
		defaultValue: "#0a0a0a",
	},
	font: {
		type: ControlType.Font,
		title: "Item Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "24px",
			variant: "Medium",
			letterSpacing: "-0.02em",
			lineHeight: "1.2em",
		},
	},
	titleFont: {
		type: ControlType.Font,
		title: "Title Font",
		controls: "extended",
		defaultFontType: "monospace",
		defaultValue: {
			fontSize: "13px",
			letterSpacing: "0.15em",
			lineHeight: "1em",
		},
	},
	transition: {
		type: ControlType.Transition,
		title: "Hover Transition",
	},
	itemPadding: {
		type: ControlType.Number,
		title: "Item Padding",
		defaultValue: 8,
		min: 0,
		max: 48,
		step: 4,
		unit: "px",
	},
	gap: {
		type: ControlType.Number,
		title: "List Gap",
		defaultValue: 0,
		min: 0,
		max: 24,
		step: 1,
		unit: "px",
	},
	arrowSize: {
		type: ControlType.Number,
		title: "Arrow Size",
		defaultValue: 14,
		min: 10,
		max: 32,
		step: 1,
		unit: "px",
	},
	enableSounds: {
		type: ControlType.Boolean,
		title: "Sound Effects",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	hoverSoundVolume: {
		type: ControlType.Number,
		title: "Hover Volume",
		defaultValue: 0.1,
		min: 0,
		max: 1,
		step: 0.05,
		hidden: ({ enableSounds }) => !enableSounds,
	},
	clickSoundVolume: {
		type: ControlType.Number,
		title: "Click Volume",
		defaultValue: 0.2,
		min: 0,
		max: 1,
		step: 0.05,
		hidden: ({ enableSounds }) => !enableSounds,
	},
	soundPreset: {
		type: ControlType.Enum,
		title: "Sound Preset",
		options: ["deep", "retro", "minimal", "futuristic", "nature", "lofi", "glass", "glitch", "brutalism"],
		defaultValue: "deep",
		hidden: ({ enableSounds }) => !enableSounds,
	},
	blockExternalLinks: {
		type: ControlType.Boolean,
		title: "Block External Links",
		defaultValue: false,
		enabledTitle: "Yes",
		disabledTitle: "No",
	},
})