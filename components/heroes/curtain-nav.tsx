import * as React from "react"
import { createPortal, flushSync } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type FramerLinkValue = NonNullable<
    React.ComponentProps<typeof FramerLink>["href"]
>

type ResponsiveImageValue =
    | string
    | {
          src?: string
          srcSet?: string
          alt?: string
      }

type MenuLink = {
    label: string
    url: FramerLinkValue
}

type OverlayGeometry = {
    left: number
    top: number
    width: number
    height: number
}

const EMPTY_OVERLAY_GEOMETRY: OverlayGeometry = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
}

const FOCUSABLE_SELECTOR = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
].join(",")

type LinkSection = {
    label: string
    fontSize: number
    links: MenuLink[]
}

type BrandingSettings = {
    image: ResponsiveImageValue
    alt: string
    link: FramerLinkValue
    size: number
}

type MenuSettings = {
    buttonText: string
    accessibleName: string
}

type Props = {
    branding?: Partial<BrandingSettings>
    menu?: Partial<MenuSettings>
    primary?: Partial<LinkSection>
    secondary?: Partial<LinkSection>
    social?: Partial<LinkSection>
    legal?: Partial<LinkSection>
    style?: React.CSSProperties
    navTransition?: boolean
    forceFramerRouter?: boolean
    navBackground: string
    accent1: string
    accent2: string
    accent3: string
    accent4: string
    panelBackground: string
    textColor: string
    mutedColor: string
    hoverColor: string
    navBlur: number
    navMaxWidth: number

    // Preserve saved values from earlier instances until a grouped control is set.
    logo?: ResponsiveImageValue
    logoAlt?: string
    logoLink?: FramerLinkValue
    logoSize?: number
    toggleLabel?: string
    menuLabel?: string
    primaryLabel?: string
    primaryFontSize?: number
    primaryLinks?: MenuLink[]
    secondaryLabel?: string
    secondaryFontSize?: number
    secondaryLinks?: MenuLink[]
    socialLabel?: string
    socialFontSize?: number
    socialLinks?: MenuLink[]
    legalLabel?: string
    legalFontSize?: number
    legalLinks?: MenuLink[]
}

const COMPONENT_SCOPE = "fom-component"
const DEFAULT_NAV_HEIGHT = 80
const NAV_PADDING = 24
const MENU_PADDING = 64
const MENU_EXIT_MS = 1250

// Keep this component on both pages. A same-origin document navigation can then
// retain snapshots of these layers while the destination renders beneath them.
// Other browsers close the current menu before following the link.
const PAGE_REVEAL_CSS = `
    @view-transition { navigation: auto; }

    /* Swap page content immediately; only the named menu layers animate. */
    ::view-transition-group(root) { animation: none; z-index: 0; }
    ::view-transition-old(root) { animation: none; opacity: 0; }
    ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }

    ::view-transition-group(fom-accent-1),
    ::view-transition-group(fom-accent-2),
    ::view-transition-group(fom-accent-3),
    ::view-transition-group(fom-accent-4),
    ::view-transition-group(fom-menu-panel) {
        animation: none;
        overflow: hidden;
    }
    ::view-transition-group(fom-accent-1) { z-index: 1; }
    ::view-transition-group(fom-accent-2) { z-index: 2; }
    ::view-transition-group(fom-accent-3) { z-index: 3; }
    ::view-transition-group(fom-accent-4) { z-index: 4; }
    ::view-transition-group(fom-menu-panel) { z-index: 5; }

    ::view-transition-old(fom-accent-1),
    ::view-transition-old(fom-accent-2),
    ::view-transition-old(fom-accent-3),
    ::view-transition-old(fom-accent-4) {
        height: 100%;
        mix-blend-mode: normal;
        transform-origin: top center;
        animation: fom-page-layer-up 760ms cubic-bezier(0.65, 0, 0.35, 1) both;
    }
    ::view-transition-old(fom-accent-1) { animation-delay: 440ms; }
    ::view-transition-old(fom-accent-2) { animation-delay: 340ms; }
    ::view-transition-old(fom-accent-3) { animation-delay: 240ms; }
    ::view-transition-old(fom-accent-4) { animation-delay: 140ms; }
    ::view-transition-old(fom-menu-panel) {
        height: 100%;
        mix-blend-mode: normal;
        animation: fom-page-panel-up 820ms cubic-bezier(0.65, 0, 0.35, 1) both;
    }
    @keyframes fom-page-layer-up {
        from { transform: scaleY(1); }
        to { transform: scaleY(0.0001); }
    }
    @keyframes fom-page-panel-up {
        from { transform: translateY(0); }
        to { transform: translateY(-100%); }
    }
    @media (prefers-reduced-motion: reduce) {
        @view-transition { navigation: none; }
        ::view-transition-old(fom-accent-1),
        ::view-transition-old(fom-accent-2),
        ::view-transition-old(fom-accent-3),
        ::view-transition-old(fom-accent-4),
        ::view-transition-old(fom-menu-panel) {
            animation: none !important;
            opacity: 0;
        }
    }
`

