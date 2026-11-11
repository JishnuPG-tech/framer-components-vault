// Magnetic button that follows mouse movement with spring physics and 3D rotation
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MagneticButtonProps {
	label: string
	backgroundColor: string
	textColor: string
	borderRadius: number
	damping: number
	stiffness: number
	magnetStrength: number
	font: CSSProperties
	onClick?: () => void
	ariaLabel?: string
	disabled?: boolean
	hoverBackgroundColor: string
	hoverTextColor: string
	hoverScale: number
	pressedBackgroundColor: string
	pressedTextColor: string
	pressedScale: number
	link?: any
	linkTarget?: "_self" | "_blank"
	borderWidth: number
	borderColor: string
	borderStyle: "solid" | "dashed" | "dotted" | "double" | "none"
	boxShadow: string
	padding: string
	style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MagneticButton(props: MagneticButtonProps) {
	const {
		label,
		backgroundColor,
		textColor,
		borderRadius,
		damping,
		stiffness,
		magnetStrength,
		font,
		onClick,
		ariaLabel,
		disabled = false,
		hoverBackgroundColor,
		hoverTextColor,
		hoverScale,
		pressedBackgroundColor,
		pressedTextColor,
		pressedScale,
		link,
		linkTarget = "_self",
		borderWidth,
		borderColor,
		borderStyle,
		boxShadow,
		padding,
		style,
	} = props

	const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null)

	const mouseX = useMotionValue(0)
	const mouseY = useMotionValue(0)

	const springConfig = { damping, stiffness }
	const x = useSpring(mouseX, springConfig)
	const y = useSpring(mouseY, springConfig)

	const rotateX = useTransform(y, [-magnetStrength, magnetStrength], [10, -10])
	const rotateY = useTransform(x, [-magnetStrength, magnetStrength], [-10, 10])

	const handleMouseMove = (e: React.MouseEvent) => {
		if (disabled) return
		const rect = ref.current?.getBoundingClientRect()
		if (rect) {
			const centerX = rect.x + rect.width / 2
			const centerY = rect.y + rect.height / 2

			startTransition(() => {
				mouseX.set(e.clientX - centerX)
				mouseY.set(e.clientY - centerY)
			})
		}
	}

	const handleMouseLeave = () => {
		startTransition(() => {
			mouseX.set(0)
			mouseY.set(0)
		})
	}

	const handleClick = () => {
		if (!disabled && onClick) {
			onClick()
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled) return
		// Support Enter and Space keys for activation
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault()
			handleClick()
		}
	}

	const Component = link ? motion.a : motion.button
	const componentProps = link
		? {
				href: link,
				target: linkTarget,
				rel: linkTarget === "_blank" ? "noopener noreferrer" : undefined,
				"data-framer-page-link-current": link?.webPageId ? true : undefined,
		  }
		: {
				disabled,
		  }

	return (
		<Component
			ref={ref as any}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			aria-label={ariaLabel || label}
			aria-disabled={disabled}
			tabIndex={disabled ? -1 : 0}
			{...componentProps}
			style={{
				...style,
				x,
				y,
				rotateX,
				rotateY,
				backgroundColor,
				color: textColor,
				borderRadius,
				padding,
				border: "none",
				borderWidth,
				borderColor,
				borderStyle,
				cursor: disabled ? "not-allowed" : "pointer",
				width: "max-content",
				opacity: disabled ? 0.5 : 1,
				outline: "none",
				position: "relative",
				textDecoration: "none",
				display: "inline-block",
				...font,
				boxShadow,
			}}
			whileHover={
				disabled
					? {}
					: {
							scale: hoverScale,
							backgroundColor: hoverBackgroundColor,
							color: hoverTextColor,
					  }
			}
			whileTap={
				disabled
					? {}
					: {
							scale: pressedScale,
							backgroundColor: pressedBackgroundColor,
							color: pressedTextColor,
					  }
			}
			whileFocus={{
				boxShadow: `0 0 0 3px ${textColor}40`,
			}}
		>
			{label}
		</Component>
	)
}

addPropertyControls(MagneticButton, {
	label: {
		type: ControlType.String,
		title: "Label",
		defaultValue: "Magnetic Button",
	},
	link: {
		type: ControlType.Link,
		title: "Link",
	},
	linkTarget: {
		type: ControlType.Enum,
		title: "Link Target",
		defaultValue: "_self",
		options: ["_self", "_blank"],
		optionTitles: ["Same Tab", "New Tab"],
		displaySegmentedControl: true,
		hidden: (props) => !props.link,
	},
	ariaLabel: {
		type: ControlType.String,
		title: "ARIA Label",
		defaultValue: "",
		description: "Accessible label for screen readers",
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "#000000",
	},
	textColor: {
		type: ControlType.Color,
		title: "Text Color",
		defaultValue: "#FFFFFF",
	},
	borderWidth: {
		type: ControlType.Number,
		title: "Border Width",
		defaultValue: 0,
		min: 0,
		max: 10,
		step: 1,
		unit: "px",
	},
	borderColor: {
		type: ControlType.Color,
		title: "Border Color",
		defaultValue: "#000000",
	},
	borderStyle: {
		type: ControlType.Enum,
		title: "Border Style",
		defaultValue: "solid",
		options: ["solid", "dashed", "dotted", "double", "none"],
		optionTitles: ["Solid", "Dashed", "Dotted", "Double", "None"],
	},
	hoverBackgroundColor: {
		type: ControlType.Color,
		title: "Hover Background",
		defaultValue: "#333333",
	},
	hoverTextColor: {
		type: ControlType.Color,
		title: "Hover Text Color",
		defaultValue: "#FFFFFF",
	},
	hoverScale: {
		type: ControlType.Number,
		title: "Hover Scale",
		defaultValue: 1.1,
		min: 0.8,
		max: 1.5,
		step: 0.05,
	},
	pressedBackgroundColor: {
		type: ControlType.Color,
		title: "Pressed Background",
		defaultValue: "#000000",
	},
	pressedTextColor: {
		type: ControlType.Color,
		title: "Pressed Text Color",
		defaultValue: "#FFFFFF",
	},
	pressedScale: {
		type: ControlType.Number,
		title: "Pressed Scale",
		defaultValue: 0.95,
		min: 0.8,
		max: 1.2,
		step: 0.05,
	},
	borderRadius: {
		type: ControlType.Number,
		title: "Border Radius",
		defaultValue: 100,
		min: 0,
		max: 100,
		unit: "px",
	},
	padding: {
		type: ControlType.Padding,
		title: "Padding",
		defaultValue: "16px 32px",
	},
	disabled: {
		type: ControlType.Boolean,
		title: "Disabled",
		defaultValue: false,
		enabledTitle: "Yes",
		disabledTitle: "No",
	},
	damping: {
		type: ControlType.Number,
		title: "Damping",
		defaultValue: 15,
		min: 5,
		max: 50,
		step: 1,
	},
	stiffness: {
		type: ControlType.Number,
		title: "Stiffness",
		defaultValue: 150,
		min: 50,
		max: 500,
		step: 10,
	},
	magnetStrength: {
		type: ControlType.Number,
		title: "Magnet Strength",
		defaultValue: 20,
		min: 5,
		max: 50,
		step: 1,
	},
	font: {
		type: ControlType.Font,
		title: "Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: "14px",
			variant: "Semibold",
			letterSpacing: "-0.01em",
			lineHeight: "1em",
		},
	},
	onClick: {
		type: ControlType.EventHandler,
	},
	boxShadow: {
		type: ControlType.BoxShadow,
		title: "Shadow",
	},
})