import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

type RevealDirection = "left" | "right" | "top" | "bottom" | "center"
type TriggerMode = "scroll" | "appear"
type StaticPreview = "revealed" | "hidden"
type FitMode = "cover" | "contain"

type ResponsiveImageLike = {
	src: string
	srcSet?: string
	alt?: string
}

type ClipPathRevealProps = {
	image?: ResponsiveImageLike
	direction: RevealDirection
	trigger: TriggerMode
	revealOnHover: boolean
	hoverBehavior: "reveal-hide" | "reveal-stay"
	scrollOnce: boolean
	inViewAmount: number

	transition: any
	delay: number

	borderRadius: string
	backgroundColor: string
	objectFit: FitMode
	staticPreview: StaticPreview

	style?: React.CSSProperties
}

/**
 * Instructions:
 * Create a Framer component that follows the Framer component rules and achieves the user's goal.
 * Goal:
 * Build a fully customizable Clip-Path Image Reveal Component for Framer using CSS clip-path and Framer Motion.
 * This component should allow users to create content swap / image reveal animations where images are revealed by animating the clip-path from a specified direction.
 * Component Name: ClipPath Reveal
 * Core Functionality:
 * Create a component that reveals an image by animating its CSS clip-path from hidden to fully visible.
 * The component must support:
 * Reveal on scroll into view
 * Reveal on appear
 * Reveal on hover (optional toggle)
 */

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ClipPathReveal(props: ClipPathRevealProps) {
	const {
		image = {
			src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
			alt: "Gradient 5 - Green",
		},
		direction,
		trigger,
		revealOnHover,
		hoverBehavior,
		scrollOnce,
		inViewAmount,
		transition,
		delay,
		borderRadius,
		backgroundColor,
		objectFit,
		staticPreview,
		style,
	} = props

	const isStatic = useIsStaticRenderer()
	const ref = React.useRef<HTMLDivElement>(null)

	const [inView, setInView] = React.useState(false)
	const [revealed, setRevealed] = React.useState(false)
	const [hovered, setHovered] = React.useState(false)

	// Replace framer-motion's useInView with an SSR-safe IntersectionObserver.
	React.useEffect(() => {
		if (isStatic) return
		if (typeof window === "undefined") return
		if (revealOnHover) return
		if (trigger !== "scroll") return

		const node = ref.current
		if (!node) return

		const amount = Math.max(0, Math.min(1, inViewAmount))

		let raf = 0
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0]
				// Throttle state updates slightly to avoid noisy observers in Canvas.
				if (raf) cancelAnimationFrame(raf)
				raf = requestAnimationFrame(() => {
					React.startTransition(() => setInView(!!entry?.isIntersecting && entry.intersectionRatio >= amount))
				})
			},
			{ threshold: [amount] },
		)

		observer.observe(node)

		return () => {
			if (raf) cancelAnimationFrame(raf)
			observer.disconnect()
		}
	}, [isStatic, revealOnHover, trigger, inViewAmount])

	const hiddenClipPath = React.useMemo(() => {
		switch (direction) {
			case "left":
				return "inset(0 100% 0 0)"
			case "right":
				return "inset(0 0 0 100%)"
			case "top":
				return "inset(100% 0 0 0)"
			case "bottom":
				return "inset(0 0 100% 0)"
			case "center":
				return "inset(50% 50% 50% 50%)"
			default:
				return "inset(0 100% 0 0)"
		}
	}, [direction])

	React.useEffect(() => {
		if (isStatic) return
		if (revealOnHover) return

		if (trigger === "appear") {
			React.startTransition(() => setRevealed(true))
		}
	}, [isStatic, revealOnHover, trigger])

	React.useEffect(() => {
		if (isStatic) return
		if (revealOnHover) return
		if (trigger !== "scroll") return

		if (inView) {
			React.startTransition(() => setRevealed(true))
		} else if (!scrollOnce) {
			React.startTransition(() => setRevealed(false))
		}
	}, [isStatic, revealOnHover, trigger, inView, scrollOnce])

	const isRevealed = React.useMemo(() => {
		if (isStatic) return staticPreview === "revealed"
		if (revealOnHover) {
			if (hoverBehavior === "reveal-stay") return hovered || revealed
			return hovered
		}
		return revealed
	}, [isStatic, staticPreview, revealOnHover, hoverBehavior, hovered, revealed])

	const resolvedTransition = React.useMemo(() => {
		const t = transition ?? {}
		const d = typeof delay === "number" ? Math.max(0, delay) : 0
		return { ...t, delay: (t?.delay ?? 0) + d }
	}, [transition, delay])

	const onMouseEnter = React.useCallback(() => {
		if (!revealOnHover || isStatic) return
		React.startTransition(() => {
			setHovered(true)
			if (hoverBehavior === "reveal-stay") setRevealed(true)
		})
	}, [revealOnHover, hoverBehavior, isStatic])

	const onMouseLeave = React.useCallback(() => {
		if (!revealOnHover || isStatic) return
		React.startTransition(() => {
			setHovered(false)
		})
	}, [revealOnHover, isStatic])

	return (
		<div
			ref={ref}
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				overflow: "hidden",
				borderRadius,
				backgroundColor,
				...style,
			}}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			aria-label={image?.alt || "Revealed image"}
			role="img"
		>
			<motion.img
				src={image?.src}
				srcSet={image?.srcSet}
				alt={image?.alt ?? ""}
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					objectFit,
					display: "block",
					clipPath: isRevealed ? "inset(0 0 0 0)" : hiddenClipPath,
					willChange: isStatic ? undefined : "clip-path",
					transform: "translateZ(0)",
				}}
				animate={
					isStatic
						? undefined
						: {
								clipPath: isRevealed ? "inset(0 0 0 0)" : hiddenClipPath,
						  }
				}
				transition={isStatic ? undefined : resolvedTransition}
				draggable={false}
			/>
		</div>
	)
}

