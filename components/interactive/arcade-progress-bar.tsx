/**
 * ArcadeProgressBar - Made by Glipp with love. www.glipp.com
 *
 * A customizable retro-styled progress bar component with arcade aesthetics.
 * Perfect for loading indicators, health bars, or any progress tracking in pixel-art UIs.
 *
 * Features:
 * - Three visual variants: Blocks, BitBox, and Pixel Heart
 * - Determinate and indeterminate modes
 * - Customizable colors, spacing, and animations
 * - Custom icon support for Pixel Heart variant
 * - Auto-play and manual animation control
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 142
 */

import React from "react"
import type { FC } from "react"
import { useState, useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import styled from "styled-components"

const RootContainer = styled.div<{ $labelGap: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  gap: ${(props) => props.$labelGap}px;
`

const Frame = styled(motion.div)<{
    $variant: "Blocks" | "BitBox" | "Pixel Heart"
    $frameThickness: number
    $frameColor: string
    $panelColor: string
    $shadowColor: string
    $shadowOffset: number
    $notchSize: number
}>`
  position: relative;
  width: 100%;
  flex-grow: 1;
  border: ${(props) => props.$frameThickness}px solid
    ${(props) => props.$frameColor};
  background-color: ${(props) => props.$panelColor};
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) =>
      props.$variant === "Blocks" &&
      `box-shadow: ${props.$shadowOffset}px ${props.$shadowOffset}px 0px ${props.$shadowColor};`}
  ${(props) =>
      props.$variant === "BitBox" &&
      `clip-path: polygon(${props.$notchSize}px 0, calc(100% - ${props.$notchSize}px) 0, calc(100% - ${props.$notchSize}px) ${props.$notchSize}px, 100% ${props.$notchSize}px, 100% calc(100% - ${props.$notchSize}px), calc(100% - ${props.$notchSize}px) calc(100% - ${props.$notchSize}px), calc(100% - ${props.$notchSize}px) 100%, ${props.$notchSize}px 100%, ${props.$notchSize}px calc(100% - ${props.$notchSize}px), 0 calc(100% - ${props.$notchSize}px), 0 ${props.$notchSize}px, ${props.$notchSize}px ${props.$notchSize}px);`}
    border-radius: ${(props) => (props.$variant === "Blocks" ? 0 : 4)}px;
`

const Panel = styled.div<{
    $panelInset: number
    $segmentGap: number
    $direction: "ltr" | "rtl"
}>`
  width: 100%;
  height: 100%;
  padding: ${(props) => props.$panelInset}px;
  box-sizing: border-box;
  display: flex;
  gap: ${(props) => props.$segmentGap}px;
  flex-direction: ${(props) =>
      props.$direction === "rtl" ? "row-reverse" : "row"};
`

const SegmentTile = styled.div<{
    $fillColor: string
    $unfilledColor: string
    $isFilled: boolean
    $variant: "Blocks" | "BitBox"
}>`
  flex: 1 1 0;
  height: 100%;
  background-color: ${(props) =>
      props.$isFilled ? props.$fillColor : props.$unfilledColor};
  border-radius: ${(props) => (props.$variant === "BitBox" ? "2px" : 0)};
  box-sizing: border-box;
  transition: background-color 0.1s ease-in-out;
`

const LabelText = styled.div<{
    $frameColor: string
    $align: "left" | "center" | "right"
    $font: any
    $textTransform: string
}>`
  width: 100%;
  color: ${(props) => props.$frameColor};
  text-align: ${(props) => props.$align};
  white-space: nowrap;
  line-height: 1;
  flex-shrink: 0;
  font-family: ${(props) => props.$font.fontFamily};
  font-size: ${(props) => props.$font.fontSize};
  font-weight: ${(props) => props.$font.fontWeight};
  letter-spacing: ${(props) => props.$font.letterSpacing};
  line-height: ${(props) => props.$font.lineHeight};
  ${(props) =>
      props.$font.fontFeatureSettings
          ? `font-feature-settings: ${props.$font.fontFeatureSettings};`
          : ""}
  text-transform: ${(props) => props.$textTransform};
