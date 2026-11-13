/*
 * Blocks+ was created by Jayzhushi. Visit Reveals.cool to learn more.
 * For assistance, contact x.com/jayzhushi or email jayzhushi@gmail.com.
 * This component is licensed under the BSD License.
 */

import React, { useRef, useEffect, useState, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    CompatibleMedia,
    propertyControls,
    useMediaSource,
} from "../UseSetup.tsx"
import { Scene } from "./Scene.tsx"

/**
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 *
 */

function Blocks({
    type,
    file,
    upImage,
    urlVideo,
    upVideo,
    defaultImage,
    dark,
    darkImage,
    loop,
    fit,
    content,
    font,
    background,
    progressValue,
    column,
    overlap,
    direction,
    advance,
    section,
    animateProp,
    transition,
    accessibility,
    ariaLabel,
    onLoad,
    onError,
    onVideoEnd,
    onAnimationComplete,
}) {
    const { imageAlt, mediaSrc, mediaType } = useMediaSource(
        type,
        file,
        urlVideo,
        upVideo,
        defaultImage,
        darkImage,
        dark,
        "wheat"
    )

    const shouldReduceMotion = useReducedMotion()
    const useCompatibility =
        accessibility.compatibility ||
        (accessibility.reduce && shouldReduceMotion)

    if (useCompatibility) {
        return (
            <CompatibleMedia
                mediaType={mediaType}
                mediaSrc={mediaSrc}
                imageAlt={imageAlt}
                fit={fit}
                loop={loop}
                content={content}
                font={font}
                background={background}
                useCompatibility={useCompatibility}
            />
        )
    }

    return (
        <>
            <Scene
                mediaType={mediaType}
                mediaSrc={mediaSrc}
                imageAlt={imageAlt}
                loop={loop}
                fit={fit}
                content={content}
                font={font}
                background={background}
                progressValue={progressValue}
                column={column}
                overlap={overlap}
                direction={direction}
                advance={advance}
                animateProp={{ ...animateProp, section }}
                transitionProp={transition}
                accessibility={accessibility}
                ariaLabel={ariaLabel}
                onLoad={onLoad}
                onError={onError}
                onVideoEnd={onVideoEnd}
                onAnimationComplete={onAnimationComplete}
            />
            {mediaType === "text" && (
                <CompatibleMedia
                    mediaType={mediaType}
                    mediaSrc={mediaSrc}
                    imageAlt={imageAlt}
                    fit={fit}
                    loop={loop}
                    content={content}
                    font={font}
                    background={background}
                    useCompatibility={useCompatibility}
                />
            )}
        </>
    )
}

export default Blocks

Blocks.displayName = "Blocks+"

addPropertyControls(Blocks, {
    ...propertyControls.media,
    ...propertyControls.size,
    progressValue: {
        type: ControlType.Number,
        title: "Progress",
        displayStepper: true,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 0,
        hidden(props) {
            return props.animateProp.type !== "variant"
        },
    },
    column: {
        type: ControlType.Number,
        title: "Column",
        displayStepper: true,
        step: 1,
        max: 200,
        min: 1,
        defaultValue: 50,
    },
    direction: {
        type: ControlType.Enum,
        options: [5, 7, 4, 6, 0, 3, 1, 2, 8, 9],
        optionTitles: [
            "Top",
            "Right",
            "Bottom",
            "Left",
            "TopLeft",
            "TopRight",
            "BottomLeft",
            "BottomRight",
            "Center",
            "Edge",
        ],
        title: "Direction",
        defaultValue: 4,
    },
    advance: {
        type: ControlType.Object,
        title: "Advance",
        buttonTitle: "Advance",
        icon: "effect",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(255, 243, 219, 1)",
            },
            random: {
                type: ControlType.Boolean,
                title: "Random",
                defaultValue: false,
            },
            brightness: {
                type: ControlType.Number,
                title: "Brightness",
                displayStepper: true,
                step: 0.1,
                max: 2,
                min: 0,
                defaultValue: 1.2,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                displayStepper: true,
                step: 1,
                max: 20,
                min: 0,
                defaultValue: 5,
            },
        },
    },
    animateProp: {
        type: ControlType.Object,
        title: "Animation",
        buttonTitle: "Animation",
        icon: "interaction",
        controls: {
            ...propertyControls.animateControls,
            custom: {
                type: ControlType.Object,
                title: "Custom",
                buttonTitle: "Custom",
                icon: "effect",
                hidden(props) {
                    return props.type === "disable" || props.type === "variant"
                },
                controls: {
                    enable: {
                        type: ControlType.Boolean,
                        title: "Enable",
                        defaultValue: false,
                        description:
                            "Customize the animation target value for each property.",
                    },
                    progressValue: {
                        type: ControlType.Number,
                        title: "Progress",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    column: {
                        type: ControlType.Number,
                        title: "Column",
                        displayStepper: true,
                        step: 1,
                        max: 200,
                        min: 1,
                        defaultValue: 50,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    // color: {
                    //     type: ControlType.Color,
                    //     title: "Color",
                    //     defaultValue: "rgba(255, 243, 219, 1)",
                    //     hidden(props) {
                    //         return !props.enable
                    //     },
                    // },
                    brightness: {
                        type: ControlType.Number,
                        title: "Brightness",
                        displayStepper: true,
                        step: 0.1,
                        max: 2,
                        min: 0,
                        defaultValue: 1.2,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        displayStepper: true,
                        step: 1,
                        max: 20,
                        min: 0,
                        defaultValue: 5,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                },
            },
        },
    },
    ...propertyControls.scrollControls,
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "tween",
            delay: 0,
            duration: 2,
            ease: [0, 0, 1, 1],
        },
    },
    ...propertyControls.accessibility,
    ...propertyControls.eventHandler,
})
