import type { ComponentType } from "react"
import { useState } from "react"
import { motion, AnimatePresence, useAnimationControls, useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Constants for layout and timing
const CONSTANTS = {
    itemSize: 48,
    containerSize: 250,
    openStagger: 0.02,
    closeStagger: 0.07,
}

// Utility function to calculate positions on a circle
const pointOnCircle = (i: number, n: number, r: number, cx = 0, cy = 0) => {
    const theta = (2 * Math.PI * i) / n - Math.PI / 2
    const x = cx + r * Math.cos(theta)
    const y = cy + r * Math.sin(theta)
    return { x, y }
}

// Menu Item Component
interface MenuItemProps {
    icon?: string
    customIcon?: string
    label: string
    index: number
    totalItems: number
    isOpen: boolean
    onItemClick: () => void
    itemBgColor: string
    itemTextColor: string
    itemBorderColor: string
    itemShadow: string
    itemBorderWidth: number
}

const MenuItem = ({
    icon,
    customIcon,
    label,
    index,
    totalItems,
    isOpen,
    onItemClick,
    itemBgColor,
    itemTextColor,
    itemBorderColor,
    itemShadow,
    itemBorderWidth,
}: MenuItemProps) => {
    const { x, y } = pointOnCircle(
        index,
        totalItems,
        CONSTANTS.containerSize / 2
    )
    const [hovering, setHovering] = useState(false)

    return (
        <motion.button
            onClick={onItemClick}
            animate={{
                x: isOpen ? x : 0,
                y: isOpen ? y : 0,
            }}
            whileHover={{
                scale: 1.1,
                transition: {
                    duration: 0.1,
                    delay: 0,
                },
            }}
            transition={{
                delay: isOpen
                    ? index * CONSTANTS.openStagger
                    : index * CONSTANTS.closeStagger,
                type: "spring",
                stiffness: 300,
                damping: 30,
            }}
            style={{
                height: CONSTANTS.itemSize - 2,
                width: CONSTANTS.itemSize - 2,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                backgroundColor: itemBgColor,
                color: itemTextColor,
                cursor: "pointer",
                border: `${itemBorderWidth}px solid ${itemBorderColor}`,
                fontSize: "18px",
                boxShadow: isOpen ? itemShadow : "none",
                backgroundImage: customIcon ? `url(${customIcon})` : "none",
                backgroundSize: "60%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {!customIcon && (icon || "•")}
            {hovering && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: "white",
                        fontSize: "12px",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                    }}
                >
                    {label}
                </div>
            )}
        </motion.button>
    )
}

// Menu Trigger Component
interface MenuTriggerProps {
    setIsOpen: (isOpen: boolean) => void
    isOpen: boolean
    itemsLength: number
    closeAnimationCallback: () => void
    triggerBgColor: string
    triggerBorderColor: string
    triggerShadow: string
    triggerBorderWidth: number
    openIcon: string
    closeIcon: string
    customOpenIcon?: string
    customCloseIcon?: string
}