// Reuse the same stylesheet across state updates and component instances.
const COMPONENT_CSS = `
                .fom-component,
                .fom-component * {
                    box-sizing: border-box;
                    font-family: inherit;
                }

                .fom-component {
                    -webkit-text-size-adjust: 100%;
                }

                .fom-component .fom-boundary {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-width: 0;
                    min-height: 44px;
                    overflow: hidden;
                    isolation: isolate;
                    contain: paint;
                    container-name: fom;
                    container-type: inline-size;
                }

                .fom-component .fom-topbar {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 44px;
                    z-index: 50;
                }

                .fom-component .fom-topbar-inner {
                    width: 100%;
                    max-width: var(--fom-nav-max-width);
                    min-width: 44px;
                    min-height: 44px;
                    height: 100%;
                    margin: 0 auto;
                    padding-right: var(--fom-nav-padding-x);
                    padding-left: var(--fom-nav-padding-x);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .fom-component .fom-logo-link {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                    min-width: 44px;
                    min-height: 44px;
                    height: 100%;
                    padding-block: 4px;
                    color: var(--fom-text-color);
                    text-decoration: none;
                    border-radius: 6px;
                    -webkit-tap-highlight-color: transparent;
                }

                .fom-component .fom-logo-visual {
                    width: var(--fom-logo-size);
                    height: var(--fom-logo-size);
                    max-width: 100%;
                    max-height: 100%;
                    flex: 0 0 auto;
                    user-select: none;
                    -webkit-user-select: none;
                }

                .fom-component .fom-toggler {
                    width: auto;
                    min-width: 48px;
                    height: 48px;
                    padding: 0 4px 0 12px;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    -webkit-appearance: none;
                    appearance: none;
                    border: 0;
                    border-radius: 6px;
                    background: transparent;
                    color: var(--fom-text-color);
                    font: inherit;
                    cursor: pointer;
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                }

                .fom-component .fom-toggler-label {
                    display: block;
                    color: currentColor;
                    font-size: 15px;
                    font-weight: 500;
                    line-height: 1;
                    letter-spacing: 0.01em;
                    white-space: nowrap;
                }

                .fom-component .fom-toggler-icon {
                    width: 40px;
                    height: 18px;
                    display: flex;
                    flex: 0 0 auto;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                }

                .fom-component .fom-toggler-bar {
                    width: 100%;
                    height: 2px;
                    display: block;
                    flex: 0 0 auto;
                    background: currentColor;
                    transform-origin: center;
                    transition: transform 320ms ease;
                }

                .fom-component.fom-nav-open .fom-toggler-bar:first-child {
                    transform: translateY(3.5px) rotate(45deg) scaleX(0.75);
                }

                .fom-component.fom-nav-open .fom-toggler-bar:nth-child(2) {
                    transform: translateY(-3.5px) rotate(-45deg) scaleX(0.75);
                }

                .fom-component .fom-content {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    z-index: 30;
                    isolation: isolate;
                    visibility: hidden;
                    pointer-events: none;
                    transition: visibility 0s linear 1250ms;
                }

                /* Retain the settled closed surfaces between clicks. Their
                   transforms keep them outside the clipped area; the closed
                   menu stays inert and does not run any animation. */
                .fom-component.fom-ready .fom-content,
                .fom-component.fom-open .fom-content {
                    visibility: visible;
                    transition-delay: 0s;
                }

                .fom-component.fom-open .fom-content {
                    pointer-events: auto;
                }

                .fom-component .fom-background {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 0;
                    /* Each solid layer slides down from above the clipped menu
                       area. Its bottom edge travels exactly like the old scaleY
                       growth, but a translate is never singular, stays on the
                       compositor and avoids Safari's scale/height glitches. */
                    transform: translateY(-100%);
                    transition: transform 760ms cubic-bezier(0.65, 0, 0.35, 1);
                    pointer-events: none;
                    will-change: transform;
                }

                .fom-component .fom-background-1 {
                    z-index: 1;
                    transition-delay: 440ms;
                }

                .fom-component .fom-background-2 {
                    z-index: 2;
                    transition-delay: 340ms;
                }

                .fom-component .fom-background-3 {
                    z-index: 3;
                    transition-delay: 240ms;
                }

                .fom-component .fom-background-4 {
                    z-index: 4;
                    transition-delay: 140ms;
                }

                .fom-component.fom-open .fom-background {
                    transform: translateY(0);
                }

                .fom-component.fom-open .fom-background-1 {
                    transition-delay: 0ms;
                }

                .fom-component.fom-open .fom-background-2 {
                    transition-delay: 90ms;
                }

                .fom-component.fom-open .fom-background-3 {
                    transition-delay: 180ms;
                }

                .fom-component.fom-open .fom-background-4 {
                    transition-delay: 270ms;
                }

                .fom-component .fom-panel-reveal {
                    position: absolute;
                    inset: 0;
                    z-index: 5;
                    width: 100%;
                    height: 100%;
                    border-radius: 0;
                    min-width: 0;
                    min-height: 0;
                    overflow: hidden;
                    isolation: isolate;
                    background: var(--fom-panel-color);
                    transform: translateY(-100%);
                    transition: transform 820ms cubic-bezier(0.65, 0, 0.35, 1);
                    transition-delay: 0ms;
                    /* Safari: keep the nested opposite translations in sync. */
                    will-change: transform;
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                }

                .fom-component .fom-panel {
                    width: 100%;
                    /* Opposite translations keep links stationary during the reveal. */
                    height: 100%;
                    min-width: 0;
                    min-height: 0;
                    overflow-x: hidden;
                    overflow-y: auto;
                    overscroll-behavior-y: none;
                    touch-action: pan-y;
                    scrollbar-gutter: stable;
                    background: var(--fom-panel-color);
                    transform: translateY(100%);
                    transition: transform 820ms cubic-bezier(0.65, 0, 0.35, 1);
                    transition-delay: 0ms;
                    will-change: transform;
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                }

                .fom-component.fom-open .fom-panel-reveal,
                .fom-component.fom-open .fom-panel {
                    transform: translateY(0);
                    transition-delay: 420ms;
                }

                .fom-component .fom-menu {
                    width: 100%;
                    min-height: 100%;
                    margin: 0 auto;
                    padding-top: clamp(1.5rem, 4cqw, 3.5rem);
                    padding-right: var(--fom-menu-padding);
                    padding-bottom: var(--fom-menu-padding);
                    padding-left: var(--fom-menu-padding);
                }

                .fom-component .fom-layout {
                    display: grid;
                    grid-template-columns:
                        minmax(0, 1.8fr)
                        minmax(0, 1fr)
                        minmax(0, 0.9fr);
                    grid-template-areas: "primary secondary utilities";
                    column-gap: clamp(1.75rem, 5cqw, 5rem);
                    row-gap: clamp(1.5rem, 4cqw, 3rem);
                    align-items: start;
                }

                .fom-component .fom-primary {
                    grid-area: primary;
                }

                .fom-component .fom-secondary {
                    grid-area: secondary;
                }

                .fom-component .fom-social {
                    grid-column: utilities;
                    grid-row: 1;
                }

                .fom-component .fom-legal {
                    grid-column: utilities;
                    grid-row: 2;
                }

                .fom-component .fom-group {
                    min-width: 0;
                    opacity: 0;
                    transform: translateY(16px);
                    transition:
                        opacity 260ms ease,
                        transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
                }

                .fom-component.fom-open .fom-group {
                    opacity: 1;
                    transform: translateY(0);
                    transition-delay: 720ms;
                }

                .fom-component.fom-open .fom-secondary {
                    transition-delay: 780ms;
                }

                .fom-component.fom-open .fom-social {
                    transition-delay: 840ms;
                }

                .fom-component.fom-open .fom-legal {
                    transition-delay: 900ms;
                }

                /* An interrupted close already has a visible panel. Do not
                   restart the full link delay when reversing it back open. */
                .fom-component.fom-open.fom-resuming .fom-group {
                    transition-delay: 0ms;
                }

                .fom-component .fom-group-title {
                    margin: 0 0 0.65rem;
                    color: var(--fom-muted-color);
                    font-size: 0.75rem;
                    font-weight: 600;
                    line-height: 1.2;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    overflow-wrap: anywhere;
                }

                .fom-component .fom-list {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.1rem;
                    list-style: none;
                }

                .fom-component .fom-link {
                    width: fit-content;
                    max-width: 100%;
                    min-height: 24px;
                    padding: 0.18em 0;
                    display: flex;
                    align-items: center;
                    color: var(--fom-muted-color);
                    font-size: var(--fom-link-size);
                    line-height: 1.15;
                    text-decoration: none;
                    overflow-wrap: anywhere;
                    border-radius: 3px;
                    transition: color 180ms ease;
                    -webkit-tap-highlight-color: transparent;
                }

                .fom-component .fom-link > span {
                    display: block;
                }

                .fom-component .fom-link:focus-visible {
                    color: var(--fom-hover-color);
                }

                /* Safari/iOS keeps :hover "stuck" after a tap, so only apply
                   it on devices that can really hover. */
                @media (hover: hover) {
                    .fom-component .fom-link:hover {
                        color: var(--fom-hover-color);
                    }
                }

                .fom-component .fom-link:focus-visible,
                .fom-component .fom-toggler:focus-visible,
                .fom-component .fom-logo-link:focus-visible {
                    outline: 2px solid var(--fom-hover-color);
                    outline-offset: 4px;
                }

                /* Keep touch targets generous without inflating desktop utility links. */
                @media (pointer: coarse) {
                    .fom-component .fom-link {
                        min-height: 44px;
                    }
                }

                .fom-component.fom-static .fom-content,
                .fom-component.fom-static .fom-background,
                .fom-component.fom-static .fom-panel-reveal,
                .fom-component.fom-static .fom-panel,
                .fom-component.fom-static .fom-group,
                .fom-component.fom-static .fom-toggler-bar {
                    transition: none !important;
                }

                @container fom (max-width: 1000px) {
                    .fom-component .fom-logo-visual {
                        width: min(var(--fom-logo-size), 36px);
                        height: min(var(--fom-logo-size), 36px);
                    }

                    .fom-component .fom-toggler-icon {
                        width: 34px;
                    }

                    .fom-component .fom-menu {
                        padding-top: clamp(1rem, 4cqw, 2rem);
                        padding-right: clamp(1rem, 4cqw, 2rem);
                        padding-bottom: 1.5rem;
                        padding-left: clamp(1rem, 4cqw, 2rem);
                    }

                    .fom-component .fom-layout {
                        min-height: 0;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        grid-template-rows: auto;
                        grid-template-areas:
                            "primary primary"
                            "secondary secondary"
                            "social legal";
                        gap: clamp(1.25rem, 4cqw, 2.5rem);
                        align-content: start;
                    }

                    .fom-component .fom-secondary,
                    .fom-component .fom-social,
                    .fom-component .fom-legal {
                        align-self: start;
                        padding-top: 1rem;
                        border-top: 1px solid var(--fom-muted-color);
                    }

                    .fom-component .fom-social {
                        grid-area: social;
                    }

                    .fom-component .fom-legal {
                        grid-area: legal;
                    }

                    .fom-component .fom-secondary .fom-list {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        column-gap: 1.25rem;
                    }

                    .fom-component .fom-link {
                        width: 100%;
                    }

                    .fom-component .fom-primary .fom-link {
                        font-size: min(
                            var(--fom-link-size),
                            clamp(1.75rem, 6cqw, 3rem)
                        );
                    }

                    .fom-component .fom-secondary .fom-link {
                        font-size: min(
                            var(--fom-link-size),
                            clamp(1.05rem, 3.8cqw, 1.375rem)
                        );
                    }

                    .fom-component .fom-social .fom-link {
                        font-size: min(
                            var(--fom-link-size),
                            clamp(0.9375rem, 3.5cqw, 1.25rem)
                        );
                    }

                    .fom-component .fom-legal .fom-link {
                        font-size: min(
                            var(--fom-link-size),
                            clamp(0.875rem, 3cqw, 1rem)
                        );
                    }
                }

                @container fom (max-width: 600px) {
                    .fom-component .fom-logo-visual {
                        width: min(var(--fom-logo-size), 32px);
                        height: min(var(--fom-logo-size), 32px);
                    }

                    .fom-component .fom-toggler {
                        width: 48px;
                        padding-right: 0;
                        padding-left: 0;
                        gap: 0;
                    }

                    .fom-component .fom-toggler-label {
                        display: none;
                    }

                    .fom-component .fom-toggler-icon {
                        width: 28px;
                    }

                    .fom-component .fom-layout {
                        grid-template-columns: minmax(0, 1fr);
                        grid-template-areas:
                            "primary"
                            "secondary"
                            "social"
                            "legal";
                    }

                    .fom-component .fom-secondary .fom-list {
                        grid-template-columns: minmax(0, 1fr);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .fom-component .fom-content,
                    .fom-component .fom-background,
                    .fom-component .fom-panel-reveal,
                    .fom-component .fom-panel,
                    .fom-component .fom-group,
                    .fom-component .fom-toggler-bar,
                    .fom-component .fom-link {
                        transition: none !important;
                    }
                }
            `

