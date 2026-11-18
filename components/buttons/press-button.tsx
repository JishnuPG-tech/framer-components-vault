// Create a 3D skeuomorphic button with realistic shadows and hover effects
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, startTransition, type CSSProperties } from "react"

interface PressButtonProps {
	label: string
	labelFont: CSSProperties
	labelGradient: {
		start: string
		end: string
	}
	buttonGradient: {
		start: string
		end: string
	}
	padding: string
	link?: string
	openInNewTab?: boolean
	onClick?: () => void
	style?: CSSProperties
}

/**
 * A 3D skeuomorphic button with realistic shadows and smooth hover effects
 *
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 52
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function PressButton(props: PressButtonProps) {
	const {
		label,
		labelFont,
		labelGradient,
		buttonGradient,
		padding,
		link,
		openInNewTab,
		onClick,
		style,
	} = props

	const [isHovered, setIsHovered] = useState(false)
	const [isActive, setIsActive] = useState(false)

	const handleMouseEnter = () => {
		startTransition(() => setIsHovered(true))
	}

	const handleMouseLeave = () => {
		startTransition(() => {
			setIsHovered(false)
			setIsActive(false)
		})
	}

	const handleMouseDown = () => {
		startTransition(() => setIsActive(true))
	}

	const handleMouseUp = () => {
		startTransition(() => setIsActive(false))
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault()
			startTransition(() => setIsActive(true))
		}
	}

	const handleKeyUp = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault()
			startTransition(() => setIsActive(false))
			if (onClick) {
				onClick()
			}
		}
	}

	const buttonContent = (
		<button
			style={{
				all: "unset",
				width: "100%",
				height: "100%",
				cursor: "pointer",
				WebkitTapHighlightColor: "rgba(0, 0, 0, 0)",
				position: "relative",
				borderRadius: "100em",
				backgroundColor: "rgba(0, 0, 0, 0.75)",
				boxShadow:
					"-0.15em -0.15em 0.15em -0.075em rgba(5, 5, 5, 0.25), 0.0375em 0.0375em 0.0675em 0 rgba(5, 5, 5, 0.1)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
			onClick={onClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onMouseDown={handleMouseDown}
			onMouseUp={handleMouseUp}
			onKeyDown={handleKeyDown}
			onKeyUp={handleKeyUp}
			role="button"
			aria-label={label}
			tabIndex={0}
		>
			<div
				style={{
					position: "absolute",
					zIndex: 0,
					width: "calc(100% + 0.3em)",
					height: "calc(100% + 0.3em)",
					top: "-0.15em",
					left: "-0.15em",
					borderRadius: "inherit",
					background: "linear-gradient(-135deg, rgba(5, 5, 5, 0.5), transparent 20%, transparent 100%)",
					filter: "blur(0.0125em)",
					opacity: 0.25,
					mixBlendMode: "multiply",
					pointerEvents: "none",
				}}
			/>
			<div
				style={{
					position: "relative",
					zIndex: 1,
					borderRadius: "inherit",
					transition: "box-shadow 300ms ease",
					willChange: "box-shadow",
					boxShadow: isHovered
						? "0 0 0 0 rgba(5, 5, 5, 1), 0 0 0 0 rgba(5, 5, 5, 0.5), 0 0 0 0 rgba(5, 5, 5, 0.25)"
						: "0 0.05em 0.05em -0.01em rgba(5, 5, 5, 1), 0 0.01em 0.01em -0.01em rgba(5, 5, 5, 0.5), 0.15em 0.3em 0.1em -0.01em rgba(5, 5, 5, 0.25)",
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div
					style={{
						position: "relative",
						zIndex: 1,
						borderRadius: "inherit",
						padding: padding,
						backgroundImage: `linear-gradient(135deg, ${buttonGradient.start}, ${buttonGradient.end})`,
						transition:
							"box-shadow 300ms ease, clip-path 250ms ease, background-image 250ms ease, transform 250ms ease",
						willChange: "box-shadow, clip-path, background-image, transform",
						overflow: "clip",
						clipPath: isHovered
							? "inset(clamp(1px, 0.0625em, 2px) clamp(1px, 0.0625em, 2px) clamp(1px, 0.0625em, 2px) clamp(1px, 0.0625em, 2px) round 100em)"
							: "inset(0 0 0 0 round 100em)",
						boxShadow: isHovered
							? "0.1em 0.15em 0.05em 0 inset rgba(5, 5, 5, 0.75), -0.025em -0.03em 0.05em 0.025em inset rgba(5, 5, 5, 0.5), 0.25em 0.25em 0.2em 0 inset rgba(5, 5, 5, 0.5), 0 0 0.05em 0.5em inset rgba(255, 255, 255, 0.15), 0 0 0 0 inset rgba(255, 255, 255, 1), 0.12em 0.12em 0.12em inset rgba(255, 255, 255, 0.25), -0.075em -0.12em 0.2em 0.1em inset rgba(5, 5, 5, 0.25)"
							: "0 0 0 0 inset rgba(5, 5, 5, 0.1), -0.05em -0.05em 0.05em 0 inset rgba(5, 5, 5, 0.25), 0 0 0 0 inset rgba(5, 5, 5, 0.1), 0 0 0.05em 0.2em inset rgba(255, 255, 255, 0.25), 0.025em 0.05em 0.1em 0 inset rgba(255, 255, 255, 1), 0.12em 0.12em 0.12em inset rgba(255, 255, 255, 0.25), -0.075em -0.25em 0.25em 0.1em inset rgba(5, 5, 5, 0.25)",
						transform: isActive ? "scale(0.975)" : "scale(1)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "100%",
						height: "100%",
					}}
				>
					<span
						style={{
							position: "relative",
							zIndex: 4,
							letterSpacing: "-0.05em",
							color: "rgba(0, 0, 0, 0)",
							backgroundImage: `linear-gradient(135deg, ${labelGradient.start}, ${labelGradient.end})`,
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							transition: "transform 250ms ease",
							display: "block",
							willChange: "transform",
							textShadow: "rgba(0, 0, 0, 0.1) 0 0 0.1em",
							WebkitUserSelect: "none",
							MozUserSelect: "none",
							msUserSelect: "none",
							userSelect: "none",
							transform: isHovered ? "scale(0.975)" : "scale(1)",
							textAlign: "center",
							padding: "12px 40px",
							width: "max-content",
							...labelFont,
						}}
					>
						{label}
					</span>
				</div>
			</div>
		</button>
	)

	if (link) {
		return (
			<a 
				href={link} 
				style={{ textDecoration: "none", display: "block", width: "100%", height: "100%", ...style }} 
				aria-label={label}
				target={openInNewTab ? "_blank" : "_self"}
				rel={openInNewTab ? "noopener noreferrer" : undefined}
			>
				{buttonContent}
			</a>
		)
	}

	return <div style={{ width: "100%", height: "100%", ...style }}>{buttonContent}</div>
}

addPropertyControls(PressButton, {
	label: {
		type: ControlType.String,
		title: "Label",
		defaultValue: "Press Button",
	},
	labelFont: {
		type: ControlType.Font,
		title: "Label Font",
		controls: "extended",
		defaultFontType: "sans-serif",
		defaultValue: {
			fontSize: 20,
			variant: "Medium",
			letterSpacing: "-0.5px",
			lineHeight: "1.4em",
		},
	},
	padding: {
		type: ControlType.Padding,
		title: "Padding",
		defaultValue: "1em 1.5em",
	},
	labelGradient: {
		type: ControlType.Object,
		title: "Label Color",
		controls: {
			start: {
				type: ControlType.Color,
				title: "Start",
			},
			end: {
				type: ControlType.Color,
				title: "End",
			},
		},
		defaultValue: {
			start: "rgba(25, 25, 25, 1)",
			end: "rgba(75, 75, 75, 1)",
		},
	},
	buttonGradient: {
		type: ControlType.Object,
		title: "Background",
		controls: {
			start: {
				type: ControlType.Color,
				title: "Start",
			},
			end: {
				type: ControlType.Color,
				title: "End",
			},
		},
		defaultValue: {
			start: "rgba(230, 230, 230, 1)",
			end: "rgba(180, 180, 180, 1)",
		},
	},
	link: {
		type: ControlType.Link,
		title: "Link",
	},
	openInNewTab: {
		type: ControlType.Boolean,
		title: "Open in New Tab",
		defaultValue: false,
		enabledTitle: "Yes",
		disabledTitle: "No",
		hidden: ({ link }) => !link || link === "",
	},
})

PressButton.displayName = "Press Button"