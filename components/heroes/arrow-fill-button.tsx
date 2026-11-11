import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const DEFAULT_HREF = "#";
const COMPACT_LAYOUT_BREAKPOINT = 1280;
const STYLE_ID = "hpx-arrow-fill-button-styles";

const CSS = `
.hpx-afb {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 4.2vw;
  width: fit-content;
  min-width: fit-content;
  max-width: none;
  cursor: pointer;
  overflow: hidden;
  border-radius: 9999px;
  padding: 0 3vw;
  padding-right: calc(var(--icon-circle) + var(--icon-right) + 2vw);
  white-space: nowrap;
  font-weight: 500;
  font-size: 1.1vw;
  line-height: 1;
  text-rendering: geometricPrecision;
  text-decoration: none;
  --icon-circle: 3.1vw;
  --icon-right: 0.55vw;
  --circle-inset-y: calc((100% - var(--icon-circle)) / 2);
  background-color: var(--btn-bg);
  color: var(--btn-text);
}
@media (max-width: 1025px) {
  .hpx-afb {
    height: 11vw;
    padding: 0 5vw;
    padding-right: calc(var(--icon-circle) + var(--icon-right) + 4vw);
    font-size: 3vw;
    font-weight: 400;
    --icon-circle: 8vw;
    --icon-right: 1.5vw;
  }
}
@media (max-width: 767.98px) {
  .hpx-afb {
    height: 15vw;
    padding: 0 7vw;
    padding-right: calc(var(--icon-circle) + var(--icon-right) + 5vw);
    font-size: 4.2vw;
    --icon-circle: 11vw;
    --icon-right: 2vw;
  }
}

.hpx-afb__label {
  position: relative;
  z-index: 1;
  padding-bottom: 1px;
}

.hpx-afb__circle {
  pointer-events: none;
  position: absolute;
  z-index: 2;
  border-radius: 9999px;
  background-color: var(--btn-fill-bg);
  top: var(--circle-inset-y);
  bottom: var(--circle-inset-y);
  right: var(--icon-right);
  left: calc(100% - var(--icon-right) - var(--icon-circle));
  transition: background-color var(--btn-duration) cubic-bezier(0.785, 0.135, 0.15, 0.86),
    inset var(--btn-duration) cubic-bezier(0.785, 0.135, 0.15, 0.86);
}
.hpx-afb:not([data-fill-disabled="true"]):hover .hpx-afb__circle,
.hpx-afb:not([data-fill-disabled="true"])[data-pressed="true"] .hpx-afb__circle {
  background-color: var(--btn-fill-bg-hover);
  inset: 0;
}

.hpx-afb__mask {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 0 3vw;
  padding-right: calc(var(--icon-circle) + var(--icon-right) + 2vw);
  color: var(--btn-fill-text);
  clip-path: inset(var(--circle-inset-y) var(--icon-right) var(--circle-inset-y) calc(100% - var(--icon-right) - var(--icon-circle)));
  transition: color var(--btn-duration) cubic-bezier(0.785, 0.135, 0.15, 0.86),
    clip-path var(--btn-duration) cubic-bezier(0.785, 0.135, 0.15, 0.86);
}
@media (max-width: 1025px) {
  .hpx-afb__mask {
    padding: 0 5vw;
    padding-right: calc(var(--icon-circle) + var(--icon-right) + 4vw);
  }
}
@media (max-width: 767.98px) {
  .hpx-afb__mask {
    padding: 0 7vw;
    padding-right: calc(var(--icon-circle) + var(--icon-right) + 5vw);
  }
}
.hpx-afb:not([data-fill-disabled="true"]):hover .hpx-afb__mask,
.hpx-afb:not([data-fill-disabled="true"])[data-pressed="true"] .hpx-afb__mask {
  color: var(--btn-fill-text-hover);
  clip-path: inset(0 0 0 0);
}

.hpx-afb__mask-label {
  position: relative;
  z-index: 1;
  padding-bottom: 1px;
  white-space: nowrap;
}

.hpx-afb__icon {
  pointer-events: none;
  position: absolute;
  right: var(--icon-right);
  top: 50%;
  z-index: 3;
  display: inline-flex;
  height: var(--icon-circle);
  width: var(--icon-circle);
  flex-shrink: 0;
  transform: translateY(-50%);
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  background-color: var(--btn-fill-bg);
  color: var(--btn-arrow);
  -webkit-mask-image: -webkit-radial-gradient(white, black);
  mask-image: radial-gradient(white, black);
  transition: background-color var(--btn-duration) cubic-bezier(0.785, 0.135, 0.15, 0.86),
    color var(--btn-duration) cubic-bezier(0.785, 0.135, 0.15, 0.86);
}
.hpx-afb:not([data-fill-disabled="true"]):hover .hpx-afb__icon,
.hpx-afb:not([data-fill-disabled="true"])[data-pressed="true"] .hpx-afb__icon {
  background-color: var(--btn-fill-bg-hover);
  color: var(--btn-arrow-hover);
}

.hpx-afb__icon-svg {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1.5vw;
  height: 1.5vw;
  transform-origin: center;
  color: currentColor;
  transition: transform var(--btn-duration) cubic-bezier(0.785, 0.135, 0.15, 0.86);
}
@media (max-width: 1025px) {
  .hpx-afb__icon-svg { width: 4vw; height: 4vw; }
}
@media (max-width: 767.98px) {
  .hpx-afb__icon-svg { width: 5vw; height: 5vw; }
}

.hpx-afb__icon-svg--enter { transform: translate(-170%, -50%) scale(0); }
.hpx-afb:not([data-fill-disabled="true"]):hover .hpx-afb__icon-svg--enter,
.hpx-afb:not([data-fill-disabled="true"])[data-pressed="true"] .hpx-afb__icon-svg--enter {
  transform: translate(-50%, -50%) scale(1);
}

.hpx-afb__icon-svg--exit { transform: translate(-50%, -50%) scale(1); }
.hpx-afb:not([data-fill-disabled="true"]):hover .hpx-afb__icon-svg--exit,
.hpx-afb:not([data-fill-disabled="true"])[data-pressed="true"] .hpx-afb__icon-svg--exit {
  transform: translate(70%, -50%) scale(0);
}

.hpx-afb[data-static="true"] .hpx-afb__circle,
.hpx-afb[data-static="true"] .hpx-afb__mask,
.hpx-afb[data-static="true"] .hpx-afb__icon,
.hpx-afb[data-static="true"] .hpx-afb__icon-svg {
  transition: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .hpx-afb__circle,
  .hpx-afb__mask,
  .hpx-afb__icon,
  .hpx-afb__icon-svg {
    transition: none !important;
  }
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  if (styleEl.textContent !== CSS) {
    styleEl.textContent = CSS;
  }
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export type ArrowFillButtonProps = {
  btnText?: string;
  href?: string;
  newTab?: boolean;
  bgColor?: string;
  textColor?: string;
  fillBgColor?: string;
  fillTextColor?: string;
  hoverFillBgColor?: string;
  hoverFillTextColor?: string;
  arrowColor?: string;
  hoverArrowColor?: string;
  animationDuration?: number;
  fillOnHover?: boolean;
  style?: CSSProperties;
};

/**
 * A pill button whose fill circle expands to cover the label on hover, with a swapping arrow icon.
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 56
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ArrowFillButton({
  btnText = "Hover Me",
  href = DEFAULT_HREF,
  newTab = false,
  bgColor = "#ff5f00",
  textColor = "#ffffff",
  fillBgColor = "#ffffff",
  fillTextColor = "#ff5f00",
  hoverFillBgColor = "#ffffff",
  hoverFillTextColor = "#ff5f00",
  arrowColor,
  hoverArrowColor,
  animationDuration = 450,
  fillOnHover = true,
  style,
}: ArrowFillButtonProps): ReactNode {
  const isStatic = useIsStaticRenderer();
  const [isReady, setIsReady] = useState(isStatic);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const releaseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    injectStyles();

    if (isStatic) {
      setIsReady(true);
      return;
    }

    const frame = window.requestAnimationFrame(() => setIsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isStatic]);

  useEffect(() => {
    if (isStatic || typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(
      `(max-width: ${COMPACT_LAYOUT_BREAKPOINT - 1}px)`
    );

    const syncCompactLayout = (event: MediaQueryList | MediaQueryListEvent) => {
      const matches = "matches" in event ? event.matches : false;
      setIsCompactLayout(matches);
      if (!matches) setIsPressed(false);
    };

    syncCompactLayout(mediaQuery);
    mediaQuery.addEventListener("change", syncCompactLayout);
    return () => mediaQuery.removeEventListener("change", syncCompactLayout);
  }, [isStatic]);

  useEffect(() => {
    return () => {
      if (releaseTimeoutRef.current) {
        window.clearTimeout(releaseTimeoutRef.current);
      }
    };
  }, []);

  const clearPressedState = () => {
    if (releaseTimeoutRef.current) {
      window.clearTimeout(releaseTimeoutRef.current);
    }
    releaseTimeoutRef.current = window.setTimeout(() => {
      setIsPressed(false);
      releaseTimeoutRef.current = null;
    }, animationDuration);
  };

  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    if (!isCompactLayout || event.pointerType === "mouse") return;
    if (releaseTimeoutRef.current) {
      window.clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }
    setIsPressed(true);
  };

  const handlePointerUp = (event: PointerEvent<HTMLAnchorElement>) => {
    if (!isCompactLayout || event.pointerType === "mouse") return;
    clearPressedState();
  };

  const handlePointerCancel = (event: PointerEvent<HTMLAnchorElement>) => {
    if (!isCompactLayout || event.pointerType === "mouse") return;
    clearPressedState();
  };

  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      data-pressed={isPressed ? "true" : "false"}
      data-fill-disabled={fillOnHover ? "false" : "true"}
      data-static={isStatic ? "true" : "false"}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className="hpx-afb"
      style={
        {
          ...style,
          "--btn-bg": bgColor,
          "--btn-text": textColor,
          "--btn-fill-bg": fillBgColor,
          "--btn-fill-text": fillTextColor,
          "--btn-fill-bg-hover": hoverFillBgColor,
          "--btn-fill-text-hover": hoverFillTextColor,
          "--btn-arrow": arrowColor || fillTextColor,
          "--btn-arrow-hover": hoverArrowColor || hoverFillTextColor,
          "--btn-duration": `${animationDuration}ms`,
          visibility: isReady ? "visible" : "hidden",
        } as CSSProperties & Record<string, string | number>
      }
    >
      <span className="hpx-afb__label">{btnText}</span>

      <div aria-hidden="true" className="hpx-afb__circle" />

      <div aria-hidden="true" className="hpx-afb__mask">
        <span className="hpx-afb__mask-label">{btnText}</span>
      </div>

      <span aria-hidden="true" className="hpx-afb__icon">
        <ArrowRightIcon className="hpx-afb__icon-svg hpx-afb__icon-svg--enter" />
        <ArrowRightIcon className="hpx-afb__icon-svg hpx-afb__icon-svg--exit" />
      </span>
    </a>
  );
}

addPropertyControls(ArrowFillButton, {
  btnText: {
    type: ControlType.String,
    title: "Text",
    defaultValue: "Hover Me",
    placeholder: "Button label",
  },
  href: {
    type: ControlType.Link,
    title: "Link",
    defaultValue: "#",
  },
  newTab: {
    type: ControlType.Boolean,
    title: "New Tab",
    defaultValue: false,
  },
  bgColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#ff5f00",
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: "#ffffff",
  },
  fillBgColor: {
    type: ControlType.Color,
    title: "Fill Background",
    defaultValue: "#ffffff",
  },
  fillTextColor: {
    type: ControlType.Color,
    title: "Fill Text",
    defaultValue: "#ff5f00",
  },
  hoverFillBgColor: {
    type: ControlType.Color,
    title: "Hover Fill Bg",
    defaultValue: "#ffffff",
  },
  hoverFillTextColor: {
    type: ControlType.Color,
    title: "Hover Fill Text",
    defaultValue: "#ff5f00",
  },
  arrowColor: {
    type: ControlType.Color,
    title: "Arrow",
    defaultValue: "#ff5f00",
  },
  hoverArrowColor: {
    type: ControlType.Color,
    title: "Hover Arrow",
    defaultValue: "#ff5f00",
  },
  animationDuration: {
    type: ControlType.Number,
    title: "Duration",
    defaultValue: 450,
    min: 0,
    max: 2000,
    step: 10,
    unit: "ms",
    displayStepper: true,
  },
  fillOnHover: {
    type: ControlType.Boolean,
    title: "Fill On Hover",
    defaultValue: true,
  },
});
