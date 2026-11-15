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


type LayoutPreset = "profile" | "compact" | "horizontal"
type VisualPreset = "clean" | "dark" | "warm" | "minimal" | "elevated"
type ActionStyle = "filled" | "outline" | "minimal"
type ImageShape = "circle" | "rounded" | "square"
type Alignment = "left" | "center"

interface ResponsiveImageValue { src?: string; srcSet?: string; alt?: string }
interface ActionOptions { style: ActionStyle; background: string; text: string; border: string; borderWidth: number; radius: number; gap: number; showIcons: boolean; iconSize: number }
interface ProfileOptions { shape: ImageShape; size: number; radius: number; borderColor: string; borderWidth: number; accentRing: boolean }
interface CardOptions { background: string; text: string; muted: string; accent: string; border: string; borderWidth: number; radius: number; shadow: string; padding: number; sectionGap: number }
interface SectionOptions { bio: boolean; address: boolean; socials: boolean; actions: boolean; save: boolean }

interface TapContactProps {
    profileImage?: ResponsiveImageValue
    fullName: string; company: string; role: string; bio: string; phone: string; email: string; website: string; address: string; vcardFilename: string
    instagram: string; facebook: string; linkedin: string; twitter: string; tiktok: string; youtube: string
    layout: LayoutPreset; preset: VisualPreset; customizeCard: boolean; alignment: Alignment
    actions: ActionOptions; profile: ProfileOptions; card: CardOptions; sections: SectionOptions
    style?: React.CSSProperties
}

const actionIcons: Record<string, React.ReactNode> = {
    Call: <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.45.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.45 1 1 0 0 1-.25 1Z" />,
    Text: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />,
    Email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    Website: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
    Directions: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    Save: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 19h14" /></>,
}

const socialIcons: Record<string, React.ReactNode> = {
    Instagram: <><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.3" cy="6.8" r=".7" fill="currentColor" stroke="none" /></>,
    Facebook: <path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2.2-2H18V1.4c-.6-.1-1.8-.2-3-.2-3 0-5 1.8-5 5.2V9H7v4h3v8" />,
    LinkedIn: <><rect x="3" y="9" width="4" height="12" /><path d="M5 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM11 21V9h4v1.8c1-1.5 5-2.6 5 3.7V21h-4v-5.6c0-2.7-3-2.5-3 0V21Z" /></>,
    "X / Twitter": <path d="m4 3 16 18M20 3 4 21" />,
    TikTok: <><path d="M14 3v11.5a4.5 4.5 0 1 1-4-4.47" /><path d="M14 3c.6 3 2.2 4.6 5 5" /></>,
    YouTube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" /></>,
}

function Icon({ children, size }: { children: React.ReactNode; size: number }) {
    return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
}

