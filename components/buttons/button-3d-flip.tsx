// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect } from "react"

export default function NavFlipLink({
    text,
    flipText,
    href,

    // FONT CONTROLS
    font,
    fontSize,
    fontWeightOverride,
    uppercase,

    // COLORS
    frontColor,
    frontBg,
    flipColor,
    flipBg,

    // LAYOUT
    duration,
    padding,
    radius,
}) {
    // ✅ Resolve Framer font object
    const fontFamily = font?.fontFamily || font?.family || "Inter, sans-serif"
    const baseWeight = font?.fontWeight || font?.weight || 400
    const fontWeight =
        fontWeightOverride !== 0 ? fontWeightOverride : baseWeight
    const fontStyle = font?.style || "normal"

    // ✅ Text logic
    const label = uppercase ? text.toUpperCase() : text
    const flipLabel = flipText?.trim()
        ? uppercase
            ? flipText.toUpperCase()
            : flipText
        : label

    // ✅ Inject CSS once
    useEffect(() => {
        if (document.getElementById("fs-flip-no-transition-css")) return
        const style = document.createElement("style")
        style.id = "fs-flip-no-transition-css"
        style.innerHTML = `
      .fs-wrap {
        display: inline-block;
        perspective: 900px;
      }

      .fs-flip {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;

        padding: var(--pad, 14px);
        font-size: var(--size, 18px);
        font-weight: var(--weight, 600);
        font-family: var(--fontFamily, Inter, sans-serif);
        font-style: var(--fontStyle, normal);
        text-decoration: none;

        border-radius: var(--radius, 0px);
        line-height: 1;
        box-sizing: border-box;

        color: var(--frontColor, #fff);
        background-color: var(--frontBg, #000);

        transform-style: preserve-3d;
        backface-visibility: hidden;

        transition: transform var(--dur, .5s) ease;
      }

      .fs-wrap:hover .fs-flip {
        transform: translateY(-50%) rotateX(90deg);
      }

      .fs-flip::before {
        content: attr(data-flip);
        position: absolute;
        inset: 0;

        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--pad, 14px);

        font-size: var(--size, 18px);
        font-weight: var(--weight, 600);
        font-family: var(--fontFamily, Inter, sans-serif);
        font-style: var(--fontStyle, normal);
        border-radius: inherit;
        line-height: 1;
        box-sizing: border-box;

        color: var(--flipColor, #000);
        background-color: var(--flipBg, #9AFFA4);

        transform-origin: bottom center;
        transform: rotateX(90deg) rotateY(180deg) rotateZ(180deg) translateY(100%);
        opacity: 0;
        transition: opacity var(--dur, .5s) ease;
      }

      .fs-wrap:hover .fs-flip::before {
        opacity: 1;
      }
    `
        document.head.appendChild(style)
    }, [])

    return (
        <div
            className="fs-wrap"
            style={{
                "--dur": `${duration}s`,
                "--size": `${fontSize}px`,
                "--weight": fontWeight,
                "--fontFamily": fontFamily,
                "--fontStyle": fontStyle,
                "--frontColor": frontColor,
                "--frontBg": frontBg,
                "--flipColor": flipColor,
                "--flipBg": flipBg,
                "--pad": padding,
                "--radius": `${radius}px`,
            }}
        >
            <a
                href={href}
                className="fs-flip"
                data-flip={flipLabel}
                style={{
                    fontFamily,
                    fontWeight,
                    fontStyle,
                    padding,
                    borderRadius: `${radius}px`,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                }}
            >
                {label}
            </a>
        </div>
    )
}

/* ✅ Organized Controls */
addPropertyControls(NavFlipLink, {
    // TEXT
    text: { type: ControlType.String, defaultValue: "JOIN NOW", title: "Text" },
    flipText: {
        type: ControlType.String,
        defaultValue: "",
        title: "Flip Text",
    },
    uppercase: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Uppercase",
    },

    // ✅ FONT GROUP
    font: {
        type: ControlType.Font,
        defaultValue: { family: "Inter", weight: 600 },
    },
    fontSize: {
        type: ControlType.Number,
        defaultValue: 18,
        title: "Font Size",
    },
    fontWeightOverride: {
        type: ControlType.Number,
        defaultValue: 0,
        title: "Weight Override",
    },

    // COLORS
    frontColor: {
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        title: "Text Color",
    },
    frontBg: {
        type: ControlType.Color,
        defaultValue: "#000000",
        title: "Background",
    },
    flipColor: {
        type: ControlType.Color,
        defaultValue: "#000000",
        title: "Flip Text",
    },
    flipBg: {
        type: ControlType.Color,
        defaultValue: "#9AFFA4",
        title: "Flip Background",
    },

    // LINK
    href: {
        type: ControlType.String,
        defaultValue: "https://framerspark.co",
        title: "Link",
    },

    // LAYOUT
    duration: {
        type: ControlType.Number,
        defaultValue: 0.5,
        title: "Flip Speed (s)",
    },
    padding: {
        type: ControlType.String,
        defaultValue: "14px",
        title: "Padding",
    },
    radius: {
        type: ControlType.Number,
        defaultValue: 0,
        title: "Border Radius",
    },
})
