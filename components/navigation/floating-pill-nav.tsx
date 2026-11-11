// Pill-shaped navigation with animated background that shifts between links on click
import { motion } from "framer-motion"
import { useState, startTransition, useEffect, useRef, useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface NavigationItem {
    label: string
    href?: string
    target?: "_self" | "_blank"
}

interface PillNavigationProps {
    items: NavigationItem[]
    backgroundColor: string
    textColor: string
    activeBackgroundColor: string
    activeTextColor: string
    padding: number
    gap: number
    font: CSSProperties
    activeLink: string
    transition: any
    linkPadding: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function FloatingPillNavigation(props: PillNavigationProps) {
    const {
        items,
        backgroundColor,
        textColor,
        activeBackgroundColor,
        activeTextColor,
        padding,
        gap,
        font,
        activeLink = "Home",
        transition,
        linkPadding,
    } = props

    // Internal state for interactive clicking
    const [internalActiveLink, setInternalActiveLink] = useState(activeLink)
    const navRef = useRef<HTMLElement>(null)
    const linkRef = useRef<HTMLDivElement>(null)
    const [navBorderRadius, setNavBorderRadius] = useState(50)
    const [linkBorderRadius, setLinkBorderRadius] = useState(25)

    // Sync internal state when activeLink prop changes
    useEffect(() => {
        startTransition(() => {
            setInternalActiveLink(activeLink)
        })
    }, [activeLink])

    // Calculate border radii based on heights
    useEffect(() => {
        const updateBorderRadii = () => {
            if (navRef.current) {
                const navHeight = navRef.current.offsetHeight
                setNavBorderRadius(navHeight / 2)
            }
            if (linkRef.current) {
                const linkHeight = linkRef.current.offsetHeight
                setLinkBorderRadius(linkHeight / 2)
            }
        }

        updateBorderRadii()

        // Use ResizeObserver to update when size changes
        const resizeObserver = new ResizeObserver(updateBorderRadii)
        if (navRef.current) resizeObserver.observe(navRef.current)
        if (linkRef.current) resizeObserver.observe(linkRef.current)

        return () => resizeObserver.disconnect()
    }, [linkPadding, font, items])

    const handleClick = (label: string, href?: string, target?: string) => {
        startTransition(() => {
            setInternalActiveLink(label)
        })
        
        // Navigate if href is provided
        if (href && typeof window !== "undefined") {
            // Add https:// if the URL doesn't have a protocol and isn't a relative path
            let finalHref = href
            if (!href.match(/^(https?:\/\/|mailto:|tel:|#|\/)/)) {
                finalHref = `https://${href}`
            }
            
            if (target === "_blank") {
                window.open(finalHref, "_blank")
            } else {
                window.location.href = finalHref
            }
        }
    }

    return (
        <nav
            ref={navRef}
            style={{
                display: "inline-flex",
                backgroundColor,
                borderRadius: navBorderRadius,
                padding,
                gap,
                position: "relative",
                width: "max-content",
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
            }}
        >
            {items.map((item, index) => {
                const isActive = item.label === internalActiveLink
                return (
                    <div
                        key={index}
                        ref={index === 0 ? linkRef : null}
                        onClick={() => handleClick(item.label, item.href, item.target)}
                        style={{
                            position: "relative",
                            padding: linkPadding,
                            textDecoration: "none",
                            color: isActive ? activeTextColor : textColor,
                            cursor: "pointer",
                            zIndex: 1,
                            transition: "color 0.3s ease",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            MozUserSelect: "none",
                            ...font,
                        }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeBackground"
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: activeBackgroundColor,
                                    borderRadius: linkBorderRadius,
                                    zIndex: -1,
                                }}
                                transition={transition}
                            />
                        )}
                        {item.label}
                    </div>
                )
            })}
        </nav>
    )
}

addPropertyControls(FloatingPillNavigation, {
    activeLink: {
        type: ControlType.String,
        title: "Active Link",
        defaultValue: "All products",
        description: "Enter the label of the link you want to be active initially",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "spring",
            stiffness: 800,
            damping: 60,
            mass: 1,
        },
    },
    linkPadding: {
        type: ControlType.Padding,
        title: "Link Padding",
        defaultValue: "12px 22px 12px 22px",
    },
    items: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    defaultValue: "Link",
                },
                href: {
                    type: ControlType.String,
                    title: "Link To",
                    placeholder: "/page or #section",
                    description: "Optional: Link to a page or section",
                },
                target: {
                    type: ControlType.Enum,
                    title: "Open In",
                    options: ["_self", "_blank"],
                    optionTitles: ["Same Tab", "New Tab"],
                    defaultValue: "_self",
                    hidden: (props) => !props.href,
                },
            },
        },
        defaultValue: [
            { label: "All products" },
            { label: "Laptops" },
            { label: "Desktops" },
            { label: "Displays" },
        ],
    },
    backgroundColor: {
        type: ControlType.Color,
        defaultValue: "#E8E8ED",
    },
    textColor: {
        type: ControlType.Color,
        defaultValue: "#000000",
        title: "Inactive Text",
    },
    activeBackgroundColor: {
        type: ControlType.Color,
        defaultValue: "#1D1D1F",
        title: "Active BG",
    },
    activeTextColor: {
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        title: "Active Text",
    },
    padding: {
        type: ControlType.Number,
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "17px",
            variant: "Regular",
            letterSpacing: "-0.37px",
            lineHeight: "20px",
        },
    },
})

FloatingPillNavigation.displayName = "Floating Pill Navigation"