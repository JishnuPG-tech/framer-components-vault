// trafft-booking-component-version:1.0.0+adeed30a02b1
var __trafftBookingLib = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/code/__trafftLibEntry.ts
  var trafftLibEntry_exports = {};
  __export(trafftLibEntry_exports, {
    computeClientBookingEmbed: () => computeClientBookingEmbed,
    computeEmbedShrinkScrollY: () => computeEmbedShrinkScrollY,
    parseTrafftMessage: () => parseTrafftMessage,
    resolveEmbedLayoutMode: () => resolveEmbedLayoutMode,
    shouldHandleTrafftMessage: () => shouldHandleTrafftMessage,
    validateBookingUrl: () => validateBookingUrl
  });

  // src/lib/buildBookingEmbedUrl.ts
  function buildEmbedSearchParams(options) {
    const {
      autoResize,
      showSidebar,
      autoScroll,
      parentOrigin,
      lang
    } = options;
    const params = new URLSearchParams();
    params.set("autoResize", autoResize ? "1" : "0");
    params.set("showSidebar", showSidebar ? "1" : "0");
    const autoScrollValue = parentOrigin ? autoScroll ? "1" : "0" : "0";
    params.set("autoScroll", autoScrollValue);
    if (parentOrigin) {
      params.set("parentOrigin", parentOrigin);
    }
    const langValue = lang?.trim();
    if (langValue) {
      params.set("lang", langValue);
    }
    return params;
  }
  function buildBookingEmbedUrl(options) {
    const { bookingOrigin, showServices, employee } = options;
    const params = buildEmbedSearchParams(options);
    const employeeSlug = employee?.trim();
    const employeePath = employeeSlug ? `/e/${encodeURIComponent(employeeSlug)}` : "";
    const path = showServices ? `${bookingOrigin}/services-embed` : `${bookingOrigin}/booking-embed${employeePath}`;
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  // src/lib/clientBookingEmbed.ts
  function resolveParentOrigin() {
    if (typeof window === "undefined") {
      return null;
    }
    const origin = window.location.origin;
    if (!origin || origin === "null") {
      return null;
    }
    return origin;
  }
  function computeClientBookingEmbed(params) {
    const parentOrigin = resolveParentOrigin();
    if (!parentOrigin) {
      return null;
    }
    const effectiveAutoScroll = params.autoScroll;
    const src = buildBookingEmbedUrl({
      bookingOrigin: params.bookingOrigin,
      autoResize: params.embedAutoResize,
      showSidebar: params.showSidebar,
      autoScroll: effectiveAutoScroll,
      showServices: params.showServices,
      lang: params.lang.trim() ? params.lang : void 0,
      employee: params.employee,
      parentOrigin
    });
    return { src, effectiveAutoScroll, parentOrigin };
  }

  // src/lib/embedShrinkScroll.ts
  function computeEmbedShrinkScrollY(scrollY, iframeViewportTop, heightDelta) {
    if (heightDelta >= 0) {
      return null;
    }
    if (iframeViewportTop >= 0) {
      return null;
    }
    const hiddenAboveViewport = -iframeViewportTop;
    const shrinkBy = -heightDelta;
    const scrollUp = Math.min(shrinkBy, hiddenAboveViewport);
    if (scrollUp <= 0) {
      return null;
    }
    return scrollY - scrollUp;
  }

  // src/lib/embedLayout.ts
  function resolveEmbedLayoutMode(style) {
    if (!style) {
      return "auto";
    }
    const height = style.height;
    if (height == null || height === "auto" || height === "fit-content") {
      return "auto";
    }
    if (typeof height === "number" && Number.isFinite(height) && height > 0) {
      return "fixed";
    }
    if (typeof height === "string") {
      const trimmed = height.trim();
      if (trimmed === "100%" || /^[\d.]+px$/.test(trimmed)) {
        return "fixed";
      }
    }
    return "auto";
  }

  // src/lib/trafftMessages.ts
  var MAX_REPORTED_EMBED_HEIGHT_PX = 1e4;
  function shouldHandleTrafftMessage(ctx) {
    if (!ctx.iframeContentWindow || ctx.eventSource !== ctx.iframeContentWindow) {
      return false;
    }
    if (ctx.eventOrigin !== ctx.expectedBookingOrigin) {
      return false;
    }
    return true;
  }
  function parseTrafftMessage(data) {
    if (!data || typeof data !== "object") {
      return null;
    }
    const record = data;
    if (record.type === "trafft-scroll-to-embed") {
      return { type: "scroll-to-embed" };
    }
    if (record.height == null) {
      return null;
    }
    const height = Number(record.height);
    if (!Number.isFinite(height) || height <= 0) {
      return null;
    }
    if (height > MAX_REPORTED_EMBED_HEIGHT_PX) {
      return null;
    }
    return { type: "resize", height };
  }

  // src/lib/normalizeBookingUrlInput.ts
  function stripTrailingDotFromHostname(hostname) {
    if (hostname.endsWith(".")) {
      return hostname.slice(0, -1);
    }
    return hostname;
  }
  function normalizeBookingUrlInput(input) {
    return input.trim();
  }

  // src/lib/trafftReservedSubdomains.ts
  var RESERVED_TRAFFT_SUBDOMAINS = [
    "www",
    "api",
    "app",
    "help",
    "support",
    "docs",
    "signup",
    "cdn",
    "mail",
    "status"
  ];
  var RESERVED_TRAFFT_SUBDOMAIN_SET = new Set(
    RESERVED_TRAFFT_SUBDOMAINS.map((s) => s.toLowerCase())
  );

  // src/lib/validateBookingUrl.ts
  var TRAFFT_TENANT_HOST_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.trafft\.com$/i;
  function validateBookingUrl(input) {
    const trimmed = normalizeBookingUrlInput(input);
    if (!trimmed) {
      return { ok: false, error: "Enter your Trafft booking URL." };
    }
    let parsed;
    try {
      parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    } catch {
      return {
        ok: false,
        error: "Enter a valid URL (for example https://yourbusiness.trafft.com)."
      };
    }
    if (parsed.protocol !== "https:") {
      return {
        ok: false,
        error: "Booking URL must use HTTPS (https://yourbusiness.trafft.com)."
      };
    }
    if (parsed.port && parsed.port !== "443") {
      return {
        ok: false,
        error: "Remove the port from the URL (use https://yourbusiness.trafft.com)."
      };
    }
    const hostname = stripTrailingDotFromHostname(parsed.hostname.toLowerCase());
    if (hostname.endsWith(".admin.trafft.com")) {
      return {
        ok: false,
        error: "Use your public booking URL (https://yourbusiness.trafft.com), not the admin URL."
      };
    }
    if (!TRAFFT_TENANT_HOST_PATTERN.test(hostname)) {
      return {
        ok: false,
        error: "Use your Trafft booking site URL (*.trafft.com), not a custom domain."
      };
    }
    const subdomain = hostname.split(".")[0];
    if (RESERVED_TRAFFT_SUBDOMAIN_SET.has(subdomain)) {
      return {
        ok: false,
        error: "Use your tenant booking URL (for example https://yourbusiness.trafft.com)."
      };
    }
    const origin = `https://${hostname}`;
    return { ok: true, origin, hostname };
  }
  return __toCommonJS(trafftLibEntry_exports);
})();

