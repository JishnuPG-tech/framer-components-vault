// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useState } from "react"

// Define the component props
interface Props {
    links: { text: string; url: string }[]
    font: React.CSSProperties
    textColor: string
    hoverColor: string
    duration: number
    stagger: number
}

export default function RevealLinks(props: Props) {
    const { links, font, textColor, hoverColor, duration, stagger } = props

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "grid",
                placeContent: "center",
                color: textColor,
            }}
        >
            {links.map((link, index) => (
                <FlipLink
                    key={index}
                    href={link.url}
                    font={font}
                    textColor={textColor}
                    hoverColor={hoverColor}
                    duration={duration}
                    stagger={stagger}
                >
                    {link.text}
                </FlipLink>
            ))}
        </div>
    )
}

interface FlipLinkProps {
    children: string
    href: string
    font: React.CSSProperties
    textColor: string
    hoverColor: string
    duration: number
    stagger: number
}

const FlipLink = ({
    children,
    href,
    font,
    textColor,
    hoverColor,
    duration,
    stagger,
}: FlipLinkProps) => {
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)

    return (
        <a
            href={href}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                ...font,
                position: "relative",
                display: "block",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textTransform: "uppercase",
                color: textColor,
                textDecoration: "none",
            }}
        >
            {/* Original text layer */}
            <div>
                {children.split("").map((letter, i) => (
                    <span
                        key={`original-${i}`}
                        style={{
                            display: "inline-block",
                            transform: isHovered
                                ? "translateY(-100%)"
                                : "translateY(0)",
                            transition: `transform ${duration}s ease-in-out ${stagger * i}s`,
                        }}
                    >
                        {letter}
                    </span>
                ))}
            </div>

            {/* Hover text layer */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    color: hoverColor,
                }}
            >
                {children.split("").map((letter, i) => (
                    <span
                        key={`hover-${i}`}
                        style={{
                            display: "inline-block",
                            transform: isHovered
                                ? "translateY(0)"
                                : "translateY(100%)",
                            transition: `transform ${duration}s ease-in-out ${stagger * i}s`,
                        }}
                    >
                        {letter}
                    </span>
                ))}
            </div>
        </a>
    )
}

// Property controls for Framer
addPropertyControls(RevealLinks, {
    links: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    defaultValue: "Link",
                },
                url: {
                    type: ControlType.String,
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { text: "Twitter", url: "#" },
            { text: "LinkedIn", url: "#" },
            { text: "Facebook", url: "#" },
            { text: "Instagram", url: "#" },
        ],
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 120,
            letterSpacing: 0.1,
            lineHeight: "1",
        },
    },
    textColor: {
        type: ControlType.Color,
        defaultValue: "#000000",
        title: "Text Color",
    },
    hoverColor: {
        type: ControlType.Color,
        defaultValue: "#2454E3",
        title: "Hover Color",
    },
    duration: {
        type: ControlType.Number,
        defaultValue: 0.25,
        min: 0.1,
        max: 1,
        step: 0.05,
        displayStepper: true,
        title: "Animation Duration",
    },
    stagger: {
        type: ControlType.Number,
        defaultValue: 0.025,
        min: 0,
        max: 0.1,
        step: 0.005,
        displayStepper: true,
        title: "Letter Stagger",
    },
})
