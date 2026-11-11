// Glass Button component for Framer with animated gradient border effect
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { type CSSProperties, useId, useMemo } from "react"
import type React from "react"

interface GlassButtonProps {
	label: string
	buttonFont: CSSProperties
	textColor: string
	backgroundColor: string
	borderGradientStart: string
	borderGradientEnd: string
	backdropBlur: number
	borderRadius: string
	padding: string
	link?: string
	openInNewTab?: boolean
	onClick?: () => void
	style?: CSSProperties
}

/**
 * Glass Button with animated gradient border
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function GlassButton(props: GlassButtonProps) {
	const {
		label,
		buttonFont,
		textColor,
		backgroundColor,
		borderGradientStart,
		borderGradientEnd,
		backdropBlur,
		borderRadius,
		padding,
		link,
		openInNewTab,
		onClick,
		style,
	} = props

	const uniqueId = useId().replace(/[^a-zA-Z0-9]/g, "")
	const Component = link ? "a" : ("button" as any)
	
	const cssVars = useMemo(() => {
		// Robust sanitization for HEX, RGB, RGBA, HSL values
		const sanitize = (color: string) => {
			return color.replace(/\\/g, "").trim()
		}
		
		return {
			bgColor: sanitize(backgroundColor),
			gradStart: sanitize(borderGradientStart),
			gradEnd: sanitize(borderGradientEnd),
		}
	}, [backgroundColor, borderGradientStart, borderGradientEnd])

	// Padding fallback: allow style.padding to override if user modifies via Layout panel
	const finalPadding = useMemo(() => {
		// If style.padding exists and differs from default, use it
		if (style?.padding && style.padding !== "12px 24px") {
			return style.padding
		}
		// Otherwise use the padding prop
		return padding || "12px 24px"
	}, [padding, style?.padding])

	const finalBorderRadius = useMemo(() => {
		// If style.borderRadius exists and differs from default, use it
		if (style?.borderRadius && style.borderRadius !== "8px") {
			return style.borderRadius
		}
		// Otherwise use the borderRadius prop
		return borderRadius || "8px"
	}, [borderRadius, style?.borderRadius])
	
	const handleClick = (e: React.MouseEvent) => {
		if (onClick) {
			onClick()
		}
	}

	return (
		<Component
			href={link}
			target={openInNewTab ? "_blank" : "_self"}
			rel={openInNewTab ? "noopener noreferrer" : undefined}
			type={!link ? "button" : undefined}
			className={"glass-button-" + uniqueId}
			aria-label={label}
			style={{
				...buttonFont,
				...style,
				// Critical layout properties at the end to prevent overrides
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				boxSizing: "border-box",
				background: backgroundColor,
				backdropFilter: `blur(${backdropBlur}px)`,
				WebkitBackdropFilter: `blur(${backdropBlur}px)`,
				color: textColor,
				border: "none",
				cursor: "pointer",
				overflow: "visible",
				textDecoration: "none",
				WebkitTapHighlightColor: "transparent",
				minWidth: "max-content",
				borderRadius: finalBorderRadius,
				padding: finalPadding,
			}}
			onClick={handleClick}
		>
			<style>{`
				@keyframes rotate-gradient-${uniqueId} {
					0% {
						--button-angle-${uniqueId}: -75deg;
					}
					100% {
						--button-angle-${uniqueId}: 285deg;
					}
				}
				
				@property --button-angle-${uniqueId} {
					syntax: '<angle>';
					inherits: false;
					initial-value: -75deg;
				}
				
				.glass-button-border-${uniqueId} {
					--button-angle-${uniqueId}: -75deg;
					animation: rotate-gradient-${uniqueId} 3s linear infinite;
					transition: opacity 0.3s ease;
				}
				
				@supports not (background: paint(something)) {
					.glass-button-border-${uniqueId} {
						background: conic-gradient(from -75deg at 50% 50%, ${cssVars.gradStart}, transparent 10%, transparent 43%, ${cssVars.gradEnd} 50%, transparent 73%, transparent 93%, ${cssVars.gradStart}) !important;
						animation: none !important;
					}
				}
				
				@supports (background: conic-gradient(from var(--button-angle-${uniqueId}) at 50% 50%, red, blue)) {
					.glass-button-border-${uniqueId} {
						background: conic-gradient(from var(--button-angle-${uniqueId}) at 50% 50%, ${cssVars.gradStart}, transparent 10%, transparent 43%, ${cssVars.gradEnd} 50%, transparent 73%, transparent 93%, ${cssVars.gradStart});
					}
				}
				
				.glass-button-${uniqueId}:hover .glass-button-border-${uniqueId} {
					opacity: 1;
					background: ${cssVars.gradStart} !important;
				}
			`}</style>
			<div
				className={"glass-button-border-" + uniqueId}
				style={{
					position: "absolute",
					inset: 0,
					borderRadius: finalBorderRadius,
					padding: "1px",
					background: `conic-gradient(from var(--button-angle-${uniqueId}) at 50% 50%, ${cssVars.gradStart}, transparent 10%, transparent 43%, ${cssVars.gradEnd} 50%, transparent 73%, transparent 93%, ${cssVars.gradStart})`,
					WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
					WebkitMaskComposite: "xor",
					mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
					maskComposite: "exclude",
					pointerEvents: "none",
					opacity: 1,
					zIndex: 0,
				}}
			/>
			<span style={{ position: "relative", zIndex: 1, pointerEvents: "none" }}>{label}</span>
		</Component>
	)
}

addPropertyControls(GlassButton, {
	label: {
		type: ControlType.String,
		title: "Label",
		defaultValue: "Glass Button",
	},
	link: {
		type: ControlType.Link,
		title: "Link",
	},
	openInNewTab: {
		type: ControlType.Boolean,
		title: "New Tab",
		defaultValue: false,
		enabledTitle: "Yes",
		disabledTitle: "No",
		hidden: (props) => !props.link,
	},
	buttonFont: {
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
	textColor: {
		type: ControlType.Color,
		title: "Text Color",
		defaultValue: "#FFFFFF",
	},
	backgroundColor: {
		type: ControlType.Color,
		title: "Background",
		defaultValue: "rgba(255, 255, 255, 0.2)",
	},
	borderGradientStart: {
		type: ControlType.Color,
		title: "Border Start",
		defaultValue: "rgba(255, 255, 255, 0.5)",
	},
	borderGradientEnd: {
		type: ControlType.Color,
		title: "Border End",
		defaultValue: "rgba(255, 255, 255, 0.5)",
	},
	backdropBlur: {
		type: ControlType.Number,
		title: "Blur",
		defaultValue: 10,
		min: 0,
		max: 50,
		step: 1,
		unit: "px",
	},
	padding: {
		type: ControlType.Padding,
		title: "Padding",
		defaultValue: "12px 24px",
	},
	borderRadius: {
		type: ControlType.BorderRadius,
		title: "Radius",
		defaultValue: "8px",
	},
})