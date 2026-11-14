import React, { useState, useEffect, useCallback, useMemo, startTransition, useRef, memo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface KeyboardProps {
    keyboardVariant: "regular" | "apple" | "mobile"
    keyboardColor: string
    textColor: string
    backgroundColor: string
    transparentBackground: boolean
    specialKeyboardColor: string
    windowsKeyImage: {
        src: string
        alt: string
    }
    appleKeyImage: {
        src: string
        alt: string
    }
    specialKeyLink: string
    customKeycapImages: Array<{
        key: string
        image: {
            src: string
            alt: string
        }
    }>
    keyRemappings: Array<{
        originalKey: string
        remappedTo: string
    }>
    keyFont: any
    showTextPreview: boolean
    style?: React.CSSProperties
}

/**
 * Hyper-realistic mechanical keyboard with tactile feedback and text preview
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MechanicalKeyboard(props: KeyboardProps) {
    const {
        keyboardVariant = "regular",
        keyboardColor = "#2a2a2a",
        textColor = "#ffffff",
        backgroundColor = "#121212",
        transparentBackground = false,
        specialKeyboardColor = "#FFA500",
        windowsKeyImage = { 
            src: "https://framerusercontent.com/images/48ha9ZR9oJQGQ6gZ8YUfElP3T0.png", 
            alt: "Framer" 
        },
        appleKeyImage = {
            src: "https://framerusercontent.com/images/48ha9ZR9oJQGQ6gZ8YUfElP3T0.png",
            alt: "Apple"
        },
        customKeycapImages = [],
        keyRemappings = [],
        keyFont,
        showTextPreview = true,
    } = props

    const [text, setText] = useState("")
    const [capsLock, setCapsLock] = useState(false)
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
    const [lastPressedKey, setLastPressedKey] = useState<string | null>(null)
    const [showCursor, setShowCursor] = useState(true)
    const [showNumbers, setShowNumbers] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const keyPressTimeoutRef = useRef<number | null>(null)

    // Create a map of remapped keys for quick lookup
    const keyRemappingMap = useMemo(() => {
        const map: Record<string, string> = {};
        keyRemappings.forEach(item => {
            if (item.originalKey && item.remappedTo) {
                map[item.originalKey] = item.remappedTo;
            }
        });
        return map;
    }, [keyRemappings]);

    // Key layout configuration with remapped labels
    const keyboardLayout = useMemo(() => {
        if (keyboardVariant === "mobile") {
            // Mobile phone keyboard layout
            if (showNumbers) {
                return [
                    [
                        { key: "1", label: keyRemappingMap["1"] || "1", width: 1 },
                        { key: "2", label: keyRemappingMap["2"] || "2", width: 1 },
                        { key: "3", label: keyRemappingMap["3"] || "3", width: 1 },
                        { key: "4", label: keyRemappingMap["4"] || "4", width: 1 },
                        { key: "5", label: keyRemappingMap["5"] || "5", width: 1 },
                        { key: "6", label: keyRemappingMap["6"] || "6", width: 1 },
                        { key: "7", label: keyRemappingMap["7"] || "7", width: 1 },
                        { key: "8", label: keyRemappingMap["8"] || "8", width: 1 },
                        { key: "9", label: keyRemappingMap["9"] || "9", width: 1 },
                        { key: "0", label: keyRemappingMap["0"] || "0", width: 1 },
                    ],
                    [
                        { key: "-", label: keyRemappingMap["-"] || "-", width: 1 },
                        { key: "/", label: keyRemappingMap["/"] || "/", width: 1 },
                        { key: ":", label: ":", width: 1 },
                        { key: ";", label: keyRemappingMap[";"] || ";", width: 1 },
                        { key: "(", label: "(", width: 1 },
                        { key: ")", label: ")", width: 1 },
                        { key: "$", label: "$", width: 1 },
                        { key: "&", label: "&", width: 1 },
                        { key: "@", label: "@", width: 1 },
                        { key: "\"", label: "\"", width: 1 },
                    ],
                    [
                        { key: "NumberToggle", label: "#+=", width: 1.5, isSpecial: true },
                        { key: ".", label: keyRemappingMap["."] || ".", width: 1 },
                        { key: ",", label: keyRemappingMap[","] || ",", width: 1 },
                        { key: "?", label: "?", width: 1 },
                        { key: "!", label: "!", width: 1 },
                        { key: "'", label: keyRemappingMap["'"] || "'", width: 1 },
                        { key: "\"", label: "\"", width: 1 },
                        { key: "|", label: "|", width: 1 },
                        { key: "_", label: "_", width: 1 },
                        { key: "Backspace", label: "⌫", width: 1.5, isSpecial: true },
                    ],
                    [
                        { key: "ABC", label: "ABC", width: 1.5, isSpecial: true },
                        { key: " ", label: "", width: 7 },
                        { key: "Enter", label: "↵", width: 1.5, isSpecial: true },
                    ],
                ]
            } else {
                return [
                    [
                        { key: "q", label: keyRemappingMap["q"] || (capsLock ? "Q" : "q"), width: 1 },
                        { key: "w", label: keyRemappingMap["w"] || (capsLock ? "W" : "w"), width: 1 },
                        { key: "e", label: keyRemappingMap["e"] || (capsLock ? "E" : "e"), width: 1 },
                        { key: "r", label: keyRemappingMap["r"] || (capsLock ? "R" : "r"), width: 1 },
                        { key: "t", label: keyRemappingMap["t"] || (capsLock ? "T" : "t"), width: 1 },
                        { key: "y", label: keyRemappingMap["y"] || (capsLock ? "Y" : "y"), width: 1 },
                        { key: "u", label: keyRemappingMap["u"] || (capsLock ? "U" : "u"), width: 1 },
                        { key: "i", label: keyRemappingMap["i"] || (capsLock ? "I" : "i"), width: 1 },
                        { key: "o", label: keyRemappingMap["o"] || (capsLock ? "O" : "o"), width: 1 },
                        { key: "p", label: keyRemappingMap["p"] || (capsLock ? "P" : "p"), width: 1 },
                    ],
                    [
                        { key: "a", label: keyRemappingMap["a"] || (capsLock ? "A" : "a"), width: 1 },
                        { key: "s", label: keyRemappingMap["s"] || (capsLock ? "S" : "s"), width: 1 },
                        { key: "d", label: keyRemappingMap["d"] || (capsLock ? "D" : "d"), width: 1 },
                        { key: "f", label: keyRemappingMap["f"] || (capsLock ? "F" : "f"), width: 1 },
                        { key: "g", label: keyRemappingMap["g"] || (capsLock ? "G" : "g"), width: 1 },
                        { key: "h", label: keyRemappingMap["h"] || (capsLock ? "H" : "h"), width: 1 },
                        { key: "j", label: keyRemappingMap["j"] || (capsLock ? "J" : "j"), width: 1 },
                        { key: "k", label: keyRemappingMap["k"] || (capsLock ? "K" : "k"), width: 1 },
                        { key: "l", label: keyRemappingMap["l"] || (capsLock ? "L" : "l"), width: 1 },
                    ],
                    [
                        { key: "CapsLock", label: capsLock ? "⇪" : "⇧", width: 1.5, active: capsLock, isSpecial: true },
                        { key: "z", label: keyRemappingMap["z"] || (capsLock ? "Z" : "z"), width: 1 },
                        { key: "x", label: keyRemappingMap["x"] || (capsLock ? "X" : "x"), width: 1 },
                        { key: "c", label: keyRemappingMap["c"] || (capsLock ? "C" : "c"), width: 1 },
                        { key: "v", label: keyRemappingMap["v"] || (capsLock ? "V" : "v"), width: 1 },
                        { key: "b", label: keyRemappingMap["b"] || (capsLock ? "B" : "b"), width: 1 },
                        { key: "n", label: keyRemappingMap["n"] || (capsLock ? "N" : "n"), width: 1 },
                        { key: "m", label: keyRemappingMap["m"] || (capsLock ? "M" : "m"), width: 1 },
                        { key: "Backspace", label: "⌫", width: 1.5, isSpecial: true },
                    ],
                    [
                        { key: "123", label: "123", width: 1.5, isSpecial: true },
                        { key: ",", label: keyRemappingMap[","] || ",", width: 1 },
                        { key: " ", label: "", width: 5 },
                        { key: ".", label: keyRemappingMap["."] || ".", width: 1 },
                        { key: "Enter", label: "↵", width: 1.5, isSpecial: true },
                    ],
                ]
            }
        } else if (keyboardVariant === "apple") {
            // Apple butterfly keyboard layout
            return [
                [
                    { key: "Escape", label: "esc", width: 1 },
                    { key: "F1", label: "F1", width: 1 },
                    { key: "F2", label: "F2", width: 1 },
                    { key: "F3", label: "F3", width: 1 },
                    { key: "F4", label: "F4", width: 1 },
                    { key: "F5", label: "F5", width: 1 },
                    { key: "F6", label: "F6", width: 1 },
                    { key: "F7", label: "F7", width: 1 },
                    { key: "F8", label: "F8", width: 1 },
                    { key: "F9", label: "F9", width: 1 },
                    { key: "F10", label: "F10", width: 1 },
                    { key: "F11", label: "F11", width: 1 },
                    { key: "F12", label: "F12", width: 1 },
                    { key: "Power", label: "⏻", width: 1 },
                ],
                [
                    { key: "`", label: keyRemappingMap["`"] || "`", width: 1 },
                    { key: "1", label: keyRemappingMap["1"] || "1", width: 1 },
                    { key: "2", label: keyRemappingMap["2"] || "2", width: 1 },
                    { key: "3", label: keyRemappingMap["3"] || "3", width: 1 },
                    { key: "4", label: keyRemappingMap["4"] || "4", width: 1 },
                    { key: "5", label: keyRemappingMap["5"] || "5", width: 1 },
                    { key: "6", label: keyRemappingMap["6"] || "6", width: 1 },
                    { key: "7", label: keyRemappingMap["7"] || "7", width: 1 },
                    { key: "8", label: keyRemappingMap["8"] || "8", width: 1 },
                    { key: "9", label: keyRemappingMap["9"] || "9", width: 1 },
                    { key: "0", label: keyRemappingMap["0"] || "0", width: 1 },
                    { key: "-", label: keyRemappingMap["-"] || "-", width: 1 },
                    { key: "=", label: keyRemappingMap["="] || "=", width: 1 },
                    { key: "Backspace", label: "delete", width: 1.5 },
                ],
                [
                    { key: "Tab", label: "tab", width: 1.5 },
                    { key: "q", label: keyRemappingMap["q"] || "q", width: 1 },
                    { key: "w", label: keyRemappingMap["w"] || "w", width: 1 },
                    { key: "e", label: keyRemappingMap["e"] || "e", width: 1 },
                    { key: "r", label: keyRemappingMap["r"] || "r", width: 1 },
                    { key: "t", label: keyRemappingMap["t"] || "t", width: 1 },
                    { key: "y", label: keyRemappingMap["y"] || "y", width: 1 },
                    { key: "u", label: keyRemappingMap["u"] || "u", width: 1 },
                    { key: "i", label: keyRemappingMap["i"] || "i", width: 1 },
                    { key: "o", label: keyRemappingMap["o"] || "o", width: 1 },
                    { key: "p", label: keyRemappingMap["p"] || "p", width: 1 },
                    { key: "[", label: keyRemappingMap["["] || "[", width: 1 },
                    { key: "]", label: keyRemappingMap["]"] || "]", width: 1 },
                    { key: "\\", label: keyRemappingMap["\\"] || "\\", width: 1.5 },
                ],
                [
                    { key: "CapsLock", label: "caps lock", width: 1.75, active: capsLock },
                    { key: "a", label: keyRemappingMap["a"] || "a", width: 1 },
                    { key: "s", label: keyRemappingMap["s"] || "s", width: 1 },
                    { key: "d", label: keyRemappingMap["d"] || "d", width: 1 },
                    { key: "f", label: keyRemappingMap["f"] || "f", width: 1 },
                    { key: "g", label: keyRemappingMap["g"] || "g", width: 1 },
                    { key: "h", label: keyRemappingMap["h"] || "h", width: 1 },
                    { key: "j", label: keyRemappingMap["j"] || "j", width: 1 },
                    { key: "k", label: keyRemappingMap["k"] || "k", width: 1 },
                    { key: "l", label: keyRemappingMap["l"] || "l", width: 1 },
                    { key: ";", label: keyRemappingMap[";"] || ";", width: 1 },
                    { key: "'", label: keyRemappingMap["'"] || "'", width: 1 },
                    { key: "Enter", label: "return", width: 2.25 },
                ],
                [
                    { key: "ShiftLeft", label: "shift", width: 2.25 },
                    { key: "z", label: keyRemappingMap["z"] || "z", width: 1 },
                    { key: "x", label: keyRemappingMap["x"] || "x", width: 1 },
                    { key: "c", label: keyRemappingMap["c"] || "c", width: 1 },
                    { key: "v", label: keyRemappingMap["v"] || "v", width: 1 },
                    { key: "b", label: keyRemappingMap["b"] || "b", width: 1 },
                    { key: "n", label: keyRemappingMap["n"] || "n", width: 1 },
                    { key: "m", label: keyRemappingMap["m"] || "m", width: 1 },
                    { key: ",", label: keyRemappingMap[","] || ",", width: 1 },
                    { key: ".", label: keyRemappingMap["."] || ".", width: 1 },
                    { key: "/", label: keyRemappingMap["/"] || "/", width: 1 },
                    { key: "ShiftRight", label: "shift", width: 2.75 },
                ],
                [
                    { key: "Fn", label: "fn", width: 1 },
                    { key: "ControlLeft", label: "⌃", width: 1 },
                    { key: "AltLeft", label: "option", width: 1 },
                    { key: "MetaLeft", label: <img src={appleKeyImage.src} alt={appleKeyImage.alt} style={{ width: "16px", height: "16px" }} />, width: 1.25 },
                    { key: " ", label: "", width: 5 },
                    { key: "MetaRight", label: <img src={appleKeyImage.src} alt={appleKeyImage.alt} style={{ width: "16px", height: "16px" }} />, width: 1.25 },
                    { key: "AltRight", label: "option", width: 1 },
                    { key: "ArrowLeft", label: "◀", width: 1 },
                    { key: "ArrowUp", label: "▲", width: 1 },
                    { key: "ArrowDown", label: "▼", width: 1 },
                    { key: "ArrowRight", label: "▶", width: 1 },
                ],
            ]
        } else {
            // Regular keyboard layout
            return [
                [
                    { key: "Escape", label: "Esc", width: 1, isSpecial: true },
                    { key: "F1", label: "F1", width: 1, isSpecial: true },
                    { key: "F2", label: "F2", width: 1, isSpecial: true },
                    { key: "F3", label: "F3", width: 1, isSpecial: true },
                    { key: "F4", label: "F4", width: 1, isSpecial: true },
                    { key: "F5", label: "F5", width: 1, isSpecial: true },
                    { key: "F6", label: "F6", width: 1, isSpecial: true },
                    { key: "F7", label: "F7", width: 1, isSpecial: true },
                    { key: "F8", label: "F8", width: 1, isSpecial: true },
                    { key: "F9", label: "F9", width: 1, isSpecial: true },
                    { key: "F10", label: "F10", width: 1, isSpecial: true },
                    { key: "F11", label: "F11", width: 1, isSpecial: true },
                    { key: "F12", label: "F12", width: 1, isSpecial: true },
                ],
                [
                    { key: "`", label: keyRemappingMap["`"] || "`", width: 1, isSpecial: true },
                    { key: "1", label: keyRemappingMap["1"] || "1", width: 1 },
                    { key: "2", label: keyRemappingMap["2"] || "2", width: 1 },
                    { key: "3", label: keyRemappingMap["3"] || "3", width: 1 },
                    { key: "4", label: keyRemappingMap["4"] || "4", width: 1 },
                    { key: "5", label: keyRemappingMap["5"] || "5", width: 1 },
                    { key: "6", label: keyRemappingMap["6"] || "6", width: 1 },
                    { key: "7", label: keyRemappingMap["7"] || "7", width: 1 },
                    { key: "8", label: keyRemappingMap["8"] || "8", width: 1 },
                    { key: "9", label: keyRemappingMap["9"] || "9", width: 1 },
                    { key: "0", label: keyRemappingMap["0"] || "0", width: 1 },
                    { key: "-", label: keyRemappingMap["-"] || "-", width: 1 },
                    { key: "=", label: keyRemappingMap["="] || "=", width: 1 },
                    { key: "Backspace", label: "⌫", width: 2, isSpecial: true },
                ],
                [
                    { key: "Tab", label: "Tab", width: 1.5, isSpecial: true },
                    { key: "q", label: keyRemappingMap["q"] || "Q", width: 1 },
                    { key: "w", label: keyRemappingMap["w"] || "W", width: 1 },
                    { key: "e", label: keyRemappingMap["e"] || "E", width: 1 },
                    { key: "r", label: keyRemappingMap["r"] || "R", width: 1 },
                    { key: "t", label: keyRemappingMap["t"] || "T", width: 1 },
                    { key: "y", label: keyRemappingMap["y"] || "Y", width: 1 },
                    { key: "u", label: keyRemappingMap["u"] || "U", width: 1 },
                    { key: "i", label: keyRemappingMap["i"] || "I", width: 1 },
                    { key: "o", label: keyRemappingMap["o"] || "O", width: 1 },
                    { key: "p", label: keyRemappingMap["p"] || "P", width: 1 },
                    { key: "[", label: keyRemappingMap["["] || "[", width: 1 },
                    { key: "]", label: keyRemappingMap["]"] || "]", width: 1 },
                    { key: "\\", label: keyRemappingMap["\\"] || "\\", width: 1.5 },
                ],
                [
                    { key: "CapsLock", label: "Caps", width: 1.75, active: capsLock, isSpecial: true },
                    { key: "a", label: keyRemappingMap["a"] || "A", width: 1 },
                    { key: "s", label: keyRemappingMap["s"] || "S", width: 1 },
                    { key: "d", label: keyRemappingMap["d"] || "D", width: 1 },
                    { key: "f", label: keyRemappingMap["f"] || "F", width: 1 },
                    { key: "g", label: keyRemappingMap["g"] || "G", width: 1 },
                    { key: "h", label: keyRemappingMap["h"] || "H", width: 1 },
                    { key: "j", label: keyRemappingMap["j"] || "J", width: 1 },
                    { key: "k", label: keyRemappingMap["k"] || "K", width: 1 },
                    { key: "l", label: keyRemappingMap["l"] || "L", width: 1 },
                    { key: ";", label: keyRemappingMap[";"] || ";", width: 1 },
                    { key: "'", label: keyRemappingMap["'"] || "'", width: 1 },
                    { key: "Enter", label: "Enter", width: 2.25, isSpecial: true },
                ],
                [
                    { key: "ShiftLeft", label: "Shift", width: 2.25, isSpecial: true },
                    { key: "z", label: keyRemappingMap["z"] || "Z", width: 1 },
                    { key: "x", label: keyRemappingMap["x"] || "X", width: 1 },
                    { key: "c", label: keyRemappingMap["c"] || "C", width: 1 },
                    { key: "v", label: keyRemappingMap["v"] || "V", width: 1 },
                    { key: "b", label: keyRemappingMap["b"] || "B", width: 1 },
                    { key: "n", label: keyRemappingMap["n"] || "N", width: 1 },
                    { key: "m", label: keyRemappingMap["m"] || "M", width: 1 },
                    { key: ",", label: keyRemappingMap[","] || ",", width: 1 },
                    { key: ".", label: keyRemappingMap["."] || ".", width: 1 },
                    { key: "/", label: keyRemappingMap["/"] || "/", width: 1 },
                    { key: "ShiftRight", label: "Shift", width: 2.75, isSpecial: true },
                ],
                [
                    { key: "ControlLeft", label: "Ctrl", width: 1.25, isSpecial: true },
                    { key: "MetaLeft", label: <img src={windowsKeyImage.src} alt={windowsKeyImage.alt} style={{ width: "16px", height: "16px" }} />, width: 1.25, isSpecial: true },
                    { key: "AltLeft", label: "Alt", width: 1.25, isSpecial: true },
                    { key: " ", label: "", width: 6.25 },
                    { key: "AltRight", label: "Alt", width: 1.25, isSpecial: true },
                    { key: "MetaRight", label: <img src={windowsKeyImage.src} alt={windowsKeyImage.alt} style={{ width: "16px", height: "16px" }} />, width: 1.25, isSpecial: true },
                    { key: "ContextMenu", label: "Menu", width: 1.25, isSpecial: true },
                    { key: "ControlRight", label: "Ctrl", width: 1.25, isSpecial: true },
                ],
            ]
        }
    }, [capsLock, windowsKeyImage, appleKeyImage, keyRemappingMap, keyboardVariant, showNumbers])

    // Define special keys list
    const specialKeys = useMemo(() => [
        "Escape", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Power",
        "Backspace", "Tab", "CapsLock", "Enter", "ShiftLeft", "ShiftRight", 
        "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "ContextMenu", "Fn"
    ], [])

    // Handle physical keyboard input - optimized
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        e.preventDefault()
        
        const key = e.code
        
        // Batch state updates
        startTransition(() => {
            setPressedKeys((prev) => {
                if (prev.has(key)) return prev
                const newSet = new Set(prev)
                newSet.add(key)
                return newSet
            })
            setLastPressedKey(key)
        })
        
        if (key === "CapsLock") {
            startTransition(() => setCapsLock((prev) => !prev))
            return
        }
        
        if (key === "Backspace") {
            startTransition(() => setText((prev) => prev.slice(0, -1)))
            return
        }
        
        if (key === "Enter") {
            startTransition(() => setText((prev) => prev + "\n"))
            return
        }
        
        if (key === "Space") {
            startTransition(() => setText((prev) => prev + " "))
            return
        }
        
        // Handle alphanumeric and special characters
        let char = e.key
        
        if (char.length === 1) {
            const remappedChar = keyRemappingMap[char.toLowerCase()]
            if (remappedChar) {
                char = remappedChar
            }
            startTransition(() => setText((prev) => prev + char))
        }
    }, [keyRemappingMap])

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        const key = e.code
        
        startTransition(() => {
            setPressedKeys((prev) => {
                if (!prev.has(key)) return prev
                const newSet = new Set(prev)
                newSet.delete(key)
                return newSet
            })
        })
    }, [])

    // Handle Windows key click
    const handleWindowsKeyClick = useCallback(() => {
        if (props.specialKeyLink) {
            if (typeof window !== "undefined") {
                window.open(props.specialKeyLink, "_blank");
            }
        }
    }, [props.specialKeyLink])

    // Handle on-screen keyboard clicks - optimized
    const handleKeyClick = useCallback((keyData: any) => {
        startTransition(() => setLastPressedKey(keyData.key))
        
        if (keyData.key === "CapsLock") {
            startTransition(() => setCapsLock((prev) => !prev))
            return
        }
        
        if (keyData.key === "Backspace") {
            startTransition(() => setText((prev) => prev.slice(0, -1)))
            return
        }
        
        if (keyData.key === "Enter") {
            startTransition(() => setText((prev) => prev + "\n"))
            return
        }
        
        if (keyData.key === " ") {
            startTransition(() => setText((prev) => prev + " "))
            return
        }
        
        // Skip function keys and modifier keys
        if (
            keyData.key.startsWith("F") ||
            keyData.key.includes("Shift") ||
            keyData.key.includes("Control") ||
            keyData.key.includes("Alt") ||
            keyData.key.includes("Meta") ||
            keyData.key.includes("Escape") ||
            keyData.key.includes("Tab") ||
            keyData.key.includes("ContextMenu")
        ) {
            return
        }
        
        // Handle regular keys
        let char = keyData.key
        if (char.length === 1) {
            const remappedChar = keyRemappingMap[char.toLowerCase()]
            if (remappedChar) {
                char = remappedChar
            }
            
            if (capsLock) {
                char = char.toUpperCase()
            }
            startTransition(() => setText((prev) => prev + char))
        }
    }, [capsLock, keyRemappingMap])

    // Set up keyboard event listeners
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.addEventListener("keydown", handleKeyDown)
            window.addEventListener("keyup", handleKeyUp)
            
            return () => {
                window.removeEventListener("keydown", handleKeyDown)
                window.removeEventListener("keyup", handleKeyUp)
            }
        }
    }, [handleKeyDown, handleKeyUp])

    // Blinking cursor effect - optimized to only run when needed
    useEffect(() => {
        if (!showTextPreview || typeof window === "undefined") {
            setShowCursor(true)
            return
        }
        
        const interval = setInterval(() => {
            startTransition(() => setShowCursor((prev) => !prev))
        }, 530)
        
        return () => clearInterval(interval)
    }, [showTextPreview])

    // Base key size
    const keySize = 40
    const keyGap = 4

    // Create a map of custom keycap images for quick lookup
    const customKeycapImageMap = useMemo(() => {
        const map: Record<string, { src: string, alt: string }> = {};
        customKeycapImages.forEach(item => {
            if (item.key && item.image && item.image.src) {
                map[item.key] = item.image;
            }
        });
        return map;
    }, [customKeycapImages]);

    // Memoize key rendering to avoid re-renders - optimized
    const renderKey = useCallback((keyData: any, rowIndex: number, keyIndex: number) => {
        const isPressed = pressedKeys.has(keyData.key)
        
        return (
            <KeyCap
                key={`key-${rowIndex}-${keyIndex}`}
                keyData={keyData}
                rowIndex={rowIndex}
                keyIndex={keyIndex}
                isPressed={isPressed}
                keySize={keySize}
                keyGap={keyGap}
                specialKeyboardColor={specialKeyboardColor}
                keyboardVariant={keyboardVariant}
                customKeycapImageMap={customKeycapImageMap}
                keyFont={keyFont}
                onMouseDown={() => {
                    startTransition(() => {
                        setPressedKeys((prev) => {
                            const newSet = new Set(prev)
                            newSet.add(keyData.key)
                            return newSet
                        })
                    })
                    
                    if ((keyData.key === "MetaLeft" || keyData.key === "MetaRight") && props.specialKeyLink) {
                        handleWindowsKeyClick();
                        return;
                    }
                    
                    handleKeyClick(keyData)
                }}
                onMouseUp={() => {
                    startTransition(() => {
                        setPressedKeys((prev) => {
                            const newSet = new Set(prev)
                            newSet.delete(keyData.key)
                            return newSet
                        })
                    })
                }}
                onMouseLeave={() => {
                    startTransition(() => {
                        setPressedKeys((prev) => {
                            const newSet = new Set(prev)
                            newSet.delete(keyData.key)
                            return newSet
                        })
                    })
                }}
            />
        )
    }, [pressedKeys, keyboardVariant, specialKeyboardColor, customKeycapImageMap, keyFont, props.specialKeyLink, handleWindowsKeyClick, handleKeyClick, keySize, keyGap])

    // Memoize the entire keyboard layout rendering
    const renderedKeyboard = useMemo(() => (
        <div
            style={{
                ...keyboardBaseStyle,
                backgroundColor: keyboardColor,
                gap: `${keyGap * 2}px`,
            }}
        >
            {keyboardLayout.map((row, rowIndex) => (
                <div
                    key={`row-${rowIndex}`}
                    style={{
                        display: "flex",
                        gap: `${keyGap}px`,
                    }}
                >
                    {row.map((keyData, keyIndex) => renderKey(keyData, rowIndex, keyIndex))}
                </div>
            ))}
        </div>
    ), [keyboardLayout, keyboardColor, keyGap, renderKey])

    return (
        <div
            ref={containerRef}
            style={{
                ...containerBaseStyle,
                backgroundColor: transparentBackground ? "transparent" : backgroundColor,
                ...props.style,
            }}
        >
            {/* Text Preview Display */}
            {showTextPreview && (
                <div
                    style={{
                        ...textPreviewBaseStyle,
                        color: textColor,
                    }}
                >
                    <div>
                        {text}
                        <span
                            style={{
                                display: "inline-block",
                                width: "2px",
                                height: "18px",
                                backgroundColor: textColor,
                                opacity: showCursor ? 1 : 0,
                                transition: "opacity 0.1s ease",
                                verticalAlign: "middle",
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Keyboard */}
            {renderedKeyboard}
            
            <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />
        </div>
    )
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
    color = color.replace(/^#/, '')
    
    let r = parseInt(color.substring(0, 2), 16)
    let g = parseInt(color.substring(2, 4), 16)
    let b = parseInt(color.substring(4, 6), 16)
    
    r = Math.max(0, Math.min(255, r + amount))
    g = Math.max(0, Math.min(255, g + amount))
    b = Math.max(0, Math.min(255, b + amount))
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

addPropertyControls(MechanicalKeyboard, {
    keyboardVariant: {
        type: ControlType.Enum,
        title: "Keyboard Type",
        options: ["regular", "apple", "mobile"],
        optionTitles: ["Regular", "Apple", "Mobile"],
        defaultValue: "regular",
        displaySegmentedControl: true,
    },
    specialKeyboardColor: {
        type: ControlType.Color,
        title: "Special Key Color",
        defaultValue: "#FFA500",
        hidden: ({ keyboardVariant }) => keyboardVariant !== "regular",
    },
    showTextPreview: {
        type: ControlType.Boolean,
        title: "Text Preview",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    keyboardColor: {
        type: ControlType.Color,
        title: "Keyboard Color",
        defaultValue: "#2a2a2a",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#121212",
    },
    transparentBackground: {
        type: ControlType.Boolean,
        title: "Transparent BG",
        defaultValue: false,
    },
    specialKeyLink: {
        type: ControlType.Link,
        title: "Special Key Link",
        defaultValue: "",
    },
    keyFont: {
        type: ControlType.Font,
        title: "Key Font",
        defaultValue: {
            fontSize: "14px",
            fontWeight: 700,
            fontFamily: "Helvetica, Arial, sans-serif",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    windowsKeyImage: {
        type: ControlType.ResponsiveImage,
        title: "Special Key",
    },
    appleKeyImage: {
        type: ControlType.ResponsiveImage,
        title: "Apple Key",
        hidden: ({ keyboardVariant }) => keyboardVariant !== "apple",
    },
    customKeycapImages: {
        type: ControlType.Array,
        title: "Custom Keycaps",
        control: {
            type: ControlType.Object,
            controls: {
                key: {
                    type: ControlType.String,
                    title: "Key",
                    defaultValue: "a",
                    placeholder: "Enter key (a, b, 1, etc.)",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        defaultValue: [],
    },
    keyRemappings: {
        type: ControlType.Array,
        title: "Key Remappings",
        control: {
            type: ControlType.Object,
            controls: {
                originalKey: {
                    type: ControlType.String,
                    title: "Original Key",
                    defaultValue: "a",
                    placeholder: "Enter key (a, b, 1, etc.)",
                },
                remappedTo: {
                    type: ControlType.String,
                    title: "Remap To",
                    defaultValue: "z",
                    placeholder: "Enter character or function",
                },
            },
        },
        defaultValue: [],
    },
})

// Move static styles outside component to prevent recreation
const containerBaseStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
}

const textPreviewBaseStyle: React.CSSProperties = {
    width: "80%",
    minHeight: "100px",
    maxHeight: "150px",
    backgroundColor: "#1a1a1a",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "20px",
    fontFamily: "'Fira Code', monospace",
    fontSize: "16px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
    display: "flex",
    alignItems: "flex-start",
}

const keyboardBaseStyle: React.CSSProperties = {
    borderRadius: "8px",
    padding: "15px",
    boxShadow: `
        0 2px 0 #1a1a1a,
        0 3px 0 #151515,
        0 4px 0 #101010,
        inset 0 1px 1px rgba(255, 255, 255, 0.1)
    `,
    display: "flex",
    flexDirection: "column",
}

// Memoized Key component to prevent unnecessary re-renders
const KeyCap = memo(({ 
    keyData, 
    rowIndex, 
    keyIndex, 
    isPressed, 
    keySize, 
    keyGap,
    specialKeyboardColor,
    keyboardVariant,
    customKeycapImageMap,
    keyFont,
    onMouseDown,
    onMouseUp,
    onMouseLeave
}: any) => {
    const isSpecial = keyData.isSpecial && keyboardVariant === "regular"
    const isActive = keyData.active
    
    const keyBaseColor = "#f5f5f5"
    const keyBottomColor = "#e0e0e0"
    
    const useSpecialColor = isSpecial

    return (
        <div
            style={{
                width: `${keyData.width * keySize + (keyData.width - 1) * keyGap}px`,
                height: keyData.height ? `${keyData.height * keySize + (keyData.height - 1) * keyGap}px` : `${keySize}px`,
                borderRadius: "4px",
                background: useSpecialColor
                    ? specialKeyboardColor
                    : `linear-gradient(to bottom, ${keyBaseColor}, ${keyBottomColor})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Arial', sans-serif",
                fontSize: "14px",
                fontWeight: "bold",
                color: useSpecialColor ? "#ffffff" : "#333",
                cursor: "pointer",
                userSelect: "none",
                boxShadow: isPressed ? 
                    `
                        0 1px 1px rgba(0, 0, 0, 0.3),
                        inset 0 1px 3px rgba(0, 0, 0, 0.2)
                    ` : 
                    `
                        0 2px 0 #bbb,
                        0 3px 2px rgba(0, 0, 0, 0.2),
                        0 4px 3px rgba(0, 0, 0, 0.1),
                        0 5px 4px rgba(0, 0, 0, 0.05),
                        inset 0 -1px 1px rgba(0, 0, 0, 0.1),
                        inset 0 1px 1px rgba(255, 255, 255, 0.6)
                    `,
                transform: isPressed ? "translateY(2px) scale(0.98)" : "translateY(0) scale(1)",
                transition: "transform 0.1s ease, box-shadow 0.1s ease",
                position: "relative",
                overflow: "hidden",
            }}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "4px",
                    boxShadow: "inset 0 6px 3px rgba(255, 255, 255, 0.4), inset 0 -1px 3px rgba(0, 0, 0, 0.15)",
                    pointerEvents: "none",
                }}
            />
            
            <span
                style={{
                    display: "inline-block",
                    transform: isPressed ? "translateY(1px)" : "translateY(0)",
                    transition: "transform 0.1s ease",
                    fontFamily: keyFont?.fontFamily || "Helvetica, Arial, sans-serif",
                    fontSize: keyFont?.fontSize || "14px",
                    fontWeight: keyFont?.fontWeight || "bold",
                    letterSpacing: keyFont?.letterSpacing,
                    lineHeight: keyFont?.lineHeight,
                    fontStyle: keyFont?.fontStyle,
                }}
            >
                {customKeycapImageMap[keyData.key] ? (
                    <img 
                        src={customKeycapImageMap[keyData.key].src} 
                        alt={customKeycapImageMap[keyData.key].alt || keyData.label.toString()} 
                        style={{ 
                            width: "24px", 
                            height: "24px", 
                            objectFit: "contain" 
                        }} 
                    />
                ) : (
                    keyData.label
                )}
            </span>
            
            {isActive && (
                <div
                    style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#fff",
                        boxShadow: "0 0 3px rgba(255, 255, 255, 0.8)",
                    }}
                />
            )}
        </div>
    )
})

KeyCap.displayName = "KeyCap"