import React, { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 160
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

// --- Color token unwrapper ---
const tok = (v: any) =>
    v && typeof v === "object" && "value" in v ? v.value : v

// --- Theme Presets ---
interface ThemeConfig {
    background: string
    borderColor: string
    glowColor: string
    textColor: string
    subTextColor: string
    cardBg: string
    accentColor: string
    pillBg: string
}

const THEMES: Record<string, ThemeConfig> = {
    obsidian: {
        background:
            "linear-gradient(135deg, rgba(18, 20, 29, 0.88) 0%, rgba(10, 11, 16, 0.96) 100%)",
        borderColor: "transparent",
        glowColor: "transparent",
        textColor: "#F8FAFC",
        subTextColor: "#94A3B8",
        cardBg: "rgba(255, 255, 255, 0.05)",
        accentColor: "#38BDF8",
        pillBg: "rgba(255, 255, 255, 0.08)",
    },
    midnight: {
        background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(3, 7, 18, 0.98) 100%)",
        borderColor: "transparent",
        glowColor: "transparent",
        textColor: "#FFFFFF",
        subTextColor: "#A5B4FC",
        cardBg: "rgba(99, 102, 241, 0.08)",
        accentColor: "#818CF8",
        pillBg: "rgba(99, 102, 241, 0.15)",
    },
    aurora: {
        background:
            "linear-gradient(135deg, rgba(6, 44, 48, 0.88) 0%, rgba(10, 25, 47, 0.96) 100%)",
        borderColor: "transparent",
        glowColor: "transparent",
        textColor: "#F0FDFA",
        subTextColor: "#99F6E4",
        cardBg: "rgba(45, 212, 191, 0.07)",
        accentColor: "#2DD4BF",
        pillBg: "rgba(45, 212, 191, 0.12)",
    },
    sunset: {
        background:
            "linear-gradient(135deg, rgba(46, 16, 28, 0.9) 0%, rgba(20, 10, 25, 0.98) 100%)",
        borderColor: "transparent",
        glowColor: "transparent",
        textColor: "#FFF1F2",
        subTextColor: "#FECDD3",
        cardBg: "rgba(251, 146, 60, 0.08)",
        accentColor: "#FB923C",
        pillBg: "rgba(251, 113, 133, 0.15)",
    },
    light: {
        background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(241, 245, 249, 0.98) 100%)",
        borderColor: "transparent",
        glowColor: "transparent",
        textColor: "#0F172A",
        subTextColor: "#64748B",
        cardBg: "rgba(0, 0, 0, 0.03)",
        accentColor: "#0284C7",
        pillBg: "rgba(0, 0, 0, 0.06)",
    },
}

// --- Weather Types & Global City Database ---
type WeatherType =
    | "sunny"
    | "partlyCloudy"
    | "rainy"
    | "thunder"
    | "snow"
    | "clearNight"

interface CityProfile {
    cityName: string
    countryName: string
    displayLabel: string
    timeZone: string
    tzName: string
    baseCondition: WeatherType
    nightCondition: WeatherType
    conditionText: string
    tempC: number
    feelsLikeC: number
    highC: number
    lowC: number
    humidity: number
    airQuality: "good" | "moderate" | "unhealthy"
    aqiValue: number
    windSpeed: string
    uvIndex: string
    hourlyPop: number[]
}

