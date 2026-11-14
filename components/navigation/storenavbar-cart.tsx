// Create a fully responsive, pixel-perfect navigation bar component in Framer that replicates the Kalstore® navbar with sticky behavior, scroll border, desktop mega dropdown for Shop, mobile full-screen menu with accordion + focus trap, and right-side icons including cart badge and slide-in cart drawer—all customizable via Framer props.

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

import { AnimatePresence, motion } from "framer-motion"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type Side = "left" | "right"

interface CategoryItem {
    label: string
    href: string
    subItems?: { label: string; href: string }[]
}

interface KalstoreNavbarProps {
    logoText: string
    logoImage?: ResponsiveImage
    showLogo: boolean
    showLogoText: boolean
    navBackground: string
    navBorderColor: string
    navHeight: number
    linkColor: string
    linkFontSize: number
    showCartBadge: boolean
    cartCount: number
    showAccountIcon: boolean
    accountIconLabel: string
    accountLink: string
    showCartIcon: boolean
    cartIconLabel: string
    cartLink: string
    cartDrawerTitle: string
    cartDrawerEmptyMessage: string
    cartDrawerDescription: string
    cartButtonLabel: string
    cartButtonBackground: string
    cartButtonTextColor: string
    dropdownColumns: number
    mobileMenuSide: Side
    stickyBorderOnScroll: boolean
    showStoriesLink: boolean
    showAboutLink: boolean
    aboutHref: string
    storiesHref: string
    categories: CategoryItem[]
    showDropdownImage: boolean
    dropdownImage?: ResponsiveImage
    dropdownImageWidth: number
    dropdownImageAspectRatio: string
    dropdownImageTitle: string
    dropdownImageLink: string
    showMobileRegion: boolean
    mobileRegionLabel: string
    mobileRegionLink: string
    mobileCurrencyLabel: string
    showMobileAccount: boolean
    mobileAccountLabel: string
    mobileAccountLink: string
    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n))
}

function useMediaQuery(query: string) {
    const isStatic = useIsStaticRenderer()
    const [matches, setMatches] = React.useState(false)

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const mql = window.matchMedia(query)
        const onChange = () => {
            React.startTransition(() => setMatches(!!mql.matches))
        }

        onChange()
        if (typeof mql.addEventListener === "function") {
            mql.addEventListener("change", onChange)
            return () => mql.removeEventListener("change", onChange)
        }

        // Safari
        // @ts-ignore
        mql.addListener(onChange)
        // @ts-ignore
        return () => mql.removeListener(onChange)
    }, [query, isStatic])

    return matches
}

function getPathnameSafe(): string {
    if (typeof window === "undefined") return "/"
    try {
        return window.location?.pathname || "/"
    } catch {
        return "/"
    }
}

function useScrollY(threshold: number, disabled: boolean) {
    const isStatic = useIsStaticRenderer()
    const [scrolled, setScrolled] = React.useState(false)

    React.useEffect(() => {
        if (disabled) return
        if (isStatic) return
        if (typeof window === "undefined") return

        const onScroll = () => {
            const y = window.scrollY || 0
            const next = y > threshold
            React.startTransition(() => setScrolled(next))
        }

        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [threshold, disabled, isStatic])

    return scrolled
}

function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
    if (!root) return []
    const nodes = Array.from(
        root.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
    )
    return nodes.filter((el) => {
        const style = typeof window !== "undefined" ? window.getComputedStyle(el) : null
        if (!style) return true
        return style.display !== "none" && style.visibility !== "hidden"
    })
}

function useFocusTrap(active: boolean, panelRef: React.RefObject<HTMLElement>, onEscape?: () => void) {
    const isStatic = useIsStaticRenderer()

    React.useEffect(() => {
        if (!active) return
        if (isStatic) return
        if (typeof document === "undefined") return

        const panel = panelRef.current
        if (!panel) return

        const previouslyFocused = document.activeElement as HTMLElement | null

        const focusables = getFocusableElements(panel)
        const first = focusables[0] || panel
        const last = focusables[focusables.length - 1] || panel

        // Ensure focus enters panel
        if (typeof first.focus === "function") {
            first.focus()
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation()
                onEscape?.()
                return
            }

            if (e.key !== "Tab") return
            const current = document.activeElement as HTMLElement | null

            // Recompute in case content changed
            const updated = getFocusableElements(panel)
            const updatedFirst = updated[0] || panel
            const updatedLast = updated[updated.length - 1] || panel

            if (e.shiftKey) {
                if (!current || current === updatedFirst || current === panel) {
                    e.preventDefault()
                    updatedLast.focus()
                }
            } else {
                if (current === updatedLast) {
                    e.preventDefault()
                    updatedFirst.focus()
                }
            }
        }

        document.addEventListener("keydown", onKeyDown, true)

        return () => {
            document.removeEventListener("keydown", onKeyDown, true)
            if (previouslyFocused && typeof previouslyFocused.focus === "function") {
                previouslyFocused.focus()
            }
        }
    }, [active, panelRef, onEscape, isStatic])
}

function IconButton({
    ariaLabel,
    onClick,
    href,
    children,
    className,
}: {
    ariaLabel: string
    onClick?: () => void
    href?: string
    children: React.ReactNode
    className?: string
}) {
    const common: React.CSSProperties = {
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        background: "transparent",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        borderRadius: 6,
        color: "inherit",
        textDecoration: "none",
        outline: "none",
    }

    if (href) {
        return (
            <a className={className} aria-label={ariaLabel} href={href} style={common}>
                {children}
            </a>
        )
    }

    return (
        <button className={className} aria-label={ariaLabel} onClick={onClick} type="button" style={common}>
            {children}
        </button>
    )
}