function resolveOverlayStyles(host: HTMLElement) {
    const ownerWindow = host.ownerDocument.defaultView
    if (!ownerWindow) return
    const rect = host.getBoundingClientRect()
    host.querySelectorAll<HTMLElement>(
        ".fom-background, .fom-panel-reveal, .fom-panel, .fom-group"
    ).forEach((layer) => {
        void ownerWindow.getComputedStyle(layer).transform
    })
    return rect
}

function supportsPageReveal(ownerWindow: Window) {
    const browser = ownerWindow as Window & {
        CSS?: { supports: (property: string, value: string) => boolean }
    }
    return (
        browser.top === browser &&
        "onpageswap" in browser &&
        "onpagereveal" in browser &&
        Boolean(browser.CSS?.supports("view-transition-name", "fom-menu-panel"))
    )
}

// Published framer.app sites are live sites, not editor previews.
function isFramerEditorHost(ownerWindow: Window) {
    try {
        if (ownerWindow.top !== ownerWindow) return true
        return /(^|\.)(framer\.com|framercanvas\.com)$/i.test(
            ownerWindow.location.hostname
        )
    } catch {
        return true
    }
}

// Framer Preview routes client-side: the menu instance on the old page unmounts
// (and its body portal disappears) the moment the new page renders. To keep the
// "menu retracts and reveals the new page" effect, hand the open menu over to a
// detached copy that lives outside React, then play its normal close animation
// once the route has changed.
function launchExitOverlay(host: HTMLElement) {
    const ownerDocument = host.ownerDocument
    const ownerWindow = ownerDocument.defaultView
    const body = ownerDocument.body
    if (!ownerWindow || !body) return

    const ghost = host.cloneNode(true) as HTMLElement
    ghost.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"))
    ghost
        .querySelectorAll("[aria-labelledby]")
        .forEach((node) => node.removeAttribute("aria-labelledby"))
    ghost.classList.remove("fom-resuming")
    ghost.setAttribute("aria-hidden", "true")
    ghost.setAttribute("inert", "")
    ghost.style.pointerEvents = "none"

    // The original stylesheet unmounts with the component, so carry our own.
    const style = ownerDocument.createElement("style")
    style.textContent = COMPONENT_CSS
    ghost.appendChild(style)
    body.appendChild(ghost)

    // Commit the open state before removing the class so the close transitions run.
    void ghost.getBoundingClientRect()
    const panel = ghost.querySelector<HTMLElement>(".fom-panel")
    if (panel) void ownerWindow.getComputedStyle(panel).transform

    const startHref = ownerWindow.location.href
    const startedAt = Date.now()
    let closing = false

    const startClose = () => {
        if (closing) return
        closing = true
        ownerWindow.requestAnimationFrame(() => {
            ownerWindow.requestAnimationFrame(() => {
                ghost.classList.remove("fom-open")
                ownerWindow.setTimeout(() => {
                    ghost.remove()
                }, MENU_EXIT_MS + 150)
            })
        })
    }

    // Wait for the router to change the URL (capped), then let the new page paint.
    const waitForRoute = () => {
        if (
            ownerWindow.location.href !== startHref ||
            Date.now() - startedAt > 600
        ) {
            startClose()
            return
        }
        ownerWindow.requestAnimationFrame(waitForRoute)
    }
    ownerWindow.requestAnimationFrame(waitForRoute)

    // Safety net: never leave a stuck overlay on screen.
    ownerWindow.setTimeout(() => {
        ghost.remove()
    }, 8000)
}

function preparePageReveal(host: HTMLElement) {
    const layers = [
        [".fom-background-1", "fom-accent-1", "transform", "translateY(0)"],
        [".fom-background-2", "fom-accent-2", "transform", "translateY(0)"],
        [".fom-background-3", "fom-accent-3", "transform", "translateY(0)"],
        [".fom-background-4", "fom-accent-4", "transform", "translateY(0)"],
        [".fom-panel-reveal", "fom-menu-panel", "transform", "translateY(0)"],
        [".fom-panel", "", "transform", "translateY(0)"],
    ]
    const restore: Array<() => void> = []
    for (const [selector, name, property, value] of layers) {
        const element = host.querySelector<HTMLElement>(selector)
        if (!element) continue
        const previousName = element.style.getPropertyValue(
            "view-transition-name"
        )
        const previousTransition = element.style.transition
        const previousValue = element.style.getPropertyValue(property)
        // Name only the clicked instance, avoiding duplicate snapshot names.
        if (name) element.style.setProperty("view-transition-name", name)
        element.style.transition = "none"
        element.style.setProperty(property, value)
        restore.push(() => {
            if (previousName) {
                element.style.setProperty("view-transition-name", previousName)
            } else {
                element.style.removeProperty("view-transition-name")
            }
            element.style.transition = previousTransition
            element.style.setProperty(property, previousValue)
        })
    }
    return () => restore.forEach((reset) => reset())
}

const defaultPrimaryLinks: MenuLink[] = [
    { label: "Home", url: "#home" },
    { label: "Experiments", url: "#experiments" },
    { label: "Latest Updates", url: "#updates" },
    { label: "Documentation", url: "#docs" },
    { label: "Community", url: "#community" },
]

const defaultSecondaryLinks: MenuLink[] = [
    { label: "Playground", url: "#playground" },
    { label: "Build something", url: "#build" },
    { label: "Activity Feed", url: "#activity" },
    { label: "Profile", url: "#profile" },
]

const defaultSocialLinks: MenuLink[] = [
    { label: "Instagram", url: "#" },
    { label: "LinkedIn", url: "#" },
]

const defaultLegalLinks: MenuLink[] = [
    { label: "Cookie Policy", url: "#" },
    { label: "Accessibility", url: "#" },
    { label: "Data Rights", url: "#" },
    { label: "Disclosure", url: "#" },
]

function finiteNumber(
    value: number,
    fallback: number,
    minimum = 0,
    maximum = Number.POSITIVE_INFINITY
) {
    if (!Number.isFinite(value)) return fallback
    return Math.min(maximum, Math.max(minimum, value))
}

function imageData(image: ResponsiveImageValue) {
    if (!image) return { src: "", srcSet: "", alt: "" }

    if (typeof image === "string") {
        return { src: image, srcSet: "", alt: "" }
    }

    return {
        src: image.src || "",
        srcSet: image.srcSet || "",
        alt: image.alt || "",
    }
}

function normalizeLink(value: FramerLinkValue | undefined): FramerLinkValue {
    if (typeof value === "string") return value.trim() || "#"
    // Keep Framer page references intact so Link can resolve pages, CMS slugs,
    // and section targets in both the editor Preview and the published site.
    if (value && typeof value.webPageId === "string") return value
    return "#"
}