const CITY_DATABASE: Record<string, CityProfile> = {
    seoul: {
        cityName: "Seoul",
        countryName: "South Korea",
        displayLabel: "Seoul / South Korea",
        timeZone: "Asia/Seoul",
        tzName: "KST (GMT+9)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Partly Cloudy",
        tempC: 24,
        feelsLikeC: 25,
        highC: 27,
        lowC: 18,
        humidity: 62,
        airQuality: "good",
        aqiValue: 28,
        windSpeed: "3.2 m/s",
        uvIndex: "UV 3 Moderate",
        hourlyPop: [0, 10, 15, 20, 10, 0, 0],
    },
    tokyo: {
        cityName: "Tokyo",
        countryName: "Japan",
        displayLabel: "Tokyo / Japan",
        timeZone: "Asia/Tokyo",
        tzName: "JST (GMT+9)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Clear & Sunny",
        tempC: 26,
        feelsLikeC: 27,
        highC: 29,
        lowC: 20,
        humidity: 58,
        airQuality: "good",
        aqiValue: 22,
        windSpeed: "2.8 m/s",
        uvIndex: "UV 4 Moderate",
        hourlyPop: [0, 0, 5, 10, 5, 0, 0],
    },
    singapore: {
        cityName: "Singapore",
        countryName: "Singapore",
        displayLabel: "Singapore / Singapore",
        timeZone: "Asia/Singapore",
        tzName: "SGT (GMT+8)",
        baseCondition: "thunder",
        nightCondition: "rainy",
        conditionText: "Thunderstorm",
        tempC: 30,
        feelsLikeC: 35,
        highC: 32,
        lowC: 26,
        humidity: 88,
        airQuality: "moderate",
        aqiValue: 48,
        windSpeed: "2.5 m/s",
        uvIndex: "UV 8 Very High",
        hourlyPop: [80, 85, 60, 40, 20, 20, 15],
    },
    hongkong: {
        cityName: "Hong Kong",
        countryName: "Hong Kong",
        displayLabel: "Hong Kong / Hong Kong",
        timeZone: "Asia/Hong_Kong",
        tzName: "HKT (GMT+8)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Partly Cloudy",
        tempC: 29,
        feelsLikeC: 33,
        highC: 31,
        lowC: 25,
        humidity: 78,
        airQuality: "moderate",
        aqiValue: 45,
        windSpeed: "4.1 m/s",
        uvIndex: "UV 7 High",
        hourlyPop: [15, 20, 20, 10, 5, 0, 0],
    },
    bangkok: {
        cityName: "Bangkok",
        countryName: "Thailand",
        displayLabel: "Bangkok / Thailand",
        timeZone: "Asia/Bangkok",
        tzName: "ICT (GMT+7)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Hot & Humid",
        tempC: 33,
        feelsLikeC: 39,
        highC: 35,
        lowC: 28,
        humidity: 72,
        airQuality: "moderate",
        aqiValue: 55,
        windSpeed: "3.1 m/s",
        uvIndex: "UV 9 Very High",
        hourlyPop: [10, 20, 30, 20, 10, 5, 0],
    },
    taipei: {
        cityName: "Taipei",
        countryName: "Taiwan",
        displayLabel: "Taipei / Taiwan",
        timeZone: "Asia/Taipei",
        tzName: "CST (GMT+8)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Mostly Sunny",
        tempC: 28,
        feelsLikeC: 31,
        highC: 30,
        lowC: 23,
        humidity: 68,
        airQuality: "good",
        aqiValue: 32,
        windSpeed: "3.7 m/s",
        uvIndex: "UV 6 High",
        hourlyPop: [5, 10, 15, 10, 5, 0, 0],
    },
    dubai: {
        cityName: "Dubai",
        countryName: "UAE",
        displayLabel: "Dubai / UAE",
        timeZone: "Asia/Dubai",
        tzName: "GST (GMT+4)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Sunny & Warm",
        tempC: 36,
        feelsLikeC: 40,
        highC: 39,
        lowC: 30,
        humidity: 42,
        airQuality: "moderate",
        aqiValue: 65,
        windSpeed: "4.0 m/s",
        uvIndex: "UV 9 Very High",
        hourlyPop: [0, 0, 0, 0, 0, 0, 0],
    },
    mumbai: {
        cityName: "Mumbai",
        countryName: "India",
        displayLabel: "Mumbai / India",
        timeZone: "Asia/Kolkata",
        tzName: "IST (GMT+5:30)",
        baseCondition: "rainy",
        nightCondition: "rainy",
        conditionText: "Tropical Showers",
        tempC: 29,
        feelsLikeC: 34,
        highC: 31,
        lowC: 26,
        humidity: 84,
        airQuality: "moderate",
        aqiValue: 58,
        windSpeed: "4.5 m/s",
        uvIndex: "UV 6 High",
        hourlyPop: [60, 70, 75, 50, 40, 30, 20],
    },
    london: {
        cityName: "London",
        countryName: "UK",
        displayLabel: "London / UK",
        timeZone: "Europe/London",
        tzName: "BST (GMT+1)",
        baseCondition: "rainy",
        nightCondition: "rainy",
        conditionText: "Light Rain",
        tempC: 18,
        feelsLikeC: 17,
        highC: 21,
        lowC: 14,
        humidity: 82,
        airQuality: "good",
        aqiValue: 26,
        windSpeed: "4.8 m/s",
        uvIndex: "UV 2 Low",
        hourlyPop: [65, 70, 55, 40, 30, 20, 10],
    },
    paris: {
        cityName: "Paris",
        countryName: "France",
        displayLabel: "Paris / France",
        timeZone: "Europe/Paris",
        tzName: "CEST (GMT+2)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Clear & Sunny",
        tempC: 23,
        feelsLikeC: 23,
        highC: 26,
        lowC: 15,
        humidity: 48,
        airQuality: "good",
        aqiValue: 30,
        windSpeed: "3.4 m/s",
        uvIndex: "UV 4 Moderate",
        hourlyPop: [0, 5, 10, 5, 0, 0, 0],
    },
    berlin: {
        cityName: "Berlin",
        countryName: "Germany",
        displayLabel: "Berlin / Germany",
        timeZone: "Europe/Berlin",
        tzName: "CEST (GMT+2)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Partly Cloudy",
        tempC: 20,
        feelsLikeC: 20,
        highC: 23,
        lowC: 13,
        humidity: 55,
        airQuality: "good",
        aqiValue: 25,
        windSpeed: "3.8 m/s",
        uvIndex: "UV 3 Moderate",
        hourlyPop: [10, 20, 25, 15, 10, 5, 0],
    },
    rome: {
        cityName: "Rome",
        countryName: "Italy",
        displayLabel: "Rome / Italy",
        timeZone: "Europe/Rome",
        tzName: "CEST (GMT+2)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Sunny & Warm",
        tempC: 27,
        feelsLikeC: 28,
        highC: 30,
        lowC: 18,
        humidity: 45,
        airQuality: "good",
        aqiValue: 34,
        windSpeed: "2.9 m/s",
        uvIndex: "UV 6 High",
        hourlyPop: [0, 0, 0, 5, 0, 0, 0],
    },
    madrid: {
        cityName: "Madrid",
        countryName: "Spain",
        displayLabel: "Madrid / Spain",
        timeZone: "Europe/Madrid",
        tzName: "CEST (GMT+2)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Dry & Sunny",
        tempC: 29,
        feelsLikeC: 29,
        highC: 32,
        lowC: 19,
        humidity: 32,
        airQuality: "good",
        aqiValue: 28,
        windSpeed: "3.5 m/s",
        uvIndex: "UV 7 High",
        hourlyPop: [0, 0, 0, 0, 0, 0, 0],
    },
    amsterdam: {
        cityName: "Amsterdam",
        countryName: "Netherlands",
        displayLabel: "Amsterdam / Netherlands",
        timeZone: "Europe/Amsterdam",
        tzName: "CEST (GMT+2)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Breezy Clouds",
        tempC: 19,
        feelsLikeC: 18,
        highC: 22,
        lowC: 13,
        humidity: 68,
        airQuality: "good",
        aqiValue: 21,
        windSpeed: "5.8 m/s",
        uvIndex: "UV 3 Moderate",
        hourlyPop: [20, 25, 15, 10, 5, 0, 0],
    },
    zurich: {
        cityName: "Zurich",
        countryName: "Switzerland",
        displayLabel: "Zurich / Switzerland",
        timeZone: "Europe/Zurich",
        tzName: "CEST (GMT+2)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Alpine Fresh",
        tempC: 21,
        feelsLikeC: 21,
        highC: 24,
        lowC: 12,
        humidity: 52,
        airQuality: "good",
        aqiValue: 16,
        windSpeed: "2.7 m/s",
        uvIndex: "UV 5 Moderate",
        hourlyPop: [0, 5, 10, 5, 0, 0, 0],
    },
    stockholm: {
        cityName: "Stockholm",
        countryName: "Sweden",
        displayLabel: "Stockholm / Sweden",
        timeZone: "Europe/Stockholm",
        tzName: "CEST (GMT+2)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Cool & Crisp",
        tempC: 16,
        feelsLikeC: 15,
        highC: 19,
        lowC: 10,
        humidity: 59,
        airQuality: "good",
        aqiValue: 14,
        windSpeed: "4.2 m/s",
        uvIndex: "UV 2 Low",
        hourlyPop: [5, 10, 15, 10, 5, 0, 0],
    },
    newyork: {
        cityName: "New York",
        countryName: "USA",
        displayLabel: "New York / USA",
        timeZone: "America/New_York",
        tzName: "EDT (GMT-4)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Partly Cloudy",
        tempC: 21,
        feelsLikeC: 21,
        highC: 25,
        lowC: 16,
        humidity: 52,
        airQuality: "moderate",
        aqiValue: 42,
        windSpeed: "4.5 m/s",
        uvIndex: "UV 5 Moderate",
        hourlyPop: [10, 15, 20, 10, 0, 0, 5],
    },
    sanfrancisco: {
        cityName: "San Francisco",
        countryName: "USA",
        displayLabel: "San Francisco / USA",
        timeZone: "America/Los_Angeles",
        tzName: "PDT (GMT-7)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Coastal Breeze",
        tempC: 17,
        feelsLikeC: 16,
        highC: 20,
        lowC: 13,
        humidity: 74,
        airQuality: "good",
        aqiValue: 20,
        windSpeed: "6.2 m/s",
        uvIndex: "UV 4 Moderate",
        hourlyPop: [0, 0, 0, 5, 5, 0, 0],
    },
    losangeles: {
        cityName: "Los Angeles",
        countryName: "USA",
        displayLabel: "Los Angeles / USA",
        timeZone: "America/Los_Angeles",
        tzName: "PDT (GMT-7)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Sunny & Clear",
        tempC: 26,
        feelsLikeC: 26,
        highC: 29,
        lowC: 18,
        humidity: 46,
        airQuality: "moderate",
        aqiValue: 49,
        windSpeed: "3.4 m/s",
        uvIndex: "UV 7 High",
        hourlyPop: [0, 0, 0, 0, 0, 0, 0],
    },
    chicago: {
        cityName: "Chicago",
        countryName: "USA",
        displayLabel: "Chicago / USA",
        timeZone: "America/Chicago",
        tzName: "CDT (GMT-5)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Windy & Mild",
        tempC: 19,
        feelsLikeC: 18,
        highC: 23,
        lowC: 14,
        humidity: 56,
        airQuality: "good",
        aqiValue: 31,
        windSpeed: "7.1 m/s",
        uvIndex: "UV 4 Moderate",
        hourlyPop: [10, 15, 10, 5, 0, 0, 0],
    },
    miami: {
        cityName: "Miami",
        countryName: "USA",
        displayLabel: "Miami / USA",
        timeZone: "America/New_York",
        tzName: "EDT (GMT-4)",
        baseCondition: "thunder",
        nightCondition: "rainy",
        conditionText: "Tropical Thunder",
        tempC: 31,
        feelsLikeC: 37,
        highC: 33,
        lowC: 26,
        humidity: 80,
        airQuality: "good",
        aqiValue: 24,
        windSpeed: "5.2 m/s",
        uvIndex: "UV 8 Very High",
        hourlyPop: [70, 75, 50, 30, 20, 15, 10],
    },
    seattle: {
        cityName: "Seattle",
        countryName: "USA",
        displayLabel: "Seattle / USA",
        timeZone: "America/Los_Angeles",
        tzName: "PDT (GMT-7)",
        baseCondition: "rainy",
        nightCondition: "rainy",
        conditionText: "Drizzle & Fog",
        tempC: 17,
        feelsLikeC: 16,
        highC: 20,
        lowC: 12,
        humidity: 79,
        airQuality: "good",
        aqiValue: 18,
        windSpeed: "3.6 m/s",
        uvIndex: "UV 3 Moderate",
        hourlyPop: [60, 55, 45, 30, 20, 15, 10],
    },
    honolulu: {
        cityName: "Honolulu",
        countryName: "USA",
        displayLabel: "Honolulu / USA",
        timeZone: "Pacific/Honolulu",
        tzName: "HST (GMT-10)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Tropical Sunny",
        tempC: 28,
        feelsLikeC: 29,
        highC: 30,
        lowC: 23,
        humidity: 65,
        airQuality: "good",
        aqiValue: 15,
        windSpeed: "5.5 m/s",
        uvIndex: "UV 8 Very High",
        hourlyPop: [10, 15, 10, 5, 5, 0, 0],
    },
    toronto: {
        cityName: "Toronto",
        countryName: "Canada",
        displayLabel: "Toronto / Canada",
        timeZone: "America/Toronto",
        tzName: "EDT (GMT-4)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Pleasant",
        tempC: 21,
        feelsLikeC: 21,
        highC: 24,
        lowC: 15,
        humidity: 54,
        airQuality: "good",
        aqiValue: 24,
        windSpeed: "3.6 m/s",
        uvIndex: "UV 4 Moderate",
        hourlyPop: [5, 10, 10, 5, 0, 0, 0],
    },
    vancouver: {
        cityName: "Vancouver",
        countryName: "Canada",
        displayLabel: "Vancouver / Canada",
        timeZone: "America/Vancouver",
        tzName: "PDT (GMT-7)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Mild & Fresh",
        tempC: 18,
        feelsLikeC: 17,
        highC: 21,
        lowC: 13,
        humidity: 69,
        airQuality: "good",
        aqiValue: 17,
        windSpeed: "3.8 m/s",
        uvIndex: "UV 3 Moderate",
        hourlyPop: [15, 20, 15, 10, 5, 0, 0],
    },
    saopaulo: {
        cityName: "São Paulo",
        countryName: "Brazil",
        displayLabel: "São Paulo / Brazil",
        timeZone: "America/Sao_Paulo",
        tzName: "BRT (GMT-3)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Mild Clouds",
        tempC: 22,
        feelsLikeC: 22,
        highC: 26,
        lowC: 16,
        humidity: 64,
        airQuality: "moderate",
        aqiValue: 46,
        windSpeed: "4.2 m/s",
        uvIndex: "UV 6 High",
        hourlyPop: [20, 25, 20, 10, 5, 0, 0],
    },
    sydney: {
        cityName: "Sydney",
        countryName: "Australia",
        displayLabel: "Sydney / Australia",
        timeZone: "Australia/Sydney",
        tzName: "AEST (GMT+10)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Clear & Sunny",
        tempC: 22,
        feelsLikeC: 22,
        highC: 25,
        lowC: 15,
        humidity: 50,
        airQuality: "good",
        aqiValue: 18,
        windSpeed: "5.1 m/s",
        uvIndex: "UV 6 High",
        hourlyPop: [0, 0, 0, 0, 5, 0, 0],
    },
    melbourne: {
        cityName: "Melbourne",
        countryName: "Australia",
        displayLabel: "Melbourne / Australia",
        timeZone: "Australia/Melbourne",
        tzName: "AEST (GMT+10)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Breezy Sunny",
        tempC: 19,
        feelsLikeC: 18,
        highC: 22,
        lowC: 12,
        humidity: 55,
        airQuality: "good",
        aqiValue: 19,
        windSpeed: "5.8 m/s",
        uvIndex: "UV 5 Moderate",
        hourlyPop: [10, 15, 10, 5, 0, 0, 0],
    },
    auckland: {
        cityName: "Auckland",
        countryName: "New Zealand",
        displayLabel: "Auckland / New Zealand",
        timeZone: "Pacific/Auckland",
        tzName: "NZST (GMT+12)",
        baseCondition: "partlyCloudy",
        nightCondition: "clearNight",
        conditionText: "Maritime Mild",
        tempC: 17,
        feelsLikeC: 16,
        highC: 20,
        lowC: 11,
        humidity: 71,
        airQuality: "good",
        aqiValue: 12,
        windSpeed: "6.5 m/s",
        uvIndex: "UV 4 Moderate",
        hourlyPop: [20, 25, 20, 15, 10, 5, 0],
    },
    cairo: {
        cityName: "Cairo",
        countryName: "Egypt",
        displayLabel: "Cairo / Egypt",
        timeZone: "Africa/Cairo",
        tzName: "EEST (GMT+3)",
        baseCondition: "sunny",
        nightCondition: "clearNight",
        conditionText: "Hot & Clear",
        tempC: 34,
        feelsLikeC: 36,
        highC: 37,
        lowC: 25,
        humidity: 38,
        airQuality: "moderate",
        aqiValue: 62,
        windSpeed: "4.3 m/s",
        uvIndex: "UV 8 Very High",
        hourlyPop: [0, 0, 0, 0, 0, 0, 0],
    },
}

