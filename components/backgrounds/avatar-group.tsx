/**
 * Avatar Group
 *
 * Part of Onx Library — onxui.com
 * © 2026 Onx Ventures Pty Ltd. All rights reserved.
 *
 * Licensed for use in projects by the original purchaser.
 * Redistribution or resale of this component is prohibited.
 *
 * @author notagilbert
 * @version 1.0.0
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo } from "react"

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 64
 * @framerDisableUnlink
 */
function AvatarGroup(props) {
    const { images, maxCount, sizeDesktop, sizeMobile, overlap, gap } = props

    const visible = useMemo(
        () => (images || []).slice(0, maxCount),
        [images, maxCount]
    )

    const size = `clamp(${sizeMobile}px, calc(${sizeMobile}px + (${sizeDesktop} - ${sizeMobile}) * ((100vw - 480px) / (1024 - 480))), ${sizeDesktop}px)`

    return (
        <div
            data-onx-component="avatar-group"
            data-onx-source="onxui.com"
            data-onx-version="1.0.0"
            style={{
                display: "flex",
                alignItems: "center",
                ["--size" as any]: size,
                ["--overlap" as any]: `${overlap}px`,
                ["--gap" as any]: `${gap}px`,
            }}
        >
            {visible.map((item, i) => {
                const isLast = i === visible.length - 1
                const isFirst = i === 0

                // ResponsiveImage returns an object — pull the URL out
                const src = typeof item === "string" ? item : (item?.src ?? "")
                const srcSet =
                    typeof item === "string" ? undefined : item?.srcSet
                const alt = typeof item === "string" ? "" : (item?.alt ?? "")

                const maskValue = `radial-gradient(
                    circle at calc(100% + (var(--size) / 2) - var(--overlap)) 50%,
                    #0000 0,
                    #0000 calc(var(--size) / 2 + var(--gap)),
                    #000 calc(var(--size) / 2 + var(--gap) + 0.5px)
                )`

                return (
                    <div
                        key={i}
                        style={{
                            boxSizing: "border-box",
                            position: "relative",
                            width: "var(--size)",
                            height: "var(--size)",
                            borderRadius: "9999px",
                            marginLeft: isFirst
                                ? 0
                                : "calc(-1 * var(--overlap))",
                            overflow: "hidden",
                            flexShrink: 0,
                            ...(isLast
                                ? {}
                                : {
                                      WebkitMaskImage: maskValue,
                                      maskImage: maskValue,
                                      WebkitMaskRepeat: "no-repeat",
                                      maskRepeat: "no-repeat",
                                  }),
                        }}
                    >
                        {src ? (
                            <img
                                src={src}
                                srcSet={srcSet}
                                alt={alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

AvatarGroup.displayName = "Avatar Group"

AvatarGroup.defaultProps = {
    images: [],
    maxCount: 4,
    sizeDesktop: 64,
    sizeMobile: 40,
    overlap: 24,
    gap: 4,
}

addPropertyControls(AvatarGroup, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 10,
    },
    maxCount: {
        type: ControlType.Number,
        title: "Max Visible",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    sizeDesktop: {
        type: ControlType.Number,
        title: "Desktop",
        defaultValue: 64,
        min: 16,
        max: 200,
        step: 1,
        unit: "px",
    },
    sizeMobile: {
        type: ControlType.Number,
        title: "Mobile",
        defaultValue: 40,
        min: 16,
        max: 200,
        step: 1,
        unit: "px",
    },
    overlap: {
        type: ControlType.Number,
        title: "Overlap",
        defaultValue: 24,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 4,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
})

export default AvatarGroup
