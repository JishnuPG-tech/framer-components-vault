import * as React from "react"
import { useState, useEffect, useRef } from "react"
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


// ─── Component ────────────────────────────────────────────────────────────────

export default function AnimatedMenu(props) {
    const {
        navLinks,
        footerLinksData,
        menuBackgroundColor,
        menuTextColor,
        hoverLineColor,
        btnClosedBg,
        btnClosedColor,
        btnOpenBg,
        btnOpenColor,
        navFontSizeDesktop,
        navFontSizeMobile,
        footerFontSizeDesktop,
        footerFontSizeMobile,
        btnFontSizeDesktop,
        btnFontSizeMobile,
        menuWidthDesktop,
        menuHeightDesktop,
        menuWidthMobile,
        menuHeightMobile,
        mobileBreakpoint,
        springStiffness,
        springDamping,
        springMass,
        linkStiffness,
        linkDamping,
        linkDelayOffset,
        menuFont = defaultProps.menuFont,
    } = props

    const isStatic = useIsStaticRenderer()

    const [click, setClick] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [hover, setHoveredIndex] = useState(null)
    const [hover2, setHoveredIndex2] = useState(null)
    const menuId = "as-animated-menu-box"
    const ref = useRef(null)

    const [windowWidth, setWindowWidth] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth : 1000
    )

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setClick(false)
            }
        }

        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    useEffect(() => {
        let timeoutId

        if (click) {
            timeoutId = window.setTimeout(() => setMenuOpen(true), 500)
        } else {
            setMenuOpen(false)
        }

        return () => {
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId)
            }
        }
    }, [click])

    const isMobile = windowWidth < mobileBreakpoint
    const buttonWidth = isMobile ? "90px" : "110px"
    const buttonHeight = isMobile ? "40px" : "46px"

    const menuFontStyle = {
        fontFamily: menuFont?.fontFamily,
        fontWeight: menuFont?.fontWeight,
        fontStyle: menuFont?.fontStyle,
        letterSpacing: menuFont?.letterSpacing,
    }

    const perspectiveAnimation = {
        initial: { opacity: 0, rotateX: 100, translateY: 80 },
        enter: (i) => ({
            opacity: 1,
            rotateX: 0,
            translateY: 0,
            translateX: 0,
            transition: {
                delay: i * linkDelayOffset,
                type: "spring",
                stiffness: linkStiffness,
                damping: linkDamping,
                mass: 0.8,
            },
        }),
    }

    const footerAnimation = {
        initial: { opacity: 0, y: 20 },
        enter: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.5 + i * 0.1,
                type: "spring",
                stiffness: linkStiffness,
                damping: linkDamping,
                mass: 0.8,
            },
        }),
    }

    const menuAnimation = {
        open: {
            width: isMobile ? menuWidthMobile : menuWidthDesktop,
            height: isMobile ? menuHeightMobile : menuHeightDesktop,
            top: "0px",
            right: "0px",
            transition: {
                type: "spring",
                stiffness: springStiffness,
                damping: springDamping,
                mass: springMass,
            },
        },
        closed: {
            width: buttonWidth,
            height: buttonHeight,
            top: "8px",
            right: "8px",
            transition: {
                type: "spring",
                stiffness: springStiffness,
                damping: springDamping,
                mass: springMass,
            },
        },
    }

    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    display: "inline-block",
                    width: buttonWidth,
                    height: buttonHeight,
                }}
            >
                <button
                    style={{
                        width: buttonWidth,
                        height: buttonHeight,
                        borderRadius: "25px",
                        border: "none",
                        backgroundColor: btnClosedBg,
                        color: btnClosedColor,
                        fontSize: `${btnFontSizeDesktop}px`,
                        ...menuFontStyle,
                        fontWeight: menuFontStyle.fontWeight ?? 500,
                        cursor: "pointer",
                    }}
                >
                    MENU
                </button>
            </div>
        )
    }

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                display: "inline-block",
                width: buttonWidth,
                height: buttonHeight,
            }}
        >
            <motion.div
                id={menuId}
                role="menu"
                aria-label="Site navigation"
                style={{
                    position: "absolute",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    borderRadius: "24px",
                    backgroundColor: menuBackgroundColor,
                    ...menuFontStyle,
                    overflow: "hidden",
                    zIndex: 1,
                }}
                variants={menuAnimation}
                initial="closed"
                animate={click ? "open" : "closed"}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginLeft: isMobile ? "16px" : "40px",
                        marginTop: "16px",
                    }}
                >
                    <AnimatePresence>
                        {menuOpen &&
                            navLinks.map((link, i) => {
                                const isHovered = hover === i
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            marginBottom: "-4px",
                                            perspective: "70px",
                                            perspectiveOrigin: "bottom",
                                        }}
                                    >
                                        <motion.div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                            variants={perspectiveAnimation}
                                            initial="initial"
                                            animate="enter"
                                            exit="exit"
                                            onMouseEnter={() =>
                                                setHoveredIndex(i)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredIndex(null)
                                            }
                                            custom={i}
                                        >
                                            <motion.svg
                                                animate={
                                                    isHovered
                                                        ? { width: 48 }
                                                        : { width: 0 }
                                                }
                                                width="0"
                                                height="31"
                                                viewBox="0 0 105 62"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 200,
                                                    damping: 20,
                                                }}
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M0 31H103M103 31L73.5 1.5M103 31L73.5 60.5"
                                                    stroke={hoverLineColor}
                                                    strokeWidth="2"
                                                    vectorEffect="non-scaling-stroke"
                                                />
                                            </motion.svg>

                                            <motion.a
                                                href={link.url}
                                                role="menuitem"
                                                style={{
                                                    color: menuTextColor,
                                                    textDecoration: "none",
                                                    fontSize: isMobile
                                                        ? `${navFontSizeMobile}px`
                                                        : `${navFontSizeDesktop}px`,
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 200,
                                                    damping: 20,
                                                }}
                                            >
                                                {link.title}
                                            </motion.a>
                                        </motion.div>
                                    </div>
                                )
                            })}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            aria-label="Social links"
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(2, minmax(0, 1fr))",
                                marginLeft: isMobile ? "32px" : "52px",
                                marginTop: "32px",
                            }}
                        >
                            {footerLinksData.map((link, i) => {
                                const { title, url } = link
                                const isHovered2 = hover2 === i

                                return (
                                    <motion.div
                                        key={`f_${i}`}
                                        style={{
                                            position: "relative",
                                            width: "fit-content",
                                            marginBottom: "8px",
                                        }}
                                        variants={footerAnimation}
                                        custom={i}
                                        initial="initial"
                                        animate="enter"
                                        exit="exit"
                                        onMouseEnter={() => setHoveredIndex2(i)}
                                        onMouseLeave={() =>
                                            setHoveredIndex2(null)
                                        }
                                    >
                                        <motion.a
                                            href={url}
                                            role="menuitem"
                                            style={{
                                                color: menuTextColor,
                                                textDecoration: "none",
                                                fontSize: isMobile
                                                    ? `${footerFontSizeMobile}px`
                                                    : `${footerFontSizeDesktop}px`,
                                            }}
                                        >
                                            {title}
                                        </motion.a>

                                        <motion.div
                                            aria-hidden="true"
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                bottom: 0,
                                                height: "2px",
                                                backgroundColor: hoverLineColor,
                                            }}
                                            animate={{
                                                width: isHovered2
                                                    ? "100%"
                                                    : "0%",
                                            }}
                                            initial={{ width: "0%" }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 200,
                                                damping: 25,
                                            }}
                                        />
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <Menubutton
                click={click}
                setClick={setClick}
                isMobile={isMobile}
                btnClosedBg={btnClosedBg}
                btnClosedColor={btnClosedColor}
                btnOpenBg={btnOpenBg}
                btnOpenColor={btnOpenColor}
                btnFontSizeDesktop={btnFontSizeDesktop}
                btnFontSizeMobile={btnFontSizeMobile}
                menuId={menuId}
                menuOpen={menuOpen}
            />
        </div>
    )
}