`

const SvgContainer = styled.div<{ $opacity?: number }>`
  flex: 1 1 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.$opacity !== undefined ? props.$opacity : 1)};

  svg,
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 142
 */
export default function ArcadeProgressBar(props) {
    const {
        value,
        autoPlay,
        duration,
        loop,
        segments,
        direction,
        labelText,
        labelTextContent,
        startAnimation,
        mode,
        variant,
        fillColor,
        unfilledColor,
        filledIconFile,
        emptyIconFile,
        unfilledIconOpacity,
        frameThickness,
        frameColor,
        panelColor,
        shadowColor,
        shadowOffset,
        notchSize,
        labelAlign,
        labelFont,
        labelTextTransform,
    } = props

    const [currentValue, setCurrentValue] = useState(autoPlay ? 0 : value)
    const [marqueePos, setMarqueePos] = useState(-3)
    const isAnimating = useRef(false)

    useEffect(() => {
        if (isAnimating.current || mode !== "determinate") return
        if (!autoPlay && !startAnimation) {
            setCurrentValue(value)
            return
        }
        isAnimating.current = true
        const controls = animate(0, 100, {
            duration,
            repeat: loop ? Infinity : 0,
            repeatType: "loop",
            ease: "linear",
            onUpdate: (latest) => setCurrentValue(latest),
            onComplete: () => {
                isAnimating.current = false
            },
        })
        return () => {
            controls.stop()
            isAnimating.current = false
        }
    }, [autoPlay, startAnimation, duration, loop, value, mode])

    useEffect(() => {
        if (!autoPlay && !startAnimation) {
            setCurrentValue(value)
        }
    }, [value, autoPlay, startAnimation])

    useEffect(() => {
        if (mode !== "indeterminate") return
        const totalSegments = segments + 4
        const controls = animate(-4, totalSegments, {
            duration: duration,
            repeat: Infinity,
            ease: "linear",
            onUpdate: (latest) => setMarqueePos(Math.floor(latest)),
        })
        return () => controls.stop()
    }, [mode, segments, duration])

    const filledCount = Math.ceil((currentValue / 100) * segments)
    const marqueeWidth = Math.max(2, Math.floor(segments / 5))
    const finalLabel = labelTextContent
        ? labelTextContent.replace("{value}", String(Math.round(currentValue)))
        : ""

    const labelGap = variant === "Blocks" ? shadowOffset + 8 : 8

    return (
        <RootContainer $labelGap={labelGap}>
            <Frame
                $variant={variant}
                $frameThickness={frameThickness}
                $frameColor={frameColor}
                $panelColor={panelColor}
                $shadowColor={shadowColor}
                $shadowOffset={shadowOffset}
                $notchSize={notchSize}
                role="progressbar"
                aria-valuenow={
                    mode === "determinate"
                        ? Math.round(currentValue)
                        : undefined
                }
                aria-valuemin={mode === "determinate" ? 0 : undefined}
                aria-valuemax={mode === "determinate" ? 100 : undefined}
                aria-label={labelText || "Loading progress"}
            >
                <Panel
                    $panelInset={props.panelInset}
                    $segmentGap={props.segmentGap}
                    $direction={direction}
                >
                    {Array.from({ length: segments }).map((_, i) => {
                        let isFilled = false
                        if (mode === "determinate") {
                            isFilled = i < filledCount
                        } else {
                            isFilled =
                                i >= marqueePos && i < marqueePos + marqueeWidth
                        }

                        if (variant === "Pixel Heart") {
                            const hasCustomIcons =
                                filledIconFile || emptyIconFile

                            if (hasCustomIcons) {
                                const imageSrc = isFilled
                                    ? filledIconFile
                                    : emptyIconFile
                                if (imageSrc) {
                                    return (
                                        <SvgContainer
                                            key={i}
                                            $opacity={
                                                isFilled
                                                    ? 1
                                                    : unfilledIconOpacity
                                            }
                                        >
                                            <img
                                                src={imageSrc}
                                                alt={
                                                    isFilled
                                                        ? "Filled heart"
                                                        : "Empty heart"
                                                }
                                            />
                                        </SvgContainer>
                                    )
                                }
                            }

                            return (
                                <SvgContainer
                                    key={i}
                                    $opacity={
                                        isFilled ? 1 : unfilledIconOpacity
                                    }
                                >
                                    {isFilled ? (
                                        <svg
                                            width="117"
                                            height="108"
                                            viewBox="0 0 117 108"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M99 18V9H90H81H72V18H63V27H54V18H45V9H36H27H18V18H9V27V36V45V54H18V63H27V72H36V81H45V90H54H63H72V81H81V72H90V63H99V54H108V45V36V27V18H99Z"
                                                fill="#FF0000"
                                            />
                                            <path
                                                d="M36 26.9001V17.8H26.9V26.9001H18V36H26.9V45.1001H36V36H27.2V26.9001H36Z"
                                                fill="white"
                                            />
                                            <path
                                                d="M63 18H54V27H63V18Z"
                                                fill="black"
                                            />
                                            <path
                                                d="M72 9H63V18H72V9Z"
                                                fill="black"
                                            />
                                            <path
                                                d="M108.2 18L108 17.8V9H99.2L99 8.8V0H94.5H90H81H72V9H81H90H94.5H98.9L99 9.10001V18H107.9L108 18.1V27V36V45V49.5V53.8L107.9 54H99V62.8L98.9 63H90V71.8L89.9 72H81V80.8L80.9 81H72V89.8L71.9 90H63V98.8L62.9 99H54.3L54 98.7V90H45.3L45 89.7V81H36.3L36 80.7V72H27.3L27 71.7V63H18.3L18 62.7V54H9.3L9 53.7V45V36V27V21.6V18.1L9.2 18H18V9.10001L18.2 9H23.7H27H36H38H45V0H38H36H27H23.7H18V8.8L17.9 9H9V17.8L8.9 18H0V21.6V27V36V45V54H9V63H18V72H27V81H36V90H45V99H54V108H63V99.1L63.2 99H72V90.1L72.2 90H81V81.1L81.2 81H90V72.1L90.2 72H99V63.1L99.2 63H108V54.1L108.2 54H117V49.5V45V36V27V18H108.2Z"
                                                fill="black"
                                            />
                                            <path
                                                d="M54 9H45V18H54V9Z"
                                                fill="black"
                                            />
                                            <path
                                                d="M99.2 18L99 17.8V9H90V18H98.9L99 18.1V27V36V45V50.1V53.8L98.9 54H90V62.8L89.9 63H81V71.8L80.9 72H72V80.8L71.9 81H63V89.8L62.9 90H54.2L54 89.8V81H45.2L45 80.8V72H36.2L36 71.8V63H27.2L27 62.8V54H18V63H26.9L27 63.1V72H35.9L36 72.1V81H44.9L45 81.1V90H53.9L54 90.1V99H63V90.1L63.2 90H72V81.1L72.2 81H81V72.1L81.2 72H90V63.1L90.2 63H99V54.1L99.2 54H108V50.1V45V36V27V18H99.2Z"
                                                fill="#C20906"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            width="117"
                                            height="108"
                                            viewBox="0 0 117 108"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M99 18V9H90H81H72V18H63V27H54V18H45V9H36H27H18V18H9V27V36V45V54H18V63H27V72H36V81H45V90H54H63H72V81H81V72H90V63H99V54H108V45V36V27V18H99Z"
                                                fill="#E7E7E7"
                                            />
                                            <path
                                                d="M36 26.9001V17.8H26.9V26.9001H18V36H26.9V45.1001H36V36H27.2V26.9001H36Z"
                                                fill="white"
                                            />
                                            <path
                                                d="M63 18H54V27H63V18Z"
                                                fill="black"
                                            />
                                            <path
                                                d="M72 9H63V18H72V9Z"
                                                fill="black"
                                            />
                                            <path
                                                d="M108.1 18L108 17.8V9H99.1L99 8.8V0H94.5H90H81H72V9H81H90H94.5H98.9L99 9.10001V18H107.9L108 18.1V27V36V45V49.5V53.8L107.9 54H99V62.8L98.9 63H90V71.8L89.9 72H81V80.8L80.9 81H72V89.8L71.9 90H63V98.8L62.9 99H54.3L54 98.7V90H45.3L45 89.7V81H36.3L36 80.7V72H27.3L27 71.7V63H18.3L18 62.7V54H9.3L9 53.7V45V36V27V21.6V18.1L9.10001 18H18V9.10001L18.1 9H23.7H27H36H38H45V0H38H36H27H23.7H18V8.8L17.9 9H9V17.8L8.89999 18H0V21.6V27V36V45V54H9V63H18V72H27V81H36V90H45V99H54V108H63V99.1L63.2 99H72V90.1L72.2 90H81V81.1L81.2 81H90V72.1L90.2 72H99V63.1L99.2 63H108V54.1L108.2 54H117V49.5V45V36V27V18H108.1Z"
                                                fill="black"
                                            />
                                            <path
                                                d="M54 9H45V18H54V9Z"
                                                fill="black"
                                            />
                                            <path
                                                d="M99.1 18L99 17.8V9H90V18H98.9L99 18.1V27V36V45V50.1V53.8L98.9 54H90V62.8L89.9 63H81V71.8L80.9 72H72V80.8L71.9 81H63V89.8L62.9 90H54.1L54 89.8V81H45.1L45 80.8V72H36.1L36 71.8V63H27.1L27 62.8V54H18V63H26.9L27 63.1V72H35.9L36 72.1V81H44.9L45 81.1V90H53.9L54 90.1V99H63V90.1L63.1 90H72V81.1L72.1 81H81V72.1L81.1 72H90V63.1L90.1 63H99V54.1L99.1 54H108V50.1V45V36V27V18H99.1Z"
                                                fill="#9C9C9C"
                                            />
                                        </svg>
                                    )}
                                </SvgContainer>
                            )
                        } else {
                            return (
                                <SegmentTile
                                    key={i}
                                    $isFilled={isFilled}
                                    $fillColor={fillColor}
                                    $unfilledColor={unfilledColor}
                                    $variant={variant}
                                />
                            )
                        }
                    })}
                </Panel>
            </Frame>
            {finalLabel && (
                <LabelText
                    $frameColor={frameColor}
                    $align={labelAlign}
                    $font={labelFont}
                    $textTransform={labelTextTransform}
                >
                    {finalLabel}
                </LabelText>
            )}
        </RootContainer>
    )
}