addPropertyControls(ClipPathReveal, {
	image: {
		type: ControlType.ResponsiveImage,
		title: "Image",
	},
	direction: {
		type: ControlType.Enum,
		title: "Direction",
		options: ["left", "right", "top", "bottom", "center"],
		optionTitles: ["Left", "Right", "Top", "Bottom", "Center"],
		defaultValue: "left",
		displaySegmentedControl: true,
	},
	trigger: {
		type: ControlType.Enum,
		title: "Trigger",
		options: ["scroll", "appear"],
		optionTitles: ["Scroll Into View", "On Appear"],
		defaultValue: "scroll",
		displaySegmentedControl: true,
		hidden: (p) => !!p.revealOnHover,
	},
	revealOnHover: {
		type: ControlType.Boolean,
		title: "Hover Reveal",
		defaultValue: false,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	hoverBehavior: {
		type: ControlType.Enum,
		title: "Hover Mode",
		options: ["reveal-hide", "reveal-stay"],
		optionTitles: ["Reveal / Hide", "Reveal / Stay"],
		defaultValue: "reveal-hide",
		displaySegmentedControl: true,
		hidden: (p) => !p.revealOnHover,
	},
	scrollOnce: {
		type: ControlType.Boolean,
		title: "Scroll Once",
		defaultValue: true,
		enabledTitle: "Once",
		disabledTitle: "Repeat",
		hidden: (p) => p.revealOnHover || p.trigger !== "scroll",
	},
	inViewAmount: {
		type: ControlType.Number,
		title: "In View",
		defaultValue: 0.35,
		min: 0,
		max: 1,
		step: 0.05,
		hidden: (p) => p.revealOnHover || p.trigger !== "scroll",
	},
	transition: {
		type: ControlType.Transition,
		title: "Transition",
		defaultValue: {
			type: "tween",
			duration: 0.8,
			ease: [0.22, 1, 0.36, 1],
		},
	},
	delay: {
		type: ControlType.Number,
		title: "Delay",
		defaultValue: 0,
		min: 0,
		max: 3,
		step: 0.05,
		unit: "s",
	},
	objectFit: {
		type: ControlType.Enum,
		title: "Fit",
		options: ["cover", "contain"],
		optionTitles: ["Cover", "Contain"],
		defaultValue: "cover",
		displaySegmentedControl: true,
	},
	borderRadius: {
		type: ControlType.BorderRadius,
		title: "Radius",
		defaultValue: "0px",
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#FFFFFF",
	},
	staticPreview: {
		type: ControlType.Enum,
		title: "Canvas Preview",
		options: ["revealed", "hidden"],
		optionTitles: ["Revealed", "Hidden"],
		defaultValue: "revealed",
	},
})