// ─── Menu Button ──────────────────────────────────────────────────────────────

function Menubutton({
    click,
    setClick,
    isMobile,
    btnClosedBg,
    btnClosedColor,
    btnOpenBg,
    btnOpenColor,
    btnFontSizeDesktop,
    btnFontSizeMobile,
    menuId,
    menuOpen,
}) {
    const [hovered, setHovered] = useState(false)
    const fontSize = isMobile
        ? `${btnFontSizeMobile}px`
        : `${btnFontSizeDesktop}px`

    return (
        <button
            onClick={() => setClick(!click)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
            aria-label={click ? "Close menu" : "Open menu"}
            style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                cursor: "pointer",
                fontFamily: "inherit",
                zIndex: 2,
                width: isMobile ? "90px" : "110px",
                height: isMobile ? "40px" : "46px",
                borderRadius: "25px",
                overflow: "hidden",
                border: "none",
                padding: 0,
                backgroundColor: "transparent",
            }}
        >
            <motion.div
                style={{ position: "relative", width: "100%", height: "100%" }}
                animate={{ y: click ? "-100%" : "0%" }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
            >
                <div
                    style={{
                        position: "relative",
                        height: "100%",
                        width: "100%",
                        overflow: "hidden",
                    }}
                >
                    <motion.div
                        style={{ height: "100%", width: "100%" }}
                        animate={{ y: hovered ? "-100%" : "0%" }}
                        initial={false}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 22,
                        }}
                    >
                        <ButtonLabel
                            bg={btnClosedBg}
                            clr={btnClosedColor}
                            fontSize={fontSize}
                        >
                            MENU
                        </ButtonLabel>
                    </motion.div>

                    <motion.div
                        style={{ position: "absolute", inset: 0 }}
                        animate={{ y: hovered ? "0%" : "100%" }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 22,
                        }}
                        initial={false}
                    >
                        <ButtonLabel
                            bg={btnClosedBg}
                            clr={btnClosedColor}
                            fontSize={fontSize}
                        >
                            MENU
                        </ButtonLabel>
                    </motion.div>
                </div>

                <div
                    style={{
                        position: "relative",
                        height: "100%",
                        width: "100%",
                        overflow: "hidden",
                    }}
                >
                    <motion.div
                        style={{ height: "100%", width: "100%" }}
                        animate={{ y: hovered ? "-100%" : "0%" }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 22,
                        }}
                    >
                        <ButtonLabel
                            bg={btnOpenBg}
                            clr={btnOpenColor}
                            fontSize={fontSize}
                        >
                            CLOSE
                        </ButtonLabel>
                    </motion.div>

                    <motion.div
                        style={{ position: "absolute", inset: 0 }}
                        animate={{ y: hovered ? "0%" : "100%" }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 22,
                        }}
                        initial={false}
                    >
                        <ButtonLabel
                            bg={btnOpenBg}
                            clr={btnOpenColor}
                            fontSize={fontSize}
                        >
                            CLOSE
                        </ButtonLabel>
                    </motion.div>
                </div>
            </motion.div>
        </button>
    )
}