function normalizeLinks(links: MenuLink[] | undefined, fallback: MenuLink[]) {
    const source = Array.isArray(links) ? links : fallback

    return source
        .filter(
            (item): item is MenuLink =>
                Boolean(item) &&
                typeof item.label === "string" &&
                Boolean(item.label.trim())
        )
        .map((item) => ({
            label: item.label.trim(),
            url: normalizeLink(item.url),
        }))
}

function usePrefersReducedMotion(enabled = true) {
    const [prefersReducedMotion, setPrefersReducedMotion] =
        React.useState(false)

    React.useEffect(() => {
        if (!enabled) return
        if (typeof window === "undefined" || !window.matchMedia) return

        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const syncPreference = () => setPrefersReducedMotion(query.matches)

        syncPreference()

        if (query.addEventListener) {
            query.addEventListener("change", syncPreference)
            return () => query.removeEventListener("change", syncPreference)
        }

        query.addListener(syncPreference)
        return () => query.removeListener(syncPreference)
    }, [enabled])

    return prefersReducedMotion
}

// Framer Link injects its resolved href and click handler into this child.
// Keep the real anchor and let menu transitions finish before routing on live
// sites; in Preview, hand the click to Framer instead of loading the iframe URL.
const MenuAnchor = React.forwardRef<
    HTMLAnchorElement,
    React.ComponentPropsWithoutRef<"a"> & {
        onNavigate?: React.MouseEventHandler<HTMLAnchorElement>
    }
>(function MenuAnchor({ onNavigate, onClick, ...props }, ref) {
    return (
        <a
            {...props}
            ref={ref}
            onClick={(event) => {
                onNavigate?.(event)
                const anchor = event.currentTarget
                const target = anchor.getAttribute("target")
                if (
                    event.defaultPrevented ||
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    anchor.hasAttribute("download") ||
                    (target && target.toLowerCase() !== "_self")
                )
                    return
                onClick?.(event)
            }}
        />
    )
})

// Geometry updates do not need to render unchanged link groups again.
const MenuGroup = React.memo(function MenuGroup({
    id,
    title,
    className,
    links,
    fontSize,
    linksReady,
    onNavigate,
}: {
    id: string
    title: string
    className: string
    links: MenuLink[]
    fontSize: number
    linksReady: boolean
    onNavigate: (event: React.MouseEvent<HTMLAnchorElement>) => void
}) {
    if (links.length === 0) return null

    const groupStyle = {
        "--fom-link-size": `${fontSize}px`,
    } as React.CSSProperties

    return (
        <section
            className={`fom-group ${className}`}
            aria-labelledby={id}
            style={groupStyle}
        >
            <h2 id={id} className="fom-group-title">
                {title || "Links"}
            </h2>

            <ul className="fom-list">
                {links.map((item, index) => (
                    <li key={`${item.label}-${item.url}-${index}`}>
                        <FramerLink href={item.url} openInNewTab={false}>
                            <MenuAnchor
                                className="fom-link"
                                tabIndex={linksReady ? undefined : -1}
                                onNavigate={onNavigate}
                            >
                                <span>{item.label}</span>
                            </MenuAnchor>
                        </FramerLink>
                    </li>
                ))}
            </ul>
        </section>
    )
})

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200px
 * @framerIntrinsicHeight 80
 * @framerDisableUnlink
 */
