// Get Started: https://www.framer.com/developers
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import { useState, useRef, useCallback } from "react"
/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function RainbowTumblerLetterAnimation({
    text,
    font,
    fontSizeOverride,
    textAlign,
    wordSpacingValue,
    wordSpacingUnit,
    letterSpacingValue,
    letterSpacingUnit,
    paragraphGap,
    paragraphGapUnit,
    initialTextColor,
    animDuration,
    hueStep,
    saturation,
    lightness,
    grayPercent,
    swingMaxNeg,
    swingMaxPos,
    swingMidNeg,
    swingMidPos,
    swingSmallNeg,
    style,
}) {
    // Ref 存储定时器ID，用于清理，防止定时器堆积
    const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
    const animLockRef = useRef<Record<string, boolean>>({})
    // 优先使用外部单独字号控件，兜底font面板字号
    const fontFamily = font?.fontFamily || "Inter"
    const fontWeight = font?.fontWeight || 900
    const fontSize = fontSizeOverride ?? (font?.fontSize || 86)
    const lineHeight = font?.lineHeight || 1
    const baseLetterSpacing = font?.letterSpacing || 0
    const baseColor = initialTextColor || font?.color || "#000000"

    // 单位处理函数
    const getUnitValue = (val: number, unit: string) => `${val}${unit}`

    const wordSpacingCss = getUnitValue(wordSpacingValue, wordSpacingUnit)
    const finalLetterSpacing = baseLetterSpacing + letterSpacingValue
    const finalLetterSpacingCss = getUnitValue(
        finalLetterSpacing,
        letterSpacingUnit
    )
    const paragraphGapCss = getUnitValue(paragraphGap, paragraphGapUnit)

    const [globalHue, setGlobalHue] = useState<number>(0)
    const [letterColorMap, setLetterColorMap] = useState<
        Record<string, string>
    >({})
    const [letterFilterMap, setLetterFilterMap] = useState<
        Record<string, string>
    >({})

    // 正则分割，过滤连续空白字符，过滤空单词
    const wordList = text.trim().split(/\s+/).filter(Boolean)

    // 不倒翁摇摆关键帧
    const wobbleAnim = {
        rotate: [
            0,
            swingMaxNeg,
            swingMaxPos,
            swingMidNeg,
            swingMidPos,
            swingSmallNeg,
            0,
        ],
        transition: {
            duration: animDuration,
            ease: "easeInOut",
            times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
        },
    }
    const handleLetterMouseEnter = useCallback(
        (uniqueId: string) => {
            if (animLockRef.current[uniqueId]) return
            animLockRef.current[uniqueId] = true
            // 清除该字母旧定时器，防止上一轮动画继续执行
            if (timerRef.current[uniqueId]) {
                clearTimeout(timerRef.current[uniqueId])
            }
            const newHue = (globalHue + hueStep) % 360
            const newColor = `hsl(${newHue}, ${saturation}%, ${lightness}%)`
            const newFilter = `grayscale(${grayPercent}%)`
            setGlobalHue(newHue)
            setLetterColorMap((prev) => ({ ...prev, [uniqueId]: newColor }))
            setLetterFilterMap((prev) => ({ ...prev, [uniqueId]: newFilter }))
            // 存储定时器ID
            const timerId = setTimeout(() => {
                const revertTimerId = setTimeout(() => {
                    setLetterColorMap((prev) => ({
                        ...prev,
                        [uniqueId]: baseColor,
                    }))
                    setLetterFilterMap((prev) => ({
                        ...prev,
                        [uniqueId]: "grayscale(0%)",
                    }))
                    animLockRef.current[uniqueId] = false
                    delete timerRef.current[uniqueId]
                }, 1000)
                timerRef.current[uniqueId] = revertTimerId
            }, animDuration * 1000)
            timerRef.current[uniqueId] = timerId
        },
        [
            globalHue,
            hueStep,
            saturation,
            lightness,
            grayPercent,
            baseColor,
            animDuration,
        ]
    )
    // 空文本直接不渲染
    if (!text.trim()) return null
    return (
        // 关键：{...style} 接收Framer画布Size面板的宽高
        <div style={{ ...style }}>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: paragraphGapCss,
                    width: "100%", // 填满父容器（Framer Size面板宽度）
                    justifyContent:
                        textAlign === "left"
                            ? "flex-start"
                            : textAlign === "center"
                              ? "center"
                              : "flex-end",
                    fontFamily,
                    fontWeight,
                    fontSize: `${fontSize}px`,
                    lineHeight,
                    letterSpacing: finalLetterSpacingCss,
                }}
            >
                {wordList.map((word, wordIndex) => {
                    const isLastWord = wordList.length - 1 === wordIndex
                    return (
                        <div
                            key={wordIndex}
                            style={{
                                display: "flex",
                                gap: finalLetterSpacingCss,
                                marginRight: isLastWord ? 0 : wordSpacingCss,
                            }}
                        >
                            {word.split("").map((char, charIndex) => {
                                const uniqueId = `w${wordIndex}-c${charIndex}`
                                const isAnimating =
                                    animLockRef.current[uniqueId]
                                return (
                                    <motion.span
                                        key={uniqueId}
                                        style={{
                                            display: "inline-block",
                                            transformOrigin: "bottom center",
                                            color:
                                                letterColorMap[uniqueId] ??
                                                baseColor,
                                            filter:
                                                letterFilterMap[uniqueId] ??
                                                "grayscale(0%)",
                                            cursor: "pointer",
                                        }}
                                        animate={
                                            isAnimating
                                                ? wobbleAnim
                                                : { rotate: 0 }
                                        }
                                        transition={{
                                            color: {
                                                duration: 0.2,
                                                ease: "ease",
                                            },
                                        }}
                                        onMouseEnter={() =>
                                            handleLetterMouseEnter(uniqueId)
                                        }
                                    >
                                        {char}
                                    </motion.span>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(RainbowTumblerLetterAnimation, {
    text: {
        title: "内容 Content",
        type: ControlType.String,
        defaultValue: "Create thoughtful and warm design!",
    },
    fontSizeOverride: {
        title: "字号 Font Size",
        type: ControlType.Number,
        defaultValue: 86,
        step: 1,
        unit: "px",
        // 删除min/max，去掉滑块，仅保留输入框
    },
    font: {
        title: "字体 Font",
        type: ControlType.Font,
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 900,
            color: "#000000",
            fontSize: 86,
            lineHeight: 1,
            letterSpacing: 0,
        },
    },
    initialTextColor: {
        title: "颜色 Color",
        type: ControlType.Color,
        defaultValue: "#000000",
    },
    animDuration: {
        title: "动画时长 Duration",
        type: ControlType.Number,
        defaultValue: 1.4,
        step: 0.1,
        unit: "s",
    },
    textAlign: {
        title: "文本对齐 Align",
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        defaultValue: "left",
    },
    // ========== 字符间距：移除min/max，取消滑块，只保留数字输入框
    letterSpacingValue: {
        title: "字符间距 Character Spacing",
        type: ControlType.Number,
        defaultValue: 10,
        step: 0.5,
    },
    letterSpacingUnit: {
        title: "单位",
        type: ControlType.Enum,
        options: ["px", "em"],
        defaultValue: "px",
    },
    // ========== 行间距：移除min/max，取消滑块
    paragraphGap: {
        title: "行间距 Line Gap",
        type: ControlType.Number,
        defaultValue: 3,
        step: 1,
    },
    paragraphGapUnit: {
        title: "单位",
        type: ControlType.Enum,
        options: ["px", "em"],
        defaultValue: "px",
    },
    // ========== 词间距：移除min/max，取消滑块
    wordSpacingValue: {
        title: "词间距 Word Spacing",
        type: ControlType.Number,
        defaultValue: 16,
        step: 1,
    },
    wordSpacingUnit: {
        title: "单位",
        type: ControlType.Enum,
        options: ["px", "em"],
        defaultValue: "px",
    },
    hueStep: {
        title: "色相差值 Delta E",
        type: ControlType.Number,
        defaultValue: 30,
        step: 1,
    },
    saturation: {
        title: "饱和度% saturation",
        type: ControlType.Number,
        defaultValue: 85,
        step: 1,
        unit: "%",
    },
    lightness: {
        title: "明度% lightness",
        type: ControlType.Number,
        defaultValue: 50,
        step: 1,
        unit: "%",
    },
    grayPercent: {
        title: "灰度% Grayscale",
        type: ControlType.Number,
        defaultValue: 10,
        step: 1,
        unit: "%",
    },
    swingMaxNeg: {
        title: "最大倾斜度-左 Max Tilt-Left",
        type: ControlType.Number,
        defaultValue: -8,
        step: 0.5,
        unit: "°",
    },
    swingMaxPos: {
        title: "最大倾斜度-右 Max Tilt-Right",
        type: ControlType.Number,
        defaultValue: 8,
        step: 0.5,
        unit: "°",
    },
    swingMidNeg: {
        title: "摇摆中间值-左 Middle Value-left",
        type: ControlType.Number,
        defaultValue: -6,
        step: 0.5,
        unit: "°",
    },
    swingMidPos: {
        title: "摇摆中间值-右 Middle Value-Right",
        type: ControlType.Number,
        defaultValue: 5,
        step: 0.5,
        unit: "°",
    },
    swingSmallNeg: {
        title: "最小摇摆度 Minimum Swing Degree",
        type: ControlType.Number,
        defaultValue: -3,
        step: 0.5,
        unit: "°",
    },
})