ArcadeProgressBar.defaultProps = {
    variant: "Blocks",
    mode: "determinate",
    value: 80,
    autoPlay: false,
    startAnimation: false,
    duration: 3,
    loop: false,
    segments: 10,
    direction: "ltr",
    labelTextContent: "Loading...",
    labelText: "Progress Bar",
    frameColor: "#333333",
    panelColor: "#FFFFFF",
    fillColor: "#333333",
    unfilledColor: "#FFFFFF",
    frameThickness: 8,
    panelInset: 8,
    segmentGap: 8,
    shadowColor: "#333333",
    shadowOffset: 10,
    notchSize: 8,
    labelAlign: "right",
    labelFont: {
        fontFamily: "Fira Code",
        fontSize: "30px",
        fontWeight: 700,
        letterSpacing: "0px",
        lineHeight: "1em",
        fontFeatureSettings: `"ss01" 1, "liga" 1`,
    },
    labelTextTransform: "none",
    filledIconFile: "",
    emptyIconFile: "",
    unfilledIconOpacity: 1,
}

addPropertyControls(ArcadeProgressBar, {
    variant: {
        title: "Variant",
        type: ControlType.SegmentedEnum,
        options: ["Blocks", "BitBox", "Pixel Heart"],
        optionTitles: ["Blocks", "BitBox", "Pixel Heart"],
    },
    mode: {
        title: "Mode",
        type: ControlType.SegmentedEnum,
        options: ["determinate", "indeterminate"],
        optionTitles: ["Determinate", "Indeterminate"],
    },
    value: {
        title: "Value",
        type: ControlType.Number,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
        hidden: (props) =>
            props.mode !== "determinate" ||
            props.autoPlay ||
            props.startAnimation,
    },
    autoPlay: {
        title: "Auto Play",
        type: ControlType.Boolean,
        description: "Animate on load.",
        hidden: (props) => props.mode !== "determinate",
    },
    startAnimation: {
        title: "Start Animation",
        type: ControlType.Boolean,
        description: "Toggle to trigger animation.",
        hidden: (props) => props.mode !== "determinate",
    },
    duration: {
        title: "Duration (s)",
        type: ControlType.Number,
        min: 0.1,
        step: 0.1,
        description: "Animation speed for all modes.",
        hidden: (props) =>
            props.mode === "determinate" &&
            !props.autoPlay &&
            !props.startAnimation,
    },
    loop: {
        title: "Loop",
        type: ControlType.Boolean,
        hidden: (props) => !props.autoPlay,
    },
    segments: {
        title: "Segments",
        type: ControlType.Number,
        min: 2,
        max: 50,
        step: 1,
        displayStepper: true,
    },
    direction: {
        title: "Direction",
        type: ControlType.SegmentedEnum,
        options: ["ltr", "rtl"],
        optionTitles: ["Left → Right", "Right → Left"],
    },
    labelText: {
        title: "ARIA Label",
        type: ControlType.String,
        description: "For screen readers.",
    },
    frameColor: { title: "Frame Color", type: ControlType.Color },
    panelColor: { title: "Panel Color", type: ControlType.Color },
    fillColor: {
        title: "Fill Color",
        type: ControlType.Color,
        hidden: (props) => props.variant === "Pixel Heart",
    },
    unfilledColor: {
        title: "Unfilled Color",
        type: ControlType.Color,
        hidden: (props) => props.variant === "Pixel Heart",
    },
    filledIconFile: {
        title: "Filled Icon",
        type: ControlType.File,
        allowedFileTypes: ["svg", "png", "jpg", "jpeg", "webp"],
        hidden: (props) => props.variant !== "Pixel Heart",
    },
    emptyIconFile: {
        title: "Empty Icon",
        type: ControlType.File,
        allowedFileTypes: ["svg", "png", "jpg", "jpeg", "webp"],
        hidden: (props) => props.variant !== "Pixel Heart",
    },
    unfilledIconOpacity: {
        title: "Unfilled Opacity",
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
        hidden: (props) => props.variant !== "Pixel Heart",
    },
    frameThickness: {
        title: "Frame Size",
        type: ControlType.Number,
        min: 0,
        max: 20,
    },
    panelInset: {
        title: "Panel Inset",
        type: ControlType.Number,
        min: 0,
        max: 20,
    },
    segmentGap: {
        title: "Segment Gap",
        type: ControlType.Number,
        min: 0,
        max: 20,
    },
    shadowColor: {
        title: "Shadow Color",
        type: ControlType.Color,
        hidden: (props) => props.variant !== "Blocks",
    },
    shadowOffset: {
        title: "Shadow Offset",
        type: ControlType.Number,
        min: 0,
        max: 20,
        hidden: (props) => props.variant !== "Blocks",
    },
    notchSize: {
        title: "Notch Size",
        type: ControlType.Number,
        min: 0,
        max: 50,
        hidden: (props) => props.variant !== "BitBox",
    },
    labelTextContent: {
        title: "Label Text",
        type: ControlType.String,
        placeholder: "Leave empty to hide",
        description: "Use {value} for percentage.",
    },
    labelAlign: {
        title: "Label Align",
        type: ControlType.SegmentedEnum,
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Fira Code",
            fontSize: "30px",
            fontWeight: 700,
            lineHeight: "1em",
        },
    },
    labelTextTransform: {
        type: ControlType.Enum,
        title: "Label Transform",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
        defaultValue: "none",
    },
})