export default function ResponsiveOverlayMenu(props: Props) {
    const logo = props.branding?.image ?? props.logo ?? ""
    const logoAlt = props.branding?.alt ?? props.logoAlt ?? "Home"
    const logoLink = props.branding?.link ?? props.logoLink ?? "#home"
    const logoSize = props.branding?.size ?? props.logoSize ?? 40
    const toggleLabel = props.menu?.buttonText ?? props.toggleLabel ?? "Menu"
    const menuLabel =
        props.menu?.accessibleName ?? props.menuLabel ?? "Navigation menu"

    const primaryLabel = props.primary?.label ?? props.primaryLabel ?? "Main"
    const secondaryLabel =
        props.secondary?.label ?? props.secondaryLabel ?? "More"
    const socialLabel = props.social?.label ?? props.socialLabel ?? "Social"
    const legalLabel = props.legal?.label ?? props.legalLabel ?? "Legal"
    const primaryFontSize =
        props.primary?.fontSize ?? props.primaryFontSize ?? 48
    const secondaryFontSize =
        props.secondary?.fontSize ?? props.secondaryFontSize ?? 24
    const socialFontSize = props.social?.fontSize ?? props.socialFontSize ?? 20
    const legalFontSize = props.legal?.fontSize ?? props.legalFontSize ?? 14
    const primaryLinks = props.primary?.links ?? props.primaryLinks
    const secondaryLinks = props.secondary?.links ?? props.secondaryLinks
    const socialLinks = props.social?.links ?? props.socialLinks
    const legalLinks = props.legal?.links ?? props.legalLinks

    const {
        style,
        navTransition = true,
        forceFramerRouter = false,
        navBackground = "#000000",
        accent1 = "#ffffff",
        accent2 = "#000000",
        accent3 = "#111111",
        accent4 = "#8cff4f",
        panelBackground = "#000000",
        textColor = "#ffffff",
        mutedColor = "#8d8d8d",
        hoverColor = "#ffffff",
        navBlur = 0,
        navMaxWidth = 1400,
    } = props

    const [isOpen, setIsOpen] = React.useState(false)
    const [isResuming, setIsResuming] = React.useState(false)
    const [scrollLocked, setScrollLocked] = React.useState(false)
    const [linksReady, setLinksReady] = React.useState(false)
    const [preparedOverlay, setPreparedOverlay] =
        React.useState<HTMLElement | null>(null)
    const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(
        null
    )
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const topbarRef = React.useRef<HTMLElement | null>(null)
    const toggleRef = React.useRef<HTMLButtonElement | null>(null)
    const overlayHostRef = React.useRef<HTMLDivElement | null>(null)
    const preparedSizeRef = React.useRef<{
        width: number
        height: number
    } | null>(null)
    const navigationCleanupRef = React.useRef<(() => void) | null>(null)
    const lastCloseTimeRef = React.useRef<number | null>(null)
    const [overlayGeometry, setOverlayGeometry] =
        React.useState<OverlayGeometry>(EMPTY_OVERLAY_GEOMETRY)
    const reactId = React.useId()
    const menuId = `responsive-overlay-menu-${reactId}`
    const isStaticRenderer = useIsStaticRenderer()
    const prefersReducedMotion = usePrefersReducedMotion(!isStaticRenderer)
    const overlayOpen =
        isStaticRenderer ||
        prefersReducedMotion ||
        isResuming ||
        (preparedOverlay !== null &&
            preparedOverlay === overlayHostRef.current &&
            preparedOverlay.parentNode === portalTarget)

    const safePrimaryLinks = React.useMemo(
        () => normalizeLinks(primaryLinks, defaultPrimaryLinks),
        [primaryLinks]
    )
    const safeSecondaryLinks = React.useMemo(
        () => normalizeLinks(secondaryLinks, defaultSecondaryLinks),
        [secondaryLinks]
    )
    const safeSocialLinks = React.useMemo(
        () => normalizeLinks(socialLinks, defaultSocialLinks),
        [socialLinks]
    )
    const safeLegalLinks = React.useMemo(
        () => normalizeLinks(legalLinks, defaultLegalLinks),
        [legalLinks]
    )

    const measureOverlay = React.useCallback(() => {
        const root = rootRef.current
        const ownerDocument = root?.ownerDocument
        const ownerWindow = ownerDocument?.defaultView

        if (!root || !ownerDocument || !ownerWindow || !root.isConnected) return

        const rootRect = root.getBoundingClientRect()
        const topbar = topbarRef.current
        const topbarRect = topbar?.getBoundingClientRect()
        const visualViewport = ownerWindow.visualViewport
        const viewportTop = visualViewport?.offsetTop ?? 0
        const viewportHeight =
            visualViewport?.height ||
            ownerDocument.documentElement.clientHeight ||
            ownerWindow.innerHeight
        const viewportBottom = viewportTop + viewportHeight
        const measuredTop = topbarRect?.bottom ?? rootRect.bottom
        const boundaryTop = Math.min(
            viewportBottom,
            Math.max(viewportTop, measuredTop)
        )
        // Let the real panel overlap the nav slightly. This is more reliable in
        // Chrome/Framer Preview than joining two compositor surfaces edge-to-edge.
        const overlap =
            boundaryTop > viewportTop && boundaryTop < viewportBottom
                ? Math.min(4, boundaryTop - viewportTop)
                : 0
        const nextTop = boundaryTop - overlap

        const nextGeometry: OverlayGeometry = {
            left: rootRect.left,
            top: nextTop,
            width: Math.max(0, rootRect.width),
            height: Math.max(0, viewportBottom - nextTop),
        }

        // Keep geometry in React state so newly mounted portals receive the
        // measured size even when a click happens before the portal is ready.
        setOverlayGeometry((current) => {
            const unchanged =
                Math.abs(current.left - nextGeometry.left) < 0.5 &&
                Math.abs(current.top - nextGeometry.top) < 0.5 &&
                Math.abs(current.width - nextGeometry.width) < 0.5 &&
                Math.abs(current.height - nextGeometry.height) < 0.5
            return unchanged ? current : nextGeometry
        })
        return nextGeometry
    }, [])

    React.useEffect(() => {
        if (isStaticRenderer) {
            setPortalTarget(null)
            setScrollLocked(false)
            return
        }

        const root = rootRef.current
        const ownerDocument = root?.ownerDocument
        if (!ownerDocument?.body) return

        setPortalTarget(ownerDocument.body)
    }, [isStaticRenderer])

    React.useEffect(() => {
        // Give the closed portal real dimensions before the first interaction.
        if (portalTarget && !isStaticRenderer) measureOverlay()
    }, [portalTarget, isStaticRenderer, measureOverlay])

    const clearPendingNavigation = React.useCallback(() => {
        const cleanup = navigationCleanupRef.current
        navigationCleanupRef.current = null
        cleanup?.()
    }, [])

    React.useEffect(() => {
        // Static previews need navigation cleanup, but no pageshow listener.
        if (isStaticRenderer) return clearPendingNavigation

        const ownerWindow = rootRef.current?.ownerDocument.defaultView
        if (!ownerWindow) return
        const handlePageShow = () => {
            if (!navigationCleanupRef.current) return
            // A Back/Forward-cache restore must not bring back an open, locked menu.
            clearPendingNavigation()
            if (
                overlayHostRef.current?.contains(
                    ownerWindow.document.activeElement
                )
            ) {
                toggleRef.current?.focus({ preventScroll: true })
            }
            setIsOpen(false)
            setScrollLocked(false)
        }
        ownerWindow.addEventListener("pageshow", handlePageShow)
        return () => {
            ownerWindow.removeEventListener("pageshow", handlePageShow)
            clearPendingNavigation()
        }
    }, [clearPendingNavigation, isStaticRenderer])

    const closeMenu = React.useCallback(
        (restoreFocus = false) => {
            clearPendingNavigation()
            lastCloseTimeRef.current = Date.now()
            if (restoreFocus) {
                toggleRef.current?.focus({ preventScroll: true })
            }
            setIsOpen(false)
        },
        [clearPendingNavigation]
    )

    const openMenu = React.useCallback(() => {
        clearPendingNavigation()
        const timeSinceClose =
            lastCloseTimeRef.current === null
                ? MENU_EXIT_MS
                : Date.now() - lastCloseTimeRef.current
        const resuming = timeSinceClose >= 0 && timeSinceClose < MENU_EXIT_MS
        setIsResuming(resuming)
        lastCloseTimeRef.current = null
        // Settle any size/position changes while the menu is still closed.
        // This is synchronous work in the click, not an extra animation frame.
        flushSync(() => {
            const nextGeometry = measureOverlay()
            const preparedSize = preparedSizeRef.current
            if (
                !resuming &&
                nextGeometry &&
                preparedSize &&
                (Math.abs(preparedSize.width - nextGeometry.width) >= 0.5 ||
                    Math.abs(preparedSize.height - nextGeometry.height) >= 0.5)
            ) {
                // A resized surface needs the Safari baseline again. Ordinary
                // clicks at the same size keep their immediate opening path.
                preparedSizeRef.current = null
                setPreparedOverlay(null)
            }
        })
        const host = overlayHostRef.current
        if (!resuming && host && preparedOverlay === host) {
            resolveOverlayStyles(host)
        }
        // Explicit canvas clicks may open an inline, non-animated preview.
        // Only the live page/Preview uses a body portal and scroll locking.
        setScrollLocked(!isStaticRenderer)
        setIsOpen(true)
    }, [
        isStaticRenderer,
        measureOverlay,
        clearPendingNavigation,
        preparedOverlay,
    ])

    React.useEffect(() => {
        if (isOpen || !scrollLocked) return

        if (prefersReducedMotion || isStaticRenderer) {
            setScrollLocked(false)
            return
        }

        const ownerWindow = rootRef.current?.ownerDocument.defaultView
        if (!ownerWindow) {
            setScrollLocked(false)
            return
        }

        // Keep the page frozen while the fixed portal completes its exit.
        const timer = ownerWindow.setTimeout(
            () => setScrollLocked(false),
            MENU_EXIT_MS
        )
        return () => ownerWindow.clearTimeout(timer)
    }, [isOpen, scrollLocked, prefersReducedMotion, isStaticRenderer])

    React.useEffect(() => {
        if (!scrollLocked) return

        const ownerDocument = rootRef.current?.ownerDocument
        const ownerWindow = ownerDocument?.defaultView
        const rootElement = ownerDocument?.documentElement
        const body = ownerDocument?.body
        if (!ownerWindow || !rootElement || !body) return

        const scrollX = ownerWindow.scrollX
        const scrollY = ownerWindow.scrollY
        const previousRootOverflow = rootElement.style.overflow
        const previousRootGutter = rootElement.style.scrollbarGutter
        const previousRootScrollBehavior = rootElement.style.scrollBehavior
        const previousBodyOverflow = body.style.overflow
        const previousRootOverscroll = rootElement.style.overscrollBehavior
        const previousBodyOverscroll = body.style.overscrollBehavior
        const previousBodyPosition = body.style.position
        const previousBodyTop = body.style.top
        const previousBodyLeft = body.style.left
        const previousBodyWidth = body.style.width

        // Chrome composites page scrolling and a body portal independently.
        // Freeze the background while open so the nav and panel cannot diverge;
        // the panel remains the only vertical scrolling surface.
        rootElement.style.overflow = "hidden"
        rootElement.style.scrollbarGutter = "stable"
        body.style.overflow = "hidden"
        rootElement.style.overscrollBehavior = "none"
        body.style.overscrollBehavior = "none"
        body.style.position = "fixed"
        body.style.top = `${-scrollY}px`
        body.style.left = `${-scrollX}px`
        body.style.width = "100%"

        return () => {
            rootElement.style.overflow = previousRootOverflow
            rootElement.style.scrollbarGutter = previousRootGutter
            body.style.overflow = previousBodyOverflow
            rootElement.style.overscrollBehavior = previousRootOverscroll
            body.style.overscrollBehavior = previousBodyOverscroll
            body.style.position = previousBodyPosition
            body.style.top = previousBodyTop
            body.style.left = previousBodyLeft
            body.style.width = previousBodyWidth
            rootElement.style.scrollBehavior = "auto"
            ownerWindow.scrollTo(scrollX, scrollY)
            rootElement.style.scrollBehavior = previousRootScrollBehavior
        }
    }, [scrollLocked])

    const hasOverlayGeometry =
        overlayGeometry.width > 0 && overlayGeometry.height > 0

    // Prepare each real portal once, including a separate painted closed frame
    // for Safari. Keeping that baseline after closing removes the frame wait
    // from later pointer, touch, and keyboard clicks.
    React.useEffect(() => {
        const host = overlayHostRef.current
        const ownerWindow = host?.ownerDocument.defaultView
        if (
            !host ||
            !ownerWindow ||
            !portalTarget ||
            !hasOverlayGeometry ||
            isStaticRenderer
        ) {
            preparedSizeRef.current = null
            setPreparedOverlay(null)
            return
        }
        if (preparedOverlay === host) return

        let openFrame = 0
        const prepareFrame = ownerWindow.requestAnimationFrame(() => {
            if (!host.isConnected || overlayHostRef.current !== host) return
            const rect = resolveOverlayStyles(host)
            if (!rect) return
            openFrame = ownerWindow.requestAnimationFrame(() => {
                if (!host.isConnected || overlayHostRef.current !== host) return
                preparedSizeRef.current = {
                    width: rect.width,
                    height: rect.height,
                }
                flushSync(() => setPreparedOverlay(host))
            })
        })
        return () => {
            ownerWindow.cancelAnimationFrame(prepareFrame)
            ownerWindow.cancelAnimationFrame(openFrame)
        }
    }, [
        portalTarget,
        hasOverlayGeometry,
        overlayGeometry.width,
        overlayGeometry.height,
        isStaticRenderer,
        preparedOverlay,
    ])

    React.useEffect(() => {
        if (!isOpen || !overlayOpen) {
            setLinksReady(false)
            return
        }

        if (prefersReducedMotion || isStaticRenderer) {
            setLinksReady(true)
            return
        }

        const ownerWindow = rootRef.current?.ownerDocument.defaultView
        if (!ownerWindow) {
            setLinksReady(true)
            return
        }

        // Keep keyboard focus out of the panel while its original reveal is
        // still covering the links. This delay affects focusability only.
        const timer = ownerWindow.setTimeout(() => setLinksReady(true), 900)
        return () => ownerWindow.clearTimeout(timer)
    }, [isOpen, overlayOpen, prefersReducedMotion, isStaticRenderer])

    React.useEffect(() => {
        if (!isOpen) return

        const root = rootRef.current
        const ownerDocument = root?.ownerDocument
        const ownerWindow = ownerDocument?.defaultView

        if (!root || !ownerDocument || !ownerWindow) return

        let animationFrame: number | null = null

        const scheduleMeasurement = () => {
            if (animationFrame !== null) return

            animationFrame = ownerWindow.requestAnimationFrame(() => {
                animationFrame = null
                measureOverlay()
            })
        }

        measureOverlay()

        const resizeObserver = ownerWindow.ResizeObserver
            ? new ownerWindow.ResizeObserver(scheduleMeasurement)
            : null
        resizeObserver?.observe(root)
        const topbar = topbarRef.current
        if (topbar) resizeObserver?.observe(topbar)

        ownerWindow.addEventListener("resize", scheduleMeasurement, {
            passive: true,
        })
        ownerWindow.visualViewport?.addEventListener(
            "resize",
            scheduleMeasurement,
            { passive: true }
        )
        ownerWindow.visualViewport?.addEventListener(
            "scroll",
            scheduleMeasurement,
            { passive: true }
        )

        return () => {
            resizeObserver?.disconnect()
            ownerWindow.removeEventListener("resize", scheduleMeasurement)
            ownerWindow.visualViewport?.removeEventListener(
                "resize",
                scheduleMeasurement
            )
            ownerWindow.visualViewport?.removeEventListener(
                "scroll",
                scheduleMeasurement
            )

            if (animationFrame !== null) {
                ownerWindow.cancelAnimationFrame(animationFrame)
            }
        }
    }, [isOpen, measureOverlay, portalTarget])

    React.useEffect(() => {
        if (!isOpen) return

        const root = rootRef.current
        const ownerDocument = root?.ownerDocument
        if (!root || !ownerDocument) return

        const isInsideMenu = (target: EventTarget | null) => {
            const node = target as Node | null
            return Boolean(
                node &&
                    (root.contains(node) ||
                        overlayHostRef.current?.contains(node))
            )
        }

        const handleDocumentKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault()
                closeMenu(true)
                return
            }

            if (event.key !== "Tab") return

            const overlay = overlayHostRef.current
            if (!overlay) return

            const menuFocusables = Array.from(
                overlay.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
            ).filter(
                (element) =>
                    !element.hasAttribute("inert") &&
                    element.getClientRects().length > 0
            )
            const firstMenuItem = menuFocusables[0]
            const lastMenuItem = menuFocusables[menuFocusables.length - 1]
            const activeElement =
                ownerDocument.activeElement as HTMLElement | null

            // A portal is outside the nav's DOM order. Bridge only the two edges
            // required to make it behave like an ordinary disclosure.
            if (!event.shiftKey && activeElement === toggleRef.current) {
                // The portal has no natural DOM-order path from the toggle. During
                // the short reveal, keep focus on the visible toggle; once ready,
                // bridge directly to the first navigation link.
                if (!firstMenuItem) {
                    if (!linksReady) {
                        event.preventDefault()
                    } else {
                        // An empty menu must not trap focus on the toggle.
                        closeMenu(false)
                    }
                    return
                }
                event.preventDefault()
                firstMenuItem.focus({ preventScroll: true })
                return
            }

            if (event.shiftKey && activeElement === firstMenuItem) {
                event.preventDefault()
                toggleRef.current?.focus({ preventScroll: true })
                return
            }

            if (!event.shiftKey && activeElement === lastMenuItem) {
                const followingFlag =
                    ownerDocument.defaultView?.Node
                        .DOCUMENT_POSITION_FOLLOWING ?? 4
                const nextOutsideElement = Array.from(
                    ownerDocument.querySelectorAll<HTMLElement>(
                        FOCUSABLE_SELECTOR
                    )
                ).find(
                    (element) =>
                        !isInsideMenu(element) &&
                        element.getClientRects().length > 0 &&
                        Boolean(
                            root.compareDocumentPosition(element) &
                                followingFlag
                        )
                )

                if (!nextOutsideElement) return

                event.preventDefault()
                closeMenu(false)
                nextOutsideElement.focus({ preventScroll: true })
            }
        }

        const handleDocumentFocusIn = (event: FocusEvent) => {
            if (isInsideMenu(event.target)) return

            // This is a partial-width navigation disclosure, not a page modal.
            // Explicitly moving focus elsewhere closes it without stealing focus.
            closeMenu(false)
        }

        const handleDocumentPointerDown = (event: PointerEvent) => {
            if (isInsideMenu(event.target)) return

            const activeElement =
                ownerDocument.activeElement as HTMLElement | null
            const focusIsInside = isInsideMenu(activeElement)
            closeMenu(focusIsInside)
        }

        ownerDocument.addEventListener("keydown", handleDocumentKeyDown)
        ownerDocument.addEventListener("focusin", handleDocumentFocusIn)
        ownerDocument.addEventListener(
            "pointerdown",
            handleDocumentPointerDown,
            {
                passive: true,
                capture: true,
            }
        )

        return () => {
            ownerDocument.removeEventListener("keydown", handleDocumentKeyDown)
            ownerDocument.removeEventListener("focusin", handleDocumentFocusIn)
            ownerDocument.removeEventListener(
                "pointerdown",
                handleDocumentPointerDown,
                true
            )
        }
    }, [isOpen, linksReady, closeMenu])

    const handleToggle = React.useCallback(() => {
        if (isOpen) {
            closeMenu(false)
        } else {
            openMenu()
        }
    }, [isOpen, closeMenu, openMenu])

    const handleLinkNavigate = React.useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>) => {
            const anchor = event.currentTarget
            const target = anchor.getAttribute("target")
            // Preserve browser gestures, downloads, and alternate browsing targets.
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                anchor.hasAttribute("download") ||
                (target && target.toLowerCase() !== "_self")
            )
                return

            const rawHref = (anchor.getAttribute("href") || "").trim()
            const ownerWindow = anchor.ownerDocument.defaultView
            if (!ownerWindow || !rawHref) return

            let destination: URL
            let current: URL
            try {
                current = new URL(ownerWindow.location.href)
                destination = new URL(rawHref, current)
            } catch {
                return
            }
            if (!/^https?:$/.test(destination.protocol)) return

            if (navigationCleanupRef.current) {
                event.preventDefault()
                return
            }

            const sameDocument =
                destination.origin === current.origin &&
                destination.pathname === current.pathname &&
                destination.search === current.search

            if (sameDocument && rawHref.includes("#")) {
                event.preventDefault()
                closeMenu(true)
                setScrollLocked(false)
                const frame = ownerWindow.requestAnimationFrame(() => {
                    navigationCleanupRef.current = null
                    if (rawHref !== "#")
                        ownerWindow.location.hash = destination.hash
                })
                navigationCleanupRef.current = () =>
                    ownerWindow.cancelAnimationFrame(frame)
                return
            }

            const reduceMotion =
                prefersReducedMotion ||
                ownerWindow.matchMedia?.("(prefers-reduced-motion: reduce)")
                    .matches

            // The Preview URL is an editor document, not a published page URL.
            // Leave this click unprevented so MenuAnchor calls Framer Link's
            // own handler, which resolves the correct page and section target.
            if (
                destination.origin === current.origin &&
                (forceFramerRouter || isFramerEditorHost(ownerWindow))
            ) {
                // Framer's router swaps pages client-side, which unmounts this
                // instance and its portal instantly. Hand the open menu to a
                // detached copy so it can still retract over the new page.
                const liveHost = overlayHostRef.current
                if (
                    isOpen &&
                    liveHost &&
                    navTransition &&
                    !reduceMotion &&
                    !isStaticRenderer
                ) {
                    launchExitOverlay(liveHost)
                }
                closeMenu(false)
                setScrollLocked(false)
                return
            }

            if (!navTransition || reduceMotion || isStaticRenderer) {
                closeMenu(true)
                setScrollLocked(false)
                return
            }

            event.preventDefault()
            const host = overlayHostRef.current
            if (
                isOpen &&
                host &&
                !sameDocument &&
                destination.origin === current.origin &&
                supportsPageReveal(ownerWindow)
            ) {
                const restoreLayers = preparePageReveal(host)
                let firstFrame = 0
                let secondFrame = 0
                // If navigation is cancelled or blocked, never leave the UI stuck.
                const watchdog = ownerWindow.setTimeout(() => {
                    closeMenu(true)
                    setScrollLocked(false)
                }, 10000)
                navigationCleanupRef.current = () => {
                    ownerWindow.cancelAnimationFrame(firstFrame)
                    ownerWindow.cancelAnimationFrame(secondFrame)
                    ownerWindow.clearTimeout(watchdog)
                    restoreLayers()
                }
                // Keep the real menu open for the outgoing snapshot. Its captured
                // layers retract on the destination, even after this React tree unmounts.
                firstFrame = ownerWindow.requestAnimationFrame(() => {
                    secondFrame = ownerWindow.requestAnimationFrame(() => {
                        ownerWindow.location.assign(destination.href)
                    })
                })
                return
            }

            // External pages and older/embedded browsers cannot retain snapshots
            // across documents. Finish the normal close before following the link.
            closeMenu(true)
            const timer = ownerWindow.setTimeout(() => {
                navigationCleanupRef.current = null
                setScrollLocked(false)
                ownerWindow.location.assign(destination.href)
            }, MENU_EXIT_MS)
            navigationCleanupRef.current = () => ownerWindow.clearTimeout(timer)
        },
        [
            closeMenu,
            isOpen,
            isStaticRenderer,
            prefersReducedMotion,
            navTransition,
            forceFramerRouter,
        ]
    )

    const logoImage = imageData(logo)

    const safeLogoSize = finiteNumber(logoSize, 40, 20, 120)
    const safeNavMaxWidth = finiteNumber(navMaxWidth, 1400, 320, 2560)
    const safeBlur = finiteNumber(navBlur, 0, 0, 16)
    const safePrimaryFontSize = finiteNumber(primaryFontSize, 48, 20, 100)
    const safeSecondaryFontSize = finiteNumber(secondaryFontSize, 24, 12, 48)
    const safeSocialFontSize = finiteNumber(socialFontSize, 20, 12, 40)
    const safeLegalFontSize = finiteNumber(legalFontSize, 14, 10, 24)

    // Framer supplies percentage dimensions for a user-sized wrapper. Preserve
    // them; the numeric fallback gives auto-sized/new instances a real height.
    const requestedHeight = style?.height
    const rootHeight =
        requestedHeight == null ||
        (typeof requestedHeight === "number" &&
            (!Number.isFinite(requestedHeight) || requestedHeight <= 0)) ||
        requestedHeight === "auto" ||
        requestedHeight === "" ||
        requestedHeight === "0" ||
        requestedHeight === "0px" ||
        requestedHeight === "0%"
            ? DEFAULT_NAV_HEIGHT
            : requestedHeight
    const rootStyle = {
        position: "relative",
        ...style,
        width: style?.width ?? "100%",
        height: rootHeight,
        minWidth: 0,
        minHeight: 44,
        background: navBackground,
        overflow: "visible",
        isolation: "isolate",
        boxSizing: "border-box",
        fontFamily:
            style?.fontFamily ||
            '"Onest", "Inter", "Helvetica Neue", Arial, sans-serif',
        "--fom-nav-padding-x": `${NAV_PADDING}px`,
        "--fom-menu-padding": `${MENU_PADDING}px`,
        "--fom-nav-max-width": `${safeNavMaxWidth}px`,
        "--fom-logo-size": `${safeLogoSize}px`,
        "--fom-panel-color": panelBackground,
        "--fom-text-color": textColor,
        "--fom-muted-color": mutedColor,
        "--fom-hover-color": hoverColor,
    } as React.CSSProperties

    const inlineOverlay = !portalTarget
    const overlayHostStyle = {
        position: inlineOverlay ? "absolute" : "fixed",
        left: inlineOverlay ? 0 : overlayGeometry.left,
        top: inlineOverlay ? "100%" : overlayGeometry.top,
        width: inlineOverlay ? "100%" : overlayGeometry.width,
        height: inlineOverlay
            ? isOpen
                ? Math.max(320, overlayGeometry.height)
                : 0
            : overlayGeometry.height,
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        isolation: "isolate",
        contain: "layout paint",
        boxSizing: "border-box",
        pointerEvents: isOpen ? "auto" : "none",
        zIndex: 2147483000,
        containerName: "fom",
        containerType: "inline-size",
        fontFamily:
            style?.fontFamily ||
            '"Onest", "Inter", "Helvetica Neue", Arial, sans-serif',
        "--fom-menu-padding": `${MENU_PADDING}px`,
        "--fom-panel-color": panelBackground,
        "--fom-text-color": textColor,
        "--fom-muted-color": mutedColor,
        "--fom-hover-color": hoverColor,
    } as React.CSSProperties

    // React 18's typings predate the native `inert` attribute, so it is
    // applied through a typed spread while still reaching the browser.
    const closedContentProps = !isOpen
        ? ({ inert: "" } as Record<string, string>)
        : {}

    // Render these same links in initial HTML. The client mounts the closed
    // overlay into the body once, retaining the existing fixed portal behavior.
    const overlay = (
        <div
            ref={overlayHostRef}
            className={`${COMPONENT_SCOPE} fom-overlay-host fom-ready${isOpen && overlayOpen ? " fom-open" : ""}${isResuming ? " fom-resuming" : ""}${isStaticRenderer ? " fom-static" : ""}`}
            style={overlayHostStyle}
        >
            <div
                id={menuId}
                className="fom-content"
                aria-hidden={!isOpen}
                {...closedContentProps}
            >
                <div
                    className="fom-background fom-background-1"
                    style={{ backgroundColor: accent1 }}
                    aria-hidden="true"
                />
                <div
                    className="fom-background fom-background-2"
                    style={{ backgroundColor: accent2 }}
                    aria-hidden="true"
                />
                <div
                    className="fom-background fom-background-3"
                    style={{ backgroundColor: accent3 }}
                    aria-hidden="true"
                />
                <div
                    className="fom-background fom-background-4"
                    style={{ backgroundColor: accent4 }}
                    aria-hidden="true"
                />

                <div className="fom-panel-reveal">
                    <div className="fom-panel">
                        <nav
                            className="fom-menu"
                            aria-label={menuLabel || "Navigation menu"}
                        >
                            <div className="fom-layout">
                                <MenuGroup
                                    id={`${menuId}-primary`}
                                    title={primaryLabel}
                                    className="fom-primary"
                                    links={safePrimaryLinks}
                                    fontSize={safePrimaryFontSize}
                                    linksReady={isOpen && linksReady}
                                    onNavigate={handleLinkNavigate}
                                />
                                <MenuGroup
                                    id={`${menuId}-secondary`}
                                    title={secondaryLabel}
                                    className="fom-secondary"
                                    links={safeSecondaryLinks}
                                    fontSize={safeSecondaryFontSize}
                                    linksReady={isOpen && linksReady}
                                    onNavigate={handleLinkNavigate}
                                />
                                <MenuGroup
                                    id={`${menuId}-social`}
                                    title={socialLabel}
                                    className="fom-social"
                                    links={safeSocialLinks}
                                    fontSize={safeSocialFontSize}
                                    linksReady={isOpen && linksReady}
                                    onNavigate={handleLinkNavigate}
                                />
                                <MenuGroup
                                    id={`${menuId}-legal`}
                                    title={legalLabel}
                                    className="fom-legal"
                                    links={safeLegalLinks}
                                    fontSize={safeLegalFontSize}
                                    linksReady={isOpen && linksReady}
                                    onNavigate={handleLinkNavigate}
                                />
                            </div>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div
            ref={rootRef}
            className={`${COMPONENT_SCOPE}${isOpen ? " fom-nav-open" : ""}${isStaticRenderer ? " fom-static" : ""}`}
            style={rootStyle}
        >
            <div className="fom-boundary">
                <nav
                    ref={topbarRef}
                    className="fom-topbar"
                    aria-label="Site navigation"
                    style={{
                        background: navBackground,
                        backdropFilter:
                            !isStaticRenderer && safeBlur > 0
                                ? `blur(${safeBlur}px)`
                                : "none",
                        WebkitBackdropFilter:
                            !isStaticRenderer && safeBlur > 0
                                ? `blur(${safeBlur}px)`
                                : "none",
                    }}
                >
                    <div className="fom-topbar-inner">
                        <FramerLink
                            href={normalizeLink(logoLink)}
                            openInNewTab={false}
                        >
                            <MenuAnchor
                                className="fom-logo-link"
                                aria-label={
                                    logoImage.src
                                        ? undefined
                                        : logoAlt || "Home"
                                }
                                onNavigate={
                                    isOpen ? handleLinkNavigate : undefined
                                }
                            >
                                {logoImage.src ? (
                                    <img
                                        className="fom-logo-visual"
                                        src={logoImage.src}
                                        srcSet={logoImage.srcSet || undefined}
                                        sizes={`${safeLogoSize}px`}
                                        alt={logoImage.alt || logoAlt || "Logo"}
                                        draggable={false}
                                        style={{
                                            objectFit: "contain",
                                            display: "block",
                                        }}
                                    />
                                ) : (
                                    <span
                                        className="fom-logo-visual"
                                        aria-hidden="true"
                                        style={{
                                            borderRadius: "50%",
                                            background: textColor,
                                            display: "block",
                                        }}
                                    />
                                )}
                            </MenuAnchor>
                        </FramerLink>

                        <button
                            ref={toggleRef}
                            className="fom-toggler"
                            type="button"
                            aria-label={
                                isOpen
                                    ? `Close ${toggleLabel || "Menu"}`
                                    : `Open ${toggleLabel || "Menu"}`
                            }
                            aria-expanded={isOpen}
                            aria-controls={menuId}
                            onClick={handleToggle}
                        >
                            <span
                                className="fom-toggler-label"
                                aria-hidden="true"
                            >
                                {isOpen ? "Close" : toggleLabel || "Menu"}
                            </span>
                            <span
                                className="fom-toggler-icon"
                                aria-hidden="true"
                            >
                                <span className="fom-toggler-bar" />
                                <span className="fom-toggler-bar" />
                            </span>
                        </button>
                    </div>
                </nav>
            </div>

            {portalTarget ? createPortal(overlay, portalTarget) : overlay}

            <style>{COMPONENT_CSS}</style>
            {navTransition && <style>{PAGE_REVEAL_CSS}</style>}
        </div>
    )
}

