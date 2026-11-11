// Copyright AL Webdesign Studio · https://alwebdesignstudio.com/
import * as React from "react";
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Photo = { src?: string; srcSet?: string; alt?: string };
type Entry = { label?: string; link?: string };
interface Props {
  landscapePhoto?: Photo;
  portraitPhoto?: Photo;
  landscapeAlt?: string;
  portraitAlt?: string;
  landscapeFocus?: number;
  portraitFocus?: number;
  brand?: string;
  items?: Entry[];
  brandFont?: React.CSSProperties;
  menuFont?: React.CSSProperties;
  glass?: string;
  foreground?: string;
  blur?: number;
  menuWidth?: number;
  previewOpen?: boolean;
  reducedMotion?: boolean;
  fullViewport?: boolean;
  showReload?: boolean;
  reloadLabel?: string;
  showLibrary?: boolean;
  libraryLink?: string;
  price?: string;
  navigationFont?: React.CSSProperties;
  style?: React.CSSProperties;
}
const LANDSCAPE: Photo = {
  src: "https://framerusercontent.com/images/vWx7BGzcWb8mXa2jGTJm6JYq0A.webp",
};
const PORTRAIT: Photo = {
  src: "https://framerusercontent.com/images/AO1wPE6yAh4RFVJPNMvkUOl1lM.webp",
};
const ENTRIES: Entry[] = [
  { label: "CUTE MOMENTS", link: "/components/fade-up-grid" },
  { label: "SOFT DREAMS", link: "/components/calm-carousel" },
  { label: "TINY DETAILS", link: "/components/annotation-lines" },
  { label: "SWEET SMILES", link: "/components/thread-slider" },
  { label: "THE LIBRARY", link: "/" },
];
const css = `
[data-al-pill]{container-type:size;container-name:al-pill}
[data-al-pill] *{box-sizing:border-box}
[data-al-pill] .al-pm-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none}
[data-al-pill] .al-pm-portrait{display:none}
[data-al-pill] .al-pm-nav{position:absolute;top:max(18px,env(safe-area-inset-top));bottom:max(var(--pm-nav-bottom),env(safe-area-inset-bottom));left:50%;max-width:calc(100% - 32px);display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-6px);transition:transform 800ms cubic-bezier(.2,.7,.2,1) 150ms;pointer-events:none;z-index:3}
[data-al-pill][data-loaded=true] .al-pm-nav{transform:translate(-50%,0)}
[data-al-pill] .al-pm-glass{background-color:transparent;border:1px solid transparent;backdrop-filter:blur(0px) saturate(100%);-webkit-backdrop-filter:blur(0px) saturate(100%);color:var(--pm-fg)}
[data-al-pill] .al-pm-head{display:inline-flex;align-items:center;gap:18px;padding:10px 14px 10px 20px;border-radius:999px;flex:none;max-width:var(--pm-head-width);pointer-events:auto;box-shadow:0 8px 30px transparent;transition:background-color 700ms ease-out 150ms,border-color 700ms ease-out 150ms,box-shadow 700ms ease-out 150ms,backdrop-filter 700ms ease-out 150ms,-webkit-backdrop-filter 700ms ease-out 150ms}
[data-al-pill][data-loaded=true] .al-pm-head{background-color:var(--pm-glass);border-color:rgba(255,255,255,.08);backdrop-filter:blur(var(--pm-blur)) saturate(140%);-webkit-backdrop-filter:blur(var(--pm-blur)) saturate(140%);box-shadow:0 8px 30px rgba(0,0,0,.24)}
[data-al-pill] .al-pm-head>*{opacity:0;transition:opacity 700ms ease-out 150ms}
[data-al-pill][data-loaded=true] .al-pm-head>*{opacity:1}
[data-al-pill] .al-pm-brand{font-size:var(--pm-brand-size);font-weight:500;letter-spacing:.02em;line-height:1.2;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;min-width:0}
[data-al-pill] .al-pm-toggle{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:32px;height:32px;flex:none;padding:6px;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
[data-al-pill] .al-pm-toggle::before{content:'';position:absolute;inset:-6px;border-radius:50%}
[data-al-pill] .al-pm-toggle:hover{background:rgba(255,255,255,.06)}
[data-al-pill] .al-pm-toggle:focus-visible{outline:1px solid var(--pm-fg);outline-offset:2px}
[data-al-pill] .al-pm-toggle span{display:block;width:16px;height:1.5px;flex:none;border-radius:2px;background:var(--pm-fg);transition:transform 220ms ease,opacity 90ms ease}
[data-al-pill][data-open=true] .al-pm-toggle span:nth-child(1){transform:translateY(5.5px) rotate(45deg)}
[data-al-pill][data-open=true] .al-pm-toggle span:nth-child(2){transform:scaleX(0);opacity:0;transition:transform 120ms ease,opacity 90ms ease}
[data-al-pill][data-open=true] .al-pm-toggle span:nth-child(3){transform:translateY(-5.5px) rotate(-45deg)}
[data-al-pill] .al-pm-panel{display:flex;flex-direction:column;flex:0 1 auto;min-height:0;width:100%;margin-top:10px;padding:8px;border-radius:18px;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.3) transparent;box-shadow:0 16px 40px transparent;transform:translateY(-6px) scale(.98);transform-origin:top center;visibility:hidden;pointer-events:none;transition:background-color 180ms ease,border-color 180ms ease,box-shadow 180ms ease,backdrop-filter 180ms ease,-webkit-backdrop-filter 180ms ease,transform 220ms cubic-bezier(.2,.7,.2,1),visibility 0s linear 220ms}
[data-al-pill][data-open=true] .al-pm-panel{background-color:var(--pm-glass);border-color:rgba(255,255,255,.08);backdrop-filter:blur(var(--pm-blur)) saturate(140%);-webkit-backdrop-filter:blur(var(--pm-blur)) saturate(140%);box-shadow:0 16px 40px rgba(0,0,0,.28);transform:translateY(0) scale(1);visibility:visible;pointer-events:auto;transition-delay:0s}
[data-al-pill] .al-pm-item{display:block;flex:none;padding:10px 14px;min-height:40px;border-radius:12px;opacity:0;color:var(--pm-fg);font-size:14px;font-weight:400;line-height:1.4;letter-spacing:.01em;text-decoration:none;overflow-wrap:anywhere;transition:background-color 140ms ease,opacity 180ms ease;touch-action:manipulation}
[data-al-pill][data-open=true] .al-pm-item{opacity:1}
[data-al-pill] .al-pm-item:hover,[data-al-pill] .al-pm-item:focus-visible{background:rgba(255,255,255,.10);outline:none}
[data-al-pill] .al-pm-item:focus-visible{text-decoration:underline;text-underline-offset:4px}
[data-al-pill] .al-pm-demo-control:focus-visible,[data-al-pill] .al-pm-library a:focus-visible{outline:2px solid #8A847B;outline-offset:3px}
@container al-pill (max-aspect-ratio:4/5){[data-al-pill] .al-pm-landscape{display:none}[data-al-pill] .al-pm-portrait{display:block}}
@container al-pill (max-width:540px){[data-al-pill] .al-pm-head{gap:12px;padding:9px 12px 9px 16px}[data-al-pill] .al-pm-brand{font-size:calc(var(--pm-brand-size)*.928571)}}
[data-al-pill][data-reduced=true] .al-pm-nav,[data-al-pill][data-reduced=true] .al-pm-head,[data-al-pill][data-reduced=true] .al-pm-head>*,[data-al-pill][data-reduced=true] .al-pm-panel,[data-al-pill][data-reduced=true] .al-pm-item,[data-al-pill][data-reduced=true] .al-pm-toggle span{transition-duration:1ms!important;transition-delay:0ms!important}
[data-al-pill][data-static=true] .al-pm-nav{pointer-events:none}
[data-al-pill][data-static=true] .al-pm-toggle,[data-al-pill][data-static=true] .al-pm-item{pointer-events:none;cursor:default}
@media(prefers-reduced-motion:reduce){[data-al-pill] .al-pm-nav,[data-al-pill] .al-pm-head,[data-al-pill] .al-pm-head>*,[data-al-pill] .al-pm-panel,[data-al-pill] .al-pm-item,[data-al-pill] .al-pm-toggle span{transition-duration:1ms!important;transition-delay:0ms!important}}
`;
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 */
export default function ALPillMenu(props: Props) {
  const {
    landscapePhoto = LANDSCAPE,
    portraitPhoto = PORTRAIT,
    landscapeAlt = "Awake newborn in a blue wrap in a fern-lined basket",
    portraitAlt = "Baby in a beige cardigan and knit hat on a cushion",
    landscapeFocus = 40,
    portraitFocus = 50,
    brand = "CUTE",
    items = ENTRIES,
    brandFont,
    menuFont,
    glass = "rgba(46,45,42,.72)",
    foreground = "#F5F3EF",
    blur = 18,
    menuWidth = 200,
    previewOpen = false,
    reducedMotion = false,
    fullViewport = true,
    showReload = true,
    reloadLabel = "Restart menu",
    showLibrary = false,
    libraryLink = "/",
    price = "Free",
    navigationFont,
    style,
  } = props;
  const isStatic = useIsStaticRenderer(),
    uid = React.useId(),
    [loaded, setLoaded] = React.useState(isStatic),
    [open, setOpen] = React.useState(false),
    [replay, setReplay] = React.useState(0);
  const host = React.useRef<HTMLElement>(null),
    nav = React.useRef<HTMLElement>(null),
    toggle = React.useRef<HTMLButtonElement>(null),
    panel = React.useRef<HTMLDivElement>(null),
    links = React.useRef<(HTMLAnchorElement | null)[]>([]),
    queuedFocus = React.useRef<number | null>(null);
  const shown = isStatic ? previewOpen : open,
    entries = items.filter((item) => item.label?.trim()).slice(0, 12);
  React.useEffect(() => {
    if (isStatic) return;
    setLoaded(false);
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setLoaded(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [isStatic, replay]);
  const close = React.useCallback((returnFocus = false) => {
    if (returnFocus || panel.current?.contains(document.activeElement))
      toggle.current?.focus({ preventScroll: true });
    queuedFocus.current = null;
    setOpen(false);
  }, []);
  React.useEffect(() => {
    if (!open || isStatic) return;
    const outside = (e: PointerEvent) => {
      if (e.target instanceof Node && !nav.current?.contains(e.target)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
    };
  }, [open, isStatic, close]);
  React.useEffect(() => {
    if (!open || queuedFocus.current === null) return;
    links.current[queuedFocus.current]?.focus({ preventScroll: true });
    queuedFocus.current = null;
  }, [open]);
  const keyboard = (e: React.KeyboardEvent) => {
    if (isStatic) return;
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      close(true);
      return;
    }
    const total = entries.length;
    if (!total) return;
    const at = links.current.findIndex(
      (link) => link === document.activeElement,
    );
    let next: number | null = null;
    if (e.key === "ArrowDown") next = (at + 1) % total;
    else if (e.key === "ArrowUp")
      next = at < 0 ? total - 1 : (at - 1 + total) % total;
    else if (at >= 0 && e.key === "Home") next = 0;
    else if (at >= 0 && e.key === "End") next = total - 1;
    if (next !== null) {
      e.preventDefault();
      if (open) links.current[next]?.focus();
      else {
        queuedFocus.current = next;
        setOpen(true);
      }
    }
  };
  const restart = () => {
    close();
    setReplay((n) => n + 1);
  };
  const { fontSize: brandSize = "14px", ...brandStyle } = brandFont || {};
  const vars = {
    "--pm-nav-bottom": showLibrary && !isStatic ? "76px" : "18px",
    "--pm-glass": glass,
    "--pm-fg": foreground,
    "--pm-blur": `${Math.max(0, Math.min(40, blur))}px`,
    "--pm-brand-size":
      typeof brandSize === "number" ? `${brandSize}px` : brandSize,
    "--pm-head-width": showReload && !isStatic
      ? "max(100px,calc(100cqw - 192px))"
      : "calc(100cqw - 32px)",
  } as React.CSSProperties;
  const pill: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,.92)",
    color: "#62615E",
    border: "1px solid rgba(0,0,0,.13)",
    borderRadius: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    fontFamily: "Inter,Arial,sans-serif",
  };
  return (
    <section
      ref={host}
      data-al-pill=""
      data-loaded={isStatic || loaded}
      data-static={isStatic}
      data-open={shown}
      data-reduced={reducedMotion || isStatic}
      data-al-demo-viewport={
        fullViewport && showLibrary && !isStatic ? "true" : undefined
      }
      aria-label={`${brand || "Navigation"} · Pill Menu`}
      style={{
        ...style,
        ...vars,
        position: "relative",
        width: style?.width || "100%",
        height: isStatic
          ? style?.height || 900
          : fullViewport
            ? "100dvh"
            : style?.height || "100%",
        minHeight: 180,
        overflow: "clip",
        isolation: "isolate",
        background: "#D8D6D1",
        fontFamily: "Inter,Arial,sans-serif",
        WebkitTapHighlightColor: "transparent",
        overscrollBehavior: "none",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <img
        className="al-pm-photo al-pm-landscape"
        src={landscapePhoto.src}
        srcSet={landscapePhoto.srcSet}
        sizes="100vw"
        alt={landscapeAlt || landscapePhoto.alt || ""}
        draggable={false}
        style={{ objectPosition: `50% ${landscapeFocus}%` }}
      />
      <img
        className="al-pm-photo al-pm-portrait"
        src={portraitPhoto.src || landscapePhoto.src}
        srcSet={portraitPhoto.srcSet}
        sizes="100vw"
        alt={portraitAlt || portraitPhoto.alt || ""}
        draggable={false}
        style={{ objectPosition: `50% ${portraitFocus}%` }}
      />
      <nav
        ref={nav}
        className="al-pm-nav"
        aria-label="Main navigation"
        style={{ width: Math.max(160, Math.min(480, menuWidth)) }}
        onKeyDown={keyboard}
        onBlurCapture={(e) => {
          if (
            !isStatic &&
            (!(e.relatedTarget instanceof Node) ||
              !e.currentTarget.contains(e.relatedTarget))
          )
            setOpen(false);
        }}
      >
        <div className="al-pm-head al-pm-glass">
          <span className="al-pm-brand" style={brandStyle}>
            {brand}
          </span>
          <button
            ref={toggle}
            className="al-pm-toggle"
            type="button"
            aria-label={shown ? "Close menu" : "Open menu"}
            disabled={isStatic}
            tabIndex={isStatic ? -1 : 0}
            aria-expanded={shown}
            aria-controls={`${uid}-menu`}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div
          ref={panel}
          id={`${uid}-menu`}
          className="al-pm-panel al-pm-glass"
          aria-hidden={!shown}
        >
          {entries.map((item, i) => (
            <a
              key={i}
              ref={(el) => {
                links.current[i] = el;
              }}
              href={isStatic ? undefined : item.link || undefined}
              role={item.link ? undefined : "button"}
              tabIndex={!isStatic && shown ? 0 : -1}
              className="al-pm-item"
              style={menuFont}
              onClick={(e) => {
                if (!item.link) e.preventDefault();
                close();
              }}
              onKeyDown={(e) => {
                if (!item.link && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  close(true);
                }
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
      {showReload && !isStatic && (
        <button
          type="button"
          aria-label={reloadLabel}
          title={reloadLabel}
          className="al-pm-demo-control"
          onClick={() => restart()}
          style={{
            ...pill,
            position: "absolute",
            right: 16,
            top: "max(16px,env(safe-area-inset-top))",
            width: 68,
            height: 44,
            padding: 0,
            cursor: "pointer",
            zIndex: 5,
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient
                id={`${uid}-reload-top`}
                x1="24"
                y1="8"
                x2="24"
                y2="37"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="currentColor" />
                <stop offset=".38" stopColor="currentColor" stopOpacity=".94" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id={`${uid}-reload-bottom`}
                x1="24"
                y1="40"
                x2="24"
                y2="11"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="currentColor" />
                <stop offset=".38" stopColor="currentColor" stopOpacity=".94" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M27 8.3A16 16 0 0 1 35.3 35.3"
              stroke={`url(#${uid}-reload-top)`}
              strokeWidth="4.5"
            />
            <path
              d="M21 39.7A16 16 0 0 1 12.7 12.7"
              stroke={`url(#${uid}-reload-bottom)`}
              strokeWidth="4.5"
            />
            <path
              d="M18 8.3 28 2.3v12Z M30 39.7 20 45.7v-12Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
      {showLibrary && !isStatic && (
        <nav
          className="al-pm-library"
          aria-label="Library"
          style={{
            ...pill,
            position: "absolute",
            left: 20,
            bottom: "max(20px,env(safe-area-inset-bottom))",
            height: 38,
            padding: "0 16px",
            gap: 14,
            border: 0,
            zIndex: 5,
            fontSize: 14,
            ...navigationFont,
          }}
        >
          <a
            href={libraryLink || "/"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m15 5-7 7 7 7" />
            </svg>
            Library
          </a>
          <span style={{ fontWeight: 600 }}>{price}</span>
        </nav>
      )}
    </section>
  );
}
addPropertyControls(ALPillMenu, {
  landscapePhoto: {
    type: ControlType.ResponsiveImage,
    title: "Landscape Photo",
  },
  portraitPhoto: { type: ControlType.ResponsiveImage, title: "Portrait Photo" },
  landscapeAlt: {
    type: ControlType.String,
    title: "Landscape Alt",
    defaultValue: "Awake newborn in a blue wrap in a fern-lined basket",
  },
  portraitAlt: {
    type: ControlType.String,
    title: "Portrait Alt",
    defaultValue: "Baby in a beige cardigan and knit hat on a cushion",
  },
  landscapeFocus: {
    type: ControlType.Number,
    title: "Landscape Focus Y",
    defaultValue: 40,
    min: 0,
    max: 100,
    unit: "%",
  },
  portraitFocus: {
    type: ControlType.Number,
    title: "Portrait Focus Y",
    defaultValue: 50,
    min: 0,
    max: 100,
    unit: "%",
  },
  brand: { type: ControlType.String, title: "Brand", defaultValue: "CUTE" },
  items: {
    type: ControlType.Array,
    title: "Menu Items",
    maxCount: 12,
    defaultValue: ENTRIES,
    control: {
      type: ControlType.Object,
      controls: {
        label: { type: ControlType.String, title: "Label" },
        link: { type: ControlType.Link, title: "Link" },
      },
    },
  },
  brandFont: {
    type: ControlType.Font,
    title: "Brand Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: { fontSize: "14px", lineHeight: "1.2em" },
  },
  menuFont: {
    type: ControlType.Font,
    title: "Menu Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: { fontSize: "14px", lineHeight: "1.4em" },
  },
  glass: {
    type: ControlType.Color,
    title: "Glass Tint",
    defaultValue: "rgba(46,45,42,.72)",
  },
  foreground: {
    type: ControlType.Color,
    title: "Text Color",
    defaultValue: "#F5F3EF",
  },
  blur: {
    type: ControlType.Number,
    title: "Glass Blur",
    defaultValue: 18,
    min: 0,
    max: 40,
    unit: "px",
  },
  menuWidth: {
    type: ControlType.Number,
    title: "Menu Width",
    defaultValue: 200,
    min: 160,
    max: 480,
    unit: "px",
  },
  previewOpen: {
    type: ControlType.Boolean,
    title: "Canvas Menu Open",
    defaultValue: false,
  },
  reducedMotion: {
    type: ControlType.Boolean,
    title: "Reduce Motion",
    defaultValue: false,
  },
  fullViewport: {
    type: ControlType.Boolean,
    title: "Full Viewport",
    defaultValue: true,
  },
  showReload: {
    type: ControlType.Boolean,
    title: "Reload",
    defaultValue: true,
  },
  reloadLabel: {
    type: ControlType.String,
    title: "Reload Label",
    defaultValue: "Restart menu",
  },
  showLibrary: {
    type: ControlType.Boolean,
    title: "Demo Navigation",
    defaultValue: false,
  },
  libraryLink: {
    type: ControlType.Link,
    title: "Library Link",
    hidden: (p) => !p.showLibrary,
  },
  price: {
    type: ControlType.String,
    title: "Demo Price",
    defaultValue: "Free",
    hidden: (p) => !p.showLibrary,
  },
  navigationFont: {
    type: ControlType.Font,
    title: "Navigation Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: { fontSize: "14px", lineHeight: "1.2em" },
    hidden: (p) => !p.showLibrary,
  },
});