const { computeClientBookingEmbed, computeEmbedShrinkScrollY, resolveEmbedLayoutMode, parseTrafftMessage, shouldHandleTrafftMessage, validateBookingUrl } = __trafftBookingLib;
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};







const PLACEHOLDER_HEIGHT_PX = 400
const DEFAULT_FALLBACK_HEIGHT_PX = 768

export type TrafftBookingProps = {
  bookingUrl: string
  lang: string
  showSidebar: boolean
  autoScroll: boolean
  showServices: boolean
  employee: string
  autoResize: boolean
  fallbackHeight: number
  scrollOffset: number
  style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function TrafftBooking(props: TrafftBookingProps) {
  const {
    bookingUrl,
    lang,
    showSidebar,
    autoScroll,
    showServices,
    employee,
    autoResize,
    fallbackHeight,
    scrollOffset,
    style,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  /** Matches embed.js: re-scroll briefly after `trafft-scroll-to-embed` during height races. */
  const scrollToEmbedUntilRef = useRef(0)

  const [hasClientMounted, setHasClientMounted] = useState(false)
  const [clientEmbed, setClientEmbed] = useState<ClientBookingEmbedState | null>(
    null,
  )

  const layoutMode = resolveEmbedLayoutMode(style)
  const effectiveAutoScroll = clientEmbed?.effectiveAutoScroll ?? false

  const urlValidation = useMemo(
    () => validateBookingUrl(bookingUrl),
    [bookingUrl],
  )

  const bookingOrigin = urlValidation.ok ? urlValidation.origin : ""

  const embedAutoResize = layoutMode === "auto" && autoResize

  useEffect(() => {
    setHasClientMounted(true)
  }, [])

  useEffect(() => {
    if (!hasClientMounted || !bookingOrigin) {
      setClientEmbed(null)
      return
    }

    setClientEmbed(
      computeClientBookingEmbed({
        bookingOrigin,
        embedAutoResize,
        showSidebar,
        autoScroll,
        showServices,
        lang,
        employee,
      }),
    )
  }, [
    hasClientMounted,
    bookingOrigin,
    embedAutoResize,
    showSidebar,
    autoScroll,
    showServices,
    lang,
    employee,
  ])

  const iframeSrc = clientEmbed?.src ?? ""

  const [iframeHeight, setIframeHeight] = useState(PLACEHOLDER_HEIGHT_PX)

  useEffect(() => {
    if (layoutMode === "fixed") {
      return
    }
    if (!embedAutoResize) {
      setIframeHeight(
        Math.max(PLACEHOLDER_HEIGHT_PX, fallbackHeight || DEFAULT_FALLBACK_HEIGHT_PX),
      )
    } else {
      setIframeHeight(PLACEHOLDER_HEIGHT_PX)
    }
  }, [layoutMode, embedAutoResize, fallbackHeight, bookingOrigin])

  const scrollEmbedToTop = useCallback(() => {
    const target = containerRef.current
    if (!target || typeof window === "undefined" || !effectiveAutoScroll) {
      return
    }

    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0
    const offset = Math.max(margin, scrollOffset)
    const top = window.scrollY + target.getBoundingClientRect().top - offset
    window.scrollTo({ top: Math.max(0, top), left: 0, behavior: "auto" })
  }, [effectiveAutoScroll, scrollOffset])

  useEffect(() => {
    if (!iframeSrc || !bookingOrigin) {
      return
    }

    const onMessage = (event: MessageEvent) => {
      const iframeWindow = iframeRef.current?.contentWindow ?? null
      if (
        !shouldHandleTrafftMessage({
          eventOrigin: event.origin,
          expectedBookingOrigin: bookingOrigin,
          iframeContentWindow: iframeWindow,
          eventSource: event.source,
        })
      ) {
        return
      }

      const message = parseTrafftMessage(event.data)
      if (!message) {
        return
      }

      if (message.type === "scroll-to-embed") {
        if (effectiveAutoScroll) {
          scrollToEmbedUntilRef.current = Date.now() + 1000
          scrollEmbedToTop()
        }
        return
      }

      if (layoutMode !== "auto" || !embedAutoResize) {
        return
      }

      const iframe = iframeRef.current
      const previousHeight = iframe?.offsetHeight ?? message.height
      const nextHeight = message.height
      setIframeHeight(nextHeight)

      // embed.js: after trafft-scroll-to-embed, re-scroll once on resize during the window.
      if (effectiveAutoScroll && Date.now() < scrollToEmbedUntilRef.current) {
        requestAnimationFrame(scrollEmbedToTop)
        return
      }

      if (effectiveAutoScroll) {
        return
      }

      // embed.js (autoScroll off): anchor scroll when shrinking clips the iframe top.
      const heightDelta = nextHeight - previousHeight
      if (heightDelta >= 0 || !iframe || typeof window === "undefined") {
        return
      }

      const iframeViewportTop = iframe.getBoundingClientRect().top
      const nextScrollY = computeEmbedShrinkScrollY(
        window.scrollY,
        iframeViewportTop,
        heightDelta,
      )
      if (nextScrollY != null) {
        window.scrollTo(0, nextScrollY)
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [
    iframeSrc,
    bookingOrigin,
    layoutMode,
    embedAutoResize,
    effectiveAutoScroll,
    scrollEmbedToTop,
  ])

  const messageStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: PLACEHOLDER_HEIGHT_PX,
    padding: 24,
    border: "1px dashed rgba(128,128,128,0.45)",
    color: "rgba(100,100,100,0.95)",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 1.45,
    fontFamily: "Inter, system-ui, sans-serif",
  }

  if (!bookingUrl.trim()) {
    return (
      <div ref={containerRef} style={{ width: "100%", ...style }}>
        <div style={messageStyle}>
          Paste your Trafft booking URL in the plugin, then click Insert booking
          form.
        </div>
      </div>
    )
  }

  if (!urlValidation.ok) {
    return (
      <div ref={containerRef} style={{ width: "100%", ...style }}>
        <div style={messageStyle}>{urlValidation.error}</div>
      </div>
    )
  }

  const showIframe = hasClientMounted && Boolean(iframeSrc)

  if (layoutMode === "fixed") {
    return (
      <div
        ref={containerRef}
        style={{
          ...style,
          width: "100%",
          height: "100%",
          overflow: "auto",
        }}
      >
        {showIframe ? (
          <iframe
            ref={iframeRef}
            title="Trafft booking"
            src={iframeSrc}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            }}
            allow="payment"
          />
        ) : null}
      </div>
    )
  }

  const autoHeight = embedAutoResize
    ? iframeHeight
    : Math.max(PLACEHOLDER_HEIGHT_PX, fallbackHeight || DEFAULT_FALLBACK_HEIGHT_PX)

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        width: "100%",
        height: autoHeight,
        overflow: "hidden",
      }}
    >
      {showIframe ? (
        <iframe
          ref={iframeRef}
          title="Trafft booking"
          src={iframeSrc}
          height={autoHeight}
          style={{
            width: "100%",
            height: autoHeight,
            border: "none",
            display: "block",
          }}
          allow="payment"
        />
      ) : null}
    </div>
  )
}