ResponsiveOverlayMenu.defaultProps = {
    navTransition: true,
    forceFramerRouter: false,
    logo: "",
    logoAlt: "Home",
    logoLink: "#home",
    toggleLabel: "Menu",
    menuLabel: "Navigation menu",
    primaryLabel: "Main",
    secondaryLabel: "More",
    socialLabel: "Social",
    legalLabel: "Legal",
    navBackground: "#000000",
    accent1: "#ffffff",
    accent2: "#000000",
    accent3: "#111111",
    accent4: "#8cff4f",
    panelBackground: "#000000",
    textColor: "#ffffff",
    mutedColor: "#8d8d8d",
    hoverColor: "#ffffff",
    navBlur: 0,
    navMaxWidth: 1400,
    logoSize: 40,
    primaryFontSize: 48,
    secondaryFontSize: 24,
    socialFontSize: 20,
    legalFontSize: 14,
    primaryLinks: defaultPrimaryLinks,
    secondaryLinks: defaultSecondaryLinks,
    socialLinks: defaultSocialLinks,
    legalLinks: defaultLegalLinks,
}

function sectionControl(
    title: string,
    label: string,
    fontSize: number,
    min: number,
    max: number,
    links: MenuLink[],
    maxCount = 10
) {
    return {
        type: ControlType.Object,
        title,
        controls: {
            label: {
                type: ControlType.String,
                title: "Heading",
                description: "Visible heading and accessible section name.",
                defaultValue: label,
            },
            fontSize: {
                type: ControlType.Number,
                title: "Text Size",
                description: "Base size; scales down on smaller screens.",
                min,
                max,
                unit: "px",
                step: 1,
                defaultValue: fontSize,
            },
            links: {
                type: ControlType.Array,
                title: "Links",
                description: "Add or reorder; empty hides the section.",
                control: {
                    type: ControlType.Object,
                    controls: {
                        label: {
                            type: ControlType.String,
                            title: "Text",
                            description: "Visible link name.",
                            defaultValue: "Link",
                        },
                        url: {
                            type: ControlType.Link,
                            title: "URL",
                            description: "Page, URL, or #section.",
                            defaultValue: "#",
                        },
                    },
                },
                defaultValue: links,
                maxCount,
            },
        },
    } as const
}