/**
 * Kalstore Navbar
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 56
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function KalstoreNavbar(props: KalstoreNavbarProps) {
    const {
        logoText,
        logoImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Kalstore logo",
        },
        showLogo = true,
        showLogoText = true,
        navBackground,
        navBorderColor,
        navHeight,
        linkColor,
        linkFontSize,
        showCartBadge,
        cartCount,
        showAccountIcon,
        accountIconLabel = "Account",
        accountLink = "/account/login",
        showCartIcon = true,
        cartIconLabel = "Open cart",
        cartLink = "/cart",
        cartDrawerTitle = "Cart",
        cartDrawerEmptyMessage = "Your cart is empty.",
        cartDrawerDescription = "This is a visual drawer replica. Connect it to your ecommerce/cart logic via Framer overrides or CMS.",
        cartButtonLabel = "Go to cart",
        cartButtonBackground = "#1A1A1A",
        cartButtonTextColor = "#FFFFFF",
        dropdownColumns,
        mobileMenuSide,
        stickyBorderOnScroll,
        showStoriesLink,
        showAboutLink,
        aboutHref = "/pages/about",
        storiesHref = "/blogs/stories",
        categories = [
            {
                label: "Calendars",
                href: "/collections/calendars",
                subItems: [
                    { label: "Wall", href: "/collections/calendars?type=wall" },
                    { label: "Personal", href: "/collections/calendars?type=personal" },
                    { label: "Desk", href: "/collections/calendars?type=desk" },
                ],
            },
            { label: "Notebooks", href: "/collections/notebooks", subItems: [] },
            { label: "Refills & Accessories", href: "/collections/refills-accessories", subItems: [] },
            { label: "Bundles", href: "/collections/bundles", subItems: [] },
            { label: "All products", href: "/collections/all", subItems: [] },
        ],
        showDropdownImage = true,
        dropdownImage = {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Featured product",
        },
        dropdownImageWidth = 100,
        dropdownImageAspectRatio = "3/4",
        dropdownImageTitle = "Featured Collection",
        dropdownImageLink = "/collections/featured",
        showMobileRegion = true,
        mobileRegionLabel = "Poland",
        mobileRegionLink = "/pages/region",
        mobileCurrencyLabel = "PLN",
        showMobileAccount = true,
        mobileAccountLabel = "Account",
        mobileAccountLink = "/account/login",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const isMobile = useMediaQuery("(max-width: 768px)")

    const [shopOpen, setShopOpen] = React.useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
    const [mobileShopOpen, setMobileShopOpen] = React.useState(false)
    const [cartOpen, setCartOpen] = React.useState(false)

    const closeTimers = React.useRef<{ shop?: number } | null>(null)

    const scrolled = useScrollY(10, !stickyBorderOnScroll)

    const uid = React.useId().replace(/:/g, "")
    const cssScope = `kalstoreNav_${uid}`

    const pathname = React.useMemo(() => getPathnameSafe(), [typeof window !== "undefined" ? window.location?.pathname : ""])

    const links = React.useMemo(() => {
        const items: { label: string; href: string; visible: boolean; isShop?: boolean }[] = [
            { label: "Shop", href: "/collections/all", visible: true, isShop: true },
            { label: "About", href: aboutHref, visible: !!showAboutLink },
            { label: "Stories", href: storiesHref, visible: !!showStoriesLink },
        ]
        return items.filter((i) => i.visible)
    }, [showAboutLink, showStoriesLink, aboutHref, storiesHref])

    const activeHref = React.useMemo(() => {
        // Minimal heuristic for underline active page
        const p = pathname || "/"
        if (p === "/" || p.startsWith("/collections") || p.startsWith("/products") || p.startsWith("/cart")) return "Shop"
        if (p.startsWith("/pages/about")) return "About"
        if (p.startsWith("/blogs") || p.startsWith("/blog") || p.startsWith("/stories")) return "Stories"
        return ""
    }, [pathname])

    const borderOpacity = stickyBorderOnScroll ? (scrolled ? 1 : 0) : 1

    const desktopHeight = clamp(navHeight, 40, 88)
    const mobileHeight = 52

    const currentHeight = isMobile ? mobileHeight : desktopHeight

    const clearShopCloseTimer = React.useCallback(() => {
        if (!closeTimers.current) return
        if (closeTimers.current.shop) {
            const t = closeTimers.current.shop
            closeTimers.current.shop = undefined
            if (typeof window !== "undefined") window.clearTimeout(t)
        }
    }, [])

    const openShop = React.useCallback(() => {
        clearShopCloseTimer()
        React.startTransition(() => setShopOpen(true))
    }, [clearShopCloseTimer])

    const closeShop = React.useCallback((delayMs: number) => {
        clearShopCloseTimer()
        if (delayMs <= 0) {
            React.startTransition(() => setShopOpen(false))
            return
        }
        if (typeof window === "undefined") {
            React.startTransition(() => setShopOpen(false))
            return
        }
        if (!closeTimers.current) closeTimers.current = {}
        closeTimers.current.shop = window.setTimeout(() => {
            React.startTransition(() => setShopOpen(false))
        }, delayMs)
    }, [clearShopCloseTimer])

    const closeAllOverlays = React.useCallback(() => {
        clearShopCloseTimer()
        React.startTransition(() => {
            setShopOpen(false)
            setMobileMenuOpen(false)
            setMobileShopOpen(false)
            setCartOpen(false)
        })
    }, [clearShopCloseTimer])

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return
            if (shopOpen || mobileMenuOpen || cartOpen) {
                e.stopPropagation()
                closeAllOverlays()
            }
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [shopOpen, mobileMenuOpen, cartOpen, closeAllOverlays, isStatic])

    // Close desktop dropdown if we go mobile, and vice versa
    React.useEffect(() => {
        if (isMobile) {
            React.startTransition(() => setShopOpen(false))
        } else {
            React.startTransition(() => {
                setMobileMenuOpen(false)
                setMobileShopOpen(false)
            })
        }
    }, [isMobile])

    const mobilePanelRef = React.useRef<HTMLDivElement>(null)
    useFocusTrap(mobileMenuOpen, mobilePanelRef, () => {
        React.startTransition(() => setMobileMenuOpen(false))
    })

    const cartPanelRef = React.useRef<HTMLDivElement>(null)
    useFocusTrap(cartOpen, cartPanelRef, () => {
        React.startTransition(() => setCartOpen(false))
    })

    const paddingX = isMobile ? 16 : 32

    const underlineStyle: React.CSSProperties = {
        textDecoration: "underline",
        textDecorationThickness: "1px",
        textUnderlineOffset: "3px",
    }

    const navLinkBase: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 12px",
        borderRadius: 4,
        fontSize: linkFontSize,
        fontWeight: 400,
        letterSpacing: "0.01em",
        color: linkColor,
        textDecoration: "none",
        lineHeight: "1em",
        height: 28,
        userSelect: "none",
        background: "transparent",
        outline: "none",
    }

    const logoTextStyle: React.CSSProperties = {
        fontSize: isMobile ? 14 : 15,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: "#1A1A1A",
        textDecoration: "none",
        lineHeight: "1em",
        display: "inline-flex",
        alignItems: "center",
    }

    const showFeaturedImage = dropdownColumns >= 2

    const dropdownGridColumns = React.useMemo(() => {
        const cols = clamp(Math.round(dropdownColumns || 2), 1, 3)
        if (cols <= 1) return "1fr"
        // Keep an editorial feel: left list a bit wider, image narrower
        const imageWidthPercent = clamp(dropdownImageWidth, 20, 100)
        const listWidth = 100 - imageWidthPercent
        return `${listWidth}fr ${imageWidthPercent}fr`
    }, [dropdownColumns, dropdownImageWidth])

    const onShopTriggerClickMobile = React.useCallback(() => {
        // On mobile, shop opens as accordion inside the menu
        React.startTransition(() => setMobileShopOpen((v) => !v))
    }, [])

    const onShopTriggerTap = React.useCallback(() => {
        if (isMobile) {
            // On mobile top bar, open menu first and expand Shop
            React.startTransition(() => {
                setMobileMenuOpen(true)
                setMobileShopOpen(true)
            })
            return
        }
        // Desktop: click toggles as a fallback
        React.startTransition(() => setShopOpen((v) => !v))
    }, [isMobile])

    const onHamburger = React.useCallback(() => {
        React.startTransition(() => setMobileMenuOpen(true))
    }, [])

    const onCloseMobileMenu = React.useCallback(() => {
        React.startTransition(() => {
            setMobileMenuOpen(false)
            setMobileShopOpen(false)
        })
    }, [])

    const onOpenCart = React.useCallback(() => {
        React.startTransition(() => setCartOpen(true))
    }, [])

    const onCloseCart = React.useCallback(() => {
        React.startTransition(() => setCartOpen(false))
    }, [])

    const cartBadgeVisible = showCartBadge && (cartCount || 0) > 0

    const shouldRenderDropdown = !isMobile && shopOpen

    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail

    return (
        <div
            className={cssScope}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: currentHeight,
                zIndex: 100,
                background: navBackground,
                top: 0,
                left: 0,
            }}
        >
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    .${cssScope} * { box-sizing: border-box; }
                    .${cssScope} { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
                    .${cssScope} a, .${cssScope} button { font-family: inherit; }

                    .${cssScope} .navSticky { position: sticky; top: 0; z-index: 100; }

                    .${cssScope} .hoverUnderline:hover { color: #000000 !important; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
                    .${cssScope} .iconHover { transition: opacity 150ms ease; }
                    .${cssScope} .iconHover:hover { opacity: 0.6; }

                    .${cssScope} .desktopCenter { display: flex; }
                    .${cssScope} .mobileOnly { display: none; }

                    @media (max-width: 768px) {
                        .${cssScope} { height: ${mobileHeight}px; }
                        .${cssScope} .desktopCenter { display: none !important; }
                        .${cssScope} .mobileOnly { display: inline-flex; }
                    }

                    @media (max-width: 480px) {
                        .${cssScope} { height: ${mobileHeight}px; }
                    }

                    @media (max-width: 360px) {
                        .${cssScope} { height: 48px; }
                    }
                `,
                }}
            />

            <div
                className="navSticky"
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100%",
                    height: currentHeight,
                    background: navBackground,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        height: currentHeight,
                        width: "100%",
                        paddingLeft: paddingX,
                        paddingRight: paddingX,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* Inner max-width container */}
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            maxWidth: 1200,
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        {/* Left */}
                        <div style={{ position: "relative", display: "flex", alignItems: "center", minWidth: isMobile ? 80 : 120 }}>
                            {showLogo && (
                                <a
                                    href="/"
                                    aria-label="Home"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        color: "inherit",
                                        textDecoration: "none",
                                        outline: "none",
                                        padding: isMobile ? "8px 4px" : "8px",
                                        margin: isMobile ? "-8px -4px" : "-8px",
                                    }}
                                >
                                    {logoImage?.src && logoImage?.src !== "" && !showLogoText ? (
                                        <img
                                            src={logoImage.src}
                                            srcSet={logoImage.srcSet}
                                            alt={logoImage.alt || "Kalstore"}
                                            style={{
                                                maxHeight: isMobile ? 18 : 20,
                                                width: "auto",
                                                display: "block",
                                                objectFit: "contain",
                                            }}
                                        />
                                    ) : showLogoText ? (
                                        <span style={logoTextStyle}>{logoText}</span>
                                    ) : null}
                                </a>
                            )}
                        </div>

                        {/* Center (Desktop) */}
                        <nav
                            aria-label="Main navigation"
                            className="desktopCenter"
                            style={{
                                position: "relative",
                                flex: 1,
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0,
                            }}
                        >
                            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 0 }}>
                                {links.map((l) => {
                                    const isActive = activeHref === l.label
                                    const isShop = !!l.isShop

                                    const commonProps = {
                                        href: l.href,
                                        className: `hoverUnderline`,
                                        style: {
                                            ...navLinkBase,
                                            ...(isActive ? underlineStyle : null),
                                        } as React.CSSProperties,
                                    }

                                    if (!isShop) {
                                        return (
                                            <a key={l.label} {...commonProps}>
                                                {l.label}
                                            </a>
                                        )
                                    }

                                    return (
                                        <a
                                            key={l.label}
                                            {...commonProps}
                                            role="button"
                                            aria-haspopup="menu"
                                            aria-expanded={shopOpen}
                                            onMouseEnter={isStatic ? undefined : openShop}
                                            onMouseLeave={isStatic ? undefined : () => closeShop(300)}
                                            onFocus={isStatic ? undefined : openShop}
                                            onBlur={isStatic ? undefined : () => closeShop(150)}
                                            onClick={(e) => {
                                                // keep link but allow toggle in Framer
                                                e.preventDefault()
                                                onShopTriggerTap()
                                            }}
                                        >
                                            {l.label}
                                        </a>
                                    )
                                })}
                            </div>
                        </nav>

                        {/* Right */}
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: isMobile ? 12 : 16,
                                minWidth: isMobile ? 80 : 120,
                            }}
                        >
                            {/* Desktop account - hidden on mobile */}
                            {showAccountIcon && !isMobile && (
                                <IconButton
                                    className="iconHover"
                                    ariaLabel={accountIconLabel}
                                    href={accountLink}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M20 21a8 8 0 10-16 0"
                                            stroke="#1A1A1A"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M12 13a4.5 4.5 0 100-9 4.5 4.5 0 000 9z"
                                            stroke="#1A1A1A"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </IconButton>
                            )}

                            {/* Cart - always visible */}
                            {showCartIcon && (
                                <div style={{ position: "relative" }}>
                                    <IconButton className="iconHover" ariaLabel={cartIconLabel} onClick={onOpenCart}>
                                        <svg
                                            width={isMobile ? 22 : 18}
                                            height={isMobile ? 22 : 18}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M7 7h14l-1.2 13H8.2L7 7z"
                                                stroke="#1A1A1A"
                                                strokeWidth="1.5"
                                                strokeLinejoin="round"
                                            />
                                            <path
                                                d="M9 7a3 3 0 016 0"
                                                stroke="#1A1A1A"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </IconButton>
                                    {cartBadgeVisible && (
                                        <div
                                            aria-label={`Cart items: ${cartCount}`}
                                            style={{
                                                position: "absolute",
                                                top: isMobile ? -2 : 2,
                                                right: isMobile ? -2 : 2,
                                                minWidth: isMobile ? 18 : 14,
                                                height: isMobile ? 18 : 14,
                                                padding: "0 4px",
                                                borderRadius: 999,
                                                background: "#1A1A1A",
                                                color: "#FFFFFF",
                                                fontSize: isMobile ? 11 : 10,
                                                fontWeight: 500,
                                                lineHeight: isMobile ? "18px" : "14px",
                                                textAlign: "center",
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {Math.min(99, Math.max(1, Math.round(cartCount || 0)))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mobile hamburger - only visible on mobile */}
                            {isMobile && (
                                <IconButton
                                    className="iconHover"
                                    ariaLabel="Open menu"
                                    onClick={onHamburger}
                                >
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M4 7h16M4 12h16M4 17h16"
                                            stroke="#1A1A1A"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </IconButton>
                            )}
                        </div>
                    </div>

                    {/* Scroll border overlay */}
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 1,
                            background: navBorderColor,
                            opacity: borderOpacity,
                            transition: "opacity 200ms ease",
                            pointerEvents: "none",
                        }}
                    />
                </div>

                {/* Desktop mega dropdown */}
                <AnimatePresence>
                    {shouldRenderDropdown && !isThumbnail && (
                        <motion.div
                            role="menu"
                            aria-label="Shop menu"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            onMouseEnter={isStatic ? undefined : openShop}
                            onMouseLeave={isStatic ? undefined : () => closeShop(300)}
                            style={{
                                position: "relative",
                                width: "100%",
                                background: navBackground,
                                borderTop: `1px solid ${navBorderColor}`,
                                borderBottom: `1px solid ${navBorderColor}`,
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    paddingLeft: paddingX,
                                    paddingRight: paddingX,
                                    paddingTop: 24,
                                    paddingBottom: 24,
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <div
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        maxWidth: 1200,
                                        display: "grid",
                                        gridTemplateColumns: dropdownGridColumns,
                                        gap: 32,
                                        alignItems: "start",
                                    }}
                                >
                                    <div style={{ position: "relative" }}>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: "#888888",
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                                fontWeight: 500,
                                                marginBottom: 14,
                                                lineHeight: "1em",
                                            }}
                                        >
                                            Shop
                                        </div>
                                        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
                                            {categories.map((c) => (
                                                <div key={c.label} style={{ position: "relative" }}>
                                                    <a
                                                        href={c.href}
                                                        style={{
                                                            display: "inline-flex",
                                                            padding: "6px 0",
                                                            fontSize: 14,
                                                            fontWeight: 400,
                                                            color: "#1A1A1A",
                                                            textDecoration: "none",
                                                            lineHeight: "1.2em",
                                                        }}
                                                        className="hoverUnderline"
                                                        onClick={() => {
                                                            React.startTransition(() => setShopOpen(false))
                                                        }}
                                                    >
                                                        {c.label}
                                                    </a>
                                                    {c.subItems && c.subItems.length > 0 && (
                                                        <div style={{ marginLeft: 12, marginTop: 2, marginBottom: 6 }}>
                                                            {c.subItems.map((s) => (
                                                                <a
                                                                    key={s.label}
                                                                    href={s.href}
                                                                    style={{
                                                                        display: "block",
                                                                        padding: "4px 0",
                                                                        fontSize: 13,
                                                                        fontWeight: 400,
                                                                        color: "#555555",
                                                                        textDecoration: "none",
                                                                        lineHeight: "1.2em",
                                                                    }}
                                                                    className="hoverUnderline"
                                                                    onClick={() => {
                                                                        React.startTransition(() => setShopOpen(false))
                                                                    }}
                                                                >
                                                                    {s.label}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {showFeaturedImage && showDropdownImage && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            style={{
                                                position: "relative",
                                                width: "100%",
                                            }}
                                        >
                                            {dropdownImageLink ? (
                                                <a
                                                    href={dropdownImageLink}
                                                    style={{
                                                        display: "block",
                                                        textDecoration: "none",
                                                        color: "inherit",
                                                    }}
                                                    onClick={() => {
                                                        React.startTransition(() => setShopOpen(false))
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            position: "relative",
                                                            width: "100%",
                                                            aspectRatio: dropdownImageAspectRatio,
                                                            borderRadius: 2,
                                                            overflow: "hidden",
                                                            background: "#F5F5F5",
                                                            transition: "opacity 150ms ease",
                                                        }}
                                                        className="iconHover"
                                                    >
                                                        <img
                                                            src={dropdownImage?.src || "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg"}
                                                            srcSet={dropdownImage?.srcSet}
                                                            alt={dropdownImage?.alt || ""}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                                        />
                                                    </div>
                                                    {dropdownImageTitle && (
                                                        <div
                                                            style={{
                                                                marginTop: 12,
                                                                fontSize: 14,
                                                                fontWeight: 400,
                                                                color: "#1A1A1A",
                                                                lineHeight: "1.3em",
                                                            }}
                                                            className="hoverUnderline"
                                                        >
                                                            {dropdownImageTitle}
                                                        </div>
                                                    )}
                                                </a>
                                            ) : (
                                                <>
                                                    <div
                                                        style={{
                                                            position: "relative",
                                                            width: "100%",
                                                            aspectRatio: dropdownImageAspectRatio,
                                                            borderRadius: 2,
                                                            overflow: "hidden",
                                                            background: "#F5F5F5",
                                                        }}
                                                    >
                                                        <img
                                                            src={dropdownImage?.src || "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg"}
                                                            srcSet={dropdownImage?.srcSet}
                                                            alt={dropdownImage?.alt || ""}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                                        />
                                                    </div>
                                                    {dropdownImageTitle && (
                                                        <div
                                                            style={{
                                                                marginTop: 12,
                                                                fontSize: 14,
                                                                fontWeight: 400,
                                                                color: "#1A1A1A",
                                                                lineHeight: "1.3em",
                                                            }}
                                                        >
                                                            {dropdownImageTitle}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile menu overlay */}
            <AnimatePresence>
                {mobileMenuOpen && !isThumbnail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.0)",
                            zIndex: 1000,
                        }}
                        onMouseDown={(e) => {
                            // Click outside to close
                            if (e.target === e.currentTarget) onCloseMobileMenu()
                        }}
                        aria-hidden={false}
                    >
                        <motion.div
                            ref={mobilePanelRef}
                            role="dialog"
                            aria-label="Mobile navigation"
                            initial={{ x: mobileMenuSide === "left" ? "-100%" : "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: mobileMenuSide === "left" ? "-100%" : "100%" }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                width: "100%",
                                maxWidth: 520,
                                left: mobileMenuSide === "left" ? 0 : undefined,
                                right: mobileMenuSide === "right" ? 0 : undefined,
                                background: navBackground,
                                display: "flex",
                                flexDirection: "column",
                                padding: 20,
                                borderRight: mobileMenuSide === "left" ? `1px solid ${navBorderColor}` : undefined,
                                borderLeft: mobileMenuSide === "right" ? `1px solid ${navBorderColor}` : undefined,
                                overflow: "auto",
                                WebkitOverflowScrolling: "touch",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                <a
                                    href="/"
                                    style={{
                                        ...logoTextStyle,
                                        fontSize: 15,
                                        padding: "10px 8px",
                                        borderRadius: 6,
                                    }}
                                >
                                    {logoText}
                                </a>
                                <IconButton className="iconHover" ariaLabel="Close menu" onClick={onCloseMobileMenu}>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M6 6l12 12M18 6L6 18"
                                            stroke="#1A1A1A"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </IconButton>
                            </div>

                            <div
                                style={{
                                    height: 1,
                                    background: navBorderColor,
                                    marginTop: 16,
                                    marginBottom: 16,
                                }}
                            />

                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {/* Shop accordion */}
                                <button
                                    type="button"
                                    onClick={onShopTriggerClickMobile}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "16px 12px",
                                        fontSize: 18,
                                        fontWeight: 400,
                                        color: "#1A1A1A",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        borderRadius: 8,
                                        minHeight: 48,
                                        WebkitTapHighlightColor: "transparent",
                                    }}
                                    aria-expanded={mobileShopOpen}
                                    aria-controls={`shop-accordion-${uid}`}
                                >
                                    <span>Shop</span>
                                    <span style={{ fontSize: 20, lineHeight: "1em", opacity: 0.7, fontWeight: 300 }}>
                                        {mobileShopOpen ? "−" : "+"}
                                    </span>
                                </button>

                                <AnimatePresence initial={false}>
                                    {mobileShopOpen && (
                                        <motion.div
                                            id={`shop-accordion-${uid}`}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div style={{ paddingLeft: 12, paddingBottom: 12, paddingTop: 4 }}>
                                                {categories.map((c) => (
                                                    <div key={c.label} style={{ padding: "2px 0" }}>
                                                        <a
                                                            href={c.href}
                                                            style={{
                                                                display: "block",
                                                                padding: "12px 8px",
                                                                fontSize: 16,
                                                                fontWeight: 400,
                                                                color: "#1A1A1A",
                                                                textDecoration: "none",
                                                                borderRadius: 6,
                                                                minHeight: 44,
                                                                WebkitTapHighlightColor: "transparent",
                                                            }}
                                                            className="hoverUnderline"
                                                            onClick={onCloseMobileMenu}
                                                        >
                                                            {c.label}
                                                        </a>
                                                        {c.subItems && (
                                                            <div style={{ paddingLeft: 16, marginTop: 4 }}>
                                                                {c.subItems.map((s) => (
                                                                    <a
                                                                        key={s.label}
                                                                        href={s.href}
                                                                        style={{
                                                                            display: "block",
                                                                            padding: "10px 8px",
                                                                            fontSize: 15,
                                                                            fontWeight: 400,
                                                                            color: "#555555",
                                                                            textDecoration: "none",
                                                                            borderRadius: 6,
                                                                            minHeight: 40,
                                                                            WebkitTapHighlightColor: "transparent",
                                                                        }}
                                                                        className="hoverUnderline"
                                                                        onClick={onCloseMobileMenu}
                                                                    >
                                                                        {s.label}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* About / Stories */}
                                {showAboutLink && (
                                    <a
                                        href={aboutHref}
                                        style={{
                                            display: "block",
                                            padding: "16px 12px",
                                            fontSize: 18,
                                            fontWeight: 400,
                                            color: "#1A1A1A",
                                            textDecoration: "none",
                                            borderRadius: 8,
                                            minHeight: 48,
                                            WebkitTapHighlightColor: "transparent",
                                        }}
                                        className="hoverUnderline"
                                        onClick={onCloseMobileMenu}
                                    >
                                        About
                                    </a>
                                )}
                                {showStoriesLink && (
                                    <a
                                        href={storiesHref}
                                        style={{
                                            display: "block",
                                            padding: "16px 12px",
                                            fontSize: 18,
                                            fontWeight: 400,
                                            color: "#1A1A1A",
                                            textDecoration: "none",
                                            borderRadius: 8,
                                            minHeight: 48,
                                            WebkitTapHighlightColor: "transparent",
                                        }}
                                        className="hoverUnderline"
                                        onClick={onCloseMobileMenu}
                                    >
                                        Stories
                                    </a>
                                )}
                            </div>

                            <div
                                style={{
                                    height: 1,
                                    background: navBorderColor,
                                    marginTop: 20,
                                    marginBottom: 20,
                                }}
                            />

                            <div style={{ marginTop: "auto", paddingTop: 20 }}>
                                {showMobileRegion && (
                                    <>
                                        {mobileRegionLink ? (
                                            <a
                                                href={mobileRegionLink}
                                                style={{
                                                    display: "flex",
                                                    padding: "14px 12px",
                                                    fontSize: 14,
                                                    fontWeight: 400,
                                                    color: "#1A1A1A",
                                                    letterSpacing: "0.01em",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    borderRadius: 6,
                                                    textDecoration: "none",
                                                    minHeight: 48,
                                                    WebkitTapHighlightColor: "transparent",
                                                }}
                                                className="hoverUnderline"
                                                onClick={onCloseMobileMenu}
                                            >
                                                <span style={{ opacity: 0.7 }}>{mobileRegionLabel}</span>
                                                <span style={{ opacity: 0.7 }}>{mobileCurrencyLabel}</span>
                                            </a>
                                        ) : (
                                            <div
                                                style={{
                                                    padding: "14px 12px",
                                                    fontSize: 14,
                                                    fontWeight: 400,
                                                    color: "#1A1A1A",
                                                    letterSpacing: "0.01em",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    borderRadius: 6,
                                                }}
                                            >
                                                <span style={{ opacity: 0.7 }}>{mobileRegionLabel}</span>
                                                <span style={{ opacity: 0.7 }}>{mobileCurrencyLabel}</span>
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                height: 1,
                                                background: navBorderColor,
                                                marginTop: 8,
                                                marginBottom: 8,
                                            }}
                                        />
                                    </>
                                )}

                                {showMobileAccount && (
                                    <a
                                        href={mobileAccountLink}
                                        style={{
                                            display: "block",
                                            padding: "16px 12px",
                                            fontSize: 16,
                                            fontWeight: 400,
                                            color: "#1A1A1A",
                                            textDecoration: "none",
                                            borderRadius: 8,
                                            minHeight: 48,
                                            WebkitTapHighlightColor: "transparent",
                                        }}
                                        className="hoverUnderline"
                                        onClick={onCloseMobileMenu}
                                    >
                                        {mobileAccountLabel}
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart drawer */}
            <AnimatePresence>
                {cartOpen && !isThumbnail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.0)",
                            zIndex: 1100,
                        }}
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) onCloseCart()
                        }}
                    >
                        <motion.aside
                            ref={cartPanelRef as any}
                            role="dialog"
                            aria-label="Cart"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                bottom: 0,
                                width: "100%",
                                maxWidth: isMobile ? "100%" : 420,
                                background: navBackground,
                                borderLeft: `1px solid ${navBorderColor}`,
                                display: "flex",
                                flexDirection: "column",
                                padding: isMobile ? 20 : 16,
                                overflow: "auto",
                                WebkitOverflowScrolling: "touch",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        color: "#888888",
                                        padding: "8px 0",
                                    }}
                                >
                                    {cartDrawerTitle}
                                </div>
                                <IconButton className="iconHover" ariaLabel="Close cart" onClick={onCloseCart}>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M6 6l12 12M18 6L6 18"
                                            stroke="#1A1A1A"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </IconButton>
                            </div>

                            <div
                                style={{
                                    height: 1,
                                    background: navBorderColor,
                                    marginTop: 16,
                                    marginBottom: 16,
                                }}
                            />

                            <div style={{ fontSize: isMobile ? 15 : 14, color: "#1A1A1A", lineHeight: "1.4em" }}>
                                <div style={{ opacity: 0.8 }}>
                                    {cartCount > 0 ? `Your cart has ${cartCount} item${cartCount !== 1 ? 's' : ''}.` : cartDrawerEmptyMessage}
                                </div>
                                <div style={{ marginTop: 10, fontSize: isMobile ? 14 : 13, color: "#555555" }}>
                                    {cartDrawerDescription}
                                </div>
                            </div>

                            <div style={{ marginTop: "auto", paddingTop: 20 }}>
                                <a
                                    href={cartLink}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        textAlign: "center",
                                        padding: isMobile ? "14px 16px" : "12px 14px",
                                        borderRadius: 8,
                                        background: cartButtonBackground,
                                        color: cartButtonTextColor,
                                        textDecoration: "none",
                                        fontSize: isMobile ? 15 : 14,
                                        fontWeight: 500,
                                        letterSpacing: "-0.01em",
                                        minHeight: 48,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        WebkitTapHighlightColor: "transparent",
                                    }}
                                    onClick={onCloseCart}
                                >
                                    {cartButtonLabel}
                                </a>
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(KalstoreNavbar, {
    showLogo: {
        type: ControlType.Boolean,
        title: "Show Logo",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "Kalstore®",
        hidden: ({ showLogo, showLogoText }) => !showLogo || !showLogoText,
    },
    showLogoText: {
        type: ControlType.Boolean,
        title: "Show Logo Text",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showLogo }) => !showLogo,
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: ({ showLogo }) => !showLogo,
    },
    categories: {
        type: ControlType.Array,
        title: "Shop Categories",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Category Name",
                    defaultValue: "Category",
                },
                href: {
                    type: ControlType.String,
                    title: "Category Link",
                    defaultValue: "/collections/category",
                },
                subItems: {
                    type: ControlType.Array,
                    title: "Subcategories",
                    control: {
                        type: ControlType.Object,
                        controls: {
                            label: {
                                type: ControlType.String,
                                title: "Name",
                                defaultValue: "Subcategory",
                            },
                            href: {
                                type: ControlType.String,
                                title: "Link",
                                defaultValue: "/collections/subcategory",
                            },
                        },
                    },
                    maxCount: 10,
                    defaultValue: [],
                },
            },
        },
        maxCount: 20,
        defaultValue: [
            {
                label: "Calendars",
                href: "/collections/calendars",
                subItems: [
                    { label: "Wall", href: "/collections/calendars?type=wall" },
                    { label: "Personal", href: "/collections/calendars?type=personal" },
                    { label: "Desk", href: "/collections/calendars?type=desk" },
                ],
            },
            { label: "Notebooks", href: "/collections/notebooks", subItems: [] },
            { label: "Refills & Accessories", href: "/collections/refills-accessories", subItems: [] },
            { label: "Bundles", href: "/collections/bundles", subItems: [] },
            { label: "All products", href: "/collections/all", subItems: [] },
        ],
    },
    showAboutLink: {
        type: ControlType.Boolean,
        title: "Show About",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    aboutHref: {
        type: ControlType.String,
        title: "About Link",
        defaultValue: "/pages/about",
        hidden: ({ showAboutLink }) => !showAboutLink,
    },
    showStoriesLink: {
        type: ControlType.Boolean,
        title: "Show Stories",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    storiesHref: {
        type: ControlType.String,
        title: "Stories Link",
        defaultValue: "/blogs/stories",
        hidden: ({ showStoriesLink }) => !showStoriesLink,
    },
    showDropdownImage: {
        type: ControlType.Boolean,
        title: "Show Dropdown Image",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dropdownImage: {
        type: ControlType.ResponsiveImage,
        title: "Dropdown Image",
        hidden: ({ showDropdownImage }) => !showDropdownImage,
    },
    dropdownImageTitle: {
        type: ControlType.String,
        title: "Image Title",
        defaultValue: "Featured Collection",
        hidden: ({ showDropdownImage }) => !showDropdownImage,
    },
    dropdownImageLink: {
        type: ControlType.String,
        title: "Image Link",
        defaultValue: "/collections/featured",
        hidden: ({ showDropdownImage }) => !showDropdownImage,
    },
    dropdownImageWidth: {
        type: ControlType.Number,
        title: "Image Width",
        defaultValue: 100,
        min: 20,
        max: 100,
        step: 5,
        unit: "%",
        hidden: ({ showDropdownImage, dropdownColumns }) => !showDropdownImage || dropdownColumns < 2,
    },
    dropdownImageAspectRatio: {
        type: ControlType.Enum,
        title: "Image Ratio",
        defaultValue: "3/4",
        options: ["1/1", "3/4", "4/3", "16/9", "9/16", "2/3", "3/2"],
        optionTitles: ["Square", "Portrait 3:4", "Landscape 4:3", "Wide 16:9", "Tall 9:16", "Portrait 2:3", "Landscape 3:2"],
        hidden: ({ showDropdownImage, dropdownColumns }) => !showDropdownImage || dropdownColumns < 2,
    },
    showAccountIcon: {
        type: ControlType.Boolean,
        title: "Show Account Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    accountIconLabel: {
        type: ControlType.String,
        title: "Account Label",
        defaultValue: "Account",
        hidden: ({ showAccountIcon }) => !showAccountIcon,
    },
    accountLink: {
        type: ControlType.String,
        title: "Account Link",
        defaultValue: "/account/login",
        hidden: ({ showAccountIcon }) => !showAccountIcon,
    },
    showCartIcon: {
        type: ControlType.Boolean,
        title: "Show Cart Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    cartIconLabel: {
        type: ControlType.String,
        title: "Cart Icon Label",
        defaultValue: "Open cart",
        hidden: ({ showCartIcon }) => !showCartIcon,
    },
    showCartBadge: {
        type: ControlType.Boolean,
        title: "Show Cart Badge",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showCartIcon }) => !showCartIcon,
    },
    cartCount: {
        type: ControlType.Number,
        title: "Cart Count",
        defaultValue: 0,
        min: 0,
        max: 99,
        step: 1,
        hidden: ({ showCartIcon }) => !showCartIcon,
    },
    cartDrawerTitle: {
        type: ControlType.String,
        title: "Cart Drawer Title",
        defaultValue: "Cart",
        hidden: ({ showCartIcon }) => !showCartIcon,
    },
    cartDrawerEmptyMessage: {
        type: ControlType.String,
        title: "Empty Cart Message",
        defaultValue: "Your cart is empty.",
        hidden: ({ showCartIcon }) => !showCartIcon,
    },
    cartDrawerDescription: {
        type: ControlType.String,
        title: "Cart Description",
        defaultValue: "This is a visual drawer replica. Connect it to your ecommerce/cart logic via Framer overrides or CMS.",
        displayTextArea: true,
        hidden: ({ showCartIcon }) => !showCartIcon,
    },
    cartButtonLabel: {
        type: ControlType.String,
        title: "Cart Button Label",
        defaultValue: "Go to cart",
        hidden: ({ showCartIcon }) => !showCartIcon,
    },
    cartLink: {
        type: ControlType.String,
        title: "Cart Page Link",
        defaultValue: "/cart",
        hidden: ({ showCartIcon }) => !showCartIcon,
    },
    cartButtonBackground: {
        type: ControlType.Color,
        title: "Cart Button BG",
        defaultValue: "#1A1A1A",
        hidden: ({ showCartIcon }) => !showCartIcon,
    },
    cartButtonTextColor: {
        type: ControlType.Color,
        title: "Cart Button Text",
        defaultValue: "#FFFFFF",
        hidden: ({ showCartIcon }) => !showCartIcon,
    },
    showMobileRegion: {
        type: ControlType.Boolean,
        title: "Show Mobile Region",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    mobileRegionLabel: {
        type: ControlType.String,
        title: "Region Label",
        defaultValue: "Poland",
        hidden: ({ showMobileRegion }) => !showMobileRegion,
    },
    mobileCurrencyLabel: {
        type: ControlType.String,
        title: "Currency Label",
        defaultValue: "PLN",
        hidden: ({ showMobileRegion }) => !showMobileRegion,
    },
    mobileRegionLink: {
        type: ControlType.String,
        title: "Region Link",
        defaultValue: "",
        placeholder: "Optional link URL",
        hidden: ({ showMobileRegion }) => !showMobileRegion,
    },
    showMobileAccount: {
        type: ControlType.Boolean,
        title: "Show Mobile Account",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    mobileAccountLabel: {
        type: ControlType.String,
        title: "Mobile Account Label",
        defaultValue: "Account",
        hidden: ({ showMobileAccount }) => !showMobileAccount,
    },
    mobileAccountLink: {
        type: ControlType.String,
        title: "Mobile Account Link",
        defaultValue: "/account/login",
        hidden: ({ showMobileAccount }) => !showMobileAccount,
    },
    navBackground: {
        type: ControlType.Color,
        title: "Nav Background",
        defaultValue: "#FAFAF8",
    },
    navBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#E8E6E0",
    },
    navHeight: {
        type: ControlType.Number,
        title: "Nav Height",
        defaultValue: 56,
        min: 40,
        max: 88,
        step: 1,
        unit: "px",
    },
    linkColor: {
        type: ControlType.Color,
        title: "Link Color",
        defaultValue: "#1A1A1A",
    },
    linkFontSize: {
        type: ControlType.Number,
        title: "Link Size",
        defaultValue: 13,
        min: 10,
        max: 18,
        step: 1,
        unit: "px",
    },
    dropdownColumns: {
        type: ControlType.Number,
        title: "Dropdown Cols",
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 1,
    },
    mobileMenuSide: {
        type: ControlType.Enum,
        title: "Mobile Side",
        defaultValue: "left",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
    },
    stickyBorderOnScroll: {
        type: ControlType.Boolean,
        title: "Border on Scroll",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
