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
import React, { useCallback, useMemo } from "react"

const LEGO_CLICK_SOUND = "data:audio/mp4;base64," // /* paste base64-encoded lego click sound here */

/**
 * Lego Button
 *
 * A button styled like a Lego brick with customizable colors and size.
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 60
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function LegoButton(props) {
    const {
        text,
        color,
        textColor,
        font,
        studCount = 4,
        onClick,
        shadowColor,
        studColor,
        link,
        newTab,
        padding = "12px 24px 12px 24px",
        playClickSound = true,
    } = props

    const studHeight = 6
    const shadowDepth = 6
    const cornerRadius = 6
    const isStatic = useIsStaticRenderer()

    const handleMouseDown = useCallback(() => {
        if (playClickSound && typeof window !== "undefined") {
            try {
                if (LEGO_CLICK_SOUND.length > "data:audio/mp4;base64,".length) {
                    const audio = new Audio(LEGO_CLICK_SOUND)
                    void audio.play()
                }
            } catch (e) {
                // ignore
            }
        }
    }, [playClickSound])

    // Generate studs
    const studs = useMemo(
        () => Array.from({ length: Math.max(1, studCount) }),
        [studCount]
    )

    const variants = {
        initial: {
            y: 0,
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.1), 0 ${
                shadowDepth
            }px 0 ${shadowColor}, 0 ${shadowDepth + 4}px 6px rgba(0,0,0,0.2)`,
            transition: {
                type: "spring" as const,
                stiffness: 260,
                damping: 24,
                mass: 0.8,
            },
        },
        hover: {
            y: -2,
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.1), 0 ${
                shadowDepth + 2
            }px 0 ${shadowColor}, 0 ${shadowDepth + 8}px 10px rgba(0,0,0,0.22)`,
            transition: {
                type: "spring" as const,
                stiffness: 260,
                damping: 24,
                mass: 0.8,
            },
        },
        tap: {
            y: shadowDepth,
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.35), 0 0px 0 ${shadowColor}, 0 2px 4px rgba(0,0,0,0.18)`,
            transition: {
                type: "spring" as const,
                stiffness: 260,
                damping: 24,
                mass: 0.8,
            },
        },
    }

    const isLink = link && link !== ""
    const Component = isLink ? motion.a : motion.button

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                minWidth: "max-content",
                paddingTop: studHeight,
                paddingBottom: shadowDepth,
            }}
        >
            <Component
                {...(isLink
                    ? {
                          href: link,
                          target: newTab ? "_blank" : undefined,
                          rel: "noopener noreferrer",
                      }
                    : { type: "button" })}
                onClick={onClick}
                onMouseDown={handleMouseDown}
                {...(!isStatic
                    ? {
                          initial: "initial",
                          whileHover: "hover",
                          whileTap: "tap",
                          variants,
                      }
                    : {})}
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    backgroundColor: color,
                    color: textColor,
                    border: "none",
                    borderRadius: cornerRadius,
                    cursor: "pointer",
                    outline: "none",
                    padding: padding,
                    overflow: "visible",
                    textDecoration: "none",
                    ...(isStatic ? { boxShadow: variants.initial.boxShadow } : {}),
                    ...font,
                }}
            >
                {/* Studs Container */}
                <div
                    style={{
                        position: "absolute",
                        top: -studHeight,
                        left: 0,
                        right: 0,
                        height: studHeight,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-end",
                        gap: 15,
                        padding: "0 10px",
                        pointerEvents: "none",
                    }}
                >
                    {studs.map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: 20,
                                height: "100%",
                                backgroundColor: studColor || color,
                                borderRadius: "4px 4px 0 0",
                                boxShadow: `inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.1), 0 ${studHeight}px 0 ${color}`,
                            }}
                        />
                    ))}
                </div>

                {/* Label Text */}
                <span
                    style={{
                        position: "relative",
                        zIndex: 2,
                        textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                        display: "block",
                        width: "100%",
                        maxWidth: "100%",
                        textAlign: "center",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                    }}
                >
                    {text}
                </span>
            </Component>
        </div>
    )
}

addPropertyControls(LegoButton, {
    playClickSound: {
        type: ControlType.Boolean,
        title: "Click Sound",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    text: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Click Me",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "12px 24px 12px 24px",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (props) => !props.link,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Black", // Thick font looks best
            letterSpacing: "0.05em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Brick Color",
        defaultValue: "#E3000B", // Classic Lego Red
    },
    studColor: {
        type: ControlType.Color,
        title: "Stud Color",
        defaultValue: "#E3000B",
        optional: true,
    },
    shadowColor: {
        type: ControlType.Color,
        title: "3D Shadow",
        defaultValue: "#900000", // Darker red for depth
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    studCount: {
        type: ControlType.Number,
        title: "Studs",
        defaultValue: 4,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
        description:
            "Built by Matthias Ölschlegel 💪\n[Explore more components](https://dub.sh/dsw13)",
    },
    onClick: {
        type: ControlType.EventHandler,
    },
})