addPropertyControls(TrafftBooking, {
  bookingUrl: {
    type: ControlType.String,
    title: "Booking URL",
    defaultValue: "",
    placeholder: "https://yourbusiness.trafft.com",
  },
  lang: {
    type: ControlType.Enum,
    title: "Language",
    defaultValue: "",
    options: ["", "en", "de", "fr", "es", "it", "pt", "nl"],
    optionTitles: [
      "Tenant default",
      "English",
      "German",
      "French",
      "Spanish",
      "Italian",
      "Portuguese",
      "Dutch",
    ],
  },
  showSidebar: {
    type: ControlType.Boolean,
    title: "Sidebar",
    defaultValue: true,
  },
  autoScroll: {
    type: ControlType.Boolean,
    title: "Auto Scroll",
    defaultValue: true,
  },
  showServices: {
    type: ControlType.Boolean,
    title: "Service Picker",
    defaultValue: false,
  },
  employee: {
    type: ControlType.String,
    title: "Employee ID",
    defaultValue: "",
  },
  autoResize: {
    type: ControlType.Boolean,
    title: "Auto Height",
    defaultValue: true,
  },
  fallbackHeight: {
    type: ControlType.Number,
    title: "Fixed Height",
    defaultValue: DEFAULT_FALLBACK_HEIGHT_PX,
    min: PLACEHOLDER_HEIGHT_PX,
    max: 4000,
    step: 1,
    hidden: (props) => Boolean(props.autoResize),
  },
  scrollOffset: {
    type: ControlType.Number,
    title: "Scroll Offset",
    defaultValue: 0,
    min: 0,
    max: 200,
    step: 1,
    unit: "px",
    description: "Extra offset when scrolling to the embed (sticky headers).",
  },
})