const MenuTrigger = ({
    setIsOpen,
    isOpen,
    itemsLength,
    closeAnimationCallback,
    triggerBgColor,
    triggerBorderColor,
    triggerShadow,
    triggerBorderWidth,
    openIcon,
    closeIcon,
    customOpenIcon,
    customCloseIcon,
}: MenuTriggerProps) => {
    const animate = useAnimationControls()
    const shakeAnimation = useAnimationControls()

    const scaleTransition = Array.from({ length: itemsLength - 1 })
        .map((_, index) => index + 1)
        .reduce((acc, _, index) => {
            const increasedValue = index * 0.15
            acc.push(1 + increasedValue)
            return acc
        }, [] as number[])

    const closeAnimation = async () => {
        shakeAnimation.start({
            x: [0, 2, -2, 0, 2, -2, 0],
            transition: {
                duration: CONSTANTS.closeStagger,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop",
            },
        })

        for (let i = 0; i < scaleTransition.length; i++) {
            await animate.start({
                height: Math.min(
                    CONSTANTS.itemSize * scaleTransition[i],
                    CONSTANTS.itemSize + CONSTANTS.itemSize / 2
                ),
                width: Math.min(
                    CONSTANTS.itemSize * scaleTransition[i],
                    CONSTANTS.itemSize + CONSTANTS.itemSize / 2
                ),
                backgroundColor: `color-mix(in srgb, ${triggerBgColor} ${Math.max(100 - i * 10, 40)}%, white)`,
                transition: {
                    duration: CONSTANTS.closeStagger / 2,
                    ease: "linear",
                },
            })
            if (i !== scaleTransition.length - 1) {
                await new Promise((resolve) =>
                    setTimeout(resolve, CONSTANTS.closeStagger * 1000)
                )
            }
        }

        shakeAnimation.stop()
        shakeAnimation.start({
            x: 0,
            transition: {
                duration: 0,
            },
        })

        animate.start({
            height: CONSTANTS.itemSize,
            width: CONSTANTS.itemSize,
            backgroundColor: triggerBgColor,
            transition: {
                duration: 0.1,
                ease: "backInOut",
            },
        })
    }

    return (
        <motion.div animate={shakeAnimation} style={{ zIndex: 50 }}>
            <motion.button
                animate={animate}
                style={{
                    height: CONSTANTS.itemSize,
                    width: CONSTANTS.itemSize,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: triggerBgColor,
                    border: `${triggerBorderWidth}px solid ${triggerBorderColor}`,
                    cursor: "pointer",
                    outline: "none",
                    color: "white",
                    fontSize: "18px",
                    zIndex: 50,
                    boxShadow: triggerShadow,
                }}
                onClick={() => {
                    if (isOpen) {
                        setIsOpen(false)
                        closeAnimationCallback()
                        closeAnimation()
                    } else {
                        setIsOpen(true)
                    }
                }}
            >
                <AnimatePresence mode="popLayout">
                    {isOpen ? (
                        <motion.div
                            key="menu-close"
                            initial={{
                                opacity: 0,
                                filter: "blur(10px)",
                            }}
                            animate={{
                                opacity: 1,
                                filter: "blur(0px)",
                            }}
                            exit={{
                                opacity: 0,
                                filter: "blur(10px)",
                            }}
                            transition={{
                                duration: 0.2,
                            }}
                            style={{
                                backgroundImage: customCloseIcon
                                    ? `url(${customCloseIcon})`
                                    : "none",
                                backgroundSize: "60%",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {!customCloseIcon && closeIcon}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="menu-open"
                            initial={{
                                opacity: 0,
                                filter: "blur(10px)",
                            }}
                            animate={{
                                opacity: 1,
                                filter: "blur(0px)",
                            }}
                            exit={{
                                opacity: 0,
                                filter: "blur(10px)",
                            }}
                            transition={{
                                duration: 0.2,
                            }}
                            style={{
                                backgroundImage: customOpenIcon
                                    ? `url(${customOpenIcon})`
                                    : "none",
                                backgroundSize: "60%",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {!customOpenIcon && openIcon}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </motion.div>
    )
}

// Main Circle Menu Component
interface CircleMenuProps {
    numberOfButtons: number

    // Button configurations as objects
    button1: {
        label: string
        icon: string
        customIcon?: { src: string; alt: string }
        link: string
    }
    button2: {
        label: string
        icon: string
        customIcon?: { src: string; alt: string }
        link: string
    }
    button3: {
        label: string
        icon: string
        customIcon?: { src: string; alt: string }
        link: string
    }
    button4: {
        label: string
        icon: string
        customIcon?: { src: string; alt: string }
        link: string
    }
    button5: {
        label: string
        icon: string
        customIcon?: { src: string; alt: string }
        link: string
    }
    button6: {
        label: string
        icon: string
        customIcon?: { src: string; alt: string }
        link: string
    }
    button7: {
        label: string
        icon: string
        customIcon?: { src: string; alt: string }
        link: string
    }
    button8: {
        label: string
        icon: string
        customIcon?: { src: string; alt: string }
        link: string
    }

    // Trigger styling
    triggerBgColor: string
    triggerBorderColor: string
    triggerBorderWidth: number
    triggerShadow: string
    openIcon: string
    closeIcon: string
    customOpenIcon?: { src: string; alt: string }
    customCloseIcon?: { src: string; alt: string }

    // Item styling
    itemBgColor: string
    itemTextColor: string
    itemBorderColor: string
    itemBorderWidth: number
    itemShadow: string

    onItemClick?: (index: number) => void
}

/**
 * Circular Menu Component
 * 
 * An animated radial menu that expands items in a circle. Perfect for navigation menus,
 * action buttons, or any interface requiring space-efficient access to multiple options.
 * 
 * @framerIntrinsicWidth 250
 * @framerIntrinsicHeight 250
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CircleMenu(props: CircleMenuProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false)
    const animate = useAnimationControls()
    const isStatic = useIsStaticRenderer()

    // Create items array based on numberOfButtons with default values
    const allButtons = [
        props.button1 || {
            label: "Home",
            icon: "🏠",
            customIcon: undefined,
            link: "",
        },
        props.button2 || {
            label: "About",
            icon: "👤",
            customIcon: undefined,
            link: "",
        },
        props.button3 || {
            label: "Contact",
            icon: "✉️",
            customIcon: undefined,
            link: "",
        },
        props.button4 || {
            label: "Projects",
            icon: "🎬",
            customIcon: undefined,
            link: "",
        },
        props.button5 || {
            label: "Skills",
            icon: "⚡",
            customIcon: undefined,
            link: "",
        },
        props.button6 || {
            label: "Articles",
            icon: "📖",
            customIcon: undefined,
            link: "",
        },
        props.button7 || {
            label: "Lab",
            icon: "⚗️",
            customIcon: undefined,
            link: "",
        },
        props.button8 || {
            label: "Blog",
            icon: "📝",
            customIcon: undefined,
            link: "",
        },
    ]

    const items = allButtons.slice(0, props.numberOfButtons)

    const closeAnimationCallback = async () => {
        await animate.start({
            rotate: -360,
            filter: "blur(1px)",
            transition: {
                duration: CONSTANTS.closeStagger * (items.length + 2),
                ease: "linear",
            },
        })
        await animate.start({
            rotate: 0,
            filter: "blur(0px)",
            transition: {
                duration: 0,
            },
        })
    }

    const handleItemClick = (index: number) => {
        const item = items[index]
        if (item.link) {
            window.open(item.link, "_blank")
        }
        props.onItemClick?.(index)
        setIsOpen(false)
        closeAnimationCallback()
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    width: CONSTANTS.containerSize,
                    height: CONSTANTS.containerSize,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <MenuTrigger
                    setIsOpen={setIsOpen}
                    isOpen={isOpen}
                    itemsLength={items.length}
                    closeAnimationCallback={closeAnimationCallback}
                    triggerBgColor={props.triggerBgColor}
                    triggerBorderColor={props.triggerBorderColor}
                    triggerShadow={props.triggerShadow}
                    triggerBorderWidth={props.triggerBorderWidth}
                    openIcon={props.openIcon}
                    closeIcon={props.closeIcon}
                    customOpenIcon={props.customOpenIcon?.src}
                    customCloseIcon={props.customCloseIcon?.src}
                />
                <motion.div
                    animate={animate}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {items.map((item, index) => (
                        <MenuItem
                            key={`menu-item-${index}`}
                            icon={item.icon}
                            customIcon={item.customIcon?.src}
                            label={item.label}
                            index={index}
                            totalItems={items.length}
                            isOpen={isOpen}
                            onItemClick={() => handleItemClick(index)}
                            itemBgColor={props.itemBgColor}
                            itemTextColor={props.itemTextColor}
                            itemBorderColor={props.itemBorderColor}
                            itemShadow={props.itemShadow}
                            itemBorderWidth={props.itemBorderWidth}
                        />
                    ))}
                </motion.div>
            </div>
        </div>
    )
}

// Framer property controls
addPropertyControls(CircleMenu, {
    numberOfButtons: {
        type: ControlType.Number,
        title: "Number of Buttons",
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 6,
    },

    // Button 1 Configuration
    button1: {
        type: ControlType.Object,
        title: "Button 1",
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Home",
            },
            icon: {
                type: ControlType.String,
                title: "Icon",
                defaultValue: "🏠",
            },
            customIcon: {
                type: ControlType.ResponsiveImage,
                title: "Custom Icon",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
            },
        },
        hidden: (props) => props.numberOfButtons < 1,
    },

    // Button 2 Configuration
    button2: {
        type: ControlType.Object,
        title: "Button 2",
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "About",
            },
            icon: {
                type: ControlType.String,
                title: "Icon",
                defaultValue: "👤",
            },
            customIcon: {
                type: ControlType.ResponsiveImage,
                title: "Custom Icon",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
            },
        },
        hidden: (props) => props.numberOfButtons < 2,
    },

    // Button 3 Configuration
    button3: {
        type: ControlType.Object,
        title: "Button 3",
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Contact",
            },
            icon: {
                type: ControlType.String,
                title: "Icon",
                defaultValue: "✉️",
            },
            customIcon: {
                type: ControlType.ResponsiveImage,
                title: "Custom Icon",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
            },
        },
        hidden: (props) => props.numberOfButtons < 3,
    },

    // Button 4 Configuration
    button4: {
        type: ControlType.Object,
        title: "Button 4",
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Projects",
            },
            icon: {
                type: ControlType.String,
                title: "Icon",
                defaultValue: "🎬",
            },
            customIcon: {
                type: ControlType.ResponsiveImage,
                title: "Custom Icon",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
            },
        },
        hidden: (props) => props.numberOfButtons < 4,
    },

    // Button 5 Configuration
    button5: {
        type: ControlType.Object,
        title: "Button 5",
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Skills",
            },
            icon: {
                type: ControlType.String,
                title: "Icon",
                defaultValue: "⚡",
            },
            customIcon: {
                type: ControlType.ResponsiveImage,
                title: "Custom Icon",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
            },
        },
        hidden: (props) => props.numberOfButtons < 5,
    },

    // Button 6 Configuration
    button6: {
        type: ControlType.Object,
        title: "Button 6",
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Articles",
            },
            icon: {
                type: ControlType.String,
                title: "Icon",
                defaultValue: "📖",
            },
            customIcon: {
                type: ControlType.ResponsiveImage,
                title: "Custom Icon",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
            },
        },
        hidden: (props) => props.numberOfButtons < 6,
    },

    // Button 7 Configuration
    button7: {
        type: ControlType.Object,
        title: "Button 7",
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Lab",
            },
            icon: {
                type: ControlType.String,
                title: "Icon",
                defaultValue: "⚗️",
            },
            customIcon: {
                type: ControlType.ResponsiveImage,
                title: "Custom Icon",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
            },
        },
        hidden: (props) => props.numberOfButtons < 7,
    },

    // Button 8 Configuration
    button8: {
        type: ControlType.Object,
        title: "Button 8",
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Blog",
            },
            icon: {
                type: ControlType.String,
                title: "Icon",
                defaultValue: "📝",
            },
            customIcon: {
                type: ControlType.ResponsiveImage,
                title: "Custom Icon",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
            },
        },
        hidden: (props) => props.numberOfButtons < 8,
    },

    // Trigger Styling
    triggerBgColor: {
        type: ControlType.Color,
        title: "Trigger Background",
        defaultValue: "#000000",
    },
    triggerBorderColor: {
        type: ControlType.Color,
        title: "Trigger Border Color",
        defaultValue: "#EEEEEE",
    },
    triggerBorderWidth: {
        type: ControlType.Number,
        title: "Trigger Border Width",
        min: 0,
        max: 5,
        step: 1,
        defaultValue: 1,
        unit: "px",
    },
    triggerShadow: {
        type: ControlType.BoxShadow,
        title: "Trigger Shadow",
        defaultValue: {
            color: "rgba(0, 0, 0, 0.3)",
            x: 0,
            y: 4,
            blur: 15,
            spread: 0,
        },
    },
    openIcon: {
        type: ControlType.String,
        title: "Open Icon",
        defaultValue: "☰",
    },
    closeIcon: {
        type: ControlType.String,
        title: "Close Icon",
        defaultValue: "✕",
    },
    customOpenIcon: {
        type: ControlType.ResponsiveImage,
        title: "Custom Open Icon",
    },
    customCloseIcon: {
        type: ControlType.ResponsiveImage,
        title: "Custom Close Icon",
    },

    // Item Styling
    itemBgColor: {
        type: ControlType.Color,
        title: "Item Background",
        defaultValue: "#FFFFFF",
    },
    itemTextColor: {
        type: ControlType.Color,
        title: "Item Text Color",
        defaultValue: "#000000",
    },
    itemBorderColor: {
        type: ControlType.Color,
        title: "Item Border Color",
        defaultValue: "#EEEEEE",
    },
    itemBorderWidth: {
        type: ControlType.Number,
        title: "Item Border Width",
        min: 0,
        max: 5,
        step: 1,
        defaultValue: 1,
        unit: "px",
    },
    itemShadow: {
        type: ControlType.BoxShadow,
        title: "Item Shadow",
        defaultValue: {
            color: "rgba(0, 0, 0, 0.1)",
            x: 0,
            y: 2,
            blur: 10,
            spread: 0,
        },
    },

    onItemClick: {
        type: ControlType.EventHandler,
    },
})