addPropertyControls(ResponsiveOverlayMenu, {
    branding: {
        type: ControlType.Object,
        title: "Logo",
        controls: {
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
                description: "Navigation logo.",
            },
            alt: {
                type: ControlType.String,
                title: "Alt Text",
                description: "Accessible name if image alt is unset.",
                defaultValue: "Home",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
                description: "Logo destination.",
                defaultValue: "#home",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                description: "Base size; fits the nav height.",
                min: 20,
                max: 120,
                unit: "px",
                step: 1,
                defaultValue: 40,
            },
        },
    },
    menu: {
        type: ControlType.Object,
        title: "Menu",
        controls: {
            buttonText: {
                type: ControlType.String,
                title: "Button Text",
                description: "Toggle text; also names the button.",
                defaultValue: "Menu",
            },
            accessibleName: {
                type: ControlType.String,
                title: "Accessible Name",
                description: "Menu name for screen readers.",
                defaultValue: "Navigation menu",
            },
        },
    },
    navTransition: {
        type: ControlType.Boolean,
        title: "Nav Transition",
        description:
            "Animates page changes from menu links. Off follows links immediately.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    forceFramerRouter: {
        type: ControlType.Boolean,
        title: "Framer Router",
        description:
            "Use Framer routing on published sites too. Preview uses it automatically.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Auto",
    },
    primary: sectionControl(
        "Primary",
        "Main",
        48,
        20,
        100,
        defaultPrimaryLinks
    ),
    secondary: sectionControl(
        "Secondary",
        "More",
        24,
        12,
        48,
        defaultSecondaryLinks
    ),
    social: sectionControl("Social", "Social", 20, 12, 40, defaultSocialLinks),
    legal: sectionControl("Legal", "Legal", 14, 10, 24, defaultLegalLinks, 12),
    navBackground: {
        type: ControlType.Color,
        title: "Nav BG",
        description: "Navigation bar background.",
        defaultValue: "#000000",
    },
    accent1: {
        type: ControlType.Color,
        title: "BG 1",
        description: "First reveal layer.",
    },
    accent2: {
        type: ControlType.Color,
        title: "BG 2",
        description: "Second reveal layer.",
    },
    accent3: {
        type: ControlType.Color,
        title: "BG 3",
        description: "Third reveal layer.",
    },
    accent4: {
        type: ControlType.Color,
        title: "BG 4",
        description: "Fourth reveal layer.",
    },
    panelBackground: {
        type: ControlType.Color,
        title: "Panel",
        description: "Open menu background.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        description: "Logo, icon, and button text.",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        description: "Links, headings, and dividers.",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover",
        description: "Hover and focus color.",
    },
    navBlur: {
        type: ControlType.Number,
        title: "Nav Blur",
        description: "Blur behind the nav.",
        min: 0,
        max: 16,
        unit: "px",
        step: 1,
        defaultValue: 0,
    },
    navMaxWidth: {
        type: ControlType.Number,
        title: "Nav Max Width",
        description: "Logo and button row; background stays full width.",
        min: 320,
        max: 2560,
        unit: "px",
        step: 10,
        defaultValue: 1400,
    },
})