// Helper: Calculate city-specific time & date
function getCityTimeInfo(timeZone: string, now: Date) {
    try {
        const dtf = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "short",
            day: "2-digit",
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        })
        const parts = dtf.formatToParts(now)
        const map: Record<string, string> = {}
        for (const p of parts) {
            map[p.type] = p.value
        }

        const hours = parseInt(map.hour, 10) || 0
        const minutes = parseInt(map.minute, 10) || 0
        const seconds = parseInt(map.second, 10) || 0
        const dayName = (map.weekday || "THU").toUpperCase()
        const monthName = (map.month || "SEP").toUpperCase()
        const dayNum = map.day || "03"
        const ampm = hours >= 12 ? "PM" : "AM"
        const displayH = hours % 12 === 0 ? 12 : hours % 12

        const dayMap: Record<string, number> = {
            MON: 0,
            TUE: 1,
            WED: 2,
            THU: 3,
            FRI: 4,
            SAT: 5,
            SUN: 6,
        }
        const weekdayIdx = dayMap[dayName] ?? 3

        return {
            hours,
            minutes,
            seconds,
            displayH,
            ampm,
            dayName,
            monthName,
            dayNum,
            weekdayIdx,
            fullDate: `${dayName}, ${monthName} ${dayNum}`,
            timeStr: `${String(displayH).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
            fullTimeStr: `${String(displayH).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
            isNight: hours >= 19 || hours < 6,
        }
    } catch (e) {
        const h = now.getHours()
        const m = now.getMinutes()
        const s = now.getSeconds()
        return {
            hours: h,
            minutes: m,
            seconds: s,
            displayH: h % 12 === 0 ? 12 : h % 12,
            ampm: h >= 12 ? "PM" : "AM",
            dayName: "THU",
            monthName: "SEP",
            dayNum: "03",
            weekdayIdx: 3,
            fullDate: "THU, SEP 03",
            timeStr: `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
            fullTimeStr: `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
            isNight: h >= 19 || h < 6,
        }
    }
}