// ─── Button Label ─────────────────────────────────────────────────────────────

function ButtonLabel({ children, bg, clr, fontSize }) {
    return (
        <div
            style={{
                height: "100%",
                width: "100%",
                cursor: "pointer",
                fontSize: fontSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: bg,
                color: clr,
                fontWeight: 500,
            }}
        >
            {children}
        </div>
    )
}

// ─── Default Props ────────────────────────────────────────────────────────────

const defaultProps = {
    menuBackgroundColor: "#000000",
    menuTextColor: "#FFFFFF",
    hoverLineColor: "#FFFFFF",
    btnClosedBg: "#000000",
    btnClosedColor: "#FFFFFF",
    btnOpenBg: "#FFFFFF",
    btnOpenColor: "#000000",
    navFontSizeDesktop: 46,
    navFontSizeMobile: 36,
    footerFontSizeDesktop: 20,
    footerFontSizeMobile: 18,
    btnFontSizeDesktop: 18,
    btnFontSizeMobile: 16,
    menuWidthDesktop: "440px",
    menuHeightDesktop: "460px",
    menuWidthMobile: "90vw",
    menuHeightMobile: "60vh",
    mobileBreakpoint: 768,
    springStiffness: 60,
    springDamping: 14,
    springMass: 1,
    linkStiffness: 80,
    linkDamping: 15,
    linkDelayOffset: 0.03,
    menuFont: { fontFamily: "Inter", fontWeight: 500 },
    navLinks: [
        { title: "About", url: "/" },
        { title: "Skills", url: "/" },
        { title: "Experience", url: "/" },
        { title: "Projects", url: "/" },
        { title: "Contact", url: "/" },
    ],
    footerLinksData: [
        { title: "Facebook", url: "/" },
        { title: "LinkedIn", url: "/" },
        { title: "Instagram", url: "/" },
        { title: "Twitter", url: "/" },
    ],
}