function trim(value: string | undefined): string { return (value || "").trim() }
function normalizeWebUrl(value: string): string { const clean = trim(value); return !clean ? "" : /^https?:\/\//i.test(clean) ? clean : `https://${clean}` }
function phoneHref(value: string): string { return trim(value).replace(/[^+\d*#,;]/g, "") }
function escapeVCard(value: string): string { return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,") }
function structuredName(fullName: string): string { const parts = trim(fullName).split(/\s+/).filter(Boolean); if (!parts.length) return ";;;;"; if (parts.length === 1) return `${escapeVCard(parts[0])};;;;`; const family = parts.pop() || ""; return `${escapeVCard(family)};${escapeVCard(parts.join(" "))};;;` }
function sanitizeFilename(value: string, fullName: string): string { const source = trim(value).replace(/\.vcf$/i, "") || trim(fullName) || "contact"; const safe = source.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); return `${safe || "contact"}.vcf` }
function initials(name: string): string { return trim(name).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("") || "TC" }

function buildVCard(props: TapContactProps): string {
    const lines = ["BEGIN:VCARD", "VERSION:3.0", "PRODID:-//TapContact//EN"]
    const fullName = trim(props.fullName), company = trim(props.company), role = trim(props.role), phone = trim(props.phone), email = trim(props.email), website = normalizeWebUrl(props.website), address = trim(props.address)
    if (fullName) { lines.push(`N:${structuredName(fullName)}`); lines.push(`FN:${escapeVCard(fullName)}`) }
    if (company) lines.push(`ORG:${escapeVCard(company)}`)
    if (role) lines.push(`TITLE:${escapeVCard(role)}`)
    if (phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(phone)}`)
    if (email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(email)}`)
    if (website) lines.push(`URL:${escapeVCard(website)}`)
    if (address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(address)};;;;`)
    const socials: Array<[string, string]> = [["instagram", props.instagram], ["facebook", props.facebook], ["linkedin", props.linkedin], ["twitter", props.twitter], ["tiktok", props.tiktok], ["youtube", props.youtube]]
    socials.forEach(([network, value]) => { const url = normalizeWebUrl(value); if (url) lines.push(`X-SOCIALPROFILE;TYPE=${network}:${escapeVCard(url)}`) })
    lines.push("END:VCARD")
    return `${lines.join("\r\n")}\r\n`
}

const presets: Record<VisualPreset, CardOptions> = {
    clean: { background: "#FFFFFF", text: "#15171A", muted: "#667085", accent: "#2457E6", border: "#E4E7EC", borderWidth: 1, radius: 24, shadow: "0 8px 30px rgba(16,24,40,.06)", padding: 28, sectionGap: 18 },
    dark: { background: "#111318", text: "#F8FAFC", muted: "#98A2B3", accent: "#8FB0FF", border: "#2B303B", borderWidth: 1, radius: 24, shadow: "0 12px 34px rgba(0,0,0,.3)", padding: 28, sectionGap: 18 },
    warm: { background: "#FFF8EF", text: "#352A22", muted: "#7D6A5C", accent: "#B6572A", border: "#EAD8C6", borderWidth: 1, radius: 28, shadow: "0 10px 30px rgba(83,50,27,.08)", padding: 30, sectionGap: 18 },
    minimal: { background: "#FFFFFF", text: "#111111", muted: "#737373", accent: "#111111", border: "#FFFFFF", borderWidth: 0, radius: 0, shadow: "none", padding: 24, sectionGap: 16 },
    elevated: { background: "#FFFFFF", text: "#101828", muted: "#667085", accent: "#6D3CEB", border: "#EAECF0", borderWidth: 1, radius: 30, shadow: "0 24px 64px rgba(16,24,40,.16)", padding: 32, sectionGap: 20 },
}

/**
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 680
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TapContact(props: TapContactProps) {
    const {
        profileImage, fullName = "Jordan Lee", company = "Northline Studio", role = "Creative Director", bio = "Helping thoughtful teams turn complex ideas into clear digital experiences.",
        phone = "+1 (555) 014-0182", email = "jordan@example.com", website = "example.com", address = "100 Market Street, Austin, TX 78701", vcardFilename = "jordan-lee",
        instagram = "", facebook = "", linkedin = "https://www.linkedin.com/in/jordan-lee-example", twitter = "", tiktok = "", youtube = "",
        layout = "profile", preset = "clean", customizeCard = false, alignment = "center",
        actions = { style: "minimal", background: "#2457E6", text: "#FFFFFF", border: "#2457E6", borderWidth: 1, radius: 14, gap: 10, showIcons: true, iconSize: 19 },
        profile = { shape: "circle", size: 104, radius: 20, borderColor: "#E4E7EC", borderWidth: 1, accentRing: false },
        card = presets.clean,
        sections = { bio: false, address: true, socials: true, actions: true, save: true },
        style,
    } = props
    const theme = customizeCard ? card : presets[preset]
    const scopeClass = `tap-contact-${React.useId().replace(/:/g, "")}`
    const isCompact = layout === "compact", isHorizontal = layout === "horizontal"
    const alignItems = alignment === "center" ? "center" : "flex-start"
    const phoneValue = phoneHref(phone)
    const contactActions = [
        phoneValue && ["Call", `tel:${phoneValue}`], phoneValue && ["Text", `sms:${phoneValue}`],
        trim(email) && ["Email", `mailto:${trim(email)}`], normalizeWebUrl(website) && ["Website", normalizeWebUrl(website)],
        trim(address) && ["Directions", `https://maps.google.com/?q=${encodeURIComponent(trim(address))}`],
    ].filter((item): item is [string, string] => Boolean(item))
    const socials = [["Instagram", instagram], ["Facebook", facebook], ["LinkedIn", linkedin], ["X / Twitter", twitter], ["TikTok", tiktok], ["YouTube", youtube]].filter((item): item is [string, string] => Boolean(trim(item[1])))
    const canSaveContact = Boolean(trim(fullName))
    const actionVisual = actions.style === "filled"
        ? { background: actions.background, color: actions.text, border: `${actions.borderWidth}px solid ${actions.border}` }
        : actions.style === "outline"
            ? { background: "transparent", color: theme.accent, border: `${actions.borderWidth}px solid ${actions.border}` }
            : { background: "transparent", color: theme.accent, border: `${actions.borderWidth}px solid transparent` }

    function saveContact() {
        if (!canSaveContact || typeof window === "undefined" || typeof document === "undefined") return
        const blob = new Blob([buildVCard(props)], { type: "text/vcard;charset=utf-8" })
        const objectUrl = URL.createObjectURL(blob), anchor = document.createElement("a")
        anchor.href = objectUrl; anchor.download = sanitizeFilename(vcardFilename, fullName); anchor.style.display = "none"
        document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
    }

    const actionCss: React.CSSProperties = { ...actionVisual, minHeight: 44, minWidth: 44, borderRadius: actions.radius, padding: "10px 13px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: actions.gap, font: "inherit", fontSize: 14, fontWeight: 650, lineHeight: 1, textDecoration: "none", cursor: "pointer", boxSizing: "border-box" }
    const imageRadius = profile.shape === "circle" ? "50%" : profile.shape === "square" ? 0 : profile.radius
    const imageSize = isCompact ? Math.min(profile.size, 72) : profile.size
    const visibleAddress = sections.address && Boolean(trim(address)), visibleBio = sections.bio && Boolean(trim(bio)), visibleSocials = sections.socials && socials.length > 0
    const visibleActions = (sections.actions && contactActions.length > 0) || (sections.save && canSaveContact)

    return <article className={`tap-contact ${scopeClass} tap-contact--${layout}`} aria-label={`Contact card for ${trim(fullName) || "contact"}`} style={{ ...style, position: "relative", width: "100%", height: "100%", minWidth: 0, maxWidth: "100%", boxSizing: "border-box", overflow: "auto", ...({ containerType: "inline-size" } as React.CSSProperties & { containerType: string }), background: theme.background, color: theme.text, border: `${theme.borderWidth}px solid ${theme.border}`, borderRadius: theme.radius, boxShadow: theme.shadow, padding: theme.padding, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <style>{`
            .${scopeClass} *{box-sizing:border-box}.${scopeClass} a,.${scopeClass} button{transition:transform 140ms ease,filter 140ms ease,box-shadow 140ms ease}.${scopeClass} a:hover,.${scopeClass} button:hover{filter:brightness(.94)}.${scopeClass} a:active,.${scopeClass} button:active{transform:translateY(1px)}.${scopeClass} a:focus-visible,.${scopeClass} button:focus-visible{outline:3px solid ${theme.accent};outline-offset:3px}.${scopeClass} button:disabled{opacity:.45;cursor:not-allowed}
            .${scopeClass} .tap-contact__shell{display:flex;flex-direction:${isHorizontal ? "row" : "column"};gap:${theme.sectionGap}px;min-width:0;height:100%}.${scopeClass} .tap-contact__identity{display:flex;flex-direction:${isCompact ? "row" : "column"};align-items:${isCompact ? "center" : alignItems};text-align:${isCompact ? "left" : alignment};gap:${Math.max(10, theme.sectionGap * .7)}px;min-width:0;${isHorizontal ? "flex:0 1 38%;justify-content:center" : ""}}.${scopeClass} .tap-contact__content{display:flex;flex-direction:column;gap:${theme.sectionGap}px;min-width:0;${isHorizontal ? "flex:1;justify-content:center" : ""}}.${scopeClass} .tap-contact__actions{display:grid;grid-template-columns:repeat(${isCompact ? 3 : 2},minmax(0,1fr));gap:${Math.max(8, actions.gap)}px;min-width:0}.${scopeClass} .tap-contact__socials{display:flex;flex-wrap:wrap;gap:8px;justify-content:${alignment === "center" ? "center" : "flex-start"}}
            @container (max-width:640px){.${scopeClass} .tap-contact__shell{flex-direction:column}.${scopeClass} .tap-contact__identity{flex:none}.${scopeClass} .tap-contact__actions{grid-template-columns:repeat(2,minmax(0,1fr))}}@container (max-width:360px){.${scopeClass} .tap-contact__actions{grid-template-columns:1fr}}
        `}</style>
        <div className="tap-contact__shell">
            <header className="tap-contact__identity">
                <div style={{ width: imageSize, height: imageSize, flex: "0 0 auto", borderRadius: imageRadius, overflow: "hidden", background: `${theme.accent}18`, color: theme.accent, display: "grid", placeItems: "center", fontSize: isCompact ? 20 : 30, fontWeight: 750, border: `${profile.borderWidth}px solid ${profile.borderColor}`, boxShadow: profile.accentRing ? `0 0 0 4px ${theme.accent}35` : "none" }}>
                    {profileImage?.src ? <img src={profileImage.src} srcSet={profileImage.srcSet} alt={profileImage.alt || `${trim(fullName) || "Contact"} profile`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span aria-hidden="true">{initials(fullName)}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                    {trim(fullName) && <h2 style={{ margin: 0, fontSize: isCompact ? 21 : 28, lineHeight: 1.15, letterSpacing: "-0.025em", overflowWrap: "anywhere" }}>{trim(fullName)}</h2>}
                    {trim(role) && <p style={{ margin: "7px 0 0", fontSize: 15, lineHeight: 1.4, color: theme.muted, overflowWrap: "anywhere" }}>{trim(role)}</p>}
                    {trim(company) && <p style={{ margin: "2px 0 0", fontSize: 14, lineHeight: 1.4, color: theme.muted, opacity: .82, overflowWrap: "anywhere" }}>{trim(company)}</p>}
                </div>
            </header>
            <div className="tap-contact__content">
                {visibleBio && <p style={{ margin: 0, color: theme.muted, fontSize: 14, lineHeight: 1.55, textAlign: alignment }}>{trim(bio)}</p>}
                {visibleActions && <nav aria-label="Contact actions" className="tap-contact__actions">
                    {sections.actions && contactActions.map(([label, href]) => <a key={label} href={href} aria-label={`${label} ${trim(fullName) || "contact"}`} style={actionCss}>{actions.showIcons && <Icon size={actions.iconSize}>{actionIcons[label]}</Icon>}<span>{label}</span></a>)}
                    {sections.save && <button type="button" onClick={saveContact} disabled={!canSaveContact} aria-label={`Save ${trim(fullName) || "contact"} to contacts`} style={actionCss}>{actions.showIcons && <Icon size={actions.iconSize}>{actionIcons.Save}</Icon>}<span>Save Contact</span></button>}
                </nav>}
                {visibleAddress && <address style={{ margin: 0, fontStyle: "normal", fontSize: 13, lineHeight: 1.5, color: theme.muted, textAlign: alignment, overflowWrap: "anywhere" }}>{trim(address)}</address>}
                {visibleSocials && <nav aria-label="Social profiles" className="tap-contact__socials">{socials.map(([label, value]) => <a key={label} href={normalizeWebUrl(value)} target="_blank" rel="noopener noreferrer" title={label} aria-label={`Open ${trim(fullName) || "contact"} on ${label}`} style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", color: theme.text, border: `${theme.borderWidth || 1}px solid ${theme.border}`, textDecoration: "none" }}><Icon size={18}>{socialIcons[label]}</Icon></a>)}</nav>}
            </div>
        </div>
    </article>
}

addPropertyControls<TapContactProps>(TapContact, {
    profileImage: { type: ControlType.ResponsiveImage, title: "Profile Image" },
    fullName: { type: ControlType.String, title: "Full Name", defaultValue: "Jordan Lee" }, company: { type: ControlType.String, title: "Company", defaultValue: "Northline Studio" }, role: { type: ControlType.String, title: "Role", defaultValue: "Creative Director" }, bio: { type: ControlType.String, title: "Bio", defaultValue: "Helping thoughtful teams turn complex ideas into clear digital experiences.", displayTextArea: true },
    phone: { type: ControlType.String, title: "Phone", defaultValue: "+1 (555) 014-0182" }, email: { type: ControlType.String, title: "Email", defaultValue: "jordan@example.com" }, website: { type: ControlType.String, title: "Website", defaultValue: "example.com" }, address: { type: ControlType.String, title: "Address", defaultValue: "100 Market Street, Austin, TX 78701", displayTextArea: true }, vcardFilename: { type: ControlType.String, title: "vCard Filename", defaultValue: "jordan-lee" },
    instagram: { type: ControlType.String, title: "Instagram", defaultValue: "" }, facebook: { type: ControlType.String, title: "Facebook", defaultValue: "" }, linkedin: { type: ControlType.String, title: "LinkedIn", defaultValue: "https://www.linkedin.com/in/jordan-lee-example" }, twitter: { type: ControlType.String, title: "X / Twitter", defaultValue: "" }, tiktok: { type: ControlType.String, title: "TikTok", defaultValue: "" }, youtube: { type: ControlType.String, title: "YouTube", defaultValue: "" },
    layout: { type: ControlType.Enum, title: "Layout", options: ["profile", "compact", "horizontal"], optionTitles: ["Profile Card", "Compact", "Horizontal"], defaultValue: "profile", displaySegmentedControl: true },
    preset: { type: ControlType.Enum, title: "Preset", options: ["clean", "dark", "warm", "minimal", "elevated"], optionTitles: ["Clean", "Dark", "Warm", "Minimal", "Elevated"], defaultValue: "clean" },
    alignment: { type: ControlType.Enum, title: "Alignment", options: ["left", "center"], optionTitles: ["Left", "Center"], defaultValue: "center", displaySegmentedControl: true }, customizeCard: { type: ControlType.Boolean, title: "Custom Card", defaultValue: false },
    actions: { type: ControlType.Object, title: "Actions", buttonTitle: "Action Style", icon: "effect", controls: {
        style: { type: ControlType.Enum, title: "Style", options: ["filled", "outline", "minimal"], optionTitles: ["Filled", "Outline", "Minimal"], defaultValue: "minimal" }, background: { type: ControlType.Color, title: "Background", defaultValue: "#2457E6" }, text: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" }, border: { type: ControlType.Color, title: "Border", defaultValue: "#2457E6" }, borderWidth: { type: ControlType.Number, title: "Border Width", defaultValue: 1, min: 0, max: 4, step: 1, unit: "px" }, radius: { type: ControlType.Number, title: "Radius", defaultValue: 14, min: 0, max: 32, step: 1, unit: "px" }, gap: { type: ControlType.Number, title: "Gap", defaultValue: 10, min: 4, max: 24, step: 1, unit: "px" }, showIcons: { type: ControlType.Boolean, title: "Icons", defaultValue: true }, iconSize: { type: ControlType.Number, title: "Icon Size", defaultValue: 19, min: 14, max: 28, step: 1, unit: "px" },
    } },
    profile: { type: ControlType.Object, title: "Profile", buttonTitle: "Image Style", icon: "effect", controls: {
        shape: { type: ControlType.Enum, title: "Shape", options: ["circle", "rounded", "square"], optionTitles: ["Circle", "Rounded Square", "Square"], defaultValue: "circle" }, size: { type: ControlType.Number, title: "Size", defaultValue: 104, min: 48, max: 180, step: 2, unit: "px" }, radius: { type: ControlType.Number, title: "Image Radius", defaultValue: 20, min: 0, max: 64, step: 1, unit: "px" }, borderColor: { type: ControlType.Color, title: "Border", defaultValue: "#E4E7EC" }, borderWidth: { type: ControlType.Number, title: "Border Width", defaultValue: 1, min: 0, max: 6, step: 1, unit: "px" }, accentRing: { type: ControlType.Boolean, title: "Accent Ring", defaultValue: false },
    } },
    card: { type: ControlType.Object, title: "Card", buttonTitle: "Card Style", icon: "color", hidden: ({ customizeCard }) => !customizeCard, controls: {
        background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" }, text: { type: ControlType.Color, title: "Text", defaultValue: "#15171A" }, muted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#667085" }, accent: { type: ControlType.Color, title: "Accent", defaultValue: "#2457E6" }, border: { type: ControlType.Color, title: "Border", defaultValue: "#E4E7EC" }, borderWidth: { type: ControlType.Number, title: "Border Width", defaultValue: 1, min: 0, max: 6, step: 1, unit: "px" }, radius: { type: ControlType.Number, title: "Corner Radius", defaultValue: 24, min: 0, max: 64, step: 1, unit: "px" }, shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0 8px 30px rgba(16,24,40,.06)" }, padding: { type: ControlType.Number, title: "Padding", defaultValue: 28, min: 12, max: 56, step: 1, unit: "px" }, sectionGap: { type: ControlType.Number, title: "Section Gap", defaultValue: 18, min: 8, max: 40, step: 1, unit: "px" },
    } },
    sections: { type: ControlType.Object, title: "Sections", buttonTitle: "Visibility", icon: "boolean", controls: {
        bio: { type: ControlType.Boolean, title: "Bio", defaultValue: false }, address: { type: ControlType.Boolean, title: "Address", defaultValue: true }, socials: { type: ControlType.Boolean, title: "Social Links", defaultValue: true }, actions: { type: ControlType.Boolean, title: "Contact Actions", defaultValue: true }, save: { type: ControlType.Boolean, title: "Save Contact", defaultValue: true },
    } },
})

TapContact.displayName = "TapContact"