// --- Weather Animated SVG Icons ---
function WeatherIcon({
    type,
    size = 48,
    isStatic = false,
}: {
    type: WeatherType
    size?: number
    isStatic?: boolean
}) {
    switch (type) {
        case "sunny":
            return (
                <div
                    style={{
                        position: "relative",
                        width: size,
                        height: size,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <motion.svg
                        width={size}
                        height={size}
                        viewBox="0 0 100 100"
                        animate={isStatic ? undefined : { rotate: 360 }}
                        transition={{
                            duration: 24,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        style={{ position: "absolute", top: 0, left: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="sunRayGrad"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#FDE047" />
                                <stop offset="100%" stopColor="#F59E0B" />
                            </linearGradient>
                        </defs>
                        {[0, 45, 90, 135, 180, 225, 270, 315].map(
                            (angle, i) => (
                                <line
                                    key={i}
                                    x1="50"
                                    y1="12"
                                    x2="50"
                                    y2="22"
                                    stroke="url(#sunRayGrad)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    transform={`rotate(${angle} 50 50)`}
                                />
                            )
                        )}
                    </motion.svg>
                    <motion.div
                        animate={isStatic ? undefined : { scale: [1, 1.06, 1] }}
                        transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            width: size * 0.52,
                            height: size * 0.52,
                            borderRadius: "50%",
                            background:
                                "radial-gradient(circle at 35% 35%, #FEF08A 0%, #F59E0B 75%, #D97706 100%)",
                        }}
                    />
                </div>
            )

        case "partlyCloudy":
            return (
                <div
                    style={{
                        position: "relative",
                        width: size,
                        height: size,
                    }}
                >
                    <motion.div
                        animate={
                            isStatic
                                ? undefined
                                : {
                                      scale: [1, 1.08, 1],
                                      rotate: [0, 12, 0],
                                  }
                        }
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",
                            top: size * 0.08,
                            right: size * 0.12,
                            width: size * 0.44,
                            height: size * 0.44,
                            borderRadius: "50%",
                            background:
                                "radial-gradient(circle at 35% 35%, #FEF08A 0%, #F59E0B 80%)",
                        }}
                    />
                    <motion.svg
                        width={size * 0.88}
                        height={size * 0.65}
                        viewBox="0 0 70 50"
                        animate={
                            isStatic
                                ? undefined
                                : { x: [-2, 3, -2], y: [1, -2, 1] }
                        }
                        transition={{
                            duration: 4.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                        }}
                    >
                        <defs>
                            <linearGradient
                                id="cloudGrad"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#FFFFFF" />
                                <stop offset="100%" stopColor="#CBD5E1" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M20 44h34a14 14 0 0 0 3.5-27.5A18 18 0 0 0 23 18.5 12 12 0 0 0 20 44z"
                            fill="url(#cloudGrad)"
                        />
                    </motion.svg>
                </div>
            )

        case "rainy":
            return (
                <div
                    style={{
                        position: "relative",
                        width: size,
                        height: size,
                    }}
                >
                    <motion.svg
                        width={size * 0.85}
                        height={size * 0.6}
                        viewBox="0 0 70 50"
                        animate={isStatic ? undefined : { y: [-1, 1.5, -1] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: size * 0.08,
                        }}
                    >
                        <defs>
                            <linearGradient
                                id="rainCloudGrad"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#94A3B8" />
                                <stop offset="100%" stopColor="#475569" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M18 42h36a13 13 0 0 0 3-25.6A17 17 0 0 0 22 17a11 11 0 0 0-4 25z"
                            fill="url(#rainCloudGrad)"
                        />
                    </motion.svg>
                    <div
                        style={{
                            position: "absolute",
                            bottom: size * 0.05,
                            left: size * 0.2,
                            width: size * 0.6,
                            height: size * 0.35,
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        {[0, 0.2, 0.4].map((delay, idx) => (
                            <motion.div
                                key={idx}
                                animate={
                                    isStatic
                                        ? undefined
                                        : {
                                              y: [-4, 10],
                                              opacity: [0, 1, 0],
                                          }
                                }
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    delay,
                                    ease: "easeInOut",
                                }}
                                style={{
                                    width: 2.5,
                                    height: size * 0.22,
                                    background:
                                        "linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)",
                                    borderRadius: 4,
                                    transform: "rotate(18deg)",
                                }}
                            />
                        ))}
                    </div>
                </div>
            )

        case "thunder":
            return (
                <div
                    style={{
                        position: "relative",
                        width: size,
                        height: size,
                    }}
                >
                    <motion.svg
                        width={size * 0.85}
                        height={size * 0.6}
                        viewBox="0 0 70 50"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: size * 0.08,
                        }}
                    >
                        <defs>
                            <linearGradient
                                id="stormCloud"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#64748B" />
                                <stop offset="100%" stopColor="#1E293B" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M18 42h36a13 13 0 0 0 3-25.6A17 17 0 0 0 22 17a11 11 0 0 0-4 25z"
                            fill="url(#stormCloud)"
                        />
                    </motion.svg>
                    <motion.svg
                        width={size * 0.35}
                        height={size * 0.45}
                        viewBox="0 0 24 32"
                        animate={
                            isStatic
                                ? undefined
                                : {
                                      opacity: [0.2, 1, 0.3, 1, 0.1],
                                      scale: [0.95, 1.05, 0.98, 1.08, 0.95],
                                  }
                        }
                        transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            times: [0, 0.08, 0.16, 0.24, 1],
                        }}
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: size * 0.32,
                        }}
                    >
                        <path
                            d="M14 2L4 16h7l-3 14 12-16h-7l4-12z"
                            fill="#FACC15"
                            stroke="#FEF08A"
                            strokeWidth="0.8"
                        />
                    </motion.svg>
                </div>
            )

        case "snow":
            return (
                <div
                    style={{
                        position: "relative",
                        width: size,
                        height: size,
                    }}
                >
                    <motion.svg
                        width={size * 0.85}
                        height={size * 0.6}
                        viewBox="0 0 70 50"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: size * 0.08,
                        }}
                    >
                        <defs>
                            <linearGradient
                                id="snowCloud"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#F1F5F9" />
                                <stop offset="100%" stopColor="#94A3B8" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M18 42h36a13 13 0 0 0 3-25.6A17 17 0 0 0 22 17a11 11 0 0 0-4 25z"
                            fill="url(#snowCloud)"
                        />
                    </motion.svg>
                    {[0, 0.4, 0.8].map((delay, idx) => (
                        <motion.div
                            key={idx}
                            animate={
                                isStatic
                                    ? undefined
                                    : {
                                          y: [-2, 8],
                                          x: [-2, 2, -2],
                                          opacity: [0, 0.9, 0],
                                          rotate: [0, 180],
                                      }
                            }
                            transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                delay,
                                ease: "easeInOut",
                            }}
                            style={{
                                position: "absolute",
                                bottom: size * 0.06,
                                left: size * (0.25 + idx * 0.22),
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: "#FFFFFF",
                            }}
                        />
                    ))}
                </div>
            )

        case "clearNight":
        default:
            return (
                <div
                    style={{
                        position: "relative",
                        width: size,
                        height: size,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <motion.svg
                        width={size * 0.72}
                        height={size * 0.72}
                        viewBox="0 0 32 32"
                        animate={isStatic ? undefined : { rotate: [-4, 4, -4] }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <defs>
                            <linearGradient
                                id="moonGrad"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop offset="0%" stopColor="#FEF08A" />
                                <stop offset="100%" stopColor="#F59E0B" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M26 18.5C24.5 24 19 28 13 27 6.5 25.8 2 19.8 2.8 13.2 3.5 7.8 7.8 3.5 13.2 2.8c-2.4 3.4-2.2 8.1.5 11.2 2.8 3.2 7.6 4.1 11.5 2.2.3.8.5 1.5.8 2.3z"
                            fill="url(#moonGrad)"
                        />
                    </motion.svg>
                    <motion.div
                        animate={
                            isStatic
                                ? undefined
                                : {
                                      opacity: [0.2, 1, 0.2],
                                      scale: [0.8, 1.2, 0.8],
                                  }
                        }
                        transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",
                            top: size * 0.15,
                            right: size * 0.12,
                            width: 3.5,
                            height: 3.5,
                            borderRadius: "50%",
                            background: "#FEF08A",
                        }}
                    />
                    <motion.div
                        animate={
                            isStatic
                                ? undefined
                                : {
                                      opacity: [0.8, 0.1, 0.8],
                                      scale: [1.1, 0.7, 1.1],
                                  }
                        }
                        transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            delay: 0.6,
                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",
                            bottom: size * 0.22,
                            left: size * 0.1,
                            width: 3,
                            height: 3,
                            borderRadius: "50%",
                            background: "#BAE6FD",
                        }}
                    />
                </div>
            )
    }
}

// --- Mini Utility Icons ---
function MiniIcon({
    name,
    size = 15,
    color = "currentColor",
}: {
    name: string
    size?: number
    color?: string
}) {
    const style: React.CSSProperties = {
        flexShrink: 0,
        display: "inline-block",
    }
    switch (name) {
        case "droplet":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={style}
                >
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
            )
        case "wind":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={style}
                >
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
                </svg>
            )
        case "shield":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={style}
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
            )
        case "thermometer":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={style}
                >
                    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                </svg>
            )
        case "clock":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={style}
                >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            )
        case "calendar":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={style}
                >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            )
        case "sun":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={style}
                >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            )
        case "chevron-down":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={style}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            )
        case "chevron-up":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={style}
                >
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            )
        default:
            return null
    }
}

// --- Main Morphing Widget Props ---
interface MorphingClockWeatherProps {
    selectedCity?: string
    defaultState?: "compact" | "expanded"
    activeTab?: "weather" | "clock"
    tempUnit?: "°C" | "°F"
    themePreset?:
        | "obsidian"
        | "midnight"
        | "aurora"
        | "sunset"
        | "light"
        | "custom"
    accentColor?: string
    customBackground?: string
    customTextColor?: string
    borderRadius?: number
    blurAmount?: number
    stiffness?: number
    damping?: number
    mass?: number
    font?: {
        fontFamily?: string
        fontWeight?: number | string
        fontSize?: number
    }
    style?: React.CSSProperties
}