AnimatedMenu.defaultProps = defaultProps

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(AnimatedMenu, {
    navLinks: {
        type: ControlType.Array,
        title: "Main Links",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                url: { type: ControlType.String, title: "URL" },
            },
        },
    },
    footerLinksData: {
        type: ControlType.Array,
        title: "Footer Links",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                url: { type: ControlType.String, title: "URL" },
            },
        },
    },

    menuBackgroundColor: {
        type: ControlType.Color,
        title: "Menu BG",
        defaultValue: defaultProps.menuBackgroundColor,
    },
    menuTextColor: {
        type: ControlType.Color,
        title: "Menu Text",
        defaultValue: defaultProps.menuTextColor,
    },
    hoverLineColor: {
        type: ControlType.Color,
        title: "Hover Accents",
        defaultValue: defaultProps.hoverLineColor,
    },
    btnClosedBg: {
        type: ControlType.Color,
        title: "Btn Closed BG",
        defaultValue: defaultProps.btnClosedBg,
    },
    btnClosedColor: {
        type: ControlType.Color,
        title: "Btn Closed Text",
        defaultValue: defaultProps.btnClosedColor,
    },
    btnOpenBg: {
        type: ControlType.Color,
        title: "Btn Open BG",
        defaultValue: defaultProps.btnOpenBg,
    },
    btnOpenColor: {
        type: ControlType.Color,
        title: "Btn Open Text",
        defaultValue: defaultProps.btnOpenColor,
    },

    menuFont: {
        type: ControlType.Font,
        title: "Menu Font",
        controls: "extended",
    },
    navFontSizeDesktop: {
        type: ControlType.Number,
        title: "Nav Size (D)",
        min: 10,
        max: 120,
        defaultValue: defaultProps.navFontSizeDesktop,
        displayStepper: true,
    },
    navFontSizeMobile: {
        type: ControlType.Number,
        title: "Nav Size (M)",
        min: 10,
        max: 100,
        defaultValue: defaultProps.navFontSizeMobile,
        displayStepper: true,
    },
    footerFontSizeDesktop: {
        type: ControlType.Number,
        title: "Footer Size (D)",
        min: 10,
        max: 60,
        defaultValue: defaultProps.footerFontSizeDesktop,
        displayStepper: true,
    },
    footerFontSizeMobile: {
        type: ControlType.Number,
        title: "Footer Size (M)",
        min: 10,
        max: 60,
        defaultValue: defaultProps.footerFontSizeMobile,
        displayStepper: true,
    },
    btnFontSizeDesktop: {
        type: ControlType.Number,
        title: "Button Size (D)",
        min: 10,
        max: 40,
        defaultValue: defaultProps.btnFontSizeDesktop,
        displayStepper: true,
    },
    btnFontSizeMobile: {
        type: ControlType.Number,
        title: "Button Size (M)",
        min: 10,
        max: 40,
        defaultValue: defaultProps.btnFontSizeMobile,
        displayStepper: true,
    },

    menuWidthDesktop: {
        type: ControlType.String,
        title: "Width (D)",
        defaultValue: defaultProps.menuWidthDesktop,
        description: "Use px, vw, or %",
    },
    menuHeightDesktop: {
        type: ControlType.String,
        title: "Height (D)",
        defaultValue: defaultProps.menuHeightDesktop,
    },
    menuWidthMobile: {
        type: ControlType.String,
        title: "Width (M)",
        defaultValue: defaultProps.menuWidthMobile,
    },
    menuHeightMobile: {
        type: ControlType.String,
        title: "Height (M)",
        defaultValue: defaultProps.menuHeightMobile,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        min: 320,
        max: 1200,
        defaultValue: defaultProps.mobileBreakpoint,
        displayStepper: true,
    },

    springStiffness: {
        type: ControlType.Number,
        title: "Panel Stiffness",
        min: 10,
        max: 300,
        defaultValue: defaultProps.springStiffness,
        description: "Bounciness of the main menu panel opening.",
        displayStepper: true,
    },
    springDamping: {
        type: ControlType.Number,
        title: "Panel Damping",
        min: 1,
        max: 50,
        defaultValue: defaultProps.springDamping,
        description: "Friction of the main menu panel.",
        displayStepper: true,
    },
    springMass: {
        type: ControlType.Number,
        title: "Panel Mass",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: defaultProps.springMass,
        description: "Weight feel of the menu panel spring.",
        displayStepper: true,
    },
    linkStiffness: {
        type: ControlType.Number,
        title: "Link Stiffness",
        min: 10,
        max: 300,
        defaultValue: defaultProps.linkStiffness,
        description: "Bounciness of the text flying in.",
        displayStepper: true,
    },
    linkDamping: {
        type: ControlType.Number,
        title: "Link Damping",
        min: 1,
        max: 50,
        defaultValue: defaultProps.linkDamping,
        displayStepper: true,
    },
    linkDelayOffset: {
        type: ControlType.Number,
        title: "Stagger Delay",
        min: 0.01,
        max: 0.5,
        step: 0.01,
        defaultValue: defaultProps.linkDelayOffset,
        description: "Time between each link animating in.",
        displayStepper: true,
    },
})

AnimatedMenu.displayName = "Morphed Menu"