export default function MorphingClockWeatherWidget(
    props: MorphingClockWeatherProps
) {
    const {
        selectedCity = "newyork",
        defaultState = "compact",
        activeTab: initialTab = "weather",
        tempUnit = "°C",

        themePreset = "obsidian",
        accentColor: customAccent,
        customBackground,
        customTextColor,
        borderRadius = 24,
        blurAmount = 24,

        stiffness = 320,
        damping = 26,
        mass = 0.6,
        font,
        style,
    } = props

    const isStatic =
        useIsStaticRenderer() ||
        RenderTarget.current() === RenderTarget.thumbnail

    const [isClient, setIsClient] = useState(false)
    const [isExpanded, setIsExpanded] = useState(defaultState === "expanded")
    const [currentView, setCurrentView] = useState<"weather" | "clock">(
        initialTab
    )
    const [tabDirection, setTabDirection] = useState<1 | -1>(1)
    const [now, setNow] = useState(new Date())

    const hoverLeaveTimerRef = useRef<number | null>(null)

    useEffect(() => {
        setIsClient(true)
        if (isStatic) return

        const timer = setInterval(() => {
            setNow(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [isStatic])

    useEffect(() => {
        setIsExpanded(defaultState === "expanded")
    }, [defaultState])

    useEffect(() => {
        setCurrentView(initialTab)
    }, [initialTab])

    // Detect computer timezone if selectedCity is 'auto'
    const detectedCityKey = useMemo(() => {
        if (selectedCity === "auto" && typeof window !== "undefined") {
            try {
                const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
                const matchedKey = Object.keys(CITY_DATABASE).find(
                    (key) =>
                        CITY_DATABASE[key].timeZone.toLowerCase() ===
                        userTz.toLowerCase()
                )
                if (matchedKey) return matchedKey

                // Fallback by regional prefix match
                const region = userTz.split("/")[0]
                const fallbackMatch = Object.keys(CITY_DATABASE).find((key) =>
                    CITY_DATABASE[key].timeZone.startsWith(region)
                )
                return fallbackMatch || "newyork"
            } catch (e) {
                return "newyork"
            }
        }
        return selectedCity
    }, [selectedCity])

    // Get current city data profile
    const city = useMemo(() => {
        return CITY_DATABASE[detectedCityKey] || CITY_DATABASE.newyork
    }, [detectedCityKey])

    // City Time & Date calculated directly from timezone
    const timeInfo = useMemo(() => {
        return getCityTimeInfo(city.timeZone, now)
    }, [city.timeZone, now])

    // Dynamic Weather Condition
    const currentWeatherCondition = useMemo<WeatherType>(() => {
        if (
            timeInfo.isNight &&
            (city.baseCondition === "sunny" ||
                city.baseCondition === "partlyCloudy")
        ) {
            return city.nightCondition
        }
        return city.baseCondition
    }, [city, timeInfo.isNight])

    // Temperature Unit Conversion Helper
    const toUnit = (tempC: number) => {
        if (tempUnit === "°F") {
            return Math.round((tempC * 9) / 5 + 32)
        }
        return Math.round(tempC)
    }

    const currentTemp = toUnit(city.tempC)
    const currentFeelsLike = toUnit(city.feelsLikeC)
    const currentHigh = toUnit(city.highC)
    const currentLow = toUnit(city.lowC)

    // Theme calculation
    const theme = useMemo(() => {
        const base = THEMES[themePreset] || THEMES.obsidian
        return {
            background: customBackground
                ? tok(customBackground)
                : base.background,
            borderColor: "transparent",
            glowColor: "transparent",
            textColor: customTextColor ? tok(customTextColor) : base.textColor,
            subTextColor: base.subTextColor,
            cardBg: base.cardBg,
            accentColor: customAccent ? tok(customAccent) : base.accentColor,
            pillBg: base.pillBg,
        }
    }, [themePreset, customAccent, customBackground, customTextColor])

    // Hourly forecast generator
    const hourlyData = useMemo(() => {
        const curHour = timeInfo.hours
        const conditions: WeatherType[] = [
            "sunny",
            "partlyCloudy",
            "partlyCloudy",
            "rainy",
            "thunder",
            "partlyCloudy",
            "clearNight",
        ]
        return Array.from({ length: 7 }).map((_, i) => {
            const h = (curHour + i) % 24
            const ampm = h >= 12 ? "PM" : "AM"
            const displayH = h % 12 === 0 ? 12 : h % 12
            const tC = city.tempC + (i % 2 === 0 ? -1 : 1) * Math.min(i, 3)
            const isHNight = h >= 19 || h < 6
            let iconType = conditions[(i + curHour) % conditions.length]
            if (isHNight && iconType === "sunny") iconType = "clearNight"

            return {
                time: i === 0 ? "Now" : `${displayH} ${ampm}`,
                temp: toUnit(tC),
                icon: i === 0 ? currentWeatherCondition : iconType,
                pop: city.hourlyPop[i] ?? 0,
            }
        })
    }, [timeInfo.hours, city, currentWeatherCondition, tempUnit])

    // 모바일 터치 오작동을 차단하기 위한 Pointer-Type 기반 이벤트 제어
    const handlePointerEnter = (e: React.PointerEvent) => {
        if (isStatic || e.pointerType !== "mouse") return
        if (hoverLeaveTimerRef.current) {
            clearTimeout(hoverLeaveTimerRef.current)
            hoverLeaveTimerRef.current = null
        }
        setIsExpanded(true)
    }

    const handlePointerLeave = (e: React.PointerEvent) => {
        if (isStatic || e.pointerType !== "mouse") return
        hoverLeaveTimerRef.current = window.setTimeout(() => {
            if (defaultState === "compact") {
                setIsExpanded(false)
            }
        }, 300)
    }

    const handleClick = () => {
        setIsExpanded((prev) => !prev)
    }

    const aqiMeta = useMemo(() => {
        if (city.airQuality === "good")
            return { label: "Good", color: "#10B981" }
        if (city.airQuality === "moderate")
            return { label: "Moderate", color: "#F59E0B" }
        return { label: "Unhealthy", color: "#EF4444" }
    }, [city.airQuality])

    const springConfig = {
        type: "spring",
        stiffness,
        damping,
        mass,
    }

    const fontStyle: React.CSSProperties = {
        fontFamily:
            font?.fontFamily ||
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
        fontWeight: font?.fontWeight || 500,
    }

    return (
        <LayoutGroup id="morphing-weather-clock">
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: 1000,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    touchAction: "manipulation",
                    ...style,
                }}
            >
                <motion.div
                    layout
                    transition={springConfig}
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                    onClick={handleClick}
                    role="button"
                    tabIndex={0}
                    aria-label={`Weather and clock widget for ${city.displayLabel}. Current temperature: ${currentTemp}${tempUnit}, condition: ${city.conditionText}.`}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setIsExpanded((prev) => !prev)
                        }
                    }}
                    style={{
                        ...fontStyle,
                        position: "relative",
                        overflow: "hidden",
                        background: theme.background,
                        backdropFilter: `blur(${blurAmount}px) saturate(180%)`,
                        WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%)`,
                        border: "none",
                        borderRadius,
                        boxShadow: "none",
                        color: theme.textColor,
                        cursor: "pointer",
                        outline: "none",
                        width: isExpanded ? 360 : 320,
                        height: isExpanded ? "auto" : 110,
                        boxSizing: "border-box",
                        transition: "border-color 0.3s ease",
                        touchAction: "manipulation",
                    }}
                    whileHover={
                        isStatic
                            ? undefined
                            : {
                                  scale: isExpanded ? 1 : 1.02,
                              }
                    }
                    whileTap={isStatic ? undefined : { scale: 0.985 }}
                >
                    {/* Widget Content Area */}
                    <div
                        style={{
                            position: "relative",
                            zIndex: 1,
                            padding: isExpanded ? 20 : "13px 18px",
                            boxSizing: "border-box",
                        }}
                    >
                        {/* ================= COMPACT MODE ================= */}
                        {!isExpanded && (
                            <motion.div
                                key="compact-mode"
                                initial={
                                    isStatic ? false : { opacity: 0, y: -4 }
                                }
                                animate={{ opacity: 1, y: 0 }}
                                exit={
                                    isStatic
                                        ? undefined
                                        : { opacity: 0, scale: 0.95 }
                                }
                                transition={springConfig}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                    width: "100%",
                                }}
                            >
                                {/* Top Row: Left-City/Time + Right-Date pill */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <motion.div
                                        layoutId="widget-city-tag"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 5,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: theme.textColor,
                                            }}
                                        >
                                            {city.cityName}
                                        </span>
                                        <span
                                            style={{
                                                color: theme.subTextColor,
                                                opacity: 0.4,
                                                fontSize: 11,
                                            }}
                                        >
                                            •
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 500,
                                                color: theme.subTextColor,
                                            }}
                                        >
                                            {timeInfo.timeStr}
                                        </span>
                                    </motion.div>

                                    <motion.div
                                        layoutId="widget-date-pill"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 5,
                                            padding: "3px 8px",
                                            borderRadius: 7,
                                            backgroundColor: theme.pillBg,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: "0.04em",
                                            color: theme.accentColor,
                                            textTransform: "uppercase",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        <MiniIcon
                                            name="calendar"
                                            size={11}
                                            color={theme.accentColor}
                                        />
                                        <span>{timeInfo.fullDate}</span>
                                    </motion.div>
                                </div>

                                {/* Bottom Row: Left-aligned Icon + [Temp + Weather Condition] */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-start",
                                        gap: 12,
                                    }}
                                >
                                    {/* Left: Icon */}
                                    <motion.div
                                        layoutId="hero-weather-icon"
                                        style={{
                                            width: 52,
                                            height: 52,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <WeatherIcon
                                            type={currentWeatherCondition}
                                            size={52}
                                            isStatic={isStatic}
                                        />
                                    </motion.div>

                                    {/* Right: Left-aligned Temp & Condition */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-start",
                                            gap: 2,
                                        }}
                                    >
                                        <motion.div
                                            layoutId="hero-temperature"
                                            style={{
                                                fontSize: 32,
                                                fontWeight: 800,
                                                letterSpacing: "-0.05em",
                                                lineHeight: 1,
                                                color: theme.textColor,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {currentTemp}
                                            <span
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 600,
                                                    color: theme.accentColor,
                                                    marginLeft: 2,
                                                }}
                                            >
                                                {tempUnit}
                                            </span>
                                        </motion.div>
                                        <motion.div
                                            layoutId="hero-condition-sub"
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 500,
                                                color: theme.subTextColor,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {city.conditionText}
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ================= EXPANDED MODE ================= */}
                        {isExpanded && (
                            <motion.div
                                key="expanded-mode"
                                initial={
                                    isStatic
                                        ? false
                                        : { opacity: 0, scale: 0.96 }
                                }
                                animate={{ opacity: 1, scale: 1 }}
                                exit={
                                    isStatic
                                        ? undefined
                                        : { opacity: 0, scale: 0.94 }
                                }
                                transition={springConfig}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                {/* Top Header */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
                                        paddingBottom: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 2,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 7,
                                                    height: 7,
                                                    borderRadius: "50%",
                                                    backgroundColor: "#10B981",
                                                }}
                                            />
                                            <motion.span
                                                layoutId="widget-city-tag"
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    letterSpacing: "-0.01em",
                                                }}
                                            >
                                                {city.displayLabel}
                                            </motion.span>
                                        </div>
                                        <motion.div
                                            layoutId="widget-date-pill"
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: theme.subTextColor,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}
                                        >
                                            <MiniIcon
                                                name="calendar"
                                                size={11}
                                                color={theme.accentColor}
                                            />
                                            <span>{timeInfo.fullDate}</span>
                                        </motion.div>
                                    </div>

                                    {/* Tab Switcher */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            backgroundColor: theme.cardBg,
                                            padding: 3,
                                            borderRadius: 20,
                                            border: "none",
                                            gap: 2,
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {[
                                            {
                                                id: "weather",
                                                label: "Weather",
                                                icon: "sun",
                                            },
                                            {
                                                id: "clock",
                                                label: "Clock",
                                                icon: "clock",
                                            },
                                        ].map((tab) => {
                                            const active =
                                                currentView === tab.id
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        const goingForward =
                                                            tab.id === "clock"
                                                        setTabDirection(
                                                            goingForward
                                                                ? 1
                                                                : -1
                                                        )
                                                        setCurrentView(
                                                            tab.id as
                                                                | "weather"
                                                                | "clock"
                                                        )
                                                    }}
                                                    style={{
                                                        border: "none",
                                                        background: active
                                                            ? theme.accentColor
                                                            : "transparent",
                                                        color: active
                                                            ? "#FFFFFF"
                                                            : theme.subTextColor,
                                                        borderRadius: 16,
                                                        padding: "4px 11px",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        transition:
                                                            "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                                                        boxShadow: "none",
                                                        touchAction:
                                                            "manipulation",
                                                    }}
                                                >
                                                    <MiniIcon
                                                        name={tab.icon}
                                                        size={11}
                                                        color={
                                                            active
                                                                ? "#FFFFFF"
                                                                : theme.subTextColor
                                                        }
                                                    />
                                                    <span>{tab.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Main Tab Content Container (Height Alignment Fix) */}
                                <div
                                    style={{
                                        position: "relative",
                                        minHeight: 330,
                                        width: "100%",
                                    }}
                                >
                                    <AnimatePresence
                                        mode="wait"
                                        custom={tabDirection}
                                    >
                                        {/* --- 1. WEATHER VIEW --- */}
                                        {currentView === "weather" && (
                                            <motion.div
                                                key="weather-tab-panel"
                                                custom={tabDirection}
                                                initial={
                                                    isStatic
                                                        ? false
                                                        : (dir: number) => ({
                                                              opacity: 0,
                                                              x:
                                                                  dir < 0
                                                                      ? 40
                                                                      : -40,
                                                          })
                                                }
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={
                                                    isStatic
                                                        ? undefined
                                                        : (dir: number) => ({
                                                              opacity: 0,
                                                              x:
                                                                  dir < 0
                                                                      ? -40
                                                                      : 40,
                                                          })
                                                }
                                                transition={{
                                                    duration: 0.28,
                                                    ease: [0.32, 0.72, 0, 1],
                                                }}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 14,
                                                    width: "100%",
                                                }}
                                            >
                                                {/* Hero Weather Status Row */}
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "space-between",
                                                        padding: "4px 6px",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 14,
                                                        }}
                                                    >
                                                        <motion.div
                                                            layoutId="hero-weather-icon"
                                                            style={{
                                                                width: 56,
                                                                height: 56,
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <WeatherIcon
                                                                type={
                                                                    currentWeatherCondition
                                                                }
                                                                size={56}
                                                                isStatic={
                                                                    isStatic
                                                                }
                                                            />
                                                        </motion.div>

                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flexDirection:
                                                                    "column",
                                                            }}
                                                        >
                                                            <motion.div
                                                                layoutId="hero-temperature"
                                                                style={{
                                                                    fontSize: 34,
                                                                    fontWeight: 800,
                                                                    lineHeight: 1,
                                                                    letterSpacing:
                                                                        "-0.04em",
                                                                    color: theme.textColor,
                                                                }}
                                                            >
                                                                {currentTemp}
                                                                <span
                                                                    style={{
                                                                        fontSize: 20,
                                                                        fontWeight: 600,
                                                                        color: theme.accentColor,
                                                                        marginLeft: 2,
                                                                    }}
                                                                >
                                                                    {tempUnit}
                                                                </span>
                                                            </motion.div>
                                                            <motion.span
                                                                layoutId="hero-condition-sub"
                                                                style={{
                                                                    fontSize: 13,
                                                                    fontWeight: 600,
                                                                    color: theme.subTextColor,
                                                                    marginTop: 4,
                                                                }}
                                                            >
                                                                {
                                                                    city.conditionText
                                                                }
                                                            </motion.span>
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            alignItems:
                                                                "flex-end",
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                padding:
                                                                    "4px 8px",
                                                                borderRadius: 8,
                                                                backgroundColor:
                                                                    theme.cardBg,
                                                                border: "none",
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                                color: theme.subTextColor,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    color: "#F87171",
                                                                }}
                                                            >
                                                                H: {currentHigh}
                                                                °
                                                            </span>{" "}
                                                            <span
                                                                style={{
                                                                    color: "#38BDF8",
                                                                }}
                                                            >
                                                                L: {currentLow}°
                                                            </span>
                                                        </div>
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                color: theme.subTextColor,
                                                            }}
                                                        >
                                                            Feels like{" "}
                                                            {currentFeelsLike}
                                                            {tempUnit}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 4-Metric Grid */}
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "repeat(2, 1fr)",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            background:
                                                                theme.cardBg,
                                                            border: "none",
                                                            borderRadius: 14,
                                                            padding:
                                                                "10px 12px",
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "space-between",
                                                                color: theme.subTextColor,
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 4,
                                                                }}
                                                            >
                                                                <MiniIcon
                                                                    name="droplet"
                                                                    size={13}
                                                                    color="#38BDF8"
                                                                />
                                                                Humidity
                                                            </span>
                                                            <span
                                                                style={{
                                                                    color: theme.textColor,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {city.humidity}%
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: "100%",
                                                                height: 4,
                                                                borderRadius: 4,
                                                                backgroundColor:
                                                                    "rgba(255,255,255,0.1)",
                                                                overflow:
                                                                    "hidden",
                                                            }}
                                                        >
                                                            <motion.div
                                                                initial={
                                                                    isStatic
                                                                        ? false
                                                                        : {
                                                                              width: 0,
                                                                          }
                                                                }
                                                                animate={{
                                                                    width: `${city.humidity}%`,
                                                                }}
                                                                transition={{
                                                                    duration: 0.8,
                                                                    ease: "easeOut",
                                                                }}
                                                                style={{
                                                                    height: "100%",
                                                                    background:
                                                                        "linear-gradient(90deg, #38BDF8, #0284C7)",
                                                                    borderRadius: 4,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            background:
                                                                theme.cardBg,
                                                            border: "none",
                                                            borderRadius: 14,
                                                            padding:
                                                                "10px 12px",
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "space-between",
                                                                color: theme.subTextColor,
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 4,
                                                                }}
                                                            >
                                                                <MiniIcon
                                                                    name="shield"
                                                                    size={13}
                                                                    color={
                                                                        aqiMeta.color
                                                                    }
                                                                />
                                                                Air Quality
                                                            </span>
                                                            <span
                                                                style={{
                                                                    color: aqiMeta.color,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {city.aqiValue}
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 4,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    padding:
                                                                        "2px 6px",
                                                                    borderRadius: 6,
                                                                    backgroundColor: `${aqiMeta.color}22`,
                                                                    color: aqiMeta.color,
                                                                }}
                                                            >
                                                                {aqiMeta.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            background:
                                                                theme.cardBg,
                                                            border: "none",
                                                            borderRadius: 14,
                                                            padding:
                                                                "10px 12px",
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: 2,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 4,
                                                                color: theme.subTextColor,
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            <MiniIcon
                                                                name="thermometer"
                                                                size={13}
                                                                color="#FB923C"
                                                            />
                                                            Feels Like
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 14,
                                                                fontWeight: 700,
                                                                color: theme.textColor,
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {currentFeelsLike}
                                                            {tempUnit}
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            background:
                                                                theme.cardBg,
                                                            border: "none",
                                                            borderRadius: 14,
                                                            padding:
                                                                "10px 12px",
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: 2,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 4,
                                                                color: theme.subTextColor,
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            <MiniIcon
                                                                name="wind"
                                                                size={13}
                                                                color="#A78BFA"
                                                            />
                                                            Wind & UV
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 13,
                                                                fontWeight: 700,
                                                                color: theme.textColor,
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {city.windSpeed}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Hourly Forecast Carousel */}
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 6,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            color: theme.subTextColor,
                                                            letterSpacing:
                                                                "0.04em",
                                                            textTransform:
                                                                "uppercase",
                                                        }}
                                                    >
                                                        Hourly Forecast
                                                    </span>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: 8,
                                                            overflowX: "auto",
                                                            overflowY: "hidden",
                                                            padding:
                                                                "6px 4px 10px 4px",
                                                            margin: "-4px -4px 0 -4px",
                                                            scrollbarWidth:
                                                                "none",
                                                            WebkitOverflowScrolling:
                                                                "touch",
                                                        }}
                                                    >
                                                        {hourlyData.map(
                                                            (item, idx) => (
                                                                <motion.div
                                                                    key={idx}
                                                                    whileHover={
                                                                        isStatic
                                                                            ? undefined
                                                                            : {
                                                                                  y: -2,
                                                                                  scale: 1.04,
                                                                              }
                                                                    }
                                                                    transition={{
                                                                        duration: 0.2,
                                                                    }}
                                                                    style={{
                                                                        flex: "0 0 auto",
                                                                        minWidth: 52,
                                                                        padding:
                                                                            "8px 6px",
                                                                        borderRadius: 12,
                                                                        backgroundColor:
                                                                            idx ===
                                                                            0
                                                                                ? theme.pillBg
                                                                                : theme.cardBg,
                                                                        border: "none",
                                                                        display:
                                                                            "flex",
                                                                        flexDirection:
                                                                            "column",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: 4,
                                                                        cursor: "pointer",
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            fontSize: 10,
                                                                            fontWeight:
                                                                                idx ===
                                                                                0
                                                                                    ? 800
                                                                                    : 600,
                                                                            color:
                                                                                idx ===
                                                                                0
                                                                                    ? theme.accentColor
                                                                                    : theme.subTextColor,
                                                                        }}
                                                                    >
                                                                        {
                                                                            item.time
                                                                        }
                                                                    </span>
                                                                    <WeatherIcon
                                                                        type={
                                                                            item.icon
                                                                        }
                                                                        size={
                                                                            22
                                                                        }
                                                                        isStatic={
                                                                            isStatic
                                                                        }
                                                                    />
                                                                    <span
                                                                        style={{
                                                                            fontSize: 11,
                                                                            fontWeight: 700,
                                                                            color: theme.textColor,
                                                                        }}
                                                                    >
                                                                        {
                                                                            item.temp
                                                                        }
                                                                        °
                                                                    </span>
                                                                </motion.div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* --- 2. CLOCK VIEW --- */}
                                        {currentView === "clock" && (
                                            <motion.div
                                                key="clock-tab-panel"
                                                custom={tabDirection}
                                                initial={
                                                    isStatic
                                                        ? false
                                                        : (dir: number) => ({
                                                              opacity: 0,
                                                              x:
                                                                  dir > 0
                                                                      ? 40
                                                                      : -40,
                                                          })
                                                }
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={
                                                    isStatic
                                                        ? undefined
                                                        : (dir: number) => ({
                                                              opacity: 0,
                                                              x:
                                                                  dir > 0
                                                                      ? -40
                                                                      : 40,
                                                          })
                                                }
                                                transition={{
                                                    duration: 0.28,
                                                    ease: [0.32, 0.72, 0, 1],
                                                }}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 14,
                                                    width: "100%",
                                                    height: "100%",
                                                    justifyContent:
                                                        "space-between",
                                                }}
                                            >
                                                {/* Digital Clock Header */}
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        padding: "12px 0 8px",
                                                        gap: 4,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: 52,
                                                            fontWeight: 800,
                                                            letterSpacing:
                                                                "-0.04em",
                                                            lineHeight: 1,
                                                            color: theme.textColor,
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {timeInfo.timeStr}
                                                        <span
                                                            style={{
                                                                fontSize: 20,
                                                                fontWeight: 700,
                                                                color: theme.accentColor,
                                                                marginLeft: 6,
                                                            }}
                                                        >
                                                            {timeInfo.ampm}
                                                        </span>
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            color: theme.subTextColor,
                                                            letterSpacing:
                                                                "0.02em",
                                                        }}
                                                    >
                                                        {city.cityName} ·{" "}
                                                        {city.tzName}
                                                    </span>
                                                </div>

                                                {/* Monthly Mini Calendar */}
                                                {(() => {
                                                    const todayDay = parseInt(
                                                        timeInfo.dayNum,
                                                        10
                                                    )
                                                    const monthNames = [
                                                        "Jan",
                                                        "Feb",
                                                        "Mar",
                                                        "Apr",
                                                        "May",
                                                        "Jun",
                                                        "Jul",
                                                        "Aug",
                                                        "Sep",
                                                        "Oct",
                                                        "Nov",
                                                        "Dec",
                                                    ]
                                                    const tzDate = new Date(
                                                        now.toLocaleString(
                                                            "en-US",
                                                            {
                                                                timeZone:
                                                                    city.timeZone,
                                                            }
                                                        )
                                                    )
                                                    const year =
                                                        tzDate.getFullYear()
                                                    const month =
                                                        tzDate.getMonth()
                                                    const daysInMonth =
                                                        new Date(
                                                            year,
                                                            month + 1,
                                                            0
                                                        ).getDate()
                                                    const firstDow = new Date(
                                                        year,
                                                        month,
                                                        1
                                                    ).getDay()
                                                    const startOffset =
                                                        (firstDow + 6) % 7
                                                    const totalCells =
                                                        Math.ceil(
                                                            (startOffset +
                                                                daysInMonth) /
                                                                7
                                                        ) * 7
                                                    const cells = Array.from(
                                                        { length: totalCells },
                                                        (_, i) => {
                                                            const d =
                                                                i -
                                                                startOffset +
                                                                1
                                                            return d >= 1 &&
                                                                d <= daysInMonth
                                                                ? d
                                                                : null
                                                        }
                                                    )
                                                    return (
                                                        <div
                                                            style={{
                                                                background:
                                                                    theme.cardBg,
                                                                border: "none",
                                                                borderRadius: 16,
                                                                padding: "14px",
                                                                display: "flex",
                                                                flexDirection:
                                                                    "column",
                                                                gap: 10,
                                                                flexGrow: 1,
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    justifyContent:
                                                                        "space-between",
                                                                    alignItems:
                                                                        "center",
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        fontSize: 12,
                                                                        fontWeight: 700,
                                                                        color: theme.textColor,
                                                                    }}
                                                                >
                                                                    {
                                                                        monthNames[
                                                                            month
                                                                        ]
                                                                    }{" "}
                                                                    {year}
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        fontSize: 11,
                                                                        fontWeight: 600,
                                                                        color: theme.accentColor,
                                                                        padding:
                                                                            "2px 7px",
                                                                        borderRadius: 6,
                                                                        backgroundColor: `${theme.accentColor}18`,
                                                                    }}
                                                                >
                                                                    Today{" "}
                                                                    {todayDay}
                                                                </span>
                                                            </div>

                                                            <div
                                                                style={{
                                                                    display:
                                                                        "grid",
                                                                    gridTemplateColumns:
                                                                        "repeat(7, 1fr)",
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            >
                                                                {[
                                                                    "M",
                                                                    "T",
                                                                    "W",
                                                                    "T",
                                                                    "F",
                                                                    "S",
                                                                    "S",
                                                                ].map(
                                                                    (d, i) => (
                                                                        <span
                                                                            key={
                                                                                i
                                                                            }
                                                                            style={{
                                                                                fontSize: 10,
                                                                                fontWeight: 700,
                                                                                color:
                                                                                    i >=
                                                                                    5
                                                                                        ? theme.accentColor
                                                                                        : theme.subTextColor,
                                                                                opacity:
                                                                                    i >=
                                                                                    5
                                                                                        ? 0.7
                                                                                        : 0.6,
                                                                                paddingBottom: 4,
                                                                            }}
                                                                        >
                                                                            {d}
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>

                                                            <div
                                                                style={{
                                                                    display:
                                                                        "grid",
                                                                    gridTemplateColumns:
                                                                        "repeat(7, 1fr)",
                                                                    gap: "4px 0",
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            >
                                                                {cells.map(
                                                                    (d, i) => {
                                                                        const isToday =
                                                                            d ===
                                                                            todayDay
                                                                        const isWeekend =
                                                                            i %
                                                                                7 >=
                                                                            5
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    i
                                                                                }
                                                                                style={{
                                                                                    width: 24,
                                                                                    height: 24,
                                                                                    margin: "0 auto",
                                                                                    display:
                                                                                        "flex",
                                                                                    alignItems:
                                                                                        "center",
                                                                                    justifyContent:
                                                                                        "center",
                                                                                    borderRadius:
                                                                                        "50%",
                                                                                    fontSize: 11,
                                                                                    fontWeight:
                                                                                        isToday
                                                                                            ? 800
                                                                                            : 400,
                                                                                    backgroundColor:
                                                                                        isToday
                                                                                            ? theme.accentColor
                                                                                            : "transparent",
                                                                                    color: isToday
                                                                                        ? "#FFFFFF"
                                                                                        : d ===
                                                                                            null
                                                                                          ? "transparent"
                                                                                          : isWeekend
                                                                                            ? `${theme.accentColor}99`
                                                                                            : theme.subTextColor,
                                                                                }}
                                                                            >
                                                                                {d ??
                                                                                    ""}
                                                                            </div>
                                                                        )
                                                                    }
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Collapse Hint */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 4,
                                        fontSize: 11,
                                        color: theme.subTextColor,
                                        opacity: 0.7,
                                        paddingTop: 4,
                                    }}
                                >
                                    <span>Click to collapse</span>
                                    <MiniIcon
                                        name="chevron-up"
                                        size={12}
                                        color={theme.subTextColor}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </LayoutGroup>
    )
}

// --- Framer Default Props ---
MorphingClockWeatherWidget.defaultProps = {
    selectedCity: "newyork",
    defaultState: "compact",
    activeTab: "weather",
    tempUnit: "°C",
    themePreset: "obsidian",
    borderRadius: 24,
    blurAmount: 24,
    stiffness: 320,
    damping: 26,
    mass: 0.6,
    font: {
        fontFamily: "Inter",
        fontWeight: 500,
        fontSize: 14,
    },
}

// --- Framer Property Controls ---
addPropertyControls(MorphingClockWeatherWidget, {
    selectedCity: {
        type: ControlType.Enum,
        title: "City",
        defaultValue: "newyork",
        options: [
            "auto",
            "newyork",
            "seoul",
            "tokyo",
            "singapore",
            "hongkong",
            "bangkok",
            "taipei",
            "dubai",
            "mumbai",
            "london",
            "paris",
            "berlin",
            "rome",
            "madrid",
            "amsterdam",
            "zurich",
            "stockholm",
            "sanfrancisco",
            "losangeles",
            "chicago",
            "miami",
            "seattle",
            "honolulu",
            "toronto",
            "vancouver",
            "saopaulo",
            "sydney",
            "melbourne",
            "auckland",
            "cairo",
        ],
        optionTitles: [
            "Auto Detect (System)",
            "New York / USA",
            "Seoul / South Korea",
            "Tokyo / Japan",
            "Singapore / Singapore",
            "Hong Kong / Hong Kong",
            "Bangkok / Thailand",
            "Taipei / Taiwan",
            "Dubai / UAE",
            "Mumbai / India",
            "London / UK",
            "Paris / France",
            "Berlin / Germany",
            "Rome / Italy",
            "Madrid / Spain",
            "Amsterdam / Netherlands",
            "Zurich / Switzerland",
            "Stockholm / Sweden",
            "San Francisco / USA",
            "Los Angeles / USA",
            "Chicago / USA",
            "Miami / USA",
            "Seattle / USA",
            "Honolulu / USA",
            "Toronto / Canada",
            "Vancouver / Canada",
            "São Paulo / Brazil",
            "Sydney / Australia",
            "Melbourne / Australia",
            "Auckland / New Zealand",
            "Cairo / Egypt",
        ],
    },
    tempUnit: {
        type: ControlType.Enum,
        title: "Unit",
        defaultValue: "°C",
        options: ["°C", "°F"],
        optionTitles: ["°C", "°F"],
        displaySegmentedControl: true,
    },
    defaultState: {
        type: ControlType.Enum,
        title: "Initial State",
        defaultValue: "compact",
        options: ["compact", "expanded"],
        optionTitles: ["Compact", "Expanded"],
        displaySegmentedControl: true,
    },
    activeTab: {
        type: ControlType.Enum,
        title: "Default View",
        defaultValue: "weather",
        options: ["weather", "clock"],
        optionTitles: ["Weather", "Clock"],
        displaySegmentedControl: true,
    },
    themePreset: {
        type: ControlType.Enum,
        title: "Theme",
        defaultValue: "obsidian",
        options: [
            "obsidian",
            "midnight",
            "aurora",
            "sunset",
            "light",
            "custom",
        ],
        optionTitles: [
            "Obsidian Glass",
            "Midnight Blue",
            "Aurora Emerald",
            "Sunset Glow",
            "Clean Light",
            "Custom",
        ],
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#38BDF8",
        hidden: (props) => props.themePreset !== "custom",
    },
    customBackground: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(18, 20, 29, 0.88)",
        hidden: (props) => props.themePreset !== "custom",
    },
    customTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#F8FAFC",
        hidden: (props) => props.themePreset !== "custom",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 24,
        min: 0,
        max: 36,
        unit: "px",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Backdrop Blur",
        defaultValue: 24,
        min: 0,
        max: 50,
        unit: "px",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 320,
        min: 50,
        max: 600,
        step: 10,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 26,
        min: 5,
        max: 60,
        step: 1,
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 14,
        },
    },
})
